import {
  Archive,
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  CircleUserRound,
  Copy,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'

export const iconRegistry = {
  archive: Archive,
  building: Building2,
  check: Check,
  copy: Copy,
  download: Download,
  eye: Eye,
  file: FileText,
  more: MoreHorizontal,
  pencil: Pencil,
  refresh: RefreshCw,
  trash: Trash2,
  user: UserRound,
  users: UsersRound,
  close: X,
}

export function getIcon(iconKey?: string, fallback = MoreHorizontal) {
  return (iconKey && iconRegistry[iconKey as keyof typeof iconRegistry]) || fallback
}

export function getValueAtPath<T>(row: T, path?: string): unknown {
  if (!path) return undefined
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key]
    return undefined
  }, row)
}

export function resolveHref<T>(href: string | ((row: T) => string) | undefined, row: T) {
  return typeof href === 'function' ? href(row) : href
}

export function displayValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function serializeQueryValue(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function parseQueryValue(value: string | null): string | string[] | null {
  if (!value) return null
  return value.includes(',') ? value.split(',').filter(Boolean) : value
}

export function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp size={14} aria-hidden="true" />
  if (direction === 'desc') return <ArrowDown size={14} aria-hidden="true" />
  return <span className="h-3.5 w-3.5" aria-hidden="true" />
}
