import {
  createEmptyNotes,
  createEmptyProgress,
  createExam,
  createBlankAnswers,
  type AnswerChoice,
  type StudyNotes,
  type ToeicExam,
  type ToeicProgressData,
} from './toeic'

export const STORAGE_KEY = 'toeic-progress-v1'

function normalizeAnswers(value: unknown): Record<number, AnswerChoice> {
  const base = createBlankAnswers()

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
    const parsed = JSON.parse(raw) as Partial<ToeicProgressData> & {
      answers?: unknown
      notes?: unknown
    }

    if (parsed.version !== 2 || !Array.isArray(parsed.exams)) {
      const migratedExam = {
        ...createExam('exam-1', 'TOEIC Test 1'),
        answers: normalizeAnswers(parsed.answers),
        notes: normalizeNotes(parsed.notes),
        updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
      }

      return {
        version: 2,
        activeExamId: migratedExam.id,
        exams: [migratedExam],
        updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
      }
    }

    const exams = parsed.exams.map((exam, index) => normalizeExam(exam, index + 1))
    const safeExams = exams.length > 0 ? exams : emptyProgress.exams
    const activeExamId =
      typeof parsed.activeExamId === 'string' && safeExams.some((exam) => exam.id === parsed.activeExamId)
        ? parsed.activeExamId
        : safeExams[0].id

    return {
      version: 2,
      activeExamId,
      exams: safeExams,
      updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
    }
  } catch {
    return emptyProgress
  }
}

function normalizeExam(value: unknown, fallbackIndex: number): ToeicExam {
  const fallback = createExam(`exam-${fallbackIndex}`, `TOEIC Test ${fallbackIndex}`)

  if (!value || typeof value !== 'object') {
    return fallback
  }

  const exam = value as Partial<ToeicExam>

  return {
    id: typeof exam.id === 'string' && exam.id.length > 0 ? exam.id : fallback.id,
    title: typeof exam.title === 'string' && exam.title.trim().length > 0 ? exam.title : fallback.title,
    answers: normalizeAnswers(exam.answers),
    notes: normalizeNotes(exam.notes),
    createdAt: typeof exam.createdAt === 'string' ? exam.createdAt : fallback.createdAt,
    updatedAt: typeof exam.updatedAt === 'string' ? exam.updatedAt : fallback.updatedAt,
  }
}

function normalizeNotes(value: unknown): StudyNotes {
  const fallback = createEmptyNotes()

  if (!value || typeof value !== 'object') {
    return fallback
  }

  const notes = value as Partial<StudyNotes> & { selectedGrammarTopicIds?: unknown }
  const selectedGrammarFormulaIds = Array.isArray(notes.selectedGrammarFormulaIds)
    ? notes.selectedGrammarFormulaIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(notes.selectedGrammarTopicIds)
      ? notes.selectedGrammarTopicIds.filter((id): id is string => typeof id === 'string')
      : []

  return {
    businessVocabulary: typeof notes.businessVocabulary === 'string' ? notes.businessVocabulary : '',
    grammarTraps: typeof notes.grammarTraps === 'string' ? notes.grammarTraps : '',
    transcriptShadowing: typeof notes.transcriptShadowing === 'string' ? notes.transcriptShadowing : '',
    selectedGrammarFormulaIds,
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
