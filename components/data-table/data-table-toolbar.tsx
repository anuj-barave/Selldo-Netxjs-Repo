'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Download, GripVertical, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DataTableColumn, DataTableFeatures } from './types'

type DataTableToolbarProps<T> = {
  columns: DataTableColumn<T>[]
  features: DataTableFeatures
  search: string
  visibleColumns: Record<string, boolean>
  columnOrder: string[]
  onSearchChange: (value: string) => void
  onRefresh?: () => void
  onAdd?: () => void
  onExport?: () => void
  onToggleColumn: (id: string, visible: boolean) => void
  onColumnOrderChange: (order: string[]) => void
  addLabel?: string
}

function SortableColumnRow({ id, label, visible, onToggle }: { id: string; label: string; visible: boolean; onToggle: (next: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm ${isDragging ? 'ring-2 ring-primary/40' : ''}`}>
      <button type="button" aria-label={`Drag ${label}`} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={15} />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2">
        <Checkbox checked={visible} onCheckedChange={(value) => onToggle(Boolean(value))} aria-label={`Toggle ${label}`} />
        <span className="flex-1 truncate text-foreground">{label}</span>
      </label>
    </div>
  )
}

export function DataTableToolbar<T>({ columns, features, search, visibleColumns, columnOrder, onSearchChange, onRefresh, onAdd, onExport, onToggleColumn, onColumnOrderChange, addLabel = 'Add' }: DataTableToolbarProps<T>) {
  const [draft, setDraft] = useState(search)
  const onSearchRef = useRef(onSearchChange)
  useEffect(() => { onSearchRef.current = onSearchChange })
  useEffect(() => setDraft(search), [search])
  useEffect(() => {
    if (draft === search) return
    const timer = window.setTimeout(() => onSearchRef.current(draft), 300)
    return () => window.clearTimeout(timer)
  }, [draft, search])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const columnMap = Object.fromEntries(columns.map((column) => [column.id, column]))
  const orderedIds = columnOrder.filter((id) => columnMap[id]).concat(columns.filter((column) => !columnOrder.includes(column.id)).map((column) => column.id))
  const draggableIds = orderedIds.filter((id) => columnMap[id]?.hideable !== false || columnMap[id])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedIds.indexOf(String(active.id))
    const newIndex = orderedIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onColumnOrderChange(arrayMove(orderedIds, oldIndex, newIndex))
  }

  return (
    <div className="flex flex-col gap-3 border-b bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {features.search !== false && (
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search records..." aria-label="Search records" className="h-9 pl-9" />
            {draft && (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search" onClick={() => setDraft('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {features.columnVisibility !== false && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <SlidersHorizontal size={15} />Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[300px] p-0">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Columns</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Drag to reorder. Toggle visibility.</p>
              </div>
              <div className="max-h-[340px] space-y-1.5 overflow-y-auto p-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={draggableIds} strategy={verticalListSortingStrategy}>
                    {draggableIds.map((id) => {
                      const column = columnMap[id]
                      if (!column) return null
                      return (
                        <SortableColumnRow
                          key={id}
                          id={id}
                          label={column.label}
                          visible={visibleColumns[id] !== false}
                          onToggle={(next) => onToggleColumn(id, next)}
                        />
                      )
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {features.refresh !== false && (
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Refresh" onClick={onRefresh}>
            <RefreshCw size={15} />
          </Button>
        )}
        {features.export && (
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={onExport}>
            <Download size={15} />Export
          </Button>
        )}
        {features.add !== false && (
          <Button size="sm" className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onAdd}>
            <Plus size={15} />{addLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
