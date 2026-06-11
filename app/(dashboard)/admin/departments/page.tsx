import { prisma } from "@/lib/prisma"
import { DepartmentDialog } from "@/components/admin/DepartmentDialog"
import { DepartmentListUI } from "@/components/admin/DepartmentListUI"

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          username: true,
          enrollmentNumber: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage academic departments and view their members.</p>
        </div>
        <DepartmentDialog />
      </div>

      <DepartmentListUI departments={departments} />
    </div>
  )
}
