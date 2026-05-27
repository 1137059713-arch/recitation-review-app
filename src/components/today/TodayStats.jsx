function StatIcon({ type }) {
  if (type === 'pending') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <rect x="5" y="6.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 4.5v4M16 4.5v4M5 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'load') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'rhythm') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7.5 12h2.2l1.6-3.5 2.4 7 1.5-3.5h1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ accent, icon, label, value, suffix, detail }) {
  const accentClasses = {
    red: 'border-red-100 bg-red-50 text-red-500',
    blue: 'border-blue-100 bg-blue-50 text-blue-500',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50 text-amber-500',
  }

  return (
    <div className="flex min-h-[82px] items-center gap-5 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${accentClasses[accent]}`}>
        <StatIcon type={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold leading-none text-slate-950">
          {value}
          {suffix && <span className="ml-1 text-sm font-medium text-slate-500">{suffix}</span>}
        </p>
        {detail && <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>}
      </div>
    </div>
  )
}

function TodayStats({ pendingCount, totalLoad, capacity, rhythm, overdueCount }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-4">
      <StatCard accent="red" icon="pending" label="待完成" value={pendingCount} suffix="条" />
      <StatCard
        accent="blue"
        icon="load"
        label="预计负载"
        value={totalLoad.toFixed(1)}
        suffix={`/ ${capacity.maxStudyLoad.toFixed(1)}`}
      />
      <StatCard accent="emerald" icon="rhythm" label="今日节奏" value={rhythm} />
      <StatCard accent="amber" icon="overdue" label="逾期" value={overdueCount} suffix="条" />
    </div>
  )
}

export default TodayStats
