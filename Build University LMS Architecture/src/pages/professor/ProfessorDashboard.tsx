import { BookOpen, Users, ClipboardList, MessageSquare } from 'lucide-react'
import { User, courseOfferings, courses, semesters, enrollments, assignments, submissionsMock, messages } from '../../lib/mock'

interface Props { user: User }

export default function ProfessorDashboard({ user }: Props) {
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myOfferings = courseOfferings.filter((o) => o.professorId === user.id && o.semesterId === currentSem.id)
  const myOfferingIds = myOfferings.map((o) => o.id)

  const totalStudents = enrollments.filter((e) => myOfferingIds.includes(e.courseOfferingId) && e.status === 'active').length
  const myAssignments = assignments.filter((a) => myOfferingIds.includes(a.courseOfferingId))
  const pendingSubmissions = submissionsMock.filter((s) => myAssignments.some((a) => a.id === s.assignmentId) && s.score == null).length
  const unreadMessages = messages.filter((m) => m.receiverId === user.id && !m.isRead).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 font-semibold text-lg">Welcome back, {user.firstName}!</h2>
        <p className="text-slate-500 text-sm">{currentSem.name} · {myOfferings.length} active course{myOfferings.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Courses', value: myOfferings.length, icon: <BookOpen size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Students', value: totalStudents, icon: <Users size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Pending Grades', value: pendingSubmissions, icon: <ClipboardList size={18} className="text-amber-600" />, color: 'bg-amber-50' },
          { label: 'Unread Messages', value: unreadMessages, icon: <MessageSquare size={18} className="text-violet-600" />, color: 'bg-violet-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Course offering cards */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">This Semester's Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myOfferings.map((offering) => {
            const course = courses.find((c) => c.id === offering.courseId)!
            const enrolled = enrollments.filter((e) => e.courseOfferingId === offering.id && e.status === 'active').length
            const offerAssignments = assignments.filter((a) => a.courseOfferingId === offering.id)
            const pct = Math.round((offering.enrolled / offering.capacity) * 100)
            return (
              <div key={offering.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                    {course.code.slice(0, 2)}
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">§{offering.section}</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1">{course.title}</div>
                <div className="text-xs text-slate-400 mb-3">{course.code} · {course.creditHours} credits</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{enrolled} students enrolled</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-3 text-xs text-slate-500">
                  <span>{offerAssignments.length} assignments</span>
                  <span>·</span>
                  <span className="text-blue-600 font-medium">{course.creditHours} cr hrs</span>
                </div>
              </div>
            )
          })}
          {myOfferings.length === 0 && (
            <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
              No course offerings assigned for this semester.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming assignments / submissions */}
      {myAssignments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Assignments</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myAssignments.map((a) => {
                const offering = myOfferings.find((o) => o.id === a.courseOfferingId)!
                const course = courses.find((c) => c.id === offering?.courseId)
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{a.title}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{course?.code}</td>
                    <td className="px-5 py-3 text-slate-600">{a.dueDate}</td>
                    <td className="px-5 py-3 text-slate-600">{a.totalScore} pts</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
