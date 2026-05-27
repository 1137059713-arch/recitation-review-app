const { app, BrowserWindow, Menu, ipcMain, screen, shell, dialog } = require('electron')
const fs = require('fs/promises')
const path = require('path')
const { pathToFileURL } = require('url')

const isDev = !app.isPackaged
const appRoot = isDev ? app.getAppPath() : path.resolve(path.dirname(process.execPath), '..', '..')
const dataDirectory = path.join(appRoot, 'data')
const dataFilePath = path.join(dataDirectory, 'recitation-data.json')
const SIDEBAR_WIDTH = 280
const SIDEBAR_HEIGHT = 460
const SIDEBAR_EDGE_TRIGGER = 3
const SIDEBAR_SCREEN_MARGIN = 10
const SIDEBAR_ANIMATION_MS = 180

let mainWindow = null
let sidebarWindow = null
let sidebarAnimation = null
let sidebarIsShown = false
let sidebarMouseMonitor = null
let sidebarHideTimer = null

const EMPTY_STATE = {
  items: [],
  tasks: [],
  groups: [],
  scheduleSettings: {
    restDays: [0],
    dailyReviewLimit: 3,
    reviewLoadLevel: 'standard',
    backlogStrategy: 'balanced',
  },
  appSettings: {
    autoBackupEnabled: true,
    emptyDataProtectionEnabled: true,
    showSidebarTodayTasks: true,
    launchAtLogin: false,
    windowOpacity: 1,
  },
}

const REVIEW_LOAD_LEVELS = new Set(['light', 'standard', 'strong'])
const BACKLOG_STRATEGIES = new Set(['conservative', 'balanced', 'aggressive'])

function normalizeScheduleSettings(settings) {
  const restDays = Array.isArray(settings?.restDays)
    ? [...new Set(settings.restDays.map(Number))]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b)
    : EMPTY_STATE.scheduleSettings.restDays

  return {
    restDays: [restDays[0] ?? EMPTY_STATE.scheduleSettings.restDays[0]],
    dailyReviewLimit: [2, 3, 4].includes(Number(settings?.dailyReviewLimit))
      ? Number(settings.dailyReviewLimit)
      : EMPTY_STATE.scheduleSettings.dailyReviewLimit,
    reviewLoadLevel: REVIEW_LOAD_LEVELS.has(settings?.reviewLoadLevel)
      ? settings.reviewLoadLevel
      : EMPTY_STATE.scheduleSettings.reviewLoadLevel,
    backlogStrategy: BACKLOG_STRATEGIES.has(settings?.backlogStrategy)
      ? settings.backlogStrategy
      : EMPTY_STATE.scheduleSettings.backlogStrategy,
  }
}

function normalizeAppSettings(settings) {
  const windowOpacity = Number(settings?.windowOpacity)

  return {
    autoBackupEnabled:
      typeof settings?.autoBackupEnabled === 'boolean'
        ? settings.autoBackupEnabled
        : EMPTY_STATE.appSettings.autoBackupEnabled,
    emptyDataProtectionEnabled:
      typeof settings?.emptyDataProtectionEnabled === 'boolean'
        ? settings.emptyDataProtectionEnabled
        : EMPTY_STATE.appSettings.emptyDataProtectionEnabled,
    showSidebarTodayTasks:
      typeof settings?.showSidebarTodayTasks === 'boolean'
        ? settings.showSidebarTodayTasks
        : EMPTY_STATE.appSettings.showSidebarTodayTasks,
    launchAtLogin:
      typeof settings?.launchAtLogin === 'boolean'
        ? settings.launchAtLogin
        : EMPTY_STATE.appSettings.launchAtLogin,
    windowOpacity: Number.isFinite(windowOpacity)
      ? Math.min(1, Math.max(0.6, windowOpacity))
      : EMPTY_STATE.appSettings.windowOpacity,
  }
}

function normalizeState(value) {
  return {
    items: Array.isArray(value?.items) ? value.items : [],
    tasks: Array.isArray(value?.tasks) ? value.tasks : [],
    groups: Array.isArray(value?.groups) ? value.groups : [],
    scheduleSettings: normalizeScheduleSettings(value?.scheduleSettings),
    appSettings: normalizeAppSettings(value?.appSettings),
  }
}

function hasRecitationContent(state) {
  return (
    Array.isArray(state?.items) && state.items.length > 0
  ) || (
    Array.isArray(state?.tasks) && state.tasks.length > 0
  ) || (
    Array.isArray(state?.groups) && state.groups.length > 0
  )
}

function getBackupRelevantState(state) {
  const normalizedState = normalizeState(state)

  return {
    items: normalizedState.items,
    tasks: normalizedState.tasks,
    groups: normalizedState.groups,
    scheduleSettings: normalizedState.scheduleSettings,
  }
}

function hasBackupRelevantChange(currentState, nextState) {
  return (
    JSON.stringify(getBackupRelevantState(currentState)) !==
    JSON.stringify(getBackupRelevantState(nextState))
  )
}

function createTimestamp() {
  const now = new Date()
  const pad = (value, size = 2) => String(value).padStart(size, '0')

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    '-',
    pad(now.getMilliseconds(), 3),
  ].join('')
}

async function createBackupFromRaw(rawValue, reason = 'auto') {
  const parsedState = normalizeState(JSON.parse(rawValue))
  if (!hasRecitationContent(parsedState)) return null

  const backupDirectory = path.join(dataDirectory, 'backups')
  await fs.mkdir(backupDirectory, { recursive: true })

  const backupFilePath = path.join(
    backupDirectory,
    `recitation-data-${reason}-${createTimestamp()}.json`,
  )

  await fs.writeFile(backupFilePath, JSON.stringify(parsedState, null, 2), 'utf8')
  return backupFilePath
}

async function createStartupBackup(rawValue) {
  const parsedState = normalizeState(JSON.parse(rawValue))
  const settings = normalizeAppSettings(parsedState.appSettings)
  if (!settings.autoBackupEnabled || !hasRecitationContent(parsedState)) return null

  const backupDirectory = path.join(dataDirectory, 'backups')
  await fs.mkdir(backupDirectory, { recursive: true })

  const today = createTimestamp().slice(0, 10)
  const existingBackups = await fs.readdir(backupDirectory).catch(() => [])
  const hasTodayBackup = existingBackups.some((fileName) =>
    fileName.startsWith(`recitation-data-startup-${today}`),
  )

  if (hasTodayBackup) return null
  return createBackupFromRaw(rawValue, 'startup')
}

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true })

  try {
    await fs.access(dataFilePath)
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(EMPTY_STATE, null, 2), 'utf8')
  }
}

async function readRecitationState() {
  await ensureDataFile()

  try {
    const rawValue = await fs.readFile(dataFilePath, 'utf8')
    await createStartupBackup(rawValue)
    return {
      state: normalizeState(JSON.parse(rawValue)),
      filePath: dataFilePath,
    }
  } catch {
    return {
      state: EMPTY_STATE,
      filePath: dataFilePath,
    }
  }
}

async function writeRecitationState(state) {
  await ensureDataFile()
  const nextState = normalizeState(state)
  const nextRawValue = JSON.stringify(nextState, null, 2)
  const currentRawValue = await fs.readFile(dataFilePath, 'utf8').catch(() => null)
  const currentState = currentRawValue ? normalizeState(JSON.parse(currentRawValue)) : EMPTY_STATE
  const currentSettings = normalizeAppSettings(currentState.appSettings)
  const shouldBackup =
    currentSettings.autoBackupEnabled &&
    currentRawValue &&
    hasRecitationContent(currentState) &&
    hasBackupRelevantChange(currentState, nextState)

  if (
    currentSettings.emptyDataProtectionEnabled &&
    hasRecitationContent(currentState) &&
    !hasRecitationContent(nextState)
  ) {
    const backupFilePath = shouldBackup
      ? await createBackupFromRaw(currentRawValue, 'blocked-empty-overwrite')
      : null

    return {
      ok: false,
      blocked: true,
      reason: 'empty-data-overwrite',
      filePath: dataFilePath,
      backupFilePath,
    }
  }

  const backupFilePath = shouldBackup ? await createBackupFromRaw(currentRawValue, 'before-save') : null

  await fs.writeFile(dataFilePath, nextRawValue, 'utf8')
  applyAppSettings(nextState.appSettings)

  return {
    ok: true,
    filePath: dataFilePath,
    backupFilePath,
  }
}

ipcMain.handle('recitation-storage:load', readRecitationState)
ipcMain.handle('recitation-storage:save', (_event, state) => writeRecitationState(state))

ipcMain.handle('recitation-storage:export', async () => {
  await ensureDataFile()
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出背诵数据',
    defaultPath: `recitation-data-export-${createTimestamp()}.json`,
    filters: [{ name: 'JSON 数据', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true }
  }

  const { state } = await readRecitationState()
  await fs.writeFile(result.filePath, JSON.stringify(normalizeState(state), null, 2), 'utf8')
  return { ok: true, filePath: result.filePath }
})

ipcMain.handle('recitation-storage:import', async () => {
  await ensureDataFile()
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入背诵数据',
    properties: ['openFile'],
    filters: [{ name: 'JSON 数据', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePaths?.[0]) {
    return { ok: false, canceled: true }
  }

  const importedRawValue = await fs.readFile(result.filePaths[0], 'utf8')
  const importedState = normalizeState(JSON.parse(importedRawValue))

  if (!hasRecitationContent(importedState)) {
    return { ok: false, reason: 'empty-import' }
  }

  const currentRawValue = await fs.readFile(dataFilePath, 'utf8').catch(() => null)
  const backupFilePath = currentRawValue
    ? await createBackupFromRaw(currentRawValue, 'before-import')
    : null

  await fs.writeFile(dataFilePath, JSON.stringify(importedState, null, 2), 'utf8')
  applyAppSettings(importedState.appSettings)

  return {
    ok: true,
    state: importedState,
    filePath: dataFilePath,
    importedFilePath: result.filePaths[0],
    backupFilePath,
  }
})

function getSidebarBounds(isShown) {
  const { workArea } = screen.getPrimaryDisplay()
  const width = SIDEBAR_WIDTH
  const height = Math.min(SIDEBAR_HEIGHT, workArea.height - SIDEBAR_SCREEN_MARGIN * 2)
  const y = workArea.y + Math.round((workArea.height - height) / 2)
  const shownX = workArea.x + workArea.width - width - SIDEBAR_SCREEN_MARGIN
  const hiddenX = workArea.x + workArea.width - 1

  return {
    x: isShown ? shownX : hiddenX,
    y,
    width,
    height,
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3)
}

function animateSidebar(isShown) {
  if (!sidebarWindow || sidebarWindow.isDestroyed()) return
  if (sidebarIsShown === isShown && !sidebarAnimation) return

  sidebarIsShown = isShown
  if (isShown) {
    sidebarWindow.setIgnoreMouseEvents(false)
    sidebarWindow.webContents.send('sidebar-panel:refresh')
  }

  if (sidebarAnimation) {
    clearInterval(sidebarAnimation)
    sidebarAnimation = null
  }

  const startBounds = sidebarWindow.getBounds()
  const endBounds = getSidebarBounds(isShown)
  const startedAt = Date.now()

  sidebarAnimation = setInterval(() => {
    if (!sidebarWindow || sidebarWindow.isDestroyed()) {
      clearInterval(sidebarAnimation)
      sidebarAnimation = null
      return
    }

    const progress = Math.min(1, (Date.now() - startedAt) / SIDEBAR_ANIMATION_MS)
    const eased = easeOutCubic(progress)
    const nextX = Math.round(startBounds.x + (endBounds.x - startBounds.x) * eased)

    sidebarWindow.setBounds({
      ...endBounds,
      x: nextX,
    })

    if (progress >= 1) {
      clearInterval(sidebarAnimation)
      sidebarAnimation = null
      sidebarWindow.setBounds(endBounds)
      if (!isShown) {
        sidebarWindow.setIgnoreMouseEvents(true, { forward: true })
      }
    }
  }, 1000 / 60)
}

function isPointInsideBounds(point, bounds, padding = 0) {
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  )
}

function startSidebarMouseMonitor() {
  if (sidebarMouseMonitor) return

  sidebarMouseMonitor = setInterval(() => {
    if (!sidebarWindow || sidebarWindow.isDestroyed()) return

    const point = screen.getCursorScreenPoint()
    const { workArea } = screen.getPrimaryDisplay()
    const isNearRightEdge =
      point.x >= workArea.x + workArea.width - SIDEBAR_EDGE_TRIGGER &&
      point.x <= workArea.x + workArea.width &&
      point.y >= workArea.y &&
      point.y <= workArea.y + workArea.height

    if (isNearRightEdge) {
      if (sidebarHideTimer) {
        clearTimeout(sidebarHideTimer)
        sidebarHideTimer = null
      }
      animateSidebar(true)
      return
    }

    if (!sidebarIsShown) return

    const shownBounds = getSidebarBounds(true)
    const isInsideSidebar = isPointInsideBounds(point, shownBounds, 12)

    if (isInsideSidebar) {
      if (sidebarHideTimer) {
        clearTimeout(sidebarHideTimer)
        sidebarHideTimer = null
      }
      return
    }

    if (!sidebarHideTimer) {
      sidebarHideTimer = setTimeout(() => {
        sidebarHideTimer = null
        animateSidebar(false)
      }, 260)
    }
  }, 80)
}

function stopSidebarMouseMonitor() {
  if (sidebarMouseMonitor) {
    clearInterval(sidebarMouseMonitor)
    sidebarMouseMonitor = null
  }

  if (sidebarHideTimer) {
    clearTimeout(sidebarHideTimer)
    sidebarHideTimer = null
  }
}

function loadAppRoute(window, route = '/') {
  if (isDev) {
    window.loadURL(`http://127.0.0.1:5173/#${route}`)
    return
  }

  const indexUrl = pathToFileURL(path.join(__dirname, '../dist/index.html')).toString()
  window.loadURL(`${indexUrl}#${route}`)
}

function applyAppSettings(rawSettings = EMPTY_STATE.appSettings) {
  const settings = normalizeAppSettings(rawSettings)

  app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin,
    path: process.execPath,
  })

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(settings.windowOpacity)
  }

  if (!app.isReady()) return

  if (settings.showSidebarTodayTasks) {
    if (!sidebarWindow || sidebarWindow.isDestroyed()) {
      createSidebarWindow()
    }
  } else if (sidebarWindow && !sidebarWindow.isDestroyed()) {
    sidebarWindow.close()
    stopSidebarMouseMonitor()
    sidebarIsShown = false
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: '背诵复习管理',
    backgroundColor: '#f5f7fb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  loadAppRoute(mainWindow)
  readRecitationState()
    .then(({ state }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setOpacity(normalizeAppSettings(state.appSettings).windowOpacity)
      }
    })
    .catch(() => {})

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    if (!app.isQuitting) {
      app.quit()
    }
  })
}

function createSidebarWindow() {
  sidebarWindow = new BrowserWindow({
    ...getSidebarBounds(false),
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    title: '今日任务',
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  sidebarWindow.setAlwaysOnTop(true, 'floating')
  sidebarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  sidebarWindow.setIgnoreMouseEvents(true, { forward: true })
  loadAppRoute(sidebarWindow, '/sidebar')

  sidebarWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  sidebarWindow.on('closed', () => {
    sidebarWindow = null
  })

  startSidebarMouseMonitor()
}

ipcMain.on('sidebar-panel:show', () => animateSidebar(true))
ipcMain.on('sidebar-panel:hide', () => animateSidebar(false))

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  readRecitationState()
    .then(({ state }) => {
      createWindow()
      applyAppSettings(state.appSettings)
    })
    .catch(() => {
      createWindow()
      applyAppSettings(EMPTY_STATE.appSettings)
    })

  screen.on('display-metrics-changed', () => {
    if (sidebarWindow && !sidebarWindow.isDestroyed()) {
      sidebarWindow.setBounds(getSidebarBounds(sidebarIsShown))
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      createSidebarWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
  stopSidebarMouseMonitor()
})
