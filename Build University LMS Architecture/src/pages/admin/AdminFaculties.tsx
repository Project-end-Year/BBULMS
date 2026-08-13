import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Faculty, faculties as initialFaculties, programs, users } from '../../lib/mock'

export default function AdminFaculties() {
  const [items, setItems] = useState<Faculty[]>(initialFaculties)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Faculty | null>(null)
  const [form, setForm] = useState({ name: '', code: '' })
  const [error, setError] = useState('')

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '' }); setError(''); setModalOpen(true) }
  const openEdit = (f: Faculty) => { setEditing(f); setForm({ name: f.name, code: f.code }); setError(''); setModalOpen(true) }

  const save = () => {
    if (!form.name.trim() || !form.code.trim()) { setError('Name and code are required.'); return }
    if (editing) {
      setItems((prev) => prev.map((f) => f.id === editing.id ? { ...f, ...form, code: form.code.toUpperCase() } : f))
    } else {
      const newId = Math.max(0, ...items.map((f) => f.id)) + 1
      setItems((prev) => [...prev, { id: newId, name: form.name, code: form.code.toUpperCase() }])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this faculty?')) return
    setItems((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Faculties</h2>
          <p className="text-sm text-slate-500">{items.length} academic divisions</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Faculty Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Programs</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((faculty) => {
              const progCount = programs.filter((p) => p.facultyId === faculty.id).length
              const stuCount = users.filter((u) => u.role === 'student' && programs.filter((p) => p.facultyId === faculty.id).some((p) => p.id === u.programId)).length
              return (
                <tr key={faculty.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{faculty.name}</td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-50 text-blue-700 font-mono text-xs px-2 py-0.5 rounded font-semibold">{faculty.code}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{progCount}</td>
                  <td className="px-5 py-3 text-slate-600">{stuCount}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(faculty)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(faculty.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Faculty' : 'Add Faculty'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Faculty Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Business Management"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. BM"
                  maxLength={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
                {editing ? 'Save Changes' : 'Add Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
