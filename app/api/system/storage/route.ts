import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins only" }, { status: 403 });
    }

    // Gathers exact storage breakdowns across all active institutes
    const institutes = await prisma.institute.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
    });

    const breakdown = [];
    let totalStorageMB = 0;

    for (const inst of institutes) {
      const storageMB = await SubscriptionService.calculateStorageUsedMB(inst.id);
      totalStorageMB += storageMB;

      // Let's get sizes of videos and submissions for this institute
      const [videoSizeSum, submissionSizeSum, templateSizeSum, certSizeSum] = await Promise.all([
        prisma.video.aggregate({
          where: { course: { instituteId: inst.id }, deletedAt: null },
          _sum: { fileSize: true },
        }),
        prisma.submission.aggregate({
          where: { student: { instituteId: inst.id } },
          _sum: { fileSize: true },
        }),
        prisma.certificateTemplate.aggregate({
          where: { instituteId: inst.id, deletedAt: null },
          _sum: { backgroundImageSize: true, signatureImageSize: true },
        }),
        prisma.certificate.aggregate({
          where: { instituteId: inst.id, deletedAt: null },
          _sum: { fileSize: true },
        }),
      ]);

      const videoBytes = videoSizeSum._sum.fileSize || 0;
      const submissionBytes = submissionSizeSum._sum.fileSize || 0;
      const backgroundBytes = templateSizeSum._sum.backgroundImageSize || 0;
      const signatureBytes = templateSizeSum._sum.signatureImageSize || 0;
      const certificateBytes = certSizeSum._sum.fileSize || 0;

      // settings sizes
      const settings = await prisma.instituteSettings.findUnique({
        where: { instituteId: inst.id },
      });
      const brandingBytes =
        (settings?.logoSize || 0) +
        (settings?.bannerSize || 0) +
        (settings?.faviconSize || 0) +
        (settings?.defaultSignatureImageSize || 0) +
        (settings?.defaultSealImageSize || 0);

      const totalInstituteBytes =
        videoBytes +
        submissionBytes +
        backgroundBytes +
        signatureBytes +
        certificateBytes +
        brandingBytes;

      breakdown.push({
        instituteId: inst.id,
        instituteName: inst.name,
        totalBytes: totalInstituteBytes,
        totalMB: parseFloat((totalInstituteBytes / (1024 * 1024)).toFixed(2)),
        details: {
          videosMB: parseFloat((videoBytes / (1024 * 1024)).toFixed(2)),
          submissionsMB: parseFloat((submissionBytes / (1024 * 1024)).toFixed(2)),
          templatesMB: parseFloat(((backgroundBytes + signatureBytes) / (1024 * 1024)).toFixed(2)),
          certificatesMB: parseFloat((certificateBytes / (1024 * 1024)).toFixed(2)),
          brandingMB: parseFloat((brandingBytes / (1024 * 1024)).toFixed(2)),
        },
      });
    }

    return NextResponse.json({
      totalStorageMB: parseFloat(totalStorageMB.toFixed(2)),
      institutesBreakdown: breakdown,
    });
  } catch (error) {
    console.error("[GET SYSTEM STORAGE BREAKDOWN ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
