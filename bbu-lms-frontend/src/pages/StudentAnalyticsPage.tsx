import { Link } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts'

import { useStudentAnalytics, type StudentAnalyticsData } from '@/hooks/useStudentAnalytics'
import { useAuth } from '@/contexts/AuthContext'

function NotStudent() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-text-muted" />
      <h2 className="mt-4 text-lg font-semibold text-text">Analytics for Students</h2>
      <p className="mt-2 text-sm text-text-muted">
        Student performance analytics are only available for student accounts.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-bbu-blue hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string
  subtext: string
  icon: React.ElementType
  tone?: 'blue' | 'green' | 'amber' | 'red'
}) {
  const toneClasses = {
    blue: 'bg-bbu-blue/10 text-bbu-blue',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
          <p className="text-xs text-text-muted">{subtext}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function GradeTrendChart({ data }: { data: { semesterName: string; averagePercentage: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-bbu-blue" />
          <h3 className="text-base font-semibold text-text">Grade Trend</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-text-muted">No grade data available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Grade Trend by Semester</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="semesterName" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value) => [`${value}%`, 'Avg. Grade']}
            />
            <Line
              type="monotone"
              dataKey="averagePercentage"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AttendanceTrendChart({
  data,
}: {
  data: { label: string; rate: number; present: number; late: number; absent: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-bbu-blue" />
          <h3 className="text-base font-semibold text-text">Attendance Trend</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-text-muted">No attendance records available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Attendance Trend by Month</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  rate: 'Attendance rate',
                  present: 'Present',
                  late: 'Late',
                  absent: 'Absent',
                }
                const label = name && labels[name] ? labels[name] : String(name)
                return name === 'rate' ? [`${value}%`, label] : [value, label]
              }}
            />
            <Bar dataKey="present" stackId="a" fill="#22c55e" />
            <Bar dataKey="late" stackId="a" fill="#f59e0b" />
            <Bar dataKey="absent" stackId="a" fill="#ef4444" />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AtRiskAlert({ flag }: { flag: StudentAnalyticsData['atRiskFlag'] }) {
  if (!flag.isAtRisk) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-base font-semibold text-green-800">On Track</h3>
            <p className="text-sm text-green-700">
              Your grades and attendance are above the at-risk thresholds across all courses.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-red-800">At-Risk Alert</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {flag.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          {(flag.lowGradeCourses.length > 0 || flag.lowAttendanceCourses.length > 0) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {flag.lowGradeCourses.map((course) => (
                <Link
                  key={`grade-${course.offeringId}`}
                  to={`/courses/${course.offeringId}?tab=grades`}
                  className="rounded-lg border border-red-100 bg-white p-3 text-sm transition-colors hover:bg-red-100"
                >
                  <p className="font-medium text-text">
                    {course.courseCode} · {course.courseName}
                  </p>
                  <p className="text-xs text-red-600">Grade: {course.overallPercentage?.toFixed(2)}%</p>
                </Link>
              ))}
              {flag.lowAttendanceCourses.map((course) => (
                <Link
                  key={`attendance-${course.offeringId}`}
                  to={`/courses/${course.offeringId}?tab=attendance`}
                  className="rounded-lg border border-red-100 bg-white p-3 text-sm transition-colors hover:bg-red-100"
                >
                  <p className="font-medium text-text">
                    {course.courseCode} · {course.courseName}
                  </p>
                  <p className="text-xs text-red-600">Attendance: {course.attendanceRate?.toFixed(2)}%</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CourseSnapshots({ snapshots }: { snapshots: StudentAnalyticsData['courseSnapshots'] }) {
  if (snapshots.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-bbu-blue" />
        <h3 className="text-base font-semibold text-text">Course Snapshots</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-text-muted">
              <th className="pb-2 font-medium">Course</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Attendance</th>
              <th className="pb-2 font-medium">Assignments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {snapshots.map((snapshot) => (
              <tr key={snapshot.offeringId}>
                <td className="py-3 font-medium text-text">
                  {snapshot.courseCode} · {snapshot.courseName}
                </td>
                <td className="py-3">
                  {snapshot.overallPercentage !== null ? (
                    <span className={`font-semibold ${snapshot.overallPercentage < 60 ? 'text-red-600' : 'text-bbu-blue'}`}>
                      {snapshot.overallPercentage.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="py-3">
                  {snapshot.attendanceRate !== null ? (
                    <span className={`font-semibold ${snapshot.attendanceRate < 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {snapshot.attendanceRate.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="py-3">
                  {snapshot.assignmentCompletionRate !== null ? (
                    <span className="font-semibold text-text">
                      {snapshot.assignmentCompletionRate.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StudentAnalyticsPage() {
  const { user } = useAuth()
  const { data: analytics, isLoading } = useStudentAnalytics()

  const isStudent = user?.roles?.some((r) => r.name === 'student')

  if (!isStudent) {
    return <NotStudent />
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-bbu-blue" />
          <div>
            <h1 className="text-2xl font-semibold text-text">Student Analytics</h1>
            <p className="text-sm text-text-muted">Loading your performance insights...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20 text-text-muted">Loading analytics...</div>
      </div>
    )
  }

  const completion = analytics?.assignmentCompletionRate
  const completionTone: 'blue' | 'green' | 'amber' | 'red' =
    !completion || completion.rate === null
      ? 'blue'
      : completion.rate >= 80
        ? 'green'
        : completion.rate >= 50
          ? 'amber'
          : 'red'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-bbu-blue" />
        <div>
          <h1 className="text-2xl font-semibold text-text">Student Analytics</h1>
          <p className="text-sm text-text-muted">Performance trends and at-risk indicators.</p>
        </div>
      </div>

      {analytics?.atRiskFlag && <AtRiskAlert flag={analytics.atRiskFlag} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Assignment Completion"
          value={completion?.rate !== null && completion?.rate !== undefined ? `${completion.rate.toFixed(1)}%` : '-'}
          subtext={`${completion?.completedCount ?? 0} / ${completion?.totalCount ?? 0} submitted`}
          icon={ClipboardList}
          tone={completionTone}
        />
        <MetricCard
          label="Avg. Grade"
          value={
            analytics?.gradeTrend.length
              ? `${analytics.gradeTrend[analytics.gradeTrend.length - 1].averagePercentage.toFixed(1)}%`
              : '-'
          }
          subtext="Latest semester average"
          icon={TrendingUp}
          tone="blue"
        />
        <MetricCard
          label="Avg. Attendance"
          value={
            analytics?.attendanceTrend.length
              ? `${analytics.attendanceTrend[analytics.attendanceTrend.length - 1].rate.toFixed(1)}%`
              : '-'
          }
          subtext="Latest month rate"
          icon={CalendarCheck}
          tone="green"
        />
        <MetricCard
          label="Courses"
          value={String(analytics?.courseSnapshots.length ?? 0)}
          subtext="Enrolled this semester"
          icon={BarChart3}
          tone="blue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GradeTrendChart data={analytics?.gradeTrend ?? []} />
        <AttendanceTrendChart data={analytics?.attendanceTrend ?? []} />
      </div>

      <CourseSnapshots snapshots={analytics?.courseSnapshots ?? []} />
    </div>
  )
}

export default StudentAnalyticsPage
