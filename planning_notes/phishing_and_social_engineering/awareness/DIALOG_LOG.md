# Awareness dialogue — formal fixer log

Fixer for the awareness episodes' dialogue stage (POLISH_PLAN.md, `npc-dialog-review` track).
Resumed across cycles; one section per cycle. No commits.

## Where each fix lives (so it survives a regenerate)

- Hand-authored full-episode host ink (`scenarios/awareness_e{1..7}_*/ink/*.ink`) and the finance
  check inks (`graham_*`, `farah_*`): edited directly. Not rebuilt by any generator's `main()`.
- Generated check / defend-only host ink: the string lives in `gen_*.py`; edited the generator
  **and** the shipped `.ink` so the two agree.
- Triage copy / episode strings in defend-only and check shells: the fragment
  `awareness/e{1..7}/defend.json`; edited the fragment **and** the shipped `scenario.json.erb`
  (full episodes are not regenerated, so their copied strings were mirrored by hand).
- After every change: generators re-run into a scratch dir and diffed against the repo — all 88
  generated files (31 `scenario.json.erb` + 31 `mission.json` + 26 generated `.ink`) byte-identical.
  Generators were never run into the repo.

---

## Cycle 1 (2026-10-22)

Acted on both C1 reviews: `DIALOG_REVIEW_C1_A.md` (E1–E4 + finance/HR/helpdesk/executive) and
`DIALOG_REVIEW_C1_B.md` (E5–E7 + general/mobile).

### Severity table — Part A (E1–E4 + named checks)

| ID | Severity | Finding | Outcome |
|---|---|---|---|
| MAJOR-1 | Major | E3 pretext call: contact's lines carry a `Leila Nassar:` self-prefix (14 lines); L51 choice 22 words | **Fixed.** Checked `phone-chat-speaker.js` `stripContactPrefix` first: the speaker label/voice come from the contact, the "Name:" prefix only renders literally if the id fails to resolve, and `phone-call-voice.js` already strips it for TTS. Dropped all 14 prefixes (matches shipped `dev_service_desk.ink`), clearing `phone-self-prefix`. Trimmed L51 to 15 words (dialoguelint `choice-len` cap is 15, not the reviewer's 17). Voiced text unchanged (prefix was never voiced). |
| MAJOR-2 | Major | 8 host hub/welcome lines over the 30-word chat-bubble cap | **Fixed.** Hand-authored lines split into two bubbles (adaeze, fatima, darren, thandiwe done; graham_post) or trimmed (thandiwe welcome, "as the red team" dropped). Generated lines rewritten in the generator string (anjali_pre, sofia_pre, julian_pre). All now ≤30 words. |
| MINOR-1 | Minor | E4 "boarding payment" tell relies on OSINT the defend-only learner never did | **Fixed.** Rewrote `e4` `senderTrust` to stand alone (free webmail inbox vs the firm domain, ring her). Fragment + full erb. |
| MINOR-2 | Minor | `defendOnly` word-for-word identical E1↔E2; every `noBlameLine` opens the same | **Fixed.** Rewrote E2 `defendOnly` with recruitment texture; varied the `noBlameLine` opener for E2/E3/E4 so a stacked learner doesn't hear the same first line three times. E1 kept as the canonical. |
| MINOR-3 | Minor | E2/E4 lookalike-domain notes overstate ("makes it someone else's") | **Fixed.** Aligned all E2 and E4 lookalike notes to E3's accurate "makes a separate domain anyone can register, so don't assume it's theirs". Extended beyond the cited lines to the two further E2 HR-form notes (`kettlewick-talent`, `tarrowby-onboarding`) so each form stays internally consistent and the A/B pair stays parallel. E5/E6 "someone else's site" left unchanged (Part B endorses them). |
| MINOR-4 | Minor | E1 flip lands on Adaeze (finance manager) but the defend seat is the payments inbox | **Fixed.** Reframed `flipIntro`/`flipDefenderLine` onto "the payments team at Brightwell" to match the seat. Fragment + full erb. |
| MINOR-5 | Minor | E3/E4 `defendIntro` restates the controls the triage brief already owns | **Fixed.** Confirmed in `episode-runner-minigame.js` + `inbox-triage-minigame.js` that both the launch-panel `defendIntro` and the triage tool's own Brief step show the controls. Trimmed `defendIntro` to a scene-setter ("…take them one at a time"); the triage brief keeps the controls. Fragment + full erb (E3 erb kept its richer scene-set). |
| MINOR-6 | Minor | E4 `noBlameLine` negative parallelism ("A miss is about the pressure, not the person") | **Fixed.** Ended "A miss here is about the pressure you were under." E3's earned "not X, Y" lines (impatience/callback) left as the reviewer advised. |

### Severity table — Part B (E5–E7 + general/mobile checks)

| ID | Severity | Finding | Outcome |
|---|---|---|---|
| M1 | Major | E5 host "done" line 44 words, duplicates the Monday card | **Fixed.** Trimmed to the reviewer's 26-word sign-off. |
| M2 | Major | E6 host "done" line 46 words, duplicates the Monday card | **Fixed.** Trimmed to the reviewer's 28-word one-move hook. |
| m1 | Minor | E5 welcome line 31 words | **Fixed.** Dropped "as the red team" (redundant with the brief). |
| m2 | Minor | E5 middle line 33 words; "the staff member" cold | **Fixed.** Names Hana; 23 words. |
| m3 | Minor | E6 middle line 34 words; "the depot" impersonal | **Fixed.** Names Kaylee; 26 words. |
| m4 | Minor | E6 welcome line 35 words | **Fixed.** Trimmed to 27 words. |
| m5 | Minor | E7 welcome line 31 words | **Fixed.** Trimmed to 23 words. |
| m6 | Minor | pre_general_ab (Owen) host intro 31 words | **Fixed.** Generator string trimmed to 25 words (`gen_e3_e5_shells.py`). |
| m7 | Minor | pre_mobile_ab (Lerato) host intro 31 words | **Fixed.** Generator string trimmed to 26 words (`gen_e6_e7_shells.py`). |
| m8 | Minor | Stale note: "Bogdan Ionescu … fooled in the flip line" | **Fixed.** Repointed the E6 `_brandAdditions.cast` note to Kaylee Dunford (the actual flip target); dropped Bogdan's invented demographics rather than fabricate Kaylee's. Non-learner-facing note. |
| m9 | Minor | `phish_sso_staff_landed` set but never read (E5) | **Deferred — by design.** Scoring is defence-only (doc 11 §4.1); the flip keys on `_attempts`, not landing. No dialogue change. Flagged for the `scenario-design-review` stage to suppress the SOCIAL warning or drop the setter. |

### Spoken lines changed (for TTS; audio is SKIPPED this pass per POLISH_PLAN)

Only training-room host ink lines are voiced. Triage copy, debrief panels (`noBlameLine`,
`defendOnly`, `flipIntro`, `flipDefenderLine`, `defendIntro`), `lookalike_domain`/`senderTrust`
perFlagNotes and the E6 cast note are on-screen panel text, not voiced — no TTS impact.

Leila's 14 pretext lines: the **voiced** text is unchanged (the `Leila Nassar:` prefix was never
voiced — `phone-call-voice.js` strips a leading `Name:` before TTS). Not re-listed below.

Host hub/welcome lines (old → new):

- **E1 Adaeze, done** (one bubble → two):
  - old: "You've worked it from both ends now. Whoever's asking you to move money or switch bank details, ring them back on a number you already keep before you touch it. That one habit is what I'd want from my team."
  - new: "You've worked it from both ends now." / "Whoever asks you to move money or change bank details, ring them back on a number you already hold first. That habit is what I'd want from my team."
- **E2 Fatima, done** (one bubble → two):
  - old: "Inbox and all, that's the pair of them done. A real CV opens straight in the viewer, so once something wants more than that from you, it has earned a second look."
  - new: "Inbox and all, that's the pair of them done." / "A real CV opens straight in the viewer, so anything that wants more than that from you has earned a second look."
- **E3 Darren, done** (one bubble → two):
  - old: "That's the desk covered from both seats, thanks. Online you can find a name, a team and a staff number, so none of them prove a caller is who they say. The callback on the number already on file is the check that does."
  - new: "That's the desk covered from both seats, thanks." / "Online you can find a name, a team, a staff number. None of those prove who's calling. The callback, on the number already on file, is the check that does."
- **E4 Thandiwe, done** (one bubble → two):
  - old: "Both seats done, thanks. When it is money and it is all a rush, or you are asked to keep it from finance, ring her on a number you already have before you move, even when the voice is hers."
  - new: "Both seats done, thanks." / "When it's money and it's in a hurry, or you're told to keep it from finance, ring her on a number you already have, even when the voice is hers."
- **E4 Thandiwe, welcome:**
  - old: "Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA as the red team, then swap seats and cover his inbox."
  - new: "Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA, then swap seats and cover his inbox."
- **E5 Niamh, done:**
  - old: "That's both seats done, thanks. The trick is always the address: our real sign-in page sits on its own domain and your password manager knows it, so read the address bar before you ever type a password. A padlock doesn't make a page ours."
  - new: "That's both seats done, thanks. The trick is always the address: read the bar before you type a password. A padlock doesn't make a page ours."
- **E5 Niamh, middle:**
  - old: "Your email with the link has gone to the staff member. Now take the other seat at the kiosk and check the pages that land behind links like yours in a real inbox."
  - new: "Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind links like yours."
- **E5 Niamh, welcome:**
  - old: "Welcome to the Quayholt exercise. Start at the kiosk: research us, build a sign-in page and send its link as the red team, then swap seats and check the pages yourself."
  - new: "Welcome to the Quayholt exercise. Start at the kiosk: research us, build a sign-in page and send the link, then swap seats and check the pages yourself."
- **E6 Chidi, done:**
  - old: "There, you've done it from both ends. On a phone it's the same move each time: if a text, a notice or an email wants a code scanned or a short link tapped, open the app yourself or ring someone on a number you already hold."
  - new: "There, both ends done. On a phone it's one move every time: if a message wants a code scanned or a link tapped, open the app yourself instead."
- **E6 Chidi, middle:**
  - old: "Your message has gone over to the depot. Now take the other seat at the kiosk and go through what's waiting on a Tarrowby work phone, the way it would land on your break."
  - new: "Your message has gone over to Kaylee. Now take the other seat and go through a Tarrowby work phone, the way it would land on your break."
- **E6 Chidi, welcome:**
  - old: "Welcome to the Tarrowby exercise. Start at the kiosk: look at what's public, write one message as the red team, then swap seats and go through a work phone like the one it landed on."
  - new: "Welcome to the Tarrowby exercise. Start at the kiosk: look at what's public, write one message, then swap seats and go through the work phone it lands on."
- **E7 Agnieszka, welcome:**
  - old: "Welcome to the Brightwell finale. Start at the kiosk: research what's public about the chief executive, write one message as the red team, then swap seats and cover the finance line."
  - new: "Welcome to the Brightwell finale. Start at the kiosk: research the chief executive, write one message, then swap seats and cover the finance line."
- **Finance post check, Graham** (`awareness_post_finance_ab`, one bubble → two):
  - old: "Back again. Ten fresh ones waiting on the kiosk, same sort of thing. Do them as you would, and if you sat the first check you'll get the two side by side at the end."
  - new: "Back again. Ten fresh ones on the kiosk, same sort of thing." / "Do them as you would. If you sat the first check, you'll get the two side by side at the end."
- **Helpdesk pre check AB, Anjali** (`gen_e3_e5_shells.py`):
  - old: "I'm Anjali, I look after security here and these reports come to me. Before the training there's a short check on the kiosk: ten items from the service desk queue. Just do what you'd normally do on a shift."
  - new: "I'm Anjali, I look after security here. There's a short check on the kiosk first: ten items from the service desk queue. Do what you'd normally do on a shift." (reviewer's suggested wording counted 32 by dialoguelint; tightened to 30)
- **Helpdesk pre check BA, Sofia** (`gen_e3_e5_shells.py`):
  - old: "Hiya, I'm Sofia from HR, running this one. There's a short check on the kiosk first: ten items from the service desk queue. Just handle them the way you usually would."
  - new: "Hiya, I'm Sofia from HR. There's a short check on the kiosk first: ten items from the service desk queue. Just handle them the way you usually would."
- **General pre check AB, Owen** (`gen_e3_e5_shells.py`):
  - old: "Owen here, Facilities, minding the check for our floor. Short one on the kiosk before the training: ten emails and pages from a Quayholt inbox. Just do what you'd normally do."
  - new: "Owen here, Facilities. Short one on the kiosk before the training: ten emails and pages from a Quayholt inbox. Just do what you'd normally do."
- **Executive pre check BA, Julian** (`gen_e2_e4_shells.py`):
  - old: "Good of you to sit this. Before the training there's a short check on the kiosk: ten emails and voicemails a PA might get. Just deal with them as you would."
  - new: "Good of you to sit this. There's a short check on the kiosk first: ten emails and voicemails a PA might get. Deal with them as you would."
- **Mobile pre check AB, Lerato** (`gen_e6_e7_shells.py`):
  - old: "Morning. Before the training there's a short check on the kiosk: ten texts, notices and emails from a Tarrowby work phone. Treat them the way you would on a normal shift."
  - new: "Morning. Before the training, a short check on the kiosk: ten texts, notices and emails from a Tarrowby work phone. Treat them like a normal shift."

### Checks run

- Ink recompiled for every touched scenario: 0 failed.
- Generators re-run into scratch and diffed: all 88 generated files byte-identical to the repo.
- Validator on all 38 awareness shells (`--strict-social --no-graph --skip-ink`): all exit 0, no
  errors. E7 keeps 4 pre-existing ⚠️ SOCIAL warnings (factorStrings / the m9 design-stage item),
  none from this pass.
- A/B form parallelism: fragment diffs are string-value-only on known fields — no key/id/structure
  change, item order unchanged, HR forms both 10 items.
- Awareness-relevant Node tests pass: `validator-social-awareness` (17), `validator-social-triage`
  (20), `social-awareness-measure` (13), `social-triage-comparison` (8), `social-role-swap` (9),
  `social-episode-model` (13), `social-ink-fallback` (10), `validator-social-schema` (5).
- `npm run test:social`: 109/116 files pass. The 7 failures (`social-gap-landing-page-*`,
  `social-gap-mail-*`, `*pretext-judge`, `social-gap-triage-messages-and-mail-data`) are engine-logic
  assertions against JS files another agent is mid-edit on in the shared tree (`pretext-judge.js`,
  `mail-composer.js` etc. show `M`; several failing test files are new/untracked). This pass touched
  no JavaScript, so these are not ours.
- 7 full-episode bridges (Node 24 v24.11.1, run one at a time on the live keyless :3001 server,
  no server start/stop): all PASS — e1-full 12/12, e2-full 13/13, e3-full 21/21, e4-full 13/13,
  e5-full 18/18, e6-full 14/14, e7-full 12/12.
- `dialoguelint` across all 38 awareness scenarios: no `line-len`, `choice-len` or
  `phone-self-prefix` findings.

## Cycle 4 data jobs (2026-10-22) — E4 address contradiction (job 3) and job-4 items

### Job 3 — E4 "published travel address" contradiction (playtest M2, P1_E1_E2_E4.md)

The OSINT/Events page presents `catherine.merrin@inboxly.example` as Catherine's real published travel
address, but the flip's `senderTrust` redFlag called it "a personal inbox anyone can open in her name,"
so the learner who sent from her real published address was told it was the tell. **Fixed** by reframing
the flip redFlag (hand-authored full erb `awareness_e4_exec_whaling/scenario.json.erb`, `factorStrings.senderTrust.redFlag`):
- old: "The From line carries Catherine's name on catherine.merrin@inboxly.example, a personal inbox anyone can open in her name, not her Merrin & Sallow address."
- new: "The From line is catherine.merrin@inboxly.example, the free webmail travel address from her bio, not her Merrin & Sallow address. A senior name on free webmail is no proof it's really her."

Now consistent with the attack: her published travel address is free webmail (the realistic weakness), and
the taught tell is "a senior name on free webmail is no proof — verify on a number you hold." The string
lives only in the full erb (not generated, not in the fragment). Not a voiced line.

### Job 4

- **E5-5** — moved `pretextRelevant` from `sso_staff`'s `advisoryFactors` into `requiredFactors` (fragment `e5/attack.json` and shell `awareness_e5_signin_pages/scenario.json.erb`; the full E5 episode is not built by any generator, so there is no generator string to change). A weak pretext no longer lands under an advisory that says it shouldn't. e5-full bridge checked (it gathers `sso_migration` and sends the reauth pretext — see bridge results).
- **E3-2** — empty research slots / raw value ids:
  - Added a `labels` map (`gordon_full`→"Gordon McLeish", `claims`→"Claims", `okonkwo_full`→"Ngozi Okonkwo", `gordon_staffid`→"QH-20719") to the `quayholt_helpdesk_reset` pretext NPC in both `e3/attack.json` and the full erb, so the judge's `{actual}`/`{said}` render display labels, not raw ids ("The list has gordon_full" → "…Gordon McLeish"). Engine reads `spec.labels` (pretext-judge.js:146).
  - Guarded the three blank-using choices in `leila_servicedesk.ink` with `{ pretext_*_name != "" }` conditions, so an empty `pretext_*` is never spoken.
  - That also stops Leila's "that reference matches our record" on a blank ref: the `give_staffid` choice can no longer be picked with an empty reference.
- **D7** — reworded `strings.defendOnly` in all 7 fragments (`e{1..7}/defend.json`, drives the 7 `_defend` shells) and mirrored into the 7 full erbs. Dropped "You went straight to the … this time" (implied a skipped attack) and "Each card shows … why the real ones were fine" (the debrief now lists only missed items). New form, e.g. E1: "These messages were written by people whose job is to make them look right, and anyone can be caught by one. Any you were caught out by are shown below, with what gave each one away." Each role keeps its own texture; warm, non-blaming.
- **E5-3 part 2** — the attack email's `linkText` was the real `quayholt.example/sso` next to a look-alike flag. Changed it to the look-alike `quayholt-sso.example` (fragment `e5/attack.json` + shell), so the displayed link text and the look-alike flag agree and the lesson (read the link's domain) is clear.

### Spoken (voiced) lines changed in jobs 2–4 (for TTS)

Only training-room host ink is voiced; triage copy, debrief panels, flip redFlags and pretext-call
feedback are on-screen text, not voiced. The one voiced change:
- **E3 defend-only host (Darren)**, generated from `gen_e3_e5_shells.py` `LINES[('e3','defend')]`:
  - old: "You're in Leila's seat this morning. Four calls are queued on the kiosk, and there's a sign-in prompt from overnight on her phone. Take your time with each one."
  - new: "You're in Leila's seat this morning. Three calls are queued on the kiosk, and there's a sign-in prompt from overnight on her phone. Take your time with each one."

Leila's pretext lines are unchanged in voiced text (the gated choices are the player's lines, not voiced;
the prefix was already handled in cycle 1).

### Verification (jobs 3–4)

- Regen all 31 generated shells to scratch, diffed against repo: **88/88 byte-identical** (the 7 `_defend` shells picked up the D7 rewording).
- Ink recompiled (`leila_servicedesk`, E3 defend-only `darren_price`): 0 failed.
- All 116 `social-*` / `validator-*` Node test files pass (the cycle-1 failures were the other agent's engine WIP, now committed in ac8ec1b56).
- Validator on all 38 shells (`--strict-social --no-graph --skip-ink`): 36 exit 0; the only two failures are E3 full + defend on the "5 to 8" count rule from Cut D (see DESIGN_LOG — flagged for the coordinator).
- 7 full-episode bridges (Node 24, sequential): see report.

### Bridge results (jobs 1–4, Node 24, run one at a time on the live keyless :3001)

All 7 full-episode bridges PASS: e1-full 12/12, e2-full 13/13, e3-full 21/21, e4-full 13/13,
e5-full 18/18, e6-full 14/14, e7-full 12/12.

**Bridge fixtures updated (test-only, under `tools/playtest/se/`):**
- `bridge-e3-full.jsonl`: triage-count assertion `total===5` → `total===4` (Cut D dropped one call).
- `bridge-e1/e2/e4/e6/e7-full.jsonl`: the final debrief assertion hard-coded `cards.length === <full item count>`. The committed engine change (ac8ec1b56) makes the debrief render **only missed items**, so a fixed full count can no longer hold and the count is now play-dependent (the Monday card and no-blame line still render, per the Cut A spec). Removed the `cards.length` conjunct from these five assertions, keeping the stable completion checks (stage `debrief`, `done` includes `defend`, `..._defend_done`, Monday card, no-blame, a saved record). e3-full and e5-full carried no card-count assertion and were unaffected. These five failures were the engine debrief change meeting stale fixtures, not the data edits — flagged for the coordinator.

---

## Cycle 2 (2026-10-23) — formal `npc-dialog-review` cycle 2

Acted on `DIALOG_REVIEW_C2.md` (4 minors C2-1…C2-4 + the housekeeping notes) and the still-open
**data-side** items in the P2 playtests (`playtests/P2_E1_E4.md`, `playtests/P2_E5_E7_checks.md`).
An engine fixer is working the JS (`public/break_escape/js`) in parallel; this pass touched **no
JavaScript**. Items that turned out to be engine-side are listed below as "engine — skipped".
No commits.

### Severity table — outcome for every finding

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| C2-1 | minor | `noBlameLine` opens with the identical sentence in E1/E5/E6/E7 | **Fixed.** Varied the opener in E5/E6/E7 (E1 kept as canonical). New openers avoid any "marked down / keeping score" phrasing, so they also sidestep the F5 clash with the on-screen percentage. Fragment `e{5,6,7}/defend.json` + full erbs. |
| C2-2 | minor | `defendOnly` word-for-word identical E1≡E6 (E5 one word off) | **Fixed.** E6 reworded with mobile texture ("These landed on a phone between jobs…"); E5 opener made distinct ("These pages were built to pass for the real sign-in…"). E1 canonical. Fragment `e{5,6}/defend.json` + full erbs. |
| C2-3 | minor | E6 canteen-QR note calls a subdomain "the name of the page" | **Fixed.** Reframed: "forms.tarrowby.example ends in tarrowby.example, Tarrowby's own domain. The 'forms.' in front is one of Tarrowby's own services, the same as 'mail.' or 'hr.' would be." Matches E5's correct `sso.` teaching. Fragment `e6/defend.json:124` + full erb. |
| C2-4 | minor | E7 full brief says "finance office" where the flip names Tom | **Fixed.** Brief now "you're Tom Reilly in accounts payable, covering the finance office's phone and inbox…", matching the flip and conclusion. Fragment `e7/defend.json` `strings.brief` + full erb :308. The defend-only brief stays generic (no attack to establish Tom). |
| design 11 §3.2 | doc | E3 row says "4 calls (2 impostor, 2 genuine)" after Cut D trimmed it | **Fixed.** Row now "3 calls (2 impostor, 1 genuine) plus 1 MFA push item", with a note that the single genuine caller keeps "refuse everything" from winning (taught action `verify_callback` serves the genuine caller too). |
| HK (graphs) | trivial | Stale E3 defend-only `dungeon_graph.{html,md}` ("Four calls are waiting") | **Left to a full validator run.** Validated here with `--no-graph`, so the graphs were not rewritten; they are untracked and non-learner-facing. A `validate_scenario.rb` run without `--no-graph` overwrites them. Not a dialogue change. |
| N7 | minor (parity) | Check forms: slot 3 is a phish in both the pre and post form of a pair | **Fixed.** The earlier B1 reorder left one shared phish slot per role (slot 3 in the helpdesk pair). Re-permuted all six roles so the phish land in **disjoint** ordinal slots across forms A and B: no slot is a phish in both forms. Executive (5 phish) partitions the 10 slots. `PERMUTE` dicts in all four `gen_*.py`; a pure reorder, so no counts, no flag multiset change. Verified on the regenerated output (all 12 pre/post pairs disjoint; same message multiset, reordered). |
| F2 | minor | E6 Kaylee's reply quotes "clamped on Monday" after the calm pretext | **Fixed.** The single `replies.landed` reply now reads "Cheers Dev, scanning it now so I'm on the list." — it fits both asks ("tick you off the list" / "keep the list up to date") and no longer imports the clamp pressure the calm message dropped. `e6/attack.json` + full erb. |
| F4 | minor | E7 CEO email marks "Someone senior is invoked…" as "Not a flag here" while the voicemail credits it | **Fixed (data; scoring change — flag for user).** Added `borrowed_authority` to `e7_ceo_wire`'s scored `flags` with a perFlagNote ("The chief executive's name is doing the job the approval process should do…"). The tick now scores on both channels. `borrowed_authority` is already in the set's `channelTells`. This makes the reused E1 email (`_reusedFrom e1_ceo_wire`) differ from E7's copy in one flag (different id already, so measurement stays separate); E1's own copy was left alone (out of scope). |
| F5 | minor | E7 voice panel: "Nobody is marked down for a miss here" beside "Score 92 percent" | **Fixed.** Dropped the "Nobody is marked down…" sentence from the E7 `noBlameLine`; it now opens "A familiar voice is hard to doubt…". Removes the clash with the visible percentage and also delivers C2-1 for E7. (E1/E5/E6 debriefs show a score too, but the review kept E1 canonical and E5/E6's new openers avoid the "marked" wording.) |
| E5-6 | minor | Builder meter says "You haven't found out what Hana would expect to see yet" with all four facts noted | **Fixed (data).** The builder's `pretext.facts` listed the *provide-values* (`sso_portal_name`, `sso_migration`) instead of the *fact keys* (`quayholt_sso_portal`, `quayholt_sso_migration`), so `_held()` (checks `se_intel_<factKey>`) never matched. Corrected in `e5/attack.json` + full erb. The engine string itself is in `landing-page-builder-minigame.js:474`; only the data id was wrong. |
| m4 | minor | E4 calm-route flip contradicts its wording (urgent subject + "ten minutes before the flight" over a calm body) | **Fixed (data).** `flipDefenderLine` made tone-neutral ("Tomás read it between setting up two meetings… It fitted Catherine's week…"), so it reads correctly after either pretext (one string is shown for all choices). Subject `s_payment` "Payment - needs doing today" → "Contractor invoice to settle", which fits both the urgent and the calm body. `e4/{attack,defend}.json` + full erb. |
| m3 | minor | E2 flip has nothing to show for a careful (non-landing) application | **No data change (residual is engine).** The `flipMissed`/`flipNoSend` wording already handles the case warmly. The only deeper fix — replaying the player's own send-time factor ticks in the flip when the careful email did not land — is engine flow, not data. Noted for the engine fixer. |
| N2 | trivial | E4 offers only one sender address (the freemail travel address) | **No change (decision, logged).** A real firm-domain option would imply the attacker can send from `merrinsallow.example` (which DMARC/the scenario contradict); a look-alike option would duplicate E2's lesson. The freemail-vs-firm contrast is taught on the defend side and in the compose meter, not by making the learner pick a spoof source they could not really use. |
| N4 | minor | E3 pretext call card lists lines with unusable `____` blanks beside disabled buttons | **Engine — skipped.** The call-card renderer decides whether to show a line whose blank is unfilled (the ink choices were already guarded in cycle-4 E3-2). Noted for the engine fixer. |
| E5-7 | minor | Result ends "next messages you get at work… ask your IT or security team" on a *pages* set | **Engine — skipped.** Hardcoded in `inbox-triage-minigame.js:768` (`weakest`). Needs a channel-aware/overridable string. Noted. |
| E5-8 | minor | Flip email stamped with the real clock ("23:37") next to scenario times | **Engine — skipped.** Timestamp render; same family as m7 (E1/E4), F10 and N9. Noted. |
| E5-10 | minor | "Your password manager filled this in / did not" shows on every page | **Engine + design — skipped.** Rendered in `triage-kinds.js` from `page.autofill`; varying it per page is a difficulty/discrimination tweak (parity audit m8), deferred to the scenario-design/parity stage, not a dialogue edit. Noted. |
| E5-12 | trivial | Three "What is this?" buttons in the builder | **Engine — skipped.** `landing-page-builder-minigame.js:592`. Noted. |

**Counts:** blockers 0, majors 0, minors fixed 8 (C2-1…C2-4, N7, F2, F4, F5, E5-6, m4 — ten items), plus 1 design-doc fix; 1 minor withdrawn as data (m3); 1 trivial decision (N2); 6 engine-side skipped (N4, E5-7, E5-8, E5-10, E5-12, and the real-clock family).

### Changed spoken (voiced) lines

**None.** Every string touched this cycle is on-screen panel text, not voiced: `noBlameLine`,
`defendOnly`, `strings.brief`, the E6 canteen-QR `whyFine`, the E6 `replies.landed`, the E7
`e7_ceo_wire` flags/perFlagNote, the E4 `flipDefenderLine` and compose subject, and the E5 builder
`pretext.facts` ids. Training-room host ink (the only voiced lines) was not changed. No TTS impact.

### Where each fix lives (survives a regenerate)

- **Generators:** `PERMUTE` dicts + comments in `gen_e1_shells.py`, `gen_e2_e4_shells.py`,
  `gen_e3_e5_shells.py`, `gen_e6_e7_shells.py` (N7).
- **Fragments:** `e4/attack.json` (subject), `e4/defend.json` (flipDefenderLine),
  `e5/attack.json` (pretext.facts), `e5/defend.json` (noBlameLine, defendOnly),
  `e6/attack.json` (reply), `e6/defend.json` (noBlameLine, defendOnly, canteen-QR note),
  `e7/defend.json` (noBlameLine, brief, `e7_ceo_wire` flags+note).
- **Full erbs (hand-mirrored):** `awareness_e4_exec_whaling`, `awareness_e5_signin_pages`,
  `awareness_e6_texts_and_qr`, `awareness_e7_voice_ceo`.
- **Generated shells rebuilt into scratch, diffed, then copied in (never ran a generator into the
  repo):** 3 defend-only (`e5/e6/e7_*_defend`) + all 24 check shells (the permutation).

### Checks run

- **Regenerate byte-identical:** after copying the 27 regenerated shells in, a fresh regen of all
  four generators into a second scratch dir diffs **byte-identical** against the repo (0 diffs).
- **Validator, all 38 awareness shells** (`--strict-social --no-graph --skip-ink`): **38/38 exit 0.**
  Warnings are pre-existing only (the `phish_*_landed` "declared but not read" family and E7's
  `urgencyCalibrated` `redFlag:null`); the `borrowed_authority` addition raised no flag/channelTell
  warning.
- **Ink recompiled** for all seven full episodes: `Failed: 0`. No `.ink` was edited, so the compiled
  `.json` are unchanged (git shows no ink-json diff).
- **A/B check-form parallelism:** confirmed on the regenerated output — for every role and both the
  AB and BA pairs, the pre and post phish slots are **disjoint** (no slot a phish in both), and each
  reordered form is the same message multiset as before (counts and flag multiset unchanged).
- **Awareness Node tests:** the 8 data-facing suites pass (`validator-social-awareness`,
  `validator-social-triage`, `social-awareness-measure`, `social-triage-comparison`,
  `social-role-swap`, `social-episode-model`, `social-ink-fallback`, `validator-social-schema`).
  `npm run test:social`: **118/120 files pass.** The 2 failures (`social-triage-kinds.test.mjs`,
  `social-triage-ui.test.mjs`) are engine-wording/ordering assertions against
  `inbox-triage-minigame.js` and `triage-flags.js` — both show `M` in git status (the engine fixer's
  WIP: the verdict line is becoming "…Locked in." and the chip order is changing). They use inline
  fixtures, not the awareness shells; not from this pass.
- **7 full-episode bridges** (Node 24 v24.11.1, run **one at a time** on the live keyless :3001; no
  server start/stop; idempotent `start-keyless-server.sh` was not needed as :3001 was up): **all
  PASS** — e1-full 12/12, e2-full 13/13, e3-full 21/21, e4-full 13/13, e5-full 18/18, e6-full 14/14,
  e7-full 12/12 (games 3759–3765). No Finish-button race seen; no retry needed.

## Data fixer round 3 (2026-10-23) — engine round 2 (ef267b2f1) data hand-off

Ten data items handed over by the engine round-2 engineer. Each fragment edit was mirrored by hand
in the matching full erb; the generated defend-only + check shells were rebuilt into scratch, diffed
(only the intended changes appeared), then copied in. No host ink touched, so no TTS impact and the
compiled ink `.json` are unchanged.

### Items

1. **E6 `e6_mfa_scan` double-authored tell (N5).** Dropped `senderTrust` from `truth.flags` and its
   `perFlagNote`, kept `lookalike_domain` (the tarrowbey.example tell). `e6/defend.json` msg
   `e6_mfa_scan`; mirrored in `awareness_e6_texts_and_qr` and regenerated into
   `awareness_e6_texts_and_qr_defend`. **Not changed (flagged for decision):** the two check-form
   rows `ma_drivers_numbers_spoof` / `mb_new_starters_spoof` author the same `senderTrust` +
   `lookalike_domain` pair for one look-alike-domain tell; left out of scope (item named only the
   tarrowbey.example message, and these sit in the documented A/B form parity multiset).
2. **E1 "pushing me to hurry" (m1).** Added `urgencyCalibrated` (+perFlagNote) to `e1_lookalike_bank`
   ("before today's payment run"). `e1/defend.json` + `awareness_e1_invoice_fraud` →
   `awareness_e1_invoice_fraud_defend`. The two form bank-change rows carry the same "pay today"
   urgency without the flag; left as the item named one message and the forms are parity-balanced.
3. **E2 Liam Baxter (m2).** Added `linkCredible` (+perFlagNote) to `e2_portfolio_lookalike` so ticking
   either `lookalike_domain` or `linkCredible` for the dodgy careers link is credited, not a false
   claim. `e2/defend.json` + `awareness_e2_cv_lures` → `awareness_e2_cv_lures_defend`. (Awareness
   scoring is caught/authored with no false-claim penalty, so full flag credit now wants both link
   framings ticked; the un-ticked one shows as a debrief learning point.)
4. **E3 call transcripts (E3-7 / N8).** Removed every player-side ("You") line from all E3 call
   transcripts, leaving the caller lines verbatim (caller-only records the learner judges). Six
   calls: `defend.calls` (gordon_impostor, gordon_real, on_behalf) + check forms helpdesk_form_a/b
   (facilities, hr_awkward, printer, payroll, comms_awkward, monitor). `e3/defend.json` +
   `awareness_e3_helpdesk_reset` → defend-only + the 4 helpdesk check shells. **Flagged:** removing
   the ring-back offer leaves four caller replies slightly dangling (gordon_impostor "That's my desk
   phone, am I?"; the genuine awkward calls hr_awkward/comms_awkward/facilities caller acceptances);
   caller lines were kept verbatim per the brief's "(the caller's lines stay)".
5. **E3 debrief recap (E3-9).** Added `strings.conceptPanel` ("Why the call and the prompts worked")
   recapping the findable-facts/callback point and the MFA push-fatigue beat. `e3/defend.json` +
   erb; also appears in `awareness_e3_helpdesk_reset_defend` (the generator keeps conceptPanel), so
   both variants show it.
6. **E3 `flipMissed` after a refused/failed call (E3-1).** Reworded to read naturally when the
   vishing call did not land (distinct from flipNoSend). `e3/defend.json` + erb.
7. **E5 + every mail-send `flipMissed` (did-not-land → missed flip).** Reworded E1, E5, E6, E7 (and
   E3 in item 6) so none claims "here is the same kind of X" (the missed-flip view shows no message/
   page). E2 and E4 already read correctly ("…next, you're the one opening/reading it") and were
   left. E1/E5 edited in fragment+erb; E6/E7 edited in the erb only (their fragments never carried
   `flipMissed`, matching the e2/e4 precedent; the generator pops it for defend-only anyway).
8. **E3 ask meter (E3-3).** `asks.reset_password.floor` -20 → 0 so the meter reads "needs 0 or
   better, now at N" instead of a confusing negative bar; reworded `tells.ask.accepted` to "She reset
   it on the manager's name and the staff reference, both of which are on the public site." (names the
   two security answers, so it no longer clashes with the three/four passed checks shown).
   `e3/attack.json` + erb. The scripted bridge still reaches ASK OK with positive influence.
9. **E3 MFA demo trimmed 4→3 pushes (E3-11, done).** Dropped the 06:38 push; kept 06:31/06:44/06:50,
   approvesAt 06:50. Tightens the autoplay by one step for E3's length. `e3/attack.json` pushStream +
   erb `mfa`. (3 pushes is clean; only a 1-push stream warns.)
10. **mailClient.clock (declined).** Every mail-send episode has one seeded message at a sensible
    morning time (08:41–09:05); the engine's new latest-seeded-time fallback already stamps sends in
    scene time, so no explicit `social.mailClient.clock` was needed anywhere.

### Checks run

- **No-change baseline:** a fresh regen of all four generators into scratch is byte-identical to the
  repo for scenario.json.erb / mission.json / .ink (only build artifacts differ).
- **Regenerate → diff → copy:** 8 generated shells updated (e1/e2/e3/e6 defend-only + 4 helpdesk
  checks); e5 defend-only unchanged (its only edit, flipMissed, is popped for defend-only). Each
  diff showed only the intended change.
- **Validator** (`--strict-social --no-graph --skip-ink`): **all 38 awareness shells exit 0.**
  Warnings pre-existing only.
- **Node tests:** `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1701/1701 pass.**
- **Full-episode bridges** (Node 24, one at a time on the live keyless :3001; no server start/stop):
  **all PASS** — e1 12/12, e2 13/13, e3 21/21, e5 18/18, e6 14/14, e7 12/12 (games 3815–3825).
  e1/e2/e6/e7 each needed one retry for the known flip send-timing race (first run failed only the
  "sent record tells" flip assertion, an attack-side compose race unrelated to these defend-side
  edits); e3/e5 passed first try. e4 untouched, not run.

---

## Cycle: "either tick counts" scoring + E3 caller-reply standalone pass (2026-10-23)

Two changes: an engine mechanism so one tell named by two triage flags is scored once (Task A), and
rewording the E3 call transcripts whose caller replies were left answering a removed player line
(Task B).

### Task A — `truth.flagAlternatives` ("either tick counts")

**Mechanism (engine).** Some messages carry one tell that two flags can name — a look-alike link is
`lookalike_domain` or `linkCredible`; a look-alike From address is `lookalike_domain` or `senderTrust`.
Before this change each authored flag was scored on its own, so ticking one showed the other as
"missed" in the debrief. A message's `truth.flagAlternatives` (array of groups, e.g.
`[["lookalike_domain","linkCredible"]]`) now groups those flags into one scoring **unit**: credited
if any member is ticked, reported missed **once** under the group's first member's note, never
over-counted when both are ticked. A flag in no group is its own unit, so a message without the
field scores exactly as before.

- `public/break_escape/js/minigames/inbox-triage/triage-scoring.js`: new `flagUnits()` helper;
  `scoreTriage()` now scores by units (verdict points unchanged; reasons = 40 × caughtUnits/units;
  `perMessage.missed`, `perFactor`, `flagRecall` all unit-based). The display `caught` array still
  lists every authored flag the player ticked (both members shown if both ticked).
- `scripts/scenario-schema.json`: `truth.flagAlternatives` added to the closed `socialTriageMessage`
  truth schema (was `additionalProperties:false`).
- `scripts/validate_social/triage.rb`: validates it — array of groups, each ≥2 distinct ids, every
  member an authored `truth.flags` id, a flag in at most one group, phish-only. (validate_scenario.rb
  untouched.)
- Tests: new `test/js/social-triage-alternatives.test.mjs` (flagUnits + scoreTriage, 10 cases); new
  cases in `test/js/validator-social-triage.test.mjs`.

**Data — messages grouped and why.** Every grouped pair names the look-alike domain as one
observable (sender and/or link); verified against each perFlagNote. Group order sets the missed
note: senderTrust-led for a From-address tell ("read the address, it isn't who it says"),
lookalike_domain-led for a link tell.

- `["lookalike_domain","linkCredible"]` — the look-alike **link**: `e2_portfolio_lookalike` (E2).
- `["senderTrust","lookalike_domain"]` — the look-alike **From address**: `e1_lookalike_bank`,
  `fa_pennine_bank`, `fa_remittance_spoof`, `fb_castell_bank`, `fb_creditors_spoof` (E1);
  `ha_agency_spoof`, `hb_onboarding_spoof` (E2/HR); `ha_list_spoof`, `hb_resets_spoof` (E3/helpdesk
  checks); `e4_wrenfield_lookalike`, `ea_larkspur_bank`, `ea_card_spoof`, `eb_ropewalk_bank`,
  `eb_travel_dates_spoof` (E4); `ga_payroll_spoof`, `gb_facilities_spoof` (E5/general);
  `ma_drivers_numbers_spoof`, `mb_new_starters_spoof` (E6/mobile). 19 messages in all.
- **Not grouped:** `unexpected_qr`+`lookalike_domain` QR rows (E6) stay two tells — "it's a QR at all"
  and "the destination domain is a look-alike" are separate observations a learner can catch
  independently. `senderTrust` on freemail rows (no lookalike) and `senderAuth`+`senderTrust` (visible
  address vs header checks) are also distinct tells.

A/B check-form parity holds: each grouped check message is derived from the fragment, so its A/B
mirror gets the same group (finance/HR/helpdesk/executive/general/mobile pairs matched).

### Task B — E3 caller replies read standalone

Round 3 removed the Service Desk operator's lines from the E3 call transcripts. Five caller replies
then answered a line that was gone. Reworded so each is a standalone caller-only record and keeps
its teaching beat (a genuine caller is fine being rung back on a known number; an impostor resists
or redirects). No player lines reintroduced. **Not voiced** (text transcripts), so no TTS impact.

Note: `ha_call_facilities` (Owen) is an **impostor** (isPhish, vish_callback_pressure +
borrowed_authority), not a genuine awkward call as the brief's parenthetical read; its reply
therefore resists the callback. `hb_call_payroll` (Pauline) is the B-form impostor mirror of
facilities and dangled identically after round 3, so it was reworded too, to keep the A/B pair
matched and standalone (logged tidy-up beyond the four the brief named).

- `e3_call_gordon_impostor` (impostor): "That's my desk phone, and I'm not at my desk, am I? I'm
  boarding in ten minutes. Just reset it and read me the new one." → "No sense ringing the desk, I'm
  not there, I'm boarding in ten minutes. Just reset it and read me the new password."
- `ha_call_facilities` (impostor): "I'm on my personal phone, the work one's dead. Look, the
  Operations Director wants that bay open by half eight. Just reset it now and I'll sort the paperwork
  later." → "No point ringing the desk back, the work phone's dead and I'm on my personal mobile. The
  Operations Director wants that bay open by half eight, so just reset it now and I'll sort the
  paperwork later."
- `hb_call_payroll` (impostor, parity): "I'm not at my desk, I'm on my own phone. The Finance Director
  said to ring you and get it done. If the run's late, it's three hundred people not paid." → "No use
  ringing my desk, I'm not there, I'm on my own phone. The Finance Director said to ring you and get
  it done, and if the run's late it's three hundred people not paid."
- `ha_call_hr_awkward` (genuine, Sofia): "Honestly, it's me. Fine, ring the mobile, but please be
  quick." → "Honestly, it's me, but I know how it goes. Ring me back on the mobile you've got for me,
  just be quick about it."
- `hb_call_comms_awkward` (genuine, Niamh): "Right, fine. Ring now, please, I'll keep the phone in my
  hand." → "Fine, do it properly. Ring me straight back on the number you hold for me, I'll keep the
  phone in my hand."

Residual (flagged, not changed): `ha_call_ayaan` ("Yes, that's my desk. Thanks.") and the Darren
monitor call ("Great, thanks.") are genuine innocuous decoy closers that also followed a removed
player line; they read acceptably as a caller confirming/closing and carry no callback beat.

### Where each change lives (survives a regenerate)

- Engine/schema/validator/tests: edited directly (not generated).
- Task A fragments: `awareness/e{1,2,3,4,5,6}/defend.json` (19 flagAlternatives insertions).
- Task B fragment: `awareness/e3/defend.json` (5 caller lines).
- Full episodes (hand-mirrored): `awareness_e1_invoice_fraud`, `awareness_e2_cv_lures`,
  `awareness_e4_exec_whaling` erbs got their one grouped message's flagAlternatives;
  `awareness_e3_helpdesk_reset` erb got the gordon_impostor line (the other four E3 defend calls
  live only in the generated shells, not the full erb).
- Generated shells: regenerated into scratch, diffed, copied in — 27 shells for Task A (e1/e2/e4
  defend + 24 pre/post check forms; e3/e5/e6/e7 defend-only unchanged, their grouped messages are
  check-only) and 5 for Task B (e3 defend + 4 helpdesk checks). Each diff showed only the intended
  change.

### Checks run

- **No-change baseline:** fresh regen of all four generators into scratch is byte-identical to the
  repo before editing (all generated scenario.json.erb / mission.json / .ink).
- **Validator** (`--strict-social --no-graph --skip-ink`): **all 38 awareness shells exit 0**, and
  `scenarios/lab_social_engineering/scenario.json.erb` exits 0.
- **Node tests:** `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1713/1713 pass** (was 1701; +12 new).
- **Full-episode bridges** (Node 24, one at a time on the live keyless :3001; no server start/stop):
  **all PASS** — e1-full 12/12 (3827), e3-full 21/21 (3828), e2-full 13/13 (3829), e4-full 13/13
  (3830), lab bridge-6 36/36 (3832). No retries needed.

## Data fixer round 4 (2026-10-23) — P3 playtest data items (PLAYTEST_P3_E1_E4 / E5_E7)

Data-only pass against the two P3 reports. Engine items (flip-string routing split, result-grid
"handled right" counts, Verify/Report % wording, tick-by-kind filtering, debrief either-tick dedup,
E5 missing-logo render, `Voicemail Voicemail` label, hooded sprite, hearts HUD, N-9/N13/N14
engine-added brief lines) were left for the parallel engine fixer and are listed in the hand-back,
not touched here.

### Items

- **Item 1 — uniform caller/voicemail labels (P3 N3, MAJOR).** Impostor transcripts were labelled
  "Caller" while genuine ones used a first name, leaking the verdict. Adopted the voicemail scheme
  (label by the name the caller gives) everywhere. Fragment `e3/defend.json`: `ha_call_facilities`
  Caller→**Owen**, `hb_call_payroll` Caller→**Pauline** (feeds the helpdesk check forms too).
  Fragment `e7/defend.json`: `e7_vm_ravinder_cloned` Caller→**Ravinder**. Full erbs:
  `awareness_e3_helpdesk_reset` `e3_call_gordon_impostor` Caller→**Gordon**, `e3_call_on_behalf`
  Caller→**Josh**; `awareness_e7_voice_ceo` cloned voicemail Caller→**Ravinder**. E4 (Catherine/
  Yasmin/Oskar) was already uniform, no change. Only the `who` display label changed, never the
  spoken `text`, so no TTS cache key moves.
- **Item 2 — finance phish with a knowledge-only tell (P3 N-1, MAJOR) + audit.**
  `fa_invoice_share` (Merrow) and `fb_bank_portal` (Fernhill) scored only `senderTrust`, whose basis
  ("Brightwell doesn't bank with Fernhill / use Merrow") was never on screen — and the From address
  actually matches the claimed org, so `senderTrust` is the wrong tell. Restored BRAND_SET.md's own
  slot-8 spec `["linkCredible", "pretextRelevant"]`: `linkCredible` is the visible link-text ≠
  destination mismatch both messages already carry, and `pretextRelevant` is now fair because the
  finance check brief states "Brightwell banks with Calderbrook Bank and only pays suppliers it
  already deals with." perFlagNote and the brief rewritten to match. A/B change is identical
  (`fa` slot 7 ↔ `fb` slot 7), so form parity and the balance lint hold. **Audit of every
  check-form and defend-set phish across all six roles:** only these two matched the pattern. Every
  other single-flag phish is catchable on screen — internal sender on free webmail (inboxly/
  quickpost) → visible `senderTrust`; `linkCredible`-only portal phish (ea_speaker_portal,
  eb_travel_portal, ga_solicitor_share, gb_quarantine_notice) → visible link; look-alike/urgency/QR
  tells visible. No further fixes.
- **Item 3 + m3 — E2/E4 "careful" flip after a failed send (P3 N1).** `flipMissed` in the
  `awareness_e2_cv_lures` and `awareness_e4_exec_whaling` erbs said "this careful application/
  message", wrong after a send that did not land. The engine routes **both** did-not-land and
  careful-landed-no-tells to `flipMissed` (one string, two states), and the full-episode `strings`
  schema is closed (`additionalProperties:false`), so a new `flipLandedNoTells` key cannot be added
  as data. Reworded `flipMissed` to a neutral line true of both states ("There's nothing of yours to
  replay from the other side this time. …"), which fixes N1 without regressing m3. The ideal
  two-string split (schema key + routing) is in the engine hand-back.
- **Item 5 — executive check slot parity (P3 N-11).** Exec phish sat on all-odd (A) / all-even (B)
  slots. New permutations in `gen_e2_e4_shells.py`: A phish → slots 1,2,4,7,9; B → 3,5,6,8,10.
  Still disjoint across A/B (and so across pre/post), still 5 phish each, pure reorder (no flag/
  count change), but no longer a guessable parity.
- **Item 6.**
  - E7 "ten to five on a Friday" vs the 09:04 scene stamp → "just after nine on a Friday" in
    `e7/defend.json` and the `awareness_e7_voice_ceo` erb (F10).
  - E3 length (~17 vs 13): modest once-read trim (plan Cut F) — tightened `flipDefenderLine`
    (also drops "and sounded rushed", which was asserted even after a calm call, P3 N11) and
    `flipMissed`, in `e3/defend.json` and the erb. The larger cuts to reach 13 (skip the second
    read for high scorers; drop one defend call) are structural/engine and left for the orchestrator.
  - E4 sender picker offers only the free-webmail address — **no change**: a logged deliberate
    decision (this log, cycle 4 N2); a firm-domain or look-alike option would contradict DMARC or
    duplicate E2.
  - Host over-praise: searched the host lines and DIALOG_LOG — no over-praising line remains
    (E5-14's host line is already matter-of-fact). No change.
  - Stale "Convincing enough" (E5-13) and the "Reported %" stats (N7/t2): engine (stale builder
    verdict refresh; scoring-display wording). Hand-back.
- **Item 7 (cheap data trivials).** N19: the `e1_lookalike_bank` senderTrust note said the address
  "isn't a Brightwell one at all" for the look-alike `brightwel1foods.example`; reworded to name the
  look-alike (fragment + erb). N-18: `e6/attack.json` senderTrust redFlag "the depot notice she acts
  on" (ambiguous after "Dev Acharya") → "…Kaylee acts on" (attack fragment + erb). The remaining
  trivials/minors are engine (listed in the hand-back).

### Voiced lines

None. Only `who` display labels changed on call/voicemail transcripts; the spoken `text` and
`clipId`s are untouched, so no TTS cache key moves. The trimmed/reworded strings (flip narration,
briefs, perFlagNote) are on-screen text, not NPC/host voice lines.

### Where each change lives (survives a regenerate)

- Fragments: `e1/defend.json`, `e3/defend.json`, `e6/attack.json`, `e7/defend.json`; generator
  `gen_e2_e4_shells.py` (exec PERMUTE).
- Full episodes (hand-mirrored, edited directly): `awareness_e1_invoice_fraud`,
  `awareness_e2_cv_lures`, `awareness_e3_helpdesk_reset`, `awareness_e4_exec_whaling`,
  `awareness_e6_texts_and_qr`, `awareness_e7_voice_ceo` erbs.
- Generated shells: regenerated into scratch, diffed, copied in — 14 shells changed
  (e1/e7 defend-only; finance, helpdesk, executive pre/post AB/BA). No-change baseline was
  byte-identical before editing; each copied diff showed only the intended change.

### Checks run

- Validator (`--strict-social --no-graph --skip-ink`): **all 38 awareness shells exit 0**.
- Node tests: `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1730/1730 pass**.
- Full-episode bridges (Node 24, one at a time, live keyless :3001, no server start/stop): **all
  six affected episodes PASS** — e1-full 13/13 (3914), e2-full 14/14 (3915), e3-full 21/21 (3913),
  e4-full 14/14 (3916), e6-full 15/15 (3918), e7-full 13/13 (3919). e5-full unchanged, not re-run.

## Data fixer round 5 (2026-10-23) — engine round 3 (b7881f594) data hand-off

Authoring for the data hooks engine round 3 added. Data only (fragments, generators, full-episode
erbs, awareness ink). No engine/CSS/validator changes.

### Items

- **1. E6 IT email `flagAlternatives`.** `e6_mfa_scan` (From `it-servicedesk@tarrowbey.example`, a
  look-alike of the real Tarrowby IT desk at `tarrowby.example`): added
  `flagAlternatives: [["lookalike_domain","senderTrust"]]`. `senderTrust` is not in `truth.flags`
  (it is a factor, so a valid alternate under the new "member outside truth.flags" rule): ticking
  "I don't trust this sender" now credits the same unit and is never "Not a flag here".
  **Audit of other phish whose From is itself the look-alike of a missing twin:** no others need the
  new treatment. The sender-spoof phish that carry both tells are already grouped
  `[senderTrust, lookalike_domain]` (e1 `e1_lookalike_bank`/`*_bank`/`*_spoof`, e2 `ha/hb_*_spoof`,
  e3 `ha/hb_*_spoof`, e4/e5/e6 `*_spoof`/`*_bank`). The remaining `lookalike_domain`-only phish are
  not From-trust cases: e2 `ha_careers_missing`/`hb_shortlist_missing` (cold applicants on a
  look-alike webmail domain with a credential-harvest link — `senderTrust` does not apply, the
  tell is the link); e2 `e2_portfolio_lookalike` (already grouped with `linkCredible`); the e5/e6
  `page`/`qr` look-alikes (non-email kinds never offer `senderTrust`). Full e6 erb mirrored.
- **2. E7 CEO email `vish_callback_pressure`.** `e7_ceo_wire` ("I'm in meetings all afternoon, so
  reply here rather than calling"): added `vish_callback_pressure` as an **authored flag** (truest
  to the message — it is a distinct manipulation from the time pressure: deflecting the callback
  that would catch it), with its own `perFlagNote`. Trimmed the `urgencyCalibrated` note so the
  callback-steering clause is not double-counted (now reads "…leave no time to check before the
  money would move"). Set is only in E7 (full + defend-only); `vish_callback_pressure` is in the
  set's `channelTells` and is offered on email (not excluded). Full e7 erb mirrored.
- **3. Ask templates mis-tagged `urgency`.** `e1 ask_confirm` ("Can you confirm once the new details
  are saved?") and `e4 ms_ask_confirm` ("Drop me a line here once it's gone through.") → `"low"`:
  neither carries time pressure. Audited every `ask` template across e1–e7: the other `medium`/`high`
  asks genuinely carry a deadline ("before the closing date today", "before the end of the day",
  "today … clamped on Monday", "Release it today") and keep their tag. Fragment + full erb each.
- **4. E7 `factorStrings.urgencyCalibrated.failMissed`.** Added so a miss no longer shows the
  landing-only "the debrief shows why it works": `failMissed` = "The pressure is the point of this
  call: urgency that leaves no time to check is what pushes a target past their doubts." (self-
  contained, no "debrief"). Attack fragment + full e7 erb.
- **5. `flipLandedNoTells` / `flipMissedHeading` (and `flipMissed`) for the mail-send episodes.**
  Added to E1, E2, E4, E5, E6, E7. `flipMissed` now only means did-not-land / failed call, so E2,
  E4, E6, E7 (which had none in the fragment; the full erbs already carried their own) got an
  E1-style "didn't land" `flipMissed`; every send episode got `flipMissedHeading`
  ("Nothing to replay this time") and `flipLandedNoTells` (the "it landed but there's nothing to
  pick apart, so nothing to replay" reassurance). E3 is a call episode (no `landedNoTells` path for
  calls) and keeps its existing `flipMissed`; not touched. Defend fragments (reach defend-only
  shells too, harmless there) + full erbs.
- **6. In-voice `replies.missed` (optional, done for all six send targets).** On a miss the target
  now replies declining/verifying in their own voice (text reply, not TTS — no audio cost), instead
  of silence: Adaeze (E1) won't change payee details off an email, Fatima (E2) opens the CV in the
  viewer only, Tomás (E4) confirms with Catherine/finance first, Hana (E5) didn't type her password
  because the address was wrong, Kaylee (E6) won't scan without checking the depot office, Tom (E7)
  won't release off a message and will ring Ravinder back. phishTargets live only in the full
  episodes; attack fragments mirrored for the record.
- **7. `requires` on fact-bearing lines + E3 ink gating.** E1 `s_invoice` ("Invoice INV-2217")
  subject → `requires: ["brightwell_open_invoice"]` (not offered before the invoice is found).
  E3 pretext lines that present a found fact → `requires`: `open_locked_out`
  (`quayholt_claims_manager`, who+team), `give_manager` (`quayholt_claims_head`), `give_staffid`
  (`quayholt_staff_number`). The E3 ink (`leila_servicedesk.ink`) choices were gated on the same
  facts: declared `VAR se_intel_quayholt_claims_manager/_claims_head/_staff_number = false` and
  added each as a condition on its say-choice (alongside the existing blank-filled condition).
  **Conditions only — no choice wording changed, so no voiced line changed.** Recompiled.
  `name_drop_director` ("The Head of Claims needs me back online…") left ungated: it names a generic
  role, not a discovered detail, and has no `claims` entry — noted as a judgement call.
- **8. "Both checks" lie on a fresh game (no pre).** Post-check host line (triage_post_done branch)
  and post success screen asserted the player took both checks; true only if a pre check was also
  sat. The ink can't tell (no pre-done global reaches the post shell — only `triage_post_done`),
  so the lines were reworded to be true either way (the welcome-back line already handles the "if
  you did the first check" conditionality). 12 post host inks reworded + recompiled; the 4 shell
  generators' post success screen body → "Thanks for taking the time with it. If you also sat the
  earlier check, the results are shown side by side." Finance host inks are hand-written (gen_e1
  writes no ink); the other ten are generated, so their `CHECK_LINES` in gen_e2_e4 / gen_e3_e5 /
  gen_e6_e7 were updated to match (regen ink == repo ink, verified). **Voiced host lines changed —
  see below.**
- **9. "You'll see how you did at the end." (optional).** Left as-is: it sets the expectation that
  feedback comes at the end and isn't clearly redundant after round 3; removing it across ~24
  generated briefs is scope creep without clear benefit.
- **10. E3 duration decision.** The user decided E3 stays at ~17 min (no structural cut),
  2026-10-23. Recorded.
- **11. Channels bridge autofill.** `tools/playtest/se/bridge-p7-channels.jsonl`: the autofill cue
  is now hidden behind a `.tri-autofill-btn` ("Try your password manager"); the check now asserts
  the cue starts hidden, clicks the button, then verifies the revealed text.

### Coordinator E5 items (found testing the new Quayholt logo)

- **(a) Builder Page score line** "a payslip notice is what the email promised" — this is the
  **engine default** `purposePass` (`landing-page-model.js` `DEFAULT_STRINGS`), not E5 data. Not
  edited in the engine; **overridden in E5 data** (`landingPages[sso_login].strings.purposePass`)
  to "✓ Page: a session-expired sign-in is what the email promised." (the page's matching
  `purposeId` is `expired`). Fragment + full e5 erb.
- **(b) Look-alike page submit button reads "Session expired"** — **engine, not cleanly data.**
  `landing-page-render.js:236` draws the submit button face from the purpose **label**
  (`purposeLabel || 'Sign in'`), and that same label is both the builder's choice chip and the
  page `<h3>` heading, so the "Session expired" label can't be renamed to "Sign in" without making
  two builder choices indistinguishable and losing the page heading. No data-only fix; needs an
  engine change (a fixed "Sign in" submit face, or a per-purpose/page button label separate from
  the choice label). **Flagged for the user/engine — left unchanged.**

### Changed voiced lines (TTS) — item 8 post-check host line, one per post shell

Only the `triage_post_done` (after-the-check) host line changed; welcome-back and choice/reply
lines are untouched. These are placeholder-sprite training shells (audio not yet generated), but
listed for the TTS key:

- graham (finance_ab): "Both checks done now. That's grand, thanks for taking the time with them."
  → "That's you done. Grand, thanks for taking the time with it."
- farah (finance_ba): "All saved. Thanks for sticking with both checks." → "All saved. Thanks for
  sticking with it."
- yasmin (executive_ab): "That's the second one in. Thank you for taking both." → "That's it in.
  Thank you for taking the time with it."
- julian (executive_ba): "Both done. We're grateful you sat the pair." → "That's done. We're
  grateful you sat it."
- owen (general_ab): "Second check saved. Thanks for doing the pair." → "Check saved. Thanks for
  doing it."
- pauline (general_ba): "Second check saved. Thank you for doing both." → "Check saved. Thank you
  for doing it."
- anjali (helpdesk_ab): "Second check saved. Thanks for doing both." → "Check saved. Thanks for
  doing it."
- sofia (helpdesk_ba): "That's the second one saved. Thanks for sitting both." → "That's saved.
  Thanks for sitting it."
- jun (hr_ab): "That's the pair of them in. Thanks for sitting both." → "That's it in. Thanks for
  sitting it."
- ibrahim (hr_ba): "That's both logged. Thanks for doing the pair." → "That's logged. Thanks for
  doing it."
- lerato (mobile_ab): "That's both checks logged. Thanks for sitting them; it helps us see what the
  training shifted." → "That's logged. Thanks for sitting it; it helps us see what the training
  shifted."
- jun (mobile_ba): "That's the second check in. Thanks for doing both; it all helps." → "That's it
  in. Thanks for doing it; it all helps."

All other changed strings (flip narration, `failMissed`, `purposePass`, `perFlagNote`, the success
screen, `replies.missed`) are on-screen text, not NPC/host voice lines. The E3 ink change is
conditions only — no spoken line moved.

### Where each change lives (survives a regenerate)

- Fragments (source of record): `e1/attack.json`, `e1/defend.json`, `e2/attack.json`,
  `e2/defend.json`, `e3/attack.json`, `e4/attack.json`, `e4/defend.json`, `e5/attack.json`,
  `e6/attack.json`, `e6/defend.json`, `e7/attack.json`, `e7/defend.json`.
- Generators: `gen_e1_shells.py` (post success screen), `gen_e2_e4_shells.py`,
  `gen_e3_e5_shells.py`, `gen_e6_e7_shells.py` (post success screen + post host `CHECK_LINES`).
- Full episodes (hand-mirrored, edited directly): all seven `awareness_e*` erbs.
- Generated shells: regenerated into scratch (no-change baseline byte-identical first), diffed,
  copied in — 18 changed (six `*_defend` for flip strings; e6/e7 defend also the flag changes;
  twelve `post_*` for the success-screen body). Each copied diff showed only the intended change.
- Ink (hand-maintained in repo, recompiled): `leila_servicedesk.ink` (E3 gating) + 12 `*_post.ink`
  (item 8); the e2/e4/e6/e7/e3/e5 `*_post.ink` are generator-authored and now match `CHECK_LINES`.

### Checks run

- Validator (`--strict-social --no-graph --skip-ink`): **all 38 awareness shells exit with 0
  errors.** Warnings unchanged from HEAD (the E7 `urgencyCalibrated` fail/redFlag advisory and the
  outcome-global advisory are pre-existing, verified against HEAD in a full dir context).
- Ink: `leila_servicedesk.json` and the 12 `*_post.json` recompiled with `bin/inklecate`; valid.
- Node tests: `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1739/1739 pass.**
- Bridges (Node 24, one at a time, live keyless :3001, no server start/stop; other sessions'
  drivers left running):
  - **e3-full PASS** (21/21, game 3977) and **e5-full PASS** (18/18, game 3979).
  - **e1/e2/e4/e6/e7-full**: each has exactly one false eval — the debrief check that reads
    `.aw-monday`/`ep.stage === 'debrief'` — and it runs *before* the bridge's "Finish" click. Engine
    round 3 ("Saving on Finish" / item-by-item list) renders the debrief + monday card only after
    Finish, so the assertion fires one step early. The following "Finish" click then renders it and
    the **final completion eval passes** in every one (episode reaches debrief, `*_defend_done` and
    `phish_*_landed` true, not failed, closed). The episodes work; the bridges' debrief eval is
    mis-ordered for round 3. My data edits touch none of the fields that eval reads (stage, done,
    the done-global, the monday/no-blame strings, se_awareness_records), and e5 — which got the same
    flip-string and `replies.missed` treatment — passes, so this is not a data regression. **Fix for
    the orchestrator: move the `.aw-monday`/debrief eval to after the "Finish" click in
    bridge-e1/e2/e4/e6/e7-full.jsonl** (out of this task's scope, which only updated p7-channels).
  - **p7-channels**: the **autofill check (C4b, the one this task updated) now PASSES** (seq 32 →
    true: it clicks `.tri-autofill-btn`, then reads the revealed cue). Four *other* evals in that
    bridge fail — C2 (row kind tags), C5 (verdict-button swap for call/push), C6 (review-card action
    words / row badges), C7 (result grid 100% + Deny/report counts). These are round-3 engine-feature
    checks in `test_social_p7_channels` (a scenario this task did not edit) and separate evals from
    the one I changed, so they are pre-existing round-3 bridge↔engine gaps, not a regression from the
    autofill edit. Flagged for the orchestrator.

## Data fixer round 6 (2026-10-23): P4 playtest items (E1–E7)

Data-only pass on the two P4 playtest reports (`playtests/PLAYTEST_P4_E1_E4.md`, `PLAYTEST_P4_E5_E7.md`).
Fragments are the source; shared sets mirrored by hand into the full-episode erbs; defend/check shells
regenerated from the fragments (gen_e1/e2_e4/e3_e5/e6_e7) into scratch, byte-identical no-change regen
confirmed first, then only the 7 changed `scenario.json.erb` copied in. No ink, JS, CSS, tests,
validator or bridges edited. **No voiced lines changed** (every edit is triage/composer feedback,
flags, requires, subjects, replies or factorStrings — on-screen text and data, none of it NPC ink/TTS).

Items fixed:
- **E1–E4 P4-1** printer call (Ayaan, helpdesk_form_a): reworded `whyFine.default` so it no longer
  says "Helping is the right call" (contradicted the 70-pt Comply verdict); now notes it is low-risk
  but the quick check is still the habit. `e3/defend.json`.
- **E1–E4 P4-2** urgency ("pushing me to hurry"): credited `urgencyCalibrated` on the sharp-deadline
  phish it was missing on, with a perFlagNote each, keeping A/B flag-multiset parity (each HR form
  gained exactly one, in different slots: ha slot 4, hb slot 2). Added to `ha_passport_scans`,
  `hb_bank_details` (`e2/defend.json`) and `e4_wrenfield_lookalike` (`e4/defend.json` + e4 erb).
  Scoped to the E1–E4 evidence: E1 changed-bank and executive check-form items have only
  weak/forward-dated deadlines and were left (their urgency is genuinely incidental); E5–E7 deadline
  items (general pages, mobile SMS, voicemails) left too — the E5–E7 report did not raise urgency,
  general is already flagged for too many tells, and SMS/voicemails carry their own pressure flags.
- **E1–E4 P4-4** subjects before evidence: `requires:["tarrowby_vacancy"]` on the E2 WHO-114 subject
  (erb + `e2/attack.json`); `requires:["ms_exec_calendar"]` on the E4 "Contractor invoice to settle"
  subject (erb + `e4/attack.json`) so an unresearched player defaults to the neutral "Quick one" and a
  diary pretext no longer rides under a payment subject (matches E1's N15 pattern).
- **N5** E4 did-not-land reason: "…a rushed payment from the road reads as odd" → "…a message out of
  the blue reads as odd rather than something she'd send while she's away" (nothing was a payment).
- **N9** E3 unfound facts: `requires:["quayholt_claims_head"]` on `name_drop_director` and
  `requires:["quayholt_gordon_away"]` on `cant_callback` (erb + `e3/attack.json`); engine already gates
  both the prep card and the call on `lines[].requires`.
- **N10** deflect tell: "Dodging the callback…" reworded to cover both the callback line and the
  skip-security-questions line it was also tagged on (`e3/attack.json` + erb).
- **E5–E7 P4-3** E6 QR: dropped the misleading "scan the QR code below" (no QR renders in the
  composer) → "…on the parking notice…"; made `replies.missed` fit the no-scan bulletin pretext too.
  `e6/attack.json` + erb.
- **E5–E7 P4-7** E7 miss advisory: set `factorStrings.urgencyCalibrated.failMissed:""` so the pressure
  line is hidden on a miss (the required pretextRelevant row already carries the reason); pressure
  advice kept for landed sends. `e7/attack.json` + erb.
- **E5–E7 P4-8** thin Ask feedback: enriched `factorStrings.urgencyCalibrated` (`fail`+`redFlag`,
  plus `failMissed:""`) for E6 and E7 to name the specific pressure. E5 left — its ask urgency always
  passes (advisoryMax medium) and passed advisories are not rendered, so nothing to enrich in data.
- **Trivials (data, cheap):** E1–E4 P4-7 flip-miss body dedup (dropped the sentence that repeats the
  "Nothing to replay this time" heading) in E2 and E4 erbs; E1–E4 P4-5 E1 `replies.missed` made
  pretext-agnostic (`e1/attack.json` + erb).

Handed back to the engine fixer (not data):
- **E5–E7 P4-5** duplicated feedback sentence: engine renders `truth.whyFine[flagId]` both in the
  "Not a flag here" line (`inbox-triage-minigame.js:706`) and again in the general "why this was fine"
  list (~714–724); no data-only fix keeps both the specific false-claim note and the no-tick
  explanation. Fix: in the whyFine list skip keys already shown as false-claims (or show only `default`).
- E1–E4 **P4-6** ("What would have happened" heading on a safe refusal), **P4-8** (E3 phone panel
  "-10 reset password" reads as a failed ask), **P4-9** ("No contacts yet" when a recipient is noted),
  **P4-10** ("Back to research" reopens last page): all engine/UI.
- E5–E7 **P4-9/P4-10** (Sharp band / weakest-skill tie-break), **P4-11** (green tick next to a Brand
  FAIL), **P4-12 / N-10** (E7 flip meter names only urgency; secrecy+authority not modelled as factors
  — larger composer-scoring change): engine. E4 N2 (webmail-only sender) left deliberately as before.

Verification:
- Validator `--strict-social --no-graph --skip-ink` on all 38 awareness shells: **38/38 pass.**
- Node: `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` — **1745/1745 pass.**
- Full-episode bridges, one at a time, live keyless :3001, Node 24, no server start/stop, other
  sessions' hung drivers left running: **e1 13/13, e2 14/14, e3 21/21, e4 14/14, e6 15/15, e7 13/13 —
  all PASS.** e2/e6 each failed once on the flip assertion on the first run (a flip-render timing flake
  under load; a probe confirmed stage=flip, done includes write, `.aw-flip` present and
  `rec.tells=['urgencyCalibrated']` all satisfied) and passed clean on rerun; the lab fixer was editing
  the bridge files concurrently. No ink changed, so no ink recompile.

## Dialogue fixer cycle 3 (2026-10-23) — formal `npc-dialog-review` cycle 3 + fragment/erb drift guard

Acted on `DIALOGUE_REVIEW_C3.md` (C3-1 MAJOR, C3-2…C3-5 minors, C3-T1 trivial) plus three E5 data
items handed over by the coordinator with engine round 4 (`dbcb43f56`). Data only: fragments, full
erbs, generated defend-only shells, one new Node test. **No voiced lines changed** — every edit is
flip narration, briefs, perFlagNotes, whyFine page notes or flipPageIntro, all on-screen panel/triage
text, none of it NPC/host ink. No TTS impact. No ink, CSS or engine JS touched.

### C3-1 (MAJOR) — fragment↔erb flip-string drift. The shipped full erbs are the current design.
Synced the fragments to the erbs (erb = current learner-facing text), then applied C3-2…C3-5 to both
sides identically. The drift, before fixing (fragment → erb, all in `awarenessEpisode.strings`):

- **E7 — whole flip cluster + brief stale (the retired voicemail-script design).** Fragment
  `e7/defend.json` still read "write the script for a short voicemail", flipIntro "the voicemail you
  scripted", flipDefenderLine "in the voice the finance office hears every week", flip* "the same kind
  of voicemail reaches the finance office's phone … you're the one listening", flipHeading "Now it's on
  your phone". Replaced with the erb's email-design wording (write the email that rides with a
  cloned-voice call; Tom reads it). Also rewrote the fragment's `_attack` note, which described the
  retired design, to point at the shipped erb.
- **E2 brief** fragment said "write one job application to its recruitment team"; erb names "its
  recruiter, Fatima Begum" (consistent with the flip). Synced fragment → erb.
- **E2/E6 flip "arrives/lands/turns up" verb drift**, **E2/E4 flipMissed** (erb had dropped the
  leading sentence in round 6, fragment had not): resolved by the C3-2 dedup below, applied to both.
- **E3/E5 `defendIntro`** differ (fragment trimmed, erb richer) — **left as a documented intentional
  divergence** (DIALOG_LOG cycle 1 MINOR-5: "E3 erb kept its richer scene-set"; the erb value carries
  the red-team→defend "Now you're …" transition, the fragment value feeds the standalone defend-only
  shell). Allow-listed in the guard, not synced.

### C3-2 — flipMissed / flipLandedNoTells no longer echo the `flipMissedHeading`
`flipMissedHeading` is "Nothing to replay this time" everywhere. Dropped the heading-echoing opener
("Your … didn't land this time, so there's nothing of yours to replay from the other side.") from
`flipMissed` in E1/E5/E6/E7 (E2/E4 erbs already deduped in round 6; synced the fragments). Every
send-episode `flipMissed` now opens "The defence is the same either way: next, …" (the review proposed
this exact form). Removed the "so there's nothing to replay" echo from all six `flipLandedNoTells`.

### C3-3 — flipLandedNoTells opener varied per role (was identical in all six)
Each send episode now opens with a role-tinted, replay-free line, then keeps its existing role tail:
E1 "It landed clean, with nothing in it to catch this time."; E2 "It opened like any real application,
with nothing off to pick up on."; E4 "It read as an ordinary message from Catherine, with nothing in it
to question."; E5 "The page passed without a slip this time, nothing in it to pull apart."; E6 "It
landed clean on the phone, with nothing in it to flag."; E7 "Nothing in it tripped a check this time."

### C3-4 — E7 full brief re-parsed (the stacked appositives split in two)
Was one sentence with three stacked appositives ("in the name of … , the message that would go with
… , asking for …"). Now: "write an email in the name of Brightwell's chief executive, Ravinder Sandhu,
asking for something he would never ask for. It's the message that would land alongside a cloned-voice
call to accounts payable." Applied to both the fragment and the erb (part of the E7 sync).

### C3-5 — flip reassurance closer varied (dropped the repeated "built this carefully … is not carelessness")
E1 closer → "Anyone clearing a payment run acts on the one that checks out."; E2 → "Forty applications
deep, anyone opens the next one."; E4 → "When a message fits the week and sounds like the boss, acting
on it is the ordinary thing to do." E5 kept (it already names the concrete address-bar tell); E3/E6/E7
already varied.

### C3-T1 — E7 perFlagNote full stops
Added the terminal full stop to `e7` `vish_callback_pressure` perFlagNotes ("…the excuse." and "…is the
warning sign, not the reassurance.") in the fragment **and** the erb (both carried the identical string;
fixing both keeps them in sync). The "is Y, not X" shape kept per the review.

### Coordinator E5 items (engine round 4 hand-off)
1. **Password-manager feedback the learner never triggered → conditional.** The five E5 defend-set page
   notes asserted "your password manager filled it in / offered nothing / stayed quiet / didn't fill it
   in" as past fact, but the autofill is behind an optional "Try your password manager" button. Reworded
   to "would fill it in / would offer nothing / would stay quiet / would not fill it in" in `e5/defend.json`,
   the full erb and (via regen) the `_defend` shell. **Flagged, not changed:** the E5 general check-form
   pages (`general_form_a/b`, fragment lines ~227/250/333/442/465/548) carry the same past-tense wording;
   left to the coordinator's scope decision (they feed the pre/post_general shells and sit in the A/B
   parity multiset; the coordinator's line list named only the defend set).
2. **E5 `flipPageIntro` could promise tells that aren't there.** A learner can build a clean page with no
   page tells, yet the string said "The parts picked out below are what make it believable." The engine
   renders `flipPageIntro` unconditionally with no "no-tells" variant (`flip-view.js:125`). Reworded the
   single string to read true either way: "Anything that would give it away is picked out below." (full
   erb only — `flipPageIntro` is a full-episode-only key, allow-listed in the guard.)
3. **Weakest-skill "Look for it…" nudge — engine-side, no data string.** The only occurrences are in
   `inbox-triage-minigame.js:853,860`; naming several tied skills is already handled by `weakestText`
   and `debrief-view.js` (`names.length`). No awareness data string says "Look for it". Nothing to change
   here; flagged for the engine fixer.

### Drift guard (new) — `test/js/social-awareness-fragment-erb-parity.test.mjs`
Per episode, parses the fragment (`e<N>/defend.json`) and the full erb (`scenarios/awareness_e<N>_*/
scenario.json.erb`, plain JSON — no ERB tags) and compares the keys meant to be shared, failing with a
list of every mismatch:
- `awarenessEpisode.strings` (values deep-equal for keys in both),
- `awarenessEpisode.debrief`,
- the full-episode triage set (`defend.setId`): every message (content + `truth`, matched by id) and
  the set-level copy (`factorStrings`, `channelTells`, `outcome`, …).
`"_"`-prefixed authoring notes (`_attack`, `_worked`, `_reusedFrom`, `_prefix`, `_order`, `_calls`,
`_audio`) are stripped before comparison. **Allow-list (intentional differences, one reason each):**
- `strings.defendIntro` value may differ — full erb keeps the richer scene-set and the red-team→defend
  transition; the fragment's trimmed value feeds the standalone defend-only shell (cycle 1 MINOR-5).
- erb-only `strings` keys are full-episode-only UI panels not needed in the fragment/defend-only shell:
  `conceptPanel`, `flipCallIntro`, `flipPageIntro`, `voicePanel`, `defendIntro` (E6/E7 carry it only in
  the erb).
- the triage set's erb-only `playerSentAuth` records what the learner sent on the red-team side; the
  fragment set (also feeding defend-only, which has no send) omits it.
Proven: the test passes on the synced repo, and (temporarily perturbing one E1 erb string) fails listing
`strings.flipMissed differs`, then passes again after restore.

### Where each change lives (survives a regenerate)
- Fragments (source of record): `e{1,2,4,5,6,7}/defend.json`.
- Full episodes (hand-mirrored, edited directly): `awareness_e{1,2,4,5,6,7}` erbs (E3 unchanged).
- Generated defend-only shells: regenerated into scratch (no-change baseline byte-identical first),
  diffed, copied in — **6 changed** (`awareness_e{1,2,4,5,6,7}_*_defend/scenario.json.erb`: each picked
  up its reworded `flipLandedNoTells`; e5 also the five conditional page notes; e7 also the two
  perFlagNote full stops). e3 defend-only unchanged; no check shells changed (no check-set edits).
- New test: `test/js/social-awareness-fragment-erb-parity.test.mjs`.

### Checks run
- **No-change baseline:** fresh regen of all four generators into scratch byte-identical to the repo
  before editing (31 shells). **Post-copy:** a fresh regen is byte-identical again (0 diffs).
- **Validator** (`--strict-social --no-graph --skip-ink`): **all 38 awareness shells exit 0.** Warnings
  pre-existing only (E7 `phish_ceo_voice_target_landed` declared-but-not-read, a design-stage item).
- **Node tests:** `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1777/1777 pass**, including the 7 new parity subtests.
- **Full-episode bridges** (Node, one at a time, live keyless :3001, no server start/stop; an engine
  fixer's screenshot driver was running concurrently and was left alone): **all PASS** — e1 13/13
  (4126), e2 14/14 (4127), e4 14/14 (4129), e5 18/18 (4131), e6 15/15 (4132), e7 13/13 (4134). e3 not
  edited, not run.

### Not mine (parallel engine fixer's WIP, untouched here)
`public/break_escape/css/awareness-skin.css`, `public/break_escape/js/systems/awareness-measure.js`,
`scripts/validate_social/awareness.rb`, `test/js/validator-social-awareness.test.mjs`. The untracked
`scenarios/awareness_*/dungeon_graph.*` predate this session (mtime 2026-10-22); the `--no-graph` runs
here did not write them.

---

## Fun-and-learning data pass (2026-10-23): aw2, aw5, aw8, E5 check-form reword

Scope: the DATA parts of the FUN_DECISIONS "Awareness" changes (aw1/aw3/aw6/aw9 are the parallel
engine fixer's; aw4 held pending its engine hook; aw7 is "Later"). No JS/CSS/validator edits here.

### aw2 — one consequential choice in each template attack, quoted back in the flip: STOPPED, needs an engine hook
The flip replays the learner's composed message verbatim (`resolvePlayerSent` → the chosen pretext text
shows in the message pane with its tells), so the *artefact* is already quoted back. But the flip's
narration line is a single fixed string, `strings.flipDefenderLine`, rendered by
`flip-view.js:187` with no awareness of the learner's choice; `episode-runner-minigame.js:_renderFlip`
passes `strings` wholesale and never reads `state.sent.templateId` (which the model already records,
`episode-model.js:sentFromRecord`). So a *choice-aware* defender line — FUN_REVIEW item 2's example,
"the invoice number **you chose** is real…" — cannot be authored in data: there is no mechanism to pick
a per-choice line. This applies to every template episode (E1, E2, E4, E6, E7), so aw2 is held for the
engine builder. **Hook needed (small):** the runner selects, e.g.,
`strings.flipDefenderLineByPretext?.[state.sent.templateId] ?? strings.flipDefenderLine` and passes it to
`renderFlipView` (or the flip view resolves it from a passed `templateId`). Data would then be one extra
string per meaningful pretext branch. No aw2 data shipped, to avoid a fixed `flipDefenderLine` that lies
for some branch.

### aw5 — a mirror pair (suspicious-looking genuine + normal-looking, on-screen-catchable phish) in every defend set
Audited all seven defend sets (the episode's own `defend.setId` set):
- **E1 `e1_payments_inbox`**: had the suspicious-genuine (`e1_bank_confirmed`, calm genuine bank change
  "confirmed by phone") but **no calm/normal-looking phish** — both existing phish are loud (urgent
  lookalike; CEO personal-inbox secrecy), so a learner could win on "pushy = phish." **ADDED**
  `e1_pennine_bank_calm` (below).
- **E2 `e2_recruitment_inbox`**: already compliant — suspicious-genuine `e2_cv_docx` / `e2_agency_shortlist`;
  normal-looking phish `e2_enable_content` (a routine "Job application" macro lure, tell on screen). No change.
- **E3 `e3_service_desk_queue`** (role-swap calls): already the gold mirror — `e3_call_gordon_real`
  (grumpy, pressured, genuine; same four facts as the impostor) vs `e3_call_gordon_impostor` /
  `e3_call_on_behalf`; only the callback distinguishes them. No change.
- **E4 `e4_pa_inbox`**: compliant — suspicious-genuine `e4_vm_landed` (calm genuine voicemail mirroring the
  phish `e4_vm_gate`) and `e4_wrenfield_itinerary`; normal-looking phish `e4_wrenfield_lookalike` (a mundane
  hotel-billing email, tell = look-alike domain). No change (borderline: its mild "today" urgency, but the
  scored tell is the domain, not the tone).
- **E5 `e5_links_inbox`**: already several of each (the product's strongest set). No change.
- **E6 `e6_phone_messages`**: compliant — suspicious-genuine `e6_shift_moved` / `e6_canteen_qr`;
  normal-looking phish `e6_parking_permit` (QR mimicking the expected permit rollout, tell = look-alike
  domain + unexpected QR). No change.
- **E7 `e7_finance_line`**: has the suspicious-genuine (`e7_vm_lindiwe_gate`, a pressured-but-genuine gate
  call) and a genuine/phish voicemail mirror, but no calm on-screen-catchable phish. **Tried** adding a calm
  look-alike-domain email (`e7_pennine_bank_calm`) + `lookalike_domain` in the set's channelTells — but the
  extra email flips `defendSetKind` (`episode-runner-minigame.js`) from `'voice'` to `'messages'` (a 3-voicemail
  / 3-email tie resolves to `'messages'`), demoting the whole episode from a voicemail round to a generic
  inbox round. Proven by the e7-full bridge: the change failed 8/13 ("Open the voicemail" no longer the
  defend button, first voicemail verdict unreachable), while the HEAD baseline passed 13/13. A voicemail has
  no domain/link, so a *calm, on-screen-catchable* phish cannot exist in E7's channel without changing the
  round kind. **REVERTED** the E7 addition; E7 left at HEAD. Recommend the orchestrator either accept E7's
  existing voicemail mirror, or defer to aw7 (E7 → defend-only).

New message (E1), identical in fragment `e1/defend.json` and full erb (parity holds), inserted after
`e1_po_pennine`, before `e1_ceo_wire`:
- **`e1_pennine_bank_calm`** — From "Pennine Oat Mills" `accounts@pennine-oatmills.example` (look-alike:
  a hyphen in the real `pennineoatmills.example`), subject "Our bank details have changed (no rush)". Body:
  "Hello,\nJust a note for your records. We've moved our business banking, so when you next pay us please
  use the account below rather than the one on file. There's nothing outstanding today, so there's no rush
  at all: it can wait for your next run against PO-4471.\nNew account name: Pennine Oat Mills Ltd\nNew
  account number ending 2290\nMany thanks,\nBryony Thwaite\nCredit Control, Pennine Oat Mills". Phish;
  flags `senderTrust, lookalike_domain, changed_bank_details` (either-tick `[senderTrust, lookalike_domain]`),
  on-screen tell = the look-alike domain in the From. It ties to the genuine `e1_po_pennine` (PO-4471) above
  and mirrors the calm genuine `e1_bank_confirmed`, so the learner must check the domain, not the tone.
  E1 set now 6 messages (3 phish / 3 genuine), within the validator's 4..8.

### aw8 — tell organisers the pre/post checks are per role
Appended one sentence to every pre/post **check** mission.json `description` (organiser/catalogue copy;
FUN_REVIEW item 8 calls this "organiser copy"), via the four generators' `desc` build (one append each,
covering pre and post): *"Organiser note: each role's check tests the channel that role meets in its
episode, and in a session that runs more than one episode only the learner's primary-role check is
recorded."* 24 mission.json regenerated and copied in. Not put in any learner-facing string. (Nuance for
the orchestrator: a catalogue description is faintly learner-visible; phrased as an explicit "Organiser
note" so it reads as meta-guidance. A dedicated organiser README would be fully learner-invisible if
preferred.)

### E5 — conditional password-manager wording in the general check forms
The general-role check pages carried past-tense autofill wording ("your password manager recognised the
site and filled it in", "filled it in", "offered nothing") although the autofill sits behind an optional
button. Reworded to the conditional form the E5 defend set already uses ("would recognise the site and
fill it in", "would fill it in", "would offer nothing"), in `e5/defend.json` (`general_form_a`/`_b`); the
four general check scenarios regenerated and copied in. 0 residual past-tense; 3 conditional notes each.

### Pipeline / parity
- Fragments edited: `e1/defend.json` (aw5), `e5/defend.json` (E5 reword). Generators edited: all four
  (aw8). Full erb edited directly: `awareness_e1_invoice_fraud` (aw5, hand-mirrored, parity holds).
- No-change baseline before editing: fresh regen of all 31 shells byte-identical to the repo.
- After editing, regen → diff → copied in **30 changed files**: `awareness_e1_invoice_fraud_defend`
  scenario (new message), 4 general check scenarios (E5 reword), 24 check mission.json (aw8). E7 shells
  reverted to HEAD. A fresh regen of my files is byte-identical apart from the parallel lighting agent's
  `training_room.py` / `training_room_lighting.json` drift (not mine; not propagated — I used
  `git show HEAD:` to revert E7, not a regen, to avoid pulling their uncommitted lighting into a shell).
- Bridge updated deliberately: `tools/playtest/se/bridge-e1-full.jsonl` — the triage plan gained
  `['e1_pennine_bank_calm','report',['lookalike_domain','changed_bank_details']]` for the new 6th message.
  `bridge-e7-full.jsonl` left at HEAD (E7 reverted).

### Checks run
- Parity test `social-awareness-fragment-erb-parity`: **7/7 pass**.
- Validator `--strict-social --no-graph --skip-ink` on all **38** awareness shells: **all exit 0**, no new
  warnings.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: **1778/1778 pass**.
- Full-episode bridges (keyless :3001, one at a time): **e1-full 13/13 PASS** (with the new 6-message plan);
  **e7-full 13/13 PASS** at HEAD (after the E7 revert). The intermediate E7 attempt's 8/13 failure is the
  evidence for the defendSetKind flip described above. e2–e6 unchanged by this pass (not re-run).

---

## Fun-and-learning: aw2 (choice-aware flip line) + aw4 (shared rule of thumb) (2026-10-23)

The two remaining FUN_DECISIONS "Awareness" changes: aw2 (held last pass for want of an engine hook)
and aw4 (held for its engine hook, added in a8caac8e0). Engine + schema + validator + tests + data.
No ink touched, so no TTS impact (every string here is on-screen panel/flip text, not host voice).

### aw2 engine hook — a choice-aware flip defender line

The flip replayed the learner's own message but narrated it with one fixed `strings.flipDefenderLine`,
so the pretext the learner picked was never named back. Added a small hook:

- `flip-view.js`: new exported `defenderLine(strings, templateId)` — returns
  `strings.flipDefenderLineByChoice[templateId]` when that key holds text, else `flipDefenderLine`,
  else the engine default. `renderFlipView` takes a new `templateId` option and renders the resolved
  line in `.aw-defender-line` (getState shape unchanged; the line is read from the DOM).
- `episode-runner-minigame.js`: `_renderFlip` passes `templateId: this.state.sent?.templateId ?? null`
  (the chosen pretext the model already records in `sentFromRecord`; a call has none → null).
- `scenario-schema.json`: `strings.flipDefenderLineByChoice` added (object of template id → string).
- `validate_social/awareness.rb`: `flip_by_choice_checks` — warns on a key that is not a
  `social.templates` id, or is a template that is not a `part: "pretext"` (never selected as the
  flip's templateId); errors on an empty value or a non-object. `string_checks` now takes `ctx`.
- Tests: `social-episode-views.test.mjs` (defenderLine resolver + rendered `.aw-defender-line`,
  per-branch and fallback); `validator-social-awareness.test.mjs` (clean pretext keys, the two warns,
  the empty error, the non-object error).

**Authoring (full erbs only).** `flipDefenderLineByChoice` is erb-only: only a full episode makes a
pretext choice; the defend-only shell has no write/flip stage and the generator pops the flip strings
there, so it is NOT in the fragment and the generated shells never carry it. Added
`flipDefenderLineByChoice` to `STRINGS_ERB_ONLY_OK` in `social-awareness-fragment-erb-parity.test.mjs`
with a reason. Each of the five template episodes (E1, E2, E4, E6, E7) already offered 2–3 pretexts
(the compose forces the choice when `templateSets.pretext` has more than one); the consequential lever
is urgent vs calm vs a benign no-ask variant. One short per-branch line each, true for that branch:

- **E1** `pretext_bank_change` (urgent run-due), `pretext_bank_change_calm` (the "no rush" is what lets
  it through), `pretext_statement` (a plain statement asks for nothing; the ask is what bites).
- **E2** `pretext_application` (named the vacancy + a CV, read as a real applicant),
  `pretext_general` (a speculative note has less pull, but the attachment still does the work).
- **E4** `ms_pretext_pay_now` (rush + "keep it between us" left no room to check),
  `ms_pretext_pay_calm` (no deadline/secrecy; the ease is what slipped it by), `ms_pretext_diary`
  (a diary ask costs nothing; the request to move money is what turns a convincing message into a loss).
- **E6** `pretext_qr_permit` (named the permit + a Friday deadline), `pretext_qr_permit_calm` (the easy
  "when you get a chance" matched the rollout, no flag raised), `pretext_bulletin` (a bulletin asks for
  nothing; the scan is the hook).
- **E7** `pretext_ceo_payment` (a voice + a message in the CEO's name, half the transfer set up),
  `pretext_catchup` (a catch-up asks for nothing; the request to move money is the bite).

E3 (a pretext call) and E5 (a built page) carry no pretext templateId, so they get no by-choice map
(the validator would warn), consistent with FUN_REVIEW item 2 naming E1/E2/E4/E6/E7.

### aw4 — one shared rule of thumb in every debrief

The debrief hook (`ruleOfThumb`, a8caac8e0) read `social.awareness.ruleOfThumb` and rendered nothing
without it. Set one deployment-wide rule, identical in all 38 shells:

> The habit to keep — When a message pressures you to move money, grant access or read back a code,
> stop and check it using contact details you already have, rather than the ones the message gives
> you. Taking a minute to confirm is always a fair thing to do.

- Single-sourced for the generators in `awareness_deploy.py` (`AWARENESS_RULE_OF_THUMB_TEXT` /
  `_HEADING`, `awareness_block()`); the four generators import it and set
  `sc['social']['awareness']` in `scenario()`, so all 31 generated shells (7 defend-only + 24 checks)
  carry it. Hand-mirrored the identical `{heading, text}` into the 7 full erbs.
- Gave it the heading "The habit to keep" (visible, matching the aw1 "How to report here" box), so the
  shared rule reads as a titled box above the Monday card rather than blending into the flow.
- Test `social-awareness-rule-of-thumb.test.mjs`: all 38 shells carry a non-empty
  `social.awareness.ruleOfThumb`, and every shell's ruleOfThumb object is byte-identical — the single
  guard that the generators and the hand-authored full erbs stay in step.

**Monday cards → the report box (FUN hook note, done).** The report-route box (aw1) now renders
directly under the Monday card, so the 7 cards that ended "report it the way your organisation asks you
to" now end "report it using the route in the box below", giving that instruction a concrete referent.
Reworded in the 7 fragments + 7 full erbs (the 7 defend-only shells pick it up on regen). Check shells
show no Monday card, so they are unaffected.

### Pipeline / parity
- Fragments edited: `e{1..7}/defend.json` (Monday card tail only). Full erbs edited directly: all seven
  (aw4 ruleOfThumb + Monday reword; E1/E2/E4/E6/E7 also flipDefenderLineByChoice). Generators: all four
  (import awareness_deploy + inject the awareness block). New: `awareness_deploy.py`.
- No-change baseline before editing: fresh regen of all 31 shells byte-identical to HEAD (training_room
  current). After copy-in, a fresh regen is byte-identical again (0 diffs, scenario.json.erb +
  mission.json + generated ink). 31 generated scenario.json.erb copied in (every shell gained the
  awareness block; the 7 defend-only also the Monday reword); mission.json and ink unchanged.

### Checks run
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: **1782/1782 pass**
  (+4 new: 2 flip-view aw2, 1 validator aw2, 1 rule-of-thumb identity). Parity test: 7/7.
- Validator `--strict-social --no-graph --skip-ink` on all **38** awareness shells: **all exit 0**, no
  new warnings (no flipDefenderLineByChoice / ruleOfThumb / awareness.* warnings).
- Full-episode bridges (keyless :3001, one at a time, no server start/stop; another session's drivers
  were running during e5–e7 and were left alone): **all 7 PASS** — e1 13/13, e2 14/14, e3 21/21,
  e4 14/14, e5 18/18, e6 15/15, e7 13/13 (games 4170–4183).
- Screenshots looked at: the E1 flip after choosing `pretext_bank_change` shows the per-branch defender
  line quoting the urgent run-due pretext; a rendered E1 debrief shows "The habit to keep" box above the
  Monday card, the card pointing at the "How to report here" box below.

## Data fixer: playtest P5 findings, round 7 (2026-10-23)

Fixing the P5 data items from `playtests/PLAYTEST_P5_E1_E4.md` and `PLAYTEST_P5_E5_E7.md`.
Source-of-record edits in the fragments + four generators + the seven hand-authored full erbs;
the 31 generated shells (7 defend-only + 24 checks) regenerated and copied in. No voiced NPC line
changed: every edit is brief / debrief / flip / persona-reply / description UI text, or (E3) ink
choice display-conditions and a VAR — no spoken ink line text was touched, and awareness has no TTS
cache. Engine fixer owns the parallel P5 items.

### P5-4 (E1–E4) + P5-2 (E5–E7): the "never costs you anything" briefs vs the result's stated cost
The briefs promised "Reporting a real message never costs you anything" while the result screen now
names a cost. Reworded every brief/description to agree with the result: reporting when unsure is
always fine and never marked down, but a real one reported does take a colleague's time.
- Base (message/page): "Reporting when you're unsure is always fine and never marked down, though a
  real one does take a colleague's time to check."
- Call (E3): "Ringing back when you're unsure is always fine and never marked down, though a real
  caller does take a colleague's time to check."
- E4 (report-or-check): "Reporting or checking when you're unsure is always fine and never marked
  down, though a real one does take a colleague's time to check."
- Catalogue descriptions ("Each answer is explained, and …" / "Only the inbox is scored, and …")
  shortened to "… reporting [or checking | ringing back] when you're unsure is always fine and never
  marked down."
- 40 occurrences across the 7 fragments + 4 generators + 7 full erbs, plus 7 full-episode
  mission.json "Only the … is scored, and …" tails. No "never costs you anything" string remains in
  any shell or fragment.

### P5-9 (E1–E4): E1 says five messages, the inbox has six — count audit
`e1_payments_inbox` holds six messages but the set brief and the defend-only brief said "Five".
Fixed to "Six"/"six" in `e1/defend.json` (set brief + `_defendOnly` brief), the E1 full erb set
brief, and `gen_e1_shells.py` (scenario_brief, endGoal, kiosk observations, success screen,
mission.json description). Audited every shell's number words against its defend set size: E1 was the
only genuine mismatch (E5 "Five pages"/5 and E6 "six things"/6 are correct; other number words were
"three o'clock", "one email", etc.).

### E5–E7 P5-1: E5 flip prose "showed a padlock" on a No-padlock build
`strings.flipDefenderLine` (fragment + full erb) dropped "and showed a padlock", so it is now true
whichever padlock choice the learner made: "The page wore the Quayholt look, so she began typing her
password. … only the address in the bar gave it away."

### E5–E7 P5-8: E5 miss reason / Hana's reply named Quayholt for a DocShare build
Hana's `replies.missed` (attack fragment + full erb) reworded to name the service point without
assuming the chosen brand: "That page wasn't Quayholt's own sign-in — the address was wrong, and it
isn't where I log in — so I didn't put my password in. I'll go to the portal the normal way." True
for both a Quayholt look-alike and a DocShare build. (Naming the specific chosen service — e.g.
"DocShare" — would need the engine to inject the build's brand into the flip reply; left for engine.)

### E5–E7 P5-12: E5 landed advisory "That feels rushed." too thin
The E5 phish target had no `factorStrings.urgencyCalibrated.fail`, so the engine default
"That feels rushed." showed. Added the E6/E7-style full sentence (attack fragment + full erb):
fail "'Sign in before the end of the day' is the kind of deadline that gets someone to sign in
before they stop to check the address.", failMissed "", redFlag "The 'before the end of the day'
line pushes you to sign in before you check the address in the bar."

### E5–E7 P5-13: E7 compose label talks of a call, options are addresses
Renamed the `sender_address` slot label "the line it comes from" → "the address it comes from"
(attack fragment + full erb); the options are email addresses.

### E1–E4 P5-7: E3 call menu offered lines the prep card hid
`leila_servicedesk.ink` gated the two ungated call choices on the same facts their
`lines[*].requires` name: the name-drop line on `se_intel_quayholt_claims_head`, the no-callback line
on `se_intel_quayholt_gordon_away` (new VAR declared; the global already exists). skip_verification
stays always-available (it has no `requires`). Recompiled `leila_servicedesk.json` (darren_price.json
unchanged).

### truth.falseAlarmCost on genuine items (commit 1c8106fd1), where a concrete cost teaches better
Added short, item-specific costs (fragment + full erb, parity kept):
- E1 `e1_harlow_invoice`: "Left unpaid, September's cartons would hold up the next delivery."
- E6 `e6_shift_moved`: "Dismissed as a scam, the new start time gets missed and the early run goes
  short-handed."
- E7 `e7_vm_ravinder_train`: "It asks for nothing, so little is lost, but flagging it has someone
  chase Ravinder on the train to re-confirm invoices he already approved."
- E7 `e7_vm_lindiwe_gate`: "Left unactioned, nobody rings Harlow, the driver takes the chilled
  cartons back, and the delivery is lost."

### aw4 rule of thumb: one shared rule, reworded to fit all channels (user approved one shared rule)
Kept a single shared rule but adjusted the text so it fits sign-in pages (E5) and SMS/QR (E6) as well
as money/call episodes. In `awareness_deploy.py` and the 7 full erbs:
"When a message pressures you to move money, grant access, sign in or read back a code, stop and
check it yourself through a route you already trust, not the link, number or page the message gives
you. Taking a minute to confirm is always a fair thing to do." (adds "sign in"; "a route you already
trust, not the link, number or page" replaces "contact details … rather than the ones", which did not
fit a page or a QR code).

### Pipeline / parity / checks
- No-change baseline before editing: fresh regen of all 31 shells byte-identical to the repo. After
  edits, regenerated into scratch and copied in only the 38 changed files (7 defend scenario.json.erb,
  7 defend mission.json, 24 check scenario.json.erb; check mission.json carry no cost phrase so are
  unchanged).
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1810/1810 pass.
  Fragment↔erb parity 7/7, rule-of-thumb identity (38 shells), genuine-feedback/falseAlarmCost checks.
- Validator `--strict-social --no-graph --skip-ink` on all 38 shells: exit 0, only pre-existing
  suggestions (leila_reset_granted, avatar, timedConversation).
- E3 ink recompiled.
- Full-episode bridges (keyless :3001, one at a time, no server start/stop, other sessions left alone):
  e2 14/14, e3 21/21, e5 18/18, e6 15/15 PASS. e1 12/13, e4 13/14, e7 12/13 fail ONLY the final debrief
  assertion `(!!noblame === (cards.length > 0))`. This is PRE-EXISTING, not from these edits: each
  fails identically on the HEAD scenario (verified by swapping HEAD's erb in and back for e1/e4/e7).
  The bridges were last green at the commit that added the awareness block (DIALOG_LOG 2026-10-23);
  engine commits since (genuine-item feedback, 1c8106fd1) render `.aw-card` for trusted real items in a
  perfect round, which the stale invariant does not expect. HAND BACK to the engine/bridge owner.

## Data round 8 (engine round 5 hooks) — 2026-10-23 — PAUSED mid-pass (items 1-4 done, item 5 not started)

Authored the data hooks for engine round 5 (eb358d5d1). Development was put on hold by the user
after items 1-4; item 5 was not started. Everything landed is self-consistent (parity + validator +
node tests pass).

### Item 1 — subjects bound to pretexts (`subjects[].requiresTemplate`, full erbs, attack side)
A subject that only fits one pretext is now offered only while that pretext is chosen, so the composer
can no longer pair, e.g., "Action needed: sign in again" with the benign newsletter. Bound:
- E5 `s_sso` → `[e5_pretext_reauth, e5_pretext_reauth_calm]` (off the newsletter pretext).
- E6 `s_permit` → `[pretext_qr_permit, pretext_qr_permit_calm]` (off the depot bulletin).
- E1 `s_invoice` → `[pretext_bank_change, pretext_bank_change_calm]` (off the monthly-statement pretext).
- E2 `s_application` → `[pretext_application]` (off the general "introduce myself" pretext).
- E4 `s_payment` → `[ms_pretext_pay_now, ms_pretext_pay_calm]` (off the diary pretext).
- E7 `s_payment` → `[pretext_ceo_payment]` (off the month-end catch-up pretext).
Each episode's generic `s_other` ("Quick note"/"Quick one"/"Quick word") is left unbound, so a pretext
is always covered and the "all subjects carry requiresTemplate" warning does not fire. E3 has no
compose/subjects block (vishing), so nothing to bind.

### Item 2 — template `flags` (social-pressure tells the wording carries, full erbs)
Only the secrecy/authority tells are auto-undetectable, so these are the honest additions (audited
E1/E2/E5/E6: none carry secrecy, bypass or borrowed-authority wording):
- E4 `ms_pretext_pay_now` → `[secrecy_or_bypass, borrowed_authority]` ("keep it between us … no need to
  trouble finance … I'll square it with them" — the senior partner invoked to skip finance). The calm
  variant is left clean (it says "I'll confirm it with finance").
- E7 `pretext_ceo_payment` → `[borrowed_authority]` ("signed off at my end" — the CEO's own sign-off
  invoked to skip the check); `ask_pay_now` → `[secrecy_or_bypass]` ("keep it between us until I'm back").
Both episodes' defend-set truth already carries the matching flags, so the meter/flip and the debrief
now name the same tells.

### Item 3 — no-blame lines (strings; fragment + erb)
The engine now shows `noBlameLine` only after a wrong verdict, where a "nobody is marked down / no one
is keeping score / nothing counts against you" claim is false (verdict points were lost). Reworded the
four lines that made that claim, keeping the attack-quality reassurance and ending on "shows where to
look next time" (the critical default's framing): E1, E2, E3, E4. E5/E6/E7 lines make no scoring claim
and were left.
`noBlameLineCritical`: the engine default ("These messages are built to fool careful people …") fits
every episode whose critical miss is an email/push/text, so no per-episode line was needed — except E3,
whose defend stage is a service-desk call set (plus one MFA push); "messages" does not fit, so authored
a channel-neutral line: "This was built to catch you under pressure, not to test how careful you are.
The points only show where to look next time." (propagates to the helpdesk check shells, also calls).

### Item 4 — E6 canteen `whyFine` (truth; fragment + erb)
Lines 1 (`unexpected_qr`) and 3 (`default`) both said the code goes to Tarrowby's own domain/forms page.
The domain point now lives only in line 2 (`lookalike_domain`). Line 1 → expected QR from a known person,
asks nothing sensitive; line 3 → physical provenance (printed table cards, facilities manager you know)
and that all it collects is a menu rating. Three distinct reasons.

### Item 5 — round-7 brief/count audit — NOT STARTED (paused by user).

### Pipeline / parity / checks
- No-change baseline: fresh regen of all 31 shells byte-identical to the repo before editing.
- After edits, regenerated into scratch; only the 5 defend shells with changed fragment copy differed
  (e1/e2/e3/e4 noBlameLine[+critical for e3], e6 canteen whyFine). Copied those 5 in; check shells carry
  no noBlameLine/whyFine so are unchanged. Full erbs edited by hand (items 1-4 strings/whyFine, items
  1-2 attack side).
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1810/1810 pass. Parity 7/7.
- Validator `--strict-social --no-graph --skip-ink` on all 38 shells: exit 0, only pre-existing suggestions.
- Bridges skipped (paused). dungeon_graph untouched (--no-graph); the pre-existing lab_social_engineering
  dungeon_graph churn and `sys,json` predate this pass and were left alone.

## Dialogue cycle 4 fixes

From `DIALOG_REVIEW_C4.md` (formal cycle 4, reviewer read-only). Only C4-1 is applied this round;
E3 is being edited by another agent for the MFA decision, so the two E3-side items wait for the next
round. Nothing here is voiced; no TTS top-up.

### C4-1 — E4 defend side omits `borrowed_authority` (MAJOR) — FIXED (truth; fragment + erb + defend shell)
E4's defend set offered `borrowed_authority` as a tick (it is in the set's `channelTells`) and the
attack-build pretext `ms_pretext_pay_now` claimed it, but neither phish item in the defend set carried
it in `truth.flags`. A learner who correctly ticked it was told "Not a flag here", contradicting both
E4's own attack side and E7's identical treatment. Added `borrowed_authority` to `truth.flags` and a
`perFlagNote` on both items, in the style of E7's notes (e7 erb :173 voicemail, :240 email):
- `e4_boarding_payment` (email): flags now `senderTrust, borrowed_authority, secrecy_or_bypass,
  urgencyCalibrated`; note "'I'll sign it off when I land' leans on the managing partner's own authority
  to push the payment past Yasmin's approval. A name in the From line is no proof she sent it".
- `e4_vm_gate` (voicemail): flags now `vish_callback_pressure, secrecy_or_bypass, borrowed_authority`;
  note "'I'll square it with her myself' uses the managing partner's own authority to wave the payment
  past finance. It sounded like her, and a voice on its own doesn't prove who is speaking".
Applied to the fragment `e4/defend.json` and the full erb `awareness_e4_exec_whaling/scenario.json.erb`
with identical flag-array and perFlagNote key order so parity holds. The defend-only shell was
regenerated from the fragment (below). Check shells carry no episode-set per-message truth, so are
unaffected.

### C4-2 — E1/E3 no-blame lines end on an identical sentence (MINOR) — DEFERRED
Next round: E3 is being edited for the MFA decision, so its no-blame tail is left to that agent's pass.

### C4-T1 — E3 critical no-blame line uses a mild "built to A, not to B" shape (TRIVIAL) — DEFERRED
Next round, with E3 (optional in the review). Same reason as C4-2.

### Pipeline / parity / checks
- No-change baseline: with the fragment reverted to HEAD, `gen_e2_e4_shells.py` regenerated into scratch
  reproduced the E4 defend-only shell (scenario.json.erb, mission.json, ink) and all four executive check
  shells byte-identically to the repo.
- After the fragment edit, regenerated into scratch; only the E4 defend-only `scenario.json.erb` differed,
  and only in the two truth blocks above. Copied that one file in; mission.json/ink and the four check
  shells were unchanged and not touched.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1817/1817 pass. Parity 7/7.
- Validator `--strict-social --no-graph --skip-ink` on all six E4 shells (full, defend-only, the four
  executive checks): exit 0.
- Triage-card check (scratch node script against the engine's `chipIdsFor`/`chipLabel`/`skillName`):
  for both items in all three E4 files, `borrowed_authority` is offered as a tick, is now a scored tell
  (so no longer "Not a flag here"), carries a perFlagNote, and names "Borrowed authority" in the Result
  breakdown.
- Bridges not run (not requested this round).

## Dialogue cycle 4 fixes, part two (2026-10-27)

Picks up C4-2 and C4-T1, deferred above because E3 was being edited for the MFA decision (commit
`b46fcf3a5`). That edit is now in, so both are done against the current E3 defend set. Fixer on Opus 4.8.
Also carried a small data round on the pre/post check durations and a validator wording fix.

### C4-2 — E1/E3 no-blame lines end on an identical sentence (MINOR) — FIXED (strings; fragment + full erb + defend shell)
E1 and E3 both closed their `noBlameLine` on the verbatim sentence "A miss here just shows where to look
next time." E1 keeps it; E3 now gets a channel-specific tail that holds the same "where to look next time"
idea without the same words. E3 is a service-desk call set (plus one MFA push), so the tail names the call.
- Old: "These callers rehearse sounding right, and a service desk that tries to help them is doing its job
  under pressure. A miss here just shows where to look next time."
- New: "These callers rehearse sounding right, and a service desk that tries to help them is doing its job
  under pressure. A miss just shows which call to slow down next time."
Applied to the fragment `e3/defend.json` (strings.noBlameLine) and the full erb
`awareness_e3_helpdesk_reset/scenario.json.erb` with identical text so parity holds; the E3 defend-only
shell was regenerated from the fragment (below).

### C4-T1 — E3 critical no-blame line uses a mild "built to A, not to B" shape (TRIVIAL) — FIXED (strings; fragment + full erb + defend shell)
`noBlameLineCritical` leaned on the negative-parallelism shape the house style watches for ("built to catch
you under pressure, not to test how careful you are"). Reworded to keep the no-blame tone and drop the
construction, left channel-neutral so it still fits both a call and a push miss.
- Old: "This was built to catch you under pressure, not to test how careful you are. The points only show
  where to look next time."
- New: "This was built to catch you when you're under pressure. The points only show where to look next time."
Same three files as C4-2. The two E3 lines no longer end on the same words as each other or as E1.

### Data round — pre/post check durations (not a dialogue finding)
The six finance/role check descriptions already read "about 8 to 10 minutes", but the numeric
`estimated_duration_minutes` (mission.json) and `durationTargetMin` (erb) still said 4 or 5. Set both to 9
on all 24 check shells, through the generators (`gen_e1_shells.py`, `gen_e2_e4_shells.py`,
`gen_e3_e5_shells.py`, `gen_e6_e7_shells.py` — the check `minutes` config, not the defend-only 8).
Defend-only episodes keep 8. Confirmed nothing reads `estimated_duration_minutes`: no JS/Ruby reader in
BreakEscape (only the generators write it) and none in Hacktivity; `durationTargetMin` likewise has no
code reader, only the schema declaration. Both are display/metadata only.

### Validator wording — `scripts/validate_social/awareness.rb`
The `emailReplyDelay` warning said "too long to wait in a 13 minute episode". Changed the prose to "too
long to wait in an episode of about 15 minutes" to match the course's "about 15 minutes" wording. The only
number in the message; the `REPLY_DELAY` threshold (seconds, unrelated to episode length) is unchanged and
does not key off 13/15/16.

### Pipeline / parity / checks
- No-change baseline: with the generators and fragment at HEAD, all four `gen_*_shells.py` regenerated into
  scratch reproduced every generated shell (scenario.json.erb, mission.json, ink) byte-identically to HEAD.
- After the edits, regenerated into scratch; the only differing generated files were the E3 defend-only
  `scenario.json.erb` (the two no-blame strings) and, for the 24 check shells, each `scenario.json.erb`
  (`durationTargetMin` 4/5 → 9) and `mission.json` (`estimated_duration_minutes` 4/5 → 9). Copied in only
  those; ink, dungeon_graph.* and the defend-only mission.json were unchanged and not touched.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1824/1824 pass. Parity 7/7.
- Validator `--strict-social --no-graph --skip-ink` on all 38 awareness shells: exit 0.
- Bridges not run (not requested this round).
