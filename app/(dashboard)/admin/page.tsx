import { auth } from "@/lib/auth"
import { EditDepartmentDialog } from "@/components/admin/EditDepartmentDialog"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, GraduationCap, Building2 } from "lucide-react"

export default async function AdminDashboard() {
  const session = await auth()
  const deptId = (session?.user as any).departmentId

  const department = deptId 
    ? await prisma.department.findUnique({ where: { id: deptId } })
    : null

  // Fetch real stats for the department
  const [userCount, instructorCount, examCount, batchCount, recentUsers, recentLogs] = await Promise.all([
    deptId ? prisma.user.count({ where: { departmentId: deptId } }) : 0,
    deptId ? prisma.user.count({ where: { role: "Instructor", departmentId: deptId } }) : 0,
    deptId ? prisma.exam.count({ where: { instructor: { departmentId: deptId } } }) : 0,
    deptId ? prisma.batch.count({ where: { instructor: { departmentId: deptId } } }) : 0,
    prisma.user.findMany({
      where: deptId ? { departmentId: deptId } : {},
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, resourceType: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: "Department Users", value: userCount.toString(), icon: Users, color: "text-blue-600" },
    { label: "Faculty Members", value: instructorCount.toString(), icon: GraduationCap, color: "text-green-600" },
    { label: "Active Exams", value: examCount.toString(), icon: BookOpen, color: "text-purple-600" },
    { label: "Total Batches", value: batchCount.toString(), icon: Building2, color: "text-orange-600" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {department?.name || "Admin Overview"}
          </h1>
          <p className="text-muted-foreground">Monitor system statistics and managed entities.</p>
        </div>
        {department && (
          <EditDepartmentDialog id={department.id} initialName={department.name} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.resourceType}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
