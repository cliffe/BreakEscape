import { MinigameScene } from '../framework/base-minigame.js';

// PIN Minigame Scene implementation
export class PinMinigame extends MinigameScene {
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
        this.correctPin = params.correctPin || '1234';
        this.maxAttempts = params.maxAttempts || 3;
        this.pinLength = params.pinLength || 4;
        this.infoLeakMode = params.infoLeakMode || false;
        this.allowBackspace = params.allowBackspace !== false;
        this.hasPinCracker = params.hasPinCracker || false;
        
        // Game state
        this.currentInput = '';
        this.attempts = [];
        this.attemptCount = 0;
        this.isLocked = false;
        
        // UI elements
        this.displayElement = null;
        this.keypadElement = null;
        this.attemptsLogElement = null;
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
            attemptsUsed: (this.attempts || []).length,
            maxAttempts: this.maxAttempts,
            isLocked: !!this.isLocked
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
        
        // Create digital display
        const displayContainer = document.createElement('div');
        displayContainer.className = 'pin-minigame-display-container';
        
        this.displayElement = document.createElement('div');
        this.displayElement.className = 'pin-minigame-display';
        this.displayElement.textContent = '____';
        
        displayContainer.appendChild(this.displayElement);
        interfaceContainer.appendChild(displayContainer);
        
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
            backspaceButton.textContent = '⌫';
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
            toggleText.textContent = 'Pin-Cracker Info Leak:';
            
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
    }
    
    handleNumberInput(number) {
        if (this.isLocked || this.currentInput.length >= this.pinLength) {
            return;
        }

        if (window.playUISound) window.playUISound('keypad');
        this.currentInput += number;
        this.updateDisplay();
        
        // Auto-submit if PIN length is reached
        if (this.currentInput.length === this.pinLength) {
            setTimeout(() => this.handleEnter(), 300);
        }
    }
    
    handleBackspace() {
        if (this.isLocked || this.currentInput.length === 0) {
            return;
        }

        if (window.playUISound) window.playUISound('keypad');
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateDisplay();
    }
    
    async handleEnter() {
        if (this.isLocked || this.currentInput.length !== this.pinLength) {
            return;
        }

        this.attemptCount++;

        // SECURITY: ALWAYS use server-side validation for PIN attempts
        let isCorrect;
        const apiClient = window.ApiClient || window.APIClient;
        const gameId = window.breakEscapeConfig?.gameId;

        if (apiClient && gameId) {
            console.log('Using server-side PIN validation (security enforced)');
            isCorrect = await this.validatePinWithServer(this.currentInput);
        } else {
            console.error('SECURITY WARNING: API client not available, cannot validate PIN');
            // Fail securely - reject the attempt if we can't validate with server
            isCorrect = false;
        }

        // Record attempt
        const attempt = {
            input: this.currentInput,
            isCorrect: isCorrect,
            timestamp: new Date(),
            feedback: (this.infoLeakToggleElement?.checked || this.infoLeakMode) && this.correctPin ? this.calculateFeedback(this.currentInput) : null
        };

        this.attempts.push(attempt);
        this.updateAttemptsDisplay();

        if (isCorrect) {
            this.handleSuccess();
        } else {
            this.handleFailure();
        }
    }

    async validatePinWithServer(enteredPin) {
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
                return false;
            }

            console.log('Validating PIN with server:', { targetType, targetId, attempt: enteredPin });

            // Call server API for validation (use ApiClient with correct casing)
            const apiClient = window.ApiClient || window.APIClient;
            const response = await apiClient.unlock(targetType, targetId, enteredPin, 'pin');

            // If server returned container contents, populate the lockable object
            if (response.success && response.hasContents && response.contents && lockable.scenarioData) {
                console.log('Server returned container contents:', response.contents);
                lockable.scenarioData.contents = response.contents;
            }

            // Store server response to pass through callback chain
            this.serverResponse = response;

            return response.success;
        } catch (error) {
            console.error('Server validation error:', error);
            this.showFailure("Network error. Please try again.", false, 3000);
            // Decrease attempts counter since this wasn't a real attempt
            this.attemptCount--;
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
    
    updateAttemptsDisplay() {
        if (!this.attemptsLogElement) return;
        
        this.attemptsLogElement.innerHTML = '';
        
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
            
            // Add visual feedback lights if pin-cracker is enabled and feedback is available
            // OR if mastermind mode is enabled via parameter
            if ((this.hasPinCracker && this.infoLeakToggleElement?.checked && attempt.feedback) || 
                (this.infoLeakMode && attempt.feedback)) {
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'pin-minigame-feedback-lights';
                
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
    }
    
    updatePinCrackerIcon() {
        if (this.pinCrackerIconElement) {
            this.pinCrackerIconElement.style.display = this.infoLeakToggleElement?.checked ? 'inline-block' : 'none';
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
    
    handleFailure() {
        this.currentInput = '';
        this.updateDisplay();

        if (window.playUISound) window.playUISound('reject');
        if (this.attemptCount >= this.maxAttempts) {
            this.isLocked = true;
            this.displayElement.classList.add('locked');
            this.displayElement.textContent = 'LOCKED';

            this.showFailure('Maximum attempts reached. System locked.', true, 3000);
            
            // Set game result
            this.gameResult = {
                success: false,
                attempts: this.attemptCount,
                maxAttemptsReached: true
            };
        } else {
            // Show temporary failure message
            const remainingAttempts = this.maxAttempts - this.attemptCount;
            this.showFailure(`Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`, false, 1500);
            
            // Clear the failure message after delay
            setTimeout(() => {
                const failureMessage = this.messageContainer.querySelector('.minigame-failure-message');
                if (failureMessage) {
                    failureMessage.remove();
                }
            }, 1500);
        }
    }
    
    start() {
        super.start();
        console.log("PIN minigame started");
        
        this.startTime = Date.now();
        this.updateDisplay();
        this.updateAttemptsDisplay();
        this.updatePinCrackerIcon();
    }
    
    complete(success) {
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
        maxAttempts: options.maxAttempts || 3,
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

// Make the function available globally
window.startPinMinigame = startPinMinigame;
