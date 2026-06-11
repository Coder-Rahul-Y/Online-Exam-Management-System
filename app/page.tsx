import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (session) {
    const role = session.user.role
    if (role === "Admin") redirect("/admin")
    if (role === "Instructor") redirect("/instructor")
    if (role === "Student") redirect("/student")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted px-4 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6">
        Online Examination <span className="text-primary">Management System</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-10">
        A secure, robust, and efficient platform for conducting and managing examinations digitally.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/register">Get Started</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/login">Login</Link>
        </Button>
      </div>
      
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl">
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <h3 className="text-lg font-bold mb-2">For Admins</h3>
          <p className="text-sm text-muted-foreground">Manage users, departments, and monitor system-wide activity.</p>
        </div>
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <h3 className="text-lg font-bold mb-2">For Instructors</h3>
          <p className="text-sm text-muted-foreground">Create exams, manage question banks, and view detailed results.</p>
        </div>
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <h3 className="text-lg font-bold mb-2">For Students</h3>
          <p className="text-sm text-muted-foreground">Take examinations in a secure environment and get instant feedback.</p>
        </div>
      </div>
    </div>
  )
}
