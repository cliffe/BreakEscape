# SIMS-4 review, round 3: design and engine view, with live proof (and SIMS-3 round 5)

Branch `build/ol-sims` at ed0a5cd1f (fix commits ed270e239 to eaaf32f53, main's E7 to E9 merged).
Keyless server :3093 from the p-ol-sims worktree, headless chromium (SwiftShader WebGL for the
lighting runs), server and browsers stopped by PID after the runs. Every game is a fresh
`new-game.rb test_needs_sims` game. No need level was set and no trigger event was emitted: breaks
came from the scenario's own mappings, doors were walked through with `__test.enterRoom`, and every
conversation was opened, picked and closed in its UI.

| Game | What I ran |
|---|---|
| 4936 | `needs-sims-staff-room.mjs job_beat` (GL=1), the tool as committed |
| 4937 | `needs-sims-staff-room.mjs boiler_cross`, the tool as committed |
| 4938 | `reload-probe.mjs` (mine): first visit heard out, settle, light reported to Neil, job-called exchange, Jodie asked "Will you see to that light?" mid-break, **reload before she reached the lockers**, re-entry, the locker trip and fix, a 35 s wait, a second reload |
| 4939 | `neil-r4.mjs` (the round-4 SIMS-3 script, unchanged): ask, X close, reopen, take, X-path reopen, mid-reply X close, goodbye path, reload |

Scripts, reports and screenshots: scratchpad `officelife-sims/s4-review-r3-design/`
(`report-sr-job_beat-4936.json`, `report-sr-boiler_cross-4937.json`, `reload-4938.json`,
`r4-4939.json`, `sr-*-4936.png`, `sr-*-4937.png`, `rl-*-4938.png`, `r4-*-4939.png`,
`crop-lockers-icon-4936.png`, `validator.txt`). No setup failures.

Node tests: `bin/test-js test/js/npc-needs-sims-mappings.test.mjs test/js/npc-needs-sims-validator.test.mjs test/js/npc-needs.test.mjs`,
3 of 3 files pass. Validator on test_needs_sims: 0 errors, 34 warnings.

## Verdict

SIMS-4: the job beat now reads true and is reliable. In every run I made Jodie took the job in the
exchange, finished her tea, walked to the lockers 14 s later, and the light variant switched as she
finished. The reload between the exchange and the fix heals itself as the README says. The crossing
counts are honest, `talkNeil` fails a run without a real close event, and the speech-lock beat
proves what the README now claims. Five minors remain, none blocking. **Ready to close after the
minors**; no further design round needed for SIMS-4.

SIMS-3: round 4's M1 and m1 are closed. Neil's ready line follows the page on every path tried,
with no new stuck branch. **Ready to close.**

| Slice | Blocker | Major | Minor |
|---|---|---|---|
| SIMS-4 | 0 | 0 | 5 |
| SIMS-3 | 0 | 0 | 0 |

## Live results

**Job beat, 4936 (tool).** Settled 127 s; Neil close at 154.75 s on the first attempt; Keith's
start 2 s later, Jodie's 2.5 s after him; no `firstVisit` entry in the window.
`exchange_job_called` complete, 4 of 4 lines overheard ("That light in here still flickering?",
"Neil's put it out on the radio.", "That'll be one for you, Jodie.", "Once I've finished this,
aye.", `sr-job_beat-01-in-staff-room-4936.png` shows Keith's line over the pair at the boiler).
Jodie's locker start came 14.3 s after the exchange, at the end of her tea, and `npc_used:staff_lockers`
was hers. While she stood there the variant was still -1 with one faulty panel; after she finished,
`job_cleared` was true, the variant was 0, there was no faulty panel and the minimum level over 6 s
was 1.0. Her reply was "Aye, I swapped the tube. No more flickering. Cheers for flagging it.". The
next (private-office) cooler break played `exchange_job_cleared` 3 of 3 overheard. `see_light_fixed`
and `hear_job_cleared` both ticked. On the crossing itself, 2 pool lines were heard and none spoken
unheard.

**Boiler crossing, 4937 (tool).** Settled 127.8 s, close at 153.75 s, Keith 2 s later and Jodie
2.5 s after him (pair true). 3 pool lines heard ("Dull shift, touch wood.", "Needed that, me.",
"Proper brew, this."), 0 spoken unheard, 5 picture turns, no exchange left over for the crossing.
That matches README step 4 ("about three of their own `staff_tea` lines").
`sr-boiler_cross-01-in-staff-room-4937.png`: the pair together at the boiler.

**Reload between the exchange and the fix, 4938 (probe).** The exchange was overheard in full and
Jodie's `upkeep` dropped to 0 while she was still using the boiler. Asked mid-break, the hub offered
"Will you see to that light?" and she answered "Aye, spare tube's in my locker."
(`rl-5-jodie-see-to-light-4938.png`). After the chat she was still on her tea. I reloaded before she
left the boiler. After the reload `heard_exchange_job_called` was true and `job_cleared` false (the
`hear_job_called` task's sync had carried the marker), and the player was back in the office. On
re-entering the staff room, the `room_entered:staff_room` mapping sent her straight to the lockers
(use start 28.75 s). Keith's re-armed first-visit tea started 2 s later, and she joined him only
after the fix. `job_cleared` was then true, with variant 0 and no faulty panel
(`rl-7-jodie-at-lockers-4938.png`). After 35 s and a second reload, `job_cleared` was still true and
the light loaded steady. So the README reload note (README:150) holds on the path that matters.

**Neil, 4939 (SIMS-3).** Same chat: "Soon as you let me get back to it, pet." After an X close, on
the tray: "It's on the copier tray, pet. Help yourself." After an X close, a take and an X-path
reopen: **"You've got it already, pet."** (was "Soon as" in 4608;
`r4-D-ready-after-take-xpath-4939.png`). A mid-reply X close reopened on "Back again? What's up?".
The goodbye path and the post-reload path both gave "You've got it already, pet.".

## Is the job beat true and reliable?

- **Can it fire early?** No. The `upkeep` drop hangs on `npc_exchange_heard:exchange_job_called`.
  The engine emits that only when at least one line was overheard (`_finishExchange`,
  `npc-needs.js:2885-2895`), and it writes `heard_exchange_job_called` just before the emit. The
  exchange is gated on `job_called`, which Neil only offers after `staff_room_seen`. `upkeep`
  decays at 0.01 a minute, which is 5000 minutes to its `urgentAt` (validator line 92), so nothing
  else sends her.
- **Can it never fire?** Not on any path I found. An exchange spent to an empty room stays unplayed
  and replays later in earshot. An exchange cut after one overheard line still counts as heard,
  so she goes. A reload in between is healed by the re-entry mapping (4938). A chat with her
  mid-break only freezes the job, and she still went (4938). The minor risk is a reload that loses
  the heard marker but keeps the onceOnly drop key. Both travel in the same sync, which the task
  completion forces, so I could not make it happen. If it did happen, she would go on the next
  staff-room entry, not at once.
- **Does it read true?** Mostly. "That'll be one for you, Jodie." then "Once I've finished this,
  aye." followed by her finishing her tea and walking to her locker is a clear cause and effect, and
  the hub lines now match who did the job. The weak points are what the screen shows at the moment
  of the fix (m1, m2).
- **New lines.** All five are one line each, at most 40 characters, with no `{ }`, and they sound
  like their speakers ("aye" for Jodie). They fit. They still need TTS (owner item, as logged).

## Round-2 and round-4 findings, checked

| Finding | State | Evidence |
|---|---|---|
| S4 R2 design M1 (crossing counts measured the first-visit exchange) | Closed | `needs-sims-staff-room.mjs:196-202` (`firstVisitHeard` waits for `exchange_waiting`), `:173-191` (`crossing` counts only Keith's and Jodie's turns at the object from the close or office entry, pool and exchange apart, unheard counted apart, pair from use starts after the close). 4937: 3 heard, 0 unheard, no exchange; 4936: exchange lines listed apart from pool lines. README:113 and :146 now say about three, and two or three, lines. |
| S4 R2 design M2 (job-cleared beat contradicted the screen) | Closed (two minors on presentation, m1 and m2) | `scenario.json.erb:1130-1138` (lockers), `:1206` (`upkeep`), `:1223-1227` (task, drop, re-send, fix, cleared task); `jodie.ink:21-28`, `:52-66`. Live 4936 and 4938 above. |
| S4 R2 design m1 (tour lacked the light) | Closed | README:104, :110-113. |
| S4 R2 design m2 (stale README rows) | Closed | README:947 (4570 explained and superseded), :955 (4369 corrected), :987 (round-0 table marked history), the old speech-lock row marked superseded. |
| S4 R2 design m3 (no flicker frame) | Owner item, accepted | README:966. |
| S4 R2 design m4 (node test tested its own lambda) | Closed, with a narrower residue (m4 below) | `test/js/npc-needs-sims-mappings.test.mjs` uses the real `_setupEventMappings` and `_mappingWouldFire` on the scenario's own mappings. The chained-break case asserts no return home between starts (`npc-needs.test.mjs`, commit 20682cd6e). |
| S4 R2 server m1 (`job_cleared` reload) | Closed in docs and proved | README:150, plan 5.4 Sync (:393). 4938: `job_cleared` survived a reload 35 s after the fix. |
| Probe race behind 4570 | Closed | `needs-sims-staff-room.mjs:125-142`: a close counts only on a new `conversation_closed:neil` after the call, with one retry after the sip, else `setupFailure` (exit 3, `:143-148`). Both my tool runs closed on attempt 1. |
| Speech-lock beat re-scoped | Closed | `:409-483` wraps `_speak` and `_pickBark`; the lock is taken only by a spoken line (`npc-needs.js:2772-2773`), and a needs chat holds it only for an overheard line (`:4410`). So "0 staff-room lines spoken, 0 office turns blocked" proves the README claim at :967 that a pair out of earshot holds no lock against the pair the player hears. That claim is narrow, and the README says so. |
| S3 R4 M1 (ready line after X close) | **Closed** | `neil.ink:37` (reset at the top of `hub`, which only reopens reach: `start` and every reply divert to `hub.choices`, `:29`, `:47`, `:60`), `:51-52` (`neil_page_taken` first). 4939 D step. No new stuck branch: a reopen inside the 6 s delay now falls through to "Have a look on the copier tray, pet. It'll be there if it's come through.", which is true, since the delayed print waits for the open chat to close (`npc-manager.js:925-930`). |
| S3 R4 m1 (bare `setGlobal` docs) | **Closed** | `scenario.json.erb:613-614` comments, README:65, plan:371, build log. No "client-only" or "does not sync" claim remains for these mappings. |

## Minor (SIMS-4)

### m1. Jodie's locker trip shows a blank action icon

- **Site:** `scenarios/test_needs_sims/scenario.json.erb:25-27` (`actionIcons` has only
  `lounge_kettle`); engine context `npc-needs.js:122` (`NEED_ICONS` has no `upkeep`) and
  `npc-action-icons.js:84-89`, `:146-150` (key order: target id, need, `satisfies`, type, then
  `fallback` '•').
- **Evidence:** 4936 and 4938. Over Jodie's head at the lockers, a white backing holds a single dot
  (`crop-lockers-icon-4936.png`, `rl-7-jodie-at-lockers-4938.png`). Every other break shows a cup
  or water picture. That frame is the one the tour sends the player to watch, and the blank box
  reads as a missing asset.
- **Fix (data only):** add `"staff_lockers": "icon:npc-work"` (or another existing 16x16 icon) to
  `actionIcons`. Note it in the README light-job paragraph. Put a tube or toolbox icon on the art
  request list.

### m2. The light steadies while Jodie stands at her locker, and the swap her lines claim is never shown

- **Site:** `scenario.json.erb:1226` (the fix fires on `npc_used:staff_lockers`); `jodie.ink:27`
  ("Aye, I swapped the tube."); `exchange_job_cleared` "New tube. Should last a while."; README:104
  and :112.
- **Evidence (4936):** the variant switches at the instant her locker use ends. She is at the west
  lockers at that point, not under the faulty pool, which is random on each load (`lighting.js:706`).
  The flicker it ends is close to invisible at game zoom (R2 m3, owner item). So what a player
  actually sees is "she goes to her locker, the task ticks". The README is honest about this
  ("not animated ... the light steadies as she finishes at the lockers"). The ink is less so: two
  later lines say she swapped the tube.
- **Fix (pick one):** (a) the cheapest truthful wording: her reply becomes "Aye, sorted. Spare tube
  from my locker." and the task title says she "fetches a tube and sorts the light". (b) A second
  stop, still data only: `npc_used:staff_lockers` drops a second need, met by a stand-in at the room
  centre, and `job_cleared` moves to that second use, so she is at least under the ceiling when the
  light changes. Add a stepladder prop to the art requests. I would take (a) now and leave (b) to
  the owner with the stepladder request.

### m3. The plan still describes the round-1 light job

- **Sites:** `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:245` (3.4: `exchange_job_called`
  "3 lines"; "`job_cleared` is set in Jodie's ink on a later visit"); `:377` (5.4 step 2: jodie.ink
  "with a later 'Did that light get sorted?' that sets `job_cleared`"); `:381` (5.4 Objectives
  lists five tasks, with no `see_light_fixed` or `hear_job_cleared`); 5.4 Spoken lines (no mention of
  the five lines this round added or changed). The plan names no `staff_lockers` object or `upkeep`
  need anywhere outside Sync.
- **Impact:** m02's copier reads the plan first and would rebuild the dialogue-click fix that R2 M2
  removed.
- **Fix:** bring 3.3, 3.4, 5.4 step 2, Objectives and Spoken lines into line with the scenario. Mark
  the change "S4 R2 M2".

### m4. The mapping test stops at the condition check; the action half is stubbed

- **Site:** `test/js/npc-needs-sims-mappings.test.mjs:46-52` replaces `_handleEventMapping` with a
  copy of its bookkeeping, then finds the "fired" mapping by matching JSON (`:51`). The real handler's
  action half never runs: `config.needs` reaching `window.npcNeedsSystem.control` (`npc-manager.js:1581-1582`),
  `setGlobal` writing `gameState.globalVariables` (`:1442-1455`), `completeTask`, and the `persist`
  flag on onceOnly keys (`:1431`). The header (`:1-3`) says the test runs "NPCManager's real
  mapping path", which is more than it does.
- **Impact:** small. The conditions and onceOnly are tested through the real code, and the action
  half is proved live (4936, 4938). A renamed `needs` field in `_buildMappingConfig` would still
  pass this test.
- **Fix:** let the real `_handleEventMapping` run, with `window.npcNeedsSystem = { control: (id, c) => calls.push([id, c]) }`
  and a stub `window.objectivesManager.completeTask`. Assert the control call (`['jodie', { set: { upkeep: 0 } }]`),
  `gameState.globalVariables.job_cleared === true` and the task id. Then drop the JSON lookup.

### m5. A new validator warning for the two onceOnly handlers on the job-called exchange

- **Site:** `scenario.json.erb:1223-1224` (Jodie's mappings 4 and 5, both on
  `npc_exchange_heard:exchange_job_called`, both `onceOnly`); validator warning 12 in
  `validator.txt`. The build log's "34 warnings" hides it, because round 1's `fireOnlyWhenLoaded`
  fix had taken the count to 33.
- **Fix:** merge the two into one mapping (`completeTask: hear_job_called` plus `needs.set.upkeep 0`,
  no condition). `job_cleared` can only already be true here if the heard marker was lost and the
  cleared flag kept, and then the task is already ticked and an extra locker trip does no harm.
  Otherwise, note the warning as intended in the README validator line.

## Notes, not counted

- `exchange_job_called` opens with Jodie asking whether the light "in here" is still flickering,
  while she sits under it. This is from round 1 and is a reasonable small-talk opener; "That light's
  still at it." would read a touch more naturally if the line is revoiced anyway.
- After a reload in the gap, Keith's re-armed first-visit tea starts 2 s after Jodie leaves for the
  lockers, so his tea starts alone and she joins after the fix (4938). It reads as "job first",
  which suits her.
- Jodie's hub gives no top line on an X-close reopen (her hub has no re-entry line, unlike Neil's).
  Not raised in earlier rounds and not checked here.

## Not yet checked

- A natural (non-tool) 20-minute run with the light job in it, to see whether the locker trip ever
  falls within a minute of the microwave or a cooler break. The `upkeep` drop only happens on the
  exchange, so this is low risk.
- Jodie's locker trip while the player is in another room (needs tick for every registered NPC,
  so expected to work, but not watched).
