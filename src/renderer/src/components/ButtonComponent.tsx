function ButtonComponent(): JSX.Element {
  return (
    <>
      <div>
        <button
          onClick={() => {
            window.electron.ipcRenderer.send(
              'puppeteer',
              'https://new.land.naver.com/complexes/110125?ms=37.5688591,126.960627,17&a=APT:ABYG:JGC:PRE&e=RETAIL&ad=true'
            )
          }}
        >
          초기 실행
        </button>
        <button
          onClick={() => {
            window.electron.ipcRenderer.send(
              'puppeteer_api',
              'https://new.land.naver.com/api/complexes/110125/prices?complexNo=110125&tradeType=B1&year=5&areaNo=7&type=chart'
            )
          }}
        >
          이후 실행
        </button>
      </div>
    </>
  )
}

export default ButtonComponent
