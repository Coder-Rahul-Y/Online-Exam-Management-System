import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "Admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, setupAdmin } = await req.json();
    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const department = await prisma.department.create({
      data: { name },
    });

    // If onboarding, link this admin to the department immediately
    if (setupAdmin && !(session?.user as any).departmentId) {
      const adminId = parseInt(session?.user.id as string);
      await prisma.user.update({
        where: { id: adminId },
        data: { departmentId: department.id },
      });
      await prisma.department.update({
        where: { id: department.id },
        data: { adminId },
      });
    }

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create department" }, { status: 500 });
  }
}
