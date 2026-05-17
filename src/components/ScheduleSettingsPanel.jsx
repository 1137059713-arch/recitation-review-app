import { WEEKDAY_LABELS } from '../utils/schedule.js'

function ScheduleSettingsPanel({ settings, onUpdate }) {
  const restDays = settings?.restDays || [0]
  const restDay = restDays[0] ?? 0

  function handleRestDayChange(event) {
    onUpdate({
      restDays: [Number(event.target.value)],
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-500">排程设置</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">休息日</p>
        </div>
        <label className="block sm:w-36">
          <span className="sr-only">每周休息</span>
          <select
            value={restDay}
            onChange={handleRestDayChange}
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
    </div>
  )
}

export default ScheduleSettingsPanel
