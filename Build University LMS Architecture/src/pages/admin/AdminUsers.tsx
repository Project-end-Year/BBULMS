import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { User, users as initialUsers, programs } from '../../lib/mock'

type RoleFilter = 'all' | 'admin' | 'professor' | 'student'

const roleBadge: Record<string, string> = {
  admin: 'bg-amber-50 text-amber-700',
  professor: 'bg-emerald-50 text-emerald-700',
  student: 'bg-violet-50 text-violet-700',
}

export default function AdminUsers() {
  const [items, setItems] = useState<User[]>(initialUsers)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<{ firstName: string; lastName: string; email: string; role: User['role']; phone: string; programId: number | undefined; status: boolean }>({
    firstName: '', lastName: '', email: '', role: 'student', phone: '', programId: undefined, status: true,
  })
  const [error, setError] = useState('')

  const openAdd = () => {
    setEditing(null)
    setForm({ firstName: '', lastName: '', email: '', role: 'student', phone: '', programId: undefined, status: true })
    setError('')
    setModalOpen(true)
  }
  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, phone: u.phone, programId: u.programId, status: u.status })
    setError('')
    setModalOpen(true)
  }

  const save = () => {
    if (!form.firstName.trim() || !form.email.trim()) { setError('First name and email are required.'); return }
    if (editing) {
      setItems((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...form } : u))
    } else {
      setItems((prev) => [...prev, { id: Math.max(0, ...prev.map((u) => u.id)) + 1, ...form }])
    }
    setModalOpen(false)
  }

  const remove = (id: number) => {
    if (!confirm('Delete this user?')) return
    setItems((prev) => prev.filter((u) => u.id !== id))
  }

  const toggleStatus = (id: number) => {
    setItems((prev) => prev.map((u) => u.id === id ? { ...u, status: !u.status } : u))
  }

  const filtered = items.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = { all: items.length, admin: items.filter((u) => u.role === 'admin').length, professor: items.filter((u) => u.role === 'professor').length, student: items.filter((u) => u.role === 'student').length }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">{items.length} total accounts</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-white w-56" />
        </div>
        <div className="flex gap-1">
          {(['all', 'admin', 'professor', 'student'] as RoleFilter[]).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${roleFilter === r ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {r} {r !== 'all' ? `(${counts[r]})` : `(${counts.all})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Program</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const prog = user.programId ? programs.find((p) => p.id === user.programId) : null
              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{prog?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleStatus(user.id)} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${user.status ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {user.status ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(user.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User['role'] }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white capitalize">
                    <option value="admin">Admin</option>
                    <option value="professor">Professor</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              {form.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Program (Major)</label>
                  <select value={form.programId ?? ''} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value ? +e.target.value : undefined }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option value="">— None —</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} className="w-4 h-4 accent-blue-700 rounded" />
                <span className="text-sm font-medium text-slate-700">Account Active</span>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium">{editing ? 'Save Changes' : 'Add User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
