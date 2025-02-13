# Electron 템플릿

외주 개발을 위한 Electron 템플릿입니다.

## 개발해야하는 기능

사이트 링크 모음

[서울시,군,구를 모아놓은 링크 (인증X)](https://new.land.naver.com/api/regions/list?cortarNo=1100000000)
[해당 군,구를 선택하면 나오는 동(인증X)](https://new.land.naver.com/api/regions/list?cortarNo=1168000000)
[아파트 종류 (인증X)](https://new.land.naver.com/api/regions/complexes?cortarNo=1168010300&realEstateType=APT%3APRE%3AABYG%3AJGC&order=)
[중개사에서 취급하는 물건들(인증 O)](https://new.land.naver.com/api/articles?index=3&representativeArticleNo=2507611962)

## 동작 순서

1. 버튼을 누른다.

2. 네이버 부동산을 들어가 새로고침을 통하여 보안 헤더를 인터셉트한다.

3. 기존에 받아놓은 모든 시군구에 동까지 파싱해놓은 숫자로 링크접속한다.

4. 해당 링크에 있는 아파트 값을 전부 파싱한다.

5. 파싱후 엑셀로 저장한다.
