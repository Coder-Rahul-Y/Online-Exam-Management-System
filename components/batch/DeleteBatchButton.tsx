"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

export function DeleteBatchButton({ batchId }: { batchId: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Delete this batch? This will remove all student enrollments in it.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Batch deleted")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to delete batch")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={loading}
      title="Delete batch"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
