import { useEffect } from 'react'
import { getTaskScheduledDate } from '../utils/schedule.js'
import { formatDate, toDateKey } from '../utils/date.js'

function getTaskTone(task) {
  return task.type === 'new'
    ? {
        dot: 'bg-emerald-300',
        edge: 'from-emerald-300 to-cyan-300',
        pill: 'bg-emerald-300/12 text-emerald-100 ring-emerald-300/20',
        label: '新背',
      }
    : {
        dot: 'bg-violet-300',
        edge: 'from-violet-300 to-fuchsia-300',
        pill: 'bg-violet-300/12 text-violet-100 ring-violet-300/20',
        label: '复习',
      }
}

function SidebarSection({ title, tasks, itemsById, groupsById, emptyText }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-white/90">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-white/[0.55]">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.035] px-3 py-4 text-center text-xs text-white/[0.35]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const item = itemsById.get(task.itemId)
            const group = item?.groupId ? groupsById.get(item.groupId) : null
            const tone = getTaskTone(task)

            return (
              <article
                key={task.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition duration-200 hover:border-white/20 hover:bg-white/[0.075]"
              >
                <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${tone.edge}`} />
                <div className="flex items-start gap-3 pl-1">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot} shadow-[0_0_16px_currentColor]`} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone.pill}`}>
                        {tone.label}
                      </span>
                      {group && (
                        <span className="truncate text-[11px] font-medium text-white/[0.42]">
                          {group.name}
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                      {item?.title || '已删除内容'}
                    </h3>
                  </div>
                </div>
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
  const completionText = totalCount > 0 ? `今天 ${totalCount} 项` : '今天很轻松'

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
    <div className="min-h-screen bg-transparent p-2 text-white">
      <div className="h-[calc(100vh-1rem)] overflow-hidden rounded-l-[28px] border border-white/[0.12] bg-[#121214]/95 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
        <div className="flex h-full flex-col">
          <header className="border-b border-white/[0.08] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/[0.45]">{formatDate(today)}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white">今日</h1>
                <p className="mt-0.5 text-xs text-white/[0.45]">只看今天要背的内容</p>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 py-1 text-sm font-semibold text-emerald-100 shadow-[0_0_22px_rgba(110,231,183,0.16)]">
                {totalCount}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/[0.82]">{completionText}</span>
                <span className="text-white/[0.38]">新背 {newTasks.length} / 复习 {reviewTasks.length}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300"
                  style={{ width: totalCount > 0 ? '100%' : '18%' }}
                />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
