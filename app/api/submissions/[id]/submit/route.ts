import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendResultEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const submissionId = parseInt(id);

    // Get submission with responses, questions, and student email
    const submission = await (prisma.examSubmission.findUnique as any)({
      where: { id: submissionId },
      include: {
        student: {
          select: { name: true, email: true }
        },
        exam: {
          include: {
            questions: {
              include: { options: true }
            }
          }
        },
        responses: true
      }
    });

    if (!submission || submission.studentId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "In_Progress") {
      return NextResponse.json({ message: "Exam already submitted" }, { status: 400 });
    }

    // GRADING LOGIC
    let totalScore = 0;
    const questions = submission.exam.questions;
    const studentResponses = submission.responses;
    const totalMarks = questions.reduce((acc: number, q: any) => acc + Number(q.marksAwarded), 0);

    questions.forEach((q: any) => {
      const studentResponse = studentResponses.find((r: any) => r.questionId === q.id);
      if (studentResponse) {
        const correctOption = q.options.find((o: any) => o.isCorrect);
        if (correctOption && studentResponse.selectedOptionId === correctOption.id) {
          totalScore += Number(q.marksAwarded);
        }
      }
    });

    // Update submission
    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        status: "Evaluated",
        submittedAt: new Date(),
        totalScore: totalScore,
      }
    });

    // Send result email (fire-and-forget — don't block the response)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    sendResultEmail({
      to: submission.student.email,
      studentName: submission.student.name,
      examTitle: submission.exam.title,
      totalScore,
      totalMarks,
      submittedAt: updatedSubmission.submittedAt!,
      scorecardUrl: `${baseUrl}/student/results/${submissionId}`,
    }).catch((err: unknown) => {
      console.error("Failed to send result email:", err);
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Submission grading error:", error);
    return NextResponse.json({ message: "Failed to submit and grade exam" }, { status: 500 });
  }
}
