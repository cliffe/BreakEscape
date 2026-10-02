/**
 * Tutorial Manager
 * Handles the basic actions tutorial for new players
 */

const TUTORIAL_STORAGE_KEY = 'tutorial_completed';
const TUTORIAL_DECLINED_KEY = 'tutorial_declined';

// The answer is also kept in the game's own global variables, which the server
// saves (state-sync.js) and restores on load (game.js savedGlobalVariables).
// localStorage alone is lost in a fresh browser profile or a partitioned iframe,
// so the prompt came back on every reload of a game the player had declined it in.
const TUTORIAL_COMPLETED_GLOBAL = 'engine_tutorial_completed';
const TUTORIAL_DECLINED_GLOBAL = 'engine_tutorial_declined';

function readStorage(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
}

function gameFlag(name) {
    return window.gameState?.globalVariables?.[name] === true;
}

function setGameFlag(name) {
    const globals = window.gameState?.globalVariables;
    if (!globals || globals[name] === true) return;
    globals[name] = true;
    // Save now rather than at the next 30 s sync, so an early reload keeps it
    window.stateSync?.sync?.();
}

export class TutorialManager {
    constructor() {
        this.active = false;
        this.currentStep = 0;
        this.steps = [];
        this.isMobile = this.detectMobile();
        this.tutorialOverlay = null;
        this.onComplete = null;

        // Track player actions for tutorial progression
        this.playerMoved = false;
        this.playerInteracted = false;
        this.playerRan = false;
        this.playerClickedToMove = false;
        this.playerUsedHoldWalk = false;
        this.playerClickedInventoryItem = false;
        this.playerToggledCombatMode = false;
        this.playerAttackedInCombatMode = false;
        this.playerToggledObjectives = false;
    }

    /**
     * Detect if the user is on a mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth < 768;
    }

    /**
     * Check if current scenario has objectives
     */
    hasObjectives() {
        // Check if objectives exist in the scenario
        const hasScenarioObjectives = window.gameScenario?.objectives?.length > 0;
        const hasManagerObjectives = window.objectivesManager?.aims?.length > 0;
        return hasScenarioObjectives || hasManagerObjectives;
    }

    /**
     * Check if tutorial has been completed before
     */
    hasCompletedTutorial() {
        return readStorage(TUTORIAL_STORAGE_KEY) === 'true' || gameFlag(TUTORIAL_COMPLETED_GLOBAL);
    }

    /**
     * Check if tutorial was declined
     */
    hasDeclinedTutorial() {
        return readStorage(TUTORIAL_DECLINED_KEY) === 'true' || gameFlag(TUTORIAL_DECLINED_GLOBAL);
    }

    /**
     * Mark tutorial as completed
     */
    markCompleted() {
        writeStorage(TUTORIAL_STORAGE_KEY, 'true');
        setGameFlag(TUTORIAL_COMPLETED_GLOBAL);
    }

    /**
     * Mark tutorial as declined
     */
    markDeclined() {
        writeStorage(TUTORIAL_DECLINED_KEY, 'true');
        setGameFlag(TUTORIAL_DECLINED_GLOBAL);
    }

    /**
     * Show prompt asking if player wants to do tutorial
     */
    showTutorialPrompt() {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'tutorial-prompt-overlay';
            overlay.innerHTML = `
                <div class="tutorial-prompt-modal">
                    <h2>Welcome to Hacktivity Games!</h2>
                    <p>Would you like to go through a quick tutorial to learn the basic controls?</p>
                    <div class="tutorial-prompt-buttons">
                        <button id="tutorial-yes" class="tutorial-btn tutorial-btn-primary">Yes, show me</button>
                        <button id="tutorial-no" class="tutorial-btn tutorial-btn-secondary">No, I'll figure it out</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            document.getElementById('tutorial-yes').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(true);
            });

            document.getElementById('tutorial-no').addEventListener('click', () => {
                this.markDeclined();
                document.body.removeChild(overlay);
                resolve(false);
            });
        });
    }

    /**
     * Start the tutorial
     */
    async start(onComplete) {
        this.active = true;
        this.onComplete = onComplete;
        this.currentStep = 0;

        // Define tutorial steps based on device type
        if (this.isMobile) {
            this.steps = [
                {
                    title: 'Movement',
                    instruction: 'Click or tap on the ground where you want to move. Your character will walk to that position.',
                    objective: 'Try moving around by clicking different locations',
                    checkComplete: () => this.playerMoved
                },
                {
                    title: 'Hold to Walk',
                    instruction: 'Press and hold anywhere on the ground to keep walking toward your finger. Drag around to steer your character.',
                    objective: 'Hold down and drag to walk continuously',
                    checkComplete: () => this.playerUsedHoldWalk
                },
                {
                    title: 'Interaction',
                    instruction: 'Click or tap on objects, items, or characters to interact with them.',
                    objective: 'Look for highlighted objects you can interact with',
                    checkComplete: () => this.playerInteracted
                },
                {
                    title: 'Inventory',
                    instruction: 'Your inventory is at the bottom of the screen. Click on items like the Notepad to use them.',
                    objective: 'Click on the Notepad in your inventory to open it',
                    checkComplete: () => this.playerClickedInventoryItem
                },
                {
                    title: 'Combat Mode',
                    instruction: 'Tap the hand icon in the bottom-left HUD to cycle through Interact, and attack modes.',
                    objective: 'Switch to an attack mode using the toggle button, then tap to attack',
                    checkComplete: () => this.playerToggledCombatMode && this.playerAttackedInCombatMode
                }
            ];

            // Don't add objectives step on mobile since the objectives panel is stacked under the tutorial and would be difficult to interact with - players can learn about it on desktop or discover it on their own
            
        } else {
            this.steps = [
                {
                    title: 'Movement',
                    instruction: 'Use W, A, S, D keys to move your character around.',
                    objective: 'Try moving in different directions',
                    checkComplete: () => this.playerMoved
                },
                {
                    title: 'Running',
                    instruction: 'Hold Shift while moving to run faster.',
                    objective: 'Hold Shift and move with WASD',
                    checkComplete: () => this.playerRan
                },
                {
                    title: 'Interaction',
                    instruction: 'Press E to interact with nearby objects, pick up items, or talk to characters.',
                    objective: 'Look for highlighted objects and press E to interact',
                    checkComplete: () => this.playerInteracted
                },
                {
                    title: 'Alternative Movement',
                    instruction: 'You can also click on the ground to move to that location.',
                    objective: 'Try clicking where you want to go',
                    checkComplete: () => this.playerClickedToMove
                },
                {
                    title: 'Hold to Walk',
                    instruction: 'Press and hold the mouse button on the ground to keep walking toward the cursor. Move the mouse while holding to steer your character.',
                    objective: 'Hold the mouse button down and move the cursor to walk continuously',
                    checkComplete: () => this.playerUsedHoldWalk
                },
                {
                    title: 'Inventory',
                    instruction: 'Your inventory is at the bottom of the screen. Click on items like the Notepad to use them.',
                    objective: 'Click on the Notepad in your inventory to open it',
                    checkComplete: () => this.playerClickedInventoryItem
                },
                {
                    title: 'Combat Mode',
                    instruction: 'Press Q or click the hand icon in the bottom-left HUD to cycle through Interact, Quick Jab, and Cross Punch modes.',
                    objective: 'Press Q to switch to an attack mode, then click or E to attack',
                    checkComplete: () => this.playerToggledCombatMode && this.playerAttackedInCombatMode
                }
            ];

            // Only add objectives step if scenario has objectives
            if (this.hasObjectives()) {
                this.steps.push({
                    title: 'Objectives',
                    instruction: 'The objectives panel in the top-right corner tracks your current tasks. Click the panel header to expand and collapse it.',
                    objective: 'Expand and collapse the objectives panel by clicking it',
                    checkComplete: () => this.playerToggledObjectives
                });
            }
        }

        // Collapse objectives panel on mobile so it doesn't obscure the tutorial
        if (this.isMobile && window.objectivesPanel && !window.objectivesPanel.isCollapsed) {
            window.objectivesPanel.toggleCollapse();
        }

        this.createTutorialOverlay();
        this.showStep(0);
    }

    /**
     * Create the tutorial overlay UI
     */
    createTutorialOverlay() {
        this.tutorialOverlay = document.createElement('div');
        this.tutorialOverlay.className = 'tutorial-overlay';
        this.tutorialOverlay.innerHTML = `
            <div class="tutorial-panel">
                <div class="tutorial-header">
                    <span class="tutorial-progress"></span>
                    <button class="tutorial-skip" title="Skip Tutorial">Skip Tutorial</button>
                </div>
                <h3 class="tutorial-title"></h3>
                <p class="tutorial-instruction"></p>
                <div class="tutorial-objective">
                    <strong>Objective:</strong>
                    <span class="tutorial-objective-text"></span>
                </div>
                <div class="tutorial-actions">
                    <button class="tutorial-next" style="display: none;">Continue</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.tutorialOverlay);

        // Skip button
        this.tutorialOverlay.querySelector('.tutorial-skip').addEventListener('click', () => {
            this.skip();
        });

        // Next button
        this.tutorialOverlay.querySelector('.tutorial-next').addEventListener('click', () => {
            this.nextStep();
        });
    }

    /**
     * Show a specific tutorial step
     */
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];

        // Update UI
        const overlay = this.tutorialOverlay;
        overlay.querySelector('.tutorial-progress').textContent = `Step ${stepIndex + 1} of ${this.steps.length}`;
        overlay.querySelector('.tutorial-title').textContent = step.title;
        overlay.querySelector('.tutorial-instruction').textContent = step.instruction;
        overlay.querySelector('.tutorial-objective-text').textContent = step.objective;

        // Remove completed class from objective
        const objectiveElement = overlay.querySelector('.tutorial-objective');
        if (objectiveElement) {
            objectiveElement.classList.remove('completed');
        }

        // Hide next button initially
        const nextButton = overlay.querySelector('.tutorial-next');
        nextButton.style.display = 'none';

        // Start checking for completion
        this.checkStepCompletion(step, nextButton);
    }

    /**
     * Check if current step is completed
     */
    checkStepCompletion(step, nextButton) {
        const interval = setInterval(() => {
            if (!this.active || this.currentStep !== this.steps.indexOf(step)) {
                clearInterval(interval);
                return;
            }

            if (step.checkComplete()) {
                // Step completed!
                const objectiveElement = this.tutorialOverlay.querySelector('.tutorial-objective');
                if (objectiveElement) {
                    objectiveElement.classList.add('completed');
                }

                nextButton.style.display = 'inline-block';
                nextButton.textContent = 'Continue →';
                clearInterval(interval);

                // Player must click Continue button to proceed
                // (No auto-advance - gives player control)
            }
        }, 100);
    }

    /**
     * Advance to next step
     */
    nextStep() {
        this.showStep(this.currentStep + 1);
    }

    /**
     * Complete the tutorial
     */
    complete() {
        this.active = false;
        this.markCompleted();

        if (this.tutorialOverlay) {
            document.body.removeChild(this.tutorialOverlay);
            this.tutorialOverlay = null;
        }

        // Show completion message
        if (window.showNotification) {
            window.showNotification(
                'You can now explore the facility. Check your objectives in the top-left corner!',
                'success',
                'Tutorial Complete!',
                5000
            );
        }

        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Skip the tutorial
     */
    skip() {
        if (confirm('Are you sure you want to skip the tutorial?')) {
            this.active = false;
            this.markCompleted();

            if (this.tutorialOverlay) {
                document.body.removeChild(this.tutorialOverlay);
                this.tutorialOverlay = null;
            }

            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    /**
     * Notify tutorial of player movement
     */
    notifyPlayerMoved() {
        if (this.active) {
            this.playerMoved = true;
        }
    }

    /**
     * Notify tutorial of click-to-move
     */
    notifyPlayerClickedToMove() {
        if (this.active) {
            this.playerClickedToMove = true;
        }
    }

    /**
     * Notify tutorial that the player used hold-to-walk (held the press to walk
     * continuously toward the cursor/finger)
     */
    notifyPlayerUsedHoldWalk() {
        if (this.active) {
            this.playerUsedHoldWalk = true;
        }
    }

    /**
     * Notify tutorial of inventory item click
     */
    notifyPlayerClickedInventoryItem() {
        if (this.active) {
            this.playerClickedInventoryItem = true;
        }
    }

    /**
     * Notify tutorial of player interaction
     */
    notifyPlayerInteracted() {
        if (this.active) {
            this.playerInteracted = true;
        }
    }

    /**
     * Notify tutorial of player running
     */
    notifyPlayerRan() {
        if (this.active) {
            this.playerRan = true;
        }
    }

    /**
     * Notify tutorial that the player switched to a combat mode (jab or cross)
     */
    notifyCombatModeToggled() {
        if (this.active) {
            this.playerToggledCombatMode = true;
        }
    }

    /**
     * Notify tutorial that the player attacked while in a combat mode
     */
    notifyAttackedInCombatMode() {
        if (this.active) {
            this.playerAttackedInCombatMode = true;
        }
    }

    /**
     * Notify tutorial that the player toggled the objectives panel
     */
    notifyObjectivesToggled() {
        if (this.active) {
            this.playerToggledObjectives = true;
        }
    }

    /**
     * Relaunch the tutorial from the beginning (e.g. triggered from preferences modal)
     */
    relaunch() {
        this.playerMoved = false;
        this.playerInteracted = false;
        this.playerRan = false;
        this.playerClickedToMove = false;
        this.playerUsedHoldWalk = false;
        this.playerClickedInventoryItem = false;
        this.playerToggledCombatMode = false;
        this.playerAttackedInCombatMode = false;
        this.playerToggledObjectives = false;

        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        localStorage.removeItem(TUTORIAL_DECLINED_KEY);
        const globals = window.gameState?.globalVariables;
        if (globals) {
            globals[TUTORIAL_COMPLETED_GLOBAL] = false;
            globals[TUTORIAL_DECLINED_GLOBAL] = false;
        }

        if (this.active && this.tutorialOverlay) {
            document.body.removeChild(this.tutorialOverlay);
            this.tutorialOverlay = null;
            this.active = false;
        }

        this.start(this.onComplete);
    }

    /**
     * Reset tutorial progress (for testing)
     */
    static resetTutorial() {
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        localStorage.removeItem(TUTORIAL_DECLINED_KEY);
        const globals = window.gameState?.globalVariables;
        if (globals) {
            globals[TUTORIAL_COMPLETED_GLOBAL] = false;
            globals[TUTORIAL_DECLINED_GLOBAL] = false;
        }
    }
}

// Create singleton instance
let tutorialManagerInstance = null;

export function getTutorialManager() {
    if (!tutorialManagerInstance) {
        tutorialManagerInstance = new TutorialManager();
    }
    return tutorialManagerInstance;
}

// Expose to window for easy access
if (typeof window !== 'undefined') {
    window.getTutorialManager = getTutorialManager;
    window.resetTutorial = TutorialManager.resetTutorial;
    window.relaunchTutorial = () => getTutorialManager().relaunch();
}
