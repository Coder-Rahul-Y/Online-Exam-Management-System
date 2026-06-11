import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function AdminExamsPage() {
  const session = await auth()
  const deptId = (session?.user as any).departmentId

  if (!deptId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold">No Department Assigned</h2>
        <p className="text-muted-foreground mt-2">You must be assigned to a department to view exams.</p>
      </div>
    )
  }

  const exams = await prisma.exam.findMany({
    where: {
      instructor: { departmentId: deptId }
    },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { submissions: true, questions: true } }
    },
    orderBy: { startDatetime: "desc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Department Examinations</h1>
        <p className="text-muted-foreground">Monitor all exams conducted within your department.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Past Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No exams found in this department.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{exam.instructor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs gap-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(exam.startDatetime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {exam.durationMinutes} mins
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs gap-1">
                        <span>{exam._count.questions} Questions</span>
                        <span className="text-primary font-bold">{exam._count.submissions} Submissions</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Full Details">
                        <Link href={`/admin/exams/${exam.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
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
