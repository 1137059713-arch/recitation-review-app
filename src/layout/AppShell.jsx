import { Route, Routes } from 'react-router-dom'
import WeekSummaryCard from '../components/WeekSummaryCard.jsx'
import BookChaptersPage from '../pages/BookChaptersPage.jsx'
import CalendarPage from '../pages/CalendarPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import OverduePage from '../pages/OverduePage.jsx'
import OtherTasksPage from '../pages/OtherTasksPage.jsx'
import OverviewPage from '../pages/OverviewPage.jsx'
import SettingsPage from '../pages/SettingsPage.jsx'
import WeakPage from '../pages/WeakPage.jsx'
import { getWeekSummary } from '../utils/dashboardSummary.js'
import Navigation from './Navigation.jsx'

function AppShell({ store }) {
  const summary = getWeekSummary(store.tasks)

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-xl">
          <Navigation />

          <div className="mt-auto">
            <WeekSummaryCard summary={summary} />
          </div>
        </aside>

        <main className="min-w-0 px-6 py-6">
          <div className="mx-auto max-w-7xl">
            <Routes>
              <Route path="/" element={<HomePage store={store} />} />
              <Route path="/overdue" element={<OverduePage store={store} />} />
              <Route path="/weak" element={<WeakPage store={store} />} />
              <Route path="/overview" element={<OverviewPage store={store} />} />
              <Route path="/calendar" element={<CalendarPage store={store} />} />
              <Route path="/books" element={<BookChaptersPage store={store} />} />
              <Route path="/other" element={<OtherTasksPage store={store} />} />
              <Route path="/settings" element={<SettingsPage store={store} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
