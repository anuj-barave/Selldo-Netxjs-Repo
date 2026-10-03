'use client'

import { Suspense, useMemo, useState } from 'react'
import { BarChart3, ChevronDown, Download, FileText, LayoutDashboard, LogOut, Menu, Moon, PanelLeft, Plus, RefreshCw, Settings, Sun, Users, X } from 'lucide-react'
import { DataTableWithFilters, useDataTableUrlState } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const BRAND = 'rgb(25 185 140)'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Leads', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Documents', icon: FileText },
  { label: 'Settings', icon: Settings },
]

const leadRows = [
  { id: 'lead-1001', name: 'Acme Corporation', email: 'hello@acme.co', segment: 'Enterprise', status: 'New', owner: 'Maya Chen', value: 84000, updated: '2 min ago', atRisk: false },
  { id: 'lead-1002', name: 'Northstar Labs', email: 'team@northstar.dev', segment: 'Mid-market', status: 'Contacted', owner: 'Jon Bell', value: 52000, updated: '18 min ago', atRisk: false },
  { id: 'lead-1003', name: 'Orchard & Co.', email: 'ops@orchard.co', segment: 'SMB', status: 'Qualified', owner: 'Maya Chen', value: 28000, updated: '1 hour ago', atRisk: false },
  { id: 'lead-1004', name: 'Vertex Health', email: 'buying@vertex.health', segment: 'Enterprise', status: 'New', owner: 'Iris Patel', value: 116000, updated: '3 hours ago', atRisk: true },
  { id: 'lead-1005', name: 'Brightline Studio', email: 'hello@brightline.studio', segment: 'SMB', status: 'Disqualified', owner: 'Jon Bell', value: 12000, updated: 'Yesterday', atRisk: false },
  { id: 'lead-1006', name: 'Bluebird Retail', email: 'sales@bluebird.shop', segment: 'Mid-market', status: 'Qualified', owner: 'Iris Patel', value: 46000, updated: 'Yesterday', atRisk: false },
  { id: 'lead-1007', name: 'Cedar Finance', email: 'growth@cedar.finance', segment: 'Enterprise', status: 'Contacted', owner: 'Maya Chen', value: 76000, updated: '2 days ago', atRisk: true },
  { id: 'lead-1008', name: 'Tidal Works', email: 'hi@tidal.works', segment: 'SMB', status: 'New', owner: 'Jon Bell', value: 19000, updated: '3 days ago', atRisk: false },
]

const statusStyles = {
  New: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  Contacted: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  Qualified: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  Disqualified: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const leadColumns = [
  { id: 'name', label: 'Lead', accessorKey: 'name', width: 230, minWidth: 180, pin: 'left', sortable: true, resizable: true, cell: ({ row }) => <div className="min-w-0"><div className="truncate font-medium text-foreground">{row.original.name}</div><div className="truncate text-xs text-muted-foreground">{row.original.email}</div></div> },
  { id: 'segment', label: 'Segment', accessorKey: 'segment', width: 140, sortable: true },
  { id: 'status', label: 'Status', accessorKey: 'status', width: 130, sortable: true, cell: ({ value }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[value] || 'bg-muted text-muted-foreground'}`}>{value}</span> },
  { id: 'owner', label: 'Owner', accessorKey: 'owner', width: 150, sortable: true },
  { id: 'value', label: 'Potential value', accessorKey: 'value', width: 150, align: 'right', sortable: true, cell: ({ value }) => <span className="font-medium text-foreground">${Number(value).toLocaleString()}</span> },
  { id: 'updated', label: 'Last updated', accessorKey: 'updated', width: 140, overflow: 'truncate' },
]

function Wordmark() {
  return <div className="text-lg font-bold tracking-tight"><span className="text-foreground">Sell</span><span style={{ color: BRAND }}>.do</span></div>
}

function AppContent() {
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { state, onSearchChange, onSortChange, onPageChange, onPageSizeChange } = useDataTableUrlState({ defaultPageSize: 5 })

  const filteredRows = useMemo(() => {
    const query = state.search.toLowerCase()
    const next = leadRows.filter((lead) => !query || `${lead.name} ${lead.email} ${lead.owner}`.toLowerCase().includes(query))
    if (state.sort) next.sort((a, b) => { const first = a[state.sort.id] ?? ''; const second = b[state.sort.id] ?? ''; const result = String(first).localeCompare(String(second), undefined, { numeric: true }); return state.sort.desc ? -result : result })
    return next
  }, [state.search, state.sort])

  const pageRows = filteredRows.slice(state.pageIndex * state.pageSize, (state.pageIndex + 1) * state.pageSize)
  const setNoticeBriefly = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }
  const handleRefresh = () => { setRefreshing(true); window.setTimeout(() => { setRefreshing(false); setNoticeBriefly('Leads refreshed'); }, 500) }
  const handleExport = () => {
    const csv = ['Lead,Email,Segment,Status,Owner,Potential value', ...filteredRows.map((lead) => [lead.name, lead.email, lead.segment, lead.status, lead.owner, lead.value].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'selldo-leads.csv'; link.click(); URL.revokeObjectURL(url); setNoticeBriefly('Export downloaded')
  }

  const nav = <nav className="space-y-1 p-3">{navItems.map((item) => { const Icon = item.icon; const active = item.label === 'Leads'; return <button type="button" key={item.label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} onClick={() => { setMobileOpen(false); if (item.label !== 'Leads') setNoticeBriefly(`${item.label} workspace selected`) }}><Icon size={19} />{item.label}</button> })}</nav>

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></Button><Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Toggle sidebar"><PanelLeft size={19} /></Button><Wordmark /><span className="hidden border-l pl-3 text-sm text-muted-foreground sm:inline">CRM workspace</span></div>
      <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => { setDark((value) => !value); document.documentElement.classList.toggle('dark', !dark) }}>{dark ? <Sun size={18} /> : <Moon size={18} />}</Button><button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ backgroundColor: BRAND }} aria-label="Open account menu">SD</button></div>
    </header>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="w-72 p-0"><SheetHeader className="flex h-16 flex-row items-center border-b px-6"><SheetTitle><Wordmark /></SheetTitle></SheetHeader>{nav}</SheetContent></Sheet>
    <div className="mx-auto flex max-w-[1600px]">
      <aside className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-card md:block"><div className="px-6 pb-1 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</div>{nav}</aside>
      <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: BRAND }}><Users size={16} />Sales pipeline</div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Capture intent, keep follow-ups moving, and turn conversations into revenue.</p></div><Button className="w-fit gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setNoticeBriefly('New lead flow opened')}><Plus size={16} />Add lead</Button></div>
        <DataTableWithFilters data={pageRows} columns={leadColumns} features={{ search: true, refresh: true, add: true, export: true, columnVisibility: true, columnSizing: true, sorting: true, pinning: true, selection: true, bulkActions: true, expandableRows: true, rowActions: true, pagination: true, responsiveCards: true, loadingState: true, errorState: true }} rowActions={{ view: { href: (row) => `#${row.id}`, label: 'View' }, edit: { href: (row) => `#edit-${row.id}`, label: 'Edit' }, menu: [{ id: 'assign', label: 'Assign owner' }, { id: 'archive', label: 'Archive', destructive: true }] }} bulkActions={[{ id: 'assign', label: 'Assign owner' }, { id: 'archive', label: 'Archive', destructive: true }]} pagination={{ mode: 'page', pageIndex: state.pageIndex, pageSize: state.pageSize, pageSizeOptions: [5, 10, 25], total: filteredRows.length }} search={state.search} getRowId={(row) => row.id} mobileCardFields={['name', 'status', 'owner', 'value']} loading={refreshing} emptyMessage="No leads yet" noResultsMessage="No leads match your current search." onSearchChange={onSearchChange} onSortChange={onSortChange} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onRefresh={handleRefresh} onAdd={() => setNoticeBriefly('New lead flow opened')} onExport={handleExport} onBulkAction={(action, rows) => setNoticeBriefly(`${action.label} queued for ${rows.length} leads`)} onAction={(actionId) => setNoticeBriefly(`${actionId} action selected`)} renderExpandedRow={(row) => <div className="grid gap-3 px-5 py-4 sm:grid-cols-3"><div><div className="text-xs text-muted-foreground">Email</div><div className="mt-1 text-sm font-medium text-foreground">{row.email}</div></div><div><div className="text-xs text-muted-foreground">Opportunity</div><div className="mt-1 text-sm font-medium text-foreground">${row.value.toLocaleString()} potential</div></div><div><div className="text-xs text-muted-foreground">Risk signal</div><div className="mt-1 text-sm font-medium text-foreground">{row.atRisk ? 'Needs attention' : 'Healthy follow-up'}</div></div></div>} persistKey="selldo-leads" addLabel="Add lead" />
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>Showing server-shaped controls with shareable URL state</span><span className="hidden items-center gap-1 sm:flex"><Download size={13} />CSV export ready</span></div>
      </div></main>
    </div>
    {notice && <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND }} />{notice}<button type="button" className="ml-2 text-muted-foreground hover:text-foreground" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={14} /></button></div>}
  </div>
}

function App() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading Sell.do…</div>}><AppContent /></Suspense>
}

export default App