import type { ReactNode } from 'react'
import type { Row } from '@tanstack/react-table'

export type DataTableAlign = 'left' | 'center' | 'right'
export type DataTableOverflow = 'truncate' | 'wrap'
export type DataTablePin = false | 'left' | 'right'
export type DataTableFilterValue = string | string[] | boolean | { from?: string; to?: string } | null

export type DataTableCellContext<T> = {
  row: Row<T>
  value: unknown
}

export type DataTableColumn<T> = {
  id: string
  label: string
  accessorKey?: string
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  align?: DataTableAlign
  overflow?: DataTableOverflow
  sortable?: boolean
  sortKey?: string
  pin?: DataTablePin
  hideable?: boolean
  visibleByDefault?: boolean
  cellKey?: string
  cell?: (context: DataTableCellContext<T>) => ReactNode
}

export type DataTableAction<T> = {
  id: string
  label: string
  iconKey?: string
  href?: string | ((row: T) => string)
  onSelect?: (row: T) => void
  disabled?: boolean | ((row: T) => boolean)
  destructive?: boolean
}

export type DataTableRowActions<T> = {
  view?: Omit<DataTableAction<T>, 'id' | 'label'> & { label?: string }
  edit?: Omit<DataTableAction<T>, 'id' | 'label'> & { label?: string }
  menu?: DataTableAction<T>[]
}

export type DataTableBulkAction = {
  id: string
  label: string
  iconKey?: string
  destructive?: boolean
  requiresConfirmation?: boolean
}

export type DataTableFilterOption = { label: string; value: string }

export type DataTableFilterField = {
  id: string
  label: string
  type: 'text' | 'select' | 'multi-select' | 'boolean' | 'date-range'
  placeholder?: string
  options?: DataTableFilterOption[]
  defaultValue?: DataTableFilterValue
}

export type DataTablePagination = {
  mode: 'page' | 'cursor'
  pageIndex?: number
  pageSize?: number
  pageSizeOptions?: number[]
  total?: number
  nextCursor?: string | null
  previousCursor?: string | null
}

export type DataTableFeatures = {
  search?: boolean
  filters?: boolean
  refresh?: boolean
  add?: boolean
  export?: boolean
  columnVisibility?: boolean
  columnSizing?: boolean
  sorting?: boolean
  pinning?: boolean
  selection?: boolean
  bulkActions?: boolean
  expandableRows?: boolean
  rowActions?: boolean
  pagination?: boolean
  responsiveCards?: boolean
  loadingState?: boolean
  errorState?: boolean
}

export type DataTableQueryState = {
  search: string
  filters: Record<string, DataTableFilterValue>
  sort?: { id: string; desc: boolean }
  pageIndex: number
  pageSize: number
  cursor?: string
}
