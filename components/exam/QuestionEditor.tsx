"use client"

import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { questionSchema, type QuestionInput } from "@/lib/validations/exam.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface QuestionEditorProps {
  examId: number
  onSuccess?: () => void
}

export function QuestionEditor({ examId, onSuccess }: QuestionEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      marksAwarded: 1,
      options: [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  })

  const onSubmit = async (data: QuestionInput) => {
    // Exactly one option must be correct
    const correctCount = data.options.filter(o => o.isCorrect).length
    if (correctCount !== 1) {
      toast.error("Please mark exactly one option as correct")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Question added!")
        reset()
        router.refresh()
        if (onSuccess) onSuccess()
      } else {
        toast.error("Failed to add question")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Add New Question</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <Field>
            <FieldLabel>Question Text</FieldLabel>
            <Textarea 
              placeholder="Enter your question here..."
              className="min-h-[100px]"
              {...register("questionText")}
            />
            <FieldError errors={[errors.questionText]} />
          </Field>

          <Field>
            <FieldLabel>Marks</FieldLabel>
            <Input 
              type="number" 
              step="0.5"
              {...register("marksAwarded", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.marksAwarded]} />
          </Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FieldLabel>Options</FieldLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => append({ optionText: "", isCorrect: false })}
                disabled={fields.length >= 6}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start">
                <Field className="flex-1">
                  <div className="flex gap-2 items-center">
                    <Controller
                      control={control}
                      name={`options.${index}.isCorrect` as const}
                      render={({ field }) => (
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Input 
                      placeholder={`Option ${index + 1}`}
                      {...register(`options.${index}.optionText` as const)}
                    />
                  </div>
                  <FieldError errors={[errors.options?.[index]?.optionText]} />
                </Field>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive mt-1"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <FieldError errors={[errors.options?.root]} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Add Question to Exam"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
