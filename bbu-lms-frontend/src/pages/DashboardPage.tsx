import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useMyCourses } from '@/hooks/useMyCourses'
import { useGradeSummary } from '@/hooks/useGradeHistory'

function letterGradeColorClass(letter: string | null | undefined): string {
  if (!letter) return 'bg-gray-100 text-text-muted'
  switch (letter) {
    case 'A':
      return 'bg-green-100 text-green-700'
    case 'B':
      return 'bg-blue-100 text-blue-700'
    case 'C':
      return 'bg-amber-100 text-amber-700'
    case 'D':
      return 'bg-orange-100 text-orange-700'
    case 'F':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-text-muted'
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  to?: string
}) {
  const content = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <Icon className="h-5 w-5 text-bbu-blue" />
        </div>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }

  return content
}

function GradeSummaryCard() {
  const { data, isLoading } = useGradeSummary()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-text-muted">Grade Summary</p>
        <div className="mt-4 flex items-center justify-center py-8 text-text-muted">
          Loading...
        </div>
      </div>
    )
  }

  const { courses, gpa, cumulativeGpa, semesterName } = data ?? {
    courses: [],
    gpa: null,
    cumulativeGpa: null,
    semesterName: 'Current Semester',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-bbu-blue" />
          <h3 className="text-base font-semibold text-text">{semesterName}</h3>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1 text-sm font-medium text-bbu-blue hover:underline"
        >
          Grades
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-text-muted">No graded courses this semester yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.slice(0, 5).map((course) => (
            <div
              key={course.offeringId}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {course.courseCode} · {course.courseName}
                </p>
                <p className="text-xs text-text-muted">{course.credits} credit{course.credits === 1 ? '' : 's'}</p>
              </div>
              <div className="flex items-center gap-3">
                {course.percentage !== null && (
                  <span className="text-sm font-medium text-text">{course.percentage.toFixed(2)}%</span>
                )}
                {course.letterGrade && (
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${letterGradeColorClass(course.letterGrade)}`}>
                    {course.letterGrade}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-bbu-blue/5 p-3">
          <p className="text-xs text-text-muted">Semester GPA</p>
          <p className="text-xl font-bold text-bbu-blue">{gpa !== null ? gpa.toFixed(2) : '-'}</p>
        </div>
        <div className="rounded-lg bg-bbu-blue/5 p-3">
          <p className="text-xs text-text-muted">Cumulative GPA</p>
          <p className="text-xl font-bold text-bbu-blue">{cumulativeGpa !== null ? cumulativeGpa.toFixed(2) : '-'}</p>
        </div>
      </div>
    </div>
  )
}

function UpcomingDeadlines() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Upcoming</h3>
      </div>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-text-muted">No upcoming deadlines displayed here yet.</p>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const { offerings, isLoading: coursesLoading } = useMyCourses()

  const isStudent = user?.roles?.some((r) => r.name === 'student')
  const courseCount = offerings?.length ?? 0

  const welcomeName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-bbu-blue" />
        <div>
          <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
          <p className="text-sm text-text-muted">Welcome back, {welcomeName}.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={coursesLoading ? '-' : courseCount} icon={BookOpen} to="/courses" />
        <StatCard label="Assignments" value="0" icon={ClipboardList} />
        <StatCard label="Calendar Events" value="0" icon={CalendarDays} to="/calendar" />
        <StatCard label="Messages" value="0" icon={MessageSquare} to="/chat" />
      </div>

      {isStudent && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GradeSummaryCard />
          </div>
          <div>
            <UpcomingDeadlines />
          </div>
        </div>
      )}

      {!isStudent && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-base font-semibold text-text">Staff Dashboard</h3>
              <p className="text-sm text-text-muted">
                Detailed analytics and administrative tools will be added in upcoming steps.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
