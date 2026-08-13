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
  GraduationCap,
  MapPin,
  CheckCircle2,
  Circle,
  FileText,
  Bell,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'

import { useAuth } from '@/contexts/AuthContext'
import { useMyCourses } from '@/hooks/useMyCourses'
import { useGradeSummary } from '@/hooks/useGradeHistory'
import { useStudentDashboard, type DashboardAssignment, type DashboardClass, type DashboardExam, type DashboardGrade } from '@/hooks/useStudentDashboard'
import { useLecturerDashboard, type LecturerDashboardClass, type ActiveAttendanceSession, type DashboardAssignment as LecturerDashboardAssignment, type LowPerformer, type CourseAverage } from '@/hooks/useLecturerDashboard'

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
  tone = 'blue',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  to?: string
  tone?: 'blue' | 'green' | 'amber' | 'red'
}) {
  const toneClasses = {
    blue: 'bg-bbu-blue/10 text-bbu-blue',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }

  const content = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, to }: { icon: React.ElementType; title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">{title}</h3>
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-bbu-blue hover:underline">
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function formatDueLabel(dueAt: string): string {
  const date = parseISO(dueAt)
  if (isToday(date)) return 'Due today'
  if (isTomorrow(date)) return 'Due tomorrow'
  return `Due ${formatDistanceToNow(date, { addSuffix: true })}`
}

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
          <ChevronRight className="h-4 w-4" />
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

function LecturerTodaysClasses({ classes }: { classes: LecturerDashboardClass[] }) {
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

function PendingGradingCard({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Pending Grading</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-200">
          <span className="text-lg font-bold text-amber-700">{count}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text">Items waiting for review</p>
          <p className="text-xs text-text-muted">Assignments + short-answer quizzes</p>
        </div>
      </div>
    </div>
  )
}

function AttendanceStatusCard({ status }: { status: { activeSessions: ActiveAttendanceSession[]; totalStudents: number; checkedInCount: number } }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={Users} title="Attendance Status" to="/courses" />
      {status.activeSessions.length === 0 ? (
        <EmptyState message="No active attendance sessions right now." />
      ) : (
        <div className="space-y-3">
          {status.activeSessions.map((session) => (
            <div key={session.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-medium text-text">
                {session.title ?? 'Attendance session'}
              </p>
              <p className="text-xs text-text-muted">
                {session.courseCode} · {session.courseName}
              </p>
              <p className="mt-1 text-xs font-medium text-bbu-blue">
                {format(parseISO(session.startsAt), 'h:mm a')} –{' '}
                {session.endsAt ? format(parseISO(session.endsAt), 'h:mm a') : 'Open'}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-bbu-blue/5 p-3">
            <span className="text-xs text-text-muted">Checked in</span>
            <span className="text-sm font-bold text-bbu-blue">
              {status.checkedInCount} / {status.totalStudents}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function LecturerUpcomingAssignments({ assignments }: { assignments: LecturerDashboardAssignment[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={ClipboardList} title="Upcoming Assignments" to="/courses" />
      {assignments.length === 0 ? (
        <EmptyState message="No assignments due in the next two weeks." />
      ) : (
        <div className="space-y-3">
          {assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-medium text-text">{assignment.title}</p>
              <p className="text-xs text-text-muted">
                {assignment.courseCode} · {assignment.courseName}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs font-medium text-amber-600">{formatDueLabel(assignment.dueAt)}</p>
                <p className="text-xs text-text-muted">{assignment.submissionCount} submissions</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentPerformance({ performance }: { performance: { lowPerformers: LowPerformer[]; courseAverages: CourseAverage[] } }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Student Performance</h3>
      </div>

      {performance.courseAverages.length === 0 && performance.lowPerformers.length === 0 ? (
        <EmptyState message="No grade data available yet." />
      ) : (
        <div className="space-y-5">
          {performance.courseAverages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Course averages</p>
              <div className="space-y-2">
                {performance.courseAverages.map((course) => (
                  <div key={course.offeringId} className="flex items-center justify-between rounded-lg bg-gray-50/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {course.courseCode} · {course.courseName}
                      </p>
                      <p className="text-xs text-text-muted">{course.studentCount} students</p>
                    </div>
                    <span className="text-sm font-bold text-bbu-blue">{course.averagePercentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {performance.lowPerformers.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <AlertTriangle className="h-3.5 w-3.5" />
                At-risk students (&lt; 60%)
              </p>
              <div className="space-y-2">
                {performance.lowPerformers.slice(0, 5).map((student) => (
                  <div
                    key={`${student.studentId}-${student.offeringId}`}
                    className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{student.studentName}</p>
                      <p className="text-xs text-text-muted">
                        {student.courseCode} · {student.courseName}
                      </p>
                    </div>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {student.percentage.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const { offerings, isLoading: coursesLoading } = useMyCourses()
  const { data: studentDashboard, isLoading: studentDashboardLoading } = useStudentDashboard()
  const { data: lecturerDashboard, isLoading: lecturerDashboardLoading } = useLecturerDashboard()

  const isStudent = user?.roles?.some((r) => r.name === 'student')
  const isLecturer = user?.roles?.some((r) => r.name === 'lecturer')
  const courseCount = offerings?.length ?? 0

  const welcomeName = user?.name?.split(' ')[0] ?? 'there'

  const unreadMessages = studentDashboard?.unreadMessages ?? 0
  const studentUpcomingAssignments = studentDashboard?.upcomingAssignments ?? []
  const upcomingExams = studentDashboard?.upcomingExams ?? []
  const pendingGrading = lecturerDashboard?.pendingGradingCount ?? 0
  const lecturerUpcomingAssignments = lecturerDashboard?.upcomingAssignments ?? []

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
        <StatCard
          label="Courses"
          value={coursesLoading ? '-' : courseCount}
          icon={BookOpen}
          to="/courses"
          tone="blue"
        />
        {isLecturer ? (
          <StatCard
            label="Pending Grading"
            value={lecturerDashboardLoading ? '-' : pendingGrading}
            icon={ClipboardList}
            to="/courses"
            tone={pendingGrading > 0 ? 'red' : 'green'}
          />
        ) : (
          <StatCard
            label="Assignments"
            value={studentDashboardLoading ? '-' : studentUpcomingAssignments.length}
            icon={ClipboardList}
            to="/courses"
            tone="amber"
          />
        )}
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

      {isStudent && (
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
            <UpcomingAssignments assignments={studentUpcomingAssignments} />
            <UpcomingExams exams={upcomingExams} />
          </div>
        </div>
      )}

      {isLecturer && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-6 sm:grid-cols-2">
              <LecturerTodaysClasses classes={lecturerDashboard?.todaysClasses ?? []} />
              <PendingGradingCard count={pendingGrading} />
            </div>
            <AttendanceStatusCard status={lecturerDashboard?.attendanceStatus ?? { activeSessions: [], totalStudents: 0, checkedInCount: 0 }} />
            <StudentPerformance performance={lecturerDashboard?.studentPerformance ?? { lowPerformers: [], courseAverages: [] }} />
          </div>
          <div className="space-y-6">
            <LecturerUpcomingAssignments assignments={lecturerUpcomingAssignments} />
          </div>
        </div>
      )}

      {!isStudent && !isLecturer && (
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
