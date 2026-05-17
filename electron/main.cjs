const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const fs = require('fs/promises')
const path = require('path')

const isDev = !app.isPackaged
const appRoot = isDev ? app.getAppPath() : path.resolve(path.dirname(process.execPath), '..', '..')
const dataDirectory = path.join(appRoot, 'data')
const dataFilePath = path.join(dataDirectory, 'recitation-data.json')

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

function createWindow() {
  const mainWindow = new BrowserWindow({
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

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
