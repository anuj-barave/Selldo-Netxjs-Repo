'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DataTablePagination as PaginationConfig } from './types'

type PaginationProps = {
  config: PaginationConfig
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onCursorChange?: (cursor: string | null) => void
}

function buildPageWindow(current: number, totalPages: number, size = 5): number[] {
  if (totalPages <= size) return Array.from({ length: totalPages }, (_, index) => index)
  const half = Math.floor(size / 2)
  let start = Math.max(0, current - half)
  const end = Math.min(totalPages, start + size)
  start = Math.max(0, end - size)
  return Array.from({ length: end - start }, (_, index) => start + index)
}

export function DataTablePagination({ config, onPageChange, onPageSizeChange, onCursorChange }: PaginationProps) {
  const pageIndex = config.pageIndex || 0
  const pageSize = config.pageSize || 25
  const total = config.total ?? 0
  const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(total, (pageIndex + 1) * pageSize)
  const pages = useMemo(() => buildPageWindow(pageIndex, totalPages, 5), [pageIndex, totalPages])
  const isFirst = pageIndex <= 0
  const isLast = pageIndex >= totalPages - 1

  if (config.mode === 'cursor') {
    return (
      <div className="flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span>Results per page</span>
          <select aria-label="Results per page" value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
            {(config.pageSizeOptions || [10, 25, 50]).map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!config.previousCursor} onClick={() => onCursorChange?.(config.previousCursor || null)}><ChevronLeft size={15} />Previous</Button>
          <Button variant="outline" size="sm" disabled={!config.nextCursor} onClick={() => onCursorChange?.(config.nextCursor || null)}>Next<ChevronRight size={15} /></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 text-sm">
        Showing <span className="font-medium text-foreground">{start}</span> - <span className="font-medium text-foreground">{end}</span> of <span className="font-medium text-foreground">{total}</span> items
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span>Results per page</span>
          <select aria-label="Results per page" value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
            {(config.pageSizeOptions || [10, 25, 50]).map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium" disabled={isFirst} onClick={() => onPageChange?.(0)} aria-label="First page">First</Button>
          {pages.map((page) => {
            const isActive = page === pageIndex
            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 text-xs font-medium ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                onClick={() => onPageChange?.(page)}
                aria-label={`Page ${page + 1}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page + 1}
              </Button>
            )
          })}
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium" disabled={isLast} onClick={() => onPageChange?.(totalPages - 1)} aria-label="Last page">Last</Button>
        </div>
      </div>
    </div>
  )
}
