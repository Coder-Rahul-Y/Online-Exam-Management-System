import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "Admin" && role !== "Instructor") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const body = await req.json();
  const { enrollmentNumber } = body;

  if (typeof enrollmentNumber !== "string" && enrollmentNumber !== null) {
    return NextResponse.json({ message: "Invalid enrollmentNumber" }, { status: 400 });
  }

  const trimmed = typeof enrollmentNumber === "string" ? enrollmentNumber.trim() : null;

  if (trimmed && trimmed.length > 50) {
    return NextResponse.json({ message: "Enrollment number must be 50 characters or fewer" }, { status: 400 });
  }

  const student = await prisma.user.findUnique({ where: { id: userId } });
  if (!student || student.role !== "Student") {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { enrollmentNumber: trimmed || null },
  });

  await logAction(
    (session.user as any).id,
    "ENROLLMENT_NUMBER_UPDATED",
    "User",
    userId,
    { enrollmentNumber: updated.enrollmentNumber }
  );

  return NextResponse.json({ message: "Enrollment number updated", enrollmentNumber: updated.enrollmentNumber });
}
