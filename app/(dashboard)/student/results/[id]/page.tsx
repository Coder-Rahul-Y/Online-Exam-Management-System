import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function StudentScorecardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const studentId = parseInt(session?.user.id as string)

  const submission = await (prisma.examSubmission.findUnique as any)({
    where: { id: parseInt(id) },
    include: {
      exam: {
        include: {
          instructor: { select: { name: true } },
          questions: {
            orderBy: { questionOrder: "asc" },
            include: {
              options: true,
            },
          },
        },
      },
      responses: {
        include: {
          selectedOption: true,
        },
      },
    },
  })

  if (!submission || submission.studentId !== studentId) notFound()

  const responseMap = new Map<any, any>(submission.responses.map((r: any) => [r.questionId, r]))
  const totalMarks = submission.exam.questions.reduce((acc: number, q: any) => acc + Number(q.marksAwarded), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/results">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{submission.exam.title}</h1>
          <p className="text-muted-foreground">By {submission.exam.instructor.name}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {Number(submission.totalScore)} / {totalMarks}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted At</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Violations</CardTitle>
          </CardHeader>
          <CardContent>
            {(submission as any).violationCount > 0 ? (
              <p className="text-3xl font-bold text-orange-600">{(submission as any).violationCount}</p>
            ) : (
              <p className="text-3xl font-bold text-green-600">0</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
          <CardDescription>Your answers compared to the correct options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submission.exam.questions.map((question: any, idx: number) => {
            const response = responseMap.get(question.id)
            const selectedOptionId = response?.selectedOptionId ?? null
            const correctOption = question.options.find((o: any) => o.isCorrect)
            const isCorrect = selectedOptionId !== null && selectedOptionId === correctOption?.id
            const isSkipped = selectedOptionId === null

            return (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-sm">
                    <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                    {question.questionText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {isSkipped ? (
                      <MinusCircle className="h-5 w-5 text-muted-foreground" />
                    ) : isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {isCorrect ? `+${Number(question.marksAwarded)}` : "0"} / {Number(question.marksAwarded)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {question.options.map((option: any) => {
                    const isSelected = option.id === selectedOptionId
                    const isRight = option.isCorrect

                    let className =
                      "text-sm px-3 py-2 rounded-md border flex items-center justify-between"
                    if (isRight) className += " bg-green-50 border-green-300 text-green-800"
                    else if (isSelected && !isRight)
                      className += " bg-red-50 border-red-300 text-red-800"
                    else className += " bg-muted/30 text-muted-foreground"

                    return (
                      <div key={option.id} className={className}>
                        <span>{option.optionText}</span>
                        <div className="flex gap-1 text-xs">
                          {isSelected && (
                            <Badge variant="outline" className="text-[10px] h-4">Your answer</Badge>
                          )}
                          {isRight && (
                            <Badge variant="outline" className="text-[10px] h-4 border-green-400 text-green-700">
                              Correct
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {isSkipped && (
                  <p className="text-xs text-muted-foreground italic">You did not answer this question.</p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
