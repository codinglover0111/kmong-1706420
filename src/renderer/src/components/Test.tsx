import { JSX } from 'react'
import { useLogger } from '@renderer/hooks/useLogger'
import { logLevel } from '@renderer/types/logType'

function TestComponent(): JSX.Element {
  return (
    <>
      <button
        onClick={() => {
          // 랜덤 레벨 더미 값
          const random = Math.floor(Math.random() * 5)
          const levels: logLevel[] = ['error', 'warn', 'info', 'debug', 'trace']
          const level: logLevel = levels[random]
          useLogger({ level, msg: level as string }).sendLog()
        }}
      >
        Send Log
      </button>
      <button
        onClick={() => {
          useLogger({ level: 'info', msg: 'request excute puppeteer' }).sendLog()
          window.electron.ipcRenderer.send('puppeteer', 'https://naver.com')
        }}
      >
        puppeteer test
      </button>
      <button
        onClick={async () => {
          const result = await window.electron.ipcRenderer.invoke('puppeteer_close')
          useLogger({ level: 'info', msg: result }).sendLog()
          console.log(result)
        }}
      >
        puppeteer close
      </button>
    </>
  )
}
export default TestComponent
