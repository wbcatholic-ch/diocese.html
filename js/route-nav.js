(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = {
    routes: [],
    activeRoute: null,
    map: null,
    kakaoReady: false,
    polylines: [],
    stampMarkers: [],
    myMarker: null,
    watchId: null,
    following: false,
    totalDistanceM: 0,
    segmentIndex: []
  };

  const SEOUL_FALLBACK = { lat: 37.56, lng: 126.98 };
  const ON_ROUTE_M = 45;
  const NEAR_ROUTE_M = 120;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    state.routes = Array.isArray(window.PILGRIMAGE_ROUTES) ? window.PILGRIMAGE_ROUTES.filter(Boolean) : [];
    // 초기 진입은 반드시 목록 화면이다. CSS 캐시나 브라우저 hidden 처리 차이로
    // 지도 화면이 먼저 보이는 일을 막기 위해 시작 상태를 명시한다.
    if ($('route-list-view')) $('route-list-view').hidden = false;
    if ($('map-view')) $('map-view').hidden = true;
    registerPwa();
    setupChromeOpenPanel();
    setupButtons();
    renderRouteList();
  }

  function setupButtons() {
    $('back-to-list')?.addEventListener('click', showList);
    $('fit-route-btn')?.addEventListener('click', fitRouteBounds);
    $('my-location-btn')?.addEventListener('click', locateOnce);
    $('follow-btn')?.addEventListener('click', toggleFollow);
  }

  function renderRouteList() {
    const list = $('route-list');
    list.innerHTML = '';
    if (!state.routes.length) {
      list.innerHTML = '<div class="notice-card"><strong>순례길 데이터가 없습니다</strong><p>routes 폴더에 순례길 데이터 파일을 추가하세요.</p></div>';
      return;
    }
    state.routes.forEach((route) => {
      const totalKm = computeRouteTotalDistance(route) / 1000;
      const distanceText = route.distanceLabel || `약 ${totalKm.toFixed(1)}km`;
      const representative = routeUsesRepresentativeLine(route);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `route-card${representative ? ' representative' : ''}`;
      btn.innerHTML = `
        <div class="route-card-main">
          <div class="route-icon">🧭</div>
          <div class="route-copy">
            <div class="route-name-row">
              <h3 class="route-name">${escapeHtml(route.name || '순례길')}</h3>
              ${representative ? '<span class="route-badge">대표선</span>' : ''}
            </div>
            <div class="route-meta">${escapeHtml(route.startName || '출발지')} → ${escapeHtml(route.finishName || '도착지')}</div>
          </div>
        </div>
        <div class="route-foot"><span>${route.stamps?.length || 0}개 지점${representative ? ' · 대표 경로' : ''}</span><strong>${escapeHtml(distanceText)}</strong></div>
      `;
      btn.addEventListener('click', () => openRoute(route));
      list.appendChild(btn);
    });
  }

  function openRoute(route) {
    state.activeRoute = route;
    state.segmentIndex = buildSegmentIndex(route);
    state.totalDistanceM = state.segmentIndex.length ? state.segmentIndex[state.segmentIndex.length - 1].endDistanceM : 0;
    $('route-list-view').hidden = true;
    $('map-view').hidden = false;
    $('map-title').textContent = route.name || '순례길';
    $('map-subtitle').textContent = `${route.startName || '출발지'} → ${route.finishName || '도착지'}${routeUsesRepresentativeLine(route) ? ' · 대표선' : ''}`;
    $('status-label').textContent = '순례길 준비 완료';
    $('status-message').textContent = routeUsesRepresentativeLine(route)
      ? '내 위치 또는 따라가기를 누르면 대표 경로선과의 거리를 계산합니다.'
      : '내 위치 또는 따라가기를 누르면 GPX 경로와의 거리를 계산합니다.';
    $('route-distance').textContent = '—';
    $('route-progress').textContent = '—';
    $('next-stamp').textContent = '—';
    setChip('neutral', '대기');
    showFlexNote(route);
    resetMapLoading('지도를 불러오는 중입니다');
    loadKakaoMap().then(() => drawRoute(route)).catch(showMapError);
  }

  function showList() {
    stopFollow();
    $('map-view').hidden = true;
    $('route-list-view').hidden = false;
  }

  function loadKakaoMap() {
    if (state.kakaoReady && window.kakao?.maps?.Map) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (!/^https?:$/.test(location.protocol)) {
        reject(new Error('지도는 https 주소에서 열어야 합니다. GitHub Pages의 https 주소로 접속해 주세요.'));
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        state.kakaoReady = true;
        resolve();
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const existing = document.getElementById('kakao-map-sdk');
        if (existing && !window.kakao?.maps?.Map) existing.remove();
        reject(error instanceof Error ? error : new Error(String(error || 'Kakao Map 로딩 실패')));
      };
      const timer = setTimeout(() => {
        fail(new Error('Kakao Map SDK 로딩이 완료되지 않았습니다. 도메인 등록이 되어 있다면 Chrome에서 사이트 데이터/서비스워커 캐시를 삭제한 뒤 다시 열어 주세요.'));
      }, 22000);

      const runKakaoLoad = () => {
        try {
          if (!window.kakao?.maps?.load) {
            fail(new Error('Kakao 지도 SDK가 정상 응답하지 않았습니다. JavaScript 키와 현재 접속 도메인을 확인하세요.'));
            return;
          }
          kakao.maps.load(() => {
            if (window.kakao?.maps?.Map) finish();
            else fail(new Error('Kakao 지도 객체가 준비되지 않았습니다.'));
          });
        } catch (error) {
          fail(error);
        }
      };

      if (window.kakao?.maps?.load) {
        runKakaoLoad();
        return;
      }

      const key = window.APP_CONFIG?.KAKAO_JS_KEY;
      if (!key) {
        fail(new Error('Kakao JavaScript 키가 없습니다.'));
        return;
      }

      const oldScript = document.getElementById('kakao-map-sdk');
      if (oldScript) oldScript.remove();

      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      script.onload = runKakaoLoad;
      script.onerror = () => fail(new Error('Kakao Map SDK 파일을 불러오지 못했습니다. 네트워크 차단이나 브라우저 캐시를 확인하세요.'));
      document.head.appendChild(script);
    });
  }

  function drawRoute(route) {
    const KM = kakao.maps;
    const center = firstPoint(route) || SEOUL_FALLBACK;
    if (!state.map) {
      state.map = new KM.Map($('map-layer') || $('map-canvas'), {
        center: new KM.LatLng(center.lat, center.lng),
        level: 8
      });
    }
    clearMapObjects();
    if ($('map-loading')) $('map-loading').style.display = 'none';

    state.segmentIndex = buildSegmentIndex(route);
    state.totalDistanceM = state.segmentIndex.length ? state.segmentIndex[state.segmentIndex.length - 1].endDistanceM : 0;

    (route.routeSegments || []).forEach((segment) => {
      const path = (segment.points || [])
        .filter((p) => isFiniteNumber(p.lat) && isFiniteNumber(p.lng))
        .map((p) => new KM.LatLng(Number(p.lat), Number(p.lng)));
      if (path.length < 2) return;
      const polyline = new KM.Polyline({
        path,
        strokeWeight: 5,
        strokeColor: segment.color || route.routeColor || (routeUsesRepresentativeLine(route) ? '#b7791f' : '#1d4ed8'),
        strokeOpacity: routeUsesRepresentativeLine(route) ? 0.82 : 0.9,
        strokeStyle: routeUsesRepresentativeLine(route) ? 'shortdash' : 'solid'
      });
      polyline.setMap(state.map);
      state.polylines.push(polyline);
    });

    (route.stamps || []).forEach((stamp) => {
      if (!isFiniteNumber(stamp.lat) || !isFiniteNumber(stamp.lng)) return;
      const content = document.createElement('div');
      content.className = 'stamp-marker';
      content.textContent = stamp.id || '•';
      content.title = stamp.name || '';
      const overlay = new KM.CustomOverlay({
        position: new KM.LatLng(Number(stamp.lat), Number(stamp.lng)),
        content,
        yAnchor: 0.5,
        xAnchor: 0.5
      });
      overlay.setMap(state.map);
      state.stampMarkers.push(overlay);
    });

    setTimeout(() => {
      if (state.map?.relayout) state.map.relayout();
      fitRouteBounds();
    }, 80);
  }

  function clearMapObjects() {
    state.polylines.forEach((item) => item.setMap(null));
    state.stampMarkers.forEach((item) => item.setMap(null));
    state.polylines = [];
    state.stampMarkers = [];
    if (state.myMarker) state.myMarker.setMap(null);
    state.myMarker = null;
  }

  function fitRouteBounds() {
    if (!state.map || !state.activeRoute) return;
    const KM = kakao.maps;
    const bounds = new KM.LatLngBounds();
    let count = 0;
    (state.activeRoute.routeSegments || []).forEach((segment) => {
      (segment.points || []).forEach((point) => {
        if (!isFiniteNumber(point.lat) || !isFiniteNumber(point.lng)) return;
        bounds.extend(new KM.LatLng(Number(point.lat), Number(point.lng)));
        count += 1;
      });
    });
    if (!count) return;
    state.map.setBounds(bounds, 86, 24, 170, 24);
  }

  function locateOnce() {
    getCurrentPosition().then((position) => {
      const coords = toCoords(position);
      updateMyLocation(coords, { center: true });
      updateRouteStatus(coords);
    }).catch(showLocationError);
  }

  function toggleFollow() {
    if (state.following) {
      stopFollow();
      return;
    }
    if (!navigator.geolocation) {
      showLocationError(new Error('이 기기에서 위치 기능을 사용할 수 없습니다.'));
      return;
    }
    state.following = true;
    $('follow-btn').classList.add('active');
    $('follow-btn').querySelector('span').textContent = '중지';
    $('status-label').textContent = '따라가기 시작';
    $('status-message').textContent = '현재 위치를 계속 확인합니다.';
    state.watchId = navigator.geolocation.watchPosition((position) => {
      const coords = toCoords(position);
      updateMyLocation(coords, { center: true, following: true });
      updateRouteStatus(coords);
    }, showLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    });
  }

  function stopFollow() {
    if (state.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.watchId);
    }
    state.watchId = null;
    state.following = false;
    const btn = $('follow-btn');
    btn.classList.remove('active');
    btn.querySelector('span').textContent = '따라가기';
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 기기에서 위치 기능을 사용할 수 없습니다.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });
    });
  }

  function updateMyLocation(coords, options = {}) {
    if (!state.map || !window.kakao?.maps) return;
    const KM = kakao.maps;
    const pos = new KM.LatLng(coords.lat, coords.lng);
    const markerEl = document.createElement('div');
    markerEl.className = `my-location-marker${options.following ? ' following' : ''}`;
    if (!state.myMarker) {
      state.myMarker = new KM.CustomOverlay({ position: pos, content: markerEl, xAnchor: 0.5, yAnchor: 0.5, zIndex: 20 });
      state.myMarker.setMap(state.map);
    } else {
      state.myMarker.setPosition(pos);
      state.myMarker.setContent(markerEl);
    }
    if (options.center) state.map.panTo(pos);
  }

  function updateRouteStatus(coords) {
    if (!state.activeRoute || !state.segmentIndex.length) return;
    const nearest = findNearestPointOnRoute(coords, state.segmentIndex);
    const nextStamp = findNextStamp(coords, state.activeRoute.stamps || []);
    const progress = state.totalDistanceM ? clamp((nearest.distanceAlongM / state.totalDistanceM) * 100, 0, 100) : 0;
    const lineName = routeUsesRepresentativeLine(state.activeRoute) ? '대표 경로선' : 'GPX 경로';

    $('route-distance').textContent = formatDistance(nearest.distanceM);
    $('route-progress').textContent = `${progress.toFixed(1)}%`;
    $('next-stamp').textContent = nextStamp ? `${nextStamp.name} · ${formatDistance(nextStamp.distanceM)}` : '마지막 지점 근처';

    if (nearest.distanceM <= ON_ROUTE_M) {
      $('status-label').textContent = '경로 위에 있습니다';
      $('status-message').textContent = `${lineName}을 잘 따라가고 있습니다.`;
      setChip('on', '정상');
    } else if (nearest.distanceM <= NEAR_ROUTE_M) {
      $('status-label').textContent = '경로 근처입니다';
      $('status-message').textContent = `조금 벗어났을 수 있습니다. 지도 위 ${lineName}을 확인하세요.`;
      setChip('near', '근처');
    } else {
      $('status-label').textContent = '경로에서 벗어났습니다';
      $('status-message').textContent = `가까운 ${lineName}으로 돌아오세요. 대표선 구간은 안내 문구를 함께 확인하세요.`;
      setChip('off', '이탈');
    }
  }

  function setChip(type, text) {
    const chip = $('offroute-chip');
    chip.className = `offroute-chip ${type}`;
    chip.textContent = text;
  }

  function showFlexNote(route) {
    const section = (route.flexibleRouteSections || [])[0];
    const el = $('flex-note');
    if (section?.message) {
      el.textContent = section.message;
      el.hidden = false;
    } else {
      el.hidden = true;
      el.textContent = '';
    }
  }

  function showLocationError(error) {
    $('status-label').textContent = '위치 확인 실패';
    $('status-message').textContent = error?.message || '위치 권한을 허용한 뒤 다시 시도하세요.';
    setChip('neutral', '확인');
    stopFollow();
  }

  function getMapLoadingEl() {
    let loading = $('map-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'map-loading';
      loading.className = 'map-loading';
      $('map-canvas')?.appendChild(loading);
    }
    return loading;
  }

  function resetMapLoading(message) {
    const loading = getMapLoadingEl();
    loading.style.display = 'grid';
    loading.innerHTML = `<div class="loading-cross">✝</div><div>${escapeHtml(message || '지도를 불러오는 중입니다')}</div>`;
  }

  function showMapError(error) {
    const loading = getMapLoadingEl();
    const host = location.hostname || '현재 주소';
    const message = error?.message || '지도를 불러오지 못했습니다.';
    loading.style.display = 'grid';
    loading.innerHTML = `
      <div class="loading-cross">🗺️</div>
      <div class="map-error-box">
        <strong>지도 열기 실패</strong>
        <p>${escapeHtml(message)}</p>
        <p class="map-error-small">도메인 등록이 이미 되어 있다면, 예전 서비스워커/사이트 데이터 캐시 때문에 이전 파일이 계속 실행될 수 있습니다. 현재 접속 도메인: <b>${escapeHtml(host)}</b></p>
        <div class="map-error-actions">
          <button id="retry-map-btn" type="button">다시 불러오기</button>
          <button id="error-copy-link-btn" type="button">주소 복사</button>
        </div>
      </div>`;
    $('retry-map-btn')?.addEventListener('click', () => {
      resetMapLoading('지도를 다시 불러오는 중입니다');
      if (!state.activeRoute) return;
      loadKakaoMap().then(() => drawRoute(state.activeRoute)).catch(showMapError);
    });
    $('error-copy-link-btn')?.addEventListener('click', copyCurrentUrl);
  }

  function buildSegmentIndex(route) {
    const index = [];
    let distanceSoFar = 0;
    (route.routeSegments || []).forEach((segment) => {
      const points = (segment.points || []).filter((p) => isFiniteNumber(p.lat) && isFiniteNumber(p.lng));
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = { lat: Number(points[i].lat), lng: Number(points[i].lng) };
        const b = { lat: Number(points[i + 1].lat), lng: Number(points[i + 1].lng) };
        const d = haversineM(a, b);
        index.push({ a, b, startDistanceM: distanceSoFar, endDistanceM: distanceSoFar + d });
        distanceSoFar += d;
      }
    });
    return index;
  }

  function findNearestPointOnRoute(point, segments) {
    let best = { distanceM: Infinity, distanceAlongM: 0 };
    segments.forEach((segment) => {
      const projected = projectPointToSegment(point, segment.a, segment.b);
      const dist = haversineM(point, projected.point);
      if (dist < best.distanceM) {
        best = {
          distanceM: dist,
          distanceAlongM: segment.startDistanceM + (segment.endDistanceM - segment.startDistanceM) * projected.t
        };
      }
    });
    return best;
  }

  function projectPointToSegment(p, a, b) {
    const latScale = 111320;
    const lngScale = 111320 * Math.cos(toRad((a.lat + b.lat) / 2));
    const ax = a.lng * lngScale;
    const ay = a.lat * latScale;
    const bx = b.lng * lngScale;
    const by = b.lat * latScale;
    const px = p.lng * lngScale;
    const py = p.lat * latScale;
    const dx = bx - ax;
    const dy = by - ay;
    const denom = dx * dx + dy * dy;
    const t = denom ? clamp(((px - ax) * dx + (py - ay) * dy) / denom, 0, 1) : 0;
    return { t, point: { lat: (ay + dy * t) / latScale, lng: (ax + dx * t) / lngScale } };
  }

  function findNextStamp(coords, stamps) {
    const candidates = stamps
      .filter((stamp) => isFiniteNumber(stamp.lat) && isFiniteNumber(stamp.lng))
      .map((stamp) => ({ ...stamp, distanceM: haversineM(coords, { lat: Number(stamp.lat), lng: Number(stamp.lng) }) }))
      .sort((a, b) => a.distanceM - b.distanceM);
    return candidates[0] || null;
  }

  function computeRouteTotalDistance(route) {
    return buildSegmentIndex(route).reduce((_, segment) => segment.endDistanceM, 0);
  }

  function firstPoint(route) {
    for (const segment of route.routeSegments || []) {
      for (const point of segment.points || []) {
        if (isFiniteNumber(point.lat) && isFiniteNumber(point.lng)) return { lat: Number(point.lat), lng: Number(point.lng) };
      }
    }
    return null;
  }

  function toCoords(position) {
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  }

  function haversineM(a, b) {
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '—';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function routeUsesRepresentativeLine(route) {
    return route?.lineType === 'representative' || route?.dataQuality === 'waypoint-representative';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function registerPwa() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      $('install-btn').hidden = false;
    });
    $('install-btn')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      $('install-btn').hidden = true;
    });
  }

  function setupChromeOpenPanel() {
    const panel = $('chrome-open-panel');
    const context = detectAndroidBrowserContext();

    if (context.shouldShowChromePanel) {
      panel.hidden = false;
    } else {
      panel.hidden = true;
    }

    $('open-chrome-btn')?.addEventListener('click', openCurrentPageInChrome);
    $('copy-link-btn')?.addEventListener('click', copyCurrentUrl);
    $('close-chrome-panel')?.addEventListener('click', () => { panel.hidden = true; });
  }

  function detectAndroidBrowserContext() {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone;
    const isKnownInApp = /; wv\)|\bwv\b|Version\/4\.0|KAKAOTALK|NAVER|FBAN|FBAV|Instagram|Line\/|DaumApps/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);
    const isOtherAndroidBrowser = /EdgA|OPR\/|Whale|Firefox/i.test(ua);
    const isRealChrome = /Chrome\//i.test(ua) && !isKnownInApp && !isSamsung && !isOtherAndroidBrowser;
    const canUseIntent = isAndroid && /^https?:$/.test(location.protocol);

    return {
      isAndroid,
      isStandalone,
      isRealChrome,
      shouldShowChromePanel: canUseIntent && !isStandalone && !isRealChrome && (isKnownInApp || isSamsung || isOtherAndroidBrowser)
    };
  }

  function openCurrentPageInChrome() {
    const currentUrl = location.href;
    const protocol = location.protocol === 'http:' ? 'http' : 'https';
    const urlWithoutScheme = currentUrl.replace(/^https?:\/\//, '');
    const fallback = encodeURIComponent(currentUrl);
    const intentUrl = `intent://${urlWithoutScheme}#Intent;scheme=${protocol};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;

    const panel = $('chrome-open-panel');
    const anchor = document.createElement('a');
    anchor.href = intentUrl;
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      if (!detectAndroidBrowserContext().isRealChrome && panel && !panel.hidden) {
        panel.querySelector('p').textContent = '자동 전환이 막히면 주소 복사 후 Chrome 주소창에 붙여넣어 주세요.';
      }
    }, 900);
  }

  async function copyCurrentUrl() {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      showCopyToast('주소를 복사했습니다. Chrome 주소창에 붙여넣어 주세요.');
    } catch (_) {
      window.prompt('아래 주소를 복사해서 Chrome 주소창에 붙여넣어 주세요.', url);
    }
  }

  function showCopyToast(message) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
})();
