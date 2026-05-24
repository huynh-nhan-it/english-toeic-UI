import { createEmptyProgress, type AnswerChoice, type ToeicProgressData } from './toeic'

export const STORAGE_KEY = 'toeic-progress-v1'

function normalizeAnswers(value: unknown): Record<number, AnswerChoice> {
  const base = createEmptyProgress().answers

  if (!value || typeof value !== 'object') {
    return base
  }

  for (const [key, answer] of Object.entries(value)) {
    const questionNumber = Number(key)
    if (
      Number.isInteger(questionNumber) &&
      questionNumber >= 1 &&
      questionNumber <= 200 &&
      (answer === '' || answer === 'A' || answer === 'B' || answer === 'C' || answer === 'D')
    ) {
      base[questionNumber] = answer
    }
  }

  return base
}

export function loadProgress(): ToeicProgressData {
  const emptyProgress = createEmptyProgress()
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return emptyProgress
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ToeicProgressData>

    return {
      version: 1,
      answers: normalizeAnswers(parsed.answers),
      notes: {
        businessVocabulary: parsed.notes?.businessVocabulary ?? '',
        grammarTraps: parsed.notes?.grammarTraps ?? '',
        transcriptShadowing: parsed.notes?.transcriptShadowing ?? '',
      },
      updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
    }
  } catch {
    return emptyProgress
  }
}

export function saveProgress(progress: ToeicProgressData): ToeicProgressData {
  const nextProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress))
  return nextProgress
}

export function getBackupFilename(date = new Date()): string {
  return `toeic-progress-backup-${date.toISOString().slice(0, 10)}.json`
}
