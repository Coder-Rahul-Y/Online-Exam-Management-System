"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Search, Users, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Student {
  id: number
  name: string
  email: string
  enrollmentNumber: string | null
}

interface Batch {
  id: number
  name: string
}

interface AssignBatchDialogProps {
  students: Student[]
  batches: Batch[]
}

export function AssignBatchDialog({ students, batches }: AssignBatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<string>("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedBatchId || selectedStudentIds.length === 0) return

    setLoading(true)
    try {
      const res = await fetch(`/api/batches/${selectedBatchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      })

      if (res.ok) {
        toast.success(`Assigned ${selectedStudentIds.length} students to batch`)
        setOpen(false)
        setSelectedStudentIds([])
        setSelectedBatchId("")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to assign students")
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
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assign to Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col h-[85vh]">
        <DialogHeader>
          <DialogTitle>Assign Students to Batch</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Target Batch</Label>
            <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a batch..." />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md">
          {filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground italic">
              No students found.
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleStudent(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedStudentIds.includes(student.id)} 
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${student.email}`} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {student.enrollmentNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex-1 text-sm text-muted-foreground self-center">
            {selectedStudentIds.length} students selected
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedBatchId || selectedStudentIds.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
