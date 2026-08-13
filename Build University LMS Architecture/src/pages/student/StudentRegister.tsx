import { useState } from 'react'
import { CheckCircle, Users, BookOpen, AlertCircle } from 'lucide-react'
import { User, courseOfferings, courses, semesters, enrollments as initialEnrollments, users, programs, faculties, Enrollment } from '../../lib/mock'

interface Props { user: User }

export default function StudentRegister({ user }: Props) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [filterFaculty, setFilterFaculty] = useState(0)

  const currentSem = semesters.find((s) => s.isCurrent)!
  const openOfferings = courseOfferings.filter((o) => o.semesterId === currentSem.id)

  const isEnrolled = (offeringId: number) =>
    enrollments.some((e) => e.studentId === user.id && e.courseOfferingId === offeringId && e.status === 'active')

  const enroll = (offeringId: number) => {
    const offering = openOfferings.find((o) => o.id === offeringId)!
    const currentCount = enrollments.filter((e) => e.courseOfferingId === offeringId && e.status === 'active').length
    if (currentCount >= offering.capacity) {
      setFlash({ type: 'error', message: 'This course offering is at full capacity.' })
      setTimeout(() => setFlash(null), 3000)
      return
    }
    const newEnrollment: Enrollment = {
      id: Date.now(), studentId: user.id, courseOfferingId: offeringId,
      status: 'active', enrolledAt: new Date().toISOString().slice(0, 10),
    }
    setEnrollments((prev) => [...prev, newEnrollment])
    setFlash({ type: 'success', message: 'Successfully enrolled in course!' })
    setTimeout(() => setFlash(null), 3000)
  }

  const drop = (offeringId: number) => {
    if (!confirm('Drop this course?')) return
    setEnrollments((prev) =>
      prev.map((e) => e.studentId === user.id && e.courseOfferingId === offeringId ? { ...e, status: 'dropped' as const } : e)
    )
    setFlash({ type: 'success', message: 'Course dropped successfully.' })
    setTimeout(() => setFlash(null), 3000)
  }

  const getEnrolledCount = (offeringId: number) =>
    enrollments.filter((e) => e.courseOfferingId === offeringId && e.status === 'active').length

  const filtered = openOfferings.filter((o) => {
    if (!filterFaculty) return true
    const c = courses.find((c) => c.id === o.courseId)
    const p = c ? programs.find((p) => p.id === c.programId) : null
    return p?.facultyId === filterFaculty
  })

  const myActiveCount = enrollments.filter((e) => e.studentId === user.id && e.status === 'active' && openOfferings.some((o) => o.id === e.courseOfferingId)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Course Registration</h2>
          <p className="text-sm text-slate-500">{currentSem.name} · You are enrolled in {myActiveCount} course{myActiveCount !== 1 ? 's' : ''} this semester</p>
        </div>
      </div>

      {flash && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {flash.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {flash.message}
        </div>
      )}

      {/* Faculty filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterFaculty(0)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFaculty === 0 ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All Faculties
        </button>
        {faculties.map((f) => (
          <button key={f.id} onClick={() => setFilterFaculty(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFaculty === f.id ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f.code} — {f.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Professor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Capacity</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((offering) => {
              const course = courses.find((c) => c.id === offering.courseId)!
              const prof = users.find((u) => u.id === offering.professorId)
              const enrolled = getEnrolledCount(offering.id)
              const pct = Math.round((enrolled / offering.capacity) * 100)
              const isFull = enrolled >= offering.capacity
              const alreadyEnrolled = isEnrolled(offering.id)
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <tr key={offering.id} className={`hover:bg-slate-50 transition-colors ${alreadyEnrolled ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {course.code.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{course.title}</div>
                        <div className="text-xs text-slate-400">{course.code} · {course.creditHours} cr</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                    {prof ? `${prof.firstName} ${prof.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">§{offering.section}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">{enrolled}/{offering.capacity}</span>
                      </div>
                      {isFull && <div className="flex items-center gap-1 text-red-500 text-xs"><Users size={11} /> Full</div>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {alreadyEnrolled ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={13} /> Enrolled</span>
                        <button onClick={() => drop(offering.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors">Drop</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => enroll(offering.id)}
                        disabled={isFull}
                        className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <BookOpen size={13} />
                        {isFull ? 'Full' : 'Register'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No course offerings available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
