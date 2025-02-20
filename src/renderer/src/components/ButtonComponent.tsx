import { read, utils, writeFile } from 'xlsx'
import { useState, useEffect, useRef } from 'react'
import { XlsxType } from '@renderer/types/xlsxType'
import { FixedSizeList as List } from 'react-window'
import { extractRegionCodes, getPyeongPriceData, useRegionCodes } from '@renderer/hooks/utils'

function ButtonComponent(): JSX.Element {
  const [ApartmentList, setApartmentList] = useState<
    { name: string; code: number; dong: string }[]
  >([])
  const [아파트_정보, set아파트_정보] = useState<XlsxType[]>([])
  const [prgressPercent, setProgressPercent] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  // "아파트 목록 추출" 작업이 진행 중임을 나타내는 상태
  const [isExtracting, setIsExtracting] = useState(false)
  // 작업 중지 요청을 감지할 수 있도록 ref 사용
  const extractionCancelledRef = useRef(false)
  // const tableRef = useRef<HTMLTableElement>(null)
  const [aptParsingProgress, setApartmentParsingProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Puppeteer 초기화 상태를 감지하는 이벤트 리스너 등록
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

  useEffect(() => {
    // 컨트롤 + F 단축키로 검색창에 포커스를 주는 이벤트 리스너 등록
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        const searchInput = document.getElementById('apartment-search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // TODO: hook으로 분리
  const filtered아파트정보 = searchQuery
    ? 아파트_정보.filter((item) => item.아파트명.toLowerCase().includes(searchQuery.toLowerCase()))
    : 아파트_정보

  // !: 평마다의 매매 내역, 전고점, 전저점을 못 가져오고 있음
  // async function getPyeongPriceData(
  //   complexNo: number,
  //   pyeongValue: number,
  //   areaNo: number
  // ): Promise<{
  //   매매: number | string
  //   전고점: number | string
  //   전저점: number | string
  //   거래내역?: any[]
  // }> {
  //   // 동적 areaNo를 사용하여 각 건물 타입에 따른 가격 데이터를 요청
  //   const url = `https://new.land.naver.com/api/complexes/${complexNo}/prices/real?complexNo=${complexNo}&tradeType=A1&year=5&priceChartChange=true&pyeong=${pyeongValue}&areaNo=${areaNo}&type=table`
  //   console.log('[getPyeongPriceData] 요청 URL:', url)
  //   const res = await window.electron.ipcRenderer.invoke('puppeteer_api', url)
  //   console.log('[getPyeongPriceData] API 응답:', res)
  //   if (res && Array.isArray(res.realPriceOnMonthList)) {
  //     // 모든 월별 거래 내역을 하나의 배열로 결합
  //     const allTransactions = res.realPriceOnMonthList.reduce((acc: any[], cur: any) => {
  //       if (cur.realPriceList) {
  //         return acc.concat(cur.realPriceList)
  //       }
  //       return acc
  //     }, [])

  //     const minTimestamp = new Date('2021-01-01').getTime()
  //     // 거래 날짜가 2021-01-01 이후인 거래만 필터링 (tradeYear, tradeMonth, tradeDate를 이용)
  //     const validTransactions = allTransactions.filter((tx) => {
  //       const dateStr = `${tx.tradeYear}-${String(tx.tradeMonth).padStart(2, '0')}-${String(tx.tradeDate).padStart(2, '0')}`
  //       const txTime = new Date(dateStr).getTime()
  //       return !isNaN(txTime) && txTime >= minTimestamp
  //     })

  //     let 매매, 전고, 전저
  //     if (validTransactions.length > 0) {
  //       // 마지막 거래 가격을 매매가격으로 사용
  //       매매 = validTransactions[validTransactions.length - 1].dealPrice
  //       전고 = Math.max(...validTransactions.map((tx) => tx.dealPrice))
  //       전저 = Math.min(...validTransactions.map((tx) => tx.dealPrice))
  //     } else {
  //       매매 = 전고 = 전저 = '-'
  //     }
  //     return { 매매, 전고점: 전고, 전저점: 전저, 거래내역: validTransactions }
  //   } else {
  //     return { 매매: '-', 전고점: '-', 전저점: '-' }
  //   }
  // }

  function findIndexesAfterDateExcludingFirst(arr, baseDateStr): [number] {
    const baseDate = new Date(baseDateStr)
    return arr.reduce((result, item, index) => {
      if (index === 0) {
        // 첫 번째 요소는 제외합니다.
        return result
      }
      // 날짜 형식(YYYY-MM-DD)인지 확인
      if (/^\d{4}-\d{2}-\d{2}$/.test(item)) {
        const currentDate = new Date(item)
        if (currentDate > baseDate) {
          result.push(index)
        }
      }
      return result
    }, [])
  }

  return (
    <div>
      <button
        onClick={async () => {
          // 작업 시작시 작업 중지 요청 플래그 초기화와 진행 상태 활성화
          extractionCancelledRef.current = false
          setIsExtracting(true)
          //TODO: 필요한 기능은 hook으로 분리
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

          const cityDistrictCodes = useRegionCodes(rawCityDistrictCodes)

          // 동 코드 추출
          // TODO: 동 코드를 저장하여 반복적인 api 호출을 줄일 수 있도록 개선
          // TODO: 동 코드 추출을 병렬로 처리하여 성능 개선
          // TODO: 훅으로 분리
          for (const cityDistrict of cityDistrictCodes) {
            if (extractionCancelledRef.current) {
              console.log('작업 중지 요청 확인 - 시,군,구 코드 추출 중단')
              break
            }
            const rawDongCodes = await window.electron.ipcRenderer.invoke(
              'puppeteer_api',
              `https://new.land.naver.com/api/regions/list?cortarNo=${cityDistrict.code}`
            )

            const parsedDongCodes = extractRegionCodes(rawDongCodes)
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
                // 99% 도달 시 100%로 설정
                setProgressPercent(100)
              }
            }

            if (index % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
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
              console.log(response)
              const 아파트: Array<XlsxType> = []

              if (response && response.complexDetail && response.complexPyeongDetailList) {
                // 아파트 객체 생성
                // TODO: 리팩토링
                // TODO: hook으로 분리
                const detail = response.complexDetail
                const addressParts = detail.address ? detail.address.split(' ') : ['', '', '']
                const 시 = addressParts[0] ? addressParts[0].replace('시', '') : ''
                const 구 = addressParts[1] ? addressParts[1].replace('구', '') : ''
                const 동 = addressParts[2] ? addressParts[2].replace('동', '') : ''
                const 사용승인연도 = detail.useApproveYmd
                  ? Number(detail.useApproveYmd.slice(0, 4))
                  : 0
                const 연식 = new Date().getFullYear() - 사용승인연도

                // 각 평(평형)별로 개별 가격 데이터 요청
                for (const pyeong of response.complexPyeongDetailList) {
                  console.log('pyeong')
                  console.log(pyeong)
                  // TODO: 리팩토링
                  const priceData = await getPyeongPriceData(item.code, pyeong.pyeongNo)
                  아파트.push({
                    시,
                    구,
                    동,
                    평번호: pyeong.pyeongNo,
                    아파트명: detail.complexName || '',
                    사용승인연도,
                    연식,
                    전체세대수: detail.totalHouseholdCount ? Number(detail.totalHouseholdCount) : 0,
                    총동수: detail.totalDongCount ? Number(detail.totalDongCount) : 0,
                    공급면적: pyeong.supplyAreaDouble ? Number(pyeong.supplyAreaDouble) : 0,
                    해당면적세대수: pyeong.householdCountByPyeong
                      ? Number(pyeong.householdCountByPyeong)
                      : 0,
                    평형: parseFloat(pyeong.pyeongName),
                    전용면적: pyeong.exclusiveArea ? Number(pyeong.exclusiveArea) : 0,
                    현관구조: pyeong.entranceType || '',
                    방수: pyeong.roomCnt ? Number(pyeong.roomCnt) : 0,
                    욕실수: pyeong.bathroomCnt ? Number(pyeong.bathroomCnt) : 0,
                    주차대수: detail.parkingPossibleCount ? Number(detail.parkingPossibleCount) : 0,
                    세대당주차대수: detail.parkingCountByHousehold
                      ? Number(detail.parkingCountByHousehold)
                      : 0,
                    매매: priceData.매매,
                    전고점: priceData.전고점,
                    전저점: priceData.전저점,
                    최대하락률:
                      priceData.매매 !== '-' &&
                      priceData.전고점 !== '-' &&
                      Number(priceData.전고점) !== 0
                        ? (
                            ((Number(priceData.전고점) - Number(priceData.매매)) /
                              Number(priceData.전고점)) *
                            100
                          ).toFixed(0) + '%'
                        : '-',
                    기준가_15:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? (Number(priceData.전고점) * 0.85).toFixed(0)
                        : '-',
                    기준가_20:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? (Number(priceData.전고점) * 0.8).toFixed(0)
                        : '-',
                    기준가_25:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? (Number(priceData.전고점) * 0.75).toFixed(0)
                        : '-',
                    기준여부_15:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? Number(priceData.매매) >= Number(priceData.전고점) * 0.85
                          ? 'Y'
                          : 'N'
                        : '-',
                    기준여부_20:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? Number(priceData.매매) >= Number(priceData.전고점) * 0.8
                          ? 'Y'
                          : 'N'
                        : '-',
                    기준여부_25:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? Number(priceData.매매) >= Number(priceData.전고점) * 0.75
                          ? 'Y'
                          : 'N'
                        : '-',
                    상승률:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? Number(priceData.매매) >= Number(priceData.전고점) * 0.85
                          ? (
                              ((Number(priceData.매매) - Number(priceData.전고점) * 0.85) /
                                (Number(priceData.전고점) * 0.85)) *
                              100
                            ).toFixed(2) + '%'
                          : '-'
                        : '-',
                    하락률:
                      priceData.매매 !== '-' && priceData.전고점 !== '-'
                        ? Number(priceData.매매) < Number(priceData.전고점) * 0.85
                          ? (
                              ((Number(priceData.전고점) * 0.85 - Number(priceData.매매)) /
                                (Number(priceData.전고점) * 0.85)) *
                              100
                            ).toFixed(2) + '%'
                          : '-'
                        : '-'
                  })
                }
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
      <p>아파트 목록 파싱 진행 상황 : {prgressPercent}%</p>
      <p>아파트 정보 파싱 진행 상황 : {aptParsingProgress}%</p>
      <p>총 개수 : {totalCount}개</p>
      <button
        onClick={() => {
          if (아파트_정보.length > 0) {
            const ws = utils.json_to_sheet(아파트_정보)
            const wb = utils.book_new()
            utils.book_append_sheet(wb, ws, '아파트정보')
            const now = new Date()
            const fileName = `부동산_크롤링_${now.getFullYear()}-${(now.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
              .getHours()
              .toString()
              .padStart(2, '0')}-${now
              .getMinutes()
              .toString()
              .padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}.xlsx`
            writeFile(wb, fileName)
          }
        }}
      >
        xlsx 추출
      </button>
      <input
        id="apartment-search-input"
        type="text"
        placeholder="아파트명 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginTop: '16px', marginBottom: '8px', width: '100%', padding: '4px' }}
      />
      <div
        style={{
          border: '1px solid #D1D5DB',
          padding: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            fontWeight: 'bold',
            backgroundColor: '#f3f4f6'
          }}
        >
          <div style={{ flex: '1' }}>시</div>
          <div style={{ flex: '1' }}>구</div>
          <div style={{ flex: '1' }}>동</div>
          <div style={{ flex: '2' }}>아파트명</div>
          <div style={{ flex: '1' }}>사용승인 연도</div>
          <div style={{ flex: '1' }}>연식</div>
          <div style={{ flex: '1' }}>전체 세대수</div>
          <div style={{ flex: '1' }}>총 동수</div>
          <div style={{ flex: '1' }}>공급 면적</div>
          <div style={{ flex: '1' }}>해당면적 세대수</div>
          <div style={{ flex: '1' }}>평형</div>
          <div style={{ flex: '1' }}>전용 면적</div>
          <div style={{ flex: '1' }}>현관구조</div>
          <div style={{ flex: '1' }}>방수</div>
          <div style={{ flex: '1' }}>욕실수</div>
          <div style={{ flex: '1' }}>주차대수</div>
          <div style={{ flex: '1' }}>세대당 주차대수</div>
          <div style={{ flex: '1' }}>매매</div>
          <div style={{ flex: '1' }}>전고점</div>
          <div style={{ flex: '1' }}>전저점</div>
          <div style={{ flex: '1' }}>최대 하락률</div>
          <div style={{ flex: '1' }}>상승률</div>
          <div style={{ flex: '1' }}>하락률</div>
          <div style={{ flex: '1' }}>기준가 (-15%)</div>
          <div style={{ flex: '1' }}>기준가 (-20%)</div>
          <div style={{ flex: '1' }}>기준가 (-25%)</div>
          <div style={{ flex: '1' }}>기준여부 (-15%)</div>
          <div style={{ flex: '1' }}>기준여부 (-20%)</div>
          <div style={{ flex: '1' }}>기준여부 (-25%)</div>
        </div>
        <List height={400} itemCount={filtered아파트정보.length} itemSize={35} width="100%">
          {({ index, style }) => {
            const item = filtered아파트정보[index]
            return (
              <div
                key={index}
                style={{
                  ...style,
                  display: 'flex',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <div style={{ flex: '1' }}>{item.시}</div>
                <div style={{ flex: '1' }}>{item.구}</div>
                <div style={{ flex: '1' }}>{item.동}동</div>
                <div style={{ flex: '2' }}>{item.아파트명}</div>
                <div style={{ flex: '1' }}>{item.사용승인연도}</div>
                <div style={{ flex: '1' }}>{item.연식}</div>
                <div style={{ flex: '1' }}>{item.전체세대수}</div>
                <div style={{ flex: '1' }}>{item.총동수}</div>
                <div style={{ flex: '1' }}>{item.공급면적}</div>
                <div style={{ flex: '1' }}>{item.해당면적세대수}</div>
                <div style={{ flex: '1' }}>{item.평형}</div>
                <div style={{ flex: '1' }}>{item.전용면적}</div>
                <div style={{ flex: '1' }}>{item.현관구조}</div>
                <div style={{ flex: '1' }}>{item.방수}</div>
                <div style={{ flex: '1' }}>{item.욕실수}</div>
                <div style={{ flex: '1' }}>{item.주차대수}</div>
                <div style={{ flex: '1' }}>{item.세대당주차대수}</div>
                <div style={{ flex: '1' }}>{item.매매}</div>
                <div style={{ flex: '1' }}>{item.전고점}</div>
                <div style={{ flex: '1' }}>{item.전저점}</div>
                <div style={{ flex: '1' }}>{item.최대하락률}</div>
                <div style={{ flex: '1' }}>{item.상승률}</div>
                <div style={{ flex: '1' }}>{item.하락률}</div>
                <div style={{ flex: '1' }}>{item.기준가_15}</div>
                <div style={{ flex: '1' }}>{item.기준가_20}</div>
                <div style={{ flex: '1' }}>{item.기준가_25}</div>
                <div style={{ flex: '1' }}>{item.기준여부_15}</div>
                <div style={{ flex: '1' }}>{item.기준여부_20}</div>
                <div style={{ flex: '1' }}>{item.기준여부_25}</div>
              </div>
            )
          }}
        </List>
      </div>
    </div>
  )
}

export default ButtonComponent
