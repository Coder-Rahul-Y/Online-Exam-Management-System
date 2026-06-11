"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

export function AssignBatchButton({ examId, batchId }: { examId: number; batchId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAssign() {
    setLoading(true)
    try {
      const res = await fetch(`/api/exams/${examId}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchIds: [batchId] }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || "Failed to assign batch")
        return
      }
      toast.success("Batch assigned")
      router.refresh()
    } catch {
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="secondary" className="flex gap-2" onClick={handleAssign} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
      Assign
    </Button>
  )
}

export function RemoveBatchButton({ examId, batchId }: { examId: number; batchId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/exams/${examId}/batches?batchId=${batchId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || "Failed to remove batch")
        return
      }
      toast.success("Batch removed")
      router.refresh()
    } catch {
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive"
      onClick={handleRemove}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
