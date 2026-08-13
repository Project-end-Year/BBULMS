import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Program, programs as initialPrograms, faculties, users } from '../../lib/mock'

const degreeLevels = ['associate', 'bachelor', 'master', 'doctorate'] as const
const degreeBadge: Record<string, string> = {
  associate: 'bg-sky-50 text-sky-700',
  bachelor: 'bg-blue-50 text-blue-700',
  master: 'bg-violet-50 text-violet-700',
  doctorate: 'bg-rose-50 text-rose-700',
}

export default function AdminPrograms() {
  const [items, setItems] = useState<Program[]>(initialPrograms)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Program | null>(null)
  const [form, setForm] = useState({ facultyId: 1, name: '', degreeLevel: 'bachelor' as Program['degreeLevel'], durationYears: 4 })
  const [error, setError] = useState('')
  const [filterFaculty, setFilterFaculty] = useState(0)

  const openAdd = () => { setEditing(null); setForm({ facultyId: faculties[0].id, name: '', degreeLevel: 'bachelor', durationYears: 4 }); setError(''); setModalOpen(true) }
  const openEdit = (p: Program) => { setEditing(p); setForm({ facultyId: p.facultyId, name: p.name, degreeLevel: p.degreeLevel, durationYears: p.durationYears }); setError(''); setModalOpen(true) }

  const save = () => {
    if (!form.name.trim()) { setError('Program name is required.'); return }
    if (editing) {
      setItems((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...form } : p))
    } else {
      setItems((prev) => [...prev, { id: Math.max(0, ...prev.map((p) => p.id)) + 1, ...form }])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this program?')) return
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const filtered = filterFaculty ? items.filter((p) => p.facultyId === filterFaculty) : items

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Programs</h2>
          <p className="text-sm text-slate-500">{items.length} degree programs across {faculties.length} faculties</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Program
        </button>
      </div>

      {/* Faculty filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterFaculty(0)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFaculty === 0 ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All Faculties
        </button>
        {faculties.map((f) => (
          <button key={f.id} onClick={() => setFilterFaculty(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterFaculty === f.id ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f.code}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Faculty</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Degree</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((prog) => {
              const faculty = faculties.find((f) => f.id === prog.facultyId)!
              const stuCount = users.filter((u) => u.role === 'student' && u.programId === prog.id).length
              return (
                <tr key={prog.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{prog.name}</td>
                  <td className="px-5 py-3">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">{faculty.code}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${degreeBadge[prog.degreeLevel]}`}>{prog.degreeLevel}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{prog.durationYears} yr{prog.durationYears > 1 ? 's' : ''}</td>
                  <td className="px-5 py-3 text-slate-600">{stuCount}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(prog)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(prog.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
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
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Program' : 'Add Program'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Faculty</label>
                <select value={form.facultyId} onChange={(e) => setForm((f) => ({ ...f, facultyId: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Program Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Business Administration" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Degree Level</label>
                  <select value={form.degreeLevel} onChange={(e) => setForm((f) => ({ ...f, degreeLevel: e.target.value as Program['degreeLevel'] }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white capitalize">
                    {degreeLevels.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (years)</label>
                  <input type="number" min={1} max={7} value={form.durationYears} onChange={(e) => setForm((f) => ({ ...f, durationYears: +e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">{editing ? 'Save Changes' : 'Add Program'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
