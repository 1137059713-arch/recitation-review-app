import { WEEKDAY_LABELS } from '../../utils/schedule.js'
import { STUDY_MODE_OPTIONS, WEEKDAY_ORDER } from './settingsOptions.js'
import { SettingPanel } from './SettingsPrimitives.jsx'

export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-md border px-4 py-2 text-sm font-semibold transition',
              active
                ? 'border-red-300 bg-red-50 text-red-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function StudyModePicker({ value, onChange }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {STUDY_MODE_OPTIONS.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-lg border p-4 text-left transition',
              active
                ? 'border-red-300 bg-red-50 text-red-600 shadow-sm shadow-red-100'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="text-base font-semibold">{option.label}</span>
            <span className="mt-2 block text-xs leading-5 text-slate-500">{option.description}</span>
          </button>
        )
      })}
    </div>
  )
}

export function RestDayPanel({ value, onChange }) {
  return (
    <SettingPanel
      icon="calendar"
      tone="emerald"
      title="每周休息日"
      description="固定一天不安排新背和复习，给大脑放个假。"
    >
      <SegmentedControl
        className="grid-cols-7 lg:max-w-[390px]"
        value={value}
        options={WEEKDAY_ORDER.map((day) => ({
          value: day,
          label: WEEKDAY_LABELS[day],
        }))}
        onChange={(nextValue) => onChange({ restDays: [nextValue] })}
      />
    </SettingPanel>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={[
        'relative h-6 w-11 rounded-full transition',
        checked ? 'bg-red-500' : 'bg-slate-300',
      ].join(' ')}
      aria-pressed={checked}
    >
      <span className={[
        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
        checked ? 'left-5' : 'left-0.5',
      ].join(' ')}
      />
    </button>
  )
}

export function OutlineButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
    >
      {children}
    </button>
  )
}

export function OpacitySlider({ value, onChange }) {
  const percent = Math.round(value * 100)

  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <input
        type="range"
        min="60"
        max="100"
        step="5"
        value={percent}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-1.5 flex-1 accent-red-500"
        aria-label="窗口透明度"
      />
      <span className="w-10 text-right text-sm font-semibold text-slate-500">{percent}%</span>
    </div>
  )
}
