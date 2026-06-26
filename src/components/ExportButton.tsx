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
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl btn-glass px-5 text-xs font-bold transition spring-transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm w-full sm:w-auto whitespace-nowrap shrink-0"
      onClick={handleExport}
      type="button"
    >
      <Download aria-hidden="true" className="size-4" />
      Export JSON
    </button>
  )


})
