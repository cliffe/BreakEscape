# UI SE picks review R2

Round 2, a confirming round, read-only, of branch `build/ui-se-picks` at tip
`4846d32ac` (code is `d0edb2227` plus the R1 review file). Base main
`d69c29089`. Worktree `.claude/worktrees/p-ui-se-picks`.

Scope: the two user picks, C-PP3 (option B, drop the orange readiness line on the
pretext prep card) and C-PV1 (option C, the privacy pill reads Exposed / Closed).
R1's verdict was SHIP 0/0/0 with nit N1. This round does a fresh independent pass
aimed at what R1 could have missed: other reuse sites, stale selectors or strings
in CSS, tests and tools, Hacktivity, a live run with real clicks, and a judgement
on N1.

## Verdict: SHIP

Both R1 findings stay closed and nothing new surfaced. Every reuse site of the two
minigames still renders. No CSS selector, test or tool outside the changed files
expects `.pretext-readiness` or the pill words Open / Tight. Hacktivity holds no
reference to either. The live run confirms the pill reads Exposed / Closed through
a full tighten and a loosen, with the fact notes and counter staying consistent.

Counts: Blocker 0, Major 0, Minor 0. Nits 1 (N1 from R1, confirmed and still a nit;
suggested wording given below, no code change).

## Base check

`git log -1 main` is `d69c29089` (unchanged from the branch base), so there is no
merge to replay and no conflict to report. `git diff --stat main HEAD` is the
R1 set: the two minigame JS files, `pretext-card.js`, the pretext CSS, the privacy
model, three test files, and the two build-log / R1 docs.

## 1. Other screens and scenarios that reuse the two cards

- Privacy panel. Three scenarios instantiate `privacy-panel`:
  `ca14_social_media`, `ca14_social_media_defend` and `test_exercise_station`
  (grep of `scenarios/*/scenario.json.erb`). None authors `switchOpen` or
  `switchTight` (branch-wide `git grep` returns only the model, the minigame
  render and the docs), so each picks up the new pill words and nothing contradicts
  them. `ca14_social_media_defend` overrides only `leaveOff` in its privacyPanel
  `strings` block (`scenarios/ca14_social_media_defend/scenario.json.erb:418`),
  `ca14_social_media` the same (`scenarios/ca14_social_media/scenario.json.erb`,
  confirmed at runtime: strings = `{ leaveOff: 'Why it matters: ' }`).
  `test_exercise_station` adds no privacyPanel `strings` at all.
- Pretext prep. The card is reused far more widely (the ca01 to ca17 phishing and
  defend scenarios, the ca_pre / ca_post variants, `lab_social_engineering`,
  `lab_physical_pentest`, and the test_social_* scenarios). The removed line was
  derived entirely from the render's own `facts` / `options`, never from scenario
  config, so no scenario can have depended on it: every launcher renders the same
  card code. A smoke render of `pretext-prep` in the ca14 game opened the card at
  915x412 and 390x844 with `document.querySelectorAll('.pretext-readiness').length
  === 0` and no page errors.
- app/views. No facilitator or debrief view references the pretext card, the
  privacy panel, `pretext-readiness`, `switchOpen` or `switchTight` (grep of
  `app/`). `summarise()` (`privacy-model.js:141-143`) carries counts only, so a
  debrief or result record never prints the pill words. Nothing server-rendered
  shows these strings.

## 2. Stale selectors, tests or tools

- `.pretext-readiness`: the only live reference left in the branch is the R1 test
  assertion that it is absent,
  `test/js/social-pretext-prep.test.mjs:286`
  (`assert.equal(... querySelector('.pretext-readiness'), null, 'the readiness note
  is gone (C-PP3)')`). The two CSS rules that listed the selector drop it cleanly
  (`css/pretext-prep-minigame.css`, diff confirmed); no rule is left empty. All
  other matches are the two docs files.
- `readinessLines`: no importer or test anywhere in the branch outside the docs
  (`git grep readinessLines HEAD`).
- Open / Tight as pill words: `tools/playtest/*` holds no reference to
  `pretext-readiness`, `readinessLines`, `switchOpen` or `switchTight`
  (grep of `tools/`). No playtest bridge or audit script asserts the old words.

## 3. Hacktivity

`/home/cliffe/Files/Projects/Code/Hacktivity` is present. A read-only grep for
`pretext-readiness`, `switchOpen`, `switchTight` and `readinessLines` over the repo
(node_modules excluded) returns nothing. Hacktivity does not reference the removed
selector or the switch state strings.

## 4. Live run (real clicks)

Keyless server from the worktree on port 3442 (my PID), fresh game 4325 from
`tools/playtest/new-game.rb ca14_social_media`. The game loads straight into play;
no character picker appeared, so the female_hacker_hood_v2 fallback was not needed.
The `privacy-panel` minigame was opened with the scenario's real config
(`window.gameScenario.social.awarenessEpisode.privacyPanel`, five settings) at
915x412, driven with real `.pp-switch` clicks:

- All open: every one of the five pills reads "Exposed", `aria-checked="false"`,
  row `data-state="open"`.
- Tighten all five: every pill reads "Closed", `aria-checked="true"`, row
  `data-state="tight"`; every fact note reads "Closed"; the counter reads
  "Every fact on this page is closed."
- Loosen the first again: its pill returns to "Exposed" (`aria-checked="false"`)
  while the other four stay "Closed"; its facts return to "Still visible"; the
  counter reads "4 of 5 facts closed".
- No pill ever reads "Open" or "Tight". The red fact note and the pill agree
  throughout. The frame fits and content wraps at 915x412, nothing clipped.

Shots in the scratchpad `se-picks-r2/`: `privacy_1_allopen_915x412.png`,
`privacy_2_alltight_915x412.png`, `privacy_3_loosenone_915x412.png`, and the
pretext smoke shots `pretext_ca14_915x412.png`, `pretext_ca14_390x844.png`.

## 5. N1 judgement

N1: the panel heading "Tighten the settings" and the intro "...Turn one to tight
and see which of the facts an attacker could find it closes."
(`privacy-model.js:26-27`) keep the tight / tighten wording while the pill now
reads Exposed / Closed. The live shots show the collision directly: the intro says
"Turn one to tight" above a switch whose two positions read "Exposed" and "Closed".

Judgement: it stays a nit, not a Minor. The verb "tighten" still describes the
action correctly (tightening a setting closes facts), and the state the switch
settles into, "Closed", agrees with the counter and the fact notes. The only
literal mismatch is the intro naming a switch position "tight" that the switch no
longer labels; a player can still act (turn the one switch), and the result reads
consistently. This is squarely inside the user's chosen option C (pill only), so
raising it above a nit would contradict the pick. Left as a nit.

Suggested wording, if the heading and intro are ever revisited (not changed here):
point the intro's verb at the pill word, for example

- intro: "Each switch below is a setting on a profile. Close one and see which of
  the facts an attacker could find it hides."

The heading "Tighten the settings" can stay as is (the verb reads fine) or become
"Close the gaps" if a full alignment is wanted.

## Confirming R1

- C-PP3 closed: the readiness line is gone, its export has no importer, and the
  card renders with no `.pretext-readiness` element across reuse sites and sizes.
- C-PV1 closed: the pill reads Exposed / Closed from the one render path, no other
  surface prints the words, and the per-scenario override is intact.
- N1 reconfirmed as a nit (above).
