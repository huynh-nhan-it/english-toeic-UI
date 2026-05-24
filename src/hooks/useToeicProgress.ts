import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadProgress, saveProgress } from '../lib/storage'
import type { AnswerChoice, NoteKey, ToeicProgressData } from '../lib/toeic'

const NOTE_SAVE_DELAY_MS = 500

export function useToeicProgress() {
  const [progress, setProgress] = useState<ToeicProgressData>(() => loadProgress())
  const [notesDraft, setNotesDraft] = useState(() => progress.notes)

  const updateAnswer = useCallback((questionNumber: number, answer: AnswerChoice) => {
    setProgress((current) =>
      saveProgress({
        ...current,
        answers: {
          ...current.answers,
          [questionNumber]: answer,
        },
      }),
    )
  }, [])

  const updateNote = useCallback((key: NoteKey, value: string) => {
    setNotesDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProgress((current) => {
        if (
          current.notes.businessVocabulary === notesDraft.businessVocabulary &&
          current.notes.grammarTraps === notesDraft.grammarTraps &&
          current.notes.transcriptShadowing === notesDraft.transcriptShadowing
        ) {
          return current
        }

        return saveProgress({
          ...current,
          notes: notesDraft,
        })
      })
    }, NOTE_SAVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [notesDraft])

  return useMemo(
    () => ({
      progress,
      notesDraft,
      updateAnswer,
      updateNote,
    }),
    [notesDraft, progress, updateAnswer, updateNote],
  )
}
