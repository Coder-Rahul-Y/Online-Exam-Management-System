import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, type, departmentId, batchId } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ message: "Email and type are required" }, { status: 400 });
    }

    // Find the user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return NextResponse.json({ message: "User with this email not found" }, { status: 404 });
    }

    if (type === "Department") {
      // Validate permissions: Only Admins can add to departments
      if (session.user.role !== "Admin") {
        return NextResponse.json({ message: "Only Admins can add users to departments" }, { status: 403 });
      }

      if (!departmentId) {
        return NextResponse.json({ message: "Department ID is required" }, { status: 400 });
      }

      // Check if already in this department
      if (userToAdd.departmentId === parseInt(departmentId)) {
        return NextResponse.json({ message: "User is already in this department" }, { status: 409 });
      }

      await prisma.user.update({
        where: { id: userToAdd.id },
        data: { departmentId: parseInt(departmentId) },
      });

      await logAction(parseInt(session.user.id), "MEMBER_ADDED_TO_DEPT", "User", userToAdd.id, { 
        departmentId: parseInt(departmentId),
        role: userToAdd.role 
      });

      return NextResponse.json({ message: "User added to department successfully" });

    } else if (type === "Batch") {
      // Validate permissions: Only Instructors can add to their batches
      if (session.user.role !== "Instructor") {
        return NextResponse.json({ message: "Only Instructors can add students to batches" }, { status: 403 });
      }

      if (!batchId) {
        return NextResponse.json({ message: "Batch ID is required" }, { status: 400 });
      }

      // Ensure userToAdd is a student
      if (userToAdd.role !== "Student") {
        return NextResponse.json({ message: "Only students can be added to batches" }, { status: 400 });
      }

      // Verify batch belongs to this instructor (or instructor has access)
      const batch = await prisma.batch.findUnique({
        where: { id: parseInt(batchId) },
      });

      if (!batch || batch.instructorId !== parseInt(session.user.id)) {
        return NextResponse.json({ message: "Unauthorized or batch not found" }, { status: 403 });
      }

      // Check if already in batch
      const existing = await prisma.studentBatch.findUnique({
        where: {
          studentId_batchId: {
            studentId: userToAdd.id,
            batchId: parseInt(batchId),
          },
        },
      });

      if (existing) {
        return NextResponse.json({ message: "Student is already in this batch" }, { status: 409 });
      }

      await prisma.studentBatch.create({
        data: {
          studentId: userToAdd.id,
          batchId: parseInt(batchId),
        },
      });

      await logAction(parseInt(session.user.id), "STUDENT_ADDED_TO_BATCH", "User", userToAdd.id, { 
        batchId: parseInt(batchId) 
      });

      return NextResponse.json({ message: "Student added to batch successfully" });

    } else {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ message: "Failed to add member" }, { status: 500 });
  }
}
