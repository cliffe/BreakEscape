# OPS_CORE_PLAN review, round 7 (R6 fixes, delta 27b2765e4..6d9fd6f6b)

Reviewer: Opus, adversarial, delta only. Plan: `docs/achitechture/OPS_CORE_PLAN.md` (P below), log
plan `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (LOG), both at 6d9fd6f6b. Code read at the same
commit: `interactions.js`, `pc-sessions.js`, `unlock-system.js`, `network-links.js`, `npc-needs.js`,
`apply-actions.js`, `sprite-breath.js`, `biometrics-minigame.js`, `pc-taskbar.js`,
`container-minigame.js`, `text-file-minigame.js`, `pretext-judge.js`, `core/game.js`;
`network_access.rb` (NA), `npc_frustration.rb`, `game.rb`; `scripts/validate_social/pretext.rb`;
`test/js/pc-sessions.test.mjs`, `test/js/container-shares.test.mjs`,
`test/js/network-links.test.mjs`, `test/controllers/break_escape/npc_workaround_h_test.rb`.

Rulings applied and not re-argued: remote and technique sessions stay when an NPC sits or a
borrow ends; a session-type implant needs a keyboard session; `se_technique` with the old key
read and at most an info line; every sweep and technique use logged (refusals included),
other actions first time only, no quiet/noisy split.

Counts: 0 blocker, 0 major, 6 minor, 6 nit.

## R6 findings

| R6 | Status |
|---|---|
| M1 hover wipes the mark | resolved (P:836-849, 12.2 row P:1716, `interactions-compromise-tint` test). One other `clearTint()` path remains, m4 below |
| M2 NPC at the PC | resolved as ruled (P:777-800, P:882-883, P:1351). Fallout in m1 and m2 below |
| M3 old pretext key | resolved (P:433-440, 9.1 row, 9.2 warning and info table, part 5, test row). Helper gap, n3 |
| m1 `needsSession` wording | resolved (P:170-171, P:885, P:1714). `NA:498` checked: `session['foothold'].blank?` |
| m2 where the reader sits | resolved (P:695-707), matches `unlock-system.js:283-297`, `:601-638`, `:979-981` |
| m3 taskbar and the way to the keyboard | resolved (P:744-756, beat 17a); no node test for `canSwitch`, m6 |
| m4 `_dropFoothold` | resolved (P:813-821); a source-rule mismatch it opened, m3 |
| m5 frame on the keyboard fallback | text resolved (P:756-766); the test the review asked for is missing, m6 |
| m6 section 13 vs the log plan | resolved: six `EVENTS` lines (P:1771-1778) and LOG 13.5/13.7 agree row for row; request 8 and LOG request 3 agree |
| m7 `not_responding` row | resolved (P:598-605, P:1793, LOG:1129, tests P:1438, P:1440); step 10 lags, n1 |
| n1 to n4 | resolved |

## Minor

### m1. Two existing tests assert the displacement the plan removes, and the plan forbids editing them

Evidence: `test/js/pc-sessions.test.mjs:543-565` ("H-4: npc_sat_at displaces a password, a
claimed, a guest and a remote session") loops over a `remote` kind (`remote: true, footholdId:
'f1'`) and asserts a logout, `pc_signed_out` reason `displaced`, the closing message and the copy
gone. `:568-583` asserts a remote password copy is displaced again on `npc_borrowed_session`. Under
P:783-788 both cases now return false with no logout, so both tests fail. Section 10 part 3
(P:1382-1385) says `bin/test-js` passes "with no edit to an existing test", with exceptions only
for copy lists and pretext fixtures. P:892, under the comparison table, says "Everything else in
the table is existing behaviour", but the two new NPC rows (P:882-883) are new behaviour in the
password-through-a-foothold column too. The `pc-sessions.js` header (`:81-87`, "ends whatever
session the player holds there (password, claim, guest claim or remote)") and the `displaced()`
docstring (`:737-741`, "of any kind") would then describe the old rule.
The Rails borrow test (`npc_workaround_h_test.rb:148-159`) uses a keyboard session and stays
valid.
Fix: in part 3, add the exception: `pc-sessions.test.mjs` H-4 at `:543` drops the `remote` kind
from its displaced loop (it moves into `pc-sessions-access.test.mjs` as a kept copy) and `:568`
inverts to "kept, nothing sent". Say so in the section 10 row at P:1351. Reword P:892 to
except the two NPC rows. Add the header and docstring edits to the `pc-sessions.js` row in 12.2
(P:1714).

### m2. A guest record and a player's remote copy at one PC: what a click reaches is not stated

Evidence: P:789-793 lets the NPC's guest record and the player's remote record "sit side by side
at one PC". `pcUserAt` (`unlock-system.js:545-550`) ignores `guestId`, so after the borrow a world
click on that PC goes on to `heldAtKeyboard` (`:629`), which is true for any non-relay copy, ahead
of `ws.onInteract` and the guest claim. For a technique copy the reader sends it to the remote
view. For a remote password copy (also kept now) it opens the keyboard desktop, whose fetch
settles the record (the server drops `foothold`), so the player ends with a keyboard session beside
an open guest session on one screen, a state the old "one screen, one session" rule
(`npc_frustration.rb:382-384`) never allowed. The guest claim is unreachable while the player's
copy stands. No shipped scenario hits this (m1's spot check holds), but the plan says nothing,
and a later office-life mission with networks would.
Fix: add one sentence after P:793: a click reaches the player's own copy first (remote view for a
technique copy, the keyboard desktop for any other), the guest session is not offered until the
player signs out, and a remote password copy settled by that click becomes a keyboard session
that the next NPC to sit there displaces. Add the click case to `pc-remote-view-click.test.mjs`.

### m3. The mark's source rule for a technique session differs between the table and `refresh()`

Evidence: the source table (P:810) marks a PC for "a copy with `via: "technique"`". `refresh()`
(P:818-821) takes the mark off "once `remoteViewFoothold` answers null", while the copy is still
in `pcSessions` (`_dropFoothold` does not touch it). `syncRoom` (P:806) reads the table's rule, so
leaving and re-entering the room, or a reload before the server's answer catches up, puts the
mark back on a session whose foothold is gone. A `pc_signed_in`/`pc_signed_out` handler reading
the table rule has the same mismatch.
Fix: define the technique source once, as `remoteViewFoothold(pcId) !== null`, in the P:810 row,
and say `syncRoom`, `refresh()` and the event handlers all use it. Add a `compromise-marks.test.mjs`
case: foothold dropped, then `syncRoom` of the room, mark stays off.

### m4. The fingerprint highlight also clears tints and would wipe the mark

Evidence: `biometrics-minigame.js:284-286` tints every object with lifting prints red
(`0xff0000`) and `clearHighlights()` (`:319-321`) calls `obj.clearTint()` on the same room
objects. A marked PC with prints loses its mark when the dusting view closes, until the next
mark event, which is the M1 bug through another door. The fingerprint red and the mark's light
red also read alike. P:836-849 handles only `interactions.js`.
Fix: move `restTint` to a small shared util (for example `utils/rest-tint.js`, then add it to the
harness copy lists) and use it in `clearHighlights()` too, or have `compromise-marks.js` re-apply
on the minigame's close. Add `biometrics-minigame.js` to 12.2 and a case to
`interactions-compromise-tint.test.mjs`.

### m5. The scan test row says the first sweep passes `save_limit: true`; section 13 says it passes none

Evidence: P:1435: "the first sweep's `network_swept` row and the `host_scanned` row, the first
passed with `save_limit: true` and the second once only". P:1782-1786 and P:1789: "The first
sweep and a new grant change state and save anyway, so they pass no limit". LOG:1125 and LOG
request 3 agree with section 13. A test written to P:1435 would pin the wrong call.
Fix: P:1435 to read "the first sweep's `network_swept` row, passed with no limit, and the
`host_scanned` row, once only; a repeated sweep writing its row again with `save_limit: true`
...".

### m6. The tests R6 m5 and m3 asked for are not in 11.3

Evidence: R6 m5 asked for the keyboard-fallback case in `desktop-remote-view.test.mjs`. The row
(P:1456) still covers only "from the world and from the network view" and the "through <link>"
line. P:756-766 adds two behaviours with no test: the frame on the keyboard fallback, and the
line "Remote view: <account>" with no link part when the foothold is gone. The `canSwitch: false`
rule for a blocked host (P:744-751, two minigames) is checked only by playtest beat 17a.
Fix: extend the P:1456 row: a technique copy opened by `openLoginDesktop` (no route) has the class
and the line; with its foothold gone the line has no link part; the taskbar model of a technique
copy has no `switch` on a host whose row carries `remoteSignIn: false` and has it otherwise, in
the container and the text-file minigames; a password copy keeps `canSwitch` as today.

## Nit

- n1. Build step 10 (P:1677): "every 422 writes a `technique_refused` row" should read "the 403
  `not_responding` and every 422".
- n2. P:1351 argues "a remote session needs a foothold, which needs `networks`". A `from`
  session needs no foothold; it needs `credentials` (`credentials_declared?`, NA:1504-1507). The
  conclusion stands (`test_access_social` and `test_access_work`, the only scenarios with
  `wk_borrow`, declare neither), so name both.
- n3. `scripts/validate_social/pretext.rb` has `err` and `warn_` only (`:76-82`). The info line
  (9.2 info table) needs a new `info` helper; give its format, matching the existing
  `ℹ️ INFO:` lines (`validate_scenario.rb:7317`), in step 9.
- n4. LOG:607, :939 and :992 still use "a noisy refusal on a route that saves anyway" as the
  example of `save_limit: false`. No technique refusal is like that now. Reword to "a refusal on a
  route that saves anyway", or name a real caller.
- n5. Beat 17a (P:1604): "back at `desk01`, chooses Sign out". Sign out is on the remote desktop,
  so the beat should say it clicks `desk01` again to open the remote view, then Sign out.
- n6. P:885, password column: "yes: a session at the PC's own keyboard". The column is a password
  session through a foothold, which `implant_foothold!` refuses (NA:498) until a keyboard fetch
  settles it. Older text, but it sits beside the row the fix rewrote: say "only once settled at
  the keyboard".

## Checked, no finding

- `interactions.js` tint paths: `:221-223`, `:246-248`, `:266-271`, `:277-282` as cited; the ghost
  is its own image tinted blue at `:524`; the door and NPC loops (`:298-430`) never touch marked
  objects. `setTint` replaces rather than stacks, and the `isHighlighted` guard (P:845-847) means
  the module never paints red under the hover, so no double tint. `sprite-breath.js:93` copies
  the sprite's live tint, so it follows the mark.
- Survives reload: marks rebuild from `pcSessions.load` and `networkLinks.load`
  (`core/game.js:1787-1793`), both before rooms load, and `syncRoom` applies them.
- `pc-sessions.js`: `displaced()` at `:742-765`, relay rule at `:746`, listeners at `:304-308`,
  `ownerReturned` claim-only at `:708-712`. The client sets `remote: true` for foothold and `from`
  copies (`:245-251`), and the server's record carries `foothold` or `from` (GM:3829, :4405), so
  the client rule and the `record_borrow_done!` rule pick the same sessions.
- `record_borrow_done!` at `npc_frustration.rb:391-396` deletes via `access_sessions.except`, as
  cited.
- `npc_sat_at` is emitted only at `npc-needs.js:3641`, inside `if (job.borrowed)` (`:3639-3642`);
  `npc_borrowed_session` only at `:3896`. Borrows come only from `wk_borrow` runs.
- Spot check: none of the eight scenarios declaring `networks` (`test_access_keyring`,
  `test_access_networks`, `test_access_devices`, `lab_physical_pentest`, `demo_access_tour`,
  `ca20_remote_and_mobile_working`, its `_defend` variant, `test_author_notes`) mentions `borrow`;
  only `test_access_social` and `test_access_work` do, and they declare no `networks` and no
  `credentials`.
- `implant_foothold!` NA:494-498: session shape requires a blank `foothold`, then refuses relay
  and `from` (`:501`).
- `_dropFoothold` at `network-links.js:294-305`, called from `:278`, `:285` and the unplug's stale
  path `:569`, which emits no unplug event, so the new emit covers it too. `load()` at `:182-194`
  runs at `core/game.js:1793` before rooms.
- `technique_refused`: detail keys and the nine-code `reason` list are the same in P:1777, P:1793,
  LOG:1129 and request 8; `refused` limit registered; the helper signature (LOG:782) takes
  `save_limit: true` only for a registered result, and all three limited events register one.
  The 403 row can carry `finding` and `technique` because checks 1 and 2 have passed (P:572-579).
- Section 13 and LOG 13.7: the same six rows, places, results, details and bounds; no
  `network_alerted`, `how` or quiet/noisy split left in either plan's event lists.
- Pretext: `pretext-judge.js` lives in `systems/` and reads the key at `:240`, `:258` and
  `:276` (the last two are the two candour branches); `pretext.rb` reads it at `:290`, `:418`, `:497`. No other
  reader of the line key in `app/`, `lib/`, `scripts/` or the client.
- Taskbar citations: `pc-taskbar.js:157`, `:192`; `container-minigame.js:1665`;
  `text-file-minigame.js:220`.
