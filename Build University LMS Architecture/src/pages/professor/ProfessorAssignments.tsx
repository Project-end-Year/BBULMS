import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { User, courseOfferings, courses, semesters, assignments as initialAssignments, submissionsMock, users, Assignment } from '../../lib/mock'

interface Props { user: User }

export default function ProfessorAssignments({ user }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [form, setForm] = useState({ courseOfferingId: 0, title: '', instruction: '', dueDate: '', totalScore: 50 })
  const [error, setError] = useState('')

  const currentSem = semesters.find((s) => s.isCurrent)!
  const myOfferings = courseOfferings.filter((o) => o.professorId === user.id && o.semesterId === currentSem.id)
  const myAssignments = assignments.filter((a) => myOfferings.some((o) => o.id === a.courseOfferingId))

  const openAdd = () => {
    setForm({ courseOfferingId: myOfferings[0]?.id ?? 0, title: '', instruction: '', dueDate: '', totalScore: 50 })
    setError('')
    setModalOpen(true)
  }

  const save = () => {
    if (!form.title.trim() || !form.dueDate) { setError('Title and due date are required.'); return }
    setAssignments((prev) => [...prev, { id: Date.now(), ...form }])
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this assignment?')) return
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  const isPast = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Assignments</h2>
          <p className="text-sm text-slate-500">{myAssignments.length} assignments across your courses</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      <div className="space-y-3">
        {myAssignments.map((assignment) => {
          const offering = myOfferings.find((o) => o.id === assignment.courseOfferingId)
          const course = offering ? courses.find((c) => c.id === offering.courseId) : null
          const submissions = submissionsMock.filter((s) => s.assignmentId === assignment.id)
          const graded = submissions.filter((s) => s.score != null).length
          const isExpanded = expanded === assignment.id
          const past = isPast(assignment.dueDate)
          return (
            <div key={assignment.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : assignment.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {course?.code?.slice(0, 2) ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{assignment.title}</div>
                    <div className="text-xs text-slate-400">{course?.code} · Due: <span className={past ? 'text-red-500 font-medium' : 'text-slate-500'}>{assignment.dueDate}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-slate-900">{graded}/{submissions.length}</div>
                    <div className="text-xs text-slate-400">graded</div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">{assignment.totalScore} pts</span>
                  <button onClick={(e) => { e.stopPropagation(); remove(assignment.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                    <X size={15} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="px-5 py-3 bg-slate-50 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Instructions: </span>{assignment.instruction}
                  </div>
                  {submissions.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-t border-slate-100">
                          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Comment</th>
                          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submissions.map((sub) => {
                          const student = users.find((u) => u.id === sub.studentId)
                          return (
                            <tr key={sub.id} className="hover:bg-slate-50">
                              <td className="px-5 py-2.5 font-medium text-slate-800">{student ? `${student.firstName} ${student.lastName}` : '—'}</td>
                              <td className="px-5 py-2.5 text-slate-500 text-xs max-w-xs truncate">{sub.comment}</td>
                              <td className="px-5 py-2.5 text-slate-500 text-xs">{sub.submittedAt}</td>
                              <td className="px-5 py-2.5">
                                {sub.score != null
                                  ? <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded">{sub.score}/{assignment.totalScore}</span>
                                  : <span className="text-amber-600 text-xs font-medium">Not graded</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-5 py-6 text-center text-slate-400 text-sm">No submissions yet.</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {myAssignments.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">No assignments yet. Add one to get started.</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Add Assignment</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                <select value={form.courseOfferingId} onChange={(e) => setForm((f) => ({ ...f, courseOfferingId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {myOfferings.map((o) => {
                    const c = courses.find((c) => c.id === o.courseId)
                    return <option key={o.id} value={o.id}>{c?.code} §{o.section} — {c?.title}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Assignment title" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructions</label>
                <textarea value={form.instruction} onChange={(e) => setForm((f) => ({ ...f, instruction: e.target.value }))} rows={3} placeholder="Describe the assignment task…" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Score</label>
                  <input type="number" min={1} value={form.totalScore} onChange={(e) => setForm((f) => ({ ...f, totalScore: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">Add Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
