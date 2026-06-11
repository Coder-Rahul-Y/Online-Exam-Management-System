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
import { ArrowLeft, BookOpen, Calendar, Clock, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function FacultyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const deptId = (session?.user as any).departmentId
  const instructorId = parseInt(id)

  const instructor = await prisma.user.findFirst({
    where: {
      id: instructorId,
      departmentId: deptId,
    },
    include: {
      examsCreated: {
        include: {
          _count: { select: { submissions: true, questions: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  // Security check: Ensure the instructor is in the same department
  if (!instructor || instructor.role !== "Instructor") {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/faculty">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{instructor.name}</h1>
          <p className="text-muted-foreground">{instructor.email} • {instructor.examsCreated.length} Exams Created</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams by {instructor.name}</CardTitle>
          <CardDescription>All examinations created by this faculty member.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructor.examsCreated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    This instructor hasn't created any exams yet.
                  </TableCell>
                </TableRow>
              ) : (
                instructor.examsCreated.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs gap-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(exam.startDatetime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {exam.durationMinutes} mins
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{exam._count.questions} Qs</TableCell>
                    <TableCell>{exam._count.submissions} Students</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Exam Details">
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
