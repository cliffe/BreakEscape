# SIMS-3 review, round 4: design and server together, one light round

Branch `build/ol-sims` at 3f4068967 (R3 fixes 8e1df6c3f and eecf7e424; SIMS-4 light choice in
`neil.ink`). Keyless server :3095 from the p-ol-sims worktree, headless chromium, stopped by PID
after the run. One fresh `new-game.rb test_needs_sims` game, **4608** (two further games were
created first and not used). Every chat was opened and closed through its UI, the page was taken
through the interaction path, no trigger events were emitted and no need levels were set.

Script, report and screenshots: scratchpad `officelife-sims/s3-review-r4/` (`r4.mjs`,
`r4-4608.out`, `r4-4608.json`, `r4-*-4608.png`, `dump.rb`). Neil's lines below are the text shown
in the chat, not inferred from flags.

## Verdict

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 1 |

**Not ready to close.** The R3 findings are closed, but the four-branch ready line has a false
branch on the X-close path (M1). The fix is one ink line.

## Live run, game 4608

| Step | What happened |
|---|---|
| A, fresh first chat | Greeting, then five choices; **no light choice** (`staff_room_seen` false). `r4-A-open1-fresh-4608.png` |
| Staff room, back to IT | `staff_room_seen` true |
| B, second chat | Greeting, then six choices; the light choice is now offered. `r4-B-open2-after-staff-4608.png` |
| B, ask | "The change log? Aye, no bother. I'll fire it at the copier now, give us a sec." The ask is replaced by "Is that change log ready?" |
| B, ready in the asking chat | "Soon as you let me get back to it, pet." |
| B, light | "That tube again? I'll put it out on the radio for maintenance now." The choice then drops out. |
| X close | The chat closes; the page lands on the IT copier tray about 6 s later (auto-print confirmed, `neil_page_on_tray` true) |
| C, reopen after X close | "Back again? What's up?" then the choices; no stale reply. `r4-C-reopen-xclose-4608.png` |
| C, ready | "It's on the copier tray, pet. Help yourself." Then X close again. |
| Take the page | Via the interaction menu (owner item m5, not re-raised); the reader shows the change log. `r4-D-reading-4608.png` |
| D, reopen after X close | "Back again? What's up?" |
| D, ready | **"Soon as you let me get back to it, pet."**, with the page in the inventory (M1). `r4-D-ready-after-take-xpath-4608.png` |
| E, X close mid-reply | Picked "How's the coffee?" and closed 250 ms later with only the player's line on screen; the reopen shows "Back again? What's up?" and the choices (`reopenRefreshesHub` works). `r4-E-reopen-midreply-4608.png` |
| F, goodbye, reopen, ready | Greeting (fresh start), then "You've got it already, pet." |
| G, wait 36 s, reload, reopen, ready | Greeting, then "You've got it already, pet." All Neil globals survive the reload. `r4-G-ready-after-reload-4608.png` |

Server state after the run (`dump.rb 4608`): `neil_print_asked`, `neil_page_taken`, `job_called`,
`staff_room_seen` and `it_out_a_shown` true, `neil_page_on_tray` false; `it_out_a` in the inventory
and in `it_room`'s `objects_removed`; `player_state` 7863 bytes.

## R3 findings, checked

| R3 | Status | Evidence |
|---|---|---|
| Design M1, reload story | **Closed** | README:65, plan:371 and :542, build log:213 and the `game_loaded` comment at `scenario.json.erb:611` now say the tray is always empty after a reload (stow on sight) and cite 4507 and 4512. The 4328 citation and the `_worldChanged` advice are gone. One remaining sync claim is wrong; see m1. |
| Design m1, "by the close" | **Closed** | README:65 says the next 30 s sync or the unload flush. |
| Design m2, ready line fallback | **Closed for the two states raised** | `neil.ink:47-56`. Same-chat reads "Soon as" (B); after a take on the goodbye path reads "You've got it already" (F, G). The new `asked_now` branch is false on the X path; see M1. |
| Design m3, X-close reopen | **Closed** | `neil.ink:35-37` and `scenario.json.erb:1059`. Both the choice-point reopen (C, D) and the mid-reply reopen (E) show the re-entry line, with no doubled or stale line. |
| Design m4, light choice before the staff room | **Closed** | `neil.ink:70`, mapping at `scenario.json.erb:612`. Absent in A, offered in B. |
| Design m5, page shares pixels with the copier | Owner item (build log:383) | Not re-raised. |
| Design m6, stale plan data | **Closed** | Plan :179 and :225 carry the new values; README:906 marked superseded. |
| Server m1, wrong "empty" citation | **Closed** | Folded into the M1 rewrite (build log:204, :213). |
| Server m2, `_worldChanged` claim | **Closed for that claim** | Dropped everywhere. Its replacement is wrong in the other direction; see m1. |
| Server m3, mirror on slot recycle | **Closed as a caveat** | Owner table, build log:382 (SIMS-6). |

**Server and cheat resistance.** Every global Neil's ink sets or reads (`neil_print_asked`,
`neil_page_on_tray`, `neil_page_taken`, `job_called`, `staff_room_seen`) is declared at
`scenario.json.erb:57-62`. None is server-owned, imported, worn or a gated-door credit global, so
`merge_global_variables!` (`app/models/break_escape/game.rb:800-836`) accepts the client's writes.
`asked_now` is ink-only, and the server stores it as a bounded NPC ink variable. A forged
`neil_page_taken` or `staff_room_seen` changes only which line Neil speaks or whether the light
choice shows. A forged `neil_print_asked` allows one print and one optional task, as in R3. None
grants an item, a key or a secret, so all of them are within the policy (ink-gated, best-effort).
`player_state` stays bounded, and each new global is one boolean.

## Major

### M1. After an X close, the ready line says "Soon as you let me get back to it" even when the page has printed and the player is holding it

**Site:** `scenarios/test_needs_sims/ink/neil.ink:48` (the `asked_now` branch is tested first),
`:43` (set) and `:26` (the only reset, in `start`). The README claims sit at `README.md:61` and
the M2 row at `:924` ("honest in every state").

**Cause.** `asked_now` is reset only in `start`. A goodbye ends the story, so the next open runs
`start`. An X close does not end the story. The reopen re-navigates to `hub`
(`person-chat-minigame.js:570-584`) or re-enters it through `reopenRefreshesHub`, and neither runs
`start`, so `asked_now` stays true from the asking chat. The first branch,
`asked_now && not neil_page_on_tray`, then wins over `neil_page_taken`.

**Evidence (4608).** The steps were ask, X close, the page prints, reopen and "ready" ("Help
yourself", correct), X close, take the page, then reopen. The globals read `taken: true`,
`on_tray: false`. Picking "Is that change log ready?" gave "Soon as you let me get back to it,
pet." (`r4-D-ready-after-take-xpath-4608.png`). The same path without the take, reopened inside
the 6 s delay, also gives "Soon as", which is tolerable. After a take, it is false.

The X is the usual way to close a chat. This is the same class as R2 M2 (a false ready line), the
README says the opposite, and m02 copies this ink.

**Fix.** Reset the flag on every reopen. Put `~ asked_now = false` at the top of `hub` before the
re-entry line (`neil.ink:35`). Only reopens pass that point, because the start knot and every
in-chat reply divert to `hub.choices`. A reopen inside the delay then falls through to the
"have a look" line, which is true. Optionally, move the `neil_page_taken` branch first as well, so
no later flag can override it. Recompile `neil.json`. Re-prove the D step above, and add an X-path
row to the README M2 table at `:924`. No new voiced line is needed.

## Minor

### m1. The docs now say a bare eventMapping `setGlobal` never reaches the server; it does, on the next sync

**Sites:** `scenario.json.erb:611` (the `game_loaded` comment says "This bare setGlobal does not
sync to the server ... deliberately client-only"), `:612` (the `staff_room_seen` comment says "a
bare setGlobal does not sync to the server"), `OFFICE_LIFE_SIMS_BUILD_PLAN.md:371`, `README.md:65`
and `OFFICE_LIFE_SIMS_BUILD_LOG.md:213` and `:218`. All of them say a global persists only when a
task completion forces a sync, and that a copying mission must set it with a mapping that also
completes a task.

**Evidence.** The periodic sync copies every global into its shared sections
(`public/break_escape/js/state-sync.js:464`) and sends whatever differs from the confirmed
snapshot (`seedFromSaved`, `:163`). That happens on the 30 s timer (`:417`) and in the unload flush
(`:421`). In 4608, `staff_room_seen` is set only by the bare `room_entered:staff_room` mapping.
It read true on the server after the run, and true in the browser straight after the reload,
before the staff room was re-entered (step G).

**Impact.** No runtime harm. The non-`onceOnly` re-set and the per-load clear are both still
correct. But the docs teach m02 to wrap plain flags in task completions it does not need, which
is the same kind of wrong model R3 M1 corrected.

**Fix.** Reword the six sites as follows: "an eventMapping `setGlobal` changes
`gameState.globalVariables` at once and reaches the server on the next periodic sync (30 s) or in
the unload flush. A task completion only makes that sooner." Drop "client-only" from the
`game_loaded` comment. The clear runs on every load anyway, which is why it is safe. Cite 4608
`staff_room_seen`.

## Not counted

- The ink's ready branch inside the 6 s delay after an X close reads "Soon as". The M1 fix
  changes it to "have a look", and either reading is honest.
- The page take still goes through the interaction menu (owner item m5).
