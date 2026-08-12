import { useState } from 'react'
import {
  HelpCircle,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  Save,
  EyeOff,
  Eye,
  Clock,
  Shuffle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  BarChart3,
} from 'lucide-react'

import { type CourseOfferingSummary, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import {
  useQuizzes,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useToggleQuizPublished,
  type Quiz,
  type QuizFormData,
  type Question,
  type QuestionOption,
  type QuestionType,
  type QuizType,
} from '@/hooks/useQuizzes'
import QuizTakeModal from './QuizTakeModal'
import QuizResultsModal from './QuizResultsModal'

interface CourseQuizzesTabProps {
  data: CourseDetailSummary
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
]

const QUIZ_TYPES: { value: QuizType; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'practice', label: 'Practice' },
]

function emptyQuestion(type: QuestionType = 'multiple_choice'): Question {
  return {
    type,
    prompt: '',
    points: 1,
    order: 0,
    explanation: '',
    options: type === 'true_false'
      ? [
          { optionText: 'True', isCorrect: true, order: 0 },
          { optionText: 'False', isCorrect: false, order: 1 },
        ]
      : [
          { optionText: '', isCorrect: true, order: 0 },
          { optionText: '', isCorrect: false, order: 1 },
        ],
  }
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function QuizModal({
  isOpen,
  onClose,
  offeringId,
  quiz,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  quiz?: Quiz
}) {
  const isEditing = Boolean(quiz)
  const [title, setTitle] = useState(quiz?.title ?? '')
  const [description, setDescription] = useState(quiz?.description ?? '')
  const [type, setType] = useState<QuizType>(quiz?.type ?? 'quiz')
  const [timeLimit, setTimeLimit] = useState<number | ''>(quiz?.timeLimitMinutes ?? '')
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | ''>(quiz?.attemptsAllowed ?? 1)
  const [shuffleQuestions, setShuffleQuestions] = useState(quiz?.shuffleQuestions ?? false)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(quiz?.showCorrectAnswers ?? false)
  const [isPublished, setIsPublished] = useState(quiz?.isPublished ?? false)
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(quiz?.startsAt))
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(quiz?.endsAt))
  const [passingScore, setPassingScore] = useState<number | ''>(quiz?.passingScorePercentage ?? '')
  const [questions, setQuestions] = useState<Question[]>(
    quiz?.questions?.length ? quiz.questions : [emptyQuestion()]
  )
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0)

  const create = useCreateQuiz(offeringId)
  const update = useUpdateQuiz(offeringId, quiz?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion(), order: prev.length }])
    setExpandedQuestion(questions.length)
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (index: number, patch: Partial<Question>) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      if (patch.type === 'true_false') {
        next[index].options = [
          { optionText: 'True', isCorrect: true, order: 0 },
          { optionText: 'False', isCorrect: false, order: 1 },
        ]
      }
      if (patch.type === 'multiple_choice' && next[index].options.length < 2) {
        next[index].options = [
          { optionText: '', isCorrect: true, order: 0 },
          { optionText: '', isCorrect: false, order: 1 },
        ]
      }
      if (patch.type === 'short_answer') {
        next[index].options = []
      }
      return next
    })
  }

  const handleOptionChange = (qIndex: number, oIndex: number, patch: Partial<QuestionOption>) => {
    setQuestions((prev) => {
      const next = [...prev]
      const options = [...next[qIndex].options]
      options[oIndex] = { ...options[oIndex], ...patch }
      if (patch.isCorrect) {
        options.forEach((o, i) => {
          if (i !== oIndex) o.isCorrect = false
        })
      }
      next[qIndex].options = options
      return next
    })
  }

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[qIndex].options = [
        ...next[qIndex].options,
        { optionText: '', isCorrect: false, order: next[qIndex].options.length },
      ]
      return next
    })
  }

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[qIndex].options = next[qIndex].options.filter((_, i) => i !== oIndex)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData: QuizFormData = {
      title,
      description: description || undefined,
      type,
      timeLimitMinutes: timeLimit === '' ? null : Number(timeLimit),
      attemptsAllowed: attemptsAllowed === '' ? 1 : Number(attemptsAllowed),
      shuffleQuestions,
      showCorrectAnswers,
      isPublished,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      passingScorePercentage: passingScore === '' ? null : Number(passingScore),
      questions: questions.map((q, idx) => ({
        ...q,
        order: idx,
        options: q.options.map((o, oIdx) => ({ ...o, order: oIdx })),
      })),
    }

    try {
      if (isEditing && quiz) {
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
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Quiz' : 'New Quiz'}
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Week 3 Quiz"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as QuizType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                >
                  {QUIZ_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                placeholder="Instructions for students"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Time Limit (min)</label>
                <input
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Attempts</label>
                <input
                  type="number"
                  min={1}
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Passing Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Total Points</label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-text">
                  {totalPoints}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Starts At</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
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

            <div className="flex flex-wrap items-center gap-4 text-sm text-text">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                <Shuffle className="h-4 w-4 text-text-muted" />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                <CheckCircle className="h-4 w-4 text-text-muted" />
                Show correct answers
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                Published
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-text">Questions</h4>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedQuestion((v) => (v === qIndex ? null : qIndex))}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-text-muted">
                          {qIndex + 1}
                        </span>
                        <span className="text-sm font-medium text-text">
                          {question.prompt || 'Untitled question'}
                        </span>
                        <span className="text-xs text-text-muted capitalize">
                          {question.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-text-muted">{question.points} pt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveQuestion(qIndex)
                            }}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {expandedQuestion === qIndex ? (
                          <ChevronUp className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                    </button>

                    {expandedQuestion === qIndex && (
                      <div className="border-t border-gray-200 px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-sm font-medium text-text">Prompt</label>
                            <input
                              type="text"
                              value={question.prompt}
                              onChange={(e) => handleQuestionChange(qIndex, { prompt: e.target.value })}
                              required
                              placeholder="What is...?"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text">Points</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={question.points}
                              onChange={(e) => handleQuestionChange(qIndex, { points: Number(e.target.value) })}
                              required
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="mb-1 block text-sm font-medium text-text">Type</label>
                          <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(qIndex, { type: e.target.value as QuestionType })}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {question.type !== 'short_answer' && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-text">Options</label>
                              <button
                                type="button"
                                onClick={() => handleAddOption(qIndex)}
                                className="text-xs font-medium text-bbu-blue hover:underline"
                              >
                                Add option
                              </button>
                            </div>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={option.isCorrect}
                                  onChange={() => handleOptionChange(qIndex, oIndex, { isCorrect: true })}
                                  className="h-4 w-4 border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                                  title="Mark as correct"
                                />
                                <input
                                  type="text"
                                  value={option.optionText}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, { optionText: e.target.value })}
                                  required
                                  placeholder={`Option ${oIndex + 1}`}
                                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                                />
                                {question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(qIndex, oIndex)}
                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                    aria-label="Remove option"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4">
                          <label className="mb-1 block text-sm font-medium text-text">Explanation (optional)</label>
                          <input
                            type="text"
                            value={question.explanation ?? ''}
                            onChange={(e) => handleQuestionChange(qIndex, { explanation: e.target.value })}
                            placeholder="Shown after submission if correct answers are revealed"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title || questions.some((q) => !q.prompt)}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function QuizCard({
  quiz,
  isManager,
  onEdit,
  onDelete,
  onToggle,
  onTake,
  onViewResults,
}: {
  quiz: Quiz
  isManager: boolean
  onEdit: (quiz: Quiz) => void
  onDelete: (quiz: Quiz) => void
  onToggle: (quiz: Quiz) => void
  onTake: (quiz: Quiz) => void
  onViewResults: (quiz: Quiz) => void
}) {
  const hasWindow = quiz.startsAt || quiz.endsAt

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-text">{quiz.title}</h4>
            {!quiz.isPublished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <EyeOff className="h-3 w-3" />
                Draft
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-text-muted">
              {quiz.type}
            </span>
          </div>

          {quiz.description && (
            <p className="mt-1 line-clamp-2 text-sm text-text-muted">{quiz.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>{quiz.questionsCount ?? quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'}</span>
            <span>{quiz.totalPoints} pts</span>
            {quiz.timeLimitMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {quiz.timeLimitMinutes} min
              </span>
            )}
            {quiz.attemptsAllowed > 1 && <span>{quiz.attemptsAllowed} attempts</span>}
            {quiz.shuffleQuestions && (
              <span className="inline-flex items-center gap-1">
                <Shuffle className="h-3.5 w-3.5" />
                Shuffled
              </span>
            )}
            {hasWindow && (
              <span>
                {quiz.startsAt ? new Date(quiz.startsAt).toLocaleString() : 'Now'} -
                {quiz.endsAt ? new Date(quiz.endsAt).toLocaleString() : 'Open'}
              </span>
            )}
          </div>
        </div>

        {isManager ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(quiz)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                quiz.isPublished
                  ? 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50'
                  : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              {quiz.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {quiz.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => onEdit(quiz)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onViewResults(quiz)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-bbu-blue hover:bg-blue-50"
            >
              <BarChart3 className="h-4 w-4" />
              Results
            </button>
            <button
              type="button"
              onClick={() => onDelete(quiz)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        ) : (
          quiz.isPublished && (
            <button
              type="button"
              onClick={() => onTake(quiz)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-bbu-blue px-3 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
            >
              <Play className="h-4 w-4" />
              Take Quiz
            </button>
          )
        )}
      </div>
    </div>
  )
}

function CourseQuizzesTab({ data }: CourseQuizzesTabProps) {
  const { offerings, context } = data
  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>()
  const [takingQuiz, setTakingQuiz] = useState<Quiz | undefined>()
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | undefined>()
  const [studentResultAttemptId, setStudentResultAttemptId] = useState<number | undefined>()

  const offeringId = selectedOffering?.id
  const { data: quizzesData, isLoading } = useQuizzes(offeringId)
  const deleteQuiz = useDeleteQuiz(offeringId)
  const togglePublished = useToggleQuizPublished(offeringId)

  const quizzes = quizzesData?.quizzes ?? []

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingQuiz(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (quiz: Quiz) => {
    if (!confirm(`Delete "${quiz.title}"?`)) return
    try {
      await deleteQuiz.mutateAsync(quiz.id)
    } catch {
      // toast handled by hook
    }
  }

  const handleToggle = async (quiz: Quiz) => {
    try {
      await togglePublished.mutateAsync(quiz.id)
    } catch {
      // toast handled by hook
    }
  }

  const handleTake = (quiz: Quiz) => {
    setTakingQuiz(quiz)
  }

  const handleViewResults = (quiz: Quiz) => {
    setResultsQuiz(quiz)
    setStudentResultAttemptId(undefined)
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
          <h2 className="text-lg font-semibold text-text">Quizzes</h2>
        </div>

        {isManager && offeringId && (
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <Plus className="h-4 w-4" />
            Add Quiz
          </button>
        )}
      </div>

      {!offeringId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <HelpCircle className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Offering Selected</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            There are no course offerings available to manage quizzes for.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <HelpCircle className="mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Quizzes Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {isManager
              ? 'Create quizzes, exams, and practice assessments for this offering.'
              : 'Quizzes for this course will appear here once published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isManager={isManager}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onTake={handleTake}
              onViewResults={handleViewResults}
            />
          ))}
        </div>
      )}

      <QuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offeringId={offeringId ?? 0}
        quiz={editingQuiz}
      />

      {takingQuiz && offeringId && (
        <QuizTakeModal
          isOpen={!!takingQuiz}
          onClose={() => setTakingQuiz(undefined)}
          offeringId={offeringId}
          quiz={takingQuiz}
        />
      )}

      {resultsQuiz && offeringId && (
        <QuizResultsModal
          isOpen={!!resultsQuiz}
          onClose={() => {
            setResultsQuiz(undefined)
            setStudentResultAttemptId(undefined)
          }}
          offeringId={offeringId}
          quiz={resultsQuiz}
          attemptId={studentResultAttemptId}
          mode={isManager ? 'lecturer' : 'student'}
        />
      )}
    </div>
  )
}

export default CourseQuizzesTab
