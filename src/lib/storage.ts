import { createEmptyProgress, type AnswerChoice, type StudyNotes, type ToeicProgressData } from './toeic'

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
      notes: normalizeNotes(parsed.notes, emptyProgress.notes),
      updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
    }
  } catch {
    return emptyProgress
  }
}

function normalizeNotes(value: unknown, fallback: StudyNotes): StudyNotes {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const notes = value as Partial<StudyNotes>

  return {
    businessVocabulary: typeof notes.businessVocabulary === 'string' ? notes.businessVocabulary : '',
    grammarTraps: typeof notes.grammarTraps === 'string' ? notes.grammarTraps : '',
    transcriptShadowing: typeof notes.transcriptShadowing === 'string' ? notes.transcriptShadowing : '',
    selectedGrammarTopicIds: Array.isArray(notes.selectedGrammarTopicIds)
      ? notes.selectedGrammarTopicIds.filter((id): id is string => typeof id === 'string')
      : [],
    activeShadowingLine:
      typeof notes.activeShadowingLine === 'number' && Number.isInteger(notes.activeShadowingLine)
        ? notes.activeShadowingLine
        : null,
    completedShadowingLines: Array.isArray(notes.completedShadowingLines)
      ? notes.completedShadowingLines.filter((line): line is number => Number.isInteger(line))
      : [],
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
