import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  
  if (session?.user.role !== "Admin" && session?.user.role !== "Instructor") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    const batchId = parseInt(id);

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Find the student by email
    const student = await prisma.user.findUnique({
      where: { email },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found with this email" }, { status: 404 });
    }

    if (student.role !== "Student") {
      return NextResponse.json({ message: "User is not a student" }, { status: 400 });
    }

    // Add to batch (StudentBatch relation)
    await prisma.studentBatch.upsert({
      where: {
        studentId_batchId: {
          studentId: student.id,
          batchId: batchId,
        }
      },
      update: {}, // Do nothing if already in batch
      create: {
        studentId: student.id,
        batchId: batchId,
      }
    });

    return NextResponse.json({ 
      message: `Student ${student.name} added to batch successfully`,
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    console.error("Error adding student by email:", error);
    return NextResponse.json({ message: "Failed to add student to batch" }, { status: 500 });
  }
}
