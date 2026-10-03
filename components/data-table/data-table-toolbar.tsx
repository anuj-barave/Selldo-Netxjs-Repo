'use client'

import { useEffect, useState } from 'react'
import { Download, ListFilter, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { DataTableColumn, DataTableFeatures } from './types'

type DataTableToolbarProps<T> = {
  columns: DataTableColumn<T>[]
  features: DataTableFeatures
  search: string
  activeFilterCount: number
  visibleColumns: Record<string, boolean>
  onSearchChange: (value: string) => void
  onFilterClear: () => void
  onRefresh?: () => void
  onAdd?: () => void
  onExport?: () => void
  onToggleColumn: (id: string, visible: boolean) => void
  filterPanel?: React.ReactNode
  addLabel?: string
}

export function DataTableToolbar<T>({ columns, features, search, activeFilterCount, visibleColumns, onSearchChange, onFilterClear, onRefresh, onAdd, onExport, onToggleColumn, filterPanel, addLabel = 'Add' }: DataTableToolbarProps<T>) {
  const [draft, setDraft] = useState(search)
  useEffect(() => setDraft(search), [search])
  useEffect(() => {
    const timer = window.setTimeout(() => { if (draft !== search) onSearchChange(draft) }, 300)
    return () => window.clearTimeout(timer)
  }, [draft, onSearchChange, search])
  const hideableColumns = columns.filter((column) => column.hideable !== false)
  return (
    <div className="flex flex-col gap-3 border-b bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {features.search !== false && <div className="relative min-w-[220px] flex-1 sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search records..." aria-label="Search records" className="h-9 pl-9" />{draft && <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search" onClick={() => setDraft('')}><X size={14} /></button>}</div>}
        {features.filters !== false && filterPanel && <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-9 gap-2"><ListFilter size={15} />Filters{activeFilterCount > 0 && <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">{activeFilterCount}</Badge>}</Button></PopoverTrigger><PopoverContent align="start" className="w-[320px] p-0">{filterPanel}</PopoverContent></Popover>}
        {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={onFilterClear}><X size={14} />Clear filters</Button>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {features.columnVisibility !== false && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 gap-2"><SlidersHorizontal size={15} />Columns</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Visible columns</DropdownMenuLabel><DropdownMenuSeparator />{hideableColumns.map((column) => <DropdownMenuCheckboxItem key={column.id} checked={visibleColumns[column.id] !== false} onCheckedChange={(value) => onToggleColumn(column.id, Boolean(value))}>{column.label}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>}
        {features.refresh !== false && <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Refresh" onClick={onRefresh}><RefreshCw size={15} /></Button>}
        {features.export && <Button variant="outline" size="sm" className="h-9 gap-2" onClick={onExport}><Download size={15} />Export</Button>}
        {features.add !== false && <Button size="sm" className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onAdd}><Plus size={15} />{addLabel}</Button>}
      </div>
    </div>
  )
}
