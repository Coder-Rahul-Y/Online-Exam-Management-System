import { prisma } from "@/lib/prisma"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AssignBatchDialog } from "@/components/instructor/AssignBatchDialog"
import { AddStudentByEmailDialog } from "@/components/instructor/AddStudentByEmailDialog"


import { auth } from "@/lib/auth"

export default async function StudentsListPage() {
  const session = await auth()
  if (!session?.user) return null

  const userId = parseInt(session.user.id as string)
  const deptId = (session.user as any).departmentId

  const [relevantStudents, departments, instructorBatches] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "Student",
        studentBatches: { some: { batch: { instructorId: userId } } }
      },
      include: {
        department: true,
        studentBatches: {
          include: { batch: true }
        }
      },
      orderBy: { name: "asc" }
    }),
    deptId ? prisma.department.findMany({ 
      where: { id: deptId },
      select: { id: true, name: true } 
    }) : Promise.resolve([]),
    prisma.batch.findMany({ 
      where: { instructorId: parseInt(session.user.id) },
      select: { id: true, name: true } 
    })
  ])

  const myStudents = relevantStudents

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-muted-foreground">View and manage all students enrolled in the system.</p>
        </div>
        <div className="flex gap-2">

          <AddStudentByEmailDialog batches={instructorBatches} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No students found in your batches.
                  </TableCell>
                </TableRow>
              ) : (
                myStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${student.email}`} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{student.name}</span>
                          <span className="text-xs text-muted-foreground">{student.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {student.enrollmentNumber || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.department?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.studentBatches.length > 0 ? (
                          student.studentBatches.map((sb) => (
                            <Badge key={sb.batchId} variant="secondary" className="text-[10px] px-1 h-5">
                              {sb.batch.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No batch</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
