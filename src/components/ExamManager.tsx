import { Plus, Pencil, ChevronDown } from 'lucide-react'
import { memo } from 'react'
import type { ToeicExam, ToeicProgressData } from '../lib/toeic'
import { ExportButton } from './ExportButton'

type ExamManagerProps = {
  activeExam: ToeicExam
  exams: ToeicExam[]
  onCreateExam: () => void
  onRenameExam: (title: string) => void
  onSelectExam: (examId: string) => void
  progress: ToeicProgressData
}

export const ExamManager = memo(function ExamManager({
  activeExam,
  exams,
  onCreateExam,
  onRenameExam,
  onSelectExam,
  progress,
}: ExamManagerProps) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 w-full min-w-0">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 select-none">
        <span className="h-px w-3 bg-slate-300 dark:bg-zinc-800" />
        Exam Workspace Manager
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end w-full min-w-0">
        {/* Current Exam Dropdown Select */}
        <div className="flex flex-col gap-1 w-full sm:w-56 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider select-none pl-1">
            Chọn đề thi (Select Exam)
          </span>
          <label className="min-w-0 w-full block relative">
            <span className="sr-only">Current Exam</span>
            <select
              aria-label="Current Exam"
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 pl-3 pr-10 text-sm text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 cursor-pointer sleek-input font-medium appearance-none"
              onChange={(event) => onSelectExam(event.target.value)}
              value={activeExam.id}
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id} className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100">
                  {exam.title}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 text-slate-400 dark:text-zinc-500 pointer-events-none">
              <ChevronDown className="size-4" />
            </div>
          </label>
        </div>

        {/* Rename Exam Input field */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider select-none pl-1">
            Tên đề thi hiển thị (Exam Name)
          </span>
          <label className="min-w-0 w-full block relative">
            <span className="sr-only">Exam Name</span>
            <input
              aria-label="Exam Name"
              placeholder="Nhập tên đề thi mới..."
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 pl-3 pr-10 text-sm text-slate-800 dark:text-zinc-100 outline-none transition focus:border-indigo-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-indigo-500/25 dark:focus:ring-violet-500/25 sleek-input font-medium"
              onChange={(event) => onRenameExam(event.target.value)}
              value={activeExam.title}
            />
            <div className="absolute right-3 top-3 text-slate-400 dark:text-zinc-500 pointer-events-none">
              <Pencil className="size-4" />
            </div>
          </label>
        </div>

        {/* Actions Container */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          {/* Create Exam Button */}
          <button
            className="inline-flex h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-xl btn-primary px-5 text-xs font-bold transition spring-transition hover:scale-[1.02] active:scale-[0.97] shadow-sm cursor-pointer whitespace-nowrap"
            onClick={onCreateExam}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            New Test
          </button>

          <ExportButton progress={progress} />
        </div>
      </div>
    </div>
  )
})


