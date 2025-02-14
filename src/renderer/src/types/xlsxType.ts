export interface XlsxType {
  시: string
  구: string
  동: string
  아파트명: string
  사용승인연도: number
  연식: number
  전체세대수: number
  총동수: number
  공급면적: number
  해당면적세대수: number
  평형: number
  전용면적: number
  현관구조: string
  방수: number
  욕실수: number
  주차대수: number
  세대당주차대수: number
  매매: number
  전고점: number
  전저점: number
  최대하락률: string // 예: "-18%"
  상승률: string // 예: "9%"
  하락률: string // 예: "-11%"
  // 아래 필드들은 헤더에 약간의 혼동이 있었으나, 샘플 데이터를 바탕으로 기준가와 기준여부를 분리하였습니다.
  기준가_15: number // 헤더: "기준여부 (-15%)" (샘플 값: 70550)
  기준가_20: number // 헤더: "기준가 (-20%)"   (샘플 값: 66400)
  기준가_25: number // 헤더: "기준가 (-25%)"   (샘플 값: 62250)
  기준여부_15: string // 헤더: "기준여부 (-15%)" (샘플 값: N)
  기준여부_20: string // 헤더: "기준여부 (-20%)" (샘플 값: N)
  기준여부_25: string // 헤더: "기준여부 (-25%)" (샘플 값: N)
}
