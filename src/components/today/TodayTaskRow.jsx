import { useState } from 'react'
import { getEstimatedDifficultyOption } from '../../utils/difficulty.js'
import { MASTERY_OPTIONS } from '../../utils/mastery.js'
import { TASK_LABELS } from '../../utils/schedule.js'

function TodayTaskRow({
  index,
  task,
  item,
  groupName = '',
  onComplete,
  onDeleteItem,
}) {
  const [error, setError] = useState('')
  const isNewTask = task.type === 'new'
  const isDone = task.status === 'done'
  const estimatedDifficulty = isNewTask ? getEstimatedDifficultyOption(task.estimatedDifficulty) : null
  const title = item?.title || '已删除内容'
  const detail = groupName || item?.body?.split('\n').find(Boolean) || TASK_LABELS[task.type]
  const statusLabel = isNewTask ? '新背' : TASK_LABELS[task.type]

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

  function deleteItem() {
    if (!item || !onDeleteItem) return

    const confirmed = window.confirm(
      `确定删除“${item.title}”吗？删除后，这条内容的所有复习计划也会一起删除。`,
    )

    if (confirmed) {
      onDeleteItem(item.id)
    }
  }

  return (
    <div className="grid min-h-[76px] grid-cols-[34px_minmax(0,1fr)_auto_34px] items-center gap-4 border-t border-slate-100 px-5 py-4 first:border-t-0">
      <span className="text-base font-semibold text-slate-950">{index}</span>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>
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
        <div className="flex shrink-0 items-center gap-6">
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={completeNewTask}
            className={[
              'rounded-md border px-5 py-2 text-xs font-semibold transition',
              isDone
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-red-300 bg-white text-red-600 hover:bg-red-50',
            ].join(' ')}
          >
            {isDone ? '撤销' : '完成'}
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-5">
          <span className="rounded-md border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            {statusLabel}
          </span>
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
      <button
        type="button"
        onClick={deleteItem}
        disabled={!item || !onDeleteItem}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-md transition',
          item && onDeleteItem
            ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
            : 'cursor-not-allowed text-slate-200',
        ].join(' ')}
        title="删除内容"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M9 5h6M10 5l.5-1h3L14 5M6.5 8h11M8 8l.6 11h6.8L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 11v5M13.5 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default TodayTaskRow
