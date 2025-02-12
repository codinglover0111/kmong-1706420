# 크몽 부동산 크롤링 (1706420)

## 📌 요구사항

### ✅ 프로그램 개요

- **네이버페이 부동산 크롤링 프로그램 개발**
- **서울시 전체 아파트 정보**를 한 번에 크롤링하는 기능
- 버튼 하나만 누르면 자동 실행되도록 구현

---

### ✅ 기능 상세

#### 1. 서울시 전체 아파트 데이터 크롤링

- 개별 아파트가 아닌 **서울시 내 모든 아파트 정보**를 자동으로 가져오기

#### 2. 크롤링 데이터 항목

- **기본 정보**
  - 시, 구, 동, 아파트명, 사용승인연도, 연식, 전체세대수, 총 동수
- **면적 관련 정보**
  - 공급면적, 해당면적세대수, 평형, 전용면적, 현관구조, 방수, 욕실수, 주차대수, 세대당주차대수
- **가격 관련 정보**
  - 매매, 전고점(21.01 이후 최고가), 전저점(21.01 이후 최저가), 최대하락률, 상승률, 하락률
- **기준 가격 정보**
  - -15%, -20%, -25% 기준가 및 해당 여부

#### 3. 데이터 저장

- **엑셀 파일로 저장**
- **평형별로 구분하여 정리**
- **전고점/전저점 정보 포함**
  - 네이버페이 부동산 차트의 붉은 점(전고점/전저점)에 마우스를 올려야 보이는 데이터 크롤링
  - **전고점/전저점 기준**: 2021년 1월 이후 최고/최저 가격

---

### ✅ 개발 조건

- **개발 비용**: 10만 원
- **개발 기간**: 3일
