// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain } from "electron"
import * as path from "path"
import electronReload from "electron-reload"

// Enable electron-reload in development
if (process.env.NODE_ENV === "development") {
  electronReload(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  })
}

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1"

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Enable integration with Node.js
      enableRemoteModule: true, // Enable the remote module
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on("async", (event, arg) => {
  // Print 1
  console.log(arg)
  // Reply on async message from renderer process
  event.sender.send("async-reply", 2)
})
