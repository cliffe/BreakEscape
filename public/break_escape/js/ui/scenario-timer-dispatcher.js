import { applyActions } from '../systems/apply-actions.js';

/**
 * ScenarioTimerDispatcher - Manages timer execution for scenario events
 * 
 * Tracks elapsed game time and fires scenario timers when their delay is reached.
 * When a timer fires, executes its setGlobal action and notifies the UI widget.
 * 
 * USAGE:
 *   window.scenarioTimerDispatcher = new ScenarioTimerDispatcher(scenario);
 *   scenarioTimerDispatcher.update(elapsedMs);  // call from game update loop
 * 
 * @class ScenarioTimerDispatcher
 */
class ScenarioTimerDispatcher {
  /**
   * @constructor
   * @param {Object} scenario - Scenario JSON object with timers[] section
   */
  constructor(scenario) {
    this.scenario = scenario;
    this.timers = scenario.timers || [];
    this.firedTimers = new Set();  // Track which timers have already fired
    this.startTime = Date.now();

    // ENG-02: per-timer start times for startOnGlobal timers.
    // null = dormant (waiting for startOnGlobal to fire); number = epoch ms when started.
    this._timerStartTimes = new Map();
    // ENG-02: timers aborted via cancelOnGlobal
    this._cancelledTimers = new Set();
    // ENG-02: event subscriptions for cleanup in destroy()
    this._eventSubs = [];

    for (const timer of this.timers) {
      // Reload/late init: don't restart a timer that has already been cancelled
      // or has already done its job (all its setGlobal keys already hold the target value).
      const globalsNow = window.gameState?.globalVariables || {};
      if (timer.cancelOnGlobal && globalsNow[timer.cancelOnGlobal]) {
        this._cancelTimer(timer, 'cancelOnGlobal already set at init');
        continue;
      }
      if (timer.setGlobal && typeof timer.setGlobal === 'object') {
        const keys = Object.keys(timer.setGlobal);
        if (keys.length > 0 && keys.every(k => globalsNow[k] === timer.setGlobal[k])) {
          this.firedTimers.add(timer.id);
          window.scenarioTimerUI?.markFired(timer.id);
          console.log(`ℹ️ Timer ${timer.id} skipped at init (setGlobal keys already set)`);
          continue;
        }
      }

      if (timer.startOnGlobal) {
        // Check if the variable is already true at init (e.g. game reloaded mid-session)
        const alreadySet = !!window.gameState?.globalVariables?.[timer.startOnGlobal];
        this._timerStartTimes.set(timer.id, alreadySet ? Date.now() : null);

        if (!alreadySet) {
          const eventName = `global_variable_changed:${timer.startOnGlobal}`;
          const handler = (payload) => {
            const value = payload?.value ?? window.gameState?.globalVariables?.[timer.startOnGlobal];
            if (value && this._timerStartTimes.get(timer.id) === null) {
              this._timerStartTimes.set(timer.id, Date.now());
              console.log(`⏱️ Timer ${timer.id} started (startOnGlobal: ${timer.startOnGlobal})`);
            }
          };
          window.eventDispatcher?.on(eventName, handler);
          this._eventSubs.push({ event: eventName, handler });
        }
      }

      if (timer.cancelOnGlobal) {
        const eventName = `global_variable_changed:${timer.cancelOnGlobal}`;
        const handler = (payload) => {
          const value = payload?.value ?? window.gameState?.globalVariables?.[timer.cancelOnGlobal];
          if (value) {
            this._cancelTimer(timer, `cancelOnGlobal: ${timer.cancelOnGlobal}`);
          }
        };
        window.eventDispatcher?.on(eventName, handler);
        this._eventSubs.push({ event: eventName, handler });
      }
    }

    console.log(`⏱️ ScenarioTimerDispatcher initialized with ${this.timers.length} timer(s)`);
  }

  /**
   * Cancel a timer and stop its HUD countdown
   * @private
   */
  _cancelTimer(timer, reason) {
    this._cancelledTimers.add(timer.id);
    window.scenarioTimerUI?.markFired(timer.id);
    console.log(`🚫 Timer ${timer.id} cancelled (${reason})`);
  }

  /**
   * Update timer state (call once per game loop tick)
   * Pass the current timestamp to calculate elapsed time from dispatcher initialization
   * @param {number} currentTimeMs - Current timestamp in milliseconds (e.g., Date.now())
   */
  update(currentTimeMs) {
    for (const timer of this.timers) {
      // Skip if already fired or cancelled
      if (this.firedTimers.has(timer.id)) continue;
      if (this._cancelledTimers.has(timer.id)) continue;

      // Determine elapsed time: per-timer for startOnGlobal timers, global otherwise
      let elapsedMs;
      if (timer.startOnGlobal) {
        const startedAt = this._timerStartTimes.get(timer.id);
        if (startedAt === null || startedAt === undefined) continue; // dormant
        elapsedMs = currentTimeMs - startedAt;
      } else {
        elapsedMs = currentTimeMs - this.startTime;
      }

      // Check if delay has elapsed
      if (elapsedMs >= timer.delayMs) {
        this._fireTimer(timer);
      }
    }
  }

  /**
   * Execute a timer's actions
   * @private
   * @param {Object} timer - Timer configuration object
   */
  _fireTimer(timer) {
    console.log(`🔥 Timer fired: ${timer.id} (delayMs: ${timer.delayMs})`);

    // Evaluate timer condition if present
    if (timer.condition) {
      try {
        const globalVars = window.gameState?.globalVariables || {};
        const conditionResult = this._evaluateCondition(timer.condition, globalVars);
        if (!conditionResult) {
          console.log(`ℹ️ Timer condition failed for ${timer.id}, skipping execution`);
          this.firedTimers.add(timer.id);  // Still mark as fired (condition block)
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to evaluate condition for timer ${timer.id}: ${error.message}`);
        this.firedTimers.add(timer.id);
        return;
      }
    }

    // Execute setGlobal action if present
    if (timer.setGlobal && typeof timer.setGlobal === 'object') {
      this._executeSetGlobal(timer.setGlobal);
    }

    // Execute additional actions if present (tint_objects, show_end_screen, etc.)
    if (Array.isArray(timer.actions) && timer.actions.length > 0) {
      applyActions(timer.actions, { source: `timer:${timer.id}` });
    }

    // Mark as fired
    this.firedTimers.add(timer.id);

    // Notify UI widget
    if (window.scenarioTimerUI) {
      window.scenarioTimerUI.markFired(timer.id);
    }

    console.log(`✅ Timer ${timer.id} completed`);
  }

  /**
   * Execute a setGlobal action (set variables and broadcast)
   * @private
   * @param {Object} globalVarUpdates - Map of variable names to values
   */
  _executeSetGlobal(globalVarUpdates) {
    const globalVars = window.gameState?.globalVariables || {};
    
    for (const [varName, value] of Object.entries(globalVarUpdates)) {
      const oldValue = globalVars[varName];
      globalVars[varName] = value;
      
      console.log(`🌐 Timer setGlobal: ${varName} = ${value} (was ${oldValue})`);
      
      // Broadcast variable change event for NPC eventMappings to react
      if (window.eventDispatcher) {
        window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
          varName: varName,
          oldValue: oldValue,
          value: value,
          source: 'scenario-timer'
        });
      }
    }
  }

  /**
   * Evaluate a condition string against globalVariables
   * Supports compound conditions with &&, equality checks, and string/number literals
   * Examples:
   *   - "globalVars.timer_test_active" (truthy check)
   *   - "globalVars.bed_state_1 === 'alert'" (string equality)
   *   - "globalVars.timer_test_active && globalVars.bed_state_1 === 'alert'" (compound)
   *   - "!globalVars.locked" (negation)
   * @private
   * @param {string} condition - Condition expression
   * @param {Object} globalVars - Map of global variable values
   * @returns {boolean} Evaluation result
   */
  _evaluateCondition(condition, globalVars) {
    // Helper: parse a literal value (string, number, boolean, null)
    const parseLiteral = (token) => {
      const t = token.trim();
      if (t === 'true') return true;
      if (t === 'false') return false;
      if (t === 'null') return null;
      const num = Number(t);
      if (!isNaN(num) && t !== '') return num;
      // String literal: "value" or 'value'
      const strMatch = t.match(/^['"](.*)['"]$/);
      if (strMatch) return strMatch[1];
      return t;
    };

    // Helper: evaluate a single condition (no &&)
    const evaluateSingleCondition = (expr) => {
      expr = expr.trim();

      // Handle negation: !globalVars.X
      if (expr.startsWith('!')) {
        const varName = expr.replace('!globalVars.', '').trim();
        return !globalVars[varName];
      }

      // Handle equality/inequality: globalVars.X === 'value' or globalVars.X !== 'value'
      if (expr.includes('===') || expr.includes('!==')) {
        const op = expr.includes('===') ? '===' : '!==';
        const [left, right] = expr.split(op).map(s => s.trim());
        const varName = left.replace('globalVars.', '').trim();
        const varValue = globalVars[varName];
        const rightValue = parseLiteral(right);
        return op === '===' ? varValue === rightValue : varValue !== rightValue;
      }

      // Handle comparison operators: >, <, >=, <=
      const compMatch = expr.match(/globalVars\.(\w+)\s*(>=|<=|>|<)\s*(.+)/);
      if (compMatch) {
        const varName = compMatch[1];
        const op = compMatch[2];
        const rightValue = parseLiteral(compMatch[3]);
        const varValue = globalVars[varName];
        switch (op) {
          case '>=': return varValue >= rightValue;
          case '<=': return varValue <= rightValue;
          case '>': return varValue > rightValue;
          case '<': return varValue < rightValue;
        }
      }

      // Default: check if globalVars.X exists and is truthy
      const varMatch = expr.match(/globalVars\.(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        return !!globalVars[varName];
      }

      return false;
    };

    // Handle compound conditions with &&
    if (condition.includes('&&')) {
      return condition.split('&&').every(part => evaluateSingleCondition(part));
    }

    return evaluateSingleCondition(condition);
  }

  /**
   * Cleanup: stop processing timers
   */
  destroy() {
    this._eventSubs.forEach(sub => window.eventDispatcher?.off(sub.event, sub.handler));
    this._eventSubs = [];
    console.log(`🗑️ ScenarioTimerDispatcher destroyed`);
  }
}

// ES6 named export
export { ScenarioTimerDispatcher };

// Also attach to window for global access
if (typeof window !== 'undefined') {
  window.ScenarioTimerDispatcher = ScenarioTimerDispatcher;
}
