# 07 — Landing-page builder (credential-harvest, abstracted)

Status: plan, 2026-10-20. Last in the build order (most new UI, least reuse). Feeds the mail client
(`01`) a `link` payload; is judged by the `linkCredible` factor of the rules engine (`04`); its
output is reused by the triage defender (`05`) as "a bad page to inspect".
R1 fixes applied, 2026-10-20 (REVIEW_07_R1.md F1–F5).

## 1. Purpose & audience

The player builds a fake sign-in page for a pretext, sees how convincing it is, then inspects their
own page as the victim and learns how to catch one. Maps to book Ch. 8 "Cloning a Landing Page".
All three audiences, tuned by data: the Cyber Security student lab goes deepest (every choice,
homograph card, unaided inspection); awareness learners get three choices and highlighted tells;
SAFETYNET missions use it as one stage with a preset brand. What it teaches, in order: a page is
only as convincing as its domain, logo, wording, form and padlock together; a look-alike domain is
the one thing the attacker can never make perfect; and the defender's checklist (domain, padlock,
origin of the form, hover the link, don't sign in from a mailed link).

### Safety design (read first)

This component **models** a credential-harvesting page. It must never become one. The rules below
are part of the design, not polish, and a reviewer should treat any breach as a blocker.

- **No code authoring.** The player never types or edits HTML, CSS, JavaScript or a form handler.
  Every input is a choice from a list the scenario authored.
- **The "page" is a data record**, drawn to a canvas inside the overlay. It is not a document the
  browser can load, it has no export, download, copy-as-HTML or "preview in new tab".
- **No capture code exists anywhere.** When a victim "visits" or "submits", the game flips a
  boolean and prints a result line. No field value is ever read, stored, sent or logged, because
  there is none: the victim is a scenario record, not a person typing into a form.
- **No network.** Nothing in the component makes a request. Domains are strings in scenario JSON.
- **Fictional only.** Brands and domains are invented. A load-time lint (N6) enforces two separate
  things: every authored domain string ends in the reserved, non-registrable suffix `.example`, and
  no authored brand name or domain string contains a word from a real-brand denylist (PayPal,
  NatWest, Microsoft and the like). The suffix rule stops a registrable address; the denylist stops
  a scenario dressing the builder's own domain menu in a real brand, which the suffix rule alone does
  not (`paypal.example` passes a suffix-only check). Real services appear only in a plain-text
  concept card as a typographic example (`paypa1` against `paypal`), which the denylist does not
  touch because it checks the domain/brand menu, not concept-card prose.
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

One overlay, house style (dark panel, `Press Start 2P` headings, `VT323` body, `#00ff41` accent,
canvas drawn low-res and scaled with `image-rendering: pixelated`). A **step strip** across the top
shows `Pretext · Build · Score · Send · Inspect`. The left half is the **page preview** drawn as a
tiny fake browser (address bar, padlock, page body). The right half is the **choice panel** for the
current step. A **Pretext card** from the mail client's brief stays pinned at the top of the panel
(for example: "Sofia expects a payslip notice on the staff payroll portal").

### Step 1. Pretext
The pinned card states the story the page must fit, taken from the scenario's `pretext` block: which
service the target uses, what the email will say, what she expects to see after clicking. A
"Concept: why the page must match the story" card is one click away. No choices yet. Button: Build.

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
   connection is encrypted to whoever owns that domain. It says nothing about who that is.*

A **Tell counter** (optional, on for early teaching) shows how many giveaways the current page has,
without naming them. Hover a chip for its one-line teaching note.

### Step 3. Score
Press Score. The game shows the **credibility meter** (0 to 100), the target's threshold as a line
on it, and the per-factor checklist (section 4). Verdict line is one of three strings (section 4).
If below the line the player edits and re-scores. No attempt limit, no dead end.

### Step 4. Send
Once the score meets the threshold the button changes to **Attach to email**. The page is saved
as a `link` payload (section 6) and the overlay closes; the player finishes the email in the mail
client (`01`), which hands `linkCredible` to the rules engine (`04`). A player who wants to
experiment can still send a below-threshold page: the rules engine will fail `linkCredible` and
the target's in-character reply says why. Nothing is blocked.

### Step 5. The outcome report
When the email has landed and the target "clicks", the mail client calls back into this component
for the result line (the capture is **simulated**):

> `Sofia Lord opened your link.` / `Sofia Lord signed in on your page. (Simulated: no
> credentials were collected.)` / `Sofia Lord closed the tab at the address bar.`

The result is a record `{ visited: bool, submitted: bool, noticed: bool }` and a count line for the
scenario's metrics report (book Ch. 9): `Visits 1 · Submissions 1 · Reports 0`.

### Step 6. Inspect your own page (the defender flip)
The overlay reopens the same preview as the **victim's browser** and asks: "Find the giveaways."
The player clicks on parts of the page (address bar, padlock, logo, form, wording). Each correct
click confirms a tell and shows its defender string (section 4); wrong clicks say what was fine.
The step ends when every tell the page has is found, or the player taps **Show me**. A closing card
lists the **five habits** that beat this attack:

1. Read the address up to the first single `/`, then find the ending: `.com`, or a country ending like `.co.uk`. The real site is the single name immediately before that ending (`accountingnow.example`, or `natwest.co.uk` for a UK site). Everything to the left (`login.`, `secure.`, an extra word) is just labels the owner can set to anything.
2. Don't trust the padlock to mean "safe". It means "private to whoever owns this address".
3. Hover over a link before clicking and compare it with where the message says it goes.
4. Don't sign in from a mailed link. Open the service from a bookmark or type it yourself.
5. Report it. A password manager that refuses to fill the form is a free warning; believe it.

## 4. The rules and scoring

Deterministic and visible. The model is a pure function,
`scorePage(spec, pretext, target) → { credibility, factors[], gates[], tells[], verdict }`, with no
randomness and no free text to interpret. That removes the SecGen failure modes outright: there is
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
| Same-looking letter from another alphabet (homograph) | `accountingn<Cyrillic о>w.example` | 3 | Identical to the eye; student lab only |

Concept card text for the two top tiers, shown on the hover note and on the defender card (plain
language, no instruction): *"A typo-squat is a name one keystroke or one look-alike pair away from
the real one, such as `paypa1` for `paypal`, or `rn` for `m`. A homograph swaps a letter for a
different-alphabet letter that looks the same, so even a careful eye cannot tell. Browsers
sometimes show these in a coded form (`xn--...`) for that reason. The defence is not better
eyesight. It is not signing in from a link."*

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

This worked example assumes `04` carries a `lord` target with `linkCredible` among its required
factors and an `expectedLink` (00 §4, §7). `04` does not define that entry today; the orchestrator
adds it to `04`. This doc only supplies the page-side numbers it points at.

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

All content lives in scenario JSON; the minigame holds none. Brands, domains, tiers, thresholds,
tells and strings are authored. The N6 lint runs at load: every `domain` and `realDomain` value must
end in `.example`, and no `name` or domain string may contain a word from the real-brand denylist, or
the scenario fails to load (safety, N6 below). The example clones the company's own AccountingNow
payroll portal (00 §1), the brand Sofia's `lord_portal` intel points at.

```jsonc
"landingPages": [
  {
    "id": "payroll_login",                  // referenced by 01's payloadKit: { kind:"link", landingPageId }
    "pretext": {
      "brandId": "accountingnow",           // the service the story names
      "purposeId": "payslip",               // what the email promises the page shows
      "tone": "formal",                     // which wording variant matches
      "story": "a staff-portal notice that her first payslip is ready"
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
          { "id": "d_homo",      "domain": "accountingnоw.example",  "trick": "homograph",    "tier": 3,
            "minProfile": "student" }       // hidden below the student profile
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
]
```

The builder never reads the target's secrets: it reads only `linkThreshold` and `minDomainTier`,
keyed by the `04` target id (`lord` here). This page record carries its `targetId` (`lord`); `04`'s
`lord` target owns the `linkCredible` factor and `expectedLink` (00 §4, §7) and is already defined
there.

`homograph` strings are authored with `\u` escapes and an explanatory note, never typed free-hand.
The real-brand denylist the N6 lint checks against is a validator-level list (PayPal, NatWest,
Microsoft and the like, case-insensitive, matched as substrings of `name` and every domain string),
not a per-scenario field, so a single scenario cannot quietly shorten it.

## 6. Engine wiring

New component folder `public/break_escape/js/minigames/landing-page-builder/`:

- `landing-page-builder-minigame.js` — the overlay, extends `MinigameScene`.
- `landing-page-model.js` — pure `scorePage(...)` (section 4) and the tell list. No DOM, unit-testable.
- `landing-page-render.js` — draws the fake browser to a low-res canvas (address bar, padlock,
  logo block, form boxes, wording lines) scaled with `image-rendering: pixelated`. It draws shapes
  and text only; it builds no HTML a browser would load.

**Registration and start** follow the existing pattern. Register in
`public/break_escape/js/minigames/index.js` next to `MinigameFramework.registerScene('text-file', …)`
(`index.js:160`), which calls `registerScene(sceneType, SceneClass)` at
`minigames/framework/minigame-manager.js:229`. Start through `startMinigame(sceneType, container,
params)` (`minigame-manager.js:15`), from a starter added in `systems/minigame-starters.js` modelled
on the `startMinigame('siem-dashboard', null, params)` block (`minigame-starters.js:660-679`). Params:
`{ landingPageId, targetId, onComplete }`. Two ways in: (a) from a workstation object ("Build a
page"), (b) from the mail client's Attach menu when the `link` payload has no built page yet.
Display layers lean on `text-file/` and `examine/` for panel chrome (`text-file-minigame.js`,
`examine-minigame.js`).

**Completion.** The minigame sets `this.gameResult` and calls `this.complete(true)` when the page is
saved (step 4). `complete()` emits `minigame_completed { minigameName, success, result }` through
`window.eventDispatcher` (`minigames/framework/base-minigame.js:84-108`), and `endMinigame` then
invokes `params.onComplete(success, result)` (`minigame-manager.js:204-206`). Closing early calls
`complete(false)`, which emits `minigame_failed`.

```jsonc
// result
{ "landingPageId": "payroll_login", "targetId": "lord",
  "credibility": 87, "gatesPassed": true,
  "choices": { "brand": "accountingnow", "purpose": "payslip", "domain": "d_word",
               "logo": "crisp", "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "tellsFound": ["domain","formOrigin","hoverMismatch"], "inspectionComplete": true }
```

**Bridging to globals.** The scenario reacts with `set_global` (`systems/apply-actions.js:33-40`)
or an objective `onComplete.setGlobal` (`systems/objectives-manager.js:754-756`), for example
`landing_payroll_login_built = true`. No flag is involved in building; if a scenario wants a flag for
"phish landed", that is `01`'s server-validated flow (`flag-station-minigame.js` pattern), and the
builder never judges a flag.

**Cross-component contracts.**

- **`01` (mail client).** The `link` payload (`01`, payloadKit) holds `landingPageId`. `01` loads the
  saved page record, shows its chip as "Link: {shown address}" (the **display text** the player
  writes may name the real brand, the **target** is the look-alike, which is the hover-link lesson),
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
| N1 | `landing-page-builder` overlay (preview, choice panel, step strip, score panel) | New component, house style |
| N2 | `landing-page-model.js` pure scorer + tell table + `describeVictimOutcome` | Unit tests mirror section 4's worked example (34 and 87) |
| N3 | `landing-page-render.js` canvas fake-browser drawer | Shapes and text only; no HTML output |
| N4 | Persist built pages in game state keyed by `landingPageId` so reload keeps them | Shared mechanism with `01` N2 (persisted inbox); learn from the fingerprint reload bug |
| N5 | Step 6 defender inspection (click-to-find tells, decoy padlock, closing five-habits card) | Proposed for reuse by `05` as a change request (see cross-component contracts), not yet in `05` |
| N6 | Scenario-load lint: every `domain`/`realDomain` ends `.example`; **no `name` or domain string contains a word from the validator's real-brand denylist** (checks the whole string, not just the suffix); every string non-empty with no unresolved `{placeholder}`; every non-`unrelated` tier has a defender string | Safety (fictional-brand enforcement + the SecGen blank-message fix) |
| N7 | Concept cards (typo-squat, homograph, padlock, hover-link, right-to-left) as shared content | Also used by `02`/`05` tool cards |

## 7. Reuse across audiences

One data record, one `profile`:

| | Student lab | Awareness | Mission |
|---|---|---|---|
| Choices shown | All seven | Brand, domain, padlock (others fixed to correct) | Domain and wording only; HaX presets the rest |
| Domain menu | Six tricks including homograph | Three tricks (wrong letter, extra word, typo-squat), no homograph | Three, no homograph |
| Meter and per-factor lines | Shown after Score only | Live, with a tell counter | Live |
| Step 6 inspection | Find tells unaided, then closing card | Tells auto-highlighted, tap to read | One-line summary in HaX dialogue |
| Gates | `minDomainTier` 2 to 3, escalating across targets | Off (threshold only) | One target, threshold 60 |
| Concept cards | All five, optional "why" panels | Two (padlock, hover-link) | None; HaX explains |
| Outcome | Metrics line for the Ch. 9 report | "You fooled the system. Could you spot yours?" then flip to `05` | `set_global landing_*_built` gates the next lock |

## 8. Art and audio assets (PixelLab-first, none generated now)

- Fake-browser chrome: window frame, address bar, padlock open/closed/crossed icons, "Not secure" badge — pixel UI, about 8 sprites at native size, scaled 3x.
- Fictional brand logos (AccountingNow, the decoy CloudBox) in three renderings each (crisp, blurry, stretched): produced from one crisp 32x32 source; the blurry and stretched variants are drawn deliberately bad in the renderer, not downscaled (house rule: no downscaling pixel art).
- Page body templates: sign-in, password-expired, payslip-ready layouts (shapes and text lines).
- Step-strip icons (pretext, build, score, send, inspect), tell-found stamp, credibility meter frame.
- Concept-card illustrations: `paypa1` against `paypal`, `rn` against `m`, an address bar with the real name hidden in a subdomain, padlock beside a fake address.
- Audio: reuse existing UI clicks; one soft "found it" cue on a correct tell; nothing new needed.

## 9. Open questions

User-facing ones are copied into `QUESTIONS_FOR_USER.md` as Q07-A to Q07-E.

- OQ1 (→ Q07-A): real brand names in concept-card text. Default: yes, plain text only.
- OQ2 (→ Q07-B): domain chosen from a menu, never typed. Default: menu. Free typing needs a
  similarity scorer and edges toward a look-alike generator.
- OQ3 (→ Q07-C): homograph in the student profile only. Default: yes.
- OQ4 (→ Q07-D): outcome counts in the builder. Default: yes, counts only.
- OQ5 (→ Q07-E): padlock wording and the redirect mention. Default: as written.
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
