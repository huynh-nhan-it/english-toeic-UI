import { StateCreator } from 'zustand'
import type { ToeicState } from '../useToeicStore'
import type { FlashcardItem } from '../../types'

export interface FlashcardSlice {
  flashcards: FlashcardItem[]
  leitnerIntervals: number[]
  geminiApiKey: string
  addFlashcard: (
    word: string,
    phonetic: string,
    definition: string,
    translation: string,
    example: string,
    audioUrl?: string
  ) => void
  updateFlashcard: (updatedCard: FlashcardItem) => void
  deleteFlashcard: (id: string) => void
  updateLeitnerIntervals: (intervals: number[]) => void
  updateGeminiApiKey: (apiKey: string) => void
}

export const createFlashcardSlice: StateCreator<ToeicState, [], [], FlashcardSlice> = (set) => ({
  flashcards: [],
  leitnerIntervals: [
    60 * 1000, // Box 1: 1 min
    10 * 60 * 1000, // Box 2: 10 min
    24 * 60 * 60 * 1000, // Box 3: 1 day
    4 * 24 * 60 * 60 * 1000, // Box 4: 4 days
    10 * 24 * 60 * 60 * 1000, // Box 5: 10 days
  ],
  geminiApiKey: '',

  addFlashcard: (
    word: string,
    phonetic: string,
    definition: string,
    translation: string,
    example: string,
    audioUrl?: string
  ) => {
    set((state) => {
      const normalizedWord = word.trim().toLowerCase()
      if (state.flashcards.some((f) => f.word.toLowerCase() === normalizedWord)) {
        return {}
      }

      const newCard: FlashcardItem = {
        id: Math.random().toString(36).substring(2, 9),
        word: word.trim(),
        phonetic,
        definition,
        translation,
        example,
        audioUrl,
        box: 1,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        starred: false,
      }

      return {
        flashcards: [...state.flashcards, newCard],
        updatedAt: new Date().toISOString(),
      }
    })
  },

  updateFlashcard: (updatedCard: FlashcardItem) => {
    set((state) => ({
      flashcards: state.flashcards.map((c) =>
        c.id === updatedCard.id ? { ...updatedCard, updatedAt: new Date().toISOString() } : c
      ),
      updatedAt: new Date().toISOString(),
    }))
  },

  deleteFlashcard: (id: string) => {
    set((state) => ({
      flashcards: state.flashcards.filter((c) => c.id !== id),
      updatedAt: new Date().toISOString(),
    }))
  },

  updateLeitnerIntervals: (intervals: number[]) => {
    set({
      leitnerIntervals: intervals,
      updatedAt: new Date().toISOString(),
    })
  },

  updateGeminiApiKey: (apiKey: string) => {
    set({
      geminiApiKey: apiKey.trim(),
      updatedAt: new Date().toISOString(),
    })
  },
})
