import { useMemo } from 'react'

function useCalculateBounds(
  centerLat: number,
  centerLon: number
): { topLat: number; bottomLat: number; rightLon: number; leftLon: number } {
  const bounds = useMemo(() => {
    // 서울 지역 기준으로 1도의 위도는 약 111km, 경도는 약 88.8km
    const latPerKm: number = 1 / 111
    const lonPerKm: number = 1 / 88.8

    // 줌 레벨 16에서 대략적인 가시 범위 (서울 기준)
    const deltaLat: number = (2.7 / 2) * latPerKm // 위도 변화량
    const deltaLon: number = (3.5 / 2) * lonPerKm // 경도 변화량

    return {
      topLat: centerLat + deltaLat,
      bottomLat: centerLat - deltaLat,
      rightLon: centerLon + deltaLon,
      leftLon: centerLon - deltaLon
    }
  }, [centerLat, centerLon])

  return bounds
}

// 새 순수 함수 calculateBounds - 컴포넌트 이벤트 등에서 자유롭게 사용 가능
export function calculateBounds(
  centerLat: number,
  centerLon: number
): { topLat: number; bottomLat: number; rightLon: number; leftLon: number } {
  // 서울 지역 기준으로 1도의 위도는 약 111km, 경도는 약 88.8km
  const latPerKm: number = 1 / 111
  const lonPerKm: number = 1 / 88.8

  // 줌 레벨 16에서 대략적인 가시 범위 (서울 기준)
  const deltaLat: number = (2.7 / 2) * latPerKm // 위도 변화량
  const deltaLon: number = (3.5 / 2) * lonPerKm // 경도 변화량

  return {
    topLat: centerLat + deltaLat,
    bottomLat: centerLat - deltaLat,
    rightLon: centerLon + deltaLon,
    leftLon: centerLon - deltaLon
  }
}

export default useCalculateBounds
