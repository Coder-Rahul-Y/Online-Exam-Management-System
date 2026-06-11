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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExportCsvButton } from "@/components/instructor/ExportCsvButton"

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const examId = parseInt(id)
  
  const exam = await (prisma.exam.findUnique as any)({
    where: { id: examId },
    include: {
      submissions: {
        include: {
          student: {
            select: { name: true, email: true, enrollmentNumber: true }
          }
        },
        orderBy: { totalScore: "desc" }
      },
      _count: {
        select: { questions: true }
      }
    }
  })

  if (!exam) notFound()

  const evaluatedSubmissions = exam.submissions.filter((s: any) => s.status === "Evaluated")
  const averageScore = evaluatedSubmissions.length > 0 
    ? (evaluatedSubmissions.reduce((acc: number, curr: any) => acc + Number(curr.totalScore || 0), 0) / evaluatedSubmissions.length).toFixed(2)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/instructor/exams`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
            <p className="text-muted-foreground">{exam.title}</p>
          </div>
        </div>
        <ExportCsvButton examTitle={exam.title} submissions={exam.submissions} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exam.submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{averageScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evaluation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {evaluatedSubmissions.length} / {exam.submissions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Score List</CardTitle>
          <CardDescription>Ranked by marks obtained.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Submission Time</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No submissions recorded for this exam.
                  </TableCell>
                </TableRow>
              ) : (
                exam.submissions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.student.name}</TableCell>
                    <TableCell>{sub.student.enrollmentNumber || "-"}</TableCell>
                    <TableCell>
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="font-bold">
                      {sub.status === "Evaluated" ? `${Number(sub.totalScore)} Marks` : "-"}
                    </TableCell>
                    <TableCell>
                      {sub.violationCount > 0 ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {sub.violationCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={sub.status === "Evaluated" ? "default" : "secondary"}>
                        {sub.status}
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
