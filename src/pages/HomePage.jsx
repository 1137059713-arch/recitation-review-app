import AddItemForm from '../components/AddItemForm.jsx'
import TodayAdvice from '../components/today/TodayAdvice.jsx'
import TodayStats from '../components/today/TodayStats.jsx'
import TodayTaskSection from '../components/today/TodayTaskSection.jsx'
import { getTodaySummary } from '../utils/todaySummary.js'

function HomePage({ store }) {
  const {
    newTasks,
    reviewTasks,
    capacity,
    reviewLoad,
    totalLoad,
    pendingCount,
    overdueCount,
    rhythm,
  } = getTodaySummary(store.tasks, store.scheduleSettings)

  return (
    <div className="grid h-[calc(100vh-3rem)] min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/90 p-6 shadow-sm">
        <section className="shrink-0">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">今天要背的内容</h2>
            <p className="mt-2 text-sm text-slate-500">先背新的，再复习旧的，稳扎稳打。</p>
          </div>
          <TodayStats
            pendingCount={pendingCount}
            totalLoad={totalLoad}
            capacity={capacity}
            rhythm={rhythm}
            overdueCount={overdueCount}
          />
        </section>

        <div className="mt-5 grid min-h-0 flex-1 grid-rows-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-4">
          <TodayTaskSection
            className="min-h-0"
            title="新背内容"
            count={newTasks.length}
            tone="emerald"
            tasks={newTasks}
            itemsById={store.itemsById}
            groupsById={store.groupsById}
            onComplete={store.completeTask}
            onDeleteItem={store.deleteItem}
            emptyText="今天暂时没有新背任务。"
          />

          <TodayTaskSection
            className="min-h-0"
            title="复习内容"
            count={reviewTasks.length}
            tone="violet"
            tasks={reviewTasks}
            itemsById={store.itemsById}
            groupsById={store.groupsById}
            onComplete={store.completeTask}
            onDeleteItem={store.deleteItem}
            load={reviewLoad}
            loadLimit={capacity.maxReviewLoad}
            emptyText="今天暂时没有复习任务。"
          />
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <AddItemForm
          className="min-h-0 flex-1"
          groups={store.groups}
          items={store.items}
          onAdd={store.addItem}
        />
        <TodayAdvice
          pendingCount={pendingCount}
          newCount={newTasks.length}
          reviewCount={reviewTasks.length}
          totalLoad={totalLoad}
          loadLimit={capacity.maxStudyLoad}
        />
      </aside>
    </div>
  )
}

export default HomePage
