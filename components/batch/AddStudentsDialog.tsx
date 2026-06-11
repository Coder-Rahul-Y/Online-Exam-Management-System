"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Student {
  id: number
  name: string
  email: string
  enrollmentNumber: string | null
}

interface AddStudentsDialogProps {
  batchId: number
  currentStudentIds: number[]
}

export function AddStudentsDialog({ batchId, currentStudentIds }: AddStudentsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchStudents()
    }
  }, [open])

  const fetchStudents = async () => {
    setFetching(true)
    try {
      const res = await fetch("/api/users?role=Student")
      const data = await res.json()
      // Filter out students already in the batch
      const available = data.filter((s: Student) => !currentStudentIds.includes(s.id))
      setStudents(available)
    } catch (error) {
      toast.error("Failed to fetch students")
    } finally {
      setFetching(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStudent = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return

    setLoading(true)
    try {
      const res = await fetch(`/api/batches/${batchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds })
      })

      if (res.ok) {
        toast.success(`${selectedIds.length} students added to batch`)
        setOpen(false)
        setSelectedIds([])
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to add students")
      }
    } catch (error) {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Existing Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Existing Students to Batch</DialogTitle>
          <DialogDescription>
            Search and select students already registered in the system to add them to this batch.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or enrollment..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md">
          {fetching ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No available students found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleStudent(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedIds.includes(student.id)} 
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://avatar.vercel.sh/${student.email}`} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.email}</span>
                      <span className="text-[10px] font-mono mt-0.5">{student.enrollmentNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex-1 text-sm text-muted-foreground self-center">
            {selectedIds.length} students selected
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || selectedIds.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Selected Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
