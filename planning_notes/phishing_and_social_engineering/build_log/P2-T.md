# P2-T: Phase 2 OSINT review and playtest

Date 2026-10-21. Review against Phase 2 "Done when" in `IMPLEMENTATION_PLAN.md`, then a headless playtest on the keyless server (:3001). Scenario `test_social_slice`. No game code was edited.

**Verdict: 0 blocker, 1 major, 5 minor.** The Phase 1a steps pass on game 2949 with the three Hampshire facts found by browsing. The packet row's "no blocker or major open" is not met: F1 is still open.

## Checks

| Check | Result |
|---|---|
| `bundle exec node --test test/js/social-osint-address-bar.test.mjs test/js/social-osint-browser.test.mjs test/js/validator-social-osint.test.mjs` | 39 pass, 0 fail, about 4.2 s. "Cancel button not found" / "Minigame started" lines are the usual jsdom noise. |
| `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink` | exit 0. 32 suggestions and warnings, none of them OSINT errors. Four ink `VAR` warnings and four unused call globals belong to the Phase 4 phone stories (`brandt_desk.ink`, `quinn_floor.ink`, `generic-npc.ink`). |
| `tools/playtest/se/bridge-2.jsonl` + `check-bridge.mjs` on game 2950 | 15 evals, 15 passed, 0 failed. One expected reload warning (`waitFor` during navigation, log line 75). |
| Screenshots at 1280×800 and 600×900 | company, careers, social, document (properties open), tools. Looked at. No horizontal scroll at 600 px (`documentElement` and `.osint-browser-game-container` scrollWidth equals clientWidth). |
| `verify-run.rb --tasks` game 2949 | progress recorded, `tasks_completed` 2. |
| `verify-run.rb --tasks` game 2950 (bridge) | exit 1, verdict "BOOTSTRAP ONLY", 0 tasks. The session log is the evidence for that run. Two intel globals are set (`se_intel_hampshire_careers`, `se_intel_hampshire_cv_backlog`); the verdict text does not count globals. |

No SecGen or VM claim in this packet.

## Findings

| Id | Sev | Where | Finding |
|---|---|---|---|
| F1 | major | `public/break_escape/css/minigames-framework.css:21`, `public/break_escape/css/osint-browser-minigame.css:198`, `public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js:543-558` | Domain and address strings inside selectable blocks render in GNF. Phase 2 "Done when" asks for every domain string in Source Sans 3. Design `02` visual style (bios, posts, body text, and any tools result that holds a domain) asks for the same face. |
| F2 | minor | `osint-browser-minigame.js:188` and `:304`; `scenarios/test_social_slice/scenario.json.erb:323` | Site tabs and the page heading show the raw ids `company`, `social`, `deck`. The slice sites have no `name` or `title`, so the code falls back to `id`. The URL under each tab is in Source Sans 3, so the sites can still be told apart. `bridge-2.jsonl` asserts those id labels, so a rename has to update the bridge in the same change. P2-W already noted this. |
| F3 | minor | `osint-browser-minigame.js:372-377`; `scenario.json.erb:116-117` | Morgan Teague's profile requests `teague_headshot.png`. The person has no `avatar`, the file is not in `assets/characters/`, and the response is 404 (twice on game 2951, once per viewport). The error handler sets `visibility: hidden`, which leaves an empty box (`shots/social-1280.png`, `shots/social-600.png`, `shots/play-hampshire-profile-1400.png`). Chris Hampshire's `hampshire_headshot` loads and is visible on that last shot. |
| F4 | minor | `public/break_escape/js/systems/apply-actions.js:57-64`; `osint-browser-minigame.js:597` | The "Ready to approach" toast is only on the `grant_fact` action. The browser calls `grantFact` directly. On game 2949 the eval that granted the third fact recorded `alerts: []` while `target_ready_hampshire` was already true and `ready_hampshire` was `completing`. The in-browser line still says "Noted: …", and the board says she is ready. The task still completed. |
| F5 | minor | `scenarios/test_social_slice/mission.json:3` | The mission description still says the room has "stand-in intel sources". The slice now grants those facts from the browser. |
| F6 | minor | `address-bar.js:16-17`; `scripts/validate_social/osint.rb:410-414`; `designs/00_data_contract.md:1733` | `formatAddress` appends `pages[].path` to the site host, and that field is not on the host lint. `pages[].url` is linted in `osint.rb`, but the contract table still lists only `sites[].url`. The slice does not use `pages[].path`. The document site puts the file in `sites[].url` (`ledgerwell.example/Q3.pdf`), which is linted. P2-W asked for `pages[].url` to be added to the contract; the linter is ahead of the table. |

### F1 evidence

Computed `font-family` in the live browser:

| String | Where | Face |
|---|---|---|
| Address bar `ledgerwell.example`, `friendface.example`, `ledgerwell.example/Q3.pdf` | `.ob-address-text` | `"Source Sans 3", "Segoe UI", Arial, sans-serif` |
| Staff rows `m.teague@…`, `r.shah@…`, `careers@…` | `.ob-staff-address` | Source Sans 3 (company-1280 and company-600) |
| Site URLs and tool labels (`Hunter lookup: ledgerwell.example`) | `.ob-site-url`, `.ob-tool-label` | Source Sans 3 |
| Filename `Q3.pdf` and field values (`mteague`, `Microsoft Excel`, the path) | `.ob-page-title`, `.ob-field-value` | Source Sans 3 |
| Careers paragraph `Send your CV to careers@ledgerwell.example. We read every one.` | `.ob-block-text` | `GNF, monospace` (play2.log line 13 `paraFont`; careers-1280 and careers-600) |
| Hunter result `Most addresses follow first-initial.surname@ledgerwell.example` | `.ob-block[data-id=r_pattern] .ob-block-text` | `GNF, monospace` (play2.log line 13 `resultFont`; tools-1280) |
| Hampshire post text | `.ob-post-text` | `GNF, monospace` (play2.log line 13 `postFont`). That sentence has no domain; design `02` still asks for posts in the readable face. |

`_lines()` adds `ob-readable` for a staff address and a metadata value, and not for a post or the generic paragraph/result line. `.ob-block { font: inherit }` does not override `.minigame-container button { font-family: 'GNF', monospace }` (specificity 0, 1, 1), so a span with no face of its own inherits GNF. A span with `ob-readable` sets its own `font-family`, which is why the staff addresses are already correct.

The node test "the stylesheet puts domains in the readable face" reads `osint-browser-minigame.css` as text and checks the class on `.ob-address-text`, `.ob-staff-address` and `.ob-site-url` (`social-osint-browser.test.mjs:337-357`). It does not load `minigames-framework.css` and it does not look at block text. That is why 39/39 can pass while the browser shows GNF.

Suggested fix, not applied: add `ob-readable` to the post line and the generic line in `_lines()`, and extend the class assertion to a paragraph and a result that contain an address.

### F3 note

Game 2949 measured Hampshire's image in the same turn as the click (`naturalWidth` 0, `visibility` visible). The later screenshot shows the portrait, so that zero is the image not having decoded yet, not a missing file.

## Observations (not filed)

- The tools view clears the address bar on purpose (`osint-browser-minigame.js:250` returns `''`). The tool label still shows the host, in Source Sans 3. The 600 px tools shot does not show the Hunter result: the script clicked `.ob-tool` while that lookup was already open, and the click toggles it shut (`osint-browser-minigame.js:479`). The 1280 shot and the play2 eval measured the result line.
- Company pages share `ledgerwell.example` because the pages have no `path`. The page title changes (Our Team, Careers).
- Game 2945 sent `pretext_apply` with `kit_cv` after only `hampshire_careers`. It landed, and `ready_hampshire` stayed open. Hampshire's trust is `*` and that pretext does not require the other two facts. That is Phase 1 rules behaviour. The ordered run (2949) granted all three facts before either send.
- `typed` was 0 on the browse eval. The tools panel has no text field. Links stay `href="#"`.
- Decoy `note_lunch` returned "Nothing here you can use."
- A headless Chrome left running after these runs belongs to `se-P3-T` (parent `overlay-sync.cjs`, pid 1629876). It was not killed.

## Playtest

Headless, keyless :3001, Node 24 from the Playwright Go cache, browsers from the P1-J wrapper folder. Fresh games from `new-game.rb test_social_slice` (mission 83, no VM flags). This is a regression run: the scenario was read first, and each fact was earned by clicking the block that holds it. Nothing was typed from a guide or set from the console.

### Which questions this run answers

1. Plumbing: yes. Browsing grants the facts, the board opens from Case file and returns, and the mail steps from Phase 1a still pass.
2. Unexpected behaviour: the font on block text (F1), the missing Teague headshot (F3), and no ready toast (F4). No softlock.
3. Solvability without the VM: not applicable. No VM, no flags.

### Evidence

| Run | Game | Log | Result |
|---|---|---|---|
| Empty To list, then careers fact only | 2945 | `.../scratchpad/se-P2-T/play.log` | Step 1 only. The script then lost the page and sent the landing mail early. `hampshire_landed` completed; `ready_hampshire` did not. |
| Ordered browse, then enquiry, reload, landing | 2949 | `.../scratchpad/se-P2-T/play2.log` (session-closed, 81 commands) | Steps 2 to 6, and the "after careers" half of step 1 is also covered by the notes order. |
| `bridge-2.jsonl` | 2950 | `.../scratchpad/se-P2-T/bridge.log` | check-bridge PASS, 15/15. verify-run does not count it (above). |
| Screenshots | 2951 | `.../scratchpad/se-P2-T/shots/` and `shots/metrics.json` | Viewports only. Hampshire stays hidden on social, which is correct: that game never granted `hampshire_careers`. |

Play and bridge sessions logged `session-closed`. No headless browser from those three runs was still up.

### verify-run.rb --tasks (game 2949)

```
game            2949  (mission 83)
created         2026-10-21 19:54:26 UTC
last write      2026-10-21 19:57:55 UTC
played for      210s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     15: acct_freemail_choice, brandt_latched, brandt_lockout_channel,
                engine_tutorial_declined, phish_hampshire_landed,
                pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome,
                quinn_latched, se_intel_careers_attachment, se_intel_company_addresses,
                se_intel_hampshire_careers, se_intel_hampshire_cv_backlog,
                se_intel_username_convention, target_ready_hampshire, teague_latched
tasks           2 in objectivesState, 2 completed
  ready_hampshire                    "completed"  at 2026-10-21T19:57:07Z
  hampshire_landed                   "completed"  at 2026-10-21T19:57:55Z
tasks_completed 2
score           45
social scenario true
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

Game 2945 (partial): `hampshire_landed` completed at 19:52:35Z, `tasks_completed` 1, `se_intel_hampshire_careers` set, `target_ready_hampshire` absent. Exit 0, progress recorded.

### count-task-posts.sh

Server start Wed Oct 21 16:06:28 2026 (pid 1178210), log `tmp/keyless-3001.log`.

```
game 2949 task ready_hampshire: 1 completed POST(s) with 200
game 2949 task hampshire_landed: 1 completed POST(s) with 200
```

### Earned-secrets (game 2949)

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| `hampshire_careers` | "The careers inbox accepts CVs from anyone." | Careers block `careers_inbox` | yes (play2.log line 13 notes) |
| `careers_attachment` | "Chris takes .odt and .docx files." | How to apply block `apply_format` | yes (same notes list) |
| `hampshire_cv_backlog` | "Chris is behind on CVs before Friday." | Hampshire post `post_hampshire_cvs` | yes (same notes list) |
| `company_addresses` | Hunter result text | Tool result `r_pattern`, after visiting the team page | yes (`se_intel_company_addresses` on the verify-run) |
| `username_convention` | Author field `mteague` | Document properties `f_author` | yes (`se_intel_username_convention`) |
| Contact Hampshire | revealed after the careers fact | `revealedBy` on that fact | yes (To list, line 41) |
| `kit_cv` | CV.docx | Composer attach list (`payloadKit`), not gated | n/a, not gated |

Game 2945 earned only `hampshire_careers` (play.log line 33) before the script error. Its later landing send is not this table.

### Step results

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Before any fact the To list does not offer Hampshire. After the careers source only, she appears. | PASS | Before, game 2945 play.log line 17: To is only "No contacts yet — find someone first.", gate "Pick someone to write to.", contacts `[]`. After only `careers_inbox`, line 51: To is "Chris Hampshire (Careers)", send disabled, gate "Choose how to word your message." Social list then includes Teague and Hampshire (line 37). Game 2949 granted careers first and the later To list is Hampshire only (line 41); it did not repeat the empty-list check. |
| 2 | After the other two sources the board shows Hampshire ready and `target_ready_hampshire` is true. | PASS | play2.log line 13: three evidence notes, `ready: true`, task `ready_hampshire` completing. Board text (next eval): "1 of 2 targets ready to approach", "Chris Hampshire is now ready to approach", three slots done. verify-run: global set, task completed 19:57:07Z. |
| 3 | A `pretext_enquiry` send shows the full checklist at once, `pretextRelevant` failing on her line. | PASS | play2.log line 41: "It did not land." then "They would open it", "An open inbox accepts any sender", "This isn't about the role. I only handle applications.", "You mention a CV, but there's nothing attached." |
| 4 | A reload during the 15-second wait still delivers the reply into the guest mailbox. | PASS | Sync, then `location` reload with `skip_resume=1`. The in-flight `waitFor` reported "Execution context was destroyed" (expected). After bootstrap, line 57: guest holds the sent "Application" and "Re: Application" / "This isn't about the role. I only handle applications." Attempts 1. Visited place restored as `company.careers`. Globals still include the five intel facts and `target_ready_hampshire`. |
| 5 | A `pretext_apply` send with `kit_cv` lands. | PASS | Line 67: "It landed. They acted on it." and "The CV is attached". Line 77, about 15 s later: `phish_hampshire_landed` true, attempts 2, both tasks completed. |
| 6 | verify-run lists both tasks, `tasks_completed` 2; one POST each. | PASS | Output above. |
| Board | Case file from the browser returns to the same page. | PASS | Opened from `company.careers` (line 17). Board `returnsTo` is `osint-browser`. After Close, location is `company.careers` (line 27). Browser Close then left the room with no minigame. |
| Bridge | Space, E, Esc in the properties panel, Close with success. | PASS | 15/15 on game 2950. |

### As a player

The workstation opens on the team page. The three tabs read `company`, `social` and `deck`, with the host written under each one. Careers is a normal page link. Clicking the inbox line notes it and adds an evidence note; the same for the file-type line and Hampshire's post. A lunch note says there is nothing to use. The document properties panel shows Author `mteague` in the readable face. The Hunter line is the one that is hard to read: the address sits in the pixel font, while the address bar and the staff rows do not. Teague's picture is a blank square; Hampshire's portrait appears once her profile is unlocked. Case file lists her as ready and Close puts you back on Careers. The mail checks match the earlier slice: the enquiry fails on her own line, a reload still brings the reply, and the application with the CV lands.

## Fix round 1

| Finding | Outcome |
|---------|---------|
| F1 | Fixed. Posts, paragraphs and bios carry `ob-readable`, and the stylesheet sets Source Sans 3 on those classes as well as the address and domain lines. `osint-browser-minigame.js:557`, `:560`, `:401`; `osint-browser-minigame.css:34-44`. |
| F2 | Fixed. The three sites are named Ledgerwell, Friendface and Q3.pdf. Ids are unchanged. `scenario.json.erb:357` (social and deck beside it). `bridge-2.jsonl` expects those labels. |
| F3 | Fixed. A headshot is requested only when the profile or the person has an avatar. Teague has none. `osint-browser-minigame.js:372-375`. |
| F4 | Fixed. Noting a block that newly readies a target shows "Ready to approach". `osint-browser-minigame.js:607-610`. |
| F5 | Fixed. The mission description says the facts come from the browser. `mission.json:3`. |
| F6 | Fixed. `pages[].url` and `pages[].path` are on the contract field list, and `pages[].path` is linted next to `pages[].url`. `00_data_contract.md:1734-1735`; `scripts/validate_social/osint.rb:414`. |
