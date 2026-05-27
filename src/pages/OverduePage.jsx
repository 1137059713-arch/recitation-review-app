import { useMemo, useState } from 'react'
import naughtyGif from '../assets/naughty.gif'
import {
  getBacklogReviewTasksByPriority,
  getOverdueReviewTasksByPriority,
  getTaskScheduledDate,
  isReviewTask,
  TASK_LABELS,
} from '../utils/schedule.js'
import { getReviewTaskLoad } from '../utils/load.js'
import { compareDateKey, formatDate, toDateKey } from '../utils/date.js'

function getOverdueDays(dateKey, today) {
  const [fromYear, fromMonth, fromDay] = dateKey.split('-').map(Number)
  const [toYear, toMonth, toDay] = today.split('-').map(Number)
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const to = Date.UTC(toYear, toMonth - 1, toDay)

  return Math.max(1, Math.round((to - from) / 86400000))
}

function getPriorityMeta(task, tasks, today) {
  const overdueDays = getOverdueDays(task.date, today)
  const load = getReviewTaskLoad(task, tasks)

  if (overdueDays >= 7 || load >= 1.4) {
    return { label: '高优先级', className: 'bg-red-50 text-red-600' }
  }

  if (overdueDays >= 3 || load >= 1) {
    return { label: '中优先级', className: 'bg-amber-50 text-amber-700' }
  }

  return { label: '低优先级', className: 'bg-emerald-50 text-emerald-700' }
}

function StatCard({ label, value, unit = '', tone = 'red' }) {
  const tones = {
    red: 'border-red-100 bg-red-50/70 text-red-600',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-600',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <section className={`rounded-lg border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">
        {value}
        {unit && <span className="ml-1 text-base text-slate-500">{unit}</span>}
      </p>
    </section>
  )
}

function MascotNote() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <img src={naughtyGif} alt="逾期提醒" className="h-11 w-11 rounded-lg object-cover" />
      <div>
        <p className="text-sm font-semibold text-slate-950">慢慢补</p>
        <p className="text-xs text-slate-500">别堆压力，一条条处理。</p>
      </div>
    </div>
  )
}

function OverdueTaskRow({ task, item, groupName, tasks, today, onScheduleToday }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const overdueDays = getOverdueDays(task.date, today)
  const suggestedDate = getTaskScheduledDate(task)
  const isScheduledToday = suggestedDate === today
  const priority = getPriorityMeta(task, tasks, today)

  return (
    <article className="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 lg:grid-cols-[70px_1fr_auto_auto_auto] lg:items-center">
      <div className="w-fit rounded-lg bg-red-50 px-3 py-2 text-center">
        <p className="text-xs font-semibold text-red-500">逾期</p>
        <p className="mt-1 text-base font-semibold text-red-600">{overdueDays}天</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-950">
            {item?.title || '已删除内容'}
          </h3>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600">
            {TASK_LABELS[task.type] || '复习'}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          {groupName || item?.body?.split('\n').find(Boolean) || '未分组'}
        </p>
        {isDetailOpen && item?.body && (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            {item.body}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 sm:flex sm:items-center">
        <span>原定 <b className="font-semibold text-slate-700">{task.date.slice(5).replace('-', '/')}</b></span>
        <span>建议重排 <b className="font-semibold text-emerald-600">{suggestedDate.slice(5).replace('-', '/')}</b></span>
      </div>

      <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${priority.className}`}>
        {priority.label}
      </span>

      <div className="flex items-center gap-2 lg:justify-end">
        <button
          type="button"
          onClick={() => onScheduleToday(task.id)}
          disabled={isScheduledToday}
          className={[
            'rounded-md border px-3 py-1.5 text-xs font-semibold transition',
            isScheduledToday
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : 'border-red-200 bg-white text-red-600 hover:bg-red-50',
          ].join(' ')}
        >
          {isScheduledToday ? '已排今日' : '安排今日'}
        </button>
        <button
          type="button"
          onClick={() => setIsDetailOpen((current) => !current)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          {isDetailOpen ? '收起' : '详情'}
        </button>
      </div>
    </article>
  )
}

function OverduePage({ store }) {
  const [sortMode, setSortMode] = useState('priority')
  const today = toDateKey()
  const smartCandidates = getBacklogReviewTasksByPriority(store.tasks, today)
  const overdueTasks = useMemo(() => {
    const allOverdue = store.tasks.filter(
      (task) => task.status !== 'done' && isReviewTask(task) && compareDateKey(task.date, today) < 0,
    )

    if (sortMode === 'date') {
      return [...allOverdue].sort(
        (a, b) => compareDateKey(a.date, b.date) || a.id.localeCompare(b.id),
      )
    }

    return getOverdueReviewTasksByPriority(store.tasks, today)
  }, [sortMode, store.tasks, today])

  const totalOverdueDays = overdueTasks.reduce((sum, task) => sum + getOverdueDays(task.date, today), 0)
  const averageOverdueDays = overdueTasks.length > 0 ? (totalOverdueDays / overdueTasks.length).toFixed(1) : '0.0'

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-red-500">逾期任务</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">这些内容已经超过复习日期，建议优先处理。</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={store.pullNextBacklogReviewToToday}
              disabled={smartCandidates.length === 0}
              className={[
                'rounded-lg border px-4 py-2 text-sm font-semibold transition',
                smartCandidates.length === 0
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-red-100 bg-white text-red-600 hover:bg-red-50',
              ].join(' ')}
            >
              智能补排
            </button>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
            >
              <option value="priority">按智能优先级</option>
              <option value="date">按逾期时间</option>
            </select>
            <MascotNote />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard label="逾期任务" value={overdueTasks.length} tone="red" />
          <StatCard label="逾期天数总和" value={totalOverdueDays} unit="天" tone="amber" />
          <StatCard label="平均逾期天数" value={averageOverdueDays} unit="天" tone="slate" />
        </div>
      </section>

      {overdueTasks.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <img src={naughtyGif} alt="没有逾期任务" className="mx-auto h-16 w-16 rounded-lg object-cover" />
          <p className="mt-4 font-semibold text-slate-900">没有逾期任务</p>
          <p className="mt-2 text-sm text-slate-500">很好，之前的复习都没有欠账。</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {overdueTasks.map((task) => {
            const item = store.itemsById.get(task.itemId)

            return (
              <OverdueTaskRow
                key={task.id}
                task={task}
                item={item}
                groupName={item?.groupId ? store.groupsById.get(item.groupId)?.name : ''}
                tasks={store.tasks}
                today={today}
                onScheduleToday={store.scheduleReviewTaskToday}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}

export default OverduePage
