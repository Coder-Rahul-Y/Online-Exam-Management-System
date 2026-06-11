import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Users, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExamEditForm } from "@/components/exam/ExamEditForm"
import { Card, CardContent } from "@/components/ui/card"

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const examId = parseInt(id)
  
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      _count: {
        select: { 
          questions: true, 
          submissions: true,
          examBatches: true
        }
      }
    }
  })

  if (!exam) notFound()

  const hasStarted = new Date() >= new Date(exam.startDatetime)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/instructor/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
            <p className="text-muted-foreground">{exam.title}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-4 space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20" asChild>
              <Link href={`/instructor/exams/${examId}`}>
                <Settings className="h-4 w-4" />
                Basic Settings
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all" asChild>
              <Link href={`/instructor/exams/${examId}/questions`}>
                <FileText className="h-4 w-4" />
                Manage Questions
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{exam._count.questions}</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all" asChild>
              <Link href={`/instructor/exams/${examId}/batches`}>
                <Users className="h-4 w-4" />
                Assign Batches
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{exam._count.examBatches}</span>
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/5 hover:text-primary transition-all" asChild>
              <Link href={`/instructor/exams/${examId}/results`}>
                <BarChart3 className="h-4 w-4" />
                View Results
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{exam._count.submissions}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <ExamEditForm exam={exam} hasStarted={hasStarted} />
        </div>
      </div>
    </div>
  )
}
