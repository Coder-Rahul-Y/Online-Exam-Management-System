import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendResultEmail({
  to,
  studentName,
  examTitle,
  totalScore,
  totalMarks,
  submittedAt,
  scorecardUrl,
}: {
  to: string
  studentName: string
  examTitle: string
  totalScore: number
  totalMarks: number
  submittedAt: Date
  scorecardUrl: string
}) {
  const percentage = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : "0.0"

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Your result for "${examTitle}" is ready`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="color:#2563eb">Exam Result</h2>
        <p>Hi ${studentName},</p>
        <p>Your submission for <strong>${examTitle}</strong> has been graded.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr>
            <td style="padding:8px 12px;background:#f1f5f9;font-weight:600;border:1px solid #e2e8f0">Score</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${totalScore} / ${totalMarks} marks (${percentage}%)</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f1f5f9;font-weight:600;border:1px solid #e2e8f0">Submitted At</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${new Date(submittedAt).toLocaleString()}</td>
          </tr>
        </table>
        <p>
          <a href="${scorecardUrl}"
             style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
            View Full Scorecard
          </a>
        </p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          This is an automated message from the Online Exam System. Please do not reply.
        </p>
      </div>
    `,
  })
}
