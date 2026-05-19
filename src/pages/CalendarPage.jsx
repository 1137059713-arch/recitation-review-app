import DayScheduleCard from '../components/schedule/DayScheduleCard.jsx'
import { compareDateKey } from '../utils/date.js'
import { buildDaySchedules } from '../utils/calendarView.js'

function CalendarPage({ store }) {
  const days = buildDaySchedules({
    tasks: store.tasks,
    itemsById: store.itemsById,
    groupsById: store.groupsById,
    settings: store.scheduleSettings,
  })
  const visibleTasks = days.flatMap((day) => day.tasks)
  const totalNew = days.reduce((sum, day) => sum + day.newCount, 0)
  const totalReview = days.reduce((sum, day) => sum + day.reviewCount, 0)
  const totalBacklog = days.reduce((sum, day) => sum + day.backlogCount, 0)
  const busiestDay = [...days].sort((a, b) => b.load - a.load || compareDateKey(a.date, b.date))[0]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="text-sm font-medium text-red-500">背诵日程</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
              未来 7 天排程
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              看清接下来几天的新背、复习、积压补排和预计负载。这里不管理生活日程，只服务背诵节奏。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-400">总任务</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{visibleTasks.length}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-600">新背</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">{totalNew}</p>
            </div>
            <div className="rounded-lg bg-violet-50 p-3">
              <p className="text-xs font-semibold text-violet-600">复习</p>
              <p className="mt-1 text-2xl font-semibold text-violet-700">{totalReview}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-600">积压补排</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{totalBacklog}</p>
            </div>
          </div>
        </div>

        {busiestDay && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-sm text-slate-500">
            压力最高的一天是
            <span className="mx-1 font-semibold text-slate-900">{busiestDay.weekday}</span>
            ，预计负载
            <span className="mx-1 font-semibold text-slate-900">{busiestDay.load.toFixed(1)}</span>
            。
          </div>
        )}
      </section>

      <div className="space-y-3">
        {days.map((day) => (
          <DayScheduleCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  )
}

export default CalendarPage
