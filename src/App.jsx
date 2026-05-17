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
  { to: '/', label: '今日任务', icon: '□' },
  { to: '/overdue', label: '逾期任务', icon: '◷' },
  { to: '/overview', label: '全部总览', icon: '▦' },
  { to: '/calendar', label: '背诵日程', icon: '▣' },
]

const sideNavItems = [
  { to: '/calendar', label: '背诵日程', icon: '▣' },
  { to: '/overview', label: '书籍章节', icon: '▤' },
  { to: '/overdue', label: '薄弱章节', icon: '▱' },
]

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
          <span className={isActive ? 'text-red-500' : 'text-slate-400'}>{item.icon}</span>
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
          <span className={isActive ? 'text-red-500' : 'text-slate-400'}>{item.icon}</span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function WeekSummaryCard({ summary }) {
  const rows = [
    { label: '新背', value: summary.newCount, color: 'text-blue-600', icon: '▥' },
    { label: '复习', value: summary.reviewCount, color: 'text-violet-600', icon: '↻' },
    { label: '积压补排', value: summary.backlogCount, color: 'text-amber-600', icon: '◷' },
    { label: '预计总负载', value: summary.load.toFixed(1), color: 'text-sky-600', icon: '▥' },
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
              <span className={row.color}>{row.icon}</span>
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
              ▣
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-950">背诵复习管理</h1>
              <p className="text-[11px] font-medium text-slate-400">Recite Daily</p>
            </div>
          </div>

          <nav className="flex h-full min-w-0 flex-1 justify-center">
            {primaryNavItems.map((item) => (
              <TopNavItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="flex w-56 shrink-0 items-center justify-end gap-2 px-5 text-slate-500">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-900" type="button">
              ☼
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-900" type="button">
              ⚙
            </button>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <span className="text-lg leading-none text-slate-400">−</span>
            <span className="text-sm text-slate-400">□</span>
            <span className="text-lg leading-none text-slate-400">×</span>
          </div>
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
