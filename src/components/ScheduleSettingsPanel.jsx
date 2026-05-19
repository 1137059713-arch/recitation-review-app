import {
  BACKLOG_STRATEGIES,
  REVIEW_LOAD_LEVELS,
  WEEKDAY_LABELS,
  normalizeScheduleSettings,
} from '../utils/schedule.js'

const REVIEW_LIMIT_OPTIONS = [2, 3, 4]

function OptionButton({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg border px-4 py-3 text-left transition',
        active
          ? 'border-red-200 bg-red-50 text-red-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {description && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
    </button>
  )
}

function ScheduleSettingsPanel({ settings, onUpdate }) {
  const normalizedSettings = normalizeScheduleSettings(settings)
  const restDay = normalizedSettings.restDays[0] ?? 0

  function updateSetting(updates) {
    onUpdate({
      ...normalizedSettings,
      ...updates,
    })
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-500">每周休息日</p>
            <p className="mt-1 text-sm text-slate-500">休息日不会主动安排复习，任务会顺延。</p>
          </div>
          <label className="block sm:w-40">
            <span className="sr-only">每周休息</span>
            <select
              value={restDay}
              onChange={(event) => updateSetting({ restDays: [Number(event.target.value)] })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
            >
              {WEEKDAY_LABELS.map((label, day) => (
                <option key={day} value={day}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <div>
          <p className="text-sm font-medium text-red-500">每日复习上限</p>
          <p className="mt-1 text-sm text-slate-500">控制系统每天自动安排多少条复习任务。</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {REVIEW_LIMIT_OPTIONS.map((value) => (
            <OptionButton
              key={value}
              active={normalizedSettings.dailyReviewLimit === value}
              title={`${value} 条`}
              description={value === 2 ? '轻一点' : value === 3 ? '默认' : '多处理'}
              onClick={() => updateSetting({ dailyReviewLimit: value })}
            />
          ))}
        </div>
      </section>

      <section>
        <div>
          <p className="text-sm font-medium text-red-500">每日复习负载上限</p>
          <p className="mt-1 text-sm text-slate-500">根据任务难度和掌握情况控制当天复习压力。</p>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {Object.entries(REVIEW_LOAD_LEVELS).map(([key, option]) => (
            <OptionButton
              key={key}
              active={normalizedSettings.reviewLoadLevel === key}
              title={`${option.label} · ${option.load.toFixed(1)}`}
              description={option.description}
              onClick={() => updateSetting({ reviewLoadLevel: key })}
            />
          ))}
        </div>
      </section>

      <section>
        <div>
          <p className="text-sm font-medium text-red-500">逾期补排策略</p>
          <p className="mt-1 text-sm text-slate-500">决定积压任务自动补进未来日程的积极程度。</p>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {Object.entries(BACKLOG_STRATEGIES).map(([key, option]) => (
            <OptionButton
              key={key}
              active={normalizedSettings.backlogStrategy === key}
              title={option.label}
              description={option.description}
              onClick={() => updateSetting({ backlogStrategy: key })}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default ScheduleSettingsPanel
