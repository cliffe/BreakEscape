# Phone calls track: log

Brief: `docs/agents/PHONE_CALLS_BRIEF.md`.

## 2026-11-11

- User: get every phone, call and remote conversation into a great state; rewrites and voicing are fine. The handset has no proper call flow yet (receiving and starting calls), and missions haven't settled how calls work. `lab_social_engineering` is deployed and must keep working exactly as it does now. Also update the README.
- Orchestrator audit (Haiku, checked by the orchestrator): `docs/agents/phone_calls/AUDIT_HAIKU_2026-11-11.md`, inventories in the same folder. Confirmed silent-text calls: m09 Nightshade/Torres/Gary `call` knots, m07 Architect transmissions. Withdrawn: m10 `hax_post` "I'm on your phone now", which is intended (ink header). Open: in-person HaX speakers on the phone style (m09 `hax_voice`, m10 `hax_post`, `hearing`); m04 Vance and m05 Recruiter call wording in text threads.
- README: "Voiced phone calls" now documents the contact-level `voiced`, `callLabel` and the call screen (main 552c2d718).
- Decision: m07 keeps Netherton for the briefing and debrief, with HaX as debrief co-speaker on the line. That's by design (`scenarios/m07_architects_gambit/planning/mission_design.md:160-172`).
- Audio: m02 (308) and m03 (187) HaX briefing/debrief lines re-keyed by 1fd322e67 (one shared HaX style) are being regenerated in the main tree. The four stale clips the merge kept were removed in f7f82ac69.
- User: the orchestrator runs this track with subagents as AGENTS.md describes. Aim for an immersive experience with variety. Dialogue updates and minigame tweaks are allowed. Walkthrough lab sheets (HacktivityLabSheets `_labs/`) are updated alongside each change so they stay correct. The VM companions go to opus48 only. Added to the brief.
- Plan written (Opus 5.5): `docs/achitechture/PHONE_CALLS_PLAN.md` (4f4a790d1). 9 engine slices (A0–A8), 9 mission slices (M1–M9), 14 open questions.
- User, 2026-11-12, C2: in-person HaX speakers use m01's in-person styles: briefing style for m09 `hax_voice` and m10 `hax_post`, debrief style for m10 `hearing`. There's no global HaX restyle.
- User, 2026-11-12, C6: the Architect's calls ring as "No caller ID" and open in his terminal look, voiced. The "without ringing" narration is rewritten.
- Orchestrator: the other 12 questions (C1, C3–C5, C7–C14) take the plan's recommended defaults unless a review shows otherwise.
- Audio done: m02 308 + m03 187 HaX clips. 0 errors, `wasted` 0 unrequested and full coverage in both, 5 transcripts match. Committed on main 94b88373d. Listening: `tmp/tts_comparison/m02_ransomed_trust_hax_restyle/`, `m03_ghost_in_the_machine_hax_restyle/`.
- Review R1 (Opus, 93a99d3ea): revise, 2 blocker / 14 major / 11 minor. Blockers: ringing over an open minigame cannot work as written; the state machine misses 9 cases. The lab SE is confirmed safe. The C2 restyle as first planned would re-key m10 Ghost call lines (speaker resolution picks the first match). Draft 2 by a fresh planner is running.
- Draft 2 (4ee55f68f): all 27 R1 findings fixed, with outcomes in `PHONE_CALLS_PLAN_R1_OUTCOMES.md`. Answering over a puzzle holds the call until the puzzle closes; there is no suspend/restore, since S12 restore loses progress. In-person HaX gets an id prefix (slice A1 adds id matching on phone lines). m01 gets one short HaX call, m06 and m08 one each. About 316 new lines. Review R2 is running.
- Review R2 (9c9f70308): revise, 2 blocker / 5 major / 11 minor. Blockers: m10 `agent_0x99` has no sprite, so the id prefix would lose her art on 111 lines; held-call release does not re-check what is open. Majors: lab popups, m07 voicemail heard flags, state-table gaps, ~33 "Call me" texts, split A2. Audio keys and the lab SE are confirmed unchanged. Draft 3 is running.
- Draft 3 (95fa8956c): 18 R2 findings fixed and R1 B1/B2 closed. 31-row state table with a "may it open" check; lab popups hide and restore; 90 s hold limit; 36 "Call me" texts settled (24 become calls, 10 reworded, 2 become a ring); A2 split into a/b/c; HaX art on m09/m10 `agent_0x99`; ~370 new lines. Review R3 is running.
- User, 2026-11-12:
  - **Debriefs often in person.** End-of-mission debriefs should usually happen in person, because that has more impact. Vary them by story: a call or video debrief is fine where the story calls for it (m07's Netherton on the secure link stays).
  - **Ring until answered.** An incoming call can keep ringing until it's answered. The engine sets a variable the NPC's ink can read for how long the player took, so the NPC can comment when it was over 10 seconds.
  - **Ring-out and call back.** If a call rings out, the phone UI shows a "Call back" button. Calling back opens the same conversation with a callback variable set, so the NPC can open with something like "Thanks for returning my call."
