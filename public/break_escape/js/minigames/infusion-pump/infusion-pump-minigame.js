import { MinigameScene } from '../framework/base-minigame.js';
import MusicController from '../../music/music-controller.js';
import { wirePhaserGameSoundToBreakEscape } from '../../music/phaser-audio-bus.js';

// Canvas dimensions for the Phaser scene
const W = 820;  // canvas width
const H = 510;  // canvas height

// Layout constants
const RX_X = 8;   const RX_Y = 8;   const RX_W = 290; const RX_H = 494;  // prescription panel
const PMP_X = 302; const PMP_Y = 8;  const PMP_W = 510; const PMP_H = 494; // pump bezel

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

export class InfusionPumpMinigame extends MinigameScene {
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

        this.gameContainer.style.cssText = 'width:100%;height:100%;min-height:400px;';
        this.gameContainer.innerHTML = '<div id="ip-phaser-container" style="width:100%;height:100%"></div>';
        this._setupPhaserGame();
    }

    start() {
        super.start();
    }

    complete(success) {
        this._stopCursor();
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
        super.complete(success);
    }

    cleanup() {
        this._stopCursor();
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
            }
        }

        try {
            this.phaserGame = new Phaser.Game({
                type: Phaser.AUTO,
                parent: 'ip-phaser-container',
                width: W,
                height: H,
                backgroundColor: '#0d1324',
                scene: InfusionPumpScene,
                audio: {
                    context: MusicController.context
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
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
        const x1 = RX_X + 80;         // left margin for values

        const mono = { fontFamily: 'monospace', color: '#1a1a1a' };
        const labelStyle = { ...mono, fontSize: '8px', color: '#666666' };
        const valueStyle = { ...mono, fontSize: '9px' };
        const tinyStyle  = { ...mono, fontSize: '7px', color: '#444444' };

        // Hospital header
        scene.add.text(cx, 24, 'NORTHGATE GENERAL HOSPITAL NHS TRUST', {
            ...mono, fontSize: '8px', fontStyle: 'bold', align: 'center', wordWrap: { width: RX_W - 16 }
        }).setOrigin(0.5, 0);

        scene.add.text(cx, 38, 'WARD 7 \u2014 MEDICATION ADMINISTRATION RECORD', {
            ...tinyStyle, align: 'center', wordWrap: { width: RX_W - 16 }
        }).setOrigin(0.5, 0);

        // Divider
        gfx.lineStyle(1, 0xc8b880);
        gfx.lineBetween(RX_X + 6, 54, RX_X + RX_W - 6, 54);

        // Patient info fields
        const fields1 = [
            ['PATIENT',    'CHEN, MARY (DOB: 14/03/1962)', 63],
            ['WARD',       'Ward 7, Bed 2',                79],
            ['CONSULTANT', 'Dr. J. Patel',                 95],
        ];
        fields1.forEach(([lbl, val, y]) => {
            scene.add.text(x0, y, lbl, labelStyle);
            scene.add.text(x1, y, val, valueStyle);
        });

        gfx.lineBetween(RX_X + 6, 108, RX_X + RX_W - 6, 108);

        // Drug field
        scene.add.text(x0, 116, 'DRUG', labelStyle);
        scene.add.text(x1, 116, `${this.drugName} (IV)`, valueStyle);

        // ── Dose line (the decimal-ambiguity mechanic) ──
        // Highlighted box — dose always shown as "10.0 mg/hr" in VT323 with tight
        // letter-spacing so the decimal is visually tiny, tempting misread as "100".
        gfx.fillStyle(0xede8d8);
        gfx.fillRect(RX_X + 6, 130, RX_W - 12, 52);
        gfx.lineStyle(1, 0xc8b880);
        gfx.strokeRect(RX_X + 6, 130, RX_W - 12, 52);

        scene.add.text(x0, 134, 'RATE', labelStyle);

        // VT323 with letterSpacing: -2 makes the "." tiny — the ambiguity mechanic
        scene.add.text(x1, 134, '10.0 mg/hr', {
            fontFamily: 'VT323',
            fontSize: '36px',
            color: '#1a1a1a',
            letterSpacing: -2
        });

        gfx.lineBetween(RX_X + 6, 190, RX_X + RX_W - 6, 190);

        // Remaining fields
        const fields2 = [
            ['ROUTE',    'Intravenous',  198],
            ['DURATION', '4 hours',      214],
        ];
        fields2.forEach(([lbl, val, y]) => {
            scene.add.text(x0, y, lbl, labelStyle);
            scene.add.text(x1, y, val, valueStyle);
        });

        gfx.lineBetween(RX_X + 6, 228, RX_X + RX_W - 6, 228);

        // Signature fields
        scene.add.text(x0, 236, 'PRESCRIBER', labelStyle);
        scene.add.text(x1, 236, 'Dr. J. Patel', { ...valueStyle, fontStyle: 'italic' });

        scene.add.text(x0, 252, 'PHARMACY', labelStyle);
        scene.add.text(x1, 252, 'Checked \u2713', valueStyle);

        scene.add.text(x0, 268, 'NURSE', labelStyle);
        scene.add.text(x1, 268, '________________', { ...mono, fontSize: '9px', color: '#aaaaaa' });
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

        // Divider line on screen
        const dg = scene.add.graphics();
        dg.lineStyle(1, 0x1a5a1a);
        dg.lineBetween(SCR_X + 4, SCR_Y + 60, SCR_X + SCR_W - 4, SCR_Y + 60);

        const libraryCompromised = !!window.gameState?.globalVariables?.drug_library_compromised;

        if (libraryCompromised) {
            scene.add.text(sx, SCR_Y + 63, '\u26A0 DRUG LIB MIN: 25 mg/hr  [LIBRARY OVERRIDE]', {
                fontFamily: 'VT323', fontSize: '13px', color: '#ff8800'
            });
            scene.add.text(sx, SCR_Y + 78, 'ENTER OVERRIDE RATE (mg/hr):', {
                ...screenText, color: '#ff8800'
            });
        } else {
            scene.add.text(sx, SCR_Y + 68, 'ENTER NEW RATE (mg/hr):', screenText);
        }

        // Display row — larger text showing current input + cursor
        this._displayText = scene.add.text(sx, libraryCompromised ? SCR_Y + 104 : SCR_Y + 96, '_', {
            fontFamily: 'VT323',
            fontSize: '32px',
            color: libraryCompromised ? '#ff8800' : '#00ff88',
            letterSpacing: 1
        });
    }

    _buildKeypad(scene) {
        const keys = ['1','2','3','4','5','6','7','8','9','.','0','\u232B'];

        keys.forEach((k, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);

            const bx = PMP_IX + col * (KP_BTN_W + KP_GAP);
            const by = KP_Y0  + row * (KP_BTN_H + KP_GAP);
            const cx = bx + KP_BTN_W / 2;
            const cy = by + KP_BTN_H / 2;

            // Colour differentiation
            const isBack    = (k === '\u232B');
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
                .on('pointerdown',  () => {
                    btn.setFillStyle(fillDown);
                    if (k === '\u232B') this.handleBackspace();
                    else if (k === '.') this.handleDecimal();
                    else this.handleDigit(k);
                })
                .on('pointerup',    () => btn.setFillStyle(fillNorm));

            // Key label
            const label = isBack ? '\u232B' : k;
            scene.add.text(cx, cy, label, {
                fontFamily: isBack ? 'monospace' : "'Press Start 2P', monospace",
                fontSize:   isDot  ? '18px' : isBack ? '20px' : '12px',
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
            .on('pointerdown',  () => this.handleConfirm())
            .on('pointerup',    () => this._confirmBtn.setFillStyle(0x1a4a1a));

        scene.add.text(cx, cy, 'CONFIRM', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '11px',
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
        const libraryCompromised = !!window.gameState?.globalVariables?.drug_library_compromised;

        if (isCorrect && libraryCompromised) {
            // Library disputes the correct dose — player must confirm the override
            this._showLibraryConflictModal(this.currentInput);
        } else if (isCorrect) {
            this._acceptCorrect();
        } else if (libraryCompromised) {
            // Drug library compromised — guardrail absent, pump silently accepts wrong dose
            this._acceptWrongSilent();
        } else {
            // Normal path — show double-check modal
            this._showDoubleCheckModal(this.currentInput);
        }
    }

    // ── Accept paths ──────────────────────────────────────────────────────────

    _acceptCorrect() {
        this.confirmed = true;
        this._stopCursor();
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
        const titleTxt = scene.add.text(mx, my - mh / 2 + 18, 'DRUG LIBRARY RANGE CONFLICT', {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px', color: '#ff8800',
            align: 'center', wordWrap: { width: mw - 32 }
        }).setOrigin(0.5, 0).setDepth(102);
        const drugTxt  = scene.add.text(mx, my - 80, this.drugName, {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#cccccc'
        }).setOrigin(0.5).setDepth(102);
        const libTxt   = scene.add.text(mx, my - 46, 'LIBRARY MIN: 25 mg/hr', {
            fontFamily: 'VT323', fontSize: '28px', color: '#ff8800'
        }).setOrigin(0.5).setDepth(102);
        const entryTxt = scene.add.text(mx, my - 10,
            `Your entry: ${enteredValue} mg/hr \u2014 flagged as below minimum`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffcc88',
            align: 'center', wordWrap: { width: mw - 40 }
        }).setOrigin(0.5).setDepth(102);
        const marTxt   = scene.add.text(mx, my + 18, 'Paper MAR prescription: 10 mg/hr', {
            fontFamily: 'monospace', fontSize: '11px', color: '#00ff88'
        }).setOrigin(0.5).setDepth(102);
        const promptTxt = scene.add.text(mx, my + 40, 'Trust the paper record and override the device?', {
            fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
            align: 'center', wordWrap: { width: mw - 40 }
        }).setOrigin(0.5).setDepth(102);

        const confirmBtn = scene.add.rectangle(mx, my + 88, mw - 40, 38, 0x1a3a1a)
            .setStrokeStyle(2, 0x00c853).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('pointerdown', () => this._confirmLibraryOverride())
            .on('pointerover',  () => confirmBtn.setFillStyle(0x2a5a2a))
            .on('pointerout',   () => confirmBtn.setFillStyle(0x1a3a1a));
        const confirmTxt = scene.add.text(mx, my + 88, 'CONFIRM OVERRIDE \u2014 USE PAPER MAR', {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#00ff88'
        }).setOrigin(0.5).setDepth(103);

        const cancelBtn = scene.add.rectangle(mx, my + 138, mw - 40, 38, 0x3a1a00)
            .setStrokeStyle(2, 0xff8800).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('pointerdown', () => this._dismissModal())
            .on('pointerover',  () => cancelBtn.setFillStyle(0x5a2a00))
            .on('pointerout',   () => cancelBtn.setFillStyle(0x3a1a00));
        const cancelTxt = scene.add.text(mx, my + 138, 'CANCEL \u2014 RE-ENTER', {
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ff8800'
        }).setOrigin(0.5).setDepth(103);

        this._modalObjects = [overlay, box, titleTxt, drugTxt, libTxt, entryTxt, marTxt,
                              promptTxt, confirmBtn, confirmTxt, cancelBtn, cancelTxt];
    }

    _confirmLibraryOverride() {
        this.confirmed = true;
        this._stopCursor();
        this._destroyModal();
        this.setGlobalAndNotify('drug_library_override', true);
        this._acceptCorrect();
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
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(102);

        // "CORRECT — ADMINISTER" button
        const correctBtn = scene.add.rectangle(mx, my + 82, mw - 40, 38, 0x1a4a1a)
            .setStrokeStyle(2, 0x00c853).setInteractive({ useHandCursor: true }).setDepth(102)
            .on('pointerdown', () => this._confirmWrongDose())
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
            .on('pointerdown', () => this._dismissModal())
            .on('pointerover',  () => wrongBtn.setFillStyle(0x5a2a2a))
            .on('pointerout',   () => wrongBtn.setFillStyle(0x4a1a1a));
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
