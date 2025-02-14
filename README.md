# Electron 템플릿

외주 개발을 위한 Electron 템플릿입니다.

## 개발해야하는 기능

사이트 링크 모음

[서울시,군,구를 모아놓은 링크 (인증X)](https://new.land.naver.com/api/regions/list?cortarNo=1100000000)
[해당 군,구를 선택하면 나오는 동(인증X)](https://new.land.naver.com/api/regions/list?cortarNo=1168000000)
[아파트 종류 (인증X)](https://new.land.naver.com/api/regions/complexes?cortarNo=1168010300&realEstateType=APT%3APRE%3AABYG%3AJGC&order=)
[아파트 가격 파싱 (인증 O)](https://new.land.naver.com/api/complexes/3392/prices?complexNo=3392&tradeType=A1&year=5&priceChartChange=false&areaNo=3&type=chart)

### JSON 형식

2021년 1월 이후 아래 정보를 파싱해야한다.
realPriceDataXList(날짜 정보)
realPriceDataYList(가격 정보)

### 주의 사항

실거래가 없는 경우 2021년 1월 이후 아래 정보를 파싱해야한다.
marketPriceAreaList(가격 정보)
marketPriceXList(날짜 정보)
[아파트 정보 (인증 O)](https://new.land.naver.com/api/complexes/3392?sameAddressGroup=true)

## 동작 순서

1. 버튼을 누른다.

2. 네이버 부동산을 들어가 새로고침을 통하여 보안 헤더를 인터셉트한다.

3. 기존에 받아놓은 모든 시군구에 동까지 파싱해놓은 숫자로 링크접속한다.

4. 해당 링크에 있는 아파트 값을 전부 파싱한다.

5. 파싱후 엑셀로 저장한다.
