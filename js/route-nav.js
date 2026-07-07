(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const state = {
    routes: [],
    activeRoute: null,
    mapProvider: null,
    leafletMap: null,
    routeLayers: [],
    stampLayers: [],
    myMarker: null,
    watchId: null,
    following: false,
    totalDistanceM: 0,
    segmentIndex: [],
    staticProjection: null
  };

  const SEOUL_FALLBACK = { lat: 37.56, lng: 126.98 };
  const ON_ROUTE_M = 45;
  const NEAR_ROUTE_M = 120;
  const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

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

    prepareMapCanvas('지도를 불러오는 중입니다');
    openMap(route);
  }

  function showList() {
    stopFollow();
    destroyMap();
    $('map-view').hidden = true;
    $('route-list-view').hidden = false;
  }

  function openMap(route) {
    if (!/^https?:$/.test(location.protocol)) {
      renderStaticRouteMap(route, new Error('위치 기능과 지도 타일은 https 주소에서 가장 안정적으로 작동합니다. GitHub Pages 주소로 접속해 주세요.'));
      return;
    }

    loadLeaflet()
      .then(() => drawLeafletRoute(route))
      .catch((error) => renderStaticRouteMap(route, error));
  }

  function loadLeaflet() {
    if (window.L?.map) return Promise.resolve();

    return new Promise((resolve, reject) => {
      ensureLeafletCss();

      const old = document.getElementById('leaflet-sdk');
      if (old) old.remove();

      const script = document.createElement('script');
      script.id = 'leaflet-sdk';
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.crossOrigin = '';

      const timer = setTimeout(() => {
        script.remove();
        reject(new Error('지도 라이브러리 연결 시간이 초과되어 경로 전용 보기로 전환했습니다.'));
      }, 10000);

      script.onload = () => {
        clearTimeout(timer);
        if (window.L?.map) {
          resolve();
        } else {
          reject(new Error('지도 라이브러리가 정상적으로 준비되지 않아 경로 전용 보기로 전환했습니다.'));
        }
      };

      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('지도 라이브러리를 불러오지 못해 경로 전용 보기로 전환했습니다.'));
      };

      document.head.appendChild(script);
    });
  }

  function ensureLeafletCss() {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }

  function drawLeafletRoute(route) {
    const L = window.L;
    if (!L?.map) throw new Error('지도 라이브러리가 없습니다.');

    destroyMap();
    state.mapProvider = 'leaflet';
    prepareMapCanvas('지도를 표시하는 중입니다');

    const center = firstPoint(route) || SEOUL_FALLBACK;
    state.leafletMap = L.map('leaflet-map', {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true
    }).setView([center.lat, center.lng], 13);

    L.control.zoom({ position: 'bottomleft' }).addTo(state.leafletMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(state.leafletMap);

    (route.routeSegments || []).forEach((segment) => {
      const points = cleanPoints(segment.points);
      if (points.length < 2) return;
      const layer = L.polyline(points.map((p) => [p.lat, p.lng]), {
        weight: 5,
        opacity: routeUsesRepresentativeLine(route) ? 0.82 : 0.92,
        color: segment.color || route.routeColor || (routeUsesRepresentativeLine(route) ? '#b7791f' : '#1d4ed8'),
        dashArray: routeUsesRepresentativeLine(route) ? '8 8' : null
      }).addTo(state.leafletMap);
      state.routeLayers.push(layer);
    });

    (route.stamps || []).forEach((stamp) => {
      if (!isFiniteNumber(stamp.lat) || !isFiniteNumber(stamp.lng)) return;
      const marker = L.marker([Number(stamp.lat), Number(stamp.lng)], {
        icon: L.divIcon({
          className: 'leaflet-stamp-icon-wrap',
          html: `<div class="leaflet-stamp-marker" title="${escapeHtml(stamp.name || '')}">${escapeHtml(stamp.id || '•')}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(state.leafletMap);
      state.stampLayers.push(marker);
    });

    hideMapLoading();
    setTimeout(() => {
      state.leafletMap?.invalidateSize?.();
      fitRouteBounds();
    }, 80);
  }

  function renderStaticRouteMap(route, error) {
    destroyMap();
    state.mapProvider = 'static';
    prepareMapCanvas('경로 전용 보기를 준비하는 중입니다');

    const canvas = $('map-canvas');
    const loading = $('map-loading');
    const allPoints = collectRoutePoints(route);
    if (!allPoints.length) {
      showMapError(new Error('표시할 경로 좌표가 없습니다.'));
      return;
    }

    const projection = buildStaticProjection(allPoints);
    state.staticProjection = projection;
    const representative = routeUsesRepresentativeLine(route);
    const lineColor = route.routeColor || (representative ? '#b7791f' : '#1d4ed8');

    const svgParts = [];
    (route.routeSegments || []).forEach((segment) => {
      const points = cleanPoints(segment.points).map((point) => projectStaticPoint(point, projection));
      if (points.length < 2) return;
      svgParts.push(`<polyline points="${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${escapeHtml(segment.color || lineColor)}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"${representative ? ' stroke-dasharray="10 10"' : ''}></polyline>`);
    });

    const stampParts = (route.stamps || [])
      .filter((stamp) => isFiniteNumber(stamp.lat) && isFiniteNumber(stamp.lng))
      .map((stamp) => {
        const p = projectStaticPoint({ lat: Number(stamp.lat), lng: Number(stamp.lng) }, projection);
        return `<g class="static-stamp"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14"></circle><text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}">${escapeHtml(stamp.id || '•')}</text></g>`;
      })
      .join('');

    const reason = error?.message || '외부 지도 연결 전용 경로 보기입니다.';
    canvas.insertAdjacentHTML('afterbegin', `
      <div id="static-route-map" class="static-route-map">
        <svg id="static-route-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" aria-label="순례길 경로 전용 보기">
          <rect x="0" y="0" width="1000" height="1000" rx="30" fill="#efe5d6"></rect>
          <g class="static-route-line">${svgParts.join('')}</g>
          <g class="static-stamps">${stampParts}</g>
          <g id="static-my-marker" class="static-my-marker" hidden><circle r="12"></circle><circle r="22"></circle></g>
        </svg>
        <div class="static-map-note">
          <strong>경로 전용 보기</strong>
          <span>${escapeHtml(reason)}</span>
        </div>
      </div>
    `);
    loading.style.display = 'none';

    fitRouteBounds();
  }

  function prepareMapCanvas(message) {
    const canvas = $('map-canvas');
    canvas.innerHTML = `
      <div id="leaflet-map" class="leaflet-map" aria-label="지도 영역"></div>
      <div id="map-loading" class="map-loading">
        <div class="loading-cross">✝</div>
        <div>${escapeHtml(message || '지도를 불러오는 중입니다')}</div>
      </div>
    `;
  }

  function hideMapLoading() {
    const loading = $('map-loading');
    if (loading) loading.style.display = 'none';
  }

  function destroyMap() {
    if (state.leafletMap) {
      state.leafletMap.remove();
    }
    state.leafletMap = null;
    state.routeLayers = [];
    state.stampLayers = [];
    state.myMarker = null;
    state.staticProjection = null;
    state.mapProvider = null;
  }

  function fitRouteBounds() {
    if (!state.activeRoute) return;

    if (state.mapProvider === 'leaflet' && state.leafletMap && window.L?.latLngBounds) {
      const points = collectRoutePoints(state.activeRoute);
      if (!points.length) return;
      const bounds = window.L.latLngBounds(points.map((point) => [point.lat, point.lng]));
      state.leafletMap.fitBounds(bounds, {
        paddingTopLeft: [24, 92],
        paddingBottomRight: [24, 190],
        maxZoom: 17
      });
      return;
    }

    if (state.mapProvider === 'static') {
      const svg = $('static-route-svg');
      if (svg) svg.setAttribute('viewBox', '0 0 1000 1000');
    }
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
    if (!btn) return;
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
    if (state.mapProvider === 'leaflet' && state.leafletMap && window.L?.marker) {
      const L = window.L;
      const pos = [coords.lat, coords.lng];
      const icon = L.divIcon({
        className: 'leaflet-my-location-wrap',
        html: `<div class="leaflet-my-location${options.following ? ' following' : ''}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      if (!state.myMarker) {
        state.myMarker = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(state.leafletMap);
      } else {
        state.myMarker.setLatLng(pos);
        state.myMarker.setIcon(icon);
      }
      if (options.center) state.leafletMap.panTo(pos, { animate: true, duration: 0.35 });
      return;
    }

    if (state.mapProvider === 'static' && state.staticProjection) {
      const marker = $('static-my-marker');
      if (!marker) return;
      const p = projectStaticPoint(coords, state.staticProjection);
      marker.removeAttribute('hidden');
      marker.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    }
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
    stopFollow();
  }

  function showMapError(error) {
    const loading = $('map-loading');
    if (!loading) return;
    const message = error?.message || '지도를 불러오지 못했습니다.';
    loading.style.display = 'grid';
    loading.innerHTML = `
      <div class="loading-cross">🗺️</div>
      <div class="map-error-box">
        <strong>지도 열기 실패</strong>
        <p>${escapeHtml(message)}</p>
        <p class="map-error-small">새로고침 후에도 안 되면 주소 복사 후 Chrome 주소창에 직접 붙여넣어 주세요.</p>
        <div class="map-error-actions">
          <button id="retry-map-btn" type="button">다시 불러오기</button>
          <button id="error-copy-link-btn" type="button">주소 복사</button>
        </div>
      </div>`;
    $('retry-map-btn')?.addEventListener('click', () => {
      prepareMapCanvas('지도를 다시 불러오는 중입니다');
      openMap(state.activeRoute);
    });
    $('error-copy-link-btn')?.addEventListener('click', copyCurrentUrl);
  }

  function buildSegmentIndex(route) {
    const index = [];
    let distanceSoFar = 0;
    (route.routeSegments || []).forEach((segment) => {
      const points = cleanPoints(segment.points);
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
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

  function collectRoutePoints(route) {
    const points = [];
    (route.routeSegments || []).forEach((segment) => {
      points.push(...cleanPoints(segment.points));
    });
    if (!points.length && firstPoint(route)) points.push(firstPoint(route));
    return points;
  }

  function cleanPoints(points) {
    return (points || [])
      .filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng))
      .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
  }

  function buildStaticProjection(points) {
    const projected = points.map((point) => mercatorPoint(point));
    const minX = Math.min(...projected.map((p) => p.x));
    const maxX = Math.max(...projected.map((p) => p.x));
    const minY = Math.min(...projected.map((p) => p.y));
    const maxY = Math.max(...projected.map((p) => p.y));
    return { minX, maxX, minY, maxY, pad: 80 };
  }

  function projectStaticPoint(point, projection) {
    const p = mercatorPoint(point);
    const width = Math.max(projection.maxX - projection.minX, 0.000001);
    const height = Math.max(projection.maxY - projection.minY, 0.000001);
    const scale = Math.min((1000 - projection.pad * 2) / width, (1000 - projection.pad * 2) / height);
    const x = projection.pad + (p.x - projection.minX) * scale + ((1000 - projection.pad * 2) - width * scale) / 2;
    const y = projection.pad + (p.y - projection.minY) * scale + ((1000 - projection.pad * 2) - height * scale) / 2;
    return { x: clamp(x, 20, 980), y: clamp(y, 20, 980) };
  }

  function mercatorPoint(point) {
    const lat = clamp(point.lat, -85, 85);
    const lng = point.lng;
    const x = lng;
    const y = -Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2));
    return { x, y };
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
      if ($('install-btn')) $('install-btn').hidden = false;
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
    if (!panel) return;
    const context = detectAndroidBrowserContext();
    panel.hidden = !context.shouldShowChromePanel;

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
