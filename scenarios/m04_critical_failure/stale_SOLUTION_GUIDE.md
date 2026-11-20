# Mission 4: "Critical Failure" — Solution Guide

> Renamed 2026-10-01: Robert Chen → Robert Vance (the character was renamed in pass 1; his ids now match). Ids `chen_*` → `vance_*`: globals `chen_trust_level`, `chen_is_ally`, `chen_provided_keycard`, `chen_phone_available`, `chen_knows_truth` → `vance_*`; every `chen_*` ink knot and VAR → `vance_*`; ERB `chen_warning_email` → `vance_warning_email`. NPC ids (`robert_vance`, `robert_vance_phone`) were already right. The puzzle structure described here is superseded by `PUZZLE_CHAINS_PLAN.md` (pass 3).

**Setting:** Albion Energy Storage — 200 MWh grid-scale lithium-ion BESS
**Rewritten:** 2026-08-21.

> The previous 542-line version of this guide described a **water treatment facility** with a
> **chlorine dosing** attack and a **three-vector disable** sequence. All three are obsolete: the
> mission is grid battery storage, and the attack is stopped by a single hardwired Emergency
> Shutdown. That version has been replaced.
>
> For the authoritative step-by-step critical path (with QA checks), use
> [`TESTING_WALKTHROUGH.md`](TESTING_WALKTHROUGH.md). This guide is the spoiler-level summary.

## The situation

ENTROPY's Critical Mass cell, under **Blackout (Dr James Mercer)** and run on site by his lieutenant
**Voltage**, entered Albion Energy Storage on a fake OptiGrid maintenance contract. They own the
BMS/SCADA layer and have falsified the thermal telemetry, disabled the hydrogen venting and ESD
interlocks, and armed a remote overcharge trigger for 0800. Eleven people are on site (nine on the
Hall 2 night crew), and 40–60 are at risk on the dropped feed.

## The one thing that stops it

Everything the player does on a terminal, ENTROPY can undo — they own the software layer. The attack
is stopped by the **hardwired Emergency Shutdown pushbutton** in the plant room: physical contacts,
no network path, the one control the cell could not reach. Pressing it isolates the banks and forces
ventilation.

It is gated two ways (`esd_authorized` = `anomaly_detected` **and** `voltage_neutralised`):
1. **Confirm the hazard is real** — read the analog thermometer against the falsified SCADA panel.
2. **Deal with Voltage** — he holds the live trigger and stands beside the button. Pressing it while
   he is conscious means he fires first.

## Route

1. Talk past the guard; meet **Robert Vance**, get the Level 1 card.
2. Read the analog thermometer → `anomaly_detected`. **This starts the clock.**
3. **Cipher** (battery hall 1) → Level 2 → engineering workshop.
4. Work the **BMS jump server** VM; submit four flags at the drop-site
   (web status page → ProFTPD → distcc foothold → sudoedit to root).
5. **Relay** (battery hall 2) → Master → plant room.
6. **Voltage:** Fight, Arrest, or go for the button and let him run. All three resolve the mission.
7. **Press the ESD.** Attack aborted. Debrief.

## The clock and the costly ending

Two timers run from `anomaly_detected`: an H₂ advisory at T+22m, and rack venting at T+40m. If the
racks vent before the shutdown, **the mission still concludes** — the player can still press the ESD,
the debrief acknowledges the Hall 2 casualties, and the credits read **COSTLY SUCCESS**. Failure here
is avoidable and player-paced; it never dead-ends the run.

## Decisions that show in the ending

- **Voltage:** captured (Fight/Arrest) or escaped (button).
- **Robert Vance:** made an ally, or not.
- **Disclosure:** full / quiet / partial, chosen in the debrief.
- **Racks vented:** clean success vs costly success.

## Learning objectives (CyBOK)

Network scanning and service enumeration (NS); vulnerability exploitation and privilege escalation
(SS) via distcc CVE-2004-2687 and sudoedit CVE-2023-22809; SCADA/ICS exposure through an OT jump
host (CPS). Field guides for each step are offered by Agent HaX as the player reaches them.
