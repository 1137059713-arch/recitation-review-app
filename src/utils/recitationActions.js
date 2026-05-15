import { createInitialTasks, createTask, getTaskScheduledDate, rebalanceReviewSchedule } from './schedule.js'
import { toDateKey } from './date.js'
import { DEFAULT_GROUP_COLOR } from './groups.js'

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

function createGroup({ name, createdAt, progressEnabled = false, totalChapters = 0 }) {
  return {
    id: createId(),
    name: name.trim(),
    createdAt,
    color: DEFAULT_GROUP_COLOR,
    isPinned: false,
    progressEnabled: Boolean(progressEnabled),
    totalChapters: normalizeTotalChapters(totalChapters),
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
      })
    : null
  const item = {
    id: createId(),
    title: title.trim(),
    body: body.trim(),
    createdAt,
    groupId: newGroup ? newGroup.id : groupId || null,
  }
  const nextTasks = [...createInitialTasks(item.id, createdAt), ...current.tasks]

  return {
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

export function completeTaskInState(current, taskId, recallScore = null) {
  const task = current.tasks.find((candidate) => candidate.id === taskId)
  if (!task) return current
  if (getTaskScheduledDate(task) > toDateKey() && task.status !== 'done') return current

  if (task.status === 'done') {
    const nextTasks = current.tasks.map((candidate) =>
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

  return {
    ...current,
    tasks: rebalanceReviewSchedule(updatedTasks),
  }
}
