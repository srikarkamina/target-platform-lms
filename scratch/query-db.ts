import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: true,
      attempts: {
        include: {
          answers: true,
        }
      }
    }
  });

  console.log("=== QUIZZES ===");
  quizzes.forEach(q => {
    console.log(`Quiz: ${q.title} (ID: ${q.id})`);
    console.log(`  Time Limit: ${q.timeLimit}`);
    console.log(`  Passing Marks: ${q.passingMarks}`);
    console.log(`  Total Marks (configured): ${q.totalMarks}`);
    console.log(`  Questions count: ${q.questions.length}`);
    q.questions.forEach((question, idx) => {
      console.log(`    Q${idx+1}: ${question.question} (Marks: ${question.marks})`);
      console.log(`      Type: ${question.questionType}`);
      console.log(`      Options:`, question.options);
      console.log(`      Correct Answers:`, question.correctAnswers);
    });
    console.log(`  Attempts count: ${q.attempts.length}`);
    q.attempts.forEach((att, attIdx) => {
      console.log(`    Attempt ${attIdx+1}: (ID: ${att.id})`);
      console.log(`      Student ID: ${att.studentId}`);
      console.log(`      Score: ${att.score}`);
      console.log(`      Percentage: ${att.percentage}`);
      console.log(`      Passed: ${att.passed}`);
      console.log(`      Status: ${att.status}`);
      console.log(`      Answers:`);
      att.answers.forEach((ans, ansIdx) => {
        console.log(`        Ans ${ansIdx+1}: Q_ID: ${ans.questionId}`);
        console.log(`          Selected:`, ans.selectedAnswers);
        console.log(`          isCorrect: ${ans.isCorrect}`);
      });
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
