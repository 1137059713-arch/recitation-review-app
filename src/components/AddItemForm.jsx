import { useState } from 'react'
import { ESTIMATED_DIFFICULTY_OPTIONS, DEFAULT_ESTIMATED_DIFFICULTY } from '../utils/difficulty.js'
import { getChapterOptions, sortGroups } from '../utils/groups.js'
import { DEFAULT_REVIEW_END_DAY, REVIEW_END_DAYS } from '../utils/schedule.js'

const NEW_GROUP_VALUE = '__new_group__'

function AddItemForm({
  className = '',
  groups = [],
  items = [],
  headerExtra = null,
  onAdd,
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [groupChoice, setGroupChoice] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupProgressEnabled, setNewGroupProgressEnabled] = useState(false)
  const [newGroupTotalChapters, setNewGroupTotalChapters] = useState('')
  const [newGroupReviewEndDay, setNewGroupReviewEndDay] = useState(DEFAULT_REVIEW_END_DAY)
  const [reviewEndDay, setReviewEndDay] = useState(DEFAULT_REVIEW_END_DAY)
  const [isImportant, setIsImportant] = useState(false)
  const [estimatedDifficulty, setEstimatedDifficulty] = useState(DEFAULT_ESTIMATED_DIFFICULTY)
  const [error, setError] = useState('')
  const sortedGroups = sortGroups(groups)
  const selectedGroup = sortedGroups.find((group) => group.id === groupChoice)
  const isCreatingGroup = groupChoice === NEW_GROUP_VALUE
  const selectedTotalChapters = isCreatingGroup
    ? Number(newGroupTotalChapters)
    : selectedGroup?.totalChapters || 0
  const usesChapterSelect =
    (selectedGroup?.progressEnabled || (isCreatingGroup && newGroupProgressEnabled)) &&
    selectedTotalChapters > 0
  const usesBookReviewPlan = selectedGroup?.progressEnabled || (isCreatingGroup && newGroupProgressEnabled)
  const usedChapterTitles = new Set(
    items
      .filter((item) => item.groupId && item.groupId === groupChoice)
      .map((item) => item.title),
  )
  const chapterOptions = getChapterOptions(selectedTotalChapters)

  function handleSubmit(event) {
    event.preventDefault()

    if (!body.trim()) {
      setError('正文需要填写。')
      return
    }

    if (!title.trim()) {
      setError(usesChapterSelect ? '请选择章节。' : '标题需要填写。')
      return
    }

    if (isCreatingGroup && !newGroupName.trim()) {
      setError('新建分组需要填写分组名称。')
      return
    }

    if (isCreatingGroup && newGroupProgressEnabled && selectedTotalChapters <= 0) {
      setError('开启进度统计时，需要填写总章节数。')
      return
    }

    if (usesChapterSelect && usedChapterTitles.has(title)) {
      setError('这个章节已经添加过了。')
      return
    }

    onAdd({
      title,
      body,
      groupId: groupChoice && !isCreatingGroup ? groupChoice : null,
      newGroupName: isCreatingGroup ? newGroupName : '',
      newGroupProgressEnabled,
      newGroupTotalChapters,
      newGroupReviewEndDay,
      reviewEndDay,
      isImportant,
      estimatedDifficulty,
    })
    setTitle('')
    setBody('')
    setGroupChoice('')
    setNewGroupName('')
    setNewGroupProgressEnabled(false)
    setNewGroupTotalChapters('')
    setNewGroupReviewEndDay(DEFAULT_REVIEW_END_DAY)
    setReviewEndDay(DEFAULT_REVIEW_END_DAY)
    setIsImportant(false)
    setEstimatedDifficulty(DEFAULT_ESTIMATED_DIFFICULTY)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className={`flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500">
          □
        </span>
        <h2 className="text-base font-semibold text-slate-950">添加背诵</h2>
      </div>

      {headerExtra && <div className="mb-4 shrink-0">{headerExtra}</div>}

      <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">选择分组</span>
          <select
            value={groupChoice}
            onChange={(event) => {
              setGroupChoice(event.target.value)
              setTitle('')
              setError('')
            }}
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
          >
            <option value="">请选择分组</option>
            {sortedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.isPinned ? '★ ' : ''}{group.name}
              </option>
            ))}
            <option value={NEW_GROUP_VALUE}>新建分组</option>
          </select>
        </label>

        {groupChoice === NEW_GROUP_VALUE && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">新分组名称</span>
              <input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                placeholder="例如：药理学"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={newGroupProgressEnabled}
                onChange={(event) => {
                  setNewGroupProgressEnabled(event.target.checked)
                  setTitle('')
                  setError('')
                }}
                className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
              />
              作为书籍统计
            </label>

            {newGroupProgressEnabled && (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">总章节数</span>
                  <input
                    type="number"
                    min="1"
                    value={newGroupTotalChapters}
                    onChange={(event) => {
                      setNewGroupTotalChapters(event.target.value)
                      setTitle('')
                      setError('')
                    }}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                    placeholder="例如：20"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">书籍复习周期</span>
                  <select
                    value={newGroupReviewEndDay}
                    onChange={(event) => setNewGroupReviewEndDay(Number(event.target.value))}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                  >
                    {REVIEW_END_DAYS.map((day) => (
                      <option key={day} value={day}>复习到第 {day} 天</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        )}

        {!usesBookReviewPlan && (
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">复习周期</span>
            <select
              value={reviewEndDay}
              onChange={(event) => setReviewEndDay(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
            >
              {REVIEW_END_DAYS.map((day) => (
                <option key={day} value={day}>复习到第 {day} 天</option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            {usesChapterSelect ? '选择章节' : '内容标题'}
          </span>
          {usesChapterSelect ? (
            <select
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
            >
              <option value="">请选择章节</option>
              {chapterOptions.map((chapter) => (
                <option
                  key={chapter.value}
                  value={chapter.value}
                  disabled={usedChapterTitles.has(chapter.value)}
                >
                  {chapter.label}{usedChapterTitles.has(chapter.value) ? '（已添加）' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
              placeholder="例如：英语 Unit 3 课文"
            />
          )}
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={isImportant}
            onChange={(event) => setIsImportant(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
          />
          <span>
            <span className="block font-semibold text-slate-800">
              {isImportant ? '重要内容' : '标记为重要内容'}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              掌握度很低时，系统会更保守地安排复习。
            </span>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">输入要背诵的内容</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={7}
            maxLength={2000}
            className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
            placeholder="支持粘贴长文本..."
          />
          <span className="mt-1 block text-right text-xs text-slate-500">{body.length} / 2000</span>
        </label>

        <div>
          <span className="text-sm font-semibold text-slate-800">预计掌握难度</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ESTIMATED_DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEstimatedDifficulty(option.value)}
                className={[
                  'rounded-md border px-2 py-2 text-sm font-semibold transition',
                  estimatedDifficulty === option.value
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
                title={`预计负载 ${option.load}`}
              >
                {option.value} {option.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {error && <p className="mt-3 shrink-0 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full shrink-0 rounded-md bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-red-200 transition hover:bg-red-600"
      >
        添加到新背
      </button>
    </form>
  )
}

export default AddItemForm
