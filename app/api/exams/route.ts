import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { examSchema } from "@/lib/validations/exam.schema";
import { logAction } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const exams = await prisma.exam.findMany({
      where: session.user.role === "Instructor" ? { instructorId: parseInt(session.user.id) } : {},
      include: {
        _count: {
          select: { questions: true, submissions: true },
        },
      },
      orderBy: { startDatetime: "desc" },
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "Instructor" && session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = examSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input", errors: result.error.flatten() }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        ...result.data,
        instructorId: parseInt(session.user.id),
      },
    });

    await logAction(parseInt(session.user.id), "EXAM_CREATED", "Exam", exam.id, { title: exam.title });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("Exam creation error:", error);
    return NextResponse.json({ message: "Failed to create exam" }, { status: 500 });
  }
}
