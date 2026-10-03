# sis01 blind playtest: fixes (2026-10-03)

## Decisions (user, 2026-10-03)

- **Pump challenge buttons.** Neutral: "keep prescribed rate" and "re-enter rate" have the same colour and style.
- **Backup choice.** Make it arguable. NAS fast but integrity unverified (needs a check; risk of reinfection or tampered data), vendor cloud clean but about 18 hours on paper, tape slow and partial, so lab-sheet Q9 (recovery time against confidence) has something to weigh. Keep the restore-before-isolation lesson. Update the backup console data, NPC lines, debrief and credits to match, and the information pack where it describes the sources.
- **ICO clock.** Show the time left as game-time hours of the 72-hour window (e.g. "41 h left"), scaled from the 45-minute real clock, instead of "38:56" with no units. Prefer a scenario-data option; otherwise a minimal, opt-in engine change (other missions' timers look the same) with a node test.
- **Mission Brief.** Say the player is there to manage the incident: keep patients safe, find out how they got in, contain it, and meet the reporting duties. Remove "You are not here to investigate how it happened".

## Source

Blind playtest findings: games 1521–1523 (session scratchpad `sis01-blind/FINDINGS.md`).

## Changes

### 1. Blocker D1: debrief unreachable after a reload

Cause, confirmed in the engine. Priya (`dr_sharma`) had `"restartOnRetalk": false`. After a reload the engine restores only an NPC's ink variables ("variables-only", `npc-conversation-state.js`). For a person NPC that normally means "restart at the start knot", but `person-chat-minigame.js` skips the restart when `restartOnRetalk` is false, so the freshly loaded story had no position and showed "(End of conversation)". Once the player had said "Give me a few minutes", nothing could reopen the debrief.

Fix (scenario and ink only): `restartOnRetalk: false` removed; `npc_sharma.ink` declares `debrief_complete` and its `start` knot ends the conversation with a one-line goodbye once the debrief is done, so the closing scene never replays. The closing knot was renamed `debrief_end` (it clashed with the new VAR). Browser check, game 1524: "Give me a few minutes", sync, reload, walk back: "Ready now?" with both choices; the debrief then ran to the end and the credits rolled.

### 2. Stuck points

- **S2/D2 network map.** SEVER now says why it is locked and how to unlock it (`severLockedHint`), then what it checks (`severReadyHint`). Each rule's dashed line, its ! marker and its label all open the rule; lines pulse until the first is opened and brighten on hover. The panel text says to click a line. (`network-segmentation-map` JS/CSS; shared only with the `test-network-segmentation-plan` fixture.)
- **S3/D3.** `brief_ravi` now completes when Ravi signs off (`give_itsec_code`), which every route reaches; before, only `start` completed it, and a re-talk resumes in `hub`. Ravi's "What's next?" is its own knot and stays in his hub after isolation.
- **S1/D14.** Ravi moved from (4.0, 6.0), between the desks in front of the SIEM laptop, to (6.7, 6.0) on open floor by the workbench. Browser check: the gap south of the desks is free and the SIEM opens, not Ravi.
- **S5.** The verification console now says where the binder is ("on the conference table in this room, beside the laptops"); David's HC-003 line says so too; the binder's description names the table. The old message also sent players to David, who never had it.
- **S7.** Fixing S3 lets "Investigate the Attack" complete, which unlocks the isolation aim. Its tasks now name the rooms ("David Osei, Major Incident Room"), and Ravi's sign-off line sends the player to David.
- **Sarah's "What should I do first?"** stays until isolation (it used to vanish once Bed 4 was escalated), answers by state, and becomes "What's left to do?" afterwards.

### 3. Lopsided choices

- **Pump** (decision): both buttons share one neutral colour and style; the chart line is no longer green. Labels "KEEP THIS RATE — PHONE PHARMACY" / "RE-ENTER RATE"; the screen then reads "PHARMACY AGREED — 2.0 mg/hr".
- **Backup** (decision). Three arguable sources (data only; the console is shared with m02):
  - NAS snapshot (`nas_snapshot`): about 5 hours, Sunday 21:00, Monday's records re-keyed from paper. Locked until Ravi's integrity scan (a console key slot; Ravi's new `nas_question` sets `nas_scan_requested`, and the `nas_integrity_scan` timer sets `nas_integrity_checked` 90 s later). The scan only finds known indicators.
  - Vendor cloud (`cloud_vendor`): clean, about 18 hours, EHR only.
  - Tape (`tape_library`): clean, three to five days, nothing after Friday night.

  No source is "compromised" in the engine's sense; restoring before isolation still reinfects (the engine's delayed reinfection), so the restore-before-isolation lesson stands. Updated: console data and status report, Helen's backup advice and post-restore lines, Priya's recovery lines (and a new Q9 question), credits, command board (sis01-only built-ins), information pack.
- **ICO.** The option that quoted Article 33 now reads "I think they should hear from us now, with what we've got." The law comes from the IG briefing or Dr Hartley. "Dr Hartley says notify now. It's her call to advise on." became "Dr Hartley thinks we should notify now. She's the Caldicott Guardian."
- **Ransom.** "Consider it. Patients are at risk now…" became "Keep paying open as a fallback, in case the restore fails." (`ransom_advice` keeps the value `pay`); Helen, Priya and the credit follow.
- **HC-001.** One "doesn't hold" answer (its reason depends on whether the player has seen the map) beside two plausible wrong ones, each with a reason; David's prompt no longer points at the map; "Close, but no" became "No".
- **Bed 4 as escalation (Q7/Q11).** Sarah says what each answer means before asking, and "Then I'm escalating him" after; a new optional, neutrally worded task "Tell Sarah when the monitors will be back (Bed 4)" ticks on either answer; the credit names the escalation.

### 4. Content defects

- **D4** SIEM: new alerts are held while the pointer is over the list and added when it leaves, so rows don't move under the cursor. `siem_missed_alerts` is set only by the triage outcome, not by a dismissal the player undid, and the board's "CRITICAL ALERTS MISSED" entry also needs `siem_escalated` to be false. (SIEM JS shared only with the `test-siem` fixture.)
- **D5** VPN decoy (`w.price` shows the Tor lookup and M.BLAKE; a second row click duplicates the card): not fixed. The log-filter minigame is shared with sis02 and its lookups are bound to the anomaly row in JS. Reported for approval.
- **D6** Hartley no longer says "the ICO clock is running" after the deadline.
- **D7** The pump minigame records the in-game time it was programmed (`pump_programmed_at`); the fleet report shows it ("programmed at the bedside at 07:33 this morning") or, before then, "running the same infusion since Mon 16:20". The pump log shows which library the rate met.
- **D8** HC-001 credits now say "You judged it to hold…; it never did", matching David.
- **D9** Mission Brief rewritten (decision).
- **D10** HUD reads "ICO 72-HOUR DEADLINE / 62 h left" (opt-in `countdownHours`, engine `ui/scenario-timer.js`, node test `test/js/scenario-timer-countdown.test.mjs`). The ICO tablet explains the scale. The ransom note's own "62 hours" countdown is the attacker's and is unchanged.
- **D11** Harness-only. Notes-type items (both signed forms, the MAR) go into the Notepad with a "Added … to your notes" alert, which the harness `brief` (inventory only) doesn't list. Ravi and David now say "It's in your notes."
- **D13** Not a bug: the tester shortened the ICO timer while talking to Hartley, and the missed deadline opens Priya's forced debrief by design.
- **Fleet report:** "now restored" no longer sits next to the tampered numbers; it gives both sets.
- **Player options:** the two awkward ones reworded (above, and Sarah's "The pump called two below its minimum of twenty. I kept two and rang pharmacy.").
- **Residual risk:** Priya's line now depends on what the player did (printouts, David's accepted risk, or nothing named).
- **Helen and the missed deadline:** she now opens with it ("That's on me… I waited for 'contained', and it cost us the deadline") and her exit line changes.

### 5. Lab-sheet coverage (debrief lines)

- **Q4:** after the Helen/David console disagreement, Priya puts it to the Board as one ALARP test for both risks.
- **Q5:** after the ransom, Priya frames paying as likelihood (of a key) against impact (nothing changes on Ward 7 this morning).
- **Q9:** the backup choice is now a real trade, and Priya asks "When you chose a source, what were you trading?"
- **Q11:** Priya says why the Bed 4 estimate belonged to the incident team.

### 6. Player talk sprite 404

`male_hacker_hood_v2_talk.png` does not exist. The engine default player sprite is `male_hacker_hood_v2` (`core/game.js`, `player.js`, `hud.js`), and the talk portrait is derived as `assets/characters/<sprite>_talk.png` (`core/game.js:1105-1111`, `person-chat-portraits.js` `_resolveTalkImageSrc`). The v2 hood-up sheet was imported without a talk sheet (`hood_down_v2` has one). Not a sis01 fix: the player sprite comes from the player's setting before the scenario's, so it affects every mission. Right fix: make the talk sheet for `male_hacker_hood_v2` (PixelLab pipeline), or as a stopgap map it to `male_hacker_hood_talk.png` and add the missing sprite to `spritesWithoutTalkImage` so a 404 isn't retried on every line.

### Spoken lines

48 new or changed voiced lines (one is a two-variant greeting), 21 old texts no longer used. List: session scratchpad `sis01-blind-fixer/SPOKEN_LINES.md`.

# Blind 2 (2026-10-04)

Source: the second blind playtest, runs 1 and 2 (game 1529; session scratchpad `sis01-blind2/`). Coordinator notes folded in: revealing an aim when any of its tasks completes is being fixed in the engine's objectives code by another agent, so sis01 adds no panel workarounds for that; and at every stage there must be a visible next task.

## Outcome

| # | Finding | Severity | Outcome |
|---|---|---|---|
| 1 | Objectives panel stuck on "Assess Ward 7" when the station is skipped; later aims never shown | Major | Fixed (data). "Check the ward monitoring station" is optional, so the ward aim completes on Sarah and the MAR charts. Each aim's unlock checked: two relays on Sarah open the restore aim on isolation (also covers a SEVER without sign-off) and the debrief aim when Priya arrives (also covers an ICO report still to go). `brief_ravi` was locked with nothing to unlock it, so "Investigate the Attack" could show every visible task ticked and no next step; it now appears once the SIEM and VPN are both done (Ravi's mappings). `verify_drug_library` was locked until David's HC-003 talk; it is active when the restore aim opens. Browser check, game 1538: every stage showed a next task. |
| 2 | Debrief: one closing pick ends it, so "Was this preventable?" and "What changes after today?" can be missed | Major | Fixed. The three closing questions are a small loop: each stays on offer until asked, "[That's everything, thanks.]" appears after the first, and asking all three ends it. At most two extra answers. Browser check: all three reached. |
| 3 | Mission Brief only shown after a reload | Major | Fixed (data). `show_scenario_brief` is `"on_start"`. The engine already holds the brief until the opening cutscene has played and closed (`helpers.js` `showBriefWhenClear`, `npcManager.hasPendingOpeningConversation`), which is the overlap "on_resume" was guarding against. Chosen over folding the brief into Sarah's opening because the brief's job list (patients, how they got in, containment, reporting duties) is not something a charge nurse would say, and it stays in the Notepad. Browser check: Sarah's opening ran to its last line, then the brief opened. The validator's "set on_resume" warning predates the engine wait and is now a false positive. |
| 4 | Command board "EHR SYSTEM: OPERATIONAL" | Minor | Fixed (data). New global `ehr_status: "offline"`, read by the board's built-in rows and the EHR terminal (which already defaulted to offline). The board shows OFFLINE, then RESTORING once a source is chosen. Screenshot checked. |
| 5 | David's "Good. You've thought about what it costs them." after wrong guesses | Minor | Fixed. After a wrong answer (`told_to_look`): "That's the one. It took a second look, but now you know what they're giving up. I'll sign." |
| 6 | Credits: generic SIEM line | Minor | Fixed. With the VPN found: "SIEM investigation: Critical alerts escalated; traced back to the contractor VPN account m.blake, logged in from a Tor exit node". Without: "…the spread was seen, but not how they got in". The VPN line now gives different detail (London, then Bucharest thirty minutes later, no MFA) so the two don't repeat. |
| 7 | Backup console: NAS still "INTEGRITY UNVERIFIED" after the scan; tape "CATALOGUE WIPED" reads as damaged | Minor | Fixed. Engine (shared console, opt-in): a source's `whenAvailable` fields replace its own once its `needs` / `requiresGlobal` are met; m02 declares none, so it is unchanged. Node test `test/js/backup-recovery-when-available.test.mjs`. sis01's NAS card then reads "SCANNED - NO KNOWN INDICATORS" with its Integrity bullet updated. Tape reads "CLEAN - SLOW" (green) and its banner says why it is slow; the status report agrees. Screenshot checked. |
| 8 | Sarah's urgent greetings after the crisis | Minor | Fixed. After isolation her greeting is one of "What've you got?", "Go on.", "How's it looking up there?", and her goodbye "Right. We'll manage on paper down here." instead of "Please be quick…". |
| 9 | Stiff player line about the pump | Minor | Fixed: "[Her pump flagged 2.0 as too low, wanted twenty. I kept two and called pharmacy.]" ("twenty" kept because Sarah replies "Twenty. That's ten times her prescription"; 15 words, the lint cap). |
| 10 | Priya's "Patients first." and the Mr Ahmed line | Minor | Fixed: "Let's start with the patients." / "Mr Ahmed had a nurse sitting with him till outreach got there. That's because Sarah got a straight answer about her monitors." |
| 11 | Hamza: "[That's a lot of manual work.]" | Minor | Fixed: "[That's a lot to ask of a ward that's a nurse down.]"; his reply "It is. The alternative is one keystroke and a dead patient." is unchanged. |
| 12 | Ravi's "A few minutes." for a ~90 s scan | Minor | Left, as asked. |
| — | `moveTo` wedging near Bed 2; title screen ignoring synthetic Enter | Note | Not fixed (map pathing, already logged; harness). |

## Checks

- Ink compile: 11 files, 0 failures (the existing END warning on Priya's start/debrief_end only).
- tagdiff vs HEAD: 21 structural differences, all intended. David: the `told_to_look` condition in `clinical_signoff`. Sarah: two `network_isolated` cases (greeting, goodbye). Priya: `VAR closing_asked`, knot `closing_questions`, its three `*` choices plus the gated `+` exit, and the diverts between them.
- Validator: 0 errors. Four new warnings, all intended: two Ravi handler pairs (the bark and the `brief_ravi` unlock fire together), Sarah's `network_isolated` pair (bark and relay), and the "on_resume" advice above.
- dialoguelint: the pump option fixed to 15 words; the only remaining finding is Ravi's existing "Not a blame thing. A process thing."
- loopcheck and inkcheck over every knot in the earlier state matrix plus four new states (post-isolation Sarah, a finished debrief, a half-asked closing, David after a wrong guess): 864 knot/state runs, each through loopcheck and inkcheck, all clean (no runtime errors, runaways or failing paths).
- `node --test test/js/`: 249 pass, 0 fail on the second full run (the first had two failures that passed alone: a timing test and a runner IPC error).
- Browser, keyless :3001, game 1538: brief after Sarah's opening; ward aim without the station; `brief_ravi` shown after SIEM and VPN; restore aim on isolation without David; debrief aim on Priya's arrival; NAS card after the scan; board EHR OFFLINE; full debrief with all three closing questions and the credits. SIEM, VPN and isolation were set by console in places ("exercised, not earned"). Server state after the run kept the relay-opened restore aim active, so it survives a reload.

## Spoken lines

5 new voiced texts, 2 retired (list: session scratchpad `sis01-blind2-fixer/SPOKEN_LINES.md`). Sarah's new greeting cycle reuses two cached texts, so only "How's it looking up there?" in it needs voicing.
