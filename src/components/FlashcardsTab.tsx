import { useState, useMemo, useCallback, useEffect } from 'react'
import { Award, BookOpen, ChevronLeft, ChevronRight, Keyboard, Zap } from 'lucide-react'
import type { FlashcardItem } from '../types'
import { FlashcardStats } from './flashcard/FlashcardStats'
import { FlashcardDeck } from './flashcard/FlashcardDeck'
import { CustomDialog } from './CustomDialog'

type FlashcardsTabProps = {
  flashcards: FlashcardItem[]
  onUpdateCard: (card: FlashcardItem) => void
  onDeleteCard: (id: string) => void
  onAddCard: (
    word: string,
    phonetic: string,
    definition: string,
    translation: string,
    example: string
  ) => void
  apiKey?: string
  leitnerIntervals?: number[]
  
  // Config States
  reviewMode: 'due' | 'all'
  setReviewMode: (mode: 'due' | 'all') => void
  studyMode: 'review' | 'spelling'
  setStudyMode: (mode: 'review' | 'spelling') => void
  showStarredOnly: boolean
  setShowStarredOnly: (show: boolean) => void
  isShuffled: boolean
  setIsShuffled: (shuffle: boolean) => void
  autoPronounce: boolean
  setAutoPronounce: (pronounce: boolean) => void
  cramMode: boolean
  setCramMode: (cram: boolean) => void
}

export function FlashcardsTab({
  flashcards,
  onUpdateCard,
  onDeleteCard,
  leitnerIntervals,
  reviewMode,
  studyMode,
  showStarredOnly,
  setShowStarredOnly,
  isShuffled,
  autoPronounce,
  cramMode,
  setCramMode,
}: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Dialog state
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean
    message: string
    type: 'alert' | 'confirm'
    onConfirm: () => void
    variant?: 'info' | 'warning' | 'danger'
  }>({
    isOpen: false,
    message: '',
    type: 'alert',
    onConfirm: () => {},
    variant: 'info'
  })

  // Leitner system intervals
  const intervals = useMemo(() => {
    return leitnerIntervals || [
      60 * 1000, // Box 1: 1 min
      10 * 60 * 1000, // Box 2: 10 min
      24 * 60 * 60 * 1000, // Box 3: 1 day
      4 * 24 * 60 * 60 * 1000, // Box 4: 4 days
      10 * 24 * 60 * 60 * 1000, // Box 5: 10 days
    ]
  }, [leitnerIntervals])

  // Filter due cards
  const dueCards = useMemo(() => {
    const now = new Date()
    return flashcards.filter((card) => new Date(card.nextReview) <= now)
  }, [flashcards])

  // Active Deck creation based on filters
  const activeDeck = useMemo(() => {
    let deck = [...flashcards]
    
    // 1. Apply Due vs All filter (cramMode overrides due filter to show all cards)
    if (reviewMode === 'due' && !cramMode) {
      deck = dueCards
    }

    // 2. Apply Starred Only filter
    if (showStarredOnly) {
      deck = deck.filter((card) => card.starred)
    }

    return deck
  }, [flashcards, dueCards, reviewMode, showStarredOnly, cramMode])

  // Shuffled mapping logic to avoid breaking index when switching shuffle state
  const shuffledIndices = useMemo(() => {
    const indices = Array.from({ length: activeDeck.length }, (_, i) => i)
    if (isShuffled && activeDeck.length > 0) {
      const seedStr = activeDeck.map(c => c.id).join('-')
      let seed = 0
      for (let i = 0; i < seedStr.length; i++) {
        seed = (seed << 5) - seed + seedStr.charCodeAt(i)
        seed |= 0
      }
      const random = () => {
        const x = Math.sin(seed++) * 10000
        return x - Math.floor(x)
      }
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
    }
    return indices
  }, [activeDeck, isShuffled])

  // Get current active card
  const currentCardIndex = shuffledIndices[currentIndex] ?? 0
  const currentCard = activeDeck[currentCardIndex] || null

  useEffect(() => {
    setCurrentIndex(0)
  }, [activeDeck.length, isShuffled, studyMode])

  const handleNext = useCallback(() => {
    if (activeDeck.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % activeDeck.length)
  }, [activeDeck.length])

  const handlePrev = useCallback(() => {
    if (activeDeck.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length)
  }, [activeDeck.length])

  // Grade/Leitner Box update
  const handleGrade = useCallback((grade: 'again' | 'good' | 'easy') => {
    if (!currentCard) return

    if (!cramMode) {
      let nextBox = currentCard.box
      if (grade === 'again') {
        nextBox = 1
      } else if (grade === 'good') {
        nextBox = Math.min(5, currentCard.box + 1)
      } else if (grade === 'easy') {
        nextBox = Math.min(5, currentCard.box + 2)
      }

      const interval = intervals[nextBox - 1]
      const nextReviewTime = new Date(Date.now() + interval)

      const updatedCard: FlashcardItem = {
        ...currentCard,
        box: nextBox,
        nextReview: nextReviewTime.toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onUpdateCard(updatedCard)
    }

    // Move to next card
    if (activeDeck.length > 1) {
      setTimeout(() => {
        if (currentIndex >= activeDeck.length - 1) {
          setCurrentIndex(0)
        } else {
          setCurrentIndex((prev) => prev + 1)
        }
      }, 250)
    }
  }, [currentCard, activeDeck.length, currentIndex, onUpdateCard, intervals, cramMode])

  // Handle Star/Starred toggle
  const handleToggleStar = useCallback((e: React.MouseEvent, card: FlashcardItem) => {
    e.stopPropagation()
    const updatedCard: FlashcardItem = {
      ...card,
      starred: !card.starred,
      updatedAt: new Date().toISOString(),
    }
    onUpdateCard(updatedCard)
  }, [onUpdateCard])

  // Delete card handler
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCustomDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa thẻ từ vựng này khỏi Sổ tay Flashcard của bạn không? Hành động này sẽ không thể hoàn tác.',
      type: 'confirm',
      variant: 'danger',
      onConfirm: () => {
        onDeleteCard(id)
        if (currentIndex >= activeDeck.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
        setCustomDialog((prev) => ({ ...prev, isOpen: false }))
      }
    })
  }, [activeDeck.length, currentIndex, onDeleteCard])

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      if (!currentCard) return

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePrev()
          break
        case 's':
        case 'S': {
          e.preventDefault()
          const mockEvent = { stopPropagation: () => {} } as React.MouseEvent
          handleToggleStar(mockEvent, currentCard)
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCard, handleNext, handlePrev, handleToggleStar])

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent select-none">
      {/* Compact Header */}
      <div className="border-b border-slate-200/85 dark:border-zinc-800/85 px-4 py-2.5 sm:px-6 shrink-0 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Thẻ Từ Vựng (Flashcards)</h2>
          {cramMode && (
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 animate-pulse">
              <Zap className="size-3 fill-amber-500" />
              Cram Mode
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="min-h-0 flex-1 flex flex-col px-3 pt-3 pb-3 sm:px-5 bg-slate-50/30 dark:bg-transparent gap-3">
        <div className="mx-auto w-full max-w-lg flex flex-col flex-1 min-h-0 gap-3">
          
          {/* Leitner Box Stats */}
          <FlashcardStats flashcards={flashcards} />

          {currentCard ? (
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              {/* Card Deck with 3D tilts and gestures */}
              <div className="w-full flex-1 min-h-0">
                <FlashcardDeck
                  currentCard={currentCard}
                  studyMode={studyMode}
                  onGrade={handleGrade}
                  onToggleStar={handleToggleStar}
                  onDeleteCard={handleDelete}
                  autoPronounce={autoPronounce}
                  cramMode={cramMode}
                />
              </div>

              {/* Navigation and inline grade rating buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Prev/Next buttons */}
                <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-zinc-950/60 px-2 py-1.5 rounded-xl border border-slate-200/10 shrink-0">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition active:scale-[0.92] cursor-pointer"
                    aria-label="Thẻ trước"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[11px] font-black tracking-wider tabular-nums px-1 text-slate-600 dark:text-zinc-300">
                    {currentIndex + 1} / {activeDeck.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition active:scale-[0.92] cursor-pointer"
                    aria-label="Thẻ tiếp theo"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Rating buttons for quick grading in review mode */}
                {studyMode === 'review' && (
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={() => handleGrade('again')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-405 py-2 rounded-xl hover:bg-rose-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Again</span>
                    </button>
                    <button
                      onClick={() => handleGrade('good')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-405 py-2 rounded-xl hover:bg-amber-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Good</span>
                    </button>
                    <button
                      onClick={() => handleGrade('easy')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-405 py-2 rounded-xl hover:bg-emerald-500/20 transition active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase">Easy</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider shrink-0 select-none">
                <span className="flex items-center gap-1"><Keyboard className="size-3" /> [Space] Lật / [Enter] Check</span>
                <span>[1] Again · [2] Good · [3] Easy</span>
              </div>
            </div>
          ) : (
            <div className="text-center glass-panel rounded-3xl p-8 shadow-sm space-y-4 border border-indigo-500/10 animate-in fade-in duration-300">
              <div className="mx-auto size-16 bg-gradient-to-tr from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-violet-400 border border-indigo-100/10">
                {reviewMode === 'due' && !cramMode ? <Award className="size-8 animate-bounce" /> : <BookOpen className="size-8" />}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  {showStarredOnly
                    ? 'Không tìm thấy thẻ nào được gắn sao ⭐'
                    : reviewMode === 'due' && !cramMode
                    ? 'Bạn đã ôn tập xong tất cả!'
                    : 'Chưa có thẻ flashcard nào'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {showStarredOnly
                    ? 'Hãy gắn sao một số từ khó nhớ bằng cách nhấn vào biểu tượng ngôi sao trên thẻ để học riêng chúng.'
                    : reviewMode === 'due' && !cramMode
                    ? 'Tất cả các từ vựng đã được ôn tập đầy đủ. Hãy quay lại sau hoặc kích hoạt Cram Mode để ôn tập cấp tốc.'
                    : 'Hãy đi tới tab Sổ Tay (Notebook) và nhấn nút thêm từ vựng mới vào Flashcards của bạn.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
                {showStarredOnly && (
                  <button
                    onClick={() => setShowStarredOnly(false)}
                    className="text-xs font-black text-indigo-600 dark:text-violet-400 bg-indigo-50 dark:bg-violet-500/10 hover:bg-indigo-100 dark:hover:bg-violet-500/20 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Xem tất cả các thẻ
                  </button>
                )}
                {reviewMode === 'due' && !cramMode && flashcards.length > 0 && (
                  <button
                    onClick={() => setCramMode(true)}
                    className="text-xs font-black text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Zap className="size-3.5 fill-current" />
                    Bật Cram Mode ôn thi cấp tốc ({flashcards.length} từ)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Alert/Confirm Dialog */}
      <CustomDialog
        isOpen={customDialog.isOpen}
        message={customDialog.message}
        type={customDialog.type}
        variant={customDialog.variant}
        onConfirm={customDialog.onConfirm}
        onCancel={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
