'use client'

import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DataTableFilterField, DataTableFilterValue } from './types'

type FilterPanelProps = {
  fields: DataTableFilterField[]
  values: Record<string, DataTableFilterValue>
  onChange: (id: string, value: DataTableFilterValue) => void
  onReset: () => void
}

export function DataTableFilterPanel({ fields, values, onChange, onReset }: FilterPanelProps) {
  return <div className="space-y-4 p-4"><div><h3 className="text-sm font-semibold text-foreground">Filter records</h3><p className="mt-1 text-xs text-muted-foreground">Refine the current dataset.</p></div>{fields.map((field) => <div key={field.id} className="space-y-2">{field.type !== 'boolean' && <Label htmlFor={`filter-${field.id}`}>{field.label}</Label>}{field.type === 'text' && <Input id={`filter-${field.id}`} value={String(values[field.id] || '')} onChange={(event) => onChange(field.id, event.target.value)} placeholder={field.placeholder || `Filter by ${field.label.toLowerCase()}`} className="h-9" />}{field.type === 'select' && <select id={`filter-${field.id}`} value={String(values[field.id] || '')} onChange={(event) => onChange(field.id, event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">All {field.label}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}{field.type === 'multi-select' && <div className="space-y-2">{field.options?.map((option) => { const selected = Array.isArray(values[field.id]) && values[field.id]?.includes(option.value); return <label key={option.value} className="flex items-center gap-2 text-sm text-foreground"><Checkbox checked={Boolean(selected)} onCheckedChange={(checked) => { const current = Array.isArray(values[field.id]) ? values[field.id] : []; onChange(field.id, checked ? [...current, option.value] : current.filter((value) => value !== option.value)) }} /><span>{option.label}</span></label> })}</div>}{field.type === 'boolean' && <label className="flex items-center gap-2 text-sm text-foreground"><Checkbox checked={Boolean(values[field.id])} onCheckedChange={(checked) => onChange(field.id, Boolean(checked))} /><span>{field.label}</span></label>}{field.type === 'date-range' && <div className="grid grid-cols-2 gap-2"><Input type="date" aria-label={`${field.label} from`} value={typeof values[field.id] === 'object' && values[field.id] ? values[field.id]?.from || '' : ''} onChange={(event) => onChange(field.id, { ...(typeof values[field.id] === 'object' && values[field.id] ? values[field.id] : {}), from: event.target.value })} /><Input type="date" aria-label={`${field.label} to`} value={typeof values[field.id] === 'object' && values[field.id] ? values[field.id]?.to || '' : ''} onChange={(event) => onChange(field.id, { ...(typeof values[field.id] === 'object' && values[field.id] ? values[field.id] : {}), to: event.target.value })} /></div>}</div>)}<div className="flex justify-end border-t pt-3"><Button variant="ghost" size="sm" className="gap-1.5" onClick={onReset}><RotateCcw size={14} />Reset</Button></div></div>
}
