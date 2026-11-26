# ca02 (CV lures): lesson options

Written 25 Nov 2026 for the owner's decisions form, in answer to: "what's the lesson of this ca02? Disable macros (they are disabled by default anyway now?) or something about spotting scams, but it's not unreasonable that all the CVs would be viewed?"

No scenario edits have been made. Images are in the scratchpad (paths at the end of each option); they are not committed.

## Where ca02 stands today

What the build already does (from `scenarios/ca02_cv_lures/scenario.json.erb`, the `_defend` twin and the office-kit ink):

- **Attack seat.** The player researches Tarrowby's careers page and Fatima's Friendface post ("just email your CV straight to me"), then fills an application template: vacancy WHO-114, hiring manager Colin Mather, a calm or pushy ask, and an attachment picked from two labels, "CV (Word document)" or "Portfolio (zip archive)". Fatima "opens" it if the pretext names the vacancy and the attachment is a document. Nothing in the attack seat shows or names a macro; the payload is only a label.
- **Defend seat (scored).** Six messages in the recruitment inbox, each sorted Trust, Report or Delete, with tells ticked. Two are traps:
  - `e2_enable_content` (Jordan Kerr, `CV_JKerr_protected.docx`): "For my privacy the document is protected. Click Enable Editing and then Enable Content." Tells: `enable_content_prompt`, `addressedTo`. Its catch sets `kit_key_caught`.
  - `e2_portfolio_lookalike` (Liam Baxter): "CV attached", but nothing is; a link to `tarrowby-careers.example` wants a Tarrowby sign-in. Tells: `lookalike_domain`, `attachmentPlausible`, `linkCredible`.
  - Four genuine: an agency shortlist (3 PDFs), Tendai Shava (PDF), Darius Petrauskas (.docx, "asks you to switch nothing on"), Colin (no attachment).
- **Step-away.** After the sort, "Look up" sends the player into the room. Chidi Okeke (fleet coordinator) barks "Got a CV in for the driver job.", then "Blank page, just a box saying enable editing and content. Do I click?". Choices: report it, click it, or say nothing. The debrief shows the outcome ("Chidi reported it" or "What Enable let in", ending "The gap was a setting: macros in files from email were allowed to run").
- **Concept panel** already says "Many organisations now block macros in files that arrive from the internet, so this trick works less often than it used to."
- **Monday card:** "read CVs in the viewer, and if a document asks you to enable editing or content, don't."

So AC0's second option shape ("Enable Content" as the lure, since macros are off by default) is roughly the status quo. The owner's doubt is fair: as built, the lesson reads as "don't enable macros", and the scored defence rests on one message whose tell is written into the email body.

### Accuracy findings that apply to every option

1. **Macros from the internet are blocked by default.** Since mid-2022 (announced Feb 2022, rolled back briefly on 8 Jul 2022 and resumed on 20 Jul 2022), Office for Windows blocks VBA macros in files carrying the Mark of the Web (downloaded or saved from email) and shows a red "Security risk" bar with no Enable button. A user can only run them by changing file properties or where the organisation has turned the policy off. Chidi's PC text ("Enable editing, then enable content") is accurate only on a machine where that setting is off. The debrief already says so ("The gap was a setting"), but the episode never shows the default.
2. **A `.docx` cannot hold VBA macros.** Macro-bearing Word files are `.docm` or the old `.doc`. `CV_JKerr_protected.docx` with an Enable Content prompt is a technical slip a practitioner would spot. Fix: `.doc`, or leave the extension off the label.
3. **Office files from the internet or email open read-only in Protected View**, usually with a yellow Enable Editing bar, including Darius's genuine `.docx`. The Monday card's "if a document asks you to enable editing ... don't" is a rule staff will break within a day. The safe version: a CV can be read in Protected View or the viewer; you never need to switch anything on to read it, and a blank page that only appears after you do is the tell.
4. **What attackers do instead.** After the macro block, reported campaigns moved to container files (ISO, IMG, ZIP, password-protected archives), shortcut (LNK) files, OneNote attachments, HTML smuggling, and links to a "view my CV" page on a fake file-share or portal. Campaigns aimed specifically at recruiters (Proofpoint's TA4557, reported 12 Dec 2023) open with a harmless email, then send a link to what Proofpoint calls a "fake resume website" once the recruiter replies.

Sources (from knowledge, not fetched this session; check each before quoting on screen):
- Microsoft, "Macros from the internet are blocked by default in Office", Microsoft Learn: https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked
- Microsoft 365 blog, "Helping users stay safe: Blocking internet macros by default in Office" (Feb 2022; the rollout was paused on 8 Jul 2022 and resumed on 20 Jul 2022, so say "since mid-2022" on screen): https://techcommunity.microsoft.com/t5/microsoft-365-blog/helping-users-stay-safe-blocking-internet-macros-by-default-in/ba-p/3071805
- Microsoft Support, "What is Protected View?" (cite for Protected View only: files from the internet open read-only in Protected View; its Enable Editing wording sits in a separate Message Bar section, so do not cite it as saying internet files show Enable Editing): https://support.microsoft.com/en-us/office/what-is-protected-view-d6f09ac7-e6b9-4495-8e43-2bbcdbcb6653
- Proofpoint, "How threat actors are adapting to a post-macro world" (Jul 2022): https://www.proofpoint.com/us/blog/threat-insight/how-threat-actors-are-adapting-post-macro-world
- Proofpoint, "Security Brief: TA4557 targets recruiters directly via email" (12 Dec 2023): https://www.proofpoint.com/us/blog/threat-insight/security-brief-ta4557-targets-recruiters-directly-email
- NCSC, "Phishing attacks: defending your organisation": https://www.ncsc.gov.uk/guidance/phishing
- NCSC, "Macro security for Microsoft Office": https://www.ncsc.gov.uk/guidance/macro-security-for-microsoft-office

### Shared images (all options)

| Image | Path | Shows |
|---|---|---|
| Title art | `public/break_escape/assets/title_art/ca02_cv_lures.jpg` | Episode title card |
| Inbox list | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/d_inbox_list.png` | `t05_inbox_list_runB` 7.5 s: the six rows, 0 of 6 sorted |
| Attack builder | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_builder_filled.png` | `t02_attack_run` 35.7 s: template filled, Attach "CV (Word document)", red flags 0 |

Snippet the form can show beside the inbox (the current trap):

```json
"id": "e2_enable_content",
"from": { "name": "Jordan Kerr", "address": "jordan.kerr.cv@hastypost.example" },
"body": "...For my privacy the document is protected. When it opens, click Enable Editing and then Enable Content at the top of the page, and the CV will appear.",
"attachments": [{ "label": "CV_JKerr_protected.docx", "kind": "document" }]
```

---

## Option A: "A real CV just opens"

**The lesson.** I open every CV, in the viewer; if a CV wants anything more from me than opening it (switch something on, open an archive with a password, follow a link to see it, sign in), that's the one I report.

This keeps the recruiter's job intact (all CVs get viewed) and moves the tell from "macros" to "a second step", which is what still works after the macro block.

**Attack seat, in attacker terms.** The player is told the target's mail filter and Office block the old trick: a macro document from outside is stopped with a red bar. So the lure has to get Fatima to take one extra step herself. The attachment picker becomes a choice of wrapper:
- a Word CV that is blank until content is enabled (Office blocks it by default; it only works where the setting is off, or if she is talked round it);
- a "protected" zip with the password in the email body (the filter cannot look inside);
- no attachment, just a "view my CV" link to a file-share page.
The red-flag meter and Fatima's reply react to each: the blocked macro doc earns "Office stopped it; she sees a red bar", the zip earns "she has to type a password to see a CV, which is odd", the link earns "it asks her to sign in". The player learns why every working lure needs a second action.

**Defend seat: spot and do.**
- Tells: the CV is blank or hidden until you act; a password for a CV; "if the attachment doesn't come through, see it here"; a sign-in to read a CV; instructions about warnings in the email.
- Safe action: read in the viewer or Protected View; never switch content on, unpack a password archive or sign in to read a CV; ask the candidate to resend it as a plain PDF or Word file, or report it.
- One new trap and a reworded chip; the genuine `.docx` and PDFs stay as the contrast ("opened, nothing asked").

**Scenario change.** Size **M**.
- Reused: the six messages, the room, Chidi's step-away and its flags (`kit_ca02_cv_choice`, `kit_ca02_moved`, `kit_ca02_done`), Zainab's ambient knot, Fatima's ink branches, the debrief scaffolding.
- Changed:
  - `e2_enable_content`: attachment label to `CV_JKerr_protected.doc` (accuracy finding 2); `whyFine`/`perFlagNote` say "blank until you switch something on".
  - `e2_cv_docx` (Darius) `whyFine`: "opens in Protected View with a yellow Enable Editing bar; you can read the whole CV without pressing it" (finding 3).
  - `flagChips.enable_content_prompt` renamed in text to "It wants a second step before I can see it" (the id can stay, so `messageGlobals` and `kit_key_caught` still work).
  - `mondayCard`: "Read every CV in the viewer. If one wants a second step to show itself (content switched on, a password, a link or a sign-in), don't take it: ask for a plain copy or report it."
  - `conceptPanel[0]` rewritten: Office now blocks internet macros by default; attackers moved to archives, links and "view my CV" pages; the habit is the second step, whichever form it takes.
  - Attack `payloadKit`: add one archive label "CV (password-protected zip)" and one link-style option if the mail builder supports it; per-kind `factorStrings` lines for the meter and replies. If the builder cannot carry a link, the attack keeps two labels and the debrief names the link form.
- New:
  - one defend message, `e2_cv_password_zip` (seven messages, about +1 minute): a candidate with a "private" zip and the password in the body. Tells: `enable_content_prompt` (second step), `addressedTo` if generic.
  - Chidi's PC text and bark 2 reworded to the blocked default: "Says Microsoft blocked it. The candidate's emailed saying how to get round that. Do I?" (re-voice; allowed under the TTS rule). Choices keep the same three globals.
- Tests and checks: validator, the e2 check-parity audit, node tests for the kit, the ink routes for Chidi's `ca02_cv` knot (maxRun 9), dialogue review on the new lines before TTS.

**Effect on the trailer.** Small.
- `build` (t02 28 to 35.2 s): the Attach picker label may change wording. If the label stays "CV (Word document)" no retake; if it changes, retake `t02_attack_run` and `t02n_attack_run_narrow` (one scripted run each).
- v4b "Attach a CV that hides code." stays true for the doc wrapper.
- `inbox` (t05 run B): the list grows to seven rows; v8a "Six messages wait in the inbox." becomes "Seven messages..." (re-voice v8a, about 3 s) and both inbox takes (`t05_inbox_list_runA/B`, `t05n_inbox_narrow`) need retaking.
- `office` (Chidi bark 1) unchanged; bark 2 is never in the trailer. Hook and Fatima shots unchanged.

**Accuracy note.** Matches Microsoft's default (macros from the internet blocked) and the reported shift to containers and links (Proofpoint 2022, TA4557 2023). The advice is proportionate (NCSC phishing guidance: make reporting easy, do not expect staff to spot everything). Removes the "never Enable Editing" over-reach and the `.docx` macro slip.

**Fun and USP.** Fun 2/3: choosing a wrapper is a real decision (F3) with visible consequences on the meter and reply. USP 3/3: the player sees why the attacker needs the recruiter's help after the default block (O2), which is the clearest offensive-perspective point any option offers, and transfers to a cue staff can see on Monday (O3).

**Flow.**

```
Attacker: macro doc is blocked by default
   -> wraps the CV so Fatima must take one more step
      (enable content / password zip / "view my CV" link)
         |
Recruiter opens it in the viewer, sees it asks for a second step
   |-- takes the step  -> code runs or password goes; HR machine and candidate records exposed
   |-- refuses, asks for a plain copy or reports -> nothing runs; IT blocks the sender
```

**Images.**
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_builder_filled.png` (t02 35.7 s, the Attach picker that would gain wrappers)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_landed_panel.png` (t02 38.6 s, the result panel the meter feeds)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/d_inbox_list.png` (t05 run B 7.5 s, the list that would grow to seven)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/d_card_tendai.png` (t05 run B 13.0 s, a genuine PDF card: the "nothing asked" contrast)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/o_chidi_bark2_enable.png` (t07_chidi_prompt 14.0 s, the bark that would be reworded)

---

## Option B: "Right route, real vacancy"

**The lesson.** CVs for our jobs come in through the recruitment inbox or portal and name a vacancy we actually advertised; one that comes another way, or fits no live vacancy, goes to recruitment unopened.

This answers "it's not unreasonable that all the CVs would be viewed" by agreeing: in recruitment they are, so the attacker goes round recruitment to someone who isn't used to it. It follows the old phishing lab's idea of choosing which NPC would open the file.

**Attack seat, in attacker terms.** The player picks a target, not a wrapper. Fatima is trained and screens everything; the research shows a second vacancy (HGV driver, Shipley depot) and a staff page listing Chidi, the fleet coordinator, who is hiring drivers but is not in HR. Sending to him skips the recruitment inbox, its filter and its habits. The player also sees Fatima's "email your CV straight to me" post as the opening that taught staff to accept CVs from anywhere (`reduceNote` already says this).

**Defend seat: spot and do.**
- Tells: a CV sent to a personal or manager's address rather than `jobs@`; a vacancy reference that doesn't exist or has closed; "Dear Hiring Manager / the vacancy" with no role; a sender who reached the manager through a route the advert never gave.
- Safe action: don't open it on your own machine; forward it to the recruitment inbox (or ask the candidate to apply through the portal); report if it also pushes a second step.
- The inbox becomes a mixed manager's inbox (Chidi's or Colin's) rather than Fatima's, with some genuine items that came the right way.

**Scenario change.** Size **L**.
- Reused: OSINT site (both vacancies already exist), Chidi as the target, the step-away mechanics and flags, the debrief "Reporting it" panel (it already tells this story: "sent the CV straight to Chidi, past the recruitment inbox").
- Changed:
  - `phishTargets`: add `fleet_contact` (Chidi) with its own `primedFor` (driver vacancy), replies and `factorStrings`; Fatima stays as a harder target whose reply says she screens it.
  - Defend set re-cast as a hiring manager's inbox: new `from/to` lines, new `whyFine` texts, two new tells (`wrongRoute`, `unknownVacancy`) which need engine glossary entries and chip strings.
  - Fatima's and Chidi's ink re-pointed; Chidi becomes the inbox owner the player covers, so his step-away moment moves to Fatima or Colin.
  - Flip text (`flipDefenderLineByChoice`) per target.
  - `mondayCard` and concept panel rewritten around the route.
- New: engine tells (`wrongRoute`, `unknownVacancy`) with tests; a jobs-portal object or line in the brief so "the right route" is concrete; re-voice of several Fatima and Chidi lines.
- Risk: in many small firms, emailing a manager directly is normal and fine. The lesson leans on Tarrowby having a stated route; the brief must say so, or it teaches a rule the learner's own workplace may not have.

**Effect on the trailer.** Large.
- `research`, `build`, `lands`, `flip` (all of `t02_attack_run` and its narrow twin): new target and To line, retake.
- `fatima_flip` (F1 "Your application has gone to the recruitment inbox...") no longer fits; new line, re-voice and retake.
- `topic`, `inbox` (t05 runs A and B, narrow): new inbox owner and tab name; retake; v1b ("A recruiter opens CVs from strangers all day.") and v8a/v8b re-written and re-voiced.
- `office` and the hook would need re-checking against the new step-away; v5 ("Email it to Fatima, the recruiter.") changes.
- Roughly a new trailer edit on the same structure.

**Accuracy note.** True to how recruiter-targeted campaigns pick victims (Proofpoint TA4557: recruiters and hiring staff contacted directly, often with a harmless first email). NCSC phishing guidance supports clear processes over spotting ("make it easy for staff to check"). Weaker on the file side: it says little about what the file does once opened, so the macro and container points move to the concept panel only.

**Fun and USP.** Fun 2/3: target choice is a fresh decision across the course, but the defend half becomes a process check that is less tactile than spotting a CV that won't open. USP 3/3: choosing the softer person in the org, and why (no screening habit, a public "email me" post), is attacker reasoning in its plainest form (O1, O2). Transfer (O3) depends on the learner's own organisation having a route.

**Flow.**

```
Attacker: recruitment screens CVs
   -> finds a manager hiring drivers outside HR (Chidi) and mails him directly
         |
Manager sees a CV that skipped the jobs inbox, for a role he can't match to an advert
   |-- opens it on his own machine -> second step taken, his PC and the driver applications exposed
   |-- forwards it to recruitment unopened / reports -> screened in the normal route; attacker blocked
```

**Images.**
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_careers_noted.png` (t02 16.2 s, careers page with both vacancies noted)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_builder_filled.png` (t02 35.7 s, the To line that would become a target choice)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/o_chidi_bark1.png` (t07_chidi_prompt 7.2 s, "Got a CV in for the driver job." at Chidi's desk)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/f_fatima.png` (t04 12.0 s, Fatima's F1, the line that would no longer fit)

---

## Option C: "The warning is the protection: don't work round it"

**The lesson.** My computer already stops most booby-trapped CVs; if a CV or its sender tells me how to get past a warning or a block, that is the attack, and I report it.

This is the direct answer to "macros are disabled by default anyway": yes, so the modern lure is the coaching that talks staff past the block.

**Attack seat, in attacker terms.** The attachment stays a Word CV. The new choice is the covering line: plain ("CV attached") or coaching ("My CV is protected for privacy. If Word shows a warning, save it to your desktop and open it from there, then click Enable Content"). The meter and reply show the trade: plain lands but the macro is blocked, so nothing runs; coaching gets past the block only if she follows it, and it adds a red flag to the message. The player learns the attacker cannot beat the setting alone and needs the recruiter to switch it off for them.

**Defend seat: spot and do.**
- Tells: instructions about warnings, saving, unblocking or enabling, in the email or on the page; a red "Security risk" bar, or a document blank behind it.
- Safe action: leave it blocked, don't follow the steps, report it. Genuine CVs open without any of this.

**Scenario change.** Size **S**.
- Reused: all six messages, the room, the step-away and its flags, the attack template system, Fatima's and Zainab's ink.
- Changed:
  - `e2_enable_content` body: adds the "save it and open it from your desktop" coaching; label to `.doc` (finding 2); `perFlagNote` names the coaching as the tell.
  - `e2_cv_docx` `whyFine` and the Monday card fixed for Protected View (finding 3).
  - `flagChips.enable_content_prompt` text: "It tells me how to get round a warning".
  - `conceptPanel[0]`: lead with the default block, then "so the lure is the instructions".
  - Chidi's PC `requiresItemHintVariants` text: "A red bar: Microsoft has blocked macros because the source is untrusted. Below it, the candidate's email says how to get round that." Bark 2 reworded to match ("Microsoft's blocked it. He's sent steps to get round it. Do I?"), re-voiced. Choice text "Click it. Word says that about anything downloaded from email." changes to "Follow his steps. It's only a CV."
  - The debrief's "What Enable let in" keeps "The gap was ..." but now says Chidi switched the protection off himself.
- New: one ask template (`ask_coach`) in the attack `templates` with a `factorStrings` red flag; no new engine work.
- Checks: validator, ink routes for `ca02_cv`, dialogue review on the reworded lines, then TTS.

**Effect on the trailer.** Minimal.
- `build`: an extra ask option exists but the take uses the calm ask, so no retake.
- `inbox`: same six rows; the opened card is Tendai's, unchanged. No retake.
- `office`: bark 1 unchanged; bark 2 not in the trailer. No retake.
- v4b "Attach a CV that hides code." still true. No VO changes.

**Accuracy note.** Accurate to the mid-2022 default (Microsoft Learn on internet macros) and to how blocked-macro lures now read: the document or email carries instructions to unblock or re-save. It stays narrower than reality, because it keeps the macro document as the only file lure and leaves containers and links to one concept-panel sentence. NCSC macro guidance backs keeping the block on and reporting.

**Fun and USP.** Fun 1/3 to 2/3: one extra template choice and a reworded step-away; the defend half plays the same. USP 2/3: the "attacker needs you to switch the protection off" point is clear and honest, but the player chooses wording rather than method, so attacker reasoning is shown thinly.

**Flow.**

```
Attacker: macro doc will be blocked by default
   -> adds instructions: "save it, open it from your desktop, enable content"
         |
Recruiter sees the red bar, and steps telling her how to get past it
   |-- follows the steps -> protection off, code runs; HR machine exposed
   |-- leaves it blocked and reports -> nothing runs; IT blocks the sender
```

**Images.**
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/o_lookup_panel.png` (t07_chidi_prompt 4.1 s, Look up panel before the step-away)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/o_chidi_bark2_enable.png` (t07_chidi_prompt 14.0 s, the bark that would name the block)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/h_zainab.png` (t07_zainab_hook 5.5 s, Zainab's "scare with an application" hook, unchanged)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_reply.png` (t02 44.1 s, Fatima's reply in the mail client, which would vary with the ask)
- `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca02_lesson/a_flip.png` (t02 46.0 s, "Now it lands on you")

---

## Side by side

| | A: a real CV just opens | B: right route, real vacancy | C: don't work round the warning |
|---|---|---|---|
| Recruiter still opens every CV | Yes | Yes (in recruitment); managers forward | Yes |
| Still true after the macro block | Yes, covers archives and links | Yes, file-agnostic | Yes, but macro-only |
| Attack-seat choice | Wrapper (method) | Target (person) | Covering line (wording) |
| Size | M | L | S |
| Trailer | Retake inbox takes, re-voice v8a; maybe build | Most shots retaken, several VO lines | None |
| Fun / USP | 2 / 3 | 2 / 3 | 1-2 / 2 |

## Recommendation

**Option A**, with Option C's Chidi rewording folded in (it is cheap and makes the step-away honest about the default block).

Why: it gives the owner a one-line lesson that holds whatever Office's settings are ("a real CV just opens; anything that wants a second step gets reported"), and it never asks a recruiter to stop opening CVs. It is the only option where the attack seat teaches the reason attackers changed method after 2022, which is the episode's best offensive-perspective moment. The cost is moderate: one new inbox message, reworded chips and debrief, one re-voiced Chidi bark, and a retake of the inbox takes plus one VO line. Option B is a good lesson for a different episode (managers outside HR receiving CVs) but would re-cast the defend inbox and most of the trailer. Option C is the smallest fix but leaves ca02 looking like a macro episode in 2026.

Whichever is picked, accuracy findings 2 and 3 (the `.docx` label and the "never enable editing" Monday card) should be fixed.

## Assumptions

- Assumption: the source URLs above come from knowledge, not a fetch this session; each needs a check before it appears on screen.
- Assumption: the mail builder's support for a link-type payload in Option A is unverified; Option A is scoped to work with two archive/document labels if it has none.
- Assumption: a seventh inbox message adds about a minute; no timing run was done.
- Assumption: the `_defend` twin (`scenarios/ca02_cv_lures_defend`) is generated from the same set by `gen_e2_e4_shells.py`, so inbox changes land in both; not re-checked line by line.
