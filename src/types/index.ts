export type AnswerChoice = '' | 'A' | 'B' | 'C' | 'D'

export type StudyNotes = {
  businessVocabulary: string
  grammarTraps: string
  transcriptShadowing: string
  selectedGrammarFormulaIds: string[]
  activeShadowingLine: number | null
  completedShadowingLines: number[]
}

export type NoteKey = keyof StudyNotes

export type FlashcardItem = {
  id: string
  word: string
  phonetic: string
  definition: string
  translation: string
  example: string
  audioUrl?: string
  box: number // 1 to 5 (Leitner boxes)
  nextReview: string // ISO string timestamp
  createdAt: string
  updatedAt: string
  starred?: boolean
}

export type CloudConfig = {
  projectId: string
  apiKey: string
  googleClientId?: string
  enabled: boolean
  user: {
    email: string
    uid: string
    idToken: string
    refreshToken: string
    expiresAt: number // Timestamp when ID token expires
  } | null
}

export type ToeicProgressData = {
  version: 5
  activeExamId: string
  exams: ToeicExam[]
  flashcards: FlashcardItem[]
  cloudConfig: CloudConfig
  updatedAt: string
  leitnerIntervals?: number[]
  geminiApiKey?: string
}

export type ToeicExam = {
  id: string
  title: string
  answers: Record<number, AnswerChoice>
  notes: StudyNotes
  createdAt: string
  updatedAt: string
}

export type ToeicPart = {
  id: number
  title: string
  range: string
  start: number
  end: number
  questions: number[]
}

export type ToeicGrammarFormula = {
  id: string
  title: string
  formula: string
  example: string
  partFocus: string
  structure?: string
  explanation?: string
  quiz?: {
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }
}

export type ToeicCollocation = {
  phrase: string
  translation: string
  category:
    | 'Operations'
    | 'Finance'
    | 'Legal'
    | 'HR'
    | 'Marketing'
    | 'Sales'
    | 'Customer Service'
    | 'Strategy'
    | 'Logistics'
    | 'IT & Tech'
    | 'Meetings'
    | 'Travel'
    | 'Purchasing'
    | 'Online Search' // Added for online collocations integration
  example: string
  exampleTranslation: string
}

export type VocabularySuggestion = {
  word: string
}

export type SynonymDetail = {
  word: string
  translation?: string
  example?: string
}

export type DictionaryDetails = {
  word: string
  phonetic: string
  definition: string
  translation: string
  synonyms: SynonymDetail[]
  example: string
  audioUrl?: string
}
