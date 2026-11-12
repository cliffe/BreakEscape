# Review: A4 round 2 (thread rows and phone state), with the A3 R2 carry-overs

**Verdict: accept.** 0 blocker, 0 major, 2 minor, 3 nits. Every R1 minor and every A3 R2 carry-over is fixed as `REVIEW_A4_R1_OUTCOMES.md` says, and the new tests fail when I break the code they cover, with the three small exceptions listed below. The delete marker gives a hostile client nothing it did not have. The debounced sync adds no real server load and does not race the `pagehide` flush. Lab SE is unchanged. This is A4's round 2 and A3's round 3 (light check). A3 can close.

Reviewed at `946647c12` (fixes `6e32014c6` … `0cd5fc3c1`). A5 has since committed `53ca95679` on top; I did not review it. Runs were in a detached temp worktree at `946647c12`, now removed. Node: `phone-call-log` 19/0, `phone-call-persistence` 25/0, `phone-call-rows-not-conversation` 5/0, `phone-ringer` 122/0, `phone-ring-in-phone` 31/0, `phone-ring-home-hub` 13/0, `phone-reload-home-hub` 1/0, `phone-ring-suspend` 7/0, `phone-ring-hold` 21/0, `phone-outgoing-call` 50/0, `phone-player-lines` 22/0, `finale-voiced-calls` 20/0. Rails `game_phone_calls_state_test.rb` 29 runs, 113 assertions, 0 failures (under `flock /tmp/be-test-suite.lock`). One live run on a keyless server on :3024 from that worktree, stopped afterwards (section 4).

## 1. R1 items and A3 carry-overs

| Item | Fixed as the outcomes say | Test catches a regression |
|---|---|---|
| m1 debounced sync | yes (`phone-ringer-dom.js` `savePendingCall`) | yes for "no sync", "no debounce", "sync at once"; the dedupe is not tested (n1) |
| m2 marker, client | yes (`exportPhoneState`) | yes: never sent, always sent, sent without the `pendingCall` key |
| m2 marker, server | yes (`merge_phone_state!`) | yes for the branch removed, `elsif true` and the `key?` check dropped; the `nil?` check is not tested (n2) |
| m3 rows on call screens | yes (`PhoneChatUI.addMessage`) | yes |
| m4 filters | behavioural now (`phone-call-rows-not-conversation.test.mjs`) | yes: `\|\| true` in the minigame filter and in each preload filter (lines 863 and 910) are all caught by the new file alone |
| m5 drawing, contact check, `giveUp`, `markAllRead` | tests added | yes, all four |
| m6 hostile server cases | tests added | yes (outcomes' mutations; I re-ran the suite green) |
| n1 dead select | kept with a comment | fine |
| n3 `reload_ringing` | re-run | `proofs/A4_r1/reload_ringing_server.json` shows `live.state: "ringing"` |
| A3 m1 close while held | test holds the state | yes (drop removed from `close()`'s loop) |
| A3 m2 adapter reopen drops | 2 tests | yes, both drops |
| A3 m3 settle guards | fixture + 4 tests | yes: observer left on (home-hub 11/2), prefix match removed (home-hub 12/1, reload 0/1) |
| A3 n1 `reopenDisplaced` and `suspended` | yes (`keptDisplaced`) | yes for no keep, no reopen on `suspend(false)`, no drop in `close()`, double drop in `close()`; not for a list left uncleared on `suspend(false)` (m2) |
| A3 n4 reload test | `phone-reload-home-hub.test.mjs` | yes |

The m4 test lifts `openConversation` out of the minigame source and runs it with stubbed `PhoneChatConversation` and `PhoneChatHistory`, as `phone-chat-close-race` does. That is weaker than the R1 ask (decline then open in the harness and see the opening), but the two preload filters are tested with real ink and every `|| true` mutation fails, so it does the job.

## 2. Mutations (each restored from a saved copy; the tree was clean after)

| Mutation | Result |
|---|---|
| `savePendingCall`: no sync call | caught (persistence 23/2) |
| no `clearTimeout` (a burst syncs more than once) | caught (23/2) |
| sync at once, no timer | caught (23/2) |
| **no dedupe (`slotSent` compare removed)** | **survives** (n1) |
| **`slotSent.set` removed** | **survives** (n1) |
| `exportPhoneState`: marker never sent / always sent / without `pendingCall` | caught / caught / caught |
| server: marker branch removed | caught |
| server: any empty entry deletes (`elsif true`) | caught (error in the "without the key" test) |
| server: `key?('pendingCall')` dropped | caught (same test) |
| **server: `nil?` dropped (any `pendingCall` that cleans to nothing deletes)** | **survives** (n2) |
| `addMessage`: call rows drawn on call screens | caught (call-log 18/1) |
| `addMessage`: every non-row line skipped on call screens | caught (18/1) |
| `reopenDisplaced`: no keep while suspended | caught (in-phone 29/2) |
| `suspend(false)`: kept descriptors not reopened | caught (30/1) |
| `close()`: kept descriptors not dropped / dropped twice | caught / caught |
| `close()`: a held offer's descriptor not dropped | caught (30/1) |
| **`suspend(false)` reopens the kept list but does not empty it** | **survives** (m2) |
| adapter `reopen`: blocked, no drop / refused, no drop | caught / caught |
| settle: observer left on / no prefix-stripped match | caught / caught |
| `addCallRow`: no contact check / no read mark | caught / caught |
| `giveUp` without `{ missed: true }` | caught (call-log 18/1) |
| `markAllRead` skips rows | caught |
| minigame / preload filters `\|\| true` (three) | caught (all three) |
| n4 still open: reload row not withheld, no once guard, no `reload: true` | survive (expected; left open in the outcomes) |

## 3. The questions in the brief

**Can a hostile client use `{ history: [], pendingCall: null }` to delete another contact's state, or anything else?** It can delete any one entry of its own game's `player_state['phoneState']` (thread, story position and slot), for any id of up to 100 characters. That is nothing new. Before the fix the same client could replace any entry with a one-line junk thread (`{ history: [{ type: 'npc', text: 'x' }] }`), which wipes the thread and story just as well. The server reads `phoneState` for one thing only: to hand it back to the client on load (`games_controller.rb:375`, checked with `git grep` over `app/` and `lib/`). No objective, score or lab SE check reads it. The delete runs inside the merged `phoneState` hash and cannot reach any other key of `player_state`, and the game itself is still authorised by the controller as before. The cap check runs after the delete, so a delete can only shrink the state. Nothing to fix.

**Does the debounced sync add server load in a long ring?** No. `syncSave` runs only at state changes (offer, ringing, held, connected, end, restore), never on the tick, and `record()` holds no timer or counter. A ring that runs its full length costs two syncs (slot set, slot cleared). The worst case is the refused-open loop (held to connected and back every `RETRY_OPEN_MS`), which `giveUp` ends after `MAX_OPEN_REFUSALS` and 8 s, so a handful of syncs. A held call behind a popup does not save while it waits. `stateSync.sync()` already queues one run behind one in flight and shares it, so a burst cannot stack requests. Against the 30 s tick this is noise.

**Does it race the `pagehide` flush?** No. `markPhoneStateSynced` runs only on a 2xx, non-stale answer, so an entry whose sync is still in flight at unload is still unconfirmed and the flush sends it too. Both requests carry `clientTs`. `phoneState` is a last-write-wins section, and the server skips those sections on a request older than the newest it has seen (`stale_sync_request?`). So if the in-flight sync lands after the flush, it is ignored; if it lands first, the flush overwrites it with the same or newer data. A change in the last 500 ms before unload still rides only on the flush, so the R1 m1 hole (flush over its size limit) stays open for that half second. That is acceptable.

## 4. Live check (:3024, keyless, headless)

The `ringing_autosync` proof folder holds the session log but not the `rails runner` output that showed the slot on the server, so I re-ran the case with the flush taken out. Game 1850 on `test_phone_calls`: clear `caller_basic`, fire `ring_decline`, wait for the ring, wait 2 s. The server already held `caller_decline.pendingCall = { live: { state: "ringing", … } }` with no manual sync. Then I set `stateSync.flush` to a no-op, removed the `pagehide` listener and reloaded with no sync. After the reload: one unread "Missed call" row, ringer idle, client slot null. That proves m1 end to end: the slot reached the server through the debounced sync alone.

The same run shows m1 below. Five seconds after the reload, the server still held `pendingCall.live.state: "ringing"`, and the row was not on the server.

## Findings

### m1. A reload resume clears the slot without the debounced sync

`_resumePendingCall` (`npc-manager.js`) sets `npc.pendingCall` directly (`null`, or the kept callback). It never goes through the adapter's `savePendingCall`, so no sync is scheduled. The cleared slot and the new "Missed call" row reach the server only on the next 30 s tick or the unload flush. The live run above shows the server still holding the ringing slot after the reload.

**Failure scenario:** a non-forced call is ringing and the player reloads (row 27: missed row, `phone_call_missed` with `reload: true`). They reload again within 30 s with a phone delta large enough to push `phoneState` out of the flush (the R1 m1 condition). The server still holds the old slot, so the second load turns it into a missed call again, and `phone_call_missed:<npc>` fires a second time. Any mapping on it runs twice, and A6's `onMissed: callback` would queue two callbacks. The row is not doubled, because the server's thread does not hold the first one either. The case is rare (two reloads inside 30 s, plus an oversized flush), but it is the same hole R1 m1 closed for the ring, and A6 is about to hang behaviour off this event.

**Fix:** when `_resumePendingCall` changes `npc.pendingCall`, schedule the same debounced sync, either by calling `window.phoneRinger`'s adapter `savePendingCall(npc.id, npc.pendingCall)` or through a small shared `scheduleSlotSync()` exported from `phone-ringer-dom.js`. Test: after `loaded(w2)` with a fake `stateSync`, one sync within a second. The existing test `m2: a slot restored from the server and cleared by the reload resume is sent as cleared` checks only what an export would contain (and that contact has a row, so it never sends the marker). Its title promises more than it checks, so rename it or extend it.

### m2. `suspend(false)` emptying the kept list is untested

`suspend(false)` swaps `keptDisplaced` for an empty list before it reopens each descriptor. If a later edit iterates the list without emptying it, every test passes (mutation in section 2). The descriptor is then still held. A later `close()` drops it again (a second `conversation_closed:<thread>` for a phone that was reopened and will emit its own), and a second suspend/refuse cycle reopens it a second time.

**Fix:** extend the A3 n1 test: after `suspend(true)`, a call ends, `suspend(false)` reopens the phone. Then call `close()` and assert no further `conversation_closed` for that thread.

### n1. The slot dedupe is not tested

The test `m1: each slot change syncs …` says "the same slot saved again does not sync", but its burst puts two different slots inside one debounce window, so the count is 1 with or without the `slotSent` compare. Without the dedupe, every `syncSave` would schedule a sync even when nothing changed. Today `syncSave` runs only on changes, so the cost is small. Add one assertion: save the same slot twice more than 500 ms apart (call the adapter's `savePendingCall` directly) and expect no second sync.

### n2. The server's `nil?` check is not tested

With `entry['pendingCall'].nil?` removed, any entry whose `pendingCall` cleans to nothing (`{ history: [], pendingCall: { live: { knot: "bad\n" } } }`) would delete the saved entry. This matters little, given section 3 (a client can wipe an entry anyway), but the intent is "only the marker deletes". One assertion: such an entry leaves the saved slot in place.

### n3. Proof folders should keep the server read

`ringing_autosync` writes the `rails runner` output only to the terminal, so the proof folder cannot show the claim. Write the two server reads into `$OUT/ringing_autosync_server.txt` the next time the route runs.

## Remaining A4 nits from R1: which matter

- **n2 (flat `pendingCall` shape).** Doesn't matter. Nothing writes it, and both the client and the server handle it safely. Delete it in A7's tidy-up or leave it.
- **n4 parts.**
  - **`reload: true` on the event.** Matters for A6. A6's `onMissed` handling will want to tell a reload miss from a live one, so A6 should add this assertion when it hangs logic off the event.
  - **The once guard.** Matters a little, for the same reason as m1 above: a second resume would fire `phone_call_missed` again. Cheap to test along with m1's fix.
  - **Two forced entries through `_resumePendingCall`.** Worth one test. The ringer covers `restore` with a list, but the npc-manager filter in front of it does not have a test.
  - **The withheld reload row, the export clone, and the badge and `gameTime` on a row.** Don't matter. The withheld one is cosmetic and leaks no name. `_phoneStateSent` stores JSON strings, so a by-reference export does no harm there. The badge is covered by the live `rows` route.
- **n5 (a kept callback overwritten by the ringer's next save).** Matters, for A6. It is a real loss of a saved callback as soon as A6 writes `state: "missed"` slots. A6 must hold callbacks in the ringer, or make `savePendingCall` merge with a kept callback. m1's fix should go through the same path, so A6 can decide both together.
- **n6 (rows count toward the 150 cap).** README note only (A7).

## Lab SE

`proofs/A4_r1/se_dev/storystate_after_call.json` and `_after_reload.json` give `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`), the same as `A4/se_dev`. The four `/tts` lines in `A4_r1/se_dev/tts.jsonl` match `A4/se_dev/tts.jsonl` line for line. `se_phone_contacts.png` SHA-256 is `d30d40ce72a7…` in both. `history_after_reload.json` holds only `npc` and `player` types. Unchanged.

## For the next round

Fix m1 and m2, and the n1 and n2 assertions if convenient. n3 is optional. A round 3 can be a light check of those items alone. If the orchestrator would rather not spend another A4 round, m1 can move to A6, since A6 changes the same resume path for callbacks (n5).
