import { prisma } from "@/lib/prisma"
import { QuestionEditor } from "@/components/exam/QuestionEditor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ExamQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const examId = parseInt(id)
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { questionOrder: "asc" },
      },
    },
  })

  if (!exam) notFound()

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/instructor/exams/${examId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Questions</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-semibold">Existing Questions ({exam.questions.length})</h2>
          {exam.questions.length === 0 ? (
            <Card>
              <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
                No questions added yet. Use the editor to add your first question.
              </CardContent>
            </Card>
          ) : (
            exam.questions.map((q, idx) => (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <span className="font-bold text-primary">Q{idx + 1}.</span>
                      <p className="font-medium">{q.questionText}</p>
                    </div>
                    <Badge variant="secondary">{Number(q.marksAwarded)} Marks</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 pl-9">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-3 text-sm">
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}>
                          {opt.isCorrect && <Check className="h-3 w-3" />}
                        </div>
                        <span className={opt.isCorrect ? "font-semibold text-green-700" : ""}>{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <QuestionEditor examId={examId} />
          </div>
        </div>
      </div>
    </div>
  )
}
