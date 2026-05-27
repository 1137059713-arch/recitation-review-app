import { useEffect, useMemo, useState } from 'react'
import { normalizeScheduleSettings, rebalanceReviewSchedule } from '../utils/schedule.js'
import {
  isDesktopFileStorageAvailable,
  exportState,
  importState,
  loadLocalState,
  loadState,
  normalizeAppSettings,
  saveState,
} from '../utils/storage.js'
import {
  addCustomReviewTaskToState,
  addGroupToState,
  addItemToState,
  completeTaskInState,
  deleteCustomReviewTaskFromState,
  deleteGroupFromState,
  deleteItemFromState,
  renameGroupInState,
  toggleGroupPinnedInState,
  updateGroupColorInState,
  updateGroupProgressInState,
  updateItemGroupInState,
  updateItemInState,
  pullNextBacklogReviewToTodayInState,
  scheduleReviewTaskTodayInState,
} from '../utils/recitationActions.js'

function rebalanceState(state) {
  const scheduleSettings = normalizeScheduleSettings(state.scheduleSettings)

  return {
    ...state,
    scheduleSettings,
    tasks: rebalanceReviewSchedule(state.tasks, undefined, scheduleSettings),
  }
}

export function useRecitationStore() {
  const [state, setState] = useState(() => {
    const loadedState = loadLocalState()
    return rebalanceState(loadedState)
  })
  const [isReadyToSave, setIsReadyToSave] = useState(() => !isDesktopFileStorageAvailable())

  useEffect(() => {
    let isActive = true

    loadState().then(({ state: loadedState }) => {
      if (!isActive) return

      setState(rebalanceState(loadedState))
      setIsReadyToSave(true)
    })

    return () => {
      isActive = false
    }
  }, [])

  async function refreshState() {
    const { state: loadedState } = await loadState()
    setState(rebalanceState(loadedState))
  }

  useEffect(() => {
    if (!isReadyToSave) return
    saveState(state).catch((error) => {
      console.error('Failed to save recitation state:', error)
    })
  }, [isReadyToSave, state])

  const itemsById = useMemo(() => {
    return new Map(state.items.map((item) => [item.id, item]))
  }, [state.items])

  const groupsById = useMemo(() => {
    return new Map(state.groups.map((group) => [group.id, group]))
  }, [state.groups])

  function addGroup(name, options = {}) {
    let createdGroupId = null

    setState((current) => {
      const result = addGroupToState(current, name, options)
      createdGroupId = result.groupId
      return rebalanceState(result.state)
    })

    return createdGroupId
  }

  function addItem(payload) {
    setState((current) => rebalanceState(addItemToState(current, payload)))
  }

  function updateItem(itemId, updates) {
    setState((current) => rebalanceState(updateItemInState(current, itemId, updates)))
  }

  function updateItemGroup(itemId, groupId) {
    setState((current) => rebalanceState(updateItemGroupInState(current, itemId, groupId)))
  }

  function deleteItem(itemId) {
    setState((current) => rebalanceState(deleteItemFromState(current, itemId)))
  }

  function renameGroup(groupId, name) {
    setState((current) => rebalanceState(renameGroupInState(current, groupId, name)))
  }

  function updateGroupColor(groupId, color) {
    setState((current) => rebalanceState(updateGroupColorInState(current, groupId, color)))
  }

  function updateGroupProgress(groupId, updates) {
    setState((current) => rebalanceState(updateGroupProgressInState(current, groupId, updates)))
  }

  function toggleGroupPinned(groupId) {
    setState((current) => rebalanceState(toggleGroupPinnedInState(current, groupId)))
  }

  function deleteGroup(groupId) {
    setState((current) => rebalanceState(deleteGroupFromState(current, groupId)))
  }

  function addCustomReviewTask(itemId, date) {
    setState((current) => rebalanceState(addCustomReviewTaskToState(current, itemId, date)))
  }

  function deleteCustomReviewTask(taskId) {
    setState((current) => rebalanceState(deleteCustomReviewTaskFromState(current, taskId)))
  }

  function pullNextBacklogReviewToToday() {
    setState((current) => rebalanceState(pullNextBacklogReviewToTodayInState(current)))
  }

  function scheduleReviewTaskToday(taskId) {
    setState((current) => rebalanceState(scheduleReviewTaskTodayInState(current, taskId)))
  }

  function completeTask(taskId, recallScore = null) {
    setState((current) => rebalanceState(completeTaskInState(current, taskId, recallScore)))
  }

  function updateScheduleSettings(updates) {
    setState((current) =>
      rebalanceState({
        ...current,
        scheduleSettings: {
          ...current.scheduleSettings,
          ...updates,
        },
      }),
    )
  }

  function updateAppSettings(updates) {
    setState((current) =>
      rebalanceState({
        ...current,
        appSettings: normalizeAppSettings({
          ...current.appSettings,
          ...updates,
        }),
      }),
    )
  }

  async function exportData() {
    return exportState()
  }

  async function importData() {
    const result = await importState()
    if (result?.ok && result.state) {
      setState(rebalanceState(result.state))
    }

    return result
  }

  return {
    items: state.items,
    tasks: state.tasks,
    groups: state.groups,
    scheduleSettings: state.scheduleSettings,
    appSettings: normalizeAppSettings(state.appSettings),
    itemsById,
    groupsById,
    refreshState,
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
    pullNextBacklogReviewToToday,
    scheduleReviewTaskToday,
    completeTask,
    updateScheduleSettings,
    updateAppSettings,
    exportData,
    importData,
  }
}
