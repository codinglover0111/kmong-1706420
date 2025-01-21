import { ipcMain } from 'electron'
import * as fs from 'fs'

const fsAsync = fs.promises
// if i use this date in the function then it will make log file
// every 1 minute so i put it here
const date = new Date()

export function ipcsINIT(): void {
  // Ping! Pong!
  ipcMain.on('ping', () => console.log('pong'))

  // log save to file and print to console with level
  ipcMain.on('log', async (_event, level: string = 'info', msg: string) => {
    console.log(`[${level.toUpperCase()}] ${msg}`)

    fs.existsSync('./logs') || fs.mkdirSync('./logs')

    await fsAsync.appendFile(
      `./logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}.log`,
      `[${level.toUpperCase()}] ${msg}\n`
    )
  })
}
