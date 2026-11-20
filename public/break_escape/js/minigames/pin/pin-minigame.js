import { MinigameScene } from '../framework/base-minigame.js';
import { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal, lockScopeRefusalLine, unlockWithRouteRoomRetry } from '../../utils/lock-scope-refusal.js';

// Attempts allowed per opening of the pad when the scenario doesn't set
// maxAttempts and the player has no PIN cracker. With a cracker there is no
// limit: the point is to read its lights and close in on the code.
export const DEFAULT_PIN_MAX_ATTEMPTS = 5;
// A 403 from POST /unlock with one of these reasons refuses the folder's PC, not the PIN
// (review R3 m1): the pad says so and closes, and counts no attempt. Shared with the other
// lock screens (review R4 m2).
export const PIN_SCOPE_REFUSAL_TEXT = LOCK_SCOPE_REFUSAL_TEXT;

// Guesses (and their pips) per lock, kept for the page session so closing and
// reopening a pad, or being locked out of it, doesn't wipe what the player has
// already learnt. Keyed by `${type}:${targetId}`.
const pinAttemptHistory = new Map();
export function clearPinAttemptHistory() { pinAttemptHistory.clear(); pinDustKnown.clear(); }

// Dusting with the fingerprint kit (server: PinDust). The server answers the sorted distinct
// digits of the PIN, never their order and never the PIN, and only while it sees a real kit.
// What a lock has shown is kept per page session so reopening a pad doesn't ask again; a reload
// asks the server (which stores it per lock), so the pad is still greyed. `${type}:${targetId}`.
const pinDustKnown = new Map();

/** True when the inventory holds a fingerprint kit (the server checks its own copy again). */
export function holdsFingerprintKit(items) {
    return Array.isArray(items) && items.some(item =>
        item && item.scenarioData && item.scenarioData.type === 'fingerprint_kit');
}

/** The digits a dust answer reveals, as a Set of single-character strings, or null for a bad answer. */
export function dustDigitsFrom(body) {
    if (!body || body.dusted !== true || !Array.isArray(body.digits)) return null;
    const digits = body.digits.map(String).filter(d => /^\d$/.test(d));
    return digits.length ? new Set(digits) : null;
}

/** A key is greyed once a pad is dusted and its digit is not in the PIN. */
export function isKeyGreyed(digit, dustSet) {
    return !!dustSet && /^\d$/.test(String(digit)) && !dustSet.has(String(digit));
}

/** Words for the Dust action's status line. */
export function dustSummary(dustSet) {
    if (!dustSet) return '';
    const list = [...dustSet].sort().join(' ');
    return `Dust shows the code uses: ${list}. It does not show the order.`;
}

// PIN Minigame Scene implementation
/**
 * Plain-text result of one guess, for screen readers and the test bridge.
 * feedback is { rightPlace, rightNumber } or null when no lights are shown.
 * "1 2 3 4: 1 right digit in the right place, 2 right digits in the wrong place".
 */
export function describeAttemptFeedback(input, feedback, isCorrect) {
    const digits = String(input ?? '').split('').join(' ');
    if (isCorrect) return `${digits}: correct`;
    if (!feedback) return `${digits}: incorrect`;
    const part = (n, where) => `${n} right ${n === 1 ? 'digit' : 'digits'} in the ${where} place`;
    const { rightPlace = 0, rightNumber = 0 } = feedback;
    if (!rightPlace && !rightNumber) return `${digits}: no right digits`;
    const parts = [];
    if (rightPlace) parts.push(part(rightPlace, 'right'));
    if (rightNumber) parts.push(part(rightNumber, 'wrong'));
    return `${digits}: ${parts.join(', ')}`;
}

export class PinMinigame extends MinigameScene {
    // The X sits inside the frame (MinigameScene.closeInsideFrame)
    static closeInsideFrame = true;
    constructor(container, params) {
        // Ensure params is defined before calling parent constructor
        params = params || {};
        
        // Set default title if not provided
        if (!params.title) {
            params.title = 'PIN Entry';
        }
        
        // Enable cancel button for PIN minigame
        params.showCancel = true;
        params.cancelText = 'Cancel';
        
        super(container, params);
        
        // PIN game configuration
        // Usually null: real locks are checked on the server and the PIN never
        // reaches the client. It used to default to '1234', and the cracker's
        // pips were worked out against that default, so every lock lit four
        // green pips for 1234 while the server said "incorrect". Pips now come
        // from the server (see validatePinWithServer); a local PIN is only used
        // for them when a caller passes one explicitly.
        this.correctPin = params.correctPin || null;
        this.pinLength = params.pinLength || 4;
        this.infoLeakMode = params.infoLeakMode || false;
        this.allowBackspace = params.allowBackspace !== false;
        this.hasPinCracker = params.hasPinCracker || false;
        // Dusting (fingerprint kit): the action shows when the kit is held and the lock hasn't
        // opted in (`dustable: true`); the server decides again on every ask.
        this.hasFingerprintKit = params.hasFingerprintKit || false;
        this.dustable = params.dustable === true;
        this.dustHint = typeof params.dustHint === 'string' ? params.dustHint : '';
        this.dustSet = null;
        this.dustPending = false;
        this.dustButtonElement = null;
        this.maxAttempts = this.hasPinCracker
            ? Infinity
            : (params.maxAttempts || DEFAULT_PIN_MAX_ATTEMPTS);

        // Game state
        this.currentInput = '';
        this.historyKey = this.getHistoryKey();
        // Shared with pinAttemptHistory, so earlier guesses at this lock show
        // straight away and new ones are kept after the pad closes.
        this.attempts = this.historyKey
            ? (pinAttemptHistory.get(this.historyKey) || [])
            : [];
        if (this.historyKey) pinAttemptHistory.set(this.historyKey, this.attempts);
        this.lastServerFeedback = null;
        this.attemptCount = 0;
        this.lastAttemptWasNetworkError = false;
        this.isLocked = false;
        
        // UI elements
        this.displayElement = null;
        this.keypadElement = null;
        this.attemptsLogElement = null;
        this.attemptsLiveElement = null;
        this.infoLeakToggleElement = null;
        this.pinCrackerIconElement = null;
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        return {
            ...super.getTestState(),
            pinLength: this.pinLength,
            entered: this.currentInput || '',
            enteredLength: (this.currentInput || '').length,
            attemptsUsed: this.attemptCount || 0,
            historyLength: (this.attempts || []).length,
            // null when unlimited (PIN cracker held): Infinity doesn't survive JSON
            maxAttempts: Number.isFinite(this.maxAttempts) ? this.maxAttempts : null,
            hasPinCracker: !!this.hasPinCracker,
            lastFeedback: (this.attempts || []).at(-1)?.feedback || null,
            // Same text the screen-reader row labels and live region carry
            attemptSummaries: (this.attempts || []).map(a => a.summary || describeAttemptFeedback(a.input, null, a.isCorrect)),
            lastResultSummary: this.attemptsLiveElement ? this.attemptsLiveElement.textContent : '',
            isLocked: !!this.isLocked,
            // Dusting: whether the action is on offer, and the digits left lit (null: not dusted)
            dustAvailable: !!(this.hasFingerprintKit && this.dustable),
            dustDigits: this.dustSet ? [...this.dustSet].sort() : null,
            greyedKeyDigits: this.greyedKeyDigits()
            // Drive this with clickText('1')..clickText('9') on the keypad,
            // exactly as a player taps it.
        };
    }


    init() {
        // Call parent init to set up common components
        super.init();
        
        console.log("PIN minigame initializing");
        
        // Set container dimensions
        this.container.className += ' pin-minigame-container';
        
        // Clear header content
        this.headerElement.innerHTML = '';
        
        // Configure game container
        this.gameContainer.className += ' pin-minigame-game-container';
        
        // Create the PIN interface
        this.createPinInterface();
    }
    
    createPinInterface() {
        // Create main interface container
        const interfaceContainer = document.createElement('div');
        interfaceContainer.className = 'pin-minigame-interface';
        
        // Which lock this keypad opens ("Enter PIN: Director's Safe"); the header is
        // cleared above, so the title shows here (m08 E2)
        if (this.params.title && this.params.title !== 'PIN Entry') {
            const titleElement = document.createElement('div');
            titleElement.className = 'pin-minigame-title';
            titleElement.textContent = this.params.title.replace(/ -- /g, ' \u2013 ');
            interfaceContainer.appendChild(titleElement);
        }

        // Create digital display
        const displayContainer = document.createElement('div');
        displayContainer.className = 'pin-minigame-display-container';
        
        this.displayElement = document.createElement('div');
        this.displayElement.className = 'pin-minigame-display';
        this.displayElement.textContent = '____';
        
        displayContainer.appendChild(this.displayElement);
        interfaceContainer.appendChild(displayContainer);

        // The keypad's own message line, under the display: a wrong code says so here rather
        // than in the framework's toast, which sat over keys 4 to 6 (critique A10)
        this.messageLineElement = document.createElement('div');
        this.messageLineElement.className = 'pin-minigame-message';
        this.messageLineElement.setAttribute('role', 'status');
        this.messageLineElement.setAttribute('aria-live', 'polite');
        interfaceContainer.appendChild(this.messageLineElement);
        
        // The Dust action (fingerprint kit): sits between the message line and the keys it greys
        if (this.dustable) {
            this.dustBarElement = document.createElement('div');
            this.dustBarElement.className = 'pin-minigame-dust-bar';
            if (this.hasFingerprintKit) {
                this.dustButtonElement = document.createElement('button');
                this.dustButtonElement.type = 'button';
                this.dustButtonElement.className = 'pin-minigame-dust-button';
                const dustIcon = document.createElement('img');
                dustIcon.src = '/break_escape/assets/objects/fingerprint_kit.png';
                dustIcon.alt = '';
                dustIcon.className = 'pin-minigame-dust-icon';
                const dustLabel = document.createElement('span');
                dustLabel.textContent = 'DUST KEYPAD';
                this.dustButtonElement.appendChild(dustIcon);
                this.dustButtonElement.appendChild(dustLabel);
                this.dustButtonElement.setAttribute('aria-label', 'Dust the keypad with the fingerprint kit');
                this.dustButtonElement.addEventListener('click', () => this.handleDust());
                this.dustBarElement.appendChild(this.dustButtonElement);
            }
            this.dustNoteElement = document.createElement('div');
            this.dustNoteElement.className = 'pin-minigame-dust-note';
            this.dustNoteElement.setAttribute('role', 'status');
            this.dustNoteElement.setAttribute('aria-live', 'polite');
            this.dustBarElement.appendChild(this.dustNoteElement);
            interfaceContainer.appendChild(this.dustBarElement);
        }

        // Create keypad
        this.keypadElement = document.createElement('div');
        this.keypadElement.className = 'pin-minigame-keypad';
        
        // Create number buttons in standard phone keypad layout
        // Row 1: 1, 2, 3
        for (let i = 1; i <= 3; i++) {
            const button = document.createElement('button');
            button.className = 'pin-minigame-key';
            button.textContent = i.toString();
            button.dataset.number = i.toString();
            button.addEventListener('click', () => this.handleNumberInput(i.toString()));
            this.keypadElement.appendChild(button);
        }
        
        // Row 2: 4, 5, 6
        for (let i = 4; i <= 6; i++) {
            const button = document.createElement('button');
            button.className = 'pin-minigame-key';
            button.textContent = i.toString();
            button.dataset.number = i.toString();
            button.addEventListener('click', () => this.handleNumberInput(i.toString()));
            this.keypadElement.appendChild(button);
        }
        
        // Row 3: 7, 8, 9
        for (let i = 7; i <= 9; i++) {
            const button = document.createElement('button');
            button.className = 'pin-minigame-key';
            button.textContent = i.toString();
            button.dataset.number = i.toString();
            button.addEventListener('click', () => this.handleNumberInput(i.toString()));
            this.keypadElement.appendChild(button);
        }
        
        // Row 4: 0 (centered)
        const zeroButton = document.createElement('button');
        zeroButton.className = 'pin-minigame-key';
        zeroButton.textContent = '0';
        zeroButton.dataset.number = '0';
        zeroButton.addEventListener('click', () => this.handleNumberInput('0'));
        this.keypadElement.appendChild(zeroButton);
        
        // Create backspace button if allowed
        if (this.allowBackspace) {
            const backspaceButton = document.createElement('button');
            backspaceButton.className = 'pin-minigame-key pin-minigame-backspace';
            // "DEL", as on the infusion pump: the pixel fonts have no erase glyph (slice 7 R1 m4)
            backspaceButton.textContent = 'DEL';
            backspaceButton.setAttribute('aria-label', 'Delete last digit');
            backspaceButton.addEventListener('click', () => this.handleBackspace());
            this.keypadElement.appendChild(backspaceButton);
        }
        
        // Create enter/confirm button
        const enterButton = document.createElement('button');
        enterButton.className = 'pin-minigame-key pin-minigame-enter';
        enterButton.textContent = 'ENTER';
        enterButton.addEventListener('click', () => this.handleEnter());
        this.keypadElement.appendChild(enterButton);
        
        interfaceContainer.appendChild(this.keypadElement);
        
        // Create attempts log
        const attemptsContainer = document.createElement('div');
        attemptsContainer.className = 'pin-minigame-attempts-container';
        
        const attemptsTitle = document.createElement('div');
        attemptsTitle.className = 'pin-minigame-attempts-title';
        attemptsTitle.textContent = 'Attempts Log:';
        attemptsContainer.appendChild(attemptsTitle);
        
        this.attemptsLogElement = document.createElement('div');
        this.attemptsLogElement.className = 'pin-minigame-attempts-log';
        attemptsContainer.appendChild(this.attemptsLogElement);

        // Announces the latest guess's result (the lights alone are visual only)
        this.attemptsLiveElement = document.createElement('div');
        this.attemptsLiveElement.className = 'pin-minigame-sr-only';
        this.attemptsLiveElement.setAttribute('aria-live', 'polite');
        this.attemptsLiveElement.setAttribute('role', 'status');
        attemptsContainer.appendChild(this.attemptsLiveElement);
        
        interfaceContainer.appendChild(attemptsContainer);
        
        // Create pin-cracker info leak mode toggle (if pin-cracker is available)
        if (this.hasPinCracker) {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'pin-minigame-toggle-container';
            
            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'pin-minigame-toggle-label';
            
            // Add pin-cracker icon
            this.pinCrackerIconElement = document.createElement('img');
            this.pinCrackerIconElement.src = '/break_escape/assets/objects/pin-cracker.png';
            this.pinCrackerIconElement.alt = 'Pin Cracker';
            this.pinCrackerIconElement.className = 'pin-minigame-cracker-icon';
            this.pinCrackerIconElement.style.display = 'inline-block'; // Show by default when pin-cracker is available
            
            const toggleText = document.createElement('span');
            toggleText.textContent = 'PIN cracker lights:';
            
            this.infoLeakToggleElement = document.createElement('input');
            this.infoLeakToggleElement.type = 'checkbox';
            this.infoLeakToggleElement.className = 'pin-minigame-toggle';
            this.infoLeakToggleElement.checked = true; // Start enabled when pin-cracker is available
            this.infoLeakToggleElement.addEventListener('change', () => {
                this.updateAttemptsDisplay();
                this.updatePinCrackerIcon();
            });
            
            toggleLabel.appendChild(this.pinCrackerIconElement);
            toggleLabel.appendChild(toggleText);
            toggleLabel.appendChild(this.infoLeakToggleElement);
            toggleContainer.appendChild(toggleLabel);

            // How to read the lights, shown while the cracker is switched on.
            this.pinCrackerHelpElement = document.createElement('div');
            this.pinCrackerHelpElement.className = 'pin-minigame-cracker-help';
            this.pinCrackerHelpElement.innerHTML =
                '<span class="pin-minigame-light pin-minigame-light-green"></span> right digit, right place ' +
                '<span class="pin-minigame-light pin-minigame-light-amber"></span> right digit, wrong place' +
                '<br>The lights are counts, not positions. No limit on guesses while the cracker is fitted.';
            toggleContainer.appendChild(this.pinCrackerHelpElement);
            interfaceContainer.appendChild(toggleContainer);
        }
        
        // Add interface to game container
        this.gameContainer.appendChild(interfaceContainer);
        
        // Add keyboard support
        this.setupKeyboardSupport();
    }
    
    setupKeyboardSupport() {
        const keyHandler = (e) => {
            if (!this.gameState.isActive || this.isLocked) return;
            
            const key = e.key;

            // A focused control that is not part of the pad keeps its own keys: Enter on the
            // ring banner's Answer, Hang up or the minigame X presses that control, and typing
            // in a text field is not PIN entry. Pad keys, the display and the body stay ours.
            const target = e.target;
            const tag = target && target.tagName;
            // Only text-entry inputs keep digits and Backspace; a checkbox, radio, button, range,
            // colour or file input is not typing, so the pad still takes digits there.
            const NON_TEXT_INPUTS = ['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'];
            const isInput = tag === 'INPUT';
            const nonTextInput = isInput && NON_TEXT_INPUTS.includes(String(target.type || '').toLowerCase());
            if (tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
            if (isInput && !nonTextInput) return;
            // Enter on a non-text input (the cracker checkbox) keeps its own behaviour
            if (key === 'Enter' && nonTextInput) return;
            if (key === 'Enter' && (tag === 'BUTTON' || tag === 'A') && !target.classList?.contains('pin-minigame-key')) return;
            // Enter on a pad key the player reached by keyboard acts as that key: the native click
            // runs once (no preventDefault, no handleEnter). A key the player focused with the
            // pointer still submits. :focus-visible is not used: Chromium turns it on at the
            // Enter keydown itself, so it cannot tell the two apart.
            if (key === 'Enter' && target.classList?.contains('pin-minigame-key') && this._padPointerKey !== target) return;
            
            // Handle number keys
            if (key >= '0' && key <= '9') {
                e.preventDefault();
                this.handleNumberInput(key);
            }
            // Handle backspace
            else if (key === 'Backspace' && this.allowBackspace) {
                e.preventDefault();
                this.handleBackspace();
            }
            // Handle enter
            else if (key === 'Enter') {
                e.preventDefault();
                this.handleEnter();
            }
        };
        
        this.addEventListener(document, 'keydown', keyHandler);

        // Input mode of the pad keys: _padPointerKey is the key the pointer last pressed, cleared
        // by Tab, an arrow key, a pointer press elsewhere, or focus landing on another key.
        this._padPointerKey = null;
        const padKey = (el) => (el && el.closest ? el.closest('.pin-minigame-key') : null);
        this.addEventListener(document, 'pointerdown', (e) => { this._padPointerKey = padKey(e.target); }, true);
        this.addEventListener(document, 'focusin', (e) => {
            const k = padKey(e.target);
            if (k !== this._padPointerKey) this._padPointerKey = null;
        });
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Tab' || /^Arrow/.test(e.key || '')) this._padPointerKey = null;
        }, true);
    }
    
    handleNumberInput(number) {
        if (this.isLocked || this.checkPending || this.currentInput.length >= this.pinLength) {
            return;
        }
        // A key greyed by dusting is not a digit of the PIN: it takes no input, by click or keyboard
        if (isKeyGreyed(number, this.dustSet)) {
            return;
        }

        if (window.playUISound) window.playUISound('keypad');
        // The next code clears the last wrong-code line
        if (this.currentInput.length === 0 && this.messageLineElement?.textContent) this.showPinMessage('');
        this.currentInput += number;
        this.updateDisplay();
        
        // Auto-submit if PIN length is reached
        if (this.currentInput.length === this.pinLength) {
            setTimeout(() => this.handleEnter(), 300);
        }
    }
    
    handleBackspace() {
        if (this.isLocked || this.checkPending || this.currentInput.length === 0) {
            return;
        }

        if (window.playUISound) window.playUISound('keypad');
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateDisplay();
    }
    
    async handleEnter() {
        // One check at a time: the auto-submit at full length and a manual Enter (or a
        // fast double Enter) used to start two checks for the same code and burn two
        // attempts (m02 playtest F3). Input is frozen until the server answers.
        if (this.isLocked || this.checkPending || this.currentInput.length !== this.pinLength) {
            return;
        }
        this.checkPending = true;
        try {
            await this._checkCurrentInput();
        } finally {
            this.checkPending = false;
        }
    }

    async _checkCurrentInput() {
        this.attemptCount++;
        // Read the code before the await: nothing that clears the entry meanwhile may blank the record.
        const enteredCode = this.currentInput;

        // SECURITY: ALWAYS use server-side validation for PIN attempts
        let isCorrect;
        const apiClient = window.ApiClient || window.APIClient;
        const gameId = window.breakEscapeConfig?.gameId;

        if (apiClient && gameId) {
            console.log('Using server-side PIN validation (security enforced)');
            isCorrect = await this.validatePinWithServer(enteredCode);
        } else {
            console.error('SECURITY WARNING: API client not available, cannot validate PIN');
            // Fail securely - reject the attempt if we can't validate with server
            isCorrect = false;
        }

        // Record attempt
        const attempt = {
            input: enteredCode,
            isCorrect: isCorrect,
            timestamp: new Date(),
            feedback: this.feedbackFor(enteredCode, isCorrect)
        };

        // The server refused the pad's scope, not the PIN (review R3 m1): the PC the folder
        // sits on is off, or its route is down. That is no attempt, so the pad says why and
        // closes, without a wrong-PIN verdict.
        if (this.lastAttemptRefusal) {
            const reason = this.lastAttemptRefusal;
            this.lastAttemptRefusal = null;
            this.lastAttemptWasNetworkError = false;
            this.currentInput = '';
            this.updateDisplay();
            this.isLocked = true;
            this.gameResult = { success: false, cancelled: true, refused: reason, attempts: this.attemptCount };
            this.showPinMessage(this.lastAttemptRefusalLine || PIN_SCOPE_REFUSAL_TEXT[reason], 'wrong', 2000);
            return;
        }

        // A request that never reached the server is not an attempt: it did not
        // cost the player one (attemptCount was refunded above), so it must not
        // appear in the history either.
        let announceAttempt = false;
        if (this.lastAttemptWasNetworkError) {
            this.lastAttemptWasNetworkError = false;
        } else {
            this.attempts.push(attempt);
            announceAttempt = true;
        }
        this.updateAttemptsDisplay({ announce: announceAttempt });

        if (isCorrect) {
            this.handleSuccess();
        } else {
            this.handleFailure();
        }
    }

    // Pips for an attempt. A right answer is all green. A wrong one uses the
    // server's pips (the server holds the PIN; it sends them only while the
    // player carries a cracker). A PIN passed in explicitly is the fallback,
    // for callers that check locally. No PIN and no server pips: no lights.
    feedbackFor(input, isCorrect) {
        if (!(this.hasPinCracker || this.infoLeakMode)) return null;
        if (isCorrect) return { rightPlace: input.length, rightNumber: 0 };
        if (this.lastServerFeedback) {
            const fb = this.lastServerFeedback;
            this.lastServerFeedback = null;
            return { rightPlace: Number(fb.rightPlace) || 0, rightNumber: Number(fb.rightNumber) || 0 };
        }
        return this.correctPin ? this.calculateFeedback(input) : null;
    }

    /** Digits of the greyed keys now, for the test bridge. */
    greyedKeyDigits() {
        if (!this.dustSet) return [];
        return '0123456789'.split('').filter(d => isKeyGreyed(d, this.dustSet));
    }

    /** Grey every key that is not a digit of the PIN, and say what that shows. */
    applyDust(dustSet, hint = '') {
        this.dustSet = dustSet;
        // Digits typed before the dust may be impossible ones, and the last one could auto-submit
        // a known-wrong code (costing an attempt): start the entry again.
        if (this.currentInput) {
            this.currentInput = '';
            this.updateDisplay();
        }
        if (this.keypadElement) {
            this.keypadElement.querySelectorAll('.pin-minigame-key[data-number]').forEach(key => {
                const greyed = isKeyGreyed(key.dataset.number, dustSet);
                key.classList.toggle('pin-minigame-key-greyed', greyed);
                key.classList.toggle('pin-minigame-key-dusted', !greyed);
                key.setAttribute('aria-disabled', greyed ? 'true' : 'false');
            });
        }
        if (this.dustButtonElement) {
            this.dustButtonElement.disabled = true;
            this.dustButtonElement.classList.add('done');
        }
        if (this.dustNoteElement) {
            this.dustNoteElement.textContent = dustSummary(dustSet) + (hint ? ` ${hint}` : '');
        }
    }

    /** The Dust action: ask the server once, then grey the keys. */
    async handleDust() {
        // A restore still in flight may be about to show this lock already dusted: wait for it, so a
        // click before it settles neither dusts twice nor emits pin_dusted a second time (R1 m7)
        if (this.dustRestoring) await this.dustRestoring;
        // Not while a code is being checked: dusting clears the entry under the in-flight attempt.
        if (this.dustPending || this.dustSet || this.isLocked || this.checkPending) return;
        const targetId = this.getTargetId();
        const apiClient = window.ApiClient || window.APIClient;
        if (!targetId || !apiClient?.pinDust) return;
        this.dustPending = true;
        try {
            const body = await apiClient.pinDust(this.getTargetType(), targetId, true);
            const set = dustDigitsFrom(body);
            if (!set) {
                this.showPinMessage('The dust shows nothing useful.', 'wrong');
                return;
            }
            if (window.playUISound) window.playUISound('item');
            this.showPinMessage(''); // a stale 'The dust does not take.' from an earlier try
            if (this.historyKey) pinDustKnown.set(this.historyKey, { set, hint: body.hint || '' });
            this.applyDust(set, body.hint || this.dustHint);
            // For eventMappings (a debrief can credit the dusted route): which lock, never the digits.
            // Only a fresh dust emits; reopening a dusted pad (restoreDust) does not.
            window.eventDispatcher?.emit?.('pin_dusted', { targetType: this.getTargetType(), targetId: this.getEventTargetId() || targetId });
        } catch (error) {
            const reason = error?.body?.reason;
            const line = reason === 'not_dustable' ? 'This keypad is too clean to show anything.'
                : reason === 'no_kit' ? 'You need your fingerprint kit to dust.'
                : 'The dust does not take.';
            this.showPinMessage(line, 'wrong');
            if (reason === 'not_dustable' || reason === 'no_kit') {
                if (this.dustButtonElement) this.dustButtonElement.disabled = true;
            }
        } finally {
            this.dustPending = false;
        }
    }

    /** On opening: a lock dusted earlier (this session or before a reload) comes up greyed. */
    restoreDust() {
        this.dustRestoring = this._restoreDust().finally(() => { this.dustRestoring = null; });
        return this.dustRestoring;
    }

    async _restoreDust() {
        // No kit needed to restore: the server remembers what was dusted, so the pad stays
        // greyed (with the note, without the button) after the kit is used up or handed on.
        if (!this.dustable) return;
        const known = this.historyKey ? pinDustKnown.get(this.historyKey) : null;
        if (known) { this.applyDust(known.set, known.hint || this.dustHint); return; }
        const targetId = this.getTargetId();
        const apiClient = window.ApiClient || window.APIClient;
        if (!targetId || !apiClient?.pinDust) return;
        try {
            const body = await apiClient.pinDust(this.getTargetType(), targetId, false);
            const set = dustDigitsFrom(body);
            if (set && !this.dustSet) {
                pinDustKnown.set(this.historyKey, { set, hint: body.hint || '' });
                this.applyDust(set, body.hint || this.dustHint);
            }
        } catch (error) {
            // Nothing to restore: the pad simply opens undusted
        }
    }

    getTargetType() {
        return this.params?.type || 'object'; // 'door' or 'object'
    }

    getTargetId() {
        const lockable = this.params?.lockable || this.params?.sprite;
        if (!lockable) return null;
        if (this.getTargetType() === 'door') {
            return lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId || null;
        }
        return lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId || null;
    }

    /**
     * The id an eventMappings condition matches: the object's own id (or its objectId), never the
     * display name getTargetId falls back to (R1 m8). A door is its connectedRoom, as in getTargetId.
     */
    getEventTargetId() {
        const lockable = this.params?.lockable || this.params?.sprite;
        if (!lockable) return null;
        if (this.getTargetType() === 'door') return this.getTargetId();
        return lockable.scenarioData?.id || lockable.objectId || null;
    }

    getHistoryKey() {
        const id = this.getTargetId();
        return id ? `${this.getTargetType()}:${id}` : null;
    }

    async validatePinWithServer(enteredPin) {
        this.lastServerFeedback = null;
        try {
            const lockable = this.params.lockable || this.params.sprite;
            const targetType = this.getTargetType();
            const targetId = this.getTargetId();

            if (!targetId) {
                console.error('Could not determine targetId for unlock validation');
                return false;
            }

            console.log('Validating PIN with server:', { targetType, targetId, attempt: enteredPin });

            // Call server API for validation, through the shared object-unlock retry so a correct
            // code on a route-room object is not refused during the pre-promotion window (§3.6).
            const response = await unlockWithRouteRoomRetry(targetType, targetId, enteredPin, 'pin');

            // If server returned container contents, populate the lockable object
            if (response.success && response.hasContents && response.contents && lockable.scenarioData) {
                console.log('Server returned container contents:', response.contents);
                lockable.scenarioData.contents = response.contents;
            }

            // Store server response to pass through callback chain
            this.serverResponse = response;

            return response.success;
        } catch (error) {
            // A status means the server answered -- a wrong PIN comes back 422.
            // That IS a real attempt: it must count, lock out at maxAttempts,
            // and tell the player they were wrong rather than blaming the
            // network. Only a genuinely failed request is refunded.
            if (lockScopeRefusal(error)) {
                this.attemptCount--;
                this.lastAttemptRefusal = lockScopeRefusal(error);
                this.lastAttemptRefusalLine = lockScopeRefusalLine(error);
                return false;
            }
            if (error?.status) {
                console.log('Server rejected PIN attempt:', error.status);
                this.lastServerFeedback = error.body?.feedback || null;
                return false;
            }

            console.error('Server validation error:', error);
            this.showPinMessage('Network error. Please try again.', 'wrong');
            // Decrease attempts counter since this wasn't a real attempt
            this.attemptCount--;
            // ...and say so, so the caller can keep the visible attempt history
            // in step. Refunding attemptCount alone left the failed request in
            // this.attempts, so the history and getState() reported more
            // attempts used than the lock had actually counted -- which reads
            // as the lock having been bypassed when it never was.
            this.lastAttemptWasNetworkError = true;
            return false;
        }
    }
    
    calculateFeedback(input) {
        // Mastermind-style feedback: right number in right place, right number in wrong place
        // This handles duplicate digits correctly by matching each digit in the secret at most once
        
        const inputArray = input.split('');
        const correctArray = this.correctPin.split('');
        const usedInput = new Array(inputArray.length).fill(false);
        const usedCorrect = new Array(correctArray.length).fill(false);
        
        let rightPlace = 0;
        let rightNumber = 0;
        
        // First pass: count exact position matches (right place)
        for (let i = 0; i < inputArray.length; i++) {
            if (inputArray[i] === correctArray[i]) {
                rightPlace++;
                usedInput[i] = true;
                usedCorrect[i] = true;
            }
        }
        
        // Second pass: count correct numbers in wrong positions
        // Only consider unmatched digits from the input
        for (let i = 0; i < inputArray.length; i++) {
            if (!usedInput[i]) {
                // Look for this digit in unused positions of the correct PIN
                for (let j = 0; j < correctArray.length; j++) {
                    if (!usedCorrect[j] && inputArray[i] === correctArray[j]) {
                        rightNumber++;
                        usedCorrect[j] = true; // Mark this position as used
                        break; // Move to next input digit
                    }
                }
            }
        }
        
        return { rightPlace, rightNumber };
    }
    
    updateDisplay() {
        if (!this.displayElement) return;
        
        let displayText = this.currentInput;
        while (displayText.length < this.pinLength) {
            displayText += '_';
        }
        
        this.displayElement.textContent = displayText;
        
        // Add visual feedback for current input
        if (this.currentInput.length > 0) {
            this.displayElement.classList.add('has-input');
        } else {
            this.displayElement.classList.remove('has-input');
        }
    }
    
    // Only a new guess is announced (announce: true). Re-renders from the lights toggle,
    // a network error or reopening the pad leave the live region as it was.
    updateAttemptsDisplay({ announce = false } = {}) {
        if (!this.attemptsLogElement) return;
        
        this.attemptsLogElement.innerHTML = '';
        if (this.attempts.length === 0 && this.attemptsLiveElement) this.attemptsLiveElement.textContent = '';
        
        if (this.attempts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'pin-minigame-attempt-empty';
            emptyMessage.textContent = 'No attempts yet';
            this.attemptsLogElement.appendChild(emptyMessage);
            return;
        }
        
        this.attempts.forEach((attempt, index) => {
            const attemptElement = document.createElement('div');
            attemptElement.className = `pin-minigame-attempt ${attempt.isCorrect ? 'correct' : 'incorrect'}`;
            
            const attemptNumber = document.createElement('span');
            attemptNumber.className = 'pin-minigame-attempt-number';
            attemptNumber.textContent = `${index + 1}.`;
            
            const attemptInput = document.createElement('span');
            attemptInput.className = 'pin-minigame-attempt-input';
            attemptInput.textContent = attempt.input;
            
            attemptElement.appendChild(attemptNumber);
            attemptElement.appendChild(attemptInput);

            const showLights = (this.hasPinCracker && this.infoLeakToggleElement?.checked && attempt.feedback) ||
                (this.infoLeakMode && attempt.feedback);
            const summary = describeAttemptFeedback(attempt.input, showLights ? attempt.feedback : null, attempt.isCorrect);
            attempt.summary = summary;
            attemptElement.setAttribute('role', 'group');
            attemptElement.setAttribute('aria-label', `Guess ${index + 1}, ${summary}`);
            attemptNumber.setAttribute('aria-hidden', 'true');
            attemptInput.setAttribute('aria-hidden', 'true');
            
            // Add visual feedback lights if pin-cracker is enabled and feedback is available
            // OR if mastermind mode is enabled via parameter
            if (showLights) {
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'pin-minigame-feedback-lights';
                feedbackContainer.setAttribute('aria-hidden', 'true');
                
                // Add green lights for right place
                for (let i = 0; i < attempt.feedback.rightPlace; i++) {
                    const greenLight = document.createElement('div');
                    greenLight.className = 'pin-minigame-light pin-minigame-light-green';
                    greenLight.title = 'Correct digit in correct position';
                    feedbackContainer.appendChild(greenLight);
                }
                
                // Add amber lights for wrong place
                for (let i = 0; i < attempt.feedback.rightNumber; i++) {
                    const amberLight = document.createElement('div');
                    amberLight.className = 'pin-minigame-light pin-minigame-light-amber';
                    amberLight.title = 'Correct digit in wrong position';
                    feedbackContainer.appendChild(amberLight);
                }
                
                attemptElement.appendChild(feedbackContainer);
            }
            
            this.attemptsLogElement.appendChild(attemptElement);
        });

        if (announce && this.attemptsLiveElement) {
            this.attemptsLiveElement.textContent = `Guess ${this.attempts.length}, ${this.attempts.at(-1).summary}`;
        }

        // The log scrolls; keep the newest guess in view.
        // Again once laid out: set while the pad is still being drawn, scrollHeight can be short.
        const log = this.attemptsLogElement;
        log.scrollTop = log.scrollHeight;
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    }
    
    updatePinCrackerIcon() {
        if (this.pinCrackerIconElement) {
            this.pinCrackerIconElement.style.display = this.infoLeakToggleElement?.checked ? 'inline-block' : 'none';
        }
        if (this.pinCrackerHelpElement) {
            this.pinCrackerHelpElement.style.display = this.infoLeakToggleElement?.checked ? 'block' : 'none';
        }
    }
    
    handleSuccess() {
        this.isLocked = true;
        this.displayElement.classList.add('success');
        this.displayElement.textContent = this.currentInput;

        if (window.playUISound) window.playUISound('confirm');
        this.showSuccess('PIN Correct! Access Granted.', true, 2000);

        // Set game result
        this.gameResult = {
            success: true,
            pin: this.currentInput,
            attempts: this.attemptCount,
            timeToComplete: Date.now() - this.startTime,
            serverResponse: this.serverResponse // Include server response (roomData for doors, contents for containers)
        };
    }
    
    /**
     * Writes a line under the display (kind: 'wrong' or ''). closeAfterMs closes the keypad
     * afterwards, as the framework's showFailure(…, true, ms) did.
     */
    showPinMessage(text, kind = '', closeAfterMs = 0) {
        const line = this.messageLineElement;
        if (line) {
            line.textContent = text || '';
            line.className = `pin-minigame-message${kind ? ` ${kind}` : ''}`;
        } else if (text) {
            this.showFailure(text, closeAfterMs > 0, closeAfterMs || 2000, { plainText: true });
            return;
        }
        if (closeAfterMs > 0) setTimeout(() => this.complete(false), closeAfterMs);
    }

    handleFailure() {
        this.currentInput = '';
        this.updateDisplay();

        if (window.playUISound) window.playUISound('reject');
        if (this.attemptCount >= this.maxAttempts) {
            this.isLocked = true;
            this.displayElement.classList.add('locked');
            this.displayElement.textContent = 'LOCKED';

            this.showPinMessage('Locked out. Your guesses are kept.', 'wrong', 3000);
            
            // Set game result
            this.gameResult = {
                success: false,
                attempts: this.attemptCount,
                maxAttemptsReached: true
            };
        } else {
            // Show temporary failure message
            const remainingAttempts = this.maxAttempts - this.attemptCount;
            const message = Number.isFinite(remainingAttempts)
                ? `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
                : 'Incorrect PIN. Read the cracker\'s lights and try again.';
            // Stays until the next key press, so the player can read it while typing again
            this.showPinMessage(message, 'wrong');
        }
    }
    
    start() {
        super.start();
        console.log("PIN minigame started");
        
        this.startTime = Date.now();
        this.updateDisplay();
        this.updateAttemptsDisplay();
        this.updatePinCrackerIcon();
        this.restoreDust();
    }
    
    complete(success) {
        // Closing the pad (Cancel, x, Esc, a hit) without a verdict is not a wrong PIN:
        // flag it so callers can close quietly (no "PIN Rejected", no failure sound).
        if (!success && !this.gameResult) {
            this.gameResult = { success: false, cancelled: true, attempts: this.attemptCount || 0 };
        }
        // Call parent complete with result
        super.complete(success, this.gameResult);
    }
    
    cleanup() {
        super.cleanup();
    }
}

// Export helper function to start the PIN minigame
export function startPinMinigame(correctPin = '1234', options = {}) {
    console.log('Starting PIN minigame with:', { correctPin, options });
    
    // Check if framework is available
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available. Make sure it is properly initialized.');
        return;
    }
    
    // Make sure the minigame is registered
    if (!window.MinigameFramework.registeredScenes['pin']) {
        window.MinigameFramework.registerScene('pin', PinMinigame);
        console.log('PIN minigame registered on demand');
    }
    
    // Initialize the framework if not already done
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(null);
    }
    
    // Start the PIN minigame with proper parameters
    const params = {
        title: options.title || 'PIN Entry',
        correctPin: correctPin,
        maxAttempts: options.maxAttempts,
        pinLength: options.pinLength || 4,
        infoLeakMode: options.infoLeakMode || false,
        allowBackspace: options.allowBackspace !== false,
        hasPinCracker: options.hasPinCracker || false,
        onComplete: (success, result) => {
            console.log('PIN minigame completed:', { success, result });
            
            if (success) {
                if (window.showNotification) {
                    window.showNotification('PIN entered successfully!', 'success');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('PIN entry failed', 'error');
                }
            }
            
            // Call custom completion callback if provided
            if (options.onComplete) {
                options.onComplete(success, result);
            }
        }
    };
    
    console.log('Starting PIN minigame with params:', params);
    window.MinigameFramework.startMinigame('pin', null, params);
}

// Not assigned to window: window.startPinMinigame is the real starter from
// systems/minigame-starters.js (lockable, type, correctPin, callback).
