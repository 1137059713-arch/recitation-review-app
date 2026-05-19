import { useState } from 'react'
import { getEstimatedDifficultyOption } from '../../utils/difficulty.js'
import { MASTERY_OPTIONS } from '../../utils/mastery.js'
import { getTaskScheduledDate, TASK_LABELS } from '../../utils/schedule.js'

function TodayTaskRow({
  index,
  task,
  item,
  groupName = '',
  onComplete,
}) {
  const [error, setError] = useState('')
  const isNewTask = task.type === 'new'
  const isDone = task.status === 'done'
  const isBacklogTask = !isNewTask && getTaskScheduledDate(task) > task.date
  const estimatedDifficulty = isNewTask ? getEstimatedDifficultyOption(task.estimatedDifficulty) : null
  const title = item?.title || '已删除内容'
  const detail = groupName || item?.body?.split('\n').find(Boolean) || TASK_LABELS[task.type]

  function completeNewTask() {
    if (isDone) {
      onComplete(task.id)
      return
    }

    onComplete(task.id)
  }

  function completeReviewTask(score) {
    if (isDone) {
      onComplete(task.id)
      return
    }

    onComplete(task.id, score)
    setError('')
  }

  return (
    <div className="grid min-h-[54px] grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-slate-100 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{index}</span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>
          {isBacklogTask && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              积压补排
            </span>
          )}
          {isDone && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              已完成
            </span>
          )}
          {estimatedDifficulty && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              预计难度 {estimatedDifficulty.value}
            </span>
          )}
        </div>
        {detail && <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>}
        {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      </div>

      {isNewTask ? (
        <button
          type="button"
          onClick={completeNewTask}
          className={[
            'rounded-md px-3 py-1.5 text-xs font-semibold transition',
            isDone
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100',
          ].join(' ')}
        >
          {isDone ? '撤销' : '完成'}
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">掌握程度</span>
          <div className="flex gap-1.5">
            {MASTERY_OPTIONS.map((option, optionIndex) => (
              <button
                key={option.score}
                type="button"
                onClick={() => completeReviewTask(option.score)}
                className={[
                  'h-8 w-8 rounded-md border text-xs font-semibold transition',
                  Number(task.recallScore) === option.score
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600',
                ].join(' ')}
                title={option.status}
              >
                {optionIndex + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TodayTaskRow
