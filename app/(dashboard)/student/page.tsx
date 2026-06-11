import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Building2 } from "lucide-react"
import Link from "next/link"
import { ActiveExamList } from "@/components/student/ActiveExamList"



export default async function StudentDashboard() {
  const session = await auth()
  const studentId = parseInt(session?.user.id as string)

  const exams = await prisma.exam.findMany({
    where: {
      examBatches: {
        some: {
          batch: {
            studentBatches: {
              some: { studentId }
            }
          }
        }
      }
    },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { questions: true } },
      submissions: { where: { studentId } }
    },
    orderBy: { startDatetime: "asc" }
  })

  const user = await prisma.user.findUnique({
    where: { id: studentId },
    include: { department: { select: { name: true } } }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Manage your upcoming examinations and view results.</p>
      </div>

      {user?.department && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              My Department
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/departments">View Batches</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-lg font-bold">{user.department.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      <div className="grid gap-6 md:grid-cols-2">
        <ActiveExamList
          exams={exams.filter(e => e.submissions.length === 0 || e.submissions[0].status === "In_Progress")}
        />

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Completed Exams
          </h2>
          <div className="space-y-4">
            {exams.filter(e => e.submissions[0]?.status === "Completed" || e.submissions[0]?.status === "Evaluated").length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No completed exams yet.</p>
            ) : (
              exams.filter(e => e.submissions[0]?.status === "Completed" || e.submissions[0]?.status === "Evaluated").map((exam) => (
                <Card key={exam.id} className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-muted-foreground">{exam.title}</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(exam.submissions[0].submittedAt!).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-background">Completed</Badge>
                    <Button variant="ghost" asChild>
                      <Link href="/student/results">View Result</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
