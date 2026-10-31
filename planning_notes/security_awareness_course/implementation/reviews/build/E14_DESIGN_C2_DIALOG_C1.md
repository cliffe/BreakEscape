# E14 "Social media and oversharing": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E14 is the one attack-first episode in the set: an OSINT-then-write attack half, a built defender-inbox flip keyed by the chosen pretext, then a defend half (6-card SMS set + an unscored "Post or Not?" sort drill + the ENG-13 privacy panel). Company Merrin & Sallow Architects; host the co-founder Julian Sallow; module `core_12_social_media_and_oversharing`. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E9/E11 reviews in this folder.

Scope read end to end: both shells `scenarios/awareness_e14_social_media{,_defend}/{scenario.json.erb, ink/julian_sallow.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e14/{attack,defend,full_only}.json`; E14's block in `gen_e8_e17_shells.py` (the `EPISODES['e14']` config, `defend_only`, `DEFEND_HALF_KEYS`/`defend_half_keys`); the spec `.../episodes/E14_social_media.md`; the module `core_12.../concepts.md`; and the engine the findings depend on (`episode-runner/episode-runner-minigame.js` `_flipProps`/`_hasChoiceLine` aw-ux2 branch, `episode-runner/flip-view.js` `defenderLine()` + the landed/missed branch, `inbox-triage/triage-messages.js` `plainSentMessage`/`resolvePlayerSent`, `privacy-panel/privacy-model.js`).

This pass **ran the flip**. A keyless `:3001` bridge run (`ONLY="e14-full"`, game 4883) passed 19/19; its flip assertion reads `.aw-defender-line` on the flip stage and requires it to contain "rush left no room to check" — the `df_pretext_access_now` by-choice line — so the flip now shows the message-replay + per-choice defender line on a clean landed send (see the E14-M2 row). I judged the flip from that render; the privacy-panel split, the ask tails and the defend-set copy I judged from code and the erbs.

Ran (all E14-only):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes. Defend shell: no social warnings (only the generic m01-shaped SUGGESTION noise). Full shell: the same SUGGESTION noise plus **one real SOCIAL warning** for `phish_df_cover_landed` (see MI2), unchanged from C1.
- `dialoguelint.mjs` both shells: full `lines=7 median=17 p90=23 max=23`; defend `lines=3 median=28 p90=29 max=29`. No rule hits; every host line under 30 words. (The three defend-only lines run 28-29, the same ceiling-hugging pattern E9's defend-only line has.)
- Parity + rule-of-thumb suites: **20/20 pass**, including "E14: fragment and full erb share the same learner-facing copy".

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 5 | 4 | 0 | 1 |
| **Total** | **5** | **4** | **0** | **1** |

Queued engine items the brief told me not to re-raise (OSINT pin cue / E14-M1, handle font / E14-m1, "Post or Not?" summary marks / E14-M4, privacy-panel live-region line / E14-m2) are excluded from the counts.

## C1 + P1 closure

Each C1 finding and the two P1 content findings checked against the live files, and the flip against the render.

| Finding | Claimed fix | Verified | Status |
|---|---|---|---|
| **MA1** (C1) catch-up decoy + appended ask read with a dangling "it" | reword the two ask tails so they carry their own object | `df_ask_confirm` now "Easiest if you just reply here to let me know." (full erb `:597`, `attack.json:71`); `df_ask_calm` now "No rush, just reply when you get a chance." (`:603`). Catch-up + either ask now reads as English ("How's the studio while I'm away? No rush, just reply when you get a chance."). Template ids unchanged, so `flipDefenderLineByChoice` keying is intact. The `access_now` ("...sort it today...") + `ask_calm` ("No rush...") pairing C1 called a lesser mismatch is now only mildly loose, because the ask refers to replying, not to the task. | **Closed** |
| **MA2** (C1) / **E14-M3** (P1) defend-only shell carried Dani/board framing presupposing the OSINT stage | de-Dani the defend-only shell (title, panel note, fact rows) so it stands alone | Defend erb: title "Messages and requests" (`:68`); panel note self-framed "Each switch closes one of the things an attacker could piece together about you from a public profile. Tighten these on your own profile." (`:383`); all five `intelFacts` rows second-person (`:386-407`). `defendIntro`, `scopeNote`, brief name no Dani. No "Dani", "board" or third-person row remains in the defend shell. Generator-backed: the note comes from `full_only.json` via `DEFEND_HALF_KEYS`, the fact rows from `EPISODES['e14']['defend_intel_facts']`. | **Closed** |
| **E14-M2** (P1) clean landed send shows "Nothing to replay" with no consequence and no link to the pinned facts | sharpen the `access_calm` by-choice line; rely on the aw-ux2 engine branch to replay a tell-free landed send | Engine `episode-runner-minigame.js:601-606` (aw-ux2): when a send landed but has no scored tell and the episode authors a `flipDefenderLineByChoice[templateId]`, the message is replayed (via `plainSentMessage`) instead of the `landedNoTells` view, so `flip-view.js:329` renders the per-choice defender line and the victim's-seat aftermath. **Render (game 4883):** the flip carries `.aw-defender-line` containing the `access_now` line ("It named Dani's leave, the new system and Thandiwe... the rush left no room to check"); no `aw-landed-no-tells` element present. The sharpened `access_calm` line ("It named a week she knew Dani was away and asked one easy favour, so Yasmin set the access up without a second thought.") renders by the same path (judged from code, not separately rendered). The facts used and what Yasmin did are now named. | **Closed** (access pretexts; catch-up decoy still correctly shows the did-not-land view, by design) |
| **MI1** (C1) catch-up's by-choice flip line is unreachable | accept or drop | Unchanged. `flipDefenderLineByChoice.df_pretext_catchup` (full erb `:439`) is still authored; the catch-up fails `pretextRelevant`, never lands, always takes the missed branch, so the line is dead content. Harmless. See D3. | **Unchanged (minor)** |
| **MI2** (C1) full shell sets `phish_df_cover_landed` but nothing reads it | drop the setter or wire it | Unchanged. Validator still raises the SOCIAL warning. Grep confirms the global is only declared (`:79`) and set (`:810`); nothing reads it. See D4. | **Unchanged (minor)** |
| **MI3** (C1) `pp_security_answer` "closes" the pet fact without removing the disclosure | logged, defensible | Unchanged, defensible. See D5. | **Unchanged (minor, defensible)** |

The two C1 majors and both P1 content findings are genuinely closed; MI1/MI2/MI3 were logged at C1 as accept-or-optional and are carried below.

## The privacy-panel split (is it right?)

The brief asked me to judge the split created by the MA2 fix: the full erb's panel note keeps the Dani/board framing ("Each change closes a found fact on the board. Tighten Dani's profile first, then do the same on your own.", `:421`), while `full_only.json`'s `note` is now the self-framed version ("Each switch closes one of the things an attacker could piece together about you from a public profile. Tighten these on your own profile."), which the generator copies into the defend-only shell.

**The split is right in outcome, and it is now generator-backed rather than a hand-patch.** `defend_half_keys` (`gen_e8_e17_shells.py:643-652`) copies `privacyPanel` (and `sortDrill`) from `full_only.json` into every generated defend-only shell via `DEFEND_HALF_KEYS`; the self-framed fact rows come separately from `EPISODES['e14']['defend_intel_facts']`. So the defend-only learner, who never meets Dani and has no board, gets a panel that reads entirely in the second person, and the full learner, whose OSINT stage introduces Dani and builds the board, gets the board/Dani note. Each context gets the copy it needs, and the defend erb on disk matches what the generator produces from these sources. `privacyPanel` is not compared by the parity test, so the deliberate divergence does not trip it. **This is the correct call** — one note could not serve both shells, and re-wording the full note to the self-framed version would strand the "on the board" visual the full panel actually shows.

Two blemishes ride on it, both minor:
- the full note's **second clause** "then do the same on your own" still points to a step the single Dani panel never delivers (D2, the full-shell residual of the second half of P1 E14-M3);
- `full_only.json`'s **own documentation is now stale/self-contradictory** about how the split is wired (D3).

## phish_df_cover_landed (judged)

Genuine dead write, and the validator's SOCIAL warning is accurate. The global is declared false (`:79`), set true by `phishTargets[df_cover].outcome.setGlobal` on a landed send (`:808-812`), and read by nothing: no condition, event mapping, credit, ink VAR or objective field mentions it (grep across the full shell + fragments returns only the declaration and the setter). The attack-beat task completes on `phish_df_cover_attempts > 0` (`:873-877`), which is the right trigger (the one send completes the beat whether it lands or misses), so `landed` is not load-bearing. The P1 record shows it being set at runtime (game 4784 globals), confirming it is written and then ignored. **Recommendation: drop the `outcome.setGlobal` block and the `phish_df_cover_landed` entry in `globalVariables` so it does not look load-bearing** (the smallest change; the validator message itself points at the m05/m08 precedent). Harmless to leave, but it is the only real validator warning on either shell, and clearing it keeps the ship state clean. Episode-local, minor (D4).

## What works

- **One clear lesson a clerk can repeat on Monday**, matching `concepts.md`: public posts add up to a map of your firm; small details (a badge, a screen, a named system, a leave countdown, a pet's name) do the damage; a real recruiter never needs your systems or org chart; tighten settings and use a made-up security answer. The `mondayCard`, Julian's closing ink and the no-blame line land it.
- **The flip now pays off the attack.** The one change I most wanted to confirm is confirmed on the render: a careful, tell-free message that lands no longer dead-ends on "Nothing to replay"; it replays the message, shows Yasmin's seat, and names the facts that made it fit the week. That is the lesson's pivot, and it now fires on the default happy path.
- **The advice stays proportionate.** The sort drill is weighted to Tweak (crop the pass, drop the tag, post the people not the whiteboard); the dog photo is an explicit Post; the privacy panel is "connections only", never "delete everything"; the no-blame line says "the fix is a setting and a pause, not shame". Nobody is told to stop posting.
- **The defend set is fair and matched.** 3 report + 3 trust, so refusing everything does not win; the mirror pair (row 1 normal-looking fake recruiter -> Report; row 6 suspicious-looking genuine former colleague -> Trust) is clean, and the genuine agency recruiter (row 3) sits right after the fake one as the matched genuine item after the likely miss. `recon_request` is the consistent, teachable tell across rows 1 and 4.
- **No-blame register throughout**, in both briefs, the per-item feedback, the genuine-item reasons ("'report everything' is not the win"), the `noBlameLine`, and Julian's "Nobody's in trouble for having posted them."
- **Both shells validate** (defend-only with no warnings at all); parity and rule-of-thumb suites are green; the defend-only shell is now fully self-contained.

## Findings

### D1 — the full brief, defendIntro and panel note all promise a "your own" settings step the single panel never shows. Minor, episode-local (full shell). (Residual of P1 E14-M3's second half.)
The full shell says, in three places, that you close gaps "on Dani's profile and your own":
- `scenario_brief` / `strings.brief` (`:4` / `:424`): "...close the gaps, on Dani's profile and your own.";
- `defendIntro` (`:433`): "...tighten the settings, on Dani's profile and your own.";
- `privacyPanel.note` (`:421`): "...Tighten Dani's profile first, then do the same on your own."

The privacy panel has exactly one set of five settings, all keyed to Dani's found facts; there is no second "your own" panel. So the "and your own" / "then do the same on your own" promise is unfulfilled on screen. This is **defensible** — read as real-world transfer advice it is correct, and the `mondayCard` makes it concrete ("tighten one privacy setting today") — but on first read it sets up a step that does not come. The defend-only shell already resolved this (its note ends "Tighten these on your own profile.", single owner, no dangling second step). Smallest fix, make the full note's second clause clearly real-world rather than a next panel, old -> new (`:421`):
`"Each change closes a found fact on the board. Tighten Dani's profile first, then do the same on your own."` -> `"Each change closes a found fact on the board. The same settings are the ones to check on your own profile."`
(The brief/defendIntro "and your own" can stay; the note is where it reads as a missing on-screen step.)

### D2 — `full_only.json`'s own documentation is stale about how the defend-half keys reach the defend-only shell. Minor, needs-user (doc).
The fix added an accurate `_note_defendOnly` to `full_only.json` (`:41`), but left two older notes that now contradict it:
- the top `_about` (`:2`): "None is shared with the defend-only shell by the generator (`defend_only()` builds the awarenessEpisode from named fields and copies no episode-level key)";
- the `sortDrill` and `privacyPanel` `_notes` (`:5`, `:33`): "...the generator does not copy episode-level keys, so the defend-only shell will not carry them unless the generator is extended or the defend-only erb is hand-patched".

The generator **was** extended: `DEFEND_HALF_KEYS = ('sortDrill', 'concernForm', 'privacyPanel')` and `defend_half_keys` copy exactly these from `full_only.json` into the defend-only shell (`gen_e8_e17_shells.py:640-652`, `defend_only` `:707`). So those three notes describe the old world. Worse, the `_about` still says every block is "pasted by the wiring agent into the FULL erb" — but `privacyPanel.note` is now the **defend** version, so a wiring agent who re-pasted this block into the full erb would install self-framed copy into the full shell. Correct the `_about` and the two `_notes` to say the defend-half keys are generator-copied, and that the full erb's panel note is hand-authored and intentionally differs from this file's `note`. Non-learner-facing; no shipped copy is wrong.

### D3 — the catch-up's by-choice flip line is unreachable (carried MI1). Minor, episode-local.
`flipDefenderLineByChoice.df_pretext_catchup` ("A catch-up asks for nothing...", full erb `:439`) only renders on a landed send; the catch-up fails the required `pretextRelevant` factor, so it never lands and always takes the did-not-land branch. Dead content, harmless (the did-not-land view is the correct teaching for the decoy). Either accept it, or drop the key so it does not read as live. Unchanged since C1; still only a tidy-up.

### D4 — full shell sets `phish_df_cover_landed`, which nothing reads (carried MI2). Minor, episode-local.
See the judged section above. Drop the `outcome.setGlobal` block (`:808-812`) and the `globalVariables` entry (`:79`) to clear the one real validator warning, or wire the global to something. Unchanged since C1.

### D5 — `pp_security_answer` "closes" the pet fact without removing the disclosure (carried MI3). Minor, episode-local, defensible.
Four of the five settings genuinely close the fact they name; the fifth (made-up security answer, mapped to `se_intel_df_pet`) neutralises the fact's usefulness rather than making the dog's name private. The panel frames every toggle as closing a found fact, a slight stretch for this one row. Defensible: `concepts.md` favours the made-up answer as the durable fix, and the pet post is also caught by `pp_posts`. Logged, not required. Unchanged since C1.

## Dialogue pass (voiced host lines)

Host ink read as spoken, both shells. The full-shell lines (welcome, after-send, both completion lines, "Any time.") are all ≤23 words, calm-colleague register, no printed variables, UK English, no em/en dashes; I would leave them. The three defend-only lines run 28-29 words (the dialoguelint ceiling), the same borderline the E9 defend-only line sits on.

One line I would consider trimming for voicing, the defend-only completion line (`defend .../ink/julian_sallow.ink:24`, generated from `gen_e8_e17_shells.py` `LINES`):
old `"That's the feed and the inbox done, thanks. The tell is always what they ask for, not how friendly they are: share nothing about our systems, and report it."` (29 words, two thoughts joined by a colon)
-> new `"That's the feed and the inbox done, thanks. The tell is always what they ask for, not how friendly they are. Report anything that asks about our systems."` (27 words, two sentences).
Optional, needs-user (shared generator `LINES` then regenerate). No other host line needs a change.

Everything else in the dialogue surface (both briefs, `defendIntro`, the six defend-item bodies and their `whyFine`/`perFlagNote`/`ifTrusted`/`reportReply`, the three pretext templates and two ask tails, the four `flipDefenderLineByChoice`/flip strings, the `mondayCard`, `noBlameLine`, rule of thumb and the sort-drill reasons) reads well on first pass and is left as is.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass (D1 note, optional) | pass |
| osint | pass (5 facts, each with a reduce note; posts read naturally) | — |
| write | pass (3 pretexts + 2 asks; catch-up decoy now reads as English, MA1) | — |
| flip | pass (render: clean landed send replays the message + per-choice defender line + Yasmin's seat; E14-M2 closed) | — |
| defend | pass (6-card set fair and matched; sort drill proportionate; privacy panel self-contained) | pass |
| debrief | pass | pass |

**Ship-ready.** The two C1 majors (MA1 dangling ask, MA2 defend-only Dani framing) and both P1 content findings (E14-M2 empty flip, E14-M3 defend-only panel) are genuinely closed, confirmed on the render for the flip and in code + generator for the rest. The privacy-panel split is the right call and is generator-backed. What remains is five minors: three carried accept-or-optional items (D3 dead catch-up line, D4 unread `phish_df_cover_landed`, D5 the defensible security-answer mapping), one full-shell copy residual (D1, the "your own" panel promise), and one stale-doc tidy-up (D2). None blocks ship. Recommend clearing D4 (the one live validator warning) and D1 in a cheap wording pass; D2/D3/D5 at leisure.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 5 minor (4 episode-local, 1 needs-user; 0 engine).
- Closure: MA1 closed (ask tails reworded, catch-up reads as English); MA2 / E14-M3 closed (defend-only de-Danied, generator-backed); E14-M2 closed (render: clean landed send replays message + per-choice defender line + Yasmin's seat, no `landedNoTells`); MI1/MI2/MI3 carried as D3/D4/D5.
- Privacy-panel split: right, and now generator-copied not hand-patched (`DEFEND_HALF_KEYS` copies `full_only.json`'s self-framed note into the defend shell; full erb keeps the board/Dani note); two minor blemishes (D1 full note's dangling "your own", D2 stale `full_only.json` docs).
- `phish_df_cover_landed`: genuine dead write; the SOCIAL warning is accurate; drop the setter + the `globalVariables` entry (D4) to clear the only live validator warning.
- Blockers: none. Majors: none.
- Voiced host line I'd change: the defend-only completion line (29 words, colon-joined) -> split into two sentences (optional, generator `LINES`).
- Verdict: ship-ready; clear D4 and D1 in a cheap pass, D2/D3/D5 at leisure. Flip judged from render (game 4883, 19/19); split, ask tails and defend copy from code.
