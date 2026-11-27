# Access model slice 9.2 plan: adversarial review, round 1

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md` (2026-11-10), against the code on
the access design branch and the sibling plans `ACCESS_MODEL_SLICE_9_1_PLAN.md`
and `ACCESS_MODEL_SLICE_9_3_PLAN.md` as they stood on the same day.

**Counts: 2 blockers, 15 majors, 21 minors.**

| Grade | Count | Ids |
|---|---|---|
| Blocker | 2 | B1, B2 |
| Major | 15 | M1 to M15 |
| Minor | 21 | N1 to N21 |

Verdict in one paragraph: sub-slice A is sound and stands alone once M2, M5, M8 and M10 are
answered; none of the blockers is in A. Sub-slice B has one blocker (the sticky note is designed
two incompatible ways by 9.1 and 9.2) and its hot desk flow is not yet buildable without guessing.
Sub-slice C has one blocker (the fact a post carries ships in the bootstrap, so the new route
withholds the wrapper and not the secret) and can be made much smaller. The plan's account of what
a tampered client gains is honest in kind and understated in amount.

## 1. What was checked and found accurate

Every row of the plan's section 2 was read against the code. These hold as written:

- `npc-needs.js`: `_completeJob` at `:1047`, `_useCandidate` at `:815`, `_select` at `:788`,
  `_anyUrgent` at `:781`, `_carryCandidate` at `:849`, `_tickNpc` at `:597`, `DEFAULT_CHATTER` at
  `:51`, `createEngineWorld` at `:1434`, `describe` at `:1467`, the `approachCell` fallback at
  `:1612-1627`, `OVERHEAR_RADIUS` 160 at `:43`, `playerHears` at `:1674`.
- `game.rb`: `filtered_scenario_for_bootstrap` `:824-898`, `account_capture_passwords` `:957`,
  `capture_route?` `:971`, `ACCESS_STATE_DEFAULTS` `:1123`, `scenario_room_npc` `:1211`,
  `access_sessions` `:1275`, `effective_policy` `:1373`, `claim_login_session!` `:1446`,
  `end_claimed_sessions!` `:1495`, the NPC loop `:3947-3950`, `WITHHELD_NPC_KEYS` `:3968` (it does
  already hold `workarounds`), `preserved_keys` `:95`.
- `games_controller.rb`: the lock list `:88-89`, `track_npc_encounters` `:1714`.
- `workstation-state.js`: `presence` `:142`, `onInteract` `:314-332`, `policyFor` `:370`.
- `interactions.js`: a sign-in PC returns at `:797-806` before the `requiresItem` branch `:818-850`.
- The schema has `usb` and `social` as `allowed` or `blocked` (`scenario-schema.json:190-191`) and
  nothing reads them. `validate_npc_needs.rb:481-483` is the "no object satisfies it" error.
- The cooler preset satisfies `["thirst", "social"]` (`office-presets.json:6`) and
  `test_needs_sims` uses `social` at `:385` and `:517`.
- The compare tool's kept fields do not include `met` (`needs-baseline-compare.js:33`), so the
  planned needs regression difference of none is right.
- All art named in section 2 exists. All test files and tools the plan extends exist.

The sketch corrections in section 2 (no `landingPages` profile path, the `social` name collision,
no failed use, no targetless job, doors that never close) are all correct.

## 2. Blockers

### B1. A feed post's fact ships in the bootstrap, so the feed route withholds the wrapper, not the secret (sub-slice C)

**Evidence.** The plan withholds `feed` and serves posts one at a time (8.3, 9.1 `/feed_post`, 9.2
table row "feed"), and says a modified client "cannot read ... a post ... before the server hands
it over" (9.1, "What these checks prove"). But a post's value is its `fact`, and the validator
requires every feed `fact` to name a `social.intelFacts` entry (section 10, errors). That block
ships whole in the bootstrap: `filtered_scenario_for_bootstrap` only strips capture secrets from
`social` (`game.rb:895`), and the browser reads the fact's text from it
(`osint-browser-minigame.js:124-126`, `:666-667`). A real entry looks like
`"text": "Staff addresses are first-initial.surname@ledgerwell.example."`
(`scenarios/lab_social_engineering/scenario.json.erb:447-449`). So "Jake's dog is called Biscuit"
is in the browser from the first request, whatever the feed route does. `grantFact` is also a
browser call that only checks the id exists (`social-intel.js:184-200`), so a client can note the
fact without the post. The leak scanner extension in section 11 looks for post text only, so it
would pass while the fact leaks.

**Fix.** Pick one and say which in the plan:

1. **Withhold properly.** A fact named only by feed posts is deleted from `social.intelFacts` in
   the bootstrap and sent with the post in the `/feed_post` answer and in `feedPosts` on a reload;
   `social-feed.js` merges it into the live `social.intelFacts` before the post is clickable. The
   validator errors when a feed fact is also named by an authored block (it would ship). The leak
   scanner adds each feed fact's text and `provides` values to its secrets, and the no-password
   test asserts the fact text is in no response before the post is out.
2. **Accept the baseline and delete the route.** Authored posts already ship and are gated by
   `showIf` on globals (`osint-model.js:57-68`, `_addBlock` at `osint-browser-minigame.js:568`).
   A feed can then be authored posts with `showIf` on a per-NPC post counter that the needs system
   raises on each met `social_media` use. No route, no `feedRevealed`, no `social-feed.js` merge,
   no request per use. The cost is that posts are readable in traffic early, which is what every
   existing `social` scenario already does.

Option 1 honours the user's withholding rule; option 2 removes about a third of sub-slice C. This
is a decision for the user (see section 7, missing decision D-a).

### B2. The sticky note is designed two incompatible ways by 9.1 and 9.2 (sub-slice B)

**Evidence.** This plan (6.2, 9.1 routes, section 15): the server writes `postitNote`
("<username> / <password>") and `showPostit` into the home PC's **room data** through
`filtered_room_data`, the "done" answer carries the same fields, a `notes_postit1` picture appears
on the PC, and "one helper in `game.rb`, `written_down?(npc)`" serves both slices. The 9.1 plan
(5.3, `:290-320`, and its interface table `:948`): the note is served **only** by
`GET /login_accounts`, "Room data, the bootstrap, `container` and a door unlock's answer never
hold it", the note is the **bare password**, an authored `postitNote` wins, the helpers are
`Game#login_postit_for(pc)` and `Game#npc_habit(npc, name)` with a `player_state` overlay
(`habitChanges[npcId]`) that 9.2 is asked to write, and it ends "Request: 9.2 does not write
`postitNote` into room data". Both plans say "one helper" and each names a different one. Built as
written, the two slices produce two fills, two formats and two answers to "which response may hold
the password", and each slice's no-password test contradicts the other's.

**Fix.** Adopt 9.1's channel, which is also the better fit for this slice: `/login_accounts`
already exists and is reach-checked (`games_controller.rb:1106-1114`), the note then appears at the
next sign-in screen with no room refetch, and the "done" answer no longer needs to carry a
password. Concretely: `writes_down` done sets the overlay that `npc_habit(npc, 'writesDown')`
reads; `/npc_workaround` answers `{ pcId, noteShown: true }` with no password; the client shows
the picture from `noteShown`; this plan's leak rule becomes "the password is in a
`/login_accounts` answer for that PC, after done, and nowhere else". Agree one format (bare
password, as 9.1, or both lines) and whether an authored `postitNote` wins. Whichever slice builds
first writes `login_postit_for` with the overlay hook in place.

## 3. Majors

### M1. A tampered client gains more than "walk the frustration scale"; the plan should list it and tighten the cheap parts

**Evidence.** Section 9.1 says a modified client "can walk an NPC it has met up its frustration
scale at the honest pace without causing an outage". Followed through the routes, that means it
obtains, with no outage and without standing anywhere:

- every `writes_down` password in clear text (the first slice only ever served a password through
  a capture route, `game.rb:957-976`);
- every `prop_door` room, unlocked on the server by `unlock_room!` (`game.rb:110`);
- every `share_login` password: `heard` is a bare client claim, and once the NPC is in
  `sharedLogins` the password is served from `/capture_secrets` against `se_captures`, which is
  itself a client-synced global (`game.rb:914`, `merge_global_variables!` `:278-297`);
- every guest session at a hot desk.

The pace is weaker than "honest": check 3 is **half** the retry wait in server seconds, so with
the defaults (`perFail` 25, `retryMin` 1) a workaround at 75 is reached in about 60 to 90 seconds
after the room loads. "NPC known" is any NPC in any loaded room (`track_npc_encounters`,
`games_controller.rb:1714-1750`), not one the player is near. "Can fail" is a static property of
the scenario and never looks at whether anything is down. `ease` has no check 2 and no pace check,
so it is an unthrottled locked write. `/npc_workaround` accepts an index as soon as it is handed
(no minimum time) and for ever after (`handed` is never emptied), so "nothing opens before the
player could have seen it happen" (section 6) is true only of an honest client.

The server cannot do much better, because outages are globals the browser writes (the 9.3 plan says
this plainly at `:406-408`: "an outage is display and pacing, not protection"). That is an
acceptable residual for a teaching game, and it matches the first slice's stance on claims. But
the plan should say so in those words and close what is cheap.

**Fix.**

1. Rewrite "What these checks prove" to list the four gains above and the time bound as a formula
   (`ceil(at / perFail) x retryMin x 30 s`), and print that bound per workaround in the validator
   report beside "what it opens".
2. Pace `fail` at the full retry wait less a small tolerance, not half. Pace `ease` the same way.
3. `/npc_workaround`: refuse "done" sooner than the errand's dwell after hand-over; for a
   repeating workaround remove the index from `handed` on "done" so each hand-over is spent once.
4. Where the cause is one the server owns, check it: `locked_out` against `loginLockouts`
   (decision 5), and a `downIf` global against the server's own copy in
   `player_state.globalVariables` (it is client-written, so this is consistency and honest logs,
   not protection; say so).
5. Add a validator warning when a workaround is the **only** route to a lock that guards a flag or
   a boss key, so authors put such locks behind something the server checks.
6. Put the residual to the user as a decision (section 7, D-e).

### M2. The reach hook cannot be supplied the way this plan expects (9.3 withholds networks)

**Evidence.** This plan ships each resource's `network` in the NPC's `work` plan (5.1 example,
9.2 table) and expects 9.3 to replace `reaches(stationId, resource)` "with its network test,
including a network's own `downIf`" in the browser (section 15). The 9.3 plan deletes `networks`
and `networkLinks` from the bootstrap (`:460`, `:474`), so a browser reach test has nothing to
read, and it asks this plan for two changes (`:1047-1058`): drop `network` from the `work` plan,
and take reach from the server as `routes` (a list of routes, each a list of `downIf` global
names) composed where the plan is composed.

**Fix.** Take 9.3's request now, since it changes A2's output shape: remove `network` from
`work.needs[]`; reserve `routes` (absent: reachable); define `reaches(need, globals)` as "some
route has no truthy global"; drop `stationId` from the signature. Update section 15 and the A5
tests ("the `reaches` hook defaulting to true" becomes "a need with no `routes` is reachable").

### M3. `borrow_session` is described two ways and a builder would have to guess which

**Evidence.** Section 6, "Handing over": every `run` is queued "as an errand (5.3)" and "when the
errand completes" the client calls `POST /npc_workaround`. Section 6.1: the hand-over only sets
`s.borrow = { pc, need }`, and "the next time that need is selected" the borrowed PC is the
candidate, as "an ordinary use job flagged `borrowed`" that goes through the verdict. These are
different mechanisms, and the second leaves open:

- **When.** 5.2 makes the failed need wait `retryMin` before it is selected again, so the NPC
  sits for a game minute before getting up. Is the wait waived for a borrow?
- **When "done" is posted.** At `npc_borrowed_session`, on arrival, or at hand-over? The server
  writes `guestSessions[pc]` on "done", and the guest claim's check 3 depends on it.
- **A failed borrowed use.** 6.1 says the use "fails again there" when the resource is down. Does
  the NPC still "walk off signed in"? If yes, a guest session exists though they did no work; if
  no, a resource-wide outage never yields a hot desk session, which is the common case (W2).
- **An occupied hot desk.** `_free` (`npc-needs.js:741-754`) fails for a claimed target. Does the
  borrow wait, lapse, or count as done?
- **The hot desk's affordance.** See N1.

**Fix.** State one mechanism. Recommended: a borrow is a use job chosen by the selector, the retry
wait is cleared for that need when a borrow is handed over, the session is left whether or not
the use was met (they signed in before they found it broken), "done" is posted on
`npc_borrowed_session`, and a borrow that cannot start within 60 seconds is dropped and comes
round again. Add each as a test in B3.

### M4. A player session already held at the hot desk masks the guest session, and nothing says what an NPC sitting down does to it

**Evidence.** A click on a sign-in PC with any session held opens that session's desktop before
the workstation layer is asked (`unlock-system.js:219-222`), and the guest claim's check 2 refuses
when a session is held (plan 9.1), as the owner claim does (`game.rb:1458`). The plan's own
scenarios have the player sign in by password at a hot desk (X4: "signs in as Sam at the hot
desk"; F5), and a password session survives a reload. From then on an NPC who borrows that PC
leaves nothing the player can reach: the click shows Sam's desktop, never Ian's. 6.1 says a guest
session ends "when anybody next sits at that PC" through `workstation_owner_returned`, but
`pc-sessions.js:249-254` ends only `via: "claim"` sessions on that event, so a password session
stays while an NPC is using the PC. 9.3's remote sessions at the same PC meet the same rule.

**Fix.** Decide and write the rule. Recommended: an NPC sitting down at an unowned sign-in PC signs
the PC's current session out (client `pc_signed_out` with reason `displaced`, server clears
`sessions[pcId]` in the "done" write), because one screen holds one session. Then the guest
session is always claimable after a borrow. Add the workstation and sessions tests, and a beat (X2
variant) where the player is signed in at the hot desk before Ian arrives.

### M5. Request volume has no ceiling and no stop

**Evidence.** Each failed use is one locked `POST /npc_frustration` (the lock reloads and saves
the whole row, `games_controller.rb:1686`). A resource in `roles.staff.workNeeds` is needed by
every member of staff, so one outage with 20 loaded NPCs is 20 locked writes per game minute for
as long as it lasts. Reports continue at level 100 and for an NPC with no workarounds, where they
change nothing. A `no_access` NPC (W5) reports once per retry for the whole mission. Then each met
use while the level is above 0 sends an `ease` (ten per NPC from 100). In C, every met
`social_media` use sends `/feed_post`, and because "how many there are" is withheld (9.2 table)
the client cannot know a feed has run out, so it asks for ever (F6: "later uses reveal nothing").
Decision 1 prices this as "one small request per failed use".

**Fix.** The answer gains `settled: true` when nothing further can change (level 100, no repeating
workaround in force, or no workarounds at all), and the client stops reporting fails for that NPC
until an `ease` is due. `/feed_post` answers `{ post: null, done: true }` after the last post and
the client stops asking. Batch reports: queue them and send one request every few seconds carrying
a list. Add a request count to each scripted run's checks (the responses are already captured) and
a budget in `PLAYTEST.md`.

### M6. A propped room's NPCs are never recorded as encountered

**Evidence.** `prop_door` answers "with its room data, exactly as a door unlock does" (6.4), but
the route's writes are `unlock_room!` and `filtered_room_data` only (9.1 table). The door unlock
action also calls `track_npc_encounters` on that room data (`games_controller.rb:925`), as the
room action does with `annotate_station_submission_status!` (`:496-501`). Without the first, every
NPC in the propped room fails this plan's own "NPC known" check and the first slice's encounter
checks (`game.rb:1682`, `:2330`) until some other request loads the room.

**Fix.** Factor the door unlock's "serve a newly opened room" tail into one controller helper and
call it from `npc_workaround`. Test: after `prop_door` done, a `/npc_frustration` report for an
NPC in that room is accepted.

### M7. Reload faults: `setGlobal`, `emit` and the restore order

**Evidence.**

- A workaround's `setGlobal` is set by the browser on "done" (6.4, B3). The server has recorded
  `done`. A reload before the next state sync loses the global: the store room is open and the
  wedge, which the scenario shows with `revealOnGlobal`, never appears; any text or task keyed on
  the global never fires. The reload table (9.3) says a done lasting workaround is "still in
  force" and does not mention its global.
- `emit` is "marked done at once" at hand-over (6.5). If the answer is lost or the page closes
  first, the event never fires in any session, and a task mapped to it is stuck. It is lasting, so
  it is never handed over again.
- A7 hands `npcFrustration` to the needs system "where `sessions` is handed to `pc-sessions.js`"
  (`core/game.js:1663`). No needs state exists then: states are created by `register` when an
  NPC's room loads (`npc-needs.js:228-272`), and `reset()` clears them (`:286-300`). `pending`
  errands also need the NPC's room loaded.

**Fix.** The server sets a declared `setGlobal` in `player_state.globalVariables` itself when it
records "done" (the path task completion already uses, `game.rb:3753-3777`). On load the client
re-applies `setGlobal` for every entry in `done` (idempotent). `emit` is marked done only when the
client confirms it through `/npc_workaround`, so an unconfirmed one is `pending` after a reload.
The needs system keeps the reload map and applies level, global and pending errands in `register`;
say so in A7 and B3 and test "restore arrives before the NPC is registered".

### M8. The USB policy reaches every object through `defaultPolicy`, not only PCs

**Evidence.** `effectivePolicy(objectData, scenario)` is "the object's `policy`, else
`defaultPolicy`" (section 7), applied to any target that `accepts` a tag and to any `requiresItem`
object. Under a scenario `defaultPolicy` with `usb: "storage_blocked"`, a lost property tray, a
`usb_bowl1`, a printer's USB port or a shredder that accepts the stick's tag would "refuse" it with
a mutter about USB being disabled. The section 10 warning covers only the reverse case.

**Fix.** A `usb` policy applies only to an object that is a workstation by its own fields
(`isWorkstation`, `workstation-state.js:72-76`) or that names a `policy` itself. Add the case to
`pc-policy.test.mjs` and a validator warning for a `usbClass` item accepted by a non-workstation
under a blocking default.

### M9. Beats that step the needs clock will be refused by the server's pace checks

**Evidence.** `/feed_post` check 4 and `/npc_frustration` check 3 measure **server** time. F6 runs
"needs clock on manual; stepped on, Jake posts his third post". Stepping the clock produces met
uses seconds apart in server time, so the server answers `{ post: null }` and the beat's record
(`feedRevealed.jake.n` 3) is not reached unless the script also waits real time (with the test
values, half of 2 minutes per post). The same applies to any later beat that steps the clock to
reach a frustration level. Separately, the pace is per NPC, not per need, so an NPC failing both
`work` and `social_media` loses one of every pair of reports as `tooSoon`.

**Fix.** Say in 11 that pace-checked beats are earned in real time and never stepped, and size F6
accordingly; or give the test environment a pace override the keyless test server sets and the
leak and verify tools report as "pace off". Key `failAt` by need.

### M10. Build streams: files nobody owns, files two streams need, and an incomplete cross-slice list

**Evidence (inside the slice).**

- B has no owner for `core/game.js`, yet B3's runner must be installed there and handed `pending`
  on load (A's surfaces stream owned it; C's feed stream owns it; B lists it nowhere).
- B3's `npc-workarounds.js` calls `api-client.js` `npcWorkaround`, which B4 owns.
- "Tooling changes (step A7, extended in B and C)" (section 11): no B or C stream owns
  `tools/playtest/`, `systems/test-bridge/` or `docs/test-bridge.md`, though `guest(pcId)`,
  `feed()` and the workaround and feed leak rules land there.
- Decision 5's code (`locked_out` in `npc-work.js`, `pc-sessions.js` remembering lockouts, "can
  fail" in `access_work.rb`, `lockedOutAccounts` in the controller) is placed in step B5, whose
  stream owns only `scenarios/test_access_work/`.
- The mutter needs the bubble renderer (`systems/npc-world-bubbles.js`) and a state beside
  `_chats` (see N7); no stream owns the renderer.
- The player's plant (surfaces stream, `interactions.js`) imports `pc-policy.js` (needs core
  stream), so those two cannot start together as section 13 says.

**Evidence (across slices).** Section 13 says the files "all three touch" include
`systems/npc-needs.js` and `systems/workstation-state.js`. The 9.3 plan says it touches neither
(`:1088-1089`). The real overlaps are missing from the list: `unlock-system.js`, `pc-sessions.js`
and `api-client.js` (9.1 stream A, 9.3 streams C1 and C2, this plan's B4); `interactions.js` and
`core/game.js` (9.3 C1); `games_controller.rb` and `config/routes.rb` (all three);
`generate_dungeon_graph.rb` (all three); the leak scanner, `verify-run.rb`, the test bridge and
`docs/test-bridge.md` (9.1 stream E, 9.3 stream T, this plan's A7). The test bridge's access
functions live in `systems/test-bridge/access.js` (it exists; 9.3 names it), not `index.js`.

**Fix.** Add a B "surfaces and tooling" stream owning `core/game.js`, `api-client.js`, the tooling
and the test bridge, and the same for C's tooling. Make decision 5 its own step with its own file
list after B4. Give the bubble renderer to A's surfaces stream. Order "needs core writes
`pc-policy.js`" before the plant. Replace the cross-slice list with the one above, and agree one
order with the siblings (see N16).

### M11. Frustration has no visible state, so the player cannot read the build-up

**Evidence.** The user's principle is that workarounds make openings the player can see and use.
The plan gives each failed use a 4 second `blocked` icon and one mutter (5.2), and the level only
as a global for text variants and an `F` bar in the debug overlay (5.4). Decision 6 rules out a
frustrated face. Between failures (a game minute apart by default) there is nothing to see, and
nothing distinguishes "one more failure and she writes it down" from "just started". With the
defaults a `prop_door` at 90 is four failures, so four or more minutes of standing and watching
with no sign of progress. With `"chatter": false` (section 14) even the mutter goes.

**Fix.** Use what exists: keep the `blocked` icon up while the level is at or above the NPC's
first threshold (the server can send `tell: 0 | 1 | 2` with the level without revealing any
threshold or workaround), and give mutters two tiers of pool (`work_fail`, `work_fail_fed_up`)
chosen by `tell`. Make the watch-it-happen run ask "could you tell she was getting closer to
giving up" and run it at the end of A as well as B and C.

### M12. `share_login` gives the player a credential with nothing on screen that explains it

**Evidence.** The line spoken "never contains the username or the password" (6.3); the pool is
"Can you run it on my login?". The player then holds a credential capture whose password appears
at a captures terminal. What was seen does not explain what was gained, which is the opposite of
the other four workarounds, and the lesson (sharing a login out loud gives it to whoever is in
earshot) is not shown. The line cannot hold the secret because pools ship; but the server's
`{ capture }` answer arrives exactly when the player has heard.

**Fix.** Let the heard answer carry the spoken line, composed on the server
(`"line": "It's jbrooks, and the password's ..."`), shown as the NPC's bubble only then; an
unheard share shows the neutral pool line. Add the capture toast and evidence note the phish path
already gives. The leak rule becomes "the password is in a heard `/npc_workaround` answer and in
`/capture_secrets`, nowhere else". This also removes the dependence on `revealSecret`, which today
is only a validator warning and silently makes the workaround worthless.

### M13. The slice is too large as three sub-slices; two parts should move

**Evidence.** As planned: three new routes and four changed, six new client modules, one new
library, one new validator file, two feature scenarios with 22 beats, 18 build steps in 15
streams. Three observations:

- **The USB policy (step A6, beats W7 and W8) depends on nothing else in the slice** and nothing
  depends on it: no route, no state, no frustration. It shares only `npc-needs.js` with A5.
- **In sub-slice A the frustration level opens nothing** (`run` is null). A is still worth playing
  because of what the needs system does alone: failed uses, the drain that empties desks, and the
  check errand that walks an owner away from an open session (W4 is a real chain). So A stands
  alone, but step A3's route exists in A only to be tested.
- **Sub-slice C** carries a route, a state key and a client module whose only purpose is
  withholding that B1 shows does not yet work. With B1 option 2, C is the need, the phone job, the
  `social` policy and a counter global.

**Fix.** Make the USB policy its own first sub-slice (call it U; one stream, one day, immediately
useful to the lab). Keep A as planned, with A3 in it so B starts from a tested route. Split B in
two: B1 `writes_down`, `prop_door`, `emit` (no session work), then B2 `borrow_session` and
`share_login` (the workstation and session changes, M3 and M4). Decide B1 (this review's blocker)
before sizing C.

### M14. `roles` and the awareness default: each sibling says the other does it (9.1)

**Evidence.** This plan, section 15: "this slice owns `workNeeds`, `frustration` and
`workarounds`; 9.1 may add `awareness` and `habits`", and "whoever builds first adds `roles`". The
9.1 plan (`:947`): "9.2 owns the `roles` key in the schema and the validator", and 9.2 "adds the
lookup" for `roles.<role>.awareness` inside `NpcHabits.level_of`. So `roles.<role>.awareness`,
which the parent sketch promises (`ACCESS_MODEL_PLAN.md:1341`), is built by nobody. This plan's
awareness warning also reads "the authored `awareness` string" (8.3, section 15), which misses a
level that comes from a role, where 9.1 asks for `NpcHabits.level_of` and for the line to be
printed in its habits report.

**Fix.** This plan owns `roles` (schema, known keys, bootstrap delete) in step A1 and says so
without "whoever". Add one step, after 9.1's foundation exists, that adds the role lookup to
`NpcHabits.level_of`; until then the warning reads the authored string and says so. Print the
warning through 9.1's report when it exists.

### M15. Feed posts as password clues: shape and ownership disagree (9.1 and 9.3)

**Evidence.** Both siblings expect the sketch's shape, `feed[].text` (9.1 `:477`, `:952`; 9.3
`:1085`); this plan's shape is `feed.posts[].text`. 9.1 says "9.2 adds `feed[].text`" to
`NpcHabits::Clues.readable_texts`; this plan says "Slice 9.1's `password: "guessable"` check
should count feed posts" (8.3, section 15), so again nobody does it. This plan also says the check
should count a post's `fact`, while 9.1's check is mechanical over **texts**; a fact's text lives
in `social.intelFacts`, not in the post. Beat F5 (a password built from two posts) depends on this
check to be validated at all.

**Fix.** This plan adds, in C2, one line to `readable_texts` covering `feed.posts[].text` and the
`text` of each feed post's fact, and one to 9.3's "the key appears nowhere" source list. Tell both
siblings the shape is `feed.posts[]`.

## 4. Minors

| Id | Finding | Evidence | Fix |
|---|---|---|---|
| N1 | A hot desk restores nothing unless it has an affordance that satisfies the need | `_completeJob` restores only when `aff.satisfies` lists the need (`npc-needs.js:1053`); the `desk_pc` preset applies only with `officePresets: true` (`office-presets.json:5`) | Validator error when a `borrow_session` PC does not satisfy `work` (or `social_media`) |
| N2 | The `share_login` errand targets the colleague's `needsHome` object | It counts as a claim on that PC, so the colleague's own use is refused while the visitor stands there (`_claims`, `_free`, `npc-needs.js:723-754`); the approach cell is the seat the colleague is in (`:1615-1627`); B4's `userOf` would name the visitor as using the PC | Target a cell beside the colleague; exclude errands from `_claims` and from `userOf` |
| N3 | A lasting workaround that is handed over and cannot finish is picked again on every failure and blocks all later ones | "the first lasting one in force that is not yet done" (section 6); "a workaround errand waits" (5.3) | The server skips an index that is handed and not done; the client drops a stuck errand after a time and reports it |
| N4 | The check errand repeats on every failed use | 5.2 queues one per failure; with `retryMin` 1 the NPC walks to the printer every minute for the whole outage | Once per outage episode per resource, or a cooldown; test it |
| N5 | `ease` is underspecified | "A met use ... is reported as an ease" (5.2) does not say whether a met coffee use counts; the route's "then choose `run`" reads as applying to `ease` too | Only a judged use (`work`, `social_media`) eases; `ease` never returns `run` |
| N6 | The determinism claim in 5.4 holds only in A | In B a server answer starts errands and sets `s.borrow`, so the decision log depends on latency | Say so; B and C needs tests assert order, not ticks |
| N7 | The mutter and the waiting need touch more than the plan lists | `_talking` reads pair records in `_chats` (`npc-needs.js:1352-1359`); `_pressing` (`:1389-1399`) is not in the list of methods that skip a waiting need, so the pressing icon shows for it; new pools need the 40 character check | Add a mutter state of its own, `_pressing` to 5.2's list, and the pools to the validator's length check |
| N8 | Decision 5 teaches something only half true, and tells the browser which usernames are real | Lockouts are per PC and username ("This account is locked on this PC", `game.rb:1133`); a real directory lockout follows the account to the hot desk. `lockedOutAccounts` confirms account names the sign-in screen hides (the plan says so) | Frame the lesson as denial of service against the owner; apply `locked_out` only when the owner's screen had locked; see section 7 |
| N9 | `prop_door` authoring limits and client reuse | An NPC behind the locked door is never simulated (rooms load only when unlocked, `games_controller.rb:469-474`), so "props it from inside" cannot happen. The client steps exist already in `NPCGameBridge` (`npc-game-bridge.js:110-125`); `unlockDoor` is module-private in `doors.js` and reached as `window.unlockDoor` (`:703`, `:723`) | Validator error when the NPC's home room is the `door` room; reuse the bridge's door update |
| N10 | If room data keeps the note (B2 not taken): the picture after a reload | The picture is drawn from the "done" answer (6.2); after a reload only room data has it, and keying the picture on `postitNote` would add it to every authored note in existing scenarios | Key the picture on a separate flag |
| N11 | `<npcId>_frustration` globals are undeclared | Set by the browser (5.4), synced to the server and restored like any global; the validator's undeclared-global checks will flag conditions that read them | Treat the name as engine-owned in the validator; reserve the suffix |
| N12 | The player's plant refusal never applies to a sign-in PC | A sign-in PC returns before `requiresItem` (`interactions.js:797-806`), and policies sit mostly on sign-in PCs | Say so in section 7 and in the author docs; W8's `priya_dock` is the only shape that works |
| N13 | Test gaps | No watch-it-happen run for A; no request count check; no beat with an NPC borrowing a PC the player is signed in at; no test for a `defaultPolicy` reaching a non-PC | Add each (M4, M5, M8, M11) |
| N14 | A guest's `locksScreen` cannot be read where the plan says (9.1) | Section 15: "through whatever 9.1 exposes on the workstation env". 9.1 withholds `habits` and exposes only a filled `lockChance` on **owned** workstations and the server helper `Game#npc_habit` (9.1 `:262-288`) | The server adds `leavesOpen: false` to the `borrow_session` run when `npc_habit(npc, 'locksScreen')` is `always`, and the guest claim refuses on the same test |
| N15 | 9.1 describes a different `borrow_session` | 9.1 `:949` expects a per-leave override at an owned PC and a server record that `pc_always_locks?` reads. This plan's unowned hot desk needs neither | Tell 9.1; no code change |
| N16 | Three build orders | 9.1 `:968`: 9.1, then 9.2, then 9.3. 9.3 `:1124`: 9.3 first. This plan: "the order does not matter" | Agree one. If 9.3 is first, A1 and A2 extend `resources` (schema, bootstrap delete) and do not add it |
| N17 | Resource names and `downIf` global names ship in room data, and 9.3 puts that to the user | This plan ships `id`, `name`, `kind`, `downIf` per need (5.1). 9.3 `:1059-1066` raises names as "for the user to weigh", and its own section 6 says no "`downIf` wiring ships" | Add it to the decisions (section 7, D-c) |
| N18 | "A resource no NPC needs" will warn on 9.3's player-only shares | Section 10 warnings; 9.3 adds resources that exist for the player (`lw_scans`, 9.3 `:939`) | Warn only when the resource also has no `contents` or `host` |
| N19 | 9.3 assumes this plan refuses a BadUSB "at the drop" | 9.3 `:1079-1082`. Here only an item with `usbClass` is refused, at the end of an NPC's use or in the `requiresItem` branch; a `grant_foothold` path calls neither | State that a path that plants a device calls `usbRefused` itself, and who adds the call (the second to land) |
| N20 | Two wording mismatches with 9.3 | This plan mentions `requiresReach` (section 15); 9.3 leaves it out (`:1016`). 9.3 expects "a station that is down" to gain two lines in its view and session test (`:1071-1074`); this plan is silent | Drop the `requiresReach` sentence; note the station lines under "With 9.3" |
| N21 | A 9.3 remote session at a hot desk blocks the guest claim | Guest check 2 refuses when any session is held; 9.3 adds remote sessions in the same `sessions` map (`:460`) | Covered by M4's rule; name remote sessions in it |

## 5. Sibling mismatches, in one list

Every difference between this plan's section 15 and what the siblings say:

| # | Topic | This plan | Sibling | Finding |
|---|---|---|---|---|
| 1 | Sticky note channel, format and helper | Room data, "<username> / <password>", `written_down?` | 9.1: `/login_accounts` only, bare password, `login_postit_for` and `npc_habit` overlay, authored note wins, "9.2 does not write `postitNote` into room data" | B2 |
| 2 | Reach | `network` shipped; browser hook `reaches(stationId, resource)` replaced by 9.3 | 9.3: drop `network`; server composes `routes`; networks never ship | M2 |
| 3 | `roles` ownership and `roles.<role>.awareness` | "9.1 may add"; "whoever builds first" | 9.1: "9.2 owns the `roles` key" and adds the lookup to `level_of` | M14 |
| 4 | Awareness warning source | The authored string, in this slice's validator | 9.1: `NpcHabits.level_of`, printed in the habits report | M14 |
| 5 | Feed shape | `feed: { site, person, posts: [] }` | 9.1 and 9.3: `feed[].text` | M15 |
| 6 | Who makes feed posts count for `guessable` | "9.1 should count" a post's `fact` | 9.1: "9.2 adds `feed[].text`" to `readable_texts` | M15 |
| 7 | Guest and `locksScreen` | Read from the workstation env | 9.1 exposes nothing there | N14 |
| 8 | What `borrow_session` is | Guest session at an unowned PC | 9.1: unlocked leave at an owned PC | N15 |
| 9 | Build order | Does not matter | 9.1: 9.1 first. 9.3: 9.3 first | N16 |
| 10 | Shared files | Lists `npc-needs.js`, `workstation-state.js` as touched by all three | 9.3 touches neither; the real overlaps are unlisted | M10 |
| 11 | Test bridge file | `test-bridge/index.js` | 9.3: `test-bridge/access.js` | M10 |
| 12 | Resource names in room data | Shipped, not raised | 9.3: a decision for the user | N17 |
| 13 | "A resource no NPC needs" | A warning | 9.3 authors such resources | N18 |
| 14 | BadUSB under a blocking policy | Refused only with `usbClass`, on two paths | 9.3: "fails at the drop under 9.2's rule" | N19 |
| 15 | `requiresReach` | Mentioned as possible in 9.3 | 9.3 leaves it out | N20 |
| 16 | A station that is down | Not mentioned | 9.3: two lines by whichever lands second | N20 |
| 17 | Sessions at the hot desk | "No session is held" | 9.3 adds remote sessions to the same map | N21 |

Agreed and consistent: `downIf` means the same in all three; a resource with no `access` admits
everyone; `holdsDoors` and `prop_door` are independent; `workarounds` stays withheld; the "can
fail" rule gains "the scenario has networks"; both 9.2 and 9.3 delete `resources` from the
bootstrap; the hot desk session is claimed at the screen.

## 6. Is it fun and educational as a chainable mechanic?

**What works.** The chain shape is right and matches the user's principle: an action the player
takes (an outage) changes what a named person does, and what they do opens something the first
slice can already use. W4 is the best beat in the plan because it needs no new server state: the
printer jams, Omar walks to look at it, his session is open. The hot desk, the note and the wedge
are each a visible act with a lasting or repeatable result, and "repeating" workarounds remove the
"you had to be there" failure. The lessons are real: controls that stop work get worked round;
storage blocking does not stop a keyboard-type device; a refused stick travels to the unmanaged
machine; blocked sites move to phones.

**What weakens it.**

- **Waiting.** The player's part ends when the outage starts; the rest is watching, with no
  visible progress (M11). The validator's "how long an outage is needed" line is the right tool;
  add a warning above a few minutes.
- **`share_login`** shows nothing that explains the reward (M12).
- **The phone** has no pose and the feed is read at a terminal elsewhere, so "she posted" is
  invisible unless the author adds a nudge. Make the nudge a default (a toast on `npc_posted` when
  the player has opened that site before), not an option.
- **Chains need a second link.** A workaround opens one thing. The plan should give authors one
  worked two-link example in the feature scenario (an outage, a hot desk session, a note in that
  profile that opens the next room), since chaining is the stated point and none of X1 to X6
  chains past its own beat.
- **Accuracy.** Per-PC lockout (N8). Everything else taught is sound.

## 7. The nine decisions, and five that are missing

| # | Plan's recommendation | Review |
|---|---|---|
| 1 | Frustration and workarounds on the server | **Agree**, for the withheld list. Be plain that the level itself is a client claim (M1) and that the cost is not "one small request" without M5 |
| 2 | `social_media` | **Agree** |
| 3 | Three USB values with `usbClass` | **Agree**, with M8 (workstations only) and N19 |
| 4 | A propped door stays open | **Agree**. Add the validator note that it is permanent, and N9 |
| 5 | Lockout as a cause of failure, in B | **Agree in principle, not in B.** It is the only cause the server can verify, which is a point in its favour (M1). Build it as its own step after the hot desk works, with its own files (M10), the corrected lesson (N8), and the user's explicit yes to revealing which locked-out usernames are real |
| 6 | Existing art only | **Agree for the build**, but the plan needs a visible frustration state made from existing art (M11); "no new icons" must not mean "no tell" |
| 7 | On the phone means no sight challenge | **Agree**, last in C. Add the validator note that such a guard is passable every period |
| 8 | A, then B, then C | **Agree on order; change the cut** (M13): U (USB), A, B1, B2, C |
| 9 | No existing scenario changes | **Agree.** Note that 9.1 (step 9) and 9.3 (step 10) both plan lab edits, so the lab already has two editors queued |

Missing decisions the user should be asked:

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D-a | Feed secrecy (B1) | (1) Withhold feed facts as well as posts. (2) Author feed posts with `showIf` on a counter and drop the route | (1) if the withholding rule is firm; (2) is far smaller |
| D-b | Sticky note channel (B2) | 9.1's `/login_accounts`, or room data | 9.1's |
| D-c | Resource names and `downIf` global names in room data (N17) | Ship, or ship opaque ids | Ship; it says no more than a mutter does |
| D-d | An NPC sitting down at a PC the player is signed in at (M4) | Signs the player out, or leaves the session | Signs out |
| D-e | The tampered-client residual (M1) | Accept with the listed gains and the validator's "what it opens" report, or require every workaround lock to have a server-checked second route | Accept, with the warning for flag and boss-key locks |

## 8. Order of repair

1. Settle B2 and M2 with the siblings (they change shapes other plans build on), and D-a.
2. Rewrite 6.1 (M3, M4), 9.1 "what these checks prove" (M1) and the routes table (M5, M6, M7).
3. Re-cut the sub-slices and streams (M13, M10).
4. Add the visible state and the heard line (M11, M12), then the minors.
