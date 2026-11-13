Counts: blockers 0, majors 0, minors 2, nits 3

# UX feedback round, slice 5 (speech bubble barks): code and UX review, round 5 (final)

Branch `build/ux-barks` at `b7c61d242`. Reviewed the R4 fixes (af0c12888, ee5a95812, 6a3250911, b7c61d242), `UX_SLICE5_REVIEW_R4.md` and the "R4 fixes" section of `UX_SLICE5_BUILD_LOG.md`, against the pixel-art UI rule, the UI design language notes and the spoken-lines rule. The orchestrator's rulings stand and are not findings: the unlit bubble depth is 8500; with lighting on, the proximity ghost stays under the bubbles; a chatter line pushed off screen does not come back later in the line.

## What was checked

**1. followUpBeyond: the hint on every path, live** (driver `slice5_r5_hint.mjs`; a per-frame recorder counts each time either half of the hint comes into view, by source; A is "Store B needs a staff badge. Reception", B is "issues them to visitors with an escort."). Same counts at 1400x1000 (game 2749) and 915x412 (2750):

| Path | A | B | Seen as |
|---|---|---|---|
| Refusal in her cooldown, line page up (`superseded`) | 1 | 1 | notification only |
| Same, first hint page up | 2 | 1 | A in bubble, then the notification |
| Same, last hint page up | 1 | 2 | B in bubble, then the notification; no toast (R4: B 3) |
| Her next refusal, last hint page up (`replaced`) | 1 | 2 | B on screen, then her new bubble: line, A, B (R4: B 3) |
| Her next refusal, first hint page up | 2 | 1 | A on screen, then line, A, B |
| Another line of hers, last hint page up | 1 | 1 to 2 | her new line, then the whole hint once |
| `stillValid` false, line page | 1 | 1 | one toast, whole hint |
| `stillValid` false, last hint page | 1 | 1 | one toast, whole hint (R4: a mid-sentence toast) |
| `close()` | 1 | 1 | toast |
| `closeTagged` with another hint / with none | 1 | 1 | toast |
| Room switched off with the bubble up | 1 | 1 | `left-view`: line and hint in one toast |

Every second sighting is the reader's own page on screen when the newer answer arrived, then the whole hint once; no path hands on a fragment or shows the hint twice after that. The hint itself is never lost. The one shape that still doubles is an older carried hint placed before the current one (n1, from code and a direct call of `followUpBeyond`; it needs one guard on two gates with different hints).

**2. Chatter voice gating.**
- Voice after placement: `_voiceChatter` runs from the placement branch (npc-world-bubbles.js:885) or from the end-of-frame loop for a line with no bubble to place. Live, 1400x1000 (2752): Tom's line placed and voiced once; 915x412 (2754): Amara's placed and voiced once.
- Font-loading frame: `update()` returns before placement (npc-world-bubbles.js:842) and leaves the waiting voice in the map; the next frame places and voices it. The return happens after the cap-skip loop, so a capped line is still skipped. Covered by the R4 test; not reproducible live (the font is cached by the time a driver can set a line).
- A waiting voice whose line has ended is dropped: `over` (npc-world-bubbles.js:899) compares with the needs system's `talking.line`, which is the same string `_speak` passed for one-off lines, chats, exchanges and desk-phone calls (npc-needs.js:2077, 3851, 3887, 4193 against `_talking`, 3906).
- A bark that displaces chatter cancels its voice: live (2752, `slice5_r5_drop.mjs`), Amara's line shown, four barks fill the cap, `_skipChatter('full', wasShown)` and one `cancel('amara')`. `cancel` bumps her generation, so only lines queued before it are dropped.
- Bounded: at most one waiting voice, one shown line and one skip mark per NPC; every run ended with 0 waiting voices and 0 skip marks, bubble map 4 (one per NPC that spoke).
- Phone contacts are not in the needs system and never reach `world.speak`; unchanged. NPCs in another room, a dark room or with a minigame open are not candidates, so the end loop voices them as before. NPCs in the player's room but off camera are not: see n2.
- Chatter at 800x600 in test_needs_sims (2753): two of the scenario's own "Task Complete" notifications cover most of the view, so all three lines were skipped and unvoiced. That is the R4 ruling (no room, no voice); it does mean exchange and call lines can be lost for good (m2).

**3. Depth on a lighting change.** Lighting is decided once, at scene create (`initLighting`, lighting.js:1680); the player can only change it with `?lighting=off` or the stored setting and a reload. Live:
- test_bark_bubbles loaded with `?lighting=off` (2765): Dana's bubble at 8500, visible, routed `bubble`.
- Same game lit, `window.lightingSystem` set aside on frame 10 and restored on frame 30 with Lee's bubble up: depth 100003 to 8500 on frame 11 and back on frame 31, 0 hidden frames, no other depth changes.
- test_phone_calls (unlit, 2764): bubble 8500, ghost 9000 and flash 10000 both above it.
- Nothing a player needs is hidden: with lighting on the bubbles are above the light map; with it off, above the action icons (5000) and every world sprite (depth is world Y). A map would need content more than 8500 px south of the start room to draw over an unlit bubble; the action icons at 5000 already have a tighter bound.

**4. Last pass against the user's rules** (`slice5_r5_shots.mjs`; 2749 at 1400x1000, 2756 at 800x600, 2750 at 915x412; scrollbar probe 15 px; `setFPS(20)`, fixed steps on):
- Pixel-art bubble: 2 px dark border, flat white fill, stepped corners, whole-pixel pointer. Pass.
- Crisp VT323: whole-number size, no smoothing at any of the three sizes (`main-16`, `k-top-two-closeup`). Pass.
- Never over another speaker's head or the HUD: 0 overlap frames and 0 HUD frames in every chatter run; HUD resize runs 0 overlap frames at 1120x850, 1400x1000, 640x510, 800x600, 732x350 and 915x412; no unlisted fixed element. Pass.
- Every bark visible somewhere: every hint path above shows it; the dark-room bark goes to a toast; a held bark comes out as a toast or bubble. Pass, with m1 on which one.
- Door refusal (main-16): Dana's bubble, no notification, no toast, at all three sizes. Pass.
- Spoken text only from scenario files: the R4 changes add no text; a skipped chatter line makes no toast. Pass.
- TTS once: bark voice once per line (`_speakBark`); remainder and follow-up toasts are silent; a placed chatter voice is taken out of the map before it plays, so a line on screen for many frames is voiced once. Pass.

**5. Regressions.**
- Phone calls (test_phone_calls, 2755): Basic rings, answering connects, a person bark during the call is held (queue 1) and comes out as a bubble, a phone contact's bark is a toast, a declined voicemail gives "New voicemail". Pass.
- Door refusals: as in section 1 and main-16. Pass.
- Delayed barks (this branch's `setTimeout` path, 2765): a `barkDelay: 1500` mapping does not mark the event answered (`answeredInView` false), and the bark shows as Lee's bubble after the delay. Pass.
- Person-chat (2765): a bark from Lee during a conversation with Dana is held (queue 1); when the conversation closes it comes out as a toast, not a bubble, though Lee is in view (m1).

**Tests.** Every test file that imports a changed module (`doors`, `interactions`, `npc-action-icons`, `npc-barks`, `npc-manager`, `npc-needs`, `npc-world-bubbles`) or the R3 list (`core/game`, `main.js`, `locked-hint`), no lock: 132 files, 132 passed, 0 failed (`bin/test-js -j 3`, two batches of 122 and 10).

**Live setup.** Keyless server on :3339 from this worktree, headless, scrollbars shown. New games, all from `swap-scenario-game.rb test_access_habits <dir>`: 2749, 2750, 2756, 2765 (`test_bark_bubbles`), 2752, 2753, 2754 (`test_needs_sims`), 2755, 2764 (`test_phone_calls`). Shots and numbers in `scratchpad/ux-shots/slice5-r5/` (lossless webp: `*-main-16*`, `*-hint-*`, `*-chatter-*`, `big-drop-*`, `calls2-*`, `phone-offcam*`, `big-chat-*`, `big-lighting-off-param`; JSON: `*-hint-report.json`, `*-report.json`, `*-chatter.json`, `big-drop.json`, `*-offcam*.json`, `big-toggle.json`, `big-chat.json`). Server stopped afterwards.

## Merge with build/bark-delay

`git merge-tree build/ux-barks build/bark-delay`: `npc-barks.js` merges cleanly (bark-delay's `el._removing` guard in `_dropStaleVisibleBarks` lands next to this branch's code and still holds). `npc-manager.js` does not: 4 conflict hunks, all where both branches edited the same lines:
1. After `_barkStillValid`: this branch adds `_markAnsweredInView` (npc-manager.js:1277), that one adds `_delayBark`. Keep both methods.
2. The bark-text branch: this branch's `const barkDelay`, `hasText` and `answered` lines (npc-manager.js:1886) against that branch's removal of `barkDelay`. Keep `hasText` and `answered`, computed from `Number(config.barkDelay) > 0` (bark-delay normalises it at registration, so the two agree).
3. The `showBark` payload: keep `stillValid` from the `fireBark(stillValid)` parameter (bark-delay) and add `eventPattern` and `followUp: answered?.followUp || null` (this branch, npc-manager.js:1911). Drop this branch's `setTimeout(fireBark, barkDelay)` block (1916) for `_delayBark`.
4. The knot branch (npc-manager.js:1928): wrap the `_delayBark` call in this branch's `inTime` flag, and pass `onText` only when there is no delay: `const onText = barkDelay > 0 ? null : () => (inTime ? this._markAnsweredInView(npcId, eventData) : null); this._delayBark(npcId, config.barkDelay, (valid) => this._showBarkFromKnot(npcId, npc, config.knot, eventPattern, valid, onText), stillValid); inTime = false;`. With no delay `_delayBark` calls `show` at once, so the in-time mark still works; with a delay the event is never marked and the door keeps its notification, as on this branch now.

Behaviour together, resolved this way: a delayed bark is not an answer in view (the refusal notification stays, the hint is in the notification, not her bubble). When its delay ends it goes through `showBark`, so it is held behind a conversation, call or minigame, and on release is routed by `_renderBark` to a bubble when its NPC is in view, else a toast (subject to m1). The `stillValid` that `_delayBark` builds (condition, knocked out, hidden; no room check) is polled by the bubble every `STILL_VALID_EVERY_MS` and by the toast drop; a delayed bark whose NPC is knocked out while it is up closes as `stale`, with nothing to hand on. Its `eventPattern` tag lets `closeTagged` close it if a newer refusal answers the same event. bark-delay's `npc-bark-delay.test.mjs` and this branch's bark tests should both run on the merge result: the conflict is textual, the semantics compose.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. A bark held through a conversation or minigame comes out as a toast, not a bubble, though its NPC is in view.**
`public/break_escape/js/systems/npc-world-bubbles.js:623` (`viewFacts`) and `:789` (`update`) treat any `MinigameFramework.currentMinigame` as open. `person-chat-minigame.js:2015` drains the held barks in its own `cleanup()`, while the manager still holds it as `currentMinigame` with `_ending` set; `holdsBarks()` (minigame-manager.js:197) already counts an ending minigame as closed, so the bark is released, but `routeBark` sees `minigameOpen: true` and picks the toast. Live, 2765 at 1400x1000: at render time Lee's facts were `{ npcRoom: hall, playerRoom: hall, onCamera: true, minigameOpen: true }` with `currentMinigame` person-chat, `_ending: true`; route `toast`, shot `big-chat-released`. Only the first held bark is affected (later ones, 2.5 s apart, find the minigame gone), and the bark is still seen, but the toast lands top right just as the player returns to the room, which is what the slice set out to stop. The same goes for any minigame whose cleanup drains before the manager clears it. Fix: in both places, `const mf = win().MinigameFramework; const minigameOpen = !!(mf?.currentMinigame && !mf.currentMinigame._ending);`. Test: a bark held during person-chat, released from cleanup with `_ending` set, routes to the bubble.

**m2. An exchange or call line skipped for want of room is never voiced or shown, yet the exchange still counts as heard.**
`npc-world-bubbles.js:431` (`_skipChatter`) drops the line and its voice without telling the needs system; `npc-needs.js:2719` (`_finishExchange`) sets `heard_<knot>` and adds the knot to `_exPlayed` when the last line's time is up, whatever was heard, and `_tickCalls` (npc-needs.js:4190) marks a call heard from `overheard` alone. Exchanges are heard once by rule, so a scripted exchange that starts while the bubbles have no room (the cap, a HUD panel, the 800x600 notifications seen in 2753) is lost for good, and any ink or objective reading `heard_<knot>` is credited for lines the player never heard. Before R4 those lines were voiced while their bubble waited. From code; not driven live (no exchange in the test scenario fired in a run). Fix, either: (a) in `world.speak` (npc-needs.js:4884), do not defer a line that has `info.knot` or `info.call` (voice it at once, as before R4; the bubble shows when it can), or (b) report a skip back (`npcNeedsSystem.lineSkipped(id, line)`) and have the chat or call set `heardAll = false` so `_finishExchange` and `_finishCall` do not mark the knot. (a) is smaller and keeps the "heard once" contract. Test: an exchange whose second line finds no room still voices it (a), or leaves `heard_<knot>` unset (b).

### Nits

**n1.** `followUpBeyond` (`npc-world-bubbles.js:112`) only strips the new hint when it is the tail of the unread follow-up. When her bubble carries the current hint before an older one ("H G": a refusal at gate A, then within the bubble's life a refusal at gate B), a third refusal at gate A gives "H G" plus H: `followUpBeyond('H G', 'H')` returns "H G" (checked by direct call). Needs one guard on two gates with different hints. Fix: keep the follow-up as a list of hints on the bark state (`st.hints`), and drop any entry whose `textKey` equals the new one, in `say()` and `closeTagged`.

**n2.** Chatter from an NPC in the player's room who is in earshot but off camera is now skipped and not voiced; the build log says such lines are "voiced as before". Chatter candidates are not filtered by `_onCamera` (`npc-world-bubbles.js:817`), so `placeBubble` finds no place inside the view and the line is skipped (`:872`). Live, 915x412 (2754) with the camera moved 260 px down: five NPCs `onCamera: false`, `overheard: true`; three lines set; 3 skips (`no-room`), 0 voice attempts (`phone-offcam-pan.json`). With the camera on the player at zoom 1 the earshot radius (160 px) fits inside the view, so this mostly shows with a zoom step set or the camera clamped at a world edge. Fix: `if (!this._onCamera(sprite)) continue;` before `cands.push` for chatter, so the end-of-frame loop voices it as for another room.

**n3.** `npc-manager.js:861` to `:868`: the R4 insert put `_storyFromLoader` and its doc between `_preloadKnotBark`'s doc comment and `_preloadKnotBark`, so that method's comment now sits above the wrong one. Fix: move `_storyFromLoader` (with its own doc) above the `_preloadKnotBark` doc.

## Sync

Display only, unchanged. Nothing is added to `player_state`; no non-GET request came from the bubbles in any run. The chatter voice maps hold at most one entry of each kind per NPC and were empty at the end of every run. The preload makes at most one GET per story not already in either cache. The bubble log is capped at 60 entries.
