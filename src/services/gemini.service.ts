
export type ToeicReadingPassage = {
  id: string
  type: 'single' | 'double' | 'triple'
  category: string
  title: string
  documents: {
    title: string
    content: string
  }[]
  questions: {
    id: string
    question: string
    options: {
      A: string
      B: string
      C: string
      D: string
    }
    correctAnswer: 'A' | 'B' | 'C' | 'D'
    explanation: string
  }[]
}

export type GrammarQuestion = {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  topic: string
}

export type GeneratedFlashcard = {
  word: string
  phonetic: string
  definition: string
  translation: string
  example: string
}

export type ChatRoleplayMessage = {
  role: 'user' | 'model' | 'system'
  parts: { text: string }[]
}

export type ChatRoleplayEvaluation = {
  overallScore: number
  generalFeedback: string
  corrections: {
    userMessage: string
    correction: string
    explanation: string
  }[]
}

export type StoryWriterFeedback = {
  score: number
  feedback: string
  errors: {
    text: string
    error: string
    correction: string
    explanation: string
  }[]
  rewrittenStory: string
}

// Helper to make calls to Gemini API
async function callGemini(apiKey: string, prompt: string, responseSchema?: Record<string, unknown>): Promise<string> {
  const cleanApiKey = apiKey.trim()
  if (!cleanApiKey) {
    throw new Error('API Key trống. Vui lòng cấu hình khóa API Gemini trong tab Cài đặt.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: responseSchema ? 'application/json' : undefined,
      responseSchema: responseSchema || undefined
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Gemini API Error details:', errText)
    throw new Error(`Gemini API call failed with status ${res.status}.`)
  }

  const data = await res.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error('Gemini API không trả về nội dung hợp lệ.')
  }

  return rawText
}

// 1. Generate Reading Passage
export async function generateAiReadingPassage(
  apiKey: string,
  flashcardWords: string[],
  category: string
): Promise<ToeicReadingPassage> {
  const rand = Math.random()
  const passageType: 'single' | 'double' | 'triple' =
    rand < 0.4 ? 'single' : rand < 0.8 ? 'double' : 'triple'

  const vocabFocusText =
    flashcardWords.length > 0
      ? `Ensure you naturally integrate at least 2 or 3 of the following English words into the reading documents: ${flashcardWords.slice(0, 10).join(', ')}.`
      : ''

  const prompt = `You are an expert TOEIC test writer specializing in the latest 2026 exam formats.
Generate a highly professional business-context TOEIC Part 7 reading comprehension passage of type "${passageType}" in the category of "${category}".

Guidelines for the passage type:
- If type is "single": Generate exactly 1 document (e.g. an online chat discussion between 2-3 colleagues with timestamps, or an email, or an advertisement). Write 2 multiple-choice questions.
- If type is "double": Generate exactly 2 related documents (e.g. Document 1 is an Email requesting a quote, Document 2 is the corresponding invoice or quotation sheet). Write 3 multiple-choice questions, at least one requiring cross-referencing information between both documents.
- If type is "triple": Generate exactly 3 related documents (e.g. Document 1 is a company policy memo, Document 2 is an email from an employee asking for an exception, Document 3 is the submitted request form). Write 4 multiple-choice questions, at least one requiring cross-referencing information between multiple documents.

Vocabulary integration:
${vocabFocusText}

Question Guidelines:
- Questions must be written in English.
- Provide exactly 4 options (A, B, C, D) for each question.
- Write a highly detailed explanation (explanation) in Vietnamese. The explanation MUST translate the relevant sentences from English to Vietnamese and explain the logical reason for the correct answer, pointing out why other options are incorrect.
- Ensure the questions test: main idea, vocabulary in context, specific details, and logical inference.

Ensure the output is valid JSON matching the schema provided.`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING', description: 'Unique ID starting with rp-ai-' },
      type: { type: 'STRING', enum: ['single', 'double', 'triple'] },
      category: { type: 'STRING' },
      title: { type: 'STRING', description: 'Bilingual Vietnamese-English title of this passage set' },
      documents: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Title of the document in Vietnamese (e.g. Văn bản 1: Thư điện tử)' },
            content: { type: 'STRING', description: 'The full English content of the document, formatted with line breaks if necessary' }
          },
          required: ['title', 'content']
        }
      },
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            question: { type: 'STRING', description: 'The multiple choice question in English' },
            options: {
              type: 'OBJECT',
              properties: {
                A: { type: 'STRING' },
                B: { type: 'STRING' },
                C: { type: 'STRING' },
                D: { type: 'STRING' }
              },
              required: ['A', 'B', 'C', 'D']
            },
            correctAnswer: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
            explanation: { type: 'STRING', description: 'Extremely detailed explanation and translation of relevant evidence in Vietnamese' }
          },
          required: ['id', 'question', 'options', 'correctAnswer', 'explanation']
        }
      }
    },
    required: ['id', 'type', 'category', 'title', 'documents', 'questions']
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  const parsedPassage = JSON.parse(rawJson) as ToeicReadingPassage
  parsedPassage.category = category
  parsedPassage.type = passageType
  if (!parsedPassage.id || !parsedPassage.id.startsWith('rp-ai-')) {
    parsedPassage.id = `rp-ai-${Date.now()}`
  }
  return parsedPassage
}

// 2. Generate Grammar Questions
export async function generateAiGrammarQuestions(apiKey: string): Promise<GrammarQuestion[]> {
  const prompt = `You are an expert TOEIC test writer specializing in the latest 2026 exam formats.
Generate exactly 15 highly realistic TOEIC Part 5 & Part 6 multiple-choice grammar questions.

Guidelines for the questions:
- Each question must test business or professional English context.
- Target a mix of advanced and standard TOEIC grammar topics.
- The question, options (A, B, C, D) must be in English.
- For each question, assign a topic ID that MUST match exactly one of these valid IDs:
  "basic-sv", "present-continuous", "perfect-tense", "present-perfect-question", "passive", "passive-question", "modal", "causative-active", "causative-passive", "relative-clause", "reduced-active", "reduced-passive", "too-to", "enough-to", "not-only-but-also", "either-or", "despite", "although", "the-comparative", "word-form", "subjunctive-mood", "conditional-inversion", "advanced-connectors", "participle-adjectives".
- Provide an extremely detailed grammatical explanation (explanation) in Vietnamese, detailing why the correct option is right, translating the sentence to Vietnamese, and explaining why other distractors are wrong.

Ensure the output is a valid JSON array matching the schema provided.`

  const responseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'Unique ID starting with gq-ai-' },
        question: { type: 'STRING', description: 'The incomplete sentence with a blank (e.g., "The manager decided to _______ the meeting...")' },
        options: {
          type: 'OBJECT',
          properties: {
            A: { type: 'STRING' },
            B: { type: 'STRING' },
            C: { type: 'STRING' },
            D: { type: 'STRING' }
          },
          required: ['A', 'B', 'C', 'D']
        },
        correctAnswer: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
        explanation: { type: 'STRING', description: 'Extremely detailed explanation and translation of the sentence in Vietnamese' },
        topic: { type: 'STRING', description: 'The exact topic ID corresponding to the grammar formula' }
      },
      required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'topic']
    }
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  const parsedQuestions = JSON.parse(rawJson) as GrammarQuestion[]
  return parsedQuestions.map((q, idx) => ({
    ...q,
    id: q.id && q.id.startsWith('gq-ai-') ? q.id : `gq-ai-${Date.now()}-${idx}`
  }))
}

// 3. Generate Flashcards
export async function generateAiFlashcards(
  apiKey: string,
  existingWords: string[],
  count: number
): Promise<GeneratedFlashcard[]> {
  const normalizedExisting = existingWords.map(w => w.trim().toLowerCase())
  const existingText = normalizedExisting.length > 0
    ? `Do NOT generate any of the following existing English words/phrases (case-insensitive): ${normalizedExisting.join(', ')}.`
    : ''

  const prompt = `You are an elite TOEIC educator and vocabulary specialist.
Generate exactly ${count} high-frequency, premium English vocabulary words or phrases commonly tested in the modern TOEIC exam (2025-2026 standards).
Focus on professional business-context domains such as corporate operations, HR, marketing, financial negotiations, logistics, client communications, and IT.

Avoid basic or elementary words. Select intermediate and advanced words/phrases (e.g., "adjourn", "allocate", "stringent", "curtail", "comply with", "retrieve", "contingency plan").

Exclusion criteria:
${existingText}

For each vocabulary word/phrase, provide:
1. "word": The English word or phrase (e.g., "comply with").
2. "phonetic": Accurate IPA phonetic transcription (e.g., "/kəmˈplaɪ wɪð/").
3. "definition": Clear, concise definition in English.
4. "translation": Natural, accurate translation in Vietnamese.
5. "example": A realistic, professional business-context English example sentence utilizing the word.

Ensure the output is a valid JSON array matching the schema provided.`

  const responseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        word: { type: 'STRING', description: 'The English vocabulary word or phrase' },
        phonetic: { type: 'STRING', description: 'The IPA phonetic transcription' },
        definition: { type: 'STRING', description: 'Concise English definition' },
        translation: { type: 'STRING', description: 'Vietnamese translation' },
        example: { type: 'STRING', description: 'Business English example sentence' }
      },
      required: ['word', 'phonetic', 'definition', 'translation', 'example']
    }
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  const parsedCards = JSON.parse(rawJson) as GeneratedFlashcard[]
  return parsedCards
}

// 4. Generate AI Chat Roleplay Response
export async function generateChatRoleplayResponse(
  apiKey: string,
  scenario: string,
  partnerRole: string,
  history: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
  pastMistakes?: string[]
): Promise<string> {
  const historyText = history
    .map(h => `${h.role === 'user' ? 'User' : partnerRole}: ${h.text}`)
    .join('\n')

  const mistakesContext = pastMistakes && pastMistakes.length > 0
    ? `\nFocus areas: The user has previously made these English writing/grammar mistakes. Try to guide the conversation or test them subtly on these topics: ${pastMistakes.slice(0, 8).join('; ')}.`
    : ''

  const prompt = `You are a native English speaker playing the role of "${partnerRole}" in a real-life conversation scenario: "${scenario}".
Here is the conversation history so far:
${historyText}

User's current message: "${userMessage}"

Respond naturally in English as your role. ${mistakesContext}
Rules:
- Keep your response brief (1 to 3 sentences max) to maintain a realistic conversation.
- Do NOT add any translations or notes. 
- Do NOT speak as the User. Respond directly to the user.`

  return await callGemini(apiKey, prompt)
}

// 5. Evaluate AI Chat Roleplay Dialog
export async function evaluateChatRoleplay(
  apiKey: string,
  scenario: string,
  partnerRole: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<ChatRoleplayEvaluation> {
  const dialogText = history
    .map(h => `${h.role === 'user' ? 'User' : partnerRole}: ${h.text}`)
    .join('\n')

  const prompt = `You are an elite English communication coach and TOEIC examiner.
Evaluate the following English conversation dialog between the user ("User") and "${partnerRole}" in the scenario "${scenario}":
${dialogText}

Focus strictly on analyzing the messages written by the "User". 
Analyze:
- Grammatical mistakes
- Spelling errors
- Word choices
- How to make their phrasings sound more natural and native (native expression).

Provide an overall score out of 100, general feedback in Vietnamese, and specific corrections for each user message.

Ensure the output is valid JSON matching the schema provided.`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      overallScore: { type: 'NUMBER', description: 'Overall communication score from 0 to 100' },
      generalFeedback: { type: 'STRING', description: 'Constructive review of user\'s English communication skills in Vietnamese' },
      corrections: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            userMessage: { type: 'STRING', description: 'Original user message analyzed' },
            correction: { type: 'STRING', description: 'Corrected and more natural version of their message in English' },
            explanation: { type: 'STRING', description: 'Detailed grammatical correction and vocabulary suggestion in Vietnamese' }
          },
          required: ['userMessage', 'correction', 'explanation']
        }
      }
    },
    required: ['overallScore', 'generalFeedback', 'corrections']
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  return JSON.parse(rawJson) as ChatRoleplayEvaluation
}

// 6. Evaluate Story Writer Creative text
export async function evaluateStory(
  apiKey: string,
  promptTopic: string,
  storyText: string
): Promise<StoryWriterFeedback> {
  const prompt = `You are an elite English writing instructor and literature editor.
Review the following English story written by the user. The prompt topic was: "${promptTopic}".
Story Content:
"""
${storyText}
"""

Guidelines:
- Grade the writing out of 100 based on grammatical accuracy, vocabulary richness, and coherence.
- Provide general constructive feedback in Vietnamese.
- Identify specific grammatical or vocabulary errors, offering corrections and explanations in Vietnamese.
- Provide a fully rewritten, native-level version of the story that keeps the user's original storyline but elevates the vocabulary, phrasing, and descriptive depth to sound like a professional writer.

Ensure the output is valid JSON matching the schema provided.`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      score: { type: 'NUMBER', description: 'Score out of 100' },
      feedback: { type: 'STRING', description: 'Detailed review of their writing in Vietnamese' },
      errors: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            text: { type: 'STRING', description: 'The sentence containing the error' },
            error: { type: 'STRING', description: 'Description of the error' },
            correction: { type: 'STRING', description: 'The corrected sentence' },
            explanation: { type: 'STRING', description: 'Why this is an error and the grammatical rule in Vietnamese' }
          },
          required: ['text', 'error', 'correction', 'explanation']
        }
      },
      rewrittenStory: { type: 'STRING', description: 'The fully rewritten native-level story' }
    },
    required: ['score', 'feedback', 'errors', 'rewrittenStory']
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  return JSON.parse(rawJson) as StoryWriterFeedback
}

// 7. Generate Custom Story Prompt from User Idea
export async function generateCustomStoryPrompt(
  apiKey: string,
  userIdea: string
): Promise<{ id: string; title: string; fullPrompt: string }> {
  const prompt = `You are a professional TOEIC test writer. Based on the user's idea or keyword: "${userIdea}", generate a custom business or everyday workplace story writing prompt.
  Output a JSON object with:
  - id: a unique ID (e.g. 'custom-story-' + timestamp)
  - title: a short, catchy title (e.g. '✈️ Đi công tác' or '💻 Lập trình viên') with a relevant emoji.
  - fullPrompt: a detailed instruction in Vietnamese followed by English in parentheses, similar to: 'Mô tả những ngày đầu tiên làm thực tập sinh phát triển phần mềm... (Your first days as a software engineering intern).'
  Ensure the output is valid JSON.`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING' },
      title: { type: 'STRING' },
      fullPrompt: { type: 'STRING' }
    },
    required: ['id', 'title', 'fullPrompt']
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  const parsed = JSON.parse(rawJson)
  if (!parsed.id) {
    parsed.id = `custom-story-${Date.now()}`
  }
  return parsed
}

// 8. Generate Custom Chat Roleplay Scenario from User Idea
export async function generateCustomRoleplayScenario(
  apiKey: string,
  userIdea: string
): Promise<{ id: string; title: string; description: string; partnerRole: string; scenarioPrompt: string; firstMessage: string }> {
  const prompt = `You are a professional TOEIC Speaking test developer. Based on the user's idea or keyword: "${userIdea}", generate a custom conversation scenario.
  Output a JSON object with:
  - id: a unique ID (e.g. 'custom-chat-' + timestamp)
  - title: a short, catchy title (e.g. '🏨 Đặt phòng khách sạn') with a relevant emoji.
  - description: a 1-sentence description in Vietnamese detailing the roleplay scenario.
  - partnerRole: the role name of the AI partner (e.g. 'Sophia (Hotel Receptionist)').
  - scenarioPrompt: a detailed English description of the scenario context.
  - firstMessage: the initial greeting message from the AI partner to start the chat in English.
  Ensure the output is valid JSON.`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING' },
      title: { type: 'STRING' },
      description: { type: 'STRING' },
      partnerRole: { type: 'STRING' },
      scenarioPrompt: { type: 'STRING' },
      firstMessage: { type: 'STRING' }
    },
    required: ['id', 'title', 'description', 'partnerRole', 'scenarioPrompt', 'firstMessage']
  }

  const rawJson = await callGemini(apiKey, prompt, responseSchema)
  const parsed = JSON.parse(rawJson)
  if (!parsed.id) {
    parsed.id = `custom-chat-${Date.now()}`
  }
  return parsed
}

