import { z } from "zod";

export const examSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  startDatetime: z.string().transform((str) => new Date(str)),
  durationMinutes: z.number().int().positive("Duration must be positive"),
});

export const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  marksAwarded: z.number().positive("Marks must be positive"),
  options: z.array(z.object({
    optionText: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean(),
  })).min(2, "At least 2 options are required").max(6, "Maximum 6 options allowed"),
});

export type ExamInput = z.infer<typeof examSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
