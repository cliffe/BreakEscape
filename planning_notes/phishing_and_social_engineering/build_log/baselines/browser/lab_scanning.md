# R3 browser baseline: lab_scanning instructor (packet P0-A9, part 1)

Taken 2026-10-21 about 10:41 to 10:46 UTC (run 2815), before any Phase 0 engine edit. Repo HEAD `1f13ee91`; the working tree held other agents' edits, none to engine code the browser loads.

**Question answered:** plumbing only: what the existing influence popup does in `lab_scanning`, as the baseline for the "one quick lab instructor" item of the R3 row in `IMPLEMENTATION_PLAN.md` §2.4. Not a solvability or blind run. The instructor is a teaching NPC with no hostile route.

## Run facts

| Item | Value |
|---|---|
| Game id | **2815** (mission 40, `lab_scanning`), `new-game.rb`, `PREFLIGHT OK`, 1 stand-in flag seeded, none submitted |
| Discarded run | game **2806**: `bootstrap` was used and looped through the instructor hub (it auto-picks choice 1 about 60 times, as the skill warns), so before values were not clean. Log kept at `.../se-P0-A9/lab_scanning-run0-polluted-session.jsonl`. One by-product: `instructor_rapport` read **310** at the end, so the ink variable has no cap. Not used for anything else below |
| Server | keyless :3001, already up. :3000 untouched |
| Browser | headless Chromium (`--headless true`, load average 6.8 and other agents' browsers running). Harness PID 504272 |
| Session log | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-A9/lab_scanning-session.jsonl` (259 commands, `flagsUsed: 0`) |
| Reload | one, after the conversation was closed and `sync` sent |
| Browser cleanup | `session-stop.sh 2815` quit the harness; PID 504272 confirmed gone with `ps` |

## How the values were read

- Popups: a MutationObserver on `document.body` installed by `eval`, recording every added node whose class contains `influence-popup` (text, class, colour, `performance.now()`). Installed before the first dialogue line, and again after the reload.
- Ink variables: `window.MinigameFramework.currentMinigame.inkEngine.story.variablesState["instructor_rapport"]` / `["scanning_ethics"]`, read mid-conversation (only works while the person-chat is open).
- Game globals: `window.__test.getState().globals`.
- Server record: `verify-run.rb`.

## Popups observed (before the reload)

Exact popup text is `+ Influence: Reconnaissance Specialist` (NPC `displayName`), class `influence-popup influence-increased`, colour `rgb(39, 174, 96)`. Nothing else in the text, no amount. It is a fixed-position, top-centre div (top 100px) that fades in and out. Exact lifetime was not measured; the DOM node was gone within about four of my polling calls.

Before anything: `instructor_rapport` 0, `scanning_ethics` 0 (ink and global).

| # | Trigger | Popup | `instructor_rapport` | `scanning_ethics` |
|---|---|---|---|---|
| 1 | Timed intro `intro_timed` (fires about 5 s after load, behind the title screen; Space on the title screen then showed the person-chat). Space through the lines. The popup appeared as "Let me explain how this lab works. You'll find three key resources here:" was displayed, i.e. one line after "This knowledge is powerful..." | `+ Influence: Reconnaissance Specialist` | 0 -> 0 | 0 -> 10. Event `global_variable_changed:scanning_ethics` value 10 fired |
| 2 | Hub choice 1 "Why is scanning so important?" (`scanning_importance`). Popup appeared as "After establishing a list of live hosts, you examine the attack surface..." was displayed | `+ Influence: Reconnaissance Specialist` | 0 -> 5 | 10 |
| 3 | Sub-choice 1 "What information does scanning reveal?" | `+ Influence: Reconnaissance Specialist` | 5 -> 10 | 10 |

Three popups, one each. Nothing hostile, no `influence` field read (the story uses `instructor_rapport`, not `influence`; the tag only drives the popup). `instructor_rapport` is not in `getState().globals`; only `scanning_ethics` is (that is the scenario-declared global).

## Reload

- After `location.reload()` a "RESUME SESSION?" overlay (Resume / Restart / New Session, plus "Load session #1") sat over a freshly started game. Space and the "Skip" control did nothing while it was up (the harness `brief` kept reporting the first line).
- Behind the overlay the game had already restarted: `scanning_ethics` was **0** (event `global_variable_changed:scanning_ethics` value 0 at about 12.7 s after load), ink `instructor_rapport` 0 and `scanning_ethics` 0, and the timed intro `intro_timed` conversation was open on its first line (the Lincoln quote). Clicking Resume (DOM click on the button with exact text "Resume") moved on to "Welcome to Information Gathering and Network Scanning...".
- **The intro replayed in full**, because `intro_timed` runs `~ instructor_rapport = 0` and `~ scanning_ethics = 0` first. Popup 1 fired again, `scanning_ethics` went 0 -> 10, `instructor_rapport` stayed 0. So the pre-reload rapport of 10 did **not** survive; the post-reload pair is (rapport 0, ethics 10), the same as after popup 1 in a fresh run.
- Server record after `sync`: `verify-run.rb` lists `globals set` as `engine_tutorial_declined, player_name` only. `scanning_ethics` is in the client's globals but not in that persisted list. Inventory (Notepad) kept.
- After the conversation closed (both before and after the reload) the engine opened a tutorial prompt ("Welcome to Hacktivity Games!", buttons "YES, SHOW ME" / "NO, I'LL FIGURE IT OUT") and a "Mission Brief" notes minigame. These blocked `enter` until closed/dismissed; unrelated to influence.

## Console errors

Collected through the harness `drain` (`pageErrors`), which only reports `console.error` and uncaught exceptions.

- Before the reload: 21 entries, 19 x `Failed to load resource ... 400 (Bad Request)` and 2 x `... 404 (Not Found)`.
- After the reload: 11 entries, all 400.
- The 400s match the `POST /break_escape/games/2815/tts` requests in `tmp/keyless-3001.log` (keyless server has no TTS key, so each voiced line gets a 400). The 404s match asset GETs for the player's talk sprites (`female_hacker_hood_v2_talk.png`, `female_hacker_hood_talk.png`) in the same log; I saw those two GETs next to a 404, but did not match every 404 to a URL.
- No uncaught exceptions, no influence- or ink-related errors.

## Earned-secrets table

No secret, key, PIN or flag was used. The flag station and VM launchers were not touched.

## verify-run.rb

Run on game 2815 after a deliberate `enter vm_lab_room` (so the verifier would see a room beyond the first; this was my move, not a route requirement). Before that move the verifier said `BOOTSTRAP ONLY` because a conversation alone is not progress. Saved to `.../se-P0-A9/lab_verify.txt`:

```
game            2815  (mission 40)
created         2026-10-21 10:41:26 UTC
last write      2026-10-21 10:45:15 UTC
played for      229s of wall clock
current room    "instruction_room"
unlocked rooms  2: instruction_room, vm_lab_room
unlocked objs   0: 
inventory       1: Notepad
NPCs met        1: reconnaissance_specialist
flags submitted 0: 
globals set     2: engine_tutorial_declined, player_name
tasks           0 in objectivesState, 0 completed
tasks_completed 0
score           0
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

## For the comparison run

Same game start: no `bootstrap`, press Space on the title screen, observer first. Expect three popups with the same text, rapport 0 -> 5 -> 10 on the same two choices, ethics 10 from popup 1, and after a reload plus Resume the intro and popup 1 again with rapport back at 0.
