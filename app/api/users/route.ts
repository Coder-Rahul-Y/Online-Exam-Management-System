import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/user.schema";

import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, username, role, departmentId, enrollmentNumber, batchId } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      let finalDeptId = departmentId;

      // Automatically create a department for new Admins if not provided
      if (role === "Admin" && !finalDeptId) {
        const newDept = await tx.department.create({
          data: { name: `${name}'s Department` }
        });
        finalDeptId = newDept.id;
      }

      const newUser = await tx.user.create({
        data: {
          email,
          name,
          username,
          role,
          passwordHash: hashedPassword,
          departmentId: finalDeptId ?? null,
          enrollmentNumber,
        },
      });

      // For new admins, set themselves as the department admin
      if (role === "Admin" && finalDeptId) {
        await tx.department.update({
          where: { id: finalDeptId },
          data: { adminId: newUser.id },
        });
      }

      if (batchId && role === "Student") {
        await tx.studentBatch.create({
          data: {
            studentId: newUser.id,
            batchId: batchId,
          },
        });
      }

      return newUser;
    });

    // Audit log
    await logAction(user.id, "USER_REGISTERED", "User", user.id, { role, email });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
