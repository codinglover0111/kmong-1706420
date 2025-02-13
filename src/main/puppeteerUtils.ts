import { BrowserWindow } from 'electron'
import { Browser, Page, HTTPRequest, HTTPResponse } from 'puppeteer-core'
import pie from 'puppeteer-in-electron'
import { logger } from './utils/logger'

// Puppeteer 인스턴스의 타입 정의
export interface PuppeteerInstanceType {
  init: () => Promise<void>
  getPage: (url: string, windowOptions?: Electron.BrowserWindowConstructorOptions) => Promise<void>
  fetchRestrictedAPI: (apiUrl: string) => Promise<object | void>
  close: () => string
  reload: () => Promise<void>
  page: Page | undefined
}

// PuppeteerUtils 클래스
export class PuppeteerUtils implements PuppeteerInstanceType {
  app: Electron.App
  puppeteer: typeof import('puppeteer-core')
  browser: Browser | undefined
  window: BrowserWindow | undefined
  public page: Page | undefined
  private authHeader: string | null = null

  constructor(app: Electron.App, puppeteer: typeof import('puppeteer-core')) {
    this.app = app
    this.puppeteer = puppeteer
  }

  async init(): Promise<void> {
    try {
      logger('info', 'puppeteer 초기화 시작...')
      await pie.initialize(this.app, 9898)
      this.browser = await pie.connect(this.app, this.puppeteer)
      logger('info', 'puppeteer 초기화 완료')
    } catch (e: unknown) {
      console.error(e)
      logger('error', String(e))
    }
  }

  async getPage(
    url: string,
    windowOptions?: Electron.BrowserWindowConstructorOptions
  ): Promise<void> {
    logger('info', `페이지 로딩: ${url}`)
    this.window = new BrowserWindow(windowOptions)
    if (!this.browser || !this.window) return

    await this.window.loadURL(url)
    this.page = await pie.getPage(this.browser, this.window)

    await this.page.setRequestInterception(true)

    // 요청 인터셉터: 인증 헤더 추출
    this.page.on('request', async (request: HTTPRequest) => {
      if (request.url().includes('new.land.naver.com/api/')) {
        const headers = request.headers()
        if (headers.authorization) {
          this.authHeader = headers.authorization
          logger('info', `인증 헤더 저장됨: ${this.authHeader}`)
          console.log(`인증 헤더 저장됨: ${this.authHeader}`)
        }
      }
      request.continue()
    })

    // 응답 인터셉터: API 응답 로깅
    this.page.on('response', async (response: HTTPResponse) => {
      if (response.url().includes('new.land.naver.com/api')) {
        logger('info', `API 응답 상태: ${response.status()} - ${response.url()}`)
      }
    })

    logger('info', `페이지 로딩 완료: ${this.page.url()}`)
    await this.reload()
  }

  async reload(): Promise<void> {
    await this.page?.reload()
  }

  async fetchRestrictedAPI(apiUrl: string): Promise<object | void> {
    if (!this.page || !this.authHeader) {
      logger('error', '페이지가 열려 있지 않거나 인증 헤더가 없습니다.')
      return
    }

    logger('info', `API 요청: ${apiUrl}`)

    try {
      const response = await this.page.evaluate(
        async (url: string, auth: string) => {
          const res = await fetch(url, {
            headers: {
              Authorization: auth,
              'User-Agent': navigator.userAgent
            }
          })
          return res.json()
        },
        apiUrl,
        this.authHeader
      )

      // logger('info', `API 응답 데이터: ${JSON.stringify(response)}`)
      console.log(`API 응답 데이터: ${JSON.stringify(response)}`)
      console.log(`API 응답 성공`)
      return response
    } catch (error) {
      logger('error', `API 요청 실패: ${String(error)}`)
      return
    }
  }

  close(): string {
    if (this.window) {
      this.window.destroy()
      logger('info', 'puppeteer 창이 종료되었습니다.')
      return 'closed puppeteer'
    } else {
      logger('error', 'puppeteer 창이 정의되어 있지 않습니다.')
      return 'cannot found puppeteer window'
    }
  }
}
