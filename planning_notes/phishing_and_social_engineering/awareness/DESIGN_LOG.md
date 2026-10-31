# Awareness episodes: scenario-design fix log

Stage: scenario design (polish plan, awareness track). Cycle 1 fixes the findings in `DESIGN_REVIEW_C1.md`.
Fixer: Opus, resumed across the cycle. Work split across four group agents (finance/E1; HR+Exec/E2,E4; Helpdesk+General/E3,E5; Mobile+E7/E6,E7) on disjoint file sets, plus the orchestrator-level engine, README and tooling edits. Not committed by this stage.

## Cycle 1 (2026-10-22)

Orchestrator decisions carried in: B1 — design 11 is authority, score is defence only, so the attack aim completes when the write stage finishes whatever the result. m22 — pure label change, done. The runner exposes no stage-done event and the `episode_<id>_state` object global is not readable by the NPC condition evaluator, so B1 uses the attack's own completion globals (`phish_<target>_attempts > 0`; call: `pretext_<callId>_outcome !== ""`), which the engine already writes on any send / any call end.

| # | Sev | Finding (short) | Outcome |
|---|-----|-----------------|---------|
| B1 | Blocker | Full episodes scored the attack | **Fixed.** All 7 full shells: attack mapping moved from `phish_<target>_landed`/`got_it` to `phish_<target>_attempts > 0` (E3: `pretext_..._outcome !== ""`); attack task retitled for sending, not landing. README line (2838) rewritten to the defence-only contract. |
| M1 | Major | Flip blames a different person | **Fixed.** E1→Adaeze, E2→Fatima, E5→Hana Novak, E6→Kaylee in `flipDefenderLine`/`flipIntro`; E3/E4 were already right. |
| M2 | Major | Urgency advisory can never clear | **Fixed (meter to confirm in playtest).** Each mail target given a calm on-topic pretext/ask so a careful learner can clear `urgencyCalibrated`, or the factor string reworded to say the pressure is the trick. Live meter behaviour flagged for the playtest round. |
| M3 | Major | Overlapping chips cost points on look-alike sender domains | **Fixed.** Both `senderTrust` and `lookalike_domain` authored on the named items and matching check rows (finance/exec/mobile), keeping per-flag maths fair. |
| M4 | Major | Check tells rest on unseen facts | **Fixed.** Row-8 items in finance/exec/general: fact put on screen or `pretextRelevant` dropped, both forms of each pair. |
| M5 | Major | Header rows measure untaught reading + jargon | **Partially fixed.** All SPF/DKIM/DMARC jargon removed from check-form notes (plain wording, 0 files left). Teaching a "Show details" check inside the episodes is a larger content change, deferred to a later cycle. |
| M6 | Major | E5's first page is a look-alike shown before the real address is known | **Fixed.** Set brief now states Quayholt's own sites end `.quayholt.example` (full + defend-only). |
| M7 | Major | E3's push tell contradicts the scene it's in | **[Corrected 2026-10-22 cycle 2] NOT fixed in cycle 1.** The original cycle-1 row here wrongly described C1 M11 (timing) and so the push-tell fix (`e3:111,125`, `e3_defend:94`, `e3/defend.json:58`) was never made. Reopened as C2-M3 and fixed in cycle 2. |
| M8 | Major | E6 brief promises a channel choice the attack doesn't offer | **Fixed.** Both briefs now describe one email to depot staff, as Facilities, asking them to scan a code. |
| M9 | Major | E6 attack makes the fake parking notice look genuine | **Fixed.** Defend notice changed to an unannounced scheme; "staff parking is free" removed (full + defend-only, covers m11). |
| M10 | Major | E4 attack and defend describe different trips; notes cite absent OSINT | **Fixed.** Trip aligned / the "public posts" claims reconciled with the OSINT. |
| M11 | Major | E3 timing | **Deferred to playtest** (same as M7). |
| m1 | minor | E1 invoice numbers collide | **Fixed.** OSINT open invoice aligned so INV / PO no longer clash. |
| m2 | minor | E1 brief names wrong recipient | **Fixed.** Brief says Adaeze, the finance manager. |
| m3 | minor | E2 flip says defender "did what it asked" | **Fixed.** Reworded to "opened the attachment". |
| m4 | minor | E3 / helpdesk forms hand the verdict in the caller ID | **Fixed.** Caller ID no longer gives "(not on file)" away; learner compares the number against the brief. |
| m5 | minor | E3 defend intro lists only call actions | **Fixed.** Push actions added to the defend intro. |
| m6 | minor | E3 transcripts already offer the callback | **Addressed / noted.** A neutral "You" line considered; see group C report. |
| m7 | minor | E4 never introduces Yasmin | **Fixed.** Brief names Yasmin as the finance approver. |
| m8 | minor | Defend panel copy doesn't fit mixed sets | **Fixed (E4).** E4 given a `defendIntro`. E7's engine button copy ("Open the voicemail") is engine copy — logged for approval. |
| m9 | minor | E5 brief skips the email step | **Fixed.** Brief mentions sending the link. |
| m10 | minor | Conclusion screens assume the attack / defence went a certain way | **[Corrected cycle 2] Partially fixed in cycle 1.** E1, E2, E4 reworded; `e5:50` and `e6:50` were left unchanged and the new `e7:50` repeated it. Reopened as C2-m2 and finished in cycle 2. |
| m11 | minor | E6 defend-only "staff parking is free" | **Fixed** (with M9). |
| m12 | minor | E7 voice-panel heading leans to technique | **Fixed.** Uses E4's "A voice is not proof" framing. |
| m13 | minor | E7 voicemail "I'm emailing you the details now" | **Fixed.** "I've emailed you". |
| m14 | minor | E7 "in Friday's run" on a Friday | **Fixed.** "next week's run". |
| m15 | minor | E7 cross-role in name only | **Fixed.** Brief names Adaeze as payments approver. |
| m16 | minor | E7 attack fragment disagrees with the defend set | **Fixed.** Fragment aligned to the train-from-Leeds story; em dash removed; From-template fix carried back. |
| m17 | minor | "In your contacts" cue inconsistent | **Fixed.** E4/E6/E7 all use "(mobile), in your contacts" for genuine saved contacts. |
| m18 | minor | Verify not offered consistently | **Fixed.** `verifyVerdict` turned on in both finance forms and both mobile forms (episodes that teach Verify); other roles unchanged. |
| m19 | minor | Look-alike row before the real one | **Fixed.** Real-domain row ordered before the look-alike in both forms of finance/exec/general (and HR B). Pairs still parallel. |
| m20 | minor | Some form rows not parallel | **Fixed.** Reminder-only rows and row-difficulty matched across A/B; all six pairs verified parallel (n, phish count, flag multiset, verify). |
| m21 | minor | Check briefs show internal labels | **Fixed.** "(pair …, form …)" removed from all 24 check briefs (generator + shells); 0 left. |
| m22 | minor | Step strip labels | **Fixed.** `step-strip.js`: `mfa` "Approve"→"Prompts", `flip` "Flip"→"Your message". Pure label change; 45/45 episode node tests pass. |
| m23 | minor | Chip for a panel nobody can open | **Logged (engine).** Email cards always show the `senderAuth` factor chip; hiding it when `headerPanel` is off needs engine logic — proposed, not done this cycle. |
| m24 | minor | Flip may show wrong senderTrust sentence on an exact spoof | **[Corrected cycle 2] Not effective in cycle 1.** The E1 `redFlag` string was authored but never reached the flip (the replayed message carried no `factorStrings`), and E5/E6 were left as `redFlag: null`. Reopened as C2-m1; cycle 2 made the engine carry the target `factorStrings` into the flip and authored the strings on E1/E5/E6/E7. |
| m25 | minor | E5 runs long | **Deferred to playtest** (same as M7/M11). |
| m26 | minor | Monday card never reads the customer slot | **Logged (productisation).** Acceptable for the neutral skin; the customer route is a later product step. |
| m27 | minor | Defend-only shells carry dead flip copy | **Fixed.** Flip-only strings dropped from all 7 defend-only shells and all 4 generators' `defend_only()`. |
| m28 | minor | Copy reads as written to a template | **Fixed.** `flipDefenderLine`, `noBlameLine` and the `whyFine` triads varied per episode; contrast pairs turned to plain statements; the "not stupid" sense kept. |

### Counts

| Severity | In review | Fixed | Partial | Deferred to playtest | Logged (engine/product) |
|---|---:|---:|---:|---:|---:|
| Blocker | 1 | 1 | 0 | 0 | 0 |
| Major | 11 | 8 | 1 (M5) | 2 (M7, M11) | 0 |
| Minor | 28 | 24 | 0 | 1 (m25) | 3 (m23, m26, m8-E7-button) |

### Verification

- `--strict-social --no-graph --skip-ink` on all 38 awareness shells (14 episode + 24 check): **38/38 exit 0**.
- B1 greps confirm the mapping/condition/title change on all 7 full shells.
- All six check pairs verified parallel (identical message count, phish count, verify flag and flag multiset between forms A and B).
- Episode-runner node tests (step-strip/views/followups): 45/45 pass.
- Full-episode bridges (e1–e7, headless, Node 24 at `~/.cache/ms-playwright-go/1.57.0/node`, keyless server :3001): **all 7 PASS**, no bridge edits needed (e1 12/12, e2 13/13, e3 21/21, e4 13/13, e5 18/18, e6 14/14, e7 12/12). The B1 change does not touch the bridges' landing-send assertions. The bridges are scripted drives (the whole suite ran in ~1 minute, 3 concurrent), so they do not measure human-play duration; E3's and E5's 13-minute targets are unverified and stay on the playtest list.

### Open for the playtest round (next stage)

- M2 meter behaviour on an advisory fail (confirm a careful learner can clear `urgencyCalibrated`).
- M7 / M11 / m25: human-play timing of E3 and E5 against the 10–15 minute target — not measurable by the headless bridge; the 13-minute targets remain untested.
- m24 flip sentence on an exact spoof (confirm the forged-From string shows).
- M5 deferred half: whether to add an in-episode plain "Show details" item so the header-reading check items are actually taught.

## Cycle 2 (2026-10-22)

Fixes the findings in `DESIGN_REVIEW_C2.md` (6 majors, 24 minors), and corrects the three cycle-1 rows the review caught (M7, m10, m24 — annotated in the Cycle 1 table above). Engine + doc/log by the orchestrator; per-episode and per-role content by four group agents on disjoint files (finance/E1; HR+Exec/E2,E4; Helpdesk+General/E3,E5; Mobile+E7/E6,E7). Not committed by this stage beyond the group commits (34d834cb, 5c15234d, d2b1954e, f0c7824f); the README/design-11/this-log edits are uncommitted.

Two engine changes were approved and made this cycle, with Node tests:
- **Flip red-flag (C2-m1):** `resolvePlayerSent` now carries the attack target's `factorStrings` onto the replayed message, so an authored forged-From sentence reaches the flip. Harmless where none is authored; the lab passes none. Test: `test/js/social-player-sent.test.mjs`.
- **Plain header-panel labels (C2-M6, skin-scoped):** under the awareness profile/skin the panel labels its checks in plain words ("Sending server / Signature / Domain check", title "Did the domain really send this?", plain DMARC meaning) instead of SPF/DKIM/DMARC; the lab (analyst) keeps the technical names. Test: `test/js/social-header-panel-labels.test.mjs`.

### Majors

| # | Finding (short) | Outcome |
|---|-----------------|---------|
| C2-M1 | E2's best send gets "did not land" | **Fixed.** A truthful `strings.flipMissed` authored in all 7 full shells ("here is the same kind of message as it would arrive in a real inbox"), so a landed send that raised no tell no longer claims failure. E2's optional attachment-tell `playerSent` entry was not authored; `flipMissed` covers it, per the decision. |
| C2-M2 | Urgency advisory can't clear in E6; E7 repeats it | **Fixed (meter to confirm in playtest).** E6 gained a calm on-topic pretext (`pretext_qr_permit_calm`, low). E7 gained a `factorStrings.urgencyCalibrated.fail` string saying the pressure is the point. |
| C2-M3 | E3 has no consistent clock; push note contradicts the brief | **Fixed.** One clock written into the brief; the MFA push moved outside the scene and its note reworded (no more "06:52" against a desk scene); the flip's "end of a long shift" reworded; the impostor report reply now says Gordon "is at the conference and hadn't called". Full shell, defend-only and `e3/defend.json`. |
| C2-M4 | E7's attack framed as a voicemail but is an email; promises a voice tool | **Fixed** (orchestrator decision: keep E7, make it honest). Reframed as writing the email in Ravinder's name that would go with a cloned-voice call; the "voice tool reads it aloud" sentence removed; aim/task/brief/flip-intro reworded; the flip names Tom. |
| C2-M5 | E4's OSINT publishes a personal travel address, then the defend set calls one the tell | **Fixed** per the agreed recipe (the travel-address block and the defend note reconciled so the attack no longer makes the defend phish look genuine). |
| C2-M6 | Check forms measure header reading no episode teaches | **Fixed (decision logged).** The check forms stop scoring the header-panel-only tells: each role's spoof row is now a VISIBLE look-alike sender (scored on `senderTrust`/`lookalike_domain`, not `senderAuth`/`reply_to_differs`), and the genuine header-dependent row's `whyFine` was reworded to a visible reason; no scored `senderAuth`/`reply_to_differs` remain in any form (verified 0 across all 24). Reason: adding an in-episode "Show details" item would break design 11 §3.2's fixed item mixes and §7's "off (episodes)"; measuring only visible tells the episodes teach keeps pre/post fair. The engine now shows plain panel labels, so the panel that remains as context is §7-clean. `reply_to_differs`/`senderAuth` are left as unused `channelTells` chips in the forms for A/B parity (noted). |

### Minors

| # | Finding (short) | Outcome |
|---|-----------------|---------|
| C2-m1 | Forged-From sentence never reached the flip | **Fixed.** Engine change (above) + `factorStrings.senderTrust.redFlag` authored on E1, E5, E6 and E7 targets. |
| C2-m2 | Conclusion screens still assume the attack/defence went a certain way | **Fixed.** E5, E6 and E7 conclusions reworded true-on-every-path; titles unified. |
| C2-m3 | Hosts key their middle line on the attack landing | **Fixed.** All 7 host inks now key on the attempt (`phish_<target>_attempts > 0`; E3 the pretext outcome), 0 `_landed`/`reset_granted` refs left; the E1 ink header comment and README 2825 corrected. |
| C2-m4 | E1 scope note and aim name the wrong recipient | **Fixed.** Adaeze named; E2 aim/task made consistent. |
| C2-m5 | "Lookalike" names exact spoofs | **Fixed.** E1/E4/E6 objective and goal name the act ("the email in Derek's name"), not "lookalike". |
| C2-m6 | Landed replies assume the urgent pretext | **Fixed.** E4 and E5 landed replies made neutral. |
| C2-m7 | E3 neutral "You" line left a non-sequitur | **Fixed.** Jiayi offers the checks unprompted; note reworded. |
| C2-m8 | E3 pretext line texts differ from the clicked choices | **Fixed.** Spoken-choice and spec lines made identical; em dash removed. |
| C2-m9 | Defend-only panel copy: E3 skips the push; three use the "no trick" line | **Fixed.** Defend-only shells given a fitting `defendIntro`. |
| C2-m10 | Finance brief omits the Verify button | **Fixed.** Both finance forms' briefs add "or Verify (ring someone on a number you already hold)". |
| C2-m11 | The m19 swap left times out of order | **Fixed.** Finance and general row times reordered, both forms. |
| C2-m12 | Mobile forms show the look-alike QR before any real address | **Fixed.** Rows reordered / brief states Tarrowby's domain, both forms. |
| C2-m13 | Mobile forms don't use the contact convention the episodes teach | **Fixed.** "(mobile), in your contacts" / "(not in your contacts)" used, both forms. |
| C2-m14 | Only impostor callers carry "Says he's" | **Fixed.** One caller-ID form for everyone in the helpdesk forms and E3 (no "Says he's" left). |
| C2-m15 | HR form B row 8 is a sender look-alike without `senderTrust` | **Fixed.** `senderTrust` added and the A/B rows matched; pair parallel. |
| C2-m16 | Check hosts impersonated in their own forms | **Fixed.** Executive solved by changing the spoofed senders (not the hosts); general, helpdesk and mobile hosts no longer appear as spoofs in either form of their pair. |
| C2-m17 | E7's flip doesn't name its target; trade-show line remains | **Fixed.** The flip names Tom; the greeting reads "between site visits". |
| C2-m18 | Some copy reads as written to a template | **Fixed.** Host completion/middle lines and the post-check hosts' lines varied per host. |
| C2-m19 | Em dashes in learner-facing copy | **Fixed.** Removed from E2's calm ask/post/subject/reply, E3's call line and E4's post (in-world phish subject left). |
| C2-m20 | E2 Monday card quotes a phrase the episode never uses | **Fixed.** Card quotes the item's wording. |
| C2-m21 | E1 genuine Harlow invoice due-date contradiction | **Fixed.** Made an older (September) invoice. |
| C2-m22 | E1 and E3 OSINT profile set to `student` | **Fixed.** Both now `awareness`. |
| C2-m23 | Docs and tooling drift | **Fixed.** `gen_e1_shells.py` no longer re-adds `playerSentAuth` to the e1 defend-only; design 11 §4.2 updated to F=3; the cycle-1 log's M7 row corrected. |
| C2-m24 | E3's pretext phone contact has no avatar | **Deferred to the character-art agents** (an `avatar` sprite field; this stage does not touch sprite fields). |

### Counts

| Severity | In review | Fixed | Deferred (playtest/art) |
|---|---:|---:|---:|
| Major | 6 | 6 | 0 |
| Minor | 24 | 23 | 1 (m24 → art) |

### Verification (cycle 2)

- Node tests for the two engine changes pass, and the wider triage/mail/episode suites stay green (`social-triage-*`, `social-player-sent`, `social-header-panel-labels`, `social-episode-*`, `social-mail-*`, `social-*-scoring/comparison/starter/weakest` — 95 + 105 assertions).
- `--strict-social --no-graph --skip-ink` on all 38 shells: **38/38 exit 0**.
- A/B parallel re-check across all six roles: every pair identical on message count, phish count, Verify and flag multiset; **0 scored `senderAuth`/`reply_to_differs`** remain in any form.
- Grep-verified against the review's named strings: `flipMissed` in all 7 full shells; `redFlag` authored on E1/E5/E6/E7; no "voice tool reads it aloud" and no "voicemail" attack framing in E7; no "06:52"/"Says he's" where the review flagged them; host inks carry 0 `_landed`/`reset_granted` refs.
- Full-episode bridges (e1–e7, headless, Node 24, keyless :3001): **all 7 PASS** (e1 12/12, e2 13/13, e3 21/21, e4 13/13, e5 18/18, e6 14/14, e7 12/12). In the first 3-at-once batch e7 reported 10/12: a concurrency timing race (the runner advanced flip→defend before the test's flip assertion evaluated), not a content regression — e7 run on its own passes 12/12. No bridge was edited; every id a fix touched was preserved and no behaviour change was deliberate at a bridge assertion.

### Still open after cycle 2

- Playtest-round items: C2-M1 (E2 flip on a careful send), C2-M2 (E7 meter wording / E6 calm route), and the standing E3/E5 13-minute timing (C1 M11/m25) — none measurable by the headless bridge.
- C2-m24 avatar → character-art agents.
- Logged engine/product from C1 still standing: m23 (chip hide), m26 (Monday-card customer slot), E7 defend button copy.

## Cycle 3 (2026-10-22)

Fixes the three findings in `DESIGN_REVIEW_C3.md` — two latent generator drifts and the uneven "kiosk after the round" polish. All are regen-safety / consistency fixes; no learner-facing behaviour changes for current play (the committed shells were already correct, except the new kiosk lines on the six full shells).

| # | Sev | Finding (short) | Outcome |
|---|-----|-----------------|---------|
| C3-M1 | Major | `gen_e3_e5_shells.py:128` would revert the C2-M3 scene-clock fix on regen | **Fixed.** The generator's inline E3 `scenario_brief` now reads "a sign-in prompt from overnight is still on your phone", matching the committed shell and the fragment. A regen of E3 defend-only no longer reintroduces the desk-scene contradiction. |
| C3-m1 | minor | No generator emitted `"scoring": "completion"`, which all 38 missions carry | **Fixed.** `'scoring': 'completion'` added to every generator's meta (after `difficulty_level`): gen_e1 (check + defend_only), gen_e2_e4 (check + defend_only), gen_e3_e5 (check + defend_only), gen_e6_e7 (shared `meta_for`). Regen now reproduces each `mission.json` exactly. |
| C3-m2 | minor | The "kiosk after the round" `observationVariants` were on the 7 defend shells + E7 full, but not the E1–E6 full shells | **Fixed.** Added an `observationVariants` entry keyed on `episode_<id>_defend_done` to all six E1–E6 full shells (hand edit; these are not generated), matching E7 full and the defend shells, with an "…all dealt with / checked" done string. The 24 check shells were left (the learner concludes on the result screen, not the kiosk — per the review, lower value). |

### Verification

- **Regen byte-identical:** regenerated all 31 generated shells (7 defend-only + 24 checks) into scratch and diffed every `scenario.json.erb` and `mission.json` against the repo — **0 diffs** (was: E3 brief + the scoring field before the fix).
- `--strict-social --no-graph --skip-ink` on the six edited full shells: **6/6 exit 0**.
- Full-episode bridges e1–e6 (headless, Node 24, reusing the already-running keyless :3001 — no server started or stopped): **all 6 PASS**. e2 13/13, e3 21/21, e4 13/13, e5 18/18 in the batch; e1 and e6 hit the same concurrency timing race seen for e7 in cycle 2 (flip stage advances before the test's flip assertion under 3-at-once load, worsened by the active playtesters sharing :3001) and each passed 12/12 and 14/14 when re-run alone. No content regression from the kiosk `observationVariants` (post-round text, untouched by the bridges), and no bridge was edited.

### Carried forward (unchanged, not re-raised)

- Playtest-round: E3/E5 13-minute timing (C1 M11/m25), E7 urgency-meter wording / E6 calm route (C2-M2), E2's careful-send flip (C2-M1).
- Logged engine/product: m23 (chip hide), m26 (Monday-card slot), E7 defend button copy. Art: C2-m24 (Leila avatar).

## Cycle 4 data jobs (2026-10-22) — check-form parity (CHECK_PARITY_AUDIT) and E3 timing trims (TIMING_TRIM_PLAN)

Orchestrator-tasked data jobs. All check-form content edits live in the fragments (`e{1..6}/defend.json`);
the 24 check shells were regenerated and copied in, and a fresh regen is byte-identical.

### Job 1 — check-form parity

| # | Sev | Finding | Outcome |
|---|-----|---------|---------|
| B1 | Blocker | A and B shared one fixed slot order and per-slot flag signature in all six roles | **Fixed.** Added an explicit, stable `PERMUTE` reorder of each form's `messages` to every generator (seed-verified lists; new[i]=old[order[i]]). For all six roles the phish now land in different ordinal slots in A vs B and no phish flag-signature sits at the same slot. Scoring is per item, so counts/difficulty/multiset are unchanged; verified on the shells (10/10 items, matched phish count and flag multiset per role). |
| M1 | Major | Executive pos-4 gift-card trope (A) vs plausible consultant fee (B) | **Fixed.** Rewrote `ea_gift_cards` → `ea_venue_deposit` (a plausible £4,200 venue deposit, keep-it-quiet, pay-before-11) to match B's register; same three flags. |
| M2 | Major | Executive pos-8 role-plausible speaker portal (A) vs stock courier-fee smish (B) | **Fixed.** Rewrote `eb_courier_fee` → `eb_travel_portal` (a role-plausible travel-document confirm-your-sign-in link) mirroring `ea_speaker_portal`; same `linkCredible`. |
| M3 | Major | general/HR/mobile pos-4 BEC scored `secrecy_or_bypass`+`urgencyCalibrated`, not taught by E5/E2/E6 | **Fixed (orchestrator decision).** Dropped both flags from `ga_manager_signin`, `gb_it_code`, `ha_passport_scans`, `hb_bank_details`, `ma_colin_personal_number`, `mb_fatima_vouchers`, leaving `senderTrust` (taught via the seven factors); removed the now-unscored perFlagNotes. Executive (E4) keeps secrecy/urgency — its episode teaches them. |
| m4 | Minor | Finance pos-8 scored `linkCredible`, not rehearsed by E1 ("no link") | **Fixed (orchestrator decision).** Dropped `linkCredible` from `fa_invoice_share`/`fb_bank_portal`; re-scored as `senderTrust` (an unknown supplier/bank E1's lesson covers), perFlagNote reworded. No item left tell-less. |
| m1 | Minor | general pos-4 B urgency ("10 minutes or locked") sharper than A | **Fixed.** Softened `gb_it_code` to "send us the code today / by the end of the day". |
| m2 | Minor | general pos-9 genuine link in A, none in B | **Fixed.** Gave `gb_payslip_notice` a genuine HR-portal link so both forms evaluate one genuine link at pos 9. |
| m7 | Minor | A named sender both fraudster and genuine | **Part fixed, part by decision.** Finance Ravinder Sandhu kept as fraudster-in-A / genuine-in-B (orchestrator decision — a spoofed name doesn't make the real person always suspect). General Darren Price was phish (B pos4) AND genuine (B pos10) in the *same* form; repointed the genuine `gb_desk_hours` to the "Quayholt Service Desk" team address. |
| m8 | Minor | Autofill a perfect page predictor (general) | **Deferred.** Equal across A and B (audit: "parity is not harmed"); a discrimination note, not a parity fix. |
| m3 | Minor | Finance pos-4 CEO wire (A) vs voucher (B) register | **Accepted.** Both textbook; permutation also removes the "pos-4 is always the BEC" cue. |
| m5 | Minor | Helpdesk pos-4 disable-MFA (A) vs reset-and-send (B) | **Accepted.** Both authority/secrecy bypass asks within tolerance; E3 teaches them. |
| m6 | Minor | Mobile pos-4 vague favour (A) vs voucher (B) | **Accepted.** After the M3 flag drop both score only `senderTrust`; residual directness gap is minor and the permutation breaks the slot cue. |
| m9 | Minor | Helpdesk Ayaan Warsame/ext 4415 reused genuine in both forms | **Fixed.** Form-B voicemail re-cast as Reuben Ofori, ext. 4423 (unique). |

### Job 2 — E3 timing trims (data cuts only; Cuts A and C are engine, done by another agent)

| Cut | Outcome |
|-----|---------|
| D | **Done.** Dropped `e3_call_new_starter` (Chen Jiayi); E3 defend set 5→4 items. Rippled every "four calls" count to "three" across the generator (defend-only brief/endGoal/ending/kiosk/host line + mission desc), the fragment (set brief, scopeNote, `_defendOnly`, defendIntro, authoring notes) and the full erb; "same four facts" (facts, not calls) left intact. Cast notes updated (fragment `_brandAdditions`, BRAND_SET.md). **Bridge updated:** `bridge-e3-full.jsonl` assertion `total===5` → `total===4`. |
| E | **Done.** Trimmed once-read feedback keeping every tell: `e3_call_gordon_impostor` reportReply (dropped the conference-photo sentence) and its `vish_callback_pressure` perFlagNote (two clauses → one), and the push reportReply. Fragment + full erb. |
| F | **Done.** Tightened `strings.brief` (~88→~62 words, and fixed the call count), `flipDefenderLine` (73→~53) and `flipMissed` (shortened; it near-duplicated `flipNoSend`). Fragment + full erb. |

### Verification (jobs 1–2)

- Regen all 31 generated shells to scratch, diffed every `scenario.json.erb`/`mission.json`/generated `.ink` against the repo: **88/88 byte-identical**.
- Ink recompiled (E3 full + E3 defend-only): 0 failed.
- A/B parity re-checked on the shells: 10/10 items, matched phish counts and flag multiset per role; phish slots differ A↔B for all six roles.
- **Open item for the coordinator:** Cut D (4 items, an explicit orchestrator decision) trips the validator's `--strict-social` rule "an episode's defend set has 5 to 8" on `awareness_e3_helpdesk_reset` and `_defend` (the only two of 38 that fail; all others exit 0). `scripts/validate_scenario.rb` is a shared file another agent is mid-edit on, and relaxing the range is an engine/tooling change — not edited here. The coordinator should decide: relax the social-lint lower bound to 4 for awareness episodes, or revert Cut D.

## Rooms cycle 2 fixes (2026-10-27)

Fixes for `ROOMS_REVIEW_C2.md` (0 blockers, 0 majors, 4 minors, 4 trivials). Static work only: Rails could not boot during another session's rebase, so nothing was checked in game. After-renders are in `playtests/ROOMS_C2_screenshots/` with an `after_` prefix.

| Finding | Severity | Outcome |
|---|---|---|
| m1 logo font W reads as H | minor | Fixed. 5-wide W added to `LOGO_FONT` in `make_aw_props.py`; BRIGHTWELL, TARROWBY and SALLOW read correctly at 8x (`after_plates_8x.png`). The optional wide M was not needed (MERRIN reads). |
| m2 Merrin's fig alone in open floor | minor | Fixed. `planter_fig1` moved from (96, 140) to (34, 176), against the west wall below the report poster. |
| m3 Brightwell and Quayholt share chairs | minor | Fixed. Charcoal recolour of the seminar chairs (`aw_chair_{south,north,w}_charcoal1`, PIL, same sizes), registered with `register_object.py`, applied to Quayholt's seven seats plus the added east-end chair. The window was left as is. |
| m4 Tarrowby daylight from a notice board | minor | Fixed. The light moved to a rooflight at tile (4.5, 5), radius 110, intensity 0.25, in `training_room_lighting.json`, refreshed into the 12 Tarrowby shells. Needs the lit tour. |
| t1 second plate line hard to read | trivial | Fixed. Second line drawn in white on all four plates. |
| t2 Tarrowby items touch corner lines | trivial | Fixed. Notice board to x 34, hi-vis hooks to x 258. |
| t3 Brightwell back wall full | trivial | Fixed. Year planner deleted; range poster moved to x 96. Back wall reads window, range, logo, bar chart. |
| t4 stale text | trivial | Fixed. `game.js` comment says oatmeal carpet; `training_room.py` docstring no longer says "not yet imported"; HANDOVER §1 puts E7 at Brightwell; dated note added at the top of `TRAINING_ROOM_PLAN.md` that §3.2–3.5 and §10 predate C1 and C2. |

Checks: `build_aw_rooms.py --check` differed on all eight files before the rebuild and was `same` after. `check_room_walls.py`: floor at 64 on all four. `generate_rooms.py --check`: OK on all four, the same expected warning kinds. `slot_audit.py --notes` on the four defend shells and E7 full: 0 problems. `validate_scenario.rb --strict-social --no-graph --skip-ink` on all 38 shells: clean. Fragment/ERB parity test: 7 of 7. Only the 12 Tarrowby shells changed in `scenarios/`.

Still owed in game (as in the review): lit tour on the four defend shells, Tarrowby's rooflight pool, Quayholt chairs against Brightwell, fig and host head-room, walk-and-tap.

## E3 MFA decision (2026-10-27)

The E3 MFA-fatigue beat was a watch-only demo (three scripted prompts, a fixed approval at 06:50, one explanatory line). P5 flagged it (E3-11) and PUZZLE_REVIEW_C1 marked it trivial (T1). Per FUN_DECISIONS q_e3mfa the learner now makes a real choice: **when** to fire the prompts (during working hours / late evening, off the clock / the early hours) and **how many** (two or three / a dozen / one after another).

Design rules it follows:
- **Every combination lands, no dead end.** The target always approves. What changes is the explanation, not whether it works.
- **The outcome teaches which conditions made it work.** The authenticator overlay shows, after the approval, the chosen timing's `outcome` (daytime: he nearly reported it, and tapped only because the pretext call had primed him; evening: swiped away off the clock; early hours: half-asleep to stop the buzzing) and the chosen count's `note` (few lean on the pretext and the hour; a dozen becomes a nuisance; a flood is loudest and easiest to spot or rate-limit).
- **The defender's control is named** in the overlay's last line (`defenderNote`: number matching, a prompt you didn't start is a report not an Approve, a rate limit caps the flood) and again, as a static summary of the attacker's two levers and the three controls, on the flip page's `conceptPanel`.
- **Kept to about a minute.** A large count collapses to at most four cards plus a "…and N more" summary line.

Data-first where possible, with a small engine change. The decision lives in `awarenessEpisode.mfa.choice` / `pushTemplate` / `defenderNote`; the authenticator scene (`minigames/authenticator/authenticator-minigame.js`) gained a decision branch that is inert when `choice` is absent, so the scripted P7-M shape and all its tests are unchanged. `episode-model.js` forwards the new keys only when authored. The `mfa` stage-strip text was reworded from "Watch what happens" to the decision framing. Schema and the `awareness.rb` social lint now accept both shapes (scripted requires `pushes`+`approvesAt` via a draft-4 `dependencies` pair; decision requires `choice`+`pushTemplate`+`defenderNote`, two or more options each side, every option carrying its teaching copy). E3 is the only episode with an `mfa` stage.

Shared-key ripple: the `conceptPanel` edit touched the fragment (`e3/defend.json`) and the full erb; the E3 defend-only shell was regenerated from the fragment with `gen_e3_e5_shells.py` (into scratch, diffed — the only content change was that one `conceptPanel` string; copied the single `scenario.json.erb` back; no ink or dungeon_graph change).

Checks: node `test/js/social-*` + `validator-social-*` 1824/1824; new `test/js/social-authenticator-decision.test.mjs` (6 tests) and the legacy `social-authenticator.test.mjs` (9) both green; parity 7/7; `validate_scenario.rb --strict-social --no-graph --skip-ink` clean on both E3 shells and all 38 awareness shells. No live browser run yet.

## Episode length wording (2026-10-27)

User decision q_timing (FUN_DECISIONS part two): say "about 15 minutes" for a full episode, "about 16" for E6 and E7, and recommend defend-only for sessions under 30 minutes. Human timing runs stay postponed.

Applied: full-episode `mission.json` descriptions now read "An awareness episode of about 15 minutes for ..." (16 for E6 and E7), with `estimated_duration_minutes` and `durationTargetMin` set to 15 (16 for E6 and E7). Defend-only descriptions say "about 8 minutes" (the figure was already inside 6 to 8; `durationTargetMin` stays 8). The four finance checks, the only checks that stated a length, say "about 8 to 10 minutes"; their `durationTargetMin` and `estimated_duration_minutes` (4) are untouched pending the owner. `durationTargetMin` is read by no code (schema type check only), so nothing depended on the old values. The defend-only and check changes went through `gen_e1_shells.py`, `gen_e2_e4_shells.py`, `gen_e3_e5_shells.py` and `gen_e6_e7_shells.py` (scratch regen, byte-identical baseline first, only the 11 `mission.json` files copied in).

Still to do: the E3 full erb `durationTargetMin` 13 to 15 (held back while another session edits that erb); the validator warning text in `scripts/validate_social/awareness.rb` still says "13 minute episode"; the organiser guidance to prefer defend-only under 30 minutes is not yet in any description (it belongs with the aw7 organiser guidance).

## Rooms cycle 3 fixes (2026-10-27)

Fixes for `ROOMS_REVIEW_C3.md` (0 blockers, 0 majors, 2 minors, 3 trivials). Commit 1d1ccbc26. After-shots in `playtests/ROOMS_C3_screenshots/` as `after_c3_merrin.png` and `after_c3_brightwell.png`.

| Finding | Severity | Outcome |
|---|---|---|
| m1 Merrin plate reads "HERRIN &" | minor | Fixed. 5-wide M added to `LOGO_FONT` in `make_aw_props.py`; `make_aw_props.py` rerun, only `aw_logo_merrin_sallow1.png` changed. Checked at 8x, then in game: the plate reads MERRIN & SALLOW. |
| m2 Brightwell sun barely shows | minor | Waits. Needs a `window_blinds` floor tint in `training_room_lighting.json` and `apply_training_room.py --refresh`; both held back while another agent rewrites the check shells through the generators. |
| t1 Merrin fig near the chairs | trivial | Fixed. `planter_fig1` feet 176 to 166 in `build_aw_rooms.py`. In game it stands clear of the north chair row. |
| t2 Brightwell bar chart crowds plate | trivial | Fixed. `whiteboard2` x 216 to 226 in `build_aw_rooms.py`. In game the gap to the plate matches the others. |
| t3 Quayholt queue screen halo | trivial | Waits with m2: intensity 0.35 to 0.25 in `training_room_lighting.json`, then `--refresh`. |

Maps rebuilt with `build_aw_rooms.py` (Brightwell and Merrin & Sallow changed; Tarrowby and Quayholt `same`), then `--check`: all eight files `same`. `check_room_walls.py 'room_aw_*'`: floor at 64 on all four. `generate_rooms.py --check` on the four: OK, the same expected warning kinds. `slot_audit.py --notes` on the four defend shells and E7: 0 problems. `apply_training_room.py --refresh` and `training_room_lighting.json` were not touched; no scenario shells changed.

In game (keyless :3001, games 4521 Merrin via `awareness_e4_exec_whaling_defend`, 4522 Brightwell via `awareness_e1_invoice_fraud_defend`, lit only, `--check`: mode on, lit ambient `#cac4bc` and `#c4cad8`, redraw 300 ms): plate, fig and whiteboard as above. The M is the thinnest glyph on the plate at game zoom but reads as M. The POV stage can start for Merrin once the lighting items are settled or deferred.

### Rooms cycle 3 lighting items m2 and t3 (2026-10-27)

Commit aa99bbfa0. In `training_room_lighting.json`: Brightwell `room.emitters` gains `"window_blinds": { "color": "#ffd9a0", "radius": 48, "intensity": 0.1, "floorTint": 0.5 }` (m2); Quayholt `aw_quayholt_queue` intensity 0.35 to 0.25 (t3). `apply_training_room.py --refresh` into all 38 shells changed only those lines: 8 Brightwell shells gain the emitter, 12 Quayholt shells change the intensity, the other 18 are byte-identical. `validate_scenario.rb --strict-social --no-graph --skip-ink` on all 38: clean. `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1824 of 1824 (includes the fragment/erb parity test).

In game (keyless :3001, games 4539 `awareness_e1_invoice_fraud_defend` and 4541 `awareness_e3_helpdesk_reset_defend`, lit, `--close-intro --check`: mode on, lit ambient `#c4cad8`, redraw 300 ms). Shots in `playtests/ROOMS_C3_screenshots/`: `after_c3_light_brightwell.png`, `after_c3_light_quayholt.png`, and 2x side-by-sides `after_c3_light_brightwell_before_after.png`, `after_c3_light_quayholt_before_after.png` (before on the left).

| Finding | Outcome |
|---|---|
| m2 Brightwell sun | Kept. Under the window the floor mean goes from RGB (138, 129, 106) to (138, 127, 101) and the carpet near the window reads slightly warmer; the window itself is a touch warmer and paler. Floor away from the window is unchanged to the pixel. It is faint at normal zoom, not garish, and the glow on the window is not harmful, so `intensity` stays 0.1. |
| t3 Quayholt queue halo | Reduced, not fully gone. Wall just above the queue screen is +7 over plain wall at 0.35 and +4 at 0.25 (the info screen at 0.25, radius 24, is +0). A faint soft glow remains above and below the screen at 2x; it no longer reads as a smudge at game zoom. If it still bothers anyone, the next step is `radius` 32 to 24 on `aw_quayholt_queue`, same as the info screen. |

### E3 MFA decision — P6 fixes (2026-10-27)

P6 part C (PLAYTEST_P6_E3.md) played the decision live: 0 blockers, 2 majors, 5 minors, 6 trivials. Fixes (I own the authenticator JS/CSS and all E3 data):

- **M-1 outcome pushed off screen.** `.auth-choice` kept `display:flex` and overrode the `hidden` attribute after Confirm, so the panel stayed up and shoved the approval, the collapse line and the outcome panel off the bottom with no page scroll. Fixed: `.auth-choice[hidden]`/`.auth-controls[hidden]` now set `display:none`, and `.auth-root` gets `max-height:min(92vh,760px); overflow-y:auto` so it fits and scrolls on short screens (pattern copied from pretext-prep). The phone with its cards is still taller than a short viewport, so when the approval plays the banner is scrolled into view (`scrollIntoView`), bringing the approval and the outcome below it on screen rather than leaving them below the fold (live: the outcome top dropped from y 1002 to y 567 in a 1000 px viewport).
- **M-2 unreadable labels.** The legends and option labels used dark ink on the dark overlay. The choice panel is now a light surface card (like `.auth-outcome`), with the groups on white, so the dark ink reads.
- **m-1 habitual Esc/Close skipped the beat.** Esc and Close before the outcome now mean "back to choosing", never a skip: a pushed overlay layer catches Esc (so it also works with a radio focused — t-1), and `requestClose()` is overridden so the Close button does the same. Mid-playback it cancels the burst and returns to the panel, keeping the radio selection. Once the approval/outcome is on screen the layer is removed and Esc/Close exit normally.
- **m-2 refused-call debrief.** `pretextNpcs.defenderNotes.reset_password` said "Both answers she accepted…" on every outcome, wrong when she refused. Reworded outcome-neutral: the manager's name and staff reference were on the public site, so neither proved who was calling; a callback is the one check.
- **m-3 / t-3 repetition and timing-bound note.** The overlay `defenderNote` and the debrief conceptPanel listed the same three controls in the same order; the note's "half-asleep tap" also followed the daytime option. The `defenderNote` is now a timing-neutral two-control pointer (number matching + report), leaving the full three (adding rate limit) to the conceptPanel.
- **m-4 / m-5 conceptPanel.** The shared conceptPanel read oddly for the defend-only learner (never made the call/sent prompts) and after a skipped stage. The full erb's conceptPanel is reworded technique-general ("Whoever has the password…") so it holds whether the call landed or was refused; the fragment (defend-only) now carries a deliberately different, defender-framed version ("Why these are hard to catch", the overnight prompt). `conceptPanel` added to the parity test's `STRINGS_VALUE_EXEMPT` with a reason; the defend-only shell regenerated from the fragment through scratch (only that one string differed).
- **t-2 focus.** Initial focus goes to the first radio, not the disabled Confirm.
- **t-4 "imposter" → "impostor"** in both conceptPanels.
- **t-5 (two Gordon calls share a heading)**: left as is — the identical queue heading is partly the titles fixer's lane (the "· Incoming call" suffix) and two indistinguishable Gordon calls is the lesson; not changed.
- **t-6 (recap the choice on the flip page)**: not done — optional, and the flip view is engine owned by another fixer this round.

Bridge: `tools/playtest/se/bridge-e3-full.jsonl` now exercises the decision (picks the early hours + two or three, Confirms) and asserts the outcome panel is visible on screen and the choice panel is hidden (a guard against M-1), instead of pressing Escape straight away. New scene tests in `test/js/social-authenticator-decision.test.mjs` cover focus, Esc-back-to-choosing (before and mid-playback) and the post-outcome exit.

Checks: node social + validator-social — all my tests pass (authenticator 9 legacy + 10 decision, p7x schema, E3 parity); the only failures in the suite are E1/E2/E7 parity, which come and go between runs because the other-episode fixers have uncommitted edits in the tree (not E3, not my files). `validate_scenario.rb --strict-social` clean on both E3 shells.

Live (keyless :3001, fresh games): committed `bridge-e3-full` 22/22 PASS at 1400x1000 (it now exercises the decision and polls for the approval before asserting the outcome panel is visible and the choice panel hidden). A focused M-1/M-2 probe 15/15 PASS at both 1280x720 and the short 1280x700: the choice panel computes `display:none` after Confirm, `.auth-root` has `overflow-y:auto`, the outcome is reachable/on screen, and the WCAG contrast of the option labels against their background is ≥4.5 (dark ink on white). The first committed run exposed a fixed-8 s wait and the off-fold outcome; fixed with the poll + banner auto-scroll above.

## POV backgrounds wired

The four room-wide POV conversation backgrounds (`assets/backgrounds/rooms/aw_<company>_blended.png`, committed in 34c7a94d8) are now `rooms.training_room.chatBackground` in all 38 awareness shells. Value form matches the lab: `"assets/backgrounds/rooms/aw_<company>_blended.png"`, one per company (brightwell, tarrowby, quayholt, merrin_sallow). They live in `training_room.py` `ROOMS`; `apply_training_room.py --refresh` now splices the field too (replaces it if present, otherwise inserts it after `door_sign`, the order the generators use). Refresh changed one line per shell. Regenerating into scratch with all four `gen_*_shells.py` gave byte-identical output to the refreshed shells (31 generated shells). Validator `--strict-social --no-graph --skip-ink` clean on all 38; node social and validator-social tests 1843/1843.

Live (keyless :3001, own games): the host chat in the E1-E4 defend shells resolved and loaded the right background for Brightwell, Tarrowby, Quayholt and Merrin & Sallow. Shots: `playtests/ROOMS_C3_screenshots/pov_wired_<company>.png`.

## P7-2 and P7-7: grade cap and clean card titles (2026-10-27)

- **P7-2:** `scoreTriage` now holds an awareness round below the top band when two or more skills were
  never caught (`AWARENESS_ZERO_SKILLS_CAP = 2` skills), however few tells that is. The old cap of three
  missed tells (`ZERO_SKILL_MISSES_CAP`) stays, and the analyst profile (the lab) uses only that. Two P7
  playtests read "Sharp" at 92% with two skills on zero. The 05 worked example under awareness is now
  86% "Getting there" (note added beside it in `05_inbox_triage_defender.md`). Tests updated:
  `social-engine-r4-triage` (P7-2 and P4-9), `social-aw-p6-engine` (P6-4), `social-triage-scoring`,
  `social-triage-ui`.
- **P7-7:** a text with no subject took its body as the title, cut at 45 characters with dots
  ("ASAParcels: we couldn't deliver your parcel. A..."). `defaultSubject` now cuts at a sentence end when
  one fits in 48 characters, else at a word; the review card title also drops trailing dots from an
  authored subject. Test in `social-engine-r4-triage`.
- Live (keyless :3001, own games 4615 and 4617): E6 defend's ASAParcels card title reads without dots;
  E5 defend at 92% with Padlock myth and Secrecy on zero reads "Getting there".

### E3 MFA decision — P7 leftovers (2026-10-27)

PLAYTEST_P7_E1_E4.md left two E3 items.
- **m-4/m-5 residue.** The full episode's conceptPanel heading still read "Why the call and the prompts worked", false after a refused call (stage skipped, no prompts). The body was already technique-general from P6, so the fix is the heading: now "Why the call and the prompts are hard to stop", which holds whether or not the MFA stage ran. Chose the wording route over an engine outcome-variant: a single neutral heading reads correctly in every outcome and needs no change to debrief-view (engine, and near other fixers). The defend-only fragment keeps its own defender-framed heading ("Why these are hard to catch"); conceptPanel is already value-exempt in the parity test, so no fragment change and no defend-shell regen.
- **T7-2 contrast.** The choice-panel intro was mid-grey (`--auth-dim`) on the near-black overlay, and the disabled Confirm was pale-on-pale. The intro is now a light tone (#d7dde6) for the dark overlay. The disabled Confirm is dark text on a light-grey fill (#3a4452 on #d3dae2, ~7:1). Root cause of the earlier washed-out button: `ui-themes.css` has `[data-ui-theme] .minigame-button { background: none }` at specificity (0,2,0), which tied a bare `.auth-confirm:disabled` and won on order, leaving white-on-transparent over the light card; the rule is now `.auth-choice .auth-confirm:disabled` (0,3,0) with dark text so it reads even if the fill is overridden.

Live (keyless :3001, fresh game, 1400x1000): one full run 24/24 PASS — the whole E3 flow plus the choice-panel contrast (intro rgb(215,221,230); disabled Confirm rgb(58,68,82) on rgb(211,218,226), still disabled) and the debrief conceptPanel heading "Why the call and the prompts are hard to stop". E3 parity green; both E3 shells validate `--strict-social`.
