# REVIEW 07 — Landing-page builder — Round 1

Reviewer: subagent (read-only). Target: `designs/07_landing_page_builder.md`. Date: 2026-10-20.
Rubric: `BRIEF.md`. Cross-refs read: `README.md`, `designs/00_data_contract.md`,
`01_mail_client.md`, `04_phish_rules_engine.md`, `05_inbox_triage_defender.md`. Engine claims
verified against code.

**Severity count: Blockers 0 · Majors 3 · Minors 2**

**WEAPONISATION VERDICT: PASS — no part of this design functions as real attack tooling.**
The builder produces no runnable artifact (no HTML/CSS/JS authoring, no export, download,
copy-as-HTML, preview, or new-tab; the renderer draws shapes and text to a canvas and "builds no
HTML a browser would load", §3/§6/N3). No capture code exists: a "submit" flips a boolean and
prints a line, no field value is read, stored, sent or logged (§1, §3 step 5). No network calls;
domains are strings in JSON (§1). Domains are chosen from an authored menu, never typed (§2.3,
OQ2 default), and a load-time lint forces the reserved, non-registrable `.example` suffix (N6) so
nothing in a built page could be hosted or resolve. Brands are fictional. The look-alike / typosquat
/ homograph material is concept-level recognition teaching (naming tricks, `paypa1` vs `paypal`,
`rn` for `m`, a Cyrillic homograph shown with `\u` escapes), with an explicit "no operational
how-to" rule: it never says where or how to register, host, obtain a certificate for, or mail a page
(§1). Ranking domain tricks by tier/"effectiveness" (§4 tier table) is acceptable: it teaches *how
hard each trick is for a human to spot*, which is exactly the defender's knowledge, and the mirror
defender strings confirm that framing. The ranking confers no capability — the player picks from a
fixed authored menu and cannot generate a novel look-alike. See F1 for a narrow safety-enforcement
gap that does not rise to a blocker (the smuggled string would be non-registrable `.example`).

---

## Findings

### F1 — Major — The `.example` lint does not enforce the "fictional brands only" safety rule it is credited with

§1 (lines 32–34) states: "every domain ends in a reserved, non-registrable suffix (`.example`). A
load-time lint rejects any authored domain that does not, **so a scenario cannot smuggle in a real
name**." That is a non-sequitur. Ending in `.example` does nothing to prevent a real brand name in
the label: `paypal.example`, `paypa1.example` or `natwest-login.example` all pass the `.example`
suffix lint (N6 only checks the suffix and non-empty strings). The design's own safety bullet keeps
real services to "a plain-text concept card" only, but nothing enforces that for the live
**domain-option** menu an author fills in. A scenario could place a real-brand look-alike in the
builder itself, contradicting "Fictional only".

This is not a Blocker: a `.example` domain is non-registrable (RFC 2606) and cannot be hosted or
resolve, so no attack capability leaks. It is Major because the doc asserts a safety guarantee the
described mechanism does not deliver, and the "brands fictional" rule is author-discipline, not a
lint.

Fix: either (a) extend the N6 lint with a real-brand/real-domain denylist (and state it checks the
whole string, not just the suffix), or (b) correct §1 to say the `.example` rule prevents
*registrable* domains, and that fictional-brand selection is an authoring convention the validator
does not enforce — then decide whether that is acceptable. Recommend (a) given this is the
highest-risk doc in the suite.

### F2 — Major — Defender habit 1 (URL reading) is factually wrong for `.co.uk`-style suffixes

§3 step 6, habit 1 (line 112): "the last two parts of the name before [the first slash]
(`paystream.example`) are who you are talking to." The "last two labels" rule is only correct for
single-label public suffixes (`.com`, `.example`). It is wrong for multi-label suffixes such as
`.co.uk`, `.gov.uk`, `.org.uk`: for `login.natwest.co.uk` the last two parts are `co.uk`, which is
**not** "who you are talking to" — the organisation is `natwest.co.uk` (three parts). An awareness
audience here is partly UK staff (UK English house rule), where `.co.uk` is the common case, so this
is the single defender takeaway a student is most likely to carry away wrong, and it would misfire
on the most familiar domains.

Fix: reword to the registrable-domain concept, kept plain for non-technical learners — e.g. "The
site's real name sits immediately to the left of the first single `/`. Read leftward to the ending
(`.com`, or a country ending like `.co.uk`): the one name just before that ending is who you're
talking to." The §4 defender string "Read it from the right" is fine; it is the "last two parts"
count that is wrong.

### F3 — Major — Worked example and authored data contradict the single-source data contract (00): the landing-page path belongs to Sofia Lord, not Melanie Pierce

The §4 worked example and the §5 JSON build the landing page for **Melanie Pierce** against a
**PayStream payslip** portal (`targets.pierce`, pretext "a payslip notice from PayStream"). This
conflicts with `00_data_contract.md`, which is the declared single source of truth ("if a detail
here conflicts with 01–04, this doc wins"):

- 00 §1 assigns the **link path** to the intern **Sofia Lord** (`lord` = "hard target (needs link +
  pretext)"); Pierce is the **attachment** flagship (balance sheet from Jed).
- 00 §1 intel table and §4 map: `linkCredible` is satisfied by `lord_portal` ("she uses a staff
  payroll portal") "+ a built page (07)". The portal/link intel is Lord's, not Pierce's.
- `04`'s Pierce target has required factors `senderTrust, addressedTo, pretextRelevant,
  attachmentPlausible` and **no `linkCredible`** and no `expectedLink`. A landing-page link attached
  to a Pierce email would hit a factor that is not even in her profile, so the example cannot work as
  04 describes it.
- 07 also introduces a new company brand "PayStream", where 00 §1 says "One fictional company used
  in every worked example across 01–10" (AccountingNow). This is exactly the cross-doc drift 00 was
  written to stop.

Note that PayStream (a payroll brand) actually fits **Lord's** staff payroll portal, which
reinforces that the example is pinned to the wrong target.

Fix: rebuild the §4 worked example and §5 JSON around **Sofia Lord** and her `lord_portal` staff
payroll portal, keyed by Lord's target id, consistent with 00 §1/§4 and 04's factor map. If a second
branded company is genuinely wanted for the portal, add it to 00 first and justify it there; do not
let 07 define canonical cast/brand data unilaterally.

### F4 — Minor — "Gate override replaces the verdict line" contradicts the worked example

§4 says the verdict line table has "one shown, **gate overrides replace it**". The worked example
(line 242) shows attempt 1 displaying *both* the credibility verdict `That wouldn't fool anyone.`
*and* the gate override `Melanie reads addresses. This one is too far from the real one.` Replace vs
both is ambiguous.

Fix: pick one. If both are intended (the credibility band plus the gate reason reads well), change
the rule text to "gate overrides are shown in addition to the band verdict". Minor related nit: "too
far from the real one" is odd wording for a one-letter tier-1 typo that fails only because it is
below `minDomainTier`; consider "not close enough for how carefully she reads addresses."

### F5 — Minor — Stale claim that `05` does not exist; the shared inspection contract is not reflected in `05`

§6 ("05 is not yet drafted; its side of this contract is a to-do") and OQ8 ("`05` does not exist
yet") are both out of date: `05_inbox_triage_defender.md` is a complete draft. More substantively,
05 does **not** mention `buildSuspectPage`, a landing-page inspection item, or a shared landing-page
`tells` table — 05's link handling is email link-hover / `linkCredible_fail` only. So the
"shared source of truth" contract in §6 is asserted by 07 alone and is not yet honoured on 05's
side.

Fix: correct the "not drafted" statements; raise the `buildSuspectPage` / shared-`tells` contract as
an explicit change request against 05 (it would be new engine work and a new 05 section), rather
than describing it as already agreed. Keep OQ8 but reword it as "05 exists but does not yet carry
this contract."

---

## Notes (not findings)

- Engine wiring (§6) verified accurate against code: `MinigameScene` base class
  (`framework/base-minigame.js:3`; `extends MinigameScene` matches text-file/examine/notes);
  `gameResult` inits at `base-minigame.js:12`; `minigame_completed` emit `base-minigame.js:84–108`;
  `registerScene` `minigame-manager.js:229`; `text-file` registration `index.js:160`; `startMinigame`
  `minigame-manager.js:15`; `onComplete` call `minigame-manager.js:204–206`; siem starter block
  `minigame-starters.js:655–679`; `set_global` `apply-actions.js:33`; objective `onComplete.setGlobal`
  `objectives-manager.js:754`. All correct.
- Scoring is deterministic and legible (pure `scorePage`, every factor returns a string, authored
  reachable threshold) — meets BRIEF. Worked-example arithmetic holds: attempt 1 = 34, attempt 2 =
  87, tier-3 alternative = 100; the ✓/~/✗ counts (one/three/three) match the per-factor table.
- Padlock/cert accuracy is correct (§2.7, §4 line 209, habit 2, decoy line 220): a padlock means
  transport encryption to whoever owns the domain, not legitimacy, and the ✓ string states a cert
  would show "real or not". The scorer awarding points for a shown padlock models *victim*
  reassurance, not real security, and the doc flags the gap on the defender side — acceptable;
  optionally add one line making the "points model what fools a human, not what is safe" split
  explicit.
- Cross-link to `01` is coherent: `01`'s `payloadKit` `{ kind:"link", landingPageId:"payroll_login" }`
  matches 07's id; the "display text names the brand, target is the look-alike" hover-link lesson is
  sound.
- All nine BRIEF sections are present and concrete.

---

## Verdict

**Majors remain.** No blockers; the weaponisation check passes. Three Majors to resolve: the
unenforced "fictional brands" safety claim (F1), the inaccurate `.co.uk` URL-reading habit (F2), and
the worked example built on the wrong canonical target/brand against 00 (F3). Two Minors (F4, F5).
Re-review after the fixer folds these in.
