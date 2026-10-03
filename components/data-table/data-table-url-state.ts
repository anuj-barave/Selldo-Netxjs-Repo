'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { DataTableFilterValue, DataTableQueryState } from './types'
import { parseQueryValue, serializeQueryValue } from './utils'

type UrlStateOptions = { filterKeys?: string[]; defaultPageSize?: number }

export function useDataTableUrlState({ filterKeys = [], defaultPageSize = 25 }: UrlStateOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useMemo<DataTableQueryState>(() => {
    const filters = Object.fromEntries(filterKeys.map((key) => [key, parseQueryValue(searchParams.get(key))]))
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
  }, [defaultPageSize, filterKeys, searchParams])

  const update = useCallback((changes: Partial<DataTableQueryState> & { filters?: Record<string, DataTableFilterValue> }) => {
    const next = new URLSearchParams(searchParams.toString())
    if (changes.search !== undefined) changes.search ? next.set('q', changes.search) : next.delete('q')
    if (changes.pageIndex !== undefined) changes.pageIndex > 0 ? next.set('page', String(changes.pageIndex + 1)) : next.delete('page')
    if (changes.pageSize !== undefined) changes.pageSize !== defaultPageSize ? next.set('pageSize', String(changes.pageSize)) : next.delete('pageSize')
    if ('cursor' in changes) changes.cursor ? next.set('cursor', changes.cursor) : next.delete('cursor')
    if (changes.sort !== undefined) changes.sort ? next.set('sort', `${changes.sort.id}.${changes.sort.desc ? 'desc' : 'asc'}`) : next.delete('sort')
    if (changes.filters) Object.entries(changes.filters).forEach(([key, value]) => { const serialized = serializeQueryValue(value); serialized ? next.set(key, serialized) : next.delete(key) })
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }, [defaultPageSize, pathname, router, searchParams])

  return {
    state,
    onSearchChange: (search: string) => update({ search, pageIndex: 0 }),
    onFiltersChange: (filters: Record<string, DataTableFilterValue>) => update({ filters, pageIndex: 0 }),
    onSortChange: (sort?: { id: string; desc: boolean }) => update({ sort, pageIndex: 0 }),
    onPageChange: (pageIndex: number) => update({ pageIndex }),
    onPageSizeChange: (pageSize: number) => update({ pageSize, pageIndex: 0 }),
    onCursorChange: (cursor: string | null) => update({ cursor }),
  }
}
