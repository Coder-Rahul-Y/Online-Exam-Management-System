import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { UsersTable } from "@/components/admin/UsersTable"

export default async function UsersPage() {
  let users: any[] = []
  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Database error:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">View and manage all registered users in the system.</p>
        </div>
        <Button asChild>
          <Link href="/register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
