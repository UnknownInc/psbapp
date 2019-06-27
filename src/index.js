const path = require('path');
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

  const interopScript = path.join(__dirname,'interop.js');
  console.log(interopScript);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: isDev?1224:800,
    height: 700,
    useContentSize: true,
    center: true,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: interopScript,
    }
  });

  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/index.html`);
  if (process.env.NODE_ENV==='dev'){
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('https://psb.prod.rmcloudsoftware.com');
  }

  console.log('mainWindow: created');
  // startShowTimer(showMainWindow, 15000);
  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
    if (BrowserWindow.getDevToolsExtensions().hasOwnProperty('devtron')) {
      require('devtron').install()
    }
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    console.log('mainWindow: closed');
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

ipcMain.on('online-status-changed', (event, status) => {
  console.log(status)
})


const showMainWindow = () => {
  console.log('SW');
  if (mainWindow!==null) {
    mainWindow.show()
    mainWindow.moveTop();
    console.log('mainWindow: show')
  } else  {
    createWindow();
    mainWindow.show();
  }
}

let showTimerId;
const startShowTimer = (interval) => {
  console.log('T:'+interval);
  if (showTimerId) {
    clearInterval(showTimerId);
  }
  showTimerId = setInterval(()=>{
    showMainWindow();
  }, interval)
}

app.handleMessage = (event, message)=>{
  console.debug('receiving message: '+message);
  const parts = message.split(':');
  switch(parts[0]) {
    case 'Snooze':
      if (mainWindow!==null) {
        mainWindow.close();
        startShowTimer(parseInt(parts[1]||5*60000))
      }
      break;
    case 'NotLoggedIn':
      showMainWindow();
      startShowTimer(20*60000);
      break;
    case 'HasQuestions':
      showMainWindow();
      startShowTimer(10*60000);
      break;
    case 'FinishedQuestions':{
        if (showTimerId) {
          clearInterval(showTimerId);
        }
        let today = new Date();
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate()+1);
        tomorrow.setHours(8,Math.trunc(Math.random()*59),0)
        let timeinms=tomorrow.getTime()-today.getTime();
        startShowTimer(timeinms);
      }
      break;
    default:
      console.error('Unknown message', parts[0])
  }
}

ipcMain.on('webapp-message', (event, message)=>{
  app.handleMessage(event, message);
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
    //app.quit();
    
    //TODO: startShowTimer for tomorrow
    startShowTimer(10*60000);
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
