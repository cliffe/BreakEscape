# m10 office life: plan review R8 (delta)

Reviewer tier: planning tier, read-only, after R7 found a major. Scope: the diff 66a1805db..d560ac9bf of PLAN.md against REVIEW_R7.md, with sections 2.5, 6 and 10.2.

**Counts: 0 blockers, 1 major, 1 minor.** No finding needs a new design decision. Both fixed in PLAN.md section 6 in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | M | A `Sofia:` prefix resolves to nobody: `speakerFor` accepts only `npc`, an id or the full display name. The knot would then be skipped silently and the exchange never play. | `npc-needs-chatter.js:46-56`, `:72`; `npc-needs.js:3004`, `:4466` | Fixed: section 6 names the house style (full display name on every line, as `ex_whispering` in m05 and `ex_interns` in m01), says a short prefix refuses the knot, and keeps the tag as a fallback for unprefixed lines. |
| 2 | m | An unprefixed line containing `word: text` is read as a speaker prefix and kills the knot. | `npc-needs-chatter.js:41-44` | Fixed: every line is prefixed, and section 6 states the risk. |

Checked sound: unprefixed lines go to the owner; the tag is read only without a prefix; the start check uses `lines[0].speakerId` with `playerHears`; faint volume 0.03 to 0.2 (`npc-needs-chatter.js:37`, `:240-253`, `:270-272`, `:312-316`; `room-hearing.js:7`, `:24-31`); R7's outcomes applied; sections 2.5, 6 and L4 agree. With these fixed the plan is ready to build, apart from the user questions.

Unchecked: build measurements (stand cells, distances, seconds per needs-minute); TTS cache handling of exchange prefixes.
