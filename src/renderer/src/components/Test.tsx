import { JSX } from 'react'
import { useLogger } from './hooks/useLogger'
import { logLevel } from './utils/types'

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
        test
      </button>
    </>
  )
}
export default TestComponent
