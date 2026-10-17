# Resolved decisions

Decisions the user has settled, so nobody reopens them. Newest first.

## 2026-10-17 (from the decisions questions)

- **m05, Lisa names Torres too early:** make Lisa vaguer ("someone on the crypto team" with money worries) and leave the name to the vetting files and the door log. The user: "Make sure the challenge is fun and not too hard to figure out, but if the aim is deduction, make the choice that is most fun."
- **m08, how hard the mole is to spot:** leave it as it is now (the two narrator tells are already cut).
- **Player HP survives a reload:** save and restore it, restoring full HP from 0. Save hostile NPCs' HP too (m08 E12), so a reload heals neither side.
- **Credits overlay text:** each of m05–m08 gets its own `creditsOverlay` operation and ticker. The operation row defaults to the mission's name when none is set.
- **Art fixes approved:**
  - Priya's wall plaque (m06 blockchain lab background);
  - the m06 HQ debrief window at night;
  - the m07 situation board going red after step one runs (L1 option A);
  - the m08 RECORDING lamp as a lit scenario object (L1).
- **Engine backlog approved:**
  - lock feedback: m07 U9 RFID reader with an empty cloner, m07 E1 flag lock with no `requires`, m07 E4 case-sensitive password hint, m08 E2 PIN keypad names its lock;
  - phone during fights (m07 U12);
  - text and variants: m08 E5 variants in the dusting panel and lock/container headers, E3 dusting text wrap, E1 objectives key wording;
  - the validator knows `facePlayerDistance`/`personalSpace` (m08 E8);
  - sight circles hidden after a KO or a spent catch (m08 E9).
  - m08 E6 (a reopened hub repeats its last line) stays **not approved**, per 2026-10-16, although it was listed in the "text and variants" group.
- **Carrying choices between missions:** plan it and propose it, but don't build it yet. The user's idea: feed in earlier completed missions' state as read-only globals (e.g. `m01-scenario-path-variable-1`, taken from the most recent completed matching mission), declared simply in scenario.json.
- **PixelLab quota expanded** (Tier 3, 5,490 generations left on 2026-10-17): the m07/m08 walk characters and the Architect's in-person sprite go ahead now.

## 2026-10-16 (from the pending-decisions form)

- **No "resume in the room you left".** A reload or a Restart after a knockout puts the player back in the start room. Loading the last room risks bugs with rooms that aren't loaded, and the walk back is a fair small cost of being knocked out. Don't propose it again; stop logging it as an engine item (it was m05 D18 M1, m07 E5/U11 in part, m08 E10).
- **A reopened conversation showing the previous line above the hub (m08 E6, form 7.3b): not approved.** Leave as is.
- **Calls kept:** every orchestrator call in form section 5 stands, except m05's CyBOK trim (5.3), which is redone with the CyBOK mapper skill for m05–m08.
- **Healing:** coffee cups and other consumables become health boosts (no out-of-combat regeneration).
- **Hostility reset on respawn:** only for NPCs that aren't knocked out; track what the NPC holds.
- **Punch cone:** widen slightly (no auto-facing).
- **Vision cones:** don't draw them for hidden or knocked-out NPCs.
- **POV backgrounds:** office ceiling lights throw symmetrical light, never a slanting beam (now in the room-pov-background skill).
- **Rooms follow their POV background when they differ** (m04 operations office: the room was changed to match the background).
