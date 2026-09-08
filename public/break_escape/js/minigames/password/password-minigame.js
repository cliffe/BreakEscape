import { MinigameScene } from '../framework/base-minigame.js';
import { ASSETS_PATH } from '../../config.js';
import { makeDraggable } from '../../utils/helpers.js';

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
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
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
        
        // Customize the header
        this.headerElement.innerHTML = `
            <h3>${this.params.title || 'Password Entry'}</h3>
            <p>Enter the correct password to proceed</p>
        `;
        
        // Set up the password interface
        this.setupPasswordInterface();
        
        // Add notebook button to minigame controls if postit note exists (before cancel button)
        if (this.controlsElement && this.gameData.showPostit && this.gameData.postitNote) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes-sm.png" alt="Notepad" class="icon-small"> Add to Notepad';
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
        
        this.gameContainer.innerHTML = `
            <div class="password-minigame-area">
                ${imageData ? `
                    <div class="password-image-section">
                        <img src="/break_escape/assets/objects/${imageData.imageFile}.png" 
                             alt="${imageData.deviceName}" 
                             class="password-image">
                        <div class="password-info">
                            <h4>${imageData.deviceName}</h4>
                            <p>${imageData.observations}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="monitor-bezel">
                    <div class="monitor-screen">
                        <div class="password-input-container">
                            <label for="password-field">Password:</label>
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
                                    <strong>Hint:</strong> ${this.gameData.passwordHint}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${this.gameData.showPostit && this.gameData.postitNote ? `
                    <div class="postit-note">
                        ${this.gameData.postitNote}
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
                
                <div class="attempts-counter">
                    Attempts: <span id="attempts-display">${this.gameData.attempts}</span>/${this.gameData.maxAttempts}
                </div>
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
                this.passwordIncorrect();
            }
        } catch (error) {
            console.error('Server validation error:', error);
            if (error.message && error.message.includes('422')) {
                this.passwordIncorrect();
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
    
    passwordIncorrect() {
        if (this.gameData.attempts >= this.gameData.maxAttempts) {
            this.passwordFailed();
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.showFailure(`Incorrect password. ${this.gameData.maxAttempts - this.gameData.attempts} attempts remaining.`, false, 1500);
            
            // Clear the password field
            this.passwordField.value = '';
            this.gameData.password = '';
            this.passwordField.focus();
        }
    }
    
    passwordFailed() {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        this.showFailure("Maximum attempts exceeded. Access denied.", true, 1500);
        
        this.gameResult = {
            success: false,
            reason: 'max_attempts_exceeded',
            attempts: this.gameData.attempts
        };
    }
    
    cancelPassword() {
        this.cleanup();
        this.showFailure("Password entry cancelled.", true, 800);
        
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
}
