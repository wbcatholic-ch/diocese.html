
'use strict';

function hideCoverAndRun(callback) {
  try{
    document.querySelectorAll('.module-view.open,#prayer-view.open,#diocese-view.open,#missa-view.open').forEach(function(v){v.classList.remove('open');});
    var pd=document.getElementById('prayer-detail'); if(pd) pd.classList.remove('show');
    if(typeof closeAllTabs==='function') closeAllTabs();
    if(typeof closeInfoCard==='function') closeInfoCard();
    window.__OAI_PRAYER_COVER_NEEDS_FIRST_TOAST__ = false;
    sessionStorage.removeItem('oai_prayer_cover_needs_first_toast');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  window._noAutoNearby = false;
  var cv = document.getElementById('cover');
  if (cv) cv.style.display = 'none';
  document.documentElement.classList.add('app-active');
  if (callback) requestAnimationFrame(function(){ setTimeout(callback, 0); });
}

var OAI_EXTERNAL_LEAVE_HOLD_MS = 6000;
var OAI_EXTERNAL_LEAVE_HARD_MS = 6500;
var OAI_EXTERNAL_ENTRY_GUARD_HARD_MS = 16000;
var OAI_EXTERNAL_ENTRY_NAV_DELAY_MS = 550;
try{ window.OAI_EXTERNAL_ENTRY_NAV_DELAY_MS = OAI_EXTERNAL_ENTRY_NAV_DELAY_MS; }catch(_e){}
var OAI_EXTERNAL_RETURN_MIN_MS = 1550;
var OAI_EXTERNAL_RETURN_MAX_MS = 3400;
var OAI_EXTERNAL_RETURN_STABLE_TICKS = 3;
var OAI_REFRESH_VEIL_MS = 620; // refresh veil is short: cover only the transition, not the whole reload
var OAI_REFRESH_CARRY_MS = 900;
var OAI_REFRESH_PROGRESS_HOLD_MS = 6000;
var OAI_REFRESH_PRE_NAV_HOLD_MS = 720;



function oaiPrimeExternalDestination(url){
  try{
    var u = new URL(String(url || ''), location.href);
    if(!/^https?:$/.test(u.protocol)) return;
    var origin = u.origin;
    if(!origin || origin === location.origin) return;
    if(!document.head) return;
    var idBase = 'oai-ext-prime-' + origin.replace(/[^a-z0-9]/gi,'-').toLowerCase();
    if(!document.getElementById(idBase + '-dns')){
      var dns = document.createElement('link');
      dns.id = idBase + '-dns';
      dns.rel = 'dns-prefetch';
      dns.href = origin;
      document.head.appendChild(dns);
    }
    if(!document.getElementById(idBase + '-pre')){
      var pre = document.createElement('link');
      pre.id = idBase + '-pre';
      pre.rel = 'preconnect';
      pre.href = origin;
      pre.crossOrigin = 'anonymous';
      document.head.appendChild(pre);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.oaiPrimeExternalDestination = oaiPrimeExternalDestination; }catch(e){ console.warn('[가톨릭길동무]', e); }

function oaiShowExternalEntryGuard(kind){
  // V8-1-14-621:
  // Android 233/239 외부 브라우저 위임 전후에 쓰는 단일 보호창. entry/return 모두 같은 DOM 하나만 사용한다.
  try{
    var body = document.body;
    if(!body) return;
    var guard = document.getElementById('oai-external-entry-guard');
    if(!guard){
      guard = document.createElement('div');
      guard.id = 'oai-external-entry-guard';
      guard.setAttribute('aria-hidden','true');
      body.appendChild(guard);
    }
    guard.innerHTML = '<div class="oai-external-entry-cross" aria-hidden="true"></div>';
    guard.setAttribute('data-oai-kind', String(kind || 'external-site'));
    guard.classList.remove('hide');
    guard.classList.add('show');
    guard.style.setProperty('position','fixed','important');
    guard.style.setProperty('inset','0','important');
    guard.style.setProperty('z-index','2147483640','important');
    guard.style.setProperty('display','flex','important');
    guard.style.setProperty('align-items','center','important');
    guard.style.setProperty('justify-content','center','important');
    guard.style.setProperty('background','#f5f0e8','important');
    guard.style.setProperty('opacity','1','important');
    guard.style.setProperty('visibility','visible','important');
    guard.style.setProperty('pointer-events','auto','important');
    void guard.offsetHeight;
    clearTimeout(window.__oaiExternalEntryGuardTimer);
    var guardHoldMs = (kind === 'external-return') ? (OAI_EXTERNAL_RETURN_MAX_MS + 500) : 2400;
    window.__oaiExternalEntryGuardTimer = setTimeout(function(){
      try{ oaiHideExternalEntryGuard('auto-timeout'); }catch(_e){}
    }, guardHoldMs);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiHideExternalEntryGuard(reason){
  try{
    clearTimeout(window.__oaiExternalEntryGuardTimer);
    var guard = document.getElementById('oai-external-entry-guard');
    if(!guard) return;
    var r = String(reason || '');
    var immediate = /external-pagehide|external-hidden|external-launch-not-hidden/i.test(r);
    guard.classList.remove('show');
    guard.classList.add('hide');
    if(immediate){
      guard.style.display = 'none';
      guard.style.opacity = '0';
      guard.style.visibility = 'hidden';
      if(guard.parentNode) guard.parentNode.removeChild(guard);
      return;
    }
    var removeDelay = /external-return-finish/i.test(r) ? 220 : 120;
    setTimeout(function(){
      try{
        var g = document.getElementById('oai-external-entry-guard');
        if(g && !g.classList.contains('show')){
          g.style.display = 'none';
          if(g.parentNode) g.parentNode.removeChild(g);
        }
      }catch(_e){}
    }, removeDelay);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.oaiShowExternalEntryGuard = oaiShowExternalEntryGuard; window.oaiHideExternalEntryGuard = oaiHideExternalEntryGuard; }catch(e){ console.warn('[가톨릭길동무]', e); }

function oaiIsExternalReturnBackSuppressActive(){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    var localUntil = parseInt(window.__oaiExternalReturnBackSuppressUntil || '0', 10) || 0;
    var storedUntil = parseInt(sessionStorage.getItem('oai_external_return_back_suppress_until') || '0', 10) || 0;
    var until = Math.max(localUntil, storedUntil);
    if(until && now < until) return true;
    if(until){
      window.__oaiExternalReturnBackSuppressUntil = 0;
      sessionStorage.removeItem('oai_external_return_back_suppress_until');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}
function oaiExternalReturnBackContextActive(){
  try{
    var root = document.documentElement;
    return !!(
      (window.__oaiExternalReturnStabilizing === true) ||
      root.classList.contains('oai-external-return-freeze') ||
      root.classList.contains('oai-external-leaving') ||
      root.getAttribute('data-oai-external-return-early') === '1' ||
      sessionStorage.getItem('oai_external_nav_pending') === '1' ||
      sessionStorage.getItem('oai_external_nav_pagehide') === '1' ||
      sessionStorage.getItem('oai_external_return_expected') === '1'
    );
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function oaiSuppressExternalReturnForUserBack(reason){
  try{
    if(!oaiExternalReturnBackContextActive() && !oaiIsExternalReturnBackSuppressActive()) return false;
    var now = Date.now ? Date.now() : new Date().getTime();
    var until = now + 1800;
    window.__oaiExternalReturnBackSuppressUntil = until;
    sessionStorage.setItem('oai_external_return_back_suppress_until', String(until));
    window.__oaiExternalReturnStabilizing = false;
    clearInterval(window.__oaiExternalReturnStableTimer);
    clearTimeout(window.__oaiExternalLaunchWatchdogTimer);
    try{ oaiHideExternalEntryGuard('external-return-user-back'); }catch(_e){}
    try{ oaiClearExternalNavigationState(); }catch(_e){
      var root = document.documentElement;
      root.classList.remove('oai-external-return-freeze','oai-external-leaving','oai-stability-veil','oai-stability-veil-releasing');
      root.removeAttribute('data-oai-stability-reason');
      root.removeAttribute('data-oai-external-return-early');
      sessionStorage.removeItem('oai_external_nav_started_at');
      sessionStorage.removeItem('oai_external_nav_pagehide');
      sessionStorage.removeItem('oai_external_nav_kind');
      sessionStorage.removeItem('oai_external_nav_pending');
      sessionStorage.removeItem('oai_external_nav_hold_until');
      sessionStorage.removeItem('oai_external_nav_force_release_at');
      sessionStorage.removeItem('oai_external_return_expected');
    }
    return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
try{
  window.oaiIsExternalReturnBackSuppressActive = oaiIsExternalReturnBackSuppressActive;
  window.oaiSuppressExternalReturnForUserBack = oaiSuppressExternalReturnForUserBack;
}catch(e){ console.warn('[가톨릭길동무]', e); }


function markExternalReturnStabilize(kind){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    var stamp = String(now);
    sessionStorage.setItem('oai_external_nav_started_at', stamp);
    sessionStorage.setItem('oai_external_nav_kind', kind || 'external');
    sessionStorage.setItem('oai_external_nav_pending', '1');
    sessionStorage.setItem('oai_external_nav_hold_until', String(now + OAI_EXTERNAL_LEAVE_HOLD_MS));
    sessionStorage.setItem('oai_external_nav_force_release_at', String(now + OAI_EXTERNAL_LEAVE_HARD_MS));
    sessionStorage.setItem('oai_external_return_no_intro_until', String(now + 10 * 60 * 1000));
    sessionStorage.setItem('oai_external_return_expected', '1');
    sessionStorage.removeItem('oai_external_browser_leave_at');
    sessionStorage.removeItem('oai_external_browser_kind');
    sessionStorage.removeItem('oai_external_browser_return_pending');
    sessionStorage.removeItem('oai_external_browser_hidden');
    document.documentElement.classList.add('oai-external-leaving');
    // V8-1-14-621: 외부 이동 전 보호창은 #oai-external-entry-guard로 유지하고, 숨김 복귀 때도 같은 보호창을 이어서 사용한다.
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
try{ window.markExternalReturnStabilize = markExternalReturnStabilize; }catch(e){ console.warn("[가톨릭길동무]", e); }

function oaiStartExternalLaunchWatchdog(kind){
  try{
    clearTimeout(window.__oaiExternalLaunchWatchdogTimer);
    window.__oaiExternalLaunchWatchdogTimer = setTimeout(function(){
      try{
        var pending = sessionStorage.getItem('oai_external_nav_pending') === '1';
        var hidden = document.visibilityState === 'hidden' || sessionStorage.getItem('oai_external_nav_pagehide') === '1';
        if(pending && !hidden){
          // 외부 브라우저로 실제 이탈하지 못한 경우: 복귀 처리로 오인하지 않도록 즉시 정리한다.
          try{ oaiHideExternalEntryGuard('external-launch-not-hidden'); }catch(_e){}
          try{ oaiClearExternalNavigationState(); }catch(_e){}
        }
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    }, 1800);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.oaiStartExternalLaunchWatchdog = oaiStartExternalLaunchWatchdog; }catch(e){ console.warn('[가톨릭길동무]', e); }


function oaiIsRefreshVeilReason(reason){
  return /refresh|reload|auto-update|cache/i.test(String(reason || ''));
}
function oaiRefreshVeilVisibleUntil(){
  try{
    var stored = parseInt(sessionStorage.getItem('oai_refresh_veil_visible_until') || '0', 10) || 0;
    var local = parseInt(window.__oaiRefreshVeilLocalVisibleUntil || '0', 10) || 0;
    return Math.max(stored, local);
  }catch(_e){ return parseInt(window.__oaiRefreshVeilLocalVisibleUntil || '0', 10) || 0; }
}
function oaiReleaseStabilityVeil(){
  try{
    var root = document.documentElement;
    if(window.__oaiExternalReturnStabilizing && root.classList.contains('oai-external-return-freeze') && !root.classList.contains('oai-stability-veil')){
      return;
    }
    var reason = root.getAttribute('data-oai-stability-reason') || '';
    if(oaiIsRefreshVeilReason(reason)){
      var minUntil = oaiRefreshVeilVisibleUntil();
      var now = Date.now ? Date.now() : new Date().getTime();
      if(minUntil && now < minUntil){
        clearTimeout(window.__oaiStabilityVeilTimer);
        window.__oaiStabilityVeilTimer = setTimeout(oaiReleaseStabilityVeil, Math.max(80, Math.min(900, minUntil - now)));
        return;
      }
    }
    if(reason === 'external-leave'){
      var pending = false, pageHidden = false, forceAt = 0;
      try{
        pending = sessionStorage.getItem('oai_external_nav_pending') === '1';
        pageHidden = sessionStorage.getItem('oai_external_nav_pagehide') === '1' || document.visibilityState === 'hidden';
        forceAt = parseInt(sessionStorage.getItem('oai_external_nav_force_release_at') || '0', 10) || 0;
      }catch(_e){}
      if(pending && pageHidden){
        clearTimeout(window.__oaiStabilityVeilTimer);
        window.__oaiStabilityVeilTimer = setTimeout(oaiReleaseStabilityVeil, 900);
        return;
      }
      if(pending && !pageHidden && forceAt && Date.now && Date.now() < forceAt){
        clearTimeout(window.__oaiStabilityVeilTimer);
        window.__oaiStabilityVeilTimer = setTimeout(oaiReleaseStabilityVeil, Math.min(900, Math.max(120, forceAt - Date.now())));
        return;
      }
      if(pending && !pageHidden && forceAt && Date.now && Date.now() >= forceAt){
        try{
          sessionStorage.removeItem('oai_external_nav_pending');
          sessionStorage.removeItem('oai_external_nav_hold_until');
          sessionStorage.removeItem('oai_external_nav_force_release_at');
        }catch(_e){}
      }
    }
    clearTimeout(window.__oaiStabilityVeilTimer);
    if(root.classList.contains('oai-external-return-freeze') && !root.classList.contains('oai-stability-veil')){
      // V8-1-14-621:
      // 외부사이트 복귀 보호창은 유지하되, 마지막 제거 순간을 부드럽게 처리해 첫 화면 깜빡임을 줄인다.
      if(!root.classList.contains('oai-external-return-releasing')){
        root.classList.add('oai-external-return-releasing');
        setTimeout(function(){
          try{
            root.classList.remove('oai-external-return-freeze','oai-external-return-releasing','oai-external-leaving');
            root.removeAttribute('data-oai-stability-reason');
          }catch(_e){}
        }, 180);
      }
      return;
    }
    if(root.classList.contains('oai-stability-veil') && !root.classList.contains('oai-stability-veil-releasing')){
      root.classList.add('oai-stability-veil-releasing');
      setTimeout(function(){
        try{
          root.classList.remove('oai-stability-veil','oai-external-return-freeze','oai-external-return-releasing','oai-external-leaving','oai-stability-veil-releasing');
          root.removeAttribute('data-oai-stability-reason');
          try{ sessionStorage.removeItem('oai_refresh_veil_visible_until'); window.__oaiRefreshVeilLocalVisibleUntil = 0; }catch(_e){}
        }catch(_e){}
      }, 180);
    }else{
      root.classList.remove('oai-stability-veil','oai-external-return-freeze','oai-external-return-releasing','oai-external-leaving','oai-stability-veil-releasing');
      root.removeAttribute('data-oai-stability-reason');
      try{ sessionStorage.removeItem('oai_refresh_veil_visible_until'); window.__oaiRefreshVeilLocalVisibleUntil = 0; }catch(_e){}
    }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function oaiMarkUnifiedRefreshReload(reason){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    sessionStorage.setItem('oai_unified_refresh_reload_once','1');
    sessionStorage.setItem('oai_unified_refresh_reload_at', String(now));
    sessionStorage.setItem('oai_unified_refresh_reload_reason', reason || 'unified-refresh');
    sessionStorage.setItem('oai_soft_refresh_requested', String(now));
    ['oai_refresh_veil_until','oai_refresh_veil_hold_ms','oai_refresh_veil_reason','oai_refresh_veil_visible_until'].forEach(function(k){
      try{ sessionStorage.removeItem(k); }catch(_e){}
    });
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiEnsureUnifiedRefreshGuard(){
  try{
    var body = document.body || document.documentElement;
    var guard = document.getElementById('oai-unified-refresh-guard');
    if(!guard){
      guard = document.createElement('div');
      guard.id = 'oai-unified-refresh-guard';
      guard.setAttribute('aria-hidden','true');
      var cross = document.createElement('div');
      cross.className = 'oai-unified-refresh-cross';
      cross.textContent = '';
      guard.appendChild(cross);
      body.appendChild(guard);
    }else if(!guard.querySelector('.oai-unified-refresh-cross')){
      guard.innerHTML = '<div class="oai-unified-refresh-cross" aria-hidden="true"></div>';
    }
    guard.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483200!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#f5f0e8!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:none!important;animation:none!important;contain:strict!important;';
    var c = guard.querySelector('.oai-unified-refresh-cross');
    if(c){
      c.removeAttribute('style');
    }
    return guard;
  }catch(e){ console.warn('[가톨릭길동무]', e); return null; }
}
function oaiShowUnifiedRefreshGuard(reason){
  try{
    var root = document.documentElement;
    clearTimeout(window.__oaiUnifiedRefreshGuardFallback);
    clearTimeout(window.__oaiStabilityVeilTimer);
    clearTimeout(window.__oaiStabilityVeilHardTimer);
    root.classList.remove('oai-stability-veil','oai-stability-veil-releasing');
    root.removeAttribute('data-oai-stability-reason');
    root.removeAttribute('data-oai-refresh-early-veil');
    root.setAttribute('data-oai-refresh-guard-active','1');
    var guard = oaiEnsureUnifiedRefreshGuard();
    if(guard) guard.setAttribute('data-oai-refresh-reason', reason || 'unified-refresh');
    window.__oaiUnifiedRefreshGuardFallback = setTimeout(function(){
      try{ oaiHideUnifiedRefreshGuard(0); }catch(_e){}
    }, 15000);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiHideUnifiedRefreshGuard(delay){
  try{
    clearTimeout(window.__oaiUnifiedRefreshGuardFallback);
    var root = document.documentElement;
    root.removeAttribute('data-oai-refresh-guard-active');
    var run = function(){
      try{
        var guard = document.getElementById('oai-unified-refresh-guard');
        if(guard && guard.parentNode) guard.parentNode.removeChild(guard);
      }catch(_e){}
    };
    if(delay && delay > 0) setTimeout(run, delay); else run();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiClearRefreshVeilBeforeReload(keepCurrentVeil){
  try{
    var root = document.documentElement;
    clearTimeout(window.__oaiStabilityVeilTimer);
    clearTimeout(window.__oaiStabilityVeilHardTimer);
    ['oai_refresh_veil_until','oai_refresh_veil_hold_ms','oai_refresh_veil_reason','oai_refresh_veil_visible_until'].forEach(function(k){
      try{ sessionStorage.removeItem(k); }catch(_e){}
    });
    window.__oaiRefreshVeilLocalVisibleUntil = 0;
    root.classList.remove('oai-stability-veil','oai-stability-veil-releasing');
    root.removeAttribute('data-oai-stability-reason');
    root.removeAttribute('data-oai-refresh-early-veil');
    oaiMarkUnifiedRefreshReload('unified-refresh');
    if(keepCurrentVeil === true){
      // 짧은/긴 새로고침 모두 현재 문서의 단일 보호창을 unload 전까지만 유지한다.
      // 새 문서에서 재표시하지 않도록 session carry key는 이미 제거하고, no-intro once key만 남긴다.
      if(!document.getElementById('oai-unified-refresh-guard')) oaiShowUnifiedRefreshGuard('unified-refresh');
      clearTimeout(window.__oaiUnifiedRefreshGuardFallback);
      window.__oaiUnifiedRefreshGuardFallback = setTimeout(function(){
        try{ oaiHideUnifiedRefreshGuard(0); }catch(_e){}
      }, 12000);
      return;
    }
    oaiHideUnifiedRefreshGuard(0);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiHoldStabilityVeil(reason, duration){
  try{
    var root = document.documentElement;
    var d = duration || 420;
    root.classList.remove('oai-stability-veil-releasing');
    root.classList.add('oai-stability-veil');
    root.setAttribute('data-oai-stability-reason', reason || 'stabilize');
    clearTimeout(window.__oaiStabilityVeilTimer);
    window.__oaiStabilityVeilTimer = setTimeout(oaiReleaseStabilityVeil, d);
    clearTimeout(window.__oaiStabilityVeilHardTimer);
    var hard = (reason === 'external-leave') ? OAI_EXTERNAL_LEAVE_HARD_MS : Math.max(d + 650, 2200);
    window.__oaiStabilityVeilHardTimer = setTimeout(oaiReleaseStabilityVeil, hard);
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
window.oaiHoldStabilityVeil = oaiHoldStabilityVeil;
window.oaiReleaseStabilityVeil = oaiReleaseStabilityVeil;

function oaiMarkRefreshHistoryCompact(reason){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    sessionStorage.setItem('oai_refresh_history_compact_until', String(now + 10 * 60 * 1000));
    sessionStorage.setItem('oai_refresh_history_compact_reason', reason || 'refresh');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiPrepareRefreshVeil(reason, duration, carryDuration, showBeforeNavigation, beforeNavigationHold, carryToNextDocument){
  try{
    ['oai_refresh_veil_until','oai_refresh_veil_hold_ms','oai_refresh_veil_reason','oai_refresh_veil_visible_until'].forEach(function(k){
      try{ sessionStorage.removeItem(k); }catch(_e){}
    });
    window.__oaiRefreshVeilLocalVisibleUntil = 0;
    oaiMarkRefreshHistoryCompact(reason || 'unified-refresh');
    if(showBeforeNavigation === true){
      oaiShowUnifiedRefreshGuard(reason || 'unified-refresh');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiAfterRefreshVeilPaint(callback){
  try{
    var run=function(){ setTimeout(function(){ try{ callback(); }catch(e){ console.warn('[가톨릭길동무]', e); } }, 90); };
    if(window.requestAnimationFrame){ requestAnimationFrame(function(){ requestAnimationFrame(run); }); }
    else setTimeout(run, 32);
  }catch(e){ try{ callback(); }catch(_e){} }
}
function oaiApplyPendingRefreshVeil(){
  try{
    // V8-1-14-621: 새로고침 보호창은 짧은/긴 새로고침 모두 reload 전 현재 문서에서만 1회 사용한다.
    // 새 문서에서 pending refresh veil을 다시 표시하면 보호창이 두 번 보이므로, 남은 key는 여기서 정리만 한다.
    var root = document.documentElement;
    var hadPending = false;
    ['oai_refresh_veil_until','oai_refresh_veil_hold_ms','oai_refresh_veil_reason','oai_refresh_veil_visible_until'].forEach(function(k){
      try{ if(sessionStorage.getItem(k)){ hadPending = true; sessionStorage.removeItem(k); } }catch(_e){}
    });
    if(hadPending && root && root.classList){
      root.classList.remove('oai-stability-veil','oai-stability-veil-releasing');
      root.removeAttribute('data-oai-stability-reason');
      root.removeAttribute('data-oai-refresh-early-veil');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
window.oaiPrepareRefreshVeil = oaiPrepareRefreshVeil;
window.oaiMarkRefreshHistoryCompact = oaiMarkRefreshHistoryCompact;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', oaiApplyPendingRefreshVeil, {once:true});
else oaiApplyPendingRefreshVeil();

function oaiClearInternalReturnEffects(reason){
  try{
    var root = document.documentElement;
    root.classList.remove('oai-internal-no-return-effect','oai-internal-return-freeze','oai-external-return-freeze','oai-external-return-releasing','oai-external-leaving');
    root.removeAttribute('data-oai-external-return-early');
    sessionStorage.removeItem('oai_internal_return_no_effect_once');
    sessionStorage.removeItem('oai_internal_return_no_effect_until');
    sessionStorage.removeItem('oai_internal_return_no_effect_reason');
    sessionStorage.removeItem('oai_internal_page_nav');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiConsumeInternalReturnNoEffect(reason){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    var once = sessionStorage.getItem('oai_internal_return_no_effect_once') === '1';
    var until = parseInt(sessionStorage.getItem('oai_internal_return_no_effect_until') || '0', 10) || 0;
    if(once || (until && now < until)){
      oaiClearInternalReturnEffects(reason || 'consume');
      return true;
    }
    if(until) oaiClearInternalReturnEffects(reason || 'expired');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

function oaiClearExternalNavigationState(opts){
  opts = opts || {};
  try{
    var html = document.documentElement;
    html.classList.remove('oai-navigating-out','oai-external-return-prepaint','oai-external-return-stabilize','oai-missa-return-stabilize','oai-external-leaving');
    html.removeAttribute('data-oai-external-return-early');
    if(!opts.keepVeil){
      html.classList.remove('oai-external-return-freeze','oai-external-return-releasing');
      var reason = html.getAttribute('data-oai-stability-reason') || '';
      if(!oaiIsRefreshVeilReason(reason)){
        html.classList.remove('oai-stability-veil','oai-stability-veil-releasing');
        html.removeAttribute('data-oai-stability-reason');
      }
    }
    sessionStorage.removeItem('oai_external_nav_started_at');
    sessionStorage.removeItem('oai_external_nav_pagehide');
    sessionStorage.removeItem('oai_external_nav_kind');
    sessionStorage.removeItem('oai_external_nav_pending');
    sessionStorage.removeItem('oai_external_nav_hold_until');
    sessionStorage.removeItem('oai_external_nav_force_release_at');
    sessionStorage.removeItem('oai_external_return_no_intro_until');
    sessionStorage.removeItem('oai_external_return_expected');
    sessionStorage.removeItem('oai_external_browser_leave_at');
    sessionStorage.removeItem('oai_external_browser_kind');
    sessionStorage.removeItem('oai_external_browser_return_pending');
    sessionStorage.removeItem('oai_external_browser_hidden');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{
    var v = document.getElementById('oai-nav-veil');
    if(v && v.parentNode) v.parentNode.removeChild(v);
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}




(function(){
  'use strict';
  if(window.__OAI_BACKGROUND_RETURN_MANAGER_V356__) return;
  window.__OAI_BACKGROUND_RETURN_MANAGER_V356__ = true;
  window.__OAI_IDLE_RESTART_GUARD__ = true;

  /* V8-1-14-621:
     백그라운드 복귀 판단은 PWA 한 곳에서 담당한다.
     30분 안 복귀는 화면을 다시 만들지 않고 원상태를 그대로 유지한다.
     30분 이상 복귀만 논리적 새 시작으로 보고 인트로 재생 후 cover로 정리한다. */
  var COVER_BG_RETURN_MS = 30 * 60 * 1000;
  var BG_KEY = 'oai_bg_started_at_v356';
  var BG_TOKEN_KEY = 'oai_bg_token_v356';
  var SHORT_SUPPRESS_KEY = 'oai_short_background_return_until_v356';
  var _bgStarted = 0;
  var _bgToken = '';
  var _bgArmed = false;
  var _returnTimer = 0;
  var _veilTimer = 0;
  var _decisionSeq = 0;
  var _resumeFreezeTimer = 0;
  var _bgMapStabilizeTimer = 0;
  var _bgMapStableView = null;

  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function isNativeAndroid(){
    try{ return /GildongmuAndroid\/\d+/i.test(navigator.userAgent||'') || !!window.GildongmuNative; }catch(_e){ return false; }
  }
  var _handledNativeCycles = Object.create(null);

  function removeKey(store, key){ try{ store.removeItem(key); }catch(_e){} }
  function clearLegacyBackgroundReturnState(preserveRuntimeFreeze){
    try{
      preserveRuntimeFreeze = !!preserveRuntimeFreeze;
      var ss = sessionStorage, ls = localStorage;
      [
        'oai_home_backgrounded_at','oai_home_background_token_v345','oai_home_background_token_v344','oai_home_background_token_v340',
        'oai_pwa_backgrounded_at_v356','oai_pwa_idle_restart_lock_v356','oai_resume_return_veil_pending',
        'oai_background_intro_return_until','oai_long_background_early_intro_consumed',
        'oai_background_cover_reset_requested','oai_hidden_at','oai_hidden_at_v292','oai_hidden_at_v293',
        'oai_short_background_return_until_v345','oai_short_background_return_until_v344','oai_short_background_return_until_v340'
      ].forEach(function(k){ removeKey(ss,k); removeKey(ls,k); });
      var root = document.documentElement;
      if(root && root.classList){
        var cls = [
          'oai-resume-freeze','oai-resume-return-veil',
          'oai-home-return-soft-veil','oai-home-return-soft-veil-releasing',
          'oai-background-return-stabilizing','oai-background-return-stabilizing-release',
          'oai-background-return-intro','oai-cover-under-intro-reveal'
        ];
        if(preserveRuntimeFreeze) cls = cls.filter(function(c){ return c !== 'oai-resume-freeze'; });
        root.classList.remove.apply(root.classList, cls);
        if(!preserveRuntimeFreeze){
          root.removeAttribute('data-oai-resume-freeze');
          root.removeAttribute('data-oai-resume-reason');
        }
        root.removeAttribute('data-oai-home-return-reason');
        root.removeAttribute('data-oai-background-return-reason');
        root.removeAttribute('data-oai-return-coordinator');
      }
      if(!preserveRuntimeFreeze){
        clearTimeout(_resumeFreezeTimer);
        window.__OAI_BACKGROUND_RESUME_FREEZE_UNTIL__ = 0;
        window.__OAI_BACKGROUND_RESUME_FREEZE_REASON__ = '';
      }
      window.__OAI_RETURN_COORDINATOR_UNTIL__ = 0;
      window.__OAI_RETURN_COORDINATOR_REASON__ = '';
      window.__OAI_ANDROID_NATIVE_SHORT_RESUME_UNTIL__ = 0;
      window.__OAI_ANDROID_NATIVE_FORCE_COVER_UNTIL = 0;
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function isResumeFreezeActive(){
    try{ return now() < (Number(window.__OAI_BACKGROUND_RESUME_FREEZE_UNTIL__ || 0) || 0); }
    catch(_e){ return false; }
  }
  function releaseResumeFreezeIfExpired(){
    try{
      if(isResumeFreezeActive()) return;
      var root = document.documentElement;
      if(root && root.classList) root.classList.remove('oai-resume-freeze');
      if(root){
        root.removeAttribute('data-oai-resume-freeze');
        root.removeAttribute('data-oai-resume-reason');
      }
      window.__OAI_BACKGROUND_RESUME_FREEZE_REASON__ = '';
    }catch(_e){}
  }
  function armResumeFreeze(ms, reason){
    try{
      var dur = Math.max(220, Number(ms) || 900);
      var until = Math.max(Number(window.__OAI_BACKGROUND_RESUME_FREEZE_UNTIL__ || 0) || 0, now() + dur);
      window.__OAI_BACKGROUND_RESUME_FREEZE_UNTIL__ = until;
      window.__OAI_BACKGROUND_RESUME_FREEZE_REASON__ = String(reason || 'background-return-stabilize');
      var root = document.documentElement;
      if(root && root.classList){
        root.classList.add('oai-resume-freeze');
        root.setAttribute('data-oai-resume-freeze','1');
        root.setAttribute('data-oai-resume-reason', String(reason || 'background-return-stabilize'));
      }
      clearTimeout(_resumeFreezeTimer);
      _resumeFreezeTimer = setTimeout(releaseResumeFreezeIfExpired, Math.max(260, until - now() + 80));
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  try{
    window.__oaiArmResumeFreeze = armResumeFreeze;
    window.__oaiIsResumeFreeze = isResumeFreezeActive;
  }catch(_e){}

  function captureBackgroundMainMapView(){
    try{
      var m = window._map;
      if(!m) return null;
      return {
        center: (typeof m.getCenter === 'function') ? m.getCenter() : null,
        level:  (typeof m.getLevel  === 'function') ? m.getLevel()  : null,
        mode: String(window._mode || ''),
        tab: String(window._activeTab || '')
      };
    }catch(_e){ return null; }
  }
  function restoreBackgroundMainMapView(view){
    try{
      var m = window._map;
      if(!view || !m) return;
      if(view.level != null && typeof m.getLevel === 'function' && typeof m.setLevel === 'function' && m.getLevel() !== view.level) m.setLevel(view.level);
      if(view.center && typeof m.setCenter === 'function') m.setCenter(view.center);
    }catch(_e){}
  }
  function isMainPlaceMapActive(){
    try{
      var mode = String(window._mode || '');
      if(!/^(shrine|parish|retreat)$/.test(mode)) return false;
      if(!document.documentElement.classList.contains('app-active')) return false;
      var wrap = document.getElementById('map-wrap');
      return !!(wrap && wrap.offsetWidth > 0 && wrap.offsetHeight > 0);
    }catch(_e){ return false; }
  }
  function scheduleShortReturnMapStabilize(reason){
    try{
      clearTimeout(_bgMapStabilizeTimer);
      var view = _bgMapStableView || captureBackgroundMainMapView();
      if(!view) return;
      _bgMapStabilizeTimer = setTimeout(function(){
        try{
          if(!isMainPlaceMapActive()) return;
          var m = window._map;
          if(!m) return;
          if(typeof m.relayout === 'function') m.relayout();
          restoreBackgroundMainMapView(view);
          /* V8-1-14-679:
             짧은 background 복귀는 기존 지도를 다시 만들지 않는다. 이미 지도 객체가 살아 있는데
             map-loading-layer만 남은 경우에는 이 시점에 준비 상태를 종료해 무한 로딩 십자가를 막는다. */
          try{ if(typeof _completeCategoryMapSurface === 'function') _completeCategoryMapSurface(); }catch(_e){}
        }catch(_e){}
      }, 150);
      setTimeout(function(){ try{ releaseResumeFreezeIfExpired(); }catch(_e){} }, 1120);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function clearBgStamp(){
    _bgStarted = 0;
    _bgToken = '';
    _bgArmed = false;
    try{
      sessionStorage.removeItem(BG_KEY);
      sessionStorage.removeItem(BG_TOKEN_KEY);
      sessionStorage.removeItem('oai_home_backgrounded_at');
      sessionStorage.removeItem('oai_home_background_token_v345');
      sessionStorage.removeItem('oai_home_background_token_v344');
      sessionStorage.removeItem('oai_home_background_token_v340');
      localStorage.removeItem(BG_KEY);
      localStorage.removeItem(BG_TOKEN_KEY);
      localStorage.removeItem('oai_home_backgrounded_at');
      localStorage.removeItem('oai_home_background_token_v345');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function readRuntimeBackground(){
    try{
      if(!_bgArmed || !_bgStarted || !_bgToken) return null;
      var stored = parseInt(sessionStorage.getItem(BG_KEY) || '0', 10) || 0;
      var storedToken = sessionStorage.getItem(BG_TOKEN_KEY) || '';
      if(stored !== _bgStarted || storedToken !== _bgToken) return null;
      return {started: stored, token: storedToken, elapsed: Math.max(0, now() - stored)};
    }catch(_e){ return null; }
  }

  function hasRuntimeBackgroundStamp(){
    try{
      if(_bgArmed && _bgStarted && _bgToken) return true;
      return !!(sessionStorage.getItem(BG_KEY) && sessionStorage.getItem(BG_TOKEN_KEY));
    }catch(_e){ return false; }
  }

  function armShortSuppress(){
    try{
      var until = now() + 12000;
      window.__OAI_SHORT_BACKGROUND_RETURN_UNTIL__ = until;
      sessionStorage.setItem(SHORT_SUPPRESS_KEY, String(until));
    }catch(_e){}
  }

  function isAppScreenActive(){
    try{ return document.documentElement.classList.contains('app-active'); }catch(_e){ return false; }
  }
  function isCoverScreenVisible(){
    try{
      var cover = document.getElementById('cover');
      return !!(cover && !document.documentElement.classList.contains('app-active') && cover.style.display !== 'none');
    }catch(_e){ return false; }
  }
  function isReturnableScreenActive(){ return isAppScreenActive() || isCoverScreenVisible(); }
  function isExternalReturnContext(){
    try{
      var pending = sessionStorage.getItem('oai_external_nav_pending') === '1';
      var pageHidden = sessionStorage.getItem('oai_external_nav_pagehide') === '1';
      var expected = sessionStorage.getItem('oai_external_return_expected') === '1';
      if(!pending && !pageHidden && !expected) return false;

      var started = parseInt(sessionStorage.getItem('oai_external_nav_started_at') || '0', 10) || 0;
      var forceAt = parseInt(sessionStorage.getItem('oai_external_nav_force_release_at') || '0', 10) || 0;
      var n = now();
      var recent = !!(started && n >= started && (n - started) < 10 * 60 * 1000);
      var leaveStillOpening = !!(pending && !pageHidden && forceAt && n < forceAt);
      if(recent && (pageHidden || expected || leaveStillOpening)) return true;

      /* V8-1-14-679:
         유효한 시작 시각 없이 external flag만 남아 있으면 일반 background 복귀를 가로막고
         oai-external-return-freeze 십자가가 끝없이 남을 수 있다. 오래된 flag는 여기서 즉시 폐기한다. */
      try{ oaiClearExternalNavigationState(); }catch(_e){}
      try{ oaiHideExternalEntryGuard('stale-background-external-state'); }catch(_e){}
      return false;
    }catch(_e){ return false; }
  }

  function clearStaleNormalBackgroundGuards(reason){
    try{
      if(isExternalReturnContext()) return false;
      clearInterval(window.__oaiExternalReturnStableTimer);
      clearTimeout(window.__oaiExternalReturnHardTimer);
      clearTimeout(window.__oaiExternalLaunchWatchdogTimer);
      window.__oaiExternalReturnStableTimer = 0;
      window.__oaiExternalReturnHardTimer = 0;
      window.__oaiExternalReturnStabilizing = false;
      window.__oaiExternalReturnStartedAt = 0;
      try{ oaiHideExternalEntryGuard('normal-background-return'); }catch(_e){}
      try{ oaiHideUnifiedRefreshGuard(0); }catch(_e){}
      try{ oaiClearExternalNavigationState(); }catch(_e){}

      var root = document.documentElement;
      if(root && root.classList){
        root.classList.remove(
          'oai-stability-veil','oai-stability-veil-releasing',
          'oai-external-return-freeze','oai-external-return-releasing','oai-external-leaving'
        );
        root.removeAttribute('data-oai-stability-reason');
        root.removeAttribute('data-oai-external-return-early');
        root.removeAttribute('data-oai-refresh-guard-active');
      }
      return true;
    }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
  }

  function ensureLongReturnVeil(){
    try{
      var id = 'oai-background-return-veil';
      if(!document.getElementById('oai-background-return-veil-style')){
        var st = document.createElement('style');
        st.id = 'oai-background-return-veil-style';
        st.textContent = '#oai-background-return-veil{position:fixed;inset:0;z-index:2147482498;background:#fbf8f1;opacity:0;transition:opacity .08s ease;pointer-events:none;display:block;visibility:visible;contain:strict;}#oai-background-return-veil.oai-show{opacity:1;}';
        (document.head || document.documentElement).appendChild(st);
      }
      var veil = document.getElementById(id);
      if(!veil){
        veil = document.createElement('div');
        veil.id = id;
        veil.setAttribute('aria-hidden','true');
        (document.body || document.documentElement).appendChild(veil);
      }
      veil.classList.add('oai-show');
      return veil;
    }catch(e){ console.warn('[가톨릭길동무]', e); return null; }
  }

  function removeLongReturnVeil(delay, preserveRuntimeFreeze){
    clearTimeout(_veilTimer);
    _veilTimer = setTimeout(function(){
      try{
        var veil = document.getElementById('oai-background-return-veil');
        if(veil){
          veil.classList.remove('oai-show');
          setTimeout(function(){ try{ if(veil && veil.parentNode) veil.parentNode.removeChild(veil); }catch(_e){} }, 90);
        }
        var old = document.getElementById('oai-background-return-photo-veil');
        if(old && old.parentNode) old.parentNode.removeChild(old);
      }catch(_e){}
      clearLegacyBackgroundReturnState(!!preserveRuntimeFreeze);
    }, Number.isFinite(Number(delay)) ? Number(delay) : 80);
  }

  function cancelBackgroundReturn(){
    clearTimeout(_returnTimer);
    clearBgStamp();
    removeLongReturnVeil(0);
  }

  function markBackgrounded(reason){
    try{
      clearTimeout(_returnTimer);
      if(document.visibilityState !== 'hidden') return;
      if(!isReturnableScreenActive() || isExternalReturnContext()){
        cancelBackgroundReturn();
        return;
      }
      try{ if(window.oaiClearResumeStartupState) window.oaiClearResumeStartupState('background-hidden'); }catch(_e){}
      /* V8-1-14-621: 한티가는길 내부 네비게이션 제거로 background 경로 저장을 중단한다. */
      _bgMapStableView = captureBackgroundMainMapView();
      var t = now();
      var token = String(t) + '-' + Math.random().toString(36).slice(2, 8);
      _bgStarted = t;
      _bgToken = token;
      _bgArmed = true;
      sessionStorage.setItem(BG_KEY, String(t));
      sessionStorage.setItem(BG_TOKEN_KEY, token);
      localStorage.setItem(BG_KEY, String(t));
      localStorage.setItem(BG_TOKEN_KEY, token);
      /* V8-1-14-621: 앱이 백그라운드 중 WebView/PWA가 재로딩되어 index.html early boot만 먼저 실행되는 경우에도
         30분 안/이상 복귀 판단이 흔들리지 않도록 session/local background key를 같은 값으로 맞춘다. */
      sessionStorage.setItem('oai_home_backgrounded_at', String(t));
      sessionStorage.setItem('oai_home_background_token_v345', token);
      localStorage.setItem('oai_home_backgrounded_at', String(t));
      localStorage.setItem('oai_home_background_token_v345', token);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  var _longIntroTimer = 0;
  var _longIntroReleaseTimer = 0;
  var _longIntroWatchdogTimer = 0;

  function hasBackgroundReturnIntroState(){
    try{
      var root = document.documentElement;
      var until = parseInt(sessionStorage.getItem('oai_background_intro_return_until') || localStorage.getItem('oai_background_intro_return_until') || '0', 10) || 0;
      return !!(
        (root && root.classList && root.classList.contains('oai-background-return-intro')) ||
        (root && root.getAttribute && root.getAttribute('data-oai-background-return-reason')) ||
        until
      );
    }catch(_e){ return false; }
  }

  function clearBackgroundReturnIntroStuck(reason, preserveRuntimeFreeze){
    try{
      preserveRuntimeFreeze = !!preserveRuntimeFreeze;
      var root = document.documentElement;
      var bgIntroState = hasBackgroundReturnIntroState();
      clearTimeout(_longIntroTimer);
      clearTimeout(_longIntroReleaseTimer);
      clearTimeout(_longIntroWatchdogTimer);

      /* V8-1-14-621:
         이 정리 함수는 30분 이상 백그라운드 복귀 인트로 전용이다.
         정상 첫 실행 인트로가 진행 중일 때 실수로 호출되어도
         oai-cover-booting / oai-cover-revealing은 건드리지 않는다. */
      if(bgIntroState){
        root.classList.remove('oai-cover-booting','oai-cover-revealing','oai-cover-under-intro-reveal');
      }
      var cls = [
        'oai-background-return-intro',
        'oai-stability-veil',
        'oai-stability-veil-releasing',
        'oai-resume-freeze',
        'oai-resume-return-veil',
        'oai-background-return-stabilizing',
        'oai-background-return-stabilizing-release'
      ];
      if(preserveRuntimeFreeze) cls = cls.filter(function(c){ return c !== 'oai-resume-freeze'; });
      root.classList.remove.apply(root.classList, cls);
      root.removeAttribute('data-oai-background-return-reason');
      root.removeAttribute('data-oai-stability-reason');
      if(!preserveRuntimeFreeze) root.removeAttribute('data-oai-resume-reason');
      try{
        sessionStorage.removeItem('oai_background_intro_return_until');
        localStorage.removeItem('oai_background_intro_return_until');
      }catch(_e){}
      removeLongReturnVeil(0, preserveRuntimeFreeze);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function releaseExpiredBackgroundIntro(reason){
    try{
      if(document.visibilityState === 'hidden') return;
      var until = parseInt(sessionStorage.getItem('oai_background_intro_return_until') || localStorage.getItem('oai_background_intro_return_until') || '0', 10) || 0;
      var root = document.documentElement;
      var bgIntroActive = root.classList.contains('oai-background-return-intro');
      /* V8-1-14-621:
         이 함수는 "30분 이상 백그라운드 복귀 인트로 stuck 방지" 전용이다.
         이전에는 일반 첫 실행 인트로의 oai-cover-booting까지 active로 보아
         boot-safety(900ms)가 정상 인트로를 중간에 지워 십자가가 잠깐 스치는 현상이 생겼다.
         일반 첫 실행 인트로는 index.html의 releaseBooting()이 2.1초 기준으로만 종료한다. */
      if(bgIntroActive && (!until || now() > until + 1200)){
        clearBackgroundReturnIntroStuck(reason || 'expired-background-intro');
      }
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function playLongReturnIntro(reason){
    try{
      var root = document.documentElement;
      var until = now() + 4300;
      try{
        sessionStorage.setItem('oai_background_intro_return_until', String(until));
        localStorage.setItem('oai_background_intro_return_until', String(until));
      }catch(_e){}
      try{
        root.classList.remove(
          'oai-refresh-no-intro',
          'oai-cover-revealing',
          'oai-cover-booting',
          'oai-stability-veil',
          'oai-stability-veil-releasing',
          'oai-resume-freeze',
          'oai-resume-return-veil',
          'oai-background-return-stabilizing',
          'oai-background-return-stabilizing-release'
        );
        root.removeAttribute('data-oai-stability-reason');
        root.removeAttribute('data-oai-resume-reason');
        root.removeAttribute('data-oai-background-return-reason');
        /* 같은 세션에서 다시 들어와도 ::after 애니메이션이 반드시 재시작되게 한다. */
        void root.offsetWidth;
        root.classList.add('oai-background-return-intro', 'oai-cover-booting');
        root.setAttribute('data-oai-background-return-reason', String(reason || 'long-background'));
        window.__OAI_EARLY_COVER_PHOTO_BOOT__ = true;
      }catch(_e){}
      clearTimeout(_longIntroTimer);
      clearTimeout(_longIntroReleaseTimer);
      clearTimeout(_longIntroWatchdogTimer);
      _longIntroWatchdogTimer = setTimeout(function(){
        releaseExpiredBackgroundIntro('background-intro-watchdog');
      }, 6200);
      _longIntroTimer = setTimeout(function(){
        try{
          root.classList.add('oai-cover-revealing');
          root.classList.remove('oai-cover-booting');
        }catch(_e){}
        _longIntroReleaseTimer = setTimeout(function(){
          try{
            clearTimeout(_longIntroWatchdogTimer);
            root.classList.remove('oai-cover-revealing','oai-background-return-intro');
            root.removeAttribute('data-oai-background-return-reason');
            sessionStorage.removeItem('oai_background_intro_return_until');
            localStorage.removeItem('oai_background_intro_return_until');
          }catch(_e){}
        }, 430);
      }, 2100);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }


  function applyCoverForLongReturn(reason){
    try{
      if(!isReturnableScreenActive()) { cancelBackgroundReturn(); return; }
      clearStaleNormalBackgroundGuards(reason || 'long-background-return');
      /* V8-1-14-679: 30분 이상 복귀는 논리적 새 시작이므로 이전 검색어·검색결과를 먼저 비운다.
         짧은 background 복귀에서는 이 함수를 호출하지 않아 검색 상태가 그대로 유지된다. */
      try{ if(typeof window.oaiResetSearchStateForFreshStart === 'function') window.oaiResetSearchStateForFreshStart('long-background-return'); }catch(_e){}
      /* V8-1-14-621: 한티가는길 내부 네비게이션 제거로 경로 복귀 상태 정리 훅을 사용하지 않는다. */
      ensureLongReturnVeil();
      clearBgStamp();
      if(typeof goToCover === 'function') goToCover();
      playLongReturnIntro(reason || 'long-return');
      removeLongReturnVeil(90);
    }catch(e){ console.warn('[가톨릭길동무]', e); cancelBackgroundReturn(); }
  }

  function keepOriginalForShortReturn(reason){
    try{
      clearStaleNormalBackgroundGuards(reason || 'short-background-return');
      /* V8-1-14-621:
         30분 안 복귀는 화면·카테고리를 다시 만들지 않는다.
         보이는 안정막은 사용하지 않고, 전환/애니메이션만 아주 짧게 멈춘 뒤
         지도 relayout 1회만 조용히 보정한다. */
      armShortSuppress();
      armResumeFreeze(420, reason || 'short-background-return');
      clearBgStamp();
      removeLongReturnVeil(0, true);
      clearBackgroundReturnIntroStuck(reason || 'short-return-no-op', true);
      scheduleShortReturnMapStabilize(reason || 'short-background-return');
      try{ window.dispatchEvent(new CustomEvent('oai-short-background-return',{detail:{reason:reason||'short-background-return'}})); }catch(_e){}
      /* 네이티브 앱은 resume 이벤트에서 위치를 다시 확인한다. 브라우저/PWA 복귀도
         성당 GPS 자동 방문 기록이 같은 기준으로 동작하도록 한 번만 위치를 갱신한다. */
      if(!isNativeAndroid()) setTimeout(function(){ try{ if(typeof window.oaiRefreshCurrentLocation==='function') window.oaiRefreshCurrentLocation({reason:'short-background-return',preserveMapCenter:true}); }catch(_e){} },420);
      try{
        /* V8-1-14-621: 한티가는길 내부 네비게이션 제거로 GPX follow 안정화 훅을 실행하지 않는다. */
      }catch(_e){}
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  function decideReturn(reason, nativeElapsed, nativeForceCover, seq){
    try{
      if(document.visibilityState === 'hidden') return;
      if(seq && seq !== _decisionSeq) return;
      var elapsed = Number.isFinite(Number(nativeElapsed)) ? Math.max(0, Number(nativeElapsed)) : -1;
      if(elapsed < 0){
        var bg = readRuntimeBackground();
        if(!bg){
          clearStaleNormalBackgroundGuards(reason || 'background-return-without-runtime-stamp');
          removeLongReturnVeil(0);
          clearBgStamp();
          return;
        }
        elapsed = bg.elapsed;
      }
      if(elapsed >= COVER_BG_RETURN_MS || (nativeForceCover && elapsed < 0)){
        applyCoverForLongReturn(reason || 'long-return');
        try{ window.dispatchEvent(new CustomEvent('oai-long-background-return',{detail:{elapsed:elapsed,reason:reason||'long-return'}})); }catch(_e){}
      }else{
        keepOriginalForShortReturn(reason || 'short-return');
      }
    }catch(e){ console.warn('[가톨릭길동무]', e); cancelBackgroundReturn(); }
  }

  function scheduleReturn(reason){
    try{
      if(document.visibilityState === 'hidden') return;
      if(!hasRuntimeBackgroundStamp()){
        clearStaleNormalBackgroundGuards(reason || 'visible-without-background-stamp');
        return;
      }
      clearTimeout(_returnTimer);
      var seq = ++_decisionSeq;
      _returnTimer = setTimeout(function(){ decideReturn(reason || 'return', -1, false, seq); }, 40);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  clearLegacyBackgroundReturnState();

  window.addEventListener('oai-android-native-resume', function(ev){
    try{
      var detail = ev && ev.detail || {};
      var elapsed = Number(detail.elapsed);
      var forceCover = !!(detail.longReturn || detail.forceCover);
      var cycleId = String(detail.cycleId || ('legacy-'+elapsed+'-'+(forceCover?'long':'short')));
      if(_handledNativeCycles[cycleId]){
        try{ if(window.GildongmuNative && typeof window.GildongmuNative.acknowledgeResumeCycle==='function') window.GildongmuNative.acknowledgeResumeCycle(cycleId); }catch(_e){}
        return;
      }
      _handledNativeCycles[cycleId]=1;
      window.__OAI_NATIVE_LIFECYCLE_ACTIVE__=true;
      clearTimeout(_returnTimer);
      var seq = ++_decisionSeq;
      setTimeout(function(){
        try{
          decideReturn('android-native-resume', elapsed, forceCover, seq);
          var locDelay = forceCover ? 2600 : 420;
          setTimeout(function(){
            try{ if(typeof window.oaiRefreshCurrentLocation==='function') window.oaiRefreshCurrentLocation({reason:'android-resume',cycleId:cycleId,preserveMapCenter:true}); }catch(_e){}
          }, locDelay);
        }finally{
          try{ if(window.GildongmuNative && typeof window.GildongmuNative.acknowledgeResumeCycle==='function') window.GildongmuNative.acknowledgeResumeCycle(cycleId); }catch(_e){}
        }
      }, forceCover ? 0 : 40);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }, {passive:true});

  document.addEventListener('visibilitychange', function(){
    if(isNativeAndroid()){
      if(document.visibilityState === 'visible') releaseExpiredBackgroundIntro('visibility-visible-native');
      return;
    }
    if(document.visibilityState === 'hidden') markBackgrounded('visibility-hidden');
    else { releaseExpiredBackgroundIntro('visibility-visible'); scheduleReturn('visibility-visible'); }
  }, {passive:true});

  window.addEventListener('pagehide', function(){
    if(isNativeAndroid()) return;
    if(document.visibilityState === 'hidden' && !_bgArmed) markBackgrounded('pagehide-hidden');
  }, {passive:true});
  window.addEventListener('pageshow', function(){
    releaseExpiredBackgroundIntro('pageshow');
    if(!isNativeAndroid()) scheduleReturn('pageshow');
    else { try{ if(window.GildongmuNative && typeof window.GildongmuNative.requestPendingResumeCycle==='function') window.GildongmuNative.requestPendingResumeCycle(); }catch(_e){} }
  }, {passive:true});
  window.addEventListener('focus', function(){ releaseExpiredBackgroundIntro('focus'); if(!isNativeAndroid()) scheduleReturn('focus'); }, {passive:true});
  setTimeout(function(){ releaseExpiredBackgroundIntro('boot-safety'); }, 900);
  setTimeout(function(){ releaseExpiredBackgroundIntro('boot-safety-late'); }, 6500);
})();

/* V8-1-14-621:
   Fold 화면 전환 / 백그라운드 복귀 / Back 탈출을 카테고리 자동복원으로 묶던
   visible_screen_state 계열을 제거한다.
   - 화면 저장/복원으로 카테고리를 다시 여는 동작 금지
   - Fold 접기/펼치기는 intro/cover/restore 이벤트가 아니라 viewport 변화로만 처리
   - Fold 전환은 full relayout을 사용하고, 백그라운드 복귀는 가벼운 지도 relayout만 사용한다
   - 커버 종료 Back 구조는 V297/back-controller.js 기준으로 보존 */
(function(){
  'use strict';
  if(window.__OAI_VISIBLE_SCREEN_RESTORE_V315_CLEANUP__) return;
  window.__OAI_VISIBLE_SCREEN_RESTORE_V315_CLEANUP__ = true;

  var OLD_KEYS = [
    'oai_visible_screen_state_v296','oai_visible_screen_state_v293',
    'oai_fold_transition_no_intro_until_v296','oai_fold_transition_no_intro_until_v293',
    'oai_fold_transition_width_v296','oai_fold_transition_width_v293',
    'oai_resume_current_state_v292','oai_resume_last_noncover_state_v292',
    'oai_resume_current_state_v291','oai_resume_last_noncover_state_v291',
    'oai_resume_screen_state_v272','oai_fold_transition_basic_state',
    'oai_fold_transition_no_intro_until','oai_fold_transition_no_intro_until_v291','oai_fold_transition_no_intro_until_v292'
  ];
  var KEY_EXIT_UNTIL = 'oai_real_app_exit_until_v296';
  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function isNativeAndroid(){
    try{ return /GildongmuAndroid\/\d+/i.test(navigator.userAgent||'') || !!window.GildongmuNative; }catch(_e){ return false; }
  }
  var _handledNativeCycles = Object.create(null);
  function setSS(k,v){ try{ sessionStorage.setItem(k, v); }catch(_e){} }
  function delSS(k){ try{ sessionStorage.removeItem(k); }catch(_e){} }
  function setLS(k,v){ try{ localStorage.setItem(k, v); }catch(_e){} }
  function delLS(k){ try{ localStorage.removeItem(k); }catch(_e){} }
  function setBoth(k,v){ setSS(k,v); setLS(k,v); }
  function delBoth(k){ delSS(k); delLS(k); }
  function clearLegacyResumeKeys(){ for(var i=0;i<OLD_KEYS.length;i++) delBoth(OLD_KEYS[i]); }
  function markRealExit(reason){
    try{ setBoth(KEY_EXIT_UNTIL, String(now()+5*60*1000)); }catch(_e){}
    clearLegacyResumeKeys();
  }
  function clearResumeOnly(reason){ clearLegacyResumeKeys(); }
  try{
    window.oaiClearResumeStartupState = clearResumeOnly;
    window.oaiMarkRealAppExitForResume = markRealExit;
    window.oaiClearVisibleRestoreStateForExit = markRealExit;
  }catch(_e){}
  clearLegacyResumeKeys();
  /* V8-1-14-621:
     화면 크기/화면 복원 관련 런타임 resize·Fold·visualViewport listener는 제거한다.
     화면 등급은 index.html의 boot/refresh 측정값만 사용하고, background 복귀에서는 화면을 다시 만들지 않는다. */
})();
function oaiNormalizeExternalSiteUrl(url){
  try{
    if(typeof normalizeCatholicExternalUrl === 'function') return normalizeCatholicExternalUrl(url);
  }catch(_e){}
  return String(url || '').trim();
}

function oaiBuildAndroidExternalIntent(url){
  return '';
}
function oaiTryOpenExternalBlank(url){
  return false;
}
function oaiNavigateExternalNow(url){
  url = String(url || '').trim();
  if(!url) return;
  try{ location.assign(url); }
  catch(e){ try{ location.href = url; }catch(_e){ console.warn('[가톨릭길동무]', _e); } }
}

function oaiOpenExternalSite(url, options){
  options = options || {};
  if(typeof options === 'string') options = {kind:options};
  if(!url) return false;
  try{
    url = (typeof oaiNormalizeExternalSiteUrl === 'function') ? oaiNormalizeExternalSiteUrl(url) : String(url || '').trim();
  }catch(_e){ url = String(url || '').trim(); }
  if(!url) return false;
  var externalKind = options.kind || options.source || 'external';
  var explicitHttp = /^http:\/\//i.test(String(url || ''));
  try{ document.activeElement && document.activeElement.blur && document.activeElement.blur(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ markExternalReturnStabilize(externalKind); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ oaiShowExternalEntryGuard(externalKind); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ oaiStartExternalLaunchWatchdog(externalKind); }catch(e){ console.warn("[가톨릭길동무]", e); }
  setTimeout(function(){ oaiNavigateExternalNow(url); }, OAI_EXTERNAL_ENTRY_NAV_DELAY_MS);
  return true;
}
function oaiSmoothNavigate(url, kind){
  return oaiOpenExternalSite(url, {kind: kind || 'external'});
}
try{ window.oaiOpenExternalSite = oaiOpenExternalSite; window.oaiSmoothNavigate = oaiSmoothNavigate; window.oaiNavigateExternalNow = oaiNavigateExternalNow; }catch(e){ console.warn("[가톨릭길동무]", e); }

function oaiMeasureExternalViewport(){
  try{
    var vv = window.visualViewport || null;
    return [
      Math.round(window.innerWidth || 0),
      Math.round(window.innerHeight || 0),
      Math.round(vv && vv.height ? vv.height : 0),
      Math.round(vv && vv.offsetTop ? vv.offsetTop : 0),
      Math.round(window.scrollY || document.documentElement.scrollTop || 0)
    ].join('|');
  }catch(_e){ return '0'; }
}
function oaiReleasePassiveVeil(){
  try{
    if(oaiConsumeInternalReturnNoEffect('passive-internal-return')) return;
    var reason = document.documentElement.getAttribute('data-oai-stability-reason') || '';
    if(/external-leave|external-return/i.test(reason)) return;
    oaiReleaseStabilityVeil();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiGetExternalNavInfo(){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    var ts = parseInt(sessionStorage.getItem('oai_external_nav_started_at') || '0', 10) || 0;
    var pending = sessionStorage.getItem('oai_external_nav_pending') === '1';
    var pageHidden = sessionStorage.getItem('oai_external_nav_pagehide') === '1';
    var forceAt = parseInt(sessionStorage.getItem('oai_external_nav_force_release_at') || '0', 10) || 0;
    return {now:now, ts:ts, pending:pending, pageHidden:pageHidden, forceAt:forceAt};
  }catch(_e){ return {now:0, ts:0, pending:false, pageHidden:false, forceAt:0}; }
}
function oaiHasExternalReturnPending(){
  try{
    var info = oaiGetExternalNavInfo();
    return !!(info.ts && info.pageHidden && info.now && info.now - info.ts < 10 * 60 * 1000);
  }catch(_e){ return false; }
}
function oaiExternalReturnKind(){
  try{ return String(sessionStorage.getItem('oai_external_nav_kind') || ''); }catch(_e){ return ''; }
}
function oaiIsMyFaithExternalReturn(){
  return oaiExternalReturnKind() === 'my-faith-life';
}
function oaiIsExternalLeaveStillOpening(){
  try{
    var info = oaiGetExternalNavInfo();
    return !!(info.pending && !info.pageHidden && info.forceAt && info.now && info.now < info.forceAt);
  }catch(_e){ return false; }
}
function oaiStartExternalReturnStabilize(){
  try{
    var root = document.documentElement;
    var startNow = Date.now ? Date.now() : new Date().getTime();
    if(window.__oaiExternalReturnStabilizing){
      var prevStarted = parseInt(window.__oaiExternalReturnStartedAt || '0', 10) || 0;
      var activeFor = prevStarted ? (startNow - prevStarted) : 0;
      if(activeFor >= 0 && activeFor < (OAI_EXTERNAL_RETURN_MAX_MS + 900) && window.__oaiExternalReturnStableTimer){
        return true;
      }
      clearInterval(window.__oaiExternalReturnStableTimer);
      clearTimeout(window.__oaiExternalReturnHardTimer);
      window.__oaiExternalReturnStableTimer = 0;
      window.__oaiExternalReturnHardTimer = 0;
      window.__oaiExternalReturnStabilizing = false;
    }
    window.__oaiExternalReturnStabilizing = true;
    window.__oaiExternalReturnStartedAt = startNow;
    root.classList.remove('oai-stability-veil','oai-stability-veil-releasing');
    root.removeAttribute('data-oai-stability-reason');
    root.classList.add('oai-external-return-freeze');
    root.setAttribute('data-oai-external-return-early','1');
    try{ oaiShowExternalEntryGuard('external-return'); }catch(_e){}
    // V8-1-14-621:
    // 외부사이트 복귀 보호창은 유지하되, stale timer가 남으면 무한 십자가가 되므로 hard timer를 한 곳에서 보장한다.

    var started = startNow;
    var minUntil = started + OAI_EXTERNAL_RETURN_MIN_MS;
    var maxUntil = started + OAI_EXTERNAL_RETURN_MAX_MS;
    var last = oaiMeasureExternalViewport();
    var stableCount = 0;
    clearInterval(window.__oaiExternalReturnStableTimer);
    clearTimeout(window.__oaiExternalReturnHardTimer);

    function finish(){
      try{
        clearInterval(window.__oaiExternalReturnStableTimer);
        clearTimeout(window.__oaiExternalReturnHardTimer);
        window.__oaiExternalReturnStableTimer = 0;
        window.__oaiExternalReturnHardTimer = 0;
        window.__oaiExternalReturnStabilizing = false;
        window.__oaiExternalReturnStartedAt = 0;
        try{ oaiHideExternalEntryGuard('external-return-finish'); }catch(_e){}
        oaiClearExternalNavigationState({keepVeil:true});
        oaiReleaseStabilityVeil();
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    }
    window.__oaiExternalReturnStableTimer = setInterval(function(){
      try{
        var now = Date.now ? Date.now() : new Date().getTime();
        var cur = oaiMeasureExternalViewport();
        if(cur === last) stableCount++;
        else { stableCount = 0; last = cur; }
        if(now >= minUntil && stableCount >= OAI_EXTERNAL_RETURN_STABLE_TICKS){ finish(); return; }
        if(now >= maxUntil){ finish(); return; }
      }catch(e){ console.warn('[가톨릭길동무]', e); finish(); }
    }, 120);
    window.__oaiExternalReturnHardTimer = setTimeout(function(){
      try{ if(window.__oaiExternalReturnStabilizing) finish(); }catch(_e){}
    }, OAI_EXTERNAL_RETURN_MAX_MS + 520);
    return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function applyExternalReturnStabilize(){
  try{
    if(oaiIsExternalReturnBackSuppressActive && oaiIsExternalReturnBackSuppressActive()){
      try{ oaiClearExternalNavigationState(); }catch(_e){}
      return;
    }
    if(oaiConsumeInternalReturnNoEffect('apply-internal-return')) return;
    if(oaiHasExternalReturnPending()){
      if(oaiIsMyFaithExternalReturn()){
        oaiClearExternalNavigationState();
        try{ if(typeof window.oaiResumeMyFaithAfterExternal === 'function') window.oaiResumeMyFaithAfterExternal(); }catch(_e){}
        return;
      }
      oaiStartExternalReturnStabilize();
      return;
    }
    if(oaiIsExternalLeaveStillOpening()) return;
    oaiClearExternalNavigationState();
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
window.addEventListener('pageshow', applyExternalReturnStabilize, true);
window.addEventListener('pageshow', function(){ setTimeout(oaiReleasePassiveVeil, 2600); }, true);
window.addEventListener('focus', function(){ setTimeout(applyExternalReturnStabilize, 40); setTimeout(oaiReleasePassiveVeil, 2600); }, true);
window.addEventListener('pagehide', function(){
  try{
    if(sessionStorage.getItem('oai_external_nav_pending') === '1'){
      sessionStorage.setItem('oai_external_nav_pagehide','1');
      /* V8-1-14-621:
         외부 브라우저로 나간 뒤 돌아올 때 첫 화면이 비치지 않도록 진입 보호창을 숨겨진 동안 그대로 유지한다.
         정상 복귀 시 return-freeze가 잡은 뒤 같은 DOM 보호창을 부드럽게 제거한다. */
      clearTimeout(window.__oaiExternalEntryGuardTimer);
    }
    clearTimeout(window.__oaiExternalLaunchWatchdogTimer);
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}, true);
document.addEventListener('visibilitychange', function(){
  try{
    if(document.visibilityState === 'hidden' && sessionStorage.getItem('oai_external_nav_pending') === '1'){
      sessionStorage.setItem('oai_external_nav_pagehide','1');
      clearTimeout(window.__oaiExternalLaunchWatchdogTimer);
      clearTimeout(window.__oaiExternalEntryGuardTimer);
    }
    if(document.visibilityState === 'visible') applyExternalReturnStabilize();
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}, true);

document.addEventListener('click', function(e){
  try{
    if(e.defaultPrevented) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a) return;
    if(a.hasAttribute('download')) return;
    var raw = a.getAttribute('href') || '';
    if(!raw || raw.charAt(0)==='#' || /^(tel:|mailto:|sms:|javascript:)/i.test(raw)) return;
    var u = new URL(raw, location.href);
    if(u.origin === location.origin) return;
    if(typeof a.onclick === 'function') return;
    e.preventDefault();
    e.stopPropagation();
    oaiSmoothNavigate(u.toString(), 'anchor-external');
  }catch(err){ console.warn('[가톨릭길동무]', err); }
}, true);

function oaiSetMainMapLayerHidden(hidden){
  try{
    document.documentElement.classList.toggle('oai-hide-main-map-layer', !!hidden);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
window.oaiSetMainMapLayerHidden = oaiSetMainMapLayerHidden;

const OAI_FAITH_PORTAL_ORDER = ['bible','hymn','prayer','missa'];
const OAI_FAITH_PORTAL_ITEMS = {
  bible:  { label:'성경', cls:'faith-bible',  url:'https://maria.catholic.or.kr/mobile/bible/read/bible_list.asp' },
  hymn:   { label:'가톨릭성가', cls:'faith-hymn',   url:'https://maria.catholic.or.kr/mobile/sungga/' },
  prayer: { label:'주요기도문', cls:'faith-prayer' },
  missa:  { label:'매일미사', cls:'faith-missa' }
};
function _getTodayMissaUrl(){
  const today=new Date();
  const yyyy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,'0');
  const dd=String(today.getDate()).padStart(2,'0');
  return 'https://missa.cbck.or.kr/DailyMissa/'+yyyy+mm+dd;
}
function _getFaithPortalInfo(kind){
  const info=OAI_FAITH_PORTAL_ITEMS[kind];
  if(!info) return null;
  if(kind==='missa') return Object.assign({}, info, {url:_getTodayMissaUrl()});
  return info;
}
var OAI_MISSA_ENTRY_GUARD_MIN_MS = 620;
var OAI_MISSA_ENTRY_GUARD_MAX_MS = 1050;
var OAI_MISSA_RETURN_GUARD_MS = 760;
var OAI_MISSA_GUARD_FADE_MS = 120;
function _getMissaPortalGuard(){
  try{
    var body=document.body;
    if(!body) return null;
    var guard=document.getElementById('oai-missa-portal-guard');
    if(!guard){
      guard=document.createElement('div');
      guard.id='oai-missa-portal-guard';
      guard.setAttribute('aria-hidden','true');
      body.appendChild(guard);
    }
    if(!guard.querySelector('.oai-missa-portal-cross')){
      guard.innerHTML='<div class="oai-missa-portal-cross" aria-hidden="true"></div>';
    }
    return guard;
  }catch(e){ console.warn('[가톨릭길동무]', e); return null; }
}
function _showMissaPortalGuard(phase){
  try{
    var root=document.documentElement;
    var guard=_getMissaPortalGuard();
    var token=String((Date.now ? Date.now() : new Date().getTime())) + '-' + Math.random().toString(36).slice(2);
    window.__oaiMissaPortalGuardToken = token;
    window.__oaiMissaPortalGuardPhase = (phase === 'return' ? 'return' : 'enter');
    window.__oaiMissaPortalGuardShownAt = Date.now ? Date.now() : new Date().getTime();
    clearTimeout(window.__oaiMissaPortalGuardTimer);
    clearTimeout(window.__oaiMissaPortalGuardFallbackTimer);
    clearTimeout(window.__oaiMissaPortalGuardFinalTimer);
    if(root) root.classList.add('oai-missa-portal-guarding');
    if(guard){
      guard.setAttribute('data-oai-phase', phase === 'return' ? 'return' : 'enter');
      guard.classList.remove('hide');
      guard.classList.add('show');
      guard.style.setProperty('display','flex','important');
      guard.style.setProperty('opacity','1','important');
      guard.style.setProperty('visibility','visible','important');
      void guard.offsetHeight;
    }
    window.__oaiMissaPortalGuardFallbackTimer = setTimeout(function(){
      try{ _hideMissaPortalGuard('missa-guard-fallback', 0, token); }catch(_e){}
    }, phase === 'return' ? (OAI_MISSA_RETURN_GUARD_MS + 900) : OAI_MISSA_ENTRY_GUARD_MAX_MS);
    return token;
  }catch(e){ console.warn('[가톨릭길동무]', e); return ''; }
}
function _hideMissaPortalGuard(reason, minMs, token){
  try{
    if(token && window.__oaiMissaPortalGuardToken && token !== window.__oaiMissaPortalGuardToken) return;
    var now=Date.now ? Date.now() : new Date().getTime();
    var shown=parseInt(window.__oaiMissaPortalGuardShownAt || '0', 10) || now;
    var wait=Math.max(0, (minMs || 0) - (now - shown));
    clearTimeout(window.__oaiMissaPortalGuardTimer);
    clearTimeout(window.__oaiMissaPortalGuardFinalTimer);
    window.__oaiMissaPortalGuardTimer = setTimeout(function(){
      try{
        if(token && window.__oaiMissaPortalGuardToken && token !== window.__oaiMissaPortalGuardToken) return;
        clearTimeout(window.__oaiMissaPortalGuardFallbackTimer);
        var guard=document.getElementById('oai-missa-portal-guard');
        if(guard){
          guard.classList.remove('show');
          guard.classList.add('hide');
          guard.style.setProperty('display','flex','important');
          guard.style.setProperty('opacity','0','important');
          guard.style.setProperty('visibility','visible','important');
        }
        window.__oaiMissaPortalGuardFinalTimer = setTimeout(function(){
          try{
            if(token && window.__oaiMissaPortalGuardToken && token !== window.__oaiMissaPortalGuardToken) return;
            window.__oaiMissaPortalGuardToken = '';
            window.__oaiMissaPortalGuardPhase = '';
            window.__oaiMissaPortalGuardShownAt = 0;
            document.documentElement.classList.remove('oai-missa-portal-guarding');
            var g=document.getElementById('oai-missa-portal-guard');
            if(g){
              g.classList.remove('show','hide');
              g.style.setProperty('display','none','important');
              g.style.setProperty('opacity','0','important');
              g.style.setProperty('visibility','hidden','important');
            }
          }catch(_e){}
        }, Math.max(0, OAI_MISSA_GUARD_FADE_MS || 0));
      }catch(_e){}
    }, wait);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _replaceFaithFrameWith(url, kind, options){
  try{
    var old=document.getElementById('missa-frame');
    if(!old) return null;
    var targetUrl=String(url || '');
    var isMissaTarget=(kind === 'missa') || /missa\.cbck\.or\.kr\/DailyMissa\//i.test(targetUrl);
    var guardToken=isMissaTarget ? ((options && options.guardToken) || window.__oaiMissaPortalGuardToken || _showMissaPortalGuard('enter')) : '';
    var fresh=old.cloneNode(false);
    var navArmed=false;
    try{ fresh.removeAttribute('src'); }catch(_e){}
    if(isMissaTarget){
      fresh.addEventListener('load', function(){
        if(!navArmed) return;
        _hideMissaPortalGuard('missa-enter-load', OAI_MISSA_ENTRY_GUARD_MIN_MS, guardToken);
      }, {once:true});
      fresh.addEventListener('error', function(){
        if(!navArmed) return;
        _hideMissaPortalGuard('missa-enter-error', OAI_MISSA_ENTRY_GUARD_MIN_MS, guardToken);
      }, {once:true});
    }
    if(old.parentNode) old.parentNode.replaceChild(fresh, old);
    if(targetUrl){
      setTimeout(function(){
        try{
          navArmed=true;
          if(fresh.contentWindow && fresh.contentWindow.location && typeof fresh.contentWindow.location.replace === 'function') fresh.contentWindow.location.replace(targetUrl);
          else fresh.src = targetUrl;
        }catch(e){ navArmed=true; fresh.src = targetUrl; }
      }, 0);
    }
    return fresh;
  }catch(e){ console.warn('[가톨릭길동무]', e); return null; }
}
function _clearFaithFrame(options){
  try{ if(!(options && options.keepMissaGuard)) _setFaithFrameLoading(false); }catch(_e){}
  try{ _replaceFaithFrameWith('about:blank'); }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _setFaithFrameLoading(on, kind, url){
  // V8-1-14-621: 매일미사 iframe 진입/복귀 보호창은 이 함수와 _replaceFaithFrameWith에서만 관리한다.
  try{
    var view=document.getElementById('missa-view');
    if(!view) return;
    view.classList.toggle('oai-faith-frame-loading', !!on && kind === 'missa');
    if(on && kind === 'missa'){
      try{ view.dataset.faithLoading='missa'; view.dataset.faithLoadingUrl=String(url || ''); }catch(_e){}
      if(!window.__oaiMissaPortalGuardToken) _showMissaPortalGuard('enter');
    }else{
      try{ delete view.dataset.faithLoading; delete view.dataset.faithLoadingUrl; }catch(_e){}
      _hideMissaPortalGuard('missa-loading-clear', 0);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _clearStaleFaithFrameLoading(reason){
  try{
    if(window.__oaiMissaPortalGuardToken && window.__oaiMissaPortalGuardPhase === 'return') return;
    if(window.__oaiMissaPortalGuardToken && !document.querySelector('#missa-view.open')) _hideMissaPortalGuard(reason || 'missa-stale-clear', 0);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{
  window.addEventListener('pageshow', function(){ _clearStaleFaithFrameLoading('pageshow'); }, {passive:true});
  window.addEventListener('focus', function(){ _clearStaleFaithFrameLoading('focus'); }, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'visible') _clearStaleFaithFrameLoading('visibility-visible'); }, {passive:true});
}catch(e){ console.warn('[가톨릭길동무]', e); }
function _renderFaithBottomNav(current){
  const ids=['missa-faith-nav','prayer-faith-nav'];
  ids.forEach(function(id){
    const nav=$(id);
    if(!nav) return;
    try{ nav.style.display=''; }catch(_e){}
    nav.dataset.current=current||'';
    nav.innerHTML='';
    OAI_FAITH_PORTAL_ORDER.filter(function(kind){ return kind!==current; }).forEach(function(kind){
      const info=_getFaithPortalInfo(kind);
      if(!info) return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='faith-bottom-btn '+info.cls;
      btn.dataset.faithTarget=kind;
      btn.innerHTML='<strong>'+info.label+'</strong>';
      btn.addEventListener('click', function(e){
        if(e){ e.preventDefault(); e.stopPropagation(); }
        _goFaithPortal(kind);
      });
      nav.appendChild(btn);
    });
  });
}
function _closePrayerSurfaceOnly(){
  try{
    const pv=$('prayer-view');
    const pd=$('prayer-detail');
    if(pd) pd.classList.remove('show');
    if(pv){
      pv.classList.remove('open');
      try{ delete pv.dataset.quickSource; }catch(_e){}
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _isFaithQuickBannerReturnActive(){
  try{
    return !!(typeof _shouldFaithReturnToMassQuick === 'function' && _shouldFaithReturnToMassQuick());
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function _preserveFaithQuickBannerReturn(){
  try{
    if(_isFaithQuickBannerReturnActive()){
      if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
      if(typeof _setMassQuickReturn === 'function') _setMassQuickReturn(true);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _goFaithPortal(kind){
  try{
    if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
    if(typeof _setMassQuickReturn === 'function') _setMassQuickReturn(true);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(kind==='prayer'){
    const mv=$('missa-view');
    if(mv) mv.classList.remove('open');
    if(typeof _clearFaithFrame === 'function') _clearFaithFrame();
    else { const frame=$('missa-frame'); if(frame) frame.src='about:blank'; }
    _preserveFaithQuickBannerReturn();
    if(typeof openPrayerBook==='function') openPrayerBook({fromMassQuick:true, instant:true});
    return;
  }
  openFaithPortal(kind);
}
function _openFaithExternalSite(info, kind){
  var externalKind = String(kind || 'faith') + '-external';
  var url = info && info.url ? info.url : '';
  if(!url) return false;
  if(typeof oaiOpenExternalSite === 'function'){
    return oaiOpenExternalSite(url, {kind: externalKind});
  }
  if(typeof oaiSmoothNavigate === 'function'){
    return oaiSmoothNavigate(url, externalKind);
  }
  // V8-1-14-621: 성가/성경 외부사이트도 비상 fallback까지 진입·복귀 보호창 기준을 유지한다.
  try{ if(typeof markExternalReturnStabilize === 'function') markExternalReturnStabilize(externalKind); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof oaiShowExternalEntryGuard === 'function') oaiShowExternalEntryGuard(externalKind); }catch(e){ console.warn('[가톨릭길동무]', e); }
  var delay = 0;
  try{ delay = (typeof OAI_EXTERNAL_ENTRY_NAV_DELAY_MS !== 'undefined') ? OAI_EXTERNAL_ENTRY_NAV_DELAY_MS : 180; }catch(_e){ delay = 180; }
  setTimeout(function(){ try{ location.assign(url); }catch(e){ try{ location.href = url; }catch(_e){} } }, delay);
  return true;
}
function openFaithPortal(kind, opts){
  const info=_getFaithPortalInfo(kind);
  if(!info || kind==='prayer') return _goFaithPortal('prayer');
  if(kind==='hymn' || kind==='bible'){
    /* V8-1-14-621: 성가·성경은 신앙 외부사이트 단일 진입 함수로 열고, 진입/복귀 보호창 기준을 유지한다. */
    try{
      if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
      if(typeof _setMassQuickReturn === 'function') _setMassQuickReturn(true);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ _closePrayerSurfaceOnly(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{
      var faithView=$('missa-view');
      if(faithView){ faithView.classList.remove('open'); try{ delete faithView.dataset.faithCurrent; delete faithView.dataset.quickSource; }catch(_e){} }
      if(typeof _clearFaithFrame === 'function') _clearFaithFrame();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    _openFaithExternalSite(info, kind);
    return;
  }
  try{
    if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
    if(typeof _setMassQuickReturn === 'function') _setMassQuickReturn(true);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof oaiClearMapInfoSelection === 'function') oaiClearMapInfoSelection('faith-portal-'+kind); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _resetCoverExitReady==='function') _resetCoverExitReady(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ if(typeof _clearCoverExitArmed==='function') _clearCoverExitArmed(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ localStorage.setItem('oai_last_'+kind+'_url', info.url); }catch(e){ console.warn("[가톨릭길동무]", e); }
  const view=$('missa-view');
  const frame=$('missa-frame');
  const title=$('missa-bar-title');
  const fromBanner=_isFaithQuickBannerReturnActive();
  if(fromBanner) _preserveFaithQuickBannerReturn();
  if(!view || !frame){
    oaiSmoothNavigate(info.url, kind);
    return;
  }
  _closePrayerSurfaceOnly();
  document.querySelectorAll('.module-view.open,#diocese-view.open').forEach(function(v){ v.classList.remove('open'); });
  const cv=$('cover');
  if(cv){ cv.style.opacity='0'; cv.style.display='none'; }
  document.documentElement.classList.add('app-active');
  if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(true);
  try{
    if(fromBanner && typeof _resetAppBackTrap==='function') _resetAppBackTrap('faith-quick-'+kind);
    else if(typeof _ensureAppBackTrap==='function') _ensureAppBackTrap('faith-portal-'+kind);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  view.dataset.faithCurrent=kind;
  try{ if(fromBanner) view.dataset.quickSource='massQuick'; else delete view.dataset.quickSource; }catch(_e){}
  var missaGuardToken = (kind === 'missa') ? (window.__oaiMissaPortalGuardToken || _showMissaPortalGuard('enter')) : '';
  if(title) title.textContent=info.label;
  _renderFaithBottomNav(kind);
  view.classList.add('open');
  try{ if(typeof oaiEnterView==='function') oaiEnterView(view); }catch(e){ console.warn('[가톨릭길동무]', e); }
  if((opts && opts.forceReload) || frame.getAttribute('src')!==info.url){
    _replaceFaithFrameWith(info.url, kind, {guardToken:missaGuardToken});
  }else{
    _setFaithFrameLoading(false);
  }
}
function openMissa(){ openFaithPortal('missa', {forceReload:true}); }

const OAI_SHRINE_VISITS_KEY = 'oai_shrine_visits_v1';
const OAI_SHRINE_AUTO_VISIT_PROMPT_KEY = 'oai_shrine_auto_visit_prompt_v1';
const OAI_SHRINE_AUTO_VISIT_RADIUS_M = 500;
let _shrineVisitMapFilter = 'all';
let _shrineVisitCardsTab = 'visited';
let _shrineVisitCardsDiocese = 'all';
let _shrineVisitCardsDateSort = 'recent';
let _shrineVisitCardsType = 'all';
function _visitHtmlEsc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function _todayISODate(){
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function _formatVisitDate(v){
  const s=String(v||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g,'.');
  return s;
}
function _getShrineVisitKey(item){
  if(!item) return '';
  if(item.visitId) return 'id:'+String(item.visitId);
  if(item.seq) return 'seq:'+String(item.seq);
  const lat = item.lat != null ? Number(item.lat).toFixed(6) : '';
  const lng = item.lng != null ? Number(item.lng).toFixed(6) : '';
  return 'name:'+String(item.name||'')+'|'+lat+'|'+lng;
}
function _getShrineVisitLegacyKeys(item){
  if(!item) return [];
  const keys=[];
  if(Array.isArray(item.visitLegacyKeys)) item.visitLegacyKeys.forEach(function(k){ if(k && !keys.includes(String(k))) keys.push(String(k)); });
  if(!item.seq){
    const lat=item.lat!=null?Number(item.lat).toFixed(6):'';
    const lng=item.lng!=null?Number(item.lng).toFixed(6):'';
    const coordKey='name:'+String(item.name||'')+'|'+lat+'|'+lng;
    if(coordKey && !keys.includes(coordKey)) keys.push(coordKey);
  }
  return keys;
}
function _mergeShrineVisitRecords(target,source,item){
  target=target&&typeof target==='object'?target:{name:item&&item.name||'',diocese:item&&item.diocese||'',seq:item&&item.seq||'',visits:[]};
  source=source&&typeof source==='object'?source:null;
  if(!Array.isArray(target.visits)) target.visits=[];
  if(source&&Array.isArray(source.visits)){
    source.visits.forEach(function(v){
      const obj=typeof v==='string'?{date:v,method:'manual'}:v;
      if(!obj||!obj.date) return;
      const exists=target.visits.some(function(cur){
        const c=typeof cur==='string'?{date:cur,method:'manual'}:cur;
        return String(c&&c.date||'')===String(obj.date||'') && String(c&&c.method||'manual')===String(obj.method||'manual') && String(c&&c.savedAt||'')===String(obj.savedAt||'');
      });
      if(!exists) target.visits.push(v);
    });
  }
  target.name=item&&item.name||target.name||'';
  target.diocese=item&&item.diocese||target.diocese||'';
  target.seq=item&&item.seq||target.seq||'';
  return target;
}
function _migrateShrineVisitRecord(item,data){
  const key=_getShrineVisitKey(item);
  if(!key||!data||typeof data!=='object') return {key:key,changed:false};
  let rec=data[key]&&typeof data[key]==='object'?data[key]:null;
  let changed=false;
  _getShrineVisitLegacyKeys(item).forEach(function(legacyKey){
    if(!legacyKey||legacyKey===key||!data[legacyKey]) return;
    rec=_mergeShrineVisitRecords(rec,data[legacyKey],item);
    delete data[legacyKey];
    changed=true;
  });
  if(rec){
    data[key]=_mergeShrineVisitRecords(rec,null,item);
    if(changed) _saveShrineVisits(data);
  }
  return {key:key,changed:changed};
}
function _loadShrineVisits(){
  try{
    const raw=localStorage.getItem(OAI_SHRINE_VISITS_KEY);
    const data=raw?JSON.parse(raw):{};
    return data && typeof data==='object' ? data : {};
  }catch(e){ console.warn('[가톨릭길동무]', e); return {}; }
}
function _saveShrineVisits(data){
  try{ localStorage.setItem(OAI_SHRINE_VISITS_KEY, JSON.stringify(data||{})); }
  catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _getShrineVisitRecord(item){
  const data=_loadShrineVisits();
  const migrated=_migrateShrineVisitRecord(item,data);
  const key=migrated.key;
  if(!key) return null;
  const rec=data[key];
  if(!rec || typeof rec!=='object') return {visits:[]};
  if(!Array.isArray(rec.visits)) rec.visits=[];
  return rec;
}
function _shrineVisitSavedAtMs(v){
  try{
    const s=String(v&&v.savedAt||'').trim();
    if(!s) return 0;
    const ms=Date.parse(s);
    return Number.isFinite(ms)?ms:0;
  }catch(_e){ return 0; }
}
function _isManualShrineVisit(v){
  return String(v&&v.method||'manual').toLowerCase()!=='gps';
}
/* 순례기록 정렬 기준
   1) 방문 날짜 최신순
   2) 같은 날짜의 GPS 기록은 savedAt(실제 등록 시각) 최신순
   3) 수동등록은 실제 방문 시각을 알 수 없으므로 해당 날짜의 GPS 기록 뒤, 즉 그 날짜의 마지막에 배치
   4) 수동등록끼리는 savedAt 최신순(legacy 문자열 기록은 시각 0으로 가장 뒤)
*/
function _compareShrineVisits(a,b){
  const byDate=String(b&&b.date||'').localeCompare(String(a&&a.date||''));
  if(byDate) return byDate;
  const aManual=_isManualShrineVisit(a), bManual=_isManualShrineVisit(b);
  if(aManual!==bManual) return aManual?1:-1;
  const bySavedAt=_shrineVisitSavedAtMs(b)-_shrineVisitSavedAtMs(a);
  if(bySavedAt) return bySavedAt;
  return 0;
}
function _getShrineVisitDates(item){
  const rec=_getShrineVisitRecord(item);
  const arr=(rec&&Array.isArray(rec.visits)?rec.visits:[]).map(function(v){ return typeof v==='string'?{date:v,method:'manual'}:v; }).filter(function(v){ return v&&v.date; });
  arr.sort(_compareShrineVisits);
  return arr;
}
function _getShrineVisitCount(item){ return _getShrineVisitDates(item).length; }
function _isVisitedShrine(item){ return _getShrineVisitCount(item)>0; }
function _hasShrineVisitOnDate(item,date){
  return _getShrineVisitDates(item).some(function(v){ return String(v.date||'')===String(date||''); });
}
function _addShrineVisit(item,date,method){
  const key=_getShrineVisitKey(item);
  if(!key) return false;
  date=String(date||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const data=_loadShrineVisits();
  _migrateShrineVisitRecord(item,data);
  const rec=data[key]&&typeof data[key]==='object'?data[key]:{name:item.name||'',diocese:item.diocese||'',seq:item.seq||'',visits:[]};
  if(!Array.isArray(rec.visits)) rec.visits=[];
  rec.name=item.name||rec.name||'';
  rec.diocese=item.diocese||rec.diocese||'';
  rec.seq=item.seq||rec.seq||'';
  if(rec.visits.some(function(v){ return String((typeof v==='string'?v:(v&&v.date))||'')===String(date); })) return false;
  rec.visits.push({date:date,method:method||'manual',savedAt:new Date().toISOString()});
  rec.visits.sort(function(a,b){
    const aa=typeof a==='string'?{date:a,method:'manual'}:a;
    const bb=typeof b==='string'?{date:b,method:'manual'}:b;
    return _compareShrineVisits(aa,bb);
  });
  data[key]=rec;
  _saveShrineVisits(data);
  try{ document.documentElement.classList.add('has-shrine-visits'); }catch(_e){}
  return true;
}
function _deleteShrineVisitAt(item,idx){
  const key=_getShrineVisitKey(item);
  if(!key) return false;
  const data=_loadShrineVisits();
  _migrateShrineVisitRecord(item,data);
  const rec=data[key];
  if(!rec||!Array.isArray(rec.visits)) return false;
  if(idx<0||idx>=rec.visits.length) return false;
  var target=rec.visits[idx];
  if(target && typeof target==='object' && String(target.method||'').toLowerCase()==='gps') return false;
  rec.visits.splice(idx,1);
  if(rec.visits.length) data[key]=rec;
  else delete data[key];
  _saveShrineVisits(data);
  return true;
}

function _shrineMarkerColor(item){
  return (_mode==='shrine' && item && _isVisitedShrine(item)) ? '#111111' : _typeColor(item && item.type);
}
function _isShrineVisibleByVisitFilter(item){
  if(_mode!=='shrine') return true;
  if(_shrineVisitMapFilter==='visited') return _isVisitedShrine(item);
  if(_shrineVisitMapFilter==='unvisited') return !_isVisitedShrine(item);
  return true;
}
function _ensureShrineVisitMapFilter(){
  let bar=document.getElementById('shrine-visit-map-filter');
  if(bar) return bar;
  const wrap=document.getElementById('map-wrap') || document.body;
  bar=document.createElement('div');
  bar.id='shrine-visit-map-filter';
  bar.className='shrine-visit-map-filter';
  bar.setAttribute('aria-label','순례한 성지 지도 필터');
  const buttons=[['all','전체'],['visited','순례한 성지'],['unvisited','미방문 성지']];
  bar.innerHTML=buttons.map(function(b){ return '<button type="button" data-shrine-visit-filter="'+b[0]+'">'+b[1]+'</button>'; }).join('');
  wrap.appendChild(bar);
  bar.querySelectorAll('[data-shrine-visit-filter]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      try{ closeInfoCard({keepMap:true}); }catch(_e){}
      _shrineVisitMapFilter = btn.getAttribute('data-shrine-visit-filter') || 'all';
      _applyShrineVisitMapFilter();
    });
  });
  return bar;
}
function _updateShrineVisitMapFilterUI(){
  const bar=_ensureShrineVisitMapFilter();
  if(!bar) return;
  const show=(_mode==='shrine' && _screen==='map');
  bar.classList.toggle('show', !!show);
  try{
    const wrap=document.getElementById('map-wrap');
    if(wrap) wrap.classList.toggle('oai-shrine-filter-open', !!show);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  bar.querySelectorAll('[data-shrine-visit-filter]').forEach(function(btn){
    const val=btn.getAttribute('data-shrine-visit-filter') || 'all';
    btn.classList.toggle('active', val===_shrineVisitMapFilter);
  });
}
function _fitShrineVisitMapFilterBounds(){
  if(_mode!=='shrine'||!_map||typeof _LB==='undefined'||typeof _LL==='undefined'||!Array.isArray(SHRINES)) return false;
  try{
    if(_shrineVisitMapFilter==='all') return false;
    const bounds=new _LB();
    let count=0, single=null;
    SHRINES.forEach(function(s){
      if(!s||!s.lat||!s.lng) return;
      const baseOk=(_filterDio==='all'||s.diocese===_filterDio)&&
        (!_listSrch||_itemSearchBlob(s).includes(_listSrch)||_itemSearchNorm(s).includes(String(_listSrch).replace(/\s+/g,'')));
      if(!baseOk) return;
      const useForBounds=_isVisitedShrine(s);
      if(!useForBounds) return;
      single=s;
      bounds.extend(new _LL(s.lat,s.lng));
      count++;
    });
    if(count>1){
      if(typeof _setBoundsByInfoCardStandard==='function') _setBoundsByInfoCardStandard(bounds, 164, 64, 118, 64);
      else _map.setBounds(bounds, 164, 64, 118, 64);
      return true;
    }
    if(count===1 && single){
      const pos=new _LL(single.lat,single.lng);
      if(typeof _map.setLevel==='function') _map.setLevel(7);
      if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(pos);
      else _map.setCenter(pos);
      return true;
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}
function _applyShrineVisitMapFilter(){
  _updateShrineVisitMapFilterUI();
  if(_mode==='shrine' && _map){
    try{ _restoreMapMarkers(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
}
function _refreshShrineVisitMapState(){
  try{ _applyShrineVisitMapFilter(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ _updateShrineVisitCardsButtonUI(); }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _getShrineVisitEntries(){
  const data=_loadShrineVisits();
  const entries=[];
  SHRINES.forEach(function(item,idx){
    const visits=_getShrineVisitDates(item);
    if(!visits.length) return;
    entries.push({item:item,idx:idx,visits:visits,count:visits.length,recent:visits[0].date,recentVisit:visits[0]});
  });
  entries.sort(function(a,b){
    const visitOrder=_compareShrineVisits(a.recentVisit,b.recentVisit);
    if(visitOrder) return visitOrder;
    return String(a.item.diocese||'').localeCompare(String(b.item.diocese||'')) || String(a.item.name||'').localeCompare(String(b.item.name||''));
  });
  return entries;
}

function _getShrineUnvisitedEntries(){
  const entries=[];
  SHRINES.forEach(function(item,idx){
    if(_isVisitedShrine(item)) return;
    entries.push({item:item,idx:idx,visits:[],count:0,recent:''});
  });
  entries.sort(function(a,b){
    return String(a.item.diocese||'').localeCompare(String(b.item.diocese||'')) || String(a.item.name||'').localeCompare(String(b.item.name||''));
  });
  return entries;
}

function _getShrineNewEntries(){
  const entries=[];
  SHRINES.forEach(function(item,idx){
    if(!item || !(item.isNew === true || item.addedGroup)) return;
    const visits=_getShrineVisitDates(item);
    entries.push({item:item,idx:idx,visits:visits,count:visits.length,recent:visits.length?visits[0].date:''});
  });
  entries.sort(function(a,b){
    return String(a.item.diocese||'').localeCompare(String(b.item.diocese||'')) || String(a.item.name||'').localeCompare(String(b.item.name||''));
  });
  return entries;
}

function _getShrineVisitDioceseEntries(){
  if(typeof _getDioFilterEntries==='function') return _getDioFilterEntries();
  return [['all','전체']].concat(_DIOS ? _DIOS.slice(1) : []);
}
const _SHRINE_VISIT_FULL_DIOCESE_LABELS={
  '서울대교구':'서울대교구','인천교구':'인천교구','수원교구':'수원교구','의정부교구':'의정부교구',
  '춘천교구':'춘천교구','원주교구':'원주교구','대전교구':'대전교구','청주교구':'청주교구',
  '대구대교구':'대구대교구','안동교구':'안동교구','부산교구':'부산교구','마산교구':'마산교구',
  '광주대교구':'광주대교구','전주교구':'전주교구','제주교구':'제주교구','군종교구':'군종교구'
};
function _getShrineVisitFullDioceseLabel(value,label){
  const v=String(value||'');
  if(v==='all') return '전체';
  if(_SHRINE_VISIT_FULL_DIOCESE_LABELS[v]) return _SHRINE_VISIT_FULL_DIOCESE_LABELS[v];
  const l=String(label||'');
  if(/(대교구|교구)$/.test(l)) return l;
  return v || l || '전체';
}
function _getShrineVisitStatsDioceseEntries(){
  return _getShrineVisitDioceseEntries().map(function(pair){
    return [pair[0], _getShrineVisitFullDioceseLabel(pair[0], pair[1])];
  });
}
function _resetShrineVisitStatsExpansion(){
  try{ window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__=''; }catch(_e){}
}
function _getShrineVisitDioceseLabel(value){
  const entries=_getShrineVisitDioceseEntries();
  const found=entries.find(function(x){ return x&&String(x[0])===String(value); });
  return found ? found[1] : '전체';
}
function _filterShrineVisitEntriesByDiocese(entries){
  if(!_shrineVisitCardsDiocese || _shrineVisitCardsDiocese==='all') return entries;
  return entries.filter(function(entry){ return String(entry.item&&entry.item.diocese||'')===String(_shrineVisitCardsDiocese); });
}
function _shrineVisitTypeFilterKey(item){
  const t=String(item&&item.type||'');
  if(t==='순례지') return 'pilgrim';
  if(t==='순교 사적지') return 'martyr';
  return 'shrine';
}
function _shrineVisitTypeFilterLabel(value){
  if(value==='shrine') return '성지';
  if(value==='martyr') return '순교사적지';
  if(value==='pilgrim') return '순례지';
  return '전체 유형';
}
function _filterShrineVisitEntriesByType(entries){
  if(!_shrineVisitCardsType || _shrineVisitCardsType==='all') return entries;
  return entries.filter(function(entry){ return _shrineVisitTypeFilterKey(entry&&entry.item)===_shrineVisitCardsType; });
}
function _compareShrineVisitsOldest(a,b){
  const byDate=String(a&&a.date||'').localeCompare(String(b&&b.date||''));
  if(byDate) return byDate;
  const aManual=_isManualShrineVisit(a), bManual=_isManualShrineVisit(b);
  if(aManual!==bManual) return aManual?1:-1;
  const bySavedAt=_shrineVisitSavedAtMs(a)-_shrineVisitSavedAtMs(b);
  if(bySavedAt) return bySavedAt;
  return 0;
}
function _sortShrineVisitEntriesByDate(entries){
  const out=(entries||[]).slice();
  const oldest=(_shrineVisitCardsDateSort==='oldest');
  out.sort(function(a,b){
    const visitOrder=oldest?_compareShrineVisitsOldest(a&&a.recentVisit,b&&b.recentVisit):_compareShrineVisits(a&&a.recentVisit,b&&b.recentVisit);
    if(visitOrder) return visitOrder;
    return String(a&&a.item&&a.item.diocese||'').localeCompare(String(b&&b.item&&b.item.diocese||''),'ko') || String(a&&a.item&&a.item.name||'').localeCompare(String(b&&b.item&&b.item.name||''),'ko');
  });
  return out;
}
function _renderShrineVisitFilterControls(active){
  const wrap=document.getElementById('shrine-visit-cards-filters');
  if(!wrap) return;
  const show=(active==='visited');
  wrap.classList.toggle('show', show);
  wrap.setAttribute('aria-hidden', show?'false':'true');
  if(!show){ wrap.innerHTML=''; return; }
  const dioEntry=_getShrineVisitDioceseEntries().filter(function(pair){return String(pair&&pair[0]||'all')===String(_shrineVisitCardsDiocese||'all');})[0];
  const dioLabel=_getShrineVisitFullDioceseLabel(_shrineVisitCardsDiocese||'all',dioEntry&&dioEntry[1]);
  wrap.innerHTML='<label class="shrine-visit-filter-field"><span>날짜별</span>'+_oaiVisitPickerButton('shrine-date',_shrineVisitCardsDateSort==='oldest'?'오래된순':'최근순','날짜별 정렬')+'</label>'
    +'<label class="shrine-visit-filter-field"><span>교구별</span>'+_oaiVisitPickerButton('shrine-dio',dioLabel,'교구별 선택')+'</label>'
    +'<label class="shrine-visit-filter-field"><span>유형별</span>'+_oaiVisitPickerButton('shrine-type',_shrineVisitTypeFilterLabel(_shrineVisitCardsType),'유형별 선택')+'</label>';
}
function _renderShrineVisitDioceseTabs(visitedCount,totalCount){
  const wrap=document.getElementById('shrine-visit-cards-diocese');
  if(!wrap) return;
  const rawEntries=_getShrineVisitDioceseEntries();
  const visitedEntries=_getShrineVisitEntries();
  function isMy(pair){
    const v=pair&&pair[0], l=pair&&pair[1];
    return !!(typeof _isMyDioceseName==='function' && (_isMyDioceseName(v)||_isMyDioceseName(l)));
  }
  function statOf(pair){
    const key=pair&&pair[0];
    if(key==='all') return {visited:visitedEntries.length,total:Array.isArray(SHRINES)?SHRINES.length:0,pct:0};
    const total=Array.isArray(SHRINES)?SHRINES.filter(function(item){ return String(item&&item.diocese||'')===String(key); }).length:0;
    const visited=visitedEntries.filter(function(entry){ return String(entry.item&&entry.item.diocese||'')===String(key); }).length;
    return {visited:visited,total:total,pct:total?Math.round((visited/total)*100):0};
  }
  const all=rawEntries.filter(function(pair){ return pair&&pair[0]==='all'; });
  const my=rawEntries.filter(function(pair){ return pair&&pair[0]!=='all'&&isMy(pair); });
  const rest=rawEntries.filter(function(pair){ return pair&&pair[0]!=='all'&&!isMy(pair); }).sort(function(a,b){
    const sa=statOf(a), sb=statOf(b);
    return (sb.pct-sa.pct) || (sb.visited-sa.visited) || (sb.total-sa.total) || String(a[1]||'').localeCompare(String(b[1]||''),'ko');
  });
  const entries=all.concat(my,rest);
  wrap.innerHTML=entries.map(function(pair){
    const v=pair[0], l=pair[1];
    const selected=String(v)===String(_shrineVisitCardsDiocese||'all');
    const myFlag=isMy(pair);
    const myCls=myFlag?' my-diocese-filter':'';
    const myBadge=myFlag?'<span class="filter-my-dio-badge">나의 교구</span>':'';
    return '<button type="button" class="filter-btn'+(selected?' active':'')+myCls+'" data-shrine-visit-diocese="'+_visitHtmlEsc(v)+'">'+_visitHtmlEsc(l)+myBadge+'</button>';
  }).join('');
}

function _shrineVisitTypeClass(item){
  const t=String(item&&item.type||'');
  if(t==='순례지') return 'type-pilgrim';
  if(t==='순교 사적지') return 'type-martyr';
  return 'type-shrine';
}
function _shrineVisitTypeLabel(item){
  const t=String(item&&item.type||'');
  return t||'성지';
}

/* 성지·성당 모두 OS 기본 select 대신 같은 선택창을 사용한다.
   기기/폴드 상태에 따라 검은 드롭다운으로 달라지는 문제를 없앤다. */
function _oaiVisitPickerButton(kind,label,aria,disabled){
  return '<button type="button" class="oai-visit-picker-button" data-oai-visit-picker="'+_visitHtmlEsc(kind)+'" aria-label="'+_visitHtmlEsc(aria||label)+'"'+(disabled?' disabled':'')+'><span>'+_visitHtmlEsc(label)+'</span><b aria-hidden="true">⌄</b></button>';
}
function _oaiVisitPickerOptions(kind){
  if(kind==='shrine-date')return [['recent','최근순'],['oldest','오래된순']];
  if(kind==='shrine-dio')return _getShrineVisitDioceseEntries().map(function(pair){return [pair&&pair[0]||'all',_getShrineVisitFullDioceseLabel(pair&&pair[0]||'all',pair&&pair[1])];});
  if(kind==='shrine-type')return [['all','전체 유형'],['shrine','성지'],['martyr','순교사적지'],['pilgrim','순례지']];
  if(kind==='parish-sort')return [['recent','최근순'],['oldest','오래된순']];
  if(kind==='parish-dio')return [['all','전체']].concat(_parishDios().map(function(d){return [d,d];}));
  return [];
}
function _oaiVisitPickerSelected(kind){
  if(kind==='shrine-date')return _shrineVisitCardsDateSort;
  if(kind==='shrine-dio')return _shrineVisitCardsDiocese||'all';
  if(kind==='shrine-type')return _shrineVisitCardsType||'all';
  if(kind==='parish-sort')return _parishVisitSort;
  if(kind==='parish-dio')return _parishVisitDio||'all';
  return '';
}
function _closeOaiVisitPicker(){const dialog=document.getElementById('oai-visit-picker-dialog');if(dialog){dialog.classList.remove('show');dialog.setAttribute('aria-hidden','true');}}
function _applyOaiVisitPicker(kind,value){
  if(kind==='shrine-date')_shrineVisitCardsDateSort=value==='oldest'?'oldest':'recent';
  else if(kind==='shrine-dio')_shrineVisitCardsDiocese=value||'all';
  else if(kind==='shrine-type')_shrineVisitCardsType=(value==='shrine'||value==='martyr'||value==='pilgrim')?value:'all';
  else if(kind==='parish-sort')_parishVisitSort=value==='oldest'?'oldest':'recent';
  else if(kind==='parish-dio'){_parishVisitDio=value||'all';_parishUnvisitedLimit=80;}
  _closeOaiVisitPicker();
  if(kind.indexOf('shrine-')===0){_renderShrineVisitCardsModal();setTimeout(_resetShrineVisitCardsTopStable,0);}
  else _renderParishVisitBook();
}
function _openOaiVisitPicker(kind){
  const options=_oaiVisitPickerOptions(kind),selected=String(_oaiVisitPickerSelected(kind));if(!options.length)return;
  let dialog=document.getElementById('oai-visit-picker-dialog');
  if(!dialog){
    dialog=document.createElement('div');dialog.id='oai-visit-picker-dialog';dialog.className='oai-visit-picker-dialog';dialog.setAttribute('aria-hidden','true');document.body.appendChild(dialog);
    dialog.addEventListener('click',function(e){const target=e.target&&e.target.closest&&e.target.closest('[data-oai-visit-picker-close],[data-oai-visit-picker-value]');if(!target)return;if(target.hasAttribute('data-oai-visit-picker-close')){_closeOaiVisitPicker();return;}const active=dialog.getAttribute('data-picker-kind')||'';_applyOaiVisitPicker(active,target.getAttribute('data-oai-visit-picker-value')||'');});
  }
  dialog.setAttribute('data-picker-kind',kind);
  dialog.innerHTML='<div class="oai-visit-picker-backdrop" data-oai-visit-picker-close="1"></div><section class="oai-visit-picker-panel" role="dialog" aria-modal="true" aria-label="선택"><div class="oai-visit-picker-list">'+options.map(function(option){const value=String(option[0]),isSelected=value===selected;return '<button type="button" data-oai-visit-picker-value="'+_visitHtmlEsc(value)+'"'+(isSelected?' class="selected"':'')+'><span>'+_visitHtmlEsc(option[1])+'</span><b aria-hidden="true">'+(isSelected?'◉':'○')+'</b></button>';}).join('')+'</div></section>';
  dialog.classList.add('show');dialog.setAttribute('aria-hidden','false');
}

function _ensureShrineVisitCardsButton(){
  let btn=document.getElementById('shrine-visit-cards-btn');
  if(btn) return btn;
  const wrap=document.getElementById('map-wrap') || document.body;
  btn=document.createElement('button');
  btn.id='shrine-visit-cards-btn';
  btn.className='shrine-visit-cards-btn';
  btn.type='button';
  btn.textContent='순례기록';
  wrap.appendChild(btn);
  btn.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    _openShrineVisitCardsModal();
  });
  return btn;
}

function _ensureShrineVisitSheetButtons(){
  const configs=[['nearby','nearby-close-btn'],['list','list-close-btn'],['region','region-close-btn']];
  configs.forEach(function(pair){
    const name=pair[0], closeId=pair[1];
    const close=document.getElementById(closeId);
    if(!close) return;
    const hd=close.closest&&close.closest('.sheet-hd');
    if(!hd) return;
    const id='shrine-visit-sheet-btn-'+name;
    let btn=document.getElementById(id);
    if(!btn){
      btn=document.createElement('button');
      btn.id=id;
      btn.type='button';
      btn.className='shrine-visit-sheet-btn';
      btn.textContent='나의순례';
      btn.setAttribute('aria-label','나의 순례기록 열기');
      close.parentNode.insertBefore(btn, close);
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        _openShrineVisitCardsModal();
      });
    }
  });
}
function _updateShrineVisitSheetButtonsUI(){
  _ensureShrineVisitSheetButtons();
  ['nearby','list','region'].forEach(function(name){
    const btn=document.getElementById('shrine-visit-sheet-btn-'+name);
    if(btn) btn.classList.remove('show');
  });
  _updateShrineVisitFloatingListButtonUI();
}


function _getShrineVisitActionLayerTarget(){
  try{
    /* V8-1-14-621: 나의 성지순례 현황 버튼은 리스트 안으로 이동하지 않는다.
       지도에서 보이던 하단 위치를 전체 성지 화면의 공통 기준으로 삼기 위해
       map-wrap 내부가 아니라 app/body 고정 레이어에 둔다. */
    const host=document.getElementById('app') || document.body;
    return {host:host,before:null,surface:'map'};
  }catch(e){ console.warn('[가톨릭길동무]', e); return {host:document.getElementById('app')||document.body,before:null,surface:'map'}; }
}
function _ensureShrineVisitFloatingActionLayer(){
  let layer=document.getElementById('shrine-visit-action-layer');
  if(!layer){
    layer=document.createElement('div');
    layer.id='shrine-visit-action-layer';
    layer.setAttribute('aria-hidden','true');
  }
  try{
    const target=_getShrineVisitActionLayerTarget();
    const host=target.host || document.getElementById('map-wrap') || document.body;
    const surfaceName=target.surface || 'map';
    layer.className='shrine-visit-action-layer surface-'+surfaceName;
    layer.dataset.surface=surfaceName;
    if(target.before && target.before.parentNode===host){
      if(layer.parentNode!==host || layer.nextSibling!==target.before) host.insertBefore(layer,target.before);
    }else if(host && layer.parentNode!==host){
      host.appendChild(layer);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return layer;
}
function _ensureShrineVisitFloatingListButton(){
  let btn=document.getElementById('shrine-visit-floating-list-btn');
  const layer=_ensureShrineVisitFloatingActionLayer();
  if(!btn){
    btn=document.createElement('button');
    btn.id='shrine-visit-floating-list-btn';
    btn.type='button';
    btn.className='shrine-visit-floating-list-btn';
    btn.textContent='나의 성지순례 현황';
    btn.setAttribute('aria-label','나의 성지순례 현황 열기');
  }
  if(layer && btn.parentNode!==layer){
    layer.appendChild(btn);
  }
  if(!btn.__oaiShrineVisitClickBound){
    btn.__oaiShrineVisitClickBound=true;
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      _openShrineVisitCardsModal();
    });
  }
  return btn;
}
function _isShrineVisitFloatingListSurfaceOpen(){
  try{
    return ['nearby','list','region'].some(function(name){
      const sheet=document.getElementById('sheet-'+name);
      return !!(sheet&&sheet.classList.contains('open'));
    });
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function _updateShrineNearbyLocationButtonUI(){
  try{
    const btn=document.getElementById('loc-btn');
    if(!btn) return;
    /* V8-1-14-621: 성지 내위치 버튼은 성당/피정의집과 같은 지도 조작 버튼이다.
       나의 성지순례 현황 표시 조건과 섞지 않고, 거리 계산 중에도 숨기지 않는다. */
    btn.classList.remove('oai-wait-nearby-list');
    btn.setAttribute('aria-hidden','false');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _scheduleShrineVisitFloatingListButtonReadyRefresh(){
  try{
    const refresh=function(){ try{ _updateShrineVisitFloatingListButtonUI(); }catch(_e){} };
    refresh();
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(refresh);
    [20,80,180,360].forEach(function(ms){ setTimeout(refresh, ms); });
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _updateShrineVisitFloatingListButtonUI(){
  if(window.__OAI_FOLD_VIEWPORT_SETTLING__ === true) return;
  try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
  const btn=_ensureShrineVisitFloatingListButton();
  if(!btn) return;
  const srch=document.getElementById('srch-modal');
  const searchOpen=!!(srch&&srch.classList.contains('open'));
  const info=document.getElementById('info-card');
  const infoOpen=!!(info&&info.classList.contains('open'));
  const route=document.getElementById('sheet-route');
  const routeOpen=(_activeTab==='route') || !!(route&&route.classList.contains('open'));
  const ae=document.activeElement;
  const inputFocused=!!(ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA') && (ae.id==='list-srch-inp'||ae.id==='sm-inp'||ae.id==='region-inp'));
  const keyboardOpen=inputFocused && (document.documentElement.classList.contains('kb-open') || document.documentElement.classList.contains('oai-map-search-keyboard-lock'));
  const visitOpen=(typeof _isAnyVisitModalOpen==='function'&&_isAnyVisitModalOpen()) || (typeof _isShrineVisitDetailOpen==='function'&&_isShrineVisitDetailOpen()) || (typeof _isShrineVisitCardsModalOpen==='function'&&_isShrineVisitCardsModalOpen());
  const nearbySheet=document.getElementById('sheet-nearby');
  const listSheet=document.getElementById('sheet-list');
  const regionSheet=document.getElementById('sheet-region');
  const nearbyOpen=(_activeTab==='nearby') || !!(nearbySheet&&nearbySheet.classList.contains('open'));
  const listOpen=(_activeTab==='list') || !!(listSheet&&listSheet.classList.contains('open'));
  const regionOpen=(_activeTab==='region') || !!(regionSheet&&regionSheet.classList.contains('open'));
  const sheetOpen=nearbyOpen || listOpen || regionOpen;
  const mapOpen=(_screen==='map' && !sheetOpen);
  const layer=_ensureShrineVisitFloatingActionLayer();
  if(layer && btn.parentNode!==layer) layer.appendChild(btn);
  /* V8-1-14-755: 성당 방문 버튼과 같은 타이밍으로,
     성지 내주변 거리 계산이 끝나기 전에도 바로 표시한다. */
  const nearbyReady=true;
  /* V8-1-14-621: 버튼 위치 기준은 지도 하단 하나로 유지하되,
     내주변/성지찾기/지역찾기 시트가 열려 있어도 같은 화면 위치에 보이게 한다.
     키보드 focus만으로 숨기지 않고, 실제 검색 모달/인포카드/길찾기/스탬프북에서는 숨긴다. */
  const hideBySearchModal=searchOpen;
  const statusSurfaceOpen=mapOpen || sheetOpen;
  const show=(_mode==='shrine' && statusSurfaceOpen && nearbyReady && !hideBySearchModal && !infoOpen && !routeOpen && !visitOpen);
  delete btn.dataset.oaiShowAfter;
  if(layer){
    layer.classList.toggle('show', !!show);
    layer.setAttribute('aria-hidden', show?'false':'true');
  }
  btn.classList.toggle('show', !!show);
  btn.textContent='나의 성지순례 현황';
}
function _bindShrineVisitFloatingListButtonWatchers(){
  if(window.__OAI_SHRINE_VISIT_FLOATING_WATCH_BOUND__) return;
  window.__OAI_SHRINE_VISIT_FLOATING_WATCH_BOUND__=true;
  const refresh=function(){
    try{ if(typeof window.__oaiIsResumeFreeze === 'function' && window.__oaiIsResumeFreeze()) return; }catch(_e){}
    setTimeout(function(){ try{
      if(typeof window.__oaiIsResumeFreeze === 'function' && window.__oaiIsResumeFreeze()) return;
      _updateShrineVisitFloatingListButtonUI();
    }catch(_e){} }, 40);
  };
  ['focusin','focusout','click','keyup','touchend'].forEach(function(ev){ document.addEventListener(ev, refresh, true); });
  ['resize','orientationchange','pageshow'].forEach(function(ev){ window.addEventListener(ev, refresh, {passive:true}); });
  try{ if(window.visualViewport) window.visualViewport.addEventListener('resize', refresh, {passive:true}); }catch(_e){}
  try{
    const mo=new MutationObserver(refresh);
    ['sheet-nearby','sheet-list','sheet-region','sheet-route','info-card','srch-modal','shrine-visit-cards-modal','shrine-visit-detail-view','shrine-visit-modal'].forEach(function(id){
      const el=document.getElementById(id); if(el) mo.observe(el,{attributes:true,attributeFilter:['class','style']});
    });
    window.__OAI_SHRINE_VISIT_FLOATING_MO__=mo;
  }catch(_e){}
  setInterval(function(){ try{ if(_mode==='shrine') _updateShrineVisitFloatingListButtonUI(); }catch(_e){} }, 350);
}
try{ _bindShrineVisitFloatingListButtonWatchers(); }catch(_e){}

function _updateShrineVisitCardsButtonUI(){
  const btn=_ensureShrineVisitCardsButton();
  const count=_getShrineVisitEntries().length;
  if(btn){
    btn.classList.remove('show');
    btn.textContent=count ? '순례기록 '+count : '순례기록';
  }
  _updateShrineVisitSheetButtonsUI();
}
function _ensureShrineVisitCardsModal(){
  let modal=document.getElementById('shrine-visit-cards-modal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='shrine-visit-cards-modal';
  modal.className='shrine-visit-cards-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="shrine-visit-cards-backdrop" data-shrine-cards-close="1"></div><div class="shrine-visit-cards-panel" role="dialog" aria-modal="true" aria-label="나의 순례기록"><div class="module-bar shrine-visit-cards-head"><div class="module-bar-main"><div class="module-bar-ico">✝</div><div class="module-bar-txt"><div class="module-bar-title">순례 스탬프북</div><div class="module-bar-sub">나의 성지순례 기록</div></div></div><button type="button" id="shrine-visit-cards-x" class="module-close" aria-label="닫기">×</button></div><div class="shrine-visit-cards-tabs" role="tablist" aria-label="순례기록 분류"><button type="button" data-shrine-visit-cards-tab="visited">순례한 성지</button><button type="button" data-shrine-visit-cards-tab="unvisited">미방문 성지</button><button type="button" data-shrine-visit-cards-tab="new">신규 성지</button><button type="button" data-shrine-visit-cards-tab="stats">통계</button></div><div id="shrine-visit-cards-filters" class="shrine-visit-cards-filters" aria-label="순례한 성지 정렬 및 필터" aria-hidden="true"></div><div id="shrine-visit-cards-diocese" class="shrine-visit-cards-diocese" aria-label="교구 선택"></div><div id="shrine-visit-cards-stats" class="shrine-visit-cards-stats"></div><div id="shrine-visit-cards-body" class="shrine-visit-cards-body"></div></div>';
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-shrine-cards-close],#shrine-visit-cards-x,#shrine-visit-cards-back').forEach(function(el){
    el.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); _closeShrineVisitCardsModal(); });
  });
  modal.addEventListener('click', function(e){
    const picker=e.target&&e.target.closest&&e.target.closest('[data-oai-visit-picker]');
    if(picker){e.preventDefault();e.stopPropagation();_openOaiVisitPicker(picker.getAttribute('data-oai-visit-picker')||'');return;}
    const tab=e.target&&e.target.closest&&e.target.closest('[data-shrine-visit-cards-tab]');
    if(tab){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      const nextTab=tab.getAttribute('data-shrine-visit-cards-tab')||'visited';
      if(nextTab==='stats') _resetShrineVisitStatsExpansion();
      else _resetShrineVisitStatsExpansion();
      _shrineVisitCardsTab=nextTab;
      _renderShrineVisitCardsModal();
      setTimeout(_resetShrineVisitCardsTopStable, 0);
      return;
    }
    const dio=e.target&&e.target.closest&&e.target.closest('[data-shrine-visit-diocese]');
    if(dio){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      _shrineVisitCardsDiocese=dio.getAttribute('data-shrine-visit-diocese')||'all';
      _renderShrineVisitCardsModal();
      setTimeout(function(){ _scrollShrineVisitDioceseTabIntoView(_shrineVisitCardsDiocese,'smooth'); }, 60);
      return;
    }
    const statRow=e.target&&e.target.closest&&e.target.closest('[data-shrine-stat-diocese]');
    if(statRow){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      const dioVal=statRow.getAttribute('data-shrine-stat-diocese')||'all';
      const body=document.getElementById('shrine-visit-cards-body');
      const keepTop=body?body.scrollTop:0;
      const prev=String(window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__||'');
      window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__=(prev===String(dioVal))?'':dioVal;
      _shrineVisitCardsTab='stats';
      _renderShrineVisitCardsModal();
      if(body) body.scrollTop=keepTop;
      if(window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__){
        setTimeout(function(){ _scrollShrineVisitExpandedStatsIntoView(dioVal); }, 70);
      }
      return;
    }
    const card=e.target&&e.target.closest&&e.target.closest('[data-shrine-visit-card]');
    if(!card) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    const idx=parseInt(card.getAttribute('data-shrine-visit-card'),10);
    window.__OAI_SHRINE_VISIT_DETAIL_FROM_CARDS__=true;
    _suspendShrineVisitCardsForDetail();
    _setShrineVisitDetailFromCardsActive(true);
    _openShrineVisitDetail(idx);
  }, true);
  modal.addEventListener('change', function(e){
    const target=e.target;
    if(!target || !target.matches) return;
    if(target.matches('[data-shrine-visit-date-sort]')){
      _shrineVisitCardsDateSort=(target.value==='oldest')?'oldest':'recent';
      _renderShrineVisitCardsModal();
      setTimeout(_resetShrineVisitCardsTopStable, 0);
      return;
    }
    if(target.matches('[data-shrine-visit-diocese-select]')){
      _shrineVisitCardsDiocese=target.value||'all';
      _renderShrineVisitCardsModal();
      setTimeout(_resetShrineVisitCardsTopStable, 0);
      return;
    }
    if(target.matches('[data-shrine-visit-type]')){
      const v=target.value||'all';
      _shrineVisitCardsType=(v==='shrine'||v==='martyr'||v==='pilgrim')?v:'all';
      _renderShrineVisitCardsModal();
      setTimeout(_resetShrineVisitCardsTopStable, 0);
    }
  }, true);
  _bindShrineVisitCardsSwipe(modal);
  return modal;
}
function _scrollShrineVisitCardsBodyTop(){
  try{
    const body=document.getElementById('shrine-visit-cards-body');
    const panel=document.querySelector('.shrine-visit-cards-panel');
    if(panel){
      if(typeof panel.scrollTo==='function') panel.scrollTo({top:0,behavior:'auto'});
      else panel.scrollTop=0;
    }
    if(!body) return;
    if(typeof body.scrollTo==='function') body.scrollTo({top:0,behavior:'auto'});
    else body.scrollTop=0;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _resetShrineVisitCardsTopStable(){
  try{ _scrollShrineVisitCardsBodyTop(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(window.requestAnimationFrame) requestAnimationFrame(_scrollShrineVisitCardsBodyTop);
    setTimeout(_scrollShrineVisitCardsBodyTop, 80);
    setTimeout(_scrollShrineVisitCardsBodyTop, 220);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _switchShrineVisitCardsTabBySwipe(dir){
  const tabs=['visited','unvisited','new','stats'];
  const current=(_shrineVisitCardsTab==='unvisited'||_shrineVisitCardsTab==='new'||_shrineVisitCardsTab==='stats')?_shrineVisitCardsTab:'visited';
  const idx=Math.max(0,tabs.indexOf(current));
  const nextIdx=(idx+(dir>0?1:-1)+tabs.length)%tabs.length;
  _shrineVisitCardsTab=tabs[nextIdx];
  _resetShrineVisitStatsExpansion();
  _renderShrineVisitCardsModal();
  setTimeout(_resetShrineVisitCardsTopStable, 0);
  return true;
}
function _bindShrineVisitCardsSwipe(modal){
  try{
    if(!modal || modal.__OAI_SHRINE_VISIT_SWIPE_BOUND__) return;
    modal.__OAI_SHRINE_VISIT_SWIPE_BOUND__=true;
    let sx=0, sy=0, tx=0, ty=0, tracking=false;
    function blockedTarget(target){
      return !!(target && target.closest && target.closest('.shrine-visit-cards-tabs,.shrine-visit-cards-diocese,input,textarea,select'));
    }
    modal.addEventListener('touchstart', function(e){
      const t=e.touches&&e.touches[0];
      if(!t || blockedTarget(e.target)){ tracking=false; return; }
      if(!_isShrineVisitCardsModalOpen()){ tracking=false; return; }
      sx=t.clientX; sy=t.clientY; tx=sx; ty=sy; tracking=true;
    }, {passive:true});
    modal.addEventListener('touchmove', function(e){
      if(!tracking) return;
      const t=e.touches&&e.touches[0];
      if(!t) return;
      tx=t.clientX; ty=t.clientY;
    }, {passive:true});
    modal.addEventListener('touchend', function(e){
      if(!tracking) return;
      tracking=false;
      const t=e.changedTouches&&e.changedTouches[0];
      if(t){ tx=t.clientX; ty=t.clientY; }
      const dx=tx-sx, dy=ty-sy;
      const ax=Math.abs(dx), ay=Math.abs(dy);
      if(ax<64 || ax<ay*1.45) return;
      const changed=_switchShrineVisitCardsTabBySwipe(dx<0?1:-1);
      if(changed){
        try{ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }catch(_e){}
      }
    }, {passive:false});
    modal.addEventListener('touchcancel', function(){ tracking=false; }, {passive:true});
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _isShrineVisitCardsModalOpen(){
  const modal=document.getElementById('shrine-visit-cards-modal');
  return !!(modal&&modal.classList.contains('show'));
}

function _syncShrineVisitCardsViewportHeight(){
  try{
    const de=document.documentElement;
    const vv=window.visualViewport;
    const vals=[];
    if(window.innerHeight) vals.push(window.innerHeight);
    if(de && de.clientHeight) vals.push(de.clientHeight);
    if(vv && vv.height) vals.push(vv.height);
    const h=Math.max.apply(Math, vals.filter(function(v){ return v && isFinite(v); }));
    if(h && h>300){
      de.style.setProperty('--oai-stampbook-viewport-h', Math.round(h)+'px');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{
  _syncShrineVisitCardsViewportHeight();
  window.addEventListener('resize', _syncShrineVisitCardsViewportHeight, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(_syncShrineVisitCardsViewportHeight, 80); }, {passive:true});
  if(window.visualViewport) window.visualViewport.addEventListener('resize', _syncShrineVisitCardsViewportHeight, {passive:true});
}catch(_e){}
function _setShrineVisitDetailFromCardsActive(active){
  try{
    const isActive=!!active;
    document.documentElement.classList.toggle('oai-shrine-detail-from-cards', isActive);
    document.body.classList.toggle('oai-shrine-detail-from-cards', isActive);
    const modal=document.getElementById('shrine-visit-cards-modal');
    if(modal) modal.classList.toggle('detail-covered', isActive && modal.classList.contains('show'));
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _suspendShrineVisitCardsForDetail(){
  try{
    const modal=document.getElementById('shrine-visit-cards-modal');
    if(modal){
      modal.classList.remove('show','detail-covered');
      modal.setAttribute('aria-hidden','true');
    }
    window.__OAI_SHRINE_VISIT_RETURN_TO_CARDS__=true;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _resumeShrineVisitCardsFromDetail(){
  try{
    const modal=_ensureShrineVisitCardsModal();
    _syncShrineVisitCardsViewportHeight();
    _setShrineVisitDetailFromCardsActive(false);
    _renderShrineVisitCardsModal();
    modal.classList.remove('detail-covered');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    setTimeout(_resetShrineVisitCardsTopStable, 0);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _pushShrineVisitCardsHistory(){
  return;
}
function _openShrineVisitCardsModal(){
  if(_mode!=='shrine') return;
  const modal=_ensureShrineVisitCardsModal();
  _syncShrineVisitCardsViewportHeight();
  window.__OAI_SHRINE_VISIT_RETURN_TO_CARDS__=false;
  _setShrineVisitDetailFromCardsActive(false);
  _shrineVisitCardsTab='visited';
  _shrineVisitCardsDiocese='all';
  _shrineVisitCardsDateSort='recent';
  _shrineVisitCardsType='all';
  window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__='';
  _renderShrineVisitCardsModal();
  try{
    const body=document.getElementById('shrine-visit-cards-body');
    const dio=document.getElementById('shrine-visit-cards-diocese');
    if(body) body.scrollTop=0;
    if(dio) dio.scrollLeft=0;
  }catch(_e){}
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  _resetShrineVisitCardsTopStable();
  _pushShrineVisitCardsHistory();
}
function _closeShrineVisitCardsModal(opts){
  opts=opts||{};
  const modal=document.getElementById('shrine-visit-cards-modal');
  const wasOpen=!!(modal&&modal.classList.contains('show'));
  if(modal){ modal.classList.remove('show','detail-covered'); modal.setAttribute('aria-hidden','true'); }
  if(!opts.suspendForDetail) window.__OAI_SHRINE_VISIT_RETURN_TO_CARDS__=false;
  if(!_isShrineVisitDetailOpen()) _setShrineVisitDetailFromCardsActive(false);
  _resetShrineVisitStatsExpansion();
  window.__OAI_SHRINE_VISIT_CARDS_HISTORY__=false;
  window.__OAI_SHRINE_VISIT_CARDS_CLOSING_BY_CODE__=false;
}

function _ensureShrineVisitDetailView(){
  let view=document.getElementById('shrine-visit-detail-view');
  if(view) return view;
  view=document.createElement('div');
  view.id='shrine-visit-detail-view';
  view.className='shrine-visit-detail-view';
  view.setAttribute('aria-hidden','true');
  view.innerHTML='<div class="shrine-visit-detail-head"><div class="shrine-visit-detail-head-title">순례한 성지</div><button type="button" id="shrine-visit-detail-x" class="shrine-visit-detail-x" aria-label="닫기">×</button></div><div id="shrine-visit-detail-body" class="shrine-visit-detail-body"></div>';
  document.body.appendChild(view);
  view.querySelectorAll('#shrine-visit-detail-back,#shrine-visit-detail-x').forEach(function(el){
    el.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); _closeShrineVisitDetail(); });
  });
  view.addEventListener('click', function(e){
    const register=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-register]');
    if(register){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      const idx=parseInt(window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__,10);
      if(idx>=0&&SHRINES[idx]){
        try{ _mode='shrine'; }catch(_e){}
        _openShrineVisitModal(SHRINES[idx]);
      }
      return;
    }
    const add=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-add]');
    if(add){
      e.preventDefault(); e.stopPropagation();
      const idx=parseInt(add.getAttribute('data-shrine-detail-add'),10);
      if(idx>=0&&SHRINES[idx]) _openShrineVisitModal(SHRINES[idx]);
      return;
    }
    const mapBtn=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-map]');
    if(mapBtn){
      e.preventDefault(); e.stopPropagation();
      const idx=parseInt(mapBtn.getAttribute('data-shrine-detail-map'),10);
      if(idx>=0&&SHRINES[idx]) _openShrineVisitDetailOnMap(idx);
      return;
    }
    const route=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-route]');
    if(route){
      e.preventDefault(); e.stopPropagation();
      const idx=parseInt(route.getAttribute('data-shrine-detail-route'),10);
      if(idx>=0&&SHRINES[idx]){
        const item=SHRINES[idx];
        _closeShrineVisitDetail({fromPopstate:true});
        _closeShrineVisitCardsModal({fromPopstate:true});
        _curInfoItem={item:item,idx:idx};
        _curFromRegion=false;
        openInAppRoute();
      }
      return;
    }
    const kakao=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-kakao]');
    if(kakao){
      e.preventDefault(); e.stopPropagation();
      const idx=parseInt(kakao.getAttribute('data-shrine-detail-kakao'),10);
      if(idx>=0&&SHRINES[idx]){
        _curInfoItem={item:SHRINES[idx],idx:idx};
        _curFromRegion=false;
        openKakaoNav();
      }
      return;
    }
    const hp=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-hp]');
    if(hp){
      e.preventDefault(); e.stopPropagation();
      const url=hp.getAttribute('data-shrine-detail-hp')||'';
      if(url) openCoreExternalUrl(url,{source:'pilgrim-detail-homepage',fromStampBook:true,infoIdx:window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__});
      return;
    }
    const guide=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-guide]');
    if(guide){
      e.preventDefault(); e.stopPropagation();
      const url=guide.getAttribute('data-shrine-detail-guide')||'';
      if(url) openCoreExternalUrl(url,{source:'pilgrim-detail-guide',fromStampBook:true,infoIdx:window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__});
    }
    const goodnews=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-goodnews]');
    if(goodnews){
      e.preventDefault(); e.stopPropagation();
      const url=goodnews.getAttribute('data-shrine-detail-goodnews')||'';
      if(url) openCoreExternalUrl(url,{source:'pilgrim-detail-goodnews',fromStampBook:true,infoIdx:window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__});
    }
    const materials=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-materials]');
    if(materials){
      e.preventDefault(); e.stopPropagation();
      const idx=parseInt(materials.getAttribute('data-shrine-detail-materials'),10);
      if(idx>=0&&SHRINES[idx]) _openMyeongryeMaterials(SHRINES[idx]);
    }
  }, true);
  return view;
}
function _isShrineVisitDetailOpen(){
  const view=document.getElementById('shrine-visit-detail-view');
  return !!(view&&view.classList.contains('show'));
}
function _pushShrineVisitDetailHistory(){
  return;
}
function _renderShrineVisitDetail(idx){
  const body=document.getElementById('shrine-visit-detail-body');
  if(!body) return;
  idx=parseInt(idx,10);
  const item=(idx>=0&&SHRINES[idx])?SHRINES[idx]:null;
  if(!item){ body.innerHTML='<div class="shrine-visit-detail-empty">성지 정보를 찾을 수 없습니다.</div>'; return; }
  const visits=_getShrineVisitDates(item);
  const count=visits.length;
  const headTitle=document.querySelector('#shrine-visit-detail-view .shrine-visit-detail-head-title');
  if(headTitle) headTitle.textContent=count?'순례한 성지':'미방문 성지';
  const recent=count?_formatVisitDate(visits[0].date):'—';
  const dateHtml=count?visits.map(function(v){ return '<span class="shrine-visit-detail-date-chip">'+_visitHtmlEsc(_formatVisitDate(v.date))+'</span>'; }).join(''):'<span class="shrine-visit-detail-empty-date">아직 등록된 날짜가 없습니다.</span>';
  const hpUrl=_getShrineHomepageUrl(item);
  const guideUrl=_getShrineGuideUrl(item);
  const goodnewsUrl=_getShrineGoodnewsUrl(item);
  const telText=item.tel?_visitHtmlEsc(item.tel):'—';
  const telHref=item.tel?'tel:'+String(item.tel).replace(/[^0-9+]/g,''):'';
    // V8-1-14-621: 상세 인포카드 색상은 style.css의 공통 클래스에서만 관리한다.
  const hpBtn=hpUrl?'<button type="button" class="shrine-visit-detail-action detail-home" data-shrine-detail-hp="'+_visitHtmlEsc(hpUrl)+'">홈페이지</button>':'';
  const guideBtn=guideUrl?'<button type="button" class="shrine-visit-detail-action detail-guide" data-shrine-detail-guide="'+_visitHtmlEsc(guideUrl)+'">성지 상세페이지</button>':'';
  const goodnewsBtn=goodnewsUrl?'<button type="button" class="shrine-visit-detail-action detail-goodnews" data-shrine-detail-goodnews="'+_visitHtmlEsc(goodnewsUrl)+'">굿뉴스 성지안내</button>':'';
  const telBtn=telHref?'<a class="shrine-visit-detail-action detail-tel" href="'+_visitHtmlEsc(telHref)+'"><span class="detail-tel-icon">📞</span><span>'+telText+'</span></a>':'';
  const routeBtn='<button type="button" class="shrine-visit-detail-action detail-route" data-shrine-detail-route="'+idx+'">경로검색</button>';
  const kakaoBtn='<button type="button" class="shrine-visit-detail-action detail-kakao" data-shrine-detail-kakao="'+idx+'">카카오내비</button>';
  const isMyeongrye=_isMyeongryeShrine(item);
  const materialsBtn='<button type="button" class="shrine-visit-detail-action detail-materials" data-shrine-detail-materials="'+idx+'">성지 자료</button>';
  const primaryRow='<div class="shrine-visit-detail-action-row detail-primary-row">'+telBtn+routeBtn+'</div>';
  const linkRow=isMyeongrye?'<div class="shrine-visit-detail-action-row detail-link-row">'+materialsBtn+'</div>':((hpBtn||guideBtn)?'<div class="shrine-visit-detail-action-row detail-link-row">'+hpBtn+guideBtn+'</div>':'');
  const kakaoRow='<div class="shrine-visit-detail-action-row detail-kakao-row">'+(isMyeongrye?'':goodnewsBtn)+kakaoBtn+'</div>';
  body.innerHTML='<section class="shrine-visit-detail-hero"><div class="shrine-visit-detail-hero-head"><div class="shrine-visit-detail-kicker">순례 기록</div><button type="button" class="shrine-visit-detail-register" data-shrine-detail-register="1" aria-label="순례등록">순례등록</button></div><div class="shrine-visit-detail-count">순례 '+count+'회</div><div class="shrine-visit-detail-recent">최근 순례일 '+_visitHtmlEsc(recent)+'</div><div class="shrine-visit-detail-date-title">순례 날짜</div><div class="shrine-visit-detail-date-list">'+dateHtml+'</div></section><section class="shrine-visit-detail-info"><div class="shrine-visit-detail-info-head"><div class="shrine-visit-detail-section-title">성지 정보</div><button type="button" class="shrine-visit-detail-map-btn" data-shrine-detail-map="'+idx+'">지도에서 보기</button></div><div class="shrine-visit-detail-name">'+_visitHtmlEsc(item.name||'')+'</div><div class="shrine-visit-detail-row"><span>교구</span><strong>'+_visitHtmlEsc(item.diocese||'—')+'</strong></div><div class="shrine-visit-detail-row"><span>주소</span><strong>'+_visitHtmlEsc(item.addr||'—')+'</strong></div><div class="shrine-visit-detail-row"><span>전화</span><strong>'+telText+'</strong></div><div class="shrine-visit-detail-actions">'+primaryRow+linkRow+kakaoRow+'</div></section>';
}
/* V8-1-14-679: 순례 상세의 '지도에서 보기'는 카드 데이터와 지도 중심을 하나의 pending target으로 함께 적용한다. */
function _isShrineMapTargetCenterLocked(){
  const now=Date.now?Date.now():new Date().getTime();
  return Number(_shrineMapTargetCenterLockUntil||0)>now;
}
function _beginShrineVisitMapTarget(idx){
  idx=parseInt(idx,10);
  _pendingShrineMapTargetToken=(Number(_pendingShrineMapTargetToken||0)||0)+1;
  _pendingShrineMapTargetIdx=(idx>=0&&SHRINES[idx])?idx:-1;
  _shrineMapTargetCenterLockUntil=(Date.now?Date.now():new Date().getTime())+2500;
  return _pendingShrineMapTargetToken;
}
function _isShrineVisitMapTargetPending(idx,token){
  idx=parseInt(idx,10);
  return !!(_mode==='shrine'&&_screen==='map'&&idx>=0&&SHRINES[idx]&&
    _pendingShrineMapTargetIdx===idx&&_pendingShrineMapTargetToken===token);
}
function _clearShrineVisitMapTarget(idx,token){
  if(_pendingShrineMapTargetIdx===idx&&_pendingShrineMapTargetToken===token){
    _pendingShrineMapTargetIdx=-1;
  }
}
function _applyShrineVisitMapTarget(idx,token){
  if(!_isShrineVisitMapTargetPending(idx,token)) return false;
  if(!_map||!_markers||!_markers[idx]||!_markers[idx].marker) return false;
  const item=SHRINES[idx];
  try{
    closeAllTabs();
    _shrineVisitMapFilter='all';
    _filterDio='all';
    _listSrch='';
    _curFromRegion=false;
    _updateShrineVisitMapFilterUI();
    _restoreAllCategoryMarkersForSelection();
    _selectShrineMarker(idx);
    if(typeof _map.getLevel==='function'&&typeof _map.setLevel==='function'&&_map.getLevel()>7){
      _map.setLevel(7);
    }
    _showInfoCard(item,idx);
    try{ _setMapPanelCollapsed(false,'shrine-visit-map-target'); }catch(_e){}
    _shrineMapTargetCenterLockUntil=(Date.now?Date.now():new Date().getTime())+1200;
    requestAnimationFrame(function(){
      try{
        if(!_isShrineVisitMapTargetPending(idx,token)) return;
        _scheduleInfoCardMarkerFocus(item,'shrine-visit-map-target');
        _clearShrineVisitMapTarget(idx,token);
      }catch(e){ console.warn('[가톨릭길동무]',e); }
    });
    return true;
  }catch(e){ console.warn('[가톨릭길동무]',e); return false; }
}
function _scheduleShrineVisitMapTarget(idx,token){
  let tries=0;
  (function retry(){
    if(!_isShrineVisitMapTargetPending(idx,token)) return;
    if(_applyShrineVisitMapTarget(idx,token)) return;
    if(tries++<36) setTimeout(retry,100);
    else _clearShrineVisitMapTarget(idx,token);
  })();
}
function _openShrineVisitDetailOnMap(idx){
  _setShrineVisitDetailFromCardsActive(false);
  window.__OAI_SHRINE_VISIT_DETAIL_FROM_CARDS__=false;
  idx=parseInt(idx,10);
  if(!(idx>=0) || !SHRINES[idx]) return;
  const previousMode=_mode;
  const targetToken=_beginShrineVisitMapTarget(idx);
  try{ _closeShrineVisitDetail({fromPopstate:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ _closeShrineVisitCardsModal({fromPopstate:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _closeShrineVisitModal==='function') _closeShrineVisitModal({fromPopstate:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    _mode='shrine';
    _screen='map';
    _filterDio='all';
    _listSrch='';
    _curFromRegion=false;
    document.documentElement.classList.add('app-active');
    document.documentElement.classList.remove('parish-mode','retreat-mode');
    const cover=$('cover'); if(cover){ cover.style.opacity='0'; cover.style.display='none'; }
    closeAllTabs();
    closeInfoCard({keepMap:true});
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  const mapElement=$('map');
  const mapSurfaceReady=!!(_map&&mapElement&&mapElement.children&&mapElement.children.length);
  const shrineLayerReady=!!(previousMode==='shrine'&&_markers&&_markers.length===SHRINES.length);
  if(!mapSurfaceReady||!shrineLayerReady){
    try{
      _resetMapState();
      _mapInited=true;
      window._noAutoNearby=true;
      _loadMap();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  _scheduleShrineVisitMapTarget(idx,targetToken);
}

function _openShrineVisitDetail(idx){
  idx=parseInt(idx,10);
  if(!(idx>=0)&&idx!==0) return;
  if(!SHRINES[idx]) return;
  const view=_ensureShrineVisitDetailView();
  if(window.__OAI_SHRINE_VISIT_DETAIL_FROM_CARDS__===true) _setShrineVisitDetailFromCardsActive(true);
  else _setShrineVisitDetailFromCardsActive(false);
  window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__=idx;
  _renderShrineVisitDetail(idx);
  view.classList.add('show');
  view.setAttribute('aria-hidden','false');
  _pushShrineVisitDetailHistory();
}
function _closeShrineVisitDetail(opts){
  opts=opts||{};
  const view=document.getElementById('shrine-visit-detail-view');
  const wasOpen=!!(view&&view.classList.contains('show'));
  const shouldResumeCards=wasOpen && window.__OAI_SHRINE_VISIT_DETAIL_FROM_CARDS__===true && window.__OAI_SHRINE_VISIT_RETURN_TO_CARDS__===true && !opts.fromPopstate && !opts.noReturnCards;
  if(view){ view.classList.remove('show'); view.setAttribute('aria-hidden','true'); }
  window.__OAI_SHRINE_VISIT_DETAIL_FROM_CARDS__=false;
  window.__OAI_SHRINE_VISIT_RETURN_TO_CARDS__=false;
  _setShrineVisitDetailFromCardsActive(false);
  window.__OAI_SHRINE_VISIT_DETAIL_HISTORY__=false;
  window.__OAI_SHRINE_VISIT_DETAIL_CLOSING_BY_CODE__=false;
  if(shouldResumeCards) _resumeShrineVisitCardsFromDetail();
}

function _scrollShrineVisitDioceseTabIntoView(value, behavior){
  try{
    const wrap=document.getElementById('shrine-visit-cards-diocese');
    if(!wrap) return;
    let btn=null;
    wrap.querySelectorAll('[data-shrine-visit-diocese]').forEach(function(el){
      if(String(el.getAttribute('data-shrine-visit-diocese')||'')===String(value)) btn=el;
    });
    if(!btn) return;
    const target=Math.max(0, btn.offsetLeft - Math.max(0,(wrap.clientWidth-btn.offsetWidth)/2));
    if(typeof wrap.scrollTo==='function') wrap.scrollTo({left:target, behavior:behavior||'smooth'});
    else wrap.scrollLeft=target;
    if(btn.scrollIntoView) setTimeout(function(){ try{ btn.scrollIntoView({behavior:behavior||'smooth', block:'nearest', inline:'center'}); }catch(_e){} }, 80);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _scrollShrineVisitExpandedStatsIntoView(value){
  try{
    const body=document.getElementById('shrine-visit-cards-body');
    if(!body||!value) return;
    const safe=String(value).replace(/\"/g,'\\"');
    const row=document.querySelector('[data-shrine-stat-diocese="'+safe+'"]');
    if(!row) return;
    const bodyRect=body.getBoundingClientRect();
    const rowRect=row.getBoundingClientRect();
    const topGap=rowRect.top-bodyRect.top;
    const bottomGap=rowRect.bottom-(bodyRect.bottom-16);
    if(topGap<8){
      body.scrollTop=Math.max(0, body.scrollTop+topGap-8);
    }else if(bottomGap>0){
      body.scrollTop=Math.min(Math.max(0,body.scrollHeight-body.clientHeight), body.scrollTop+bottomGap+8);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}


function _renderShrineVisitCardsStatsView(allVisited,allUnvisited,visited,unvisited,total){
  const allTotal=(Array.isArray(SHRINES)?SHRINES.length:(allVisited.length+allUnvisited.length));
  const allCount=allVisited.length;
  const allPct=allTotal?Math.round((allCount/allTotal)*100):0;
  const expanded=window.__OAI_SHRINE_VISIT_STATS_EXPANDED_DIO__||'';
  const entries=_getShrineVisitStatsDioceseEntries().filter(function(pair){ return pair&&pair[0]&&pair[0]!=='all'; });
  const rows=entries.map(function(pair){
    const key=pair[0], label=pair[1];
    const totalBy=(Array.isArray(SHRINES)?SHRINES.filter(function(item){ return String(item&&item.diocese||'')===String(key); }).length:0);
    const visitEntries=allVisited.filter(function(entry){ return String(entry.item&&entry.item.diocese||'')===String(key); });
    const visitBy=visitEntries.length;
    const pct=totalBy?Math.round((visitBy/totalBy)*100):0;
    return {key:key,label:label,total:totalBy,visited:visitBy,pct:pct,entries:visitEntries};
  }).filter(function(row){ return row.total>0; }).sort(function(a,b){
    return (b.pct-a.pct) || (b.visited-a.visited) || (b.total-a.total) || String(a.label||'').localeCompare(String(b.label||''),'ko');
  }).map(function(row){
    const active=String(expanded)===String(row.key);
    const open=String(expanded)===String(row.key);
    const itemHtml=open?('<div class="shrine-visit-stat-items" aria-label="'+_visitHtmlEsc(row.label)+' 순례 기록">'+(row.entries.length?row.entries.map(function(entry){
      const recent=entry.recent?_formatVisitDate(entry.recent):'—';
      const name=_visitHtmlEsc(entry.item&&entry.item.name||'');
      return '<div class="shrine-visit-stat-item"><span class="shrine-visit-stat-place-name">'+name+'</span><span class="shrine-visit-stat-place-meta"><strong>순례 '+entry.count+'회</strong><em>'+_visitHtmlEsc(recent)+'</em></span></div>';
    }).join(''):'<div class="shrine-visit-stat-item empty"><span class="shrine-visit-stat-place-name">순례 기록이 없습니다.</span></div>')+'</div>'):'';
    return '<button type="button" class="shrine-visit-stat-row'+(active?' active':'')+'" data-shrine-stat-diocese="'+_visitHtmlEsc(row.key)+'"><span class="shrine-visit-stat-name">'+_visitHtmlEsc(row.label)+'</span><strong>'+row.visited+' / '+row.total+'</strong><em>'+row.pct+'%</em></button>'+itemHtml;
  }).join('');
  return '<div class="shrine-visit-stats-view"><section class="shrine-visit-stat-total"><div class="shrine-visit-stat-kicker">전체 순례 현황</div><strong>'+allCount+'곳 순례 / '+allTotal+'곳</strong><span>'+allPct+'% 순례</span></section><section class="shrine-visit-stat-list"><div class="shrine-visit-stat-kicker">교구별 순례 현황 · 순례율 높은 순</div>'+rows+'</section></div>';
}

function _renderShrineVisitCardsModal(){
  const body=document.getElementById('shrine-visit-cards-body');
  if(!body) return;
  const allVisited=_getShrineVisitEntries();
  const allUnvisited=_getShrineUnvisitedEntries();
  const allNew=_getShrineNewEntries();
  const rawTab=_shrineVisitCardsTab||'visited';
  const active=(rawTab==='unvisited'||rawTab==='new'||rawTab==='stats')?rawTab:'visited';
  _shrineVisitCardsTab=active;
  const visitedByDiocese=_filterShrineVisitEntriesByDiocese(allVisited);
  const unvisitedByDiocese=_filterShrineVisitEntriesByDiocese(allUnvisited);
  const newEntries=_filterShrineVisitEntriesByDiocese(allNew);
  const visited=(active==='visited')?_sortShrineVisitEntriesByDate(_filterShrineVisitEntriesByType(visitedByDiocese)):visitedByDiocese;
  const unvisited=(active==='visited')?_filterShrineVisitEntriesByType(unvisitedByDiocese):unvisitedByDiocese;
  const total=visited.length+unvisited.length;
  _renderShrineVisitFilterControls(active);
  _renderShrineVisitDioceseTabs(visited.length,total);
  const dioWrap=document.getElementById('shrine-visit-cards-diocese');
  if(dioWrap){
    const hideDio=(active==='stats'||active==='visited');
    dioWrap.classList.toggle('stats-hidden', hideDio);
    dioWrap.setAttribute('aria-hidden', hideDio?'true':'false');
  }
  const stats=document.getElementById('shrine-visit-cards-stats');
  if(stats){
    const hideTopStats=(active==='stats');
    stats.classList.toggle('stats-tab-hidden', hideTopStats);
    const displayVisited=visited.length;
    const displayTotal=total;
    const pct=displayTotal?Math.round((displayVisited/displayTotal)*100):0;
    const dioLabel=_getShrineVisitDioceseLabel(_shrineVisitCardsDiocese||'all');
    const typeLabel=(active==='visited'&&_shrineVisitCardsType!=='all')?_shrineVisitTypeFilterLabel(_shrineVisitCardsType):'';
    const scopeLabel=typeLabel?(dioLabel+' · '+typeLabel):dioLabel;
    stats.innerHTML=hideTopStats?'':'<strong>'+displayVisited+'곳 순례</strong><span>/ '+displayTotal+'곳</span><b>ㅣ</b><span>'+pct+'% 순례</span><em>'+_visitHtmlEsc(scopeLabel)+'</em>';
  }
  if(active!=='stats'&&active!=='visited'){
    setTimeout(function(){ _scrollShrineVisitDioceseTabIntoView(_shrineVisitCardsDiocese||'all','auto'); }, 40);
  }
  const modal=document.getElementById('shrine-visit-cards-modal');
  if(modal){
    modal.querySelectorAll('[data-shrine-visit-cards-tab]').forEach(function(btn){
      const val=btn.getAttribute('data-shrine-visit-cards-tab')||'visited';
      btn.classList.toggle('active', val===active);
      btn.classList.toggle('on', val===active);
      btn.textContent=(val==='visited')?'순례한 성지':(val==='unvisited'?'미방문 성지':(val==='new'?'신규 성지':'통계'));
    });
  }
  body.classList.toggle('unvisited', active==='unvisited');
  body.classList.toggle('new', active==='new');
  body.classList.toggle('stats', active==='stats');
  if(active==='stats'){
    body.innerHTML=_renderShrineVisitCardsStatsView(allVisited,allUnvisited,visited,unvisited,total);
    return;
  }
  const entries=(active==='new')?newEntries:((active==='unvisited')?unvisited:visited);
  if(!entries.length){
    body.innerHTML='<div class="shrine-visit-cards-empty">'+(active==='visited'?'아직 순례등록한 성지가 없습니다.':(active==='new'?'신규 성지가 없습니다.':'모든 성지를 순례했습니다.'))+'</div>';
    return;
  }
  body.innerHTML='<div class="shrine-visit-card-grid">'+entries.map(function(entry){
    const item=entry.item;
    const typeClass=_shrineVisitTypeClass(item);
    const typeLabel=_shrineVisitTypeLabel(item);
    const isVisited=entry.count>0;
    const cardState=isVisited?'visited':(active==='new'?'new':'unvisited');
    const countText=isVisited?('순례 '+entry.count+'회'):(active==='new'?'':'미방문');
    const countHtml=countText?'<span class="shrine-visit-card-count">'+_visitHtmlEsc(countText)+'</span>':'';
    // 신규 성지 탭 자체로 구분되므로 카드 안에는 '신규' 문구를 반복 표시하지 않는다.
    const sealHtml=isVisited?'<span class="shrine-visit-card-seal" aria-hidden="true">순례</span>':'';
    return '<button type="button" class="shrine-visit-card-badge shrine-visit-card-unified '+cardState+' '+typeClass+'" data-shrine-visit-card="'+entry.idx+'"><span class="shrine-visit-card-stamp">'+_visitHtmlEsc(typeLabel)+'</span><span class="shrine-visit-card-dio">'+_visitHtmlEsc(item.diocese||'')+'</span><strong>'+_visitHtmlEsc(item.name||'')+'</strong>'+countHtml+sealHtml+'</button>';
  }).join('')+'</div>';
}

function _loadShrineAutoVisitPrompts(){
  try{
    const raw=localStorage.getItem(OAI_SHRINE_AUTO_VISIT_PROMPT_KEY);
    const data=raw?JSON.parse(raw):{};
    return data && typeof data==='object' ? data : {};
  }catch(e){ console.warn('[가톨릭길동무]', e); return {}; }
}
function _saveShrineAutoVisitPrompts(data){
  try{ localStorage.setItem(OAI_SHRINE_AUTO_VISIT_PROMPT_KEY, JSON.stringify(data||{})); }
  catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _autoVisitPromptKey(item,date){
  return _getShrineVisitKey(item)+'|'+String(date||_todayISODate());
}
function _wasAutoVisitPromptedToday(item,date){
  const data=_loadShrineAutoVisitPrompts();
  return !!data[_autoVisitPromptKey(item,date)];
}
function _markAutoVisitPromptedToday(item,date,action){
  const data=_loadShrineAutoVisitPrompts();
  data[_autoVisitPromptKey(item,date)]={date:date||_todayISODate(),action:action||'later',savedAt:new Date().toISOString()};
  _saveShrineAutoVisitPrompts(data);
}
function _nearestShrineWithinAutoVisitRadius(lat,lng){
  if(!Array.isArray(SHRINES)||!SHRINES.length) return null;
  let best=null,bestM=Infinity;
  SHRINES.forEach(function(s,idx){
    if(!s) return;
    const radius=(Number(s.gpsRadiusM)>0)?Number(s.gpsRadiusM):OAI_SHRINE_AUTO_VISIT_RADIUS_M;
    let points=[];
    if(Array.isArray(s.gpsPoints)&&s.gpsPoints.length){
      points=s.gpsPoints.filter(function(p){ return p&&Number(p.lat)&&Number(p.lng); });
    }
    if(!points.length && Number(s.lat)&&Number(s.lng)) points=[{name:s.name||'',lat:Number(s.lat),lng:Number(s.lng)}];
    points.forEach(function(p){
      const m=calcDist(lat,lng,Number(p.lat),Number(p.lng))*1000;
      if(m<=radius && m<bestM){
        bestM=m;
        best={item:s,idx:idx,meters:m,gpsPointName:p.name||''};
      }
    });
  });
  return best;
}
function _ensureShrineAutoVisitModal(){
  let modal=document.getElementById('shrine-auto-visit-modal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='shrine-auto-visit-modal';
  modal.className='shrine-auto-visit-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="shrine-auto-visit-backdrop"></div><div class="shrine-auto-visit-panel" role="dialog" aria-modal="true" aria-label="GPS 순례등록 완료"><div class="shrine-auto-visit-kicker">GPS 자동 순례등록</div><div id="shrine-auto-visit-title" class="shrine-auto-visit-title"></div><div class="shrine-auto-visit-actions"><button type="button" id="shrine-auto-visit-ok" class="shrine-auto-visit-save">확인</button></div></div>';
  document.body.appendChild(modal);
  const ok=modal.querySelector('#shrine-auto-visit-ok');
  if(ok) ok.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    _closeShrineAutoVisitModal();
  });
  return modal;
}
function _openShrineAutoVisitModal(entry,opts){
  if(!entry||!entry.item) return;
  opts=opts||{};
  const modal=_ensureShrineAutoVisitModal();
  window.__OAI_SHRINE_AUTO_VISIT_ENTRY__=entry;
  const title=document.getElementById('shrine-auto-visit-title');
  const kicker=modal.querySelector('.shrine-auto-visit-kicker');
  const placeName=entry.item.name||'성지';
  if(kicker) kicker.textContent=opts.method==='manual'?'순례등록 완료':'GPS 자동 순례등록';
  if(title) title.textContent='축하합니다. '+placeName+' 순례등록이 되었습니다.';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  try{
    const ok=document.getElementById('shrine-auto-visit-ok');
    if(ok) setTimeout(function(){ try{ ok.focus(); }catch(_e){} },30);
  }catch(_e){}
}
function _closeShrineAutoVisitModal(){
  const modal=document.getElementById('shrine-auto-visit-modal');
  if(modal){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
  window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__=false;
}
function _isAnyVisitModalOpen(){
  return !!(document.querySelector('#shrine-visit-modal.show,#shrine-visit-cards-modal.show,#shrine-auto-visit-modal.show,#shrine-visit-detail-view.show'));
}
function _registerAutoShrineVisit(entry){
  try{
    if(!entry||!entry.item) return false;
    const date=_todayISODate();
    if(_hasShrineVisitOnDate(entry.item,date)) return false;
    if(!_addShrineVisit(entry.item,date,'gps')) return false;
    _markAutoVisitPromptedToday(entry.item,date,'registered');
    if(_curInfoItem&&_curInfoItem.item===entry.item) _renderInfoCardShrineVisit(entry.item);
    try{ if(_activeTab==='list') renderList(); }catch(_e){}
    try{ if(_activeTab==='nearby') _loadNearby(); }catch(_e){}
    _shrineVisitMapFilter='all';
    _refreshShrineVisitMapState();
    try{ _restoreAllShrineMarkersAfterVisitRegistration(entry.item, (_curInfoItem&&_curInfoItem.item===entry.item)?_curInfoItem.idx:-1); }catch(_e){}
    try{ if(_isShrineVisitDetailOpen() && window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__!=null) _renderShrineVisitDetail(window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__); }catch(_e){}
    return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function _maybePromptAutoShrineVisit(lat,lng){
  try{
    if(!lat||!lng) return;
    if(window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__||_isAnyVisitModalOpen()) return;
    const entry=_nearestShrineWithinAutoVisitRadius(lat,lng);
    if(!entry||!entry.item) return;
    const date=_todayISODate();
    if(_hasShrineVisitOnDate(entry.item,date)) return;
    window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__=true;
    setTimeout(function(){
      if(_isAnyVisitModalOpen()){
        window.__OAI_SHRINE_AUTO_VISIT_PENDING__=entry;
        window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__=false;
        return;
      }
      if(_registerAutoShrineVisit(entry)) _openShrineAutoVisitModal(entry);
      else window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__=false;
    },700);
  }catch(e){ console.warn('[가톨릭길동무]', e); window.__OAI_SHRINE_AUTO_VISIT_PROMPTING__=false; }
}

function _openShrineFromAbsoluteIndex(idx){
  try{
    idx=parseInt(idx,10);
    if(!(idx>=0) || !SHRINES[idx]) return;
    const item=SHRINES[idx];
    closeAllTabs();
    closeInfoCard();
    _restoreMapMarkers();
    _selectShrineMarker(idx);
    _showInfoCard(item, idx);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _bindPilgrimRegisterDelegation(){
  try{
    if(window.__OAI_PILGRIM_REGISTER_DELEGATION_BOUND__) return;
    window.__OAI_PILGRIM_REGISTER_DELEGATION_BOUND__=true;
    let activeBtn=null, sx=0, sy=0, moved=false;
    document.addEventListener('touchstart', function(e){
      const btn=e.target&&e.target.closest&&e.target.closest('.li-pilgrim-register');
      activeBtn=btn||null; moved=false;
      const t=e.touches&&e.touches[0];
      if(btn&&t){ sx=t.clientX; sy=t.clientY; }
    }, {capture:true, passive:true});
    document.addEventListener('touchmove', function(e){
      if(!activeBtn) return;
      const t=e.touches&&e.touches[0];
      if(t && (Math.abs(t.clientX-sx)>10 || Math.abs(t.clientY-sy)>10)) moved=true;
    }, {capture:true, passive:true});
    document.addEventListener('click', function(e){
      const detailBtn=e.target&&e.target.closest&&e.target.closest('[data-shrine-detail-register]');
      if(detailBtn){
        e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        const idx=parseInt(window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__,10);
        if(idx>=0 && SHRINES[idx]){
          try{ _mode='shrine'; }catch(_e){}
          _openShrineVisitModal(SHRINES[idx]);
        }
        activeBtn=null;
        return;
      }
      const btn=e.target&&e.target.closest&&e.target.closest('.li-pilgrim-register');
      if(!btn) return;
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      if(moved){ moved=false; activeBtn=null; return; }
      const idx=parseInt(btn.getAttribute('data-shrine-idx'),10);
      if(idx>=0 && SHRINES[idx]) _openShrineVisitModal(SHRINES[idx]);
      activeBtn=null;
    }, true);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
_bindPilgrimRegisterDelegation();
function _shrineVisitBadgeHtml(item,context){
  if(_mode!=='shrine'||!item||!_isVisitedShrine(item)) return '';
  const count=_getShrineVisitCount(item);
  const label=context==='compact'?'순례한 성지':'순례한 성지 · '+count+'회';
  return '<span class="shrine-visited-chip">'+label+'</span>';
}
function _isNewShrineItem(item){
  return !!(item && (item.isNew === true || item.addedGroup));
}
function _shrineNewBadgeHtml(item){
  if(_mode!=='shrine'||!_isNewShrineItem(item)) return '';
  return '<span class="shrine-new-chip">신규</span>';
}
function _ensureShrineVisitModal(){
  let modal=document.getElementById('shrine-visit-modal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='shrine-visit-modal';
  modal.className='shrine-visit-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="shrine-visit-backdrop" data-shrine-visit-close="1"></div><div class="shrine-visit-panel" role="dialog" aria-modal="true" aria-label="순례한 성지 등록"><div class="shrine-visit-head"><div><div class="shrine-visit-kicker">순례한 성지</div><div id="shrine-visit-title" class="shrine-visit-title"></div></div><button id="shrine-visit-x" class="shrine-visit-x" type="button" aria-label="닫기">×</button></div><label class="shrine-visit-label">방문 날짜<input id="shrine-visit-date" type="date"></label><div class="shrine-visit-actions"><button id="shrine-visit-save" type="button" class="shrine-visit-save">등록</button><button id="shrine-visit-cancel" type="button" class="shrine-visit-cancel">취소</button></div><div id="shrine-visit-list" class="shrine-visit-list"></div></div>';
  document.body.appendChild(modal);
  function close(){ _closeShrineVisitModal(); }
  modal.querySelectorAll('[data-shrine-visit-close],#shrine-visit-x,#shrine-visit-cancel').forEach(function(el){ el.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); close(); }); });
  const save=modal.querySelector('#shrine-visit-save');
  if(save) save.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    const item=window.__OAI_CURRENT_SHRINE_VISIT_ITEM__;
    const inp=document.getElementById('shrine-visit-date');
    const date=inp&&inp.value?inp.value:_todayISODate();
    if(_hasShrineVisitOnDate(item,date)){ alert('이미 등록된 순례 날짜입니다.'); return; }
    if(!_addShrineVisit(item,date,'manual')){ alert('방문 날짜를 확인해 주세요.'); return; }
    _renderShrineVisitModalList(item);
    if(_curInfoItem&&_curInfoItem.item===item) _renderInfoCardShrineVisit(item);
    try{ if(_activeTab==='list') renderList(); }catch(_e){}
    try{ if(_activeTab==='nearby') _loadNearby(); }catch(_e){}
    _shrineVisitMapFilter='all';
    _refreshShrineVisitMapState();
    try{ _restoreAllShrineMarkersAfterVisitRegistration(item, (_curInfoItem&&_curInfoItem.item===item)?_curInfoItem.idx:-1); }catch(_e){}
    try{ if(_isShrineVisitDetailOpen() && window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__!=null) _renderShrineVisitDetail(window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__); }catch(_e){}
    try{ if(inp) inp.value=_todayISODate(); }catch(_e){}
    try{ _closeShrineVisitModal(); }catch(_e){}
    try{ _openShrineAutoVisitModal({item:item},{method:'manual'}); }catch(_e){}
  });
  return modal;
}

function _isShrineVisitModalOpen(){
  const modal=document.getElementById('shrine-visit-modal');
  return !!(modal && modal.classList.contains('show'));
}
function _pushShrineVisitModalHistory(){
  return;
}
function _openShrineVisitModal(item){
  if(_mode!=='shrine'||!item) return;
  const modal=_ensureShrineVisitModal();
  window.__OAI_CURRENT_SHRINE_VISIT_ITEM__=item;
  const title=document.getElementById('shrine-visit-title');
  const date=document.getElementById('shrine-visit-date');
  if(title) title.textContent=item.name||'성지';
  if(date) date.value=_todayISODate();
  _renderShrineVisitModalList(item);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  _pushShrineVisitModalHistory();
}
function _closeShrineVisitModal(opts){
  opts=opts||{};
  const modal=document.getElementById('shrine-visit-modal');
  const wasOpen=!!(modal&&modal.classList.contains('show'));
  if(modal){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
  window.__OAI_SHRINE_VISIT_MODAL_HISTORY__=false;
  window.__OAI_SHRINE_VISIT_MODAL_CLOSING_BY_CODE__=false;
}


function _renderShrineVisitModalList(item){
  const list=document.getElementById('shrine-visit-list');
  if(!list) return;
  const visits=_getShrineVisitDates(item);
  if(!visits.length){ list.innerHTML='<div class="shrine-visit-empty">아직 등록된 방문 날짜가 없습니다.</div>'; return; }
  list.innerHTML='<div class="shrine-visit-list-title">방문 날짜 '+visits.length+'회</div>'+visits.map(function(v,i){
    const isGps=String(v&&v.method||'').toLowerCase()==='gps';
    const actionHtml=isGps?'<em class="shrine-visit-gps-lock">GPS 등록</em>':'<button type="button" data-visit-del="'+i+'">삭제</button>';
    return '<div class="shrine-visit-date-row'+(isGps?' gps':'')+'"><span>'+_formatVisitDate(v.date)+'</span>'+actionHtml+'</div>';
  }).join('');
  list.querySelectorAll('[data-visit-del]').forEach(function(btn){ btn.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    const idx=parseInt(btn.getAttribute('data-visit-del'),10);
    const target=_getShrineVisitDates(item)[idx];
    if(target && String(target.method||'').toLowerCase()==='gps'){ alert('GPS로 등록된 순례 기록은 삭제할 수 없습니다.'); return; }
    if(confirm('이 방문 날짜를 삭제할까요?')){
      _deleteShrineVisitAt(item,idx);
      _renderShrineVisitModalList(item);
      if(_curInfoItem&&_curInfoItem.item===item) _renderInfoCardShrineVisit(item);
      try{ if(_activeTab==='list') renderList(); }catch(_e){}
      try{ if(_activeTab==='nearby') _loadNearby(); }catch(_e){}
      _refreshShrineVisitMapState();
      try{ if(_isShrineVisitDetailOpen() && window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__!=null) _renderShrineVisitDetail(window.__OAI_CURRENT_SHRINE_VISIT_DETAIL_IDX__); }catch(_e){}
    }
  }); });
}

function _renderInfoCardShrineKind(item){
  const el=$('ic-shrine-kind');
  if(!el) return;
  el.classList.remove('type-shrine','type-martyr','type-pilgrim');
  if(_mode!=='shrine' || !item){
    el.textContent='';
    el.style.display='none';
    return;
  }
  const raw=String(item.type||'성지').replace(/\s+/g,' ').trim();
  let label='성지', cls='type-shrine';
  if(raw==='순교 사적지' || raw==='순교사적지'){ label='순교사적지'; cls='type-martyr'; }
  else if(raw==='순례지'){ label='순례지'; cls='type-pilgrim'; }
  el.textContent=label;
  el.classList.add(cls);
  el.style.display='inline-flex';
}

function _renderInfoCardShrinePilgrimBadge(item){
  const icTypeEl=$('ic-type');
  if(!icTypeEl) return;
  icTypeEl.classList.remove('shrine-pilgrim-visited','shrine-pilgrim-register-badge');
  icTypeEl.removeAttribute('role');
  icTypeEl.removeAttribute('tabindex');
  icTypeEl.onclick=null;
  icTypeEl.onkeydown=null;
  if(_mode==='shrine' && item){
    const open=function(e){
      if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
      _openShrineVisitModal(item);
    };
    if(_isVisitedShrine(item)){
      icTypeEl.textContent='순례한 성지';
      icTypeEl.classList.add('shrine-pilgrim-visited');
      icTypeEl.setAttribute('role','button');
      icTypeEl.setAttribute('tabindex','0');
      icTypeEl.onclick=open;
      icTypeEl.onkeydown=function(e){ if(e && (e.key==='Enter'||e.key===' ')) open(e); };
      return;
    }
    icTypeEl.textContent='순례등록';
    icTypeEl.classList.add('shrine-pilgrim-register-badge');
    icTypeEl.setAttribute('role','button');
    icTypeEl.setAttribute('tabindex','0');
    icTypeEl.onclick=open;
    icTypeEl.onkeydown=function(e){ if(e && (e.key==='Enter'||e.key===' ')) open(e); };
  }else if(item){
    icTypeEl.textContent = _mode==='retreat' ? '피정의 집' : '성당';
  }
}

function _renderInfoCardShrineVisit(item){
  _renderInfoCardShrinePilgrimBadge(item);
  const box=document.getElementById('ic-shrine-visit');
  if(box){ box.style.display='none'; box.innerHTML=''; }
  if(_mode==='parish' && typeof _renderInfoCardParishVisit==='function') _renderInfoCardParishVisit(item);
}

/* V8-1-14-751: 성당 방문 기록. 성지 순례와 저장소 및 화면을 분리한다. */
const OAI_PARISH_VISITS_KEY='oai_parish_visits_v1';
const OAI_PARISH_AUTO_VISIT_ENABLED_KEY='oai_parish_auto_visit_enabled_v1';
let _parishVisitTab='visited',_parishVisitDio='all',_parishVisitSort='recent',_parishUnvisitedLimit=80;
function _isMyParishAutoVisitEnabled(){try{return localStorage.getItem(OAI_PARISH_AUTO_VISIT_ENABLED_KEY)!=='0';}catch(_e){return true;}}
function _setParishAutoVisitEnabled(enabled){try{localStorage.setItem(OAI_PARISH_AUTO_VISIT_ENABLED_KEY,enabled?'1':'0');}catch(_e){}}
function _configuredMyParish(){
  const dio=typeof _getMyDioceseName==='function'?_getMyDioceseName():'';
  const keys=['oai_my_parish_name','oai_my_parish','my_parish_name','my_parish','oai_my_church_name','oai_my_church'];let values=[];
  try{keys.forEach(function(k){const v=localStorage.getItem(k);if(v)values.push(String(v).trim());});for(let i=0;i<localStorage.length;i++){const k=String(localStorage.key(i)||'');if(/(?:my.*(?:parish|church|faith)|(?:parish|church).*(?:my|setting)|본당)/i.test(k)){const v=localStorage.getItem(k);if(v)values.push(String(v).trim());}}}catch(_e){}
  values=values.filter(Boolean);const panel=document.getElementById('my-diocese-list');if(panel)values.push(panel.textContent||'');
  return (PARISHES||[]).find(function(p){if(!p||!p.name||(dio&&p.diocese!==dio))return false;return values.some(function(v){if(v===p.name)return true;try{const o=JSON.parse(v);return o&&typeof o==='object'&&[o.name,o.parish,o.parishName,o.church,o.churchName].some(function(n){return String(n||'').trim()===p.name;});}catch(_e){return false;}});})||null;
}
function _isSameParish(a,b){return !!(a&&b&&String(a.diocese||'')===String(b.diocese||'')&&String(a.name||'')===String(b.name||''));}
function _parishVisitKey(p){return p?[String(p.diocese||''),String(p.name||''),String(p.addr||'')].join('|'):'';}
function _loadParishVisits(){try{const v=localStorage.getItem(OAI_PARISH_VISITS_KEY);const d=v?JSON.parse(v):{};return d&&typeof d==='object'?d:{}}catch(_e){return {}}}
function _saveParishVisits(d){try{localStorage.setItem(OAI_PARISH_VISITS_KEY,JSON.stringify(d||{}))}catch(_e){}}
function _parishVisits(p){const r=_loadParishVisits()[_parishVisitKey(p)]||{},a=Array.isArray(r.visits)?r.visits:[];return a.map(function(v){return typeof v==='string'?{date:v,method:'manual'}:v;}).filter(function(v){return v&&v.date;}).sort(_compareShrineVisits);}
function _parishVisitCount(p){return _parishVisits(p).length;}
function _addParishVisit(p,date,method){const key=_parishVisitKey(p);if(!key||!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return false;const d=_loadParishVisits(),r=d[key]&&typeof d[key]==='object'?d[key]:{name:p.name||'',diocese:p.diocese||'',addr:p.addr||'',visits:[]};r.visits=Array.isArray(r.visits)?r.visits:[];if(r.visits.some(function(v){return String((typeof v==='string'?v:v&&v.date)||'')===String(date)}))return false;r.visits.push({date:String(date),method:method||'manual',savedAt:new Date().toISOString()});r.visits.sort(_compareShrineVisits);d[key]=r;_saveParishVisits(d);return true;}
function _deleteParishVisit(p,i){const key=_parishVisitKey(p),d=_loadParishVisits(),r=d[key];if(!r||!Array.isArray(r.visits)||i<0||i>=r.visits.length||String(r.visits[i].method||'')==='gps')return false;r.visits.splice(i,1);if(r.visits.length)d[key]=r;else delete d[key];_saveParishVisits(d);return true;}
function _parishEntries(){const a=[];(PARISHES||[]).forEach(function(p,i){if(!p||p.diocese==='군종교구')return;const v=_parishVisits(p);if(v.length)a.push({p:p,i:i,v:v,n:v.length});});return a.sort(function(a,b){return _compareShrineVisits(a.v[0],b.v[0])||String(a.p.name).localeCompare(String(b.p.name),'ko')});}
function _parishUnvisitedEntries(){const saved=_loadParishVisits();return (PARISHES||[]).map(function(p,i){const r=saved[_parishVisitKey(p)],v=r&&Array.isArray(r.visits)?r.visits:[];return {p:p,i:i,v:v};}).filter(function(x){return x.p&&x.p.diocese!=='군종교구'&&!x.v.length;}).sort(function(a,b){return String(a.p.name||'').localeCompare(String(b.p.name||''),'ko');});}
function _parishDios(){const s={};(PARISHES||[]).forEach(function(p){if(p&&p.diocese&&p.diocese!=='군종교구')s[p.diocese]=1;});const ordered=(typeof _DIOS!=='undefined'?_DIOS:[]).slice(1).map(function(x){return x[0]}).filter(function(d){return !!s[d]});const extra=Object.keys(s).filter(function(d){return ordered.indexOf(d)<0}).sort(function(a,b){return a.localeCompare(b,'ko')});return ordered.concat(extra);}
/* 성당 방문 스탬프는 해당 성당이 지도에서 쓰는 교구 마커 색을 따른다. */
function _parishVisitMarkerColor(p){const code=typeof _parishDioCodeOf==='function'?_parishDioCodeOf(p):'';const cfg=typeof _DIO_CFG!=='undefined'&&_DIO_CFG[code];return cfg&&cfg.c?cfg.c:'#1A5276';}
function _parishVisitPickerButton(kind,label,disabled){return kind==='sort'?_oaiVisitPickerButton('parish-sort',_parishVisitSort==='oldest'?'오래된순':'최근순','날짜별 정렬',disabled):_oaiVisitPickerButton('',label,'',true);}
function _parishVisitDioceseField(){const label=_parishVisitDio==='all'?'전체':_parishVisitDio;return '<label class="shrine-visit-filter-field oai-parish-dio-filter"><span>교구별</span>'+_oaiVisitPickerButton('parish-dio',label,'교구별 선택')+'</label>';}
function _parishVisitSettingsMini(){return '<button type="button" class="oai-parish-settings-mini" data-pv-settings="1" aria-label="나의 본당 자동 방문 기록 설정"><small>설정</small><b aria-hidden="true">⚙</b></button>';}
function _ensureParishAutoVisitSettingsDialog(){
  const book=document.getElementById('parish-visit-book');if(!book)return null;
  let dialog=book.querySelector('#oai-parish-auto-visit-dialog');
  if(!dialog){
    dialog=document.createElement('div');dialog.id='oai-parish-auto-visit-dialog';dialog.className='oai-parish-auto-visit-dialog';dialog.setAttribute('aria-hidden','true');
    dialog.innerHTML='<div class="oai-parish-auto-visit-dialog-backdrop" data-pv-settings-close="1"></div><section class="oai-parish-auto-visit-dialog-panel" role="dialog" aria-modal="true" aria-label="나의 본당 자동 방문 기록 설정"><div class="oai-parish-auto-visit-dialog-head"><strong>방문 기록 설정</strong><button type="button" data-pv-settings-close="1" aria-label="닫기">×</button></div><div class="oai-parish-auto-visit-dialog-body"><strong id="oai-parish-auto-visit-title">나의 본당 자동 방문 기록</strong><p id="oai-parish-auto-visit-description"></p><label class="oai-parish-auto-visit-switch"><input type="checkbox" role="switch" aria-label="나의 본당 자동 방문 기록"><span aria-hidden="true"></span></label></div><button type="button" class="oai-parish-auto-visit-dialog-confirm" data-pv-settings-close="1">확인</button></section>';
    book.appendChild(dialog);
    const input=dialog.querySelector('input');if(input)input.addEventListener('change',function(){_setParishAutoVisitEnabled(!!input.checked);});
  }
  const myParish=_configuredMyParish(),input=dialog.querySelector('input'),title=dialog.querySelector('#oai-parish-auto-visit-title'),description=dialog.querySelector('#oai-parish-auto-visit-description');
  if(myParish){if(title)title.textContent=myParish.name+' 자동 방문 기록';if(description)description.textContent='매주 다니는 '+myParish.name+'은 첫 방문만 자동 기록합니다.';if(input){input.disabled=false;input.checked=_isMyParishAutoVisitEnabled();input.setAttribute('aria-label',myParish.name+' 자동 방문 기록');}}
  else{if(title)title.textContent='나의 본당 자동 방문 기록';if(description)description.textContent='나의 신앙생활에서 본당을 먼저 설정해 주세요.';if(input){input.disabled=true;input.checked=false;}}
  return dialog;
}
function _openParishAutoVisitSettings(){const dialog=_ensureParishAutoVisitSettingsDialog();if(!dialog)return;_closeOaiVisitPicker();dialog.classList.add('show');dialog.setAttribute('aria-hidden','false');}
function _closeParishAutoVisitSettings(){const dialog=document.getElementById('oai-parish-auto-visit-dialog');if(dialog){dialog.classList.remove('show');dialog.setAttribute('aria-hidden','true');}}
function _ensureParishVisitButton(){
  let layer=document.getElementById('parish-visit-action-layer');
  if(!layer){layer=document.createElement('div');layer.id='parish-visit-action-layer';layer.setAttribute('aria-hidden','true');layer.innerHTML='<button id="parish-visit-floating-list-btn" type="button" class="shrine-visit-floating-list-btn" aria-label="내가 방문한 성당 열기">내가 방문한 성당</button>';}
  /* 성지 현황 버튼과 동일하게 map-wrap이 아니라 앱 고정 레이어에 둔다.
     기존 CSS의 surface-map 위치 규칙을 그대로 사용해야 지도 위에 표시된다. */
  layer.className='shrine-visit-action-layer surface-map';layer.dataset.surface='map';
  const host=document.getElementById('app')||document.body;if(host&&layer.parentNode!==host)host.appendChild(layer);
  const b=document.getElementById('parish-visit-floating-list-btn');if(b&&!b.__bound){b.__bound=true;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();_openParishVisitBook();});}return layer;
}
function _parishVisitBookOpen(){const m=document.getElementById('parish-visit-book');return !!(m&&m.classList.contains('show'));}
function _updateParishVisitButton(){const layer=_ensureParishVisitButton();if(!layer)return;const btn=document.getElementById('parish-visit-floating-list-btn'),info=document.getElementById('info-card'),route=document.getElementById('sheet-route');const blocked=(info&&info.classList.contains('open'))||(route&&route.classList.contains('open'))||_parishVisitBookOpen()||!!document.querySelector('#parish-visit-editor.show');const show=_mode==='parish'&&_screen==='map'&&!blocked;layer.classList.toggle('show',show);layer.setAttribute('aria-hidden',show?'false':'true');if(btn)btn.classList.toggle('show',show);}
function _ensureParishVisitBook(){
  let m=document.getElementById('parish-visit-book');if(m)return m;m=document.createElement('div');m.id='parish-visit-book';m.className='shrine-visit-cards-modal parish-visit-book';m.setAttribute('aria-hidden','true');
  m.innerHTML='<div class="shrine-visit-cards-backdrop" data-pv-close="1"></div><div class="shrine-visit-cards-panel" role="dialog" aria-modal="true" aria-label="성당 방문 기록"><div class="module-bar shrine-visit-cards-head"><div class="module-bar-main"><div class="module-bar-ico">✝</div><div class="module-bar-txt"><div class="module-bar-title">성당 방문 스탬프북</div><div class="module-bar-sub">나의 성당 방문 기록</div></div></div><button class="module-close" type="button" data-pv-close="1" aria-label="닫기">×</button></div><div class="shrine-visit-cards-tabs"><button type="button" data-pv-tab="visited">방문한 성당</button><button type="button" data-pv-tab="unvisited">미방문 성당</button><button type="button" data-pv-tab="stats">통계</button></div><div id="pv-filters" class="shrine-visit-cards-filters"></div><div id="pv-summary" class="shrine-visit-cards-stats"></div><div id="pv-body" class="shrine-visit-cards-body"></div></div>';
  document.body.appendChild(m);m.addEventListener('click',function(e){const t=e.target.closest&&e.target.closest('[data-pv-close],[data-pv-tab],[data-pv-card],[data-pv-more],[data-oai-visit-picker],[data-pv-settings],[data-pv-settings-close]');if(!t)return;if(t.hasAttribute('data-pv-settings-close')){_closeParishAutoVisitSettings();return;}if(t.hasAttribute('data-pv-settings')){_openParishAutoVisitSettings();return;}if(t.hasAttribute('data-oai-visit-picker')){_openOaiVisitPicker(t.getAttribute('data-oai-visit-picker')||'');return;}if(t.hasAttribute('data-pv-close')){_closeParishVisitBook();return;}if(t.hasAttribute('data-pv-tab')){const tab=t.getAttribute('data-pv-tab');_parishVisitTab=tab==='stats'?'stats':tab==='unvisited'?'unvisited':'visited';_parishUnvisitedLimit=80;_renderParishVisitBook();return;}if(t.hasAttribute('data-pv-more')){_parishUnvisitedLimit+=80;_renderParishVisitBook();return;}const p=PARISHES[parseInt(t.getAttribute('data-pv-card'),10)];if(p)_openParishVisitDetail(p);});return m;
}
function _renderParishVisitBook(){
 const m=document.getElementById('parish-visit-book'),f=document.getElementById('pv-filters'),s=document.getElementById('pv-summary'),b=document.getElementById('pv-body');if(!m||!b)return;_closeOaiVisitPicker();const all=_parishEntries(),total=(PARISHES||[]).filter(function(p){return p&&p.diocese!=='군종교구'}).length;
 m.querySelectorAll('[data-pv-tab]').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-pv-tab')===_parishVisitTab)});
 if(_parishVisitTab==='stats'){f.classList.add('show');s.classList.add('stats-tab-hidden');f.innerHTML='<label class="shrine-visit-filter-field"><span>통계 기준</span>'+_parishVisitPickerButton('','교구별',true)+'</label>'+_parishVisitDioceseField()+_parishVisitSettingsMini();const rows=_parishDios().map(function(d){const t=(PARISHES||[]).filter(function(p){return p&&p.diocese===d}).length,v=all.filter(function(x){return x.p.diocese===d}).length;return {d:d,t:t,v:v}}).filter(function(r){return r.t}).sort(function(a,b){return b.v/b.t-a.v/a.t||b.v-a.v});const scoped=_parishVisitDio==='all'?rows:rows.filter(function(r){return r.d===_parishVisitDio});const scopeTotal=scoped.reduce(function(n,r){return n+r.t;},0),scopeVisited=scoped.reduce(function(n,r){return n+r.v;},0),scopeName=_parishVisitDio==='all'?'전체':_parishVisitDio;b.innerHTML='<div class="shrine-visit-stats-view"><section class="shrine-visit-stat-total"><div class="shrine-visit-stat-kicker">'+_visitHtmlEsc(scopeName)+' 성당 방문 현황</div><strong>'+scopeVisited+'곳 방문 / '+scopeTotal+'곳</strong><span>'+(scopeTotal?Math.round(scopeVisited/scopeTotal*100):0)+'% 방문</span></section><section class="shrine-visit-stat-list"><div class="shrine-visit-stat-kicker">'+(_parishVisitDio==='all'?'교구별 성당 방문 현황':_visitHtmlEsc(scopeName)+' 성당 방문 현황')+'</div>'+scoped.map(function(r){return '<div class="shrine-visit-stat-row"><span class="shrine-visit-stat-name">'+_visitHtmlEsc(r.d)+'</span><strong>'+r.v+' / '+r.t+'</strong><em>'+Math.round(r.v/r.t*100)+'%</em></div>'}).join('')+'</section></div>';return;}
 if(_parishVisitTab==='unvisited'){f.classList.add('show');s.classList.remove('stats-tab-hidden');f.innerHTML='<label class="shrine-visit-filter-field"><span>정렬</span>'+_parishVisitPickerButton('','가나다순',true)+'</label>'+_parishVisitDioceseField()+_parishVisitSettingsMini();const scopeTotal=_parishVisitDio==='all'?total:(PARISHES||[]).filter(function(p){return p&&p.diocese===_parishVisitDio}).length;const unseen=_parishUnvisitedEntries().filter(function(x){return _parishVisitDio==='all'||x.p.diocese===_parishVisitDio});s.innerHTML='<strong>'+unseen.length+'곳 미방문</strong><span>/ '+scopeTotal+'곳</span><b>ㅣ</b><span>'+(scopeTotal?Math.round(unseen.length/scopeTotal*100):0)+'% 미방문</span>';const shown=unseen.slice(0,_parishUnvisitedLimit);b.innerHTML='<div class="shrine-visit-card-grid">'+shown.map(function(x){const color=_parishVisitMarkerColor(x.p);return '<button type="button" class="shrine-visit-card-badge shrine-visit-card-unified unvisited type-parish" data-pv-card="'+x.i+'" style="--visit-card-accent:'+_visitHtmlEsc(color)+'"><span class="shrine-visit-card-stamp">성당</span><span class="shrine-visit-card-dio">'+_visitHtmlEsc(x.p.diocese||'')+'</span><strong>'+_visitHtmlEsc(x.p.name||'')+'</strong><span class="shrine-visit-card-count">미방문</span></button>'}).join('')+'</div>'+(unseen.length>shown.length?'<button type="button" class="shrine-visit-load-more" data-pv-more>더 보기 ('+(unseen.length-shown.length)+'곳)</button>':'');return;}
 f.classList.add('show');s.classList.remove('stats-tab-hidden');f.innerHTML='<label class="shrine-visit-filter-field"><span>날짜별</span>'+_parishVisitPickerButton('sort',_parishVisitSort==='oldest'?'오래된순':'최근순')+'</label>'+_parishVisitDioceseField()+_parishVisitSettingsMini();
 let a=all.filter(function(x){return _parishVisitDio==='all'||x.p.diocese===_parishVisitDio});const scopeTotal=_parishVisitDio==='all'?total:(PARISHES||[]).filter(function(p){return p&&p.diocese===_parishVisitDio}).length;if(_parishVisitSort==='oldest')a.sort(function(x,y){return _compareShrineVisitsOldest(x.v[0],y.v[0])});s.innerHTML='<strong>'+a.length+'곳 방문</strong><span>/ '+scopeTotal+'곳</span><b>ㅣ</b><span>'+(scopeTotal?Math.round(a.length/scopeTotal*100):0)+'% 방문</span>';
 b.innerHTML=a.length?'<div class="shrine-visit-card-grid">'+a.map(function(x){const color=_parishVisitMarkerColor(x.p);return '<button type="button" class="shrine-visit-card-badge shrine-visit-card-unified visited type-parish" data-pv-card="'+x.i+'" style="--visit-card-accent:'+_visitHtmlEsc(color)+'"><span class="shrine-visit-card-stamp">성당</span><span class="shrine-visit-card-dio">'+_visitHtmlEsc(x.p.diocese||'')+'</span><strong>'+_visitHtmlEsc(x.p.name||'')+'</strong><span class="shrine-visit-card-count">방문 '+x.n+'회</span><span class="parish-visit-card-seal" aria-hidden="true"><i>방문</i></span></button>'}).join('')+'</div>':'<div class="shrine-visit-cards-empty">아직 방문 등록한 성당이 없습니다.</div>';
}
function _openParishVisitBook(){
  if(_mode!=='parish')return;
  _closeOaiVisitPicker();
  _parishVisitTab='visited';_parishVisitDio='all';_parishVisitSort='recent';
  const m=_ensureParishVisitBook();m.classList.add('show');m.setAttribute('aria-hidden','false');
  const body=document.getElementById('pv-body');if(body)body.innerHTML='<div class="shrine-visit-cards-empty">전국 성당 정보를 불러오는 중입니다.</div>';
  _updateParishVisitButton();
  /* 지도는 선택 교구만 가볍게 읽지만, 방문 기록은 전국 교구 전체를 기준으로 보여준다. */
  _ensureAllParishDiocesesLoaded({silent:true}).then(function(){
    if(_parishVisitBookOpen()) _renderParishVisitBook();
  }).catch(function(err){
    console.warn('[가톨릭길동무] 성당 방문 기록용 전국 데이터 로드 실패',err);
    if(body&&_parishVisitBookOpen())body.innerHTML='<div class="shrine-visit-cards-empty">성당 정보를 불러오지 못했습니다. 잠시 후 다시 열어 주세요.</div>';
  });
}
function _closeParishVisitBook(){
  _closeOaiVisitPicker();
  _closeParishAutoVisitSettings();
  const m=document.getElementById('parish-visit-book');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');}
  _updateParishVisitButton();
}
function _ensureParishVisitDetail(){
  let v=document.getElementById('parish-visit-detail');if(v)return v;
  v=document.createElement('div');v.id='parish-visit-detail';v.className='shrine-visit-detail-view parish-visit-detail';v.setAttribute('aria-hidden','true');
  v.innerHTML='<div class="shrine-visit-detail-head"><div class="shrine-visit-detail-head-title">방문한 성당</div><button type="button" class="shrine-visit-detail-x" data-pvd-close="1" aria-label="닫기">×</button></div><div id="parish-visit-detail-body" class="shrine-visit-detail-body"></div>';
  document.body.appendChild(v);v.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('[data-pvd-close]')){_closeParishVisitDetail();return;}
    const register=e.target.closest&&e.target.closest('[data-pvd-register]');if(register&&window.__OAI_PV_DETAIL_ITEM__)_openParishVisitEditor(window.__OAI_PV_DETAIL_ITEM__);
    const map=e.target.closest&&e.target.closest('[data-pvd-map]');if(map&&window.__OAI_PV_DETAIL_ITEM__){const p=window.__OAI_PV_DETAIL_ITEM__,i=_findCurrentParishIndex(p);_closeParishVisitDetail({fromPopstate:true,noResume:true});if(i>=0){closeInfoCard({keepMap:true});_selectParishMarker(p);_showInfoCard(p,i);}}
  });return v;
}
function _renderParishVisitDetail(){
  const p=window.__OAI_PV_DETAIL_ITEM__,b=document.getElementById('parish-visit-detail-body');if(!p||!b)return;
  const visits=_parishVisits(p),n=visits.length,recent=n?_formatVisitDate(visits[0].date):'—';
  const dates=visits.length?visits.map(function(v){return '<span class="shrine-visit-detail-date-chip">'+_visitHtmlEsc(_formatVisitDate(v.date))+'</span>';}).join(''):'<span class="shrine-visit-detail-empty-date">아직 등록된 방문 날짜가 없습니다.</span>';
  const tel=p.tel?'<a class="shrine-visit-detail-action detail-tel" href="tel:'+_visitHtmlEsc(String(p.tel).replace(/[^0-9+]/g,''))+'">📞 '+_visitHtmlEsc(p.tel)+'</a>':'';
  const hp=p.hp?'<a class="shrine-visit-detail-action detail-home" href="'+_visitHtmlEsc(p.hp)+'" target="_blank" rel="noopener">홈페이지</a>':'';
  const guide=p.url?'<a class="shrine-visit-detail-action detail-guide" href="'+_visitHtmlEsc(p.url)+'" target="_blank" rel="noopener">교구 성당 안내</a>':'';
  b.innerHTML='<section class="shrine-visit-detail-hero"><div class="shrine-visit-detail-hero-head"><div class="shrine-visit-detail-kicker">성당 방문 기록</div><button type="button" class="shrine-visit-detail-register" data-pvd-register="1">방문등록</button></div><div class="shrine-visit-detail-count">방문 '+n+'회</div><div class="shrine-visit-detail-recent">최근 방문일 '+_visitHtmlEsc(recent)+'</div><div class="shrine-visit-detail-date-title">방문 날짜</div><div class="shrine-visit-detail-date-list">'+dates+'</div></section><section class="shrine-visit-detail-info"><div class="shrine-visit-detail-info-head"><div class="shrine-visit-detail-section-title">성당 정보</div><button type="button" class="shrine-visit-detail-map-btn" data-pvd-map="1">지도에서 보기</button></div><div class="shrine-visit-detail-name">'+_visitHtmlEsc(p.name||'')+'</div><div class="shrine-visit-detail-row"><span>교구</span><strong>'+_visitHtmlEsc(p.diocese||'—')+'</strong></div><div class="shrine-visit-detail-row"><span>주소</span><strong>'+_visitHtmlEsc(p.addr||'—')+'</strong></div><div class="shrine-visit-detail-actions">'+tel+hp+guide+'</div></section>';
}
function _openParishVisitDetail(p){
  _closeOaiVisitPicker();
  const book=document.getElementById('parish-visit-book');if(book){book.classList.remove('show');book.setAttribute('aria-hidden','true');}
  const v=_ensureParishVisitDetail();window.__OAI_PV_DETAIL_ITEM__=p;window.__OAI_PV_DETAIL_FROM_BOOK__=true;_renderParishVisitDetail();v.classList.add('show');v.setAttribute('aria-hidden','false');
}
function _closeParishVisitDetail(opts){
  opts=opts||{};
  /* 상세의 X와 뒤로가기는 방문 목록으로 돌아간다. */
  const v=document.getElementById('parish-visit-detail');if(v){v.classList.remove('show');v.setAttribute('aria-hidden','true');}
  if(window.__OAI_PV_DETAIL_FROM_BOOK__&&!opts.noResume){
    const book=_ensureParishVisitBook();_renderParishVisitBook();book.classList.add('show');book.setAttribute('aria-hidden','false');
  }
  window.__OAI_PV_DETAIL_FROM_BOOK__=false;_updateParishVisitButton();
}
function _ensureParishVisitEditor(){let m=document.getElementById('parish-visit-editor');if(m)return m;m=document.createElement('div');m.id='parish-visit-editor';m.className='shrine-visit-modal';m.innerHTML='<div class="shrine-visit-backdrop" data-pve-close="1"></div><div class="shrine-visit-panel"><div class="shrine-visit-head"><div><div class="shrine-visit-kicker">방문한 성당</div><div id="pve-title" class="shrine-visit-title"></div></div><button type="button" class="shrine-visit-x" data-pve-close="1">×</button></div><label class="shrine-visit-label">방문 날짜<input id="pve-date" type="date"></label><div class="shrine-visit-actions"><button id="pve-save" type="button" class="shrine-visit-save">등록</button><button type="button" class="shrine-visit-cancel" data-pve-close="1">취소</button></div><div id="pve-list" class="shrine-visit-list"></div></div>';document.body.appendChild(m);m.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-pve-close]')){_closeParishVisitEditor();return;}const d=e.target.closest&&e.target.closest('[data-pve-del]');if(d&&window.__OAI_PV_ITEM__){_deleteParishVisit(window.__OAI_PV_ITEM__,parseInt(d.getAttribute('data-pve-del'),10));_renderParishVisitEditor();_renderParishVisitBook();_renderInfoCardParishVisit(window.__OAI_PV_ITEM__);}});m.querySelector('#pve-save').addEventListener('click',function(){const p=window.__OAI_PV_ITEM__,date=document.getElementById('pve-date').value;if(p&&_addParishVisit(p,date,'manual')){_renderParishVisitEditor();_renderParishVisitBook();_renderInfoCardParishVisit(p);}});return m;}
function _renderParishVisitEditor(){const p=window.__OAI_PV_ITEM__,l=document.getElementById('pve-list');if(!p||!l)return;const a=_parishVisits(p);l.innerHTML=a.length?'<div class="shrine-visit-list-title">방문 날짜 '+a.length+'회</div>'+a.map(function(v,i){return '<div class="shrine-visit-date-row'+(v.method==='gps'?' gps':'')+'"><span>'+_formatVisitDate(v.date)+'</span>'+(v.method==='gps'?'<em class="shrine-visit-gps-lock">GPS 등록</em>':'<button type="button" data-pve-del="'+i+'">삭제</button>')+'</div>'}).join(''):'<div class="shrine-visit-empty">아직 등록된 방문 날짜가 없습니다.</div>';}
function _openParishVisitEditor(p){const m=_ensureParishVisitEditor();window.__OAI_PV_ITEM__=p;document.getElementById('pve-title').textContent=p.name||'';document.getElementById('pve-date').value=_todayISODate();_renderParishVisitEditor();m.classList.add('show');_updateParishVisitButton();}
function _closeParishVisitEditor(opts){
  opts=opts||{};
  /* 방문등록은 지도 인포카드 위 보조 창이므로 닫으면 인포카드가 남는다. */
  const m=document.getElementById('parish-visit-editor');if(m)m.classList.remove('show');
  _updateParishVisitButton();
}
function _renderInfoCardParishVisit(p){const b=document.getElementById('ic-type');if(!b||_mode!=='parish')return;const n=_parishVisitCount(p);b.textContent=n?'방문 '+n+'회':'방문등록';b.classList.add('shrine-pilgrim-register-badge');b.setAttribute('role','button');b.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}_openParishVisitEditor(p)};}
function _maybeAutoParishVisit(lat,lng){
  if(_mode!=='parish'||!lat||!lng)return;let best=null,bestM=Infinity;
  (PARISHES||[]).forEach(function(p){if(!p||p.diocese==='군종교구'||!p.lat||!p.lng)return;const m=calcDist(lat,lng,p.lat,p.lng)*1000;if(m<=150&&m<bestM){best=p;bestM=m;}});
  if(!best)return;const myParish=_configuredMyParish(),isMyParish=_isSameParish(best,myParish),previousVisits=_parishVisits(best);
  if(isMyParish){if(!_isMyParishAutoVisitEnabled()||previousVisits.length)return;}else if(previousVisits.some(function(v){return v.date===_todayISODate();}))return;
  if(!_addParishVisit(best,_todayISODate(),'gps'))return;
  let m=document.getElementById('parish-auto-visit-notice');if(!m){m=document.createElement('div');m.id='parish-auto-visit-notice';m.className='shrine-auto-visit-modal';m.innerHTML='<div class="shrine-auto-visit-backdrop"></div><div class="shrine-auto-visit-panel" role="dialog" aria-modal="true"><div class="shrine-auto-visit-kicker">GPS 자동 방문등록</div><div id="parish-auto-visit-title" class="shrine-auto-visit-title"></div><div class="shrine-auto-visit-actions"><button type="button" class="shrine-auto-visit-save">확인</button></div></div>';document.body.appendChild(m);m.querySelector('button').addEventListener('click',function(){m.classList.remove('show');});}
  document.getElementById('parish-auto-visit-title').textContent='축하합니다. '+best.name+' 방문이 등록되었습니다.';m.classList.add('show');if(_curInfoItem&&_curInfoItem.item===best)_renderInfoCardParishVisit(best);
}
try{setInterval(function(){_updateParishVisitButton();},400);}catch(_e){}
try{document.addEventListener('change',function(e){const t=e.target;if(!t||!t.matches||!t.matches('#parish-visit-book [data-pv-select]'))return;const kind=t.getAttribute('data-pv-select'),value=t.value;if(kind==='sort')_parishVisitSort=value==='oldest'?'oldest':'recent';else if(kind==='dio'){_parishVisitDio=value||'all';_parishUnvisitedLimit=80;}_renderParishVisitBook();});}catch(_e){}
try{window.addEventListener('oai-short-background-return',function(){setTimeout(function(){_updateParishVisitButton();},120);},{passive:true});}catch(_e){}

function _setMassQuickReturn(on){
  try{
    window.__MASS_QUICK_RETURN__ = !!on;
    if(on){
      var stamp = String(Date.now());
      sessionStorage.setItem('oai_mass_quick_return','1');
      sessionStorage.setItem('oai_mass_quick_return_ts', stamp);
      /* V8-1-14-621: 매일미사/성가/성경 배너 복귀 상태는 장기 보존하지 않고 세션 안에서만 유지한다. */
      try{ localStorage.removeItem('oai_mass_quick_return'); localStorage.removeItem('oai_mass_quick_return_ts'); }catch(_e){}
    }else{
      sessionStorage.removeItem('oai_mass_quick_return');
      sessionStorage.removeItem('oai_mass_quick_return_ts');
      localStorage.removeItem('oai_mass_quick_return');
      localStorage.removeItem('oai_mass_quick_return_ts');
    }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _setPrayerQuickReturn(on){
  try{
    window.__MASS_QUICK_FROM_PRAYER__ = !!on;
    window.__OAI_PRAYER_FROM_QUICK_LOCK__ = !!on;
    if(on){
      var stamp = String(Date.now());
      sessionStorage.setItem('oai_prayer_quick_return','1');
      sessionStorage.setItem('oai_prayer_quick_return_ts', stamp);
      sessionStorage.setItem('oai_prayer_from_quick_lock','1');
    }else{
      sessionStorage.removeItem('oai_prayer_quick_return');
      sessionStorage.removeItem('oai_prayer_quick_return_ts');
      sessionStorage.removeItem('oai_prayer_from_quick_lock');
    }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _clearPrayerQuickReturn(){ _setPrayerQuickReturn(false); }
function _setFaithReturnTarget(target){
  try{
    target = target || '';
    window.__OAI_FAITH_RETURN_TARGET__ = target;
    if(target) sessionStorage.setItem('oai_faith_return_target', target);
    else sessionStorage.removeItem('oai_faith_return_target');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _getFaithReturnTarget(){
  try{ return window.__OAI_FAITH_RETURN_TARGET__ || sessionStorage.getItem('oai_faith_return_target') || ''; }
  catch(e){ return window.__OAI_FAITH_RETURN_TARGET__ || ''; }
}
function _clearFaithReturnTarget(){ _setFaithReturnTarget(''); }
function _shouldFaithReturnToMassQuick(){
  try{
    return _getFaithReturnTarget() === 'massQuick' ||
      (typeof _shouldMassQuickReturn === 'function' && _shouldMassQuickReturn()) ||
      (typeof _shouldPrayerQuickReturn === 'function' && _shouldPrayerQuickReturn()) ||
      (typeof _isPrayerPopupReturnSource === 'function' && _isPrayerPopupReturnSource());
  }catch(e){ console.warn('[가톨릭길동무]', e); return _getFaithReturnTarget() === 'massQuick'; }
}
function _isFreshMassQuickReturnStore(store){
  try{
    if(!store || store.getItem('oai_mass_quick_return') !== '1') return false;
    var ts = parseInt(store.getItem('oai_mass_quick_return_ts') || '0', 10) || 0;
    if(!ts) return true;
    return Date.now() - ts < 5 * 60 * 1000;
  }catch(e){ return false; }
}
function _isFreshPrayerQuickReturn(){
  try{
    if(sessionStorage.getItem('oai_prayer_quick_return') !== '1') return false;
    var ts = parseInt(sessionStorage.getItem('oai_prayer_quick_return_ts') || '0', 10) || 0;
    if(!ts) return true;
    return Date.now() - ts < 30 * 60 * 1000;
  }catch(e){ return false; }
}
function _shouldMassQuickReturn(){
  try{
    return window.__MASS_QUICK_RETURN__ === true ||
      _isFreshMassQuickReturnStore(sessionStorage);
  }catch(e){ console.warn("[가톨릭길동무]", e); return window.__MASS_QUICK_RETURN__ === true; }
}
function _shouldPrayerQuickReturn(){
  try{
    return window.__MASS_QUICK_FROM_PRAYER__ === true ||
      window.__OAI_PRAYER_FROM_QUICK_LOCK__ === true ||
      sessionStorage.getItem('oai_prayer_from_quick_lock') === '1' ||
      _isFreshPrayerQuickReturn();
  }catch(e){ console.warn("[가톨릭길동무]", e); return window.__MASS_QUICK_FROM_PRAYER__ === true || window.__OAI_PRAYER_FROM_QUICK_LOCK__ === true; }
}
function _isPageReloadNavigation(){
  try{
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation');
    if(nav && nav[0] && nav[0].type === 'reload') return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ return performance.navigation && performance.navigation.type === 1; }
  catch(e){ return false; }
}
function _isFreshTopLevelNavigation(){
  try{
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation');
    if(nav && nav[0] && nav[0].type === 'navigate') return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ return performance.navigation && performance.navigation.type === 0; }
  catch(e){ return false; }
}
function _clearMassQuickReturnForReload(){
  try{
    window.__MASS_QUICK_RETURN__ = false;
    sessionStorage.removeItem('oai_mass_quick_return');
    sessionStorage.removeItem('oai_mass_quick_return_ts');
    localStorage.removeItem('oai_mass_quick_return');
    localStorage.removeItem('oai_mass_quick_return_ts');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
if(_isPageReloadNavigation() || _isFreshTopLevelNavigation()){
  _clearMassQuickReturnForReload();
  _clearPrayerQuickReturn();
  try{ _clearFaithReturnTarget(); }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _resetCoverExitReady(){
  try{
    window._exitReady = false;
    clearTimeout(window._exitTimer);
    const bt = document.getElementById('_bt');
    if(bt) bt.remove();
    const toast = document.getElementById('oai-cover-exit-toast');
    if(toast) toast.classList.remove('show');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _clearCoverExitArmed(){
  try{
    window.__oaiCoverExitUntil = 0;
    sessionStorage.removeItem('oai_cover_exit_armed_until');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _clearHardCoverExitFlags(reason){
  try{
    sessionStorage.removeItem('oai_cover_exit_hard_on_next_back');
    sessionStorage.removeItem('oai_cover_exit_hard_after_first_toast');
    sessionStorage.removeItem('oai_cover_exit_long_window_once');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _armCoverExitWindow(){
  try{
    var until = Date.now() + 2500;
    window.__oaiCoverExitUntil = until;
    sessionStorage.setItem('oai_cover_exit_armed_until', String(until));
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _isCoverExitArmed(){
  try{
    var until = Number(window.__oaiCoverExitUntil || sessionStorage.getItem('oai_cover_exit_armed_until') || 0);
    return !!(until && Date.now() < until);
  }catch(e){ return false; }
}
function _isCoverScreenVisible(){
  try{
    var cover = document.getElementById('cover');
    if(!cover) return !document.documentElement.classList.contains('app-active');
    if(cover.classList.contains('hidden')) return false;
    var st = window.getComputedStyle ? window.getComputedStyle(cover) : null;
    if(st && (st.display === 'none' || st.visibility === 'hidden')) return false;
    return true;
  }catch(e){
    try{ return !document.documentElement.classList.contains('app-active'); }catch(_e){ return false; }
  }
}
function _hasOpenAppSurface(){
  try{
    return !!document.querySelector('#diocese-view.open,#web-view.open,#trail-view.open,#qna-view.open,#missa-view.open,#prayer-view.open,.module-view.open');
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function _isAppScreenActive(){
  try{ if(_hasOpenAppSurface()) return true; }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(_isCoverScreenVisible()) return false; }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ return document.documentElement.classList.contains('app-active'); }catch(e){ return false; }
}
function _ensureCoverBackTrap(reason){
  return;
}
function _resetCoverBackTrap(reason){
  return;
}
function _ensureAppBackTrap(reason){
  return;
}
function _resetAppBackTrap(reason){
  return;
}
function _pushCoverOverlayBackTrap(kind, reason){
  return;
}
function _armMassQuickHistoryTrap(opts){
  return;
}
function _hideMassQuickMenuOnly(afterHidden, opts){
  const modal=document.getElementById('mass-quick-modal');
  var deferHideUntilAfter = !!(opts && opts.deferHideUntilAfter);
  _resetCoverExitReady();
  _clearCoverExitArmed();

  function hideQuickModal(){
    if(modal){
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
    }
  }

  if(!deferHideUntilAfter) hideQuickModal();

  function done(){
    try{
      if(typeof afterHidden === 'function') afterHidden();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    finally{
      if(deferHideUntilAfter){
        if(window.requestAnimationFrame) requestAnimationFrame(hideQuickModal);
        else setTimeout(hideQuickModal, 0);
      }
    }
  }

  if(typeof afterHidden === 'function'){
    if(window.requestAnimationFrame) requestAnimationFrame(done);
    else setTimeout(done, 0);
  }
  return false;
}
function _isCoverAlreadyVisibleForQuickMenu(){
  try{
    var cover=document.getElementById('cover');
    return !!(cover && !document.documentElement.classList.contains('app-active') && getComputedStyle(cover).display !== 'none');
  }catch(e){ return false; }
}
function _setPrayerPopupReturnSource(on){
  try{
    window.__MASS_QUICK_POPUP_FROM_PRAYER__ = !!on;
    if(on) sessionStorage.setItem('oai_mass_quick_popup_from_prayer','1');
    else sessionStorage.removeItem('oai_mass_quick_popup_from_prayer');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _isPrayerPopupReturnSource(){
  try{
    return window.__MASS_QUICK_POPUP_FROM_PRAYER__ === true ||
      sessionStorage.getItem('oai_mass_quick_popup_from_prayer') === '1';
  }catch(e){ return window.__MASS_QUICK_POPUP_FROM_PRAYER__ === true; }
}

function _markPrayerCoverNeedsFirstToast(on){
  try{
    window.__OAI_PRAYER_COVER_NEEDS_FIRST_TOAST__ = !!on;
    if(on) sessionStorage.setItem('oai_prayer_cover_needs_first_toast','1');
    else sessionStorage.removeItem('oai_prayer_cover_needs_first_toast');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _consumePrayerCoverNeedsFirstToast(){
  try{
    var on = window.__OAI_PRAYER_COVER_NEEDS_FIRST_TOAST__ === true ||
      sessionStorage.getItem('oai_prayer_cover_needs_first_toast') === '1';
    if(on) _markPrayerCoverNeedsFirstToast(false);
    return !!on;
  }catch(e){ return window.__OAI_PRAYER_COVER_NEEDS_FIRST_TOAST__ === true; }
}
function _forceCoverAfterPrayerQuickPopup(){
  try{
    var modal=document.getElementById('mass-quick-modal');
    if(modal){
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      try{ delete modal.dataset.returnSource; }catch(_e){}
    }
    var pv=document.getElementById('prayer-view');
    var pd=document.getElementById('prayer-detail');
    if(pd) pd.classList.remove('show');
    if(pv){
      pv.classList.remove('open');
      try{ delete pv.dataset.quickSource; }catch(_e){}
    }
    document.querySelectorAll('.module-view.open,#diocese-view.open,#missa-view.open').forEach(function(v){ v.classList.remove('open'); });
    document.documentElement.classList.remove('app-active','parish-mode','retreat-mode');
    if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
    var cv=document.getElementById('cover');
    if(cv){
      cv.style.display='';
      cv.style.opacity='';
      cv.style.pointerEvents='';
      cv.scrollTop=0;
    }
    _setPrayerPopupReturnSource(false);
    _setMassQuickReturn(false);
    _clearPrayerQuickReturn();
    _resetCoverExitReady();
    _clearCoverExitArmed();
    _markPrayerCoverNeedsFirstToast(false);
    try{
      window.__OAI_PRAYER_POPUP_COVER_GUARD_UNTIL__ = 0;
      window.__OAI_PRAYER_COVER_FORCE_FIRST_TOAST_UNTIL__ = Date.now() + 10000;
    }catch(_e){}
    function prime(reason){
      try{
        if(document.documentElement.classList.contains('app-active')) return;
        var mq=document.getElementById('mass-quick-modal');
        if(mq && mq.classList.contains('show')) return;
        _resetCoverExitReady();
        _clearCoverExitArmed();
        if(typeof _resetCoverBackTrap === 'function') _resetCoverBackTrap(reason);
        else _ensureCoverBackTrap();
      }catch(_e){}
    }
    prime('prayer-popup-cover');
    if(window.requestAnimationFrame) requestAnimationFrame(function(){ prime('prayer-popup-cover-raf'); });
    setTimeout(function(){ prime('prayer-popup-cover-settle-80'); }, 80);
    setTimeout(function(){ prime('prayer-popup-cover-settle-220'); }, 220);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _openPrayerReturnQuickMenuStable(){
  try{
    var modal=document.getElementById('mass-quick-modal');
    var cv=document.getElementById('cover');
    var pv=document.getElementById('prayer-view');
    var pd=document.getElementById('prayer-detail');
    if(pd) pd.classList.remove('show');
    if(pv){
      pv.classList.remove('open');
      try{ delete pv.dataset.quickSource; }catch(_e){}
    }
    document.documentElement.classList.remove('app-active','parish-mode','retreat-mode');
    if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
    if(cv){
      cv.style.display='';
      cv.style.opacity='';
      cv.style.pointerEvents='';
      cv.scrollTop=0;
    }
    _resetCoverExitReady();
    _clearCoverExitArmed();
    _setPrayerPopupReturnSource(true);
    _setMassQuickReturn(false);
    _clearPrayerQuickReturn();
    if(modal){
      try{ modal.dataset.returnSource='prayer'; }catch(_e){}
    }
    try{ if(typeof _ensureCoverBackTrap === 'function') _ensureCoverBackTrap('prayer-return-popup'); }catch(_e){}
    openMassQuickMenu({keepReturn:true, fromPrayerReturn:true});
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _schedulePrayerReturnQuickMenuStable(){
  var called=false;
  function run(){
    if(called) return;
    called=true;
    try{
      window.__OAI_AFTER_RESTORE_PRAYER_QUICK_POPUP__ = null;
      window.__OAI_AFTER_RESTORE_PRAYER_QUICK_POPUP_UNTIL__ = 0;
    }catch(_e){}
    if(window.requestAnimationFrame) requestAnimationFrame(_openPrayerReturnQuickMenuStable);
    else setTimeout(_openPrayerReturnQuickMenuStable, 0);
  }
  try{
    window.__OAI_AFTER_RESTORE_PRAYER_QUICK_POPUP__ = run;
    window.__OAI_AFTER_RESTORE_PRAYER_QUICK_POPUP_UNTIL__ = Date.now() + 1800;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  setTimeout(function(){
    try{
      if(window.__OAI_AFTER_RESTORE_PRAYER_QUICK_POPUP__ === run) run();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }, 90);
}
function _returnToMassQuickMenu(source){
  var opts = (source && typeof source === 'object') ? source : {};
  var fromPrayer = source === 'prayer' || !!opts.fromPrayer;
  var keepMissaGuard = !!opts.keepMissaGuard;
  try{ var mv=document.getElementById('missa-view'); if(mv) mv.classList.remove('open'); }catch(_e){}
  try{ if(typeof _clearFaithFrame === 'function') _clearFaithFrame({keepMissaGuard:keepMissaGuard}); }catch(_e){}
  if(fromPrayer){
    try{ _setPrayerPopupReturnSource(true); }catch(e){ console.warn('[가톨릭길동무]', e); }
    _resetCoverExitReady();
    _clearCoverExitArmed();
    _clearMassQuickReturnForReload();
    _clearPrayerQuickReturn();
    try{ if(typeof _clearFaithReturnTarget === 'function') _clearFaithReturnTarget(); }catch(_e){}
    _schedulePrayerReturnQuickMenuStable();
    return;
  }
  if(!_isCoverAlreadyVisibleForQuickMenu() && typeof goToCover==='function'){
    goToCover();
  }
  _resetCoverExitReady();
  _clearCoverExitArmed();
  _clearMassQuickReturnForReload();
  _clearPrayerQuickReturn();
  try{ if(typeof _clearFaithReturnTarget === 'function') _clearFaithReturnTarget(); }catch(_e){}
  /*
   * V6-160 확인용: 매일미사/성가/성경에서 빠른 배너로 되돌아온 경우,
   * 배너를 다시 열기 전에 먼저 커버 전용 root+trap을 한 번 정리한다.
   * 그래야 배너 뒤로가기 1회 = 배너 닫힘, 다음 뒤로가기 = 커버 안내문구 흐름이 된다.
   * goToCover() 자체에는 trap을 넣지 않는다.
   */
  try{
    if(typeof _resetCoverBackTrap === 'function') _resetCoverBackTrap('mass-quick-return-cover-before-open');
    else if(typeof _ensureCoverBackTrap === 'function') _ensureCoverBackTrap('mass-quick-return-cover-before-open');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  var open = function(){
    try{ openMassQuickMenu({keepReturn:true}); }
    catch(e){ console.warn('[가톨릭길동무]', e); }
  };
  if(window.requestAnimationFrame) requestAnimationFrame(open);
  else setTimeout(open, 0);
}
function openMassQuickMenu(opts){
  const modal=document.getElementById('mass-quick-modal');
  if(!modal) return;
  if(opts && opts.fromPrayerReturn) _setPrayerPopupReturnSource(true);
  else if(!(opts && opts.keepReturn)) _setPrayerPopupReturnSource(false);
  try{
    if(opts && opts.fromPrayerReturn) modal.dataset.returnSource = 'prayer';
    else if(!(opts && opts.keepReturn)) delete modal.dataset.returnSource;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(!(opts && opts.keepReturn)){ _setMassQuickReturn(false); try{ if(typeof _clearFaithReturnTarget === 'function') _clearFaithReturnTarget(); }catch(_e){} }
  _resetCoverExitReady();
  _clearCoverExitArmed();
  _armMassQuickHistoryTrap(opts && opts.fromPrayerReturn ? {reason:'prayer-return', skip:true} : null);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  try{ if(typeof oaiEnterPopup === 'function') oaiEnterPopup(modal); }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function closeMassQuickMenu(opts){
  const modal=document.getElementById('mass-quick-modal');
  var fromPrayerReturn = _isPrayerPopupReturnSource();
  try{ if(modal && modal.dataset && modal.dataset.returnSource === 'prayer') fromPrayerReturn = true; }catch(e){ console.warn('[가톨릭길동무]', e); }
  _setMassQuickReturn(false);
  _clearPrayerQuickReturn();
  try{ if(typeof _clearFaithReturnTarget === 'function') _clearFaithReturnTarget(); }catch(_e){}
  _resetCoverExitReady();
  _clearCoverExitArmed();
  if(modal){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    try{ delete modal.dataset.returnSource; }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  if(fromPrayerReturn){
    _forceCoverAfterPrayerQuickPopup();
    return;
  }
  _ensureCoverBackTrap();
}
function _markFaithMassQuickOpen(kind){
  try{
    if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
    if(typeof _setMassQuickReturn === 'function') _setMassQuickReturn(true);
    if(kind === 'prayer'){
      if(typeof _setPrayerQuickReturn === 'function') _setPrayerQuickReturn(true);
      window.__OAI_PRAYER_FROM_QUICK_LOCK__ = true;
      try{ sessionStorage.setItem('oai_prayer_from_quick_lock','1'); }catch(_e){}
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _clearMassQuickPressingState(){
  try{
    document.querySelectorAll('#mass-quick-modal .app-pressing').forEach(function(el){ el.classList.remove('app-pressing'); });
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _openFaithTargetFromMassQuick(kind, opts){
  kind = String(kind || 'missa');
  opts = opts || null;
  _markFaithMassQuickOpen(kind);
  if(kind === 'missa'){
    try{ _showMissaPortalGuard('enter'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  var run=function(){
    try{
      _markFaithMassQuickOpen(kind);
      _clearMassQuickPressingState();
      if(kind === 'prayer'){
        if(typeof openPrayerBook === 'function') openPrayerBook({fromMassQuick:true, instant:true});
        else alert('기도문 기능이 연결되지 않았습니다.');
        return;
      }
      if(typeof openFaithPortal === 'function') openFaithPortal(kind, opts);
      else if(kind === 'missa' && typeof openMissa === 'function') openMissa();
      else if(kind === 'hymn' && typeof openCatholicHymn === 'function') openCatholicHymn();
      else if(kind === 'bible' && typeof openCatholicBible === 'function') openCatholicBible();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  };
  if(typeof _hideMassQuickMenuOnly === 'function') return _hideMassQuickMenuOnly(run);
  try{
    var modal=document.getElementById('mass-quick-modal');
    if(modal){
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      try{ delete modal.dataset.returnSource; }catch(_e){}
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(window.requestAnimationFrame) requestAnimationFrame(run);
  else setTimeout(run, 0);
  return false;
}
function _openFaithPortalFromMassQuick(kind, opts){
  return _openFaithTargetFromMassQuick(kind, opts || null);
}
function openCatholicHymn(){ openFaithPortal('hymn'); }
function openCatholicBible(){ openFaithPortal('bible'); }
var _massQuickResumeTimer = null;
var _massQuickResumeBusy = false;
function _resumeMassQuickReturnIfNeeded(){
  try{
    if(!_shouldMassQuickReturn()) return false;
    try{ if(window.oaiReturnConductorBusy && window.oaiReturnConductorBusy(['massquick-return'])) return false; }catch(_e){}
    try{ if(window.oaiReturnConductorRequest && !window.oaiReturnConductorRequest('massquick-return', {ms:1300})) return false; }catch(_e){}
    if(document.documentElement.classList.contains('app-active')){ try{ if(window.oaiReturnConductorFinish) window.oaiReturnConductorFinish('massquick-return'); }catch(_e){} return false; }
    var mq = document.getElementById('mass-quick-modal');
    if(mq && mq.classList.contains('show')){
      _clearMassQuickReturnForReload();
      return true;
    }
    if(_massQuickResumeBusy) return true;
    if(_massQuickResumeTimer) clearTimeout(_massQuickResumeTimer);
    _massQuickResumeBusy = true;
    _massQuickResumeTimer = setTimeout(function(){
      try{
        _massQuickResumeTimer = null;
        if(_shouldMassQuickReturn() && !document.documentElement.classList.contains('app-active')){
          _returnToMassQuickMenu();
        }
      }catch(e){ console.warn("[가톨릭길동무]", e); }
      finally{
        setTimeout(function(){ _massQuickResumeBusy = false; try{ if(window.oaiReturnConductorFinish) window.oaiReturnConductorFinish('massquick-return'); }catch(_e){} }, 250);
      }
    }, 0);
    return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); return false; }
}
function _tryResumeMassQuickSoon(){
  try{
    if(_resumeMassQuickReturnIfNeeded()) return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  return false;
}
window.addEventListener('pageshow', function(){
  var handled = _tryResumeMassQuickSoon();
  if(!handled){
    try{ _clearMassQuickReturnForReload(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  setTimeout(_tryResumeMassQuickSoon, 80);
}, true);
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible'){
    _tryResumeMassQuickSoon();
    setTimeout(_tryResumeMassQuickSoon, 120);
  }
}, true);
window.addEventListener('focus', function(){
  _tryResumeMassQuickSoon();
  setTimeout(_tryResumeMassQuickSoon, 120);
}, true);
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(_tryResumeMassQuickSoon, 80); }, {once:true});
else setTimeout(_tryResumeMassQuickSoon, 80);
window.addEventListener('load', function(){ setTimeout(_tryResumeMassQuickSoon, 80); }, {once:true});
try{ window.openFaithPortal=openFaithPortal; window._shouldMassQuickReturn=_shouldMassQuickReturn; window._shouldPrayerQuickReturn=_shouldPrayerQuickReturn; window._setPrayerQuickReturn=_setPrayerQuickReturn; window._clearMassQuickReturnForReload=_clearMassQuickReturnForReload; window._clearPrayerQuickReturn=_clearPrayerQuickReturn; window._returnToMassQuickMenu=_returnToMassQuickMenu; window._closePrayerAndReturn=_closePrayerAndReturn; window._resetCoverExitReady=_resetCoverExitReady; window._clearCoverExitArmed=_clearCoverExitArmed; window._clearHardCoverExitFlags=_clearHardCoverExitFlags; window._isCoverScreenVisible=_isCoverScreenVisible; window._isAppScreenActive=_isAppScreenActive; window._hasOpenAppSurface=_hasOpenAppSurface; window._ensureCoverBackTrap=_ensureCoverBackTrap; window._ensureAppBackTrap=_ensureAppBackTrap; window._resetAppBackTrap=_resetAppBackTrap; window._pushCoverOverlayBackTrap=_pushCoverOverlayBackTrap; window._hideMassQuickMenuOnly=_hideMassQuickMenuOnly; window._setPrayerPopupReturnSource=_setPrayerPopupReturnSource; window._isPrayerPopupReturnSource=_isPrayerPopupReturnSource; window._forceCoverAfterPrayerQuickPopup=_forceCoverAfterPrayerQuickPopup; window._resetCoverBackTrap=_resetCoverBackTrap; window._consumePrayerCoverNeedsFirstToast=_consumePrayerCoverNeedsFirstToast; window.openMassQuickMenu=openMassQuickMenu; window.closeMassQuickMenu=closeMassQuickMenu; window._openFaithTargetFromMassQuick=_openFaithTargetFromMassQuick; window._openFaithPortalFromMassQuick=_openFaithPortalFromMassQuick; window._setFaithReturnTarget=_setFaithReturnTarget; window._clearFaithReturnTarget=_clearFaithReturnTarget; window._shouldFaithReturnToMassQuick=_shouldFaithReturnToMassQuick; window._closeOaiVisitPicker=_closeOaiVisitPicker; window._closeParishAutoVisitSettings=_closeParishAutoVisitSettings; }catch(e){ console.warn('[가톨릭길동무]', e); }

function _performUnifiedRefreshReload(delayAfterPaint){
  var delay = Math.max(0, typeof delayAfterPaint === 'number' ? delayAfterPaint : 260);
  oaiAfterRefreshVeilPaint(function(){
    setTimeout(function(){
      try{ if(typeof oaiClearRefreshVeilBeforeReload === 'function') oaiClearRefreshVeilBeforeReload(true); }catch(_e){}
      setTimeout(function(){
        try{
          location.reload();
        }catch(e){
          location.href = location.href.split('#')[0];
        }
      }, 30);
    }, delay);
  });
}

function _runRefreshAppFilesOnly(){
  var btn = document.getElementById('cover-update-btn');
  try{
    if(btn){
      btn.disabled = true;
      btn.textContent = '새로고침 중';
    }
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    sessionStorage.setItem('oai_soft_refresh_requested', String(Date.now ? Date.now() : new Date().getTime()));
    try{ if(typeof oaiMarkRefreshHistoryCompact === 'function') oaiMarkRefreshHistoryCompact('unified-refresh'); }catch(_e){}
    try{ _clearMassQuickReturnForReload(); }catch(_e){}
    if(typeof oaiPrepareRefreshVeil === 'function'){
      oaiPrepareRefreshVeil('unified-refresh', OAI_REFRESH_VEIL_MS, OAI_REFRESH_CARRY_MS, true, OAI_REFRESH_PRE_NAV_HOLD_MS, false);
    }
  }catch(e){
    console.warn('[가톨릭길동무]', e);
  }
  /* V8-1-14-621: 짧은 새로고침과 긴 새로고침은 같은 보호창/로딩십자가 흐름을 쓴다.
     보호창은 현재 문서에서 reload 전까지만 1회 보이고, 새 문서로 carry하지 않는다. */
  _performUnifiedRefreshReload(260);
}
function _showRefreshContentDialog(onConfirm){
  try{
    var old = document.getElementById('oai-refresh-content-dialog');
    if(old && old.parentNode) old.parentNode.removeChild(old);

    var ua = (navigator.userAgent || '').toLowerCase();
    var isIOSRefresh = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var cfg = isIOSRefresh ? {
      backdropPad:'20px', panelW:'min(94vw,390px)', panelPad:'21px 17px 16px',
      title:'19px', titleLH:'1.16', titleMb:'9px',
      lead:'13px', leadLH:'1.42', leadMb:'9px',
      desc:'12.5px', descLH:'1.42', descMb:'11px',
      note:'11.8px', noteLH:'1.38', notePad:'8px 9px', noteMb:'15px',
      btnH:'40px', btnMin:'94px', btnFs:'14px', okPad:'0 17px', cancelPad:'0 15px',
      keepWords:true
    } : {
      backdropPad:'22px', panelW:'min(92vw,380px)', panelPad:'22px 18px 17px',
      title:'21px', titleLH:'1.2', titleMb:'10px',
      lead:'15px', leadLH:'1.55', leadMb:'10px',
      desc:'14px', descLH:'1.55', descMb:'12px',
      note:'12.5px', noteLH:'1.45', notePad:'8px 10px', noteMb:'16px',
      btnH:'42px', btnMin:'96px', btnFs:'15px', okPad:'0 18px', cancelPad:'0 16px',
      keepWords:false
    };
    var wordStyle = cfg.keepWords ? ';word-break:keep-all;overflow-wrap:normal;' : '';

    var wrap = document.createElement('div');
    wrap.id = 'oai-refresh-content-dialog';
    wrap.setAttribute('role','dialog');
    wrap.setAttribute('aria-modal','true');
    wrap.setAttribute('aria-label','Refresh Content');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10090;display:flex;align-items:center;justify-content:center;background:rgba(14,21,53,.36);padding:' + cfg.backdropPad + ';box-sizing:border-box;-webkit-text-size-adjust:100%;text-size-adjust:100%;';
    wrap.innerHTML = '<div style="width:' + cfg.panelW + ';background:#fffaf2;border:1px solid rgba(212,170,106,.42);border-radius:20px;box-shadow:0 18px 42px rgba(14,21,53,.24);padding:' + cfg.panelPad + ';text-align:center;font-family:inherit;color:#1f2937;box-sizing:border-box;-webkit-text-size-adjust:100%;text-size-adjust:100%' + wordStyle + '">' +
      '<div style="font-size:' + cfg.title + ';font-weight:900;line-height:' + cfg.titleLH + ';margin-bottom:' + cfg.titleMb + ';letter-spacing:-.02em;">Refresh Content</div>' +
      '<div style="font-size:' + cfg.lead + ';font-weight:800;line-height:' + cfg.leadLH + ';color:#475569;margin-bottom:' + cfg.leadMb + ';letter-spacing:-.03em' + wordStyle + '">앱 화면을 안정형으로 다시 불러옵니다.</div>' +
      '<div style="font-size:' + cfg.desc + ';font-weight:700;line-height:' + cfg.descLH + ';color:#64748b;margin-bottom:' + cfg.descMb + ';letter-spacing:-.03em' + wordStyle + '">캐시와 설치 상태는 삭제하지 않습니다.<br>글자 크기와 즐겨찾기도 그대로 유지됩니다.</div>' +
      '<div style="font-size:' + cfg.note + ';font-weight:800;line-height:' + cfg.noteLH + ';color:#8A6A2F;background:#fff4d7;border:1px solid rgba(212,170,106,.45);border-radius:12px;padding:' + cfg.notePad + ';margin-bottom:' + cfg.noteMb + ';letter-spacing:-.035em' + wordStyle + '">문제가 계속되면 새로고침 버튼을 더 길게 눌러<br>앱 캐시 초기화를 실행할 수 있습니다.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;">' +
      '<button type="button" data-oai-refresh-cancel="1" style="height:' + cfg.btnH + ';min-width:' + cfg.btnMin + ';padding:' + cfg.cancelPad + ';border:1px solid #d8d1c5;border-radius:999px;background:#fff;color:#475569;font-family:inherit;font-size:' + cfg.btnFs + ';font-weight:850;">취소</button>' +
      '<button type="button" data-oai-refresh-ok="1" style="height:' + cfg.btnH + ';min-width:' + cfg.btnMin + ';padding:' + cfg.okPad + ';border:0;border-radius:999px;background:#1f2a44;color:#fff;font-family:inherit;font-size:' + cfg.btnFs + ';font-weight:900;">확인</button>' +
      '</div></div>';
    function close(){ try{ if(wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap); }catch(_e){} }
    wrap.addEventListener('click', function(e){ if(e.target === wrap) close(); }, true);
    var cancel = wrap.querySelector('[data-oai-refresh-cancel]');
    var ok = wrap.querySelector('[data-oai-refresh-ok]');
    if(cancel) cancel.onclick = function(e){ e.preventDefault(); close(); };
    if(ok) ok.onclick = function(e){ e.preventDefault(); close(); if(typeof onConfirm === 'function') onConfirm(); };
    document.body.appendChild(wrap);
    setTimeout(function(){ try{ if(ok) ok.focus(); }catch(_e){} }, 0);
  }catch(e){
    console.warn('[가톨릭길동무]', e);
    if(typeof onConfirm === 'function') onConfirm();
  }
}
function refreshAppFilesOnly(){
  _showRefreshContentDialog(_runRefreshAppFilesOnly);
}
window.refreshAppFilesOnly = refreshAppFilesOnly;

async function _runClearAppFilesCacheCompletely(){
  try{
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    sessionStorage.setItem('oai_soft_refresh_requested', String(Date.now ? Date.now() : new Date().getTime()));
    try{ if(typeof oaiMarkRefreshHistoryCompact === 'function') oaiMarkRefreshHistoryCompact('unified-refresh'); }catch(_e){}
    try{ _clearMassQuickReturnForReload(); }catch(_e){}
    if(typeof oaiPrepareRefreshVeil === 'function'){
      oaiPrepareRefreshVeil('unified-refresh', OAI_REFRESH_VEIL_MS, OAI_REFRESH_CARRY_MS, true, OAI_REFRESH_PROGRESS_HOLD_MS, false);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  await new Promise(function(resolve){ oaiAfterRefreshVeilPaint(resolve); });
  try{
    if(window.caches && caches.keys){
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }
    if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations){
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function(r){ return r.unregister(); }));
    }
  }catch(e){
    console.warn('[가톨릭길동무]', e);
  }
  try{ if(typeof oaiClearRefreshVeilBeforeReload === 'function') oaiClearRefreshVeilBeforeReload(true); }catch(_e){}
  setTimeout(function(){
    try{
      location.reload();
    }catch(e){
      location.href = location.href.split('#')[0];
    }
  }, 30);
}
function _showCacheClearDialog(onConfirm){
  try{
    var old = document.getElementById('oai-cache-clear-dialog');
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var wrap = document.createElement('div');
    wrap.id = 'oai-cache-clear-dialog';
    wrap.setAttribute('role','dialog');
    wrap.setAttribute('aria-modal','true');
    wrap.setAttribute('aria-label','앱 캐시 초기화');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10095;display:flex;align-items:center;justify-content:center;background:rgba(14,21,53,.46);padding:22px;box-sizing:border-box;';
    wrap.innerHTML = '<div style="width:min(92vw,390px);background:#fffaf2;border:2px solid rgba(212,170,106,.70);border-radius:20px;box-shadow:0 18px 46px rgba(14,21,53,.30);padding:22px 18px 17px;text-align:center;font-family:inherit;color:#1f2937;box-sizing:border-box;">' +
      '<div style="font-size:21px;font-weight:950;line-height:1.2;margin-bottom:10px;color:#1f2a44;">앱 캐시 초기화</div>' +
      '<div style="font-size:15px;font-weight:800;line-height:1.55;color:#475569;margin-bottom:10px;">앱 파일 캐시를 삭제하고 다시 불러옵니다.</div>' +
      '<div style="font-size:14px;font-weight:700;line-height:1.55;color:#64748b;margin-bottom:12px;">화면이 이상하게 꼬였을 때만 사용하세요.<br>글자 크기와 즐겨찾기는 유지됩니다.</div>' +
      '<div style="font-size:12.5px;font-weight:800;line-height:1.45;color:#8A3B20;background:#fff1e8;border:1px solid rgba(194,65,12,.22);border-radius:12px;padding:8px 10px;margin-bottom:16px;">인터넷이 약하면 다시 불러오는 데 시간이 걸릴 수 있습니다.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;">' +
      '<button type="button" data-oai-cache-cancel="1" style="height:42px;min-width:96px;padding:0 16px;border:1px solid #d8d1c5;border-radius:999px;background:#fff;color:#475569;font-family:inherit;font-size:15px;font-weight:850;">취소</button>' +
      '<button type="button" data-oai-cache-ok="1" style="height:42px;min-width:120px;padding:0 18px;border:0;border-radius:999px;background:#1f2a44;color:#fff;font-family:inherit;font-size:15px;font-weight:900;">초기화</button>' +
      '</div></div>';
    function close(){ try{ if(wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap); }catch(_e){} }
    wrap.addEventListener('click', function(e){ if(e.target === wrap) close(); }, true);
    var cancel = wrap.querySelector('[data-oai-cache-cancel]');
    var ok = wrap.querySelector('[data-oai-cache-ok]');
    if(cancel) cancel.onclick = function(e){ e.preventDefault(); close(); };
    if(ok) ok.onclick = function(e){ e.preventDefault(); close(); if(typeof onConfirm === 'function') onConfirm(); };
    document.body.appendChild(wrap);
    setTimeout(function(){ try{ if(cancel) cancel.focus(); }catch(_e){} }, 0);
  }catch(e){
    console.warn('[가톨릭길동무]', e);
    if(typeof onConfirm === 'function') onConfirm();
  }
}
function clearAppFilesCacheCompletely(){
  _showCacheClearDialog(_runClearAppFilesCacheCompletely);
}
window.clearAppFilesCacheCompletely = clearAppFilesCacheCompletely;

function syncCoverUpdateVersionState(){
  try{
    var btn = document.getElementById('cover-update-btn');
    var box = document.getElementById('cover-update-box');
    var marker = document.getElementById('oai-build-marker');
    if(!btn || !box) return;
    /* 버튼의 HTML 속성이 이전 배포값으로 남아도 허위로 '업데이트 필요'가 뜨지 않게,
       현재 문서가 실제로 불러온 빌드 버전을 항상 기준으로 쓴다. */
    var target = window.OAI_APP_BUILD_VERSION || window.APP_VERSION || btn.getAttribute('data-target-version') || 'V8-1-14-679';
    btn.setAttribute('data-target-version', target);
    var current = '';
    /* V8-1-14-621:
       현재 화면의 실제 빌드 기준은 index.html이 먼저 선언한 OAI_APP_BUILD_VERSION/숨김 marker를 우선한다.
       늦게 로드되거나 캐시에 남은 sw-update.js의 APP_VERSION 값이 덮어써도 커버 버튼이 잘못 "업데이트 필요"로 바뀌지 않게 한다. */
    if(window.OAI_APP_BUILD_VERSION) current = String(window.OAI_APP_BUILD_VERSION).trim();
    if(!current && marker) current = String(marker.textContent || '').trim();
    if(!current && window.APP_VERSION) current = String(window.APP_VERSION).trim();
    if(!current) current = target;
    var mismatch = current !== target;
    btn.textContent = mismatch ? '업데이트 필요' : '새로고침';
    box.classList.toggle('update-needed', mismatch);
    if(marker) marker.textContent = current;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
window.syncCoverUpdateVersionState = syncCoverUpdateVersionState;
document.addEventListener('DOMContentLoaded', function(){
  syncCoverUpdateVersionState();
  setTimeout(syncCoverUpdateVersionState, 250);
  setTimeout(syncCoverUpdateVersionState, 900);
}, true);
window.addEventListener('load', syncCoverUpdateVersionState, true);

(function(){
  'use strict';
  function resetGuideScroll(id){
    try{
      var root=document.getElementById(id);
      if(!root) return;
      root.scrollTop=0;
      root.querySelectorAll('.guide-panel,.guide-card-list').forEach(function(el){ el.scrollTop=0; });
      var panel=root.querySelector('.guide-panel');
      if(panel) panel.scrollIntoView({block:'center', inline:'nearest'});
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function stabilizeCoverBackAfterGuide(reason){
    try{ window.__OAI_NEARBY_PREOPEN_MODE__ = null; }catch(_e){}
  try{ if(typeof _resetCoverExitReady === 'function') _resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _clearCoverExitArmed === 'function') _clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags(reason || 'guide-modal'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _forceNextCoverBackToast === 'function') _forceNextCoverBackToast(reason || 'guide-modal'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _ensureCoverBackTrap === 'function') _ensureCoverBackTrap(reason || 'guide-modal'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function showModal(id){
    var el=document.getElementById(id);
    if(!el) return;
    stabilizeCoverBackAfterGuide('guide-open');
    resetGuideScroll(id);
    el.classList.add('show');
    el.setAttribute('aria-hidden','false');
    try{ if(typeof _pushCoverOverlayBackTrap === 'function') _pushCoverOverlayBackTrap('guide-' + id, 'guide-open'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof oaiEnterPopup==='function') oaiEnterPopup(el); }catch(e){ console.warn('[가톨릭길동무]', e); }
    setTimeout(function(){ resetGuideScroll(id); }, 0);
    try{ document.activeElement && document.activeElement.blur && document.activeElement.blur(); }catch(e){}
  }
  function hideModal(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.classList.remove('show');
    el.setAttribute('aria-hidden','true');
    stabilizeCoverBackAfterGuide('guide-close');
    try{
      if(window.requestAnimationFrame) requestAnimationFrame(function(){ stabilizeCoverBackAfterGuide('guide-close-raf'); });
      setTimeout(function(){ stabilizeCoverBackAfterGuide('guide-close-160'); }, 160);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function openGuideManual(){ showModal('guide-manual-modal'); }
  function closeGuideManual(){ hideModal('guide-manual-modal'); }
  function openPrivacyPolicyModal(){
    try{
      var frame=document.getElementById('privacy-policy-frame');
      if(frame){
        var src=frame.getAttribute('data-src') || ('privacy.html?embedded=1&v=' + encodeURIComponent(window.APP_VERSION || 'V8-1-14-679'));
        if(frame.getAttribute('src') === 'about:blank' || !frame.getAttribute('src')) frame.setAttribute('src', src);
      }
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    showModal('privacy-policy-modal');
  }
  function closePrivacyPolicyModal(){ hideModal('privacy-policy-modal'); }
  function bindGuide(){
    /* V8-1-14-621: legacy direct guide-button binding removed; cover menu handler owns this entry. */
    var ok=document.getElementById('guide-ok-btn');
    if(ok) ok.addEventListener('click', function(e){ e.preventDefault(); closeGuideManual(); });
    var privacyOk=document.getElementById('privacy-policy-ok-btn');
    if(privacyOk) privacyOk.addEventListener('click', function(e){ e.preventDefault(); closePrivacyPolicyModal(); });
    document.querySelectorAll('[data-privacy-policy-close]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); closePrivacyPolicyModal(); });
    });
    document.querySelectorAll('[data-guide-close]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        if(el.getAttribute('data-guide-close') === 'manual') closeGuideManual();
      });
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeGuideManual();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bindGuide, {once:true});
  else bindGuide();
  window.openGuideManual = openGuideManual;
  window.openPrivacyPolicyModal = openPrivacyPolicyModal;
  window.closePrivacyPolicyModal = closePrivacyPolicyModal;
  window.resetGuideManualScroll = function(){ resetGuideScroll('guide-manual-modal'); };
})();

function closeMissa(){
  const view=$('missa-view');
  const isShrineExternal=!!(view && view.dataset && view.dataset.externalReturnSource==='shrine');
  const isDailyMissa=!!(view && view.dataset && view.dataset.faithCurrent==='missa');
  const shouldReturnToQuickBeforeClose = !!((view && view.dataset && view.dataset.quickSource==='massQuick') || (typeof _shouldFaithReturnToMassQuick === 'function' ? _shouldFaithReturnToMassQuick() : _shouldMassQuickReturn()));
  var missaReturnGuardToken = isDailyMissa ? _showMissaPortalGuard('return') : '';
  if(view) view.classList.remove('open');
  try{ if(typeof _clearFaithFrame === 'function') _clearFaithFrame({keepMissaGuard:!!isDailyMissa}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(isShrineExternal){
    try{
      if(view){
        view.classList.remove('shrine-external-mode');
        delete view.dataset.externalReturnSource;
        delete view.dataset.faithCurrent;
      }
      const nav=$('missa-faith-nav');
      if(nav){ nav.innerHTML=''; nav.style.display=''; }
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _resetCoverExitReady==='function') _resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _clearCoverExitArmed==='function') _clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    return;
  }
  if(shouldReturnToQuickBeforeClose) _returnToMassQuickMenu({keepMissaGuard:!!isDailyMissa});
  else { try{ if(typeof _clearFaithReturnTarget === 'function') _clearFaithReturnTarget(); }catch(e){ console.warn('[가톨릭길동무]', e); } if(typeof goToCover==='function') goToCover(); }
  if(isDailyMissa) _hideMissaPortalGuard('missa-return-finish', OAI_MISSA_RETURN_GUARD_MS, missaReturnGuardToken);
}
function openPrayerBook(opts){
  try{ if(typeof oaiClearMapInfoSelection === 'function') oaiClearMapInfoSelection('open-prayer'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(!(opts && opts.restore)){
    try{
      if(typeof _setFaithReturnTarget === 'function') _setFaithReturnTarget('massQuick');
      _setPrayerQuickReturn(true);
      window.__OAI_PRAYER_FROM_QUICK_LOCK__ = true;
      sessionStorage.setItem('oai_prayer_from_quick_lock','1');
    }catch(e){ console.warn("[가톨릭길동무]", e); }
  }
  try{ if(typeof _resetCoverExitReady==='function') _resetCoverExitReady(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ if(typeof _clearCoverExitArmed==='function') _clearCoverExitArmed(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  const view=$('prayer-view');
  if(!view) return;
  try{
    if(opts && opts.fromMassQuick) view.dataset.quickSource = 'mass';
    else delete view.dataset.quickSource;
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  const cv=$('cover');
  if(cv){ cv.style.opacity='0'; cv.style.display='none'; }
  var prayerShowLoading = !(opts && opts.restore);
  if(prayerShowLoading && typeof _setPrayerViewLoading === 'function') _setPrayerViewLoading(view, true, '기도문을 불러오는 중입니다...');
  document.documentElement.classList.add('app-active');
  try{
    if(typeof window._oaiArmPrayerBackTrap==='function') window._oaiArmPrayerBackTrap('prayer-open');
    else if(typeof _ensureAppBackTrap==='function') _ensureAppBackTrap('prayer-open');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(true);
  view.classList.add('open');
  try{
    if(opts && opts.fromMassQuick && typeof _resetAppBackTrap==='function') _resetAppBackTrap('prayer-quick-open');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  _renderFaithBottomNav('prayer');
  var restore = !!(opts && opts.restore);
  if(!restore && typeof oaiEnterView==='function') oaiEnterView(view);
  var setupDelay = (opts && opts.instant) ? 0 : 50;
  var runPrayerSetup=function(){
    setTimeout(function(){
      if(typeof window.initPrayerView==='function') try{window.initPrayerView();}catch(e){ console.warn("[가톨릭길동무]", e); }
      try{ if(typeof window.prEnsureTabsVisible==='function') window.prEnsureTabsVisible(); }catch(e){ console.warn("[가톨릭길동무]", e); }
      if(!(opts&&opts.restore) && typeof showPrayerListOnly==='function') try{showPrayerListOnly();}catch(e){ console.warn("[가톨릭길동무]", e); }
      setTimeout(function(){ try{ if(typeof window.prEnsureTabsVisible==='function') window.prEnsureTabsVisible(); }catch(e){ console.warn("[가톨릭길동무]", e); } }, 120);
      try{
        if(typeof window._oaiArmPrayerBackTrap==='function') window._oaiArmPrayerBackTrap('prayer-list-ready');
        else if(typeof _ensureAppBackTrap==='function') _ensureAppBackTrap('prayer-list-ready');
      }catch(e){ console.warn("[가톨릭길동무]", e); }
      if(prayerShowLoading && typeof _setPrayerViewLoading === 'function') _setPrayerViewLoading(view, false);
      var list=document.getElementById('prayer-list-view'); if(list) list.scrollTop=0;
      var tabs=document.getElementById('prayer-tabs'); if(tabs) tabs.scrollLeft=0;
    }, setupDelay);
  };
  if(typeof window.ensurePrayerModuleLoaded==='function'){
    window.ensurePrayerModuleLoaded().then(runPrayerSetup).catch(function(err){
      console.warn('[가톨릭길동무]', err);
      if(typeof _setPrayerViewLoading === 'function') _setPrayerViewLoading(view, false);
      var ul=document.getElementById('pr-list-ul');
      if(ul) ul.innerHTML='<div class="pr-empty">기도문을 불러오지 못했습니다.<br>새로고침 후 다시 시도해 주세요.</div>';
    });
  } else {
    runPrayerSetup();
  }
}
function closePrayerView(){
  const view=$('prayer-view');
  const detail=$('prayer-detail');
  if(detail) detail.classList.remove('show');
  if(view){
    view.classList.remove('open');
    if(typeof _setPrayerViewLoading === 'function') _setPrayerViewLoading(view, false);
    try{ delete view.dataset.quickSource; }catch(e){ console.warn("[가톨릭길동무]", e); }
  }
}
function _closePrayerAndReturn(){
  try{
    if(typeof window._oaiPrayerBackHandle === 'function' && window._oaiPrayerBackHandle('prayer-close-button')) return;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(typeof window._oaiPrayerListToPopupOrCover === 'function'){
      window._oaiPrayerListToPopupOrCover('prayer-close-button');
      return;
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  var pv = $('prayer-view');
  var fromQuickPrayer = _shouldPrayerQuickReturn();
  try{ if(pv && pv.dataset && pv.dataset.quickSource === 'mass') fromQuickPrayer = true; }catch(e){ console.warn("[가톨릭길동무]", e); }
  if(fromQuickPrayer){
    _returnToMassQuickMenu('prayer');
  } else {
    closePrayerView();
    try{ _clearPrayerQuickReturn(); }catch(e){ console.warn("[가톨릭길동무]", e); }
    if(typeof goToCover==='function') goToCover();
  }
}

(function(){
  'use strict';
  function ua(){ return (navigator.userAgent || '').toLowerCase(); }
  function isIOS(){
    var u = ua();
    return /iphone|ipad|ipod/.test(u) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isKakao(){ return ua().indexOf('kakaotalk') > -1; }
  function isStandalone(){
    try{ if(window.navigator.standalone === true) return true; }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches; }catch(e){ console.warn('[가톨릭길동무]', e); }
    return false;
  }
  function shouldShow(){
    return isIOS() && isKakao() && !isStandalone();
  }
  function loadIosSafariGuideImages(){
    var m = document.getElementById('ios-safari-guide-modal');
    if(!m || m.__iosSafariGuideImagesLoaded) return;
    m.__iosSafariGuideImagesLoaded = true;
    try{
      m.querySelectorAll('img[data-src]').forEach(function(img){
        if(!img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
      });
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function showModal(){
    var m = document.getElementById('ios-safari-guide-modal');
    if(!m) return;
    loadIosSafariGuideImages();
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');
    try{ if(typeof oaiEnterPopup==='function') oaiEnterPopup(m); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ document.activeElement && document.activeElement.blur && document.activeElement.blur(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function hideModal(){
    var m = document.getElementById('ios-safari-guide-modal');
    if(!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden','true');
  }
  function init(){
    var banner = document.getElementById('ios-kakao-safari-banner');
    var modal = document.getElementById('ios-safari-guide-modal');
    if(!banner) return;
    var show = shouldShow();
    if(show){
      document.documentElement.classList.add('ios-kakao-inapp');
      banner.hidden = false;
      banner.setAttribute('aria-hidden','false');
    }else{
      document.documentElement.classList.remove('ios-kakao-inapp');
      banner.hidden = true;
      banner.setAttribute('aria-hidden','true');
      hideModal();
    }
    function bindTap(el, flag, handler){
      if(!el || el[flag]) return;
      el[flag] = true;
      var fn = function(e){ e.preventDefault(); e.stopPropagation(); handler(e); };
      el.addEventListener('click', fn, true);
      el.addEventListener('touchend', fn, true);
    }
    bindTap(document.getElementById('ios-kakao-safari-help'), '__iosSafariBound', showModal);
    bindTap(document.getElementById('ios-kakao-safari-close'), '__iosSafariBannerCloseBound', function(){
      banner.hidden = true;
      banner.setAttribute('aria-hidden','true');
    });
    document.querySelectorAll('[data-ios-safari-close]').forEach(function(el){
      bindTap(el, '__iosSafariCloseBound', hideModal);
    });
  }
  document.addEventListener('DOMContentLoaded', init, true);
  window.addEventListener('pageshow', init, true);
})();

function _getDioceseLoading(){
  return document.getElementById('diocese-loading');
}
function _setDioceseLoading(visible){
  var loading=_getDioceseLoading();
  if(!loading) return null;
  loading.style.display = visible ? 'flex' : 'none';
  loading.setAttribute('aria-hidden', visible ? 'false' : 'true');
  return loading;
}
function openDioceseView(opts){
  try{ if(typeof oaiClearMapInfoSelection === 'function') oaiClearMapInfoSelection('open-diocese'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  var view=document.getElementById('diocese-view');
  var frame=document.getElementById('diocese-frame');
  var loading=_getDioceseLoading();
  if(!view||!frame) return;
  var restore = !!(opts && opts.restore);
  var url = (typeof oaiGetDioceseFrameUrl === 'function') ? oaiGetDioceseFrameUrl() : 'diocese.html?v=V8-1-14-679';
  var currentSrc = frame.getAttribute('src') || '';
  var needsLoad = (!currentSrc || currentSrc==='about:blank' || currentSrc.indexOf('diocese.html') < 0 || !frame._loaded);

  try{ document.activeElement && document.activeElement.blur && document.activeElement.blur(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ document.querySelectorAll('.module-view.open,#missa-view.open,#prayer-view.open').forEach(function(v){ if(v!==view) v.classList.remove('open'); }); }catch(e){ console.warn('[가톨릭길동무]', e); }
  var cover=document.getElementById('cover');
  document.documentElement.classList.add('app-active');
  if(cover){ cover.style.opacity='0'; cover.style.display='none'; cover.style.pointerEvents='none'; }
  if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(true);
  view.classList.add('open');
  try{ if(typeof _resetCoverExitReady === 'function') _resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _clearCoverExitArmed === 'function') _clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  function armDioceseOverlayBack(){
    try{
      if(typeof _pushCoverOverlayBackTrap === 'function') _pushCoverOverlayBackTrap('diocese-view', 'diocese-open');
      else if(typeof _resetAppBackTrap === 'function') _resetAppBackTrap('diocese-open');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  if(!restore && typeof oaiEnterView==='function') oaiEnterView(view);
  loading=_setDioceseLoading(needsLoad);
  if(needsLoad){
    if(typeof oaiBindDioceseFrameLoad === 'function') oaiBindDioceseFrameLoad(frame, loading, restore);
    else {
      frame.onload=function(){
        _setDioceseLoading(false); frame._loaded=true;
        try{ frame.contentWindow && frame.contentWindow.dioApplySharedFont && frame.contentWindow.dioApplySharedFont(); }catch(e){ console.warn("[가톨릭길동무]", e); }
        if(!restore) try{ frame.contentWindow && frame.contentWindow.resetDioceseFirstPage && frame.contentWindow.resetDioceseFirstPage(); }catch(e){ console.warn("[가톨릭길동무]", e); }
        if(typeof dioceseLoaded==='function') dioceseLoaded();
      };
    }
    if(currentSrc !== url) frame.src=url;
    setTimeout(armDioceseOverlayBack, 0);
  }else{
    _setDioceseLoading(false);
    if(!restore){
      try{ frame.contentWindow && frame.contentWindow.resetDioceseFirstPage && frame.contentWindow.resetDioceseFirstPage(); }catch(e){ console.warn("[가톨릭길동무]", e); }
    }
    armDioceseOverlayBack();
  }
}
function closeDioceseView(){
  var view=document.getElementById('diocese-view');
  var frame=document.getElementById('diocese-frame');
  var root=document.documentElement;

  try{ _setDioceseLoading(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(frame && frame.contentWindow){
      frame.contentWindow.__OAI_DIO_EXTERNAL_LEAVING__ = false;
      frame.contentWindow.__OAI_DIO_PARENT_RETURNING__ = false;
      if(typeof frame.contentWindow.oaiReleaseDioceseStability === 'function'){
        frame.contentWindow.oaiReleaseDioceseStability({silent:true});
      }
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(typeof _clearDioceseReturnState === 'function') _clearDioceseReturnState('diocese-close');
    else { sessionStorage.removeItem(DIOCESE_RETURN_KEY); localStorage.removeItem(DIOCESE_RETURN_KEY); }
    window.__OAI_DIOCESE_EXTERNAL_LEAVING__ = false;
    window.__OAI_DIOCESE_RESTORING__ = false;
  }catch(e){ console.warn('[가톨릭길동무]', e); }

  if(view) view.classList.remove('open','oai-enter-ready','oai-enter-show');
  try{ document.querySelectorAll('#diocese-view .oai-enter-ready,#diocese-view .oai-enter-show').forEach(function(el){ el.classList.remove('oai-enter-ready','oai-enter-show'); }); }catch(e){ console.warn('[가톨릭길동무]', e); }

  _screen='cover';
  try{ if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ root.classList.remove('app-active','parish-mode','retreat-mode','oai-diocese-returning'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    var cv=document.getElementById('cover');
    if(cv){
      cv.style.display='';
      cv.style.opacity='';
      cv.style.pointerEvents='';
      cv.scrollTop=0;
    }
    if(window.scrollTo) window.scrollTo(0,0);
    if(document.scrollingElement) document.scrollingElement.scrollTop=0;
  }catch(e){ console.warn('[가톨릭길동무]', e); }

  function primeCoverBackAfterDioceseClose(step){
    try{ if(typeof _resetCoverExitReady === 'function') _resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof _clearCoverExitArmed === 'function') _clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{
      if(typeof _resetCoverBackTrap === 'function') _resetCoverBackTrap('diocese-close-' + step);
      else if(typeof _ensureCoverBackTrap === 'function') _ensureCoverBackTrap('diocese-close-' + step);
      else if(typeof window._oaiArmCoverBackTrap === 'function') window._oaiArmCoverBackTrap('diocese-close-' + step);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }

  primeCoverBackAfterDioceseClose('direct');

}
function dioceseLoaded(){
  _setDioceseLoading(false);
}
function oaiGetDioceseFrameUrl(){
  return 'diocese.html?v=V8-1-14-679';
}
function oaiBindDioceseFrameLoad(frame, loading, restore){
  if(!frame) return;
  frame.onload=function(){
    try{ _setDioceseLoading(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ frame._loaded=true; frame.setAttribute('data-oai-loaded','1'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ frame.contentWindow && frame.contentWindow.dioApplySharedFont && frame.contentWindow.dioApplySharedFont(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(!restore) frame.contentWindow && frame.contentWindow.resetDioceseFirstPage && frame.contentWindow.resetDioceseFirstPage(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ if(typeof dioceseLoaded==='function') dioceseLoaded(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  };
}
function oaiPreloadDioceseFrame(reason){
  try{
    var frame=document.getElementById('diocese-frame');
    if(!frame) return;
    var url=oaiGetDioceseFrameUrl();
    var src=frame.getAttribute('src') || '';
    if(src && src !== 'about:blank' && src.indexOf('diocese.html') >= 0) return;
    var loading=_setDioceseLoading(false);
    frame.setAttribute('loading','eager');
    frame.setAttribute('data-src', url);
    frame.setAttribute('data-oai-preloaded', reason || 'idle');
    oaiBindDioceseFrameLoad(frame, loading, true);
    frame.src=url;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function oaiScheduleDiocesePreload(){
  try{
    if(window.__OAI_DIOCESE_PRELOAD_SCHEDULED__) return;
    window.__OAI_DIOCESE_PRELOAD_SCHEDULED__=true;
    var run=function(){ try{ oaiPreloadDioceseFrame('idle'); }catch(e){ console.warn('[가톨릭길동무]', e); } };
    if('requestIdleCallback' in window) window.requestIdleCallback(run,{timeout:1800});
    else setTimeout(run,900);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.oaiPreloadDioceseFrame=oaiPreloadDioceseFrame; window.oaiScheduleDiocesePreload=oaiScheduleDiocesePreload; }catch(e){ console.warn('[가톨릭길동무]', e); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', oaiScheduleDiocesePreload, {once:true});
else oaiScheduleDiocesePreload();
window.addEventListener('load', function(){ setTimeout(oaiScheduleDiocesePreload, 300); }, {once:true});
/* V8-1-14-621: 성지 외부 링크는 웹사이트 카테고리와 같은 보호창 이동 흐름으로 통일하고 옛 core return 저장 함수는 제거 */
function oaiPreserveExplicitHttpUrl(url){
  url = String(url || '').trim();
  if(!url) return '';
  url = url.replace(/^hthttp:\/\//i, 'http://').replace(/^http\/\//i, 'http://');
  if(/^http:\/\//i.test(url)) return url;
  return '';
}
function normalizeCatholicExternalUrl(url){
  url = String(url || '').trim();
  if(!url) return '';

  try{
    if(typeof _decUrl === 'function') url = _decUrl(url);
  }catch(e){ console.warn("[가톨릭길동무]", e); }

  var explicitHttp = oaiPreserveExplicitHttpUrl(url);
  if(explicitHttp) return explicitHttp;

  url = url.replace(/^hthttp:\/\//i, 'http://').replace(/^hthttps:\/\//i, 'https://').replace(/^http\/\//i, 'http://').replace(/^https\/\//i, 'https://');
  if(url.indexOf('//') === 0) url = 'https:' + url;
  if(!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

  try{
    var u = new URL(url);
    u.pathname = u.pathname.replace(/\/\/+/g, '/');
    var host = u.hostname.toLowerCase();
    // V8-1-14-621:
    // 원래 HTTP로 쓰던 교구는 HTTPS로 끌어올리지 않고 HTTP를 명시 유지한다.
    if(host === 'caincheon.or.kr' || host === 'www.caincheon.or.kr'){
      u.protocol = 'http:';
      u.hostname = 'www.caincheon.or.kr';
    }else if(host === 'ucatholic.or.kr' || host === 'www.ucatholic.or.kr'){
      u.protocol = 'http:';
    }else if(host === 'wjcatholic.or.kr' || host === 'www.wjcatholic.or.kr'){
      u.protocol = 'http:';
      u.hostname = 'www.wjcatholic.or.kr';
    }else{
      if(host === 'www.cathms.kr') u.hostname = 'cathms.kr';
      if(u.hostname.toLowerCase() === 'cathms.kr') u.protocol = 'https:';
    }
    return u.toString();
  }catch(e){ return url; }
}
function _isShrineDetailGuideUrl(url){
  try{
    url = normalizeCatholicExternalUrl(url);
    if(!url) return false;
    var u = new URL(url);
    var host = String(u.hostname||'').toLowerCase();
    var path = String(u.pathname||'').toLowerCase();
    return (host.indexOf('cbck.or.kr')>=0 && path.indexOf('/catholic/shrine/read')>=0) ||
           (host.indexOf('martyr.co.kr')>=0 && path.indexOf('/assets/holy/view.html')>=0);
  }catch(e){ return false; }
}
function _getShrineHomepageUrl(item){
  var hp = item && item.hp ? normalizeCatholicExternalUrl(item.hp) : '';
  if(!hp) return '';
  /* V8-1-14-621: 신규 성지는 성지추가.xlsx의 '홈페이지' 열을 그대로 홈페이지 버튼에 연결한다. */
  if(item && item.isNew) return hp;
  if(_isShrineDetailGuideUrl(hp)) return '';
  return hp;
}
function _getShrineGuideUrl(item){
  if(!item) return '';
  /* V8-1-14-621: 성지추가.xlsx의 '주교회의 성지안내/성지 상세' URL을 우선 사용한다. */
  if(item.guideUrl) return normalizeCatholicExternalUrl(item.guideUrl);
  if(item.seq) return _SU + item.seq;
  var hp = item.hp ? normalizeCatholicExternalUrl(item.hp) : '';
  return _isShrineDetailGuideUrl(hp) ? hp : '';
}

function _getShrineGoodnewsUrl(item){
  if(!item || !item.goodnewsUrl) return '';
  return normalizeCatholicExternalUrl(item.goodnewsUrl);
}

/* R2에 사진 자료를 올린 성지만 자료 화면을 표시한다. 다른 성지의 기존 카드·GPS·길찾기 기능은 그대로 둔다. */
const SHRINE_PHOTO_ORIGIN='https://pub-e8a7be3bff22491a8bc525ac379528da.r2.dev';
/* 사진 설명은 자료 화면에 표시하지 않는다. 기존 순서·대체 텍스트 데이터는 유지한다. */
const SHOW_SHRINE_PHOTO_CAPTIONS=false;
function _numberedShrinePhotos(count){
  return Array.from({length:Math.max(0,Number(count)||0)},function(_,index){ return {file:String(index+1).padStart(2,'0')+'.jpg'}; });
}
const SHRINE_MATERIALS={
  '20190078':{folder:'명례성지',title:'명례성지',photos:[
    {file:'01.jpg',caption:'성지 입구'}, {file:'02.jpg',caption:'성모승천성당 외관'},
    {file:'03.jpg',caption:'성모승천성당 내부'}, {file:'04.png',caption:'십자가의 길'},
    {file:'05.png',caption:'순교자기념성당 외관'}, {file:'06.png',caption:'순교자기념성당 내부 전경'},
    {file:'07.png',caption:'순교자기념성당 제대'}, {file:'08.png',caption:'부활경당',portrait:true},
    {file:'09.png',caption:'성지 야외 풍경'}, {file:'10.png',caption:'성지에서 바라본 풍경'}
  ]},
  '20190071':{folder:'언양성당',title:'언양성당',photos:[
    {file:'01.png',caption:'성당 외관 1'}, {file:'02.png',caption:'성당 외관 2'},
    {file:'03.jpg',caption:'성당 내부'}, {file:'04.png',caption:'교육관'},
    {file:'05.png',caption:'옛 사제관'}, {file:'06.png',caption:'성당 야외 풍경'},
    {file:'07.png',caption:'성모당'}, {file:'08.jpg',caption:'안내 표지판 2'},
    {file:'09.jpg',caption:'안내표지판',portrait:true}
  ]},
  '20190162':{folder:'김수환 추기경 사랑과 나눔공원',title:'김수환 추기경 사랑과 나눔 공원 (김수환 추기경 생가)',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'},
    {file:'05.jpg'}, {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'},
    {file:'09.jpg',portrait:true}, {file:'10.jpg'}, {file:'11.jpg'}, {file:'12.jpg'}
  ]},
  '20190065':{folder:'진목정성지',title:'진목정 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true},
    {file:'05.jpg'}, {file:'06.jpg'}, {file:'07.jpg',portrait:true}, {file:'08.jpg'},
    {file:'09.jpg',portrait:true}
  ]},
  '20190016':{folder:'갈매못순교성지',title:'갈매못 순교 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'},
    {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg'}
  ]},
  'name:강경 성당':{folder:'강경성당',title:'강경 성당',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'},
    {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}
  ]},
  'name:강경 김대건 신부 유숙지 (구순오의 집)':{folder:'강경 김대건 신부 유숙지(구순오의 집)',title:'강경 김대건 신부 유숙지 (구순오의 집)',photos:[
    {file:'01.jpg'}, {file:'02.jpg',portrait:true}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}
  ]},
  '20190062':{folder:'복자성당',title:'복자 성당',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg'},
    {file:'05.jpg'}, {file:'06.jpg'}, {file:'07.jpg',portrait:true}, {file:'08.jpg',portrait:true}, {file:'09.jpg'}
  ]},
  '20190019':{folder:'다락골성지',title:'다락골 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'},
    {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg'},
    {file:'11.jpg'}, {file:'12.jpg'}, {file:'13.jpg'}, {file:'14.jpg'}, {file:'15.jpg'},
    {file:'16.jpg'}, {file:'17.jpg',portrait:true}, {file:'18.jpg'}, {file:'19.jpg'}, {file:'20.jpg'}
  ]},
  '20190140':{folder:'삽티성지',title:'삽티 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}, {file:'07.jpg'}
  ]},
  '20190024':{folder:'수리치골성모성지',title:'수리치골 성모 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'},
    {file:'06.jpg',portrait:true}, {file:'07.jpg',portrait:true}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg'}
  ]},
  '20190029':{folder:'진산성지',title:'진산 성지',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'},
    {file:'06.jpg'}, {file:'07.jpg',portrait:true}, {file:'08.jpg'}, {file:'09.jpg'}
  ]},
  '20190033':{folder:'황새바위순교성지',title:'황새 바위 순교 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'},
    {file:'05.jpg',portrait:true}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}, {file:'08.jpg'},
    {file:'09.jpg',portrait:true}, {file:'10.jpg',portrait:true}, {file:'11.jpg',portrait:true},
    {file:'12.jpg',portrait:true}, {file:'13.jpg',portrait:true}
  ]},
  '20190068':{folder:'울산병영순교성지',title:'울산 병영 순교 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}
  ]},
  '20190073':{folder:'죽림굴',title:'죽림굴',photos:[
    {file:'01.png',portrait:true}, {file:'02.png',portrait:true}, {file:'03.png'}, {file:'04.png'},
    {file:'05.png'}, {file:'06.png'}, {file:'07.png',portrait:true}
  ]},
  '20190047':{folder:'어농성지',title:'어농 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg'}
  ]},
  '20190161':{folder:'구룡공소',title:'구룡 공소',photos:[
    {file:'01.jpg'}, {file:'02.jpg',portrait:true}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}
  ]},
  '20190163':{folder:'김천황금성당',title:'김천 황금 성당',photos:[
    {file:'01.jpg'}, {file:'02.jpg',portrait:true}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}, {file:'07.jpg',portrait:true}
  ]},
  'name:성 베네딕도회 왜관 수도원과 구)왜관 성당':{folder:'성베네딕도수도원',title:'성 베네딕도회 왜관 수도원과 구)왜관 성당',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg',portrait:true}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}
  ]},
  '20190139':{folder:'도앙골성지',title:'도앙골 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}, {file:'05.jpg'}
  ]},
  '20190141':{folder:'서짓골성지',title:'서짓골 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}
  ]},
  'name:정산 순교 성지':{folder:'정산성지',title:'정산 순교 성지',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg',portrait:true}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}
  ]},
  '20190050':{folder:'죽산순교성지',title:'죽산 순교 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg'}, {file:'07.jpg',portrait:true}, {file:'08.jpg'}
  ]},
  '20190080':{folder:'복자 박대식 빅토리노 묘',title:'복자 박대식 빅토리노 묘',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}
  ]},
  '20190170':{folder:'대산 성당 (복자 구한선 타대오 성지)',title:'대산 성당 (복자 구한선 타대오 성지)',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.png'}
  ]},
  'name:순교자 서응권 요한과 아내 파평 윤씨 안나 묘':{folder:'순교자 서응권 요한과 아내 파평 윤씨 안나 묘',title:'순교자 서응권 요한과 아내 파평 윤씨 안나 묘',photos:[
    {file:'01.jpg'}, {file:'02.jpg',portrait:true}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}
  ]},
  '20190083':{folder:'복자 정찬문 안토니오 묘',title:'복자 정찬문 안토니오 묘',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg',portrait:true}
  ]},
  '20190069':{folder:'살티 공소 (김영제와 김 아가타 묘)',title:'살티 공소 (김영제와 김 아가타 묘)',photos:[
    {file:'01.jpg'}, {file:'02.jpg',portrait:true}, {file:'03.jpg',portrait:true}, {file:'04.jpg'}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg',portrait:true}
  ]},
  '20190041':{folder:'단내 성가정 성지',title:'단내 성가정 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg'}
  ]},
  '20190046':{folder:'양근 성지',title:'양근 성지',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg',portrait:true}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg',portrait:true}
  ]},
  '20190084':{folder:'마원 성지 (복자 박상근 마티아 묘)',title:'마원 성지 (복자 박상근 마티아 묘)',photos:[
    {file:'01.jpg',portrait:true}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}
  ]},
  '20190172':{folder:'상주 옥 터 (남성동 성당)',title:'상주 옥 터 (남성동 성당)',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}, {file:'07.jpg'}
  ]},
  '20190085':{folder:'신앙 고백비 (옥산 성당)',title:'신앙 고백비 (옥산 성당)',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}
  ]},
  '20190086':{folder:'여우목 성지',title:'여우목 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}, {file:'07.jpg',portrait:true}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg'}
  ]},
  '20190087':{folder:'우곡 성지',title:'우곡 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg',portrait:true}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg'}, {file:'10.jpg',portrait:true}, {file:'11.jpg',portrait:true}
  ]},
  '20190088':{folder:'진안리 성지',title:'진안리 성지',photos:[
    {file:'01.jpg',portrait:true}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true}
  ]},
  '20190089':{folder:'홍유한 고택지 (휴천동 성당)',title:'홍유한 고택지 (휴천동 성당)',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}
  ]},
  '20190053':{folder:'배론 성지',title:'배론 성지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg',portrait:true}, {file:'04.jpg',portrait:true}, {file:'05.jpg',portrait:true}, {file:'06.jpg'}, {file:'07.jpg'}, {file:'08.jpg'}, {file:'09.jpg',portrait:true}, {file:'10.jpg',portrait:true}, {file:'11.jpg',portrait:true}
  ]},
  /* R2 폴더명을 공백 유무·기존 표기와 무관하게 찾도록 별칭을 함께 둔다. */
  '20190052':{folder:'성 남종삼 요한·남상교 아우구스티노 유택지 (묘재)',folders:['성 남종삼 요한·남상교 아우구스티노 유택지(묘재)','남종삼 요한·남상교 아우구스티노 유택지(묘재)','남종삼 요한과 남상교 아우구스티노 유택지 (묘재)'],title:'성 남종삼 요한·남상교 아우구스티노 유택지 (묘재)',photos:[]},
  '20190054':{folder:'용소막 성당',folders:['용소막성당'],title:'용소막 성당',photos:[]},
  '20190056':{folder:'마재 성가정 성지',folders:['마재성가정성지','마재성지'],title:'마재 성가정 성지',photos:[]},
  '20190176':{folder:'김제 순교 성지',folders:['김제순교성지'],title:'김제 순교 성지',photos:[]},
  '20190094':{folder:'나바위 성지',folders:['나바위성지'],title:'나바위 성지',photos:[]},
  /* 2026-09-21 R2 확인 완료분: 목록 요청 실패와 관계없이 즉시 사진을 표시한다. */
  'name:수류 성당':{folder:'수류 성당',title:'수류 성당',photos:_numberedShrinePhotos(11)},
  '20190098':{folder:'여산 순교 성지',title:'여산 순교 성지',photos:_numberedShrinePhotos(11)},
  '20190101':{folder:'초남이 성지',title:'초남이 성지',photos:_numberedShrinePhotos(17)},
  '20190105':{folder:'관덕정 순교 터',title:'관덕정 순교 터',photos:_numberedShrinePhotos(7)},
  '20190107':{folder:'김기량 순교 기념관',title:'김기량 순교 기념관',photos:_numberedShrinePhotos(8)},
  '20190109':{folder:'용수 성지 (성 김대건 신부 제주 표착 기념 성당)',title:'용수 성지 (성 김대건 신부 제주 표착 기념 성당)',photos:_numberedShrinePhotos(8)},
  '20190111':{folder:'황사평 성지',title:'황사평 성지',photos:_numberedShrinePhotos(10)},
  '20190077':{folder:'연풍 순교 성지',title:'연풍 순교 성지',photos:_numberedShrinePhotos(9)},
  '20190067':{folder:'김범우 순교자 성지',title:'김범우 순교자 성지',photos:_numberedShrinePhotos(9)},
  '20190070':{folder:'수영 장대 순교 성지',title:'수영 장대 순교 성지',photos:_numberedShrinePhotos(7)},
  '20190072':{folder:'오륜대 순교자 성지',title:'오륜대 순교자 성지',photos:_numberedShrinePhotos(11)},
  '20190074':{folder:'조씨 형제 순교자 묘',title:'조씨 형제 순교자 묘',photos:_numberedShrinePhotos(10)},
  /* 2026-09-21 R2 추가 확인분 */
  '20190168':{folder:'멍에목 성지',title:'멍에목 성지',photos:_numberedShrinePhotos(9)},
  '20190114':{folder:'경기 감영 터',title:'경기 감영 터',photos:_numberedShrinePhotos(3)},
  '20190003':{folder:'광희문 성지',title:'광희문 성지',photos:_numberedShrinePhotos(12)},
  '20190001':{folder:'명동 대성당(명동 주교좌 성지 성당)',title:'명동 대성당(명동 주교좌 성지 성당)',photos:_numberedShrinePhotos(10)},
  '20190122':{folder:'종로 성당',title:'종로 성당',photos:_numberedShrinePhotos(8)},
  '20190106':{folder:'대정 성지 (정난주 마리아 묘)',title:'대정 성지 (정난주 마리아 묘)',photos:_numberedShrinePhotos(6)},
  '20190108':{folder:'새미 은총의 동산',title:'새미 은총의 동산',photos:_numberedShrinePhotos(8)},
  '20190021':{folder:'산막골 성지',folders:['산막골성지','산막골 성지 · 작은재 성지'],title:'산막골 성지 · 작은재 성지',photos:_numberedShrinePhotos(7)},
  'name:안대동 성당지':{folder:'안대동 성당지',title:'안대동 성당지',photos:_numberedShrinePhotos(7)},
  '20190028':{folder:'지석리 성지',title:'지석리 성지',photos:_numberedShrinePhotos(7)},
  '20190100':{folder:'천호 성지',title:'천호 성지',photos:_numberedShrinePhotos(11)}
  ,'name:되재 성당지':{folder:'되재 성당지',folders:['되재성당지','도재 성당지','도재성당지'],title:'되재 성당지',photos:[
    {file:'01.jpg'}, {file:'02.jpg'}, {file:'03.jpg'}, {file:'04.jpg'}, {file:'05.jpg'}, {file:'06.jpg'},
    {file:'07.jpg',portrait:true}, {file:'08.jpg'}, {file:'09.jpg',portrait:true}, {file:'10.jpg',portrait:true}, {file:'11.jpg',portrait:true}
  ]}
};
/* 앱에 적어 둔 사진은 즉시 열고, R2 목록은 화면을 막지 않는 뒤쪽 확인에만 쓴다.
   새 사진을 추가한 경우에도 다음 열기부터 최신 순서·개수가 반영된다. */
Object.keys(SHRINE_MATERIALS).forEach(function(key){ SHRINE_MATERIALS[key].remoteManifest=true; });
/* 등록표에 아직 없는 새 성지는 같은 객체를 계속 사용한다. 매번 새 객체를 만들면
   자료창을 다시 열 때마다 R2 목록을 처음부터 기다리게 된다. */
var _shrineMaterialFallbacks={};
var _myeongryeCurrentMaterials=null;
function _getMyeongryePhotos(){ return _myeongryeCurrentMaterials?_myeongryeCurrentMaterials.photos:[]; }
function _getMyeongryePhotoUrl(photo){ return SHRINE_PHOTO_ORIGIN+'/shrines/'+encodeURIComponent(_myeongryeCurrentMaterials.folder)+'/'+encodeURIComponent(photo.file); }
function _getShrinePhotoFolderCandidates(materials){
  var raws=[];
  if(materials){
    raws.push(materials.folder,materials.title);
    if(Array.isArray(materials.folders)) raws=raws.concat(materials.folders);
  }
  return raws.reduce(function(candidates,raw){
    raw=String(raw||'').trim();
    var compact=raw.replace(/\s+/g,'');
    [raw,compact].forEach(function(value){ if(value&&candidates.indexOf(value)===-1) candidates.push(value); });
    return candidates;
  },[]);
}
/* 사진 목록 파일의 응답을 기다리는 동안에도 대표 사진은 바로 확인한다.
   새로 올린 폴더가 01.jpg 형식이면 자료창을 연 직후 곧바로 첫 사진이 보인다. */
function _primeShrineFirstPhoto(materials,done){
  done=typeof done==='function'?done:function(){};
  if(!materials||materials.photos.length||materials._firstPhotoProbeStarted){ done(false); return; }
  materials._firstPhotoProbeStarted=true;
  var folders=_getShrinePhotoFolderCandidates(materials), files=['01.jpg','01.jpeg','01.png','1.jpg'], remaining=folders.length*files.length, complete=false;
  if(!remaining){ done(false); return; }
  var finish=function(ok,folder,file){
    if(complete) return;
    if(ok){
      complete=true; materials.folder=folder; materials.photos=[{file:file}]; materials._firstPhotoReady=true; done(true); return;
    }
    remaining--; if(!remaining){ complete=true; done(false); }
  };
  folders.forEach(function(folder){ files.forEach(function(file){
    var image=new Image();
    image.onload=function(){ finish(true,folder,file); };
    image.onerror=function(){ finish(false); };
    image.src=SHRINE_PHOTO_ORIGIN+'/shrines/'+encodeURIComponent(folder)+'/'+encodeURIComponent(file);
  }); });
}
/* photos.json 요청이 Android WebView에서 실패해도, 사용자가 통일한 01.jpg 형식의
   사진은 CORS 영향을 받지 않는 이미지 확인으로 바로 표시한다. */
function _probeShrineNumberedPhotos(materials,folders,done){
  folders=Array.isArray(folders)?folders:[];
  done=typeof done==='function'?done:function(){};
  var tryFolder=function(folderIndex){
    if(folderIndex>=folders.length){ done([],null); return; }
    var folder=folders[folderIndex], foundByNumber={}, next=1, active=0, finished=0, total=30;
    var settle=function(number,ok){
      active--; finished++;
      /* 동시에 확인해도 R2 응답 도착 순서가 사진 순서가 되지 않도록 번호별로 저장한다. */
      if(ok) foundByNumber[number]={file:String(number).padStart(2,'0')+'.jpg'};
      if(next<=total) launch();
      else if(!active&&finished>=total){
        var found=Object.keys(foundByNumber).map(Number).sort(function(a,b){ return a-b; }).map(function(number){ return foundByNumber[number]; });
        if(found.length) done(found,folder);
        else tryFolder(folderIndex+1);
      }
    };
    var launch=function(){
      while(active<6&&next<=total){
        (function(number){
          active++;
          var image=new Image(), settled=false, timer=setTimeout(function(){ finish(false); },5500);
          var finish=function(ok){
            if(settled) return;
            settled=true; clearTimeout(timer); settle(number,ok);
          };
          image.onload=function(){ finish(true); };
          image.onerror=function(){ finish(false); };
          image.src=SHRINE_PHOTO_ORIGIN+'/shrines/'+encodeURIComponent(folder)+'/'+String(number).padStart(2,'0')+'.jpg';
        })(next++);
      }
    };
    launch();
  };
  tryFolder(0);
}
function _loadShrinePhotoManifest(materials,done){
  done=typeof done==='function'?done:function(){};
  if(!materials||!materials.remoteManifest||materials._manifestLoaded){ done(); return; }
  /* 첫 요청이 일시적으로 실패한 뒤에도 빈 상태가 고정되지 않도록, 같은 자료창을
     다시 열면 잠시 후 재시도한다. 동시에 열린 요청은 하나로 합친다. */
  if(materials._manifestLoading){
    (materials._manifestCallbacks||(materials._manifestCallbacks=[])).push(done);
    return;
  }
  if(materials._manifestRetryAfter && Date.now()<materials._manifestRetryAfter){ done(); return; }
  materials._manifestLoading=true;
  materials._manifestCallbacks=[done];
  var finish=function(loaded){
    var callbacks=materials._manifestCallbacks||[];
    materials._manifestCallbacks=[];
    materials._manifestLoading=false;
    materials._manifestLoaded=!!loaded;
    /* R2 업로드 직후·일시적인 통신 실패는 다음 열기에서 다시 확인한다. */
    if(!loaded) materials._manifestRetryAfter=Date.now()+2500;
    else delete materials._manifestRetryAfter;
    callbacks.forEach(function(callback){ try{ callback(); }catch(e){} });
  };
  var folders=_getShrinePhotoFolderCandidates(materials), attempt=function(index){
    if(index>=folders.length){
      _probeShrineNumberedPhotos(materials,folders,function(photos,folder){
        if(photos.length){ materials.folder=folder; materials.photos=photos; finish(true); }
        else finish(false);
      });
      return;
    }
    var folder=folders[index], baseUrl=SHRINE_PHOTO_ORIGIN+'/shrines/'+encodeURIComponent(folder)+'/photos.json';
    /* cache:'no-store'는 일부 모바일 WebView에서 교차 출처 요청을 불안정하게 만들 수 있다.
       대신 URL에 시간표시를 더한 일반 GET으로 최신 파일을 받는다. */
    var url=baseUrl+'?v='+Date.now(), controller=typeof AbortController!=='undefined'?new AbortController():null;
    var timeout=controller?setTimeout(function(){ try{ controller.abort(); }catch(e){} },7000):0;
    var clear=function(){ if(timeout) clearTimeout(timeout); };
    fetch(url,controller?{signal:controller.signal}:undefined).then(function(res){
      clear();
      return res.ok?res.text():null;
    }).then(function(text){
      var data=null;
      try{ data=text?JSON.parse(text.replace(/,\s*([}\]])/g,'$1')):null; }catch(e){ data=null; }
      var photos=data&&Array.isArray(data.photos)?data.photos.filter(function(photo){ return photo&&photo.file; }).map(function(photo){ return {file:String(photo.file),portrait:!!photo.portrait}; }):[];
      if(photos.length){
        materials.folder=folder;
        materials.photos=photos;
        finish(true);
        return;
      }
      attempt(index+1);
    }).catch(function(){ clear(); attempt(index+1); });
  };
  attempt(0);
}
var _myeongryeSlideIndex=0, _myeongryeRenderedSlideIndex=-1, _myeongryeSlideTimer=0, _myeongryeManualPause=false, _myeongryeTouchStartX=null, _myeongryeBodyOverflow='', _myeongryeWasOpenBeforeBackground=false, _myeongryeResumeTimer=0;
var _myeongryeViewerZoom={scale:1,x:0,y:0,startX:0,startY:0,startPanX:0,startPanY:0,pinchDistance:0,pinchScale:1,gesture:false,lastTap:0};
function _myeongryeTouchDistance(touches){
  var dx=touches[0].clientX-touches[1].clientX, dy=touches[0].clientY-touches[1].clientY;
  return Math.sqrt(dx*dx+dy*dy)||1;
}
function _applyMyeongryeViewerZoom(){
  var modal=document.getElementById('myeongrye-materials-modal'), viewer=modal&&modal.querySelector('.myeongrye-photo-viewer'), img=modal&&modal.querySelector('.myeongrye-viewer-stage img'), z=_myeongryeViewerZoom;
  if(img) img.style.transform='translate3d('+Math.round(z.x)+'px,'+Math.round(z.y)+'px,0) scale('+z.scale+')';
  if(viewer) viewer.classList.toggle('myeongrye-viewer-zoomed',z.scale>1);
}
function _constrainMyeongryeViewerPan(){
  var modal=document.getElementById('myeongrye-materials-modal'), stage=modal&&modal.querySelector('.myeongrye-viewer-stage'), z=_myeongryeViewerZoom;
  if(!stage) return;
  var maxX=Math.max(0,(stage.clientWidth*(z.scale-1))/2), maxY=Math.max(0,(stage.clientHeight*(z.scale-1))/2);
  z.x=Math.max(-maxX,Math.min(maxX,z.x)); z.y=Math.max(-maxY,Math.min(maxY,z.y));
}
function _setMyeongryeViewerZoom(scale){
  var z=_myeongryeViewerZoom; z.scale=scale; z.x=0; z.y=0; z.pinchDistance=0; z.gesture=false; _applyMyeongryeViewerZoom();
}
function _getShrineMaterials(item){
  if(!item) return null;
  var known=SHRINE_MATERIALS[String(item.seq||'')]||SHRINE_MATERIALS['name:'+String(item.name||'')];
  if(known) return known;
  var key=String(item.seq||'name:'+String(item.name||''));
  if(!_shrineMaterialFallbacks[key]) _shrineMaterialFallbacks[key]={title:item.name||'성지 자료',folder:item.name||'',photos:[],remoteManifest:true};
  return _shrineMaterialFallbacks[key];
}
function _isMyeongryeShrine(item){ return !!_getShrineMaterials(item); }
function _ensureMyeongryeMaterialsModal(){
  var modal=document.getElementById('myeongrye-materials-modal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='myeongrye-materials-modal'; modal.className='myeongrye-materials-modal';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby','myeongrye-materials-title'); modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="myeongrye-materials-backdrop" data-myeongrye-close="1"></div><section class="myeongrye-materials-panel"><header class="myeongrye-materials-head"><div><div class="myeongrye-materials-kicker">성지 자료</div><h2 id="myeongrye-materials-title">명례성지</h2></div><button type="button" class="myeongrye-materials-close" data-myeongrye-close="1" aria-label="성지 자료 닫기">×</button></header><div class="myeongrye-gallery" aria-live="polite"><div class="myeongrye-slides"></div><div class="myeongrye-photo-loading" aria-hidden="true"><span></span>사진 불러오는 중</div><button type="button" class="myeongrye-slide-nav prev" data-myeongrye-prev="1" aria-label="이전 사진">‹</button><button type="button" class="myeongrye-slide-nav next" data-myeongrye-next="1" aria-label="다음 사진">›</button><div class="myeongrye-slide-meta"><strong class="myeongrye-slide-caption"></strong><span class="myeongrye-slide-count"></span></div></div><button type="button" class="myeongrye-enlarge-hint" data-myeongrye-enlarge="1" aria-label="현재 사진 크게 보기"><span aria-hidden="true">⛶</span> 사진을 누르면 크게 볼 수 있습니다</button><div class="myeongrye-slide-dots" aria-label="사진 순서"></div><div class="myeongrye-material-links" aria-label="관련 자료"></div></section><div class="myeongrye-photo-viewer" aria-hidden="true" role="dialog" aria-modal="true" aria-label="사진 크게 보기"><button type="button" class="myeongrye-viewer-close" data-myeongrye-viewer-close="1" aria-label="큰 사진 닫기">×</button><button type="button" class="myeongrye-viewer-nav prev" data-myeongrye-viewer-prev="1" aria-label="이전 큰 사진">‹</button><div class="myeongrye-viewer-stage"><img alt=""></div><button type="button" class="myeongrye-viewer-nav next" data-myeongrye-viewer-next="1" aria-label="다음 큰 사진">›</button><div class="myeongrye-viewer-meta"><strong></strong><span></span></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){
    if(e.target&&e.target.closest('[data-myeongrye-close]')){ e.preventDefault(); _closeMyeongryeMaterials(); return; }
    if(e.target&&e.target.closest('[data-myeongrye-viewer-close]')){ e.preventDefault(); _closeMyeongryePhotoViewer(); return; }
    if(e.target&&e.target.closest('[data-myeongrye-viewer-prev]')){ e.preventDefault(); _moveMyeongryeViewer(-1); return; }
    if(e.target&&e.target.closest('[data-myeongrye-viewer-next]')){ e.preventDefault(); _moveMyeongryeViewer(1); return; }
    if(e.target&&e.target.closest('[data-myeongrye-enlarge]')){ e.preventDefault(); _openMyeongryePhotoViewer(); return; }
    if(e.target&&e.target.closest('[data-myeongrye-prev]')){ e.preventDefault(); _moveMyeongryeSlide(-1,true); return; }
    if(e.target&&e.target.closest('[data-myeongrye-next]')){ e.preventDefault(); _moveMyeongryeSlide(1,true); }
  });
  var gallery=modal.querySelector('.myeongrye-gallery');
  gallery.addEventListener('touchstart',function(e){ _myeongryeTouchStartX=e.touches&&e.touches[0]?e.touches[0].clientX:null; },{passive:true});
  gallery.addEventListener('touchend',function(e){
    if(_myeongryeTouchStartX===null) return;
    var end=e.changedTouches&&e.changedTouches[0]?e.changedTouches[0].clientX:_myeongryeTouchStartX;
    var dx=end-_myeongryeTouchStartX; _myeongryeTouchStartX=null;
    if(Math.abs(dx)>42) _moveMyeongryeSlide(dx>0?-1:1,true);
  },{passive:true});
  gallery.addEventListener('click',function(e){
    if(e.target&&e.target.closest('.myeongrye-slide.active img')) _openMyeongryePhotoViewer();
  });
  var viewer=modal.querySelector('.myeongrye-photo-viewer'), stage=modal.querySelector('.myeongrye-viewer-stage');
  stage.addEventListener('touchstart',function(e){
    var z=_myeongryeViewerZoom, t=e.touches;
    z.gesture=false;
    if(t.length===2){ e.preventDefault(); z.pinchDistance=_myeongryeTouchDistance(t); z.pinchScale=z.scale; z.gesture=true; return; }
    if(!t[0]) return;
    z.startX=t[0].clientX; z.startY=t[0].clientY; z.startPanX=z.x; z.startPanY=z.y;
  },{passive:false});
  stage.addEventListener('touchmove',function(e){
    var z=_myeongryeViewerZoom, t=e.touches;
    if(t.length===2&&z.pinchDistance){
      e.preventDefault(); z.scale=Math.max(1,Math.min(4,z.pinchScale*(_myeongryeTouchDistance(t)/z.pinchDistance))); z.gesture=true;
      if(z.scale===1){ z.x=0; z.y=0; } _applyMyeongryeViewerZoom(); return;
    }
    if(t.length===1&&z.scale>1){
      e.preventDefault(); z.x=z.startPanX+(t[0].clientX-z.startX); z.y=z.startPanY+(t[0].clientY-z.startY); z.gesture=true; _constrainMyeongryeViewerPan(); _applyMyeongryeViewerZoom();
    }
  },{passive:false});
  stage.addEventListener('touchend',function(e){
    var z=_myeongryeViewerZoom, now=Date.now(), changed=e.changedTouches&&e.changedTouches[0], dx=changed?changed.clientX-z.startX:0, dy=changed?changed.clientY-z.startY:0;
    if(e.touches.length){ return; }
    var wasGesture=z.gesture; z.pinchDistance=0;
    if(wasGesture) return;
    if(z.scale>1){ return; }
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)){ _moveMyeongryeViewer(dx>0?-1:1); return; }
    if(Math.abs(dx)<14&&Math.abs(dy)<14&&now-z.lastTap<300){ _setMyeongryeViewerZoom(z.scale>1?1:2); z.lastTap=0; return; }
    z.lastTap=now;
  },{passive:true});
  return modal;
}
function _renderMyeongryeSlide(instant){
  var modal=document.getElementById('myeongrye-materials-modal'); if(!modal) return;
  var photos=_getMyeongryePhotos(); if(!photos.length) return;
  var slides=modal.querySelectorAll('.myeongrye-slide'), nextIndex=_myeongryeSlideIndex, previousIndex=_myeongryeRenderedSlideIndex, nextSlide=slides[nextIndex], previousSlide=slides[previousIndex];
  if(!nextSlide) return;
  slides.forEach(function(slide,i){
    slide.setAttribute('aria-hidden',i===nextIndex?'false':'true');
    if(i!==nextIndex&&i!==previousIndex) slide.classList.remove('active','entering','leaving');
  });
  if(instant||previousIndex<0||previousIndex===nextIndex||!previousSlide){
    slides.forEach(function(slide,i){ slide.classList.toggle('active',i===nextIndex); slide.classList.remove('entering','leaving'); });
  }else{
    /* 시작 프레임을 먼저 그린 뒤 두 장을 겹쳐 전환해 Android WebView의 프레임 생략을 막는다. */
    nextSlide.classList.remove('active','leaving'); nextSlide.classList.add('entering');
    previousSlide.classList.remove('entering','leaving'); previousSlide.classList.add('active');
    void nextSlide.offsetWidth;
    requestAnimationFrame(function(){
      if(_myeongryeRenderedSlideIndex!==nextIndex||!nextSlide.isConnected) return;
      previousSlide.classList.remove('active'); previousSlide.classList.add('leaving');
      nextSlide.classList.remove('entering'); nextSlide.classList.add('active');
      var clearLeaving=function(){ previousSlide.classList.remove('leaving'); previousSlide.removeEventListener('transitionend',clearLeaving); };
      previousSlide.addEventListener('transitionend',clearLeaving);
      setTimeout(clearLeaving,760);
    });
  }
  _myeongryeRenderedSlideIndex=nextIndex;
  var photo=photos[_myeongryeSlideIndex], captionText=SHOW_SHRINE_PHOTO_CAPTIONS?(photo.caption||''):'', caption=modal.querySelector('.myeongrye-slide-caption'), count=modal.querySelector('.myeongrye-slide-count');
  modal.classList.toggle('portrait-photo',!!photo.portrait);
  modal.classList.toggle('no-photo-caption',!captionText);
  modal.querySelectorAll('.myeongrye-slide-dot').forEach(function(dot,i){ dot.classList.toggle('active',i===_myeongryeSlideIndex); });
  if(caption) caption.textContent=captionText; if(count) count.textContent=(_myeongryeSlideIndex+1)+' / '+photos.length;
}
function _loadMyeongryePhoto(index,done){
  var modal=document.getElementById('myeongrye-materials-modal'), img=modal&&modal.querySelectorAll('.myeongrye-slide img')[index];
  if(!img){ if(done) done(false); return; }
  var finished=false, finish=function(ok){ if(finished) return; finished=true; img.onload=null; img.onerror=null; if(done) done(ok); }, decoded=function(){
    if(typeof img.decode==='function') img.decode().then(function(){ finish(true); }).catch(function(){ finish(true); }); else finish(true);
  };
  if(img.complete&&img.naturalWidth){ decoded(); return; }
  img.onload=function(){ decoded(); }; img.onerror=function(){ finish(false); };
  if(!img.getAttribute('src')) img.src=img.getAttribute('data-src');
}
/* 현재 장면은 바로 보여 주고, 바로 뒤 세 장을 조용히 미리 준비한다.
   자동 전환 전에 다음 사진이 이미 준비되어 있어야 전환이 늦지 않는다. */
function _warmMyeongryeUpcomingPhotos(fromIndex){
  var photos=_getMyeongryePhotos(); if(!photos.length) return;
  for(var offset=1;offset<=3;offset++){
    var target=fromIndex+offset;
    if(target>=photos.length) break;
    _loadMyeongryePhoto(target);
  }
}
function _startMyeongryeSlides(){
  var photos=_getMyeongryePhotos();
  clearTimeout(_myeongryeSlideTimer); _myeongryeSlideTimer=0; if(_myeongryeManualPause||!photos.length) return;
  _myeongryeSlideTimer=setTimeout(function(){
    var currentPhotos=_getMyeongryePhotos(); if(!currentPhotos.length) return;
    /* 마지막 사진은 그대로 둔다. 자동 재생이 1번 사진으로 되돌아가며 순서가 섞여 보이지 않게 한다. */
    var next=_myeongryeSlideIndex+1;
    if(next>=currentPhotos.length){ _myeongryeSlideTimer=0; return; }
    /* 다음 사진이 준비될 때까지 현재 사진을 유지한다. 자동 넘김 중 로딩 표시·빈 화면은 만들지 않는다. */
    _loadMyeongryePhoto(next,function(ok){ if(ok&&!_myeongryeManualPause){ _myeongryeSlideIndex=next; _renderMyeongryeSlide(); _warmMyeongryeUpcomingPhotos(next); _startMyeongryeSlides(); } });
  },2500);
}
function _moveMyeongryeSlide(delta,manual){
  var photos=_getMyeongryePhotos(); if(!photos.length) return;
  if(manual){ _myeongryeManualPause=true; clearTimeout(_myeongryeSlideTimer); _myeongryeSlideTimer=0; }
  /* 수동 이동도 끝에서 반대쪽 끝으로 순환하지 않는다. */
  var target=_myeongryeSlideIndex+delta;
  if(target<0||target>=photos.length) return;
  _loadMyeongryePhoto(target,function(ok){ if(ok){ _myeongryeSlideIndex=target; _renderMyeongryeSlide(); _warmMyeongryeUpcomingPhotos(target); } });
}
function _renderMyeongryePhotoViewer(){
  var modal=document.getElementById('myeongrye-materials-modal'), viewer=modal&&modal.querySelector('.myeongrye-photo-viewer');
  if(!viewer) return;
  var photos=_getMyeongryePhotos(); if(!photos.length) return;
  var photo=photos[_myeongryeSlideIndex], captionText=SHOW_SHRINE_PHOTO_CAPTIONS?(photo.caption||''):'', img=viewer.querySelector('img');
  img.src=_getMyeongryePhotoUrl(photo); img.alt=photo.caption||((_myeongryeCurrentMaterials.title||'성지 자료')+' 사진 '+(_myeongryeSlideIndex+1));
  viewer.classList.toggle('no-photo-caption',!captionText);
  viewer.querySelector('.myeongrye-viewer-meta strong').textContent=captionText;
  viewer.querySelector('.myeongrye-viewer-meta span').textContent=(_myeongryeSlideIndex+1)+' / '+photos.length;
  _setMyeongryeViewerZoom(1);
}
function _openMyeongryePhotoViewer(){
  var modal=document.getElementById('myeongrye-materials-modal'), viewer=modal&&modal.querySelector('.myeongrye-photo-viewer');
  if(!viewer) return;
  _myeongryeManualPause=true; clearTimeout(_myeongryeSlideTimer); _myeongryeSlideTimer=0;
  _renderMyeongryePhotoViewer(); viewer.classList.add('open'); viewer.setAttribute('aria-hidden','false');
  var close=viewer.querySelector('.myeongrye-viewer-close'); if(close) close.focus();
}
function _closeMyeongryePhotoViewer(){
  var modal=document.getElementById('myeongrye-materials-modal'), viewer=modal&&modal.querySelector('.myeongrye-photo-viewer');
  if(viewer){ _setMyeongryeViewerZoom(1); viewer.classList.remove('open'); viewer.setAttribute('aria-hidden','true'); }
}
function _moveMyeongryeViewer(delta){
  var photos=_getMyeongryePhotos(); if(!photos.length) return;
  _myeongryeManualPause=true;
  var target=_myeongryeSlideIndex+delta;
  if(target<0||target>=photos.length) return;
  _loadMyeongryePhoto(target,function(ok){ if(ok){ _myeongryeSlideIndex=target; _renderMyeongryeSlide(); _renderMyeongryePhotoViewer(); _warmMyeongryeUpcomingPhotos(target); } });
}
function _getShrineMaterialLinkLabel(url,kind){
  var host=''; try{ host=new URL(url).hostname.toLowerCase(); }catch(e){}
  if(kind==='home') return '성지 공식 홈페이지';
  if(host.indexOf('cbck.or.kr')>=0) return '한국천주교주교회의 성지 자료';
  if(host.indexOf('djcatholic.or.kr')>=0) return '대전교구 성지 자료';
  if(host.indexOf('martyr.co.kr')>=0) return '전주교구 성지 자료';
  if(host.indexOf('cdcj.or.kr')>=0) return '청주교구 성지 자료';
  if(host.indexOf('daegu-archdiocese.or.kr')>=0) return '대구대교구 성지 자료';
  if(host.indexOf('cathms.kr')>=0) return '마산교구 성지 자료';
  if(host.indexOf('seoji.net')>=0) return '성지 공식 홈페이지';
  return kind==='goodnews'?'가톨릭 굿뉴스 성지안내':'성지 안내 자료';
}
function _openMyeongryeMaterials(item){
  var materials=_getShrineMaterials(item); if(!materials) return;
  /* R2 사진목록은 자료창을 여는 즉시 시작한다. requestAnimationFrame에 맡기지 않아
     일부 Android WebView에서 첫 요청이 생략되는 일을 없앤다. */
  _myeongryeCurrentMaterials=materials;
  var photos=_getMyeongryePhotos(), modal=_ensureMyeongryeMaterialsModal(), slides=modal.querySelector('.myeongrye-slides'), dots=modal.querySelector('.myeongrye-slide-dots');
  if(!photos.length){
    _primeShrineFirstPhoto(materials,function(found){
      var current=document.getElementById('myeongrye-materials-modal');
      if(found&&current&&current.classList.contains('open')&&_myeongryeCurrentMaterials===materials) _openMyeongryeMaterials(item);
    });
  }
  modal.classList.toggle('no-shrine-photos',!photos.length);
  /* 사진이 아직 없는 성지는 R2 확인 중에도 ‘불러오는 중’으로 남기지 않는다.
     사진이 발견되면 즉시 다시 그려 사진 갤러리로 바뀌고, 없으면 준비 안내가 유지된다. */
  if(slides) slides.innerHTML=photos.length?photos.map(function(photo,i){ var alt=photo.caption||(materials.title+' 사진 '+(i+1)), eager=i<4; return '<figure class="myeongrye-slide'+(i===0?' active':'')+'" aria-hidden="'+(i===0?'false':'true')+'"><img '+(eager?'src':'data-src')+'="'+_getMyeongryePhotoUrl(photo)+'" alt="'+_visitHtmlEsc(alt)+'" decoding="async" '+(i===0?'fetchpriority="high"':'')+'><figcaption>'+_visitHtmlEsc(photo.caption||'')+'</figcaption></figure>'; }).join(''):'<div class="myeongrye-photo-empty"><strong>사진을 준비하고 있습니다.</strong></div>';
  if(dots) dots.innerHTML=photos.map(function(_,i){ return '<span class="myeongrye-slide-dot'+(i===0?' active':'')+'"></span>'; }).join('');
  modal.querySelector('#myeongrye-materials-title').textContent=materials.title||item.name||'성지 자료';
  var links=modal.querySelector('.myeongrye-material-links');
  var linkData=[
    {kind:'home',url:_getShrineHomepageUrl(item)},
    {kind:'guide',url:_getShrineGuideUrl(item)},
    {kind:'goodnews',url:_getShrineGoodnewsUrl(item)}
  ].filter(function(link){ return !!link.url; }).map(function(link){ return {label:_getShrineMaterialLinkLabel(link.url,link.kind),url:link.url}; });
  links.innerHTML=linkData.map(function(link){ return '<button type="button" class="myeongrye-material-link" data-myeongrye-url="'+_visitHtmlEsc(link.url)+'">'+_visitHtmlEsc(link.label)+'</button>'; }).join('');
  links.querySelectorAll('[data-myeongrye-url]').forEach(function(btn){ btn.addEventListener('click',function(){ openCoreExternalUrl(btn.getAttribute('data-myeongrye-url'),{source:'myeongrye-materials'}); }); });
  _myeongryeSlideIndex=0; _myeongryeRenderedSlideIndex=-1; _myeongryeManualPause=false;
  if(photos.length){ _renderMyeongryeSlide(true); _warmMyeongryeUpcomingPhotos(0); }
  _myeongryeBodyOverflow=document.body.style.overflow||''; document.body.style.overflow='hidden'; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); _startMyeongryeSlides();
  var closeBtn=modal.querySelector('.myeongrye-materials-close'); if(closeBtn) closeBtn.focus();
  if(materials.remoteManifest&&!materials._manifestLoaded){
    if(photos.length){
      /* 이미 보이는 사진은 건드리지 않는다. 목록 갱신은 뒤에서 끝내 다음 열기부터 반영한다. */
      setTimeout(function(){ _loadShrinePhotoManifest(materials); },350);
    }else{
      _loadShrinePhotoManifest(materials,function(){
        var current=document.getElementById('myeongrye-materials-modal');
        if(current&&current.classList.contains('open')&&_myeongryeCurrentMaterials===materials) _openMyeongryeMaterials(item);
      });
    }
  }
}
function _closeMyeongryeMaterials(){
  var modal=document.getElementById('myeongrye-materials-modal'); clearTimeout(_myeongryeSlideTimer); _myeongryeSlideTimer=0;
  clearTimeout(_myeongryeResumeTimer); _myeongryeResumeTimer=0; _myeongryeWasOpenBeforeBackground=false; _myeongryeRenderedSlideIndex=-1;
  if(modal){ _closeMyeongryePhotoViewer(); modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); } document.body.style.overflow=_myeongryeBodyOverflow;
}

/* 자료창·큰 사진창도 앱의 백그라운드 복귀 수명주기에 함께 참여한다. */
function _pauseMyeongryeForBackground(){
  var modal=document.getElementById('myeongrye-materials-modal');
  _myeongryeWasOpenBeforeBackground=!!(modal&&modal.classList.contains('open'));
  if(!_myeongryeWasOpenBeforeBackground) return;
  clearTimeout(_myeongryeSlideTimer); _myeongryeSlideTimer=0;
  clearTimeout(_myeongryeResumeTimer); _myeongryeResumeTimer=0;
}
function _resumeMyeongryeAfterBackground(){
  clearTimeout(_myeongryeResumeTimer);
  if(!_myeongryeWasOpenBeforeBackground||document.visibilityState!=='visible') return;
  _myeongryeResumeTimer=setTimeout(function(){
    var modal=document.getElementById('myeongrye-materials-modal');
    if(!modal||!modal.classList.contains('open')||document.visibilityState!=='visible') return;
    _loadMyeongryePhoto(_myeongryeSlideIndex,function(ok){
      if(!ok||!modal.classList.contains('open')) return;
      _renderMyeongryeSlide(true); _warmMyeongryeUpcomingPhotos(_myeongryeSlideIndex);
      if(!_myeongryeManualPause) _startMyeongryeSlides();
    });
  },120);
}
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden') _pauseMyeongryeForBackground();
  else _resumeMyeongryeAfterBackground();
},true);
window.addEventListener('pageshow',function(){ _resumeMyeongryeAfterBackground(); },true);
function _oaiMyeongryeBackHandle(){
  var modal=document.getElementById('myeongrye-materials-modal'), viewer=modal&&modal.querySelector('.myeongrye-photo-viewer');
  if(viewer&&viewer.classList.contains('open')){ _closeMyeongryePhotoViewer(); return true; }
  if(modal&&modal.classList.contains('open')){ _closeMyeongryeMaterials(); return true; }
  return false;
}
try{ window._oaiMyeongryeBackHandle=_oaiMyeongryeBackHandle; }catch(e){ console.warn('[가톨릭길동무]',e); }
document.addEventListener('keydown',function(e){
  var m=document.getElementById('myeongrye-materials-modal'), viewer=m&&m.querySelector('.myeongrye-photo-viewer');
  if(e.key==='Escape'&&viewer&&viewer.classList.contains('open')){ _closeMyeongryePhotoViewer(); return; }
  if(e.key==='Escape'&&m&&m.classList.contains('open')) _closeMyeongryeMaterials();
  if(viewer&&viewer.classList.contains('open')&&e.key==='ArrowLeft') _moveMyeongryeViewer(-1);
  if(viewer&&viewer.classList.contains('open')&&e.key==='ArrowRight') _moveMyeongryeViewer(1);
});
function prepareExternalUrl(url){
  url = (typeof normalizeCatholicExternalUrl === 'function')
        ? normalizeCatholicExternalUrl(url)
        : String(url || '').trim();
  return url || null;
}
function openCatholicExternalPreserveApp(url, kind){
  url = prepareExternalUrl(url);
  if(!url) return false;
  try{ document.activeElement && document.activeElement.blur && document.activeElement.blur(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{
    sessionStorage.removeItem('catholic_core_return_v1');
    localStorage.removeItem('catholic_core_return_backup_v1');
    sessionStorage.removeItem('oai_external_return_token');
    localStorage.removeItem('oai_external_return_token');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ if(typeof _resetCoverExitReady==='function') _resetCoverExitReady(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ if(typeof _clearCoverExitArmed==='function') _clearCoverExitArmed(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  /* V8-1-14-621: 성지·성당·피정 외부 웹사이트도 웹사이트 카테고리와 같은 보호창 이동 흐름으로 통일한다. */
  try{
    if(typeof oaiSmoothNavigate === 'function'){
      oaiSmoothNavigate(url, kind || 'external-site');
      return true;
    }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ if(typeof markExternalReturnStabilize === 'function') markExternalReturnStabilize(kind || 'external-site'); }catch(e){ console.warn("[가톨릭길동무]", e); }
  setTimeout(function(){
    try{ oaiNavigateExternalNow(url); }catch(e){ try{ location.assign(url); }catch(_e){ try{ location.href = url; }catch(__e){ console.warn('[가톨릭길동무]', __e); } } }
  }, 70);
  return true;
}
function openShrineExternalLikeFaithPortal(url, extra){
  url = prepareExternalUrl(url);
  if(!url) return;
  extra = extra || {};
  /* V8-1-14-621: 성지 상세/홈페이지 외부 링크는 웹사이트 카테고리와 같은 보호창 이동 흐름을 사용한다. */
  openCatholicExternalPreserveApp(url, extra.source || 'shrine-external');
}
function openCoreExternalUrl(url, extra){
  openShrineExternalLikeFaithPortal(url, extra);
}

const DIOCESE_RETURN_KEY='catholic_diocese_external_return_v1';
const DIOCESE_RETURN_TTL_MS=30*60*1000;
var _dioceseExternalRestoreTimer=0;
function _dioceseReturnNow(){
  try{ return Date.now ? Date.now() : new Date().getTime(); }catch(_e){ return new Date().getTime(); }
}
function _normalizeDioceseReturnState(state){
  state = (state && typeof state === 'object') ? state : {};
  if(!Number(state.savedAt || state.ts || 0)) state.savedAt = _dioceseReturnNow();
  return state;
}
function _clearDioceseReturnState(reason){
  try{ sessionStorage.removeItem(DIOCESE_RETURN_KEY); }catch(_e){}
  try{ localStorage.removeItem(DIOCESE_RETURN_KEY); }catch(_e){}
}
function _writeDioceseReturnState(state){
  state = _normalizeDioceseReturnState(state);
  var payload = JSON.stringify(state || {});
  try{ sessionStorage.setItem(DIOCESE_RETURN_KEY, payload); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ localStorage.setItem(DIOCESE_RETURN_KEY, payload); }catch(e){ console.warn('[가톨릭길동무]', e); }
  return state;
}
function _isFreshDioceseReturnState(state){
  try{
    var ts = Number((state && (state.savedAt || state.ts)) || 0);
    if(!ts) return true;
    return (_dioceseReturnNow() - ts) <= DIOCESE_RETURN_TTL_MS;
  }catch(_e){ return true; }
}
function _readDioceseReturnState(){
  var raw=null, state=null;
  try{ raw=sessionStorage.getItem(DIOCESE_RETURN_KEY) || localStorage.getItem(DIOCESE_RETURN_KEY); }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(!raw) return null;
  try{ state=JSON.parse(raw); }catch(e){ state={}; }
  if(!_isFreshDioceseReturnState(state)){
    _clearDioceseReturnState('stale-diocese-return');
    return null;
  }
  return state || {};
}
function _scheduleDioceseExternalRestore(source, delay){
  try{ if(_dioceseExternalRestoreTimer) clearTimeout(_dioceseExternalRestoreTimer); }catch(_e){}
  _dioceseExternalRestoreTimer = setTimeout(function(){
    _dioceseExternalRestoreTimer = 0;
    try{ restoreDioceseExternalState({source:source||'event'}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }, Math.max(0, Number(delay||0)));
}
function openDioceseExternal(url, state){
  url = prepareExternalUrl(url);
  if(!url) return false;
  try{
    state = _writeDioceseReturnState(state || {});
    window.__OAI_DIOCESE_EXTERNAL_LEAVING__ = true;
    var frame=document.getElementById('diocese-frame');
    if(frame && frame.contentWindow){
      try{ frame.contentWindow.__OAI_DIO_EXTERNAL_LEAVING__ = true; frame.contentWindow.__OAI_DIO_EXTERNAL_LEAVING_TS__ = Date.now ? Date.now() : new Date().getTime(); }catch(_e){}
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(typeof oaiOpenExternalSite === 'function'){
      return oaiOpenExternalSite(url, {kind:'diocese-external'});
    }
    if(typeof oaiSmoothNavigate === 'function'){
      return oaiSmoothNavigate(url, 'diocese-external');
    }
  }catch(_e){}
  try{ if(typeof markExternalReturnStabilize === 'function') markExternalReturnStabilize('diocese-external'); }catch(_e){}
  try{ location.assign(url); }
  catch(e){ try{ location.href = url; }catch(_e){ console.warn('[가톨릭길동무]', _e); return false; } }
  return true;
}
window.openDioceseExternal = openDioceseExternal;

function _primeDioceseBackAfterExternalReturn(reason){
  try{
    var view=document.getElementById('diocese-view');
    if(!(view && view.classList && view.classList.contains('open'))) return;
    var root=document.documentElement;
    root.classList.add('app-active');
    root.classList.remove('oai-diocese-returning');
    var cover=document.getElementById('cover');
    if(cover){ cover.style.display='none'; cover.style.opacity='0'; cover.style.pointerEvents='none'; }
    if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(true);
    if(typeof _resetCoverExitReady==='function') _resetCoverExitReady();
    if(typeof _clearCoverExitArmed==='function') _clearCoverExitArmed();
    if(typeof _clearHardCoverExitFlags==='function') _clearHardCoverExitFlags(reason || 'diocese-external-return');
    try{ sessionStorage.removeItem('oai_cover_toast_on_return'); sessionStorage.removeItem('oai_cover_toast_on_return_ts'); }catch(_e){}
    function arm(){
      try{
        if(typeof window._oaiArmCoverBackTrap === 'function'){
          window._oaiArmCoverBackTrap(reason || 'diocese-external-return', {force:true});
        }
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    }
    arm();
    setTimeout(arm, 80);
    setTimeout(arm, 240);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
/* V8-1-13-3: 관구교구 외부페이지 복귀 후 카테고리 뒤로가기 재무장 */
function _finishDioceseExternalReturn(frame){
  try{
    var w = frame && frame.contentWindow;
    if(w){
      w.__OAI_DIO_EXTERNAL_LEAVING__ = false;
      w.__OAI_DIO_PARENT_RETURNING__ = false;
      if(typeof w.oaiReleaseDioceseStability === 'function') w.oaiReleaseDioceseStability({silent:true});
    }
  }catch(_e){}
  _clearDioceseReturnState('diocese-return-finish');
  window.__OAI_DIOCESE_EXTERNAL_LEAVING__ = false;
  window.__OAI_DIOCESE_RESTORING__ = false;
  try{ if(window.oaiReturnConductorFinish) window.oaiReturnConductorFinish('diocese-return'); }catch(_e){}
  try{ _primeDioceseBackAfterExternalReturn('diocese-external-finish'); }catch(_e){}
}
function restoreDioceseExternalState(opts){
  opts = opts || {};
  var state=null;
  if(window.__OAI_DIOCESE_RESTORING__) return false;
  state = _readDioceseReturnState();
  if(!state) return false;
  try{
    if(window.oaiReturnConductorBusy && window.oaiReturnConductorBusy(['diocese-return'])) return false;
    if(window.oaiReturnConductorRequest && !window.oaiReturnConductorRequest('diocese-return', {ms:1900})) return false;
  }catch(_e){}


  try{
    var root=document.documentElement;
    root.classList.remove('oai-diocese-returning');
    var view=document.getElementById('diocese-view');
    var frame=document.getElementById('diocese-frame');
    var alreadyOpen=!!(view && view.classList.contains('open'));
    var frameAlive=!!(frame && frame.contentWindow);

    if(alreadyOpen && frameAlive){
      var preserved=false;
      try{
        var w=frame.contentWindow;
        if(w && typeof w.isDioceseReturnPreserved === 'function') preserved = !!w.isDioceseReturnPreserved(state || {});
        else if(w && w.__OAI_DIO_EXTERNAL_LEAVING__) preserved = true;
      }catch(_e){ preserved=false; }
      if(preserved){
        _finishDioceseExternalReturn(frame);
        return true;
      }
    }

    window.__OAI_DIOCESE_RESTORING__ = true;
    _clearDioceseReturnState('diocese-restore-start');

    function finish(){
      try{ root.classList.remove('oai-diocese-returning'); }catch(_e){}
      window.__OAI_DIOCESE_RESTORING__ = false;
      try{ if(window.oaiReturnConductorFinish) window.oaiReturnConductorFinish('diocese-return'); }catch(_e){}
    }
    function restoreInFrame(){
      try{
        frame=document.getElementById('diocese-frame');
        var w=frame && frame.contentWindow;
        if(w){
          w.__OAI_DIO_EXTERNAL_LEAVING__ = false;
          w.__OAI_DIO_PARENT_RETURNING__ = true;
        }
        if(w && typeof w.restoreDioceseReturnState === 'function'){
          w.restoreDioceseReturnState(state || {});
          try{ _primeDioceseBackAfterExternalReturn('diocese-external-restore'); }catch(_e){}
          setTimeout(function(){ try{ _primeDioceseBackAfterExternalReturn('diocese-external-restore-late'); }catch(_e){} finish(); }, 120);
          return true;
        }
      }catch(e){ console.warn('[가톨릭길동무]', e); }
      return false;
    }

    if(!alreadyOpen && typeof openDioceseView === 'function') openDioceseView({restore:true});
    if(!alreadyOpen && typeof oaiSetMainMapLayerHidden === 'function') oaiSetMainMapLayerHidden(true);
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(restoreInFrame()){ clearInterval(timer); return; }
      if(tries>10){
        clearInterval(timer);
        try{ _primeDioceseBackAfterExternalReturn('diocese-external-restore-fallback'); }catch(_e){}
        finish();
      }
    }, 70);
  }catch(e){ console.warn('[가톨릭길동무]', e); window.__OAI_DIOCESE_RESTORING__ = false; }
  return true;
}
window.addEventListener('pageshow', function(ev){
  try{
    var state=_readDioceseReturnState();
    if(state){
      document.documentElement.classList.remove('oai-diocese-returning');
      var view=document.getElementById('diocese-view');
      var frame=document.getElementById('diocese-frame');
      if(view && view.classList.contains('open') && frame && frame.contentWindow){
        var preserved=false;
        try{
          var w=frame.contentWindow;
          if(w && typeof w.isDioceseReturnPreserved === 'function') preserved = !!w.isDioceseReturnPreserved(state || {});
          else if(w && w.__OAI_DIO_EXTERNAL_LEAVING__) preserved = true;
        }catch(_e){ preserved=false; }
        if(preserved){
          _finishDioceseExternalReturn(frame);
          return;
        }
      }
    }
  }catch(ex){}
  _scheduleDioceseExternalRestore((ev && ev.persisted) ? 'pageshow-persisted' : 'pageshow', 20);
}, true);
try{ window.restoreDioceseExternalState = restoreDioceseExternalState; }catch(_e){}
window.addEventListener('focus', function(){
  _scheduleDioceseExternalRestore('focus', 60);
}, true);
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible'){
    _scheduleDioceseExternalRestore('visible', 80);
  }
}, true);
/* V8-1-14-621: route reset helper is kept without inactive focus/map-entry hooks. */
function clearRouteNoFocus(){
  try{
    if(_mode==='shrine'){
      if(_rS&&_rS.idx>=0&&_markers[_rS.idx]) _markers[_rS.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rS.idx].shrine),false));
      if(_rE&&_rE.idx>=0&&_markers[_rE.idx]) _markers[_rE.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rE.idx].shrine),false));
    }
    _rS=null; _rE=null; _routeMode=false;
    if(typeof _setRouteLabel==='function'){ _setRouteLabel('start',''); _setRouteLabel('end',''); }
    var rs=document.getElementById('rs-result'); if(rs) rs.style.display='none';
    if(typeof _setRouteResultTipVisible==='function') _setRouteResultTipVisible(false);
    var hint=document.getElementById('rs-hint'); if(hint) hint.style.display='block';
    var sBtn=document.getElementById('rs-search-btn'); if(sBtn) sBtn.style.display='flex'; if(typeof _updateSearchBtn==='function') _updateSearchBtn();
    if(_polyline){ _polyline.setMap(null); _polyline=null; }
    if(typeof _clearRouteTmpMarkers==='function') _clearRouteTmpMarkers();
    if(typeof _showJukrimgulParkingMkr==='function') _showJukrimgulParkingMkr(false);
    var guide=document.getElementById('route-guide'); if(guide) guide.classList.remove('on');
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
/* V8-1-14-621: 현재 성지 외부 링크는 웹사이트 카테고리와 같은 보호창 이동 방식이므로 옛 core external return 복원 로직은 제거하고,
   pageshow 시 지도 DOM이 비어 있는 경우에만 기존 지도 재로딩 보호 흐름을 유지한다. */
window.addEventListener('pageshow', function(e){
  setTimeout(()=>{
    if(_screen==='map' && (!_map || !$('map')?.children.length)){
      const reopenTab=_activeTab||'';
      _resetMapState();
      _mapInited=true;
      window._noAutoNearby = true;
      _loadMap();
      setTimeout(()=>{ if(reopenTab) openTab(reopenTab); },700);
    }
  },0);
});

let _SH_RAW = [];

const _DIO={'SE':'서울대교구','SW':'수원교구','DG':'대구대교구','DJ':'대전교구','GJ':'광주대교구','IC':'인천교구','BS':'부산교구','JJ':'전주교구','UJ':'의정부교구','CJ':'청주교구','MS':'마산교구','CC':'춘천교구','WJ':'원주교구','AD':'안동교구','JE':'제주교구','ML':'군종교구'};
const _URL_T={'1':'http://cafe.daum.net/','2':'https://cafe.daum.net/','3':'http://cafe.naver.com/','4':'https://cafe.naver.com/','5':'http://www.','6':'https://www.','7':'http://','8':'https://','P1':'https://www.casuwon.or.kr','P2':'https://www.daegu-archdiocese.or.kr','P3':'https://www.djcatholic.or.kr','P4':'https://www.gjcatholic.or.kr','P5':'http://www.caincheon.or.kr','P6':'https://www.catholicbusan.or.kr','P7':'https://www.jcatholic.or.kr','P8':'http://www.ucatholic.or.kr','P9':'https://www.cdcj.or.kr','PA':'https://cathms.kr','PB':'https://aos.catholic.or.kr','PC':'https://www.diocesejeju.or.kr','PD':'https://www.gunjong.or.kr','PE':'https://sd.uca.or.kr','PR':'https://www.cbck.or.kr/Directory/Retreat/'};
function _decUrl(u){if(!u)return '';const t=_URL_T[u.slice(0,2)];if(t)return t+u.slice(2);const t1=_URL_T[u[0]];return t1?t1+u.slice(1):u;}
function _unpack(raw){return raw.map((r,i)=>({_idx:i,name:r[0],diocese:_DIO[r[1]]||r[1],addr:r[2],tel:r[3]||'',hp:_decUrl(r[4]||''),url:_decUrl(r[5]||''),lat:r[6],lng:r[7]}));}

let PARISHES=[];
let _parishRawLoaded=false;
let _parishDioIndexReady=false;
let _parishDataLoadPromise=null;
let _parishAllDataLoadPromise=null;
const _PARISH_SPLIT_LAZY_MODE=true;

const _PARISH_DIOCESE_ORDER=[
  'SE','IC','SW','UJ','CC','WJ','DJ','CJ',
  'DG','BS','AD','MS','GJ','JJ','JE','ML'
];
const _PARISH_DIOCESE_ASSETS={
  'SE':'parishes-seoul.js',
  'IC':'parishes-incheon.js',
  'SW':'parishes-suwon.js',
  'UJ':'parishes-uijeongbu.js',
  'CC':'parishes-chuncheon.js',
  'WJ':'parishes-wonju.js',
  'DJ':'parishes-daejeon.js',
  'CJ':'parishes-cheongju.js',
  'DG':'parishes-daegu.js',
  'BS':'parishes-busan.js',
  'AD':'parishes-andong.js',
  'MS':'parishes-masan.js',
  'GJ':'parishes-gwangju.js',
  'JJ':'parishes-jeonju.js',
  'JE':'parishes-jeju.js',
  'ML':'parishes-military.js'
};
const _PARISH_DIOCESE_LOAD_STATE={};
const _PARISH_DIOCESE_LOAD_PROMISES={};
/* 성당 데이터 파일도 앱 본문과 같은 빌드 번호로 요청한다.
   이전 고정 번호가 남아 있으면 새 앱을 설치해도 구 교구 목록이 캐시에 남을 수 있다. */
const _PARISH_ASSET_VERSION=(window.OAI_APP_BUILD_VERSION || 'V8-1-14-738');
function _getParishDioceseAsset(code){
  return _PARISH_DIOCESE_ASSETS[code] || null;
}
function _getParishDioceseRawStore(){
  try{ return window._PA_DIO_RAW || null; }catch(e){ console.warn('[가톨릭길동무]', e); }
  return null;
}
function _getParishRawByDioceseCode(code){
  const store=_getParishDioceseRawStore();
  if(store && Array.isArray(store[code])) return store[code];
  const raw=_getLegacyParishRawGlobal();
  if(!Array.isArray(raw) || !code) return [];
  return raw.filter(function(r){ return r && r[1]===code; });
}
function _rememberParishDioceseLoaded(code){
  if(code) _PARISH_DIOCESE_LOAD_STATE[code]=true;
  return _PARISH_DIOCESE_LOAD_STATE;
}
function _isParishDioceseReady(code){
  return !!(code && _PARISH_DIOCESE_LOAD_STATE[code] && _getParishRawByDioceseCode(code).length);
}
function _areAllParishDiocesesReady(){
  return _PARISH_DIOCESE_ORDER.every(function(code){ return _isParishDioceseReady(code); });
}
function _rememberAllParishDiocesesLoadedFromRaw(raw){
  if(!Array.isArray(raw)) return _PARISH_DIOCESE_LOAD_STATE;
  raw.forEach(function(r){
    if(r && r[1]) _rememberParishDioceseLoaded(r[1]);
  });
  return _PARISH_DIOCESE_LOAD_STATE;
}
function _mergeLoadedParishRaw(){
  const merged=[];
  const store=_getParishDioceseRawStore();
  _PARISH_DIOCESE_ORDER.forEach(function(code){
    const part=store && Array.isArray(store[code]) ? store[code] : [];
    if(part.length) merged.push.apply(merged, part);
  });
  return merged;
}
function _getLegacyParishRawGlobal(){
  try{ if(Array.isArray(window._PA_RAW) && window._PA_RAW.length) return window._PA_RAW; }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _PA_RAW!=='undefined' && Array.isArray(_PA_RAW) && _PA_RAW.length) return _PA_RAW; }catch(e){ console.warn('[가톨릭길동무]', e); }
  return null;
}
function _getParishRawGlobal(){
  const legacy=_getLegacyParishRawGlobal();
  if(Array.isArray(legacy) && legacy.length) return legacy;
  const merged=_mergeLoadedParishRaw();
  return merged.length ? merged : null;
}
function _buildParishList(raw){
  raw = Array.isArray(raw) ? raw : [];
  return raw.map((r,i)=>({
    _idx:i,
    name:r[0],
    diocese:_DIO[r[1]]||r[1],
    addr:r[2],
    tel:r[3]||'',
    hp:_decUrl(r[4]||''),
    url:_decUrl(r[5]||''),
    lat:r[6],
    lng:r[7]
  }));
}
function _setParishRawData(raw, loaded){
  raw = Array.isArray(raw) ? raw : [];
  PARISHES=_buildParishList(raw);
  _parishRawLoaded=loaded !== false && raw.length > 0;
  if(_parishRawLoaded) _rememberAllParishDiocesesLoadedFromRaw(raw);
  if(_parishDioIndexReady && typeof _rebuildParishDioIndex==='function') _rebuildParishDioIndex();
  return PARISHES;
}
function _refreshParishDataFromLoadedDioceses(){
  const raw=_getParishRawGlobal() || [];
  return _setParishRawData(raw, raw.length>0);
}
function _initParishDataFromGlobal(){
  return _refreshParishDataFromLoadedDioceses();
}
function _nearbyDistanceLoadingHtml(){
  return '<div class="empty-msg nearby-distance-loading"><span class="nearby-distance-spinner" aria-hidden="true"></span><span class="nearby-distance-title">📍 내 위치 기준 자동차 거리 계산 중</span><span class="nearby-distance-sub">위치 확인 후 가까운 장소를 준비합니다.</span></div>';
}
function _ensureNearbyDistanceLoading(body){
  if(!body) return false;
  try{
    if(body.querySelector && body.querySelector('.nearby-distance-loading')) return false;
  }catch(_e){}
  body.innerHTML=_nearbyDistanceLoadingHtml();
  return true;
}
function _mapLoadingHtml(text){
  return '<div class="map-loading"><div class="map-loading-icon" aria-hidden="true"></div><div class="map-loading-txt">'+(text || '지도를 불러오는 중...')+'</div></div>';
}
function _ensureMapLoading(mapEl, text){
  const layer=$('map-loading-layer');
  if(layer){
    try{
      if(layer.querySelector && layer.querySelector('.map-loading')){
        var txt = layer.querySelector('.map-loading-txt');
        if(txt && text) txt.textContent = text;
      }else{
        layer.innerHTML=_mapLoadingHtml(text);
      }
      layer.classList.add('open');
      layer.setAttribute('aria-hidden','false');
      return true;
    }catch(_e){}
  }
  if(!mapEl) return false;
  try{
    if(mapEl.querySelector && mapEl.querySelector('.map-loading')){
      var txt2 = mapEl.querySelector('.map-loading-txt');
      if(txt2 && text) txt2.textContent = text;
      return false;
    }
  }catch(_e){}
  mapEl.innerHTML=_mapLoadingHtml(text);
  return true;
}
function _categoryMapLoadingText(mode){
  if(mode==='parish') return '성당 지도를 준비하는 중...';
  if(mode==='retreat') return '피정의집 지도를 준비하는 중...';
  return '성지 지도를 준비하는 중...';
}
function _prepareCategoryMapSurface(mode){
  try{
    const wrap=$('map-wrap');
    const mapEl=$('map');
    if(wrap) wrap.classList.add('oai-map-preparing');
    if(mapEl && (mode==='shrine' || mode==='parish' || mode==='retreat')) _ensureMapLoading(mapEl, _categoryMapLoadingText(mode));
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _completeCategoryMapSurface(){
  try{
    const wrap=$('map-wrap');
    const layer=$('map-loading-layer');
    if(wrap) wrap.classList.remove('oai-map-preparing');
    if(layer){
      layer.classList.remove('open');
      layer.setAttribute('aria-hidden','true');
      layer.innerHTML='';
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _bumpMainMapBuildToken(){
  try{
    window.__OAI_MAIN_MAP_BUILD_TOKEN = (Number(window.__OAI_MAIN_MAP_BUILD_TOKEN || 0) || 0) + 1;
    return window.__OAI_MAIN_MAP_BUILD_TOKEN;
  }catch(_e){ return 0; }
}
function _currentMainMapBuildToken(){
  try{ return Number(window.__OAI_MAIN_MAP_BUILD_TOKEN || 0) || 0; }catch(_e){ return 0; }
}
function _isMainMapBuildCurrent(token, mode){
  try{
    return !!(_map && _screen==='map' && _mode===mode && (!token || token===_currentMainMapBuildToken()));
  }catch(_e){ return false; }
}

function _isNearbySheetVisibleForInitialMap(){
  try{
    const sheet=$('sheet-nearby');
    return !!(sheet && sheet.classList.contains('open') && (_activeTab===null || _activeTab==='nearby'));
  }catch(_e){ return false; }
}
function _setParishMapLayerMode(mode, reason){
  try{ if(AppState) AppState.parishMapLayerMode = mode || ''; }catch(_e){}
}
function _bumpParishDioLayerToken(reason){
  try{
    if(AppState){
      AppState.parishDioLayerToken = (Number(AppState.parishDioLayerToken || 0) || 0) + 1;
      return AppState.parishDioLayerToken;
    }
  }catch(_e){}
  window.__OAI_PARISH_DIO_LAYER_TOKEN__ = (Number(window.__OAI_PARISH_DIO_LAYER_TOKEN__ || 0) || 0) + 1;
  return window.__OAI_PARISH_DIO_LAYER_TOKEN__;
}
function _currentParishDioLayerToken(){
  try{ if(AppState) return Number(AppState.parishDioLayerToken || 0) || 0; }catch(_e){}
  return Number(window.__OAI_PARISH_DIO_LAYER_TOKEN__ || 0) || 0;
}
function _isParishDioLayerTokenCurrent(token){
  return !!(!token || token === _currentParishDioLayerToken());
}
function _hasParishNearbyResultLayer(){
  try{
    return !!(_mode==='parish' && Array.isArray(_nearbyCache) && _nearbyCache.length &&
      AppState && Array.isArray(AppState.nearbyParishMarkers) && AppState.nearbyParishMarkers.length);
  }catch(_e){ return false; }
}
function _isParishNearbyMapMode(){
  try{
    if(_mode!=='parish') return false;
    /* V8-1-14-679: Fold 큰 화면에서 내주변 패널이 열린 채 지도 교구명을 누르면
       교구 마커 레이어(dio)를 명시적으로 선택한 상태가 nearby 탭 DOM보다 우선해야 한다.
       그렇지 않으면 _showParishDioMkrs가 nearby로 오인해 방금 선택한 교구 마커를 숨긴다. */
    if(AppState && AppState.parishMapLayerMode === 'dio') return false;
    if(AppState && AppState.parishMapLayerMode === 'nearby') return true;
    if(_activeTab==='nearby') return true;
    if(_hasParishNearbyResultLayer()) return true;
    const sheet=$('sheet-nearby');
    return !!(sheet && sheet.classList.contains('open') && (_activeTab===null || _activeTab==='nearby'));
  }catch(_e){ return false; }
}
function _hideAllParishDioMkrs(){
  try{
    Object.values(_dioMkrs||{}).forEach(function(arr){
      (arr||[]).forEach(function(mk){ try{ _setMarkerMapIfChanged(mk,null); }catch(_e){} });
    });
  }catch(_e){}
  try{
    if(_parishIdleListener){
      kakao.maps.event.removeListener(_parishIdleListener);
      _parishIdleListener=null;
    }
  }catch(_e){}
}
function _clearParishNearbyResults(reason){
  // 주변 성당 레이어를 실제로 종료할 때는 진행 중인 비동기 거리 계산도 함께 무효화한다.
  try{ _cancelNearbyLoad(); }catch(_e){}
  try{ _clearParishNearbyMarkers(); }catch(_e){}
  try{ _nearbyCache=[]; }catch(_e){}
  try{
    if(AppState){
      AppState.nearbyCache=[];
      AppState.nearbyParishDioCode=null;
      AppState.nearbyParishAnchorItem=null;
      AppState.parishMapLayerMode='';
    }
  }catch(_e){}
}
function _clearParishDioLayerForNearby(){
  try{ _bumpParishDioLayerToken('nearby-clear'); }catch(_e){}
  try{ _hideAllParishDioMkrs(); }catch(_e){}
  try{ _markers.forEach(function(m){ if(m&&m.marker) _setMarkerMapIfChanged(m.marker,null); }); }catch(_e){}
  try{ _retreatMarkers.forEach(function(o){ if(o&&o.marker) _setMarkerMapIfChanged(o.marker,null); }); }catch(_e){}
  _activeDio=null;
  // 내주변 모드에서는 현재 교구의 성당 마커만 유지하고, 교구명은 다른 교구에만 표시한다.
  // 교구명 표시 여부는 _syncParishDioLabels 한 곳에서만 결정한다.
  try{ _syncParishDioLabels(); }catch(_e){}
}
function _shouldDeferFullCategoryMarkers(){
  try{
    /* V8-1-14-679:
       성지·피정의집은 내주변 목록과 무관하게 전국 전체 마커가 지도 레이어의 기준이다.
       첫 진입 내주변 시트가 열려 있어도 전체 마커 생성을 미루지 않는다.
       성당만 현재 위치 해당 교구 전용 레이어가 준비될 때까지 공통 전체 마커를 보류한다. */
    return !!(_mode==='parish' && _isNearbySheetVisibleForInitialMap());
  }catch(_e){ return false; }
}
function _clearVisibleCategoryMapObjects(){
  try{ _markers.forEach(function(m){ if(m && m.marker) _setMarkerMapIfChanged(m.marker,null); }); }catch(_e){}
  try{ _retreatMarkers.forEach(function(o){ if(o && o.marker) _setMarkerMapIfChanged(o.marker,null); }); }catch(_e){}
  try{ Object.values(_dioMkrs||{}).forEach(function(arr){ (arr||[]).forEach(function(mk){ _setMarkerMapIfChanged(mk,null); }); }); }catch(_e){}
  try{ _hideDioOverlays(); }catch(_e){}
  try{ _clearParishNearbyMarkers(); }catch(_e){}
  try{ if(_myMkr){ _myMkr.setMap(null); _myMkr=null; } }catch(_e){}
}
function _openInitialNearbyAfterMapStable(buildToken, mapMode){
  setTimeout(function(){
    try{
      if(!_isMainMapBuildCurrent(buildToken,mapMode)) return;
      if(_activeTab!==null && _activeTab!=='nearby') return;
      openTab('nearby');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }, 260);
}
function _finishMapSurfaceAfterFirstPaint(buildToken, mapMode){
  let done=false;
  function finish(){
    if(done) return;
    done=true;
    try{ if(_isMainMapBuildCurrent(buildToken,mapMode)) _completeCategoryMapSurface(); }catch(_e){}
    try{ if(typeof oaiHideCategoryEntryVeil==='function') oaiHideCategoryEntryVeil(); }catch(_e){}
  }
  try{
    if(_map && window.kakao && kakao.maps && kakao.maps.event){
      var idleHandler=null;
      idleHandler=kakao.maps.event.addListener(_map,'idle',function(){
        try{ kakao.maps.event.removeListener(idleHandler); }catch(_e){}
        setTimeout(finish, 40);
      });
    }
  }catch(_e){}
  setTimeout(finish, 680);
}
function _showParishDataLoadingMessage(msg){
  try{
    const listBody=document.getElementById('list-body');
    if(listBody && _mode==='parish') listBody.innerHTML='<div class="empty-msg">'+(msg||'성당 정보를 불러오는 중입니다...')+'</div>';
    const nearbyBody=document.getElementById('nearby-body');
    if(nearbyBody && _mode==='parish' && _activeTab==='nearby'){
      /* V8-1-14-621:
         성당 내주변은 전체 교구 데이터 로딩이 길어져도 첫 로딩 화면을 유지한다.
         여기서 다른 문구로 다시 그리면 사용자에게 같은 로딩 화면이 두 번 나타난 것처럼 보인다. */
      _ensureNearbyDistanceLoading(nearbyBody);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _afterParishDataLoaded(){
  try{
    if(_mode==='parish'){
      if(_activeTab==='list') renderList();
      if(_isParishNearbyMapMode()){
        _clearParishDioLayerForNearby();
        return;
      }
      if(_activeDio) _showParishDioMkrs(_activeDio);
      _syncParishDioLabels();
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _ensureParishDioceseDataLoaded(code){
  if(!code) return Promise.reject(new Error('교구 코드가 없습니다.'));
  if(_isParishDioceseReady(code)) return Promise.resolve(_refreshParishDataFromLoadedDioceses());
  if(_PARISH_DIOCESE_LOAD_PROMISES[code]) return _PARISH_DIOCESE_LOAD_PROMISES[code];
  const asset=_getParishDioceseAsset(code);
  if(!asset) return Promise.reject(new Error('교구 데이터 파일을 찾을 수 없습니다: '+code));
  _PARISH_DIOCESE_LOAD_PROMISES[code]=new Promise(function(resolve,reject){
    const already=document.querySelector('script[data-parish-dio="'+code+'"]');
    function finish(){
      const raw=_getParishRawByDioceseCode(code);
      if(raw && raw.length){
        _rememberParishDioceseLoaded(code);
        resolve(_refreshParishDataFromLoadedDioceses());
      }else{
        reject(new Error('성당 교구 데이터가 비어 있습니다: '+code));
      }
    }
    if(already){
      already.addEventListener('load', finish, {once:true});
      already.addEventListener('error', function(){ reject(new Error('성당 교구 데이터 로드 실패: '+code)); }, {once:true});
      setTimeout(function(){ try{ if(_getParishRawByDioceseCode(code).length) finish(); }catch(_e){} },0);
      return;
    }
    const sc=document.createElement('script');
    sc.src=asset+'?v='+_PARISH_ASSET_VERSION;
    sc.dataset.parishDio=code;
    sc.onload=finish;
    sc.onerror=function(){ reject(new Error('성당 교구 데이터 로드 실패: '+code)); };
    document.head.appendChild(sc);
  }).then(function(result){
    delete _PARISH_DIOCESE_LOAD_PROMISES[code];
    _afterParishDataLoaded();
    return result;
  }).catch(function(err){
    delete _PARISH_DIOCESE_LOAD_PROMISES[code];
    throw err;
  });
  return _PARISH_DIOCESE_LOAD_PROMISES[code];
}
function _ensureAllParishDiocesesLoaded(opts){
  opts=opts||{};
  if(_areAllParishDiocesesReady()) return Promise.resolve(_refreshParishDataFromLoadedDioceses());
  if(_parishAllDataLoadPromise) return _parishAllDataLoadPromise;
  if(!opts.silent) _showParishDataLoadingMessage('전체 성당 정보를 불러오는 중입니다...');
  _parishAllDataLoadPromise=Promise.all(_PARISH_DIOCESE_ORDER.map(function(code){
    return _ensureParishDioceseDataLoaded(code);
  })).then(function(){
    _parishAllDataLoadPromise=null;
    return _refreshParishDataFromLoadedDioceses();
  }).catch(function(err){
    _parishAllDataLoadPromise=null;
    throw err;
  });
  return _parishAllDataLoadPromise;
}
function _ensureParishDataLoaded(){
  if(_parishRawLoaded && PARISHES.length) return Promise.resolve(PARISHES);
  if(_parishDataLoadPromise) return _parishDataLoadPromise;
  _parishDataLoadPromise=_ensureAllParishDiocesesLoaded().catch(function(err){
    _parishDataLoadPromise=null;
    throw err;
  });
  return _parishDataLoadPromise;
}
_initParishDataFromGlobal();

const _PRAYER_ASSET_VERSION='V8-1-14-679';
let _prayerModuleLoadPromise=null;
function _isPrayerDataReady(){
  return !!(window.PRAYER_DATA && typeof window.PRAYER_DATA === 'object');
}
function _isPrayerModuleReady(){
  return _isPrayerDataReady() &&
         typeof window.initPrayerView === 'function' &&
         typeof window.prRenderList === 'function' &&
         typeof window.prAdjustFont === 'function';
}
function _showPrayerLoadingMessage(msg){
  const body=document.getElementById('pr-list-ul');
  if(body) body.innerHTML='<div class="pr-empty">'+(msg||'기도문을 불러오는 중입니다...')+'</div>';
}
function _setPrayerViewLoading(view, on, msg){
  try{
    view = view || document.getElementById('prayer-view');
    if(!view) return;
    view.classList.toggle('prayer-loading', !!on);
    view.setAttribute('aria-busy', on ? 'true' : 'false');
    var loader=document.getElementById('prayer-loading');
    if(loader){
      loader.setAttribute('aria-hidden', on ? 'false' : 'true');
      var text=loader.querySelector('.prayer-loading-text');
      if(text) text.textContent=msg || '기도문을 불러오는 중입니다...';
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _loadPrayerScriptOnce(src, attrName, errMsg){
  return new Promise(function(resolve,reject){
    const existing=document.querySelector('script['+attrName+'="true"]');
    if(existing){
      if(existing.dataset.loaded === 'true') { resolve(true); return; }
      existing.addEventListener('load', function(){ resolve(true); }, {once:true});
      existing.addEventListener('error', function(){ reject(new Error(errMsg)); }, {once:true});
      return;
    }
    const sc=document.createElement('script');
    sc.src=src;
    sc.setAttribute(attrName,'true');
    sc.onload=function(){ sc.dataset.loaded='true'; resolve(true); };
    sc.onerror=function(){ reject(new Error(errMsg)); };
    document.head.appendChild(sc);
  });
}
function ensurePrayerModuleLoaded(){
  if(_isPrayerModuleReady()) return Promise.resolve(true);
  if(_prayerModuleLoadPromise) return _prayerModuleLoadPromise;
  _showPrayerLoadingMessage('기도문을 불러오는 중입니다...');
  _prayerModuleLoadPromise=Promise.resolve()
    .then(function(){
      if(_isPrayerDataReady()) return true;
      return _loadPrayerScriptOnce('prayer-data.js?v='+_PRAYER_ASSET_VERSION, 'data-prayer-data-loader', '기도문 데이터 로드 실패');
    })
    .then(function(){
      if(!_isPrayerDataReady()) throw new Error('기도문 데이터가 준비되지 않았습니다.');
      if(typeof window.initPrayerView === 'function') return true;
      return _loadPrayerScriptOnce('prayer.js?v='+_PRAYER_ASSET_VERSION, 'data-prayer-loader', '기도문 모듈 로드 실패');
    })
    .then(function(){
      if(_isPrayerModuleReady()) return true;
      throw new Error('기도문 모듈이 준비되지 않았습니다.');
    })
    .catch(function(err){
      _prayerModuleLoadPromise=null;
      throw err;
    });
  return _prayerModuleLoadPromise;
}
try{ window.ensurePrayerModuleLoaded=ensurePrayerModuleLoaded; }catch(e){ console.warn('[가톨릭길동무]', e); }

let _RT_RAW = [];
let _retreatRawLoaded = false;
let _retreatDataLoadPromise = null;
const _RETREAT_ASSET_VERSION='V8-1-14-679';

let RETREATS = [];
function _buildRetreatList(raw){
  return _unpack(Array.isArray(raw) ? raw : []);
}
function _getRetreatRawGlobal(){
  try{ if(Array.isArray(window._RT_RAW)) return window._RT_RAW; }catch(e){ console.warn('[가톨릭길동무]', e); }
  return null;
}
function _setRetreatRawData(raw, loaded){
  _RT_RAW = Array.isArray(raw) ? raw : [];
  RETREATS = _buildRetreatList(_RT_RAW);
  _retreatRawLoaded = loaded !== false && _RT_RAW.length > 0;
  return RETREATS;
}
function _initRetreatDataFromGlobal(){
  const raw=_getRetreatRawGlobal();
  return _setRetreatRawData(raw || [], !!raw);
}
function _ensureRetreatDataLoaded(){
  const existingRaw=_getRetreatRawGlobal();
  if(existingRaw && (!_retreatRawLoaded || !RETREATS.length)) _setRetreatRawData(existingRaw, true);
  if(_retreatRawLoaded && RETREATS.length) return Promise.resolve(RETREATS);
  if(_retreatDataLoadPromise) return _retreatDataLoadPromise;
  _retreatDataLoadPromise=new Promise(function(resolve,reject){
    const already=document.querySelector('script[data-retreat-loader="true"],script[src*="retreats.js"]');
    function finish(){
      const raw=_getRetreatRawGlobal();
      if(raw && raw.length){ resolve(_setRetreatRawData(raw, true)); }
      else reject(new Error('피정의집 데이터가 비어 있습니다.'));
    }
    if(already){
      already.addEventListener('load', finish, {once:true});
      already.addEventListener('error', function(){ reject(new Error('피정의집 데이터 로드 실패')); }, {once:true});
      setTimeout(function(){ try{ if(_getRetreatRawGlobal()) finish(); }catch(_e){} }, 0);
      return;
    }
    const sc=document.createElement('script');
    sc.src='retreats.js?v='+_RETREAT_ASSET_VERSION;
    sc.dataset.retreatLoader='true';
    sc.onload=finish;
    sc.onerror=function(){ reject(new Error('피정의집 데이터 로드 실패')); };
    document.head.appendChild(sc);
  }).catch(function(err){
    _retreatDataLoadPromise=null;
    throw err;
  });
  return _retreatDataLoadPromise;
}
try{ window._setRetreatRawData=_setRetreatRawData; }catch(e){ console.warn('[가톨릭길동무]', e); }
_initRetreatDataFromGlobal();
function _getCurrentItems(){return _mode==='shrine'?SHRINES:(_mode==='retreat'?RETREATS:PARISHES);}
function _getModePlaceNoun(mode){
  const m = mode || _mode;
  return m==='shrine' ? '성지' : (m==='retreat' ? '피정의 집' : '성당');
}
function _getModeListTitle(mode){
  const m = mode || _mode;
  return m==='parish' ? '성당찾기' : (m==='retreat' ? '피정의집 찾기' : '성지찾기');
}
function _getModeSearchPlaceholder(mode, context){
  const m = mode || _mode;
  if(m==='parish') return '전국 성당명, 주소 검색';
  return context==='route' ? '이름 또는 장소 입력' : '이름, 주소 검색';
}
function _getModeTypeText(){return _getModePlaceNoun(_mode);}
function _getModeTypeLabel(item){return _mode==='shrine'?item.type:(_mode==='retreat'?'🏔 피정의 집':'⛪ 성당');}
function _itemSearchBlob(item){return String((item&&item.name)||'')+' '+String((item&&item.diocese)||'')+' '+String((item&&item.addr)||'')+' '+String((item&&item.kw)||'');}
function _itemSearchNorm(item){return _itemSearchBlob(item).replace(/\s+/g,'');}
function _normalizePlaceSearchText(value){
  return String(value||'').toLocaleLowerCase().replace(/\s+/g,'').trim();
}
function _placeNameWordStartsWith(name, normalizedQuery){
  if(!normalizedQuery) return false;
  return String(name||'').toLocaleLowerCase().split(/[\s·ㆍ/()\[\]{}_-]+/).some(function(word){
    return _normalizePlaceSearchText(word).startsWith(normalizedQuery);
  });
}
function _placeSearchScore(item, query){
  const q=String(query||'').trim();
  if(!q) return 0;
  const nq=_normalizePlaceSearchText(q);
  if(!nq) return 0;
  const name=String((item&&item.name)||'');
  const nameNorm=_normalizePlaceSearchText(name);
  if(nameNorm===nq) return 0;
  if(nameNorm.startsWith(nq)) return 10;
  if(_placeNameWordStartsWith(name,nq)) return 20;
  if(nameNorm.includes(nq)) return 30;
  const tokens=q.split(/\s+/).map(_normalizePlaceSearchText).filter(Boolean);
  const allNorm=_normalizePlaceSearchText(_itemSearchBlob(item));
  if(tokens.length && tokens.every(function(token){ return allNorm.includes(token); })) return 40;
  return Number.POSITIVE_INFINITY;
}
function _comparePlaceSearchEntries(a,b){
  const scoreDiff=(a.score||0)-(b.score||0);
  if(scoreDiff) return scoreDiff;
  const sourceDiff=(a.sourcePriority||0)-(b.sourcePriority||0);
  if(sourceDiff) return sourceDiff;
  const kindDiff=(a.kindPriority||0)-(b.kindPriority||0);
  if(kindDiff) return kindDiff;
  return String((a.item&&a.item.name)||a.name||'').localeCompare(String((b.item&&b.item.name)||b.name||''),'ko');
}
const _RETREAT_DIO_COLORS={'SE':'#c0392b','IC':'#c0392b','SW':'#c0392b','UJ':'#c0392b','CC':'#1565c0','WJ':'#1565c0','DJ':'#c0392b','CJ':'#1565c0','DG':'#1b7a3e','AD':'#1b7a3e','BS':'#1565c0','MS':'#1b7a3e','GJ':'#1b7a3e','JJ':'#1b7a3e','JE':'#1b7a3e','ML':'#c0392b'};
const OAI_CATHEDRAL_CATEGORY_COLOR = '#3F4752';
const OAI_RETREAT_CATEGORY_COLOR = '#3F6F5A';
const OAI_RETREAT_LIST_DOT_COLOR = '#c0392b';
function _getRetreatColor(item){return OAI_RETREAT_CATEGORY_COLOR;}
function _getModeMarkerColor(item){return _mode==='shrine'?(TC[item.type]||'#555'):(_mode==='retreat'?_getRetreatColor(item):OAI_CATHEDRAL_CATEGORY_COLOR);}
function _getRouteGuideTarget(){return _getModePlaceNoun(_mode);}
const OAI_ROUTE_VISUAL_DELAY_MS = 260;

const JSKEY = (window.APP_CONFIG && window.APP_CONFIG.KAKAO_JS_KEY) || '';
const KAKAO_REST_PROXY_URL = (window.APP_CONFIG && window.APP_CONFIG.KAKAO_REST_PROXY_URL) || '';
(function(){
  if(!JSKEY || !KAKAO_REST_PROXY_URL){
    console.warn(
      '[가톨릭길동무] Kakao 설정이 비어 있습니다.\n' +
      '  JS 키는 도메인 제한 후 공개 코드에 둘 수 있고, REST 호출은 Worker 프록시 URL로 연결해야 합니다.'
    );
  }
})();
function _appendQueryToUrl(url, params){
  const qs = new URLSearchParams(params || {}).toString();
  if(!qs) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + qs;
}
function _kakaoRestProxyUrl(endpoint, params){
  if(!KAKAO_REST_PROXY_URL) return '';
  return _appendQueryToUrl(KAKAO_REST_PROXY_URL, Object.assign({ endpoint: endpoint }, params || {}));
}
function _kakaoRestFetch(endpoint, params){
  const url = _kakaoRestProxyUrl(endpoint, params);
  if(!url) return Promise.reject(new Error('missing kakao rest proxy url'));
  return fetch(url, { method:'GET', credentials:'omit', cache:'no-store' });
}
function _kakaoDirectionsFetch(origin, destination, timeoutMs){
  const params = { origin: origin, destination: destination, priority:'RECOMMEND' };
  if(!timeoutMs || typeof AbortController === 'undefined') return _kakaoRestFetch('directions', params);
  const url = _kakaoRestProxyUrl('directions', params);
  if(!url) return Promise.reject(new Error('missing kakao rest proxy url'));
  const controller = new AbortController();
  const timer = setTimeout(function(){ try{ controller.abort(); }catch(e){} }, timeoutMs);
  return fetch(url, { method:'GET', credentials:'omit', cache:'no-store', signal: controller.signal })
    .finally(function(){ clearTimeout(timer); });
}
function _kakaoKeywordFetch(query, size, page){
  var params = { query: query, size: String(size || 10) };
  if(page) params.page = String(page);
  return _kakaoRestFetch('keyword', params);
}
function _dedupeKakaoDocs(groups, max){
  var seen = {};
  var docs = [];
  (groups || []).forEach(function(list){
    (list || []).forEach(function(d){
      var key = d.id || [d.place_name, d.x, d.y, d.road_address_name || d.address_name || ''].join('|');
      if(seen[key]) return;
      seen[key] = true;
      docs.push(d);
    });
  });
  return docs.slice(0, max);
}
function _kakaoKeywordDocsFromRest(query, max){
  var pages = Math.ceil(max / 15);
  var jobs = [];
  for(var page=1; page<=pages; page++){
    var size = Math.min(15, max - ((page - 1) * 15));
    jobs.push(
      _kakaoKeywordFetch(query, size, page)
        .then(function(r){ return r.json(); })
        .then(function(data){ return (data && data.documents) ? data.documents : []; })
        .catch(function(){ return []; })
    );
  }
  return Promise.all(jobs).then(function(groups){ return _dedupeKakaoDocs(groups, max); });
}
function _kakaoKeywordDocsFromJs(query, max){
  return new Promise(function(resolve){
    try{
      if(!(window.kakao && kakao.maps && kakao.maps.services && kakao.maps.services.Places)){
        resolve([]);
        return;
      }
      var places = new kakao.maps.services.Places();
      var pageLimit = Math.ceil(max / 15);
      var groups = [];
      var pageCount = 0;
      var settled = false;

      function done(){
        if(settled) return;
        settled = true;
        resolve(_dedupeKakaoDocs(groups, max));
      }

      var searchOpts = { size: 15 };
      try{ if(kakao.maps.services.SortBy && kakao.maps.services.SortBy.ACCURACY) searchOpts.sort = kakao.maps.services.SortBy.ACCURACY; }catch(_e){}
      places.keywordSearch(query, function(data, status, pagination){
        try{
          var OK = kakao.maps.services.Status.OK;
          if(status === OK && data && data.length){
            groups.push(data);
            pageCount += 1;
            if(_dedupeKakaoDocs(groups, max).length >= max){ done(); return; }
            if(pagination && pagination.hasNextPage && pageCount < pageLimit){
              setTimeout(function(){
                try{ pagination.nextPage(); }catch(_e){ done(); }
              }, 80);
              return;
            }
          }
        }catch(e){
          console.warn('[가톨릭길동무]', e);
        }
        done();
      }, searchOpts);

      setTimeout(done, 4200);
    }catch(e){
      console.warn('[가톨릭길동무]', e);
      resolve([]);
    }
  });
}
function _kakaoKeywordDocs(query, limit){
  var max = Math.max(1, parseInt(limit || 10, 10) || 10);
  return _kakaoKeywordDocsFromRest(query, max).then(function(restDocs){
    restDocs = restDocs || [];
    if(restDocs.length >= max) return restDocs.slice(0, max);
    return _kakaoKeywordDocsFromJs(query, max).then(function(jsDocs){
      return _dedupeKakaoDocs([restDocs, jsDocs || []], max);
    }).catch(function(){ return restDocs.slice(0, max); });
  }).catch(function(){
    return _kakaoKeywordDocsFromJs(query, max).then(function(jsDocs){ return (jsDocs || []).slice(0, max); });
  });
}

/* V8-1-14-679: 화면에 표시하는 실제 주소(addr)와 차량 길찾기 목적지(navAddr)를 분리한다.
   navAddr는 카드에 노출하지 않고, 도착지/카카오내비를 실행할 때만 좌표로 변환한다. */
const _routeAddressPointCache = Object.create(null);
function _resolveRouteAddressPoint(item){
  const addr=String((item&&item.navAddr)||'').trim();
  if(!addr) return Promise.resolve(null);
  const fixedLat=Number(item&&item.navLat), fixedLng=Number(item&&item.navLng);
  if(Number.isFinite(fixedLat)&&Number.isFinite(fixedLng)) return Promise.resolve({lat:fixedLat,lng:fixedLng});
  if(_routeAddressPointCache[addr]) return _routeAddressPointCache[addr];

  const task=new Promise(function(resolve){
    let settled=false;
    function finish(point){
      if(settled) return;
      settled=true;
      resolve(point&&Number.isFinite(Number(point.lat))&&Number.isFinite(Number(point.lng))
        ? {lat:Number(point.lat),lng:Number(point.lng)} : null);
    }
    function keywordFallback(){
      _kakaoKeywordDocs(addr,5).then(function(docs){
        docs=docs||[];
        const normalized=addr.replace(/\s+/g,'');
        let doc=docs.find(function(d){
          const a=String((d&&d.address_name)||'').replace(/\s+/g,'');
          const r=String((d&&d.road_address_name)||'').replace(/\s+/g,'');
          return a===normalized||r===normalized;
        }) || docs[0];
        if(doc&&doc.y&&doc.x) finish({lat:Number(doc.y),lng:Number(doc.x)});
        else finish(null);
      }).catch(function(){ finish(null); });
    }
    try{
      if(window.kakao&&kakao.maps&&kakao.maps.services&&kakao.maps.services.Geocoder){
        const geocoder=new kakao.maps.services.Geocoder();
        geocoder.addressSearch(addr,function(result,status){
          try{
            const OK=kakao.maps.services.Status.OK;
            if(status===OK&&result&&result[0]&&result[0].y&&result[0].x){
              finish({lat:Number(result[0].y),lng:Number(result[0].x)});
              return;
            }
          }catch(e){ console.warn('[가톨릭길동무]',e); }
          keywordFallback();
        });
      }else keywordFallback();
    }catch(e){
      console.warn('[가톨릭길동무]',e);
      keywordFallback();
    }
    setTimeout(function(){ if(!settled) keywordFallback(); },3500);
    setTimeout(function(){ finish(null); },7000);
  }).then(function(point){
    if(!point) delete _routeAddressPointCache[addr];
    return point;
  });
  _routeAddressPointCache[addr]=task;
  return task;
}
function _resolveNavigationDestinationItem(item){
  if(!item||!item.navAddr) return Promise.resolve(item);
  return _resolveRouteAddressPoint(item).then(function(point){
    if(!point) return Object.assign({},item,{__navResolved:true});
    return Object.assign({},item,{lat:point.lat,lng:point.lng,__navResolved:true});
  }).catch(function(){ return Object.assign({},item,{__navResolved:true}); });
}
const KAKAO_PLACE_SEARCH_DISPLAY_LIMIT = 30;
const TC    = {'성지':'#c0392b','순례지':'#1565c0','순교 사적지':'#1b7a3e'};
const _DIOS=[['all','전체'],['서울대교구','서울'],['인천교구','인천'],['수원교구','수원'],['의정부교구','의정부'],['춘천교구','춘천'],['원주교구','원주'],['대전교구','대전'],['청주교구','청주'],['대구대교구','대구'],['안동교구','안동'],['부산교구','부산'],['마산교구','마산'],['광주대교구','광주'],['전주교구','전주'],['제주교구','제주'],['군종교구','군종']];
const _MY_DIOCESE_STORAGE_KEY='oai_my_diocese_name';
function _getMyDioceseName(){
  try{return (localStorage.getItem(_MY_DIOCESE_STORAGE_KEY)||'').trim();}
  catch(e){return '';}
}
function _isMyDioceseName(name){
  const my=_getMyDioceseName();
  return !!(my&&name&&String(name).trim()===my);
}
function _getDioceseOrderIndex(name){
  const idx=_DIOS.findIndex(function(x){return x&&x[0]===name;});
  return idx<0?999:idx;
}
function _sortDioceseNamesWithMyFirst(names){
  const my=_getMyDioceseName();
  return names.slice().sort(function(a,b){
    if(my){
      const ar=String(a||'')===my?0:1;
      const br=String(b||'')===my?0:1;
      if(ar!==br)return ar-br;
    }
    return _getDioceseOrderIndex(a)-_getDioceseOrderIndex(b);
  });
}
function _getDioFilterEntries(){
  const my=_getMyDioceseName();
  if(!my)return _DIOS.slice();
  const first=_DIOS[0];
  const rest=_DIOS.slice(1);
  const myEntry=rest.find(function(x){return x&&x[0]===my;});
  if(!myEntry)return _DIOS.slice();
  return [first,myEntry].concat(rest.filter(function(x){return !(x&&x[0]===my);}));
}
function _scrollDioFilterButtonIntoView(btn, behavior){
  try{
    if(!btn) return;
    const wrap=btn.parentElement;
    if(!wrap) return;
    const target=Math.max(0, btn.offsetLeft - Math.max(0,(wrap.clientWidth-btn.offsetWidth)/2));
    if(typeof wrap.scrollTo==='function') wrap.scrollTo({left:target,behavior:behavior||'smooth'});
    else wrap.scrollLeft=target;
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}
function _renderDioFilterBars(){
  const fb=$('list-filter-bar'), sm=$('sm-filter-bar');
  if(!fb||!sm)return;
  const entries=_getDioFilterEntries();
  fb.innerHTML='';
  sm.innerHTML='';
  entries.forEach(function(pair,i){
    const v=pair[0], l=pair[1];
    const active=(_filterDio===v)||(!_filterDio&&i===0);
    const on=(_smDio===v)||(!_smDio&&i===0);
    const myCls=_isMyDioceseName(v)?' my-diocese-filter':'';
    const myLabel=_isMyDioceseName(v)?'<span class="filter-my-dio-badge">나의 교구</span>':'';
    fb.innerHTML+=`<button class="filter-btn${active?' active':''}${myCls}" onclick="setDioFilter('${v}',this)">${l}${myLabel}</button>`;
    sm.innerHTML+=`<button class="sm-fb${on?' on':''}${myCls}" onclick="setSmDio('${v}',this)">${l}${myLabel}</button>`;
  });
  setTimeout(function(){
    _scrollDioFilterButtonIntoView(fb.querySelector('.filter-btn.active'),'auto');
    _scrollDioFilterButtonIntoView(sm.querySelector('.sm-fb.on'),'auto');
  },0);
}

const _SU='https://www.cbck.or.kr/Catholic/Shrine/Read?seq=';
const _navCache = new Map();
const _navInflight = new Map();
const _NAV_CONCURRENCY = 5;
const OAI_NEARBY_LIST_LIMIT = 10;
const OAI_NEARBY_ROUTE_DISTANCE_LIMIT = OAI_NEARBY_LIST_LIMIT;
const OAI_REGION_ROUTE_CANDIDATE_LIMIT = 15;
const OAI_ROUTE_RESULT_LIMIT = 10;
const OAI_NEARBY_ROUTE_BATCH_CONCURRENCY = 5;
const OAI_NEARBY_ROUTE_TIMEOUT_MS = 2200;
const OAI_MY_LOCATION_MARKER_ZINDEX = 1200;
let _navActive = 0;
const _navQueue = [];
let _suppressNextRouteGuide = false;

function _normalizeRouteCachePoint(point){
  const parts=String(point||'').split(',');
  if(parts.length!==2) return String(point||'');
  const lng=Number(parts[0]), lat=Number(parts[1]);
  if(!isFinite(lng)||!isFinite(lat)) return String(point||'');
  return `${lng.toFixed(5)},${lat.toFixed(5)}`;
}
function _routeDistanceCacheKey(origin,dest){
  return `${_normalizeRouteCachePoint(origin)}→${_normalizeRouteCachePoint(dest)}`;
}
function _navFetch(origin, dest) {
  const key = _routeDistanceCacheKey(origin,dest);
  if (_navCache.has(key)) return Promise.resolve(_navCache.get(key));
  if (_navInflight.has(key)) return _navInflight.get(key);
  const promise = new Promise((resolve) => {
    function run() {
      _navActive++;
      _kakaoDirectionsFetch(origin, dest, OAI_NEARBY_ROUTE_TIMEOUT_MS)
        .then(r => r.json())
        .then(data => {
          const route = data.routes?.[0];
          const val = (route && route.result_code === 0)
            ? { km: route.summary.distance / 1000, dur: route.summary.duration }
            : null;
          if (val) _navCache.set(key, val);
          resolve(val);
        })
        .catch(() => resolve(null))
        .finally(() => {
          _navActive--;
          if (_navQueue.length) _navQueue.shift()();
        });
    }
    if (_navActive < _NAV_CONCURRENCY) run();
    else _navQueue.push(run);
  }).then(function(val){
    _navInflight.delete(key);
    return val;
  }, function(err){
    _navInflight.delete(key);
    return null;
  });
  _navInflight.set(key, promise);
  return promise;
}

function _runRouteDistanceQueue(prelim, originLat, originLng, getItem, isCurrent, onComplete){
  prelim = Array.isArray(prelim) ? prelim : [];
  const results = new Array(prelim.length).fill(null);
  if(!prelim.length){
    if(typeof onComplete === 'function') onComplete(results);
    return;
  }
  let done=0, active=0, cursor=0;
  const maxConcurrent=Math.max(1, Math.min(OAI_NEARBY_ROUTE_BATCH_CONCURRENCY, prelim.length));
  function stillCurrent(){
    try{ return !isCurrent || isCurrent() !== false; }
    catch(_e){ return false; }
  }
  function finishOne(){
    done++;
    if(done===prelim.length){
      if(stillCurrent() && typeof onComplete === 'function') onComplete(results);
      return;
    }
    pump();
  }
  function pump(){
    if(!stillCurrent()) return;
    while(active<maxConcurrent && cursor<prelim.length){
      const i=cursor++;
      const row=prelim[i];
      const item=(typeof getItem==='function') ? getItem(row) : row;
      if(!item || !item.lat || !item.lng){
        results[i]=null;
        finishOne();
        continue;
      }
      active++;
      _navFetch(`${originLng},${originLat}`,`${item.lng},${item.lat}`)
        .then(val=>{ results[i]=val||{km:(row&&row.d?row.d:0)*1.35,dur:null}; })
        .catch(()=>{ results[i]={km:(row&&row.d?row.d:0)*1.35,dur:null}; })
        .finally(()=>{ active--; finishOne(); });
    }
  }
  pump();
}
function _placeText(v){ return _regionHtmlEsc(v == null ? '' : v); }
function _placeShort(v, max){
  v=String(v == null ? '' : v);
  max=max||26;
  return _placeText(v.length>max ? v.substring(0,max)+'…' : v);
}
function _renderPlaceDistanceRow(item, idx, order, kind, routeInfo, fallbackKm, opts){
  opts=opts||{};
  const mode=opts.mode || _mode;
  const c=opts.color || _getModeMarkerColor(item);
  const lbl=opts.label || _getModeTypeLabel(item);
  const rowClass=(kind==='region'?'region-item':'nearby-item') + ((mode==='shrine'&&_isVisitedShrine(item))?' shrine-visited-card':'');
  const clickFrom=(kind==='region')?'fromRegion':'fromNearby';
  const kmVal=(routeInfo&&isFinite(routeInfo.km))?routeInfo.km:(isFinite(fallbackKm)?fallbackKm:null);
  const isEst=!!opts.estimate;
  const distTxt=kmVal==null?'':(isEst?'~'+kmVal.toFixed(1)+'km':'🚗'+kmVal.toFixed(1)+'km');
  const dur=(!isEst && routeInfo && routeInfo.dur)?`<span style="font-size:10px;color:#aaa;font-weight:400;margin-left:3px">${_fmtTime(routeInfo.dur)}</span>`:'';
  const numExtra=(kind==='region')?'width:28px;height:28px;font-size:12px':'';
  return `<div class="${rowClass}" onclick="selectItem(${idx},{${clickFrom}:true})"><div class="nearby-num" style="background:${c}!important;${numExtra}">${order+1}</div><div class="nearby-info"><div class="nearby-name">${_placeText(item&&item.name||'')}${mode==='shrine'?_shrineNewBadgeHtml(item):''}</div><div class="nearby-addr">${_placeShort(item&&item.addr||'',26)}</div>${mode==='shrine'?_shrineVisitBadgeHtml(item,kind==='region'?'region':'nearby'):''}</div><div class="nearby-meta"><div class="nearby-type" style="background:${c}18!important;color:${c}!important">${_placeText(lbl)}</div>${distTxt?`<div class="nearby-dist" style="color:${isEst?'#aaa':c}!important">${distTxt}${dur}</div>`:''}</div></div>`;
}
function _renderPlaceListRowHtml(item, idx, opts){
  opts=opts||{};
  const mode=opts.mode || _mode;
  const c=opts.color || _getModeMarkerColor(item);
  const dotColor = opts.dotColor || ((mode==='retreat') ? OAI_RETREAT_LIST_DOT_COLOR : c);
  const typeLabel = opts.label || (mode==='shrine' ? (item&&item.type||'성지') : (mode==='retreat' ? '피정의 집' : '성당'));
  const rowClass='list-item' + ((mode==='shrine'&&_isVisitedShrine(item))?' shrine-visited-card':'');
  const pilgrimBtn = mode==='shrine' ? `<button type="button" class="li-pilgrim-register" data-shrine-idx="${idx}">순례등록</button>` : '';
  return `<div class="${rowClass}" onclick="selectItem(${idx})"><div class="li-dot" style="background:${dotColor}"></div><div class="li-info"><div class="li-name">${_placeText(item&&item.name||'')}${mode==='shrine'?_shrineNewBadgeHtml(item):''}</div><div class="li-sub">${_placeShort(item&&item.addr||'',28)}</div>${mode==='shrine'?_shrineVisitBadgeHtml(item,'list'):''}</div><div class="li-side"><span class="li-badge" style="background:${c}18!important;color:${c}!important">${_placeText(typeLabel)}</span>${pilgrimBtn}</div></div>`;
}
function _beginRegionLoad(){
  try{
    AppState.regionLoadToken = (AppState.regionLoadToken || 0) + 1;
    return AppState.regionLoadToken;
  }catch(e){
    window.__oaiRegionLoadToken = (window.__oaiRegionLoadToken || 0) + 1;
    return window.__oaiRegionLoadToken;
  }
}
function _cancelRegionLoad(){ _beginRegionLoad(); }
function _isRegionLoadCurrent(mode, token, body){
  try{
    if(mode && _mode !== mode) return false;
    if(_screen !== 'map') return false;
    if(token && AppState && AppState.regionLoadToken !== token) return false;
    if(body && body !== $('region-body')) return false;
    return true;
  }catch(e){ return false; }
}

const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);
const _GEO=navigator.geolocation;
// V8-1-14-621: 오래 미사용 후 복귀 시 마지막 위치를 먼저 보여주고, 새 GPS가 잡히면 최신 위치로 교체한다.
const _GO1={enableHighAccuracy:true,timeout:6500,maximumAge:0};
const _GO2={enableHighAccuracy:false,timeout:1200,maximumAge:60000};
const _GO_FAST_FRESH={enableHighAccuracy:false,timeout:2500,maximumAge:120000};
const _GO_ACCURATE_FRESH={enableHighAccuracy:true,timeout:6500,maximumAge:0};
const OAI_LAST_LOC_KEY='oai_recent_my_location_v95';
const OAI_LOCATION_CACHE_MAX_MS=12*60*60*1000;
const OAI_LOCATION_STALE_FALLBACK_DELAY_MS=2600;
/* 내주변 거리 계산은 저장 위치/이전 위치가 아니라 실제 현재 위치만 기준으로 삼는다. */
const _GO_NEARBY_FRESH={enableHighAccuracy:true,timeout:5500,maximumAge:0};
const _GO_NEARBY_FRESH_FALLBACK={enableHighAccuracy:false,timeout:1800,maximumAge:0};
function _readRecentStoredLocation(maxAgeMs){
  try{
    const raw=localStorage.getItem(OAI_LAST_LOC_KEY)||'';
    if(!raw) return null;
    const o=JSON.parse(raw);
    const lat=Number(o&&o.lat), lng=Number(o&&o.lng), ts=Number(o&&o.ts||0);
    const n=Date.now ? Date.now() : new Date().getTime();
    if(!lat||!lng||!ts||Math.abs(lat)>90||Math.abs(lng)>180) return null;
    if((n-ts)>(maxAgeMs||OAI_LOCATION_CACHE_MAX_MS)) return null;
    return {lat:lat,lng:lng,ts:ts};
  }catch(_e){ return null; }
}
function _saveRecentStoredLocation(lat,lng){
  try{
    if(!lat||!lng) return;
    localStorage.setItem(OAI_LAST_LOC_KEY, JSON.stringify({lat:Number(lat),lng:Number(lng),ts:(Date.now?Date.now():new Date().getTime())}));
  }catch(_e){}
}
function _useStoredLocationIfAny(apply,maxAgeMs){
  try{
    const saved=_readRecentStoredLocation(maxAgeMs||OAI_LOCATION_CACHE_MAX_MS);
    if(!saved) return false;
    _myLat=saved.lat; _myLng=saved.lng; _myLocAt=saved.ts;
    try{ if(AppState){ AppState.myLocAt=_myLocAt; } }catch(_e){}
    if(typeof apply==='function') apply(saved.lat,saved.lng,true);
    return true;
  }catch(_e){ return false; }
}
function _refreshFreshLocationThen(apply,fail){
  if(!_GEO){ if(fail) fail({code:0}); return; }
  _getFreshGeoPosition(function(p){
    const lat=p.coords.latitude, lng=p.coords.longitude;
    _setMyLoc(lat,lng);
    if(typeof apply==='function') apply(lat,lng,false);
  }, fail || function(){});
}
function _getNearbyFreshGeoPosition(success, fail){
  if(!_GEO){ if(fail) fail({code:0}); return; }
  let done=false;
  function ok(p){
    if(done) return;
    done=true;
    if(success) success(p);
  }
  function bad(e1){
    if(done) return;
    try{
      _GEO.getCurrentPosition(ok,function(e2){
        if(done) return;
        done=true;
        if(fail) fail(e2 || e1);
      },_GO_NEARBY_FRESH_FALLBACK);
    }catch(e){
      if(!done){
        done=true;
        if(fail) fail(e1 || e);
      }
    }
  }
  try{
    _GEO.getCurrentPosition(ok,bad,_GO_NEARBY_FRESH);
  }catch(e){ bad(e); }
}
const _EC=encodeURIComponent;
const _NS='xmlns="http://www.w3.org/2000/svg"';
const _svgUrl=s=>'data:image/svg+xml;charset=utf-8,'+_EC(s);
const _oaiMarkerImageCache = new Map();
const OAI_MARKER_IMAGE_CACHE_LIMIT = 80;
function _oaiMarkerImageCached(key, maker){
  try{
    if(key && _oaiMarkerImageCache.has(key)) return _oaiMarkerImageCache.get(key);
    const img = maker();
    if(key && img){
      if(_oaiMarkerImageCache.size >= OAI_MARKER_IMAGE_CACHE_LIMIT){
        const firstKey = _oaiMarkerImageCache.keys().next().value;
        if(firstKey) _oaiMarkerImageCache.delete(firstKey);
      }
      _oaiMarkerImageCache.set(key,img);
    }
    return img;
  }catch(_e){ return maker(); }
}
function _getMarkerActualMap(marker){
  try{
    if(marker && typeof marker.getMap === 'function') return marker.getMap();
  }catch(_e){}
  return undefined;
}
function _setMarkerMapIfChanged(marker, map){
  if(!marker) return;
  try{
    const actual = _getMarkerActualMap(marker);
    if(actual !== undefined && actual === map){ marker.__oaiMapTarget = map; return; }
    /* V8-1-14-621: 일부 Kakao Marker는 getMap이 없어 __oaiMapTarget만 남는데,
       다른 경로에서 setMap(null)이 실행되면 이 값이 실제와 달라져 마커가 복원되지 않는다.
       getMap 확인이 불가능한 경우에는 안전하게 setMap을 다시 호출한다. */
    marker.setMap(map);
    marker.__oaiMapTarget=map;
  }catch(e){
    try{ marker.setMap(map); marker.__oaiMapTarget=map; }
    catch(e2){ console.warn('[가톨릭길동무]', e2); }
  }
}
function _forceMarkerMap(marker, map){
  if(!marker) return;
  try{
    marker.setMap(map);
    marker.__oaiMapTarget=map;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}


function _setMarkerImageIfChanged(marker, img, key){
  if(!marker || !img) return;
  try{
    if(key && marker.__oaiImgKey===key) return;
    marker.setImage(img);
    if(key) marker.__oaiImgKey=key;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _setMarkerZIfChanged(marker, z){
  if(!marker || z==null) return;
  try{
    if(marker.__oaiZIndex===z) return;
    marker.setZIndex(z);
    marker.__oaiZIndex=z;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
const _isMob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const _isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const _TY={'A':'성지','B':'순례지','C':'순교 사적지'};

let _myLocAt = 0;
let _shrineRawLoaded = false;
let _shrineDataLoadPromise = null;
const _SHRINE_ASSET_VERSION='V8-1-14-693';
/* 성지 좌표는 남한 본토·제주·도서 지역 전체를 포함하는 한 기준으로만 검사한다.
   실제 데이터 경계보다 여유를 두어 강원 북부와 동해 도서 좌표가 상한에서 누락되지 않게 한다. */
const OAI_SOUTH_KOREA_COORD_BOUNDS=Object.freeze({
  minLat:32.5,
  maxLat:39.0,
  minLng:124.0,
  maxLng:132.5
});
function _isSouthKoreaCoordinate(lat,lng){
  const y=Number(lat), x=Number(lng);
  const b=OAI_SOUTH_KOREA_COORD_BOUNDS;
  return Number.isFinite(y) && Number.isFinite(x) &&
    y>=b.minLat && y<=b.maxLat && x>=b.minLng && x<=b.maxLng;
}
let SHRINES = [];
let JUKRIMGUL_IDX = -1;
let _shrineGpsAddrResolveTimer = null;
let _shrineGpsAddrResolveAttempts = 0;
function _resolveShrineGpsAddressPoints(){
  try{
    const pending=[];
    (Array.isArray(SHRINES)?SHRINES:[]).forEach(function(s){
      if(!s || !Array.isArray(s.gpsPoints)) return;
      s.gpsPoints.forEach(function(p){
        if(!p || !p.addr) return;
        if(Number(p.lat) && Number(p.lng)) return;
        if(p.__oaiResolving) return;
        pending.push(p);
      });
    });
    if(!pending.length) return;
    if(!(window.kakao&&kakao.maps&&kakao.maps.services&&kakao.maps.services.Geocoder)){
      if(_shrineGpsAddrResolveAttempts<20){
        _shrineGpsAddrResolveAttempts++;
        clearTimeout(_shrineGpsAddrResolveTimer);
        _shrineGpsAddrResolveTimer=setTimeout(_resolveShrineGpsAddressPoints,1000);
      }
      return;
    }
    _shrineGpsAddrResolveAttempts=0;
    const geocoder=new kakao.maps.services.Geocoder();
    pending.forEach(function(p){
      p.__oaiResolving=true;
      geocoder.addressSearch(String(p.addr),function(result,status){
        try{
          if(status===kakao.maps.services.Status.OK&&result&&result[0]){
            const lat=Number(result[0].y), lng=Number(result[0].x);
            if(Number.isFinite(lat)&&Number.isFinite(lng)){ p.lat=lat; p.lng=lng; }
          }
        }catch(e){ console.warn('[가톨릭길동무]',e); }
        p.__oaiResolving=false;
      });
    });
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}
function _decodeShrineHomePage(hp){
  if(!hp) return '';
  if(_URL_T[hp.slice(0,2)]) return _URL_T[hp.slice(0,2)] + hp.slice(2);
  if(_URL_T[hp[0]]) return _URL_T[hp[0]] + hp.slice(1);
  return hp;
}
const OAI_NEW_SHRINE_URL_FIXES={};
function _applyNewShrineUrlFix(s){
  try{
    if(!s || !s.isNew || !s.name) return s;
    const fix=OAI_NEW_SHRINE_URL_FIXES[String(s.name)]||null;
    if(!fix) return s;
    if(fix.hp) s.hp=fix.hp; else delete s.hp;
    if(fix.guideUrl) s.guideUrl=fix.guideUrl; else delete s.guideUrl;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return s;
}
function _buildShrineList(raw){
  return (Array.isArray(raw) ? raw : []).map(function(src){
    const s = _applyNewShrineUrlFix(Object.assign({}, src));
    if(s.hp) s.hp = _decodeShrineHomePage(s.hp);
    if(s.guideUrl) s.guideUrl = _decodeShrineHomePage(s.guideUrl);
    if(_DIO[s.diocese]) s.diocese = _DIO[s.diocese];
    if(_TY[s.type]) s.type = _TY[s.type];
    return s;
  });
}
function _getShrineRawGlobal(){
  try{ if(Array.isArray(window._SH_RAW)) return window._SH_RAW; }catch(e){ console.warn('[가톨릭길동무]', e); }
  return null;
}
function _rebuildShrineSpecialIndexes(){
  try{ JUKRIMGUL_IDX = SHRINES.findIndex(function(s){ return s && s.name === '죽림굴'; }); }catch(e){ JUKRIMGUL_IDX = -1; }
}
function _setShrineRawData(raw, loaded){
  _SH_RAW = Array.isArray(raw) ? raw : [];
  SHRINES = _buildShrineList(_SH_RAW);
  _shrineRawLoaded = loaded !== false && _SH_RAW.length > 0;
  _rebuildShrineSpecialIndexes();
  setTimeout(_resolveShrineGpsAddressPoints,0);
  return SHRINES;
}
function _initShrineDataFromGlobal(){
  const raw = _getShrineRawGlobal();
  return _setShrineRawData(raw || _SH_RAW || [], !!(raw || (_SH_RAW && _SH_RAW.length)));
}
function _ensureShrineDataLoaded(){
  const existingRaw=_getShrineRawGlobal();
  if(existingRaw && (!_shrineRawLoaded || !SHRINES.length)) _setShrineRawData(existingRaw, true);
  if(_shrineRawLoaded && SHRINES.length) return Promise.resolve(SHRINES);
  if(_shrineDataLoadPromise) return _shrineDataLoadPromise;
  _shrineDataLoadPromise=new Promise(function(resolve,reject){
    const already=document.querySelector('script[data-shrine-loader="true"],script[src*="shrines.js"]');
    function finish(){
      const raw=_getShrineRawGlobal();
      if(raw && raw.length){ resolve(_setShrineRawData(raw, true)); }
      else reject(new Error('성지 데이터가 비어 있습니다.'));
    }
    if(already){
      already.addEventListener('load', finish, {once:true});
      already.addEventListener('error', function(){ reject(new Error('성지 데이터 로드 실패')); }, {once:true});
      setTimeout(function(){ try{ if(_getShrineRawGlobal()) finish(); }catch(_e){} }, 0);
      return;
    }
    const sc=document.createElement('script');
    sc.src='shrines.js?v='+_SHRINE_ASSET_VERSION;
    sc.dataset.shrineLoader='true';
    sc.onload=finish;
    sc.onerror=function(){ reject(new Error('성지 데이터 로드 실패')); };
    document.head.appendChild(sc);
  }).catch(function(err){
    _shrineDataLoadPromise=null;
    throw err;
  });
  return _shrineDataLoadPromise;
}
try{ window._setShrineRawData = _setShrineRawData; }catch(e){ console.warn('[가톨릭길동무]', e); }
_initShrineDataFromGlobal();
const OAI_MAX_ROUTE_WAYPOINTS = 5;
const OAI_ROUTE_WAYPOINT_COLORS = ['#f39c12','#d97706','#b45309','#92400e','#78350f'];
const OAI_ROUTE_WAYPOINT_CONFIGS = Array.from({length:OAI_MAX_ROUTE_WAYPOINTS}, function(_unused,zeroIndex){
  const index=zeroIndex+1;
  const suffix=index===1 ? '' : String(index);
  return {
    role:'waypoint'+suffix,
    pointKey:'_rW'+suffix,
    enabledKey:'_routeWaypoint'+suffix+'Enabled',
    tmpMarkerKey:'_way'+suffix+'TmpMkr',
    color:OAI_ROUTE_WAYPOINT_COLORS[zeroIndex] || '#78350f'
  };
});

const AppState = {
  map:              null,   // Kakao 지도 인스턴스
  markers:          [],     // 성지/성당 마커 배열
  retreatMarkers:   [],     // 피정의 집 마커 배열
  myMkr:            null,   // 내 위치 마커
  myLat:            null,   // 내 위치 위도
  myLng:            null,   // 내 위치 경도
  myLocAt:          0,      // 내 위치를 마지막으로 새로 받은 시각
  jukrimgulParkMkr: null,   // 죽림굴 주차장 마커
  startTmpMkr:      null,   // 출발지 임시 마커
  endTmpMkr:        null,   // 도착지 임시 마커
  wayTmpMkr:        null,   // 경유지1 임시 마커
  way2TmpMkr:       null,   // 경유지2 임시 마커
  way3TmpMkr:       null,   // 경유지3 임시 마커
  way4TmpMkr:       null,   // 경유지4 임시 마커
  way5TmpMkr:       null,   // 경유지5 임시 마커
  paSelMkr:         null,   // parish/retreat 선택 마커
  selIdx:           -1,     // 현재 선택된 shrine 마커 인덱스
  polyline:         null,   // 경로 폴리라인

  mode:       'shrine',  // 'shrine' | 'parish' | 'retreat'
  screen:     'cover',   // 'cover' | 'map'
  activeTab:  null,      // 현재 열린 탭 이름

  filterDio:  'all',     // 교구 필터
  listSrch:   '',        // 목록 검색어

  regionLat:       null,
  regionLng:       null,
  regionName:      '',
  regionPlaceName: '',
  regionCache:     [],   // 지역검색 결과 캐시
  regionMarker:    null, // 지역검색 선택 장소 보라색 마커
  regionResultMarkers: [], // 성당 지역검색 결과 전용 임시 마커

  nearbyCache: [],       // 내주변 결과 캐시
  nearbyParishMarkers: [], // 성당 첫 진입/내주변 전용 마커
  nearbyLoadToken: 0,    // 내주변 비동기 거리 계산 최신 요청 번호
  parishMapLayerMode: '', // 성당 지도 표시 모드: nearby | dio | labels
  parishDioLayerToken: 0, // 성당 교구 마커 비동기 표시 취소용 토큰

  routeMode:        false,
  rS:               null,  // 출발지 {lat, lng, name, idx}
  rW:               null,  // 경유지1 {lat, lng, name, idx}
  routeWaypointEnabled: false, // 경유지1 박스 표시 여부
  rW2:              null,  // 경유지2 {lat, lng, name, idx}
  routeWaypoint2Enabled: false, // 경유지2 박스 표시 여부
  rW3:              null,  // 경유지3 {lat, lng, name, idx}
  routeWaypoint3Enabled: false, // 경유지3 박스 표시 여부
  rW4:              null,  // 경유지4 {lat, lng, name, idx}
  routeWaypoint4Enabled: false, // 경유지4 박스 표시 여부
  rW5:              null,  // 경유지5 {lat, lng, name, idx}
  routeWaypoint5Enabled: false, // 경유지5 박스 표시 여부
  rE:               null,  // 도착지
  routeRegionStart: null,  // 지역검색에서 길찾기 시작 시 출발지 보존
  routeStartMarkerExplicitCurrent: false, // 길찾기 탭의 '현위치' 버튼을 눌렀을 때만 출발지 임시 마커 표시

  smRole: 'start',
  smDio:  'all',

  curInfoItem:   null,   // 현재 열린 인포카드 아이템
  curFromRegion: false,  // 인포카드가 지역검색에서 열렸는지
  pendingShrineMapTargetIdx: -1, // 순례 상세의 '지도에서 보기'가 지도 준비 후 적용할 성지 인덱스
  pendingShrineMapTargetToken: 0, // 비동기 지도/마커 준비 중 이전 요청을 무효화하는 번호
  shrineMapTargetCenterLockUntil: 0, // 늦게 도착한 자동 현재위치가 선택 성지 중심을 덮지 못하게 하는 시각

  kakaoLaunching: false,
  mapInited:      false,

  exitReady: false,
  exitTimer: null,

  dioMkrs:            {},   // code → [Marker, ...]
  dioOverlays:        {},   // code → CustomOverlay
  activeDio:          null, // 현재 마커 펼쳐진 교구 코드
  parishSysInited:    false,
  parishIdleListener: null, // 뷰포트 필터링용 idle 이벤트 리스너
  parishDioUserZoomTouched: false, // 사용자가 성당 교구 지도에서 직접 확대/축소했는지
  parishDioProgrammaticMoveUntil: 0, // 앱이 조정한 줌 변경을 사용자 조작으로 오인하지 않기 위한 보호 시간

  smPlaceDebounce: null,
  smTab: 'all',  // 'all' | 'cat' | 'place'
};

(function installStateProxy() {
  const map = [
    ['_map',              'map'],
    ['_markers',          'markers'],
    ['_retreatMarkers',   'retreatMarkers'],
    ['_myMkr',            'myMkr'],
    ['_myLat',            'myLat'],
    ['_myLng',            'myLng'],
    ['_jukrimgulParkMkr', 'jukrimgulParkMkr'],
    ['_startTmpMkr',      'startTmpMkr'],
    ['_endTmpMkr',        'endTmpMkr'],
    ['_wayTmpMkr',        'wayTmpMkr'],
    ['_way2TmpMkr',       'way2TmpMkr'],
    ['_way3TmpMkr',       'way3TmpMkr'],
    ['_way4TmpMkr',       'way4TmpMkr'],
    ['_way5TmpMkr',       'way5TmpMkr'],
    ['_paSelMkr',         'paSelMkr'],
    ['_selIdx',           'selIdx'],
    ['_polyline',         'polyline'],
    ['_mode',             'mode'],
    ['_screen',           'screen'],
    ['_activeTab',        'activeTab'],
    ['_filterDio',        'filterDio'],
    ['_listSrch',         'listSrch'],
    ['_regionLat',        'regionLat'],
    ['_regionLng',        'regionLng'],
    ['_regionName',       'regionName'],
    ['_regionPlaceName',  'regionPlaceName'],
    ['_regionCache',      'regionCache'],
    ['_regionMarker',     'regionMarker'],
    ['_regionResultMarkers','regionResultMarkers'],
    ['_nearbyCache',      'nearbyCache'],
    ['_nearbyLoadToken',  'nearbyLoadToken'],
    ['_routeMode',        'routeMode'],
    ['_rS',               'rS'],
    ['_rW',               'rW'],
    ['_routeWaypointEnabled','routeWaypointEnabled'],
    ['_rW2',              'rW2'],
    ['_routeWaypoint2Enabled','routeWaypoint2Enabled'],
    ['_rW3',              'rW3'],
    ['_routeWaypoint3Enabled','routeWaypoint3Enabled'],
    ['_rW4',              'rW4'],
    ['_routeWaypoint4Enabled','routeWaypoint4Enabled'],
    ['_rW5',              'rW5'],
    ['_routeWaypoint5Enabled','routeWaypoint5Enabled'],
    ['_rE',               'rE'],
    ['_routeRegionStart', 'routeRegionStart'],
    ['_routeStartMarkerExplicitCurrent', 'routeStartMarkerExplicitCurrent'],
    ['_smRole',           'smRole'],
    ['_smDio',            'smDio'],
    ['_curInfoItem',      'curInfoItem'],
    ['_curFromRegion',    'curFromRegion'],
    ['_pendingShrineMapTargetIdx', 'pendingShrineMapTargetIdx'],
    ['_pendingShrineMapTargetToken', 'pendingShrineMapTargetToken'],
    ['_shrineMapTargetCenterLockUntil', 'shrineMapTargetCenterLockUntil'],
    ['_kakaoLaunching',   'kakaoLaunching'],
    ['_mapInited',        'mapInited'],
    ['_exitReady',        'exitReady'],
    ['_exitTimer',        'exitTimer'],
    ['_dioMkrs',             'dioMkrs'],
    ['_dioOverlays',         'dioOverlays'],
    ['_activeDio',           'activeDio'],
    ['_parishSysInited',     'parishSysInited'],
    ['_parishIdleListener',  'parishIdleListener'],
    ['_parishDioUserZoomTouched', 'parishDioUserZoomTouched'],
    ['_parishDioProgrammaticMoveUntil', 'parishDioProgrammaticMoveUntil'],
    ['_smPlaceDebounce',  'smPlaceDebounce'],
    ['_smTab',            'smTab'],
  ];
  map.forEach(function([legacyName, stateKey]) {
    Object.defineProperty(window, legacyName, {
      get: function() { return AppState[stateKey]; },
      set: function(v) { AppState[stateKey] = v; },
      configurable: true,
      enumerable: false,
    });
  });
})();

const JUKRIMGUL_PARKING = {lat:35.550726, lng:129.014589, name:'죽림굴주차장', kw:'죽림굴주차장'};
(function(){
  if(!window.visualViewport) return;
  let _kbOpen=false;
  window.visualViewport.addEventListener('resize',()=>{
  try{ if(window.__OAI_FOLD_VIEWPORT_SETTLING__ === true) return; if(typeof window.__oaiIsResumeFreeze === 'function' && window.__oaiIsResumeFreeze()) return; }catch(_e){}
  const active=document.activeElement;
  const inputFocused=!!(active && /^(INPUT|TEXTAREA|SELECT)$/i.test(active.tagName||''));
  if(!inputFocused){
   _kbOpen=false;
   document.documentElement.classList.remove('kb-open');
   return;
  }
  const ratio = window.visualViewport.height / window.innerHeight;
  const isKb = ratio < 0.75;
  if(isKb===_kbOpen) return;
  _kbOpen=isKb;
  if(isKb){
   document.documentElement.classList.add('kb-open');
  } else {
   document.documentElement.classList.remove('kb-open');
  }
  });
})();
(function(){
  function measureSA(){
  try{ if(window.__OAI_FOLD_VIEWPORT_SETTLING__ === true) return; if(typeof window.__oaiIsResumeFreeze === 'function' && window.__oaiIsResumeFreeze()) return; }catch(_e){}
  const b=document.createElement('div');
  b.style.cssText='position:fixed;bottom:0;left:0;width:1px;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;';
  document.body.appendChild(b);
  const sb=b.offsetHeight||0;
  document.body.removeChild(b);
  if(sb>0) document.documentElement.style.setProperty('--sb',sb+'px');
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',measureSA):measureSA();
  window.addEventListener('resize',measureSA);
})();
(function(){
  const c=$('cv-stars');
  if(!c) return;
  for(let i=0;i<22;i++){
  const s=document.createElement('span');
  s.className='cv-star';
  const sz=Math.random()*4+2;
  s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${(Math.random()*3).toFixed(1)}s;animation-duration:${(2+Math.random()*3).toFixed(1)}s;`;
  c.appendChild(s);
  }
})();
(function(){
  window._appExiting = false;
})();

function _forceNextCoverBackToast(reason){
  try{
    var until = (Date.now ? Date.now() : new Date().getTime()) + 6000;
    window.__oaiForceNextCoverBackToastUntil = until;
    window.__oaiForceNextCoverBackToastReason = reason || 'cover-return';
    sessionStorage.setItem('oai_force_next_cover_back_toast_until', String(until));
    sessionStorage.setItem('oai_force_next_cover_back_toast_reason', reason || 'cover-return');
    _exitReady = false;
    clearTimeout(_exitTimer);
    _clearCoverExitArmed();
    if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags(reason || 'cover-return');
    const old=$('_bt');
    if(old) old.remove();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _consumeForceNextCoverBackToast(){
  try{
    var now = Date.now ? Date.now() : new Date().getTime();
    var until = Number(window.__oaiForceNextCoverBackToastUntil || sessionStorage.getItem('oai_force_next_cover_back_toast_until') || 0);
    if(until && now < until){
      window.__oaiForceNextCoverBackToastUntil = 0;
      window.__oaiForceNextCoverBackToastReason = '';
      sessionStorage.removeItem('oai_force_next_cover_back_toast_until');
      sessionStorage.removeItem('oai_force_next_cover_back_toast_reason');
      _exitReady = false;
      clearTimeout(_exitTimer);
      _clearCoverExitArmed();
      if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags('force-first-cover-toast');
      const old=$('_bt');
      if(old) old.remove();
      return true;
    }
    if(until){
      sessionStorage.removeItem('oai_force_next_cover_back_toast_until');
      sessionStorage.removeItem('oai_force_next_cover_back_toast_reason');
      window.__oaiForceNextCoverBackToastUntil = 0;
      window.__oaiForceNextCoverBackToastReason = '';
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

function _showBackToast(){
  try{
    if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags('cover-back-toast');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  var forceFirstToast = false;
  try{ forceFirstToast = _consumeForceNextCoverBackToast(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(typeof _consumePrayerCoverNeedsFirstToast === 'function' && _consumePrayerCoverNeedsFirstToast()){
      _exitReady = false;
      _clearCoverExitArmed();
      clearTimeout(_exitTimer);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(!forceFirstToast && (_exitReady || _isCoverExitArmed())){
    _exitReady=false;
    _clearCoverExitArmed();
    clearTimeout(_exitTimer);
    doExit();
    return true; // 두 번째 뒤로가기: popstate 트랩을 다시 심지 않도록 알림
  }
  _exitReady=true;
  _armCoverExitWindow();
  const old=$('_bt');
  if(old) old.remove();
  const t=document.createElement('div');
  t.id='_bt';
  t.textContent='한 번 더 누르면 앱이 종료됩니다';
  t.style.cssText='position:fixed;top:50%;left:50%;bottom:auto;transform:translate(-50%,-50%);background:rgba(14,21,53,.94);color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;font-weight:800;z-index:99999;white-space:nowrap;pointer-events:none;box-shadow:0 14px 36px rgba(0,0,0,.32);';
  document.body.appendChild(t);
  var coverExitToastMs = 2500;
  try{
    if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags('cover-back-toast-window');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  _exitTimer=setTimeout(function(){
    _exitReady=false;
    _clearCoverExitArmed();
    if(t.parentNode)t.remove();
  },coverExitToastMs);
  return false; // 첫 번째 뒤로가기: 토스트만 표시
}


function attemptAppExit(){
  try{ if(typeof window.oaiMarkRealAppExitForResume === 'function') window.oaiMarkRealAppExitForResume('attemptAppExit'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  window._appExiting = true;
  const bt=$('_bt'); if(bt) bt.remove();
  try{ sessionStorage.removeItem('catholic_core_return_v1'); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ sessionStorage.removeItem('catholic_integrated_return_v2'); }catch(e){ console.warn("[가톨릭길동무]", e); }

  try{ if(navigator.app && typeof navigator.app.exitApp === 'function'){ navigator.app.exitApp(); return; } }catch(e){ console.warn("[가톨릭길동무]", e); }

  try{ window.open('', '_self'); window.close(); }catch(e){ console.warn("[가톨릭길동무]", e); }
  try{ document.documentElement.classList.add('app-exiting'); }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function closeExitDlg(){
  _exitReady=false;
  clearTimeout(_exitTimer);
  const bt=$('_bt'); if(bt) bt.remove();
  $('exit-dlg').classList.remove('open');
}
function doExit(){
  closeExitDlg();
  attemptAppExit();
}

function oaiEnterView(el){
  if(!el) return;
  try{
    var root=document.documentElement;
    if(root.classList.contains('oai-returning')) return;
    el.classList.remove('oai-enter-ready','oai-enter-show','oai-popup-ready','oai-popup-show','oai-prepaint-view');
    // V8-1-14-621: 카테고리 첫 화면은 nearby-distance-loading이 담당한다.
    // oaiEnterView는 더 이상 #oai-category-entry-veil을 켜지 않고 stale class만 정리한다.
    if(typeof oaiHideCategoryEntryVeil==='function') oaiHideCategoryEntryVeil();
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function oaiEnterPopup(el){
  if(!el) return;
  try{
    var root=document.documentElement;
    if(root.classList.contains('oai-returning')) return;
    el.classList.remove('oai-popup-ready','oai-popup-show','oai-enter-ready','oai-enter-show','oai-prepaint-view');
    el.classList.add('oai-popup-ready');
    try{ void el.offsetHeight; }catch(_e){}
    var ms=parseInt(getComputedStyle(root).getPropertyValue('--oai-popup-enter-ms'),10) || 320;
    var show=function(){
      try{
        el.classList.add('oai-popup-show');
        clearTimeout(el.__oaiPopupTimer);
        el.__oaiPopupTimer=setTimeout(function(){
          try{ el.classList.remove('oai-popup-ready','oai-popup-show','oai-prepaint-view'); }catch(e){ console.warn("[가톨릭길동무]", e); }
        }, ms + 90);
      }catch(e){ console.warn("[가톨릭길동무]", e); }
    };
    if(window.requestAnimationFrame) requestAnimationFrame(show);
    else setTimeout(show,16);
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function oaiShowCategoryEntryVeil(mode){
  // V8-1-14-621: 성지/성당/피정 진입은 내주변 거리계산 화면이 기준이다.
  // 이 함수는 남은 호출 호환을 위해 stale veil state만 정리한다.
  try{ oaiHideCategoryEntryVeil(); }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function oaiHideCategoryEntryVeil(){
  try{
    clearTimeout(window.__oaiCategoryVeilTimer);
    clearTimeout(window.__oaiCategoryDissolveTimer);
    var root=document.documentElement;
    var veil=document.getElementById('oai-category-entry-veil');
    root.classList.remove('oai-category-entering','oai-category-dissolve','oai-category-dissolving');
    if(veil){ veil.style.opacity=''; veil.className=''; veil.style.display='none'; }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function oaiPreopenNearbySheetForCategory(){
  try{
    if(!(_mode==='shrine' || _mode==='parish' || _mode==='retreat')) return;
    window.__OAI_NEARBY_PREOPEN_MODE__ = _mode;
    _updateSheetPanelTitles();
    ['list','region','route'].forEach(function(n){
      var s=$('sheet-'+n);
      if(s){
        s.classList.remove('open','from-left','from-right','exit-left','exit-right','oai-preopen-nearby');
      }
    });
    var sheet=$('sheet-nearby');
    var body=$('nearby-body');
    if(sheet){
      sheet.style.display='';
      sheet.classList.remove('from-left','from-right','exit-left','exit-right');
      sheet.classList.add('open','oai-preopen-nearby');
    }
    if(body){
      // V8-1-14-621: 데이터 지연 후 startApp이 다시 호출되어도 같은 내주변 로딩 화면을 다시 그리지 않는다.
      _ensureNearbyDistanceLoading(body);
      try{ body.scrollTop=0; }catch(_e){}
    }
    if(typeof _updateTabBtns==='function') _updateTabBtns('nearby');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function startApp(mode){
  if(mode==='shrine' && (!_shrineRawLoaded || !SHRINES.length)){
    _mode='shrine';
    try{
      try{ oaiPreopenNearbySheetForCategory(); }catch(_e){}
      const cover=$('cover');
      if(cover) cover.style.display='none';
      if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
      document.documentElement.classList.add('app-active');
      document.documentElement.classList.remove('parish-mode','retreat-mode');
      const mapEl=$('map');
      _ensureMapLoading(mapEl, '성지 정보를 불러오는 중...');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    _ensureShrineDataLoaded().then(function(){ startApp('shrine'); }).catch(function(err){
      console.warn('[가톨릭길동무] 성지 데이터 로드 실패', err);
      try{ alert('성지 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }catch(_e){}
      try{ if(typeof goToCover==='function') goToCover(); }catch(_e){}
      try{ if(typeof oaiHideCategoryEntryVeil==='function') oaiHideCategoryEntryVeil(); }catch(_e){}
    });
    return;
  }
  if(mode==='retreat' && (!_retreatRawLoaded || !RETREATS.length)){
    _mode='retreat';
    try{
      try{ oaiPreopenNearbySheetForCategory(); }catch(_e){}
      const cover=$('cover');
      if(cover) cover.style.display='none';
      if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
      document.documentElement.classList.add('app-active','retreat-mode');
      document.documentElement.classList.remove('parish-mode');
      const mapEl=$('map');
      _ensureMapLoading(mapEl, '피정의집 정보를 불러오는 중...');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    _ensureRetreatDataLoaded().then(function(){ startApp('retreat'); }).catch(function(err){
      console.warn('[가톨릭길동무] 피정의집 데이터 로드 실패', err);
      try{ alert('피정의집 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }catch(_e){}
      try{ if(typeof goToCover==='function') goToCover(); }catch(_e){}
      try{ if(typeof oaiHideCategoryEntryVeil==='function') oaiHideCategoryEntryVeil(); }catch(_e){}
    });
    return;
  }
  if(mode==='parish' && !_PARISH_SPLIT_LAZY_MODE && (!_parishRawLoaded || !PARISHES.length)){
    _mode='parish';
    try{
      try{ oaiPreopenNearbySheetForCategory(); }catch(_e){}
      const cover=$('cover');
      if(cover) cover.style.display='none';
      if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
      document.documentElement.classList.add('app-active','parish-mode');
      document.documentElement.classList.remove('retreat-mode');
      const mapEl=$('map');
      _ensureMapLoading(mapEl, '성당 정보를 불러오는 중...');
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    _ensureParishDataLoaded().then(function(){ startApp('parish'); }).catch(function(err){
      console.warn('[가톨릭길동무] 성당 데이터 로드 실패', err);
      try{ alert('성당 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }catch(_e){}
      try{ if(typeof goToCover==='function') goToCover(); }catch(_e){}
      try{ if(typeof oaiHideCategoryEntryVeil==='function') oaiHideCategoryEntryVeil(); }catch(_e){}
    });
    return;
  }
  _mode=mode;
  _shrineVisitMapFilter='all';
  _filterDio='all';
  _listSrch='';
  window._noAutoNearby = false;  // 직접 진입 시 nearby 열기 허용
  _regionLat=null; _regionLng=null; _regionCache=[];
  _regionName=''; _regionPlaceName='';
  _nearbyCache=[];
  try{ _cancelNearbyLoad(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  _curFromRegion=false;
  _curInfoItem=null;
  // V8-1-14-621:
  // 성지/성당/피정 데이터 로드 대기 중 이미 내주변 로딩 sheet를 열어 둔 경우,
  // 두 번째 startApp 호출에서 closeAllTabs()로 닫았다가 다시 여는 동작을 막는다.
  const _carryNearbyPreopen = !!((mode==='shrine' || mode==='parish' || mode==='retreat') &&
    window.__OAI_NEARBY_PREOPEN_MODE__ === mode &&
    $('sheet-nearby') && $('sheet-nearby').classList.contains('open') &&
    $('sheet-nearby').classList.contains('oai-preopen-nearby'));
  if(!_carryNearbyPreopen) closeAllTabs();
  closeInfoCard();
  resetRoute();
  const _ls=$('list-srch-inp'); if(_ls) _ls.value='';
  const _lsx=$('list-srch-x'); if(_lsx) _lsx.style.display='none';
  $$('.filter-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  $$('.sm-fb').forEach((b,i)=>b.classList.toggle('on',i===0));

 _renderDioFilterBars();  _screen='map';
  if(mode==='shrine' || mode==='parish' || mode==='retreat') _prepareCategoryMapSurface(mode);
  if(mode==='shrine' || mode==='parish' || mode==='retreat'){
    if(_carryNearbyPreopen){
      try{ _updateSheetPanelTitles(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    } else {
      try{ oaiPreopenNearbySheetForCategory(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    }
  }
  $('cover').style.display='none';
  if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
  document.documentElement.classList.add('app-active');
  document.documentElement.classList.toggle('parish-mode',mode==='parish');
  document.documentElement.classList.toggle('retreat-mode',mode==='retreat');
  if(mode==='shrine'){
    window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
    window.__OAI_SHRINE_NEARBY_LOADING__=true;
    window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__=false;
  }
  try{ _ensureShrineVisitMapFilter(); _updateShrineVisitMapFilterUI(); _ensureShrineVisitCardsButton(); _updateShrineVisitCardsButtonUI(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  const _setTxt=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  const listLbl = _getModeListTitle(mode);
  const listSearchInput=$('list-srch-inp');
  if(listSearchInput){
    const ph = _getModeSearchPlaceholder(mode, 'list');
    listSearchInput.placeholder = ph;
    listSearchInput.setAttribute('aria-label', ph);
  }
  _setTxt('tab-nearby-lbl', '내주변');
  _setTxt('tab-list-lbl', listLbl);
  $('legend').style.display = mode==='shrine'?'block':'none';
  _resetMapState();
  if(mode==='shrine' || mode==='parish' || mode==='retreat') _prepareCategoryMapSurface(mode);
  _mapInited=true;
  requestAnimationFrame(function(){ setTimeout(_loadMap, 0); });
}

function _resetMapState(){
  _bumpMainMapBuildToken();
  _clearVisibleCategoryMapObjects();
  _markers=[];
  _retreatMarkers=[];
  _dioMkrs={};
  _dioOverlays={};
  _activeDio=null;
  _parishSysInited=false;
  _parishDioUserZoomTouched=false;
  _parishDioProgrammaticMoveUntil=0;
  _pendingParishDioCode=null;
  try{ if(AppState){ AppState.nearbyParishDioCode=null; AppState.parishMapLayerMode=''; AppState.parishDioLayerToken=(Number(AppState.parishDioLayerToken||0)||0)+1; } }catch(e){ console.warn('[가톨릭길동무]',e); }
  if(_parishIdleListener){ try{kakao.maps.event.removeListener(_parishIdleListener);}catch(e){ console.warn('[가톨릭길동무]',e); } _parishIdleListener=null; }
  _myMkr=null;
  _myLat=null; _myLng=null;
  const mapEl=$('map');
  if(mapEl){
    if(_mode==='shrine' || _mode==='parish' || _mode==='retreat'){
      _ensureMapLoading(mapEl, _categoryMapLoadingText(_mode));
    }else if(!_map){
      mapEl.innerHTML='';
    }
  }
  _mapInited=false;
}
/* V8-1-14-679: 실제 앱 새 시작(콜드 스타트/새 문서 로드)과 30분 이상 background 복귀에서만
   검색 UI와 검색 결과 상태를 초기화한다. 순례기록·설정·즐겨찾기 등 영구 데이터는 건드리지 않는다. */
function oaiResetSearchStateForFreshStart(reason){
  try{
    try{ if(document.activeElement && document.activeElement.blur) document.activeElement.blur(); }catch(_e){}

    _listSrch='';
    const listInp=$('list-srch-inp');
    if(listInp) listInp.value='';
    const listX=$('list-srch-x');
    if(listX) listX.style.display='none';

    const regionInp=$('region-inp');
    if(regionInp) regionInp.value='';
    _regionLat=null;
    _regionLng=null;
    _regionName='';
    _regionPlaceName='';
    _regionCache=[];
    _curFromRegion=false;
    try{ _clearRegionMarker(); }catch(_e){}
    try{ _clearRegionResultMarkers(); }catch(_e){}
    const regionBody=$('region-body');
    if(regionBody){
      try{ regionBody.innerHTML=_regionGuideHtml(); }catch(_e){ regionBody.innerHTML=''; }
      regionBody.onclick=null;
    }

    try{ _smSearchSeq++; }catch(_e){}
    try{ clearTimeout(_smPlaceDebounce); _smPlaceDebounce=null; }catch(_e){}
    try{ _smCatholicResults=[]; _smAllResults=[]; }catch(_e){}
    try{ _smDio='all'; _smTab='all'; _smRole='start'; }catch(_e){}
    const smInp=$('sm-inp');
    if(smInp) smInp.value='';
    ['sm-body-all','sm-body','sm-body-place'].forEach(function(id){
      const body=$(id);
      if(body) body.innerHTML='';
    });
    try{ _setSmFilterVisible(false); _setSmBodyVisible('all'); _setSmPrompt('all'); }catch(_e){}
    ['all','cat','place'].forEach(function(name){
      const btn=$('sm-tab-'+name);
      if(btn) btn.classList.toggle('active', name==='all');
    });
    $$('.sm-fb').forEach(function(b,i){ b.classList.toggle('on',i===0); });
    const searchModal=$('srch-modal');
    if(searchModal) searchModal.classList.remove('open');

    try{ window.__OAI_LAST_SEARCH_RESET_REASON__=String(reason||'fresh-start'); }catch(_e){}
  }catch(e){ console.warn('[가톨릭길동무] 검색 초기화 실패', e); }
}
window.oaiResetSearchStateForFreshStart=oaiResetSearchStateForFreshStart;

/* 새 문서가 실제로 로드된 경우는 앱 종료 후 재실행/새로고침을 포함한 새 시작이다.
   background에서 살아 있는 동일 문서의 짧은 복귀에는 DOMContentLoaded가 다시 발생하지 않는다. */
(function installFreshStartSearchReset(){
  function resetOnce(){
    try{
      if(window.__OAI_FRESH_START_SEARCH_RESET_DONE__) return;
      window.__OAI_FRESH_START_SEARCH_RESET_DONE__=true;
      oaiResetSearchStateForFreshStart('document-start');
    }catch(e){ console.warn('[가톨릭길동무]',e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',resetOnce,{once:true});
  else setTimeout(resetOnce,0);
})();

function goToCover(){
  try{ _cancelNearbyLoad(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _clearDioceseReturnState === 'function') _clearDioceseReturnState('go-to-cover'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(document.querySelector('#web-view.open,#trail-view.open,#qna-view.open,#diocese-view.open,#missa-view.open') && typeof oaiHoldStabilityVeil === 'function') oaiHoldStabilityVeil('view-close', 260);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  closeTab(_activeTab);
  closeInfoCard();
  resetRoute();
  _markers.forEach(m=>{if(m)try{m.marker.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }});
  _retreatMarkers.forEach(o=>{try{o.marker.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }});
  Object.values(_dioMkrs).forEach(arr=>arr.forEach(mk=>{try{mk.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }}));
  try{ _clearParishNearbyMarkers(); }catch(e){ console.warn('[가톨릭길동무]',e); }
  if(_myMkr){try{_myMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); } _myMkr=null;}
  _screen='cover';
  try{ _updateShrineVisitMapFilterUI(); _updateShrineVisitCardsButtonUI(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  if(typeof oaiSetMainMapLayerHidden==='function') oaiSetMainMapLayerHidden(false);
  document.documentElement.classList.remove('app-active','parish-mode','retreat-mode','oai-cover-resetting-to-intro','oai-cover-booting','oai-first-entry-intro','oai-background-return-intro','oai-cover-under-intro-reveal','oai-cover-first-reveal');
  const _coverEl=$('cover');
  if(_coverEl){
    _coverEl.style.display='';
    _coverEl.style.opacity='';
    _coverEl.style.pointerEvents='';
    _coverEl.scrollTop=0;
  }
  /* 장기 백그라운드 복귀로 커버에 돌아오면 성당 방문 화면의 보조 레이어도 함께 닫는다. */
  try{ if(typeof _closeParishVisitEditor==='function') _closeParishVisitEditor({fromCover:true}); }catch(_e){}
  try{ if(typeof _closeParishVisitDetail==='function') _closeParishVisitDetail({noResume:true,fromCover:true}); }catch(_e){}
  try{ if(typeof _closeParishVisitBook==='function') _closeParishVisitBook({fromCover:true}); }catch(_e){}
  try{ if(typeof _resetCoverExitReady === 'function') _resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _clearCoverExitArmed === 'function') _clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _clearHardCoverExitFlags === 'function') _clearHardCoverExitFlags('go-to-cover'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _forceNextCoverBackToast === 'function') _forceNextCoverBackToast('go-to-cover'); }catch(e){ console.warn('[가톨릭길동무]', e); }
  // V8-1-14-621: 커버 복귀 때 화면 크기 class/cover-vh를 다시 계산하지 않는다. 저장된 화면 기준을 유지한다.
}



let _kakaoMapSdkLoading = false;
function _loadMap(){
  const wrap=$('map');
  _ensureMapLoading(wrap, '지도를 불러오는 중...');
  if(window.kakao&&window.kakao.maps){
    try{kakao.maps.load(_onMapReady);}catch(e){_mapError(e.message);}
    return;
  }
  if(_kakaoMapSdkLoading) return;
  const oldScript=document.getElementById('oai-kakao-map-sdk');
  if(oldScript){ try{ oldScript.remove(); }catch(_e){} }
  _kakaoMapSdkLoading = true;
  const sc=document.createElement('script');
  sc.id='oai-kakao-map-sdk';
  sc.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JSKEY}&autoload=false&libraries=services`;
  const timer=setTimeout(()=>{ _kakaoMapSdkLoading=false; _mapError('카카오내비 로딩 시간 초과'); },20000);
  sc.onload=()=>{clearTimeout(timer);_kakaoMapSdkLoading=false;try{kakao.maps.load(_onMapReady);}catch(e){_mapError(e.message);}};
  sc.onerror=()=>{clearTimeout(timer);_kakaoMapSdkLoading=false;_mapError(`도메인 등록 필요: ${location.hostname}`);};
  document.head.appendChild(sc);
}

function _mapError(msg){
  const layer=$('map-loading-layer') || $('map');
  if(layer){
    layer.innerHTML=`<div class="map-loading"><div style="font-size:40px;margin-bottom:16px">🗺️</div><div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:12px">지도를 불러올 수 없습니다</div><div style="font-size:12px;color:#777;line-height:1.8;max-width:280px;word-break:keep-all">${msg}</div></div>`;
    layer.classList.add('open');
    layer.setAttribute('aria-hidden','false');
  }
  _markers=new Array(SHRINES.length).fill(null);
  renderList();
  openTab('nearby');
  if(typeof oaiHideCategoryEntryVeil==='function') setTimeout(oaiHideCategoryEntryVeil, 160);
}

function _onMapReady(){
 const KM=kakao.maps;window._LL=KM.LatLng;window._MM=KM.Marker;window._MI=KM.MarkerImage;window._SZ=KM.Size;window._PT=KM.Point;window._LB=KM.LatLngBounds;window._PL=KM.Polyline;window._EL=KM.event.addListener;
  const mapBuildToken = _currentMainMapBuildToken();
  const mapMode = _mode;
  const mapEl=$('map');
  if(!_map){
    _map=new kakao.maps.Map(mapEl,{ center:new _LL(36.2,127.9),level:8 });
    window.__OAI_MAIN_MAP_CLICK_BOUND__=false;
  }else{
    try{
      if(typeof _map.relayout==='function') _map.relayout();
      if(typeof _map.setLevel==='function') _map.setLevel(8);
      if(typeof _map.setCenter==='function') _map.setCenter(new _LL(36.2,127.9));
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  if(!window.__OAI_MAIN_MAP_CLICK_BOUND__){
    window.__OAI_MAIN_MAP_CLICK_BOUND__=true;
    kakao.maps.event.addListener(_map,'click',()=>{
      // V8-1-14-679: 지도 빈 곳 클릭은 패널 표시만 접고 선택 마커와 경로선은 유지한다.
      _hideMapPanelFromMapClick();
      document.activeElement?.blur();
    });
  }
  if(_mode==='shrine'){
    _buildShrineMarkers();
  } else {
    _markers=new Array(SHRINES.length).fill(null);
  }
  renderList();
  if(_mode==='parish') {
    _buildParishDioSystem();
    if(_isParishNearbyMapMode()) _clearParishDioLayerForNearby();
    else _syncParishDioLabels();
  }
  else if(_mode==='retreat') _buildRetreatMarkers();
  /* V8-1-14-679: 상세에서 지정한 성지가 있으면 현재 위치 갱신은 하되 지도 중심은 선택 성지에 고정한다. */
  const pendingShrineTarget=(_mode==='shrine'&&_pendingShrineMapTargetIdx>=0)
    ? {idx:_pendingShrineMapTargetIdx,token:_pendingShrineMapTargetToken}
    : null;
  if(pendingShrineTarget){
    _scheduleShrineVisitMapTarget(pendingShrineTarget.idx,pendingShrineTarget.token);
    setTimeout(function(){ _autoLocate({preserveMapCenter:true}); },120);
  } else if(!window._noAutoNearby){
    _openInitialNearbyAfterMapStable(mapBuildToken, mapMode);
  } else {
    setTimeout(_autoLocate, 120);
  }
  window._noAutoNearby = false;
  try{ _updateShrineVisitMapFilterUI(); _updateShrineVisitCardsButtonUI(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  requestAnimationFrame(function(){
    try{ if(_isMainMapBuildCurrent(mapBuildToken, mapMode) && _map && typeof _map.relayout==='function') _map.relayout(); }catch(_e){}
    _finishMapSurfaceAfterFirstPaint(mapBuildToken, mapMode);
  });
}

function _isMapSplitWideLayout(){
  try{ return document.documentElement.classList.contains('oai-map-split-wide'); }
  catch(_e){ return false; }
}

let _oaiMapPanelCollapsed=false;
let _oaiMapPanelLayoutSignature='';
let _oaiMapPanelResizeObserver=null;
let _oaiMapPanelObservedElement=null;
let _oaiInfoCardFocusToken=0;

/* V8-1-14-679: 정보카드가 열린 동안 선택 장소의 지도 위치는 이 공통 소유자가 관리한다.
   패널 등장/재배치보다 먼저 계산한 이전 지도 중심이 뒤늦게 선택 마커 중심을 덮지 않게 한다. */
function _getVisibleInfoCardFocusItem(){
  try{
    const card=$('info-card');
    const current=_curInfoItem&&_curInfoItem.item;
    if(_oaiMapPanelCollapsed||!card||!card.classList.contains('open')||!current) return null;
    if(!current.lat||!current.lng) return null;
    return current;
  }catch(e){console.warn('[가톨릭길동무]',e);return null;}
}
function _isInfoCardFocusCurrent(item,token){
  try{
    const current=_getVisibleInfoCardFocusItem();
    return !!(token===_oaiInfoCardFocusToken&&current===item&&_map&&_screen==='map');
  }catch(_e){return false;}
}
function _scheduleInfoCardMarkerFocus(item,reason){
  if(!item||!item.lat||!item.lng) return 0;
  const token=++_oaiInfoCardFocusToken;
  const apply=function(){
    try{
      if(!_isInfoCardFocusCurrent(item,token)) return;
      _focusMarkerAboveInfoCard(item);
    }catch(e){console.warn('[가톨릭길동무]',e);}
  };
  apply();
  requestAnimationFrame(apply);
  setTimeout(apply,90);
  setTimeout(apply,240);
  return token;
}

function _updateMapSplitWideClass(reason){
  try{
    const root=document.documentElement;
    const width=Math.max(window.innerWidth||0,document.documentElement.clientWidth||0);
    const ua=(navigator&&navigator.userAgent)||'';
    const foldDevice=/SM-F\d{3}|Galaxy\s*Z?\s*Fold|Galaxy\s*Fold|Fold/i.test(ua)||root.classList.contains('oai-screen-fold-wide');
    const wide=!root.classList.contains('ios-device')&&foldDevice&&width>=640;
    const wasWide=root.classList.contains('oai-map-split-wide');
    root.classList.toggle('oai-map-split-wide',wide);
    if(wasWide!==wide && typeof _syncRouteWaypointBoxes==='function') _syncRouteWaypointBoxes();
    _syncMapPanelUI(reason||'viewport');
  }catch(e){console.warn('[가톨릭길동무]',e);}
}
function _getMapPanelCandidate(){
  try{
    const route=$('sheet-route');
    if(route&&route.classList.contains('open')&&!route.hidden&&route.style.display!=='none') return {kind:'route',label:'길찾기',el:route};
    const info=$('info-card');
    if(info&&info.classList.contains('open')&&!document.documentElement.classList.contains('route-tab-active')) return {kind:'info',label:'장소 정보',el:info};
    for(const name of ['nearby','list','region']){
      const sheet=$('sheet-'+name);
      if(sheet&&sheet.classList.contains('open')) return {kind:name,label:name==='nearby'?'내주변':name==='list'?'찾기':'지역검색',el:sheet};
    }
  }catch(e){console.warn('[가톨릭길동무]',e);}
  return null;
}
function _relayoutMainMapForPanel(){
  try{
    if(!_map||typeof _map.relayout!=='function') return;
    const center=typeof _map.getCenter==='function'?_map.getCenter():null;
    const focusItem=_getVisibleInfoCardFocusItem();
    requestAnimationFrame(function(){
      try{
        _map.relayout();
        const current=_getVisibleInfoCardFocusItem();
        if(focusItem&&current===focusItem){
          _scheduleInfoCardMarkerFocus(focusItem,'panel-relayout');
        }else if(center&&typeof _map.setCenter==='function'){
          _map.setCenter(center);
        }
      }catch(e){console.warn('[가톨릭길동무]',e);}
    });
  }catch(e){console.warn('[가톨릭길동무]',e);}
}
function _observeMapPanelSize(el){
  try{
    if(_oaiMapPanelObservedElement===el)return;
    if(_oaiMapPanelResizeObserver){_oaiMapPanelResizeObserver.disconnect();_oaiMapPanelResizeObserver=null;}
    _oaiMapPanelObservedElement=el||null;
    if(el&&window.ResizeObserver){
      _oaiMapPanelResizeObserver=new ResizeObserver(function(){
        _positionMapPanelToggle();
        const focusItem=_getVisibleInfoCardFocusItem();
        if(focusItem) _scheduleInfoCardMarkerFocus(focusItem,'panel-resize');
      });
      _oaiMapPanelResizeObserver.observe(el);
    }
  }catch(e){console.warn('[가톨릭길동무]',e);}
}
function _positionMapPanelToggle(){
  try{
    const btn=$('map-panel-toggle-btn');if(!btn||btn.hidden)return;
    if(_isMapSplitWideLayout()){
      btn.style.removeProperty('top');btn.style.removeProperty('bottom');btn.style.removeProperty('left');return;
    }
    btn.style.left='50%';
    if(_oaiMapPanelCollapsed){
      btn.style.removeProperty('top');btn.style.bottom='calc(var(--oai-android-bottom-gap, env(safe-area-inset-bottom, 0px)) + 12px)';return;
    }
    const candidate=_getMapPanelCandidate();
    if(candidate&&candidate.el&&(candidate.kind==='info'||candidate.kind==='route')){
      const rect=candidate.el.getBoundingClientRect();
      const top=Math.max((($('tabbar')&&$('tabbar').offsetHeight)||54)+6,Math.round(rect.top-20));
      btn.style.top=top+'px';btn.style.removeProperty('bottom');
    }
  }catch(e){console.warn('[가톨릭길동무]',e);}
}
function _isMapPanelToggleBlockedByModal(){
  try{
    const searchModal=$('srch-modal');
    const routeChoiceModal=$('route-choice-modal');
    return !!((searchModal&&searchModal.classList.contains('open')) ||
      (routeChoiceModal&&routeChoiceModal.classList.contains('open')));
  }catch(e){console.warn('[가톨릭길동무]',e);return false;}
}
function _syncMapPanelUI(reason){
  try{
    const root=document.documentElement,btn=$('map-panel-toggle-btn'),candidate=_getMapPanelCandidate(),present=!!candidate;
    const blockedByModal=_isMapPanelToggleBlockedByModal();
    root.classList.toggle('oai-map-panel-present',present);
    root.classList.toggle('oai-map-panel-toggle-blocked',blockedByModal);
    if(!present){
      _oaiMapPanelCollapsed=false;root.classList.remove('oai-map-panel-collapsed');_observeMapPanelSize(null);
      if(btn){btn.hidden=true;btn.removeAttribute('data-panel-kind');btn.removeAttribute('data-panel-state');}
    }else{
      root.classList.toggle('oai-map-panel-collapsed',!!_oaiMapPanelCollapsed);
      if(btn){
        btn.hidden=blockedByModal;btn.dataset.panelKind=candidate.kind;
        const opening=_oaiMapPanelCollapsed,icon=btn.querySelector('.map-panel-toggle-icon');
        if(icon)icon.textContent='';
        btn.dataset.panelState=opening?'collapsed':'expanded';
        btn.setAttribute('aria-expanded',opening?'false':'true');
        btn.setAttribute('aria-label',(opening?'열기: ':'숨기기: ')+candidate.label);
        btn.title=(opening?'열기: ':'숨기기: ')+candidate.label;
      }
      _observeMapPanelSize(candidate.el);
    }
    _positionMapPanelToggle();
    const signature=[_isMapSplitWideLayout()?'wide':'phone',present?'1':'0',_oaiMapPanelCollapsed?'1':'0'].join('|');
    if(signature!==_oaiMapPanelLayoutSignature){_oaiMapPanelLayoutSignature=signature;_relayoutMainMapForPanel();}
  }catch(e){console.warn('[가톨릭길동무]',e);}
}
function _setMapPanelCollapsed(on,reason){
  if(!_getMapPanelCandidate())return false;
  _oaiMapPanelCollapsed=!!on;
  if(_oaiMapPanelCollapsed) ++_oaiInfoCardFocusToken;
  _syncMapPanelUI(reason||'manual');
  if(!_oaiMapPanelCollapsed){
    const focusItem=_getVisibleInfoCardFocusItem();
    if(focusItem) _scheduleInfoCardMarkerFocus(focusItem,'panel-open');
  }
  return true;
}
function _toggleMapPanelVisibility(){_setMapPanelCollapsed(!_oaiMapPanelCollapsed,'toggle-button');}
function _hideMapPanelFromMapClick(){
  const candidate=_getMapPanelCandidate();if(!candidate)return false;
  if(_isMapSplitWideLayout()||candidate.kind==='info'||candidate.kind==='route')return _setMapPanelCollapsed(true,'map-click');
  return false;
}
function _bindMapPanelController(){
  if(window.__OAI_MAP_PANEL_CONTROLLER_BOUND__)return;
  window.__OAI_MAP_PANEL_CONTROLLER_BOUND__=true;
  const btn=$('map-panel-toggle-btn');
  if(btn)btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();_toggleMapPanelVisibility();});
  try{
    const mo=new MutationObserver(function(){_syncMapPanelUI('mutation');});
    ['sheet-nearby','sheet-list','sheet-region','sheet-route','info-card','srch-modal','route-choice-modal'].forEach(function(id){const el=$(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['class','style','hidden']});});
    window.__OAI_MAP_PANEL_OBSERVER__=mo;
  }catch(e){console.warn('[가톨릭길동무]',e);}
  let timer=0;
  const refresh=function(){clearTimeout(timer);timer=setTimeout(function(){_updateMapSplitWideClass('resize');},50);};
  window.addEventListener('resize',refresh,{passive:true});window.addEventListener('orientationchange',refresh,{passive:true});
  try{if(window.visualViewport)window.visualViewport.addEventListener('resize',refresh,{passive:true});}catch(_e){}
  _updateMapSplitWideClass('bind');
}
try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_bindMapPanelController,{once:true});else _bindMapPanelController();}
catch(e){console.warn('[가톨릭길동무]',e);}

function _modeTargetLabel(){
  return _getModePlaceNoun(_mode);
}
function _updateSheetPanelTitles(){
  const noun=_modeTargetLabel();
  const near=$('nearby-sheet-title');
  const list=$('list-sheet-title');
  const region=$('region-sheet-title');
  if(near) near.textContent='내 주변 '+noun;
  if(list) list.textContent=noun+' 찾기';
  if(region) region.textContent='지역검색';
}
function closeSheetPanelOnly(name){
  if(!name) return;
  _blurAll && _blurAll();
  _closeSheetOnly(name);
  if(_activeTab===name) _activeTab=null;
  _updateTabBtns(null);
  if(name==='nearby'){
    if(_mode==='parish'){
      // 성당 내주변 창 닫기는 목록만 닫는다. 주변 성당 마커와 현재 교구명, 지도 시점을 그대로 유지한다.
      _setParishMapLayerMode('nearby','nearby-sheet-closed');
      try{ _syncParishDioLabels(); }catch(_e){}
    }else{
      _scheduleNearbyMyLocationPlainRestore('nearby-close-button');
    }
  }
}

function closeRouteSheetByX(){
  _blurAll && _blurAll();
  _closeSheetOnly('route');
  if(_activeTab==='route') _activeTab=null;
  _updateTabBtns(null);
  setTimeout(function(){
    try{ resetRoute(); }catch(e){ console.warn('[가톨릭길동무]', e); }
    _routeMode=false;
    try{ _exitRouteMode(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }, OAI_ROUTE_VISUAL_DELAY_MS);
}

function closeCategoryToCoverFromMap(){
  _blurAll && _blurAll();
  if(typeof goToCover === 'function') goToCover();
}

function _setRouteTabInfoCardHidden(on){
  try{
    var root = document.documentElement;
    if(!root) return;
    if(on){
      root.classList.add('route-tab-active');
      var card = $('info-card');
      if(card) card.classList.remove('open');
      _curInfoItem = null;
      _curFromRegion = false;
    }else{
      root.classList.remove('route-tab-active');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _closeRouteUiForNonRouteTab(){
  try{ _setRouteTabInfoCardHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ if(typeof _blurAll === 'function') _blurAll(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.querySelectorAll('#sheet-route input,#sheet-route textarea').forEach(function(el){
      try{ el.blur(); }catch(_e){}
    });
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    const choiceModal = $('route-choice-modal');
    if(choiceModal) choiceModal.classList.remove('open');
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    const routeSheet = $('sheet-route');
    if(routeSheet){
      routeSheet.classList.remove('open','from-right','from-left','exit-left','exit-right','route-waypoint-scroll','route-result-showing');
      routeSheet.setAttribute('aria-hidden','true');
      routeSheet.hidden = true;
      routeSheet.style.display = 'none';
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    _routeMode=false;
    if(typeof _hideRouteGuide === 'function') _hideRouteGuide();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

try{ window._exitRouteMode=_exitRouteMode; window._setRouteTabInfoCardHidden=_setRouteTabInfoCardHidden; }catch(e){ console.warn('[가톨릭길동무]', e); }

function zoomCategoryMap(delta){
  if(!_map || typeof _map.getLevel !== 'function' || typeof _map.setLevel !== 'function') return;
  try{
    const cur = _map.getLevel();
    const next = Math.max(1, Math.min(14, cur + delta));
    if(next !== cur){
      _map.setLevel(next);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

/* V8-1-14-693: 지도 마커의 길찾기 동작은 '현재 길찾기 탭이 실제로 열려 있을 때'만 허용한다.
   뒤로가기 등으로 길찾기 UI를 벗어난 뒤 남아 있던 _routeMode/route-tab-active 상태 때문에
   일반 지도 마커가 다시 길찾기로 동작하던 문제를 막는다. */
function _isRouteSelectionModeActive(){
  try{
    var root = document.documentElement;
    var routeSheet = $('sheet-route');
    var tabIsRoute = (_activeTab === 'route');
    var sheetIsOpen = !!(routeSheet && routeSheet.classList.contains('open') && !routeSheet.hidden && routeSheet.style.display !== 'none');
    var active = tabIsRoute && sheetIsOpen;

    if(!active && !tabIsRoute){
      // 화면상 길찾기 탭이 아니면 남아 있는 길찾기 표시 상태를 즉시 정리한다.
      _routeMode = false;
      if(root) root.classList.remove('route-tab-active');
      try{ if(typeof _hideRouteGuide === 'function') _hideRouteGuide(); }catch(_e){}
      try{
        var choiceModal = $('route-choice-modal');
        if(choiceModal) choiceModal.classList.remove('open');
      }catch(_e){}
    }
    return active;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

function openTab(name, opts){
  opts = opts || {};
  var shouldAutoFocusKeyboard = opts.keyboard === true;
  if(_activeTab===name){
    if(_oaiMapPanelCollapsed) _setMapPanelCollapsed(false,'open-active-tab');
    return;
  }
  _oaiMapPanelCollapsed=false;
  try{ if(typeof oaiClearMapInfoSelection === 'function') oaiClearMapInfoSelection('tab-switch:'+name); }catch(e){ console.warn('[가톨릭길동무]', e); }
  _updateSheetPanelTitles();
  const prevName = _activeTab;
  if(name === 'route'){
    // 길찾기 탭을 누르는 즉시 정보카드를 먼저 숨겨,
    // 이후 시트가 열릴 때 정보카드가 다시 겹쳐 보이지 않게 한다.
    try{ _setRouteTabInfoCardHidden(true); }catch(e){ console.warn('[가톨릭길동무]', e); }
    try{ closeInfoCard({keepMap:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }else{
    try{ _setRouteTabInfoCardHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  // V8-1-14-621: 성지/성당/피정의집 시트 전환은 무거운 가로 swiper 애니메이션 없이 즉시 전환하고, 내부 좌우 스와이프 전환은 비활성화한다.
  if(prevName) _closeSheetOnly(prevName);
  if(name!=='route') _closeRouteUiForNonRouteTab();

  closeInfoCard({keepMap:true});
  _curFromRegion=false;
  if(name!=='route') resetRoute();
  _exitRouteMode();
  if(_mode==='parish'){
    if(name==='nearby'){
      _setParishMapLayerMode('nearby','open-tab');
      try{ _clearParishNearbyMarkers(); }catch(e){ console.warn('[가톨릭길동무]',e); }
      try{ _clearParishDioLayerForNearby(); }catch(e){ console.warn('[가톨릭길동무]',e); }
    }else{
      try{ _clearParishNearbyResults('open-tab:'+name); }catch(e){ console.warn('[가톨릭길동무]',e); }
      _restoreMapMarkers();
    }
  }else{
    _restoreMapMarkers();
  }
  _resetTabWork(name);
  if(_mode==='shrine' && name==='nearby'){
    window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
    window.__OAI_SHRINE_NEARBY_LOADING__=true;
    window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__=false;
    try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
    try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
  }
  _activeTab=name;
  try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}

  const sheet=$('sheet-'+name);
  if(sheet){
    if(name==='route'){
      sheet.hidden = false;
      sheet.removeAttribute('hidden');
      sheet.setAttribute('aria-hidden','false');
    }
    sheet.style.display='';
    sheet.classList.remove('oai-preopen-nearby','from-right','from-left','exit-left','exit-right');
    sheet.classList.add('open');
  }
  _syncMapPanelUI('open-tab:'+name);

  _updateTabBtns(name);
  if(name==='nearby'){
    try{ window.__OAI_NEARBY_PREOPEN_MODE__ = null; }catch(_e){}
    _loadNearby();
  }
  else if(name==='list')  { renderList(); if(shouldAutoFocusKeyboard) oaiFocusSearchKeyboardInput('list-srch-inp'); }
  else if(name==='region'){ if(shouldAutoFocusKeyboard) oaiFocusSearchKeyboardInput('region-inp'); }
  else if(name==='route') _enterRouteMode();
  setTimeout(()=>_scrollSheetTop(name), 30);
}

function closeTab(name){
  if(!name) return;
  // 휴대전화 뒤로가기와 화면 X가 성당 내주변 창에서 같은 단일 닫기 흐름을 사용한다.
  if(name==='nearby' && _mode==='parish'){
    closeSheetPanelOnly(name);
    return;
  }
  let _routeDest = null;
  let _routeRegionStartKeep = null;
  if(name === 'route' && _rE && _rE.lat){
    _routeDest = Object.assign({}, _rE);
    if(_routeRegionStart && _routeRegionStart.lat) _routeRegionStartKeep = Object.assign({}, _routeRegionStart);
  }
  _closeSheetOnly(name);
  if(_activeTab===name) _activeTab=null;
  _updateTabBtns(null);
  if(name==='route'){
    setTimeout(function(){
      try{ resetRoute(); }catch(e){ console.warn("[가톨릭길동무]", e); }
      _routeMode=false;
      if(_routeDest){
        const items = _getCurrentItems();
        const idx = (typeof _routeDest.idx==='number' && _routeDest.idx>=0)
          ? _routeDest.idx
          : items.findIndex(p=>Number(p.lat)===Number(_routeDest.lat) && Number(p.lng)===Number(_routeDest.lng));
        if(idx>=0){
          const item=items[idx];
          if(item) setTimeout(()=>{
            try{
              if(_mode==='shrine') _selectShrineMarker(idx);
              else if(_mode==='parish') _selectParishMarker(item);
              else _selectRetreatMarker(item);
              if(_routeRegionStartKeep && _routeRegionStartKeep.lat){
                _routeRegionStart = Object.assign({}, _routeRegionStartKeep);
                _regionLat = _routeRegionStartKeep.lat;
                _regionLng = _routeRegionStartKeep.lng;
                _regionPlaceName = _routeRegionStartKeep.placeName || _routeRegionStartKeep.name || _regionPlaceName;
                _regionName = _routeRegionStartKeep.placeName || _routeRegionStartKeep.name || _regionName;
                _curFromRegion = true;
              }
              _showInfoCard(item,idx);
            }catch(e){ console.warn("[가톨릭길동무]", e); }
          }, 90);
        }
      }
    }, OAI_ROUTE_VISUAL_DELAY_MS);
  } else {
    _restoreMapMarkers();
    if(name==='nearby') _scheduleNearbyMyLocationPlainRestore('nearby-close-back');
  }
}

function _closeSheetOnly(name){
  if(!name) return;
  const sh = $('sheet-'+name);
  if(!sh) return;
  sh.classList.remove('open');
  if(name==='route'){
    sh.setAttribute('aria-hidden','true');
    sh.hidden = true;
    sh.style.display = 'none';
  }
}

function closeAllTabs(){
  ['nearby','list','region','route'].forEach(n=>_closeSheetOnly(n));
  _closeRouteUiForNonRouteTab();
  _activeTab=null;
  _updateTabBtns(null);
}

function _scrollSheetTop(name){
  const sheet=$('sheet-'+name);
  if(sheet) sheet.scrollTop=0;
  const body = name==='nearby' ? $('nearby-body') : name==='list' ? $('list-body') : name==='region' ? $('region-body') : name==='route' ? $('sheet-route') : null;
  if(body) body.scrollTop=0;
}

function _resetTabWork(name){
  document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
  if(name!=='route'){
    _listSrch='';
    const lsi=$('list-srch-inp'); if(lsi) lsi.value='';
    const lsx=$('list-srch-x'); if(lsx) lsx.style.display='none';
    _filterDio='all';
    $$('.filter-btn').forEach((b,i)=>b.classList.toggle('active', i===0 || b.textContent.trim()==='전체'));
    try{ _cancelRegionLoad(); }catch(_e){}
    _regionLat=null;_regionLng=null;_regionCache=[];
    _clearRegionMarker();
    _clearRegionResultMarkers();
    _routeRegionStart=null;
    const ri=$('region-inp'); if(ri) ri.value='';
    const rb=$('region-body');
    if(rb) rb.innerHTML=_regionGuideHtml();
  }
  _scrollSheetTop(name);
}

function toggleTab(name){
  if(_activeTab===name && _oaiMapPanelCollapsed){
    _setMapPanelCollapsed(false,'active-tab-button');
    return;
  }
  if(name!=='route') _closeRouteUiForNonRouteTab();
  if(_activeTab===name){
    closeInfoCard({keepMap:true});
    _resetTabWork(name);
    if(name==='nearby') _loadNearby();
    else if(name==='list') { renderList(); oaiFocusSearchKeyboardInput('list-srch-inp'); }
    else if(name==='region'){
      try{ _cancelRegionLoad(); }catch(_e){}
      _regionLat=null;_regionLng=null;_regionCache=[];
      _clearRegionMarker();
      _clearRegionResultMarkers();
      const ri=$('region-inp'); if(ri) ri.value='';
      const rb=$('region-body');
      if(rb) rb.innerHTML=_regionGuideHtml();
      oaiFocusSearchKeyboardInput('region-inp');
    }
    else if(name==='route'){ try{ _setRouteTabInfoCardHidden(true); closeInfoCard({keepMap:true}); }catch(e){ console.warn('[가톨릭길동무]', e); } resetRoute({fresh:true}); _enterRouteMode(); }
    setTimeout(()=>_scrollSheetTop(name),30);
    return;
  }
  if(name==='route'){
    try{ _setRouteTabInfoCardHidden(true); closeInfoCard({keepMap:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
    resetRoute({fresh:true});
  }
  openTab(name, {keyboard:true});
}

function _updateTabBtns(active){
  let activeBtn = null;
  $$('.tab-btn').forEach(b=>{
    const on = b.dataset.tab===active;
    b.classList.toggle('active', on);
    if(on) activeBtn = b;
  });
  if(activeBtn){
    try{ activeBtn.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'}); }catch(e){ console.warn("[가톨릭길동무]", e); }
  }
  try{ if(typeof window.oaiKeepActiveTabsVisible === 'function') window.oaiKeepActiveTabsVisible('map-tab'); }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function oaiScrollActiveTabIntoView(container, behavior){
  try{
    if(!container) return false;
    var active = container.querySelector('.active,.on,[aria-selected="true"],[aria-pressed="true"]');
    if(!active) return false;
    if(active === container) return false;
    active.scrollIntoView({behavior: behavior || 'smooth', block:'nearest', inline:'center'});
    return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); return false; }
}
function oaiKeepActiveTabsVisible(reason){
  try{
    var selectors = [
      '#tabbar',
      '#prayer-tabs',
      '#web-cats',
      '.trail-tabs',
      '#srch-modal #sm-tab-bar',
      '#sm-tab-bar'
    ];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(container){
        oaiScrollActiveTabIntoView(container, reason === 'instant' ? 'auto' : 'smooth');
      });
    });
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
window.oaiKeepActiveTabsVisible = oaiKeepActiveTabsVisible;
document.addEventListener('click', function(e){
  try{
    var t = e.target;
    if(!t || !t.closest) return;
    if(!t.closest('.tab-btn,.pr-tab,.web-cat-btn,.trail-tab,.sm-tab,.filter-btn')) return;
    setTimeout(function(){ oaiKeepActiveTabsVisible('click'); }, 30);
    setTimeout(function(){ oaiKeepActiveTabsVisible('click-late'); }, 220);
  }catch(err){ console.warn("[가톨릭길동무]", err); }
}, true);

function _nearbyMyLocationDefaultLevel(mode){
  if(mode==='shrine') return 8;
  if(mode==='parish') return 6;
  if(mode==='retreat') return 9;
  return null;
}
function _restoreNearbyMyLocationPlain(reason, opts){
  opts = opts || {};
  if(_isShrineMapTargetCenterLocked()) return false;
  if(!_map || !_myLat || !_myLng || typeof _LL==='undefined') return false;
  if(!(_mode==='shrine' || _mode==='parish' || _mode==='retreat')) return false;
  try{
    const level = _nearbyMyLocationDefaultLevel(_mode);
    if(opts.setDefaultLevel===true && level && typeof _map.setLevel==='function'){
      _map.setLevel(level);
    }
    _map.setCenter(new _LL(_myLat,_myLng));
    _raiseMyLocationMarker();
    return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

function _nearbyMapItemsForMode(items, mode){
  /* V8-1-14-679:
     내주변 목록의 10개 제한은 목록 렌더링에만 적용한다.
     지도 마커 데이터는 성당은 해당 교구 전체, 성지·피정의집은 전국 전체를 그대로 사용한다. */
  return Array.isArray(items)?items.filter(function(p){ return p && p.lat && p.lng && p.lat!==0 && p.lng!==0; }):[];
}
function _focusNearbyInitialMap(lat,lng, reason){
  if(!_map || !lat || !lng || typeof _LL==='undefined') return false;
  try{
    return _restoreNearbyMyLocationPlain(reason || 'nearby-map-initial', {setDefaultLevel:true});
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}
function _focusNearbySelectedItem(item){
  if(!_map || !item || !item.lat || !item.lng || typeof _LL==='undefined') return false;
  try{
    const targetLevel = (_mode==='parish') ? 6 : 7;
    if(typeof _map.getLevel==='function' && typeof _map.setLevel==='function'){
      const lvl=_map.getLevel();
      if(lvl > targetLevel) _map.setLevel(targetLevel);
    }
    return _setMapCenterByInfoCardStandard(new _LL(item.lat,item.lng));
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

function _scheduleNearbyMyLocationPlainRestore(reason){
  try{
    if(!_map || !_myLat || !_myLng) return;
    // V8-1-14-621: 성지·성당·피정의집 내주변 목록을 닫은 뒤에는
    // 정보카드/교구/bounds 보정값을 쓰지 않고 내 위치를 같은 화면 기준으로 복원한다.
    setTimeout(function(){ _restoreNearbyMyLocationPlain(reason,{setDefaultLevel:false}); }, 40);
    setTimeout(function(){ _restoreNearbyMyLocationPlain(reason + ':settled',{setDefaultLevel:false}); }, 180);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _getInfoCardCenterTargetY(mapH){
  return Math.round((mapH || 700) * 0.34);
}
function _setMapCenterByInfoCardStandard(pos){
  if(!_map || !pos) return false;
  try{
    if(_isMapSplitWideLayout()){
      _map.setCenter(pos);
      return true;
    }
    const mapEl = $('map-wrap') || $('map');
    const mapH = (mapEl && (mapEl.clientHeight || mapEl.offsetHeight)) || window.innerHeight || 700;
    const proj = _map.getProjection && _map.getProjection();
    if(proj && proj.containerPointFromCoords && proj.coordsFromContainerPoint){
      const p = proj.containerPointFromCoords(pos);
      const centerY = Math.round(mapH / 2);
      const targetY = _getInfoCardCenterTargetY(mapH);
      const point = (window.kakao && kakao.maps && kakao.maps.Point)
        ? new kakao.maps.Point(p.x, p.y + (centerY - targetY))
        : {x:p.x, y:p.y + (centerY - targetY)};
      const newCenter = proj.coordsFromContainerPoint(point);
      if(newCenter){ _map.setCenter(newCenter); return true; }
    }
    _map.setCenter(pos);
    return true;
  }catch(e){ console.warn("[가톨릭길동무]", e); }
  return false;
}
function _biasCurrentMapCenterToInfoCardStandard(){
  if(!_map || typeof _map.getCenter!=='function') return false;
  try{ return _setMapCenterByInfoCardStandard(_map.getCenter()); }
  catch(e){ console.warn("[가톨릭길동무]", e); }
  return false;
}
function _setBoundsByInfoCardStandard(bounds, top, right, bottom, left){
  if(!_map || !bounds) return false;
  try{
    _map.setBounds(bounds, top, right, bottom, left);
    _biasCurrentMapCenterToInfoCardStandard();
    return true;
  }catch(e1){
    try{
      _map.setBounds(bounds);
      _biasCurrentMapCenterToInfoCardStandard();
      return true;
    }catch(e2){ console.warn("[가톨릭길동무]", e2); }
  }
  return false;
}

function _getRouteBoundsPadding(){
  const mapEl = $('map-wrap') || $('map');
  const mapH = (mapEl && (mapEl.clientHeight || mapEl.offsetHeight)) || window.innerHeight || 700;
  const tabH = ($('tabbar') && $('tabbar').offsetHeight) || 54;
  if(_isMapSplitWideLayout()) return {top:tabH+12,right:42,bottom:42,left:42};
  const sheet = $('sheet-route');
  let sheetH = 0;
  try{
    if(sheet && sheet.classList.contains('open')){
      const r = sheet.getBoundingClientRect ? sheet.getBoundingClientRect() : null;
      sheetH = Math.ceil((r && r.height) || sheet.offsetHeight || 0);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  const bottomMin = 172;
  const bottomMax = Math.max(210, Math.round(mapH * 0.62));
  const bottom = Math.min(bottomMax, Math.max(bottomMin, sheetH + 28));
  return { top: tabH + 12, right: 52, bottom: bottom, left: 52 };
}
function _fitRouteBounds(bounds, opts){
  if(!_map || !bounds) return false;
  const pad = _getRouteBoundsPadding();
  try{
    _map.setBounds(bounds, pad.top, pad.right, pad.bottom, pad.left);
    if(opts && opts.repeat){
      setTimeout(function(){ try{ const p=_getRouteBoundsPadding(); _map.setBounds(bounds, p.top, p.right, p.bottom, p.left); }catch(e){ console.warn('[가톨릭길동무]', e); } }, 90);
      setTimeout(function(){ try{ const p=_getRouteBoundsPadding(); _map.setBounds(bounds, p.top, p.right, p.bottom, p.left); }catch(e){ console.warn('[가톨릭길동무]', e); } }, 260);
    }
    return true;
  }catch(e1){
    try{ _map.setBounds(bounds); return true; }
    catch(e2){ console.warn('[가톨릭길동무]', e2); }
  }
  return false;
}

function _focusMarkerAboveInfoCard(item){
  if(!_map || !item || !item.lat || !item.lng) return;
  try{
    _setMapCenterByInfoCardStandard(new _LL(item.lat,item.lng));
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function _centerCurrentLocationPlain(lat,lng,level){
  if(!_map || !lat || !lng || typeof _LL==='undefined') return false;
  try{
    if(level && typeof _map.setLevel==='function') _map.setLevel(level);
    _map.setCenter(new _LL(lat,lng));
    return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}

window.oaiNormalizeMainMapAfterViewport = function(reason, captured){
  try{
    if(!_map || typeof _LL==='undefined') return;
    if(typeof _map.getLevel==='function' && captured && captured.level != null){
      if(_map.getLevel() !== captured.level) _map.setLevel(captured.level);
    }
    var hasInfo = false;
    try{ var info=document.getElementById('info-card'); hasInfo=!!(info&&info.classList.contains('open')); }catch(_e){}
    if(!hasInfo && _myLat && _myLng && (_activeTab==='nearby' || reason && /viewport|resize|fold|orientation/.test(String(reason)))){
      _map.setCenter(new _LL(_myLat,_myLng));
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
};

function selectItem(idx, opts={}){
  const items = _getCurrentItems();
  const item  = items[idx];
  if(!item) return;
  const fromSearchList = !!(_listSrch && _listSrch.trim());
  const fromRegionState = !!((opts.fromRegion || _isRegionSearchActiveForItem(item)) && _regionLat && _regionLng);
  _curFromRegion = fromRegionState;
  if(fromRegionState) _rememberRegionStart(_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
  closeAllTabs();
  if(_mode==='shrine'){
  if(fromRegionState){
   _showRegionResultsOnMap(_regionCache,_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
  } else if(fromSearchList){
   _restoreAllCategoryMarkersForSelection();
  } else if(opts.fromNearby && _nearbyCache.length>0){
   _showAllShrinesOnMapWithNearbyBounds(_nearbyCache,_myLat,_myLng);
  } else {
   _restoreMapMarkers();
  }
  _selectShrineMarker(idx);
  } else if(_mode==='parish') {
  if(fromRegionState) _showRegionResultsOnMap(_regionCache,_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
  _selectParishMarker(item);
  } else {
  if(fromRegionState) _showRegionResultsOnMap(_regionCache,_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
  else if(fromSearchList) _restoreAllCategoryMarkersForSelection();
  _selectRetreatMarker(item);
  }
  _showInfoCard(item, idx);
  if(opts.fromNearby) _focusNearbySelectedItem(item);
}

function _isParishMassNoticeDiocese(item){
  try{
    if(_mode!=='parish' || !item) return false;
    var dio = String(item.diocese || '');
    return dio === '마산교구' || dio === '의정부교구';
  }catch(_e){ return false; }
}
function _renderParishMassTimeNotice(item){
  try{
    var addrRow = document.querySelector('#info-card .ic-addr-row');
    if(!addrRow) return;
    var box = document.getElementById('ic-parish-mass-notice');
    if(!box){
      box = document.createElement('div');
      box.id = 'ic-parish-mass-notice';
      box.className = 'ic-parish-mass-notice';
      addrRow.insertAdjacentElement('afterend', box);
    }
    if(_isParishMassNoticeDiocese(item)){
      box.innerHTML = '<div class="ic-parish-mass-notice-title">미사시간 안내</div><div class="ic-parish-mass-notice-text">해당 본당의 미사시간은 상세페이지에서 확인할 수 없습니다. 정확한 시간은 본당 사무실로 전화 문의하시거나, 본당 홈페이지에서 확인해 주세요.</div>';
      box.style.display = 'block';
    }else{
      box.style.display = 'none';
      box.innerHTML = '';
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _fitInfoCardButtons(){
  try{
    const btns=document.querySelectorAll('#info-card .ic-link-btn,#info-card .ic-route-btn,#info-card .ic-tel-btn,#info-card .btn-kakao-nav');
    btns.forEach(btn=>{
      btn.style.fontSize='16px';
      btn.style.letterSpacing='-.04em';
      btn.style.whiteSpace='nowrap';
      let size=16;
      while(size>11 && btn.scrollWidth>btn.clientWidth){
        size-=0.5;
        btn.style.fontSize=size+'px';
      }
    });
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function _showInfoCard(item, idx){
  // V8-1-14-621: 길찾기 탭/경로검색 시트가 열린 동안에는
  // 마커 클릭이나 비동기 후속 처리로 장소 정보카드가 다시 뜨지 않게 막는다.
  // 경로 탭을 닫은 뒤 기존 선택 장소를 복원하는 흐름은 _activeTab/시트 상태가 route가 아니므로 유지된다.
  try{
    if(_isRouteSelectionModeActive()){
      var card = $('info-card');
      if(card) card.classList.remove('open');
      _curInfoItem = null;
      _curFromRegion = false;
      return;
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }

  _curInfoItem = {item, idx};

  $('ic-name').innerHTML = String(item.name||'') + _shrineNewBadgeHtml(item);
  $('ic-sub').textContent  = item.diocese;
  _renderInfoCardShrineKind(item);
  _renderInfoCardShrinePilgrimBadge(item);
  $('ic-addr').textContent = item.addr;
  _renderParishMassTimeNotice(item);
  let noteEl=$('ic-note');
  if(!noteEl){
  noteEl=document.createElement('div');
  noteEl.id='ic-note';
  noteEl.className='ic-note';
  $('ic-addr').closest('.ic-addr-row').insertAdjacentElement('afterend', noteEl);
  }
  if(item.note){noteEl.textContent=item.note;noteEl.style.display='block';}
  else noteEl.style.display='none';
  const telBtn=$('ic-tel-link');
  const routeBtn=document.querySelector('.ic-route-btn');
  if(item.tel){
  $('ic-tel').textContent=item.tel;
  telBtn.href='tel:'+item.tel.replace(/[^0-9+]/g,'');
  _show(telBtn);
  } else {
  _hide(telBtn);
  }
  const distCol=$('ic-dist-col');
  const distEl=$('ic-dist');
  distCol.classList.remove('ready');
  distEl.textContent='—';           // 미리 공간 확보(레이아웃 고정)
  if(_myLat && item.lat){
  const _snap=item;
  (async()=>{
   try{
    const res=await _kakaoDirectionsFetch(`${_myLng},${_myLat}`, `${_snap.lng},${_snap.lat}`);
    if(!res.ok) throw new Error('fail');
    const data=await res.json();
    const route=data.routes?.[0];
    if(route&&route.result_code===0){
     const km=(route.summary.distance/1000).toFixed(1);
     if(_curInfoItem&&_curInfoItem.item===_snap){
      distEl.textContent=km+' km';
      distCol.classList.add('ready');
     }
    }
   }catch(e){ console.warn("[가톨릭길동무]", e); }
  })();
  }
  const hp=$('ic-hp');
  const hpUrl = (_mode==='shrine') ? _getShrineHomepageUrl(item) : (item.hp ? normalizeCatholicExternalUrl(item.hp) : '');
  if(hpUrl){
    hp.href = hpUrl;
    hp.target = '_self';
    hp.rel = 'noopener';
    hp.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      openCoreExternalUrl(hpUrl,{infoIdx:idx, source:'homepage'});
    };
    _show(hp);
  }
  else _hide(hp);
  const guide=$('ic-guide');
  let guideShown=false;
  if(_mode==='shrine'){
    const guideUrl=_getShrineGuideUrl(item);
    if(guideUrl){ guide.onclick=()=>openCoreExternalUrl(guideUrl,{infoIdx:idx, source:'shrine-detail'}); guide.textContent='성지 상세페이지'; _show(guide); guideShown=true;}
    else _hide(guide);
  } else {
    if(item.url){ guide.onclick=()=>openCoreExternalUrl(item.url,{infoIdx:idx}); guide.textContent=(_mode==='retreat'?'피정의 집 상세페이지':'교구 성당 안내'); _show(guide); guideShown=true;}
    else _hide(guide);
  }
  const linksRow=$('ic-links-row');
  if(linksRow) (hpUrl||guideShown)?_show(linksRow):_hide(linksRow);

  const goodnewsBtn=$('ic-goodnews');
  const goodnewsUrl=(_mode==='shrine') ? _getShrineGoodnewsUrl(item) : '';
  if(goodnewsBtn){
    if(goodnewsUrl){
      goodnewsBtn.onclick=function(e){
        if(e){ e.preventDefault(); e.stopPropagation(); }
        openCoreExternalUrl(goodnewsUrl,{infoIdx:idx, source:'shrine-goodnews'});
      };
      goodnewsBtn.setAttribute('data-shrine-goodnews-url', goodnewsUrl);
      goodnewsBtn.textContent='굿뉴스 성지안내';
      _show(goodnewsBtn);
    } else {
      goodnewsBtn.onclick=null;
      goodnewsBtn.removeAttribute('data-shrine-goodnews-url');
      _hide(goodnewsBtn);
    }
  }

  /* R2 사진 자료가 있는 명례성지·언양성당만 3개 외부 링크를 '성지 자료' 화면으로 묶는다. */
  if(_mode==='shrine'&&_isMyeongryeShrine(item)){
    hp.removeAttribute('href'); hp.textContent='성지 자료';
    hp.onclick=function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } _openMyeongryeMaterials(item); };
    _show(hp); _hide(guide); _hide(goodnewsBtn); _show(linksRow);
  }else if(hp){
    hp.textContent='홈페이지';
  }

  _renderInfoCardShrineVisit(item);
  $('info-card').classList.add('open');
  _oaiMapPanelCollapsed=false;
  _syncMapPanelUI('show-info-card');
  _scheduleInfoCardMarkerFocus(item,'show-info-card');
  try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
  try{ _updateParishVisitButton(); }catch(_e){}
  setTimeout(_fitInfoCardButtons, 0);
  setTimeout(_fitInfoCardButtons, 80);
}

function closeInfoCard(opts){
  opts = opts || {};
  ++_oaiInfoCardFocusToken;
  const wasItem = _curInfoItem; // 닫기 전에 저장
  const card = $('info-card');
  if(card) card.classList.remove('open');
  try{ var massNotice=document.getElementById('ic-parish-mass-notice'); if(massNotice){ massNotice.style.display='none'; massNotice.innerHTML=''; } }catch(_e){}
  try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
  try{ _updateParishVisitButton(); }catch(_e){}
  _curInfoItem=null;
  _curFromRegion=false;
  if(_mode==='shrine') _clearShrineMarkerSel();
  else {
    if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }  _paSelMkr=null;}
  }
  if(!opts.keepMap && wasItem && wasItem.item && wasItem.item.lat && _map){
    try{ _focusMarkerAboveInfoCard(wasItem.item); }catch(e){ console.warn("[가톨릭길동무]", e); }
  }
  _syncMapPanelUI('close-info-card');
}

function oaiClearMapInfoSelection(reason){
  try{
    closeInfoCard({keepMap:true});
    _curInfoItem=null;
    _curFromRegion=false;
    if(_mode==='shrine') _clearShrineMarkerSel();
    else if(_paSelMkr){
      try{ _paSelMkr.setMap(null); }catch(e){ console.warn('[가톨릭길동무]', e); }
      _paSelMkr=null;
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.oaiClearMapInfoSelection=oaiClearMapInfoSelection; }catch(e){ console.warn('[가톨릭길동무]', e); }

function openInAppRoute(){
  // 정보카드 경로검색의 예외 fallback이다. 자동 조회는 지도 선택창의
  // '도착지로 설정' 버튼(_handleRouteChoiceEnd)에서만 허용한다.
  _setInfoRouteEnd({autoSearch:false});
}

function _routeStartLabelFilled(){
  try{
    const el=$('rs-start-lbl');
    const txt=(el&&el.textContent?el.textContent:'').trim();
    return !!(txt && !txt.includes('선택하세요'));
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function _routeHasVisibleStart(){
  return !!(_rS && _rS.lat && _rS.lng && (!_rS.isImplicitCurrentLocation || _routeStartLabelFilled()));
}
function _restoreRouteSelectionMarkersAfterReset(opts){
  opts = opts || {};
  try{
    if(_mode==='parish'){
      try{ _clearRegionResultMarkers(); }catch(e){ console.warn('[가톨릭길동무]', e); }
      _restoreMapMarkers({parishRouteReselect:opts.parishRouteReselect===true});
    }else if(_mode==='shrine' || _mode==='retreat'){
      _restoreAllCategoryMarkersForSelection();
    }else{
      _restoreMapMarkers();
    }
    if(_routeRegionStart && _routeRegionStart.lat && _routeRegionStart.lng){
      _showRegionPlaceMarker(
        _routeRegionStart.lat,
        _routeRegionStart.lng,
        _routeRegionStart.placeName || _routeRegionStart.name || _regionPlaceName || _regionName || '검색지'
      );
    }else if(_regionLat && _regionLng && _regionMarker){
      _showRegionPlaceMarker(_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _clearRouteVisualOnly(){
  try{
    if(_polyline){ _polyline.setMap(null); _polyline=null; }
    _hide($('rs-result'));
    _setRouteResultTipVisible(false);
    const hint=$('rs-hint'); if(hint) hint.style.display='block';
    _showJukrimgulParkingMkr(false);
    _clearRouteTmpMarkers();
    _restoreRouteSelectionMarkersAfterReset();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _restoreRouteMarkerVisual(role, routeItem){
  try{
    if(!routeItem || routeItem.idx<0) return;
    if(_mode==='shrine' && _markers[routeItem.idx]){
      const s=_markers[routeItem.idx].shrine;
      _markers[routeItem.idx].marker.setImage(_mkrImg(_shrineMarkerColor(s),false));
      _markers[routeItem.idx].marker.setZIndex(1);
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _getRouteWaypointConfig(role){
  return OAI_ROUTE_WAYPOINT_CONFIGS.find(function(cfg){ return cfg.role===role; }) || null;
}
function _getRouteWaypointConfigByIndex(index){
  return OAI_ROUTE_WAYPOINT_CONFIGS[index-1] || null;
}
function _isRouteWaypointRole(role){
  return !!_getRouteWaypointConfig(role);
}
function _routeWaypointIndex(role){
  const cfgIndex=OAI_ROUTE_WAYPOINT_CONFIGS.findIndex(function(cfg){ return cfg.role===role; });
  return cfgIndex>=0 ? cfgIndex+1 : 0;
}
function _routeWaypointColor(role){
  const cfg=_getRouteWaypointConfig(role);
  return cfg ? cfg.color : '#f39c12';
}
function _routeRoleColor(role){
  if(role==='start') return '#E53935';
  if(role==='end') return '#2E7D32';
  return _routeWaypointColor(role);
}
function _routeRoleShort(role){
  if(role==='start') return '출';
  if(role==='end') return '도';
  return '경'+_routeWaypointIndex(role);
}
function _routeSearchTitle(role,noun){
  if(role==='start') return `🔵 출발 ${noun} 검색`;
  if(role==='end') return `🔴 도착 ${noun} 검색`;
  return `🟠 경유지${_routeWaypointIndex(role)} ${noun} 검색`;
}
function _routeWaypointMarkerText(role){
  return '경'+_routeWaypointIndex(role);
}
function _routePointCancelTitle(role){
  if(role==='start') return '출발지를 취소하시겠습니까?';
  if(role==='end') return '도착지를 취소하시겠습니까?';
  return '경유지' + _routeWaypointIndex(role) + '을 취소하시겠습니까?';
}
function _routePointCancelButtonText(role){
  if(role==='start') return '출발지 취소';
  if(role==='end') return '도착지 취소';
  return '경유지' + _routeWaypointIndex(role) + ' 취소';
}
function _getRoutePointByRole(role){
  if(role==='start') return _rS;
  if(role==='end') return _rE;
  const cfg=_getRouteWaypointConfig(role);
  return cfg ? window[cfg.pointKey] : null;
}
function _setRoutePointByRole(role, obj){
  if(role==='start'){ _rS=obj; return; }
  if(role==='end'){ _rE=obj; return; }
  const cfg=_getRouteWaypointConfig(role);
  if(cfg) window[cfg.pointKey]=obj;
}
function _getRouteWaypointEnabledByRole(role){
  const cfg=_getRouteWaypointConfig(role);
  return !!(cfg && window[cfg.enabledKey]);
}
function _setRouteWaypointEnabledByRole(role, enabled, opts){
  const cfg=_getRouteWaypointConfig(role);
  if(!cfg) return;
  window[cfg.enabledKey]=!!enabled;
  if(!(opts&&opts.deferSync)) _syncRouteWaypointBoxes();
}
function _routeWaypointSlotOccupied(role){
  const point=_getRoutePointByRole(role);
  return !!(_getRouteWaypointEnabledByRole(role) || (point&&point.lat&&point.lng));
}
function _nextAvailableWaypointRole(){
  for(const cfg of OAI_ROUTE_WAYPOINT_CONFIGS){
    if(!_routeWaypointSlotOccupied(cfg.role)) return cfg.role;
  }
  return null;
}
function _getRouteWaypoints(){
  return OAI_ROUTE_WAYPOINT_CONFIGS.map(function(cfg){ return _getRoutePointByRole(cfg.role); })
    .filter(function(point){ return !!(point&&point.lat&&point.lng); });
}
function _routeWaypointsReadyCount(){ return _getRouteWaypoints().length; }
function _refreshExistingRoutePointMarkerImages(){
  try{
    if(_mode!=='shrine') return;
    if(_rS && !_rS.isRegionStart && _shouldShowRouteStartMarker() && _rS.idx>=0 && _markers[_rS.idx]){
      _markers[_rS.idx].marker.setImage(_mkrImgRoute('#ff0000','출'));
      _setRouteMarkerZ(_rS.idx,'start');
    }
    OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
      const point=_getRoutePointByRole(cfg.role);
      if(point && point.idx>=0 && _markers[point.idx]){
        _markers[point.idx].marker.setImage(_mkrImgRoute(_routeWaypointColor(cfg.role),_routeWaypointMarkerText(cfg.role)));
        _setRouteMarkerZ(point.idx,cfg.role);
      }
    });
    if(_rE && _rE.idx>=0 && _markers[_rE.idx]){
      const s=_markers[_rE.idx].shrine;
      _markers[_rE.idx].marker.setImage(_mkrImgRoute(_typeColor(s.type),'도'));
      _setRouteMarkerZ(_rE.idx,'end');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _restoreMarkersForRouteDestinationSelection(){
  try{
    if(!_map || !_routeMode || !_rS || _rE || _polyline) return;
    if(_mode==='parish'){
      if(_paSelMkr){ try{ _paSelMkr.setMap(null); }catch(e){ console.warn('[가톨릭길동무]', e); } _paSelMkr=null; }
      const items=_getCurrentItems ? _getCurrentItems() : [];
      const startItem=(_rS.idx>=0 && items && items[_rS.idx]) ? items[_rS.idx] : null;
      const code=startItem ? _parishDioCodeOf(startItem) : (_activeDio || null);
      if(code){
        if(_mode==='parish' && !_isParishDioceseReady(code)){
          _ensureParishDioceseDataLoaded(code).then(function(){
            try{ _restoreMarkersForRouteDestinationSelection(); }catch(e){ console.warn('[가톨릭길동무]', e); }
          }).catch(function(err){ console.warn('[가톨릭길동무] 성당 교구 데이터 로드 실패', err); });
          return;
        }
        try{ _clearParishNearbyResults('list-filter:'+code); }catch(_e){}
        try{ _hideAllParishDioMkrs(); }catch(_e){}
        _activeDio=code;
        _showParishDioMkrs(code);
        _syncParishDioLabels();
      }else{
        _restoreMapMarkers();
      }
      _refreshRouteTmpMarkers();
      return;
    }
    if(_mode==='shrine' || _mode==='retreat') _restoreAllCategoryMarkersForSelection();
    else _restoreMapMarkers();
    _refreshRouteTmpMarkers();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _setRoutePointFromItem(role,item,idx){
  if(!item) return;
  if(role==='end' && item.navAddr && !item.__navResolved){
    return _resolveNavigationDestinationItem(item).then(function(navItem){
      return _setRoutePointFromItem(role,navItem,idx);
    });
  }
  if(!item.lat||!item.lng) return;
  _clearRouteVisualOnly();
  if(role==='start'){
    _restoreRouteMarkerVisual('start',_rS);
    _routeRegionStart=null;
    _routeStartMarkerExplicitCurrent=false;
    _rS={idx:idx,name:item.name,lat:item.lat,lng:item.lng};
    _setRouteLabel('start',item.name);
    if(_mode==='shrine'&&_shouldShowRouteStartMarker()&&idx>=0&&_markers[idx]){ _markers[idx].marker.setImage(_mkrImgRoute('#ff0000','출')); _setRouteMarkerZ(idx,'start'); }
    _refreshRouteTmpMarkers();
    if(_rE){ _hideRouteGuide(); _updateSearchBtn(); }
    else { _showRouteGuideText(`도착 ${_getRouteGuideTarget()}를 탭하세요`); }
    _restoreMarkersForRouteDestinationSelection();
  }else if(_isRouteWaypointRole(role)){
    const oldPoint=_getRoutePointByRole(role);
    _restoreRouteMarkerVisual(role,oldPoint);
    _setRouteWaypointEnabledByRole(role,true);
    _setRoutePointByRole(role,{idx:idx,name:item.name,lat:item.lat,lng:item.lng});
    if(_mode==='shrine'&&idx>=0&&_markers[idx]){ _markers[idx].marker.setImage(_mkrImgRoute(_routeWaypointColor(role),_routeWaypointMarkerText(role))); _setRouteMarkerZ(idx,role); }
    _setRouteLabel(role,item.name);
    _syncRouteWaypointBox();
    _refreshRouteTmpMarkers();
    if(_rS&&_rE){ _hideRouteGuide(); _updateSearchBtn(); }
  }else{
    _restoreRouteMarkerVisual('end',_rE);
    _rE={idx:idx,name:item.name,lat:item.lat,lng:item.lng};
    if(_mode==='shrine'&&idx>=0&&_markers[idx]){ _markers[idx].marker.setImage(_mkrImgRoute(_typeColor(item.type),'도')); _setRouteMarkerZ(idx,'end'); }
    _setRouteLabel('end',item.name);
    _refreshRouteTmpMarkers();
    if(_rS){
      _hideRouteGuide();
      _updateSearchBtn();
    }else{
      _showRouteGuideText(`출발 ${_getRouteGuideTarget()}를 탭하세요`);
    }
  }
}
function _infoRouteHasFixedStart(){
  try{
    if(_curFromRegion && _regionLat && _regionLng) return true;
    if(_routeHasVisibleStart()) return true;
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  return false;
}
let _routeChoiceMode = 'set';
let _routeCancelRole = null;
let _routeChoicePendingInfo = null;
function _getRouteChoicePendingInfo(){
  return _curInfoItem || _routeChoicePendingInfo;
}

function _prepareRouteChoiceSetUI(){
  const dlg=$('route-choice-modal');
  if(!dlg) return;
  _routeChoiceMode='set';
  _routeCancelRole=null;
  const desc=dlg.querySelector('.route-choice-desc');
  const start=$('route-choice-start');
  const end=$('route-choice-end');
  const waypoint=$('route-choice-waypoint');
  const cancel=$('route-choice-cancel');
  if(desc) desc.textContent='이 장소를 길찾기에 어떻게 사용할까요?';
  if(start){ start.className='route-choice-btn start'; start.textContent='출발지로 설정'; start.style.display=''; }
  if(end){ end.className='route-choice-btn end'; end.textContent='도착지로 설정'; end.style.display=''; }
  if(waypoint){ waypoint.className='route-choice-btn waypoint'; waypoint.textContent='경유지로 설정'; waypoint.style.display=''; }
  if(cancel){ cancel.className='route-choice-btn cancel'; cancel.textContent='취소'; cancel.style.display=''; }
}
function _prepareRouteCancelUI(role){
  const dlg=$('route-choice-modal');
  if(!dlg) return;
  _routeChoiceMode='cancel';
  _routeCancelRole=role;
  const title=$('route-choice-name');
  const desc=dlg.querySelector('.route-choice-desc');
  const start=$('route-choice-start');
  const end=$('route-choice-end');
  const waypoint=$('route-choice-waypoint');
  const cancel=$('route-choice-cancel');
  if(title) title.textContent=_routePointCancelTitle(role);
  if(desc) desc.textContent='선택을 유지하거나 해당 지점만 취소할 수 있습니다.';
  if(start){ start.className='route-choice-btn keep'; start.textContent='유지'; start.style.display=''; }
  if(end){ end.className='route-choice-btn danger'; end.textContent=_routePointCancelButtonText(role); end.style.display=''; }
  if(waypoint) waypoint.style.display='none';
  if(cancel) cancel.style.display='none';
}
function _openRoutePointCancelChoice(role){
  const dlg=$('route-choice-modal');
  if(!dlg){ clearRoute(role); return; }
  _prepareRouteCancelUI(role);
  dlg.classList.add('open');
  _syncMapPanelUI('open-route-cancel-choice');
  try{ document.activeElement&&document.activeElement.blur(); }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _handleRouteChoiceStart(){
  if(_routeChoiceMode==='cancel'){ _closeInfoRouteChoice(); return; }
  _setInfoRouteStart();
}
function _handleRouteChoiceEnd(){
  if(_routeChoiceMode==='cancel'){
    const role=_routeCancelRole;
    _closeInfoRouteChoice();
    if(role) clearRoute(role, { keepWaypointBox: _isRouteWaypointRole(role) });
    return;
  }
  // 지도 정보카드에서 사용자가 '도착지로 설정'을 직접 누른 경우에만 자동 조회한다.
  _setInfoRouteEnd({autoSearch:true});
}
function _handleRouteChoiceWaypoint(){
  if(_routeChoiceMode==='cancel') return;
  _setInfoRouteWaypoint();
}
function _openInfoRouteChoice(){
  if(!_curInfoItem) return;
  const dlg=$('route-choice-modal');
  if(!dlg){ openInAppRoute(); return; }
  _prepareRouteChoiceSetUI();
  _routeChoicePendingInfo={ item:_curInfoItem.item, idx:_curInfoItem.idx, fromRegion:!!_curFromRegion };
  const name=$('route-choice-name');
  if(name) name.textContent=_routeChoicePendingInfo.item.name||'';
  closeInfoCard({keepMap:true});
  dlg.classList.add('open');
  _syncMapPanelUI('open-info-route-choice');
  try{ document.activeElement&&document.activeElement.blur(); }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _closeInfoRouteChoice(){
  const dlg=$('route-choice-modal');
  if(dlg) dlg.classList.remove('open');
  _routeChoiceMode='set';
  _routeCancelRole=null;
  _routeChoicePendingInfo=null;
  _prepareRouteChoiceSetUI();
  _syncMapPanelUI('close-route-choice');
}
try{ window._closeInfoRouteChoice=_closeInfoRouteChoice; window._openRoutePointCancelChoice=_openRoutePointCancelChoice; }catch(e){ console.warn('[가톨릭길동무]', e); }
function _setInfoRouteStart(){
  const info=_getRouteChoicePendingInfo();
  if(!info || !info.item) return;
  const item=info.item, idx=info.idx;
  _closeInfoRouteChoice();
  closeInfoCard({keepMap:true});
  openTab('route');
  _setRoutePointFromItem('start',item,idx);
}
function _setInfoRouteWaypoint(){
  const info=_getRouteChoicePendingInfo();
  if(!info || !info.item) return;
  const role=_nextAvailableWaypointRole();
  if(!role){
    const dlg=$('route-choice-modal');
    const desc=dlg ? dlg.querySelector('.route-choice-desc') : null;
    if(desc) desc.textContent='경유지는 최대 '+OAI_MAX_ROUTE_WAYPOINTS+'곳까지 추가할 수 있습니다.';
    return;
  }
  const item=info.item, idx=info.idx;
  _closeInfoRouteChoice();
  closeInfoCard({keepMap:true});
  openTab('route');
  _setRoutePointFromItem(role,item,idx);
  if(!_rS) _showRouteGuideText('출발 '+_getRouteGuideTarget()+'를 탭하세요');
  else if(!_rE) _showRouteGuideText('도착 '+_getRouteGuideTarget()+'를 탭하세요');
}
function _setInfoRouteDestination(item,idx,opts){
  opts=opts||{};
  const pending=_setRoutePointFromItem('end',item,idx);
  if(opts.autoSearch===true){
    Promise.resolve(pending).then(function(){ if(_rS&&_rE) doSearchRoute(); });
  }
  return pending;
}
function _runInfoRouteToEndWithStart(startObj,item,idx,opts){
  _routeStartMarkerExplicitCurrent=!!(startObj && startObj.showStartMarker === true);
  if(startObj && startObj.showStartMarker !== true) delete startObj.showStartMarker;
  _rS=startObj;
  _setRouteLabel('start', startObj.name==='현재 위치' ? '현위치' : (startObj.name||'출발지'));
  _setInfoRouteDestination(item,idx,opts);
}
function _setInfoRouteEnd(opts){
  opts=opts||{};
  const info=_getRouteChoicePendingInfo();
  if(!info || !info.item) return;
  const item=info.item, idx=info.idx;
  const useRegionStart=!!((info.fromRegion || _curFromRegion) && _regionLat && _regionLng);
  _closeInfoRouteChoice();
  closeInfoCard({keepMap:true});
  if(useRegionStart){
    const placeName=_regionPlaceName||_regionName||'검색지';
    const startObj={idx:-1,name:'📍 '+placeName,lat:_regionLat,lng:_regionLng,isRegionStart:true,showStartMarker:false};
    _routeStartMarkerExplicitCurrent=false;
    _routeRegionStart={lat:_regionLat,lng:_regionLng,name:startObj.name,placeName:placeName};
    _suppressNextRouteGuide=true;
    openTab('route');
    _runInfoRouteToEndWithStart(startObj,item,idx,opts);
    return;
  }
  openTab('route');
  if(_routeHasVisibleStart()){
    _setInfoRouteDestination(item,idx,opts);
    return;
  }
  if(_myLat&&_myLng){
    _runInfoRouteToEndWithStart({idx:-1,name:'현재 위치',lat:_myLat,lng:_myLng,isImplicitCurrentLocation:false},item,idx,opts);
    return;
  }
  let usedCacheForRoute=false;
  usedCacheForRoute=_useStoredLocationIfAny(function(lat,lng){
    _runInfoRouteToEndWithStart({idx:-1,name:'현재 위치',lat:lat,lng:lng,isImplicitCurrentLocation:false},item,idx,opts);
  },OAI_LOCATION_CACHE_MAX_MS);
  if(usedCacheForRoute){
    _refreshFreshLocationThen(function(lat,lng){
      try{
        if(_rS && _rS.name==='현재 위치'){
          _rS.lat=lat; _rS.lng=lng;
          _refreshRouteTmpMarkers();
          if(_rE) _updateSearchBtn();
        }
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    },function(){});
    return;
  }
  if(!_GEO){ alert('위치 정보를 지원하지 않습니다.'); return; }
  _refreshFreshLocationThen(function(lat,lng){
    _runInfoRouteToEndWithStart({idx:-1,name:'현재 위치',lat:lat,lng:lng,isImplicitCurrentLocation:false},item,idx,opts);
  },function(){ alert('위치를 가져올 수 없습니다.'); });
}
function selectMapFromSearchModal(){
  try{
    _blurAll && _blurAll();
    closeSearchModal();
    if(!_activeTab||_activeTab!=='route') openTab('route');
    else _enterRouteMode();
    _showRouteGuideText(_routeHasVisibleStart()?`도착 ${_getRouteGuideTarget()}를 탭하세요`:`출발지를 탭하거나 지도에서 ${_getRouteGuideTarget()}를 선택하세요`);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
try{ window.selectMapFromSearchModal=selectMapFromSearchModal; }catch(e){ console.warn('[가톨릭길동무]', e); }

function openKakaoNav(){
  if(!_curInfoItem) return;
  const {item,idx}=_curInfoItem;
  const isJuk = _mode==='shrine' && idx === JUKRIMGUL_IDX && JUKRIMGUL_IDX >= 0;
  const baseNavItem = isJuk ? {...item, lat:JUKRIMGUL_PARKING.lat, lng:JUKRIMGUL_PARKING.lng, name:JUKRIMGUL_PARKING.name, __navResolved:true} : item;
  function launch(spLat,spLng,spName){
    _resolveNavigationDestinationItem(baseNavItem).then(function(navItem){
      const ep=_EC(_kakaoRouteDisplayName(navItem, '도착지'));
      const startName=spName||'현위치';
      const w=spLat?`https://map.kakao.com/link/from/${_EC(startName)},${spLat},${spLng}/to/${ep},${navItem.lat},${navItem.lng}`:
             `https://map.kakao.com/link/to/${ep},${navItem.lat},${navItem.lng}`;
      const a=spLat?`kakaomap://route?sp=${spLat},${spLng}&ep=${navItem.lat},${navItem.lng}&by=CAR`:
             `kakaomap://route?ep=${navItem.lat},${navItem.lng}&by=CAR`;
      _kakaoLaunch(w,a);
    });
  }
  if((_curFromRegion || _isRegionSearchActiveForItem(item)) && _regionLat && _regionLng){
    const placeName=_regionPlaceName||_regionName||'검색지';
    _rememberRegionStart(_regionLat,_regionLng,placeName);
    launch(_regionLat,_regionLng,'📍 '+placeName);
  }
  else if(_myLat) launch(_myLat,_myLng,'현위치');
  else {
    const cached=_readRecentStoredLocation(OAI_LOCATION_CACHE_MAX_MS);
    if(cached){ launch(cached.lat,cached.lng,'현위치'); _refreshFreshLocationThen(function(){},function(){}); }
    else if(_GEO){ _refreshFreshLocationThen((lat,lng)=>launch(lat,lng,'현위치'),()=>launch(null,null)); }
    else launch(null,null);
  }
}

function _mkrImgRetreat(color,big){
  const key='retreat:'+String(color||'')+':' + (big?'1':'0');
  return _oaiMarkerImageCached(key, function(){
    const w=big?40:28,h=big?52:36;
    const svg=big?
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C8.954 0 0 8.954 0 20c0 14.21 20 32 20 32S40 34.21 40 20C40 8.954 31.046 0 20 0z" fill="${color}"/><circle cx="20" cy="20" r="9" fill="white" opacity="0.95"/><text x="20" y="25" text-anchor="middle" font-size="14" fill="${color}" font-family="serif" font-weight="bold">✦</text></svg>`:
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.941 14 22 14 22S28 23.941 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.9"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/><text x="14" y="18" text-anchor="middle" font-size="10" fill="${color}" font-family="serif" font-weight="bold">✦</text></svg>`;
    return new _MI(_svgUrl(svg),new _SZ(w,h),{offset:new _PT(w/2,h)});
  });
}

function _mkrImg(color,big){
  const key='shrine:'+String(color||'')+':' + (big?'1':'0');
  return _oaiMarkerImageCached(key, function(){
    const w=big?40:28,h=big?52:36;
    const crossBig = `<g fill="#fff" opacity="0.96"><rect x="18.45" y="10.5" width="3.1" height="18.5" rx="1.1"/><rect x="13.4" y="16.3" width="13.2" height="3.1" rx="1.1"/></g>`;
    const crossSmall = `<g fill="#fff" opacity="0.96"><rect x="12.85" y="7.8" width="2.3" height="12.8" rx="0.8"/><rect x="9.6" y="11.7" width="8.8" height="2.3" rx="0.8"/></g>`;
    const svg=big?
    `<svg ${_NS} width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C8.954 0 0 8.954 0 20c0 14.21 20 32 20 32S40 34.21 40 20C40 8.954 31.046 0 20 0z" fill="${color}"/>${crossBig}</svg>`:
    `<svg ${_NS} width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.941 14 22 14 22S28 23.941 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.92"/>${crossSmall}</svg>`;
    return new _MI(_svgUrl(svg),new _SZ(w,h),{offset:new _PT(w/2,h)});
  });
}


function _mkrImgRoute(color,label){
  const c=label==='출' ? '#FF0000' : (label==='도' ? '#005BFF' : (color||'#005BFF'));
  const key='route:'+String(c)+':' + String(label||'');
  return _oaiMarkerImageCached(key, function(){
    const fs=String(label||'').length>1 ? 10.5 : 13;
    const svg=`<svg ${_NS} width='36' height='46' viewBox='0 0 36 46'><ellipse cx='18' cy='43' rx='8' ry='3' fill='rgba(0,0,0,0.25)'/><path d='M18 2C9 2 2 9 2 18C2 28 18 42 18 42C18 42 34 28 34 18C34 9 27 2 18 2Z' fill='${c}' stroke='white' stroke-width='2.5'/><circle cx='18' cy='18' r='10' fill='white' opacity='0.9'/><text x='18' y='22.5' font-size='${fs}' font-weight='900' fill='${c}' text-anchor='middle' font-family='Arial,sans-serif'>${label}</text></svg>`;
    return new _MI(_svgUrl(svg),new _SZ(36,46),{offset:new _PT(18,44)});
  });
}


function _routeMarkerZ(role){
  if(role==='start') return 340;
  if(role==='end') return 330;
  const idx=_routeWaypointIndex(role);
  return idx ? 337-idx : 330;
}
function _setRouteMarkerZ(idx, role){
  try{
    const z=_routeMarkerZ(role);
    if(idx>=0 && _markers && _markers[idx] && _markers[idx].marker){
      _markers[idx].marker.setZIndex(z);
    }
    if(idx>=0 && _retreatMarkers){
      const r=_retreatMarkers.find(o=>o && o.index===idx);
      if(r && r.marker) r.marker.setZIndex(z);
    }
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}

function _clearRouteTmpMarkers(){
  if(_startTmpMkr){ _startTmpMkr.setMap(null); _startTmpMkr=null; }
  if(_endTmpMkr){ _endTmpMkr.setMap(null); _endTmpMkr=null; }
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const marker=window[cfg.tmpMarkerKey];
    if(marker){ marker.setMap(null); window[cfg.tmpMarkerKey]=null; }
  });
}
function _routeEndMarkerColor(){
  if(_mode==='shrine' && _rE && _rE.idx>=0 && _markers[_rE.idx] && _markers[_rE.idx].shrine){
    return _typeColor(_markers[_rE.idx].shrine.type);
  }
  return '#0000ff';
}
function _shouldShowRouteStartMarker(){
  if(!(_activeTab === 'route' && _routeMode && _rS && _rS.lat && _rS.lng)) return false;
  if(_rS.isImplicitCurrentLocation && !_routeStartMarkerExplicitCurrent && _rS.showStartMarker !== true) return false;
  return true;
}
function _refreshRouteTmpMarkers(){
  if(!_map) return;
  _clearRouteTmpMarkers();
  _refreshExistingRoutePointMarkerImages();
  const routeResultShowing = !!_polyline;
  const needStart = !!(_rS && !_rS.isRegionStart && (routeResultShowing || _shouldShowRouteStartMarker()));
  const needEnd = !!(_rE && (_mode!=='shrine' || _rE.idx<0 || !_markers[_rE.idx]));
  if(needStart){
    _startTmpMkr = new _MM({
      position:new _LL(_rS.lat,_rS.lng),
      image:_mkrImgRoute('#ff0000','출'),
      zIndex:340
    });
    kakao.maps.event.addListener(_startTmpMkr,'click',function(){ _openRoutePointCancelChoice('start'); });
    _startTmpMkr.setMap(_map);
  }
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const point=_getRoutePointByRole(cfg.role);
    const needMarker=!!(point && (_mode!=='shrine' || point.idx<0 || !_markers[point.idx] || routeResultShowing));
    if(!needMarker) return;
    const marker=new _MM({
      position:new _LL(point.lat,point.lng),
      image:_mkrImgRoute(_routeWaypointColor(cfg.role),_routeWaypointMarkerText(cfg.role)),
      zIndex:_routeMarkerZ(cfg.role)
    });
    kakao.maps.event.addListener(marker,'click',function(){ _openRoutePointCancelChoice(cfg.role); });
    marker.setMap(_map);
    window[cfg.tmpMarkerKey]=marker;
  });
  if(needEnd){
    _endTmpMkr = new _MM({
      position:new _LL(_rE.lat,_rE.lng),
      image:_mkrImgRoute(_routeEndMarkerColor(),'도'),
      zIndex:320
    });
    kakao.maps.event.addListener(_endTmpMkr,'click',function(){ _openRoutePointCancelChoice('end'); });
    _endTmpMkr.setMap(_map);
  }
}

function _typeColor(t){return t==='성지'?'#c0392b':t==='순례지'?'#1565c0':'#1b7a3e';}

function _buildShrineMarkers(){
  _markers=new Array(SHRINES.length).fill(null);
  const buildToken=_currentMainMapBuildToken();
  const BATCH=42;
  let idx=0;
  function next(){
  if(!_isMainMapBuildCurrent(buildToken,'shrine')) return;
  const end=Math.min(idx+BATCH,SHRINES.length);
  for(let i=idx;i<end;i++){
   const s=SHRINES[i];
   if(!_isSouthKoreaCoordinate(s.lat,s.lng)) continue;
   const mk=new _MM({
    position:new _LL(s.lat,s.lng),
    image:_mkrImg(_shrineMarkerColor(s),false),title:s.name
   });
   const showNow=!_shouldDeferFullCategoryMarkers();
   if(showNow) mk.setMap(_map);
   mk.__oaiMapTarget=showNow?_map:null;
   mk.__oaiImgKey='shrine:'+_shrineMarkerColor(s)+':0';
   mk.__oaiZIndex=1;
   (function(index){
    kakao.maps.event.addListener(mk,'click',()=>{
     if(_isRouteSelectionModeActive()) _selectRouteItem(index);
     else selectItem(index,{fromRegion:_isRegionSearchActiveForItem(SHRINES[index])});
    });
   })(i);
   _markers[i]={marker:mk,shrine:s,index:i};
  }
  idx=end;
  if(_pendingShrineMapTargetIdx>=0&&_markers[_pendingShrineMapTargetIdx]){
    _applyShrineVisitMapTarget(_pendingShrineMapTargetIdx,_pendingShrineMapTargetToken);
  }
  if(idx<SHRINES.length) requestAnimationFrame(next);
  }
  requestAnimationFrame(next);
}

function _clearShrineMarkers(){
  _markers.forEach(m=>{if(m&&m.marker)_setMarkerMapIfChanged(m.marker,null);});
}

function _restoreMapMarkers(opts){
  opts = opts || {};
  if(_mode==='parish'){
    if(opts.parishRouteReselect===true){
      const code=(AppState && AppState.nearbyParishDioCode) ||
        ((_myLat && _myLng) ? _nearbyParishDioCodeForLocation(_myLat,_myLng,{ignoreSelection:true}) : null) ||
        _activeDio || null;
      if(code){
        // 다시선택은 길찾기 전의 '현재 위치 해당 교구' 지도 상태로 돌아간다.
        // 내주변 일부 마커 객체를 재부착하지 않고, 해당 교구 전체 성당 레이어를 복원한다.
        try{ _clearParishNearbyMarkers(); }catch(e){ console.warn('[가톨릭길동무]',e); }
        try{ _setParishMapLayerMode('dio','route-reselect'); }catch(e){ console.warn('[가톨릭길동무]',e); }
        _activeDio=code;
        const showCurrentDioceseMarkers=function(){
          try{
            if(_mode!=='parish' || !_map || _activeDio!==code || (AppState && AppState.parishMapLayerMode!=='dio')) return;
            // 교구 데이터가 이미 준비된 반복 다시선택에서는 PARISHES를 다시 만들지 않는다.
            // 배열을 재생성하면 기존 마커 클릭 리스너가 보관한 객체 참조가 끊어질 수 있다.
            _showParishDioMkrs(code);
            _syncParishDioLabels();
            _raiseMyLocationMarker();
          }catch(e){ console.warn('[가톨릭길동무]',e); }
        };
        if(_isParishDioceseReady(code)){
          showCurrentDioceseMarkers();
        }else{
          _ensureParishDioceseDataLoaded(code).then(function(){
            showCurrentDioceseMarkers();
          }).catch(function(e){
            console.warn('[가톨릭길동무] 다시선택 교구 성당 데이터 로드 실패',e);
            try{ _syncParishDioLabels(); _raiseMyLocationMarker(); }catch(_e){}
          });
        }
        return;
      }
    }
    if(_isParishNearbyMapMode()){
      try{ _clearParishDioLayerForNearby(); }catch(e){ console.warn('[가톨릭길동무]',e); }
      try{
        if(!_ensureParishNearbyMarkersVisible(_nearbyCache,_myLat,_myLng,'route-reset')){
          _setParishNearbyMarkersMap(_map,true);
          _syncParishDioLabels();
          _raiseMyLocationMarker();
        }
      }catch(e){ console.warn('[가톨릭길동무]',e); }
      return;
    }
    try{ _clearParishNearbyResults('restore-parish'); }catch(e){ console.warn('[가톨릭길동무]',e); }
    try{ _bumpParishDioLayerToken('restore-parish'); _hideAllParishDioMkrs(); }catch(e){ console.warn('[가톨릭길동무]',e); }
    const keepCode = _activeDio || null;
    if(keepCode){
      _showParishDioMkrs(keepCode);
      _syncParishDioLabels();
      return;
    }
    _syncParishDioLabels();
    return;
  }
  if(_mode==='retreat'){
    _restoreRetreatMarkers();
    return;
  }
  _markers.forEach(m=>{
  if(!m) return;
  const s=m.shrine;
  const ok=(_filterDio==='all'||s.diocese===_filterDio)&&
      (!_listSrch||_itemSearchBlob(s).includes(_listSrch)||_itemSearchNorm(s).includes(String(_listSrch).replace(/\s+/g,'')))&&
      _isShrineVisibleByVisitFilter(s);
  if(ok){
    const c=_shrineMarkerColor(s);
    _setMarkerImageIfChanged(m.marker,_mkrImg(c,false),'shrine:'+c+':0');
    _setMarkerZIfChanged(m.marker,1);
  }
  _setMarkerMapIfChanged(m.marker, ok?_map:null);
  });
}

function _restoreAllCategoryMarkersForSelection(){
  if(!_map) return;
  if(_mode==='shrine'){
    _markers.forEach(m=>{
      if(!m||!m.marker) return;
      try{
        const c=_shrineMarkerColor(m.shrine);
        const s=m.shrine || {};
        const valid=_isSouthKoreaCoordinate(s.lat,s.lng);
        const visible=!!(valid && _isShrineVisibleByVisitFilter(s));
        _forceMarkerMap(m.marker,visible?_map:null);
        _setMarkerImageIfChanged(m.marker,_mkrImg(c,false),'shrine:'+c+':0');
        _setMarkerZIfChanged(m.marker,1);
      }catch(e){ console.warn("[가톨릭길동무]", e); }
    });
    _selIdx=-1;
    return;
  }
  if(_mode==='retreat'){
    if(!_retreatMarkers.length) _buildRetreatMarkers();
    _retreatMarkers.forEach(o=>{
      if(!o||!o.marker) return;
      try{
        _setMarkerMapIfChanged(o.marker,_map);
        _setMarkerImageIfChanged(o.marker,_mkrImgRetreat('#2e7d32',false),'retreat:#2e7d32:0');
        _setMarkerZIfChanged(o.marker,45);
      }catch(e){ console.warn("[가톨릭길동무]", e); }
    });
    if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); } _paSelMkr=null;}
  }
}


function _restoreAllShrineMarkersAfterVisitRegistration(item, idx){
  try{
    if(_mode!=='shrine') return;
    _shrineVisitMapFilter='all';
    _filterDio='all';
    _listSrch='';
    _updateShrineVisitMapFilterUI();
    if(!_markers || _markers.length !== SHRINES.length){ try{ _buildShrineMarkers(); }catch(_e){} }
    _restoreAllCategoryMarkersForSelection();
    if(typeof idx==='number' && idx>=0 && _markers[idx]) _selectShrineMarker(idx);
    else if(item && Array.isArray(SHRINES)){
      var found=SHRINES.indexOf(item);
      if(found>=0 && _markers[found]) _selectShrineMarker(found);
    }
    setTimeout(function(){
      try{
        if(_mode!=='shrine') return;
        _restoreAllCategoryMarkersForSelection();
        var again=(typeof idx==='number' && idx>=0) ? idx : (item && Array.isArray(SHRINES) ? SHRINES.indexOf(item) : -1);
        if(again>=0 && _markers[again]) _selectShrineMarker(again);
      }catch(_e){}
    }, 220);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _selectShrineMarker(idx){
  if(_selIdx>=0&&_markers[_selIdx]){
  { const c=_shrineMarkerColor(_markers[_selIdx].shrine); _setMarkerImageIfChanged(_markers[_selIdx].marker,_mkrImg(c,false),'shrine:'+c+':0'); }
  _setMarkerZIfChanged(_markers[_selIdx].marker,1);
  }
  if(idx>=0&&_markers[idx]){
  _setMarkerImageIfChanged(_markers[idx].marker,_mkrImg('#FFE500',true),'shrine:#FFE500:1');
  _setMarkerZIfChanged(_markers[idx].marker,10);
  }
  _selIdx=idx;
}

function _clearShrineMarkerSel(){
  if(_selIdx>=0&&_markers[_selIdx]){
  { const c=_shrineMarkerColor(_markers[_selIdx].shrine); _setMarkerImageIfChanged(_markers[_selIdx].marker,_mkrImg(c,false),'shrine:'+c+':0'); }
  _setMarkerZIfChanged(_markers[_selIdx].marker,1);
  }
  _selIdx=-1;
}

function _setParishNearbyMarkersMap(mapTarget, includeSelection){
  const target=mapTarget || null;
  let count=0;
  try{
    const arr=(AppState && Array.isArray(AppState.nearbyParishMarkers)) ? AppState.nearbyParishMarkers : [];
    arr.forEach(function(mk){
      if(!mk) return;
      try{ _setMarkerMapIfChanged(mk,target); count++; }catch(e){ console.warn('[가톨릭길동무]',e); }
    });
  }catch(e){ console.warn('[가톨릭길동무]',e); }
  if(includeSelection!==false){
    try{ if(_paSelMkr) _setMarkerMapIfChanged(_paSelMkr,target); }catch(e){ console.warn('[가톨릭길동무]',e); }
  }
  return count;
}

function _clearParishNearbyMarkers(){
  try{ _setParishNearbyMarkersMap(null,true); }catch(e){ console.warn('[가톨릭길동무]',e); }
  try{ if(AppState) AppState.nearbyParishMarkers=[]; }catch(e){ console.warn('[가톨릭길동무]',e); }
  _paSelMkr=null;
}

function _fitParishNearbyBounds(items, lat, lng){
  // V8-1-14-621: 내주변 목록은 전체 표시하되 지도는 전체 결과 bounds로 맞추지 않는다.
  // 전국/교구 전체 범위로 줌아웃되는 것을 막고, 기존 내 위치 기준 첫 화면 줌을 유지한다.
  if(_mode!=='parish' || !_map) return false;
  return _focusNearbyInitialMap(lat,lng,'parish-nearby-map');
}


function _showParishNearbyMarkersOnMap(items, lat, lng, phase){
  if(_mode!=='parish' || !_map || !Array.isArray(items) || !items.length || typeof _LL==='undefined') return;
  try{
    _setParishMapLayerMode('nearby','nearby-results');
    _clearParishNearbyMarkers();
    try{ _clearParishDioLayerForNearby(); }catch(e){ console.warn('[가톨릭길동무]',e); }
    _activeDio=null;

    const mapItems=_nearbyMapItemsForMode(items,'parish');
    const anchorParish=items.find(function(p){ return p && p.lat && p.lng && p.lat!==0 && p.lng!==0; }) || null;
    if(anchorParish && mapItems.indexOf(anchorParish)<0) mapItems.unshift(anchorParish);
    const arr=[];
    mapItems.forEach(function(p){
      const mk=new _MM({
        position:new _LL(p.lat,p.lng),
        image:_mkrImg(OAI_CATHEDRAL_CATEGORY_COLOR,false),
        title:p.name,
        zIndex:70
      });
      kakao.maps.event.addListener(mk,'click',function(){
        const idx=_findCurrentParishIndex(p);
        if(idx<0) return;
        if(_isRouteSelectionModeActive()) _selectRouteItem(idx);
        else selectItem(idx,{fromNearby:true});
      });
      mk.setMap(_map);
      arr.push(mk);
    });
    // V8-1-14-679: 첫 진입에서는 가장 가까운 성당을 자동 선택하지 않는다.
    // 노란 선택 마커(_paSelMkr)는 사용자가 성당 마커나 목록을 직접 선택할 때만 만든다.
    if(AppState){
      AppState.nearbyParishMarkers=arr;
      AppState.nearbyParishDioCode=_parishDioCodeOf(anchorParish) || AppState.nearbyParishDioCode || null;
      AppState.parishMapLayerMode='nearby';
      AppState.nearbyParishAnchorItem=anchorParish || null;
    }
    _syncParishDioLabels();
    _fitParishNearbyBounds(mapItems, lat, lng);
    _raiseMyLocationMarker();
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}


function _ensureParishNearbyMarkersVisible(items, lat, lng, reason){
  if(_mode!=='parish' || !_map || !Array.isArray(items) || !items.length) return false;
  const first=items.find(function(p){ return p && p.lat && p.lng && p.lat!==0 && p.lng!==0; }) || null;
  if(!first) return false;
  const code=_parishDioCodeOf(first);
  const arr=(AppState && Array.isArray(AppState.nearbyParishMarkers)) ? AppState.nearbyParishMarkers : [];
  const sameLayer=!!(arr.length && AppState && AppState.nearbyParishDioCode===code);
  if(!sameLayer){
    _showParishNearbyMarkersOnMap(items,lat,lng,reason||'nearby');
    return true;
  }
  // 이미 만든 동일 교구 마커는 다시 생성하지 않고 공통 가시성 소유 함수에서 지도에 복원한다.
  _setParishNearbyMarkersMap(_map,true);
  _setParishMapLayerMode('nearby','ensure-visible:'+String(reason||''));
  try{ _syncParishDioLabels(); }catch(_e){}
  _raiseMyLocationMarker();
  return true;
}

function _showRetreatNearbyMarkersOnMap(items, lat, lng){
  if(_mode!=='retreat' || !_map || !Array.isArray(items) || !items.length || typeof _LL==='undefined') return;
  try{
    /* V8-1-14-679:
       피정의집 내주변 지도는 가까운 목록 항목으로 별도 마커를 만들지 않는다.
       _buildRetreatMarkers가 소유하는 전국 전체 마커 레이어만 표시해 중복 객체와 클릭 리스너 분산을 막는다. */
    if(!_retreatMarkers.length && window.__OAI_RETREAT_MARKER_BUILDING__ !== true) _buildRetreatMarkers();
    (_retreatMarkers||[]).forEach(function(o){
      if(!o || !o.marker) return;
      _setMarkerImageIfChanged(o.marker,_mkrImgRetreat('#2e7d32',false),'retreat:#2e7d32:0');
      _setMarkerZIfChanged(o.marker,45);
      _setMarkerMapIfChanged(o.marker,_map);
    });
    _focusNearbyInitialMap(lat,lng,'retreat-nearby-map');
    _raiseMyLocationMarker();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}


function _showItemsOnMap(items){
  _markers.forEach(m=>{if(m)_setMarkerMapIfChanged(m.marker,null);});
  const bounds=new _LB();
  let shownCount=0;
  const shown=(Array.isArray(items)?items:[]).filter(function(s){ return _isShrineVisibleByVisitFilter(s); });
  shown.forEach(s=>{
  const i=SHRINES.indexOf(s);
  if(i>=0&&_markers[i]){
   const c=_shrineMarkerColor(s);
   _setMarkerImageIfChanged(_markers[i].marker,_mkrImg(c,false),'shrine:'+c+':0');
   _setMarkerZIfChanged(_markers[i].marker,1);
   _setMarkerMapIfChanged(_markers[i].marker,_map);
   if(s.lat&&s.lng){ bounds.extend(new _LL(s.lat,s.lng)); shownCount++; }
  }
  });
  if(shownCount>0){
    if(typeof _setBoundsByInfoCardStandard==='function'){
      _setBoundsByInfoCardStandard(bounds,60,60,60,60);
    }else{
      try{_map.setBounds(bounds,60,60,60,60);}catch(e){ console.warn("[가톨릭길동무]", e); }
    }
  }
  _raiseMyLocationMarker();
}

function _showAllShrinesOnMapWithNearbyBounds(items, lat, lng){
  if(_mode!=='shrine' || !_map) return;
  try{
    _clearShrineMarkerSel();
    /* V8-1-14-679:
       성지 내주변 목록은 10개지만 지도는 SHRINES 전체 데이터가 소유한다.
       목록 캐시를 지도 마커 범위로 사용하지 않고, 현재 순례 필터에 맞는 전국 성지 마커를 모두 복원한다. */
    _markers.forEach(function(m){
      if(!m || !m.marker) return;
      const s=m.shrine || {};
      const valid=_isSouthKoreaCoordinate(s.lat,s.lng);
      const visible=!!(valid && _isShrineVisibleByVisitFilter(s));
      if(visible){
        const c=_shrineMarkerColor(s);
        _setMarkerImageIfChanged(m.marker,_mkrImg(c,false),'shrine:'+c+':0');
        _setMarkerZIfChanged(m.marker,1);
      }
      _setMarkerMapIfChanged(m.marker,visible?_map:null);
    });
    _focusNearbyInitialMap(lat,lng,'shrine-nearby-map');
    _raiseMyLocationMarker();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}


function _selectParishMarker(p){
  if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }  _paSelMkr=null;}
  if(!_map||!p.lat||!p.lng) return null;
  const dioCode=_parishDioCodeOf(p);
  if(_isParishNearbyMapMode()){
    try{ _clearParishDioLayerForNearby(); }catch(e){ console.warn('[가톨릭길동무]',e); }
  }else if(dioCode && _parishSysInited){
    try{ _hideAllParishDioMkrs(); }catch(e){ console.warn('[가톨릭길동무]',e); }
    _activeDio=dioCode;
    _showParishDioMkrs(dioCode);
    _syncParishDioLabels();
  }else if(dioCode){
    _ensureParishMarkerZoom();
  }
  _paSelMkr=new _MM({position:new _LL(p.lat,p.lng),image:_mkrImg('#FFE500',true),zIndex:200});
  _paSelMkr.setMap(_map);
  _raiseMyLocationMarker();
  return dioCode;
}

const _DIO_CFG={
  'SE':{n:'서울대교구',lat:37.565,lng:126.988,c:'#C0392B'},
  'IC':{n:'인천교구',  lat:37.478,lng:126.626,c:'#2471A3'},
  'SW':{n:'수원교구',  lat:37.180,lng:127.018,c:'#7D3C98'},
  'UJ':{n:'의정부교구',lat:37.740,lng:127.058,c:'#CA6F1E'},
  'CC':{n:'춘천교구',  lat:37.875,lng:127.720,c:'#117A65'},
  'WJ':{n:'원주교구',  lat:37.340,lng:127.960,c:'#1E8449'},
  'DJ':{n:'대전교구',  lat:36.352,lng:127.378,c:'#B03A2E'},
  'CJ':{n:'청주교구',  lat:36.630,lng:127.490,c:'#4A235A'},
  'DG':{n:'대구대교구',lat:35.870,lng:128.585,c:'#1A5276'},
  'AD':{n:'안동교구',  lat:36.570,lng:128.725,c:'#9A7D0A'},
  'BS':{n:'부산교구',  lat:35.155,lng:129.065,c:'#6E2F1A'},
  'MS':{n:'마산교구',  lat:35.225,lng:128.580,c:'#6C3483'},
  'GJ':{n:'광주대교구',lat:35.158,lng:126.895,c:'#1A5276'},
  'JJ':{n:'전주교구',  lat:35.820,lng:127.145,c:'#1D6A39'},
  'JE':{n:'제주교구',  lat:33.490,lng:126.530,c:'#B7950B'},
  'ML':{n:'군종교구',  lat:37.530,lng:126.972,c:'#5D6D7E'},

};

const _PARISH_DIO_CODE_MAP={'서울대교구':'SE','인천교구':'IC','수원교구':'SW','의정부교구':'UJ',
  '춘천교구':'CC','원주교구':'WJ','대전교구':'DJ','청주교구':'CJ','대구대교구':'DG',
  '안동교구':'AD','부산교구':'BS','마산교구':'MS','광주대교구':'GJ','전주교구':'JJ',
  '제주교구':'JE','군종교구':'ML'};
function _parishDioCodeOf(p){
  return p && p.diocese ? (_PARISH_DIO_CODE_MAP[p.diocese] || null) : null;
}

function _parishStableKey(p){
  if(!p) return '';
  const lat=Number(p.lat), lng=Number(p.lng);
  return [
    String(p.diocese||''),
    String(p.name||''),
    Number.isFinite(lat)?lat.toFixed(7):'',
    Number.isFinite(lng)?lng.toFixed(7):'',
    String(p.addr||'')
  ].join('|');
}

function _findCurrentParishIndex(p){
  if(!p || !Array.isArray(PARISHES) || !PARISHES.length) return -1;
  const direct=PARISHES.indexOf(p);
  if(direct>=0) return direct;
  const key=_parishStableKey(p);
  if(key){
    const exact=PARISHES.findIndex(function(cur){ return _parishStableKey(cur)===key; });
    if(exact>=0) return exact;
  }
  const lat=Number(p.lat), lng=Number(p.lng);
  return PARISHES.findIndex(function(cur){
    if(!cur) return false;
    if(String(cur.diocese||'')!==String(p.diocese||'')) return false;
    if(String(cur.name||'')!==String(p.name||'')) return false;
    if(Number.isFinite(lat) && Number.isFinite(lng)){
      return Number(cur.lat)===lat && Number(cur.lng)===lng;
    }
    return String(cur.addr||'')===String(p.addr||'');
  });
}

function _isParishDioBoundsOutlier(p, code){
  if(!p) return false;
  const name=String(p.name||'');
  const addr=String(p.addr||'');
  if(code==='IC' && (addr.indexOf('인천 옹진군')>=0 || name.indexOf('백령')>=0 || addr.indexOf('백령')>=0 || name.indexOf('대청')>=0 || addr.indexOf('대청')>=0 || name.indexOf('연평')>=0 || addr.indexOf('연평')>=0 || name.indexOf('덕적')>=0 || addr.indexOf('덕적')>=0)) return true;
  if(code==='DG' && (addr.indexOf('울릉')>=0 || name.indexOf('울릉')>=0)) return true;
  return false;
}

let _PA_BY_DIO={};
let _pendingParishDioCode=null;
function _rebuildParishDioIndex(){
  const m={};
  PARISHES.forEach(p=>{
    const code=_parishDioCodeOf(p)||'ETC';
    (m[code]||(m[code]=[])).push(p);
  });
  _PA_BY_DIO=m;
  return _PA_BY_DIO;
}
_parishDioIndexReady=true;
_rebuildParishDioIndex();

function _dioLabelSize(lvl){
  if(lvl<=4) return 18; if(lvl===5) return 16;
  if(lvl===6) return 15; if(lvl===7) return 14;
  if(lvl===8) return 13; return 12;
}

function _markParishDioProgrammaticMove(ms){
  try{
    _parishDioProgrammaticMoveUntil=(Date.now?Date.now():new Date().getTime())+(ms||1400);
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}

function _parishDioCenter(code){
  if(!_map||typeof _LL==='undefined') return null;
  const parishes=_PA_BY_DIO[code]||[];
  let minLat=Infinity,maxLat=-Infinity,minLng=Infinity,maxLng=-Infinity,count=0;
  parishes.forEach(function(p){
    if(!p||!p.lat||!p.lng||p.lat===0||p.lng===0) return;
    if(_isParishDioBoundsOutlier(p, code)) return;
    minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
    minLng=Math.min(minLng,p.lng); maxLng=Math.max(maxLng,p.lng);
    count++;
  });
  if(count>0) return new _LL((minLat+maxLat)/2,(minLng+maxLng)/2);
  const cfg=_DIO_CFG[code];
  return cfg ? new _LL(cfg.lat,cfg.lng) : null;
}

function _centerParishDioWithoutZoom(code){
  if(_mode!=='parish'||!_map) return false;
  const center=_parishDioCenter(code);
  if(!center) return false;
  try{
    // 사용자가 확대·축소한 상태에서는 애니메이션 이동 없이 중심만 한 번 바꾼다.
    _markParishDioProgrammaticMove(900);
    _map.setCenter(center);
    return true;
  }catch(e){ console.warn('[가톨릭길동무]',e); }
  return false;
}

function _focusParishPointAround(lat, lng, opts){
  opts=opts||{};
  if(_mode!=='parish'||!_map||!lat||!lng||typeof _LL==='undefined') return false;
  const targetLevel = opts.level || 6;
  const pos = new _LL(lat,lng);
  try{
    if(typeof _map.getLevel==='function' && typeof _map.setLevel==='function'){
      const lvl = _map.getLevel();
      if(lvl > targetLevel){
        _markParishDioProgrammaticMove(1300);
        _map.setLevel(targetLevel);
      }
    }
    // V8-1-14-621: 성당의 현재 위치 기준 화면은 성지/피정과 동일하게
    // 실제 내 위치 좌표를 중심으로 둔다. 정보카드 보정은 실제 정보카드 포커스에서만 사용한다.
    if(opts && opts.infoCardStandard===true && typeof _setMapCenterByInfoCardStandard==='function'){
      return _setMapCenterByInfoCardStandard(pos);
    }
    _map.setCenter(pos);
    return true;
  }catch(e){ console.warn('[가톨릭길동무]',e); }
  return false;
}

function _buildParishDioSystem(){
  if(_parishSysInited) return;
  _parishSysInited=true;
  const lvl=_map.getLevel();
  Object.entries(_DIO_CFG).forEach(([code,cfg])=>{
    if(code==='ML') return;
    const el=document.createElement('div');
    el.className='dio-label';
    el.dataset.code=code;
    const fs=_dioLabelSize(lvl);
    el.style.cssText=`cursor:pointer;background:rgba(255,255,255,0.92);color:${cfg.c};`+
      `font-size:${fs}px;font-weight:800;padding:4px 9px;border-radius:20px;`+
      `border:2px solid ${cfg.c};white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);`+
      `letter-spacing:-.3px;transition:none;user-select:none;touch-action:manipulation;`+
      `-webkit-tap-highlight-color:transparent;backface-visibility:hidden;`;
    el.textContent=cfg.n;
    ['pointerdown','mousedown','touchstart'].forEach(function(type){
      el.addEventListener(type,function(e){ e.stopPropagation(); },{passive:true});
    });
    el.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      _toggleParishDio(code);
    });
    const ov=new kakao.maps.CustomOverlay({
      position:new _LL(cfg.lat,cfg.lng),
      content:el,
      xAnchor:0.5,yAnchor:0.5,
      zIndex:100
    });
    _dioOverlays[code]=ov;
    // 생성 단계에서는 지도에 붙이지 않는다. 실제 표시 대상은 _syncParishDioLabels 한 곳에서 결정한다.
    try{ _setParishDioOverlayMap(ov,false); if(typeof ov.setZIndex==='function') ov.setZIndex(10000); }catch(e){ console.warn('[가톨릭길동무]',e); }
  });
  kakao.maps.event.addListener(_map,'zoom_changed',function(){
    const lvl2=_map.getLevel();
    const fs2=_dioLabelSize(lvl2);
    document.querySelectorAll('.dio-label').forEach(el2=>{
      el2.style.fontSize=fs2+'px';
    });
    try{
      const now=Date.now?Date.now():new Date().getTime();
      if(_mode==='parish' && now>_parishDioProgrammaticMoveUntil){
        _parishDioUserZoomTouched=true;
      }
    }catch(e){ console.warn('[가톨릭길동무]',e); }
  });
}

function _isParishRouteLineActive(){
  return _mode==='parish' && !!_polyline;
}
function _setParishDioOverlayMap(ov, visible){
  if(!ov) return;
  const next=!!visible;
  if(ov.__oaiMapVisible===next) return;
  try{
    ov.setMap(next?_map:null);
    ov.__oaiMapVisible=next;
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}
function _hideDioOverlays(){
  Object.values(_dioOverlays).forEach(function(ov){ _setParishDioOverlayMap(ov,false); });
}

function _syncParishDioLabels(){
  if(_mode!=='parish' || !_map) return;
  if(_isParishRouteLineActive()){
    _hideDioOverlays();
    return;
  }
  if(!_parishSysInited){ try{ _buildParishDioSystem(); }catch(e){ console.warn('[가톨릭길동무]',e); } }
  const nearbyMode=_isParishNearbyMapMode();
  const nearbyCode=nearbyMode ? ((AppState && AppState.nearbyParishDioCode) || _activeDio || null) : null;
  Object.entries(_dioOverlays||{}).forEach(function(pair){
    const code=pair[0], ov=pair[1];
    // 내주변 지도: 현재 교구는 성당 마커로 표시하므로 교구명은 숨기고, 다른 교구명은 모두 유지한다.
    // 일반 교구 지도: 선택된 교구명만 숨기고 나머지 교구명은 유지한다.
    const visible=nearbyMode ? (!nearbyCode || code!==nearbyCode) : (code!==_activeDio);
    try{ _setParishDioOverlayMap(ov,visible); if(visible && typeof ov.setZIndex==='function') ov.setZIndex(10000); }catch(e){ console.warn('[가톨릭길동무]',e); }
    const el = ov && typeof ov.getContent==='function' ? ov.getContent() : null;
    if(el && el.style){
      el.style.display = visible ? '' : 'none';
      el.style.visibility = visible ? 'visible' : 'hidden';
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
      el.style.zIndex = '10000';
      el.style.transform = '';
    }
  });
}

function _activateParishDio(code){
  // 내주변 지도에 표시된 교구명을 누르면 주변 레이어를 종료한 뒤 해당 교구 지도로 전환한다.
  // Fold 큰 화면에서는 왼쪽 내주변 패널이 계속 열린 상태가 지도 레이어를 nearby로 되돌리지 않게 한다.
  const wasNearby=_isParishNearbyMapMode();
  if(wasNearby){
    try{ _clearParishNearbyResults('dio-label:'+code); }catch(_e){}
    _activeDio=null;
    try{ _setParishMapLayerMode('dio','dio-label:'+code); }catch(_e){}
    if(_isMapSplitWideLayout() && _activeTab==='nearby'){
      try{ _closeSheetOnly('nearby'); }catch(_e){}
      _activeTab=null;
      try{ _updateTabBtns(null); }catch(_e){}
      try{ _syncMapPanelUI('parish-dio-label'); }catch(_e){}
    }
  }
  if(_activeDio===code){
    _hideParishDioMkrs(code);
    _activeDio=null;
    try{ _setParishMapLayerMode('','dio-label-off:'+code); }catch(_e){}
    _syncParishDioLabels();
    return;
  }
  if(_activeDio) _hideParishDioMkrs(_activeDio);
  try{ _bumpParishDioLayerToken('toggle-parish-dio:'+code); _hideAllParishDioMkrs(); }catch(e){ console.warn('[가톨릭길동무]',e); }
  _activeDio=code;
  try{ _setParishMapLayerMode('dio','dio-label:'+code); }catch(_e){}
  // 카메라 이동을 먼저 한 번만 확정한 뒤 마커와 교구명을 동기화한다.
  // 마커 생성 직후 다시 확대 수준을 바꾸던 이전 흐름은 화면 흔들림의 원인이었다.
  _focusParishDio(code,{fromLabel:true});
  _showParishDioMkrs(code);
  _syncParishDioLabels();
  /* Fold split 레이아웃은 nearby 패널이 닫히며 지도 폭이 즉시 넓어진다.
     Kakao 지도 relayout 뒤 선택 교구 마커를 한 번 더 붙여 패널 전환 타이밍과 무관하게 보이게 한다. */
  if(wasNearby && _isMapSplitWideLayout()){
    requestAnimationFrame(function(){
      try{
        if(_mode!=='parish'||!_map||_activeDio!==code) return;
        if(typeof _map.relayout==='function') _map.relayout();
        _showParishDioMkrs(code);
        _syncParishDioLabels();
      }catch(e){ console.warn('[가톨릭길동무]',e); }
    });
  }
}
function _toggleParishDio(code){
  if(_mode!=='parish' || !code) return;
  if(!_isParishDioceseReady(code)){
    // 같은 교구를 연속 탭해도 로드 완료 뒤 토글이 여러 번 실행되지 않게 한다.
    if(_pendingParishDioCode===code) return;
    _pendingParishDioCode=code;
    _ensureParishDioceseDataLoaded(code).then(function(){
      if(_pendingParishDioCode!==code || _mode!=='parish') return;
      _pendingParishDioCode=null;
      _activateParishDio(code);
    }).catch(function(err){
      if(_pendingParishDioCode===code) _pendingParishDioCode=null;
      console.warn('[가톨릭길동무] 성당 교구 데이터 로드 실패', err);
      try{ alert('성당 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }catch(_e){}
    });
    return;
  }
  _pendingParishDioCode=null;
  _activateParishDio(code);
}

function _focusParishDio(code, opts){
  opts=opts||{};
  if(opts.fromLabel && _parishDioUserZoomTouched){
    if(_centerParishDioWithoutZoom(code)) return;
  }
  _fitParishDioBounds(code,{reason:'dio-click'});
}

function _fitParishDioBounds(code, opts){
  opts=opts||{};
  if(_mode!=='parish'||!_map||typeof _LB==='undefined'||typeof _LL==='undefined') return false;
  const parishes=_PA_BY_DIO[code]||[];
  let bounds=null, count=0, only=null;
  try{
    parishes.forEach(function(p){
      if(!p||!p.lat||!p.lng||p.lat===0||p.lng===0) return;
      if(_isParishDioBoundsOutlier(p, code)) return;
      only=p;
      const pos=new _LL(p.lat,p.lng);
      if(!bounds) bounds=new _LB();
      bounds.extend(pos);
      count++;
    });
    if(count>1 && bounds){
      _markParishDioProgrammaticMove(1700);
      // 교구 선택은 정보카드용 중심 보정을 사용하지 않는다. setBounds 한 번으로만 이동한다.
      try{ _map.setBounds(bounds, 86, 64, 126, 64); }
      catch(e1){ _map.setBounds(bounds); }
      return true;
    }
    if(count===1 && only){
      if(typeof _map.setLevel==='function'){ _markParishDioProgrammaticMove(1200); _map.setLevel(8); }
      if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(only.lat,only.lng));
      else _map.setCenter(new _LL(only.lat,only.lng));
      return true;
    }
    const cfg=_DIO_CFG[code];
    if(cfg){
      if(typeof _map.setLevel==='function'){ _markParishDioProgrammaticMove(1200); _map.setLevel(8); }
      if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(cfg.lat,cfg.lng));
      else _map.setCenter(new _LL(cfg.lat,cfg.lng));
      return true;
    }
  }catch(e){ console.warn('[가톨릭길동무]',e); }
  return false;
}

function _ensureParishMarkerZoom(){
  if(_mode!=='parish'||!_map||typeof _map.getLevel!=='function'||typeof _map.setLevel!=='function') return;
  try{
    if(_map.getLevel()>6){ _markParishDioProgrammaticMove(1200); _map.setLevel(6); }
  }catch(e){ console.warn('[가톨릭길동무]',e); }
}
function _showParishDioMkrs(code){
  if(_isParishRouteLineActive() || _isParishNearbyMapMode()){
    try{ _hideParishDioMkrs(code); }catch(e){ console.warn('[가톨릭길동무]',e); }
    if(_isParishNearbyMapMode()) try{ _syncParishDioLabels(); }catch(_e){}
    return;
  }
  if(!code) return;
  try{ _hideAllParishDioMkrs(); }catch(e){ console.warn('[가톨릭길동무]',e); }
  _setParishMapLayerMode('dio','show-dio');
  try{ _bumpParishDioLayerToken('show-dio:'+code); }catch(_e){}
  if(!_dioMkrs[code]){
    const cfg=_DIO_CFG[code]||{c:'#555'};
    const parishes=_PA_BY_DIO[code]||[];
    _dioMkrs[code]=[];
    parishes.forEach(p=>{
      if(!p.lat||!p.lng||p.lat===0||p.lng===0) return;
      const mk=new _MM({
        position:new _LL(p.lat,p.lng),
        image:_mkrImg(cfg.c,false),
        title:p.name,
        zIndex:50
      });
      kakao.maps.event.addListener(mk,'click',function(){
        const idx=_findCurrentParishIndex(p);
        if(idx<0) return;
        if(_isRouteSelectionModeActive()) _selectRouteItem(idx);
        else selectItem(idx,{fromNearby:false,fromRegion:_isRegionSearchActiveForItem(PARISHES[idx])});
      });
      _dioMkrs[code].push(mk);
    });
  }
  _updateParishViewport(code);
  if(_parishIdleListener){
    try{kakao.maps.event.removeListener(_parishIdleListener);}catch(e){ console.warn('[가톨릭길동무]',e); }
    _parishIdleListener=null;
  }
  /* V8-1-14-621: 성당 지도는 idle 때마다 교구 전체 마커 setMap을 반복해
     확대·축소 후 버벅임이 커졌다. 현재 _updateParishViewport는 실제 뷰포트 필터링을 하지
     않으므로 최초 표시 때 한 번만 실행하고 zoom/idle 반복 리스너는 붙이지 않는다. */
}

function _updateParishViewport(code){
  const mkrs=_dioMkrs[code];
  if(!mkrs||!_map) return;
  if(_isParishNearbyMapMode() || _isParishRouteLineActive()){
    mkrs.forEach(mk=>{
      try{ _setMarkerMapIfChanged(mk,null); }catch(e){ console.warn('[가톨릭길동무]',e); }
    });
    return;
  }
  const layerToken=_currentParishDioLayerToken();
  const buildToken=_currentMainMapBuildToken();
  let i=0;
  const batch=64;
  (function applyBatch(){
    if(!_isMainMapBuildCurrent(buildToken,'parish')) return;
    if(!_isParishDioLayerTokenCurrent(layerToken)) return;
    if(_isParishNearbyMapMode() || _isParishRouteLineActive()) return;
    if(_activeDio!==code || !_dioMkrs[code]) return;
    const end=Math.min(i+batch, mkrs.length);
    for(;i<end;i++){
      try{ _setMarkerMapIfChanged(mkrs[i],_map); }catch(e){ console.warn('[가톨릭길동무]',e); }
    }
    if(i<mkrs.length) requestAnimationFrame(applyBatch);
  })();
}

function _hideParishDioMkrs(code){
  (_dioMkrs[code]||[]).forEach(mk=>{ try{_setMarkerMapIfChanged(mk,null);}catch(e){ console.warn('[가톨릭길동무]',e); } });
  if(_parishIdleListener){
    try{kakao.maps.event.removeListener(_parishIdleListener);}catch(e){ console.warn('[가톨릭길동무]',e); }
    _parishIdleListener=null;
  }
}
function _buildRetreatMarkers(){
  if(!_map) return;
  if(!_retreatMarkers.length){
    if(window.__OAI_RETREAT_MARKER_BUILDING__) return;
    window.__OAI_RETREAT_MARKER_BUILDING__ = true;
    const buildToken=_currentMainMapBuildToken();
    let i=0;
    const batch=42;
    function buildBatch(){
      if(!_isMainMapBuildCurrent(buildToken,'retreat')){ window.__OAI_RETREAT_MARKER_BUILDING__ = false; return; }
      const end=Math.min(i+batch, RETREATS.length);
      for(;i<end;i++){
        const p=RETREATS[i];
        if(!p.lat||!p.lng||p.lat===0) continue;
        const mk=new _MM({
          position:new _LL(p.lat,p.lng),
          image:_mkrImg('#2e7d32',false),
          title:p.name,
          zIndex:45
        });
        (function(idx){kakao.maps.event.addListener(mk,'click',function(){
          if(_isRouteSelectionModeActive()) _selectRouteItem(idx);
          else selectItem(idx,{fromNearby:false,fromRegion:_isRegionSearchActiveForItem(RETREATS[idx])});
        });})(i);
        if(!_shouldDeferFullCategoryMarkers()) _setMarkerMapIfChanged(mk,_map);
        else mk.__oaiMapTarget=null;
        _retreatMarkers.push({marker:mk,item:p,index:i});
      }
      if(i<RETREATS.length) requestAnimationFrame(buildBatch);
      else { window.__OAI_RETREAT_MARKER_BUILDING__ = false; _raiseMyLocationMarker(); }
    }
    requestAnimationFrame(buildBatch);
    return;
  }
  const buildToken=_currentMainMapBuildToken();
  let j=0;
  const batch2=64;
  (function applyBatch(){
    if(!_isMainMapBuildCurrent(buildToken,'retreat')) return;
    const end=Math.min(j+batch2, _retreatMarkers.length);
    for(;j<end;j++) _setMarkerMapIfChanged(_retreatMarkers[j].marker,_map);
    if(j<_retreatMarkers.length) requestAnimationFrame(applyBatch);
    else _raiseMyLocationMarker();
  })();
}
function _clearRetreatMarkers(){
  _retreatMarkers.forEach(o=>_setMarkerMapIfChanged(o.marker,null));
  if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); } _paSelMkr=null;}
}
function _restoreRetreatMarkers(){
  _retreatMarkers.forEach(o=>{
    const s=o.item;
    const ok=(_filterDio==='all'||s.diocese===_filterDio)&&(!_listSrch||_itemSearchBlob(s).includes(_listSrch)||_itemSearchNorm(s).includes(String(_listSrch).replace(/\s+/g,'')));
    _setMarkerMapIfChanged(o.marker, ok?_map:null);
  });
}
function _selectRetreatMarker(p){
  if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); } _paSelMkr=null;}
  if(!_map||!p.lat||!p.lng) return;
  _paSelMkr=new _MM({position:new _LL(p.lat,p.lng),image:_mkrImgRetreat('#FFE500',true),zIndex:180});
  _paSelMkr.setMap(_map);
  _raiseMyLocationMarker();
}

function _clearParishMarkers(){
  if(_paSelMkr){try{_paSelMkr.setMap(null);}catch(e){ console.warn("[가톨릭길동무]", e); }  _paSelMkr=null;}
  if(_activeDio){ _hideParishDioMkrs(_activeDio); _activeDio=null; }
  document.querySelectorAll('.dio-label').forEach(e=>e.style.transform='');
  _hideDioOverlays();
}


function _isMyLocFresh(maxAgeMs){
  try{
    const limit=maxAgeMs || OAI_LOCATION_CACHE_MAX_MS;
    const n=Date.now ? Date.now() : new Date().getTime();
    const t=Number(_myLocAt || (AppState && AppState.myLocAt) || 0);
    if(_myLat && _myLng && t && (n - t) <= limit) return true;
    return _useStoredLocationIfAny(null,limit);
  }catch(e){}
  return false;
}
function _getFreshGeoPosition(success, fail){
  if(!_GEO){ if(fail) fail({code:0}); return; }
  let done=false;
  let fastStarted=Date.now ? Date.now() : new Date().getTime();
  function warmAccurateLocation(){
    try{
      setTimeout(function(){
        try{
          _GEO.getCurrentPosition(function(pp){
            try{ _setMyLoc(pp.coords.latitude, pp.coords.longitude); }catch(_e){}
          },function(){},_GO_ACCURATE_FRESH);
        }catch(_e){}
      }, 1000);
    }catch(_e){}
  }
  function ok(p){
    if(done) return;
    done=true;
    success && success(p);
    warmAccurateLocation();
  }
  function fallback(e1){
    if(done) return;
    try{
      _GEO.getCurrentPosition(ok,function(e2){ if(done) return; done=true; fail && fail(e2 || e1); },_GO_ACCURATE_FRESH);
    }catch(e){ if(!done){ done=true; fail && fail(e1 || e); } }
  }
  try{
    _GEO.getCurrentPosition(ok,function(e){
      var elapsed=(Date.now ? Date.now() : new Date().getTime())-fastStarted;
      if(elapsed < 300) setTimeout(function(){ fallback(e); }, 150);
      else {
        done=true;
        if(fail) fail(e);
        /* V8-1-14-621: 빠른 위치가 실패했을 때도 UI를 오래 잡아두지 않고,
           정확 위치는 뒤에서 짧게 한 번 더 시도해 다음 위치 요청을 준비한다. */
        warmAccurateLocation();
      }
    },_GO_FAST_FRESH);
  }catch(e){ fallback(e); }
}

function _autoLocate(opts){
  opts=opts||{};
  const preserveMapCenter=opts.preserveMapCenter===true||_isShrineMapTargetCenterLocked();
  function apply(lat,lng,fromCache){
    try{
      if(!fromCache) _setMyLoc(lat,lng);
      else { _myLat=lat; _myLng=lng; }
      if(!_map||preserveMapCenter) return;
      if(_mode==='shrine'){
       _centerCurrentLocationPlain(lat,lng,8);
      } else if(_mode==='parish'){
       _map.setLevel(6);
       if(typeof _focusParishPointAround==='function') _focusParishPointAround(lat,lng,{level:6});
       else _map.setCenter(new _LL(lat,lng));
      } else if(_mode==='retreat'){
       _centerCurrentLocationPlain(lat,lng,9);
      }
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  const usedCache=_useStoredLocationIfAny(apply,OAI_LOCATION_CACHE_MAX_MS);
  if(!_GEO) return;
  _refreshFreshLocationThen(apply,function(){});
}

function _nearestDioCode(lat,lng){
  if(!_DIO_CFG) return null;
  let best=null,bestD=Infinity;
  Object.entries(_DIO_CFG).forEach(([code,cfg])=>{
    if(code==='ML') return;
    if(!cfg.lat||!cfg.lng) return;
    const d=Math.pow(lat-cfg.lat,2)+Math.pow(lng-cfg.lng,2);
    if(d<bestD){bestD=d;best=code;}
  });
  return best;
}
function _showCurrentParishDioIfIdle(){
  if(_isParishNearbyMapMode() || (_nearbyCache && _nearbyCache.length)) return;
  if(_mode!=='parish'||!_map||!_myLat||!_myLng||_paSelMkr||_routeMode||_rS||_rE) return;
  if(!_parishSysInited) return;
  const code=_nearestDioCode(_myLat,_myLng);
  if(!code) return;
  if(!_isParishDioceseReady(code)){
    _ensureParishDioceseDataLoaded(code).then(function(){ _showCurrentParishDioIfIdle(); }).catch(function(err){ console.warn('[가톨릭길동무] 현재 위치 교구 로드 실패', err); });
    return;
  }
  try{
    if(_activeDio && _activeDio!==code) _hideParishDioMkrs(_activeDio);
    _ensureParishMarkerZoom();
    _activeDio=code;
    _showParishDioMkrs(code);
    _syncParishDioLabels();
    if(typeof _focusParishPointAround==='function') _focusParishPointAround(_myLat,_myLng,{level:6});
    document.querySelectorAll('.dio-label').forEach(e=>{e.style.transform='';e.style.display='';});
    const clickedEl=_dioOverlays[code]?.getContent?.();
    if(clickedEl){clickedEl.style.display='none';}
  }catch(e){ console.warn("[가톨릭길동무]", e); }
}
function _raiseMyLocationMarker(){
  try{
    if(_myMkr && typeof _myMkr.setZIndex==='function') _myMkr.setZIndex(OAI_MY_LOCATION_MARKER_ZINDEX);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _setMyLoc(lat,lng,opts){
  opts=opts||{};
  _myLat=lat;_myLng=lng;
  _myLocAt=Date.now ? Date.now() : new Date().getTime();
  try{ if(AppState){ AppState.myLocAt=_myLocAt; } }catch(_e){}
  _saveRecentStoredLocation(lat,lng);
  /* 위치 갱신 후 성지 도착 여부는 확인한다.
     자동감지는 도착 팝업만 띄우며 현재 화면/내주변 탭을 강제로 열지 않는다. */
  if(!opts.suppressAutoShrineVisit){
    try{ setTimeout(function(){ _maybePromptAutoShrineVisit(lat,lng); }, 180); }catch(_e){}
    try{ setTimeout(function(){ _maybeAutoParishVisit(lat,lng); }, 220); }catch(_e){}
  }
  if(typeof kakao==='undefined'||!_map) return;  // 지도 미로드 시에도 현재 위치 좌표 저장은 유지
  const pos=new _LL(lat,lng);
  if(_myMkr && typeof _myMkr.setPosition==='function'){
    try{ _myMkr.setPosition(pos); _setMarkerMapIfChanged(_myMkr,_map); _raiseMyLocationMarker(); }catch(_e){}
    if(_mode!=='parish') setTimeout(_showCurrentParishDioIfIdle, 80);
    return;
  }
  const svg=`<svg ${_NS} width='28' height='28' viewBox='0 0 28 28'><circle cx='14' cy='14' r='12' fill='#1a73e8' opacity='.18'/><circle cx='14' cy='14' r='7' fill='#1a73e8'/><circle cx='14' cy='14' r='3.5' fill='white'/></svg>`;
  _myMkr=new _MM({
  position:pos,
  image:new _MI(_svgUrl(svg),
   new _SZ(28,28),{offset:new _PT(14,14)}),
  zIndex:OAI_MY_LOCATION_MARKER_ZINDEX
  });
  _myMkr.setMap(_map);
  _raiseMyLocationMarker();
  if(_mode!=='parish') setTimeout(_showCurrentParishDioIfIdle, 80);
}

function _requestLifecycleFreshLocation(opts){
  opts=opts||{};
  const token=String(opts.cycleId||('manual-'+Date.now()));
  window.__OAI_LOCATION_REFRESH_TOKEN__=token;
  function stillCurrent(){ return window.__OAI_LOCATION_REFRESH_TOKEN__===token; }
  function usePosition(pos){
    if(!stillCurrent()||!pos||!pos.coords) return;
    const lat=Number(pos.coords.latitude), lng=Number(pos.coords.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)) return;
    _setMyLoc(lat,lng,{suppressAutoShrineVisit:!!opts.suppressAutoShrineVisit});
    try{
      if(_routeMode && _rS && _rS.isCurrentLocation){ _rS.lat=lat; _rS.lng=lng; }
    }catch(_e){}
    try{ if(_curInfoItem && typeof _updateInfoDistance==='function') _updateInfoDistance(); }catch(_e){}
  }
  function requestNow(){
    if(!_GEO) return;
    let finished=false;
    const fast={enableHighAccuracy:false,timeout:7000,maximumAge:0};
    const accurate={enableHighAccuracy:true,timeout:12000,maximumAge:0};
    try{
      _GEO.getCurrentPosition(function(pos){
        if(finished||!stillCurrent()) return;
        const acc=Number(pos&&pos.coords&&pos.coords.accuracy||9999);
        usePosition(pos);
        if(acc<=80){ finished=true; return; }
        try{ _GEO.getCurrentPosition(function(p2){ if(!finished&&stillCurrent()){ finished=true; usePosition(p2); } },function(){ finished=true; },accurate); }catch(_e){ finished=true; }
      },function(){
        if(finished||!stillCurrent()) return;
        try{ _GEO.getCurrentPosition(function(p2){ if(!finished&&stillCurrent()){ finished=true; usePosition(p2); } },function(){ finished=true; },accurate); }catch(_e){ finished=true; }
      },fast);
    }catch(_e){}
  }
  if(opts.suppressAutoShrineVisit){
    requestNow();
    return;
  }
  try{
    _ensureShrineDataLoaded().then(requestNow).catch(requestNow);
  }catch(_e){ requestNow(); }
}
window.oaiRefreshCurrentLocation=_requestLifecycleFreshLocation;

function goMyLoc(){
  function apply(lat,lng,fromCache){
    try{
      if(!fromCache) _setMyLoc(lat,lng);
      else { _myLat=lat; _myLng=lng; }
      if(_map){
        _centerCurrentLocationPlain(lat,lng,7);
      }
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  const usedCache=_useStoredLocationIfAny(apply,OAI_LOCATION_CACHE_MAX_MS);
  if(!_GEO){ if(!usedCache) alert('위치 정보를 지원하지 않습니다.'); return; }
  _refreshFreshLocationThen(apply,function(err){
    if(usedCache) return;
    if(_mode==='shrine') window.__OAI_SHRINE_NEARBY_LOADING__=false;
    try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
    try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
    alert(err&&err.code===1?'위치 권한을 허용해 주세요.':'위치를 가져올 수 없습니다.');
  });
}

function _beginNearbyLoad(){
  try{
    AppState.nearbyLoadToken = (AppState.nearbyLoadToken || 0) + 1;
    return AppState.nearbyLoadToken;
  }catch(e){
    window.__oaiNearbyLoadToken = (window.__oaiNearbyLoadToken || 0) + 1;
    return window.__oaiNearbyLoadToken;
  }
}
function _cancelNearbyLoad(){
  _beginNearbyLoad();
}
function _isNearbyLoadCurrent(mode, token, body){
  try{
    if(mode && _mode !== mode) return false;
    if(_screen !== 'map') return false;
    if(token && AppState && AppState.nearbyLoadToken !== token) return false;
    if(body && body !== $('nearby-body')) return false;
    return true;
  }catch(e){
    return false;
  }
}

function _loadNearby(){
  const body=$('nearby-body');
  if(!body) return;
  _cancelNearbyLoad();
  const requestMode=_mode;
  let settled=false;

  if(requestMode==='shrine'){
    window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
    window.__OAI_SHRINE_NEARBY_LOADING__=true;
    window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__=true;
  }
  try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
  try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
  _ensureNearbyDistanceLoading(body);

  function markReadyForDistance(){
    if(requestMode==='shrine'){
      window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__=false;
      window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
      window.__OAI_SHRINE_NEARBY_LOADING__=true;
      try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
      try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
    }
  }
  function runWithActualLocation(lat,lng){
    if(settled) return;
    settled=true;
    try{ _setMyLoc(lat,lng); }catch(_e){ _myLat=lat; _myLng=lng; }
    markReadyForDistance();
    if(requestMode==='shrine') _loadNearbyShrines(lat,lng);
    else if(requestMode==='retreat') _loadNearbyRetreats(lat,lng);
    else _loadNearbyParishes(lat,lng);
  }
  function showLocationError(err){
    if(requestMode==='shrine'){
      window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__=false;
      window.__OAI_SHRINE_NEARBY_LOADING__=false;
    }
    try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
    try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
    if(err && err.code===1){
      body.innerHTML=`<div style="padding:28px 20px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px">📍</div>
        <div style="font-size:14px;font-weight:700;color:#c0392b;margin-bottom:8px">위치 권한이 거부되어 있습니다</div>
        <div style="font-size:12px;color:#888;line-height:1.7;margin-bottom:18px">
          브라우저 주소창 왼쪽의 🔒 아이콘을 탭한 뒤<br>
          <b>위치</b> 권한을 <b>허용</b>으로 변경하고 다시 시도하세요.
        </div>
        <button onclick="_loadNearby()" style="background:#0e1535;color:#d4aa6a;border:none;border-radius:20px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">↺ 현재 위치 다시 확인</button>
      </div>`;
    } else {
      body.innerHTML=`<div style="padding:28px 20px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px">😔</div>
        <div style="font-size:14px;font-weight:700;color:#c0392b;margin-bottom:8px">현재 위치를 확인하지 못했습니다</div>
        <div style="font-size:12px;color:#888;line-height:1.7;margin-bottom:18px">내주변 거리는 저장된 위치가 아니라 실제 현재 위치 기준으로만 계산합니다.<br>GPS와 네트워크 상태를 확인한 뒤 다시 시도해 주세요.</div>
        <button onclick="_loadNearby()" style="background:#0e1535;color:#d4aa6a;border:none;border-radius:20px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">↺ 현재 위치 다시 확인</button>
      </div>`;
    }
  }

  if(!_GEO){
    showLocationError({code:0});
    return;
  }

  /* 성지/성당/피정 내주변 거리 계산은 저장 위치·이전 위치·캐시 위치로 확정하지 않는다.
     maximumAge:0 새 위치를 받은 경우에만 거리와 목록을 계산한다. */
  _getNearbyFreshGeoPosition(function(p){
    const lat=p.coords.latitude, lng=p.coords.longitude;
    runWithActualLocation(lat,lng);
  },function(err){
    if(settled) return;
    showLocationError(err || {code:0});
  });
}

function _loadNearbyWithDist(lat,lng,items,getIdx,getColor,getLabel){
  const body=$('nearby-body');
  const requestMode=_mode;
  const requestToken=_beginNearbyLoad();
  if(requestMode==='shrine'){
    window.__OAI_SHRINE_NEARBY_LOADING__=true;
    window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
    try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
    try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
  }
  const POOL=items.filter(p=>p.lat&&p.lng);
  /* V8-1-14-679:
     내주변 목록은 거리순 10개만 표시한다. 지도 마커 범위는 이 목록 제한과 분리하며,
     성당은 해당 교구 전체, 성지·피정의집은 전국 전체 데이터를 사용한다. */
  const prelim=POOL.map(p=>({p,d:calcDist(lat,lng,p.lat,p.lng)})).sort((a,b)=>a.d-b.d);
  const routePrelim=prelim.slice(0, Math.min(OAI_NEARBY_ROUTE_DISTANCE_LIMIT, prelim.length));

  if(!prelim.length){
    if(body && _isNearbyLoadCurrent(requestMode,requestToken,body)) body.innerHTML='<div class="empty-msg">표시할 장소가 없습니다.</div>';
    if(requestMode==='shrine'){
      if(window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__===true){
        window.__OAI_SHRINE_NEARBY_LOADING__=true;
        window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
      } else {
        window.__OAI_SHRINE_NEARBY_LOADING__=false;
        window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=true;
      }
      try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
      try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
      if(window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__===true){
        try{ _scheduleShrineVisitFloatingListButtonReadyRefresh(); }catch(_e){}
      }
    }
    return;
  }

  if(body && _isNearbyLoadCurrent(requestMode,requestToken,body)){
    // 목록의 자동차 거리 계산과 지도 마커 표시는 분리한다. 지도는 전체 범위를 즉시 표시하고 목록만 10개를 계산한다.
    _ensureNearbyDistanceLoading(body);
    _nearbyCache=prelim.map(function(row){ return row.p; });
    if(requestMode==='shrine' && _map){
      _showAllShrinesOnMapWithNearbyBounds(_nearbyCache,lat,lng);
    }else if(requestMode==='retreat' && _map){
      _showRetreatNearbyMarkersOnMap(_nearbyCache,lat,lng);
    }else if(requestMode==='parish' && _map){
      _ensureParishNearbyMarkersVisible(_nearbyCache,lat,lng,'initial');
    }
  }

  _runRouteDistanceQueue(
    routePrelim,
    lat,
    lng,
    function(row){ return row && row.p; },
    function(){ return _isNearbyLoadCurrent(requestMode,requestToken,body); },
    function(results){
      if(!_isNearbyLoadCurrent(requestMode,requestToken,body)) return;
      _renderNearbyDone(prelim,results,getIdx,getColor,getLabel,'final',requestMode,requestToken);
    }
  );
}
function _renderNearbyDone(prelim,results,getIdx,getColor,getLabel,phase,requestMode,requestToken){
  const body=$('nearby-body');
  if(!body) return;
  if(requestMode && !_isNearbyLoadCurrent(requestMode,requestToken,body)) return;
  const listPrelim=prelim.slice(0, Math.min(OAI_NEARBY_LIST_LIMIT, prelim.length));
  const sorted=listPrelim.map(function(x,i){
    const routeResult=results[i]||null;
    return {x:x,r:routeResult||{km:x.d*1.35,dur:null,estimate:true}};
  }).sort(function(a,b){ return a.r.km-b.r.km; });
  // 지도 레이어용 전체 데이터는 유지하고, 아래 목록 렌더링에만 10개 제한을 적용한다.
  _nearbyCache=prelim.map(function(o){ return o.p; });
  if(phase==='final'&&_mode==='parish'&&_map){
    _ensureParishNearbyMarkersVisible(_nearbyCache,_myLat,_myLng,phase);
  }
  if(phase==='final'&&_map){
    try{
      const sh=$('sheet-nearby');
      const nearbyOpen=!!(sh && sh.classList.contains('open'));
      // 성당은 닫힌 목록 뒤에서도 주변 마커와 사용자가 보고 있던 지도 시점을 유지한다.
      if(!nearbyOpen && requestMode!=='parish') _scheduleNearbyMyLocationPlainRestore('nearby-final-hidden');
    }catch(_e){}
  }
  const scrollTop=body.scrollTop||0;
  body.innerHTML=sorted.map((o,i)=>{
    const item=o.x.p;
    const idx=getIdx(item);
    return _renderPlaceDistanceRow(item, idx, i, 'nearby', o.r, o.x.d*1.35, {
      mode:requestMode || _mode,
      color:getColor(item),
      label:getLabel(item),
      estimate:(phase==='est') || !!(o.r && o.r.estimate)
    });
  }).join('');
  if(phase==='final'){
    body.scrollTop=scrollTop;
    if(_mode==='shrine'){
      if(window.__OAI_SHRINE_NEARBY_AWAITING_FRESH__===true){
        window.__OAI_SHRINE_NEARBY_LOADING__=true;
        window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=false;
      } else {
        window.__OAI_SHRINE_NEARBY_LOADING__=false;
        window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__=true;
      }
    }
    try{ _updateShrineVisitCardsButtonUI(); }catch(_e){}
    try{ _updateShrineNearbyLocationButtonUI(); }catch(_e){}
    if(_mode==='shrine' && window.__OAI_SHRINE_NEARBY_DISTANCE_DONE__===true){
      try{ _scheduleShrineVisitFloatingListButtonReadyRefresh(); }catch(_e){}
    }
  }
}
function _loadNearbyShrines(lat,lng){
  _loadNearbyWithDist(lat,lng,SHRINES,p=>SHRINES.indexOf(p),p=>TC[p.type]||'#555',p=>p.type);
}
function _nearbyParishDioCodeForLocation(lat,lng,opts){
  opts = opts || {};
  try{
    if(opts.ignoreSelection!==true){
      if(_filterDio && _filterDio!=='all'){
        return _PARISH_DIO_CODE_MAP[_filterDio] || null;
      }
      if(_activeDio) return _activeDio;
    }
    let best=null, bestD=Infinity;
    Object.entries(_DIO_CFG||{}).forEach(function(pair){
      const code=pair[0], cfg=pair[1];
      if(code==='ML' || !cfg || !cfg.lat || !cfg.lng) return;
      const d=calcDist(lat,lng,cfg.lat,cfg.lng);
      if(d<bestD){ bestD=d; best=code; }
    });
    return best;
  }catch(e){ console.warn('[가톨릭길동무]',e); return null; }
}
function _loadNearbyParishes(lat,lng){
  const body=$('nearby-body');
  const waitMode=_mode;
  let waitToken=0;
  try{ waitToken = AppState && AppState.nearbyLoadToken ? AppState.nearbyLoadToken : 0; }catch(_e){ waitToken = window.__oaiNearbyLoadToken || 0; }
  /* V8-1-14-621:
     성당 내주변은 여러 교구를 섞지 않는다.
     사용자가 교구를 선택했으면 그 교구, 선택이 없으면 현재 위치에 가장 가까운 교구만 대상으로 한다. */
  const code=_nearbyParishDioCodeForLocation(lat,lng);
  if(!code){
    if(body && _isNearbyLoadCurrent(waitMode,waitToken,body)) body.innerHTML='<div class="empty-msg">현재 위치에 해당하는 교구를 찾지 못했습니다.</div>';
    return;
  }
  const dioName=(_DIO[code]||'해당 교구');
  if(!_isParishDioceseReady(code)){
    _ensureNearbyDistanceLoading(body);
    _ensureParishDioceseDataLoaded(code).then(function(){
      if(!_isNearbyLoadCurrent(waitMode,waitToken,body)) return;
      _loadNearbyParishes(lat,lng);
    }).catch(function(err){
      console.warn('[가톨릭길동무] '+dioName+' 성당 데이터 로드 실패', err);
      if(body && _isNearbyLoadCurrent(waitMode,waitToken,body)) body.innerHTML='<div class="empty-msg">'+_placeText(dioName)+' 성당 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</div>';
    });
    return;
  }
  _refreshParishDataFromLoadedDioceses();
  const pool=PARISHES.filter(function(p){ return _parishDioCodeOf(p)===code; });
  if(!pool.length){
    if(body && _isNearbyLoadCurrent(waitMode,waitToken,body)) body.innerHTML='<div class="empty-msg">'+_placeText(dioName)+' 성당 정보를 찾지 못했습니다.</div>';
    return;
  }
  if(AppState){ AppState.nearbyParishDioCode=code; }
  _activeDio=code;
  try{ _syncParishDioLabels(); }catch(_e){}
  _loadNearbyWithDist(lat,lng,pool,p=>_findCurrentParishIndex(p),()=>OAI_CATHEDRAL_CATEGORY_COLOR,()=>dioName);
}

function _loadNearbyRetreats(lat,lng){
  _loadNearbyWithDist(lat,lng,RETREATS,p=>RETREATS.indexOf(p),p=>_getRetreatColor(p),()=>'🏔 피정의 집');
}

function renderList(){
  const body=$('list-body');
  if(!body) return;
  const items = _getCurrentItems();
  const q=_listSrch;
  const groups={};
  items.forEach((s,i)=>{
    if(_mode==='shrine' && !_isSouthKoreaCoordinate(s.lat,s.lng)) return;
    /* V8-1-14-679: 성당은 교구 탭이 선택되어 있어도 검색어가 있으면 전국 전체에서 찾는다.
       검색어가 없을 때만 선택 교구가 목록 범위를 제한한다. */
    const matchDio = (_mode==='parish' && q) ? true : (_filterDio==='all'||s.diocese===_filterDio);
    if(!matchDio) return;
    const score=q?_placeSearchScore(s,q):0;
    if(!Number.isFinite(score)) return;
    if(!groups[s.diocese]) groups[s.diocese]=[];
    groups[s.diocese].push({s,i,score});
  });
  if(Object.keys(groups).length===0){
    if(_mode==='parish' && !PARISHES.length) body.innerHTML='<div class="empty-msg">교구를 선택해 주세요.</div>';
    else if(q && _filterDio!=='all' && _mode!=='parish') body.innerHTML='<div class="empty-msg">선택한 교구 안에 검색 결과가 없습니다</div>';
    else body.innerHTML='<div class="empty-msg">검색 결과가 없습니다</div>';
    return;
  }
  if(q){
    Object.keys(groups).forEach(function(dio){
      groups[dio].sort(function(a,b){
        return _comparePlaceSearchEntries({score:a.score,item:a.s},{score:b.score,item:b.s});
      });
    });
  }
  let dioceseNames=Object.keys(groups);
  if(q){
    dioceseNames.sort(function(a,b){
      const aScore=Math.min.apply(null,groups[a].map(function(entry){return entry.score;}));
      const bScore=Math.min.apply(null,groups[b].map(function(entry){return entry.score;}));
      if(aScore!==bScore) return aScore-bScore;
      const my=_getMyDioceseName();
      if(my){
        const ar=a===my?0:1, br=b===my?0:1;
        if(ar!==br) return ar-br;
      }
      return _getDioceseOrderIndex(a)-_getDioceseOrderIndex(b);
    });
  }else{
    dioceseNames=_sortDioceseNamesWithMyFirst(dioceseNames);
  }
  const html=[];
  dioceseNames.forEach((dio)=>{
    const entries=groups[dio];
    const my=_isMyDioceseName(dio);
    html.push(`<div class="dio-hd${my?' my-diocese-hd':''}">${_placeText(dio)}${my?'<span class="list-my-dio-badge">나의 교구</span>':''}</div>`);
    entries.forEach(({s,i})=>{
      html.push(_renderPlaceListRowHtml(s,i,{mode:_mode}));
    });
  });
  body.innerHTML=html.join('');
}

function onListSearch(v){
  _listSrch=v.trim();
  $('list-srch-x').style.display=v?'block':'none';
  /* 전국 성당 검색은 현재 선택한 교구와 무관하다. 입력 직후 아직 불러오지 않은
     교구가 있으면 '결과 없음'을 먼저 표시하지 말고, 전체 목록을 준비한 뒤 같은
     검색어로 다시 그린다. */
  if(_mode==='parish' && _listSrch && !_areAllParishDiocesesReady()){
    _showParishDataLoadingMessage('전국 성당 정보를 불러오는 중입니다...');
    _ensureAllParishDiocesesLoaded({silent:true}).then(function(){
      if(_mode==='parish' && _listSrch) renderList();
    }).catch(function(err){
      console.warn('[가톨릭길동무] 전국 성당 검색 데이터 로드 실패', err);
      if(_mode==='parish') renderList();
    });
    return;
  }
  renderList();
  setTimeout(()=>_scrollSheetTop('list'),0);
}
function clearListSearch(){
  _listSrch='';
  $('list-srch-inp').value='';
  $('list-srch-x').style.display='none';
  renderList();
  setTimeout(()=>_scrollSheetTop('list'),0);
}
function setDioFilter(v,btn){
  if(_mode==='parish'){
    const code = v==='all' ? null : (_PARISH_DIO_CODE_MAP[v]||null);
    if(v==='all' && !_areAllParishDiocesesReady()){
      _filterDio=v;
      $$('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn?.classList.add('active');
      _scrollDioFilterButtonIntoView(btn);
      _showParishDataLoadingMessage('전체 성당 정보를 불러오는 중입니다...');
      _ensureAllParishDiocesesLoaded().then(function(){ setDioFilter(v,btn); }).catch(function(err){ console.warn('[가톨릭길동무] 전체 성당 데이터 로드 실패', err); });
      return;
    }
    if(code && !_isParishDioceseReady(code)){
      _filterDio=v;
      $$('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn?.classList.add('active');
      _scrollDioFilterButtonIntoView(btn);
      _showParishDataLoadingMessage((_DIO[code]||v)+' 성당 정보를 불러오는 중입니다...');
      _ensureParishDioceseDataLoaded(code).then(function(){ setDioFilter(v,btn); }).catch(function(err){ console.warn('[가톨릭길동무] 성당 교구 데이터 로드 실패', err); });
      return;
    }
  }
  _filterDio=v;
  $$('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn?.classList.add('active');
  _scrollDioFilterButtonIntoView(btn);
  /* V8-1-14-679: 성당 전국 검색 중 교구 탭을 눌러도 검색어와 결과를 유지한다.
     검색어가 없을 때의 교구별 목록·지도 이동 동작은 기존 기준을 유지한다. */
  const keepParishNationwideSearch=(_mode==='parish' && !!_listSrch);
  if(!keepParishNationwideSearch){
    _listSrch='';
    const inp=$('list-srch-inp');
    if(inp){inp.value='';$('list-srch-x').style.display='none';}
  }
  renderList();
  setTimeout(()=>_scrollSheetTop('list'),0);
  if(v!=='all'&&DIOCESE_CENTER[v]&&_map){
  if(_mode==='parish'){
    const code=_PARISH_DIO_CODE_MAP[v]||null;
    if(code){
      try{
        try{ _clearParishNearbyResults('list-filter:'+code); }catch(_e){}
        try{ _hideAllParishDioMkrs(); }catch(_e){}
        _activeDio=code;
        _showParishDioMkrs(code);
        _syncParishDioLabels();
        if(_fitParishDioBounds(code,{reason:'list-filter'})) return;
      }catch(e){ console.warn('[가톨릭길동무]',e); }
    }
  }
  const dc=DIOCESE_CENTER[v];
  _map.setLevel(dc.mob||10);
  if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(dc.lat,dc.lng));
  else _map.setCenter(new _LL(dc.lat,dc.lng));
  } else if(v==='all'&&_map){
  _map.setLevel(8);
  if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(36.2,127.9));
  else _map.setCenter(new _LL(36.2,127.9));
  }
}

function _regionHtmlEsc(v){
  return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];
  });
}
function _regionAttrEsc(v){
  return _regionHtmlEsc(v).replace(/'/g, '&#39;');
}

function _regionModeLabel(){
  return _mode==='parish' ? '성당' : (_mode==='retreat' ? '피정의 집' : '성지');
}
function _regionGuideHtml(){
  return '<div class="empty-msg region-guide-empty">📍 여행지나 숙소 지역을 검색하면<br>근처 ' + _regionModeLabel() + ' 목록이 나타납니다</div>';
}

function _clearRegionMarker(){
  try{ if(_regionMarker){ _regionMarker.setMap(null); _regionMarker=null; } }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _clearRegionResultMarkers(){
  try{ (_regionResultMarkers||[]).forEach(function(mk){ try{ mk.setMap(null); }catch(e){} }); }catch(e){ console.warn('[가톨릭길동무]', e); }
  _regionResultMarkers=[];
}
function _isRegionSearchActiveForItem(item){
  return !!(_regionLat && _regionLng && Array.isArray(_regionCache) && _regionCache.indexOf(item)>=0);
}
function _rememberRegionStart(lat,lng,name){
  if(!lat || !lng) return;
  const placeName = name || _regionPlaceName || _regionName || '검색지';
  _regionLat=Number(lat); _regionLng=Number(lng);
  _regionName=placeName; _regionPlaceName=placeName;
  _routeRegionStart={lat:_regionLat,lng:_regionLng,name:'📍 '+placeName,placeName:placeName};
}
function _showRegionPlaceMarker(lat,lng,name){
  if(!_map || !lat || !lng || typeof _LL==='undefined' || typeof _MM==='undefined') return;
  try{
    _clearRegionMarker();
    _regionMarker=new _MM({
      position:new _LL(lat,lng),
      image:_mkrImg('#7E22CE',true),
      title:name||'검색 위치',
      zIndex:360
    });
    kakao.maps.event.addListener(_regionMarker,'click',function(){
      try{
        if(_routeMode && _rS && _rS.isRegionStart) _openRoutePointCancelChoice('start');
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    });
    _regionMarker.setMap(_map);
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _focusRegionSearchCenter(lat,lng){
  if(!_map || !lat || !lng || typeof _LL==='undefined') return;
  try{
    if(typeof _map.setLevel==='function') _map.setLevel(6);
    if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(lat,lng));
    else _map.setCenter(new _LL(lat,lng));
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _showRegionResultsOnMap(items, lat, lng, name){
  if(!_map) return;
  items=Array.isArray(items)?items:[];
  _rememberRegionStart(lat,lng,name);
  _showRegionPlaceMarker(lat,lng,name);
  _clearRegionResultMarkers();
  try{
    if(_mode==='shrine'){
      _markers.forEach(function(m){ if(m&&m.marker) _setMarkerMapIfChanged(m.marker,null); });
      items.forEach(function(s){ const i=SHRINES.indexOf(s); if(i>=0&&_markers[i]) _setMarkerMapIfChanged(_markers[i].marker,_map); });
    }else if(_mode==='retreat'){
      (_retreatMarkers||[]).forEach(function(o){ if(o&&o.marker) _setMarkerMapIfChanged(o.marker,null); });
      items.forEach(function(s){ const found=(_retreatMarkers||[]).find(function(o){ return o&&o.item===s; }); if(found&&found.marker) _setMarkerMapIfChanged(found.marker,_map); });
    }else if(_mode==='parish'){
      try{ _clearParishNearbyMarkers(); }catch(e){}
      try{ if(_activeDio){ _hideParishDioMkrs(_activeDio); _activeDio=null; } _hideDioOverlays(); }catch(e){}
      items.forEach(function(p){
        if(!p||!p.lat||!p.lng) return;
        const mk=new _MM({position:new _LL(p.lat,p.lng),image:_mkrImg(OAI_CATHEDRAL_CATEGORY_COLOR,false),title:p.name,zIndex:55});
        kakao.maps.event.addListener(mk,'click',function(){
          const idx=_findCurrentParishIndex(p);
          if(idx<0) return;
          if(_isRouteSelectionModeActive()) _selectRouteItem(idx);
          else selectItem(idx,{fromRegion:true});
        });
        mk.setMap(_map);
        _regionResultMarkers.push(mk);
      });
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  _focusRegionSearchCenter(lat,lng);
}
function _openRegionMapFromCard(){
  if(!_regionLat || !_regionLng) return;
  closeAllTabs();
  _showRegionResultsOnMap(_regionCache,_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
}

const DIOCESE_CENTER={
  '서울대교구':{lat:37.53,lng:126.97,mob:10},'인천교구':{lat:37.60,lng:126.55,mob:10},
  '수원교구':{lat:37.20,lng:127.05,mob:10},'의정부교구':{lat:37.85,lng:127.05,mob:10},
  '춘천교구':{lat:37.90,lng:128.00,mob:10},'원주교구':{lat:37.20,lng:128.00,mob:10},
  '대전교구':{lat:36.45,lng:126.80,mob:10},'청주교구':{lat:36.70,lng:127.80,mob:10},
  '대구대교구':{lat:35.90,lng:128.50,mob:10},'안동교구':{lat:36.60,lng:128.50,mob:10},
  '부산교구':{lat:35.50,lng:129.00,mob:10},'마산교구':{lat:35.25,lng:128.30,mob:10},
  '광주대교구':{lat:35.10,lng:126.90,mob:10},'전주교구':{lat:35.75,lng:127.00,mob:10},
  '제주교구':{lat:33.40,lng:126.50,mob:10},
  '군종교구':{lat:37.53,lng:126.97,mob:10},
};

function onRegionInp(v){
  const body=$('region-body');
  if(!v.trim()){
    body.innerHTML=_regionGuideHtml();
  }
}
function doRegionSearch(){
  const inp=$('region-inp');
  const q=(inp.value||'').trim();
  if(!q) return;
  inp.blur();
  const body=$('region-body');
  body.innerHTML='<div class="empty-msg">🔍 장소 검색 중...</div>';
  _kakaoKeywordDocs(q, KAKAO_PLACE_SEARCH_DISPLAY_LIMIT)
  .then(docs=>{
    if(!docs.length){ _showRegionFallback(q); return; }
    let html='<div style="padding:8px 14px 4px;font-size:11px;font-weight:700;color:#888;background:#f8f9fc;border-bottom:1px solid #eee;">📍 지역을 선택하세요</div>';
    docs.forEach(d=>{
      const nm=d.place_name||'', ad=d.road_address_name||d.address_name||'';
      const cat=d.category_name||'', url=d.place_url||'';
      html+=`<div class="region-place-cand nearby-item" data-lat="${parseFloat(d.y)}" data-lng="${parseFloat(d.x)}" data-name="${_regionAttrEsc(nm)}" data-addr="${_regionAttrEsc(ad)}" data-cat="${_regionAttrEsc(cat)}" data-url="${_regionAttrEsc(url)}"><div class="sm-place-icon" aria-hidden="true">📍</div><div class="nearby-info"><div class="nearby-name">${_regionHtmlEsc(nm)}</div>${ad?`<div class="nearby-addr">${_regionHtmlEsc(ad)}</div>`:''}</div></div>`;
    });
    body.innerHTML=html;
    body.onclick=function(e){
      const cand=e.target.closest('.region-place-cand');
      if(!cand) return;
      body.onclick=null;
      const clat=parseFloat(cand.dataset.lat),clng=parseFloat(cand.dataset.lng),cname=cand.dataset.name;
      const caddr=cand.dataset.addr||'', ccat=cand.dataset.cat||'', curl=cand.dataset.url||'';
      _rememberRegionStart(clat,clng,cname);
      body.innerHTML='<div class="empty-msg">🚗 자동차 거리 계산 중...</div>';
      _showRegionResults(cname,clat,clng,{place_name:cname,road_address_name:caddr,address_name:caddr,category_name:ccat,place_url:curl});
      if(_map){
        if(typeof _setMapCenterByInfoCardStandard==='function') _setMapCenterByInfoCardStandard(new _LL(clat,clng));
        else _map.setCenter(new _LL(clat,clng));
      }
    };
  }).catch(()=>_showRegionFallback(q));
}

function _showRegionResults(q,lat,lng,doc){
  const items=_getCurrentItems();
  const body=$('region-body');
  const requestMode=_mode;
  const requestToken=_beginRegionLoad();
  doc=doc||{};
  const POOL=items.filter(s=>s.lat&&s.lng);
  const prelim=POOL.map(s=>({s,d:calcDist(lat,lng,s.lat,s.lng)})).sort((a,b)=>a.d-b.d).slice(0,OAI_REGION_ROUTE_CANDIDATE_LIMIT);
  const placeName=doc.place_name||q;
  if(!prelim.length){
    _regionCache=[];
    _showRegionResultsOnMap([],lat,lng,placeName);
    if(body && _isRegionLoadCurrent(requestMode,requestToken,body)) body.innerHTML='<div class="empty-msg">표시할 '+_regionModeLabel()+' 목록이 없습니다</div>';
    return;
  }
  const placeAddr=doc.road_address_name||doc.address_name||'';
  const placeCat=doc.category_name?doc.category_name.split(' > ').pop():'';
  const safePlaceName=_regionHtmlEsc(placeName);
  const safePlaceAddr=_regionHtmlEsc(placeAddr);
  const safePlaceCat=_regionHtmlEsc(placeCat);
  const infoCard=`<div class="region-info-card"><div class="ric-hd"><div class="ric-icon">📍</div><div class="ric-name-wrap"><div class="ric-name">${safePlaceName}</div>${placeAddr?`<div class="ric-addr">${safePlaceAddr}</div>`:''}${placeCat?`<div class="ric-cat">${safePlaceCat}</div>`:''}</div><button type="button" class="ric-map-link" onclick="_openRegionMapFromCard()">지도 보기</button></div></div>`;
  const listHd=`<div class="region-list-hd">${requestMode==='parish'?'⛪ 근처 성당':(requestMode==='retreat'?'🏔 근처 피정의 집':'✝ 근처 성지')} <span style="font-size:13px;font-weight:500;color:#aaa">· 자동차 거리순 ${OAI_ROUTE_RESULT_LIMIT}곳</span></div>`;
  if(body && _isRegionLoadCurrent(requestMode,requestToken,body)){
    body.innerHTML=infoCard+listHd+'<div id="rg-loading" style="text-align:center;padding:10px;font-size:12px;color:#888;">🚗 정확한 거리 계산 중입니다…</div><div id="rg-list" style="background:#fff"></div>';
  }
  _runRouteDistanceQueue(
    prelim,
    lat,
    lng,
    function(row){ return row && row.s; },
    function(){ return _isRegionLoadCurrent(requestMode,requestToken,body); },
    function(results){
      if(!_isRegionLoadCurrent(requestMode,requestToken,body)) return;
      const sorted=prelim.map((x,i)=>({x,r:results[i]||{km:x.d*1.35,dur:null}})).sort((a,b)=>a.r.km-b.r.km).slice(0,OAI_ROUTE_RESULT_LIMIT);
      _regionCache=sorted.map(o=>o.x.s);
      _showRegionResultsOnMap(_regionCache,lat,lng,placeName);
      const rgl=$('rg-list');
      const loadEl=$('rg-loading');
      if(loadEl) loadEl.style.display='none';
      if(rgl) rgl.innerHTML=sorted.map((o,i)=>{
        const item=o.x.s;
        const idx=items.indexOf(item);
        return _renderPlaceDistanceRow(item,idx,i,'region',o.r,o.x.d*1.35,{mode:requestMode});
      }).join('');
    }
  );
}

function _showRegionFallback(q){
  _regionPlaceName=q;
  const items=_getCurrentItems();
  try{ _cancelRegionLoad(); }catch(_e){}
  const nq=String(q||'').replace(/\s+/g,'');
  var _matched_all=items.filter(function(s){return String(s.addr||'').includes(q)||String(s.name||'').includes(q)||(s.diocese&&String(s.diocese).includes(q))||(s.kw&&String(s.kw).includes(q))||_itemSearchNorm(s).includes(nq);});
  _matched_all.sort(function(a,b){
    var an=String(a.name||''),bn=String(b.name||'');
    var ae=an===q,be=bn===q;
    if(ae&&!be) return -1; if(!ae&&be) return 1;
    var as=an.startsWith(q),bs=bn.startsWith(q);
    if(as&&!bs) return -1; if(!as&&bs) return 1;
    return 0;
  });
  const matched=_matched_all.slice(0,OAI_ROUTE_RESULT_LIMIT);
  const body=$('region-body');
  if(!matched.length){
    if(body) body.innerHTML='<div class="empty-msg">검색 결과가 없습니다</div>';
    return;
  }
  _regionCache=matched;
  _clearRegionMarker();
  _clearRegionResultMarkers();
  if(_mode==='shrine'&&_map) _showItemsOnMap(_regionCache);
  const items2=_getCurrentItems();
  const list=matched.map((item,i)=>_renderPlaceDistanceRow(item, items2.indexOf(item), i, 'region', null, null, {mode:_mode})).join('');
  if(body) body.innerHTML=`<div style="padding:10px 16px 8px;font-size:12px;font-weight:700;color:#1565c0;background:#fff;border-bottom:1px solid #eee">검색결과 ${matched.length}곳</div>${list}`;
}

function _showRouteGuideText(msg){
  const g=$('route-guide');
  if(!g) return;
  msg=String(msg||'');
  if(/^도착\s+.+를\s+탭하세요$/.test(msg)){
    g.classList.remove('on');
    g.textContent='';
    return;
  }
  if(_polyline || (_rS && _rE)){
    g.classList.remove('on');
    g.textContent='';
    return;
  }
  g.textContent=msg||'';
  g.classList.add('on');
}

function _hideRouteGuide(){
  const g=$('route-guide');
  if(!g) return;
  g.classList.remove('on');
  g.textContent='';
}

function _setImplicitCurrentLocationStartLabelVisible(visible){
  try{
    if(_rS && (_rS.name === '현재 위치' || _rS.name === '현위치')){
      _setRouteLabel('start', visible ? '현위치' : '');
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _ensureCurrentLocationStart(){
  if(_rS&&_rS.lat&&_rS.lng) return;
  if(_routeRegionStart&&_routeRegionStart.lat&&_routeRegionStart.lng){
    _routeStartMarkerExplicitCurrent=false;
    _rS={idx:-1,name:_routeRegionStart.name||'📍 검색지',lat:_routeRegionStart.lat,lng:_routeRegionStart.lng,isRegionStart:true};
    _setRouteLabel('start',_rS.name);
    _refreshRouteTmpMarkers();
    _updateSearchBtn();
    return;
  }
  function applyImplicit(lat,lng,fromCache){
    if(!fromCache) _setMyLoc(lat,lng);
    else { _myLat=lat; _myLng=lng; }
    if(!_rS || (_rS && _rS.isImplicitCurrentLocation)){
      _routeStartMarkerExplicitCurrent=false;
      _rS={idx:-1,name:'현재 위치',lat:lat,lng:lng,isImplicitCurrentLocation:true};
      _setRouteLabel('start','');
      _refreshRouteTmpMarkers();
      _updateSearchBtn();
      if(!_rE){
        _showRouteGuideText(`도착 ${_getRouteGuideTarget()}를 탭하세요`);
      }
    }
  }
  const usedCache=_useStoredLocationIfAny(applyImplicit,OAI_LOCATION_CACHE_MAX_MS);
  if(!_GEO) return;
  _refreshFreshLocationThen(applyImplicit,function(){});
}

function _enterRouteMode(){
  if(_activeTab !== 'route'){
    _closeRouteUiForNonRouteTab();
    return;
  }
  // V8-1-14-621: 경로검색 시트가 열리면 기존 장소 정보카드는 숨겨
  // 경로 입력 화면과 겹쳐 보이지 않게 한다. 지도/경로 상태는 유지한다.
  try{ _setRouteTabInfoCardHidden(true); closeInfoCard({keepMap:true}); }catch(e){ console.warn('[가톨릭길동무]', e); }
  _routeMode=true;
  const rs=$('sheet-route');
  if(rs){ rs.style.display=''; rs.removeAttribute('aria-hidden'); rs.classList.add('open'); }
  _syncRouteWaypointBox();
  _ensureCurrentLocationStart();
  if(_suppressNextRouteGuide){
    _suppressNextRouteGuide=false;
    _hideRouteGuide();
    return;
  }
  if(_rS&&_rE){
    _hideRouteGuide();
    return;
  }
  _showRouteGuideText(_rS?`도착 ${_getRouteGuideTarget()}를 탭하세요`:`출발지를 탭하거나 지도에서 ${_getRouteGuideTarget()}를 선택하세요`);
}

function _exitRouteMode(){
  _routeMode=false;
  try{ _setRouteTabInfoCardHidden(false); }catch(e){ console.warn('[가톨릭길동무]', e); }
  _hideRouteGuide();
}

function setMyLocAsStart(){
  _routeRegionStart=null;
  function applyCurrentStart(lat,lng,fromCache){
    if(!fromCache) _setMyLoc(lat,lng);
    else { _myLat=lat; _myLng=lng; }
    _clearRouteTmpMarkers();
    if(_mode==='shrine'&&_rS&&_rS.idx>=0&&_markers[_rS.idx]) _markers[_rS.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rS.idx].shrine),false));
    _routeStartMarkerExplicitCurrent=true;
    _rS={idx:-1,name:'현재 위치',lat:lat,lng:lng,isImplicitCurrentLocation:false,showStartMarker:true};
    _setRouteLabel('start','현위치');
    _refreshRouteTmpMarkers();
    if(_rE) _updateSearchBtn();
    else {
      _showRouteGuideText(`도착 ${_getRouteGuideTarget()}를 탭하세요`);
    }
  }
  const usedCache=_useStoredLocationIfAny(applyCurrentStart,OAI_LOCATION_CACHE_MAX_MS);
  if(!_GEO){ if(!usedCache) alert('위치 정보를 지원하지 않습니다.'); return; }
  _refreshFreshLocationThen(function(lat,lng){ applyCurrentStart(lat,lng,false); },function(){ if(!usedCache) alert('위치를 가져올 수 없습니다.'); });
}

function _routeWaypointElementId(prefix, index, suffix){
  return prefix + (index===1 ? '' : index) + suffix;
}
function _syncRouteWaypointBoxes(){
  const stack=$('rs-top') ? $('rs-top').querySelector('.rs-route-stack') : document.querySelector('.rs-route-stack');
  const sheet=$('sheet-route');
  const routeWaypoints=_getRouteWaypoints();
  const resultShowing=!!(_polyline || ($('rs-result') && $('rs-result').style.display !== 'none'));
  const foldWide=_isMapSplitWideLayout();
  const slotStates=OAI_ROUTE_WAYPOINT_CONFIGS.map(function(cfg,index){
    const point=_getRoutePointByRole(cfg.role);
    const has=!!(point&&point.lat&&point.lng);
    const enabled=!!_getRouteWaypointEnabledByRole(cfg.role);
    return {
      cfg:cfg,
      index:index+1,
      has:has,
      enabled:enabled,
      // V8-1-14-679: Fold wide에서도 빈 경유지 1~5를 강제로 펼치지 않는다.
      // 처음에는 출발지·도착지만 보이고, 사용자가 추가한 경유지는 모두 동시에 유지한다.
      visible:resultShowing ? has : !!(enabled || has)
    };
  });
  const summaryVisible=!!(!foldWide && resultShowing && routeWaypoints.length);
  const shouldScrollForMultiWaypoint=!!(!foldWide && !resultShowing && slotStates.some(function(slot){ return slot.index>=2 && slot.visible; }));
  const summaryBox=$('rs-waypoints-summary-box');
  const summaryLbl=$('rs-waypoints-summary-lbl');
  if(stack){
    slotStates.forEach(function(slot){
      stack.classList.toggle(slot.index===1?'has-waypoint':'has-waypoint'+slot.index, !summaryVisible && slot.visible);
    });
    stack.classList.toggle('has-waypoint-summary', summaryVisible);
    stack.classList.toggle('route-result-showing', resultShowing);
  }
  if(sheet){
    sheet.classList.toggle('route-waypoint-scroll', shouldScrollForMultiWaypoint);
    sheet.classList.toggle('route-result-showing', resultShowing);
  }
  if(summaryBox){
    summaryBox.style.display=summaryVisible?'flex':'none';
    if(summaryVisible){
      const summaryText='경유지 '+routeWaypoints.length+'곳 · '+routeWaypoints.map(function(p,idx){
        return (idx+1)+'. '+((p&&p.name)||('경유지'+(idx+1)));
      }).join(' → ');
      if(summaryLbl) summaryLbl.textContent=summaryText;
      summaryBox.setAttribute('title', summaryText);
    }else{
      if(summaryLbl) summaryLbl.textContent='경유지 없음';
      summaryBox.removeAttribute('title');
    }
  }
  slotStates.forEach(function(slot){
    const box=$(_routeWaypointElementId('rs-waypoint',slot.index,'-box'));
    const tools=$(_routeWaypointElementId('rs-waypoint',slot.index,'-end-tools'));
    const swap=$(_routeWaypointElementId('rs-swap-waypoint',slot.index,'-end-btn'));
    const clear=$(_routeWaypointElementId('rs-waypoint',slot.index,'-x'));
    const showBox=!summaryVisible && slot.visible;
    const showTools=!resultShowing && slot.visible;
    if(box) box.style.display=showBox?'flex':'none';
    if(tools) tools.style.display=showTools?'flex':'none';
    if(swap) swap.style.display=showTools?'flex':'none';
    if(clear){
      const showClear=showBox;
      clear.style.display=showClear?'inline-flex':'none';
    }
  });
  const add=$('rs-add-waypoint-btn');
  const nextWaypointRole=(!resultShowing ? _nextAvailableWaypointRole() : null);
  if(add){
    add.style.display=nextWaypointRole?'inline-flex':'none';
    add.dataset.nextWaypointRole=nextWaypointRole || '';
    add.setAttribute('aria-label', nextWaypointRole ? ('경유지'+_routeWaypointIndex(nextWaypointRole)+' 추가') : '경유지 최대 5곳');
  }
  const tools0=$('rs-start-waypoint-tools');
  const swap0=$('rs-swap-btn');
  if(tools0) tools0.style.display=resultShowing?'none':'block';
  if(swap0) swap0.style.display=resultShowing?'none':'flex';
}

function _ensureRouteWaypointBox(role){
  role = role || _nextAvailableWaypointRole() || 'waypoint';
  _setRouteWaypointEnabledByRole(role,true);
  _setRouteLabel(role, _getRoutePointByRole(role) ? (_getRoutePointByRole(role).name||('경유지'+_routeWaypointIndex(role))) : '');
  _refreshRouteTmpMarkers();
  if(!_getRoutePointByRole(role)) _showRouteGuideText('지도에서 경유지'+_routeWaypointIndex(role)+' 마커를 선택하거나 경유지 박스를 눌러 검색하세요');
}
function _beginWaypointAddMode(role){
  role = role || _nextAvailableWaypointRole();
  if(!role){ _showRouteGuideText('경유지는 최대 '+OAI_MAX_ROUTE_WAYPOINTS+'곳까지 추가할 수 있습니다.'); return; }
  _ensureRouteWaypointBox(role);
  if(_polyline) _clearRouteResultOnly();
  else _restoreRouteSelectionMarkersAfterReset();
  _refreshRouteTmpMarkers();
  _showRouteGuideText('지도에서 경유지'+_routeWaypointIndex(role)+'를 선택하거나 경유지 박스를 눌러 검색하세요');
}
function _syncRouteWaypointBox(){
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const point=_getRoutePointByRole(cfg.role);
    window[cfg.enabledKey]=!!(window[cfg.enabledKey] || (point&&point.lat&&point.lng));
  });
  _syncRouteWaypointBoxes();
}
function _setRouteLabel(role,name){
  const el=$(`rs-${role}-lbl`);
  if(!el) return;
  const rawName = name || '';
  const emptyText = role==='start' ? '출발지를 선택하세요' : (_isRouteWaypointRole(role) ? ('경유지'+_routeWaypointIndex(role)+'을 선택하세요') : '도착지를 선택하세요');
  el.textContent = rawName || emptyText;
  el.className='rs-lbl'+(rawName?' filled':' empty');
  if(role==='start' && $('rs-start-x')) $('rs-start-x').style.display=name?'inline-flex':'none';
  if(role==='end' && $('rs-end-x')) $('rs-end-x').style.display=name?'inline-flex':'none';
  const dragBtn=$('rs-'+role+'-drag');
  if(dragBtn){
    const point=_getRoutePointByRole(role);
    const ready=!!(point&&point.lat&&point.lng);
    dragBtn.style.display=ready?'inline-flex':'none';
    dragBtn.disabled=!ready;
  }
  if(_isRouteWaypointRole(role)){
    const clearBtn=$(_routeWaypointElementId('rs-waypoint',_routeWaypointIndex(role),'-x'));
    if(clearBtn) clearBtn.style.display=(_getRouteWaypointEnabledByRole(role) || rawName)?'inline-flex':'none';
    _setRouteWaypointEnabledByRole(role, !!(_getRouteWaypointEnabledByRole(role) || rawName));
  }
  _updateSearchBtn();
}

function _updateSearchBtn(){
  const btn=$('rs-search-btn');
  if(!btn) return;
  const filled=!!(_rS&&_rS.lat&&_rS.lng&&_rE&&_rE.lat&&_rE.lng);
  /* V8-1-14-621: 경로검색 버튼은 출발/도착창 아래에서 항상 보이고,
     출발·도착이 모두 채워진 뒤에만 활성화한다. */
  btn.style.display='flex';
  btn.disabled=!filled;
  btn.classList.toggle('ready', filled);
  btn.classList.toggle('disabled', !filled);
  btn.setAttribute('aria-disabled', filled?'false':'true');
}

function _dropEmptyWaypointInputsForRouteResult(){
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const point=_getRoutePointByRole(cfg.role);
    if(!(point&&point.lat&&point.lng)) window[cfg.enabledKey]=false;
  });
  _syncRouteWaypointBoxes();
}

function doSearchRoute(){ document.activeElement&&document.activeElement.blur();
  if(!(_rS&&_rS.lat&&_rS.lng&&_rE&&_rE.lat&&_rE.lng)){
    _showRouteGuideText('출발지와 도착지를 먼저 선택하세요');
    _updateSearchBtn();
    return;
  }
  if(_rS && (_rS.name === '현재 위치' || _rS.name === '현위치')) _setImplicitCurrentLocationStartLabelVisible(true);
  setTimeout(function(){ try{ _calcRoute(); }catch(e){ console.warn('[가톨릭길동무]', e); } }, OAI_ROUTE_VISUAL_DELAY_MS);
}

function _routePointName(point){
  return point && point.name ? point.name : '';
}
function _syncRoutePointLabels(){
  _setRouteLabel('start', _routePointName(_rS));
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    _setRouteLabel(cfg.role, _routePointName(_getRoutePointByRole(cfg.role)));
  });
  _setRouteLabel('end', _routePointName(_rE));
  _syncRouteWaypointBox();
}
function _repaintRoutePointMarkers(){
  try{
    _clearRouteResultOnly();
    _clearRouteTmpMarkers();
    _restoreRouteSelectionMarkersAfterReset();
    if(_mode==='shrine'){
      if(_rS && _shouldShowRouteStartMarker() && _rS.idx>=0 && _markers[_rS.idx]){
        _markers[_rS.idx].marker.setImage(_mkrImgRoute('#ff0000','출'));
        _setRouteMarkerZ(_rS.idx,'start');
      }
      OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
        const point=_getRoutePointByRole(cfg.role);
        if(point && point.idx>=0 && _markers[point.idx]){
          _markers[point.idx].marker.setImage(_mkrImgRoute(_routeWaypointColor(cfg.role),_routeWaypointMarkerText(cfg.role)));
          _setRouteMarkerZ(point.idx,cfg.role);
        }
      });
      if(_rE && _rE.idx>=0 && _markers[_rE.idx]){
        _markers[_rE.idx].marker.setImage(_mkrImgRoute(_typeColor(_markers[_rE.idx].shrine.type),'도'));
        _setRouteMarkerZ(_rE.idx,'end');
      }
    }
    _refreshRouteTmpMarkers();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function _routePointReady(point){
  return !!(point && point.lat && point.lng);
}
function _pendingRouteWaypointRole(){
  for(const cfg of OAI_ROUTE_WAYPOINT_CONFIGS){
    const point=_getRoutePointByRole(cfg.role);
    if(_getRouteWaypointEnabledByRole(cfg.role) && !(point&&point.lat&&point.lng)) return cfg.role;
  }
  return null;
}
function _swapRouteObjects(a,b){
  const validA=(a==='start'||a==='end'||_isRouteWaypointRole(a));
  const validB=(b==='start'||b==='end'||_isRouteWaypointRole(b));
  if(!validA || !validB) return;
  const av = _getRoutePointByRole(a);
  const bv = _getRoutePointByRole(b);
  if((_isRouteWaypointRole(a) || _isRouteWaypointRole(b)) && !(_routePointReady(av) && _routePointReady(bv))) return;
  if(_isRouteWaypointRole(a)) _setRouteWaypointEnabledByRole(a,true,{deferSync:true});
  if(_isRouteWaypointRole(b)) _setRouteWaypointEnabledByRole(b,true,{deferSync:true});
  _setRoutePointByRole(a,bv);
  _setRoutePointByRole(b,av);
  _routeStartMarkerExplicitCurrent=!!(_rS && _rS.showStartMarker === true);
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const point=_getRoutePointByRole(cfg.role);
    if(!(point&&point.lat&&point.lng) && !_getRouteWaypointEnabledByRole(cfg.role)) window[cfg.enabledKey]=false;
  });
  _syncRoutePointLabels();
  _repaintRoutePointMarkers();
  if(_rS&&_rE) _updateSearchBtn();
}
function swapRoute(){
  if(_routeWaypointSlotOccupied('waypoint')) _swapRouteObjects('start','waypoint');
  else _swapRouteObjects('start','end');
}
function _swapRouteWaypointWithNext(index){
  const current=_getRouteWaypointConfigByIndex(index);
  if(!current || !_routeWaypointSlotOccupied(current.role)) return;
  const next=_getRouteWaypointConfigByIndex(index+1);
  if(next && _routeWaypointSlotOccupied(next.role)) _swapRouteObjects(current.role,next.role);
  else _swapRouteObjects(current.role,'end');
}
function swapRouteWaypointEnd(){ _swapRouteWaypointWithNext(1); }
function swapRouteWaypoint2End(){ _swapRouteWaypointWithNext(2); }
function swapRouteWaypoint3End(){ _swapRouteWaypointWithNext(3); }
function swapRouteWaypoint4End(){ _swapRouteWaypointWithNext(4); }
function swapRouteWaypoint5End(){ _swapRouteWaypointWithNext(5); }

// V8-1-14-693: 출발/경유/도착 지점을 손잡이로 직접 드래그해 순서를 변경한다.
let _routeDragState=null;
function _routeReadyRoles(){
  const roles=[];
  if(_routePointReady(_rS)) roles.push('start');
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    if(_routePointReady(_getRoutePointByRole(cfg.role))) roles.push(cfg.role);
  });
  if(_routePointReady(_rE)) roles.push('end');
  return roles;
}
function _routeBoxByRole(role){
  if(role==='start') return $('rs-start-box');
  if(role==='end') return $('rs-end-box');
  if(_isRouteWaypointRole(role)) return $(_routeWaypointElementId('rs-waypoint',_routeWaypointIndex(role),'-box'));
  return null;
}
function _clearRouteDragClasses(){
  document.querySelectorAll('.rs-drag-source,.rs-drag-over').forEach(function(el){
    el.classList.remove('rs-drag-source','rs-drag-over');
  });
  document.querySelectorAll('.rs-drag-handle.is-dragging').forEach(function(el){ el.classList.remove('is-dragging'); });
}
function _routeDragTargetAt(clientY){
  const roles=_routeReadyRoles();
  let best=null, bestDist=Infinity;
  roles.forEach(function(role){
    const box=_routeBoxByRole(role);
    if(!box || box.style.display==='none') return;
    const r=box.getBoundingClientRect();
    if(!r.height) return;
    const d=Math.abs(clientY-(r.top+r.height/2));
    if(d<bestDist){ bestDist=d; best=role; }
  });
  return best;
}
function _reorderRouteReadyPoints(sourceRole,targetRole){
  if(!sourceRole || !targetRole || sourceRole===targetRole) return false;
  const roles=_routeReadyRoles();
  const from=roles.indexOf(sourceRole), to=roles.indexOf(targetRole);
  if(from<0 || to<0) return false;
  const points=roles.map(function(role){ return _getRoutePointByRole(role); });
  const moved=points.splice(from,1)[0];
  points.splice(to,0,moved);
  roles.forEach(function(role,index){ _setRoutePointByRole(role,points[index]); });
  _routeStartMarkerExplicitCurrent=!!(_rS && _rS.showStartMarker===true);
  _syncRoutePointLabels();
  _repaintRoutePointMarkers();
  _updateSearchBtn();
  _showRouteGuideText('경로 순서를 변경했습니다');
  return true;
}
function _bindRouteDragHandles(){
  document.querySelectorAll('.rs-drag-handle[data-route-drag]').forEach(function(handle){
    if(handle.dataset.routeDragBound==='1') return;
    handle.dataset.routeDragBound='1';
    handle.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); });
    handle.addEventListener('pointerdown',function(e){
      const role=handle.dataset.routeDrag;
      if(!_routePointReady(_getRoutePointByRole(role))) return;
      e.preventDefault(); e.stopPropagation();
      try{ handle.setPointerCapture(e.pointerId); }catch(_e){}
      _routeDragState={pointerId:e.pointerId,sourceRole:role,targetRole:role,startY:e.clientY,dragging:false,handle:handle};
    });
    handle.addEventListener('pointermove',function(e){
      const st=_routeDragState;
      if(!st || st.pointerId!==e.pointerId || st.handle!==handle) return;
      e.preventDefault(); e.stopPropagation();
      if(!st.dragging && Math.abs(e.clientY-st.startY)>=5){
        st.dragging=true;
        handle.classList.add('is-dragging');
        const src=_routeBoxByRole(st.sourceRole); if(src) src.classList.add('rs-drag-source');
        try{ if(navigator.vibrate) navigator.vibrate(12); }catch(_e){}
      }
      if(!st.dragging) return;
      const target=_routeDragTargetAt(e.clientY) || st.sourceRole;
      st.targetRole=target;
      document.querySelectorAll('.rs-drag-over').forEach(function(el){el.classList.remove('rs-drag-over');});
      const box=_routeBoxByRole(target); if(box) box.classList.add('rs-drag-over');
    });
    const finish=function(e){
      const st=_routeDragState;
      if(!st || st.pointerId!==e.pointerId || st.handle!==handle) return;
      e.preventDefault(); e.stopPropagation();
      try{ handle.releasePointerCapture(e.pointerId); }catch(_e){}
      _routeDragState=null;
      _clearRouteDragClasses();
      if(st.dragging) _reorderRouteReadyPoints(st.sourceRole,st.targetRole);
    };
    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);
  });
}

function _setRouteResultTipVisible(visible){
  const tip=$('rs-result-tip');
  if(tip) tip.style.display=visible?'block':'none';
}

function _isRouteResultShowing(){
  const result=$('rs-result');
  return !!(_polyline || (result && result.style.display !== 'none'));
}

function _returnRouteResultToInputWindow(){
  if(!_isRouteResultShowing()) return false;
  _clearRouteResultOnly();
  _syncRoutePointLabels();
  _updateSearchBtn();
  const sheet=$('sheet-route');
  if(sheet){ sheet.style.display=''; sheet.classList.add('open'); }
  _showRouteGuideText('수정할 출발지·경유지·도착지를 선택한 뒤 다시 경로검색을 누르세요');
  return true;
}

function _clearRouteResultOnly(){
  try{
    _hide($('rs-result'));
    _setRouteResultTipVisible(false);
    const hint=$('rs-hint'); if(hint) hint.style.display='block';
    const sBtn=$('rs-search-btn'); if(sBtn) sBtn.style.display='none';
    const sheet=$('sheet-route'); if(sheet) sheet.classList.remove('route-result-showing');
    const stack=$('rs-top') ? $('rs-top').querySelector('.rs-route-stack') : document.querySelector('.rs-route-stack'); if(stack) stack.classList.remove('route-result-showing');
    if(_polyline){ _polyline.setMap(null); _polyline=null; }
    _showJukrimgulParkingMkr(false);
    _syncRouteWaypointBox();
    _restoreRouteSelectionMarkersAfterReset();
    _updateSearchBtn();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}
function clearRoute(role, opts){
  opts = opts || {};
  const keepWaypointBox = !!(opts.keepWaypointBox && _isRouteWaypointRole(role));
  if(role==='start'&&_rS){
    if(_mode==='shrine'&&_rS.idx>=0&&_markers[_rS.idx]) _markers[_rS.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rS.idx].shrine),false));
    _rS=null;
    _routeStartMarkerExplicitCurrent=false;
    _routeRegionStart=null;
    _setRouteLabel('start','');
    _clearRouteResultOnly();
    _refreshRouteTmpMarkers();
    if(_rE) _showRouteGuideText(`출발 ${_getRouteGuideTarget()}를 탭하세요`);
    else _showRouteGuideText(`출발지를 탭하거나 지도에서 ${_getRouteGuideTarget()}를 선택하세요`);
    return;
  }
  if(_isRouteWaypointRole(role) && (_getRoutePointByRole(role)||_getRouteWaypointEnabledByRole(role))){
    const oldPoint=_getRoutePointByRole(role);
    if(_mode==='shrine'&&oldPoint&&oldPoint.idx>=0&&_markers[oldPoint.idx]) _markers[oldPoint.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[oldPoint.idx].shrine),false));
    if(keepWaypointBox){
      // 경유지 마커 취소 확인창에서는 해당 입력창을 유지한 채 선택값만 비운다.
      _setRoutePointByRole(role, null);
      _setRouteWaypointEnabledByRole(role, true, {deferSync:true});
    }else{
      const removedIndex=_routeWaypointIndex(role);
      for(let index=removedIndex; index<OAI_MAX_ROUTE_WAYPOINTS; index++){
        const currentCfg=_getRouteWaypointConfigByIndex(index);
        const nextCfg=_getRouteWaypointConfigByIndex(index+1);
        const nextPoint=nextCfg ? _getRoutePointByRole(nextCfg.role) : null;
        const nextEnabled=nextCfg ? _getRouteWaypointEnabledByRole(nextCfg.role) : false;
        _setRoutePointByRole(currentCfg.role,nextPoint);
        window[currentCfg.enabledKey]=!!(nextEnabled || (nextPoint&&nextPoint.lat&&nextPoint.lng));
      }
      const lastCfg=_getRouteWaypointConfigByIndex(OAI_MAX_ROUTE_WAYPOINTS);
      _setRoutePointByRole(lastCfg.role,null);
      window[lastCfg.enabledKey]=false;
    }
    OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
      _setRouteLabel(cfg.role,_routePointName(_getRoutePointByRole(cfg.role)));
    });
    _clearRouteResultOnly();
    _refreshRouteTmpMarkers();
    _syncRouteWaypointBox();
    _repaintRoutePointMarkers();
    if(keepWaypointBox){
      _showRouteGuideText('취소한 경유지 창은 유지했습니다. 경유지를 다시 선택하세요');
    }
    if(_rS&&_rE) _updateSearchBtn();
    return;
  }
  if(role==='end'&&_rE){
    if(_mode==='shrine'&&_rE.idx>=0&&_markers[_rE.idx]) _markers[_rE.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rE.idx].shrine),false));
    _rE=null;
    _setRouteLabel('end','');
    _clearRouteResultOnly();
    _refreshRouteTmpMarkers();
    if(_rS) _showRouteGuideText(`도착 ${_getRouteGuideTarget()}를 탭하세요`);
    else _showRouteGuideText(`출발지를 탭하거나 지도에서 ${_getRouteGuideTarget()}를 선택하세요`);
  }
}

function resetRoute(opts){
  opts = opts || {};
  const fromButton = !!opts.fromButton;
  const fresh = !!opts.fresh;
  if(fresh) _routeRegionStart=null;
  const destItem = (!fresh && _rE) ? {lat:_rE.lat, lng:_rE.lng, idx:_rE.idx} : null;
  const regionStart = (!fresh && _routeRegionStart && _routeRegionStart.lat) ? Object.assign({}, _routeRegionStart) : null;

  if(_mode==='shrine'){
    if(_rS&&_rS.idx>=0&&_markers[_rS.idx]) _markers[_rS.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rS.idx].shrine),false));
    OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
      const point=_getRoutePointByRole(cfg.role);
      if(point&&point.idx>=0&&_markers[point.idx]) _markers[point.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[point.idx].shrine),false));
    });
    if(_rE&&_rE.idx>=0&&_markers[_rE.idx]) _markers[_rE.idx].marker.setImage(_mkrImg(_shrineMarkerColor(_markers[_rE.idx].shrine),false));
  }
  _rS=_rE=null;
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    _setRoutePointByRole(cfg.role,null);
    window[cfg.enabledKey]=false;
  });
  _routeStartMarkerExplicitCurrent=false;
  _setRouteLabel('start','');
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){ _setRouteLabel(cfg.role,''); });
  _setRouteLabel('end','');
  if(_polyline){_polyline.setMap(null);_polyline=null;}
  _hide($('rs-result'));
  _setRouteResultTipVisible(false);
  // V8-1-14-679: 다시선택에서는 경로선과 결과판을 먼저 모두 닫은 뒤 경유지 UI를 한 번만 동기화한다.
  // _polyline이나 결과판이 남아 있는 상태에서 동기화하면 +경유지 버튼이 결과 화면용 숨김 상태로 고정된다.
  _syncRouteWaypointBoxes();
  $('rs-hint').style.display='block';
  const sBtn=$('rs-search-btn');
  if(sBtn) sBtn.style.display='flex';
  if(typeof _updateSearchBtn==='function') _updateSearchBtn();
  _clearRouteTmpMarkers();
  _showJukrimgulParkingMkr(false);
  _hideRouteGuide();
  _restoreRouteSelectionMarkersAfterReset({parishRouteReselect:fromButton});

  if(fromButton){
    if(_activeTab!=='route') openTab('route');
    const rs=$('sheet-route');
    if(rs){ rs.style.display=''; rs.classList.add('open'); }
    closeInfoCard({keepMap:true});
    if(regionStart){
      _routeRegionStart=Object.assign({}, regionStart);
      _regionLat=regionStart.lat;
      _regionLng=regionStart.lng;
      _regionPlaceName=regionStart.placeName || regionStart.name || _regionPlaceName;
      _regionName=regionStart.placeName || regionStart.name || _regionName;
      _showRegionPlaceMarker(_regionLat,_regionLng,_regionPlaceName||_regionName||'검색지');
    }
    _ensureCurrentLocationStart();
    try{
      if(_mode==='shrine') _clearShrineMarkerSel();
      else if(_paSelMkr){ try{ _paSelMkr.setMap(null); }catch(e){ console.warn("[가톨릭길동무]", e); } _paSelMkr=null; }
    }catch(e){ console.warn("[가톨릭길동무]", e); }
    if(typeof _updateSearchBtn==='function') _updateSearchBtn();
    return;
  }

  if(destItem && destItem.lat && _map){
    try{
      const _items=_getCurrentItems();
      const _idx=(typeof destItem.idx==='number' && destItem.idx>=0) ? destItem.idx : _items.findIndex(p=>Number(p.lat)===Number(destItem.lat) && Number(p.lng)===Number(destItem.lng));
      const _item=_idx>=0 ? _items[_idx] : null;
      if(_item){
        if(_mode==='shrine') _selectShrineMarker(_idx);
        else if(_mode==='parish') _selectParishMarker(_item);
        else _selectRetreatMarker(_item);
        _showInfoCard(_item, _idx);
      }
    }catch(e){ console.warn("[가톨릭길동무]", e); }
  }
}

function _routePointMatchesItem(point, idx, item){
  if(!point) return false;
  if(typeof point.idx==='number' && point.idx>=0 && point.idx===idx) return true;
  if(item && point.lat && point.lng){
    return Number(point.lat)===Number(item.lat) && Number(point.lng)===Number(item.lng);
  }
  return false;
}
function _selectRouteItem(idx){
  const items=_getCurrentItems();
  const s=items[idx];
  if(!s||!s.lat||!s.lng) return;
  // V8-1-14-679: 사용자가 길찾기 카드를 접어 둔 상태에서 지도 마커를 선택하면
  // 선택 결과를 바로 확인할 수 있도록 길찾기 패널을 다시 연다.
  try{
    const routeSheet=$('sheet-route');
    if(routeSheet){
      routeSheet.hidden=false;
      routeSheet.style.display='';
      routeSheet.classList.add('open');
      routeSheet.setAttribute('aria-hidden','false');
    }
    _oaiMapPanelCollapsed=false;
    _syncMapPanelUI('route-marker-selection');
  }catch(e){console.warn('[가톨릭길동무]',e);}
  if(_routePointMatchesItem(_rS,idx,s)){
    _openRoutePointCancelChoice('start');
    return;
  }
  for(const cfg of OAI_ROUTE_WAYPOINT_CONFIGS){
    if(_routePointMatchesItem(_getRoutePointByRole(cfg.role),idx,s)){
      _openRoutePointCancelChoice(cfg.role);
      return;
    }
  }
  if(_routePointMatchesItem(_rE,idx,s)){
    _openRoutePointCancelChoice('end');
    return;
  }
  const hasStart=_routeHasVisibleStart();
  const hasEnd=!!(_rE&&_rE.lat&&_rE.lng);
  if(!hasStart){
    _setRoutePointFromItem('start',s,idx);
    if(!_activeTab||_activeTab!=='route') openTab('route');
    if(hasEnd) _updateSearchBtn();
    return;
  }
  const pendingWaypointRole = _pendingRouteWaypointRole();
  if(pendingWaypointRole){
    _setRoutePointFromItem(pendingWaypointRole,s,idx);
  }else if(!hasEnd){
    _setRoutePointFromItem('end',s,idx);
  }else{
    _showRouteGuideText('경유지를 추가하려면 + 경유지를 먼저 누르세요');
    return;
  }
  if(!_activeTab||_activeTab!=='route') openTab('route');
}

function _hideParishMarkersForRouteDisplay(){
  if(_mode!=='parish') return;
  // 길찾기 결과 표시 중에는 내주변 성당 마커를 삭제하지 않고 잠시 숨긴다.
  // 다시선택에서 동일 객체를 복원해야 하므로 완전 삭제는 탭/카테고리 전환에서만 수행한다.
  try{
    if(_isParishNearbyMapMode()) _setParishNearbyMarkersMap(null,true);
    else _clearParishNearbyMarkers();
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{ _hideDioOverlays(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  try{
    Object.keys(_dioMkrs||{}).forEach(function(code){
      (_dioMkrs[code]||[]).forEach(function(mk){
        try{ _setMarkerMapIfChanged(mk,null); }catch(e){ console.warn('[가톨릭길동무]', e); }
      });
    });
    if(_parishIdleListener){
      try{ kakao.maps.event.removeListener(_parishIdleListener); }catch(e){ console.warn('[가톨릭길동무]', e); }
      _parishIdleListener=null;
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _hideRetreatMarkersForRouteDisplay(){
  if(_mode!=='retreat') return;
  try{
    (_retreatMarkers||[]).forEach(function(o){
      if(!o || !o.marker) return;
      _setMarkerMapIfChanged(o.marker,null);
    });
  }catch(e){ console.warn('[가톨릭길동무]', e); }
}

function _hideCategoryMarkersForRouteDisplay(){
  if(_mode==='parish') _hideParishMarkersForRouteDisplay();
  else if(_mode==='retreat') _hideRetreatMarkersForRouteDisplay();
}

async function _calcRoute(){
  if(!_rS||!_rE) return;
  _hideRouteGuide();
  $('rs-km').textContent='…';
  $('rs-time').textContent='…';
  $('rs-result').style.display='block';
  _setRouteResultTipVisible(true);
  $('rs-hint').style.display='none';
  _dropEmptyWaypointInputsForRouteResult();
  const sBtn=$('rs-search-btn');
  if(sBtn) sBtn.style.display='none';
  if(_polyline){_polyline.setMap(null);_polyline=null;}
  const isJuk = _mode==='shrine' && _rE.idx === JUKRIMGUL_IDX && JUKRIMGUL_IDX >= 0;
  const navDest = isJuk ? JUKRIMGUL_PARKING : _rE;
  _showJukrimgulParkingMkr(isJuk);
  const note=$('rs-note');
  function setRouteNote(txt, html){
    if(!note) return;
    if(html) note.innerHTML=txt; else note.textContent=txt;
    note.style.display=txt?'block':'none';
  }
  if(isJuk){
    setRouteNote('⚠️ <b>죽림굴주차장</b>까지 경로 안내 · 자동차가 올라가지 못하는 구간이므로 주차장에서 도보로 이동하세요.', true);
  } else {
    setRouteNote('', false);
  }

  const waypoints = _getRouteWaypoints();
  _drawLine(_rS, navDest, null, {fit:false, waypoints:waypoints});

  async function fetchLeg(a,b){
    const res=await _kakaoDirectionsFetch(`${a.lng},${a.lat}`, `${b.lng},${b.lat}`);
    if(!res.ok) throw new Error(res.status);
    const data=await res.json();
    const route=data.routes?.[0];
    if(!route||route.result_code!==0) throw new Error('no route');
    const path=[];
    for(const sec of route.sections||[])
      for(const road of sec.roads||[]){
        const vx=road.vertexes;
        for(let i=0;i<vx.length-1;i+=2) path.push(new _LL(vx[i+1],vx[i]));
      }
    return { distance:route.summary.distance, duration:route.summary.duration, path:path };
  }

  try{
    const routePoints=[_rS].concat(waypoints,[navDest]);
    if(waypoints.length){
      let distance=0, duration=0, path=[];
      for(let i=0;i<routePoints.length-1;i++){
        const leg=await fetchLeg(routePoints[i], routePoints[i+1]);
        distance+=(leg.distance||0);
        duration+=(leg.duration||0);
        path=path.concat(leg.path||[]);
      }
      $('rs-km').textContent=(distance/1000).toFixed(1);
      $('rs-time').textContent=_fmtTime(duration);
      _drawLine(_rS, navDest, path.length>1?path:null, {waypoints:waypoints});
      if(!isJuk) setRouteNote('', false);
      return;
    }
    const leg=await fetchLeg(_rS, navDest);
    $('rs-km').textContent=(leg.distance/1000).toFixed(1);
    $('rs-time').textContent=_fmtTime(leg.duration);
    _drawLine(_rS, navDest, leg.path.length>1?leg.path:null);
    if(!isJuk) setRouteNote('', false);
  } catch(e){
    const routePoints=[_rS].concat(waypoints,[navDest]);
    let d=0;
    for(let i=0;i<routePoints.length-1;i++){
      d += calcDist(routePoints[i].lat,routePoints[i].lng,routePoints[i+1].lat,routePoints[i+1].lng);
    }
    d *= 1.4;
    $('rs-km').textContent=d.toFixed(1);
    $('rs-time').textContent=_fmtTime(d/70*3600);
    if(!isJuk) setRouteNote('* 직선거리 기반 추정값', false);
    _drawLine(_rS, navDest, null, {fit:true, waypoints:waypoints});
  }
}

function _isSelectedRouteItemIndex(index){
  if(_rS&&_rS.idx===index) return true;
  if(_rE&&_rE.idx===index) return true;
  return OAI_ROUTE_WAYPOINT_CONFIGS.some(function(cfg){
    const point=_getRoutePointByRole(cfg.role);
    return !!(point&&point.idx===index);
  });
}

function _drawLine(s1,s2,path,opts){
  opts = opts || {};
  const waypoints = Array.isArray(opts.waypoints)
    ? opts.waypoints.filter(p=>p&&p.lat&&p.lng)
    : (opts.via && opts.via.lat && opts.via.lng ? [opts.via] : []);
  _hideRouteGuide();
  if(_polyline) _polyline.setMap(null);
  _clearRouteTmpMarkers();
  const pts=path||([new _LL(s1.lat,s1.lng)].concat(waypoints.map(p=>new _LL(p.lat,p.lng)),[new _LL(s2.lat,s2.lng)]));
  _polyline=new _PL({path:pts,
  strokeWeight:path?6:3,strokeColor:path?'#1a73e8':'#b8965a',
  strokeOpacity:path?0.88:0.7,strokeStyle:path?'solid':'dashed'});
  _polyline.setMap(_map);
  _syncRouteWaypointBox();
  _refreshRouteTmpMarkers();
  _hideCategoryMarkersForRouteDisplay();

  if(path){
  _markers.forEach((m,i)=>{
   if(!m) return;
   const isRoute=_isSelectedRouteItemIndex(i);
   m.marker.setMap(isRoute?_map:null);
  });
  if(_mode==='parish'){
    _hideDioOverlays();
    if(_activeDio) _hideParishDioMkrs(_activeDio);
  } else if(_mode==='retreat'){
    _retreatMarkers.forEach(o=>{
      const isRoute=_isSelectedRouteItemIndex(o.index);
      o.marker.setMap(isRoute?_map:null);
    });
  }
  }

  const bounds=new _LB();
  pts.forEach(p=>bounds.extend(p));
  if(s1 && s1.lat && s1.lng) bounds.extend(new _LL(s1.lat,s1.lng));
  waypoints.forEach(function(wp){ bounds.extend(new _LL(wp.lat,wp.lng)); });
  if(s2 && s2.lat && s2.lng) bounds.extend(new _LL(s2.lat,s2.lng));
  if(_startTmpMkr) bounds.extend(new _LL(s1.lat,s1.lng));
  OAI_ROUTE_WAYPOINT_CONFIGS.forEach(function(cfg){
    const marker=window[cfg.tmpMarkerKey];
    const point=_getRoutePointByRole(cfg.role);
    if(marker&&point) bounds.extend(new _LL(point.lat,point.lng));
  });
  if(_endTmpMkr) bounds.extend(new _LL(s2.lat,s2.lng));
  if(opts.fit !== false){
    if(typeof _fitRouteBounds==='function') _fitRouteBounds(bounds, {repeat:false});
    else { try{_map.setBounds(bounds,80,52,190,52);}catch(e){ console.warn("[가톨릭길동무]", e); } }
  }
}

function _showJukrimgulParkingMkr(show){
  if(_jukrimgulParkMkr){ _jukrimgulParkMkr.setMap(null); _jukrimgulParkMkr=null; }
  if(!show||!_map) return;
  const svg=`<svg ${_NS} width="34" height="44" viewBox="0 0 34 44">
  <ellipse cx="17" cy="42" rx="6" ry="2.5" fill="rgba(0,0,0,.2)"/>
  <path d="M17 0C9.3 0 3 6.3 3 14c0 9.5 14 28 14 28S31 23.5 31 14C31 6.3 24.7 0 17 0z" fill="#7b2fbe"/>
  <circle cx="17" cy="14" r="9" fill="white" opacity=".9"/>
  <text x="17" y="19" text-anchor="middle" font-size="12" font-weight="900" fill="#7b2fbe" font-family="sans-serif">P</text>
  </svg>`;
  _jukrimgulParkMkr = new _MM({
  position: new _LL(JUKRIMGUL_PARKING.lat, JUKRIMGUL_PARKING.lng),
  image: new kakao.maps.MarkerImage(
   'data:image/svg+xml;charset=utf-8,'+_EC(svg),
   new _SZ(34,44),{offset:new _PT(17,44)}
  ),
  title:'죽림굴주차장', zIndex:15
  });
  _jukrimgulParkMkr.setMap(_map);
  if(JUKRIMGUL_IDX>=0 && _markers[JUKRIMGUL_IDX])
  _setMarkerMapIfChanged(_markers[JUKRIMGUL_IDX].marker,_map);
}

function _kakaoLaunch(w,a){
 if(_isMob){
  _kakaoLaunching=true;
  setTimeout(()=>{_kakaoLaunching=false;},3000);
  const f=document.createElement('iframe');
  f.style.cssText='display:none;width:0;height:0;border:0;position:fixed;';
  document.body.appendChild(f);f.src=a;
  const t=setTimeout(()=>{_kakaoLaunching=false;if(typeof oaiSmoothNavigate==='function') oaiSmoothNavigate(w,'kakao-route'); else { try{ markExternalReturnStabilize('kakao-route'); }catch(e){ console.warn('[가톨릭길동무]', e); } location.href=w; }},1500);
  window.addEventListener('blur',()=>clearTimeout(t),{once:true});
  setTimeout(()=>{if(document.body.contains(f))document.body.removeChild(f);},2000);
 } else { if(typeof oaiSmoothNavigate==='function') oaiSmoothNavigate(w,'kakao-route'); else { try{ markExternalReturnStabilize('kakao-route'); }catch(e){ console.warn('[가톨릭길동무]', e); } location.href=w; } }
}
function _kakaoRouteDisplayName(point, fallback){
  const raw = (point && (point.placeName || point.name)) || fallback || '장소';
  return String(raw || '').replace(/^📍\s*/, '').trim() || fallback || '장소';
}
function _routeLinkPointName(point, fallback){
  return _EC(_kakaoRouteDisplayName(point, fallback));
}
function _buildKakaoRouteWebLink(start, waypoints, end){
  const points=[start].concat(waypoints || [], [end]).filter(p=>p&&p.lat&&p.lng);
  if(points.length<2) return '';
  if(points.length>2){
    return 'https://map.kakao.com/link/by/car/' + points.map(function(p,i){
      return `${_routeLinkPointName(p, i===0?'출발지':(i===points.length-1?'도착지':'경유지'))},${p.lat},${p.lng}`;
    }).join('/');
  }
  const sp=_routeLinkPointName(start,'출발지');
  const ep=_routeLinkPointName(end,'도착지');
  return `https://map.kakao.com/link/from/${sp},${start.lat},${start.lng}/to/${ep},${end.lat},${end.lng}`;
}
function _launchKakaoRouteWebOnly(w){
  if(typeof oaiSmoothNavigate==='function') oaiSmoothNavigate(w,'kakao-route');
  else {
    try{ markExternalReturnStabilize('kakao-route'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    location.href=w;
  }
}
function doKakaoRoute(){
  if(!_rS||!_rE) return;
  const isJuk = _rE.idx === JUKRIMGUL_IDX && JUKRIMGUL_IDX >= 0;
  const finalDest = isJuk ? JUKRIMGUL_PARKING : _rE;
  const waypoints = _getRouteWaypoints();
  const w=_buildKakaoRouteWebLink(_rS, waypoints, finalDest);
  if(!w) return;

  if(waypoints.length){
    _launchKakaoRouteWebOnly(w);
    return;
  }

  const a=`kakaomap://route?sp=${_rS.lat},${_rS.lng}&ep=${finalDest.lat},${finalDest.lng}&by=CAR`;
  _kakaoLaunch(w,a);
}

let _smCatholicResults=[];
let _smAllResults=[];
let _smSearchSeq=0;
const OAI_ROUTE_SEARCH_RESULT_LIMIT=160;

function _setSmFilterVisible(visible){
  const bar=$('sm-filter-bar');
  if(bar) bar.style.display=visible?'flex':'none';
}
function _setSmBodyVisible(tab){
  const all=$('sm-body-all'), cat=$('sm-body'), place=$('sm-body-place');
  if(all) all.style.display=tab==='all'?'':'none';
  if(cat) cat.style.display=tab==='cat'?'':'none';
  if(place) place.style.display=tab==='place'?'':'none';
}
function _setSmPrompt(tab){
  const body=tab==='all'?$('sm-body-all'):(tab==='cat'?$('sm-body'):$('sm-body-place'));
  if(!body) return;
  const msg=tab==='all'?'성지·성당·피정의 집·일반 장소를 검색하세요':(tab==='cat'?'성지·성당·피정의 집을 검색하세요':'일반 장소명을 입력하세요');
  body.innerHTML='<div class="sm-place-loading">'+msg+'</div>';
}
function smSwitchTab(tab){
  if(tab!=='all'&&tab!=='cat'&&tab!=='place') tab='all';
  _smTab=tab;
  ['all','cat','place'].forEach(function(name){
    const btn=$('sm-tab-'+name);
    if(btn) btn.classList.toggle('active',tab===name);
  });
  const activeSmTab=$('sm-tab-'+tab);
  if(activeSmTab){
    try{ activeSmTab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); }catch(e){ console.warn('[가톨릭길동무]',e); }
  }
  _setSmFilterVisible(tab==='cat');
  _setSmBodyVisible(tab);
  const inp=$('sm-inp');
  const value=inp?inp.value.trim():'';
  if(!value) _setSmPrompt(tab);
  else if(tab==='all') _searchAllRoutePlaces(value);
  else if(tab==='cat') filterModal(value);
  else _searchKakaoPlace(value);
  oaiFocusSearchKeyboardInput('sm-inp');
}

function onSmInp(v){
  clearTimeout(_smPlaceDebounce);
  _smSearchSeq++;
  const value=String(v||'').trim();
  if(!value){ _setSmPrompt(_smTab); return; }
  const body=_smTab==='all'?$('sm-body-all'):(_smTab==='cat'?$('sm-body'):$('sm-body-place'));
  if(body) body.innerHTML='<div class="sm-place-loading">🔍 검색 중...</div>';
  _smPlaceDebounce=setTimeout(function(){
    if(_smTab==='all') _searchAllRoutePlaces(value);
    else if(_smTab==='cat') filterModal(value);
    else _searchKakaoPlace(value);
  },350);
}

function _ensureCatholicRouteSearchData(){
  return Promise.all([
    _ensureShrineDataLoaded(),
    _ensureRetreatDataLoaded(),
    _ensureAllParishDiocesesLoaded({silent:true})
  ]);
}
function _catholicRouteKindMeta(kind,item){
  if(kind==='parish') return {label:'성당',color:OAI_CATHEDRAL_CATEGORY_COLOR,priority:0};
  if(kind==='shrine') return {label:item.type||'성지',color:TC[item.type]||'#555',priority:1};
  return {label:'피정의 집',color:OAI_RETREAT_CATEGORY_COLOR,priority:2};
}
function _collectCatholicRouteResults(query, applyDioceseFilter){
  const records=[];
  function add(items,kind){
    (items||[]).forEach(function(item,index){
      if(!item||!item.lat||!item.lng) return;
      if(applyDioceseFilter&&_smDio!=='all'&&item.diocese!==_smDio) return;
      const score=_placeSearchScore(item,query);
      if(!Number.isFinite(score)) return;
      const meta=_catholicRouteKindMeta(kind,item);
      records.push({source:'catholic',sourcePriority:0,kind:kind,kindPriority:meta.priority,item:item,index:index,score:score,badge:meta.label,color:meta.color});
    });
  }
  add(PARISHES,'parish');
  add(SHRINES,'shrine');
  add(RETREATS,'retreat');
  records.sort(_comparePlaceSearchEntries);
  return records.slice(0,OAI_ROUTE_SEARCH_RESULT_LIMIT);
}
function _renderCatholicRouteResults(body,records,scope){
  if(!body) return;
  if(scope==='all') _smAllResults=records;
  else _smCatholicResults=records;
  if(!records.length){ body.innerHTML='<div class="sm-place-loading">검색 결과가 없습니다</div>'; return; }
  const c=_routeRoleColor(_smRole);
  body.innerHTML=records.map(function(record,index){
    const item=record.item;
    const sub=[item.diocese,item.addr].filter(Boolean).join(' · ');
    return `<div class="sm-item sm-route-result" data-sm-scope="${scope}" data-sm-index="${index}"><div class="sm-role" style="background:${c}">${_routeRoleShort(_smRole)}</div><div class="sm-info"><div class="sm-name">${_placeText(item.name)}</div><div class="sm-sub">${_placeText(sub)}</div></div><span class="sm-badge" style="color:${record.color};background:${record.color}18">${_placeText(record.badge)}</span></div>`;
  }).join('');
}
function _generalRouteRecord(doc,query){
  const item={name:doc.place_name||'',addr:doc.road_address_name||doc.address_name||'',diocese:''};
  return {source:'place',sourcePriority:1,kind:'place',kindPriority:3,doc:doc,item:item,name:item.name,score:_placeSearchScore(item,query),badge:'일반 장소',color:'#64748b'};
}
function _routeSearchCoreName(value){
  return _normalizePlaceSearchText(value).replace(/^천주교/,'').replace(/(주교좌)?(대)?성당$/,'').replace(/본당$/,'').replace(/피정의집$/,'').replace(/성지$/,'');
}
function _isDuplicateGeneralPlace(record,catholicRecords){
  const doc=record.doc||{};
  const lat=parseFloat(doc.y), lng=parseFloat(doc.x);
  const core=_routeSearchCoreName(record.name);
  return catholicRecords.some(function(c){
    const item=c.item||{};
    const dist=calcDist(lat,lng,parseFloat(item.lat),parseFloat(item.lng));
    if(dist<=0.06) return true;
    const cCore=_routeSearchCoreName(item.name);
    return dist<=0.25&&core&&cCore&&(core===cCore||core.includes(cCore)||cCore.includes(core));
  });
}
function _renderAllRouteResults(body,records){
  if(!body) return;
  _smAllResults=records;
  if(!records.length){ body.innerHTML='<div class="sm-place-loading">검색 결과가 없습니다</div>'; return; }
  const c=_routeRoleColor(_smRole);
  body.innerHTML=records.map(function(record,index){
    if(record.source==='place'){
      const doc=record.doc||{};
      const icon=doc.category_group_code==='MT1'?'🏪':doc.category_group_code==='SC4'?'🏫':doc.category_group_code==='HP8'?'🏥':doc.category_group_code==='PM9'?'💊':doc.category_group_code==='OL7'?'⛽':'📍';
      return `<div class="sm-place-item sm-route-result" data-sm-scope="all" data-sm-index="${index}"><div class="sm-place-icon">${icon}</div><div class="sm-place-info"><div class="sm-place-name">${_placeText(record.name)}</div><div class="sm-place-addr">${_placeText(record.item.addr)}</div></div><span class="sm-badge sm-general-place-badge">일반 장소</span></div>`;
    }
    const item=record.item;
    const sub=[item.diocese,item.addr].filter(Boolean).join(' · ');
    return `<div class="sm-item sm-route-result" data-sm-scope="all" data-sm-index="${index}"><div class="sm-role" style="background:${c}">${_routeRoleShort(_smRole)}</div><div class="sm-info"><div class="sm-name">${_placeText(item.name)}</div><div class="sm-sub">${_placeText(sub)}</div></div><span class="sm-badge" style="color:${record.color};background:${record.color}18">${_placeText(record.badge)}</span></div>`;
  }).join('');
}
function _searchAllRoutePlaces(q){
  const query=String(q||'').trim();
  const body=$('sm-body-all');
  if(!body) return;
  if(!query){ _setSmPrompt('all'); return; }
  const seq=++_smSearchSeq;
  body.innerHTML='<div class="sm-place-loading">🔍 전체 장소 검색 중...</div>';
  Promise.allSettled([
    _ensureCatholicRouteSearchData().then(function(){ return _collectCatholicRouteResults(query,false); }),
    _kakaoKeywordDocs(query,KAKAO_PLACE_SEARCH_DISPLAY_LIMIT)
  ]).then(function(results){
    if(seq!==_smSearchSeq||_smTab!=='all') return;
    const catholic=results[0].status==='fulfilled'?results[0].value:[];
    const docs=results[1].status==='fulfilled'?results[1].value:[];
    const general=(docs||[]).map(function(doc){ return _generalRouteRecord(doc,query); }).filter(function(record){
      return Number.isFinite(record.score)&&!_isDuplicateGeneralPlace(record,catholic);
    });
    const merged=catholic.concat(general).sort(_comparePlaceSearchEntries).slice(0,OAI_ROUTE_SEARCH_RESULT_LIMIT);
    _renderAllRouteResults(body,merged);
  }).catch(function(){ if(seq===_smSearchSeq) body.innerHTML='<div class="sm-place-loading">검색 실패</div>'; });
}

function _searchKakaoPlace(q){
  const query=String(q||'').trim();
  const body=$('sm-body-place');
  if(!body) return;
  if(!query){ _setSmPrompt('place'); return; }
  const seq=++_smSearchSeq;
  body.innerHTML='<div class="sm-place-loading">🔍 검색 중...</div>';
  _kakaoKeywordDocs(query,KAKAO_PLACE_SEARCH_DISPLAY_LIMIT).then(function(docs){
    if(seq!==_smSearchSeq||_smTab!=='place') return;
    if(!docs.length){ body.innerHTML='<div class="sm-place-loading">검색 결과가 없습니다</div>'; return; }
    body.innerHTML=docs.map(function(d,index){
      const icon=d.category_group_code==='MT1'?'🏪':d.category_group_code==='SC4'?'🏫':d.category_group_code==='HP8'?'🏥':d.category_group_code==='PM9'?'💊':d.category_group_code==='OL7'?'⛽':'📍';
      return `<div class="sm-place-item" data-place-index="${index}"><div class="sm-place-icon">${icon}</div><div class="sm-place-info"><div class="sm-place-name">${_placeText(d.place_name)}</div><div class="sm-place-addr">${_placeText(d.road_address_name||d.address_name||'')}</div></div></div>`;
    }).join('');
    body.__oaiPlaceDocs=docs;
  }).catch(function(){ if(seq===_smSearchSeq) body.innerHTML='<div class="sm-place-loading">검색 실패</div>'; });
}

function selectFromPlaceModal(lat,lng,name,addr){
  const role=_smRole;
  const locObj={idx:-1,name:name,addr:addr||'',lat:lat,lng:lng};
  closeSearchModal();
  if(!_activeTab||_activeTab!=='route') openTab('route');
  else _enterRouteMode();
  _setRoutePointFromItem(role,locObj,-1);
  if(_map) _map.panTo(new _LL(lat,lng));
}
function _selectCatholicRouteResult(record){
  if(!record||!record.item) return;
  const role=_smRole;
  const item=record.item;
  closeSearchModal();
  if(!_activeTab||_activeTab!=='route') openTab('route');
  else _enterRouteMode();
  _setRoutePointFromItem(role,item,-1);
  if(item.lat&&item.lng&&_map) _map.panTo(new _LL(item.lat,item.lng));
}
function _selectSearchResult(scope,index){
  const records=scope==='all'?_smAllResults:_smCatholicResults;
  const record=records[index];
  if(!record) return;
  if(record.source==='place'){
    const doc=record.doc||{};
    selectFromPlaceModal(parseFloat(doc.y),parseFloat(doc.x),doc.place_name,doc.road_address_name||doc.address_name||'');
  }else _selectCatholicRouteResult(record);
}
function _installSearchResultDelegate(body){
  if(!body||body.__oaiRouteSearchDelegate) return;
  body.__oaiRouteSearchDelegate=true;
  body.addEventListener('click',function(e){
    const routeItem=e.target.closest('.sm-route-result');
    if(routeItem){
      _selectSearchResult(routeItem.dataset.smScope||'cat',parseInt(routeItem.dataset.smIndex,10));
      return;
    }
    const placeItem=e.target.closest('.sm-place-item[data-place-index]');
    if(placeItem){
      const docs=body.__oaiPlaceDocs||[];
      const doc=docs[parseInt(placeItem.dataset.placeIndex,10)];
      if(doc) selectFromPlaceModal(parseFloat(doc.y),parseFloat(doc.x),doc.place_name,doc.road_address_name||doc.address_name||'');
    }
  });
}
function openSearchModal(role){
  closeInfoCard({keepMap:true});
  _smRole=role;_smDio='all';_smTab='all';
  ['all','cat','place'].forEach(function(name){ const btn=$('sm-tab-'+name); if(btn) btn.classList.toggle('active',name==='all'); });
  requestAnimationFrame(function(){
    try{ $('sm-tab-all')?.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'}); }catch(e){ console.warn('[가톨릭길동무]',e); }
  });
  _setSmFilterVisible(false);
  _setSmBodyVisible('all');
  ['sm-body-all','sm-body','sm-body-place'].forEach(function(id){
    const body=$(id);
    if(body){ body.innerHTML=''; _installSearchResultDelegate(body); }
  });
  const hd=$('srch-modal')?.querySelector('.sm-hd');
  if(hd) hd.style.background=_mode==='parish'?'var(--parish-bg)':_mode==='retreat'?'var(--retreat-bg)':'var(--navy)';
  const sfb=$('srch-modal')?.querySelector('.sm-filter');
  if(sfb) sfb.style.background=_mode==='parish'?'var(--parish-bg)':_mode==='retreat'?'var(--retreat-bg)':'var(--navy2)';
  $$('.sm-fb').forEach(function(b){b.classList.remove('on');});
  document.querySelector('.sm-fb')?.classList.add('on');
  $('sm-title').textContent=_routeSearchTitle(role,'장소');
  const smInput=$('sm-inp');
  if(smInput){
    const smPh='성지·성당·피정·일반 장소 검색';
    smInput.placeholder=smPh;
    smInput.setAttribute('aria-label',smPh);
    smInput.value='';
  }
  _setSmPrompt('all');
  const searchModal=$('srch-modal');
  if(searchModal){
    searchModal.classList.add('open');
    try{ if(typeof oaiEnterPopup==='function') oaiEnterPopup(searchModal); }catch(e){ console.warn('[가톨릭길동무]',e); }
  }
  _syncMapPanelUI('open-search-modal');
  oaiFocusSearchKeyboardInput('sm-inp');
}

function _blurAll(){ try{document.activeElement&&document.activeElement.blur();}catch(e){ console.warn('[가톨릭길동무]', e); } }
function oaiInputIsVisible(el){
  try{
    if(!el) return false;
    if(el.disabled || el.readOnly) return false;
    var r=el.getBoundingClientRect();
    return r.width>0 && r.height>0;
  }catch(e){ console.warn('[가톨릭길동무]', e); return false; }
}
function oaiFocusSearchKeyboardInput(id, delay){
  function run(){
    try{
      var el=document.getElementById(id);
      if(!oaiInputIsVisible(el)) return;
      if(document.activeElement!==el){
        try{ el.focus({preventScroll:true}); }catch(_e){ el.focus(); }
      }
      try{ if(typeof el.select === 'function' && el.value) el.select(); }catch(_e){}
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  if(delay && delay>0) setTimeout(run, delay);
  else { run(); setTimeout(run, 60); }
}
function oaiBlurIfAutoFocusedInput(id){
  setTimeout(function(){
    try{
      var el=document.getElementById(id);
      if(el && document.activeElement===el) el.blur();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  },0);
}
function closeSearchModal(){
  _smSearchSeq++;
  clearTimeout(_smPlaceDebounce);
  _blurAll && _blurAll();
  $('srch-modal').classList.remove('open');
  _syncMapPanelUI('close-search-modal');
}

function setSmDio(v,btn){
  _smDio=v;
  $$('.sm-fb').forEach(function(b){b.classList.remove('on');});
  if(btn) btn.classList.add('on');
  _scrollDioFilterButtonIntoView(btn);
  if(_smTab==='cat') filterModal($('sm-inp')?.value||'');
}

function filterModal(q){
  const body=$('sm-body');
  if(!body) return;
  const query=String(q||'').trim();
  if(!query){ _setSmPrompt('cat'); return; }
  const seq=++_smSearchSeq;
  body.innerHTML='<div class="sm-place-loading">🔍 가톨릭 장소 검색 중...</div>';
  _ensureCatholicRouteSearchData().then(function(){
    if(seq!==_smSearchSeq||_smTab!=='cat') return;
    _renderCatholicRouteResults(body,_collectCatholicRouteResults(query,true),'cat');
  }).catch(function(){ if(seq===_smSearchSeq) body.innerHTML='<div class="sm-place-loading">검색 실패</div>'; });
}

function selectFromModal(idx){
  const s=_getCurrentItems()[idx];
  if(!s) return;
  _selectCatholicRouteResult({item:s});
}

function _show(el,d){if(el)el.style.display=d||'flex';}
function _hide(el){if(el)el.style.display='none';}
function calcDist(a,b,c,d){
  const R=6371,dL=(c-a)*Math.PI/180,dG=(d-b)*Math.PI/180;
  const x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dG/2)**2;
  return R*2*Math.asin(Math.sqrt(x));
}
function _fmtTime(s){
  if(!s||s<60) return '1분 미만';
  const m=Math.round(s/60);
  if(m<60) return m+'분';
  return Math.floor(m/60)+'시간'+(m%60?' '+m%60+'분':'');
}
(function(){
  const TABS = ['nearby','list','region','route'];
  let _swSt = null;
  const MIN_DX = 55, MAX_DY = 90;

  function _sheetSwipeStartTarget(tgt){
    if(!tgt || !tgt.closest) return null;
    return tgt.closest('#nearby-body,#list-body,#region-body,#sheet-route');
  }

  function _doMainSwipe(dx){
    if(typeof _screen === 'undefined' || _screen !== 'map') return;
    /* V8-1-14-621: 성지·성당·피정의집 좌우 스와이프는 하단 시트 내부에서 시작한 한 손가락 터치만 처리한다.
       지도·정보카드·두 손가락 확대축소는 스와이퍼가 건드리지 않아 지도 번쩍임과 하단 잔상을 막는다. */
    if(document.getElementById('srch-modal')?.classList.contains('open')) return;
    const idx = (typeof _activeTab !== 'undefined' && _activeTab)
      ? TABS.indexOf(_activeTab) : -1;
    const next = dx < 0
      ? (idx < TABS.length - 1 ? TABS[idx + 1] : TABS[0])
      : (idx > 0 ? TABS[idx - 1] : TABS[TABS.length - 1]);
    window._swipeDir = dx < 0 ? 'right' : 'left';
    if(typeof openTab === 'function') openTab(next);
    window._swipeDir = null;
  }

  document.addEventListener('touchstart', function(e){
    if(!e.touches || e.touches.length !== 1){ _swSt = null; return; }
    const tgt = e.target;
    if(tgt && tgt.closest && (tgt.closest('#map') || tgt.closest('#info-card') || tgt.closest('.srch-bar') || tgt.closest('.filter-bar') || tgt.closest('.sm-body, .sm-body-place'))){
      _swSt = null;
      return;
    }
    const sheetTarget = _sheetSwipeStartTarget(tgt);
    if(!sheetTarget){ _swSt = null; return; }
    _swSt = {x: e.touches[0].clientX, y: e.touches[0].clientY, target: sheetTarget};
  }, {passive: true});

  document.addEventListener('touchend', function(e){
    if(!_swSt) return;
    if(e.touches && e.touches.length > 0){ _swSt = null; return; }
    if(!e.changedTouches || e.changedTouches.length !== 1){ _swSt = null; return; }
    const ex = e.changedTouches[0].clientX;
    const ey = e.changedTouches[0].clientY;
    const dx = ex - _swSt.x;
    const dy = Math.abs(ey - _swSt.y);
    const startedInSheet = !!_swSt.target;
    _swSt = null;
    if(!startedInSheet) return;
    if(Math.abs(dx) < MIN_DX || dy > MAX_DY) return;

    const tgt = e.target;

    const tv = document.getElementById('trail-view');
    if(tv?.classList.contains('open')){
      if(tgt.closest('#trail-map') || tgt.closest('.trail-tabs')) return;
      if(typeof trailSetView === 'function')
        trailSetView(dx < 0 ? 'list' : 'map');
      if(typeof window.oaiSwipeAction === 'function') window.oaiSwipeAction(document.getElementById('trail-list') || document.querySelector('#trail-view .trail-panel.on'), dx < 0 ? 'left' : 'right');
      return;
    }

    const wv = document.getElementById('web-view');
    if(wv?.classList.contains('open')){
      return;
    }

    if(tgt.closest('#map')) return;
    _doMainSwipe(dx);

  }, {passive: true});
})();

(function(){
  const IDLE_MS = 30 * 60 * 1000; // 30분
  let _idleTimer = null;
  function _resetIdle(){
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(()=>{
      const root = document.documentElement;
      if(document.visibilityState !== 'visible'){
        return;
      }
      try{
        const coordinatorUntil = window.__OAI_RETURN_COORDINATOR_UNTIL__ || 0;
        const bgStamp = sessionStorage.getItem('oai_bg_started_at_v356') || sessionStorage.getItem('oai_home_backgrounded_at');
        const introUntil = parseInt(sessionStorage.getItem('oai_background_intro_return_until') || '0', 10) || 0;
        const nowTs = Date.now ? Date.now() : new Date().getTime();
        if(bgStamp || (coordinatorUntil && nowTs < coordinatorUntil) || (introUntil && nowTs < introUntil) || root.classList.contains('oai-cover-booting') || root.classList.contains('oai-background-return-intro')){
          _resetIdle();
          return;
        }
      }catch(_e){}
      /* V8-1-14-621:
         30분 백그라운드 복귀 규칙은 앱이 숨겨졌다가 돌아올 때만 사용한다.
         앱이 켜진 상태에서 30분 동안 조작이 없어도 현재 화면을 커버로 강제 이동하지 않는다. */
      return;
    }, IDLE_MS);
  }
  ['touchstart','touchend','click','keydown','scroll'].forEach(ev=>{
    document.addEventListener(ev, _resetIdle, {passive:true});
  });
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden'){
      clearTimeout(_idleTimer);
      return;
    }
    _resetIdle();
  }, {passive:true});
  _resetIdle();
})();

document.addEventListener('DOMContentLoaded', function bindEvents() {
  function on(id, evt, fn, opts) {
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.addEventListener(evt, fn, opts || false);
  }
  function onQ(sel, evt, fn) {
    document.querySelectorAll(sel).forEach(function(el) { el.addEventListener(evt, fn); });
  }
  function adjustAppFont(delta) {
    if (typeof window.__APP_adjustSharedFont === 'function') {
      window.__APP_adjustSharedFont(delta);
      return;
    }
    if (typeof window.prAdjustFont === 'function') window.prAdjustFont(delta);
  }
  function withPrayerModule(fn) {
    if (typeof window.ensurePrayerModuleLoaded === 'function') {
      window.ensurePrayerModuleLoaded().then(function(){ try{ fn(); }catch(e){ console.warn('[가톨릭길동무]', e); } })
        .catch(function(err){ console.warn('[가톨릭길동무]', err); });
      return;
    }
    try{ fn(); }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function shareGildongmuApp(e) {
    try{ if(e){ e.preventDefault(); e.stopPropagation(); } }catch(_e){}
    var shareUrl = 'https://play.google.com/store/apps/details?id=kr.catholic.gildonmu';
    var shareTitle = '가톨릭길동무';
    var shareText = '가톨릭길동무 앱을 추천합니다.\n\n전국 성당, 성지, 피정의집, 순례길 정보를 한눈에 볼 수 있는 가톨릭 생활 앱입니다.\n\nGoogle Play에서 설치하기:\n' + shareUrl;
    try{
      if(window.GildongmuNative && typeof window.GildongmuNative.shareApp === 'function'){
        window.GildongmuNative.shareApp(shareText);
        return;
      }
    }catch(_bridgeErr){}
    if(navigator.share){
      navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(function(){});
      return;
    }
    function copied(){
      try{ alert('공유 링크를 복사했습니다. 카카오톡, 문자, 밴드 등에 붙여넣어 공유해 주세요.'); }catch(_e){}
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(shareText).then(copied).catch(function(){ fallbackCopy(); });
        return;
      }
    }catch(_clipErr){}
    fallbackCopy();
    function fallbackCopy(){
      try{
        var ta=document.createElement('textarea');
        ta.value=shareText;
        ta.setAttribute('readonly','readonly');
        ta.style.position='fixed';
        ta.style.left='-9999px';
        ta.style.top='0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try{ document.execCommand('copy'); }catch(_e){}
        if(ta.parentNode) ta.parentNode.removeChild(ta);
        copied();
      }catch(copyErr){
        try{ alert(shareText); }catch(_e){}
      }
    }
  }
  function prepareSearchKeyboardInput(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('inputmode', 'search');
    el.setAttribute('enterkeyhint', 'done');
    el.removeAttribute('autofocus');
    return el;
  }
  function blurSearchKeyboardOnDone(e, afterBlur) {
    if (!e || e.key !== 'Enter' || e.isComposing) return false;
    e.preventDefault();
    e.stopPropagation();
    var target = e.currentTarget || e.target;
    if (typeof afterBlur === 'function') {
      try { afterBlur(target); } catch (err) { console.warn('[가톨릭길동무]', err); }
    }
    setTimeout(function() { try { target && target.blur && target.blur(); } catch (err) { console.warn('[가톨릭길동무]', err); } }, 0);
    return true;
  }
  ['list-srch-inp', 'region-inp', 'sm-inp', 'prayer-search-inp'].forEach(prepareSearchKeyboardInput);

  on('missa-close', 'click', function() { closeMissa(); });

  on('exit-cancel-btn', 'click', function() { closeExitDlg(); });
  on('exit-ok-btn',     'click', function() { doExit(); });

  on('diocese-close-btn', 'click', function() {
    if (typeof closeDioceseView === 'function') closeDioceseView();
  });
  on('diocese-frame', 'load', function() {
    if (typeof dioceseLoaded === 'function') dioceseLoaded();
  });

  on('prayer-close',  'click', function() { _closePrayerAndReturn(); });
  on('prayer-search-inp', 'input', function() { withPrayerModule(function(){ if(typeof window.prRenderList==='function') window.prRenderList(); }); });
  on('prayer-search-inp', 'keydown', function(e) {
    blurSearchKeyboardOnDone(e, function() {
      withPrayerModule(function(){ if(typeof window.prRenderList==='function') window.prRenderList(); });
    });
  });
  on('pr-sm-btn-1',   'click', function() { withPrayerModule(function(){ if(typeof window.prAdjustFont==='function') window.prAdjustFont(-1); }); });
  on('pr-lg-btn-1',   'click', function() { withPrayerModule(function(){ if(typeof window.prAdjustFont==='function') window.prAdjustFont(1); }); });
  on('pr-sm-btn-2',   'click', function() { withPrayerModule(function(){ if(typeof window.prAdjustFont==='function') window.prAdjustFont(-1); }); });
  on('pr-lg-btn-2',   'click', function() { withPrayerModule(function(){ if(typeof window.prAdjustFont==='function') window.prAdjustFont(1); }); });
  on('pr-detail-star','click', function(e) { var ev=e; withPrayerModule(function(){ if(typeof window.prToggleDetailFav==='function') window.prToggleDetailFav(ev); }); });
  on('pr-back-btn',   'click', function() { withPrayerModule(function(){ if(typeof window.prCloseDetail==='function') window.prCloseDetail(); else if(typeof window.closePrayerView==='function') window.closePrayerView(); }); });

  on('cover-sm-btn',  'click', function(e) { e.stopPropagation(); adjustAppFont(-1); });
  on('cover-lg-btn',  'click', function(e) { e.stopPropagation(); adjustAppFont(1); });

  on('cc-1', 'click', function() { if (typeof openMassQuickMenu === 'function') openMassQuickMenu(); });
  on('cc-2', 'click', function() { if (typeof startApp === 'function') startApp('parish'); });
  on('cc-3', 'click', function() { if (typeof startApp === 'function') startApp('shrine'); });
  on('cc-4', 'click', function() { if (typeof startApp === 'function') startApp('retreat'); });
  on('cc-5', 'click', function() { hideCoverAndRun(function() { if (typeof openTrailView === 'function') openTrailView(); }); });
  on('cc-6', 'click', function() { hideCoverAndRun(function() { if (typeof openWebView === 'function') openWebView(); }); });
  on('cc-7', 'click', function() { if(typeof openDioceseView === 'function') openDioceseView(); });

  onQ('[data-mass-quick-close]', 'click', function() { closeMassQuickMenu(); });
  on('mass-quick-missa', 'click', function(e) {
    if(e){ e.preventDefault(); e.stopPropagation(); }
    _openFaithTargetFromMassQuick('missa', {forceReload:true});
  });
  on('mass-quick-prayer', 'click', function(e) {
    if(e){ e.preventDefault(); e.stopPropagation(); }
    _openFaithTargetFromMassQuick('prayer');
  });
  on('mass-quick-hymn', 'click', function(e) {
    if(e){ e.preventDefault(); e.stopPropagation(); }
    _openFaithTargetFromMassQuick('hymn');
  });
  on('mass-quick-bible', 'click', function(e) {
    if(e){ e.preventDefault(); e.stopPropagation(); }
    _openFaithTargetFromMassQuick('bible');
  });

  (function bindCoverRefreshPressActions(){
    var refreshBtn = document.getElementById('cover-update-btn');
    if(!refreshBtn) return;

    var holdTimer = null;
    var pressStarted = false;
    var longActionFired = false;
    var suppressClickUntil = 0;
    var CACHE_HOLD_MS = 1200;

    function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function isNativeAndroid(){
    try{ return /GildongmuAndroid\/\d+/i.test(navigator.userAgent||'') || !!window.GildongmuNative; }catch(_e){ return false; }
  }
  var _handledNativeCycles = Object.create(null);
    function stopEvent(e, preventDefault){
      try{
        if(!e) return;
        e.stopPropagation();
        if(preventDefault && e.cancelable) e.preventDefault();
      }catch(_e){}
    }
    function vibrateShort(){ try{ if(navigator.vibrate) navigator.vibrate(12); }catch(_e){} }
    function vibrateLong(){ try{ if(navigator.vibrate) navigator.vibrate([32, 22, 48]); }catch(_e){} }
    function clearHold(){ if(holdTimer){ clearTimeout(holdTimer); holdTimer = null; } }
    function beginPress(e){
      try{ if(e && e.button !== undefined && e.button !== 0) return; }catch(_e){}
      stopEvent(e, false);
      clearHold();
      pressStarted = true;
      longActionFired = false;
      holdTimer = setTimeout(function(){
        holdTimer = null;
        if(!pressStarted || longActionFired) return;
        longActionFired = true;
        pressStarted = false;
        suppressClickUntil = now() + 1600;
        vibrateLong();
        if(typeof clearAppFilesCacheCompletely === 'function') clearAppFilesCacheCompletely();
      }, CACHE_HOLD_MS);
    }
    function endPress(e){
      stopEvent(e, false);
      pressStarted = false;
      clearHold();
    }
    function cancelPress(e){
      stopEvent(e, false);
      pressStarted = false;
      clearHold();
    }
    function shortRefresh(e){
      stopEvent(e, true);
      if(now() < suppressClickUntil || longActionFired){
        longActionFired = false;
        return;
      }
      pressStarted = false;
      clearHold();
      if(typeof refreshAppFilesOnly === 'function') refreshAppFilesOnly();
    }
    function preventNativePressMenu(e){ stopEvent(e, true); return false; }

    if(window.PointerEvent){
      on(refreshBtn, 'pointerdown', beginPress, {passive:false});
      on(refreshBtn, 'pointerup', endPress, {passive:false});
      on(refreshBtn, 'pointercancel', cancelPress, {passive:false});
      on(refreshBtn, 'pointerleave', function(e){
        try{ if(e && e.pointerType === 'mouse') cancelPress(e); }catch(_e){}
      }, {passive:false});
    }else{
      on(refreshBtn, 'touchstart', beginPress, {passive:true});
      on(refreshBtn, 'touchend', endPress, {passive:true});
      on(refreshBtn, 'touchcancel', cancelPress, {passive:true});
      on(refreshBtn, 'mousedown', beginPress, {passive:false});
      on(refreshBtn, 'mouseup', endPress, {passive:false});
      on(refreshBtn, 'mouseleave', cancelPress, {passive:false});
    }
    on(refreshBtn, 'click', shortRefresh, {capture:true});
    on(refreshBtn, 'contextmenu', preventNativePressMenu, {capture:true});
    on(refreshBtn, 'selectstart', preventNativePressMenu, {capture:true});
    on(refreshBtn, 'dragstart', preventNativePressMenu, {capture:true});
  })();
  on('cover-share-btn', 'click', shareGildongmuApp);

  (function bindCoverMenu(){
    var modal = document.getElementById('cover-menu-modal');
    if(!modal) return;
    function normalizeCoverMenuBackState(reason){
      try{ if(typeof window._resetCoverExitReady === 'function') window._resetCoverExitReady(); }catch(e){ console.warn('[가톨릭길동무]', e); }
      try{ if(typeof window._clearCoverExitArmed === 'function') window._clearCoverExitArmed(); }catch(e){ console.warn('[가톨릭길동무]', e); }
      try{ if(typeof window._clearHardCoverExitFlags === 'function') window._clearHardCoverExitFlags(reason || 'cover-menu'); }catch(e){ console.warn('[가톨릭길동무]', e); }
      try{ if(typeof window._forceNextCoverBackToast === 'function') window._forceNextCoverBackToast(reason || 'cover-menu'); }catch(e){ console.warn('[가톨릭길동무]', e); }
      try{ if(typeof window._ensureCoverBackTrap === 'function') window._ensureCoverBackTrap(reason || 'cover-menu'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    }
    function openMenu(){
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      normalizeCoverMenuBackState('cover-menu-open');
      try{ if(typeof window._pushCoverOverlayBackTrap === 'function') window._pushCoverOverlayBackTrap('cover-menu', 'cover-menu-open'); }catch(e){ console.warn('[가톨릭길동무]', e); }
    }
    function closeMenu(){
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      normalizeCoverMenuBackState('cover-menu-close');
    }
    window.closeCoverMenuPopup = closeMenu;
    window.isCoverMenuPopupOpen = function(){
      return !!(modal && modal.classList && modal.classList.contains('show'));
    };
    on('cover-menu-btn', 'click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      openMenu();
    });
    on('cover-menu-close', 'click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      closeMenu();
    });
    modal.addEventListener('click', function(e){
      if(e && e.target && e.target.getAttribute && e.target.getAttribute('data-cover-menu-close') === 'true') closeMenu();
    });
    on('cover-menu-guide-btn', 'click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      closeMenu();
      try{
        if(window.openGuideManual) window.openGuideManual();
        else if(typeof openGuideManual === 'function') openGuideManual();
      }catch(err){ console.warn('[가톨릭길동무]', err); }
    });
    function markInternalPrivacyNavigation(){
      try{
        sessionStorage.setItem('oai_internal_return_no_effect_once','1');
        sessionStorage.setItem('oai_internal_return_no_effect_until', String((Date.now ? Date.now() : new Date().getTime()) + 7000));
        sessionStorage.setItem('oai_internal_page_nav','privacy');
        sessionStorage.removeItem('oai_external_nav_started_at');
        sessionStorage.removeItem('oai_external_nav_pagehide');
        sessionStorage.removeItem('oai_external_nav_kind');
        sessionStorage.removeItem('oai_external_nav_pending');
        sessionStorage.removeItem('oai_external_nav_hold_until');
        sessionStorage.removeItem('oai_external_nav_force_release_at');
        sessionStorage.removeItem('oai_refresh_veil_until');
        sessionStorage.removeItem('oai_refresh_veil_hold_ms');
        sessionStorage.removeItem('oai_refresh_veil_reason');
        sessionStorage.removeItem('oai_refresh_veil_visible_until');
      }catch(_e){}
    }
    on('cover-menu-qna-btn', 'click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      closeMenu();
      try{ openQnaView(); }catch(err){ console.warn('[가톨릭길동무]', err); }
    });
    on('cover-menu-privacy-btn', 'click', function(e){
      if(e){ e.preventDefault(); e.stopPropagation(); }
      closeMenu();
      if(window.openPrivacyPolicyModal) window.openPrivacyPolicyModal();
    });
    document.addEventListener('keydown', function(e){
      if(e && e.key === 'Escape' && modal.classList.contains('show')) closeMenu();
    });
  })();

  if (window.bindMyFaithLifePanel) window.bindMyFaithLifePanel(on);


  on('tab-btn-nearby', 'click', function() { toggleTab('nearby'); });
  on('tab-btn-list',   'click', function() { toggleTab('list'); });
  on('tab-btn-region', 'click', function() { toggleTab('region'); });
  on('tab-btn-route',  'click', function() { toggleTab('route'); });

  on('nearby-close-btn', 'click', function(e) { e.stopPropagation(); closeSheetPanelOnly('nearby'); });
  on('list-close-btn',   'click', function(e) { e.stopPropagation(); closeSheetPanelOnly('list'); });
  on('region-close-btn', 'click', function(e) { e.stopPropagation(); closeSheetPanelOnly('region'); });
  on('route-close-btn',  'click', function(e) { e.stopPropagation(); closeRouteSheetByX(); });
  on('map-category-close-btn', 'click', function(e) { e.stopPropagation(); closeCategoryToCoverFromMap(); });

  on('loc-btn', 'click', function() { goMyLoc(); });

  on('list-srch-inp', 'input', function() { onListSearch(this.value); });
  on('list-srch-inp', 'keydown', function(e) { blurSearchKeyboardOnDone(e, function(inp) { onListSearch(inp.value || ''); }); });
  on('list-srch-x',   'click', function() { clearListSearch(); });

  on('region-inp', 'keydown', function(e) { blurSearchKeyboardOnDone(e, function() { doRegionSearch(); }); });
  on('region-inp', 'input',   function() { onRegionInp(this.value); });
  on('region-search-btn', 'click', function() {
    if (document.activeElement) document.activeElement.blur();
    doRegionSearch();
  });

  on('rs-start-box', 'click', function() { if(_returnRouteResultToInputWindow()) return; openSearchModal('start'); });
  on('rs-end-box',   'click', function() { if(_returnRouteResultToInputWindow()) return; openSearchModal('end'); });
  on('rs-waypoints-summary-box', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } _returnRouteResultToInputWindow(); });
  on('rs-waypoint-box', 'click', function() { openSearchModal('waypoint'); });
  on('rs-waypoint2-box', 'click', function() { openSearchModal('waypoint2'); });
  on('rs-waypoint3-box', 'click', function() { openSearchModal('waypoint3'); });
  on('rs-waypoint4-box', 'click', function() { openSearchModal('waypoint4'); });
  on('rs-waypoint5-box', 'click', function() { openSearchModal('waypoint5'); });
  on('rs-add-waypoint-btn', 'click', function(e) {
    if(e){ e.preventDefault(); e.stopPropagation(); }
    var role=(this && this.dataset && this.dataset.nextWaypointRole) || (typeof _nextAvailableWaypointRole === 'function' ? _nextAvailableWaypointRole() : '') || 'waypoint';
    _beginWaypointAddMode(role);
  });
  on('rs-myloc-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } setMyLocAsStart(); });
  on('rs-start-x',   'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } clearRoute('start'); });
  on('rs-end-x',     'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } clearRoute('end'); });
  function clearWaypointByX(role,e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    // 값이 있으면 첫 X는 값만 비우고 입력창 유지, 이미 빈 창이면 두 번째 X에서 창 자체 삭제.
    if(_routePointReady(_getRoutePointByRole(role))) clearRoute(role,{keepWaypointBox:true});
    else clearRoute(role);
  }
  on('rs-waypoint-x','click', function(e) { clearWaypointByX('waypoint',e); });
  on('rs-waypoint2-x','click', function(e) { clearWaypointByX('waypoint2',e); });
  on('rs-waypoint3-x','click', function(e) { clearWaypointByX('waypoint3',e); });
  on('rs-waypoint4-x','click', function(e) { clearWaypointByX('waypoint4',e); });
  on('rs-waypoint5-x','click', function(e) { clearWaypointByX('waypoint5',e); });
  on('rs-swap-btn',  'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRoute(); });
  on('rs-swap-waypoint-end-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRouteWaypointEnd(); });
  on('rs-swap-waypoint2-end-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRouteWaypoint2End(); });
  on('rs-swap-waypoint3-end-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRouteWaypoint3End(); });
  on('rs-swap-waypoint4-end-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRouteWaypoint4End(); });
  on('rs-swap-waypoint5-end-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } swapRouteWaypoint5End(); });
  _bindRouteDragHandles();
  on('rs-search-btn','click', function() { doSearchRoute(); });
  on('rs-kakao-btn', 'click', function() { doKakaoRoute(); });
  on('rs-reset-btn', 'click', function() { resetRoute({ fromButton: true }); });

  on('ic-close-btn', 'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } closeInfoCard({keepMap:true}); });
  on('ic-route-btn', 'click', function() { _openInfoRouteChoice(); });
  on('ic-guide',     'click', function() { if (typeof openShrineDetail === 'function') openShrineDetail(); });
  on('ic-goodnews',  'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } });
  on('ic-kakao-nav', 'click', function() { openKakaoNav(); });

  // X 버튼 터치 보강: 경로/인포카드 위에 다른 레이어가 있어도 닫힘이 먼저 실행되도록 캡처 단계에서도 한 번 더 묶는다.
  ['click','pointerup','touchend'].forEach(function(ev){
    on('ic-close-btn', ev, function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } closeInfoCard({keepMap:true}); }, true);
    on('route-close-btn', ev, function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } closeRouteSheetByX(); }, true);
  });

  on('sm-close-btn', 'click', function() { closeSearchModal(); });
  on('sm-map-select-btn', 'click', function() { selectMapFromSearchModal(); });
  on('route-choice-start', 'click', function() { _handleRouteChoiceStart(); });
  on('route-choice-end', 'click', function() { _handleRouteChoiceEnd(); });
  on('route-choice-waypoint', 'click', function() { _handleRouteChoiceWaypoint(); });
  on('route-choice-cancel', 'click', function() { _closeInfoRouteChoice(); });
  on('route-choice-backdrop', 'click', function() { _closeInfoRouteChoice(); });
  on('sm-inp', 'input', function() { onSmInp(this.value); });
  on('sm-inp', 'keydown', function(e) {
    blurSearchKeyboardOnDone(e, function(inp) {
      var v = (inp && inp.value ? inp.value : '').trim();
      if(_smTab==='all'){
        if(v) _searchAllRoutePlaces(v);
      }else if(_smTab==='place'){
        if(v) _searchKakaoPlace(v);
      }else{
        filterModal(v);
      }
    });
  });

  function closeGeneralModuleByButton(viewId){
    try{
      if(typeof window._oaiCloseGeneralModuleToCover === 'function' && window._oaiCloseGeneralModuleToCover(viewId + '-close-button')) return;
    }catch(e){ console.warn('[가톨릭길동무]', e); }
    var v = document.getElementById(viewId);
    if (v) v.classList.remove('open');
    if (typeof goToCover === 'function') goToCover();
  }
  on('web-close-btn', 'click', function() { closeGeneralModuleByButton('web-view'); });
  on('trail-close-btn', 'click', function() { closeGeneralModuleByButton('trail-view'); });
  on('qna-close-btn', 'click', function() { closeGeneralModuleByButton('qna-view'); });

  on('trail-sh-close-btn', 'click', function() { trailCloseSheet(); });
  on('trail-loc-btn',      'click', function(e) { if(e){ e.preventDefault(); e.stopPropagation(); } trailMyLoc(); });
  on('trail-tab-map',  'click', function() { trailSetView('map'); });
  on('trail-tab-list', 'click', function() { trailSetView('list'); });


  on('sm-tab-all',   'click', function() { smSwitchTab('all'); });
  on('sm-tab-cat',   'click', function() { smSwitchTab('cat'); });
  on('sm-tab-place', 'click', function() { smSwitchTab('place'); });

});



(function installOaiMapSearchKeyboardViewportLock(){
  if(window.__OAI_MAP_SEARCH_KEYBOARD_VIEWPORT_LOCK__) return;
  window.__OAI_MAP_SEARCH_KEYBOARD_VIEWPORT_LOCK__=true;
  var lock=null;
  function isTargetInput(el){
    try{ return !!(el && (el.id==='list-srch-inp' || el.id==='region-inp' || el.id==='sm-inp')); }catch(_e){ return false; }
  }
  function getActiveTarget(){
    try{ return isTargetInput(document.activeElement) ? document.activeElement : null; }catch(_e){ return null; }
  }
  function getSheetNameForInput(el){ return el && el.id==='region-inp' ? 'region' : (el && el.id==='sm-inp' ? 'search' : 'list'); }
  function getPanel(name){ return name==='search' ? document.getElementById('srch-modal') : document.getElementById('sheet-'+name); }
  function getScrollBox(name){
    if(name==='search') {
      var all=document.getElementById('sm-body-all');
      var cat=document.getElementById('sm-body');
      var place=document.getElementById('sm-body-place');
      try{ if(all && all.style.display!=='none') return all; }catch(_e){}
      try{ if(cat && cat.style.display!=='none') return cat; }catch(_e){}
      return place || cat || all;
    }
    return name==='region' ? document.getElementById('region-body') : document.getElementById('list-body');
  }
  function hasResultScrollIntent(){
    try{ return Date.now() < (window.__OAI_RESULT_SCROLL_INTENT_UNTIL__ || 0); }catch(_e){ return false; }
  }
  function finishResultScrollKeyboardDismiss(snapshot){
    [160,360,720].forEach(function(delay){
      setTimeout(function(){
        try{
          if(getActiveTarget()) return;
          document.documentElement.classList.remove('oai-map-search-keyboard-lock');
          document.documentElement.classList.remove('oai-result-scroll-kb-dismiss');
          if(lock===snapshot) lock=null;
        }catch(e){ console.warn('[가톨릭길동무]', e); }
      }, delay);
    });
  }
  function makeLock(el){
    var name=getSheetNameForInput(el);
    var sheet=getPanel(name);
    var body=getScrollBox(name);
    return {
      inputId: el && el.id || '',
      sheetName: name,
      winY: window.scrollY || document.documentElement.scrollTop || 0,
      docY: document.documentElement.scrollTop || 0,
      bodyY: document.body ? (document.body.scrollTop || 0) : 0,
      sheetTop: sheet ? sheet.scrollTop || 0 : 0,
      bodyTop: body ? body.scrollTop || 0 : 0
    };
  }
  function restore(reason,savedLock){
    try{
      var cur=savedLock || lock;
      var el=getActiveTarget();
      if(!cur) return;
      if(!savedLock && (!el || el.id!==cur.inputId)) return;
      var sheet=getPanel(cur.sheetName);
      var body=getScrollBox(cur.sheetName);
      if(window.scrollTo) window.scrollTo(0, cur.winY || 0);
      if(document.documentElement) document.documentElement.scrollTop=cur.docY || cur.winY || 0;
      if(document.body) document.body.scrollTop=cur.bodyY || 0;
      if(sheet) sheet.scrollTop=cur.sheetTop || 0;
      if(body && reason!=='input') body.scrollTop=cur.bodyTop || 0;
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function start(el){
    try{
      if(!isTargetInput(el)) return;
      lock=makeLock(el);
      document.documentElement.classList.add('oai-map-search-keyboard-lock');
      [0,40,100,180,320].forEach(function(delay){ setTimeout(function(){ restore('start-'+delay); }, delay); });
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function stop(){
    var snapshot=lock;
    if(hasResultScrollIntent()){
      /* V8-1-14-621:
         검색 키보드가 열린 상태에서 성지/성당/피정 리스트를 바로 끌어올리면
         기존 viewport 복원 타이머가 첫 스크롤 위치를 다시 되돌려 버벅임을 만들었다.
         리스트 스크롤 의도가 확인된 경우에는 키보드만 닫고, 스크롤 위치 복원은 하지 않는다. */
      finishResultScrollKeyboardDismiss(snapshot);
      return;
    }
    [0,80,160,300,520].forEach(function(delay){
      setTimeout(function(){ try{ if(!getActiveTarget()) restore('stop-'+delay, snapshot); }catch(e){ console.warn('[가톨릭길동무]', e); } }, delay);
    });
    setTimeout(function(){
      try{
        if(getActiveTarget()) return;
        restore('stop-final', snapshot);
        document.documentElement.classList.remove('oai-map-search-keyboard-lock');
        document.documentElement.classList.remove('oai-result-scroll-kb-dismiss');
        if(lock===snapshot) lock=null;
      }catch(e){ console.warn('[가톨릭길동무]', e); }
    }, 680);
  }
  document.addEventListener('focusin', function(e){ if(isTargetInput(e.target)) start(e.target); }, true);
  document.addEventListener('focusout', function(e){ if(isTargetInput(e.target)) stop(); }, true);
  document.addEventListener('input', function(e){ if(isTargetInput(e.target)) setTimeout(function(){ restore('input'); }, 0); }, true);
  try{
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', function(){ if(getActiveTarget() && !hasResultScrollIntent()) { restore('vv-resize'); setTimeout(function(){ if(!hasResultScrollIntent()) restore('vv-resize-late'); }, 120); } }, {passive:true});
      window.visualViewport.addEventListener('scroll', function(){ if(getActiveTarget() && !hasResultScrollIntent()) restore('vv-scroll'); }, {passive:true});
    }
  }catch(e){ console.warn('[가톨릭길동무]', e); }
  window.addEventListener('resize', function(){ if(getActiveTarget() && !hasResultScrollIntent()) setTimeout(function(){ if(!hasResultScrollIntent()) restore('win-resize'); }, 40); }, {passive:true});
})();

(function installOaiKeyboardDismissOnOutsideTouch(){
  if(window.__OAI_KEYBOARD_DISMISS_ON_TOUCH_INSTALLED__) return;
  window.__OAI_KEYBOARD_DISMISS_ON_TOUCH_INSTALLED__=true;
  let scrollBlurTimer=null;
  function isEditable(el){
    try{ return !!(el && el.closest && el.closest('input,textarea,[contenteditable="true"],.srch-inner,.sm-si')); }catch(e){ return false; }
  }
  function isResultScrollSurface(el){
    try{ return !!(el && el.closest && el.closest('#list-body,#nearby-body,#region-body,#sm-results,.sheet-body,.sm-inner,.srch-results')); }catch(e){ return false; }
  }
  function blurActive(){
    try{
      const ae=document.activeElement;
      if(ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable)) ae.blur();
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function hasActiveEditable(){
    try{
      const ae=document.activeElement;
      return !!(ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable));
    }catch(e){ return false; }
  }
  function markResultScrollIntent(){
    try{
      window.__OAI_RESULT_SCROLL_INTENT_UNTIL__ = Date.now() + 950;
      document.documentElement.classList.add('oai-result-scroll-kb-dismiss');
      setTimeout(function(){
        try{
          if(Date.now() >= (window.__OAI_RESULT_SCROLL_INTENT_UNTIL__ || 0)){
            document.documentElement.classList.remove('oai-result-scroll-kb-dismiss');
          }
        }catch(_e){}
      }, 1050);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function scheduleScrollBlur(){
    try{
      if(scrollBlurTimer) clearTimeout(scrollBlurTimer);
      markResultScrollIntent();
      scrollBlurTimer=setTimeout(function(){ if(hasActiveEditable()) blurActive(); }, 20);
    }catch(e){ console.warn('[가톨릭길동무]', e); }
  }
  function blurOnOutsidePointer(e){
    try{
      if(!hasActiveEditable() || isEditable(e.target)) return;
      if(isResultScrollSurface(e.target)) markResultScrollIntent();
      blurActive();
      setTimeout(function(){ if(hasActiveEditable()) blurActive(); }, 40);
    }catch(err){ console.warn('[가톨릭길동무]', err); }
  }
  document.addEventListener('pointerdown', blurOnOutsidePointer, {capture:true, passive:true});
  document.addEventListener('touchstart', blurOnOutsidePointer, {capture:true, passive:true});
  document.addEventListener('mousedown', blurOnOutsidePointer, true);
  document.addEventListener('scroll', function(e){
    if(!hasActiveEditable()) return;
    try{
      const t=e.target;
      if(t===document || t===window || isResultScrollSurface(t)) scheduleScrollBlur();
    }catch(_e){ scheduleScrollBlur(); }
  }, true);
})();





/* V8-1-14-679: 최초 앱 진입에서도 지도 화면과 무관하게 최신 위치를 한 번 확인한다. */
(function(){
  try{
    if(window.__OAI_INITIAL_LOCATION_REFRESH_V663__) return;
    window.__OAI_INITIAL_LOCATION_REFRESH_V663__=true;
    function run(){
      setTimeout(function(){
        try{ if(typeof window.oaiRefreshCurrentLocation==='function') window.oaiRefreshCurrentLocation({reason:'initial-app-entry',cycleId:'initial-'+Date.now(),preserveMapCenter:true}); }catch(_e){}
      }, 2400);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  }catch(_e){}
})();
