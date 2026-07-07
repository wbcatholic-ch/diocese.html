(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const AUTO_CENTER_RETURN_DELAY_MS = 15000;
  const STATUS_SHEET_COMPACT = 'compact';
  const STATUS_SHEET_EXPANDED = 'expanded';
  const NAVIGATION_EXPIRE_MS = 8 * 60 * 60 * 1000;
  const TEMP_STATE_KEY = 'gildongmu.pilgrimageRouteNavigation.temp.v1';
  const ON_ROUTE_M = 45;
  const NEAR_ROUTE_M = 120;
  const TRACK_MIN_STEP_M = 5;
  const MAX_TRACK_POINTS = 5000;
  const SEOUL_FALLBACK = { lat: 37.56, lng: 126.98 };

  const state = {
    routes: [],
    activeRoute: null,
    routeDirection: 'forward',
    map: null,
    kakaoReady: false,
    stampMarkers: [],
    arrowOverlays: [],
    myMarker: null,
    traveledPolyline: null,
    futurePolyline: null,
    walkedTrackPolyline: null,
    watchId: null,
    following: false,
    lastCoords: null,
    walkedTrack: [],
    elapsedActiveMs: 0,
    activeSince: null,
    elapsedTimer: null,
    autoCenterPaused: false,
    autoCenterResumeTimer: null,
    mapInteractionHandlersReady: false,
    statusSheetMode: STATUS_SHEET_COMPACT,
    statusSheetPointerStartY: null,
    statusSheetDragMoved: false,
    navigationModel: createEmptyNavigationModel(),
    pendingRestore: null
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    state.routes = Array.isArray(window.PILGRIMAGE_ROUTES) ? window.PILGRIMAGE_ROUTES.filter(Boolean) : [];
    resetInitialView();
    registerPwa();
    setupChromeOpenPanel();
    setupButtons();
    setupStatusSheet();
    setupNavigationLifecycle();
    renderRouteList();
    restoreNavigationIfValid();
  }

  function resetInitialView() {
    if ($('route-list-view')) $('route-list-view').hidden = false;
    if ($('map-view')) $('map-view').hidden = true;
  }

  function setupButtons() {
    $('back-to-list')?.addEventListener('click', handleBackToList);
    $('fit-route-btn')?.addEventListener('click', () => {
      noteManualMapControl('전체 경로 확인');
      fitRouteBounds();
    });
    $('my-location-btn')?.addEventListener('click', locateOnce);
    $('follow-btn')?.addEventListener('click', handleFollowControl);
    $('direction-btn')?.addEventListener('click', toggleRouteDirection);
    $('end-follow-btn')?.addEventListener('click', confirmEndNavigation);
  }

  function setupStatusSheet() {
    const handle = $('sheet-handle');
    if (!handle || !$('status-sheet')) return;
    setStatusSheetMode(STATUS_SHEET_COMPACT);
    handle.addEventListener('click', () => {
      if (state.statusSheetDragMoved) {
        state.statusSheetDragMoved = false;
        return;
      }
      toggleStatusSheetMode();
    });
    handle.addEventListener('pointerdown', (event) => {
      state.statusSheetPointerStartY = event.clientY;
      state.statusSheetDragMoved = false;
      if (typeof handle.setPointerCapture === 'function') {
        try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      }
    });
    handle.addEventListener('pointerup', (event) => {
      finishStatusSheetDrag(event.clientY);
      if (typeof handle.releasePointerCapture === 'function') {
        try { handle.releasePointerCapture(event.pointerId); } catch (_) {}
      }
    });
    handle.addEventListener('pointercancel', () => {
      state.statusSheetPointerStartY = null;
    });
  }

  function finishStatusSheetDrag(endY) {
    if (!Number.isFinite(state.statusSheetPointerStartY)) return;
    const deltaY = endY - state.statusSheetPointerStartY;
    state.statusSheetPointerStartY = null;
    if (Math.abs(deltaY) < 22) return;
    state.statusSheetDragMoved = true;
    setStatusSheetMode(deltaY < 0 ? STATUS_SHEET_EXPANDED : STATUS_SHEET_COMPACT);
  }

  function toggleStatusSheetMode() {
    setStatusSheetMode(state.statusSheetMode === STATUS_SHEET_EXPANDED ? STATUS_SHEET_COMPACT : STATUS_SHEET_EXPANDED);
  }

  function setStatusSheetMode(mode) {
    const sheet = $('status-sheet');
    const handle = $('sheet-handle');
    const label = $('sheet-handle-label');
    if (!sheet) return;
    const nextMode = mode === STATUS_SHEET_EXPANDED ? STATUS_SHEET_EXPANDED : STATUS_SHEET_COMPACT;
    state.statusSheetMode = nextMode;
    sheet.dataset.sheetMode = nextMode;
    if (handle) {
      const expanded = nextMode === STATUS_SHEET_EXPANDED;
      handle.setAttribute('aria-expanded', String(expanded));
      handle.setAttribute('aria-label', expanded ? '정보카드 내리기' : '정보카드 올리기');
      handle.title = expanded ? '정보카드 내리기' : '정보카드 올리기';
    }
    if (label) label.textContent = nextMode === STATUS_SHEET_EXPANDED ? '지도 더 보기' : '정보 보기';
  }

  function setupNavigationLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        touchNavigationActivity({ saveOnly: true });
        return;
      }
      handleNavigationReturn();
    });
    window.addEventListener('pagehide', () => touchNavigationActivity({ saveOnly: true }));
    window.addEventListener('pageshow', handleNavigationReturn);
  }

  function renderRouteList() {
    const list = $('route-list');
    if (!list) return;
    list.innerHTML = '';
    if (!state.routes.length) {
      list.innerHTML = '<div class="notice-card"><strong>순례길 데이터가 없습니다</strong><p>routes 폴더에 순례길 데이터 파일을 추가하세요.</p></div>';
      return;
    }
    state.routes.forEach((route) => {
      const totalKm = computeRouteTotalDistance(route) / 1000;
      const distanceText = route.distanceLabel || `약 ${totalKm.toFixed(1)}km`;
      const representative = routeUsesRepresentativeLine(route);
      const testRoute = routeIsTestRoute(route);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `route-card${representative ? ' representative' : ''}${testRoute ? ' test-route' : ''}`;
      btn.innerHTML = `
        <div class="route-card-main">
          <div class="route-icon">${testRoute ? '🧪' : '🧭'}</div>
          <div class="route-copy">
            <div class="route-name-row">
              <h3 class="route-name">${escapeHtml(route.name || '순례길')}</h3>
              ${testRoute ? '<span class="route-badge test">테스트</span>' : ''}
              ${representative ? '<span class="route-badge">대표선</span>' : ''}
            </div>
            <div class="route-meta">${escapeHtml(route.routeGroup ? route.routeGroup + ' · ' : '')}${escapeHtml(route.startName || '출발지')} → ${escapeHtml(route.finishName || '도착지')}</div>
          </div>
        </div>
        <div class="route-foot"><span>${route.stamps?.length || 0}개 지점${testRoute ? ' · GPX 테스트' : representative ? ' · 대표 경로' : ''}</span><strong>${escapeHtml(distanceText)}</strong></div>
      `;
      btn.addEventListener('click', () => openRoute(route));
      list.appendChild(btn);
    });
  }

  function openRoute(route, options = {}) {
    stopLocationWatch();
    state.activeRoute = route;
    state.routeDirection = normalizeDirection(options.restoreState?.routeDirection || 'forward');
    state.lastCoords = sanitizeCoords(options.restoreState?.lastCoords) || null;
    state.walkedTrack = sanitizeTrack(options.restoreState?.walkedTrack || []);
    state.elapsedActiveMs = sanitizeElapsedMs(options.restoreState?.elapsedActiveMs);
    state.activeSince = null;
    state.following = Boolean(options.restoreState?.following);
    resumeAutoCenter({ skipPan: true });
    rebuildNavigationModel();
    setStatusSheetMode(STATUS_SHEET_COMPACT);

    $('route-list-view').hidden = true;
    $('map-view').hidden = false;
    updateRouteHeader();
    resetStatusForActiveRoute(Boolean(options.restoreState));
    updateFollowButtons();
    showFlexNote(route);
    resetMapLoading('지도를 불러오는 중입니다');

    loadKakaoMap()
      .then(() => drawRoute(route))
      .then(() => {
        if (state.lastCoords) {
          updateMyLocation(state.lastCoords, { center: state.following, following: state.following });
          updateRouteStatus(state.lastCoords);
        }
        if (state.following) startFollow({ restored: true });
        saveNavigationState();
      })
      .catch(showMapError);
  }

  function handleBackToList() {
    if (state.following || state.walkedTrack.length) {
      confirmEndNavigation({ afterEnd: showListWithoutPrompt });
      return;
    }
    showListWithoutPrompt();
  }

  function showListWithoutPrompt() {
    stopLocationWatch();
    clearTemporaryNavigationState();
    clearMapObjects();
    state.activeRoute = null;
    state.lastCoords = null;
    state.walkedTrack = [];
    state.routeDirection = 'forward';
    state.navigationModel = createEmptyNavigationModel();
    $('map-view').hidden = true;
    $('route-list-view').hidden = false;
    updateFollowButtons();
  }

  function resetStatusForActiveRoute(restored) {
    const route = state.activeRoute;
    if (!route) return;
    $('map-title').textContent = route.name || '순례길';
    resetNavigationMetrics();
    setChip('neutral', restored ? '복귀' : '대기');
    $('status-label').textContent = restored ? '따라가기 복귀 준비' : (routeIsTestRoute(route) ? '테스트 경로 준비 완료' : '순례길 준비 완료');
    $('status-message').textContent = restored
      ? '위치를 재확인한 뒤 순례길 따라가기를 이어갑니다.'
      : routeIsTestRoute(route)
        ? '실제 순례기록 저장 없이 GPX 따라가기 기능을 테스트합니다.'
        : routeUsesRepresentativeLine(route)
          ? '내 위치 또는 따라가기를 누르면 대표 경로선과의 거리를 계산합니다.'
          : '내 위치 또는 따라가기를 누르면 GPX 경로와의 거리를 계산합니다.';
  }

  function updateRouteHeader() {
    const route = state.activeRoute;
    if (!route) return;
    const start = state.routeDirection === 'reverse' ? route.finishName : route.startName;
    const finish = state.routeDirection === 'reverse' ? route.startName : route.finishName;
    const directionText = state.routeDirection === 'reverse' ? ' · 역방향' : ' · 정방향';
    const representative = routeUsesRepresentativeLine(route) ? ' · 대표선' : '';
    $('map-title').textContent = route.name || '순례길';
    $('map-subtitle').textContent = `${start || '출발지'} → ${finish || '도착지'}${directionText}${representative}`;
    updateDirectionButton();
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
      setupMapInteractionHandlers();
    } else {
      setupMapInteractionHandlers();
    }
    clearMapObjects({ keepMyLocation: Boolean(state.lastCoords) });
    if ($('map-loading')) $('map-loading').style.display = 'none';
    rebuildNavigationModel();
    renderRouteProgressLines(null);
    renderWalkedTrack();
    renderStampMarkers(route);
    renderDirectionArrows();
    setTimeout(() => {
      if (state.map?.relayout) state.map.relayout();
      if (!state.lastCoords) fitRouteBounds();
      else refreshDirectionArrowsAfterMapMove();
    }, 80);
  }

  function clearMapObjects(options = {}) {
    clearDirectionArrows();
    state.stampMarkers.forEach((item) => item.setMap(null));
    state.stampMarkers = [];
    clearPolyline('traveledPolyline');
    clearPolyline('futurePolyline');
    clearPolyline('walkedTrackPolyline');
    if (!options.keepMyLocation && state.myMarker) {
      state.myMarker.setMap(null);
      state.myMarker = null;
    }
  }

  function clearPolyline(key) {
    if (state[key]) state[key].setMap(null);
    state[key] = null;
  }

  function renderStampMarkers(route) {
    if (!state.map || !window.kakao?.maps) return;
    const KM = kakao.maps;
    (route.stamps || []).forEach((stamp) => {
      if (!isFiniteNumber(stamp.lat) || !isFiniteNumber(stamp.lng)) return;
      const content = document.createElement('div');
      content.className = 'stamp-marker';
      content.textContent = stamp.order || stamp.id || '•';
      content.title = stamp.order ? `${stamp.order}. ${stamp.name || ''}` : (stamp.name || '');
      const overlay = new KM.CustomOverlay({
        position: new KM.LatLng(Number(stamp.lat), Number(stamp.lng)),
        content,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 11
      });
      overlay.setMap(state.map);
      state.stampMarkers.push(overlay);
    });
  }

  function fitRouteBounds() {
    if (!state.map || !state.navigationModel.points.length) return;
    const KM = kakao.maps;
    const bounds = new KM.LatLngBounds();
    state.navigationModel.points.forEach((point) => bounds.extend(new KM.LatLng(point.lat, point.lng)));
    state.map.setBounds(bounds, 86, 24, 170, 24);
    refreshDirectionArrowsAfterMapMove();
  }

  function locateOnce() {
    resumeAutoCenter();
    if (state.lastCoords) {
      updateMyLocation(state.lastCoords, { center: true, following: state.following });
      updateRouteStatus(state.lastCoords);
    }
    getCurrentPosition().then((position) => {
      const coords = toCoords(position);
      handleLocationUpdate(coords, { center: true, fromWatch: false });
    }).catch(showLocationError);
  }

  function handleFollowControl() {
    if (state.following) {
      pauseFollow();
      return;
    }
    startFollow();
  }

  function startFollow(options = {}) {
    if (!state.activeRoute) return;
    if (!navigator.geolocation) {
      showLocationError(new Error('이 기기에서 위치 기능을 사용할 수 없습니다.'));
      return;
    }
    if (isTemporaryNavigationExpired(loadTemporaryNavigationState())) {
      resetExpiredNavigation();
      return;
    }
    state.following = true;
    if (!state.activeSince) state.activeSince = Date.now();
    startElapsedTimer();
    resumeAutoCenter({ skipPan: options.restored && !state.lastCoords });
    updateFollowButtons();
    updateNavigationMetrics();
    $('status-label').textContent = options.restored ? '따라가기 복귀 중' : (state.walkedTrack.length ? '따라가기 재시작' : '따라가기 시작');
    $('status-message').textContent = options.restored ? '현재 위치를 다시 확인해 경로 따라가기를 이어갑니다.' : '현재 위치를 계속 확인합니다.';
    startLocationWatch();
    touchNavigationActivity({ saveOnly: true });
  }

  function pauseFollow() {
    if (!state.following) return;
    finalizeActiveElapsed();
    if (state.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.watchId);
    }
    state.watchId = null;
    state.following = false;
    updateFollowButtons();
    updateNavigationMetrics();
    $('status-label').textContent = '따라가기 정지';
    $('status-message').textContent = '재시작을 누르면 현재 순례길 따라가기를 이어갑니다.';
    setChip('neutral', '정지');
    saveNavigationState();
  }

  function startLocationWatch() {
    if (state.watchId !== null || !navigator.geolocation) return;
    state.watchId = navigator.geolocation.watchPosition((position) => {
      const coords = toCoords(position);
      handleLocationUpdate(coords, { center: !state.autoCenterPaused, fromWatch: true });
    }, showLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    });
  }

  function stopLocationWatch() {
    finalizeActiveElapsed();
    if (state.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.watchId);
    }
    state.watchId = null;
    state.following = false;
    updateFollowButtons();
    updateNavigationMetrics();
  }

  function handleLocationUpdate(coords, options = {}) {
    const clean = sanitizeCoords(coords);
    if (!clean) return;
    state.lastCoords = clean;
    if (state.following) recordWalkedPoint(clean);
    updateMyLocation(clean, { center: options.center, following: state.following });
    updateRouteStatus(clean);
    touchNavigationActivity({ saveOnly: true });
  }

  function recordWalkedPoint(coords) {
    const last = state.walkedTrack[state.walkedTrack.length - 1];
    if (last && haversineM(last, coords) < TRACK_MIN_STEP_M) return;
    state.walkedTrack.push({ lat: coords.lat, lng: coords.lng, at: Date.now() });
    if (state.walkedTrack.length > MAX_TRACK_POINTS) {
      state.walkedTrack.splice(0, state.walkedTrack.length - MAX_TRACK_POINTS);
    }
    renderWalkedTrack();
    updateNavigationMetrics();
  }

  function startElapsedTimer() {
    stopElapsedTimer();
    state.elapsedTimer = setInterval(updateNavigationMetrics, 1000);
  }

  function stopElapsedTimer() {
    if (state.elapsedTimer !== null) clearInterval(state.elapsedTimer);
    state.elapsedTimer = null;
  }

  function finalizeActiveElapsed() {
    if (!state.activeSince) {
      stopElapsedTimer();
      return;
    }
    state.elapsedActiveMs = getCurrentElapsedMs();
    state.activeSince = null;
    stopElapsedTimer();
  }

  function getCurrentElapsedMs() {
    const base = Number.isFinite(state.elapsedActiveMs) ? state.elapsedActiveMs : 0;
    return state.activeSince ? base + Math.max(0, Date.now() - state.activeSince) : base;
  }

  function resetNavigationMetrics() {
    const progressEl = $('route-progress');
    const nextEl = $('next-distance');
    if (progressEl) progressEl.textContent = '—';
    if (nextEl) nextEl.textContent = '—';
    updateNavigationMetrics();
  }

  function updateNavigationMetrics(values = {}) {
    const timeEl = $('exercise-time');
    const distEl = $('exercise-distance');
    const progressEl = $('route-progress');
    const nextEl = $('next-distance');
    if (timeEl) timeEl.textContent = formatDuration(getCurrentElapsedMs());
    if (distEl) distEl.textContent = formatDistance(computeWalkedTrackDistance());
    if (progressEl && Number.isFinite(values.progress)) progressEl.textContent = `${values.progress.toFixed(1)}%`;
    if (nextEl && values.nextStamp) nextEl.textContent = formatDistance(values.nextStamp.remainingM);
    else if (nextEl && values.nextStamp === null) nextEl.textContent = '도착 근처';
  }

  function computeWalkedTrackDistance() {
    let total = 0;
    const track = state.walkedTrack.filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng));
    for (let i = 1; i < track.length; i += 1) total += haversineM(track[i - 1], track[i]);
    return total;
  }

  function sanitizeElapsedMs(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.min(number, NAVIGATION_EXPIRE_MS) : 0;
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

  function confirmEndNavigation(options = {}) {
    if (!state.activeRoute) return;
    const ok = window.confirm('지금까지 이동한 경로가 삭제됩니다.');
    if (!ok) return;
    endNavigation();
    if (typeof options.afterEnd === 'function') options.afterEnd();
    else showListWithoutPrompt();
  }

  function endNavigation() {
    stopLocationWatch();
    clearTemporaryNavigationState();
    state.walkedTrack = [];
    state.elapsedActiveMs = 0;
    state.activeSince = null;
    stopElapsedTimer();
    state.lastCoords = null;
    state.following = false;
    state.autoCenterPaused = false;
    clearTimeout(state.autoCenterResumeTimer);
    state.autoCenterResumeTimer = null;
    renderRouteProgressLines(null);
    renderWalkedTrack();
    if (state.myMarker) {
      state.myMarker.setMap(null);
      state.myMarker = null;
    }
    resetNavigationMetrics();
    updateFollowButtons();
  }

  function setupMapInteractionHandlers() {
    if (!state.map || state.mapInteractionHandlersReady || !window.kakao?.maps?.event) return;
    const events = kakao.maps.event;
    events.addListener(state.map, 'dragstart', () => pauseAutoCenterForManualMapUse(false));
    events.addListener(state.map, 'dragend', () => {
      renderDirectionArrows();
      pauseAutoCenterForManualMapUse(true);
    });
    events.addListener(state.map, 'zoom_start', () => pauseAutoCenterForManualMapUse(false));
    events.addListener(state.map, 'zoom_changed', () => {
      renderDirectionArrows();
      pauseAutoCenterForManualMapUse(true);
    });
    state.mapInteractionHandlersReady = true;
  }

  function noteManualMapControl(reason) {
    if (!state.following) return;
    pauseAutoCenterForManualMapUse(true, reason);
  }

  function pauseAutoCenterForManualMapUse(scheduleReturn, reason = '지도 확인 중') {
    if (!state.following) return;
    state.autoCenterPaused = true;
    clearTimeout(state.autoCenterResumeTimer);
    $('status-message').textContent = `${reason} · 15초 후 내 위치로 복귀`;
    if (scheduleReturn) scheduleAutoCenterReturn();
    touchNavigationActivity({ saveOnly: true });
  }

  function scheduleAutoCenterReturn() {
    clearTimeout(state.autoCenterResumeTimer);
    state.autoCenterResumeTimer = setTimeout(() => {
      if (!state.following) return;
      resumeAutoCenter();
      if (state.lastCoords) {
        updateMyLocation(state.lastCoords, { center: true, following: true });
        updateRouteStatus(state.lastCoords);
      }
    }, AUTO_CENTER_RETURN_DELAY_MS);
  }

  function resumeAutoCenter(options = {}) {
    state.autoCenterPaused = false;
    clearTimeout(state.autoCenterResumeTimer);
    state.autoCenterResumeTimer = null;
    if (!options.skipPan && state.following && state.lastCoords) {
      updateMyLocation(state.lastCoords, { center: true, following: true });
    }
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
    if (options.center) {
      state.map.panTo(pos);
      refreshDirectionArrowsAfterMapMove();
    }
  }

  function updateRouteStatus(coords) {
    if (!state.activeRoute || !state.navigationModel.segments.length) return;
    const nearest = findNearestPointOnRoute(coords, state.navigationModel.segments);
    const nextStamp = findNextStampByProgress(nearest.distanceAlongM);
    const progress = state.navigationModel.totalDistanceM ? clamp((nearest.distanceAlongM / state.navigationModel.totalDistanceM) * 100, 0, 100) : 0;
    const lineName = routeUsesRepresentativeLine(state.activeRoute) ? '대표 경로선' : 'GPX 경로';

    updateNavigationMetrics({ progress, nextStamp });
    renderRouteProgressLines(nearest.distanceAlongM);

    if (state.autoCenterPaused && state.following) return;

    if (nearest.distanceM <= ON_ROUTE_M) {
      $('status-label').textContent = '경로 위에 있습니다';
      $('status-message').textContent = `${directionText()}으로 ${lineName}을 잘 따라가고 있습니다.`;
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
    if (!chip) return;
    chip.className = `offroute-chip ${type}`;
    chip.textContent = text;
  }

  function showFlexNote(route) {
    const section = (route.flexibleRouteSections || [])[0];
    const el = $('flex-note');
    if (!el) return;
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
    stopLocationWatch();
    saveNavigationState();
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

  function rebuildNavigationModel() {
    const points = getDirectedRoutePoints(state.activeRoute, state.routeDirection);
    const segments = buildSegmentIndexFromPoints(points);
    const totalDistanceM = segments.length ? segments[segments.length - 1].endDistanceM : 0;
    const stamps = buildDirectedStampIndex(state.activeRoute, segments);
    state.navigationModel = { points, segments, totalDistanceM, stamps };
  }

  function createEmptyNavigationModel() {
    return { points: [], segments: [], totalDistanceM: 0, stamps: [] };
  }

  function getDirectedRoutePoints(route, direction) {
    const points = flattenRoutePoints(route);
    return direction === 'reverse' ? points.slice().reverse() : points;
  }

  function flattenRoutePoints(route) {
    const result = [];
    (route?.routeSegments || []).forEach((segment) => {
      (segment.points || []).forEach((point) => {
        if (!isFiniteNumber(point.lat) || !isFiniteNumber(point.lng)) return;
        pushUniquePoint(result, { lat: Number(point.lat), lng: Number(point.lng) });
      });
    });
    return result;
  }

  function buildSegmentIndexFromPoints(points) {
    const index = [];
    let distanceSoFar = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const d = haversineM(a, b);
      if (!Number.isFinite(d) || d <= 0) continue;
      index.push({ a, b, startDistanceM: distanceSoFar, endDistanceM: distanceSoFar + d });
      distanceSoFar += d;
    }
    return index;
  }

  function buildDirectedStampIndex(route, segments) {
    const stamps = (route?.stamps || [])
      .filter((stamp) => isFiniteNumber(stamp.lat) && isFiniteNumber(stamp.lng))
      .map((stamp) => {
        const nearest = findNearestPointOnRoute({ lat: Number(stamp.lat), lng: Number(stamp.lng) }, segments);
        return { ...stamp, distanceAlongM: nearest.distanceAlongM };
      })
      .filter((stamp) => Number.isFinite(stamp.distanceAlongM))
      .sort((a, b) => a.distanceAlongM - b.distanceAlongM);
    return stamps;
  }

  function findNearestPointOnRoute(point, segments) {
    let best = { distanceM: Infinity, distanceAlongM: 0, point: null };
    segments.forEach((segment) => {
      const projected = projectPointToSegment(point, segment.a, segment.b);
      const dist = haversineM(point, projected.point);
      if (dist < best.distanceM) {
        best = {
          distanceM: dist,
          distanceAlongM: segment.startDistanceM + (segment.endDistanceM - segment.startDistanceM) * projected.t,
          point: projected.point
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

  function findNextStampByProgress(distanceAlongM) {
    const stamps = state.navigationModel.stamps || [];
    const next = stamps.find((stamp) => stamp.distanceAlongM >= distanceAlongM + 15);
    if (!next) return null;
    return { ...next, remainingM: Math.max(0, next.distanceAlongM - distanceAlongM) };
  }

  function computeRouteTotalDistance(route) {
    return buildSegmentIndexFromPoints(flattenRoutePoints(route)).reduce((_, segment) => segment.endDistanceM, 0);
  }

  function renderRouteProgressLines(distanceAlongM) {
    if (!state.map || !window.kakao?.maps || !state.navigationModel.points.length) return;
    const total = state.navigationModel.totalDistanceM;
    const splitM = Number.isFinite(distanceAlongM) ? clamp(distanceAlongM, 0, total) : 0;
    const traveled = splitM > 0 ? buildPathForDistanceRange(0, splitM) : [];
    const future = buildPathForDistanceRange(splitM, total);
    setPolylinePath('traveledPolyline', traveled, {
      strokeWeight: 6,
      strokeColor: '#94a3b8',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });
    setPolylinePath('futurePolyline', future, {
      strokeWeight: 6,
      strokeColor: routeUsesRepresentativeLine(state.activeRoute) ? '#b7791f' : '#1d4ed8',
      strokeOpacity: 0.95,
      strokeStyle: routeUsesRepresentativeLine(state.activeRoute) ? 'shortdash' : 'solid'
    });
  }

  function renderWalkedTrack() {
    if (!state.map || !window.kakao?.maps) return;
    const track = state.walkedTrack.filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng));
    setPolylinePath('walkedTrackPolyline', track, {
      strokeWeight: 4,
      strokeColor: '#7a4f10',
      strokeOpacity: 0.78,
      strokeStyle: 'shortdash'
    });
  }

  function setPolylinePath(key, coords, style) {
    if (!state.map || !window.kakao?.maps) return;
    const path = coords.map((point) => new kakao.maps.LatLng(point.lat, point.lng));
    if (path.length < 2) {
      if (state[key]) state[key].setPath([]);
      return;
    }
    if (!state[key]) {
      state[key] = new kakao.maps.Polyline({ path, ...style });
      state[key].setMap(state.map);
      return;
    }
    state[key].setOptions(style);
    state[key].setPath(path);
  }

  function buildPathForDistanceRange(startM, endM) {
    const segments = state.navigationModel.segments;
    const total = state.navigationModel.totalDistanceM;
    const start = clamp(startM, 0, total);
    const end = clamp(endM, 0, total);
    if (!segments.length || end <= start) return [];
    const path = [];
    pushUniquePoint(path, getPointAtDistance(start));
    segments.forEach((segment) => {
      if (segment.endDistanceM <= start || segment.startDistanceM >= end) return;
      if (segment.startDistanceM > start) pushUniquePoint(path, segment.a);
      if (segment.endDistanceM < end) pushUniquePoint(path, segment.b);
    });
    pushUniquePoint(path, getPointAtDistance(end));
    return path;
  }

  function getPointAtDistance(distanceM) {
    const segments = state.navigationModel.segments;
    if (!segments.length) return state.navigationModel.points[0] || SEOUL_FALLBACK;
    const total = state.navigationModel.totalDistanceM;
    const distance = clamp(distanceM, 0, total);
    const segment = segments.find((item) => item.startDistanceM <= distance && item.endDistanceM >= distance) || segments[segments.length - 1];
    const length = segment.endDistanceM - segment.startDistanceM;
    const t = length ? clamp((distance - segment.startDistanceM) / length, 0, 1) : 0;
    return interpolatePoint(segment.a, segment.b, t);
  }

  function getBearingAtDistance(distanceM) {
    const segments = state.navigationModel.segments;
    if (!segments.length) return 0;
    const total = state.navigationModel.totalDistanceM;
    const distance = clamp(distanceM, 0, total);
    const segment = segments.find((item) => item.startDistanceM <= distance && item.endDistanceM >= distance) || segments[segments.length - 1];
    return bearingDeg(segment.a, segment.b);
  }

  function renderDirectionArrows() {
    clearDirectionArrows();
    if (!state.map || !window.kakao?.maps || !state.navigationModel.totalDistanceM) return;
    getArrowDistancesForCurrentView().forEach((distance) => renderDirectionArrowAtDistance(distance));
  }

  function renderDirectionArrowAtDistance(distance) {
    const point = getPointAtDistance(distance);
    const bearing = getBearingAtDistance(distance);
    const content = document.createElement('div');
    content.className = 'direction-arrow';
    content.style.transform = `rotate(${bearing}deg)`;
    content.textContent = '▲';
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(point.lat, point.lng),
      content,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 12
    });
    overlay.setMap(state.map);
    state.arrowOverlays.push(overlay);
  }

  function clearDirectionArrows() {
    state.arrowOverlays.forEach((overlay) => overlay.setMap(null));
    state.arrowOverlays = [];
  }

  function refreshDirectionArrowsAfterMapMove() {
    window.setTimeout(renderDirectionArrows, 180);
  }

  function getArrowDistancesForCurrentView() {
    const total = state.navigationModel.totalDistanceM;
    const desiredCount = getArrowCountForZoom();
    if (!total || desiredCount <= 0) return [];

    const visibleDistances = getVisibleArrowDistances();
    if (visibleDistances.length) {
      return pickEvenlySpacedDistances(visibleDistances, Math.min(desiredCount, visibleDistances.length));
    }

    const fallback = [];
    for (let i = 1; i <= desiredCount; i += 1) {
      fallback.push(total * (i / (desiredCount + 1)));
    }
    return fallback;
  }

  function getVisibleArrowDistances() {
    const bounds = state.map?.getBounds?.();
    const center = getMapCenterPoint();
    const candidates = [];
    if (!bounds || !center) return candidates;

    state.navigationModel.segments.forEach((segment) => {
      if (!segmentCanTouchBounds(segment, bounds)) return;
      const projected = projectPointToSegment(center, segment.a, segment.b);
      const projectedDistance = segment.startDistanceM + (segment.endDistanceM - segment.startDistanceM) * projected.t;
      const midpoint = interpolatePoint(segment.a, segment.b, 0.5);
      const midpointDistance = (segment.startDistanceM + segment.endDistanceM) / 2;

      if (pointIsInMapBounds(projected.point, bounds)) {
        candidates.push(projectedDistance);
      } else if (pointIsInMapBounds(midpoint, bounds)) {
        candidates.push(midpointDistance);
      } else if (pointIsInMapBounds(segment.a, bounds)) {
        candidates.push(segment.startDistanceM);
      } else if (pointIsInMapBounds(segment.b, bounds)) {
        candidates.push(segment.endDistanceM);
      }
    });

    return candidates.sort((a, b) => a - b);
  }

  function pickEvenlySpacedDistances(distances, count) {
    const unique = [];
    distances.forEach((distance) => {
      const rounded = Math.round(distance);
      if (!unique.length || Math.abs(unique[unique.length - 1] - rounded) >= 3) unique.push(rounded);
    });
    if (!unique.length) return [];
    const safeCount = Math.max(1, Math.min(count, unique.length));
    if (safeCount === 1) return [unique[Math.floor(unique.length / 2)]];
    const selected = [];
    for (let i = 0; i < safeCount; i += 1) {
      const index = Math.round((unique.length - 1) * (i / (safeCount - 1)));
      const value = unique[index];
      if (!selected.includes(value)) selected.push(value);
    }
    return selected;
  }

  function getMapCenterPoint() {
    const center = state.map?.getCenter?.();
    if (!center || typeof center.getLat !== 'function' || typeof center.getLng !== 'function') return null;
    return { lat: center.getLat(), lng: center.getLng() };
  }

  function pointIsInMapBounds(point, bounds) {
    if (!point || !bounds) return false;
    try {
      if (typeof bounds.contain === 'function') {
        return bounds.contain(new kakao.maps.LatLng(point.lat, point.lng));
      }
    } catch (_) {}
    const edges = getBoundsEdges(bounds);
    if (!edges) return false;
    return point.lat >= edges.south && point.lat <= edges.north && point.lng >= edges.west && point.lng <= edges.east;
  }

  function segmentCanTouchBounds(segment, bounds) {
    if (pointIsInMapBounds(segment.a, bounds) || pointIsInMapBounds(segment.b, bounds)) return true;
    const edges = getBoundsEdges(bounds);
    if (!edges) return false;
    const minLat = Math.min(segment.a.lat, segment.b.lat);
    const maxLat = Math.max(segment.a.lat, segment.b.lat);
    const minLng = Math.min(segment.a.lng, segment.b.lng);
    const maxLng = Math.max(segment.a.lng, segment.b.lng);
    return maxLat >= edges.south && minLat <= edges.north && maxLng >= edges.west && minLng <= edges.east;
  }

  function getBoundsEdges(bounds) {
    const sw = bounds?.getSouthWest?.();
    const ne = bounds?.getNorthEast?.();
    if (!sw || !ne || typeof sw.getLat !== 'function' || typeof ne.getLat !== 'function') return null;
    return {
      south: sw.getLat(),
      west: sw.getLng(),
      north: ne.getLat(),
      east: ne.getLng()
    };
  }

  function getArrowCountForZoom() {
    const level = Number(state.map?.getLevel?.() || 8);
    if (level >= 11) return 1;
    if (level >= 9) return 2;
    if (level >= 7) return 3;
    if (level >= 5) return 6;
    return 10;
  }

  function toggleRouteDirection() {
    if (!state.activeRoute) return;
    state.routeDirection = state.routeDirection === 'forward' ? 'reverse' : 'forward';
    rebuildNavigationModel();
    updateRouteHeader();
    renderRouteProgressLines(null);
    renderDirectionArrows();
    if (state.lastCoords) updateRouteStatus(state.lastCoords);
    touchNavigationActivity({ saveOnly: true });
  }

  function updateFollowButtons() {
    const followBtn = $('follow-btn');
    const endBtn = $('end-follow-btn');
    const directionBtn = $('direction-btn');
    const row = followBtn?.closest('.nav-control-row');
    const hasTrack = state.walkedTrack.length > 0 || state.elapsedActiveMs > 0 || Boolean(state.lastCoords);
    if (followBtn) {
      followBtn.classList.toggle('pause', state.following);
      followBtn.classList.toggle('start', !state.following);
      followBtn.disabled = false;
      followBtn.innerHTML = state.following
        ? '정지 <span aria-hidden="true">Ⅱ</span>'
        : hasTrack
          ? '재시작 <span aria-hidden="true">▶</span>'
          : '시작 <span aria-hidden="true">▶</span>';
    }
    if (endBtn) endBtn.hidden = state.following || !hasTrack;
    if (directionBtn) directionBtn.hidden = !state.activeRoute;
    if (row) {
      row.classList.toggle('single', false);
      row.classList.toggle('has-end', !state.following && hasTrack);
    }
    updateDirectionButton();
  }

  function updateDirectionButton() {
    const btn = $('direction-btn');
    if (!btn) return;
    const label = state.routeDirection === 'forward' ? '역방향' : '정방향';
    const span = btn.querySelector('span');
    if (span) span.textContent = label;
    else btn.textContent = label;
    btn.title = state.routeDirection === 'forward' ? '역방향으로 걷기' : '정방향으로 걷기';
  }

  function directionText() {
    return state.routeDirection === 'reverse' ? '역방향' : '정방향';
  }

  function handleNavigationReturn() {
    const saved = loadTemporaryNavigationState();
    if (isTemporaryNavigationExpired(saved)) {
      resetExpiredNavigation();
      return;
    }
    if (!state.activeRoute || !state.following) return;
    $('status-label').textContent = '위치 재확인 중';
    $('status-message').textContent = '순례길 따라가기를 다시 연결하고 있습니다.';
    startLocationWatch();
    getCurrentPosition()
      .then((position) => handleLocationUpdate(toCoords(position), { center: true, fromWatch: false }))
      .catch(() => saveNavigationState());
  }

  function restoreNavigationIfValid() {
    const saved = loadTemporaryNavigationState();
    if (!saved) return;
    if (isTemporaryNavigationExpired(saved)) {
      clearTemporaryNavigationState();
      return;
    }
    const route = state.routes.find((item) => item.id === saved.routeId);
    if (!route) {
      clearTemporaryNavigationState();
      return;
    }
    openRoute(route, { restoreState: saved });
  }

  function touchNavigationActivity(options = {}) {
    if (!state.activeRoute) return;
    if (!options.saveOnly && isTemporaryNavigationExpired(loadTemporaryNavigationState())) {
      resetExpiredNavigation();
      return;
    }
    saveNavigationState();
  }

  function saveNavigationState() {
    if (!state.activeRoute) return;
    const data = {
      routeId: state.activeRoute.id,
      routeDirection: state.routeDirection,
      following: state.following,
      lastCoords: state.lastCoords,
      walkedTrack: state.walkedTrack,
      elapsedActiveMs: getCurrentElapsedMs(),
      lastActiveAt: Date.now()
    };
    try {
      localStorage.setItem(TEMP_STATE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function loadTemporaryNavigationState() {
    try {
      const raw = localStorage.getItem(TEMP_STATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function clearTemporaryNavigationState() {
    try { localStorage.removeItem(TEMP_STATE_KEY); } catch (_) {}
  }

  function isTemporaryNavigationExpired(saved) {
    if (!saved?.lastActiveAt) return false;
    return Date.now() - Number(saved.lastActiveAt) >= NAVIGATION_EXPIRE_MS;
  }

  function resetExpiredNavigation() {
    stopLocationWatch();
    clearTemporaryNavigationState();
    state.walkedTrack = [];
    state.elapsedActiveMs = 0;
    state.activeSince = null;
    stopElapsedTimer();
    state.lastCoords = null;
    state.following = false;
    updateFollowButtons();
    if (state.activeRoute) {
      renderRouteProgressLines(null);
      renderWalkedTrack();
      $('status-label').textContent = '따라가기 초기화';
      $('status-message').textContent = '8시간 이상 사용하지 않아 임시 따라가기 상태를 초기화했습니다.';
      setChip('neutral', '초기화');
    }
  }

  function firstPoint(route) {
    for (const segment of route?.routeSegments || []) {
      for (const point of segment.points || []) {
        if (isFiniteNumber(point.lat) && isFiniteNumber(point.lng)) return { lat: Number(point.lat), lng: Number(point.lng) };
      }
    }
    return null;
  }

  function toCoords(position) {
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  }

  function sanitizeCoords(coords) {
    if (!coords || !isFiniteNumber(coords.lat) || !isFiniteNumber(coords.lng)) return null;
    return { lat: Number(coords.lat), lng: Number(coords.lng) };
  }

  function sanitizeTrack(track) {
    if (!Array.isArray(track)) return [];
    return track.map(sanitizeCoords).filter(Boolean).slice(-MAX_TRACK_POINTS);
  }

  function pushUniquePoint(points, point) {
    if (!point || !isFiniteNumber(point.lat) || !isFiniteNumber(point.lng)) return;
    const last = points[points.length - 1];
    if (last && Math.abs(last.lat - point.lat) < 1e-10 && Math.abs(last.lng - point.lng) < 1e-10) return;
    points.push({ lat: Number(point.lat), lng: Number(point.lng) });
  }

  function interpolatePoint(a, b, t) {
    return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
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

  function bearingDeg(a, b) {
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLng = toRad(b.lng - a.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
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

  function normalizeDirection(value) {
    return value === 'reverse' ? 'reverse' : 'forward';
  }

  function routeUsesRepresentativeLine(route) {
    return route?.lineType === 'representative' || route?.dataQuality === 'waypoint-representative';
  }

  function routeIsTestRoute(route) {
    return route?.type === 'test_route' || route?.testOnly === true || route?.dataQuality === 'user-test-gpx';
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
    if (panel) panel.hidden = !context.shouldShowChromePanel;
    $('open-chrome-btn')?.addEventListener('click', openCurrentPageInChrome);
    $('copy-link-btn')?.addEventListener('click', copyCurrentUrl);
    $('close-chrome-panel')?.addEventListener('click', () => { if (panel) panel.hidden = true; });
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
