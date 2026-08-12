import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CalendarDays,
  Shield,
  Megaphone,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  notificationTypeLabel,
} from '@/hooks/useNotifications'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/admin', label: 'Admin', icon: Shield },
]

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData, isLoading: notificationsLoading } =
    useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  const unreadCount = notificationsData?.unreadCount ?? 0
  const notifications = notificationsData?.notifications ?? []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  const activeLabel = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'BBU LMS'

  const sidebarClasses = sidebarOpen ? 'w-64' : 'w-18'

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded p-2 text-text-muted hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden rounded p-2 text-text-muted hover:bg-gray-100 lg:block"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-bbu-blue" />
            <span className="hidden text-lg font-semibold text-text sm:block">BBU LMS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-2 text-text-muted hover:bg-gray-100"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded p-2 text-text-muted hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <span className="font-semibold text-text">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      className="flex items-center gap-1 text-xs font-medium text-bbu-blue hover:text-bbu-blue/80"
                    >
                      <Check className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-bbu-blue border-t-transparent" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-text-muted">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          markRead({ id: notification.id })
                          setNotifOpen(false)
                          if (notification.actionUrl) {
                            navigate(notification.actionUrl)
                          }
                        }}
                        className={`flex w-full flex-col gap-0.5 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          notification.readAt ? 'opacity-70' : 'bg-bbu-blue/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-bbu-blue">
                            {notificationTypeLabel(notification.type)}
                          </span>
                          {!notification.readAt && (
                            <span className="h-2 w-2 rounded-full bg-bbu-blue" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-text">
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="line-clamp-2 text-xs text-text-muted">
                            {notification.body}
                          </p>
                        )}
                        <span className="text-[10px] text-text-muted">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ml-2 hidden h-8 w-8 items-center justify-center rounded-full bg-bbu-blue text-xs font-medium text-white sm:flex">
            U
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className={`hidden flex-col border-r border-gray-200 bg-white transition-all duration-200 lg:flex ${sidebarClasses}`}
        >
          <div className="flex flex-1 flex-col overflow-y-auto py-3">
            <nav className="flex-1 px-3">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-bbu-blue/10 text-bbu-blue'
                            : 'text-text-muted hover:bg-gray-100 hover:text-text'
                        }`
                      }
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="border-t border-gray-200 p-3">
            <button
              type="button"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-text ${
                !sidebarOpen && 'justify-center'
              }`}
              title={!sidebarOpen ? 'Sign out' : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Sign out</span>}
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-bbu-blue" />
              <span className="text-lg font-semibold text-text">BBU LMS</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded p-2 text-text-muted hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-bbu-blue/10 text-bbu-blue'
                          : 'text-text-muted hover:bg-gray-100 hover:text-text'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-100 hover:text-text"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-text sm:text-2xl">{activeLabel}</h1>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
