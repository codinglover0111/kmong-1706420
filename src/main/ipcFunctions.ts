import { ipcMain } from 'electron'
import * as fs from 'fs'

const fsAsync = fs.promises

export function ipcsINIT(): void {
  ipcMain.on('ping', () => console.log('pong'))

  // log funtions
  ipcMain.on('log', async (_event, level: string = 'info', msg: string) => {
    console.log(`[${level.toUpperCase()}] ${msg}`)

    fs.existsSync('./logs') || fs.mkdirSync('./logs')

    const date = new Date()
    await fsAsync.appendFile(
      `./logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}.log`,
      `[${level.toUpperCase()}] ${msg}\n`
    )
  })
}
