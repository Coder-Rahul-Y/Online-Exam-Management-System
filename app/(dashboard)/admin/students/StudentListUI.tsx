"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Loader2, UserPlus, Pencil } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { StudentDialog } from "@/components/instructor/StudentDialog"
import { AssignBatchDialog } from "@/components/instructor/AssignBatchDialog"
import { AddMemberDialog } from "@/components/shared/AddMemberDialog"

export function StudentListUI({ students, departments, batches, deptId }: any) {
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [editStudent, setEditStudent] = useState<{ id: number; name: string; enrollmentNumber: string | null } | null>(null)
  const [enrollmentInput, setEnrollmentInput] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const openEdit = (student: any) => {
    setEditStudent({ id: student.id, name: student.name, enrollmentNumber: student.enrollmentNumber })
    setEnrollmentInput(student.enrollmentNumber || "")
  }

  const saveEnrollment = async () => {
    if (!editStudent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNumber: enrollmentInput }),
      })
      if (res.ok) {
        toast.success("Enrollment number updated")
        setEditStudent(null)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to update")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this student from the department?")) return

    setRemovingId(userId)
    try {
      const res = await fetch(`/api/departments/${deptId}/members/${userId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Student removed")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to remove student")
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
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-muted-foreground">Manage all students within your department.</p>
        </div>
        <div className="flex gap-2">
          <AddMemberDialog 
            type="Department"
            departmentId={deptId}
            targetName={departments[0]?.name || "Department"}
            departments={departments}
            trigger={
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Student
              </Button>
            }
          />
          <AssignBatchDialog students={students} batches={batches} />
          <StudentDialog departments={departments} batches={batches} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No students found in this department.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${student.email}`} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{student.name}</span>
                          <span className="text-xs text-muted-foreground">{student.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{student.enrollmentNumber || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.studentBatches.length > 0 ? (
                          student.studentBatches.map((sb: any) => (
                            <Badge key={sb.batchId} variant="secondary" className="text-[10px] px-1 h-5">
                              {sb.batch.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No batch</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Enrollment Number"
                        onClick={() => openEdit(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove from Dept"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeMember(student.id)}
                        disabled={removingId === student.id}
                      >
                        {removingId === student.id ? (
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
      <Dialog open={!!editStudent} onOpenChange={(open) => { if (!open) setEditStudent(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Enrollment Number</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{editStudent?.name}</p>
          <Input
            placeholder="e.g. CSB21001"
            value={enrollmentInput}
            onChange={(e) => setEnrollmentInput(e.target.value)}
            maxLength={50}
            disabled={saving}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudent(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEnrollment} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
