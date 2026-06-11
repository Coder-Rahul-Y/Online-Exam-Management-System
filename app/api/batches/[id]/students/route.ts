import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Add students to a batch
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
    const { studentIds } = await req.json(); // Array of user IDs
    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ message: "Student IDs are required" }, { status: 400 });
    }

    const batchId = parseInt(id);

    // Create many StudentBatch records
    const data = studentIds.map((studentId: number) => ({
      studentId,
      batchId,
    }));

    await prisma.studentBatch.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: "Students added to batch" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to add students" }, { status: 500 });
  }
}

// Remove student from batch
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Admin" && session?.user.role !== "Instructor") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    
    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    await prisma.studentBatch.delete({
      where: {
        studentId_batchId: {
          studentId: parseInt(studentId),
          batchId: parseInt(id),
        },
      },
    });

    return NextResponse.json({ message: "Student removed from batch" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to remove student" }, { status: 500 });
  }
}
