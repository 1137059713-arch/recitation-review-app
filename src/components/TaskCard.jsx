import { useState } from 'react'
import CompleteButton from './CompleteButton.jsx'
import FullTextModal from './FullTextModal.jsx'
import { TASK_LABELS, getTaskScheduledDate } from '../utils/schedule.js'
import { formatDate, toDateKey } from '../utils/date.js'
import { MASTERY_OPTIONS, getMasteryOption } from '../utils/mastery.js'

function TaskCard({
  task,
  item,
  groupName = '',
  onComplete,
  onUpdateItem,
  onDeleteItem,
  compact = false,
}) {
  const [selectedScore, setSelectedScore] = useState(null)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(item?.title || '')
  const [draftBody, setDraftBody] = useState(item?.body || '')
  const [editError, setEditError] = useState('')
  const [isFullTextOpen, setIsFullTextOpen] = useState(false)
  const scheduledDate = getTaskScheduledDate(task)
  const isFutureTask = scheduledDate > toDateKey()
  const isRescheduled = task.type !== 'new' && scheduledDate !== task.date
  const needsMastery = task.type !== 'new' && task.status !== 'done'
  const masteryOption = getMasteryOption(task.recallScore)
  const canEditSource = task.type === 'new' && Boolean(item) && Boolean(onUpdateItem)
  const canDeleteSource = task.type === 'new' && Boolean(item) && Boolean(onDeleteItem)

  function handleComplete() {
    if (task.status === 'done') {
      onComplete(task.id)
      return
    }

    if (isFutureTask) return

    if (needsMastery) {
      if (!selectedScore) {
        setError('请选择这次复习的掌握程度。')
        return
      }
      onComplete(task.id, selectedScore)
      setError('')
      setSelectedScore(null)
      return
    }

    onComplete(task.id)
  }

  function startEditing() {
    setDraftTitle(item?.title || '')
    setDraftBody(item?.body || '')
    setEditError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditError('')
  }

  function saveEditing() {
    if (!draftTitle.trim() || !draftBody.trim()) {
      setEditError('标题和正文都需要填写。')
      return
    }

    onUpdateItem(item.id, {
      title: draftTitle,
      body: draftBody,
    })
    setIsEditing(false)
    setEditError('')
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `确定删除“${item.title}”吗？删除后，这条内容的所有复习计划也会一起删除。`,
    )

    if (confirmed) {
      onDeleteItem(item.id)
    }
  }

  return (
    <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {TASK_LABELS[task.type]}
          </span>
          <span className="text-xs text-slate-400">安排 {formatDate(scheduledDate)}</span>
          {isRescheduled && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              原定 {formatDate(task.date)}
            </span>
          )}
          {task.status === 'done' && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              已完成
            </span>
          )}
          {isFutureTask && task.status !== 'done' && (
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
              未到日期
            </span>
          )}
          {groupName && (
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
              {groupName}
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-4 space-y-3">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
              placeholder="标题"
            />
            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
              placeholder="正文"
            />
            {editError && <p className="text-sm font-medium text-red-600">{editError}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveEditing}
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                保存修改
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="truncate text-base font-semibold text-slate-950">
                {item?.title || '已删除内容'}
              </h3>
              {(canEditSource || canDeleteSource) && (
                <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                  {canEditSource && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      修改
                    </button>
                  )}
                  {canDeleteSource && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>

            {!compact && item?.body && (
              <>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.body}</p>
                <button
                  type="button"
                  onClick={() => setIsFullTextOpen(true)}
                  className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  查看全文
                </button>
              </>
            )}
          </>
        )}

        {masteryOption && (
          <p className="mt-3 text-sm font-medium text-slate-600">
            掌握程度：{masteryOption.label} {masteryOption.status}
          </p>
        )}

        {needsMastery && !isFutureTask && (
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">这次复习的掌握程度</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MASTERY_OPTIONS.map((option) => (
                <button
                  key={option.score}
                  type="button"
                  onClick={() => {
                    setSelectedScore(option.score)
                    setError('')
                  }}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm font-semibold transition',
                    selectedScore === option.score
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white',
                  ].join(' ')}
                >
                  {option.label} {option.status}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}
      </div>

      <CompleteButton
        done={task.status === 'done'}
        disabled={isFutureTask && task.status !== 'done'}
        onClick={handleComplete}
      />

      {isFullTextOpen && item?.body && (
        <FullTextModal
          title={item.title}
          body={item.body}
          onClose={() => setIsFullTextOpen(false)}
        />
      )}
    </article>
  )
}

export default TaskCard
