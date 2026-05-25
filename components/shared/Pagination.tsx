import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page:         number
  totalPages:   number
  totalItems:   number
  pageSize:     number
  onPageChange: (p: number) => void
}

export default function Pagination({
  page, totalPages, totalItems, pageSize, onPageChange,
}: PaginationProps) {
  const from = totalItems === 0 ? 0 : Math.min((page - 1) * pageSize + 1, totalItems)
  const to   = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
      <span className="text-xs text-neutral-400">
        {totalItems === 0 ? 'No results' : `Showing ${from}–${to} of ${totalItems}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center
            text-neutral-400 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
              ${page === num
                ? 'bg-brand-600 text-white'
                : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center
            text-neutral-400 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
