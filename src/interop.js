// ==============
// Preload interop script
// https://slack.engineering/interops-labyrinth-sharing-code-between-web-electron-apps-f9474d62eccc
// ==============
const {remote} = require('electron');
const { ipcRenderer } = require('electron')

window.interop = {
  status:{},
  sendMessage(message) {
    console.debug('sending message: '+message);
    ipcRenderer.send('webapp-message', message);
  },
  setBadgeCount(count) {
    return remote.app.setBadgeCount(count);
  }
};