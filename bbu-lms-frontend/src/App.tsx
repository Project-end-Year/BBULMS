import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { RequireAuth, RequireRole } from '@/components/auth/RequireRole'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/CoursesPage'
import CourseDetailPage from '@/pages/CourseDetailPage'
import ChatPage from '@/pages/ChatPage'
import CalendarPage from '@/pages/CalendarPage'
import AnnouncementsPage from '@/pages/AnnouncementsPage'
import ProfilePage from '@/pages/ProfilePage'
import AdminPage from '@/pages/AdminPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminDepartmentsPage from '@/pages/admin/AdminDepartmentsPage'
import AdminProgramsPage from '@/pages/admin/AdminProgramsPage'
import AdminSemestersPage from '@/pages/admin/AdminSemestersPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                <Route path="/profile" element={<ProfilePage />} />

                <Route element={<RequireRole role="admin" />}>
                  <Route path="/admin" element={<AdminPage />}>
                    <Route index element={<Navigate to="/admin/users" replace />} />
                    <Route path="users" element={<AdminUsersPage />} />
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
      </AuthProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
