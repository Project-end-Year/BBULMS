import { BookOpenCheck, FileText, Video } from 'lucide-react'
import { User, lessons, courseOfferings, courses, semesters, enrollments } from '../../lib/mock'

interface Props { user: User }

export default function StudentLessons({ user }: Props) {
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myEnrollments = enrollments.filter((e) => e.studentId === user.id && e.status === 'active')
  const myOfferingIds = myEnrollments.map((e) => e.courseOfferingId)
  const myOfferings = courseOfferings.filter((o) => myOfferingIds.includes(o.id) && o.semesterId === currentSem.id)
  const myLessons = lessons.filter((l) => myOfferingIds.includes(l.courseOfferingId)).sort((a, b) => b.publishDate.localeCompare(a.publishDate))

  const grouped = myOfferings.map((offering) => ({
    offering,
    course: courses.find((c) => c.id === offering.courseId)!,
    lessons: myLessons.filter((l) => l.courseOfferingId === offering.id),
  })).filter((g) => g.lessons.length > 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">My Lessons</h2>
        <p className="text-sm text-slate-500">{myLessons.length} lessons across {grouped.length} courses</p>
      </div>

      {grouped.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No lessons available yet. Check back after your professor publishes content.
        </div>
      )}

      {grouped.map(({ offering, course, lessons: courseLessons }) => (
        <div key={offering.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {course.code.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{course.title}</h3>
              <p className="text-xs text-slate-400">{course.code} · §{offering.section} · {courseLessons.length} lessons</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {courseLessons.map((lesson) => (
              <div key={lesson.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <BookOpenCheck size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">{lesson.title}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{lesson.description}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{lesson.publishDate}</span>
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                      <FileText size={12} /> View Materials
                    </button>
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                      <Video size={12} /> Watch Video
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
