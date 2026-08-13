import { Bell, Search } from 'lucide-react'
import { User, semesters } from '../lib/mock'

const pageLabels: Record<string, string> = {
  'admin-dashboard': 'Dashboard',
  'admin-users': 'User Management',
  'admin-faculties': 'Faculties',
  'admin-programs': 'Programs',
  'admin-courses': 'Courses',
  'admin-semesters': 'Semesters',
  'admin-offerings': 'Course Offerings',
  'prof-dashboard': 'Dashboard',
  'prof-courses': 'My Course Offerings',
  'prof-grades': 'Grade Entry',
  'prof-attendance': 'Attendance',
  'prof-assignments': 'Assignments',
  'prof-messages': 'Messages',
  'prof-announcements': 'Announcements',
  'student-dashboard': 'Dashboard',
  'student-register': 'Course Registration',
  'student-lessons': 'My Lessons',
  'student-assignments': 'My Assignments',
  'student-transcript': 'Academic Transcript',
  'student-attendance': 'My Attendance',
  'student-messages': 'Messages',
  'student-announcements': 'Announcements',
}

const roleBadge: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-800',
  professor: 'bg-emerald-100 text-emerald-800',
  student: 'bg-violet-100 text-violet-800',
}

interface TopbarProps {
  user: User
  currentPage: string
}

export default function Topbar({ user, currentPage }: TopbarProps) {
  const currentSemester = semesters.find((s) => s.isCurrent)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h1 className="text-slate-900 font-semibold text-base">{pageLabels[currentPage] ?? 'BBU LMS'}</h1>
        {currentSemester && (
          <p className="text-slate-400 text-[11px] leading-none mt-0.5">{currentSemester.name}</p>
        )}
      </div>

      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-52 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-slate-800">{user.firstName} {user.lastName}</div>
          <div className="text-[11px] text-slate-400">{user.email}</div>
        </div>
      </div>
    </header>
  )
}
