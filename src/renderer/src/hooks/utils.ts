export interface RegionCode {
  name: string
  code: number
  centerLat: number
  centerLon: number
}

export function useRegionCodes(
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

export function extractRegionCodes(
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

export async function getPyeongPriceData(
  complexNo: number,
  areaNo: number
): Promise<{
  매매: number | string
  전고점: number | string
  전저점: number | string
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // 2021년 기준으로 잡아야함
  const currentYear = new Date().getFullYear()
  const targetYear = 2021
  const difference = currentYear - targetYear

  const summary_url = `https://new.land.naver.com/api/complexes/${complexNo}/prices?complexNo=${complexNo}&tradeType=A1&year=${difference}&priceChartChange=true&areaChange=true&areaNo=${areaNo}&type=summary`
  const table_url = `https://new.land.naver.com/api/complexes/${complexNo}/prices?complexNo=${complexNo}&tradeType=A1&year=${difference}&priceChartChange=true&areaNo=${areaNo}&areaChange=true&type=table`
  // const summary_url = `https://new.land.naver.com/api/complexes/${complexNo}/prices?complexNo=${complexNo}&tradeType=A1&year=4&priceChartChange=false&type=summary`
  // const chart_url = `https://new.land.naver.com/api/complexes/${complexNo}/prices?complexNo=${complexNo}&tradeType=A1&year=${difference}&priceChartChange=true&areaChange=true&type=chart`
  const real_trade_url = `https://new.land.naver.com/api/complexes/881/prices/real?complexNo=${complexNo}&tradeType=A1&year=${difference}&priceChartChange=true&areaNo=${areaNo}&type=table`

  // const real_trade_res = await window.electron.ipcRenderer.invoke('puppeteer_api', real_trade_url)
  // const chart_res = await window.electron.ipcRenderer.invoke('puppeteer_api', chart_url)
  const table_res = await window.electron.ipcRenderer.invoke('puppeteer_api', table_url)
  const real_trade_res = await window.electron.ipcRenderer.invoke('puppeteer_api', real_trade_url)
  console.log('real')
  console.log(real_trade_res)
  // console.log(real_trade_res)
  // 2021-01-01 이후 배열 인덱스 찾기기
  // const 특정년도_이후_배열_인덱스 = findIndexesAfterDateExcludingFirst(
  //   chart_res.realPriceDataXList,
  //   '2021-01-01'
  // )
  // const 매매_값_배열: [any] = []
  // for (const 인덱스 of 특정년도_이후_배열_인덱스) {
  //   매매_값_배열.push(chart_res['realPriceDataYList'][인덱스])
  // }
  // const 매매_값 = Math.min(...매매_값_배열)
  console.log(areaNo)
  // console.log(table_res)
  let 매매: number | string = 0
  if (real_trade_res?.['realPriceOnMonthList'].length > 0) {
    매매 = real_trade_res?.['realPriceOnMonthList'][0]['realPriceList'][0]['dealPrice']
  } else {
    매매 = '-'
  }
  console.log({
    매매: 매매,
    전고점: table_res?.['marketPrices']?.[0]['dealUpperPriceLimit']
      ? (table_res['marketPrices'][0]['dealUpperPriceLimit'] as number)
      : '-',
    전저점: table_res?.['marketPrices']?.[0]['dealLowPriceLimit']
      ? (table_res['marketPrices'][0]['dealLowPriceLimit'] as number)
      : '-'
  })
  return {
    매매: 매매,
    전고점: table_res?.['marketPrices']?.[0]['dealUpperPriceLimit']
      ? (table_res['marketPrices'][0]['dealUpperPriceLimit'] as number)
      : '-',
    전저점: table_res?.['marketPrices']?.[0]['dealLowPriceLimit']
      ? (table_res['marketPrices'][0]['dealLowPriceLimit'] as number)
      : '-'
  }
}
