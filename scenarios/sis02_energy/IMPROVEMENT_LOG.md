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
- sis02 fix pass (9cf6d9e): all blockers/majors and decisions; Priya S. from sis01; ids helen_marsh, priya_s; eight decision scenes.
- sis03 contradictions resolved on the user's instruction "apply your best judgement" (264ff8b): set 7 May 2026; W-03 causally arguable; Whitworth General Manager; NCSC as CSIRT; Trent shares IT only.
- Cross-consistency pass (dad0fee, 7b91f99): fact table across both scenarios, packs, lab sheets and the forensic minigame (now data-driven); Insurance Act corrected (no proportionate deduction for warranty breach); claim components rebalanced inside £8.2M; arbitration not Lloyd's; Tor address 198.51.100.45 (documentation range).

## Phase 5: review and playtest loop
- Script editor review (d135863): revise, 6 majors. Playtests A, B, C (games 5040-5043).
- Engine (c62cb71, d816137): credits visualiser themes (user: safetynet and generic cyber; modes per theme); historian data-driven with hint and click-to-select; dash and label polish. sis01/sis03 use the cyber theme (035da41).
- Round 2 (89ac60d), confirmation review (revise, 1 major) and playtest D-F (4 majors); round 3 (57f8230); Run G (2 majors, all steps pass); round 4 (5e52b40); Run H running.
- Orchestrator rulings: third ESD station inside the hall kept; evidence is the PLC-BMS register export (a real action); "Good call" only after evidence.

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

- Round 4 (5e52b40); Run H clean (game 5057). Review and playtest loop closed.

## Phase 6: lab sheet (done)
- d539185: sis02 lab sheet rewritten in sis01's structure (20 questions, 9 exercises, each tied to a moment in play); publish-ready front matter for sis02/sis03 lab sheets and packs (published authors).
- HacktivityLabSheets branch claude/practical-planck-fvt3ha (1eaf23b): all six SIS files byte-identical with BreakEscape (cmp). Not merged to main: the user decides when to publish. The published sis01 copy had never been updated (HIPAA/FDA era). That commit carries Claude attribution lines by mistake (force-push to remove them was refused).

## Next
Phase 7 cast (CAST_DESIGN.md, Gemini concepts, PixelLab: ask the user before spending), phase 8 round-2 dialogue review, phase 9 audio (ask).
