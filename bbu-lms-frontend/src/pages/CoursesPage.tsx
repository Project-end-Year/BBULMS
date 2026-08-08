import { Link } from 'react-router-dom'
import { BookOpen, Loader2, Users, CalendarDays, MapPin } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useMyCourses } from '@/hooks/useMyCourses'

function scheduleLabel(schedule?: { days?: string[]; start?: string; end?: string } | null) {
  if (!schedule || !schedule.days?.length) return null
  return `${schedule.days.join(', ')} · ${schedule.start || '?'}–${schedule.end || '?'}`
}

function CoursesPage() {
  const { user } = useAuth()
  const { offerings, isLoading } = useMyCourses()

  const roleLabel = user?.roles[0]?.name ?? 'user'

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-bbu-blue" />
        <h1 className="text-2xl font-semibold text-text">My Courses</h1>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !offerings?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-text-muted">
            No courses found for your {roleLabel} account yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((offering) => {
            const course = offering.course
            const schedule = scheduleLabel(offering.schedule)

            return (
              <Link
                key={offering.id}
                to={`/courses/${course.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {course.code}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text">{course.name}</h3>
                  </div>
                  <span className="rounded-full bg-bbu-blue/10 px-2 py-1 text-xs font-medium text-bbu-blue">
                    {course.credits} cr
                  </span>
                </div>

                <p className="mb-4 line-clamp-2 text-sm text-text-muted">
                  {course.description || 'No description available.'}
                </p>

                <div className="space-y-2 text-sm">
                  {offering.semester?.name && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <CalendarDays className="h-4 w-4" />
                      {offering.semester.name}
                    </div>
                  )}

                  {offering.lecturer?.name && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <Users className="h-4 w-4" />
                      {offering.lecturer.name}
                    </div>
                  )}

                  {offering.room && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <MapPin className="h-4 w-4" />
                      {offering.room}
                    </div>
                  )}

                  {schedule && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <CalendarDays className="h-4 w-4" />
                      {schedule}
                    </div>
                  )}
                </div>

                {typeof offering.enrollmentCount === 'number' && offering.capacity && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-text-muted">
                      <span>Enrolled</span>
                      <span>
                        {offering.enrollmentCount} / {offering.capacity}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-bbu-blue"
                        style={{
                          width: `${Math.min(
                            100,
                            (offering.enrollmentCount / offering.capacity) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CoursesPage
