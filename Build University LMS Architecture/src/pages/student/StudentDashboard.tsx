import { BookOpen, ClipboardList, GraduationCap, CalendarCheck } from 'lucide-react'
import { User, courseOfferings, courses, semesters, enrollments, assignments, grades, lessons, programs } from '../../lib/mock'

interface Props { user: User }

export default function StudentDashboard({ user }: Props) {
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myEnrollments = enrollments.filter((e) => e.studentId === user.id && e.status === 'active')
  const myOfferingIds = myEnrollments.map((e) => e.courseOfferingId)
  const myOfferings = courseOfferings.filter((o) => myOfferingIds.includes(o.id))

  const myAssignments = assignments.filter((a) => myOfferingIds.includes(a.courseOfferingId))
  const upcoming = myAssignments.filter((a) => new Date(a.dueDate) >= new Date()).sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const allGrades = grades.filter((g) => g.studentId === user.id)
  // Cumulative GPA
  let totalPoints = 0, totalCredits = 0
  for (const g of allGrades) {
    const co = courseOfferings.find((o) => o.id === g.courseOfferingId)
    const c = co ? courses.find((c) => c.id === co.courseId) : null
    if (c) { totalPoints += g.gradePoints * c.creditHours; totalCredits += c.creditHours }
  }
  const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '—'

  const prog = user.programId ? programs.find((p) => p.id === user.programId) : null
  const recentLessons = lessons.filter((l) => myOfferingIds.includes(l.courseOfferingId)).sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 font-semibold text-lg">Welcome, {user.firstName}!</h2>
        <p className="text-slate-500 text-sm">{currentSem.name} · {prog?.name ?? 'No program assigned'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><BookOpen size={18} className="text-blue-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{myOfferings.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Enrolled Courses</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><ClipboardList size={18} className="text-amber-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{upcoming.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Upcoming Assignments</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center"><GraduationCap size={18} className="text-violet-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{cumulativeGPA}</div>
          <div className="text-xs text-slate-500 mt-0.5">Cumulative GPA</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center"><CalendarCheck size={18} className="text-emerald-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCredits}</div>
          <div className="text-xs text-slate-500 mt-0.5">Credits Earned</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Current courses */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-slate-900">Current Courses</h3>
          {myOfferings.length > 0 ? (
            <div className="space-y-2">
              {myOfferings.map((offering) => {
                const course = courses.find((c) => c.id === offering.courseId)!
                const offerAssignments = assignments.filter((a) => a.courseOfferingId === offering.id)
                const offerLessons = lessons.filter((l) => l.courseOfferingId === offering.id)
                return (
                  <div key={offering.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {course.code.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{course.title}</div>
                      <div className="text-xs text-slate-400">{course.code} · §{offering.section} · {course.creditHours} credits</div>
                    </div>
                    <div className="flex gap-4 text-center shrink-0 hidden sm:flex">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{offerLessons.length}</div>
                        <div className="text-xs text-slate-400">Lessons</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{offerAssignments.length}</div>
                        <div className="text-xs text-slate-400">Tasks</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              You are not enrolled in any courses this semester.<br />
              <span className="text-blue-600 text-sm font-medium">Go to Registration to enroll.</span>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming assignments */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Upcoming Assignments</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcoming.slice(0, 5).map((a) => {
                const co = myOfferings.find((o) => o.id === a.courseOfferingId)
                const c = co ? courses.find((c) => c.id === co.courseId) : null
                const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000)
                return (
                  <div key={a.id} className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-sm truncate">{a.title}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-400">{c?.code}</span>
                      <span className={`text-xs font-medium ${daysLeft <= 2 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                      </span>
                    </div>
                  </div>
                )
              })}
              {upcoming.length === 0 && <div className="px-4 py-6 text-center text-slate-400 text-xs">No upcoming assignments</div>}
            </div>
          </div>

          {/* Recent lessons */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Recent Lessons</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentLessons.map((l) => {
                const co = myOfferings.find((o) => o.id === l.courseOfferingId)
                const c = co ? courses.find((c) => c.id === co.courseId) : null
                return (
                  <div key={l.id} className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-sm truncate">{l.title}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-400">{c?.code}</span>
                      <span className="text-xs text-slate-400">{l.publishDate}</span>
                    </div>
                  </div>
                )
              })}
              {recentLessons.length === 0 && <div className="px-4 py-6 text-center text-slate-400 text-xs">No lessons yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
