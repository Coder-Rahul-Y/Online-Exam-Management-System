"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, BookOpen, PlayCircle } from "lucide-react"
import Link from "next/link"

type Exam = {
  id: number
  title: string
  startDatetime: Date | string
  durationMinutes: number
  _count: { questions: number }
  submissions: Array<{ status: string }>
}

export function ActiveExamList({ exams }: { exams: Exam[] }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Collect every transition point: each exam's start time and end time.
    // Fire a tick at the nearest one so the UI updates exactly when needed.
    const scheduleNextTick = () => {
      const current = new Date()
      const transitionTimes = exams
        .flatMap((e) => {
          const start = new Date(e.startDatetime)
          const end = new Date(start.getTime() + e.durationMinutes * 60 * 1000)
          return [start, end]
        })
        .filter((t) => t > current)
        .sort((a, b) => a.getTime() - b.getTime())

      if (transitionTimes.length === 0) return undefined

      const delay = transitionTimes[0].getTime() - current.getTime()
      return setTimeout(() => {
        setNow(new Date())
        scheduleNextTick()
      }, delay + 200) // +200 ms to land safely past the boundary
    }

    const timer = scheduleNextTick()
    return () => { if (timer !== undefined) clearTimeout(timer) }
  }, [exams])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-primary" />
        Active &amp; Upcoming Exams
      </h2>
      <div className="space-y-4">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No upcoming exams assigned.</p>
        ) : (
          exams.map((exam) => {
            const startTime = new Date(exam.startDatetime)
            const endTime = new Date(startTime.getTime() + exam.durationMinutes * 60 * 1000)
            const isLive = now >= startTime && now < endTime
            const isExpired = now >= endTime
            const submission = exam.submissions[0]

            return (
              <Card key={exam.id} className={isLive ? "border-primary/50 shadow-md" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <Badge
                      variant={isExpired ? "secondary" : isLive ? "destructive" : "secondary"}
                      className={isExpired ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : ""}
                    >
                      {isExpired ? "Expired" : isLive ? "Live" : "Upcoming"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {startTime.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {exam.durationMinutes}m
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {exam._count.questions} Qs
                    </span>
                  </div>
                  {isLive ? (
                    <Button asChild>
                      <Link href={`/exam/${exam.id}`}>
                        {submission ? "Resume Exam" : "Start Exam"}
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled>
                      {isExpired ? "Time's Up" : "Start Exam"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
