import { useState, useEffect } from "react"

export function useExamTimer(expiryTimestamp: Date | null, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    // Don't start the timer until the exam data is fully loaded
    if (!expiryTimestamp) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiryTimestamp).getTime()
      const difference = Math.max(0, expiry - now)
      return Math.floor(difference / 1000)
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(timer)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiryTimestamp, onExpire])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return [
      hours > 0 ? hours.toString().padStart(2, "0") : null,
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].filter(Boolean).join(":")
  }

  return { timeLeft, timeLeftFormatted: formatTime(timeLeft) }
}
