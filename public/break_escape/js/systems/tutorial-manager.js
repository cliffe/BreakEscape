/**
 * Tutorial Manager
 * Handles the basic actions tutorial for new players
 */

import { isCompactViewport } from '../ui/hud-lanes.js';

const TUTORIAL_STORAGE_KEY = 'tutorial_completed';
const TUTORIAL_DECLINED_KEY = 'tutorial_declined';

// The answer is also kept in the game's own global variables, which the server
// saves (state-sync.js) and restores on load (game.js savedGlobalVariables).
// localStorage alone is lost in a fresh browser profile or a partitioned iframe,
// so the prompt came back on every reload of a game the player had declined it in.
const TUTORIAL_COMPLETED_GLOBAL = 'engine_tutorial_completed';
const TUTORIAL_DECLINED_GLOBAL = 'engine_tutorial_declined';

// Shown under the objective when a step is done. Words, not colour, carry the meaning.
const TUTORIAL_READY_TEXT = 'Done. Press Continue (or Enter).';
// Touch-first devices have no Enter key to press
const TUTORIAL_READY_TEXT_TOUCH = 'Done. Tap Continue.';
const READY_OUTLINE_PX = 4; // Continue's ready outline: 2px plus 2px offset

// Dialogs that hold the keyboard while shown. Most are built once and hidden, so the
// check below counts only the ones actually rendered. The tutorial's own panel and
// prompt are left out on purpose (this is the same list as ui/hud-lanes.js DIALOG_SELECTORS).
const OTHER_DIALOG_SELECTOR = '[aria-modal="true"], .game-confirm-overlay, ' +
    '#player-preferences-modal, .ending-check-overlay, .success-screen-overlay';

function isShown(el) {
    if (!el) return false;
    try {
        if (typeof el.checkVisibility === 'function') return !!el.checkVisibility({ checkVisibilityCSS: true });
        if (el.style && el.style.display === 'none') return false;
        // No checkVisibility (older browsers): an element inside a display:none parent
        // has no client rects, which its own computed style would not show
        if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
        const cs = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(el) : null;
        return !(cs && (cs.display === 'none' || cs.visibility === 'hidden'));
    } catch (e) {
        return true;
    }
}

/** Touch-only by pointer: coarse primary pointer and no fine pointer to fall back on. False without matchMedia. */
function isTouchOnlyPointer() {
    try {
        const mm = window.matchMedia;
        if (typeof mm !== 'function') return false;
        return !!mm.call(window, '(pointer: coarse)').matches && !mm.call(window, '(any-pointer: fine)').matches;
    } catch (e) {
        return false;
    }
}

/**
 * True on a touch-first device: touch-only by pointer (iPadOS Safari with a Mac user agent,
 * an Android tablet in desktop mode) or a mobile user agent. A narrow window with a mouse is
 * not touch-first (it gets the mobile steps, see detectMobile, but keeps Enter wording).
 */
function isTouchFirst() {
    try {
        if (isTouchOnlyPointer()) return true;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    } catch (e) {
        return false;
    }
}

// The phone layout of ui/hud-lanes.js (isCompactViewport): there the objectives panel is a
// sheet over the map, so the tutorial panel and it compete for space. Wider screens, touch
// or not, have room for both. The rule is hud-lanes.js's, not a copy.
function isCompactHud() {
    return isCompactViewport(window.innerWidth, window.innerHeight);
}

// Same selector the game's key handler (core/player.js) uses for "a control has the focus"
const FOCUSABLE_CONTROL = 'button, input, textarea, select, a[href], [contenteditable]:not([contenteditable="false"])';

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
        this.touchFirst = isTouchFirst();
        this.tutorialOverlay = null;
        this.onComplete = null;
        // True from the moment the game decides to ask until the player answers,
        // including the settle delay before the modal appears (isPromptOpen)
        this.promptOpen = false;
        this.stepReady = false;
        this.keyHandler = null;
        // True while the panel is collapsed by this tutorial (not by the player)
        this.collapsedObjectives = false;

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
        // Same helper as the ready wording, plus the narrow-window rule
        return isTouchFirst() || window.innerWidth < 768;
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
     * Is the "would you like a tutorial?" prompt open, or about to open?
     * It is plain DOM, not a minigame, so systems that hold while a minigame is
     * open (npc-sight-challenge.js) check this as well.
     */
    isPromptOpen() {
        return this.promptOpen;
    }

    /**
     * Show prompt asking if player wants to do tutorial.
     * @param {Object} [options]
     * @param {number} [options.delayMs=0] wait this long before showing the modal;
     *   the prompt counts as open (isPromptOpen) from the call, not from when it appears
     */
    showTutorialPrompt({ delayMs = 0 } = {}) {
        this.promptOpen = true;
        return new Promise((resolve) => {
          const open = () => {
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
                this.promptOpen = false;
                resolve(true);
            });

            document.getElementById('tutorial-no').addEventListener('click', () => {
                this.markDeclined();
                document.body.removeChild(overlay);
                this.promptOpen = false;
                resolve(false);
            });
          };
          if (delayMs > 0) setTimeout(open, delayMs);
          else open();
        });
    }

    /**
     * Start the tutorial
     */
    async start(onComplete) {
        this.active = true;
        this.onComplete = onComplete;
        this.currentStep = 0;

        // Decide the step set and the ready wording together, once per run, so a
        // relaunch after the pointer or window changed still agrees with itself
        this.isMobile = this.detectMobile();
        this.touchFirst = isTouchFirst();

        // Collapse the objectives panel only where it would crowd the tutorial (the compact
        // phone layout); the objectives step then goes, since the panel is out of the way
        const collapseObjectives = this.isMobile && isCompactHud();
        if (!collapseObjectives) this.restoreObjectivesPanel();

        // Define tutorial steps based on device type
        // Wording follows the run: touch-first devices are told to tap, never click
        const tap = this.touchFirst;
        if (this.isMobile) {
            this.steps = [
                {
                    title: 'Movement',
                    instruction: (tap ? 'Tap' : 'Click or tap') + ' on the ground where you want to move. Your character will walk to that position.',
                    objective: 'Try moving around by ' + (tap ? 'tapping' : 'clicking') + ' different locations',
                    checkComplete: () => this.playerMoved
                },
                {
                    title: 'Hold to Walk',
                    instruction: tap
                        ? 'Touch and hold anywhere on the ground to keep walking toward your finger. Drag around to steer your character.'
                        : 'Press and hold anywhere on the ground to keep walking toward the pointer. Drag around to steer your character.',
                    objective: 'Hold down and drag to walk continuously',
                    checkComplete: () => this.playerUsedHoldWalk
                },
                {
                    title: 'Interaction',
                    instruction: (tap ? 'Tap' : 'Click or tap') + ' on objects, items, or characters to interact with them.',
                    objective: 'Look for highlighted objects you can interact with',
                    checkComplete: () => this.playerInteracted
                },
                {
                    title: 'Inventory',
                    instruction: 'Your inventory is at the bottom of the screen. ' + (tap ? 'Tap' : 'Click') + ' on items like the Notepad to use them.',
                    objective: (tap ? 'Tap' : 'Click') + ' the Notepad in your inventory to open it',
                    checkComplete: () => this.playerClickedInventoryItem
                },
                {
                    title: 'Combat Mode',
                    instruction: tap
                        ? 'Tapping the screen always walks or interacts. To fight, use the buttons at the bottom right: tap Punch (tap again quickly for jab, jab, cross) and hold Block to guard.'
                        : 'Clicking the ground always walks or interacts. To fight, use the buttons at the bottom right: click Punch (click again quickly for jab, jab, cross) and hold Block to guard.',
                    objective: (tap ? 'Tap' : 'Click') + ' Punch, then hold Block',
                    checkComplete: () => this.playerToggledCombatMode && this.playerAttackedInCombatMode
                }
            ];

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
                    instruction: 'Clicking always walks or interacts. To fight, right-click or press F to punch (press again quickly for jab, jab, cross) and hold Q to block. Touch players get Punch and Block buttons at the bottom right.',
                    objective: 'Punch with F or right-click, then hold Q to block',
                    checkComplete: () => this.playerToggledCombatMode && this.playerAttackedInCombatMode
                }
            ];

        }

        // Only add objectives step if scenario has objectives and the panel stays open
        // (on a compact phone the panel is collapsed below, so the step is dropped there)
        if (!collapseObjectives && this.hasObjectives()) {
            this.steps.push({
                title: 'Objectives',
                instruction: 'The objectives panel in the top-left corner tracks your current tasks. ' +
                    (tap ? 'Tap' : 'Click') + ' the panel header to expand and collapse it.',
                objective: 'Expand and collapse the objectives panel by ' + (tap ? 'tapping' : 'clicking') + ' it',
                checkComplete: () => this.playerToggledObjectives
            });
        }

        // Scenarios with attacks disabled have no combat to teach (see attacksDisabled() in player-combat.js)
        if (window.gameScenario?.disableAttacks === true) {
            this.steps = this.steps.filter(step => step.title !== 'Combat Mode');
        }

        // Collapse objectives panel on a compact phone so it doesn't obscure the tutorial.
        // setCollapsed keeps this out of the player's own toggle record and the Objectives step
        if (collapseObjectives && window.objectivesPanel && !window.objectivesPanel.isCollapsed) {
            window.objectivesPanel.setCollapsed(true);
            this.collapsedObjectives = true;
        }

        this.createTutorialOverlay();
        this.showStep(0);
    }

    /**
     * Reopen the objectives panel if this tutorial collapsed it. A panel the player
     * collapsed (or reopened) themselves is left as it is.
     */
    restoreObjectivesPanel() {
        if (!this.collapsedObjectives) return;
        this.collapsedObjectives = false;
        if (window.objectivesPanel?.isCollapsed) window.objectivesPanel.setCollapsed(false);
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
                <p class="tutorial-ready" role="status" aria-live="polite"></p>
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

        // Enter continues once the step is done (see onKeyDown for when it does not)
        if (!this.keyHandler) {
            this.keyHandler = (event) => this.onKeyDown(event);
            document.addEventListener('keydown', this.keyHandler);
        }
    }

    /**
     * True when something other than the game owns the keyboard: a minigame, a
     * conversation, a modal (confirm, game menu, the tutorial prompt) or a focused control.
     * Mirrors keysBelongToUi in core/player.js, plus the conversation and aria-modal checks.
     */
    inputBelongsToOther(event) {
        if (window.MinigameFramework?.currentMinigame) return true;
        if (window.currentConversationNPCId || window.currentConversationMinigameType) return true;
        if ((window.openModalCount?.() || 0) > 0) return true;
        if (window.gameConfirmOpen?.()) return true;
        if (this.promptOpen) return true;
        if (window.gameMenu?.isOpen) return true;
        if (document.querySelectorAll) {
            for (const dialog of document.querySelectorAll(OTHER_DIALOG_SELECTOR)) {
                if (isShown(dialog)) return true;
            }
        }
        const target = event?.target;
        return !!(target && typeof target.closest === 'function' && target.closest(FOCUSABLE_CONTROL));
    }

    /**
     * Enter takes the Continue button once the step is complete. Space is not bound:
     * the game uses it to jump. A focused button (Continue itself, Skip) is left to its
     * own Enter handling, so one press never advances twice.
     */
    onKeyDown(event) {
        if (!this.active || !this.stepReady || event.key !== 'Enter') return;
        if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
        if (this.inputBelongsToOther(event)) return;
        event.preventDefault?.();
        this.nextStep();
    }

    /**
     * Put the Continue button into its "ready" state: the words under the objective, a frame
     * on the button and a short cue. The class stays so the frame stays; only the cue
     * animation ends, after 3 steps, in CSS. Under prefers-reduced-motion it never animates.
     */
    setStepReady(nextButton) {
        this.stepReady = true;
        nextButton.classList.add('tutorial-next-ready');
        const ready = this.tutorialOverlay?.querySelector('.tutorial-ready');
        if (ready) ready.textContent = this.touchFirst ? TUTORIAL_READY_TEXT_TOUCH : TUTORIAL_READY_TEXT;
        this.revealReadyCue(ready, nextButton);
    }

    /**
     * In short windows (phone landscape) the panel scrolls and the new ready line and
     * Continue can sit below the fold. Scroll the panel, and only the panel, by the least
     * amount that shows the button, keeping the ready line in view if both fit. Instant
     * (assigning scrollTop never animates), no focus change, no window scroll. Does nothing
     * when already visible or when layout measures are unavailable (tests).
     */
    revealReadyCue(readyLine, nextButton) {
        try {
            const panel = this.tutorialOverlay?.querySelector('.tutorial-panel');
            if (!panel || !nextButton || typeof nextButton.getBoundingClientRect !== 'function'
                || typeof panel.getBoundingClientRect !== 'function') return;
            if (!(panel.scrollHeight > panel.clientHeight)) return;
            const box = panel.getBoundingClientRect();
            const btn = nextButton.getBoundingClientRect();
            const lineTop = readyLine && typeof readyLine.getBoundingClientRect === 'function'
                ? readyLine.getBoundingClientRect().top : btn.top;
            // The scrollport is the padding box: the panel's frame (border or border-image,
            // 18px in the themed skin) is not part of it. Leave room for the button's focus
            // outline (2px plus 2px offset).
            const innerTop = box.top + (panel.clientTop || 0);
            const innerBottom = innerTop + panel.clientHeight;
            let delta = btn.bottom + READY_OUTLINE_PX - innerBottom;
            if (!(delta > 0)) return;
            if (lineTop - delta < innerTop) delta = Math.max(0, lineTop - innerTop);
            if (!(delta > 0)) return;
            panel.scrollTop += delta;
        } catch (e) { /* cosmetic only */ }
    }

    clearStepReady() {
        this.stepReady = false;
        const overlay = this.tutorialOverlay;
        overlay?.querySelector('.tutorial-next')?.classList.remove('tutorial-next-ready');
        const ready = overlay?.querySelector('.tutorial-ready');
        if (ready) ready.textContent = '';
    }

    removeKeyHandler() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        this.stepReady = false;
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
        // A scrolled panel (phone landscape) must start the next step at the top
        try {
            const panel = this.tutorialOverlay?.querySelector('.tutorial-panel');
            if (panel) panel.scrollTop = 0;
        } catch (e) { /* cosmetic only */ }

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
        this.clearStepReady();

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
                this.setStepReady(nextButton);
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
        this.removeKeyHandler();
        this.restoreObjectivesPanel();

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
        if (!confirm('Are you sure you want to skip the tutorial?')) {
            // Cancelled: do not leave Skip focused, or Enter would reopen this confirm
            this.tutorialOverlay?.querySelector('.tutorial-skip')?.blur?.();
            return;
        }
        this.active = false;
        this.markCompleted();
        this.removeKeyHandler();
        this.restoreObjectivesPanel();

        if (this.tutorialOverlay) {
            document.body.removeChild(this.tutorialOverlay);
            this.tutorialOverlay = null;
        }

        if (this.onComplete) {
            this.onComplete();
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
     * Notify tutorial that the player raised the guard (Q or the Block
     * button). Completes the combat step's "toggled" half, which used to be
     * switching to an attack mode before the toggle was replaced.
     */
    notifyBlocked() {
        this.notifyCombatModeToggled();
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
        // The player's own toggle: the panel is theirs now, so the end of the run leaves it alone
        this.collapsedObjectives = false;
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

        this.removeKeyHandler();
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
