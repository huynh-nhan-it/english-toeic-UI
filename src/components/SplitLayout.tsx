import type { ReactNode } from 'react'

type SplitLayoutProps = {
  answerSheet: ReactNode
  notebook: ReactNode
}

export function SplitLayout({ answerSheet, notebook }: SplitLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="min-h-0 flex-1 border-b border-zinc-800 bg-zinc-900/70 lg:h-full lg:w-[40%] lg:border-b-0 lg:border-r">
        {answerSheet}
      </section>
      <section className="min-h-0 flex-1 bg-zinc-950 lg:h-full lg:w-[60%]">{notebook}</section>
    </div>
  )
}
