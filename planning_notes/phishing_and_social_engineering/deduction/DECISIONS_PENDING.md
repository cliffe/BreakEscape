# Deduction board: decisions pending (2026-10-22)

Questions for the user raised while planning Phase 10. All are answered and recorded in the plan's
§13.1; items still needing approval live in `APPROVAL_LOG.md`.

**Answered by the user, 2026-10-22: all four recommendations accepted** (Q1 retry off by default,
Q2 KO is final, Q3 no score change beyond the skipped task, Q4 a lost mission ends through the
debrief and credits with failure lines). **Settled: the plan's §13.1 is authoritative.** The background
below is the question as asked and is out of date in places (retry is now an opt-in panel shown before
the debrief; under `completion` scoring a skipped task costs nothing, see plan §13.4).

## Q1. Retry after a strict loss

**Background.** A mission can be strict: any wrong call loses (fixture D, "the night train"). The plan
adds an optional "Try the call again" button on the debrief, set per mission by `stakes.retry` (0 = off).

**Options.**
- Off by default; a mission opts in (D uses 0). Strict stays strict; the player learns from the debrief.
- On once by default. Gentler, but a strict mission is then strict only on the second wrong call.

**Recommendation.** Off by default, missions opt in. The brief already warns the player the stakes are strict.

## Q2. Can a knocked-out innocent be brought round?

**Background.** A KO counts as a verdict (user rule). Knocking out an innocent is a wrong call with the
mission's stakes.

**Options.**
- No: a KO is final for now.
- Yes, per mission: wake them, apologise, regain the ally at an influence cost.

**Recommendation.** No for the engine stage; it can be added later as a per-mission option without
changing the data shape.

## Q3. Should verdict outcomes feed the Hacktivity score?

**Background.** Right now a failed case skips a "case solved" task, so the player loses that task's
share of the score; nothing else reaches the server. Anything more means server or Hacktivity changes.

**Recommendation.** No beyond the skipped task for the engine stage. Any Hacktivity change needs your
sign-off first.

## Q4. How a lost mission looks

**Background.** README_scenario_design.md:1546-1553 says story missions do not use `end_screen`. After
round 1 the plan ends a lost case through the debrief, then the mission's normal credits, with failure
lines in the closing card ("The ritual completed."), a skipped "case solved" task and a lower score.
The mission still counts as concluded.

**Options.**
- Credits with failure lines (current plan). Fits the house ending rules; the loss is clear in the
  debrief and credits, but the mission still shows as concluded.
- A failure card with "Start again" (new game), and the mission does not conclude. Feels more like
  "mission lost", but goes against the end_screen rule and needs server support for a not-concluded end.
- Both, per mission: credits by default, a failure card where the mission asks for one.

**Recommendation.** Credits with failure lines, as planned; revisit if a playtest shows the loss doesn't land.

---

# Round 2 of questions (2026-10-22, from the sidecar workflow)

Source: `sidecar/SIDECAR_RECOMMENDATIONS.md` "Needs the user", with evidence in the sidecar files named.

**Answered by the user, 2026-10-22: all five recommendations adopted** (Q5 active clear verdict in
Phase 10; Q6 "Let them go" in fixture C; Q7 the nudge says how, never which way; Q8 "Refer to HR" /
"No further action" nouns for real Incident Simulations missions, fixture B keeps its test nouns;
Q9 a `deduction.voice` key, plain by default). To be recorded in the plan's §13.1.

## Q5. An active "clear" verdict (SC-33)

**Background.** Players can name someone as guilty, but can't formally clear someone; a suspect with no
verdict counts as cleared at the close. The stress test found two of six new mission ideas need an
explicit clear, notably protecting a wrongly suspected whistleblower ("Speak up"). Runtime and grader
already handle `clear`; this adds `#verdict:trust[:<s>]` and a `value: "clear"` action.
**Recommendation.** Add it in Phase 10 (small, opens a strong mission type).

## Q6. "Let them go" in fixture C (PLAYER_TEST_C F4)

**Background.** In C, sending a contact to wait in the comms room can't be undone. A one-way "Let them go"
would let a player release an innocent they suspected too early: the contact leaves "not named" and is lost
as a resource, but isn't wrongly locked up. Gentler, matches "not hard"; the debrief still notes the hasty call.
**Recommendation.** Add it.

## Q7. A reason line under the nudge (DESIGN_FUN_FEEDBACK §B.3, §E.2)

**Background.** The nudge says "You have enough to decide about Venn" and never which way. A reason line
("That rules out Courier. Keyholder and Devotee are still open") is more satisfying but partly gives the
answer away. A safer variant says only *how* the suspect became decidable ("Check the counts." /
"Check what they don't have.") without saying which way.
**Recommendation.** The safer "how" variant only; keep the never-say-which-way rule.

## Q8. Verdict nouns for real Incident Simulations missions (LEARNING_DESIGN R1)

**Background.** Corporate missions would say "Refer to HR" / "No further action" instead of "Insider" /
"Not an insider": closer to proportionate workplace practice, and avoids labelling a colleague.
**Recommendation.** Yes for real Incident Simulations missions; fixture B keeps its test nouns.

## Q9. Two string sets for engine text (COPY_DRAFTS §13.13)

**Background.** A handful of engine-owned strings (board labels, warnings) read differently in a plain
corporate voice and a pulp voice. Option: a `deduction.voice: "plain" | "pulp"` key, or the plain set for both.
**Recommendation.** Add the `voice` key with plain as the default.
