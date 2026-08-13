import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { useCourses, type Course, type CourseFormData } from '@/hooks/useCourses'

const courseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  description: z.string().optional(),
  credits: z.number().min(0).max(20, 'Invalid credits'),
  departmentId: z.number().optional(),
  programId: z.number().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof courseSchema>

function CourseModal({
  course,
  onClose,
  onSave,
  isSaving,
  meta,
}: {
  course?: Course | null
  onClose: () => void
  onSave: (data: CourseFormData) => Promise<void>
  isSaving: boolean
  meta: {
    departments: { id: number; name: string }[]
    programs: { id: number; name: string; departmentId?: number }[]
  } | undefined
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code ?? '',
      name: course?.name ?? '',
      description: course?.description ?? '',
      credits: course?.credits ?? 3,
      departmentId: course?.department?.id,
      programId: course?.program?.id,
      isActive: course?.isActive ?? true,
    },
  })

  const selectedDepartmentId = watch('departmentId')
  const availablePrograms =
    meta?.programs?.filter((p) => !selectedDepartmentId || p.departmentId === selectedDepartmentId) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{course ? 'Edit Course' : 'Create Course'}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-muted hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) =>
            onSave({
              code: values.code,
              name: values.name,
              description: values.description,
              credits: values.credits,
              departmentId: values.departmentId,
              programId: values.programId,
              isActive: values.isActive,
            })
          )}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Code</label>
              <input
                {...register('code')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Credits</label>
              <input
                type="number"
                {...register('credits', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              />
              {errors.credits && <p className="mt-1 text-xs text-red-600">{errors.credits.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Department</label>
              <select
                {...register('departmentId', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              >
                <option value="">None</option>
                {meta?.departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Program</label>
              <select
                {...register('programId', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text focus:border-bbu-blue focus:outline-none"
              >
                <option value="">None</option>
                {availablePrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="courseIsActive" {...register('isActive')} className="h-4 w-4 rounded border-gray-300 text-bbu-blue" />
            <label htmlFor="courseIsActive" className="text-sm text-text">Active</label>
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
              {course ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function AdminCoursesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)

  const {
    courses,
    pagination,
    isLoading,
    meta,
    create,
    isCreating,
    update,
    isUpdating,
    toggleActive,
    isTogglingActive,
  } = useCourses({ search, page, perPage: 10 })

  async function handleSave(formData: CourseFormData) {
    if (editing) {
      await update({ id: editing.id, formData })
    } else {
      await create(formData)
    }
    setModalOpen(false)
    setEditing(null)
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
            placeholder="Search courses..."
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
          Add Course
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : courses?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses?.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3 font-medium text-text">{course.code}</td>
                  <td className="px-4 py-3 text-text">{course.name}</td>
                  <td className="px-4 py-3 text-text-muted">{course.department?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-text-muted">{course.credits}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        course.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(course.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(course)
                          setModalOpen(true)
                        }}
                        className="rounded p-1 text-text-muted hover:bg-gray-100"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(course.id)}
                        disabled={isTogglingActive}
                        className={`rounded p-1 ${course.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        aria-label={course.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {course.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
            <span className="text-text-muted">{page} / {pagination.lastPage}</span>
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

      {modalOpen && meta && (
        <CourseModal
          course={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
          meta={meta}
        />
      )}
    </div>
  )
}

export default AdminCoursesPage
