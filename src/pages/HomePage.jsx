import AddItemForm from '../components/AddItemForm.jsx'
import TaskSection from '../components/TaskSection.jsx'
import { WEEKDAY_LABELS, getTaskScheduledDate } from '../utils/schedule.js'
import { formatDate, toDateKey } from '../utils/date.js'

function ScheduleSettings({ settings, onUpdate }) {
  const restDays = settings?.restDays || [0]
  const restDay = restDays[0] ?? 0

  function handleRestDayChange(event) {
    onUpdate({
      restDays: [Number(event.target.value)],
    })
  }

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-red-500">排程设置</p>
        <h3 className="mt-1 text-base font-semibold text-slate-950">休息日</h3>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-slate-700">每周休息</span>
        <select
          value={restDay}
          onChange={handleRestDayChange}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
        >
          {WEEKDAY_LABELS.map((label, day) => (
            <option key={day} value={day}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}

function HomePage({ store }) {
  const today = toDateKey()
  const todayTasks = store.tasks.filter((task) => getTaskScheduledDate(task) === today)
  const newTasks = todayTasks.filter((task) => task.type === 'new')
  const reviewTasks = todayTasks.filter((task) => task.type !== 'new')
  const pendingCount = todayTasks.filter((task) => task.status !== 'done').length
  const overdueCount = store.tasks.filter(
    (task) => getTaskScheduledDate(task) < today && task.status !== 'done',
  ).length

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="rounded-lg bg-slate-950 p-6 text-white shadow-soft">
          <p className="text-sm font-medium text-red-200">{formatDate(today)}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">今日任务</h2>
              <p className="mt-2 text-sm text-slate-300">先完成今天，再放心收工。</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <p className="text-sm text-slate-300">待完成</p>
              <p className="text-3xl font-semibold">{pendingCount}</p>
              {overdueCount > 0 && (
                <p className="mt-1 text-xs font-medium text-red-200">另有 {overdueCount} 项逾期</p>
              )}
            </div>
          </div>
        </section>

        {todayTasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <p className="font-semibold text-slate-900">今天还没有任务</p>
            <p className="mt-2 text-sm text-slate-500">添加一条新背内容，系统会自动排好复习时间。</p>
          </div>
        )}

        <TaskSection
          title="今日新背"
          tasks={newTasks}
          itemsById={store.itemsById}
          groupsById={store.groupsById}
          onComplete={store.completeTask}
          onUpdateItem={store.updateItem}
          onDeleteItem={store.deleteItem}
          emptyText="今天暂时没有新背任务。"
        />

        <TaskSection
          title="今日复习"
          tasks={reviewTasks}
          itemsById={store.itemsById}
          groupsById={store.groupsById}
          onComplete={store.completeTask}
          onUpdateItem={store.updateItem}
          onDeleteItem={store.deleteItem}
          emptyText="今天暂时没有复习任务。"
        />
      </div>

      <aside>
        <AddItemForm groups={store.groups} items={store.items} onAdd={store.addItem} />
        <ScheduleSettings settings={store.scheduleSettings} onUpdate={store.updateScheduleSettings} />
      </aside>
    </div>
  )
}

export default HomePage
