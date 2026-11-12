# test_access_social: scripted playtest (slice 9.2, F1 to F15)

The scripted runs for access model slice 9.2 sub-slice C (`docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md`,
sections 8 and 11.2), plus F9 for user decision q33 (a lockout stops social media at that PC too),
and F10 to F13 for sub-slice C2 reactive feed posts
(`docs/achitechture/ACCESS_MODEL_SLICE_9_2_C2_PLAN.md`, section 10). F10 to F13 are the plan's four
reactive beats renumbered up by one (the plan calls them F9 to F12; q33's F9 already holds that
number). F14 is for user decision q36 (a borrower locked out at its hot desk), and F15 is the same
for a work borrow (a lockout stops every use of that PC).
One room per beat, each with a sign; F5 and F6 are in the lobby. The scenario
is for testing, not play. After every beat check what is on screen, what the server recorded and
what reached the browser.

**Posts are earned in real time.** The server refuses a post that comes sooner than its floor
(51 s for every NPC here, server time). Never step the needs clock in this scenario: a stepped
clock brings the next use before the floor and the answer is `tooSoon` with a `retryAfter`. The
browser then asks again once that wait has passed (retryAfter plus 1 s, up to four requests for
one use), and a use while that retry waits asks nothing. So the post still comes from that use,
late, and each `tooSoon` adds a request to the beat's `/feed_post` count. Every social media
need here is fast (first urgent about 10 s after the room loads, then about once a minute), so
each beat takes one to four minutes of waiting.

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
feed facts it checked (seven feed posts, two feed facts): a run that checked none proves
nothing. The `/feed_post` count must stay within the beat's budget below. The budgets count
answers with a post; add one request for each `tooSoon` answer (Jake's first use after the F7
reload often is one). If the leak check notes a reveal allowed at an answer whose body the log
lost, or one judged by the saved count from the first line, that beat's order was not fully
checked: run it again with no reload during a request.

**Two things the first run taught.** Stand clear of a doorway while an NPC walks between rooms:
the player blocks the door, the walk times out after 20 s and a borrow is dropped after 60 s
(Omar then fails again and is handed it again). An NPC's event mappings are registered only when
its room loads, so `f5_signed_in` is an `unlock_object` task on the hot desk (only Jake's account
works there) and ticks after a reload wherever the player has been.

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
3. `priya_pc` is under a policy with `maxAttempts` 3: "a lockout lasts the mission, so confirm
   another route exists". That lockout is F9's point.

Plus the generic suggestions (lock variety, PIN locks and so on) every test scenario draws. The
work report prints one `Feed` line each for Jake, Lena, Omar and Priya (first urgent at 10 s, a server
floor of 51 s) and the password clue check finds Jake's two pieces in his two feed posts and their
facts, with the pattern on `it_poster`.

F10 to F13 add their own `Feed` lines (Nadia, Theo, Greg, Ruth), four `Reactive feed` lines (orders
reactive_first, mixed, facts_first, reactive_first) and a `Work` line each for Nadia and Greg. The
work report also prints one `fires when ...` line per reactive post: `f10_vent`/`f12_vent` on a `down`
(and `f12_vent` on `off`) cause, `f11_borrowed` after the borrow, `f13_blocked` on `social_blocked`,
`f13_fixed` on recovery. No new warning: the only warnings stay the three above.

## Beats

| Beat | Do | Expect | Server afterwards | `/feed_post` so far |
|---|---|---|---|---|
| F1 | In the lobby, before entering any room, open the Friendface terminal and each profile | Each profile shows its one authored post and nothing else. Clicking Jake's authored post notes `jake_office` | `feedRevealed` empty. The leak check finds no feed post or feed fact text in any response, and `GET /scenario`'s `social.intelFacts` holds `jake_office` only | 0 |
| F2 | Close the terminal (it is now a visited site). Enter `jake_room` and wait | Jake uses his phone where he sits and never gets up (`job.kind` `self`, `atPost` kept, no `npc_left_post:jake`); `distracted` is true while it runs; a click on his PC says he is using it; `npc_used_phone:jake`, task `f2_phone`. Then a "New post" toast, "Jake Brooks posted on Friendface"; task `f2_posted`. The terminal lists his first feed post above the authored one; clicking it says "Noted" and adds an evidence note | `feedRevealed.jake.n` 1 | 1 |
| F3 | Enter `lena_room` and wait | Lena uses her PC (`npc_used:lena_pc`, need `social_media`, `met: true`), task `f3_pc`; her post appears on her profile | `feedRevealed.lena.n` 1, done | 2 or 3 (Jake may post again) |
| F4 | Enter `omar_room`, step away from the door, and wait about two minutes | Omar's first try fails: "Blocked. Of course." Second failure: "I'll use the spare PC.", he walks to the lobby kiosk, uses it (met), task `f4_borrowed`, his post appears, and he walks back leaving the kiosk signed in. A click on the kiosk while nobody sits there opens his desktop | `npcFrustration.omar` level at least 50, workaround done; `guestSessions.kiosk` `omar`; `feedRevealed.omar.n` 1 | Omar 1 (his failed uses ask nothing) |
| F7 | Reload (set `location.href` to the game URL with `?skip_resume=1`) | The terminal shows every revealed post at once; a revealed fact noted before the reload still reads the same in the notebook; nothing unrevealed in any response after the reload | Unchanged | No new request from the reload itself |
| F5 | Read Jake's first two posts (note both facts) and the IT poster; sign in at the hot desk as `jbrooks` with the password built from them | Signs in as Jake (`pc_signed_in:hot_desk`), task `f5_signed_in` (an `unlock_object` task on `hot_desk`; it ticks on any sign-in there, and in this scenario only the password reaches Jake's account at the hot desk); his desktop holds `F5.txt` | `sessions.hot_desk` Jake by password (the "by password" check is this column's, not the task's) | Jake 2 or 3 |
| F6 | Wait for Jake's third post (about 3 minutes after his room first loaded) | The post appears; the answer says `done: true`; task `f6_last_post`; no further `/feed_post` for Jake | `feedRevealed.jake.n` 3 | Jake 3, flat from then on |
| F8 | Enter `gate_room`. While the guard is on his phone (`distracted` true), walk through his view; then wait until it is false and walk through again | No `player_in_view_near:guard` while distracted; task `f8_distracted` on `npc_used_phone:guard`. Once he puts the phone away the event fires, task `f8_challenged` | None (he has no feed) | Guard 0 |
| F9 | Through `lena_room` into `priya_room`. Priya uses her PC for social media at her desk (her first post). When she gets up for the fridge, click her PC (the sign-in screen: her screen locked) and type three wrong passwords on her tile. Stand back and wait | The third answer says the account is locked on this PC. When she sits back down she finds out (`npc_locked_out:priya`, task `f9_locked_out`); from then on every social media use is on her phone (`npc_used_phone:priya`, task `f9_phone`), never `npc_used:priya_pc` with need `social_media`, and nothing counted (no `npc_use_failed:priya`). Her second post comes from the phone (task `f9_posted`) | `loginLockouts` holds `priya_pc\|pshah`; `npcFrustration.priya.lockedOut` `["priya_pc"]`, level 0; `feedRevealed.priya.n` 2, done. In the response capture her first `/feed_post` names `object_id` `priya_pc`, the second `null` | Priya 2 |

Scripted runs: F1 to F4 and F7 in one run; F5, F6 and F8 in a second (or continue the first); F9
in either (lock Priya out on her first trip to the fridge, before her next social media use).

## Reactive beats (C2): F10 to F13

East from Priya's room runs a short corridor of four reactive rooms: F10 Nadia, F11 Theo, F12 Greg,
F13 Ruth. Each adds a post with a `when` that the server serves only once the state it reads holds,
so the player causes something first (an outage, a borrow, a blocked site) and the post follows. The
pace floor still bites every reveal after the first (51 s), and the needs clock is never stepped
while an outage holds. The reveal order on the osint terminal is the order the server served the
posts, not authored order, so a reactive post that jumped the queue sits above an ordered one served
earlier.

Read each NPC with `window.__test.access.feed()` (revealed post ids by NPC) and
`window.__test.needs.state('<id>')`. The `/feed_post` budget is counted **per beat** (requests
between the beat's two assertions): a feed holding an un-triggered reactive post asks once on each met
use and is usually answered `{ post: null, done: false }`, so a per-run total grows with play.

| Beat | Do | Expect | Server afterwards | `/feed_post` this beat |
|---|---|---|---|---|
| F10 | Enter `f10_room` (east of Priya's room), order **reactive_first**. Throw the breaker at once. Her first met social use may fall before her work fails and serve an ordered post; wait for her work to fail (she names the accounts share going down), then for her next met social use | The outage vent `f10_vent` is served ahead of her remaining ordered post, so it lands between the two ordered ones; task `f10_posted`. Reset the breaker | `npcFrustration.nadia.failWhy.work` lists `down`; `feedRevealed.nadia.shown` is `["f10_ordered", "f10_vent", "f10_ordered_two"]` (the vent jumps the second ordered post) | Nadia 2 to 3 across her met uses |
| F11 | Enter `f11_room`, order **mixed**. Theo's PC blocks social media and he has no phone, so he borrows the kiosk here. Wait through his first met use, his borrow, and one more use | His ordered `f11_first` comes out first; the borrow post `f11_borrowed` slots in at its authored place on the next met use (never ahead of `f11_first`); then `f11_last`; task `f11_posted` on `f11_borrowed` | `feedRevealed.theo.shown` is `["f11_first", "f11_borrowed", ...]`; the `borrow_session` workaround is done; `guestSessions.f11_kiosk` `theo` | Theo up to 3 (one per met use) |
| F12 | Enter `f12_room`, order **facts_first**. Wait for Greg's first met social media use, then throw the breaker (sales system down). Wait for his work to fail, then for his next met social media use. Reset the breaker | The ordered `f12_ordered` comes out first; the vent `f12_vent` follows only after the outage and a work failure; task `f12_posted` on `f12_vent`. After both the answer says `done: true` and the client stops asking | `feedRevealed.greg.shown` is `["f12_ordered", "f12_vent"]`, done; `failWhy.work` lists `down` | Greg 2 (one per post), plus any `tooSoon` |
| F13 | Enter `f13_room`, order **reactive_first**. Ruth's PC blocks social media and she has no phone. Wait for her to fail, borrow the kiosk, and use it twice. Waiting is enough (q38): her second met kiosk use counts for `needMet` because her last failure is over 5 seconds old, though she fails again at her desk between borrows and that use's ease reaches the server just after the request | On her first met use (the borrow) the blocked vent `f13_blocked` is served; on her next met use the recovery post `f13_fixed` (keyed on `needMet`) follows; tasks `f13_blocked` then `f13_recovered`, about 90 s apart | `failWhy.social_media` lists `social_blocked`; `easeAt.social_media` later than `failAt.social_media`; `feedRevealed.ruth.shown` is `["f13_blocked", "f13_fixed"]`, done | Ruth 2 |

## Borrowed hot desk lockout (q36): F14

| Beat | Do | Expect | Server afterwards | `/feed_post` this beat |
|---|---|---|---|---|
| F14 | Enter `f14_room` (east of Ruth's room) at once. Sade's PC blocks social media and she has no phone, so after two failures she borrows the hot desk. Before she does, click the hot desk, pick her tile (`sokafor`) and type three wrong passwords. Step back and wait | The third answer says the account is locked on this PC. When she sits down there one `check` goes for her at `f14_hot_desk` and comes back locked out: `npc_locked_out:sade` with `objectId` `f14_hot_desk`, task `f14_locked_out`. At the end of the use it fails: `npc_use_failed:sade` with `missing` `[{ id: f14_hot_desk, why: locked_out }]`, `npc_borrow_done:sade` `met: false`, task `f14_borrow_failed`. No `npc_used:f14_hot_desk`, no post | `loginLockouts` holds `f14_hot_desk\|sokafor`; `npcFrustration.sade.lockedOut` `["f14_hot_desk"]` (and in GET /scenario's `npcFrustration`), no `easeAt`, no `guestSessions.f14_hot_desk`, no `feedRevealed.sade` | Sade 0 |
| F15 | Enter `f15_room` (east of Sade's room) at once. Hamid's PC is switched off (`f15_pc_off` starts true), so after two work failures he takes his work to the hot desk. Before he does, click the hot desk, pick his tile (`hrahimi`) and type three wrong passwords. Step back and wait. Leave the power switch alone | The third answer says the account is locked on this PC. When he sits down one `check` goes for him at `f15_hot_desk` and comes back locked out: `npc_locked_out:hamid`, task `f15_locked_out`. At the end of the use his work fails: `npc_use_failed:hamid` need `work`, `missing` `[{ id: f15_hot_desk, why: locked_out }]`, `npc_borrow_done:hamid` `met: false`, task `f15_borrow_failed`. No `npc_used:f15_hot_desk` | `loginLockouts` holds `f15_hot_desk\|hrahimi`; `npcFrustration.hamid.lockedOut` `["f15_hot_desk"]` (and in GET /scenario), `easeAt` empty, no `guestSessions.f15_hot_desk`. A work `ease` for him at the hot desk is refused | none (no feed) |

The leak check must still say `VERDICT: no leaks found` after each reactive beat, and its counts line
must show the reactive post texts among the feed posts it checked. One reload during the run (as F7)
must show every revealed reactive post at once, in reveal order, with no unrevealed reactive post in
any response.

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
- `POST /feed_post` for Jake before his room has loaded: 403 (the server knows only NPCs in rooms
  the player has loaded). Once it has, a forged first request is answered (a tampered browser
  can take a post one floor early, plan 9.3) and a second at once is `tooSoon`.
- `grantFact('jake_wedding_year')` in the console before his second post: refused ("Unknown fact"),
  because the bootstrap's `social.intelFacts` does not hold it.
- A post the server never revealed, pushed into `window.socialFeed` by hand with a made-up fact
  entry: listed and grantable in that page only. After a reload `GET /scenario`'s `feedPosts` and
  `social.intelFacts` hold only what the server served; the client-written `se_intel_<id>` global
  and the player's own saved note stay (the server cannot tell those from honest ones).
- F9 (q33): after Priya's lockout, `POST /feed_post` for her with `object_id` `priya_pc`:
  `{ post: null, done: false, refused: true }` and `feedRevealed` unchanged; the same with
  `object_id` naming a PC that is not hers (`lena_pc`), an id not in the game, or an array. With
  `object_id` null (her phone) the post is answered as usual. A state sync with an empty
  `loginLockouts` changes nothing: the PC stays refused. A social media `ease` for her at
  `priya_pc` is refused; a social media `fail` naming `locked_out` is refused too, because she has
  a phone and so never fails the need.
- F10 to F13 (C2): `POST /feed_post` for Nadia before the breaker is thrown (no live `down` cause and
  no recorded work failure) never serves `f10_vent`: the answer is her ordered post or `{ post: null }`,
  and the vent text is absent from every response until the server serves it. Extra request fields
  (a forged `post_id`, `when`, `cause` or `index`) cannot force a reactive post or pick one: the route
  reads only `npc_id` and the `object_id` location, and the server decides the condition. The same for
  Greg's `f12_vent` before his outage, Theo's `f11_borrowed` before his borrow, and Ruth's
  `f13_blocked`/`f13_fixed` before her failure and recovery.
- F14 (q36, q33 R2 m1): after Sade's lockout at the hot desk, `POST /feed_post` for her with
  `object_id` `f14_hot_desk` is `{ post: null, done: false, refused: true }` and a social media
  `ease` for her there is refused.
