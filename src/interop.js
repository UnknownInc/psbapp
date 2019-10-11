// ==============
// Preload interop script
// https://slack.engineering/interops-labyrinth-sharing-code-between-web-electron-apps-f9474d62eccc
// ==============
const { remote, ipcRenderer } = require('electron')

window.interop = {
  //appVersion: app.getVersion(),
  status:{},
  sendMessage(message) {
    console.debug('sending message: '+message);
    ipcRenderer.send('webapp-message', message);
  },
  setBadgeCount(count) {
    return remote.app.setBadgeCount(count);
  }
};