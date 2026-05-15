import { useEffect, useMemo, useState } from 'react'
import { rebalanceReviewSchedule } from '../utils/schedule.js'
import {
  isDesktopFileStorageAvailable,
  loadLocalState,
  loadState,
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
} from '../utils/recitationActions.js'

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
    let createdGroupId = null

    setState((current) => {
      const result = addGroupToState(current, name, options)
      createdGroupId = result.groupId
      return result.state
    })

    return createdGroupId
  }

  function addItem(payload) {
    setState((current) => addItemToState(current, payload))
  }

  function updateItem(itemId, updates) {
    setState((current) => updateItemInState(current, itemId, updates))
  }

  function updateItemGroup(itemId, groupId) {
    setState((current) => updateItemGroupInState(current, itemId, groupId))
  }

  function deleteItem(itemId) {
    setState((current) => deleteItemFromState(current, itemId))
  }

  function renameGroup(groupId, name) {
    setState((current) => renameGroupInState(current, groupId, name))
  }

  function updateGroupColor(groupId, color) {
    setState((current) => updateGroupColorInState(current, groupId, color))
  }

  function updateGroupProgress(groupId, updates) {
    setState((current) => updateGroupProgressInState(current, groupId, updates))
  }

  function toggleGroupPinned(groupId) {
    setState((current) => toggleGroupPinnedInState(current, groupId))
  }

  function deleteGroup(groupId) {
    setState((current) => deleteGroupFromState(current, groupId))
  }

  function addCustomReviewTask(itemId, date) {
    setState((current) => addCustomReviewTaskToState(current, itemId, date))
  }

  function deleteCustomReviewTask(taskId) {
    setState((current) => deleteCustomReviewTaskFromState(current, taskId))
  }

  function completeTask(taskId, recallScore = null) {
    setState((current) => completeTaskInState(current, taskId, recallScore))
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
