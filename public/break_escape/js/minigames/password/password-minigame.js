import { MinigameScene } from '../framework/base-minigame.js';
import { ASSETS_PATH } from '../../config.js';
import { makeDraggable } from '../../utils/helpers.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal } from '../../utils/lock-scope-refusal.js';

/**
 * The keypad's line after a wrong password. A near miss (right apart from letter
 * case, which only the server can tell) says passwords are case-sensitive.
 */
export function incorrectPasswordMessage(attemptsRemaining, caseMismatch = false) {
    const left = `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`;
    return caseMismatch
        ? `Incorrect password. Passwords are case-sensitive. ${left}`
        : `Incorrect password. ${left}`;
}

/**
 * The line over the password field: the keypad title when it names the lock
 * ("Enter password: SCADA Control"), else the plain "Password:".
 */
export function passwordFieldLabel(title) {
    const t = typeof title === 'string' ? title.trim() : '';
    return t && t !== 'Enter password' && t !== 'Password Entry' ? t : 'Password:';
}

/**
 * True for a container that is a bag or case rather than a device: its password
 * screen is drawn as a code lock on the case, not as a computer's sign-in screen.
 */
export const CASE_LOCK_TYPES = ['suitcase', 'briefcase', 'bag', 'bag1', 'backpack', 'satchel', 'holdall'];
export function isCaseLockTarget(data) {
    const type = String(data?.type || '').toLowerCase();
    return CASE_LOCK_TYPES.includes(type);
}

// ── Sign-in mode (access model 5.3, step 8) ──────────────────────────────────
// A sign-in PC's screen: account tiles (from the server, per the PC's loginPicker),
// Other user (type a username), the password field and the PC's post-it. It has no
// attempt limit of its own: it shows the server's answer and attemptsLeft, and stops
// only when the server reports a lockout for the username typed. It shows no
// letter-case hint (the server sends none for /login). Signs in through pc-sessions.js.


/** Initials for a tile whose portrait and avatar both failed: "Sam Okafor" -> "SO". */
export function tileInitials(name) {
    const words = String(name || '').trim().split(/[\s._-]+/).filter(Boolean);
    const letters = words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
    return letters || '?';
}

/** A square image of at least 256 pixels with even sides is a 2x2 talk sheet (person-chat's _isTalkSheet). */
export function isTalkSheetSize(width, height) {
    return width >= 256 && width === height && width % 2 === 0;
}

/** A portrait path from the server ("assets/characters/x_talk.png") as a URL. */
export function portraitUrl(path) {
    if (typeof path !== 'string' || !path) return null;
    if (path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
    return path.startsWith('assets/') ? `/break_escape/${path}` : `${ASSETS_PATH}/${path}`;
}

/**
 * Draw a tile's picture into `el` as person-chat would: the portrait, else the avatar,
 * else the display name's initials. A talk sheet shows only its top-left frame (closed
 * mouth). `ImageCtor` is injectable for tests.
 */
export function applyTilePortrait(el, tile, ImageCtor = (typeof Image !== 'undefined' ? Image : null)) {
    const sources = [tile?.portrait, tile?.avatar].map(portraitUrl).filter(Boolean);
    const initials = () => {
        el.style.backgroundImage = '';
        el.dataset.frame = 'initials';
        el.classList.add('signin-portrait-initials');
        el.textContent = tileInitials(tile?.displayName || tile?.username);
    };
    const tryAt = (i) => {
        if (i >= sources.length || !ImageCtor) { initials(); return; }
        const src = sources[i];
        const img = new ImageCtor();
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            el.textContent = '';
            el.style.backgroundImage = `url("${src}")`;
            el.style.backgroundRepeat = 'no-repeat';
            if (isTalkSheetSize(w, h)) {
                el.style.backgroundSize = '200% 200%';
                el.style.backgroundPosition = '0 0';
                el.dataset.frame = 'talk-sheet';
            } else {
                el.style.backgroundSize = 'contain';
                el.style.backgroundPosition = 'center';
                el.dataset.frame = 'single';
            }
            el.dataset.src = src;
        };
        img.onerror = () => tryAt(i + 1);
        img.src = src;
    };
    tryAt(0);
}

/** The line under the form after a refused sign-in: the server's message and attemptsLeft. */
export function signInRefusalMessage(result) {
    const message = (result?.message || 'Incorrect username or password').replace(/\.$/, '');
    const left = result?.attemptsLeft;
    if (result?.reason !== 'wrong' || !Number.isFinite(left)) return `${message}.`;
    return `${message}. ${left} attempt${left === 1 ? '' : 's'} left.`;
}

/**
 * The line under the form when the sign-in got no usable answer (`result.error`): a PC that is
 * switched off says so at its keyboard ("This PC is off.", q72) and through a foothold ("This
 * PC is not responding.", as its row in the network view, 9.3b plan 5.2); any other 403 or
 * 404 is a PC that can't be reached; anything else a network error.
 */
export function signInErrorMessage(result) {
    if (result?.serverReason === 'off') return 'This PC is off.';
    if (result?.serverReason === 'not_responding') return 'This PC is not responding.';
    if (result?.status === 403 || result?.status === 404) return "This PC can't be reached.";
    return 'Network error. Please try again.';
}

/**
 * The remote sign-in screen's Captured sign-ins (slice 9.3a, 4.4): the player's captures
 * (`se_captures`, as captures.js readCaptures returns it) whose target is in `accounts` of
 * GET /capture_secrets ({ targetId: username }), oldest first. Each fills the username;
 * the password only when `secrets` ({ targetId: secret }) has it. A landing-page capture
 * that is no account is never in `accounts`, so it is never offered.
 */
export function capturedSignIns(captures, accounts, secrets) {
    const map = captures && typeof captures === 'object' && !Array.isArray(captures) ? captures : {};
    const acc = accounts && typeof accounts === 'object' ? accounts : {};
    const sec = secrets && typeof secrets === 'object' ? secrets : {};
    return Object.values(map)
        .filter(e => e && typeof e === 'object' && typeof e.targetId === 'string' && e.kind !== 'foothold')
        .filter(e => typeof acc[e.targetId] === 'string' && acc[e.targetId])
        .sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.targetId).localeCompare(String(b.targetId)))
        .map(e => ({
            targetId: e.targetId,
            label: e.roleLabel || e.address || e.targetId,
            username: acc[e.targetId],
            password: typeof sec[e.targetId] === 'string' && sec[e.targetId] ? sec[e.targetId] : null
        }));
}
if (typeof window !== 'undefined') window.capturedSignIns = capturedSignIns;

export class PasswordMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        // Initialize password-specific state
        this.gameData = {
            password: params.password || '',
            passwordHint: params.passwordHint || '',
            showHint: params.showHint || false,
            showKeyboard: params.showKeyboard || false,
            maxAttempts: params.maxAttempts || 3,
            attempts: 0,
            showPassword: false,
            postitNote: params.postitNote || '',
            showPostit: params.showPostit || false,
            capsLock: false,
            keyboardVisible: false
        };
        
        // Store the correct password for validation
        this.correctPassword = params.password || '';

        // Wi-Fi join mode (slice 9.3b sub-slice W, 5.3): { apId, apName }. The key field has
        // no attempt limit; submit calls ApiClient.networkJoin through networkLinks.join.
        this.join = params.join || null;

        // Sign-in mode: { pcId, pcName, picker, tiles, current } (unlock-system openLoginSignIn);
        // a remote screen (slice 9.3a, 4.4) adds remote: { footholdId, linkName } and captured
        this.signIn = params.signIn || null;
        if (this.signIn) {
            const picker = this.signIn.picker;
            const tiles = picker === false ? [] : (Array.isArray(this.signIn.tiles) ? this.signIn.tiles : []);
            this.signInState = {
                tiles,
                // null: no account chosen yet; '' with other: true: typing a username
                selected: null,
                other: picker === false,
                message: ''
            };
        }
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        if (this.join) {
            return {
                ...super.getTestState(),
                join: { apId: this.join.apId, message: this.joinMessage || null },
                hasPasswordField: !!document.getElementById('password-field'),
                entryHint: 'type(0, "<key>", { submit: true })'
            };
        }
        if (this.signIn) {
            const st = this.signInState;
            return {
                ...super.getTestState(),
                signIn: {
                    pcId: this.signIn.pcId,
                    picker: this.signIn.picker,
                    tiles: st.tiles.map(t => ({ username: t.username, displayName: t.displayName })),
                    selected: st.selected,
                    otherUser: st.other,
                    current: this.signIn.current ? { username: this.signIn.current.username, displayName: this.signIn.current.displayName } : null,
                    message: st.message || null,
                    // A remote screen: its foothold and the captured sign-ins offered (no passwords)
                    ...(this.signIn.remote ? {
                        remote: { footholdId: this.signIn.remote.footholdId ?? null },
                        captured: (this.signIn.captured || []).map(c => ({ targetId: c.targetId, label: c.label, username: c.username, fillsPassword: !!c.password })),
                        capturedLoading: !!this.signIn.capturedLoading
                    } : {})
                },
                // clickText('<display name>') or clickText('Other user') first; then the visible
                // fields are [username, password] for Other user, [password] for a tile.
                entryHint: 'clickText("<name>") then type(0, "<password>", { submit: true }); Other user: type(0, user) then type(1, pw, { submit: true })'
            };
        }
        return {
            ...super.getTestState(),
            attemptsText: (this.attemptsDisplay?.innerText || '').trim() || null,
            hasPasswordField: !!document.getElementById('password-field'),
            // Type into field 0 then clickText('Submit'), or type(0, pw, {submit:true}).
            entryHint: 'type(0, "<password>", { submit: true })'
        };
    }


    init() {
        // Call parent init to set up basic UI structure
        super.init();

        if (this.signIn) {
            this.initSignIn();
            return;
        }

        // Wi-Fi join mode (slice 9.3b W, 5.3): the key field, no attempt counter
        if (this.join) {
            this.headerElement.innerHTML = `
                <h3>${escapeHtml(displayDashes(`Join Wi-Fi: ${this.join.apName || ''}`))}</h3>
                <p>Enter the network key</p>
            `;
            this.setupPasswordInterface();
            this.setupEventListeners();
            return;
        }

        // Customize the header
        this.headerElement.innerHTML = `
            <h3>${escapeHtml(displayDashes(this.params.title || 'Password Entry'))}</h3>
            <p>Enter the correct password to proceed</p>
        `;
        
        // Set up the password interface
        this.setupPasswordInterface();
        
        // Add notebook button to minigame controls if postit note exists (before cancel button)
        if (this.controlsElement && this.gameData.showPostit && this.gameData.postitNote) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad';
            // Insert before the cancel button (first child in controls)
            this.controlsElement.insertBefore(notebookBtn, this.controlsElement.firstChild);
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupPasswordInterface() {
        // Create the password entry interface
        // Check if we can get the device image from sprite or params
        const getImageData = () => {
            // Try to get sprite data from params (from lockable object passed through minigame framework)
            const sprite = this.params.sprite || this.params.lockable;
            if (sprite && sprite.texture && sprite.scenarioData) {
                return {
                    imageFile: sprite.texture.key,
                    deviceName: sprite.scenarioData.name || sprite.name,
                    observations: sprite.scenarioData.observations || ''
                };
            }
            // Fallback to explicit params if provided
            if (this.params.deviceImage) {
                return {
                    imageFile: this.params.deviceImage,
                    deviceName: this.params.deviceName || this.params.title || 'Device',
                    observations: this.params.observations || ''
                };
            }
            return null;
        };
        
        const imageData = getImageData();

        // Name the lock over the field, as the PIN keypad does ("Enter PIN: Cable
        // Vault"); the framework hides the header, so it read just "Password:" (m07 #5)
        const fieldLabel = this.join ? 'Network key' : passwordFieldLabel(this.params.title);
        
        // A carried case (a bag, briefcase or suitcase) has a code lock, not a computer
        // screen: it gets the case-lock look, with no desktop wallpaper (UX pass, 2026-11-12)
        const caseLock = isCaseLockTarget((this.params.lockable || this.params.sprite)?.scenarioData);

        this.gameContainer.innerHTML = `
            <div class="password-minigame-area${caseLock ? ' case-lock' : ''}">
                ${imageData ? `
                    <div class="password-image-section">
                        <img src="/break_escape/assets/objects/${escapeHtml(imageData.imageFile)}.png" 
                             alt="${escapeHtml(imageData.deviceName)}" 
                             class="password-image">
                        <div class="password-info">
                            <h4>${escapeHtml(displayDashes(imageData.deviceName))}</h4>
                            <p>${escapeHtml(displayDashes(imageData.observations))}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="monitor-bezel">
                    <div class="monitor-screen">
                        <div class="password-input-container">
                            <label for="password-field">${escapeHtml(displayDashes(fieldLabel))}</label>
                            <div class="password-field-wrapper">
                                <input type="${this.gameData.showPassword ? 'text' : 'password'}" 
                                       id="password-field" 
                                       class="password-field"
                                       placeholder="Enter password..."
                                       maxlength="50">
                                <button type="button" class="toggle-password-btn" id="toggle-password">
                                    <img class="icon-small" src="/break_escape/assets/icons/${this.gameData.showPassword ? 'visible.png' : 'hidden.png'}" alt="Toggle password visibility">
                                </button>
                            </div>
                        </div>

                        <div class="hint-controls">
                            ${this.gameData.showHint ? `
                                <button type="button" class="hint-btn" id="show-hint">Show Hint</button>
                            ` : ''}
                            <button type="button" class="submit-btn" id="submit-password">Submit</button>
                        </div>
                        ${this.gameData.showHint ? `
                            <div class="password-hint-container">
                                <div class="password-hint" id="password-hint" style="display: none;">
                                    <strong>Hint:</strong> ${escapeHtml(displayDashes(this.gameData.passwordHint))}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${this.gameData.showPostit && this.gameData.postitNote ? `
                    <div class="postit-note">
                        ${escapeHtml(displayDashes(this.gameData.postitNote))}
                    </div>
                ` : ''}
                
                <div class="password-controls">
                    ${this.gameData.showKeyboard ? `
                        <button type="button" class="keyboard-toggle-btn" id="keyboard-toggle">
                            <img class="icon-keyboard" src="/break_escape/assets/objects/keyboard1.png" alt="Toggle keyboard">
                        </button>
                    ` : ''}
                </div>
                
                ${this.gameData.showKeyboard ? `
                    <div class="onscreen-keyboard" id="onscreen-keyboard" style="display: ${this.gameData.keyboardVisible ? 'flex' : 'none'}">
                        <div class="keyboard-row">
                            <button class="key" data-key="1">1</button>
                            <button class="key" data-key="2">2</button>
                            <button class="key" data-key="3">3</button>
                            <button class="key" data-key="4">4</button>
                            <button class="key" data-key="5">5</button>
                            <button class="key" data-key="6">6</button>
                            <button class="key" data-key="7">7</button>
                            <button class="key" data-key="8">8</button>
                            <button class="key" data-key="9">9</button>
                            <button class="key" data-key="0">0</button>
                            <button class="key key-backspace" data-key="Backspace">⌫</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key" data-key="q">Q</button>
                            <button class="key" data-key="w">W</button>
                            <button class="key" data-key="e">E</button>
                            <button class="key" data-key="r">R</button>
                            <button class="key" data-key="t">T</button>
                            <button class="key" data-key="y">Y</button>
                            <button class="key" data-key="u">U</button>
                            <button class="key" data-key="i">I</button>
                            <button class="key" data-key="o">O</button>
                            <button class="key" data-key="p">P</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key" data-key="a">A</button>
                            <button class="key" data-key="s">S</button>
                            <button class="key" data-key="d">D</button>
                            <button class="key" data-key="f">F</button>
                            <button class="key" data-key="g">G</button>
                            <button class="key" data-key="h">H</button>
                            <button class="key" data-key="j">J</button>
                            <button class="key" data-key="k">K</button>
                            <button class="key" data-key="l">L</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key key-shift" data-key="Shift" id="shift-key">Shift</button>
                            <button class="key" data-key="z">Z</button>
                            <button class="key" data-key="x">X</button>
                            <button class="key" data-key="c">C</button>
                            <button class="key" data-key="v">V</button>
                            <button class="key" data-key="b">B</button>
                            <button class="key" data-key="n">N</button>
                            <button class="key" data-key="m">M</button>
                            <button class="key key-space" data-key=" ">Space</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key key-special" data-key="Enter">Enter</button>
                            <button class="key key-special" data-key="Escape">Cancel</button>
                        </div>
                    </div>
                ` : ''}
                
                ${this.join ? '' : `
                <div class="attempts-counter">
                    Attempts: <span id="attempts-display">${escapeHtml(this.gameData.attempts)}</span>/${escapeHtml(this.gameData.maxAttempts)}
                </div>
                `}
            </div>
        `;
        
        // Get references to important elements
        this.passwordField = document.getElementById('password-field');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.submitBtn = document.getElementById('submit-password');
        this.keyboardToggleBtn = document.getElementById('keyboard-toggle');
        this.attemptsDisplay = document.getElementById('attempts-display');

        // Make the post-it note draggable (rendered via HTML template above)
        if (this.gameData.showPostit && this.gameData.postitNote) {
            const postit = this.gameContainer
                ? this.gameContainer.querySelector('.postit-note')
                : document.querySelector('.password-minigame-area .postit-note');
            if (postit) {
                makeDraggable(postit);
            }
        }

        // Focus the password field
        if (this.passwordField) {
            this.passwordField.focus();
        }
    }
    
    setupEventListeners() {
        // Password field events
        if (this.passwordField) {
            this.addEventListener(this.passwordField, 'keydown', (event) => {
                this.handleKeyPress(event);
            });
            
            this.addEventListener(this.passwordField, 'input', (event) => {
                this.handlePasswordInput(event);
            });
        }
        
        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.addEventListener(this.togglePasswordBtn, 'click', () => {
                this.togglePasswordVisibility();
            });
        }
        
        // Submit button
        if (this.submitBtn) {
            this.addEventListener(this.submitBtn, 'click', () => {
                this.submitPassword();
            });
        }
        
        // Keyboard toggle button
        if (this.keyboardToggleBtn) {
            this.addEventListener(this.keyboardToggleBtn, 'click', () => {
                this.toggleKeyboardVisibility();
            });
        }
        
        // Hint button
        const hintBtn = document.getElementById('show-hint');
        if (hintBtn) {
            this.addEventListener(hintBtn, 'click', () => {
                this.toggleHint();
            });
        }
        
        // Onscreen keyboard
        const keyboard = document.getElementById('onscreen-keyboard');
        if (keyboard) {
            this.addEventListener(keyboard, 'click', (event) => {
                this.handleKeyboardClick(event);
            });
        }
        
        // Notebook button for postit (in minigame controls)
        const notebookBtn = document.getElementById('minigame-notebook-postit');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => {
                this.addPostitToNotebook();
            });
        }
    }
    
    start() {
        // Call parent start
        super.start();
        
        console.log("Password minigame started");
    }
    
    handleKeyPress(event) {
        if (!this.gameState.isActive) return;
        
        switch(event.key) {
            case 'Enter':
                event.preventDefault();
                this.submitPassword();
                break;
            case 'Escape':
                event.preventDefault();
                this.cancelPassword();
                break;
        }
    }
    
    handlePasswordInput(event) {
        // Update the internal password state
        this.gameData.password = event.target.value;
    }
    
    togglePasswordVisibility() {
        this.gameData.showPassword = !this.gameData.showPassword;
        
        // Update input type
        this.passwordField.type = this.gameData.showPassword ? 'text' : 'password';
        
        // Update button image
        const img = this.togglePasswordBtn.querySelector('img');
        if (img) {
            const iconName = this.gameData.showPassword ? 'visible.png' : 'hidden.png';
            img.src = `${ASSETS_PATH}/icons/${iconName}`;
        }
    }
    
    toggleKeyboardVisibility() {
        this.gameData.keyboardVisible = !this.gameData.keyboardVisible;
        const keyboard = document.getElementById('onscreen-keyboard');
        if (keyboard) {
            keyboard.style.display = this.gameData.keyboardVisible ? 'flex' : 'none';
        }
    }
    
    toggleHint() {
        const hintElement = document.getElementById('password-hint');
        const hintBtn = document.getElementById('show-hint');
        
        if (hintElement && hintBtn) {
            if (hintElement.style.display === 'none') {
                hintElement.style.display = 'block';
                hintBtn.textContent = 'Hide Hint';
            } else {
                hintElement.style.display = 'none';
                hintBtn.textContent = 'Show Hint';
            }
        }
    }
    
    handleKeyboardClick(event) {
        if (!this.gameState.isActive) return;
        
        const key = event.target;
        if (!key.classList.contains('key')) return;
        
        const keyValue = key.dataset.key;
        
        if (keyValue === 'Enter') {
            this.submitPassword();
        } else if (keyValue === 'Escape') {
            this.cancelPassword();
        } else if (keyValue === 'Shift') {
            this.toggleCapsLock();
        } else if (keyValue === 'Backspace') {
            this.passwordField.value = this.passwordField.value.slice(0, -1);
            this.gameData.password = this.passwordField.value;
        } else if (keyValue === ' ') {
            this.passwordField.value += ' ';
            this.gameData.password = this.passwordField.value;
        } else if (keyValue && keyValue.length === 1) {
            const char = this.gameData.capsLock ? keyValue.toUpperCase() : keyValue.toLowerCase();
            this.passwordField.value += char;
            this.gameData.password = this.passwordField.value;
        }
        
        // Keep focus on password field
        this.passwordField.focus();
    }
    
    toggleCapsLock() {
        this.gameData.capsLock = !this.gameData.capsLock;
        const shiftKey = document.getElementById('shift-key');
        if (shiftKey) {
            if (this.gameData.capsLock) {
                shiftKey.classList.add('active');
            } else {
                shiftKey.classList.remove('active');
            }
        }
    }
    
    async submitPassword() {
        // One check at a time: Enter plus a Submit click (or a fast double Enter) used
        // to count two attempts for one password (m02 playtest M2/M7; same guard as
        // the PIN minigame's checkPending).
        if (this.checkPending) return;
        this.checkPending = true;
        try {
            if (this.join) await this._submitJoinOnce();
            else if (this.signIn) await this._submitSignInOnce();
            else await this._submitPasswordOnce();
        } finally {
            this.checkPending = false;
        }
    }

    async _submitPasswordOnce() {
        const gameId = window.breakEscapeConfig?.gameId;
        console.log('submitPassword called', {
            isActive: this.gameState.isActive,
            correctPassword: this.correctPassword,
            hasApiClient: !!window.ApiClient,
            hasAPIClient: !!window.APIClient,
            gameId: gameId
        });

        if (!this.gameState.isActive) return;

        const enteredPassword = this.passwordField.value.trim();
        console.log('Entered password:', enteredPassword);

        if (!enteredPassword) {
            this.showFailure("Please enter a password", false, 1000);
            return;
        }

        this.gameData.attempts++;
        this.attemptsDisplay.textContent = this.gameData.attempts;

        // SECURITY: ALWAYS use server-side validation for password attempts
        const apiClient = window.ApiClient || window.APIClient;
        if (apiClient && gameId) {
            console.log('Using server-side validation (security enforced)');
            await this.validatePasswordWithServer(enteredPassword);
        } else {
            console.error('SECURITY WARNING: API client not available, cannot validate password');
            // Fail securely - reject the attempt if we can't validate with server
            this.passwordIncorrect();
        }
    }

    // Wi-Fi join (slice 9.3b W, 5.3): the key goes to networkLinks.join, which posts
    // /network/join and applies the foothold. A wrong key is refused with no attempt count;
    // a success or already closes the minigame. The key is sent as typed (no trim), since a
    // Wi-Fi key may hold spaces, and is never stored on the scene.
    async _submitJoinOnce() {
        if (!this.gameState.isActive) return;
        const key = this.passwordField ? this.passwordField.value : '';
        if (!key) {
            this.showFailure('Please enter the key', false, 1000);
            return;
        }
        const links = window.networkLinks;
        const result = (links && typeof links.join === 'function') ? await links.join(this.join.apId, key) : { action: 'error' };
        if (result.action === 'joined' || result.action === 'already') {
            this.cleanup();
            if (window.playUISound) window.playUISound('confirm');
            this.showSuccess('Connected.', true, 900);
            this.gameResult = { success: true, join: result };
        } else if (result.action === 'wrong_key') {
            this.joinMessage = 'That key was not accepted.';
            if (window.playUISound) window.playUISound('reject');
            this.showFailure(this.joinMessage, false, 1500);
            this.passwordField.value = '';
            this.passwordField.focus();
        } else {
            this.showFailure('The network did not respond. Try again.', false, 1500);
        }
    }

    async validatePasswordWithServer(enteredPassword) {
        try {
            // Get lockable object and type from params
            const lockable = this.params.lockable || this.params.sprite;
            const targetType = this.params.type || 'object'; // 'door' or 'object'

            // Get target ID from lockable
            let targetId;
            if (targetType === 'door') {
                targetId = lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
            } else {
                targetId = lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
            }

            if (!targetId) {
                console.error('Could not determine targetId for unlock validation');
                this.passwordIncorrect();
                return;
            }

            console.log('Validating password with server:', { targetType, targetId, attempt: enteredPassword });

            // Call server API for validation (use ApiClient with correct casing)
            const apiClient = window.ApiClient || window.APIClient;
            const response = await apiClient.unlock(targetType, targetId, enteredPassword, 'password');

            if (response.success) {
                // If server returned container contents, populate the lockable object
                if (response.hasContents && response.contents && lockable.scenarioData) {
                    console.log('Server returned container contents:', response.contents);
                    lockable.scenarioData.contents = response.contents;
                }
                // Store server response to pass through callback chain
                this.serverResponse = response;
                this.passwordCorrect();
            } else {
                this.passwordIncorrect({ caseMismatch: response?.caseMismatch === true });
            }
        } catch (error) {
            console.error('Server validation error:', error);
            // api-client sets err.status; a wrong password comes back 422 and is a real attempt.
            const refusal = lockScopeRefusal(error);
            if (refusal) {
                // The PC the lock sits on is off, not responding or out of reach (review R4
                // m2): not an attempt and not a wrong password, so say why and close as cancelled
                this.gameData.attempts--;
                this.attemptsDisplay.textContent = this.gameData.attempts;
                this.cleanup();
                this.showFailure(LOCK_SCOPE_REFUSAL_TEXT[refusal], true, 2000);
                this.gameResult = { success: false, reason: 'cancelled', cancelled: true, refused: refusal,
                                    attempts: this.gameData.attempts };
            } else if (error?.status === 422 || error?.message?.includes('422')) {
                this.passwordIncorrect({ caseMismatch: error?.body?.caseMismatch === true });
            } else {
                this.showFailure("Network error. Please try again.", false, 1500);
                // Decrease attempts counter since this wasn't a real attempt
                this.gameData.attempts--;
                this.attemptsDisplay.textContent = this.gameData.attempts;
            }
        }
    }
    
    passwordCorrect() {
        this.cleanup();
        if (window.playUISound) window.playUISound('confirm');
        this.showSuccess("Password accepted! Access granted.", true, 1000);

        // Set game result for the callback
        this.gameResult = {
            success: true,
            password: this.gameData.password,
            attempts: this.gameData.attempts,
            serverResponse: this.serverResponse // Include server response (roomData for doors, contents for containers)
        };
    }
    
    passwordIncorrect({ caseMismatch = false } = {}) {
        const remaining = this.gameData.maxAttempts - this.gameData.attempts;
        this.emitPasswordFailed(caseMismatch, Math.max(remaining, 0));
        if (this.gameData.attempts >= this.gameData.maxAttempts) {
            this.passwordFailed({ caseMismatch });
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.showFailure(incorrectPasswordMessage(remaining, caseMismatch), false, caseMismatch ? 3000 : 1500);
            
            // Clear the password field
            this.passwordField.value = '';
            this.gameData.password = '';
            this.passwordField.focus();
        }
    }
    
    /**
     * Tell missions about a wrong password: password_failed (and
     * password_failed:<targetId>) for any target, and door_unlock_failed through the
     * unlock system's onRefused for a door. caseMismatch is true when the entry was
     * right apart from letter case.
     */
    emitPasswordFailed(caseMismatch, attemptsRemaining) {
        const lockable = this.params.lockable || this.params.sprite;
        const targetType = this.params.type || 'object';
        const targetId = targetType === 'door'
            ? (lockable?.doorProperties?.connectedRoom || lockable?.doorProperties?.roomId || null)
            : (lockable?.scenarioData?.id || lockable?.objectId || null);
        const payload = {
            targetType,
            targetId,
            name: lockable?.scenarioData?.name || null,
            lockType: 'password',
            caseMismatch,
            attemptsRemaining
        };
        try {
            window.eventDispatcher?.emit('password_failed', payload);
            if (targetId) window.eventDispatcher?.emit(`password_failed:${targetId}`, payload);
            if (typeof this.params.onRefused === 'function') {
                this.params.onRefused(caseMismatch ? 'wrong_password_case' : 'wrong_password');
            }
        } catch (e) {
            console.warn('password_failed listeners threw', e);
        }
    }

    passwordFailed({ caseMismatch = false } = {}) {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        this.showFailure(
            caseMismatch
                ? "Maximum attempts exceeded. Access denied. Passwords are case-sensitive."
                : "Maximum attempts exceeded. Access denied.",
            true, caseMismatch ? 2500 : 1500);
        
        this.gameResult = {
            success: false,
            reason: 'max_attempts_exceeded',
            attempts: this.gameData.attempts
        };
    }
    
    cancelPassword() {
        this.cleanup();
        this.showFailure(this.join ? "Join cancelled." : (this.signIn ? "Sign-in cancelled." : "Password entry cancelled."), true, 800);
        
        this.gameResult = {
            success: false,
            reason: 'cancelled',
            attempts: this.gameData.attempts
        };
    }
    
    addPostitToNotebook() {
        if (!this.gameState.isActive) return;

        const postitNote = this.gameData.postitNote;
        if (!postitNote || postitNote.trim() === '') {
            this.showFailure("No postit note to add.", false, 2000);
            return;
        }

        // Get the device name from available sources
        const deviceName = this.params.deviceName || 
                          this.params.scenarioData?.name ||
                          this.params.title || 
                          'Unknown Device';

        // Create comprehensive notebook content
        const notebookTitle = `Postit Note - ${deviceName}`;
        let notebookContent = `Postit Note:\n${'-'.repeat(20)}\n\n${postitNote}`;
        notebookContent += `\n\n${'='.repeat(20)}\n`;
        notebookContent += `PASSWORD PROTECTED: ${deviceName}\n`;
        notebookContent += `${'='.repeat(20)}\n`;
        notebookContent += `Date: ${new Date().toLocaleString()}`;
        
        const notebookObservations = 'Postit note found during password entry.';

        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the password state globally so we can return to it
            const passwordState = {
                password: this.gameData.password,
                passwordHint: this.gameData.passwordHint,
                showHint: this.gameData.showHint,
                showKeyboard: this.gameData.showKeyboard,
                maxAttempts: this.gameData.maxAttempts,
                attempts: this.gameData.attempts,
                showPassword: this.gameData.showPassword,
                postitNote: this.gameData.postitNote,
                showPostit: this.gameData.showPostit,
                capsLock: this.gameData.capsLock,
                keyboardVisible: this.gameData.keyboardVisible,
                params: this.params
            };

            window.pendingPasswordReturn = passwordState;

            // Create a postit item for the notes minigame
            const postitItem = {
                scenarioData: {
                    type: 'postit_note',
                    name: notebookTitle,
                    text: notebookContent,
                    observations: notebookObservations,
                    important: true
                }
            };

            // Start notes minigame
            window.startNotesMinigame(
                postitItem,
                notebookContent,
                notebookObservations,
                null,
                false,
                false
            );

            this.showSuccess("Added postit note to notepad", false, 2000);
        } else {
            this.showFailure("Notepad not available", false, 2000);
        }
    }
    
    cleanup() {
        // Call parent cleanup (handles event listeners)
        super.cleanup();
    }

    // ── Sign-in mode ─────────────────────────────────────────────────────────

    initSignIn() {
        const s = this.signIn;
        const st = this.signInState;
        this.headerElement.innerHTML = `<h3>${escapeHtml(displayDashes(`Sign in: ${s.pcName}`))}</h3>`;

        const tileHtml = (tile, i) => `
            <button type="button" class="signin-tile" data-tile-index="${i}" title="${escapeHtml(tile.displayName || tile.username)}">
                <span class="signin-portrait"></span>
                <span class="signin-name">${escapeHtml(tile.displayName || tile.username)}</span>
                <span class="signin-username">${escapeHtml(tile.username)}</span>
            </button>`;
        const tiles = s.picker === false ? '' : `
            <div class="signin-tiles" id="signin-tiles">
                ${st.tiles.map(tileHtml).join('')}
                <button type="button" class="signin-tile signin-other" data-tile-index="other" title="Other user">
                    <span class="signin-portrait signin-portrait-initials">?</span>
                    <span class="signin-name">Other user</span>
                    <span class="signin-username">type a username</span>
                </button>
            </div>`;
        const current = s.current
            ? `<div class="signin-current">Signed in now: ${escapeHtml(s.current.displayName || s.current.username)} (${escapeHtml(s.current.username)})</div>`
            : '';
        const remoteLine = s.remote
            ? `<div class="signin-remote">Remote sign-in${s.remote.linkName ? ` through ${escapeHtml(displayDashes(s.remote.linkName))}` : ''}</div>`
            : '';
        const capturedHtml = s.remote ? `
                        <div class="signin-captured" id="signin-captured">${this.capturedListHtml()}</div>` : '';

        this.gameContainer.innerHTML = `
            <div class="password-minigame-area signin-mode">
                <div class="monitor-bezel">
                    <div class="monitor-screen signin-screen">
                        <div class="signin-title">${escapeHtml(displayDashes(s.pcName))}</div>
                        ${remoteLine}
                        ${current}
                        ${tiles}
                        <div class="signin-form" id="signin-form">
                            <div class="signin-selected" id="signin-selected"></div>
                            <div class="signin-field-row" id="signin-username-row">
                                <label for="signin-username">Username:</label>
                                <input type="text" id="signin-username" class="password-field" placeholder="Username" maxlength="64" autocomplete="off" spellcheck="false">
                            </div>
                            <div class="signin-field-row" id="signin-password-row">
                                <label for="password-field">Password:</label>
                                <div class="password-field-wrapper">
                                    <input type="password" id="password-field" class="password-field" placeholder="Password" maxlength="64" autocomplete="off">
                                    <button type="button" class="toggle-password-btn" id="toggle-password">
                                        <img class="icon-small" src="/break_escape/assets/icons/hidden.png" alt="Toggle password visibility">
                                    </button>
                                </div>
                            </div>
                            <div class="hint-controls">
                                <button type="button" class="submit-btn" id="submit-password">Sign in</button>
                            </div>
                        </div>${capturedHtml}
                        <div class="signin-message" id="signin-message" aria-live="polite"></div>
                    </div>
                </div>
                ${this.gameData.showPostit && this.gameData.postitNote ? `
                    <div class="postit-note">${escapeHtml(this.gameData.postitNote)}</div>
                ` : ''}
            </div>
        `;

        this.usernameField = this.gameContainer.querySelector('#signin-username');
        this.passwordField = this.gameContainer.querySelector('#password-field');
        this.togglePasswordBtn = this.gameContainer.querySelector('#toggle-password');
        this.submitBtn = this.gameContainer.querySelector('#submit-password');
        this.signInMessageEl = this.gameContainer.querySelector('#signin-message');

        this.gameContainer.querySelectorAll('.signin-tile[data-tile-index]').forEach(el => {
            const idx = el.dataset.tileIndex;
            if (idx !== 'other') {
                applyTilePortrait(el.querySelector('.signin-portrait'), st.tiles[Number(idx)]);
            }
            this.addEventListener(el, 'click', () => this.selectSignInTile(idx));
        });
        this.bindCapturedSignIns();

        if (this.gameData.showPostit && this.gameData.postitNote) {
            const postit = this.gameContainer.querySelector('.postit-note');
            if (postit) makeDraggable(postit);
            if (this.controlsElement) {
                const notebookBtn = document.createElement('button');
                notebookBtn.className = 'minigame-button';
                notebookBtn.id = 'minigame-notebook-postit';
                notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad';
                this.controlsElement.insertBefore(notebookBtn, this.controlsElement.firstChild);
                this.addEventListener(notebookBtn, 'click', () => this.addPostitToNotebook());
            }
        }

        const onKey = (event) => {
            if (!this.gameState.isActive) return;
            if (event.key === 'Escape') { event.preventDefault(); this.cancelPassword(); return; }
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (event.target === this.usernameField && !this.passwordField.value) {
                this.passwordField.focus();
            } else {
                this.submitPassword();
            }
        };
        this.addEventListener(this.usernameField, 'keydown', onKey);
        this.addEventListener(this.passwordField, 'keydown', onKey);
        this.addEventListener(this.passwordField, 'input', (e) => { this.gameData.password = e.target.value; });
        this.addEventListener(this.togglePasswordBtn, 'click', () => this.togglePasswordVisibility());
        this.addEventListener(this.submitBtn, 'click', () => this.submitPassword());

        this.renderSignInForm();
    }

    /** Choose a tile (its index) or 'other' (type a username). */
    selectSignInTile(idx) {
        const st = this.signInState;
        if (idx === 'other') {
            st.selected = null;
            st.other = true;
        } else {
            const tile = st.tiles[Number(idx)];
            if (!tile) return;
            st.selected = tile.username;
            st.other = false;
        }
        this.passwordField.value = '';
        this.gameData.password = '';
        this.setSignInMessage('');
        this.renderSignInForm();
    }

    renderSignInForm() {
        const st = this.signInState;
        const chosen = st.other || st.selected !== null;
        const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
        show(this.gameContainer.querySelector('#signin-form'), chosen);
        show(this.gameContainer.querySelector('#signin-username-row'), st.other);
        const selectedEl = this.gameContainer.querySelector('#signin-selected');
        const tile = st.tiles.find(t => t.username === st.selected);
        if (selectedEl) {
            selectedEl.textContent = tile ? `${tile.displayName || tile.username} (${tile.username})` : '';
            show(selectedEl, !!tile);
        }
        this.gameContainer.querySelectorAll('.signin-tile').forEach(el => {
            const idx = el.dataset.tileIndex;
            const on = idx === 'other' ? (st.other && this.signIn.picker !== false) : (st.tiles[Number(idx)]?.username === st.selected && st.selected !== null);
            el.classList.toggle('selected', !!on);
        });
        if (!chosen) {
            this.setSignInMessage(st.message || 'Choose an account.');
        }
        const focus = st.other && !this.usernameField.value ? this.usernameField : this.passwordField;
        if (chosen && focus && typeof focus.focus === 'function') focus.focus();
    }

    /** The Captured sign-ins block's inner markup (a remote screen, 4.4). */
    capturedListHtml() {
        const s = this.signIn || {};
        const captured = Array.isArray(s.captured) ? s.captured : [];
        const body = captured.length
            ? captured.map((c, i) => `
                            <button type="button" class="signin-captured-item" data-capture-index="${i}" data-target-id="${escapeHtml(c.targetId)}">${escapeHtml(c.label)} (${escapeHtml(c.username)})</button>`).join('')
            : (s.capturedLoading ? '<div class="signin-captured-empty">Checking...</div>' : '<div class="signin-captured-empty">None yet.</div>');
        return `
                            <div class="signin-captured-title">Captured sign-ins</div>${body}`;
    }

    bindCapturedSignIns() {
        this.gameContainer?.querySelectorAll('.signin-captured-item[data-capture-index]').forEach(el => {
            this.addEventListener(el, 'click', () => this.fillCapturedSignIn(Number(el.dataset.captureIndex)));
        });
    }

    /**
     * The Captured sign-ins arrive after the screen has opened (GET /capture_secrets), so
     * the view or desktop that opened it is replaced at once (review R1 minor 1).
     */
    setCapturedSignIns(list) {
        if (!this.signIn?.remote) return false;
        this.signIn.captured = Array.isArray(list) ? list : [];
        this.signIn.capturedLoading = false;
        const block = this.gameContainer?.querySelector('#signin-captured');
        if (!block) return false;
        block.innerHTML = this.capturedListHtml();
        this.bindCapturedSignIns();
        return true;
    }

    /**
     * Fill the form from a captured sign-in: the username always, the password only when
     * the server served it. The server's password check is the gate (4.4).
     */
    fillCapturedSignIn(index) {
        const c = (this.signIn?.captured || [])[index];
        if (!c || !this.gameState.isActive) return false;
        const st = this.signInState;
        st.other = true;
        st.selected = null;
        if (this.usernameField) this.usernameField.value = c.username;
        if (this.passwordField) this.passwordField.value = c.password || '';
        this.gameData.password = c.password || '';
        this.setSignInMessage('');
        this.renderSignInForm();
        this.passwordField?.focus?.();
        return true;
    }

    setSignInMessage(text, kind = 'info') {
        this.signInState.message = text;
        if (!this.signInMessageEl) return;
        this.signInMessageEl.textContent = text;
        this.signInMessageEl.dataset.kind = kind;
    }

    async _submitSignInOnce() {
        if (!this.gameState.isActive) return;
        const st = this.signInState;
        const username = st.other ? (this.usernameField?.value || '').trim() : st.selected;
        const password = this.passwordField?.value || '';
        if (!username) { this.setSignInMessage(st.other ? 'Enter a username.' : 'Choose an account.', 'error'); return; }
        if (!password) { this.setSignInMessage('Enter the password.', 'error'); return; }

        const sessions = window.pcSessions;
        if (!sessions?.signIn) {
            this.setSignInMessage('Sign-in is not available.', 'error');
            return;
        }
        this.setSignInMessage('Signing in...');
        const foothold = this.signIn.remote?.footholdId || null;
        const result = foothold
            ? await sessions.signIn(this.signIn.pcId, username, password, { foothold })
            : await sessions.signIn(this.signIn.pcId, username, password);
        if (result.ok) {
            this.signInAccepted(result.session);
            return;
        }
        if (result.reason === 'locked_out') {
            this.signInLockedOut(result);
            return;
        }
        if (result.error) {
            this.setSignInMessage(signInErrorMessage(result), 'error');
            return;
        }
        if (window.playUISound) window.playUISound('reject');
        this.setSignInMessage(signInRefusalMessage(result), 'error');
        this.passwordField.value = '';
        this.gameData.password = '';
        this.passwordField.focus?.();
    }

    signInAccepted(session) {
        this.cleanup();
        if (window.playUISound) window.playUISound('confirm');
        this.setSignInMessage(`Signed in as ${session?.displayName || session?.username}.`, 'success');
        this.gameResult = { success: true, signIn: session };
        this.showSuccess(escapeHtml(`Signed in as ${session?.displayName || session?.username}`), true, 800);
    }

    signInLockedOut(result) {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        const message = signInRefusalMessage(result);
        this.setSignInMessage(message, 'error');
        this.gameResult = { success: false, reason: 'locked_out' };
        window.gameAlert?.(message, 'error', 'Locked out', 4000);
        this.showFailure(escapeHtml(message), true, 1500);
    }
}
