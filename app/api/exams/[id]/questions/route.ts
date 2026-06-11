import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { questionSchema } from "@/lib/validations/exam.schema";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const questions = await prisma.question.findMany({
      where: { examId: parseInt(id) },
      include: { options: true },
      orderBy: { questionOrder: "asc" },
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const result = questionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input", errors: result.error.flatten() }, { status: 400 });
    }

    const { questionText, marksAwarded, options } = result.data;
    const examId = parseInt(id);

    // Create question and options in a transaction
    const question = await prisma.$transaction(async (tx) => {
      // Get current max order
      const lastQuestion = await tx.question.findFirst({
        where: { examId },
        orderBy: { questionOrder: "desc" },
      });
      const nextOrder = (lastQuestion?.questionOrder ?? -1) + 1;

      const newQuestion = await tx.question.create({
        data: {
          examId,
          questionText,
          marksAwarded,
          questionOrder: nextOrder,
        },
      });

      await tx.questionOption.createMany({
        data: options.map((opt) => ({
          questionId: newQuestion.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
      });

      return newQuestion;
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Question creation error:", error);
    return NextResponse.json({ message: "Failed to create question" }, { status: 500 });
  }
}
