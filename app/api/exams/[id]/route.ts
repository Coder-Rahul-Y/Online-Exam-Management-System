import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { examSchema } from "@/lib/validations/exam.schema";
import { logAction } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const examId = parseInt(id);

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: { questions: true, submissions: true, examBatches: true },
        },
      },
    });

    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    // Access control: only the instructor who created it or an admin can view details
    if (session.user.role === "Instructor" && exam.instructorId !== parseInt(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "Instructor" && session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    const body = await req.json();
    const result = examSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input", errors: result.error.flatten() }, { status: 400 });
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: result.data,
    });

    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "Instructor" && session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { title: true } });

    await prisma.exam.delete({
      where: { id: examId },
    });

    await logAction(parseInt(session.user.id), "EXAM_DELETED", "Exam", examId, { title: exam?.title });

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete exam" }, { status: 500 });
  }
}
