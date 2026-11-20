# R2 content review (round 2, adversarial)

Reviewer: fresh adversarial content lens. Scope: `episodes/E08`..`E17`, `10_CHECK_FORMS.md`,
`11_WP12_FIRST_PLAY_AND_ANNUAL.md`, `12_WP15_CORE02_ITEMS.md`, `13_WP02_REPORTING_ROUTE.md`, read
against the built fragments (`planning_notes/phishing_and_social_engineering/awareness/e*/`), the built
scenarios, the engine (`public/break_escape/js/...`), the validators, `02_ENGINE_WORK.md` (as the
engine-shape authority, not for editing), `BRAND_SET.md`, the module `concepts.md`, `00_COURSE_OVERVIEW.md`
and `reviews/REVIEW_LOG.md` (round 1 rulings, fixes and round 2 known items).

**Headline.** The round 1 fixes landed well. Every B and M from R1_content is resolved: E8's flip is
now ENG-01's `flipAftermath`/`stepLabels`, the check-form scheme is the two shared pairs with `10` as
their single home, E9's attack stage is `guess` with the password cards on ENG-09a, the concept-panel
packet (ENG-09b) and the drill packets (ENG-11/12/13) are cited, the dangling `ENG-09` references are
gone, E17 ships one defend-only shell, and the Tomasz/Tomás clash is resolved by moving E14's host to
the built Julian Sallow. No per-topic check forms survive. Every engine key the specs cite exists in
`02_ENGINE_WORK.md` with a matching shape, and the load-bearing code citations I spot-checked are
correct. The remaining defects are small: one ruling-8 regression that `10` already states correctly but
E10 contradicts itself on, and the three round 2 known items, which are confirmed and still open.

Severity key: **B** blocker, **M** major, **m** minor, **t** trivial.

---

## Major

### M1. E10 §15 still seeds through `awareness_deploy.py`; this contradicts ruling 8 and E10's own §13
- **File/section:** `episodes/E10_downloads_and_fake_checks.md` §15 (the "Files to create or change"
  list), line "The two seeded Hacktivity courses, through `awareness_deploy.py` (feature level only)."
- **Evidence:** Round 1 ruling 8 puts the single seeding procedure in `01_PIPELINE.md` P12 and states
  `awareness_deploy.py` "only holds the rule of thumb" and "is not the seed path". Every other episode
  spec was updated accordingly (E8 §15, E9 §15, E11 §13, E12 §15, E14 §13, E15 §13, E16 §13, E17 §13),
  and E10's own §13 already says "follow `01_PIPELINE.md` P12 for seeding; do not use
  `awareness_deploy.py`, Round 1 ruling 8". So E10 contradicts itself: §13 routes seeding through P12,
  §15 routes it through `awareness_deploy.py`. The R1 fixer's note for E8-E10 claims "§15 seeding points
  to P12", but that edit was applied to E8 only, not to E10. A fresh implementer reading §15 (the
  authoritative wiring list) would try to seed courses through a script that cannot seed courses.
- **Fix:** change E10 §15 to "The two seeded Hacktivity courses: add E10 (full) and E10 (defend-only)
  following `01_PIPELINE.md` P12 (Round 1 ruling 8); do not use `awareness_deploy.py`.", matching E8 §15
  and E10's own §13.

---

## Minor

### m1. Round 2 known item 1 is still open: the ENG-08 tell table in `02` gives reasons that the built/authored content contradicts
- **File/section:** `02_ENGINE_WORK.md` ENG-08 tell table (lines ~629-635), with cross-references in
  `episodes/E08` §3/§11, `E09` §11, `E10` §3/§11 and `E13` §3/§14. (`02` is owned by the engine fixer,
  not editable here, but the inaccuracy is a cross-document content-consistency problem and is listed as
  a round 2 known item to confirm.)
- **Evidence (confirmed against `10` and the code):**
  - `ransomware_note` (line 631) is listed "E8 (defend), E13 (defend) ... two sets use it". **E13 does
    not use `ransomware_note`**: E13's scenario-local tells are `hidden_instruction` and
    `deepfake_request` (`E13` §11). So only E8 uses it; the "two sets" justification is false.
  - `fake_check_paste` / `fake_update_prompt` / `dangerous_download` (lines 633-635) are justified as
    shared because `general_v2` item 2 / item 8 score them. **`10`'s `general_v2` item 2 scores
    `lookalike_domain` + `padlock_myth` on the built page shape, and item 8 scores `senderTrust` +
    `reply_to_differs`** (`10` §"Item list: general_v2"). Neither scores the three web tells; `general_v2`
    does not score them today. E10 §14 itself says exactly this.
  - `unexpected_sent_item` / `unrequested_reset` (lines 629-630) are classed shared "scored in a check
    form as well as E8", but `10`'s `general_v2` carries no sent-item or reset item, and E8 §14 states
    its reset/sent-item signs "stay defend-set items only for now".
  - `mfa_number_relay` (line 632) is justified "two sets (E3 and E9) use the read-back-a-number lever",
    but `mfa_number_relay` is **not** in the current shared library (`CHANNEL_TELLS` in
    `phish-rules.js` / `triage.rb`), so the already-shipped E3 does not score it; only E9 would. E9
    §3/§11's "belongs in the shared library ... because E3 and E9 both use it" rests on the same shaky
    reason.
- **Impact:** low. The classification "shared" is append-only and harmless: every spec validates either
  way (a scenario-local tell with a `flagChips` label is accepted by `triage.rb:217`, and `10` scores
  no tell outside the library, so no check form depends on these additions). The defect is only the
  inaccurate reason columns, which could mislead an implementer into either dropping a shared id the
  specs assume, or editing the shipped E3 defend set to add `mfa_number_relay` (a change to a measured
  baseline).
- **Fix (for the 02 fixer):** correct the reason columns to match `10` and the code: reclassify
  `ransomware_note` as E8-only (still fine to keep shared, note it is a single-set pre-registration),
  drop the "general_v2 scores them" claim from `fake_check_paste` / `fake_update_prompt` /
  `dangerous_download` and `unexpected_sent_item` / `unrequested_reset` (keep them as forward-looking
  pre-registrations that `general_v2` *may* adopt), and for `mfa_number_relay` say only E9 scores it
  today and that built E3 is not edited. No change is needed to E8/E9/E10/E13/`10`, which validate as
  written; a one-line pointer in E9 §11 that `mfa_number_relay` could equally be E9-scenario-local would
  reduce the overclaim.

### m2. Round 2 known item 2 is still open: the "Fenwick" surname collides across E8 and E14
- **File/section:** `episodes/E08_after_the_click.md` §10/§11/§15 (`claims-client@fenwick-brandt.example`)
  and `episodes/E14_social_media.md` §5 (OSINT subject **Dani Fenwick**, `dani.fenwick@merrinsallow.example`).
- **Evidence:** E8's account-takeover flip (`flipAftermath.items[0]`) and defend row 1 both send to a
  one-off client firm `fenwick-brandt.example`; E14's scored subject is a junior architect **Dani
  Fenwick**. A learner who plays both meets "Fenwick" as a client firm in one episode and as a named
  colleague in another. E14 §5 asserts "'Fenwick' had no repo hits (2026-10-27)", but the surname is
  already in the repo as **Arthur Fenwick** (`modules/sector_01_healthcare/game_design.md`,
  `03_WORLD_AND_CAST.md`), so the clash check is inaccurate even before E8 is counted. Neither file was
  changed in round 2 (the known item asks that one be renamed).
- **Fix:** rename one. The cheapest is E8's throwaway client firm (it carries no cast and is used only as
  the sent-item recipient): change `fenwick-brandt.example` to a surname that hits nothing (web-search
  it), and update the three E8 references. Then correct E14 §5's "no repo hits" line to note Arthur
  Fenwick exists in the healthcare sector module (unbuilt, so acceptable, but state it).

### m3. E9 open question 4 is stale: it reopens the check-form question ruling 1 and §14 already settled
- **File/section:** `episodes/E09_passwords.md` §20 open question 4 ("Check forms. Whether E9's password
  cards feed the general/mobile forms or a new topic form, and whether they can be scored on any existing
  check surface at all.").
- **Evidence:** the R1 fixer rewrote E9 §14 to the settled answer (E9 feeds `general_v2`; the `choice`
  password cards are an episode surface and are not carried into a form) per ruling 1, and removed the
  "new topic form" hedge from §14. Open question 4 was left behind and still frames this as unresolved,
  contradicting §14. (E9's other open questions were correctly updated; only #4 is stale.)
- **Fix:** delete open question 4, or replace it with a one-line "Resolved in Round 1: E9 feeds
  `general_v2` (§14); the `choice` password cards are an episode surface, not a check-form item", as the
  other resolved questions are marked.

---

## Trivial

### t1. Round 2 known item 3: E12 adds two new art-bearing M&S NPCs; E14's Julian Sallow is clean and art-ready
- **File/section:** `episodes/E12_visitor_and_tailgater.md` §5 (Delphine Arvanitis, Lorna Easton);
  `episodes/E14_social_media.md` §5 (Julian Sallow).
- **Evidence:** Julian Sallow is confirmed built E4 cast (`awareness/e4/defend.json` `_brandAdditions`:
  "co-founding partner, 60s, Black British of Jamaican heritage ... hosts the BA check pair"), so E14
  reusing him as host adds no art and clashes with nothing, exactly as E14 §5 claims. Known item 3 for
  Julian checks out. For E12, however, both front-of-house NPCs are **new** M&S cast: Delphine Arvanitis
  (lobby pretext mark, needs a person-chat portrait) and Lorna Easton (studio kiosk host, needs a host
  sprite and talk portrait), on top of the hi-vis courier costume sprite and the new lobby map. That is a
  real art load behind the PixelLab queue; the spec acknowledges placeholder sprites but does not tally
  the cost. Clash checks pass ("Easton"/"Lorna" zero hits claimed; "Arvanitis"/"Delphine" no conflicting
  hits).
- **Fix:** note in E12 §5 (or to the orchestrator) that E12 needs two new M&S character art sets plus the
  costume and lobby, so the art budget is larger than a one-NPC episode; no name change needed.

### t2. E13 §15 seeding line does not cite P12 (minor inconsistency, not a wrong path)
- **File/section:** `episodes/E13_ai_assistant.md` §15 ("Hacktivity course seeds: add both shells to the
  defend-only and both-versions courses.") and §13 ("Joins both seeded Hacktivity courses
  (`WRITER_BRIEF.md`)").
- **Evidence:** every other episode cites `01_PIPELINE.md` P12 as the seeding home (ruling 8); E13 names
  neither P12 nor `awareness_deploy.py`. It is not wrong (it points at no rejected path), just less
  explicit than its siblings.
- **Fix:** add "following `01_PIPELINE.md` P12 (ruling 8)" to E13 §15, for parity with E8-E17.

---

## R1 findings verified fixed / not fixed

Fixed (verified against the files and, where relevant, the code):
- **B1 (E8 flip config):** fixed. E8 §10 authors `flipAftermath` (inline `items[]`, `heading`,
  `victimName`, `intro`, `line`) and `stepLabels`; the pre-ENG-01 `flip` block is gone. ENG-01 in `02`
  carries `flipAftermath`/`stepLabels`/`victimName` with the matching shape.
- **B2 (check-form scheme):** fixed. All ten episodes' §14 feed `general_v2` or `data_conduct`; `10` is
  the single home; per-topic forms are dropped everywhere (grep confirms every remaining mention is a
  negation). The per-topic/pre-post trade-off is stated.
- **M1 (E9 `guess` stage):** fixed. E9 §7 uses the `guess` stage, not `build`; config matches ENG-02.
- **M2 (E9 password cards / defend-only on ENG-09a):** fixed. §11 rows 4-7 cite ENG-09a; §7/§13 say the
  defend-only variant needs ENG-09a, not ENG-02.
- **M3 (concept panels ENG-09b):** fixed. E8/E9/E10 §3+§12 cite ENG-09b's array form; E13 §12 correctly
  notes its single panel needs no ENG-09b.
- **M4 (drills ENG-11/12/13):** fixed. E14 cites ENG-11 `sortDrill` + ENG-13 `privacyPanel`; E15 ENG-11;
  E16 ENG-12 `concernForm`; E17 ENG-11. All four shapes exist in `02` with matching fields.
- **M5 (dangling ENG-09 check-form dependency):** fixed. No episode §3/§14 cites "ENG-09 (check-form
  needs)"; all point at `10`.
- **M6 (00 names Marrowdale for E17):** owned by `00_README.md` (engine fixer); not in this review's file
  set. The E17-side is correct: E17 §5 uses built Tarrowby, adds no BRAND_SET entry.
- **M7 (E17 shell count):** fixed. E17 §13 ships one defend-only shell listed in both courses.
- **m1 (scenario-local vs shared tells):** addressed. E10 §11 splits the five web tells shared/local; E8
  §11 and E9 §11 declare their tells; the form-scored-needs-library rule is stated in `10`. (See m1 above
  for the residual reason-column inaccuracy in `02`.)
- **m2 (E12 tells framed as a blocker):** fixed. E12 §11/§17/§19 declare the four tells with `flagChips`
  labels, no library change; ENG-08 is cited only for the `world` block and lobby room.
- **m3 (E10 three-way verdict):** fixed. E10 §11 states the `verdictLabels` relabel decision; the §19
  stop-and-ask is reframed.
- **m4 (E13 osint-drop stage order):** fixed. E13 §3/§7 state ENG-08 adds `brief write flip defend
  debrief`.
- **m5 (11 Part A names ENG-10):** fixed. 11 Part A routes completion, the multi-card brief,
  once-per-learner and the `["brief"]` validator allowance through ENG-10 throughout.
- **m6 (Tomasz vs Tomás):** fixed via ruling 7. E14 hosts with Julian Sallow; E11 keeps Tomasz
  Wiśniewski; verified Julian is built E4 cast.
- **m7 (em/en dashes):** fixed. Zero em/en dashes across all fourteen in-scope files.
- **t1 (E8 `ha_vm_locked` miscite):** fixed. E8 §5 now names `hb_vm_locked` for Reuben Ofori and
  `ha_vm_locked` for Hana Novak.
- **t2 (E8 `it-notices` mailbox):** fixed. E8 §11 rows 2 and 6 use the built
  `it-servicedesk@quayholt.example`.

Not fixed / still open:
- **Round 2 known item 1** (ENG-08 tell-table reasons): open — see m1.
- **Round 2 known item 2** (Fenwick collision): open — see m2.
- **Round 2 known item 3** (Julian Sallow / E12 NPCs): Julian is clean and art-ready; E12's two new NPCs
  carry an unstated art cost — see t1.
- **E10 §15 seeding** (ruling 8): not fully applied — see M1 (this is the one that should block a clean
  verdict).

## Spot-checks that passed (no finding)
- Every ENG key the specs use (`flipAftermath`, `stepLabels`, `victimName`, `guess`/`patternSlots`/
  `reuseStep`/`landedGlobal`, `mistake`/`flipMontageByChoice`/`flip.mode`/`mistakeChoices`,
  `sortDrill`/`bins`/`scored`/`answerKeyProfile`/`alwaysScoresBin`/`drawRules`/`locked`, `privacyPanel`/
  `closesFacts`, `concernForm`/`factChips`/`conclusionChips`, `verdictLabels`, `briefCards`/`doneGlobal`/
  `oncePerLearner`) exists in `02` with a matching shape.
- `10`'s PERMUTE example is genuinely disjoint: hand-verifying `new[i]=old[order[i]]` with phish authored
  at indices {1,3,5,7}, form A `[1,0,3,2,5,4,7,6,9,8]` yields phish output slots {1,3,5,7} and form B
  `[0,3,2,1,4,7,6,5,8,9]` yields {2,4,6,8}; the sets are disjoint. The doc also correctly names the old
  pair as not disjoint.
- No check item in `10` scores a tell missing from the shared library: `general_v2` scores
  `lookalike_domain`/`padlock_myth`/`unrequested_mfa_push`/`senderTrust`/`linkCredible`/`reply_to_differs`
  and `data_conduct` scores `senderTrust`/`pretextRelevant`/`secrecy_or_bypass`/`vish_callback_pressure`/
  `reply_to_differs`, all present in `CHANNEL_TELLS` / `FACTORS` today.
- No leftover per-topic check forms (every `*_form_a/b` mention is a negation stating the form does not
  exist).
- Code citations verified: `person-chat-ui.js:264` `SECURE VIDEO LINK` (E13), `npc-manager.js` video-call
  at `:910-912`/`:1100-1122` (E13), `watchCall` at `episode-runner-minigame.js:760` (E12).
- Tone, no-blame and attack-content level hold: ~15 min and ~6 defend items with a mirror pair per
  episode; E13 keeps prompt injection at concept level (hidden line shown as text, "do not teach how to
  write a prompt injection"); E12's physical pretext is non-instructional; E16's surveillance/no-blame
  rules are explicit; `.example` domains only; the shared rule of thumb is quoted verbatim.
- E17 topic-boundary and consequence-flip set match `00_COURSE_OVERVIEW.md` / ENG-04 as recorded in R1.

## Verdict

**not clean** (one Major: M1). No blockers. The single Major is a self-contradiction/ruling-8 regression
in E10 §15 that is cheap to fix. The three round 2 known items are confirmed and small (two minor, one
trivial). Everything else verified consistent with the code, the built content and the round 1 rulings.
