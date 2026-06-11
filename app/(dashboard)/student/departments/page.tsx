import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, GraduationCap, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function StudentDepartmentsPage() {
  const session = await auth()
  const userId = parseInt(session?.user.id as string)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: true,
      studentBatches: {
        include: {
          batch: {
            include: {
              instructor: { select: { name: true } },
              _count: { select: { studentBatches: true } }
            }
          }
        }
      }
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Department & Batches</h1>
        <p className="text-muted-foreground">View your academic department and enrolled batches.</p>
      </div>

      {!user?.department ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">You are not enrolled in any department yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 pb-2 border-b">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{user.department.name}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {user.studentBatches.length === 0 ? (
              <Card className="bg-muted/30 border-dashed col-span-full">
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  You are in this department but haven&apos;t joined any batches yet.
                </CardContent>
              </Card>
            ) : (
              user.studentBatches.map(({ batch }) => (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">
                      {batch.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-primary/10 rounded">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium">{batch.instructor.name}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{batch._count.studentBatches} Students</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Enrolled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
