import AppIcon from '../layout/AppIcon.jsx'

function WeekSummaryCard({ summary }) {
  const rows = [
    { label: '新背', value: summary.newCount, color: 'text-blue-600', icon: 'calendar' },
    { label: '复习', value: summary.reviewCount, color: 'text-violet-600', icon: 'clock' },
    { label: '积压补排', value: summary.backlogCount, color: 'text-amber-600', icon: 'today' },
  ]

  return (
    <section className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">本周概览</h2>
        <p className="mt-1 text-xs text-slate-500">{summary.dateText}</p>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon name={row.icon} className={row.color} />
              <span className="text-sm font-medium text-slate-500">{row.label}</span>
            </div>
            <span className="text-lg font-semibold text-slate-950">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WeekSummaryCard
