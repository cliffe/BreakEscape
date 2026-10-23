# Awareness dialogue review — formal cycle 2

Fresh reviewer, review-only (`npc-dialog-review` skill). No files changed, nothing committed.

Scope: all 38 `scenarios/awareness_*` shells and their source (the four generators and the
`e{1..7}/defend.json` + `attack.json` fragments). Covered the host ink, the episode strings
(brief, flip, debrief, defendOnly, Monday card, conclusions), the triage copy (per-flag notes,
`whyFine`, `reportReply`, `ifTrusted`), the E3 call scripts, the SMS/QR/push cards and the E4/E7
voicemail transcripts. Read first: `DIALOG_REVIEW_C1_A.md`, `DIALOG_REVIEW_C1_B.md`, `DIALOG_LOG.md`,
design `11`.

Audience: office staff, short training session. Judged for plain language, warm non-blaming tone, the
30-word host-line cap, cross-episode repetition, and wrong teaching.

## Severity counts

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 4 |
| Trivial (housekeeping) | 1 |

The episodes are in good shape. The cycle-1 fixes all hold, the data jobs are internally consistent,
and the engine's "list only missed items" debrief is well accommodated by the D7 rewrite. The four
minors are cross-episode repetition (two) and small wording/precision points (two); none breaks play or
teaches anything wrong.

## Where each fix must land (so a regenerate keeps it)

Confirmed by regenerating all four generators into scratch and diffing against the repo: **no drift,
every generated `scenario.json.erb` and `.ink` is byte-identical.** So the generators and fragments are
the source of truth.

- **Episode `strings` (noBlameLine, defendOnly, brief, etc.) and triage copy** for a **defend-only or
  check shell** live in the fragment `e{n}/defend.json`; the generator's `defend_only()`/`check()` copy
  them in. Fix the fragment, then re-run the generator.
- **The same strings for a full episode** (`awareness_e{1..7}_*`) are hand-mirrored into the shipped
  `scenario.json.erb` and are **not** rebuilt by any generator's `main()`. Fix must be applied to the
  full erb by hand **as well as** the fragment, or the two variants diverge (the DIALOG_LOG convention).
- **Generated host ink** is in `gen_*.py` string tuples; **full-episode host ink** is hand-authored.

## Phase 1 — compile / lint / validate (clean)

- **Compile:** all seven full-episode ink files compile, `Failed: 0`. The only `-> END` warning is the
  legitimate call hang-up in `leila_servicedesk.ink`.
- **dialoguelint across all 38 shells:** `Totals by rule: none`. No `line-len`, `choice-len`,
  `phone-self-prefix`, `not-x-but-y`, `exit-no-reply`, `blank-reentry`, `choice-fallthrough`,
  `tag-on-narrator` or `stage-cue` findings. The C1 host-line length fixes hold; the longest host line
  (`darren_price.ink`) sits at exactly the 30-word cap.
- **Hub structure:** generated host inks use the m03 `hub_quiet` pattern with one unconditional sticky
  `+` exit tagged `#exit_conversation`; no starved knots.
- **No banned AI-tell vocabulary** in the episode copy (grep for delve/intricate/pivotal/robust/etc.: none).

## Cycle-1 fixes — all confirmed holding

| C1 finding | Status in C2 |
|---|---|
| MAJOR-1 Leila self-prefix (14 lines) + L51 choice | Fixed: `leila_servicedesk.ink` phone channel, no `phone-self-prefix`, choices ≤15 words. |
| MAJOR-2 eight host lines over 30 words | Fixed: all host lines ≤30 (lint clean). |
| MINOR-1 E4 boarding-payment tell stands alone | Fixed: `senderTrust` now "A payment request from the managing partner on a free webmail inbox…". |
| MINOR-3 E2/E4 lookalike wording overstated | Fixed: E2/E4 now "makes a separate domain anyone can register, so don't assume it's theirs". |
| MINOR-4 E1 flip seam | Fixed: flip lands on "the payments team at Brightwell". |
| MINOR-5 E3/E4 double instruction | Fixed: `defendIntro` trimmed to a scene-setter. |
| MINOR-6 E4 negative-parallelism | Fixed: "A miss here is about the pressure you were under." |

## Data jobs and the engine debrief change — confirmed, with two carry-over repetitions

- **Engine "list only missed items" (ac8ec1b56):** the only debrief-structural string is `defendOnly`,
  and the D7 rewrite reads correctly against it ("Any you were caught out by are shown below…"). No
  authored string still claims every item is shown. `whyFine` on a genuine item reads correctly as a
  "here's why this one was safe" card when the learner mishandled it. No wording broken by the change.
- **E3 trimmed to 4 items (3 calls + 1 push):** brief, host ink and `defendIntro` all say "three calls"
  consistently; the labels and guarded blanks are present on the calls. Internally consistent.
- **E4 flip wording / address contradiction (job 3):** the free-webmail framing is consistent across the
  `senderTrust` perFlagNote and the attack. Good.
- The D7 rewrite re-introduced a verbatim cross-episode repeat — see MINOR C2-2.

---

## Minor findings

### C2-1 — `noBlameLine` opens with the identical sentence in four episodes
`e1/defend.json:891`, `e5/defend.json:620`, `e6/defend.json:564`, `e7/defend.json:160` (and the mirrored
full erbs `awareness_e1_invoice_fraud:305`, `_e5_signin_pages:334`, `_e6_texts_and_qr:322`,
`_e7_voice_ceo:314`).

All four open:
> "Nobody is marked down for a miss here. …"

C1 MINOR-2 asked for this opener to be varied per role; the C1 fix varied E2/E3/E4 but left E1, E5, E6
and E7 on the shared first line. A learner stacking the general/mobile/voice cluster (E5 → E6 → E7)
reads the same opening sentence three debriefs running. The rest of each `noBlameLine` already varies
well; only the opener repeats.

**Proposed:** keep E1 as the canonical and vary the opener in E5/E6/E7, drawing on each role's texture,
e.g.
- E5 (pages): "A miss here is no reflection on you. …"
- E6 (mobile): "There's no mark against you for a miss here. …" *(or phone-specific)*
- E7 (voice): "Nothing here counts against you. …" *(note: this reuses E3's opener; prefer a fresh one
  such as "No one's keeping score against you here.")*

**Fix location:** fragment `e{5,6,7}/defend.json` `strings.noBlameLine` (regen for the `_defend` shells)
**and** the mirrored full erbs. E1 can stay as the canonical.

### C2-2 — `defendOnly` is word-for-word identical in E1 and E6 (and near-identical in E5)
`e6/defend.json:566` and `e1/defend.json:893` (full erbs `awareness_e6_texts_and_qr:324`,
`awareness_e1_invoice_fraud:307`); `e5/defend.json:622` is one word off.

E1 and E6 are verbatim:
> "These messages were written by people whose job is to make them look right, and anyone can be caught
> by one. Any you were caught out by are shown below, with what gave each one away."

E5 differs only by "messages were written" → "pages were made". This is the same anti-pattern C1 MINOR-2
flagged for the old E1≡E2 pair; the D7 rewrite closed E1/E2 but re-created an E1≡E6 identity. (The
closing sentence "Any you were caught out by are shown below, with what gave each one away." is shared
verbatim by E1, E2, E3, E5, E6 — that half is largely functional, pointing at the debrief cards, and is
acceptable; the finding is the identical **opener** in E1/E6, which has its own role texture to lean on.)

**Proposed (E6, mobile):**
> "These landed on a phone between jobs, and they were built to read like Tarrowby's own messages, so
> anyone can be caught by one. Any you were caught out by are shown below, with what gave each one away."

**Fix location:** fragment `e6/defend.json:566` (regen for `e6_texts_and_qr_defend`) **and** full erb
`awareness_e6_texts_and_qr/scenario.json.erb:324`. Consider giving E5 its own opener too while here.

### C2-3 — E6 canteen-QR note calls a subdomain "the name of the page" (teaching precision)
`e6/defend.json:124` (full erb `awareness_e6_texts_and_qr/scenario.json.erb:196`; defend-only shell
`awareness_e6_texts_and_qr_defend/scenario.json.erb:173`), message `e6_canteen_qr`, `whyFine.lookalike_domain`:
> "forms.tarrowby.example is a page on Tarrowby's real domain; the part before tarrowby.example is just
> the name of the page."

`forms.` is a subdomain / service, not a page name (a page would be a path, `/forms`). Framing "the part
before the domain" as a harmless "page name" risks reinforcing exactly the mental model the look-alike
items punish (`quayho1t`, `tarrowbey`, hyphen-words sit "before the domain" too). E5 teaches the same
idea correctly — `e5/defend.json` `e5_sso_real`: "The 'sso.' in front is one of Quayholt's own services,
just as 'hr.' or 'mail.' would be."

**Proposed:**
> "forms.tarrowby.example ends in tarrowby.example, Tarrowby's own domain. The 'forms.' in front is one
> of Tarrowby's own services, the same as 'mail.' or 'hr.' would be."

**Fix location:** fragment `e6/defend.json:124` (regen for the `_defend` shell) **and** full erb
`awareness_e6_texts_and_qr/scenario.json.erb:196`.

### C2-4 — E7 full brief says "the finance office" where the flip names "Tom" (consistency, low)
`e7/defend.json:155` (`strings.brief`, full) and the full erb `awareness_e7_voice_ceo/scenario.json.erb:308`;
cf. the flip at erb `:310`–`:311` ("Tom in the finance office"; "reached Tom at ten to five").

The E7 attack targets a named defender, Tom Reilly (the AP clerk, `e7/attack.json`), and the flip and
conclusion name him, but the full brief says only "you swap seats: you're covering the finance office's
phone and inbox." The triage-set brief (`e7/defend.json:20`, erb `:87`) frames the seat around a third
name, Adaeze Okafor (the approver). E1 and E4 name the defender's seat; naming Tom in the E7 full brief
would match the flip and tighten the swap. (The **defend-only** brief, `:166`, correctly stays generic:
it has no attack to establish Tom.)

**Proposed (full brief tail):** "…Then you swap seats: you're Tom Reilly in accounts payable, covering
the finance office's phone and inbox, with three voicemails and two emails waiting. Only the second part
is scored."

**Fix location:** `e7/defend.json:155` `strings.brief` and full erb
`awareness_e7_voice_ceo/scenario.json.erb:308`. Optional polish; lowest priority of the four.

---

## Trivial (housekeeping, not a dialogue change)

- **Stale E3 defend-only dungeon graph.** `scenarios/awareness_e3_helpdesk_reset_defend/dungeon_graph.html`
  and `.md` (both untracked `??`) still say "Four calls are waiting", from a pre-Cut-D validator run. The
  shipped `scenario_brief` correctly says "Three calls". These are auto-regenerated by the validator and
  are not learner-facing; a full `validate_scenario.rb` run (without `--no-graph`) will overwrite them.

## Notes for the fixer

- **Design `11` §3.2 is stale, not a finding:** the E3 row says "4 calls (2 impostor, 2 genuine) plus 1
  MFA push"; Cut D reduced E3 to 3 calls (2 impostor, 1 genuine) + 1 push. All learner-facing E3 copy is
  consistent at three calls. The single genuine call still makes "refuse everything" lose points (the
  taught action is `verify_callback`, which serves the genuine caller too). No dialogue change; flag for
  the design-doc owner if the doc is being kept current.
- **E5/E6 "someone else's site" wording** (`e5_mailbox_support`, `e6_parking_permit`) was explicitly
  endorsed by the C1 Part-B reviewer and is left as-is here; it is accurate in context (attacker-
  registered look-alikes). Not re-flagged.
- The E3 call scripts, the SMS/QR/push cards and the E4/E7 voicemail transcripts are concrete,
  internally consistent (amounts, names, numbers all line up across transcript, perFlagNote, reportReply
  and ifTrusted) and land the "verify on a number you already hold" lesson warmly. No findings there.
