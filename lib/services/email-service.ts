import { prisma } from "@/lib/prisma";
import { EmailType } from "@/app/generated/prisma/client";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/crypto";

export const DEFAULT_TEMPLATES: Record<EmailType, { subject: string; body: string }> = {
  WELCOME: {
    subject: "Welcome to {{instituteName}}!",
    body: "Hi {{studentName}},\n\nWelcome to {{instituteName}}! We are thrilled to have you join our platform. Explore courses and start learning today.\n\nBest regards,\nThe {{instituteName}} Team\n\n© {{currentYear}} {{instituteName}}",
  },
  COURSE_ENROLLMENT: {
    subject: "Enrollment Confirmed: {{courseName}}",
    body: "Hi {{studentName}},\n\nYou have been successfully enrolled in the course: {{courseName}}.\n\nLog in to your dashboard to view course materials and start your learning journey.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  ASSIGNMENT_CREATED: {
    subject: "New Assignment: {{assignmentName}}",
    body: "Hi {{studentName}},\n\nA new assignment has been created for your course: {{assignmentName}}.\n\nPlease check the dashboard for instructions and due dates.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  ASSIGNMENT_REMINDER: {
    subject: "Reminder: Assignment {{assignmentName}} is due soon",
    body: "Hi {{studentName}},\n\nThis is a friendly reminder that your assignment '{{assignmentName}}' is due soon.\n\nPlease review and submit your work before the deadline.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  QUIZ_PUBLISHED: {
    subject: "New Quiz Available: {{quizName}}",
    body: "Hi {{studentName}},\n\nA new quiz has been published: {{quizName}}.\n\nYou can access and attempt this quiz directly from your student portal.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  QUIZ_REMINDER: {
    subject: "Reminder: Quiz {{quizName}} is pending",
    body: "Hi {{studentName}},\n\nThis is a reminder that you have a pending quiz: {{quizName}}.\n\nPlease attempt it at your earliest convenience.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  CERTIFICATE_ISSUED: {
    subject: "Congratulations! Your Certificate is Issued",
    body: "Hi {{studentName}},\n\nCongratulations on completing your course requirements! Your certificate (ID: {{certificateId}}) has been successfully issued.\n\nYou can download it from your certificates dashboard.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  PASSWORD_RESET: {
    subject: "Reset your TARGET LMS Password",
    body: "Hi {{studentName}},\n\nYou are receiving this email because a password reset request was made for your account.\n\nPlease click the link below to reset your password:\n\n{{resetLink}}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe {{instituteName}} Team",
  },
  GENERAL: {
    subject: "Notification from {{instituteName}}",
    body: "Hi {{studentName}},\n\n{{message}}\n\nBest regards,\nThe {{instituteName}} Team",
  },
};

function createTransporter(settings: any) {
  const isSecure = settings.smtpEncryption === "SSL";
  const config: any = {
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: isSecure,
    auth: {
      user: settings.smtpUsername,
      pass: decrypt(settings.smtpPassword || ""),
    },
    connectionTimeout: 10000,
  };

  if (settings.smtpEncryption === "TLS") {
    config.requireTLS = true;
  }

  return nodemailer.createTransport(config);
}

export async function testSMTPConnection(settings: any): Promise<boolean> {
  try {
    const transporter = createTransporter(settings);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP Verification Failed:", error);
    throw error;
  }
}

export async function sendEmail(options: {
  recipientEmail: string;
  subject: string;
  body: string;
  type: EmailType;
  userId?: string;
  instituteId: string;
}) {
  const history = await prisma.emailHistory.create({
    data: {
      instituteId: options.instituteId,
      userId: options.userId || null,
      recipientEmail: options.recipientEmail,
      subject: options.subject,
      body: options.body,
      type: options.type,
      status: "PENDING",
    },
  });

  queueDelivery(history.id);
  return history;
}

function queueDelivery(historyId: string) {
  setTimeout(() => {
    processEmailQueue(historyId).catch((err) => {
      console.error(`Background email delivery failed for ${historyId}:`, err);
    });
  }, 0);
}

export async function processEmailQueue(historyId: string) {
  const history = await prisma.emailHistory.findUnique({
    where: { id: historyId },
  });
  if (!history) return;

  await prisma.emailHistory.update({
    where: { id: historyId },
    data: { status: "SENDING" },
  });

  try {
    const settings = await prisma.instituteSettings.findUnique({
      where: { instituteId: history.instituteId },
    });

    if (!settings || !settings.emailNotificationsEnabled || !settings.smtpHost) {
      throw new Error("SMTP is disabled or not configured for this institute.");
    }

    const transporter = createTransporter(settings);
    const mailOptions = {
      from: `"${settings.smtpSenderName || "Target LMS"}" <${settings.smtpSenderEmail || settings.smtpUsername}>`,
      to: history.recipientEmail,
      subject: history.subject,
      text: history.body,
      replyTo: settings.smtpReplyTo || undefined,
    };

    await transporter.sendMail(mailOptions);

    await prisma.emailHistory.update({
      where: { id: historyId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error(`Error sending email ID ${historyId}:`, error);
    const maxRetries = 3;
    const willRetry = history.retryCount < maxRetries;

    await prisma.emailHistory.update({
      where: { id: historyId },
      data: {
        status: willRetry ? "RETRYING" : "FAILED",
        retryCount: history.retryCount + 1,
        errorMessage: error.message || String(error),
      },
    });

    if (willRetry) {
      setTimeout(() => {
        processEmailQueue(historyId).catch(console.error);
      }, 30000);
    }
  }
}

export async function retryEmail(historyId: string) {
  await prisma.emailHistory.update({
    where: { id: historyId },
    data: {
      status: "PENDING",
      errorMessage: null,
    },
  });
  queueDelivery(historyId);
}

export function renderTemplate(subject: string, body: string, variables: Record<string, string>) {
  let renderedSubject = subject;
  let renderedBody = body;

  const allVars = {
    currentYear: String(new Date().getFullYear()),
    ...variables,
  };

  for (const [key, val] of Object.entries(allVars)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    renderedSubject = renderedSubject.replace(regex, val || "");
    renderedBody = renderedBody.replace(regex, val || "");
  }

  return { subject: renderedSubject, body: renderedBody };
}

export async function sendTemplateEmail(options: {
  recipientEmail: string;
  type: EmailType;
  variables: Record<string, string>;
  userId?: string;
  instituteId: string;
}) {
  const template = await prisma.emailTemplate.findUnique({
    where: {
      instituteId_type: {
        instituteId: options.instituteId,
        type: options.type,
      },
    },
  });

  let subject = "";
  let body = "";

  if (template) {
    subject = template.subject;
    body = template.body;
  } else {
    const def = DEFAULT_TEMPLATES[options.type];
    subject = def.subject;
    body = def.body;
  }

  const rendered = renderTemplate(subject, body, options.variables);

  return sendEmail({
    recipientEmail: options.recipientEmail,
    subject: rendered.subject,
    body: rendered.body,
    type: options.type,
    userId: options.userId,
    instituteId: options.instituteId,
  });
}
