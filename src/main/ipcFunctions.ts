import { ipcMain } from 'electron'

export function ipcsINIT(): void {
  ipcMain.on('ping', () => console.log('pong'))

  // log funtions
  ipcMain.on('log', (_event, level: string = 'info', msg: string) => {
    console.log(`[${level.toUpperCase()}] ${msg}`)
  })
}
