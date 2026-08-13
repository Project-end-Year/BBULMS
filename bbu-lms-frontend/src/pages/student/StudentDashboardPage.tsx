import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  GraduationCap,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  FileText,
  Bell,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { useAuth } from '@/contexts/AuthContext'
import { useMyCourses } from '@/hooks/useMyCourses'
import { useGradeSummary } from '@/hooks/useGradeHistory'
import { useStudentDashboard, type DashboardAssignment, type DashboardClass, type DashboardExam, type DashboardGrade } from '@/hooks/useStudentDashboard'
import { StatCard, EmptyState, SectionHeader } from '@/pages/shared/dashboard/DashboardShared'
import { formatDueLabel, letterGradeColorClass } from '@/pages/shared/dashboard/dashboardUtils'
import { Link } from 'react-router-dom'

function GradeSummaryCard() {
  const { data, isLoading } = useGradeSummary()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-text-muted">Grade Summary</p>
        <div className="mt-4 flex items-center justify-center py-8 text-text-muted">Loading...</div>
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
        <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-medium text-bbu-blue hover:underline">
          Grades
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState message="No graded courses this semester yet." />
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

function TodaysClasses({ classes }: { classes: DashboardClass[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={GraduationCap} title="Today's Classes" to="/courses" />
      {classes.length === 0 ? (
        <EmptyState message="No classes scheduled for today." />
      ) : (
        <div className="space-y-3">
          {classes.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {session.courseCode} · {session.courseName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {session.startTime?.slice(0, 5)} – {session.endTime?.slice(0, 5)}
                  </span>
                  {session.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {session.room}
                    </span>
                  )}
                  {session.type && <span className="capitalize">{session.type}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UpcomingAssignments({ assignments }: { assignments: DashboardAssignment[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={ClipboardList} title="Upcoming Assignments" to="/courses" />
      {assignments.length === 0 ? (
        <EmptyState message="No upcoming assignments in the next two weeks." />
      ) : (
        <div className="space-y-3">
          {assignments.slice(0, 5).map((assignment) => (
            <Link
              key={assignment.id}
              to={`/courses/${assignment.offeringId}?tab=assignments`}
              className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-100"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{assignment.title}</p>
                <p className="text-xs text-text-muted">
                  {assignment.courseCode} · {assignment.courseName}
                </p>
                <p className="mt-1 text-xs font-medium text-amber-600">{formatDueLabel(assignment.dueAt)}</p>
              </div>
              <div className="ml-3 shrink-0">
                {assignment.isSubmitted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AttendanceCard({ percentage }: { percentage: number | null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Attendance</h3>
      </div>
      {percentage === null ? (
        <EmptyState message="No attendance sessions recorded yet." />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-bbu-blue/20">
            <span className="text-lg font-bold text-bbu-blue">{percentage}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text">Overall attendance rate</p>
            <p className="text-xs text-text-muted">Across all enrolled courses</p>
          </div>
        </div>
      )}
    </div>
  )
}

function RecentGrades({ grades }: { grades: DashboardGrade[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={FileText} title="Recent Grades" to="/courses" />
      {grades.length === 0 ? (
        <EmptyState message="No grades posted yet." />
      ) : (
        <div className="space-y-3">
          {grades.map((grade) => (
            <div key={grade.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{grade.componentName}</p>
                <p className="text-xs text-text-muted">
                  {grade.courseCode} · {grade.courseName}
                </p>
                <p className="text-xs text-text-muted">{format(parseISO(grade.updatedAt), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-3">
                {grade.percentage !== null && (
                  <span className="text-sm font-medium text-text">{grade.percentage.toFixed(2)}%</span>
                )}
                {grade.letterGrade && (
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${letterGradeColorClass(grade.letterGrade)}`}>
                    {grade.letterGrade}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UpcomingExams({ exams }: { exams: DashboardExam[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={CalendarDays} title="Upcoming Exams" to="/calendar" />
      {exams.length === 0 ? (
        <EmptyState message="No exams scheduled in the next 30 days." />
      ) : (
        <div className="space-y-3">
          {exams.slice(0, 5).map((exam) => (
            <div key={exam.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-medium text-text">{exam.title}</p>
              <p className="text-xs text-text-muted">
                {exam.courseCode} · {exam.courseName}
              </p>
              <p className="mt-1 text-xs font-medium text-red-600">
                {format(parseISO(exam.startsAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentDashboardPage() {
  const { user } = useAuth()
  const { offerings, isLoading: coursesLoading } = useMyCourses()
  const { data: studentDashboard, isLoading: studentDashboardLoading } = useStudentDashboard()

  const courseCount = offerings?.length ?? 0
  const welcomeName = user?.name?.split(' ')[0] ?? 'there'
  const unreadMessages = studentDashboard?.unreadMessages ?? 0
  const upcomingAssignments = studentDashboard?.upcomingAssignments ?? []
  const upcomingExams = studentDashboard?.upcomingExams ?? []

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-bbu-blue" />
        <div>
          <h1 className="text-2xl font-semibold text-text">Student Dashboard</h1>
          <p className="text-sm text-text-muted">Welcome back, {welcomeName}.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={coursesLoading ? '-' : courseCount} icon={BookOpen} to="/courses" tone="blue" />
        <StatCard
          label="Assignments"
          value={studentDashboardLoading ? '-' : upcomingAssignments.length}
          icon={ClipboardList}
          to="/courses"
          tone="amber"
        />
        <StatCard
          label="Upcoming Exams"
          value={studentDashboardLoading ? '-' : upcomingExams.length}
          icon={CalendarDays}
          to="/calendar"
          tone="red"
        />
        <StatCard
          label="Unread Messages"
          value={studentDashboardLoading ? '-' : unreadMessages}
          icon={MessageSquare}
          to="/chat"
          tone={unreadMessages > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GradeSummaryCard />
          <div className="grid gap-6 sm:grid-cols-2">
            <TodaysClasses classes={studentDashboard?.todaysClasses ?? []} />
            <AttendanceCard percentage={studentDashboard?.attendancePercentage ?? null} />
          </div>
          <RecentGrades grades={studentDashboard?.recentGrades ?? []} />
        </div>
        <div className="space-y-6">
          <UpcomingAssignments assignments={upcomingAssignments} />
          <UpcomingExams exams={upcomingExams} />
        </div>
      </div>
    </div>
  )
}

export default StudentDashboardPage
