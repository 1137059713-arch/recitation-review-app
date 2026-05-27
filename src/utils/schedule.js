import { addDays, compareDateKey, toDateKey } from './date.js'
import { DEFAULT_ESTIMATED_DIFFICULTY, normalizeEstimatedDifficulty } from './difficulty.js'
import { REVIEW_LOAD_LEVELS, getReviewTaskLoad, getScheduleCapacity } from './load.js'

export {
  DAILY_MAX_REVIEW_LOAD,
  DAILY_MAX_REVIEW_TASKS,
  DAILY_MAX_STUDY_LOAD,
  DAILY_MAX_STUDY_TASKS,
  DAILY_REVIEW_LIMIT,
  DAILY_TARGET_REVIEW_LOAD,
  DAILY_TARGET_STUDY_LOAD,
  REVIEW_LOAD_LEVELS,
  getNewTaskLoad,
  getReviewTaskLoad,
  getScheduleCapacity,
} from './load.js'

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const BACKLOG_STRATEGIES = {
  conservative: { label: '保守', description: '每天最多自动补 1 条逾期任务。' },
  balanced: { label: '均衡', description: '按当天余量自动补排，避免压力突然变大。' },
  aggressive: { label: '积极', description: '有复习空位就优先补逾期任务。' },
}
export const DEFAULT_SCHEDULE_SETTINGS = {
  restDays: [0],
  dailyReviewLimit: 3,
  reviewLoadLevel: 'standard',
  backlogStrategy: 'balanced',
}

export const REVIEW_INTERVAL_DAYS = [1, 2, 4, 7, 16, 30, 30, 30, 60]
export const REVIEW_MILESTONE_DAYS = [1, 3, 7, 14, 30, 60, 90, 120, 180]
export const REVIEW_END_DAYS = [30, 90, 180]
export const DEFAULT_REVIEW_END_DAY = 180

export const REVIEW_STEPS = REVIEW_MILESTONE_DAYS.map((days, index) => ({
  type: `review-${days}`,
  label: `累计第 ${days} 天复习`,
  days,
  intervalDays: REVIEW_INTERVAL_DAYS[index],
}))

export const TASK_LABELS = {
  new: '今日新背',
  'review-1': '间隔 1 天复习',
  'review-3': '间隔 3 天复习',
  'review-7': '间隔 7 天复习',
  'review-14': '间隔 14 天复习',
  'review-28': '累计第 30 天复习',
  'review-30': '累计第 30 天复习',
  'review-60': '累计第 60 天复习',
  'review-90': '累计第 90 天复习',
  'review-120': '累计第 120 天复习',
  'review-180': '累计第 180 天复习',
  'custom-review': '自定义复习',
}

const REVIEW_RULES = Object.fromEntries(
  REVIEW_MILESTONE_DAYS.map((days, index) => [
    `review-${days}`,
    { priority: index + 1, maxDelay: Math.max(1, Math.ceil(days / 7)) },
  ]),
)

REVIEW_RULES['review-28'] = REVIEW_RULES['review-30']
REVIEW_RULES['custom-review'] = { priority: REVIEW_MILESTONE_DAYS.length + 1, maxDelay: 5 }

export function normalizeReviewEndDay(value) {
  const reviewEndDay = Number(value)
  if (reviewEndDay === 28) return 30
  return REVIEW_END_DAYS.includes(reviewEndDay) ? reviewEndDay : DEFAULT_REVIEW_END_DAY
}

export function getReviewMilestoneIndexByDay(day) {
  const normalizedDay = Number(day) === 28 ? 30 : Number(day)
  return REVIEW_MILESTONE_DAYS.indexOf(normalizedDay)
}

export function getReviewEndStage(reviewEndDay = DEFAULT_REVIEW_END_DAY) {
  const normalizedEndDay = normalizeReviewEndDay(reviewEndDay)
  return getReviewMilestoneIndexByDay(normalizedEndDay)
}

function getReviewDayFromType(type) {
  const match = String(type || '').match(/^review-(\d+)$/)
  return match ? Number(match[1]) : null
}

export function getTaskReviewStage(task) {
  if (Number.isInteger(task?.reviewStage)) {
    return Math.min(REVIEW_MILESTONE_DAYS.length - 1, Math.max(0, task.reviewStage))
  }

  const reviewDay = Number(task?.reviewDay ?? getReviewDayFromType(task?.type))
  const stage = getReviewMilestoneIndexByDay(reviewDay)
  return stage >= 0 ? stage : 0
}

export function getTaskReviewDay(task) {
  const stage = getTaskReviewStage(task)
  return REVIEW_MILESTONE_DAYS[stage] || REVIEW_MILESTONE_DAYS[0]
}

export function getTaskReviewIntervalDays(task) {
  const stage = getTaskReviewStage(task)
  return REVIEW_INTERVAL_DAYS[stage] || REVIEW_INTERVAL_DAYS[0]
}

export function getTaskScheduledDate(task) {
  return task.manualScheduledDate || task.scheduledDate || task.date
}

export function normalizeScheduleSettings(settings = {}) {
  const restDays = Array.isArray(settings?.restDays)
    ? [...new Set(settings.restDays.map(Number))]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b)
    : DEFAULT_SCHEDULE_SETTINGS.restDays

  const dailyReviewLimit = Number(settings?.dailyReviewLimit)
  const reviewLoadLevel = REVIEW_LOAD_LEVELS[settings?.reviewLoadLevel]
    ? settings.reviewLoadLevel
    : DEFAULT_SCHEDULE_SETTINGS.reviewLoadLevel
  const backlogStrategy = BACKLOG_STRATEGIES[settings?.backlogStrategy]
    ? settings.backlogStrategy
    : DEFAULT_SCHEDULE_SETTINGS.backlogStrategy

  return {
    restDays: [restDays[0] ?? DEFAULT_SCHEDULE_SETTINGS.restDays[0]],
    dailyReviewLimit: [2, 3, 4].includes(dailyReviewLimit)
      ? dailyReviewLimit
      : DEFAULT_SCHEDULE_SETTINGS.dailyReviewLimit,
    reviewLoadLevel,
    backlogStrategy,
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

export function createTask({
  itemId,
  type,
  date,
  estimatedDifficulty = DEFAULT_ESTIMATED_DIFFICULTY,
  id = null,
  reviewStage = null,
  reviewDay = null,
  sourceTaskId = null,
}) {
  const normalizedReviewStage = Number.isInteger(reviewStage)
    ? Math.min(REVIEW_MILESTONE_DAYS.length - 1, Math.max(0, reviewStage))
    : null
  const normalizedReviewDay = reviewDay || (
    normalizedReviewStage !== null ? REVIEW_MILESTONE_DAYS[normalizedReviewStage] : getReviewDayFromType(type)
  )

  return {
    id: id || (
      sourceTaskId
        ? `${itemId}-${type}-${date}-${sourceTaskId}`
        : type === 'custom-review' || normalizedReviewStage !== null
        ? `${itemId}-${type}-${date}`
        : `${itemId}-${type}`
    ),
    itemId,
    type,
    date,
    scheduledDate: date,
    status: 'pending',
    recallScore: null,
    ...(normalizedReviewStage !== null
      ? { reviewStage: normalizedReviewStage, reviewDay: normalizedReviewDay }
      : {}),
    ...(sourceTaskId ? { sourceTaskId } : {}),
    ...(type === 'new'
      ? { estimatedDifficulty: normalizeEstimatedDifficulty(estimatedDifficulty) }
      : {}),
  }
}

export function createInitialTasks(itemId, createdAt, estimatedDifficulty = DEFAULT_ESTIMATED_DIFFICULTY) {
  return [
    createTask({ itemId, type: 'new', date: createdAt, estimatedDifficulty }),
  ]
}

export function createThirdDayTask(itemId, createdAt) {
  return createTask({
    itemId,
    type: 'review-3',
    date: addDays(createdAt, 3),
    reviewStage: getReviewMilestoneIndexByDay(3),
  })
}

export function createMilestoneReviewTask({
  itemId,
  createdAt,
  anchorDate = createdAt,
  reviewStage,
  sourceTaskId = null,
}) {
  const stage = Math.min(REVIEW_MILESTONE_DAYS.length - 1, Math.max(0, Number(reviewStage) || 0))
  const reviewDay = REVIEW_MILESTONE_DAYS[stage]
  const intervalDays = REVIEW_INTERVAL_DAYS[stage]

  return createTask({
    itemId,
    type: `review-${reviewDay}`,
    date: addDays(anchorDate, intervalDays),
    reviewStage: stage,
    reviewDay,
    sourceTaskId,
  })
}

function getRule(task) {
  return REVIEW_RULES[task.type] || REVIEW_RULES['custom-review']
}

function getReviewStats(tasks, allTasks) {
  return tasks.reduce((stats, task) => {
    if (!isReviewTask(task)) return stats

    const date = getTaskScheduledDate(task)
    const current = stats.get(date) || { load: 0, count: 0, backlogCount: 0, normalCount: 0 }
    const isBacklog = compareDateKey(task.date, date) < 0

    stats.set(date, {
      load: current.load + getReviewTaskLoad(task, allTasks),
      count: current.count + 1,
      backlogCount: current.backlogCount + (isBacklog ? 1 : 0),
      normalCount: current.normalCount + (isBacklog ? 0 : 1),
    })

    return stats
  }, new Map())
}

function canPlaceTaskOnDate({ date, taskLoad, statsByDate, settings }) {
  if (isRestDay(date, settings)) return false

  const capacity = getScheduleCapacity(settings)
  const stats = statsByDate.get(date) || { load: 0, count: 0, backlogCount: 0, normalCount: 0 }
  const nextLoad = stats.load + taskLoad
  const nextCount = stats.count + 1

  if (nextLoad > capacity.maxReviewLoad) return false
  if (nextCount > capacity.maxReviewTasks) return false

  return true
}

function addTaskStats(date, taskLoad, statsByDate, isBacklog) {
  const stats = statsByDate.get(date) || { load: 0, count: 0, backlogCount: 0, normalCount: 0 }
  statsByDate.set(date, {
    load: stats.load + taskLoad,
    count: stats.count + 1,
    backlogCount: stats.backlogCount + (isBacklog ? 1 : 0),
    normalCount: stats.normalCount + (isBacklog ? 0 : 1),
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

function getDateDistanceInDays(fromDate, toDate) {
  const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number)
  const [toYear, toMonth, toDay] = toDate.split('-').map(Number)
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const to = Date.UTC(toYear, toMonth - 1, toDay)

  return Math.max(0, Math.round((to - from) / 86400000))
}

function compareBacklogTasks(a, b, allTasks, today) {
  const overdueCompare = getDateDistanceInDays(b.date, today) - getDateDistanceInDays(a.date, today)
  if (overdueCompare !== 0) return overdueCompare

  const ruleA = getRule(a)
  const ruleB = getRule(b)
  const priorityCompare = ruleA.priority - ruleB.priority
  if (priorityCompare !== 0) return priorityCompare

  const loadCompare = getReviewTaskLoad(b, allTasks) - getReviewTaskLoad(a, allTasks)
  if (loadCompare !== 0) return loadCompare

  return compareDateKey(a.date, b.date) || a.id.localeCompare(b.id)
}

export function getOverdueReviewTasksByPriority(
  tasks,
  today = toDateKey(),
  { excludeScheduledToday = false } = {},
) {
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    scheduledDate: getTaskScheduledDate(task),
  }))

  return normalizedTasks
    .filter(
      (task) =>
        task.status !== 'done' &&
        isReviewTask(task) &&
        compareDateKey(task.date, today) < 0 &&
        (!excludeScheduledToday || getTaskScheduledDate(task) !== today),
    )
    .sort((a, b) => compareBacklogTasks(a, b, normalizedTasks, today))
}

export function getBacklogReviewTasksByPriority(tasks, today = toDateKey()) {
  return getOverdueReviewTasksByPriority(tasks, today, { excludeScheduledToday: true })
}

export function rebalanceReviewSchedule(tasks, today = toDateKey(), rawSettings = DEFAULT_SCHEDULE_SETTINGS) {
  const settings = normalizeScheduleSettings(rawSettings)
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    scheduledDate: getTaskScheduledDate(task),
  }))

  const fixedTasks = normalizedTasks.filter(
    (task) => task.status === 'done' || !isReviewTask(task) || task.manualScheduledDate,
  )
  const pendingReviewTasks = normalizedTasks.filter(
    (task) => task.status !== 'done' && isReviewTask(task) && !task.manualScheduledDate,
  )
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
    .sort((a, b) => compareBacklogTasks(a, b, normalizedTasks, today))

  const statsByDate = getReviewStats(fixedTasks, normalizedTasks)

  function scheduleTask(task, isBacklog) {
    const startDate = isBacklog ? today : task.date
    const taskLoad = getReviewTaskLoad(task, normalizedTasks)
    const scheduledDate = findAvailableDate({ startDate, taskLoad, statsByDate, settings, isBacklog })

    addTaskStats(scheduledDate, taskLoad, statsByDate, isBacklog)

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
