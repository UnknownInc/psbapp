const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

if (!isDev) {
  require('update-electron-app')({
    repo: 'UnknownInc/psbapp',
    updateInterval: '1 hour',
    //logger: require('electron-log')
  })
}

app.setLoginItemSettings({
  openAtLogin: true,
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let onlineStatusWindow;

const createWindow = () => {

  if (onlineStatusWindow===null) {
    onlineStatusWindow = new BrowserWindow({ width: 0, height: 0, show: false })
    onlineStatusWindow.loadURL(`file://${__dirname}/online-status.html`)
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
  });

  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.loadURL('https://psb.prod.rmcloudsoftware.com');

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

ipcMain.on('online-status-changed', (event, status) => {
  console.log(status)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
