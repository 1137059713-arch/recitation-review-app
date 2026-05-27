import { useMemo, useState } from 'react'
import { getOverviewSummary } from '../utils/overviewSummary.js'
import { getReviewCount } from '../utils/mastery.js'

function ReviewCountBadge({ count }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      复习 {count} 次
    </span>
  )
}

function DeleteButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      title="删除内容"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M9 5h6M10 5l.5-1h3L14 5M6.5 8h11M8 8l.6 11h6.8L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 11v5M13.5 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function OtherTasksPage({ store }) {
  const [keyword, setKeyword] = useState('')
  const summary = getOverviewSummary(store)

  const filteredItems = useMemo(() => {
    const value = keyword.trim().toLowerCase()
    if (!value) return summary.otherItems

    return summary.otherItems.filter(({ item, group }) =>
      item.title.toLowerCase().includes(value) ||
      item.body.toLowerCase().includes(value) ||
      group?.name.toLowerCase().includes(value),
    )
  }, [keyword, summary.otherItems])

  function deleteItem(item) {
    const confirmed = window.confirm(
      `确定删除“${item.title}”吗？删除后，这条内容的所有复习计划也会一起删除。`,
    )

    if (confirmed) {
      store.deleteItem(item.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-red-500">其他任务</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">非书籍内容总览</h2>
          <p className="mt-1 text-sm text-slate-500">零散资料、单词、临时材料都放在这里看。</p>
        </div>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 lg:w-72"
          placeholder="搜索标题、正文或分组"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">其他内容</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.otherItems.length}</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">当前匹配</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{filteredItems.length}</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">薄弱项</p>
          <p className="mt-3 text-3xl font-semibold text-red-600">
            {summary.otherItems.filter(({ isWeak }) => isWeak).length}
          </p>
        </section>
      </div>

      {filteredItems.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-slate-500">
          没有找到其他任务内容。
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filteredItems.map(({ item, group, mastery, tasks }) => (
              <article key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-center">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-950">{item.title}</h3>
                  {item.body && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.body}</p>}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {group?.name || '未分组'}
                </span>
                <ReviewCountBadge count={getReviewCount(tasks)} />
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  {mastery.score ? `${mastery.score}% ${mastery.status}` : `${tasks.length} 个安排`}
                </span>
                <DeleteButton onClick={() => deleteItem(item)} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default OtherTasksPage
