import { BookOpen, CalendarDays, MapPin, Users, Clock, Award, Building2 } from 'lucide-react'

import type { CourseDetailSummary, CourseOfferingSummary, Schedule, ClassScheduleItem } from '@/hooks/useCourseDetail'

interface CourseOverviewTabProps {
  data: CourseDetailSummary
}

function scheduleLabel(schedule: Schedule | null | undefined): string | null {
  if (!schedule || !schedule.days?.length) return null
  return `${schedule.days.join(', ')} · ${schedule.start || '?'}–${schedule.end || '?'}`
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function groupSchedulesByDay(schedules: ClassScheduleItem[]) {
  const grouped = new Map<string, ClassScheduleItem[]>()

  DAY_ORDER.forEach((day) => grouped.set(day, []))

  schedules.forEach((schedule) => {
    const list = grouped.get(schedule.dayOfWeek)
    if (list) {
      list.push(schedule)
    }
  })

  grouped.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)))

  return DAY_ORDER.map((day) => ({ day, schedules: grouped.get(day) ?? [] }))
}

function CourseOverviewTab({ data }: CourseOverviewTabProps) {
  const { course, offerings, classSchedules, context } = data

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

      {classSchedules.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-text">Weekly Schedule</h3>
          <div className="divide-y divide-gray-100">
            {groupSchedulesByDay(classSchedules).map(({ day, schedules }) =>
              schedules.length > 0 ? (
                <div key={day} className="py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-bbu-blue" />
                    <span className="text-sm font-semibold text-text">{day}</span>
                  </div>
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-text">
                            <Clock className="h-4 w-4 text-text-muted" />
                            <span className="font-medium">
                              {schedule.startTime} – {schedule.endTime}
                            </span>
                          </div>
                          {schedule.room && (
                            <div className="flex items-center gap-1.5 text-text-muted">
                              <MapPin className="h-4 w-4" />
                              {schedule.room}
                            </div>
                          )}
                        </div>
                        <span className="rounded-full bg-bbu-blue/10 px-2 py-0.5 text-xs font-medium capitalize text-bbu-blue">
                          {schedule.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Scheduled Sessions</h3>
          <p className="mt-1 text-sm text-text-muted">
            The weekly class schedule has not been published yet.
          </p>
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
