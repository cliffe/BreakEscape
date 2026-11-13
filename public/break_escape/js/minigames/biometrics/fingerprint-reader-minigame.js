import { MinigameScene } from '../framework/base-minigame.js';
import { resolveBiometricThreshold, evaluateBiometricLock } from '../../systems/biometric-lock.js';
import { normaliseSample } from '../../systems/biometric-samples.js';
import { generatePrint, drawPrint, patternForOwner } from '../dusting/fingerprint-generator.js';
import {
    READER_FORENSIC_LINE, labelForSample, messageForOutcome, headingForOutcome, failureReasonForOutcome, percent
} from './fingerprint-reader-helpers.js';
import { applyArtSlot } from './fingerprint-art.js';
import { displayDashes } from '../../utils/display-dashes.js';

const THUMB_SIZE = 64;   // logical pixels; shown at 2x so the pixels stay square
const THUMB_SCALE = 2;
const SCAN_MS = 800;
const ACCEPT_CLOSE_MS = 700;

// Generated prints are cached by (owner, pattern, variant): the cards redraw often.
const printCache = new Map();

export function printForSample(sample, size = THUMB_SIZE) {
    const pattern = sample.pattern || patternForOwner(sample.owner);
    const variant = sample.sourceObjectId || null;
    const key = `${sample.owner}|${pattern}|${variant}|${size}`;
    if (!printCache.has(key)) {
        printCache.set(key, generatePrint({ owner: sample.owner, pattern, size, variant }));
    }
    return printCache.get(key);
}

// Draw a lift card thumbnail into a canvas (logical size, scaled up by CSS at an integer factor).
export function drawSampleThumbnail(canvas, sample, size = THUMB_SIZE) {
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    drawPrint(ctx, printForSample(sample, size), { scale: 1, ink: '#1b1b1b', background: '#e6e6dc' });
}

function prefersReducedMotion() {
    try {
        return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
        return false;
    }
}

function currentSamples() {
    const raw = window.getBiometricSamples?.() || window.gameState?.biometricSamples || [];
    return raw.map(normaliseSample).filter(Boolean);
}

function targetIdFor(lockable, type) {
    if (type === 'door') {
        return lockable?.doorProperties?.connectedRoom || lockable?.doorProperties?.roomId || null;
    }
    return lockable?.scenarioData?.id || lockable?.scenarioData?.name || null;
}

function targetNameFor(lockable, type) {
    if (type === 'door') return lockable?.doorProperties?.door_sign || 'Biometric reader';
    return lockable?.scenarioData?.name || 'Biometric reader';
}

// The sign text only when the door really has one (the fallback above is not a sign).
function signTextFor(lockable, type) {
    return type === 'door' ? (lockable?.doorProperties?.door_sign || '') : (lockable?.scenarioData?.name || '');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : displayDashes(String(text));
    return div.innerHTML;
}

export class FingerprintReaderMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        params.title = 'Fingerprint Reader';
        params.showCancel = true;
        params.cancelText = 'Close';
        super(container, params);

        this.lockable = params.lockable;
        this.lockType = params.lockType || 'door';
        this.requires = params.requires;
        this.onAccepted = params.onAccepted;
        this.onRefused = params.onRefused;
        this.threshold = resolveBiometricThreshold(this.lockable, this.lockType);
        this.samples = currentSamples();
        this.lastResult = null;
        this.scanning = false;
        this._timers = [];
    }

    init() {
        super.init();
        this.container.classList.add('fingerprint-reader-container');
        this.gameContainer.classList.add('fingerprint-reader-game-container');

        const sign = escapeHtml(targetNameFor(this.lockable, this.lockType));
        this.gameContainer.innerHTML = `
            <div class="fpr-panel">
                <div class="fpr-bezel">
                    <span class="fpr-led" data-state="ready" aria-hidden="true"></span>
                    <h2 class="fpr-heading">Fingerprint Reader</h2>
                    <div class="fpr-sign"><span class="fpr-sign-tag">Sign</span> ${sign}</div>
                </div>
                <p class="fpr-prompt">Choose a lift to present to the reader.</p>
                <div class="fpr-cards" role="group" aria-label="Lifted prints"></div>
                <div class="fpr-result" role="status" aria-live="polite"></div>
                <p class="fpr-forensic">${escapeHtml(READER_FORENSIC_LINE)}</p>
                <p class="fpr-keys">Keys: arrows move between lifts, Enter or 1 to 9 presents one, Esc steps away.</p>
            </div>
        `;
        this.signText = signTextFor(this.lockable, this.lockType);
        this.bezelElement = this.gameContainer.querySelector('.fpr-bezel');
        this.ledElement = this.gameContainer.querySelector('.fpr-led');
        applyArtSlot(this.bezelElement, 'reader-bezel');
        this.cardsElement = this.gameContainer.querySelector('.fpr-cards');
        this.resultElement = this.gameContainer.querySelector('.fpr-result');

        this.cards = this.samples.map((sample, index) => this.buildCard(sample, index));
    }

    buildCard(sample, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fpr-card';
        button.dataset.sampleId = sample.id;

        const label = labelForSample(sample, { withPattern: true });
        const pct = percent(sample.quality);
        button.setAttribute('aria-label',
            `Lift ${index + 1} of ${this.samples.length}: ${label}, quality ${pct}%, ` +
            `${sample.identified ? 'identified' : 'not identified'}. Present to reader.`);

        const frame = document.createElement('div');
        frame.className = 'fpr-thumb';
        applyArtSlot(frame, 'lift-card');
        const canvas = document.createElement('canvas');
        canvas.className = 'fpr-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        drawSampleThumbnail(canvas, sample);
        canvas.style.width = `${THUMB_SIZE * THUMB_SCALE}px`;
        canvas.style.height = `${THUMB_SIZE * THUMB_SCALE}px`;
        frame.appendChild(canvas);
        const scan = document.createElement('div');
        scan.className = 'fpr-scanline';
        frame.appendChild(scan);

        const text = document.createElement('div');
        text.className = 'fpr-card-label';
        text.textContent = displayDashes(label);
        const quality = document.createElement('div');
        quality.className = 'fpr-card-quality';
        quality.textContent = `Quality ${pct}%`;
        const ident = document.createElement('div');
        ident.className = 'fpr-card-ident';
        ident.textContent = sample.identified ? '\u2714 Identified' : '? Not identified';
        const num = document.createElement('span');
        num.className = 'fpr-card-num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(index + 1);

        button.append(num, frame, text, quality, ident);
        this.addEventListener(button, 'click', () => this.present(sample, button));
        this.cardsElement.appendChild(button);
        return { sample, button };
    }

    start() {
        super.start();
        this.addEventListener(document, 'keydown', (e) => this.onKey(e));
        this.cards[0]?.button.focus();
    }

    // Arrows move between lifts; 1 to 9 present the numbered lift. Enter and Space work natively.
    onKey(e) {
        if (!this.gameState.isActive || this.scanning || this.accepted) return;
        const buttons = this.cards.map(c => c.button);
        const at = buttons.indexOf(document.activeElement);
        const focusAt = (i) => { e.preventDefault(); buttons[(i + buttons.length) % buttons.length]?.focus(); };
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') focusAt(at + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') focusAt(at < 0 ? 0 : at - 1);
        else if (/^[1-9]$/.test(e.key) && this.cards[Number(e.key) - 1]) {
            e.preventDefault();
            this.present(this.cards[Number(e.key) - 1].sample, buttons[Number(e.key) - 1]);
        }
    }

    setLed(state) {
        if (this.ledElement) this.ledElement.dataset.state = state;
    }

    present(sample, button) {
        if (this.scanning) return;
        this.scanning = true;
        this.setResult('', null);
        this.setLed('scanning');
        window.playUISound?.('card_scan');
        this.cards.forEach(c => { c.button.disabled = true; c.button.classList.remove('fpr-card-chosen', 'fpr-card-rejected'); });
        button.classList.add('fpr-card-chosen');

        if (prefersReducedMotion()) {
            this.finishScan(sample);
            return;
        }
        button.classList.add('fpr-scanning');
        this.after(SCAN_MS, () => {
            button.classList.remove('fpr-scanning');
            this.finishScan(sample);
        });
    }

    finishScan(sample) {
        const { result } = evaluateBiometricLock({
            requires: this.requires,
            threshold: this.threshold,
            samples: this.samples,
            chosenSampleId: sample.id
        });
        this.lastResult = result;
        this.scanning = false;
        this.setResult(messageForOutcome(result, { sample, threshold: this.threshold, signText: this.signText }), result);

        window.eventDispatcher?.emit('biometric_scan', {
            targetType: this.lockType,
            targetId: targetIdFor(this.lockable, this.lockType),
            result,
            owner: sample.owner
        });

        if (result === 'accepted') {
            this.accepted = true;
            this.setLed('ok');
            window.playUISound?.('confirm');
            window.gameAlert?.(`You unlocked the ${this.lockType} with ${sample.ownerName || sample.owner}'s fingerprint.`,
                'success', 'Biometric Unlock Successful', 5000);
            this.after(prefersReducedMotion() ? 0 : ACCEPT_CLOSE_MS, () => {
                this.complete(true);
                if (typeof this.onAccepted === 'function') this.onAccepted();
            });
            return;
        }
        // Stays open on a failure; the player can try another lift.
        this.setLed(result === 'low_quality' ? 'partial' : 'no');
        window.playUISound?.('reject');
        refuse(this.lockable, this.lockType, result, this.onRefused);
        this.cards.forEach(c => { c.button.disabled = false; });
        const chosen = this.cards.find(c => c.button.classList.contains('fpr-card-chosen'));
        chosen?.button.classList.add('fpr-card-rejected');
        chosen?.button.focus();
    }

    setResult(message, result) {
        this.resultElement.className = `fpr-result${result ? ` fpr-result-${result}` : ''}`;
        this.resultElement.textContent = '';
        if (!message) return;
        const { glyph, title } = headingForOutcome(result);
        const head = document.createElement('div');
        head.className = 'fpr-result-title';
        const g = document.createElement('span');
        g.setAttribute('aria-hidden', 'true');
        g.textContent = `${glyph} `;
        head.append(g, document.createTextNode(title));
        const body = document.createElement('div');
        body.className = 'fpr-result-body';
        body.textContent = message;
        this.resultElement.append(head, body);
    }

    after(ms, fn) {
        if (ms <= 0) { fn(); return; }
        this._timers.push(setTimeout(fn, ms));
    }

    getTestState() {
        return {
            ...super.getTestState(),
            cards: this.cards.map((c, index) => ({
                index,
                label: labelForSample(c.sample, { withPattern: true }),
                quality: c.sample.quality,
                identified: c.sample.identified === true
            })),
            lastResult: this.lastResult,
            sign: this.signText,
            required: { threshold: this.threshold },
            // For automated runs: the lift that is enrolled for this reader
            debug: {
                correctCardIndex: this.cards.findIndex(c => evaluateBiometricLock({
                    requires: this.requires, threshold: 0, samples: [c.sample], chosenSampleId: c.sample.id
                }).result !== 'no_match')
            }
        };
    }

    cleanup() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        super.cleanup();
    }
}

// A refused attempt. The caller's onRefused(reason) may report it (unlock-system passes
// emitDoorUnlockFailed); without one, doors tell the NPC event system directly.
function refuse(lockable, type, result, onRefused) {
    if (typeof onRefused === 'function') {
        onRefused(failureReasonForOutcome(result));
        return;
    }
    emitDoorFailure(lockable, type, result);
}

function emitDoorFailure(lockable, type, result) {
    if (type !== 'door' || !window.eventDispatcher) return;
    const props = lockable?.doorProperties || {};
    const payload = {
        roomId: props.roomId,
        connectedRoom: props.connectedRoom,
        direction: props.direction,
        lockType: 'biometric',
        reason: failureReasonForOutcome(result)
    };
    window.eventDispatcher.emit('door_unlock_failed', payload);
    if (props.connectedRoom) window.eventDispatcher.emit(`door_unlock_failed:${props.connectedRoom}`, payload);
}

/**
 * Open the reader for a biometric lock. With no lifted prints it shows one alert and no overlay.
 * onAccepted runs after the overlay closes on an accepted lift; the optional onRefused(reason)
 * runs on every refusal (the overlay stays open).
 */
export function startFingerprintReader(lockable, type, lockRequirements, onAccepted, onRefused) {
    const requires = lockRequirements?.requires;
    const samples = currentSamples();

    if (samples.length === 0) {
        window.eventDispatcher?.emit('biometric_scan', {
            targetType: type, targetId: targetIdFor(lockable, type), result: 'no_samples', owner: requires ?? null
        });
        refuse(lockable, type, 'no_samples', onRefused);
        window.gameAlert?.(messageForOutcome('no_samples'), 'error', 'Fingerprint Reader', 5000);
        return null;
    }

    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available; cannot start the fingerprint reader');
        return null;
    }
    if (!window.MinigameFramework.mainGameScene && window.game) {
        window.MinigameFramework.init(window.game);
    }

    return window.MinigameFramework.startMinigame('fingerprint-reader', null, {
        title: 'Fingerprint Reader',
        lockable, lockType: type, requires, onAccepted, onRefused
    });
}
