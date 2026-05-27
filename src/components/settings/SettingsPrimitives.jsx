function IconBox({ tone = 'red', children }) {
  const toneClass = {
    red: 'border-red-100 bg-red-50 text-red-500',
    blue: 'border-blue-100 bg-blue-50 text-blue-500',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    violet: 'border-violet-100 bg-violet-50 text-violet-600',
    amber: 'border-amber-100 bg-amber-50 text-amber-500',
    slate: 'border-slate-200 bg-slate-50 text-slate-500',
  }[tone]

  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
      {children}
    </span>
  )
}

function LineIcon({ name }) {
  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M12 4l6 2v5.5c0 3.8-2.4 6.7-6 8.5-3.6-1.8-6-4.7-6-8.5V6l6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 12l1.7 1.7 3.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'desktop') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 19h4M12 15v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect x="5" y="6.5" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 4.5v4M15.5 4.5v4M5 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'wave') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M5 13h3l2-5 3.2 9 2-5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'grid') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'eye') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M4.5 12s2.6-5 7.5-5 7.5 5 7.5 5-2.6 5-7.5 5-7.5-5-7.5-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  )
}

export function CardTitle({ icon, tone, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <IconBox tone={tone}>
        <LineIcon name={icon} />
      </IconBox>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export function SettingPanel({ icon, tone, title, description, children }) {
  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <IconBox tone={tone}>
          <LineIcon name={icon} />
        </IconBox>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function ModeSummaryRow({ icon, tone, title, description }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
      <IconBox tone={tone}>
        <LineIcon name={icon} />
      </IconBox>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export function StaticRow({ icon, title, description, trailing }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox tone="slate">
          <LineIcon name={icon} />
        </IconBox>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 truncate text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  )
}

export function RhythmTip() {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex gap-3 text-sm leading-6 text-slate-500">
        <IconBox tone="slate">
          <LineIcon name="eye" />
        </IconBox>
        <p>
          <span className="font-semibold text-slate-700">节奏小贴士：</span>
          保持稳定的节奏比短期冲刺更有效，建议长期坚持，让记忆在合适的间隔中自然巩固。
        </p>
      </div>
    </div>
  )
}
