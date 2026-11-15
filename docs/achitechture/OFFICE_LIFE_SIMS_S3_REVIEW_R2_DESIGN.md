# SIMS-3 review, round 2: design and engine view, with live proof

Branch `build/ol-sims` at b2285b4d8 (R1 fixes 510a2e99e, 279080517, d2edfbb27). Keyless server
:3095 from the p-ol-sims worktree, headless chromium. Every game is a fresh
`new-game.rb test_needs_sims` game.

| Game | What I ran |
|---|---|
| 4334 | `needs-sims-neil.mjs still_ask`: real needs clock for 631 s, six opens, suspend/resume, no-ask close, ask with the player staying in IT |
| 4335 | `reload_during`: reload 2.5 s after the asked close, then a plain close |
| 4336 | `reload_after`, then `ready-line.mjs reopen` (what Neil says to "Is that change log ready?") |
| 4339 | `ready-line.mjs during`: ask, close, reload inside the delay, reopen and pick the ready line |
| 4338 | Placement probe (the fixer's `place.mjs`), then `ink-check.mjs`: the ink as played, the page on the tray at native and zoomed scale, Neil and his mug from four player sides |
| 4337 | The fixer's office regression with a 480 s window (was 180 s) |
| 4342, 4343, 4348, 4349, 4350 | `grace-rest.mjs` and the builder's `rest-check.mjs`: why `see_rest` does not tick |

Scripts, reports and screenshots are in scratchpad `officelife-sims/s3-review-r2-design/`. Grace's
rest level was set to 8 (4342, 4348, 4350) or 6 (4349) through `window.__test.needs.set` to start
the sofa beat; 4343 and 4337 use the regression's own nudges.

Counts: **0 blockers, 2 major, 7 minor.**

## Round 1 findings, checked

| R1 | Status | Evidence |
|---|---|---|
| B1 mug under the office wall | **Partly fixed**, see M1 | The mug now draws above the wall and is visible (4338 cover probe: only Neil's sprite over it). It is not on the desk, though. |
| M1 manual-clock proof | Fixed | 4334: 631 s of real time gave 631.75 s of needs clock. Max sprite drift was 0.6 px with 0 move events. Sips came at 2.74 and 7.80 min, each `drink_gulp` with `played: true` in `it_room`. The sip screenshot is taken in mode `job` (`neil-still_ask-01-sipping-4334.png`: cup bubble, "using 4s"). |
| M2 four missing checks | Fixed (see m7 on mid-sip) | 4334: six opens came up in 240 to 528 ms. The asked close revealed `it_out_a` 5919 ms later with `copier_run` played in IT, 0 fetches and Neil's drift 0. The leave-within-6 s beat is in the tool (fixer's 4328, not rerun). |
| M3 reload in the delay | Fixed | 4335: `neil_print_asked` true after the reload and the tray empty; a plain close then printed `it_out_a` and ticked `see_neils_page`. README:65 now says so. |
| M4 second promise | Fixed across chats; a new false line takes its place, see M2 | 4338: the second chat offers "Is that change log ready?" instead of the ask. |
| m1 phantom cups | Fixed in the README; still stale in the plan (m5) | |
| m2 mug observation | Fixed, but now contradicts the ink (m4) | |
| m3 `readDisplay` | Fixed | all six slots |
| m4 security note | Fixed | fire-warden text |
| m5 page half under the wall | Partly fixed, see m1 | |
| m6 dialect spelling | Fixed | plain spelling, with "Aye", "pet", "Howay" and "me mug" kept |
| m7 tests that cannot fail | Fixed | `bin/test-js` on both files passes. The condition test now asserts fire / no-fire, and `presetIdFor` runs over every IT object. |
| m8, m9, server m3 | Fixed | |

Validator: 0 errors. Its dialogue lint flags `neil.ink:32` (re-entry; see m2).

## Major

### M1. The mug floats at floor level off the east end of the desk, not on it

- **Data:** `scenarios/test_needs_sims/scenario.json.erb:911` (`position` (6.2, 6.0), elevation 24).
- **Docs that claim it is on the desk:** README:72, plan 3.3 (line 179), build log SIMS-3 R1 B1.

**Evidence.** Game 4338's geometry puts the mug sprite at world (198 to 209, -64 to -53), with origin
top-left and size 11 px. The lower desk's top surface ends at about x 203, y -79. Its front face and
legs run down to about y -55.

Elevation only changes depth (`rooms.js:39`: depth = bottom + 0.5 + elevation). It does not lift the
sprite. So the mug draws straddling the desk's east edge, at the height of the desk-leg feet. The
desk's own depth puts the sprite at -54, below Neil (-23), so his body draws over it.

- `neil-still_ask-01-sipping-4334.png` (native scale, mid-sip): the mug sits on the carpet beside the
  desk's right leg while Neil "drinks".
- `face-montage-4338.png` (Neil facing the player from W, E, S and SW, 2x): facing W or E, his body
  hides most of the mug. Facing SW, it hangs beside his hip in mid-air.
- `place-neil-4338.png` (the fixer's 4.4x zoom) is the one angle where it reads as "held". That is
  the screenshot the README row cites.

The sip beat now reads a lot better than in R1: the mug is in the room. Still, the README tells the
player "he stands at the IT desk by his own mug", and the scene shows a mug on the floor.

**Fix.**
1. Move the mug onto the desktop's east end, for example tile (5.85, 5.1), so the sprite spans
   world y about -92 to -81 and x about 187 to 198. Give it an elevation that sorts it above the
   desk: at least about 26, so try 32 and check.
2. Keep Neil at (5.8, 7.0) and re-aim `useFrom` (about dy +2) so his approach cell stays under his
   body centre within `HOME_EPS`.
3. Rerun `place.mjs` and take a **native-scale** screenshot plus one with Neil facing west, as well as
   the zoom.

### M2. "Is that change log ready?" always answers "It's on the copier tray", whatever the tray holds

`scenarios/test_needs_sims/ink/neil.ink:16-19`. The gated reply is unconditional. The tray is
client-only (R1 server m1), so the claim is false in three reachable states:

- **After a reload once the page has printed** (4336). The tray is filed empty and the `onceOnly`
  key is saved, so the page can never print again. Neil still says "It's on the copier tray, pet.
  Help yourself." (`ready-reopen-4336.json`: `shown: []` at the reply and still empty 9 s after the
  close). This is the R1 M4 broken promise again, on the reload path.
- **After a reload inside the 6 s delay** (4339). He says it is on the tray while the tray is empty.
  It prints only after this chat closes (`ready-during-4339.json`).
- **After the player has taken the page.** "Help yourself" points at an empty tray.

**Fix.** The cheapest fix is a line that does not assert the tray's state, for example "Should be on
the copier tray, pet. If not, someone's nabbed it." To make it exact, branch on the slot global:
declare `VAR it_out_a_shown` in the ink (it syncs from the client global, which is false after a
reload), then:

```ink
{ it_out_a_shown: It's on the copier tray, pet. | Should've come out by now. I'll send it again when you go. }
```

The second branch is only true for the reload-during case, so for the reload-after case word it
neutrally. The README tour should say that a reload after the print loses the page for good.

## Minor

- **m1. The page lies on the carpet beside the copier, not on its tray.**
  `scenario.json.erb:933` and the other five slots at (8.1, 7.2).
  - The page sprite spans world (259 to 275, -26 to -10); the copier is (272 to 307, -29 to 17).
  - `ink-03-zoom-page-on-tray-4338.png` and `ink-02-native-page-on-tray-4338.png` show a blue sheet
    tilted on the purple floor west of the copier, above its side tray. The observation reads "A
    printout on the IT copier tray."
  - It is no longer under the wall (R1 m5), so this is a read, not a hiding, problem.
  - Fix: put the slots on the copier's top, for example (8.65, 6.95) with an elevation that sorts
    them above the copier, or change the observation to "beside the IT copier".
- **m2. Neil's goodbye plays as the opening line of the next chat.**
  - `neil.ink:32`: the tag on the choice line (`+ [I'll let you get on.] #exit_conversation`) closes
    the chat before his reply shows.
  - The story then resumes there on the next open. In 4338 the second chat opened on "No worries.
    Howay, mind the cables on your way out.", followed by the hub. The validator's dialogue lint
    flags the same line.
  - Every test_needs_sims ink has this pattern, but Neil is the NPC the tour sends the player back
    to, so the player hears it on each return.
  - Fix: move `#exit_conversation` into the body after the reply (README_ink_best_practices.md:307),
    or add a short re-entry line at `hub` ("Back again? What's up?").
- **m3. In the chat where the player asks, the ask choice is still offered.**
  - The `#set_global` tag sets the global (true mid-chat in 4338) but not the running story's VAR, so
    the hub straight after the ask still shows "Could you print the change log?". Picking it again
    repeats "I'll fire it at the copier now", and one page prints.
  - It is harmless, but the gate does nothing within the chat that matters most.
  - Fix: set it in ink as well (`~ neil_print_asked = true`; chat-helpers.js:589 notes that ink
    assignments broadcast). Then confirm the global still reaches `conversation_closed:neil`.
- **m4. The ink and the mug contradict each other, and "Howay" is used as a goodbye.**
  - `neil.ink:26` has "Stone cold." The observation at `scenario.json.erb:915` has "Lukewarm, never
    quite finished." Pick one: "Lukewarm at best." would do.
  - "Howay" means "come on". "No worries. Howay, mind the cables on your way out" reads oddly. Try
    "No bother, pet. Mind the cables on your way out."
  - The other lines carry the voice well: settled, dry and brief. The new lines suit him.
- **m5. Stale text still describes the bench.**
  - The task title at `scenario.json.erb:150` reads "(he is standing by the south bench ...)".
  - The aim description at `:146` reads "who never leaves his bench".
  - Plan line 298 still lists "two `office-misc-cup` on the desks; the third, on the east bench, is
    Neil's mug". IT draws one cup, and the mug is now declared on the desk.
  - README:65 and the build log say `neil_print_asked` "is set when the conversation closes". It is
    set when the choice is picked (true mid-chat in 4338) and reaches the server by the close.
- **m6. The office-regression row explains the missing `see_rest` wrongly.**
  - README live-proof row "Office beats keep their outcomes" calls it "a proof-window timing
    artefact". With a 480 s window (4337) it still does not tick.
  - Cause: the regression opens the kitchen, so Grace's `dirty_mugs` interest starts a carry. The
    carry wedges at (118, 202) and fails on `timeout` (the SIMS-1 E-carry item). Her urgent rest then
    parks with `no_source`, and parks with `no_source` again from her post 16 min later (4342 and
    4343 logs in `grace-*-4342.json` and `grace-*-4343.json`).
  - With only the lounge and IT opened (4350), she walks to the sofa and `see_rest` ticks in 43 s. So
    the IT door does not cause it, and the slice is clear.
  - The builder's own `rest-check.mjs` also failed once in 90 s (4349). The row should say this, and
    the regression should prove `see_rest` in its own run, without the kitchen.
  - Worth one owner look: `no_source` from her post after a failed carry suggests the dropped mugs
    block her route to the lounge.
- **m7. The "mid-sip" open is not shown to be mid-sip.**
  - `tools/playtest/needs-sims-neil.mjs:128` flags `midSip` from the mode at the sample. `talk()` then
    walks to Neil and waits 600 ms before `interact`, and the sip lasts 4 s.
  - `talk()` captures `modeAtOpen` (:96), but the report drops it (:143). In 4334 the "mid-sip" chat
    took 528 ms to come up, the slowest of the six.
  - Fix: report `modeAtOpen`, and pass only when it is `job` or `using`. R1's `midsip.mjs` (4309) is
    the only real proof so far.

## Not counted

The "Neil Robson" hover label still lingers over the office copier after the bridge's chats
(`neil-still_ask-01-sipping-4334.png`), as in R1.

## Dialogue judgement (as played, 4338)

- **Voice:** right for a settled Geordie IT man, and plain enough for TTS. "me mug", "give us a
  shout", "Aye", "pet" and "mind" carry the accent without eye-dialect.
- **Gated choice:** right across chats. Within the asking chat, see m3. The "ready" reply is false
  after a reload or a take, see M2.
- **Re-entry:** opens on the farewell (m2).
- **Dead ends:** none. Every choice returns to the hub and the exit is sticky.
- **TTS spelling:** fine. "Howay" is the one word a voice model may stress oddly; m4 drops it from
  the goodbye.
