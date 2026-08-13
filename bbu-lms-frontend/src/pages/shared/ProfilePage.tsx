import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, User } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useProfile, type ProfileFormData } from '@/hooks/useProfile'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  locale: z.enum(['en', 'km']),
  studentId: z.string().optional(),
  departmentId: z.string().optional(),
  major: z.string().optional(),
  year: z.string().optional(),
  semesterId: z.string().optional(),
  title: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function hasRole(user: ReturnType<typeof useAuth>['user'], role: string) {
  return user?.roles.some((r) => r.name === role) ?? false
}

function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading, update, isUpdating } = useProfile()

  const isStudent = hasRole(user, 'student')
  const isLecturer = hasRole(user, 'lecturer')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      locale: 'en',
    },
  })

  useEffect(() => {
    if (!profile) return

    const values: Record<string, unknown> = {
      name: profile.user.name || '',
      phone: profile.user.phone || '',
      locale: profile.user.locale || 'en',
    }

    if (isStudent && profile.user.studentProfile) {
      const p = profile.user.studentProfile
      values.studentId = p.studentId || ''
      values.departmentId = p.department?.id ? String(p.department.id) : ''
      values.major = p.major || ''
      values.year = p.year ? String(p.year) : ''
      values.semesterId = p.semester?.id ? String(p.semester.id) : ''
    }

    if (isLecturer && profile.user.lecturerProfile) {
      const p = profile.user.lecturerProfile
      values.departmentId = p.department?.id ? String(p.department.id) : ''
      values.title = p.title || ''
    }

    reset(values)
  }, [profile, isStudent, isLecturer, reset])

  const onSubmit = async (values: ProfileFormData) => {
    await update(values)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-text">Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <AvatarUpload />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                value={profile?.user.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-text-muted"
              />
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
              <label className="mb-1 block text-sm font-medium text-text">Language</label>
              <select
                {...register('locale')}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              >
                <option value="en">English</option>
                <option value="km">ខ្មែរ</option>
              </select>
            </div>
          </div>
        </section>

        {isStudent && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-text">
              <User className="h-5 w-5 text-bbu-blue" />
              Student information
            </h2>

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
                  {...register('year')}
                  type="number"
                  min={1}
                  max={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">Department</label>
                <select
                  {...register('departmentId')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                >
                  <option value="">None</option>
                  {profile?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">Semester</label>
                <select
                  {...register('semesterId')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                >
                  <option value="">None</option>
                  {profile?.semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {isLecturer && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-text">Lecturer information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Title</label>
                <input
                  {...register('title')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">Department</label>
                <select
                  {...register('departmentId')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                >
                  <option value="">None</option>
                  {profile?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center rounded-lg bg-bbu-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-bbu-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfilePage
