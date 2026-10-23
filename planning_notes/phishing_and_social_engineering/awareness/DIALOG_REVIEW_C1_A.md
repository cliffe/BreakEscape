# Awareness dialogue review — formal cycle 1, part 1 (A)

Fresh reviewer, review-only, `npc-dialog-review` skill. Scope: **E1–E4** (full and defend-only) and
their **check shells** for finance, HR, helpdesk and executive (`pre`/`post` × `ab`/`ba`). Covers the
host ink, the episode strings (brief, flip, debrief, Monday card, conclusions), the triage copy
(per-flag notes, `whyFine`, report replies) and the E3 call scripts. Audience: office staff in a short
training session.

No files were changed. Nothing committed.

## Where the copy lives (so fixes survive a regenerate)

The generated shell JSON under `scenarios/awareness_*` is not the source of truth for the wording.

- **Triage copy and episode strings** (briefs, flip, debrief, Monday card, `defendOnly`, per-flag
  notes, `whyFine`, `ifTrusted`, `reportReply`, E3 call scripts) are authored in the fragments
  `planning_notes/phishing_and_social_engineering/awareness/e{1,2,3,4}/defend.json` (and `attack.json`
  for OSINT/flip-feed facts). A shell packet copies these into `scenario.json.erb`. **Fix the fragment**;
  the shell inherits it.
- **Full-episode host inks** (`awareness_e{1..4}_*/ink/*.ink`) and the **finance check inks**
  (`graham_*`, `farah_*`) are **hand-authored** (no generator stamp): fix the ink directly.
- **HR / helpdesk / executive check inks** and **all defend-only host inks** are written by
  `gen_e2_e4_shells.py` and `gen_e3_e5_shells.py` (each file carries a `// Written by …` stamp):
  **fix the generator string**, or a rebuild reverts it.

## Severity counts

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 6 |

Phase 1 (compile / validate): all in-scope ink compiles (`Failed: 0`). The one E3 `-> END` warning is
the legitimate call hang-up in `leila_servicedesk.ink`. No validator dialogue-facing errors. Host inks
use the m01 hub / sticky-exit pattern cleanly; `blank-reentry` and starved-knot checks are clean.

---

## MAJOR

### MAJOR-1 — E3 pretext call: the contact's own lines carry a self-prefix (14 lines)
`scenarios/awareness_e3_helpdesk_reset/ink/leila_servicedesk.ink:39,58,68,72,77,79,81,83,85,87,89,96,98,100`

Every one of Leila's spoken lines is prefixed with her own name, e.g.:

> L39 `Leila Nassar: IT service desk, Leila speaking. How can I help?`
> L85 `Leila Nassar: A callback on the number we hold is how I confirm it's really you.`

The one shipped pretext-call reference, `scenarios/lab_social_engineering/ink/dev_service_desk.ink`,
carries **no** self-prefix on the contact's lines (`L47: Service desk, Dev speaking. What can I do for
you?`). The person-chat-pretext renderer attributes the contact's lines itself, so a `Name:` prefix is
at best redundant and, if the id does not resolve exactly, renders the literal `Leila Nassar:` text in
front of every line of the episode's climactic attack beat. `dialoguelint` flags all 14 as
`phone-self-prefix`.

**Fix:** drop the `Leila Nassar:` prefix from all 14 spoken lines (hand-authored ink; edit directly).
Match `dev_service_desk.ink`. Confirm against `person-chat-pretext` once dropped.

While here, L51 is also a `choice-len` warning (22 words, cap 15):
> `[I'm at a conference, I won't be at my desk phone, so a callback's no good. Can you just do it now?]`
Trim to e.g. `[I'm at a conference, away from my desk phone — a callback's no good. Can you just do it now?]` (17) or shorter.

### MAJOR-2 — Host hub lines run over the chat-bubble length cap (one wall of text to office staff)
`dialoguelint` flags eight host lines over the 30-word cap. For a 10-minute session the greeting/goodbye
bubble is the first and last thing a learner reads; a 40–44-word bubble reads as a wall.

Hand-authored (fix in ink):
- `awareness_e1_invoice_fraud/ink/adaeze_okafor.ink:25` — 40 words ("You've worked it from both ends now. … what I'd want from my team.")
- `awareness_e2_cv_lures/ink/fatima_begum.ink:24` — 32 words ("Inbox and all, that's the pair of them done. … earned a second look.")
- `awareness_e3_helpdesk_reset/ink/darren_price.ink:23` — **44 words** ("That's the desk covered from both seats, thanks. … the check that does.")
- `awareness_e4_exec_whaling/ink/thandiwe_moyo.ink:24` — 40 words; `:29` — 32 words.
- `awareness_post_finance_ab/ink/graham_post.ink:24` — 35 words.

Generated (fix the generator string, else a rebuild reverts):
- `awareness_pre_helpdesk_ab/ink/anjali_pre.ink:24` — 39 words — source `gen_e3_e5_shells.py:74`.
- `awareness_pre_helpdesk_ba/ink/sofia_pre.ink:24` — 31 words — source `gen_e3_e5_shells.py:84`.
- `awareness_pre_executive_ba/ink/julian_pre.ink:24` — 31 words — source `gen_e2_e4_shells.py:121`.

**Fix:** for the 40-word-plus lines, split into two bubbles (two spoken lines on consecutive lines in
the knot) rather than cramming. Worked examples:

- Darren (E3, the 44-word one), split:
  > `Darren Price: That's the desk covered from both seats, thanks.`
  > `Darren Price: Online you can find a name, a team, a staff number — none of them prove who's calling. The callback, on the number already on file, is the check that does.` (29)
- Adaeze (E1): keep "You've worked it from both ends now." as its own bubble, then the habit line as a second.
- Thandiwe (E4 L24): the defend-only host already has the tighter model — `"When it's money and it's in a hurry, ring her on the number you already have, or ask Yasmin."` — match that economy.

For the generated check lines, trim in place (single bubble, under 30):
- Anjali `gen_e3_e5_shells.py:74` → `"I'm Anjali, I look after security here. Before the training there's a short check on the kiosk: ten items from the service desk queue. Do what you'd normally do on a shift."` (30)
- Sofia `gen_e3_e5_shells.py:84` → drop "running this one": `"Hiya, I'm Sofia from HR. There's a short check on the kiosk first: ten items from the service desk queue. Just handle them the way you usually would."` (27)
- Julian `gen_e2_e4_shells.py:121` → drop "Before the training": `"Good of you to sit this. There's a short check on the kiosk first: ten emails and voicemails a PA might get. Deal with them as you would."` (27)
- Graham `graham_post.ink:24` → split after "same sort of thing.", or trim to `"Back again. Ten fresh ones on the kiosk, same sort of thing. Do them as you would. If you sat the first check, you'll get the two side by side at the end."` (still ~33 — prefer the two-bubble split).

E4 `thandiwe_moyo.ink:29` (32w, welcome line): drop "as the red team" →
`"Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA, then swap seats and cover his inbox."` (28).

---

## MINOR

### MINOR-1 — E4 "boarding payment" tell depends on OSINT the defend-only learner never did
`e4/defend.json:96` (`e4_pa_inbox` → `e4_boarding_payment` → `perFlagNote.senderTrust`)
> "Her published travel address is catherine.merrin@inboxly.example. This is catherine.merrin.travel@inboxly.example, a different inbox, and anyone can open a free one in her name"

This is the one item whose tell is "a *different* freemail inbox from the one she publishes" rather than
the clean "a senior name on freemail, not the company domain" used everywhere else. The published
address is only established in the OSINT stage (`e4/attack.json:35,111`), which the **defend-only** shell
(`awareness_e4_exec_whaling_defend`, same `e4_pa_inbox` set) never runs — so the card asserts a fact the
learner has no way to know, and the lesson can't be drawn from the card alone.
**Fix (fragment `e4/defend.json`):** make the note stand on its own, e.g.
> "A payment request from the managing partner on a free webmail inbox (inboxly.example), not her merrinsallow.example address. Anyone can open a free inbox in a name you know, so stop and ring her on the number in your contacts."

### MINOR-2 — Debrief/reassurance strings repeat near-verbatim across episodes
A learner who does two or three episodes meets the same lines.
- `defendOnly` is **word-for-word identical** in `e1/defend.json:893` and `e2/defend.json:605`
  ("You went straight to the inbox this time. These messages were written by people whose job is to make
  them look right, and people who fall for messages like these are not stupid. …").
- Every `noBlameLine` opens `"Nobody is marked down for a miss here."` (`e1:891`, `e2:603`, `e3:605`, `e4:605`).
- The flip reassurance repeats the "built this carefully/well … is not carelessness" shape:
  `e1/defend.json:888`, `e2/defend.json:601`, `e4/defend.json:603`.

**Fix (fragments):** vary the opener and the closer per role so the empathy beat still lands when
episodes are stacked (finance/payments, recruitment/CVs, service desk/callers, PA/voice each have their
own texture to lean on). E3 and E4 already vary the flip line well; bring E1/E2 `defendOnly` apart.

### MINOR-3 — Lookalike-domain notes overstate the rule ("makes it someone else's")
The repeated teaching line is phrased as an absolute:
`e2/defend.json:103,348,512,547` and `e4/defend.json:298,508`
> "an added word with a hyphen makes it someone else's"

A hyphenated or extra-word domain *can* legitimately belong to the same org; the accurate point is that
it is a **different** domain anyone can register, and you can't assume it's theirs. E3 already phrases it
correctly: `e3/defend.json:211-212,420` — "The added '-corp' makes a separate domain anyone can register".
**Fix (fragments):** align E2/E4 to E3's wording, e.g. "…adds a word with a hyphen, so it's a different
domain — not necessarily theirs. Check it against the address you already use."

### MINOR-4 — E1 flip seam: lands on the finance manager, but you defend the payments inbox
`e1/defend.json:887` (`flipIntro`) / `:888` (`flipDefenderLine`) say the message lands on **Adaeze, the
finance manager**, but the host ink (`adaeze_okafor.ink:30`) and the defend set put the learner in the
**payments inbox** ("swap seats and cover the payments inbox"), and the genuine `e1_bank_confirmed` item
is *from* Adaeze. So the flip victim and the defend seat are two different mailboxes.
**Fix (fragment / ink, low priority):** either make the flip land on "the payments team" to match the
seat the learner then takes, or have the host frame the defend seat as Adaeze's own inbox. Cosmetic, but
a sharp learner notices the switch.

### MINOR-5 — Double instruction: set `brief` and the episode `defendIntro` both tell the learner what to do
E3 and E4 full episodes carry both a defend-set `brief` and a `defendIntro` string that restate the same
"choose Comply/Ring back/… then tick what you noticed" instruction:
- E3: `e3/defend.json:34` (set brief) and `:608` (`defendIntro`).
- E4: `e4/defend.json:57` (set brief) and `:606` (`defendIntro`).

If the runner shows both (step-strip intro, then the triage panel brief), the learner reads the same
controls twice. **Worth checking against the runner;** if both display, trim one to a one-line scene
set ("Four calls holding and an overnight prompt on your phone — take them one at a time") and let the
panel brief own the controls.

### MINOR-6 — Mild negative-parallelism in otherwise strong teaching lines
Low priority, house-style only. `e4/defend.json:605` "A miss is about the pressure, not the person." and
the (good, keep-able) `e3/defend.json:134,343` "Impatience isn't a tell; talking you out of the callback
is." read as the "not X, Y" shape the project style guide flags. The E3 lines earn it (they draw the
exact distinction the learner needs); the E4 "not the person" tag could simply end "A miss here is about
the pressure you were under." Optional.

---

## Withdrawn after checking the code

- **E1 `flipDefenderLine` "Derek's name is on it"** (`e1/defend.json:888`) is **correct**, not a stray
  m01 leftover: Derek Mason is the Harlow Packaging accounts contact the learner impersonates
  (`e1/attack.json:9-10,24,102`). No change.

## Notes for the fixer / next part

- **Build-drift, not a finding against the copy:** the shipped full-episode scenarios carry strings the
  fragments lack — `awareness_e2_cv_lures` has `conceptPanel` and `flipMissed`, `awareness_e4_exec_whaling`
  has `voicePanel`/`flipMissed`/`defendIntro` — which sit in the fragments only as `_conceptPanel` /
  `_voicePanel` drafts (`e2/defend.json:30-34`, `e4/defend.json:610-614`). If the full episodes are ever
  re-emitted from the fragments, those strings must be promoted into `strings`, or they're lost. Any copy
  fix to the concept/voice panels should be made in both the shipped scenario and the fragment draft.
- Teaching content across E1–E4 is strong and on-message for a non-technical audience: the "sender's name
  is not the proof", "findable facts prove nothing on a call, the callback is the check", and "a voice is
  not proof, verify on a number you hold" lessons are consistent, warm and non-blaming. The per-item
  `whyFine`/`ifTrusted`/`reportReply` copy is concrete and plain. The paired-form matching and the
  "similar item after a likely miss" ordering follow design `11` §4.3.
- Part 1 covered E1–E4 and the four named check roles. E5–E7 and the `general`/`mobile` check shells are
  out of this part's scope.
