# W2_LINES_H2 — P-H2 host blocks and layers 0/1 (ca06–ca11)

Package P-H2. Episodes ca06, ca07, ca08, ca09, ca10, ca11. Written to npc-dialog-review SKILL.md §2l (P1–P13) and WAVE2_BUILD v4 §2.1, §2.7, D4, D5/O1.

Host lines are voiced; layer 0 and layer 1 are static debrief text, unvoiced (outside the line budget, listed `written`). Every voiced host line is ≤30 words. Host blocks sit above the existing defend-complete branch, gated `{ kit_defend_done && not kit_<ep>_host_said: ... }`, CATCH/PARTIAL/MISS on `kit_key_caught` then `kit_caught`, and set `~ kit_<ep>_host_said = true`. Two lines per shell (D4: one the attacker's side in attacker terms, one the human side), 5 clips max.

## keyMessage list (D13) — candidate id per shell, verified present in the first triage set of both full shell and twin fragment, each with an outcome

| ep | first triage set | keyMessage id | why (the message the incident turns on) |
|---|---|---|---|
| ca06 | e6_phone_messages | `e6_parking_permit` | the QR parking-permit lure the attack half built and the flip replays; card/sign-in track |
| ca07 | e7_finance_line | `e7_ceo_wire` | the "Need this paid today" email the released payment turns on |
| ca08 | e8_used_account | `e8_push_abroad` | the unexpected sign-in push; the approval is the point of no return |
| ca09 | e9_lock_it_down | `e9_fake_it_number` | the IT-impersonation "read back the number" that harvests the code |
| ca10 | e10_browser_morning | `e10_fake_check` | the fake human-verification step on the bookmarked portal lookalike |
| ca11 | e11_carrholme_desk | `e11_wrong_sam_breach` | the misdirected staff-health spreadsheet, the episode's own incident |

Alternatives considered (named for I if the primary fails the outcome check): ca06 `e6_mfa_scan` (work-sign-in track); ca08 `e8_locked_files`; ca09 `e9_push_unstarted`.

## Replaced-sentence list (D9) — one existing sentence per shell the layer-1 passage supersedes

| ep | replaced / recommended-trim sentence | applied? |
|---|---|---|
| ca11 | strings.conceptPanel.text "If a spreadsheet, a form or an email about someone goes astray, tell the data protection lead straight away. Reporting fast is what limits the harm." — the old mini-panel, replaced in full by the layer 0/1 passage | APPLIED (object text replaced) |
| ca06 | recommended trim: strings.flipMissed duplicate routing sentence (unvoiced flip copy) | DEFERRED to the post-wave-2 timing pass (D9) — named, not deleted |
| ca07 | recommended trim: one sentence of the "First steps"/flip recovery copy now carried by layer 1 | DEFERRED (D9) |
| ca08 | recommended trim: one recovery sentence in conceptPanel "First steps and recovery" now carried by layer 1 | DEFERRED (D9) |
| ca09 | recommended trim: one sentence of the flip cost copy | DEFERRED (D9) |
| ca10 | recommended trim: one sentence of the "If you slipped" recovery copy | DEFERRED (D9) |

Note to I / timing pass: for ca06–ca10 the layer passage is **appended** to the existing conceptPanel (array shells) or added (ca06/ca07), so the net sentence growth exceeds +1 until the recommended trim is applied. D9 makes the human timing runs after wave 2 the gate, so the trims are left named for that pass rather than cutting tested, shared debrief copy under this package. Only ca11 is a true in-place replacement.

## D225 / O1 HOLD — legal-duty wording in layer 1 (ca08, ca11 are P-H2's)

Per the task hold, the duty wording uses recommended **option A** (accurate, plain UK GDPR duty) as a placeholder until D225 is answered. Each marked passage below.

- ca08 layer 1 duty clause `// D225 pending`: "Because client and claimant details sit in that mailbox and on that drive, the organisation assesses the breach without delay and, where it must report, tells the ICO within 72 hours, with the people affected told where the risk to them is high."
- ca11 layer 1 duty clause `// D225 pending`: "A breach like this must be reported to the regulator unless it is unlikely to be a risk, and the people affected are told only where the risk to them is high."

ca06, ca07, ca09, ca10 carry no duty claim in layer 1 (not in the hold list; their appendix layer 1 names no reporting duty).

---

## Host lines (voiced) — new-lines table

| id | file:line | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca06-Hc | scenarios/ca06_texts_and_qr/ink/chidi_okeke.ink | Chidi Okeke | Zubenelgenubi | You flagged that fake barrier code to me before anyone scanned it, so nothing of yours ever reached them. | host | voiced | CATCH |
| ca06-Hp | scenarios/ca06_texts_and_qr/ink/chidi_okeke.ink | Chidi Okeke | Zubenelgenubi | You flagged that barrier code, so it got checked before a card or a sign-in was tapped into it. | host | voiced | PARTIAL |
| ca06-Hk | scenarios/ca06_texts_and_qr/ink/chidi_okeke.ink | Chidi Okeke | Zubenelgenubi | To the people who send these, one scan is a card to drain or a sign-in to walk in behind, and you handed them neither. | host | voiced | catch-attacker |
| ca06-Hm | scenarios/ca06_texts_and_qr/ink/chidi_okeke.ink | Chidi Okeke | Zubenelgenubi | Trust a code like that and it can empty a colleague's card, or hand over a sign-in they spend the next day winning back. | host | voiced | MISS |
| ca06-Hma | scenarios/ca06_texts_and_qr/ink/chidi_okeke.ink | Chidi Okeke | Zubenelgenubi | To whoever sends these, one scan is a card to drain or a sign-in to walk in behind, and a text from a new number keeps the thread going. | host | voiced | miss-attacker |
| ca07-Hc | scenarios/ca07_voice_ceo/ink/agnieszka_duda.ink | Agnieszka Duda | Callirrhoe | You rang that one back before a penny moved, so the payment that sounded so urgent never left the building. | host | voiced | CATCH |
| ca07-Hp | scenarios/ca07_voice_ceo/ink/agnieszka_duda.ink | Agnieszka Duda | Callirrhoe | You stopped to check that payment instead of releasing it on the voice alone, which is the whole job here. | host | voiced | PARTIAL |
| ca07-Hk | scenarios/ca07_voice_ceo/ink/agnieszka_duda.ink | Agnieszka Duda | Callirrhoe | To whoever cloned that voice, a trusted payment is money gone the same day, and your call back is exactly what they can't copy. | host | voiced | catch-attacker |
| ca07-Hm | scenarios/ca07_voice_ceo/ink/agnieszka_duda.ink | Agnieszka Duda | Callirrhoe | When a payment goes out on a voice alone, the run freezes while the team re-check every recent one, and that is a long, quiet afternoon. | host | voiced | MISS |
| ca07-Hma | scenarios/ca07_voice_ceo/ink/agnieszka_duda.ink | Agnieszka Duda | Callirrhoe | To whoever cloned that voice, that release is money moved straight on, and the plea to keep it quiet is what buys them the time. | host | voiced | miss-attacker |
| ca08-Hc | scenarios/ca08_after_the_click/ink/anjali_rao.ink | Anjali Rao | Kore | You reported it while it was still just a bad feeling, and that is exactly the call that keeps a quiet morning quiet. | host | voiced | CATCH |
| ca08-Hp | scenarios/ca08_after_the_click/ink/anjali_rao.ink | Anjali Rao | Kore | The faster someone says this looks wrong, the less there is for anyone to clean up, and you did say it. | host | voiced | PARTIAL |
| ca08-Hk | scenarios/ca08_after_the_click/ink/anjali_rao.ink | Anjali Rao | Kore | To whoever was inside that account, every unreported minute is another message colleagues trust and another password reset, and you took those minutes away. | host | voiced | catch-attacker |
| ca08-Hm | scenarios/ca08_after_the_click/ink/anjali_rao.ink | Anjali Rao | Kore | Left to run, an account like that costs a colleague his week, and the drive has to be rebuilt from backup before the team can work. | host | voiced | MISS |
| ca08-Hma | scenarios/ca08_after_the_click/ink/anjali_rao.ink | Anjali Rao | Kore | To whoever's inside, a trusted account is one its own colleagues won't question, and the quiet between the click and the report is when they spend it. | host | voiced | miss-attacker |
| ca09-Hc | scenarios/ca09_passwords/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | You spotted the reused one and shut it down, so there was nothing on that account for anyone to walk into. | host | voiced | CATCH |
| ca09-Hp | scenarios/ca09_passwords/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | You moved on the weak password, which is the one habit that quietly blunts most of this. | host | voiced | PARTIAL |
| ca09-Hk | scenarios/ca09_passwords/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | To whoever's buying leaked passwords, a reused one is a free way in that looks like you signing in, and you just made it worthless. | host | voiced | catch-attacker |
| ca09-Hm | scenarios/ca09_passwords/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | Reuse a password and a work account opens for free, and with shared logins on notes an audit can't say whose hands were on it. | host | voiced | MISS |
| ca09-Hma | scenarios/ca09_passwords/ink/nilesh_solanki.ink | Nilesh Solanki | Iapetus | To whoever's buying leaked passwords, your reused one is a free sign-in that reads as you, and a follow-up text sweeps up the code. | host | voiced | miss-attacker |
| ca10-Hc | scenarios/ca10_downloads_and_fake_checks/ink/niamh_doherty.ink | Niamh Doherty | Leda | You closed that page instead of following its steps, so nothing it wanted ever ran on the machine. | host | voiced | CATCH |
| ca10-Hp | scenarios/ca10_downloads_and_fake_checks/ink/niamh_doherty.ink | Niamh Doherty | Leda | You treated that check as the trap it was, which is all it takes to keep the morning ordinary. | host | voiced | PARTIAL |
| ca10-Hk | scenarios/ca10_downloads_and_fake_checks/ink/niamh_doherty.ink | Niamh Doherty | Leda | To whoever built that page, a single followed step is a way onto the machine behind it, and you gave them no step to follow. | host | voiced | catch-attacker |
| ca10-Hm | scenarios/ca10_downloads_and_fake_checks/ink/niamh_doherty.ink | Niamh Doherty | Leda | Follow a page like that and the machine is gone for the day while it's rebuilt, and no one quite knows what it touched. | host | voiced | MISS |
| ca10-Hma | scenarios/ca10_downloads_and_fake_checks/ink/niamh_doherty.ink | Niamh Doherty | Leda | To whoever built that page, one followed step is a foothold that reaches finance and the intranet, or a live caller already on your phone. | host | voiced | miss-attacker |
| ca11-Hc | scenarios/ca11_misdirected_data/ink/tomasz_wisniewski.ink | Tomasz Wiśniewski | Algieba | You brought the misdirected one to me the same day, which is all I ask, and it was contained before it spread. | host | voiced | CATCH |
| ca11-Hp | scenarios/ca11_misdirected_data/ink/tomasz_wisniewski.ink | Tomasz Wiśniewski | Algieba | A misdirected item means a quiet word with me that day, never a quiet delete, and you came. | host | voiced | PARTIAL |
| ca11-Hk | scenarios/ca11_misdirected_data/ink/tomasz_wisniewski.ink | Tomasz Wiśniewski | Algieba | To anyone who collects data like this, a stray record is a way into someone's life, and kept inside the building it is nothing to them. | host | voiced | catch-attacker |
| ca11-Hm | scenarios/ca11_misdirected_data/ink/tomasz_wisniewski.ink | Tomasz Wiśniewski | Algieba | Sent astray, these details put the people in them at a stranger's reach, and my week turns into recalls and letters home. | host | voiced | MISS |
| ca11-Hma | scenarios/ca11_misdirected_data/ink/tomasz_wisniewski.ink | Tomasz Wiśniewski | Algieba | To anyone who collects data like this, a stray care record is a believable way to approach the very people it names. | host | voiced | miss-attacker |

Counts: host 12 lines (6 shells × 2: one attacker-side, one human-side), 5 clips each = 29 clips. Against P-H2 budget 12 host lines: on budget.

## Layer 0 and layer 1 (written, unvoiced)

Format in the erb `strings.conceptPanel.text`: layer 0 (opens "To a real attacker"), then a blank line (`\n\n`), then layer 1 (ends "have a word with <host first name>."). The fragment (`AW/e<n>/defend.json` `awarenessEpisode.strings.conceptPanel`) carries layer 1 only — no "To a real attacker", no pointer, no "you".

### ca06 (host Chidi) — erb conceptPanel heading "When a code is trusted"
- Layer 0: "To a real attacker, one scan from a staff phone is a card number to drain or a work sign-in to wear into the depot, and either one is spent within the hour. A charged card funds the next move; a stolen sign-in opens the way to staff and customer records, and a follow-up message keeps the thread warm for the next ask. Reaching Facilities the way you always do, instead of through a code or a short link, is where that chain breaks: the notice on the wall never gets to decide where you go."
- Layer 1 (erb): "When a barrier code is trusted on sight, it can take a colleague's own card details or a work sign-in, and either one turns into an afternoon chasing the bank and a forced reset at work. A code or a short link is never the route you trust. Before you leave, have a word with Chidi."
- Fragment layer 1 (heading "When a code is trusted"): "A barrier code trusted on sight can take a colleague's own card details or a work sign-in, and either one turns into an afternoon chasing the bank and a forced reset at work."

### ca07 (host Agnieszka) — erb conceptPanel heading "When the voice wins"
- Layer 0: "To a real attacker, a payment released on a familiar voice is a large sum moved straight on and gone before anyone checks, and the plea to keep it quiet buys exactly that time. Ringing back on a number you already hold, and treating the voice as no proof at all, is where the chain breaks, because the payment is confirmed before it ever leaves."
- Layer 1 (erb): "A voice you recognise is not proof of who is calling, and neither is an email that backs it up. The payment released here, £18,400, was moved on before anyone looked, and finance lost the afternoon re-checking a frozen run to be sure nothing else had slipped through. Ring the person back on a number you already hold before any money moves. Before you leave, have a word with Agnieszka."
- Fragment layer 1 (heading "When the voice wins"): "A voice that sounds like the boss, backed by an email that agrees, can release a large payment that is moved on before anyone looks, and finance lose the afternoon re-checking a frozen run to be sure nothing else had slipped through."

### ca08 (host Anjali) — erb conceptPanel heading "The minutes that matter" — DUTY: option A placeholder `// D225 pending`
- Layer 0: "To a real attacker, one approved sign-in is a trusted internal account, worth far more than an outside one because its messages are believed, its prompts reset more passwords, and its reach runs to the shared drive. The damage lands in the gap between noticing something is wrong and reporting it. Reporting the moment it feels off, rather than waiting to be sure, is where the chain breaks, because it closes that gap before the account can be spent."
- Layer 1 (erb): "A report made in the first few minutes is what keeps a taken-over account from sending messages in a colleague's name, locking him out and reaching the shared drive. Because client and claimant details sit in that mailbox and on that drive, the organisation assesses the breach without delay and, where it must report, tells the ICO within 72 hours, with the people affected told where the risk to them is high. A colleague spent the afternoon on the recovery either way. Before you leave, have a word with Anjali."  <!-- D225 pending: the "Because client and claimant details... risk to them is high." sentence is option-A placeholder duty wording -->
- Fragment layer 1 (heading "The minutes that matter"): "A report made in the first few minutes keeps a taken-over account from sending messages in a colleague's name, locking him out and reaching the shared drive; because client and claimant details sit there, the breach is assessed without delay and, where it must be reported, the ICO is told within 72 hours, with the people affected told where the risk to them is high."  <!-- D225 pending: option-A placeholder duty wording -->

### ca09 (host Nilesh) — erb conceptPanel heading "A password for free"
- Layer 0: "To a real attacker, a password you reused somewhere else is a work account for free, and because sign-ins on that desk are shared and written down, nobody can even say who used it. From there the account is turned on the depot, and a text offering to stop the prompts collects the one-time code that is left. A password manager and a passkey are where the chain breaks, because reuse stops mattering and every sign-in belongs to one person again."
- Layer 1 (erb): "A password reused from a breached hobby site opened a work account here, and because the logins on that desk were shared and written on notes, the afternoon's audit could not tie a single action to a person. A manager and a passkey put that right: one password per account, and each sign-in belonging to just one person. Before you leave, have a word with Nilesh."
- Fragment layer 1 (heading "A password for free"): "A password reused from a breached hobby site opens a work account, and because the logins on that desk are shared and written on notes, the audit cannot tie a single action to a person."

### ca10 (host Niamh) — erb conceptPanel heading "When a page drives the machine"
- Layer 0: "To a real attacker, one step followed on a page dressed as a routine check is a rogue extension or a download on an operations machine, and from there a reach into the finance system and the intranet, or a live caller already on the line. Starting software and sites only from a route the staff member already trusts is where the chain breaks, because a page gets no say in what runs on the computer."
- Layer 1 (erb): "An extension picked up from a fake check reached the finance system and the intranet, and the machine was out of use for the afternoon while IT rebuilt it and worked out what it could have seen. If a page ever talks you into pasting, running, installing or calling, use the Report button or the incident form straight away. Before you leave, have a word with Niamh."
- Fragment layer 1 (heading "When a page drives the machine"): "An extension picked up from a fake check reaches the finance system and the intranet, and the machine is out of use for the afternoon while IT rebuild it and work out what it could have seen."

### ca11 (host Tomasz) — erb conceptPanel heading "Behind every row is a person" (kept) — DUTY: option A placeholder `// D225 pending`
- Layer 0: "To a real attacker, the items sent astray here are a gift: health and contact details for residents, staff and a driver, landing where they can be read and kept. The next move is to approach the named people with a believable story that already knows their circumstances. Checking who an item is really going to before it leaves is where the chain breaks, because the details never leave the building for anyone to collect."
- Layer 1 (erb): "When care records go to the wrong recipient, special-category details about residents, staff and a driver end up with people who have no right to see them, and the data protection lead loses the week to a recall, to deletion requests, and to letters to the families. A breach like this must be reported to the regulator unless it is unlikely to be a risk, and the people affected are told only where the risk to them is high. Before you leave, have a word with Tomasz."  <!-- D225 pending: the "A breach like this must be reported... risk to them is high." sentence is option-A placeholder duty wording -->
- Fragment layer 1 (heading "Behind every row is a person"): "When care records go to the wrong recipient, special-category details about residents, staff and a driver end up with people who have no right to see them, and the data protection lead loses the week to a recall, to deletion requests, and to letters to the families; a breach like this is reported to the regulator unless it is unlikely to be a risk, and the people affected are told only where the risk to them is high."  <!-- D225 pending: option-A placeholder duty wording -->

Layer 0: 6 written. Layer 1: 6 erb + 6 fragment written.

## npc-dialog-review verdict
Pending: opus48 npc-dialog-review runs on this batch before any voicing question (§2.1). Self-check against §2l (P1–P13): host lines are single well-made sentences, no P1/P9 fragment strings, no P13 written punctuation, no figure repeated from layer 1, each ≤30 words, attacker's side told in attacker terms (ca06/07/08/09/10/11 "-Hk"/"-Hma"). Verdict/commit to be recorded by the reviewer.
