"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface RemoveStudentButtonProps {
  batchId: number
  studentId: number
}

export function RemoveStudentButton({ batchId, studentId }: RemoveStudentButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this student from the batch?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/batches/${batchId}/students?studentId=${studentId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Student removed from batch")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to remove student")
      }
    } catch (error) {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-destructive hover:bg-destructive/10"
      onClick={handleRemove}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
