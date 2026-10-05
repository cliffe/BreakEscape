# sis02 Albion Energy Storage: improvement log

Started 2026-10-05, following `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md`. Shared brief: `docs/agents/SIS02_LOOP_BRIEF.md`.

Already done before this loop: credits roll (33f7e1e: `post_incident_debrief` is the missionConclusion aim, `debrief_complete` set once).

## Phase 1: rooms and props (done, c469b05)
Every object on a fixture; alarm panel had been unclickable; Helen/Priya clear of furniture; sis02-only props. Other maps' slot audits unchanged. Art needs: BESS racks with A1–A4 plates, distinguishable gauge states, H2 detector and BMS display, DC hazard signage, ESD housing, small desk key, workshop test bench (needs a room_IT split, engine).
Tooling (15666ce): slot audit/wall check now find room_IT; validator knows spriteVariants.

## Phase 2: dialogue review, round 1 (done, 02051fc)
5 blockers, 31 majors, 18 minors. `DIALOGUE_REVIEW.md`.

## Phase 3: decisions (done)
Recorded at the top of `DIALOGUE_REVIEW.md`. Date pinned by the orchestrator: Saturday 21 March 2026 (sis03 Monday 23 March).

## Phase 4: fix pass
- Pack and sis03 consistency (done, 636ac86). Five voiced Eleanor lines changed (dates 2024→2025, "over a year ago", "on Saturday").
- sis02 ink/scenario fixer: running.

### sis03 contradictions found, not changed (for the user)
- T+48 hours vs later knowledge: Hartley "three weeks on-site", six-week outage over, cell assessment done, Ofgem "investigating".
- Eleanor :358–360 (voiced), Whitworth :114–120 say the SIS protocol vulnerability wasn't used; the decided story says it was.
- "Deadline expired 4 months before the incident" vs 31 Dec deadline and 21 March incident (under 3 months); Eleanor :249 extension "four months after the deadline".
- Eleanor :386 (voiced): c.ellison's password "compromised in credential harvesting" vs default password.
- Whitworth is "Risk Manager" in most places, "Facility Manager" in two; decided: General Manager; he files from leave.
- Trent: Albion IT interfaces with Trent SCADA (pack: shared IT only); "two essential service providers", "national emergency"; "not directly compromised".
- NCSC role: Ngata says NCSC can force disclosure through regulatory channels; NCSC brief gives an insurer war-exclusion analysis, cites "AA23-131A" (CISA format), real-looking ncsc.gov.uk address; Ngata as "NCSC Incident Officer" vs Priya S.
- Notification "pending" at T+75 min vs initial notification at 07:00.
- Exhibit B: ESD "resets PLC registers"; "no forensic record of when" vs 03:22 known.
- Minor: Hartley 58°C "approaching onset zone"; LG Chem named.
