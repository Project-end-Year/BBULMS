import { useMemo, useState } from 'react'
import {
  TrendingUp,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Calculator,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'

import { type CourseOfferingSummary, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import { useEnrollments, type EnrollmentStudent } from '@/hooks/useEnrollments'
import {
  useGradeComponents,
  useCreateGradeComponent,
  useUpdateGradeComponent,
  useDeleteGradeComponent,
  useAllGrades,
  useSaveGrade,
  useRecalculateGrades,
  useMyGrades,
  type GradeComponent,
  type GradeComponentFormData,
  type GradeComponentType,
  type GradeEntry,
  type GradeBreakdownItem,
} from '@/hooks/useGrades'

interface CourseGradesTabProps {
  data: CourseDetailSummary
}

function letterGradeColorClass(letter: string | null | undefined): string {
  if (!letter) return 'bg-gray-100 text-text-muted'
  switch (letter) {
    case 'A':
      return 'bg-green-100 text-green-700'
    case 'B':
      return 'bg-blue-100 text-blue-700'
    case 'C':
      return 'bg-amber-100 text-amber-700'
    case 'D':
      return 'bg-orange-100 text-orange-700'
    case 'F':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-text-muted'
  }
}

function LetterGradeBadge({ grade }: { grade: string | null | undefined }) {
  return (
    <div className={`mt-1 inline-flex items-center rounded-lg px-3 py-1 text-2xl font-bold ${letterGradeColorClass(grade)}`}>
      {grade ?? '-'}
    </div>
  )
}

const COMPONENT_TYPES: { value: GradeComponentType; label: string }[] = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'custom', label: 'Custom' },
]

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isNaN(n) ? 0 : n
}

function ComponentModal({
  isOpen,
  onClose,
  offeringId,
  component,
  totalWeight,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  component?: GradeComponent
  totalWeight: number
}) {
  const isEditing = Boolean(component)
  const [name, setName] = useState(component?.name ?? '')
  const [type, setType] = useState<GradeComponentType>(component?.type ?? 'custom')
  const [weight, setWeight] = useState<number | ''>(
    component?.weight ? Number(component.weight) : ''
  )
  const [order, setOrder] = useState<number | ''>(component?.order ?? 0)

  const create = useCreateGradeComponent(offeringId)
  const update = useUpdateGradeComponent(offeringId, component?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending
  const currentWeight = weight === '' ? 0 : Number(weight)
  const remainingWeight = 100 - (totalWeight - (component ? toNumber(component.weight) : 0))
  const overLimit = currentWeight > remainingWeight

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overLimit) return

    const formData: GradeComponentFormData = {
      name,
      type,
      weight: currentWeight,
      order: order === '' ? 0 : Number(order),
    }

    try {
      if (isEditing && component) {
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
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Grade Component' : 'New Grade Component'}
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
            <label className="mb-1 block text-sm font-medium text-text">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Midterm Exam"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GradeComponentType)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
            >
              {COMPONENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-muted">
              Assignment, attendance, and quiz components are calculated automatically from submissions, attendance records, and quiz attempts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Weight (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={weight}
                onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
              {overLimit && (
                <p className="mt-1 text-xs text-red-600">
                  Remaining weight available: {remainingWeight.toFixed(2)}%
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Order</label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-text-muted">
            Total weight after saving:{' '}
            <span className="font-medium text-text">
              {(totalWeight - (component ? toNumber(component.weight) : 0) + currentWeight).toFixed(2)}%
            </span>
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
              disabled={isPending || !name || overLimit}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GradeCell({
  value,
  max,
  percentage,
  onChange,
  isEditing,
  isAuto,
}: {
  value: number | null
  max: number | null
  percentage: number | null
  onChange?: (val: number | '') => void
  isEditing: boolean
  isAuto: boolean
}) {
  if (isEditing && onChange && !isAuto) {
    return (
      <input
        type="number"
        min={0}
        step={0.01}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-bbu-blue focus:outline-none focus:ring-1 focus:ring-bbu-blue/20"
      />
    )
  }

  return (
    <div className="text-right text-sm text-text">
      {percentage !== null ? (
        <span className="font-medium">{percentage.toFixed(2)}%</span>
      ) : value !== null && max !== null ? (
        <span className="font-medium">
          {value} / {max}
        </span>
      ) : (
        <span className="text-text-muted">-</span>
      )}
    </div>
  )
}

function ManualGradeEditor({
  offeringId,
  component,
  students,
  grades,
}: {
  offeringId: number
  component: GradeComponent
  students: EnrollmentStudent[]
  grades: GradeEntry[]
}) {
  const save = useSaveGrade(offeringId)
  const [drafts, setDrafts] = useState<Record<number, number | ''>>({})
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({})

  const existingByStudent = useMemo(() => {
    const map: Record<number, GradeEntry> = {}
    grades.forEach((g) => {
      if (g.student && g.component?.id === component.id) {
        map[g.student.id] = g
      }
    })
    return map
  }, [grades, component.id])

  const handleSave = async (studentId: number) => {
    const points = drafts[studentId]
    if (points === '' || points === undefined) return
    const existing = existingByStudent[studentId]
    const maxPoints = existing?.maxPoints ? Number(existing.maxPoints) : 100

    try {
      await save.mutateAsync({
        studentId,
        componentId: component.id,
        points,
        maxPoints,
        feedback: feedbackDrafts[studentId] || undefined,
      })
      setDrafts((prev) => ({ ...prev, [studentId]: '' }))
      setFeedbackDrafts((prev) => ({ ...prev, [studentId]: '' }))
    } catch {
      // toast handled by hook
    }
  }

  return (
    <div className="space-y-3">
      {students.map((student) => {
        const existing = existingByStudent[student.id]
        const hasDraft = drafts[student.id] !== undefined && drafts[student.id] !== ''
        const displayValue = existing?.points ? Number(existing.points) : null

        return (
          <div
            key={student.id}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{student.name}</p>
              <p className="text-xs text-text-muted">{student.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={hasDraft ? drafts[student.id] : (displayValue ?? '')}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [student.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder={`Max ${existing?.maxPoints ? Number(existing.maxPoints) : 100}`}
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
              <input
                type="text"
                value={feedbackDrafts[student.id] ?? existing?.feedback ?? ''}
                onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [student.id]: e.target.value }))}
                placeholder="Feedback"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
              <button
                type="button"
                onClick={() => handleSave(student.id)}
                disabled={save.isPending || !hasDraft}
                className="inline-flex items-center gap-1 rounded-lg bg-bbu-blue px-3 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ManagerGradebook({
  offeringId,
}: {
  offeringId: number
}) {
  const { data: componentsData, isLoading: componentsLoading } = useGradeComponents(offeringId)
  const { data: gradesData, isLoading: gradesLoading } = useAllGrades(offeringId)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollments(offeringId)
  const recalculate = useRecalculateGrades(offeringId)
  const deleteComponent = useDeleteGradeComponent(offeringId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<GradeComponent | undefined>()
  const [expandedComponent, setExpandedComponent] = useState<number | null>(null)

  const components = componentsData?.components ?? []
  const grades = gradesData?.grades ?? []
  const students = enrollmentsData?.enrollments?.map((e) => e.student) ?? []
  const totalWeight = components.reduce((sum, c) => sum + toNumber(c.weight), 0)

  const handleDelete = async (component: GradeComponent) => {
    if (!confirm(`Delete "${component.name}"? This will remove associated grade data.`)) return
    try {
      await deleteComponent.mutateAsync(component.id)
    } catch {
      // toast handled by hook
    }
  }

  const handleRecalculate = async () => {
    try {
      await recalculate.mutateAsync()
    } catch {
      // toast handled by hook
    }
  }

  const isLoading = componentsLoading || gradesLoading || enrollmentsLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-text">Grade Components</h3>
            <p className="text-sm text-text-muted">
              Total weight:{' '}
              <span className={`font-medium ${totalWeight > 100 ? 'text-red-600' : 'text-bbu-blue'}`}>
                {totalWeight.toFixed(2)}%
              </span>{' '}
              of 100%
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={recalculate.isPending || components.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {recalculate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Calculator className="h-4 w-4" />
              Recalculate
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingComponent(undefined)
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              <Plus className="h-4 w-4" />
              Add Component
            </button>
          </div>
        </div>

        {components.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm text-text-muted">No grade components yet. Add components before entering grades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Weight</th>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {components.map((component) => (
                  <tr key={component.id} className="text-text">
                    <td className="px-4 py-3 font-medium">{component.name}</td>
                    <td className="px-4 py-3 capitalize">{component.type}</td>
                    <td className="px-4 py-3">{toNumber(component.weight).toFixed(2)}%</td>
                    <td className="px-4 py-3">{component.order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingComponent(component)
                            setIsModalOpen(true)
                          }}
                          className="rounded p-1 text-text-muted hover:bg-gray-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(component)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalWeight !== 100 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Component weights should sum to 100% for the overall grade to be meaningful. Current total:{' '}
              {totalWeight.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {components.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text">Gradebook</h3>

          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm text-text-muted">No enrolled students to display.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-text-muted">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-medium">Student</th>
                    {components.map((component) => (
                      <th key={component.id} className="px-4 py-3 font-medium text-right">
                        {component.name}
                        <span className="ml-1 text-xs text-text-muted">({toNumber(component.weight).toFixed(0)}%)</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium text-right">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => {
                    const studentGrades = grades.filter((g) => g.student?.id === student.id)
                    const overall = studentGrades.find((g) => g.component === null)?.percentage
                      ? Number(studentGrades.find((g) => g.component === null)?.percentage)
                      : null

                    return (
                      <tr key={student.id} className="text-text">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-text-muted">{student.email}</p>
                        </td>
                        {components.map((component) => {
                          const grade = studentGrades.find((g) => g.component?.id === component.id)
                          return (
                            <td key={component.id} className="px-4 py-3">
                              <GradeCell
                                value={grade?.points ? Number(grade.points) : null}
                                max={grade?.maxPoints ? Number(grade.maxPoints) : null}
                                percentage={grade?.percentage ? Number(grade.percentage) : null}
                                isEditing={false}
                                isAuto={component.type === 'assignment' || component.type === 'attendance' || component.type === 'quiz'}
                              />
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-right">
                          {overall !== null ? (
                            <span className="font-semibold text-bbu-blue">{overall.toFixed(2)}%</span>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {components
        .filter((c) => c.type === 'custom' || c.type === 'midterm' || c.type === 'final')
        .map((component) => (
          <div key={component.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => setExpandedComponent((v) => (v === component.id ? null : component.id))}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <h3 className="text-base font-semibold text-text">{component.name}</h3>
                <p className="text-sm text-text-muted">
                  Manual entries · Weight {toNumber(component.weight).toFixed(2)}%
                </p>
              </div>
              {expandedComponent === component.id ? (
                <ChevronUp className="h-5 w-5 text-text-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-text-muted" />
              )}
            </button>
            {expandedComponent === component.id && (
              <div className="mt-4">
                <ManualGradeEditor
                  offeringId={offeringId}
                  component={component}
                  students={students}
                  grades={grades}
                />
              </div>
            )}
          </div>
        ))}

      <ComponentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offeringId={offeringId}
        component={editingComponent}
        totalWeight={totalWeight}
      />
    </div>
  )
}

function StudentGradebook({
  offeringId,
}: {
  offeringId: number
}) {
  const { data, isLoading } = useMyGrades(offeringId)

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
        <p className="text-sm text-text-muted">Unable to load your grades.</p>
      </div>
    )
  }

  const { breakdown, overall, letterGrade, totalWeight } = data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-text-muted">Overall Grade</p>
          <p className="mt-1 text-3xl font-bold text-bbu-blue">
            {overall !== null ? `${overall.toFixed(2)}%` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-text-muted">Letter Grade</p>
          <LetterGradeBadge grade={letterGrade} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-text-muted">Total Weight</p>
          <p className="mt-1 text-3xl font-bold text-text">{totalWeight.toFixed(2)}%</p>
        </div>
      </div>

      {breakdown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Grade Components</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Grade components have not been set up for this course offering yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Percentage</th>
                <th className="px-4 py-3 font-medium text-right">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breakdown.map((item: GradeBreakdownItem) => (
                <tr key={item.component.id} className="text-text">
                  <td className="px-4 py-3 font-medium">{item.component.name}</td>
                  <td className="px-4 py-3 capitalize">{item.component.type}</td>
                  <td className="px-4 py-3">{toNumber(item.component.weight).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">
                    {item.points !== null && item.maxPoints !== null ? (
                      <span>
                        {item.points} / {item.maxPoints}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.percentage !== null ? (
                      <span className="font-medium">{item.percentage.toFixed(2)}%</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.percentage !== null ? (
                      <span className="font-medium text-bbu-blue">{item.weighted.toFixed(2)}%</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalWeight !== 100 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your overall grade is calculated from the weighted components above. Total weight is{' '}
            {totalWeight.toFixed(2)}%.
          </p>
        </div>
      )}
    </div>
  )
}

function CourseGradesTab({ data }: CourseGradesTabProps) {
  const { offerings, context } = data
  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )

  const offeringId = selectedOffering?.id

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
          <h2 className="text-lg font-semibold text-text">Grades</h2>
        </div>
      </div>

      {!offeringId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <TrendingUp className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Offering Selected</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            There are no course offerings available to view grades for.
          </p>
        </div>
      ) : isManager ? (
        <ManagerGradebook offeringId={offeringId} />
      ) : (
        <StudentGradebook offeringId={offeringId} />
      )}
    </div>
  )
}

export default CourseGradesTab
