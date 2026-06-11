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
import { ArrowLeft, Users, FileText, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default async function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const deptId = (session?.user as any).departmentId
  const examId = parseInt(id)

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      instructor: { departmentId: deptId }
    },
    include: {
      instructor: { select: { name: true } },
      examBatches: {
        include: { batch: true }
      },
      questions: {
        include: {
          options: true
        },
        orderBy: { questionOrder: "asc" }
      }
    }
  })

  // Security check: Ensure the exam's instructor is in the same department
  if (!exam) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-muted-foreground">Instructor: {exam.instructor.name} • {exam.questions.length} Questions</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Batches
            </CardTitle>
            <CardDescription>Target audiences for this examination.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exam.examBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No batches assigned yet.</p>
              ) : (
                exam.examBatches.map((eb) => (
                  <div key={eb.batchId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border text-sm">
                    <span className="font-medium">{eb.batch.name}</span>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Question Bank
            </CardTitle>
            <CardDescription>Complete list of questions and answers for this paper.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {exam.questions.map((q, index) => (
                <div key={q.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">
                      <span className="text-muted-foreground mr-2">{index + 1}.</span>
                      {q.questionText}
                    </p>
                    <Badge variant="secondary">{q.marksAwarded.toString()} Marks</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                    {q.options.map((opt) => (
                      <div 
                        key={opt.id} 
                        className={`flex items-center gap-2 p-2 rounded text-sm border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-muted/30 border-transparent'}`}
                      >
                        {opt.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-30" />}
                        {opt.optionText}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
