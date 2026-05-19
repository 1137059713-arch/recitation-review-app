import { formatDate } from '../../utils/date.js'
import StatPill from './StatPill.jsx'
import TaskChip from './TaskChip.jsx'

function DayScheduleCard({ day }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-[150px_1fr]">
        <div className="flex lg:block">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-950">{day.weekday}</h3>
              {day.isToday && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                  今天
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">{formatDate(day.date)}</p>
          </div>
          <span className={`ml-3 shrink-0 self-start rounded-full border px-2.5 py-1 text-xs font-semibold lg:ml-0 lg:mt-4 lg:inline-block ${day.loadMeta.badgeClass}`}>
            {day.loadMeta.label}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="新背" value={day.newCount} tone="emerald" />
            <StatPill label="复习" value={day.reviewCount} />
            <StatPill label="积压补排" value={day.backlogCount} tone={day.backlogCount > 0 ? 'amber' : 'slate'} />
            <StatPill label="预计负载" value={day.load.toFixed(1)} tone={day.load > 3 ? 'red' : 'slate'} />
          </div>

          {day.tasks.length > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${day.loadMeta.barClass}`}
                style={{ width: day.loadMeta.width }}
              />
            </div>
          )}

          {day.tasks.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">
              {day.isRestDay ? '休息日，系统不会主动安排复习。' : '这一天暂时没有背诵任务。'}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {day.tasks.map((task) => (
                <TaskChip key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default DayScheduleCard
