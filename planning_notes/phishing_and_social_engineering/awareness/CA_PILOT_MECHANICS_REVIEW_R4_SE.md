# CA pilot mechanics: SE wording review, round 4

Scope: the R3→R4 wording delta on the attacker/defender player-facing lines for ca12 (tailgate) and ca15 (USB drop), judged on accuracy (attacker read and defender lesson), attack/defend consistency, tone, TTS word caps (30 face to face), delivery vs stage directions, variables in voiced lines, UK English and em dashes. Sources: `CA_PILOT_MECHANICS_REVIEW_R3_SE.md` (R3-1, the one open minor), and the plan delta `git diff c21ea921f d8005ef00 -- CA_PILOT_MECHANICS_PLAN.md`. No plan edits made.

Verdict: no blockers, no majors, no new minors. R3-1 is resolved exactly as suggested. The two new flip lines (`ca12_door_missed`, `ca12_guard_alerted`) are accurate, consistent with the defend twin and the other four flip lines, and clean on every mechanical check.

Severity counts: **BLOCKER 0, MAJOR 0, MINOR 0**. R3 carry-over: 1 minor resolved.

---

## R3-1 [MINOR, soft] the "two layers" framing recurred across the toast and Jo's bark — RESOLVED

R3 asked that Jo's voiced tailgate line stop restating the door toast's layer count and lead on the human move instead. The delta does exactly that: Jo's bark changes from "The desk is one layer and the door is another. A uniform and a held door beat both." to **"Nobody checked. A uniform and a held door beat both."** (Jo mapping, the people table, and the trailer hero-shot line, all three updated). The plan adds the rationale in line: "The line gives the attacker's read of what just happened; the layer count stays in the door toast and the flip." The toast ("The desk is the first layer. The door is the second...") now carries the count alone, so the toast and the voiced bark heard back to back on a tailgate no longer read as a copy. Opening on "Nobody checked" is the "open it on the person" option R3-1 offered. Resolved.

---

## New/changed player-facing lines this delta, each checked

### 1. Jo's tailgate bark (voiced, `ca12_jo`) — changed, clean
"Nobody checked. A uniform and a held door beat both." 8 words (under 30 face to face, under 25 even counted as an earpiece/phone voice). No variables, no inline stage direction (delivery lives in the bark field: "quiet and pleased, a tester talking in the learner's ear"), no em dash, UK English. Accuracy: the attacker's read of a `walked_away`→follow-Jun tailgate; "Nobody checked" is true in that branch (no desk vouch, no guard stop), and "A uniform" is always true when the credit fires (hi-vis gate on the mapping condition). Mirrors the twin's `uniform_pretext`/`no_escort`. Clean.

### 2. `ca12_door_missed` flip line (shown text, not voiced) — new, clean
"The desk said yes and held the door, but you didn't go through. A held door lasts seconds." Fires only in `got_it` with the hi-vis when the learner never moves and Delphine walks back. Every clause is true for that branch: the desk (Delphine) said yes and held the door, the learner did not pass, and the held window is brief (the new 10 s `ca12_t_door_missed`). The defender takeaway is carried ("a held door is a fleeting opening"), consistent with the twin's escort/held-door teaching. Second-person, narrate-then-lesson shape matches the other five lines. No variables, no em dash, UK English. Clean.

### 3. `ca12_guard_alerted` flip line (shown text, not voiced) — new, clean
"The desk didn't buy it and called security. You never reached the door." Fires on `reported`. Accurate: the desk escalated, Yusuf comes to the learner before the door. Tone and shape match the set ("didn't buy it" sits inside the attacker-voice register the other lines use). No variables, no em dash, UK English. Clean.

**Ordering check (consistency).** The plan places `ca12_guard_alerted` before `ca12_challenged` in `flipDefenderLineByGlobal` because `reported` sets both and there the desk, not the door, did the stopping. Verified safe: Yusuf's no-vest sight challenge (mapping 2) sets only `ca12_challenged`, not `ca12_guard_alerted`, so a plain no-vest turn-back still resolves to the `challenged` line ("Yusuf stopped you at the door..."), and only the `reported` path reaches `guard_alerted`. First-truthy-wins order is correct for every ending.

### 4. ca15 Joanne use line — unchanged text, re-plumbed only
"I'll just plug it in and see whose it is." moved from the `npc_used` mapping to a new `npc_use_started` mapping so it plays as she sits down rather than late. Text identical, delivery still "cheerful and matter-of-fact", 9 words, no variables. No wording change to review.

### 5. Hint toasts and "Nilesh has his stick back." — unchanged text
The door toast, no-vest toast and the stick take-back toast gain `title`/`message` field names (and a tighter condition on the take-back) but keep their R3 wording. Shown text, not voiced. Nothing to review.

---

## Checks that pass clean

- **Word caps.** The only new/changed voiced line is Jo's bark (8 words). Joanne's re-plumbed line is 9. Both well under cap at any read.
- **Variables in voiced lines.** None. The flip lines carry no `{variables}`; they are shown text in any case.
- **Stage directions.** No inline directions in any spoken line; tone stays in `#delivery:` tags and bark delivery fields.
- **Attack/defend consistency.** Jo's bark mirrors the twin's uniform/no-escort facts; `ca12_door_missed` and `ca12_guard_alerted` each name what actually happened in their branch; the six-line set now covers all ca12 endings with no overlap, and the neutral `flipDefenderLine` fallback is scoped to the `walked_away` timeout.
- **UK English / "Cyber Security".** "security", "uniform", "badge" fine; no US spellings; the phrase does not appear.
- **Em dashes.** None in any new or changed line; the flip lines use full stops and a comma.
- **Attacker voice / O2.** Jo's live line still delivers the attacker's read at the hero shot; the new flip lines keep the attacker-outcome framing the set uses.

---

## CA fun/USP rubric, delta note (plan evidence only; not a playtest)

No rubric item moves on this delta. R3's one open minor is closed with no new cost. A1/A2 and O2 hold at 3 on plan evidence. Playtest-dependent items (F6, O3 recall, pacing of the two new ca12 endings and the ca15 use-started line timing) remain for a playtest, not here.
