import { addDays, compareDateKey, toDateKey } from './date.js'

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const DEFAULT_SCHEDULE_SETTINGS = {
  restDays: [0],
}

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
export const DAILY_TARGET_REVIEW_LOAD = 3
export const DAILY_MAX_REVIEW_LOAD = 3.5
export const DAILY_MAX_REVIEW_TASKS = 4

const REVIEW_LOAD_BY_SCORE = {
  20: 1.4,
  50: 1,
  80: 0.7,
  100: 0.5,
}

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

export function normalizeScheduleSettings(settings = {}) {
  const restDays = Array.isArray(settings?.restDays)
    ? [...new Set(settings.restDays.map(Number))]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b)
    : DEFAULT_SCHEDULE_SETTINGS.restDays

  return {
    restDays: [restDays[0] ?? DEFAULT_SCHEDULE_SETTINGS.restDays[0]],
  }
}

function getWeekday(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

function isRestDay(dateKey, settings) {
  return settings.restDays.includes(getWeekday(dateKey))
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

function getLatestPriorRecallScore(task, tasks) {
  const priorResults = tasks
    .filter(
      (candidate) =>
        candidate.id !== task.id &&
        candidate.itemId === task.itemId &&
        candidate.status === 'done' &&
        isReviewTask(candidate) &&
        candidate.recallScore !== null &&
        candidate.recallScore !== undefined &&
        compareDateKey(getTaskScheduledDate(candidate), task.date) <= 0,
    )
    .sort((a, b) => {
      const dateCompare = compareDateKey(getTaskScheduledDate(b), getTaskScheduledDate(a))
      return dateCompare || b.id.localeCompare(a.id)
    })

  return priorResults[0]?.recallScore ?? null
}

export function getReviewTaskLoad(task, tasks = []) {
  const score = Number(getLatestPriorRecallScore(task, tasks))
  return REVIEW_LOAD_BY_SCORE[score] || 1
}

function getReviewStats(tasks, allTasks) {
  return tasks.reduce((stats, task) => {
    if (isReviewTask(task)) {
      const date = getTaskScheduledDate(task)
      const current = stats.get(date) || { load: 0, count: 0 }
      stats.set(date, {
        load: current.load + getReviewTaskLoad(task, allTasks),
        count: current.count + 1,
      })
    }

    return stats
  }, new Map())
}

function canPlaceTaskOnDate({ date, taskLoad, statsByDate, settings, isBacklog }) {
  if (isRestDay(date, settings)) return false

  const stats = statsByDate.get(date) || { load: 0, count: 0 }
  const nextLoad = stats.load + taskLoad
  const nextCount = stats.count + 1

  if (nextLoad > DAILY_MAX_REVIEW_LOAD) return false
  if (nextCount > DAILY_MAX_REVIEW_TASKS) return false

  return !isBacklog || stats.load < DAILY_TARGET_REVIEW_LOAD
}

function addTaskStats(date, taskLoad, statsByDate) {
  const stats = statsByDate.get(date) || { load: 0, count: 0 }
  statsByDate.set(date, {
    load: stats.load + taskLoad,
    count: stats.count + 1,
  })
}

function findAvailableDate({ startDate, taskLoad, statsByDate, settings, isBacklog }) {
  let cursor = startDate
  let safetyCounter = 0

  while (safetyCounter < 366) {
    if (canPlaceTaskOnDate({ date: cursor, taskLoad, statsByDate, settings, isBacklog })) {
      return cursor
    }

    cursor = addDays(cursor, 1)
    safetyCounter += 1
  }

  return startDate
}

export function rebalanceReviewSchedule(tasks, today = toDateKey(), rawSettings = DEFAULT_SCHEDULE_SETTINGS) {
  const settings = normalizeScheduleSettings(rawSettings)
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    scheduledDate: getTaskScheduledDate(task),
  }))

  const fixedTasks = normalizedTasks.filter((task) => task.status === 'done' || !isReviewTask(task))
  const pendingReviewTasks = normalizedTasks.filter((task) => task.status !== 'done' && isReviewTask(task))
  const normalReviewTasks = pendingReviewTasks
    .filter((task) => compareDateKey(task.date, today) >= 0)
    .sort((a, b) => {
      const ruleA = getRule(a)
      const ruleB = getRule(b)
      return (
        compareDateKey(a.date, b.date) ||
        ruleA.priority - ruleB.priority ||
        a.id.localeCompare(b.id)
      )
    })
  const backlogReviewTasks = pendingReviewTasks
    .filter((task) => compareDateKey(task.date, today) < 0)
    .sort((a, b) => {
      const loadCompare = getReviewTaskLoad(b, normalizedTasks) - getReviewTaskLoad(a, normalizedTasks)
      if (loadCompare !== 0) return loadCompare

      const ruleA = getRule(a)
      const ruleB = getRule(b)
      return (
        compareDateKey(a.date, b.date) ||
        ruleA.priority - ruleB.priority ||
        a.id.localeCompare(b.id)
      )
    })

  const statsByDate = getReviewStats(fixedTasks, normalizedTasks)

  function scheduleTask(task, isBacklog) {
    const startDate = isBacklog ? today : task.date
    const taskLoad = getReviewTaskLoad(task, normalizedTasks)
    const scheduledDate = findAvailableDate({ startDate, taskLoad, statsByDate, settings, isBacklog })

    addTaskStats(scheduledDate, taskLoad, statsByDate)

    return {
      ...task,
      scheduledDate,
    }
  }

  const scheduledReviewTasks = [
    ...normalReviewTasks.map((task) => scheduleTask(task, false)),
    ...backlogReviewTasks.map((task) => scheduleTask(task, true)),
  ]

  const scheduledById = new Map(
    [...fixedTasks, ...scheduledReviewTasks].map((task) => [task.id, task]),
  )

  return normalizedTasks.map((task) => scheduledById.get(task.id) || task)
}
