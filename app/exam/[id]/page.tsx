"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useExamTimer } from "@/hooks/useExamTimer"
import { useVisibilityGuard } from "@/hooks/useVisibilityGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { toast } from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import screenfull from "screenfull"

export default function LiveExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const examId = parseInt(id)

  const [exam, setExam] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [responses, setResponses] = useState<Record<number, number>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const submissionRef = useRef<any>(null)

  // Fullscreen management
  useEffect(() => {
    if (!screenfull.isEnabled) return

    const handleChange = () => {
      if (!screenfull.isFullscreen) {
        toast.error("Warning: Please stay in fullscreen during the exam.", {
          duration: 5000,
          icon: "⚠️",
        })

        const sub = submissionRef.current
        if (sub?.id && sub?.status === "In_Progress") {
          fetch(`/api/submissions/${sub.id}/violation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "FULLSCREEN_EXIT" }),
          }).catch(() => {})
        }
      }
    }

    screenfull.on("change", handleChange)
    return () => {
      screenfull.off("change", handleChange)
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit()
      }
    }
  }, [])

  // Fetch exam and start/resume submission
  useEffect(() => {
    const controller = new AbortController()

    async function initExam() {
      try {
        const subRes = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId }),
          signal: controller.signal,
        })

        if (!subRes.ok) {
          const err = await subRes.json()
          toast.error(err.message || "Failed to start exam")
          router.push("/student")
          return
        }

        const subData = await subRes.json()
        setSubmission(subData)
        submissionRef.current = subData

        const examRes = await fetch(`/api/exams/${examId}/questions`, {
          signal: controller.signal,
        })

        if (!examRes.ok) {
          const err = await examRes.json()
          toast.error(err.message || "Failed to load exam questions")
          router.push("/student")
          return
        }
        const examData = await examRes.json()

        if (!Array.isArray(examData) || examData.length === 0) {
          toast.error("This exam has no questions yet. Please contact your instructor.")
          router.push("/student")
          return
        }
        setExam(examData)

        // Load existing responses if resuming
        if (subData.responses) {
          const loadedResponses: Record<number, number> = {}
          subData.responses.forEach((r: any) => {
            loadedResponses[r.questionId] = r.selectedOptionId
          })
          setResponses(loadedResponses)
        }

        // Enter fullscreen after exam loads
        if (screenfull.isEnabled) {
          screenfull.request(document.documentElement).catch(() => {
            // Silently ignore if user denies permission
          })
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return  // StrictMode cleanup — ignore
        toast.error("Error initializing exam")
        router.push("/student")
      }
    }

    initExam()
    return () => controller.abort()
  }, [examId, router])

  const handleFinalSubmit = useCallback(async () => {
    if (!submission?.id) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/submissions/${submission.id}/submit`, {
        method: "POST",
      })
      if (response.ok) {
        if (screenfull.isEnabled && screenfull.isFullscreen) {
          await screenfull.exit()
        }
        toast.success("Exam submitted successfully!")
        router.push("/student/results")
      } else {
        toast.error("Failed to submit exam")
      }
    } catch (error) {
      toast.error("Connection error during submission")
    } finally {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }, [submission?.id, router])

  // Timer setup
  const expiryDate = (exam && submission)
    ? new Date(new Date(submission.startedAt).getTime() + submission.durationMinutes * 60 * 1000)
    : null
  const { timeLeftFormatted } = useExamTimer(expiryDate, handleFinalSubmit)

  // Anti-cheat
  useVisibilityGuard(!!submission && submission.status === "In_Progress", submission?.id)

  const handleOptionSelect = async (questionId: number, optionId: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: optionId }))
    setSaveStatus("saving")

    try {
      await fetch(`/api/submissions/${submission.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOptionId: optionId }),
      })
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 1500)
    } catch (error) {
      console.error("Auto-save failed")
      setSaveStatus("error")
    }
  }

  const toggleMarkForReview = (questionId: number) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  if (!exam || !submission)
    return <div className="h-screen flex items-center justify-center">Loading Exam...</div>

  const currentQuestion = exam[currentQuestionIdx]
  const isLastQuestion = currentQuestionIdx === exam.length - 1
  const isCurrentMarked = markedForReview.has(currentQuestion.id)
  const markedCount = markedForReview.size

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Exam Header */}
      <header className="h-16 bg-card border-b px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg truncate max-w-md">Online Exam System</h2>
          <Badge variant="outline">
            Q{currentQuestionIdx + 1} of {exam.length}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save status */}
          <div className="text-xs flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" /> Save failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-primary font-mono text-xl font-bold bg-primary/5 px-4 py-1 rounded-md border border-primary/20">
            <Clock className="h-5 w-5" />
            {timeLeftFormatted}
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowSubmitModal(true)}>
            Finish Exam
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl py-12 px-4 mx-auto">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-start mb-4">
              <Badge>Question {currentQuestionIdx + 1}</Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestion.marksAwarded} Marks
              </span>
            </div>
            <CardTitle className="text-2xl leading-relaxed">
              {currentQuestion.questionText}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {currentQuestion.options.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:bg-muted/50 ${
                    responses[currentQuestion.id] === option.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-muted"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      responses[currentQuestion.id] === option.id
                        ? "border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {responses[currentQuestion.id] === option.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-medium">{option.optionText}</span>
                </button>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6 bg-muted/5">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
              disabled={currentQuestionIdx === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className={isCurrentMarked ? "text-orange-600 gap-2 bg-orange-50" : "text-orange-600 gap-2"}
                onClick={() => toggleMarkForReview(currentQuestion.id)}
              >
                <Flag className="h-4 w-4" />
                {isCurrentMarked ? "Marked" : "Mark for Review"}
              </Button>

              {isLastQuestion ? (
                <Button
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowSubmitModal(true)}
                >
                  <Send className="h-4 w-4" /> Final Submit
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                  className="gap-2"
                >
                  Next Question <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Question Navigator */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {exam.map((_: any, idx: number) => {
            const qId = exam[idx].id
            const isCurrent = currentQuestionIdx === idx
            const isMarked = markedForReview.has(qId)
            const isAnswered = !!responses[qId]

            let cls = "border-muted hover:border-primary/30"
            if (isCurrent) cls = "border-primary bg-primary text-white"
            else if (isMarked) cls = "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-400"
            else if (isAnswered) cls = "border-green-500 bg-green-50 text-green-700"

            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`h-10 w-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${cls}`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to submit?</DialogTitle>
            <DialogDescription>
              You have answered {Object.keys(responses).length} out of {exam.length} questions.
              Once submitted, you cannot change your answers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {markedCount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800">
                <Flag className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  {markedCount} question{markedCount > 1 ? "s" : ""} marked for review.
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Please review your answers before finalizing.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Yes, Submit Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
