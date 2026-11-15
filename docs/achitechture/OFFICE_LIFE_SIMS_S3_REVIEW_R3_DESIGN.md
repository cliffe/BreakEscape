# SIMS-3 review, round 3: design and engine view, with live proof

Branch `build/ol-sims` at 1665f412a (R2 fixes 1591f2a4f, 6547681b0, e580a4d17, 98ddacd14; SIMS-4
merged in 5118f584d, so `neil.ink` now also carries the flickering-light choice). Keyless server
:3095 from the p-ol-sims worktree, headless chromium. Every game is a fresh
`new-game.rb test_needs_sims` game. Every conversation was opened and closed through its UI, and
the page was taken through the interaction path. No trigger events were emitted and no need levels
were set.

| Game | What I ran |
|---|---|
| 4496 | `needs-sims-neil.mjs still_ask`: real needs clock for 630 s, six opens, suspend/resume, no-ask close, ask with the player staying in IT |
| 4498 | `flow.mjs full`: greeting, light choice, goodbye, reopen, ask, "ready" inside the asking chat, X close, print, X-close reopen, "ready" on tray, take, reload, "ready" after reload, server state read at two points |
| 4499 | `flow.mjs reload_after`: ask, print, reload about 5 s later, "ready", server log of the pagehide flush |
| 4500 | `flow.mjs reload_during`: ask, reload 2.5 s after the close, "ready", plain goodbye, print, "ready" |
| 4507 | `flow.mjs reload_after_tick`: ask, print, wait 36 s so a sync puts the reveal on the server (checked), then reload |
| 4512 | `flow.mjs take`: ask, print, take the page and close the reader, "ready", wait for a sync, reload, "ready" |
| 4456 (lead) | The lead's merged-build run 4456 (`report-neil-still_ask-4456.json`) agrees with my 4496 on every number below |

Four further games were created at the start and not used. Scripts (`flow.mjs`, `dump.rb`), reports
and screenshots are in scratchpad `officelife-sims/s3-review-r3-design/`. Neil's replies below are
the text shown in the chat (`texts` in each `flow-*.json`), not inferred from the flag. The R2 fix
reports for 4394, 4396 and 4398 only captured the player's own line, so the README rows citing them
rested on the flag value alone.

Validator: 0 errors, 36 warnings.

Counts: **0 blockers, 1 major, 6 minor.**

## Round 2 findings, checked

| R2 | Status | Evidence |
|---|---|---|
| M1 mug off the desk | **Fixed** | 4498 native (`flow-full-01-page-on-tray-native-4498.png`) and 4496 (`neil-still_ask-03-page-on-tray-4496.png`): a white mug on the right end of the lower desk, Neil standing just below and to the right of it. In the sip shot (`neil-still_ask-01-sipping-4496.png`) the cup bubble sits on the mug, "using 3s". Still beat: max drift 0.4 px, 0 move events, sips at 2.73 and 7.79 min, both `drink_gulp` `played: true` in `it_room`; suspend/resume drift 0 px. |
| M2 "ready" line false after a reload or a take | **Fixed for the claim**, but see M1 and m2 | No false "Help yourself" in any state I reached. On tray: "It's on the copier tray, pet. Help yourself." (4498, and 4500 after the next close). After a take (4512), after a reload with the page printed (4499, 4507), after a reload inside the delay (4500) and after a take then reload (4498, 4512): "Have a look on the copier tray, pet. It'll be there if it's come through." The README's explanation of why is wrong (M1). |
| m1 page beside the copier | **Fixed**; new m5 | The sheet sits on the copier's lid (4498 crop `copier-before-after-take-4x-4498.png`). The blue tint in that crop is the in-range highlight, not the art. |
| m2 goodbye opened the next chat | **Fixed on the goodbye path**; new m3 on the X path | 4498, 4499, 4500, 4512: after "I'll let you get on." the chat shows "No bother, pet. Mind the cables on your way out." and closes; the next open starts at the greeting. |
| m3 ask still offered in the asking chat | **Fixed** | 4498: straight after the ask the hub offers "Is that change log ready?" and not the ask. |
| m4 mug temperature, "Howay" | **Fixed** | "Lukewarm at best." matches the observation; the goodbye is plain. |
| m5 stale bench wording | **Partly fixed**, see m6 | Aim (`scenario.json.erb:154`) and task (`:158`) now say desk. The plan still carries the old mug and spawn data and a "south bench" tour row. |
| m6 office-regression row | **Fixed** | README row "`see_rest` ticks in its own run" gives the real cause. Not rerun. |
| m7 mid-sip not shown | **Fixed** | 4496: `sip_mode_at_trigger: "job"` on the second open, `mid_sip_open: true`; the six chats came up in 244 to 291 ms (4456: 235 to 604 ms). |
| Server m1 "never synced / empty by design" | **Reworded, but the new wording is wrong** | See M1. |

## Major

### M1. A reload always files a printed page that is still on the tray; the docs say it is nondeterministic, and their suggested workaround cannot work

**Sites:**
- `scenarios/test_needs_sims/README.md:65`, `:910` and `:923`
- `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:371` and `:542`
- `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:204` and the owner item at `:326`
- the `game_loaded` mapping's `_comment` at `scenarios/test_needs_sims/scenario.json.erb:609`

All of them say a revealed slot survives a reload only if a sync happened to carry its global, so
reload is "nondeterministic (empty in 4329/4394/4396, revealed in 4328)". The plan and the build log
add: "a mission that needs a printed page to reliably survive a reload must set the reveal global
through an eventMapping `setGlobal` (which calls `_worldChanged`)".

**Evidence (4507).**
1. The page printed. 36 s later the saved state on the server read `it_out_a_shown: true` and
   `neil_page_on_tray: true` (`dump.rb`, step `server_before_reload`).
2. After the reload the tray was empty (`it_out_a_shown` false in the browser, slot hidden;
   `flow-reload_after_tick-01-after-reload-4507.png`).
3. The next sync wrote `it_out_a_shown: false` back to the server (`server_after_reload_35s`).

In 4499 the pagehide flush carried `it_out_a_shown: true` to the server (PUT at 19:45:44 in
`tmp/keyless-3095.log`), and the reloaded page filed it empty all the same.

**Cause.** This is by design: "stow on sight". When the needs system installs or a room loads, it
files every revealed slot that no NPC holds, and after a reload nobody holds one
(`public/break_escape/js/systems/npc-needs.js:1222-1227`, `stowRevealedSlots` at `:5381-5395`,
`slotHome` setting the global false at `:4854-4855`). The validator says the same: "a forgotten print
holds its slot until a reload".

- **4328 was never reloaded.** The server review read its saved state, which held `true` because a
  sync had carried it. That saved value is not what a reload shows.
- **The workaround is wrong.** `_worldChanged()` (`npc-needs.js:1191`) only drops per-tick caches.
  It sends nothing to the server. Syncing happens on a 30 s timer and on page hide
  (`state-sync.js:417`, `main.js:156`). A global the server holds is still stowed on load, so the
  advice would not keep a page.
- **What does survive.** A taken page is in the inventory (4512: `it_out_a` in the server
  inventory and in the room's `objects_removed`), and after a reload `it_out_a_shown` stays true
  (4498, 4512).

The player-facing behaviour is fine. The `game_loaded` mapping is still needed: without it the
mirror would come back true over an empty tray, as in R2 game 4388. Neil's line stays honest. But
this slice exists to give m02 a pattern to copy, and the docs teach a wrong model of it, with a fix
that does not work.

**Fix.**
1. In all the sites listed above, say: "On reload, a printed page still on the tray is filed away
   (stow on sight, by design), so the tray is always empty after a reload. A page the player has
   taken stays in the inventory."
2. Drop the eventMapping `setGlobal` / `_worldChanged` advice and the 4328 citation.
3. Cite 4507 (server true before the reload, empty after).
4. If m02 needs a printed page to survive a reload, record that as an owner item (for example, a
   per-slot opt-out from stow on sight). Scenario data cannot do it.

## Minor

- **m1. "Reaches the server by the close" is not how it gets there.**
  - README:65 says `neil_print_asked` "reaches the server by the close, before the delay". No sync
    fires when a conversation closes.
  - 4498: the server still had `neil_print_asked: false` about 12 s after an X close (step
    `server_after_print`).
  - 4500: the reload inside the delay kept the ask because the pagehide flush carried it. That PUT
    landed one second after the reloaded page's own GET (server log, 19:45:36 GET, 19:45:37 PUT).
    It worked because the page fetches `/scenario` later.
  - Fix: "it reaches the server on the next 30 s sync, or in the flush sent as the page unloads".
- **m2. The "have a look" fallback covers three states, and two of them read badly.**
  `neil.ink:28`.
  - (a) In the asking chat (4498 `ready_before_print`), seconds after "I'll fire it at the copier
    now", he says "Have a look on the copier tray, pet. It'll be there if it's come through." Nothing
    can print until the chat closes.
  - (b) After a take (4512, before and after the reload) he sends the player to the tray while the
    page is in their inventory.
  - Neither line is false, but the README tour row (:61) and the R2 row (:922) call the line
    "honest in every state".
  - Fix in ink and data: give the asking branch an ink-only VAR (`~ asked_now = true`; it is reset
    because the exit ends the story) for "Soon as you let me get back to it, pet." Add a
    `neil_page_taken` flag set by the page's `onRead`, next to the existing clear, for "You've got
    it already, pet." That is two new voiced lines, each under 40 characters.
- **m3. After an X close, the next chat opens on his last reply, which can contradict the next
  one.**
  - The R2 fix ends the story on the goodbye, but closing with the X keeps the story position.
  - 4498 (`open3_after_xclose`): the chat reopened on "Have a look on the copier tray, pet. It'll be
    there if it's come through." while the page was by then on the tray. Picking "ready" then gave
    "It's on the copier tray, pet. Help yourself."
  - The X is the usual way to close a chat.
  - Fix: a re-entry line at the top of `hub` that the start knot skips (for example "Back again?
    What's up?"). The alternative is an owner item: the engine resumes at the choices without
    re-showing the last line.
- **m4. The light choice is offered before the player can know about the light.**
  - `neil.ink:42`. In a fresh game it is on the first chat's hub (4498 `open1`, 4499, 4500, 4507,
    4512), before the staff room has ever been entered.
  - Fix: gate it on a global set by a `room_entered:staff_room` mapping (Keith already has a
    `firstVisit` one). For example, `{ not job_called && staff_room_seen }`.
- **m5. The page shares every pixel with the copier, so each click raises a menu.**
  - Slots at `scenario.json.erb:956` ((8.65, 6.95), elevation 20).
  - In 4498 and 4512 the bridge reports `aim.clean: false` ("No point of this target is free of
    other interactables"). The take went through the interaction menu (`mode:
    "via-interaction-menu"`), so a player clicking the sheet has to pick "Printout" over the copier.
  - Fix: let part of the sheet hang over the lid's west edge (try x 8.5 and check that
    `aim.clean` comes back true), or rank the slot above its producer in the pick order.
- **m6. Stale plan data.**
  - Plan :179 still gives the mug at `(6.2, 6.0, elevation 24)` with `useFrom { dx: -0.4, dy: 1 }`.
    It is now (5.85, 5.1), elevation 32, `{ dx: -0.05, dy: 2 }`.
  - Plan :225 has Neil at (5.8, 7.0); he is now at (5.8, 7.1).
  - Plan :564 (the tour) still says "Neil standing at the south bench".
  - README :904, the R1 step-1 row, still gives the old mug and slot positions and does not say the
    R2 row at :921 supersedes it.
  - Fix: update the three plan lines and add "(superseded by R2 M1/m1 below)" to :904.

## Not counted

- The hover label (here "Neil Robson" and "A printout on the IT copier tray.") still sits over the
  office copier after the chats (`neil-still_ask-01-sipping-4496.png`,
  `neil-still_ask-03-page-on-tray-4496.png`), as in R1 and R2.
- The IT copier's base draws faded behind the office's back wall. That is the intended
  walk-behind effect.

## Dialogue judgement (merged ink, as played in 4498)

- **Merge:** clean. The light choice and the ask/ready/exit rework sit in one hub. Each gated choice
  drops out once used, in the same chat (4498 `light`, `ask`) and on reopen (`open2`). Both report
  globals reached the server.
- **Exit:** the goodbye shows his line, then closes; the reopen is fresh (fixed). The X path is m3.
- **Ready line:** never false. It is clumsy in the asking chat and after a take (m2).
- **Voice:** unchanged and right. The light reply ("That tube again? I'll put it out on the radio
  for maintenance now.") suits him. No eye-dialect, so it is fine for TTS.
