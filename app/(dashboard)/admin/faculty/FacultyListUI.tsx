"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { AddMemberDialog } from "@/components/shared/AddMemberDialog"

export function FacultyListUI({ instructors, department, deptId, allDepartments }: any) {
  const [removingId, setRemovingId] = useState<number | null>(null)
  const router = useRouter()

  const removeMember = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this instructor from the department?")) return

    setRemovingId(userId)
    try {
      const res = await fetch(`/api/departments/${deptId}/members/${userId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Instructor removed")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to remove instructor")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Directory</h1>
          <p className="text-muted-foreground">Manage instructors within your department.</p>
        </div>
        <AddMemberDialog 
          type="Department"
          departmentId={deptId} 
          targetName={department?.name || "Department"} 
          departments={allDepartments}
          trigger={
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Instructor
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Exams Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No instructors found in this department.
                  </TableCell>
                </TableRow>
              ) : (
                instructors.map((instructor: any) => (
                  <TableRow key={instructor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${instructor.email}`} />
                          <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{instructor.name}</span>
                          <span className="text-xs text-muted-foreground">{instructor.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{instructor.username}</TableCell>
                    <TableCell>{instructor._count.examsCreated} Exams</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="View Exams">
                        <Link href={`/admin/faculty/${instructor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Remove from Dept"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeMember(instructor.id)}
                        disabled={removingId === instructor.id}
                      >
                        {removingId === instructor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
