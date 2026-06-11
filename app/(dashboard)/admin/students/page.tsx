import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StudentListUI } from "./StudentListUI"

export default async function AdminStudentsPage() {
  const session = await auth()
  if (!session || !session.user) return null
  
  const deptId = (session?.user as any).departmentId

  if (!deptId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold">No Department Assigned</h2>
        <p className="text-muted-foreground mt-2">You must be assigned to a department to view students.</p>
      </div>
    )
  }

  const [students, departments, batches] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "Student",
        departmentId: deptId,
      },
      include: {
        studentBatches: {
          include: { batch: true }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.department.findMany({
      where: { id: deptId },
      select: { id: true, name: true }
    }),
    prisma.batch.findMany({
      where: { instructor: { departmentId: deptId } },
      select: { id: true, name: true }
    })
  ])

  return (
    <StudentListUI 
      students={students} 
      departments={departments} 
      batches={batches} 
      deptId={deptId} 
    />
  )
}
