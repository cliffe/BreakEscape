# Awareness episodes: design review C2

Date: 2026-10-22. Reviewer: Opus 5.5, fresh, read-only. Skill: `scenario-design-review`, run in full. Kind of game: the awareness product (design 11): short attack-then-defend training episodes for non-technical staff, no blame, 10 to 15 minutes each, with matched pre and post checks, on a neutral corporate skin. Not SAFETYNET and not the student lab.

Scope read: `AGENTS.md`, `POLISH_PLAN.md`, design 11, `README_scenario_design.md` "Awareness episodes" (2775 to 3176), `DESIGN_REVIEW_C1.md`, `DESIGN_LOG.md`; the 7 full shells `scenarios/awareness_e{1..7}_*`, the 7 defend-only shells, the 24 check shells and their host ink; the fragments `awareness/e1` to `e7` (`attack.json`, `defend.json`) and the four generators. Engine files were read where a finding depends on them: `phish-rules.js`, `triage-messages.js`, `triage-flags.js`, `osint-model.js`, and the runner's `episode-runner-minigame.js`, `flip-view.js`, `step-strip.js`.

Method: the validator on all 38 shells; scripted diffs of full against defend-only against fragment for every defend set, of attack fragments against full shells, and of the A and B forms row by row; a regeneration of all generator output into the scratchpad, diffed against the repo; then a read of every shell and host ink. Static reading only: no browser run and no timing. Line numbers are in the shell named, written `e1:265` for the full shell, `e3_defend:94` for a defend-only shell and `pre_finance_ab:65` for a check shell.

## Counts

| Severity | Total | New this cycle | Reopened from C1 (not closed, or only partly) |
|---|---:|---:|---:|
| Blocker | 0 | 0 | 0 |
| Major | 6 | 3 | 3 (M2, M5, M7) |
| Minor | 24 | 14 | 10 (m2, m4, m5, m6, m10, m17, m19, m24, m28, and M3's missed row) |
| **Total** | **30** | **17** | **13** |

Not counted again: C1 M11 and m25 (E3 and E5 timing) stay deferred to the playtest round, and C1 m23, m26 and the E7 half of m8 stay logged as engine or product work.

Of the 40 C1 findings, 22 are closed, 13 are partly closed or reopened, 2 stay deferred to playtest and 3 stay logged (table below). Eight of the 17 new findings come from cycle-1 work: C2-M1 and C2-m6 (the M2 fix), C2-M5 (the M10 fix), C2-m3 (B1), C2-m10 (m18), C2-m11 (m19), and C2-M4 and C2-m17 (the E7 full shell, new in cycle 1). The other nine were there in cycle 1 and missed. Three things in the cycle-1 log don't match the files: the M7 row describes C1's M11 (timing), so the E3 push fix was never made; m10 is marked fixed but `e5:50` and `e6:50` are unchanged; m24 is marked fixed for E5 and E6, but both still author `redFlag: null`, and the E1 string it added never reaches the flip.

## Phase 1: validator

`ruby scripts/validate_scenario.rb <shell> --strict-social --no-graph --skip-ink` on all 38 shells: **38/38 exit 0, no INVALID**.

**Warnings**
- `phish_<target>_landed` "is declared but nothing else in the scenario reads it" on the six full mail shells (E1, E2, E4, E5, E6, E7). This is a false positive under `--skip-ink`: each host's ink reads it (for example `awareness_e1_invoice_fraud/ink/adaeze_okafor.ink:12, 26`). B1 moved the attack task off it, so the ink is now its only reader, and that ink is itself a problem (C2-m3).
- Every shell: "No NPCs with 'timedConversation'". Expected: a shell opens on the kiosk, not on a cutscene.
- `awareness_e3_helpdesk_reset`: the phone NPC `leila_servicedesk` has no `avatar` (C2-m24).

**Good practice.** All shells pass the awareness lint, the objective wiring, the room geometry and the door checks.

**Suggestions.** All 17 or 18 per shell are SAFETYNET defaults (VM launchers, lock variety, hostile NPCs, music, patrols) and don't apply to a one-room training shell with `disableAttacks: true`. None is relevant.

No dungeon graph was generated (`--no-graph`, so as not to write files). The graph adds nothing for a one-room kiosk shell.

**Structure checks that passed** (scripted):
- Every defend-only shell carries its full shell's defend set exactly, apart from the doubled prefix and the dropped `playerSentAuth`; E3's `defend.calls` are identical in both.
- Every full shell's defend set matches its `defend.json` fragment, and every `attack.json` fragment matches its full shell's attack keys (E3's fragment also has a `pushStream` the shell replaced with `awarenessEpisode.mfa`, as design 11 §10 records).
- In all six roles, form A is the same in `pre_<role>_ab` and `post_<role>_ba`, and form B the same in `pre_<role>_ba` and `post_<role>_ab`. Row by row, A and B match on kind, phish or genuine, and flag set, and briefs and Verify settings match.
- Regenerating with the four `gen_*.py` scripts reproduces all 31 generated shells, their ink and their `mission.json`, apart from one drift (C2-m23). The seven full shells are not generated: they are the source for their own strings and attack data.

## C1 findings: closed or not

| C1 | Status | Evidence |
|---|---|---|
| B1 | Closed | All seven full hosts map `phish_<target>_attempts` `value > 0` (E3: `pretext_..._outcome !== ""`) to the attack task, for example `e1:709-712`, `e3:866-869`, `e7:689-692`; tasks are titled for sending (`e1:29`). README 2838 rewritten. README 2825 is now stale (C2-m3) |
| M1 | Closed | E1 Adaeze (`e1:297-298`), E2 Fatima (`e2:368-369`), E5 Hana (`e5:326-327`), E6 Kaylee (`e6:314-315`). The new E7 shell doesn't name its target (C2-m17) |
| M2 | **Partly** | Calm on-topic pretext and ask in E1 (`e1:431-454`), E2 (`e2:485, 499-504`), E4 (`e4:436-465`), E5 (`e5:460-483`). E6 is unchanged and E7 repeats the problem (C2-M2). The E2 change caused C2-M1, and the calm route caused C2-m6 |
| M3 | **Partly** | Both flags on the named items (`e1:152-154`, `e4:244-248`, `e6:222-226`, finance and executive row 3). HR form B row 8 was missed (C2-m15) |
| M4 | Closed | Row 8 in finance, executive and general now flags only `linkCredible` (`pre_finance_ab:301`, `pre_executive_ab:305`, `pre_general_ab:301`, and the B rows) |
| M5 | **Open** | The deferred half: the header rows are still untaught (C2-M6) |
| M6 | Closed | `e5:85`, and the same line in the defend-only shell |
| M7 | **Open** | Not fixed. `e3:111, 125`, `e3_defend:94` and `e3/defend.json:58` are unchanged. The log's M7 row describes C1 M11 instead (C2-M3) |
| M8 | Closed | `e6:4, 312` |
| M9 | Closed | `e6:152-174`: an unannounced contactless scheme, and "staff parking is free" is gone |
| M10 | Closed | Lisbon on the events page and in the post (`e4:366, 559, 583`). It opened a new problem (C2-M5) |
| M11 | Deferred | Timing, to the playtest round |
| m1 | Closed | INV-2217 throughout (`e1:369, 559, 599`). The internal value id `inv_4471` (`e1:375, 637`) is never shown |
| m2 | **Partly** | The brief is right (`e1:4, 295`), but the scope note and aim description still name the wrong recipient (C2-m4) |
| m3 | Closed | `e2:369` |
| m4 | **Partly** | "(not on file)" is gone, but impostors alone still carry "Says he's" (C2-m14) |
| m5 | **Partly** | Fixed in the full shell (`e3:425`). The defend-only shell has no `defendIntro` (C2-m9) |
| m6 | **Partly** | One neutral "You" line (`e3:399`); three of four calls still offer the callback for the learner, and the edit left a non-sequitur (C2-m7) |
| m7 | Closed | `e4:84` |
| m8 | Closed (E4) / logged (E7) | `e4:308`. The E7 button is engine copy |
| m9 | Closed | `e5:324` |
| m10 | **Partly** | E1, E2 and E4 reworded (`e1:50`, `e2:50`, `e4:50`). `e5:50` and `e6:50` are unchanged, and the new `e7:50` repeats it (C2-m2) |
| m11 | Closed | With M9 |
| m12 | Closed | `e7:314` |
| m13 | Closed | `e7:145` |
| m14 | Closed | `e7:242` |
| m15 | Closed | `e7:83` |
| m16 | Closed | Fragment and shell agree. A trade-show leftover remains (C2-m17) |
| m17 | **Partly** | Consistent across E4, E6 and E7; the mobile check forms don't follow it (C2-m13) |
| m18 | Closed | Verify on in finance and mobile forms, both of each pair. The finance brief wasn't updated (C2-m10) |
| m19 | **Partly** | Swapped in finance, executive and general. The swap left times out of order (C2-m11), and mobile has the same pattern unfixed (C2-m12) |
| m20 | Closed | Rows now match on kind and flags. HR row 8 differs in what the look-alike is (C2-m15) |
| m21 | Closed | No "(pair …, form …)" in any check brief |
| m22 | Closed | `step-strip.js:10-11`: "Your message", "Prompts" |
| m23 | Logged | Engine |
| m24 | **Reopened** | Not effective, and not done for E5 and E6 (C2-m1) |
| m25 | Deferred | Timing |
| m26 | Logged | Product |
| m27 | Closed | No flip strings in any defend-only shell |
| m28 | **Partly** | Flip and no-blame lines are varied. Host completion lines and some intros are still templated (C2-m18) |

## Major

**C2-M1. E2: the best-made application now gets "Your attempt did not land".** New, caused by the M2 fix. Episode-local (E2 full), with a cross-cutting fix.
A send records tells only for a spoofed From (`senderTrust`), a sender-auth failure, a look-alike link, or urgency above the target's `advisoryMax` (`phish-rules.js:453-459`). E2's learner writes from their own address (`e2:460-463`, `spoofsFrom: false` at `e2:515`), attaches a CV and adds no link, so after cycle 1 gave E2 a calm pretext (`e2:485`) and a calm ask (`e2:499-504`), a careful send raises no tell at all. `resolvePlayerSent` then returns nothing (`triage-messages.js:153-178`, "a record with no tells is never replayed"), the runner sets `missed` (`episode-runner-minigame.js:421-432`), and with no `flipMissed` authored in any shell the flip shows the default "Your attempt did not land this time, so there is nothing to show from the other side" (`flip-view.js:33`). The message did land, and the host has just said so. The careful learner loses the empathy beat, and the episode tells them something false about their own work. Before cycle 1 the always-high pretext guaranteed one tell, so the flip worked, though for the wrong reason: even now, the only tell E2's flip can ever show is urgency, never the attachment that is E2's actual lesson.
Fix: give E2's flip a tell that is always true of the lure. Either author a `playerSent` entry in `e2_recruitment_inbox` whose notes carry an attachment tell (needs a check that `resolvePlayerSent` keeps authored flags), or ask for the engine to record `attachmentPlausible` as a tell when a document is attached to a recruiter target. Whatever the route, author a `flipMissed` in every full shell that doesn't claim the attempt failed ("There's nothing to replay from this one, so here is the same kind of message arriving in a real inbox"), because the default line is now wrong whenever a landed send raised no tell.

**C2-M2. The urgency advisory still can't clear in E6, and the new E7 repeats it.** C1 M2, reopened. Cross-cutting (E6 full, E7 full).
- E6: the only relevant pretext is `high` (`e6:423-434`), the only ask is `medium` (`e6:441-446`), and `advisoryMax` is `low` (`e6:596-598`). The other pretext is the off-topic bulletin (`e6:435-440`). `urgencyCalibrated` still has only a `pass` string (`e6:647-649`), so the meter can't explain itself either. The log reports M2 fixed for "each mail target"; E6 wasn't touched.
- E7: the relevant pretext is `high` (`e7:418-429`), the only ask is `high` (`e7:436-441`), and `advisoryMax` is `low` (`e7:597-599`). The hint ladder ends "the rush then does the rest" (`e7:658`), so in E7 the pressure is meant to be the trick, but nothing on the meter says so.
Fix: as cycle 1 did for E1, E2, E4 and E5, add a calm on-topic pretext and ask to E6. For E7, where the rush is the design, add a `fail` string to `urgencyCalibrated` that says so ("The pressure is the point of this call; the debrief shows why it works"), or raise `advisoryMax` to `high`.

**C2-M3. E3's scene has no consistent clock, and the push note still contradicts the brief.** C1 M7, reopened, with more contradictions. Episode-local (E3 full and defend-only).
- C1 M7 is unchanged: "Your shift starts at eight and you weren't signing in at 06:52" (`e3:125`, `e3_defend:94`, `e3/defend.json:58`) while the brief puts the learner at the desk as "a sign-in prompt has just come up on your own phone" (`e3:91`). The cycle-1 log's M7 row describes C1 M11 (timing) and defers it, so this was never picked up.
- The flip says Leila was "Twenty minutes from the end of a long shift" (`e3:419`), the OSINT says the desk "opens at 07:00" (`e3:584, 628`), Leila ends a call with "We're on the desk until six" (`leila_servicedesk.ink:58`), and the defend-only host puts the learner in her seat "this morning" (`awareness_e3_helpdesk_reset_defend/ink/darren_price.ink:24`). No one time fits all four.
- The impostor's report reply says Gordon "is in the office and hadn't called" (`e3:261`), but the OSINT the learner has just read has him at a conference all week (`e3:577, 658`).
Fix: pick one clock and write it into the brief (for example, Leila's early shift starts at 07:00 and the queue is mid-morning). Move the push outside it, as the check forms do (`pre_helpdesk_ab:213` at 02:14, `pre_helpdesk_ba` at 23:52), and reword the note to match. Reword the flip's "end of a long shift". Make the report reply true of a man away at a conference ("We rang Gordon's mobile on file. He's at the conference and hadn't called").

**C2-M4. E7's attack is framed as a voicemail script but is an email, and the seeded brief promises a voice tool that doesn't exist.** New (E7 full shell). Episode-local.
The shell calls the attack a voicemail: "script one voicemail in his voice" (`e7:4`), "Script the CEO voicemail" (`e7:22-23`), "write the script for a short voicemail" (`e7:304`), "This is the voicemail you scripted" (`e7:306`). The seeded message promises more: "The exercise's voice tool reads it aloud in an in-world voice" (`e7:484`). What the learner gets is the mail client: the runner's write panel says "Write one message … Open the mail client" (`episode-runner-minigame.js:70`); the From line is `{sender_name} <{sender_address}>` (`e7:396-412`) with Ravinder's real email address (`e7:358-362`); the task is "Send your message to accounts payable" (`e7:29`); the reply comes back by email (`e7:653`); and the flip draws an email in the mail reader (`flip-view.js`, `MailReader`). No voice stage, clip or reader exists (design 11 §10 holds N7 and N12's audio, and the fragment says the runner "has no dedicated voice-script stage yet", `e7/attack.json` `_episodeAttack._note`). A learner told they are scripting a voicemail is handed an email form, and the flip calls that email a voicemail.
Fix: until a voice stage exists, describe the beat honestly. "Write the message that would go with a cloned-voice call: an email in Ravinder's name to Tom, asking for the payment" fits the mechanics and the defend set, where the fake voicemail and the fake email arrive together (`e7:145, 209`). Drop the voice-tool sentence from `e7:484`, and retitle the aim, the task and the flip intro to match. Or hold E7 full back (design 11 §10 already says it "waits for the audio decision") and ship only `awareness_e7_voice_ceo_defend`.

**C2-M5. E4's OSINT publishes Catherine's personal travel address, then the defend set calls a personal address the tell.** New, a side effect of the M10 fix. Episode-local (E4 full).
The events page says "While she is travelling, urgent enquiries reach her at catherine.merrin@lintbox.example" (`e4:565`, fact `e4:379-392`), and the hint tells the learner to use "her travel email" (`e4:684`). Then the defend phish comes from `catherine.merrin.travel@lintbox.example` (`e4:134`), and its note gives the reason as "Catherine's name, but on a personal inbox at lintbox.example, not merrinsallow.example" (`e4:155`). A learner who did the attack has just learned that Catherine really does use an lintbox address on the road. This is the class C1 M9 fixed in E6: the attack makes the defend phish look genuine. The fair tell (a different local part, `.travel`) is real but isn't the one the note gives.
Fix: either remove the travel-address block from the OSINT and have the attack spoof her work address (the hint then says "her work address"), or keep it and rewrite the note: "Her published travel address is catherine.merrin@lintbox.example. This is catherine.merrin.travel@lintbox.example, a different inbox, and anyone can open a free one in her name." The second keeps a useful lesson (publishing a personal address is the risk the `reduceNote` names), and it means the defend-only note needs no change.

**C2-M6. The check forms still measure header reading that no episode teaches.** C1 M5, the deferred half, still open. Cross-cutting (all 24 check shells).
Row 6 in every form (row 7 in helpdesk: `pre_helpdesk_ab:264`) is a spoof found only in the header panel (`senderAuth`, `reply_to_differs`), and each form has a genuine row whose fineness depends on one check failing (`pre_finance_ab:110`, `pre_hr_ab:350`, `pre_helpdesk_ab:237`, `pre_executive_ab:111`, `pre_general_ab:337`, `pre_mobile_ab:266`). Every episode set still has `headerPanel: "off"` (`e1:87`, `e2:87`, `e3:95`, `e4:88`, `e5:89`, `e6:87`, `e7:87`). The notes are now in plain words, but the panel the learner opens still labels its rows SPF, DKIM and DMARC (`triage-flags.js:133`, `MECHANISM_LABEL`), which design 11 §7 rules out ("no jargon, only 'this domain isn't theirs'"). The pre-to-post change on 2 of 10 rows per form can't come from the episodes.
Fix, as C1 said: either teach one plain "Show details" item in each episode, or replace both header rows in both forms of each pair with items the episodes do teach. Showing plain labels in the panel when the profile is `awareness` would need engine approval.

## Minor

**C2-m1. The forged-From sentence never reaches the flip.** C1 m24, reopened. Cross-cutting (E1, E5, E6, E7).
The flip builds the replayed message without `factorStrings` (`triage-messages.js:153-224`), and `redFlagString` reads only the message's own `factorStrings` before falling back to the library (`triage-flags.js:112-123`). So the target-level string added at `e1:661` is never shown: the flip still says "Sender address doesn't match the display name or a known contact" (`phish-rules.js:55`) about a From line that carries the real address. The log also reports E5 and E6 done, but both still have `redFlag: null` (`e5:861`, `e6:640`), as does E7 (`e7:641`). The target's `redFlag` is used only for failed factors on the meter (`phish-rules.js:330-335`). C1's suggested fix was itself unworkable. Fix: have `resolvePlayerSent` copy the target's `factorStrings` onto the replayed message (engine, needs approval), then author the string on all four targets.

**C2-m2. Conclusion screens still assume the attack happened or the defence went well.** C1 m10, reopened. E5: "You built the page and then caught pages like it" (`e5:50`, unchanged). E6: "You've written your message, seen it from the other side and gone through the work phone" (`e6:50`, unchanged). The new E7: "You've scripted the call, seen it from the other side" (`e7:50`). Use E1's form ("You've seen both sides of …", `e1:50`). Titles are also mixed: "Both sides done" in E3 and E5 (`e3:49`, `e5:49`), "<topic> episode done" elsewhere.

**C2-m3. Hosts still key their middle line on the attack landing.** New since B1. Cross-cutting (all seven full hosts).
Each host shows the welcome until `phish_<target>_landed` (E3: `leila_reset_granted`) turns true: `adaeze_okafor.ink:26-29`, `fatima_begum.ink:26-29`, `darren_price.ink:25-28`, `thandiwe_moyo.ink:26-29`, `niamh_doherty.ink:24-27`, `chidi_okeke.ink:27-30`, `agnieszka_duda.ink:27-30`. A learner whose send didn't land is told "Start at the kiosk: … write one email" after writing it, and the one whose send did land is praised for it ("You talked the agent into that reset with facts anyone could look up"). The score is now defence only, so the host should key on the attempt (`phish_<target>_attempts > 0`, or a non-empty `pretext_..._outcome`) and say "Your message has gone" either way. README 2825 still says E1 uses the landed global "to complete the attack aim's task", which B1 removed, and the E1 ink header comment (`adaeze_okafor.ink:5-6`) says the same.

**C2-m4. E1's scope note and aim still name the wrong recipient.** C1 m2, partly closed. The brief now says Adaeze (`e1:295`), but the scope note shown under it says "one email to the Harlow Packaging contact you find" (`e1:265`), and the aim says "from the supplier's accounts contact to the finance team" (`e1:23`). E2's aim says "to the recruitment team" (`e2:23`) while its task says "to the recruiter" (`e2:29`). Name Adaeze and Fatima.

**C2-m5. "Lookalike" names attacks that are exact spoofs.** New. Cross-cutting. "Send the lookalike email" (`e1:5, 22`; `e4:5, 22`) and "Send the lookalike parking message" (`e6:5, 22`). E1 and E6 forge a real address and E4 uses Catherine's published travel address; none is a look-alike domain. The defend sets teach `lookalike_domain` as a separate tell, so the objectives panel muddles the vocabulary the chips rely on. Say "Send the email in Derek's name", and so on.

**C2-m6. Landed replies assume the urgent pretext.** New, caused by M2's calm route. E4's reply is "I'll get it paid this afternoon and keep it off the finance thread" (`e4:679`) even after the calm pretext, which says "I'll confirm it with finance" (`e4:438`). E5's is "signing in now before I lose access" (`e5:883`) after "There's no rush" (`e5:480`). Make the replies neutral, or key them on the template if the engine allows.

**C2-m7. E3's neutral "You" line left a non-sequitur.** C1 m6, partly closed, and the change made a new slip. Jiayi answers "No bother. Let me see what I can do." (`e3:399`) with "Of course. My desk is 4431, or my manager … can confirm it" (`e3:403`), a reply to a check nobody offered. The note says she "waits for the callback" (`e3:408`), but no callback is offered. Three of the four calls still have the learner's own line offer the callback (`e3:248, 306, 354`), so C1 m6 is mostly open. Fix: have Jiayi offer the checks unprompted ("You'll want to check it's me. My manager is Ngozi Okonkwo …"), and reword the note.

**C2-m8. E3's pretext line texts differ from the choices the learner clicks.** New. The choice reads "I'm at a conference, a callback's no good. Can you just do it now?" (`leila_servicedesk.ink:51`) but the spec line is "… I won't be at my desk phone, so a callback's no good — can you just do it now?" (`e3:759`), with an em dash. "I don't have time for this" (`ink:53`) is "I really don't have time for this" in the spec (`e3:767`). If the call flip rebuilds the learner's lines from the spec, it shows words they didn't choose. Make them identical.

**C2-m9. Defend-only panel copy: E3's skips the push, and three others use the "no trick" line.** C1 m5 and m28, partly closed. `awareness_e3_helpdesk_reset_defend` has no `defendIntro` (strings at `e3_defend:338`), so the runner's role-swap copy says only "Take each call" (`episode-runner-minigame.js:81`) over a set that ends with a push. The E1, E2 and E5 defend-only shells also lack one, so they get "Take your time: there is no trick to it, just the habits that catch these" (`episode-runner-minigame.js:78, 84`), the line C1 m28 flagged and E6 and E7 replaced. Give each defend-only shell a `defendIntro` (E3's full one, `e3:425`, minus "Now you're in Leila's seat", works).

**C2-m10. The finance check brief omits the Verify button it now has.** New, caused by C1 m18. Both finance forms turned on `verifyVerdict` but the brief still reads "choose Trust, Report or Delete" (`pre_finance_ab:65`, `pre_finance_ba:65`, and both post shells). The mobile brief was updated. Add "or Verify (ring someone on a number you already hold)".

**C2-m11. The m19 swap left times out of order.** New, caused by C1 m19. Finance and general rows 2 and 3 now read 08:50 then 08:32 (`pre_finance_ab:110, 143`; `pre_general_ab:108, 138`; the same in form B and the post shells). The executive forms were re-timed; these were not. Swap the two times.

**C2-m12. Mobile forms show the look-alike QR before any real Tarrowby address.** C1 m19, missed. Row 2 (`ma_ev_charging_pay`, `pre_mobile_ab:103`; `mb_staff_wifi_signin`, `pre_mobile_ba:103`) is a look-alike QR whose tell is "not Tarrowby's domain", but row 1 is a text with no domain, a QR card shows no To address, and the real domain first appears in row 3 (`pre_mobile_ab:126`). Feedback waits until the end. Swap rows 2 and 3 in both forms, or put "Tarrowby's sites end in tarrowby.example" in the brief, as E5's brief does.

**C2-m13. The mobile check forms don't use the contact convention the episodes teach.** C1 m17, partly closed. The episodes mark genuine texts "Shauna (mobile), in your contacts" and fakes "07700 900583 (not in your contacts)" (`e6:104, 132`). The mobile forms show a name beside a bare number for every text, genuine or not (`pre_mobile_ab:86, 179, 236, 293`; `pre_mobile_ba` the same rows), while the notes say "A saved contact". A learner trained on the episode's cue doesn't find it in the post-check. Use the episode's form in both forms.

**C2-m14. Only impostor callers carry "Says he's".** C1 m4, partly closed. Helpdesk row 2 is "Says he's Owen Treharne, Facilities" and row 3 "Sofia Marchetti, HR" (`pre_helpdesk_ab:112, 149`; `pre_helpdesk_ba:112, 149`). In E3, Josh is "Says he's Josh Henley" (`e3:324`) and the genuine Jiayi isn't (`e3:378`). The prefix now gives the verdict away, much as "(not on file)" did. The README's example still shows the old form (`README_scenario_design.md:3096`). Use one form for every caller.

**C2-m15. HR form B row 8 is a sender look-alike without `senderTrust`.** C1 M3, a missed row. `hb_shortlist_missing` comes from `roseanne.wadsworth@kettlewick-talent.example` (`pre_hr_ba:311`) and is flagged only `lookalike_domain` and `attachmentPlausible`, so a learner who ticks "The sender's address doesn't match who it says it is" scores nothing for it. Its partner in form A (`ha_careers_missing`, `pre_hr_ab:312`) is a look-alike link from a stranger's address, so the two rows also differ in what is being looked at. Make B's look-alike the link, as in A, or add `senderTrust` to B and a matching sender look-alike to A.

**C2-m16. Some check hosts are impersonated in their own forms.** New. Cross-cutting (checks). The host who welcomes the learner is also the name on a spoof in the same mission: Yasmin in `pre_executive_ab` (host `:428`; `ea_card_spoof`, "I'm out of the office", `:246`), Julian in `pre_executive_ba` (`eb_consultant_fee` `:179`, `eb_vm_hearing` `:213`), Pauline in `post_general_ba` (`ga_payroll_spoof` `:258`), Anjali in `post_helpdesk_ab` (`hb_resets_spoof` `:283`), Jun in `pre_mobile_ba` (`mb_new_starters_spoof` `:204`), and Owen in `post_general_ab` (`gb_facilities_spoof` `:258`). It happens in one ordering of a pair and not the other, so it is an uncontrolled difference between the AB and BA groups, and "out of the office" from someone standing in the room is a hint. Choose hosts who appear in neither form.

**C2-m17. E7's flip doesn't name its target, and a trade-show line remains.** New (E7 full shell). Every other flip now names the person fooled (C1 M1). E7 says "as the finance office would find it" and "By the end of the message the payment was half set up" (`e7:306-307`), though the target is Tom Reilly (`e7:574-576`). The greeting "I've only got a minute between sessions" (`e7:415`) is left over from the trade-show story C1 m16 replaced with Leeds site visits. Name Tom, and say "between site visits".

**C2-m18. Some copy still reads as written to a template.** C1 m28, partly closed.
- Host completion lines: "That's both sides done, thank you. The trick is the same whichever seat you're in" in E1, E2 and E4 (`adaeze_okafor.ink:24`, `fatima_begum.ink:24`, `thandiwe_moyo.ink:24`), and near-copies in E6 and E7 (`chidi_okeke.ink:25`, `agnieszka_duda.ink:25`).
- Middle lines: "Your <thing> got through to … Now take the other seat at the kiosk and …" in six hosts.
- E6 and E7 share "Take your time. Each one comes down to a habit or two, and that's all you need here." (`e6:320`, `e7:312`).
- Ten of the twelve post-check hosts say the same two lines word for word ("Welcome back. Ten new … on the kiosk, same idea as before …"); Farah alone differs.
Vary them per host.

**C2-m19. Em dashes in learner-facing copy.** New. E2's new calm ask (`e2:501`), E2's social post, subject and reply (`e2:636, 658, 738`), E3's call line (`e3:759`), and E4's post (`e4:583`). The E1 phish subject (`e1:139`) is in-world and can stay. Use a comma or a full stop.

**C2-m20. E2's Monday card quotes a phrase the episode never uses.** New. "If a CV is 'too big to attach'" (`e2:372`), but the portfolio lure says "If the attachment doesn't come through" (`e2:154`). Quote the item.

**C2-m21. E1's genuine Harlow invoice arrives today on 30-day terms, yet the OSINT says it is due this week.** New. `e1:109` against `e1:559`. Make the invoice an older one ("from 18 September") or drop "due this week".

**C2-m22. E1 and E3 set the OSINT profile to `student`.** New. `e1:509`, `e3:592`; the other five use `awareness`. No tools or documents are authored, so nothing shows differently today (`osint-model.js:18-26`), but a later addition would. Use `awareness`.

**C2-m23. Docs and tooling drift.** New.
- `gen_e1_shells.py` would put `playerSentAuth` back into `awareness_e1_invoice_fraud_defend` (the only diff on regeneration); the other three generators drop it.
- Design 11 §4.2 works the E1 example with F = 2, but `e1_lookalike_bank` now has three flags (`e1:152-154`), so the example's numbers are out of date.
- The cycle-1 log's M7 row (`DESIGN_LOG.md`, the M7 line in the Cycle 1 table) describes C1 M11, which is how C2-M3 was missed. Correct it when C2-M3 is logged.

**C2-m24. E3's pretext phone contact has no avatar.** New, from the validator. `leila_servicedesk` (`e3:880-886`). The phone list shows a blank tile for the one call the learner makes.

## Phase 2: the skill's checks, applied to a kiosk shell

- **2a Solvability: OK.** Each shell's conclusion task completes on the defend set's done global through the host's mapping, and `concludeRequires` gates on the same global, in all 38. B1's attack mappings fire on any send or any call end. No KO risk (`disableAttacks: true`). The one thing that reads wrong to the learner rather than blocking them is C2-M1's flip.
- **2b Clue distribution: CONCERN.** Each defend item is fair on screen except where the attack teaches the opposite (C2-M5) or the scene contradicts the note (C2-M3). In the checks, the look-alike rows now follow the real ones except in mobile (C2-m12).
- **2c Coverage: OK, with M5 open.** One habit per episode, and the item mixes match design 11 §3.2: E1 5 (2 phish), E2 6 (2), E3 4 calls and a push (3), E4 5 (3), E5 5 pages (3), E6 6 (4), E7 5 (2). Each set has an awkward genuine item, and a similar genuine item follows each likely miss. Header reading is measured but not taught (C2-M6).
- **2c′ Field guides: N/A.** No handler and no lab-workstation items.
- **2d Narrative: CONCERN.** The brief, flip and debrief arc works in E1, E4, E5 and E6. E2's flip breaks for the best send (C2-M1), E3's clock doesn't hold (C2-M3), and E7's attack is described as something it isn't (C2-M4). Hosts don't follow the B1 contract (C2-m3).
- **2d′ Ink conventions: OK.** Host ink is a welcome line and one spoken choice, resting in a hub; no narration, combat or menu labels. Leila's choices are first-person speech.
- **2d″ Patrols, 2f rooms, 2h KO: N/A.** One training room, no patrols, no attacks.
- **2e Graph metadata: N/A** for a kiosk shell.
- **2g Objectives scaffolding: OK.** Full shells have two aims, both active from the start, and the kiosk drives the order; defend-only and check shells have one aim. No dead zone: the runner's step strip and stage panels carry the learner. Titles are action-led ("Sort the payments inbox"), except the "lookalike" naming (C2-m5) and E7's aim and task, which name different acts (C2-M4).

| Shell kind | Aims | Required tasks | In-world pointer | Dead-zone risk | Transition narrated |
|---|---:|---:|---|---|---|
| Full (×7) | 2 | 2 | Kiosk, host welcome, step strip | None | Runner stage panels; host line keys on the wrong global (C2-m3) |
| Defend-only (×7) | 1 | 1 | Kiosk, host welcome | None | Runner panel; E3's skips the push (C2-m9) |
| Check (×24) | 1 | 1 | Kiosk, host welcome | None | Result screen; comparison panel on post |

- **2i Recurring bugs: CONCERN.** Spoilers in names: impostor-only "Says he's" (C2-m14) and hosts named in their own spoofs (C2-m16). Stale status lines: the host middle line (C2-m3). Status answers are otherwise not re-askable (one choice per host). No deduction or brute-forceable menu.

## Consistency across the episodes

| | E1 | E2 | E3 | E4 | E5 | E6 | E7 |
|---|---|---|---|---|---|---|---|
| Calm on-topic route clears urgency | yes | yes | n/a (call) | yes | yes | **no** | **no** |
| A good send always has a tell for the flip | yes (spoof) | **no** (C2-M1) | n/a (call) | yes (spoof) | yes (spoof, link) | yes | yes |
| Flip names the target | Adaeze | Fatima | Leila | Tomás | Hana | Kaylee | **no** (C2-m17) |
| `flipMissed` authored | no | no | no | no | no | no | no |
| `defendIntro` full / defend-only | – / – | – / – | yes / **–** | yes / yes | yes / – | yes / yes | yes / yes |
| Conclusion true on every path | yes | yes | yes | yes | **no** | **no** | **no** |
| OSINT profile | **student** | awareness | **student** | awareness | awareness | awareness | awareness |
| Forged-From `redFlag` (and it shows) | set (**not shown**) | n/a | n/a | n/a | **null** | **null** | **null** |
| Verify | yes | no | yes | yes | no | yes | yes |

The Verify column matches design 11 (E1, E3, E4) plus E6 and E7, which teach ringing back; E2 and E5 have nothing to ring. The check forms follow the same split (finance, helpdesk, executive and mobile with Verify; HR and general without), which is consistent.

## Action list

**Must fix:** none.

**Should fix (majors)**
- C2-M1: E2's flip on a careful send; author `flipMissed` everywhere.
- C2-M2: calm route for E6; meter wording or `advisoryMax` for E7.
- C2-M3: one clock for E3; move the push; fix the report reply.
- C2-M4: describe E7's attack as what it is, or hold E7 full back.
- C2-M5: E4's travel address against the defend note.
- C2-M6: header rows in the checks (C1 M5, deferred half).

**Worth doing (minors).** C2-m1 to C2-m24, above. The quickest wins are m2, m4, m5, m6, m10, m11, m17, m19, m20 and m21 (copy only). m1 needs an engine change. m12, m13, m14 and m15 change the check forms and must be made in both forms of a pair.

## Notes for the fixer

- **Read the file, not the log, before marking a finding fixed.** Three cycle-1 claims didn't hold (M7, m10, m24). A grep for the old string after each fix would have caught all three.
- The fragments (`e*/defend.json`) feed the defend-only and check shells through the generators; the full shells are edited by hand. A defend-set fix goes into the fragment, then a regeneration, then the same edit by hand in the full shell (C2-M3's push note is in all three places). Attack and string fixes go into the full shell and the matching `attack.json`.
- C2-M1's fix and C2-M2's E7 half touch how the meter and flip read tells, so check them in the next playtest. They are the cycle's "confirm in a browser" items, with C1 M11 and m25 (timing).
- C2-m1 is engine work (`resolvePlayerSent`), and C2-M6's plain panel labels would be too; both need the user's approval (AGENTS.md, "Making judgements without asking"). C2-M4's "hold E7 full back" option changes what ships, so it goes to the user as well.
- Every check-form change (C2-m10 to m16, and C2-M6) goes into both forms of the pair and all four missions that carry them, then re-run the row-by-row parallel check.
