import { useMemo } from 'react'
import { getItemMastery, getReviewCount, isWeakMastery } from '../utils/mastery.js'

function MasteryBadge({ mastery }) {
  const toneClasses = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <span className={['rounded-full px-2.5 py-1 text-xs font-semibold', toneClasses[mastery.tone] || toneClasses.slate].join(' ')}>
      {mastery.score ? `${mastery.score}% ` : ''}{mastery.status}
    </span>
  )
}

function ReviewCountBadge({ count }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-red-100">
      复习 {count} 次
    </span>
  )
}

function WeakPage({ store }) {
  const tasksByItemId = useMemo(() => {
    const map = new Map()
    store.tasks.forEach((task) => {
      if (!map.has(task.itemId)) {
        map.set(task.itemId, [])
      }
      map.get(task.itemId).push(task)
    })
    return map
  }, [store.tasks])

  const weakItems = useMemo(() => {
    return store.items
      .map((item) => ({
        item,
        group: item.groupId ? store.groupsById.get(item.groupId) : null,
        tasks: tasksByItemId.get(item.id) || [],
        mastery: getItemMastery(tasksByItemId.get(item.id) || []),
      }))
      .filter(({ mastery }) => isWeakMastery(mastery))
      .sort((a, b) => {
        const scoreCompare = Number(a.mastery.score || 0) - Number(b.mastery.score || 0)
        return scoreCompare || a.item.title.localeCompare(b.item.title, 'zh-CN')
      })
  }, [store.items, store.groupsById, tasksByItemId])

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-red-100 bg-red-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-red-600">薄弱章节</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">最近复习需要关注</h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-600">
            {weakItems.length} 项
          </span>
        </div>

        {weakItems.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-red-100 bg-white/70 px-5 py-10 text-center text-sm text-slate-500">
            暂时没有薄弱章节。
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {weakItems.map(({ item, group, mastery, tasks }) => (
              <article key={item.id} className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <MasteryBadge mastery={mastery} />
                  <ReviewCountBadge count={getReviewCount(tasks)} />
                  {group && <span className="text-sm font-semibold text-red-600">{group.name}</span>}
                </div>
                <h3 className="mt-2 text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default WeakPage
