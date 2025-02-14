import useCalculateBounds, { calculateBounds } from '@renderer/hooks/useXy'
import { read, utils, writeFile, Table2BookOpts } from 'xlsx'
import { useState, useEffect, useRef } from 'react'
import { XlsxType } from '@renderer/types/xlsxType'

function ButtonComponent(): JSX.Element {
  const [isEnabled, setIsEnabled] = useState(false)
  const [apartmentList, setApartmentList] = useState<
    { name: string; code: number; dong: string }[]
  >([])
  const [아파트_정보, set아파트_정보] = useState<XlsxType[]>([])
  const [prgressPercent, setProgressPercent] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  // "아파트 목록 추출" 작업이 진행 중임을 나타내는 상태
  const [isExtracting, setIsExtracting] = useState(false)
  // 작업 중지 요청을 감지할 수 있도록 ref 사용
  const extractionCancelledRef = useRef(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const [aptParsingProgress, setApartmentParsingProgress] = useState(0)
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
          // 작업 시작시 작업 중지 요청 플래그 초기화와 진행 상태 활성화
          extractionCancelledRef.current = false
          setIsExtracting(true)

          const dongCodes: Array<{
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
          const rawCityDistrictCodes = await window.electron.ipcRenderer.invoke(
            'puppeteer_api',
            'https://new.land.naver.com/api/regions/list?cortarNo=1100000000'
          )

          const cityDistrictCodes = 시군구코드추출(rawCityDistrictCodes)

          // 동 코드 추출
          // TODO: 동 코드를 저장하여 반복적인 api 호출을 줄일 수 있도록 개선
          for (const cityDistrict of cityDistrictCodes) {
            if (extractionCancelledRef.current) {
              console.log('작업 중지 요청 확인 - 시,군,구 코드 추출 중단')
              break
            }
            const rawDongCodes = await window.electron.ipcRenderer.invoke(
              'puppeteer_api',
              `https://new.land.naver.com/api/regions/list?cortarNo=${cityDistrict.code}`
            )

            const parsedDongCodes = 동코드추출(rawDongCodes)
            dongCodes.push(...parsedDongCodes)
          }

          // 테스트용: 동 코드를 하나씩 추출하여 아파트 목록 파싱
          const aggregatedComplexList: Array<{
            cortarAddress: string
            complexName: string
            complexNo: number
            totalHouseholdCount: number
            realEstateTypeCode: string
          }> = []
          let index = 0
          for (const dong of dongCodes) {
            if (extractionCancelledRef.current) {
              console.log('작업 중지 요청 확인 - 아파트 목록 파싱 중단')
              break
            }
            const response = await window.electron.ipcRenderer.invoke(
              'puppeteer_api',
              `https://new.land.naver.com/api/regions/complexes?cortarNo=${dong.code}`
            )
            console.log(response)
            if (response) {
              aggregatedComplexList.push(...response['complexList'])

              setProgressPercent(Math.round((index / dongCodes.length) * 100))
              index++
              if (index === 99) {
                setProgressPercent(100)
              }
            }

            if (index % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
            // break // 테스트용
          }
          console.log('끝')
          let 출력용_데이터: Array<{ name: string; dong: string; code: number }> = []
          // 작업 중지가 발생하지 않았을 때만 결과를 처리
          if (!extractionCancelledRef.current) {
            출력용_데이터 = aggregatedComplexList
              // 200가구 이상 필터링
              .filter((item) => item.totalHouseholdCount >= 200)
              .filter((item) => item.realEstateTypeCode === 'APT')
              .filter(
                (item) =>
                  !item.complexName.includes('주상복합') && !item.complexName.includes('도시형')
              )
              .map((item) => ({
                name: item.complexName,
                dong: item.cortarAddress,
                code: item.complexNo
              }))
              .sort((a, b) => a.name.localeCompare(b.name))

            setApartmentList(출력용_데이터)
            setTotalCount(출력용_데이터.length)
          }
          // 아파트 정보 파싱
          if (!extractionCancelledRef.current) {
            let aptParsingIndex = 0 // 아파트 파싱 진행률 계산용 변수 추가
            // https://new.land.naver.com/api/complexes/3392?sameAddressGroup=true
            for (const item of 출력용_데이터) {
              const response = await window.electron.ipcRenderer.invoke(
                'puppeteer_api',
                `https://new.land.naver.com/api/complexes/${item.code}?sameAddressGroup=true`
              )
              const price_response = await window.electron.ipcRenderer.invoke(
                'puppeteer_api',
                `https://new.land.naver.com/api/complexes/${item.code}/prices?complexNo=${item.code}&tradeType=A1&year=5&priceChartChange=false&areaNo=3&type=chart`
              )
              console.log(price_response)
              // console.log(response)
              const 아파트: Array<XlsxType> = []
              if (response && response.complexDetail && response.complexPyeongDetailList) {
                const detail = response.complexDetail
                const addressParts = detail.address ? detail.address.split(' ') : ['', '', '']
                const 시 = addressParts[0] ? addressParts[0].replace('시', '') : ''
                const 구 = addressParts[1] ? addressParts[1].replace('구', '') : ''
                const 동 = addressParts[2] ? addressParts[2].replace('동', '') : ''
                const 사용승인연도 = detail.useApproveYmd
                  ? Number(detail.useApproveYmd.slice(0, 4))
                  : 0
                const 연식 = new Date().getFullYear() - 사용승인연도

                response.complexPyeongDetailList.forEach((pyeong: any) => {
                  // pyeongName2를 평형으로 사용. 숫자 외 문자가 있을 경우 숫자 부분만 추출
                  const 평형 = parseFloat(pyeong.pyeongName2) || 0
                  아파트.push({
                    시,
                    구,
                    동,
                    아파트명: detail.complexName || '',
                    사용승인연도,
                    연식,
                    전체세대수: detail.totalHouseholdCount ? Number(detail.totalHouseholdCount) : 0,
                    총동수: detail.totalDongCount ? Number(detail.totalDongCount) : 0,
                    공급면적: pyeong.supplyAreaDouble ? Number(pyeong.supplyAreaDouble) : 0,
                    해당면적세대수: pyeong.householdCountByPyeong
                      ? Number(pyeong.householdCountByPyeong)
                      : 0,
                    평형,
                    전용면적: pyeong.exclusiveArea ? Number(pyeong.exclusiveArea) : 0,
                    현관구조: pyeong.entranceType || '',
                    방수: pyeong.roomCnt ? Number(pyeong.roomCnt) : 0,
                    욕실수: pyeong.bathroomCnt ? Number(pyeong.bathroomCnt) : 0,
                    주차대수: detail.parkingPossibleCount ? Number(detail.parkingPossibleCount) : 0,
                    세대당주차대수: detail.parkingCountByHousehold
                      ? Number(detail.parkingCountByHousehold)
                      : 0,
                    ...(() => {
                      // 실거래 데이터 처리
                      let 매매, 전고, 전저
                      const realDates = price_response.realPriceDataXList.slice(1)
                      const realPrices = price_response.realPriceDataYList
                        .slice(1)
                        .map((p) => Number(p))
                      const realFiltered = realDates
                        .map((date, index) => ({ date, price: realPrices[index] }))
                        .filter((item) => new Date(item.date) >= new Date('2021-01-01'))

                      if (realFiltered.length > 0) {
                        매매 = realFiltered[realFiltered.length - 1].price
                        전고 = Math.max(...realFiltered.map((item) => item.price))
                        전저 = Math.min(...realFiltered.map((item) => item.price))
                      } else {
                        // fallback: marketPrice 데이터 사용
                        const marketDates = price_response.marketPriceXList.slice(1)
                        const marketAreas = price_response.marketPriceAreaList.slice(1)
                        const fallbackData = marketDates
                          .map((date, index) => {
                            const area = marketAreas[index]
                            return { date, high: area?.high, low: area?.low }
                          })
                          .filter((item) => new Date(item.date) >= new Date('2021-01-01'))

                        if (fallbackData.length > 0) {
                          전고 = Math.max(...fallbackData.map((item) => item.high))
                          전저 = Math.min(...fallbackData.map((item) => item.low))
                          매매 = '-' // 실거래가 없으므로 매매값은 fallback 없음
                        } else {
                          매매 = 전고 = 전저 = '-'
                        }
                      }

                      // 퍼센트 및 기준가 계산
                      let 최대하락률, 상승률, 하락률, 기준가_15, 기준가_20, 기준가_25
                      let 기준여부_15, 기준여부_20, 기준여부_25
                      if (typeof 매매 === 'number' && 전고 > 0 && 전저 > 0) {
                        최대하락률 = (((전고 - 매매) / 전고) * 100).toFixed(2) + '%'
                        상승률 = (((매매 - 전저) / 전저) * 100).toFixed(2) + '%'
                        하락률 = (((전고 - 매매) / 전고) * 100).toFixed(2) + '%'
                        기준가_15 = Math.floor(전고 * 0.85)
                        기준가_20 = Math.floor(전고 * 0.8)
                        기준가_25 = Math.floor(전고 * 0.75)
                        기준여부_15 = 기준가_15 > 0 && 매매 > 기준가_15 * 1.15 ? 'N' : 'Y'
                        기준여부_20 = 기준가_20 > 0 && 매매 > 기준가_20 * 1.15 ? 'N' : 'Y'
                        기준여부_25 = 기준가_25 > 0 && 매매 > 기준가_25 * 1.15 ? 'N' : 'Y'
                      } else {
                        최대하락률 = 상승률 = 하락률 = '-'
                        기준가_15 = 기준가_20 = 기준가_25 = '-'
                        기준여부_15 = 기준여부_20 = 기준여부_25 = '-'
                      }

                      return {
                        매매,
                        전고점: 전고,
                        전저점: 전저,
                        최대하락률,
                        상승률,
                        하락률,
                        기준가_15,
                        기준가_20,
                        기준가_25,
                        기준여부_15,
                        기준여부_20,
                        기준여부_25
                      }
                    })()
                  })
                })
                // Deduplicate based on 시-구-동-아파트명-평형-전용면적-현관구조
              }
              const unique아파트 = Array.from(
                new Map(
                  아파트.map((apt) => [
                    `${apt.시}-${apt.구}-${apt.동}-${apt.아파트명}-${apt.평형}-${apt.전용면적}-${apt.현관구조}`,
                    apt
                  ])
                ).values()
              )
              set아파트_정보((prev) => [...prev, ...unique아파트])
              console.log(unique아파트)
              aptParsingIndex++
              // 아파트 파싱 진행률 업데이트 (setApartmentParsingProgress가 이미 정의되어 있다고 가정)
              setApartmentParsingProgress(
                Math.round((aptParsingIndex / 출력용_데이터.length) * 100)
              )
            }
          }
        }}
        disabled={!isEnabled || isExtracting}
      >
        아파트 목록 추출
      </button>
      <button
        onClick={async () => {
          // 작업 중지 요청
          extractionCancelledRef.current = true
          const result = await window.electron.ipcRenderer.invoke('puppeteer_close')
          console.log(result)
          setApartmentList([])
          setProgressPercent(0)
          setIsExtracting(false)
          setTotalCount(0)
          setApartmentParsingProgress(0)
        }}
        disabled={!isExtracting}
      >
        종료
      </button>
      <p>현재 진행 상황 : {prgressPercent}%</p>
      <p>아파트 파싱 진행 상황 : {aptParsingProgress}%</p>
      <p>총 개수 : {totalCount}개</p>
      <button
        onClick={() => {
          if (tableRef.current) {
            const wb = utils.table_to_book(tableRef.current)
            const now = new Date()
            const fileName = `부동산_크롤링_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}.xlsx`
            writeFile(wb, fileName)
          }
        }}
      >
        xlsx 추출
      </button>
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          overflowX: 'auto',
          border: '1px solid #D1D5DB',
          padding: '8px'
        }}
      >
        <table ref={tableRef}>
          <thead>
            <tr>
              <th>시</th>
              <th>구</th>
              <th>동</th>
              <th>아파트명</th>
              <th>사용승인 연도</th>
              <th>연식</th>
              <th>전체 세대수</th>
              <th>총 동수</th>
              <th>공급 면적</th>
              <th>해당면적 세대수</th>
              <th>평형</th>
              <th>전용 면적</th>
              <th>현관구조</th>
              <th>방수</th>
              <th>욕실수</th>
              <th>주차대수</th>
              <th>세대당 주차대수</th>
              <th>매매</th>
              <th>전고점</th>
              <th>전저점</th>
              <th>최대 하락률</th>
              <th>상승률</th>
              <th>하락률</th>
              <th>기준가 (-15%)</th>
              <th>기준가 (-20%)</th>
              <th>기준가 (-25%)</th>
              <th>기준여부 (-15%)</th>
              <th>기준여부 (-20%)</th>
              <th>기준여부 (-25%)</th>
            </tr>
          </thead>
          <tbody>
            {아파트_정보.map((item) => {
              return (
                <tr
                  key={`${item.시}-${item.구}-${item.동}-${item.아파트명}-${item.평형}-${item.전용면적}-${item.현관구조}`}
                >
                  <td>{item.시}</td>
                  <td>{item.구}</td>
                  <td>{item.동}동</td>
                  <td>{item.아파트명}</td>
                  <td>{item.사용승인연도}</td>
                  <td>{item.연식}</td>
                  <td>{item.전체세대수}</td>
                  <td>{item.총동수}</td>
                  <td>{item.공급면적}</td>
                  <td>{item.해당면적세대수}</td>
                  <td>{item.평형}</td>
                  <td>{item.전용면적}</td>
                  <td>{item.현관구조}</td>
                  <td>{item.방수}</td>
                  <td>{item.욕실수}</td>
                  <td>{item.주차대수}</td>
                  <td>{item.세대당주차대수}</td>
                  <td>{item.매매}</td>
                  <td>{item.전고점}</td>
                  <td>{item.전저점}</td>
                  <td>{item.최대하락률}</td>
                  <td>{item.상승률}</td>
                  <td>{item.하락률}</td>
                  <td>{item.기준가_15}</td>
                  <td>{item.기준가_20}</td>
                  <td>{item.기준가_25}</td>
                  <td>{item.기준여부_15}</td>
                  <td>{item.기준여부_20}</td>
                  <td>{item.기준여부_25}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ButtonComponent
