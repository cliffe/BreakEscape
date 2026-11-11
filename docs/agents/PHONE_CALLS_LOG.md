# Phone calls track: log

Brief: `docs/agents/PHONE_CALLS_BRIEF.md`.

## 2026-11-11

- User: get every phone, call and remote conversation into a great state; rewrites and voicing are fine. The handset has no proper call flow yet (receiving and starting calls), and missions haven't settled how calls work. `lab_social_engineering` is deployed and must keep working exactly as it does now. Also update the README.
- Orchestrator audit (Haiku, checked by the orchestrator): `docs/agents/phone_calls/AUDIT_HAIKU_2026-11-11.md`, inventories in the same folder. Confirmed silent-text calls: m09 Nightshade/Torres/Gary `call` knots, m07 Architect transmissions. Withdrawn: m10 `hax_post` "I'm on your phone now", which is intended (ink header). Open: in-person HaX speakers on the phone style (m09 `hax_voice`, m10 `hax_post`, `hearing`); m04 Vance and m05 Recruiter call wording in text threads.
- README: "Voiced phone calls" now documents the contact-level `voiced`, `callLabel` and the call screen (main 552c2d718).
- Decision: m07 keeps Netherton for the briefing and debrief, with HaX as debrief co-speaker on the line. That's by design (`scenarios/m07_architects_gambit/planning/mission_design.md:160-172`).
- Audio: m02 (308) and m03 (187) HaX briefing/debrief lines re-keyed by 1fd322e67 (one shared HaX style) are being regenerated in the main tree. The four stale clips the merge kept were removed in f7f82ac69.
- User: the orchestrator runs this track with subagents as AGENTS.md describes. Aim for an immersive experience with variety. Dialogue updates and minigame tweaks are allowed. Walkthrough lab sheets (HacktivityLabSheets `_labs/`) are updated alongside each change so they stay correct. The VM companions go to opus48 only. Added to the brief.
