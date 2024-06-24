import { JSX } from 'react'
import '@styles/customButton.scss'

const Button = (props: ButtonType): JSX.Element => {
  return (
    <>
      <div className={'button'} onClick={props.onClickFunction}>
        <div className={'text'}>{props.text}</div>
      </div>
    </>
  )
}

export default Button
