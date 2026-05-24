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

export type ToeicProgressData = {
  version: 2
  activeExamId: string
  exams: ToeicExam[]
  updatedAt: string
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

export type ToeicGrammarFormula = {
  id: string
  title: string
  formula: string
  example: string
  partFocus: string
}

export const TOEIC_GRAMMAR_FORMULAS: ToeicGrammarFormula[] = [
  {
    id: 'basic-sv',
    title: 'Basic sentence',
    formula: 'S + V',
    example: 'Sales increased last quarter.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'present-continuous',
    title: 'Action in progress',
    formula: 'S + be + V-ing',
    example: 'The staff are preparing the conference room.',
    partFocus: 'Part 1, Part 5',
  },
  {
    id: 'perfect-tense',
    title: 'Completed before now',
    formula: 'S + have/has/had + V3',
    example: 'The manager has approved the budget.',
    partFocus: 'Part 5-6',
  },
  {
    id: 'present-perfect-question',
    title: 'Perfect question',
    formula: 'Have + S + V3?',
    example: 'Have you submitted the report?',
    partFocus: 'Part 2, Part 5',
  },
  {
    id: 'passive',
    title: 'Passive voice',
    formula: 'S + be + V3',
    example: 'The shipment was delayed by heavy rain.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'passive-question',
    title: 'Passive question',
    formula: 'Be + S + V3?',
    example: 'Was the invoice sent yesterday?',
    partFocus: 'Part 2, Part 5',
  },
  {
    id: 'modal',
    title: 'Modal verb',
    formula: 'S + modal + V bare',
    example: 'Applicants must submit a resume.',
    partFocus: 'Part 5-6',
  },
  {
    id: 'causative-active',
    title: 'Causative active',
    formula: 'have/make/let + O + V bare',
    example: 'The supervisor had the assistant call the client.',
    partFocus: 'Part 5',
  },
  {
    id: 'causative-passive',
    title: 'Causative passive',
    formula: 'have/get + O + V3',
    example: 'We had the equipment repaired.',
    partFocus: 'Part 5',
  },
  {
    id: 'relative-clause',
    title: 'Relative clause',
    formula: 'N + who/which/that + V',
    example: 'The employee who handled the booking is unavailable.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'reduced-active',
    title: 'Reduced active clause',
    formula: 'N + V-ing',
    example: 'The man speaking at the podium is the CEO.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'reduced-passive',
    title: 'Reduced passive clause',
    formula: 'N + V3',
    example: 'The documents attached to the email are confidential.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'too-to',
    title: 'Too ... to',
    formula: 'too + adj/adv + to V',
    example: 'The package is too heavy to lift alone.',
    partFocus: 'Part 5',
  },
  {
    id: 'enough-to',
    title: 'Enough ... to',
    formula: 'adj/adv + enough + to V',
    example: 'The room is large enough to hold 80 guests.',
    partFocus: 'Part 5',
  },
  {
    id: 'not-only-but-also',
    title: 'Parallel connector',
    formula: 'not only + A + but also + B',
    example: 'The policy is not only clear but also practical.',
    partFocus: 'Part 5-6',
  },
  {
    id: 'either-or',
    title: 'Choice connector',
    formula: 'either + A + or + B',
    example: 'You can either email the form or submit it online.',
    partFocus: 'Part 5-6',
  },
  {
    id: 'despite',
    title: 'Contrast phrase',
    formula: 'despite/in spite of + N/V-ing',
    example: 'Despite the delay, the order arrived today.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'although',
    title: 'Contrast clause',
    formula: 'although/even though + S + V',
    example: 'Although demand increased, prices remained stable.',
    partFocus: 'Part 5-7',
  },
  {
    id: 'the-comparative',
    title: 'Double comparative',
    formula: 'the + comparative, the + comparative',
    example: 'The earlier you register, the lower the fee will be.',
    partFocus: 'Part 5',
  },
  {
    id: 'word-form',
    title: 'Word form trap',
    formula: 'article/preposition + correct word form',
    example: 'The manager gave a detailed explanation.',
    partFocus: 'Part 5',
  },
]

export const TOEIC_VOCAB_PHRASES = [
  'meet the requirements',
  'meet the qualifications',
  'meet customer expectations',
  'comply with regulations',
  'adhere to company policy',
  'submit the required documents',
  'complete the application form',
  'process an order',
  'place an order',
  'track a shipment',
  'arrange a meeting',
  'schedule an appointment',
  'reschedule a conference call',
  'confirm receipt of payment',
  'issue a refund',
  'provide a quotation',
  'request a replacement',
  'resolve a complaint',
  'conduct a survey',
  'launch a marketing campaign',
  'increase productivity',
  'reduce operating costs',
  'expand the product line',
  'review the agenda',
  'approve the budget',
  'renew a subscription',
  'sign a contract',
  'negotiate a lease',
  'prepare financial statements',
  'submit an expense report',
  'contract renewal',
  'submit an application',
  'meet a deadline',
  'make a reservation',
  'attend a conference',
  'confirm an appointment',
  'annual revenue',
  'customer satisfaction',
  'shipping delay',
  'office supplies',
  'job opening',
  'expense report',
  'business trip',
  'product launch',
  'safety regulations',
  'training session',
  'purchase order',
  'bank statement',
  'performance review',
  'maintenance request',
]

export function createBlankAnswers(): Record<number, AnswerChoice> {
  return Object.fromEntries(
    Array.from({ length: 200 }, (_, index) => [index + 1, ''] as const),
  ) as Record<number, AnswerChoice>
}

export function createEmptyProgress(): ToeicProgressData {
  const initialExam = createExam('exam-1', 'TOEIC Test 1')

  return {
    version: 2,
    activeExamId: initialExam.id,
    exams: [initialExam],
    updatedAt: new Date().toISOString(),
  }
}

export function createEmptyNotes(): StudyNotes {
  return {
    businessVocabulary: '',
    grammarTraps: '',
    transcriptShadowing: '',
    selectedGrammarFormulaIds: [],
    activeShadowingLine: null,
    completedShadowingLines: [],
  }
}

export function createExam(id: string, title: string): ToeicExam {
  const timestamp = new Date().toISOString()

  return {
    id,
    title,
    answers: createBlankAnswers(),
    notes: createEmptyNotes(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function isAnswerChoice(value: string): value is Exclude<AnswerChoice, ''> {
  return ANSWER_CHOICES.includes(value.toUpperCase() as Exclude<AnswerChoice, ''>)
}
