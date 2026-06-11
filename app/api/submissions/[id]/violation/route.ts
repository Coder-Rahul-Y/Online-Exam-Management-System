import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "Student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const submissionId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const type: string = body.type ?? "TAB_SWITCH";

    const submission = await prisma.examSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.studentId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "In_Progress") {
      return NextResponse.json({ message: "Exam not in progress" }, { status: 400 });
    }

    const updated = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: { violationCount: { increment: 1 } },
    });

    await logAction(
      parseInt(session.user.id),
      "EXAM_VIOLATION",
      "Submission",
      submissionId,
      { type, violationCount: updated.violationCount }
    );

    return NextResponse.json({ violationCount: updated.violationCount });
  } catch (error) {
    return NextResponse.json({ message: "Failed to record violation" }, { status: 500 });
  }
}
