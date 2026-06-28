import { useMemo } from 'react'
import { Layers } from 'lucide-react'
import type { FlashcardItem } from '../../types'

type FlashcardStatsProps = {
  flashcards: FlashcardItem[]
}

export function FlashcardStats({ flashcards }: FlashcardStatsProps) {
  const boxColors = [
    'bg-rose-500 dark:bg-rose-500/80',
    'bg-orange-500 dark:bg-orange-500/80',
    'bg-amber-500 dark:bg-amber-500/80',
    'bg-sky-500 dark:bg-sky-500/80',
    'bg-emerald-500 dark:bg-emerald-500/80'
  ]

  const boxNames = ['Hộp 1', 'Hộp 2', 'Hộp 3', 'Hộp 4', 'Hộp 5']

  const stats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    flashcards.forEach((card) => {
      const bIdx = Math.max(1, Math.min(5, card.box)) - 1
      counts[bIdx]++
    })
    return counts
  }, [flashcards])

  // Generate 8 weeks (56 days) contribution heatmap data
  const heatmapData = useMemo(() => {
    const dates: { date: Date; count: number }[] = []
    const now = new Date()
    for (let i = 55; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      dates.push({ date: d, count: 0 })
    }

    flashcards.forEach((card) => {
      const createdDateStr = new Date(card.createdAt).toDateString()
      const updatedDateStr = new Date(card.updatedAt).toDateString()

      dates.forEach((d) => {
        const dStr = d.date.toDateString()
        if (createdDateStr === dStr) {
          d.count += 1
        }
        if (updatedDateStr === dStr && card.box > 1) {
          d.count += 1
        }
      })
    })

    return dates
  }, [flashcards])

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-sm shrink-0 select-none space-y-4">
      {/* Top: Box Bars */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-wider shrink-0">
          <Layers className="size-4 text-violet-500 dark:text-cyan-400" />
          Hộp Leitner
        </div>
        <div className="flex flex-1 gap-2 w-full">
          {stats.map((count, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 animate-in slide-in-from-bottom-2 duration-200">
              <div className="h-9 w-full bg-slate-100/50 dark:bg-zinc-950/60 rounded-xl relative overflow-hidden flex items-end border border-slate-200/20 dark:border-zinc-800">
                <div
                  className={`w-full ${boxColors[idx]} opacity-70 dark:opacity-40 transition-all duration-700`}
                  style={{ height: `${flashcards.length > 0 ? (count / flashcards.length) * 100 : 0}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800 dark:text-zinc-200">
                  {count}
                </span>
              </div>
              <span className="text-[8px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-wider">{boxNames[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Contribution Grid Heatmap */}
      <div className="border-t border-slate-100 dark:border-zinc-900/60 pt-3 text-left">
        <div className="flex items-center justify-between mb-2 select-none">
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
            Lịch sử học tập (8 tuần)
          </span>
          <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold block">
            Tổng: {flashcards.length} từ vựng
          </span>
        </div>
        
        {/* Heatmap grid squares */}
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
          {heatmapData.map((d, idx) => {
            let color = 'bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/30 dark:border-zinc-800/55'
            if (d.count > 0 && d.count <= 2) {
              color = 'bg-indigo-500/20 dark:bg-violet-500/20 border border-indigo-500/30'
            } else if (d.count > 2 && d.count <= 5) {
              color = 'bg-indigo-500/50 dark:bg-violet-500/55 border border-indigo-500/40'
            } else if (d.count > 5) {
              color = 'bg-indigo-600 dark:bg-violet-500'
            }

            const formattedDate = d.date.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })

            return (
              <div
                key={idx}
                title={`${formattedDate}: ${d.count} hoạt động`}
                className={`size-3 rounded transition duration-200 hover:scale-125 cursor-pointer ${color}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
