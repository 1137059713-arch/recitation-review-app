import { useEffect, useState } from 'react'
import { getTaskScheduledDate } from '../utils/schedule.js'
import { formatDate, toDateKey } from '../utils/date.js'

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 7 && hour < 19
}

function getTheme(isDay) {
  return isDay
    ? {
        page: 'text-slate-950',
        panel:
          'border-slate-900/[0.08] bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.22)]',
        divider: 'border-slate-900/[0.08]',
        eyebrow: 'text-slate-500',
        title: 'text-slate-950',
        muted: 'text-slate-500',
        sectionTitle: 'text-slate-800',
        count: 'border-slate-900/10 bg-slate-950/[0.04] text-slate-500',
        empty:
          'border-slate-900/10 bg-slate-950/[0.03] text-slate-400',
        card:
          'border-slate-900/10 bg-white/75 shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:border-slate-900/15 hover:bg-white',
        cardTitle: 'text-slate-950',
        group: 'text-slate-500',
        summary: 'border-slate-900/10 bg-slate-950/[0.035]',
        summaryText: 'text-slate-800',
        summaryMeta: 'text-slate-500',
        track: 'bg-slate-950/10',
        topBadge:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[0_0_22px_rgba(16,185,129,0.10)]',
      }
    : {
        page: 'text-white',
        panel:
          'border-white/[0.10] bg-[#121214]/95 shadow-[0_24px_80px_rgba(0,0,0,0.48)]',
        divider: 'border-white/[0.08]',
        eyebrow: 'text-white/[0.45]',
        title: 'text-white',
        muted: 'text-white/[0.45]',
        sectionTitle: 'text-white/90',
        count: 'border-white/10 bg-white/[0.06] text-white/[0.55]',
        empty:
          'border-white/10 bg-white/[0.035] text-white/[0.35]',
        card:
          'border-white/10 bg-white/[0.055] shadow-[0_16px_40px_rgba(0,0,0,0.18)] hover:border-white/20 hover:bg-white/[0.075]',
        cardTitle: 'text-white',
        group: 'text-white/[0.42]',
        summary: 'border-white/10 bg-white/[0.045]',
        summaryText: 'text-white/[0.82]',
        summaryMeta: 'text-white/[0.38]',
        track: 'bg-white/10',
        topBadge:
          'border-emerald-300/25 bg-emerald-300/[0.12] text-emerald-100 shadow-[0_0_22px_rgba(110,231,183,0.16)]',
      }
}

function getTaskTone(task, isDay) {
  return task.type === 'new'
    ? {
        dot: 'bg-emerald-300',
        edge: 'from-emerald-300 to-cyan-300',
        pill: isDay
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-emerald-300/[0.12] text-emerald-100 ring-emerald-300/20',
        label: '新背',
      }
    : {
        dot: 'bg-violet-300',
        edge: 'from-violet-300 to-fuchsia-300',
        pill: isDay
          ? 'bg-violet-500/10 text-violet-700 ring-violet-500/20'
          : 'bg-violet-300/[0.12] text-violet-100 ring-violet-300/20',
        label: '复习',
      }
}

function SidebarSection({ title, tasks, itemsById, groupsById, emptyText, theme, isDay }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className={`text-xs font-semibold ${theme.sectionTitle}`}>{title}</h2>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${theme.count}`}>
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className={`rounded-2xl border border-dashed px-3 py-4 text-center text-xs ${theme.empty}`}>
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const item = itemsById.get(task.itemId)
            const group = item?.groupId ? groupsById.get(item.groupId) : null
            const tone = getTaskTone(task, isDay)

            return (
              <article
                key={task.id}
                className={`group relative overflow-hidden rounded-2xl border px-3.5 py-3 transition duration-200 ${theme.card}`}
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
                        <span className={`truncate text-[11px] font-medium ${theme.group}`}>
                          {group.name}
                        </span>
                      )}
                    </div>
                    <h3 className={`line-clamp-2 text-sm font-semibold leading-5 ${theme.cardTitle}`}>
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
  const [isDay, setIsDay] = useState(() => isDaytime())
  const theme = getTheme(isDay)
  const today = toDateKey()
  const todayTasks = store.tasks.filter(
    (task) => getTaskScheduledDate(task) === today && task.status !== 'done',
  )
  const newTasks = todayTasks.filter((task) => task.type === 'new')
  const reviewTasks = todayTasks.filter((task) => task.type !== 'new')
  const totalCount = newTasks.length + reviewTasks.length
  const completionText = totalCount > 0 ? `今天 ${totalCount} 项` : '今天很轻松'

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const previous = {
      rootBackground: root.style.background,
      rootOverflow: root.style.overflow,
      bodyBackground: body.style.background,
      bodyOverflow: body.style.overflow,
      bodyMinWidth: body.style.minWidth,
    }

    root.style.background = 'transparent'
    root.style.overflow = 'hidden'
    body.style.background = 'transparent'
    body.style.overflow = 'hidden'
    body.style.minWidth = '0'

    return () => {
      root.style.background = previous.rootBackground
      root.style.overflow = previous.rootOverflow
      body.style.background = previous.bodyBackground
      body.style.overflow = previous.bodyOverflow
      body.style.minWidth = previous.bodyMinWidth
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsDay(isDaytime())
    }, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

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
    <div className={`fixed inset-0 h-screen w-screen overflow-hidden bg-transparent ${theme.page}`}>
      <div className={`h-full w-full overflow-hidden rounded-l-[28px] border backdrop-blur-2xl ${theme.panel}`}>
        <div className="flex h-full flex-col">
          <header className={`border-b px-4 py-4 ${theme.divider}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-medium ${theme.eyebrow}`}>{formatDate(today)}</p>
                <h1 className={`mt-1 text-2xl font-semibold tracking-normal ${theme.title}`}>今日</h1>
                <p className={`mt-0.5 text-xs ${theme.muted}`}>只看今天要背的内容</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${theme.topBadge}`}>
                {totalCount}
              </span>
            </div>

            <div className={`mt-4 rounded-2xl border p-3 ${theme.summary}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${theme.summaryText}`}>{completionText}</span>
                <span className={`shrink-0 ${theme.summaryMeta}`}>新背 {newTasks.length} / 复习 {reviewTasks.length}</span>
              </div>
              <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${theme.track}`}>
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
              theme={theme}
              isDay={isDay}
            />
            <SidebarSection
              title="复习"
              tasks={reviewTasks}
              itemsById={store.itemsById}
              groupsById={store.groupsById}
              emptyText="今天没有复习"
              theme={theme}
              isDay={isDay}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export default SidebarPage
