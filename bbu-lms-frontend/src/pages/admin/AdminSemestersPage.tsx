import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { useAdminSemesters, type Semester, type SemesterFormData } from '@/hooks/useAdminSemesters'

const semesterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof semesterSchema>

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function SemesterModal({
  semester,
  onClose,
  onSave,
  isSaving,
}: {
  semester?: Semester | null
  onClose: () => void
  onSave: (data: SemesterFormData) => Promise<void>
  isSaving: boolean
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      name: semester?.name ?? '',
      startDate: semester?.startDate ?? '',
      endDate: semester?.endDate ?? '',
      isActive: semester?.isActive ?? true,
    },
  })

  useEffect(() => {
    reset({
      name: semester?.name ?? '',
      startDate: semester?.startDate ?? '',
      endDate: semester?.endDate ?? '',
      isActive: semester?.isActive ?? true,
    })
  }, [semester, reset])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{semester ? 'Edit Semester' : 'Create Semester'}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-muted hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) =>
            onSave({
              name: values.name,
              startDate: values.startDate,
              endDate: values.endDate,
              isActive: values.isActive,
            })
          )}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              placeholder="Fall 2026"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              />
              {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              />
              {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-bbu-blue" />
            <label htmlFor="isActive" className="text-sm text-text">Active</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {semester ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminSemestersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Semester | null>(null)
  const [deleting, setDeleting] = useState<Semester | null>(null)

  const {
    semesters,
    pagination,
    isLoading,
    create,
    isCreating,
    update,
    isUpdating,
    remove,
    isDeleting,
  } = useAdminSemesters({ search, page, perPage: 10 })

  async function handleSave(formData: SemesterFormData) {
    if (editing) {
      await update({ id: editing.id, formData })
    } else {
      await create(formData)
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleting) return
    await remove(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search semesters..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-text focus:border-bbu-blue focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
        >
          <Plus className="h-4 w-4" />
          Add Semester
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Start Date</th>
              <th className="px-4 py-3 font-medium">End Date</th>
              <th className="px-4 py-3 font-medium">Offerings</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : semesters?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No semesters found.
                </td>
              </tr>
            ) : (
              semesters?.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-text">{s.name}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(s.startDate)}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(s.endDate)}</td>
                  <td className="px-4 py-3 text-text-muted">{s.courseOfferingsCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(s)
                          setModalOpen(true)
                        }}
                        className="rounded p-1 text-text-muted hover:bg-gray-100"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(s)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-text-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-text-muted">
              {page} / {pagination.lastPage}
            </span>
            <button
              type="button"
              disabled={page >= pagination.lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <SemesterModal
          semester={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text">Delete Semester?</h3>
            <p className="mt-2 text-sm text-text-muted">
              This will permanently remove {deleting.name}.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSemestersPage
