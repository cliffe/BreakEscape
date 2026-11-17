# SIMS-3 review, round 1: design and engine view, with live proof

Branch `build/ol-sims` at b9793dc7a (diff against 32c87a72f). Keyless server :3095 from the
p-ol-sims worktree, headless chromium. Fresh `new-game.rb test_needs_sims` games:

| Game | What I ran |
|---|---|
| 4307 | Neil on the **real** needs clock for 630 s (no manual clock), five chat opens at random moments, then ask-and-print with the player leaving IT 1.8 s after the close |
| 4308 | Reload 2.5 s after the asked close, then one plain (no-ask) close after the reload |
| 4309 | Placement probe (sprite list, depth cover test, render with the office layers hidden); two chat opens mid-sip (caffeine set to 44 through `window.__test.needs.set`, said here as the brief requires) |

Scripts, reports and screenshots: scratchpad `officelife-sims/s3-review-r1-design/`
(`neil-review.mjs`, `cover.mjs`, `midsip.mjs`, `report-*.json`, `r-*.png`, `cover-*.png`, `midsip-*.png`).

Counts: **1 blocker, 4 major, 9 minor.**

## What the engine does (all good)

Neil's behaviour holds on the real clock, so the Gary pattern itself works:

- Game 4307: 630 s of real time gave 630 s of needs clock (fps about 50, no rAF switch needed).
  Neil's sprite moved at most 0.4 px over 307 samples, and his log has 0 `left_post`, `goto` or
  `returning` events. Sips (mode `job`) started 2:29 and 7:33 after the door opened, each lasting
  4 s. `drink_gulp` played both times (volume 0.3, `it_room`), and `see_neil_sip` ticked.
- Five chats opened at 70, 191, 331, 430 and 561 s. Each was up within 267 to 331 ms (the first
  took 1287 ms because it includes the walk to him), and each froze him and closed cleanly.
- Game 4309, mid-sip: two opens during the sip job came up in 293 and 279 ms. The sip froze,
  resumed after the close and completed (`used neil_mug`), with drift 0.
- Game 4307, ask and print: the asked close revealed `it_room:it_out_a` **5916 ms** after the
  close, while the player was already in the office (left 1.8 s after the close).
  `copier_run` was logged with `played: false`, which is right: the sound is heard only in the
  player's own room. The page was still on the tray on return, `see_neils_page` ticked, Neil's
  drift was 0 and there were 0 `print_fetched` events.
- No office NPC entered IT in 10 minutes with the north door open. The office tasks kept ticking
  (`see_coffee`, `see_work`, `see_back_at_desk`, `see_queue`, `see_queue_chat`, `see_printout`,
  `see_left_behind`, `hear_drink`, `spot_open_screen`). I found nothing that suggests the north door
  or IT changes the office beats; the builder's 4302/4304 regression stands.

## Blocker

### B1. Neil's mug, and the bench he is meant to stand at, are drawn under the office's back wall

`scenarios/test_needs_sims/scenario.json.erb:909` (`neil_mug`, no position) and `:1023` (Neil at
(6.9, 7.6)). The plan's premise (3.3, 5.3 step 1: "the east south bench at (6.69, 8.15)") is wrong
for this stack.

**Evidence.** IT sits at world y -256 and is 10 rows tall, so its bottom two rows (world y 0 to 64)
overlap the office's top wall. All three south benches (`smalldesk1/2` at world y 6, depth 48), the
claimed cup (214, 5, depth 47.5) and every drawn hard drive, speaker and camera on them sit in that
overlap. A cover probe at the mug's point finds the office's `walls` and `room` tilemap layers
above it (depth 64).

- `r-place-01-zoom-neil-4309.png` is the normal render. Neil stands on bare carpet a tile and a half
  above the wall line, with no bench and no mug in sight.
- `cover-b-office-hidden-4309.png` hides the office's layers and shows the three benches and the
  mug that are really there.
- The benches show only as a ghost when the player stands against the wall and the fade kicks in
  (`r-real-03-page-on-tray-4307.png`). The builder's `it-room-4289.png` shows the same empty floor.

**Why it blocks.** The beat the showcase exists to show ("Neil sips from his mug without a step",
"I'm parked here by me mug") plays as a man drinking from nothing in the middle of the floor. The
mechanism passes, but the scene does not read.

**Fix.**
1. Give `neil_mug` an exact cup `type`, an explicit `position` and an `elevation` on a visible
   surface, and move Neil to stand beside it. For example, use the east end of the lower `desk1`
   (world x 125 to 203, y -94 to -55) with Neil standing east of the desk on open floor, then
   re-aim the mug's `useFrom` to his cell.
2. SIMS-6 then moves `leila_pc` west on that desk or swaps it to the upper desk. A small declared
   standing table by the chalkboard would also work.
3. Rerun step 1 with a screenshot check that the mug is visible, not only that it was claimed.

The same trap waits in SIMS-6: the plan puts `it_kettle` on "a south bench stretch", which is under
the same wall (see m9).

## Major

### M1. The stillness proof ran on the manual clock and could not have failed on a real-time drift

`tools/playtest/needs-sims-neil.mjs:117-140`. `setManualClock(true)` plus `step(10000)` with 60 ms
of real time per chunk gives the behaviour layer and physics about 3.6 s of real frames for
10 needs-minutes. A walk, a nudge or a facing-driven slide would barely show up. The "sipping"
screenshot (`s3/neil-still_ask-01-sipping-4299.png`) is taken at 10:00, after both sips, and shows
him idle. README:841 still claims "both at post with the cup icon".

My real-clock run (4307, above) shows the behaviour is right, so this is a proof fault, not an
engine fault.

**Fix.**
- Make the real clock the tool's default for this beat: about 11 minutes is affordable.
- Sample the sprite position, not only `npcPos`.
- Take the sip screenshot when the mode turns `job`.
- Read `npcOfficeVisuals.playLog` for `drink_gulp` and cite it in README:841.

### M2. Four checks named in 5.3 were not run, and two README rows claim them

- **Five chat opens, including one mid-sip.** These are not in the tool at all. I ran them
  (4307, 4309): all pass.
- **Leave IT within 6 s of the close.** `needs-sims-neil.mjs:182-191` steps out only after the page
  has landed (its own comment says so), so it tests that a landed page persists, not that a print
  lands while the player is away. README:844 records it as the 5.3 beat, PASS. I ran the real
  version (4307): pass.
- **The page lands about 6 s after the close, and the copier sound plays.** `ask_and_print` waits up
  to 12 s with no timestamp (`closeToReveal` is computed and dropped, line 178). A mapping that
  ignored `delayMs` would pass. Nothing reads `playLog` for `copier_run`. My run measured 5916 ms.
- **What the next close prints after a reload during the delay.** 5.3 asks the proof to record this.
  The `reload_during` beat waits 8 s and stops. See M3 for what actually happens.

**Fix.** Add these four checks to the tool (my `neil-review.mjs` and `midsip.mjs` show the pattern),
rerun on a fresh game, and correct README:844 to name what was proved.

### M3. After a reload during the delay, the next close prints the page with no new ask; the README says the opposite

README:65 says "nothing reprints after that reload unless the ask reached the server first". README:846
and build log:109 say "nothing reprints".

In game 4308, `neil_print_asked` was already true after the reload: the ask is saved when the
conversation closes, before the 6 s delay. A plain "I'll let you get on" close after the reload
printed `it_out_a` and ticked `see_neils_page`.

That is a reasonable recovery, but the tour describes it wrongly. A player who reloads, chats about
the coffee and leaves gets a change log they think they never asked for this session.

**Fix.** Rewrite README:65 and :846 as: "a reload in the delay loses that print, but the ask is
kept, so the next time you close a chat with Neil the page prints". Add the step to the tool's
`reload_during` beat.

### M4. Neil promises a second print that never comes

`scenarios/test_needs_sims/ink/neil.ink:7-11`. The change-log choice is sticky (`+`). Every later
visit offers "Could you print the change log?", and Neil answers "I'll fire it at the copier now,
give it a sec". Because the mapping is `onceOnly`, nothing prints (the builder's own game 4300,
second ask). That is a broken promise in the one choice the slice is about.

**Fix.** Gate the choice on `neil_print_asked`. Either make it a once-only `*` choice, or branch so
a repeat ask gets a line that points at the tray (for example "It's on the copier tray already.").
This needs `neil_print_asked` declared as an ink `VAR` synced from globals, as the other missions
do. Recompile `neil.json`.

## Minor

- **m1. README:63 describes cups that are not there.** It speaks of "the three desk cups in IT ...
  the two on the desks plus Neil's mug". IT draws one `office-misc-cup`, the one Neil claims (full
  sprite list in `report-place-4309.json`). Delete the sentence.
- **m2. The mug's observation contradicts the beat.** `scenario.json.erb:914` says "Cold. Nobody has
  drunk from it since lunch.", while the player watches Neil drink from it every five minutes.
  Suggest "Neil's mug. Lukewarm, never quite finished."
- **m3. `it_out_a` reads differently from the other five slots.** It is the only page that ever
  prints, and the only slot without `"readDisplay": "gameDisplay"` (`scenario.json.erb:929-942`;
  b to f all have it). Add it, or drop it from all six.
- **m4. One printout brings in a security note.** `scenario.json.erb:996`: "Annual security
  refresher due this month" is mild, but the showcase is meant to carry no security narrative. Swap
  it for, say, "Fire warden training".
- **m5. The printed page sits half under the office wall line.** The slot at (8.2, 7.7) spans world
  y -10 to 6, across the wall line at about y 0, so the page reads as a sheet on the floor beside
  the copier, half hidden (`s3/neil-still_ask-02-page-on-tray-4299.png`). Move the slots up to
  about (8.1, 7.2), on the copier's west tray.
- **m6. The ink is thin, and its dialect spelling will trip TTS.** `neil.ink:9,18,22`. It has
  5 lines against the plan's "about 10", and two flavour choices. "nee", "doon", "oot" and
  "summat" are eye-dialect ("summat" is not Geordie). The voice style already carries the accent,
  and this spelling reads oddly in subtitles and to TTS. Keep one or two marked words ("Howay",
  "pet") and spell the rest plainly. Also, every visit replays the self-introduction at `start`.
  The other showcase NPCs do the same, so this is a scenario-wide convention, but Neil is the one
  NPC the player is told to come back to.
- **m7. Two tests in `test/js/npc-needs-sims-validator.test.mjs` cannot fail as written.**
  - :135-145: `_mappingWouldFire(...).fire` is always a boolean, because `safeEvaluateCondition`
    returns false on anything it cannot parse. "Evaluates cleanly" therefore never fails. Assert the
    expected true/false per condition instead, as :147-164 does.
  - :76 is titled "the only preset-bearing new object" but checks no preset. Run `presetIdFor` (or
    read the validator's preset lines) over every IT object.
- **m8. Stale evidence.** `s3/report-neil-still_ask-4299.json` records `fetch_events: 2`, from the
  pre-b9793dc7a metric, while README:843 says no fetch ran. My run shows 0. Rerun so the report
  matches the table.
- **m9. Plan note for SIMS-6.** `it_kettle` is planned for "a south bench stretch that step 1's
  render shows clear". All three south benches are under the office's wall (B1). Choose the kettle
  surface from a render with the wall drawn, not from Tiled coordinates.

## Not counted

A "Neil Robson" name box stays on screen over the office copier after the bridge's chats (the
builder's `neil-still_ask-02-page-on-tray-4299.png` and my `r-reload_during-01-after-4308.png`).
It looks like a hover label left by the bridge's pointer, not something a player would see. Worth
one look by whoever owns the hover labels.

## Answers to the brief's questions

- **Pass by construction?**
  - Stillness: yes on the manual clock (M1). On the real clock it holds.
  - Suspend/resume: a valid test. Home distance is 7 px, inside `HOME_EPS` 12, so a wrong `useFrom`
    would make resume walk him.
  - Page provenance: sound. The no-ask close prints nothing, and the task needs
    `producerId === 'it_copier' && npcId === 'neil'`.
  - Untested: the 6 s timing (M2).
- **Placement.** The mug claims the cup, but the cup is invisible (B1). The copier is reachable: its
  use cell (7.5, -0.91) is open floor, and its slots are visible but low (m5).
- **Dressing.** The dressing is neutral: server racks, a chalkboard, a fan, desks and a plant, with
  no logos and no security props. m4 is the one slip.
- **Ink.**
  - Voice: plausible.
  - Ask choice: clear.
  - Dead ends: none.
  - Re-ask: broken (M4).
  - Re-entry: repeats the greeting (m6).
  - TTS: the dialect spelling should be eased (m6).
- **Office beats.** No change found.
