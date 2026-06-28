import { StateCreator } from 'zustand'
import type { ToeicState } from '../useToeicStore'
import type { StudyNotes } from '../../types'

export interface NotebookSlice {
  updateActiveExamNotes: (notes: StudyNotes) => void
}

export const createNotebookSlice: StateCreator<ToeicState, [], [], NotebookSlice> = (set) => ({
  updateActiveExamNotes: (notes: StudyNotes) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === state.activeExamId
          ? {
              ...exam,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : exam
      ),
      updatedAt: new Date().toISOString(),
    }))
  },
})
