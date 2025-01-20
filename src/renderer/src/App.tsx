import { JSX } from 'react'
import { useLogger } from './hooks/useLogger'

function App(): JSX.Element {
  return (
    <>
      <button
        onClick={() => {
          useLogger({ level: 'info', msg: 'test' }).sendLog()
        }}
      >
        test
      </button>
    </>
  )
}
export default App
