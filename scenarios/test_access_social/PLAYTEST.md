# test_access_social: scripted playtest (slice 9.2, F1 to F8)

The scripted runs for access model slice 9.2 sub-slice C (`docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md`,
sections 8 and 11.2). One room per beat, each with a sign; F5 and F6 are in the lobby. The scenario
is for testing, not play. After every beat check what is on screen, what the server recorded and
what reached the browser.

**Posts are earned in real time.** The server refuses a post that comes sooner than its floor
(51 s for every NPC here, server time). Never step the needs clock in this scenario: a stepped
clock brings the next use before the floor, the answer is `tooSoon`, nothing is listed, and the
next honest use asks again. Every social media need here is fast (first urgent about 10 s after
the room loads, then about once a minute), so each beat takes one to four minutes of waiting.

## Setup (each run)

A keyless server on a free port (never touch :3000). Start it as `tools/playtest/start-keyless-server.sh`
does, with your own port in place of 3001. In a container, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to
the headless shell and pass `--headless`.

```bash
PLAYTEST_PORT=<port> BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_social
S=<scratchpad>/test_access_social
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap"}'
```

The three checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/<run>-responses.jsonl
grep -c '/feed_post' $S/<run>-responses.jsonl
```

The leak check must say `VERDICT: no leaks found`, and its counts line must show the feed posts and
feed facts it checked (four feed posts with text, two feed facts): a run that checked none proves
nothing. The `/feed_post` count must stay within the beat's budget below.

Useful reads: `window.__test.access.feed()` (revealed post ids by NPC),
`window.__test.needs.state('jake')` (its `job`, and `distracted` while on the phone),
`window.__test.getState().objectives` (the beat tasks).

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_social/scenario.json.erb --no-graph`:
no errors and these warnings, each expected:

1. Jake has two `onceOnly` mappings on `npc_posted:jake` (`f2_posted` on index 0, `f6_last_post`
   on index 2). Their conditions never pass together; the wiring check cannot read that.
2. The guard challenges on sight and has a `social_media` need and a phone: he can be walked past
   once a period. That is F8's point.

Plus the generic suggestions (lock variety, PIN locks and so on) every test scenario draws. The
work report prints one `Feed` line each for Jake, Lena and Omar (first urgent at 10 s, a server
floor of 51 s) and the password clue check finds Jake's two pieces in his two feed posts and their
facts, with the pattern on `it_poster`.

## Beats

| Beat | Do | Expect | Server afterwards | `/feed_post` so far |
|---|---|---|---|---|
| F1 | In the lobby, before entering any room, open the Friendface terminal and each profile | Each profile shows its one authored post and nothing else. Clicking Jake's authored post notes `jake_office` | `feedRevealed` empty. The leak check finds no feed post or feed fact text in any response, and `GET /scenario`'s `social.intelFacts` holds `jake_office` only | 0 |
| F2 | Close the terminal (it is now a visited site). Enter `jake_room` and wait | Jake uses his phone where he sits and never gets up (`job.kind` `self`, `atPost` kept, no `npc_left_post:jake`); `distracted` is true while it runs; a click on his PC says he is using it; `npc_used_phone:jake`, task `f2_phone`. Then a "New post" toast, "Jake Brooks posted on Friendface"; task `f2_posted`. The terminal lists his first feed post above the authored one; clicking it says "Noted" and adds an evidence note | `feedRevealed.jake.n` 1 | 1 |
| F3 | Enter `lena_room` and wait | Lena uses her PC (`npc_used:lena_pc`, need `social_media`, `met: true`), task `f3_pc`; her post appears on her profile | `feedRevealed.lena.n` 1, done | 2 or 3 (Jake may post again) |
| F4 | Enter `omar_room` and wait about two minutes | Omar's first try fails: "Blocked. Of course." Second failure: "I'll use the spare PC.", he walks to the lobby kiosk, uses it (met), task `f4_borrowed`, his post appears, and he walks back leaving the kiosk signed in. A click on the kiosk while nobody sits there opens his desktop | `npcFrustration.omar` level at least 50, workaround done; `guestSessions.kiosk` `omar`; `feedRevealed.omar.n` 1 | Omar 1 (his failed uses ask nothing) |
| F7 | Reload (set `location.href` to the game URL with `?skip_resume=1`) | The terminal shows every revealed post at once; a revealed fact noted before the reload still reads the same in the notebook; nothing unrevealed in any response after the reload | Unchanged | No new request from the reload itself |
| F5 | Read Jake's first two posts (note both facts) and the IT poster; sign in at the hot desk as `jbrooks` with the password built from them | Signs in as Jake (`pc_signed_in:hot_desk`, `via: "password"`), task `f5_signed_in`; his desktop holds `F5.txt` | `sessions.hot_desk` Jake by password | Jake 2 or 3 |
| F6 | Wait for Jake's third post (about 3 minutes after his room first loaded) | The post appears; the answer says `done: true`; task `f6_last_post`; no further `/feed_post` for Jake | `feedRevealed.jake.n` 3 | Jake 3, flat from then on |
| F8 | Enter `gate_room`. While the guard is on his phone (`distracted` true), walk through his view; then wait until it is false and walk through again | No `player_in_view_near:guard` while distracted; task `f8_distracted` on `npc_used_phone:guard`. Once he puts the phone away the event fires, task `f8_challenged` | None (he has no feed) | Guard 0 |

Scripted runs: F1 to F4 and F7 in one run; F5, F6 and F8 in a second (or continue the first).

## Earned secrets

| Secret | Where it is first read in the game |
|---|---|
| The pet's name | Jake's first feed post, and its fact `jake_pet_name` |
| The year | Jake's second feed post, and its fact `jake_wedding_year` |
| The pattern (name with a capital, then the year) | The IT poster in the lobby |

## Tampered-client checks

- `POST /feed_post` for an NPC with no feed or no need: `{ post: null, done: true }`; for an NPC id
  that is not in the game: 403.
- `POST /feed_post` for Jake again within 51 s of his last post: `tooSoon`, nothing revealed.
- `grantFact('jake_wedding_year')` in the console before his second post: refused ("Unknown fact"),
  because the bootstrap's `social.intelFacts` does not hold it.
