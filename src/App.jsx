import { NavLink, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import OverduePage from './pages/OverduePage.jsx'
import SidebarPage from './pages/SidebarPage.jsx'
import { useRecitationStore } from './hooks/useRecitationStore.js'
import { useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '今日任务' },
  { to: '/overdue', label: '逾期任务' },
  { to: '/overview', label: '全部总览' },
  { to: '/calendar', label: '背诵日程' },
]

function App() {
  const store = useRecitationStore()
  const location = useLocation()

  if (location.pathname === '/sidebar') {
    return <SidebarPage store={store} />
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-red-500">Recite Daily</p>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">背诵复习管理</h1>
          </div>
          <nav className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage store={store} />} />
          <Route path="/overdue" element={<OverduePage store={store} />} />
          <Route path="/overview" element={<OverviewPage store={store} />} />
          <Route path="/calendar" element={<CalendarPage store={store} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
