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
| M7 | Major | E3 unlikely to fit 13 min | **Deferred to playtest.** No restructure in a static cycle; timing to be measured in the playtest round (see note). |
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
| m10 | minor | Conclusion screens assume the attack / defence went a certain way | **Fixed.** Conclusion/debrief wording true on every path. |
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
| m24 | minor | Flip may show wrong senderTrust sentence on an exact spoof | **Fixed.** Exact-spoof targets (E1 Derek Mason, E5 SSO, E6 Dev) given a `factorStrings.senderTrust.redFlag` saying the From line was forged. |
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
