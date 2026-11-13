# Answer sheet: Night shift (fixture B), for the judge only

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md`, 3327 lines, latest review round "Round 4 outcomes" (§4.3, §4.9, §6.3,
§6.7, §9.1). Player packet: `fixture_B.md`.

## Solution

| Suspect | Truth | Access | Device | Grievance | Why |
|---|---|---|---|---|---|
| Ngozi Okoro | **Insider** (matches Insider) | out of role | personal | yes | all three clauses met |
| Erik Lindqvist | Not an insider | out of role | **none** | yes | fails on device |
| Samira Haddad | Not an insider | in role | personal | **none** | fails on access and grievance |
| Morgan | Not an insider | in role | none | none | fails on all three |

Right report: name Okoro only, then "That's everyone", then "Yes, send it".

Debrief closing line: "The access log, the network and the HR file each cleared someone. Okoro fitted all three."

## Shortest reasoning paths (§4.3 rules)

- **Haddad**: clear as soon as "Haddad: no grievance" is held (HR summary).
- **Morgan**: clear from her own "no grievance" (HR summary), or by count elimination: once both "grievance this
  month" clues are seen (Okoro and Lindqvist, from Tomás, the complaint copy or the HR summary), Morgan can't
  have one even with her cell hidden. Haddad gets the same elimination.
- **Lindqvist**: clear once "Lindqvist: no personal device" is held (DHCP printout, server room only). Count
  route: both "personal device" clues seen (Okoro and Haddad, both on the DHCP printout) also clears him, but
  that needs the printout anyway.
- **Okoro**: guilty once access out of role (badge log), personal device (Tomás or DHCP) and grievance (Tomás or
  HR) are all held. Pigeonhole: with both "went in for their own work" seen on Haddad and Morgan and Lindqvist
  out of role, her hidden access cell is forced too, but that also needs the badge log.
- Before the server room nobody can decide Okoro or Lindqvist. Haddad and Morgan can be decided from the office
  and kitchen.

## Expected nudge moments

- Haddad and Morgan: when both grievance copies are seen (Tomás's "unhappy" plus "pay" or the complaint copy), or
  when the HR summary is taken.
- Lindqvist: at the DHCP printout.
- Okoro: at the last of her three clues (usually the badge log or the printout).

## What the player sees after close (debrief, kept out of the packet because it reveals the truth)

- Okoro right: "Right call"; "Why: Insider: yes, …".
- Innocents not named: "Not named (innocent)", each with a failing clause, e.g. "Insider: no, no personal device".
- Wrong name (e.g. Lindqvist): "Wrong call", and if every fact was held, "You already held what settled it: no
  personal device"; the no-blame line "The evidence was there. Checking each profile line against it is the
  habit that catches this."
- Okoro not named: "Missed".
- Nair's last line differs on a wrong name (`b_wrong_name`); the plan gives no wording [placeholder].
- The success screen always reads "Case closed". Scoring is `completion`, so the score never changes.

## Points to check while judging the packet (not solution-critical)

- Tomás's alarm topic (§9.1): "he heard the server room alarm at two, and Lindqvist went in". The badge log puts
  Lindqvist in at 23:40 and Okoro at 02:10. As written, a player may read Tomás as placing Lindqvist in the server
  room at two, which contradicts the log and points at the wrong person, with no fact to resolve it. Either the
  intent is a red herring (Lindqvist went to check the alarm after Okoro's 02:10 entry, unbadged?) or the line
  needs rewording.
- Okoro, Haddad and Morgan have no topics in the plan. A player who talks to them gets nothing, so the packet
  marks them [placeholder].
- The plan doesn't say what gates Lindqvist's pay topic, or whether influence changes are shown on screen.
- The design doc (`designs/12_deduction_board.md` §B) opens "One of four staff on a night shift let an intruder
  in". That wording states a count, which §3.1 and DL10 ban. The packet's brief placeholder avoids it.
