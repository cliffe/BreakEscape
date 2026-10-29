# E14 "Social media and oversharing": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness
product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical
staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no
runtime language model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` skill
adapted to the awareness kind, and the E8/E15 pilot reviews in `reviews/build/` for the format and
bar. E14 is the one attack-first episode in the set (OSINT then write, built defender-inbox flip; no
ENG-04 montage).

Scope read end to end: the full shell `scenarios/awareness_e14_social_media/{scenario.json.erb,
ink/julian_sallow.ink}`; the defend-only shell `scenarios/awareness_e14_social_media_defend/{...}`; the
fragments `planning_notes/phishing_and_social_engineering/awareness/e14/{attack,defend,full_only}.json`
and `BRAND_ADDITIONS.md`; the spec `.../episodes/E14_social_media.md`; the module
`modules/core_12_social_media_and_oversharing/concepts.md`; the E2/E4 overlap in
`../00_COURSE_OVERVIEW.md`; and the engine the findings depend on (`mail-client/mail-composer.js` part
assembly and ask defaulting, `episode-runner/flip-view.js` `defenderLine()`/the missed branch,
`privacy-panel/privacy-model.js` `buildView`, `episode-runner/episode-model.js` drill/panel sequencing,
`inbox-triage/triage-scoring.js` the `awareness` profile).

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (schema + strict-social
pass on both; the usual m01-shaped SUGGESTION noise, plus one real SOCIAL warning on the full shell, see
MI2). `dialoguelint.mjs` on both folders (full lines=7 max=23; defend lines=3 max=29; no rule hits, all
host lines under 30 words). `node --test social-awareness-fragment-erb-parity.test.mjs
social-awareness-rule-of-thumb.test.mjs`: **22/22 pass**, including "E14: fragment and full erb share the
same learner-facing copy", "the registered awareness shells are exactly the shells on disk" and
"every awareness shell (73) carries social.awareness.ruleOfThumb". Unlike the E15 run, no registry tests
are red.

I judged the composer, the flip, the Post-or-Not drill and the privacy panel from the wiring-run renders
(`.../wire-e14b/shots/`, full episode) as well as code. The six triage SMS cards and the defend-only
privacy panel I judged from code and the erbs, not from a render.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 2 | 2 | 0 | 0 |
| Minor | 3 | 3 | 0 | 0 |
| **Total** | **5** | **5** | **0** | **0** |

Episode shape: full = 6 stages (`brief, osint, write, flip, defend, debrief`); defend-only = 3
(`brief, defend, debrief`). Attack half: 5 OSINT facts (each with a `reduceNote`), one pretext send
capped by `attack.maxMessages: 1`, three pretext templates (two access levers plus a slot-free catch-up
decoy) and two ask tails, built defender-inbox flip keyed by `flipDefenderLineByChoice`. Defend set
`e14_social_dms`, **6 SMS cards** (3 report: fake recruiter, fake-Catherine connection request, system
fisher; 3 trust: real recruiter, colleague DM, former colleague), mirror pair at rows 1/6. Unscored
Post-or-Not sort drill (7 cards into Post/Tweak/Hold) and the ENG-13 privacy panel (5 settings) run
inside the defend stage in **both** shells (the defend-only shell was hand-patched with both blocks, as
`full_only.json` warned the generator would not copy them). Both shells carry the byte-identical rule of
thumb.

## What works

- **One clear lesson a clerk can repeat on Monday**, and it matches `concepts.md`: public posts add up
  to a map of your firm; small details (a badge, a screen, a named system, a leave countdown, a pet's
  name) do the damage; a real recruiter never needs your systems or org chart; tighten settings and use
  a made-up security answer. The `mondayCard`, the host's closing ink and the no-blame line land it.
- **The advice is proportionate** (the brief's first explicit check). `concepts.md`'s "you do not need
  to lock yourself away" is honoured: the Post-or-Not drill is weighted to **Tweak** (crop the pass,
  drop the tag, post the people not the whiteboard), not Hold; the pet photo is an explicit **Post**
  ("This one's fine... Post away"); the privacy panel is "connections only", never "delete everything";
  the no-blame line says "the fix is a setting and a pause, not shame". Nobody is told to stop posting.
- **No-blame register throughout.** Dani is in on the exercise and thanked; the host's completion ink
  ("Nobody's in trouble for having posted them"), the `noBlameLine`, and the genuine-item reasons
  ("'report everything' is not the win") all keep the tone right. The "Do not" list (spec section 18) is
  honoured: no scraping technique, the board shows only what Dani posted, the defence is always named,
  fake-profile signs are hints not proof, Dani is the subject (not the E4 client Oskar), no ENG-04.
- **The defend set is fair and matched.** 3 report + 3 trust so refusing everything does not win; the
  mirror pair (row 1 normal-looking phish recruiter -> Report; row 6 suspicious-looking genuine former
  colleague -> Trust) is clean, and the genuine agency recruiter (row 3) sits right after the fake one
  (row 1) as the matched genuine item after the likely miss. `recon_request` ("what systems / who runs
  IT") is the consistent, teachable tell across rows 1 and 4.
- **Facts are accurate and in their lane.** Everything traces to `concepts.md` (fake recruiter =
  reconnaissance; fake senior profile = the Robin Sage / Think-Before-You-Link point; made-up security
  answers; leave posts = short-staffed signal). The E2/E4 overlap (overview line 57: "OSINT reduce notes
  in every attack half; E2 and E4 posts") is respected: E14's distinct core_12 contribution is the
  privacy panel, the Post-or-Not drill and the fake-profile/recon defend set, none of which E2 or E4
  carry; the OSINT-then-write mechanic shared with E4 is by design.
- **Rendering is clean.** Addresses and handles sit in the address font, body text in the pixel font,
  nothing below 13px (composer, flip and panel renders). The `flipDefenderLineByChoice` line for the
  access pretext renders correctly on the flip; the composer shows the filled slots and a single
  calibrated red flag; the privacy panel strikes through each closed fact and counts "3 of 5 facts
  closed".

## Findings

### MA1 - The catch-up decoy, with the ask the composer always appends, reads with a dangling "it". Major, episode-local.
`df_pretext_catchup` is the slot-free decoy: body "How's the studio while I'm away?"
(`scenario.json.erb:589-593`). The composer always renders and defaults an **ask** part
(`mail-composer.js:395-401` defaults every non-pretext part; `:941` renders greeting/pretext/ask as
selects), and with both asks at urgency `low` the default is the first, `df_ask_confirm` "Easiest if you
just confirm it here." (`:595-606`). So choosing the catch-up and sending produces:

> "How's the studio while I'm away? **Easiest if you just confirm it here.**"

and with the other ask:

> "How's the studio while I'm away? **No rush, just let me know once it's sorted.**"

In both, "it" / "it's sorted" has no antecedent: the catch-up body names nothing to confirm or sort. In
the two access pretexts "it" resolves to "my access" and the tails read fine (confirmed on the flip
render, access_now + ask_confirm). The catch-up is one of three offered pretexts and `df_ask_confirm` is
the **default** ask, so this dangling sentence is on a default path, not an edge case. The brief's
"every template x combination reads as English" check fails here. (`attack.json`'s `_templates_note`
reasoned "the appended ask is the bite", but did not check that "confirm it" reads after a body with no
"it".)

A second, lesser mismatch rides on the same mechanism: `df_pretext_access_now` ("Can you sort it
**today**...") + `df_ask_calm` ("**No rush**...") reads contradictorily. It is only reachable if the
learner switches the ask off its default.

Fix (episode-local): reword the two asks so they carry their own object and work after any pretext.
Old -> new (both shells, shared fragment `attack.json` + full erb):
- `df_ask_confirm`: "Easiest if you just confirm it here." -> "Easiest if you just reply here to let me know."
- `df_ask_calm`: "No rush, just let me know once it's sorted." -> "No rush, just reply when you get a chance."

Both then read after the catch-up ("How's the studio while I'm away? No rush, just reply when you get a
chance.") and after each access pretext, and the access_now/ask_calm pairing no longer contradicts a
"today". Template ids are unchanged, so `flipDefenderLineByChoice` keying is untouched.

### MA2 - The defend-only shell carries Dani-centric framing that presupposes the OSINT stage. Major, episode-local (defend-only).
The brief's third explicit check: does the defend-only privacy panel make sense to a learner who never
did the OSINT stage? The engine side is fine - `privacy-model.js:88-111` reads each fact's text from
`social.intelFacts` (present in the defend erb, `:386-407`) and reads `onBoard` from the
`se_intel_*` globals, which are all `false` in the defend-only shell, so the "On the board" badge is
correctly dropped. The content side is not fine: the standalone learner meets "Dani" for the first time
inside this half, cold, in copy written for the full episode's "you defended Dani's side" framing.

- The triage set title is "Dani's messages and requests" (`defend .../scenario.json.erb:68`), but none
  of the six messages are from or about Dani, and the defend-only learner is a generic staffer ("all
  staff", player "Learner"), not Dani.
- The privacy panel `note` is "Each change closes a found fact **on the board**. Tighten **Dani's
  profile first**, then do the same on your own." (`defend .../scenario.json.erb:383`). There is no board
  in the defend-only shell, and no reason for this learner to start with a stranger's profile.
- The five fact rows are third-person about Dani ("Dani's leave countdown says he is away all next
  week") while the Post-or-Not drill and the panel settings are all second person ("your lanyard", "your
  own"). The two framings pull against each other with no OSINT stage to reconcile them.

The brief for the defend-only shell and `defendIntro` both say "tighten **your own** settings" and never
introduce Dani, so the Dani references land unanchored.

Fix (episode-local): make the defend-only copy self-contained. Either (a, lighter) de-Dani the
defend-only shell: set title -> "Messages and requests"; panel `note` -> "Each switch closes one of the
things an attacker could piece together about you. Tighten these on your own profile."; or (b) add one
line to the defend-only brief naming Dani as the colleague whose inbox you are covering, so the Dani
references have a referent. Option (a) fits the 8-minute standalone better and touches only the defend
erb (the full shell is already coherent because its OSINT stage introduces Dani).

### MI1 - The catch-up's by-choice flip line is unreachable. Minor, episode-local.
`flipDefenderLineByChoice.df_pretext_catchup` ("A catch-up asks for nothing...", full erb `:439`) only
renders on a **landed** send with tells: `flip-view.js:326` shows `defenderLine()` inside the
message-replay branch, and `:327` routes a missed send to `flipMissed`/`flipLandedNoTells` instead. The
catch-up fails the required `pretextRelevant` factor (no distinctive value), so it never lands, so it
always takes the missed branch and this line is dead content. Harmless - the missed flip
("Your attempt did not land this time...") is correct teaching for the decoy - but the authored catch-up
line will never display. Either accept it, or drop it so it does not read as live content.

### MI2 - The full shell sets `phish_df_cover_landed` but nothing reads it. Minor, episode-local.
Validator SOCIAL warning (full shell): `social.phishTargets[df_cover].outcome.setGlobal.phish_df_cover_landed`
is declared and set (`scenario.json.erb:808-812`) but no condition, mapping, credit or ink VAR reads it.
The attack-beat task completes on `phish_df_cover_attempts > 0` (`:871-878`), not on landed, which is the
right choice (the one send completes the beat whether it lands or misses). So the landed global is
genuinely unused. Fix: drop the `outcome.setGlobal` block (and the `phish_df_cover_landed` entry in
`globalVariables`), or wire it to something, so it does not look load-bearing.

### MI3 - `pp_security_answer` "closes" the pet fact without removing the disclosure. Minor, episode-local (defensible).
Four of the five privacy settings genuinely close the fact they name (profile -> connections only;
posts -> connections only hides the leave post; don't name systems / take down the advert; crop
badges/screens). The fifth, `pp_security_answer` ("Use a made-up security-question answer...", both erbs)
is mapped to `se_intel_df_pet` - but using a made-up answer does not make the dog's name private; the
post is still public, so the fact is not "closed", its usefulness is neutralised. The panel frames every
toggle as "closes a found fact", which is a slight stretch for this one row. This is **defensible**:
`concepts.md` explicitly favours the made-up answer as the durable fix ("you can't un-post"), and the
pet post would also be caught by `pp_posts` (posts -> connections only). Logged for the owner, not a
required change; if a change is wanted, either add "and set the pet post to connections only" to the
label, or map `df_pet` to `pp_posts` and keep the made-up answer as an extra tip.

## Verdict

**Approve with changes.** The episode is on-model, factually sound, proportionate (people keep their
life online), no-blame throughout, and structurally does what the brief asks: attack-first OSINT-then-
write, a reduce note per fact, `maxMessages: 1`, the built defender-inbox flip by choice, a fair 3+3
defend set with a clean mirror pair and a matched genuine recruiter, and both unscored teaching surfaces
present in both shells. Validators, dialoguelint and all 22 parity/rule-of-thumb tests are green. Two
majors should be fixed before ship, both episode-local string work: reword the two ask tails so the
catch-up decoy and its appended ask read as English (MA1), and make the defend-only shell self-contained
so a learner who never did the OSINT stage is not dropped cold into "Dani's profile" and "the board"
(MA2). The three minors are polish and one defensible design call. A `bridge-e14-full.jsonl` run and a
defend-only render (especially the privacy panel with no facts collected) are still owed to confirm the
fixes land on screen.

One line for the orchestrator: the wiring agent's two ask templates read fine after the access pretexts
but dangle after the slot-free catch-up decoy (MA1), and the defend-only privacy panel works
mechanically but inherits full-episode "Dani"/"board" framing the standalone learner has no setup for
(MA2); both are small copy fixes.
