# Access model slice 9.2 plan: adversarial review, round 2

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md` as rewritten after round 1 (commit
`d1ca882b9`), against the code on the access design branch, against
`ACCESS_MODEL_SLICE_9_1_PLAN.md` (revised) and `ACCESS_MODEL_SLICE_9_3_PLAN.md` (in revision: the
file on the branch ends at line 544, in section 6, with a `PART3` marker; sections 7 to 17 are not
there yet), and against `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` where it shares files.

**Counts: 1 blocker, 7 majors, 18 minors.**

| Grade | Count | Ids | Sub-slices touched |
|---|---|---|---|
| Blocker | 1 | B1 | H |
| Major | 7 | M1 to M7 | A (M1, M2, M3, M4), U (M3, in part), B and H (M5, M6), C (M7) |
| Minor | 18 | N1 to N18 | all |

**Round 1:** both blockers resolved. Of the 15 majors, 11 are resolved and 4 are partly resolved
(M1, M10, M11, M12); each remainder is a new finding below.

**Verdict.** Sub-slice **U can be built now.** It has no blocker and no major of its own; the one
thing to change first is a sentence (the 9.3 implant check belongs to 9.3b, M3), and three small
gaps a builder would otherwise guess (N8). Sub-slice **A can be built after one revision pass of
the plan** that takes M1 to M4, N1 and N4. None of those needs the user, and none needs another
full review round: a short check of the revised sections 5, 9 and 15 is enough. The blocker is in
sub-slice H and does not hold up U, A or B.

## 1. Round 1 blockers and majors

Each was checked in the plan's new text and against the code, not against the reviser's summary.

| Id | Round 1 finding | Now | Evidence and remainder |
|---|---|---|---|
| B1 | A feed post's fact ships in the bootstrap | **Resolved** | 8.3: feed facts are deleted from `social.intelFacts` in the bootstrap and travel with the post; the validator forbids any second grant path; `grantFact` refuses an id the block lacks (`social-intel.js:191-196`, confirmed). The test for it is not runnable as written: see M7 |
| B2 | The sticky note designed two ways | **Resolved** | 6.1 and section 15 now match 9.1's 5.3 and 14.2 word for word: `written_down?`, `login_postit_for`, `hasPostit` in room data, the text only from `GET /login_accounts`, "<username> / <password>", `postitMarks.mark` |
| M1 | What a tampered client gains was understated | **Partly** | 9.3 now lists the gains, fails and eases are paced at 0.9 of the retry wait, a "done" waits for the dwell, a hand-over is spent once, each cause is checked. Remainder: the time formula is one period too long and is zero for the feature scenario's own values; three gains are missing from the list (M4); the room check on a heard login cannot work (B1) |
| M2 | The reach hook could not be supplied | **Resolved** | 5.1: no `network` in the plan, `routes` from `NetworkModel.reach_conditions`, `reachable(need, globals)`. It matches 9.3a's 4.2 (`ACCESS_MODEL_SLICE_9_3_PLAN.md:322-325`). One trap follows from it: N2 |
| M3 | `borrow_session` described two ways | **Resolved** | 6.4 gives one mechanism: a use job, the retry wait cleared, the session left whether or not the use was met, "done" on `npc_borrowed_session`, a 60 second start limit. Remainder: N3, N10 |
| M4 | A held player session masks the guest session | **Resolved** | 6.4, decision 8, beat H2: the NPC's sign-in ends the player's session with `reason: "displaced"`. Remainder: N10 |
| M5 | Request volume had no ceiling | **Resolved** | `settled`, `done`, one batched request every two seconds, 20 reports at most, a request budget per beat. Remainder: N11, N17 |
| M6 | A propped room's NPCs never recorded | **Resolved** | `serve_opened_room` factors the door unlock tail (`games_controller.rb:918-930`, confirmed) |
| M7 | Reload faults: `setGlobal`, `emit`, restore order | **Resolved** | The server sets a declared `setGlobal` (the `apply_task_set_globals!` path exists, `game.rb:3755`); `emit` is done only on confirmation; the reload map is applied in `register`. The state sync sends only changed globals, so a client that missed the answer does not overwrite the server's value. Remainder: N5, N18 |
| M8 | The USB policy reached every object | **Resolved** | `usbGoverned`: a workstation by its own fields (`workstation-state.js:72-76`, confirmed) or an object naming a `policy`; beat U3 |
| M9 | Stepped beats refused by the pace checks | **Resolved** | Section 11 point 4: paced beats are earned in real time; floors are per NPC and per need. Remainder: N12 |
| M10 | Build streams: orphan files, shared files | **Partly** | Every file inside the slice now has one owning stream, and the 9.1 and 9.3 table is right. Remainder: a fourth plan edits the same files and is not in the table (M6), and five names that cross between streams are not fixed (N4) |
| M11 | Frustration had no visible state | **Partly** | `tell`, the `blocked` icon held between failures, two tiers of mutter, a watch-it-happen run at the end of A. Remainder: the tell cannot fire before a workaround that comes on the first failure, which is every workaround in the feature scenario (M5) |
| M12 | `share_login` explained nothing | **Partly** | The heard answer carries the spoken line, a toast and an evidence note. Remainder: the server's "was the player in the room" check reads a value the browser never sends (B1) |
| M13 | The slice was too large | **Resolved** | Six sub-slices: U, A, B, H, L, C, each with steps, beats and streams |
| M14 | `roles` and the awareness default built by nobody | **Resolved** | 9.1 builds and reads `roles.<role>.awareness` (9.1's 14.2 agrees); this slice owns its three keys; the warning reads `NpcHabits.level_of` |
| M15 | Feed posts as password clues | **Resolved** | The shape is `feed.posts[]` in both plans; step C-2 adds both sources to `Clues.readable_texts`. 9.3's side cannot be checked yet (its section 12 is not in the file) |

Round 1 minors were not re-audited one by one. Those met while checking the above (N1 to N7, N9,
N11, N12, N14, N17 to N21) are answered in the new text.

## 2. What was checked in the code and holds

The line references in section 2 of the plan are right at this commit: `_completeJob` `:1047`,
`_select` `:788`, `_useCandidate` `:815`, `_carryCandidate` `:849`, `_claims` `:723`, `register`
`:228`, `_talking` `:1352`, `describe` `:1467`, `playerHears` `:1674` in `npc-needs.js`;
`WITHHELD_NPC_KEYS` `game.rb:3968` (it holds `workarounds`); the NPC loop `:3947-3950`;
`claim_login_session!` `:1446` (refuses a held session at `:1458`); `end_claimed_sessions!` `:1495`;
the lock list `games_controller.rb:88-89`; `login_accounts` `:1106`; `pcSessions.load` at
`core/game.js:1663`; the session-first click at `unlock-system.js:219-222`; `ownerReturned` ending
only claims (`pc-sessions.js`); the osint browser's `_socialView` and `selectBlock`; the schema's
`usb` and `social` enums; all art named. A hidden `revealOnGlobal` object is still a sprite, so the
wedge is a valid errand place. A world bubble draws a line with no partner
(`npc-world-bubbles.js:96-117`). `ApiClient.login(pcId, fields)` passes any `claim`, so the guest
claim needs no API client change.

One row of section 2 is true of the server and false of the game: `player_state.currentRoom` (B1).

## 3. Blocker

### B1. The room check on a heard login reads a value the browser never sends (sub-slice H)

**Evidence.** `POST /npc_workaround` check 4 (plan, routes table): a `share_login` reported as
heard counts only when "`player_state.currentRoom` is the room the `with` NPC is in; otherwise it
is taken as not heard". Section 2 says that key "is the room the browser last reported in a state
sync". The server code is there (`games_controller.rb:1581-1588`), but the browser's side is dead:
`state-sync.js:198` sends `window.currentRoom?.name`, and `window.currentRoom` is set once, to
`null`, in `main.js:58` and assigned nowhere else. The live value is `window.currentPlayerRoom`
(`core/rooms.js:3101`), which the sync does not read. So `currentRoom` on the server is the start
room for the whole game (`game.rb:4091`). Every honest heard share in any other room is answered
as not heard: no toast, no note, no capture. Beat H4 (`open_office`) cannot pass, and decision 5's
"room check on a heard login" protects nothing. Even with the sync repaired the value would be up
to 30 seconds old (`state-sync.js:126`), so a player who walked in just before Sam spoke would
still hear nothing.

**Fix.** Do not use `currentRoom`. The "done" request carries `room_id`; the server accepts
`heard` when that room is the `with` NPC's room and is the start room or in `unlockedRooms`, which
is exactly what the sync's own check would have proved (`games_controller.rb:1583-1586`). Say in
9.3 that this is a client claim bounded by "a room the player has opened", as `/login_accounts`
is. Correct the row in section 2. Do not repair `state-sync.js` inside this slice: sending the
real room would switch on the "Cannot enter locked room" refusal for every mission, which is an
engine change with its own risk; log it for the user as a separate fault.

## 4. Majors

### M1. An outage shows nothing until the NPC's work need next turns urgent, and the validator's time leaves that out (A)

**Evidence.** A use is judged only when it completes (5.1), and a use starts only when the need
is at or below `urgentAt` (`npc-needs.js:788-803`). Between uses the person sits idle at the desk.
With the plan's own example (`work: decayPerMin 6, urgentAt 50`, plan line 152) and the desk
preset's `restores: 60`, the period is about 8 minutes. A player who throws the breaker just after
a use waits up to 8 minutes for the first mutter, then `retryMin` plus the use time for each
further failure. The validator's "how long an outage is needed" is "failed uses times the retry
wait" (plan lines 984-985) and its warning fires above five minutes of that figure (lines
958-959): for a workaround at two failures it prints 2 minutes while the real wait can be 10. The
feature scenario hides this with a 15 second need. This is the "standing and watching" problem of
round 1 (its section 6), moved from between failures to before the first one, and it breaks the
link a student has to see: I broke it, she noticed.

**Fix.** Two parts. (1) Make the cause bite at once: when a global named by a `downIf` in an
NPC's `work` plan (or its station's) turns truthy, the needs system lowers that NPC's `work` level
to `urgentAt`, once per change, and clears any retry wait. It is a client rule driven by the
player's own act, so the decision log stays a function of seed and player actions, and it is what
a person at a desk does when the share drops. (2) Print the honest figure: worst wait to the
first failure (zero with part 1, else the need's period), plus `(n - 1) x (retryMin + useSeconds)`,
and warn on that sum. Add a beat with a slow need (two minutes) to show part 1 working.

### M2. Resource display names in room data contradict 9.3a's secrecy rule as it is written today (A)

**Evidence.** The `work` plan ships each resource's `name` and `kind` in room data (5.1, table
9.2). The plan says 9.3 agrees: "Slice 9.3 scopes its own no-exposure test to leave an NPC's
`work` block out" and "9.3 recommends the same in its decision 10" (plan lines 812-815, decision
12). The 9.3 file on the branch says the opposite: "the browser learns a network's name, and the
names, hosts and contents of what the network exposes, only from `GET /network` and
`GET /container`", ids and global names are not secret, and "what the rule protects is display
names" (`ACCESS_MODEL_SLICE_9_3_PLAN.md:504-511`); its no-exposure test asserts that no
`/room/:id` response holds "a resource's name" with no exception (`:532-534`). The section that
would hold its decision 10 is not in the file. As written, a scenario whose NPC needs a networked
share fails 9.3a's test the day this slice lands.

**Fix.** Ship no `name`. Nothing in the browser needs it: `missing` carries ids, mutters come from
pools, the icon is `blocked`, and the debug overlay can print ids. Keep `id`, `kind` (a free
label, needed for N9), `admitted`, `downIf` and `routes`, all of which 9.3a already calls not
secret. Decision 12 then needs no answer from the user. If names in mutters are wanted later,
that is a request to 9.3 to change its rule, not a default.

### M3. The interfaces are written against the unsplit 9.3; three items point at things 9.3a does not build (U, A)

**Evidence.** 9.3 is now 9.3a (build-ready: one jack, the view, remote sign-in, shares) and 9.3b
(an ordered design: links, outages, Wi-Fi, port security, implants), and 9.3a's validator refuses
`networkLinks`, a network `downIf` and `grant_foothold` (`9_3_PLAN.md:8-16, 155-157`). The order
is 9.3a, 9.1, this slice; 9.3b comes later. Against that:

- **U-2 and the routes table** add a check to `POST /network/implant` "in the expected order ...
  this slice, in U-2" (plan lines 623-627, 782, 1500). That route is 9.3b's and will not exist.
  The check also needs a server twin of `usbRefused` and `usbGoverned`, which U builds only in
  JavaScript.
- **A-3** adds "one line each in 9.3's `network_view` and `session_usable?`" for a station that is
  down (lines 789-792, 1501). 9.3a has no `session_usable?` (its 4.4 says no further session test
  is needed), its host row has three states and none is "not responding", and `POST /login` with a
  foothold has no such refusal. Done properly this is a new row state in `GET /network`, a new
  refusal in two routes and a change to 9.3's `network-view` scene, which no stream here owns.
- **`routes` as "lists of `downIf` global names"** (5.1, 9.2): in 9.3a `reach_conditions` answers
  only `[[]]` or `[]`. A route with a global in it is 9.3b.
- The plan cites "9.3 (12.3)", "13.2" and "decision 10"; in the new numbering section 12 is the
  9.3b design and none of the cited text can be read yet.

**Fix.** Say "9.3a" wherever the order is given. Move the implant check to 9.3b's list, with a
note that it must add `usb_refused?` beside `effective_policy` (`game.rb:1373`); sub-slice U then
has no route at all, as section 3 says. Delete the two "not responding" lines from A-3 and record
them as a 9.3b item (9.3b owns outages for the player). Keep `routes` as designed and say that
with 9.3a only the empty and the unconditional answers occur. Re-check every 9.3 reference when
its sections 7 to 17 land.

### M4. The tampered-client bound is one period too long, and three gains are missing from the list (A to C)

**Evidence.**

- The plan gives "`ceil(at / perFail) x retryMin x 54` seconds" as the earliest a modified browser
  reaches a workaround (lines 856, 986), and the validator prints it. The floor is "at most once
  per 0.9 of the retry wait" (lines 759-761), so the **first** report has no floor. The true bound
  is `(ceil(at / perFail) - 1) x retryMin x 54`. With the defaults and a workaround at 50 that is
  54 seconds, not 108. Whenever `at` is at or below `perFail` it is **zero**: the workaround is
  handed over on the first request after the room loads. The feature scenario is that case
  throughout (`perFail: 50`, every workaround at 50, plan lines 1077-1078).
- Floors are per need. An NPC for whom both `work` and `social_media` can fail is walked up at
  twice the stated rate.
- Missing from "a modified browser can": read every feed post and its fact at the post floor with
  the NPC never touching a phone or a PC, whatever the `social` policy (`/feed_post` checks only
  "NPC known", a feed and the floor); ask a `check` for any owner at any time, not "at the moment
  that owner returns", which turns three wrong passwords for a guessed username into a yes or no
  on whether it is that owner's; and set `se_intel_<id>` itself, which satisfies a readiness slot
  or phishing factor that names a feed fact without the text.

**Fix.** Correct the formula in 9.3 and in the validator's report, and print "at once" when it is
zero. Give the first fail a floor too: record the time the NPC was first encountered
(`track_npc_encounters`) and count no fail sooner than 0.9 of the need's time from `initial` to
`urgentAt` after it; an honest client cannot fail earlier. Make the pace floor per NPC for the
level and per need only for the "lost report" reason, or halve nothing and state the doubled rate.
Add the three gains to the list. None changes decision 5; they make it accurate.

### M5. The tell cannot fire before a first-failure workaround, the fed-up line comes one failure late, and the act itself is silent (B, H)

**Evidence.**

- `tell` is "0 at level 0" and 2 "when one more failure would bring a workaround into force"
  (lines 353-356). A workaround whose `at` is at or below `perFail` comes on the first failure,
  from level 0, so there is never a tell 1 or 2 before it. Every workaround beat in
  `test_access_work` is configured that way (X1 to X4, H1 to H4, L1), so the watch-it-happen
  question "could you tell she was getting closer to giving up" cannot be answered yes in B or H.
  Round 1's M11 is fixed for sub-slice A (beat W2) and not for the workarounds it was raised for.
- The mutter is said when the use fails; `tell` arrives in the answer afterwards (5.2, 5.4). So
  the pool is chosen from the previous `tell`. Beat W2 expects "after the second failure ... her
  mutter comes from the fed-up pool"; at that moment the client still holds tell 1. The fed-up
  line comes on the third failure, which at level 100 is no longer reported. The plan does not
  say which is meant, nor which pool wins when a station failure or a blocked site meets tell 2
  (W6 expects `station_fail`).
- For `writes_down`, `prop_door` and `borrow_session` nothing is said or shown at the act except
  the result. Only `share_login` has a line. The student sees a note appear, with no words that
  tie it to the outage.

**Fix.** (1) Say that the fail mutter is chosen at the failure from the tell then held, and
correct W2 to "on her third failure". (2) Give each workaround a start line from its own pool
(`wk_writes_down`: "I'll never remember this one."; `wk_prop_door`: "I'm not badging in every
time."; `wk_borrow`: "I'll use the spare."), said when the hand-over arrives, and an action icon
for the errand. The line depends on the answer for its timing only; its choice stays seeded. (3)
Set the feature scenario's workaround beats to `perFail: 25` with `at: 50`, or keep one beat at
50 and 50 and mark it "no warning, by design", so tell 1 and 2 are seen before a workaround. (4)
Fix the precedence: the cause's own pool (`station_fail`, `social_blocked`) below tell 2, the
fed-up pool at tell 2.

### M6. A fourth plan edits the same files and is in no table (B, H, U)

**Evidence.** Section 13's cross-plan table names 9.1 and 9.3 only. The engine feedback plan's
streams also edit: `game.rb` `capture_secrets_for_client`, `account_capture_passwords` and
`capture_route?` (its E4, `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md:1009`), which are the exact
methods step H-1 changes for `sharedLogins`; `systems/npc-world-bubbles.js` (E2, `:1006`), owned
here by U's needs stream; `systems/interactions.js` (E3, `:1008`), where U-2 edits the
`requiresItem` branch; `core/game.js`; the leak scanner; the schema and validator. That plan's own
shared-files table (`:1014-1032`) lists 9.3 and 9.1 and not this slice. E4 also adds a capture
log that holds captures and notes, which is where a heard login will be read, and 9.3 says a
server-side check of captures is being designed there (`9_3_PLAN.md:58-62`); if it lands,
`recordSECapture` from a `share_login` answer is a capture the server must be able to vouch for.

**Fix.** Add the feedback plan to the table with an order per file (E4 before H-1 on the three
capture methods; E2 before U-1 on the bubble renderer; E3 and U-2 on different branches of
`interactions.js`). Add a "With the engine feedback plan" block to section 15: the heard login is
a capture log row; `sharedLogins` is the server record a capture check reads. Ask the orchestrator
to add this slice to that plan's table.

### M7. The feed secrecy tests cannot be run as written (C)

**Evidence.** The no-exposure test and the leak scanner must find "a feed fact's text, label or
`provides` values" in no response before its post is out (plan lines 835-836, 1054-1058). Real
`provides` entries hold values and labels such as `"value": "finance", "label": "Finance"` and
`"label": "Melanie"` (`scenarios/lab_social_engineering/scenario.json.erb:466-469`). Those strings
are in room ids, NPC names, template slots and other facts in every response. As a substring
check the test fails on a correct build; loosened by hand it stops proving anything. This is the
test round 1's B1 rests on, and step C-5 rightly demands that it be able to fail.

**Fix.** Two checks that can both fail and pass. Structural: no response holds an object keyed by
a feed fact's id with a `text` key, and the bootstrap's `social.intelFacts` has no feed fact key.
Textual: the whole `text` of each feed fact and each feed post, matched whole. Drop `label` and
`provides` values from the substring list. Add a validator warning for a feed fact whose `text`
is under about 12 characters or occurs inside another shipped string, since the textual check
cannot protect it. Keep the planted-text scanner test.

## 5. Minors

| Id | Finding | Evidence | Fix |
|---|---|---|---|
| N1 | "Every existing needs test passes unchanged" is false once `npc_used` gains `met` | `test/js/npc-needs.test.mjs:130` asserts the whole payload of a carry's `npc_used` with `deepEqual` | Add `met` only to judged uses (`work`, `social_media`); a carry and a coffee use keep today's payload. Correct section 14's "true everywhere" |
| N2 | With 9.3a a resource can be unreachable for ever with no warning; the missing-list rule needs the right helper | `reach_conditions` answers `[]` when the resource has a `network` and the station is on another or on none (`9_3_PLAN.md:322-325, 161-162`); a share given a `network` for the player and an NPC whose PC has none fails work from the first use. `Game.acl_admits?` answers false for a missing list (`game.rb:1160-1161`) | Validator warning and report line "never reachable from its station", beside "not admitted". Name `resource_acl_admits?` (9.3a's 4.5) in A-1 for "absent: everyone" |
| N3 | "An honest client is never refused by a floor" does not hold in three cases | A borrowed use that fails (H3) is reported seconds after the home failure, same need; the ease floor is tied to `retryMin` although met uses are spaced by the need's period (a period under 0.9 of `retryMin` loses eases); at `retryMin` 0.25 the slack is 1.5 seconds, less than the two second batch window | Do not report a failed borrowed use (it is the same episode); floor an ease at the PC's use time, not the retry wait; raise the minimum `retryMin` to 0.5 or measure the floor from the report's queue time |
| N4 | Names that cross between streams "are fixed by this plan" and five are not | How an answer reaches the needs system; how the reload map does; how the runner makes an NPC say a line; how it sets `s.borrow`; how a dropped errand tells the runner (5.3 says "reported as dropped" with no event) | Name them in 5.3 to 5.5, for example `applyFrustration(answers)`, `restoreFrustration(map)`, `mutter(npcId, topic)`, `setBorrow(npcId, run)`, `npc_errand_dropped:<npcId>` |
| N5 | "done" is not safe to send twice, and a heard login can be lost for good | A lost answer leaves the server done and the client not; a resend is a 403 (check 2). A heard `share_login` "leaves the turn" on the server before the client has the line | A "done" for an index already done answers the same body again with no write; the runner retries a failed request. Keep `share_login` in turn after it is heard (hearing it twice is harmless: captures are first-wins) |
| N6 | The validator lets the wedge sit inside the locked room | Error only when `prop` "is not in that room or a room connected to it" (plan lines 936-937); 6.2 needs it next to the door, in a room that is loaded | Error unless `prop` is in a room connected to `door` and is not in `door` itself |
| N7 | A breaker "whose click toggles" a global cannot be written with today's actions | Action conditions are tested one action at a time in order (`apply-actions.js:92-95`), so "set true if false, set false if true" flips twice | Two objects swapped by `revealOnGlobal`, as W2 and W3's set-up, or say that a `toggle_global` action is added in A-7 and who owns `apply-actions.js` |
| N8 | Three guesses in sub-slice U | `usb-plant-refused.test.mjs` cannot load `interactions.js` in node (it imports the engine); with two matching items held the branch takes the first found (`interactions.js:827-830`); `npc-needs.js` has no imports, and `describe` now needs the policy table | Put the decision in `pc-policy.js` as a pure `plantRefusal(heldItems, object, scenario)` and test that; choose the first held item the policy accepts, refuse only when all are refused; say whether `npc-needs.js` imports `pc-policy.js` or reads `window.pcPolicy` |
| N9 | The fail line names the wrong thing | The `work_fail` pool is "Share's down again." (plan lines 366-369) for a printer or email outage too | Pools by kind, `work_fail_<kind>`, falling back to `work_fail`; this is why `kind` stays in the plan (M2) |
| N10 | Loose ends at the hot desk | 6.4 ends a guest session two ways when someone sits down (`workstation_owner_returned` and `displaced`); the first gives "<guest> is back at the desk" for a different person (`backAtDeskMessage`, `pc-sessions.js:52, 253`). The client records the guest at the event, the server at "done", so a quick click is refused. 9.3a lets a remote sign-in start while someone is seated (`9_3_PLAN.md:384-387`), which masks the guest session again. A hot desk could be authored `headless` | One path: `displaced`, on `npc_sat_at`; no `workstation_owner_returned` for a guest. Record the guest on the client when "done" is answered. Displace again on `npc_borrowed_session`. Validator error for a `headless` borrow PC |
| N11 | Lockout (L): a race, a reload gap, a claim that should not be, and avoidable requests | The `check` answer may arrive after the owner's first use completes (5 seconds in L1), so that use is met; after a reload the owner works at the PC until the next locked return; the owner's PC can still be claimed as theirs while they are locked out of it; a `check` goes on every locked return for the whole mission | Send a `check` only for a PC where this browser has had a lockout answer from `/login` (it reveals nothing new and cuts requests to near none), and again when such an owner registers after a load; hold the first use's verdict until the answer; while flagged, the screen always locks and the server's claim refuses |
| N12 | Scripted beats that are racy or not self-contained | H2 needs Mei's password from X1 but each run is a new game (plan lines 1104-1106); H1 steps the clock five minutes with Ian's PC still unplugged, which queues a burst of reports and leaves his level undefined; X4 must reload inside a walk of a few seconds; W4's claim window is one errand; "leaves for coffee sooner" (W2) has no check | Start the H run with X1's outage, or give H2 its own source; re-plug before stepping; for X4 set the needs clock to manual on `phase: "started"`, then reload; say in `PLAYTEST.md` how to re-arm W4 (clear and re-jam); assert W2's coffee by event order |
| N13 | No step writes the author documents | Only L-1 edits `README_scenario_design.md`; section 7 leans on "the author docs"; `NPC_NEEDS_SYSTEM.md` and `docs/test-bridge.md` (B, H, C) have no owner | A documents step at the end of each sub-slice, as 9.1's step 9 |
| N14 | Section 12's rule reads as "every scripted run after every step" | "done when ... every suite run built so far pass" (lines 1135-1137); by sub-slice C that is ten runs of 10 to 15 minutes per step | Unit suites per step; scripted runs at the last step of each sub-slice, as A-7 and B-4 already say |
| N15 | Three guesses in the feed | The server needs "the need's period" for the post floor and no formula is given (restores differ by place); a post that arrives while the browser is open; an empty `social.intelFacts` must stay an object, because `grantFact` grants any id when the block is absent (`social-intel.js:191-196`) | `period = min(socialUse.restores, 100 - urgentAt) / decayPerMin`, in `access_work.rb`; re-render the open profile on `npc_posted`; delete entries, never the key |
| N16 | What is "withheld until it happens" can be inferred from what ships | A scenario `chatter.share_login` pool, a wedge hidden on the workaround's global, and mappings on `npc_workaround:<id>` or an `emit` event all ship; the no-exposure test's bare-word assertion (line 836) fails on a fixture that overrides that pool | Say so in 9.2's table (ids and event names are not secret, as 9.3a holds); rename the pool `login_aloud`; assert on `do` with its target, as the scanner does |
| N17 | The first report of an outage is nearly always stale | Globals sync every 30 seconds (`state-sync.js:126`), so the server's copy lags: stale answer, sync, resend, three requests | Force one state sync when a global named in any `work` plan changes, before the next batch; allow for it in the budgets |
| N18 | A pending borrow after a reload always lapses | Needs restart at `initial`, so the need is not urgent and the 60 second start limit passes | Say so in 9.4's table; it comes round after the next failure |

## 6. What a tampered client gains, and the pace floors

The plan's account in 9.3 is now honest in kind. With M4's corrections the true position is:

- For any NPC in a loaded room, a workaround whose `at` is at or below `perFail` is available on
  the first request; others after `(n - 1) x retryMin x 54` seconds. Then the written-down
  password, the propped room, the guest session and the shared login follow as listed.
- Feed posts and facts come at the post floor with no NPC behaviour needed.
- The server's own facts (`no_access`, `social_blocked`, a lockout, a password check) cannot be
  faked. The plan's advice is right: anything that must not be passable sits behind one of those.

**Honest play.** The floors do not slow an honest player: every floor is shorter than the
client's own wait plus the use time, except the three cases in N3. What slows honest play is not
the floors but the need's period before the first failure (M1).

**Scripted playtests.** With the feature scenario's values each paced beat costs 15 to 75 seconds
of real waiting, W3 about two and a half minutes, F6 about three. Each run stays inside 10 to 15
minutes. Declining the pace switch on the test server (section 17) is the right call. The risk to
scripted runs is the races in N12, not the floors.

**Request volume.** Bounded: at most one report request every two seconds, silence once settled,
`done` on a feed. An NPC with a repeating workaround in force reports once per retry for as long
as the outage lasts, by design. N11 and N17 remove the avoidable requests.

## 7. Does each sub-slice stand alone, and is it worth shipping

| Sub-slice | Stands alone | Worth shipping alone | Note |
|---|---|---|---|
| U | Yes | Yes: two lessons (a keyboard-type device passes a storage block; a refused stick goes to the unmanaged machine) and no server work | Buildable now |
| A | Yes | Yes: W4 is a full chain with no workaround (outage, owner walks off, open session, note, cupboard) | After M1 to M4 |
| B | Yes, on A | Yes: the note and the wedge are the clearest openings in the slice | Needs M5 to be readable |
| H | Yes, on B | Yes | Blocked by B1 until the room check is redesigned |
| L | Yes, on H | Small: one step, one beat | The user's decision; see N11 |
| C | Yes, on A (one beat on H) | Yes, and the largest | Needs M7 |

## 8. Fun and educational: can a student see, understand and use the opening

**What now works.** Every workaround opens something the first slice already uses, and X1, W4 and
H1 each carry a second link, so access chains into access as the user asked. Repeating
workarounds remove "you had to be there". The heard login now explains itself. The lessons are
sound: controls that stop work get worked round; storage blocking is not device control; a
lockout is a denial of service (with the per-PC caveat stated); blocked sites move to phones.

**What still weakens it.**

- **Cause and effect are too far apart** in a real mission (M1). This is the most important
  design fault left, because the lesson is causal.
- **The warning is missing exactly where a workaround comes quickly** (M5), and the act has no
  words.
- **The fail line can name the wrong system** (N9).
- **The phone** is still an icon with no pose; the default toast on a post is the right repair
  and should be kept even if art comes later.

## 9. The six decisions left for the user

| # | Decision | Review | Who can take it |
|---|---|---|---|
| 12 | Resource names and `downIf` names in room data | Ship ids, `kind` and global names; ship no display name (M2). That is inside 9.3a's stated rule, so no question remains | **Orchestrator** |
| 13 | Three USB values with `usbClass` | Agree. Additive, opt-in, changes no existing scenario, and both lessons are ones the user named | **Orchestrator** |
| 14 | Lockout as a cause (L) | Agree in principle. It tells the browser something about an account, and a modified browser can ask at any time, not only on the owner's return (M4). N11's "only where this browser saw a lockout" narrows it | **User.** It is last but one in the order, so it holds up nothing |
| 15 | Existing art only | Agree. It is the option that costs nothing; new icons or a phone pose cost money and stay the user's when proposed | **Orchestrator** |
| 16 | On the phone means no sight challenge | Agree. Opt-in per guard, last step of C, and the validator says the guard can be walked past | **Orchestrator**, noted in the approval log |
| 17 | No existing scenario changes | Agree. It is the conservative option; folding into `lab_physical_pentest` would be the user's | **Orchestrator** |

Two the plan does not list and the orchestrator can take: whether an outage brings the work need
to urgent at once (M1, recommended yes), and where 9.3b's two contacts with this slice (the
implant check, a station that is down) are recorded (M3, in 9.3b). One to raise with the user as
a separate fault, outside this slice: the state sync never reports the player's room (B1).

## 10. Order of repair

1. B1: replace the `currentRoom` check (H); correct section 2.
2. M3 and M2 with the 9.3 revision in hand: 9.3a wording, the implant and station lines moved to
   9.3b, no display names in `work`.
3. M1 and M4: the outage kick, the honest times, the corrected bound and list.
4. M5 and N9: the lines and the feature scenario's thresholds.
5. M6: the feedback plan in both tables.
6. M7, then the minors; N1, N4 and N8 before U and A start.
