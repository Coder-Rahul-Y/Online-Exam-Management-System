"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2, Check } from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface AddMemberDialogProps {
  type: "Department" | "Batch"
  departmentId?: number
  batchId?: number
  targetName: string
  trigger?: React.ReactNode
  departments?: { id: number, name: string }[]
}

export function AddMemberDialog({ 
  type, 
  departmentId, 
  batchId, 
  targetName,
  trigger,
  departments
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departmentId?.toString() || "")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/members/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          type, 
          departmentId: selectedDeptId ? parseInt(selectedDeptId) : departmentId, 
          batchId 
        })
      })

      if (res.ok) {
        const target = departments?.find(d => d.id === parseInt(selectedDeptId))?.name || targetName
        toast.success(`User added to ${target}`)
        setOpen(false)
        setEmail("")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to add member")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {targetName}</DialogTitle>
          <DialogDescription>
            Directly add a user to a {type.toLowerCase()} by their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {type === "Department" && departments && departments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department">Select Department</Label>
              <Select onValueChange={setSelectedDeptId} value={selectedDeptId}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The user must already have an account in the system.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (type === "Department" && !selectedDeptId)}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Add Directly
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
