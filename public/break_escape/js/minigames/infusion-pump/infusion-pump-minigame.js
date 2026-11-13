import { MinigameScene } from '../framework/base-minigame.js';
import MusicController from '../../music/music-controller.js';
import { wirePhaserGameSoundToBreakEscape } from '../../music/phaser-audio-bus.js';
import { currentClockText } from '../../systems/game-clock.js';

// Canvas dimensions for the Phaser scene
// 784 wide so the canvas fits an 800px window at zoom 1 (slice 7 R2 M2)
const W = 784;  // canvas width
const H = 510;  // canvas height

// Layout constants
const RX_X = 8;   const RX_Y = 8;   const RX_W = 290; const RX_H = 494;  // prescription panel
const PMP_X = 302; const PMP_Y = 8;  const PMP_W = 474; const PMP_H = 494; // pump bezel

// Pump inner area (12px padding inside bezel)
const PMP_IX = PMP_X + 12;  // 314
const PMP_IW = PMP_W - 24;  // 486

// Screen rect (inside pump)
const SCR_X = PMP_IX; const SCR_Y = PMP_Y + 12; const SCR_W = PMP_IW; const SCR_H = 155;

// Keypad rows
const KP_Y0 = SCR_Y + SCR_H + 8;  // ~183
const KP_BTN_H = 50;
const KP_GAP   = 5;
const KP_BTN_W = Math.floor((PMP_IW - KP_GAP * 2) / 3);  // ~158

// Confirm button
const CONF_Y  = KP_Y0 + 4 * (KP_BTN_H + KP_GAP) + 3;  // ~416
const CONF_H  = 54;
// A press that moves further than this (canvas pixels) before release is a swipe, not a tap
const TAP_SLOP = 12;

export class InfusionPumpMinigame extends MinigameScene {
    // The X sits inside the frame (MinigameScene.closeInsideFrame)
    static closeInsideFrame = true;
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: 'Infusion Pump Terminal',
            showCancel: true,
            cancelText: 'Close'
        });

        const sd = params.lockable?.scenarioData?.minigameData || {};
        this.drugName    = sd.drug_name    || 'MORPHINE SULPHATE';
        this.correctDose = sd.correct_dose || '10';
        // Prescription panel and tampered-library behaviour come from scenario data;
        // each default is the value this minigame used before they were configurable.
        this.sd          = sd;
        this.rateDisplay = sd.rate_display || '10.0 mg/hr';
        this.libraryMin  = sd.library_min  != null ? Number(sd.library_min) : 25;
        this.libraryMax  = sd.library_max  != null ? Number(sd.library_max) : null;
        // Optional limits of the correct (restored) library, enforced once library_ok_global is true.
        this.restoredMin = sd.restored_min != null ? Number(sd.restored_min) : null;
        this.restoredMax = sd.restored_max != null ? Number(sd.restored_max) : null;

        this.currentInput  = '';
        this.confirmed     = false;
        this._modalVisible = false;
        this._showCursor   = true;
        this._cursorTimer  = null;
        this._displayText  = null;
        this._screenRect   = null;
        this._modalObjects = [];
        this.phaserGame    = null;
        this.scene         = null;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    // The X sits inside the pump's canvas, not the screen's corner. When the canvas is larger
    // than the window at zoom 1 it scrolls inside its box, and the X sits in the part of the
    // canvas the box shows, so it stays put while the canvas scrolls under it.
    closeAnchor() {
        return this.gameContainer?.querySelector?.('#ip-phaser-container') || this.gameContainer;
    }

    placeCloseButton() {
        const btn = this.container?.querySelector?.('#minigame-close');
        const box = this.gameContainer?.querySelector?.('#ip-phaser-container');
        const canvas = box?.querySelector?.('canvas');
        if (!canvas) return super.placeCloseButton();
        if (!btn || btn.style.display === 'none') return;
        const b = box.getBoundingClientRect();
        const r = canvas.getBoundingClientRect();
        const c = this.container.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const gap = 4;
        // The visible part of the canvas: the box less its scrollbars
        const top = Math.max(r.top, b.top, c.top);
        const right = Math.min(r.right, b.left + box.clientWidth, c.right);
        btn.style.top = `${Math.round(top - c.top + gap)}px`;
        btn.style.right = `${Math.round(c.right - right + gap)}px`;
        btn.classList.add('minigame-close-in-frame');
    }

    // Pixel text is drawn only at a whole-number zoom: the largest that fits, never below 1
    // (slice 7 R2 M2). A window too small for zoom 1 scrolls the canvas inside its box.
    static wholeZoom(availW, availH, w = W, h = H) {
        const z = Math.floor(Math.min(availW / w, availH / h));
        return Number.isFinite(z) && z >= 1 ? z : 1;
    }

    _fitZoom() {
        const game = this.phaserGame;
        const box = this.gameContainer?.querySelector?.('#ip-phaser-container');
        if (!game?.scale || !box) return;
        const z = InfusionPumpMinigame.wholeZoom(box.clientWidth, box.clientHeight);
        if (game.scale.zoom !== z) game.scale.setZoom(z);
        // Phaser may set its own touch-action on the canvas; the box must pan on a swipe
        const canvas = box.querySelector('canvas');
        if (canvas) canvas.style.touchAction = 'pan-y';
        this.placeCloseButton?.();
        this._updateMoreBelow();
    }

    // "More below" shows while part of the canvas is under the bottom of its box, and hides
    // once the player has scrolled to the end (slice 7 R3 M1). A click scrolls to the end.
    static hasMoreBelow(box) {
        if (!box) return false;
        return box.scrollHeight - box.clientHeight - box.scrollTop > 2;
    }

    // A pump button acts on a tap: released over the button it was pressed on, without a drag
    // and without the box having scrolled in between (slice 7 R3 M1). Now that a swipe on the
    // canvas scrolls the box, acting on pointerdown would press whichever key a swipe starts on.
    static isTap(distance, scrollMoved) {
        return distance <= TAP_SLOP && Math.abs(scrollMoved) <= 2;
    }

    _boxScrollTop() {
        return this.gameContainer?.querySelector?.('#ip-phaser-container')?.scrollTop || 0;
    }

    _armTap(obj) {
        obj.on('pointerdown', () => { obj._tapArmed = true; obj._tapScroll = this._boxScrollTop(); });
        obj.on('pointerout', () => { obj._tapArmed = false; });
        obj.on('pointerup', (pointer) => {
            const armed = obj._tapArmed;
            obj._tapArmed = false;
            if (!armed) return;
            const distance = typeof pointer?.getDistance === 'function' ? pointer.getDistance() : 0;
            if (InfusionPumpMinigame.isTap(distance, this._boxScrollTop() - obj._tapScroll)) obj.emit('tap', pointer);
        });
        return obj;
    }

    _onTap(obj, fn) {
        this._armTap(obj);
        obj.on('tap', fn);
        return obj;
    }

    _updateMoreBelow() {
        const box = this.gameContainer?.querySelector?.('#ip-phaser-container');
        const cue = this.gameContainer?.querySelector?.('#ip-more-below');
        if (!cue) return;
        cue.hidden = !InfusionPumpMinigame.hasMoreBelow(box);
    }

    _watchZoom() {
        const fit = () => this._fitZoom();
        this._zoomOnResize = fit;
        window.addEventListener('resize', fit);
        const box = this.gameContainer?.querySelector?.('#ip-phaser-container');
        if (box && typeof window.ResizeObserver === 'function') {
            this._zoomObserver = new window.ResizeObserver(fit);
            this._zoomObserver.observe(box);
        }
        const cue = this.gameContainer?.querySelector?.('#ip-more-below');
        if (box) {
            this._onBoxScroll = () => this._updateMoreBelow();
            box.addEventListener('scroll', this._onBoxScroll, { passive: true });
        }
        if (cue && box) {
            cue.addEventListener('click', () => {
                box.scrollTo({ top: box.scrollHeight, behavior: 'auto' });
            });
            // Phaser also listens on the window and maps a press anywhere onto the canvas, so a
            // press on the cue would reach the key under it: keep the cue's presses to itself
            for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup']) {
                cue.addEventListener(type, (e) => e.stopPropagation());
            }
        }
        // With touch capture off, a tap on the canvas is followed by the browser's
        // compatibility mouse events, which Phaser would read as a second press. Cancelling
        // touchend stops them; a swipe has already scrolled by then, so panning is unaffected.
        const canvas = box?.querySelector?.('canvas');
        if (canvas) {
            this._canvasTouchEnd = (e) => { if (e.cancelable) e.preventDefault(); };
            this._touchCanvas = canvas;
            canvas.addEventListener('touchend', this._canvasTouchEnd, { passive: false });
        }
        fit();
    }

    _unwatchZoom() {
        if (this._zoomOnResize) window.removeEventListener('resize', this._zoomOnResize);
        this._zoomOnResize = null;
        this._zoomObserver?.disconnect?.();
        this._zoomObserver = null;
        const box = this.gameContainer?.querySelector?.('#ip-phaser-container');
        if (box && this._onBoxScroll) box.removeEventListener('scroll', this._onBoxScroll);
        this._onBoxScroll = null;
        if (this._touchCanvas && this._canvasTouchEnd) this._touchCanvas.removeEventListener('touchend', this._canvasTouchEnd);
        this._touchCanvas = null;
        this._canvasTouchEnd = null;
    }

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';

        // Guard: paper MAR charts must be collected before using the pump
        const chartsCollected = window.gameState?.globalVariables?.paper_charts_collected;
        if (!chartsCollected) {
            this.gameContainer.innerHTML = `
<div class="ip-no-charts">
  <div class="ip-no-charts-icon">!</div>
  <div class="ip-no-charts-text">PAPER MAR CHARTS REQUIRED</div>
  <div class="ip-no-charts-sub">Collect the medication charts from the nursing station drawer before administering.</div>
</div>`;
            setTimeout(() => this.complete(false), 3000);
            return;
        }

        this.gameContainer.style.cssText = 'width:100%;height:100%;min-height:0;';
        this.gameContainer.innerHTML = '<div class="ip-scroll-frame">'
            + '<div id="ip-phaser-container" class="ip-phaser-container ip-pixel-scroll"></div>'
            + '<button type="button" id="ip-more-below" class="ip-more-below" hidden>MORE BELOW<span class="ip-more-below-arrow" aria-hidden="true"></span></button>'
            + '</div>';
        this._setupPhaserGame();
    }

    start() {
        super.start();
    }

    complete(success) {
        this._stopCursor();
        this._unwatchZoom();
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
        super.complete(success);
    }

    cleanup() {
        this._stopCursor();
        this._unwatchZoom();
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
        super.cleanup();
    }

    // ── Phaser setup ─────────────────────────────────────────────────────────

    _setupPhaserGame() {
        const self = this;

        class InfusionPumpScene extends Phaser.Scene {
            constructor() { super({ key: 'InfusionPumpScene' }); }
            create() {
                self.scene = this;
                self._buildPrescriptionPanel(this);
                self._buildPumpDevice(this);
                self._startCursor();
                // The canvas exists now: pick its whole-number zoom, then put the X
                // inside its top-right corner
                self._watchZoom();
            }
        }

        try {
            this.phaserGame = new Phaser.Game({
                type: Phaser.AUTO,
                parent: 'ip-phaser-container',
                width: W,
                height: H,
                backgroundColor: '#0d1324',
                // Hard pixels, never smoothed (slice 7 R1 M3), and only ever zoomed by a whole
                // number (R2 M2): a fractional FIT scale drops rows of the pixel text
                pixelArt: true,
                roundPixels: true,
                scene: InfusionPumpScene,
                // A swipe on the canvas scrolls its box on a short screen (slice 7 R3 M1): Phaser
                // stops capturing touch, taps still reach the keys, and the canvas CSS allows
                // vertical panning. The wheel is left to the browser for the same reason.
                input: {
                    touch: { capture: false },
                    mouse: { preventDefaultWheel: false }
                },
                audio: {
                    context: MusicController.context
                },
                scale: {
                    mode: Phaser.Scale.NONE,
                    autoCenter: Phaser.Scale.NO_CENTER,
                    zoom: 1
                }
            });
            const wireIpAudio = () => wirePhaserGameSoundToBreakEscape(this.phaserGame);
            this.phaserGame.events.once('ready', wireIpAudio);
            requestAnimationFrame(wireIpAudio);
        } catch (err) {
            console.error('InfusionPumpMinigame: Phaser init error', err);
        }
    }

    // ── Prescription panel (left) ─────────────────────────────────────────────

    _buildPrescriptionPanel(scene) {
        const gfx = scene.add.graphics();

        // Cream background
        gfx.fillStyle(0xf5f0e8);
        gfx.fillRect(RX_X, RX_Y, RX_W, RX_H);
        gfx.lineStyle(2, 0xc8b880);
        gfx.strokeRect(RX_X, RX_Y, RX_W, RX_H);

        const cx = RX_X + RX_W / 2;  // 153
        const x0 = RX_X + 10;         // left margin for labels
        const x1 = RX_X + 96;         // left margin for values (labels are 8px a letter)

        // Legible pixel text (slice 7 R1 M3): VT323 at 16px for values, Press Start 2P at
        // 8px for the small labels and the header; whole-pixel sizes only.
        const mono = { fontFamily: 'VT323', color: '#1a1a1a' };
        const labelStyle = { fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#666666', padding: { top: 4 } };
        const valueStyle = { ...mono, fontSize: '16px', wordWrap: { width: RX_X + RX_W - 8 - x1 } };
        const tinyStyle  = { ...mono, fontSize: '16px', color: '#444444' };

        // Rows are placed from each text's measured height, with a 4px gap below the
        // tallest text of a row and dividers 4px clear of the text on both sides, so no
        // divider runs through a row (slice 7 R2 M1)
        let y = 12;
        const divider = () => {
            y += 2;
            gfx.lineStyle(2, 0xc8b880);
            gfx.lineBetween(RX_X + 6, y, RX_X + RX_W - 6, y);
            y += 6;
        };
        const row = (lbl, val, style = valueStyle) => {
            const l = scene.add.text(x0, y, lbl, labelStyle);
            const v = scene.add.text(x1, y, val, style);
            y += Math.ceil(Math.max(l.height, v.height)) + 4;
        };

        // Hospital header
        const header = scene.add.text(cx, y, 'NORTHGATE GENERAL HOSPITAL NHS TRUST', {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#1a1a1a',
            align: 'center', lineSpacing: 4, wordWrap: { width: RX_W - 16 }
        }).setOrigin(0.5, 0);
        y += Math.ceil(header.height) + 4;

        const sub = scene.add.text(cx, y, 'WARD 7: MEDICATION ADMINISTRATION RECORD', {
            ...tinyStyle, align: 'center', wordWrap: { width: RX_W - 16 }
        }).setOrigin(0.5, 0);
        y += Math.ceil(sub.height);
        divider();

        // Patient info fields
        row('PATIENT',    this.sd.patient    || 'CHEN, MARY (DOB: 14/03/1962)');
        row('WARD',       this.sd.ward_bed   || 'Ward 7, Bed 2');
        row('CONSULTANT', this.sd.consultant || 'Dr. J. Patel');
        divider();

        // Drug field
        row('DRUG', `${this.drugName} (IV)`);
        y += 2;

        // ── Dose line (the decimal-ambiguity mechanic) ──
        // Highlighted box — dose always shown as "10.0 mg/hr" in VT323 with tight
        // letter-spacing so the decimal is visually tiny, tempting misread as "100".
        const boxY = y;
        scene.add.text(x0, boxY + 4, 'RATE', labelStyle).setDepth(1);

        // VT323 with letterSpacing: -2 makes the "." tiny — the ambiguity mechanic
        const rate = scene.add.text(x1, boxY + 4, this.rateDisplay, {
            fontFamily: 'VT323',
            fontSize: '36px',
            color: '#1a1a1a',
            letterSpacing: -2
        }).setDepth(1);
        const boxH = Math.max(52, Math.ceil(rate.height) + 8);
        const boxGfx = scene.add.graphics();
        boxGfx.fillStyle(0xede8d8);
        boxGfx.fillRect(RX_X + 6, boxY, RX_W - 12, boxH);
        boxGfx.lineStyle(2, 0xc8b880);
        boxGfx.strokeRect(RX_X + 6, boxY, RX_W - 12, boxH);
        y = boxY + boxH + 4;
        divider();

        // Remaining fields
        row('ROUTE',    'Intravenous');
        row('DURATION', this.sd.duration || '4 hours');
        divider();

        // Signature fields
        row('PRESCRIBER', this.sd.prescriber || 'Dr. J. Patel');
        row('PHARMACY', 'Checked');
        row('NURSE', '____________', { ...mono, fontSize: '16px', color: '#aaaaaa' });

        if (this.sd.allergies) {
            y += 4;
            row('ALLERGIES', this.sd.allergies, { ...valueStyle, color: '#b00020' });
        }
    }

    // ── Pump device (right panel) ─────────────────────────────────────────────

    _buildPumpDevice(scene) {
        const gfx = scene.add.graphics();

        // Bezel (grey pump body)
        gfx.fillStyle(0xc0c5c8);
        gfx.fillRect(PMP_X, PMP_Y, PMP_W, PMP_H);
        gfx.lineStyle(3, 0x8a9199);
        gfx.strokeRect(PMP_X, PMP_Y, PMP_W, PMP_H);

        // Corner "screw" inset highlights
        const inset = 6;
        const screwSize = 8;
        gfx.fillStyle(0xa0a5a8);
        [[PMP_X + inset, PMP_Y + inset],
         [PMP_X + PMP_W - inset - screwSize, PMP_Y + inset],
         [PMP_X + inset, PMP_Y + PMP_H - inset - screwSize],
         [PMP_X + PMP_W - inset - screwSize, PMP_Y + PMP_H - inset - screwSize]
        ].forEach(([sx, sy]) => gfx.fillRect(sx, sy, screwSize, screwSize));

        this._buildScreen(scene);
        this._buildKeypad(scene);
        this._buildConfirmButton(scene);
    }

    _buildScreen(scene) {
        const gfx = scene.add.graphics();

        // Screen background
        gfx.fillStyle(0x0a1a0a);
        gfx.fillRect(SCR_X, SCR_Y, SCR_W, SCR_H);

        // Screen border — stored as rectangle so we can animate it on accept
        this._screenRect = scene.add.rectangle(
            SCR_X + SCR_W / 2, SCR_Y + SCR_H / 2, SCR_W, SCR_H
        ).setStrokeStyle(2, 0x1a3a1a).setFillStyle();  // transparent fill, only stroke

        const sx = SCR_X + 8;
        const screenText = { fontFamily: 'VT323', fontSize: '16px', color: '#00e060' };

        scene.add.text(sx, SCR_Y + 8,  `DRUG: ${this.drugName}`,         screenText);
        scene.add.text(sx, SCR_Y + 26, 'CURRENT RATE:  -- mg/hr',         screenText);
        scene.add.text(sx, SCR_Y + 44, 'VOL REMAINING: 50 mL',            screenText);

        // Divider line on screen, clear of the VOL REMAINING glyphs above it and the rows below
        // (slice 7 R3 m3): the 16px VT323 row at +44 inks down to about +62
        const dg = scene.add.graphics();
        dg.lineStyle(2, 0x1a5a1a);
        dg.lineBetween(SCR_X + 4, SCR_Y + 66, SCR_X + SCR_W - 4, SCR_Y + 66);

        const libraryCompromised = this._libraryTampered();

        if (libraryCompromised && this.sd.library_ok_global) {
            scene.add.text(sx, SCR_Y + 69,
                `LIBRARY RANGE: ${this.libraryMin}${this.libraryMax != null ? ' \u2013 ' + this.libraryMax : ''} mg/hr`, {
                fontFamily: 'VT323', fontSize: '16px', color: '#00e060'
            });
            scene.add.text(sx, SCR_Y + 84, 'ENTER NEW RATE (mg/hr):', screenText);
        } else if (libraryCompromised) {
            scene.add.text(sx, SCR_Y + 69, '! DRUG LIB MIN: 25 mg/hr  [LIBRARY OVERRIDE]', {
                fontFamily: 'VT323', fontSize: '16px', color: '#ff8800'
            });
            scene.add.text(sx, SCR_Y + 84, 'ENTER OVERRIDE RATE (mg/hr):', {
                ...screenText, color: '#ff8800'
            });
        } else if (this.restoredMin != null && this.restoredMax != null) {
            scene.add.text(sx, SCR_Y + 69, `LIBRARY RANGE: ${this.restoredMin} \u2013 ${this.restoredMax} mg/hr`, {
                fontFamily: 'VT323', fontSize: '16px', color: '#00e060'
            });
            scene.add.text(sx, SCR_Y + 84, 'ENTER NEW RATE (mg/hr):', screenText);
        } else {
            scene.add.text(sx, SCR_Y + 74, 'ENTER NEW RATE (mg/hr):', screenText);
        }

        // Display row — larger text showing current input + cursor
        this._displayText = scene.add.text(sx, (libraryCompromised || (this.restoredMin != null && this.restoredMax != null)) ? SCR_Y + 110 : SCR_Y + 102, '_', {
            fontFamily: 'VT323',
            fontSize: '32px',
            color: (libraryCompromised && !this.sd.library_ok_global) ? '#ff8800' : '#00ff88',
            letterSpacing: 1
        });
    }

    _buildKeypad(scene) {
        const keys = ['1','2','3','4','5','6','7','8','9','.','0','DEL'];

        keys.forEach((k, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);

            const bx = PMP_IX + col * (KP_BTN_W + KP_GAP);
            const by = KP_Y0  + row * (KP_BTN_H + KP_GAP);
            const cx = bx + KP_BTN_W / 2;
            const cy = by + KP_BTN_H / 2;

            // Colour differentiation
            const isBack    = (k === 'DEL');
            const isDot     = (k === '.');
            const fillNorm  = isBack ? 0xd8c0b0 : isDot ? 0xd8d8c0 : 0xd0d5d8;
            const fillHover = isBack ? 0xe8d0c0 : isDot ? 0xe8e8d0 : 0xe0e5e8;
            const fillDown  = isBack ? 0xb0a090 : isDot ? 0xb0b0a0 : 0xb0b5b8;
            const strokeCol = isBack ? 0x9a7060 : isDot ? 0x9a9a70 : 0x8a9199;

            const btn = scene.add.rectangle(cx, cy, KP_BTN_W, KP_BTN_H, fillNorm)
                .setStrokeStyle(2, strokeCol)
                .setInteractive({ useHandCursor: true })
                .on('pointerover',  () => btn.setFillStyle(fillHover))
                .on('pointerout',   () => btn.setFillStyle(this.confirmed ? fillNorm : fillNorm))
                .on('pointerdown',  () => btn.setFillStyle(fillDown))
                .on('pointerup',    () => btn.setFillStyle(fillNorm));
            this._onTap(btn, () => {
                if (k === 'DEL') this.handleBackspace();
                else if (k === '.') this.handleDecimal();
                else this.handleDigit(k);
            });

            // Key label
            const label = isBack ? 'DEL' : k;   // pixel font has no erase glyph (slice 7)
            scene.add.text(cx, cy, label, {
                fontFamily: "'Press Start 2P', monospace",
                fontSize:   '16px',   // Press Start 2P on its 8px grid; DEL matches the digits (R3 n3)
                color: '#1a1a1a'
            }).setOrigin(0.5);
        });
    }

    _buildConfirmButton(scene) {
        const cx = PMP_IX + PMP_IW / 2;
        const cy = CONF_Y + CONF_H / 2;

        this._confirmBtn = scene.add.rectangle(cx, cy, PMP_IW, CONF_H, 0x1a4a1a)
            .setStrokeStyle(2, 0x00c853)
            .setInteractive({ useHandCursor: true })
            .on('pointerover',  () => this._confirmBtn.setFillStyle(0x2a5a2a))
            .on('pointerout',   () => this._confirmBtn.setFillStyle(0x1a4a1a))
            .on('pointerup',    () => this._confirmBtn.setFillStyle(0x1a4a1a));
        this._onTap(this._confirmBtn, () => this.handleConfirm());

        scene.add.text(cx, cy, 'CONFIRM', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '16px',
            color: '#00ff88',
            letterSpacing: 1
        }).setOrigin(0.5);
    }

    // ── Cursor ────────────────────────────────────────────────────────────────

    _startCursor() {
        this._showCursor = true;
        this._cursorTimer = setInterval(() => {
            this._showCursor = !this._showCursor;
            this._updateDisplay();
        }, 500);
    }

    _stopCursor() {
        if (this._cursorTimer) {
            clearInterval(this._cursorTimer);
            this._cursorTimer = null;
        }
    }

    // ── Display update ────────────────────────────────────────────────────────

    _updateDisplay() {
        if (!this._displayText) return;
        // A flashed screen message stays up for its full time unless the user types.
        if (this._flashUntil) {
            if (Date.now() < this._flashUntil && !this.currentInput) return;
            this._flashUntil = 0;
            if (this._displayBaseColour) this._displayText.setColor(this._displayBaseColour);
        }
        const cursor = this._showCursor ? '_' : ' ';
        this._displayText.setText((this.currentInput || '') + cursor);
    }

    // ── Input handlers ────────────────────────────────────────────────────────

    handleDigit(d) {
        if (this.confirmed || this._modalVisible) return;
        if (this.currentInput.length >= 6) return;
        this.currentInput += d;
        this._updateDisplay();
    }

    handleDecimal() {
        if (this.confirmed || this._modalVisible) return;
        if (this.currentInput.includes('.')) return;
        if (this.currentInput.length >= 5) return;
        this.currentInput += '.';
        this._updateDisplay();
    }

    handleBackspace() {
        if (this.confirmed || this._modalVisible) return;
        this.currentInput = this.currentInput.slice(0, -1);
        this._updateDisplay();
    }

    handleConfirm() {
        if (this.confirmed || this._modalVisible) return;
        if (!this.currentInput || this.currentInput === '.') return;

        const entered  = parseFloat(this.currentInput);
        const correct  = parseFloat(this.correctDose);
        const isCorrect = (entered === correct);
        const libraryCompromised = this._libraryTampered();

        if (libraryCompromised && this.sd.library_ok_global) {
            // Tampered library loaded on the pump (configured scenarios): it judges
            // every entry by the attacker's limits.
            if (entered < this.libraryMin) {
                this._showLibraryConflictModal(this.currentInput);
            } else if (this.libraryMax != null && entered > this.libraryMax) {
                this._flashScreenMessage(`ABOVE MAX ${this.libraryMax} \u2014 RE-ENTER`);
            } else if (isCorrect) {
                this._acceptCorrect();
            } else {
                // Inside the attacker's range: accepted without any alert.
                this._acceptWrongSilent();
            }
        } else if (isCorrect && libraryCompromised) {
            // Library disputes the correct dose — player must confirm the override
            this._showLibraryConflictModal(this.currentInput);
        } else if (isCorrect) {
            this._acceptCorrect();
        } else if (!libraryCompromised && this.restoredMin != null && this.restoredMax != null
                   && (entered < this.restoredMin || entered > this.restoredMax)) {
            // Verified library: an entry outside its range is stopped at the pump.
            this._flashScreenMessage(`OUTSIDE ${this.restoredMin}\u2013${this.restoredMax} \u2014 RE-ENTER`);
        } else if (libraryCompromised) {
            // Drug library compromised — guardrail absent, pump silently accepts wrong dose
            this._acceptWrongSilent();
        } else {
            // Normal path — show double-check modal
            this._showDoubleCheckModal(this.currentInput);
        }
    }

    // Is the pump running on the tampered library? Scenarios that set
    // library_ok_global treat the library as tampered until that global is true
    // (it was loaded before anyone knew); otherwise the old rule applies.
    _libraryTampered() {
        const g = window.gameState?.globalVariables || {};
        if (this.sd.library_ok_global) return !g[this.sd.library_ok_global];
        return !!g.drug_library_compromised;
    }

    _flashScreenMessage(text) {
        this.currentInput = '';
        if (!this._displayText) return;
        if (!this._flashUntil) this._displayBaseColour = this._displayText.style?.color || '#00ff88';
        this._flashUntil = Date.now() + 1800;
        this._displayText.setText(text).setColor('#ff4444');
        setTimeout(() => {
            if (!this.confirmed && this._displayText) this._updateDisplay();
        }, 1850);
    }

    // ── Accept paths ──────────────────────────────────────────────────────────

    // The in-game time the rate went in, for the fleet report (sis01 blind playtest D7).
    // Only when the scenario names a global for it.
    _recordProgrammedTime() {
        if (this.sd.programmed_at_global) {
            this.setGlobalAndNotify(this.sd.programmed_at_global, currentClockText(false));
        }
    }

    _acceptCorrect() {
        this.confirmed = true;
        this._stopCursor();
        this._recordProgrammedTime();
        this.setGlobalAndNotify('pump_dose_correct', true);

        if (this._displayText) {
            this._displayText.setText(`RATE SET \u2014 ${this.currentInput} mg/hr`).setColor('#00ff88');
        }
        if (this._screenRect) {
            this._screenRect.setStrokeStyle(2, 0x00c853);
        }
        setTimeout(() => this.complete(true), 2000);
    }

    _acceptWrongSilent() {
        // No warning shown — the missing guardrail IS the safety teaching moment
        this.confirmed = true;
        this._stopCursor();
        this._recordProgrammedTime();
        this.setGlobalAndNotify('pump_dose_error', true);

        if (this._displayText) {
            this._displayText.setText(`RATE SET \u2014 ${this.currentInput} mg/hr`).setColor('#00ff88');
        }
        if (this._screenRect) {
            this._screenRect.setStrokeStyle(2, 0x00c853);
        }
        setTimeout(() => this.complete(true), 2000);
    }

    // ── Library conflict modal (correct dose flagged by tampered library) ────────

    _showLibraryConflictModal(enteredValue) {
        if (!this.scene) return;
        this._modalVisible = true;
        const scene = this.scene;

        const mx = W / 2;
        const my = H / 2;
        const mw = 420;
        const mh = 320;

        const overlay  = scene.add.rectangle(mx, my, W, H, 0x000000, 0.78).setDepth(100);
        const box      = scene.add.rectangle(mx, my, mw, mh, 0x1a0d00)
            .setStrokeStyle(2, 0xff8800).setDepth(101);
        const titleTxt = scene.add.text(mx, my - mh / 2 + 18, this.sd.conflict_title || 'DRUG LIBRARY RANGE CONFLICT', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px', color: '#ff8800',
            align: 'center', wordWrap: { width: mw - 32 }
        }).setOrigin(0.5, 0).setDepth(102);
        const drugTxt  = scene.add.text(mx, my - 80, this.drugName, {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#cccccc'
        }).setOrigin(0.5).setDepth(102);
        const libTxt   = scene.add.text(mx, my - 46, `LIBRARY MIN: ${this.libraryMin} mg/hr`, {
            fontFamily: 'VT323', fontSize: '28px', color: '#ff8800'
        }).setOrigin(0.5).setDepth(102);
        const entryTxt = scene.add.text(mx, my - 10,
            `Your entry: ${enteredValue} mg/hr \u2014 flagged as below minimum`, {
            fontFamily: 'VT323', fontSize: '16px', color: '#ffcc88',
            align: 'center', wordWrap: { width: mw - 40 }
        }).setOrigin(0.5).setDepth(102);
        const marTxt   = scene.add.text(mx, my + 18, `Paper MAR prescription: ${this.rateDisplay}`, {
            fontFamily: 'VT323', fontSize: '16px', color: '#dddddd'
        }).setOrigin(0.5).setDepth(102);
        const promptTxt = scene.add.text(mx, my + 40, this.sd.conflict_prompt || 'Trust the paper record and override the device?', {
            fontFamily: 'VT323', fontSize: '16px', color: '#aaaaaa',
            align: 'center', wordWrap: { width: mw - 40 }
        }).setOrigin(0.5).setDepth(102);

        // Both answers look the same (sis01 blind playtest decision): the colour
        // must not say which one is right.
        const BTN_FILL = 0x1c2430, BTN_HOVER = 0x2c3848, BTN_EDGE = 0x8fa3b8, BTN_TEXT = '#dde6f0';
        const confirmBtn = scene.add.rectangle(mx, my + 88, mw - 40, 38, BTN_FILL)
            .setStrokeStyle(2, BTN_EDGE).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('tap', () => this._confirmLibraryOverride())
            .on('pointerover',  () => confirmBtn.setFillStyle(BTN_HOVER))
            .on('pointerout',   () => confirmBtn.setFillStyle(BTN_FILL));
        const confirmTxt = scene.add.text(mx, my + 88, this.sd.hold_label || 'CONFIRM OVERRIDE \u2014 USE PAPER MAR', {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: BTN_TEXT
        }).setOrigin(0.5).setDepth(103);

        const cancelBtn = scene.add.rectangle(mx, my + 138, mw - 40, 38, BTN_FILL)
            .setStrokeStyle(2, BTN_EDGE).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('tap', () => this._dismissModal())
            .on('pointerover',  () => cancelBtn.setFillStyle(BTN_HOVER))
            .on('pointerout',   () => cancelBtn.setFillStyle(BTN_FILL));
        this._armTap(confirmBtn);
        this._armTap(cancelBtn);
        const cancelTxt = scene.add.text(mx, my + 138, this.sd.reenter_label || 'CANCEL \u2014 RE-ENTER', {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: BTN_TEXT
        }).setOrigin(0.5).setDepth(103);

        this._modalObjects = [overlay, box, titleTxt, drugTxt, libTxt, entryTxt, marTxt,
                              promptTxt, confirmBtn, confirmTxt, cancelBtn, cancelTxt];
    }

    _confirmLibraryOverride() {
        // Configured scenarios: "hold and query pharmacy". Pharmacy compares the
        // entry with the prescription, so only the prescribed rate goes ahead.
        if (this.sd.library_ok_global) {
            const entered = parseFloat(this.currentInput);
            if (entered !== parseFloat(this.correctDose)) {
                this._dismissModal();
                this._flashScreenMessage(this.sd.pharmacy_mismatch_text || 'NOT THE PRESCRIBED RATE');
                return;
            }
        }
        this.confirmed = true;
        this._stopCursor();
        this._destroyModal();
        this.setGlobalAndNotify('drug_library_override', true);
        this._acceptCorrect();
        if (this.sd.pharmacy_hold_text && this._displayText) {
            this._displayText.setText(this.sd.pharmacy_hold_text).setColor('#00ff88');
        }
    }

    // ── Double-check modal ────────────────────────────────────────────────────

    _showDoubleCheckModal(enteredValue) {
        if (!this.scene) return;
        this._modalVisible = true;
        const scene = this.scene;

        const mx = W / 2;   // modal centre x
        const my = H / 2;   // modal centre y
        const mw = 380;
        const mh = 300;

        // Semi-transparent overlay
        const overlay = scene.add.rectangle(mx, my, W, H, 0x000000, 0.72).setDepth(100);

        // Modal box
        const box = scene.add.rectangle(mx, my, mw, mh, 0x0d1117)
            .setStrokeStyle(2, 0xf59e0b).setDepth(101);

        // Title
        const titleTxt = scene.add.text(mx, my - mh / 2 + 20, 'VERIFY DOSE BEFORE ADMINISTRATION', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            color: '#f59e0b',
            align: 'center',
            lineSpacing: 6,
            wordWrap: { width: mw - 32 }
        }).setOrigin(0.5, 0).setDepth(102);

        // Drug name
        const drugTxt = scene.add.text(mx, my - 60, this.drugName, {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            color: '#cccccc'
        }).setOrigin(0.5).setDepth(102);

        // Entered dose — large, red, VT323 (the "is this really what you want?" moment)
        const doseTxt = scene.add.text(mx, my - 18, `${enteredValue} mg/hr`, {
            fontFamily: 'VT323',
            fontSize: '52px',
            color: '#ff4444'
        }).setOrigin(0.5).setDepth(102);

        // Prompt
        const promptTxt = scene.add.text(mx, my + 40, 'Does this match the paper prescription?', {
            fontFamily: 'VT323',
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(102);

        // "CORRECT — ADMINISTER" button
        const correctBtn = scene.add.rectangle(mx, my + 82, mw - 40, 38, 0x1a4a1a)
            .setStrokeStyle(2, 0x00c853).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('tap', () => this._confirmWrongDose())
            .on('pointerover',  () => correctBtn.setFillStyle(0x2a5a2a))
            .on('pointerout',   () => correctBtn.setFillStyle(0x1a4a1a));
        const correctTxt = scene.add.text(mx, my + 82, 'CORRECT \u2014 ADMINISTER', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            color: '#00ff88'
        }).setOrigin(0.5).setDepth(103);

        // "INCORRECT — RE-ENTER" button
        const wrongBtn = scene.add.rectangle(mx, my + 130, mw - 40, 38, 0x4a1a1a)
            .setStrokeStyle(2, 0xd32f2f).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('tap', () => this._dismissModal())
            .on('pointerover',  () => wrongBtn.setFillStyle(0x5a2a2a))
            .on('pointerout',   () => wrongBtn.setFillStyle(0x4a1a1a));
        this._armTap(correctBtn);
        this._armTap(wrongBtn);
        const wrongTxt = scene.add.text(mx, my + 130, 'INCORRECT \u2014 RE-ENTER', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px',
            color: '#ff6666'
        }).setOrigin(0.5).setDepth(103);

        this._modalObjects = [overlay, box, titleTxt, drugTxt, doseTxt, promptTxt,
                              correctBtn, correctTxt, wrongBtn, wrongTxt];
    }

    _confirmWrongDose() {
        this.confirmed = true;
        this._stopCursor();
        this._destroyModal();
        this._recordProgrammedTime();
        this.setGlobalAndNotify('pump_dose_error', true);
        if (this._displayText) {
            this._displayText.setText(`RATE SET \u2014 ${this.currentInput} mg/hr`).setColor('#00ff88');
        }
        setTimeout(() => this.complete(true), 1500);
    }

    _dismissModal() {
        this._modalVisible = false;
        this._destroyModal();
        this.currentInput = '';
        this._updateDisplay();
    }

    _destroyModal() {
        this._modalObjects.forEach(o => { try { o.destroy(); } catch (_) {} });
        this._modalObjects = [];
    }

    // ── Global state writer ───────────────────────────────────────────────────

    setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables[name] = value;
        }
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }
}
