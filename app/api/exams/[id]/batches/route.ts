import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const examBatches = await prisma.examBatch.findMany({
      where: { examId: parseInt(id) },
      include: {
        batch: {
          include: {
            _count: {
              select: { studentBatches: true },
            },
          },
        },
      },
    });
    return NextResponse.json(examBatches);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch exam batches" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Instructor" && session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { batchIds } = await req.json(); // Array of batch IDs
    if (!batchIds || !Array.isArray(batchIds)) {
      return NextResponse.json({ message: "Batch IDs are required" }, { status: 400 });
    }

    const examId = parseInt(id);

    const data = batchIds.map((batchId: number) => ({
      examId,
      batchId,
    }));

    await prisma.examBatch.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: "Batches assigned to exam" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to assign batches" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Instructor" && session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ message: "Batch ID is required" }, { status: 400 });
    }

    await prisma.examBatch.delete({
      where: {
        examId_batchId: {
          examId: parseInt(id),
          batchId: parseInt(batchId),
        },
      },
    });

    return NextResponse.json({ message: "Batch removed from exam" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to remove batch" }, { status: 500 });
  }
}
