import { ipcMain } from 'electron'

export function ipcsINIT(): void {
  ipcMain.on('ping', () => console.log('pong'))

  // log funtions
  ipcMain.on('sendLog', () => console.log('sendLog'))
}
