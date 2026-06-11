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
    const { email } = await req.json();
    const departmentId = parseInt(id);

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Find the user and ensure they are an Instructor
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.role !== "Instructor") {
      return NextResponse.json({ message: "User is not an instructor" }, { status: 400 });
    }

    // Update the user's department
    await prisma.user.update({
      where: { id: user.id },
      data: { departmentId },
    });

    return NextResponse.json({ message: "Instructor assigned to department" });
  } catch (error) {
    console.error("Error assigning instructor:", error);
    return NextResponse.json({ message: "Failed to assign instructor" }, { status: 500 });
  }
}
