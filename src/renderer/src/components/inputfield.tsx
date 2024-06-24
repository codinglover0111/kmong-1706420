import { JSX, useState } from 'react'
import '@styles/inputfield.scss'
// TODO: make InputFiled type
const InputFiled = (props: InputFiled): JSX.Element => {
  const [text, setText] = useState('')
  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setText(event.target.value)
  }
  return (
    <>
      <input className="input" placeholder={props.placeHolder} onChange={onChange} value={text} />
    </>
  )
}

export default InputFiled
