import { useEffect, useMemo, useState } from 'react'
import {
  createInitialTasks,
  createTask,
  getTaskScheduledDate,
  rebalanceReviewSchedule,
} from '../utils/schedule.js'
import {
  isDesktopFileStorageAvailable,
  loadLocalState,
  loadState,
  saveState,
} from '../utils/storage.js'
import { toDateKey } from '../utils/date.js'
import { DEFAULT_GROUP_COLOR } from '../utils/groups.js'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useRecitationStore() {
  const [state, setState] = useState(() => {
    const loadedState = loadLocalState()
    return {
      ...loadedState,
      tasks: rebalanceReviewSchedule(loadedState.tasks),
    }
  })
  const [isReadyToSave, setIsReadyToSave] = useState(() => !isDesktopFileStorageAvailable())

  useEffect(() => {
    let isActive = true

    loadState().then(({ state: loadedState }) => {
      if (!isActive) return

      setState({
        ...loadedState,
        tasks: rebalanceReviewSchedule(loadedState.tasks),
      })
      setIsReadyToSave(true)
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!isReadyToSave) return
    saveState(state)
  }, [isReadyToSave, state])

  const itemsById = useMemo(() => {
    return new Map(state.items.map((item) => [item.id, item]))
  }, [state.items])

  const groupsById = useMemo(() => {
    return new Map(state.groups.map((group) => [group.id, group]))
  }, [state.groups])

  function addGroup(name, options = {}) {
    const trimmedName = name.trim()
    if (!trimmedName) return null
    const totalChapters = Number(options.totalChapters)

    const group = {
      id: createId(),
      name: trimmedName,
      createdAt: toDateKey(),
      color: DEFAULT_GROUP_COLOR,
      isPinned: false,
      progressEnabled: Boolean(options.progressEnabled),
      totalChapters: Number.isFinite(totalChapters) && totalChapters > 0 ? totalChapters : 0,
    }

    setState((current) => ({
      ...current,
      groups: [...current.groups, group],
    }))

    return group.id
  }

  function addItem({
    title,
    body,
    groupId = null,
    newGroupName = '',
    newGroupProgressEnabled = false,
    newGroupTotalChapters = 0,
  }) {
    const createdAt = toDateKey()
    const trimmedGroupName = newGroupName.trim()
    const totalChapters = Number(newGroupTotalChapters)
    const newGroup = trimmedGroupName
      ? {
          id: createId(),
          name: trimmedGroupName,
          createdAt,
          color: DEFAULT_GROUP_COLOR,
          isPinned: false,
          progressEnabled: Boolean(newGroupProgressEnabled),
          totalChapters: Number.isFinite(totalChapters) && totalChapters > 0 ? totalChapters : 0,
        }
      : null
    const item = {
      id: createId(),
      title: title.trim(),
      body: body.trim(),
      createdAt,
      groupId: newGroup ? newGroup.id : groupId || null,
    }

    setState((current) => {
      const nextTasks = [...createInitialTasks(item.id, createdAt), ...current.tasks]

      return {
        groups: newGroup ? [...current.groups, newGroup] : current.groups,
        items: [item, ...current.items],
        tasks: rebalanceReviewSchedule(nextTasks),
      }
    })
  }

  function updateItem(itemId, updates) {
    setState((current) => ({
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
    }))
  }

  function updateItemGroup(itemId, groupId) {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              groupId: groupId || null,
            }
          : item,
      ),
    }))
  }

  function deleteItem(itemId) {
    setState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
      tasks: current.tasks.filter((task) => task.itemId !== itemId),
    }))
  }

  function renameGroup(groupId, name) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              name: trimmedName,
            }
          : group,
      ),
    }))
  }

  function updateGroupColor(groupId, color) {
    setState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              color,
            }
          : group,
      ),
    }))
  }

  function updateGroupProgress(groupId, updates) {
    setState((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== groupId) return group

        const totalChapters = Number(updates.totalChapters)

        return {
          ...group,
          progressEnabled: Boolean(updates.progressEnabled),
          totalChapters:
            Number.isFinite(totalChapters) && totalChapters > 0 ? totalChapters : 0,
        }
      }),
    }))
  }

  function toggleGroupPinned(groupId) {
    setState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              isPinned: !group.isPinned,
            }
          : group,
      ),
    }))
  }

  function deleteGroup(groupId) {
    setState((current) => ({
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
    }))
  }

  function addCustomReviewTask(itemId, date) {
    setState((current) => {
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
    })
  }

  function deleteCustomReviewTask(taskId) {
    setState((current) => ({
      ...current,
      tasks: rebalanceReviewSchedule(
        current.tasks.filter((task) => !(task.id === taskId && task.type === 'custom-review')),
      ),
    }))
  }

  function completeTask(taskId, recallScore = null) {
    setState((current) => {
      const task = current.tasks.find((candidate) => candidate.id === taskId)
      if (!task) return current
      if (getTaskScheduledDate(task) > toDateKey() && task.status !== 'done') return current

      if (task.status === 'done') {
        const nextTasks = current.tasks
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

      return {
        ...current,
        tasks: rebalanceReviewSchedule(updatedTasks),
      }
    })
  }

  return {
    items: state.items,
    tasks: state.tasks,
    groups: state.groups,
    itemsById,
    groupsById,
    addGroup,
    addItem,
    updateItem,
    updateItemGroup,
    deleteItem,
    renameGroup,
    updateGroupColor,
    updateGroupProgress,
    toggleGroupPinned,
    deleteGroup,
    addCustomReviewTask,
    deleteCustomReviewTask,
    completeTask,
  }
}
