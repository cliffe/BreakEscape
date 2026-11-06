# Awareness course plan: review brief

For reviewers of the module plans in `planning_notes/security_awareness_course/modules/`. Read `docs/agents/AWARENESS_COURSE_BRIEF.md` first: it sets the kind of game, the quality bar and the writing rules the writers worked to. You are **read-only**: don't edit any file. Report findings; the orchestrator sends them back to the writers.

## What to check, per module

1. **Accuracy (highest priority).** Check every factual claim in `concepts.md` and any facts repeated elsewhere: laws and articles, regulator guidance, service names and numbers, statistics, real cases (names, dates, amounts, what was confirmed versus reported), standards references. Use web search against primary sources (legislation.gov.uk, EUR-Lex, NCSC, ICO, GOV.UK, NIST, PCI SSC, court and regulator releases). Known recent changes to check against:
   - On 30 September 2026 the Information Commissioner was replaced by the **Information Commission**, which keeps the "ICO" name ("Information Commission's Office"). Breach duties are unchanged.
   - **Report Fraud** replaced Action Fraud on 4 December 2025 (England, Wales and Northern Ireland; Scotland reports to Police Scotland on 101).
   - The EU AI Act Article 4 duty was softened by Regulation (EU) 2026/1744 from 27 July 2026.
   - The Cyber Security and Resilience Bill was not yet law in October 2026.
   - NCSC CAF is at v4.0; DSPT 2026-27 is v9, CAF-aligned for large NHS bodies.
   Flag anything wrong, outdated, overstated or unsourced. "Not verifiable" is a finding too.
2. **The model and the template.** All four files exist with the template's headings. The module follows the seven beats in `01_LEARNING_DESIGN.md`, with a hook that records a baseline and an Apply beat that tests the same behaviour. Compare depth and specificity with `modules/core_01_phishing_email/`.
3. **Teaching quality.** Target behaviours are behaviours. Learning outcomes are measurable. Every threat is paired with a simple action. No victim blaming, no fear without action, no gotchas: every threat in Apply is catchable with what Learn and Practise taught. Unreliable cues aren't taught as rules. Advice is correct and practical for ordinary staff. Misconceptions are real ones.
4. **The game.** It's specific (rooms, cast, work task, threats, decisions, consequences, minigame configuration, sample lines) and fun (a hook worth talking about; alternative concepts that are genuinely different). Voiced lines never print variables and stay short. Security detail stays at awareness level; attacker views are never a how-to. Fictional names and domains only.
5. **Assessment.** The behaviour table maps to outcomes; critical behaviours have a remediation loop; the knowledge check bank has 8 to 12 items with one defensible answer each (or a clearly marked multi-select), plausible distractors and useful feedback, written as workplace situations; pass rules and evidence are stated.
6. **Consistency.** Cast names and roles match `03_WORLD_AND_CAST.md` (new characters avoid names in `public/break_escape/assets/characters/`). Topic boundaries in `00_COURSE_OVERVIEW.md` are respected, and shared procedures agree across modules (especially "what to do if you clicked" in core_01 and the reporting procedure in core_04, and data breaches in core_05). The motto *Pause. Check. Report.* is used consistently.
7. **Feasibility against the engine.** Claims about existing minigames, systems, rooms and art are true (check `research/current_state_break_escape.md` and the code). Feature ids exist in `features/README.md`; proposed new features are marked "proposed". Known limits are acknowledged: minigames open only from objects today (BE-19), `dual-auth` isn't registered, `siem` ignores `alertConfig`, the video-call bar and the "Meridian" form headers are hard-coded, the tutorial and title screen are fixed (BE-20).
8. **Compliance coverage.** References use the short forms in `02_COMPLIANCE_MAPPING.md` and are plausible for the module's content.
9. **Inclusion and accessibility.** The cast and extras are varied without stereotypes (no "hooded hacker", no clueless older person, no careless young person as a type); nobody is shamed; the design works for the text route (every decision can be made from text) and doesn't need fast reactions, colour alone, sound alone or a mouse; reading level suits ordinary staff (`features/accessibility_and_inclusion.md`).
10. **Style.** UK English; "cyber security" as two words in our prose; no em or en dashes (`LC_ALL=C.UTF-8 grep -nP '[\x{2014}\x{2013}]'`); plain writing with no filler.

## How to report

For each module, a table of findings:

| Severity | File:line | Finding | Suggested fix |
|---|---|---|---|

- **Blocker:** factually wrong in a way that would teach staff the wrong thing or embarrass the course; a missing file; a design that can't work.
- **Major:** an unsourced or outdated claim, a gotcha, a boundary clash, a wrong engine claim, a weak or ambiguous question, a missing template section, a voiced line that prints a variable.
- **Minor:** wording, style, small inconsistencies.

End each module with a verdict: **ready**, **ready after fixes**, or **needs rework**, and one line on its strongest and weakest part. Keep the report factual; cite the source for every accuracy finding.
