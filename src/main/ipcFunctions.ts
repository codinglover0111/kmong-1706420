import { ipcMain } from 'electron'

import { PuppeteerInstanceType } from './puppeteerUtils'
import { logLevel } from '@/renderer/src/types/logType'
import { logger } from './utils/logger'

import * as fs from 'fs'
const fsAsync = fs.promises

export function ipcsINIT(puppeteerInstance: PuppeteerInstanceType): void {
  // Ping! Pong!
  ipcMain.on('ping', () => console.log('pong'))

  // log save to file and print to console with level
  ipcMain.on('log', async (_event, level: logLevel = 'info', msg: string) => {
    await logger(level, msg)
  })

  // puppeteer test
  ipcMain.handle('puppeteer_open_url', async (_event, url: string) => {
    await puppeteerInstance.getPage(url, { show: false })
    return 'done'
  })
  ipcMain.handle('puppeteer_close', () => {
    return puppeteerInstance.close()
  })

  // TODO: 값을 불러와서 파싱할 수 있어야함
  ipcMain.handle('puppeteer_api', async (_event, url: string) => {
    return await puppeteerInstance.fetchRestrictedAPI(url)
  })

  ipcMain.handle('save_file', async (_event, filePath: string, data: string) => {
    await fsAsync.writeFile(filePath, data)
    return 'done'
  })

  ipcMain.handle('load_file', async (_event, filePath: string) => {
    return await fsAsync
      .readFile(filePath, 'utf-8')
      .then((data) => data)
      .catch((err) => {
        console.error(err)
        return ''
      })
  })
}
