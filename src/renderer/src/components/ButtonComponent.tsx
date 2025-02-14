import useCalculateBounds, { calculateBounds } from '@renderer/hooks/useXy'
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

  function 시군구코드추출(
    value: object
  ): Array<{ name: string; code: number; centerLat: number; centerLon: number }> {
    const codes: Array<{ name: string; code: number; centerLat: number; centerLon: number }> = []
    for (const item of value['regionList']) {
      codes.push({
        name: item.cortarName as string,
        code: item.cortarNo as number,
        centerLat: item.centerLat as number,
        centerLon: item.centerLon as number
      })
    }
    return codes
  }

  function 동코드추출(
    value: object
  ): Array<{ name: string; code: number; centerLat: number; centerLon: number }> {
    const codes: Array<{ name: string; code: number; centerLat: number; centerLon: number }> = []
    for (const item of value['regionList']) {
      codes.push({
        name: item.cortarName as string,
        code: item.cortarNo as number,
        centerLat: item.centerLat as number,
        centerLon: item.centerLon as number
      })
    }
    return codes
  }

  return (
    <div>
      <button
        onClick={async () => {
          const 동코드: Array<{
            name: string
            code: number
            centerLat: number
            centerLon: number
          }> = []

          // 인증 헤더 인터셉트
          const result = await window.electron.ipcRenderer.invoke(
            'puppeteer_open_url',
            'https://new.land.naver.com/complexes/110125?ms=37.5688591,126.960627,17&a=APT:ABYG:JGC:PRE&e=RETAIL&ad=true'
          )

          // 시,군,구 코드 추출
          const 파싱안된_시군구_코드들 = await window.electron.ipcRenderer.invoke(
            'puppeteer_api',
            'https://new.land.naver.com/api/regions/list?cortarNo=1100000000'
          )

          console.log(파싱안된_시군구_코드들)

          const 시군구_코드들 = 시군구코드추출(파싱안된_시군구_코드들)

          // 동 코드 추출
          // TODO: 동 코드를 저장하여 반복적인 api 호출을 줄일 수 있도록 개선

          for (const 시군구 of 시군구_코드들) {
            const 파싱안된_동_코드들 = await window.electron.ipcRenderer.invoke(
              'puppeteer_api',
              `https://new.land.naver.com/api/regions/list?cortarNo=${시군구.code}`
            )

            const 동_코드들 = 동코드추출(파싱안된_동_코드들)

            동코드.push(...동_코드들)
          }
          console.log(동코드)

          // 좌표값 추출
          for (const 동 of 동코드) {
            console.log(동)
            const 좌표값 = await window.electron.ipcRenderer.invoke(
              'puppeteer_api',
              `https://new.land.naver.com/api/cortars?zoom=16&centerLat=${동.centerLat}&centerLon=${동.centerLon}`
            )
            console.log(좌표값)
            // 순수 함수 calculateBounds를 사용하여 좌표 범위 계산
            const bounds = calculateBounds(좌표값['centerLat'], 좌표값['centerLon'])
            // console.log(bounds)
            break
          }
        }}
        disabled={!isEnabled}
      >
        초기 실행
      </button>
      <button
        onClick={async () => {
          const result = await window.electron.ipcRenderer.invoke('puppeteer_close')
          console.log(result)
        }}
        disabled={!isEnabled}
      >
        종료
      </button>
    </div>
  )
}

export default ButtonComponent
