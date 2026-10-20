# 07 — Landing-page builder (credential-harvest, abstracted)

Status: plan, 2026-10-20. Last in the build order (most new UI, least reuse). Feeds the mail client
(`01`) a `link` payload; is judged by the `linkCredible` factor of the rules engine (`04`); its
output is reused by the triage defender (`05`) as "a bad page to inspect".

## 1. Purpose & audience

The player builds a fake sign-in page for a pretext, sees how convincing it is, then inspects their
own page as the victim and learns how to catch one. Maps to book Ch. 8 "Cloning a Landing Page".
All three audiences, tuned by data: the Cyber Security student lab goes deepest (every choice,
homograph card, unaided inspection); awareness learners get three choices and highlighted tells;
SAFETYNET: Eldritch Hacker uses it as one stage with a preset brand. What it teaches, in order: a page is
only as convincing as its domain, logo, wording, form and padlock together; a look-alike domain is
the one thing the attacker can never make perfect; and the defender's checklist (domain, padlock,
origin of the form, hover the link, don't sign in from a mailed link).

### Safety design (read first)

This component **models** a credential-harvesting page. It must never become one. The rules below
are part of the design, not polish, and a reviewer should treat any breach as a blocker.

- **No code authoring.** The player never types or edits HTML, CSS, JavaScript or a form handler.
  Every input is a choice from a list the scenario authored.
- **The "page" is a data record**, rendered from that record into inert elements inside the overlay (a
  pixel-art layer plus plain DOM text, section 6). It is not a document the browser can load, and it has
  no export, download, copy-as-HTML or "preview in new tab". The safety property is held by constraint,
  not by the choice of medium: the preview contains **no `<form>`, `<input>`, `<textarea>`, `<select>`,
  `<a href>`, `<button>`, `<iframe>`, `<script>` or `contenteditable`**, and no function serialises it.
  A test walks the preview's DOM after every step and fails on any of those (N3; it needs a DOM, which
  N3 supplies with `jsdom`).
- **No capture code exists anywhere.** When a victim "visits" or "submits", the game flips a
  boolean and prints a result line. No field value is ever read, stored, sent or logged, because
  there is none: the victim is a scenario record, not a person typing into a form.
- **No network.** Nothing in the component makes a request. Domains are strings in scenario JSON.
- **Fictional only.** Brands and domains are invented. Two controls enforce it, and this section says
  plainly where each runs and what it misses.
  - **Offline lint (N6).** A check in `scripts/validate_scenario.rb`, tested by a Node test that shells
    the validator over inline fixtures and over every `scenarios/*/scenario.json.erb`
    (`test/js/validator-landing-pages.test.mjs`, the same pattern as the existing `validator-*.test.mjs`
    files). **Nothing runs those tests automatically today**: `.github/workflows/ci.yml` runs only
    `bin/rails test`, no workflow, hook or `package.json` script runs `test/js/*.test.mjs`, and no Rails
    test calls the validator. N6 therefore includes the CI step (`00` S11): set up Node, `npm ci`, run
    `node --test test/js/validator-*.test.mjs`, then loop the validator over `scenarios/*/scenario.json.erb`.
    Until that step exists the lint guards nothing, so the claim "CI enforces this" is true only once
    N6 ships. The lint requires:
    - every authored `domain`, `browserDomain` and `realDomain` ends in the reserved, non-registrable
      suffix `.example`;
    - **ASCII, with one exception.** The validator renders the ERB and parses the JSON, and a parsed
      string cannot show whether its source was an escape or a raw character. So the lint checks both
      forms: a `browserDomain` and every `realDomain` must be plain ASCII; a `domain` may contain
      non-ASCII only if its option has `trick: "homograph"`, an ASCII `browserDomain` (the `xn--` form),
      and exactly one non-ASCII character that is in the confusable map; and for any such `domain` the
      **raw `.json.erb` text must not contain the parsed non-ASCII string**, only its `\u` escape. A
      homograph written as a raw character therefore fails;
    - **the brand check folds, then matches.** NFKC-normalise, map confusables (Cyrillic and Greek to
      Latin, `1`/`l`/`I`, `0`/`o`, `rn` to `m`, `vv` to `w`), strip hyphens and dots, then look for a
      denylisted real brand (PayPal, NatWest, Microsoft and the like);
    - **the allowlist is the primary control.** After folding, each label of a `domain` must either
      contain the brand's word (`accountingnow`), or be within edit distance 2 of it (`accountingnov`,
      `accountingnovv`), or appear in that brand's authored `decoyWords` list (`payroll-online`,
      `account-help`, `login`). This accepts every sample domain in section 5 and rejects a
      free-standing real brand, because a real brand is neither the fictional brand word nor on the
      authored decoy list. The denylist is the backstop. The denylist and confusable map live in the
      validator, not in a scenario, so one scenario cannot quietly shorten them; `decoyWords` are
      authored, are checked against the denylist like any label, and are reviewed by hand.
  - **What the offline lint does not do.** It does not run when a scenario loads. `validate_scenario.rb`
    is a command-line tool with no caller in `app/`, `lib/` or the browser, and the server sends the
    scenario's `social` block to the client unvalidated (`game.rb`, `filtered_scenario_for_bootstrap`
    strips only room contents, `flags` and `targetFlags`). It protects the repository from an author's
    mistake. It does not stop a hand-edited scenario served from elsewhere. It also misses a real brand
    that is neither on the denylist nor in its confusable map, and it does not read concept-card prose,
    which is exempt on purpose (below) and reviewed by hand.
  - **Runtime guard (N6b, engine work).** `landing-page-model.js` refuses to score or draw any domain
    that is not on the page's authored menu or does not end `.example`, and draws a "blocked" placeholder
    instead. This is a suffix and membership check only. It cannot judge brands, which is why the offline
    lint carries that part.
  - Real services appear only in a plain-text concept card as a typographic example (`paypa1` against
    `paypal`). The checks above read the domain and brand menu, not concept-card prose.
- **No operational how-to.** The game says that look-alike domains, homographs and cheap
  certificates exist and shows what they look like. It does not say where or how to register,
  host, obtain a certificate for, or mail one.
- **Attacker-first, defender-closing.** The builder always ends in the defender inspection step
  (section 3, step 6). A player cannot finish a page without being shown how to catch it.
- **No tradecraft beyond the lesson.** What a real page does after capturing a password (for
  example forwarding the victim on to the genuine site so nothing seems wrong) is taught only on
  the defender concept card, as "why you may not notice". It is not a builder option.

## 2. Player goal in their own words

"Make a sign-in page this person will trust, then see what gives it away."

## 3. The loop

One overlay in house style (README Conventions): a dark panel with square corners, colours from the
`--ui-*` tokens in `css/ui-themes.css` so the mission's `ui_theme` applies, `GNF` body and `Press Start
2P` headings for chrome. Nothing is hard-coded green. A **step strip** across the top shows
`Pretext · Build · Score · Send · Inspect`. The left half is the **page preview**, a tiny fake browser
(address bar, secure-connection icon, page body). The right half is the **choice panel** for the current
step. A **Pretext card** stays pinned at the top of the panel.

The preview has two layers (section 6). Pixel art (logos, banners, frame icons, product pictures) is drawn
low-res and scaled with `image-rendering: pixelated`. All text, including the address bar, the page's
visible wording, field labels, the concept cards, the domain chips and every feedback line, is inert DOM
text in Atkinson Hyperlegible (`00` §6).
Text is never drawn into the low-res canvas, because at that size the differences the lesson depends on
(`rn` against `m`, `vv` against `w`, `l` against `1`) disappear.

### Step 1. Pretext
The pinned card is **built from what the player holds, not from the scenario's answer.** It lists the text
of the held facts that bear on this page (here `lord_portal`: "Sofia uses a staff payroll portal"; after the
call, also `lord_portal_name`, which says what the portal is called and how its notices read, and
`lord_payslip_date`). If nothing relevant is held, the card says "You haven't found out what Sofia would
expect to see yet" and offers a **Case file** button (the nested-launch convention in section 6). The
`pretext` block in the data is the scorer's key and is never shown as UI text. All options in step 2 are
always listed, so the card gives the player the evidence and the player makes the call: a player holding
only `lord_portal` still has to infer that the company's own brand and a payslip purpose are the likely
fit, and a player who has had the call is certain rather than guessing. A "Concept: why the page must
match the story" card is one click away. No choices yet. Button: Build.

### Step 2. Build (seven choices, any order, preview updates live)
Each choice is a row of chips. The preview redraws on every change. Choosing never blocks; the
player can change anything until they press Score.

1. **Brand** — which service to imitate. Several fictional brands are offered; only one matches
   the pretext.
2. **Page purpose** — "Sign in", "Password expired", "Payslip ready". One fits the story.
3. **Domain** — a short list of addresses (chips set in Atkinson Hyperlegible, so `rn` and `m` or `vv`
   and `w` can be told apart), each tagged with its trick (real, typo, extra word,
   hidden-in-subdomain, look-alike letters, unrelated). The real domain is listed but locked:
   "You don't own this. Only the company does." That lock is the point of the lesson.
4. **Logo** — "Crisp official", "Blurry copy", "Stretched copy", "No logo".
5. **Wording** — three short page-copy variants: matches the pretext's tone, generic, or one
   with spelling and grammar slips.
6. **Form fields** — tick which fields the page asks for (email, password, one-time code, card
   number, national insurance number). The real service asks for a known set.
7. **Padlock** — "Show a secure padlock" on or off. A note says: *a padlock only means the
   connection is encrypted to whoever owns that domain. It says nothing about who that is.* The fake
   browser frame is generic (it does not copy any one browser), and strings call the icon "padlock" or
   "secure-connection icon" because browsers have changed how they draw it. Confirm the wording against
   current browsers before it ships (OQ5).

A **Tell counter** (optional, on for early teaching) shows how many giveaways the current page has,
without naming them. Each chip has a one-line teaching note, shown on hover and behind a visible "?"
button, since hover does not exist on touch.

### Step 3. Score
Press Score. The game shows the **credibility meter** (0 to 100), the target's threshold as a line
on it, and the per-factor checklist (section 4). Verdict line is one of three strings (section 4).
If below the line the player can edit and re-score. No attempt limit, no dead end. Each Score writes the
page record (section 5) with `built: false`, so the choices survive a close.

### Step 4. Send
After Score, the button is **Attach to email** once the score meets the threshold and every gate passes,
and **Attach anyway** below the line (same control, relabelled, so a player can experiment). Either way
the page record is marked `built: true`, the kit item `kit_payroll_page` resolves to it, and
`landing_payroll_login_built` and `landing_payroll_login_domain` are set (section 5). The overlay closes.
If the builder was opened from the mail client's Attach menu, the mail client reopens with its draft
restored and the link attached (S12, section 6); if it was opened from a workstation, the player carries
on to the mail client themselves. The mail client (`01`) fills `message.linkInfo` from `linkInfoFor`
(section 4) and the rules engine (`04`) judges `linkCredible`. A below-threshold page therefore fails
`linkCredible` and the target's in-character reply says why. Nothing is blocked. Closing the overlay
without attaching keeps the draft choices and is a normal exit (section 6), not a failure.

### Step 5. The outcome report
When the email has landed and the target "clicks", the mail client calls back into this component
for the result line (the capture is **simulated**):

> `Sofia Lord opened your link.` / `Sofia Lord signed in on your page. (Simulated: no
> credentials were collected.)` / `Sofia Lord closed the tab at the address bar.`

The result is a record `{ visited: bool, submitted: bool, noticed: bool }` and a count line for the
scenario's metrics report (book Ch. 9): `Visits 1 · Submissions 1 · Reports 0`. The rule is deterministic,
with no randomness: when the email has landed, `visited` is true; if the page's `meetsThreshold` is true,
`submitted` is true and `noticed` false; otherwise `submitted` is false and `noticed` true (she closed the
tab at the address bar). The mail client calls `describeVictimOutcome` once on the landed flip and stores
the record in the page record's `victim` field (`00` §11a).

### Step 6. Inspect your own page (the defender flip)
The player reopens the saved page from the workstation as the **victim's browser** (the Inspect button
appears once the page record has `victim.visited: true`, that is, once an email carrying the page's link
has landed) and is asked: "Find the giveaways."
The player selects parts of the page (address bar, padlock, logo, form, wording). Each part is a focusable
element inside the preview (a `div` with `role="button"` and `tabindex="0"`, not a form control), so the
step works by keyboard, by touch and through the playtest bridge. Each correct pick confirms a tell and
shows its defender string (section 4); wrong picks say what was fine. The link tell has a **Show the link
target** button in the choice panel (not inside the preview, which holds no `<button>`), because hovering
does not exist on touch. The step ends when every tell the page has is
found, or the player taps **Show me**. A closing card
lists the **five habits** that beat this attack:

1. Read the address up to the first single `/`, then find the ending: `.com`, or a country ending like `.co.uk`. The real site is the single name immediately before that ending (`accountingnow.example`, or `natwest.co.uk` for a UK site). Everything to the left (`login.`, `secure.`, an extra word) is just labels the owner can set to anything.
2. Don't trust the padlock to mean "safe". It means "private to whoever owns this address".
3. Hover over a link before clicking and compare it with where the message says it goes.
4. Don't sign in from a mailed link. Open the service from a bookmark or type it yourself.
5. Report it. A password manager that refuses to fill the form is a free warning; believe it.

## 4. The rules and scoring

Deterministic and visible. The model is a pure function,
`scorePage(spec, pretext, target) → { credibility, factors[], gates[], tells[], verdict }`, with no
randomness and no free text to interpret. That removes the usual failure modes of loosely judged labs: there is
no loose substring matching (nothing is typed), no rejection that fails to say why (every factor
returns a string), and no victim that rejects everything (the target's threshold is authored and
reachable from the choices on screen).

### Factors and points (total 100)

| Factor | Points | Rule |
|--------|--------|------|
| `brand` | 15 | Matches the pretext's service: 15. Otherwise 0 **and a gate fails** (below). |
| `purpose` | 10 | Matches what the email promised: 10. Plain "Sign in": 5. Anything else: 0. |
| `domain` | 35 | By the option's authored `tier`: tier 3 = 35, tier 2 = 22, tier 1 = 10, tier 0 = 0. |
| `logo` | 10 | Crisp: 10. Blurry or stretched: 4. None: 0. |
| `wording` | 10 | Matches the pretext's tone: 10. Generic: 5. With slips: 0. |
| `form` | 10 | Exactly the real service's fields: 10. A real field missing: 4. Any extra sensitive field (card number, national insurance number): 0. |
| `padlock` | 10 | Shown: 10. Not shown: 0. |

Domain tiers are authored per brand (section 5), not inferred, so a reviewer can read them. The
real domain has no tier: it is locked.

| Trick | Example (fictional brand AccountingNow, real address `accountingnow.example`) | Tier | Why it gets that tier |
|-------|-----|------|-----|
| Unrelated | `payroll-online.example` | 0 | Nothing like the real name |
| Wrong letter | `accountingnov.example` (`nov` for `now`) | 1 | One letter off; obvious once read |
| Extra word | `accountingnow-hr.example` | 2 | Real name present; a skimmer sees it |
| Real name as a subdomain | `login.accountingnow.account-help.example` | 2 | Fools a skim; fails a careful read |
| Looks-like letters (typo-squat) | `accountingnovv.example` (`vv` for `w`) | 3 | Needs a second look in a small font |
| Same-looking letter from another alphabet (homograph) | `accountingn` + U+043E + `w.example` (written as the escape `\u043E` in the data) | 3 | Identical to the eye where the text is shown as typed (a mail client, a chat message); student lab only |

**How a homograph is shown.** Current browsers do not display a Latin label with one Cyrillic letter in it
as typed. They show the coded form, here `xn--accountingnw-fgk.example`. The face the game ships
(Atkinson Hyperlegible, a Latin subset, `00` §6) has no Cyrillic letter, and the contract is that the lab
draws the coded form, so **every text surface shows the `browserDomain`**: the chip, the address bar, the
checklist and the tells lines, tagged "look-alike letters". The option still carries both strings in the
data: `domain` (with the `\u043E` escape) is the scoring identity and the lint input, and `browserDomain`
is what the player reads. The scoring tier models the as-typed form, where the eye cannot tell; the
concept card shows that form as a pixel-art illustration (an image, not text, so no font is needed) and
says a browser defends against this, a mail or chat app may not, which is why the fourth habit (don't
sign in from a link) matters more than good eyesight. No raw look-alike character appears in this doc
or in the sample data.

Concept card text for the two top tiers, shown behind the "?" button and on the defender card (plain
language, no instruction): *"A typo-squat is a name one keystroke or one look-alike pair away from
the real one, such as `paypa1` for `paypal`, or `rn` for `m`. A homograph swaps a letter for a
different-alphabet letter that looks the same, so even a careful eye cannot tell. Browsers
sometimes show these in a coded form (`xn--...`) for that reason. The defence is not better
eyesight. It is not signing in from a link."* Address and domain strings, including any `xn--` label,
render raw through `textContent`, never through `displayDashes`, which would rewrite a double hyphen
(`utils/display-dashes.js`).

### Gates (checked after the points)

A page can reach the threshold on points and still fail a gate. A failed gate does not replace the
band verdict; its line is shown underneath it (see the verdict table below and the worked example).
Gates are authored per target:

- **Brand gate.** `brand` must pass. Added gate line: *"Sofia doesn't use that service. She
  wouldn't open it."*
- **Careful-reader gate.** `domain.tier` must be at least the target's `minDomainTier`. Added gate
  line: *"Sofia reads addresses carefully. This one isn't close enough."*

### Output to the rules engine (`04`)

The builder returns `credibility` (0 to 100) and `gates[]`. `evaluateMessage` is pure and reads no
globals, so the number reaches it through the message (`00` §11a). `landing-page-model.js` exports

```
linkInfoFor(record, targetId) → { kitId, pageId, domainId, domain, credibility, gatesPassed, meetsThreshold }
                              | { kitId, state: "missing" }      // no record, or record.built is false
```

where `meetsThreshold = credibility >= targets[targetId].linkThreshold && gatesPassed`. The mail client
resolves `kit_payroll_page` to the record in `se_landing_pages` and sets `message.linkInfo` to this
result. The `linkCredible` factor (`04`) passes when `linkInfo.meetsThreshold` is true and fails with
"there's no page behind that link" when the state is `missing`; the `linkCredible` tell is present when
`linkInfo.domain` differs from the target's `expectedLink.realDomain` (`04`), whether or not the page
convinced. `04` owns the factor, this document owns the number and the function. `04`'s two feedback
strings for `linkCredible` stay the authoritative reply and red-flag text; the per-factor lines below are
shown in addition, in the builder only.

### Exact feedback strings

Verdict line (one band verdict shown; a failed gate adds its line underneath, it does not replace
the band). The only placeholders in any string are `{firstName}`, `{shown}` and `{real}`; `{shown}` and
`{real}` hold authored domains and render in Atkinson Hyperlegible like every other feedback line:

| Condition | String |
|-----------|--------|
| credibility < 40 | `That wouldn't fool anyone.` |
| 40 ≤ credibility < threshold | `Some people would fall for it. Not {firstName}.` |
| credibility ≥ threshold, gates pass | `Convincing enough for {firstName}.` |

Per-factor checklist lines (✓ full, ~ partial, ✗ fail). The second string is the **red-flag
phrasing** the defender (`05`) reuses, so attack and defence cannot disagree about what a tell is.

| Factor and result | Builder line | Defender red-flag line |
|---|---|---|
| `brand` ✓ | ✓ Brand: this is the service {firstName} actually uses. | — |
| `brand` ✗ | ✗ Brand: {firstName} doesn't use that service. | The page names a service you do not use. |
| `purpose` ✓ | ✓ Page: a payslip notice is what the email promised. | — |
| `purpose` ~ | ~ Page: a plain sign-in is believable but isn't what the email promised. | The email promised one thing and the page asks for another. |
| `purpose` ✗ | ✗ Page: this isn't what the email said would be here. | The page does not match the message that sent you to it. |
| `domain` tier 3 ✓ | ✓ Address: very close to the real one. You would need to look twice. | The address is `{shown}`, not `{real}`. Compare every letter. |
| `domain` tier 2 ~ | ~ Address: close, but the extra part gives it away to anyone who reads it. | The address is `{shown}`, not `{real}`. Read it from the right. |
| `domain` tier 1 ~ | ~ Address: one letter is wrong. A careful reader will spot it. | The address is `{shown}`, not `{real}`. One letter is wrong. |
| `domain` tier 0 ✗ | ✗ Address: nothing like the real service. | The address has no connection to the service it claims to be. |
| `logo` ✓ | ✓ Logo: sharp and the right shape. | — |
| `logo` ~ blurry | ~ Logo: blurry. Official logos are sharp. | The logo is blurry or pixelated. |
| `logo` ~ stretched | ~ Logo: stretched out of proportion. | The logo is stretched or the wrong shape. |
| `logo` ✗ | ✗ Logo: missing. | There is no logo, where the real page always has one. |
| `wording` ✓ | ✓ Wording: reads like the company's own notices. | — |
| `wording` ~ | ~ Wording: generic. It has no company voice. | The wording is generic where the real service is specific. |
| `wording` ✗ | ✗ Wording: spelling and grammar slips. | Spelling and grammar mistakes in a "professional" page. |
| `form` ✓ | ✓ Form: asks for the same details as the real sign-in. | — |
| `form` ~ | ~ Form: the real sign-in also asks for something this one leaves out. | The sign-in is missing a step the real one has. |
| `form` ✗ | ✗ Form: asks for more than a sign-in ever should. | A sign-in page asking for card or national insurance numbers. |
| `padlock` ✓ | ✓ Padlock: shown. (It would be shown on any address with a certificate, real or not.) | — |
| `padlock` ✗ | ✗ Padlock: missing. The browser says "Not secure". | The browser warns "Not secure" on a page asking for a password. |

Two **tells that every page has**, however good the score (because the attacker cannot own the real
domain), checked in step 6:

| Tell id | Defender string |
|---|---|
| `formOrigin` | The form belongs to `{shown}`, not to `{real}`. Whoever owns that address receives what you type. |
| `hoverMismatch` | The link in the email says `{linkText}` but hovering shows `{shown}`. |

And one **decoy** in step 6: the padlock. Clicking it when the page has one shows *"Fine. But a padlock
is on the fake page too. It only means the connection is private to whoever owns this address."*

### Worked example

Pretext: Sofia Lord, the intern (00 §1 `lord`, the link/landing-page target), expects a **notice
that her first payslip is ready on the staff payroll portal** — from her `lord_portal` intel ("she
uses a staff payroll portal", 00 §1). The clone imitates the company's own AccountingNow payroll
portal (`accountingnow.example`). Her authored `linkThreshold` is 70 and `minDomainTier` is 2 (both
live in this doc's data, keyed by target id `lord`).

`04` carries the `lord` target, with `linkCredible` among its required factors and an `expectedLink`
(`00` §4, §7); this doc only supplies the page-side numbers it points at. Lord's `senderTrust` is backed by
`lord_trusts_portal_sender` and her link by `lord_portal_name`, both granted by the call (`06`), so the page
is judged against intel the player has earned. The score does not read any global: the call changes what
the player knows, not how many points a choice is worth.

**Attempt 1.** The player rushes: AccountingNow, "Sign in", `accountingnov.example`, a blurry logo,
wording with slips, ticks email + password + card number, padlock off.

| Factor | Points |
|---|---|
| brand ✓ | 15 |
| purpose ~ (plain sign-in) | 5 |
| domain tier 1 | 10 |
| logo ~ blurry | 4 |
| wording ✗ | 0 |
| form ✗ (card number) | 0 |
| padlock ✗ | 0 |
| **Credibility** | **34** |

Shown: the band verdict `That wouldn't fool anyone.`, and underneath it the careful-reader gate
line `Sofia reads addresses carefully. This one isn't close enough.` (tier 1 is below her
`minDomainTier` of 2), with all seven lines (one ✓, three ~, three ✗) and the player's own choices
highlighted beside them.

**Attempt 2.** The player fixes it: AccountingNow, "Payslip ready", `accountingnow-hr.example`, crisp
logo, matching wording, email + password only, padlock on.

| Factor | Points |
|---|---|
| brand ✓ | 15 |
| purpose ✓ | 10 |
| domain tier 2 | 22 |
| logo ✓ | 10 |
| wording ✓ | 10 |
| form ✓ | 10 |
| padlock ✓ | 10 |
| **Credibility** | **87** |

Shown: `Convincing enough for Sofia.` Tier 2 meets `minDomainTier`, so the gate passes. The button
becomes **Attach to email**. Had the player picked `accountingnovv.example` (tier 3) the score would
be 100; the choice teaches that a better look-alike is worth the most points of any factor.

**Step 6, inspect.** The page is reopened as Sofia sees it. The player finds:

- Address bar: *"The address is `accountingnow-hr.example`, not `accountingnow.example`. Read it from the right."*
- Form: *"The form belongs to `accountingnow-hr.example`, not to `accountingnow.example`. Whoever owns that address receives what you type."*
- The email's link: *"The link in the email says `accountingnow.example/payroll` but hovering shows `accountingnow-hr.example`."* (The first half is the page's authored `linkText`; the player does not write it.)
- The padlock click shows the decoy line. The player now knows their 87-point page still had three giveaways.

The closing card then shows the five habits (step 6 above), ending: *"Your best page still failed three
checks. The real defence is the fourth habit: don't sign in from the link."*

## 5. Scenario-authored data

All content lives in scenario JSON under `social.landingPages` (`00` §11); the minigame holds none.
Brands, domains, tiers, thresholds, tells and strings are authored. The offline lint (N6) applies the `.example`, ASCII/homograph, allowlist and fold-then-match rules
described in section 1; the runtime guard (N6b) refuses anything off the authored menu. Neither runs "at
load" in the sense of rejecting a scenario, and section 1 says what they miss. The example clones the
company's own AccountingNow payroll portal (`00` §1), the brand Sofia's `lord_portal` intel points at.
An object carries only a pointer, `minigameData: { landingPageId }` (`00` §11).

```jsonc
"social": { "landingPages": [
  {
    "id": "payroll_login",                  // 01's payload kit item kit_payroll_page: { kind:"link", landingPageId:"payroll_login" } (00 §11a)
    "linkText": "accountingnow.example/payroll",   // authored: the address the mail client shows for the link; the player never writes it
    "pretext": {
      "brandId": "accountingnow",           // the service the story names
      "purposeId": "payslip",               // what the email promises the page shows
      "tone": "formal",                     // which wording variant matches
      "story": "a staff-portal notice that her first payslip is ready"   // scorer's key; never shown as UI text
    },
    "brands": [
      { "id": "accountingnow", "name": "AccountingNow", "realDomain": "accountingnow.example",
        "realFields": ["email", "password"],
        "decoyWords": ["payroll-online", "account-help", "login"],   // lint allowlist (section 1)
        "domains": [
          { "id": "d_unrelated", "domain": "payroll-online.example",      "trick": "unrelated",    "tier": 0 },
          { "id": "d_letter",    "domain": "accountingnov.example",       "trick": "wrong-letter", "tier": 1 },
          { "id": "d_word",      "domain": "accountingnow-hr.example",    "trick": "extra-word",   "tier": 2 },
          { "id": "d_sub",       "domain": "login.accountingnow.account-help.example",
                                                                          "trick": "subdomain",    "tier": 2 },
          { "id": "d_vv",        "domain": "accountingnovv.example",      "trick": "typo-squat",   "tier": 3 },
          { "id": "d_homo",      "domain": "accountingn\u043Ew.example",
                                 "browserDomain": "xn--accountingnw-fgk.example",
                                 "trick": "homograph",    "tier": 3,
            "minProfile": "student" }       // hidden below the student profile; \u escapes only
        ] },
      { "id": "cloudbox", "name": "CloudBox", "realDomain": "cloudbox.example", "realFields": ["email", "password"],
        "domains": [ /* a decoy brand: wrong for this pretext */ ] }
    ],
    "purposes": [
      { "id": "signin",  "label": "Sign in" },
      { "id": "expired", "label": "Password expired" },
      { "id": "payslip", "label": "Payslip ready" }
    ],
    "logos":   [ { "id": "crisp" }, { "id": "blurry" }, { "id": "stretched" }, { "id": "none" } ],
    "wordings": [
      { "id": "w_formal",  "match": true,  "text": "Your first payslip is ready. Sign in to the staff portal to view it." },
      { "id": "w_generic", "match": false, "text": "Please sign in to continue." },
      { "id": "w_slips",   "match": false, "text": "Plese login to veiw you're payslip." }
    ],
    "fields": ["email", "password", "one_time_code", "card_number", "ni_number"],
    "extraSensitiveFields": ["card_number", "ni_number"],
    "targets": {                            // per-target strictness, keyed by 04's target id
      "lord": { "linkThreshold": 70, "minDomainTier": 2 }
    },
    "points": { "brand": 15, "purpose": 10, "domain": [0, 10, 22, 35], "logo": 10,
                "wording": 10, "form": 10, "padlock": 10 },     // defaults shown; overridable
    "strings": { /* every line in section 4's tables, overridable per scenario; the validator
                    requires each to be non-empty and to use only {firstName}, {shown}, {real}, {linkText} */ },
    "conceptCards": ["typo-squat", "homograph", "padlock", "hover-link", "right-to-left"],
    "profile": "student"                    // student | awareness | mission; see section 7
  }
] }
```

The builder never reads the target's secrets: it reads only `linkThreshold` and `minDomainTier`,
keyed by the `04` target id (`lord` here). The persisted record's `targetId` is the sole key of the page's
`targets` map (`00` §11a); `04`'s `lord` target owns the `linkCredible` factor and `expectedLink`
(`{ brandId, realDomain }`, `00` §4, §7).

**The domain menu and the other docs.** The student profile offers six domain ids: `d_unrelated`,
`d_letter`, `d_word`, `d_sub`, `d_vv`, `d_homo` (`00` §13). The awareness and mission profiles offer a
subset (`d_letter`, `d_word`, `d_vv`). Because a below-threshold page can be attached, any of the six can
reach `05`, so `05`'s `playerSentAuth` must carry a row for every one of them and for every mail account
id (`guest`, `freemail`, `jed_pc`); this doc keeps the ids stable and `05`'s validator rejects a missing
one. `domainFrom: "landing_domain"` in `05` reads `landing_payroll_login_domain` or the record's
`choices.domainId`.

Homograph strings are authored with `\u` escapes and an explanatory note, never typed free-hand. The
offline lint accepts a non-ASCII parsed `domain` only for `trick: "homograph"` and only when the raw
`.json.erb` text holds the escape, not the character (section 1). The real-brand denylist and confusable
map are validator-level, not a per-scenario field.

**Globals.** When the page is attached the builder sets `landing_<pageId>_built` (boolean, for example
`landing_payroll_login_built`) and `landing_<pageId>_domain` (the chosen domain option id, such as
`d_word`; colon-free) through the shared writer (`00` S3). Both are declared in `globalVariables`. `10`
uses `landing_payroll_login_built` for its task and `landing_payroll_login_domain` is listed beside it
(`00` §11 globals table).

**Stored record.** One record per built page lives in `globalVariables.se_landing_pages[<pageId>]`, in
the shape `00` §11a defines:

```jsonc
{ "pageId": "payroll_login", "targetId": "lord",
  "choices": { "brand": "accountingnow", "purpose": "payslip", "domainId": "d_word", "logo": "crisp",
               "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "credibility": 87, "gatesPassed": true, "meetsThreshold": true,
  "tellsFound": ["domain","formOrigin","hoverMismatch"],
  "victim": { "visited": true, "submitted": false, "noticed": true },
  "built": true }
```

It holds ids and booleans only. It never stores a value, and the validator rejects any field key shaped
like a captured-value slot (`value`, `captured`, `submitted_data`). `se_landing_pages` is declared with
default `{}` under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses
(`siem-dashboard-minigame.js`), so records survive a reload; one small record per page keeps it well
inside the 60 KB `pagehide` flush, which shares one budget with every other global (`state-sync.js`). A
new top-level game-state section would never reach the server (the permitted parameters in
`games_controller.rb` are fixed), which is why this uses a global.

## 6. Engine wiring

New component folder `public/break_escape/js/minigames/landing-page-builder/`:

- `landing-page-builder-minigame.js` — the overlay, extends `MinigameScene`.
- `landing-page-model.js` — pure `scorePage(...)` (section 4) and the tell list. No DOM, unit-testable.
- `landing-page-render.js` — renders the fake browser from the record into two layers. **Pixel layer:**
  logos, banner and product pictures, and frame icons (padlock open, closed, crossed; "Not secure"
  badge), as `<img>` or a small canvas scaled with `image-rendering: pixelated`. **Text layer:** the
  address bar, the page's visible wording, form-field labels and the concept cards as plain DOM text in
  Atkinson Hyperlegible (N8), at native resolution, set with `textContent`. Form fields are drawn as
  styled `div` boxes with a label, never as form controls (the safety constraints in section 1). The
  preview is a `role="img"` figure with an `aria-label` that describes the page; in step 6 its hot-spots
  are `div role="button" tabindex="0"`. It outputs no HTML a browser would load and has no serialise
  function.

**Registration and start** need the full wiring checklist in README Conventions, with this component's
names:

- `export`, `import` and `registerScene('landing-page-builder', …)` in `minigames/index.js` (three places,
  next to `registerScene('text-file', …)` at `index.js:160`; `registerScene` is at
  `minigames/framework/minigame-manager.js:229`).
- A starter in `systems/minigame-starters.js` modelled on the siem block (`startMinigame('siem-dashboard',
  null, params)`, `minigame-starters.js:649-680`), exposed as `window.startLandingPageBuilder`.
- A branch in `systems/interactions.js` for the page-builder workstation object type, like the siem and
  command-board branches; a sprite `assets/objects/page-builder.png`.
- A stylesheet linked in `app/views/break_escape/games/show.html.erb`.
- `requiresKeyboardInput: true` in the starter's params. The builder has no text entry, but chip rows are
  radio groups operated by Tab, Space and arrow keys (section 8a), and the player controller's
  document-level `keydown` handler would otherwise jump on Space, interact on `E` (possibly opening
  another object's minigame) and swallow the arrows. The flag pauses it (`core/player.js:279-330`,
  `keyboardPaused`; `minigames/framework/minigame-manager.js:37-45`). Add a test-bridge check that Space
  and `E` do nothing while the builder is open.
- Validator and schema (N6): `social.landingPages` under the `social` key, and a `minigameData` entry
  (`landingPageId`) for the object type.

Params: `{ landingPageId, targetId, returnTo?, onComplete }`; `targetId` is the sole key of the page's
`targets` map when launched from a workstation. Two ways in: (a) from a workstation object
("Build a page"), (b) from the mail client's Attach menu when the `link` payload has no built page yet.
Panel chrome leans on `text-file/` and `examine/` (`text-file-minigame.js`, `examine-minigame.js`).

**Nested launch.** `MinigameFramework.startMinigame` ends the running minigame first and runs its
`onComplete(false, null)` (`minigame-manager.js:31-33, 204-206`), so launching the builder from the
composer would discard the composer. Engine item S12 (`00` §12) covers it: the mail client saves its
draft to `mailState.drafts` (not a global, `00` §10a), sets `suspended: true` so its `onComplete` ignores
that call, passes `returnTo: { sceneType: 'mail-client', params }` and the builder's required parameters
(`landingPageId`, `targetId`) in the call, and the builder's close (attached or not) reopens it with the
draft restored. The builder's own "Case file" button (step 1) does the same the other way, saving its
choices to the page record first and launching the board with `{ mode: 'recon', returnTo }`. The builder
adds nothing of its own.

**Completion and close.** When the page is attached (step 4) the minigame sets `this.gameResult` and calls
`this.complete(true)` (with the attached page's `linkInfoFor` result as `gameResult`, which the mail client uses to attach the link). `complete()` emits `minigame_completed { minigameName, success, result }` through
`window.eventDispatcher` (`minigames/framework/base-minigame.js`), and `endMinigame` then invokes
`params.onComplete(success, result)` (`minigame-manager.js`). **Closing early is also a normal exit**:
the builder saves its draft choices, sets `gameResult.saved = false` and calls `complete(true)`, so a
close never emits `minigame_failed`. `BaseMinigame.start()` binds a document-level Escape that calls
`complete(false)`, and `disableClose: true` hides the framework's close button as well as that handler
(`base-minigame.js:18-23, 70-80`). The builder passes `disableClose: true`, draws its own visible
**Close** control (touch players have no Esc) and binds its own Escape, in the capture phase, to the
same close. Scenario logic keys on the `landing_<pageId>_built` global, not on the event.

```jsonc
// result
{ "landingPageId": "payroll_login", "targetId": "lord",
  "credibility": 87, "gatesPassed": true,
  "choices": { "brand": "accountingnow", "purpose": "payslip", "domainId": "d_word",
               "logo": "crisp", "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "meetsThreshold": true, "tellsFound": ["domain","formOrigin","hoverMismatch"], "inspectionComplete": true }
```

**Bridging to globals.** On attach the builder sets `landing_<pageId>_built` and
`landing_<pageId>_domain` through the shared global writer (`00` S3). A scenario reacts with an
`eventMappings` entry on `global_variable_changed:landing_payroll_login_built`, or an objective
`onComplete.setGlobal` (`systems/objectives-manager.js`). A global alone cannot complete a task or open a
lock (README engine table, "Objectives"). No flag is involved in building; if a scenario wants a flag for "phish landed", that is
`01`'s server-validated flow (`flag-station-minigame.js` pattern), and the builder never judges a flag.

**Cross-component contracts.**

- **`01` (mail client).** The payload kit item `kit_payroll_page` (`kind: "link"`, `landingPageId:
  "payroll_login"`, `00` §11a) is the only link id. `01` resolves it to the saved record, fills
  `message.linkInfo` from `linkInfoFor(record, targetId)`, and shows a chip "Link: {linkText}", where
  `linkText` is authored on the page (the player does not write it; it may name the real brand while the
  target is the look-alike, which is the hover-link lesson). `01` stores the picked link in the sent record
  with `link.domainId` copied from the record (`00` §10a). After a landed phish `01` calls
  `describeVictimOutcome(record, target, landed)` (exported from `landing-page-model.js`) for the step 5
  result line and stores the `victim` record.
- **`04` (rules engine).** `linkCredible` consumes `message.linkInfo` as in section 4. `linkThreshold` and
  `minDomainTier` live in this doc's data because they are about pages; `04`'s `lord` target is matched by
  `targetId` and owns `expectedLink: { brandId, realDomain }` (`00` §4, §7).
- **`05` (triage defender).** `05` inspects *emails*, with flag chips drawn from `04`'s factors and
  strings from the shared red-flag library (`00` §2). This doc exports `buildSuspectPage(record)` and the
  step-6 `tells` table so `05` can offer a "inspect this page" item from the same record and strings;
  `05` has no such item in the lab. Where the strings overlap (domain look-alike, link mismatch) both
  sides draw on `00` §2's red-flag library, so they cannot disagree. `05`'s `playerSent` replay uses the
  record's `choices.domainId` (section 5).

### New engine work

| # | Item | Notes |
|---|------|-------|
| N1 | `landing-page-builder` overlay (preview, choice panel, step strip, score panel), with the wiring checklist above | New `minigames/landing-page-builder/`; `minigames/index.js`; `systems/minigame-starters.js`; `systems/interactions.js`; `show.html.erb` |
| N2 | `landing-page-model.js` pure scorer + tell table + `describeVictimOutcome` | Unit tests mirror section 4's worked example (34 and 87) |
| N3 | `landing-page-render.js` two-layer renderer (pixel layer, inert DOM text layer) and the DOM-safety test that fails on any form, link, button, frame, script or `contenteditable` in the preview. The test needs a DOM: add `jsdom` to `devDependencies` (today only Playwright is there, and the existing `.test.mjs` files stub `document` by hand, for example `sight-challenge-tutorial-prompt.test.mjs:38`) | New; test in `test/js/`; `package.json` |
| N4 | Persist built pages as ids in the `se_landing_pages` global (section 5), with the 60 KB flush note | `state-sync.js` flush; `siem-dashboard-minigame.js` STATE_KEY pattern as the model |
| N5 | Step 6 defender inspection (focusable hot-spots, decoy padlock, "Show the link target" in the choice panel, closing five-habits card); exports `buildSuspectPage` and the `tells` table for optional reuse by `05` | New in `landing-page-builder/` |
| N6 | Offline lint, its test, and the **CI step that runs it**: `.example` suffix; ASCII with the homograph exception and the raw-text escape check; `decoyWords`/brand-word/edit-distance allowlist plus fold-then-match denylist (section 1); every string non-empty and using only the allowed placeholders; every tier (0 included) has a defender string; no field key shaped like a captured-value slot; `decoyWords` pass the denylist. Without the CI step (`setup-node`, `npm ci`, `node --test test/js/validator-*.test.mjs`, a loop of the validator over `scenarios/*/scenario.json.erb`) the lint is not enforced | `scripts/validate_scenario.rb` (`known_top_level`, S11); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; new `test/js/validator-landing-pages.test.mjs`; `.github/workflows/ci.yml` |
| N6b | Runtime guard: the model and the renderer refuse a domain not on the authored menu or not ending `.example`, and draw a "blocked" placeholder | `landing-page-model.js`, `landing-page-render.js` |
| N7 | Concept cards (typo-squat, homograph, padlock, hover-link, right-to-left) as shared content | Also used by `02`/`05` tool cards |
| N8 | Bundle Atkinson Hyperlegible (`00` §6) and apply `--se-font-readable` to every string the builder shows that holds an authored domain, address, handle or document field, wherever it appears: preview text, address bar, domain chips, the score checklist, feedback lines, tells-panel lines and concept cards; authored domains rendered raw, not via `displayDashes` | `public/break_escape/assets/fonts/`; `css/fonts.css`; `utils/display-dashes.js` bypass |
| N9 | Nested launch and close: return-to for the mail-client round trip (`00` S12), close as a normal exit with its own Close control and Escape, `requiresKeyboardInput: true` | `minigames/framework/minigame-manager.js`, `base-minigame.js` (`disableClose`) |
| N10 | `linkInfoFor(record, targetId)` and `describeVictimOutcome` in the model, unit-tested against the worked example | `landing-page-model.js` |

N6 and N6b together are the safety enforcement. The shared engine items they depend on are in `00` §12
(S3 the shared global writer, S11 the validator and schema).

## 7. Reuse across audiences

One data record, one `profile`:

| | Student lab | Awareness | Mission |
|---|---|---|---|
| Choices shown | All seven | Brand, domain, padlock (others fixed to correct) | Domain and wording only; the handler presets the rest |
| Domain menu | Six tricks including homograph | Three tricks (wrong letter, extra word, typo-squat), no homograph | Three, no homograph |
| Meter and per-factor lines | Shown after Score only | Live, with a tell counter | Live |
| Step 6 inspection | Find tells unaided, then closing card | Tells auto-highlighted, tap to read | One-line summary in the handler's dialogue |
| Gates | `minDomainTier` 2 to 3, escalating across targets | Off (threshold only) | One target, threshold 60 |
| Concept cards | All five, optional "why" panels | Two (padlock, hover-link) | None; the handler explains |
| Outcome | Metrics line for the Ch. 9 report | "You fooled the system. Could you spot yours?" then flip to `05` | an `eventMappings` entry on `global_variable_changed:landing_*_built` unlocks the next lock |

## 8. Art and audio assets (PixelLab-first, none generated now)

- Fake-browser chrome: window frame, address bar frame, padlock open/closed/crossed icons, "Not secure" badge — pixel UI, about 8 sprites at native size, scaled 3x. The address text itself is DOM text, not part of the sprite.
- Fictional brand logos (AccountingNow, the decoy CloudBox) in three renderings each (crisp, blurry, stretched): produced from one crisp 32x32 source; the blurry and stretched variants are drawn deliberately bad in the renderer, not downscaled (house rule: no downscaling pixel art).
- Page body templates: sign-in, password-expired, payslip-ready layouts (pixel blocks; their text is DOM text).
- Step-strip icons (pretext, build, score, send, inspect), tell-found stamp, credibility meter frame.
- Concept-card illustrations: `paypa1` against `paypal`, `rn` against `m`, an address bar with the real name hidden in a subdomain, padlock beside a fake address.
- Audio: reuse existing UI clicks; one soft "found it" cue on a correct tell; nothing new needed.

## Visual style (decided 2026-10-20)

- The built page and the fake-browser frame use the game's pixel-art look: pixel logos for the fictional
  brands, pixel imagery in the page body, and a frame styled like the game UI with `--ui-*` colours.
- Text the player must read or compare is **inert DOM text in Atkinson Hyperlegible** (`00` §6), not a
  pixel font and not text drawn into the low-res canvas. The scope is every string that holds an authored
  domain, address or handle, **wherever it appears**: the fake page and address bar, but also the domain
  chips in the choice panel, the score checklist, the feedback and tells lines, and the concept cards.
  The player compares look-alike domains (`rn` against `m`, `vv` against `w`, `paypa1` against `paypal`)
  in exactly those places, so they cannot sit in the theme font. The face is not bundled today (the game
  ships `GNF`, `Pixelify Sans` and `Press Start 2P`), so N8 adds it, self-hosted as woff2 and declared in
  `css/fonts.css`. Chrome labels and headings that hold no such string stay in the theme fonts.
- Pixel-art imagery makes a built page obviously part of the game. It cannot be lifted as a working
  phishing page, and it cannot be mistaken for a real brand. That supports the weaponisation check in
  "Safety design", but the structural constraints there (no form controls, no export) are what actually
  hold the line; art style is not relied on.

## 8a. Accessibility and small screens

- Below about 700 px the two panes stack: preview above, choice panel below. The step strip becomes a list
  with `aria-current="step"`. Touch targets are at least 44 px.
- Every chip row is a radio group (or a checkbox group for form fields), reachable by Tab and arrow keys,
  which is why the overlay sets `requiresKeyboardInput: true`. Every action, including Score, Attach,
  Show me, Close and the step 6 picks, is reachable by keyboard.
- The credibility number is text, and the verdict and the per-factor lines sit in an
  `aria-live="polite"` region. The ✓, ~ and ✗ marks are always paired with the words Pass, Partly and Fail,
  never colour or a symbol alone. The tell counter is text.
- The meter fill and any "found it" stamp do not animate under `prefers-reduced-motion`.
- Teaching notes are behind a visible "?" button as well as hover. The link target in step 6 is behind a
  button, not hover.
- The preview is one labelled figure with a text description, so a screen reader hears the page as a
  description; in step 6 the hot-spots are the focusable parts.

## 9. Open questions

The user-facing ones (OQ1 to OQ5) are repeated in `README.md`.

- OQ1: real brand names in concept-card text. Default: yes, plain text only.
- OQ2: domain chosen from a menu, never typed. Default: menu. Free typing needs a
  similarity scorer and edges toward a look-alike generator.
- OQ3: homograph in the student profile only. Default: yes.
- OQ4: outcome counts in the builder. Default: yes, counts only.
- OQ5: padlock wording (a padlock means the connection is private to whoever owns the address, and fake sites can show one). Default: as written, with the icon called "padlock" or "secure-connection icon" because some browsers have replaced the padlock with a neutral icon. Verify against current browsers before shipping.
- OQ6: should `tier` be authored or computed from edit distance and confusable-character rules?
  Default: authored. Computed tiers are less readable to a reviewer and would need a confusables
  table the game has no other use for.
- OQ7: should a below-threshold page be sendable? Default: yes ("Attach anyway"), so the target's
  in-character reply teaches too. Alternative is a hard block, which reads as a dead end.
- OQ8: should `05` offer page-inspection items from `buildSuspectPage`? Default: not in the lab; the
  exports exist so a later set can.
- OQ9: the page-purpose factor partly overlaps `04`'s `pretextRelevant` (both ask "does this fit
  the story?"). Default: keep both, since one judges the email and one judges the page; revisit if a
  reviewer finds the double count confusing.
