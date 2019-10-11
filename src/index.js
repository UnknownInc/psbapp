const path = require('path');
const { app, net, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const isDev = require('electron-is-dev');
const log = require('electron-log');

const MINUTES = 60000;

const DEFAULT_SNOOZE_WAITTIME = 5 * MINUTES;

const HASQUESTIONS_WAITTIME = 15 * MINUTES;
const DEFAULT_WINDOWCLOSED_WAITTIME = 30 * MINUTES;
const NOT_LOGGEDIN_WAITTIME = 25 * MINUTES;


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}


const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    showMainWindow();
  })  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', ()=>{
    createWindow();
    refresh=true;
    startShowTimer(2*60000)
    globalShortcut.register('CommandOrControl+Alt+R', () => {
      refresh=true;
      showMainWindow(); 
    })
  });
}

require('update-electron-app')({
  repo: 'UnknownInc/psbapp',
  updateInterval: '1 hour',
  logger: log
})


app.setLoginItemSettings({
  openAtLogin: true,
})


try {
  if (app.dock && app.dock.hide) {
    app.dock.hide();
  } 
} catch(err){
  log.error('Unable to hide the dock', err);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let onlineStatusWindow;
let firstTime = true;
let refresh = false;

const createWindow = () => {

  log.info('PSB app version: '+app.getVersion());
  if (onlineStatusWindow===null) {
    onlineStatusWindow = new BrowserWindow({ width: 0, height: 0, show: false })
    onlineStatusWindow.loadURL(`file://${__dirname}/online-status.html`)
  }

  const interopScript = path.join(__dirname,'interop.js');
  log.debug(interopScript);
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
  mainWindow.loadURL('file://'+path.join(__dirname,'index.html'));

  log.debug('mainWindow: created');
  // startShowTimer(showMainWindow, 15000);
  // Open the DevTools.
  if (isDev) {
    if (BrowserWindow.getDevToolsExtensions().hasOwnProperty('devtron')) {
      require('devtron').install()
    }
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    log.debug('mainWindow: closed');
    refresh=true;
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow=null;
    if (showTimerId===null) {
      startShowTimer(lastInterval || (DEFAULT_WINDOWCLOSED_WAITTIME));
    }
  });
};

ipcMain.on('online-status-changed', (event, status) => {
  log.debug(`online-status-changed: ${status}`);
})


const showMainWindow = () => {
  const request = net.request('https://psb.prod.rmcloudsoftware.com/ping');
  request.on('response', (response) => {
    log.debug(`PINGSTATUS: ${response.statusCode}`)
    // log.debug(`HEADERS: ${JSON.stringify(response.headers)}`)
    response.on('data', (chunk) => {
      log.debug(`PINGBODY: ${chunk}`)
      firstTime=false;
      if (mainWindow!==null) {
        if (refresh) {
          log.debug('mainWindow: refresh')
          refresh=false;
          mainWindow.reload();
        }
      } else  {
        refresh=false;
        createWindow();
      }
      log.debug('mainWindow: show')
      mainWindow.show();
      mainWindow.moveTop();
    })

    response.on('end', () => {
      log.debug('No more data in response.')
    })
  });

  request.on('error', (response) => {
    log.error('ping error');
    app.handleMessage(null, 'Snooze')
  });

  request.end();
}

let lastInterval;
let showTimerId;
const startShowTimer = (interval) => {
  log.debug('T:'+interval);
  try {
    if (showTimerId) {
      clearInterval(showTimerId);
    }
  } catch(err) {
    log.error(err);
  }

  lastInterval=interval;
  showTimerId = setInterval(()=>{
    showMainWindow();
  }, interval)
}

app.handleMessage = (event, message)=>{
  log.debug('receiving message: '+message);
  const parts = message.split(':');
  switch(parts[0]) {
    case 'Snooze':
      if (mainWindow!==null) {
        mainWindow.close();
        refresh=true;
      }
      startShowTimer(parseInt(parts[1]||DEFAULT_SNOOZE_WAITTIME))
      break;
    case 'NotLoggedIn':
      //showMainWindow();
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSkipTaskbar(false);
      refresh=true;
      startShowTimer(NOT_LOGGEDIN_WAITTIME);
      break;
    case 'HasQuestions':
      //showMainWindow()
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setSkipTaskbar(true);
      refresh=true;
      startShowTimer(HASQUESTIONS_WAITTIME);
      break;
    case 'FinishedQuestions':{
        try {
          if (showTimerId) {
            clearInterval(showTimerId);
          } 
        } catch(err) {
          log.error(err);
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
        //startShowTimer(timeinms);
        setTimeout(()=>{
          showMainWindow();
        }, timeinms);
      }
      break;
    default:
      log.error('Unknown message', parts[0])
  }
}

ipcMain.on('webapp-message', (event, message)=>{
  app.handleMessage(event, message);
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  log.debug('Lastwindow closed');
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    //app.quit();
  }
  mainWindow=null;
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


app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('CommandOrControl+Alt+R')

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
