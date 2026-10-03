'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { displayValue, getValueAtPath, resolveHref } from './utils'
import type { DataTableColumn, DataTableFeatures, DataTableRowActions } from './types'

type DataTableCardListProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  features?: DataTableFeatures
  rowActions?: DataTableRowActions<T>
  getRowId: (row: T, index: number) => string
  selectedIds: string[]
  expandedIds: string[]
  mobileCardFields?: string[]
  onToggleSelected: (row: T, selected: boolean) => void
  onToggleExpanded: (row: T) => void
  renderExpandedRow?: (row: T) => React.ReactNode
  onAction?: (actionId: string, row: T) => void
}

export function DataTableCardList<T>({ data, columns, features = {}, rowActions, getRowId, selectedIds, expandedIds, mobileCardFields, onToggleSelected, onToggleExpanded, renderExpandedRow, onAction }: DataTableCardListProps<T>) {
  const cardColumns = columns.filter((column) => !mobileCardFields || mobileCardFields.includes(column.id)).filter((column) => column.visibleByDefault !== false)
  return (
    <div className="space-y-3 md:hidden">
      {data.length === 0 ? <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No records found</div> : data.map((row, index) => {
        const id = getRowId(row, index)
        const selected = selectedIds.includes(id)
        const expanded = expandedIds.includes(id)
        const viewHref = resolveHref(rowActions?.view?.href, row)
        const editHref = resolveHref(rowActions?.edit?.href, row)
        return <div key={id} className="overflow-hidden rounded-xl border bg-card shadow-sm" data-state={selected ? 'selected' : undefined}>
          <div className="flex items-start gap-3 p-4">
            {features.selection !== false && <Checkbox aria-label={`Select row ${id}`} checked={selected} onCheckedChange={(value) => onToggleSelected(row, Boolean(value))} className="mt-0.5" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {cardColumns.slice(0, 2).map((column) => <div key={column.id} className={column === cardColumns[0] ? 'truncate text-sm font-semibold text-foreground' : 'mt-1 truncate text-xs text-muted-foreground'}>{column.cell ? column.cell({ row: { original: row } as never, value: getValueAtPath(row, column.accessorKey || column.id) }) : displayValue(getValueAtPath(row, column.accessorKey || column.id))}</div>)}
                </div>
                {features.expandableRows && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={expanded ? 'Collapse row' : 'Expand row'} aria-expanded={expanded} onClick={() => onToggleExpanded(row)}>{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Button>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {cardColumns.slice(2).map((column) => <div key={column.id} className="min-w-0"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{column.label}</div><div className="truncate text-sm text-foreground">{column.cell ? column.cell({ row: { original: row } as never, value: getValueAtPath(row, column.accessorKey || column.id) }) : displayValue(getValueAtPath(row, column.accessorKey || column.id))}</div></div>)}
              </div>
              {(viewHref || editHref || rowActions?.menu?.length) && <div className="mt-4 flex items-center gap-2 border-t pt-3"><span className="text-xs text-muted-foreground">Actions</span>{viewHref && <a href={viewHref} className="text-xs font-medium text-primary hover:underline">View</a>}{editHref && <a href={editHref} className="text-xs font-medium text-primary hover:underline">Edit</a>}{rowActions?.menu?.map((action) => <button key={action.id} type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => { action.onSelect?.(row); onAction?.(action.id, row) }}>{action.label}</button>)}</div>}
            </div>
          </div>
          {expanded && renderExpandedRow?.(row)}
        </div>
      })}
    </div>
  )
}
