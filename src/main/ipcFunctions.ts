import { ipcMain } from 'electron'

import { PuppeteerInstanceType } from './puppeteerUtils'
import { logLevel } from '@/renderer/src/types/logType'
import { logger } from './utils/logger'

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
  ipcMain.on('puppeteer_api', async (_event, url: string) => {
    await puppeteerInstance.fetchRestrictedAPI(url)
  })
}
