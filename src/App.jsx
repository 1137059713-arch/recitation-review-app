import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import OverduePage from './pages/OverduePage.jsx'
import SidebarPage from './pages/SidebarPage.jsx'
import { useRecitationStore } from './hooks/useRecitationStore.js'
import { addDays, toDateKey } from './utils/date.js'
import { getReviewTaskLoad, getTaskScheduledDate } from './utils/schedule.js'

const primaryNavItems = [
  { to: '/', label: '今日任务', icon: 'today' },
  { to: '/overdue', label: '逾期任务', icon: 'clock' },
  { to: '/overview', label: '全部总览', icon: 'grid' },
  { to: '/calendar', label: '背诵日程', icon: 'calendar' },
]

const sideNavItems = [
  { to: '/calendar', label: '背诵日程', icon: 'calendar' },
  { to: '/overview', label: '书籍章节', icon: 'book' },
  { to: '/overdue', label: '薄弱章节', icon: 'weak' },
]

function AppIcon({ name, className = '' }) {
  const baseClass = ['h-4 w-4', className].join(' ')

  if (name === 'today') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current">
          <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-sm bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'clock') {
    return (
      <span className={baseClass}>
        <span className="relative block h-full w-full rounded-full border-2 border-current">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-full bg-current" />
          <span className="absolute left-1/2 top-1/2 h-px w-1.5 -translate-y-1/2 bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'grid') {
    return (
      <span className={`${baseClass} grid grid-cols-2 gap-0.5`}>
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
        <span className="rounded-[3px] border border-current" />
      </span>
    )
  }

  if (name === 'book') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current">
          <span className="mx-1 mt-1 block h-px bg-current" />
          <span className="mx-1 mt-1 block h-px bg-current" />
        </span>
      </span>
    )
  }

  if (name === 'weak') {
    return (
      <span className={baseClass}>
        <span className="block h-full w-full rounded-[4px] border-2 border-current">
          <span className="mx-1 mt-1.5 block h-px rotate-[-18deg] bg-current" />
        </span>
      </span>
    )
  }

  return (
    <span className={baseClass}>
      <span className="block h-full w-full rounded-[4px] border-2 border-current">
        <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-sm bg-current" />
      </span>
    </span>
  )
}

function getWeekSummary(tasks) {
  const today = toDateKey()
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const dateSet = new Set(dates)
  const weekTasks = tasks.filter((task) => dateSet.has(getTaskScheduledDate(task)))
  const newCount = weekTasks.filter((task) => task.type === 'new').length
  const reviewTasks = weekTasks.filter((task) => task.type !== 'new')
  const backlogCount = reviewTasks.filter((task) => getTaskScheduledDate(task) > task.date).length
  const load = reviewTasks.reduce((sum, task) => sum + getReviewTaskLoad(task, tasks), 0)

  return {
    dateText: `${dates[0].slice(5).replace('-', '.')} - ${dates[6].slice(5).replace('-', '.')}`,
    newCount,
    reviewCount: reviewTasks.length,
    backlogCount,
    load,
  }
}

function TopNavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'relative flex h-full items-center gap-2 px-5 text-sm font-semibold transition',
          isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <AppIcon name={item.icon} className={isActive ? 'text-red-500' : 'text-slate-400'} />
          <span>{item.label}</span>
          {isActive && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-red-500" />}
        </>
      )}
    </NavLink>
  )
}

function SideNavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
          isActive
            ? 'bg-red-50 text-red-600'
            : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <AppIcon name={item.icon} className={isActive ? 'text-red-500' : 'text-slate-400'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function WeekSummaryCard({ summary }) {
  const rows = [
    { label: '新背', value: summary.newCount, color: 'text-blue-600', icon: 'book' },
    { label: '复习', value: summary.reviewCount, color: 'text-violet-600', icon: 'clock' },
    { label: '积压补排', value: summary.backlogCount, color: 'text-amber-600', icon: 'weak' },
    { label: '预计总负载', value: summary.load.toFixed(1), color: 'text-sky-600', icon: 'grid' },
  ]

  return (
    <section className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">本周概览</h2>
        <p className="mt-1 text-xs text-slate-500">{summary.dateText}</p>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon name={row.icon} className={row.color} />
              <span className="text-sm font-medium text-slate-500">{row.label}</span>
            </div>
            <span className="text-lg font-semibold text-slate-950">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AppShell({ store }) {
  const summary = getWeekSummary(store.tasks)

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex h-full items-center">
          <div className="flex w-60 shrink-0 items-center gap-3 border-r border-slate-200/70 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <AppIcon name="calendar" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-950">背诵复习管理</h1>
              <p className="text-[11px] font-medium text-slate-400">Recite Daily</p>
            </div>
          </div>

          <div className="min-w-0 flex-1" />

          <nav className="flex h-full shrink-0 justify-end pr-5">
            {primaryNavItems.map((item) => (
              <TopNavItem key={item.to} item={item} />
            ))}
          </nav>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-[240px_1fr]">
        <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col border-r border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-xl">
          <nav className="space-y-2">
            {sideNavItems.map((item) => (
              <SideNavItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="mt-auto">
            <WeekSummaryCard summary={summary} />
          </div>
        </aside>

        <main className="min-w-0 px-6 py-6">
          <div className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<HomePage store={store} />} />
              <Route path="/overdue" element={<OverduePage store={store} />} />
              <Route path="/overview" element={<OverviewPage store={store} />} />
              <Route path="/calendar" element={<CalendarPage store={store} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  const store = useRecitationStore()
  const location = useLocation()

  if (location.pathname === '/sidebar') {
    return <SidebarPage store={store} />
  }

  return <AppShell store={store} />
}

export default App
