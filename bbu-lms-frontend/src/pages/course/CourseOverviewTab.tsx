import { BookOpen, CalendarDays, MapPin, Users, Clock, Award, Building2 } from 'lucide-react'

import type { CourseDetailSummary, CourseOfferingSummary, Schedule } from '@/hooks/useCourseDetail'

interface CourseOverviewTabProps {
  data: CourseDetailSummary
}

function scheduleLabel(schedule: Schedule | null | undefined): string | null {
  if (!schedule || !schedule.days?.length) return null
  return `${schedule.days.join(', ')} · ${schedule.start || '?'}–${schedule.end || '?'}`
}

function CourseOverviewTab({ data }: CourseOverviewTabProps) {
  const { course, offerings, context } = data

  const primaryOffering: CourseOfferingSummary | undefined =
    context.offeringId != null
      ? offerings.find((o) => o.id === context.offeringId)
      : offerings[0]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-text-muted">
              {course.code}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-text">{course.name}</h2>
          </div>
          <span className="shrink-0 rounded-full bg-bbu-blue/10 px-3 py-1 text-sm font-medium text-bbu-blue">
            {course.credits} cr
          </span>
        </div>

        <p className="text-text-muted">
          {course.description || 'No description available.'}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {course.department && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Building2 className="h-4 w-4 text-bbu-blue" />
              <span>{course.department.name}</span>
            </div>
          )}

          {course.program && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <BookOpen className="h-4 w-4 text-bbu-blue" />
              <span>{course.program.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Award className="h-4 w-4 text-bbu-blue" />
            <span>{course.credits} credits</span>
          </div>
        </div>
      </div>

      {primaryOffering && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-text">Your Section</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {primaryOffering.semester && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CalendarDays className="h-4 w-4 text-bbu-blue" />
                <span>{primaryOffering.semester.name}</span>
              </div>
            )}

            {primaryOffering.lecturer && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Users className="h-4 w-4 text-bbu-blue" />
                <span>{primaryOffering.lecturer.name}</span>
              </div>
            )}

            {primaryOffering.room && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <MapPin className="h-4 w-4 text-bbu-blue" />
                <span>Room {primaryOffering.room}</span>
              </div>
            )}

            {scheduleLabel(primaryOffering.schedule) && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Clock className="h-4 w-4 text-bbu-blue" />
                <span>{scheduleLabel(primaryOffering.schedule)}</span>
              </div>
            )}
          </div>

          {typeof primaryOffering.enrollmentCount === 'number' && primaryOffering.capacity > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-text-muted">
                <span>Enrolled</span>
                <span>
                  {primaryOffering.enrollmentCount} / {primaryOffering.capacity}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-bbu-blue"
                  style={{
                    width: `${Math.min(
                      100,
                      (primaryOffering.enrollmentCount / primaryOffering.capacity) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {offerings.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-text">All Offerings</h3>
          <div className="divide-y divide-gray-100">
            {offerings.map((offering) => (
              <div key={offering.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">
                    {offering.semester?.name || 'Unknown semester'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {offering.lecturer?.name || 'No lecturer assigned'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {scheduleLabel(offering.schedule) || 'No schedule set'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseOverviewTab
