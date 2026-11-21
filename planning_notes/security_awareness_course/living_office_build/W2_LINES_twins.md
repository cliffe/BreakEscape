# W2_LINES_twins.md — twin host lines (P-TW)

Wave 2, package P-TW. The 16 generated defend-only twins' single host line, in the
two-way catch/miss form of the ca01 and ca12 twins (each branch two clips). ca13's
twin is hand-authored by P-H3 and is not here.

Each line speaks of the incident as the firm's own case (PLAN 6.6, appendix layer 2):
hub-first, gated on the doubled `episode_<id>_defend_defend_complete` and branching on
`kit_key_caught`. No blame, no figure, no reusable method; the catch half names what the
report bought, the second clip gives the attacker's angle in plain terms (≤ 30 words each).
Unvoiced under D226/D207 (as the ca01 and ca12 twins), written to the same standard.

## Generator wiring (for P-GEN step 5)

Each line below replaces the `after` **string** in the named generator's `LINES[(ekey,'defend')]`
tuple with a dict of the ca12 shape, copied exactly as written:
`{'catch': (<T1c>, <T2c>), 'miss': (<T1m>, <T2m>)}`. The id's branch letters map to the slots:
`T1c` = `catch[0]`, `T2c` = `catch[1]`, `T1m` = `miss[0]`, `T2m` = `miss[1]`.

| ep | ekey | generator | `after` literal (string replaced by the dict) |
|---|---|---|---|
| ca02 | e2 | gen_e2_e4_shells.py | :74 |
| ca04 | e4 | gen_e2_e4_shells.py | :78 |
| ca03 | e3 | gen_e3_e5_shells.py | :67 |
| ca05 | e5 | gen_e3_e5_shells.py | :71 |
| ca06 | e6 | gen_e6_e7_shells.py | :397 |
| ca07 | e7 | gen_e6_e7_shells.py | :401 |
| ca08 | e8 | gen_e8_e17_shells.py | :421 |
| ca09 | e9 | gen_e8_e17_shells.py | :448 |
| ca10 | e10 | gen_e8_e17_shells.py | :462 |
| ca11 | e11 | gen_e8_e17_shells.py | :435 |
| ca14 | e14 | gen_e8_e17_shells.py | :457 |
| ca15 | e15 | gen_e8_e17_shells.py | :439 |
| ca16 | e16 | gen_e8_e17_shells.py | :452 |
| ca18 | e18 | gen_e8_e17_shells.py | :468 |
| ca19 | e19 | gen_e8_e17_shells.py | :430 |
| ca20 | e20 | gen_e8_e17_shells.py | :444 |

The `ink_source` branch that renders the dict is `gen_e8_e17_shells.py:308-318` (P-GEN step 3
copies it into the other three generators). `kit_key_caught` is declared by that branch.

## Lines

| id | file:line | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca02-T1c | gen_e2_e4_shells.py:74 (after→catch[0]) | Fatima Begum | Vindemiatrix | You held back that application whose attachment wanted a second click to open it, so nothing ran on the HR machine behind it. | twin | written | catch |
| ca02-T2c | gen_e2_e4_shells.py:74 (after→catch[1]) | Fatima Begum | Vindemiatrix | A real CV just opens. The one asking for an extra step to view it is worth a second look. | twin | written | catch |
| ca02-T1m | gen_e2_e4_shells.py:74 (after→miss[0]) | Fatima Begum | Vindemiatrix | That application with the attachment that wanted a second click was the one to stop. | twin | written | miss |
| ca02-T2m | gen_e2_e4_shells.py:74 (after→miss[1]) | Fatima Begum | Vindemiatrix | It ran, so we lost the HR machine for a rebuild and recruitment paused while we re-contacted candidates by hand. | twin | written | miss |
| ca03-T1c | gen_e3_e5_shells.py:67 (after→catch[0]) | Darren Price | Orus | You turned down that caller pushing for a reset who wouldn't be rung back, so no claims account opened for someone we couldn't place. | twin | written | catch |
| ca03-T2c | gen_e3_e5_shells.py:67 (after→catch[1]) | Darren Price | Orus | Prompt-bombing just wears people down until they tap yes. Number matching takes the idle tap out of it. | twin | written | catch |
| ca03-T1m | gen_e3_e5_shells.py:67 (after→miss[0]) | Darren Price | Orus | That caller pushing for a reset, the one who wouldn't be rung back, was the one to stop. | twin | written | miss |
| ca03-T2m | gen_e3_e5_shells.py:67 (after→miss[1]) | Darren Price | Orus | It went through, so a claims account opened to a stranger and the team lost the afternoon to forced resets. | twin | written | miss |
| ca04-T1c | gen_e2_e4_shells.py:78 (after→catch[0]) | Thandiwe Moyo | Pulcherrima | You held that urgent payment in Catherine's name until you'd reached her, so it never left for an account that wasn't hers. | twin | written | catch |
| ca04-T2c | gen_e2_e4_shells.py:78 (after→catch[1]) | Thandiwe Moyo | Pulcherrima | A voicemail that sounds like her and says don't ring back is the exact bit to distrust. | twin | written | catch |
| ca04-T1m | gen_e2_e4_shells.py:78 (after→miss[0]) | Thandiwe Moyo | Pulcherrima | That urgent payment in Catherine's name, pushed through on a voicemail that sounded like her, was the one to stop. | twin | written | miss |
| ca04-T2m | gen_e2_e4_shells.py:78 (after→miss[1]) | Thandiwe Moyo | Pulcherrima | It went to the attacker's account, the real supplier later chased what it was owed, and finance spent the afternoon unpicking it. | twin | written | miss |
| ca05-T1c | gen_e3_e5_shells.py:71 (after→catch[0]) | Niamh Doherty | Leda | You read the address before signing in, so that lookalike page never got a real password off anyone here. | twin | written | catch |
| ca05-T2c | gen_e3_e5_shells.py:71 (after→catch[1]) | Niamh Doherty | Leda | The look and the padlock both copy fine. The address bar is the one bit they can't fake. | twin | written | catch |
| ca05-T1m | gen_e3_e5_shells.py:71 (after→miss[0]) | Niamh Doherty | Leda | That page copying our sign-on, on an address that was almost right, was the one to stop. | twin | written | miss |
| ca05-T2m | gen_e3_e5_shells.py:71 (after→miss[1]) | Niamh Doherty | Leda | The password went in, so a claims account was wide open and IT lost the day to resets and a records review. | twin | written | miss |
| ca06-T1c | gen_e6_e7_shells.py:397 (after→catch[0]) | Chidi Okeke | Zubenelgenubi | You didn't scan that barrier QR or tap the parking text, so no card number and no work sign-in went anywhere. | twin | written | catch |
| ca06-T2c | gen_e6_e7_shells.py:397 (after→catch[1]) | Chidi Okeke | Zubenelgenubi | A code on an official-looking notice is the easy one to trust. Opening the app yourself skips the whole thing. | twin | written | catch |
| ca06-T1m | gen_e6_e7_shells.py:397 (after→miss[0]) | Chidi Okeke | Zubenelgenubi | That barrier QR, and the parking-permit text behind it, were the one to stop. | twin | written | miss |
| ca06-T2m | gen_e6_e7_shells.py:397 (after→miss[1]) | Chidi Okeke | Zubenelgenubi | One tap later, a personal card was charged or a work sign-in captured, and the afternoon went on the phone to the bank. | twin | written | miss |
| ca07-T1c | gen_e6_e7_shells.py:401 (after→catch[0]) | Agnieszka Duda | Callirrhoe | You rang back before releasing that payment, so a voice that sounded like the boss didn't move money out the door. | twin | written | catch |
| ca07-T2c | gen_e6_e7_shells.py:401 (after→catch[1]) | Agnieszka Duda | Callirrhoe | The "keep this quiet" is the real tell. It's there to buy time before anyone checks. | twin | written | catch |
| ca07-T1m | gen_e6_e7_shells.py:401 (after→miss[0]) | Agnieszka Duda | Callirrhoe | That call in the boss's voice, asking to release a payment quietly, was the one to stop. | twin | written | miss |
| ca07-T2m | gen_e6_e7_shells.py:401 (after→miss[1]) | Agnieszka Duda | Callirrhoe | The payment went, the whole run froze while every recent one was re-checked, and finance lost the afternoon to it. | twin | written | miss |
| ca08-T1c | gen_e8_e17_shells.py:421 (after→catch[0]) | Anjali Rao | Kore | You reported that approval fast, so we isolated the account before it could send messages, reset passwords or reach the shared drive. | twin | written | catch |
| ca08-T2c | gen_e8_e17_shells.py:421 (after→catch[1]) | Anjali Rao | Kore | A trusted internal account is worth more to them than any outside one. Speed is what closes the gap. | twin | written | catch |
| ca08-T1m | gen_e8_e17_shells.py:421 (after→miss[0]) | Anjali Rao | Kore | That spoofed sign-in approval, during the migration when a re-sign-in was expected, was the one to report at once. | twin | written | miss |
| ca08-T2m | gen_e8_e17_shells.py:421 (after→miss[1]) | Anjali Rao | Kore | It stood, so the shared drive went down and work stopped while we rebuilt it from backup. | twin | written | miss |
| ca09-T1c | gen_e8_e17_shells.py:448 (after→catch[0]) | Nilesh Solanki | Iapetus | You didn't read that code back to the text pretending to be IT, so the one-time code stayed yours and the account held. | twin | written | catch |
| ca09-T2c | gen_e8_e17_shells.py:448 (after→catch[1]) | Nilesh Solanki | Iapetus | A manager and a passkey make a reused password harmless, and every sign-in belongs to one person. | twin | written | catch |
| ca09-T1m | gen_e8_e17_shells.py:448 (after→miss[0]) | Nilesh Solanki | Iapetus | That text posing as IT, asking you to read a code back, was the one to stop. | twin | written | miss |
| ca09-T2m | gen_e8_e17_shells.py:448 (after→miss[1]) | Nilesh Solanki | Iapetus | The account opened on a reused password, and with shared logins the audit couldn't say who had done what. | twin | written | miss |
| ca10-T1c | gen_e8_e17_shells.py:462 (after→catch[0]) | Niamh Doherty | Leda | You didn't follow that fake "verify you're human" step on the portal, so no extension got near the finance system. | twin | written | catch |
| ca10-T2c | gen_e8_e17_shells.py:462 (after→catch[1]) | Niamh Doherty | Leda | Anything telling you to paste, run or install to carry on is the tell. Real software comes from a route you already trust. | twin | written | catch |
| ca10-T1m | gen_e8_e17_shells.py:462 (after→miss[0]) | Niamh Doherty | Leda | That page dressed as a routine check, asking you to run a step to continue, was the one to stop. | twin | written | miss |
| ca10-T2m | gen_e8_e17_shells.py:462 (after→miss[1]) | Niamh Doherty | Leda | The step ran, an extension reached finance and the intranet, and the machine was off for a rebuild. | twin | written | miss |
| ca11-T1c | gen_e8_e17_shells.py:435 (after→catch[0]) | Tomasz Wiśniewski | Algieba | You caught that overtime sheet of health notes heading to the wrong Payroll contact, so residents' details never left the building. | twin | written | catch |
| ca11-T2c | gen_e8_e17_shells.py:435 (after→catch[1]) | Tomasz Wiśniewski | Algieba | A misdirected item is a same-day word with me, never a quiet delete. That's what keeps it containable. | twin | written | catch |
| ca11-T1m | gen_e8_e17_shells.py:435 (after→miss[0]) | Tomasz Wiśniewski | Algieba | That send of residents' health notes to a familiar-looking wrong address was the one to stop. | twin | written | miss |
| ca11-T2m | gen_e8_e17_shells.py:435 (after→miss[1]) | Tomasz Wiśniewski | Algieba | It left, so special-category details reached people with no right to them, and my week went to the recall and the letters. | twin | written | miss |
| ca14-T1c | gen_e8_e17_shells.py:457 (after→catch[0]) | Julian Sallow | Rasalgethi | You checked that new contact by a known route, so the account wearing a partner's name got nothing out of the studio. | twin | written | catch |
| ca14-T2c | gen_e8_e17_shells.py:457 (after→catch[1]) | Julian Sallow | Rasalgethi | It reads like an insider because it's built from our public posts. The name alone is never the proof. | twin | written | catch |
| ca14-T1m | gen_e8_e17_shells.py:457 (after→miss[0]) | Julian Sallow | Rasalgethi | That second account in a partner's name, friendly and knowing our details, was the one to doubt. | twin | written | miss |
| ca14-T2m | gen_e8_e17_shells.py:457 (after→miss[1]) | Julian Sallow | Rasalgethi | It was trusted, so a security answer went public, and a week later we were resetting it and reporting the fake account. | twin | written | miss |
| ca15-T1c | gen_e8_e17_shells.py:439 (after→catch[0]) | Nilesh Solanki | Iapetus | You handed that found stick to us unopened, so nothing on it ever ran on a work machine. | twin | written | catch |
| ca15-T2c | gen_e8_e17_shells.py:439 (after→catch[1]) | Nilesh Solanki | Iapetus | A dull non-event is the point. The free shortcut is where a client pack ends up somewhere we can't account for. | twin | written | catch |
| ca15-T1m | gen_e8_e17_shells.py:439 (after→miss[0]) | Nilesh Solanki | Iapetus | That stick left to be found, or the free tool for the client pack, was the one to stop. | twin | written | miss |
| ca15-T2m | gen_e8_e17_shells.py:439 (after→miss[1]) | Nilesh Solanki | Iapetus | It got used, so months on nobody could say where that client data was or who could read it. | twin | written | miss |
| ca16-T1c | gen_e8_e17_shells.py:452 (after→catch[0]) | Anjali Rao | Kore | You kept your sign-in to yourself and sent her to the service desk, so no one else's actions landed under your name. | twin | written | catch |
| ca16-T2c | gen_e8_e17_shells.py:452 (after→catch[1]) | Anjali Rao | Kore | Lending a login feels kind, but it leaves you answerable for whatever is done with it. | twin | written | catch |
| ca16-T1m | gen_e8_e17_shells.py:452 (after→miss[0]) | Anjali Rao | Kore | That ask to borrow your sign-in, from a colleague locked out and under pressure, was the one to turn down. | twin | written | miss |
| ca16-T2m | gen_e8_e17_shells.py:452 (after→miss[1]) | Anjali Rao | Kore | It was lent, so the audit pointed at you for work that was never yours, and nobody could say who did what. | twin | written | miss |
| ca18-T1c | gen_e8_e17_shells.py:468 (after→catch[0]) | Ama Owusu | Autonoe | You didn't trust that fake lockout alert, so it never steered a password onto a look-alike page and opened an account here. | twin | written | catch |
| ca18-T2c | gen_e8_e17_shells.py:468 (after→catch[1]) | Ama Owusu | Autonoe | A unique password per account in a manager, with MFA, is the one habit that beats both spraying and stuffing. | twin | written | catch |
| ca18-T1m | gen_e8_e17_shells.py:468 (after→miss[0]) | Ama Owusu | Autonoe | That lockout alert dressed as our own IT, hurrying you to sign in again, was the one to stop. | twin | written | miss |
| ca18-T2m | gen_e8_e17_shells.py:468 (after→miss[1]) | Ama Owusu | Autonoe | The password reached the fake page, and the account it opened reached work email, client files and a supplier portal. | twin | written | miss |
| ca19-T1c | gen_e8_e17_shells.py:430 (after→catch[0]) | Anjali Rao | Kore | You restarted when asked and reported it fast, so the sweep that locked other machines never reached this desk. | twin | written | catch |
| ca19-T2c | gen_e8_e17_shells.py:430 (after→catch[1]) | Anjali Rao | Kore | The macro, the postponed restart, the protection waved off, each one just hands a program your access. | twin | written | catch |
| ca19-T1m | gen_e8_e17_shells.py:430 (after→miss[0]) | Anjali Rao | Kore | That document wanting content enabled, and the restart put off, were the ones to stop. | twin | written | miss |
| ca19-T2m | gen_e8_e17_shells.py:430 (after→miss[1]) | Anjali Rao | Kore | It ran, machines locked and claims work stopped, and the team lost a weekend to rebuilds. | twin | written | miss |
| ca20-T1c | gen_e8_e17_shells.py:444 (after→catch[0]) | Zainab Hussain | Achernar | You treated that Wi-Fi sign-in page as a trap and used your hotspot, so your work password never reached a look-alike network. | twin | written | catch |
| ca20-T2c | gen_e8_e17_shells.py:444 (after→catch[1]) | Zainab Hussain | Achernar | A page on the café network asking for your work password is the fake. A lost device reported at once is locked in minutes. | twin | written | catch |
| ca20-T1m | gen_e8_e17_shells.py:444 (after→miss[0]) | Zainab Hussain | Achernar | That look-alike Wi-Fi page asking for your work password was the one to stop. | twin | written | miss |
| ca20-T2m | gen_e8_e17_shells.py:444 (after→miss[1]) | Zainab Hussain | Achernar | The password went in, so the account was used from another town and had to be reset and traced. | twin | written | miss |

## Counts against 4.1

- Twin lines (budget unit, one host line per twin): **16** / 16. On budget.
- Clips written: 64 (each twin line = catch[0], catch[1], miss[0], miss[1], as the ca01/ca12 twins).
- Host/stub/pool/layer lines: 0 (P-TW owns twin lines only).
- All 16 twins accounted for: ca02, ca03, ca04, ca05, ca06, ca07, ca08, ca09, ca10, ca11, ca14, ca15, ca16, ca18, ca19, ca20. ca13's twin is P-H3's (hand-authored); ca17 has no twin host line.

Every clip is ≤ 30 words (checked by hand). No blame, no money figure, no reusable method,
no figure repeated from layer 1; UK English, "Cyber Security" where it occurs.

## npc-dialog-review verdict

Reviewed 2026-11-20 (opus48), npc-dialog-review section 2l (P1-P13), against the ca01
(`scenarios/ca01_invoice_fraud_defend/ink/adaeze_okafor.ink`) and ca12
(`gen_e8_e17_shells.py:412-418`) twins as the model. 16 twins, 64 clips.

**Outcome: 52 clips accepted as written, 12 accept-with-change (all applied above).**

All 12 changes are the same **P13** finding — a written semicolon in speech (11 clips) or an
abstract phrase (1). TTS strips punctuation, so each fix keeps the clip and costs nothing; the
replacements split into two short sentences each carrying a distinct point (tell + reason), which
section 2l allows. All stay ≤ 30 words, no `{var}`, UK English.

| id | verdict | change |
|---|---|---|
| ca02-T2c | accept with change | P13: semicolon → full stop; trimmed "the one … is the one" |
| ca03-T2c | accept with change | P13: semicolon → full stop; trimmed "is what … out of it" |
| ca05-T2c | accept with change | P13: semicolon → full stop |
| ca06-T2c | accept with change | P13: semicolon → full stop |
| ca07-T2c | accept with change | P13: semicolon → full stop |
| ca08-T2c | accept with change | P13: semicolon → full stop |
| ca09-T2c | accept with change | readability: "make reuse stop mattering" → "make a reused password harmless" |
| ca10-T2c | accept with change | P13: semicolon → full stop |
| ca11-T2c | accept with change | P13: semicolon → full stop; "not" → "never" eases the parallelism |
| ca14-T2c | accept with change | P13: semicolon → full stop |
| ca15-T2c | accept with change | P13: semicolon → full stop |
| ca20-T2c | accept with change | P13: semicolon → full stop |

All other 52 clips accept. Checks passed across the batch: catch and miss read as distinct
outcomes (catch[0] = what the report bought in the firm's own terms, catch[1] = the attacker's
angle/tell, miss[0] = which one to stop, miss[1] = consequence), no blame on learner or
colleague, no figure and no reusable method/command, attacker's side told in attacker terms, all
≤ 30 words, no `{var}`. Voices read uniformly plain across the cast, which fits the kiosk-host
role and matches the ca01/ca12 model.

**Two lines for the owner's eye (left as written, not changed):**

- **ca16-T2m** — "the audit pointed at you for work that was never yours" lands the accountability
  consequence on the learner. It is the teaching point of ca16 (your login is you), not blame for
  letting an attacker in, so it is within the content rules; flagged only because it is the one
  clip that points at "you".
- **ca20-T2c** — now two facts in one line (fake café Wi-Fi page, and reporting a lost device).
  Both sit inside e20's on-the-road scope, but it is the one catch[1] that teaches two tells
  rather than one. Trim the lost-device half if the owner wants it single-point.

Twin lines are unvoiced under D226/D207, so no voicing card follows. Commit: recorded below.
