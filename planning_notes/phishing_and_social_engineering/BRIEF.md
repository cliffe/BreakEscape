# Shared brief — phishing & social engineering design work

Every planner and reviewer subagent reads this first. It sets the aims, the constraints, the engine
facts to design against, and the review rubric. Read `README.md` alongside it.

## What we are building and for whom

A set of **reusable minigames/systems** and three **scenarios** that teach phishing and social
engineering by putting the learner in the attacker's seat first, then the defender's. One engine,
three audiences:

- **Cyber Security students** — technical depth, real mechanics, correct terminology. No VM for this
  strand (user decision, 2026-10-20): the game models the mechanics so feedback is deterministic.
- **Phishing-awareness learners** (a training tool/service) — short role-based episodes, no install,
  non-technical staff, assessment built in.
- **SAFETYNET: Eldritch Hacker** (updated 2026-10-20) — the second SAFETYNET game, browser-only
  social engineering against a cult; a phish or pretext is one infiltration stage. The earlier plan
  to fold the systems into Licence to Hack m01–m08 is superseded (not retrofitted). The awareness
  audience now sits under Incident Simulations: Critical Cases, not SAFETYNET.

Settle which audience a doc serves before judging it — the bar differs. A doc may serve more than
one (most systems do); say which, and design the system so scenario JSON tunes depth per audience.

## Source material (design against these, cite don't restate)

- `ase18-paper_chothia.pdf` (Chothia et al., "Phishing Attacks: Learning by Doing", ASE '18) — the
  learn-by-doing stance; and the failure modes of the VM lab we are replacing.
- Joe Gray, *Practical Social Engineering* (No Starch, 2022) — chapter map in `README.md`. Draw the
  real-world structure (OSINT → pretext → phish → landing page → metrics/report → defence) and the
  ethics framing from it.
- The SecGen lab we are improving on: `SecGen .../cyber_security_landscape/3_phishing.xml` and its
  bot. **Do not open SecGen files** — the summary of its flaws is in `README.md` ("Why not the
  SecGen VM lab"). That is all you need; the point is to not repeat those flaws.

## Hard constraints

- **No VM in this strand.** Everything is in-browser Break Escape. (The VM hybrid is parked and out
  of scope as of 2026-10-20; the student lab has no VM companion and Eldritch Hacker is browser-only.)
- **Model, don't weaponise.** Teach the reasoning and the red flags. Do **not** write working
  malware, real credential-harvesting code, real spoofing/spamming instructions, or copy-paste
  attack tooling. Real tools (Recon-ng, theHarvester, Hunter, Maltego, SET, Gophish) are named and
  explained at concept level, used as in-world flavour — never as runnable kit. A design that would
  function as a real phishing kit is a **blocker**.
- **Authorised, ethical framing.** Every scenario states the activity is authorised and scoped, and
  carries a short ethics/consent beat (book Ch. 2). Targets are fictional companies/people.
- **Fun and educational, not hard** (standing user rule). Short loops, clear goal, visible checklist,
  escalating hints, no dead ends.
- **Deterministic, legible feedback.** The game judges every action against explicit rules and tells
  the player which factor passed/failed. Never a silent or ambiguous result. This is the whole point
  of moving off the VM — a design that hides its reasoning from the player is a **major** at least.
- **UK English, plain writing, no AI-sounding filler.** (See `/home/cliffe/.claude/CLAUDE.md`.)

## Engine facts to design against (verify in code before relying on one)

Minigames live in `public/break_escape/js/minigames/<name>/`. Study these as working examples:

- **`person-chat/`** — NPC dialogue overlay with portraits, lip-sync, ink-driven conversation and a
  `chatBackground`. The model for the **pretext/vishing** system (06): reuse it, don't rebuild.
- **`phone-chat/`** — texting UI (choices, history, scroll, speaker). A second model for 06, and a
  possible shell for a phone-based mail/triage view.
- **`flag-station/`**, **`vm-launcher/`** — how a minigame bridges an outcome to a flag/global and
  how objectives respond. The mail-send "success" and lab flags follow this pattern.
- **`notes/`, `text-file/`, `examine/`** — simple content-display overlays; the intel board (03) and
  OSINT document views (02) are close relatives.
- **`FINGERPRINT_MINIGAME_PLAN.md`** (in `scenarios/`) — the template for how to write one of these
  design docs: "what's wrong today", player goal in their own words, numbered steps, a quality/score
  formula, a wiring table of engine gaps with file:line, house-style notes.

Scenario wiring to design against: objects with interactions start minigames; minigames emit
completion events; scenario JSON (`scenario.json.erb`) and ink react. Ink drives dialogue. Globals
bridge minigame outcomes to objective/lock state. Confirm the exact event/field names in code and
cite file:line in your design — do not invent an API that isn't there without flagging it as "new
engine work required".

## House style for overlays

Dark panel; `Press Start 2P` for headings, `VT323` for body; square corners; green-phosphor accent
`#00ff41`; canvas work surfaces drawn at low resolution and scaled up with
`image-rendering: pixelated` so they sit with the pixel art. A step strip across the top when the
minigame has stages. Keep a single consistent visual language across the whole phishing suite.

## What a design doc must contain

1. **Purpose & audience** — which of the three audiences, and what it teaches (map to book chapter).
2. **Player goal in their own words** — one sentence.
3. **The loop / numbered steps** — exactly what the player sees and does, screen by screen.
4. **The rules / scoring** — explicit, deterministic; worked example(s); the exact feedback shown for
   each pass/fail factor (the red-flag checklist). Show the SecGen failure it avoids.
5. **Scenario-authored data** — the JSON shape an author fills in (victims, facts, rules, strings).
   Keep content out of the minigame code.
6. **Engine wiring** — the component files, the start interaction, the completion event, how outcomes
   bridge to globals/objectives, cite file:line for anything that already exists, and a table of new
   engine work required.
7. **Reuse across audiences** — how JSON tunes it for student vs awareness vs mission.
8. **Art/audio assets needed** — listed, at target size, PixelLab-first (don't generate now).
9. **Open questions** — anything for the user; also copy each into `QUESTIONS_FOR_USER.md`.

Write long docs **section by section with Edit** (a whole-file rewrite once got truncated). Keep
prose at game-design level.

## Review rubric & severity

Reviewers run read-only, verify every claim against the code (cite file:line), and tag each finding:

- **Blocker** — would make the component unbuildable, unsound, un-fun to the point of failing its
  aim, factually wrong on a security concept, or would function as real attack tooling. Must be
  resolved.
- **Major** — a real design flaw: hides its reasoning from the learner, a dead end, a mechanic that
  doesn't teach what it claims, an engine assumption that's wrong, a missing feedback path, an
  inaccurate security detail that a student would carry away wrong.
- **Minor** — polish: wording, a clearer hint, a nicer asset, a small pacing fix.

For each finding give file:line (or doc section) evidence and a concrete fix. Each review round ends
with a verdict (clean / majors remain / blockers remain) and a severity count. The fixer folds
findings in; wrong findings are recorded "withdrawn" with the reason, not dropped. Stop a component
at a clean round (nothing above minor) or after 5 cycles, whichever first; list anything left open.

## Decisions you make vs escalate

Make design judgements yourself and log them (pacing, which fact goes where, a mechanic's feel, the
choice between two workable options a reviewer raises). Escalate to `QUESTIONS_FOR_USER.md`: anything
that costs money, shared-engine changes with campaign-wide impact, the product/commercial choices,
anything touching the real-staff-OSINT risk, and any security-accuracy call you can't settle from a
reputable concept-level source. The user is unavailable during this run — never block on them; pick
a sensible default, mark it, and record the question.
