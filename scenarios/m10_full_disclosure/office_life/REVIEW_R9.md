# m10 office life: plan review round 9 (delta)

Reviewer tier: delta review tier, read-only. Scope: the diff d560ac9bf..fd588c8e8 of PLAN.md (one sentence in section 6) against REVIEW_R8.md.

**Counts: 0 blockers, 0 majors, 0 minors.** The loop is closed.

| # | Sev | Check | Evidence | Result |
|---|---|---|---|---|
| 1 | - | R8 M1: a short prefix resolves to nobody | `speakerFor` accepts `npc`, an id or a display name, case-insensitive (`systems/npc-needs-chatter.js:47-60`); null speaker makes the start check skip the knot (`systems/npc-needs.js:3004`, gate `:4464-4466`) | Fix correct. Section 6 now requires the full display name on every exchange line. |
| 2 | - | R8 m1: `word: text` read as a prefix | `splitPrefix` takes the first colon (`npc-needs-chatter.js:41-44`) | Fix correct. With every line prefixed by the full name, a colon later in the body is safe (the match is lazy). |
| 3 | - | House-style citations | `ex_whispering` (`scenarios/m05_insider_trading/ink/m05_npc_niamh_doherty.ink:43-47`) and `ex_interns` (`scenarios/m01_first_contact/ink/m01_npc_fatima_begum.ink:16-20`) use full display names on every line | Accurate. |
| 4 | - | Line ranges in the new sentence | `:41` to `:81` covers `splitPrefix` to the tag fallback; `:46` to `:56` is `speakerFor`; the gate lines match | Accurate. |
| 5 | - | Consistency | `grep` for `Sofia:`, `Darren:`, `speaker:npc` finds only PLAN.md section 6; no other section or QUESTIONS.md contradicts it | No new problem. |

The fix adds no design decision. Unchecked, for the build: that each new NPC's `displayName` in the scenario matches the prefix text exactly (Darren's is `Darren Price`, PLAN.md:162), and TTS cache handling of prefixed exchange lines.

Result: the plan is ready to build, subject to the user questions Q1 to Q5.
