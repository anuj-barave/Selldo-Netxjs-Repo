'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from './data-table'
import { DataTableCardList } from './data-table-card-list'
import { DataTableFilterPanel } from './data-table-filter-panel'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type { DataTableColumn, DataTableFeatures, DataTableFilterField, DataTableFilterValue, DataTablePagination as PaginationConfig, DataTableBulkAction, DataTableRowActions } from './types'

type DataTableWithFiltersProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  features?: DataTableFeatures
  filterFields?: DataTableFilterField[]
  rowActions?: DataTableRowActions<T>
  bulkActions?: DataTableBulkAction[]
  pagination?: PaginationConfig
  search?: string
  filters?: Record<string, DataTableFilterValue>
  getRowId?: (row: T, index: number) => string
  mobileCardFields?: string[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  noResultsMessage?: string
  onSearchChange?: (value: string) => void
  onFiltersChange?: (filters: Record<string, DataTableFilterValue>) => void
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
  filterFields = [],
  rowActions,
  bulkActions = [],
  pagination,
  search = '',
  filters = {},
  getRowId = (row, index) => String((row as { id?: string | number })?.id ?? index),
  mobileCardFields,
  loading = false,
  error,
  emptyMessage = 'No records found',
  noResultsMessage = 'No results match your current filters.',
  onSearchChange,
  onFiltersChange,
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
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => Object.fromEntries(columns.map((column) => [column.id, column.visibleByDefault !== false])))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const activeFilterCount = Object.values(filters).filter((value) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)).length
  const selectedRows = useMemo(() => data.filter((row, index) => selectedIds.includes(getRowId(row, index))), [data, getRowId, selectedIds])
  const hasQuery = Boolean(search || activeFilterCount)
  const visibleData = error ? [] : data

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`${persistKey}:visibility`)
      if (stored) setVisibleColumns((current) => ({ ...current, ...JSON.parse(stored) }))
    } catch {}
  }, [persistKey])

  const updateFilters = useCallback((id: string, value: DataTableFilterValue) => {
    const next = { ...filters, [id]: value }
    onFiltersChange?.(next)
  }, [filters, onFiltersChange])

  const resetFilters = useCallback(() => {
    const defaults = Object.fromEntries(filterFields.map((field) => [field.id, field.defaultValue ?? '']))
    onFiltersChange?.(defaults)
  }, [filterFields, onFiltersChange])

  const changeColumnVisibility = (id: string, visible: boolean) => {
    setVisibleColumns((current) => {
      const next = { ...current, [id]: visible }
      if (typeof window !== 'undefined') window.localStorage.setItem(`${persistKey}:visibility`, JSON.stringify(next))
      return next
    })
  }

  const rowIdFor = (row: T, index: number) => getRowId(row, index)
  const expandedRenderer = (row: T) => <div className="border-t bg-muted/20 p-4 text-sm text-muted-foreground">{renderExpandedRow?.(row) || 'Additional row details'}</div>

  return <div className="space-y-4">
    {features.search !== false || features.filters !== false || features.add !== false ? <DataTableToolbar columns={columns} features={features} search={search} activeFilterCount={activeFilterCount} visibleColumns={visibleColumns} onSearchChange={(value) => onSearchChange?.(value)} onFilterClear={resetFilters} onRefresh={onRefresh} onAdd={onAdd} onExport={onExport} onToggleColumn={changeColumnVisibility} addLabel={addLabel} filterPanel={<DataTableFilterPanel fields={filterFields} values={filters} onChange={updateFilters} onReset={resetFilters} />} /> : null}
    {features.bulkActions !== false && selectedRows.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5"><span className="mr-1 text-sm font-medium text-foreground">{selectedRows.length} selected</span>{bulkActions.map((action) => <Button key={action.id} variant={action.destructive ? 'destructive' : 'outline'} size="sm" className="h-8" onClick={() => onBulkAction?.(action, selectedRows)}>{action.label}</Button>)}<Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setSelectedIds([])}>Clear</Button></div>}
    {error ? <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><div className="flex items-center gap-2 text-destructive"><AlertCircle size={17} />{error}</div><Button variant="outline" size="sm" onClick={onRetry}>Retry</Button></div> : null}
    {features.responsiveCards !== false && isMobile ? <DataTableCardList data={visibleData} columns={columns.filter((column) => visibleColumns[column.id] !== false)} features={features} rowActions={rowActions} getRowId={rowIdFor} selectedIds={selectedIds} expandedIds={expandedIds} mobileCardFields={mobileCardFields} onToggleSelected={(row, selected) => { const id = getRowId(row, 0); setSelectedIds((current) => selected ? [...new Set([...current, id])] : current.filter((value) => value !== id)) }} onToggleExpanded={(row) => { const id = getRowId(row, 0); setExpandedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]) }} renderExpandedRow={expandedRenderer} onAction={onAction} /> : <DataTable data={visibleData} columns={columns.filter((column) => visibleColumns[column.id] !== false)} features={features} rowActions={rowActions} getRowId={getRowId} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} expandedIds={expandedIds} onExpandedIdsChange={setExpandedIds} onSortChange={onSortChange} onAction={onAction} renderExpandedRow={(row) => expandedRenderer(row.original)} persistKey={persistKey} loading={loading} emptyMessage={hasQuery ? noResultsMessage : emptyMessage} columnVisibility={visibleColumns} onColumnVisibilityChange={setVisibleColumns} />}
    {features.pagination !== false && pagination && !loading && !error ? <DataTablePagination config={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onCursorChange={onCursorChange} /> : null}
    {loading && features.loadingState !== false ? <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Loading records…</div> : null}
    {features.bulkActions !== false && bulkActions.length > 0 && selectedRows.length > 0 && <span className="sr-only"><Check size={1} />Bulk actions available for selected rows</span>}
  </div>
}
