# R1 content review (round 1, adversarial)

Reviewer: adversarial content lens. Scope: `episodes/E08`..`E17`, `10_CHECK_FORMS.md`,
`11_WP12_FIRST_PLAY_AND_ANNUAL.md`, `12_WP15_CORE02_ITEMS.md`, `13_WP02_REPORTING_ROUTE.md`, read
against the built fragments (`planning_notes/phishing_and_social_engineering/awareness/e*/`), the built
scenarios (`scenarios/awareness_*`), the engine (`public/break_escape/js/...`), the validators
(`scripts/validate_social/`), `02_ENGINE_WORK.md`, `00_README.md`, `designs/00_data_contract.md` and
`BRAND_SET.md`.

**Headline.** The episode specs were written before `02_ENGINE_WORK.md` settled the packet shapes, and
several now contradict it. The engine doc even states in-line that E9 §7, E10 §11/§19, E13 §7/§20.1,
E14 §11, E15 §11 and E17 §11a are stale and must change. A fresh Sonnet author reading an episode spec
in isolation would author wrong config keys, cite packet ids that no longer mean what the spec says, or
build the wrong check forms. The fixers' main job this round is to re-sync every episode spec to the
engine doc and to settle the check-form scheme once.

Severity key: **B** blocker, **M** major, **m** minor, **t** trivial.

---

## Blockers

### B1. E8's flip config does not exist; ENG-01 defines a different key and shape
- **File/section:** `episodes/E08_after_the_click.md` §10, §15, §20.2 (and the `strings` in §10).
- **Evidence:** E8 authors `awarenessEpisode.flip = { "variant":"becomeVictim", "victimTarget":"takeover_victim", "firstSign":"e8_sent_invoice" }` and a `becomeVictimIntro` string, with `firstSign` naming a **defend-set** message id. ENG-01 (`02_ENGINE_WORK.md:82-100`) defines the key as `awarenessEpisode.flipAftermath = { heading, intro, items[], line }` with the follow-on signs authored **inline** in `items[]` (each `{ id, kind, ... , note }`), plus a `stepLabels` map for the flip step label. ENG-08 (`02_ENGINE_WORK.md:568`) adds `flipAftermath` to the schema, not `flip.variant`/`becomeVictim`. `socialAwarenessEpisode` is `additionalProperties:false`, so E8's `flip` block would fail `--strict-social`, and the runner only reads `flipAftermath` (`flip-view.js` / `_flipProps`, per ENG-01 §97-99). This is the pilot episode; its one new behaviour would not build.
- **This is known issue #1, now confirmed with the real key.** The review log said "ENG-01 wins"; ENG-01's shape is `flipAftermath`.
- **Fix:** rewrite E8 §10/§15/§20.2 to author `flipAftermath` with ENG-01's exact fields. Author the opening signs **inline** in `flipAftermath.items[]` (do not point `firstSign` at a defend-set id). Reconcile the design overlap this exposes: E8 currently makes the flip's "first sign" the same object as defend row 1 (`e8_sent_invoice`); under ENG-01 the aftermath items are separate inline items, so decide whether the sent-item sign appears in the flip, the defend set, or both with distinct ids. Replace `becomeVictimIntro`/`flipHeading`/`flipDefenderLine` with ENG-01's `heading`/`intro`/`line`; use ENG-01 `stepLabels` (e.g. `{ flip: "The click" }`) for the step label. Remove `flip.variant`/`victimTarget`/`firstSign`.

### B2. The check-form scheme is contradictory across documents; no implementer could build the forms
- **Files/sections:** `10_CHECK_FORMS.md` ("Recommendation"), vs every episode §14 (`E11` §14, `E14` §14, `E15` §14, `E16` §14, `E17` §14; `E08`/`E09`/`E10`/`E12`/`E13` §14), and `00_README.md`.
- **Evidence:** `10_CHECK_FORMS.md` recommends **two** topic pairs, `general_v2` (Quayholt, Verify off) and `data_conduct` (Carrholme, Verify on), and maps every episode's topic into one of them. The episode specs instead each name their **own** per-topic pair: `data_form_a/b` (E11 §14), `social_form_a/b` (E14 §14), `shadowit_form_a/b` (E15 §14), `insider_form_a/b` (E16 §14), `aup_form_a/b` (E17 §14), plus "a new physical-security check form" (E12 §14). E8/E9/E10/E13 §14 say "the general forms or a new topic form per `10`/`ENG-09`". The two schemes are incompatible (2 pairs / 8 shells vs 6+ pairs / 24+ shells), and both are presented as the plan. This is known issue #6, unresolved.
- **Recommendation (requested):** **Adopt 10's two-pair scheme** (`general_v2`, `data_conduct`) and drop the per-topic forms. Reasons: (a) 10's argument holds, the product's measurement claim is per-form A/B parity, and fewer broad, well-matched forms are far easier to keep parallel than six narrow 10-item forms standing behind six 6-item episodes; (b) it matches the built pattern (the built `general` and `mobile` forms already each carry several core topics); (c) `00_README.md:78` and the engine doc both reference the two-pair / `ENG-09a` approach, not per-topic forms; (d) 10 has already done the topic-to-form mapping and the parity method. **Required alignment if adopted:** rewrite §14 of E11/E14/E15/E16/E17 to feed `data_conduct` (and E8/E9/E10/E13 to feed `general_v2`); fold E13's AI/deepfake items and E14's social items into those two pairs; reduce E12's "new physical-security form" to the single `general_v2` pretext item that 10 already carries (the rest of E12 unchecked, which 10 states is deliberate); delete the per-topic form tables in the episodes or re-label them as "candidate items for `general_v2`/`data_conduct`". **One trade-off to put to the user:** two broad pairs give no per-topic pre/post change for an organiser. If per-topic measurement is wanted, that is the only reason to keep more pairs; absent it, two pairs win.

---

## Major

### M1. E9's attack stage is `build`; ENG-02 mandates a new `guess` stage and forbids reusing `build`
- **File/section:** `E09_passwords.md` §7, §9 (config), §15.
- **Evidence:** E9 proposes stages `["brief","osint","build","flip","defend","debrief"]` and "ENG-02 must make the `build` stage launch the password/guesser surface". ENG-02 (`02_ENGINE_WORK.md:130-132, 197`) decides a **new stage id `guess`** and says reusing `build` is wrong ("`build` today launches the landing-page builder ... do not"). `childLaunch` (`episode-model.js:187`) confirms `build` opens the landing-page builder. The valid full list is `["brief","osint","guess","flip","defend","debrief"]` (ENG-08 `02_ENGINE_WORK.md:561` adds that order).
- **Fix:** change E9 §7/§15 to the `guess` stage; keep `awarenessEpisode.guess` (its shape in ENG-02 §152-170 matches E9 §9, align the field names, e.g. `landedGlobal`, `patternSlots[].factId`).

### M2. E9 attributes the defend-half password cards and the defend-only dependency to ENG-02; they are ENG-09a
- **File/section:** `E09_passwords.md` §7, §11 (rows 4-7), §13, §15.
- **Evidence:** E9 §11 labels rows 4-7 "password-practice (ENG-02)" and §7/§13 say the defend-only variant "still needs ENG-02". ENG-02 (`02_ENGINE_WORK.md:136, 189, 197`) states the opposite in plain words: the password cards are the `choice` triage kind owned by **ENG-09a**, ENG-02 is attack-half only, and "**E9 §7's 'the defend-only variant still needs ENG-02' should read 'needs ENG-09a'**".
- **Fix:** E9 §11 rows 4-7 cite ENG-09a (the `choice` kind); §7/§13 say the defend-only variant needs ENG-09a (not ENG-02); add ENG-09a to §3 Depends-on.

### M3. E8, E9, E10, E13 debriefs have several concept panels, but none cites ENG-09b (built `conceptPanel` is a single panel)
- **Files/sections:** `E08` §12 (two concept cards A/B), `E09` §12 ("Concept cards ... how passwords are stolen; the sign-in ladder; ..."), `E10` §12 ("Concept cards ... where software comes from; read the address; the four tricks; ..."), `E13` §12; and each §3.
- **Evidence:** ENG-09b (`02_ENGINE_WORK.md:650-668`) exists precisely because `strings.conceptPanel` is a single panel today (`debrief-view.js` `buildPanel`; schema `scenario-schema.json:1898`), and it names "E8, E9, E10, E13" as the dependants. None of those specs lists ENG-09b, so an author would try to author several panels into a one-panel key (schema/validator fail) or invent a key.
- **Fix:** add ENG-09b to §3 Depends-on of E8/E9/E10/E13, and note in §12 that multiple panels use ENG-09b's array form of `conceptPanel`.

### M4. E14/E15/E16/E17 drills still say "fold into this episode's engine work or raise a packet"; ENG-11/12/13 already own them
- **Files/sections:** `E14` §3 and §11 ("Post or Not?" feed drill; privacy-settings panel), `E15` §3 and §11 (Swap Shop), `E16` §3 and §11 ("raise a concern" form), `E17` §3 and §11a ("can I?" sort).
- **Evidence:** the engine doc built the surfaces and says so: ENG-11 reusable `sortDrill` serves E14 "Post or Not?", E15 Swap Shop and E17 "can I?" (`02_ENGINE_WORK.md:783-835`, and §835 states "**E14 §11, E15 §11 and E17 §11a must change** to say 'uses ENG-11's `sortDrill` surface'"); ENG-12 owns E16's fact-chip form (`:839-`); ENG-13 owns E14's privacy panel (`:869-`). This is known issue #5, confirmed not referenced.
- **Fix:** update E14 §3/§11 to cite ENG-11 (`sortDrill`) and ENG-13 (privacy panel), E15 §3/§11 to cite ENG-11, E16 §3/§11 to cite ENG-12, E17 §3/§11a to cite ENG-11, each with the `sortDrill`/packet config key rather than "fold into engine work".

### M5. Every episode cites "ENG-09 (check-form needs)"; that packet id was repurposed and the forms need no engine packet
- **Files/sections:** `E11` §3 ("ENG-09 (check-form needs)"), and §14 of E8/E9/E10/E11/E12/E13/E14/E15/E16/E17 ("(ENG-09)").
- **Evidence:** `WRITER_BRIEF.md` packet table lists `ENG-09 = Check-form needs`, but `02_ENGINE_WORK.md` has redefined ENG-09a (choice triage kind), ENG-09b (debrief panels), ENG-09c (person kind), ENG-09d (shell/parity guards) — none is a form-building packet. `10_CHECK_FORMS.md` ("Depends on") states "**No engine packet is required**" for the forms (they come from the generator). So "ENG-09 (check-form needs)" is a dangling reference.
- **Fix:** in each §14, point at `10_CHECK_FORMS.md` for the form build (no form-building packet), and cite `ENG-09a` only where a `choice` card is actually used (E9's password cards). Reconcile the `WRITER_BRIEF.md` packet table with the engine doc's ENG-09a-d naming.

### M6. `00_README.md` still names Marrowdale Facilities for E17; E17 §5 deliberately uses built Tarrowby
- **File/section:** `00_README.md` lines 42, 87, 91, 243 vs `E17_acceptable_use.md` §5.
- **Evidence:** `00_README.md:42` "E17 acceptable use | Marrowdale Facilities (new)", `:87` "New brand rooms ... E17 (Marrowdale)", `:243` "E17 brief (Marrowdale Facilities ...)". E17 §5 explicitly rejects Marrowdale for the built Tarrowby company, room and cast "to save art", and adds no BRAND_SET entry. These contradict.
- **Fix:** update `00_README.md` to Tarrowby for E17 (company, room, cast), and drop the "new brand room (P5b) E17 (Marrowdale)" dependency, or record the Tarrowby decision as the user's. Confirm with the orchestrator which company the user wants.

### M7. E17 shell count: `00_README.md` says one shell, E17 ships two identical shells
- **File/section:** `00_README.md:48` vs `E17_acceptable_use.md` §13, §16, §20.
- **Evidence:** `00_README.md:48` "E17 default taken: ... it ships **one shell**, `awareness_e17_<slug>_defend` (variant defendOnly), and that one shell joins both courses." E17 §13 ships **two** shells with identical content (a `full` and a `defendOnly`), to honour "both versions" literally. This is known issue #8, unresolved.
- **Fix (recommendation):** ship **one** defend-only shell, aligning E17 to the user default already recorded in `00_README.md:48`; two byte-identical shells add a second global prefix and a maintenance trap for no learner benefit, and "both courses list the same one shell" is a seeding choice (E17 §20 already offers this). Update E17 §13/§16/§17 to one shell, or, if the user prefers two, update `00_README.md:48`.

---

## Minor

### m1. E8/E9/E10 treat new channel tells as an ENG-08 shared-library requirement; the validator already accepts scenario-local tells
- **Files/sections:** `E08` §3/§11/§19, `E09` §3/§11, `E10` §3/§11/§19.
- **Evidence:** `scripts/validate_social/triage.rb:217` accepts a `channelTells` id when it is in the library **or** when `flagChips` gives it a label and it is not a factor ("a scenario-local tell is allowed when the set gives it a chip label"). E12-E17 use this route. So `unexpected_sent_item`, `unrequested_reset`, `ransomware_note`, `mfa_number_relay`, `fake_check_paste` etc. do not strictly need an ENG-08 library add to validate.
- **Nuance that justifies the library route in some cases:** `10_CHECK_FORMS.md` ("Parity audit" step 5) builds the new forms from **00-library flags only**. So any tell that must be **scored in a check form** (e.g. E8's account-takeover signs, E13's `deepfake_request`/`hidden_instruction` if they feed `general_v2`/`data_conduct`) does need the library (ENG-08). A tell used only in an episode defend set can be scenario-local with a `flagChips` label.
- **Fix:** in E8/E9/E10, state the two routes and the rule (scenario-local + `flagChips` unless the tell is scored in a form, then ENG-08 library). Keep `ransomware_note` on the library route (recurs in E13), as E8 §20.3 already reasons.

### m2. E12 frames ENG-08 accepting its four tells as a hard blocker; they are scenario-local with flagChips
- **File/section:** `E12_visitor_and_tailgater.md` §3, §11, §19 ("Stop and ask if ENG-08 will not accept scenario-local tell ids").
- **Evidence:** same as m1 (`triage.rb:217`). E12 already supplies the canonical strings for `tailgating`, `no_escort`, `uniform_pretext`, `not_expected`; those become the `flagChips` labels. No library change is needed for E12 to validate.
- **Fix:** reframe E12 §11/§19 as "declare the four tells with `flagChips` labels on the set"; drop the ENG-08 blocker framing for the tells (ENG-08 is still needed for the `world` block and the lobby room).

### m3. E10 leaves the three-way browser verdict open; ENG-03a has decided it is a label change
- **File/section:** `E10_downloads_and_fake_checks.md` §11, §19.
- **Evidence:** ENG-03a (`02_ENGINE_WORK.md:217, 229`) decides: a `triageSet.verdictLabels` **label change** (Trust->"Carry on", Report->"Close and report", Delete->"Go the trusted way"), verdict ids and `awareness` scoring unchanged. E10 §11/§19 still present "relabel or add a verdict ... no decision taken".
- **Fix:** update E10 §11/§19 to state the decision (`verdictLabels`, label change, ids unchanged), and drop the §19 stop-and-ask on it.

### m4. E13 drops `osint` but does not state the ENG-08 stage-order relaxation it needs
- **File/section:** `E13_ai_assistant.md` §3 (ENG-08 line), §7.
- **Evidence:** E13's full stages `["brief","write","flip","defend","debrief"]` have no `osint`. The current lint (`awareness.rb:157` `stage_orders`) requires `osint` and `write`; it would reject this. ENG-08 (`02_ENGINE_WORK.md:563`) does add the order `brief write flip defend debrief` for E13, but E13 §3's ENG-08 dependency only mentions tells and label fields, not the stage-order relaxation. (Known issue #10, E13 half.)
- **Fix:** add to E13 §3 that ENG-08 must add the `brief write flip defend debrief` (osint-optional) order. (E12's half of #10 is clean: E12's stages are exactly the built `want`, so they pass the lint with no relaxation.)

### m5. 11 Part A (core_00) routes its engine gaps to "02_ENGINE_WORK.md" but never names ENG-10
- **File/section:** `11_WP12_FIRST_PLAY_AND_ANNUAL.md` Part A ("Completing the mission", "Engine gaps to flag").
- **Evidence:** `grep` finds no `ENG-10` in the file. ENG-10 (`02_ENGINE_WORK.md:740-764`) exists and covers exactly core_00 (the `["brief"]` validator allowance, `doneGlobal`, the multi-card brief, once-per-learner). Known issue #13 asks that 11 point at ENG-10.
- **Fix:** name ENG-10 in 11 Part A's completion and engine-gaps paragraphs; note ENG-10 is the clean path (option 2) and that `["brief"]` needs ENG-10's validator allowance even for the stopgap.

### m6. Host first-name near-clash Tomasz (E11) vs Tomás (E14) is flagged but unresolved
- **Files/sections:** `E11` §5/§20, `E14` §5/§20.
- **Evidence:** E11 host Tomasz Wiśniewski, E14 host Tomás Carvalho (built E4 cast). Both specs raise the near-collision as an open question but neither resolves it; `BRAND_SET.md` already renamed for the Moyo and Dev clashes. Known issue #9.
- **Fix:** the orchestrator should decide: if E11 and E14 can co-occur in one course, rename one first name (keep the module-sourced surnames). Note Oskar-vs-Dani (the other half of #9) is correctly resolved in E14 §5 (Oskar stays a Brackenmoor client, Dani is the new internal subject).

### m7. Em dashes in titles and prose (no em/en dashes rule)
- **Files/sections:** titles L1 of `E11`, `E14`, `E15`, `E16`, `E17`; `E11` L124 (table cell "—"); `E15` L173; `E16` L220; `02_ENGINE_WORK.md` L189, 787, 788, 789.
- **Evidence:** `WRITER_BRIEF.md` "No em or en dashes." `python3` count: E11 em=2, E14 em=1, E15 em=2, E16 em=2, E17 em=1, 02 em=4; none inside quoted code or built strings. (The `->`/arrow glyphs in E12/E13 are U+2192/U+2194, not dashes, and are fine.) Known issue #11, confirmed.
- **Fix:** replace em dashes with a comma, colon or "to"; in the E11 table cell use an empty cell or "n/a".

---

## Trivial

### t1. E8 miscites which voicemail is Ayaan's
- **File/section:** `E08_after_the_click.md` §5.
- **Evidence:** E8 says Ayaan Warsame is "the genuine caller `ha_vm_locked` in `e3/defend.json`". `e3/defend.json:23` shows `ha_vm_locked` is Hana Novak; Ayaan is `hb_vm_locked`. (Ayaan Warsame is genuinely built cast and genuinely the E5 flip-line victim, both confirmed in `e5/defend.json:6` and `e3/defend.json:4`, so the choice stands; only the id is wrong.)
- **Fix:** cite `hb_vm_locked`, not `ha_vm_locked`.

### t2. E8 introduces an unregistered Quayholt IT mailbox
- **File/section:** `E08_after_the_click.md` §11 rows 2 and 6 (`it-notices@quayholt.example`).
- **Evidence:** the attack half uses the built service-desk address `it-servicedesk@quayholt.example` (from E5), while the defend set introduces a second genuine IT address `it-notices@quayholt.example`. The E5 real-host set (`e5/defend.json` `_brandAdditions`; E10 §5) is `sso.`, `servicedesk.`, `intranet.`, `mail.quayholt.example`; `it-notices` is not among them. Low-stakes (a mailbox, not a host), but two genuine IT senders in one episode risk confusing the learner.
- **Fix:** reuse `it-servicedesk@quayholt.example` for the genuine IT notices, or add `it-notices` to the E8 `_brandAdditions` note so the brand set stays the source of truth.

---

## Confirmed-clean (known issues that check out)
- **#2 (stage ids):** E11/E15/E16 use `mistake` (not `sandbox`), matching ENG-04; ENG-05a is a `world` modifier on the call `write` stage, not a new stage (E12 §7 correct); ENG-06 runs in the flip region (E13 §7 correct). E12's stage list is exactly the built `want`, so it passes the lint with no relaxation (the E12 half of #10 is a non-issue).
- **#7 (seeded courses):** `10_CHECK_FORMS.md` ("Which seeded course") says the new checks join **neither** seeded course, consistent with `00_README.md` (courses carry episodes, not checks) and FUN_DECISIONS q_aw7. Clean.
- **#12 (Leila Nassar reuse):** E10 §5 reuses built Quayholt IT agent Leila Nassar and addresses the E3-phone-NPC overlap (and avoids the clashing pool name Owain Jenkins). Acceptable.
- **Tone, safety, timing, no-blame:** all ten episodes hold ~15 minutes with ~6 defend items and a mirror pair; attack content stays at templates/pretexts/psychology (no payloads, no tooling); every domain is `.example`; the shared rule of thumb is quoted verbatim and is byte-identical to `awareness_deploy.AWARENESS_RULE_OF_THUMB_TEXT`. E16's tone rules (no surveillance framing, support alongside every grievance mention) are explicit and sound. No real brand names found in the specs.
- **E16 consequence flip:** not in `WRITER_BRIEF.md`'s verbatim "Shape" enumeration (which named only E11 and E15), but `00_README.md:45` and ENG-04 (`02_ENGINE_WORK.md:284`) both include E16 as a consequence flip grounded in `core_14/game_design.md`. Consistent within the implementation docs; no action beyond noting the overview's topic-boundary table (`00_COURSE_OVERVIEW.md:72`) lists only core_05/06/16, not core_13/14, for the flip, which the user has effectively overruled.

---

## Verdict
not clean
