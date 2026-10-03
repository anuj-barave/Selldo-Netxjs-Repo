'use client'

import { useCallback, useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { DataTableFilterValue, DataTableQueryState } from './types'
import { parseQueryValue, serializeQueryValue } from './utils'

type UrlStateOptions = { filterKeys?: string[]; defaultPageSize?: number }

export function useDataTableUrlState({ filterKeys = [], defaultPageSize = 25 }: UrlStateOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Stabilise filterKeys so dependent memos don't thrash when caller passes an inline array
  const filterKeysSignature = filterKeys.join('|')
  const stableFilterKeys = useMemo(() => filterKeys, [filterKeysSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  const state = useMemo<DataTableQueryState>(() => {
    const filters = Object.fromEntries(stableFilterKeys.map((key) => [key, parseQueryValue(searchParams.get(key))]))
    const sortValue = searchParams.get('sort')
    const [sortId, sortDirection] = sortValue?.split('.') || []
    return {
      search: searchParams.get('q') || '',
      filters,
      sort: sortId ? { id: sortId, desc: sortDirection === 'desc' } : undefined,
      pageIndex: Math.max(0, Number(searchParams.get('page') || 1) - 1),
      pageSize: Math.max(1, Number(searchParams.get('pageSize') || defaultPageSize)),
      cursor: searchParams.get('cursor') || undefined,
    }
  }, [defaultPageSize, stableFilterKeys, searchParams])

  // Keep the latest searchParams in a ref so update() has a stable identity across renders
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const update = useCallback((changes: Partial<DataTableQueryState> & { filters?: Record<string, DataTableFilterValue> }) => {
    const current = searchParamsRef.current
    const next = new URLSearchParams(current.toString())
    if (changes.search !== undefined) changes.search ? next.set('q', changes.search) : next.delete('q')
    if (changes.pageIndex !== undefined) changes.pageIndex > 0 ? next.set('page', String(changes.pageIndex + 1)) : next.delete('page')
    if (changes.pageSize !== undefined) changes.pageSize !== defaultPageSize ? next.set('pageSize', String(changes.pageSize)) : next.delete('pageSize')
    if ('cursor' in changes) changes.cursor ? next.set('cursor', changes.cursor as string) : next.delete('cursor')
    if (changes.sort !== undefined) changes.sort ? next.set('sort', `${changes.sort.id}.${changes.sort.desc ? 'desc' : 'asc'}`) : next.delete('sort')
    if (changes.filters) Object.entries(changes.filters).forEach(([key, value]) => { const serialized = serializeQueryValue(value); serialized ? next.set(key, serialized) : next.delete(key) })
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [defaultPageSize, pathname, router])

  const onSearchChange = useCallback((search: string) => update({ search, pageIndex: 0 }), [update])
  const onFiltersChange = useCallback((filters: Record<string, DataTableFilterValue>) => update({ filters, pageIndex: 0 }), [update])
  const onSortChange = useCallback((sort?: { id: string; desc: boolean }) => update({ sort, pageIndex: 0 }), [update])
  const onPageChange = useCallback((pageIndex: number) => update({ pageIndex }), [update])
  const onPageSizeChange = useCallback((pageSize: number) => update({ pageSize, pageIndex: 0 }), [update])
  const onCursorChange = useCallback((cursor: string | null) => update({ cursor: cursor ?? undefined }), [update])

  return { state, onSearchChange, onFiltersChange, onSortChange, onPageChange, onPageSizeChange, onCursorChange }
}
