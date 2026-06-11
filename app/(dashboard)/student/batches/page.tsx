import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, GraduationCap, Building2, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function StudentBatchesPage() {
  const session = await auth()
  const userId = parseInt(session?.user.id as string)

  const studentWithBatches = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentBatches: {
        include: {
          batch: {
            include: {
              instructor: { select: { name: true, email: true } },
              _count: { select: { studentBatches: true } }
            }
          }
        }
      }
    }
  })

  const batches = studentWithBatches?.studentBatches.map(sb => sb.batch) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Batches</h1>
        <p className="text-muted-foreground">Manage and view all the academic batches you are currently enrolled in.</p>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Not enrolled in any batches</p>
            <p className="text-sm text-muted-foreground">Join a department to get assigned to batches.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="group hover:shadow-lg transition-all duration-200 border-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                    {batch.instructor.name}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">
                    Active
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {batch.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {batch.description || "Comprehensive course batch for academic excellence."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Instructor</span>
                      <span className="font-medium">{batch.instructor.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-secondary/5 rounded-full">
                      <Users className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Peer Group</span>
                      <span className="font-medium">{batch._count.studentBatches} Students</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Enrollment active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
