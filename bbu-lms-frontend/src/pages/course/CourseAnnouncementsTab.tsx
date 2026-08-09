import { useState } from 'react'
import { toast } from 'sonner'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Pin,
  Calendar,
  MegaphoneOff,
} from 'lucide-react'

import { type CourseDetailSummary } from '@/hooks/useCourseDetail'
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useToggleAnnouncement,
  type Announcement,
  type AnnouncementFormData,
} from '@/hooks/useAnnouncements'

interface CourseAnnouncementsTabProps {
  data: CourseDetailSummary
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AnnouncementModal({
  isOpen,
  onClose,
  courseId,
  announcement,
}: {
  isOpen: boolean
  onClose: () => void
  courseId: string
  announcement?: Announcement
}) {
  const isEditing = Boolean(announcement)
  const [title, setTitle] = useState(announcement?.title ?? '')
  const [content, setContent] = useState(announcement?.content ?? '')
  const [isPinned, setIsPinned] = useState(announcement?.isPinned ?? false)
  const [isPublished, setIsPublished] = useState(announcement?.isPublished ?? true)

  const create = useCreateAnnouncement(courseId)
  const update = useUpdateAnnouncement(courseId, announcement?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData: AnnouncementFormData = {
      title,
      content,
      isPinned,
      isPublished,
    }

    try {
      if (isEditing && announcement) {
        await update.mutateAsync(formData)
        toast.success('Announcement updated.')
      } else {
        await create.mutateAsync(formData)
        toast.success('Announcement posted.')
      }
      onClose()
      setTitle('')
      setContent('')
      setIsPinned(false)
      setIsPublished(true)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save announcement.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Announcement' : 'New Announcement'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="e.g. Midterm Exam Schedule"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Write the announcement here..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
              />
              Pin to top
            </label>

            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
              />
              Published
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title || !content}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AnnouncementCard({
  announcement,
  isManager,
  onEdit,
  onToggle,
}: {
  announcement: Announcement
  isManager: boolean
  onEdit: (a: Announcement) => void
  onToggle: (a: Announcement) => void
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        announcement.isPinned ? 'border-bbu-blue/30 bg-bbu-blue/[0.03]' : 'border-gray-200'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              announcement.isPinned ? 'bg-bbu-blue text-white' : 'bg-bbu-blue/10 text-bbu-blue'
            }`}
          >
            {announcement.isPinned ? <Pin className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-text">{announcement.title}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              {announcement.postedBy && <span>By {announcement.postedBy.name}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(announcement.publishedAt || announcement.createdAt)}
              </span>
              {!announcement.isPublished && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Draft</span>
              )}
            </div>
          </div>
        </div>

        {isManager && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(announcement)}
              className="rounded p-1.5 text-text-muted hover:bg-gray-100"
              aria-label="Edit announcement"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggle(announcement)}
              className="rounded p-1.5 text-red-600 hover:bg-red-50"
              aria-label={announcement.isActive ? 'Deactivate announcement' : 'Activate announcement'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
        {announcement.content}
      </div>
    </div>
  )
}

function CourseAnnouncementsTab({ data }: CourseAnnouncementsTabProps) {
  const { course, context } = data

  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const { data: announcementsData, isLoading } = useAnnouncements(String(course.id))
  const toggle = useToggleAnnouncement(String(course.id))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined)

  const announcements = announcementsData?.announcements ?? []

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingAnnouncement(undefined)
    setIsModalOpen(true)
  }

  const handleToggle = async (announcement: Announcement) => {
    if (
      !window.confirm(
        `${announcement.isActive ? 'Deactivate' : 'Activate'} "${announcement.title}"?`
      )
    )
      return

    try {
      await toggle.mutateAsync(announcement.id)
      toast.success(`Announcement ${announcement.isActive ? 'deactivated' : 'activated'}.`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update announcement.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-bbu-blue" />
          <h2 className="text-lg font-semibold text-text">Announcements</h2>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isManager={isManager}
              onEdit={handleEdit}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <MegaphoneOff className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Announcements Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {isManager
              ? 'Post updates, reminders, and important news for this course.'
              : 'Check back later for announcements from your lecturer.'}
          </p>
        </div>
      )}

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={String(course.id)}
        announcement={editingAnnouncement}
      />
    </div>
  )
}

export default CourseAnnouncementsTab
