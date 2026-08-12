import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/axios'
import { type QuizAttempt } from '@/hooks/useQuizAttempts'

export interface QuizResultStats {
  totalAttempts: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  passingCount: number
  passingScorePercentage: number | null
}

export interface HistogramBin {
  label: string
  count: number
}

export interface QuestionStat {
  questionId: number
  prompt: string
  correctCount: number
  answeredCount: number
  correctRate: number
}

export interface QuizResultsData {
  stats: QuizResultStats
  histogram: HistogramBin[]
  questionStats: QuestionStat[]
  attempts: QuizAttempt[]
}

const quizResultsKey = (offeringId: number | undefined, quizId: number | undefined) => [
  'quiz-results',
  offeringId,
  quizId,
]

export function useQuizResults(offeringId: number | undefined, quizId: number | undefined) {
  return useQuery<QuizResultsData, Error>({
    queryKey: quizResultsKey(offeringId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/quizzes/${quizId}/results`)
      return data.data as QuizResultsData
    },
    enabled: !!offeringId && !!quizId,
  })
}
