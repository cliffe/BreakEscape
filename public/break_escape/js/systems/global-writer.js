/**
 * The shared global writer (00 S3; implementation plan 0.2).
 *
 * Every engine-side write of a global goes through writeGlobal, so the value
 * reaches gameState, the cached ink stories, the story that is running (the
 * calling story, or the open chat's) and the global_variable_changed listeners
 * in one consistent order:
 *
 *   1. gameState.globalVariables (first, so an observer that does fire sees
 *      the value already there and returns early);
 *   2. broadcastGlobalVariableChange to every story in npcManager.inkEngineCache
 *      that declares the name (source null: the live chat engines are not in
 *      that cache, so nothing is skipped);
 *   3. the calling story and the open chat's story, each only if it declares
 *      the name, through setDeclaredVariable with that story's own
 *      variableChangedEvent detached in a try/finally (restored with delete
 *      when the story had no own observer);
 *   4. global_variable_changed:<name> with { name, value }: only on a change,
 *      or on every call with emitAlways; with deferEmit the events are returned
 *      for the caller to emit later (emitGlobalEvents) instead.
 *
 * Read-modify-write (value given as a function): the base value comes from the
 * calling story when it declares the name, not from gameState. inkjs holds the
 * observer back until Continue() ends, so an ink assignment earlier in the same
 * Continue() has not reached gameState yet (spike F1, P0-B).
 *
 * Choices already on screen were evaluated before the write; the new value
 * shows from the next Continue(). A threshold that unlocks a choice must move
 * the value before the choice point.
 */

const stateManager = () => (typeof window !== 'undefined' ? window.npcConversationStateManager : null);

const storyOf = (engine) => {
    if (!engine) return null;
    if (engine.variablesState) return engine; // a bare inkjs Story
    return engine.story || null;               // an InkEngine: read .story at write time
};

const declares = (story, name) => !!story?.variablesState?._defaultGlobalVariables?.has(name);

/** Whether this name syncs into the inks (declared scenario global or global_*). */
function syncsToInk(name) {
    const manager = stateManager();
    if (manager?.isGlobalVariable) return manager.isGlobalVariable(name);
    return typeof name === 'string' && name.startsWith('global_');
}

/**
 * The open chat minigame's engine and NPC id, or null. Person chat keeps the
 * NPC as npcId, phone chat as currentNPCId; both keep the engine as inkEngine.
 * The phone chat reuses one engine across contacts, so read it at write time.
 */
export function getOpenChat() {
    const current = (typeof window !== 'undefined') ? window.MinigameFramework?.currentMinigame : null;
    if (!current?.inkEngine?.story) return null;
    return { engine: current.inkEngine, npcId: current.npcId ?? current.currentNPCId ?? null };
}

/**
 * Current value of a global: the calling story's, when it declares the name
 * (see the read-modify-write note above); otherwise gameState's.
 */
export function readGlobal(name, { engine = null } = {}) {
    const story = storyOf(engine);
    if (declares(story, name) && syncsToInk(name)) {
        try {
            return story.variablesState.$(name);
        } catch (e) {
            // fall through to gameState
        }
    }
    return (typeof window !== 'undefined') ? window.gameState?.globalVariables?.[name] : undefined;
}

/**
 * Write a declared VAR into one story with its observer detached. The observer
 * is an own property put on the VariablesState by observeGlobalVariableChanges;
 * a story without one inherits inkjs's dispatcher, and is restored with delete
 * so it is left exactly as it was.
 * @returns {boolean} True if the story declared the name and took the value
 */
export function writeStoryDetached(story, name, value) {
    if (!declares(story, name)) return false;
    const vs = story.variablesState;
    const hadOwn = Object.prototype.hasOwnProperty.call(vs, 'variableChangedEvent');
    const saved = hadOwn ? vs.variableChangedEvent : undefined;
    vs.variableChangedEvent = null;
    try {
        const manager = stateManager();
        if (manager?.setDeclaredVariable) return manager.setDeclaredVariable(story, name, value);
        vs.$(name, value);
        return true;
    } catch (e) {
        console.warn(`⚠️ [globalWriter] Could not write ${name} into story:`, e.message);
        return false;
    } finally {
        if (hadOwn) vs.variableChangedEvent = saved;
        else delete vs.variableChangedEvent;
    }
}

/** Emit events returned by a deferEmit write, in order. */
export function emitGlobalEvents(events) {
    if (!Array.isArray(events)) return;
    for (const { event, data } of events) {
        window.eventDispatcher?.emit(event, data);
    }
}

function clampValue(value, clamp) {
    if (!clamp || typeof value !== 'number' || Number.isNaN(value)) return value;
    let v = value;
    if (typeof clamp.min === 'number' && v < clamp.min) v = clamp.min;
    if (typeof clamp.max === 'number' && v > clamp.max) v = clamp.max;
    return v;
}

/**
 * Write one global.
 *
 * @param {string} name
 * @param {*|function(*):*} value  The new value, or a function of the current
 *                                 value (read with readGlobal, so from the
 *                                 calling story when it declares the name)
 * @param {Object}  [opts]
 * @param {boolean} [opts.emitAlways=false] Emit even when the value is unchanged
 *                                 (applyActions set_global). Default: change only
 * @param {boolean} [opts.deferEmit=false]  Emit nothing; return the pending
 *                                 events in `events` for emitGlobalEvents
 * @param {Object}  [opts.engine]  The calling story's InkEngine (or a bare
 *                                 Story): the binding running inside Continue(),
 *                                 or a runner's private engine. Written with its
 *                                 observer detached; the source of the base value
 *                                 for a function value; gets the clamped value back
 * @param {string}  [opts.npcId]   When given, the open chat's story is written
 *                                 only if the open chat is this NPC's
 * @param {boolean} [opts.openChat=true] Also write the open chat's story
 * @param {{min?:number,max?:number}} [opts.clamp] Clamp a numeric value; the
 *                                 clamped value is what every target receives,
 *                                 including the calling story (write-back)
 * @returns {{name:string, value:*, previous:*, changed:boolean,
 *            storiesWritten:number, events:Array<{event:string,data:Object}>}}
 *          `events` holds the events not yet emitted (deferEmit only)
 */
export function writeGlobal(name, value, {
    emitAlways = false,
    deferEmit = false,
    engine = null,
    npcId = null,
    openChat = true,
    clamp = null
} = {}) {
    const result = { name, value: undefined, previous: undefined, changed: false, storiesWritten: 0, events: [] };
    const globals = (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
    if (name === undefined || name === null || !globals) return result;

    const previous = globals[name];
    const base = (typeof value === 'function') ? readGlobal(name, { engine }) : undefined;
    const next = clampValue((typeof value === 'function') ? value(base) : value, clamp);
    result.previous = previous;
    result.value = next;
    // A change is judged against gameState, which is what every listener has
    // seen. An ink assignment still held back inside Continue() is not counted:
    // when its batched observer call runs, gameState already holds the writer's
    // value and the observer returns early, so the held value is never emitted.
    result.changed = previous !== next;

    // 1. gameState
    globals[name] = next;

    // 2. cached stories that declare it
    stateManager()?.broadcastGlobalVariableChange?.(name, next, null);

    // 3. the calling story and the open chat's story
    if (syncsToInk(name)) {
        const targets = [];
        const calling = storyOf(engine);
        if (calling) targets.push(calling);
        if (openChat) {
            const open = getOpenChat();
            if (open && (npcId === null || npcId === undefined || open.npcId === npcId)) {
                const openStory = storyOf(open.engine);
                if (openStory && !targets.includes(openStory)) targets.push(openStory);
            }
        }
        for (const story of targets) {
            if (writeStoryDetached(story, name, next)) result.storiesWritten++;
        }
    }

    // 4. emit
    if (result.changed || emitAlways) {
        const pending = { event: `global_variable_changed:${name}`, data: { name, value: next } };
        if (deferEmit) result.events.push(pending);
        else emitGlobalEvents([pending]);
    }

    return result;
}

export default writeGlobal;
