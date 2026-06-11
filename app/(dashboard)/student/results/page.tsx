import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function StudentResultsPage() {
  const session = await auth()
  const studentId = parseInt(session?.user.id as string)

  const submissions = await prisma.examSubmission.findMany({
    where: { studentId, status: "Evaluated" },
    include: {
      exam: {
        include: {
          instructor: { select: { name: true } },
          _count: { select: { questions: true } }
        }
      }
    },
    orderBy: { submittedAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground">Detailed scorecards and feedback for your examinations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graded Examinations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No graded exams found.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.exam.title}</TableCell>
                    <TableCell>{new Date(sub.submittedAt!).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {sub.totalScore.toString()} Marks
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
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Evaluated
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href={`/student/results/${sub.id}`}>
                          <FileText className="h-4 w-4" />
                          View Scorecard
                          <ChevronRight className="h-4 w-4" />
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
