import { BrowserWindow, ipcRenderer } from 'electron'
import { electron } from 'process'
import { Browser } from 'puppeteer-core'
import pie from 'puppeteer-in-electron'
import { logger } from './utils/logger'

// const main = async (
//   app: Electron.App,
//   puppeteer: typeof import('puppeteer-core')
// ): Promise<void> => {
//   await pie.initialize(app)
//   const browser = await pie.connect(app, puppeteer)

//   //   const window = new BrowserWindow()
//   //   const url = 'https://naver.com/'
//   //   await window.loadURL(url)

//   //   const page = await pie.getPage(browser, window)
//   //   console.log(page.url())
//   //   setTimeout(() => {
//   //     window.destroy()
//   //   }, 3000)
// }
// type
export interface puppeteerInstanceType {
  init: () => Promise<void>
  getPage: (url: string) => Promise<void>
  close: () => string
}

// export default main
export class PuppeteerUtils {
  app: Electron.App
  puppeteer: typeof import('puppeteer-core')
  browser: Browser | undefined
  window: BrowserWindow | undefined
  opendWindow: boolean

  // constructor
  constructor(app: Electron.App, puppeteer: typeof import('puppeteer-core')) {
    this.app = app
    this.puppeteer = puppeteer
    this.opendWindow = false
  }

  // puppeteer initialization
  async init(): Promise<void> {
    try {
      logger('info', 'puppeteer is initializing...')

      await pie.initialize(this.app)
      this.browser = await pie.connect(this.app, this.puppeteer)

      logger('info', 'puppeteer is initialized')
    } catch (e: unknown) {
      console.error(e)
      logger('error', e as string)
    }
  }

  // get page
  async getPage(url: string): Promise<void> {
    logger('info', 'puppeteer is getting page...')
    logger('info', `url: ${url}`)
    this.window = new BrowserWindow()
    this.opendWindow = true
    //   check if browser and window are not null
    if (!this.browser || !this.window) return

    await this.window.loadURL(url)
    const page = await pie.getPage(this.browser, this.window)
    console.log(page.url())
  }

  close(): string {
    if (this.window) {
      this.window.destroy()
      this.opendWindow = false
      logger('info', 'puppeteer window is destroyed')
      return 'closed puppeteer'
    } else {
      logger('error', 'puppeteer is Not defined')
      return 'cannot found puppeteer window'
    }
  }
}
