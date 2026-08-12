import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import { type Quiz } from '@/hooks/useQuizzes'

export interface QuizAttempt {
  id: number
  quizId: number
  attemptNumber: number
  startedAt: string
  submittedAt: string | null
  expiresAt: string | null
  score: number | null
  maxScore: number | null
  percentage: number | null
  status: 'in_progress' | 'completed'
  questionOrder: number[] | null
  createdAt: string
}

export interface QuizAnswerState {
  questionId: number
  optionId: number | null
  answerText: string | null
}

export interface QuizAttemptResponse {
  attempt: QuizAttempt
  quiz: Quiz
  answers: QuizAnswerState[]
}

export interface SaveAnswerData {
  questionId: number
  optionId?: number | null
  answerText?: string | null
}

const attemptsKey = (offeringId: number | undefined, quizId: number | undefined) => [
  'quiz-attempts',
  offeringId,
  quizId,
]
const attemptKey = (
  offeringId: number | undefined,
  quizId: number | undefined,
  attemptId: number | undefined
) => ['quiz-attempt', offeringId, quizId, attemptId]

export function useQuizAttempt(
  offeringId: number | undefined,
  quizId: number | undefined,
  attemptId: number | undefined
) {
  return useQuery<QuizAttemptResponse, Error>({
    queryKey: attemptKey(offeringId, quizId, attemptId),
    queryFn: async () => {
      const { data } = await api.get(
        `/course-offerings/${offeringId}/quizzes/${quizId}/attempts/${attemptId}`
      )
      return data.data as QuizAttemptResponse
    },
    enabled: !!offeringId && !!quizId && !!attemptId,
  })
}

export function useMyQuizAttempts(offeringId: number | undefined, quizId: number | undefined) {
  return useQuery<{ attempts: QuizAttempt[] }, Error>({
    queryKey: attemptsKey(offeringId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/quizzes/${quizId}/attempts`)
      return data.data as { attempts: QuizAttempt[] }
    },
    enabled: !!offeringId && !!quizId,
  })
}

export function useStartQuizAttempt(offeringId: number | undefined, quizId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<QuizAttemptResponse, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/course-offerings/${offeringId}/quizzes/${quizId}/start`)
      return data.data as QuizAttemptResponse
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        attemptKey(offeringId, quizId, response.attempt.id),
        response
      )
      queryClient.invalidateQueries({ queryKey: attemptsKey(offeringId, quizId) })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start quiz attempt.')
    },
  })
}

export function useSaveQuizAnswer(
  offeringId: number | undefined,
  quizId: number | undefined,
  attemptId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation<QuizAnswerState, Error, SaveAnswerData>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/course-offerings/${offeringId}/quizzes/${quizId}/attempts/${attemptId}/answer`,
        payload
      )
      return data.data.answer as QuizAnswerState
    },
    onSuccess: (answer) => {
      queryClient.setQueryData<QuizAttemptResponse | undefined>(
        attemptKey(offeringId, quizId, attemptId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            answers: old.answers.map((a) =>
              a.questionId === answer.questionId ? answer : a
            ),
          }
        }
      )
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save answer.')
    },
  })
}

export function useSubmitQuizAttempt(
  offeringId: number | undefined,
  quizId: number | undefined,
  attemptId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation<QuizAttemptResponse, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(
        `/course-offerings/${offeringId}/quizzes/${quizId}/attempts/${attemptId}/submit`
      )
      return data.data as QuizAttemptResponse
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        attemptKey(offeringId, quizId, attemptId),
        response
      )
      queryClient.invalidateQueries({ queryKey: attemptsKey(offeringId, quizId) })
      toast.success('Quiz submitted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit quiz.')
    },
  })
}
