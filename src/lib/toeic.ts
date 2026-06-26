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
  structure?: string
  explanation?: string
  quiz?: {
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }
}

export const TOEIC_GRAMMAR_FORMULAS: ToeicGrammarFormula[] = [
  {
    id: 'basic-sv',
    title: 'Basic sentence',
    formula: 'S + V',
    example: 'Sales increased last quarter.',
    partFocus: 'Part 5-7',
    structure: 'Chủ ngữ (Subject) + Động từ (Verb)',
    explanation: 'Cấu trúc câu cơ bản nhất yêu cầu chủ ngữ và động từ chính chia theo thì và hòa hợp số ít/nhiều.',
    quiz: {
      question: "Our corporate profits _____ significantly last month.",
      options: ["grew", "growing", "growth", "grower"],
      correctAnswer: "grew",
      explanation: "Cần động từ chính chia thì quá khứ đơn (last month) để tạo thành cấu trúc S + V."
    }
  },
  {
    id: 'present-continuous',
    title: 'Action in progress',
    formula: 'S + be + V-ing',
    example: 'The staff are preparing the conference room.',
    partFocus: 'Part 1, Part 5',
    structure: 'Chủ ngữ (S) + is/are/am + V-ing',
    explanation: 'Diễn tả một hành động đang diễn ra tại thời điểm nói. Trong Part 1 thường dùng mô tả tranh vẽ.',
    quiz: {
      question: "The technician is _____ the photocopying machine in the lobby.",
      options: ["repaired", "repairing", "repair", "repairs"],
      correctAnswer: "repairing",
      explanation: "Cấu trúc hiện tại tiếp diễn: is/are + V-ing (is repairing)."
    }
  },
  {
    id: 'perfect-tense',
    title: 'Completed before now',
    formula: 'S + have/has/had + V3',
    example: 'The manager has approved the budget.',
    partFocus: 'Part 5-6',
    structure: 'Chủ ngữ (S) + have/has + V3/V-ed',
    explanation: 'Thì hiện tại hoàn thành diễn tả hành động đã hoàn thành tính đến thời điểm hiện tại hoặc có kết quả liên quan.',
    quiz: {
      question: "The Board of Directors _____ already approved the new budget proposal.",
      options: ["has", "have", "having", "was"],
      correctAnswer: "has",
      explanation: "'The Board' là danh từ tập hợp số ít, đi kèm trợ động từ 'has' + V3/V-ed (approved)."
    }
  },
  {
    id: 'present-perfect-question',
    title: 'Perfect question',
    formula: 'Have + S + V3?',
    example: 'Have you submitted the report?',
    partFocus: 'Part 2, Part 5',
    structure: 'Have/Has + Chủ ngữ (S) + V3/V-ed?',
    explanation: 'Câu hỏi nghi vấn của thì hiện tại hoàn thành, rất phổ biến ở Part 2 đối thoại.',
    quiz: {
      question: "_____ you received the updated shipping schedule yet?",
      options: ["Has", "Have", "Did", "Are"],
      correctAnswer: "Have",
      explanation: "Chủ ngữ 'you' đi với trợ động từ 'Have' trong câu hỏi hoàn thành."
    }
  },
  {
    id: 'passive',
    title: 'Passive voice',
    formula: 'S + be + V3',
    example: 'The shipment was delayed by heavy rain.',
    partFocus: 'Part 5-7',
    structure: 'Chủ ngữ (S) + be (chia theo thì) + V3/V-ed (+ by O)',
    explanation: 'Nhấn mạnh vào đối tượng chịu tác động của hành động thay vì người thực hiện hành động.',
    quiz: {
      question: "The annual marketing plan must _____ by the department head before Friday.",
      options: ["be approved", "approving", "approve", "approved"],
      correctAnswer: "be approved",
      explanation: "Bị động sau động từ khuyết thiếu: must + be + V3/V-ed (must be approved)."
    }
  },
  {
    id: 'passive-question',
    title: 'Passive question',
    formula: 'Be + S + V3?',
    example: 'Was the invoice sent yesterday?',
    partFocus: 'Part 2, Part 5',
    structure: 'Is/Are/Was/Were + Chủ ngữ (S) + V3/V-ed?',
    explanation: 'Dạng câu hỏi bị động để xác nhận một sự việc đã được tác động hay chưa.',
    quiz: {
      question: "_____ the promotional leaflets printed last week?",
      options: ["Were", "Was", "Did", "Have"],
      correctAnswer: "Were",
      explanation: "Chủ ngữ số nhiều 'leaflets' ở quá khứ cần đi với 'Were' trong câu hỏi bị động."
    }
  },
  {
    id: 'modal',
    title: 'Modal verb',
    formula: 'S + modal + V bare',
    example: 'Applicants must submit a resume.',
    partFocus: 'Part 5-6',
    structure: 'Chủ ngữ (S) + can/must/should/will + Động từ nguyên thể (V-bare)',
    explanation: 'Động từ khuyết thiếu luôn đi kèm động từ nguyên thể không chia.',
    quiz: {
      question: "All project team members should _____ the seminar tomorrow.",
      options: ["attend", "attending", "attended", "attends"],
      correctAnswer: "attend",
      explanation: "Sau động từ khuyết thiếu 'should' là động từ nguyên thể (attend)."
    }
  },
  {
    id: 'causative-active',
    title: 'Causative active',
    formula: 'have/make/let + O + V bare',
    example: 'The supervisor had the assistant call the client.',
    partFocus: 'Part 5',
    structure: 'Chủ ngữ + have/make/let + Người + V nguyên thể',
    explanation: 'Cấu trúc nhờ vả / bắt buộc / cho phép ai làm gì ở thể chủ động.',
    quiz: {
      question: "The supervisor made the team _____ overtime to complete the application.",
      options: ["work", "working", "to work", "worked"],
      correctAnswer: "work",
      explanation: "Cấu trúc causative chủ động với make: make + O + V-bare (made the team work)."
    }
  },
  {
    id: 'causative-passive',
    title: 'Causative passive',
    formula: 'have/get + O + V3',
    example: 'We had the equipment repaired.',
    partFocus: 'Part 5',
    structure: 'Chủ ngữ + have/get + Vật + V3/V-ed',
    explanation: 'Cấu trúc nhờ vả / thuê làm gì đối với đồ vật (mang tính bị động).',
    quiz: {
      question: "We should get our computer systems _____ before the software upgrade.",
      options: ["checked", "checking", "check", "to check"],
      correctAnswer: "checked",
      explanation: "Cấu trúc causative bị động: get + vật + V3/V-ed (get our computer systems checked)."
    }
  },
  {
    id: 'relative-clause',
    title: 'Relative clause',
    formula: 'N + who/which/that + V',
    example: 'The employee who handled the booking is unavailable.',
    partFocus: 'Part 5-7',
    structure: 'Danh từ + Đại từ quan hệ (who/which/that) + Động từ (V)',
    explanation: 'Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước nó.',
    quiz: {
      question: "The representative _____ designed this website has received an award.",
      options: ["who", "which", "whom", "whose"],
      correctAnswer: "who",
      explanation: "Dùng 'who' làm chủ ngữ thay thế cho danh từ chỉ người 'representative'."
    }
  },
  {
    id: 'reduced-active',
    title: 'Reduced active clause',
    formula: 'N + V-ing',
    example: 'The man speaking at the podium is the CEO.',
    partFocus: 'Part 5-7',
    structure: 'Danh từ + V-ing + (Tân ngữ)',
    explanation: 'Rút gọn mệnh đề quan hệ chủ động bằng cách lược bỏ đại từ quan hệ và be, chuyển động từ sang dạng V-ing.',
    quiz: {
      question: "The policy _____ to employee benefits will take effect next month.",
      options: ["relating", "related", "relate", "relates"],
      correctAnswer: "relating",
      explanation: "Rút gọn mệnh đề chủ động: 'The policy which relates...' rút gọn thành 'relating'."
    }
  },
  {
    id: 'reduced-passive',
    title: 'Reduced passive clause',
    formula: 'N + V3',
    example: 'The documents attached to the email are confidential.',
    partFocus: 'Part 5-7',
    structure: 'Danh từ + V3/V-ed',
    explanation: 'Rút gọn mệnh đề quan hệ bị động bằng cách lược bỏ đại từ và be, chỉ giữ lại phân từ hai (V3/V-ed).',
    quiz: {
      question: "Any items _____ after the store closes will be processed tomorrow.",
      options: ["ordered", "ordering", "order", "orders"],
      correctAnswer: "ordered",
      explanation: "Rút gọn mệnh đề quan hệ bị động: 'Any items which are ordered' rút thành 'ordered'."
    }
  },
  {
    id: 'too-to',
    title: 'Too ... to',
    formula: 'too + adj/adv + to V',
    example: 'The package is too heavy to lift alone.',
    partFocus: 'Part 5',
    structure: 'too + Tính từ / Trạng từ + to + V- nguyên thể',
    explanation: 'Diễn tả tính chất quá mức để làm một việc gì đó (quá... không thể...).',
    quiz: {
      question: "The training session was too short for us _____ all features.",
      options: ["to master", "mastering", "master", "mastered"],
      correctAnswer: "to master",
      explanation: "Cấu trúc too + adj + (for O) + to V (too short... to master)."
    }
  },
  {
    id: 'enough-to',
    title: 'Enough ... to',
    formula: 'adj/adv + enough + to V',
    example: 'The room is large enough to hold 80 guests.',
    partFocus: 'Part 5',
    structure: 'Tính từ / Trạng từ + enough + to + V-nguyên thể',
    explanation: 'Diễn tả có đủ tính chất để thực hiện một hành động nào đó.',
    quiz: {
      question: "The applicant is qualified enough _____ the lead developer role.",
      options: ["to assume", "assuming", "assume", "assumed"],
      correctAnswer: "to assume",
      explanation: "Cấu trúc adj + enough + to V (qualified enough to assume)."
    }
  },
  {
    id: 'not-only-but-also',
    title: 'Parallel connector',
    formula: 'not only + A + but also + B',
    example: 'The policy is not only clear but also practical.',
    partFocus: 'Part 5-6',
    structure: 'not only + Cụm từ loại A + but also + Cụm từ loại B',
    explanation: 'Liên từ tương hợp yêu cầu A và B phải song hành (cùng từ loại, cùng cấu trúc).',
    quiz: {
      question: "The program is not only cost-effective but also extremely _____.",
      options: ["efficient", "efficiency", "efficiently", "efficiencies"],
      correctAnswer: "efficient",
      explanation: "Cần một tính từ song hành với 'cost-effective' sau liên từ (but also efficient)."
    }
  },
  {
    id: 'either-or',
    title: 'Choice connector',
    formula: 'either + A + or + B',
    example: 'You can either email the form or submit it online.',
    partFocus: 'Part 5-6',
    structure: 'either + A + or + B',
    explanation: 'Chọn một trong hai đối tượng song hành A hoặc B.',
    quiz: {
      question: "You may choose either to attend the seminar _____ to review the notes.",
      options: ["or", "nor", "and", "but"],
      correctAnswer: "or",
      explanation: "Liên từ song hành 'either' luôn đi cặp với 'or' (either... or...)."
    }
  },
  {
    id: 'despite',
    title: 'Contrast phrase',
    formula: 'despite/in spite of + N/V-ing',
    example: 'Despite the delay, the order arrived today.',
    partFocus: 'Part 5-7',
    structure: 'despite / in spite of + Cụm danh từ / V-ing',
    explanation: 'Dùng chỉ sự nhượng bộ, tương phản. Theo sau luôn là một danh từ hoặc danh động từ chứ không phải mệnh đề.',
    quiz: {
      question: "_____ the budget cuts, the department will hire two new designers.",
      options: ["Despite", "Although", "Even though", "Whereas"],
      correctAnswer: "Despite",
      explanation: "Theo sau là cụm danh từ 'the budget cuts', do đó cần dùng giới từ nhượng bộ 'Despite'."
    }
  },
  {
    id: 'although',
    title: 'Contrast clause',
    formula: 'although/even though + S + V',
    example: 'Although demand increased, prices remained stable.',
    partFocus: 'Part 5-7',
    structure: 'although / even though / though + Mệnh đề (S + V)',
    explanation: 'Dùng chỉ sự nhượng bộ, tương phản. Theo sau phải là một mệnh đề hoàn chỉnh.',
    quiz: {
      question: "_____ the weather was poor, the outdoor product launch went ahead.",
      options: ["Although", "Despite", "In spite of", "Because of"],
      correctAnswer: "Although",
      explanation: "Theo sau là một mệnh đề 'the weather was poor' nên cần dùng liên từ 'Although'."
    }
  },
  {
    id: 'the-comparative',
    title: 'Double comparative',
    formula: 'the + comparative, the + comparative',
    example: 'The earlier you register, the lower the fee will be.',
    partFocus: 'Part 5',
    structure: 'The + so sánh hơn (+ S + V), the + so sánh hơn (+ S + V)',
    explanation: 'Cấu trúc so sánh kép (càng... thì càng...).',
    quiz: {
      question: "The more complex the project is, the _____ time it will take to complete.",
      options: ["more", "most", "much", "many"],
      correctAnswer: "more",
      explanation: "So sánh kép: The more... the more time... (Dùng 'more' cho danh từ không đếm được 'time')."
    }
  },
  {
    id: 'word-form',
    title: 'Word form trap',
    formula: 'article/preposition + correct word form',
    example: 'The manager gave a detailed explanation.',
    partFocus: 'Part 5',
    structure: 'Hòa hợp từ loại (Adjective + Noun, Adverb + Adjective...)',
    explanation: 'Xác định từ loại thích hợp điền vào chỗ trống dựa vào các từ xung quanh.',
    quiz: {
      question: "Please handle this delicate prototype _____ during the demonstration.",
      options: ["carefully", "careful", "care", "carefulness"],
      correctAnswer: "carefully",
      explanation: "Cần một trạng từ bổ nghĩa cho động từ thường 'handle' (handle carefully)."
    }
  },
  {
    id: 'subjunctive-mood',
    title: 'Subjunctive mood',
    formula: 'recommend/suggest + that + S + V bare',
    example: 'The consultant recommended that the company restructure its operations.',
    partFocus: 'Part 5-6',
    structure: 'Chủ ngữ 1 + recommend/suggest/insist + that + Chủ ngữ 2 + Động từ nguyên thể (không chia)',
    explanation: 'Thức giả định dùng sau các động từ yêu cầu, khuyên bảo, đề nghị. Động từ trong mệnh đề "that" luôn ở dạng nguyên thể không chia.',
    quiz: {
      question: "The director suggested that Ms. Lopez _____ the contract terms before signing.",
      options: ["reviews", "review", "reviewing", "reviewed"],
      correctAnswer: "review",
      explanation: "Theo cấu trúc giả định: suggest + that + S + V-bare (suggested that Ms. Lopez review)."
    }
  },
  {
    id: 'conditional-inversion',
    title: 'Conditional inversion',
    formula: 'Should/Had/Were + S + ...',
    example: 'Should you require further assistance, please contact customer support.',
    partFocus: 'Part 5',
    structure: 'Should + S + V-bare (Loại 1) | Were + S + to-V (Loại 2) | Had + S + V3 (Loại 3)',
    explanation: 'Đảo ngữ câu điều kiện lược bỏ liên từ "if" và đưa trợ động từ lên trước chủ ngữ.',
    quiz: {
      question: "_____ you require any additional promotional materials, do not hesitate to contact our marketing department.",
      options: ["Should", "Had", "Were", "Would"],
      correctAnswer: "Should",
      explanation: "Đảo ngữ câu điều kiện loại 1: Should + S + V-bare (Should you require... = If you require...)."
    }
  },
  {
    id: 'advanced-connectors',
    title: 'Advanced connectors',
    formula: 'provided that / barring / given + Clause/NP',
    example: 'The project will succeed provided that everyone collaborates.',
    partFocus: 'Part 5-6',
    structure: 'provided that/assuming that + Mệnh đề | barring/given/in light of + Cụm danh từ',
    explanation: 'Sử dụng liên từ và giới từ nâng cao để kết nối thông tin nguyên nhân, điều kiện hoặc loại trừ.',
    quiz: {
      question: "The outdoor product launch will proceed as scheduled _____ it rains heavily.",
      options: ["provided that", "barring", "unless", "given that"],
      correctAnswer: "unless",
      explanation: "Chọn 'unless' (trừ khi) để phù hợp nghĩa: sự kiện sẽ diễn ra như lịch trình trừ khi trời mưa to."
    }
  },
  {
    id: 'participle-adjectives',
    title: 'Participle adjectives',
    formula: 'V-ing / V-ed + N',
    example: 'We sent a customized proposal to our valued client.',
    partFocus: 'Part 5',
    structure: 'Tính từ phân từ chủ động (V-ing: gây ra tính chất) vs. Bị động (V-ed: chịu tác động)',
    explanation: 'Lựa chọn phân từ làm tính từ đứng trước danh từ. Phân từ bị động (V-ed) thể hiện tính chất nhận tác động (ví dụ: valued client - khách hàng được quý trọng), phân từ chủ động (V-ing) thể hiện tính chất tự thân hoặc gây ra tác động (ví dụ: demanding task - công việc đòi hỏi cao).',
    quiz: {
      question: "The company plans to launch a new service to attract more _____ clients.",
      options: ["valued", "valuing", "value", "values"],
      correctAnswer: "valued",
      explanation: "Cần tính từ dạng phân từ bị động 'valued' để bổ nghĩa cho 'clients' (khách hàng được quý trọng, khách hàng VIP)."
    }
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
  example: string
  exampleTranslation: string
}

export const TOEIC_COLLOCATIONS: ToeicCollocation[] = [
  {
    phrase: 'meet the requirements',
    translation: 'đáp ứng các yêu cầu',
    category: 'Operations',
    example: 'The candidate must meet the requirements in the job posting.',
    exampleTranslation: 'Ứng viên phải đáp ứng các yêu cầu trong tin tuyển dụng.'
  },
  {
    phrase: 'address the issue',
    translation: 'giải quyết vấn đề',
    category: 'Operations',
    example: 'We need to address the issue of customer complaints immediately.',
    exampleTranslation: 'Chúng ta cần giải quyết vấn đề khiếu nại của khách hàng ngay lập tức.'
  },
  {
    phrase: 'comply with regulations',
    translation: 'tuân thủ các quy định',
    category: 'Legal',
    example: 'All factories must comply with environmental and safety regulations.',
    exampleTranslation: 'Tất cả các nhà máy phải tuân thủ các quy định về an toàn và môi trường.'
  },
  {
    phrase: 'adhere to company policy',
    translation: 'tuân thủ chính sách công ty',
    category: 'HR',
    example: 'Every staff member must adhere to company policy regarding attendance.',
    exampleTranslation: 'Mỗi nhân viên đều phải tuân thủ chính sách công ty về chuyên cần.'
  },
  {
    phrase: 'conduct a survey',
    translation: 'tiến hành khảo sát',
    category: 'Marketing',
    example: 'The marketing team will conduct a survey next week to gather feedback.',
    exampleTranslation: 'Đội ngũ marketing sẽ tiến hành một cuộc khảo sát vào tuần tới để thu thập phản hồi.'
  },
  {
    phrase: 'approve the budget',
    translation: 'phê duyệt ngân sách',
    category: 'Finance',
    example: 'The board has voted to approve the budget for next fiscal year.',
    exampleTranslation: 'Ban cố vấn đã bỏ phiếu thông qua ngân sách cho năm tài chính tới.'
  },
  {
    phrase: 'meet the deadline',
    translation: 'kịp thời hạn / hoàn thành đúng hạn',
    category: 'Operations',
    example: 'We had to work overtime all week in order to meet the deadline.',
    exampleTranslation: 'Chúng tôi đã phải làm thêm giờ cả tuần để hoàn thành đúng hạn.'
  },
  {
    phrase: 'renew a subscription',
    translation: 'gia hạn dịch vụ đăng ký định kỳ',
    category: 'Finance',
    example: 'You can renew your software subscription online at any time.',
    exampleTranslation: 'Bạn có thể gia hạn dịch vụ phần mềm trực tuyến bất cứ lúc nào.'
  },
  {
    phrase: 'negotiate a contract',
    translation: 'thương lượng hợp đồng',
    category: 'Legal',
    example: 'They are currently trying to negotiate a new supply contract.',
    exampleTranslation: 'Họ hiện đang cố gắng thương lượng một hợp đồng cung ứng mới.'
  },
  {
    phrase: 'submit required documents',
    translation: 'nộp các tài liệu được yêu cầu',
    category: 'HR',
    example: 'Please submit all the required documents to HR by Friday afternoon.',
    exampleTranslation: 'Vui lòng nộp đầy đủ các tài liệu được yêu cầu cho nhân sự trước chiều thứ Sáu.'
  },
  {
    phrase: 'resolve a conflict',
    translation: 'giải quyết mâu thuẫn',
    category: 'HR',
    example: 'The human resources department helps to resolve workplace conflicts.',
    exampleTranslation: 'Bộ phận nhân sự giúp giải quyết các mâu thuẫn tại nơi làm việc.'
  },
  {
    phrase: 'implement a strategy',
    translation: 'triển khai chiến lược',
    category: 'Marketing',
    example: 'The company plans to implement a new online marketing strategy.',
    exampleTranslation: 'Công ty có kế hoạch triển khai một chiến lược marketing trực tuyến mới.'
  },
  {
    phrase: 'confirm receipt of payment',
    translation: 'xác nhận đã nhận thanh toán',
    category: 'Finance',
    example: 'We will confirm receipt of payment via email as soon as possible.',
    exampleTranslation: 'Chúng tôi sẽ gửi email xác nhận đã nhận được thanh toán sớm nhất có thể.'
  },
  {
    phrase: 'track a shipment',
    translation: 'theo dõi hành trình đơn hàng/lô hàng',
    category: 'Operations',
    example: 'Customers can track their shipments using the tracking number provided.',
    exampleTranslation: 'Khách hàng có thể theo dõi hành trình đơn hàng bằng mã vận đơn được cung cấp.'
  },
  {
    phrase: 'schedule an appointment',
    translation: 'sắp xếp lịch hẹn',
    category: 'HR',
    example: 'I need to schedule an appointment with the managing director.',
    exampleTranslation: 'Tôi cần sắp xếp lịch hẹn gặp giám đốc điều hành.'
  },
  {
    phrase: 'place an order',
    translation: 'đặt đơn hàng',
    category: 'Operations',
    example: 'You can place an order directly on our website or mobile app.',
    exampleTranslation: 'Bạn có thể đặt hàng trực tiếp trên trang web hoặc ứng dụng di động của chúng tôi.'
  },
  {
    phrase: 'provide a quotation',
    translation: 'cung cấp bảng báo giá',
    category: 'Finance',
    example: 'The supplier will provide a quotation for the building materials.',
    exampleTranslation: 'Nhà cung cấp sẽ cung cấp bảng báo giá cho các nguyên vật liệu xây dựng.'
  },
  {
    phrase: 'customer satisfaction',
    translation: 'sự hài lòng của khách hàng',
    category: 'Marketing',
    example: 'Customer satisfaction is our highest priority in this campaign.',
    exampleTranslation: 'Sự hài lòng của khách hàng là ưu tiên cao nhất của chúng tôi trong chiến dịch này.'
  },
  {
    phrase: 'reduce operating costs',
    translation: 'giảm thiểu chi phí hoạt động',
    category: 'Finance',
    example: 'We need to find effective ways to reduce operating costs.',
    exampleTranslation: 'Chúng ta cần tìm ra những phương pháp hiệu quả để giảm thiểu chi phí hoạt động.'
  },
  {
    phrase: 'launch a product',
    translation: 'ra mắt sản phẩm mới',
    category: 'Marketing',
    example: 'The firm plans to launch the new product line in September.',
    exampleTranslation: 'Công ty dự kiến ra mắt dòng sản phẩm mới vào tháng Chín.'
  },
  {
    phrase: 'boost sales revenue',
    translation: 'tăng doanh thu bán hàng',
    category: 'Sales',
    example: 'The new pricing strategy is designed to boost sales revenue.',
    exampleTranslation: 'Chiến lược giá mới được thiết kế để tăng doanh thu bán hàng.'
  },
  {
    phrase: 'handle customer complaints',
    translation: 'giải quyết các khiếu nại của khách hàng',
    category: 'Customer Service',
    example: 'Our support team is trained to handle customer complaints efficiently.',
    exampleTranslation: 'Đội ngũ hỗ trợ của chúng tôi được đào tạo để giải quyết các khiếu nại của khách hàng một cách hiệu quả.'
  },
  {
    phrase: 'formulate a plan',
    translation: 'thiết lập / xây dựng kế hoạch',
    category: 'Strategy',
    example: 'We need to formulate a plan to expand our market share.',
    exampleTranslation: 'Chúng ta cần xây dựng một kế hoạch để mở rộng thị phần.'
  },
  {
    phrase: 'exceed customer expectations',
    translation: 'vượt quá kỳ vọng của khách hàng',
    category: 'Customer Service',
    example: 'We always strive to exceed customer expectations in service quality.',
    exampleTranslation: 'Chúng tôi luôn nỗ lực vượt quá sự mong đợi của khách hàng về chất lượng dịch vụ.'
  },
  {
    phrase: 'gain a competitive edge',
    translation: 'đạt được lợi thế cạnh tranh',
    category: 'Strategy',
    example: 'Investing in new research helps us gain a competitive edge.',
    exampleTranslation: 'Đầu tư vào nghiên cứu mới giúp chúng tôi đạt được lợi thế cạnh tranh.'
  },
  {
    phrase: 'allocate resources',
    translation: 'phân bổ nguồn lực',
    category: 'Strategy',
    example: 'The project manager will allocate resources to the most critical tasks.',
    exampleTranslation: 'Quản lý dự án sẽ phân bổ nguồn lực cho các nhiệm vụ quan trọng nhất.'
  },
  {
    phrase: 'offer a discount',
    translation: 'đưa ra mức chiết khấu / giảm giá',
    category: 'Sales',
    example: 'We can offer a discount for bulk purchases of our software.',
    exampleTranslation: 'Chúng tôi có thể giảm giá cho các đơn mua số lượng lớn phần mềm của chúng tôi.'
  },
  {
    phrase: 'attract potential clients',
    translation: 'thu hút khách hàng tiềm năng',
    category: 'Sales',
    example: 'The annual trade fair is a great opportunity to attract potential clients.',
    exampleTranslation: 'Hội chợ thương mại thường niên là cơ hội tuyệt vời để thu hút khách hàng tiềm năng.'
  },
  {
    phrase: 'provide customer support',
    translation: 'cung cấp dịch vụ hỗ trợ khách hàng',
    category: 'Customer Service',
    example: 'Our support team is available 24/7 to provide customer support.',
    exampleTranslation: 'Đội ngũ hỗ trợ của chúng tôi sẵn sàng 24/7 để cung cấp dịch vụ hỗ trợ khách hàng.'
  },
  {
    phrase: 'minimize waste',
    translation: 'giảm thiểu chất thải / hao phí',
    category: 'Operations',
    example: 'Lean manufacturing systems help factories minimize waste.',
    exampleTranslation: 'Các hệ thống sản xuất tinh gọn giúp các nhà máy giảm thiểu hao phí.'
  },
  {
    phrase: 'terminate a contract',
    translation: 'chấm dứt hợp đồng',
    category: 'Legal',
    example: 'Either party can terminate the contract with a 30-day notice.',
    exampleTranslation: 'Bất kỳ bên nào cũng có thể chấm dứt hợp đồng với thông báo trước 30 ngày.'
  },
  {
    phrase: 'draft an agreement',
    translation: 'soạn thảo thỏa thuận / hợp đồng',
    category: 'Legal',
    example: 'The corporate lawyers are currently drafting a licensing agreement.',
    exampleTranslation: 'Các luật sư doanh nghiệp hiện đang soạn thảo một thỏa thuận cấp phép.'
  },
  {
    phrase: 'secure a deal',
    translation: 'chốt giao dịch / ký kết thành công',
    category: 'Sales',
    example: 'The sales representative managed to secure a deal with the client.',
    exampleTranslation: 'Đại diện bán hàng đã chốt thành công thương vụ với khách hàng.'
  },
  {
    phrase: 'conduct a performance review',
    translation: 'tiến hành đánh giá hiệu suất làm việc',
    category: 'HR',
    example: 'Managers conduct a performance review for every employee annually.',
    exampleTranslation: 'Quản lý tiến hành đánh giá hiệu suất làm việc hàng năm cho mỗi nhân viên.'
  },
  {
    phrase: 'allocate budget',
    translation: 'phân bổ ngân sách',
    category: 'Finance',
    example: 'We must allocate budget for software license renewals.',
    exampleTranslation: 'Chúng ta phải phân bổ ngân sách cho việc gia hạn bản quyền phần mềm.'
  },
  {
    phrase: 'increase market share',
    translation: 'gia tăng thị phần',
    category: 'Marketing',
    example: 'The brand aims to increase market share in the European market.',
    exampleTranslation: 'Thương hiệu đặt mục tiêu gia tăng thị phần tại thị trường châu Âu.'
  },
  {
    phrase: 'implement feedback',
    translation: 'áp dụng các ý kiến phản hồi',
    category: 'Customer Service',
    example: 'We will implement user feedback to improve our application UI.',
    exampleTranslation: 'Chúng tôi sẽ áp dụng phản hồi của người dùng để cải thiện giao diện ứng dụng.'
  },
  {
    phrase: 'maximize profits',
    translation: 'tối đa hóa lợi nhuận',
    category: 'Finance',
    example: 'Cutting unnecessary administrative expenses helps maximize profits.',
    exampleTranslation: 'Cắt giảm các khoản chi hành chính không cần thiết giúp tối đa hóa lợi nhuận.'
  },
  {
    phrase: 'foster teamwork',
    translation: 'thúc đẩy tinh thần làm việc nhóm',
    category: 'HR',
    example: 'Interactive group projects are designed to foster teamwork.',
    exampleTranslation: 'Các dự án nhóm tương tác được thiết kế để thúc đẩy tinh thần làm việc nhóm.'
  },
  {
    phrase: 'retain loyal customers',
    translation: 'giữ chân các khách hàng thân thiết',
    category: 'Customer Service',
    example: 'Offering premium customer service is key to retaining loyal customers.',
    exampleTranslation: 'Cung cấp dịch vụ khách hàng cao cấp là chìa khóa để giữ chân khách hàng thân thiết.'
  },
  // Logistics
  {
    phrase: 'distribute products',
    translation: 'phân phối sản phẩm',
    category: 'Logistics',
    example: 'The company distributes products to retail outlets nationwide.',
    exampleTranslation: 'Công ty phân phối sản phẩm đến các đại lý bán lẻ trên toàn quốc.'
  },
  {
    phrase: 'expedite a shipment',
    translation: 'đẩy nhanh việc vận chuyển lô hàng',
    category: 'Logistics',
    example: 'We paid extra to expedite the shipment of the replacement parts.',
    exampleTranslation: 'Chúng tôi đã trả thêm tiền để đẩy nhanh việc vận chuyển các bộ phận thay thế.'
  },
  {
    phrase: 'obtain customs clearance',
    translation: 'thông quan hải quan',
    category: 'Logistics',
    example: 'The importer must obtain customs clearance before the cargo can be released.',
    exampleTranslation: 'Nhà nhập khẩu phải hoàn thành thông quan hải quan trước khi hàng hóa được giải phóng.'
  },
  {
    phrase: 'optimize inventory management',
    translation: 'tối ưu hóa quản lý hàng tồn kho',
    category: 'Logistics',
    example: 'We need to optimize inventory management to avoid stockouts.',
    exampleTranslation: 'Chúng ta cần tối ưu hóa quản lý hàng tồn kho để tránh tình trạng hết hàng.'
  },
  // IT & Tech
  {
    phrase: 'troubleshoot a system',
    translation: 'khắc phục sự cố hệ thống',
    category: 'IT & Tech',
    example: 'The IT technician was called to troubleshoot the network system.',
    exampleTranslation: 'Kỹ thuật viên CNTT đã được gọi để khắc phục sự cố hệ thống mạng.'
  },
  {
    phrase: 'install software updates',
    translation: 'cài đặt bản cập nhật phần mềm',
    category: 'IT & Tech',
    example: 'Please install software updates to ensure system security.',
    exampleTranslation: 'Vui lòng cài đặt các bản cập nhật phần mềm để đảm bảo an ninh hệ thống.'
  },
  {
    phrase: 'back up data',
    translation: 'sao lưu dữ liệu',
    category: 'IT & Tech',
    example: 'It is highly recommended to back up critical data every week.',
    exampleTranslation: 'Rất nên sao lưu dữ liệu quan trọng hàng tuần.'
  },
  {
    phrase: 'leverage technology',
    translation: 'tận dụng công nghệ',
    category: 'IT & Tech',
    example: 'We leverage modern technology to automate our repetitive tasks.',
    exampleTranslation: 'Chúng tôi tận dụng công nghệ hiện đại để tự động hóa các công việc lặp đi lặp lại.'
  },
  // Meetings
  {
    phrase: 'convene a meeting',
    translation: 'triệu tập cuộc họp',
    category: 'Meetings',
    example: 'The CEO decided to convene an emergency meeting of all board members.',
    exampleTranslation: 'Giám đốc điều hành đã quyết định triệu tập một cuộc họp khẩn cấp gồm tất cả các thành viên ban quản trị.'
  },
  {
    phrase: 'chair a session',
    translation: 'chủ trì một phiên thảo luận/họp',
    category: 'Meetings',
    example: 'Dr. Smith will chair the panel discussion session at the conference.',
    exampleTranslation: 'Tiến sĩ Smith sẽ chủ trì phiên thảo luận nhóm tại hội nghị.'
  },
  {
    phrase: 'reach a consensus',
    translation: 'đạt được sự đồng thuận',
    category: 'Meetings',
    example: 'After hours of debate, the team finally managed to reach a consensus.',
    exampleTranslation: 'Sau nhiều giờ tranh luận, cả đội cuối cùng đã đạt được sự đồng thuận.'
  },
  {
    phrase: 'adjourn a meeting',
    translation: 'hoãn/kết thúc cuộc họp',
    category: 'Meetings',
    example: "Let's adjourn the meeting and resume tomorrow morning at 9 AM.",
    exampleTranslation: 'Hãy kết thúc cuộc họp này và tiếp tục vào lúc 9 giờ sáng mai.'
  },
  // Travel
  {
    phrase: 'confirm flight details',
    translation: 'xác nhận chi tiết chuyến bay',
    category: 'Travel',
    example: 'Please confirm your flight details before leaving for the airport.',
    exampleTranslation: 'Vui lòng xác nhận chi tiết chuyến bay của bạn trước khi ra sân bay.'
  },
  {
    phrase: 'make itinerary adjustments',
    translation: 'điều chỉnh lịch trình chuyến đi',
    category: 'Travel',
    example: 'We had to make itinerary adjustments due to the sudden flight cancellation.',
    exampleTranslation: 'Chúng tôi đã phải điều chỉnh lịch trình do chuyến bay đột ngột bị hủy.'
  },
  {
    phrase: 'offer complimentary breakfast',
    translation: 'cung cấp bữa sáng miễn phí',
    category: 'Travel',
    example: 'Many hotels offer complimentary breakfast to attract business travelers.',
    exampleTranslation: 'Nhiều khách sạn cung cấp bữa sáng miễn phí để thu hút khách đi công tác.'
  },
  {
    phrase: 'travel arrangements',
    translation: 'sắp xếp chuyến đi',
    category: 'Travel',
    example: 'The administrative assistant will handle all travel arrangements for the executive.',
    exampleTranslation: 'Trợ lý hành chính sẽ lo mọi việc sắp xếp chuyến đi cho vị giám đốc.'
  },
  // Purchasing
  {
    phrase: 'procure office supplies',
    translation: 'thu mua văn phòng phẩm',
    category: 'Purchasing',
    example: 'The company needs to procure office supplies from local vendors.',
    exampleTranslation: 'Công ty cần thu mua văn phòng phẩm từ các nhà cung cấp địa phương.'
  },
  {
    phrase: 'negotiate bulk prices',
    translation: 'thương lượng giá sỉ/số lượng lớn',
    category: 'Purchasing',
    example: 'Our purchasing agent managed to negotiate bulk prices with the manufacturer.',
    exampleTranslation: 'Đại diện thu mua của chúng tôi đã thương lượng được giá mua sỉ với nhà sản xuất.'
  },
  {
    phrase: 'establish criteria for vendor selection',
    translation: 'thiết lập tiêu chí lựa chọn nhà cung cấp',
    category: 'Purchasing',
    example: 'The committee will establish strict criteria for vendor selection.',
    exampleTranslation: 'Ủy ban sẽ thiết lập các tiêu chí nghiêm ngặt để lựa chọn nhà cung cấp.'
  },
  {
    phrase: 'request a quotation',
    translation: 'yêu cầu bảng báo giá',
    category: 'Purchasing',
    example: 'We should request a quotation from at least three different suppliers.',
    exampleTranslation: 'Chúng ta nên yêu cầu bảng báo giá từ ít nhất ba nhà cung cấp khác nhau.'
  }
]

export function createBlankAnswers(): Record<number, AnswerChoice> {
  return Object.fromEntries(
    Array.from({ length: 200 }, (_, index) => [index + 1, ''] as const),
  ) as Record<number, AnswerChoice>
}

export function generateStudyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'TOEIC-'
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function createEmptyProgress(): ToeicProgressData {
  const initialExam = createExam('exam-1', 'TOEIC Test 1')

  return {
    version: 5,
    activeExamId: initialExam.id,
    exams: [initialExam],
    flashcards: [],
    cloudConfig: {
      projectId: 'toeic-progress-web', // Default project ID for out-of-the-box experience
      apiKey: '', // Empty by default, users can customize if needed or use the default one
      enabled: true,
      user: null,
    },
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

export const GRAMMAR_VIETNAMESE_TITLES: Record<string, string> = {
  'basic-sv': 'Câu cơ bản (S + V)',
  'present-continuous': 'Thì Hiện tại tiếp diễn',
  'perfect-tense': 'Thì Hiện tại hoàn thành',
  'present-perfect-question': 'Hỏi Hiện tại hoàn thành',
  'passive': 'Thể bị động',
  'passive-question': 'Hỏi thể bị động',
  'modal': 'Động từ khuyết thiếu',
  'causative-active': 'Thể nhờ vả (Chủ động)',
  'causative-passive': 'Thể nhờ vả (Bị động)',
  'relative-clause': 'Mệnh đề quan hệ',
  'reduced-active': 'Rút gọn MĐQH chủ động',
  'reduced-passive': 'Rút gọn MĐQH bị động',
  'too-to': 'Cấu trúc Too ... to',
  'enough-to': 'Cấu trúc Enough ... to',
  'not-only-but-also': 'Không những... mà còn',
  'either-or': 'Hoặc... hoặc...',
  'despite': 'Mặc dù (cụm danh từ)',
  'although': 'Mặc dù (mệnh đề)',
  'the-comparative': 'So sánh kép (Càng... càng...)',
  'word-form': 'Bẫy từ loại (Noun/Adj/Adv)',
  'subjunctive-mood': 'Thức giả định thương mại',
  'conditional-inversion': 'Đảo ngữ câu điều kiện',
  'advanced-connectors': 'Liên từ & Giới từ nâng cao',
  'participle-adjectives': 'Bẫy Phân từ làm tính từ',
}

export const COLLO_VIETNAMESE_TITLES: Record<string, string> = {
  'All': 'Tất cả chủ đề',
  'Operations': 'Vận hành & Sản xuất',
  'Finance': 'Tài chính & Ngân sách',
  'Legal': 'Pháp lý & Quy định',
  'HR': 'Nhân sự & Tuyển dụng',
  'Marketing': 'Tiếp thị & Quảng cáo',
  'Sales': 'Bán hàng & Doanh thu',
  'Customer Service': 'Chăm sóc khách hàng',
  'Strategy': 'Chiến lược & Phát triển',
  'Logistics': 'Vận chuyển & Hậu cần',
  'IT & Tech': 'Công nghệ & Hệ thống',
  'Meetings': 'Hội họp & Sự kiện',
  'Travel': 'Công tác & Du lịch',
  'Purchasing': 'Thu mua & Đấu thầu',
}
