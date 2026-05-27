import {
  DEFAULT_REVIEW_END_DAY,
  DEFAULT_SCHEDULE_SETTINGS,
  REVIEW_MILESTONE_DAYS,
  getReviewMilestoneIndexByDay,
  normalizeReviewEndDay,
  normalizeScheduleSettings,
} from './schedule.js'

const STORAGE_KEY = 'recitation-review-state-v1'

const EMPTY_STATE = {
  items: [],
  tasks: [],
  groups: [],
  scheduleSettings: DEFAULT_SCHEDULE_SETTINGS,
  appSettings: {
    autoBackupEnabled: true,
    emptyDataProtectionEnabled: true,
    showSidebarTodayTasks: true,
    launchAtLogin: false,
    windowOpacity: 1,
  },
}

export const DEFAULT_APP_SETTINGS = EMPTY_STATE.appSettings

function getDesktopStorage() {
  return window.recitationStorage || null
}

function normalizeTask(task) {
  const reviewDayMatch = String(task?.type || '').match(/^review-(\d+)$/)
  const reviewDay = Number(task?.reviewDay ?? reviewDayMatch?.[1])
  const reviewStage = Number.isInteger(task?.reviewStage)
    ? task.reviewStage
    : getReviewMilestoneIndexByDay(reviewDay)

  return {
    ...task,
    scheduledDate: task.scheduledDate || task.date,
    ...(reviewStage >= 0 ? { reviewStage, reviewDay: REVIEW_MILESTONE_DAYS[reviewStage] } : {}),
  }
}

function normalizeState(value) {
  return {
    items: Array.isArray(value?.items)
      ? value.items.map((item) => ({
          ...item,
          reviewEndDay: normalizeReviewEndDay(item.reviewEndDay ?? DEFAULT_REVIEW_END_DAY),
        }))
      : [],
    tasks: Array.isArray(value?.tasks) ? value.tasks.map(normalizeTask) : [],
    groups: Array.isArray(value?.groups)
      ? value.groups.map((group) => ({
          ...group,
          progressEnabled: Boolean(group.progressEnabled),
          totalChapters: Number(group.totalChapters) > 0 ? Number(group.totalChapters) : 0,
          reviewEndDay: normalizeReviewEndDay(group.reviewEndDay ?? DEFAULT_REVIEW_END_DAY),
        }))
      : [],
    scheduleSettings: normalizeScheduleSettings(value?.scheduleSettings),
    appSettings: normalizeAppSettings(value?.appSettings),
  }
}

export function normalizeAppSettings(settings = {}) {
  const windowOpacity = Number(settings?.windowOpacity)

  return {
    autoBackupEnabled:
      typeof settings?.autoBackupEnabled === 'boolean'
        ? settings.autoBackupEnabled
        : DEFAULT_APP_SETTINGS.autoBackupEnabled,
    emptyDataProtectionEnabled:
      typeof settings?.emptyDataProtectionEnabled === 'boolean'
        ? settings.emptyDataProtectionEnabled
        : DEFAULT_APP_SETTINGS.emptyDataProtectionEnabled,
    showSidebarTodayTasks:
      typeof settings?.showSidebarTodayTasks === 'boolean'
        ? settings.showSidebarTodayTasks
        : DEFAULT_APP_SETTINGS.showSidebarTodayTasks,
    launchAtLogin:
      typeof settings?.launchAtLogin === 'boolean'
        ? settings.launchAtLogin
        : DEFAULT_APP_SETTINGS.launchAtLogin,
    windowOpacity: Number.isFinite(windowOpacity)
      ? Math.min(1, Math.max(0.6, windowOpacity))
      : DEFAULT_APP_SETTINGS.windowOpacity,
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
    const result = await desktopStorage.save(state)
    if (result?.blocked) {
      throw new Error('empty-data-overwrite')
    }
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function exportState() {
  const desktopStorage = getDesktopStorage()
  if (!desktopStorage?.exportData) {
    return { ok: false, reason: 'desktop-storage-unavailable' }
  }

  return desktopStorage.exportData()
}

export async function importState() {
  const desktopStorage = getDesktopStorage()
  if (!desktopStorage?.importData) {
    return { ok: false, reason: 'desktop-storage-unavailable' }
  }

  const result = await desktopStorage.importData()
  if (result?.state) {
    result.state = normalizeState(result.state)
  }
  return result
}
