import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { generateAiFlashcards } from '../../services/gemini.service'
import type { FlashcardItem } from '../../types'

interface DialogConfig {
  isOpen: boolean
  title?: string
  message: string
  type: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'info' | 'warning' | 'danger'
}

type FlashcardGeneratorPanelProps = {
  apiKey?: string
  flashcards: FlashcardItem[]
  onAddCard: (w: string, p: string, d: string, t: string, e: string) => void
  setDialog: (d: DialogConfig | ((prev: DialogConfig) => DialogConfig)) => void
}

export function FlashcardGeneratorPanel({
  apiKey,
  flashcards,
  onAddCard,
  setDialog,
}: FlashcardGeneratorPanelProps) {
  const [aiWordCount, setAiWordCount] = useState(10)
  const [isGeneratingAiWords, setIsGeneratingAiWords] = useState(false)

  const handleGenerateAiWords = async () => {
    if (!apiKey || !apiKey.trim()) {
      setDialog({
        isOpen: true,
        message: 'Khóa API Gemini trống. Vui lòng truy cập tab "Cài đặt" để cấu hình khóa API Google Gemini AI trước khi sử dụng tính năng này.',
        type: 'alert',
        variant: 'warning',
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false }))
      })
      return
    }

    setIsGeneratingAiWords(true)
    try {
      const existing = flashcards.map((c) => c.word)
      const newCards = await generateAiFlashcards(apiKey, existing, aiWordCount)

      if (newCards.length === 0) {
        throw new Error('AI không sinh được từ vựng nào mới. Vui lòng thử lại.')
      }

      newCards.forEach((card) => {
        onAddCard(
          card.word,
          card.phonetic,
          card.definition,
          card.translation,
          card.example
        )
      })

      setDialog({
        isOpen: true,
        message: `Đã sinh thành công và thêm ${newCards.length} từ vựng TOEIC mới nhất bằng AI vào bộ Flashcards của bạn.`,
        type: 'alert',
        variant: 'info',
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false }))
      })
    } catch (err: unknown) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi sinh từ vựng bằng AI. Vui lòng thử lại.'
      setDialog({
        isOpen: true,
        message: errMsg,
        type: 'alert',
        variant: 'danger',
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false }))
      })
    } finally {
      setIsGeneratingAiWords(false)
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-sm border border-violet-500/15 dark:border-violet-500/25 bg-gradient-to-br from-white/40 to-slate-50/20 dark:from-[#0f1020]/40 dark:to-[#0b0c16]/20 relative overflow-hidden mt-4 text-left">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/0 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-violet-300 uppercase tracking-wider select-none">
          <Sparkles className="size-4 text-violet-500 dark:text-violet-400 animate-pulse" />
          Sinh Từ Vựng AI
        </div>
        <span className="text-[9px] text-indigo-600 dark:text-cyan-400 font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded select-none">
          Gemini 2.5
        </span>
      </div>
      
      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
        Tự động sinh từ vựng TOEIC mới nhất (kèm phiên âm IPA, nghĩa Anh/Việt và ví dụ ngữ cảnh) và thêm trực tiếp vào bộ thẻ của bạn.
      </p>
      
      <div className="space-y-3.5 select-none">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black text-slate-600 dark:text-zinc-300">
            Số lượng từ (Tối đa 20):
          </span>
          <div className="flex bg-slate-100 dark:bg-zinc-950/80 p-0.5 rounded-xl border border-slate-200/30 dark:border-zinc-800">
            {[5, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setAiWordCount(num)}
                disabled={isGeneratingAiWords}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer disabled:opacity-50 ${
                  aiWordCount === num
                    ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleGenerateAiWords}
          disabled={isGeneratingAiWords}
          className="w-full relative flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition shadow-md shadow-indigo-500/5 disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
        >
          {isGeneratingAiWords ? (
            <>
              <RefreshCw className="size-3.5 animate-spin text-white" />
              <span>Đang tạo từ...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-white" />
              <span>Tạo và Thêm</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
