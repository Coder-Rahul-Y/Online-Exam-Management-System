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
import { ArrowLeft, Users as UsersIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AssignBatchButton, RemoveBatchButton } from "@/components/instructor/BatchManageButtons"

export default async function ExamBatchesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const examId = parseInt(id)
  
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examBatches: {
        include: {
          batch: {
            include: {
              _count: {
                select: { studentBatches: true },
              },
            },
          },
        },
      },
    },
  })

  if (!exam) notFound()

  // Fetch all batches to show in a selector (simplified for now as a list of available)
  const allBatches = await prisma.batch.findMany({
    where: {
      examBatches: {
        none: { examId: examId }
      }
    },
    include: {
      _count: {
        select: { studentBatches: true }
      }
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/instructor/exams/${examId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Batches</h1>
          <p className="text-muted-foreground">Select student groups authorized to take this exam.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Assigned Batches</CardTitle>
            <CardDescription>
              Students in these batches will see the exam on their dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exam.examBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No batches assigned yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  exam.examBatches.map((eb) => (
                    <TableRow key={eb.batch.id}>
                      <TableCell className="font-medium">{eb.batch.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-3 w-3 text-muted-foreground" />
                          {eb.batch._count.studentBatches}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <RemoveBatchButton examId={examId} batchId={eb.batch.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Available Batches</CardTitle>
            <CardDescription>
              Other batches in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 italic">
                No other batches available.
              </p>
            ) : (
              allBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{batch.name}</p>
                    <p className="text-xs text-muted-foreground">{batch._count.studentBatches} students</p>
                  </div>
                  <AssignBatchButton examId={examId} batchId={batch.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
