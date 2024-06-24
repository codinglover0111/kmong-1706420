import Button from './components/button'
import { JSX } from 'react'
import InputFiled from './components/inputfield'
import ShowMobileState from './components/showMobileState'
function App(): JSX.Element {
  const ping = (): void => {
    console.log('ping!')
    window.electron.ipcRenderer.send('testCV')
  }
  return (
    <>
      <Button text="hello" onClickFunction={ping} />
      <InputFiled placeHolder="hello" />
      <ShowMobileState></ShowMobileState>
    </>
  )
}

export default App
