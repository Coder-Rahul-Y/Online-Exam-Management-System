"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "react-hot-toast"
import { CalendarIcon, Clock, Save, Trash2, Lock } from "lucide-react"

interface ExamEditFormProps {
  exam: {
    id: number
    title: string
    startDatetime: string | Date
    durationMinutes: number
  }
  hasStarted?: boolean
}

export function ExamEditForm({ exam, hasStarted = false }: ExamEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format date for the input
  const dateObj = new Date(exam.startDatetime)
  const initialDate = dateObj.toISOString().split('T')[0]
  const initialTime = dateObj.toTimeString().split(' ')[0].substring(0, 5)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      title: exam.title,
      startDate: initialDate,
      startTime: initialTime,
      durationMinutes: exam.durationMinutes,
    }
  })

  const onSubmit = async (data: any) => {
    const { startDate, startTime, ...rest } = data;
    const startDatetime = new Date(`${startDate}T${startTime}`);
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, startDatetime }),
      })

      if (response.ok) {
        toast.success("Exam updated successfully!")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update exam")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/exams/${exam.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Exam deleted")
        router.push("/instructor/exams")
        router.refresh()
      } else {
        toast.error("Failed to delete exam")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              {hasStarted
                ? "This exam has already started and cannot be modified."
                : "Update the basic configuration of your exam."}
            </CardDescription>
          </div>
          {hasStarted && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              Read-only
            </div>
          )}
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <Field>
            <FieldLabel>Exam Title</FieldLabel>
            <Input
              placeholder="e.g., Mid-Term Mathematics 2026"
              disabled={hasStarted}
              {...register("title", { required: "Title is required" })}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date
              </FieldLabel>
              <Input
                type="date"
                disabled={hasStarted}
                {...register("startDate", { required: "Date is required" })}
              />
              <FieldError errors={[errors.startDate]} />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </FieldLabel>
              <Input
                type="time"
                disabled={hasStarted}
                {...register("startTime", { required: "Time is required" })}
              />
              <FieldError errors={[errors.startTime]} />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (Minutes)
              </FieldLabel>
              <Input
                type="number"
                disabled={hasStarted}
                {...register("durationMinutes", {
                  required: "Duration is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Duration must be positive" }
                })}
              />
              <FieldError errors={[errors.durationMinutes]} />
            </Field>
          </div>
        </CardContent>
        {!hasStarted && (
          <CardFooter className="flex justify-between border-t p-6 mt-6">
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Exam
            </Button>
            <Button type="submit" disabled={isLoading || isDeleting}>
              {isLoading ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  )
}
