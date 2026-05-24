import type { ReactNode } from 'react'

type SplitLayoutProps = {
  answerSheet: ReactNode
  notebook: ReactNode
}

export function SplitLayout({ answerSheet, notebook }: SplitLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-89px)] min-h-0 flex-col lg:flex-row">
      <section className="min-h-[55vh] border-b border-zinc-800 bg-zinc-900/70 lg:h-full lg:w-[40%] lg:border-b-0 lg:border-r">
        {answerSheet}
      </section>
      <section className="min-h-[55vh] bg-zinc-950 lg:h-full lg:w-[60%]">{notebook}</section>
    </div>
  )
}
