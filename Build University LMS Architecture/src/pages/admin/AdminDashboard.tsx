import { Users, Building2, BookOpen, CalendarRange, TrendingUp, GraduationCap } from 'lucide-react'
import { users, faculties, programs, courses, courseOfferings, enrollments, semesters } from '../../lib/mock'

const currentSem = semesters.find((s) => s.isCurrent)!
const currentOfferings = courseOfferings.filter((o) => o.semesterId === currentSem.id)
const studentCount = users.filter((u) => u.role === 'student').length
const professorCount = users.filter((u) => u.role === 'professor').length
const totalEnrollments = enrollments.filter((e) => currentOfferings.some((o) => o.id === e.courseOfferingId) && e.status === 'active').length

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 font-semibold text-lg">Academic Overview</h2>
        <p className="text-slate-500 text-sm">Current semester: {currentSem.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Students" value={studentCount} sub="Across all programs" icon={<Users size={20} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Professors" value={professorCount} sub="Active faculty" icon={<GraduationCap size={20} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="Faculties" value={faculties.length} sub="Academic divisions" icon={<Building2 size={20} className="text-amber-600" />} color="bg-amber-50" />
        <StatCard label="Programs" value={programs.length} sub="Degree programs" icon={<TrendingUp size={20} className="text-violet-600" />} color="bg-violet-50" />
        <StatCard label="Courses" value={courses.length} sub="In catalog" icon={<BookOpen size={20} className="text-rose-600" />} color="bg-rose-50" />
        <StatCard label="Active Offerings" value={currentOfferings.length} sub={`${totalEnrollments} enrollments this term`} icon={<CalendarRange size={20} className="text-cyan-600" />} color="bg-cyan-50" />
      </div>

      {/* Current semester offerings table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Current Semester Course Offerings</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{currentOfferings.length} sections</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Professor</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrollment</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOfferings.map((offering) => {
                const course = courses.find((c) => c.id === offering.courseId)!
                const prof = users.find((u) => u.id === offering.professorId)!
                const pct = Math.round((offering.enrolled / offering.capacity) * 100)
                const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                return (
                  <tr key={offering.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{course.title}</div>
                      <div className="text-xs text-slate-400">{course.code} · {course.creditHours} cr</div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {prof.firstName} {prof.lastName}
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded">§{offering.section}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-24">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">{offering.enrolled}/{offering.capacity}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faculties.map((faculty) => {
          const facultyPrograms = programs.filter((p) => p.facultyId === faculty.id)
          const facultyStudents = users.filter((u) => u.role === 'student' && facultyPrograms.some((p) => p.id === u.programId))
          const facultyCourses = courses.filter((c) => facultyPrograms.some((p) => p.id === c.programId))
          return (
            <div key={faculty.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{faculty.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Code: {faculty.code}</div>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{facultyPrograms.length} programs</span>
              </div>
              <div className="flex gap-4 text-center">
                <div className="flex-1 bg-slate-50 rounded-lg py-2">
                  <div className="text-lg font-bold text-slate-900">{facultyStudents.length}</div>
                  <div className="text-[11px] text-slate-500">Students</div>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg py-2">
                  <div className="text-lg font-bold text-slate-900">{facultyCourses.length}</div>
                  <div className="text-[11px] text-slate-500">Courses</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
