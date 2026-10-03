'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DataTablePagination as PaginationConfig } from './types'

type PaginationProps = { config: PaginationConfig; onPageChange?: (page: number) => void; onPageSizeChange?: (size: number) => void; onCursorChange?: (cursor: string | null) => void }

export function DataTablePagination({ config, onPageChange, onPageSizeChange, onCursorChange }: PaginationProps) {
  const pageIndex = config.pageIndex || 0
  const pageSize = config.pageSize || 25
  const totalPages = config.total ? Math.max(1, Math.ceil(config.total / pageSize)) : 1
  return <div className="flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span>Rows per page</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{(config.pageSizeOptions || [10, 25, 50]).map((size) => <option key={size} value={size}>{size}</option>)}</select></div>{config.mode === 'page' ? <div className="flex items-center gap-3"><span>Page {pageIndex + 1} of {totalPages}</span><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Previous page" disabled={pageIndex <= 0} onClick={() => onPageChange?.(pageIndex - 1)}><ChevronLeft size={15} /></Button><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Next page" disabled={pageIndex >= totalPages - 1} onClick={() => onPageChange?.(pageIndex + 1)}><ChevronRight size={15} /></Button></div> : <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={!config.previousCursor} onClick={() => onCursorChange?.(config.previousCursor || null)}><ChevronLeft size={15} />Previous</Button><Button variant="outline" size="sm" disabled={!config.nextCursor} onClick={() => onCursorChange?.(config.nextCursor || null)}>Next<ChevronRight size={15} /></Button></div>}</div>
}
