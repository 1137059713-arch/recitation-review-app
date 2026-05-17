import { useEffect } from 'react'
import { getTaskScheduledDate } from '../utils/schedule.js'
import { formatDate, toDateKey } from '../utils/date.js'

function SidebarSection({ title, tasks, itemsById, groupsById, emptyText }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const item = itemsById.get(task.itemId)
            const group = item?.groupId ? groupsById.get(item.groupId) : null

            return (
              <article
                key={task.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-red-100 hover:shadow-md"
              >
                {group && (
                  <p className="mb-1 truncate text-xs font-semibold text-red-500">
                    {group.name}
                  </p>
                )}
                <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                  {item?.title || '已删除内容'}
                </h3>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SidebarPage({ store }) {
  const today = toDateKey()
  const todayTasks = store.tasks.filter(
    (task) => getTaskScheduledDate(task) === today && task.status !== 'done',
  )
  const newTasks = todayTasks.filter((task) => task.type === 'new')
  const reviewTasks = todayTasks.filter((task) => task.type !== 'new')
  const totalCount = newTasks.length + reviewTasks.length

  useEffect(() => {
    const panel = window.sidebarPanel
    if (!panel) return undefined

    let hideTimer = null
    const removeRefreshListener = panel.onRefresh?.(() => {
      store.refreshState()
    })
    const show = () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer)
        hideTimer = null
      }
      store.refreshState()
      panel.show()
    }
    const hide = () => {
      hideTimer = window.setTimeout(() => panel.hide(), 280)
    }

    window.addEventListener('mouseenter', show)
    window.addEventListener('mouseleave', hide)

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer)
      removeRefreshListener?.()
      window.removeEventListener('mouseenter', show)
      window.removeEventListener('mouseleave', hide)
    }
  }, [store])

  return (
    <div className="min-h-screen bg-transparent p-2 text-slate-900">
      <div className="h-[calc(100vh-1rem)] overflow-hidden rounded-l-2xl border border-white/70 bg-white/95 shadow-xl shadow-slate-950/15 backdrop-blur">
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-100 px-4 py-4">
            <p className="text-xs font-medium text-red-500">{formatDate(today)}</p>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-normal text-slate-950">今日</h1>
                <p className="mt-0.5 text-xs text-slate-400">今天要做的事</p>
              </div>
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                {totalCount}
              </span>
            </div>
          </header>

          <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <SidebarSection
              title="新背"
              tasks={newTasks}
              itemsById={store.itemsById}
              groupsById={store.groupsById}
              emptyText="今天没有新背"
            />
            <SidebarSection
              title="复习"
              tasks={reviewTasks}
              itemsById={store.itemsById}
              groupsById={store.groupsById}
              emptyText="今天没有复习"
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export default SidebarPage
