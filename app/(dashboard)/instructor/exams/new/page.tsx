"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "react-hot-toast"
import { CalendarIcon, Clock } from "lucide-react"

export default function NewExamPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      durationMinutes: 60,
    }
  })

  const onSubmit = async (data: any) => {
    const { startDate, startTime, ...rest } = data;
    
    if (!startDate || !startTime) {
      toast.error("Please select both date and time")
      return
    }

    const startDatetime = new Date(`${startDate}T${startTime}`);
    
    setIsLoading(true)
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, startDatetime }),
      })

      if (response.ok) {
        const exam = await response.json()
        toast.success("Exam created successfully!")
        router.push(`/instructor/exams/${exam.id}/questions`)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create exam")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Exam</CardTitle>
          <CardDescription>
            Set the basic details for your examination. You can add questions in the next step.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <Field>
              <FieldLabel>Exam Title</FieldLabel>
              <Input 
                placeholder="e.g., Mid-Term Mathematics 2026"
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
          <CardFooter className="flex justify-between border-t p-6 mt-6">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Continue to Questions"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
