# System Architecture — Online Examination Management System (OEMS)

## Overview

OEMS is a role-based web application for managing online examinations in an academic setting. It supports three user roles — **Admin**, **Instructor**, and **Student** — each with dedicated workflows. The system handles department and batch management, exam creation and assignment, real-time exam-taking with anti-cheat measures, auto-grading, and a full audit trail.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Component System | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS 4 |
| Authentication | NextAuth v5 (JWT strategy, CredentialsProvider) |
| ORM | Prisma 7 |
| Database | PostgreSQL via Neon serverless |
| Validation | Zod + react-hook-form |
| Password Hashing | bcryptjs |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                     │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│   │  Auth Pages │  │  Dashboard   │  │   Exam Interface  │  │
│   │  /login     │  │  /admin      │  │   /exam/[id]      │  │
│   │  /register  │  │  /instructor │  │   (timer, guards) │  │
│   └─────────────┘  │  /student    │  └───────────────────┘  │
│                    └──────────────┘                         │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                     Next.js Server                          │
│                                                             │
│   ┌───────────────┐   ┌─────────────────────────────────┐   │
│   │  middleware.ts│   │ App Router (API Categories)     │   │
│   │  Route Guards │   │ - Auth · Users · Departments    │   │
│   │  Role-Based   │   │ - Batches · Exams · Members     │   │
│   │  Redirects    │   │ - Submissions · Audit Logs      │   │
│   └───────────────┘   └────────┬────────────────────────┘   │
│                                │                            │
└────────────────────────────────┼────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                PostgreSQL (Neon Serverless)                 │
│                                                             │
│  Users · Departments · Batches · StudentBatches · Exams     │
│  ExamBatches · Questions · QuestionOptions                  │
│  ExamSubmissions · StudentResponses · AuditLogs             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
implementation/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Public auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # Protected routes (all roles)
│   │   ├── layout.tsx          # Shared sidebar + topbar layout
│   │   ├── admin/              # Admin-only pages
│   │   ├── instructor/         # Instructor-only pages
│   │   └── student/            # Student-only pages
│   ├── exam/[id]/              # Exam-taking interface (standalone)
│   └── api/                    # REST API route handlers
│       ├── auth/[...nextauth]/
│       ├── users/
│       ├── departments/
│       ├── batches/
│       ├── exams/
│       ├── submissions/
│       ├── student/
│       ├── members/
│       └── admin/
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── auth/                   # LoginForm, RegisterForm
│   ├── admin/                  # Department, faculty dialogs
│   ├── batch/                  # Batch management UI
│   ├── exam/                   # ExamEditForm, QuestionEditor
│   ├── instructor/             # Assign batch, student dialogs
│   ├── shared/                 # AddMemberDialog
│   ├── Sidebar.tsx             # Role-aware navigation
│   ├── Topbar.tsx
│   └── Providers.tsx           # SessionProvider + Toaster
├── hooks/
│   ├── useExamTimer.ts         # Countdown timer logic
│   └── useVisibilityGuard.ts   # Tab-switch detection
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth handler
│   ├── auth.config.ts          # JWT/session callbacks
│   ├── audit.ts                # logAction() utility
│   ├── utils.ts                # cn() class merger
│   └── validations/
│       ├── user.schema.ts      # loginSchema, registerSchema
│       └── exam.schema.ts      # examSchema, questionSchema
├── prisma/
│   ├── schema.prisma           # Database models
│   └── migrations/             # SQL migration history
├── types/
│   └── next-auth.d.ts          # Session/JWT type augmentation
├── generated/                  # Prisma generated client
├── middleware.ts               # Route protection
├── next.config.ts
├── prisma.config.ts
└── components.json             # shadcn/ui config
```

---

## Authentication & Authorization

### Authentication Flow

```
POST /api/auth/callback/credentials
        │
        ▼
CredentialsProvider (lib/auth.ts)
  1. Look up user by email in DB
  2. Compare password with bcrypt
  3. Return { id, name, email, role, departmentId }
        │
        ▼
JWT callback (lib/auth.config.ts)
  → Encode role, id, departmentIds into token
        │
        ▼
Session callback
  → Expose role, id, departmentId on client session
```

### Middleware Route Guards (`middleware.ts`)

| Condition | Action |
|---|---|
| `/api/auth/*` | Pass through (public) |
| `/`, `/login`, `/register` | Pass through (public) |
| Logged-in user on auth pages | Redirect to `/admin`, `/instructor`, or `/student` based on role |
| Any other route, not logged in | Redirect to `/login` |

### Role Permissions

| Feature | Admin | Instructor | Student |
|---|---|---|---|
| Department CRUD | Yes | No | No |
| Faculty management | Yes | No | No |
| Batch management | Yes | Yes (own) | No |
| Student management | Yes | Yes (own batches) | No |
| Exam creation | No | Yes | No |
| Exam assignment to batches | No | Yes | No |
| Take exams | No | No | Yes |
| View own results | No | No | Yes |
| View submission results | No | Yes | No |
| Audit logs | Yes | No | No |

---

## Database Schema

### Entity Relationship Diagram

```
Department ──< User (Admin/Instructor/Student)
                │
                ├──< StudentBatch >── Batch
                │                      │
                │                      └──< ExamBatch >── Exam ──< Question ──< QuestionOption
                │                                           │
                └──< ExamSubmission ────────────────────────┴──< StudentResponse
                          │
                      User (Student)

AuditLog ──── User (actor)
```

### Models

**User** — System account with role-based access.
Fields: `id`, `name`, `username`, `email`, `passwordHash`, `enrollmentNumber`, `role` (Admin | Instructor | Student), `departmentId` (nullable), `createdAt`

**Department** — Academic department.
Fields: `id`, `name`, `adminId` (nullable), `createdAt`

**Batch** — Named student group assigned to an instructor.
Fields: `id`, `name`, `description` (nullable), `instructorId`

**StudentBatch** — Many-to-many join between students and batches.
Fields: `studentId`, `batchId`

**Exam** — Examination with a start datetime, duration, and list of questions. Created by an instructor.
Fields: `id`, `title`, `startDatetime`, `durationMinutes`, `instructorId`, `createdAt`

**ExamBatch** — Many-to-many join: which batches are assigned to which exam.
Fields: `examId`, `batchId`

**Question** — A multiple-choice question belonging to an exam with a marks value and display order.
Fields: `id`, `examId`, `questionText`, `marksAwarded`, `questionOrder`

**QuestionOption** — One of the answer choices for a question.
Fields: `id`, `questionId`, `optionText`, `isCorrect`

**ExamSubmission** — A student's attempt at an exam. Tracks status, total score, and visibility violations.
Fields: `id`, `examId`, `studentId`, `startedAt`, `submittedAt` (nullable), `totalScore`, `status` (`In_Progress` | `Completed` | `Evaluated`), `violationCount`

**StudentResponse** — The option a student selected for each question in a submission.
Fields: `id`, `submissionId`, `questionId`, `selectedOptionId` (nullable)

**AuditLog** — Immutable record of significant system actions.
Fields: `id`, `userId` (nullable), `action`, `resourceType` (nullable), `resourceId` (nullable), `details` (nullable), `ipAddress` (nullable), `createdAt`

---

## API Routes

### Authentication

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (sign in, sign out, session) |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| POST | `/api/members/add` | Add user to a department |

### Departments

| Method | Path | Description |
|---|---|---|
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| GET | `/api/departments/[id]` | Get department |
| PUT | `/api/departments/[id]` | Update department |
| DELETE | `/api/departments/[id]` | Delete department |
| GET | `/api/departments/[id]/instructors` | Get department instructors |
| DELETE | `/api/departments/[id]/members/[userId]` | Remove user from department |

### Batches

| Method | Path | Description |
|---|---|---|
| GET | `/api/batches` | List batches |
| POST | `/api/batches` | Create batch |
| GET | `/api/batches/[id]` | Get batch |
| PUT | `/api/batches/[id]` | Update batch |
| GET | `/api/batches/[id]/students` | List students in batch |
| POST | `/api/batches/[id]/students` | Add student to batch |
| DELETE | `/api/batches/[id]/students` | Remove student from batch |
| POST | `/api/batches/[id]/students/quick-add` | Bulk add students |

### Exams

| Method | Path | Description |
|---|---|---|
| GET | `/api/exams` | List exams |
| POST | `/api/exams` | Create exam |
| GET | `/api/exams/[id]` | Get exam |
| PUT | `/api/exams/[id]` | Update exam |
| DELETE | `/api/exams/[id]` | Delete exam |
| GET | `/api/exams/[id]/questions` | List questions |
| POST | `/api/exams/[id]/questions` | Add question |
| DELETE | `/api/exams/[id]/questions` | Remove question |
| GET | `/api/exams/[id]/batches` | List assigned batches |
| POST | `/api/exams/[id]/batches` | Assign exam to batch |
| GET | `/api/student/exams` | Exams available to the authenticated student |

### Submissions

| Method | Path | Description |
|---|---|---|
| POST | `/api/submissions` | Start a new exam attempt |
| GET | `/api/submissions/[id]/responses` | Get saved responses |
| POST | `/api/submissions/[id]/responses` | Save responses |
| POST | `/api/submissions/[id]/submit` | Submit exam (triggers auto-grading) |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/audit-logs` | Fetch system audit trail |

---

## Exam-Taking Flow

```
Student Dashboard (/student)
        │
        │  GET /api/student/exams
        ▼
Lists available exams from assigned batches
        │
        │  POST /api/submissions  → creates ExamSubmission {status: In_Progress}
        ▼
Exam Interface (/exam/[id])
        │
        ├── useExamTimer       — countdown from exam duration, calls onExpire
        ├── useVisibilityGuard — detects tab switching, shows warning toasts
        │
        │  (student answers questions, responses held in React state)
        │
        │  POST /api/submissions/[id]/submit
        ▼
Server auto-grades:
  1. Load all questions and correct options for the exam
  2. For each StudentResponse, compare selectedOptionId to isCorrect option
  3. Sum marksAwarded for correct responses → totalScore
  4. Update ExamSubmission { totalScore, status: Evaluated, submittedAt }
        │
        ▼
Student Results (/student/results)
  GET scores and responses per exam
```

---

## Anti-Cheat Measures

**Tab/Window Visibility Detection** (`hooks/useVisibilityGuard.ts`)
- Listens to the Page Visibility API (`visibilitychange` event)
- Detects when the student switches away from the exam tab
- Displays a warning toast on each violation
- Tracks total violation count (can be used to auto-submit or flag attempts)

**Exam Timer** (`hooks/useExamTimer.ts`)
- Counts down from the configured exam duration in minutes
- Formats remaining time as `HH:MM:SS`
- Invokes an `onExpire` callback when time runs out (auto-submission)

---

## Audit Logging

All significant actions are recorded via `lib/audit.ts`:

```ts
logAction({
  userId,
  action,       // e.g. "CREATE_EXAM", "DELETE_STUDENT"
  resourceType, // e.g. "Exam", "User", "Batch"
  resourceId,
  details,      // arbitrary JSON metadata
  ipAddress,
})
```

Logs are stored in the `AuditLog` table and viewable by Admins at `/admin/audit-logs`.

---

## Environment Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon serverless) |
| `AUTH_SECRET` | Secret key for signing JWT tokens (32+ characters) |
| `NEXTAUTH_URL` | Base URL of the application |

---

## Key Design Decisions

**App Router with Route Groups**
Pages are organized into `(auth)` and `(dashboard)` route groups, keeping the layout and auth context cleanly separated without affecting the URL structure.

**JWT-based Sessions**
NextAuth is configured with the JWT strategy. Role and department membership are encoded in the token, so API routes can authorize requests without an extra database lookup.

**Prisma with Neon Serverless**
The `@prisma/adapter-pg` and `@prisma/adapter-neon` adapters support both standard connection pooling and edge/serverless environments. The Prisma client is instantiated as a singleton (`lib/prisma.ts`) to avoid exhausting connections during development hot-reloads.

**Zod Validation at Boundaries**
All user-facing forms use Zod schemas (`lib/validations/`) with `react-hook-form` resolvers. The same schemas can be reused server-side for API input validation.

**Auto-Grading on Submit**
Grading happens atomically at submission time on the server. There is no deferred grading queue — the submission API route calculates the score inline and updates the record in a single transaction.

**shadcn/ui Component System**
UI components are owned by the project (copied into `components/ui/`), not a runtime dependency. This allows full customization without vendor lock-in.

## Directories:
