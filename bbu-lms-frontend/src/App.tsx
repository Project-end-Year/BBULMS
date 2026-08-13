import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { EchoProvider } from '@/contexts/EchoContext'
import { RequireAuth, RequireRole } from '@/components/auth/RequireRole'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/shared/CoursesPage'
import CourseDetailPage from '@/pages/shared/CourseDetailPage'
import ChatPage from '@/pages/shared/ChatPage'
import CalendarPage from '@/pages/shared/CalendarPage'
import AnnouncementsPage from '@/pages/shared/AnnouncementsPage'
import StudentAnalyticsPage from '@/pages/student/StudentAnalyticsPage'
import ProfilePage from '@/pages/shared/ProfilePage'
import AdminPage from '@/pages/admin/AdminPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminCoursesPage from '@/pages/admin/AdminCoursesPage'
import AdminDepartmentsPage from '@/pages/admin/AdminDepartmentsPage'
import AdminProgramsPage from '@/pages/admin/AdminProgramsPage'
import AdminSemestersPage from '@/pages/admin/AdminSemestersPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EchoProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/analytics" element={<StudentAnalyticsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route element={<RequireRole role="admin" />}>
                  <Route path="/admin" element={<AdminPage />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="courses" element={<AdminCoursesPage />} />
                    <Route path="departments" element={<AdminDepartmentsPage />} />
                    <Route path="programs" element={<AdminProgramsPage />} />
                    <Route path="semesters" element={<AdminSemestersPage />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<div className="flex min-h-screen items-center justify-center text-text-muted">404 Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </EchoProvider>
    </AuthProvider>
    <Toaster position="top-right" richColors />
  </QueryClientProvider>
  )
}

export default App
