/**
 * bond-visualiser.js — Fullscreen SAFETYNET audio visualiser overlay.
 *
 * Themed by the scenario's "creditsTheme" (credits-theme.js): "safetynet", the
 * default campaign debrief, or "cyber", a generic cyber security incident review.
 * Each theme sets its enabled modes, matrix characters, logo, log lines and text.
 *
 * Adapted from bond-visualiser.html. Connects to MusicController's shared
 * AudioContext and AnalyserNode instead of loading its own audio.
 *
 * Public API (imported or via window.BondVisualiser):
 *   BondVisualiser.open()    — show fullscreen overlay & start render
 *   BondVisualiser.close()   — hide overlay & stop render
 *   BondVisualiser.toggle()  — toggle open/close
 *   BondVisualiser.isOpen()  — returns boolean
 *
 * Auto-opens when MusicController switches to the 'victory' playlist.
 *
 * Usage in mission end / win flow:
 *   MusicController.switchPlaylist('victory');
 *   // BondVisualiser opens automatically
 */

import MusicController from './music-controller.js';
import { displayDashes } from '../utils/display-dashes.js';
import { resolveCreditsTheme, getCreditsTheme, trackInfoLabel, DEFAULT_CREDITS_THEME } from './credits-theme.js';

// ── Constants ─────────────────────────────────────────────────────────────
const PIX = 4; // pixel block size for all drawing

// ── Module-level DOM/canvas refs ──────────────────────────────────────────
let _overlay  = null;
let _matrixCv = null;
let _visCv    = null;
let _visCtx   = null;
let _logEl    = null;

// ── Animation loops ───────────────────────────────────────────────────────
let _animId    = null;
let _matrixIv  = null; // setInterval for matrix rain

// ── Credits scroll state ──────────────────────────────────────────────────
let _creditsTimerId   = null;  // setTimeout handle for credit sequencing
let _creditsHideTimer = null;  // setTimeout handle for deferred display:none after fade
let _creditsActive    = false;
let _autoCloseOnEnd   = false; // close visualiser when musiccontroller:trackended fires
let _disableClose     = false; // hide × and block Esc — for forced/cutscene contexts

// ── MusicController state ─────────────────────────────────────────────────
let _mcState   = {};

// ── Theme (credits-theme.js) ──────────────────────────────────────────────
let _theme        = DEFAULT_CREDITS_THEME;
let _themeDef     = getCreditsTheme(_theme);
let _themeApplied = null;  // theme the DOM currently shows
let _lastCredits  = null;

// ── Per-mode reset state ──────────────────────────────────────────────────
let _currentMode = 'cybermap';

// ── Auto-progression state ───────────────────────────────────────────────
let _autoEnabled = true;
let _autoIv      = null;
const AUTO_INTERVAL = 70000;

// ── Audio analysis state ──────────────────────────────────────────────────
const HIST_LEN    = 90;
let energyHistory = new Float32Array(HIST_LEN);
let histIdx       = 0;
let ceilBass = 0.3, ceilMid = 0.3, ceilHigh = 0.3, ceilAvg = 0.3;
let kickFlash = 0, snareFlash = 0;
let kickHit   = false, snareHit = false;
let kickSmooth = 0, snareSmooth = 0;
let kickPeak = 0, snarePeak = 0;
let kickCooldown = 0, snareCooldown = 0;
let _prevKickBins = null;   // for spectral flux
let _prevClickBins = null;  // for high-freq transient confirmation
let kickNSmooth = 0;        // smoothed kick level for continuous visualizations

// ── Per-mode state ────────────────────────────────────────────────────────
let tunnelAngle = 0, tunnelZoom = 0;
let plasmaT = 0;
let particleList = [];
const MAX_PARTICLES = 380;
let lissT = 0;
let attackArcs = [], mapPulses = [], mapGlobe = null, mapFrame = 0, lastBassHit = 0;
let siemEvents = [], siemAlerts = [], siemFrame = 0;
let siemThreatScore = 0;
let siemSparkline = new Float32Array(120);
let siemSparkIdx = 0;
let siemRuleHits  = {};
let siemLastSpawn = 0;
const SIEM_SEVERITIES = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];
const SIEM_SEV_COLS   = { CRITICAL:'#FF003C', HIGH:'#FF6600', MEDIUM:'#FFD700', LOW:'#00FFFF', INFO:'#00FF41' };
const SIEM_SOURCES    = ['FW-PERIMETER','IDS-NORTH','WAF-01','ENDPOINT-XDR','CLOUD-SIEM','VPN-GW','DNS-FILTER','PROXY-01','SIEM-CORE','AD-MONITOR','SOAR-ENGINE'];
const SIEM_EVENTS     = ['SQL INJECTION ATTEMPT','BRUTE FORCE LOGIN','LATERAL MOVEMENT','C2 BEACON DETECTED','PRIVILEGE ESCALATION','DATA EXFILTRATION','RANSOMWARE SIGNATURE','ZERO-DAY EXPLOIT','PORT SCAN DETECTED','MALWARE HASH MATCH','PHISHING URL BLOCKED','ANOMALOUS TRAFFIC','CREDENTIAL STUFFING','BUFFER OVERFLOW','DNS TUNNELLING','REVERSE SHELL','KERBEROASTING ATTEMPT','PASS-THE-HASH','MIMIKATZ SIGNATURE','COBALT STRIKE BEACON'];
const SIEM_COUNTRIES  = ['RU','CN','KP','IR','US','UA','DE','BR','IN','RO','NG','VN'];

// ── Log state ─────────────────────────────────────────────────────────────
let _logScrollPending = false;
// Ambient log lines come from the theme (credits-theme.js logMessages)
let _msgIdx = 0, _lastLogTime = 0;
let _logTickIv = null;

// ── City data for cybermap ────────────────────────────────────────────────
const CITIES = [
  ['LONDON',51.5,-0.1,'EU'],['MOSCOW',55.7,37.6,'RU'],
  ['NEW YORK',40.7,-74.0,'US'],['BEIJING',39.9,116.4,'CN'],
  ['TOKYO',35.7,139.7,'CN'],['BERLIN',52.5,13.4,'EU'],
  ['PARIS',48.9,2.3,'EU'],['DUBAI',25.2,55.3,'ME'],
  ['SINGAPORE',1.35,103.8,'AS'],['SYDNEY',-33.9,151.2,'AS'],
  ['SAO PAULO',-23.5,-46.6,'SA'],['TORONTO',43.7,-79.4,'US'],
  ['SEOUL',37.6,126.9,'CN'],['MUMBAI',19.1,72.9,'AS'],
  ['CAIRO',30.0,31.2,'ME'],['LAGOS',6.5,3.4,'AF'],
  ['MEXICO',19.4,-99.1,'SA'],['CHICAGO',41.9,-87.6,'US'],
  ['STOCKHOLM',59.3,18.1,'EU'],['KYIV',50.5,30.5,'RU'],
  ['TEHRAN',35.7,51.4,'ME'],['BANGKOK',13.8,100.5,'AS'],
];
const REGION_COLS = {US:'#00FF41',EU:'#FFD700',RU:'#FF003C',CN:'#FF6600',AS:'#00FFFF',ME:'#FF66FF',SA:'#AAFFAA',AF:'#FFAA00'};

// ── Operations list for header ────────────────────────────────────────────
const OPERATIONS = ['OPERATION: DARKWIRE','OPERATION: IRONSEAL','OPERATION: NULLROUTE','OPERATION: CYPHERSTORM','OPERATION: GHOSTKEY','OPERATION: BLACKVAULT','OPERATION: ENTROPY'];
let _opIdx = 0;

// ═════════════════════════════════════════════════════════════════════════════
// DOM BUILDER
// ═════════════════════════════════════════════════════════════════════════════

function _buildOverlay() {
    const el = document.createElement('div');
    el.id = 'bond-vis-overlay';
    el.innerHTML = `
<canvas class="bv-matrix"></canvas>
<div class="bv-app">
  <header class="bv-header">
    <div class="bv-logo">
      <canvas class="bv-logo-sprite" id="bv-logo-sprite" width="40" height="40"></canvas>
      <div class="bv-title-block">
        <h1>MISSION COMPLETE // AUDIO INTEL</h1>
        <p>BREAK ESCAPE &nbsp;▸&nbsp; CLASSIFIED DEBRIEF SYSTEM</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <span class="bv-badge red bv-blink">● LIVE</span>
      <span class="bv-badge gold">CLASSIFIED</span>
    </div>
    <div class="bv-status-block">
      <div class="bv-status-line"><span class="label">OPERTN:</span><span class="val" id="bv-op-name">THUNDERBALL</span></div>
      <div class="bv-status-line"><span class="label">STATUS:</span><span class="val bv-blink">MONITORING</span></div>
      <div class="bv-status-line"><span class="label">THREAT:</span><span class="val" id="bv-threat-level" style="color:var(--bv-green)">LOW</span></div>
    </div>
    <button class="bv-close-btn" id="bv-close-btn">✕ CLOSE</button>
  </header>

  <div class="bv-stage">
    <!-- LEFT PANEL: signal analysis -->
    <div class="bv-side-panel">
      <div class="bv-panel-title">▸ SIGNAL ANALYSIS</div>
      <div>
        <div class="bv-stat-row"><span class="sk">BASS</span><span id="bv-bass-val">000</span></div>
        <div class="bv-meter-bar"><div class="bv-meter-fill" id="bv-bass-meter" style="width:0%"></div></div>
      </div>
      <div>
        <div class="bv-stat-row"><span class="sk">MID</span><span id="bv-mid-val">000</span></div>
        <div class="bv-meter-bar"><div class="bv-meter-fill gold-fill" id="bv-mid-meter" style="width:0%"></div></div>
      </div>
      <div>
        <div class="bv-stat-row"><span class="sk">HIGH</span><span id="bv-high-val">000</span></div>
        <div class="bv-meter-bar"><div class="bv-meter-fill" id="bv-high-meter" style="width:0%"></div></div>
      </div>
      <div>
        <div class="bv-stat-row"><span class="sk">PEAK</span><span id="bv-peak-val">000</span></div>
        <div class="bv-meter-bar"><div class="bv-meter-fill gold-fill" id="bv-peak-meter" style="width:0%"></div></div>
      </div>
      <div class="bv-panel-title" style="margin-top:4px">▸ COMMS INTEL</div>
      <div class="bv-log-scroll" id="bv-log-scroll">
        <div class="bv-log-line">&gt; AWAITING AUDIO</div>
      </div>
    </div>

    <!-- CENTRE: visualiser canvas -->
    <div class="bv-vis-centre">
      <div class="bv-vis-wrapper">
        <canvas class="bv-vis-canvas" id="bv-vis-canvas"></canvas>
        <div class="bv-classified">CLASSIFIED</div>
      </div>
    </div>

    <!-- RIGHT PANEL: operative data + mode select -->
    <div class="bv-side-panel">
      <div class="bv-panel-title">▸ OPERATIVE DATA</div>
      <div class="bv-stat-row"><span class="sk">AGENCY</span><span>SAFETYNET</span></div>
      <div class="bv-stat-row"><span class="sk">RANK</span><span>FIELD</span></div>
      <div class="bv-stat-row"><span class="sk">SECTOR</span><span>CYBER</span></div>
      <div class="bv-stat-row"><span class="sk">CLRNC</span><span style="color:var(--bv-gold)">ULTRA</span></div>
      <div class="bv-stat-row"><span class="sk">FREQ</span><span id="bv-freq-disp">---.--</span></div>

      <div class="bv-panel-title" style="margin-top:4px">▸ ENCRYPTION</div>
      <div style="font-family:'VT323',monospace;font-size:11px;color:var(--bv-green);line-height:1.8">
        AES-256-GCM<br>SHA-3/512<br>ECDHE-P384<br>TLS 1.3 ▸ OK<br>PGP 4096b ▸ OK
      </div>

      <div class="bv-panel-title" style="margin-top:4px">▸ VIS MODE</div>
      <div class="bv-mode-group-panel" id="bv-mode-group-panel">
        <button class="bv-btn active" data-mode="cybermap">MAP</button>
        <button class="bv-btn" data-mode="wave">WAVE</button>
        <button class="bv-btn" data-mode="siem">SIEM</button>
        <button class="bv-btn" data-mode="bars">BARS</button>
        <button class="bv-btn" data-mode="circle">RING</button>
        <button class="bv-btn" data-mode="matrix">MTRX</button>
        <button class="bv-btn" data-mode="tunnel">TUNL</button>
        <button class="bv-btn" data-mode="plasma">PLSM</button>
        <button class="bv-btn" data-mode="particles">PRTS</button>
        <button class="bv-btn" data-mode="lissajous">LISS</button>
      </div>
    </div>
  </div>

  <!-- CONTROLS -->
  <div class="bv-controls">
    <div class="bv-mode-group" id="bv-mode-group">
      <button class="bv-btn active" data-mode="cybermap">MAP</button>
      <button class="bv-btn" data-mode="wave">WAVE</button>
      <button class="bv-btn" data-mode="siem">SIEM</button>
      <button class="bv-btn" data-mode="bars">BARS</button>
      <button class="bv-btn" data-mode="circle">RING</button>
      <button class="bv-btn" data-mode="matrix">MTRX</button>
      <button class="bv-btn" data-mode="tunnel">TUNL</button>
      <button class="bv-btn" data-mode="plasma">PLSM</button>
      <button class="bv-btn" data-mode="particles">PRTS</button>
      <button class="bv-btn" data-mode="lissajous">LISS</button>
    </div>
    <div class="bv-track-info" id="bv-track-info"><span>SIGNAL ACTIVE</span></div>
    <button class="bv-btn gold" id="bv-skip-btn">⏭ SKIP</button>
    <button class="bv-btn" id="bv-pause-btn">⏸ PAUSE</button>
    <button class="bv-btn gold active" id="bv-auto-btn">⏱ AUTO</button>
  </div>

  <footer class="bv-footer">
    <span>SAFETYNET // CYBER OPERATIONS DIV</span>
    <div class="bv-ticker">
      <span class="bv-ticker-inner">
        ██ MISSION COMPLETE ██ SIGNAL ENCRYPTED ██ SAFETYNET DIVISION ONLINE ██ ENTROPY CONTAINED ██ MONITORING ALL FREQUENCIES ██ THREAT ASSESSMENT: NOMINAL ██ DARKWIRE PROTOCOL DISENGAGED ██ WELL PLAYED, AGENT ██
      </span>
    </div>
    <span id="bv-clock">00:00:00</span>
  </footer>
</div>
`;

    document.body.appendChild(el);
    return el;
}

// ═════════════════════════════════════════════════════════════════════════════
// MATRIX RAIN
// ═════════════════════════════════════════════════════════════════════════════

// Matrix characters come from the theme (credits-theme.js matrixChars)

function _startMatrixRain() {
    const c = _matrixCv;
    const ctx = c.getContext('2d');
    let W, H, cols, drops;

    function init() {
        W = c.width  = window.innerWidth;
        H = c.height = window.innerHeight;
        cols  = Math.floor(W / 14);
        drops = Array(cols).fill(1);
    }
    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = '12px "VT323", monospace';
        drops.forEach((y, i) => {
            const chars = _themeDef.matrixChars;
            const ch = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillStyle = i % 7 === 0 ? '#FFD700' : '#00FF41';
            ctx.fillText(ch, i * 14, y * 14);
            if (y * 14 > H && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }
    init();
    window.addEventListener('resize', init);
    return setInterval(draw, 50);
}

// ═════════════════════════════════════════════════════════════════════════════
// LOGO SPRITE (SAFETYNET shield icon)
// ═════════════════════════════════════════════════════════════════════════════

function _drawLogoSprite() {
    const c = document.getElementById('bv-logo-sprite');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const s = 4;
    ctx.clearRect(0, 0, c.width, c.height);
    if (_themeDef.logo === 'padlock') {
        // Padlock: shackle, body, keyhole
        const shackle = [[3,1],[4,1],[5,1],[6,1],[2,2],[7,2],[2,3],[7,3]];
        ctx.fillStyle = '#00FFFF';
        shackle.forEach(([x,y]) => ctx.fillRect(x*s, y*s, s, s));
        ctx.fillStyle = '#00FF41';
        for (let y = 4; y <= 8; y++) for (let x = 1; x <= 8; x++) ctx.fillRect(x*s, y*s, s, s);
        ctx.fillStyle = '#000000';
        ctx.fillRect(4*s+2, 5*s, s, s); ctx.fillRect(4*s+2, 6*s, s, s);
        return;
    }
    // Shield shape pixel art
    const shieldPx = [[3,1],[4,1],[5,1],[6,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[3,5],[4,5],[5,5],[6,5],[3,6],[4,6],[5,6],[4,7]];
    ctx.fillStyle = '#00FF41';
    shieldPx.forEach(([x,y]) => ctx.fillRect(x*s, y*s-4, s, s));
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('S/N', 2, 38);
}

// ═════════════════════════════════════════════════════════════════════════════
// CANVAS RESIZE
// ═════════════════════════════════════════════════════════════════════════════

function _resizeVisCanvas() {
    if (!_visCv) return;
    const rect = _visCv.parentElement.getBoundingClientRect();
    _visCv.width  = Math.floor(rect.width  / PIX) * PIX;
    _visCv.height = Math.floor(rect.height / PIX) * PIX;
    mapGlobe = null; // force rebuild on next cybermap frame
}

// ═════════════════════════════════════════════════════════════════════════════
// AUDIO ANALYSIS ENGINE
// ═════════════════════════════════════════════════════════════════════════════

function _fmt(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function analyseAudio(dataArr) {
    const an = MusicController.analyser;
    if (!an) return { avg:0, norm:0, kick:0, snare:0, bass:0, mid:0, high:0, bassRaw:0, midRaw:0, highRaw:0, kickFlash:0, snareFlash:0 };

    const sampleRate = MusicController.context.sampleRate;
    const binHz      = sampleRate / an.fftSize;
    const bufLen     = dataArr.length;

    function bandEnergy(lo, hi) {
        let sum = 0, n = Math.max(1, hi - lo);
        for (let i = lo; i <= hi && i < bufLen; i++) sum += dataArr[i];
        return sum / n / 255;
    }

    // Kick: shifted down to 40–80 Hz to catch sub-boom, away from busy 80–100 Hz region
    const kickLo  = Math.round(40   / binHz), kickHi  = Math.round(80   / binHz);
    // Adjacent band used for ratio-gating (sustained bass synths occupy this equally)
    const adjLo   = Math.round(80   / binHz), adjHi   = Math.round(200  / binHz);
    // Beater click transient confirmation
    const clickLo = Math.round(2000 / binHz), clickHi = Math.min(Math.round(5000 / binHz), bufLen-1);
    const snareLo = Math.round(180  / binHz), snareHi = Math.round(280  / binHz);
    const bassLo  = Math.round(60   / binHz), bassHi  = Math.round(250  / binHz);
    const midLo   = Math.round(250  / binHz), midHi   = Math.min(Math.round(4000  / binHz), bufLen-1);
    const highLo  = Math.round(4000 / binHz), highHi  = Math.min(Math.round(16000 / binHz), bufLen-1);

    // Lazily initialise previous-frame bin buffers for spectral flux
    const kickBinCount  = kickHi  - kickLo  + 1;
    const clickBinCount = clickHi - clickLo + 1;
    if (!_prevKickBins  || _prevKickBins.length  !== kickBinCount)  _prevKickBins  = new Float32Array(kickBinCount);
    if (!_prevClickBins || _prevClickBins.length !== clickBinCount) _prevClickBins = new Float32Array(clickBinCount);

    // Spectral flux: sum positive-only per-bin deltas (onset energy only)
    let kickFlux = 0;
    for (let i = kickLo; i <= kickHi; i++) {
        const cur = dataArr[i] / 255;
        const delta = cur - _prevKickBins[i - kickLo];
        if (delta > 0) kickFlux += delta;
        _prevKickBins[i - kickLo] = cur;
    }
    kickFlux /= kickBinCount;

    let clickFlux = 0;
    for (let i = clickLo; i <= clickHi; i++) {
        const cur = dataArr[i] / 255;
        const delta = cur - _prevClickBins[i - clickLo];
        if (delta > 0) clickFlux += delta;
        _prevClickBins[i - clickLo] = cur;
    }
    clickFlux /= clickBinCount;

    // Ratio gate: kick flux must dominate adjacent band to reject sustained bass
    const adjEnergy = bandEnergy(adjLo, adjHi);
    const kickRaw   = kickFlux / Math.max(0.02, adjEnergy + kickFlux) ; // suppressed when bass fills both bands equally

    const snareRaw = bandEnergy(snareLo, snareHi);
    const bassRaw  = bandEnergy(bassLo,  bassHi);
    const midRaw   = bandEnergy(midLo,   midHi);
    const highRaw  = bandEnergy(highLo,  highHi);
    const avgRaw   = bassRaw * 0.4 + midRaw * 0.4 + highRaw * 0.2;

    function updateCeil(ceil, val) {
        return Math.max(0.04, ceil + (val - ceil) * (val > ceil ? 0.003 : 0.025));
    }
    ceilBass = updateCeil(ceilBass, bassRaw);
    ceilMid  = updateCeil(ceilMid,  midRaw);
    ceilHigh = updateCeil(ceilHigh, highRaw);
    ceilAvg  = updateCeil(ceilAvg,  avgRaw);

    const norm  = Math.min(1, avgRaw  / ceilAvg);
    const bassN = Math.min(1, bassRaw / ceilBass);
    const midN  = Math.min(1, midRaw  / ceilMid);
    const highN = Math.min(1, highRaw / ceilHigh);

    // Faster release (0.18 vs 0.08) so envelope drops quickly between hits,
    // keeping kickSmooth low and kickDelta detectable in compressed mixes
    const KICK_ATTACK = 0.6, KICK_RELEASE = 0.18;
    const kickAlpha  = kickRaw  > kickSmooth  ? KICK_ATTACK  : KICK_RELEASE;
    const snareAlpha = snareRaw > snareSmooth ? KICK_ATTACK  : 0.08;
    kickSmooth  += (kickRaw  - kickSmooth)  * kickAlpha;
    snareSmooth += (snareRaw - snareSmooth) * snareAlpha;

    kickPeak  = Math.max(kickPeak  * 0.995, kickRaw);
    snarePeak = Math.max(snarePeak * 0.995, snareRaw);
    const kickN  = Math.min(1, kickPeak  > 0.01 ? kickRaw  / kickPeak  : 0);
    const snareN = Math.min(1, snarePeak > 0.01 ? snareRaw / snarePeak : 0);

    const kickDelta  = kickRaw  - kickSmooth;
    const snareDelta = snareRaw - snareSmooth;
    kickCooldown  = Math.max(0, kickCooldown  - 1);
    snareCooldown = Math.max(0, snareCooldown - 1);

    // Ratio-gating already suppresses sustained bass. Click confirmation is a soft bonus —
    // many heavily produced kicks have the beater transient compressed away, so a large
    // enough delta alone can also fire (no click required above 0.15).
    const clickConfirm = clickFlux > 0.02;
    kickHit  = kickDelta > 0.08 && kickFlux > 0.03 && (clickConfirm || kickDelta > 0.15) && kickCooldown === 0;
    snareHit = snareDelta > 0.07 && snareCooldown === 0;
    if (kickHit && snareHit && kickRaw > snareRaw * 1.3) snareHit = false;

    if (kickHit)  { kickFlash = 1.0;  kickCooldown  = 16; }
    if (snareHit) { snareFlash = 1.0; snareCooldown = 10; }
    kickFlash  = Math.max(0, kickFlash  - 0.07);
    snareFlash = Math.max(0, snareFlash - 0.06);

    // Smooth kickN before exposing it — the ratio-based kickRaw is noisier than
    // the old energy average, so raw kickN flickers in continuous visualizations.
    kickNSmooth += (kickN - kickNSmooth) * (kickN > kickNSmooth ? 0.5 : 0.12);

    energyHistory[histIdx % HIST_LEN] = norm;
    histIdx++;

    return { avg:norm, norm, kick:kickNSmooth, snare:snareN, bass:bassN, mid:midN, high:highN, bassRaw, midRaw, highRaw, kickFlash, snareFlash };
}

// ═════════════════════════════════════════════════════════════════════════════
// PIXEL DRAW HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function px(x, y, w, h, color) {
    _visCtx.fillStyle = color;
    _visCtx.fillRect(Math.round(x/PIX)*PIX, Math.round(y/PIX)*PIX, Math.round(w/PIX)*PIX||PIX, Math.round(h/PIX)*PIX||PIX);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DRAW LOOP
// ═════════════════════════════════════════════════════════════════════════════

function _draw() {
    if (!_open) return;
    const W = _visCv.width, H = _visCv.height;
    const an = MusicController.analyser;
    const bufLen = an ? an.frequencyBinCount : 256;
    const dataArr = new Uint8Array(bufLen);
    const waveArr = new Uint8Array(an ? an.fftSize : 2048);

    if (an) {
        an.getByteFrequencyData(dataArr);
        an.getByteTimeDomainData(waveArr);
    }

    const audio = analyseAudio(dataArr);
    const { avg, norm, kick, snare, bass, mid, high } = audio;

    // Background
    if (['tunnel','plasma','particles','lissajous','cybermap'].includes(_currentMode)) {
        _visCtx.fillStyle = `rgba(0,0,5,${kickHit ? 0.35 : 0.22})`;
        _visCtx.fillRect(0, 0, W, H);
    } else {
        _visCtx.fillStyle = '#000005';
        _visCtx.fillRect(0, 0, W, H);
        _visCtx.fillStyle = 'rgba(0,255,65,0.015)';
        for (let gx=0;gx<W;gx+=PIX*4) _visCtx.fillRect(gx,0,1,H);
        for (let gy=0;gy<H;gy+=PIX*4) _visCtx.fillRect(0,gy,W,1);
    }

    if      (_currentMode === 'bars')      drawBars(dataArr, W, H, audio);
    else if (_currentMode === 'wave')      drawWave(waveArr, W, H, audio);
    else if (_currentMode === 'circle')    drawCircle(dataArr, W, H, audio);
    else if (_currentMode === 'matrix')    drawMatrixVis(dataArr, W, H, audio);
    else if (_currentMode === 'tunnel')    drawTunnel(dataArr, waveArr, W, H, audio);
    else if (_currentMode === 'plasma')    drawPlasma(dataArr, W, H, audio);
    else if (_currentMode === 'particles') drawParticles(dataArr, W, H, audio);
    else if (_currentMode === 'lissajous') drawLissajous(waveArr, dataArr, W, H, audio);
    else if (_currentMode === 'cybermap')  drawCyberMap(dataArr, waveArr, W, H, audio);
    else if (_currentMode === 'siem')      drawSIEM(dataArr, W, H, audio);

    // Kick: gold border punch
    if (kickFlash > 0.05) {
        _visCtx.strokeStyle = `rgba(255,215,0,${kickFlash * 0.7})`;
        _visCtx.lineWidth = Math.ceil(kickFlash * 10);
        _visCtx.strokeRect(4, 4, W-8, H-8);
    }
    // Snare: white strobe
    if (snareFlash > 0.05) {
        _visCtx.fillStyle = `rgba(255,255,220,${snareFlash * 0.10})`;
        _visCtx.fillRect(0, 0, W, H);
    }

    _updateStats(dataArr, audio);
    _animId = requestAnimationFrame(_draw);
}

// ═════════════════════════════════════════════════════════════════════════════
// VISUALISER MODES
// ═════════════════════════════════════════════════════════════════════════════

function drawBars(data, W, H, audio) {
    const count = Math.floor(W / (PIX * 3));
    const barW = PIX * 2, gap = PIX;
    const step = Math.max(1, Math.floor(data.length / count));
    const groundY = H - PIX*2;
    const heightBoost = 1.0 + kickFlash * 0.5;

    for (let x=0;x<W;x+=PIX) px(x, groundY, PIX, PIX, kickHit ? '#FFFFFF' : '#FFD700');

    for (let i=0;i<count;i++) {
        const val = data[i*step] / 255;
        const normVal = Math.min(1, val / Math.max(0.05, audio.norm < 0.1 ? 0.5 : 1.0));
        const bH = Math.max(PIX, Math.floor(normVal * (H-PIX*4) * heightBoost / PIX) * PIX);
        const x = i * (barW + gap);
        const y = groundY - bH;
        const r = snareFlash > 0.3 ? 255 : Math.floor(255 * (1-normVal));
        const g = Math.floor(255 * Math.min(1, normVal*1.5));
        const b = Math.floor(255 * Math.max(0, normVal-0.6)*2.5);
        const col = `rgb(${r},${g},${b})`;
        for (let by=y;by<groundY;by+=PIX) {
            const brightness = (by - y) / bH;
            px(x, by, barW, PIX, brightness < 0.15 ? '#FFFFFF' : col);
        }
        px(x-PIX, y-PIX, barW+PIX*2, PIX, '#FFD700');
    }
    draw007Stamp(W/2-40, H-60, audio.avg);
}

function drawWave(data, W, H, audio) {
    const midY = H/2, step = W / data.length;
    for (let i=1;i<data.length;i++) {
        const y1 = midY + (data[i-1]-128)/128*(H*0.4)*(1+kickFlash*0.4);
        const y2 = midY + (data[i]  -128)/128*(H*0.4)*(1+kickFlash*0.4);
        const x1=(i-1)*step, x2=i*step;
        const dx=x2-x1, dy=y2-y1;
        const steps=Math.max(Math.abs(dx),Math.abs(dy))/PIX;
        for (let t=0;t<=steps;t++) {
            const bright=Math.abs(data[i]-128)/128;
            px(x1+dx*(t/steps), y1+dy*(t/steps), PIX, PIX, bright>0.5?'#FFD700':'#00FF41');
        }
    }
    const cw=40,ch=40;
    px(W/2-cw/2, H/2, cw, PIX, 'rgba(255,215,0,0.5)');
    px(W/2, H/2-ch/2, PIX, ch, 'rgba(255,215,0,0.5)');
}

function drawCircle(data, W, H, audio) {
    const { avg, kick, snare } = audio;
    const cx=W/2, cy=H/2;
    const baseR=Math.min(W,H)*(0.25+kickFlash*0.06);
    const count=data.length;
    for (let r=baseR-PIX*4;r<=baseR+PIX*4;r+=PIX) {
        const col=r===baseR?(kickHit?'#FFFFFF':'#FFD700'):'rgba(255,215,0,0.2)';
        for (let a=0;a<360;a+=2) {
            const rad=a*Math.PI/180;
            px(cx+Math.cos(rad)*r, cy+Math.sin(rad)*r, PIX, PIX, col);
        }
    }
    for (let i=0;i<count;i++) {
        const angle=(i/count)*Math.PI*2-Math.PI/2;
        const val=data[i]/255;
        const r1=baseR, r2=baseR+val*baseR*(0.8+kickFlash*0.4);
        const col=snareFlash>0.3?'#FFFFFF':val>0.7?'#FFD700':val>0.4?'#00FFFF':'#00FF41';
        for (let r=r1;r<r2;r+=PIX) px(cx+Math.cos(angle)*r, cy+Math.sin(angle)*r, PIX, PIX, col);
    }
    _visCtx.font='900 20px "Press Start 2P",monospace';
    _visCtx.fillStyle=`rgba(255,215,0,${0.4+avg*0.6})`;
    _visCtx.textAlign='center'; _visCtx.textBaseline='middle';
    if (_themeDef.centreLabel) _visCtx.fillText(_themeDef.centreLabel, cx, cy);
    _visCtx.textAlign='left'; _visCtx.textBaseline='alphabetic';
}

function drawMatrixVis(data, W, H, audio) {
    const { avg } = audio;
    const cols=Math.floor(W/(PIX*3)), rows=Math.floor(H/(PIX*2));
    for (let c=0;c<cols;c++) {
        const val=data[Math.floor(c*data.length/cols)]/255;
        const litRows=Math.floor(val*rows*(1+kickFlash*0.3));
        for (let r=rows-1;r>=rows-litRows;r--) {
            const intensity=(rows-r)/Math.max(1,litRows);
            const col=snareFlash>0.3?'#FFFFFF':intensity>0.8?'#FFFFFF':intensity>0.5?'#FFD700':'#00FF41';
            const ch=Math.random()>0.9?String.fromCharCode(65+Math.floor(Math.random()*58)):'█';
            _visCtx.font=`${PIX*2}px "VT323",monospace`;
            _visCtx.fillStyle=col;
            _visCtx.fillText(ch, c*PIX*3, r*PIX*2+PIX*2);
        }
    }
}

function drawTunnel(data, wave, W, H, audio) {
    const avg=audio.avg, bass=audio.kick;
    const cx=W/2, cy=H/2;
    tunnelAngle += 0.012+avg*0.04+kickFlash*0.08;
    tunnelZoom  += 0.008+bass*0.03+kickFlash*0.04;
    const rings=18;
    for (let r=rings;r>=0;r--) {
        const frac=r/rings, zoom=((tunnelZoom*0.3+frac)%1.0);
        const radius=zoom*Math.min(W,H)*0.72;
        const sides=6+(r%3)*2;
        const angleOff=tunnelAngle*(r%2===0?1:-1)+(r*0.18);
        const freqIdx=Math.floor(r/rings*data.length);
        const freqVal=data[freqIdx]/255;
        let col;
        if (zoom>0.7)      col=`rgba(255,${Math.floor(215*freqVal)},0,${0.6*zoom})`;
        else if (zoom>0.4) col=`rgba(0,${Math.floor(200+55*freqVal)},${Math.floor(255*zoom)},0.7)`;
        else               col=`rgba(0,${Math.floor(255*freqVal)},${Math.floor(65+190*zoom)},0.8)`;
        _visCtx.fillStyle=col;
        for (let s=0;s<sides;s++) {
            const a1=angleOff+(s/sides)*Math.PI*2;
            const a2=angleOff+((s+1)/sides)*Math.PI*2;
            const x1=cx+Math.cos(a1)*radius, y1=cy+Math.sin(a1)*radius;
            const x2=cx+Math.cos(a2)*radius, y2=cy+Math.sin(a2)*radius;
            const steps=Math.max(2,Math.floor(radius*0.15));
            for (let t=0;t<steps;t++) {
                const fx=x1+(x2-x1)*(t/steps), fy=y1+(y2-y1)*(t/steps);
                _visCtx.fillRect(Math.round(fx/PIX)*PIX, Math.round(fy/PIX)*PIX, PIX, PIX);
            }
        }
    }
}

let _plasmaT = 0;
function drawPlasma(data, W, H, audio) {
    const avg=audio.avg, bass=audio.kick, high=audio.high;
    _plasmaT += 0.025+avg*0.04;
    const step=PIX*3;
    for (let y=0;y<H;y+=step) {
        for (let x=0;x<W;x+=step) {
            const nx=x/W, ny=y/H;
            const v1=Math.sin(nx*8+_plasmaT), v2=Math.sin(ny*6-_plasmaT*0.7);
            const v3=Math.sin((nx+ny)*5+_plasmaT*1.3+bass*4);
            const v4=Math.sin(Math.sqrt((nx-0.5)**2+(ny-0.5)**2)*12-_plasmaT*2+high*3);
            const t=((v1+v2+v3+v4)/4+1)/2;
            let r,g,b;
            if (t<0.25)      { r=0; g=Math.floor(255*t*4); b=Math.floor(65+190*t*4); }
            else if (t<0.5)  { const tt=(t-0.25)*4; r=Math.floor(255*tt); g=255; b=Math.floor(65*(1-tt)); }
            else if (t<0.75) { const tt=(t-0.5)*4; r=255; g=Math.floor(215*(1-tt*0.5)); b=0; }
            else             { const tt=(t-0.75)*4; r=Math.floor(255*(1-tt*0.6)); g=Math.floor(50*tt); b=Math.floor(60*tt); }
            _visCtx.fillStyle=`rgba(${r},${g},${b},${0.5+avg*0.5})`;
            _visCtx.fillRect(x,y,step,step);
        }
    }
    const sz=Math.floor(14+avg*8);
    _visCtx.font=`700 ${sz}px "Press Start 2P"`;
    _visCtx.textAlign='center'; _visCtx.textBaseline='middle';
    _visCtx.textAlign='left'; _visCtx.textBaseline='alphabetic';
}

function spawnParticle(W, H, avg, data) {
    const angle=Math.random()*Math.PI*2;
    const speed=0.5+avg*4+Math.random()*2;
    const fi=Math.floor(Math.random()*data.length);
    const energy=data[fi]/255;
    const size=energy>0.7?PIX*3:energy>0.4?PIX*2:PIX;
    const col=fi<8?`hsl(45,100%,${40+Math.floor(energy*40)}%)`:fi<24?`hsl(145,100%,${30+Math.floor(energy*40)}%)`:`hsl(185,100%,${40+Math.floor(energy*40)}%)`;
    particleList.push({x:W/2+(Math.random()-0.5)*40,y:H/2+(Math.random()-0.5)*40,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.008+Math.random()*0.012,size,col,energy});
}
function drawParticles(data, W, H, audio) {
    const avg=audio.avg, bass=audio.kick;
    const spawnN=Math.floor(avg*12)+(kickHit?30:bass>0.4?8:2);
    for (let i=0;i<spawnN&&particleList.length<MAX_PARTICLES;i++) spawnParticle(W,H,avg,data);
    const cx=W/2, cy=H/2;
    particleList=particleList.filter(p=>p.life>0);
    for (const p of particleList) {
        const dx=p.x-cx, dy=p.y-cy, dist=Math.sqrt(dx*dx+dy*dy)||1;
        const force=bass>0.5?0.15:-0.04;
        p.vx+=(dx/dist)*force; p.vy+=(dy/dist)*force;
        const twist=0.015+avg*0.03;
        const tvx=p.vx*Math.cos(twist)-p.vy*Math.sin(twist);
        const tvy=p.vx*Math.sin(twist)+p.vy*Math.cos(twist);
        p.vx=tvx*0.995; p.vy=tvy*0.995;
        p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
        _visCtx.globalAlpha=p.life;
        _visCtx.fillStyle=p.col;
        const sx=Math.round(p.x/PIX)*PIX, sy=Math.round(p.y/PIX)*PIX;
        _visCtx.fillRect(sx,sy,p.size,p.size);
        if (p.energy>0.7) { _visCtx.fillStyle='#FFFFFF'; _visCtx.fillRect(sx,sy,PIX,PIX); }
    }
    _visCtx.globalAlpha=1;
    const cr=20+Math.floor(avg*30);
    _visCtx.fillStyle=`rgba(255,215,0,${0.3+avg*0.5})`;
    _visCtx.fillRect(cx-cr,cy,cr*2,1); _visCtx.fillRect(cx,cy-cr,1,cr*2);
}

let _lissT = 0;
function drawLissajous(wave, data, W, H, audio) {
    const avg=audio.avg, bass=audio.kick;
    const cx=W/2, cy=H/2;
    _lissT+=0.003+avg*0.008+kickFlash*0.02;
    const scale=Math.min(W,H)*0.42*(1+kickFlash*0.15);
    const curves=[{fx:1,fy:2,phase:_lissT,col:'#00FF41'},{fx:3,fy:2,phase:_lissT*1.3,col:'#FFD700'},{fx:5,fy:4,phase:_lissT*0.7,col:'#00FFFF'},{fx:3,fy:4,phase:_lissT*1.7,col:'#FF003C'}];
    const half=Math.floor(wave.length/2), steps=320;
    for (const c of curves) {
        _visCtx.fillStyle=c.col;
        for (let i=0;i<steps;i++) {
            const t=(i/steps)*Math.PI*2;
            const wx=(wave[i%half]-128)/128*bass*0.35;
            const wy=(wave[(i+half)%wave.length]-128)/128*bass*0.35;
            const x=cx+(Math.sin(c.fx*t+c.phase)+wx)*scale*(0.5+avg*0.5);
            const y=cy+(Math.sin(c.fy*t)+wy)*scale*(0.5+avg*0.5);
            _visCtx.fillRect(Math.round(x/PIX)*PIX, Math.round(y/PIX)*PIX, PIX, PIX);
        }
    }
}

// ── CyberMap ──────────────────────────────────────────────────────────────

function latLonToXY(lat, lon, W, H) {
    return [((lon+180)/360)*W, ((90-lat)/180)*H];
}
function pixDot(x, y, r, col) {
    _visCtx.fillStyle=col;
    for (let dy=-r;dy<=r;dy+=PIX) for (let dx=-r;dx<=r;dx+=PIX)
        if (dx*dx+dy*dy<=r*r) _visCtx.fillRect(Math.round((x+dx)/PIX)*PIX, Math.round((y+dy)/PIX)*PIX, PIX, PIX);
}
function drawAttackArc(x1,y1,x2,y2,col,progress,width) {
    const mx=(x1+x2)/2, my=(y1+y2)/2, dx=x2-x1, dy=y2-y1;
    const len=Math.sqrt(dx*dx+dy*dy);
    const cpx=mx-dy*0.4, cpy=my-Math.abs(len)*0.35;
    const steps=Math.max(20,Math.floor(len/6));
    const endStep=Math.floor(steps*progress);
    _visCtx.fillStyle=col;
    for (let i=0;i<=endStep;i++) {
        const t=i/steps;
        const bx=(1-t)*(1-t)*x1+2*(1-t)*t*cpx+t*t*x2;
        const by=(1-t)*(1-t)*y1+2*(1-t)*t*cpy+t*t*y2;
        const isHead=i>endStep-3;
        _visCtx.globalAlpha=isHead?1.0:0.1+(i/steps)*0.35;
        const sz=isHead?width*2:width;
        _visCtx.fillRect(Math.round(bx/PIX)*PIX, Math.round(by/PIX)*PIX, sz, sz);
    }
    _visCtx.globalAlpha=1;
}

function _buildGlobe(W, H) {
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = H;
    const octx = oc.getContext('2d');
    octx.imageSmoothingEnabled = false;

    // [lon, lat] polygon outlines — filled via canvas path then sampled as pixel-art dots
    const landMasses = [
        // ── North America ──
        [[-168,71],[-155,71],[-140,70],[-125,70],[-110,70],[-96,73],[-85,74],[-78,73],
         [-72,67],[-64,63],[-60,46],[-56,47],[-66,44],[-70,43],[-76,42],[-76,34],
         [-80,25],[-82,24],[-84,21],[-87,15],[-83,9],[-77,8],[-75,10],[-77,20],
         [-87,16],[-90,16],[-92,18],[-97,19],[-104,19],[-105,20],[-109,22],[-110,24],
         [-117,32],[-120,34],[-124,37],[-124,42],[-124,49],[-130,54],[-135,57],
         [-140,59],[-148,60],[-152,60],[-158,60],[-162,61],[-165,64],[-168,66],[-168,71]],
        // ── Greenland ──
        [[-45,83],[-25,83],[-18,77],[-18,72],[-25,68],[-36,65],[-44,60],[-50,64],
         [-52,67],[-54,72],[-50,78],[-45,83]],
        // ── Iceland ──
        [[-24,63],[-14,63],[-13,65],[-16,66],[-22,66],[-24,65],[-24,63]],
        // ── South America (north block) ──
        [[-82,12],[-34,12],[-34,-5],[-82,-5],[-82,12]],
        // ── South America (middle block) ──
        [[-82,-5],[-34,-5],[-38,-20],[-82,-20],[-82,-5]],
        // ── South America (lower block) ──
        [[-74,-20],[-48,-20],[-48,-35],[-74,-35],[-74,-20]],
        // ── South America (Patagonian tail) ──
        [[-74,-35],[-52,-35],[-52,-40],[-68,-55],[-69,-56],[-66,-56],[-62,-50],[-58,-40],[-52,-35]],
        // ── Europe ──
        [[-9,36],[-6,36],[-5,38],[-5,44],[-2,44],[0,44],[2,43],[5,43],[8,44],
         [10,44],[12,44],[14,41],[15,38],[16,38],[18,40],[20,38],[22,38],[25,38],
         [26,38],[28,40],[29,41],[28,44],[28,46],[30,46],[28,48],[26,48],[24,48],
         [22,49],[18,50],[15,51],[14,54],[10,55],[8,55],[5,52],[2,51],[0,51],
         [-2,49],[-4,48],[-5,48],[-5,44],[-8,44],[-9,39],[-9,36]],
        // ── Scandinavia ──
        [[5,58],[8,58],[10,57],[12,56],[14,56],[16,56],[18,57],[20,59],[24,60],
         [26,60],[28,64],[28,68],[26,70],[24,70],[22,68],[20,68],[18,69],[16,70],
         [14,68],[14,66],[12,64],[10,63],[8,60],[7,58],[5,58]],
        // ── UK ──
        [[-5,50],[-3,50],[0,51],[1,52],[0,53],[-2,54],[-4,56],[-3,58],[-5,58],
         [-6,57],[-5,56],[-4,54],[-3,53],[-5,52],[-5,50]],
        // ── Africa (Maghreb + Sahel) ──
        [[-17,15],[-16,10],[-13,6],[-10,5],[-5,5],
         [0,5],[4,4],[6,4],[9,2],[10,1],[12,1],
         [14,3],[16,4],[18,4],[22,4],[24,2],[26,0],[28,0],
         [30,2],[32,2],[34,4],[36,4],[38,6],[40,8],[42,10],[44,11],
         [37,22],[34,30],[32,31],[30,32],[28,34],[26,34],
         [24,34],[22,34],[20,34],[16,34],[12,34],[8,34],
         [4,34],[0,34],[-4,34],[-8,34],[-10,32],[-12,30],
         [-14,22],[-14,18],[-16,18],[-17,15]],
        // ── Africa West + Central ──
        [[-17,15],[-16,18],[-14,18],[-14,22],[-12,30],[-10,32],
         [-8,34],[-4,34],[0,34],[4,34],[8,34],[12,34],[16,34],
         [20,34],[24,34],[26,34],[28,34],[28,20],[28,10],[28,0],
         [26,0],[24,2],[22,4],[18,4],[16,4],[14,3],[12,1],
         [10,1],[9,2],[6,4],[4,4],[0,5],[-5,5],[-10,5],
         [-13,6],[-16,10],[-17,15]],
        // ── Africa South ──
        [[28,0],[30,2],[34,4],[36,4],[38,6],[40,4],
         [38,0],[36,-4],[34,-8],[34,-14],[32,-20],[30,-26],
         [28,-30],[26,-34],[24,-34],[22,-34],[20,-35],[18,-34],
         [16,-30],[14,-24],[12,-18],[12,-14],[10,-8],[8,-4],
         [6,-2],[4,0],[2,4],[0,5],[4,4],[6,4],[9,2],
         [10,1],[12,1],[14,3],[16,4],[18,4],[22,4],[24,2],
         [26,0],[28,0]],
        // ── Madagascar ──
        [[44,-12],[48,-14],[50,-18],[50,-24],[46,-26],[44,-22],[43,-18],[44,-12]],
        // ── Asia (main) ──
        [[26,42],[28,42],[30,40],[34,38],[36,36],[36,32],[38,28],[42,26],[44,26],
         [48,28],[50,30],[52,28],[55,24],[58,22],[60,22],[64,22],[68,20],[70,22],
         [72,20],[72,8],[74,8],[76,10],[78,10],[80,14],[82,16],[86,20],[88,22],
         [92,22],[94,22],[96,22],[98,16],[100,6],[102,2],[104,1],[106,2],[106,6],
         [108,10],[108,14],[108,16],[110,18],[112,22],[114,22],[116,22],[118,24],
         [120,28],[122,30],[122,36],[124,40],[126,40],[128,42],[130,42],[132,42],
         [134,46],[136,46],[138,44],[140,40],[140,36],[138,34],[136,34],[134,34],
         [132,32],[128,34],[126,36],[124,38],[124,42],[126,46],[128,50],[130,52],
         [134,54],[138,58],[140,60],[142,52],[144,46],[145,44],[148,46],[150,50],
         [150,54],[142,54],[138,54],[136,56],[136,60],[138,66],[138,70],[150,70],
         [162,68],[168,64],[168,60],[160,58],[158,54],[162,52],[166,54],[168,60],
         [168,71],[148,72],[130,72],[115,72],[105,74],[100,76],[90,76],[80,73],
         [70,73],[60,70],[50,70],[45,68],[40,68],[34,68],[28,68],[24,64],[22,60],
         [24,58],[26,56],[26,52],[28,50],[28,46],[26,44],[26,42]],
        // ── Indian Subcontinent ──
        [[62,24],[68,22],[72,20],[72,8],[76,8],[78,8],[80,10],[80,14],[82,16],
         [80,20],[78,24],[76,28],[72,28],[70,22],[68,22],[64,22],[62,24]],
        // ── Japan ──
        [[130,31],[132,32],[134,34],[136,35],[138,36],[140,38],[141,40],[141,42],
         [140,44],[138,44],[136,42],[136,40],[134,36],[132,34],[130,33],[130,31]],
        // ── Sumatra ──
        [[96,5],[100,2],[104,0],[106,-2],[106,-4],[106,-6],[104,-4],[102,-2],
         [100,0],[98,2],[96,4],[96,5]],
        // ── Java / Indonesia ──
        [[106,-6],[108,-6],[110,-8],[112,-8],[114,-8],[116,-8],[118,-8],[120,-10],
         [122,-10],[124,-10],[124,-8],[122,-6],[120,-6],[118,-6],[116,-6],[114,-6],
         [112,-6],[110,-6],[108,-6],[106,-6]],
        // ── Borneo ──
        [[108,2],[112,2],[114,4],[116,6],[118,6],[118,4],[118,2],[116,0],[114,-2],
         [112,-2],[110,0],[108,0],[108,2]],
        // ── Australia ──
        [[114,-22],[116,-20],[118,-20],[120,-20],[122,-18],[126,-14],[130,-12],
         [132,-12],[136,-12],[138,-12],[140,-14],[142,-10],[142,-14],[144,-14],
         [146,-18],[148,-20],[150,-22],[152,-24],[152,-26],[150,-28],[148,-32],
         [150,-34],[148,-38],[144,-38],[142,-38],[140,-36],[138,-34],[136,-34],
         [134,-32],[132,-32],[130,-32],[128,-34],[126,-34],[122,-34],[118,-32],
         [116,-30],[114,-26],[114,-22]],
        // ── New Zealand North ──
        [[172,-34],[174,-36],[178,-38],[178,-40],[176,-40],[174,-38],[172,-36],[172,-34]],
        // ── New Zealand South ──
        [[166,-46],[168,-44],[170,-42],[172,-42],[172,-44],[170,-46],[168,-46],[166,-46]],
        // ── Sri Lanka ──
        [[80,10],[80,8],[82,6],[82,8],[80,10]],
        // ── Philippines ──
        [[118,18],[120,18],[122,16],[122,12],[120,10],[118,10],[118,12],[118,14],[118,18]],
    ];

    // Fill each polygon on a temp canvas, then read pixels back as pixel-art dots
    for (const poly of landMasses) {
        const tmp = document.createElement('canvas');
        tmp.width = W; tmp.height = H;
        const tctx = tmp.getContext('2d');
        tctx.beginPath();
        poly.forEach(([lon, lat], i) => {
            const [px, py] = latLonToXY(lat, lon, W, H);
            i === 0 ? tctx.moveTo(px, py) : tctx.lineTo(px, py);
        });
        tctx.closePath();
        tctx.fillStyle = '#00FF41';
        tctx.fill();

        const imgData = tctx.getImageData(0, 0, W, H);
        const step = PIX * 2;
        octx.fillStyle = 'rgba(0,255,65,0.55)';
        for (let py = 0; py < H; py += step) {
            for (let px2 = 0; px2 < W; px2 += step) {
                const idx = (py * W + px2) * 4;
                if (imgData.data[idx + 3] > 128) {
                    octx.fillRect(Math.round(px2/PIX)*PIX, Math.round(py/PIX)*PIX, PIX, PIX);
                }
            }
        }
    }

    // Graticule — subtle lat/lon grid lines
    octx.fillStyle = 'rgba(0,60,20,0.3)';
    for (let lat = -80; lat <= 80; lat += 30) {
        for (let lon = -180; lon <= 180; lon += 3) {
            const [gx, gy] = latLonToXY(lat, lon, W, H);
            octx.fillRect(Math.round(gx/PIX)*PIX, Math.round(gy/PIX)*PIX, 1, 1);
        }
    }
    for (let lon = -180; lon <= 180; lon += 30) {
        for (let lat = -80; lat <= 80; lat += 1.5) {
            const [gx, gy] = latLonToXY(lat, lon, W, H);
            octx.fillRect(Math.round(gx/PIX)*PIX, Math.round(gy/PIX)*PIX, 1, 1);
        }
    }

    return oc;
}

function spawnAttack(W, H, energy) {
    const si=Math.floor(Math.random()*CITIES.length);
    let di=Math.floor(Math.random()*CITIES.length);
    while(di===si) di=Math.floor(Math.random()*CITIES.length);
    const src=CITIES[si], dst=CITIES[di];
    const [x1,y1]=latLonToXY(src[1],src[2],W,H);
    const [x2,y2]=latLonToXY(dst[1],dst[2],W,H);
    const col=REGION_COLS[src[3]]||'#00FF41';
    attackArcs.push({x1,y1,x2,y2,col,progress:0,speed:0.008+energy*0.025+Math.random()*0.012,srcName:src[0],dstName:dst[0],energy,width:energy>0.7?PIX*2:PIX});
}

function drawCyberMap(data, wave, W, H, audio) {
    const avg=audio.avg, bass=audio.kick, mid=audio.mid, high=audio.high;
    mapFrame++;
    if (!mapGlobe||mapGlobe.width!==W||mapGlobe.height!==H) mapGlobe=_buildGlobe(W,H);
    _visCtx.fillStyle='rgba(0,2,8,0.55)'; _visCtx.fillRect(0,0,W,H);
    _visCtx.globalAlpha=0.85; _visCtx.drawImage(mapGlobe,0,0); _visCtx.globalAlpha=1;

    const spawnThresh=kickHit?0:bass>0.35?3:10;
    if (mapFrame-lastBassHit>spawnThresh) {
        const count=kickHit?4:snareHit?2:bass>0.4?2:1;
        for (let i=0;i<count;i++) spawnAttack(W,H,avg);
        lastBassHit=mapFrame;
    }
    attackArcs=attackArcs.filter(a=>a.progress<=1.05);
    for (const arc of attackArcs) {
        arc.progress+=arc.speed*(1+avg*0.5);
        if (arc.progress>1) arc.progress=1;
        let col=arc.col;
        if (arc.energy>0.7) col='#FF003C';
        else if (arc.energy>0.45) col='#FFD700';
        drawAttackArc(arc.x1,arc.y1,arc.x2,arc.y2,col,arc.progress,arc.width);
        if (arc.progress>=1.0&&!arc._impacted) {
            arc._impacted=true;
            mapPulses.push({x:arc.x2,y:arc.y2,r:PIX*2,maxR:12+arc.energy*20,col,alpha:1.0});
            addLog(`> ATTACK: ${arc.srcName} \u2192 ${arc.dstName}`, arc.energy>0.6?'alert':'warn');
        }
    }
    attackArcs=attackArcs.filter(a=>a.progress<1.0||!a._impacted||(mapFrame-(a._doneFrame||mapFrame))<8);
    attackArcs.forEach(a=>{ if(a._impacted&&!a._doneFrame) a._doneFrame=mapFrame; });

    for (const city of CITIES) {
        const [cx2,cy2]=latLonToXY(city[1],city[2],W,H);
        const col=REGION_COLS[city[3]]||'#00FF41';
        const isActive=attackArcs.some(a=>(Math.abs(a.x1-cx2)<8&&Math.abs(a.y1-cy2)<8)||(Math.abs(a.x2-cx2)<8&&Math.abs(a.y2-cy2)<8));
        pixDot(cx2,cy2,isActive?PIX*3:PIX*2,isActive?'#FFFFFF':col);
        if (isActive) { _visCtx.font='4px "Press Start 2P"'; _visCtx.fillStyle=col; _visCtx.fillText(city[0],cx2+PIX*2,cy2-PIX*2); }
    }
    mapPulses=mapPulses.filter(p=>p.alpha>0);
    for (const p of mapPulses) {
        p.r+=1.2+avg*2; p.alpha-=0.025;
        _visCtx.globalAlpha=p.alpha;
        for (let a=0;a<360;a+=8) { const rad=a*Math.PI/180; _visCtx.fillStyle=p.col; _visCtx.fillRect(Math.round((p.x+Math.cos(rad)*p.r)/PIX)*PIX, Math.round((p.y+Math.sin(rad)*p.r)/PIX)*PIX, PIX, PIX); }
        _visCtx.globalAlpha=1;
    }
    if (bass>0.72) { _visCtx.fillStyle=`rgba(255,60,0,${(bass-0.72)*0.25})`; _visCtx.fillRect(0,0,W,H); }
    _visCtx.font='6px "Press Start 2P"'; _visCtx.fillStyle='rgba(255,215,0,0.35)'; _visCtx.textAlign='right';
    _visCtx.fillText('BREAK ESCAPE // GLOBAL THREAT MAP',W-PIX*2,PIX*8); _visCtx.textAlign='left';
}

// ── SIEM ──────────────────────────────────────────────────────────────────

SIEM_SEVERITIES.forEach(s => siemRuleHits[s]=0);

function siemSeverityFromAudio(avg,kick,snare,high) {
    if (kickHit&&avg>0.7) return 'CRITICAL';
    if (kickHit||avg>0.6) return 'HIGH';
    if (snareHit||avg>0.4) return 'MEDIUM';
    if (avg>0.2) return 'LOW';
    return 'INFO';
}
function spawnSiemEvent(avg,kick,snare,high) {
    const sev=siemSeverityFromAudio(avg,kick,snare,high);
    const src=SIEM_SOURCES[Math.floor(Math.random()*SIEM_SOURCES.length)];
    const evt=SIEM_EVENTS[Math.floor(Math.random()*SIEM_EVENTS.length)];
    const country=SIEM_COUNTRIES[Math.floor(Math.random()*SIEM_COUNTRIES.length)];
    const id=`EVT-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
    siemRuleHits[sev]++;
    siemEvents.unshift({id,sev,src,evt,country,frame:siemFrame,age:0});
    if (siemEvents.length>28) siemEvents.pop();
    if (sev==='CRITICAL'||sev==='HIGH') { siemAlerts.unshift({id,sev,src,evt,country,life:1.0}); if(siemAlerts.length>6) siemAlerts.pop(); }
}

function drawSIEM(data, W, H, audio) {
    const {avg,kick,snare,high,mid}=audio;
    siemFrame++;
    const targetScore=Math.floor(avg*100);
    siemThreatScore+=(targetScore-siemThreatScore)*0.08;
    siemSparkline[siemSparkIdx%120]=siemThreatScore; siemSparkIdx++;
    const spawnRate=kickHit?3:snareHit?2:avg>0.4?1:0;
    if (siemFrame-siemLastSpawn>Math.max(2,Math.floor(8-avg*10))) {
        for (let i=0;i<spawnRate+1;i++) spawnSiemEvent(avg,kick,snare,high);
        siemLastSpawn=siemFrame;
    }
    siemAlerts=siemAlerts.map(a=>({...a,life:a.life-0.008})).filter(a=>a.life>0);

    _visCtx.fillStyle='#00040a'; _visCtx.fillRect(0,0,W,H);
    _visCtx.fillStyle='rgba(0,255,65,0.012)';
    for (let y=0;y<H;y+=PIX*2) _visCtx.fillRect(0,y,W,1);

    const PAD=8, COL_GAP=6;
    const col1W=Math.floor(W*0.18), col2W=Math.floor(W*0.36), col3W=Math.floor(W*0.22);
    const col4W=W-col1W-col2W-col3W-COL_GAP*3-PAD*2;
    const col1X=PAD, col2X=col1X+col1W+COL_GAP, col3X=col2X+col2W+COL_GAP, col4X=col3X+col3W+COL_GAP;

    function panelBox(x,y,w,h,title,titleCol) {
        _visCtx.strokeStyle=titleCol||'#003b0f'; _visCtx.lineWidth=1; _visCtx.strokeRect(x,y,w,h);
        const b=6; _visCtx.strokeStyle=titleCol||'#00FF41';
        [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx2,cy2],i)=>{
            const sx=i%2===0?1:-1,sy=i<2?1:-1;
            _visCtx.beginPath(); _visCtx.moveTo(cx2,cy2+sy*b); _visCtx.lineTo(cx2,cy2); _visCtx.lineTo(cx2+sx*b,cy2); _visCtx.stroke();
        });
        if (title) {
            _visCtx.fillStyle='rgba(0,0,0,0.7)'; _visCtx.fillRect(x+1,y+1,w-2,11);
            _visCtx.font='5px "Press Start 2P"'; _visCtx.fillStyle=titleCol||'#00FF41'; _visCtx.fillText(title,x+4,y+9);
        }
    }
    function ptext(txt,x,y,col,size=5) { _visCtx.font=`${size}px "Press Start 2P"`; _visCtx.fillStyle=col; _visCtx.fillText(txt,x,y); }
    function vtext(txt,x,y,col,size=12) { _visCtx.font=`${size}px "VT323"`; _visCtx.fillStyle=col; _visCtx.fillText(txt,x,y); }

    // ── COL 1: threat score + sparkline + freq bands + event totals ──────────
    const c1y=PAD;
    panelBox(col1X,c1y,col1W,68,'▸ THREAT SCORE','#FF003C');
    const score=Math.floor(siemThreatScore);
    const scoreCol=score>70?'#FF003C':score>45?'#FFD700':score>25?'#00FFFF':'#00FF41';
    const lvl=score>70?'CRITICAL':score>45?'HIGH':score>25?'MEDIUM':'LOW';
    _visCtx.font='18px "Press Start 2P"'; _visCtx.fillStyle=scoreCol; _visCtx.textAlign='center';
    _visCtx.fillText(String(score).padStart(3,'0'),col1X+col1W/2,c1y+40); _visCtx.textAlign='left';
    ptext(lvl,col1X+4,c1y+62,scoreCol);

    const spkY=c1y+76,spkH=30,spkW=col1W-8;
    panelBox(col1X,spkY,col1W,spkH+14,'▸ SCORE HISTORY','#003b0f');
    for (let i=1;i<120;i++) {
        const idx=(siemSparkIdx-120+i+120)%120, v=siemSparkline[idx]/100;
        const sx=col1X+4+(i/120)*spkW, sy=spkY+13+spkH-v*spkH;
        _visCtx.fillStyle=v>0.7?'#FF003C':v>0.4?'#FFD700':'#00FF41';
        _visCtx.fillRect(Math.round(sx/PIX)*PIX, Math.round(sy/PIX)*PIX, PIX, PIX);
    }

    // Freq band meters
    const bandY=spkY+spkH+22;
    const bands2=[{l:'KICK',v:kick,c:'#FF003C'},{l:'SNRE',v:snare,c:'#FFD700'},{l:'MID ',v:mid,c:'#00FFFF'},{l:'HIGH',v:high,c:'#00FF41'}];
    panelBox(col1X,bandY,col1W,bands2.length*14+16,'▸ FREQ BANDS','#003b0f');
    bands2.forEach(({l,v,c},i)=>{
        const by=bandY+14+i*14;
        vtext(l,col1X+3,by+9,'#FFD700',11);
        const bw=Math.floor(v*(col1W-34)/PIX)*PIX;
        _visCtx.fillStyle='rgba(0,20,0,0.6)'; _visCtx.fillRect(col1X+30,by+2,col1W-34,8);
        _visCtx.fillStyle=c; _visCtx.fillRect(col1X+30,by+2,bw,8);
    });

    // Event totals
    const cntY=bandY+bands2.length*14+22;
    panelBox(col1X,cntY,col1W,44,'▸ EVENT TOTALS','#003b0f');
    const totalEvts=siemEvents.length;
    const crits=siemEvents.filter(e=>e.sev==='CRITICAL').length;
    vtext(`TOTAL  ${String(totalEvts).padStart(4,'0')}`,col1X+3,cntY+20,'#00FF41',13);
    vtext(`CRIT   ${String(crits).padStart(4,'0')}`,col1X+3,cntY+33,'#FF003C',13);
    vtext(`ALERTS ${String(siemAlerts.length).padStart(4,'0')}`,col1X+3,cntY+46,'#FFD700',13);

    // ── COL 2: live event log ────────────────────────────────────────────────
    const logH=H-PAD*2;
    panelBox(col2X,PAD,col2W,logH,'▸ LIVE EVENT STREAM','#00FF41');
    vtext('SEV      ID           SOURCE         EVENT',col2X+4,PAD+20,'#FFD700',10);
    _visCtx.fillStyle='rgba(255,215,0,0.3)'; _visCtx.fillRect(col2X+2,PAD+22,col2W-4,1);
    const rowH=12, maxRows=Math.floor((logH-56)/rowH); // reserve bottom for mini bars
    siemEvents.slice(0,maxRows).forEach((ev,i)=>{
        const ry=PAD+28+i*rowH, col2=SIEM_SEV_COLS[ev.sev];
        const ageFade=Math.max(0.3,1-ev.age*0.01);
        _visCtx.globalAlpha=ageFade;
        _visCtx.fillStyle=col2+'33'; _visCtx.fillRect(col2X+2,ry-1,36,rowH-2);
        vtext(ev.sev.slice(0,4),col2X+3,ry+8,col2,10);
        vtext(ev.id,col2X+40,ry+8,'#00FF41',10);
        vtext(ev.src.slice(0,12),col2X+100,ry+8,'#00FFFF',10);
        vtext(ev.evt.slice(0,28),col2X+196,ry+8,i===0?'#FFFFFF':'#00FF41',10);
        vtext(ev.country,col2X+col2W-22,ry+8,col2,10);
        _visCtx.globalAlpha=1; ev.age++;
    });
    // Blinking cursor on latest row
    if (siemFrame%30<15 && siemEvents.length>0) {
        _visCtx.fillStyle='#00FF41';
        _visCtx.fillRect(col2X+3,PAD+28+rowH-3,4,2);
    }
    // Mini frequency bars across the bottom of the log panel
    const miniBarY=PAD+logH-26;
    _visCtx.fillStyle='rgba(0,0,0,0.6)'; _visCtx.fillRect(col2X+2,miniBarY,col2W-4,22);
    const barCount=Math.floor((col2W-8)/3);
    for (let i=0;i<barCount;i++) {
        const binIdx=Math.floor(i*data.length/barCount);
        const v=data[binIdx]/255;
        const bh=Math.floor(v*20/PIX)*PIX;
        const bx=col2X+4+i*3;
        _visCtx.fillStyle=v>0.7?'#FF003C':v>0.4?'#FFD700':'#00FF41';
        _visCtx.fillRect(bx,miniBarY+20-bh,2,bh);
    }

    // ── COL 3: active alerts + MITRE ATT&CK wheel ────────────────────────────
    const alertPanH=Math.floor(H*0.52);
    panelBox(col3X,PAD,col3W,alertPanH,'▸ ACTIVE ALERTS','#FF003C');
    siemAlerts.slice(0,6).forEach((al,i)=>{
        const ay=PAD+14+i*Math.floor((alertPanH-16)/6);
        const panH2=Math.floor((alertPanH-16)/6)-2, ac=SIEM_SEV_COLS[al.sev];
        _visCtx.globalAlpha=al.life;
        _visCtx.fillStyle=ac+'18'; _visCtx.fillRect(col3X+2,ay,col3W-4,panH2);
        _visCtx.strokeStyle=ac; _visCtx.lineWidth=1; _visCtx.strokeRect(col3X+2,ay,col3W-4,panH2);
        _visCtx.fillStyle=ac; _visCtx.fillRect(col3X+2,ay+panH2-2,Math.floor(al.life*(col3W-4)),2);
        ptext(`[${al.sev}]`,col3X+4,ay+8,ac);
        vtext(al.evt.slice(0,22),col3X+4,ay+19,'#FFFFFF',10);
        vtext(al.src,col3X+4,ay+28,ac,10);
        _visCtx.globalAlpha=1;
    });

    // MITRE ATT&CK tactic wheel
    const tacticY=PAD+alertPanH+COL_GAP;
    const tacticH=H-tacticY-PAD;
    panelBox(col3X,tacticY,col3W,tacticH,'▸ MITRE ATT&CK','#FF6600');
    const tactics=['RECON','RESOURCE','INITIAL','EXEC','PERSIST','PRIV-ESC','DEFENSE','CRED','DISCOVERY','LATERAL','COLLECT','C2','EXFIL','IMPACT'];
    const tcx=col3X+col3W/2, tcy=tacticY+tacticH/2+4;
    const tcR=Math.min(col3W,tacticH)*0.38;
    tactics.forEach((t,i)=>{
        const angle=(i/tactics.length)*Math.PI*2-Math.PI/2;
        const tx=tcx+Math.cos(angle)*tcR, ty=tcy+Math.sin(angle)*tcR;
        const binIdx=Math.floor(i*data.length/tactics.length);
        const active=data[binIdx]/255>0.35+(1-avg)*0.2;
        const tc2=active?'#FF6600':'#1a0800';
        _visCtx.fillStyle=tc2;
        _visCtx.fillRect(Math.round((tx-3)/PIX)*PIX, Math.round((ty-3)/PIX)*PIX, PIX*2, PIX*2);
        _visCtx.strokeStyle=active?'#FF6600':'#110400'; _visCtx.lineWidth=1;
        _visCtx.beginPath(); _visCtx.moveTo(tcx,tcy); _visCtx.lineTo(tx,ty); _visCtx.stroke();
        if (active) { _visCtx.font='4px "Press Start 2P"'; _visCtx.fillStyle='#FF6600'; _visCtx.fillText(t.slice(0,5),tx-8,ty-4); }
    });
    _visCtx.font='8px "Press Start 2P"'; _visCtx.fillStyle=`rgba(255,102,0,${0.3+avg*0.7})`; _visCtx.textAlign='center';
    _visCtx.fillText(String(siemRuleHits['CRITICAL']+siemRuleHits['HIGH']).padStart(4,'0'),tcx,tcy+4);
    _visCtx.textAlign='left';

    // ── COL 4: severity breakdown + top sources + events/sec + countries ─────
    panelBox(col4X,PAD,col4W,80,'▸ SEVERITY BREAKDOWN','#FFD700');
    const sevTotal=Math.max(1,SIEM_SEVERITIES.reduce((a,s)=>a+siemRuleHits[s],0));
    let sevX=col4X+3;
    SIEM_SEVERITIES.forEach(s=>{
        const w=Math.floor((siemRuleHits[s]/sevTotal)*(col4W-6));
        if (w>0) { _visCtx.fillStyle=SIEM_SEV_COLS[s]; _visCtx.fillRect(sevX,PAD+14,w,12); sevX+=w; }
    });
    SIEM_SEVERITIES.forEach((s,i)=>{
        const lx=col4X+3+(i%3)*Math.floor((col4W-6)/3), ly=PAD+34+Math.floor(i/3)*14;
        _visCtx.fillStyle=SIEM_SEV_COLS[s]; _visCtx.fillRect(lx,ly,6,6);
        vtext(`${s.slice(0,4)} ${siemRuleHits[s]}`,lx+8,ly+7,SIEM_SEV_COLS[s],10);
    });

    // Top offending sources
    const srcY=PAD+86;
    panelBox(col4X,srcY,col4W,82,'▸ TOP SOURCES','#00FFFF');
    const srcCounts={};
    siemEvents.forEach(e=>{ srcCounts[e.src]=(srcCounts[e.src]||0)+1; });
    const topSrc=Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxSrcCount=topSrc[0]?.[1]||1;
    topSrc.forEach(([src,cnt],i)=>{
        const sy2=srcY+14+i*13;
        vtext(src.slice(0,14),col4X+3,sy2+8,'#00FFFF',10);
        const bw=Math.floor((cnt/maxSrcCount)*(col4W-6)/PIX)*PIX;
        _visCtx.fillStyle='rgba(0,40,40,0.5)'; _visCtx.fillRect(col4X+3,sy2+9,col4W-6,4);
        _visCtx.fillStyle='#00FFFF'; _visCtx.fillRect(col4X+3,sy2+9,bw,4);
        vtext(cnt,col4X+col4W-18,sy2+8,'#00FFFF',10);
    });

    // Events/sec waveform
    const waveY=srcY+88;
    panelBox(col4X,waveY,col4W,44,'▸ EVENTS/SEC','#00FF41');
    for (let i=1;i<120;i++) {
        const idx=(siemSparkIdx-120+i+120)%120, v=siemSparkline[idx]/100;
        const wx2=col4X+3+(i/120)*(col4W-6);
        const wy2=waveY+13+28-v*28;
        _visCtx.fillStyle=v>0.7?'#FF003C':'#00FF41';
        _visCtx.fillRect(Math.round(wx2/PIX)*PIX, Math.round(wy2/PIX)*PIX, PIX, PIX);
    }

    // Origin countries heatmap
    const hmY=waveY+50;
    panelBox(col4X,hmY,col4W,H-hmY-PAD,'▸ ORIGIN COUNTRIES','#FF6600');
    const cntCounts={};
    siemEvents.forEach(e=>{ cntCounts[e.country]=(cntCounts[e.country]||0)+1; });
    const maxCnt=Math.max(1,...Object.values(cntCounts));
    const hmRows=3, hmCols=Math.ceil(SIEM_COUNTRIES.length/hmRows);
    SIEM_COUNTRIES.forEach((c2,i)=>{
        const row2=Math.floor(i/hmCols), colIdx=i%hmCols;
        const cx2=col4X+3+colIdx*(Math.floor((col4W-6)/hmCols));
        const cy2=hmY+14+row2*16;
        const heat=(cntCounts[c2]||0)/maxCnt;
        const r2=Math.floor(heat*255), g2=Math.floor((1-heat)*200);
        _visCtx.fillStyle=`rgb(${r2},${g2},0)`;
        _visCtx.fillRect(cx2,cy2,Math.floor((col4W-6)/hmCols)-2,12);
        vtext(c2,cx2+1,cy2+9,heat>0.5?'#000':'#888',10);
    });

    if (kickHit) { _visCtx.fillStyle=`rgba(255,0,60,${kickFlash*0.08})`; _visCtx.fillRect(0,0,W,H); }
}

// ── SAFETYNET watermark stamp ─────────────────────────────────────────────

function draw007Stamp(x, y, energy) {
    // removed — no 007 branding
}

// ═════════════════════════════════════════════════════════════════════════════
// CREDITS SCROLL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Build and animate the credits scroll.
 * @param {Array<{text:string, style:string}>} lines
 */
const _GLOW_DARK = '0 0 6px #000,0 0 12px #000,0 0 18px #000'; // dark halo for legibility
const STYLE_MAP = {
    'title':          `font-family:VT323,monospace;font-size:52px;color:#FFD700;letter-spacing:0.12em;text-shadow:${_GLOW_DARK},0 0 30px rgba(255,215,0,0.9),0 0 60px rgba(255,215,0,0.4);`,
    'subtitle':       `font-family:VT323,monospace;font-size:26px;color:#00FFFF;letter-spacing:0.3em;text-shadow:${_GLOW_DARK},0 0 20px rgba(0,255,255,0.8);`,
    'section-header': `font-family:VT323,monospace;font-size:18px;color:#FFD700;opacity:0.8;letter-spacing:0.3em;text-shadow:${_GLOW_DARK},0 0 16px rgba(255,215,0,0.6);`,
    'entry':          `font-family:VT323,monospace;font-size:28px;color:#00FF41;letter-spacing:0.1em;text-shadow:${_GLOW_DARK},0 0 20px rgba(0,255,65,0.8);`,
    'warning':        `font-family:VT323,monospace;font-size:28px;color:#FF6600;letter-spacing:0.1em;text-shadow:${_GLOW_DARK},0 0 20px rgba(255,100,0,0.9),0 0 40px rgba(255,100,0,0.4);`,
};

function _startCredits(lines) {
    const overlay = document.getElementById('bv-credits-overlay');
    if (!overlay) return;

    clearTimeout(_creditsTimerId);
    clearTimeout(_creditsHideTimer); // cancel any pending display:none from a prior _stopCredits
    _creditsHideTimer = null;
    _creditsActive = true;

    // Show overlay — fully inline, no CSS class dependency
    overlay.style.cssText = [
        'display:flex',
        'position:fixed',
        'inset:0',
        'z-index:200000',
        'background:transparent',
        'pointer-events:none',
        'align-items:center',
        'justify-content:center',
        'opacity:1',
        'transition:opacity 0.6s ease',
    ].join(';');

    // Single centred label element
    let label = overlay.querySelector('#bv-cr-label');
    if (!label) {
        label = document.createElement('div');
        label.id = 'bv-cr-label';
        overlay.appendChild(label);
    }
    label.style.cssText = 'text-align:center;padding:0 10%;transition:opacity 0.4s ease;';

    // Filter to non-empty lines only
    const items = lines.filter(l => l.text && l.text.trim());

    let idx = 0;

    function showNext() {
        if (!_creditsActive || idx >= items.length) {
            _stopCredits();
            return;
        }
        const item = items[idx++];
        const baseStyle = STYLE_MAP[item.style] || STYLE_MAP['entry'];

        label.style.opacity = '0';
        _creditsTimerId = setTimeout(() => {
            label.style.cssText = `text-align:center;padding:0 10%;transition:opacity 0.4s ease;${baseStyle}`;
            label.textContent   = displayDashes(item.text);
            label.style.opacity = '1';
            if (_themeDef.logCredits) addLog('> ' + displayDashes(item.text));
            _creditsTimerId = setTimeout(showNext, 3000);
        }, 450); // brief fade-out gap before switching text
    }

    showNext();
}

function _stopCredits() {
    _creditsActive = false;
    clearTimeout(_creditsTimerId);
    _creditsTimerId = null;

    const overlay = document.getElementById('bv-credits-overlay');
    if (!overlay) return;

    overlay.style.opacity = '0';
    _creditsHideTimer = setTimeout(() => { overlay.style.display = 'none'; _creditsHideTimer = null; }, 700);
}

// ═════════════════════════════════════════════════════════════════════════════
// STATS & LOG UPDATES
// ═════════════════════════════════════════════════════════════════════════════

function _updateStats(data, audio) {
    const { avg, kick, snare, bassRaw, midRaw, highRaw } = audio;
    const peak = Math.max(kick, snare, avg);
    const REF = 0.8;
    const bassD=Math.min(1,bassRaw/REF), midD=Math.min(1,midRaw/REF), highD=Math.min(1,highRaw/REF);

    const bm = document.getElementById('bv-bass-meter'); if (bm) bm.style.width=(bassD*100)+'%';
    const mm = document.getElementById('bv-mid-meter');  if (mm) mm.style.width=(midD *100)+'%';
    const hm = document.getElementById('bv-high-meter'); if (hm) hm.style.width=(highD*100)+'%';
    const pm = document.getElementById('bv-peak-meter'); if (pm) pm.style.width=(peak *100)+'%';
    const bv = document.getElementById('bv-bass-val'); if (bv) bv.textContent=String(Math.floor(bassD*999)).padStart(3,'0');
    const mv = document.getElementById('bv-mid-val');  if (mv) mv.textContent=String(Math.floor(midD *999)).padStart(3,'0');
    const hv = document.getElementById('bv-high-val'); if (hv) hv.textContent=String(Math.floor(highD*999)).padStart(3,'0');
    const pv = document.getElementById('bv-peak-val'); if (pv) pv.textContent=String(Math.floor(peak *999)).padStart(3,'0');

    const tl = document.getElementById('bv-threat-level');
    if (tl) {
        if (kickHit)       { tl.textContent='BREACH';   tl.style.color='var(--bv-red)'; }
        else if (avg>0.7)  { tl.textContent='CRITICAL';  tl.style.color='var(--bv-red)'; }
        else if (avg>0.5)  { tl.textContent='HIGH';      tl.style.color='var(--bv-gold)'; }
        else if (avg>0.3)  { tl.textContent='MEDIUM';    tl.style.color='var(--bv-cyan)'; }
        else               { tl.textContent='LOW';       tl.style.color='var(--bv-green)'; }
    }

    const an = MusicController.analyser;
    if (an) {
        const maxIdx = Array.from(data).indexOf(Math.max(...data));
        const freq = maxIdx * MusicController.context.sampleRate / an.fftSize;
        const fd = document.getElementById('bv-freq-disp'); if (fd) fd.textContent=freq.toFixed(1).padStart(7,' ');
    }

    if (_themeDef.rotateOps && kickHit && Math.random() > 0.85) {
        _opIdx = (_opIdx + 1) % OPERATIONS.length;
        const on = document.getElementById('bv-op-name'); if (on) on.textContent=OPERATIONS[_opIdx];
    }
}

function addLog(text, cls = '') {
    if (!_logEl) return;
    const el = document.createElement('div');
    el.className = `bv-log-line${cls ? ' ' + cls : ''}`;
    el.textContent = text;
    if (_logEl.children.length > 20) _logEl.removeChild(_logEl.firstChild);
    _logEl.appendChild(el);
    if (!_logScrollPending) {
        _logScrollPending = true;
        requestAnimationFrame(() => { _logEl.scrollTop = _logEl.scrollHeight; _logScrollPending = false; });
    }
}

function _startLogTick() {
    _lastLogTime = 0;
    return setInterval(() => {
        if (!_open) return;
        const now = performance.now();
        if (now - _lastLogTime >= 2800) {
            const msgs = _themeDef.logMessages;
            const [txt, cls] = msgs[_msgIdx % msgs.length];
            addLog(txt, cls); _msgIdx++; _lastLogTime = now;
        }
    }, 200);
}

// ═════════════════════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═════════════════════════════════════════════════════════════════════════════

const ALL_MODES = ['cybermap','wave','siem','bars','circle','matrix','tunnel','plasma','particles','lissajous'];
const _modes = () => _themeDef.modes || ALL_MODES;
const _nextMode = () => { const m = _modes(); return m[(m.indexOf(_currentMode) + 1) % m.length]; };

function _setMode(mode) {
    if (!_modes().includes(mode)) mode = _modes()[0];
    _currentMode = mode;
    // Sync both mode-group button groups
    _overlay?.querySelectorAll('[data-mode]').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    // Reset per-mode state
    tunnelAngle=0; particleList=[]; attackArcs=[]; mapPulses=[]; mapGlobe=null; mapFrame=0;
    siemEvents=[]; siemAlerts=[]; siemFrame=0; siemThreatScore=0;
    siemSparkline=new Float32Array(120); siemSparkIdx=0;
    SIEM_SEVERITIES.forEach(s => siemRuleHits[s]=0);

    // Reset spawn timers relative to the reset frame counters so spawn
    // conditions fire immediately on the very first frame (not after a
    // long wait while siemFrame/mapFrame climbs back up to the old value).
    siemLastSpawn = -999;
    lastBassHit   = -999;

    // Pre-seed MAP with attack arcs so the map is alive from frame 1
    if (mode === 'cybermap' && _visCv) {
        const W = _visCv.width, H = _visCv.height;
        for (let i = 0; i < 6; i++) spawnAttack(W, H, 0.3 + Math.random() * 0.4);
    }

    // Pre-seed SIEM with initial events so the log isn't empty on entry
    if (mode === 'siem') {
        const seedAvg = 0.4;
        for (let i = 0; i < 14; i++) spawnSiemEvent(seedAvg, 0.3, 0.2, 0.3);
    }

    // Reset auto-progression timer so 30 s runs from the new mode
    if (_autoEnabled) _startAutoProgress();
}

function _startAutoProgress() {
    clearInterval(_autoIv);
    _autoIv = setInterval(() => {
        _setMode(_nextMode());
    }, AUTO_INTERVAL);
}

// ═════════════════════════════════════════════════════════════════════════════
// HUD TRACK INFO
// ═════════════════════════════════════════════════════════════════════════════

function _updateTrackInfo(state) {
    _mcState = state || {};
    const info = document.getElementById('bv-track-info');
    if (!info) return;
    const { label, detail } = trackInfoLabel(_theme, state);
    info.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = label;
    info.appendChild(span);
    if (detail) info.appendChild(document.createTextNode(' ' + detail));
    const pauseBtn = document.getElementById('bv-pause-btn');
    if (pauseBtn) pauseBtn.innerHTML = state?.paused ? '▶ RESUME' : '⏸ PAUSE';
}

// ═════════════════════════════════════════════════════════════════════════════
// CLOCK
// ═════════════════════════════════════════════════════════════════════════════

function _updateClock() {
    const n = new Date();
    const el = document.getElementById('bv-clock');
    if (el) el.textContent = [n.getHours(),n.getMinutes(),n.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
}

// ═════════════════════════════════════════════════════════════════════════════
// OPEN / CLOSE / INIT
// ═════════════════════════════════════════════════════════════════════════════

let _open = false;
let _clockIv = null;
let _resizeHandler = null;

/**
 * Pick the theme from the scenario and re-skin the overlay for it. A theme whose
 * overlay() returns null (safetynet) keeps the overlay exactly as built.
 */
function _applyTheme(opts) {
    if (opts.credits?.length) _lastCredits = opts.credits;
    _theme    = resolveCreditsTheme(window.gameScenario);
    _themeDef = getCreditsTheme(_theme);
    if (!_overlay) return;
    if (_themeApplied !== _theme) _drawLogoSprite();
    if (!_themeDef.modes.includes(_currentMode)) _setMode(_themeDef.modes[0]);
    _overlay.querySelectorAll('[data-mode]').forEach(b => {
        b.style.display = _themeDef.modes.includes(b.dataset.mode) ? '' : 'none';
    });
    const stamp = _overlay.querySelector('.bv-classified');
    if (stamp) stamp.style.display = _themeDef.stamp ? '' : 'none';

    const t = _themeDef.overlay({
        missionName: window.breakEscapeConfig?.missionDisplayName || window.gameScenario?.scenario_name,
        credits:     _lastCredits,
    });
    if (t) _applyOverlayText(t);
    _themeApplied = _theme;
}

function _applyOverlayText(t) {
    const q = (sel) => _overlay.querySelector(sel);
    const setText = (el, v) => { if (el && v !== undefined) el.textContent = v; };

    setText(q('.bv-title-block h1'), t.heading);
    setText(q('.bv-title-block p'), t.subheading);
    setText(q('.bv-badge.red'), t.liveBadge);
    setText(q('.bv-badge.gold'), t.badge);
    // Status block: OPERTN (rotating operation names) becomes the scene
    const statusLines = [...(q('.bv-status-block')?.querySelectorAll('.bv-status-line') || [])];
    if (statusLines[0]) {
        setText(statusLines[0].querySelector('.label'), t.scene[0]);
        const op = statusLines[0].querySelector('.val');
        if (op) { op.removeAttribute('id'); op.textContent = t.scene[1]; }
    }
    if (statusLines[1]) {
        const st = statusLines[1].querySelector('.val');
        if (st) { st.textContent = t.status; st.classList.remove('bv-blink'); }
    }
    const [leftPanel, rightPanel] = [..._overlay.querySelectorAll('.bv-side-panel')];
    const leftTitles = leftPanel ? [...leftPanel.querySelectorAll('.bv-panel-title')] : [];
    setText(leftTitles[0], t.leftTitle);
    setText(leftTitles[1], t.logTitle);
    if (_themeApplied !== _theme && _logEl) { _logEl.innerHTML = ''; addLog(t.logFirst); }

    if (rightPanel) {
        // Replace the OPERATIVE DATA block (title, AGENCY, RANK, SECTOR, CLRNC) with the
        // exercise rows; FREQ, ENCRYPTION and VIS MODE stay.
        const kids = [...rightPanel.children];
        const freqIdx = kids.findIndex(k => k.querySelector?.('#bv-freq-disp'));
        kids.slice(0, Math.max(0, freqIdx)).forEach(k => k.remove());
        const frag = document.createDocumentFragment();
        const title = document.createElement('div'); title.className = 'bv-panel-title'; title.textContent = t.rightTitle;
        frag.appendChild(title);
        for (const [k, v] of t.rows) {
            const row = document.createElement('div'); row.className = 'bv-stat-row';
            const a = document.createElement('span'); a.className = 'sk'; a.textContent = k;
            const b = document.createElement('span'); b.textContent = v; b.style.textAlign = 'right';
            row.append(a, b); frag.appendChild(row);
        }
        rightPanel.insertBefore(frag, rightPanel.firstChild);
    }
    setText(q('.bv-footer > span'), t.footer);
    setText(q('.bv-ticker-inner'), t.ticker);
}

function _open_overlay(opts = {}) {
    if (!_overlay) _init();
    _applyTheme(opts);

    if (!_open) {
        // First open — initialise all loops and canvas
        _overlay.classList.add('bv-open');
        _open = true;

        _resizeVisCanvas();

        // Take over audio leadership so this tab's analyser gets real data
        if (!MusicController.isLeader) MusicController.requestLeadership();

        _matrixIv  = _startMatrixRain();
        _logTickIv = _startLogTick();
        _clockIv   = setInterval(_updateClock, 1000); _updateClock();
        _resizeHandler = () => { _resizeVisCanvas(); mapGlobe = null; };
        window.addEventListener('resize', _resizeHandler);

        _updateTrackInfo(MusicController.getState());

        cancelAnimationFrame(_animId);
        _animId = requestAnimationFrame(_draw);

        if (_autoEnabled) _startAutoProgress();

        // Pause the Phaser game so it doesn't draw over us
        if (window.game?.scene?.scenes?.[0]) {
            try { window.game.scene.scenes[0].scene.pause(); } catch(e) {}
        }
    }

    // Credits — can be set on initial open or injected into an already-open visualiser
    if (opts.credits?.length) {
        _stopCredits(); // cancel any in-progress credits first
        _startCredits(opts.credits);
    }

    // Record whether we should auto-close when the track ends
    if (opts.autoClose !== undefined) _autoCloseOnEnd = !!opts.autoClose;

    // disableClose — hide × button and block Esc
    _disableClose = !!opts.disableClose;
    const closeBtn = document.getElementById('bv-close-btn');
    if (closeBtn) closeBtn.style.display = _disableClose ? 'none' : '';

    // autoStop — stop music after current track, keep visualiser open, hide Skip (single-track mode)
    const skipBtn = document.getElementById('bv-skip-btn');
    if (skipBtn) skipBtn.style.display = opts.autoStop ? 'none' : '';
    if (opts.autoStop) MusicController.stopAfterCurrentTrack();
}

function _close_overlay() {
    if (_disableClose) return;
    _open = false;
    _autoCloseOnEnd = false;
    _disableClose   = false;
    const skipBtn = document.getElementById('bv-skip-btn');
    if (skipBtn) skipBtn.style.display = '';
    _overlay?.classList.remove('bv-open');

    cancelAnimationFrame(_animId);
    clearInterval(_matrixIv);
    clearInterval(_logTickIv);
    clearInterval(_clockIv);
    clearInterval(_autoIv); _autoIv = null;
    if (_resizeHandler) { window.removeEventListener('resize', _resizeHandler); _resizeHandler = null; }

    // Stop any credits immediately (no fade — overlay is closing anyway)
    _creditsActive = false;
    clearTimeout(_creditsTimerId);  _creditsTimerId  = null;
    clearTimeout(_creditsHideTimer); _creditsHideTimer = null;
    const creditsOverlay = document.getElementById('bv-credits-overlay');
    if (creditsOverlay) creditsOverlay.style.display = 'none';

    // Resume Phaser
    if (window.game?.scene?.scenes?.[0]) {
        try { window.game.scene.scenes[0].scene.resume(); } catch(e) {}
    }
}

function _init() {
    _overlay  = _buildOverlay();

    // Credits overlay lives directly on body so it's never clipped by #bond-vis-overlay's overflow:hidden
    if (!document.getElementById('bv-credits-overlay')) {
        const creditsEl = document.createElement('div');
        creditsEl.id = 'bv-credits-overlay';
        creditsEl.innerHTML = '<div id="bv-credits-scroll"></div>';
        document.body.appendChild(creditsEl);
    }

    _matrixCv = _overlay.querySelector('.bv-matrix');
    _visCv    = document.getElementById('bv-vis-canvas');
    _visCtx   = _visCv.getContext('2d');
    _visCtx.imageSmoothingEnabled = false;
    _logEl    = document.getElementById('bv-log-scroll');

    // Draw logo sprite
    _drawLogoSprite();

    // Mode buttons
    _overlay.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => _setMode(btn.dataset.mode));
    });

    // Auto-progression toggle
    document.getElementById('bv-auto-btn').addEventListener('click', () => {
        _autoEnabled = !_autoEnabled;
        const btn = document.getElementById('bv-auto-btn');
        if (_autoEnabled) {
            _startAutoProgress();
            btn.classList.add('active');
            btn.innerHTML = '⏱ AUTO';
        } else {
            clearInterval(_autoIv); _autoIv = null;
            btn.classList.remove('active');
            btn.innerHTML = '⏱ MAN';
        }
    });

    // Close button
    document.getElementById('bv-close-btn').addEventListener('click', () => {
        if (!_disableClose) BondVisualiser.close();
    });

    // Skip / Pause
    document.getElementById('bv-skip-btn').addEventListener('click', () => MusicController.skip());
    document.getElementById('bv-pause-btn').addEventListener('click', () => {
        if (MusicController.getState()?.paused) MusicController.resume();
        else MusicController.pause();
    });

    // Keyboard: Escape closes, V cycles mode
    document.addEventListener('keydown', e => {
        if (!_open) return;
        if (e.key === 'Escape' && !_disableClose) BondVisualiser.close();
        if (e.key === 'v' || e.key === 'V') _setMode(_nextMode());
    });

    // MusicController state changes
    window.addEventListener('musiccontroller:statechange', e => _updateTrackInfo(e.detail));
    window.addEventListener('musiccontroller:trackchange',  () => _updateTrackInfo(MusicController.getState()));
}

// ── Auto-open on victory playlist ─────────────────────────────────────────
// Suppressed while a scenario's credits are waiting on the server to agree the
// mission has concluded. Without this the overlay opens here the moment the
// playlist switches -- synchronously, before that answer arrives -- so a player
// whose mission was REFUSED still got a fullscreen end-of-mission screen, next
// to a "Not Yet" toast telling them the opposite. The credits path owns the
// overlay in that case; this listener only covers a victory playlist that no
// credits are attached to.
let _autoOpenSuppressed = false;

window.addEventListener('musiccontroller:playlistchange', e => {
    if (e.detail?.playlist === 'victory' && !_autoOpenSuppressed) {
        BondVisualiser.open();
    }
});

// ── Auto-close when a stop-after-track song ends ───────────────────────────
window.addEventListener('musiccontroller:trackended', () => {
    if (_open && _autoCloseOnEnd) {
        // Let credits finish their natural scroll, then close after a short pause
        const closeDelay = _creditsActive ? 5000 : 3000;
        setTimeout(() => { if (_open) _close_overlay(); }, closeDelay);
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═════════════════════════════════════════════════════════════════════════════

export const BondVisualiser = {
    /**
     * Open the fullscreen visualiser.
     * @param {object} [opts]
     * @param {Array<{text:string,style?:string}>} [opts.credits]     - lines to display as credits
     * @param {boolean}  [opts.autoClose]    - close the visualiser when musiccontroller:trackended fires
     * @param {boolean}  [opts.autoStop]     - stop music after current track ends; visualiser stays open
     * @param {boolean}  [opts.disableClose] - hide × button and block Esc (forced/cutscene mode)
     */
    open(opts) { _open_overlay(opts || {}); },
    /** Close the fullscreen visualiser. */
    close() { _close_overlay(); },
    /** Toggle open/closed. */
    toggle() { _open ? _close_overlay() : _open_overlay({}); },
    /** Returns true if the overlay is currently visible. */
    isOpen() { return _open; },
    /**
     * Suppress (or re-enable) the auto-open that fires when the music playlist
     * switches to 'victory'. Set while a conclusion decision is pending, so the
     * overlay cannot pre-empt a server refusal.
     * @param {boolean} suppressed
     */
    setAutoOpenSuppressed(suppressed) { _autoOpenSuppressed = !!suppressed; },
};

// Expose globally for non-module contexts (e.g. scenario scripts, Ink)
window.BondVisualiser = BondVisualiser;
