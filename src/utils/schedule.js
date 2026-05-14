import { addDays, compareDateKey, toDateKey } from './date.js'

export const REVIEW_STEPS = [
  { type: 'review-1', label: '第 1 天复习', days: 1 },
  { type: 'review-7', label: '第 7 天复习', days: 7 },
  { type: 'review-14', label: '第 14 天复习', days: 14 },
  { type: 'review-28', label: '第 28 天复习', days: 28 },
]

export const TASK_LABELS = {
  new: '今日新背',
  'review-1': '第 1 天复习',
  'review-3': '第 3 天补强',
  'review-7': '第 7 天复习',
  'review-14': '第 14 天复习',
  'review-28': '第 28 天复习',
  'custom-review': '自定义复习',
}

export const DAILY_REVIEW_LIMIT = 3

const REVIEW_RULES = {
  'review-1': { priority: 1, maxDelay: 1 },
  'review-3': { priority: 2, maxDelay: 1 },
  'review-7': { priority: 3, maxDelay: 2 },
  'review-14': { priority: 4, maxDelay: 4 },
  'review-28': { priority: 5, maxDelay: 5 },
  'custom-review': { priority: 6, maxDelay: 5 },
}

export function getTaskScheduledDate(task) {
  return task.scheduledDate || task.date
}

export function isReviewTask(task) {
  return task.type !== 'new'
}

export function createTask({ itemId, type, date }) {
  return {
    id: type === 'custom-review' ? `${itemId}-${type}-${date}` : `${itemId}-${type}`,
    itemId,
    type,
    date,
    scheduledDate: date,
    status: 'pending',
    recallScore: null,
  }
}

export function createInitialTasks(itemId, createdAt) {
  return [
    createTask({ itemId, type: 'new', date: createdAt }),
    ...REVIEW_STEPS.map((step) =>
      createTask({
        itemId,
        type: step.type,
        date: addDays(createdAt, step.days),
      }),
    ),
  ]
}

export function createThirdDayTask(itemId, createdAt) {
  return createTask({
    itemId,
    type: 'review-3',
    date: addDays(createdAt, 3),
  })
}

function getRule(task) {
  return REVIEW_RULES[task.type] || REVIEW_RULES['custom-review']
}

function getReviewLoad(tasks) {
  return tasks.reduce((load, task) => {
    if (task.status !== 'done' && isReviewTask(task)) {
      const date = getTaskScheduledDate(task)
      load.set(date, (load.get(date) || 0) + 1)
    }

    return load
  }, new Map())
}

function findAvailableDate({ startDate, deadline, loadByDate }) {
  let cursor = startDate

  while (compareDateKey(cursor, deadline) <= 0) {
    if ((loadByDate.get(cursor) || 0) < DAILY_REVIEW_LIMIT) {
      return cursor
    }

    cursor = addDays(cursor, 1)
  }

  return deadline
}

export function rebalanceReviewSchedule(tasks, today = toDateKey()) {
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    scheduledDate: getTaskScheduledDate(task),
  }))

  const fixedTasks = normalizedTasks.filter((task) => task.status === 'done' || !isReviewTask(task))
  const pendingReviewTasks = normalizedTasks
    .filter((task) => task.status !== 'done' && isReviewTask(task))
    .sort((a, b) => {
      const ruleA = getRule(a)
      const ruleB = getRule(b)
      return (
        compareDateKey(a.date, b.date) ||
        ruleA.priority - ruleB.priority ||
        a.id.localeCompare(b.id)
      )
    })

  const loadByDate = getReviewLoad(fixedTasks)

  const scheduledReviewTasks = pendingReviewTasks.map((task) => {
    const rule = getRule(task)
    const startDate = compareDateKey(task.date, today) < 0 ? today : task.date
    const naturalDeadline = addDays(task.date, rule.maxDelay)
    const deadline = compareDateKey(naturalDeadline, startDate) < 0 ? startDate : naturalDeadline
    const scheduledDate = findAvailableDate({ startDate, deadline, loadByDate })

    loadByDate.set(scheduledDate, (loadByDate.get(scheduledDate) || 0) + 1)

    return {
      ...task,
      scheduledDate,
    }
  })

  const scheduledById = new Map(
    [...fixedTasks, ...scheduledReviewTasks].map((task) => [task.id, task]),
  )

  return normalizedTasks.map((task) => scheduledById.get(task.id) || task)
}
