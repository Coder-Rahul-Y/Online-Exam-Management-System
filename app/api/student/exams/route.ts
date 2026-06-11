import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "Student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const studentId = parseInt(session.user.id);

  try {
    // Find exams assigned to batches this student belongs to
    const exams = await prisma.exam.findMany({
      where: {
        examBatches: {
          some: {
            batch: {
              studentBatches: {
                some: { studentId }
              }
            }
          }
        }
      },
      include: {
        instructor: {
          select: { name: true }
        },
        _count: {
          select: { questions: true }
        },
        submissions: {
          where: { studentId }
        }
      },
      orderBy: { startDatetime: "asc" }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Fetch student exams error:", error);
    return NextResponse.json({ message: "Failed to fetch exams" }, { status: 500 });
  }
}
