import { ipcMain } from 'electron'

import { puppeteerInstanceType } from './puppeteerUtils'
import { logLevel } from '@/renderer/src/types/logType'
import { logger } from './utils/logger'

export function ipcsINIT(puppeteerInstance: puppeteerInstanceType): void {
  // Ping! Pong!
  ipcMain.on('ping', () => console.log('pong'))

  // log save to file and print to console with level
  ipcMain.on('log', async (_event, level: logLevel = 'info', msg: string) => {
    logger(level, msg)
  })

  // puppeteer test
  ipcMain.on('puppeteer', async (_event, url: string) => {
    const puppeteerUtils = puppeteerInstance
    await puppeteerUtils.getPage(url)
  })
  ipcMain.handle('puppeteer_close', () => {
    const puppeteerUtils = puppeteerInstance
    return puppeteerUtils.close()
  })
}
