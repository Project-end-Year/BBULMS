import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/axios'

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
export type QuizType = 'quiz' | 'exam' | 'practice'

export interface QuestionOption {
  id?: number
  optionText: string
  isCorrect: boolean
  order: number
}

export interface Question {
  id?: number
  quizId?: number
  type: QuestionType
  prompt: string
  points: number
  order: number
  explanation?: string | null
  options: QuestionOption[]
}

export interface Quiz {
  id: number
  courseOfferingId: number
  createdBy?: { id: number; name: string; email: string } | null
  title: string
  description: string | null
  type: QuizType
  timeLimitMinutes: number | null
  attemptsAllowed: number
  shuffleQuestions: boolean
  showCorrectAnswers: boolean
  isPublished: boolean
  startsAt: string | null
  endsAt: string | null
  totalPoints: number
  passingScorePercentage: number | null
  questions: Question[]
  questionsCount?: number
  createdAt: string | null
  updatedAt: string | null
}

export interface QuizFormData {
  title: string
  description?: string
  type: QuizType
  timeLimitMinutes?: number | null
  attemptsAllowed?: number
  shuffleQuestions?: boolean
  showCorrectAnswers?: boolean
  isPublished?: boolean
  startsAt?: string | null
  endsAt?: string | null
  passingScorePercentage?: number | null
  questions?: Question[]
}

export interface QuizzesData {
  quizzes: Quiz[]
}

const quizzesKey = (offeringId: number | undefined) => ['quizzes', offeringId]
const quizKey = (offeringId: number | undefined, quizId: number | undefined) => ['quiz', offeringId, quizId]

export function useQuizzes(offeringId: number | undefined) {
  return useQuery<QuizzesData, Error>({
    queryKey: quizzesKey(offeringId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/quizzes`)
      return data.data as QuizzesData
    },
    enabled: !!offeringId,
  })
}

export function useQuiz(offeringId: number | undefined, quizId: number | undefined) {
  return useQuery<Quiz, Error>({
    queryKey: quizKey(offeringId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/quizzes/${quizId}`)
      return data.data.quiz as Quiz
    },
    enabled: !!offeringId && !!quizId,
  })
}

export function useCreateQuiz(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Quiz, Error, QuizFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/quizzes`, formData)
      return data.data.quiz as Quiz
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(offeringId) })
      toast.success('Quiz created.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create quiz.')
    },
  })
}

export function useUpdateQuiz(offeringId: number | undefined, quizId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Quiz, Error, QuizFormData>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/course-offerings/${offeringId}/quizzes/${quizId}`, formData)
      return data.data.quiz as Quiz
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(offeringId) })
      queryClient.invalidateQueries({ queryKey: quizKey(offeringId, quizId) })
      toast.success('Quiz updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update quiz.')
    },
  })
}

export function useDeleteQuiz(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (quizId) => {
      await api.delete(`/course-offerings/${offeringId}/quizzes/${quizId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(offeringId) })
      toast.success('Quiz deleted.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete quiz.')
    },
  })
}

export function useToggleQuizPublished(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<Quiz, Error, number>({
    mutationFn: async (quizId) => {
      const { data } = await api.post(`/course-offerings/${offeringId}/quizzes/${quizId}/toggle-published`)
      return data.data.quiz as Quiz
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(offeringId) })
      toast.success('Quiz publication status updated.')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update quiz status.')
    },
  })
}
