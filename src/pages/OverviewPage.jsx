import { useMemo, useState } from 'react'
import FullTextModal from '../components/FullTextModal.jsx'
import { TASK_LABELS, getTaskScheduledDate } from '../utils/schedule.js'
import { compareDateKey, formatDate, toDateKey } from '../utils/date.js'
import { GROUP_COLORS, createChapterTitle, getGroupColor, sortGroups } from '../utils/groups.js'
import { getItemMastery, isWeakMastery } from '../utils/mastery.js'

const ALL_GROUPS = 'all'
const UNGROUPED = 'ungrouped'

function GroupBadge({ group }) {
  if (!group) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        未分组
      </span>
    )
  }

  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `${getGroupColor(group)}18`,
        color: getGroupColor(group),
      }}
    >
      {group.isPinned ? '★ ' : ''}{group.name}
    </span>
  )
}

function CustomReviewForm({ itemId, onAddCustomReviewTask }) {
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!date) {
      setMessage('请选择复习日期。')
      return
    }

    onAddCustomReviewTask(itemId, date)
    setDate('')
    setMessage('已添加自定义复习。')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-semibold text-slate-700">自定义复习时间</label>
        <input
          type="date"
          min={toDateKey()}
          value={date}
          onChange={(event) => {
            setDate(event.target.value)
            setMessage('')
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          添加
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
    </form>
  )
}

function GroupManager({
  groups,
  onAddGroup,
  onRenameGroup,
  onUpdateGroupColor,
  onUpdateGroupProgress,
  onToggleGroupPinned,
  onDeleteGroup,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupProgressEnabled, setNewGroupProgressEnabled] = useState(false)
  const [newGroupTotalChapters, setNewGroupTotalChapters] = useState('')
  const [draftNames, setDraftNames] = useState({})
  const [draftProgress, setDraftProgress] = useState({})
  const [message, setMessage] = useState('')

  function handleAddGroup(event) {
    event.preventDefault()
    if (!newGroupName.trim()) {
      setMessage('请输入分组名称。')
      return
    }

    if (newGroupProgressEnabled && Number(newGroupTotalChapters) <= 0) {
      setMessage('开启书籍统计时，需要填写总章节数。')
      return
    }

    onAddGroup(newGroupName, {
      progressEnabled: newGroupProgressEnabled,
      totalChapters: newGroupTotalChapters,
    })
    setNewGroupName('')
    setNewGroupProgressEnabled(false)
    setNewGroupTotalChapters('')
    setMessage('分组已添加。')
  }

  function handleRename(group) {
    const nextName = (draftNames[group.id] ?? group.name).trim()
    if (!nextName) {
      setMessage('分组名称不能为空。')
      return
    }

    onRenameGroup(group.id, nextName)
    setMessage('分组已重命名。')
  }

  function handleSaveProgress(group) {
    const draft = draftProgress[group.id] || {}
    const progressEnabled = draft.progressEnabled ?? Boolean(group.progressEnabled)
    const totalChapters = draft.totalChapters ?? group.totalChapters ?? ''

    if (progressEnabled && Number(totalChapters) <= 0) {
      setMessage('开启书籍统计时，需要填写总章节数。')
      return
    }

    onUpdateGroupProgress(group.id, {
      progressEnabled,
      totalChapters,
    })
    setMessage('书籍统计设置已保存。')
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">分组管理</h3>
          <p className="mt-1 text-sm text-slate-500">重命名或删除分组不会删除背诵内容。</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto"
        >
          {isOpen ? '收起管理' : '管理分组'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleAddGroup} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newGroupName}
                onChange={(event) => {
                  setNewGroupName(event.target.value)
                  setMessage('')
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                placeholder="新分组名称，例如：药理学"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                新增分组
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={newGroupProgressEnabled}
                  onChange={(event) => {
                    setNewGroupProgressEnabled(event.target.checked)
                    setMessage('')
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                />
                作为书籍统计
              </label>
              {newGroupProgressEnabled && (
                <input
                  type="number"
                  min="1"
                  value={newGroupTotalChapters}
                  onChange={(event) => {
                    setNewGroupTotalChapters(event.target.value)
                    setMessage('')
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 sm:w-36"
                  placeholder="总章节数"
                />
              )}
            </div>
          </form>

          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              还没有自定义分组。
            </div>
          ) : (
            <div className="space-y-2">
              {sortGroups(groups).map((group) => (
                <div key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={draftNames[group.id] ?? group.name}
                      onChange={(event) => {
                        setDraftNames((current) => ({
                          ...current,
                          [group.id]: event.target.value,
                        }))
                        setMessage('')
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(group)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      保存名称
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleGroupPinned(group.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      {group.isPinned ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(group.id)}
                      className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      删除分组
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GROUP_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => onUpdateGroupColor(group.id, color.value)}
                        className={[
                          'h-7 w-7 rounded-full border-2 transition',
                          getGroupColor(group) === color.value ? 'border-slate-950' : 'border-white',
                        ].join(' ')}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`设置为${color.name}`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={draftProgress[group.id]?.progressEnabled ?? Boolean(group.progressEnabled)}
                        onChange={(event) => {
                          setDraftProgress((current) => ({
                            ...current,
                            [group.id]: {
                              ...current[group.id],
                              progressEnabled: event.target.checked,
                            },
                          }))
                          setMessage('')
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-200"
                      />
                      作为书籍统计
                    </label>
                    {(draftProgress[group.id]?.progressEnabled ?? Boolean(group.progressEnabled)) && (
                      <input
                        type="number"
                        min="1"
                        value={draftProgress[group.id]?.totalChapters ?? group.totalChapters ?? ''}
                        onChange={(event) => {
                          setDraftProgress((current) => ({
                            ...current,
                            [group.id]: {
                              ...current[group.id],
                              totalChapters: event.target.value,
                            },
                          }))
                          setMessage('')
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 sm:w-36"
                        placeholder="总章节数"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(group)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      保存统计
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && <p className="text-sm text-slate-500">{message}</p>}
        </div>
      )}
    </section>
  )
}

function OverviewFilters({ search, groupFilter, groups, resultCount, onSearchChange, onGroupFilterChange }) {
  const sortedGroups = sortGroups(groups)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto] lg:items-end">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">搜索内容</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
            placeholder="输入标题或正文关键词"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">分组筛选</span>
          <select
            value={groupFilter}
            onChange={(event) => onGroupFilterChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
          >
            <option value={ALL_GROUPS}>全部分组</option>
            <option value={UNGROUPED}>未分组</option>
            {sortedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.isPinned ? '★ ' : ''}{group.name}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          找到 {resultCount} 条
        </div>
      </div>
    </section>
  )
}

function BookProgressSection({
  groups,
  items,
  filteredItems,
  tasksByItemId,
  groupsById,
  expandedBookIds,
  expandedItemIds,
  search,
  groupFilter,
  onToggleBook,
  onToggleItem,
  onUpdateItemGroup,
  onDeleteItem,
  onViewFullText,
  onAddCustomReviewTask,
  onDeleteCustomReviewTask,
}) {
  const filteredItemIds = new Set(filteredItems.map((item) => item.id))
  const keyword = search.trim()
  const bookGroups = sortGroups(groups).filter(
    (group) => group.progressEnabled && Number(group.totalChapters) > 0,
  ).filter((group) => {
    if (groupFilter === UNGROUPED) return false
    if (groupFilter !== ALL_GROUPS && group.id !== groupFilter) return false

    const groupItems = items.filter((item) => item.groupId === group.id)
    return (
      !keyword ||
      group.name.toLowerCase().includes(keyword.toLowerCase()) ||
      groupItems.some((item) => filteredItemIds.has(item.id))
    )
  })

  if (bookGroups.length === 0) return null

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-red-500">书籍进度</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">按分组统计章节</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {bookGroups.length} 本
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {bookGroups.map((group) => {
          const groupItems = items.filter((item) => item.groupId === group.id)
          const visibleItems = keyword
            ? groupItems.filter((item) => filteredItemIds.has(item.id))
            : groupItems
          const completedChapters = groupItems.length
          const totalChapters = Number(group.totalChapters)
          const progress = Math.min(100, Math.round((completedChapters / totalChapters) * 100))
          const nextChapter = completedChapters < totalChapters ? completedChapters + 1 : null
          const isExpanded = expandedBookIds.has(group.id)
          const masteryCounts = groupItems.reduce(
            (counts, item) => {
              const mastery = getItemMastery(tasksByItemId.get(item.id) || [])

              if (mastery.score === 20 || mastery.score === 50) {
                counts.unfamiliar += 1
              } else if (mastery.score === 80 || mastery.score === 100) {
                counts.familiar += 1
              }

              return counts
            },
            { familiar: 0, unfamiliar: 0 },
          )

          return (
            <div key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-950">{group.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    已背 {completedChapters}/{totalChapters} 章
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {progress}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                  熟悉 {masteryCounts.familiar} 章
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                  不熟悉 {masteryCounts.unfamiliar} 章
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {nextChapter ? `下一章：${createChapterTitle(nextChapter)}` : '这本书已完成全部章节'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">
                  {keyword ? `匹配 ${visibleItems.length} 章` : `共 ${groupItems.length} 章`}
                </p>
                <button
                  type="button"
                  onClick={() => onToggleBook(group.id)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  {isExpanded ? '收起章节' : '展开章节'}
                </button>
              </div>
              <div
                className={[
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  isExpanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                ].join(' ')}
              >
                <div className="min-h-0 overflow-hidden">
                  {visibleItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      没有匹配的章节。
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleItems.map((item) => (
                        <OverviewItemCard
                          key={item.id}
                          item={item}
                          tasks={tasksByItemId.get(item.id) || []}
                          groups={groups}
                          groupsById={groupsById}
                          isExpanded={expandedItemIds.has(item.id)}
                          onToggleExpanded={() => onToggleItem(item.id)}
                          onUpdateItemGroup={onUpdateItemGroup}
                          onDeleteItem={onDeleteItem}
                          onViewFullText={onViewFullText}
                          onAddCustomReviewTask={onAddCustomReviewTask}
                          onDeleteCustomReviewTask={onDeleteCustomReviewTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function MasteryBadge({ mastery }) {
  const toneClasses = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <span
      className={[
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[mastery.tone] || toneClasses.slate,
      ].join(' ')}
    >
      {mastery.score ? `${mastery.score}% ` : ''}{mastery.status}
    </span>
  )
}

function WeakItemsSection({ items, tasksByItemId, groupsById }) {
  const weakItems = items
    .map((item) => ({
      item,
      mastery: getItemMastery(tasksByItemId.get(item.id) || []),
    }))
    .filter(({ mastery }) => isWeakMastery(mastery))

  if (weakItems.length === 0) return null

  return (
    <section className="rounded-lg border border-red-100 bg-red-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-red-600">薄弱章节</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">最近复习需要关注</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-600">
          {weakItems.length} 项
        </span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {weakItems.map(({ item, mastery }) => {
          const group = item.groupId ? groupsById.get(item.groupId) : null

          return (
            <div key={item.id} className="rounded-lg border border-red-100 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <MasteryBadge mastery={mastery} />
              </div>
              {group && <p className="text-sm font-semibold text-red-600">{group.name}</p>}
              <h4 className="mt-1 font-semibold text-slate-950">{item.title}</h4>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OverviewItemCard({
  item,
  tasks,
  groups,
  groupsById,
  isExpanded,
  onToggleExpanded,
  onUpdateItemGroup,
  onDeleteItem,
  onViewFullText,
  onAddCustomReviewTask,
  onDeleteCustomReviewTask,
}) {
  const doneCount = tasks.filter((task) => task.status === 'done').length
  const group = item.groupId ? groupsById.get(item.groupId) : null
  const sortedGroups = sortGroups(groups)
  const mastery = getItemMastery(tasks)

  function handleDeleteItem() {
    const confirmed = window.confirm(
      `确定删除“${item.title}”吗？删除后，这条内容的所有复习计划也会一起删除。`,
    )

    if (confirmed) {
      onDeleteItem(item.id)
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
            <GroupBadge group={group} />
            <MasteryBadge mastery={mastery} />
          </div>
          <p className="mt-1 text-sm text-slate-500">创建于 {formatDate(item.createdAt)}</p>
        </div>
        <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {doneCount}/{tasks.length} 已完成
        </span>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{item.body}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm font-semibold text-slate-700">所属分组</span>
          <select
            value={item.groupId || ''}
            onChange={(event) => onUpdateItemGroup(item.id, event.target.value || null)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
          >
            <option value="">未分组</option>
            {sortedGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.isPinned ? '★ ' : ''}{group.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {isExpanded ? '收起安排' : '展开安排'}
          </button>
          <button
            type="button"
            onClick={() => onViewFullText(item)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            查看全文
          </button>
          <button
            type="button"
            onClick={handleDeleteItem}
            className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            删除内容
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={[
                  'relative rounded-lg border px-3 py-3',
                  task.status === 'done' ? 'border-red-100 bg-red-50' : 'border-slate-200 bg-slate-50',
                ].join(' ')}
              >
                {task.type === 'custom-review' && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomReviewTask(task.id)}
                    className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white hover:text-red-600"
                    aria-label="删除自定义复习"
                    title="删除自定义复习"
                  >
                    删除
                  </button>
                )}
                <p className="text-xs font-semibold text-slate-500">{TASK_LABELS[task.type]}</p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  安排 {formatDate(getTaskScheduledDate(task))}
                </p>
                {task.type !== 'new' && getTaskScheduledDate(task) > task.date && (
                  <p className="mt-1 text-xs font-semibold text-amber-700">积压补排</p>
                )}
                <p className={task.status === 'done' ? 'mt-1 text-xs text-red-600' : 'mt-1 text-xs text-slate-400'}>
                  {task.status === 'done' ? '已完成' : '待完成'}
                </p>
              </div>
            ))}
          </div>

          <CustomReviewForm itemId={item.id} onAddCustomReviewTask={onAddCustomReviewTask} />
        </>
      )}
    </article>
  )
}

function OverviewPage({ store }) {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [expandedBookIds, setExpandedBookIds] = useState(() => new Set())
  const [fullTextItem, setFullTextItem] = useState(null)

  const tasksByItemId = useMemo(() => {
    const map = new Map()
    store.tasks.forEach((task) => {
      if (!map.has(task.itemId)) {
        map.set(task.itemId, [])
      }
      map.get(task.itemId).push(task)
    })

    map.forEach((tasks) =>
      tasks.sort((a, b) => compareDateKey(getTaskScheduledDate(a), getTaskScheduledDate(b))),
    )
    return map
  }, [store.tasks])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return store.items.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.body.toLowerCase().includes(keyword)
      const matchesGroup =
        groupFilter === ALL_GROUPS ||
        (groupFilter === UNGROUPED && !item.groupId) ||
        item.groupId === groupFilter

      return matchesSearch && matchesGroup
    })
  }, [groupFilter, search, store.items])

  const normalItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const group = item.groupId ? store.groupsById.get(item.groupId) : null
      return !group?.progressEnabled
    })
  }, [filteredItems, store.groupsById])

  function toggleExpanded(itemId) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  function toggleBookExpanded(groupId) {
    setExpandedBookIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-red-500">全部内容</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">背诵总览</h2>
      </div>

      <OverviewFilters
        search={search}
        groupFilter={groupFilter}
        groups={store.groups}
        resultCount={filteredItems.length}
        onSearchChange={setSearch}
        onGroupFilterChange={setGroupFilter}
      />

      <WeakItemsSection
        items={store.items}
        tasksByItemId={tasksByItemId}
        groupsById={store.groupsById}
      />

      <BookProgressSection
        groups={store.groups}
        items={store.items}
        filteredItems={filteredItems}
        tasksByItemId={tasksByItemId}
        groupsById={store.groupsById}
        expandedBookIds={expandedBookIds}
        expandedItemIds={expandedIds}
        search={search}
        groupFilter={groupFilter}
        onToggleBook={toggleBookExpanded}
        onToggleItem={toggleExpanded}
        onUpdateItemGroup={store.updateItemGroup}
        onDeleteItem={store.deleteItem}
        onViewFullText={setFullTextItem}
        onAddCustomReviewTask={store.addCustomReviewTask}
        onDeleteCustomReviewTask={store.deleteCustomReviewTask}
      />

      <GroupManager
        groups={store.groups}
        onAddGroup={store.addGroup}
        onRenameGroup={store.renameGroup}
        onUpdateGroupColor={store.updateGroupColor}
        onUpdateGroupProgress={store.updateGroupProgress}
        onToggleGroupPinned={store.toggleGroupPinned}
        onDeleteGroup={store.deleteGroup}
      />

      {store.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-slate-500">
          还没有背诵内容。
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-slate-500">
          没有找到符合条件的内容。
        </div>
      ) : normalItems.length === 0 ? null : (
        <div className="space-y-4">
          {normalItems.map((item) => (
            <OverviewItemCard
              key={item.id}
              item={item}
              tasks={tasksByItemId.get(item.id) || []}
              groups={store.groups}
              groupsById={store.groupsById}
              isExpanded={expandedIds.has(item.id)}
              onToggleExpanded={() => toggleExpanded(item.id)}
              onUpdateItemGroup={store.updateItemGroup}
              onDeleteItem={store.deleteItem}
              onViewFullText={setFullTextItem}
              onAddCustomReviewTask={store.addCustomReviewTask}
              onDeleteCustomReviewTask={store.deleteCustomReviewTask}
            />
          ))}
        </div>
      )}

      {fullTextItem && (
        <FullTextModal
          title={fullTextItem.title}
          body={fullTextItem.body}
          onClose={() => setFullTextItem(null)}
        />
      )}
    </div>
  )
}

export default OverviewPage

