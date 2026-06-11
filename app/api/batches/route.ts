import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const batches = await prisma.batch.findMany({
      include: {
        _count: {
          select: { studentBatches: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "Admin" && session?.user.role !== "Instructor") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const batch = await prisma.batch.create({
      data: {
        name,
        description,
        instructorId: parseInt(session.user.id)
      },
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create batch" }, { status: 500 });
  }
}
