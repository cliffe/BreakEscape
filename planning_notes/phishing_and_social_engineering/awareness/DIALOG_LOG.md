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
