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
  A unit test walks the preview's DOM after every step and fails on any of those (N3).
- **No capture code exists anywhere.** When a victim "visits" or "submits", the game flips a
  boolean and prints a result line. No field value is ever read, stored, sent or logged, because
  there is none: the victim is a scenario record, not a person typing into a form.
- **No network.** Nothing in the component makes a request. Domains are strings in scenario JSON.
- **Fictional only.** Brands and domains are invented. Two controls enforce it, and this section says
  plainly where each runs and what it misses.
  - **Offline lint (N6).** A check in `scripts/validate_scenario.rb`, plus a CI test over every
    `scenarios/*` (`test/js/validator-landing-pages.test.mjs`, modelled on the existing
    `validator-*.test.mjs`). It requires every authored domain string to end in the reserved,
    non-registrable suffix `.example`, to be ASCII (a homograph is written as `\u` escapes in the JSON
    and the lint accepts only escapes, never raw non-ASCII), and to pass a brand check. The brand check
    **folds, then matches**: NFKC-normalise, map confusables (Cyrillic and Greek to Latin, `1`/`l`/`I`,
    `0`/`o`, `rn` to `m`, `vv` to `w`), strip hyphens and dots, then look for a denylisted real brand
    (PayPal, NatWest, Microsoft and the like). The primary control is an allowlist: every domain label
    must be built from the page's fictional `realDomain` brand word plus an authored trick suffix, so a
    free-standing real brand cannot appear at all. The denylist is the backstop. The list lives in the
    validator, not in a scenario, so one scenario cannot quietly shorten it.
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
visible wording, field labels and the concept cards, is inert DOM text in the bundled readable sans-serif.
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
3. **Domain** — a short list of addresses, each tagged with its trick (real, typo, extra word,
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
If below the line the player edits and re-scores. No attempt limit, no dead end.

### Step 4. Send
Once the score meets the threshold the button changes to **Attach to email**. The page is saved
as a `link` payload (section 6) and the overlay closes. If the builder was opened from the mail client's
Attach menu, the mail client reopens with its draft restored and the link attached (the return-to in
section 6); if it was opened from a workstation, the player carries on to the mail client themselves. The
mail client (`01`) hands `linkCredible` to the rules engine (`04`). A player who wants to experiment can
still send a below-threshold page: the rules engine will fail `linkCredible` and the target's
in-character reply says why. Nothing is blocked. Closing the overlay without attaching keeps the draft
choices and is a normal exit (section 6), not a failure.

### Step 5. The outcome report
When the email has landed and the target "clicks", the mail client calls back into this component
for the result line (the capture is **simulated**):

> `Sofia Lord opened your link.` / `Sofia Lord signed in on your page. (Simulated: no
> credentials were collected.)` / `Sofia Lord closed the tab at the address bar.`

The result is a record `{ visited: bool, submitted: bool, noticed: bool }` and a count line for the
scenario's metrics report (book Ch. 9): `Visits 1 · Submissions 1 · Reports 0`.

### Step 6. Inspect your own page (the defender flip)
The player reopens the saved page from the workstation as the **victim's browser** (the Inspect button
appears once the page has been attached and its email has been sent) and is asked: "Find the giveaways."
The player selects parts of the page (address bar, padlock, logo, form, wording). Each part is a focusable
element inside the preview (a `div` with `role="button"` and `tabindex="0"`, not a form control), so the
step works by keyboard, by touch and through the playtest bridge. Each correct pick confirms a tell and
shows its defender string (section 4); wrong picks say what was fine. The link tell has a **Show the link
target** button, because hovering does not exist on touch. The step ends when every tell the page has is
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
as typed. They show the coded form, here `xn--accountingnw-fgk.example`. So the option carries two display
strings: the as-typed form in the mail link text and the chip, and the coded form in the fake address bar.
The scoring tier is for the as-typed form, where the eye cannot tell. In step 6 the address bar shows the
coded form and the card says so: a browser defends against this, a mail or chat app may not, which is why
the fourth habit (don't sign in from a link) matters more than good eyesight. Both strings are authored
escapes in the data; no raw look-alike character appears in this doc or in the sample data.

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

The builder returns `credibility` (0 to 100) and `gates[]`. The rules engine's `linkCredible`
factor (`04`) passes when `credibility ≥ target.linkThreshold` **and** every gate passes. `04` owns
the factor, this document owns the number. `04`'s two feedback strings for `linkCredible` stay the
authoritative reply and red-flag text; the per-factor lines below are shown in addition, in the
builder only.

### Exact feedback strings

Verdict line (one band verdict shown; a failed gate adds its line underneath, it does not replace
the band):

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
| `hoverMismatch` | The link in the email says `{real}` but hovering shows `{shown}`. |

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
- The email's link: *"The link in the email says `accountingnow.example` but hovering shows `accountingnow-hr.example`."*
- The padlock click shows the decoy line. The player now knows their 87-point page still had three giveaways.

The closing card then shows the five habits (step 6 above), ending: *"Your best page still failed three
checks. The real defence is the fourth habit: don't sign in from the link."*

## 5. Scenario-authored data

All content lives in scenario JSON under `social.landingPages` (`00` §11); the minigame holds none.
Brands, domains, tiers, thresholds, tells and strings are authored. The offline lint (N6) requires every
`domain` and `realDomain` to be ASCII and end in `.example`, and applies the fold-then-match brand check
described in section 1; the runtime guard (N6b) refuses anything off the authored menu. Neither runs "at
load" in the sense of rejecting a scenario, and section 1 says what they miss. The example clones the
company's own AccountingNow payroll portal (`00` §1), the brand Sofia's `lord_portal` intel points at.
An object carries only a pointer, `minigameData: { landingPageId }` (`00` §11).

```jsonc
"social": { "landingPages": [
  {
    "id": "payroll_login",                  // referenced by 01's payload kit item page_payroll: { kind:"link", landingPageId }
    "pretext": {
      "brandId": "accountingnow",           // the service the story names
      "purposeId": "payslip",               // what the email promises the page shows
      "tone": "formal",                     // which wording variant matches
      "story": "a staff-portal notice that her first payslip is ready"   // scorer's key; never shown as UI text
    },
    "brands": [
      { "id": "accountingnow", "name": "AccountingNow", "realDomain": "accountingnow.example",
        "realFields": ["email", "password"],
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
    "strings": { /* every line in section 4's tables, overridable per scenario; validator
                    requires each to be non-empty and to contain no unresolved {placeholder} */ },
    "conceptCards": ["typo-squat", "homograph", "padlock", "hover-link", "right-to-left"],
    "profile": "student"                    // student | awareness | mission; see section 7
  }
] }
```

The builder never reads the target's secrets: it reads only `linkThreshold` and `minDomainTier`,
keyed by the `04` target id (`lord` here). This page record carries its `targetId` (`lord`); `04`'s
`lord` target owns the `linkCredible` factor and `expectedLink` (`00` §4, §7).

Homograph strings are authored with `\u` escapes and an explanatory note, never typed free-hand, and the
offline lint rejects a raw non-ASCII byte in any `domain`, `browserDomain` or `realDomain` field. The
real-brand denylist and confusable map are validator-level, not a per-scenario field (section 1).

**Globals.** The builder sets `landing_<pageId>_built` (boolean, for example `landing_payroll_login_built`)
and `landing_<pageId>_domain` (the chosen domain option id, such as `d_word`; colon-free), through the
shared writer (`00` S3) when the page is attached. Both are declared in `globalVariables`. `10` and the
`boostIfGlobal` hooks in `04` use these names.

**Stored record.** A built page is saved as ids only: the option ids chosen, the field ids ticked,
`credibility`, `tellsFound`. It never stores a value, and the validator rejects any field key shaped like a
captured-value slot (`value`, `captured`, `submitted_data`). Records live in one global,
`se_landing_pages` (default `{}`), under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses
(`siem-dashboard-minigame.js`), so they survive a reload; ids-only keeps them small, because the 60 KB
`pagehide` flush shares one budget with every other global (`state-sync.js`). A new top-level game-state
section would never reach the server (the permitted parameters in `games_controller.rb` are fixed), which
is why this uses a global.

## 6. Engine wiring

New component folder `public/break_escape/js/minigames/landing-page-builder/`:

- `landing-page-builder-minigame.js` — the overlay, extends `MinigameScene`.
- `landing-page-model.js` — pure `scorePage(...)` (section 4) and the tell list. No DOM, unit-testable.
- `landing-page-render.js` — renders the fake browser from the record into two layers. **Pixel layer:**
  logos, banner and product pictures, and frame icons (padlock open, closed, crossed; "Not secure"
  badge), as `<img>` or a small canvas scaled with `image-rendering: pixelated`. **Text layer:** the
  address bar, the page's visible wording, form-field labels and the concept cards as plain DOM text in the
  bundled readable sans-serif (N8), at native resolution, set with `textContent`. Form fields are drawn as
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
- No `requiresKeyboardInput`: the builder has no text entry (every input is a chip, tick or button), so
  game keys are left alone. If one is ever added, set the flag and follow the Esc rule below.
- Validator and schema (N6): `social.landingPages` under the `social` key, and a `minigameData` entry
  (`landingPageId`) for the object type.

Params: `{ landingPageId, targetId, returnTo?, onComplete }`. Two ways in: (a) from a workstation object
("Build a page"), (b) from the mail client's Attach menu when the `link` payload has no built page yet.
Panel chrome leans on `text-file/` and `examine/` (`text-file-minigame.js`, `examine-minigame.js`).

**Nested launch.** `MinigameFramework.startMinigame` ends the running minigame first and runs its
`onComplete(false)` (`minigame-manager.js`, `endMinigame`), so launching the builder from the composer
would discard the composer. The convention in README Conventions applies: the mail client saves its draft
to its own global before launching, passes `returnTo: { sceneType: 'mail-client', params }`, and the
builder's close (saved or not) reopens it with the draft restored. The builder's own "Case file" button
(step 1) does the same the other way, saving its choices to `se_landing_pages` first. The shared helper is
the README's return-to item; the builder adds nothing of its own.

**Completion and close.** When the page is attached (step 4) the minigame sets `this.gameResult` and calls
`this.complete(true)`. `complete()` emits `minigame_completed { minigameName, success, result }` through
`window.eventDispatcher` (`minigames/framework/base-minigame.js`), and `endMinigame` then invokes
`params.onComplete(success, result)` (`minigame-manager.js`). **Closing early is also a normal exit**:
the builder saves its draft choices, sets `gameResult.saved = false` and calls `complete(true)`, so a
close never emits `minigame_failed`. `BaseMinigame.start()` binds a document-level Escape that calls
`complete(false)`; the builder passes `disableClose: true` and binds its own Escape to the same close.
Scenario logic keys on the `landing_<pageId>_built` global, not on the event.

```jsonc
// result
{ "landingPageId": "payroll_login", "targetId": "lord",
  "credibility": 87, "gatesPassed": true,
  "choices": { "brand": "accountingnow", "purpose": "payslip", "domain": "d_word",
               "logo": "crisp", "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "tellsFound": ["domain","formOrigin","hoverMismatch"], "inspectionComplete": true }
```

**Bridging to globals.** On attach the builder sets `landing_<pageId>_built` and
`landing_<pageId>_domain` through the shared global writer (`00` S3; today `applyActions` `set_global`,
`systems/apply-actions.js`). A scenario reacts with an `eventMappings` entry on
`global_variable_changed:landing_payroll_login_built`, or an objective `onComplete.setGlobal`
(`systems/objectives-manager.js`). A global alone cannot complete a task (README engine table,
"Objectives"). No flag is involved in building; if a scenario wants a flag for "phish landed", that is
`01`'s server-validated flow (`flag-station-minigame.js` pattern), and the builder never judges a flag.

**Cross-component contracts.**

- **`01` (mail client).** The `link` payload kit item (`page_payroll`, `00` §1 `link` slot type) holds
  `landingPageId`. `01` loads the saved page record, shows its chip as "Link: {shown address}" (the
  **display text** the player writes may name the real brand, the **target** is the look-alike, which is
  the hover-link lesson),
  and passes `{ credibility, gatesPassed }` into `04`. After a landed phish `01` calls
  `describeVictimOutcome(page, target, landed)` (exported from `landing-page-model.js`) for the
  step 5 result line.
- **`04` (rules engine).** `linkCredible` consumes `credibility` and `gates` as in section 4.
  `linkThreshold` and `minDomainTier` live in this doc's data because they are about pages; `04`'s
  target record (the `lord` target) is matched by `targetId`. That `lord` target, with
  `linkCredible` required and an `expectedLink` (00 §4, §7), is defined in `04`.
- **`05` (triage defender).** `05` is a complete draft, but it inspects *emails*: its flag chips are
  `04`'s factors in the failed state and its strings come from the shared `redFlagLibrary` (00 §2).
  It has no landing-page inspection item and does not import `buildSuspectPage` or a step-6 `tells`
  table today. So the shared-source-of-truth plan here (export `buildSuspectPage(pageSpec)` and the
  step-6 `tells` so `05` can offer "inspect this page" items from the same record and strings) is a
  **change request against `05`**, not an agreed contract — new engine work and a new `05` section
  for its author to accept or revise. Where the strings already overlap (domain look-alike, link
  mismatch) both sides draw on 00 §2's red-flag library, so on those they cannot disagree.

### New engine work

| # | Item | Notes |
|---|------|-------|
| N1 | `landing-page-builder` overlay (preview, choice panel, step strip, score panel), with the wiring checklist above | New `minigames/landing-page-builder/`; `minigames/index.js`; `systems/minigame-starters.js`; `systems/interactions.js`; `show.html.erb` |
| N2 | `landing-page-model.js` pure scorer + tell table + `describeVictimOutcome` | Unit tests mirror section 4's worked example (34 and 87) |
| N3 | `landing-page-render.js` two-layer renderer (pixel layer, inert DOM text layer) and the DOM-safety test that fails on any form, link, button, frame, script or `contenteditable` in the preview | New; test in `test/js/` |
| N4 | Persist built pages as ids in the `se_landing_pages` global (section 5), with the 60 KB flush note | `state-sync.js` flush; `siem-dashboard-minigame.js` STATE_KEY pattern as the model |
| N5 | Step 6 defender inspection (focusable hot-spots, decoy padlock, "Show the link target", closing five-habits card) | Proposed for reuse by `05` as a change request (see cross-component contracts), not yet in `05` |
| N6 | Offline lint and CI test: every `domain`/`browserDomain`/`realDomain` is ASCII and ends `.example`; fold-then-match brand check with the allowlist as primary control (section 1); every string non-empty with no unresolved `{placeholder}`; every tier (0 included) has a defender string; no field key shaped like a captured-value slot; an `xn--` string survives rendering unchanged | `scripts/validate_scenario.rb` (`known_top_level`, S11); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; new `test/js/validator-landing-pages.test.mjs` |
| N6b | Runtime guard: the model and the renderer refuse a domain not on the authored menu or not ending `.example`, and draw a "blocked" placeholder | `landing-page-model.js`, `landing-page-render.js` |
| N7 | Concept cards (typo-squat, homograph, padlock, hover-link, right-to-left) as shared content | Also used by `02`/`05` tool cards |
| N8 | Bundled readable sans-serif for all text in the preview and cards (README engine table, "Fonts and CSS"); authored domains rendered raw, not via `displayDashes` | `public/break_escape/assets/fonts/`; `css/fonts.css`; `utils/display-dashes.js` bypass |
| N9 | Nested launch and close: return-to for the mail-client round trip, close as a normal exit with its own Escape (README engine table, "Minigame framework") | `minigames/framework/minigame-manager.js`, `base-minigame.js` (`disableClose`) |

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
| Outcome | Metrics line for the Ch. 9 report | "You fooled the system. Could you spot yours?" then flip to `05` | `set_global landing_*_built` gates the next lock |

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
- Text the player must read or compare is **inert DOM text in a bundled readable sans-serif**, not a pixel
  font and not text drawn into the low-res canvas. That covers the domain, the address bar, the page's
  visible wording, field labels and the concept cards. Look-alike domains (`rn` against `m`, `paypa1`
  against `paypal`) must behave as they do in a real browser, which needs a face whose `l`, `I`, `1`,
  `rn` and `m` differ clearly. None is bundled today (the game ships `GNF`, `Pixelify Sans` and `Press
  Start 2P`; the only sans-serif declarations are a system stack and `Arial`), so N8 adds one, self-hosted
  as woff2 and declared in `css/fonts.css`. Use it only inside the fake page, the address bar and the
  cards; the surrounding chrome stays in the theme fonts.
- Pixel-art imagery makes a built page obviously part of the game. It cannot be lifted as a working
  phishing page, and it cannot be mistaken for a real brand. That supports the weaponisation check in
  "Safety design", but the structural constraints there (no form controls, no export) are what actually
  hold the line; art style is not relied on.

## 8a. Accessibility and small screens

- Below about 700 px the two panes stack: preview above, choice panel below. The step strip becomes a list
  with `aria-current="step"`. Touch targets are at least 44 px.
- Every chip row is a radio group (or a checkbox group for form fields), reachable by Tab and arrow keys.
  Every action, including Score, Attach, Show me and the step 6 picks, is reachable by keyboard.
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
- OQ7: should a below-threshold page be sendable? Default: yes, so the target's in-character
  reply teaches too. Alternative is a hard block, which reads as a dead end.
- OQ8: `05` exists but does not yet carry this contract. The section 6 plan (`buildSuspectPage`,
  shared `tells` and defender strings) is a change request against `05`; its author should accept or
  change it.
- OQ9: the page-purpose factor partly overlaps `04`'s `pretextRelevant` (both ask "does this fit
  the story?"). Default: keep both, since one judges the email and one judges the page; revisit if a
  reviewer finds the double count confusing.
