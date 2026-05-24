import { Plus } from 'lucide-react'
import { memo } from 'react'
import type { ToeicExam } from '../lib/toeic'

type ExamManagerProps = {
  activeExam: ToeicExam
  exams: ToeicExam[]
  onCreateExam: () => void
  onRenameExam: (title: string) => void
  onSelectExam: (examId: string) => void
}

export const ExamManager = memo(function ExamManager({
  activeExam,
  exams,
  onCreateExam,
  onRenameExam,
  onSelectExam,
}: ExamManagerProps) {
  return (
    <div className="flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-900/70 p-3 sm:min-w-72">
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
        Current Exam
        <select
          aria-label="Current Exam"
          className="h-9 rounded border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
          onChange={(event) => onSelectExam(event.target.value)}
          value={activeExam.id}
        >
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Exam Name</span>
          <input
            aria-label="Exam Name"
            className="h-9 w-full rounded border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25"
            onChange={(event) => onRenameExam(event.target.value)}
            value={activeExam.title}
          />
        </label>
        <button
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          onClick={onCreateExam}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          New Test
        </button>
      </div>
    </div>
  )
})
