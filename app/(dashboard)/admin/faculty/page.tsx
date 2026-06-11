import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FacultyListUI } from "./FacultyListUI"

export default async function FacultyPage() {
  const session = await auth()
  const deptId = (session?.user as any).departmentId

  return <FacultyList deptId={deptId} />
}

async function FacultyList({ deptId }: { deptId: number }) {
  if (!deptId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold">No Department Assigned</h2>
        <p className="text-muted-foreground mt-2">You must be assigned to a department to view faculty.</p>
      </div>
    )
  }

  const [instructors, department, allDepartments] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "Instructor",
        departmentId: deptId,
      },
      include: { _count: { select: { examsCreated: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.department.findUnique({ where: { id: deptId } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ])

  return <FacultyListUI 
    instructors={instructors} 
    department={department} 
    deptId={deptId} 
    allDepartments={allDepartments}
  />
}
