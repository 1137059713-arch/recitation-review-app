import { useState } from 'react'
import { getChapterOptions, sortGroups } from '../utils/groups.js'

const NEW_GROUP_VALUE = '__new_group__'

function AddItemForm({
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
    })
    setTitle('')
    setBody('')
    setGroupChoice('')
    setNewGroupName('')
    setNewGroupProgressEnabled(false)
    setNewGroupTotalChapters('')
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <p className="text-sm font-medium text-red-500">添加今日背诵</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">记录刚背完的内容</h2>
      </div>

      {headerExtra && <div className="mb-5">{headerExtra}</div>}

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">分组</span>
          <select
            value={groupChoice}
            onChange={(event) => {
              setGroupChoice(event.target.value)
              setTitle('')
              setError('')
            }}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
          >
            <option value="">未分组</option>
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
              <span className="text-sm font-medium text-slate-700">新分组名称</span>
              <input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
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
              <label className="block">
                <span className="text-sm font-medium text-slate-700">总章节数</span>
                <input
                  type="number"
                  min="1"
                  value={newGroupTotalChapters}
                  onChange={(event) => {
                    setNewGroupTotalChapters(event.target.value)
                    setTitle('')
                    setError('')
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                  placeholder="例如：20"
                />
              </label>
            )}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">标题</span>
          {usesChapterSelect ? (
            <select
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
            >
              <option value="">选择章节</option>
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
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
              placeholder="例如：英语 Unit 3 课文"
            />
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">正文</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={7}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
            placeholder="粘贴或输入今天背诵的正文"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          保存并生成复习计划
        </button>
      </div>
    </form>
  )
}

export default AddItemForm
