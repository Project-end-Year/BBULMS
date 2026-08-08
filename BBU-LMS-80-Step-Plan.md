# BBU LMS — Full Build Plan (Laravel API + React)

**Build Bright University Learning Management System**
Inspired by Microsoft Teams for Education. Decoupled architecture: Laravel serves a pure JSON API, React (Vite) is a separate SPA frontend.

---

## 1. Tech Stack

### Backend
- **Laravel 11** — API-only mode (`laravel new bbu-lms --api`)
- **Laravel Sanctum** — SPA token/cookie authentication
- **Laravel Reverb** (or Pusher) — WebSockets for real-time chat & notifications
- **Laravel Echo** (consumed on the React side) — WebSocket client
- **Spatie Laravel Permission** — roles & permissions (admin/lecturer/student)
- **Spatie Laravel Query Builder** — clean filtering/sorting on API endpoints
- **Laravel Excel (Maatwebsite)** — grade/report import-export
- **Intervention Image** — profile photo processing
- **Laravel Scout + Meilisearch** — message & course search
- **simple-qrcode** — QR attendance code generation

Install:
```bash
composer require laravel/sanctum laravel/reverb spatie/laravel-permission \
  spatie/laravel-query-builder maatwebsite/excel intervention/image \
  laravel/scout meilisearch/meilisearch-php simple-qrcode/simple-qrcode
```

### Frontend
- **React 18 + Vite + TypeScript**
- **Tailwind CSS** — utility styling (clean, Teams-like flat surfaces)
- **shadcn/ui** (built on Radix UI) — accessible, unstyled-to-styled component primitives; this is what gets you the "clean Microsoft product" look fastest
- **Radix UI** — underlying primitives (dialogs, dropdowns, tabs) — comes bundled via shadcn
- **Lucide React** — icon set (same family Teams-adjacent products use)
- **TanStack Query (React Query)** — server state, caching, background refetch
- **TanStack Table** — grade tables, attendance tables, admin lists
- **React Router v6** — routing
- **Zustand** — lightweight client state (active chat thread, sidebar state)
- **React Hook Form + Zod** — forms + schema validation
- **Axios** — HTTP client, paired with Sanctum cookies
- **Laravel Echo + Pusher-js** — real-time client
- **Framer Motion** — restrained motion (panel transitions, message send)
- **Recharts** — dashboard analytics charts
- **date-fns** — dates/deadlines/calendar math
- **react-big-calendar** or **FullCalendar (React)** — calendar module
- **Sonner** — toast notifications
- **react-dropzone** — file/assignment uploads
- **@react-pdf-viewer/core** — inline PDF material preview

Install:
```bash
npm create vite@latest bbu-lms-frontend -- --template react-ts
cd bbu-lms-frontend
npm install tailwindcss @tailwindcss/vite axios react-router-dom \
  @tanstack/react-query @tanstack/react-table zustand \
  react-hook-form zod @hookform/resolvers \
  laravel-echo pusher-js framer-motion recharts date-fns \
  react-big-calendar sonner react-dropzone lucide-react \
  @react-pdf-viewer/core

npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu tabs input \
  avatar badge table calendar select textarea sheet separator progress
```

### Design direction
Clean, flat, Microsoft Teams–inspired: white/near-white surfaces, one primary accent color (suggest BBU brand blue, not a generic purple), soft shadows only on hover/active states, 8px-based spacing scale, rounded-lg (not pill) corners, sidebar + top nav shell, sans-serif UI face (Inter or IBM Plex Sans).

---

## 2. The 80 Steps

### Phase 1 — Foundations (Steps 1–10)
1. Initialize Laravel API-only project (`--api` flag), set up `.env`, connect MySQL/PostgreSQL.
2. Initialize React + Vite + TypeScript frontend in a separate repo/folder; configure Tailwind + path aliases.
3. Set up Laravel Sanctum for SPA authentication (stateful domains, CORS config for the React origin).
4. Install and configure Spatie Permission; define roles: `admin`, `lecturer`, `student`.
5. Design and migrate core tables: `users`, `roles`, `departments`, `programs`, `semesters`.
6. Build the API response layer: consistent JSON envelope, Laravel API Resources for every model.
7. Set up global error handling middleware (validation errors, 401/403/404 shaped consistently for the frontend).
8. Configure React Router route structure: `/login`, `/dashboard`, `/courses`, `/chat`, `/calendar`, `/admin/*`.
9. Set up TanStack Query provider + Axios instance with credentials, base URL, and interceptors.
10. Build the app shell in React: top nav, collapsible left sidebar, content area (the Teams-style skeleton).

### Phase 2 — Auth & Profiles (Steps 11–20)
11. Build `POST /login`, `POST /logout`, `GET /user` endpoints via Sanctum.
12. Build the React login page (email/password, form validation with Zod).
13. Build auth context/hook (`useAuth`) wrapping TanStack Query's `/user` cache.
14. Build role-based route guards (`<RequireRole role="admin">`) on the frontend.
15. Migrate + build `student_profiles` table: student ID, department, major, year, semester.
16. Migrate + build `lecturer_profiles` table: department, title, office hours.
17. Build profile photo upload endpoint (Intervention Image resize/crop) + React upload UI.
18. Build the Profile page (view/edit) for students and lecturers.
19. Build Admin's "Manage Users" screen: create/edit/deactivate accounts, assign roles.
20. Add password reset flow (email token, reset form).

### Phase 3 — Courses & Classes (Steps 21–30)
21. Migrate `faculties`, `courses`, `course_offerings`, `enrollments` tables.
22. Build course CRUD API (admin-only create/edit, lecturer read own, student read enrolled).
23. Build "My Courses" grid on the frontend (Teams-style course cards).
24. Build the Course detail shell with tabs: Overview / Materials / Assignments / Quizzes / Attendance / Grades / Announcements / Discussion.
25. Build class schedule table + API (`class_schedules`), rendered on Course Overview.
26. Build enrollment management (student self-enroll or admin-enroll, capacity limits).
27. Build "Course Materials" tab: file list, upload (lecturer), download/view tracking table.
28. Build materials preview (PDF inline viewer, video embed, external link cards).
29. Build "Announcements" tab (course-level) with create/edit (lecturer/admin) and read feed (student).
30. Add university-wide and department-wide announcement scopes + a combined Announcements page.

### Phase 4 — Chat (Steps 31–40)
31. Set up Laravel Reverb (or Pusher) broadcasting config; set up Echo on the frontend.
32. Migrate `conversations`, `conversation_participants`, `messages`, `message_attachments` tables.
33. Build 1-to-1 conversation creation + fetch API.
34. Build group/class conversation auto-created per course offering.
35. Build the Chat UI shell: conversation list (left) + active thread (right), Teams-style.
36. Implement real-time message send/receive via broadcast events + Echo listeners.
37. Add file/image attachment upload in chat (react-dropzone + preview thumbnails).
38. Add reply-to-message threading (quote + jump-to-message).
39. Add read/unread status (per-participant `last_read_at`, unread badge counts).
40. Add message search (Scout/Meilisearch-backed) across a conversation and globally.

### Phase 5 — Attendance (Steps 41–46)
41. Migrate `attendance_sessions`, `attendance_records` tables.
42. Build "Start Attendance Session" flow for lecturers (generates a session + QR token).
43. Build QR code generation endpoint (simple-qrcode) + frontend QR display on a projector-friendly screen.
44. Build student check-in flow (scan QR via mobile camera → API marks present/late by timestamp).
45. Build manual override UI for lecturers (mark present/absent/late per student).
46. Build attendance history + percentage calculation, surfaced on Course > Attendance tab and student Dashboard.

### Phase 6 — Assignments (Steps 47–55)
47. Migrate `assignments`, `assignment_attachments`, `submissions`, `submission_files` tables.
48. Build assignment creation API + form (description, attachments, due date, max points).
49. Build the Assignments list tab (student view: pending/submitted/graded; lecturer view: all + submission counts).
50. Build student submission flow: file upload + text response, with late-submission detection against `due_date`.
51. Build lecturer grading interface: inline score + feedback per submission.
52. Add resubmission support (versioned submissions, lecturer allows/denies).
53. Add assignment detail page with attachments preview and countdown to deadline.
54. Add bulk-download of all submissions for a lecturer (zip export).
55. Wire assignment due dates into the Calendar module (Step 69–72).

### Phase 7 — Grades (Steps 56–60)
56. Migrate `grade_components` (assignment/quiz/attendance/midterm/final weights), `grades` tables.
57. Build the `GradeCalculator` service: weighted overall course grade from components.
58. Build the `GpaCalculator` service integration into the grades pipeline (credit-hour weighted).
59. Build the Grades tab (student: own breakdown by component; lecturer: gradebook/spreadsheet view via TanStack Table).
60. Build grade history + per-semester summary, surfaced in the student Dashboard.

### Phase 8 — Quizzes / Exams (Steps 61–68)
61. Migrate `quizzes`, `questions`, `question_options`, `quiz_attempts`, `quiz_answers` tables.
62. Build quiz builder API + lecturer UI: multiple choice, true/false, short answer question types.
63. Add quiz settings: timer, randomized question order, attempt limits.
64. Build the student quiz-taking UI: timer countdown, one-question-at-a-time or full-page mode, autosave.
65. Build automatic grading logic for MCQ/true-false; flag short answers for manual review.
66. Build quiz results view (student: score + correct/incorrect breakdown where allowed; lecturer: class distribution).
67. Feed quiz scores into the `grade_components` pipeline from Phase 7.
68. Add exam scheduling (ties into Calendar) distinct from practice quizzes.

### Phase 9 — Calendar & Notifications (Steps 69–74)
69. Build a unified Calendar API aggregating: class schedules, assignment deadlines, exams, events.
70. Build the Calendar page (react-big-calendar/FullCalendar) with month/week/day views.
71. Add personal calendar entries (student/lecturer can add their own events).
72. Migrate `notifications` table (Laravel's built-in notifications or custom); define notification types (new assignment, deadline, new grade, attendance reminder, announcement, chat message, exam reminder).
73. Build notification broadcasting (real-time via Reverb) + REST fallback list endpoint.
74. Build the notification bell UI (dropdown feed, mark-as-read, deep link to source).

### Phase 10 — Dashboards, Discussion & Admin (Steps 75–80)
75. Build the Student Dashboard: today's classes, upcoming assignments, attendance %, recent grades, upcoming exams, unread messages (single aggregated API + widget grid on frontend).
76. Build the Lecturer Dashboard: today's classes, pending grading count, attendance status, upcoming assignments, quick student performance glance.
77. Build the Discussion Board module (per course): threaded Q&A, lecturer-answer highlighting, like/reaction counts.
78. Build Student Performance Analytics: grade trend line, attendance trend, assignment completion rate, simple at-risk flag (rule-based threshold, not ML) — Recharts on the frontend.
79. Build the Admin Dashboard: manage students/lecturers/courses/departments/semesters, enrollment tools, and exportable reports (Laravel Excel).
80. Polish pass + deploy: responsive check down to mobile, loading/empty/error states everywhere, seed demo data, write README, deploy backend (Forge/VPS) + frontend (Vercel/Netlify), set up CI for build checks.

---

## 3. Suggested Build Order Priority (if time is tight)

If you're on a fixed timeline and need to cut scope, build Phases 1–7 and 9–10 fully first (this alone proves full-stack, real-time, auth, file handling, and reporting). Treat **Quizzes (Phase 8)** and **Discussion Board (step 77)** as stretch goals you add only if Phases 1–7 finish early — they're valuable but not required to demonstrate the core system design.

## 4. Suggested Folder Structure

```text
backend/  (Laravel API)
├── app/Http/Controllers/Api/
├── app/Http/Resources/
├── app/Models/
├── app/Services/        (GpaCalculator, GradeCalculator, AttendanceService)
├── app/Events/           (MessageSent, NotificationCreated)
├── routes/api.php
└── routes/channels.php   (broadcasting auth)

frontend/  (React + Vite)
├── src/api/              (axios instance, query hooks per resource)
├── src/components/ui/    (shadcn components)
├── src/components/       (shared composed components)
├── src/features/
│   ├── auth/
│   ├── courses/
│   ├── chat/
│   ├── attendance/
│   ├── assignments/
│   ├── grades/
│   ├── quizzes/
│   ├── calendar/
│   └── admin/
├── src/layouts/           (AppShell, AuthLayout)
├── src/hooks/
└── src/routes/
```
