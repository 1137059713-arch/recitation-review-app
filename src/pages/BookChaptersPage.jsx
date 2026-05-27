import { useState } from 'react'
import FullTextModal from '../components/FullTextModal.jsx'
import { getOverviewSummary } from '../utils/overviewSummary.js'
import { getReviewCount } from '../utils/mastery.js'

function MasteryBadge({ mastery }) {
  const tones = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[mastery.tone] || tones.slate}`}>
      {mastery.score ? `${mastery.score}% ${mastery.status}` : mastery.status}
    </span>
  )
}

function ReviewCountBadge({ count }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      复习 {count} 次
    </span>
  )
}

function DeleteButton({ title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      title={title}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M9 5h6M10 5l.5-1h3L14 5M6.5 8h11M8 8l.6 11h6.8L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 11v5M13.5 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function BookChaptersPage({ store }) {
  const [readingItem, setReadingItem] = useState(null)
  const summary = getOverviewSummary(store)

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
      <div>
        <p className="text-sm font-medium text-red-500">书籍章节</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">按书籍查看背诵进度</h2>
        <p className="mt-1 text-sm text-slate-500">这里专门放章节型内容，不再挤在全部总览里。</p>
      </div>

      {summary.bookProgress.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-slate-500">
          还没有开启“书籍统计”的分组。
        </section>
      ) : (
        <div className="space-y-5">
          {summary.bookProgress.map((book) => (
            <section key={book.group.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-red-500">书籍</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{book.group.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    已背 {book.completed}/{book.total} 章
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                  {book.percent}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${book.percent}%`, backgroundColor: book.color }} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {book.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                    这本书还没有章节内容。
                  </div>
                ) : (
                  book.items.map(({ item, mastery, tasks }) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="truncate font-semibold text-slate-950">{item.title}</h4>
                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <ReviewCountBadge count={getReviewCount(tasks)} />
                          <MasteryBadge mastery={mastery} />
                          <DeleteButton title="删除章节" onClick={() => deleteItem(item)} />
                        </div>
                      </div>
                      {item.body && (
                        <button
                          type="button"
                          onClick={() => setReadingItem(item)}
                          className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          查看正文
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      <FullTextModal
        title={readingItem?.title}
        body={readingItem?.body}
        onClose={() => setReadingItem(null)}
      />
    </div>
  )
}

export default BookChaptersPage
