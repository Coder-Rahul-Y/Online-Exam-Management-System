"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Loader2, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"

export function DepartmentOnboarding() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, setupAdmin: true }) // New flag to signal assignment
      })

      if (res.ok) {
        toast.success("Department established! Welcome to your dashboard.")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to create department")
      }
    } catch (error) {
      toast.error("An error occurred during setup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome, Administrator</CardTitle>
          <CardDescription>
            To begin managing your academic unit, you first need to establish your department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Official Department Name</Label>
              <Input 
                id="dept-name" 
                placeholder="e.g. Department of Physics" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                This will be the primary name used for batches, exams, and student records.
              </p>
            </div>
            <Button className="w-full h-12 text-md gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Initialize Department
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
