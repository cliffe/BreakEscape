# OPS_CORE_PLAN review, round 2

Plan: `docs/achitechture/OPS_CORE_PLAN.md` at commit cbdc20507 (1573 lines). `P:n` is a plan line.
Code pointers are repo paths with line numbers, read in this worktree on 2026-11-19.

## Status of earlier blockers and majors

R1 and R1b had no blockers.

| Finding | Status | Evidence |
|---|---|---|
| M1 `host_row` has no foothold | Closed | P:698-727: `network_rows(network_id, foothold_id)`, `host_row(pc, foothold_id)`, server-set `openHere`, `hostAction` reads only the flag; test row in `network_technique_blocked_host_test.rb` (P:1167). Callers checked: `network_rows` at NA:873, `host_row` at NA:1043 take no foothold today, so the edit is needed as written |
| M2 schema top level and item open | Closed | P:210-231 table; P:980-981 |
| M3 403/404 existence oracle | Closed | P:483-489 `ops_listed?`; P:834-844 one fixed 404 body; P:1163 byte-for-byte test |
| M4 confirm is free | Closed, as user question 2 | P:130-146, P:1528-1545 |
| M5 repeat undefined | Closed | P:539-542 and P:572-585 define the repeat after checks 1 to 3; two-foothold case in P:1166 |
| M6 noise writes not carried through | Closed, one gap | Sections 6 (P:856-864), 8 (P:930, P:935-936), 11.2 (P:1164, P:1166) carry it. Gap: the `noiseLimit` rule contradicts itself (m-new-3 below) |
| M7 S2 cannot ship alone | Closed differently (decisions file) | P:225-231, P:1011: `grants` and `needs.session` are "not built yet" errors in S2, optional after. The reasoning holds; see m-new-6 for what it leaves behind |
| M8 log rows before S9 | Closed | P:1428-1434: helper lands before S1, never saves, rows written before the route's `save!`. Signature matches the log plan (`OPS_LOG_ROWS_PLAN.md:809`) |

Reviser's open read-through list (handover): items 2 (section 7 and the no-exposure test do not name the 400 or `no_grant`), 4 (11.5 not revisited), 5 (section 3's S3 row and 12.1 step 9 do not name the `no_grant` warning or `connectsTo` check) and 6 (no single list of refusal codes) are still open; 3 (graph edge for a weakness with no `grants`) is still unstated at P:1059-1066. Taken together as minor m-new-8.

## Findings

### Blocker

None.

### Major

#### M-new-1 (major). `notes1` is not a plain paper sprite: a card of that type gets no tray slot, no toast and, with no text, never appears anywhere

P:36, P:368, P:396-402 and the decisions file (m18) treat `notes1` as "the existing paper sprite" with "no engine behaviour beyond being picked up", left for the build step to confirm. The engine keys a whole family of behaviour on `/^notes\d*$/`, and `notes1` matches it:

- `public/break_escape/js/systems/inventory.js:964-975`: a notes-family item never gets an inventory slot ("skips the UI slot for notes types"); it returns `added` with nothing drawn.
- `inventory.js:705`: `pickupToast` returns null for notes types, so no "Item Acquired" toast.
- `systems/interactions.js:2008-2013`: notes go to the notepad through the notes minigame, and only when they carry `text`; a card has none, so it is not shown there either.
- `systems/npc-game-bridge.js:305`: an NPC gift of a notes item goes to `_receiveNote` (notepad), the path P:118 relies on for "a gift from an NPC".
- `scripts/validate_scenario.rb:1781` (a `collect_items` target of notes type must be `readable` with `text`) and `:2643` (a notes item in a `dispenses` container is warned and opens the container screen instead).
- `container-minigame.js:2276`, `:2293`, `:2374`: notes items in a container take the reader path.

So with the plan's placeholder the player picks up a card and sees nothing at all: no slot, no toast, no note. `storeIn` (P:439) files a tray item into a holder, which a notes item never is. The server still records it, so the techniques panel would list it, which hides the bug from the controller tests. The test scenarios and every example are written to `notes1`, and P:401-402 promises the later art swap changes "the type and nothing else".

Fix: choose the placeholder now, not in the build step, from a type no type-keyed code reads, and say how it was checked (grep `scenarioData?.type`, `item.type ===`, `/^<name>/` in `public/break_escape/js` and `scripts/`). Candidates with a card or paper look in `assets/objects/`: `lw_guest_card`, `qr_card`, `lw_card_index1` (each needs that grep; `text_file` is also type-keyed at `container-minigame.js:2276`). Add a node or playtest assertion that a picked-up card has a tray slot and a pickup toast.

### Minor

#### m-new-1. An unconfirmed finding that shows "Fixed" is known to be real

P:330 ("a finding already held shows Fixed"), P:905 ("only Fixed on a held finding") and P:1165 ("one already found shown fixed") put Fixed on any held finding, including an unconfirmed one. Decoys have no `fixedIf` (P:33), so Fixed on an unconfirmed finding says it is real before any confirm, against P:913 ("before a confirm nothing differs between a decoy and a real finding except authored text"). The confirm of such a finding is also quiet whether or not the evidence is held (P:507-510), so the player gets the real/decoy answer for free and silently.
Fix: send Fixed only on a confirmed finding; an unconfirmed one whose weakness is now fixed looks like any other unconfirmed finding until confirmed. Keep the quiet confirm. Add the case to `network_ops_no_exposure_test.rb`.

#### m-new-2. `noiseLimit` on an unswept discovery block says the network holds findings

P:524-526 and P:1088 send `noiseLimit` whenever the network declares `alert`; P:894 says "on a listed block". An unswept discovery network's block is listed with `hosts: []`, so `noiseLimit` there tells the player the network has something to probe, which is exactly why `ops` is withheld on an unswept block (P:462-465, n3 in round 1).
Fix: send `noiseLimit` (and the other two) only on an open or swept network, as `ops` is; add it to the "before a sweep" exposure test (P:911).

#### m-new-3. The noise keys contradict each other on a network at zero

P:525 sends `noiseLimit` "when the network declares `alert`"; the next sentence (P:526) says "A network with no noise carries none of the three"; P:1088 says "only on a network with noise, an `alert`, ...". With an `alert` and zero noise, one reading sends `noiseLimit`, the other does not, and the view's "Noise 0 of 5" before the first probe depends on it.
Fix: pick one. Recommended: on a swept or open network with `alert`, `noiseLimit` always; `noise` only above zero; `alerted` only once reached. Say it once in 5.3 and point to it from 7 and 10.

#### m-new-4. The keyboard refusal code `no_session` makes the client drop a live session

P:639-641 and P:754: at the keyboard, a technique session answers 403 `no_session`. In the client, `no_session` means "the server holds no session here": `container-minigame.js:1007-1010` and `:1020-1021` call `pcSessions.dropLocal`, which deletes the copy and emits `pc_signed_out` (`pc-sessions.js:866-873`); `workstation-state.js:223` and `keyring.js:365` act on that event. The server still holds the session, so the client and server disagree until a reload. The plan says the client will not ask (P:643-645), but a stale path, the folder route, or a test bridge call will.
Fix: give the keyboard case its own code (for example `network_only`) with a line in `REFUSAL_TEXT` and a keyboard branch that shows the sign-in screen without dropping the copy; or say why `no_session` is safe here and add the "client still holds the session after the refusal" assertion to `pc-sessions-access.test.mjs`.

#### m-new-5. `label` for a `global` or `itemType` need or evidence has no source

P:503: "`label` comes from the scenario object named (a credential's label, an item's name)". A `global` need or evidence names no object, and an `itemType` names a type, not an item. P:903 forbids the global's name. The implementer has nothing to show, and the likely shortcut is the global name.
Fix: give `opsNeeds.global`/`opsEvidence.global` and `itemType` a required authored `label` (plain text, max 40) in the schema rows P:972-973, or say the engine shows a fixed line per kind ("A condition in the world", "A <type> item") from a client table.

#### m-new-6. A weakness with no `grants` is a trap for cards and for needs after S3

The decision to keep `grants` optional (decisions file, M7) holds for S2. After S3 two things follow that the plan does not handle:
- `no_grant` is check 9, after the match (check 7, noisy) and the needs (check 8). A report-only finding that no technique matches costs a noisy `wrong_class` for every card tried and can never reach the quiet `no_grant`; validator error P:1023 covers only weaknesses with `grants`.
- A report-only weakness may carry `needs` (allowed from S2, P:1018). After a confirm it shows "needs: the manual, not met" (P:113-116), the player fetches the manual, and the card then answers `no_grant`. A dead errand built into the loop that is meant to teach preconditions.
Fix: from S3, a validator warning (or error) for `needs` on a weakness with no `grants`; and either move `no_grant` to just after the status check (it is quiet, and "nothing for a card to do" is not a secret worth noise), or have the view show "Report only" on a confirmed finding with no grant. Put the choice to the user only if the reviser thinks the "learned by getting it" rule at P:904 matters more.

#### m-new-7. `itemType` and the identity-strict check do not fit

P:335-337: an item need is held when "the inventory entry is not forged, and its id and type equal the authored definition". For `itemType` there is no authored id to compare against. The rule needs restating: some held, unforged entry whose id is an authored item of that type. Also, with the placeholder sprite question above, a card of type X satisfies any `itemType: X` need or evidence.
Fix: state the `itemType` rule in 4.2 and P:546-547, and add a validator warning when an `itemType` need or evidence names a type that any technique card also uses.

#### m-new-8. Read-through gaps left from the revision pass

- No single list of refusal codes. The handover lists twelve (`bad_request`, `not_found`, `not_needed`, `not_responding`, `not_confirmed`, `false_positive`, `fixed`, `wrong_class`, `wrong_product`, `wrong_version`, `need_unmet`, `no_grant`); P:1179 reads them "from a fixture" that no section defines. Add the list once in section 6, beside `REFUSAL_TEXT` (P:87-90), and name the fixture file.
- Section 7 (P:910-915) and `network_ops_no_exposure_test.rb` (P:1170) do not cover the 400 body or the `no_grant` refusal.
- Section 3's S3 row (P:208) and 12.1 step 9 do not name the `no_grant` warning or the `connectsTo` checks of P:1013.
- 9.3 (P:1059-1066) does not say a weakness with no `grants` has no outgoing edge, so `lock_key_diff` will list it as a lock that opens nothing.
- Cross-plan request 12 (P:1517) is one unwrapped line.

#### m-new-9. Technique sessions count for good in `signedInPcs`, decided without asking

P:625: a technique session joins grow-only `signedInPcs`, so it completes "sign in at this PC" tasks in `objectives-manager.js`, proves `session` capture proofs and keyring `session` proofs permanently. The plan calls this "the intended default". For a teaching game that is a real choice: a mission that teaches "get the CFO's password" can now be finished with a card, and the author may not notice. It changes what existing objective types mean in a scenario that adds cards.
Fix: add it as a fifth open question (options: count it, as now; do not add technique sessions to `signedInPcs`; count it but let an objective say `via: password`), with the recommendation, or add a validator warning when a sign-in task's PC is also the target of a `grants.session`.

#### m-new-10. A quiet refusal saves "for the row alone", against the log plan's pattern

P:1451: a quiet `technique_refused` saves for the row. The log plan's own call sites save "only when the helper stored something" (`OPS_LOG_ROWS_PLAN.md:293`, `:328-329`, `:344`), because a merged repeat returns nil (`:808-809`). As written, a client hammering a quiet refusal costs a save per request with nothing new stored.
Fix: on a quiet refusal, save only when `write_log_row!` returned a row.

### Nit

- n-new-1. P:223: `hosts` and `services` are S1 fields but the error text reads "not built yet: N15"; they are N13 (and the S2 fields N14). Give each its own feature id.
- n-new-2. P:919-920: "never sent whole" is true because the bootstrap copies a whitelist of `player_state` keys (`credential_login.rb:107` comment); say so with the pointer, so a later plan does not add the keys to it.
- n-new-3. P:816-818 and the brief's ruling "one route per feature": S2 adds two routes (`/check`, `/confirm`) and S1's `/scan` serves two moves by parameter. The brief says "its own server routes", so this fits, but section 6 could say in one line why `/scan` is one route with two modes rather than two.

## Checked and found sound

- Noise mechanic: deterministic (no rolls, P:809-812); bounded (one integer per network, capped at 99, P:524, P:930); server-owned and not a sync section; carried back in the same answer through `add_server_writes_to_answer!` (`game.rb:239-245`), which the client applies from any API answer (`api-client.js:116`); survives reload (P:947). Grinding only raises one's own count and stops at 99; no route lowers it. Dodging: an unconfirmed finding answers the quiet `not_confirmed` before any match, so a card on an unconfirmed decoy tells nothing; the only free real/decoy signal is m-new-1. The alert global must not go in `SERVER_OWNED_GLOBAL_NAMES` (that list also hides a global from the client, `game.rb:228-230`); P:523 says it joins `server_owned_global_name?`, which is the right list provided the build adds a per-scenario name source as the credit globals do (`game.rb:187-190`). Worth one sentence in 5.3.
- `start_login_session!` edit (P:587-590) fits `game.rb:4388-4417`: the record is built from keywords, so two more `if present?` lines suffice; `login_session_answer` (`:4433`) and `session_for_client` (`:3778-3791`) take named arguments as the plan says.
- `desktop_request_allowed?` foothold branch quoted at P:674-675 matches `network_access.rb:1509-1510` exactly (the plan's NA:1509-1511 is right); the keyboard branch is `:1511-1516`.
- `folder_route_allowed?` (`games_controller.rb:3185-3197`) passes a no-route request at any non-relay session, as P:735-740 says.
- `resource_admits_player?` foothold branch (`network_access.rb:1590-1594`) is where the sweep condition goes; the container route answers an unadmitted share as an unknown id (`games_controller.rb:640-645`).
- Harness copy list (P:1188-1193): the four tests named are exactly those in `test/js` that reference `network-view-minigame`.
- Binding rulings: no shared moves registry, no actor concept, neutral schema terms, `access: "admin"` only when computed admin (P:69-74), technique session meets no sign-in checks (P:653-655, P:1482-1485), snake_case rows through the log helper that lands first and never saves (P:1428-1436), refusal reasons are codes with one client table (P:87-90, P:846-848).
- Open questions 1 to 4: each a real user choice with options and a recommendation; numbers in the body (P:142, P:416, P:646, P:653-654) resolve.

## Not checked

Section 11.4 beat tables (P:1198-1322) beyond the noise beats, 11.5 live proof (P:1323-1346), 12.1 and 12.2 step by step, section 2's pointers other than those cited above, `credential_login.rb`, `CK`, `VN`, `DG` and `lock_key_diff.rb` line numbers, `pc-sessions.js` `load`/`publicSession`, and whether S1 alone ships with no weakness fields (read in section 3 only).

## Verdict

Not yet clean: one major (the `notes1` placeholder) and ten minors. The R1 and R1b majors are closed. A further round is needed after the reviser acts on these.
