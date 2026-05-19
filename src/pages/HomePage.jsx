import AddItemForm from '../components/AddItemForm.jsx'
import TodayTaskSection from '../components/today/TodayTaskSection.jsx'
import {
  getBacklogReviewTasksByPriority,
  getReviewTaskLoad,
  getScheduleCapacity,
  getTaskScheduledDate,
} from '../utils/schedule.js'
import { toDateKey } from '../utils/date.js'

function HomePage({ store }) {
  const today = toDateKey()
  const todayTasks = store.tasks.filter((task) => getTaskScheduledDate(task) === today)
  const newTasks = todayTasks.filter((task) => task.type === 'new')
  const reviewTasks = todayTasks.filter((task) => task.type !== 'new')
  const capacity = getScheduleCapacity(store.scheduleSettings)
  const reviewLoad = reviewTasks.reduce((sum, task) => sum + getReviewTaskLoad(task, store.tasks), 0)
  const backlogCandidates = getBacklogReviewTasksByPriority(store.tasks, today)
  const pendingCount = todayTasks.filter((task) => task.status !== 'done').length
  const overdueCount = store.tasks.filter(
    (task) => getTaskScheduledDate(task) < today && task.status !== 'done',
  ).length

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">今天要背诵的内容</h2>
              <p className="mt-2 text-sm text-slate-500">先背新的，再复习旧的，稳扎稳打。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <p className="text-xs font-semibold text-slate-500">待完成</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{pendingCount}</p>
              </div>
              {overdueCount > 0 && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2">
                  <p className="text-xs font-semibold text-red-500">另有逾期</p>
                  <p className="mt-1 text-2xl font-semibold text-red-600">{overdueCount}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <TodayTaskSection
          title="新背内容"
          count={newTasks.length}
          tone="emerald"
          tasks={newTasks}
          itemsById={store.itemsById}
          groupsById={store.groupsById}
          onComplete={store.completeTask}
          emptyText="今天暂时没有新背任务。"
        />

        <TodayTaskSection
          title="复习内容"
          count={reviewTasks.length}
          tone="violet"
          tasks={reviewTasks}
          itemsById={store.itemsById}
          groupsById={store.groupsById}
          onComplete={store.completeTask}
          load={reviewLoad}
          loadLimit={capacity.maxReviewLoad}
          action={
            <button
              type="button"
              onClick={store.pullNextBacklogReviewToToday}
              disabled={backlogCandidates.length === 0}
              className={[
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition',
                backlogCandidates.length === 0
                  ? 'cursor-not-allowed text-slate-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-red-600',
              ].join(' ')}
              title={backlogCandidates.length === 0 ? '没有可补排的逾期复习' : '按逾期优先级补入今天'}
            >
              <span className="text-lg leading-none">+</span>
              添加复习任务
              {backlogCandidates.length > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  可补 {backlogCandidates.length}
                </span>
              )}
            </button>
          }
          emptyText="今天暂时没有复习任务。"
        />
      </div>

      <aside>
        <AddItemForm
          groups={store.groups}
          items={store.items}
          onAdd={store.addItem}
        />
      </aside>
    </div>
  )
}

export default HomePage
