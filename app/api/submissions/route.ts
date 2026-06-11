import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "Student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { examId } = await req.json();
    const studentId = parseInt(session.user.id);

    // Check if exam is live
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    const now = new Date();
    if (now < new Date(exam.startDatetime)) {
      return NextResponse.json({ message: "Exam has not started yet" }, { status: 400 });
    }

    // Check if already submitted
    const existing = await prisma.examSubmission.findUnique({
      where: {
        examId_studentId: { examId, studentId }
      }
    });

    if (existing) {
      if (existing.status !== "In_Progress") {
        return NextResponse.json({ message: "Exam already submitted" }, { status: 400 });
      }
      return NextResponse.json({ ...existing, durationMinutes: exam.durationMinutes });
    }

    try {
      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          studentId,
          status: "In_Progress",
          startedAt: now,
        }
      });
      return NextResponse.json({ ...submission, durationMinutes: exam.durationMinutes }, { status: 201 });
    } catch (createError: any) {
      // P2002 = unique constraint violation: two concurrent requests raced to create.
      // Fetch the record the winner created and return it instead.
      if (createError?.code === "P2002") {
        const raceExisting = await prisma.examSubmission.findUnique({
          where: { examId_studentId: { examId, studentId } }
        });
        if (raceExisting) {
          if (raceExisting.status !== "In_Progress") {
            return NextResponse.json({ message: "Exam already submitted" }, { status: 400 });
          }
          return NextResponse.json({ ...raceExisting, durationMinutes: exam.durationMinutes });
        }
      }
      throw createError;
    }
  } catch (error) {
    return NextResponse.json({ message: "Failed to start exam" }, { status: 500 });
  }
}
