# 가톨릭길동무 순례길 내비게이션 독립 PWA

이 패키지는 원본 가톨릭길동무 앱과 분리한 순례길 내비게이션 테스트용 PWA입니다.

## 포함된 기능

- 순례길 목록
- 한티가는길 데이터 포함
- Kakao 지도에 GPX 경로선 표시
- 스탬프 지점 표시
- 내 위치 확인
- 따라가기 모드
- 현재 위치와 GPX 경로선의 거리 계산
- 경로 위 / 근처 / 이탈 상태 표시
- 다음 지점 거리 표시
- Android 인앱 브라우저에서 Chrome으로 열기 버튼
- PWA 설치 및 Service Worker 캐시

## 제외한 기능

- 원본 앱의 성지·성당·피정의집 지도
- 원본 앱의 일반 길찾기 탭
- 카카오내비 경로검색 UI
- 숨겨진 테스트 지도 파일
- company/dowon 테스트 루프 데이터
- 원본 앱 커버, 기도문, 교구, 나의 신앙생활 기능

## GitHub Pages 테스트 전 확인

Kakao Developers에서 JavaScript 키의 웹 플랫폼 도메인에 GitHub Pages 주소를 등록해야 지도가 정상 표시됩니다.
예: `https://사용자명.github.io`

## 새 순례길 추가 방식

`routes/새순례길.js` 파일을 추가하고 아래 형식으로 등록하면 됩니다.

```js
window.PILGRIMAGE_ROUTES = window.PILGRIMAGE_ROUTES || [];
window.PILGRIMAGE_ROUTES.push({
  id: 'new-route',
  name: '새 순례길',
  startName: '출발지',
  finishName: '도착지',
  stamps: [],
  routeSegments: []
});
```

그리고 `index.html` 하단에 해당 데이터 파일 script를 한 줄 추가하세요.
