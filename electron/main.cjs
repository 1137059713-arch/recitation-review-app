const { app, BrowserWindow, Menu, ipcMain, screen, shell } = require('electron')
const fs = require('fs/promises')
const path = require('path')
const { pathToFileURL } = require('url')

const isDev = !app.isPackaged
const appRoot = isDev ? app.getAppPath() : path.resolve(path.dirname(process.execPath), '..', '..')
const dataDirectory = path.join(appRoot, 'data')
const dataFilePath = path.join(dataDirectory, 'recitation-data.json')
const SIDEBAR_WIDTH = 360
const SIDEBAR_TRIGGER_WIDTH = 10
const SIDEBAR_SCREEN_MARGIN = 14
const SIDEBAR_ANIMATION_MS = 220

let mainWindow = null
let sidebarWindow = null
let sidebarAnimation = null
let sidebarIsShown = false

const EMPTY_STATE = {
  items: [],
  tasks: [],
  groups: [],
  scheduleSettings: {
    restDays: [0],
  },
}

function normalizeScheduleSettings(settings) {
  const restDays = Array.isArray(settings?.restDays)
    ? [...new Set(settings.restDays.map(Number))]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b)
    : EMPTY_STATE.scheduleSettings.restDays

  return {
    restDays: [restDays[0] ?? EMPTY_STATE.scheduleSettings.restDays[0]],
  }
}

function normalizeState(value) {
  return {
    items: Array.isArray(value?.items) ? value.items : [],
    tasks: Array.isArray(value?.tasks) ? value.tasks : [],
    groups: Array.isArray(value?.groups) ? value.groups : [],
    scheduleSettings: normalizeScheduleSettings(value?.scheduleSettings),
  }
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
  await fs.writeFile(dataFilePath, JSON.stringify(normalizeState(state), null, 2), 'utf8')
  return {
    ok: true,
    filePath: dataFilePath,
  }
}

ipcMain.handle('recitation-storage:load', readRecitationState)
ipcMain.handle('recitation-storage:save', (_event, state) => writeRecitationState(state))

function getSidebarBounds(isShown) {
  const { workArea } = screen.getPrimaryDisplay()
  const width = SIDEBAR_WIDTH
  const height = Math.max(520, workArea.height - SIDEBAR_SCREEN_MARGIN * 2)
  const y = workArea.y + SIDEBAR_SCREEN_MARGIN
  const shownX = workArea.x + workArea.width - width - SIDEBAR_SCREEN_MARGIN
  const hiddenX = workArea.x + workArea.width - SIDEBAR_TRIGGER_WIDTH

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

  sidebarIsShown = isShown

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
    }
  }, 1000 / 60)
}

function loadAppRoute(window, route = '/') {
  if (isDev) {
    window.loadURL(`http://127.0.0.1:5173/#${route}`)
    return
  }

  const indexUrl = pathToFileURL(path.join(__dirname, '../dist/index.html')).toString()
  window.loadURL(`${indexUrl}#${route}`)
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
  loadAppRoute(sidebarWindow, '/sidebar')

  sidebarWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  sidebarWindow.on('closed', () => {
    sidebarWindow = null
  })
}

ipcMain.on('sidebar-panel:show', () => animateSidebar(true))
ipcMain.on('sidebar-panel:hide', () => animateSidebar(false))

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  createSidebarWindow()

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
})
