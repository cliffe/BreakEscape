# W2_LINES_quayholt — P-KQ (Quayholt Insurance kit)

Package P-KQ (WAVE2_BUILD.md 2.4, D12). Kit `office_kits/quayholt_insurance.json`; stubs
`scenarios/_office_kit/ink/{darren_price,niamh_doherty,anjali_rao}_ambient.ink`. Pool lines
live in the kit JSON (TTS-voiceable, in a scenario file, not engine text). All spoken lines
are written to npc-dialog-review section 2l (P1–P13); full display-name prefixes; no `{var}`
in any voiced line; every stub knot ends on the sticky `+ [See you later.]` with
`#exit_conversation`; 30 words or fewer. The episode knots branch on `kit_key_caught` only
(ca00 knots do not branch, brief 1.3).

Voices (VOICE_CAST.md): Darren Price = Orus; Niamh Doherty = Leda; Anjali Rao = Kore. All en-GB.

## Shared: pool (kit_quayholt) and per-person idle lines

| id | file:line | speaker | voice | line (exact text) | kind | voiced/written | branch |
|---|---|---|---|---|---|---|---|
| ca-kqP1 | quayholt_insurance.json pool | (pool, any Quayholt speaker) | per speaker | Phones haven't stopped today. | shared-pool | voiced | |
| ca-kqP2 | quayholt_insurance.json pool | (pool) | per speaker | Claims backlog's easing off. | shared-pool | voiced | |
| ca-kqP3 | quayholt_insurance.json pool | (pool) | per speaker | Cooler's cold for once. | shared-pool | voiced | |
| ca-darrenI | ink/darren_price_ambient.ink:14 | Darren Price | Orus | Alright. Help yourself to the cooler if you're parched. | shared-start | voiced | |
| ca-darrenC1 | quayholt_insurance.json darren_price | Darren Price | Orus | Busy on the awareness side. | shared-chatter | voiced | |
| ca-darrenC2 | quayholt_insurance.json darren_price | Darren Price | Orus | Kettle's calling. | shared-chatter | voiced | |
| ca-niamhI | ink/niamh_doherty_ambient.ink:13 | Niamh Doherty | Leda | Hiya. There's a water cooler over by the wall if you need it. | shared-start | voiced | |
| ca-niamhC1 | quayholt_insurance.json niamh_doherty | Niamh Doherty | Leda | Newsletter's nearly done. | shared-chatter | voiced | |
| ca-niamhC2 | quayholt_insurance.json niamh_doherty | Niamh Doherty | Leda | Could murder a cuppa. | shared-chatter | voiced | |
| ca-anjaliI | ink/anjali_rao_ambient.ink:11 | Anjali Rao | Kore | Hello. Grab a drink from the cooler whenever you like. | shared-start | voiced | |
| ca-anjaliC1 | quayholt_insurance.json anjali_rao | Anjali Rao | Kore | Quiet on the alerts today. | shared-chatter | voiced | |
| ca-anjaliC2 | quayholt_insurance.json anjali_rao | Anjali Rao | Kore | Need a proper break. | shared-chatter | voiced | |

## Stub: ca00 hello knots (open directly, no branch)

| id | file:line | speaker | voice | line (exact text) | kind | voiced/written | branch |
|---|---|---|---|---|---|---|---|
| ca00-Sd | ink/darren_price_ambient.ink:19 | Darren Price | Orus | Welcome aboard. Good to have you on the floor with us. | stub | voiced | |
| ca00-Sn | ink/niamh_doherty_ambient.ink:18 | Niamh Doherty | Leda | Hiya, welcome in. Give us a shout if you need anything at all. | stub | voiced | |

## Stub: episode knots (branch on kit_key_caught)

| id | file:line | speaker | voice | line (exact text) | kind | voiced/written | branch |
|---|---|---|---|---|---|---|---|
| ca03-Sn-c | ink/niamh_doherty_ambient.ink:23 | Niamh Doherty | Leda | Good spot on that reset call. They nearly talked a password straight out of someone. | stub | voiced | catch |
| ca03-Sn-m | ink/niamh_doherty_ambient.ink:25 | Niamh Doherty | Leda | Helpdesk's had a run of odd reset calls lately. Keeps us all on our toes. | stub | voiced | miss |
| ca03-Sa-c | ink/anjali_rao_ambient.ink:16 | Anjali Rao | Kore | Well caught. That reset request was convincing, and it would have cost us. | stub | voiced | catch |
| ca03-Sa-m | ink/anjali_rao_ambient.ink:18 | Anjali Rao | Kore | We've had a few callers pushing for password resets this week. Worth a second look. | stub | voiced | miss |
| ca05-Sa-c | ink/anjali_rao_ambient.ink:24 | Anjali Rao | Kore | Good spot. The page was a near-perfect copy of our own sign-in. | stub | voiced | catch |
| ca05-Sa-m | ink/anjali_rao_ambient.ink:26 | Anjali Rao | Kore | The alerts keep flagging lookalike sign-in pages. They're getting harder to tell apart. | stub | voiced | miss |
| ca05-Sd-c | ink/darren_price_ambient.ink:24 | Darren Price | Orus | Nice catch on that fake sign-in page. Looked just like the real portal, didn't it. | stub | voiced | catch |
| ca05-Sd-m | ink/darren_price_ambient.ink:26 | Darren Price | Orus | Seen a few lookalike login pages doing the rounds. Hard to tell from the real thing now. | stub | voiced | miss |
| ca08-Sd-c | ink/darren_price_ambient.ink:32 | Darren Price | Orus | Good call flagging that one fast. A quick shout saves us a lot of grief later. | stub | voiced | catch |
| ca08-Sd-m | ink/darren_price_ambient.ink:34 | Darren Price | Orus | One of the machines went down earlier. Always a scramble when a shared system drops. | stub | voiced | miss |
| ca08-Sn-c | ink/niamh_doherty_ambient.ink:31 | Niamh Doherty | Leda | Lovely work flagging that quick. The sooner it's reported, the sooner we're back up. | stub | voiced | catch |
| ca08-Sn-m | ink/niamh_doherty_ambient.ink:33 | Niamh Doherty | Leda | Half the floor was locked out of a system earlier. Proper pain when it happens. | stub | voiced | miss |
| ca10-Sd-c | ink/darren_price_ambient.ink:40 | Darren Price | Orus | Well spotted. Those fake device-check prompts catch people out all the time. | stub | voiced | catch |
| ca10-Sd-m | ink/darren_price_ambient.ink:42 | Darren Price | Orus | Had a laptop out of action this week. Dodgy download, by the looks of it. | stub | voiced | miss |
| ca10-Sa-c | ink/anjali_rao_ambient.ink:32 | Anjali Rao | Kore | Nicely done. Those fake security checks are built to look completely routine. | stub | voiced | catch |
| ca10-Sa-m | ink/anjali_rao_ambient.ink:34 | Anjali Rao | Kore | Had a device pulled for a dodgy download today. The fake check looked genuine enough. | stub | voiced | miss |
| ca16-Sd-c | ink/darren_price_ambient.ink:48 | Darren Price | Orus | Good thinking. Keeping sign-ins to one person saves a lot of untangling later. | stub | voiced | catch |
| ca16-Sd-m | ink/darren_price_ambient.ink:50 | Darren Price | Orus | Folk still share logins when they're stuck. Makes it murder to work out who did what. | stub | voiced | miss |
| ca16-Sn-c | ink/niamh_doherty_ambient.ink:39 | Niamh Doherty | Leda | Nice one. Easier all round when everyone's working under their own name. | stub | voiced | catch |
| ca16-Sn-m | ink/niamh_doherty_ambient.ink:41 | Niamh Doherty | Leda | Someone got locked out and asked to borrow a login. Tempting, but it gets messy. | stub | voiced | miss |
| ca19-Sd-c | ink/darren_price_ambient.ink:56 | Darren Price | Orus | Nice one. Catching it early means IT can box it off before it spreads. | stub | voiced | catch |
| ca19-Sd-m | ink/darren_price_ambient.ink:58 | Darren Price | Orus | IT pulled a machine off the network today. Updates had slipped, apparently. | stub | voiced | miss |
| ca19-Sn-c | ink/niamh_doherty_ambient.ink:47 | Niamh Doherty | Leda | Good catch. Spotting it early let IT shut it down before it got anywhere. | stub | voiced | catch |
| ca19-Sn-m | ink/niamh_doherty_ambient.ink:49 | Niamh Doherty | Leda | One of the desks got isolated by IT today. Something slipped through, I heard. | stub | voiced | miss |

## Counts against 4.1 (P-KQ budget: shared 12, stub 14, total 26)

- Shared: 12 — pool 3; per person start 1 + chatter 2 (Darren, Niamh, Anjali) = 9. Matches
  the 12-shared budget and P-KT's wave-2 counting (1 start + 2 chatter per person).
- Stub: 14 — ca00 2 (Darren, Niamh, 1 clip each, non-branching); episode knots 12 (one per
  ambient colleague per shell: Darren ca05/08/10/16/19, Niamh ca03/08/16/19, Anjali
  ca03/05/10), each 1 line branching on `kit_key_caught`.
- Total: 26 of 26. Within budget. Host/twin/layer: 0 (not in P-KQ scope).
- Clips: shared 12 (pool 3, start 3, chatter 6); ca00 stub 2; 12 branching episode knots ×2
  = 24. Pairs per PLAN 8.3 line 461: ca00/ca08/ca16/ca19 Darren+Niamh, ca03 Anjali+Niamh,
  ca05/ca10 Anjali+Darren — none names the shell's host or anyone in its social block.
- Word cap: max line 16 words (Darren ca05/08 miss); all ≤ 30. No `{var}` in any line.

## npc-dialog-review (section 2l, P1–P13) — self-check

A formal opus48 npc-dialog-review runs on the whole wave 2 batch (I step 8) before any voicing.
- P1/P9: each knot is one natural line, not choppy; no verbless fragments beyond allowed openers.
- P4/P7: no two knots share an opening; catch lines vary ("Nice catch", "Good call", "Well
  spotted", "Good thinking", "Nice one", "Well caught", "Good spot", "Nicely done", "Lovely
  work", "Good catch").
- P10/P11: no announcing preamble, no padding tail.
- P13: no semicolons, em dashes or colons inside speech (prefix colon excepted).
- Content rules (2.1): office chatter, not policy; nobody blamed; no line says who let an
  incident in; no reusable method, tool or command; the else lines are ongoing office cases,
  not the learner's exercise. The catch line is brief praise of the spot.
- Verdict (self): 0 blockers, 0 majors, 0 minors. Commit: 542b1b495.
