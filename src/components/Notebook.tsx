import { memo } from 'react'
import type { NoteKey, ToeicProgressData } from '../lib/toeic'

type NotebookProps = {
  notes: ToeicProgressData['notes']
  onNoteChange: (key: NoteKey, value: string) => void
}

const NOTEBOOK_FIELDS: Array<{
  key: NoteKey
  label: string
  placeholder: string
}> = [
  {
    key: 'businessVocabulary',
    label: 'Business Vocabulary',
    placeholder: 'invoice, merger, reimbursement...',
  },
  {
    key: 'grammarTraps',
    label: 'Grammar Traps',
    placeholder: 'subject-verb agreement, reduced clauses...',
  },
  {
    key: 'transcriptShadowing',
    label: 'Transcript Shadowing',
    placeholder: 'Paste transcript lines and shadow them aloud...',
  },
]

export const Notebook = memo(function Notebook({ notes, onNoteChange }: NotebookProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-white">Notebook</h2>
        <p className="text-sm text-zinc-400">Notes auto-save after you pause typing.</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-3 gap-4 overflow-y-auto px-4 py-4 sm:px-6">
        {NOTEBOOK_FIELDS.map((field) => (
          <label key={field.key} className="flex min-h-[14rem] flex-col gap-2">
            <span className="text-sm font-medium text-zinc-200">{field.label}</span>
            <textarea
              aria-label={field.label}
              className="min-h-0 flex-1 resize-none rounded border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
              onChange={(event) => onNoteChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              value={notes[field.key]}
            />
          </label>
        ))}
      </div>
    </div>
  )
})
