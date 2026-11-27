# Answer file: fixture D, "Night train" (judge only)

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.4, read at 3327 lines, latest review entry "Round 4 outcomes".
Do not show this file to the player. It goes with `fixture_D.md`.

## Truth

| Suspect | Car | Where | Want | Carry | Truth | Why |
|---|---|---|---|---|---|---|
| Sato | 1 | Archive | Codex ✦ | notebook | **Cultist** | Courier: Archive, wants the Codex, no ward charm |
| Chen | 2 | Archive | Codex ✦ | ward charm, notebook | Not a cultist | Courier fails on the charm; 1 marked clue; no key |
| de Vries | 3 | lecture hall | promotion ✦ | sigil ring ✦, burner SIM ✦ | **Cultist** | Devotee: 3 marked clues |
| Volkov | 4 | garden | funding | brass key ✦, ward charm | **Cultist** | Keyholder |
| Mensah | 5 | lecture hall | peace | umbrella | Not a cultist | No profile matches |

The right call: Sato, de Vries and Volkov cultists; Chen and Mensah not. Any wrong or missed call fails the
mission (`fail_mission`, reason `wrong_call`), skips `d_case_solved` and scores 65 %. There is no retry.

## Mechanics hidden from the player

**Witness influence** (§7.2 defaults): first question free, each later one −15 after its answer; `wary` at
−20 (vague answer, no clue, topic stays open), `refuses` at −40, `reports` at −60. Kind word +20, once. The
conductor answers all four: Q1 0, Q2 −15, Q3 −30 (wary), kind word −10, Q4 answered. The steward's three fit
with no kind word (Q3 lands at −30 after its answer).

**Stops.** Stop 1 timer: 120 s after the start. Stops 2 to 4: 120 s after first entering car 2, 3, 4. Hint
at 90 s. The door object fires the stop at once; the stop is `once`. Stops 1 to 3 run `deduction_tamper`,
which fades **the first listed fact the player does not already hold**; if it is already held, nothing fades.

| Stop | Fact at risk | Source closed when faded | Recovery route (never closed) |
|---|---|---|---|
| 1 | Sato, Archive pass | luggage rack label, car 1 | the conductor, car 4 |
| 2 | Chen, ward charm | Chen's coat, car 2 | shredded document, car 3 |
| 3 | de Vries, burner SIM | de Vries's phone, car 3 | backup recovery terminal, car 4 |
| 4 | none | — | opens car 5, sets `d_last_stop` (the call becomes available) |

So when running the test as game master: at each of stops 1 to 3, if the player has not taken the listed
clue, its board cell turns to "Evidence destroyed" and that source then gives nothing.

**Second routes that are always open:** Sato's pass also from the conductor; Chen's charm also from the
shredded document; de Vries's SIM also from the backup recovery; Volkov's key also from a KO drop (a KO is a
verdict, locked as guilty, judged at the call; KO on Volkov is right, on anyone else it loses).

## Reasoning notes for the judge

- From car 1 alone (Sato's pass, Sato's, Chen's and Mensah's wants) nobody is decided (§9.4 hand check).
- Sato needs his carry cell: his notebook (car 3 lost property) fills his only carry cell, so no ward
  charm, and Courier is true. Elimination route: both ward charms found on Chen and Volkov also settle it.
- Chen clears on the ward charm (Courier's "no ward charm" fails; key elsewhere; only 1 marked clue).
- de Vries: want, ring and SIM give 3 marked clues.
- Volkov: the brass key (count 1).
- Mensah: wants peace, so Courier fails; carry is an umbrella, so no key; at most one marked clue (none
  here).
- Common traps: calling Chen a Courier without her charm (the "rule misread" debrief line if the charm was
  held); leaving car 1 without the rack label and not asking the conductor (Sato's pass destroyed and not
  recovered, so Sato stays undecided); leaving car 3 without the phone and skipping the backup terminal.

## What the packet invented

Everything marked [placeholder] in `fixture_D.md`: clue wording, clue labels on the count list, topic
wording, the setting paragraph, the guard's lines, the start inventory (the plan does not list one for D;
the briefcase needs a lockpick and the glass needs the fingerprint kit), Mensah's and Volkov's topic
wording, and pronouns not given in the plan.
