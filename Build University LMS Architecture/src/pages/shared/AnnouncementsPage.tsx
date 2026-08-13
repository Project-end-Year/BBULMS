import { Bell, Building2, BookOpen } from 'lucide-react'
import { User, announcements, users, faculties, courseOfferings, courses, semesters, enrollments } from '../../lib/mock'

interface Props { user: User }

export default function AnnouncementsPage({ user }: Props) {
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myOfferingIds = user.role === 'student'
    ? enrollments.filter((e) => e.studentId === user.id && e.status === 'active').map((e) => e.courseOfferingId)
    : user.role === 'professor'
    ? courseOfferings.filter((o) => o.professorId === user.id && o.semesterId === currentSem.id).map((o) => o.id)
    : courseOfferings.filter((o) => o.semesterId === currentSem.id).map((o) => o.id)

  const relevantAnnouncements = announcements.filter((a) => {
    if (user.role === 'admin') return true
    if (a.courseOfferingId) return myOfferingIds.includes(a.courseOfferingId)
    if (a.facultyId) return true
    return true
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Announcements</h2>
        <p className="text-sm text-slate-500">{relevantAnnouncements.length} announcements</p>
      </div>

      <div className="space-y-3">
        {relevantAnnouncements.map((ann) => {
          const author = users.find((u) => u.id === ann.authorId)
          const faculty = ann.facultyId ? faculties.find((f) => f.id === ann.facultyId) : null
          const offering = ann.courseOfferingId ? courseOfferings.find((o) => o.id === ann.courseOfferingId) : null
          const course = offering ? courses.find((c) => c.id === offering.courseId) : null
          const scope = faculty ? { label: faculty.name, type: 'faculty' } : course ? { label: `${course.code} §${offering?.section}`, type: 'course' } : { label: 'University-wide', type: 'university' }
          const scopeColor = scope.type === 'faculty' ? 'bg-amber-50 text-amber-700' : scope.type === 'course' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
          const scopeIcon = scope.type === 'faculty' ? <Building2 size={12} /> : scope.type === 'course' ? <BookOpen size={12} /> : <Bell size={12} />

          return (
            <div key={ann.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 leading-snug">{ann.title}</h3>
                <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${scopeColor}`}>
                  {scopeIcon} {scope.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                    {author ? author.firstName[0] + author.lastName[0] : '?'}
                  </div>
                  {author ? `${author.firstName} ${author.lastName}` : 'Unknown'}
                </div>
                <span>·</span>
                <span>{ann.createdAt}</span>
              </div>
            </div>
          )
        })}
        {relevantAnnouncements.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No announcements.</div>
        )}
      </div>
    </div>
  )
}
