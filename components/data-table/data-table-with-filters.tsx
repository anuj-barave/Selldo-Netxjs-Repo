'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from './data-table'
import { DataTableCardList } from './data-table-card-list'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type { DataTableColumn, DataTableFeatures, DataTablePagination as PaginationConfig, DataTableBulkAction, DataTableRowActions } from './types'

type DataTableWithFiltersProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  features?: DataTableFeatures
  rowActions?: DataTableRowActions<T>
  bulkActions?: DataTableBulkAction[]
  pagination?: PaginationConfig
  search?: string
  getRowId?: (row: T, index: number) => string
  mobileCardFields?: string[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  noResultsMessage?: string
  onSearchChange?: (value: string) => void
  onSortChange?: (sort?: { id: string; desc: boolean }) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onCursorChange?: (cursor: string | null) => void
  onRefresh?: () => void
  onAdd?: () => void
  onExport?: () => void
  onRetry?: () => void
  onBulkAction?: (action: DataTableBulkAction, rows: T[]) => void
  onAction?: (actionId: string, row: T) => void
  renderExpandedRow?: (row: T) => React.ReactNode
  persistKey?: string
  addLabel?: string
}

function useMobileTable() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return mobile
}

export function DataTableWithFilters<T>({
  data,
  columns,
  features = {},
  rowActions,
  bulkActions = [],
  pagination,
  search = '',
  getRowId = (row, index) => String((row as { id?: string | number })?.id ?? index),
  mobileCardFields,
  loading = false,
  error,
  emptyMessage = 'No records found',
  noResultsMessage = 'No results match your current search.',
  onSearchChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onCursorChange,
  onRefresh,
  onAdd,
  onExport,
  onRetry,
  onBulkAction,
  onAction,
  renderExpandedRow,
  persistKey = 'sell-do-data-table',
  addLabel,
}: DataTableWithFiltersProps<T>) {
  const isMobile = useMobileTable()
  const columnIdsSignature = columns.map((column) => column.id).join('|')

  const defaultVisibility = useMemo(() => Object.fromEntries(columns.map((column) => [column.id, column.visibleByDefault !== false])), [columns])
  const defaultOrder = useMemo(() => columns.map((column) => column.id), [columns])
  const defaultPinnedLeft = useMemo(() => columns.filter((column) => column.pin === 'left').map((column) => column.id), [columns])

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(defaultVisibility)
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder)
  const [pinnedLeft, setPinnedLeft] = useState<string[]>(defaultPinnedLeft)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const selectedRows = useMemo(() => data.filter((row, index) => selectedIds.includes(getRowId(row, index))), [data, getRowId, selectedIds])
  const hasQuery = Boolean(search)
  const visibleData = error ? [] : data

  // Hydrate from localStorage when the column set is first seen.
  useEffect(() => {
    try {
      const storedVisibility = window.localStorage.getItem(`${persistKey}:visibility`)
      if (storedVisibility) setVisibleColumns((current) => ({ ...current, ...JSON.parse(storedVisibility) }))
      const storedOrder = window.localStorage.getItem(`${persistKey}:order`)
      if (storedOrder) {
        const parsed: string[] = JSON.parse(storedOrder)
        setColumnOrder((current) => {
          const known = parsed.filter((id) => columns.some((column) => column.id === id))
          const missing = current.filter((id) => !known.includes(id))
          return [...known, ...missing]
        })
      }
      const storedPinned = window.localStorage.getItem(`${persistKey}:pinnedLeft`)
      if (storedPinned) setPinnedLeft(JSON.parse(storedPinned))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, columnIdsSignature])

  const changeColumnVisibility = useCallback((id: string, visible: boolean) => {
    setVisibleColumns((current) => {
      const next = { ...current, [id]: visible }
      if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:visibility`, JSON.stringify(next))
      return next
    })
  }, [persistKey])

  const changeColumnOrder = useCallback((order: string[]) => {
    setColumnOrder(order)
    if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:order`, JSON.stringify(order))
  }, [persistKey])

  const changePinnedLeft = useCallback((ids: string[]) => {
    setPinnedLeft(ids)
    if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:pinnedLeft`, JSON.stringify(ids))
  }, [persistKey])

  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultVisibility)
    setColumnOrder(defaultOrder)
    setPinnedLeft(defaultPinnedLeft)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`${persistKey}:visibility`)
      window.localStorage.removeItem(`${persistKey}:order`)
      window.localStorage.removeItem(`${persistKey}:pinnedLeft`)
      window.localStorage.removeItem(`${persistKey}:sizing`)
    }
  }, [defaultOrder, defaultPinnedLeft, defaultVisibility, persistKey])

  const rowIdFor = (row: T, index: number) => getRowId(row, index)
  const expandedRenderer = (row: T) => <div className="border-t bg-muted/20 p-4 text-sm text-muted-foreground">{renderExpandedRow?.(row) || 'Additional row details'}</div>

  return (
    <div className="space-y-4">
      {(features.search !== false || features.columnVisibility !== false || features.add !== false || features.refresh !== false || features.export) && (
        <DataTableToolbar
          columns={columns}
          features={features}
          search={search}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onSearchChange={(value) => onSearchChange?.(value)}
          onRefresh={onRefresh}
          onAdd={onAdd}
          onExport={onExport}
          onToggleColumn={changeColumnVisibility}
          onColumnOrderChange={changeColumnOrder}
          onResetColumns={resetColumns}
          addLabel={addLabel}
        />
      )}
      {features.bulkActions !== false && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="mr-1 text-sm font-medium text-foreground">{selectedRows.length} selected</span>
          {bulkActions.map((action) => <Button key={action.id} variant={action.destructive ? 'destructive' : 'outline'} size="sm" className="h-8" onClick={() => onBulkAction?.(action, selectedRows)}>{action.label}</Button>)}
          <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-2 text-destructive"><AlertCircle size={17} />{error}</div>
          <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      ) : null}
      {features.responsiveCards !== false && isMobile ? (
        <DataTableCardList
          data={visibleData}
          columns={columns.filter((column) => visibleColumns[column.id] !== false)}
          features={features}
          rowActions={rowActions}
          getRowId={rowIdFor}
          selectedIds={selectedIds}
          expandedIds={expandedIds}
          mobileCardFields={mobileCardFields}
          onToggleSelected={(row, selected) => { const id = getRowId(row, 0); setSelectedIds((current) => selected ? [...new Set([...current, id])] : current.filter((value) => value !== id)) }}
          onToggleExpanded={(row) => { const id = getRowId(row, 0); setExpandedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]) }}
          renderExpandedRow={expandedRenderer}
          onAction={onAction}
        />
      ) : (
        <DataTable
          data={visibleData}
          columns={columns}
          features={features}
          rowActions={rowActions}
          getRowId={getRowId}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          expandedIds={expandedIds}
          onExpandedIdsChange={setExpandedIds}
          onSortChange={onSortChange}
          onAction={onAction}
          renderExpandedRow={(row) => expandedRenderer(row.original)}
          persistKey={persistKey}
          loading={loading}
          emptyMessage={hasQuery ? noResultsMessage : emptyMessage}
          columnVisibility={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}
          columnOrder={columnOrder}
          onColumnOrderChange={changeColumnOrder}
          pinnedLeft={pinnedLeft}
          onPinnedLeftChange={changePinnedLeft}
        />
      )}
      {features.pagination !== false && pagination && !loading && !error ? <DataTablePagination config={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onCursorChange={onCursorChange} /> : null}
      {loading && features.loadingState !== false ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Loading records…</div>
      ) : null}
      {features.bulkActions !== false && bulkActions.length > 0 && selectedRows.length > 0 && (
        <span className="sr-only"><Check size={1} />Bulk actions available for selected rows</span>
      )}
    </div>
  )
}
