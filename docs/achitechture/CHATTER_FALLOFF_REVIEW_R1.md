# Chatter falloff (D34), implementation review round 1

Scope: `git diff main...build/ol-chatter` up to f36bd3518 (commits da4ba567f, 2750f8aed, 3e2a887c3, 294b5736c, f36bd3518). Read against `tmp/handover/ac4_chatter_falloff_plan.md` and `docs/achitechture/CHATTER_FALLOFF.md`. The user's choice was "As (a), plus the next room through an open door", and the conversation mute is a decided addition that m03 depends on.

Line numbers are at f36bd3518. Paths are under `public/break_escape/js/systems/` unless stated.

**Counts: blocking 0, major 3, minor 10.**

Checked and fine: faint lines never set `overheard`, so `npc_overheard`, `_heardUntil`, `heard_<knot>` and E9 are unchanged (`_finishExchange` still counts `heardLines` from `h.overheard` only). No `player_state` field was added or written; bags, `_faintLine` and the voice log stay in memory. No spoken text was added to the engine: the only new strings are log reasons. The gain node sits after the analyser, so lip-sync reads the full signal; `_connectGraph` keeps the node across FX rebuilds, and `play()` without a volume resets it to 1, so barks and dialogue are never left quiet. A new `TTSManager` (reload) starts at 1, and a room change takes a playing line to 0 through the follow tick. `npc-needs.js` reading `window.npcChatterVoice?.conversationOpen?.()` is safe at boot and in tests (optional chaining, false when absent); see m4 for why it is fragile all the same. 16/16 in `test/js/npc-chatter-faint.test.mjs` pass.

## Major

### M1. After any phone call, every minigame counts as a conversation: chatter is muted and nothing is overheard

`room-hearing.js:54-57`:

```js
const mg = w.MinigameFramework?.currentMinigame;
if (!mg) return false;
return /PersonChat|PhoneChat/.test(mg.constructor?.name || '') || ['person-chat', 'phone-chat'].includes(w.currentConversationMinigameType);
```

`currentConversationMinigameType` is set to `'phone-chat'` by `minigames/phone-chat/phone-chat-minigame.js:397, 406, 503` and cleared only by the person-chat's cleanup (`person-chat-minigame.js:2009`). The `!mg` guard covers "nothing open"; it does not cover "something else open". After a call, opening a lockpick, container, notes, PC or password minigame makes the second clause true. Checked in node: `conversationOpen({ MinigameFramework: { currentMinigame: new LockpickingMinigamePhaser() }, currentConversationMinigameType: 'phone-chat' })` returns `true`.

Before this branch the same test only ducked room tone (cosmetic). Now it feeds `world.playerHears` (`npc-needs.js:5438`) and `world.speak` (`:5465`), so after the first phone call of a mission:

- an NPC chatting or muttering beside a player who is picking a lock or reading a PC is never overheard (`npc_overheard`, `heard_<knot>`, grumble and mutter listening windows all go false), although the same player before the call would have heard it;
- exchange and desk-call lines are neither voiced nor toasted during those minigames.

That is a gate difference that depends on whether the player has taken a phone call, which nobody will be able to explain from play. The unit test hides it: `npc-chatter-faint.test.mjs:188` sets the type back to `null` before it opens the "Lockpick" minigame, so the stale-type case with another minigame open is never run.

Fix: test the open minigame's own scene type, which the manager already stamps (`minigames/framework/minigame-manager.js:172`, `this.currentMinigame._sceneType = sceneType`):

```js
const mg = w.MinigameFramework?.currentMinigame;
if (!mg) return false;
return ['person-chat', 'phone-chat'].includes(mg._sceneType) || /PersonChat|PhoneChat/.test(mg.constructor?.name || '');
```

and drop the `currentConversationMinigameType` clause. Add the missing test case: type left at `'phone-chat'`, a non-conversation minigame open, expect `false`.

### M2. A faint draw starts the speaker's full cooldown, breaking E7: an NPC heard faintly from across the room has nothing to say when the player walks up

`npc-needs.js:2902-2904`: the faint pick goes through the same branch as a heard one, so `s.chatterQuietUntil = this.clockMs + this._cooldownMs(s)`. The cooldown is in needs-clock minutes at real speed (`NPC_NEEDS_SYSTEM.md:408, 653`), default 5 (`CHATTER_COOLDOWN_MIN`, `npc-needs.js:115`); test_needs_sims uses 2 for most of its cast.

`NPC_NEEDS_SYSTEM.md:640-649` ("Spent only when heard (E7)") states the rule this undoes: an unheard turn takes no line and starts no cooldown, so "a break that starts before the player arrives still has a line ready for each speaker when the player walks in". With the faint draw on, both speakers of a pair 8 to 15 tiles away say a faint line each, and each goes quiet for 2 to 5 minutes. The player walks up and gets picture bubbles. The same cooldown gates grumbles that do not pass `ignoreCooldown` (`_grumble`, `:2115`), so a heard grumble after a faint chat line also becomes a picture. Any gate keyed on overhearing pool chatter is delayed by up to the cooldown. The README's step 5 ("Walk up to them: ... the next line is at full volume", `scenarios/test_needs_sims/README.md`) only holds when the partner happens to be off cooldown.

The test pins the harmful behaviour: `npc-chatter-faint.test.mjs:64` asserts "the cooldown started".

Fix: a faint draw must leave `chatterQuietUntil` alone. Give it its own short throttle, for example `s.faintQuietUntil = this.clockMs + FAINT_COOLDOWN_MS` (about 20 to 30 s, or the cooldown scaled by the line's volume), checked only for faint picks. Taking the bag line is fine (the bag refills; repeats are the plan's accepted cost). Change the test to assert `chatterQuietUntil` is untouched by a faint line and that a heard turn straight after it voices a line. Update the E7 paragraph in `NPC_NEEDS_SYSTEM.md` (see m9).

### M3. Mutters, including the priority `login_aloud`, wait behind a faint line instead of taking the lock

The plan's rule is that a faint line never blocks a line the player would hear in full. `_speechFreeFor` was wired into `_pickBark`, the exchange step and the desk call, but the mutter entry and its wait queue still use the plain lock:

- `npc-needs.js:2174`: `if (this._mutterHeld(npcId) || (lines && (!this._speechFree() || ahead)))` queues the mutter;
- `npc-needs.js:2212`: `_tickMutterWaits` says it only once `this._speechFree()`.

So a faint ambient line from someone 12 tiles away, or in the next room, delays a workaround hand-over line or `login_aloud` by up to the faint line's length (up to `CHAT_MAX_MS`, 4 s), and the mutter's listening window opens that much later. Mutter waits tick before chats (`tick()`, `npc-needs.js:~1163`), so it is a delay and not starvation, but it is the exact case the preempt was built for, on the path m03 leans on.

Fix: in both places, with `const full = priority || !this._unheard(s, topic)`, ask `this._speechFreeFor(!full)` instead of `this._speechFree()`, keeping the order `ahead` first so the side effect (preempt and fade) only fires when the mutter will actually be said now. Add a test: a faint line holds the lock, `mutter(npcId, 'login_aloud')` is said in the same tick and `world.fadeFaint` is called.

## Minor

### m1. A "faint" line can play at full volume (walk-up, dark room, blocked line), with a dimmed bubble and no heard credit

`npc-needs-chatter.js:230-236` returns `_volumeFor(npcId)`, which is `chatterVolume(d) * hearing`. Out of earshot in a lit room with the default radius means d > 160, so the volume is below 1, which is the case the plan had in mind. Three other ways to be "unheard" give full volume:

- a dark room (`playerHears` returns not overheard below level 0.5, `npc-needs.js:~5447`): the player stands beside the NPC and hears every word at 1.0, where before there was nothing; the slice 15 rule is that nobody overhears in the dark;
- a blocked sightline in the same room within 160 px;
- the player walks up during a faint line: the follow tick (`:347`) raises it to 1.0 while the bubble stays dimmed and it still counts for nothing.

Fix: cap a faint line, at draw and in the follow tick, at the curve's value at the earshot edge or a `FAINT_MAX` (0.5 to 0.6), for example `Math.min(level(), FAINT_MAX)` when `faint`. For a dark room, use `CHATTER_FLOOR` or skip the faint draw.

### m2. "Aborting a clip still loading" does not abort the load, and a faint line still queued is not covered

`fadeFaint` (`:243`) sets `_faintTok.abort`, but the queue step is awaiting `mgr.play` (`:331`), which only returns after `audio.play()` has started (`tts-manager.js` `play`). So the faint clip still downloads, starts, and is stopped at `:334` (a short faint blip), and the full line, queued behind it on the single `this.queue`, waits for the whole fetch. With a cached clip this is tens of ms; with an uncached one it is the TTS round trip, and a long one can push the full line past `STALE_MS` and drop it. The token is also only made once the line reaches the play step (`:325`, after `await this._ttsFor`), so a faint line that is still queued behind a clip that outran its bubble is not aborted at all and plays before the full line.

Fix: make the token in `say()` (one per faint line), check it at the top of the queue step and again before `play`, and race `mgr.play` against an abort promise so the queue moves on at once (a later resolve then calls `mgr.stop()` if aborted; `playSeq` already protects a newer line on the same manager). Add a test with a `play` that resolves after 1 s and a full line that must start within about 400 ms.

### m3. A conversation that opens while a clip is loading is not re-checked after `play` returns

The conversation check is at `:330` (before `play`) and in the follow tick. A line whose fetch was in flight when the player pressed talk starts over the opening dialogue line and is cut by the first tick, up to 250 ms later. Fix: add `|| this.conversationOpen()` to the post-play check at `:334`.

### m4. The gameplay mute in `npc-needs.js` depends on the voice module having loaded

`world.playerHears` and `world.speak` mute through `window.npcChatterVoice` (`npc-needs.js:5438, 5465`). The voice is installed by a dynamic import in `core/game.js:2100` that logs and continues on failure. If it fails or has not resolved, conversations silently stop muting, and with it the heard rule m03 depends on. It is safe at boot and in tests (it just returns false), but a gate rule should not hang off an audio module. Fix: inline the three-line check in the adapter (no import needed, so the "no imports" rule holds) or inject `world.conversationOpen` from the code that builds the adapter.

### m5. The curve ignores the pool's `overhearRadius`

The plan: full volume up to "160 px, or the pool's `overhearRadius`", far radius 3r. `chatterVolume` uses fixed `CHATTER_NEAR`/`CHATTER_FAR` (`room-hearing.js`), and `faintVolume` cuts off at the fixed 480 px. m02's cooler and coffee objects use `overhearRadius` 360 (`scenarios/m02_ransomed_trust/scenario.json.erb:3650, 3655`), so a line heard in full at 300 px plays at 0.63, and the faint band is only 360 to 480 px. Fix: pass `{ near: r, far: 3 * r }` from `_chatRadius` through `info` (or a `radiusFor` dep) to `_volumeFor` and `faintVolume`.

### m6. Grumbles and mutters draw no faint line (plan option (a) said "ambient chatter and grumbles")

`_grumble` (`npc-needs.js:2114`) still turns an unheard grumble into a picture. Documented in the handover as not done. Acceptable for this round since grumbles are short and sporadic, but it is in the chosen option, so either do it (the same `faintVolume` check before `_pickBark`, faint flag through `_showSaying` to `_speak`, with M2's separate throttle) or record in CHATTER_FALLOFF.md that the user should confirm it is dropped.

### m7. No player toggle, and the only existing chatter mute is dead

Option (a) lists "scenario opt-out plus a player toggle"; only the scenario flag exists. The plan called the toggle cheap and a help for players who find murmur distracting, and faint chatter makes more voice than before. Separately, `NpcChatterVoice._muted()` (`npc-needs-chatter.js:204-206`) reads `window.npcBarkSystem`, which nothing assigns (`main.js:147` sets `window.barkSystem`), so the existing "Muted when barks' sound is off" never fires. This is older than the branch, but it means there is no way at all for a player to switch chatter off short of the Voice slider, which also silences dialogue. Fix: read `win().barkSystem` in `_muted()`, and add the "Background chatter" switch to the music widget, saved like the Voice slider and read by `faintVolume` (faint only, so heard lines keep working).

### m8. An exchange line voiced out of earshot is still treated as a full line

Exchange lines after the start carry `faint` false (`npc-needs.js:4387`), so one voiced at the floor from 15 tiles shows a full-opacity bubble (or a toast), and it holds the lock against any full line nearby, which the faint ambient line would yield. The handover lists this as not done. Fix for the display: pass `faint: !h.overheard` into `c.current` for exchange lines, so the bubble dims; keep them out of the preempt (cutting an exchange line would break it).

### m9. NPC_NEEDS_SYSTEM.md is stale

The plan listed it among the files to change. At f36bd3518 it has no `faintChatter`, and the E7 paragraph (`NPC_NEEDS_SYSTEM.md:640-649`) and the earshot paragraph (`:632-639`, "the voice layer, which plays a spoken line anywhere in the player's room") now describe the old rules. Fix: document the faint draw, its throttle (after M2), the preempt, the conversation mute, the door factor and the flag beside `roomTone`, and point to CHATTER_FALLOFF.md.

### m10. Test gaps

The tests mostly pin real behaviour through the needs core and the voice queue, and the handover's "fails on the old sources" check is good practice. Gaps:

- the stale-type case with another minigame open (M1) is skipped by `npc-chatter-faint.test.mjs:188`;
- `:64` pins the cooldown start that M2 says is wrong;
- no mutter preempt test (M3);
- the preempt test (`:113-124`) calls `_speechFreeFor` directly; no test drives a heard bark or a heard exchange line through `step()` and checks it is said in the tick the faint line is cut, nor that an unheard exchange line waits;
- no test of `TTSManager.setDistanceGain` itself (the gain node created between analyser and voice bus, immediate versus eased, the element-volume fallback when unrouted, and the reset to 1 by a `play()` with no volume). The live proof read the gain once; a unit test with a fake `AudioContext` would hold it;
- no test of a load that resolves after `fadeFaint` (m2) or after a conversation opens (m3).

## Judged acceptable

- **No bubble for a faint line through an open door.** The plan described this gap under (c) and the user chose (c) with it. Faint lines count for nothing, so a deaf player loses atmosphere, not progress. If wanted later, a small "voices next door" indicator at the door would close it without a caption that names words the player cannot place.
- **Performance.** One line plays at a time, so there is one 250 ms interval at most; each tick reads one door list and the bark managers. `faintVolume` runs once per unheard chat turn. The exchange step's extra `playerHears` (`npc-needs.js:4378`) adds one raycast per due line. With many NPCs the cost stays per turn, not per NPC per frame. A nit: the follow tick calls `setTargetAtTime` every 250 ms even when the level has not changed, which adds automation events for the line's length; skip the call when the level moved by less than 0.01.
- **`player_state`.** Nothing new is synced or saved.
- **Spoken lines.** All voiced text is still scenario data.
