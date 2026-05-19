import { compareDateKey, toDateKey } from './date.js'
import { getGroupColor, sortGroups } from './groups.js'
import { getItemMastery, isWeakMastery } from './mastery.js'
import { getTaskScheduledDate, isReviewTask } from './schedule.js'

export function getTasksByItemId(tasks) {
  const map = new Map()

  tasks.forEach((task) => {
    if (!map.has(task.itemId)) {
      map.set(task.itemId, [])
    }
    map.get(task.itemId).push(task)
  })

  map.forEach((itemTasks) =>
    itemTasks.sort((a, b) => compareDateKey(getTaskScheduledDate(a), getTaskScheduledDate(b))),
  )

  return map
}

export function getItemOverview(items, tasks, groupsById) {
  const tasksByItemId = getTasksByItemId(tasks)

  return items.map((item) => {
    const itemTasks = tasksByItemId.get(item.id) || []
    const group = item.groupId ? groupsById.get(item.groupId) : null
    const mastery = getItemMastery(itemTasks)

    return {
      item,
      tasks: itemTasks,
      group,
      mastery,
      isBookItem: Boolean(group?.progressEnabled),
      isWeak: isWeakMastery(mastery),
    }
  })
}

export function getOverviewSummary({ items, tasks, groups, groupsById, today = toDateKey() }) {
  const itemOverview = getItemOverview(items, tasks, groupsById)
  const reviewTasks = tasks.filter(isReviewTask)
  const pendingReviewTasks = reviewTasks.filter((task) => task.status !== 'done')
  const overdueTasks = pendingReviewTasks.filter((task) => compareDateKey(getTaskScheduledDate(task), today) < 0)
  const masteredItems = itemOverview.filter(({ mastery }) => Number(mastery.score) >= 80)
  const weakItems = itemOverview.filter(({ isWeak }) => isWeak)
  const bookGroups = sortGroups(groups).filter((group) => group.progressEnabled && Number(group.totalChapters) > 0)
  const otherItems = itemOverview.filter(({ isBookItem }) => !isBookItem)

  const bookProgress = bookGroups.map((group) => {
    const groupItems = itemOverview.filter(({ item }) => item.groupId === group.id)
    const completed = groupItems.length
    const total = Number(group.totalChapters) || 0
    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0

    return {
      group,
      completed,
      total,
      percent,
      color: getGroupColor(group),
      items: groupItems,
    }
  })

  const reviewedItems = itemOverview.filter(({ mastery }) => Number.isFinite(Number(mastery.score)))
  const masteryDistribution = [
    { label: '不熟悉', count: reviewedItems.filter(({ mastery }) => mastery.score < 40).length, color: '#ef4444' },
    { label: '熟悉', count: reviewedItems.filter(({ mastery }) => mastery.score >= 40 && mastery.score < 70).length, color: '#f59e0b' },
    { label: '较熟悉', count: reviewedItems.filter(({ mastery }) => mastery.score >= 70 && mastery.score < 90).length, color: '#22c55e' },
    { label: '非常熟悉', count: reviewedItems.filter(({ mastery }) => mastery.score >= 90).length, color: '#60a5fa' },
  ]

  const weakTop = [...weakItems].sort((a, b) => {
    const scoreCompare = Number(a.mastery.score || 0) - Number(b.mastery.score || 0)
    return scoreCompare || a.item.title.localeCompare(b.item.title, 'zh-CN')
  })

  const lastSevenDays = Array.from({ length: 7 }, (_value, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = toDateKey(date)
    const dayTasks = tasks.filter((task) => getTaskScheduledDate(task) === key)

    return {
      date: key.slice(5).replace('-', '/'),
      newCount: dayTasks.filter((task) => task.type === 'new').length,
      reviewCount: dayTasks.filter((task) => isReviewTask(task)).length,
      doneCount: dayTasks.filter((task) => task.status === 'done').length,
    }
  })

  return {
    itemOverview,
    bookProgress,
    otherItems,
    weakItems,
    weakTop,
    masteryDistribution,
    lastSevenDays,
    stats: {
      totalItems: items.length,
      masteredItems: masteredItems.length,
      weakItems: weakItems.length,
      overdueTasks: overdueTasks.length,
      pendingReviewTasks: pendingReviewTasks.length,
    },
  }
}
