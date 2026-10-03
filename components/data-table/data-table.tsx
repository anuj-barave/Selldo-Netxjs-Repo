'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnPinningState,
  type ExpandedState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Pencil, Eye } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { displayValue, getIcon, getValueAtPath, resolveHref, SortIcon } from './utils'
import type { DataTableColumn, DataTableFeatures, DataTableRowActions } from './types'

type DataTableProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  features?: DataTableFeatures
  rowActions?: DataTableRowActions<T>
  getRowId?: (row: T, index: number) => string
  getRowCanExpand?: (row: T) => boolean
  renderExpandedRow?: (row: Row<T>) => React.ReactNode
  onSortChange?: (sort?: { id: string; desc: boolean }) => void
  onSelectionChange?: (rows: T[]) => void
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  onExpandedChange?: (expanded: ExpandedState) => void
  expandedIds?: string[]
  onExpandedIdsChange?: (ids: string[]) => void
  onAction?: (actionId: string, row: T) => void
  onRowClick?: (row: T) => void
  initialColumnVisibility?: Record<string, boolean>
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  initialColumnSizing?: Record<string, number>
  persistKey?: string
  loading?: boolean
  emptyMessage?: string
  colSpan?: number
}

function pinStyle(column: { getIsPinned: () => false | 'left' | 'right'; getStart: (position: 'left' | 'right') => number; getAfter: (position: 'left' | 'right') => number; getSize: () => number }) {
  const pinned = column.getIsPinned()
  return {
    width: column.getSize(),
    minWidth: column.getSize(),
    maxWidth: column.getSize(),
    position: pinned ? 'sticky' as const : 'relative' as const,
    left: pinned === 'left' ? column.getStart('left') : undefined,
    right: pinned === 'right' ? column.getAfter('right') : undefined,
    zIndex: pinned ? 2 : 1,
    backgroundColor: pinned ? 'hsl(var(--card))' : undefined,
    boxShadow: pinned === 'left' ? '2px 0 0 hsl(var(--border) / 0.7)' : pinned === 'right' ? '-2px 0 0 hsl(var(--border) / 0.7)' : undefined,
  }
}

function cellAlign(align?: DataTableColumn<unknown>['align']) {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
}

function bodyCellClass(column: DataTableColumn<unknown>) {
  return `${cellAlign(column.align)} ${column.overflow === 'wrap' ? 'whitespace-normal' : 'truncate'}`
}

export function DataTable<T>({
  data,
  columns,
  features = {},
  rowActions,
  getRowId = (row, index) => String((row as { id?: string | number })?.id ?? index),
  getRowCanExpand,
  renderExpandedRow,
  onSortChange,
  onSelectionChange,
  selectedIds,
  onSelectedIdsChange,
  onExpandedChange,
  expandedIds,
  onExpandedIdsChange,
  onAction,
  onRowClick,
  initialColumnVisibility,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  initialColumnSizing,
  persistKey = 'sell-do-table',
  loading = false,
  emptyMessage = 'No records found',
  colSpan,
}: DataTableProps<T>) {
  const canSelect = features.selection !== false
  const canExpand = Boolean(features.expandableRows)
  const canSort = features.sorting !== false
  const canResize = features.columnSizing !== false
  const canPin = features.pinning !== false
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return initialColumnVisibility || {}
    try {
      return JSON.parse(window.localStorage.getItem(`${persistKey}:visibility`) || 'null') || initialColumnVisibility || {}
    } catch { return initialColumnVisibility || {} }
  })
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return initialColumnSizing || {}
    try {
      return JSON.parse(window.localStorage.getItem(`${persistKey}:sizing`) || 'null') || initialColumnSizing || {}
    } catch { return initialColumnSizing || {} }
  })

  const pinning = useMemo<ColumnPinningState>(() => ({
    left: canPin ? columns.filter((column) => column.pin === 'left').map((column) => column.id) : [],
    right: canPin ? columns.filter((column) => column.pin === 'right').map((column) => column.id) : [],
  }), [canPin, columns])
  const rowSelectionState = selectedIds ? Object.fromEntries(selectedIds.map((id) => [id, true])) : rowSelection
  const expandedState = expandedIds ? Object.fromEntries(expandedIds.map((id) => [id, true])) : expanded
  const visibilityState = controlledColumnVisibility || columnVisibility

  const tableColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const next: ColumnDef<T, unknown>[] = []
    if (canSelect) {
      next.push({
        id: '__select',
        size: 44,
        enableResizing: false,
        enableHiding: false,
        header: ({ table }) => <Checkbox aria-label="Select all rows" checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))} />,
        cell: ({ row }) => <Checkbox aria-label={`Select row ${row.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onCheckedChange={(value) => row.toggleSelected(Boolean(value))} />,
      })
    }
    if (canExpand) {
      next.push({
        id: '__expand',
        size: 40,
        enableResizing: false,
        enableHiding: false,
        header: () => null,
        cell: ({ row }) => row.getCanExpand() ? <button type="button" aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'} aria-expanded={row.getIsExpanded()} className="rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => row.toggleExpanded()}>{row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button> : null,
      })
    }
    columns.forEach((column) => {
      next.push({
        id: column.id,
        accessorFn: (row) => getValueAtPath(row, column.accessorKey || column.id),
        size: column.width || 180,
        minSize: column.minWidth || 80,
        maxSize: column.maxWidth || 640,
        enableSorting: canSort && column.sortable !== false,
        enableResizing: canResize && column.resizable !== false,
        enableHiding: column.hideable !== false,
        header: ({ column: tableColumn }) => {
          const sort = tableColumn.getIsSorted()
          return (
            <div className={`flex items-center gap-1.5 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
              {tableColumn.getCanSort() ? <button type="button" className="inline-flex items-center gap-1.5 rounded-sm font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={tableColumn.getToggleSortingHandler()} aria-label={`Sort by ${column.label}`} aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}>{column.label}<SortIcon direction={sort} /></button> : <span>{column.label}</span>}
            </div>
          )
        },
        cell: (info) => {
          const value = info.getValue()
          const content = column.cell ? column.cell({ row: info.row, value }) : displayValue(value)
          return <div className={bodyCellClass(column as DataTableColumn<unknown>)} title={column.overflow !== 'wrap' && typeof value !== 'object' ? String(value ?? '') : undefined}>{content}</div>
        },
      })
    })
    if (features.rowActions && rowActions) {
      next.push({
        id: '__actions',
        size: 56,
        enableResizing: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const viewHref = resolveHref(rowActions.view?.href, row.original)
          const editHref = resolveHref(rowActions.edit?.href, row.original)
          return <div className="flex items-center justify-end gap-0.5" onClick={(event) => event.stopPropagation()}>
            {viewHref && <a href={viewHref} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={rowActions.view?.label || 'View'}><Eye size={16} /></a>}
            {editHref && <a href={editHref} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={rowActions.edit?.label || 'Edit'}><Pencil size={16} /></a>}
            {rowActions.menu?.length ? <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="More row actions"><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end">{rowActions.menu.map((action) => <DropdownMenuItem key={action.id} className={action.destructive ? 'text-destructive focus:text-destructive' : ''} onSelect={() => { action.onSelect?.(row.original); onAction?.(action.id, row.original) }}>{action.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}
          </div>
        },
      })
    }
    return next
  }, [canPin, canResize, canSelect, canSort, columns, features.rowActions, onAction, rowActions])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection: rowSelectionState, expanded: expandedState, columnVisibility: visibilityState, columnSizing, columnPinning: pinning },
    getRowId,
    enableRowSelection: canSelect,
    enableExpanding: canExpand,
    getRowCanExpand: (row) => getRowCanExpand?.(row.original) ?? Boolean(renderExpandedRow),
    columnResizeMode: 'onChange',
    manualSorting: true,
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = functionalUpdate(updater, sorting)
      setSorting(next)
      const first = next[0]
      onSortChange?.(first ? { id: first.id, desc: first.desc } : undefined)
    },
    onRowSelectionChange: (updater) => {
      const next = functionalUpdate(updater, rowSelectionState)
      setRowSelection(next)
      onSelectionChange?.(table.getRowModel().rows.filter((row) => next[row.id]).map((row) => row.original))
      onSelectedIdsChange?.(Object.keys(next).filter((id) => Boolean(next[id])))
    },
    onExpandedChange: (updater) => {
      const next = functionalUpdate(updater, expandedState)
      setExpanded(next)
      onExpandedChange?.(next)
      onExpandedIdsChange?.(Object.keys(next).filter((id) => Boolean(next[id])))
    },
    onColumnVisibilityChange: (updater) => {
      const next = functionalUpdate(updater, visibilityState)
      setColumnVisibility(next)
      onColumnVisibilityChange?.(next)
      if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:visibility`, JSON.stringify(next))
    },
    onColumnSizingChange: (updater) => {
      const next = functionalUpdate(updater, columnSizing)
      setColumnSizing(next)
      if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:sizing`, JSON.stringify(next))
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const visibleColumnCount = colSpan || table.getVisibleLeafColumns().length
  const skeletonRows = Array.from({ length: 5 })

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/35">
            {table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => <TableHead key={header.id} className="relative h-11 text-xs uppercase tracking-wide text-muted-foreground" style={pinStyle(header.column)}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/50" aria-hidden="true"><GripVertical size={12} className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-60" /></div>}
              </TableHead>)}
            </TableRow>)}
          </TableHeader>
          <TableBody>
            {loading && features.loadingState !== false ? skeletonRows.map((_, index) => <TableRow key={`skeleton-${index}`}>
              {table.getVisibleLeafColumns().map((column) => <TableCell key={column.id} style={pinStyle(column)}><div className="h-4 animate-pulse rounded bg-muted" /></TableCell>)}
            </TableRow>) : table.getRowModel().rows.length === 0 ? <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-40 text-center text-sm text-muted-foreground">{emptyMessage}</TableCell>
            </TableRow> : table.getRowModel().rows.map((row) => <Fragment key={row.id}>
              <TableRow data-state={row.getIsSelected() ? 'selected' : undefined} className="group cursor-default transition-colors hover:bg-muted/35" onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="h-14 text-sm" style={pinStyle(cell.column)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
              </TableRow>
              {row.getIsExpanded() && <TableRow className="bg-muted/20 hover:bg-muted/20"><TableCell colSpan={visibleColumnCount} className="p-0">{renderExpandedRow?.(row)}</TableCell></TableRow>}
            </Fragment>)}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
