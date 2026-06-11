import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(id) },
      include: {
        studentBatches: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                enrollmentNumber: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch batch details" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Admin" && session?.user.role !== "Instructor") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();
    const batch = await prisma.batch.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = parseInt(session.user.id);
  const batchId = parseInt(id);

  if (role !== "Admin" && role !== "Instructor") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }

    // Instructors can only delete their own batches
    if (role === "Instructor" && batch.instructorId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.batch.delete({ where: { id: batchId } });
    return NextResponse.json({ message: "Batch deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete batch" }, { status: 500 });
  }
}
