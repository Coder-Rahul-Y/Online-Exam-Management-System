"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type Submission = {
  student: { name: string; email: string; enrollmentNumber: string | null }
  submittedAt: Date | null
  totalScore: { toString(): string } | number | string | null
  status: string
}

export function ExportCsvButton({ examTitle, submissions }: { examTitle: string; submissions: Submission[] }) {
  function handleExport() {
    const header = ["Name", "Email", "Enrollment", "Submitted At", "Score", "Status"]
    const rows = submissions.map((s) => [
      s.student.name,
      s.student.email,
      s.student.enrollmentNumber ?? "",
      s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "N/A",
      s.status === "Evaluated" ? String(Number(s.totalScore)) : "",
      s.status,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${examTitle.replace(/\s+/g, "_")}_results.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  )
}
