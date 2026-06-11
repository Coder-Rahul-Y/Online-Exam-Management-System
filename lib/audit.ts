import { prisma } from "./prisma";

export async function logAction(
  userId: number,
  action: string,
  resourceType: string,
  resourceId?: number,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: "0.0.0.0", // In a real app, capture from request headers
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
