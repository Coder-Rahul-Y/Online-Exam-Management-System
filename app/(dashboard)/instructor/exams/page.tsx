import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function InstructorExamsPage() {
  const session = await auth()
  const exams = await prisma.exam.findMany({
    where: { instructorId: parseInt(session?.user.id as string) },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { startDatetime: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
          <p className="text-muted-foreground">Create and manage your examination papers.</p>
        </div>
        <Button asChild>
          <Link href="/instructor/exams/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Exam
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {exams.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No exams yet</p>
                <p className="text-sm text-muted-foreground">Get started by creating your first exam paper.</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/instructor/exams/new">Create Exam</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam) => {
            const hasStarted = new Date() >= new Date(exam.startDatetime)
            return (
            <Card key={exam.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {exam.title}
                  </CardTitle>
                  {hasStarted && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">Started</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(exam.startDatetime).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{exam.durationMinutes} mins</span>
                  </div>
                  <Badge variant="secondary">
                    {exam._count.questions} Questions
                  </Badge>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/instructor/exams/${exam.id}`}>
                      {hasStarted ? "View Exam" : "Edit Exam"}
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="px-2" asChild>
                    <Link href={`/instructor/exams/${exam.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function Separator() {
  return <div className="h-px bg-border w-full" />
}
