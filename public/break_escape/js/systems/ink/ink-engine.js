// Minimal InkEngine wrapper around the global inkjs.Story
// Exports a default class InkEngine matching the test harness API.
// Externals that only read window.gameState; they stay bound during a look-ahead probe.
const PURE_EXTERNALS = [
  'player_name', 'current_mission_id', 'npc_location',
  'mission_phase', 'operational_stress_level', 'equipment_status'
];

export default class InkEngine {
  constructor(id) {
    this.id = id || 'ink-engine';
    this.story = null;
  }

  // Accepts a parsed JSON object (ink.json) or a JSON string
  loadStory(storyJson) {
    if (!storyJson) throw new Error('No story JSON provided');
    // inkjs may accept either an object or a string; the test harness provides parsed JSON
    // inkjs library is available as global `inkjs` (loaded via assets/vendor/ink.js)
    if (typeof storyJson === 'string') {
      this.story = new inkjs.Story(storyJson);
      // An unbound EXTERNAL runs its ink fallback function instead of throwing (00 S1)
      this.story.allowExternalFunctionFallbacks = true;
    } else {
      // If it's an object, stringify then pass to constructor
      this.story = new inkjs.Story(JSON.stringify(storyJson));
      this.story.allowExternalFunctionFallbacks = true;
    }
    
    // Don't automatically continue - let the caller control when to get content
    // The PhoneChatMinigame will call continue() when ready to display content
    
    return this.story;
  }

  // Continue the story and return ONE line of visible text plus state
  // BEHAVIOR: Skips empty/whitespace lines, accumulates their tags, returns first line with content.
  // This ensures tags are processed with their specific line of dialogue.
  // The caller will see canContinue=true and call continue() again for more.
  continue() {
    if (!this.story) throw new Error('Story not loaded');
    
    let text = '';
    let tags = [];
    
    try {
      console.log('🔍 InkEngine.continue() - canContinue:', this.story.canContinue);
      console.log('🔍 InkEngine.continue() - currentChoices before:', this.story.currentChoices?.length);
      
      // Get lines until we have visible text (or hit choices/end)
      while (this.story.canContinue) {
        const lineText = this.story.Continue();
        const lineTags = this.story.currentTags || [];
        
        // Always accumulate tags
        if (lineTags.length > 0) {
          console.log('🏷️ InkEngine.continue() - found tags:', lineTags);
          tags = tags.concat(lineTags);
        }
        
        // Check if this line has visible content
        if (lineText.trim()) {
          text = lineText;
          console.log('🔍 InkEngine.continue() - got text:', text);
          break; // Stop - we have a line to show
        } else {
          console.log('🔍 InkEngine.continue() - skipping empty line, continuing...');
        }
      }
      
      console.log('🔍 InkEngine.continue() - canContinue after:', this.story.canContinue);
      console.log('🔍 InkEngine.continue() - currentChoices after:', this.story.currentChoices?.length);
      console.log('🔍 InkEngine.continue() - hasEnded:', this.story.hasEnded);
      
      // Return structured result with text, choices, tags, and continue state
      return {
        text: text,
        choices: (this.story.currentChoices || []).map((c, i) => ({ text: c.text, index: i, tags: Array.isArray(c.tags) ? c.tags.slice() : [] })),
        tags: tags,
        canContinue: this.story.canContinue,
        hasEnded: this.story.hasEnded
      };
    } catch (e) {
      // inkjs uses Continue() and throws for errors; rethrow with nicer message
      console.error('❌ InkEngine.continue() error:', e);
      throw e;
    }
  }

  // Go to a knot/stitch by name
  goToKnot(knotName) {
    if (!this.story) throw new Error('Story not loaded');
    if (!knotName) return;
    // inkjs expects ChoosePathString for high-level path selection
    this.story.ChoosePathString(knotName);
  }

  // Return the current text produced by the story
  get currentText() {
    if (!this.story) return '';
    return this.story.currentText || '';
  }

  // Return current choices as an array of objects { text, index }
  get currentChoices() {
    if (!this.story) return [];
    return (this.story.currentChoices || []).map((c, i) => ({ text: c.text, index: i, tags: Array.isArray(c.tags) ? c.tags.slice() : [] }));
  }

  // Choose a choice index
  choose(index) {
    if (!this.story) throw new Error('Story not loaded');
    if (typeof index !== 'number') throw new Error('choose() expects a numeric index');
    this.story.ChooseChoiceIndex(index);
  }

  // Variable accessors
  getVariable(name) {
        if (!this.story) throw new Error('Story not loaded');
        const val = this.story.variablesState.GetVariableWithName(name);
        // inkjs returns runtime value wrappers; try to unwrap common cases
        try {
            if (val && typeof val === 'object') {
                // common numeric/string wrapper types expose value or valueObject
                if ('value' in val) return val.value;
                if ('valueObject' in val) return val.valueObject;
            }
        } catch (e) {
            // ignore and return raw
        }
        return val;
  }

  setVariable(name, value) {
        if (!this.story) throw new Error('Story not loaded');

        // Let Ink handle the value type conversion through the indexer
        // which properly wraps values in Runtime.Value objects
        try {
            this.story.variablesState[name] = value;
        } catch (err) {
            console.warn(`⚠️ Failed to set variable ${name}:`, err.message);
        }
  }

  /**
   * Run a look-ahead (reading a step the player has not reached, to be rolled back) with
   * every bound external swapped for a no-op stub, except the pure getters below. An
   * external that has effects (se_influence writes an influence global and can fire
   * thresholds, pretext_say / pretext_ask log into the call's ledger, and whatever is bound
   * next) must not run twice, so the default is to stub; a new pure getter has to be added
   * to PURE_EXTERNALS. The stubs return 0, not void, so a step that uses the value
   * (`{se_influence(1) > 0: ...}`) does not throw. The real functions are put back after,
   * even if fn throws, and any error a stub provoked is cleared so the story can still be
   * stepped for real once the caller has restored its saved state.
   * @param {Function} fn
   * @returns {*} whatever fn returns
   */
  withEffectfulExternalsStubbed(fn) {
        const externals = this.story && this.story._externals;
        const swapped = [];
        if (externals && typeof externals.forEach === 'function') {
            externals.forEach((def, name) => {
                if (!def || PURE_EXTERNALS.includes(name)) return;
                swapped.push([def, def.function]);
                def.function = () => 0;
            });
        }
        try {
            return fn();
        } finally {
            for (const [def, original] of swapped) def.function = original;
            try { this.story?.ResetErrors?.(); } catch (_) { /* nothing to reset */ }
        }
  }

  // Bind an external function that Ink can call
  bindExternalFunction(name, func) {
        if (!this.story) throw new Error('Story not loaded');

        try {
            this.story.BindExternalFunction(name, func);
            console.log(`✅ Bound external function: ${name}`);
        } catch (err) {
            console.warn(`⚠️ Failed to bind external function ${name}:`, err.message);
        }
  }
}
