import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Save } from 'lucide-react'
import { User, courseOfferings, courses, semesters, enrollments, attendanceRecords as initialRecords, users, AttendanceRecord, AttendanceStatus } from '../../lib/mock'

interface Props { user: User }

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; active: string; inactive: string }> = {
  present: { label: 'P', icon: <CheckCircle2 size={14} />, active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600' },
  late: { label: 'L', icon: <Clock size={14} />, active: 'bg-amber-500 text-white border-amber-500', inactive: 'border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-600' },
  absent: { label: 'A', icon: <XCircle size={14} />, active: 'bg-red-500 text-white border-red-500', inactive: 'border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-600' },
}

const today = new Date().toISOString().slice(0, 10)

export default function ProfessorAttendance({ user }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set())
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myOfferings = courseOfferings.filter((o) => o.professorId === user.id && o.semesterId === currentSem.id)
  const [selectedOfferingId, setSelectedOfferingId] = useState(myOfferings[0]?.id ?? 0)
  const [selectedDate, setSelectedDate] = useState(today)
  const [draft, setDraft] = useState<Record<number, AttendanceStatus>>({})

  const selectedOffering = myOfferings.find((o) => o.id === selectedOfferingId)
  const course = selectedOffering ? courses.find((c) => c.id === selectedOffering.courseId) : null
  const enrolledStudents = enrollments
    .filter((e) => e.courseOfferingId === selectedOfferingId && e.status === 'active')
    .map((e) => users.find((u) => u.id === e.studentId)!)
    .filter(Boolean)

  const getStatus = (studentId: number): AttendanceStatus | undefined => {
    if (draft[studentId]) return draft[studentId]
    return records.find((r) => r.studentId === studentId && r.courseOfferingId === selectedOfferingId && r.date === selectedDate)?.status
  }

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }))
    setSavedDates((prev) => { const s = new Set(prev); s.delete(selectedDate); return s })
  }

  const saveAll = () => {
    const updates = Object.entries(draft).map(([sId, status]) => ({
      studentId: +sId, status,
    }))
    setRecords((prev) => {
      let next = [...prev]
      for (const { studentId, status } of updates) {
        const idx = next.findIndex((r) => r.studentId === studentId && r.courseOfferingId === selectedOfferingId && r.date === selectedDate)
        if (idx >= 0) {
          next[idx] = { ...next[idx], status }
        } else {
          next = [...next, { id: Date.now() + studentId, studentId, courseOfferingId: selectedOfferingId, date: selectedDate, status }]
        }
      }
      return next
    })
    setSavedDates((prev) => new Set(prev).add(selectedDate))
    setDraft({})
  }

  // Unique dates that have records for this offering
  const existingDates = [...new Set(records.filter((r) => r.courseOfferingId === selectedOfferingId).map((r) => r.date))].sort().reverse()
  const summary = (status: AttendanceStatus) => enrolledStudents.filter((s) => getStatus(s.id) === status).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Attendance</h2>
        <p className="text-sm text-slate-500">Mark student attendance per class session</p>
      </div>

      {/* Course selector */}
      <div className="flex gap-2 flex-wrap">
        {myOfferings.map((o) => {
          const c = courses.find((c) => c.id === o.courseId)!
          return (
            <button
              key={o.id}
              onClick={() => { setSelectedOfferingId(o.id); setDraft({}) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedOfferingId === o.id ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {c.code} §{o.section}
            </button>
          )
        })}
      </div>

      {selectedOffering && course && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left: date picker + history */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setDraft({}) }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {existingDates.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">History</div>
                <div className="space-y-1">
                  {existingDates.slice(0, 8).map((d) => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setDraft({}) }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedDate === d ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: attendance table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{course.title} — {selectedDate}</h3>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-emerald-600 font-medium">Present: {summary('present')}</span>
                    <span className="text-amber-600 font-medium">Late: {summary('late')}</span>
                    <span className="text-red-600 font-medium">Absent: {summary('absent')}</span>
                  </div>
                </div>
                <button
                  onClick={saveAll}
                  disabled={Object.keys(draft).length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save size={15} /> Save Attendance
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {enrolledStudents.map((student) => {
                  const current = getStatus(student.id)
                  return (
                    <div key={student.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-400">{student.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {(Object.keys(statusConfig) as AttendanceStatus[]).map((s) => {
                          const cfg = statusConfig[s]
                          const active = current === s
                          return (
                            <button
                              key={s}
                              onClick={() => setStatus(student.id, s)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active ? cfg.active : cfg.inactive}`}
                              title={s.charAt(0).toUpperCase() + s.slice(1)}
                            >
                              {cfg.icon} {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {enrolledStudents.length === 0 && (
                  <div className="px-5 py-10 text-center text-slate-400 text-sm">No students enrolled.</div>
                )}
              </div>

              {savedDates.has(selectedDate) && (
                <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle2 size={15} /> Attendance saved for {selectedDate}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
