import { StateCreator } from 'zustand'
import type { ToeicState } from '../useToeicStore'
import type { AnswerChoice, ToeicExam } from '../../types'
import { createExam } from '../../lib/toeic'

export interface ExamSlice {
  activeExamId: string
  exams: ToeicExam[]
  selectExam: (id: string) => void
  createNewExam: () => void
  renameActiveExam: (title: string) => void
  updateAnswer: (questionNumber: number, answer: AnswerChoice) => void
}

export const createExamSlice: StateCreator<ToeicState, [["zustand/persist", unknown]], [], ExamSlice> = (set) => ({
  activeExamId: 'exam-1',
  exams: [createExam('exam-1', 'TOEIC Test 1')],

  selectExam: (examId: string) => {
    set((state) => {
      if (!state.exams.some((exam) => exam.id === examId)) {
        return {}
      }
      return {
        activeExamId: examId,
        updatedAt: new Date().toISOString(),
      }
    })
  },

  createNewExam: () => {
    set((state) => {
      const nextNumber = state.exams.length + 1
      const nextExam = createExam(`exam-${nextNumber}`, `TOEIC Test ${nextNumber}`)
      return {
        activeExamId: nextExam.id,
        exams: [...state.exams, nextExam],
        updatedAt: new Date().toISOString(),
      }
    })
  },

  renameActiveExam: (title: string) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === state.activeExamId
          ? { ...exam, title, updatedAt: new Date().toISOString() }
          : exam
      ),
      updatedAt: new Date().toISOString(),
    }))
  },

  updateAnswer: (questionNumber: number, answer: AnswerChoice) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === state.activeExamId
          ? {
              ...exam,
              answers: { ...exam.answers, [questionNumber]: answer },
              updatedAt: new Date().toISOString(),
            }
          : exam
      ),
      updatedAt: new Date().toISOString(),
    }))
  },
})
