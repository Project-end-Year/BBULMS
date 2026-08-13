import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  ClipboardList,
  HelpCircle,
  Users,
  TrendingUp,
  Megaphone,
  MessageSquare,
  UserPlus,
} from 'lucide-react'

import { useCourseDetail, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import CourseOverviewTab from '@/pages/course/CourseOverviewTab'
import CourseMaterialsTab from '@/pages/course/CourseMaterialsTab'
import CourseAssignmentsTab from '@/pages/course/CourseAssignmentsTab'
import CourseQuizzesTab from '@/pages/course/CourseQuizzesTab'
import CourseAttendanceTab from '@/pages/course/CourseAttendanceTab'
import CourseGradesTab from '@/pages/course/CourseGradesTab'
import CourseAnnouncementsTab from '@/pages/course/CourseAnnouncementsTab'
import CourseDiscussionTab from '@/pages/course/CourseDiscussionTab'
import CourseEnrollmentTab from '@/pages/course/CourseEnrollmentTab'

interface TabItem {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ data: CourseDetailSummary }>
}

const tabs: TabItem[] = [
  { key: 'overview', label: 'Overview', icon: BookOpen, component: CourseOverviewTab },
  { key: 'enrollment', label: 'Enrollment', icon: UserPlus, component: CourseEnrollmentTab },
  { key: 'materials', label: 'Materials', icon: FileText, component: CourseMaterialsTab },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList, component: CourseAssignmentsTab },
  { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, component: CourseQuizzesTab },
  { key: 'attendance', label: 'Attendance', icon: Users, component: CourseAttendanceTab },
  { key: 'grades', label: 'Grades', icon: TrendingUp, component: CourseGradesTab },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, component: CourseAnnouncementsTab },
  { key: 'discussion', label: 'Discussion', icon: MessageSquare, component: CourseDiscussionTab },
]

function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useCourseDetail(id)
  const [activeTab, setActiveTab] = useState('overview')

  const ActiveComponent = tabs.find((t) => t.key === activeTab)?.component

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-bbu-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-text">
            {error.message === 'You do not have access to this course.'
              ? 'Access Denied'
              : 'Unable to Load Course'}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {error.message === 'You do not have access to this course.'
              ? 'You are not enrolled in or teaching this course.'
              : error.message || 'Something went wrong. Please try again.'}
          </p>
          <Link
            to="/courses"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-text-muted">
              {data.course.code}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-text sm:text-3xl">
              {data.course.name}
            </h1>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Course tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.key === activeTab

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-bbu-blue text-bbu-blue'
                        : 'border-transparent text-text-muted hover:border-gray-300 hover:text-text'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="min-h-[30vh]">
            {ActiveComponent && <ActiveComponent data={data} />}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CourseDetailPage
