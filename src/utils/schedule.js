import { addDays, compareDateKey, toDateKey } from './date.js'
import { DEFAULT_ESTIMATED_DIFFICULTY, getEstimatedDifficultyLoad, normalizeEstimatedDifficulty } from './difficulty.js'

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const REVIEW_LOAD_LEVELS = {
  light: { label: '轻松', load: 2.2, description: '复习压力更低，适合忙碌日。' },
  standard: { label: '标准', load: 3.0, description: '默认节奏，复习和休息比较均衡。' },
  strong: { label: '加强', load: 4.0, description: '更积极消化任务，适合状态好的阶段。' },
}
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

export const DAILY_TARGET_STUDY_LOAD = 3
export const DAILY_MAX_STUDY_LOAD = 4
export const DAILY_MAX_STUDY_TASKS = 4

export const DAILY_REVIEW_LIMIT = DAILY_TARGET_STUDY_LOAD
export const DAILY_TARGET_REVIEW_LOAD = DAILY_TARGET_STUDY_LOAD
export const DAILY_MAX_REVIEW_LOAD = DAILY_TARGET_STUDY_LOAD
export const DAILY_MAX_REVIEW_TASKS = 3

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

export function getScheduleCapacity(rawSettings = DEFAULT_SCHEDULE_SETTINGS) {
  const settings = normalizeScheduleSettings(rawSettings)
  const maxReviewTasks = settings.dailyReviewLimit
  const maxReviewLoad = REVIEW_LOAD_LEVELS[settings.reviewLoadLevel].load
  const maxBacklogPerDay = {
    conservative: 1,
    balanced: maxReviewTasks,
    aggressive: maxReviewTasks,
  }[settings.backlogStrategy]

  return {
    maxReviewTasks,
    maxReviewLoad,
    maxStudyTasks: Math.max(DAILY_MAX_STUDY_TASKS, maxReviewTasks + 1),
    maxStudyLoad: Math.max(DAILY_MAX_STUDY_LOAD, maxReviewLoad),
    maxBacklogPerDay,
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

export function createTask({ itemId, type, date, estimatedDifficulty = DEFAULT_ESTIMATED_DIFFICULTY }) {
  return {
    id: type === 'custom-review' ? `${itemId}-${type}-${date}` : `${itemId}-${type}`,
    itemId,
    type,
    date,
    scheduledDate: date,
    status: 'pending',
    recallScore: null,
    ...(type === 'new'
      ? { estimatedDifficulty: normalizeEstimatedDifficulty(estimatedDifficulty) }
      : {}),
  }
}

export function createInitialTasks(itemId, createdAt, estimatedDifficulty = DEFAULT_ESTIMATED_DIFFICULTY) {
  return [
    createTask({ itemId, type: 'new', date: createdAt, estimatedDifficulty }),
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

export function getNewTaskLoad(task) {
  return getEstimatedDifficultyLoad(task.estimatedDifficulty)
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

function canPlaceTaskOnDate({ date, taskLoad, statsByDate, settings, isBacklog }) {
  if (isRestDay(date, settings)) return false

  const capacity = getScheduleCapacity(settings)
  const stats = statsByDate.get(date) || { load: 0, count: 0, backlogCount: 0, normalCount: 0 }
  const nextLoad = stats.load + taskLoad
  const nextCount = stats.count + 1
  const nextBacklogCount = stats.backlogCount + (isBacklog ? 1 : 0)
  const backlogLimit = settings.backlogStrategy === 'balanced' && stats.normalCount > 0
    ? 1
    : capacity.maxBacklogPerDay

  if (nextLoad > capacity.maxReviewLoad) return false
  if (nextCount > capacity.maxReviewTasks) return false
  if (isBacklog && nextBacklogCount > backlogLimit) return false

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
