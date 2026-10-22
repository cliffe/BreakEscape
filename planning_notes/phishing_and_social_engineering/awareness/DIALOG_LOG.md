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
