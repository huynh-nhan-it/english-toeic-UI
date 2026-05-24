import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadProgress, saveProgress } from '../lib/storage'
import type { AnswerChoice, NoteKey, StudyNotes, ToeicProgressData } from '../lib/toeic'

const NOTE_SAVE_DELAY_MS = 500

function areNumberArraysEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function areNotesEqual(left: StudyNotes, right: StudyNotes): boolean {
  return (
    left.businessVocabulary === right.businessVocabulary &&
    left.grammarTraps === right.grammarTraps &&
    left.transcriptShadowing === right.transcriptShadowing &&
    left.activeShadowingLine === right.activeShadowingLine &&
    areStringArraysEqual(left.selectedGrammarTopicIds, right.selectedGrammarTopicIds) &&
    areNumberArraysEqual(left.completedShadowingLines, right.completedShadowingLines)
  )
}

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

  const updateNote = useCallback(<K extends NoteKey>(key: K, value: StudyNotes[K]) => {
    setNotesDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProgress((current) => {
        if (areNotesEqual(current.notes, notesDraft)) {
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
