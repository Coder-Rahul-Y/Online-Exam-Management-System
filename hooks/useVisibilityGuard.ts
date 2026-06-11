import { useEffect, useRef } from "react"
import { toast } from "react-hot-toast"

export function useVisibilityGuard(enabled: boolean = true, submissionId?: number) {
  const warningCount = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        warningCount.current += 1
        toast.error(`Warning ${warningCount.current}: Please do not switch tabs or windows during the exam.`, {
          duration: 5000,
          icon: '⚠️',
        })

        if (submissionId) {
          fetch(`/api/submissions/${submissionId}/violation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "TAB_SWITCH" }),
          }).catch(() => {})
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, submissionId])

  return { warningCount: warningCount.current }
}
