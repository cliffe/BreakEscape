# m08 decisions pending (pass 5, started 2026-10-13)

The pass runs without the user's input (user, 2026-10-13). Each item has a recommendation; where the orchestrator went ahead with a reversible mission-local choice it says so.

## U1. SecGen checks (needs the user, outside the session)
From alignment review cycle 1 (`ALIGNMENT_REVIEW_P5_C1.md`). Which scenario is built: `break_escape/safetynet/m08_the_mole.xml` (mission.json) or `ctf/such_a_git.xml` (erb header)? Flag order? Does the VM hold what HaX's texts claim (the `nightshade_ops` account, mail to `architect@entropy.onion`, a root-only log naming a Crypto Lab terminal and 47 minutes, the threat-database root file, SSH as the second login, the CVE ID)? Needs checking against SecGen by the user.
Recommendation: if it's the generic CTF, reword HaX's flag-3/4 texts or have SecGen place those files.

## U2. Story direction for the mole hunt (B1)
Option B (mission-local): flag 4 gives time and terminal, no name; a correct naming to Netherton becomes required via the door audit; the three-misread fallback stays but costs something; HaX gets a progress-gated audit hint. Option A depends on VM content (shared login, audit names the person).
**Orchestrator went ahead with Option B** (reversible, mission-local, doesn't depend on U1). Overrule if you prefer A.

## U3. Locker after a tip-off (possible engine change)
Empty or change the locker when Nightshade is tipped off. Trying `textVariants` and a dialogue-only fallback first; engine change only if neither works.

## U4. Canon: HaX and the Architect's teacher line
May HaX hedge-recognise "Let it hurt afterwards, not during" in m08 ("Same classroom") without naming Tesseract?
**Orchestrator went ahead with yes** (one line, easy to remove).

## E1. Required-task key wording (engine, from regression run 1)
`objectives-panel.js` marks required tasks with `*` only in aims that have a visible optional task (by design), but the panel's key reads as if every unmarked task is optional. Recommendation: show the key only beside aims that use the marker, or word it "* required (in aims with optional tasks)". Backlogged; not blocking.
