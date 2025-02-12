import { ipcMain } from 'electron'

import { PuppeteerInstanceType } from './puppeteerUtils'
import { logLevel } from '@/renderer/src/types/logType'
import { logger } from './utils/logger'
import * as XLSX from 'xlsx/xlsx.mjs'

export function ipcsINIT(puppeteerInstance: PuppeteerInstanceType): void {
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

  // TODO: 값을 불러와서 파싱할 수 있어야함
  ipcMain.on('puppeteer_api', async (_event, url: string) => {
    const puppeteerUtils = puppeteerInstance
    await puppeteerUtils.fetchRestrictedAPI(url)
  })
}
