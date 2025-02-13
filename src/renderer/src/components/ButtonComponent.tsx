import { useState, useEffect } from 'react'

function ButtonComponent(): JSX.Element {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const handlePuppeteerInit = (
      _event: Electron.IpcRendererEvent,
      data: { status: string }
    ): void => {
      console.log('Puppeteer 상태:', data.status)
      if (data.status === 'initialized') {
        setIsEnabled(true)
      }
    }

    window.electron.ipcRenderer.on('puppeteer-init', handlePuppeteerInit)
  }, [])

  return (
    <div>
      <button
        onClick={async () => {
          const result = await window.electron.ipcRenderer.invoke(
            'puppeteer_open_url',
            'https://new.land.naver.com/complexes/110125?ms=37.5688591,126.960627,17&a=APT:ABYG:JGC:PRE&e=RETAIL&ad=true'
          )
          console.log(result)
          window.electron.ipcRenderer.send(
            'puppeteer_api',
            'https://new.land.naver.com/api/complexes/110125/prices?complexNo=110125&tradeType=B1&year=5&areaNo=7&type=chart'
          )
        }}
        disabled={!isEnabled}
      >
        초기 실행
      </button>
    </div>
  )
}

export default ButtonComponent
