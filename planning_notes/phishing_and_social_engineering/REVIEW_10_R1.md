# REVIEW — 10 `lab_social_engineering`, Round 1

Read-only design review against `BRIEF.md`, `README.md`, `designs/00_data_contract.md` (canon) and
the component docs 01–07. Engine claims checked in code. Doc not edited.

**Severity count: 0 blockers · 2 majors · 6 minors (1 withdrawn).**

Verdict: **majors remain.** The design is sound, buildable, solvable end-to-end, and faithful to the
book and the brief. Two majors must be folded before build: a cast/canon conflict on "Lord" that
propagates into the landing-page and pretext stages, and a security-accuracy regression where
`urgencyCalibrated` is used as a required landing gate (00 §2 explicitly forbids this). Everything
else is polish.

---

## What is right (verified, not findings)

- **VM-less mission is supported in code.** N6's worry is resolved. `break_escape_missions.secgen_scenario`
  is a nullable string (`db/migrate/20251125000001_add_metadata_to_break_escape_missions.rb`);
  `Mission#requires_vms?` is just `secgen_scenario.present?` and `valid_vm_sets_for_user` returns `[]`
  when false (`app/models/break_escape/mission.rb:94-107`). `collection` is free text (default
  `'default'`), and several shipping missions already run with no `secgen_scenario` and a non-`vm_labs`
  collection (`chat_minigame_demo` → `testing`, `lockpick_gauntlet` → `training`). The browser engine
  (`public/break_escape/js`) never references `secgen_scenario`/`vm_object` at all. So a
  `collection: "phishing_social_engineering"` mission with no `secgen_scenario`/`vm_object`/`flags`
  block is fine; `vm_labs` would indeed be wrong, as the doc says. No stray VM/SecGen assumption found.
- **Gating/engine wiring is real.** `set_global` + `global_variable_changed:<key>` emit at
  `apply-actions.js:33-43`; `give_item` at `apply-actions.js:92`; task `onComplete.setGlobal`
  (with broadcast + change event) in `objectives-manager.js`; `unlockCondition.aimCompleted` gates on
  `status === 'completed'` (`objectives-manager.js:691`); eventMappings keyed on
  `global_variable_changed:*` are the standard bridge. The key-lock + `#give_item` sequencing the doc
  relies on is a verified pattern. N5 ("no new engine work") stands.
- **Critical path is solvable with no dead ends.** Every gate has its intel: Hampshire/Pierce/Lord
  prerequisites are all collectable in stage 2; `prepare_hard` requires both `landing_page_built` and
  `pretext_call_done`; retries are free; the pretext "caught" branch un-greys the phone. No gate opens
  without an earned key or global.
- **Header exercise is technically correct.** The three-message design (spoofed Jed: SPF fail / DKIM
  none / DMARC fail; look-alike: all pass *for the look-alike domain*; genuine-via-forwarder: SPF fail
  / DKIM pass / DMARC pass by alignment) is right and matches 05's worked example. The SPF/DKIM/DMARC
  concept panel (envelope sender vs visible From, `selector._domainkey`, SPF-*or*-DKIM-*and*-align,
  policy `none/quarantine/reject`) is accurate. "A pass is consistency, not trust" is the correct
  headline lesson.
- **Structure and completeness.** All nine brief sections present and concrete. Stage order mirrors
  the book (Ch.2 ethics → Ch.3 scope → Ch.4-6 OSINT → Ch.7 phish → Ch.8 landing → Ch.9 report →
  Ch.10-12 defend); the Ch.2 ethics gate is the first, unskippable aim. Assessment is coherent
  (outcome → recorded evidence → weight) and the weights sum to 100%. Model-don't-weaponise held
  throughout (tools concept-level; no runnable kit; landing page is a scored model only).

---

## Findings

### M1 (Major) — "Lord" contradicts canon (00 §1), and the conflict propagates into stages 4–5
Evidence: doc §3 cast (`designs/10_lab_social_engineering.md:69`) makes Lord **"IT & systems manager…
security-aware… runs the ticketing portal."** Canon 00 §1 (`designs/00_data_contract.md:29`) defines
`lord` as **Sofia Lord, Intern, `s.lord@…`**, whose discoverable intel is `lord_portal` = *"she uses a
staff payroll portal"* (00 §1 line 43). 02 already encodes this: its derive-the-pattern exercise uses
*"Sofia Lord's address is ___"* → `s.lord` (`02_osint_browser.md`). 00 is the stated single source of
truth ("this doc wins and the other is corrected").

This is not just a name. The doc builds stage 4 (clone a portal to phish Lord) and stage 5 (ticket
`SD-####`, "chasing a ticket for Lord", careers-page portal) around an **IT manager who runs the
portal** — but canon's Lord is a junior who *uses a payslip portal*. Cloning a staff portal to phish
the person who administers it is incoherent; the "security-aware checks sender and link" framing also
has no canonical backing. Doc §9 OQ7 flags the *surnames* for confirmation but misses this
role/seniority/portal conflict.

Fix: conform to 00 — keep **Sofia Lord**, and resolve the role explicitly. Either (a) keep her the
junior/intern and reframe the hard target as "new to the staff portal, but checks links" with the
clone being the **payroll/payslip portal** (`lord_portal`), or (b) if the security-aware IT-manager
framing is wanted pedagogically, change 00 §1 and 02 in the same pass (this is the harder path, since
02's pattern exercise and 03's people card join on `lord`). Pick one and align 00/02/03/04/10. Fold
into OQ7's "one pass across 03/04/10", widened to include role and portal, not only surnames.

### M2 (Major) — `urgencyCalibrated` used as a required landing gate; reintroduces the "urgency sweet spot"
Evidence: doc §3 stage 5 (`:204-209`) lists Lord's **required** factors as `senderTrust, addressedTo,
pretextRelevant, urgencyCalibrated, linkCredible`, and says *"a generic 'reset your password' with an
overdone deadline **fails** `urgencyCalibrated` and tells the student that pressure past a point is
itself a tell."* Canon 00 §2 (`designs/00_data_contract.md:65` and the dedicated note at :89-94)
**downgraded `urgencyCalibrated` to advisory / red-flag only — it "never fails a send"** and explicitly
removes "the false 'find the urgency sweet spot' lesson," because real heavy-urgency phishing still
lands. 04 §factors restates this. So doc 10 both (a) teaches a security point 00/04 deliberately
rejected as inaccurate (BRIEF: "an inaccurate security detail that a student would carry away wrong" =
major) and (b) is unbuildable as written — the engine's required-factor set cannot contain a factor
that never fails a send.

Fix: remove `urgencyCalibrated` from Lord's `requiredFactors`; list it under `advisoryFactors`. The
hard gate for Lord is `linkCredible` (needs the stage-4 page) plus `senderTrust`/`pretextRelevant`.
Keep the teaching point as **advisory** feedback ("this reads as high-pressure — a defender would clock
it"), and let the overdone-deadline lesson land properly in the stage-7 defender triage, where urgency
*is* a tell the reader uses. This also keeps the lab consistent with the §3 Hampshire/Pierce rows,
which already match 00/04.

### m1 (Minor) — Hampshire's role drifts from canon
Evidence: doc `:67` "Hampshire (office administrator)"; canon 00 §1 (`:28`) "Chris Hampshire,
Careers/HR, `careers@…`". The mechanic agrees (open careers inbox; `senderTrust` not required), but the
title differs and the first name is dropped. Fix: use "Chris Hampshire", role Careers/HR, in the §3
cast table; "reads CVs" already fits.

### m2 (Minor) — document-metadata software string conflicts with canon
Evidence: doc `:148` says the PDF metadata shows software **"Office 365"**; canon 00 §1 (`:36`) and 02
give app **"Microsoft Excel"** (02 was corrected to this in Round 1 — "fix deck metadata app string").
Fix: use "Microsoft Excel" to match 00/02, or change 00 if Office 365 is intended (it is not the
corrected value). Note the careers-page line "we use… Office 365" (`:142`) is fine as tech-stack flavour
and is a different field.

### m3 (Minor) — `osint_done` aggregation is unspecified / mildly circular
Evidence: the critical path (`:276`) and globals table (`:321`) treat `osint_done` as a gate, and the
`recon` aim "Completes on `osint_done` (all three ready)" (`:301`), while `target_ready_*` are set by
03 (`:321`). Nothing states who flips `osint_done` from the three `target_ready_*` globals — as written
the aim both produces and depends on it. Fix: state the mechanism once, e.g. the `recon` aim has three
`manual` tasks (one per `target_ready_<id>`) and its `onComplete.setGlobal` sets `osint_done`; or 03
sets `osint_done` when all three readiness globals are true. Either is a one-line clarification; the
engine supports both.

### m4 (Minor) — critical-path arrow implies an order the aim does not enforce
Evidence: §4 draws `landing_page_built -> pretext_call_done` (`:277`), but `prepare_hard` completes on
**"`pretext_call_done` and `landing_page_built`"** (`:303`) — a conjunction, not a sequence. Harmless,
but the diagram reads as a false dependency. Fix: show the two as parallel inputs to `phish_lord_landed`
(both required, either order), matching the aim.

### m5 (Minor) — attacker-side `senderAuth` advisory is never surfaced
Evidence: 00 §2 gives `senderAuth` an attack-side advisory role ("a spoof can still land with a human,
but you're told it would likely be quarantined"), the honest bridge to 01's "delivery isn't guaranteed"
and the motivation for the stage-7 header lesson. Doc 10's phish stages (3, 5) never show this advisory,
so the spoofed-From rounds don't foreshadow why SPF/DKIM/DMARC matters. Fix: in stage 3 (Hampshire's
"the From field is free text" beat) and stage 5, surface the `senderAuth` advisory line alongside the
checklist, so the attacker seat plants the question the defender seat answers.

### m6 (Minor, withdrawn) — N6 "confirm Hacktivity handles no-`secgen_scenario`"
The doc's open engine item N6 (`:471`) is already answered by code (see "What is right"): a
null `secgen_scenario` is explicitly a no-VM mission. Recorded as withdrawn — not a flaw in the design,
just an open question the code closes. The author can mark N6 resolved and keep only the `collection`
value decision (free text; any non-`vm_labs` label works).

---

## Notes (not findings)
- "Dev (service desk)" is the pretext NPC here, while 06's worked example is "Priya". That's fine — the
  scenario owns its own NPC; 06 is the engine. The pretext outputs it invents (`SD-####` ticket format,
  "Lord on a call-back rota") are new scenario intel, correctly declared as `intel_ticket_format` etc.
  in the globals table. Just make sure they land on the board (03) and are declared in `globalVariables`
  (and *not* imported), per 06 §6 / 00 §6.
- Stage 5 leans on 06's `boostIfGlobal`/`strictIfGlobal` idea (06 N9, a cross-doc hook not yet in 04),
  but doc 10 actually gates Lord structurally via the `prepare_hard` aim (both prerequisites), so it does
  not depend on that unbuilt hook. Good — keep the structural gate as the load-bearing one.
