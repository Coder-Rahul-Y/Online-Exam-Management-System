import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { questionId, selectedOptionId } = await req.json();
    const submissionId = parseInt(id);

    // Verify submission belongs to user and is in progress
    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId }
    });

    if (!submission || submission.studentId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "In_Progress") {
      return NextResponse.json({ message: "Exam already submitted" }, { status: 400 });
    }

    const response = await prisma.studentResponse.upsert({
      where: {
        submissionId_questionId: {
          submissionId,
          questionId
        }
      },
      update: { selectedOptionId },
      create: {
        submissionId,
        questionId,
        selectedOptionId
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: "Failed to save response" }, { status: 500 });
  }
}
