# OPS_CORE_PLAN review, round 4 (delta)

Plan: `docs/achitechture/OPS_CORE_PLAN.md` at b401f3fe3 (1684 lines), reviewed as the diff
against 04dea0645. `P:n` is a plan line at HEAD. `LP:n` is a line of the working copy of
`docs/achitechture/OPS_LOG_ROWS_PLAN.md` (being revised), `SK:n` of the working copy of
`docs/achitechture/OPS_REALISM_SKIN_PLAN.md`. Code read in this worktree on 2026-11-19.

## Status of R3 items

| R3 item | Status | Evidence |
|---|---|---|
| M3-1 `network_only` in the wrong handlers | Closed, one wrong sentence left (n4-1) | P:676-693. Checked against `container-minigame.js:974-1070`: a world click builds the lockable with no `scenarioData.remote` (`:734-740` take `remote`, `relay`, `fromRoute` from the lockable only), so the keyboard fetch has no query (`:980-981`), skips the remote (`:1005`), `from` (`:1015`) and relay (`:1032`, `:1037`) branches and meets `expired` (`:995`), `off` (`:1049`), then `fromReturn` (`:1056`) and the catch-all (`:1065`). A handler between `off` and `fromReturn` is reached on every keyboard path. No loop: `openLoginSignIn` (`unlock-system.js:712`) opens the desktop only after a sign-in that succeeds (`:799-801`). The plain sign-in screen with no line is right: it is exactly what the first, normal click shows (P:691-692), so a stale copy gives the player the same screen. Test P:1263, build step P:1469 |
| M3-2 `from` kind | Closed | P:1536-1538 states kind `foothold`, filled by the log plan; LP:1035, LP:1067, LP:1099-1100 now register and fill it |
| m3-1 spare and `files01` | Closed | P:1373-1378: spare is the report-only weakness, `files01` grants a user session. Beat 5a (P:1390), 15 (P:1399) and 16 (P:1400) agree with checks 5-7 (P:579-582): the spare is confirmed by probe in beat 3 before the alert fixes it, so 5a reaches check 6 and answers `no_grant`; `files01`'s weakness is confirmed in beat 3, is not a repeat (its session is a `credential` one from beat 7, check 4 asks for a technique session), has `grants`, so check 7 answers `fixed`. 10a names jack A and 16 lists `desk01` |
| m3-2 log 13.7 save on every 422 | Closed on the log side (LP:1104), but see m4-2 | LP:1104 now says `save!` only when `r&.stored?`, with `save_limit: 10`, and claims "the core plan matches" |
| m3-3 `EVENTS` file | Closed | P:1230, P:1500, P:1528-1529 |
| m3-4 `service` by bare name | Closed | P:1531-1534; LP:1101 "shown by name" agrees |
| m3-5 first empty check | Closed in core; log plan stale (m4-3); one wording gap (m4-4) | P:513-520, P:937, P:1008, P:1247, beat P:1362 |
| m3-6 keyboard row in the blocked-host table | Closed | row removed from the table at P:803-812; P:671 says "on every host"; test P:1249 covers both host kinds |
| n3-1 asset path | Closed | P:1174, P:1506 |
| n3-2 question 1 cited | Closed | P:485 |
| n3-3 `technique_card` before S3 | Closed | P:232-234; `validate_scenario.rb:3273` not re-opened |
| n3-4 S5a badge | Closed | P:1503 |
| Trim list | Applied in part (decisions file) | plan 1684 lines; no rule or test lost in the cut passages I read (P:58-60, P:192-196, P:229-234, P:333-334, P:408-428, P:944-957, P:1170-1177, P:1569-1599) |

## Findings

### Blocker

None.

### Major

#### M4-1. Who builds the shared `perform` path and its pending guard: core S1-S3 or skin K1

P:538-546 and P:834-836 now say every action of the network screen, unplug included, goes
through "one `perform` path, shared by both renderers", with a guard keyed by action and target,
and that a message an action leaves (the line after an unplug among them) is drawn by the
renderer, never by `perform`. The core test row `network-view-ops.test.mjs` (P:1265, stages S1
to S3) asserts it for sweep, scan, check, confirm, use and unplug, and "the line after an unplug
drawn by the renderer". P:1503 has S6 "share" the path, which reads as if core built it.

The skin plan builds the same thing in its own stage K1: SK:143 ("`perform` with the one
pending-request guard, and the unplug's pending label and notice drawn by the renderer"),
SK:297-299 ("it replaces the core's per-button disabling and the scene's `_unplugging` flag"),
SK:968, SK:977 ("replaces the core's per-button disabling with the pending guard"). SK:143 also
requires the core's node tests to pass K1 "with no edit to an assertion".

Today unplug has its own guard and writes its own notice into the DOM
(`network-view-minigame.js:829-860`, `_unplugging`, `setUnplugNotice` sets `textContent`), pinned
by `test/js/network-view.test.mjs`. So either core S1-S3 rewrites the existing unplug path, which
P:1170-1177 (section 10, no-regression) does not list, or the P:1265 assertions cannot pass until
K1, which lands after S3. Two smaller mismatches ride on it: SK:303-305 gives every `use` one
shared key, P:540-541 keys `use` by target; and the coordinator ruling in the decisions file
(line 49) only asked core to "describe" the guard this way.

Fix (core side, since the ruling places the build in the skin): P:538-546 say that through S3
the core view disables each ops control from its press until the answer, keyed by action and
target, and that from K1 the skin's `perform` path takes this over for both renderers, unplug
included. Move the unplug and "drawn by the renderer" assertions out of P:1265 (they are K1's,
SK:143) and keep the per-control assertions for sweep to use. P:834-836: "From K1, a message ...".
State the `use` key one way in both plans.

### Minor

#### m4-1. The plan relies on `heldAtKeyboard` deciding from `via` but never names the change

P:691-692 says "the keyboard open path in `unlock-system.js` and `pc-sessions.js` decides from the
copy's `via`". Today it does not: `pc-sessions.js:480-483` `heldAtKeyboard` is `!!s && s.relay
!== true`, true for any foothold session, and the client fallback `unlock-system.js:266-270` uses
`has()`. Every keyboard decision reads it (`openLoginPc` `:292`, `interactLoginPc` `:629`, the
sign-in screen's `onComplete` `:799` and `:865`, `keyboardSession` `:273`). The plan's only
pointers are "the keyboard path" (P:1262, P:1470, P:1505). Beat 10a (P:1394) then says the script
edits the copy "so the keyboard path takes it for a keyboard session" without saying which field,
which a playtest author has to reverse-engineer.
Fix: name it in 5.4: `heldAtKeyboard` (`pc-sessions.js:480`) gains `&& s.via !== 'technique'`,
the fallback at `unlock-system.js:266-270` gets the same test, and with it `keyboardSession` and
the sign-in screen's `current` treat the PC as having no keyboard session. Beat 10a: "edits the
copy's `via` to `password`". With that edit 10a does run the real handler: the second click goes
`interactLoginPc` -> `openLoginDesktop` -> `loadLoginDesktop` with no query, as traced above.

#### m4-2. Core's account of the quiet-refusal bound is not the log plan's `save_limit`

P:598-603 says the helper "keeps a stored counter per event and place, merges repeats up to a
bound, and after the bound drops the row". The log plan's mechanism is different in two ways.
The bound is `save_limit: k`, an argument the caller passes (LP:823), and LP:1104 has the core
call pass `save_limit: 10` on a quiet refusal; the core plan never names the argument or the
number, so the implementer of `use_technique!` has nothing to pass. And the counter is per event
and `where` only (LP:917-920), counting every stored call (append or merge), not "repeats": in
beat 5a each distinct card appends its own row (correct, LP:924-927 merges only on equal
`detail`), and each of those stored calls spends one of the host's ten. P:1555 and P:1246
("the repeats up to the log's bound save") repeat the "repeats" wording.
Which side changes: the core plan. P:598-603: "A quiet refusal passes `save_limit: 10`: the
helper counts every stored `technique_refused` call at that host, whatever card or finding, and
past ten drops the call and answers nil; a noisy refusal passes none." Same words in P:1555 and
P:1246 ("the first ten quiet refusals at a host save, the eleventh and later do not"). Beat 5a
holds three cards at that point (beats 1 and 4), so it stays inside the bound, but say whether
beat 2 and beat 5's quiet refusals share the spare's host.

#### m4-3. Log plan 13.7 still bounds `service_checked` by "a check that adds a finding"

LP:1101: "one per check that adds a finding; findings per service are capped by the scenario".
Core now writes the row on the first check of a service whatever it found, and never again
(P:513-520, P:937, P:1554 "once per service"). Which side changes: the log plan, LP:1101: "once
per service (caller: first check, via `opsDiscovered.services`)".

#### m4-4. A repeat check that adds a newly unfixed finding still answers `already: true`

P:516-520: `already: true` "only when the service is already in that list", and "a repeat check
still adds an entry for a weakness that has become unfixed since". Read together, that check
writes an `opsFindings` entry and an alias (and so saves) but answers `already: true`, which
section 6 (P:946-949) defines as a repeat that "writes nothing". Fix P:516-517: `already: true`
when the service is in the list and the check added nothing; a check that adds a finding never
carries it.

### Nit

- n4-1. P:678-679: "Two already keep the copy: the `expired` handler ... and the powered-off
  handler". The `expired` handler drops the copy (`container-minigame.js:999`,
  `window.pcSessions?.dropLocal?.(pcId)`). Harmless to the design (a technique session has no
  token), but it is a false claim about code. Say "the `expired` handler, which drops the copy but
  cannot meet a technique session, and the powered-off handler, which keeps it".
- n4-2. P:671-675 does not place `network_only` in `desktop_refusal`'s keyboard branch
  (`network_access.rb:1037-1039`). Answered only when `login_pc_reachable?` holds, a stale or
  hostile keyboard fetch for a PC the player cannot reach gets `unreachable` and the catch-all
  drops the copy. Say it is answered for any no-route request at a technique session, after
  `expired`, before `off` and `unreachable` (the session is the player's own, so nothing leaks).
- n4-3. Beat 10a (P:1394) "the first click shows the sign-in screen with no request sent": the
  sign-in screen sends `GET /login_accounts` (and `/keyring` where declared). Say "no desktop
  request".
- n4-4. P:1008 gives `opsDiscovered.services` a count bound (8 per host, so 512 keys at the
  64-host cap) but no byte size. Two 40-character ids and a dot make about 41 KB at the cap, held
  in `player_state` though never sent. One line with that figure, or a scenario cap on services,
  would close it.

## Checks asked for

- `desktop_request_allowed?` (`network_access.rb:1495-1520`) with P:732-751: a technique session
  at admin on a headless blocked host passes the foothold branch only through its own foothold
  (P:729 makes `!remote_blocked?` the alternative to `technique_session_through?`). Another held
  foothold fails both, a `from` route fails `!remote_blocked?` and the `from` match (`:1509-1510`),
  and no route fails `!NetworkModel.headless?` (`:1518`). P:745-749 is right, and test P:1249
  asserts each case.
- `opsDiscovered.services` (P:513-520, P:1008): bounded by the schema's 8 services per host
  (P:282, P:1089) and written only after `/check` has passed its 404 (host listed, scanned, has
  that service, P:937), so a client cannot add an unearned or invented entry. Never sent, so it
  is outside the delta rule; the `/check` answer carries only that service. See n4-4 for size.
- Log rows: one `technique_refused` row per card in 5a matches the merge rule (LP:924-927, equal
  `detail`). `from` uses kind `foothold` on both sides. The `service` lookup shows the bare name on
  both sides (P:1531-1534, LP:1101). Mismatches: m4-2 (core changes), m4-3 (log plan changes).
- Open questions: all five still read correctly against the trimmed body. Question 3(c)'s cost
  line (P:1648-1649) still fits; question 5 (P:1666-1684) agrees with the shortened table row at
  P:657.
- Scripted edits: no broken sentences, orphan fragments or duplicated passages found in the
  changed hunks; every table at HEAD has a consistent column count (checked by script).

## Verdict

Not yet ready: one major (M4-1, the `perform` guard claimed by both core S1-S3 and skin K1, with a
core test row that cannot pass before K1), four minors and four nits. All are wording or
ownership edits; the client handler and the server gate are sound against the code.
