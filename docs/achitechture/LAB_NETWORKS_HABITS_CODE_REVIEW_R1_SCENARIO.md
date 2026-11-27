# lab_physical_pentest networks and habits: code review, round 1 (scenario half)

Branch `build/lab-networks-habits` against `main`, scenario half only:
`scenarios/lab_physical_pentest` (scenario.json.erb, ink, PLAYTEST.md, dungeon graph) and its
scenario-level tests (`test/models/break_escape/lab_physical_pentest_secrets_test.rb`). Engine code
and tooling are reviewed separately. Read-only review; no browser run.

Checked against `ACCESS_MODEL_SLICE_9_3_PLAN.md` section 10, `ACCESS_MODEL_SLICE_9_1_PLAN.md`
section 12, `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md` B1 and B2, and the claims in both build logs.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 7 |
| Nit | 4 |

## Static checks run

- `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/lab_physical_pentest/scenario.json.erb --skip-ink --no-graph`:
  exit 0. Network reach line lists the three hosts and two resources; identity reach shows
  `c.hampshire` at `hot_desk_pc` and `store_controller`; the habits report matches the 9.1 build
  log exactly (hampshire high, lockChance 1 at `staff_pc`; pierce low, lockChance 0 at
  `staff_pc_2`); no screen state mapping warning; no "not applied".
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_physical_pentest/`: totals by rule
  none.

## What was verified as applied

9.3 section 10.1: `networks.office_lan`; `kit_dropbox.rogueDevice`; `network_port` as the jack with
`networkJack`, `network`, `plantedSprite`, `linkName`, `jackConfirm` (the A13 text), the old
`requiresItem`, `triggerOnInteract`, `set_global` and `remove_item` gone, `requiresItemHint` kept
(the jack code reads it when no rogue device is held), the observation variant on
`network_port_planted`; Ruth's plant mapping on `network_device_planted:network_port` with no
`completeTask`; the `network_port_planted` object removed and the global declared. `linkStoreIn` is
left out and logged with its reason (no capture log holder yet, B3), which the plan allows.

9.3 section 10.2: both resources as written (the records share has no `contents`); `hot_desk_pc`
and `staff_pc_2` hosts with unchanged access; `store_controller` as the headless host with every
listed field and the three pages; `store_controller_folder` holding `onRead`, so `opt_controller`
and Ruth's capture mapping are untouched; `network_viewed:office_lan` sets `kp_dropbox_viewed`;
`opt_netdrop` and `opt_door_admin` as server-checked `unlock_object` tasks writing their globals;
the door capture on `pc_signed_in:store_controller`; the riser is not a host. The server's
`complete_task!` refuses a jack task without `gainedFootholds` and a sign-in PC task without
`signedInPcs`, and a headless host refuses any sign-in with no foothold.

9.1 section 12: steps 1 to 6 as written (only the two PC fields existed; the awareness levels
replace them; no `habits`, no `guessable`, nothing on Len; office life fields untouched; both
comments reworded; the report is clean). The `high` preset also sets `holdsDoors: false`, which
only acts on a guard's gate, and Chris guards none, so nothing else changes. Step 7's guard test
changes and the new claim test are in. Step 8's PLAYTEST block is in; the dated note in
`PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` is the orchestrator's and is not on the branch.

Records share: listed with a **Look** row and its observations, no contents, mapped on no desktop,
and the test asserts both. Voiced lines: the six in the 9.3 build log's "Lines to voice" match the
ink diff exactly (one new in `ruth.ink`, three re-voiced and two new in `ruth_debrief.ink`), with
the right line numbers and old clip ids; none holds a variable, a cue or a stage direction. The 9.1
step changed no ink, as logged. The dungeon graph draws the controller only from the network node
and Chris's sign-in, with no edge from the store room.

## Major

### M1. The controller's password can be guessed from Melanie's, so the keylogger can be skipped

`scenario.json.erb:1208` (Chris, `Ledgerwell#Spring26`) and `:1501` (Melanie, `Ledgerwell#Autumn26`).
`attempt_login!` checks only the password; the lab sets no `maxAttempts` on `store_controller`, so
there is no lockout. A player who claims Melanie's open screen sees her password in full on the
tablet, reads the season pattern, and with the drop box planted can try `c.hampshire` with the
other three seasons at the controller's row. The third guess at most gets the admin page, completes
`opt_door_admin` and earns the "drop box plus Chris's password" debrief line, with no keylogger.
The username is not secret either (the lock screen and the door pages follow `initial.surname`).

The rules of engagement put guessing out of scope, but nothing enforces or notices it, and the 9.3
plan's "Why this payoff needs the box" says Chris's password comes "only from the keylogger". The
9.1 plan's step 3 rests on the same premise ("nothing in the lab gives the player every part of
one or the rule"), which Melanie's captured password weakens. The same shortcut exists at the hot
desk, but there it skips nothing the lab requires.

Fix, a design call for the user:

1. Give Chris a password that does not share Melanie's pattern (for example a word from her desk
   or role, not a season). No text in the lab prints any password, the tests read `creds`, and no
   voiced line names one, so the change is local. Or
2. Keep the pattern as a deliberate lesson and say so: a `maxAttempts` on `store_controller` (the
   Captured sign-ins picker fills the right password, so a real player rarely mistypes it), and a
   scope note in the debrief if the account was signed in before its capture. Or
3. An engine rule that a remote sign-in needs the account's `captureProof` (for the engine
   reviewer and the 9.3 owner).

Whichever is chosen, correct the sentence in 9.3 section 10.2 and the premise in 9.1 step 3.

## Minor

### m1. The debrief gives the door admin payoff before it mentions the drop box

`ruth_debrief.ink:171-173`. The `kp_door_admin` line ("And the drop box plus Chris's password got
you the door system's own admin page") plays after the store room and controller lines, about
fifteen lines before the extras block introduces the drop box (`:185-189`). The player hears the
payoff, then "A few extras you turned up", then the box being planted as if new. The build log
placed it apart because the folder read is optional; but `kp_door_admin` always implies
`kp_netdrop_planted` (the server completes `opt_netdrop` before any sign-in through the box can
happen), so it can nest there.

Fix: move the `{ kp_door_admin: ... }` block inside `{ kp_netdrop_planted: ... }`, after the
`kp_dropbox_viewed` block. The words do not change, so no extra voicing; the line number in the
"Lines to voice" table moves.

### m2. Nothing points the player from the plant to the controller

`ruth_phone.ink:81` answers "I've got Chris's password. Now what?" with the hot desk only, and
`:99` (the comms cupboard option) disappears once the box is in. After the plant the only guide to
the controller is the task title of `opt_door_admin` and the row in the view. A player who planted
the box before the keylogger capture has no prompt to reopen the view from the link item later.
The objective title carries the requirement, so this is not a dead end, but it misses the aim that
the player always knows the next step.

Fix: one phone option, for example
`{kp_netdrop_planted and kp_creds_captured and not kp_door_admin} [The drop box is in. What now?]`
with a reply such as "Open it from your bag. The door controller's on its list, and it takes a
front of house account." If phone lines are voiced, add it to the lines to voice.

### m3. The folder text invites an action that does not exist

`scenario.json.erb:2159`: "That login works only at the box's own service port." The player is
standing at the box holding that login, and nothing there can be used. A student is likely to try
the controller again, see only "no screen", and wonder what they missed.

Fix: close it in the same sentence, for example "That login needs a service cable at the box
itself, and using it would change the client's door system, which the rules forbid."

### m4. The `opt_controller` capture note still describes the old folder

`scenario.json.erb:734`, Ruth's `kp_controller_found` mapping: "its admin login still the factory
default ... Anyone who reaches this cupboard could add a badge to the records-door zone or switch
the reader off ... change the default admin credentials". The folder and the rewritten debrief
lines now call it the service login, and the folder no longer claims the zone can be reprogrammed
from the cupboard. The tablet shows the old story beside the new one. The plan kept the mapping's
wiring unchanged, not its words.

Fix: reword the note to the service login on a label, usable only at the box, and "change the
default service login". Not voiced.

### m5. PLAYTEST H5.20 expects a message this lab never shows

`PLAYTEST.md:985-986`: "the controller's remote session ends ("The link dropped")". The unplug
happens at the jack, so no remote desktop is open, and `PcSessions.linkDropped` shows the text only
on an open desktop. Both browser runs saw no message. A scripted run following H5.20 literally
reports a failure.

Fix: check the session instead (`verify-run.rb --access` shows no session for `store_controller`
after the unplug), or keep the wording if the design question below is answered yes.

### m6. PLAYTEST's expected output and story note are stale

`PLAYTEST.md:1009-1013` says "in this lab no sign-in screen takes Chris's or Sofia's password",
which H5.4 (hot desk) and now H5.19 (the controller) contradict. `:1018-1025` lists warnings that no
longer match the validator (for example `saved_cards` and `showNpcIntentBubbles` are absent today,
and two door alignment notes are present), and its "Four identity reach lines" omits
`c.hampshire` at `hot_desk_pc` and `store_controller` and the three new network lines (Network
reach, two "Reachable without a foothold"). Part of this predates the branch, but step 9 added
lines to the output without recording them.

Fix: replace the paragraph with the current output's warning list and the identity and network
lines, and reword `:1009-1013` to name where captured passwords are used.

### m7. Two 10.3 test points are covered indirectly

`lab_physical_pentest_secrets_test.rb:634`. Section 10.3 asks that the controller's pages are
served only to Chris's session through a foothold; the test checks `desktop_request_allowed?`
rather than fetching the contents, so a fault in the container answer itself would pass. No test
asserts the server-checked tasks: `complete_task!('opt_door_admin')` refused before the remote
sign-in and accepted after, writing `kp_door_admin`, and the same for `opt_netdrop` writing
`kp_netdrop_planted`. The debrief and the credits read both globals, and this is the chain the
review brief says must be server-enforced.

Fix: add those two task assertions to the existing tests, and fetch the controller's desktop
contents through the same call the container route uses, with and without the foothold.

## Nits

- **n1.** `ruth.ink:46` "Once it's in, its view shows what answers." "Its view" means nothing to a
  player who has not planted yet. Something like "Once it's in, it shows you what answers on their
  network." The line has no clip yet, so a change now is free.
- **n2.** `scenario.json.erb:1048`, `kit_dropbox` observations still say "joins the LAN"; every
  other text on this branch moved to "office network". Not voiced.
- **n3.** `scenario.json.erb:98`: the share's observations describe the folders ("one per client,
  about two hundred ... plus _Templates and _Closed") rather than naming the top ones; the plan
  says "giving the top folder names". Acceptable, since naming clients would be client
  information; noted so the deviation is a choice.
- **n4.** `ruth_debrief.ink:172`: every neighbouring debrief line pairs the finding with its
  control; this one has none (the capture note does). Optional second sentence, which would add a
  line to voice.

## Design question: a message on unplug when no remote desktop is open

Yes, it should. The unplug is the moment the chain's lesson closes: the access lived on the box,
and a defender who finds and pulls it ends every session that went through it. Today the player
sees the box return to the bag and the link item go, and nothing says the controller session
ended. A short toast when the unplug answer's `endedPcIds` is not empty, naming the hosts, does it:
for example "Unplugged. Your session on LW-DOOR01 ended." With no ended session, no extra toast.
It is engine UI text, not a spoken line, so the rule on voiced lines does not apply. It belongs to
the 9.3 owner (`network-links.js` `unplug`, or `PcSessions.linkDropped` when no desktop is open),
not to this lab. If it is built, m5's wording stands as it is.

## Not covered here

The persona runs of 9.3 section 10.3 and 9.1 section 12 are not run (both logs say so), and the
BadUSB beat's LW-FS01 leak question was settled by a scanner change that the engine reviewer owns.
Habit beats were judged from the validator report, the guard tests and the 9.1 browser log, not
from a run of my own.

## Verdict

Approve after M1 is decided. Every row of both recipes is applied or its deviation logged, the
records share cannot be opened, the voiced list is complete and clean, the habits give the
intended beats, and I found no soft-lock. M1 is the one gap in "the chain is enforced by the
server": it needs the user's choice between changing Chris's password, a lockout, or an engine
rule. The minors (m1 to m7) can go in the same fix round; none needs new audio except m2 if phone
lines are voiced.
