# 07 — Landing-page builder (credential-harvest, abstracted)

Status: plan. Current. Last in the build order (most new UI, least reuse). Feeds the mail client
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
  `<a>`, `<button>`, `<iframe>`, `<script>` element or `contenteditable` attribute**, and no function serialises
  it. These are tag names, not ARIA roles: the step 6 hot-spots are `div` elements with `role="button"`,
  which are allowed. A test walks the preview's DOM after every step and fails on any of those (N3; it needs
  a DOM, which N3 supplies with `jsdom`).
- **Nothing captures the player.** The page has no form controls, so the player types nothing into it.
  When a victim "visits" or "submits", the game flips a boolean, prints a result line and, on the first
  submitted sign-in, adds the page's authored note to the player's notes (section 5, `capture`). That
  sign-in belongs to a fictional NPC in the scenario. No value is read from a form, written to the page
  record, sent or logged.
- **No network.** Nothing in the component makes a request. Domains are strings in scenario JSON.
- **Fictional names and addresses.** Every domain, address and account is invented, and every one ends
  `.example`. Brands are invented too, and so are their looks: each brand has a `generic` or `parody` look
  (section 8), and no look copies a real product's name, layout, colours or logo. The lint denylists real
  brand names in domain, address and brand `name` fields (section 5), so a real name cannot reach a domain
  or a brand. Two controls enforce it, and this section says plainly where each runs and what it misses.
  - **Offline lint (N6).** The checks live in `scripts/validate_social/landing.rb` (`00` S11, `IMPLEMENTATION_PLAN.md` D1). `scripts/validate_scenario.rb` requires that file and runs the checks under `--strict-social`. They are tested by a Node test that calls the
    lint functions in-process (`ruby -e 'require validate_scenario.rb'`, the pattern in
    `test/js/validator-carry-over.test.mjs:13-23`, which writes nothing) over inline fixtures and over each
    scenario that carries a `social` key (`test/js/validator-landing-pages.test.mjs`). The test never runs the
    validator's bare command line: without `--no-graph --skip-ink` that rewrites tracked `dungeon_graph.*` and
    `ink/*.json` files. **Nothing runs those tests automatically today**: `.github/workflows/ci.yml` has a
    `bin/rubocop` lint job and a `bin/rails test` job and no Node step, the `test:js` script in `package.json`
    runs a single file, and no Rails test calls the validator. The validator exits 1 on a structure, schema or
    ink compile error (`scripts/validate_scenario.rb:4928, 4964, 5081`; `--skip-ink` skips the ink compile) and
    on bad arguments or a missing file; every other finding, including the `social` lints, is printed and the
    run still ends `exit 0`. N6 therefore includes engine work (`00` S11): a **social-lint mode**,
    `--strict-social`, which runs the `social` lints and exits 1 when any of them reports an error, and a
    **CI job that has both runtimes**. The job reuses the existing jobs' setup: the `sqlite3 libsqlite3-dev`
    apt packages and `BUNDLE_BUILD__SQLITE3: "--enable-system-libraries"` on the `ruby/setup-ruby` step (Ruby
    at the repo's version, `bundler-cache`), so `json-schema` and the `sqlite3` gem build as they do in
    `ci.yml`; Node 20 from `actions/setup-node`, pinned to a release the chosen `jsdom` supports; `npm ci`,
    which needs a committed `package-lock.json` (it is in `.gitignore` today, so N6 un-ignores it, regenerates
    it after `jsdom` is added and commits it, rather than using the non-reproducible `npm install`); then the
    Node tests as `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs` (Bundler's
    `RUBYOPT` reaches the `ruby` each validator test spawns; a plain `node --test` would run those children
    outside Bundler and fail on the missing `json-schema` gem), then the validator under `bundle exec` with
    `--strict-social --no-graph --skip-ink` over the scenarios with a `social` key only, without rewriting
    tracked files (see N6). The `social-*` glob holds the safety tests and the pure-module unit tests, all
    named explicitly in N6 so a rename cannot drop one from the run. The tests must not skip silently: when
    `CI` is set, a missing `ruby` or `json-schema` fails the test instead of skipping it, and the job fails if
    the test run reports any skipped test or if any named file is missing. Other scenarios are out of scope:
    several fail the validator today for unrelated reasons. The lint is enforced once that CI job exists, and
    not before.
    The lint requires:
    - **hostname only for the `.example` rule.** For every field on the `00` §11 lint field list the lint takes the **host part**:
      strip any scheme, then take everything before the first `/`, and for an email address everything
      after the last `@`. The host must end `.example`. A path after the host (`/payroll`, `/Q3.pdf`) is
      allowed and does not need to end `.example`; it gets the ASCII check and the denylist check below;
    - **ASCII, with one exception.** The validator renders the ERB and parses the JSON, and a parsed
      string cannot show whether its source was an escape or a raw character. So the lint checks both
      forms: a `browserDomain` and every `realDomain` must be plain ASCII; a `domain` may contain
      non-ASCII only if its option has `trick: "homograph"`, an ASCII `browserDomain` (the `xn--` form)
      that equals the punycode encoding of the `domain` (Ruby's standard library has no IDNA encoder, so N6
      adds a small RFC 3492 encoder to the validator; its test checks that `ledgerw` + U+0435 + `ll`
      gives `xn--ledgerwll-m0h`), and exactly one non-ASCII character that is in the confusable map; and for any such `domain` the
      **raw `.json.erb` text must not contain the parsed non-ASCII string**, only its `\u` escape. A
      homograph written as a raw character therefore fails;
    - **the allowlist runs first, on the raw labels.** Take the host of a menu `domain`, remove the
      `.example` suffix, and split what is left on `.` into labels. Each label, as authored (lower-cased,
      hyphens kept, nothing folded), must either contain the brand's word (`ledgerwell`), or be within
      edit distance 2 of it (`ledgerwall`, `ledgervvell`), or equal one of that brand's authored
      `decoyWords` (`payroll-online`, `account-help`, `login`). This accepts every sample domain in
      section 5 and rejects a free-standing real brand, because a real brand is neither the fictional brand
      word nor on the authored decoy list. The allowlist applies to menu `domain` values only, not to
      `linkText` or `02`'s site urls;
    - **then the denylist runs on folded text.** For every authored address (the host, and the path
      too), NFKC-normalise, map confusables (Cyrillic and Greek to Latin, `1`/`l`/`I`, `0`/`o`, `rn` to
      `m`, `vv` to `w`), then match a denylisted real brand (PayPal, Microsoft, the big UK banks and the like) against
      each folded label and against the folded concatenation of all labels with hyphens and dots
      removed. The concatenation catches a brand split across labels. `decoyWords` go through the same
      fold and match. The denylist and confusable map live in the validator, not in a scenario, so one
      scenario cannot quietly shorten them; `decoyWords` are authored and reviewed by hand;
    - **no real-brand domain in the fields the lint reads.** The fields are the single list in `00` §11
      ("Lint field list"), which this document does not restate: it covers every authored address, domain and
      link field (including `social.people`, contact, account, `provides` and staff-block addresses) and the
      host-shaped tokens and brand words in `social.conceptCards` text. The host-only `.example` rule, the ASCII check and
      the denylist apply to every field on that list; the allowlist applies to menu `domain` values only. A real
      domain such as a bank's or a mail provider's fails the `.example` rule in any of them. The lint does not
      read other prose (page block text, posts, seeded mail bodies, templates, replies); that is reviewed by
      hand, and this doc claims nothing about it.
      A **host-shaped token** is a hostname in a URL or address field, or, in card text, a dotted token
      whose last label is a public top-level domain from a short list kept in the validator (`com`, `net`,
      `org`, `uk`, `io`, `co`, `info`, `biz`, `eu` and the like; `example` is not on it, and every token
      ending `.example` passes). Filenames such as `Q3.pdf` and `CV.docx` (their endings are not on the
      list), the pattern phrase `first-initial.surname`, and the local part of an address such as
      `m.pierce` are therefore not host-shaped and are never flagged.
  - **What the offline lint does not do.** It does not run when a scenario loads. `validate_scenario.rb`
    is a command-line tool with no caller in `app/`, `lib/` or the browser, and the server sends the
    scenario's `social` block to the client unvalidated (`game.rb`, `filtered_scenario_for_bootstrap`
    strips only room contents, `flags` and `targetFlags`). It protects the repository from an author's
    mistake. It does not stop a hand-edited scenario served from elsewhere. It also misses a real brand
    that is neither on the denylist nor in its confusable map, and it judges concept-card text only for host-shaped tokens and denylisted brand words, so the rest of the prose
    is reviewed by hand.
  - **Runtime guard (N6b, engine work).** `landing-page-model.js` refuses to score or draw any domain
    that is not on the page's authored menu or whose host does not end `.example`, and draws a "blocked"
    placeholder instead. This is a suffix and membership check only, and N6b lists its unit test. It cannot judge brands, which is why the offline
    lint carries that part.
  - Card text (the `text` of an entry in `social.conceptCards`, `00` §11) uses only invented brand names,
    so a typo-squat card shows `ledgerwall` against `ledgerwell`, not a real service. The lint reads
    card text for host-shaped tokens (defined above), each of which must end `.example`, and for brand words, which must not match the denylist after the same fold and match as addresses. A bare word such
    as `ledgerwall`, or an ending that starts with a dot such as `.co.uk`, is not host-shaped. Other card prose
    is reviewed by hand. The domain checks above read the brand menu and every other
    authored address. Outside the cards, prose may name the generic software the
    OSINT pages and fields mention (`Microsoft Excel`, `Xero`, `Office 365`, in `02`'s sample data and
    `00` §1's `tech_stack` and `username_convention` facts). Those are product names, not domains or
    addresses; the denylist does not read them and a reviewer checks them by hand.
- **No operational how-to.** The game says that look-alike domains, homographs and cheap
  certificates exist and shows what they look like. It does not say where or how to register,
  host, obtain a certificate for, or mail one.
- **Attacker-first, defender-closing.** Every page the player sends can then be inspected as the victim
  (section 3, step 6), whether or not it landed: the Inspect step is offered as soon as a send carrying the
  page has been recorded. A player who attaches a weak page anyway is the one who most needs to see how to
  catch it.
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
text in Source Sans 3 (`00` §6).
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
player can change anything until they press Score. A change made **after** a Score marks that score stale
(see Step 3). Every change, before or after a Score, is also written to the draft store (section 5), so the choices come back when the builder reopens.

1. **Brand** — which service to imitate. Several invented brands are offered, each with its look
   (section 8); only one matches the pretext.
2. **Page purpose** — "Sign in", "Password expired", "Payslip ready". One fits the story.
3. **Domain** — a short list of addresses (chips set in Source Sans 3, so `rn` and `m` or `vv`
   and `w` can be told apart), each tagged with its trick (real, typo, extra word,
   hidden-in-subdomain, look-alike letters, unrelated). The real domain is listed but locked:
   "You don't own this. Only the company does." That lock is the point of the lesson. An option with a
   `browserDomain` also shows it on a second, smaller line, "Some browsers show it as ...", as a contrast
   and not a replacement.
4. **Logo** — "Crisp official", "Blurry copy", "Stretched copy", "No logo".
5. **Wording** — three short page-copy variants: matches the pretext's tone, generic, or one
   with spelling and grammar slips.
6. **Form fields** — tick which fields the page asks for (email, password, one-time code, card
   number, national insurance number). The real service asks for a known set.
7. **Padlock** — "Show a secure padlock" on or off. A note says: *a padlock means the connection is
   private to whoever owns the address; fake sites can show one.* The fake
   browser frame is generic (it does not copy any one browser), and strings call the icon "padlock" or
   "secure-connection icon" because browsers have changed how they draw it. Check the wording against
   current browsers before it ships. This is a pre-ship check, not a design question.

A **Tell counter** (optional, on for early teaching) shows how many giveaways the current page has,
without naming them. Each chip has a one-line teaching note, shown on hover and behind a visible "?"
button, since hover does not exist on touch.

### Step 3. Score
Press Score. The game shows the **credibility meter** (0 to 100), the target's threshold as a line
on it, and the per-factor checklist (section 4). Verdict line is one of three strings (section 4).
If below the line the player can edit and re-score. No attempt limit, no dead end.
**A page can only be attached with the score for its current choices.** Any change to a choice after Score
greys the meter and checklist ("Score again"), hides the Attach button until the next Score, and writes the
changed `choices` to the page record with `meetsThreshold: false` and `built: false`, so the stored record
never pairs new choices with an old credibility. The record is therefore always a pure function of the
choices that were last scored, or is marked unscored. Each Score updates the
page record (section 5) with `built: false`, so the scored choices survive a close. The draft store (section 5) holds the latest choices, scored or not. Score writes only `pageId`,
`targetId`, `choices`, `credibility`, `gatesPassed`, `meetsThreshold` and `built`. It **preserves**
`victim` and `tellsFound`: re-scoring never clears the victim record, so Inspect and the report's
`Visited`/`Submitted` survive a reopen. The model exports `applyScore(existing, result)`, which returns
the merged record, and the builder stores that. Only `betterVictim` ever changes `victim`. The stored
`victim` describes the page as it was sent (each sent record also keeps its own `link.domainId`, so a
replay is unaffected by a rebuild); step 6 recomputes the tells from the current choices and counts only
the stored `tellsFound` ids that still apply to them.

### Step 4. Send
After a Score of the current choices (never after a later change, Step 3), the button is **Attach to email** once the score meets the threshold and every gate passes,
and **Attach anyway** below the line (same control, relabelled, so a player can experiment). Either way
the page record is marked `built: true`, the kit item `kit_payroll_page` resolves to it, and
`landing_payroll_login_built` and `landing_payroll_login_domain` are set (section 5). The overlay closes.
If the builder was opened from the mail client's Attach menu, the mail client reopens with its draft
restored and the link attached (S12, section 6). The client decides whether to attach from the page
record (`built: true`) or from the `linkInfoFor` result the builder returns as its `gameResult`, never from
the `landing_<pageId>_built` global. The global stays true after a first attach even if the player later
reopens the builder, presses Score (the record goes back to `built: false`) and closes without
attaching. If the builder was opened from a workstation, the player carries on to the mail client
themselves. The mail client (`01`) fills `message.linkInfo` from `linkInfoFor`
(section 4) and the rules engine (`04`) judges `linkCredible`. A below-threshold page therefore fails
`linkCredible` and the target's in-character reply says why. Nothing is blocked. Closing the overlay
without attaching keeps the draft choices (section 5) and is a normal exit (section 6), not a failure.

### Step 5. The outcome report
For every send that carries this page, landed or not, the mail client calls back into this component for
the result line (the capture is **simulated**):

> `Sofia Lord opened your link.` / `Sofia Lord signed in on your page. (Simulated: her sign-in is now in your
> notes. Nothing is sent or collected.)` / `Sofia Lord closed the tab at the address bar.`

The result is a record `{ visited: bool, submitted: bool, noticed: bool }` and a count line for the
scenario's metrics report (book Ch. 9): `Visited 1 · Submitted 1`. The count line has no "Reports" figure,
because the lab does not measure whether staff would report. The count is per page, not per send: each page adds at most 1 to Visited and at most 1 to Submitted, however many sends carried it. The rule is deterministic, with no
randomness, and takes `landed` as an input:

| Case | visited | submitted | noticed |
|------|---------|-----------|---------|
| `meetsThreshold` true and the email landed | true | true | false |
| `meetsThreshold` false (landed or not) | true | false | true (she closed the tab at the address bar) |
| `meetsThreshold` true but the email did not land (it failed for another reason) | false | false | false |

The mail client (`01`) calls `describeVictimOutcome(record, target, landed)` once per send that carries this
page and stores the result in the page record's `victim` field (`00` §11a). **The record keeps the best
outcome across sends.** Outcomes rank `submitted` (2) above `noticed` (1) above nothing (0, all three
false). The model exports `betterVictim(existing, next)`, which returns `next` when its rank is at least
the existing rank and `existing` otherwise, and the mail client stores that. A resend that does not
land, or a later below-threshold send, therefore never erases an earlier success, and the metrics report
(`Visited`, `Submitted`) reads the same stored record. The first send always writes an entry, even an
all-false one, so Inspect (step 6) is reachable after any send. This is the only trigger; `01` and this
document describe the same one. A below-threshold page never
lands for a target whose required factors include `linkCredible`, which is why the `noticed` row is
reached by an "Attach anyway" send and not only by a landed one.

**The capture note.** The first time the stored outcome becomes `submitted`, the mail client adds the
page's `capture` note to the player's notes, once (N11). A `noticed` or non-landed send adds nothing, and
a later `submitted` send adds nothing more. The note is authored scenario text, not anything the player
entered. It names the captured account and holds no password value; the player never types it.
The send path in `01` (section 3, item 2) makes the call.

### Step 6. Inspect your own page (the defender flip)
The player reopens the saved page from the workstation as the **victim's browser** (the Inspect button
appears once the page record has a `victim` entry, that is, once any email carrying the page's link has
been sent, landed or not; the report's victim lines use the best-outcome `victim` record) and is asked: "Find the giveaways."
The player selects parts of the page (address bar, padlock, logo, form, wording). Each part is a focusable
element inside the preview (a `div` with `role="button"` and `tabindex="0"`, not a form control, inside a preview container that has
`role="group"` and not `role="img"`, because `img` hides its children from assistive technology), so the
step works by keyboard, by touch and through the playtest bridge. Each correct pick confirms a tell and
shows its defender string (section 4); wrong picks say what was fine. The link tell has a **Show the link
target** button in the choice panel (not inside the preview, which holds no `<button>`), because hovering
does not exist on touch. The step ends when every tell the page has is
found, or the player taps **Show me**. A closing card
lists the **five habits** that beat this attack. The card is the entry `five-habits` in
`social.conceptCards`, so its text is authored in one place and falls under the card rules in section 1:

1. Read the address up to the first single `/`, then find the ending (`.example` in this game; a two-part country ending works the same way). The real site is the single name immediately before that ending, here `ledgerwell.example`. Everything to the left (`login.`, `secure.`, an extra word) is just labels the owner can set to anything.
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
| `form` | 10 | Checked in this order. Any extra sensitive field (card number, national insurance number): 0. Else a real field missing: 4. Else an extra field that is not sensitive (for example `one_time_code`): 5. Else exactly the real service's fields: 10. The 5 is half the form points: one field too many is a giveaway, not a broken page. A missing real field scores less (4), because the page cannot collect what the real sign-in does. |
| `padlock` | 10 | Shown: 10. Not shown: 0. |

Domain tiers are authored per brand (section 5), not inferred, so a reviewer can read them. The
real domain has no tier: it is locked.

| Trick | Example (fictional brand Ledgerwell, real address `ledgerwell.example`) | Tier | Why it gets that tier |
|-------|-----|------|-----|
| Unrelated | `payroll-online.example` | 0 | Nothing like the real name |
| Wrong letter | `ledgerwall.example` (`wall` for `well`) | 1 | One letter off; obvious once read |
| Extra word | `ledgerwell-hr.example` | 2 | Real name present; a skimmer sees it |
| Real name as a subdomain | `login.ledgerwell.account-help.example` | 2 | Fools a skim; fails a careful read |
| Looks-like letters (typo-squat) | `ledgervvell.example` (`vv` for `w`) | 3 | Needs a second look in a small font |
| Same-looking letter from another alphabet (homograph) | `ledgerw` + U+0435 + `ll.example` (written as the escape `\u0435` in the data) | 3 | Identical to the eye where the text is shown as typed (a mail client, a chat message); student lab only |

**How a homograph is shown.** The option's `domain` is drawn as typed, with its Cyrillic letter, in the
bundled face (`00` §6). Source Sans 3 covers Latin and Cyrillic, so the Cyrillic letter is drawn in the face, not in a fallback. The lesson depends on it
looking like its Latin twin. Every text surface shows `domain`: the chip, the address bar, the
checklist and the tells lines. `domain` (with the `\u0435` escape in the data) is also the scoring identity and the lint input.
Where the option has a `browserDomain` (the punycode form, here `xn--ledgerwll-m0h.example`), the chip shows it on a second, smaller line as a
teaching contrast. That contrast is not a claim about every browser or app. The scoring tier models the
as-typed form, where the eye cannot tell, so the defence is the fourth habit (don't sign in from a link),
not better eyesight. The homograph concept card may keep a pixel-art picture of the two forms, The picture
does not stand in for the as-typed form. No raw look-alike character appears in this doc or in the
sample data.

Concept card text for the two top tiers, shown behind the "?" button and on the defender card (plain
language, no instruction): *"A typo-squat is a name one keystroke or one look-alike pair away from
the real one, such as `ledgerwall` for `ledgerwell`, or `rnail` for `mail`. A homograph swaps a letter
for a different-alphabet letter that looks the same, so even a careful eye cannot tell. Some browsers
show these in a coded form (`xn--...`), but not every app does. The defence is not better
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
linkInfoFor(record, pageDef, kitId) → { kitId, pageId, domainId, domain, browserDomain?, credibility, gatesPassed, meetsThreshold }
                                    | { kitId, state: "missing" }   // no record, or record.built is false
```

`record` is the persisted page record, `pageDef` is the page's entry in `social.landingPages` and `kitId`
is the payload-kit item being resolved (`kit_payroll_page`); the record holds none of the last two. `domain` is the
option's `domain` as typed, and `browserDomain` is included only when the option has one. Both are looked
up from `pageDef` by `record.choices.domainId`. `meetsThreshold = credibility >= pageDef.targets[record.targetId].linkThreshold &&
gatesPassed`. The mail client
resolves `kit_payroll_page` to the record in `se_landing_pages` and sets `message.linkInfo` to this
result. The `linkCredible` factor (`04`) passes when `linkInfo.meetsThreshold` is true and fails with
"there's no page behind that link" when the state is `missing`. For a target with an `expectedLink`, a send
with no link at all also fails `linkCredible` (the link is required, `00` §2), so Sofia cannot land without
the stage 4 page; the `linkCredible` tell is present when
`linkInfo.domain` differs from the target's `expectedLink.realDomain` (`04`), whether or not the page
convinced. `04` owns the factor, this document owns the number and the function. `04`'s two feedback
strings for `linkCredible` stay the authoritative reply and red-flag text; the per-factor lines below are
shown in addition, in the builder only.

### Exact feedback strings

Verdict line (one band verdict shown; a failed gate adds its line underneath, it does not replace
the band). The only placeholders in any string are `{firstName}`, `{shown}`, `{real}` and `{linkText}`. `{shown}` is the option's `domain` as typed. `{real}` and `{linkText}` hold authored addresses. All three
render in Source Sans 3, like every other feedback line:

| Condition | String |
|-----------|--------|
| credibility < 40 | `That wouldn't fool anyone.` |
| 40 ≤ credibility, and (credibility < threshold, or any gate fails) | `Some people would fall for it. Not {firstName}.` |
| credibility ≥ threshold, every gate passes | `Convincing enough for {firstName}.` |

The bands cover every case: below 40 is the first row whatever the gates say, and a page at or above the
threshold that fails a gate takes the second row, with the gate line underneath. In the lab, `d_letter`
(tier 1) with every other choice perfect scores 75, above Lord's `linkThreshold` of 70, but tier 1 is below
her `minDomainTier` of 2: the player sees the second-row verdict and the careful-reader gate line, and the
button stays **Attach anyway**.

Per-factor checklist lines (✓ full, ~ partial, ✗ fail). The second string is the **step 6 defender
line**, shown by the builder only. `05` has its own chips and draws on `00` §2's red-flag library; where
a tell overlaps (look-alike domain, link mismatch) both sides use that library's wording, and the lines
below that are not in the library (`formOrigin`, `hoverMismatch`, the per-factor lines) stay in this
builder.

| Factor and result | Builder line | Step 6 defender line (builder only) |
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
| `form` ~ (extra field) | ~ Form: asks for a field the real sign-in does not use. | The sign-in asks for a field the real one does not use. |
| `form` ✗ | ✗ Form: asks for more than a sign-in ever should. | A sign-in page asking for card or national insurance numbers. |
| `padlock` ✓ | ✓ Padlock: shown. (It would be shown on any address with a certificate, real or not.) | — |
| `padlock` ✗ | ✗ Padlock: missing. The browser says "Not secure". | The browser warns "Not secure" on a page asking for a password. |

Tells that come from the score carry the factor's id (`brand`, `purpose`, `domain`, `logo`, `wording`,
`form`, `padlock`) and show that factor's step 6 defender line from the table above; `tellsFound` in the
record uses these ids plus the two page tells below (`formOrigin`, `hoverMismatch`), so a stored value is
any subset of those nine ids. In addition, two **tells that every page has**, however good the score (because the
attacker cannot own the real domain), checked in step 6:

| Tell id | Defender string |
|---|---|
| `formOrigin` | The form belongs to `{shown}`, not to `{real}`. Whoever owns that address receives what you type. |
| `hoverMismatch` | The link in the email says `{linkText}` but hovering shows `{shown}`. |

And one **decoy** in step 6: the padlock. Clicking it when the page has one shows *"Fine. But a padlock
is on the fake page too. It only means the connection is private to whoever owns this address."*

### Worked example

Pretext: Sofia Lord, the intern (00 §1 `lord`, the link/landing-page target), expects a **notice
that her first payslip is ready on the staff payroll portal** — from her `lord_portal` intel ("she
uses a staff payroll portal", 00 §1). The clone imitates the company's own Ledgerwell payroll
portal (`ledgerwell.example`). Her authored `linkThreshold` is 70 and `minDomainTier` is 2 (both
live in this doc's data, keyed by target id `lord`).

`04` carries the `lord` target, with `linkCredible` among its required factors and an `expectedLink`
(`00` §4, §7); this doc only supplies the page-side numbers it points at. Lord's `senderTrust` is backed by
`lord_trusts_portal_sender` and her link by `lord_portal_name`, both granted by the call (`06`), so the page
is judged against intel the player has earned. The score does not read any global: the call changes what
the player knows, not how many points a choice is worth.

**Attempt 1.** The player rushes: Ledgerwell, "Sign in", `ledgerwall.example`, a blurry logo,
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

**Attempt 2.** The player fixes it: Ledgerwell, "Payslip ready", `ledgerwell-hr.example`, crisp
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
becomes **Attach to email**. Had the player picked `ledgervvell.example` (tier 3) the score would
be 100; the choice teaches that a better look-alike is worth the most points of any factor.

**Step 6, inspect.** The page is reopened as Sofia sees it. The player finds:

- Address bar: *"The address is `ledgerwell-hr.example`, not `ledgerwell.example`. Read it from the right."*
- Form: *"The form belongs to `ledgerwell-hr.example`, not to `ledgerwell.example`. Whoever owns that address receives what you type."*
- The email's link: *"The link in the email says `ledgerwell.example/payroll` but hovering shows `ledgerwell-hr.example`."* (The first half is the page's authored `linkText`; the player does not write it.)
- The padlock click shows the decoy line. The player now knows their 87-point page still had three giveaways.

The closing card then shows the five habits (step 6 above), ending: *"Your best page still failed three
checks. The real defence is the fourth habit: don't sign in from the link."*

## 5. Scenario-authored data

All content lives in scenario JSON under `social.landingPages` (`00` §11); the minigame holds none.
Brands, domains, tiers, thresholds, tells and strings are authored. The offline lint (N6) applies the host-only `.example`, ASCII/homograph, raw-label allowlist and fold-and-match denylist rules
described in section 1; the runtime guard (N6b) refuses anything off the authored menu. Neither runs "at
load" in the sense of rejecting a scenario, and section 1 says what they miss. The example clones the
company's own Ledgerwell payroll portal (`00` §1), the brand Sofia's `lord_portal` intel points at.
An object carries only a pointer, `minigameData: { landingPageId }` (`00` §11).

```jsonc
"social": { "landingPages": [
  {
    "id": "payroll_login",                  // 01's payload kit item kit_payroll_page: { kind:"link", landingPageId:"payroll_login" } (00 §11a)
    "linkText": "ledgerwell.example/payroll",   // authored: the address the mail client shows for the link; the player never writes it
    "pretext": {
      "brandId": "ledgerwell",              // the service the story names
      "purposeId": "payslip",               // what the email promises the page shows
      "tone": "formal",                     // which wording variant matches
      "story": "a staff-portal notice that her first payslip is ready"   // scorer's key; never shown as UI text
    },
    "brands": [
      { "id": "ledgerwell", "name": "Ledgerwell", "look": "generic", "realDomain": "ledgerwell.example",
        "realFields": ["email", "password"],
        "decoyWords": ["payroll-online", "account-help", "login"],   // lint allowlist (section 1)
        "domains": [
          { "id": "d_unrelated", "domain": "payroll-online.example",      "trick": "unrelated",    "tier": 0,
            "minProfile": "student" },
          { "id": "d_letter",    "domain": "ledgerwall.example",         "trick": "wrong-letter", "tier": 1 },
          { "id": "d_word",      "domain": "ledgerwell-hr.example",       "trick": "extra-word",   "tier": 2 },
          { "id": "d_sub",       "domain": "login.ledgerwell.account-help.example",
                                                                          "trick": "subdomain",    "tier": 2,
            "minProfile": "student" },
          { "id": "d_vv",        "domain": "ledgervvell.example",        "trick": "typo-squat",   "tier": 3 },
          { "id": "d_homo",      "domain": "ledgerw\u0435ll.example",
                                 "browserDomain": "xn--ledgerwll-m0h.example",
                                 "trick": "homograph",    "tier": 3,
            "minProfile": "student" }       // hidden below the student profile; \u escapes only. Options without minProfile show in every profile
        ] },
      { "id": "cloudboxy", "name": "CloudBoxy", "look": "parody", "realDomain": "cloudboxy.example", "realFields": ["email", "password"],
        "domains": [ /* a decoy brand: wrong for this pretext. Its menu is omitted from this sample; it has the same shape as Ledgerwell's, passes the same lint, and is partial here */ ] }
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
    "conceptCards": ["typo-squat", "homograph", "padlock", "hover-link", "right-to-left", "five-habits"],   // ids into social.conceptCards (00 §11)
    "capture": { "address": "sofia.lord@ledgerwell.example", "note": "Sofia Lord's staff portal account, sofia.lord, was captured by your page. Report it. Don't use it." },   // not in the awareness profile; see "Capture" below
    "profile": "student"                    // student | awareness | mission; see section 7
  }
] }
```

The builder never reads the target's secrets: it reads only `linkThreshold` and `minDomainTier`,
keyed by the `04` target id (`lord` here). **The builder is only launched for a target in the page's
`targets` map.** `meetsThreshold` reads `targets[record.targetId]`, so a `targetId` with no entry would
leave the threshold and `minDomainTier` undefined. Both ways in enforce it: the workstation starter takes the page's only `targets` key (a `page-builder`
object carries just `{ landingPageId }`, so the validator requires any page that a `page-builder` object
names to have exactly one key; a multi-target page is built only from the composer, which knows the
target), and the mail composer offers "build/attach page" for a page only to targets that are keys of
that page's `targets` map (`01`), so composing to Pierce or Hampshire never shows the link item for
this page. The builder also refuses a `targetId` outside the map (it shows "This page isn't for this
person" and closes), as a backstop. The persisted record's `targetId` is therefore always a key of the
map (`00` §11a); the lab's page has exactly one key. `04`'s `lord` target owns the `linkCredible` factor
and `expectedLink` (`{ brandId, realDomain }`, `00` §4, §7).

**The domain menu and the other docs.** The student profile offers six domain ids: `d_unrelated`,
`d_letter`, `d_word`, `d_sub`, `d_vv`, `d_homo` (`00` §13). The awareness and mission profiles offer a
subset (`d_letter`, `d_word`, `d_vv`); `d_unrelated`, `d_sub` and `d_homo` carry `minProfile: "student"`
to hide them there. Because a below-threshold page can be attached, any of the six can
reach `05`, so `05`'s `playerSentAuth` must carry a row for every one of them and for every mail account
id the lab declares (`guest`, `freemail`); this doc keeps the ids stable and `05`'s validator rejects a
missing one. `domainFrom: "landing_domain"` in `05` reads the sent record's `link.domainId`, which `01`
copies from the page record at send time, so rebuilding the page afterwards does not change an
earlier replay. It reads neither the global nor the live page record.

Homograph strings are authored with `\u` escapes and an explanatory note, never typed free-hand. The
offline lint accepts a non-ASCII parsed `domain` only for `trick: "homograph"` and only when the raw
`.json.erb` text holds the escape, not the character (section 1). The real-brand denylist and confusable
map are validator-level, not a per-scenario field.

**Capture.** `capture` is optional, and the awareness profile has none. `address` is linted like every
address field (`00` §11, lint field list). `note` is authored text, reviewed by hand. It names the captured account and holds no password value.
The player never types it. The send path in `01` (section 3,
item 2) adds the note on the first `submitted` outcome (the capture note, N11). No global is set for it, and the page record gets no field.

**Globals.** When the page is attached the builder sets `landing_<pageId>_built` (boolean, for example
`landing_payroll_login_built`) and `landing_<pageId>_domain` (the chosen domain option id, such as
`d_word`; colon-free) through the shared writer (`00` S3). Both are declared in `globalVariables`. `10`
uses `landing_payroll_login_built` for its task and `landing_payroll_login_domain` is listed beside it
(`00` §11 globals table).

**Stored record.** One record per built page lives in `globalVariables.se_landing_pages[<pageId>]`, in
the shape `00` §11a defines:

```jsonc
{ "pageId": "payroll_login", "targetId": "lord",
  "choices": { "brand": "ledgerwell", "purpose": "payslip", "domainId": "d_word", "logo": "crisp",
               "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "credibility": 87, "gatesPassed": true, "meetsThreshold": true,
  "tellsFound": ["formOrigin","hoverMismatch"],     // part-way through step 6; the full set for this page is domain, formOrigin, hoverMismatch
  "victim": { "visited": true, "submitted": true, "noticed": false },
  "built": true }
```

It holds ids and booleans only, and its keys are closed: `pageId`, `targetId`, `choices` (`brand`, `purpose`,
`domainId`, `logo`, `wording`, `fields`, `padlock`), `credibility`, `gatesPassed`, `meetsThreshold`,
`tellsFound`, `victim` (`visited`, `submitted`, `noticed`) and `built`. The validator reads authored JSON only,
so it cannot see this record. The closed keys are enforced at run time: N2 tests that the record builder,
`applyScore` and `betterVictim` emit no other key, and N4 drops any other key where the record is written or
synced. `se_landing_pages` is declared with
default `{}` under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses
(`siem-dashboard-minigame.js`), so records survive a reload; one small record per page keeps it well
inside the 60 KB `pagehide` flush, which shares one budget with every other global (`state-sync.js`). A
new top-level game-state section would never reach the server (the permitted parameters in
`games_controller.rb` are fixed), which is why this uses a global.

**Drafts.** Choices that have not been scored, and the latest choices after any change, live in
`globalVariables.se_landing_drafts[<pageId>]`. It is declared with default `{}` beside `se_landing_pages`, and each
value holds only the seven `choices` keys (`brand`, `purpose`, `domainId`, `logo`, `wording`, `fields`, `padlock`).
The builder writes it on every change and on close, so reopening the builder, or returning from the mail client,
restores the choices, and a reload mid-build keeps them. The page record is not touched by a draft: it still holds
the last Score (`built: false` after any change, as in step 3).

## 6. Engine wiring

New component folder `public/break_escape/js/minigames/landing-page-builder/`:

- `landing-page-builder-minigame.js` — the overlay, extends `MinigameScene`.
- `landing-page-model.js` — pure `scorePage(...)` (section 4) and the tell list, plus `buildRecord` (the closed record shape in section 5), `applyScore`, `betterVictim`, `linkInfoFor`, `describeVictimOutcome` and `captureGranted`. No DOM, unit-testable.
- `landing-page-render.js` — renders the fake browser from the record into two layers. **Pixel layer:**
  logos, banner and product pictures, and frame icons (padlock open, closed, crossed; "Not secure"
  badge), as `<img>` or a small canvas scaled with `image-rendering: pixelated`. **Text layer:** the
  address bar, the page's visible wording, form-field labels and the concept cards as plain DOM text in
  Source Sans 3 (N8), at native resolution, set with `textContent`. Form fields are drawn as
  styled `div` boxes with a label, never as form controls (the safety constraints in section 1). The
  preview container is a `role="img"` figure with an `aria-label` that describes the page in the build and
  score steps. In step 6 it switches to `role="group"` with the same label, because `img` has presentational
  children and would hide the hot-spots, which are `div role="button" tabindex="0"`. It outputs no HTML a browser would load and has no serialise
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

Params: `{ landingPageId, targetId, returnTo?, onComplete }`; `targetId` is always a key of the page's
`targets` map: the workstation starter reads the page's only key, and the composer launches the builder only for such targets (section 5).
Two ways in: (a) from a workstation object
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
`this.complete(true)` (with `gameResult` set as the block below shows, which the mail client uses to attach the link). `complete()` emits `minigame_completed { minigameName, success, result }` through
`window.eventDispatcher` (`minigames/framework/base-minigame.js`), and `endMinigame` then invokes
`params.onComplete(success, result)` (`minigame-manager.js`). **Closing early is also a normal exit**:
the builder saves its draft choices, sets `gameResult.saved = false` and calls `complete(true)`, so a
close never emits `minigame_failed`. `BaseMinigame.start()` binds a document-level Escape that calls
`complete(false)`, and `disableClose: true` hides the framework's close button as well as that handler
(`base-minigame.js:18-23, 70-80`). The builder passes `disableClose: true`, draws its own visible
**Close** control (touch players have no Esc) and binds its own Escape, in the capture phase, to the
same close. Scenario logic keys on the `landing_<pageId>_built` global, not on the event.

```jsonc
// gameResult is the linkInfoFor output for the stored record at exit, plus two flags:
// saved (true when this session attached the page) and inspectionComplete (true when the step 6
// inspection of the stored page has ended, with every tell found or Show me pressed).
// On attach:
{ "kitId": "kit_payroll_page", "pageId": "payroll_login", "domainId": "d_word", "domain": "ledgerwell-hr.example",
  "credibility": 87, "gatesPassed": true, "meetsThreshold": true,
  "saved": true, "inspectionComplete": false }
// On close, with no page built yet (an earlier attach would instead return its linkInfoFor fields, with saved false):
{ "kitId": "kit_payroll_page", "state": "missing", "saved": false, "inspectionComplete": false }
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
  `message.linkInfo` from `linkInfoFor(record, pageDef, kitId)`, and shows a chip "Link: {linkText}", where
  `linkText` is authored on the page (the player does not write it; it may name the real brand while the
  target is the look-alike, which is the hover-link lesson). `01` stores the picked link in the sent record
  with `link.domainId` copied from the record (`00` §10a). After every send that carries the page,
  landed or not, `01` calls `describeVictimOutcome(record, target, landed)` (exported from
  `landing-page-model.js`) for the step 5 result line and stores the `victim` record (step 5 has the rule). When the stored outcome first becomes `submitted`, it also adds the capture note (N11).
- **`04` (rules engine).** `linkCredible` consumes `message.linkInfo` as in section 4. `linkThreshold` and
  `minDomainTier` live in this doc's data because they are about pages; `04`'s `lord` target is matched by
  `targetId` and owns `expectedLink: { brandId, realDomain }` (`00` §4, §7).
- **`05` (triage defender).** `05` inspects *emails*, with flag chips drawn from `04`'s factors and
  strings from the shared red-flag library (`00` §2). This doc exports `buildSuspectPage(record)` and the
  step-6 `tells` table so `05` can offer a "inspect this page" item from the same record and strings;
  `05` has no such item in the lab. Where the strings overlap (domain look-alike, link mismatch) both
  sides draw on `00` §2's red-flag library, so they cannot disagree. `05`'s `playerSent` replay reads the sent record's `link.domainId`, copied at send (section 5).

### New engine work

| # | Item | Notes |
|---|------|-------|
| N1 | `landing-page-builder` overlay (preview, choice panel, step strip, score panel), with the wiring checklist above | New `minigames/landing-page-builder/`; `minigames/index.js`; `systems/minigame-starters.js`; `systems/interactions.js`; `show.html.erb` |
| N2 | `landing-page-model.js` pure scorer + tell table + `describeVictimOutcome` + `betterVictim` | Unit tests mirror section 4's worked example (34 and 87), the 75-point `d_letter` case (second-row verdict plus the gate line), that `betterVictim` keeps a `submitted` entry over a later `noticed` or all-false one, that `applyScore` on a record holding `victim` and `tellsFound` keeps both, and that a choice change after a Score yields a record with `meetsThreshold: false` and `built: false` (so `linkInfoFor` reports `missing` until the next Score); that an extra non-sensitive form field scores 5, and 4 when a real field is also missing; that no exported identifier of the model matches `/serial|export|download/i`; and that `buildRecord`, `applyScore` and `betterVictim` emit only the closed keys in section 5. File: `test/js/social-landing-page-model.test.mjs` |
| N3 | `landing-page-render.js` two-layer renderer (pixel layer, inert DOM text layer) and the DOM-safety test (`test/js/social-landing-page-render.test.mjs`) that fails on any `a`, `form`, `input`, `textarea`, `select`, `button`, `iframe` or `script` element, or any `contenteditable` attribute, in the preview (tag names, so the `div role="button"` hot-spots pass). The same file greps the builder's folder for `fetch`, `XMLHttpRequest`, `WebSocket` and `sendBeacon` and fails on any match. Its fixtures are the states build, score, step 6 hot-spots, blocked placeholder, the homograph option and the worked-example page, each rendered in the DOM. The test needs a DOM: add `jsdom` to `devDependencies` (today only Playwright is there, and the existing `.test.mjs` files stub `document` by hand, for example `sight-challenge-tutorial-prompt.test.mjs:38`) | New; test in `test/js/`; `package.json` |
| N4 | Persist built pages as ids in the `se_landing_pages` global (section 5), with the 60 KB flush note and a shape guard that drops any key outside the closed set in section 5, where the record is written and where it is synced; the same guard drops any `tellsFound` id outside the nine ids (the factor ids plus `formOrigin` and `hoverMismatch`, `00` §11a) and any draft key outside the seven choice keys, and persists `se_landing_drafts` (section 5) | `state-sync.js` flush; `siem-dashboard-minigame.js` STATE_KEY pattern as the model |
| N5 | Step 6 defender inspection (focusable hot-spots, decoy padlock, "Show the link target" in the choice panel, closing five-habits card); exports `buildSuspectPage` and the `tells` table for optional reuse by `05` | New in `landing-page-builder/` |
| N6 | Offline lint, its test, the `--strict-social` mode and the **CI job that runs them**: the host-only `.example` rule (strip scheme and path; email addresses by the part after `@`); ASCII with the homograph exception and the raw-text escape check; the allowlist on raw labels first (`decoyWords`, brand word, edit distance), then the fold-and-match denylist per label and on the concatenation (section 1); every string non-empty and using only the allowed placeholders (`{firstName}`, `{shown}`, `{real}`, `{linkText}`); the `.example`, ASCII and denylist checks cover every field on the `00` §11 lint field list (the single list; not restated here), with brand `name` checked against the denylist only, and each brand's `look` one of `generic` or `parody`; the concept-card scope (card text is read for host-shaped tokens only, which must end `.example`); every `conceptCards` id on a page resolves; every `targets` key is a target whose required factors include `linkCredible`, and a page has at least one (exactly one in the lab); a `page-builder` object's `landingPageId` names a page with exactly one `targets` key, and that key is a `phishTargets` id; every tier (0 included) has a defender string; `decoyWords` pass the denylist. The inline fixtures in `validator-landing-pages.test.mjs` are: a raw homograph character in a `domain` (fails); the `\u0435` escape for the same letter (passes); the punycode encoder against `xn--ledgerwll-m0h` (passes); a menu domain `paypal.example` (fails the allowlist as a free-standing real brand); `paypa1` and `pay.pal` as labels of a `capture.address` (each fails the denylist, by fold and by concatenation); `Q3.pdf` and a `.co.uk` ending in card text (not host-shaped, pass); a tier with no defender string (fails); a `decoyWords` entry of `paypal` (fails); a card text that names a denylisted brand (fails); and `--strict-social` on a file with a lint error (exits 1) **`--strict-social`** runs the `social` lints and exits 1 when any reports an error (the validator today exits 1 on a structure, schema or ink compile error, `scripts/validate_scenario.rb:4928, 4964, 5081`, and on bad arguments; every other finding falls through to `exit 0`). **CI job**: one job with Ruby (`ruby/setup-ruby` at the repo's Ruby version, `bundler-cache`, plus the `sqlite3 libsqlite3-dev` apt packages and `BUNDLE_BUILD__SQLITE3: "--enable-system-libraries"` env that both existing `ci.yml` jobs set) and Node (`actions/setup-node`); **remove `package-lock.json` from `.gitignore` (line 43), regenerate it after adding `jsdom` (N3) and commit it**, so `npm ci` has a lockfile (`npm install` in the job is not reproducible and is not used); `npm ci`; `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs` (under Bundler so the spawned `ruby` finds `json-schema`; the safety tests are `social-landing-page-model` N2/N10, `social-landing-page-render` N3, `social-landing-page-guard` N6b and `social-osint-address-bar` from `02` N9; the pure-module unit tests are `social-phish-rules` (`04`), `social-triage-scoring` (`05` N4), `social-pretext-judge` (`06` N1) and `social-intel` (`02` N2); the step fails if any named file is missing; a `package.json` script `test:social` runs the same command; Node pinned to 20 with a `jsdom` release that supports it); then `bundle exec ruby scripts/validate_scenario.rb <scenario> --strict-social --no-graph --skip-ink` over only the scenarios whose `scenario.json.erb` has a `social` key. The Node tests fail rather than skip when `CI` is set and `ruby` or `json-schema` is missing, and the job fails if the test run reports any skipped test. Without `--skip-ink` the validator compiles ink into tracked `ink/*.json` (`validate_scenario.rb:709-714`, written beside the source), and `--no-graph` stops `dungeon_graph.*` rewrites; with `--skip-ink`, `check_ink_files` does not run (`:4977-4979`), so the `social` ink lints (`on_email` knot, `email_*` VARs, synced vars) **parse the `.ink` source text directly** and do not depend on compiled output; this is part of S11. The step ends with `git diff --exit-code`. The validator gains the punycode encoder for the `browserDomain` check. Without the job the lint is not enforced. Scenarios that fail today for unrelated reasons are out of scope | `scripts/validate_social/landing.rb` (new; required from `scripts/validate_scenario.rb`, which owns `known_top_level` and `--strict-social`, S11); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; new `test/js/validator-landing-pages.test.mjs` (calls the lint functions in-process or, if it runs the command line, passes `--no-graph --skip-ink`; never the bare command, which rewrites tracked files); `.github/workflows/ci.yml`; `.gitignore`; `package-lock.json` (existing `ci.yml` has Ruby 2.7.8 only in `lint` and `test`, and no Node) |
| N6b | Runtime guard: the model and the renderer refuse a domain not on the authored menu or whose host does not end `.example`, and draw a "blocked" placeholder. Unit test, three fixtures. (a) A menu entry injected straight into the model, bypassing the lint, with host `ledgerwell.test`: the model and the renderer both return the blocked placeholder (`{ blocked: true }`, drawn as the frame with the address bar reading `Blocked address` and no page body). (b) An off-menu domain `payroll-desk.example`, which is valid in shape but not on the menu: the same placeholder. (c) The menu domain `ledgerwell-hr.example`: the page is drawn normally | `landing-page-model.js`, `landing-page-render.js`; test `test/js/social-landing-page-guard.test.mjs`, run by the N6 job's `social-*` glob |
| N7 | Concept cards (typo-squat, homograph, padlock, hover-link, right-to-left, five-habits) as entries in `social.conceptCards` (`00` §11), shown by the shared card renderer that `02` N1 builds; this item adds the builder's cards and the validator check that every page `conceptCards` id resolves | Also used by `02`'s tool cards; validator in N6 |
| N8 | Bundle Source Sans 3 (`00` §6; Regular and Bold, Latin and Cyrillic subsets, OFL 1.1, used unmodified so its Reserved Font Name is respected) and apply `--se-font-readable` to every string the builder shows that holds an authored domain, address, handle or document field, wherever it appears: preview text, address bar, domain chips, the score checklist, feedback lines, tells-panel lines and concept cards; authored domains rendered raw, not via `displayDashes` | `public/break_escape/assets/fonts/`; `css/fonts.css`; `utils/display-dashes.js` bypass |
| N9 | Nested launch and close: return-to for the mail-client round trip (`00` S12), close as a normal exit with its own Close control and Escape, `requiresKeyboardInput: true` | `minigames/framework/minigame-manager.js`, `base-minigame.js` (`disableClose`) |
| N10 | `linkInfoFor(record, pageDef, kitId)`, `describeVictimOutcome` and `betterVictim` in the model, unit-tested against the worked example | `landing-page-model.js` |
| N11 | Capture note: when the stored outcome first becomes `submitted`, add the page's `capture.note` once with `window.addNote`. A pure `captureGranted(before, after)` in the model decides it, where `before` and `after` are the stored `victim` objects, or null when none is stored. Unit test: the first `submitted` adds the note, and a repeat or a `noticed` send adds nothing | `landing-page-model.js` (`captureGranted`); the send-path call in `01` section 3, item 2, and `01` N6, which compares the stored outcome before and after `betterVictim` |

N6 and N6b together are the safety enforcement. The shared engine items they depend on are in `00` §12
(S3 the shared global writer, S11 the validator and schema).

## 7. Reuse across audiences

One data record, one `profile`:

| | Student lab | Awareness | Mission |
|---|---|---|---|
| Choices shown | All seven | Brand, domain, padlock (others fixed to correct) | Domain and wording only; the handler presets the rest |
| Domain menu | Six tricks including homograph | Three tricks (wrong letter, extra word, typo-squat), no homograph | Three, no homograph |
| Brands and looks | Invented brands, each with a `generic` or `parody` look | Same | Same |
| Meter and per-factor lines | Shown after Score only | Live, with a tell counter | Live |
| Step 6 inspection | Find tells unaided, then closing card | Tells auto-highlighted, tap to read | One-line summary in the handler's dialogue |
| Gates | `minDomainTier: 2` for Lord, brand gate on, the lab's one target | `minDomainTier` absent (0), brand gate off (threshold only) | `minDomainTier` absent (0); brand gate on, always passing because the handler presets the brand; one target, threshold 60 |
| Concept cards | All five teaching cards, optional "why" panels, plus the closing five-habits card | Two (padlock, hover-link) | None; the handler explains |
| Outcome | Metrics line for the Ch. 9 report, and the capture note on a submitted sign-in | "You fooled the system. Could you spot yours?" then flip to `05`; no capture note | an `eventMappings` entry on `global_variable_changed:landing_payroll_login_built` completes the page task through `completeTask` (a global alone does not open a lock, README "Objectives") |

## 8. Art and audio assets (PixelLab-first, none generated now)

- Fake-browser chrome: window frame, address bar frame, padlock open/closed/crossed icons, "Not secure" badge — pixel UI, about 8 sprites at native size, scaled 3x. The address text itself is DOM text, not part of the sprite.
- Fictional brand logos (Ledgerwell, the decoy CloudBoxy) in three renderings each (crisp, blurry, stretched): produced from one crisp 32x32 source; the blurry and stretched variants are drawn deliberately bad in the renderer, not downscaled (house rule: no downscaling pixel art).
- Looks: `generic` and `parody` are page layouts drawn from scratch in pixel art. Neither copies a real product (section 1). A `parody` look is an invented exaggeration of a generic layout, such as an oversized padlock and a slogan on a sign-in box; it is never a recognisable real product.
- Page body templates: sign-in, password-expired, payslip-ready layouts (pixel blocks; their text is DOM text).
- Step-strip icons (pretext, build, score, send, inspect), tell-found stamp, credibility meter frame.
- Concept-card illustrations: `ledgerwall` against `ledgerwell`, `rnail` against `mail`, an address bar with the real name hidden in a subdomain, padlock beside a fake address.
- Audio: reuse existing UI clicks; one soft "found it" cue on a correct tell; nothing new needed.

## Visual style

- The built page and the fake-browser frame use the game's pixel-art look: pixel logos for the invented brands, pixel imagery in the page body, and a frame styled like the game UI with `--ui-*` colours.
- Text the player must read or compare is **inert DOM text in Source Sans 3** (`00` §6), not a
  pixel font and not text drawn into the low-res canvas. The scope is every string that holds an authored
  domain, address or handle, **wherever it appears**: the fake page and address bar, but also the domain
  chips in the choice panel, the score checklist, the feedback and tells lines, and the concept cards.
  The player compares look-alike domains (`rn` against `m`, `vv` against `w`, `l` against `1`)
  in exactly those places, so they cannot sit in the theme font. The game bundles `GNF`, `Pixelify Sans` and `Press Start 2P`, and N8 adds Source Sans 3
  self-hosted as woff2 with its OFL text, and declared in
  `css/fonts.css`. Chrome labels and headings that hold no such string stay in the theme fonts.
- Pixel-art imagery makes a built page obviously part of the game, and it cannot be lifted as a working
  phishing page. No look is drawn to pass for a real product. The structural constraints in "Safety design" (no form controls, no export) are what
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
- In the build and score steps the preview is one labelled `role="img"` figure with a text description, so
  a screen reader hears the page as a description. In step 6 it becomes a labelled `role="group"` so the
  hot-spots are exposed as buttons; the DOM test for forbidden elements runs in both states.

## 9. Open questions

The user-facing ones are repeated in `README.md`.

- OQ1: homograph in the student profile only. Default: yes.
- OQ2: are the invented brand and look names clear of real companies and products? Pre-ship check: search before release. Not a design question.
- OQ3: domain chosen from a menu, never typed. Default: menu. Free typing needs a similarity scorer and edges toward a look-alike generator.
- OQ4: should `tier` be authored or computed from edit distance and confusable-character rules?
  Default: authored. Computed tiers are less readable to a reviewer and would need a confusables
  table the game has no other use for.
- OQ5: should a below-threshold page be sendable? Default: yes ("Attach anyway"), so the target's
  in-character reply teaches too. Alternative is a hard block, which reads as a dead end.
- OQ6: should `05` offer page-inspection items from `buildSuspectPage`? Default: not in the lab; the
  exports exist so a later set can.
- OQ7: the page-purpose factor partly overlaps `04`'s `pretextRelevant` (both ask "does this fit
  the story?"). Default: keep both, since one judges the email and one judges the page; revisit if a
  reviewer finds the double count confusing.
