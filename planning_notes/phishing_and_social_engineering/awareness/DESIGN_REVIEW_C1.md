# Awareness episodes: design review C1

Date: 2026-10-22. Reviewer: Opus 5.5, read-only. Kind of game: the awareness product (design 11), a staff-training line for non-technical employees, judged on short attack-then-defend episodes, no blame, a neutral corporate skin, and matched pre and post checks. Not SAFETYNET and not the student lab.

Scope read: design 11, `AGENTS.md`, `README_scenario_design.md` "Awareness episodes" (lines 2775 to 3176); the six full shells `scenarios/awareness_e{1..6}_*`; the seven defend-only shells including `awareness_e7_voice_ceo_defend`; the 24 check shells; the fragments `planning_notes/phishing_and_social_engineering/awareness/e1` to `e7` (`attack.json`, `defend.json`). Engine files were read only where a finding depends on them (`phish-rules.js`, `triage-flags.js`, the episode runner, Hacktivity's `game_scoring_job.rb`).

Static reading only. No browser run, no validator run, no timing.

## Counts

| Severity | Count | Episode-local | Cross-cutting |
|---|---:|---:|---:|
| Blocker | 1 | 0 | 1 |
| Major | 11 | 6 | 5 |
| Minor | 28 | 13 | 15 |
| **Total** | **40** | **19** | **21** |

Every shell's defend set matches its fragment (only `_`-prefixed notes differ), and each defend-only shell carries the same set as its full shell apart from the doubled prefix and the dropped `playerSentAuth`. Line numbers below are in the shells unless a fragment is named. A finding in a defend set applies to the full and the defend-only shell alike, and the defend-only line is given where it differs.

## What works

These hold across the set and should be kept.

- **One lesson each, and the Monday card states it.** E1 ring on a number you hold; E2 read in the viewer, never enable content; E3 ring back on the number on file; E4 a familiar voice is not proof; E5 read the address bar; E6 don't scan or tap, open the app yourself; E7 verify whoever is speaking. Each Monday card says the habit in a sentence a clerk can repeat.
- **The item mixes match design 11 §3.2** (E1 5 items, 2 phish; E2 6, 2; E3 4 calls and a push; E4 5, 3 phish, 2 voice; E5 5 pages, 3 phish; E6 6, 4 phish; E7 3 voicemails and 2 emails).
- **A similar genuine item follows each likely miss** (design 11 §4.3): E1 bank change then the phone-confirmed bank change, E4 copied voicemail then the real one, E5 look-alike SSO then the real SSO, E6 fake QR then the canteen QR, E3 impostor Gordon then real Gordon.
- **Every set has an awkward genuine item**, so refusing everything doesn't win: Adaeze's bank change, grumpy real Gordon, Lindiwe at the gate.
- **The no-blame register is right.** Nothing says "you fell for it". The debrief verdict lines (`debrief-view.js:33-46`) and every `ifTrusted` describe consequences without judging the reader.
- **UK English is clean**: licence (noun), organisation, practise/practice, programme where it should be. "program" appears only for software, which is the UK usage.
- **The check forms are well matched row by row.** In all six roles item n in form A matches item n in form B on kind, phish or genuine, flag set and header results, and the bodies are within ten words of each other. The asymmetries left are listed in m19 to m22.

## Blocker

**B1. Full episodes score the attack, against design 11 §4.1 and §6.2.** Cross-cutting (E1 to E6 full shells).
Each full shell has two aims. The first aim's task completes only when the attack lands: `e1:21-33` with the host mapping at `e1:687`, `e2:21-29`/`767`, `e3:21-29`/`866-869` (only on `got_it`), `e4:21-29`/`692`, `e5:21-29`/`899`, `e6:21-29`/`686`. Hacktivity scores a VM-free game as 70 × tasks done plus 30 × aims done (`Hacktivity/app/jobs/game_scoring_job.rb:116-122`). So a learner whose message didn't land finishes on 50 and one whose phish worked finishes on 100, and that number goes out on the event channels. Design 11 §4.1 says "The score is defence only. The attack beat is never scored ... This avoids rewarding 'best phisher'", and §6.2 says the share "is 0 or 100". The open aim also never closes for a learner whose send didn't land, and `maxSends: 1` means there's nothing they can do about it. The objectives panel shows an unfinished "Win the password reset on the call" (`e3:29`) at the end of a no-blame episode. The README endorses the pattern ("A full episode may have a first aim for the attack", `README_scenario_design.md:2838`), so the design and the README disagree.
Fix: complete the attack task on any finished attempt (`phish_<target>_attempts > 0`, or any `pretext_<callId>_outcome`), retitle it "Send one message" / "Make the call", and correct the README line. Or drop the attack aim. Needs the user's call because it touches the README contract.

## Major

**M1. The flip blames a different person from the one the learner wrote to.** Cross-cutting (E1, E2, E5, E6).
Design 11 §4.3 puts the empathy lesson in the flip, where the defender the learner targeted is fooled by their own message. In four episodes the flip's defender is someone else:
- E1: the target is Adaeze Okafor, Finance Manager (`e1:573-575`), and her reply is "Thanks Derek, I'll get the payee details updated" (`e1:651`), but the flip says "Tom in accounts payable opened it" (`e1:296`).
- E2: the target is Fatima Begum (`e2:647`), but the flip has "Jun in HR" (`e2:369`).
- E5: the target is Hana Novak, claims handler (`e5:764`), but the flip has "Ayaan in claims" (`e5:327`).
- E6: the target is Kaylee Dunford, a warehouse operative (`e6:573`), but the flip has "Bogdan ... in his cab", and the intro says "as a Tarrowby driver would see it" (`e6:312-313`).

E3 (Leila) and E4 (Tomás) get it right. Fix: name the actual target in `flipDefenderLine` and `flipIntro`.

**M2. The urgency advisory can never pass, so the red-flag meter nags about something the learner can't fix.** Cross-cutting (every mail attack).
The only relevant pretext in each mail attack is tagged `urgency: "high"` and the only ask is `medium`, while the target's `advisoryMax` is `low` (E5: `medium`). `urgencyOf` takes the highest of pretext and ask (`phish-rules.js:273-281`), so `urgencyCalibrated` is always "overdone" (`phish-rules.js:408-410, 438`) on any send that could land. The lines are `e1:421`/`596`, `e2:485`/`669`, `e4:431`/`601`, `e5:452`/`786` and `e6:431`/`595`. E2's application pretext (`e2:470-485`), "I'd like to apply for {vacancy} ... My CV is attached for your review", carries no pressure at all, yet it is tagged high. Design 11 §3.1 has the meter "giving escalating guidance before Send". Here the guidance can't be acted on: the low-urgency alternative is the off-topic one. Fix: tag the relevant pretext `medium` or `low` and give each target a calm ask, so a careful learner can clear the advisory, or else accept the tell and say in the factor string that pressure is part of the trick. Check what the meter shows for an advisory fail in a playtest.

**M3. Overlapping chips cost points.** Cross-cutting (E1, E4, E6, and the finance, executive and mobile forms).
On a look-alike *sender* domain the plain `senderTrust` chip, "The sender's address doesn't match who it says it is" (`triage-flags.js:38`), describes the message exactly, but only `lookalike_domain` is authored:
- E1 `e1_lookalike_bank` (`e1:133-158`): display name "Brightwell Foods Accounts", address `brightwel1foods`;
- E4 `e4_wrenfield_lookalike`, E6 `e6_mfa_scan` (sender `tarrowbey.example`);
- form row 2 in finance (`fa_pennine_bank`, `pre_finance_ab:109`) and in executive.

A learner who ticks the chip that fits best loses 20 of the 40 reason points, and the card then lists `lookalike_domain` as missed. The CEO-wire items are authored the other way round (`senderTrust` only, `e1:209`). Design 11 §4.2 rests on the chips being unambiguous. Fix: author both flags on sender-domain look-alikes (F = 3 keeps the per-flag maths fair), or reword the `lookalike_domain` chip so it reads as the link or domain spelling and leave the address mismatch to `senderTrust`.

**M4. Some check-form tells rest on facts the learner can't see.** Cross-cutting (finance, executive and general forms).
Row 8 in three roles flags `pretextRelevant` on reasons that are nowhere on screen:
- finance A `fa_invoice_share` ("Brightwell has no purchase order with Merrow Logistics", `e1/defend.json:260`, `pre_finance_ab:298`) and B `fb_bank_portal` ("Brightwell doesn't bank with Fernhill", `e1/defend.json:463`);
- executive A `ea_speaker_portal` ("Nobody at Merrin & Sallow is speaking at Fennick Summit", `e4/defend.json:324`) and B `eb_courier_fee` (`e4/defend.json:537`);
- general A `ga_solicitor_share` ("You have no case with Ashcombe", `e5/defend.json:340`) and B `gb_quarantine_notice` ("Quayholt doesn't use MailGuard", `e5/defend.json:560`).

These are measurement items with feedback held to the end, so the learner can't learn the fact in time either. Fix: put the fact on screen (the form brief, a line in the body, or an earlier genuine item from the bank or supplier the firm does use), or drop `pretextRelevant` from those rows in both forms of the pair.

**M5. The checks measure header reading, which no episode teaches, and explain it in jargon.** Cross-cutting (all 24 check shells).
Every form has a spoof row (row 6, or row 7 for helpdesk) flagged `senderAuth` and `reply_to_differs`, which can only be found in the collapsed header panel. The form also has a genuine row whose fineness depends on "SPF failed ... but DKIM passed and DMARC passed". Every episode defend set has `headerPanel: "off"` (`e1:87`, `e2:87`, `e3:95`, `e4:88`, `e5:89`, `e6:87`), so the training never shows that panel. The pre-to-post change on those rows can't come from the episodes, and the post-check claims (design 11 §5.2) get noisier. The notes say "SPF and DMARC both failed for brightwellfoods.example" (`pre_finance_ab:263`), which is the jargon design 11 §7 rules out ("no jargon, only 'this domain isn't theirs'"). Fix: either teach one plain "Show details" check in the episodes (one item each, with plain wording), or replace the two header rows in both forms of each pair. In both cases rewrite the notes in plain words ("Brightwell's own mail system didn't send this; replies would go to a private inbox").

**M6. E5's first page is a look-alike, shown before anything says what Quayholt's real address looks like.** Episode-local (E5 full and defend-only).
`e5_sso_lookalike` (`e5:102-108`; defend-only `:83`) sits at `quayholt-sso.example`. The rule its note relies on, "Quayholt's sign-in page is sso.quayholt.example", first appears in that note and in the next item. Page cards have no To address to compare against, unlike the email sets. In the full episode the OSINT tells the learner "Staff sign in once at the Quayholt SSO on quayholt.example" (`e5:558`), which makes `quayholt-sso.example` look more plausible, not less. The defend-only learner gets nothing at all. The autofill-empty clue exists, but it has no chip and isn't mentioned in the set brief. Fix: add to the set brief (`e5:85`) "Quayholt's own sites all end in .quayholt.example, such as sso.quayholt.example", or put `e5_sso_real` first.

**M7. E3's push tell contradicts the scene it's in.** Episode-local (E3 full and defend-only).
The push note reads "Your shift starts at eight and you weren't signing in at 06:52" (`e3:125`; defend-only `:94`). But the set brief puts the learner at the desk with "a sign-in prompt has just come up on your own phone" (`e3:91`), and the defend-only host says "this morning ... her phone's just buzzed". The shift time isn't on screen, and the learner is apparently at work when the push arrives. The unknown location does give it away, but the note explains the item with a fact that contradicts the brief. Fix: give the push a time outside the scene (as the forms do, 02:14 and 23:52) or say in the brief that it arrived before the shift.

**M8. E6's brief promises a choice the attack doesn't offer.** Episode-local (E6 full).
`scenario_brief` (`e6:4`) and `strings.brief` (`e6:310`) say the learner chooses "whether it arrives as a text or as a printed notice with a QR code". The write stage is one email from Facilities, with one relevant pretext (YardPass) and no channel choice (`e6` templates near `:400-440`; `e6/attack.json` `_note`). The aim and end goal ("Send the lookalike parking message", `e6:5, 22`) describe what really happens. Design 11 §3.2 does ask for a channel choice, so either build it or change both briefs to "write one email to depot staff, as Facilities, asking them to scan a code".

**M9. E6's attack makes the fake parking notice look genuine.** Episode-local (E6 full; the unknowable claim also in defend-only).
The OSINT the learner has just read shows Tarrowby really running a QR parking registration: "New yard parking: register your vehicle on the YardPass scheme. Scan the QR code on the notice board by Friday" (`e6:538`, fact `e6:377`). Then `e6_parking_permit` (`e6:152`) is a fake QR parking-permit notice, and its report reply says "staff parking is free" (`e6:173`; defend-only `:150`). A learner who took in the attack has good reason to trust the notice. The address is the only fair tell, so the item mostly tests whether they pressed "Where does this code go?". Fix: make the defend notice a different, unannounced scheme (or a sticker over the real notice), and drop "staff parking is free", which the learner can't know.

**M10. E4's attack and defend describe different trips, and the defend notes point back to OSINT that isn't there.** Episode-local (E4 full; defend-only keeps the unverifiable claim).
The OSINT and hints say Catherine chairs "the Westgate regeneration review offsite" this week (`e4:363, 538, 661`), and the learner's pretext reads "I'm about to board for the Westgate offsite". The defend set says she flies to Lisbon for the Lisbon Design Forum (`e4:84, 110-112`). Two notes then claim "The flight time came from her public posts" (`e4:157`) and "Notice how much of it is also on Catherine's public posts: the forum, the date, the flight time" (`e4:126`). The OSINT has no flight, no forum and no Lisbon. Fix: put the Lisbon forum and flight on the events page and her post, and make the trip blank "the Lisbon Design Forum". Or cut the "public posts" sentences.

**M11. E3 is unlikely to fit 13 minutes.** Episode-local (E3 full).
E3 runs seven stages (brief, osint, a branching pretext call, mfa, flip, a defend round of four transcript calls plus a push, debrief) against the same 13-minute target as E1's six (`e3:144`, `mission.json` `estimated_duration_minutes`). The defend round alone has 337 words of transcript before any feedback, the most of any full episode. Design 11 §1 allows 10 to 20 minutes, and the user's brief says 10 to 15. Fix: time it in a playtest. If it runs over, trim the mfa stage to the four pushes without the extra "Send another push" button, or cut one genuine call, and set the target honestly.

## Minor

**m1. E1's invoice numbers collide.** Episode-local. The OSINT open invoice is Harlow INV-4471 (`e1:367, 539, 579`). In the defend set Harlow's invoice is INV-2217 (`e1:107, 141`) and PO-4471 is a Pennine oat order (`e1:170`). A learner who just typed INV-4471 meets the same digits on a different supplier. Use INV-2217 in the OSINT, or renumber the PO.

**m2. E1's brief names the wrong recipient.** Episode-local. It says "write one email to Brightwell's accounts team" (`e1:293`, `:4`), but the target is the Finance Manager (`e1:573-575`), who is also the friendly host. Say "to Adaeze, the finance manager".

**m3. E2's flip says the defender "did what it asked"** (`e2:369`), but the learner's application asks for nothing beyond reading a Word CV (`e2:470-485`, kit `CV (Word document)`). The enable-content lure exists only in the defend set. Episode-local. Say "so he opened the attachment", and let the defend round carry the enable-content step.

**m4. E3 and the helpdesk forms hand over the verdict in the caller ID.** Cross-cutting. Impostors are tagged "(mobile, not on file)" and genuine callers "(mobile on file)" (`e3:206, 267`; `pre_helpdesk_ab:112`), so the card header answers the item before the transcript is read. It also suggests caller ID is proof, which the lesson (ring back on the number on file) argues against. Show the number and let the learner compare it with "on file" in the brief, or tag both the same way.

**m5. E3's defend intro lists only the call actions** (`e3:425`), though the set also holds a push with Approve, Deny, and Deny and report. The set brief (`e3:91`) has it right. Episode-local.

**m6. E3's transcripts already do the right thing.** In all four calls the learner's own "You" line offers the callback (`e3:204-260, 265-320, 322-375, 376-410`). For genuine callers the decision is made before the learner chooses, and for impostors the item tests only whether they hold a line the agent already took. Consider one call where "You" is neutral ("Let me see what I can do") so the learner has to supply the check. Episode-local.

**m7. E4 never introduces Yasmin.** Two tells rest on her being the finance approver (`e4:139, 156`), but the set brief (`e4:84`) doesn't say who she is. Add "Yasmin in finance approves payments" to the brief. Episode-local.

**m8. Defend panel copy doesn't fit mixed sets.** Cross-cutting. E4 has no `defendIntro`, so the runner's fixed line "Go through the inbox ..." introduces a set that includes voicemails. E7 resolves to the voice kind, so its button reads "Open the voicemail" (`episode-runner-minigame.js:89-90, 117-138`) over two emails. Give E4 a `defendIntro`. The E7 button is engine copy (needs approval).

**m9. E5's brief skips the email step.** `strings.brief` (`e5:324`) describes building the page and then swapping seats, but not sending the link (the `write` stage). The runner's fixed Write panel covers it. Add "and send one email carrying its link". Episode-local.

**m10. Conclusion screens assume the attack happened, or that the defence went well.** Cross-cutting. "You've written your message, seen it from the other side ..." (`e1:50`, `e2:50`, `e4:50`, `e6:50`) shows even after `flipNoSend`. "You built the page and then caught pages like it" (`e5:50`) shows even if every page was trusted. Word them so they are true for every path ("You've seen both sides of ...").

**m11. E6 defend-only: "staff parking is free"** (`e6_defend:150`) is a fact the learner can't know. This is the defend-only half of M9. Episode-local.

**m12. E7's voice panel heading leans towards technique.** "How a voice gets copied" (`e7_defend:274`) frames the panel as a how-to. Design 11 frames E7 as "verify, don't trust the ear", and E4 uses "A voice is not proof". Use E4's heading and its last sentence. Cross-cutting (consistency).

**m13. E7's copied voicemail says "I'm emailing you the details now"** (`e7_defend:122`), but the email that follows (`e7_ceo_wire`) carries no account details. Say "I've emailed you" and leave the details to a reply. Episode-local.

**m14. E7's confirmed bank change is due "in Friday's run"** (`e7_defend:219`), but the scene is a Friday afternoon. Say "next week's run". Episode-local.

**m15. E7 is cross-role in name only.** Its role is `everyone`, but the seat is the finance office, and the copied voicemail's secrecy tell ("don't wait for Adaeze") assumes the learner knows Adaeze approves payments. The set brief (`e7_defend:60`) doesn't say so. Add one line naming her. Episode-local.

**m16. The E7 attack fragment disagrees with the E7 defend set.** The fragment puts Ravinder "away at a trade show" (`e7/attack.json` intelFacts `brightwell_ceo_travel`), while the defend set has him on the train back from Leeds. The landed reply also uses an em dash. Align before the full shell is built. Fragment-local.

**m17. The "in your contacts" cue appears in one episode and not another.** E4 spells out the genuine voicemail's number as "Catherine (mobile), in your contacts" (`e4:197`ff). E7 shows a name beside a number (`e7_defend:82`) and expects the learner to read that as a saved contact. The E6 SMS cards do the same as E7. Pick one convention. Cross-cutting.

**m18. Verify isn't offered consistently between episodes and checks.** Cross-cutting. E1 teaches Verify, but the finance forms have no `verifyVerdict`. E6 offers Verify and the mobile forms don't. The helpdesk and executive forms do (`pre_*:68`). Scoring treats Verify as Report, so the numbers hold up, but a finance learner taught "ring the supplier" finds no such button in the post-check. Turn it on in the finance forms (both, to keep them parallel), or say in the form brief that Report covers it.

**m19. In the forms, the look-alike comes before the real one.** Row 2 (look-alike supplier or site) precedes row 3 (the real one) in finance, executive and general, and feedback waits until the end, so the real domain is available only if the list shows later senders. HR form B row 8 (`kettlewick-talent.example`) likewise needs row 7 to check against. Swap rows 2 and 3 in both forms of each pair, so the parallelism holds. Cross-cutting.

**m20. Some rows aren't parallel.** Helpdesk B row 1 (`hb_report_calls`, `pre_helpdesk_ba:85`) and general B row 5 (`gb_report_button`, `pre_general_ba:206`) are reminders about reporting, and only form B has them, so B primes its own later items. Helpdesk row 10 is harder in B (`hb_call_new_starter_log`, an account-build request by phone, `pre_helpdesk_ba:354`) than in A (a printer jam). HR row 8 A (`tarrowbey`, checkable against the To address) is easier than B (an added word, checkable only against row 7). Swap in neutral items or match the difficulty. Cross-cutting (checks).

**m21. Check briefs show internal labels.** Every check's `scenario_brief` includes "(pair AB, form A)" or similar (`pre_finance_ab:4` and the other 23). That's organiser detail. Move it to `mission.json` `description`, or drop it. Cross-cutting.

**m22. Step strip labels.** The MFA stage is labelled "Approve" and the flip "Flip" (`step-strip.js:10-11`). "Approve" names the action the lesson says not to take. Use "Prompts" and "Your message". Engine copy, so it needs approval. Cross-cutting.

**m23. A chip for a panel nobody can open.** Every email card in every episode offers "The header checks failed or don't line up" (`triage-flags.js:39`) while `headerPanel` is off. Email cards carry 11 to 13 chips (E4: 7 factors plus 6 channel tells). Extra chips cost nothing, but they slow a non-technical learner down. Hide `senderAuth` when `headerPanel` is off, or set a `flagChips` override. Cross-cutting.

**m24. The flip may describe an exact spoof wrongly** (unverified, check in a playtest). E1, E5 and E6 spoof a trusted sender's exact address (Derek Mason, `it-servicedesk@quayholt.example`, `dev.acharya@tarrowby.example`). The `senderTrust` tell then shows the library sentence "Sender address doesn't match the display name or a known contact" (`phish-rules.js:55`), but in a spoof the address does match. If the flip shows it, give the target a `factorStrings.senderTrust.redFlag` that says the From line was forged. Cross-cutting.

**m25. E5 also runs long on paper.** It adds a `build` stage before `write` and keeps the 13-minute target (`e5:291`). Time it alongside E3 (M11). Episode-local.

**m26. The Monday card never reads the customer slot.** `debrief.mondayCard: "slot:customer_report_route"` is accepted and not read, and every card hard-codes "the way your organisation asks you to" (for example `e1:299`). That's acceptable for the neutral skin, but design 11 §4.3 and §6.3 expect the customer's route to fill it. Log it for productisation. Cross-cutting.

**m27. Defend-only shells carry dead flip copy.** For example "This is the voicemail you scripted" (`e7_defend:266`) and the E1 to E6 flip strings in each `_defend` shell. The runner never shows them, but a later author could. Drop them. Cross-cutting.

**m28. Some of the copy reads as written to a template.** Cross-cutting.
- Every `flipDefenderLine` has the same shape: "<Name> did it between two <tasks>, with <pressure>. It looked like <X>, so <he> started <Y>. People who fall for messages like this are not stupid: this one was built to look right." (`e1:296`, `e2:369`, `e3:419`, `e4:303`, `e5:327`, `e6:313`).
- Every `noBlameLine` ends "busy, not careless", which is a negative parallelism (`e1:298`, `e2:371`, `e3:421`, `e4:305`, `e5:329`, `e6:315`, `e7_defend:269`).
- Every full host opens "That's both sides done, thank you. The trick is the same whichever seat you're in".
- Most `whyFine.default` lines are a triad ending "and nothing to open, pay or sign in to".
- Contrast pairs recur: "Grumbling is not the tell; talking you out of the callback is" (`e3:315`), "Impatience isn't a tell; ..." (`pre_helpdesk_ab:173`), "Hurry on its own isn't the tell; hurry to skip a check is" (`pre_executive_ab:296`), "The fee is never the point; the card details are" (`e6:123`).
- "Take your time: there is no trick to it, just the habits that catch these" (`e6:318`, `e7_defend:272`, runner copy) reads oddly in an episode about tricks.

The design asks for the not-stupid line, so keep its sense. Vary the sentence shapes per episode, and turn some contrast pairs into plain statements ("Talking you out of the callback is the tell").

## Notes for the fixer

- M1, M2, M3, M5 and m4 touch several shells, and the fragments are the source the generators (`gen_*_shells.py`) copy from. Fix the fragment and regenerate, rather than editing shells by hand, or the next regeneration will undo the fix.
- M3, M4, M5, m18, m19 and m20 change the check forms. Change both forms of a pair together and re-check the `_formPairing` table in each fragment, or the forms stop being parallel.
- B1 and m22 touch the README contract or engine copy, so they go to the user (AGENTS.md, "Making judgements without asking").
- Nothing here was run in a browser. M2's meter display, M11's timing and m24's flip sentence should be confirmed in the next playtest.
