export type AnswerChoice = '' | 'A' | 'B' | 'C' | 'D'

export type StudyNotes = {
  businessVocabulary: string
  grammarTraps: string
  transcriptShadowing: string
  selectedGrammarTopicIds: string[]
  activeShadowingLine: number | null
  completedShadowingLines: number[]
}

export type NoteKey = keyof StudyNotes

export type ToeicProgressData = {
  version: 1
  answers: Record<number, AnswerChoice>
  notes: StudyNotes
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

export const PARTS: ToeicPart[] = [
  { id: 1, title: 'Part 1', range: 'Questions 1-6', start: 1, end: 6 },
  { id: 2, title: 'Part 2', range: 'Questions 7-31', start: 7, end: 31 },
  { id: 3, title: 'Part 3', range: 'Questions 32-70', start: 32, end: 70 },
  { id: 4, title: 'Part 4', range: 'Questions 71-100', start: 71, end: 100 },
  { id: 5, title: 'Part 5', range: 'Questions 101-130', start: 101, end: 130 },
  { id: 6, title: 'Part 6', range: 'Questions 131-146', start: 131, end: 146 },
  { id: 7, title: 'Part 7', range: 'Questions 147-200', start: 147, end: 200 },
].map((part) => ({
  ...part,
  questions: Array.from({ length: part.end - part.start + 1 }, (_, index) => part.start + index),
}))

export const ANSWER_CHOICES = ['A', 'B', 'C', 'D'] as const

export type ToeicGrammarTopic = {
  id: string
  label: string
  partFocus: string
}

export const TOEIC_GRAMMAR_TOPICS: ToeicGrammarTopic[] = [
  { id: 'tenses', label: 'Tenses', partFocus: 'Part 5-6' },
  { id: 'subject-verb-agreement', label: 'Subject-Verb Agreement', partFocus: 'Part 5' },
  { id: 'passive-voice', label: 'Passive Voice', partFocus: 'Part 5-6' },
  { id: 'gerund-infinitive', label: 'Gerund vs Infinitive', partFocus: 'Part 5' },
  { id: 'participles', label: 'Participles', partFocus: 'Part 5-6' },
  { id: 'relative-clauses', label: 'Relative Clauses', partFocus: 'Part 5-7' },
  { id: 'reduced-clauses', label: 'Reduced Clauses', partFocus: 'Part 5-7' },
  { id: 'conditionals', label: 'Conditionals', partFocus: 'Part 5-6' },
  { id: 'comparisons', label: 'Comparisons', partFocus: 'Part 5' },
  { id: 'prepositions', label: 'Prepositions', partFocus: 'Part 5-7' },
  { id: 'conjunctions', label: 'Conjunctions', partFocus: 'Part 5-6' },
  { id: 'word-forms', label: 'Word Forms', partFocus: 'Part 5' },
  { id: 'pronouns', label: 'Pronouns', partFocus: 'Part 5-6' },
  { id: 'articles-determiners', label: 'Articles & Determiners', partFocus: 'Part 5' },
  { id: 'quantifiers', label: 'Quantifiers', partFocus: 'Part 5-6' },
  { id: 'parallel-structure', label: 'Parallel Structure', partFocus: 'Part 5-7' },
  { id: 'inversion', label: 'Inversion', partFocus: 'Part 5' },
  { id: 'modal-verbs', label: 'Modal Verbs', partFocus: 'Part 5-6' },
  { id: 'causative-verbs', label: 'Causative Verbs', partFocus: 'Part 5' },
  { id: 'noun-clauses', label: 'Noun Clauses', partFocus: 'Part 5-7' },
  { id: 'adverb-clauses', label: 'Adverb Clauses', partFocus: 'Part 5-7' },
  { id: 'toeic-traps', label: 'Common TOEIC Traps', partFocus: 'All parts' },
]

export function createBlankAnswers(): Record<number, AnswerChoice> {
  return Object.fromEntries(
    Array.from({ length: 200 }, (_, index) => [index + 1, ''] as const),
  ) as Record<number, AnswerChoice>
}

export function createEmptyProgress(): ToeicProgressData {
  return {
    version: 1,
    answers: createBlankAnswers(),
    notes: {
      businessVocabulary: '',
      grammarTraps: '',
      transcriptShadowing: '',
      selectedGrammarTopicIds: [],
      activeShadowingLine: null,
      completedShadowingLines: [],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function isAnswerChoice(value: string): value is Exclude<AnswerChoice, ''> {
  return ANSWER_CHOICES.includes(value.toUpperCase() as Exclude<AnswerChoice, ''>)
}
