import { useEffect, useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  GraduationCap,
  Briefcase,
  Filter,
} from 'lucide-react'

import { useUsers, type UserFormData, type UsersFilter } from '@/hooks/useUsers'
import type { User } from '@/contexts/AuthContext'

const ROLES = [
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'lecturer', label: 'Lecturer', icon: Briefcase },
  { value: 'student', label: 'Student', icon: GraduationCap },
] as const

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  departmentId: z.string().optional(),
  locale: z.enum(['en', 'km']),
  isActive: z.boolean(),
  studentId: z.string().optional(),
  major: z.string().optional(),
  year: z.string().optional(),
  semesterId: z.string().optional(),
  title: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

function roleBadgeClasses(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700'
    case 'lecturer':
      return 'bg-blue-100 text-blue-700'
    case 'student':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getInitialFormValues(user?: User | null): UserFormValues {
  if (!user) {
    return {
      name: '',
      email: '',
      phone: '',
      password: '',
      roles: [],
      departmentId: '',
      locale: 'en',
      isActive: true,
      studentId: '',
      major: '',
      year: '',
      semesterId: '',
      title: '',
    }
  }

  const isStudent = user.roles.some((r) => r.name === 'student')
  const isLecturer = user.roles.some((r) => r.name === 'lecturer')

  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    roles: user.roles.map((r) => r.name),
    departmentId: user.department?.id ? String(user.department.id) : '',
    locale: user.locale || 'en',
    isActive: user.isActive ?? true,
    studentId: isStudent && user.studentProfile ? user.studentProfile.studentId : '',
    major: isStudent && user.studentProfile ? user.studentProfile.major || '' : '',
    year: isStudent && user.studentProfile?.year ? String(user.studentProfile.year) : '',
    semesterId: isStudent && user.studentProfile?.semester?.id ? String(user.studentProfile.semester.id) : '',
    title: isLecturer && user.lecturerProfile ? user.lecturerProfile.title || '' : '',
  }
}

function AdminUsersPage() {
  const [filters, setFilters] = useState<UsersFilter>({
    search: '',
    role: undefined,
    status: 'active',
    sortBy: 'created_at',
    sortDir: 'desc',
    page: 1,
    perPage: 10,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const {
    users,
    pagination,
    isLoading,
    meta,
    create,
    isCreating,
    update,
    isUpdating,
    toggleActive,
    isTogglingActive,
  } = useUsers(filters)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: getInitialFormValues(),
  })

  const selectedRoles = watch('roles')
  const isStudent = selectedRoles.includes('student')
  const isLecturer = selectedRoles.includes('lecturer')

  useEffect(() => {
    if (isModalOpen) {
      reset(getInitialFormValues(editingUser))
    }
  }, [isModalOpen, editingUser, reset])

  const openCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const onSubmit = async (values: UserFormValues) => {
    const formData: UserFormData = {
      ...values,
      phone: values.phone,
      password: values.password,
    }

    if (editingUser) {
      await update({ id: editingUser.id, formData })
    } else {
      await create(formData)
    }

    closeModal()
  }

  const handleToggleRole = (role: string, checked: boolean) => {
    const next = checked
      ? [...selectedRoles, role]
      : selectedRoles.filter((r) => r !== role)
    setValue('roles', next, { shouldValidate: true })
  }

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Manage Users</h2>
          <p className="text-sm text-text-muted">Create, edit, deactivate and assign roles to accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-bbu-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-bbu-blue-dark"
        >
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email or phone"
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={filters.role || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: (e.target.value as UsersFilter['role']) || undefined,
                    page: 1,
                  }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              >
                <option value="">All roles</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (e.target.value as UsersFilter['status']) || undefined,
                  page: 1,
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as UsersFilter['sortBy'],
                  page: 1,
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            >
              <option value="name">Sort by name</option>
              <option value="email">Sort by email</option>
              <option value="created_at">Sort by created</option>
            </select>

            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc',
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-text hover:bg-gray-50"
              aria-label="Toggle sort direction"
            >
              {filters.sortDir === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-text">User</th>
                <th className="px-4 py-3 font-medium text-text">Roles</th>
                <th className="px-4 py-3 font-medium text-text">Department</th>
                <th className="px-4 py-3 font-medium text-text">Status</th>
                <th className="px-4 py-3 font-medium text-text">Created</th>
                <th className="px-4 py-3 text-right font-medium text-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : !users?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bbu-blue text-xs font-medium text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text">{user.name}</p>
                          <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role.name}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClasses(role.name)}`}
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {user.department?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded p-1.5 text-text-muted hover:bg-bbu-blue/10 hover:text-bbu-blue"
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(user.id)}
                          disabled={isTogglingActive}
                          className={`rounded p-1.5 ${
                            user.isActive
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          } disabled:opacity-60`}
                          aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
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
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-text-muted">
              Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                }
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-text hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-text hover:bg-gray-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-text">
                {editingUser ? 'Edit user' : 'Create user'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1.5 text-text-muted hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text">Full name</label>
                  <input
                    {...register('name')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Phone</label>
                  <input
                    {...register('phone')}
                    placeholder="+855 ..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Password {editingUser && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Language</label>
                  <select
                    {...register('locale')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  >
                    <option value="en">English</option>
                    <option value="km">ខ្មែរ</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Department</label>
                  <select
                    {...register('departmentId')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                  >
                    <option value="">None</option>
                    {meta?.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-text">Roles</label>
                <div className="flex flex-wrap gap-3">
                  {ROLES.map((role) => {
                    const checked = selectedRoles.includes(role.value)
                    return (
                      <label
                        key={role.value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                          checked
                            ? 'border-bbu-blue bg-bbu-blue/10 text-bbu-blue'
                            : 'border-gray-300 bg-white text-text hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={role.value}
                          checked={checked}
                          onChange={(e) => handleToggleRole(role.value, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                        />
                        <role.icon className="h-4 w-4" />
                        {role.label}
                      </label>
                    )
                  })}
                </div>
                {errors.roles && (
                  <p className="mt-1 text-xs text-red-500">{errors.roles.message}</p>
                )}
              </div>

              <div className="mb-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-text">
                  Active account
                </label>
              </div>

              {isStudent && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                    <GraduationCap className="h-4 w-4 text-bbu-blue" />
                    Student profile
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Student ID</label>
                      <input
                        {...register('studentId')}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                      />
                      {errors.studentId && (
                        <p className="mt-1 text-xs text-red-500">{errors.studentId.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Major</label>
                      <input
                        {...register('major')}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Year</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        {...register('year')}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Semester</label>
                      <select
                        {...register('semesterId')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                      >
                        <option value="">None</option>
                        {meta?.semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isLecturer && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                    <Briefcase className="h-4 w-4 text-bbu-blue" />
                    Lecturer profile
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Title</label>
                      <input
                        {...register('title')}
                        placeholder="e.g. Associate Professor"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-text hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex items-center rounded-lg bg-bbu-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-bbu-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : editingUser ? (
                    'Save changes'
                  ) : (
                    'Create user'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
