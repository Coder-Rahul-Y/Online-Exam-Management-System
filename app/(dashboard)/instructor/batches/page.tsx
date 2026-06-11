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
import { Button } from "@/components/ui/button"
import { Users as UsersIcon, Edit, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { BatchDialog } from "@/components/batch/BatchDialog"
import { DeleteBatchButton } from "@/components/batch/DeleteBatchButton"

export default async function InstructorBatchesPage() {
  const session = await auth()
  if (!session) return null

  const instructorId = parseInt(session.user.id)

  const batches = await prisma.batch.findMany({
    where: { instructorId: instructorId },
    include: {
      _count: {
        select: { studentBatches: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Batches</h1>
          <p className="text-muted-foreground">Manage students and groups you are instructing.</p>
        </div>
        <BatchDialog />
      </div>

      <div className="grid gap-6">
        {batches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No batches yet</p>
                <p className="text-sm text-muted-foreground">Create your first batch to start managing students.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>My Batches</CardTitle>
              <CardDescription>All academic groups currently under your instruction.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Enrolled Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{batch.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-primary/60" />
                          <span className="font-medium">{batch._count.studentBatches}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/instructor/batches/${batch.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteBatchButton batchId={batch.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
