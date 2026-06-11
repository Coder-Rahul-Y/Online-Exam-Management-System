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
import { UserPlus, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { notFound } from "next/navigation"
import { RemoveStudentButton } from "@/components/batch/RemoveStudentButton"
import { AddMemberDialog } from "@/components/shared/AddMemberDialog"

export default async function InstructorBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const batchId = parseInt(id)

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      studentBatches: {
        include: {
          student: {
            select: { id: true, name: true, email: true, enrollmentNumber: true },
          },
        },
      },
      examBatches: {
        include: {
          exam: {
            include: { instructor: { select: { name: true } } }
          }
        }
      }
    },
  })

  if (!batch) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/instructor/batches">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
          <p className="text-muted-foreground">{batch.description || "No description provided."}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                Currently {batch.studentBatches.length} students in this batch.
              </CardDescription>
            </div>
            <AddMemberDialog
              type="Batch"
              batchId={batchId}
              targetName={batch.name}
              trigger={
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.studentBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No students enrolled in this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  batch.studentBatches.map((sb) => (
                    <TableRow key={sb.student.id}>
                      <TableCell className="font-medium">{sb.student.name}</TableCell>
                      <TableCell>{sb.student.enrollmentNumber || "-"}</TableCell>
                      <TableCell>{sb.student.email}</TableCell>
                      <TableCell className="text-right">
                        <RemoveStudentButton batchId={batchId} studentId={sb.student.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="md:col-span-1 space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Batch Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                <p className="text-sm">{batch.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-md">Assigned Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batch.examBatches.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No exams assigned to this batch.</p>
                ) : (
                  batch.examBatches.map((eb) => (
                    <div key={eb.exam.id} className="p-2 rounded-md border bg-muted/20">
                      <p className="text-sm font-medium">{eb.exam.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">By {eb.exam.instructor.name}</p>
                      <Button variant="link" size="sm" asChild className="h-auto p-0 mt-2 text-xs">
                        <Link href={`/instructor/exams/${eb.exam.id}`}>View Exam Details</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
