import TaskCard from '../components/TaskCard.jsx'
import naughtyGif from '../assets/naughty.gif'
import { getTaskScheduledDate } from '../utils/schedule.js'
import { compareDateKey, formatDate, toDateKey } from '../utils/date.js'

function OverduePage({ store }) {
  const today = toDateKey()
  const overdueTasks = store.tasks
    .filter((task) => getTaskScheduledDate(task) < today && task.status !== 'done')
    .sort((a, b) => compareDateKey(getTaskScheduledDate(a), getTaskScheduledDate(b)))

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg bg-red-600 text-white shadow-soft">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-100">补上之前漏掉的任务</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">逾期任务</h2>
            <p className="mt-2 text-sm text-red-100">你不乖哦！</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white/15 px-4 py-3">
              <p className="text-sm text-red-100">待补</p>
              <p className="text-3xl font-semibold">{overdueTasks.length}</p>
            </div>
            <img
              src={naughtyGif}
              alt="你不乖哦"
              className="h-28 w-28 rounded-lg object-cover ring-4 ring-white/20 sm:h-32 sm:w-32"
            />
          </div>
        </div>
      </section>

      {overdueTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <p className="font-semibold text-slate-900">没有逾期任务</p>
          <p className="mt-2 text-sm text-slate-500">很好，之前的复习都没有欠账。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueTasks.map((task) => {
            const item = store.itemsById.get(task.itemId)
            return (
              <section key={task.id} className="rounded-lg border border-red-100 bg-red-50/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-red-700">
                    安排 {formatDate(getTaskScheduledDate(task))}
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-600">
                    已逾期
                  </span>
                </div>
                <TaskCard
                  task={task}
                  item={item}
                  groupName={item?.groupId ? store.groupsById.get(item.groupId)?.name : ''}
                  onComplete={store.completeTask}
                  onUpdateItem={store.updateItem}
                  onDeleteItem={store.deleteItem}
                />
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OverduePage
