# P1-T0b: bridge-1b.jsonl

Script: `tools/playtest/se/bridge-1b.jsonl` (186 lines, 78 `eval` assertions), same style as bridge-1a: boolean `eval` rows
checked by `check-bridge.mjs`, row label first in each `fn`, `[P1-J]` on rows that need the mail runner. Ids come from
`scenarios/test_social_slice/scenario.json.erb` (Teague target and her `teague_mail` record, the four `note_*` stand-ins,
`freemail` account with `tt1`/`nt2`, `burned_guest`). Generator: scratch `se-P1-T0b/build.mjs`.

## Run

Fresh slice game 2905 on keyless :3001, headless, Node 24 and the 1148 browser wrapper as in P1-T0.
`node tools/playtest/se/check-bridge.mjs <log>`: **assertions 78, passed 74, failed 4**. Run time about 4 minutes
(the J rows wait for two 15 s replies; N5/N6 wait for Hampshire's). The mail runner (P1-J) was wired during the run, so
all `[P1-J]` rows pass (J0 to J5, K4b, D2). bridge-1a rerun on game 2906 after fixing A3: 37/37.

## Sections

S0; L1 to L9 accounts (switcher, Create account as an Esc layer, write order, per-mailbox unread, Esc closes panel then
overlay); C1 contact record; P1 to P8 pre-send gate and picker data on Teague (neutral line, nothing names a fact,
disabled Send inert, options only from held facts); K0; PK1 to PK10 picker by keyboard (listbox focus, arrows, Home/End,
wrap, Tab held, Esc order picker then composer then overlay, Enter picks, focus returns); S1/S2 failing then landing send;
N1 to N4 `inert` behind checklist, composer, Contacts; K1 bar in reading pane; J0 to J5 runner; K2/K3 board mount; D1/D2
reload; H1 to H6 and N5/N6 Hampshire from the created account with `withReply` revealed on `mail_job_done`; B1 to B3 reported
account; N7 to N12 600 px.

## Failures (4, all real)

- **P7, PK9 [F-1] (P1-L/P1-N, mail-composer.js `_renderFrom`)**: when the From wording set has one template, `_fromIsOwn()` is
  true and `_renderFrom` returns early, so Teague's `sender_name` and `sender_address` blanks (from `from_named`) are never
  drawn, yet `evaluateGate` counts them. As the Operator account the player can never enable Send, and the gate line says
  "Choose an option for the sender_name blank" for a blank that is not on screen. PK10 passes only because it fills them
  through `composer.setSlot` (exercised, not earned). Fix: `_fromIsOwn` must be false when the chosen From template has slots.
- **K2 (slice, P1-O)**: `intelBoard.people` lists only `hampshire`, so the board has no Teague card and no board-mounted bar.
  K3 (Teague pushed into `people` at run time) passes, so the mount works. Fix in the slice: add `"teague"` to `people`.
- **K4 [F-2] (mail client)**: with the Sent message open, a delivered reply calls `_refresh()` which rebuilds the reading pane
  and the bar, so the bar's "Last change: +10 senderTrust" line and its live announcement are lost. The value is right.

## Limits

- Synthetic keys cannot move browser focus, so Tab order is "all tabbable, in DOM order, each takes focus" as in 1a; picker
  opening uses the blank button's `click()` (what Enter does on a button); listbox keys are dispatched on the focused list.
- Esc with a `select` focused only blurs it (social-overlay.js `TEXT_FIELD` rule), so L9 presses Esc twice and checks the first.
- 600 px: the session viewport is fixed at 1400 and the game does not start inside an iframe (main.js:402). N7 to N12 move the
  overlay's own `.minigame-container` into a 600x900 same-origin frame carrying copies of all page stylesheets, measure there
  and move it back. Real CSS and DOM, narrower viewport only. N10 (44 px toolbar targets) and N11 pass.
- Exercised, not earned: H3 (`checklistTiming = 'withReply'` set on the client), B1 (`burned_guest` set directly), PK10
  (From blanks via `setSlot`), K3 and N12 (Teague added to `intelBoard.people`). Facts and sends are earned in game.
- bridge-1a.jsonl A3 updated to expect the Account switcher first.

## Update after the fix (orchestrator)

F-1, K2 and F-2 fixed by the opus48 fixer: bridge-1a 37/37 (game 2907), bridge-1b 78/78 (game 2908). PK9 and PK10 now fill the From blanks through the picker (earned). Still exercised, not earned: H3, B1, K3, N12.
