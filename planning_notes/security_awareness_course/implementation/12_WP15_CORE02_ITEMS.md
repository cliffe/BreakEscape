# 12 WP-15: core_02 missing-channel defend items (E3 and E6)

## Goal

Add the social-engineering channels core_02 teaches that the built episodes do not yet cover:
**chat-app ("it's me, new number") approaches**, **remote-access / tech-support scams**, and the
**UK personal-scam reporting routes** (7726 for scam texts, 159 for bank calls, Report Fraud). They
go into the two beyond-email episode defend sets, not into the six role check forms.

## Read first

- `modules/core_02_social_engineering_beyond_email/concepts.md` (the source of truth for the facts
  and the levers: "The channels" (messaging-app impersonation, tech support scams),
  "The requests that should always make you pause" (remote access), and "At home" (7726, 159, Report
  Fraud)).
- `awareness/e3/defend.json` (the E3 fragment: the set `e3_service_desk_queue`, its call cards in
  `awarenessEpisode.defend.calls`, and the built call item shape `ha_call_facilities`).
- `awareness/e6/defend.json` (the E6 fragment: the set `e6_phone_messages` and the built SMS item
  shapes `e6_parcel_fee`, `e6_fuel_card_offer`, `ma_colin_personal_number`).
- `public/break_escape/js/minigames/inbox-triage/triage-kinds.js` and `triage-flags.js`: the card
  kinds (`sms`, `call`, ... there is **no `chat` kind**) and which tells each kind may be scored on
  (`KIND_TELL_EXCLUDE`).
- `awareness/HANDOVER.md` section 4 (fragments vs full erbs, the fragment-erb parity test, "never run
  a generator into the repo").
- `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` section 2 (the tell
  library; there is no dedicated "remote access" or "new number" tell).

## Owner model

`opus48` (awareness content).

## Where the items go

- **E3 fragment and its shells:** the episode set `e3_service_desk_queue` (in `awareness/e3/defend.json`),
  the full episode erb `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb`, and the generated
  defend-only shell `scenarios/awareness_e3_helpdesk_reset_defend/`. Gets the **remote-access scam**
  (a service-desk call) and the Report Fraud / home-routes teaching in its debrief.
- **E6 fragment and its shells:** the episode set `e6_phone_messages` (in `awareness/e6/defend.json`),
  the full episode erb `scenarios/awareness_e6_texts_and_qr/scenario.json.erb`, and the defend-only
  shell `scenarios/awareness_e6_texts_and_qr_defend/`. Gets the **chat-app approach** (an SMS card)
  and the 7726 / 159 teaching in its debrief.
- **Not the six role check forms.** `finance`, `hr`, `helpdesk`, `executive`, `general` and `mobile`
  stay exactly as they are (the measured baseline). If any of these channels belongs in a form, it
  goes in the new `general_v2` / `data_conduct` forms of `10_CHECK_FORMS.md`, never in the built six.

## Card kinds: no new engine work

- A **chat-app / messaging-app** approach is modelled as an **`sms` card** (a text from a number not
  in your contacts). The engine has no `chat` kind, and the lesson ("a new number is a new account,
  not the person") is the same. Do not invent a card kind. If the user wants a visually distinct
  WhatsApp-style card, that is a `02_ENGINE_WORK.md` addition (a new `chat` kind in
  `triage-kinds.js`); flag it, do not build it here.
- A **remote-access scam** is a **`call` card** in E3's service-desk queue (E3 is the voice channel).
- The UK **home reporting routes** are taught in the **debrief and the Monday card**, anchored to the
  scam-text items; they are not a separate card kind.

## Facts, checked against core_02 concepts.md (keep current)

From `core_02/concepts.md` "At home" and "One-time codes and remote access":

- **7726:** forward scam texts to 7726 (free; it spells SPAM on a keypad); the mobile provider can
  then investigate and block. Messaging apps (WhatsApp, iMessage, Signal) are **not** covered by
  7726: use the block-and-report option inside the app.
- **159:** for a call claiming to be your bank, hang up and call 159, which connects you to your own
  bank's fraud line; most UK banks take part.
- **Report Fraud:** report fraud and cyber crime to Report Fraud at reportfraud.police.uk or 0300 123
  2040 (England, Wales and Northern Ireland; in Scotland call Police Scotland on 101). **Report Fraud
  replaced Action Fraud on 4 December 2025** (core_00 and core_02 concepts; it is live as of today,
  2026-10-27). Do not write "Action Fraud".
- **Remote access:** genuine IT never cold-calls to install remote-control software or to read your
  screen; never read out a one-time code. If you already gave access, disconnect the device and
  report at once.

At work, use the organisation's reporting route (the `customer_report_route` slot); the home routes
are the "and at home" line.

## Item 1: the chat-app approach (E6, `e6_phone_messages`)

A messaging-app impersonation as an `sms` card, following the shape of `e6_parcel_fee` /
`ma_colin_personal_number` in `e6/defend.json`. Draft:

- `id`: `e6_chat_new_number`
- `kind`: `"sms"`
- `from`: `{ "address": "07700 900512 (not in your contacts)" }` (Ofcom drama range; bare number, no
  saved contact, matching the built fakes' convention in the E6 `_formPairing` note).
- `time`: a break-time slot.
- `body`: a "Hi, it's me" approach from a supposed colleague or manager on a new number, no link, an
  urgent secret favour: e.g. "Hi, it's Shauna, lost my old phone so this is my new number. Quick one
  before the 2pm run: can you sort something for me? Don't mention it to the others yet." (Use a
  Tarrowby name from `BRAND_SET.md` section 3 who is not spoofed elsewhere in the set; confirm against
  the E6 cast so no name is the fraudster here and genuine in a form.)
- `truth`:
  - `isPhish: true`
  - `flags: ["senderTrust", "secrecy_or_bypass"]` (both allowed on `sms`; `senderTrust` is not in the
    `sms` exclude list, and `secrecy_or_bypass` is the "urgent secret favour" lever). Optionally add
    `urgencyCalibrated`.
  - `perFlagNote.senderTrust`: a new number is a new account, not proof it is the person; her real
    number is already saved, so a text from an unknown number saying "it's me" is the warning sign,
    not the proof (core_02 "Why caller ID and a known number are not proof").
  - `perFlagNote.secrecy_or_bypass`: "don't mention it yet" and an urgent favour are the "Hi Mum / new
    number" lever (core_02 "Messaging-app impersonation").
  - `ifTrusted`: the favour that follows is usually gift cards, a payment or data, from someone who
    is not the colleague.
  - `reportReply`: confirms the real colleague is on her saved number and did not text; at work report
    it the organisation's way; at home, a messaging-app impersonation is blocked and reported inside
    the app (7726 does not cover chat apps), and a scam text goes to 7726.

No dedicated "new number / it's me" tell exists in the `00` library; `senderTrust` +
`secrecy_or_bypass` carry it. If the user wants a reusable `new_number_itsme` chip, that is a library
addition in `02_ENGINE_WORK.md`; not required here.

Source concept: core_02 "Messaging-app impersonation", "Why caller ID and a known number are not
proof".

## Item 2: the remote-access / tech-support scam (E3, `e3_service_desk_queue`)

A `call` card for the service-desk seat, following the built call shape `ha_call_facilities` in
`e3/defend.json` (`kind: "call"`, `callerId`, `from`, `time`, `transcript: [{who, text}]`, `truth: {
isPhish, flags, perFlagNote, ifTrusted, reportReply }`). Draft:

- `id`: `e3_call_remote_access`
- `kind`: `"call"`
- `callerId`: a supposed supplier/maintenance engineer calling from a mobile (an external vendor the
  desk might plausibly deal with; invented name, not a real brand).
- `transcript`: the caller says there is an urgent problem with a Quayholt server or a licence, and
  asks the agent to install a remote-support tool or approve a remote session now, steering off the
  callback ("no time to go through your supplier contact, I'm on site and the maintenance window
  closes at 10") and invoking someone senior ("your IT manager asked us to sort it directly").
- `truth`:
  - `isPhish: true`
  - `flags: ["vish_callback_pressure", "borrowed_authority"]` (both allowed on `call`, and the same
    pair the built impostor call `ha_call_facilities` scores). Optionally add `secrecy_or_bypass` if
    the caller asks to skip the ticket.
  - `perFlagNote.vish_callback_pressure`: he talks you off ringing the supplier back on the number on
    file ("on site", "window closes"); a callback on a number you already hold is the check.
  - `perFlagNote.borrowed_authority`: "your IT manager asked us" is there to push you past the check.
  - `ifTrusted`: installing the tool or approving the session hands the caller remote control of a
    Quayholt system; genuine support never needs a cold-call remote session (core_02 "Remote
    access", "The requests that should always make you pause").
  - `reportReply`: the supplier was rung back on the number on file and had made no such call; nothing
    was installed.

A dedicated "remote access request" tell is not in the `00` library; `vish_callback_pressure` +
`borrowed_authority` carry it, and the remote-access lever is taught in `perFlagNote` and `ifTrusted`.
A reusable `remote_access_request` chip is a possible library addition in `02_ENGINE_WORK.md`; not
required here.

Source concept: core_02 "Tech support scams", "Remote access", "The requests that should always make
you pause".

## Item 3: the UK personal-scam routes (teaching, not a new scored item)

Teach 7726 / 159 / Report Fraud in the **debrief**, anchored to the existing scam-text item
`e6_parcel_fee` (a parcel-fee smish is exactly the home-scam context) and, for Report Fraud, the E3
debrief:

- Extend `e6_parcel_fee`'s `reportReply` (or add a short debrief note) with the "and at home" line:
  forward scam texts to 7726 (free), hang up and call 159 for a call claiming to be your bank, and
  report fraud to Report Fraud; messaging-app scams are blocked and reported inside the app.
- Add the home routes to the E6 and E3 Monday cards' "and at home" clause, keeping the work route
  (the `customer_report_route` slot) first. Do not overload the Monday card; one short sentence.

Because these are the same facts as core_00 and core_02, keep the wording identical to
`core_02/concepts.md` "At home" and re-check the names and numbers before release (7726, 159, Report
Fraud, Police Scotland 101).

## Effect on timing, and which items to swap

Both episodes are at their time budget: E6 is about 16 minutes, E3 about 17. Keep the item counts
flat.

- **E6: swap, do not add.** The episode set `e6_phone_messages` has six items, two of them smishing
  (`e6_parcel_fee`, `e6_fuel_card_offer`). **Replace `e6_fuel_card_offer` with the chat-app item
  `e6_chat_new_number`.** The count stays six, so the timing does not grow, and the set gains a new
  lever (chat-app impersonation) in place of a second shortlink smish. `e6_fuel_card_offer`'s
  `reply_stop_trick` lesson is still taught in the mobile forms (`ma_phone_bill_failed`,
  `mb_parking_charge`), so nothing is lost from the measured content. Keep `e6_parcel_fee` (it
  carries the 7726 teaching). Note the bookkeeping: FuelWise then appears in no shipped item; either
  leave it as an unused brand or note it in `BRAND_SET.md`'s E6 additions.
- **E3: swap, do not add (recommended).** The set is one push plus three calls (impostor, real,
  on-behalf). **Replace the third call `e3_call_on_behalf` with `e3_call_remote_access`.** The count
  stays at three calls plus the push, so E3 holds at about 17 minutes. The on-behalf call's
  `borrowed_authority` + `secrecy_or_bypass` + `vish_callback_pressure` lesson overlaps the
  remote-access call's flags, so the teaching stays. If the user would rather keep the on-behalf call,
  the alternative is to **add** `e3_call_remote_access` as a fourth call and accept about +1.5
  minutes (E3 at about 18); say which the user prefers.

Both swaps keep the worked-item notes (e.g. E6's `e6_mfa_scan` `_worked` F=4) valid, because item
count does not change per-item scoring under the `awareness` profile.

## Effect on the parity test

- **Fragment-erb parity** (`test/js/social-awareness-fragment-erb-parity.test.mjs`): the hand-authored
  full episode erbs carry the episode defend set too, so any change to the set in the fragment must be
  made identically in the full erb (`scenarios/awareness_e3_helpdesk_reset/scenario.json.erb` and
  `scenarios/awareness_e6_texts_and_qr/scenario.json.erb`), or the intended difference must be added
  to the test's allow-list with a reason (HANDOVER.md section 4). Edit both; do not rely on the
  allow-list for a shared key.
- **Check-form A/B balance** (`scripts/validate_social/triage.rb balance`, `CHECK_PARITY_AUDIT.md`):
  unaffected. The role forms are not touched, and the episode defend sets are not A/B matched (E1 and
  E6's episode sets have no `pairedWith`), so there is no A/B multiset to keep balanced here.
- **Rule-of-thumb test:** unaffected as long as the Monday-card edit does not touch
  `social.awareness.ruleOfThumb`.

## Files to create or change

1. `awareness/e3/defend.json`: swap `e3_call_on_behalf` for `e3_call_remote_access` in
   `awarenessEpisode.defend.calls` (and update the `_calls` order note and the `_formPairing` note if
   it references the call); add the home-route line to the Monday card string.
2. `awareness/e6/defend.json`: replace `e6_fuel_card_offer` with `e6_chat_new_number` in
   `e6_phone_messages.messages`; extend `e6_parcel_fee`'s `reportReply`/debrief with the 7726/159
   line; add the home-route line to the Monday card string; update the `_order` and `_brandAdditions`
   notes.
3. `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb` and
   `scenarios/awareness_e6_texts_and_qr/scenario.json.erb`: make the identical change to the episode
   set so the fragment-erb parity test passes.
4. Regenerate the two defend-only shells (`awareness_e3_helpdesk_reset_defend`,
   `awareness_e6_texts_and_qr_defend`) with `gen_e3_e5_shells.py` and `gen_e6_e7_shells.py` **into a
   scratch folder**, confirm a no-change regen of everything else is byte-identical to HEAD, then copy
   in only the two changed defend-only shells (HANDOVER.md section 4). The check shells these
   generators also build must come out byte-identical (the forms are untouched).

## Acceptance checks

- `ruby scripts/validate_scenario.rb <each changed erb> --strict-social --no-graph --skip-ink`
  passes for the two full episodes and the two defend-only shells.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` stays green, including
  the fragment-erb parity test and the rule-of-thumb test.
- The scratch regen of all four E3/E5/E6/E7 generators is byte-identical to HEAD except for the two
  changed defend-only shells.
- Run the E3 and E6 full bridges (`tools/playtest/se/bridge-e3-full.jsonl`, `bridge-e6-full.jsonl`),
  one at a time on :3001, and confirm the new call and SMS items render and score, and the Verify /
  ring-back verdict is offered on the E3 call (E3's set has `verifyVerdict: true`).
- The chat-app `sms` card offers only the tells valid for `sms` (`triage-flags.js` `KIND_TELL_EXCLUDE`
  excludes `vish_callback_pressure`, `unexpected_qr`, etc. from SMS), and the two scored flags are
  among those offered.

## Do not

- Do not put any of these items in the six built role check forms.
- Do not invent a `chat` card kind or a new tell id; use `sms`/`call` and the `00` library flags. If
  a dedicated chip is wanted, point to `02_ENGINE_WORK.md`.
- Do not grow E6 past six items or E3 past its three calls plus push without the user's go-ahead on
  the timing cost (the swaps avoid this).
- Do not write "Action Fraud"; it is Report Fraud since 4 December 2025.
- Do not edit a shared episode-set key in only the fragment or only the erb; keep them identical.
- Do not run a generator into the repo.

## Stop and ask if

- The user wants the on-behalf call kept in E3 (then add `e3_call_remote_access` as a fourth call and
  accept ~18 minutes), or wants a true chat-app card kind (engine work), or wants the home routes as a
  scored item rather than debrief teaching.
- An E8 to E17 episode brief later assigns the remote-access or chat-app channel to a different
  episode or company; align to it.
