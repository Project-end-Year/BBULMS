import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Course, courses as initialCourses, programs, faculties } from '../../lib/mock'

export default function AdminCourses() {
  const [items, setItems] = useState<Course[]>(initialCourses)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState({ programId: 1, code: '', title: '', creditHours: 3, description: '' })
  const [error, setError] = useState('')
  const [filterProgram, setFilterProgram] = useState(0)
  const [search, setSearch] = useState('')

  const openAdd = () => { setEditing(null); setForm({ programId: programs[0].id, code: '', title: '', creditHours: 3, description: '' }); setError(''); setModalOpen(true) }
  const openEdit = (c: Course) => { setEditing(c); setForm({ programId: c.programId, code: c.code, title: c.title, creditHours: c.creditHours, description: c.description }); setError(''); setModalOpen(true) }

  const save = () => {
    if (!form.code.trim() || !form.title.trim()) { setError('Code and title are required.'); return }
    if (editing) {
      setItems((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c))
    } else {
      setItems((prev) => [...prev, { id: Math.max(0, ...prev.map((c) => c.id)) + 1, ...form }])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this course?')) return
    setItems((prev) => prev.filter((c) => c.id !== id))
  }

  const filtered = items.filter((c) => {
    if (filterProgram && c.programId !== filterProgram) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Courses</h2>
          <p className="text-sm text-slate-500">{items.length} courses in catalog</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by code or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-white w-64"
        />
        <select value={filterProgram} onChange={(e) => setFilterProgram(+e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value={0}>All Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((course) => {
              const prog = programs.find((p) => p.id === course.programId)!
              const faculty = faculties.find((f) => f.id === prog.facultyId)!
              return (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-semibold">{course.code}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{course.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{course.description}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-slate-700 text-xs">{prog.name}</div>
                    <div className="text-slate-400 text-xs">{faculty.name}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">{course.creditHours} cr</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(course)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(course.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No courses match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS101" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Credit Hours</label>
                  <input type="number" min={1} max={6} value={form.creditHours} onChange={(e) => setForm((f) => ({ ...f, creditHours: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Programming Fundamentals" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Program</label>
                <select value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief course description…" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">{editing ? 'Save Changes' : 'Add Course'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
