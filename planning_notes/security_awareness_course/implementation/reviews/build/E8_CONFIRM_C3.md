# E8 "After the click": confirmation review C3 (design + dialogue)

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Fresh-eyes confirmation pass over both stages together: design cycle 3 and dialogue cycle 2. Every earlier finding was re-checked against the shipped files by grep or line read, not taken on trust. Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. Method and standard: the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, `README_scenario_design.md` "Awareness episodes", and the E8 C1/C2/DIALOG_C1 review files.

Scope read end to end: `scenarios/awareness_e8_after_the_click/{scenario.json.erb, mission.json, ink/anjali_rao.ink}`; `scenarios/awareness_e8_after_the_click_defend/{scenario.json.erb, ink/anjali_rao.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e8/{attack,defend,full_only}.json`; E8's `defendIntro`/`LINES` block in `gen_e8_e17_shells.py`.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both complete; the one expected MI5 social warning on the full shell, detail below); `dialoguelint.mjs` on both folders (full lines=6 max=29, defend lines=3 max=30, `Totals by rule: none`). Not run (per brief): `--skip-ink` set, so no ink compile; no graph; no browser playtest, so timing and the two engine findings (MA3, MI2) are judged from the earlier code evidence, not a rendered image.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total (new)** | **0** | **0** | **0** | **0** |

Carried, not new: MI5 (set-but-unread global, by design) still produces its one expected warning; WC-1/WC-2 (optional dialogue polish) left alone. None is above minor.

## Closure table — every earlier finding

### Design C1 (E8_DESIGN_C1.md)

| Finding | Sev (C1) | Status | Evidence (re-checked this pass) |
|---|---|---|---|
| MA1 — composed phish read "the the SSO move this month … this month" | Major, local | **Closed** | Label now `"single sign-on"` (full `scenario.json.erb:456`, `attack.json:25`). Both pretexts read "We are moving {portal} …" with no leading article (full `:502`, `:515`; `attack.json:49`, `:53`). Grep for "the the" / doubled "this month" / "SSO move this month" across both shells and the fragment: **0 hits**. Fact text and intel label both "single sign-on". |
| MA2 — `flipIntro` ungrammatical | Major, local | **Closed** | `strings.flipIntro` now "This is your email as Ayaan met it. He is the claims handler you sent it to, and this time he signed in." (full `:379`, `defend.json:175`). Subject of "signed in" is clear. |
| MA3 — aftermath push card renders dark/low-contrast | Major, engine | **Closed in code (not visually captured)** | Out of this pass's file scope (engine/CSS). Per C2 the E5-4 `--ui-*`/surface re-point was extended to `.aw-flip-aftermath` in `awareness-skin.css` and the bridge renders the push item. No rendered screenshot exists (suite has no screenshot command). ENG-01 owner may want one eyeball on contrast; nothing in E8's own files to change. |
| MI1 — aftermath heading time vs Sent time | Minor, local | **Closed** | Heading "Now you are Ayaan, and it is just gone three" (`full_only.json:12`, full erb `:349`-region); `fa_sent`/`e8_sent_invoice` stay 15:08. Vague heading, no clash. |
| MI2 — aftermath Sent address in pixel font | Minor, engine | **Closed in code** | Out of file scope (flip-view.js/CSS). Per C2 `aftermathEmailRow` tags the address `aw-aftermath-address` and the CSS sets `font-family: var(--se-font-address)`. No E8 file change. |
| MI3 — seven items vs target six; cut the parcel | Minor, local | **Closed** | `e8_parcel` absent from both shells and `defend.json` (grep: 0). Defend set `e8_used_account` is exactly 6 items: `e8_sent_invoice, e8_reset_confirm, e8_push_abroad, e8_colleague_slip, e8_locked_files, e8_maintenance`. Brief reads "Six things have turned up." in both shells and the fragment (`:103`/`:64`/`defend.json:16`). |
| MI4 — spec generator host line stale (doc) | Minor, needs-user | **Closed (doc)** | Per C1 outcomes the spec §8/§8b lines were synced to the shipped 30-word generator lines. No shipped file affected; doc hygiene. Not re-diffed here (spec out of this pass's scope). |
| MI5 — `phish_takeover_victim_landed` set but never read | Minor, local | **Open by design (documented)** | Still set (full erb) and unread; validator still emits exactly this (issues 23–24, the only social warning on the full shell). Left in place on the standing ruling: E1/E5 do the same and the full playtest bridge reads it as the landing signal. Expected and consistent, not an E8 defect. |
| MI6 — conclusion/host line assume a send | Minor, local | **Closed** | `conclusionScreen.body` reworded path-neutral; host completion ink "you took the red team's seat, then you sorted what turned up in the colleague's account." (`anjali_rao.ink:27`). Neither claims a send, so both hold on no-send/missed paths. |
| MI7 — "report it and leave it be" undersells the password step | Minor, local | **Closed** (residue N1/MINOR-1 also now closed) | Host completion lines and defend after-line say "report it and let the team act" (full ink `:28`, defend ink `:22`, generator `:226`). "Leave the device as it is" is kept only for the device/ransom sign (per-item feedback `_defend/:232`) and the Monday card pairs all three moves correctly (`:294`). |
| MI8 — defend-only shell carries dead flip strings | Minor, local | **Withdrawn (ruling)** | Still present by the generator's documented rule, same as the built episodes. No change, per the C1 ruling. |

### Design C2 (E8_DESIGN_C2.md)

| Finding | Sev (C2) | Status | Evidence |
|---|---|---|---|
| N1 (MI7 residue) — defend-only `defendIntro` framed "leave the device as it is" as the one universal move | Minor, local (generator) | **Closed** | `defendIntro` now "… the one move that works for every real sign is to report it and **let the team act**. Take them at your own pace." in the generator source (`gen_e8_e17_shells.py:280`) and the regenerated defend shell (`_defend/scenario.json.erb:306`). The two are in step; the conflation is gone. |

### Dialogue C1 (E8_DIALOG_C1.md)

| Finding | Sev | Status | Evidence |
|---|---|---|---|
| MINOR-1 (= design N1) — defend-only `defendIntro` universal-move wording | Minor | **Closed** | Same evidence as N1 above: generator `:280` and shell `:306` both read "report it and let the team act". |
| MINOR-2 — full-episode landed-greeting "fell for it" clashes with no-blame register | Minor | **Closed** | `anjali_rao.ink:31` now "your colleague **signed in**, the way most people eventually do." Matches the flip's verb; no blame-tinged phrase left in Anjali's mouth. |
| MINOR-3 — completion line comma splice vs defend's colon | Minor | **Closed** | `anjali_rao.ink:28` now "… is the same**:** report it and let the team act." Matches the defend ink (`_defend/:22`). |
| WC-1 — flip aftermath intro carries the "not carelessness: it was" negative-parallelism shape | Worth considering | **Left (optional, as ruled)** | Still present (`full_only.json:14`, full erb `:351`). DIALOG_C1 judged the empathy beat earns its keep as a single instance; optional, below minor. |
| WC-2 — `perFlagNote` end-punctuation inconsistency | Worth considering | **Left (optional, pre-existing)** | Pre-existing, course-wide pattern (C5-T2); not an E8 defect. Not acted on under the stop rule. |

## Fresh-eyes new findings

None above minor. The lesson is single and repeated (report fast; the report answers five questions; for account-takeover signs change your password on the real site, for device/ransom signs leave the device as it is). The defend set is 6 items with the row-5 ransom / row-6 maintenance calibration mirror and the colleague-slip genuine item, so "anything about IT is bad" and "refuse everything" are both answered pedagogically (the by-design `awareness` scoring note from C1/C2 still stands: refusing everything still scores 100, so the calibration is carried by per-item feedback, not the number — shared with the whole built set, not an E8 defect). Attribution resolves exactly (`Anjali Rao:` → `id: anjali_rao` in both erbs), the hub/sticky-exit/`hub_quiet` structure is intact, the one player choice is first-person spoken, every global the ink reads is declared, and both host inks sit within the 30-word cap. UK English throughout; addresses all `.example`. The completion/greeting/`flipIntro`/`defendIntro` wording is now consistent across the full shell, the defend shell, the generator and the Monday card.

Timing is still unverified (the brief withheld a playtest; the bridge does not time a run). Six items keeps the full episode tighter than the C1 seven, so the 15-minute / 8-minute budgets are plausible, but a timed full-episode playtest remains the honest confirmation — carried from C2, not a new finding.

## Verdicts

- **Design: closed.** All three C1 majors cleared (MA1/MA2 in content; MA3 in engine code), all C1 minors closed/withdrawn/by-design, and C2 N1 closed. Nothing above minor remains. The only standing item is MI5, open by design and consistent with E1/E5.
- **Dialogue: closed.** All three DIALOG_C1 minors (MINOR-1/2/3) closed; the two WC polish items left optional by ruling. dialoguelint clean on both folders, attribution and hub structure correct, teaching content single, correct and no-blame.

E8 is confirmation-clean as the pilot. Recommended before final close (both carried, neither blocking): one timed full-episode playtest to confirm the 15-minute budget, and — if the ENG-01 owner wants certainty — one eyeball on the flip aftermath push-card contrast, since no rendered screenshot was ever captured.
