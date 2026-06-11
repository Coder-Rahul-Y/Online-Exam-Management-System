import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Users, 
  Calendar, 
  PlusCircle, 
  ChevronRight,
  ClipboardList
} from "lucide-react"
import Link from "next/link"

export default async function InstructorDashboard() {
  const session = await auth()
  const instructorId = parseInt(session?.user.id as string)

  const stats = await prisma.$transaction([
    prisma.exam.count({ where: { instructorId } }),
    prisma.batch.count(), // Could be filtered by instructor in a real scenario
    prisma.examSubmission.count({
      where: { exam: { instructorId } }
    })
  ])

  const recentExams = await prisma.exam.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      _count: { select: { submissions: true } }
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your exams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[2]}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Exams</CardTitle>
            <CardDescription>Your most recently created examination papers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExams.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No exams created yet.</p>
              ) : (
                recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{exam.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exam.startDatetime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{exam._count.submissions} Submissions</p>
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 mt-1">
                        <Link href={`/instructor/exams/${exam.id}/results`}>
                          View Results <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-6" asChild>
              <Link href="/instructor/exams">View All Exams</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-dashed bg-primary/5">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used instructor tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button className="w-full justify-start gap-3 h-12 text-md" asChild>
              <Link href="/instructor/exams/new">
                <PlusCircle className="h-5 w-5" />
                Create New Examination
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 text-md" asChild>
              <Link href="/instructor/batches">
                <Users className="h-5 w-5" />
                Manage Batches
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
