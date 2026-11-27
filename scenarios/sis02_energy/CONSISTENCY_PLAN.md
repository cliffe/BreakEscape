# sis02_energy: consistency plan (2026-10-09)

Status (2026-10-09, later): **superseded.** Option A happened through merge 1cece907. The audit-log fix proposed below was not applied: the merged game already labels the rows as HMI-ENG-02's own engineering tool history (`scenario.json.erb:1796-1803`), which the pack (`:769`, `:787`) and Helen (`npc_helen_marsh.ink:262`) match. See IMPROVEMENT_LOG.md phase 10.

Original status: on hold, needed a decision from the user (D4 in `DECISIONS_PENDING.md`). No game, ink, sheet or mission.json edits were made.

## What the fact-finding found

The game on `main`, the information pack and the lab sheet disagree because they come from two different versions of the game.

- A full sis02 improvement pass was done on 5 October 2026 on the branch `origin/claude/m03-improvement-loop`. It includes the room fixes, dialogue review round 1, the fix pass, script-editor rounds 2 to 4, the round-2 dialogue, a pack rewrite, the lab sheet rewrite and `CAST_DESIGN.md`. That is 21 sis02 commits, from `33f7e1e0` to `20a319e5`.
- **None of those commits are on `main`.** The branch split from main at `ebdb4523` (4 Oct). After that the branch has 100 commits and main has 120, with no shared commit subjects. The branch also carries the m03 improvement loop, sis03 fixes and engine changes (credits themes, forensic data platform tabs, ink/global sync rules).
- The published copies in HacktivityLabSheets were committed from that branch: `288fd33` and `6553803` ("questions follow the round-2 dialogue changes"). The published information pack is byte-identical to the branch's pack.
- `main`'s sis02 game is the pre-pass draft, plus the lighting pass (`dfac2abc`) and a few later edits.

So the lab sheet's reflection questions were not invented. They describe scenes that exist in the branch's game.

## Each reported disagreement, checked against both versions

Key: "main" = the game on main now. "branch" = the game on `origin/claude/m03-improvement-loop`. "pack/sheet" = the published copies.

| Issue | main game | branch game | pack / sheet |
|---|---|---|---|
| Q8 register export | missing | Marcus: "Got ten seconds? Export the BMS register table on OPS-01 first" (`npc_marcus_webb.ink:173`); export object exists (`scenario.json.erb:1055`) | matches branch |
| Q10 three isolation options, Hall 2 gas monitor | missing | Marcus `:227`, Priya `npc_priya_s.ink:228` | matches branch |
| Q11 Tom rings Marcus back | Tom accepts the player's say-so (`npc_tom_hadley.ink:239-258`) | "I'll ring them back on the number we hold" (`npc_tom_hadley.ink:122`), `tom_refused_unverified` | matches branch |
| Q14/Q15 Priya on CLAIM-EN-002, 007, 008 | missing | `en002_verdict`; Priya `npc_priya_s.ink:208` (dial claim half held) | matches branch |
| Q20 Helen "them out of our network" | missing | `scenario.json.erb:749-767`, Helen `:326` | matches branch |
| Q13 / E4 05:52 file opening at Trent Water | missing; Tom tells a different story (TW-SCADA-ENG-02, Tuesday 23:47, "GridIntegration") | Tom: "At 05:52 a Trent Water PC opened it" (`npc_tom_hadley.ink:185`) | matches branch |
| Q7 anyone may press the ESD | button locked until Marcus is contacted (`authVar: marcus_webb_contacted`); label "Use only on authorised instruction from OT Security" | `authVar: esd_stations_live`, always true; quick reference says "Anyone may press an ESD station on a credible hazard" (`:1134`) | matches branch |
| E5 NIS form "on the clipboard by the workshop door" | form is on the control room wall | `as-type:clipboard_chart` by the workshop door (`:1172-1178`) | matches branch |
| Hydrogen 3.8% by volume vs 2.0% LEL | panel 2.0% LEL / certified 1.0% LEL; monitor uses "% H₂ LEL"; Helen "at four percent LEL it becomes flammable" | panel "3.8% vol"; audit "1.0% → 3.8% vol"; monitor "% by volume (n% LEL)"; Alarm 1.0, Evacuate 2.0, Burns 4.0 | matches branch |
| Dates | 2025-01-15/16/17 | 2026-03-12 to 2026-03-21 | 21 March 2026, matches branch |
| Capacity 220 vs 200 MWh; racks B1 to C4 | Helen and Priya say 220 MWh; Marcus says "Racks B1 through C4" | no 220; Helen: "Fifty megawatts off the grid" for half the site | 100 MW / 200 MWh, Hall 1 = A1 to A4 (half); matches branch |
| Thermometer "mercury" | Helen `npc_helen_marsh.ink:248` | "dial gauge", mechanical, no mercury | matches branch |
| Marcus "last week" vs Priya "three weeks ago" | both present | neither present | not in pack |
| NIS to NCSC vs Ofgem | Marcus "72 hours ... to notify NCSC" (`npc_marcus_webb.ink:413`) | Ofgem with the NCSC copied (`scenario.json.erb:344`) | Ofgem/DESNZ, NCSC alongside; matches branch |
| Priya "in your Incident Response folder" | present (main's Priya ink) | Priya file renamed `npc_priya_s.ink`; form on the clipboard | n/a |
| **SIS audit log vs "does not log modifications"** | audit tab shows WRITE_CONFIG rows | **still shows** WRITE_CONFIG rows at 03:22 (`scenario.json.erb:1785-1808`) | pack: "does not log modifications" (lines 769, 787, 846, 1365); sheet Q16: "The SIS kept no record of the change" |

Only the last row is a real disagreement in the branch's version too.

## The decision this needs

**Option A (recommended): bring the branch's sis02 work onto main, then fix the one remaining disagreement.**
- Check out the branch's `scenarios/sis02_energy/` onto main, then re-apply main's later sis02 changes on top. Those are the lighting pass (`dfac2abc`, `LIGHTING_PLAN.md`, emitters), the uncommitted Helen narrator intro and background (`npc_helen_marsh.ink:49-54`, `scenario.json.erb:610`), and whatever the Marcus softlock fix covers that the branch's Marcus does not already handle. The branch's Marcus already has explicit evidence options ("[The dial at Rack A2 has hit fifty-one...]", `:70`).
- The engine changes the sis02 commits rely on must come too: "Forensic data platform reads its tabs from the scenario", "Credits visualiser themes", "Engine polish: cyber credits theme", "Engine: only declared scenario globals ... sync with ink VARs", and the validator change for `spriteVariants`. The room map `room_control_1x2gu.tmj/json` also changed. sis03's pack and ink were aligned with this sis02 on the branch.
- Then the published sheet (`6553803`) is already right, apart from the audit-log item and the warnings tied to Marcus.
- Cost: a merge/port, plus a browser check of sis02 on main. The branch's spoken lines are probably not voiced on main yet, which matters for the TTS migration running now.

**Option B: keep main's game and rewrite the sheet and pack down to it.** This is what the task assumed. It discards a reviewed and playtested pass and rewrites a published sheet the user approved. It also means writing most of the missing scenes back in, or dropping Q8, Q10, Q11, Q14, Q15 and Q20. Not recommended.

## Residual fix under option A: the SIS audit log

The truth should be that the SIS controller keeps no change log. The audit rows the player sees were captured elsewhere: the jump server recorded the session's commands.
- **Game (one string):** retitle the tab and its header to show where the rows came from, e.g. "SIS COMMANDS SEEN IN JUMP SERVER SESSION RECORDING (the safety controller keeps no change log)". Do not change the mechanics.
- **Pack:** add a clause at line 787: "The SIS itself kept no record of the change; the commands survive only in the jump server's session recording."
- **Sheet Q16:** "The SIS kept no record of the change; only the jump server's session recording did. What does that do to the evidence for its configuration?"

This needs checking against what the branch's jump server log actually records before it is applied.

## Held until the decision

- The lead's three lab-sheet edits for the Marcus softlock fix: the warning at `labsheet.md:150`, the Nudge at about line 486 that says "On your first call", and the stage text for the new `[Found it: ...]` options and the ESD authorisation. They apply to main's game only. Under option A the ESD has no lock and Marcus's ink differs, so the wording would be different.
- Pending Marcus edits against main's current `npc_marcus_webb.ink` (only needed under option B): "last week" → "three weeks ago" (or the reverse in Priya's ink); "We have 72 hours from detection to notify NCSC" → "We have 72 hours from becoming aware to notify Ofgem, with the NCSC copied"; "Racks B1 through C4" → "Hall 2's racks".
- Pending `mission.json` (option B only): the 200 MWh figure already matches the pack. Nothing else needs changing.

## Working-tree changes made in this session

- `scenarios/sis02_energy/information_pack.md` was replaced with the published copy, which is identical to the branch's pack. Main's copy was the May version and its last commit was `9b72e571`. Restore with `git show HEAD:scenarios/sis02_energy/information_pack.md` if option B is chosen.
- This file, and D4 in `DECISIONS_PENDING.md`.
