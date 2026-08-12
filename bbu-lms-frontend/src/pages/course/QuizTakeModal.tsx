import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  LayoutList,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { type Quiz } from '@/hooks/useQuizzes'
import {
  useQuizAttempt,
  useStartQuizAttempt,
  useSaveQuizAnswer,
  useSubmitQuizAttempt,
  type QuizAnswerState,
} from '@/hooks/useQuizAttempts'

interface QuizTakeModalProps {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  quiz: Quiz
}

function formatSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

function useCountdownTarget(expiresAt: string | null | undefined): number {
  const target = useMemo(() => {
    if (!expiresAt) return null
    const date = new Date(expiresAt)
    return Number.isNaN(date.getTime()) ? null : date.getTime()
  }, [expiresAt])

  const [remaining, setRemaining] = useState(() => {
    if (!target) return 0
    return Math.max(0, Math.floor((target - Date.now()) / 1000))
  })

  useEffect(() => {
    if (!target) return

    const tick = () => {
      const next = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setRemaining(next)
      return next
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [target])

  return remaining
}

function QuizTakeModal({ isOpen, onClose, offeringId, quiz }: QuizTakeModalProps) {
  const [attemptId, setAttemptId] = useState<number | undefined>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullPage, setFullPage] = useState(false)
  const [localAnswers, setLocalAnswers] = useState<Record<number, QuizAnswerState>>({})
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAttempt = useStartQuizAttempt(offeringId, quiz.id)
  const existingAttempt = useQuizAttempt(offeringId, quiz.id, attemptId)
  const saveAnswer = useSaveQuizAnswer(offeringId, quiz.id, attemptId)
  const submitAttempt = useSubmitQuizAttempt(offeringId, quiz.id, attemptId)

  const isCompleted = existingAttempt.data?.attempt.status === 'completed'
  const questions = existingAttempt.data?.quiz.questions ?? []
  const currentQuestion = questions[currentIndex]

  const remainingSeconds = useCountdownTarget(
    isCompleted ? null : existingAttempt.data?.attempt.expiresAt
  )

  useEffect(() => {
    if (!isOpen) {
      setAttemptId(undefined)
      setCurrentIndex(0)
      setFullPage(false)
      setLocalAnswers({})
    }
  }, [isOpen])

  useEffect(() => {
    if (existingAttempt.data) {
      const map: Record<number, QuizAnswerState> = {}
      existingAttempt.data.answers.forEach((a) => {
        map[a.questionId] = a
      })
      setLocalAnswers(map)
    }
  }, [existingAttempt.data?.answers])

  const hasAutoSubmitted = useRef(false)

  useEffect(() => {
    if (remainingSeconds === 0 && attemptId && !isCompleted && !submitAttempt.isPending && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true
      submitAttempt.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds])

  const handleStart = async () => {
    const response = await startAttempt.mutateAsync()
    setAttemptId(response.attempt.id)
  }

  const updateAnswer = (questionId: number, patch: Partial<QuizAnswerState>) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        optionId: patch.optionId !== undefined ? patch.optionId : prev[questionId]?.optionId ?? null,
        answerText: patch.answerText !== undefined ? patch.answerText : prev[questionId]?.answerText ?? null,
      },
    }))
  }

  const flushSave = (questionId: number) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)

    autosaveTimer.current = setTimeout(() => {
      const answer = localAnswers[questionId]
      if (!answer || !attemptId || isCompleted) return
      saveAnswer.mutate({
        questionId,
        optionId: answer.optionId,
        answerText: answer.answerText,
      })
    }, 800)
  }

  const handleOptionSelect = (questionId: number, optionId: number) => {
    updateAnswer(questionId, { optionId })
    flushSave(questionId)
  }

  const handleTextChange = (questionId: number, answerText: string) => {
    updateAnswer(questionId, { answerText })
    flushSave(questionId)
  }

  const handleSubmit = () => {
    if (!confirm('Submit your quiz? You cannot change answers after submitting.')) return
    submitAttempt.mutate()
  }

  const answeredQuestionIds = useMemo(
    () =>
      new Set(
        Object.values(localAnswers).filter((a) => a.optionId != null || (a.answerText ?? '').trim() !== '').map((a) => a.questionId)
      ),
    [localAnswers]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[95vh] w-full max-w-5xl flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-text">{quiz.title}</h3>
            <p className="text-xs text-text-muted">
              {questions.length} question{questions.length === 1 ? '' : 's'} · {quiz.totalPoints} pts
              {quiz.attemptsAllowed > 1 && ` · ${quiz.attemptsAllowed} attempts allowed`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {existingAttempt.data?.attempt.expiresAt && !isCompleted && (
              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  remainingSeconds < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-text'
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatSeconds(remainingSeconds)}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-text-muted hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!existingAttempt.data ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <FileText className="mb-4 h-12 w-12 text-bbu-blue" />
            <h4 className="text-lg font-semibold text-text">Ready to start?</h4>
            <p className="mt-2 max-w-md text-sm text-text-muted">
              {quiz.timeLimitMinutes
                ? `You have ${quiz.timeLimitMinutes} minute${quiz.timeLimitMinutes === 1 ? '' : 's'} to complete ${quiz.questions.length} question${quiz.questions.length === 1 ? '' : 's'}.`
                : `There is no time limit for this ${quiz.type}.`}
            </p>
            {quiz.shuffleQuestions && (
              <p className="mt-1 text-xs text-text-muted">Questions will be shuffled.</p>
            )}
            <button
              type="button"
              onClick={handleStart}
              disabled={startAttempt.isPending}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:opacity-70"
            >
              {startAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Start {quiz.type}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-2">
              <div className="flex items-center gap-2 text-sm text-text">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    In progress
                  </span>
                )}
                {isCompleted && existingAttempt.data.attempt.percentage != null && (
                  <span className="ml-3 text-text-muted">
                    Score: {existingAttempt.data.attempt.score} / {existingAttempt.data.attempt.maxScore} (
                    {existingAttempt.data.attempt.percentage}%)
                  </span>
                )}
              </div>
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => setFullPage((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
                >
                  {fullPage ? (
                    <>
                      <LayoutList className="h-3.5 w-3.5" />
                      One at a time
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      Full page
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="hidden w-56 flex-col border-r border-gray-200 bg-gray-50 p-4 md:flex">
                <p className="mb-2 text-xs font-medium uppercase text-text-muted">Questions</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex h-8 items-center justify-center rounded-md text-xs font-medium ${
                        idx === currentIndex
                          ? 'bg-bbu-blue text-white'
                          : answeredQuestionIds.has(questions[idx].id!)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-white text-text hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {fullPage || isCompleted ? (
                  <div className="space-y-8">
                    {questions.map((question, idx) => (
                      <QuestionCard
                        key={question.id}
                        index={idx}
                        question={question}
                        answer={localAnswers[question.id!]}
                        isCompleted={isCompleted}
                        showCorrect={quiz.showCorrectAnswers}
                        onOptionSelect={handleOptionSelect}
                        onTextChange={handleTextChange}
                      />
                    ))}
                  </div>
                ) : (
                  currentQuestion && (
                    <QuestionCard
                      index={currentIndex}
                      question={currentQuestion}
                      answer={localAnswers[currentQuestion.id!]}
                      isCompleted={isCompleted}
                      showCorrect={quiz.showCorrectAnswers}
                      onOptionSelect={handleOptionSelect}
                      onTextChange={handleTextChange}
                    />
                  )
                )}
              </div>
            </div>

            {!isCompleted && !fullPage && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-text-muted">
                  {currentIndex + 1} / {questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {!isCompleted && (
              <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitAttempt.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:opacity-70"
                >
                  {submitAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />
                  Submit Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function QuestionCard({
  index,
  question,
  answer,
  isCompleted,
  showCorrect,
  onOptionSelect,
  onTextChange,
}: {
  index: number
  question: Quiz['questions'][number]
  answer: QuizAnswerState | undefined
  isCompleted: boolean
  showCorrect: boolean
  onOptionSelect: (questionId: number, optionId: number) => void
  onTextChange: (questionId: number, text: string) => void
}) {
  const selectedOptionId = answer?.optionId ?? null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <span className="mb-1 inline-block text-xs font-medium text-text-muted">Question {index + 1} · {question.points} pts</span>
        <p className="text-base font-medium text-text">{question.prompt}</p>
      </div>

      {question.type !== 'short_answer' ? (
        <div className="space-y-2">
          {question.options?.map((option) => {
            const isSelected = selectedOptionId === option.id
            const showResult = isCompleted && showCorrect
            const isCorrectOption = 'isCorrect' in option && option.isCorrect === true
            const isWrongSelected = showResult && isSelected && !isCorrectOption

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? 'border-bbu-blue bg-bbu-blue/5'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                } ${
                  showResult && isCorrectOption
                    ? 'border-green-500 bg-green-50'
                    : ''
                } ${isWrongSelected ? 'border-red-300 bg-red-50' : ''} ${
                  isCompleted ? 'cursor-default' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={isSelected}
                  onChange={() => !isCompleted && onOptionSelect(question.id!, option.id!)}
                  disabled={isCompleted}
                  className="h-4 w-4 border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                <span className="text-sm text-text">{option.optionText}</span>
                {showResult && isCorrectOption && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
              </label>
            )
          })}
        </div>
      ) : (
        <textarea
          value={answer?.answerText ?? ''}
          onChange={(e) => !isCompleted && onTextChange(question.id!, e.target.value)}
          disabled={isCompleted}
          placeholder="Type your answer here..."
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:bg-gray-50"
        />
      )}

      {isCompleted && answer?.answerText == null && selectedOptionId == null && (
        <p className="mt-2 text-sm text-text-muted">No answer provided.</p>
      )}
    </div>
  )
}

export default QuizTakeModal
