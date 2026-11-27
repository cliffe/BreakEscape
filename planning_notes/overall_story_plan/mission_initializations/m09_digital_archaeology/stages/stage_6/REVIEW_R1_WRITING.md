# m09 stage 6, review round 1: the writing

## Scope and method

Reviewer: fresh read-only reviewer (Opus), 2026-10-21. Lens: the writing only. Is each readable a believable document from its world? Does it carry its clue without lecturing? Is Tesseract's voice consistent? Is the revelation well paced? Do the m01–m08 payoffs feel earned? Are there AI tells or US/UK slips?

Read: `docs/agents/FINALE_BRIEF.md`; `story_design/story_dev_prompts/06_lore_fragments.md`; `stage_6/lore_fragments.md` (all of it); `stage_2/storytelling_elements.md` §2, §3 and §5 (the document voices); `stage_1/story_arc.md` §1 and Beats 1.3–2.3. For comparison I read the shipped readables in `scenarios/m02_ransomed_trust`, `m05_insider_trading` and `m08_the_mole` (`scenario.json.erb`), plus Tesseract's m07 calls (`scenarios/m07_architects_gambit/ink/m07_architect_comms.ink`) and HaX's `topic_teacher` (`m07_phone_agent_0x99.ink` ~L776). I ran both Vigenère decodes: `MSJMQAEGDZNVI` with key `BONEYARD` gives `LEWISANDCLARK`, and the ALPHA sheet gives "Carry it yourself. Let it hurt afterwards." Both are correct. I opened no VM material.

Line references are to `lore_fragments.md`.

## Overall judgement

The Architect's own hand is the best thing here. The Reading, the last page, the casualty sheet, Derek's "A good first lesson for whoever they send" and Nightshade's "Will wait if asked properly. Ask properly." all sound like the man on the m07 handset ("I've read your file. Files are written by people who need you to be a particular shape."). Most of them could ship as they are.

Everyone else's paper is weaker, and the trouble is the same each time: **many readables are summaries of a document, not the document.** The shipped missions set a high bar. m02's visitor log and snag list, and m08's vetting queries with "Netherton, appended:", read like paper someone in the building actually wrote, each with a human note at the foot. Too many m09 strings read like stage directions: "The order, photographed. The wall from the briefing. The raid team." / "A coordinated-disclosure letter, ninety-day date, courteous." / "Eleven names, in her hand." Others mix the narrator, or HaX, into the paper itself: "There it is. Tomb Gamma has an address." on a deed, "*(HaX: Irina's account. It bought the deed.)*" inside a rent book, "None of ours" on Sorensen's legacy box. The 06 prompt wants evidence with numbers you can read on the page. Here the numbers (twenty-three, forty-seven, eleven, the costs) live in HaX's spoken read, and the documents mostly say "eleven names" without showing one.

Three payoffs are promised and not delivered on paper:
- The Reading's margin bets the player will save Derek's file "to know why he did it", and the file never says why.
- `LEWISANDCLARK` leans on a county-clerk certificate in Sorensen's office that has no object or text.
- The Albion notice, which the player can send "unchanged, nine years late", is never written.

The pacing is mostly right: four threads, each paying off late. Two leaks front-load it. Nightshade's file says outright it was "filed by the chief strategist's office" and signs "-- A." in Act 2. The Tomb Beta rack announces "It was left off the destruction schedule" before the schedule can make the player realise it.

US/UK handling is set out well in §0 but slips in practice. "Grid reference", "rent book", "refit", "placing sheet", school governors and hospital trusts all turn up in documents §0 marks as American. The UK date order on a US accountant's page contradicts itself.

## Findings

Counts: **1 blocker, 13 major, 12 minor.**

| Id | Sev | Location | Problem | Fix |
|---|---|---|---|---|
| W6-01 | blocker | `albion_folder`, L264 (the notice) | The notice is described, not written: "A coordinated-disclosure letter, ninety-day date, courteous. Signed, typed: ..." §1.9 and SE §5.2 say sending it in m09 "sends this drafted text unchanged". There is no text to send, and the player reads a précis where the season's most humane document of Tesseract's should be. The catalogue entry and memo also lack a document's frame (reference number, To/From/Date/Subject), though SE §5.2 asked for "a reference number". | Write all three in full, in civil-service form. Rewrite 1 below. |
| W6-02 | major | systemic: `lease_file` L190–192, `rent_book` L198, `refit_ledger` L214, `feed_table_box` L128, `case_file` L37, `enrolment_binders` L271, `tomb_beta_rack` L258 | The narrator's or HaX's voice sits inside the paper: "There it is. Tomb Gamma has an address."; "Same coordinate the team already has. Now it has a lease."; "*(HaX: Irina's account. It bought the deed.)*"; "St. Catherine's money. It bought the blast door."; "None of ours"; "It is not this one."; "The hand that taught, enrolled and recruited." Shipped missions keep the document in `text` and the gloss in `observations` (m02 L5/L6, m08's vetting queries). | Split every readable into document `text` (what is printed or written) and an `observations` gloss (one line, the narrator's). Move HaX's remarks into her ink. |
| W6-03 | major | `feed_table_box` L128; SE §5.3 ("Stage 6 writes the entries") | The legacy files are the Initiative's scope "made physical", yet there are no entries, just "a school governor, a council clerk, ... eleven quiet people, placed and left." That is a narrator's summary with a writerly flourish, not Sorensen's columns. It also breaks the 06 prompt's rule that evidence carries numbers. | Write three or four real rows in her columns (codename / placed / post / cost / yield / notes), then "(seven more)". Rewrite 2. |
| W6-04 | major | `printed_ledger` L137–139; §4.1 item 2 | The header promises "cost / notes" columns and §4.1 says the scale is "costed in Sorensen's columns ('cost / yield')", but no row carries a cost. The twenty-three and the forty-seven appear on no document, only in HaX's spoken read. | Give WREN and LINNET a cost and a yield, and add a totals line (placements 23, candidates 47, legacy 11). Rewrite 3. |
| W6-05 | major | `printed_ledger` L137 (Reeves variant) | The Reeves variant replaces the whole page, so on that branch LINNET loses "Father, dialysis, Dearborn" and WREN loses the day-10 line. "[Show her the page.]" (Noor) then shows a page with nothing about her father on it. It is also the only variant not gated on flag 2, so it shows names before the live key exists, which contradicts the base text. | Make the handler sheet an appended paragraph on the flag-2 text (a combined `flag2_submitted && (Reeves)` variant first), not a replacement. |
| W6-06 | major | `derek_file` L99–101; `the_reading_last_page` margin L178; SA Beat 2.1 ("the only place anyone wrote down why he did what he did") | The margin bets "They will want to know why he did it", and HaX sells the bin on exactly that, but the file holds the costing and nothing about *why*. m01 makes Derek "a believer" (m01 debrief L739, L858). | Add one line of motive in the Architect's hand. Rewrite 4. |
| W6-07 | major | `nightshade_file` L119 | "*(filed by the chief strategist's office; his own hand)* -- A." is the author's note leaking onto the page. It hands over in Act 2 the link (chief strategist = A.) that the hand comparison and flag 3 are meant to earn, which makes the match puzzle redundant. It is also out of character: the man who never left a trace in m07 would not sign his ENTROPY mark on a file his SAFETYNET office kept. | Cut the parenthesis and the "-- A.". Give the file a SAFETYNET intake header and let the hand do the work. Rewrite 5. |
| W6-08 | major | `letters` L107 | "Drop and handler as filed." The letters are meant to be the lever on Tran (his trade route, his drop, his handler), and the page names neither. "From the brief: 'She says we when she means...'" reads as a typo now the inner quotes are gone (the banned `"`). | Name the drop and the handler by role. Recast the quote so it doesn't need nested quotes. Rewrite 6. |
| W6-09 | major | §2.2 L314 (the "certificate on her office wall (§1.6)") | §1.6 has no certificate. The decode's "of course she keyed it to her county" depends on the player having seen Lewis and Clark County somewhere. Nothing a player reads says it (SE §3 has it only as backstory). | Add a `clerk_certificate` readable (or `observations`) in Sorensen's office. Rewrite 7. |
| W6-10 | major | `nightshade_copy` L113 | Hard to parse ("copied from his locker, in his hand ... His notes to me") and it contains none of what he cleared. SE §2 gives Nightshade "an image instead of jargon, the last line turned into a general truth". This ends on self-justification instead. | A cover slip in his hand, then one of the Architect's notes to him. Rewrite 8. |
| W6-11 | major | `tomb_beta_rack` L258 | "It was left off the destruction schedule." gives away the flag-4 realisation that `master_schedule` → `schedule_read` exists to deliver (§1.6 L186), and does so as narration. | Cut the sentence. Optional replacement: "Nobody has stamped anything in here." |
| W6-12 | major | `enrolment_binders` L271 | Pure exposition: "annotated in the same hand as the recruitment file and the notebook margin. The hand that taught, enrolled and recruited." The player is told the conclusion of a comparison they have already made. | Show a binder page and let the hand be noticed. Rewrite 9. |
| W6-13 | major | `case_file` L37–38 | An inventory of the file, not the file. The tagged-payments page ends in a narrator's aside ("It is not this one."). | A typed case-file cover sheet in SAFETYNET's register, the payments as a printout, and HaX's own pencil on her own file. Rewrite 10. |
| W6-14 | major | `lease_file` L190–192, `rent_book` L198, §3.2 L360 | US/UK and logic. The deed is marked UK English, but it is a Montana instrument. "Grid reference" is Ordnance Survey usage; a Montana deed gives a legal description (section, township, range) and a county. The rent book is marked US, yet §3.2 reads 02/06/2016 as 2 June "in UK day-month order on the paper". A US accountant writing 2 June puts 06/02/2016. The PIN only needs the digits, so pick one reading and make the paper agree. "(Zero Day front)" is an author's label: no lease calls its tenant a front. | Write the deed as a US lease abstract (lessee an LLC, legal description, county, recorded date). Either state the date as Feb 6, 2016, or keep 2 June and print 06/02/2016 with PIN `060216` (then check §3.1 for collisions). |
| W6-15 | minor | `feed_table_box` L128, `noor_desk_box` L59 | The roles named are British (school governor, council clerk, hospital trust secretary, planning officer). Sorensen's archive is in Montana and SAFETYNET is UK-run, so decide where the eleven are placed. If they are mixed, say so in the rows; if American, use school board member, county deputy clerk, hospital billing director, zoning officer. A box labelled "Insider Threat Initiative — legacy placements" is improbable from a woman who won't read a name aloud. | Label it by series number ("Series L, boxes 1–3. Hold for M.S."). |
| W6-16 | minor | US slips in American documents | "Rent Book" (UK tenancy term; US "rent ledger"), "Refit Ledger" (US "build-out" or "construction draws"), "Placing Sheet" (UK recruitment; US "placement record"), "Guard's Incident Book" (US "incident log"). "Lease-holder" reads British (US "lessee" or "tenant"). | Rename as given. Object names are seen as often as the text. |
| W6-17 | minor | `derek_file` L101, Reading entry 1 L151–152, SE §3 Sorensen's hatch line | The same beat lands three times for one player. Expose: "a month of recruiting for us" / "a month of my recruiting for me" / "We had a very good month afterwards". Surrender: "They will believe they talked you into it" / "They believe they persuaded him" / "You still think you talked him into it". The echo between hand and file is meant; the third copy is wasted. | Keep the file as the instruction and change the Reading's line to a new angle. Rewrite in passage 4b. |
| W6-18 | minor | `the_reading` L145 | The four entries have no frame. A file titled "The Reading" in his hand should open with something: a cover line, or headings ("Viral Dynamics", "The innocents", "Albion", "Portland"). §1.6 mentions headings, but no string carries them. | Add a cover string and the four headings as fixed text. Suggested cover: "0x00. Kept by M.S. Not to be summarised." |
| W6-19 | minor | `trolley_list` L50–53 | "(most lines crossed through)" on a list with a single line. | List it per box or per bay: "R-114 ... R-161 (48 boxes, bays 6–9)". Or show three lines: "R-114 to R-129 / R-130 to R-145 / R-146 to R-161", struck one at a time. |
| W6-20 | minor | `shelf_code_legend` L241 | "Access codes for a bay are keyed to its word." is the puzzle's rule printed on the wall; no archive chart says that. The legend also promises numbers ("a number and a word") and shows none. | Put bay numbers in, and soften the rule to a house note. Rewrite in passage 7b. HaX and Gary already carry the explicit hint. |
| W6-21 | minor | Gary's hint, §2.3 L323 | "key" three times in four sentences. "I audited a trust that ran that tape library" says he audited a trust that ran *this* Montana library. | "Had one of these at a trust I audited. Codes went in the shelf scheme. Read it like a shelf mark, not a number. Vigenère, and the bay word's the key. It's on the chart by your elbow." |
| W6-22 | minor | `mirror_job_printout` L277 | "Fallback: 06:00, staged by city." Montana players will read that as local time; the arc's hour is 06:00 UTC. | "Fallback: 06:00 UTC, staged by city." |
| W6-23 | minor | `drop_terminal_screen` base L31, flag-2 rows | "No restricted series listed." is a public catalogue pointing at its own hole. Em dashes as column separators are not the house style: m08 uses none, and m02/m07 use " -- " and dot leaders. | Cut the hint sentence; use " -- " or dot leaders in the ledger rows. Do the same everywhere else in §1. |
| W6-24 | minor | `hl_placing_sheet` L82 | "Placement: lateral, private sector." then "Client: government (UK)." reads as a contradiction. It is also missing the dull particulars (fee, start date, reference) that make "dull on purpose" work. | "Ref HL2015-0477. Search: lateral hire from private sector. Client: [government, UK]. Fee: 30% first-year. Start: Q3 2015." |
| W6-25 | minor | `notebook_scan` L44 | Two lines can't carry a hand comparison. HaX's hint mentions "the loop on the g" and "crossed sevens" (SA Beat 2.2), but there is no 7 anywhere in either text. | Add a date line and one more note with a 7 in it ("Wk 7. Disclosure", or "17 Oct 2011") in both hands' samples, so the hint matches something on the page. |
| W6-26 | minor | `*(...)*` stage directions throughout §1 | The notes minigame runs `renderNoteMarkdown`, so these may come out as italics in notes, but `gameDisplay`/readable paths may print them literally. Either way "*(a second hand, in the margin)*" is a direction in the reader's face. | Stage 9 to check rendering. Prefer plain in-world markers like m02/m08 ("In the margin, a different hand:", "Pencilled underneath:"). |

## Worst passages, with rewrites

Each rewrite keeps to the §2 banned-character rule: no double quotes, pipes, hashes or square brackets, and no line starting with `*`, `-`, `+` or `=`. `\n` breaks are left implicit. Any new personal names need the usual grep before they ship.

**1. The Albion papers (W6-01).** Was: "**Notice (drafted, never sent).** To Carrow Controls. A coordinated-disclosure letter, ninety-day date, courteous. Signed, typed: Dr Adrian Tesseract, Chief Strategist."

> CATALOGUE ENTRY -- VULNERABILITY HOLDINGS
> Ref: VH-2017-0312. Authentication bypass, Carrow Controls RM-4 remote-management module.
> Deployed at: grid battery sites, water treatment works, substations. Approx. 400 UK sites.
> Vendor aware: no.
> Disposition: RETAIN. Operational value. Review 2019.
> Board initials: four of five boxes. The fifth is blank.
>
> MEMO. To: Disposition Board. From: Chief Strategist. 14 March 2017. Re: VH-2017-0312.
> We are holding a flaw in a Carrow controller because it may one day be useful to us. It will certainly one day be useful to someone else.
> Four hundred sites run this module. Their engineers cannot patch what nobody has told them about, and we cannot defend them from it, having chosen not to.
> I recommend notification to the vendor within thirty days. I have drafted the notice. I would rather send it than explain later why we didn't.
> A. Tesseract
>
> DRAFT -- NOT SENT. To: Product Security, Carrow Controls. Re: RM-4 remote-management module.
> We have found a flaw in the RM-4 module that lets an unauthenticated user on the management network issue control commands. A test case is attached for your engineers.
> We will keep this confidential for ninety days from the date of this letter, or until a fix ships, whichever is sooner, so that your customers have time to patch. We are glad to help with testing.
> With thanks,
> Dr Adrian Tesseract, Chief Strategist

The blank fifth box does what "he was right, and he lost" needs, without a word said. The figure of four hundred matches Netherton's line (SE §2).

**2. The legacy files (W6-03, W6-15).** Was: "Elsewhere: a school governor, a council clerk, a hospital trust secretary, a planning officer... eleven quiet people, placed and left."

> SERIES L -- LEGACY PLACEMENTS, NOT SAFETYNET. M.S.
> Name / placed / post / cost to date / yield / notes
> Ruth Lindqvist -- 2009 -- deputy clerk, Cascade County -- $14,000 -- voter rolls -- Quiet. Reliable.
> Dolores Ortega -- 2012 -- billing director, regional hospital -- $31,500 -- records, three systems -- Wants out. Remind her of her son.
> Tom Haugen -- 2014 -- school board, Bozeman -- $6,000 -- vendor contracts -- Enjoys it.
> Amit Chandra -- 2016 -- zoning officer, Billings -- $9,200 -- substation permits -- Never asked for anything yet. Will be.
> Seven more sheets, same columns.
> Pencilled at the foot: The best work I have done. Nobody will ever know. That was the point.

If the eleven are meant to be in the UK, keep the rows and swap the posts. Either way, write real rows.

**3. The printed ledger, flag 2 (W6-04, W6-05).** Was: "Codename / source / placed / status / cost / notes.\nWREN — H&L — 11 yrs — LIVE. Day 10: assigned TF Null, Montana. M.S.\nLINNET — candidate — not placed. Father, dialysis, Dearborn."

> INSIDER THREAT INITIATIVE -- LEDGER, PRINT COPY. M.S.
> Placements 23. Candidates 47. Legacy 11.
> Codename / source / placed / status / cost / notes
> WREN -- H&L -- 11 yrs -- LIVE -- $1.4M salary and fees -- Day 10: assigned TF Null, Montana. Expected yield: one raid. M.S.
> LINNET -- candidate -- not placed -- $500 to date, filing bonus -- Father, dialysis, Dearborn. Ready when asked.

"$500 to date, filing bonus" pays off Noor's secret (SE §3: the after-hours bonus) without a line of dialogue. Reeves' handler sheet becomes a paragraph appended under these rows.

**4. Derek's file (W6-06).** Was: "Lawson, Derek. Asset, Viral Dynamics.\n\nExpected loss of asset: total. Expected yield: one demonstration, and the agency's attention. A good first lesson for whoever they send. -- A."

> LAWSON, D. -- ASSET, VIRAL DYNAMICS
> Motive: belief. He has read everything I sent him and believes it more than I do. That is why he will do it, and why he will not stop when told.
> Expected loss of asset: total. Expected yield: one demonstration, and the agency's attention.
> A good first lesson for whoever they send. -- A.

This now answers the margin's "They will want to know why he did it", and agrees with m01's "He's a believer."

**4b. The Reading, entry 1, de-duplicated (W6-17).** Was (expose): "They put Lawson's figures on every front page, and did a month of my recruiting for me." Was (surrender): "Lawson put the device down for them, as instructed. They believe they persuaded him."

> Expose: They gave Lawson's figures to the press. Applications rose. I keep the figure.
> Surrender: Lawson put the device down when they asked. It is the only order of mine he enjoyed.

**5. Nightshade's recruitment file (W6-07).** Was: "Intake 2011. Twenty-three. Idealistic, tired already. Will wait if asked properly. Ask properly. No payment: belief is the payment.\n\n*(filed by the chief strategist's office; his own hand)* -- A."

> SAFETYNET -- INTAKE 2011 -- CANDIDATE ASSESSMENT
> Candidate: 0x47, provisional. Age: 23.
> Assessor's notes: Idealistic, tired already. Will wait if asked properly.
> Ask properly.
> No payment. Belief is the payment.
> Assessor: initialled, not signed.

A SAFETYNET form with an ENTROPY recruiter's notes on it is the horror. The hand comparison has to do the naming, which is what Beat 2.2 is for.

**6. The Social Fabric letters (W6-08).** Was: "Insider Threat Initiative → Social Fabric. Drop and handler as filed.\n\nNext: Teresa Villanueva, 41, ..."

> INITIATIVE TO SOCIAL FABRIC -- HANDOFF 14
> Courier: J.T., server closet, Mountain States. Collects Thursdays. Paid per envelope, cash.
> Handler: the Bozeman number. He has never met them and doesn't ask.
> Next file: Teresa Villanueva, 41. Union rep, Butte copper mine.
> Method: an affair, photographs in hand. Her medical file, obtained. Press first, then the union board.
> Why her: when she says we, she means the men on the night shift. Take that away and they stop listening.

The rewrite gives the player something concrete to show Tran, and loses the broken nested quote.

**7. The certificate (new; W6-09) and 7b, the legend (W6-20).**

> LEWIS AND CLARK COUNTY, MONTANA. In appreciation of twenty years' service: Margaret A. Sorensen, Clerk and Recorder, 1986 to 2006. The county's memory, kept.

> MOUNTAIN STATES RECORDS & RETENTION -- SHELF MARKS
> Bay 1 ....... Reading room ..... COTTONWOOD
> Bays 2 to 9 . Open stacks ...... MERIDIAN
> Bay 10 ...... Restricted ....... WATCHTOWER
> Bay 11 ...... Tape store ....... STANDBY
> Bay 12 ...... Salvage .......... BONEYARD
> House rule: cage and keypad codes use the bay word. Never write a code down. M.S.

"Clerk and Recorder" is the real Montana title, and the dates fit her age (66). The legend's house rule is something an archive director would really pin up. It still tells a careful player what the key is, which keeps Gary's and HaX's nudges as the fallback rather than the only route.

**8. What Nightshade cleared (W6-10).** Was: "*(copied from his locker, in his hand)* His notes to me, not the Initiative's. I kept these. I'd have burned anything that named anyone else. Whatever else I was, I was careful about that."

> A slip on top, in Nightshade's hand: Cleared from my locker and sent ahead. His notes to me, nothing of the Initiative's. Anything that named anyone else, I burned.
> Beneath it, one card in another hand: 0x47. They will ask you to choose between them and us. You will not need to. Wait. -- A.
> At the foot of the slip: A man may keep his own letters. It is other people's that make him a traitor.

**9. The enrolment binders (W6-12).** Was: "Enrolment records for Tomb Beta's workshop, annotated in the same hand as the recruitment file and the notebook margin. The hand that taught, enrolled and recruited."

> text: TOMB BETA -- WORKSHOP ENROLMENT, SPRING INTAKE. Twelve names, a photograph clipped to each. Pencil beside most of them: Ready. Not yet. Ask properly.
> observations: A ring binder of enrolment sheets, pencilled in a hand you have seen twice tonight.

"Ask properly" repeated from Nightshade's file is the recognition. The player makes it; nobody states it.

**10. HaX's case file (W6-13).** Was: "The order, photographed. The wall from the briefing. The raid team.\n\nTagged payments (HashChain): ... The account pays rent on a building in Montana. It is not this one."

> CASE FILE -- HELENA. 0x99. Not for circulation.
> 1. Intercept, day 1: the order, photographed.
> 2. The wall, copied.
> 3. Raid team, Montana: four names.
> 4. Training notebook, 2011: scan, filed separately.
> (on `m06_monitoring_enabled`, add:)
> 5. HashChain tags, standing order. From: frozen fund, tagged. To: Big Sky Holdings LLC. Memo: RENT, SITE 2, MT. Monthly, since 2016.
> In pencil, her hand: Not Helena.

Item 4 is the tell: she lists it, she doesn't mention it. "Since 2016" quietly agrees with the lease.

## What works (keep)

- **The Reading's entries 2–4 and the last page.** "They struck a patient on a ward. I have read the ward's notes. So, I expect, have they." / "Not one bystander hurt on their first day. Rare. It will not last." / "'Don't ask me to rank them.' I ranked them for them." / "They will have read this far and found nothing here that is untrue." These fit m07's register exactly: third person, dry, every word costed. The last line turns m07's "I've read your file" back on the player. Keep them word for word.
- **The casualty sheet.** "Fallback by city: fewer, later." and "An acceptable price for the last arms race." The understatement is right. It meets the 06 prompt's numbers rule without reading like the prompt's Shatter example.
- **The memo's last line** ("I would rather send it than explain later why we didn't.") and the plain civil-service register for the younger Tesseract.
- **The hurt/afterwards motif, paced across three records.** The notebook margin "Ask who it hurts first. Then ask again afterwards." (2011), then the ALPHA draft "Carry it yourself. Let it hurt afterwards.", then m07's "Let it hurt afterwards, not during." That is progressive revelation done properly: no line repeats, each is a stage of the same thought. Both decodes check out.
- **Old Coyote's incident book.** "FRI. SAME. NOBODY READS THIS." It echoes Gary's seven warnings and Okonkwo's rota in m02 without naming either.
- **Small, sharp finds:** "Loose end, resolved." (Danny), "WIPE COMPLETE. Deck empty. Last operator: remote.", "Reading (safe); plan chest: not listed. Keep?", "LINNET -- Father, dialysis, Dearborn", and Torres' status changing with m05's choice ("the Initiative never learned he turned"). These pay off earlier missions by letting the player notice, not by listing names.
- No banned vocabulary or filler openers anywhere in the strings. The AI tells here are structural (summaries in place of documents, glosses inside documents), not lexical.

## Verdict

**Not ready for stage 7/9. Revise and re-review.** The Architect's voice is consistent and strong, and the revelation arc is well designed. The paper around him is not yet written to the m02/m08 standard.

Order of work:
1. Write the Albion notice, memo and catalogue entry in full (W6-01).
2. Separate document text from glosses across §1 (W6-02).
3. Write the legacy rows and the ledger costs (W6-03, W6-04, W6-05).
4. Close the three missing payoffs: Derek's motive, the certificate, the letters' courier (W6-06, W6-08, W6-09).
5. Remove the two front-loads (W6-07, W6-11).
6. Do a single US/UK and dash pass (W6-14 to W6-16, W6-23).

The rewrites above are offered, not imposed. Where the author keeps their own wording, the finding is closed if the underlying problem is gone.
