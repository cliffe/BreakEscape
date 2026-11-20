# R2 engine review (round 2)

Reviewer: adversarial engine lens, fresh review. Scope: `00_README.md`, `01_PIPELINE.md`,
`02_ENGINE_WORK.md`, checked against the code in `/home/user/BreakEscape` on 2026-10-28. I did not
edit any brief and ran no git. Every path, symbol, line, stage id, validator rule, test and enum cited
by the three files was opened and checked; the episode specs were cross-read for packet-shape
agreement.

## What I could and could not run

- Ran read-only `grep`/`sed`/`ls`/`cmp`-style checks over the engine source, the schema, the
  validators, the parity and rule-of-thumb tests, the built fragments and the episode specs.
- Did not run the jsdom suites, the Ruby validator or the bridges (environment, as in R1). All
  line/symbol claims below were checked by reading the source.

## Findings

### m1 -- Round-2 known item 1 confirmed, and it reaches a fifth tell the known item does not name

`02_ENGINE_WORK.md` ENG-08 tell table (`:627-643`). Three rows give a justification the content and
`10_CHECK_FORMS.md` contradict, and one names a built set that does not use the tell. By ENG-08's own
rule (`:623`: shared iff two or more sets use it; one set only is scenario-local), every one of these
is single-set today and should be local, or the reason must be reworded as forward-looking:

- `ransomware_note` (`:631`): "Used by E8 (defend), E13 (defend) ... two sets use it". **E13 does not
  use `ransomware_note`.** E13's tells are `hidden_instruction`, `deepfake_request` plus shared
  `secrecy_or_bypass`/`vish_callback_pressure`/`borrowed_authority`/`lookalike_domain`
  (`episodes/E13_ai_assistant.md:238,253-257`). Only E8 uses `ransomware_note`
  (`episodes/E08_after_the_click.md:182`, row 5).
- `fake_check_paste` (`:633`), `fake_update_prompt` (`:634`), `dangerous_download` (`:635`): justified
  "E10 and the `general_v2` form both use it". **`general_v2` scores none of them.** `10`'s item 2 is
  a page scoring `lookalike_domain`/`padlock_myth`, item 8 scores `senderTrust`/`reply_to_differs`,
  and the per-form scored-flag multiset lists neither (`10_CHECK_FORMS.md:286,288,296-298`). E10's own
  spec already states the honest version ("so a `general_v2` item **may later** score them",
  `episodes/E10_downloads_and_fake_checks.md:30`), so ENG-08 is the only place still asserting it.
- `mfa_number_relay` (`:632`), **beyond the documented known item:** "Used by E9 (defend), E3 fake-IT
  lever ... two sets (E3 and E9)". **E3 does not use it.** `mfa_number_relay` appears nowhere in the
  repo (`grep` over `scenarios/`, `awareness/`, `public/`, `scripts/validate_social/` returns
  nothing); E3's built `channelTells` are `vish_callback_pressure`/`borrowed_authority`/
  `secrecy_or_bypass`/`unrequested_mfa_push` (`awareness/e3/defend.json:40,78`). Only E9 uses
  `mfa_number_relay` (`episodes/E09_passwords.md:152,160`), and E9 repeats the same false "E3 and E9
  both use it" claim (`:32,152`).

`unexpected_sent_item` (`:629`) and `unrequested_reset` (`:630`) are the two rows that **are** hedged
("may stay local ... if `10` does not place it in `general_v2`"), and they are indeed E8-only today;
leave those as-is.

Impact: harmless at runtime. Promoting a single-set id to the shared `CHANNEL_TELLS` is append-only
and off until a set opts in (ENG-08's guard, `:663`; verified `CHANNEL_TELLS` in `phish-rules.js:52`
and `triage.rb:38`, `flag_universe` at `triage.rb:209`, `chipIdsFor` at `triage-flags.js:154`), and
each tell has a `factorStrings.<id>.redFlag` sentence in its own set, so the sets validate whether the
id is shared or local. The defect is factual accuracy and self-consistency in the authoritative engine
doc. Fix: for `ransomware_note`, `fake_check_paste`, `fake_update_prompt`, `dangerous_download` and
`mfa_number_relay`, either (a) correct the "Used by"/reason columns to say "one set today; kept in the
shared library as forward-looking pre-registration for a later check item", or (b) reclassify them as
`local` and drop them from the canonical-string append list (`:645-653`). Keep E8/E9/E10 unchanged;
they validate either way.

### m2 -- ENG-09a leaves the `choice`-kind scoring mapping for the implementer to guess

`02_ENGINE_WORK.md` ENG-09a (`:678-679`). The change says "the chosen option id maps to a
verdict-equivalent (correct = a scored right move, else a miss), recorded like any item under the
`awareness` profile", but the scorer keys on verdicts, not choices: `triage-scoring.js` has
`VERDICT_POINTS` (`:70`) and `KIND_VERDICT_POINTS` (`:43`) indexed by `trust`/`report`/`delete`/
`verify`. A `choice` card has no verdict, so a fresh Sonnet implementer must invent the point value a
correct and an incorrect choice earn, and the `se_awareness_records` row shape for a choice. The packet
does name the right file in "Read first", so this is not a blocker, and it does not touch the pre/post
measurement (E9 §14 keeps the choice cards out of the check forms,
`episodes/E09_passwords.md:163`), but the exact mapping is a guess. Fix: state it in ENG-09a, e.g.
"a correct choice scores as a right verdict does under `awareness` (full points), a wrong choice scores
0, and the record stores `{ id, correct, chosen }`".

### t1 -- `00` still hedges that E14 "optionally" uses ENG-04, which E14 and ENG-04 have settled against

`00_README.md:64` ("E14 ... needs ENG-04 only if its brief adds a sandbox beat") and `:88`
("E11, E15, E16 (E14 optional)"). The E14 spec is now firm that it does not use ENG-04
(`episodes/E14_social_media.md:9,217,347`), and `02` agrees ("E14 and E17 do **not** use ENG-04",
`02_ENGINE_WORK.md:291`). The `00` §5 E14 row itself (`:93`) correctly lists no ENG-04, so nothing is
mis-built; the hedge is just stale. Fix: drop "(E14 optional)" at `:88` and reword `:64` to "E14 uses
the built `osint`/`write` stages and does not use ENG-04".

### t2 -- `00` and E12 disagree on whether the parcel art (ENG-05d) blocks wiring E12

`00_README.md:98` lists ENG-05d as "E12 polish (E12 can ship a first pass without it)" and its "needs
first" is the 3 Nov PixelLab reset, but `episodes/E12_visitor_and_tailgater.md:64-65` bundles it into
the pre-wiring set ("ENG-05a (with 05b to 05d) ... land before E12 is wired"). The E12 blocking
sentence is actually only about ENG-05a, so this is a loose bundling rather than a hard contradiction,
and the E12 file is content-owned (outside the 00/01/02 scope), but `00`'s authoritative dependency
graph and E12 should read the same. Fix (in whichever file the fixers own): say the parcel sprite is
not a wiring prerequisite; E12 can be wired and bridged with the stock costume sprite and gets the
baked-in parcel after the reset.

## R1 findings verified fixed / not fixed

All R1_engine findings are fixed:

- **B1** (00 missing ENG-10 to ENG-13): fixed. §11 now "ENG-01 to ENG-13" (`00:240`); §5 has rows for
  ENG-10 (`:106`), ENG-11 (`:89`), ENG-12 (`:90`), ENG-13 (`:91`); WP-12 row is "ENG-10 + its own
  file" (`:107`); §4 schedules them (`:64`).
- **M1** (ENG-01 `flipAftermath` vs E08 `flip.becomeVictim`): fixed. ENG-01 adds the "first odd sign
  maps onto `items[0]`" paragraph (`02:99`); E08 uses `flipAftermath`/`stepLabels`/`victimName` inline
  and drops `firstSign`/`becomeVictimIntro` (`E08:133`).
- **M2** (ENG-03a vs ENG-08 tell split): fixed. ENG-03a now splits three shared, two local (`02:235`),
  matching the ENG-08 table; E10 agrees (`E10:30`).
- **M3** (E09 leans on ENG-02 for defend work): fixed. E09 uses the `guess` stage for the attack half
  and ENG-09a for the defend cards and the defend-only variant (`E09:27,28`).
- **M4** (E10 browser verdict open): fixed. E10 states the `verdictLabels` relabel, no new verdict
  (`E10:27,30,97`); `VERDICT_ACTIONS` ids unchanged (`triage-kinds.js:40`).
- **M5** (11 ships `["brief"]` with no ENG-10 reference): fixed. `11` now depends on ENG-10 and the
  `variant:"brief"` allowance (`11:37-39,62-69`).
- **m1** (four em dashes in 02): fixed. Zero em/en dashes in all three files (checked with a Unicode
  grep; the only hits are box-drawing bar chars in the §10 example, not dashes).
- **m2** (ENG-05a "stage" wording): fixed. Heading "World-play attack modifier `world`" (`02:363`),
  index "not a new stage id" (`02:44`), `00:95` "modifier hand-off (not a new stage)".
- **m3** (ENG-04 not self-contained): fixed. The normative config block is inline in ENG-04
  (`02:305-337`) with E11 §10a as the mirror.
- **m4** (ENG-02 `patternSlots` template ambiguous): fixed. ENG-02 now says a template interpolates
  only its own slot's fact, tokens never cross slots (`02:178`), example `"{team}1"` (`02:164`).
- **m5** (ENG-10 schema `variant` enum): fixed. ENG-10 point 4 says to extend the enum with `"brief"`
  (`02:813`); confirmed the enum is `["full","defendOnly"]` today (`scenario-schema.json:1782`).
- **t1** (`VERDICT_ACTIONS :42`): fixed to `:40`; confirmed in code (`triage-kinds.js:40`).
- **t2** (ENG-07 `npc-manager :1251`): fixed to `:911`/`:1110`; confirmed in code
  (`npc-manager.js:911,1110`).
- **t3** (game.js `:142/:238`): fixed to `:145/:241`; confirmed in code (`game.js:145,241`).

Round-1 ruling 3 (E8 flip), ruling 5 (`attack_checks` relaxation), R1_sonnet M10/M11 (relaxation +
`flipHeading` parity) are all reflected consistently across ENG-01/ENG-04/ENG-08, E8 and E11:
`attack_checks` runs only on an attack-artefact stage (`osint`/`build`/`write`/`mfa`/`guess`) in both
ENG-04 (`02:345`) and ENG-08 (`02:605`), guarding the real `awareness.rb:53` `if full?(ep)` call;
`flipMontageByChoice` is the only new `STRINGS_ERB_ONLY_OK` entry (not yet in the test, correctly) and
`flipHeading` stays in the fragment (E11:239-245).

## Guards checked (existing content keeps the old path)

- **38 shells.** `social-awareness-rule-of-thumb.test.mjs:22` asserts `shells.length === 38`; the tree
  has exactly 38 `scenarios/awareness_*` folders today. ENG-09d and `01` P6 both carry the +2/+1/+4
  math.
- **Parity allow-lists.** `STRINGS_VALUE_EXEMPT` (`:57`), `STRINGS_ERB_ONLY_OK` (`:59`),
  `SET_ERB_ONLY_OK` (`:61`) match exactly what `01` P7 and `02` quote; the `e${n}` path logic yields
  `e10` with no code change (`:64`).
- **Six built role forms / student lab / SAFETYNET.** Every packet is opt-in on a new optional key,
  stage id or kind under `additionalProperties:false`; `DEFAULT_STAGES` and `STAGE_IDS` order are not
  changed (new ids appended); `CHANNEL_TELLS` appends are off until a set opts in. 00 §7 and the per-
  packet "How it is guarded" blocks hold. The lab/m02 bridges are in the standard acceptance.
- **ENG-08 line anchors.** `phish-rules.js CHANNEL_TELLS` 12 ids (`:52`); `triage.rb CHANNEL_TELLS` 12
  (`:38`), `FACTORS` 7 (`:35`), `NON_EMAIL_KINDS` (`:50`), `flag_universe` (`:209`); `awareness.rb`
  `STAGES`/`STAGES_BY_VARIANT` (`:18-22`), `stage_orders` (`:157`), `attack_checks` (`:182`), the
  `:53` guard, `EPISODE_MESSAGES` 4..8 (`:30`), `CHECK_MESSAGES` 10 (`:31`). All verified.

## Consistency between 02 and the episode specs

Every ENG packet an episode cites exists with the shape the episode uses: E8 (ENG-01 flipAftermath +
stepLabels + victimName; ENG-09b array conceptPanel), E9 (ENG-02 `guess` + ENG-09a choice + ENG-09b),
E10 (ENG-03a states + verdictLabels; ENG-03b optional), E11/E15/E16 (ENG-04 `mistake`+montage, shape
mirrored from E11 §10a), E12 (ENG-05a `world` modifier handed back via `watchCall`, ENG-05b-e,
ENG-09c; the two-NPC split grounded in `episode-runner-minigame.js:640` and `pretext-card.js:240`,
both confirmed), E13 (ENG-06 in-flip overlay + ENG-07 label at `person-chat-ui.js:264` and the
`call` card), E14 (ENG-11 sortDrill + ENG-13 privacyPanel, no ENG-04), E17 (ENG-11 sortDrill, one
defend-only shell at Tarrowby), WP-12 (ENG-10 brief variant). Debrief single-panel confirmed at
`debrief-view.js:202`, so ENG-09b's array widening is needed as stated.

## A cross-reference note (content-owned, out of 00/01/02 scope)

Round-2 known item 2 is real: E8 row 1's one-off firm is `claims-client@fenwick-brandt.example`
(`E08:178`), the same surname as E14's subject Dani Fenwick (`E14:315`). This is an episode-spec
matter, not in my three files; flagged only so it is not lost.

## Verdict

clean
