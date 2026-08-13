import { useState } from 'react'
import { Plus, Pencil, Trash2, X, CheckCircle } from 'lucide-react'
import { Semester, semesters as initialSemesters } from '../../lib/mock'

export default function AdminSemesters() {
  const [items, setItems] = useState<Semester[]>(initialSemesters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Semester | null>(null)
  const [form, setForm] = useState({ name: '', academicYear: '', startDate: '', endDate: '', isCurrent: false })
  const [error, setError] = useState('')

  const openAdd = () => { setEditing(null); setForm({ name: '', academicYear: '', startDate: '', endDate: '', isCurrent: false }); setError(''); setModalOpen(true) }
  const openEdit = (s: Semester) => { setEditing(s); setForm({ name: s.name, academicYear: s.academicYear, startDate: s.startDate, endDate: s.endDate, isCurrent: s.isCurrent }); setError(''); setModalOpen(true) }

  const save = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) { setError('Name, start date, and end date are required.'); return }
    if (editing) {
      setItems((prev) => prev.map((s) => {
        if (s.id === editing.id) return { ...s, ...form }
        if (form.isCurrent) return { ...s, isCurrent: false }
        return s
      }))
    } else {
      const newId = Math.max(0, ...items.map((s) => s.id)) + 1
      setItems((prev) => [
        ...(form.isCurrent ? prev.map((s) => ({ ...s, isCurrent: false })) : prev),
        { id: newId, ...form }
      ])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this semester?')) return
    setItems((prev) => prev.filter((s) => s.id !== id))
  }

  const setCurrent = (id: number) => {
    setItems((prev) => prev.map((s) => ({ ...s, isCurrent: s.id === id })))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Semesters</h2>
          <p className="text-sm text-slate-500">{items.length} academic terms</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Semester
        </button>
      </div>

      <div className="space-y-3">
        {[...items].reverse().map((sem) => (
          <div key={sem.id} className={`bg-white rounded-xl border p-5 transition-all ${sem.isCurrent ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{sem.name}</span>
                    {sem.isCurrent && (
                      <span className="inline-flex items-center gap-1 bg-blue-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} /> Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">Academic Year: {sem.academicYear}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!sem.isCurrent && (
                  <button onClick={() => setCurrent(sem.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                    Set Current
                  </button>
                )}
                <button onClick={() => openEdit(sem)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                <button onClick={() => remove(sem.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="mt-3 flex gap-6 text-sm text-slate-500">
              <div><span className="text-slate-400 text-xs">Start</span><br /><span className="text-slate-700 font-medium">{sem.startDate}</span></div>
              <div><span className="text-slate-400 text-xs">End</span><br /><span className="text-slate-700 font-medium">{sem.endDate}</span></div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Semester' : 'Add Semester'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Fall 2025–2026" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Year</label>
                <input type="text" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-2026" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))} className="w-4 h-4 accent-blue-700 rounded" />
                <span className="text-sm font-medium text-slate-700">Set as current semester</span>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">{editing ? 'Save Changes' : 'Add Semester'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
