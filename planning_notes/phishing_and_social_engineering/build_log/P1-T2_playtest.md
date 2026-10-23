# P1-T2 playtest: Phase 1b, character target and created account

Date 2026-10-21. Sonnet, headless, keyless server on :3001, fresh `test_social_slice` game **2909**.
Source for the steps: IMPLEMENTATION_PLAN.md §4 row P1-T2 and "Done when (1b)" (no TESTING_WALKTHROUGH.md exists for the slice).

## Which questions this run answers

1. Plumbing: yes. Created account, Hampshire from it, the character target (Teague) with a failing and a landing send, reload with a reply pending, influence bar, board.
2. Unexpected behaviour: partly (a failing send first, a reload five seconds after a send, a resend while a bar was open). No softlock hunt.
3. Solvability without doing the work: not applicable, no VM and no flags.

Regression run, not blind: I read `scenario.json.erb` and `teague_mail.ink` (after playing the failing send) to know the ids and authored deltas.

## Evidence

- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-T2/play.log` (433 commands). Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-T2/` (screenshots in `shots/`, `verify.txt`, `count.txt`).
- Setup as P1-T0: Node 24 from the Playwright Go cache, `PLAYWRIGHT_BROWSERS_PATH` at the P1-T0 wrapper folder. Browser root PID 1255713, harness PID 1255686; `session-stop.sh` ended both and `pgrep headless_shell` showed nothing afterwards, so no PID kill was needed.
- Driving: world actions and clicks through the bridge. The mail UI's selects, radios and the picker keys were driven with `eval` (set `value` and dispatch `change`, `radio.click()`, a `keydown` on the focused listbox) because `mg` has no select action and its `pressKey` does not reach the focused listbox (as noted in P1-T0b). Reload by navigating to the game URL with `?skip_resume=1`, then `bootstrap resume`.

### verify-run.rb --tasks 2909

```
game            2909  (mission 83)
current room    "slice_room"
unlocked rooms  1: slice_room
inventory       1: Notepad
NPCs met        1: slice_host
flags submitted 0:
globals set     16: acct_freemail, acct_freemail_choice, engine_tutorial_declined, osint_done, phish_hampshire_landed, phish_teague_landed, se_intel_careers_attachment, se_intel_company_addresses, se_intel_hampshire_careers, se_intel_hampshire_cv_backlog, se_intel_teague_expects_export, se_intel_teague_role, se_intel_teague_trusts_shah, target_ready_hampshire, target_ready_teague, teague_latched
tasks           3 in objectivesState, 3 completed
  teague_landed                      "completed"  at 2026-10-21T16:03:40Z
  ready_hampshire                    "completed"  at 2026-10-21T15:56:54Z
  hampshire_landed                   "completed"  at 2026-10-21T15:58:33Z
tasks_completed 3
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 3 tasks completed.   (exit 0)
```

### count-task-posts.sh 2909

```
game 2909 task ready_hampshire: 1 completed POST(s) with 200
game 2909 task hampshire_landed: 1 completed POST(s) with 200
game 2909 task teague_landed: 1 completed POST(s) with 200
```

Server row after the run: `teague_influence` 0 at the post-reload check, then 10 after one extra landing send; `mailState.jobs` empty; metrics `teague` sent 3 / failed 1 / landed 2, `hampshire` sent 1 / landed 1 (first try); account `freemail` created as `nt2` (n.assurance@freemail.example).

## Earned-secrets table

Nothing in this run is a PIN, key or flag. The secrets are the intel facts. Every one was obtained by walking to and interacting with the note in the room, before the send that needed it. Nothing was typed from a guide or set from the console.

| Secret | Value used | In-game source | Obtained at (play.log region) | Earned? |
|---|---|---|---|---|
| Fact `hampshire_careers` | careers inbox accepts CVs from anyone | Careers Page Printout (`careers_inbox`) | start, before the mail terminal was opened | yes |
| Fact `careers_attachment` | .odt / .docx; gives "my CV" | How To Apply Page (`apply_format`) | start | yes |
| Fact `hampshire_cv_backlog` | behind on CVs before Friday | Chris's Social Post (`post_hampshire_cvs`) | start | yes |
| Account `freemail` (`nt2`) | n.assurance@freemail.example | switcher "Create account" panel | before the Hampshire send | yes (nothing in the room tells the player to do this, see finding A1) |
| Fact `teague_role` | Morgan / Ms Teague / Morgan Teague | Finance Team Page Printout (`note_teague_role`) | before the first Teague composer check | yes |
| Fact `teague_trusts_shah` | Ravi Shah (name blank) | Morgan's Social Post (`note_teague_shah`) | before the failing send | yes |
| Fact `teague_expects_export` | the Q3 ledger export, Tuesday, "Mo" | Company-Site Note (`note_teague_export`) | before the failing send | yes |
| Fact `company_addresses` | r.shah@ledgerwell.example (address blank) | Address-Lookup Result (`note_company_addresses`) | before the failing send | yes |
| `kit_cv`, `kit_ledger` | attachments | offered by the composer from the start (`payloadKit`), not gated | n/a | n/a |

No rows marked "no". Exercised, not earned: none of the facts or sends. The select and key events above are the player's own inputs sent through `eval`.

## Done-when (1b) playtest bullet, item by item

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Create `freemail` | PASS | Switcher offers "Create account"; panel lists the two `createMenu` rows; Confirm gives "Account created: n.assurance@freemail.example", switcher now shows the new account selected, empty inbox. Shots `02`, `03`, `04`, `05`. |
| 2 | Land Hampshire from it | PASS | Composer shows "Send as N. Assurance" with the line "You can only send as yourself from this address. Switch account to send as someone else." Pretext starts unchosen ("Choose how to word your message."); `pretext_apply` + CV.docx gives "It landed. They acted on it." with four ticks, `phish_hampshire_landed` true, reply "Thanks, I'll get to this CV before Friday." in the **freemail** mailbox (not guest). Shots `06` to `10`. |
| 3 | Before the blank facts are held, Send is blocked with the neutral line, which never names the fact | PASS | Teague with only `teague_role`: Send disabled, gate line "A blank needs evidence you haven't found yet" (state `gateReason: empty-blank`); the `sender_name` and `sender_address` buttons read "no evidence yet", are disabled and inert when clicked. Nothing names Ravi, the address pattern or the ledger. Shots `12`, `13`. |
| 4 | Blanks offer only held facts | PASS | `name`: 3 options after `teague_role`, a 4th ("Mo") only after the export note. `sender_name`: Ravi Shah only after the Shah post. `sender_address`: r.shah@... only after the address note. `document` offered my CV (Hampshire fact, held) and the ledger export; `when` offered Friday and Tuesday (both held). Shots `14`, `20`. |
| 5 | Picker keyboard and Esc order | PASS | Opened by clicking the blank (what Enter does on a button); focus on the listbox, `aria-activedescendant` moves with ArrowDown, wraps, Home and End work, Enter picks and focus returns to the blank button. Esc closed the picker first (layers `[compose, blank-picker]` to `[compose]`), then the composer, then the overlay. Real Tab walk not simulated. |
| 6 | Failing send, reply from `on_email`, bar moves by the authored delta with its reason | PASS with a gap (A2) | Failing send (full-name greeting, no attachment, generic pretext): "It did not land.", two ticks and three crosses, an advisory, `phish_teague_attempts` 1. Reply "This doesn't even have my name on it." (the `addressedTo` branch). Influence 0 to -10 (ink: `se_influence(-10, "addressedTo")`). The reading-pane bar showed -10 but **no reason line**: the "Last change" line is event-driven and the bar was not mounted when the reply arrived. See A2. |
| 7 | Landing send, reply from `on_email`, +10 with reason | PASS with the same gap | Landing send (Ravi Shah, r.shah@, "Mo", ledger export on Tuesday, Q3-ledger.xlsx): "It landed. They acted on it.", five ticks. Reply "Thanks Ravi, I'll open the ledger now." Influence -10 to 0. `phish_teague_landed` true, task `teague_landed` completed. With the bar already mounted, a third (extra) landing send showed "Last change: +10 senderTrust" and the number 10 (shot `29`). |
| 8 | Both values survive a reload | PASS | See "Reload". |
| 9 | `verify-run.rb --tasks` lists both landed tasks as completed | PASS | Above: 3 of 3 (ready_hampshire, hampshire_landed, teague_landed). |
| 10 | `count-task-posts.sh` one successful POST each | PASS | Above, 1 each. |
| 11 | Picker and pre-send rows of `bridge-1b.jsonl` | NOT RUN here | Last recorded 78 of 78 on game 2908 (P1-T0b update). I did not rerun it. The playtest above covers the same behaviours by hand (items 3 to 5). |
| 12 | Back-compat item 7, bridge half (phone preload and bark on the `se_influence` story) | NOT RUN here | Not in my instructions' step list; still open for whoever owns it. |

### Reload with a reply pending

- Failing send: I tried to reload with the reply pending but the reply (15 s) landed while I was reading the checklist, so that reload window was missed. No claim made for it.
- Landing send: sent 17:03:09, reload started 17:03:14 (5 s after the send, 10 s before the reply was due). The page took about 23 s to come back. After the reload: `mailState.jobs` empty, exactly one reply "Thanks Ravi, I'll open the ledger now." in the inbox, one Sent entry, `phish_teague_attempts` 2, `phish_teague_landed` true, task completed, one task POST. The reply's `gameTime` is 15.4 s after the send's (393377 to 408808), so the game clock did not advance while the page was down and the reply was produced after the reload, from the persisted job. I did not read the job from the server between the reload and the delivery, so the "job present after reload" step is inferred, not seen.
- Values: before the reload influence was -10 (failing reply); after it the bar read 0 (-10 + 10) in the inbox and the server held 0. Both the earlier value and the delta applied after the reload are therefore right. The earlier replies and sent items were all still there.
- A new reply row was **not announced** by a toast after reload (the overlay was closed); the inbox just had a new unread row when I opened the terminal. Fine.

## As a player

**Is it clear what to do next?**
- Start: the Objectives panel names the Hampshire task. The notes are small and the same as P1-T findings (T8): nothing points at them. I knew where they were.
- After Hampshire's three notes: the Hampshire "ready" toast and the board are the only confirmation; nothing sends the player to the terminal. Same as T8.
- Account creation: nothing in the room, the objectives or the Hampshire reply says a created account exists or why you would want one. "Create account" sits in the account dropdown only. A player who never opens that dropdown never sees it. Hampshire lands from the Operator account too, so in the slice creating an account is optional and unmotivated (A1).
- Composer: for Teague the blank buttons and the "no evidence yet" wording tell a player to go and find something, good. The footer gate line gives the same neutral line, which does not say which blank. The first gate line is "Choose how to word your message." (pretext), then the blank line; fine order.
- After a failing send the checklist says what is wrong in her voice, which is clear enough to retry. One line misleads (A5).
- After the landing send: clear. "A reply may land in your inbox in a moment." appears on Hampshire's result (good, T4 fixed). Teague's landing result had no such line (the result panel showed only the advisory).

**Confusing text.**
- Blank buttons and gate text use raw slot ids: "sender_name: choose…", "sender_address: choose…", "name: choose…", "document: …", "when: …", and the footer "Choose an option for the sender_name blank". (A3)
- The template keeps its braces ("Hi {name},", "Here is {document} you wanted {when}.") with the pick shown on a button below, so the player never sees the sentence the way it will be sent. (A4)
- Failing reply "This doesn't even have my name on it." after a greeting of "Hi Morgan Teague,". The full name is not one of her `addressedAs` forms, so the checklist is right by the rules but reads as wrong to the player. (A5)
- Influence reason is the factor id: "Last change: +10 senderTrust". (A2)
- Advisory footer: "In real life this reply would go to shah's inbox unless you set a reply-to; here it comes to guest@workstation.example." Lower-case id "shah's". (A3)
- Picker rows carry a faint tag "distinctive" / "generic" at the right edge. The word is jargon and nearly invisible on the amber highlight. (A6)

**Looks wrong** (shots under `shots/`).
- Composer clipped at 1400 x 1000: with blanks the panel is taller than its frame (scroll height 615 v 572 px, more with the sheet blanks) so the Back and Send buttons and the gate line are cut off at the bottom until scrolled, and nothing says to scroll (`12`, `13`, `20`, `21`). Hampshire's short composer fits (`06`). (A7)
- Picker highlight is white text on bright amber, low contrast (`14`, `20`).
- Create-account radios: the selected one is the browser's blue, the unselected is a bright white filled circle, so unselected looks selected (`03`, `04`). The panel does not say which service this is.
- Switcher text is cut ("Operator <guest@workst…", "N. Assurance <n.assurance@…") and the "Contacts" label is wider than its button (`02`, `05`).
- The influence bar's start marker is a small "?" icon sitting at 0, which reads as a help icon (`23`, `28`, `30`). On the board, a stray thin red string line runs across the bottom of the People cards (`18`, `30`).
- Reply after the freemail round has an empty "To" (shot `10`); the Teague replies show `guest@workstation.example`.
- A stale yellow "New message from ... Re: ..." notice stays on screen after other actions (`10`, `23`, `29`).
- Three identical "Re: Quick one" rows in the inbox, told apart only by time. Opening an old reply shows the **current** bar value (10) not the value at that time (`29`).
- Hampshire "Done" returns to the composer holding the same, still sendable message; Back then Compose later gives a fresh composer on Hampshire with the Teague draft gone.
- Screens that look good: the mail frame, account created confirmation, the checklist panels (ticks and crosses with words, no double tick), the board with Teague's card, bar and "Wary at -30: not reached", and the objectives panel ticking off.

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| A1 | minor | Nothing in the room or the objectives motivates or even points to Create account; Hampshire lands from Operator too | game 2909, shot `02` |
| A2 | minor (suspect design gap, for a human to rule) | The influence "reason" ("Last change: +10 senderTrust") appears only if the bar is mounted when the reply arrives. In the normal flow (result panel or composer open, or a reload) the bar shows the number with no reason, and the board never shows one. Reason is the raw factor id | play.log region after the 17:01 and 17:03 sends, shots `23`, `28`, `29`, `30` |
| A3 | minor | Raw ids in player text: blank labels, the footer "sender_name blank" line, "shah's inbox" | shots `12`, `14`, `20`, `22` |
| A4 | minor | Template braces never replaced with the picked words, so no preview of the message | shot `25` |
| A5 | minor | Full name as greeting fails `addressedTo` with "doesn't even have my name on it" | shot `22`, ink `teague_mail.ink` |
| A6 | minor | Picker tag "distinctive"/"generic" is jargon and low contrast; highlighted option is white on amber | shots `14`, `20` |
| A7 | minor | Composer with blanks overflows its frame; Send and gate line clipped until scrolled, no cue | shots `12`, `13`, `20`, `21` |
| A8 | minor | Create-account radios hard to read as selected; no service name in the panel | shots `03`, `04` |
| A9 | minor | Cut-off switcher text and "Contacts" label | shots `02`, `05` |
| A10 | minor | Empty "To" on the Hampshire reply received in the freemail mailbox | shot `10` |
| A11 | minor | Stale mail notice line; identical reply rows; old reply shows the live bar value; Done returns to a resendable composer; Back loses the draft | shots `10`, `23`, `27`, `29` |
| A12 | minor | Bar start marker is a "?" icon; stray red board line | shots `23`, `18` |
| A13 | minor | Teague's landing result has no "a reply may land" line (Hampshire's does) | shot `26` |

0 blockers, 0 majors, 13 minors. I make no classification of these as game bugs; they are what I saw.

## Limits

- Headless, synthetic input: no real Tab walk, no sound. Selects, radios and listbox keys went through `eval`; `mg` text clicks on "Send" match the "sender_name" blank button too, so the Send button was clicked by selector (`.mail-compose-send, .mail-send`).
- 1400 x 1000 viewport only; no narrow layout check (not in this brief).
- The failing-send reload window was missed (reply too quick); the landing-send reload was done at +5 s. "Job still present after reload" is inferred from the reply arriving once afterwards, with the game clock showing no elapsed time during the reload.
- I sent one extra Teague landing (attempts 3, landed 2) to watch the live "Last change" line. It does not change the one-POST-per-task counts.
- `bridge-1b.jsonl` and back-compat item 7's bridge half were not run in this pass.
- No game files edited, nothing committed. Scratch only under the P1-T2 folder.
