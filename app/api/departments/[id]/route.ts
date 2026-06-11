import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name } = await req.json();
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    return NextResponse.json(department);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.department.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: "Department deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete department" }, { status: 500 });
  }
}
