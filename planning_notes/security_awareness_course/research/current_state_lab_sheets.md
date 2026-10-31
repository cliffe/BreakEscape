# Current state: lab sheets and field guides

What lab sheets and field guides are today, as found in October 2026 in HacktivityLabSheets and Break Escape. Background for the "should every activity be a game?" answer in `01_LEARNING_DESIGN.md`.

## HacktivityLabSheets

- A static Jekyll site (the `github-pages` gem), published to GitHub Pages at `cliffe.github.io/HacktivityLabSheets/labs/<category>/<slug>/`.
- Labs live in `_labs/<category>/<file>.md` with front matter: title, description, author, licence, type, tags, categories, overview, CyBOK, difficulty and others. The layout displays title, description, overview, author, licence, difficulty, duration, prerequisites, CyBOK and tags.
- Categories include `cyber_security_landscape`, `introducing_attacks`, `security_informed_safety` and `safetynet` (field guides).
- A `?embedded` query string hides the header, footer, title and metadata.

### What a page can do

| Feature | State |
|---|---|
| Callout boxes (Action, Tip, Warning, Hint, Note, Question, Flag) | exists |
| Collapsible sections (`<details>`) | exists, unstyled |
| Images with captions | exists |
| Video | YouTube links only, turned into an iframe. No `<video>`, no caption files, no transcripts |
| Code blocks with copy buttons | exists |
| Mermaid diagrams | exists |
| Quizzes or self-check scoring | not found. "Question" boxes are static; answers hide in `<details>` |
| Tabs | not found |
| Forms, completion tracking, anything recorded | not found |
| Dark and light theme | exists (dark by default) |
| Print styles | minimal |

### Accessibility issues in the theme (worth fixing under HA-23)

- Focus outlines are removed for links and buttons.
- The theme toggle has no accessible name.
- YouTube iframes have no title.
- Callout labels ("Tip:", "Note:") are removed on render, leaving only an emoji or colour to show the type.
- No skip link; no reduced-motion handling.
- Most images have empty alt text (321 empty, 66 with text across `_labs`).

## Mission lab sheets in Break Escape

- Written with the `mission-lab-sheet` skill (`.claude/skills/mission-lab-sheet/SKILL.md`), in full mode (concepts, worked examples, staged hints, reflection) or practical mode (a focused walkthrough).
- Hints come in three tiers per stage: a visible hint, a collapsed Nudge, a collapsed Recipe or Steps. Sheets never print an answer or a flag, and never steer moral choices.
- The SIS lab sheets (`scenarios/sis01_healthcare/labsheet.md`, `scenarios/sis02_energy/labsheet.md`) are about 1,000 lines each.
- A mission's sheet is linked by `lab_sheet_url` in `mission.json`. Hacktivity shows it as "Lab Sheet" in courses and "Walkthrough" in game events.

## Inside the game

- A `lab-workstation` object opens a URL in a near-full-screen iframe with an "Open in new tab" button; game input is paused while it is open and the scroll position is kept (`public/break_escape/js/utils/lab-workstation.js`, `systems/interactions.js`).
- The in-game popup is always titled "Lab Sheet". The game doesn't add `?embedded`, so the sheet shows its own header inside the game.
- The `lab_*` scenarios place a "Lab Sheet Workstation" in a room.

## Field guides

- In-universe SAFETYNET reference sheets that teach the technique a challenge needs without spoiling the mission (`docs/FIELD_GUIDE_style_guide.md`): a handler note, then a field guide extract (quick reference, procedures, common patterns, troubleshooting), 2 to 4 pages.
- Published as `game_fragment: true` pages under `_labs/safetynet/`.
- Delivered in game by the handler's phone: the handler holds `lab-workstation` items with a `labUrl`, and an ink choice gives one to the player (`README_scenario_design.md`, "field guides").

## Ink conversions of lab sheets

`story_design/ink/lab_sheets/*.ink` converts ten lab sheets into instructor dialogue (for example `phishing_social_engineering.ink`, "Game-Based Learning replacement for lab sheet"): a topic hub where the player picks what to learn next, with progress variables. The `lab_*` scenarios use the same pattern with an `instructor` NPC. This is the starting point for the mentor explainer pattern (EX-01), although those scripts are lecture-length and attacker-side, and the awareness course needs short, defensive explanations with visual aids and a check question.

## Awareness content that already exists

None written for non-technical staff. The nearest:

- `_labs/cyber_security_landscape/3_phishing.md`: phishing from the attacker's side (spoofed email, malicious macros, VM flags).
- The SIS information packs: spear-phishing as an entry point, MFA, ransomware, UK GDPR notification, staff awareness requirements, social engineering by phone, a USB drive by courier.
- `_labs/introducing_attacks/m03_ghost_in_the_machine.md`: social engineering, visitor badges, RFID cloning.
- `_labs/safetynet/lockpicking.md`, `rfid-cloning.md`: physical security from the attacker's side.
- `systems_security/1_authentication.md` and the password cracking field guides: passwords from a technical angle.

Not covered anywhere: password managers and passphrases for users, staff incident reporting, clear desk and tailgating policy, insider risk for staff, business email compromise, phone and text scams.
