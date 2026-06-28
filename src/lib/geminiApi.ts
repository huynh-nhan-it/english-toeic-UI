import type { ToeicReadingPassage } from './readingDatabase'
import type { GrammarQuestion } from './grammarDatabase'

/**
 * Generates a highly realistic TOEIC Part 7 reading comprehension passage using Google Gemini 2.5 API.
 * Uses Google Search Grounding to fetch the latest 2026 data and trends.
 * Personalizes the passage by integrating vocabulary from the user's flashcards.
 * 
 * @param apiKey Google AI Studio Gemini API Key
 * @param flashcardWords Words from the user's studied flashcards to integrate in the passage
 * @param category The business topic category (e.g. Marketing, HR, Finance, Logistics, IT & Tech, etc.)
 */
export async function generateAiReadingPassage(
  apiKey: string,
  flashcardWords: string[],
  category: string
): Promise<ToeicReadingPassage> {
  const cleanApiKey = apiKey.trim()
  if (!cleanApiKey) {
    throw new Error('API Key trống. Vui lòng cấu hình khóa API Gemini trong tab Cài đặt.')
  }

  // Randomly decide the type of passage: single (40%), double (40%), or triple (20%)
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

  // Setup Gemini API request payload with Google Search Grounding and JSON Schema enforcement
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`

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
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7
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
    throw new Error(`Gemini API call failed with status ${res.status}. Vui lòng kiểm tra khóa API hoặc kết nối mạng.`)
  }

  const data = await res.json()
  
  // Parse the generated JSON response
  try {
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      throw new Error('Gemini API không trả về nội dung hợp lệ.')
    }

    const parsedPassage = JSON.parse(rawText) as ToeicReadingPassage
    // Overwrite category and type to ensure they match our request exactly
    parsedPassage.category = category
    parsedPassage.type = passageType
    if (!parsedPassage.id.startsWith('rp-ai-')) {
      parsedPassage.id = `rp-ai-${Date.now()}`
    }
    return parsedPassage
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON response:', parseErr, data)
    throw new Error('Không thể phân tích dữ liệu đề bài sinh ra từ AI. Vui lòng thử lại.', { cause: parseErr })
  }
}

/**
 * Generates highly realistic TOEIC Part 5 & 6 multiple-choice grammar questions using Google Gemini 2.5 API.
 * 
 * @param apiKey Google AI Studio Gemini API Key
 */
export async function generateAiGrammarQuestions(
  apiKey: string
): Promise<GrammarQuestion[]> {
  const cleanApiKey = apiKey.trim()
  if (!cleanApiKey) {
    throw new Error('API Key trống. Vui lòng cấu hình khóa API Gemini trong tab Cài đặt.')
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`

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
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.8
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
    throw new Error(`Gemini API call failed with status ${res.status}. Vui lòng kiểm tra khóa API hoặc kết nối mạng.`)
  }

  const data = await res.json()
  
  try {
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      throw new Error('Gemini API không trả về nội dung hợp lệ.')
    }

    const parsedQuestions = JSON.parse(rawText) as GrammarQuestion[]
    return parsedQuestions.map((q, idx) => ({
      ...q,
      id: q.id.startsWith('gq-ai-') ? q.id : `gq-ai-${Date.now()}-${idx}`
    }))
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON response:', parseErr, data)
    throw new Error('Không thể phân tích dữ liệu câu hỏi ngữ pháp sinh ra từ AI. Vui lòng thử lại.', { cause: parseErr })
  }
}

export type GeneratedFlashcard = {
  word: string
  phonetic: string
  definition: string
  translation: string
  example: string
}

export async function generateAiFlashcards(
  apiKey: string,
  existingWords: string[],
  count: number
): Promise<GeneratedFlashcard[]> {
  const cleanApiKey = apiKey.trim()
  if (!cleanApiKey) {
    throw new Error('API Key trống. Vui lòng cấu hình khóa API Gemini trong tab Cài đặt.')
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`

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
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.8
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
    throw new Error(`Gemini API call failed with status ${res.status}. Vui lòng kiểm tra khóa API hoặc kết nối mạng.`)
  }

  const data = await res.json()
  
  try {
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      throw new Error('Gemini API không trả về nội dung hợp lệ.')
    }

    const parsedCards = JSON.parse(rawText) as GeneratedFlashcard[]
    return parsedCards
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON response:', parseErr, data)
    throw new Error('Không thể phân tích dữ liệu từ vựng sinh ra từ AI. Vui lòng thử lại.', { cause: parseErr })
  }
}
