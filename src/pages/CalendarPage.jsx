import TaskCard from '../components/TaskCard.jsx'
import { getTaskScheduledDate } from '../utils/schedule.js'
import { compareDateKey, formatDate } from '../utils/date.js'

function groupTasksByDate(tasks) {
  const groups = new Map()

  tasks.forEach((task) => {
    const scheduledDate = getTaskScheduledDate(task)

    if (!groups.has(scheduledDate)) {
      groups.set(scheduledDate, [])
    }

    groups.get(scheduledDate).push(task)
  })

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) => compareDateKey(dateA, dateB))
    .map(([date, groupedTasks]) => [date, groupedTasks])
}

function CalendarPage({ store }) {
  const groupedTasks = groupTasksByDate(store.tasks)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-red-500">按日期查看</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">任务日期列表</h2>
      </div>

      {groupedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-slate-500">
          还没有任务安排。
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTasks.map(([date, tasks]) => (
            <section key={date} className="rounded-lg border border-slate-200 bg-white/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-950">{formatDate(date)}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {tasks.length} 项
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const item = store.itemsById.get(task.itemId)
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      item={item}
                      groupName={item?.groupId ? store.groupsById.get(item.groupId)?.name : ''}
                      onComplete={store.completeTask}
                      onUpdateItem={store.updateItem}
                      onDeleteItem={store.deleteItem}
                      compact
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default CalendarPage
