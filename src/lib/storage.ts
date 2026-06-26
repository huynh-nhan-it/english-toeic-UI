import {
  createEmptyNotes,
  createEmptyProgress,
  createExam,
  createBlankAnswers,
  generateStudyCode,
  type AnswerChoice,
  type StudyNotes,
  type ToeicExam,
  type ToeicProgressData,
  type FlashcardItem,
  type CloudConfig,
} from './toeic'

export const STORAGE_KEY = 'toeic-progress-v1'

// Simple encryption helper using Base64 obfuscation for local storage security
function encryptKey(key: string): string {
  if (!key) return ''
  if (key.startsWith('enc_')) return key
  try {
    return 'enc_' + btoa(unescape(encodeURIComponent(key)))
  } catch {
    return key
  }
}

function decryptKey(key: string): string {
  if (!key) return ''
  if (key.startsWith('enc_')) {
    try {
      return decodeURIComponent(escape(atob(key.substring(4))))
    } catch {
      return key
    }
  }
  return key
}

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

function normalizeFlashcard(value: unknown): FlashcardItem {
  const item = value as Partial<FlashcardItem>
  return {
    id: typeof item.id === 'string' && item.id.length > 0 ? item.id : Math.random().toString(36).substring(2, 9),
    word: typeof item.word === 'string' ? item.word : '',
    phonetic: typeof item.phonetic === 'string' ? item.phonetic : '',
    definition: typeof item.definition === 'string' ? item.definition : '',
    translation: typeof item.translation === 'string' ? item.translation : '',
    example: typeof item.example === 'string' ? item.example : '',
    audioUrl: typeof item.audioUrl === 'string' ? item.audioUrl : undefined,
    box: typeof item.box === 'number' && item.box >= 1 && item.box <= 5 ? item.box : 1,
    nextReview: typeof item.nextReview === 'string' ? item.nextReview : new Date().toISOString(),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  }
}

function normalizeCloudConfig(value: unknown): CloudConfig {
  const config = (value || {}) as Partial<CloudConfig>
  
  let user: CloudConfig['user'] = null
  if (config.user && typeof config.user === 'object') {
    const u = config.user as Record<string, unknown>
    user = {
      email: typeof u.email === 'string' ? u.email : '',
      uid: typeof u.uid === 'string' ? u.uid : '',
      idToken: typeof u.idToken === 'string' ? decryptKey(u.idToken) : '',
      refreshToken: typeof u.refreshToken === 'string' ? decryptKey(u.refreshToken) : '',
      expiresAt: typeof u.expiresAt === 'number' ? u.expiresAt : 0,
    }
  }

  return {
    projectId: typeof config.projectId === 'string' && config.projectId.length > 0 ? config.projectId : 'toeic-progress-web',
    apiKey: typeof config.apiKey === 'string' ? decryptKey(config.apiKey) : '',
    enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
    user: user && user.email && user.uid ? user : null,
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

export function loadProgress(): ToeicProgressData {
  const emptyProgress = createEmptyProgress()
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return emptyProgress
  }

  try {
    const parsed = JSON.parse(raw) as {
      version?: number
      activeExamId?: unknown
      exams?: unknown
      flashcards?: unknown
      cloudConfig?: unknown
      answers?: unknown
      notes?: unknown
      syncConfig?: unknown
      updatedAt?: string
    }

    let exams: ToeicExam[] = []
    let activeExamId = ''
    let flashcards: FlashcardItem[] = []
    let cloudConfig: CloudConfig = emptyProgress.cloudConfig

    if (parsed.version === 5 && Array.isArray(parsed.exams)) {
      exams = parsed.exams.map((exam, index) => normalizeExam(exam, index + 1))
      activeExamId = typeof parsed.activeExamId === 'string' ? parsed.activeExamId : ''
      flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards.map(normalizeFlashcard) : []
      cloudConfig = normalizeCloudConfig(parsed.cloudConfig)
    } else if (parsed.version === 4 && Array.isArray(parsed.exams)) {
      exams = parsed.exams.map((exam, index) => normalizeExam(exam, index + 1))
      activeExamId = typeof parsed.activeExamId === 'string' ? parsed.activeExamId : ''
      flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards.map(normalizeFlashcard) : []
      cloudConfig = emptyProgress.cloudConfig
    } else if (parsed.version === 3 && Array.isArray(parsed.exams)) {
      exams = parsed.exams.map((exam, index) => normalizeExam(exam, index + 1))
      activeExamId = typeof parsed.activeExamId === 'string' ? parsed.activeExamId : ''
      flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards.map(normalizeFlashcard) : []
      cloudConfig = emptyProgress.cloudConfig
    } else if (parsed.version === 2 && Array.isArray(parsed.exams)) {
      exams = parsed.exams.map((exam, index) => normalizeExam(exam, index + 1))
      activeExamId = typeof parsed.activeExamId === 'string' ? parsed.activeExamId : ''
      flashcards = []
      cloudConfig = emptyProgress.cloudConfig
    } else {
      const migratedExam = {
        ...createExam('exam-1', 'TOEIC Test 1'),
        answers: normalizeAnswers(parsed.answers),
        notes: normalizeNotes(parsed.notes),
        updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
      }
      exams = [migratedExam]
      activeExamId = migratedExam.id
      flashcards = []
      cloudConfig = emptyProgress.cloudConfig
    }

    const safeExams = exams.length > 0 ? exams : emptyProgress.exams
    const safeActiveExamId = safeExams.some((exam) => exam.id === activeExamId)
      ? activeExamId
      : safeExams[0].id

    return {
      version: 5,
      activeExamId: safeActiveExamId,
      exams: safeExams,
      flashcards,
      cloudConfig,
      updatedAt: parsed.updatedAt ?? emptyProgress.updatedAt,
      leitnerIntervals: Array.isArray((parsed as any).leitnerIntervals) ? (parsed as any).leitnerIntervals : undefined,
      geminiApiKey: typeof (parsed as any).geminiApiKey === 'string' ? decryptKey((parsed as any).geminiApiKey) : undefined,
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

  // Create a copy with encrypted sensitive fields for localStorage
  const storageProgress = {
    ...nextProgress,
    geminiApiKey: nextProgress.geminiApiKey ? encryptKey(nextProgress.geminiApiKey) : undefined,
    cloudConfig: {
      ...nextProgress.cloudConfig,
      apiKey: nextProgress.cloudConfig.apiKey ? encryptKey(nextProgress.cloudConfig.apiKey) : '',
      user: nextProgress.cloudConfig.user ? {
        ...nextProgress.cloudConfig.user,
        idToken: nextProgress.cloudConfig.user.idToken ? encryptKey(nextProgress.cloudConfig.user.idToken) : '',
        refreshToken: nextProgress.cloudConfig.user.refreshToken ? encryptKey(nextProgress.cloudConfig.user.refreshToken) : '',
      } : null
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProgress))
  return nextProgress
}

export function getBackupFilename(date = new Date()): string {
  return `toeic-progress-backup-${date.toISOString().slice(0, 10)}.json`
}
