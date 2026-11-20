# W2_LINES_H3 — P-H3 host blocks and layers 0/1 (ca13–ca20, incl. ca17 fragment + ca13 twin)

Package P-H3. Episodes ca13, ca14, ca15, ca16, ca17, ca18, ca19, ca20. Written to npc-dialog-review SKILL.md §2l (P1–P13) and WAVE2_BUILD v4 §2.1, §2.7, D1/D2, D3, D4, D9, D13. Host blocks and layers 0/1 committed `51caba7be`; fragment layer 1 (e13–e20), ca13 twin panel and twin host line committed `158c0844b`.

Host lines are voiced; layer 0 and layer 1 are static debrief text, unvoiced (outside the line budget, listed `written`). Every voiced host line is ≤30 words. Host blocks sit above the existing defend-complete branch, gated `{ kit_defend_done && not kit_<ep>_host_said: ... }`, with the outcome beat branching `{ kit_key_caught: { kit_caught: CATCH - else: PARTIAL } - else: MISS }` then a single HABIT clip, and set `~ kit_<ep>_host_said = true`. Two "lines" per shell (D4: the outcome beat + the habit beat); clip count ≤5. ca17 has no host line (D1/D2). ca13 twin carries one two-way host line (written, unvoiced).

## Notes for the reviewer

- **O/E layer 0 is scene-free in wave 2 (D3).** Wave-2 O/E shells have `setPiece: null`, so layer 0 names no room scene; the appendix's "In the room the learner just watched…" sentences were dropped from every P-H3 layer 0 (this affects the O/E tier shells, ca15 and ca19 especially, and all seven full shells carry scene-free layer 0).
- **New ca14 heading "Where your posts lead".** ca14's full shell had no `conceptPanel` (only a `privacyPanel`); one was created at `social.awarenessEpisode.strings.conceptPanel` with heading **"Where your posts lead"** (layer 0 + layer 1). Confirm the heading.
- **ca13 semicolon change.** ca13's full-shell layer-0 inner semicolon was changed to `, and` (panel-cosmetic, unvoiced text) so the passage carries no semicolon. Fragment/twin layer-1 panels carry no semicolons either (ca20's two-semicolon layer 1 is unvoiced panel text, P13 does not apply).
- Host blocks pulled the template's HABIT out of the two outcome branches into one shared clip after the outcome conditional; behaviourally identical, one fewer clip.

## keyMessage list (D13) — id per shell, in the first triage set (with an outcome) of both full shell and twin fragment

| ep | keyMessage id | why (the message the incident turns on) |
|---|---|---|
| ca13 | `e13_supplier_injection` | the prompt-injection invoice riding on the AI assistant's summary; the assistant-specific lesson |
| ca14 | `e14_fake_merrin` | the second account opened in the partner's name |
| ca15 | `e15_posted_stick` | the posted USB-stick item the host habit (hand it in unopened) turns on |
| ca16 | `e16_shared_login_req` | the request to borrow a sign-in (Reuben Ofori) |
| ca17 | `e17_meeting_app` | **see ca17 decision below** |
| ca18 | `e18_lockout_fake` | the fake lockout → look-alike sign-in page |
| ca19 | `e19_ransom_note` | the reported ransomware; the host block narrates an incident that happened and reporting limited |
| ca20 | `e20_wifi_page_fake` | the look-alike Wi-Fi page that captures the work password |

### ca17 keyMessage decision — `e17_meeting_app` (over `e17_free_tool`)

ca17 (`ca17_acceptable_use_defend`) is defend-only and carries **no host block**, so the pick turns on the fragment's layer 1. Both candidates are `unapproved_tool` phish. Picked **`e17_meeting_app`** ("install Roomcall first"):

1. Layer 1's leading concrete cost, "a service blocked and left to unpick", is the installed meeting app that IT must later remove — it maps to the meeting-app item, not the free converter.
2. It is the canonical "ask first before you install" item: its `ifTrusted` ("you install software the firm hasn't checked onto a work laptop") is the more serious, more teachable harm (unknown software / malware vector) than the free tool's "the firm's file goes to an unchecked third party".
3. It is the anchor (first) message in the single triage set — the set's headline acceptable-use card.
4. It keeps the D13 id stable for integration (the handover already recorded it).

Alt for I if `e17_meeting_app` fails an integration check: `e17_free_tool` (its "ask first, the service desk usually answers the same day" note also echoes layer 1's "checking first … is never the slow option").

Note: none of the six e17 messages carries an `outcome` field (acceptable-use set, consequence-only), so the pick is the message the ask-first lesson turns on, not an outcome-bearing one.

## Replaced-sentence list (D9) — full shells

Full-shell layers were appended in `51caba7be`; the one existing sentence cut per shell (so net growth ≤ +1):

| ep | cut sentence | where |
|---|---|---|
| ca13 | `No hacking.` | conceptPanel "Where the fakes came from" (fragment of the prior sentence) |
| ca14 | (none cut — panel created new) | — |
| ca15 | `We name nobody.` | conceptPanel "About that stick" (carried by "an authorised test…") |
| ca16 | `Facts, not a verdict, let the right person look into it fairly.` | last card "The report you built" |
| ca18 | `These are set up for you; you don't have to switch them on.` | last card "What the practice does" |
| ca19 | `If you didn't start it, deny it and report it.` | last card "Allow this app?" |
| ca20 | `, and keep work devices for work, not for family or a quick game` | last card "At home…" |

## Fragment append-vs-replace (e13–e20, committed `158c0844b`)

Following the P-H1 (e2–e5) / P-H2 (e6–e11) model — **array panels keep their teaching cards (append a card); single-object panels are replaced; a missing panel is created**:

| ep | fragment panel shape | action | fragment card heading |
|---|---|---|---|
| e13 | single object | REPLACE text | "If the summary is trusted" |
| e14 | none | CREATE object | "If a trusted reply goes back" |
| e15 | single object | REPLACE text | "If the quick route is taken" |
| e16 | array | APPEND card | "If a login is lent" |
| e17 | array | APPEND card | "If an ask-first choice is waved through" |
| e18 | array | APPEND card | "If one account opens" |
| e19 | array | APPEND card | "What the choice costs" |
| e20 | array | APPEND card | "If a work password goes in" |

ca13's twin (`ca13_ai_assistant_defend`, hand-authored) carries the e13 fragment panel byte-for-byte (parity). The other six twins (ca14–ca20 `_defend`) take their panel from the fragment at regeneration (P-GEN); this package does not hand-edit them, so proof5 shows those seven twin erbs differing until they are regenerated (see check results).

---

## Host lines (voiced) — new-lines table

| id | file | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca13-Hc | scenarios/ca13_ai_assistant/ink/gwen_pritchard.ink | Gwen Pritchard | Sulafat | You flagged the request that rode on the assistant's summary, so the attacker's staged call walked away with nothing. | host | voiced | CATCH |
| ca13-Hp | scenarios/ca13_ai_assistant/ink/gwen_pritchard.ink | Gwen Pritchard | Sulafat | You caught the one that mattered, the request leaning on the assistant's summary, before it turned into a payment or a shared list. | host | voiced | PARTIAL |
| ca13-Hm | scenarios/ca13_ai_assistant/ink/gwen_pritchard.ink | Gwen Pritchard | Sulafat | The assistant sounded certain, which is the whole trap, so a small invoice slipped out, or the customer list went out on a staged call. | host | voiced | MISS |
| ca13-Hh | scenarios/ca13_ai_assistant/ink/gwen_pritchard.ink | Gwen Pritchard | Sulafat | When something wants money moved or a list shared, check it on a route you already trust, never through the assistant. | host | voiced | HABIT |
| ca14-Hc | scenarios/ca14_social_media/ink/julian_sallow.ink | Julian Sallow | Rasalgethi | You checked the new contact before you answered, so the account trading on a partner's name got nothing out of the studio. | host | voiced | CATCH |
| ca14-Hp | scenarios/ca14_social_media/ink/julian_sallow.ink | Julian Sallow | Rasalgethi | You stopped the one worth stopping, the message wearing a colleague's name, before it collected anything useful. | host | voiced | PARTIAL |
| ca14-Hm | scenarios/ca14_social_media/ink/julian_sallow.ink | Julian Sallow | Rasalgethi | It knew real details and wore a trusted name, so one reply handed over a security answer we then had to reset. | host | voiced | MISS |
| ca14-Hh | scenarios/ca14_social_media/ink/julian_sallow.ink | Julian Sallow | Rasalgethi | A new contact gets checked by a route you already know before you tell them anything, however well they seem to know us. | host | voiced | HABIT |
| ca15-Hc | scenarios/ca15_shadow_it/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | You routed it the approved way and handed the stick in unopened, so there was no gap for anyone to walk through. | host | voiced | CATCH |
| ca15-Hp | scenarios/ca15_shadow_it/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | You dealt with the one that mattered before a client pack left through a service we can't account for. | host | voiced | PARTIAL |
| ca15-Hm | scenarios/ca15_shadow_it/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | A deadline makes the quick route look obvious, but that's the one that lands a client's whole file somewhere we can't reach. | host | voiced | MISS |
| ca15-Hh | scenarios/ca15_shadow_it/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | Bring a found stick, or a tool that feels too slow, to me. Don't route round it, even for a deadline. | host | voiced | HABIT |
| ca16-Hc | scenarios/ca16_insider_risk/ink/anjali_rao.ink | Anjali Rao | Kore | You kept your sign-in to yourself and sent the handover the proper way, so every action still points at whoever actually did it. | host | voiced | CATCH |
| ca16-Hp | scenarios/ca16_insider_risk/ink/anjali_rao.ink | Anjali Rao | Kore | You held the line on the one that counted, the sign-in someone wanted to borrow, before your name ended up on their work. | host | voiced | PARTIAL |
| ca16-Hm | scenarios/ca16_insider_risk/ink/anjali_rao.ink | Anjali Rao | Kore | Lending a login feels kind, but then an audit shows your name on things you never touched, and there's no untangling it. | host | voiced | MISS |
| ca16-Hh | scenarios/ca16_insider_risk/ink/anjali_rao.ink | Anjali Rao | Kore | A sign-in stays yours alone, and a handover goes through the shared place. For a real lockout, send them to the service desk. | host | voiced | HABIT |
| ca18-Hc | scenarios/ca18_credential_attacks_at_scale/ink/ama_owusu.ink | Ama Owusu | Autonoe | You read the page before you signed in, so the fake alert got nothing and the spraying had nothing to open. | host | voiced | CATCH |
| ca18-Hp | scenarios/ca18_credential_attacks_at_scale/ink/ama_owusu.ink | Ama Owusu | Autonoe | You stopped the one that mattered, the lookalike sign-in page, before a reused password turned into a live account. | host | voiced | PARTIAL |
| ca18-Hm | scenarios/ca18_credential_attacks_at_scale/ink/ama_owusu.ink | Ama Owusu | Autonoe | The alert looked like us and you were trying to protect your account, but the password went to their page, and that opens a lot. | host | voiced | MISS |
| ca18-Hh | scenarios/ca18_credential_attacks_at_scale/ink/ama_owusu.ink | Ama Owusu | Autonoe | A unique password per account in a manager, plus MFA, is the one habit that beats both spraying and stuffing. | host | voiced | HABIT |
| ca19-Hc | scenarios/ca19_malware_and_updates/ink/anjali_rao.ink | Anjali Rao | Kore | Reporting fast is why it stopped at one desk. The machine you restarted stayed up while the other had to be pulled off the network. | host | voiced | CATCH |
| ca19-Hp | scenarios/ca19_malware_and_updates/ink/anjali_rao.ink | Anjali Rao | Kore | You caught the one that mattered in time to keep it from spreading further than it did. | host | voiced | PARTIAL |
| ca19-Hm | scenarios/ca19_malware_and_updates/ink/anjali_rao.ink | Anjali Rao | Kore | Every choice was the normal busy-afternoon one, which is the point, and this time it cost claims work and a weekend of rebuilds. | host | voiced | MISS |
| ca19-Hh | scenarios/ca19_malware_and_updates/ink/anjali_rao.ink | Anjali Rao | Kore | Restart when the machine asks, and report anything odd straight away. That's what keeps one bad click from becoming everyone's week. | host | voiced | HABIT |
| ca20-Hc | scenarios/ca20_remote_and_mobile_working/ink/zainab_hussain.ink | Zainab Hussain | Achernar | You treated the lookalike network as the trap it was, so no work password ever reached their page. | host | voiced | CATCH |
| ca20-Hp | scenarios/ca20_remote_and_mobile_working/ink/zainab_hussain.ink | Zainab Hussain | Achernar | You stopped the one that counted, the page after your work password, before it opened the account. | host | voiced | PARTIAL |
| ca20-Hm | scenarios/ca20_remote_and_mobile_working/ink/zainab_hussain.ink | Zainab Hussain | Achernar | Working on the move is the job, but a password typed on a lookalike network is an account someone can use from another town. | host | voiced | MISS |
| ca20-Hh | scenarios/ca20_remote_and_mobile_working/ink/zainab_hussain.ink | Zainab Hussain | Achernar | Treat a network named like the venue's as a trap, and ring in the moment a device goes missing. Reported fast, it's locked in minutes. | host | voiced | HABIT |

Counts: host **14 lines** (7 shells × 2 beats: outcome + habit), clips = 4 per shell (CATCH/PARTIAL/MISS + HABIT) = 28 clips. Against P-H3 budget 14 host lines: on budget. ca17 host = 0 (correct, D1/D2).

## ca13 twin host line (written, unvoiced) — `scenarios/ca13_ai_assistant_defend/ink/gwen_pritchard.ink`

The existing `episode_e13_ai_assistant_defend_defend_complete` branch is split on `kit_key_caught` (`VAR kit_key_caught = false` declared), one clip each:

| id | branch | line |
|---|---|---|
| ca13-Tc | caught | Gwen Pritchard: You checked that one on a route you trust instead of taking the assistant's word, so nothing was paid and no list went out. |
| ca13-Tm | miss | Gwen Pritchard: That was the one to check on a route you trust. On the assistant's word, it's a small payment gone or the customer list shared. |

Twin line count: 1 (two-way). P-H3 budget: host 14 + twin 1 = **15**. On budget.

## Layer 0 and layer 1 (written, unvoiced)

Full-shell format in the erb `strings.conceptPanel.text` (or the last card of an array panel): layer 0 (opens "To a real attacker"), `\n\n`, layer 1 (ends "… have a word with <host first name>."). The fragment (`AW/e<n>/defend.json`) and the twin carry layer 1 only — no "To a real attacker", no pointer, no "you". Full and fragment layer 1 share a run of ≥8 words (P-TEST parity, verified green).

### ca13 (host Gwen) — erb conceptPanel heading "Where the fakes came from" (kept)
- Layer 0: "To a real attacker, the brief you handed the assistant is a small payment banked or Brightwell's customer list handed to a stranger. With the payment they come back for the next one; with the list they ring those customers in a trusted voice, already knowing what each one orders. Checking a request through a route you already trust, rather than acting on the assistant's confident summary, stops both before either leaves the building."
- Layer 1 (erb): "When the summary is trusted instead, a small invoice is paid to a stranger and chased for weeks for more than it was worth, or customers field calls asking why they were contacted, and someone loses the afternoon putting it right. Before you leave, have a word with Gwen."
- Fragment/twin layer 1 (heading "If the summary is trusted"): "When an assistant's summary is trusted without a second check, a small invoice is paid to a stranger and chased for weeks for more than it was worth, or customers field calls asking why they were contacted, and someone loses the afternoon putting it right."

### ca14 (host Julian) — erb conceptPanel heading "Where your posts lead" (CREATED)
- Layer 0: "To a real attacker, the message you composed under a colleague's name is the start of a second account in a partner's name that the studio trusts. The next move is to trade on that borrowed name, nudging someone into resetting a security answer or opening a warmer approach to the rest of the office. Checking a new contact by a route you already know leaves the fake account and its flattery with nowhere to go."
- Layer 1 (erb): "A handful of public posts, a leaving card, a lanyard, a pet, were enough to build the approach, and one trusted reply gave up a security answer that then had to be reset. A week on, the fake partner account was reported and the studio had the awkward round of comparing notes. Before you leave, have a word with Julian."
- Fragment layer 1 (heading "If a trusted reply goes back"): "A handful of public posts, a leaving card, a lanyard, a pet, are enough to build the approach, and one trusted reply gives up a security answer that then has to be reset, with a fake partner account reported a week later and an awkward round of comparing notes."

### ca15 (host Nilesh) — erb conceptPanel heading "About that stick" (kept)
- Layer 0: "To a real attacker this episode has no villain of its own, but the route you chose for the client pack, or the found stick you decided about, leaves a gap worth taking. Whoever dropped that stick to be found, or runs the free service the pack went to, gains a way onto a work machine, or a copy of a whole logistics client's consignment file, names, addresses and delivery schedules, that nobody can account for. Handing a found stick to IT unopened and routing files only through approved tools means neither gap ever opens."
- Layer 1 (erb): "Six months on it surfaces: a service nobody can reach still holds the client pack with no contract behind it, or a machine has to be wiped and rebuilt, and the clean-up means finding every copy, proving deletion and answering the client. Before you leave, have a word with Nilesh."
- Fragment layer 1 (heading "If the quick route is taken"): "Six months on it surfaces: a service nobody can reach still holds the client pack with no contract behind it, or a machine has to be wiped and rebuilt, and the clean-up means finding every copy, proving deletion and answering the client."

### ca16 (host Anjali) — array panel, layers on last card (keep existing defend-complete hub line in `- else:`)
- Layer 0: "To a real attacker, the sign-in you were asked to lend, and the leaver's export you could have waved through, are a way to act as someone else with no trail back and company data sitting in a personal inbox beyond the firm's reach. The next move is to do the work under the lender's name so any audit points the wrong way, or to keep the exported data long after the leaver has gone. Keeping a sign-in to yourself and sending handovers through the shared place keeps every action tied to the person who did it."
- Layer 1 (erb): "Under a shared login, everything the other person did is logged as yours, and the audit conversation that follows is about actions that were never yours, while the leaver's export has to be tracked down and recalled from a personal inbox. Before you leave, have a word with Anjali."
- Fragment layer 1 (card heading "If a login is lent"): "Under a shared login, everything the other person did is logged as the lender's, and the audit that follows is about actions that were never theirs, while the leaver's export has to be tracked down and recalled from a personal inbox."

### ca17 (fragment only — defend-only, no host line, no layer 0)
- Fragment layer 1 (card heading "If an ask-first choice is waved through"): "When an ask-first choice is waved through instead of checked, the small costs the cards describe land for real: a service blocked and left to unpick, a licence nobody bought, or a quiet rule bent until the day it matters. Checking first when you are unsure is never the slow option." (consequence-only, acceptable-use topic, names no staged incident)

### ca18 (host Ama) — array panel, layers on last card
- Layer 0: "To a real attacker, the guess list you built and sprayed hands back a few working sign-ins, each one worth trying across every other service the firm uses. The next move is a fake lockout alert that draws the password onto a look-alike page, turning one reused pair into a live account that opens work email, client project files and a supplier portal. Reading the address in the bar before signing in is where that breaks, so the fake alert never gets the password."
- Layer 1 (erb): "One opened account reached client files and the finance controller's mail, so the cost ran from a single password up to a confidentiality and near-payment incident, and the provider spent the afternoon forcing resets and combing the sign-in logs. Before you leave, have a word with Ama."
- Fragment layer 1 (card heading "If one account opens"): "One opened account reached client files and the finance controller's mail, so the cost ran from a single password up to a confidentiality and near-payment incident, and the provider spent the afternoon forcing resets and combing the sign-in logs."

### ca19 (host Anjali) — array panel, layers on last card (keep existing defend-complete hub line in `- else:`; incident happened, host says what reporting limited, never that the sweep was prevented)
- Layer 0: "To a real attacker, the restart you postponed, the macro you enabled or the protection you allowed off is a program running with your access. The next move is for that program to reach a shared drive and lock the machines behind it, so one busy afternoon's choice stops claims work and costs a weekend of rebuilds. Restarting when asked and reporting fast keeps the program off the machine and limits how far any infection reaches."
- Layer 1 (erb): "Depending on the choice, the team loses a weekend to rebuilds, claims work stops for hours, or a desktop-only file is gone for good, so the real cost is the lost time, not just a locked screen. Before you leave, have a word with Anjali."
- Fragment layer 1 (card heading "What the choice costs"): "Depending on the choice, the team loses a weekend to rebuilds, claims work stops for hours, or a desktop-only file is gone for good, so the real cost is the lost time, not just a locked screen."

### ca20 (host Zainab) — array panel, layers on last card (keep existing defend-complete hub line in `- else:`)
- Layer 0: "To a real attacker, the work password you typed on the look-alike network page is a working account to sign in to from another town, with the alarm code read aloud and the left-behind device the reusable code and the open inbox behind it. The next move is to use that account from wherever they are, reuse the overheard code, or read the lost device until it is wiped. Treating a look-alike network as a trap and reporting a lost device at once shuts each of these before it is any use."
- Layer 1 (erb): "A captured password means an account used from elsewhere, reset and traced; an overheard alarm code forces the client to re-key and re-issue it; a device reported late stays readable until it is wiped, while one reported at once is locked within minutes. Before you leave, have a word with Zainab." (unvoiced panel text; two semicolons allowed, P13 applies to spoken lines only)
- Fragment layer 1 (card heading "If a work password goes in"): "A captured password means an account used from elsewhere, reset and traced; an overheard alarm code forces the client to re-key and re-issue it; a device reported late stays readable until it is wiped, while one reported at once is locked within minutes."

Layer 0: 7 written (scene-free, D3). Layer 1: 7 erb + 8 fragment (e13–e20, including the ca17 fragment) + 1 twin (ca13) written.

## Check results (commit `158c0844b`)

- `validate_scenario.rb --strict-social --no-graph`: **0 ERROR** on ca13_ai_assistant, ca14_social_media, ca15_shadow_it, ca16_insider_risk, ca17_acceptable_use_defend, ca18_credential_attacks_at_scale, ca19_malware_and_updates, ca20_remote_and_mobile_working, ca13_ai_assistant_defend.
- `dialoguelint --json`: no errors on the same nine (one pre-existing `warn` exit-no-reply on ca13 twin's existing "Understood." choice).
- `bin/inklecate`: ca13 twin gwen_pritchard.ink compiles clean; the compiled .json carries `kit_key_caught`.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs test/js/office-kit-quiet-and-stub.test.mjs`: 2883 pass / 1 fail = `social-mail-ink-runner.test.mjs`, which **passes when run alone** (pre-existing flake under the combined run, outside P-H3). The arbiter `social-awareness-office-kit.test.mjs` passes **28/28** alone.
- `python3 -m unittest test_office_kit`: **74 OK**.
- `python3 proof5.py`: 34 diffs = 27 pre-existing baseline + **7 new, all P-H3**. The 7 new are the generated twins `ca14_social_media_defend`, `ca15_shadow_it_defend`, `ca16_insider_risk_defend`, `ca17_acceptable_use_defend`, `ca18_credential_attacks_at_scale_defend`, `ca19_malware_and_updates_defend`, `ca20_remote_and_mobile_working_defend` (`scenario.json.erb`): each takes its conceptPanel from the fragment, so the new fragment layer 1 won't match the committed twin until P-GEN regenerates it. The 27 baseline diffs are P-H1 (ca02–ca05) and P-H2 (ca06–ca11) host-ink/erb hand edits, the known `ca00/ink/anjali_rao.ink`, and the ca14–ca20 twin inks tightened by prior dialogue commits (e56f3739e, 2dd2541cb) — none are P-H3.

## npc-dialog-review verdict
Pending: opus48 npc-dialog-review runs on this batch before any voicing question (§2.1). Self-check against §2l (P1–P13): host lines are single well-made sentences, no P1/P9 fragment strings, no P13 written punctuation in voiced lines, no figure repeated from layer 1, each ≤30 words; the attacker's side is told in attacker terms in the MISS/CATCH beats. Verdict/commit to be recorded by the reviewer.
