import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

describe('TOEIC Progress SPA', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  test('loads 200 blank answers when localStorage is empty', () => {
    render(<App />)

    expect(screen.getAllByLabelText(/Question \d+/)).toHaveLength(200)
    expect(screen.getByLabelText('Question 1')).toHaveValue('')
    expect(screen.getByLabelText('Question 200')).toHaveValue('')
  })

  test('hydrates answers and notebook notes from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        answers: { 1: 'B', 200: 'D' },
        notes: {
          businessVocabulary: 'invoice, quarterly revenue',
          grammarTraps: 'subject verb agreement',
          transcriptShadowing: 'Could you repeat that?',
        },
        updatedAt: '2026-05-24T00:00:00.000Z',
      }),
    )

    render(<App />)

    expect(screen.getByLabelText('Question 1')).toHaveValue('B')
    expect(screen.getByLabelText('Question 200')).toHaveValue('D')
    expect(screen.getByLabelText('Business Vocabulary')).toHaveValue('invoice, quarterly revenue')
    expect(screen.getByLabelText('Grammar Traps')).toHaveValue('subject verb agreement')
    expect(screen.getByLabelText('Transcript Shadowing')).toHaveValue('Could you repeat that?')
  })

  test('normalizes valid answer entry to uppercase and focuses the next question', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Question 1'), 'a')

    expect(screen.getByLabelText('Question 1')).toHaveValue('A')
    await waitFor(() => expect(screen.getByLabelText('Question 2')).toHaveFocus())
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').answers['1']).toBe('A')
  })

  test('ignores invalid answer keys', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Question 1'), 'x')

    expect(screen.getByLabelText('Question 1')).toHaveValue('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('clears an answer with Backspace and saves the change', async () => {
    const user = userEvent.setup()
    render(<App />)

    const question = screen.getByLabelText('Question 1')
    await user.type(question, 'c')
    question.focus()
    await user.keyboard('{Backspace}')

    expect(question).toHaveValue('')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').answers['1']).toBe('')
  })

  test('does not crash when answering question 200', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Question 200'), 'd')

    expect(screen.getByLabelText('Question 200')).toHaveValue('D')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').answers['200']).toBe('D')
  })

  test('debounces notebook saves to localStorage', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.type(screen.getByLabelText('Business Vocabulary'), 'contract')

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').notes.businessVocabulary).toBe('contract')
    })
  })

  test('exports the current progress as JSON backup', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:toeic-backup')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const user = userEvent.setup()

    render(<App />)
    await user.type(screen.getByLabelText('Question 1'), 'b')
    await user.click(screen.getByRole('button', { name: /export json/i }))

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:toeic-backup')
  })
})
