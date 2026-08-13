import { useState } from 'react'
import {
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarDays,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { useAdminDashboard, downloadReport } from '@/hooks/useAdminDashboard'

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string | number
  subtext: string
  icon: React.ElementType
  tone?: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}) {
  const toneClasses = {
    blue: 'bg-bbu-blue/10 text-bbu-blue',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-text">{title}</h3>
      {children}
    </div>
  )
}

function ExportButton({
  label,
  type,
  icon: Icon,
}: {
  label: string
  type: 'users' | 'courses' | 'enrollments'
  icon: React.ElementType
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await downloadReport(type)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-text shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAdminDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading dashboard...
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <p className="mt-2 text-sm text-red-700">Failed to load admin dashboard.</p>
      </div>
    )
  }

  const { counts, recentActivity, enrollmentOverview, systemHealth } = dashboard

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Dashboard Overview</h2>
          <p className="text-sm text-text-muted">System metrics, recent activity, and exportable reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton label="Export Users" type="users" icon={Users} />
          <ExportButton label="Export Courses" type="courses" icon={BookOpen} />
          <ExportButton label="Export Enrollments" type="enrollments" icon={GraduationCap} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={counts.users.total}
          subtext={`${counts.users.active} active · ${counts.users.inactive} inactive`}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Students / Lecturers"
          value={`${counts.users.students} / ${counts.users.lecturers}`}
          subtext={`${counts.users.admins} admin${counts.users.admins === 1 ? '' : 's'}`}
          icon={GraduationCap}
          tone="green"
        />
        <StatCard
          label="Courses"
          value={counts.courses}
          subtext={`${counts.courseOfferings} offerings · ${counts.enrollments.active} active enrollments`}
          icon={BookOpen}
          tone="amber"
        />
        <StatCard
          label="Organizations"
          value={`${counts.organizations.departments}`}
          subtext={`${counts.organizations.programs} programs · ${counts.organizations.semesters} semesters`}
          icon={Building2}
          tone="purple"
        />
      </div>

      {systemHealth.activeSemester && (
        <div className="rounded-lg border border-bbu-blue/20 bg-bbu-blue/5 p-4 text-sm text-text">
          <div className="flex items-center gap-2 font-medium text-bbu-blue">
            <CalendarDays className="h-4 w-4" />
            Active semester: {systemHealth.activeSemester.name}
          </div>
          <p className="mt-1 text-text-muted">
            {systemHealth.activeOfferingsThisSemester} active offering
            {systemHealth.activeOfferingsThisSemester === 1 ? '' : 's'} ·{' '}
            {systemHealth.unassignedLecturers} lecturer
            {systemHealth.unassignedLecturers === 1 ? '' : 's'} without an active offering
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent Users">
          {recentActivity.users.length === 0 ? (
            <p className="text-sm text-text-muted">No recent users.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActivity.users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{user.name}</p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent Enrollments">
          {recentActivity.enrollments.length === 0 ? (
            <p className="text-sm text-text-muted">No recent enrollments.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActivity.enrollments.map((enrollment) => (
                <li key={enrollment.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{enrollment.studentName}</p>
                    <p className="text-xs text-text-muted">
                      {enrollment.courseCode} · {enrollment.courseName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      enrollment.status === 'enrolled'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {enrollment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Enrollment Trend (Last 6 Months)">
        {enrollmentOverview.length === 0 ? (
          <p className="text-sm text-text-muted">No enrollment data for the last 6 months.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentOverview} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar dataKey="active" stackId="a" fill="#22c55e" />
                <Bar dataKey="dropped" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>
    </div>
  )
}

export default AdminDashboardPage
