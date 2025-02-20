export interface XlsxType {
  시: string
  구: string
  동: string
  평번호: number
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
  매매: number | string
  전고점: number | string
  전저점: number | string
  최대하락률: number | string
  상승률: number | string
  하락률: number | string
  // 아래 필드들은 헤더에 약간의 혼동이 있었으나, 샘플 데이터를 바탕으로 기준가와 기준여부를 분리하였습니다.
  기준가_15: number | string
  기준가_20: number | string
  기준가_25: number | string
  기준여부_15: number | string
  기준여부_20: number | string
  기준여부_25: number | string
}
