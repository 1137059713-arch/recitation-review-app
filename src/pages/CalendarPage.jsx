import {
  getReviewTaskLoad,
  getTaskScheduledDate,
} from '../utils/schedule.js'
import { addDays, compareDateKey, formatDate, toDateKey } from '../utils/date.js'

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const DAY_COUNT = 7
const NEW_TASK_DISPLAY_LOAD = 1.2

function getWeekday(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

function getDateRange(startDate, count) {
  return Array.from({ length: count }, (_, index) => addDays(startDate, index))
}

function getLoadMeta(load, taskCount, isRestDay) {
  if (isRestDay) {
    return {
      label: '休息日',
      badgeClass: 'border-sky-100 bg-sky-50 text-sky-700',
      barClass: 'from-sky-300 to-cyan-300',
      width: '16%',
    }
  }

  if (taskCount === 0 || load <= 1.4) {
    return {
      label: '轻松',
      badgeClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      barClass: 'from-emerald-300 to-cyan-300',
      width: taskCount === 0 ? '10%' : '38%',
    }
  }

  if (load <= 3) {
    return {
      label: '正常',
      badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
      barClass: 'from-cyan-300 to-violet-300',
      width: '68%',
    }
  }

  return {
    label: '偏多',
    badgeClass: 'border-amber-100 bg-amber-50 text-amber-700',
    barClass: 'from-amber-300 to-red-300',
    width: '100%',
  }
}

function getTaskTone(task) {
  if (task.type === 'new') {
    return {
      label: '新背',
      dotClass: 'bg-emerald-400',
      chipClass: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  return {
    label: getTaskScheduledDate(task) > task.date ? '积压补排' : '复习',
    dotClass: getTaskScheduledDate(task) > task.date ? 'bg-amber-400' : 'bg-violet-400',
    chipClass:
      getTaskScheduledDate(task) > task.date
        ? 'border-amber-100 bg-amber-50 text-amber-700'
        : 'border-violet-100 bg-violet-50 text-violet-700',
  }
}

function buildDaySchedules({ tasks, itemsById, groupsById, settings }) {
  const today = toDateKey()
  const dates = getDateRange(today, DAY_COUNT)
  const restDays = settings?.restDays || [0]

  return dates.map((date) => {
    const dayTasks = tasks
      .filter((task) => getTaskScheduledDate(task) === date)
      .sort((a, b) => {
        if (a.type === 'new' && b.type !== 'new') return -1
        if (a.type !== 'new' && b.type === 'new') return 1
        return a.id.localeCompare(b.id)
      })
    const newTasks = dayTasks.filter((task) => task.type === 'new')
    const reviewTasks = dayTasks.filter((task) => task.type !== 'new')
    const backlogTasks = reviewTasks.filter((task) => getTaskScheduledDate(task) > task.date)
    const reviewLoad = reviewTasks.reduce((sum, task) => sum + getReviewTaskLoad(task, tasks), 0)
    const displayLoad = reviewLoad + newTasks.length * NEW_TASK_DISPLAY_LOAD
    const isRestDay = restDays.includes(getWeekday(date))
    const loadMeta = getLoadMeta(displayLoad, dayTasks.length, isRestDay)

    return {
      date,
      isToday: date === today,
      weekday: WEEKDAY_NAMES[getWeekday(date)],
      isRestDay,
      tasks: dayTasks.map((task) => {
        const item = itemsById.get(task.itemId)
        const group = item?.groupId ? groupsById.get(item.groupId) : null

        return {
          ...task,
          item,
          group,
          tone: getTaskTone(task),
        }
      }),
      newCount: newTasks.length,
      reviewCount: reviewTasks.length,
      backlogCount: backlogTasks.length,
      load: displayLoad,
      loadMeta,
    }
  })
}

function StatPill({ label, value, tone = 'slate' }) {
  const toneClass =
    tone === 'red'
      ? 'bg-red-50 text-red-600'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : tone === 'emerald'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {label} {value}
    </span>
  )
}

function TaskChip({ task }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${task.tone.dotClass}`} />
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${task.tone.chipClass}`}>
        {task.tone.label}
      </span>
      <span className="truncate text-sm font-semibold text-slate-900">
        {task.item?.title || '已删除内容'}
      </span>
      {task.group && (
        <span className="hidden shrink-0 text-xs font-medium text-slate-400 sm:inline">
          {task.group.name}
        </span>
      )}
    </div>
  )
}

function DayScheduleCard({ day }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-[150px_1fr]">
        <div className="flex lg:block">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-950">{day.weekday}</h3>
              {day.isToday && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                  今天
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">{formatDate(day.date)}</p>
          </div>
          <span className={`ml-3 shrink-0 self-start rounded-full border px-2.5 py-1 text-xs font-semibold lg:ml-0 lg:mt-4 lg:inline-block ${day.loadMeta.badgeClass}`}>
            {day.loadMeta.label}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="新背" value={day.newCount} tone="emerald" />
            <StatPill label="复习" value={day.reviewCount} />
            <StatPill label="积压补排" value={day.backlogCount} tone={day.backlogCount > 0 ? 'amber' : 'slate'} />
            <StatPill label="预计负载" value={day.load.toFixed(1)} tone={day.load > 3 ? 'red' : 'slate'} />
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${day.loadMeta.barClass}`}
              style={{ width: day.loadMeta.width }}
            />
          </div>

          {day.tasks.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">
              {day.isRestDay ? '休息日，系统不会主动安排复习。' : '这一天暂时没有背诵任务。'}
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {day.tasks.map((task) => (
                <TaskChip key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

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
