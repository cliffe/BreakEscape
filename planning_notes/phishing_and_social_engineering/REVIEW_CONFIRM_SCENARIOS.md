# Confirmation review (closure round) — SCENARIOS cluster (10, 11, 12)

Read-only closure + alignment pass over `designs/10_lab_social_engineering.md`,
`11_awareness_product_episodes.md`, `12_safetynet_integration.md` against the fixed contract
(`designs/00_data_contract.md`), the system docs (01–07), and the live code/missions. Checks every
prior finding in `REVIEW_10_R1.md`, `REVIEW_11_R1.md`, `REVIEW_12_R1.md`, plus the specific
alignment questions in the task. Design docs not edited; nothing committed.

**Severity count (new findings this round): 0 Blocker · 0 Major · 2 Minor (+1 trivial).**

**Verdict: CLEAN.** All prior findings across 10/11/12 are closed. No new contradiction, dead end
or unbuildable gate. The two minors are documentation-sync drift (one in 10, one in 11) that do not
affect solvability.

---

## Closure list — doc 10 (`lab_social_engineering`)

Prior: 0 blockers, 2 majors, 6 minors (1 withdrawn). **All closed.**

- **M1 (Lord contradicts canon) — CLOSED.** §3 cast (`:70`) now "Sofia Lord (intern)… uses the
  staff payroll portal (`lord_portal`)… cautious about links". `:74` states ids follow 00 §1 and
  "where this doc and 00 differ, 00 wins". Stage 4 (`:181`) clones *her* payroll portal, not a
  portal she administers — the incoherence is gone. Matches 00 §1 and 04's `lord` target.
- **M2 (`urgencyCalibrated` as required gate) — CLOSED.** Stage 5 (`:214-218`) lists Lord's required
  factors as `senderTrust, addressedTo, pretextRelevant, linkCredible`; urgency is "advisory only…
  never fails a send… taught as a tell in the stage-7 triage". Matches 00 §2 and 04's lord target
  (verified: `04_phish_rules_engine.md:156` `requiredFactors` has no `urgencyCalibrated`).
- **m1 (Hampshire role) — CLOSED.** `:68` now "Chris Hampshire (Careers/HR)".
- **m2 (metadata software string) — CLOSED.** `:148` now "software 'Microsoft Excel'", matching 00
  §1 / 02.
- **m3 (`osint_done` aggregation) — CLOSED.** `:315` the `recon` aim's three `manual` tasks each
  complete via Ruth's mapping on `target_ready_<id>`, and "the aim's last task `onComplete.setGlobal`
  sets `osint_done` (nothing else sets it)". Circularity removed.
- **m4 (false ordering in diagram) — CLOSED.** Critical path (`:291`) now shows
  `[ landing_page_built AND pretext_call_done ] (parallel, either order)`.
- **m5 (attacker-side `senderAuth` advisory) — CLOSED.** Surfaced from round 1 (`:175`) and in a
  dedicated stage-5 block (`:220-224`).
- **m6 / N6 (no-`secgen_scenario` support) — CLOSED.** N6 (`:485`) marked "Resolved (R1)"; only the
  free-text `collection` label remains, as the review said.

## Closure list — doc 11 (`awareness_product_episodes`)

Prior: 0 blockers, 3 majors, 6 minors. **All closed.**

- **M1 (red-flag id library gap / overclaimed invariant) — CLOSED.** The six channel tells are now
  defined in 00 §2's "Channel tells" table with seats marked (`lookalike_domain`,
  `changed_bank_details`, `vish_callback_pressure` = both; `unexpected_qr`, `unrequested_mfa_push`,
  `smish_shortlink_urgency` = defend-only). §5.1 (`:200-206`) references that library and narrows the
  claim to "every tell that has both seats uses one id… defend-only tells… have no attacker mirror".
- **M2 (scoring clash with 05 / "unchanged" claim) — CLOSED.** §4.1 now routes triage scoring to 05
  via `scoringProfile: "awareness"` (reporting genuine mail never penalised; the lab's `analyst`
  profile keeps the small false-alarm cost). Verified 05 now carries both profiles
  (`05_inbox_triage_defender.md:154-172`, `:472`). §6.1 no longer says "unchanged" — it calls out
  "the one configuration change is 05's `scoringProfile: 'awareness'`".
- **FC-C (Chothia "team discussion drove learning") — CLOSED.** §5.3 (`:245-249`) softened to "a
  design aim plus an anecdote, not a measured finding… we borrow the idea as a hypothesis". Empathy
  lesson retained (§1 `:29-33`, §4.3 `:170`). Verified against the paper (see fact-checks).
- **FC-B (Ho 1.7% provenance) — CLOSED.** §5.2 (`:229-234`) now cites Table 2's caption as the
  primary source and drops the "secondary/unverified" caveat; the annual vs embedded arms are kept
  separate.
- **m1 (E1 item-count) — CLOSED.** E1 defend beat now "5 items (2 phish, 3 genuine)".
- **m2 (Score column = points) — CLOSED.** The table's last column now gives max points per episode
  (Max 24/28/26/…); §3.2 (`:75`) states the per-item point ceilings.
- **m3 (one-message cap wording) — CLOSED.** §3.1 (`:70`) now "one attempt producing one artefact".
- **m4 (accessibility fully deferred) — CLOSED.** §6.3 adds a "First slice (baseline)" row pulling
  core-loop keyboard play, accessible names and reduced motion into the first slice.
- **m5 (cite NCSC in culture) — CLOSED.** §4.3 (`:163-165`) now cites NCSC "Phishing attacks:
  defending your organisation" and its security-culture material (correctly flagged "to verify" on
  exact wording). Title confirmed accurate — see fact-checks.

## Closure list — doc 12 (`safetynet_integration`)

Prior: 0 blockers, 1 major, 6 minors. **All closed.**

- **M1 (remote `unlock_object` on `derek_computer` unverified) — CLOSED and verified in code.**
  §4.6/§4.1 now explicitly abandon the remote unlock of `derek_computer`: the mail-landed outcome
  fires `complete_task` (driven by `phish_derek_landed`) on `unlock_derek_computer` /
  `search_derek_computer`, and the lock itself is "Unchanged". The doc states the engine constraint
  directly. Verified: `interactions.js:33-55` — the `object_remotely_unlocked` listener walks
  `Object.values(rooms)` → loaded rooms only, sets `locked=false` only if found, else
  `console.warn('[RemoteUnlock] Object not found in loaded rooms')`. The `unlock_object` on the new
  `derek_mailbox_view` (in `it_room`, loaded) is legitimate. Fix is sound.
- **m1 (C3 wrong line cite / server-side gate) — CLOSED and verified.** C3 now cites `completeTask`
  (no client-side aim-status guard) + `revealAimForTask` and flags that
  `serverCompleteTaskWithRetry` can still reject, so the spike covers it. Verified:
  `objectives-manager.js:544` `completeTask`; `:554`-area `serverCompleteTaskWithRetry` reverts the
  task to `active` on rejection; `revealAimForTask` ~`:720` reveals a locked, non-story-gated aim
  (`search_derek_office` is `aimCompleted`-gated → not story-gated → qualifies).
- **m2 (two non-equivalent unlock mechanisms) — CLOSED.** §4.2 keeps only the `kevin_met` global path
  (`unlockCondition:{globalVariable:"kevin_met"}`) and explicitly rejects `aimCompleted:"build_the_case"`
  because it would hold the offer back past the useful point.
- **m3 (integer renumber plan) — CLOSED and verified.** §4.2 inserts `soft_entry` at order 3 and
  renumbers later aims up by one, noting it is a non-voiced, cached-audio-safe edit. Verified the
  existing aims are contiguous `order` 0–9 (ten aims) in `scenario.json.erb`, so the doc's "0-9…
  3-9 become 4-10" is accurate (R1's "0-8" was the error, now superseded).
- **m4 (post-it inside office) — CLOSED and verified.** §4.5 now lists the anniversary post-it, the
  `Derek0419` hint and the contingency plan together as "inside or behind his office, so they are
  *not* usable as readiness facts". Verified the post-it is on `derek_computer`
  (`scenario.json.erb:1873-1874`), inside Derek's office.
- **m5 (voicemail doesn't say "audit") — CLOSED and verified.** §4.2 now cites the maintenance log
  (`:1260`, "after the audit") as the public audit seed and recites the voicemail (`:1131`) as the
  unease/escalation seed. Verified in code: `:1131` voice line has no "audit" (it is "unusual access
  patterns… before I escalate"); `:1260` carries "after the audit".
- **m6 (no unique payoff) — CLOSED.** §4.6 adds the unique mechanical payoff: the phish yields
  Derek's own reminder mail pointing at the storage-closet safe ("server access details") *before*
  the office is entered, PIN withheld so the Base64 puzzle survives. No new lock, no VM claim.
- **Additive + cached-audio-safe — confirmed.** §6.2's allowed/not-allowed split holds: new aim +
  objects + `intel` data fields + text-only content + one new (unvoiced-until-approved) ink file; no
  edit to any existing voiced line, id, knot, global or NPC; `order` renumber is a non-voiced data
  edit. Flags/VM path untouched (§6.1, §8).

---

## Alignment checks requested by the task

- **10 ↔ 00 §1/§4/§5:** Aligned. Sofia Lord = intern + payroll portal (`lord_portal`); Hampshire =
  Chris Hampshire, Careers/HR; urgency advisory (not a gate); Lord gated on `linkCredible`. All four
  match 00 §1/§2 and 04's authored `lord` target.
- **10 critical path solvable with rebuilt stages 4–5:** Yes. `prepare_hard` requires both
  `landing_page_built` and `pretext_call_done` (either order) before `phish_hard` unlocks; Lord's
  `linkCredible` needs the stage-4 page; retries are free; the pretext "burned" branch un-greys the
  phone. No gate opens without an earned global/key. End-to-end solvable, no dead end.
- **10's dependency on 04's `lord` target (payslip-date / `boostIfGlobal`):** Holds, with a minor
  drift — see **NF-1**. 04 implements the payslip date as `boostIfGlobal:{ "lord_payslip_date_known":
  "pretextRelevant" }` (`04_phish_rules_engine.md:159`), i.e. a soft relax, and the `lord` target
  otherwise conforms to canon. The structural `prepare_hard` gate (not the factor) is the
  load-bearing requirement for the pretext call, so solvability is unaffected either way.
- **11 shared-tell claim narrowed to 00 §2's library:** Yes (M1 closure above). Invariant correctly
  scoped to both-seat tells; defend-only tells flagged.
- **11 selects `scoringProfile "awareness"` consistently with 05:** Yes. 05 defines the `awareness`
  profile (reporting genuine mail is a safe action, no false-alarm cost); 11 selects it and leaves
  the analyst cost to the lab. Consistent.
- **12 m01 fold-in free of remote `unlock_object`:** Yes (M1 closure above), gated on
  `phish_derek_landed` via `complete_task`. Verified against `interactions.js:33-55`,
  `objectives-manager.js` `completeTask`/`revealAimForTask`, and the cited m01 facts.

---

## New findings

### NF-1 (Minor, doc 10 ↔ 04) — payslip-date dependency is stale and mis-framed in 10
Evidence: 10 stage 5 (`:204-206`) calls the payslip release date "the missing prerequisites for
Sofia's `pretextRelevant`" and flags "(04's `lord` target should list the release date as a
**required** intel prerequisite; flagged as an authoring item for 04)". 04 has since resolved this
as a **`boostIfGlobal`** (`04_phish_rules_engine.md:159`, `lord_payslip_date_known` relaxes
`pretextRelevant`), i.e. advisory, not required. Two small drifts: (a) the "authoring item for 04"
is already done, so the flag is stale; (b) 10's global name `intel_payslip_date` (globals table
`:329`) differs from 04's `lord_payslip_date_known`, so for the boost to fire the pretext call must
set 04's name. Not solvability-affecting (the structural `prepare_hard` gate makes the call
required regardless). Fix: in 10 stage 5, reword to "the pretext call sets `lord_payslip_date_known`,
which 04 reads as a `boostIfGlobal` that relaxes `pretextRelevant` (not a hard requirement)", drop
the "authoring item for 04" flag, and reconcile the global name with 04.

### NF-2 (Minor/trivial, doc 11) — stale parenthetical in N9
Evidence: §6.1 N9 (`:285`) still reads "Check `05` carries the profile (it did not appear in my read
of 05)". 05 now carries both profiles (`05:154-172`). Fix: drop the parenthetical; N9 is satisfied.

No blockers, no majors, no new contradictions, no dead ends, no unbuildable gate.

---

## Fact-checks

- **Chothia et al. (ASE '18) — CONFIRMED (read `/home/cliffe/Downloads/ase18-paper_chothia.pdf`,
  pp.1-2).** The paper states students "universally said that the exercise raised their awareness"
  and defers evaluation ("We would like to carry out a formal assessment of our framework as a
  learning tool", Further Work) — no measured learning effect. Team discussion is stated as a design
  aim ("to encourage students to discuss phishing attacks… gain an understanding of why they work")
  and reported anecdotally ("We found discussion… to be particularly useful"). The empathy goal is
  verbatim: "counter the idea that all phishing attacks are easy to spot and that people who fall for
  them are stupid… by making students craft convincing e-mails… which they themselves might fall
  for." The E2 "email your CV to the boss" worked example matches the paper's. Doc 11's handling is
  accurate: empathy lesson kept, "team discussion drove learning" removed, no effectiveness figure
  quoted.
- **Ho et al. 2025 (IEEE S&P), 1.7% provenance — fix present; not independently re-verified.** The
  PDF is not on disk (R1 fetched it from the authors' site). Doc 11 now attributes 1.7% to the
  paper's Table 2 caption and separates the annual-training arm (no significant relationship) from
  the embedded arm (1.7% absolute). The R1 reviewer verified this against the primary text; no reason
  found to doubt it. Study parameters stated (8-month RCT, ten campaigns, ~19,500 employees, control
  groups, <30s on embedded pages) are internally consistent with R1's reading.
- **NCSC title — CONFIRMED (web search).** The guidance is titled exactly "Phishing attacks:
  defending your organisation" (ncsc.gov.uk/guidance/phishing, also /phishing). The document's
  layered-mitigation structure, DMARC advice, and the line that "no training package… can teach
  users to spot every phishing attempt" are current. NCSC's position against punishing users and
  against poorly-handled simulations, and the report-rate-over-click-rate stance, align with doc 11
  §4.3's no-blame / reporting-is-a-win grounding (corroborated by secondary coverage of NCSC's
  guidance). Doc 11 cites the title correctly and sensibly keeps a "to verify" flag on exact quoted
  wording, which it does not actually quote — so the citation is accurate at the level claimed.

Sources:
- https://www.ncsc.gov.uk/guidance/phishing
- https://www.ncsc.gov.uk/phishing
- Chothia, Paiu, Oultram, "Phishing Attacks: Learning by Doing", ASE '18 (local PDF).
