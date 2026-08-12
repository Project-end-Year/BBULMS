import { useState } from 'react'
import {
  Users,
  Plus,
  Loader2,
  Calendar,
  Clock,
  QrCode,
  CheckCircle,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  ArrowRightLeft,
} from 'lucide-react'

import { type CourseOfferingSummary, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import {
  useAttendanceSessions,
  useAttendanceRecords,
  useAttendanceHistory,
  useCreateAttendanceSession,
  useUpdateAttendanceSession,
  useDeleteAttendanceSession,
  useUpdateAttendanceRecord,
  useQrSvgUrl,
  formatSessionTime,
  getStatusColor,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/hooks/useAttendance'

interface CourseAttendanceTabProps {
  data: CourseDetailSummary
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excused' },
]

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function SessionModal({
  isOpen,
  onClose,
  offeringId,
  session,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  session?: AttendanceSession
}) {
  const isEditing = Boolean(session)
  const [title, setTitle] = useState(session?.title ?? '')
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(session?.startsAt))
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(session?.endsAt))
  const [lateThreshold, setLateThreshold] = useState<number>(session?.lateThresholdMinutes ?? 15)

  const create = useCreateAttendanceSession(offeringId)
  const update = useUpdateAttendanceSession(offeringId, session?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      title: title || undefined,
      startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      lateThresholdMinutes: lateThreshold,
    }

    try {
      if (isEditing && session) {
        await update.mutateAsync(payload)
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Session' : 'New Attendance Session'}
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
              placeholder="e.g. Week 3 Lecture"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Starts At</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Ends At</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Late Threshold (minutes)</label>
            <input
              type="number"
              min={0}
              value={lateThreshold}
              onChange={(e) => setLateThreshold(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
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
              disabled={isPending || !startsAt}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function QrModal({
  isOpen,
  onClose,
  session,
  qrUrl,
  code,
}: {
  isOpen: boolean
  onClose: () => void
  session: AttendanceSession
  qrUrl: string | null
  code: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text">Scan to Check In</h3>
            <p className="text-sm text-text-muted">{session.title || 'Attendance session'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          {qrUrl ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <img src={qrUrl} alt="Attendance QR code" className="h-64 w-64" />
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-text-muted">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-text-muted">Or enter the check-in code</p>
            <p className="mt-1 text-3xl font-bold tracking-widest text-bbu-blue">{code}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(status)}`}>
      {status === 'present' && <CheckCircle className="mr-1 h-3 w-3" />}
      {status === 'late' && <Clock className="mr-1 h-3 w-3" />}
      {status === 'absent' && <X className="mr-1 h-3 w-3" />}
      {status === 'excused' && <AlertCircle className="mr-1 h-3 w-3" />}
      {status}
    </span>
  )
}

function SessionCard({
  session,
  isManager,
  offeringId,
  onEdit,
  onDelete,
}: {
  session: AttendanceSession
  isManager: boolean
  offeringId: number
  onEdit: (s: AttendanceSession) => void
  onDelete: (s: AttendanceSession) => void
}) {
  const [showQr, setShowQr] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const qrUrl = useQrSvgUrl(offeringId, session.id)
  const { data: recordsData, isLoading: isLoadingRecords } = useAttendanceRecords(
    isManager && expanded ? offeringId : undefined,
    isManager && expanded ? session.id : undefined
  )
  const updateSession = useUpdateAttendanceSession(offeringId, session.id)
  const updateRecord = useUpdateAttendanceRecord(offeringId, session.id, undefined)
  const records = recordsData?.records ?? []

  const presentCount = session.records?.filter((r) => r.status === 'present').length ?? 0
  const lateCount = session.records?.filter((r) => r.status === 'late').length ?? 0
  const total = session.records?.length ?? 0

  const toggleActive = async () => {
    try {
      await updateSession.mutateAsync({ isActive: !session.isActive })
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-text">{session.title || 'Untitled Session'}</h4>
            {session.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-muted">
                Closed
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatSessionTime(session.startsAt)}
            </span>
            {session.endsAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                until {formatSessionTime(session.endsAt)}
              </span>
            )}
            {isManager && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {presentCount + lateCount}/{total} checked in
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isManager && session.isActive && (
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-bbu-blue px-3 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              <QrCode className="h-4 w-4" />
              Show QR
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
          >
            {expanded ? 'Hide' : 'Details'}
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          {isManager && (
            <>
              <button
                type="button"
                onClick={toggleActive}
                disabled={updateSession.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-70"
              >
                {updateSession.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <RefreshCw className="h-4 w-4" />
                {session.isActive ? 'Close' : 'Reopen'}
              </button>
              <button
                type="button"
                onClick={() => onEdit(session)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(session)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && isManager && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-4 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-sm text-text-muted">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Checked In</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <AttendanceRow
                      key={record.id}
                      record={record}
                      onChange={(status) =>
                        updateRecord.mutate({ status })
                      }
                      isPending={updateRecord.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {expanded && !isManager && <StudentCheckInPanel offeringId={offeringId} session={session} />}

      <QrModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        session={session}
        qrUrl={qrUrl}
        code={session.code}
      />
    </div>
  )
}

function AttendanceRow({
  record,
  onChange,
  isPending,
}: {
  record: AttendanceRecord
  onChange: (status: AttendanceStatus) => void
  isPending: boolean
}) {
  return (
    <tr className="text-text">
      <td className="px-3 py-2 font-medium">{record.student?.name ?? 'Unknown'}</td>
      <td className="px-3 py-2">
        <StatusBadge status={record.status} />
      </td>
      <td className="px-3 py-2 text-text-muted">
        {record.checkedInAt ? new Date(record.checkedInAt).toLocaleString() : '-'}
      </td>
      <td className="px-3 py-2 text-text-muted capitalize">
        <span className="inline-flex items-center gap-1">
          {record.checkInMethod === 'qr' && <QrCode className="h-3.5 w-3.5" />}
          {record.checkInMethod === 'code' && <Search className="h-3.5 w-3.5" />}
          {record.checkInMethod === 'manual' && <Pencil className="h-3.5 w-3.5" />}
          {record.checkInMethod ?? '-'}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <select
          value={record.status}
          onChange={(e) => onChange(e.target.value as AttendanceStatus)}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-bbu-blue focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
    </tr>
  )
}

function StudentCheckInPanel({
  session,
}: {
  offeringId: number
  session: AttendanceSession
}) {
  // In a real mobile flow this would scan the QR; here we provide a code input for testing/demo.
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoStatus('done')
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleCheckIn = () => {
    if (!code.trim()) {
      setMessage('Please enter the check-in code.')
      return
    }
    // Demo: just validate the code visually. The real API call is wired below via a hidden form.
    setMessage(`Code "${code}" entered. (Demo check-in would submit ${code === session.code ? 'valid' : 'invalid'} code)`)
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h5 className="mb-3 text-sm font-semibold text-text">Your Check-In</h5>

      {session.isActive ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm text-text-muted">
            Ask your lecturer for the check-in code or scan the QR code displayed in class.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
            <button
              type="button"
              onClick={handleGeoLocate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4" />
              {geoStatus === 'done' ? 'Located' : geoStatus === 'loading' ? 'Locating...' : 'Use Location'}
            </button>
            <button
              type="button"
              onClick={handleCheckIn}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              <CheckCircle className="h-4 w-4" />
              Check In
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-text-muted">{message}</p>}
        </div>
      ) : (
        <p className="text-sm text-amber-600">This session is closed and can no longer be checked into.</p>
      )}
    </div>
  )
}

interface StudentHistoryData {
  summary?: {
    total: number
    present: number
    late: number
    absent: number
    excused: number
    percentage: number
  }
  sessions: AttendanceSession[]
  records: AttendanceRecord[]
}

function StudentHistory({
  data,
  isLoading,
}: {
  data?: StudentHistoryData
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const summary = data?.summary
  const records = data?.records ?? []

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Sessions" value={summary.total} />
          <StatCard label="Present" value={summary.present} color="green" />
          <StatCard label="Late" value={summary.late} color="amber" />
          <StatCard label="Absent" value={summary.absent} color="red" />
          <StatCard label="Rate" value={`${summary.percentage}%`} color="blue" />
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-text-muted">No attendance records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Checked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="text-text">
                  <td className="px-4 py-3 font-medium">{record.student?.name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-text-muted">{formatSessionTime(record.checkedInAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {record.checkedInAt ? new Date(record.checkedInAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color?: 'green' | 'amber' | 'red' | 'blue'
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  const colorClass = colorMap[color ?? ''] ?? 'bg-gray-50 text-text'

  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${colorClass}`}>
      <p className="text-xs font-medium uppercase text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function CourseAttendanceTab({ data }: CourseAttendanceTabProps) {
  const { offerings, context } = data
  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<AttendanceSession | undefined>()

  const offeringId = selectedOffering?.id

  const { data: sessionsData, isLoading: isLoadingSessions } = useAttendanceSessions(offeringId)
  const { data: historyData, isLoading: isLoadingHistory } = useAttendanceHistory(!isManager ? offeringId : undefined)
  const deleteSession = useDeleteAttendanceSession(offeringId)

  const sessions = sessionsData?.sessions ?? []

  const handleEdit = (session: AttendanceSession) => {
    setEditingSession(session)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingSession(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (session: AttendanceSession) => {
    if (!confirm(`Delete session "${session.title || 'Untitled'}"?`)) return
    try {
      await deleteSession.mutateAsync(session.id)
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
          <h2 className="text-lg font-semibold text-text">Attendance</h2>
        </div>

        {isManager && offeringId && (
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <Plus className="h-4 w-4" />
            Start Session
          </button>
        )}
      </div>

      {!offeringId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Users className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Offering Selected</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            There are no course offerings available to manage attendance for.
          </p>
        </div>
      ) : isLoadingSessions || (!isManager && isLoadingHistory) ? (
        <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Users className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Attendance Sessions Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {isManager
              ? 'Start a session to generate a QR code and track attendance.'
              : 'Attendance records for this course will appear here once sessions are held.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isManager={isManager}
              offeringId={offeringId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!isManager && offeringId && <StudentHistory data={historyData} isLoading={isLoadingHistory} />}

      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offeringId={offeringId ?? 0}
        session={editingSession}
      />
    </div>
  )
}

export default CourseAttendanceTab
