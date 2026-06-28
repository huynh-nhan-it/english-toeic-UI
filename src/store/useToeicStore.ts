import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { createExamSlice, type ExamSlice } from './slices/examSlice'
import { createFlashcardSlice, type FlashcardSlice } from './slices/flashcardSlice'
import { createNotebookSlice, type NotebookSlice } from './slices/notebookSlice'
import { createCloudSlice, type CloudSlice } from './slices/cloudSlice'
import { createToastSlice, type ToastSlice } from './slices/toastSlice'
import { loadProgress, saveProgress } from '../lib/storage'
import { resolveCloudConfig, resolveGeminiApiKey } from '../lib/env'
import type { ToeicProgressData } from '../types'

export interface ToeicState extends ExamSlice, FlashcardSlice, NotebookSlice, CloudSlice, ToastSlice {
  version: 5
  updatedAt: string
  rehydrate: () => void
}

function getProgressData(state: ToeicState): ToeicProgressData {
  return {
    version: 5,
    activeExamId: state.activeExamId,
    exams: state.exams,
    flashcards: state.flashcards,
    cloudConfig: state.cloudConfig,
    updatedAt: state.updatedAt,
    leitnerIntervals: state.leitnerIntervals,
    geminiApiKey: state.geminiApiKey,
  }
}

export const useToeicStore = create<ToeicState>()((set, get, store) => {
  const initialProgress = loadProgress()

  return {
    ...initialProgress,
    ...createExamSlice(set, get, store),
    ...createFlashcardSlice(set, get, store),
    ...createNotebookSlice(set, get, store),
    ...createCloudSlice(set, get, store),
    ...createToastSlice(set, get, store),
    rehydrate: () => {
      const progress = loadProgress()
      set({
        activeExamId: progress.activeExamId,
        exams: progress.exams,
        flashcards: progress.flashcards,
        cloudConfig: progress.cloudConfig,
        updatedAt: progress.updatedAt,
        leitnerIntervals: progress.leitnerIntervals,
        geminiApiKey: progress.geminiApiKey,
      })
    },
  }
})


// Selective debouncing:
// - Save immediately for structural changes (active exam, exam list, answers, flashcards, cloud config, api keys, selected grammar formulas, shadowing lines, etc.).
// - Debounce by 500ms only for typing changes in text area notes (businessVocabulary, grammarTraps, transcriptShadowing).
let prevState = useToeicStore.getState()
let saveTimeout: ReturnType<typeof setTimeout> | null = null

useToeicStore.subscribe((state) => {
  const prevData = getProgressData(prevState)
  const nextData = getProgressData(state)

  // Determine if only the text notes changed
  let onlyTextNotesChanged = true

  if (prevData.version !== nextData.version) {
    onlyTextNotesChanged = false
  } else if (prevData.activeExamId !== nextData.activeExamId) {
    onlyTextNotesChanged = false
  } else if (prevData.geminiApiKey !== nextData.geminiApiKey) {
    onlyTextNotesChanged = false
  } else if (JSON.stringify(prevData.leitnerIntervals) !== JSON.stringify(nextData.leitnerIntervals)) {
    onlyTextNotesChanged = false
  } else if (JSON.stringify(prevData.flashcards) !== JSON.stringify(nextData.flashcards)) {
    onlyTextNotesChanged = false
  } else if (JSON.stringify(prevData.cloudConfig) !== JSON.stringify(nextData.cloudConfig)) {
    onlyTextNotesChanged = false
  } else if (prevData.exams.length !== nextData.exams.length) {
    onlyTextNotesChanged = false
  } else {
    // Compare each exam's non-text-note fields
    for (let i = 0; i < prevData.exams.length; i++) {
      const prevExam = prevData.exams[i]
      const nextExam = nextData.exams[i]

      if (
        prevExam.id !== nextExam.id ||
        prevExam.title !== nextExam.title ||
        JSON.stringify(prevExam.answers) !== JSON.stringify(nextExam.answers) ||
        JSON.stringify(prevExam.notes.selectedGrammarFormulaIds) !== JSON.stringify(nextExam.notes.selectedGrammarFormulaIds) ||
        prevExam.notes.activeShadowingLine !== nextExam.notes.activeShadowingLine ||
        JSON.stringify(prevExam.notes.completedShadowingLines) !== JSON.stringify(nextExam.notes.completedShadowingLines)
      ) {
        onlyTextNotesChanged = false
        break
      }
    }
  }

  if (onlyTextNotesChanged) {
    // Debounce typing changes (notes text areas)
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveProgress(nextData)
    }, 300)
  } else {
    // Save structural changes immediately
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveProgress(nextData)
  }

  prevState = state
})



// Selectors for convenience & render optimization
export const useActiveExam = () => useToeicStore((state) => {
  return state.exams.find((exam) => exam.id === state.activeExamId) ?? state.exams[0]
})

export const useResolvedCloudConfig = () =>
  useToeicStore(useShallow((state) => resolveCloudConfig(state.cloudConfig)))

export const useResolvedGeminiApiKey = () => useToeicStore((state) => resolveGeminiApiKey(state.geminiApiKey))
