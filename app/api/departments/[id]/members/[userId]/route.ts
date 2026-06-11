import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const session = await auth();
  if (session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const departmentId = parseInt(id);
    const memberId = parseInt(userId);

    // Verify member is in this department
    const user = await prisma.user.findFirst({
      where: { id: memberId, departmentId },
      select: { role: true, studentBatches: { select: { batchId: true, batch: { select: { instructorId: true } } } } }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found in this department" }, { status: 404 });
    }

    // Collect batch IDs belonging to this department (via instructor's departmentId)
    const batchIdsInDept = user.studentBatches
      .filter(sb => sb.batch.instructorId !== null)
      .map(sb => sb.batchId);

    await prisma.$transaction([
      // Remove from department
      prisma.user.update({
        where: { id: memberId },
        data: { departmentId: null },
      }),
      // If student, remove from all batches whose instructor is in this department
      ...(user.role === "Student" && batchIdsInDept.length > 0 ? [
        prisma.studentBatch.deleteMany({
          where: {
            studentId: memberId,
            batchId: { in: batchIdsInDept },
          },
        })
      ] : [])
    ]);

    await logAction(parseInt(session.user.id), "REMOVED_FROM_DEPARTMENT", "User", memberId, { departmentId });

    return NextResponse.json({ message: "Member removed from department" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ message: "Failed to remove member" }, { status: 500 });
  }
}
