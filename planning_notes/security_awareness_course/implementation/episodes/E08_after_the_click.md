# E8 after the click (implementation spec)

Status: draft for a Sonnet implementer. This is the **pilot**: the first new awareness episode, chosen because it fits the built runner stages almost exactly and proves the new-episode pipeline end to end. Keep it as close to the built E1 and E5 shells as possible. The one engine dependency is **ENG-01** (the flip variant); everything else is content the implementer authors by copying built keys.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits (the orchestrator commits).

---

## 1. Goal and module(s)

Teach what to do in the first minutes after a click, and the signs that an account is already being used by someone else. E8 carries **core_04** (spotting and reporting incidents) and **core_01 LO6** (the first steps after clicking a link, opening an attachment or typing a password) together. The lesson is the module title: most of the damage happens between noticing and reporting, so the right first move for every real sign is the same, report it through a route you trust and leave the device as it is.

Behaviours scored (from `modules/core_01_phishing_email/assessment.md`): C01-B6 (takes the first steps after a click), C01-B7 (reports their own click or sign-in), plus core_04 LO1, LO2, LO5, LO6.

## 2. Read first (exact paths)

- This folder's shared brief: `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `planning_notes/security_awareness_course/modules/core_04_spotting_and_reporting_incidents/concepts.md` (the whole file); `modules/core_04_.../game_design.md` (the E8 design); `modules/core_01_phishing_email/game_design.md` (the E8 section) and `modules/core_01_.../assessment.md` (C01-B6, C01-B7, C01-Q4, C01-Q7).
- The nearest built episode, end to end: **E1** `scenarios/awareness_e1_invoice_fraud/` (same stage list, same "attack with no built link" shape) and **E5** `scenarios/awareness_e5_signin_pages/` (same company, same host room). Read their `scenario.json.erb`, `mission.json` and `ink/*.ink`, and the fragments `planning_notes/phishing_and_social_engineering/awareness/e1/{attack,defend}.json` and `.../e5/{attack,defend}.json`.
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (factor library and the shared channel-tell library, around the "Channel tells" table; triageSet `truth` shape; `EvalResult`; §10a email identity).
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (Quayholt Insurance roster and `_brandAdditions`); `modules/.../03_WORLD_AND_CAST.md` (hosts table; the E8 row names Anjali Rao).
- The runner stage list: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`, `DEFAULT_STAGES`, `flipPage`/`flipCall`).
- Engine packet: `planning_notes/security_awareness_course/implementation/02_ENGINE_WORK.md`, packet **ENG-01**.

## 3. Depends on

- **ENG-01** (flip variant: the learner sits in the seat of the victim whose account is now in use). This is the only hard engine dependency. See §10 for exactly what it must do and what config E8 passes it.
- Scenario-local channel tells for the account-takeover signs (see §11). These are declared in the triageSet's `channelTells` array and in each message's `truth.flags`; if the engine's defend scorer only accepts tells from the shared library, this needs **ENG-08** (schema and validator) to register the three new ids. Confirm against `scripts/validate_social/` and `systems/phish-rules.js` before build; if the validator rejects unknown tells, the three new ids must be added to the shared library first.

## 4. Owner models

- Content writing and dialogue review: `opus48`.
- The shell wiring (copying the fragment into `scenario.json.erb`, `mission.json`, the host ink, globals, objectives, the Hacktivity deploy) and ENG-01: general-purpose or Sonnet, after the content is approved.

## 5. Company, room and host

- **Company:** Quayholt Insurance (`quayholt_insurance`). Brand block, copied exactly from the built E5 shell: `{ "name": "Quayholt Insurance", "logoText": "QUAYHOLT", "accent": "#6b4c9a" }`.
- **Room:** reuse the built `room_aw_quayholt` training room, exactly as `scenarios/awareness_e5_signin_pages/scenario.json.erb` wires it (`"type": "room_aw_quayholt"`, `chatBackground": "assets/backgrounds/rooms/aw_quayholt_blended.png"`, the same lighting block, the kiosk object). No new room.
- **Host:** **Anjali Rao**, information security analyst, `anjali.rao@quayholt.example` (built Quayholt cast; she is the genuine sender of `hb_policy_refresh` in `e3/defend.json` and is named in BRAND_SET §3 Quayholt). She is the analyst who receives reports, which is why she hosts an incident-reporting episode. No new cast member for the host.
- **Role:** `general_staff` (as E5).
- **Victim seat / attack target:** **Ayaan Warsame**, claims handler, `ayaan.warsame@quayholt.example` (built Quayholt cast: the colleague fooled in the E5 flip line and the genuine caller `ha_vm_locked` in `e3/defend.json`). The learner phishes Ayaan in the attack half, and after the flip sits in Ayaan's seat for the defend half. Reusing Ayaan avoids a new name and keeps Hana Novak (E5's victim) from being phished twice across the product.

No new cast names are introduced by E8. All people and the company are fictional; every address ends `.example`.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Anjali's welcome and the scope note. |
| osint | 3.0 | Two public sources; four facts. As E1's OSINT, lighter. |
| write | 3.5 | One credential-phish email in the mail client, template mode, red-flag meter. No build stage, no working link (as E1). |
| flip | 1.5 | ENG-01: the click, then the learner becomes Ayaan and sees the first odd sign. |
| defend | 4.0 | The signs-that-follow set, about 6 to 7 items, Verify on, immediate feedback. |
| debrief | 2.0 | Reasoning cards, the two E8 concept cards, the tally, the habit, the "On Monday" card, the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "osint", "write", "flip", "defend", "debrief"]`. This is **identical to the built E1 stage list** (`awareness_e1_invoice_fraud` uses the same, via `DEFAULT_STAGES.full`), which is why E8 is the pilot: no `build` stage, no `mfa` stage. The only stage that behaves differently from E1 is `flip`, handled by ENG-01 (§10).

Defend-only: `["brief", "defend", "debrief"]`.

All ids are from the frozen `STAGE_IDS` in `episode-model.js`. E8 adds no new stage id.

## 8. Brief and scope note (the host's draft lines; the dialogue reviewer polishes)

- **Episode id:** `e8_after_the_click`. Defend-only shell id: `e8_after_the_click_defend`.
- **`awarenessEpisode.strings.brief`:** "You're on an authorised exercise at Quayholt Insurance, a fictional company. First you're on the red team: look at what's public about a Quayholt colleague, then write one email, dressed up as the IT service desk, that asks them to sign in again. Then you swap seats. The colleague clicked, and now you're the one whose account is being used. Sort the signs that follow. Only that second part is scored."
- **`scopeNote`:** "Authorised exercise at Quayholt Insurance, a fictional company. In scope: one email to a Quayholt colleague, and the signs that follow in that colleague's inbox. Nothing you write leaves the game."
- **Anjali's welcome (host ink, resting at the hub, following the E5 `niamh_doherty.ink` pattern):** "Welcome to the Quayholt exercise. Everyone clicks something eventually, so today is about the ten minutes after, and how one quick report changes the ending. Start at the kiosk: write the email first, then take the other seat and sort what turns up."
- **Red team lead seeded brief** (the `brief` message in `mailClient.seededMessages`, copy the E1/E5 shape and the `avatar": "npc_neutral"`): from "Red team lead" `lead@redteam.example`, to `analyst@quayholt.example`, subject "Authorised exercise: Quayholt Insurance", body: "Hello,\n\nThis is the authorised Quayholt Insurance exercise. In scope: this inbox and the colleague on it. Research the service desk notices staff act on, then write one message asking a colleague to sign in again. Nothing leaves this account.\n\nRed team lead".

## 9. Attack half

E1-shaped: OSINT, then one email in the mail client (template mode, red-flag meter), no build stage and no working link. The learner impersonates the Quayholt IT service desk and emails Ayaan a "sign in again" credential phish. Scored: false.

### OSINT facts (ids, sources, provides)

Reuse the E5 Quayholt sites `quayholt_site` and `quayholt_social` (`osint.profile: "awareness"`). Four facts, modelled on `e5/attack.json`. New `se_intel_*` globals must each be declared `false` in `globalVariables` (see §15).

| fact id | subject | source element | fact text | provides |
|---|---|---|---|---|
| `quayholt_it_desk` | `itdesk` | `blk_itdesk` (IT page, `kind: field`) | "Quayholt's IT notices to staff come from the service desk, it-servicedesk@quayholt.example." | `name`/sender `itdesk_full` "Quayholt IT Service Desk" distinctive; `address` fixed `itdesk_address` "it-servicedesk@quayholt.example" distinctive |
| `quayholt_sso_migration` | `itdesk` | `blk_news` (news page) | "Quayholt is moving single sign-on to a new provider this month; staff were told they may be asked to sign in again." | `reference` `sso_migration` "the SSO move this month" distinctive |
| `quayholt_staff_claims` | `ayaan` | `blk_staff` (team page, `kind: staff`) | "Ayaan Warsame is a claims handler at Quayholt, ayaan.warsame@quayholt.example." | (none; identifies the target) |
| `quayholt_ayaan_busy` | `ayaan` | `post_ayaan` (social) | "Ayaan posted that the claims team is flat out clearing a backlog this week." | (none; supplies the hurry) |

`quayholt_it_desk` and `quayholt_sso_migration` are the same two facts the built E5 attack uses (copy their `reduceNote` text verbatim from `e5/attack.json`). `people`: `ayaan` (cast), `itdesk` (outside, display "Quayholt IT Service Desk", address `it-servicedesk@quayholt.example`), as in E5.

### Templates and slots

Copy the E5 template shapes (`e5/attack.json`). From line names a sender name and address; the pretext references the SSO move; the ask says "sign in again". Provide a calm variant and an off-topic decoy so the red-flag meter has something to flag.

- `e8_from` (part `from`): `"{sender_name} <{sender_address}>"`, slots `sender_name` (name, about sender), `sender_address` (address).
- `e8_greet` (part `greeting`): `"Hello,"`, no slots.
- `e8_pretext_reauth` (part `pretext`, urgency high): "We are moving the {portal} to a new provider and your session has ended. Please sign in again today to keep your access while the claims backlog is cleared." slot `portal` (reference, about portal) taking `sso_migration`.
- `e8_pretext_reauth_calm` (part `pretext`, urgency low): "We are moving the {portal} to a new provider this month, so you may be asked to sign in again. When you have a moment, please sign in to confirm your access." slot `portal`.
- `e8_pretext_newsletter` (part `pretext`, urgency low): "Here is this month's staff newsletter from around Quayholt." no slots. (the off-topic decoy)
- `e8_ask` (part `ask`, urgency medium): "Sign in through the link before the end of the day." no slots.
- `e8_ask_calm` (part `ask`, urgency low): "There's no rush: sign in when it next suits you." no slots.

Note: because E8 has no `build` stage and no landing page, the ask names "the link" in prose only; there is no payload-kit link item and `linkCredible` is not a factor here (contrast E5, which does build a page). Keep the mail client config as E1's (`"bodyMode": "templates"`, `"freeTextFlavour": false`, `"showRedFlagMeter": true`, `"checklistTiming": "onSend"`).

### phishTarget `takeover_victim` (the attack target; copy the E5 `sso_staff` shape, drop the link factor)

- `id`: `takeover_victim`; `address`: `ayaan.warsame@quayholt.example`; `displayName`: "Ayaan Warsame"; `role`: "Claims handler".
- `subjects`: `{ "id": "s_signin", "text": "Action needed: sign in again", "topic": "it" }` and `{ "id": "s_other", "text": "Quick note", "topic": "general" }`.
- `interests`: `{ "topics": ["it"] }`. `emailReplyDelay`: 6. `redFlagMeter`: true. `urgency`: `{ "advisoryMax": "medium" }`.
- `templateSets`: from `["e8_from"]`, greeting `["e8_greet"]`, pretext `["e8_pretext_reauth", "e8_pretext_reauth_calm", "e8_pretext_newsletter"]`, ask `["e8_ask", "e8_ask_calm"]`.
- `primedFor`: `{ "distinctiveValues": ["sso_migration"], "minDistinct": 1, "trusts": ["itdesk"], "story": "an IT notice to sign in again while single sign-on is moved to a new provider" }`.
- `requiredFactors`: `["senderTrust", "pretextRelevant"]`. `advisoryFactors`: `["urgencyCalibrated"]`. (No `linkCredible`, no `senderAuth` build; this keeps E8 at E1's complexity.)
- `factorStrings`: author `open`, `senderTrust`, `pretextRelevant`, `urgencyCalibrated` in the E5/E1 voice. Draft `senderTrust.redFlag`: "The From line carries the service desk's real address, so it reads as the IT notice Ayaan acts on, but it was forged: the service desk never sent it."
- `replies`: `landed`: "Thanks, I'll sign in now before the backlog meeting." `missed`: "I don't sign in from an email link. I'll go to the portal the normal way and check with the service desk."
- `hints`: three, in the E5 voice (which address staff trust for IT notices; what change makes an unexpected sign-in read as expected; keep the ask calm so the meter does not flag urgency).
- `outcome`: `{ "setGlobal": { "phish_takeover_victim_landed": true } }`.

### Red-flag meter factors

`senderTrust` (spoofing the IT service desk), `pretextRelevant` (tie to the SSO move), `urgencyCalibrated` (advisory; the "today" push). No `linkCredible`, no `senderAuth`.

### The one consequential choice quoted in the flip (aw2)

The choice the flip replays is the **sender**: setting the From line to the Quayholt IT service desk's real address (`itdesk_full` + `itdesk_address`) rather than the learner's own, so it reads as the IT notice Ayaan already acts on. That is the single lever that made Ayaan sign in, and the flip quotes it.

## 10. Flip (where ENG-01 is needed)

This is the episode's only new engine behaviour, and the reason to note it precisely.

In the built episodes the `flip` stage replays the learner's own artefact to its recipient and shows a scripted defender line. E1's flip shows the email as the payments team saw it (`flipDefenderLine`); E5's flip shows the built page as Hana met it (`flipPage` in `episode-model.js`). **ENG-01 makes the flip go one beat further for E8: the recipient does not just read it, they click and sign in, and the view then seats the learner as that recipient (Ayaan), whose account is now being used.** The flip ends by surfacing the first odd sign (a sent-items entry Ayaan did not write), which hands straight into the defend half.

What ENG-01 must provide, and what E8 passes it:

- A flip mode that, after the scripted "they clicked and signed in" line, re-frames the defender seat as the learner's own ("now you are Ayaan") rather than returning the learner to the red-team seat. In `episode-model.js` this is a variant of the `flip` branch of `childLaunch`/`flipPage`; E8 sets it through an `awarenessEpisode.flip` config block (new; ENG-01 defines its exact key). Proposed config E8 passes: `{ "variant": "becomeVictim", "victimTarget": "takeover_victim", "firstSign": "e8_sent_invoice" }`, where `firstSign` names the defend-set message shown as the opening sign.
- The flip strings E8 authors (in `awarenessEpisode.strings`, same keys as E1/E5): `flipHeading` "Now it lands on you"; `flipIntro` "This is your email as Ayaan, the claims handler you sent it to, met it, and this time he signed in."; `flipDefenderLine` (draft) "Ayaan read it between two claims, in the week his team was clearing a backlog. The service desk's own address was on it and it only asked him to sign in again, which IT had said would happen while single sign-on moved. So he did. That isn't carelessness: it was built to pass for the notice he acts on, and the one thing that gave it away was the sender's real address."; plus `flipNoSend`, `flipMissed`, `flipMissedHeading`, `flipLandedNoTells` in the E5 voice, each ending "next, you're the one whose account is being used, sorting the signs that follow." A `becomeVictimIntro` string (new, ENG-01): "The sign-in went through, and it wasn't Ayaan who used it. You're now in his seat. These are the signs that turned up over the next hour."

If ENG-01 is not ready, E8 cannot ship its full variant. The **defend-only variant needs no ENG-01** (it skips the flip), so the defend-only shell and its Hacktivity course can ship first and prove the rest of the pipeline. Note this to the orchestrator.

## 11. Defend set

Set id `e8_used_account`; episode prefix `episode_e8_after_the_click_defend_`. `scoringProfile: "awareness"`, `verifyVerdict: true`, `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"` (the E1 episode-set config). Verdicts: Trust, Report, Delete, Verify (ring the service desk or Anjali on a number already held). `reportAlwaysVisible: true`.

The set is Ayaan's inbox, seen as "you" after the flip. The teaching point: every real sign gets the same first move, report it and leave it. About 6 to 7 items; the parcel item (row 7) may be cut to reach six.

`channelTells` array: `["unexpected_sent_item", "unrequested_reset", "unrequested_mfa_push", "ransomware_note", "lookalike_domain", "secrecy_or_bypass"]`. `unrequested_mfa_push` and `lookalike_domain` and `secrecy_or_bypass` are in the shared library already (`00_data_contract.md`). **The three new ids `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` are account-takeover and malware signs with no built equivalent.** They are the first awareness tells for account takeover; add them to the shared channel-tell library (an ENG-08 change) so the defend scorer and the chip list accept them, with these canonical strings:

- `unexpected_sent_item`: "A message in your Sent folder that you did not write"
- `unrequested_reset`: "A password change or reset confirmation you did not ask for"
- `ransomware_note`: "Files that will not open, with a note on screen demanding payment"

If the validator will accept scenario-local tells without a library change, author them in-scenario and flag the choice; otherwise require the ENG-08 addition before build.

### Items (id, kind, from/caller, subject/line, tells and flags, verdict, Verify, reason)

| # | id | kind | from / sign | subject or line | phish? | flags | verdict | Verify | reason (perFlagNote / whyFine) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `e8_sent_invoice` | email (in Sent) | "You" (Ayaan), to `claims-client@ashcombelaw.example` | "Updated payment details for your settlement" | yes (takeover) | `unexpected_sent_item`, `secrecy_or_bypass` | Report | on | A message in your own Sent folder, to a client, that you never wrote, asking them to pay a new account and keep it quiet; it means someone is in your mailbox now. |
| 2 | `e8_reset_confirm` | email | "Quayholt IT" `it-notices@quayholt.example` (genuine system address, but unrequested) | "Your password was changed" | yes (takeover sign) | `unrequested_reset` | Report | on | The address is really Quayholt's, but you did not change your password. A confirmation for a change you did not make means someone else made it. Report it and let the service desk lock the account. |
| 3 | `e8_push_abroad` | push (authenticator card) | "Quayholt Sign-in", account `ayaan.warsame@quayholt.example`, location "Unknown location, outside the UK", device "Windows PC", time "11:48" | "Are you trying to sign in?" | yes | `unrequested_mfa_push` | Deny and report | n/a | A prompt you did not start means someone has your password and is trying to get in. Deny it and report it. (Reuses the E3 push card exactly; copy `e3_push_early`'s `push` shape.) |
| 4 | `e8_colleague_slip` | email | Reuben Ofori `reuben.ofori@quayholt.example` (genuine colleague) | "I think I've sent something to the wrong client" | no (genuine; a colleague's own mistake) | (none) | Report (help them report) | on | Reuben really did make a mistake: he sent a claims spreadsheet to the wrong client and is asking what to do. The right move is to help him report it now, not to say nothing; a misdirected record reported in minutes can be contained. Reporting is the scored move; nobody is in trouble for owning up. |
| 5 | `e8_locked_files` | page/notice | On-screen note on the shared drive | "Your files are locked. Read README_UNLOCK.txt" | yes (malware sign) | `ransomware_note` | Report and leave it | on | Files that will not open and a note demanding payment is a sign to report at once and leave the device as it is: do not restart it, do not delete the note, do not try to open the files again. Follow the service desk. (No ransom amount, no countdown, no "pay" button; E8 stops at "report and leave it", core_07 owns the rest.) |
| 6 | `e8_maintenance` | email | "Quayholt IT" `it-notices@quayholt.example` (genuine) | "Planned maintenance on the claims system, Saturday 08:00 to 12:00" | no (genuine; the calibration mirror) | (none) | Trust, or Verify | on | A planned-outage notice from IT's real address, announced on the intranet too, asking you to do nothing. This is the benign look-alike: after a run of real signs it is tempting to report everything. Trusting it is right, and Verifying it (a quick look at the intranet notice) is thanked, not marked down. |
| 7 | `e8_parcel` | email | "Quayholt Reception" `reception@quayholt.example` (genuine) | "A parcel is waiting for you at the front desk" | no (genuine; plain-ordinary) | (none) | Trust | on | An ordinary reception notice from Quayholt's own address, nothing to sign in to or pay. Not everything in a bad hour is an attack. (Cut this to reach six items if needed.) |

Each phish item carries `truth.ifTrusted` and `truth.reportReply` in the E1 voice; each genuine item carries `truth.whyFine` with a `default` and, where a factor could be misread, a per-factor key (copy the E1/E5 pattern). The push item (row 3) copies the `e3_push_early` card verbatim (same `push` object fields, same `perFlagNote`/`ifTrusted`/`reportReply`).

### Mirror pair (aw5)

Rows 5 and 6 are the pair: the **locked-files note** (a real sign that looks alarming and is a Report) against the **maintenance notice** (a genuine, planned IT message that could be mistaken for a sign and is a Trust/Verify). Both involve "IT and your systems", so the learner cannot win on "anything to do with IT is bad". A second soft pair is row 2 (unrequested reset, a Report) against row 6 (genuine IT notice, a Trust), both from IT's real address.

## 12. Debrief cards

Built debrief view, in the E1/E5 order, plus the two concept cards E8 owns (core_01 and core_04 game designs):

1. A reasoning card per item (from each item's `truth`).
2. **Concept card A, "The five questions a report answers"** (core_04): what, when, where, who, and what you have done. Draft text: "A useful report answers five questions, as far as you know: what you noticed, when, where (which account, device or system), who is affected, and what you have done so far. Be honest about the last one: 'I clicked the link', 'I signed in', 'I restarted it'. A rough report now beats a perfect one later; the team will ask for the rest."
3. **Concept card B, "First steps and recovery"** (core_01 LO6 and core_04): "If you clicked or signed in: report it, change the password on the real site (not through any link), then change it anywhere you used the same one, and follow the service desk. For anything on a device: leave it as it is. Do not switch it off unless you are told to, do not delete the evidence, and do not try to fix it. If the service desk asks, unplug the network cable or turn off Wi-Fi and leave it on."
4. Genuine-item feedback (rows 4, 6, 7).
5. The team-protected tally (aw6; `teamProtectedOf`).
6. **The habit to keep** (shared, word for word, under heading "The habit to keep"; copy from the built E1 `social.awareness.ruleOfThumb` / `awareness_deploy.py`, do not rewrite): "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."
7. **The "On Monday" card** (`debrief.mondayCard: "slot:customer_report_route"`; the default string below, with the customer route filling the final clause): "On Monday: if you think you have clicked, signed in or spotted something odd on your account or a colleague's, report it straight away, change your password on the real site, and leave the device as it is. Reporting fast, even your own slip, is what limits the damage, and report it using the route in the box below."
8. The customer report route (the slot).
9. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "Everyone clicks something eventually, and a colleague who reports their own slip is doing exactly the right thing. A miss here just shows where to look next time; nobody is in trouble for reporting."

## 13. Defend-only variant

Shell id `e8_after_the_click_defend`, stages `["brief", "defend", "debrief"]`, same defend set `e8_used_account` so the measurement is unchanged, prefix `episode_e8_after_the_click_defend_defend_` (the double-`defend_` pattern the built E1/E5 defend-only shells use). Put the defend-only `brief` and `scopeNote` under `awarenessEpisode._defendOnly` (the eight pinned-strings rule, BRAND_SET §7); the shell copies them over `strings.brief` and `scopeNote`, and every other string is shared (the flip strings are simply never shown). Draft defend-only brief: "You're on an authorised exercise at Quayholt Insurance, a fictional company. A colleague clicked a convincing email and signed in, and now their account is being used. You're covering their inbox. Some of what turns up is a real sign that something is wrong, and some is ordinary. Sort it, and report or check anything that doesn't sit right. Reporting when you're unsure is always fine and never marked down." Defend-only `scopeNote`: "Authorised exercise at Quayholt Insurance, a fictional company. In scope: the signs that follow in a colleague's inbox after a click." **The defend-only variant needs no ENG-01 and can ship first.**

Both variants join both seeded Hacktivity courses (the defend-only course and the both-versions course), as every new episode does (WRITER_BRIEF §Shape).

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E8 feeds the **general** check-form pair at Quayholt (the forms E5 already seeds, `general_form_a`/`general_form_b`), per core_01 assessment ("feeds new items into the general and, where relevant, finance check forms"). Do not edit the existing six role forms (the measured baseline, WRITER_BRIEF defaults). New E8 behaviours (C01-B6 account-takeover signs, C01-B7 own-report) need new check items with mirror pairs, which land in the general forms or a new topic form per `10_CHECK_FORMS.md` and `ENG-09`. Supply: one unrequested-reset item and its genuine-IT-notice mirror; one sent-items-you-did-not-write item and an ordinary-sent-item mirror. Hold the exact wording for the check-forms spec; do not change `passPercent` (0) or the `triage_{stage}_` prefix convention.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e8/attack.json` (new): the attack fragment (people, intelFacts, templates, mailClient, osint, phishTargets), modelled on `e5/attack.json` minus the landing-page and `build` parts.
- `planning_notes/phishing_and_social_engineering/awareness/e8/defend.json` (new): the defend fragment (triageSets with `e8_used_account`; the `awarenessEpisode` block with `strings`, `_defendOnly`, `debrief`; any `_brandAdditions` note, which should be empty because E8 adds no cast).
- `scenarios/awareness_e8_after_the_click/scenario.json.erb`, `mission.json`, `ink/anjali_rao.ink` (new): the full-episode shell, wired like `awareness_e5_signin_pages`. Globals to declare in `globalVariables` (all defaults as shown): `episode_e8_after_the_click_state: {}`, `se_awareness_records: []`, `episode_e8_after_the_click_defend_percent: 0`, `..._reportRate: 0`, `..._done: false`, `..._pass: false`, `se_osint_state: {}`, `se_intel_quayholt_it_desk: false`, `se_intel_quayholt_sso_migration: false`, `se_intel_quayholt_staff_claims: false`, `se_intel_quayholt_ayaan_busy: false`, `phish_takeover_victim_landed: false`, `phish_takeover_victim_attempts: 0`. The host ink completes `send_takeover_phish` on `phish_takeover_victim_attempts > 0` and the conclusion task on `episode_e8_after_the_click_defend_done === true` (copy the E5 `eventMappings`).
- `scenarios/awareness_e8_after_the_click_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: add E8 (full) and E8 (defend-only) through the built deploy path (`awareness_deploy.py`), not by hand-editing Hacktivity. Describe at feature level only.
- ENG-01 engine work: owned by the ENG-01 packet, not by this content writer.

## 16. Bridge script outline

Add `tools/playtest/se/bridge-e8-full.jsonl` (and a defend-only bridge), modelled on the existing `bridge-e*-full.jsonl`. Steps: brief advances; OSINT collects the four facts; write composes the credential phish (From set to `itdesk_full`+`itdesk_address`, pretext `e8_pretext_reauth_calm` with `sso_migration`, ask `e8_ask_calm`) and sends; the flip plays the becomeVictim variant; defend triages all items on the critical path (Report the five phish/sign items, Trust or Verify the genuine ones); the episode concludes on `episode_e8_after_the_click_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e8_after_the_click/scenario.json.erb` passes with no errors (and the defend-only shell).
- The social validators under `scripts/validate_social/` pass, including the balance lint on any check-form pair E8 touches.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes (the fragment and the shell agree).
- The shared rule-of-thumb test passes (the habit-to-keep string is byte-identical to the built one).
- The bridge suite passes: `tools/playtest/se/run-suite.sh` including `bridge-e8-full.jsonl`.
- `node --test test/js/social-*.test.mjs` and `test/js/validator-social-*.test.mjs` pass.
- Manual: the full episode runs end to end in about 15 minutes; the flip seats the learner as Ayaan and shows the first sign; Report is available and never penalised on every card; the two concept cards and the habit, Monday card, report route and no-blame line all show in the debrief.

## 18. Do not

- Do not add a `build` stage or a landing-page builder: E8 has no built page and no `linkCredible` factor. That is what keeps it the pilot.
- Do not edit the six built role check forms, the generators, `BRAND_SET.md` cast (E8 adds none), or the shared rule-of-thumb string.
- Do not introduce ransom amounts, countdowns or a "pay" button on the locked-files card; E8 stops at "report it and leave it" (core_07 owns the rest).
- Do not run a generator into the repo, `git stash`, or add attribution lines to commits.
- Do not include any real brand, real person or any domain that is not `.example`; no homographs.
- Do not include Hacktivity internal paths, endpoints or credentials.

## 19. Stop and ask if

- ENG-01 is not available and the orchestrator needs the full variant now (the defend-only variant can proceed without it).
- The defend scorer or validator rejects the three new channel-tell ids and no ENG-08 slot exists to register them.
- The check-forms spec (`10_CHECK_FORMS.md`) is not ready to receive E8's new items, or a new topic form is wanted rather than adding to the general forms.

## 20. Open questions

1. **Victim seat name.** This spec uses Ayaan Warsame (built cast) as the attack target and victim seat, to avoid a new name and to avoid phishing Hana Novak in both E5 and E8. Confirm, or pick another Quayholt general-staff colleague.
2. **ENG-01 config shape.** The `awarenessEpisode.flip` block (`{ variant, victimTarget, firstSign }`) is this spec's proposal; the ENG-01 packet owns the final key names. The flip-string key `becomeVictimIntro` is likewise provisional.
3. **New channel tells vs scenario-local.** Whether `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` go in the shared library (ENG-08) or stay scenario-local depends on the validator; `ransomware_note` in particular will recur in E13/E-later, so the shared library is the better home.
4. **Item count.** Seven items as drafted; cut the parcel (row 7) to hit "about six" if the orchestrator prefers.
5. **The colleague-slip card kind.** Drafted as an email from Reuben Ofori; if a person-chat card reads better for a confession, that is a small defender-card variant to confirm against the inbox-triage card kinds.
