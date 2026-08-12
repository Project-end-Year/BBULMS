import { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Loader2,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  MessageSquare,
  EyeOff,
} from 'lucide-react'

import { type CourseOfferingSummary, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useSubmissions,
  useMySubmission,
  useSubmitAssignment,
  useGradeSubmission,
  formatDueDate,
  formatFileSize,
  type Assignment,
  type AssignmentFormData,
  type SubmissionFormData,
  type GradeFormData,
  type AssignmentSubmission,
} from '@/hooks/useAssignments'

interface CourseAssignmentsTabProps {
  data: CourseDetailSummary
}

const DEFAULT_ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png'

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  // datetime-local expects YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function StatusBadge({ status }: { status: string }) {
  const isGraded = status === 'graded'
  const isLate = status === 'late'
  const isSubmitted = status === 'submitted'

  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
  if (isGraded) {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        <Award className="h-3 w-3" />
        Graded
      </span>
    )
  }
  if (isLate) {
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        <AlertCircle className="h-3 w-3" />
        Late
      </span>
    )
  }
  if (isSubmitted) {
    return (
      <span className={`${base} bg-blue-100 text-blue-700`}>
        <CheckCircle className="h-3 w-3" />
        Submitted
      </span>
    )
  }
  return (
    <span className={`${base} bg-gray-100 text-text-muted`}>
      <Clock className="h-3 w-3" />
      {status}
    </span>
  )
}

function AssignmentModal({
  isOpen,
  onClose,
  offeringId,
  assignment,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  assignment?: Assignment
}) {
  const isEditing = Boolean(assignment)
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [description, setDescription] = useState(assignment?.description ?? '')
  const [instructions, setInstructions] = useState(assignment?.instructions ?? '')
  const [dueAt, setDueAt] = useState(toDatetimeLocalValue(assignment?.dueAt))
  const [maxPoints, setMaxPoints] = useState<number | ''>(assignment?.maxPoints ? Number(assignment.maxPoints) : 100)
  const [allowedAttempts, setAllowedAttempts] = useState<number | ''>(assignment?.allowedAttempts ?? 1)
  const [allowedFileTypes, setAllowedFileTypes] = useState(assignment?.allowedFileTypes?.join(', ') ?? '')
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number | ''>(assignment?.maxFileSizeMb ?? 10)
  const [isPublished, setIsPublished] = useState(assignment?.isPublished ?? true)

  const create = useCreateAssignment(offeringId)
  const update = useUpdateAssignment(offeringId, assignment?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData: AssignmentFormData = {
      title,
      description: description || undefined,
      instructions: instructions || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : new Date().toISOString(),
      maxPoints: maxPoints === '' ? undefined : Number(maxPoints),
      allowedAttempts: allowedAttempts === '' ? undefined : Number(allowedAttempts),
      allowedFileTypes: allowedFileTypes
        ? allowedFileTypes.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      maxFileSizeMb: maxFileSizeMb === '' ? undefined : Number(maxFileSizeMb),
      isPublished,
    }

    try {
      if (isEditing && assignment) {
        await update.mutateAsync(formData)
      } else {
        await create.mutateAsync(formData)
      }
      onClose()
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Assignment' : 'New Assignment'}
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
              placeholder="e.g. Homework 1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Due Date</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Max Points</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Allowed Attempts</label>
              <input
                type="number"
                min={1}
                value={allowedAttempts}
                onChange={(e) => setAllowedAttempts(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Max File Size (MB)</label>
              <input
                type="number"
                min={1}
                value={maxFileSizeMb}
                onChange={(e) => setMaxFileSizeMb(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Allowed File Types</label>
            <input
              type="text"
              value={allowedFileTypes}
              onChange={(e) => setAllowedFileTypes(e.target.value)}
              placeholder="pdf, docx, txt"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
            <p className="mt-1 text-xs text-text-muted">Comma-separated extensions. Leave blank for no restriction.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Short description visible in the list"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Detailed instructions for students"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
            />
            Published
          </label>

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
              disabled={isPending || !title || !dueAt}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GradeModal({
  isOpen,
  onClose,
  offeringId,
  assignment,
  submission,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  assignment: Assignment
  submission: AssignmentSubmission
}) {
  const [grade, setGrade] = useState<number | ''>(submission.grade ? Number(submission.grade) : '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')

  const gradeMutation = useGradeSubmission(offeringId, assignment.id, submission.id)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData: GradeFormData = {
      grade: grade === '' ? 0 : Number(grade),
      feedback: feedback || undefined,
    }
    try {
      await gradeMutation.mutateAsync(formData)
      onClose()
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Grade Submission</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 text-sm text-text-muted">
          <p>
            <span className="font-medium text-text">Student:</span> {submission.student?.name ?? 'Unknown'}
          </p>
          <p>
            <span className="font-medium text-text">Attempt:</span> {submission.attemptNumber}
          </p>
          <p>
            <span className="font-medium text-text">Max Points:</span> {assignment.maxPoints}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Grade</label>
            <input
              type="number"
              min={0}
              step={0.01}
              max={Number(assignment.maxPoints)}
              value={grade}
              onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Optional feedback"
            />
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
              disabled={gradeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {gradeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Grade
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FileList({ files, compact = false }: { files: { originalName: string; size: number; mimeType: string }[] | null | undefined; compact?: boolean }) {
  if (!files || files.length === 0) return null

  return (
    <ul className={`space-y-1 ${compact ? '' : 'rounded-lg border border-gray-200 bg-gray-50 p-3'}`}>
      {files.map((file, idx) => (
        <li key={idx} className="flex items-center gap-2 text-sm text-text">
          <FileText className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="truncate">{file.originalName}</span>
          <span className="ml-auto shrink-0 text-xs text-text-muted">{formatFileSize(file.size)}</span>
        </li>
      ))}
    </ul>
  )
}

function SubmissionPanel({
  offeringId,
  assignment,
}: {
  offeringId: number
  assignment: Assignment
}) {
  const { data: mySubmissionData } = useMySubmission(offeringId, assignment.id)
  const submit = useSubmitAssignment(offeringId, assignment.id)

  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const submission = mySubmissionData?.submission
  const attemptsUsed = submission?.attemptNumber ?? 0
  const attemptsLeft = Math.max(0, assignment.allowedAttempts - attemptsUsed)
  const canSubmit = attemptsLeft > 0 && assignment.isPublished

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData: SubmissionFormData = {
      submissionText: text || undefined,
      files: files.length > 0 ? files : undefined,
    }
    try {
      await submit.mutateAsync(formData)
      setText('')
      setFiles([])
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h4 className="text-sm font-semibold text-text">Your Submission</h4>

      {submission ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={submission.status} />
            {submission.grade !== null && (
              <span className="text-sm text-text">
                <span className="font-semibold text-bbu-blue">{submission.grade}</span> / {assignment.maxPoints}
              </span>
            )}
          </div>

          {submission.submissionText && (
            <div className="text-sm text-text">
              <p className="whitespace-pre-wrap">{submission.submissionText}</p>
            </div>
          )}

          <FileList files={submission.files} />

          {submission.feedback && (
            <div className="rounded-lg border border-gray-200 bg-amber-50 p-3 text-sm text-text">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-amber-700">
                <MessageSquare className="h-4 w-4" />
                Lecturer Feedback
              </p>
              <p className="whitespace-pre-wrap text-text-muted">{submission.feedback}</p>
            </div>
          )}

          <p className="text-xs text-text-muted">
            Attempt {submission.attemptNumber} of {assignment.allowedAttempts} · Submitted{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">You have not submitted anything yet.</p>
      )}

      {canSubmit ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Submission Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Enter your answer or notes"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Attach Files</label>
            <input
              type="file"
              multiple
              accept={assignment.allowedFileTypes?.map((t) => `.${t}`).join(',') ?? DEFAULT_ACCEPTED_TYPES}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-bbu-blue file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-bbu-blue/90"
            />
            <p className="mt-1 text-xs text-text-muted">
              Max {assignment.maxFileSizeMb} MB per file. Up to {assignment.allowedAttempts - attemptsUsed} more attempt
              {assignment.allowedAttempts - attemptsUsed === 1 ? '' : 's'}.
            </p>
          </div>

          {files.length > 0 && (
            <div className="text-sm text-text">
              <p className="mb-1 font-medium">Selected files</p>
              <FileList files={files.map((f) => ({ originalName: f.name, size: f.size, mimeType: f.type }))} compact />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-text-muted">
              {attemptsUsed > 0 ? `Attempt ${attemptsUsed} of ${assignment.allowedAttempts} used.` : `Allowed attempts: ${assignment.allowedAttempts}`}
            </span>
            <button
              type="submit"
              disabled={submit.isPending || (!text && files.length === 0)}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" />
              Submit
            </button>
          </div>
        </form>
      ) : (
        submission && (
          <p className="text-sm text-amber-600">
            You have used all {assignment.allowedAttempts} allowed attempt{assignment.allowedAttempts === 1 ? '' : 's'}.
          </p>
        )
      )}
    </div>
  )
}

function SubmissionsPanel({
  offeringId,
  assignment,
}: {
  offeringId: number
  assignment: Assignment
}) {
  const { data, isLoading } = useSubmissions(offeringId, assignment.id)
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null)

  const submissions = data?.submissions ?? []

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h4 className="text-sm font-semibold text-text">
        Submissions ({assignment.submissionsCount ?? submissions.length})
      </h4>

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-text-muted">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-text">
                  <Users className="h-4 w-4 text-text-muted" />
                  <span className="font-medium">{submission.student?.name ?? 'Unknown'}</span>
                  <StatusBadge status={submission.status} />
                </div>
                <div className="flex items-center gap-2">
                  {submission.grade !== null ? (
                    <span className="text-sm font-semibold text-bbu-blue">
                      {submission.grade} / {assignment.maxPoints}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Ungraded</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(submission)}
                    className="inline-flex items-center gap-1 rounded-lg bg-bbu-blue px-2.5 py-1.5 text-xs font-medium text-white hover:bg-bbu-blue/90"
                  >
                    <Award className="h-3.5 w-3.5" />
                    {submission.grade !== null ? 'Update Grade' : 'Grade'}
                  </button>
                </div>
              </div>

              {submission.submissionText && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">
                  {submission.submissionText}
                </p>
              )}

              <FileList files={submission.files} />

              {submission.feedback && (
                <p className="mt-2 text-sm text-text-muted">
                  <span className="font-medium text-text">Feedback:</span> {submission.feedback}
                </p>
              )}

              <p className="mt-2 text-xs text-text-muted">
                Attempt {submission.attemptNumber} · Submitted{' '}
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
              </p>
            </div>
          ))}
        </div>
      )}

      {gradingSubmission && (
        <GradeModal
          isOpen
          onClose={() => setGradingSubmission(null)}
          offeringId={offeringId}
          assignment={assignment}
          submission={gradingSubmission}
        />
      )}
    </div>
  )
}

function AssignmentCard({
  assignment,
  isManager,
  offeringId,
  onEdit,
  onDelete,
}: {
  assignment: Assignment
  isManager: boolean
  offeringId: number
  onEdit: (a: Assignment) => void
  onDelete: (a: Assignment) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isPastDue = new Date(assignment.dueAt) < new Date()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-text">{assignment.title}</h4>
            {!assignment.isPublished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <EyeOff className="h-3 w-3" />
                Draft
              </span>
            )}
          </div>

          {assignment.description && (
            <p className="mt-1 line-clamp-2 text-sm text-text-muted">{assignment.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className={`inline-flex items-center gap-1 ${isPastDue ? 'text-amber-600' : ''}`}>
              <Calendar className="h-3.5 w-3.5" />
              {formatDueDate(assignment.dueAt)}
            </span>
            <span>Max {assignment.maxPoints} pts</span>
            <span>{assignment.allowedAttempts} attempt{assignment.allowedAttempts === 1 ? '' : 's'}</span>
            {isManager && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {assignment.submissionsCount ?? 0} submission{assignment.submissionsCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? 'Hide Details' : 'Details'}
          </button>

          {isManager && (
            <>
              <button
                type="button"
                onClick={() => onEdit(assignment)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(assignment)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {assignment.instructions ? (
            <div className="mb-4">
              <h5 className="mb-1 text-sm font-semibold text-text">Instructions</h5>
              <p className="whitespace-pre-wrap text-sm text-text-muted">{assignment.instructions}</p>
            </div>
          ) : (
            <p className="mb-4 text-sm text-text-muted">No detailed instructions provided.</p>
          )}

          {isManager ? (
            <SubmissionsPanel offeringId={offeringId} assignment={assignment} />
          ) : (
            <SubmissionPanel offeringId={offeringId} assignment={assignment} />
          )}
        </div>
      )}
    </div>
  )
}

function CourseAssignmentsTab({ data }: CourseAssignmentsTabProps) {
  const { offerings, context } = data
  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>()

  const offeringId = selectedOffering?.id

  const { data: assignmentsData, isLoading } = useAssignments(offeringId)
  const deleteAssignment = useDeleteAssignment(offeringId)

  const assignments = assignmentsData?.assignments ?? []

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAssignment(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (assignment: Assignment) => {
    if (!confirm(`Delete "${assignment.title}"?`)) return
    try {
      await deleteAssignment.mutateAsync(assignment.id)
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {offerings.length > 1 && (
            <select
              value={offeringId ?? ''}
              onChange={(e) => setSelectedOffering(offerings.find((o) => String(o.id) === e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            >
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.semester?.name ?? 'Offering'} {o.section ? `· ${o.section}` : ''}
                </option>
              ))}
            </select>
          )}
          <h2 className="text-lg font-semibold text-text">Assignments</h2>
        </div>

        {isManager && offeringId && (
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
        )}
      </div>

      {!offeringId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Offering Selected</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            There are no course offerings available to manage assignments for.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Assignments Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {isManager
              ? 'Create homework, projects, and exercises for this offering.'
              : 'Assignments for this course will appear here once published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isManager={isManager}
              offeringId={offeringId ?? 0}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offeringId={offeringId ?? 0}
        assignment={editingAssignment}
      />
    </div>
  )
}

export default CourseAssignmentsTab
