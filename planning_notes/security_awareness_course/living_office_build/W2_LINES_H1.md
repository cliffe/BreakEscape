# W2_LINES_H1 — P-H1 host blocks and layers 0/1 (ca02, ca03, ca04, ca05)

Package P-H1 (opus48). Full shells only. Host lines are **voiced** (proposed for the O2 card);
layers 0 and 1 are **written** debrief panel text, outside the line budget. Voice column names the
VOICE_CAST voice; where not yet confirmed it is marked `(VOICE_CAST)` and resolved before the O2 card.

Budget (4.1): P-H1 host lines = 8 (ca02–ca05, 2 beats each). Layers 0/1 listed as `written`.

## keyMessage list (for I to check and write into episodes.json, D13)

The candidate is the message in the shell's first triage set that the incident turns on. I confirms
the id exists in the first triage set **with an outcome** of both the full shell and its twin.

| Shell | full-shell keyMessage | notes |
|---|---|---|
| ca02_cv_lures | `e2_enable_content` | first set `e2_recruitment_inbox`; the macro/"enable content" lure, `isPhish: true`. |
| ca03_helpdesk_reset | `e3_push_early` | **Confirmed (H1 Sonnet pass).** The scored defend set is `e3_service_desk_queue` (its `outcome.setGlobalPrefix` = `episode_e3_helpdesk_reset_defend_`; `gen_e3_e5_shells.py` sets the prefix on `clean_set(cfg['defend_set'])` with `defend_set: 'e3_service_desk_queue'`, and `office_kit.message_globals` writes `{keyMessage: kit_key_caught}` into that set's outcome). `e3_helpdesk_reset` is the **episode id**, not a second scored set, so there is no ambiguity: `e3_push_early` (the unrequested push prompt, `isPhish: true`) is the keyMessage. |
| ca04_exec_whaling | `e4_boarding_payment` | first set `e4_pa_inbox`; the urgent "pay before I land" payment email, `isPhish: true`. |
| ca05_signin_pages | `e5_sso_lookalike` | first set `e5_links_inbox`; the fake "session expired" sign-in page, `isPhish: true`. |

No shell in P-H1 is without a turning message, so none stops.

**All four confirmed (H1 Sonnet pass).** Each listed keyMessage sits in the shell's scored defend set,
the one whose `outcome.setGlobalPrefix` is `episode_<id>_defend_` and onto which `office_kit.message_globals`
writes `{keyMessage: kit_key_caught}`: ca02 `e2_enable_content` in `e2_recruitment_inbox`; ca03 `e3_push_early`
in `e3_service_desk_queue`; ca04 `e4_boarding_payment` in `e4_pa_inbox`; ca05 `e5_sso_lookalike` in `e5_links_inbox`.
All four incident messages carry `isPhish: true`. I writes these into `episodes.json` (D13).

## Replaced-sentence list (D9 timing; one existing sentence cut per shell)

| Shell | Cut sentence (from existing `conceptPanel.text`) |
|---|---|
| ca02_cv_lures | "Many organisations now block macros in files that arrive from the internet, so this trick works less often than it used to." |
| ca03_helpdesk_reset | "Only a callback to the number already on file could tell the real Gordon from the impostor." |
| ca04_exec_whaling | **No existing conceptPanel** — a new panel is created, no debrief prose to replace (debrief is `mondayCard`+`noBlameLine` only). Flagged: appendix ca04 §8 says "replacing one debrief sentence" but the shell has none; timing pay-for defers to the human timing runs (D9). |
| ca05_signin_pages | **No existing conceptPanel** — same as ca04. Flagged. |

## Layer 0 and layer 1 (written; `strings.conceptPanel.text`)

Each panel reads: existing teaching text (one sentence cut, ca02/ca03) · layer 0 · layer 1. Layer 0
opens "To a real attacker"; layer 1 ends "…have a word with <host first name>." (no "look around the
office"; D3). The fragment (twin) carries layer 1 only, without "you", without layer 0, without the
pointer, sharing a run of ≥8 words with the erb layer 1 (marked **[shared run]**).

### ca02 (host Fatima Begum) — D225: layer 1 carries UK GDPR duty wording (option A placeholder)

Layer 0:
> To a real attacker, the second action you asked the recruiter to take is a foothold on an HR machine full of candidate records, and from there a way into the candidate database and the recruitment mailbox. The habit you just practised, giving any attachment that demands a second action a second look, is what breaks that chain, because the file is never run.

Layer 1 (erb):  // D225 pending
> When an application like this is opened, the file runs on the HR machine and it goes out of action while it is rebuilt, and **HR spend the afternoon re-contacting candidates by hand**. Because CVs are personal data, the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; candidates are told where the risk to them is high. Before you leave, have a word with Fatima.

Layer 1 (fragment `AW/e2/defend.json`, no "you", no pointer):  // D225 pending
> When an application like this is opened, the file runs on the HR machine and it goes out of action while it is rebuilt, and **HR spend the afternoon re-contacting candidates by hand**. Because CVs are personal data, the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; candidates are told where the risk to them is high.

### ca03 (host Darren Price) — D225: layer 1 carries special-category UK GDPR duty wording (option A)

Layer 0:
> To a real attacker, the approval you pressed for is a staff account at an insurer, one that reaches claimants' personal and financial records and lets the intruder hide behind mailbox rules. Number matching, the control you just practised, is what breaks that chain, because an idle tap on a prompt nobody started now goes nowhere.

Layer 1 (erb):  // D225 pending
> When a prompt like this is approved, **the account is taken, the claims mailbox is rebuilt** and the whole team loses the afternoon locked out during the clean-up. An insurer's accounts hold health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high. Before you leave, have a word with Darren.

Layer 1 (fragment `AW/e3/defend.json`):  // D225 pending
> When a prompt like this is approved, **the account is taken, the claims mailbox is rebuilt** and the whole team loses the afternoon locked out during the clean-up. An insurer's accounts hold health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high.

### ca04 (host Thandiwe Moyo) — not D225 (payment; money as description, no duty claim)

New panel heading: "What the hurry was buying".

Layer 0:
> To a real attacker, the urgent request you sent in the partner's name is one authorised payment to an account they control, often followed by a lookalike supplier bank-change to keep the money coming. The call-back on a number you already hold, the habit you just practised, is what breaks that chain, because the payment is checked with the partner before it leaves.

Layer 1 (erb):
> When a payment goes out on a voicemail that sounds like the partner, a few thousand pounds leaves for an account that is not the supplier's, **the real supplier later chases the money it is owed**, and the PA and finance spend the afternoon reconstructing what happened. Before you leave, have a word with Thandiwe.

Layer 1 (fragment `AW/e4/defend.json`):
> When a payment goes out on a voicemail that sounds like the partner, a few thousand pounds leaves for an account that is not the supplier's, and **the real supplier later chases the money it is owed** while the PA and finance spend the afternoon reconstructing what happened.

### ca05 (host Niamh Doherty) — D225: layer 1 carries special-category UK GDPR duty wording (option A)

New panel heading: "What the address bar settles".

Layer 0:
> To a real attacker, the password you captured on the lookalike page is the member of staff's real account, one that reaches claimant data and makes a base for mailbox rules and phishing sent from the inside. Reading the address bar, the check you just practised, is what breaks that chain, because the password is never typed into the copy.

Layer 1 (erb):  // D225 pending
> When a password is typed into a lookalike page, **the real account is taken, and IT spend the day** on a forced reset, a mailbox-rule review and a check of which claimant records were reached. A claims account holds health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high. Before you leave, have a word with Niamh.

Layer 1 (fragment `AW/e5/defend.json`):  // D225 pending
> When a password is typed into a lookalike page, **the real account is taken, and IT spend the day** on a forced reset, a mailbox-rule review and a check of which claimant records were reached. A claims account holds health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high.

## Host blocks (voiced)

Each is spliced into the host hub's `- else:` branch, above the existing `episode_<id>_defend_complete`
branch, gated `{ kit_defend_done && not kit_<ep>_host_said: … ~ kit_<ep>_host_said = true - else: <existing> }`.
Three-way on `kit_key_caught` then `kit_caught`; CATCH and PARTIAL share beat 2 (the habit), MISS has its
own two beats. Beat 1 (MISS) carries the attacker's side in attacker terms (D4); beat 2 is the human/habit
side. VARs added per shell: `kit_defend_done`, `kit_caught`, `kit_key_caught`, `kit_ca0<n>_host_said`.

| id | file | speaker | voice | line | kind | v/w | branch |
|---|---|---|---|---|---|---|---|
| ca02-H1c | ca02_cv_lures/ink/fatima_begum.ink hub | Fatima Begum | Vindemiatrix | You spotted the one that wanted a second click to open, so nothing ran and the inbox is clean. | host | voiced | CATCH |
| ca02-H1p | " | Fatima Begum | Vindemiatrix | You stopped the one that wanted enabling, so nothing ran. A couple of the others are worth another look, and the debrief goes through them. | host | voiced | PARTIAL |
| ca02-H1m | " | Fatima Begum | Vindemiatrix | That application was opened and the file ran, so the attacker had a foothold on a machine full of candidate records before anyone noticed. | host | voiced | MISS |
| ca02-H2 | " | Fatima Begum | Vindemiatrix | A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag. | host | voiced | close |
| ca03-H1c | ca03_helpdesk_reset/ink/darren_price.ink hub | Darren Price | Orus | You reported the prompt nobody started, so the approval never came and the account stayed shut. | host | voiced | CATCH |
| ca03-H1p | " | Darren Price | Orus | You turned away the prompt that mattered, so the account held. One or two others slipped by, and the debrief walks you through them. | host | voiced | PARTIAL |
| ca03-H1m | " | Darren Price | Orus | That approval went through, so the attacker was inside a claims account, reading records and setting mailbox rules to stay hidden. | host | voiced | MISS |
| ca03-H2 | " | Darren Price | Orus | A prompt you didn't start is one to report, not approve. Number matching stops a careless tap cold. | host | voiced | close |
| ca04-H1c | ca04_exec_whaling/ink/thandiwe_moyo.ink hub | Thandiwe Moyo | Pulcherrima | You checked it before it moved, so the money stayed put and the account that email named got nothing. | host | voiced | CATCH |
| ca04-H1p | " | Thandiwe Moyo | Pulcherrima | You held the payment that mattered, so nothing left. A couple of the others are worth a second look in the debrief. | host | voiced | PARTIAL |
| ca04-H1m | " | Thandiwe Moyo | Pulcherrima | That payment went out on a voice that wasn't hers, straight to an account the attacker holds, with a bank-change lined up to keep it coming. | host | voiced | MISS |
| ca04-H2 | " | Thandiwe Moyo | Pulcherrima | A voice can be copied. Ring her back on a number you already hold before anything leaves the account. | host | voiced | close |
| ca05-H1c | ca05_signin_pages/ink/niamh_doherty.ink hub | Niamh Doherty | Leda | You read the address and didn't type your password into the copy, so there was nothing for the attacker to catch. | host | voiced | CATCH |
| ca05-H1p | " | Niamh Doherty | Leda | You kept your password off the fake page, so your account held. A couple of the others are worth another look in the debrief. | host | voiced | PARTIAL |
| ca05-H1m | " | Niamh Doherty | Leda | Your password went into the copy, so the attacker had your real account, the claimant data behind it and a seat to phish the rest of us from. | host | voiced | MISS |
| ca05-H2 | " | Niamh Doherty | Leda | Read the address bar before you type a password. A padlock doesn't make a page ours. | host | voiced | close |

Counts: host = 8 beats (2 per shell), clips = 16 (4 per shell: catch, partial, miss, close) — within 4.1
(8 host lines; clip estimate 5 max per shell). Layers 0/1 = written, 8 passages (erb + fragment per shell).

### Notes against the writing rules (2l, P1–P13)
- No layer repeats another: layer 0 carries the attacker's follow-through; layer 1 the cost; host beat 1 the outcome (MISS in attacker terms), beat 2 the habit. No money figure is repeated between a layer and a host line (only ca04 layer 1 states "a few thousand pounds"; no host line repeats it).
- Nobody blamed; no line says who let the incident in.
- MISS beat 1 is the attacker's side in attacker terms (D4).
- ca05-H2 and the existing (mutually exclusive) `episode_complete` line share the refrain "Read the address bar…"; kept identical on purpose (refrain). ca02-H2 varied from the existing line to avoid a near-identical echo.
- npc-dialog-review (opus48) verdict: pending (Sonnet-pass check). Blockers 0 expected.

## D225 placeholders (report)
ca02, ca03, ca05 layer 1 carry the option-A UK GDPR duty wording as a placeholder (marked `// D225 pending`
above). ca04 is a payment shell, not on the hold list, so its layer 1 has no duty claim. When O1 (D225) is
answered, revisit the three marked passages (both erb and fragment copies).

## H1 Sonnet-pass applied state (2026-11-20)

- **Applied:** ca05 `conceptPanel` (new, heading "What the address bar settles"); host blocks in all four
  host inks (ca02 `fatima_begum`, ca03 `darren_price`, ca04 `thandiwe_moyo`, ca05 `niamh_doherty`) with kit
  VARs and the three-way `kit_key_caught`/`kit_caught` branch, `.ink`+`.json` recompiled; fragment layer-1
  `conceptPanel` in `e2`–`e5/defend.json` (e2/e4/e5 added, e3 replaced its old teaching panel). Fragment
  headings are cost-framed in the e1 model's style ("If one gets opened/approved/paid", "If a password goes
  in"); the lines file fixed the fragment *text*, not the heading.
- **D9 (ca04/ca05):** confirmed neither shell has an existing `conceptPanel` or debrief prose to replace
  (debrief is `mondayCard`+`noBlameLine`), so the one-sentence timing pay-for is moot for both; D9 defers to
  the human timing runs. ca04's panel is new (no voicePanel conflict — voicePanel stays separate).
- **Checks (0 errors):** `bin/inklecate` clean on all four host inks; `validate_scenario.rb --strict-social
  --no-graph` = 0 errors on all four (the only warnings are the expected `kit_defend_done`/`kit_caught`/
  `kit_key_caught` "read but never set" — I's splice/office_kit sets them); `dialoguelint.mjs` clean;
  `test_office_kit` 74 OK; JS social/validator-social/office-kit suites pass in isolation (one combined-run
  flake, "Unable to deserialize cloned data", is a worker/serialisation artefact — the file passes alone).
- **proof5:** runs against `git archive HEAD`, so it ignores working-tree edits; its 17 diffs are stale
  generated twin/defend outputs already in HEAD (ca00=P-X0; ca02–05=the earlier H1 commit; ca06–11=P-H2;
  ca14–20=P-H3; plus P-TW/P-SBM/P-KT), awaiting I's integration regen+commit. Not a regression.
- **FLAG for P-GEN/I — e2 twin panel not sourced from `strings`:** `gen_e2_e4_shells.py panels()` rebuilds
  e2's `conceptPanel` from the top-level `_conceptPanel` (hardcoded lead `"Why 'enable content' matters. "`),
  overriding `strings.conceptPanel`. So the e2 **twin** (ca02_cv_lures_defend) will carry the *old* macro
  teaching text (with the un-cut sentence, no living-office layer 1), and the layer-1 parity test would fail
  on it once I regenerates. e3/e5 copy `strings` straight through and e4's `panels()` only adds `voicePanel`,
  so those three twins pick up the new fragment panel correctly. Resolving e2 means either P-GEN changing
  `panels()` to read `strings.conceptPanel` like the others, or updating e2's `_conceptPanel` contract — both
  outside P-H1 (generator code is P-GEN's). The fragment `strings.conceptPanel` for e2 is written as drafted.
