# Pre/post check: difficulty-parity audit

Scope: the 24 check shells `scenarios/awareness_{pre,post}_{general,finance,hr,helpdesk,executive,mobile}_{ab,ba}`,
i.e. six roles times forms A and B, each shell a 10-item triage set scored by `05`'s `awareness`
profile. Review only; nothing was changed.

## Method and what is already settled

- Each role has two forms, A and B. The AB pair shows form A pre and form B post; the BA pair shows
  B pre and A post, so a single learner sees both forms, one before the episodes and one after.
- The twelve `pre_*_{ab,ba}` shells carry the two forms (`*_form_a` in `_ab`, `*_form_b` in `_ba`).
  The twelve `post_*` shells reuse the same form content byte-for-byte; the only field that differs
  is `social.triageSets[0].stage` (`pre` -> `post`), which is correct. So form content is defined
  once per form and this audit of the twelve pre shells covers all 24.
- Confirmed in earlier cycles and re-confirmed here: within each role, A and B match on item count
  (10), phish count (4, or 5 for executive) and the full flag multiset. Scoring is per item, not
  positional (60 verdict + 40 flags; reporting genuine mail is never penalised).
- Every scored id is a real entry in the `00` factor/channel library (`00_data_contract.md` §2).

The forms are, item for item, carefully built mirrors of each other: same sender archetype, same
tell set, near-matched body length, parallel per-flag feedback. The lure *content* differs between A
and B (Benefits vs Training, Pennine vs Castell), so a learner cannot answer form B by remembering a
specific message from form A. That part is done well. The problems below are about *structure* and a
handful of *row-level* difficulty gaps.

## Severity counts

- **Blocker: 1** (B1)
- **Major: 3** (M1, M2, M3)
- **Minor: 9** (m1–m9)

## Three roles with the worst imbalance

1. **Executive** — two offsetting plausibility gaps on its two hardest item types (M1 pos 4, M2 pos
   8); the BEC and link-lure rows are not equally hard in A and B.
2. **Finance** — a trope gap on the CEO/BEC row (m3 pos 4), a temptation gap on the link row (m4 pos
   8), plus a named sender who is the fraudster in one form and genuine in the other (m7).
3. **General** — a sharpness gap on the BEC row (m1 pos 4), a reading-load gap at pos 9 (m2), and
   scored tells beyond what the general episode teaches (part of M3).

Helpdesk, HR and mobile are the tightest pairs; their only real exposure is the blocker below.

---

## BLOCKER

### B1 — A and B share one fixed item order and one per-slot flag signature, in all six roles

Files (the `messages` array of each set):
`scenarios/awareness_pre_general_{ab,ba}/scenario.json.erb:81`,
`…_finance_*:82`, `…_hr_*:84`, `…_helpdesk_*:84`, `…_executive_*:84`, `…_mobile_*:84`
(and the identical `post_*` copies).

Both forms in a role are the same template filled with different content. The phish sit in the **same
ordinal slots** in A and B, and each slot carries the **same flag signature** in both forms:

| role | phish slots (A and B) | slot-3/early lure | slot-4 lure | slot-6 lure | slot-8 lure |
|------|----------------------|-------------------|-------------|-------------|-------------|
| general  | 3, 4, 6, 8 | lookalike page (`lookalike_domain`,`padlock_myth`) | BEC/authority (`senderTrust`,`secrecy_or_bypass`,`urgencyCalibrated`) | colleague-lookalike data ask (`senderTrust`,`lookalike_domain`) | link mismatch (`linkCredible`) |
| finance  | 3, 4, 6, 8 | changed-bank (`senderTrust`,`lookalike_domain`,`changed_bank_details`) | CEO/BEC | supplier-lookalike data ask | link mismatch |
| hr       | 2, 4, 6, 8 | enable-content CV (`enable_content_prompt`,`addressedTo`) | authority/secrecy | colleague-lookalike data ask | missing-attachment+lookalike CV |
| helpdesk | 2, 4, 5, 7 | vishing call (`vish_callback_pressure`,`borrowed_authority`) | exec email (`senderTrust`,`secrecy_or_bypass`,`urgencyCalibrated`) | unrequested push | lookalike data ask |
| executive| 3, 4, 5, 6, 8 | changed-bank | BEC | cloned-voice VM (`vish_callback_pressure`,`secrecy_or_bypass`) | colleague-lookalike data ask | link mismatch |
| mobile   | 2, 4, 6, 7 | quishing QR (`unexpected_qr`,`lookalike_domain`) | BEC | colleague-lookalike data ask | smishing (`smish_shortlink_urgency`,`reply_stop_trick`) |

The genuine items sit in the same slots too, and each genuine slot keeps its type across forms (e.g.
general slots 2 and 7 are always a benign autofilled login page; mobile slots 1/5/9 are always a
saved-contact SMS).

Why this defeats the measurement, not just the cosmetics: a learner who takes form A in the pre-check
can answer form B in the post-check from position and shape alone — "the fourth item is the
urgent-secret-from-the-boss one, report it and tick sender/secrecy/urgency; the sixth is the
colleague-on-a-look-alike-domain data request." The lure wording is new, but the **answer pattern is
identical**, so post scores rise from pattern memory independent of any learning. The product's only
quantitative claim is the pre->post change on matched parallel items (design `11` §5.2, "What we can
claim"); this confound systematically inflates that change for every learner (and in both the AB and
BA pairs). The design's own calibration note (§5.2 "forms are written to be equal in difficulty")
addresses per-item hardness but not positional/structural leakage.

Fix (keeps the forms parallel): permute the `messages` array of one form in each role independently of
the other, so the phish land in different ordinal slots and no slot carries the same flag signature in
both forms. Scoring is per item, so a pure re-order changes no counts, no flag multiset and no
difficulty — it only breaks the positional/shape pattern. Do it for all six roles. Ideally also vary
*which* genuine item type sits in each early slot so "slots 1–2 are always safe" stops holding. A
stronger, later option is the seeded draw from a larger bank already noted as R4 in §5.2; the
re-order is the minimum that makes the current fixed forms defensible.

---

## MAJOR

### M1 — Executive pos 4: gift-card trope (A) vs plausible consultant fee (B)

`scenarios/awareness_pre_executive_ab/scenario.json.erb:177` (`ea_gift_cards`, "Quick favour before
11, keep it quiet") vs `…_ba/scenario.json.erb:177` (`eb_consultant_fee`, "Pay this today, between
us").

Same flag set (`senderTrust`,`secrecy_or_bypass`,`urgencyCalibrated`), but very different hardness.
Form A asks the PA to "buy eight £100 gift cards … send me the codes" — the single most-publicised
BEC trope, which many learners now spot on sight. Form B asks to pay a named £6,750 "heritage
consultant for the Brackenmoor scheme" — a payment that resembles the PA's real work and hides no
cartoon tell. Form B pos 4 is materially harder and more tempting to comply with than form A pos 4,
so the BEC row is not equally hard between the forms.

Fix: bring the two to the same register. Either make A a plausible payment ("hold a venue deposit",
"pay a late supplier") with no gift cards, or make both the gift-card/voucher pattern. Keep the same
three flags and a similar length.

### M2 — Executive pos 8: embedded speaker portal (A) vs generic parcel-fee smish (B)

`…_executive_ab/scenario.json.erb:302` (`ea_speaker_portal`, confirm a speaker's passport/travel on a
sign-in portal) vs `…_ba/scenario.json.erb:302` (`eb_courier_fee`, "Parcel held: customs fee due …
£2.95 pay here").

Same flag (`linkCredible`), opposite hardness, and the gap runs the *other* way from M1. Form A is a
lure embedded in the firm's real events work (a speaker portal for a summit) — role-plausible and
subtle. Form B is the stock consumer parcel/customs-fee scam, widely recognised and barely plausible
in a corporate PA's inbox. So within executive, A is harder at pos 4 but easier at pos 8, and B the
reverse. The two gaps partly offset at the whole-form mean (which is why earlier count-based checks
passed), but the per-item comparison the design promises ("matched … difficulty mix", §5.2) does not
hold, and a per-slot or per-factor read of the data would be biased.

Fix: match the register of the two link rows. Give B a role-plausible link lure (e.g. an events or
travel supplier "document to confirm" that mirrors A), or make both the generic-courier style. Resolve
M1 and M2 together so executive's two hard rows end up equally hard.

### M3 — The pos-4 BEC item scores tells the general/HR/mobile episodes don't teach

`general` `ga_manager_signin`/`gb_it_code` (`…_general_ab:173`, `…_ba:173`);
`hr` `…_ab:194` / `…_ba:193`; `mobile` `ma_colin_personal_number`/`mb_fatima_vouchers`
(`…_mobile_ab:146`, `…_ba:146`). Also finance pos 8 link item, below (m4).

Every role's check carries a pos-4 authority/secrecy item flagged `secrecy_or_bypass` and
`urgencyCalibrated`. Those are taught and surfaced by E1 (finance), E3 (helpdesk) and E4 (executive)
— their "red flags surfaced" lists name secrecy/authority (design `11` §3, rows E1/E3/E4). They are
**not** in the surfaced-flag list for E5 (general: "domain mismatch, subtle misspelling, padlock myth,
session-expired prompt, password manager not auto-filling"), E2 (hr) or E6 (mobile). So a general,
HR or mobile learner is scored on a channel tell (`secrecy_or_bypass`) and on `urgencyCalibrated` that
their episode never surfaces, which weakens the attribution of any pre->post change to the training.
This is identical in A and B, so it is not an A-vs-B parity break; it is a "scored knowledge the
matching episode doesn't give" problem (explicitly in scope for this audit).

Caveat / assumption: `00` §2 line 312 says "`05` teaches the seven factors and the channel tells",
which could be read as the engine surfacing every channel tell generically. If the intended design is
that each role sees only its episode's surfaced flags, this is a real gap; if the check is meant to be
a broad all-staff inbox regardless of episode, then the fix is instead to the design text, not the
shells. Flag for the author to settle.

Fix (whichever the author intends): either (a) add a one-line concept beat on "someone asks you to
keep it quiet or skip the normal process" to E5/E2/E6 so the scored tell is taught, or (b) drop
`secrecy_or_bypass`/`urgencyCalibrated` from the pos-4 item's scored `flags` in the general/HR/mobile
checks (leaving `senderTrust`, which E2/E5 both cover via the seven factors) so nothing scored is
untaught. Keep A and B in step whichever way it goes.

---

## MINOR

### m1 — General pos 4: "send me your sign-in" (A) vs "reply with the authenticator code in 10 minutes" (B)
`…_general_ab:173` vs `…_ba:173`. Same flags. B impersonates IT with a technical MFA pretext and a
sharper deadline ("10 minutes or your account will be locked") than A's "before 4", so B reads as
slightly more urgent and more authoritative. Small. Trim B's urgency or lift A's to match.

### m2 — General pos 9: genuine item has a link in A, no link in B
`ga_staff_survey` carries a genuine link (`survey.quayholt.example`); its form-B counterpart
`gb_payslip_notice` deliberately has none ("this email has no link on purpose"). So form A asks the
learner to evaluate one more genuine link (pos 5 and pos 9) than form B (pos 5 only). Evaluating a
genuine link adds reading load and a false-positive chance, so A's genuine side is marginally harder.
Fix: give B's pos 9 a correct genuine link too, or drop A's.

### m3 — Finance pos 4: CEO wire transfer (A) vs voucher scam (B)
`fa_ceo_transfer` ("£24,750 to a new supplier before 11") vs `fb_fd_vouchers` ("ten £100 shopping
vouchers … petty cash"). Both are textbook, but the voucher ask is the more recognisable trope, so B
is a touch easier. Minor; align the register if M1 is being reworked anyway.

### m4 — Finance pos 8: doc-share invoice (A) vs "bank payment held, sign in to release" (B)
`fa_invoice_share:300` vs `fb_bank_portal:301`. Same `linkCredible` flag. B invokes the business bank
and an urgent "release your held payment", which is more alarming and more tempting to click than A's
quiet document share. Also, like the general/HR/mobile note in M3, the `linkCredible` link lure is not
in E1's own defend set or attack beat (E1 is "no payload, no link", design §3 row E1), so finance
learners are scored on a link row their episode doesn't rehearse. Align the two link rows' pull, and
settle the coverage question with M3.

### m5 — Helpdesk pos 4: "turn off my sign-in step" (A) vs "reset my password and send it here" (B)
`ha_ceo_mfa_bypass` vs `hb_coo_reset_bypass`. Same flags. B's ask ("send the new one to this address")
is more nakedly wrong and easier to refuse than A's softer "turn off the extra sign-in step". Small
visibility gap; soften B or sharpen A.

### m6 — Mobile pos 4: vague channel-switch favour (A) vs voucher scam (B)
`ma_colin_personal_number` ("text me on my personal number … keep it between us", no concrete bad ask
stated) vs `mb_fatima_vouchers` ("buy six £50 vouchers on your card … text the codes"). B states the
fraudulent ask outright (the voucher trope); A is vaguer and arguably subtler. Minor; match the
directness.

### m7 — A named sender is the fraudster in one form and genuine in the other
Finance: "Ravinder Sandhu" is the impersonated CEO in form A pos 4 (`ravinder.sandhu.ceo@inboxly…`)
but a genuine CEO in form B pos 7 (`…_finance_ba:274`, `ravinder.sandhu@brightwellfoods.example`).
General: "Darren Price" is genuine in form A pos 1 and both impersonated (pos 4) and genuine (pos 10)
in form B. A learner who takes A then B (or B then A) may carry over "that name is the fraudster" and
mis-rate the genuine item. Score impact is cushioned — reporting genuine mail scores the same 60 as
trusting it and the 40 flag points still apply — so this nudges `reportRate` rather than `percent`.
Minor, but worth removing: use a different genuine sender name in the other form, or keep each name on
one side of the line within a role.

### m8 — Autofill is a perfect genuine/phish predictor on the page items
General pages: autofill `filled` on both genuine login pages (`:120`, `:282`), `none` on the phish
page (`:150`); the same holds in form B. "Password manager filled it in" therefore classifies every
page item correctly without reading the address. This is a real defence that E5 teaches, so it is not
wrong, but it makes the page rows low-discrimination and equally easy in both forms. Consider one page
item where autofill is absent for a benign reason (a genuinely new device) or present on a look-alike
the manager was tricked into saving, so the cue is not a free pass. Equal across A and B, so parity is
not harmed; noted for discrimination.

### m9 — Cross-form reuse of a caller name and extension (helpdesk)
"Ayaan Warsame" on ext. 4415 is the genuine printer caller in form A pos 10 and the genuine
voicemail in form B pos 8; ext. 4415 also appears in form A pos 10 and form B pos 8. Both uses are
benign, so the risk is only mild priming for a learner who sees both forms. Minor; vary the name or
number on one side.

---

## Things checked that are fine

- Item count, phish count and full flag multiset match within every role (re-confirmed).
- All scored ids are real `00` §2 library tells; no invented or mislabelled flags.
- Per-flag feedback (`perFlagNote`) and genuine-item rationales (`whyFine`) are present and parallel,
  item for item, in both forms.
- Body lengths are closely matched slot by slot (no systematic reading-load skew beyond m2).
- Channel-tell coverage is correct for finance (E1), helpdesk (E3) and executive (E4): every scored
  channel tell in those checks is surfaced by the matching episode.
- The post shells are exact copies of the matching form with only `stage` changed, so pre and post
  measure the same instrument.
