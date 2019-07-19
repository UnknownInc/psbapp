const path = require('path');
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const isDev = require('electron-is-dev');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// if (!isDev) {
//   require('update-electron-app')({
//     repo: 'UnknownInc/psbapp',
//     updateInterval: '1 hour',
//     //logger: require('electron-log')
//   })
// }


app.setLoginItemSettings({
  openAtLogin: true,
})


try {
  if (app.dock && app.dock.hide) {
    app.dock.hide();
  } 
} catch(err){
  console.log(err);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let onlineStatusWindow;
let firstTime = true;
let refresh = false;

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
    show: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: interopScript,
    }
  });
  mainWindow.removeMenu();


  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/index.html`);
  if (process.env.NODE_ENV==='dev'){
    mainWindow.loadURL('http://localhost:3000');
  } else {
    //mainWindow.loadURL('https://psb.prod.rmcloudsoftware.com');
    mainWindow.loadURL('file://'+path.join(__dirname,'index.html'));
  }

  console.log('mainWindow: created');
  // startShowTimer(showMainWindow, 15000);
  // Open the DevTools.
  if (isDev) {
    if (BrowserWindow.getDevToolsExtensions().hasOwnProperty('devtron')) {
      require('devtron').install()
    }
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    console.log('mainWindow: closed');
    refresh=true;
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

ipcMain.on('online-status-changed', (event, status) => {
  console.log(status);
})


const showMainWindow = () => {
  console.log('SW');
  firstTime=false;
  if (mainWindow!==null) {
    console.log('mainWindow: show')
    if (refresh) {
      refresh=false;
      mainWindow.reload();
    }
  } else  {
    refresh=false;
    createWindow();
  }
  mainWindow.show();
  mainWindow.moveTop();
}

let lastInterval;
let showTimerId;
const startShowTimer = (interval) => {
  console.log('T:'+interval);
  try {
    if (showTimerId) {
      clearInterval(showTimerId);
    }
  } catch(err) {
    console.error(err);
  }

  lastInterval=interval;
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
      //showMainWindow();
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSkipTaskbar(false);
      startShowTimer(20*60000);
      break;
    case 'HasQuestions':
      //showMainWindow()
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setSkipTaskbar(true);
      startShowTimer(10*60000);
      break;
    case 'FinishedQuestions':{
        try {
          if (showTimerId) {
            clearInterval(showTimerId);
          } 
        } catch(err) {
          console.error(err);
        }

        if (mainWindow) {
          mainWindow.setAlwaysOnTop(false);
          mainWindow.setSkipTaskbar(false);
        }
        let today = new Date();
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate()+1);
        tomorrow.setHours(8,Math.trunc(Math.random()*59),0)
        let timeinms=tomorrow.getTime()-today.getTime();
        refresh=true;
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
app.on('ready', ()=>{
  createWindow();
  // setInterval(()=>{
  //   showMainWindow();
  // }, 60*60*1000)
  // globalShortcut.register('CommandOrControl+R', () => {
  //   if (mainWindow) {
  //     mainWindow.reload();
  //   }
  // })
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    //app.quit();
  }
  mainWindow=null;
  if (showTimerId===null) {
    startShowTimer(lastInterval || (10*60000));
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', (e)=>{
  e.preventDefault();
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
