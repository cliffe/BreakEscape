/**
 * Voiced office chatter and scripted exchanges (OFFICE_LIFE_PLAN 11, slice 15).
 *
 * npc-needs.js decides who says what and when (bag, cooldown, speech lock, exchanges, all on the
 * needs clock). This module is its live adapter for the two things that need the browser:
 *
 *   exchangeLines(ownerId, knot)  runs an exchange knot on a SEPARATE ink story instance built from
 *                                 the owner's compiled story JSON. The NPC's own conversation engine
 *                                 and its saved state (npcConversationStateManager) are never read
 *                                 or written. Returns [{ speakerId, text }] or null while the story
 *                                 JSON is still loading (the first call starts the load).
 *   say(npcId, line, info)        speaks a line in that NPC's voice through its own TTSManager:
 *                                 only an NPC with a voice, in the player's room or the next room
 *                                 through an OPEN door (x0.4), quieter with distance down to a floor
 *                                 (chatterVolume, D34), the volume passed to the TTS manager and
 *                                 followed while the line plays, one line at a time (an audio
 *                                 queue, on top of the needs system's speech lock, because real clips
 *                                 can outrun the bubble). Muted when barks' sound is off. The bubble
 *                                 is the subtitle, so a missing clip (a keyless server's 503) changes
 *                                 nothing on screen.
 *   setGlobal(name, value)        writes heard_<knot> through the shared global writer, so it reaches
 *                                 gameState (saved by the next sync) and every declaring story.
 *
 * Speakers: a line "Rosa: Text" is spoken by the NPC whose id or displayName is "Rosa"
 * (case-insensitive; "npc" is the owner), the rule the server's TtsLineExtractor uses to accept a
 * co-speaker's line. A line with no prefix belongs to the owner, or to a `# speaker:npc:<id>` tag.
 * What is sent to /tts is the text after the prefix.
 */
import { openDoorHearing, chatterVolume, conversationOpen, CHATTER_FAR } from './room-hearing.js';

const win = () => (typeof window !== 'undefined' ? window : {});
const STALE_MS = 8000;   // a queued line that waited longer than this is dropped, not spoken late
const LOG_CAP = 100;
const VOLUME_TICK_MS = 250;   // while a line plays, its volume follows the player (D34)
const FADE_MS = 300;          // a faint line given way to a full one fades out over this long
const BARK_DUCK = 0.25;       // a faint line under a scripted bark plays at this share of its volume

/** Pure: "Name: text" as [name, text]; [null, line] without a prefix (InkLineWalker.split_prefix). */
export function splitPrefix(line) {
    const m = /^([^:\n]+?):\s+(\S[\s\S]*)$/.exec(String(line || '').trim());
    return m ? [m[1].trim(), m[2].trim()] : [null, String(line || '').trim()];
}

/** Pure: the NPC id a prefix names: an id or displayName, case-insensitive; "npc" is the owner. */
export function speakerFor(prefix, ownerId, npcs) {
    const want = String(prefix || '').trim().toLowerCase();
    if (!want) return null;
    if (want === 'npc') return ownerId;
    for (const n of npcs) {
        if (!n || !n.id) continue;
        if (String(n.id).toLowerCase() === want) return n.id;
        if (n.displayName && String(n.displayName).toLowerCase() === want) return n.id;
    }
    return null;
}

/**
 * Run one knot to its end on the given (separate) inkjs Story and return its lines with speakers.
 * Choices end the run (an exchange has none). Unknown speakers come back as null speakerId so the
 * needs system refuses the exchange instead of voicing a line as the wrong person.
 */
export function exchangeLinesFromStory(story, knot, ownerId, npcs) {
    story.ChoosePathString(knot);
    const out = [];
    let guard = 0;
    while (story.canContinue && guard++ < 200) {
        const raw = story.Continue();
        const tags = story.currentTags || [];
        const text = String(raw || '').trim();
        if (!text) continue;
        const [prefix, body] = splitPrefix(text);
        let speakerId = prefix ? speakerFor(prefix, ownerId, npcs) : null;
        if (!prefix) {
            speakerId = ownerId;
            for (const t of [...tags].reverse()) {
                const m = /^\s*speaker\s*:\s*npc\s*:\s*(\S+)\s*$/i.exec(t);
                if (m) { speakerId = m[1]; break; }
            }
        }
        out.push({ speakerId, text: prefix && speakerId ? body : text });
    }
    return out;
}

/** Copy the scenario's globals the story declares into it (so an exchange can branch on them). */
export function syncGlobalsInto(story, globals) {
    const declared = story?.variablesState?._defaultGlobalVariables;
    if (!declared || !globals) return;
    for (const [name, value] of Object.entries(globals)) {
        if (!declared.has(name) || value === undefined || value === null) continue;
        try { story.variablesState.$(name, value); } catch (e) { /* type mismatch: keep the ink default */ }
    }
}

export class NpcChatterVoice {
    /**
     * @param {Object} [deps] injectable for tests: { inkjs, getNpc, allNpcs, storyJson(npc) -> json|null,
     *   loadStory(npc) -> Promise<json>, globals() -> object, writeGlobal(name, value), makeTts(),
     *   playerRoom(), npcRoom(id), distance(id), muted(), now() }
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.json = new Map();       // ownerId -> compiled story JSON
        this.loading = new Map();    // ownerId -> Promise
        this.tts = new Map();        // npcId -> TTSManager
        this.queue = Promise.resolve();
        this.gen = new Map();        // npcId -> cancel generation (slice 19: a hung-up call)
        this.current = null;         // { npcId, mgr, done } while a clip plays
        this.log = [];               // { at, npcId, text, spoken, reason } for tests and live proof
    }

    _npc(id) {
        if (this.deps.getNpc) return this.deps.getNpc(id);
        return win().npcManager?.getNPC?.(id) || null;
    }

    _allNpcs() {
        if (this.deps.allNpcs) return this.deps.allNpcs();
        const m = win().npcManager?.npcs;
        return m ? [...m.values()] : [];
    }

    _storyJson(npc) {
        if (this.json.has(npc.id)) return this.json.get(npc.id);
        const j = this.deps.storyJson ? this.deps.storyJson(npc)
            : (npc.storyPath && win().npcManager?.storyCache?.get?.(npc.storyPath)) || npc.storyJSON || null;
        if (j) this.json.set(npc.id, j);
        return j || null;
    }

    _load(npc) {
        if (this.loading.has(npc.id)) return this.loading.get(npc.id);
        const p = (async () => {
            let j = null;
            if (this.deps.loadStory) j = await this.deps.loadStory(npc);
            else {
                const gameId = win().breakEscapeConfig?.gameId;
                if (gameId && typeof fetch !== 'undefined') {
                    const resp = await fetch(`/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(npc.id)}`);
                    if (resp.ok) j = await resp.json();
                }
            }
            if (j) this.json.set(npc.id, j);
            return j;
        })().catch(() => null);
        this.loading.set(npc.id, p);
        return p;
    }

    /** Start loading the stories of every NPC that declares exchanges or desk-phone calls (slice 19). */
    preload() {
        for (const npc of this._allNpcs()) {
            const has = k => Array.isArray(npc?.[k]) && npc[k].length;
            if ((has('exchanges') || has('phoneCalls')) && !this._storyJson(npc)) this._load(npc);
        }
    }

    /** Slice 19: start loading one NPC's story if it has phoneCalls (a phone just started ringing). */
    warm(npcId) {
        const npc = this._npc(npcId);
        if (npc && Array.isArray(npc.phoneCalls) && npc.phoneCalls.length && !this._storyJson(npc)) this._load(npc);
    }

    /**
     * Slice 19: a call hung up. Stops this NPC's clip in flight (and ends its wait, so later lines
     * from anyone do not wait out the cancelled clip) and skips its queued lines.
     */
    cancel(npcId) {
        this.gen.set(npcId, (this.gen.get(npcId) || 0) + 1);
        const cur = this.current;
        if (cur && cur.npcId === npcId) {
            try { cur.mgr?.stop?.(); } catch (e) { /* already stopped */ }
            cur.done?.();
            this._note({ at: this.deps.now ? this.deps.now() : Date.now(), npcId, text: cur.text, spoken: false, reason: 'cancelled' });
        }
    }

    exchangeLines(ownerId, knot) {
        const npc = this._npc(ownerId);
        if (!npc) return null;
        const json = this._storyJson(npc);
        if (!json) { this._load(npc); return null; }
        const ink = this.deps.inkjs || win().inkjs;
        if (!ink?.Story) return null;
        try {
            // A fresh instance every time: never the NPC's conversation engine or its saved state
            const story = new ink.Story(typeof json === 'string' ? json : JSON.stringify(json));
            syncGlobalsInto(story, this.deps.globals ? this.deps.globals() : win().gameState?.globalVariables);
            return exchangeLinesFromStory(story, knot, ownerId, this._allNpcs());
        } catch (e) {
            console.warn(`[chatter] exchange ${ownerId}/${knot} failed`, e?.message || e);
            return [];
        }
    }

    setGlobal(name, value) {
        if (this.deps.writeGlobal) { this.deps.writeGlobal(name, value); return; }
        if (this._writeGlobal) { this._writeGlobal(name, value); return; }
        const g = win().gameState?.globalVariables;
        if (g) g[name] = value;
        win().eventDispatcher?.emit?.(`global_variable_changed:${name}`, { name, value });
    }

    _muted() {
        if (this.deps.muted) return this.deps.muted();
        return win().npcBarkSystem?.soundEnabled === false;
    }

    /** Is a person-chat or phone-chat open? Chatter is silent for the whole of it. */
    conversationOpen() {
        if (this.deps.conversation) return !!this.deps.conversation();
        return conversationOpen(win());
    }

    /** Is a scripted bark's voice playing now? A faint line ducks under it. */
    _barkPlaying() {
        if (this.deps.barkPlaying) return !!this.deps.barkPlaying();
        const bs = win().barkSystem;
        if (!bs?.ttsManagers || !bs._voicePlaying) return false;
        for (const m of bs.ttsManagers.values()) { if (bs._voicePlaying(m)) return true; }
        return false;
    }

    /**
     * D34 (a): the volume a FAINT ambient line would have now, or 0 if none can be voiced: the NPC
     * has a voice, sound is on, no conversation is open, it is in the player's room or the next room
     * through an open door, and within the far radius (the falloff range). The needs system asks
     * before it draws a line from the bag for a turn the player cannot hear in full.
     */
    faintVolume(npcId) {
        const npc = this._npc(npcId);
        if (!npc || !npc.voice || this._muted() || this.conversationOpen()) return 0;
        if (!(this._hearing(npcId) > 0)) return 0;
        const d = this._distance(npcId);
        if (Number.isFinite(d) && d > CHATTER_FAR) return 0;
        return this._volumeFor(npcId);
    }

    /**
     * A full line, a scripted bark or a conversation needs the voice: a faint line playing (or still
     * loading) fades out over FADE_MS and ends, so the next line does not wait behind it.
     */
    fadeFaint() {
        if (this._faintTok) this._faintTok.abort = true;
        const cur = this.current;
        if (!cur || !cur.faint || cur.fading) return false;
        cur.fading = true;
        try { cur.mgr?.setDistanceGain?.(0); } catch (e) { /* ok */ }
        this._note({ at: this.deps.now ? this.deps.now() : Date.now(), npcId: cur.npcId, text: cur.text, spoken: false, reason: 'preempted' });
        setTimeout(() => {
            if (this.current !== cur) return;
            try { cur.mgr?.stop?.(); } catch (e) { /* already stopped */ }
            cur.done?.();
        }, FADE_MS);
        return true;
    }

    /** The hearing factor: 1 in the player's room, 0.4 through an open door, 0 otherwise (shut door, a wall). */
    _hearing(npcId) {
        if (this.deps.hearing) return this.deps.hearing(npcId);
        if (this.deps.npcRoom) {
            const nr = this.deps.npcRoom(npcId), pr = this.deps.playerRoom?.();
            return this.deps.doorHearing ? this.deps.doorHearing(nr, pr) : (nr === pr ? 1 : 0);
        }
        const w = win();
        const roomId = w.npcBehaviorManager?.getBehavior?.(npcId)?.roomId;
        const pr = w.currentPlayerRoom;
        return openDoorHearing(roomId, pr, w.rooms, w.gameScenario?.rooms?.[pr]?.connections);
    }

    /** The volume now: the distance curve times the door factor; 0 when it cannot be heard. */
    _volumeFor(npcId) {
        const h = this._hearing(npcId);
        if (!(h > 0)) return 0;
        return chatterVolume(this._distance(npcId)) * h;
    }

    _distance(npcId) {
        if (this.deps.distance) return this.deps.distance(npcId);
        const sprite = win().npcBehaviorManager?.getBehavior?.(npcId)?.sprite;
        const pl = win().player;
        if (!sprite || !pl) return null;
        const p = pl.body?.center || { x: pl.x, y: pl.y };
        return Math.hypot(p.x - sprite.x, p.y - sprite.y);
    }

    async _ttsFor(npcId) {
        if (this.tts.has(npcId)) return this.tts.get(npcId);
        let mgr;
        if (this.deps.makeTts) mgr = this.deps.makeTts(npcId);
        else {
            const mod = await import('./tts-manager.js');
            mgr = new mod.default();
        }
        this.tts.set(npcId, mgr);
        return mgr;
    }

    _note(entry) {
        this.log.push(entry);
        if (this.log.length > LOG_CAP) this.log.shift();
    }

    /** Speak one line, queued behind any line still playing. Returns the queue's promise. */
    say(npcId, line, info = {}) {
        const now = this.deps.now ? this.deps.now() : Date.now();
        const npc = this._npc(npcId);
        const base = { at: now, npcId, text: line, knot: info.knot || null, topic: info.topic || null };
        if (!npc || !npc.voice) { this._note({ ...base, spoken: false, reason: 'no_voice' }); return this.queue; }
        if (this._muted()) { this._note({ ...base, spoken: false, reason: 'muted' }); return this.queue; }
        if (this.conversationOpen()) { this._note({ ...base, spoken: false, reason: 'conversation' }); return this.queue; }
        const faint = !!info.faint;
        if (!faint && info.overheard) this.fadeFaint();   // a full line gives the voice back at once
        if (!(this._hearing(npcId) > 0)) { this._note({ ...base, spoken: false, reason: 'other_room' }); return this.queue; }
        const gen = this.gen.get(npcId) || 0;
        const live = () => (this.gen.get(npcId) || 0) === gen;
        this.queue = this.queue.then(async () => {
            const t = this.deps.now ? this.deps.now() : Date.now();
            if (!live()) { this._note({ ...base, spoken: false, reason: 'cancelled' }); return; }
            if (t - now > STALE_MS) { this._note({ ...base, spoken: false, reason: 'stale' }); return; }
            const mgr = await this._ttsFor(npcId);
            // A conversation may have opened while the line waited: checked again just before it plays
            if (this.conversationOpen()) { this._note({ ...base, spoken: false, reason: 'conversation' }); return; }
            const tok = faint ? { abort: false } : null;
            if (tok) this._faintTok = tok;
            // Worked out when the line starts, not when it was queued: the player may have moved
            const level = () => this._volumeFor(npcId) * (faint && this._barkPlaying() ? BARK_DUCK : 1);
            const volume = level();
            if (!(volume > 0)) { this._note({ ...base, spoken: false, reason: 'other_room' }); return; }
            this._note({ ...base, spoken: true, faint, volume: Math.round(volume * 100) / 100 });
            const ms = await mgr.play(npcId, line, { volume });
            if (tok && this._faintTok === tok) this._faintTok = null;
            if (!ms) return;   // no clip (keyless server, quota): the bubble already carries the line
            if (!live() || tok?.abort) { try { mgr.stop?.(); } catch (e) { /* ok */ } return; }   // hung up, or given way, while it loaded
            await new Promise(r => {
                // Follow the player: walk off and it fades, leave the room and it stops being heard.
                // A conversation that opens mid-line silences it (stopped, not heard).
                const follow = setInterval(() => {
                    try {
                        if (this.current?.fading) return;
                        if (this.conversationOpen()) {
                            mgr.stop?.();
                            this._note({ at: this.deps.now ? this.deps.now() : Date.now(), npcId, text: line, spoken: false, reason: 'conversation' });
                            end();
                            return;
                        }
                        mgr.setDistanceGain?.(level());
                    } catch (e) { /* ok */ }
                }, VOLUME_TICK_MS);
                const end = () => { clearTimeout(timer); clearInterval(follow); if (this.current === cur) this.current = null; r(); };
                const timer = setTimeout(end, ms);
                const cur = this.current = { npcId, mgr, text: line, faint, done: end };
            });
        }).catch(() => {});
        return this.queue;
    }
}

export function installNpcChatterVoice() {
    const w = win();
    if (!w.npcChatterVoice) w.npcChatterVoice = new NpcChatterVoice();
    const v = w.npcChatterVoice;
    import('./global-writer.js').then(m => { v._writeGlobal = (n, val) => m.writeGlobal(n, val); }).catch(() => {});
    try { v.preload(); } catch (e) { /* stories load on first use */ }
    return v;
}
