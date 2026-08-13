import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { CourseOffering, courseOfferings as initial, courses, semesters, users } from '../../lib/mock'

export default function AdminCourseOfferings() {
  const [items, setItems] = useState<CourseOffering[]>(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CourseOffering | null>(null)
  const [form, setForm] = useState({ courseId: 1, semesterId: 4, professorId: 2, section: 'A', capacity: 40 })
  const [error, setError] = useState('')
  const [filterSem, setFilterSem] = useState(4)

  const professors = users.filter((u) => u.role === 'professor')
  const currentSem = semesters.find((s) => s.isCurrent)!

  const openAdd = () => {
    setEditing(null)
    setForm({ courseId: courses[0].id, semesterId: filterSem || currentSem.id, professorId: professors[0].id, section: 'A', capacity: 40 })
    setError('')
    setModalOpen(true)
  }
  const openEdit = (o: CourseOffering) => {
    setEditing(o)
    setForm({ courseId: o.courseId, semesterId: o.semesterId, professorId: o.professorId, section: o.section, capacity: o.capacity })
    setError('')
    setModalOpen(true)
  }

  const save = () => {
    if (!form.section.trim()) { setError('Section is required.'); return }
    const duplicate = items.find((o) =>
      o.courseId === form.courseId &&
      o.semesterId === form.semesterId &&
      o.section === form.section &&
      (!editing || o.id !== editing.id)
    )
    if (duplicate) { setError('This course/semester/section combination already exists.'); return }
    if (editing) {
      setItems((prev) => prev.map((o) => o.id === editing.id ? { ...o, ...form } : o))
    } else {
      const newId = Math.max(0, ...items.map((o) => o.id)) + 1
      setItems((prev) => [...prev, { id: newId, ...form, enrolled: 0 }])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this course offering?')) return
    setItems((prev) => prev.filter((o) => o.id !== id))
  }

  const filtered = filterSem ? items.filter((o) => o.semesterId === filterSem) : items

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Course Offerings</h2>
          <p className="text-sm text-slate-500">Schedule courses by semester, professor, and section</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Offering
        </button>
      </div>

      {/* Semester filter */}
      <div className="flex gap-2 flex-wrap">
        {semesters.map((s) => (
          <button key={s.id} onClick={() => setFilterSem(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${filterSem === s.id ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s.name}
            {s.isCurrent && <span className="bg-white/20 text-white text-[10px] px-1 rounded">Current</span>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Professor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrollment</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((offering) => {
              const course = courses.find((c) => c.id === offering.courseId)!
              const prof = professors.find((p) => p.id === offering.professorId)
              const pct = Math.round((offering.enrolled / offering.capacity) * 100)
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <tr key={offering.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{course?.title ?? '—'}</div>
                    <div className="text-xs text-slate-400">{course?.code} · {course?.creditHours} cr</div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {prof ? `${prof.firstName} ${prof.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded">§{offering.section}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20">
                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 tabular-nums">{offering.enrolled}/{offering.capacity}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(offering)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(offering.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No offerings for this semester.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Offering' : 'Add Course Offering'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
                <select value={form.semesterId} onChange={(e) => setForm((f) => ({ ...f, semesterId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Professor</label>
                <select value={form.professorId} onChange={(e) => setForm((f) => ({ ...f, professorId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {professors.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                  <input type="text" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value.toUpperCase() }))} maxLength={3} placeholder="A" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
                  <input type="number" min={5} max={200} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">{editing ? 'Save Changes' : 'Add Offering'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
