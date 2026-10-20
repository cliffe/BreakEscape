# 02 — OSINT browser (company site, social media, public documents)

Status: plan, 2026-10-20. Feeds the facts a good pretext needs. Pairs with the intel board (`03`),
which records what the player finds here.
Round 1 reviewed (REVIEW_02_R1.md: 0 blockers, 4 majors, 5 minors) and reconciled against
`00_data_contract.md` (canonical dataset in §1, intel persistence/gating in §5); R1 items folded
in below.

## Its own judged interactions — rules & feedback (BRIEF §4; fixes REVIEW_02 F1)

02 is mostly reading, but two interactions are **judged**, so each has deterministic rules and exact
feedback:

- **Derive the email pattern.** After the player has seen two example addresses on the team page
  (`m.pierce@…`, and e.g. `j.baker@…`), a prompt asks them to complete a third from a name:
  "Sofia Lord's address is ___@accountingnow.example". Correct = `s.lord` (first-initial.surname).
  - Right: "✓ You've worked out the address pattern: first initial + surname." → sets
    `intel_email_pattern` (§5).
  - Wrong (`sofia.lord`, `lord`, `slord`): "Not quite — compare how Melanie's and Jed's addresses are
    built from their names, then try again." No lockout; retry freely.
- **Seeded search.** Typing a seeded query (a name, a handle) returns the authored result set; an
  unseeded query returns "No useful results — try a name or handle you've found." Finding a result
  that carries an `intel` id collects it with the "noted" flourish. Deterministic: results are keyed
  by query string, no fuzzy guessing.

Worked example (the flagship chain, consistent with `00` §1): player reads the team page → sees
Pierce and Baker → derives the pattern (`intel_email_pattern`) → reads Melanie's social post
("Jed's showing me the ropes") → `intel_pierce_trusts_jed` → finds the company-site note (Jed:
"I'll send Mel the Q3 balance sheet Friday") → `intel_pierce_expects_balance_sheet`. Those three are
exactly Pierce's recon prerequisites in `00` §4, so the intel board now flips her card to "Ready to
approach".

## Purpose & audience

An in-world **web browser** the player uses to research a target company and its people, the way a
social engineer does reconnaissance before an attack. Maps to book Ch. 4 (business OSINT), Ch. 5
(social media & public documents) and Ch. 6 (people OSINT). All three audiences; the student lab
goes deepest (metadata, document properties, the mechanics of each real tool named below).

## Player goal in their own words

"Find out enough about this company and its people to know who to hit, and with what story."

## The loop

A browser overlay (house style; a simple address bar + page view + a "bookmarks/sites" strip). The
player visits seeded in-world sites and reads them for facts. Finding a fact the engine marks as
**intel** saves it (persisted global, see Engine wiring) with a little "noted" flourish, and the
fact becomes usable in the composer (`01`) and pretext system (`06`).

Numbered (BRIEF §3): 1. open the browser (company home is the default page). 2. use the address bar
or the sites strip to navigate. 3. read a page; any intel on it gets a "noted" flourish and is
saved. 4. open the document's properties panel to read metadata. 5. do the derive-the-pattern
sub-task when prompted. 6. search for names/handles found so far. 7. return (the intel board shows
what's still missing).

### Layers (each a kind of source, each teaching a real OSINT technique)

1. **Company website** (Ch. 4): staff directory (names, roles, email-address format — the big
   prize), org structure, news/press, vacancies (which reveal tech stack and processes), contact
   page. Teaches: deriving the email pattern, mapping who reports to whom, timing from news.
2. **Social media** (Ch. 5): in-world profiles ("FriendFace"/"LinkedIn-like") with posts that leak
   the human details that make a spear-phish land — "can't wait for the Birmingham conference",
   "new to the finance team", a photo with a lanyard/badge, a boss telling an intern to send a CV
   (the Chothia example). Teaches: how ordinary posts become attack material; oversharing risk.
3. **Public documents** (Ch. 5): a published PDF/slide deck whose **metadata** (author, software,
   username, internal path) leaks usernames and the AD/username convention. Teaches: document
   metadata as intel; the value of the `exiftool`-style view.
4. **Search / public mentions** (Ch. 6): a search box that, for seeded queries, returns results
   tying a person to an email, a reused handle across sites, or a public mention. Models what
   theHarvester/Hunter/Recon-ng return (named and explained; the browser *is* the simulated result,
   not a real connector to those tools). Breach-data lookups (a HaveIBeenPwned-style check, available
   as a Recon-ng module in real life) are a **distinct source** — if a scenario wants one, it's its
   own seeded result ("this handle appears in a known breach list"), not conflated with the
   enumeration tools above (REVIEW_02 minor-6).

### Tool framing (model, don't weaponise)

Real tools are named with a one-line "what it does" and the in-game browser shows a *simulated,
seeded* result set, never a live connector: **theHarvester** (emails/subdomains/names from public
sources), **Hunter** (email-address patterns for a domain), **Recon-ng** (a recon framework that
automates the above), **Maltego** (link-analysis graphs of people/orgs). The student lab adds a
short concept card per tool. No tool is runnable; the learning is *what they'd return and why that
matters*, plus the defensive takeaway (how much your org leaks).

## Scenario-authored data

Staff entries carry a stable `id` (the join key 03's people cards merge on), and the data matches the
canonical dataset in `00_data_contract.md` §1 so the recon→phish chain is discoverable end to end
(fixes REVIEW_02 F4):

```jsonc
"osint": {
  "sites": [
    { "id": "company", "url": "accountingnow.example", "type": "company-site",
      "pages": [
        { "id": "team", "title": "Our Team", "staff": [
            { "id": "pierce", "name": "Melanie Pierce", "role": "Finance",
              "address": "m.pierce@accountingnow.example", "intel": ["pierce_role","email_pattern"] },
            { "id": "baker", "name": "Jed Baker", "role": "Finance",
              "address": "j.baker@accountingnow.example", "intel": ["email_pattern"] },
            { "id": "hampshire", "name": "Chris Hampshire", "role": "Careers/HR",
              "address": "careers@accountingnow.example", "intel": ["hampshire_careers"] },
            { "id": "lord", "name": "Sofia Lord", "role": "Intern",
              "address": "s.lord@accountingnow.example", "intel": ["lord_intern"] } ],
          "intel": ["email_pattern"] },
        { "id": "news", "title": "Team notes", "body": "Jed: I'll send Mel the Q3 balance sheet on Friday.",
          "intel": ["pierce_expects_balance_sheet"] },
        { "id": "vacancies", "title": "Careers", "body": "...we use Xero and Office 365...",
          "intel": ["tech_stack","hampshire_careers","careers_attachment"] } ] },
    { "id": "social", "url": "friendface.example", "type": "social",
      "profiles": [
        { "person": "pierce", "posts": [
          { "text": "First week in the finance team — Jed's showing me the ropes!",
            "intel": ["pierce_role","pierce_trusts_jed"] } ] },
        { "person": "lord", "posts": [
          { "text": "Intern life! Finally sorting my payslip on the staff portal 🙄",
            "intel": ["lord_intern","lord_portal"] } ] } ] },
    { "id": "deck", "url": "accountingnow.example/Q3.pdf", "type": "document",
      "metadata": { "author": "mpierce", "software": "Microsoft Excel", "path": "C:\\Users\\mpierce\\..." },
      "intel": ["username_convention"] }
  ],
  "intelFacts": { "email_pattern": "Emails are first-initial.surname@accountingnow.example", "...": "..." }
}
```

Each discoverable fact has an `intel` id (the canonical ids live in `00` §1); collecting it persists
a global and populates `03` per the mechanism below.

## Engine wiring

New component `public/break_escape/js/minigames/osint-browser/`, registered and started like the
others (`minigame-manager.js:229`, `minigame-starters.js`). It **reuses the panel chrome and
body-text/markdown rendering** of the `text-file` / `notes` / `examine` overlays; the navigation
shell (address bar, multi-page nav, clickable links, search box, metadata panel) is new work
(N1–N4) (REVIEW_02 minor-5).

Intel flows per `00_data_contract.md` §5, **not** a live cross-overlay event (overlays are modal, so
03 isn't listening while the browser is open — REVIEW_02 F2). On collecting a fact the browser calls
`applyActions([{ type:'set_global', key:'intel_<id>', value:true }])` (`apply-actions.js:33-43`),
which persists to `gameState.globalVariables` (restored on reload) and emits
`global_variable_changed:intel_<id>`. 03 rebuilds from those persisted globals when opened; the
`intel_collected` event is live-UI flourish only. Downstream gating is **explicit** on named globals
(REVIEW_02 F3): e.g. 01's composer reveals Pierce once `intel_pierce_role` is set, and a target may
set `requiresIntelToAttempt` for a hard gate — each scenario states whether intel is advisory or
gating. No flag involvement.

### New engine work

| # | Item |
|---|------|
| N1 | `osint-browser` overlay: address bar, page renderer for site/social/document/search types |
| N2 | Intel-fact detection on page view / search query → emits intel event, sets global |
| N3 | Document-metadata view (the "properties" panel) for `document` sites |
| N4 | Seeded search results keyed by query string |

## Reuse across audiences

- **Student lab:** all four layers, metadata view, tool concept cards, a "derive the email pattern"
  sub-task the player must *reason* (not just read) to complete.
- **Awareness:** company site + social only, fewer facts, the lesson is "look how much is public".
- **Mission:** a couple of pages gating one pretext; HaX points the player at the site in dialogue.

## Assets

- Browser chrome, site/page layouts as pixel UI (PixelLab); a "FriendFace"/profile template; a
  document-properties panel; small favicons per site.
- Reuses character portraits for staff where present.

## Open questions

- OQ1: how much reasoning vs reading for "derive the email pattern"? Default: show two example
  addresses, player types the pattern / picks the right derived address for a third person. Teaches,
  doesn't just reveal.
- OQ2: do we simulate rate-limited/partial tool output (realism) or give clean results? Default:
  clean for awareness, one "partial/ambiguous result" in the lab to teach that OSINT is messy.
- OQ3 (→ user Q3): real-staff OSINT stays out of scope; this browser is fictional targets only.
