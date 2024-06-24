import { JSX } from 'react'
import smartPhone from '@assets/phone.png'
import '@styles/showMobileState.scss'

const ShowMobileState = (): JSX.Element => {
  return (
    <>
      <div className="StausIcon">
        <img src={smartPhone} className={'magicon'} />
        <div className={'text-'}>상태</div>
      </div>
    </>
  )
}

export default ShowMobileState
