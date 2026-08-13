import { useState } from 'react'
import { User } from './lib/mock'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminFaculties from './pages/admin/AdminFaculties'
import AdminPrograms from './pages/admin/AdminPrograms'
import AdminCourses from './pages/admin/AdminCourses'
import AdminSemesters from './pages/admin/AdminSemesters'
import AdminCourseOfferings from './pages/admin/AdminCourseOfferings'

// Professor pages
import ProfessorDashboard from './pages/professor/ProfessorDashboard'
import ProfessorGrades from './pages/professor/ProfessorGrades'
import ProfessorAttendance from './pages/professor/ProfessorAttendance'
import ProfessorAssignments from './pages/professor/ProfessorAssignments'

// Student pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentRegister from './pages/student/StudentRegister'
import StudentLessons from './pages/student/StudentLessons'
import StudentTranscript from './pages/student/StudentTranscript'

// Shared pages
import AnnouncementsPage from './pages/shared/AnnouncementsPage'
import MessagesPage from './pages/shared/MessagesPage'

const defaultPage: Record<string, string> = {
  admin: 'admin-dashboard',
  professor: 'prof-dashboard',
  student: 'student-dashboard',
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleLogin = (u: User) => {
    setUser(u)
    setCurrentPage(defaultPage[u.role])
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('dashboard')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    // Admin
    if (currentPage === 'admin-dashboard') return <AdminDashboard />
    if (currentPage === 'admin-users') return <AdminUsers />
    if (currentPage === 'admin-faculties') return <AdminFaculties />
    if (currentPage === 'admin-programs') return <AdminPrograms />
    if (currentPage === 'admin-courses') return <AdminCourses />
    if (currentPage === 'admin-semesters') return <AdminSemesters />
    if (currentPage === 'admin-offerings') return <AdminCourseOfferings />
    // Professor
    if (currentPage === 'prof-dashboard') return <ProfessorDashboard user={user} />
    if (currentPage === 'prof-courses') return <ProfessorDashboard user={user} />
    if (currentPage === 'prof-grades') return <ProfessorGrades user={user} />
    if (currentPage === 'prof-attendance') return <ProfessorAttendance user={user} />
    if (currentPage === 'prof-assignments') return <ProfessorAssignments user={user} />
    if (currentPage === 'prof-messages') return <MessagesPage user={user} />
    if (currentPage === 'prof-announcements') return <AnnouncementsPage user={user} />
    // Student
    if (currentPage === 'student-dashboard') return <StudentDashboard user={user} />
    if (currentPage === 'student-register') return <StudentRegister user={user} />
    if (currentPage === 'student-lessons') return <StudentLessons user={user} />
    if (currentPage === 'student-transcript') return <StudentTranscript user={user} />
    if (currentPage === 'student-messages') return <MessagesPage user={user} />
    if (currentPage === 'student-announcements') return <AnnouncementsPage user={user} />
    if (currentPage === 'student-attendance') return <StudentTranscript user={user} />
    if (currentPage === 'student-assignments') return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        Assignment submission view — coming soon in v1.
      </div>
    )
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        Page not found.
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar user={user} currentPage={currentPage} />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
