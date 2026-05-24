import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadProgress, saveProgress } from '../lib/storage'
import {
  createExam,
  type AnswerChoice,
  type NoteKey,
  type StudyNotes,
  type ToeicExam,
  type ToeicProgressData,
} from '../lib/toeic'

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
    areStringArraysEqual(left.selectedGrammarFormulaIds, right.selectedGrammarFormulaIds) &&
    areNumberArraysEqual(left.completedShadowingLines, right.completedShadowingLines)
  )
}

function replaceActiveExam(progress: ToeicProgressData, updater: (exam: ToeicExam) => ToeicExam): ToeicProgressData {
  return {
    ...progress,
    exams: progress.exams.map((exam) =>
      exam.id === progress.activeExamId ? { ...updater(exam), updatedAt: new Date().toISOString() } : exam,
    ),
  }
}

function getActiveExam(progress: ToeicProgressData): ToeicExam {
  return progress.exams.find((exam) => exam.id === progress.activeExamId) ?? progress.exams[0]
}

export function useToeicProgress() {
  const [progress, setProgress] = useState<ToeicProgressData>(() => loadProgress())
  const activeExam = getActiveExam(progress)
  const [notesDraft, setNotesDraft] = useState(() => activeExam.notes)

  useEffect(() => {
    // Keep the draft editor synchronized when the active exam changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotesDraft(activeExam.notes)
  }, [activeExam.id, activeExam.notes])

  const updateAnswer = useCallback((questionNumber: number, answer: AnswerChoice) => {
    setProgress((current) =>
      saveProgress(
        replaceActiveExam(current, (exam) => ({
          ...exam,
          answers: {
            ...exam.answers,
            [questionNumber]: answer,
          },
        })),
      ),
    )
  }, [])

  const updateNote = useCallback(<K extends NoteKey>(key: K, value: StudyNotes[K]) => {
    setNotesDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const selectExam = useCallback((examId: string) => {
    setProgress((current) => {
      if (!current.exams.some((exam) => exam.id === examId)) {
        return current
      }

      return saveProgress({
        ...current,
        activeExamId: examId,
      })
    })
  }, [])

  const createNewExam = useCallback(() => {
    setProgress((current) => {
      const nextNumber = current.exams.length + 1
      const nextExam = createExam(`exam-${nextNumber}`, `TOEIC Test ${nextNumber}`)

      return saveProgress({
        ...current,
        activeExamId: nextExam.id,
        exams: [...current.exams, nextExam],
      })
    })
  }, [])

  const renameActiveExam = useCallback((title: string) => {
    setProgress((current) =>
      saveProgress(
        replaceActiveExam(current, (exam) => ({
          ...exam,
          title,
        })),
      ),
    )
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProgress((current) =>
        saveProgress(
          replaceActiveExam(current, (exam) => {
            if (exam.id !== current.activeExamId || areNotesEqual(exam.notes, notesDraft)) {
              return exam
            }

            return {
              ...exam,
              notes: notesDraft,
            }
          }),
        ),
      )
    }, NOTE_SAVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [notesDraft])

  const latestActiveExam = getActiveExam(progress)

  return useMemo(
    () => ({
      activeExam: latestActiveExam,
      createNewExam,
      exams: progress.exams,
      notesDraft,
      progress,
      renameActiveExam,
      selectExam,
      updateAnswer,
      updateNote,
    }),
    [
      createNewExam,
      latestActiveExam,
      notesDraft,
      progress,
      renameActiveExam,
      selectExam,
      updateAnswer,
      updateNote,
    ],
  )
}
