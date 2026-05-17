import { DEFAULT_SCHEDULE_SETTINGS, normalizeScheduleSettings } from './schedule.js'

const STORAGE_KEY = 'recitation-review-state-v1'

const EMPTY_STATE = {
  items: [],
  tasks: [],
  groups: [],
  scheduleSettings: DEFAULT_SCHEDULE_SETTINGS,
}

function getDesktopStorage() {
  return window.recitationStorage || null
}

function normalizeTask(task) {
  return {
    ...task,
    scheduledDate: task.scheduledDate || task.date,
  }
}

function normalizeState(value) {
  return {
    items: Array.isArray(value?.items) ? value.items : [],
    tasks: Array.isArray(value?.tasks) ? value.tasks.map(normalizeTask) : [],
    groups: Array.isArray(value?.groups)
      ? value.groups.map((group) => ({
          ...group,
          progressEnabled: Boolean(group.progressEnabled),
          totalChapters: Number(group.totalChapters) > 0 ? Number(group.totalChapters) : 0,
        }))
      : [],
    scheduleSettings: normalizeScheduleSettings(value?.scheduleSettings),
  }
}

export function isDesktopFileStorageAvailable() {
  return Boolean(getDesktopStorage())
}

export function loadLocalState() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) return EMPTY_STATE

    return normalizeState(JSON.parse(rawValue))
  } catch {
    return EMPTY_STATE
  }
}

export async function loadState() {
  const desktopStorage = getDesktopStorage()

  if (!desktopStorage) {
    return {
      state: loadLocalState(),
      filePath: null,
      source: 'localStorage',
    }
  }

  const result = await desktopStorage.load()
  const loadedState = normalizeState(result?.state)
  const localState = loadLocalState()
  const shouldMigrateLocalState =
    loadedState.items.length === 0 &&
    loadedState.tasks.length === 0 &&
    loadedState.groups.length === 0 &&
    (localState.items.length > 0 || localState.tasks.length > 0 || localState.groups.length > 0)

  if (shouldMigrateLocalState) {
    await desktopStorage.save(localState)

    return {
      state: localState,
      filePath: result?.filePath || null,
      source: 'localStorage-migrated',
    }
  }

  return {
    state: loadedState,
    filePath: result?.filePath || null,
    source: 'file',
  }
}

export async function saveState(state) {
  const desktopStorage = getDesktopStorage()

  if (desktopStorage) {
    await desktopStorage.save(state)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
