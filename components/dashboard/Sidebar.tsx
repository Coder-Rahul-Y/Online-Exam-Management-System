"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  LogOut,
  ChevronRight,
  GraduationCap
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/faculty", label: "Faculty", icon: Users },
    { href: "/admin/batches", label: "Batches", icon: Users },
    { href: "/admin/students", label: "Students", icon: GraduationCap },
    { href: "/admin/exams", label: "Exams", icon: BookOpen },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  ]

  const instructorLinks = [
    { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instructor/exams", label: "Manage Exams", icon: BookOpen },
    { href: "/instructor/batches", label: "Student Batches", icon: Users },
    { href: "/instructor/students", label: "My Students", icon: GraduationCap },
  ]

  const studentLinks = [
    { href: "/student/departments", label: "My Department", icon: Building2 },
    { href: "/student/batches", label: "My Batches", icon: Users },
    { href: "/student", label: "Exams", icon: BookOpen },
    { href: "/student/results", label: "My Results", icon: ClipboardList },
  ]

  const links = role === "Admin" ? adminLinks : role === "Instructor" ? instructorLinks : studentLinks

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <BookOpen className="h-6 w-6" />
          <span>OEMS</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <link.icon className="h-4 w-4" />
              {link.label}
            </div>
            {pathname === link.href && <ChevronRight className="h-4 w-4" />}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
