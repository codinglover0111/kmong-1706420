import type { logLevel } from '@renderer/src/types/logType'
import * as fs from 'fs'
const fsAsync = fs.promises

// if i use this date in the function then it will make log file
// every 1 minute so i put it here
const date = new Date()

export async function logger(level: logLevel, msg: string): Promise<void> {
  fs.existsSync('./logs') || fs.mkdirSync('./logs')
  // log line time
  const time = new Date()
  const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`

  console.log(`[${formattedTime}] [${level.toUpperCase()}] ${msg}\n`)
  await fsAsync.appendFile(
    `./logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}.log`,
    `[${formattedTime}] [${level.toUpperCase()}] ${msg}\n`
  )
}
