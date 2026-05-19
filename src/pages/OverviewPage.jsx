import { Link } from 'react-router-dom'
import { getOverviewSummary } from '../utils/overviewSummary.js'

function StatCard({ title, value, caption, tone }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/50 text-blue-600',
    green: 'border-green-100 bg-green-50/60 text-green-600',
    red: 'border-red-100 bg-red-50/60 text-red-600',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-600',
  }

  return (
    <article className={`rounded-lg border p-5 shadow-sm ${tones[tone] || tones.blue}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{caption}</p>
    </article>
  )
}

function Panel({ title, caption, action, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {caption && <p className="mt-1 text-sm text-slate-500">{caption}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}

function BookProgressPreview({ books }) {
  if (books.length === 0) {
    return <EmptyState text="还没有设置书籍章节。" />
  }

  return (
    <div className="space-y-4">
      {books.slice(0, 5).map((book) => (
        <div key={book.group.id} className="grid grid-cols-[110px_1fr_56px] items-center gap-4 text-sm">
          <span className="truncate font-semibold text-slate-700">{book.group.name}</span>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${book.percent}%`, backgroundColor: book.color }}
            />
          </div>
          <span className="text-right text-xs font-medium text-slate-500">
            {book.completed}/{book.total} 章
          </span>
        </div>
      ))}
    </div>
  )
}

function WeakTopPreview({ weakItems }) {
  if (weakItems.length === 0) {
    return <EmptyState text="暂时没有薄弱章节。" />
  }

  return (
    <div className="space-y-3">
      {weakItems.slice(0, 5).map(({ item, group, mastery }) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{group?.name || '未分组'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            掌握度 {mastery.score || 0}
          </span>
        </div>
      ))}
    </div>
  )
}

function TrendPanel({ days }) {
  const width = 640
  const height = 220
  const padding = { top: 22, right: 18, bottom: 34, left: 42 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const series = [
    { key: 'newCount', label: '新背', color: '#3b82f6', fill: '#3b82f61f' },
    { key: 'reviewCount', label: '复习', color: '#8b5cf6', fill: '#8b5cf61a' },
    { key: 'doneCount', label: '完成', color: '#22c55e', fill: '#22c55e1f' },
  ]
  const maxValue = Math.max(1, ...days.flatMap((day) => series.map((item) => day[item.key])))
  const ticks = [maxValue, Math.round(maxValue / 2), 0]

  function getPoint(day, index, key) {
    const x = padding.left + (days.length === 1 ? 0 : (index / (days.length - 1)) * chartWidth)
    const y = padding.top + chartHeight - (day[key] / maxValue) * chartHeight

    return { x, y }
  }

  function getLinePath(key) {
    return days
      .map((day, index) => {
        const point = getPoint(day, index, key)
        return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
      })
      .join(' ')
  }

  function getAreaPath(key) {
    const line = getLinePath(key)
    const lastX = padding.left + chartWidth
    const baseY = padding.top + chartHeight

    return `${line} L ${lastX} ${baseY} L ${padding.left} ${baseY} Z`
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
          近7天
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="近 7 天学习趋势" className="h-56 w-full">
          {ticks.map((tick) => {
            const y = padding.top + chartHeight - (tick / maxValue) * chartHeight

            return (
              <g key={tick}>
                <line x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                  {tick}
                </text>
              </g>
            )
          })}

          {series.map((item) => (
            <path key={`${item.key}-area`} d={getAreaPath(item.key)} fill={item.fill} />
          ))}

          {series.map((item) => (
            <path
              key={`${item.key}-line`}
              d={getLinePath(item.key)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {series.map((item) =>
            days.map((day, index) => {
              const point = getPoint(day, index, item.key)

              return (
                <circle
                  key={`${item.key}-${day.date}`}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="white"
                  stroke={item.color}
                  strokeWidth="2"
                />
              )
            }),
          )}

          {days.map((day, index) => {
            const x = padding.left + (days.length === 1 ? 0 : (index / (days.length - 1)) * chartWidth)

            return (
              <text key={day.date} x={x} y={height - 10} textAnchor="middle" className="fill-slate-400 text-[11px]">
                {day.date}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function MasteryDonut({ distribution }) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0)
  let cursor = 0
  const gradient = total === 0
    ? '#e2e8f0 0 100%'
    : distribution
        .map((item) => {
          const start = cursor
          const end = cursor + (item.count / total) * 100
          cursor = end
          return `${item.color} ${start}% ${end}%`
        })
        .join(', ')

  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
      <div className="mx-auto h-40 w-40 rounded-full p-8" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-950">
          {total}
        </div>
      </div>
      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold text-slate-950">{item.count}</span>
          </div>
        ))}
        {total === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            暂时还没有复习结果，完成一次复习后会开始统计。
          </p>
        )}
      </div>
    </div>
  )
}

function OverviewPage({ store }) {
  const summary = getOverviewSummary(store)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-red-500">全部总览</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">学习总览</h2>
        <p className="mt-1 text-sm text-slate-500">全局掌握情况，一目了然。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="总内容" value={summary.stats.totalItems} caption="已加入背诵库" tone="blue" />
        <StatCard title="已掌握" value={summary.stats.masteredItems} caption="掌握度 80% 以上" tone="green" />
        <StatCard title="薄弱内容" value={summary.stats.weakItems} caption="需要加强" tone="red" />
        <StatCard title="逾期学习" value={summary.stats.overdueTasks} caption="坚持处理掉" tone="violet" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="书籍章节进度"
          action={<Link className="text-sm font-semibold text-slate-500 hover:text-red-600" to="/books">查看全部</Link>}
        >
          <BookProgressPreview books={summary.bookProgress} />
        </Panel>

        <Panel
          title="薄弱章节 TOP 5"
          action={<Link className="text-sm font-semibold text-slate-500 hover:text-red-600" to="/weak">查看全部</Link>}
        >
          <WeakTopPreview weakItems={summary.weakTop} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="学习趋势（近 7 天）" caption="新背、复习和完成情况">
          <TrendPanel days={summary.lastSevenDays} />
        </Panel>

        <Panel title="掌握度分布">
          <MasteryDonut distribution={summary.masteryDistribution} />
        </Panel>
      </div>
    </div>
  )
}

export default OverviewPage
