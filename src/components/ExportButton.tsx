import { Download } from 'lucide-react'
import { memo, useCallback } from 'react'
import { getBackupFilename } from '../lib/storage'
import type { ToeicProgressData } from '../lib/toeic'

type ExportButtonProps = {
  progress: ToeicProgressData
}

export const ExportButton = memo(function ExportButton({ progress }: ExportButtonProps) {
  const handleExport = useCallback(() => {
    const backup = {
      ...progress,
      updatedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = getBackupFilename()
    link.click()
    URL.revokeObjectURL(url)
  }, [progress])

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-zinc-950"
      onClick={handleExport}
      type="button"
    >
      <Download aria-hidden="true" className="size-4" />
      Export JSON
    </button>
  )
})
