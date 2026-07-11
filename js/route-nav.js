(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const AUTO_CENTER_RETURN_DELAY_MS = 15000;
  const STATUS_SHEET_HIDDEN = 'hidden';
  const STATUS_SHEET_COMPACT = 'compact';
  const STATUS_SHEET_EXPANDED = 'expanded';
  const NAVIGATION_EXPIRE_MS = 8 * 60 * 60 * 1000;
  const TEMP_STATE_KEY = 'gildongmu.pilgrimageRouteNavigation.temp.v1';
  const ON_ROUTE_M = 45;
  const NEAR_ROUTE_M = 120;
  const TRACK_MIN_STEP_M = 5;
  const MAX_TRACK_POINTS = 5000;
  const SEOUL_FALLBACK = { lat: 37.56, lng: 126.98 };

  const NATIONAL_TRAIL_CATALOG = [
    {
      id: 'hanti',
      title: '한티가는길',
      diocese: '대구대교구',
      icon: '⛰️',
      dataGroup: '한티가는길',
      location: '경북 칠곡 (가실성당~한티순교성지)',
      officialUrl: 'https://hantigil.or.kr/index',
      highlight: true,
      myDiocese: true,
      description: '가실성당에서 한티순교성지까지 이어지는 순례길입니다.'
    },
    {
      id: 'seoul',
      title: '천주교 서울 순례길',
      diocese: '서울대교구',
      icon: '✝️',
      dataGroup: '서울순례길',
      location: '서울시',
      officialUrl: 'https://martyrs.or.kr/_web/mpilgrims/about.html',
      description: '천주교 서울 순례길과 김대건 신부 치명 순교길을 별도로 선택합니다.'
    },
    {
      id: 'suwon-didim',
      title: '성지순례길 ‘디딤길’',
      diocese: '수원교구',
      icon: '🙏',
      location: '경기 수원시',
      officialUrl: 'https://www.casuwon.or.kr/holyland/pilgrimage',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'wonju-nimui',
      title: '원주교구 순례길 ‘님의 길’',
      diocese: '원주교구',
      icon: '🌿',
      dataGroup: '님의 길',
      location: '강원 원주·횡성, 충북 제천',
      officialUrl: 'https://sunraegil.seoji.net/course/all',
      description: '님의 길의 연결 가능한 GPX 코스를 선택합니다.'
    },
    {
      id: 'gwangju',
      title: '광주대교구 순례길',
      diocese: '광주대교구',
      icon: '🕊️',
      location: '전남 나주·영광',
      officialUrl: 'https://www.gjcatholic.or.kr/holyland/pilgrimage/noan_naju',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'jeju-santo',
      title: '천주교 제주교구 순례길',
      diocese: '제주교구',
      icon: '🌊',
      location: '제주',
      officialUrl: 'http://santoviaggio.com/',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'andong',
      title: '사제와 함께하는 도보순례',
      diocese: '안동교구',
      icon: '👣',
      location: '경북 문경·상주',
      officialUrl: 'https://www.acatholic.or.kr/sub4/sub2.asp',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'jeonju',
      title: '전주교구 순례길',
      diocese: '전주교구',
      icon: '🌾',
      dataGroup: '전주교구 순례길',
      location: '전북 완주·전주',
      officialUrl: 'https://www.jcatholic.or.kr/theme/main/pages/pilgrimage01.html',
      description: '요안루갈다길·순교자길·치명자길을 선택할 수 있습니다.'
    },
    {
      id: 'boryeong-galmaemot',
      title: '보령 갈매못 성지순례길',
      diocese: '보령시',
      icon: '🌅',
      location: '충남 보령',
      officialUrl: 'https://www.brcn.go.kr/tour/sub02_02_02.do',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'naepo',
      title: '내포 천주교 순례길',
      diocese: '사단법인 내포문화숲길',
      icon: '🌲',
      location: '충남 예산·서산',
      officialUrl: 'https://naepotrail.org/course/catholic',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    },
    {
      id: 'beogeunae',
      title: '버그내순례길',
      diocese: '당진시청',
      icon: '🏞️',
      location: '충남 당진',
      officialUrl: 'https://beogeunae.dangjin.go.kr/pil1.html',
      description: '상세 GPX 코스는 아직 이 독립 PWA에 연결하지 않았습니다.'
    }
  ];

  const state = {
    routes: [],
    activeRoute: null,
    activeTrailCatalogId: null,
    routeDirection: 'forward',
    map: null,
    kakaoReady: false,
    stampMarkers: [],
    landmarkMarkers: [],
    stampInfoOverlay: null,
    arrowOverlays: [],
    myMarker: null,
    traveledPolyline: null,
    futurePolyline: null,
    walkedTrackPolyline: null,
    routeSegmentPolylines: [],
    courseLabelOverlays: [],
    watchId: null,
    following: false,
    lastCoords: null,
    walkedTrack: [],
    elapsedActiveMs: 0,
    activeSince: null,
    elapsedTimer: null,
    autoCenterPaused: false,
    autoCenterResumeTimer: null,
    mapExitBackPrimed: false,
    mapExitBackTimer: null,
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
    $('national-close-btn')?.addEventListener('click', closeNationalList);
    $('back-to-list')?.addEventListener('click', handleBackToList);
    $('my-location-btn')?.addEventListener('click', locateOnce);
    $('follow-btn')?.addEventListener('click', handleFollowControl);
    $('direction-btn')?.addEventListener('click', toggleRouteDirection);
    $('end-follow-btn')?.addEventListener('click', confirmEndNavigation);
  }

  function closeNationalList() {
    if (history.length > 1) {
      history.back();
      return;
    }
    try { window.close(); } catch (_) {}
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
    if (state.statusSheetMode === STATUS_SHEET_HIDDEN) {
      setStatusSheetMode(STATUS_SHEET_COMPACT);
      return;
    }
    setStatusSheetMode(state.statusSheetMode === STATUS_SHEET_EXPANDED ? STATUS_SHEET_COMPACT : STATUS_SHEET_EXPANDED);
  }

  function setStatusSheetMode(mode) {
    const sheet = $('status-sheet');
    const handle = $('sheet-handle');
    const label = $('sheet-handle-label');
    if (!sheet) return;
    const nextMode = [STATUS_SHEET_HIDDEN, STATUS_SHEET_COMPACT, STATUS_SHEET_EXPANDED].includes(mode) ? mode : STATUS_SHEET_COMPACT;
    state.statusSheetMode = nextMode;
    sheet.dataset.sheetMode = nextMode;
    if (handle) {
      const expanded = nextMode === STATUS_SHEET_EXPANDED;
      const hidden = nextMode === STATUS_SHEET_HIDDEN;
      handle.setAttribute('aria-expanded', String(expanded));
      handle.setAttribute('aria-label', hidden ? '정보카드 올리기' : expanded ? '정보카드 내리기' : '정보카드 올리기');
      handle.title = hidden ? '정보카드 올리기' : expanded ? '정보카드 내리기' : '정보카드 올리기';
    }
    if (label) label.textContent = nextMode === STATUS_SHEET_HIDDEN ? '정보 보기' : nextMode === STATUS_SHEET_EXPANDED ? '지도 더 보기' : '정보 보기';
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
    window.addEventListener('popstate', handleBrowserBackRequest);
  }

  function renderRouteList() {
    if (state.activeTrailCatalogId) {
      renderTrailDetail(state.activeTrailCatalogId);
      return;
    }
    renderNationalTrailList();
  }

  function renderNationalTrailList() {
    const list = $('route-list');
    $('route-list-view')?.classList.remove('detail-mode');
    updateRouteListHero('전국 가톨릭 순례길', '목록을 누르면 상세 코스로 이동합니다.', true);
    if (!list) return;
    list.innerHTML = '';
    NATIONAL_TRAIL_CATALOG.forEach((trail) => {
      const card = document.createElement('article');
      card.className = `national-trail-card${trail.highlight ? ' featured' : ''}`;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${trail.title} 상세 코스 보기`);
      card.innerHTML = `
        <div class="national-trail-body">
          <div class="national-trail-badges">
            <span class="diocese-pill">${escapeHtml(trail.diocese || '')}</span>
            ${trail.myDiocese ? '<span class="my-diocese-pill">나의 교구</span>' : ''}
          </div>
          <div class="national-trail-main">
            <span class="national-trail-icon" aria-hidden="true">${escapeHtml(trail.icon || '🧭')}</span>
            <span class="national-trail-copy">
              <strong>${escapeHtml(trail.title)}</strong>
              <em>📍 ${escapeHtml(trail.location || trail.diocese || '')}</em>
            </span>
          </div>
        </div>
        <div class="national-trail-foot">
          <button type="button" class="national-website-btn" data-url="${escapeHtml(trail.officialUrl || '')}">공식 홈페이지 열기</button>
        </div>
      `;
      card.addEventListener('click', (event) => {
        if (event.target.closest('.national-website-btn')) return;
        openTrailDetail(trail.id);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openTrailDetail(trail.id);
      });
      card.querySelector('.national-website-btn')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openExternalUrl(event.currentTarget.dataset.url);
      });
      list.appendChild(card);
    });
  }

  function openTrailDetail(trailId) {
    state.activeTrailCatalogId = trailId;
    renderRouteList();
    $('route-list-view')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function closeTrailDetail() {
    state.activeTrailCatalogId = null;
    renderRouteList();
    $('route-list-view')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function renderTrailDetail(trailId) {
    const list = $('route-list');
    const trail = NATIONAL_TRAIL_CATALOG.find((item) => item.id === trailId);
    $('route-list-view')?.classList.add('detail-mode');
    updateRouteListHero('', '', false);
    if (!list) return;
    list.innerHTML = '';
    if (!trail) return;

    const group = buildTrailDetailGroup(trail);
    if (group) {
      renderRouteGroupCard(list, group);
      return;
    }
    renderUnavailableTrailDetail(list, trail);
  }

  function updateRouteListHero(title, description, visible = true) {
    const hero = document.querySelector('.hero-card');
    if (hero) hero.hidden = !visible;
    if ($('route-list-title')) $('route-list-title').textContent = title;
    if ($('route-list-desc')) $('route-list-desc').textContent = description;
  }


  function buildTrailDetailGroup(trail) {
    if (trail.id === 'hanti') {
      const route = state.routes.find((item) => item.id === 'hanti' || item.routeGroup === '한티가는길');
      if (!route) return null;
      return { ...buildHantiRouteGroup(route), officialUrl: trail.officialUrl, detailLines: trail.detailLines || [] };
    }
    if (trail.id === 'seoul') {
      const routes = state.routes.filter((route) => route?.routeGroup === '서울순례길');
      if (!routes.length) return null;
      return { ...buildSeoulRouteGroup(routes), officialUrl: trail.officialUrl, detailLines: trail.detailLines || [] };
    }
    if (trail.id === 'wonju-nimui') {
      const routes = state.routes.filter((route) => route?.routeGroup === '님의 길');
      if (!routes.length) return null;
      return { ...buildNimuiRouteGroup(routes), officialUrl: trail.officialUrl, detailLines: trail.detailLines || [] };
    }
    if (trail.id === 'jeonju') {
      const routes = state.routes.filter((route) => route?.region === '전주교구');
      if (!routes.length) return null;
      return { ...buildJeonjuRouteGroup(routes), officialUrl: trail.officialUrl, detailLines: trail.detailLines || [] };
    }
    return null;
  }

  function renderUnavailableTrailDetail(list, trail) {
    const card = document.createElement('section');
    card.className = `route-card route-group-card route-detail-card${group.id ? ` ${group.id}` : ''}`;
    card.innerHTML = `
      <div class="route-card-main route-detail-title-row">
        <div class="route-icon">${escapeHtml(trail.icon || '🧭')}</div>
        <div class="route-copy">
          <div class="route-name-row"><h3 class="route-name">${escapeHtml(trail.title)}</h3></div>
        </div>
        <button type="button" class="route-detail-close-btn" aria-label="상세 닫기">×</button>
      </div>
      <div class="trail-detail-note">${escapeHtml(trail.description || '상세 코스 데이터는 준비 중입니다.')}</div>
      ${trail.officialUrl ? `<div class="route-detail-actions"><button type="button" class="route-detail-link" data-url="${escapeHtml(trail.officialUrl)}">공식 홈페이지 / 상세보기</button></div>` : ''}
    `;
    card.querySelector('[data-url]')?.addEventListener('click', (event) => openExternalUrl(event.currentTarget.dataset.url));
    card.querySelector('.route-detail-close-btn')?.addEventListener('click', closeTrailDetail);
    list.appendChild(card);
  }

  function buildRouteMenuItems(routes) {
    const items = [];
    const hantiRoute = routes.find((route) => route?.id === 'hanti' || route?.routeGroup === '한티가는길');
    const seoulRoutes = routes.filter((route) => route?.routeGroup === '서울순례길');
    const nimuiRoutes = routes.filter((route) => route?.routeGroup === '님의 길');
    const jeonjuRoutes = routes.filter((route) => route?.region === '전주교구');
    if (hantiRoute) items.push(buildHantiRouteGroup(hantiRoute));
    if (seoulRoutes.length) items.push(buildSeoulRouteGroup(seoulRoutes));
    if (nimuiRoutes.length) items.push(buildNimuiRouteGroup(nimuiRoutes));
    if (jeonjuRoutes.length) items.push(buildJeonjuRouteGroup(jeonjuRoutes));
    routes.forEach((route) => {
      if (!route || route.id === 'hanti' || route.routeGroup === '한티가는길' || route.routeGroup === '서울순례길' || route.routeGroup === '님의 길' || route.region === '전주교구') return;
      items.push({ kind: 'route', route });
    });
    return items;
  }

  function buildHantiRouteGroup(route) {
    const courseOptions = Array.isArray(route.courses) ? route.courses.map((course) => ({
      label: `${course.courseNo || ''}코스 ${course.name || ''}`.trim(),
      title: '',
      meta: [course.distanceLabel, course.durationLabel].filter(Boolean).join(' · '),
      introUrl: course.courseIntroUrl || '',
      route: createHantiCourseRoute(route, course)
    })) : [];
    return {
      kind: 'group',
      id: 'hanti-route-group',
      icon: '🧭',
      title: route.name || '한티가는길',
      meta: '전체 코스 또는 1~5코스를 선택하세요.',
      foot: `${route.courseSummaryLabel || '5개 코스'} · ${route.distanceLabel || ''}`,
      optionLayout: 'single',
      options: [
        {
          label: '한티가는길 전체코스 보기',
          title: '',
          meta: [route.distanceLabel, route.durationLabel].filter(Boolean).join(' · '),
          variant: 'full-route',
          route: createHantiFullRoute(route)
        },
        ...courseOptions
      ]
    };
  }

  function buildSeoulRouteGroup(routes) {
    const orderedRoutes = routes.slice().sort(compareSeoulRouteOrder);
    const fullCourseRoutes = orderedRoutes.filter((route) => !isKimDaegeonSeoulRoute(route));
    const options = [];
    if (fullCourseRoutes.length > 1) {
      options.push({
        label: '천주교 서울순례길 전체코스 보기',
        title: '',
        meta: '44.1km',
        variant: 'full-route',
        route: createSeoulFullRoute(fullCourseRoutes)
      });
    }
    orderedRoutes.forEach((route) => {
      options.push({
        label: seoulRouteOptionLabel(route),
        title: '',
        meta: seoulRouteOfficialMeta(route),
        introUrl: route.courseIntroUrl || '',
        route: createSeoulDisplayRoute(route)
      });
    });
    return {
      kind: 'group',
      id: 'seoul-route-group',
      icon: '⛪',
      title: '천주교 서울 순례길',
      meta: '상세 순례길을 선택하세요.',
      foot: `${orderedRoutes.length}개 순례길`,
      optionLayout: 'single',
      options
    };
  }

  function buildJeonjuRouteGroup(routes) {
    const orderedRoutes = routes.slice().sort((a, b) => String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), 'ko'));
    return {
      kind: 'group',
      id: 'jeonju-pilgrimage-route-group',
      icon: '✝️',
      title: '전주교구 순례길',
      meta: '걸을 순례길을 선택하세요.',
      foot: `${orderedRoutes.length}개 순례길`,
      optionLayout: 'single',
      options: orderedRoutes.map((route) => ({
        label: route.shortName || route.name,
        title: `${route.startName || '출발지'} ~ ${route.finishName || '도착지'}`,
        meta: route.distanceLabel || '',
        route
      }))
    };
  }

  function buildNimuiRouteGroup(routes) {
    const orderedRoutes = routes.slice().sort((a, b) => String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), 'ko'));
    const groupInfoMap = new Map([
      ['1길 최양업 신부님의 길', { distance: '122.6km', duration: '31시간' }],
      ['2길 최해성 요한의 길', { distance: '37.8km', duration: '9시간' }],
      ['3길 정규하 신부길', { distance: '73.6km', duration: '20시간' }]
    ]);
    const sections = [];
    orderedRoutes.forEach((route) => {
      const groupName = route.parentCourseGroup || '님의 길';
      let section = sections.find((item) => item.title === groupName);
      if (!section) {
        section = {
          title: groupName,
          options: [],
          routes: []
        };
        sections.push(section);
      }
      section.routes.push(route);
      section.options.push({
        label: route.shortName || route.name,
        title: `${route.startName || '출발지'} ~ ${route.finishName || '도착지'}`,
        meta: [route.distanceLabel, route.durationLabel].filter(Boolean).join(' · '),
        introUrl: route.courseIntroUrl || '',
        route
      });
    });

    sections.forEach((section, index) => {
      const info = groupInfoMap.get(section.title) || {};
      section.options.unshift({
        label: `${index + 1}길 전체코스 보기`,
        title: `${section.routes[0]?.startName || '출발지'} ~ ${section.routes[section.routes.length - 1]?.finishName || '도착지'}`,
        meta: [info.distance, info.duration].filter(Boolean).join(' · '),
        variant: 'full-route',
        route: createNimuiFullRoute(section.routes, `nimui-road-${index + 1}-full`, `님의 길 ${index + 1}길 전체코스`, info.distance, info.duration)
      });
      delete section.routes;
    });

    return {
      kind: 'group',
      id: 'nimui-route-group',
      icon: '✝️',
      title: '원주교구 순례길 ‘님의 길’',
      meta: '길별 상세 코스를 선택하세요.',
      foot: `${orderedRoutes.length}개 코스 연결`,
      optionLayout: 'single',
      options: [{
        label: '님의 길 전체코스 보기',
        title: '1길·2길·3길 전체 경로',
        meta: '234.0km · 60시간',
        variant: 'full-route',
        route: createNimuiFullRoute(orderedRoutes, 'nimui-road-all-full', '님의 길 전체코스', '234.0km', '60시간')
      }],
      sections
    };
  }

  // 인접 구간끼리 색이 비슷해 보이지 않도록 명도와 색상 계열을 번갈아 배치한다.
  const FULL_ROUTE_SECTION_COLORS = [
    '#0b3d91', '#f97316', '#15803d', '#c026d3', '#0891b2', '#dc2626',
    '#7c3aed', '#ca8a04', '#0369a1', '#be123c', '#0f766e', '#ea580c',
    '#4f46e5', '#65a30d', '#db2777', '#1d4ed8', '#b45309', '#9333ea'
  ];

  function fullRouteSectionColor(index) {
    return FULL_ROUTE_SECTION_COLORS[index % FULL_ROUTE_SECTION_COLORS.length];
  }

  function isCombinedRoute(route) {
    const id = String(route?.id || '');
    const name = String(route?.name || route?.shortName || '');
    return /(?:-full|_full)$/.test(id) || /전체코스/.test(name);
  }

  function routePaletteIndex(route) {
    if (!route) return 0;

    if (route.routeGroup === '한티가는길' || String(route.id || '').startsWith('hanti')) {
      const courseNo = Number(route.selectedCourseNo || String(route.shortName || route.name || '').match(/^(\d+)코스/)?.[1]);
      return Number.isFinite(courseNo) && courseNo > 0 ? courseNo - 1 : 0;
    }

    if (route.region === '원주교구' && route.routeGroup === '님의 길') {
      const ordered = (window.PILGRIMAGE_ROUTE_NIMUI || []).slice()
        .sort((a, b) => String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), 'ko'));
      const index = ordered.findIndex((item) => item.id === route.id);
      return index >= 0 ? index : 0;
    }

    if (route.region === '서울대교구') {
      const ordered = (window.PILGRIMAGE_ROUTE_SEOUL || []).slice()
        .filter((item) => !isKimDaegeonSeoulRoute(item))
        .sort(compareSeoulRouteOrder);
      const index = ordered.findIndex((item) => item.id === route.id);
      return index >= 0 ? index : 0;
    }

    if (route.region === '전주교구') {
      const ordered = (window.PILGRIMAGE_ROUTE_JEONJU || []).slice();
      const index = ordered.findIndex((item) => item.id === route.id);
      return index >= 0 ? index : 0;
    }

    return 0;
  }

  function applyIndividualRouteColor(route) {
    if (!route || isCombinedRoute(route)) return route;
    const displayColor = fullRouteSectionColor(routePaletteIndex(route));
    return {
      ...route,
      routeDisplayColor: displayColor,
      routeSegments: (route.routeSegments || []).map((segment) => ({
        ...segment,
        displayColor,
        displayWeight: Number(segment.displayWeight) || 7
      }))
    };
  }

  function createNimuiFullRoute(routes, id, name, distanceLabel, durationLabel) {
    const orderedRoutes = routes.slice().sort((a, b) => String(a.shortName || a.name).localeCompare(String(b.shortName || b.name), 'ko'));
    const routeSegments = [];
    orderedRoutes.forEach((route, routeIndex) => {
      const displayColor = fullRouteSectionColor(routeIndex);
      (route.routeSegments || []).forEach((segment, index) => {
        routeSegments.push({
          ...segment,
          id: `${id}-${route.id}-${segment.id || index}`,
          sourceRouteId: route.id,
          sourceRouteName: route.shortName || route.name,
          displayColor,
          displayWeight: 7 + ((orderedRoutes.length - routeIndex - 1) % 3),
          points: segment.points || []
        });
      });
    });
    const firstRoute = orderedRoutes[0];
    const lastRoute = orderedRoutes[orderedRoutes.length - 1];
    const firstPoint = firstRoute?.routeSegments?.[0]?.points?.[0];
    const lastSegment = lastRoute?.routeSegments?.[lastRoute.routeSegments.length - 1];
    const lastPoint = lastSegment?.points?.[lastSegment.points.length - 1];
    const startName = firstRoute?.startName || '출발지';
    const finishName = lastRoute?.finishName || '도착지';
    const endpointStamps = [
      {
        id: 'start',
        role: 'start',
        name: startName,
        lat: Number(firstPoint?.lat),
        lng: Number(firstPoint?.lng)
      },
      {
        id: 'finish',
        role: 'finish',
        name: finishName,
        lat: Number(lastPoint?.lat),
        lng: Number(lastPoint?.lng)
      }
    ];

    // 님의 길 전체지도에서는 2길이 1길·3길과 별도 축으로 이어지므로
    // 2길의 시작과 도착도 지도에서 분명하게 확인할 수 있게 표시한다.
    if (id === 'nimui-road-all-full') {
      const road2Routes = orderedRoutes.filter((route) => route.parentCourseGroup === '2길 최해성 요한의 길');
      const road2First = road2Routes[0];
      const road2Last = road2Routes[road2Routes.length - 1];
      const road2FirstPoint = road2First?.routeSegments?.[0]?.points?.[0];
      const road2LastSegment = road2Last?.routeSegments?.[road2Last.routeSegments.length - 1];
      const road2LastPoint = road2LastSegment?.points?.[road2LastSegment.points.length - 1];
      if (road2FirstPoint && road2LastPoint) {
        endpointStamps.push(
          {
            id: 'road2-start',
            role: 'start',
            name: `2길 출발 · ${road2First.startName || '출발지'}`,
            lat: Number(road2FirstPoint.lat),
            lng: Number(road2FirstPoint.lng)
          },
          {
            id: 'road2-finish',
            role: 'finish',
            name: `2길 도착 · ${road2Last.finishName || '도착지'}`,
            lat: Number(road2LastPoint.lat),
            lng: Number(road2LastPoint.lng)
          }
        );
      }
    }

    return {
      id,
      name,
      shortName: name,
      region: '원주교구',
      type: 'pilgrimage_route',
      mode: 'route_navigation',
      lineType: 'gpx',
      dataQuality: 'actual-gpx',
      routeGroup: '님의 길',
      distanceLabel,
      durationLabel,
      startName,
      finishName,
      preserveSegmentBreaks: true,
      landmarkMaxDistanceM: 2000,
      features: {
        showRouteLine: true,
        showStampMarkers: true,
        autoStamp: false,
        nextStampDistance: false,
        offRouteAlert: true,
        nearestStampDistance: false
      },
      stamps: endpointStamps,
      routeSegments
    };
  }

  function renderRouteGroupCard(list, group) {
    const card = document.createElement('section');
    card.className = 'route-card route-group-card route-detail-card';
    card.innerHTML = `
      <div class="route-card-main route-detail-title-row">
        <div class="route-icon">${escapeHtml(group.icon || '🧭')}</div>
        <div class="route-copy">
          <div class="route-name-row">
            <h3 class="route-name">${escapeHtml(group.title || '순례길')}</h3>
          </div>
        </div>
        <button type="button" class="route-detail-close-btn" aria-label="상세 닫기">×</button>
      </div>
      ${Array.isArray(group.detailLines) && group.detailLines.length ? `<ul class="trail-detail-lines">${group.detailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}
      <div class="route-option-area"></div>
      ${group.officialUrl ? `<div class="route-detail-actions"><button type="button" class="route-detail-link" data-url="${escapeHtml(group.officialUrl)}">공식 홈페이지 / 상세보기</button></div>` : ''}
      <div class="route-foot route-group-foot"><span>${escapeHtml(group.foot || '')}</span></div>
    `;
    const area = card.querySelector('.route-option-area');
    const renderOption = (option, parent) => {
      const item = document.createElement('div');
      item.className = `route-option-btn${option.variant === 'full-route' ? ' route-option-full' : ''}${option.introUrl ? ' has-course-intro' : ''}`;

      const mainBtn = document.createElement('button');
      mainBtn.type = 'button';
      mainBtn.className = 'route-option-main';
      mainBtn.innerHTML = `
        <strong>${escapeHtml(option.label || '선택')}</strong>
        ${option.title ? `<span>${escapeHtml(option.title)}</span>` : ''}
        ${option.meta ? `<em>${escapeHtml(option.meta)}</em>` : ''}
      `;
      mainBtn.addEventListener('click', () => openRoute(option.route));
      item.appendChild(mainBtn);

      if (option.introUrl) {
        const introBtn = document.createElement('button');
        introBtn.type = 'button';
        introBtn.className = 'route-option-course-intro';
        introBtn.textContent = '코스소개';
        introBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          openExternalUrl(option.introUrl);
        });
        item.appendChild(introBtn);
      }

      parent.appendChild(item);
    };
    if (Array.isArray(group.sections) && group.sections.length) {
      if (Array.isArray(group.options) && group.options.length) {
        const topGrid = document.createElement('div');
        topGrid.className = `route-option-grid${group.optionLayout === 'single' ? ' single-column' : ''}`;
        group.options.forEach((option) => renderOption(option, topGrid));
        area.appendChild(topGrid);
      }
      group.sections.forEach((section) => {
        const sectionEl = document.createElement('section');
        sectionEl.className = 'route-option-section';
        sectionEl.innerHTML = `
          <div class="route-option-section-head">
            <strong>${escapeHtml(section.title || '')}</strong>
          </div>
          <div class="route-option-grid${group.optionLayout === 'single' ? ' single-column' : ''}"></div>
        `;
        const grid = sectionEl.querySelector('.route-option-grid');
        (section.options || []).forEach((option) => renderOption(option, grid));
        area.appendChild(sectionEl);
      });
    } else {
      const grid = document.createElement('div');
      grid.className = `route-option-grid${group.optionLayout === 'single' ? ' single-column' : ''}`;
      area.appendChild(grid);
      (group.options || []).forEach((option) => renderOption(option, grid));
    }
    card.querySelector('[data-url]')?.addEventListener('click', (event) => openExternalUrl(event.currentTarget.dataset.url));
    card.querySelector('.route-detail-close-btn')?.addEventListener('click', closeTrailDetail);
    list.appendChild(card);
  }

  function renderSingleRouteCard(list, route) {
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
  }

  function openExternalUrl(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function createHantiFullRoute(baseRoute) {
    const courses = Array.isArray(baseRoute?.courses) ? baseRoute.courses : [];
    if (!courses.length) return { ...baseRoute, preserveSegmentBreaks: true };

    // 한티가는길 전체코스는 각 코스의 마지막 스탬프와 다음 코스의 첫 스탬프
    // 사이 좌표까지 빠짐없이 분담한다. 스탬프 사이를 단순 잘라내면 코스 끝부분이
    // 지도에서 끊겨 보이므로, 인접 코스의 경계는 두 스탬프 인덱스의 중간으로 잡는다.
    const allPoints = flattenRoutePoints({ ...baseRoute, preserveSegmentBreaks: false })
      .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
      .filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng));
    if (allPoints.length < 2) return { ...baseRoute, preserveSegmentBreaks: true };

    const courseRanges = courses.map((course) => {
      const stampIds = Array.isArray(course?.stampIds) ? course.stampIds : [];
      const startStamp = (baseRoute.stamps || []).find((stamp) => stamp.id === stampIds[0]);
      const finishStamp = (baseRoute.stamps || []).find((stamp) => stamp.id === stampIds[stampIds.length - 1]);
      return {
        course,
        startIndex: findNearestRoutePointIndex(allPoints, startStamp),
        finishIndex: findNearestRoutePointIndex(allPoints, finishStamp)
      };
    });

    const boundaries = [0];
    for (let index = 0; index < courseRanges.length - 1; index += 1) {
      const currentFinish = courseRanges[index].finishIndex;
      const nextStart = courseRanges[index + 1].startIndex;
      const safeCurrent = Number.isFinite(currentFinish) ? currentFinish : boundaries[index];
      const safeNext = Number.isFinite(nextStart) ? nextStart : safeCurrent;
      boundaries.push(Math.max(boundaries[index], Math.round((safeCurrent + safeNext) / 2)));
    }
    boundaries.push(allPoints.length - 1);

    const routeSegments = [];
    courses.forEach((course, courseIndex) => {
      const from = Math.max(0, Math.min(allPoints.length - 2, boundaries[courseIndex]));
      const to = Math.max(from + 1, Math.min(allPoints.length - 1, boundaries[courseIndex + 1]));
      const points = allPoints.slice(from, to + 1);
      if (points.length < 2) return;
      routeSegments.push({
        id: `${baseRoute.id}-full-course-${course.courseNo || course.id || courseIndex + 1}`,
        type: 'gpx-slice',
        sourceRouteName: `${course.courseNo || courseIndex + 1}코스 ${course.name || ''}`.trim(),
        displayColor: fullRouteSectionColor(courseIndex),
        displayWeight: 8,
        points
      });
    });

    return {
      ...baseRoute,
      id: `${baseRoute.id}-full`,
      name: '한티가는길 전체코스',
      shortName: '한티가는길 전체코스',
      preserveSegmentBreaks: true,
      routeSegments,
      courses: undefined
    };
  }

  function createHantiCourseRoute(baseRoute, course) {
    const courses = Array.isArray(baseRoute?.courses) ? baseRoute.courses : [];
    const courseIndex = courses.findIndex((item) => item?.id === course?.id || item?.courseNo === course?.courseNo);
    const stampIds = Array.isArray(course?.stampIds) ? course.stampIds.slice() : [];
    const nextCourse = courseIndex >= 0 ? courses[courseIndex + 1] : null;
    const nextStartId = Array.isArray(nextCourse?.stampIds) ? nextCourse.stampIds[0] : null;

    // 한티가는길의 각 코스는 마지막 번호 지점에서 끝나는 것이 아니라
    // 다음 코스 첫 지점까지 실제 원본 경로를 따라 이어진다.
    // 1-4→2-1, 2-3→3-1, 3-4→4-1, 4-4→5-1 전환 구간을
    // 임의 직선이 아닌 원본 GPX 좌표로 포함한다.
    const navigationStampIds = nextStartId ? [...stampIds, nextStartId] : stampIds;
    const stamps = navigationStampIds
      .map((id) => (baseRoute.stamps || []).find((stamp) => stamp.id === id))
      .filter(Boolean);
    const startStamp = stamps[0] || null;
    const finishStamp = stamps[stamps.length - 1] || null;
    const points = sliceRoutePointsByStamps(baseRoute, startStamp?.id, finishStamp?.id);
    return {
      ...baseRoute,
      id: `${baseRoute.id}__course_${course.courseNo || course.id}`,
      name: `한티가는길 ${course.courseNo || ''}코스 ${course.name || ''}`.trim(),
      shortName: `${course.courseNo || ''}코스 ${course.name || ''}`.trim(),
      courseLabel: `${course.courseNo || ''}코스 ${course.name || ''}`.trim(),
      selectedCourseNo: course.courseNo,
      distanceLabel: course.distanceLabel || baseRoute.distanceLabel,
      durationLabel: course.durationLabel || baseRoute.durationLabel,
      courseSummaryLabel: [course.distanceLabel, course.durationLabel].filter(Boolean).join(' · '),
      startStampId: startStamp?.id || baseRoute.startStampId,
      completionStampId: finishStamp?.id || baseRoute.completionStampId,
      startName: startStamp?.name || baseRoute.startName,
      finishName: finishStamp?.name || baseRoute.finishName,
      stamps,
      routeSegments: [{
        id: `${baseRoute.id}-course-${course.courseNo || course.id}-slice`,
        type: 'gpx-slice',
        displayColor: fullRouteSectionColor(Math.max(0, courseIndex)),
        points
      }],
      courses: undefined,
      flexibleRouteSections: filterFlexibleSectionsForStamps(baseRoute.flexibleRouteSections, navigationStampIds)
    };
  }


  function createSeoulDisplayRoute(route) {
    if (!route || isKimDaegeonSeoulRoute(route)) return route;
    const markerPrefix = seoulRouteMarkerPrefix(route);
    if (!markerPrefix) return route;
    return {
      ...route,
      stamps: (route.stamps || []).map((stamp) => {
        const rawNo = stamp.order || stamp.id || '';
        return {
          ...stamp,
          displayOrder: `${markerPrefix}-${rawNo}`
        };
      })
    };
  }

  function createSeoulFullRoute(routes) {
    const orderedRoutes = routes.slice()
      .filter((route) => !isKimDaegeonSeoulRoute(route))
      .sort(compareSeoulRouteOrder);
    const routeSegments = [];
    const stamps = [];
    orderedRoutes.forEach((route, routeIndex) => {
      const displayColor = fullRouteSectionColor(routeIndex);
      (route.routeSegments || []).forEach((segment, index) => {
        routeSegments.push({
          ...segment,
          id: `seoul-full-${route.id}-${segment.id || index}`,
          sourceRouteId: route.id,
          sourceRouteName: route.shortName || route.name,
          displayColor,
          displayWeight: 7 + ((orderedRoutes.length - routeIndex - 1) % 3),
          points: segment.points || []
        });
      });
      const markerPrefix = seoulRouteMarkerPrefix(route);
      (route.stamps || []).forEach((stamp) => {
        const rawNo = stamp.order || stamp.id || '';
        const nextNo = stamps.length + 1;
        stamps.push({
          ...stamp,
          id: `${route.id}-${stamp.id || rawNo}`,
          order: nextNo,
          displayOrder: markerPrefix ? `${markerPrefix}-${rawNo}` : String(rawNo || nextNo),
          sourceRouteName: route.shortName || route.name
        });
      });
    });
    return {
      id: 'seoul-pilgrimage-full',
      name: '천주교 서울순례길 전체코스',
      shortName: '서울순례길 전체코스',
      region: '서울대교구',
      type: 'pilgrimage_route',
      mode: 'route_navigation',
      lineType: 'gpx',
      dataQuality: 'actual-gpx',
      routeGroup: '서울순례길',
      distanceLabel: '44.1km',
      startName: orderedRoutes[0]?.startName || '출발지',
      finishName: orderedRoutes[orderedRoutes.length - 1]?.finishName || '도착지',
      preserveSegmentBreaks: true,
      features: {
        showRouteLine: true,
        showStampMarkers: true,
        autoStamp: false,
        nextStampDistance: true,
        offRouteAlert: true,
        nearestStampDistance: true
      },
      stamps,
      routeSegments
    };
  }

  function sliceRoutePointsByStamps(route, startStampId, finishStampId) {
    const points = flattenRoutePoints(route);
    if (!points.length) return [];
    const startStamp = (route.stamps || []).find((stamp) => stamp.id === startStampId);
    const finishStamp = (route.stamps || []).find((stamp) => stamp.id === finishStampId);
    const startIndex = findNearestRoutePointIndex(points, startStamp);
    const finishIndex = findNearestRoutePointIndex(points, finishStamp);
    if (!Number.isFinite(startIndex) || !Number.isFinite(finishIndex)) return points;
    const from = Math.max(0, Math.min(startIndex, finishIndex));
    const to = Math.min(points.length - 1, Math.max(startIndex, finishIndex));
    return points.slice(from, to + 1);
  }

  function findNearestRoutePointIndex(points, stamp) {
    if (!stamp || !isFiniteNumber(stamp.lat) || !isFiniteNumber(stamp.lng)) return NaN;
    let bestIndex = NaN;
    let bestDistance = Infinity;
    points.forEach((point, index) => {
      const distance = haversineM(point, { lat: Number(stamp.lat), lng: Number(stamp.lng) });
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function filterFlexibleSectionsForStamps(sections, stampIds) {
    if (!Array.isArray(sections) || !Array.isArray(stampIds) || !stampIds.length) return [];
    return sections.filter((section) => stampIds.includes(section.fromStampId) && stampIds.includes(section.toStampId));
  }

  function compareSeoulRouteOrder(a, b) {
    return seoulRouteSortValue(a) - seoulRouteSortValue(b);
  }

  function seoulRouteSortValue(route) {
    const text = seoulRouteSearchText(route);
    const match = text.match(/(\d+)\s*코스/);
    if (match) return Number(match[1]);
    if (isKimDaegeonSeoulRoute(route)) return 98;
    return 99;
  }


  function seoulRouteOfficialMeta(route) {
    const text = seoulRouteSearchText(route);
    if (/1\s*코스/.test(text)) return '8.7km · 3시간 40분';
    if (/2\s*코스/.test(text)) return '5.9km · 2시간 30분';
    if (/3\s*코스/.test(text)) return '29.5km · 8시간';
    if (isKimDaegeonSeoulRoute(route)) return '12.7km';
    return [route.distanceLabel, route.durationLabel].filter(Boolean).join(' · ') || route.distanceLabel || '';
  }

  function seoulRouteOptionLabel(route) {
    const text = seoulRouteSearchText(route);
    const match = text.match(/(\d+)\s*코스/);
    if (match) {
      const courseName = String(route?.shortName || `${match[1]}코스`).replace(/^\d+\s*코스\s*/, '');
      return `${match[1]}. ${courseName}`.trim();
    }
    if (isKimDaegeonSeoulRoute(route)) return '김대건 신부 치명 순교길';
    return route?.shortName || '선택';
  }

  function seoulRouteMarkerPrefix(route) {
    const text = seoulRouteSearchText(route);
    const match = text.match(/(\d+)\s*코스/);
    if (match) return match[1];
    return '';
  }

  function isKimDaegeonSeoulRoute(route) {
    return /김대건/.test(seoulRouteSearchText(route));
  }

  function seoulRouteSearchText(route) {
    return `${route?.name || ''} ${route?.shortName || ''} ${route?.courseLabel || ''}`;
  }

  function findRouteForRestore(routeId) {
    if (!routeId) return null;
    for (const item of buildRouteMenuItems(state.routes)) {
      if (item.kind === 'route' && item.route?.id === routeId) return item.route;
      if (item.kind === 'group') {
        const route = findRouteInGroupOptions(item, routeId);
        if (route) return route;
      }
    }
    return null;
  }

  function findRouteInGroupOptions(group, routeId) {
    const directOption = (group.options || []).find((option) => option.route?.id === routeId);
    if (directOption) return directOption.route;
    for (const section of group.sections || []) {
      const sectionOption = (section.options || []).find((option) => option.route?.id === routeId);
      if (sectionOption) return sectionOption.route;
    }
    return null;
  }

  function openRoute(route, options = {}) {
    stopLocationWatch();
    route = applyIndividualRouteColor(route);
    state.activeRoute = route;
    const restoredState = validRestoreStateForRoute(route, options.restoreState);
    state.routeDirection = normalizeDirection(restoredState?.routeDirection || 'forward');
    state.lastCoords = sanitizeCoords(restoredState?.lastCoords) || null;
    state.walkedTrack = sanitizeTrack(restoredState?.walkedTrack || []);
    state.elapsedActiveMs = sanitizeElapsedMs(restoredState?.elapsedActiveMs);
    state.activeSince = null;
    state.following = Boolean(restoredState?.following);
    resumeAutoCenter({ skipPan: true });
    rebuildNavigationModel();
    setStatusSheetMode(STATUS_SHEET_COMPACT);

    $('route-list-view').hidden = true;
    $('map-view').hidden = false;
    activateMapHistory();
    clearMapExitBanner();
    updateRouteHeader();
    resetStatusForActiveRoute(Boolean(restoredState));
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
        return requestInitialMapLocation();
      })
      .then(() => {
        if (state.following) startFollow({ restored: true });
        saveNavigationState();
      })
      .catch(showMapError);
  }

  function handleBackToList() {
    handleMapBackRequest();
  }

  function handleBrowserBackRequest(event) {
    if (!state.activeRoute) return;
    if (event) event.preventDefault?.();
    handleMapBackRequest({ fromBrowserBack: true });
    if (state.activeRoute && history?.pushState) {
      try { history.pushState({ gildongmuRouteNav: true }, '', location.href); } catch (_) {}
    }
  }

  function handleMapBackRequest() {
    if (!state.activeRoute) return;
    if (!hasStartedNavigationSession()) {
      showListWithoutPrompt();
      return;
    }
    if (state.mapExitBackPrimed) {
      clearMapExitBanner();
      endNavigation();
      showListWithoutPrompt();
      return;
    }
    setStatusSheetMode(STATUS_SHEET_HIDDEN);
    showMapExitBanner();
  }

  function showMapExitBanner() {
    const banner = $('nav-exit-banner');
    state.mapExitBackPrimed = true;
    clearTimeout(state.mapExitBackTimer);
    state.mapExitBackTimer = null;
    if (banner) {
      banner.textContent = '뒤로가기를 한 번 더 누르면 지금까지 이동한 경로가 삭제됩니다.';
      banner.hidden = false;
      banner.classList.add('show');
    }
  }

  function clearMapExitBanner() {
    const banner = $('nav-exit-banner');
    state.mapExitBackPrimed = false;
    clearTimeout(state.mapExitBackTimer);
    state.mapExitBackTimer = null;
    if (banner) {
      banner.classList.remove('show');
      banner.hidden = true;
    }
  }

  function activateMapHistory() {
    if (!history?.pushState || history.state?.gildongmuRouteNav) return;
    try { history.pushState({ gildongmuRouteNav: true }, '', location.href); } catch (_) {}
  }

  function showListWithoutPrompt() {
    clearMapExitBanner();
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
    const distanceBadge = $('map-distance');
    if (distanceBadge) {
      const computedKm = computeRouteTotalDistance(route) / 1000;
      distanceBadge.textContent = route.distanceLabel || (Number.isFinite(computedKm) ? `${computedKm.toFixed(1)}km` : '');
      distanceBadge.hidden = !distanceBadge.textContent;
    }
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
    renderLandmarkMarkers(route);
    renderStampMarkers(route);
    renderCourseLabels(route);
    renderDirectionArrows();
    setTimeout(() => {
      if (state.map?.relayout) state.map.relayout();
      if (!state.lastCoords) fitRouteBounds();
      else refreshDirectionArrowsAfterMapMove();
    }, 80);
  }

  function clearMapObjects(options = {}) {
    clearDirectionArrows();
    hideStampInfo();
    state.stampMarkers.forEach((item) => (item.marker || item).setMap(null));
    state.stampMarkers = [];
    state.landmarkMarkers.forEach((item) => item.setMap(null));
    state.landmarkMarkers = [];
    clearPolyline('traveledPolyline');
    clearPolyline('futurePolyline');
    clearPolyline('walkedTrackPolyline');
    clearRouteSegmentPolylines();
    clearCourseLabelOverlays();
    if (!options.keepMyLocation && state.myMarker) {
      state.myMarker.setMap(null);
      state.myMarker = null;
    }
  }

  function clearPolyline(key) {
    if (state[key]) state[key].setMap(null);
    state[key] = null;
  }

  function clearCourseLabelOverlays() {
    state.courseLabelOverlays.forEach((overlay) => overlay.setMap(null));
    state.courseLabelOverlays = [];
  }

  function splitCourseLabel(text) {
    const raw = String(text || '').trim();
    const match = raw.match(/^((?:\d+-\d+|\d+)\s*(?:코스|길)?)(?:\s+(.+))?$/);
    if (!match) return { number: raw, name: raw, full: raw };
    const number = match[1].trim();
    const name = String(match[2] || '').trim() || number;
    return { number, name, full: [number, match[2]].filter(Boolean).join(' ').trim() };
  }

  function representativePoint(points) {
    const valid = (points || []).filter((point) => isFiniteNumber(point?.lat) && isFiniteNumber(point?.lng));
    if (!valid.length) return null;
    if (valid.length === 1) return valid[0];

    // 좌표 개수의 단순 중앙이 아니라 실제 누적 거리의 중앙점을 사용한다.
    // 긴 코스가 여러 GPX 세그먼트로 나뉘어 있어도 라벨이 출발점 쪽으로 치우치지 않는다.
    let totalM = 0;
    const cumulative = [0];
    for (let i = 1; i < valid.length; i += 1) {
      totalM += haversineM(valid[i - 1], valid[i]);
      cumulative.push(totalM);
    }
    if (!Number.isFinite(totalM) || totalM <= 0) return valid[Math.floor(valid.length / 2)];
    const targetM = totalM / 2;
    let bestIndex = 0;
    let bestDiff = Infinity;
    cumulative.forEach((distanceM, index) => {
      const diff = Math.abs(distanceM - targetM);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index;
      }
    });
    return valid[bestIndex];
  }

  function routeCourseLabelSpecs(route) {
    if (Array.isArray(route?.courses) && route.courses.length && Array.isArray(route.stamps)) {
      return route.courses.map((course) => {
        const stamps = (course.stampIds || []).map((id) => route.stamps.find((stamp) => stamp.id === id)).filter(Boolean);
        const point = representativePoint(stamps);
        return point ? { text: `${course.courseNo || ''}코스 ${course.name || ''}`.trim(), point } : null;
      }).filter(Boolean);
    }

    // 같은 세부 코스가 여러 세그먼트로 분리돼 있으면 먼저 한 묶음으로 합친 뒤
    // 전체 경로의 거리 중앙에 라벨을 둔다. 1-5와 3-1처럼 첫 세그먼트가 짧은 경우도
    // 코스명이 시작점 근처에 붙지 않는다.
    const grouped = new Map();
    (route?.routeSegments || []).forEach((segment, index) => {
      const text = segment.sourceRouteName || (index === 0 ? (route.shortName || route.name) : '');
      if (!text) return;
      if (!grouped.has(text)) grouped.set(text, []);
      grouped.get(text).push(...(segment.points || []));
    });

    return Array.from(grouped.entries()).map(([text, points]) => {
      const point = representativePoint(points);
      return point ? { text, point } : null;
    }).filter(Boolean);
  }

  function renderCourseLabels(route) {
    clearCourseLabelOverlays();
    if (!state.map || !window.kakao?.maps || !route) return;
    routeCourseLabelSpecs(route).forEach((spec) => {
      const labels = splitCourseLabel(spec.text);
      const content = document.createElement('div');
      content.className = 'course-map-label';
      content.dataset.number = labels.number;
      content.dataset.name = labels.name;
      content.dataset.full = labels.full;
      content.textContent = labels.name;
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(Number(spec.point.lat), Number(spec.point.lng)),
        content, xAnchor: 0.5, yAnchor: 0.5, zIndex: 17
      });
      overlay.__content = content;
      overlay.setMap(state.map);
      state.courseLabelOverlays.push(overlay);
    });
    updateCourseLabelVisibility();
  }

  function updateCourseLabelVisibility() {
    if (!state.map) return;
    const level = Number(state.map.getLevel?.() || 8);
    state.courseLabelOverlays.forEach((overlay) => {
      const content = overlay.__content;
      if (!content) return;

      // 모든 순례길 공통 기준: 같은 줌에서는 같은 글자 크기와 카드 크기를 사용한다.
      // 너무 멀리 축소한 경우만 숨기고, 그 외에는 번호와 코스명을 항상 함께 표시한다.
      if (level >= 16) {
        content.hidden = true;
        return;
      }
      content.hidden = false;
      content.textContent = content.dataset.full || content.dataset.name;
      if (level >= 14) content.className = 'course-map-label zoom-ultra-far';
      else if (level >= 12) content.className = 'course-map-label zoom-far';
      else if (level >= 10) content.className = 'course-map-label zoom-low';
      else if (level >= 7) content.className = 'course-map-label zoom-mid';
      else content.className = 'course-map-label zoom-near';
    });
  }


  function clearRouteSegmentPolylines() {
    state.routeSegmentPolylines.forEach((polyline) => polyline.setMap(null));
    state.routeSegmentPolylines = [];
  }

  function renderSegmentedRouteLines(route) {
    clearRouteSegmentPolylines();
    if (!state.map || !window.kakao?.maps) return;
    let previousDisplayEnd = null;
    (route?.routeSegments || []).forEach((segment, segmentIndex) => {
      const validPoints = (segment.points || [])
        .filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng))
        .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
      if (validPoints.length < 2) return;
      // 원본 세그먼트 경계가 수십 m 정도 벌어진 경우에만 표시선을 자연스럽게 잇는다.
      // 먼 구간은 절대로 직선 연결하지 않는다.
      if (previousDisplayEnd) {
        const gapM = haversineM(previousDisplayEnd, validPoints[0]);
        if (Number.isFinite(gapM) && gapM > 0.5 && gapM <= 120) validPoints.unshift(previousDisplayEnd);
      }
      previousDisplayEnd = validPoints[validPoints.length - 1];

      // 전체코스는 세부 코스별 색상을 유지한다. 같은 길을 반대 방향으로 지나도
      // 표시용 선만 제거하지 않고 각각 그려, 선택한 코스의 방향 데이터도 보존한다.
      const isHantiFull = route?.id === 'hanti';
      const displayColor = segment.displayColor
        || (isHantiFull ? fullRouteSectionColor(segmentIndex) : '#1d4ed8');
      const path = validPoints.map((point) => new kakao.maps.LatLng(point.lat, point.lng));
      const polyline = new kakao.maps.Polyline({
        map: state.map,
        path,
        strokeWeight: Number(segment.displayWeight) || 7,
        strokeColor: displayColor,
        strokeOpacity: 0.95,
        strokeStyle: 'solid'
      });
      state.routeSegmentPolylines.push(polyline);
    });
  }

  function isNimuiCombinedRoute(route) {
    return route?.region === '원주교구' && /-full$/.test(String(route?.id || ''));
  }

  function getRouteLandmarks(route) {
    if (!route) return [];

    // 한티가는길은 엑셀에서 생성한 188개 성지 좌표를 기준으로
    // 가실 성당·신나무골 성지·한티 순교성지만 표시한다.
    // 경로 진행용 스탬프 좌표를 성지 마커 좌표로 대신 사용하지 않는다.
    if (route.id === 'hanti' || String(route.id || '').startsWith('hanti__') || route.routeGroup === '한티가는길') {
      const catalog = window.PILGRIMAGE_LANDMARKS_BY_REGION || {};
      const daeguLandmarks = Array.isArray(catalog['대구대교구']) ? catalog['대구대교구'] : [];
      const wantedAliases = [
        ['가실성당', '가실 성당'],
        ['신나무골', '신나무골 성지'],
        ['한티순교성지', '한티 순교성지']
      ];
      const normalize = (value) => String(value || '').replace(/\s+/g, '');
      return wantedAliases.map((aliases) => {
        const landmark = daeguLandmarks.find((item) => aliases.some((alias) => normalize(item?.name) === normalize(alias)));
        return landmark ? { name: landmark.name, lat: landmark.lat, lng: landmark.lng } : null;
      }).filter(Boolean);
    }

    // 서울·전주 순례길은 각 코스에 지정된 지점만 성지 마커로 사용한다.
    if (route.region === '서울대교구' || route.region === '전주교구') {
      return dedupeMapPlaces((route.stamps || []).map((stamp) => ({
        name: stamp.name,
        lat: stamp.lat,
        lng: stamp.lng
      })));
    }

    if (Array.isArray(route.landmarks) && route.landmarks.length) {
      return dedupeMapPlaces(route.landmarks);
    }

    const catalog = window.PILGRIMAGE_LANDMARKS_BY_REGION || {};
    const regionalLandmarks = Array.isArray(catalog[route.region]) ? catalog[route.region] : [];
    const routePoints = flattenRoutePoints(route);
    const routeSegments = buildSegmentIndexFromPoints(routePoints);
    const maxDistanceM = Number(route.landmarkMaxDistanceM || 2000);
    const endpointStamps = (route.stamps || []).filter((stamp) => stamp?.role === 'start' || stamp?.role === 'finish');

    const nearbyLandmarks = regionalLandmarks.filter((landmark) => {
      if (!isFiniteNumber(landmark.lat) || !isFiniteNumber(landmark.lng) || !routeSegments.length) return false;
      const point = { lat: Number(landmark.lat), lng: Number(landmark.lng) };
      const nearest = findNearestPointOnRoute(point, routeSegments);
      if (!nearest || !Number.isFinite(nearest.distanceM) || nearest.distanceM > maxDistanceM) return false;
      if (route.region === '원주교구' && /배론\s*성지|풍수원\s*성당/.test(String(landmark.name || ''))) return true;
      return !endpointStamps.some((stamp) => (
        isFiniteNumber(stamp.lat) && isFiniteNumber(stamp.lng) &&
        haversineM(point, { lat: Number(stamp.lat), lng: Number(stamp.lng) }) < 150
      ));
    });

    return dedupeMapPlaces(nearbyLandmarks);
  }

  function dedupeMapPlaces(places) {
    const unique = [];
    (places || []).forEach((place) => {
      if (!isFiniteNumber(place?.lat) || !isFiniteNumber(place?.lng)) return;
      const point = { lat: Number(place.lat), lng: Number(place.lng) };
      const normalizedName = String(place.name || '').replace(/\s+/g, '').trim();
      const duplicate = unique.some((saved) => {
        const savedName = String(saved.name || '').replace(/\s+/g, '').trim();
        return (normalizedName && savedName === normalizedName) ||
          haversineM(point, { lat: Number(saved.lat), lng: Number(saved.lng) }) < 80;
      });
      if (!duplicate) unique.push(place);
    });
    return unique;
  }

  function renderLandmarkMarkers(route) {
    if (!state.map || !window.kakao?.maps) return;
    const KM = kakao.maps;
    const events = KM.event;
    getRouteLandmarks(route).forEach((landmark) => {
      if (!isFiniteNumber(landmark.lat) || !isFiniteNumber(landmark.lng)) return;
      const position = new KM.LatLng(Number(landmark.lat), Number(landmark.lng));
      const marker = new KM.Marker({
        map: state.map,
        position,
        image: createSacredSiteMarkerImage(),
        title: landmark.name || '성지',
        clickable: true,
        zIndex: 19
      });
      if (events?.addListener) {
        events.addListener(marker, 'click', () => showLandmarkInfo(landmark, position));
      }
      state.landmarkMarkers.push(marker);
    });
  }

  function createSacredSiteMarkerImage() {
    const KM = kakao.maps;
    const width = 28;
    const height = 34;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <path d="M14 1C7.4 1 2 6.4 2 13c0 8.7 12 20 12 20s12-11.3 12-20C26 6.4 20.6 1 14 1z" fill="#d92332" stroke="#ffffff" stroke-width="2"/>
        <path d="M12.2 7h3.6v4.1h4.1v3.6h-4.1v7.2h-3.6v-7.2H8.1v-3.6h4.1z" fill="#ffffff"/>
      </svg>`;
    return new KM.MarkerImage(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      new KM.Size(width, height),
      { offset: new KM.Point(width / 2, height) }
    );
  }

  function renderStampMarkers(route) {
    if (!state.map || !window.kakao?.maps) return;
    if (route?.region === '서울대교구' || route?.region === '전주교구') return;
    const KM = kakao.maps;
    const events = KM.event;
    (route.stamps || []).forEach((stamp) => {
      if (!isFiniteNumber(stamp.lat) || !isFiniteNumber(stamp.lng)) return;
      const position = new KM.LatLng(Number(stamp.lat), Number(stamp.lng));
      const markerText = stampMarkerText(stamp);
      const marker = new KM.Marker({
        map: state.map,
        position,
        image: createStampMarkerImage(markerText),
        title: markerText ? `${markerText}. ${stamp.name || ''}` : (stamp.name || ''),
        clickable: true,
        zIndex: 18
      });
      if (events?.addListener) {
        events.addListener(marker, 'click', () => showStampInfo(stamp, position));
      }
      state.stampMarkers.push({ marker, stamp });
    });
    updateStampMarkerVisibility();
  }

  function updateStampMarkerVisibility() {
    if (!state.map) return;
    const level = Number(state.map.getLevel?.() || 8);
    state.stampMarkers.forEach((item) => {
      const marker = item.marker || item;
      const stamp = item.stamp || {};
      const isWonjuEndpoint = state.activeRoute?.region === '원주교구'
        && (stamp.role === 'start' || stamp.role === 'finish');
      // 번호형 지점 마커는 상세 확대에서만 표시한다. 전체 지도에서는 코스명 라벨과
      // 경로선이 우선 보이도록 하고, 원주교구의 출발/도착 표시는 계속 유지한다.
      const isHantiRoute = state.activeRoute?.id === 'hanti'
        || String(state.activeRoute?.id || '').startsWith('hanti__')
        || state.activeRoute?.routeGroup === '한티가는길';
      // 숫자형 지점 마커는 상세 줌에서만 표시한다.
      // 전체코스를 한 화면에 보는 수준에서는 경로선과 코스명 라벨이 먼저 보이도록 숨긴다.
      // 한티가는길도 다른 순례길과 같은 상세 줌 기준을 사용해 지도 가림을 방지한다.
      const visible = isWonjuEndpoint || level <= 5;
      marker.setMap(visible ? state.map : null);
    });
  }

  function stampMarkerText(stamp) {
    if (!stamp) return '';
    if (state.activeRoute?.region === '원주교구') {
      if (stamp.role === 'start') return '출발';
      if (stamp.role === 'finish') return '도착';
    }
    if (stamp.displayOrder) return String(stamp.displayOrder);
    if (typeof stamp.id === 'string' && stamp.id.includes('-')) return stamp.id;
    if (stamp.order) return String(stamp.order);
    return stamp.id ? String(stamp.id) : '';
  }

  function createStampMarkerImage(text) {
    const KM = kakao.maps;
    const label = String(text || '').trim() || '·';
    const size = stampMarkerSize(label);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
        <rect x="2" y="2" width="${size.width - 4}" height="${size.height - 4}" rx="${(size.height - 4) / 2}" fill="#fff7e8" stroke="#b7791f" stroke-width="3"/>
        <text x="${size.width / 2}" y="${size.height / 2 + 4}" text-anchor="middle" font-family="Noto Sans KR, Apple SD Gothic Neo, Arial, sans-serif" font-size="13" font-weight="900" fill="#7a4f10">${escapeSvgText(label)}</text>
      </svg>`;
    return new KM.MarkerImage(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      new KM.Size(size.width, size.height),
      { offset: new KM.Point(size.width / 2, size.height / 2) }
    );
  }

  function stampMarkerSize(label) {
    const charCount = Array.from(String(label || '')).length;
    return {
      width: Math.max(40, Math.min(64, 24 + charCount * 10)),
      height: 36
    };
  }

  function escapeSvgText(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function showStampInfo(stamp, position) {
    if (!state.map || !window.kakao?.maps || !stamp) return;
    hideStampInfo();
    const KM = kakao.maps;
    const orderText = stampMarkerText(stamp);
    const title = `${orderText ? orderText + ' ' : ''}${stamp.name || '순례 지점'}`.trim();
    const content = createUnifiedMapInfoCard(title, '지점 정보 닫기');
    state.stampInfoOverlay = new KM.CustomOverlay({
      position,
      content,
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 32
    });
    state.stampInfoOverlay.setMap(state.map);
  }

  function createUnifiedMapInfoCard(title, closeLabel) {
    const content = document.createElement('div');
    const normalizedTitle = String(title || '').trim();
    content.className = 'stamp-info-card unified-map-info-card';
    if (Array.from(normalizedTitle).length >= 16) content.classList.add('is-long-title');
    content.innerHTML = `
      <button class="stamp-info-close" type="button" aria-label="${escapeHtml(closeLabel || '정보 닫기')}">×</button>
      <div class="stamp-info-title">${escapeHtml(normalizedTitle)}</div>
    `;
    content.querySelector('.stamp-info-close')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideStampInfo();
    });
    return content;
  }


  function showLandmarkInfo(landmark, position) {
    if (!state.map || !window.kakao?.maps || !landmark) return;
    hideStampInfo();
    const content = createUnifiedMapInfoCard(landmark.name || '성지', '성지 정보 닫기');
    state.stampInfoOverlay = new kakao.maps.CustomOverlay({
      position,
      content,
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 32
    });
    state.stampInfoOverlay.setMap(state.map);
  }


  function hideStampInfo() {
    if (!state.stampInfoOverlay) return;
    state.stampInfoOverlay.setMap(null);
    state.stampInfoOverlay = null;
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
    clearMapExitBanner();
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

  function requestInitialMapLocation() {
    if (!state.activeRoute || !navigator.geolocation) return Promise.resolve();
    return getCurrentPosition()
      .then((position) => {
        const coords = sanitizeCoords(toCoords(position));
        if (!coords) return;
        state.lastCoords = coords;
        updateMyLocation(coords, { center: true, following: state.following });
        updateRouteStatus(coords);
        saveNavigationState();
      })
      .catch(() => {
        if (state.lastCoords) return;
        $('status-label').textContent = '위치 확인 전';
        $('status-message').textContent = '위치 권한을 허용하면 내 위치가 지도에 표시됩니다.';
        setChip('neutral', '대기');
      });
  }

  function handleFollowControl() {
    clearMapExitBanner();
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
    clearMapExitBanner();
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
    clearMapExitBanner();
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
    events.addListener(state.map, 'dragstart', () => {
      hideStampInfo();
      pauseAutoCenterForManualMapUse(false);
    });
    events.addListener(state.map, 'dragend', () => {
      renderDirectionArrows();
      pauseAutoCenterForManualMapUse(true);
    });
    events.addListener(state.map, 'zoom_start', () => {
      hideStampInfo();
      pauseAutoCenterForManualMapUse(false);
    });
    events.addListener(state.map, 'zoom_changed', () => {
      updateCourseLabelVisibility();
      updateStampMarkerVisibility();
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
    clearMapExitBanner();
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

    const navigationStarted = hasStartedNavigationSession();
    if (navigationStarted) {
      updateNavigationMetrics({ progress, nextStamp });
      renderRouteProgressLines(nearest.distanceAlongM);
    } else {
      const progressEl = $('route-progress');
      const nextEl = $('next-distance');
      if (progressEl) progressEl.textContent = '—';
      if (nextEl) nextEl.textContent = '—';
      renderRouteProgressLines(null);
    }

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
    const sourceSegments = (route?.routeSegments || []).slice();
    const directedSegments = direction === 'reverse' ? sourceSegments.reverse() : sourceSegments;
    const result = [];

    directedSegments.forEach((segment, segmentIndex) => {
      const sourcePoints = (segment.points || []).filter((point) => (
        isFiniteNumber(point.lat) && isFiniteNumber(point.lng)
      ));
      const directedPoints = direction === 'reverse' ? sourcePoints.slice().reverse() : sourcePoints;
      let firstValidPoint = true;
      directedPoints.forEach((point) => {
        pushUniquePoint(result, {
          lat: Number(point.lat),
          lng: Number(point.lng),
          breakBefore: Boolean(route?.preserveSegmentBreaks && segmentIndex > 0 && firstValidPoint)
        });
        firstValidPoint = false;
      });
    });
    return result;
  }

  function flattenRoutePoints(route) {
    return getDirectedRoutePoints(route, 'forward');
  }

  function buildSegmentIndexFromPoints(points) {
    const index = [];
    let distanceSoFar = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (b.breakBefore) continue;
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
    if (state.activeRoute?.preserveSegmentBreaks) {
      clearPolyline('traveledPolyline');
      clearPolyline('futurePolyline');
      renderSegmentedRouteLines(state.activeRoute);
      return;
    }
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
      strokeColor: routeUsesRepresentativeLine(state.activeRoute)
        ? '#b7791f'
        : (state.activeRoute?.routeDisplayColor || '#1d4ed8'),
      strokeOpacity: 0.95,
      strokeStyle: routeUsesRepresentativeLine(state.activeRoute) ? 'shortdash' : 'solid'
    });
  }

  function renderWalkedTrack() {
    if (!state.map || !window.kakao?.maps) return;
    const track = state.walkedTrack.filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng));
    if (!hasStartedNavigationSession() || track.length < 2) {
      clearPolyline('walkedTrackPolyline');
      return;
    }
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
    content.setAttribute('aria-hidden', 'true');
    content.innerHTML = '<svg class="direction-arrow-svg" viewBox="0 0 24 24" focusable="false"><path d="M6 15 L12 9 L18 15"></path></svg>';
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
    if (!state.activeRoute || hasStartedNavigationSession()) return;
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
    const started = hasStartedNavigationSession();
    if (followBtn) {
      followBtn.classList.toggle('pause', state.following);
      followBtn.classList.toggle('start', !state.following);
      followBtn.disabled = false;
      followBtn.innerHTML = state.following
        ? '정지 <span aria-hidden="true">Ⅱ</span>'
        : started
          ? '재시작 <span aria-hidden="true">▶</span>'
          : '시작 <span aria-hidden="true">▶</span>';
    }
    if (endBtn) endBtn.hidden = state.following || !started;
    if (directionBtn) directionBtn.hidden = !state.activeRoute || started;
    if (row) {
      row.classList.toggle('single', !state.activeRoute || started);
      row.classList.toggle('has-end', !state.following && started);
    }
    updateDirectionButton();
  }

  function hasStartedNavigationSession() {
    return Boolean(state.following || state.walkedTrack.length > 0 || state.elapsedActiveMs > 0 || state.activeSince);
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

  function routeRevision(route) {
    const parts = [String(route?.id || '')];
    (route?.routeSegments || []).forEach((segment) => {
      const points = (segment.points || []).filter((point) => isFiniteNumber(point.lat) && isFiniteNumber(point.lng));
      const first = points[0];
      const last = points[points.length - 1];
      parts.push([
        String(segment.id || ''),
        String(points.length),
        first ? `${Number(first.lat).toFixed(6)},${Number(first.lng).toFixed(6)}` : '',
        last ? `${Number(last.lat).toFixed(6)},${Number(last.lng).toFixed(6)}` : ''
      ].join(':'));
    });
    return parts.join('|');
  }

  function validRestoreStateForRoute(route, saved) {
    if (!saved?.navigationStarted) return null;
    if (saved.routeId !== route?.id) return null;
    if (saved.routeRevision !== routeRevision(route)) return null;
    return saved;
  }

  function restoreNavigationIfValid() {
    const saved = loadTemporaryNavigationState();
    if (!saved) return;
    if (isTemporaryNavigationExpired(saved)) {
      clearTemporaryNavigationState();
      return;
    }
    const route = findRouteForRestore(saved.routeId);
    if (!route || !validRestoreStateForRoute(route, saved)) {
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
    if (!hasStartedNavigationSession()) {
      clearTemporaryNavigationState();
      return;
    }
    const data = {
      routeId: state.activeRoute.id,
      routeRevision: routeRevision(state.activeRoute),
      navigationStarted: true,
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
    points.push({ lat: Number(point.lat), lng: Number(point.lng), ...(point.breakBefore ? { breakBefore: true } : {}) });
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
