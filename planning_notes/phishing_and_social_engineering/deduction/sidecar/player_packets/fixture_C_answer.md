# Answer file: fixture C, "Safe house" (judge only)

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.3, read at 3,327 lines, latest §14 round: Round 4 outcomes.
Companion to `fixture_C.md`. Don't show this to the player.

## Truth

| Suspect | Kit | Travel | Alibi | Truth | Why |
|---|---|---|---|---|---|
| Ahmed | SAFETYNET phone, field kit | went to the quarry site | verified alibi | Not a sleeper | No burner; went to the quarry but has a verified alibi |
| Novak | cult-issued burner ✦, SAFETYNET phone | went to the quarry site | no verified alibi | **Sleeper** | Both branches: carries the burner; went to the quarry with no verified alibi |
| Baptiste | SAFETYNET phone, field kit | never went | verified alibi | Not a sleeper | No burner; never went to the quarry |

Profile rule: `any[ has cult_burner, all[ has arkham_trip, not has verified_alibi ] ]`.
Internal ids: `cult_burner`, `safenet_phone`, `field_kit`, `arkham_trip` (label "went to the quarry
site"), `no_arkham` ("never went to the quarry site"), `verified_alibi`, `no_alibi`.

Scenario settings: verdicts `allowed: ko, act`, `when: anytime`, `reveal: end`; `nudge: false`;
`disclosure: hidden`, rigidity `costly`; scoring default (`tasks`).

## What decides each suspect (plan's hand check)

- Lounge plus the bedroom (open from the start): nobody decided. Count reasoning (one burner, Ahmed's trip
  known) does not force anyone.
- Plus the office: Novak decided guilty (her bag: burner). Baptiste decided clear (travel log: never went).
  Ahmed stays open (alibi hidden, and two verified alibis are spread over three hidden alibi cells).
- Plus the garage: the door log (and Novak's badge at the reader) decides Ahmed: verified alibi, so clear.
- Expected route: bedroom bag (office code) → office (bag, locker, safe via the note, clone Novak's badge) →
  garage (reader, door log).

## Reactive outcomes (reveal only when triggered)

- **Any knockout or act verdict**: no right or wrong shown in play (`reveal: end`). Board shows "Verdict
  given" and the verdict line.
- **Wrong call on an innocent (Ahmed or Baptiste), at the verdict**: toast "HaX revokes your safe-house
  keycard."; the keycard leaves the inventory and stays gone after a reload. After this:
  - the bedroom and comms doors need a contact to open them (`#unlock_door`);
  - HaX offers the office code on a new choice [placeholder wording];
  - the garage still opens with Novak's cloned badge.
  Also sets `c_hax_trust_down` (credits line) and `c_keycard_revoked`.
- **Second wrong call, at the verdict**: HaX rings at once: "You've turned on two of our own. Get out now?"
  with "Get out" (closes the case: leaving, comms room locked, verdict close) and "Not yet". Also sets
  `c_network_scattered` (credits: "The network scattered."). HaX does not ring if the player is already
  leaving.
- **Sending someone to wait**: they leave; HaX's lock choice appears. Locking gives an `act` verdict to
  each person waiting. The exit phone's confirm also locks the comms room, so anyone waiting gets their
  verdict before close.
- **Close**: everyone without a verdict is ruled "Not named". Novak not named = missed: sets
  `c_sleeper_escaped` (credits escape line). Solved task `c_case_solved` completes only if every outcome is
  right. Close always completes `c_extracted` and sets `c_ending`.
- **Close hint** once all three have verdicts: "Everyone has been dealt with. Use the exit phone when you're
  ready to leave."

## Expected debrief (perfect run: Novak acted on or knocked out, the others not named)

- Novak: right_guilty, "Sleeper: yes, carries a cult-issued burner".
- Ahmed: "Not named (innocent)", "Sleeper: no, verified alibi".
- Baptiste: "Not named (innocent)", "Sleeper: no, never went to the quarry site".
- No-blame line: "Every call matched the evidence."
- Credits header "EXTRACTED", ticker "EXTRACTED", "SAFE HOUSE"; never "MISSION COMPLETE"; no escape line.

## Reviewer note (not shown to players)

`twistNote`: "Trust no one. The player is not told what a wrong call costs. Losing the keycard straight
after a wrong takedown tells them they got it wrong, but not why; the debrief explains."

Knocking out all three at the start catches Novak but loses the keycard, brings HaX's pull-out, names two
innocents in the credits, scatters the network and skips the solved task.
