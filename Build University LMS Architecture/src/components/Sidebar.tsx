import {
  LayoutDashboard, Users, Building2, GraduationCap, BookOpen,
  Calendar, CalendarRange, ClipboardCheck, ClipboardList, FileText,
  ScrollText, PlusCircle, MessageSquare, Bell, LogOut, BookOpenCheck,
  ChevronRight,
} from 'lucide-react'
import { User } from '../lib/mock'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'admin-users', label: 'Users', icon: <Users size={18} /> },
  { id: 'admin-faculties', label: 'Faculties', icon: <Building2 size={18} /> },
  { id: 'admin-programs', label: 'Programs', icon: <GraduationCap size={18} /> },
  { id: 'admin-courses', label: 'Courses', icon: <BookOpen size={18} /> },
  { id: 'admin-semesters', label: 'Semesters', icon: <Calendar size={18} /> },
  { id: 'admin-offerings', label: 'Course Offerings', icon: <CalendarRange size={18} /> },
]

const professorNav: NavItem[] = [
  { id: 'prof-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'prof-courses', label: 'My Courses', icon: <BookOpen size={18} /> },
  { id: 'prof-grades', label: 'Grades', icon: <FileText size={18} /> },
  { id: 'prof-attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { id: 'prof-assignments', label: 'Assignments', icon: <ClipboardList size={18} /> },
  { id: 'prof-messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { id: 'prof-announcements', label: 'Announcements', icon: <Bell size={18} /> },
]

const studentNav: NavItem[] = [
  { id: 'student-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'student-register', label: 'Registration', icon: <PlusCircle size={18} /> },
  { id: 'student-lessons', label: 'My Lessons', icon: <BookOpenCheck size={18} /> },
  { id: 'student-assignments', label: 'Assignments', icon: <ClipboardList size={18} /> },
  { id: 'student-transcript', label: 'Transcript', icon: <ScrollText size={18} /> },
  { id: 'student-attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { id: 'student-messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { id: 'student-announcements', label: 'Announcements', icon: <Bell size={18} /> },
]

const roleColors: Record<string, string> = {
  admin: 'bg-amber-500',
  professor: 'bg-emerald-500',
  student: 'bg-violet-500',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  professor: 'Professor',
  student: 'Student',
}

interface SidebarProps {
  user: User
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout }: SidebarProps) {
  const navItems = user.role === 'admin' ? adminNav : user.role === 'professor' ? professorNav : studentNav

  return (
    <aside className="w-60 shrink-0 bg-blue-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-blue-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <span className="text-blue-900 font-black text-sm leading-none">BB</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Build Bright</div>
            <div className="text-blue-300 text-[11px] leading-tight">University · Siem Reap</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                active
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className={active ? 'text-blue-700' : 'text-blue-400'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="text-blue-400" />}
            </button>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full ${roleColors[user.role]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
            <div className="text-blue-400 text-[11px]">{roleLabels[user.role]}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300 hover:bg-blue-800 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
