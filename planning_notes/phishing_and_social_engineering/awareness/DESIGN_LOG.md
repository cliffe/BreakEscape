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
