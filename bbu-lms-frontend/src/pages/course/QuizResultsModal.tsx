import { useMemo } from 'react'
import {
  X,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  BarChart3,
  Clock,
  Calendar,
  ChevronRight,
} from 'lucide-react'

import { type Quiz } from '@/hooks/useQuizzes'
import { useQuizResults } from '@/hooks/useQuizResults'
import { type QuizAttemptResponse, useQuizAttempt } from '@/hooks/useQuizAttempts'

interface QuizResultsModalProps {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  quiz: Quiz
  attemptId?: number
  mode: 'student' | 'lecturer'
}

function QuizResultsModal({ isOpen, onClose, offeringId, quiz, attemptId, mode }: QuizResultsModalProps) {
  const isStudent = mode === 'student'
  const studentAttempt = useQuizAttempt(
    isStudent ? offeringId : undefined,
    isStudent ? quiz.id : undefined,
    isStudent ? attemptId : undefined
  )
  const classResults = useQuizResults(
    !isStudent ? offeringId : undefined,
    !isStudent ? quiz.id : undefined
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-text">{quiz.title}</h3>
            <p className="text-xs text-text-muted capitalize">
              {isStudent ? 'Your results' : 'Class results'} · {quiz.type}
            </p>
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

        <div className="flex-1 overflow-y-auto p-6">
          {isStudent ? (
            <StudentResultView attempt={studentAttempt.data} quiz={quiz} isLoading={studentAttempt.isLoading} />
          ) : (
            <LecturerResultView data={classResults.data} quiz={quiz} isLoading={classResults.isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

function StudentResultView({
  attempt,
  quiz,
  isLoading,
}: {
  attempt: QuizAttemptResponse | undefined
  quiz: Quiz
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
        Loading results…
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <HelpCircle className="mb-3 h-10 w-10 text-text-muted" />
        <p className="text-sm text-text-muted">No attempt data found.</p>
      </div>
    )
  }

  const score = attempt.attempt.score ?? 0
  const maxScore = attempt.attempt.maxScore ?? quiz.totalPoints
  const percentage = attempt.attempt.percentage ?? 0
  const isPassing = quiz.passingScorePercentage != null && percentage >= quiz.passingScorePercentage

  const answers = useMemo(() => {
    const map: Record<number, { optionId?: number | null; answerText?: string | null; isCorrect?: boolean | null }> = {}
    attempt.answers.forEach((a) => {
      map[a.questionId] = a
    })
    return map
  }, [attempt.answers])

  const correctCount = quiz.questions.filter((q) => {
    const answer = answers[q.id!]
    return answer?.isCorrect === true
  }).length

  const incorrectCount = quiz.questions.filter((q) => {
    const answer = answers[q.id!]
    return answer?.isCorrect === false
  }).length

  const pendingCount = quiz.questions.filter((q) => {
    const answer = answers[q.id!]
    return answer?.isCorrect === null || answer?.isCorrect === undefined
  }).length

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-full ${
                isPassing ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className="text-xl font-bold">{percentage}%</span>
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Score</p>
              <p className="text-2xl font-bold text-text">
                {score} <span className="text-base font-normal text-text-muted">/ {maxScore}</span>
              </p>
              {quiz.passingScorePercentage != null && (
                <p className="text-xs text-text-muted">
                  Passing score: {quiz.passingScorePercentage}% · {isPassing ? 'Passed' : 'Did not pass'}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-green-700">
              <CheckCircle className="h-4 w-4" />
              {correctCount} correct
            </div>
            <div className="flex items-center gap-1.5 text-red-600">
              <XCircle className="h-4 w-4" />
              {incorrectCount} incorrect
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock className="h-4 w-4" />
                {pendingCount} pending review
              </div>
            )}
          </div>
        </div>
      </div>

      {quiz.showCorrectAnswers && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-text">Question Breakdown</h4>
          {quiz.questions.map((question, idx) => {
            const answer = answers[question.id!]
            const isCorrect = answer?.isCorrect === true
            const isIncorrect = answer?.isCorrect === false
            const selectedOption = question.options?.find((o) => o.id === answer?.optionId)

            return (
              <div key={question.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-text-muted">
                      Question {idx + 1} · {question.points} pts
                    </span>
                    <p className="text-sm font-medium text-text">{question.prompt}</p>
                  </div>
                  {isCorrect && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
                  {isIncorrect && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
                  {!isCorrect && !isIncorrect && (
                    <Clock className="h-5 w-5 shrink-0 text-amber-600" />
                  )}
                </div>

                {question.type !== 'short_answer' ? (
                  <div className="space-y-1.5">
                    {question.options?.map((option) => {
                      const isSelected = selectedOption?.id === option.id
                      const isCorrectOption = option.isCorrect

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            isCorrectOption
                              ? 'border-green-300 bg-green-50 text-green-800'
                              : isSelected && !isCorrectOption
                                ? 'border-red-300 bg-red-50 text-red-800'
                                : 'border-gray-200 bg-white text-text'
                          }`}
                        >
                          {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                          {!isCorrectOption && !isSelected && <div className="h-4 w-4" />}
                          <span>{option.optionText}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-text">
                    <p className="text-xs text-text-muted">Your answer:</p>
                    <p>{answer?.answerText || 'No answer provided.'}</p>
                  </div>
                )}

                {question.explanation && isCorrect && (
                  <p className="mt-3 text-xs text-text-muted">{question.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!quiz.showCorrectAnswers && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Correct answers are not being shown for this quiz.
        </div>
      )}
    </div>
  )
}

function LecturerResultView({
  data,
  quiz,
  isLoading,
}: {
  data: ReturnType<typeof useQuizResults>['data']
  quiz: Quiz
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-text-muted">
        Loading class results…
      </div>
    )
  }

  if (!data || data.attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <BarChart3 className="mb-3 h-10 w-10 text-text-muted" />
        <h3 className="text-lg font-medium text-text">No Submissions Yet</h3>
        <p className="mt-1 max-w-sm text-sm text-text-muted">
          Students’ completed attempts will appear here once they submit the quiz.
        </p>
      </div>
    )
  }

  const { stats, histogram, questionStats, attempts } = data
  const maxBinCount = Math.max(...histogram.map((b) => b.count), 1)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Attempts" value={String(stats.totalAttempts)} />
        <StatCard
          icon={Trophy}
          label="Average"
          value={stats.averageScore != null ? `${stats.averageScore}%` : '—'}
        />
        <StatCard
          icon={CheckCircle}
          label="Passing"
          value={
            quiz.passingScorePercentage != null
              ? `${stats.passingCount} / ${stats.totalAttempts}`
              : '—'
          }
        />
        <StatCard
          icon={Calendar}
          label="Range"
          value={
            stats.highestScore != null && stats.lowestScore != null
              ? `${stats.lowestScore}% – ${stats.highestScore}%`
              : '—'
          }
        />
      </div>

      {histogram.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-base font-semibold text-text">Score Distribution</h4>
          <div className="space-y-3">
            {histogram.map((bin) => (
              <div key={bin.label} className="flex items-center gap-3">
                <span className="w-16 text-xs font-medium text-text-muted">{bin.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full bg-bbu-blue"
                    style={{ width: `${(bin.count / maxBinCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium text-text">{bin.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-base font-semibold text-text">Per-Question Performance</h4>
        <div className="space-y-3">
          {questionStats.map((q, idx) => (
            <div key={q.questionId} className="flex items-center gap-3">
              <span className="w-20 text-xs font-medium text-text-muted">Q{idx + 1}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${q.correctRate}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs text-text-muted">
                {q.correctCount}/{q.answeredCount} correct
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h4 className="text-base font-semibold text-text">Recent Submissions</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-text">
                  Attempt #{attempt.attemptNumber}
                </p>
                <p className="text-xs text-text-muted">
                  {attempt.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleString()
                    : 'Not submitted'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-text">
                {attempt.percentage != null ? `${attempt.percentage}%` : '—'}
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
    </div>
  )
}

export default QuizResultsModal
