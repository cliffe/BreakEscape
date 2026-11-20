# Review: A4 round 1 (thread rows and phone state)

**Verdict: accept, with a fix round.** 0 blocker, 0 major, 6 minor, 6 nits. Rows, the reload rules of row 27 and the server whitelist match the plan. Lab SE is unchanged. The minors are two save-path gaps (m1, m2), one drawing gap on legacy call screens (m3) and three test gaps (m4 to m6).

Reviewed at `56a9e74b2` (engine, server and tests in `05c48a567`). A5 has since committed `d31b55ce0` on top; I did not review it. Node and Rails runs were in a detached temp worktree at `56a9e74b2`, now removed: `phone-call-log` 14/0, `phone-call-persistence` 19/0, `phone-ringer` 122/0, `phone-ring-in-phone` 27/0, `phone-ring-home-hub` 9/0, `phone-outgoing-call` 27/0, `phone-ring-hold` 21/0; Rails `game_phone_calls_state_test.rb` 22 runs, 95 assertions, 0 failures (under `flock /tmp/be-test-suite.lock`). I did no live run and started no server. The proofs answer question 4 (section 4).

## 1. Rows and reload rules against the plan

| Plan | Code | Result |
|---|---|---|
| Row 20 Decline, row 21 ring-out, row 17 Hang up from hold, row 18 hold limit | adapter `onOutcome` (`phone-ringer-dom.js`) `declined`, `missed`, `rang_off` → "Missed call", unread | matches |
| Row 25 own end | `ended` → "Incoming call, m:ss", read; seconds from `o.openedAt` (set in `finishOpen`) to the end | matches; the time on the line, not the ring |
| Row 32 closed by something else | `dropped` with `extra.missed` → "Missed call" | matches; A6 adds the callback |
| Row 26 forced hit, row 28 ending | no row | matches |
| Withheld | "Missed call: No caller ID", "Call: No caller ID" (no time) | matches 2.6 |
| Row 27 non-forced (`live`: queued, ringing, held, connected) | missed row (unread), no toast, `phone_call_missed:<npc>` on `setTimeout 0` after `game_loaded`, `reload: true`, slot cleared | matches; `onMissed` is A6's |
| Row 27 forced | `phoneRinger.restore(npcId, { forced })`; `queued` entries come back fresh, the rest ring again with `resume`, `answerSeconds` kept, `answeredEmitted` true, `setGlobalOnStart` null, `notBefore = now + RERING_AFTER_LOAD_MS` | matches; `restore` calls `save(first)`, so the slot is written again at once (test `the restored slot is re-saved`) |
| `answerSeconds` | kept by the server (clamped 0..3600) and by `restore` | carried; live `reload_forced` shows 6 before and after |
| `untilAnswered` | in the slot and kept by the server | carried. It changes nothing after a reload: a forced call has no ring timeout anyway, and a non-forced one becomes missed |
| A callback already saved (`live.state: "missed"`) | kept as `{ live }` | A6 shape; see n5 |

**The timed ring's delivered mark.** The id is `conv:<npc>:<knot>:<n>`, where n counts earlier ring conversations for the same contact and knot. The only engine caller of `scheduleTimedConversation` is `registerNPC` (`npc-manager.js:355`), once per NPC, from the single `timedConversation` object, so n is always 0 in play and the id is stable across loads. It can't be confused with a timed text: those ids are `npc:<id>:<i>`, `msg:<id>:<seq>` and `map:<event>:<t>`. Only `npc:` ids were exported before, and `restoreTimedMessages` matches ids exactly (`timedMessages.find` / `timedConversations.find`). The `conv:` ids ride the existing `delivered` list (server cap: 200 ids of at most 300 characters each, shared with the `npc:` ids). Both orders are handled: saved ids applied before or after the schedule. The mark is set at offer (`offered`), including a `refused` offer, which is right, because the beat then lives in `pendingCall`.

**Rows are not history.** The checks below hold:

- `phone-chat-minigame.js` `conversationHistory` filter and both `_preload*` checks skip `type: 'call'`, so a contact whose first contact is a call still gets its opening preloaded. The tests only check this by matching source text (m4).
- Unread: `getTotalUnreadCount`, the contact row badge and `PhoneChatHistory.getUnreadCount` count only an unread missed row. `markAllRead` marks rows read. The `rows` live route shows the badge dropping when the thread opens.
- Preview: the last row (it isn't narration), red for missed.
- `settleOnSeenLines`: row texts go into the seen set. That's harmless, since no ink home line reads "Missed call" or "Incoming call, 0:05". The live `settle` route (reload, row present, home line once) passes.
- Server: phone history is used for nothing but the reload (`games_controller.rb:375`). No objective or check reads it.
- Not covered: rows count toward the 150-message cap on both sides (n6), and legacy call screens draw them as subtitles (m3).

## 2. Server (`game.rb`)

The input is player-controlled, so I checked each part.

- **Message `type` over 20 characters now drops the whole message.** Every type the engine writes is `npc`, `player`, `narrator` (from `classifyPhoneLine`) or `call`: `addMessage` and `history.addMessage` callers in `npc-manager.js`, `npc-barks.js`, `phone-chat-minigame.js`, `phone-chat-conversation.js` and `phone-chat-history.js`. Pretext calls write `npc` and `player`, and the lab SE `history_after_reload.json` lists only those. No scenario seeds phone history; every scenario `"type"` over 20 characters is an object type. The rule drops nothing the game sends today. Older saves hold the same four types, so nothing is lost on load. The `when 'type' then value.length <= 20` select is now dead code (n1).
- **Call rows.** `/\A[A-Za-z0-9 ,:]{1,60}\z/` uses `\A`/`\z`, so `"Missed call\nforged"` is refused. The longest engine text, "Incoming call, 5999:59" (the `mss` cap), fits. `callEvent` is an enum.
- **`pendingCall`.** The cleaner builds each record fresh, so unknown keys never pass. Knots match `/\A[A-Za-z0-9_.]{1,200}\z/`. `state` and `onMissed` are enums and booleans must be real booleans. `answerSeconds` must be `Numeric` and `finite?`, then is clamped. I checked that the `finite?` guard is needed: Ruby's JSON parses `1e400` as `Infinity`, and `Infinity.to_i` raises `FloatDomainError`, which would be a 500 on sync. `callLabel` is at most 100 characters, with no C0 controls or `<>`. `setGlobalOnStart` is a scalar map of at most 10 entries. `forced` is capped at 10. Nesting is no deeper than slot → list → record → flat map, and the cleaner reads no deeper. The 512 kB cap still applies.
- **Forged `setGlobalOnStart`.** A forged slot could set globals on reload, but `merge_global_variables!` already accepts any client global that isn't read-only, so this gives the player nothing new.
- **Old saves.** No save before A4 has `pendingCall` (the server dropped the key), so no old shape is on disk. Entries without `pendingCall` or `callEvent` load as before. The flat single-record branch accepts a shape nothing ever wrote (n2).
- **Hostile cases tested:** HTML, control characters, newline and long text in rows; 10 kB knot; nested object; unknown `state`, `callEvent` and `onMissed`; type over 20; `answerSeconds` as string, negative and 10^9; `callLabel` with HTML, control characters and over-long; `setGlobalOnStart` names and values; unknown keys; forced cap; the 512 kB cap; a `pendingCall`-only entry. **Untested** (mutations survive): `^…$` instead of `\A…\z` on the knot pattern, no `finite?` check, `<>` in a `setGlobalOnStart` string, and the 10-entry globals cap (m6).

## 3. Mutations (each restored from the saved original; tree clean after)

JS (`phone-call-log` + `phone-call-persistence`, plus `phone-ringer` for ringer and adapter changes; plus `phone-outgoing-call`, `phone-ring-in-phone` and `phone-ring-home-hub` for the minigame and conversation filters):

| Mutation | Result |
|---|---|
| adapter: declined / rang_off / dropped-with-missed not a missed row; any dropped a missed row; withheld ignored | caught (all) |
| adapter: `resumePendingCalls` not called on `game_loaded` | caught |
| adapter: resume after `onGameLoaded` | survives (harmless: `onGameLoaded` is `nudge`, and `restore` calls `run()` itself) |
| adapter: outgoing direction ignored | survives (A5's) |
| ringer: `openedAt` never set; seconds in minutes; row 32 without `missed` | caught |
| **ringer: `giveUp` without `{ missed: true }`** | **survives** (m5) |
| addCallRow: missed read; every row unread; withheld incoming shows time; `m:ss` unpadded | caught |
| **addCallRow: no draw into the open thread; drawn but not marked read; open check ignores the contact** | **survive** (m5) |
| addCallRow: no badge update; no `gameTime` | survive (the live `rows` route covers the badge; n4) |
| total unread ignores rows; contact row ignores rows; never red (preview and row); `innerHTML`; rows drawn as bubbles | caught |
| **`PhoneChatHistory.markAllRead` skips rows** | **survives** (m5; the live route covers it) |
| `PhoneChatHistory.getUnreadCount` ignores rows; total unread counts every row | survive (the second is equivalent: non-missed rows are created read) |
| **minigame / `_preloadOpeningOnce` / after-load re-check count rows as conversation (`|| true`)** | caught **only** by the source-text regex test `rows are not a conversation` (m4) |
| fields without `callEvent`; `pendingCall` not written; `pendingCall`-only entry dropped; not read on restore; late contact not resumed | caught |
| `pendingCall` exported by reference (no clone) | survives (n4) |
| resume: no row; event not emitted; emitted synchronously; slot not cleared; forced not restored | caught |
| resume: withheld ignored on the reload row; no `reload: true`; callback (`state: missed`) not kept; only the first forced entry restored; no once guard; flat record always forced | survive (n4) |
| timed: restored mark ignored at schedule; ids not exported; exported before offered; restore doesn't mark a scheduled one; `offered` not set; nth always 0; non-ring conversations get ids | caught (all) |

Rails (`game_phone_calls_state_test.rb`): 24 mutations. Caught: type over 20 kept typeless, row text unchecked or `^$`, `callEvent` free, `pendingCall`-only dropped, knot length free, `voicemailKnot` / `state` / `onMissed` unchecked, truthy booleans, no clamp, `callLabel` controls / `<>` / length, globals name / values, forced cap, flat record dropped, empty slot kept, unknown keys kept. Survive: knot `^$`, no `finite?`, `<>` in globals strings, globals count cap (m6).

## 4. Proofs: `reload_ringing_server.json`

The dump has the contact's entry with **no** `pendingCall` and no row: it is the state saved by the last periodic sync before the ring. Its session log is from the old route: `{"cmd":"sync"}` (seq 16) ran before the reload, but no `stateSync.sync()` ran between the ring and the dump. The conclusion still holds. `caller_decline` was ringing at 15:09:54.6, and the page reloaded at 15:09:57.3, 2.7 s into a 20 s ring, so the call can't have rung out. After the reload, `caller_decline` has one unread "Missed call", the ringer is idle and the slot is null. The row can only come from row 27 on a slot the server held. The slot got there through the `pagehide` flush (`state-sync.js` `flush()`, which sends `phoneState` and `timedMessages` with `keepalive`). So this run proves the unload path rather than the forced sync. `reload_held`, `reload_connected` and `reload_forced` have dumps that show the slot (`held`, `connected`, `forced[0]` `connected` with `answerSeconds` 6). The `reload_timed` dump (after the reload) shows the missed row and no slot. The conclusions are sound. Re-run `reload_ringing` with the current route in the fix round so its dump shows `live.state: "ringing"` (n3). The flush has a size fallback that matters (m1).

## 5. Lab SE

`proofs/A4/se_dev/storystate_after_call.json` and `_after_reload.json` both give `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`), the same as `A3_r1/se_dev`. The `/tts` text lists in `A3_r1/se_dev/tts.jsonl` and `A4/se_dev/tts.jsonl` match. `se_phone_contacts.png` has the same SHA-256 (`d30d40ce…`) in `A0`, `A3_r1/se_dev` and `A4/se_dev`. `history_after_reload.json`: Dev has 8 messages and Ruth 1, types `npc` and `player`, `callRows: 0`. Pretext calls never reach the ringer, so they never reach `onOutcome`. Unchanged.

## Findings

### m1. A slot can miss the server on a reload within the sync window

`pendingCall` reaches the server on the 30 s tick or on the `pagehide` flush. When the flush body passes `KEEPALIVE_BODY_LIMIT` (60 000), the second fallback (`state-sync.js` `flush()`) drops `phoneState` but keeps `triggeredEvents` and `timedMessages`. A ringing contact's entry carries its `storyState` (up to 60 kB), so that fallback is reachable in a long mission.

**Failure scenario:** a `ring` mapping offers a call. Its trigger is persisted at offer (2.7), and a timed ring's `conv:` mark is set at offer. The player reloads within 30 s with a large phone delta. The trigger or mark reaches the server, but the slot does not. After the reload the mapping does not fire again and there is no slot, so the call is gone: no ring and no missed row. Plan 2.7's promise that "nothing is stranded" fails.

**Fix:** when `savePendingCall` changes a contact's slot (null to a slot, a state change, or back to null), schedule a debounced `stateSync.sync()` (about 500 ms). Calls are rare, so the cost is small. This also closes the 30 s window noted in `HANDOVER_A4.md` "Open". Test: an adapter test that a ring calls the sync once.

### m2. A cleared slot stays on the server when the entry becomes empty

`exportPhoneState` skips a contact whose `_phoneStateEntry` is null. The server replaces only the entries it receives. A contact with no history and no story whose slot is cleared without a row therefore keeps its old `pendingCall` on the server. That happens on ringer `close()` (row 28) and on a forced call dropped after the ending. The `pendingCall`-only entry is a tested case (`a first call from a contact with no thread is saved`).

**Failure scenario:** the credits start while a no-thread contact is ringing. A reload after the conclusion then turns the stale `live` into a "Missed call" row and fires `phone_call_missed` (the mission's mappings run on a concluded game). A stale `forced` entry is offered to `restore()`, which refuses it only if the ringer is already closed by then.

**Fix:** when a contact was last sent with a `pendingCall` and its entry is now null, send `{ history: [], pendingCall: null }`. On the server, treat an entry that is explicitly `pendingCall: null` with nothing else as a delete (`merged.delete(npc_id)`). Test both sides.

### m3. A legacy voiced call screen draws rows as the caller's lines

`PhoneChatUI.addMessage` returns `_addCallSubtitle` for `isCallMode` before the `type === 'call'` branch. `callScreenOnly` hides the history only for ringer calls. A legacy voiced call (F17/F20 event-mapping calls, `voiced: true`, not terminal) replays the whole thread, so a row draws as `<Name>: Missed call`. No contact has both today, but Part B will add `ring` to contacts that keep legacy voiced mappings (m09/m10 HaX).

**Fix:** in call mode, skip `type: 'call'` in `addMessage` (or filter rows out of `addMessages` when `isCallMode`). Add a test with a legacy voiced call on a contact with a row.

### m4. The "rows are not a conversation" filters are tested only by source text

`phone-call-log.test.mjs:227` matches the three filters with a regex. Changing any of them to `(msg.type !== 'call' || true)` fails only that regex, and no behaviour test notices.

**Failure scenario:** a refactor rewrites a filter, for example as a helper, so the regex test is deleted or updated. Then a contact whose first contact is a missed call never gets its opening preloaded. Its thread opens with no story start.

**Fix:** a harness test where a contact with a `start` opening and no thread declines a call, then opens the thread. Expect the opening line and choices, and no "story already has history" path. Drop or keep the regex test as a guard.

### m5. Untested wiring that the handover claims

- **`addCallRow` drawing into the open thread** (`npc-manager.js` `open.currentNPCId === npcId` and `row.read = true`). Removing the draw, the read mark, or the contact check passes every test. The case is real: A3 rings inside an open phone. Declining X while Y's thread is open must not draw X's row in Y's thread. Declining X with X's thread open must draw it and mark it read.
- **`giveUp`'s `{ missed: true }`** (`phone-ringer.js:493`). Five refused opens leave a "Missed call" row; removing the flag passes.
- **`PhoneChatHistory.markAllRead` marking rows read.** Only the live route covers it.

**Fix:** three harness tests, one per item.

### m6. Server hostile cases still untested

Mutations survive for:

- the knot pattern written `^…$` (no test sends a knot with a newline, such as `"ring_call\n<x>"`);
- no `finite?` check (send `answerSeconds: Float::INFINITY`, which is what JSON `1e400` parses to; expect the key dropped and no exception);
- `<>` in a `setGlobalOnStart` string;
- more than 10 `setGlobalOnStart` entries.

Add one assertion for each.

### n1. Dead `type` select

`when 'type' then value.length <= 20` can no longer be false. Remove it, or say in a comment that the `next` above it does the work.

### n2. The flat single-record shape has no source

No save ever held a flat `pendingCall`, and the ringer writes `{ forced, live }`. The server branch and the client conversion (`raw.disableClose ? { forced: [raw] } : { live: raw }`, untested) can go. If they stay, test the client branch.

### n3. Re-run `reload_ringing`

Re-run it with the current route (`sync_now` before `saved_server`) so the dump shows `live.state: "ringing"`. Optionally add a route that reloads with no sync, to prove the `pagehide` path on purpose.

### n4. Small test gaps

None of these is caught: the withheld reload row ("Missed call: No caller ID" after a reload), `reload: true` on the event, the `JSON.parse(JSON.stringify(...))` clone in `_phoneStateEntry`, the `_pendingCallResumed` once guard, a reload with two forced entries for one contact (the ringer tests cover `restore` with a list, but not through `_resumePendingCall`), the badge update and `gameTime` on a row.

### n5. For A6: a kept callback is overwritten by the ringer's next save

`_resumePendingCall` keeps `{ live: <missed> }` on `npc.pendingCall`. The ringer does not know about it, though, and `savePendingCall` replaces the field with the ringer's own slot on the next change for that contact: `restore()` of a forced entry in the same slot, or any new offer. The callback is then lost. A6 should either hold callbacks in the ringer or have `savePendingCall` merge the slot with a kept callback. A queued non-forced call made missed on a reload also never applies its `setGlobalOnStart`. Plan row 27 doesn't say whether it should; A6 or the plan should decide.

### n6. Rows use history slots

Rows count toward the 150-message cap on both sides, so a contact with many calls pushes old texts out sooner. That's fine for now. Mention it in the A7 README if call-heavy contacts appear.

## Still open from A3 R2 (for A4's fix round)

Not touched by A4. The code at the lines named in `REVIEW_A3_R2.md` is unchanged.

- **m1.** `close()` dropping a held offer's descriptor is untested. `phone-ring-in-phone.test.mjs:317` closes while connected. Hold the state (`openBlocked` true after the put-aside), assert `held`, call `close()`, and expect one `conversation_closed`.
- **m2.** The adapter's own drops in `reopen` are untested: `phone-ringer-dom.js:343` (something else opened first) and `:355` (`startMinigame` refused), unchanged at `56a9e74b2`. Add two harness tests, each expecting one `conversation_closed:<thread>`.
- **m3.** Two of `settleOnSeenLines`' guards are untested: the observer nulled during the read-ahead (needs a home knot with a synced `~` global), and the `classifyPhoneLine` prefix-stripped match (needs a `Narrator:` home line stored as type `narrator`).
- **n1.** `reopenDisplaced` ignores `suspended`. Keep the descriptor while suspended, reopen it on `suspend(false)`, and drop it in `close()`.
- **n4.** Reload test with a printing home knot that includes a `Narrator:` line: reload, ring, answer, End, open the thread, expect no second hub line. The live `settle` route covers only the plain case.
