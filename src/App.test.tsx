// vitest globals are injected via globals:true in vitest.config.ts
// Do not import { describe, test, vi } from 'vitest' — it breaks Vitest 4.x worker context

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './lib/storage'
import { useToeicStore } from './store/useToeicStore'
import { createExam } from './lib/toeic'

function expectQuestionValue(questionNumber: number, expectedValue: string) {
  const questionEl = screen.getByLabelText(`Question ${questionNumber}`)
  const selectedButton = questionEl.querySelector('.bg-indigo-600')
  if (expectedValue === '') {
    expect(selectedButton).toBeNull()
  } else {
    expect(selectedButton).toHaveTextContent(expectedValue)
  }
}

describe('TOEIC Progress SPA', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()

    // Reset Zustand store to clean initial state for each test
    act(() => {
      useToeicStore.setState({
        activeExamId: 'exam-1',
        exams: [createExam('exam-1', 'TOEIC Test 1')],
        flashcards: [],
        cloudConfig: {
          projectId: 'toeic-progress-web',
          apiKey: '',
          googleClientId: '',
          enabled: true,
          user: null,
        },
        geminiApiKey: '',
        leitnerIntervals: undefined,
      })
    })
    // Clear localStorage again because resetting the store state above triggers the subscriber and writes to localStorage
    localStorage.clear()
  })



  test('loads 200 blank answers when localStorage is empty', () => {
    render(<App />)

    expect(screen.getAllByLabelText(/Question \d+/)).toHaveLength(200)
    expectQuestionValue(1, '')
    expectQuestionValue(200, '')
  })

  test('hydrates answers and notebook notes from localStorage', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 5,
        activeExamId: 'exam-1',
        exams: [{
          id: 'exam-1',
          title: 'TOEIC Test 1',
          answers: { 1: 'B', 200: 'D' },
          notes: {
            businessVocabulary: 'invoice, quarterly revenue',
            grammarTraps: 'subject verb agreement',
            transcriptShadowing: 'Could you repeat that?',
            selectedGrammarFormulaIds: [],
            activeShadowingLine: null,
            completedShadowingLines: [],
          },
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z',
        }],
        flashcards: [],
        cloudConfig: { projectId: 'toeic-progress-default', apiKey: '', enabled: false, user: null },
        updatedAt: '2026-05-24T00:00:00.000Z',
      }),
    )

    // Rehydrate the store from the newly set localStorage before rendering
    act(() => {
      useToeicStore.getState().rehydrate()
    })

    render(<App />)

    // Verify answers are hydrated
    expectQuestionValue(1, 'B')
    expectQuestionValue(200, 'D')

    // Navigate to Notebook Tab
    await user.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])

    // Verify notes are hydrated
    expect(screen.getByLabelText('Business Vocabulary')).toHaveValue('invoice, quarterly revenue')
    expect(screen.getByLabelText('Grammar Traps')).toHaveValue('subject verb agreement')
    expect(screen.getByLabelText('Transcript Shadowing')).toHaveValue('Could you repeat that?')
  })

  test('normalizes valid answer entry to uppercase and focuses the next question', async () => {
    const user = userEvent.setup()
    render(<App />)

    const firstQuestion = screen.getByLabelText('Question 1')
    expect(within(firstQuestion).getByRole('button', { name: 'A' })).toBeInTheDocument()
    expect(within(firstQuestion).getByRole('button', { name: 'B' })).toBeInTheDocument()
    expect(within(firstQuestion).getByRole('button', { name: 'C' })).toBeInTheDocument()
    expect(within(firstQuestion).getByRole('button', { name: 'D' })).toBeInTheDocument()

    // Type 'a' into the focusable div
    firstQuestion.focus()
    await user.keyboard('a')

    expectQuestionValue(1, 'A')
    await waitFor(() => expect(screen.getByLabelText('Question 2')).toHaveFocus())
    
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].answers['1']).toBe('A')
  })

  test('ignores invalid answer keys', async () => {
    const user = userEvent.setup()
    render(<App />)

    const firstQuestion = screen.getByLabelText('Question 1')
    firstQuestion.focus()
    await user.keyboard('x')

    expectQuestionValue(1, '')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('clears an answer with Backspace and saves the change', async () => {
    const user = userEvent.setup()
    render(<App />)

    const question = screen.getByLabelText('Question 1')
    question.focus()
    await user.keyboard('c')
    expectQuestionValue(1, 'C')

    question.focus()
    await user.keyboard('{Backspace}')

    expectQuestionValue(1, '')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].answers['1']).toBe('')
  })

  test('does not crash when answering question 200', async () => {
    const user = userEvent.setup()
    render(<App />)

    const q200 = screen.getByLabelText('Question 200')
    q200.focus()
    await user.keyboard('d')

    expectQuestionValue(200, 'D')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].answers['200']).toBe('D')
  })

  test('debounces notebook saves to localStorage', async () => {
    vi.useFakeTimers()
    render(<App />)

    // Switch to Notebook tab
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])
    })

    fireEvent.change(screen.getByLabelText('Business Vocabulary'), {
      target: { value: 'contract' },
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    
    await act(async () => {
      vi.runAllTimers()
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].notes.businessVocabulary).toBe('contract')
  })

  test('creates a new exam set and keeps answers isolated per set', async () => {
    const user = userEvent.setup()
    render(<App />)

    const q1 = screen.getByLabelText('Question 1')
    q1.focus()
    await user.keyboard('a')

    await user.click(screen.getByRole('button', { name: /new test/i }))

    expect(screen.getByLabelText('Current Exam')).toHaveDisplayValue('TOEIC Test 2')
    expectQuestionValue(1, '')

    q1.focus()
    await user.keyboard('c')
    
    await user.selectOptions(screen.getByLabelText('Current Exam'), 'exam-1')

    expectQuestionValue(1, 'A')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams).toHaveLength(2)
  })

  test('renames the active exam set', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText('Exam Name'))
    await user.type(screen.getByLabelText('Exam Name'), 'ETS 2024 Test 01')

    expect(screen.getByLabelText('Current Exam')).toHaveDisplayValue('ETS 2024 Test 01')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].title).toBe('ETS 2024 Test 01')
  })

  test('toggles TOEIC grammar formulas and saves selected options', async () => {
    vi.useFakeTimers()
    render(<App />)

    // Switch to Notebook tab
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /perfect question/i }))
    })
    
    await act(async () => {
      vi.runOnlyPendingTimers()
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].notes.selectedGrammarFormulaIds).toContain('present-perfect-question')
  })

  test('shows TOEIC grammar formula definitions in notebook', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Switch to Notebook tab
    await user.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])

    expect(screen.getByTitle(/Have \+ S \+ V3/i)).toBeInTheDocument()
  })

  test('shows vocabulary suggestions from the free Datamuse API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { word: 'contract' },
          { word: 'contractor' },
          { word: 'contractual' },
        ],
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    // Switch to Notebook tab
    await user.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])

    await user.type(screen.getByLabelText('Vocabulary Search'), 'cont')

    expect(await screen.findByRole('button', { name: 'contract renewal' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /^contract$/i })).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith('https://api.datamuse.com/sug?s=cont&max=8', {
      signal: expect.any(AbortSignal),
    })
  })

  test('suggests common TOEIC vocabulary phrases from partial phrase search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    // Switch to Notebook tab
    await user.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])

    await user.type(screen.getByLabelText('Vocabulary Search'), 'meet the req')

    expect(await screen.findByRole('button', { name: 'meet the requirements' })).toBeInTheDocument()
  })

  test('adds a selected vocabulary suggestion to the vocabulary details view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url.includes('translate.googleapis.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([[['hóa đơn', 'invoice']]]),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            word: 'invoice',
            phonetic: '/ˈɪnvɔɪs/',
            meanings: [{
              definitions: [{ definition: 'A list of goods sent or services provided.' }]
            }]
          }]),
        })
      })
    )
    const user = userEvent.setup()
    render(<App />)

    // Switch to Notebook tab
    await user.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])

    await user.type(screen.getByLabelText('Vocabulary Search'), 'inv')
    await user.click(await screen.findByRole('button', { name: /^invoice$/i }))

    expect(await screen.findByText('hóa đơn')).toBeInTheDocument()
  })

  test('splits transcript into shadowing lines and tracks completed practice lines', async () => {
    vi.useFakeTimers()
    render(<App />)

    // Switch to Notebook tab
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /sổ tay/i })[0])
    })

    fireEvent.change(screen.getByLabelText('Transcript Shadowing'), {
      target: { value: 'Welcome to the meeting.\nPlease review the agenda.' },
    })

    expect(screen.getByRole('button', { name: /practice line 1/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /practice line 1/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /complete line 1/i }))

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.exams[0].notes.activeShadowingLine).toBe(0)
    expect(stored.exams[0].notes.completedShadowingLines).toContain(0)
  })

  test('exports the current progress as JSON backup', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:toeic-backup')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const user = userEvent.setup()

    render(<App />)
    const q1 = screen.getByLabelText('Question 1')
    q1.focus()
    await user.keyboard('b')
    await user.click(screen.getByRole('button', { name: /export json/i }))

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:toeic-backup')
  })
})
