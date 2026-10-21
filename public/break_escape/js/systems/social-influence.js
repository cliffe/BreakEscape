/**
 * The social influence service (00 S5, §8; implementation plan 0.3, packet P0-F;
 * 06 N9).
 *
 * A social character is an entry in scenario.social.characters. Its influence is
 * the scenario global `influence.global` (default `<character>_influence`). The
 * service watches that global, clamps it, runs the character's thresholds and
 * their effects, keeps the latch and the band flags, and is the one write path
 * behind se_influence (and, later, pretext_say / pretext_ask). A scenario with
 * no `social` key gets no service: installSocialInfluence returns null and
 * registers no listener, so nothing changes for m01 to m08.
 *
 * Nothing in the shipped engine imports this module yet. P0-G (the tag
 * processor) is the first caller; Phase 4 adds the lockout channel checks (S10).
 *
 * ---------------------------------------------------------------- public API
 *
 * Module functions
 *   installSocialInfluence({ scenario?, dispatcher?, hooks? }) -> service | null
 *       scenario   defaults to window.gameScenario; dispatcher to
 *                  window.eventDispatcher. Returns null (and does nothing) when
 *                  the scenario has no social.characters. Replaces any earlier
 *                  install. Sets window.socialInfluence to the service.
 *       hooks      optional overrides, mainly for tests and Phase 4:
 *                  { now() -> elapsed ms (default window.gameClock.elapsedMs()),
 *                    toast(text, info), endConversation(info), setHostile(npcId, info) }
 *   getSocialInfluence() -> the installed service, or null
 *   uninstallSocialInfluence()
 *   resolveInfluenceDisplay(scenario, characterId) -> { bar, number, pip }
 *       README AA, 00 §8. Each key defaults to true; social.influenceDisplay
 *       sets the scenario default; the character's influence.display overrides
 *       key by key; bar: false forces number: false. Non-boolean values are
 *       ignored. A character with no social.characters entry gets all false.
 *   bandForLatched(thresholds, latchedIds) -> 0..4   (00 §8 "Band numbers")
 *
 * Service: lookup
 *   isSocialCharacter(id)          id is a character id or one of its channel NPC ids
 *   resolveCharacter(id)           -> { characterId, channel } | null
 *                                     (channel is 'person' | 'phone' | 'email' | null)
 *   getCharacterConfig(characterId) -> normalised config (read-only use)
 *   getInfluence(characterId)      -> number (gameState, else the start value)
 *   getLatched(characterId)        -> string[] of fired threshold ids
 *   getBand(characterId)           -> 0 calm, 1 wary, 2 refusing, 3 reported, 4 locked out
 *   getLog(characterId)            -> recent { delta, reason, line, value, previous, at, kind } entries
 *   getLastReport(characterId)     -> { reason, at } | null
 *
 * Service: writes (every one goes through systems/global-writer.js)
 *   ctx (all optional) = { engine, npcId, channel, line, runId, toasts }
 *       engine   the calling story's InkEngine (a bound external, a runner's
 *                engine): written with its observer detached, and the base value
 *                of a delta is read from it (spike F1)
 *       npcId    the channel NPC the write came from (used for channel and events)
 *       channel  'person' | 'phone' | 'email' (else derived from npcId or the open chat)
 *       line     an utterance or line id carried on the entry
 *       toasts   an array: toast effects are pushed here instead of shown (ui-less runs)
 *   addInfluence(id, delta, reason, ctx) -> { value, previous, delta, band, crossed, rearmed } | null
 *   setInfluence(id, value, reason, ctx) -> same (absolute set, for #influence:N)
 *   seInfluence(delta, reason, ctx)      -> band (number). ctx needs npcId (or
 *       characterId). Ledgered when ctx.runId is given (00 §8 "Idempotency"):
 *       keyed (runId, turn, 'se_influence', ordinal within the turn). For a
 *       non-social NPC it writes nothing and returns 0.
 *   makeSeInfluenceExternal(ctx) -> function(delta, reason) for BindExternalFunction
 *   bindInfluenceExternals(engine, ctx) binds 'se_influence' on an InkEngine
 *       (or bare Story); ctx.engine is set to that engine
 *   report(id, reason, ctx) -> { reported, alreadyLatched?, band }
 *       Forced report: runs the effects of the threshold whose id is 'reports',
 *       latches it and records the reason. Influence is not changed. No
 *       'reports' threshold: { reported: false }. Already latched: effects are
 *       not run again.
 *
 * Service: lockout (storage only; the channel checks are Phase 4, S10)
 *   getLockoutState(id) -> { active, until, channel, remainingMs }   (lifts first if due)
 *   checkLockout(id) -> true when it lifted
 *   checkAllLockouts()
 *   liftLockout(id)   writes recoverTo silently, clears the latch and band
 *                     flags, zeroes <character>_lockout_until / _lockout_channel
 *
 * Service: idempotency ledger (per run; a run is one open conversation or one
 * mail delivery, runId = msgId)
 *   beginRun(runId)        fresh ledger, turn 0
 *   advanceTurn(runId)     call on each ChooseChoiceIndex
 *   rewindTurn(runId)      reset this turn's ordinals before replaying it, so a
 *                          re-run returns the stored results
 *   trackTurns(engine, runId) -> undo()   wraps the story's ChooseChoiceIndex
 *   endRun(runId)
 *   ledgerCall(runId, fnName, idOrNull, compute) -> stored or fresh result;
 *       no runId means no ledger (compute runs)
 *
 * Events emitted
 *   global_variable_changed:<name>   by the writer, change only, after the
 *                                    whole change is settled
 *   npc_influence_changed  { character, npcId, global, value, previous, delta,
 *                            reason, line, entries[], band, crossed[], rearmed[],
 *                            silent }  once per change (not for a no-op)
 *   npc_reported           { character, npcId, reason, band }   on a forced report
 *   social_conversation_ended { character, npcId, line }   before the default close
 *   npc_became_hostile     { npcId }   from a combatHostile effect (as #hostile)
 *
 * Rules as implemented (00 §8)
 *   - `when` defaults to "below" when at < 0, "above" otherwise. Equality counts.
 *   - A threshold fires when it is not latched, the new value is at or past `at`
 *     and the previous value was not. It re-arms (leaves the latch) when the
 *     value reaches at + rearmMargin (at - rearmMargin for "above").
 *   - Several thresholds crossed in one move fire in the order the value passes them.
 *   - Order inside one change: clamp, latch, band flags, effects, then the
 *     global events, then npc_influence_changed.
 *   - Band flags (boolean setGlobal with clearOnRearm) are recomputed on every
 *     change: set at or past `at`, cleared to the declared default at the re-arm
 *     point, left alone between.
 *   - The lockout lift and its recoverTo write run no effects and no toasts;
 *     they do emit the change-only global events so the bar can redraw.
 *   - Lockout storage: <character>_lockout_until = absolute elapsed ms, -1 for
 *     until.global and also for a permanent (null) lockout, 0 none;
 *     <character>_lockout_channel = person | phone | email | all | "".
 *   - An ink write that overshoots min/max is clamped and the clamped value is
 *     written back (gameState, cached stories and the open chat's story).
 *   - mirrorToBehavior: true copies the value to the person channel's behaviour
 *     state (behavior.influence) without the legacy auto-hostile check.
 */

import { writeGlobal, readGlobal, getOpenChat, emitGlobalEvents } from './global-writer.js';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const LOG_LIMIT = 100;

let current = null;

// ------------------------------------------------------------------ display (README AA)

const DISPLAY_KEYS = ['bar', 'number', 'pip'];

export function resolveInfluenceDisplay(scenario, characterId) {
    const character = scenario?.social?.characters?.[characterId];
    if (!isObject(character)) return { bar: false, number: false, pip: false };
    const out = { bar: true, number: true, pip: true };
    for (const layer of [scenario.social.influenceDisplay, character.influence?.display]) {
        if (!isObject(layer)) continue;
        for (const key of DISPLAY_KEYS) {
            if (typeof layer[key] === 'boolean') out[key] = layer[key];
        }
    }
    if (!out.bar) out.number = false;
    return out;
}

// ------------------------------------------------------------------ bands

function thresholdRank(t) {
    switch (t.id) {
        case 'wary': return 1;
        case 'refuses': return 2;
        case 'reports': return 3;
        case 'lockout': return 4;
        default:
            return t.effects.some(e => e?.type === 'lockout') ? 4 : 0;
    }
}

export function bandForLatched(thresholds, latchedIds) {
    const latched = new Set(latchedIds || []);
    let band = 0;
    for (const t of thresholds || []) {
        if (latched.has(t.id)) band = Math.max(band, thresholdRank(t));
    }
    return band;
}

// ------------------------------------------------------------------ config

function normaliseCharacter(id, raw, scenario) {
    const influence = isObject(raw.influence) ? raw.influence : {};
    const global = typeof influence.global === 'string' && influence.global ? influence.global : `${id}_influence`;
    const declared = scenario?.globalVariables || {};
    const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    const start = num(influence.start, num(declared[global], 0));
    const thresholds = (Array.isArray(raw.thresholds) ? raw.thresholds : [])
        .filter(t => isObject(t) && typeof t.id === 'string' && typeof t.at === 'number')
        .map(t => ({
            id: t.id,
            at: t.at,
            when: t.when === 'above' || t.when === 'below' ? t.when : (t.at < 0 ? 'below' : 'above'),
            icon: t.icon ?? null,
            effects: Array.isArray(t.effects) ? t.effects.filter(isObject) : []
        }));
    return {
        id,
        displayName: raw.displayName || id,
        channels: isObject(raw.channels) ? { ...raw.channels } : {},
        global,
        min: num(influence.min, -100),
        max: num(influence.max, 100),
        start,
        rearmMargin: num(influence.rearmMargin, 10),
        thresholds,
        mirrorToBehavior: raw.mirrorToBehavior === true,
        latchedGlobal: `${id}_latched`,
        lockoutUntilGlobal: `${id}_lockout_until`,
        lockoutChannelGlobal: `${id}_lockout_channel`
    };
}

const past = (t, v) => (t.when === 'below' ? v <= t.at : v >= t.at);
const rearmedAt = (t, v, margin) => (t.when === 'below' ? v >= t.at + margin : v <= t.at - margin);
const isBandFlag = (e) => e.type === 'setGlobal' && e.clearOnRearm === true && typeof e.value === 'boolean';

// ------------------------------------------------------------------ service

class SocialInfluenceService {
    constructor(scenario, dispatcher, hooks = {}) {
        this.scenario = scenario;
        this.dispatcher = dispatcher;
        this.hooks = hooks;
        this.characters = new Map();
        this.npcToCharacter = new Map(); // channel npc id -> { characterId, channel }
        this.lastSeen = new Map();
        this.logs = new Map();
        this.reports = new Map();
        this.runs = new Map();
        this.listeners = [];
        this.pendingEvents = [];

        for (const [id, raw] of Object.entries(scenario.social.characters)) {
            if (!isObject(raw)) continue;
            const config = normaliseCharacter(id, raw, scenario);
            this.characters.set(id, config);
            for (const [channel, npcId] of Object.entries(config.channels)) {
                if (typeof npcId === 'string' && npcId && !this.npcToCharacter.has(npcId)) {
                    this.npcToCharacter.set(npcId, { characterId: id, channel });
                }
            }
        }

        for (const config of this.characters.values()) {
            this.lastSeen.set(config.id, this.getInfluence(config.id));
            this._on(`global_variable_changed:${config.global}`, (data) => this._onInfluenceEvent(config, data));
            const liftGlobals = new Set(
                config.thresholds.flatMap(t => t.effects)
                    .filter(e => e.type === 'lockout' && isObject(e.until) && typeof e.until.global === 'string')
                    .map(e => e.until.global));
            for (const name of liftGlobals) {
                this._on(`global_variable_changed:${name}`, () => this.checkLockout(config.id));
            }
        }
    }

    _on(event, cb) {
        if (!this.dispatcher?.on) return;
        this.dispatcher.on(event, cb);
        this.listeners.push([event, cb]);
    }

    uninstall() {
        for (const [event, cb] of this.listeners) this.dispatcher?.off?.(event, cb);
        this.listeners = [];
    }

    // -------------------------------------------------------------- lookup

    resolveCharacter(id) {
        if (typeof id !== 'string' || !id) return null;
        if (this.characters.has(id)) return { characterId: id, channel: null };
        return this.npcToCharacter.get(id) || null;
    }

    isSocialCharacter(id) {
        return this.resolveCharacter(id) !== null;
    }

    getCharacterConfig(id) {
        const hit = this.resolveCharacter(id);
        return hit ? this.characters.get(hit.characterId) : null;
    }

    _globals() {
        return (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
    }

    getInfluence(id) {
        const config = this.getCharacterConfig(id);
        if (!config) return undefined;
        const v = this._globals()?.[config.global];
        return (typeof v === 'number' && Number.isFinite(v)) ? v : config.start;
    }

    getLatched(id) {
        const config = this.getCharacterConfig(id);
        if (!config) return [];
        const raw = this._globals()?.[config.latchedGlobal];
        return (typeof raw === 'string' && raw) ? raw.split(',').filter(Boolean) : [];
    }

    getBand(id) {
        const config = this.getCharacterConfig(id);
        return config ? bandForLatched(config.thresholds, this.getLatched(config.id)) : 0;
    }

    getLog(id) {
        const config = this.getCharacterConfig(id);
        return config ? [...(this.logs.get(config.id) || [])] : [];
    }

    getLastReport(id) {
        const config = this.getCharacterConfig(id);
        return config ? (this.reports.get(config.id) || null) : null;
    }

    _now() {
        if (typeof this.hooks.now === 'function') return this.hooks.now();
        const clock = (typeof window !== 'undefined') ? window.gameClock : null;
        if (clock?.elapsedMs) return clock.elapsedMs();
        console.warn('⚠️ [socialInfluence] No gameClock: lockout deadlines use Date.now()');
        return Date.now();
    }

    _channelFor(config, ctx) {
        if (ctx?.channel) return ctx.channel;
        const fromNpc = (npcId) => {
            const hit = this.npcToCharacter.get(npcId);
            return hit && hit.characterId === config.id ? hit.channel : null;
        };
        return (ctx?.npcId && fromNpc(ctx.npcId)) || fromNpc(getOpenChat()?.npcId) || null;
    }

    // -------------------------------------------------------------- writing

    /** Write one global through the shared writer, holding its events back. */
    _write(name, value, ctx, extra = {}) {
        const manager = (typeof window !== 'undefined') ? window.npcConversationStateManager : null;
        if (manager?.isReadOnlyGlobal?.(name)) {
            console.warn(`⚠️ [socialInfluence] ${name} is an imported read-only global; not written`);
            return null;
        }
        const result = writeGlobal(name, value, { engine: ctx?.engine || null, deferEmit: true, ...extra });
        this.pendingEvents.push(...result.events);
        return result;
    }

    _flush() {
        const events = this.pendingEvents;
        this.pendingEvents = [];
        emitGlobalEvents(events);
    }

    _emit(event, data) {
        this.dispatcher?.emit?.(event, data);
    }

    _declaredDefault(name, value) {
        const declared = this.scenario?.globalVariables;
        if (declared && Object.prototype.hasOwnProperty.call(declared, name)) return declared[name];
        return typeof value === 'boolean' ? !value : null;
    }

    _writeLatch(config, ids, ctx) {
        const next = [...new Set(ids)].join(',');
        const prev = this._globals()?.[config.latchedGlobal];
        if ((prev ?? '') !== next) this._write(config.latchedGlobal, next, ctx);
    }

    _recomputeBandFlags(config, value, ctx) {
        for (const t of config.thresholds) {
            for (const e of t.effects) {
                if (!isBandFlag(e) || typeof e.global !== 'string') continue;
                if (past(t, value)) this._write(e.global, e.value, ctx);
                else if (rearmedAt(t, value, config.rearmMargin)) this._write(e.global, this._declaredDefault(e.global, e.value), ctx);
            }
        }
    }

    _log(config, entry) {
        const list = this.logs.get(config.id) || [];
        list.push(entry);
        if (list.length > LOG_LIMIT) list.splice(0, list.length - LOG_LIMIT);
        this.logs.set(config.id, list);
    }

    _mirror(config, value) {
        if (!config.mirrorToBehavior) return;
        const npcId = config.channels.person;
        const behavior = npcId ? window.npcBehaviorManager?.getBehavior?.(npcId) : null;
        if (behavior) behavior.influence = value;
    }

    /**
     * Settle one change from `previous` to `value` (already clamped and already
     * written). Runs thresholds, latch, band flags and effects unless silent.
     */
    _commit(config, previous, value, entries, ctx, { silent = false } = {}) {
        this.lastSeen.set(config.id, value);
        const at = this._now();
        for (const e of entries) this._log(config, { ...e, value, previous, at, kind: silent ? 'silent' : 'change' });
        this._mirror(config, value);

        const crossed = [];
        const rearmed = [];
        const fire = [];
        if (silent) {
            this._writeLatch(config, [], ctx);
        } else {
            const latched = new Set(this.getLatched(config.id));
            for (const t of config.thresholds) {
                if (latched.has(t.id)) {
                    if (rearmedAt(t, value, config.rearmMargin)) { latched.delete(t.id); rearmed.push(t.id); }
                } else if (past(t, value) && !past(t, previous)) {
                    latched.add(t.id);
                    fire.push(t);
                }
            }
            // in the order the value passes them
            fire.sort((a, b) => (value < previous ? b.at - a.at : a.at - b.at));
            crossed.push(...fire.map(t => t.id));
            this._writeLatch(config, [...latched], ctx);
        }
        this._recomputeBandFlags(config, value, ctx);
        for (const t of fire) this._runEffects(config, t, ctx);
        this._flush();

        const last = entries[entries.length - 1] || {};
        const band = this.getBand(config.id);
        if (previous !== value || crossed.length || rearmed.length) {
            this._emit('npc_influence_changed', {
                character: config.id,
                npcId: ctx?.npcId ?? null,
                global: config.global,
                value,
                previous,
                delta: value - previous,
                reason: last.reason ?? null,
                line: last.line ?? null,
                entries,
                band,
                crossed,
                rearmed,
                silent
            });
        }
        return { value, previous, delta: value - previous, band, crossed, rearmed };
    }

    _clamp(config, v) {
        return Math.min(config.max, Math.max(config.min, v));
    }

    /** The watcher: any writer's change to the influence global. */
    _onInfluenceEvent(config, data) {
        const raw = Number(data?.value);
        if (!Number.isFinite(raw)) return;
        const previous = this.lastSeen.get(config.id);
        if (raw === previous) return; // the service's own write, or no change
        const open = getOpenChat();
        const ctx = { engine: open?.engine || null, npcId: this.npcToCharacter.get(open?.npcId)?.characterId === config.id ? open.npcId : null };
        const value = this._clamp(config, raw);
        if (value !== raw) this._write(config.global, value, ctx, { clamp: { min: config.min, max: config.max } });
        if (value === previous) { this._flush(); return; }
        this._commit(config, previous, value, [{ delta: value - previous, reason: 'ink', line: null }], ctx);
    }

    _engineWrite(config, valueFn, reason, ctx) {
        const previous = this.lastSeen.get(config.id);
        const base = Number(readGlobal(config.global, { engine: ctx?.engine || null }));
        const result = this._write(config.global, valueFn, ctx, { clamp: { min: config.min, max: config.max } });
        if (!result) return null;
        const value = result.value;
        const entries = [];
        // An ink assignment earlier in the same Continue() has not reached the
        // watcher yet (spike F1): record it as its own entry.
        if (Number.isFinite(base) && base !== previous) entries.push({ delta: base - previous, reason: 'ink', line: null });
        const from = (Number.isFinite(base) && base !== previous) ? base : previous;
        entries.push({ delta: value - from, reason: reason ?? null, line: ctx?.line ?? null });
        return this._commit(config, previous, value, entries, ctx);
    }

    addInfluence(id, delta, reason = null, ctx = {}) {
        const config = this.getCharacterConfig(id);
        const d = Number(delta);
        if (!config || !Number.isFinite(d)) return null;
        return this._engineWrite(config, (v) => (Number.isFinite(Number(v)) ? Number(v) : config.start) + d, reason, ctx);
    }

    setInfluence(id, value, reason = null, ctx = {}) {
        const config = this.getCharacterConfig(id);
        const v = Number(value);
        if (!config || !Number.isFinite(v)) return null;
        return this._engineWrite(config, v, reason, ctx);
    }

    seInfluence(delta, reason = null, ctx = {}) {
        const config = this.getCharacterConfig(ctx.characterId || ctx.npcId);
        if (!config) return 0;
        return this.ledgerCall(ctx.runId, 'se_influence', null, () => {
            const r = this.addInfluence(config.id, delta, reason, ctx);
            return r ? r.band : this.getBand(config.id);
        });
    }

    makeSeInfluenceExternal(ctx = {}) {
        return (delta, reason) => this.seInfluence(delta, reason, ctx);
    }

    bindInfluenceExternals(engine, ctx = {}) {
        const fn = this.makeSeInfluenceExternal({ ...ctx, engine });
        if (typeof engine?.bindExternalFunction === 'function') engine.bindExternalFunction('se_influence', fn);
        else engine?.BindExternalFunction?.('se_influence', fn);
    }

    // -------------------------------------------------------------- effects

    _runEffects(config, threshold, ctx) {
        for (const effect of threshold.effects) {
            try {
                this._runEffect(config, threshold, effect, ctx);
            } catch (e) {
                console.warn(`⚠️ [socialInfluence] ${config.id}/${threshold.id} effect ${effect.type} failed:`, e.message);
            }
        }
    }

    _runEffect(config, threshold, effect, ctx) {
        switch (effect.type) {
            case 'setGlobal':
                if (typeof effect.global === 'string' && effect.global) this._write(effect.global, effect.value, ctx);
                break;
            case 'endConversation':
                this._endConversation(config, ctx);
                break;
            case 'lockout':
                this._startLockout(config, effect, ctx);
                break;
            case 'combatHostile': {
                const npcId = config.channels.person || ctx?.npcId;
                if (!npcId) break;
                if (typeof this.hooks.setHostile === 'function') this.hooks.setHostile(npcId, { character: config.id, threshold: threshold.id });
                else if (window.npcHostileSystem) {
                    window.npcHostileSystem.setNPCHostile(npcId, true);
                    this._emit('npc_became_hostile', { npcId });
                }
                break;
            }
            case 'toast':
                if (typeof effect.text !== 'string' || !effect.text) break;
                if (Array.isArray(ctx?.toasts)) ctx.toasts.push({ text: effect.text, character: config.id });
                else if (typeof this.hooks.toast === 'function') this.hooks.toast(effect.text, { character: config.id, threshold: threshold.id });
                else window.gameAlert?.(effect.text, 'info', config.displayName, 4000);
                break;
            default:
                console.warn(`⚠️ [socialInfluence] Unknown effect type ${effect.type} on ${config.id}/${threshold.id}`);
        }
    }

    _reportedLine(config) {
        const calls = this.scenario?.social?.pretextNpcs;
        const call = Array.isArray(calls) ? calls.find(c => c?.character === config.id) : null;
        return call?.outcomes?.reported?.line || null;
    }

    _endConversation(config, ctx) {
        const open = getOpenChat();
        const npcId = (open && this.npcToCharacter.get(open.npcId)?.characterId === config.id) ? open.npcId : (ctx?.npcId || null);
        const info = { character: config.id, npcId, line: this._reportedLine(config) };
        if (typeof this.hooks.endConversation === 'function') { this.hooks.endConversation(info); return; }
        this._emit('social_conversation_ended', info);
        if (!open || open.npcId !== npcId) return;
        // Deferred: this can run inside Continue() (a bound external) or an observer.
        const minigame = window.MinigameFramework?.currentMinigame;
        setTimeout(() => {
            if (window.MinigameFramework?.currentMinigame !== minigame) return;
            if (info.line) window.gameAlert?.(info.line, 'warning', config.displayName, 5000);
            if (typeof minigame.endConversation === 'function') minigame.endConversation();
            else if (typeof minigame.closeConversation === 'function') minigame.closeConversation();
            else minigame.complete?.(false);
        }, 0);
    }

    _startLockout(config, effect, ctx) {
        const until = effect.until;
        let untilValue = -1; // until.global, or permanent (null)
        if (isObject(until) && typeof until.afterMinutes === 'number') {
            untilValue = Math.round(this._now() + until.afterMinutes * 60000);
            if (untilValue <= 0) untilValue = 1;
        }
        const channel = effect.scope === 'character' ? 'all' : (this._channelFor(config, ctx) || 'all');
        this._write(config.lockoutUntilGlobal, untilValue, ctx);
        this._write(config.lockoutChannelGlobal, channel, ctx);
    }

    _lockoutEffects(config) {
        return config.thresholds.flatMap(t => t.effects).filter(e => e.type === 'lockout');
    }

    getLockoutState(id) {
        const config = this.getCharacterConfig(id);
        if (!config) return { active: false, until: 0, channel: '', remainingMs: 0 };
        this.checkLockout(config.id);
        const g = this._globals() || {};
        const until = Number(g[config.lockoutUntilGlobal]) || 0;
        const channel = typeof g[config.lockoutChannelGlobal] === 'string' ? g[config.lockoutChannelGlobal] : '';
        return {
            active: until !== 0,
            until,
            channel,
            remainingMs: until > 0 ? Math.max(0, until - this._now()) : (until === -1 ? Infinity : 0)
        };
    }

    checkLockout(id) {
        const config = this.getCharacterConfig(id);
        if (!config) return false;
        const g = this._globals() || {};
        const until = Number(g[config.lockoutUntilGlobal]) || 0;
        if (until === 0) return false;
        let due = false;
        if (until > 0) due = this._now() >= until;
        else due = this._lockoutEffects(config).some(e => isObject(e.until) && typeof e.until.global === 'string' && !!g[e.until.global]);
        if (due) this.liftLockout(config.id);
        return due;
    }

    checkAllLockouts() {
        for (const id of this.characters.keys()) this.checkLockout(id);
    }

    liftLockout(id, ctx = {}) {
        const config = this.getCharacterConfig(id);
        if (!config) return null;
        const g = this._globals() || {};
        const until = Number(g[config.lockoutUntilGlobal]) || 0;
        const effects = this._lockoutEffects(config);
        const effect = (until > 0 ? effects.find(e => isObject(e.until) && typeof e.until.afterMinutes === 'number') : null)
            || (until === -1 ? effects.find(e => isObject(e.until) && typeof e.until.global === 'string' && !!g[e.until.global]) : null)
            || effects[0] || {};
        const target = this._clamp(config, typeof effect.recoverTo === 'number' ? effect.recoverTo : config.start);
        const previous = this.lastSeen.get(config.id);
        this._write(config.global, target, ctx, { clamp: { min: config.min, max: config.max } });
        this._write(config.lockoutUntilGlobal, 0, ctx);
        this._write(config.lockoutChannelGlobal, '', ctx);
        return this._commit(config, previous, target, [{ delta: target - previous, reason: 'lockout_lift', line: null }], ctx, { silent: true });
    }

    // -------------------------------------------------------------- forced report

    report(id, reason = null, ctx = {}) {
        const config = this.getCharacterConfig(id);
        if (!config) return { reported: false, band: 0 };
        const threshold = config.thresholds.find(t => t.id === 'reports');
        if (!threshold) {
            console.warn(`⚠️ [socialInfluence] ${config.id} has no 'reports' threshold; report(${reason}) ignored`);
            return { reported: false, band: this.getBand(config.id) };
        }
        const latched = this.getLatched(config.id);
        if (latched.includes('reports')) return { reported: true, alreadyLatched: true, band: this.getBand(config.id) };
        this._writeLatch(config, [...latched, 'reports'], ctx);
        const at = this._now();
        this.reports.set(config.id, { reason, at });
        const value = this.lastSeen.get(config.id);
        this._log(config, { delta: 0, reason, line: ctx?.line ?? null, value, previous: value, at, kind: 'report' });
        this._runEffects(config, threshold, ctx);
        this._flush();
        const band = this.getBand(config.id);
        this._emit('npc_reported', { character: config.id, npcId: ctx?.npcId ?? null, reason, band });
        return { reported: true, band };
    }

    // -------------------------------------------------------------- ledger

    beginRun(runId) {
        if (runId === undefined || runId === null) return;
        this.runs.set(runId, { turn: 0, results: new Map(), ordinals: new Map() });
    }

    _run(runId) {
        if (!this.runs.has(runId)) this.beginRun(runId);
        return this.runs.get(runId);
    }

    advanceTurn(runId) {
        if (runId === undefined || runId === null) return;
        const run = this._run(runId);
        run.turn += 1;
        run.ordinals = new Map();
    }

    rewindTurn(runId) {
        if (runId === undefined || runId === null) return;
        this._run(runId).ordinals = new Map();
    }

    endRun(runId) {
        this.runs.delete(runId);
    }

    trackTurns(engine, runId) {
        const story = engine?.variablesState ? engine : engine?.story;
        if (!story || typeof story.ChooseChoiceIndex !== 'function') return () => {};
        const original = story.ChooseChoiceIndex;
        const self = this;
        story.ChooseChoiceIndex = function (...args) {
            self.advanceTurn(runId);
            return original.apply(this, args);
        };
        return () => { story.ChooseChoiceIndex = original; };
    }

    ledgerCall(runId, fnName, id, compute) {
        if (runId === undefined || runId === null) return compute();
        const run = this._run(runId);
        let key;
        if (id === undefined || id === null) {
            const ordinal = run.ordinals.get(fnName) || 0;
            run.ordinals.set(fnName, ordinal + 1);
            key = `${run.turn}|${fnName}|#${ordinal}`;
        } else {
            key = `${run.turn}|${fnName}|=${id}`;
        }
        if (run.results.has(key)) return run.results.get(key);
        const result = compute();
        run.results.set(key, result);
        return result;
    }
}

// ------------------------------------------------------------------ install

export function installSocialInfluence({ scenario, dispatcher, hooks } = {}) {
    const win = (typeof window !== 'undefined') ? window : {};
    const s = scenario ?? win.gameScenario;
    uninstallSocialInfluence();
    if (!isObject(s?.social?.characters) || Object.keys(s.social.characters).length === 0) return null;
    current = new SocialInfluenceService(s, dispatcher ?? win.eventDispatcher, hooks || {});
    if (typeof window !== 'undefined') window.socialInfluence = current;
    return current;
}

export function getSocialInfluence() {
    return current;
}

export function uninstallSocialInfluence() {
    if (!current) return;
    current.uninstall();
    if (typeof window !== 'undefined' && window.socialInfluence === current) delete window.socialInfluence;
    current = null;
}

export default installSocialInfluence;
