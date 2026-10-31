# Wave 1 build: design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (no repo file changed but this one). Kind of game:
the awareness product "Incident Simulations: Critical Cases", short education-first episodes for
non-technical staff on the neutral `general` skin. No VMs, no combat, no runtime language model.

Three pieces under review:

1. the `general_v2` check pair (fragment, generator, four shells; spec `10_CHECK_FORMS.md`);
2. the WP-15 swaps in E3 and E6 (`e3_call_remote_access`, `e6_chat_new_number`, the Monday cards;
   spec `12_WP15_CORE02_ITEMS.md`, facts against `core_02/concepts.md`);
3. the core_17 annual edition (fragment, wiring notes, generator, one shell; spec
   `11_WP12_FIRST_PLAY_AND_ANNUAL.md` Part B, module `core_17/concepts.md`).

Method: the `scenario-design-review` skill adapted to the awareness product, read against
`awareness/DESIGN_REVIEW_C1.md`, `awareness/CHECK_PARITY_AUDIT.md` and `README_scenario_design.md`
"Awareness episodes". Each in-scope shell was run through
`bundle exec ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph --skip-ink`. No
browser run, so timing and the one engine-render finding are read, not seen.

## Counts

| Part | Blocker | Major | Minor | Total |
|---|---:|---:|---:|---:|
| 1. `general_v2` | 0 | 1 | 3 | 4 |
| 2. WP-15 swaps | 0 | 0 | 2 | 2 |
| 3. core_17 annual | 0 | 0 | 3 | 3 |
| **All** | **0** | **1** | **8** | **9** |

Validator: all nine in-scope shells print `✓ Validation complete!` with no `❌ INVALID`. The only
warnings are recommended-field notes (`timedConversation` absent, which is right for a kiosk mission;
a phone-NPC `avatar` absent on E3) and, on the E6 full shell, the pre-existing
`phish_mobile_staff_landed` unread-outcome-global warning, which is the full-episode attack-scoring
issue (`DESIGN_REVIEW_C1` B1) and not a WP-15 change.

## What works

Across all three pieces:

- **The forms are parallel and the baseline is untouched.** `general_v2` form A and form B match item
  for item on kind, phish-or-genuine, the scored-flag multiset and the stated difficulty mix; the
  `_formPairing` table (`checks_v2/general_v2.json:16-30`) is honest about it. The `PERMUTE` arrays
  (`gen_checks_v2_shells.py:74-77`) put the phish at disjoint ordinal slots (A at 1,3,5,7; B at
  2,4,6,8), checked by hand against the audit's step-2 rule, so a learner cannot answer B from A's
  answer pattern. None of the six built role forms is touched.
- **Pair balance holds.** Each `general_v2` form carries one pass-but-bad phish (item 8, SPF/DKIM/DMARC
  all pass) and one fail-but-fine genuine item (item 5, DKIM fail), with `perFlagNote`/`whyFine` that
  teach "a passing or failing check is a clue, not a verdict" in plain words (`general_v2.json:137,
  194, 340, 397`). The page and push cards carry their own `subject`, so the duplicate-message
  signature does not collide between forms.
- **Facts match the module.** The WP-15 items carry 7726, 159 and Report Fraud exactly as
  `core_02/concepts.md` "At home" states them (free, spells SPAM, provider blocks; hang up and call
  159 for a bank call; reportfraud.police.uk / 0300 123 2040, Police Scotland 101 in Scotland). No
  "Action Fraud" survives (retired 4 December 2025). The new-number, remote-access and "never read out
  a code" lessons all trace to named concept sections.
- **The swaps keep each episode to one lesson and its item count.** E6 stays at six items
  (`e6_fuel_card_offer` out, `e6_chat_new_number` in); E3 stays at one push plus three calls
  (`e3_call_on_behalf` out, `e3_call_remote_access` in). The one lesson is unchanged (E3: ring back on
  the number on file; E6: open the app yourself, a new number is a new account), so the swaps do not
  grow the time budget.
- **The annual edition reuses measured items verbatim.** All eight `annual_2027_mixed` ids exist in
  their source fragments, the scored `truth`/`flags`/`perFlagNote` are copied unchanged, and the shell
  carries the same eight ids as the fragment. Three genuine items are kept, so the run is not a
  "gotcha festival". The reshaped E3 calls carry their facts in the visible transcript (not only in the
  dropped `claims` array), so the perFlagNote's "his name, team, manager and staff number were all
  right" is something the learner can see.
- **No-blame register is right throughout.** The WP-15 report replies and both Monday cards, and the
  annual `noBlameLine`, describe consequences and routes without judging the reader.

## Part 1: the `general_v2` check pair

### Major

**P1-M1. Item 8 scores a header-only tell (`reply_to_differs`) that no episode teaches, reopening
C2-M6.** `needs-user`. Form A `gva_free_converter` (`checks_v2/general_v2.json:189`) and form B
`gvb_usb_courier` (`:392`) both score `["senderTrust", "reply_to_differs"]`, and the same flags are in
all four shells. `reply_to_differs` can only be found by opening the collapsed header panel: the body
and visible From line do not show it. The built role forms deliberately stopped scoring
`senderAuth`/`reply_to_differs` under C2-M6 ("0 scored `senderAuth`/`reply_to_differs` remain in any
form", `DESIGN_LOG.md:93`), because every episode defend round runs `headerPanel: "off"` and so never
teaches a learner to open a header. That still holds for the episodes `general_v2` is paired with:
E8's defend round is `headerPanel: "off"` (`e8/defend.json:20`), as are E1 to E7. So the pre-to-post
change on item 8's second flag cannot be credited to any episode, which is the attribution problem
C2-M6 was raised to close, and which `BUILD_LOG.md:38` queued for this review.

What limits the damage: the verdict (Report) and the first flag (`senderTrust`) are both reachable
from the visible From address (an outside inbox at `larchmail.example` / `itrollout-support.example`,
not `quayholt.example`), so the item still discriminates on the verdict, and both forms carry the tell
identically, so A-versus-B parity and the untouched baseline are not harmed. The cost is the 20 of 40
reason points on item 8 that rest on an untaught skill, in both the pre and the post form.

Fix (the user's call, because it mirrors the C2-M6 contract decision): either drop `reply_to_differs`
from item 8 in both forms and leave the hard tell on the visible `senderTrust` (make item 8 "hard"
some other visible way, e.g. an internal-looking display name over a plainly external address), which
brings `general_v2` into line with C2-M6; or keep it and record in the fragment that `general_v2`
deliberately diverges, on the grounds that the check's own panel is `collapsed` (openable) even though
the episodes' is off. The spec itself mandates the current flags (`10_CHECK_FORMS.md:391`), so the
decision belongs with whoever owns that spec line.

### Minor

**P1-m1. The pre-check title "(part two)" points at a part one the learner never sees named.**
`local`. Both forms are titled "Everyday threats check (part two)" (`general_v2.json:35, 238`; set in
the generator at `gen_checks_v2_shells.py:260`), and the AB pre-check (form A at stage pre) shows that
title as the first thing a learner meets, before any episode. The built "part one" is the `general`
role form, whose title is "Inbox and sign-in check" (`awareness_pre_general_ab/scenario.json.erb:68`),
so nothing the learner sees is labelled "part one". The parenthetical is a dangling reference. The
baseline form cannot be renamed (it is frozen), so the clean local fix is to drop "(part two)" and
title this "Everyday threats check", or to confirm the sequencing is an organiser-facing label only.

**P1-m2. The look-alike domain on the page card may be unreadable in the inbox list row.** `engine`.
Item 2's phish host is `quayho1t-check.example`, a digit 1 for the letter l (`general_v2.json:69`), and
the whole tell (`lookalike_domain`) rests on the learner seeing that swap. In the shared triage list,
a `page` card's address prints in the pixel font rather than the address font, where 1 and l are hard
to tell apart, so the swap can be invisible until the card is opened. The page card itself shows the
URL, and the `perFlagNote` says "read the address slowly", so the item is not unfair, but the list
preview undercuts the tell. Confirm in a playtest; if it reads badly, render page-card list rows in the
address font (an inbox-triage engine change, so it needs the user).

**P1-m3. "Marcus" names two unrelated impostors across the product.** `local`. `general_v2` form A
item 8 uses impostor "Marcus Webb" (`general_v2.json:181`), and E3's new WP-15 call uses impostor
"Marcus Hale" (`e3/defend.json:545`). Both are fraudsters, so there is no fraudster-here-genuine-there
clash, but a learner who does E3 and the `general_v2` check in one session meets two different "Marcus"
scammers. The `general_v2` `_brandAdditions` note (`general_v2.json:6`) did not flag the collision. Low
stakes; rename one (for example give the `general_v2` impostor a different first name) to keep the cast
distinct.

## Part 2: the WP-15 swaps in E3 and E6

Both swaps are faithful to the spec and the module. `e6_chat_new_number` (`e6/defend.json:157-172`)
scores `["secrecy_or_bypass", "urgencyCalibrated"]` and correctly avoids `senderTrust` (refused on a
non-email kind); `secrecy_or_bypass` is added to the set's `channelTells` in both the fragment and the
full erb (`e6/defend.json:50`), and the SMS validates under `--strict-social`. `e6_chat_new_number`
impersonates Dermot Lynch, who is a sender in neither form, so no name is a fraudster here and genuine
in a form. `e3_call_remote_access` (`e3/defend.json:543-561`) is a `call` scoring
`["vish_callback_pressure", "borrowed_authority"]`, both already enabled on the E3 set, with
`verifyVerdict: true` so the ring-back verdict is offered; `claims` is `[]` and the "it's your IT
manager / window closes at ten" pressure is in the transcript. The E6 Monday card (`e6/defend.json:573`)
carries 7726, 159, Report Fraud and the new-number line; the E3 Monday card (`e3/defend.json:574`)
carries Report Fraud (Police Scotland 101) and the remote-software line, with the work route first.
7726 and 159 are left out of the E3 card, which is right: the spec anchors the scam-text and bank-call
routes to the E6 text items, and only Report Fraud to E3. `e6_parcel_fee`'s report reply gained the
7726/159 "and at home" line (`e6/defend.json:67`). Timing is count-neutral, so both episodes hold at
their budget (E6 about 16 minutes, E3 about 17), which a playtest should still confirm.

### Minor

**P2-m1. `reply_stop_trick` is left enabled in E6 with no item scoring it.** `local`. The swap removed
`e6_fuel_card_offer`, the only item in `e6_phone_messages` that scored `reply_stop_trick`, but the tell
is still listed in the set's `channelTells` (`e6/defend.json:50`), so it stays a chip on all six cards
with nothing behind it. This is the deliberate move noted in the spec (the reply-STOP lesson now lives
in the mobile forms), and an unused chip costs no marks, but it adds a chip a non-technical learner has
to read past on every card (`DESIGN_REVIEW_C1` m23). Drop `reply_stop_trick` from the set's
`channelTells` in the fragment and the erb, unless a later E6 item is meant to score it.

**P2-m2. The Marcus collision (see P1-m3).** `local`. Logged once under Part 1; it spans the E3 WP-15
call and the `general_v2` form.

## Part 3: the core_17 annual edition

The eight-item mixed set is a sensible annual refresher: five phish and three genuine across email,
call, voicemail, SMS, push and a sign-in page, from three companies, with one mirror pair (impostor
Gordon before real Gordon), run through the built defender at `feedbackMode: "immediate"`,
`verifyVerdict: true`, `headerPanel: "off"` (`annual/defend.json:28-30`). It validates with no new
engine packet, within the `EPISODE_MESSAGES` 4-to-8 cap, and the shell carries the same eight ids as
the fragment, the `episode_core_17_annual_2027_defend_defend_done` prefix and the host `eventMappings`
that conclude `check_annual_edition` (`scenarios/awareness_core_17_annual_2027_defend/
scenario.json.erb:442-445`). The generator takes a required output folder with no default into
`scenarios/`, so it is safe by construction.

The reshaped E3 calls are faithful on everything scored: `tells` map to `truth.flags`, the
`perFlagNote`, `ifTrusted` and `reportReply` are copied word for word, and the facts the notes rely on
are in the transcript. The "what changed this year" brief (`annual/defend.json:245`) quotes the three
2027 headline changes verbatim from `core_17/concepts.md:66-70` ("Scams switch channels", "A voice
isn't proof", "Your login is the prize"), each with the habit. The dating is sensible: Edition 2027,
drafted "from what was published by October 2026" per the module, built now (2026-10-29) for the year
ahead.

### Minor

**P3-m1. The reshape silently relabels the impostor's speech from "Caller" to "Gordon".** `local`. In
the E3 source the impostor call's transcript lines are spoken by `"Caller"` (`e3/defend.json`, the
`e3_call_gordon_impostor` transcript), while the genuine call's are spoken by `"Gordon"`. The annual
reshape sets both to `"Gordon"` (`annual/defend.json:120-122` and `:141-143`). Nothing scored changes,
and making the mirror pair use the same speaker tag arguably tightens it (the source labelling could
itself leak which call is which), so this is defensible. But the `_about` note claims each item is kept
"exactly as in its source fragment" and the `reshape` note lists what it changes without mentioning the
speaker tag (`annual/defend.json:2, 17`). Either restore `"Caller"` for the impostor, or add the tag
change to the reshape note so the claim of a verbatim copy is accurate.

**P3-m2. Item 6 (`e5_sso_lookalike`) gives no visible anchor for Quayholt's real sign-in address.**
`needs-user`. The page phish sits at `quayholt-sso.example` (`annual/defend.json:162`), and the rule
it is judged against ("Quayholt's sign-in page is sso.quayholt.example") appears only in its own
end-of-run `perFlagNote`. This is the inherited `DESIGN_REVIEW_C1` M6 concern: a page card has no To
line to compare, and the annual, unlike the E5 episode, has no OSINT or set brief naming the real
address. The `autofill: "none"` cue is present and the item is reused verbatim by design (so the
measurement matches the year), which argues against editing the item. If the user wants the item to be
winnable on sight, add one line to the annual set brief ("Quayholt's own sites end in
`quayholt.example`, such as `sso.quayholt.example`"); otherwise accept it as an inherited item and fix
it, if at all, in E5 (out of scope here).

**P3-m3. The brief calls the three headlines "things that changed this year".** `local`. The brief
opens "three things that changed this year" (`annual/defend.json:245`), but the three are evergreen
habits (switch-channel checking, a voice is not proof, your login is the prize); what changed is the
threat picture behind them (the 2025/2026 survey figures in `core_17/concepts.md:60-64`). The module
does call them "headline changes for the 2027 brief", so this is within sanction, but "three things
worth knowing this year" or "three things to carry into this year" would be truer to what the lines
are. Cosmetic.

## Verdicts

- **Part 1 (`general_v2`): ship after the user settles P1-M1.** The pair is well-matched, balanced and
  validated, and the baseline is untouched. The one open question is whether item 8 should keep a
  scored header-only tell (`reply_to_differs`) when no episode teaches header reading, which reopens
  the C2-M6 contract decision and so belongs to the user. The three minors are small and local.
- **Part 2 (WP-15 swaps): ship.** Faithful to the spec and `core_02`, facts correct, one lesson each,
  count-neutral. The two minors are tidy-ups (an unused chip, a shared first name), not blockers.
- **Part 3 (core_17 annual): ship.** A coherent eight-item refresher, faithful verbatim reuse, an
  accurate and sensibly dated brief, validated with no new engine work. The three minors are a
  documentation accuracy point, an inherited E5 item, and a wording nicety.

## C1 outcomes (content fixer, 2026-10-29)

Applied against the orchestrator's rulings. Validator re-run on every changed shell
(`--strict-social --no-graph --skip-ink`): all print `✓ Validation complete!` with only the
`timedConversation` recommended-field note. Balance lint re-run on a scratch pair (both forms,
`pairedWith` kept, no `awarenessEpisode`): no `balance`/pass-but-bad/fail-but-fine/same-message error.
`node --test social-awareness-fragment-erb-parity + social-awareness-rule-of-thumb`: 11/11 pass. E6
full playtest (`ONLY=e6-full run-suite.sh` on keyless :3001): bridge-e6-full 15/15 PASS.

| Finding | Outcome | Note |
|---|---|---|
| P1-M1 (item 8 scores header-only `reply_to_differs`) | **Fixed** | Dropped `reply_to_differs` from item 8 in both forms (`gva_free_converter`, `gvb_usb_courier`), following the built forms' C2-M6 decision. Item 8 now scores `senderTrust` only, keeping the pass-but-bad shape. The reply-to lesson moved into each item's `headerNote` as a "you could also see" line. `reply_to_differs` removed from both forms' `channelTells` (nothing else scored it). A/B flag multisets stay equal (6 scored flags each); balance lint clean. Divergence from `10_CHECK_FORMS.md:391` recorded there with a dated note. |
| P1-m1 ("(part two)" dangles) | **Fixed** | Retitled to "Everyday threats check" in the fragment (both forms) and in `gen_checks_v2_shells.py` (the mission display name), so no check shell refers to an unnamed part one. |
| P1-m2 (look-alike `1`/`l` in page-card list row) | **Deferred** | Engine/render finding (page-card list rows in the pixel font); out of content scope. |
| P1-m3 / P2-m2 (two unrelated "Marcus" impostors) | **Fixed** | Renamed `general_v2` form A row 8 impostor Marcus Webb to **Wesley Tan** (British-Chinese, 30s), grep-clean across `scenarios planning_notes docs`; address `wesley.tan@larchmail.example`, reply-to `w.tan.docs@hastypost.example`. E3's Marcus Hale kept. `_brandAdditions` note and `BRAND_SET.md` Marcus entry updated. |
| P2-m1 / WP-15 (unused `reply_stop_trick` chip in E6) | **Fixed** | Removed `reply_stop_trick` from `e6_phone_messages.channelTells` only, in the fragment (`e6/defend.json`) and the full erb. No remaining item in that set scores it (checked fragment + erb). The mobile forms (`mobile_form_a`/`_b`), which do score it, are untouched. |
| P3-m1 (impostor speech relabelled "Caller"→"Gordon") | **Fixed** | Restored `"who": "Caller"` on the annual item 4 impostor-call transcript lines, so the reuse is verbatim against the E3 source (`e3_call_gordon_impostor`); the genuine item 5 keeps `"Gordon"`. |
| P3-m2 (E5 `e5_sso_lookalike` no visible real-address anchor) | **Withdrawn (out of scope)** | Inherited E5 C1-M6 on a built item; per the ruling, left to E5. |
| P3-m3 ("things that changed this year") | **Fixed** | Reworded the brief's framing line to "three things worth knowing this year"; the three dated 2027 headlines are kept verbatim. |
