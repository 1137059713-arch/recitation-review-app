import {
  createMilestoneReviewTask,
  createInitialTasks,
  createTask,
  getBacklogReviewTasksByPriority,
  getReviewEndStage,
  getTaskReviewStage,
  getTaskScheduledDate,
  isReviewTask,
  normalizeReviewEndDay,
  rebalanceReviewSchedule,
} from './schedule.js'
import { toDateKey } from './date.js'
import { DEFAULT_GROUP_COLOR } from './groups.js'
import { DEFAULT_ESTIMATED_DIFFICULTY, normalizeEstimatedDifficulty } from './difficulty.js'
import { getItemMastery } from './mastery.js'

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTotalChapters(value) {
  const totalChapters = Number(value)
  return Number.isFinite(totalChapters) && totalChapters > 0 ? totalChapters : 0
}

function createGroup({
  name,
  createdAt,
  progressEnabled = false,
  totalChapters = 0,
  reviewEndDay = 180,
}) {
  return {
    id: createId(),
    name: name.trim(),
    createdAt,
    color: DEFAULT_GROUP_COLOR,
    isPinned: false,
    progressEnabled: Boolean(progressEnabled),
    totalChapters: normalizeTotalChapters(totalChapters),
    reviewEndDay: normalizeReviewEndDay(reviewEndDay),
  }
}

export function addGroupToState(current, name, options = {}) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return {
      state: current,
      groupId: null,
    }
  }

  const group = createGroup({
    name: trimmedName,
    createdAt: toDateKey(),
    progressEnabled: options.progressEnabled,
    totalChapters: options.totalChapters,
    reviewEndDay: options.reviewEndDay,
  })

  return {
    state: {
      ...current,
      groups: [...current.groups, group],
    },
    groupId: group.id,
  }
}

export function addItemToState(
  current,
  {
    title,
    body,
    groupId = null,
    newGroupName = '',
    newGroupProgressEnabled = false,
    newGroupTotalChapters = 0,
    newGroupReviewEndDay = 180,
    reviewEndDay = 180,
    isImportant = false,
    estimatedDifficulty = DEFAULT_ESTIMATED_DIFFICULTY,
  },
) {
  const createdAt = toDateKey()
  const trimmedGroupName = newGroupName.trim()
  const newGroup = trimmedGroupName
    ? createGroup({
        name: trimmedGroupName,
        createdAt,
        progressEnabled: newGroupProgressEnabled,
        totalChapters: newGroupTotalChapters,
        reviewEndDay: newGroupReviewEndDay,
      })
    : null
  const group = newGroup || current.groups.find((candidate) => candidate.id === groupId)
  const isBookItem = Boolean(group?.progressEnabled)
  const item = {
    id: createId(),
    title: title.trim(),
    body: body.trim(),
    createdAt,
    groupId: newGroup ? newGroup.id : groupId || null,
    estimatedDifficulty: normalizeEstimatedDifficulty(estimatedDifficulty),
    reviewEndDay: normalizeReviewEndDay(isBookItem ? group.reviewEndDay : reviewEndDay),
    isImportant: Boolean(isImportant),
  }
  const nextTasks = [
    ...createInitialTasks(item.id, createdAt, item.estimatedDifficulty),
    ...current.tasks,
  ]

  return {
    ...current,
    groups: newGroup ? [...current.groups, newGroup] : current.groups,
    items: [item, ...current.items],
    tasks: rebalanceReviewSchedule(nextTasks),
  }
}

export function updateItemInState(current, itemId, updates) {
  return {
    ...current,
    items: current.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            title: updates.title.trim(),
            body: updates.body.trim(),
          }
        : item,
    ),
  }
}

export function updateItemGroupInState(current, itemId, groupId) {
  return {
    ...current,
    items: current.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            groupId: groupId || null,
          }
        : item,
    ),
  }
}

export function deleteItemFromState(current, itemId) {
  return {
    ...current,
    items: current.items.filter((item) => item.id !== itemId),
    tasks: current.tasks.filter((task) => task.itemId !== itemId),
  }
}

export function renameGroupInState(current, groupId, name) {
  const trimmedName = name.trim()
  if (!trimmedName) return current

  return {
    ...current,
    groups: current.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            name: trimmedName,
          }
        : group,
    ),
  }
}

export function updateGroupColorInState(current, groupId, color) {
  return {
    ...current,
    groups: current.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            color,
          }
        : group,
    ),
  }
}

export function updateGroupProgressInState(current, groupId, updates) {
  return {
    ...current,
    groups: current.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            progressEnabled: Boolean(updates.progressEnabled),
            totalChapters: normalizeTotalChapters(updates.totalChapters),
          }
        : group,
    ),
  }
}

export function toggleGroupPinnedInState(current, groupId) {
  return {
    ...current,
    groups: current.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            isPinned: !group.isPinned,
          }
        : group,
    ),
  }
}

export function deleteGroupFromState(current, groupId) {
  return {
    ...current,
    groups: current.groups.filter((group) => group.id !== groupId),
    items: current.items.map((item) =>
      item.groupId === groupId
        ? {
            ...item,
            groupId: null,
          }
        : item,
    ),
  }
}

export function addCustomReviewTaskToState(current, itemId, date) {
  const itemExists = current.items.some((item) => item.id === itemId)
  const alreadyExists = current.tasks.some(
    (task) => task.itemId === itemId && task.type === 'custom-review' && task.date === date,
  )

  if (!itemExists || alreadyExists) return current

  return {
    ...current,
    tasks: rebalanceReviewSchedule([
      ...current.tasks,
      createTask({
        itemId,
        type: 'custom-review',
        date,
      }),
    ]),
  }
}

export function deleteCustomReviewTaskFromState(current, taskId) {
  return {
    ...current,
    tasks: rebalanceReviewSchedule(
      current.tasks.filter((task) => !(task.id === taskId && task.type === 'custom-review')),
    ),
  }
}

export function pullNextBacklogReviewToTodayInState(current) {
  const today = toDateKey()
  const [nextTask] = getBacklogReviewTasksByPriority(current.tasks, today)

  if (!nextTask) return current

  return {
    ...current,
    tasks: rebalanceReviewSchedule(
      current.tasks.map((task) =>
        task.id === nextTask.id ||
        (task.status !== 'done' && isReviewTask(task) && getTaskScheduledDate(task) === today)
          ? {
              ...task,
              scheduledDate: today,
              manualScheduledDate: today,
            }
          : task,
      ),
      today,
      current.scheduleSettings,
    ),
  }
}

export function scheduleReviewTaskTodayInState(current, taskId) {
  const today = toDateKey()
  const targetTask = current.tasks.find((task) => task.id === taskId)

  if (!targetTask || targetTask.status === 'done' || !isReviewTask(targetTask)) return current
  if (getTaskScheduledDate(targetTask) === today) return current

  return {
    ...current,
    tasks: rebalanceReviewSchedule(
      current.tasks.map((task) =>
        task.id === taskId ||
        (task.status !== 'done' && isReviewTask(task) && getTaskScheduledDate(task) === today)
          ? {
              ...task,
              scheduledDate: today,
              manualScheduledDate: today,
            }
          : task,
      ),
      today,
      current.scheduleSettings,
    ),
  }
}

function getMasteryLevel(score) {
  const numericScore = Number(score)
  if (numericScore < 40) return 20
  if (numericScore < 70) return 50
  if (numericScore < 90) return 80
  return 100
}

function isImportantReviewTarget(item, group) {
  return Boolean(item?.isImportant || item?.important || group?.isImportant || group?.important)
}

function getNextReviewStage({ task, item, group, itemTasks }) {
  const reviewEndStage = getReviewEndStage(item?.reviewEndDay ?? group?.reviewEndDay)
  const currentStage = task.type === 'new' ? -1 : getTaskReviewStage(task)
  const reviewCount = itemTasks.filter((candidate) => candidate.status === 'done' && isReviewTask(candidate)).length
  const mastery = getItemMastery(itemTasks)
  const masteryLevel = task.type === 'new' ? 80 : getMasteryLevel(mastery.score)
  const isImportant = isImportantReviewTarget(item, group)

  if (masteryLevel === 20) {
    return isImportant ? Math.max(0, currentStage - 1) : Math.max(0, currentStage)
  }

  if (masteryLevel === 50) {
    return Math.max(0, currentStage)
  }

  if (masteryLevel === 100 && reviewCount >= 4) {
    const skipTargetStage = Math.min(reviewEndStage, currentStage + 2)
    const stageBeforeEnd = Math.max(0, reviewEndStage - 1)
    return currentStage < stageBeforeEnd
      ? Math.min(skipTargetStage, stageBeforeEnd)
      : Math.min(reviewEndStage, currentStage + 1)
  }

  return Math.min(reviewEndStage, currentStage + 1)
}

function createNextReviewTask({ task, item, group, tasks, completedAt }) {
  if (!item) return null

  const itemTasks = tasks.filter((candidate) => candidate.itemId === task.itemId)
  const currentStage = task.type === 'new' ? -1 : getTaskReviewStage(task)
  const nextStage = getNextReviewStage({ task, item, group, itemTasks })
  const reviewEndStage = getReviewEndStage(item.reviewEndDay ?? group?.reviewEndDay)
  const masteryLevel = task.type === 'new' ? 80 : getMasteryLevel(getItemMastery(itemTasks).score)

  if (nextStage > reviewEndStage) return null
  if (currentStage >= reviewEndStage && masteryLevel >= 80) return null

  const alreadyHasPendingStage = itemTasks.some(
    (candidate) =>
      candidate.status !== 'done' &&
      isReviewTask(candidate) &&
      getTaskReviewStage(candidate) === nextStage,
  )

  if (alreadyHasPendingStage) return null

  return createMilestoneReviewTask({
    itemId: item.id,
    createdAt: item.createdAt,
    anchorDate: completedAt,
    reviewStage: nextStage,
    sourceTaskId: task.id,
  })
}

export function completeTaskInState(current, taskId, recallScore = null) {
  const task = current.tasks.find((candidate) => candidate.id === taskId)
  if (!task) return current
  const completedAt = toDateKey()
  if (getTaskScheduledDate(task) > completedAt && task.status !== 'done') return current

  if (task.status === 'done') {
    const nextTasks = current.tasks
      .filter((candidate) => candidate.sourceTaskId !== taskId)
      .map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              status: 'pending',
              recallScore: null,
            }
          : candidate,
      )

    return {
      ...current,
      tasks: rebalanceReviewSchedule(nextTasks),
    }
  }

  const updatedTasks = current.tasks.map((candidate) =>
    candidate.id === taskId
      ? {
          ...candidate,
          status: 'done',
          recallScore,
        }
      : candidate,
  )
  const item = current.items.find((candidate) => candidate.id === task.itemId)
  const group = item?.groupId ? current.groups.find((candidate) => candidate.id === item.groupId) : null
  const nextReviewTask = createNextReviewTask({
    task: {
      ...task,
      status: 'done',
      recallScore,
    },
    item,
    group,
    tasks: updatedTasks,
    completedAt,
  })

  return {
    ...current,
    tasks: rebalanceReviewSchedule(nextReviewTask ? [...updatedTasks, nextReviewTask] : updatedTasks),
  }
}
