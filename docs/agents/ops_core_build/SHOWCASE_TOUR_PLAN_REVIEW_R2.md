# Showcase tour plan: review R2

Reviewer: design review round 2 (read-only except this file). Plan: `SHOWCASE_TOUR_PLAN.md` at `0ec10da9a` (branch `ops-showcase-tour`). Checked against the code and scenarios in `/data/be-ops-follow`. Main has moved on to `b97e2f9c0` (gem 1.0.25), but the files cited below have not changed since `537dbd52c`. Only the passwords and second-step PLAYTEST files changed. No SecGen XML, realism catalog file or field guide was opened.

**Verdict: not clean.** No blockers, 3 majors, 7 minors.

R1's six majors are fixed in the text, and five of them are fully closed. The fix for M5 opens a new dead end (N3 below). R1 m1 is not closed: the bark it names cannot fire (N1). The audio rules are followed. The build units are disjoint. "Start here" is safe. What is left: one lever does not do what the plan says and the bark that goes with it never fires; the Terminal token's clock makes two beats easy to miss for good; and one hub lever can make three passwords beats unreachable.

## R1 findings

| R1 | Status | Checked |
|---|---|---|
| M1 unplug ticks | Closed | `unplug()` emits `network_device_unplugged` with `endedPcIds`, and also emits it with the jack suffix (`network-links.js:604-608`, `_emit` at `:168-176`). `unplugFromView` calls `unplug()` (`:563-567`). See m1 below for the kitchen port. |
| M2 order | Closed | The second step table matches the panel (`scenario.json.erb:199-251`). The rule allowing tasks to be reordered inside an aim is stated in 2.1.2. |
| M3 token source | Closed | The token's proof is a foothold, and its row is routed through that foothold (`credential_keyring.rb:497-508`). |
| M4 T11 order | Closed | A token session stores its foothold (`credential_login.rb:99-103`), so it answers `needs_console` while it is live (`network_access.rb:513-516`). See N2 for the clock. |
| M5 collect ticks | Closed as written, but opens N3 | |
| M6 two databases | Closed | 2.7, U6, 4.5 and 5.2 all agree. |
| m1 screen-lock bark | **Not closed** | The bark event is wrong. See N1. |
| m2 R7a/R7b | Closed | `noteTechniqueSession` records `npcId` and emits `pc_signed_in` for a step up (`pc-sessions.js:742-769`, `:1003-1006`). The grants name `agnieszka_duda` and `graham_whitfield` (recon `scenario.json.erb:706`, `:712`). |
| m3 to m7 | Closed | |
| m8 gates | Closed | Minor m4 below covers a remaining gap in T10. |

## Findings

### Major

**N1. Darren's lock: the lever does not shorten the wait, and the bark never fires (2.6 Fixes; R1 m1).**
- `habits.screen.lockIfAwayOverSeconds` is not a timer. It is a threshold on how long a trip is expected to last, and it is checked once, when he leaves. A trip expected to last no longer than the threshold leaves the screen open; a longer one locks it then and there (`workstation-state.js:80-83`, `:155-157`, `onLeft` `:536-554`).
- So lowering it from 90 to 50 does not make the lunch lock come sooner. It does risk locking his coffee trips, which M8 and M12 need open.
- A lock at the leave emits `workstation_owner_left` and `workstation_screen_changed` (how `leave`). `workstation_auto_locked` fires only on three paths: the policy's `lockAt`, the object's `autoLockSeconds` (`_autoLock`, `:473-479`), and the guest locks at `:312` and `:391` (both `guest: true`). `darren_pc` has none of these: the `floor` policy is `{ "mfa": "push" }` (`scenario.json.erb:53`), and the object has no `autoLockSeconds`. So the "Darren's screen has locked" bark cannot fire.
- The `<pc>_screen_locked` global for an owner's station is written by `_publish` (`:531`), not `:290` (that is `_publishGuest`).
- Fix:
  - Bark on `global_variable_changed:darren_pc_screen_locked` with `data.value === true`.
  - To cut the wait, give `darren_pc` an `autoLockSeconds` (its clock starts at the leave and it does emit `workstation_auto_locked`). Leave the threshold at 90, or probe which of his lunch leaves locks the screen and tune that.
  - Measure the coffee-trip window again, because M8 and M12 depend on it.
  - Drop the open probe about "which of the two emits fires": the code shows neither does.

**N2. The Terminal token's clock starts at the plug-in, so T3 and T11 can be lost for good (2.4).**
- The clock starts when the proof foothold is first gained (`start_token_clocks!`, `credential_keyring.rb:163-167`, `:220-229`). It only ever grows, and "a re-plant never restarts a clock".
- With `expiresMin: 3`, the player has three minutes from T1 to do all of this: hear the T1 and T2 barks, type a sweep, walk to the backup PC and sign in (T3), then plug the keystroke device in (T11).
- A teacher who stops to read the Terminal misses the window. After that, T3 and T11 can never tick, and nothing gives the token back (the token answers `expired`, `pc-sessions.js:167`).
- The plan leaves "when its clock starts" to a probe, but the code above already answers it.
- Fix:
  - State in 2.4 that the clock starts at the plug-in.
  - Raise `expiresMin` to about 5 or 6. T10 still lands well inside the 12 minutes.
  - Have the T1 bark say to use the token now.
  - Give the beat a way back, or state that there is none and write the restart in PLAYTEST. For example, Ama could offer a fresh token (a second token proved by a second server-room port) only when `token_ran_out and not use_token_done`.

**N3. Passwords: switching Jun's PC off before the first collect makes P11a, P11c and P12 unreachable (2.5).**
- Jun's PC can be switched off at any time before the evening: from Ama's hub (`ink/ama_owusu.ink:111`) and at the wall socket (`scenario.json.erb:558-579`).
- If the borrow happens first, the new P11a choice (gate `hot_desk_signin_done and not see_borrow_done and not collect_hot_desk_done`) is never offered, so `collect_hot_desk` never ticks.
- P12's choice is gated on `collect_hot_desk_done` (`:107`), so it never ticks either. P11c's gate also needs `collect_hot_desk_done`.
- The "Call it a day" gate then lets the player through only by skipping.
- Fix:
  - Gate P11a on `hot_desk_signin_done and not collect_hot_desk_done`. Choose its line with an inline conditional on `see_borrow_done`; both versions are fixed strings and both are voiced.
  - When the borrow came first, tick `collect_after_borrow` in the same knot, so both collects are done (that collect named two records, so no Crack button).
  - Also gate the hub lever "Switch Jun's PC off." on `collect_hot_desk_done`, so the guided order is the easy one.

### Minor

**m1. Recon R8c assumes the hot desk port.**
- `plug_in` also ticks at `kitchen_jack` (`scenario.json.erb:499`). The R8c pointer says "Go back to the hot desk port", and the tick is on the `hotdesk_jack` suffix only.
- The once-only mapping that is changed in place also fires on any earlier unplug at the hot desk. R1's own pointer ("If Jun comes back...") invites that, so `unplug` would tick in the morning and its line would play out of order.
- Fix:
  - Add a condition to that mapping in place (for example `globalVars.open_share_done === true`).
  - Append a mapping for `network_device_unplugged:kitchen_jack` with the same condition.
  - Word the pointer for "the port your box is in", using an inline conditional on a global set by the kitchen plug-in.

**m2. The keystroke socket's shape is miswritten.**
- The plan has `grant_foothold` with `needsSession: backup_pc`. The source it copies uses `{ "type": "grant_foothold", "pc": "bay_pc", "needsSession": true, "needsHeld": ... }` (`test_ops_privilege/scenario.json.erb:486`).

**m3. Several ticks are not named.** Name them so the builder does not invent them:
- T1: `network_foothold_gained:rack_jack`.
- T2: `network_swept`.
- T3: `pc_signed_in:backup_pc` with `data.token === true` (`pc-sessions.js:1003-1006`).
- T6: confirm globals, as recon's `confirm_both` does.
- T7: `pc_signed_in:file_server` with the technique and Graham's `npcId`.
- T9 and T9b: the relay sign-in and the relay sign-out, and which one ticks `shared_screen`.
- P8b `stick_override`: a global set in the plant's `onConfirm`, as `survey_stick_in` (`test_ops_privilege` `:591`). The client refuses before `onConfirm` unless the session mirror says admin (`interactions.js:1110-1121`).
- M0: `pc_in_use:lorna_pc` (`pc-sessions.js:984`).

**m4. T10 depends on a session that is still held when the token runs out.**
- `token_ran_out` is set only from `pc_signed_out` with reason `token_expired`. That event fires only if the client still holds the session when the timer ends (`pc-sessions.js:445-451`, `:1110-1123`).
- A player who signed out of the backup PC first never gets the pointer or the tick.
- Fix: also set `token_ran_out` and tick on `pc_signin_failed:backup_pc` with `data.reason === 'expired'` (`:813`). Offer the T10 pointer after T9 regardless, with the words "try the token again".

**m5. The M12 pointer does not say how to find Darren's screen open.**
- The desktop form needs him away on a short trip. Add "Send them for coffee first." (This depends on N1's re-measure.)

**m6. The base is stale.**
- Line 5 says the hardening branch "lands first". It is now on main (`802f89cdf`, `2afca8969`, gem 1.0.25).
- The passwords and second-step `PLAYTEST.md` changed on main (18 lines), so PLAYTEST line citations taken before then may be off by a line or two. Say so, and merge main before U2 and U3.

**m7. Recap and bark share text.**
- P6b now says the existing recap line as a bark too. That is fine for cost, because the same text, voice and style give one clip key.
- The dialogue review should still check that "What did that show?" does not just repeat every bark word for word (2l concision).

## Holds (checked)

- **Coverage:**
  - Every A18 to A25 and N13 to N16 feature in sections 1.1 to 1.4 is shown in a guided beat, or is listed in 1.6 with its test scenario.
  - The Terminal console lists a module for every aliased finding, decoys included (`terminal-grammar.js:168-185`), so the T5 line is true.
  - The whole-verb rule is at `:262-263`.
  - `network_service_checked` exists (`network-view-minigame.js:1069`).
  - The hot desk caches Niamh, then Jun after the borrow (passwords `scenario.json.erb:549`), so P11a and P11c each name one record.
  - The override row is written for any admin session at the port's PC (`capture_proofs.rb:195-217`).
- **Realism:**
  - The rule "each entry linked once" applies within one scenario (`validate_realism_skin.rb:494-499`), so linking the entries from `demo_ops_terminal` as well as from `test_ops_skin` is allowed.
  - The freeze applies once a folder whose name does not start with `test_` links an entry (`validate_realism_catalog.rb:356-361`).
- **Audio (tts-audio SKILL rules 1, 2, 5, 7, 8, 9):** the plan follows them.
  - Audio is generated last, after the 2l concision check.
  - No printed variables, and U5 extends the test to the showcases.
  - No stage directions, and `#delivery:` tags never go inside inline conditionals.
  - The owner approves the spend.
  - Voice changes and their clips go in one commit.
  - Drafts run on a keyless server.
- **Voices:** every voice name and accent in 3.2 matches the character's first voicing in `demo_access_tour` or `office_life_showcase`. After the changes, no showcase has two speakers on one voice.
- **Build units:** U1 to U4 own disjoint folders and tests. U4 alone regenerates the realism index. U5 and U6 own one file and new files respectively. The orchestrator owns the shared docs.
- **Start here:** keyless server and swap only. The swap aborts if the Mission count changes (`swap-scenario-game.rb`). Mission rows (U6, either database) and the gem bump wait on the owner's yes. There are no seeding, schema or db tasks.
