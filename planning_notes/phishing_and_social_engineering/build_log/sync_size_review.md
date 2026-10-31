# Review: the `mailState` save against the earlier sync-size work

Written 2026-10-21. Read-only review: no code was changed. Line numbers are from the working tree on
that date. The mail parts of `state-sync.js` are not committed yet.

## 1. What the earlier work did, and why

### History

| Commit | Date | What it settled |
|--------|------|-----------------|
| `1de257bb` | 2026-10-01 | The first `pagehide` sync, so globals set just before a reload survive. Keepalive `fetch`, body capped at 60 KB (`KEEPALIVE_BODY_LIMIT`, `state-sync.js:5`), with a reduced section list when the body is over the cap. |
| `4095fc02` | 2026-10-02 | Phone persistence. `phoneState` is keyed per contact, and each entry is sent whole. `exportPhoneState({ onlyChanged })` and `markPhoneStateSynced` (`npc-manager.js:1876-1898`) track what the server holds, so the unload flush carries only changed contacts. Server caps: `MAX_PHONE_STATE_BYTES` 512 KB, 150 messages and a 60 KB story state per contact (`game.rb:1963-1991`). An over-cap merge is not saved. |
| `c0c76a80` | 2026-10-03 | `scenarioClock`, `npcVisibility` and `commandBoardLog` added. The general global change log was removed because it grew without limit. |
| `21d62402`, `dea05b70`, `54fc9b63` | 2026-10-03/04 | The brief behind the scaling work: `docs/agents/SAVE_STATE_SCALING_PROMPT.md` (the problem) and `docs/agents/SAVE_STATE_AB_PROMPT.md` (the approved plan A+B). |
| `5decddae` | 2026-10-04 | **The main change.** Change-only client, one narrow locked load, at most one write and none when nothing changed, `clientTs` ordering, and the GIN indexes dropped (`db/migrate/20261004000001_remove_jsonb_gin_indexes_from_break_escape_games.rb`). |
| `5250d1d9` | 2026-10-04 | `scripts/load_test/sync_state_load.rb` (N players, a class-start burst, latency plus WAL, update and TOAST counts) and `tools/playtest/sync-state-regress.js`. The regression checks that a reload keeps state, an idle player sends nothing, and one changed global sends only that key. |
| `a73b1175` | 2026-10-17 | `playerHealth` added as a whole section, last write wins. |
| `91c1ee03`, `8f38fff3` | 2026-10-21 | SE Phase 0: `syncConfirmed` and the run-scoped error (P0-R R-14). The size rules did not change. |

### Why

The target was about 1,000 concurrent players on Hacktivity's shared Postgres and Puma
(`SAVE_STATE_SCALING_PROMPT.md`). Before the change, every player sent a full snapshot every 30 s,
idle or not. Each request read the whole row twice, including 60–150 KB of `scenario_data`, wrote
`player_state` twice and rebuilt a GIN index on it. The estimate was about 67 jsonb UPDATEs a second
and several GB of WAL an hour. The deciding measurement is in `SAVE_STATE_AB_PROMPT.md`, under
"Postgres facts":

- `jsonb_set` and `||` do not write part of a value in place. Changing one key of a 35 KB
  `player_state` wrote 38.5 KB of WAL.
- An unchanged large column in the same row costs nothing.
- So the savings come from **not writing**, **writing once** and **having no GIN index**. The way
  the SQL is written saves nothing.

### The principles it settled

1. **Idle sends nothing.** `buildChanges` returns null when nothing changed (`state-sync.js:258,275`).
   The regression script checks this with two idle minutes.
2. **Diff against what the server confirmed**, not against the last value sent. `this.confirmed` is
   updated only after a 2xx answer that is not stale (`:280-294`, `:350-355`). A failure leaves it
   alone, so the next sync resends the current values.
3. **Keyed sections send only changed keys.** Each key is compared as `JSON.stringify` of its whole
   value. A key that has gone is sent as `null` (`:188-203`). The granularity chosen was coarse: a
   whole NPC's ink variables, and a whole phone contact's thread with history and story state. The
   unit was "one thing a player interacts with", not "one field".
4. **Values that tick are not changes.** The clock's elapsed time and `timedMessages.remainingMs`
   change every second. Only a change in timer state or pending ids counts (`:234-256`). The current
   times ride along with any other change, and a clock-only sync goes at most every 5 minutes
   (`CLOCK_ONLY_INTERVAL_MS`, `:9`).
5. **Notes go by id**, so one edited note is one note (`:205-213`).
6. **Small lists are sent whole** (`commandBoardLog`, `biometricSamples`, `playerHealth`, `:24`).
7. **The first sync after a load sends everything.** `confirmed` is deliberately not seeded from
   the restored state, because restore is spread across systems and is partly async
   (`SAVE_STATE_AB_PROMPT.md`, "Baseline on load"). That sync goes by normal PUT, which has no
   60 KB limit.
8. **One sync in flight per page.** Forced syncs queue behind the running one (`:323-335`).
9. **`pagehide` has a 60 KB budget.** Over it, `flush()` drops whole sections in a fixed order of
   what a reload most needs, and never cuts a section part-way (`:391-420`).
10. **The server reads narrowly and writes once.** `Game.lock.select(SYNC_STATE_COLUMNS)`
    (`games_controller.rb:1379`, `:704`) skips `scenario_data`. `save!(validate: false)` runs only
    `if @game.changed?` (`:719`). Every merge helper mutates and never saves. `startRoom` and
    `scenario_data` are fetched only on the rare paths (`:1414`, `:1497`).
11. **Ordering by `clientTs`.** A stale request applies only the merges that can only grow
    (`merge_grow_only_sections`, `:1477`) and skips the last-write-wins ones
    (`merge_last_write_wins_sections`, `:1409`). A clock set back is capped at 10 minutes (`:1385`).
12. **Server caps per section.** An over-cap merge is not saved and the previous state stands
    (phone, `game.rb:1985-1988`).
13. **Payload grouping** into team-shared and per-player sections, ready for a future multiplayer
    table (`state-sync.js:35-41`).

What it deliberately left out:
- save-on-change (the user kept the 30 s model);
- a shared setter for globals (diff snapshots instead);
- partial jsonb writes (measured as useless);
- a global change log (removed);
- seeding `confirmed` on load.

## 2. The mail save as built

**Client.**
- `mail-scheduler.js:120-131` `exportMailState()` returns flat keys: `mailboxes.<id>` (the whole
  mailbox, every message plus `unread`), `jobs`, `threads` (all threads in one key), `drafts` and
  `metrics`. A mission with no mail returns null, so no key is ever sent (R4).
- `state-sync.js:13` adds `mailState` to `KEYED_SECTIONS`. `:19-21` compares `jobs` by
  `[jobId, kind, accountId, msgId, messageId]` only. `:270-274` makes the jobs, with their current
  `remainingMs`, ride along with any other change. `:403-404` puts `mailState` second in the first
  reduced flush list, and the second list drops it whole.
- Writes happen in place on `window.mailState`. A read mark sets `rec.read = true`
  (`mail-client-minigame.js:203-211`). A delivery appends and removes the job in one synchronous step
  (`mail-scheduler.js:354-379`). No mail code calls `stateSync.sync()`, so mail changes join the
  30 s sync.

**Server.**
- `games_controller.rb:1436-1440` merges `mailState` in the last-write-wins group.
- `game.rb:2078-2110` `merge_mail_state!` does three things:
  1. It deep-dups the saved section and replaces each incoming key whole (a null deletes it).
  2. It checks the count caps.
  3. It trims, in the order read seeded mail, read replies, sent (`:2177`), then checks the 1 MB cap.
  A refusal logs a warning and returns false (`:2101-2104`). The caps are at `:2044-2065`.
- `games_controller.rb:361-363` sends the stored section back as `savedMailState`.
  `core/game.js:1476` restores it. If nothing is saved, the scenario's seeded mail is loaded
  instead (`mail-scheduler.js:96-111`).

**Size** (spike F4, `P1-C_spikes.md:43-82`). The model is deliberately generous.

| Case | Size |
|------|------|
| Whole section for a full student | about 40 KB |
| `mailboxes.guest` | 33.6 KB |
| Six seeded messages | 7.4 KB |
| One sent record | 1.4 KB |
| One reply | 0.56 KB |
| One thread position | 0.5–0.8 KB |
| One delivery's change | 34.6 KB |
| One send's change | 35.1 KB |

At the plan's expected two to three sends per target, `guest` is nearer 25 KB.

## 3. How it fits

### What it follows

- **Idle sends nothing.** The jobs change key keeps the countdown from making `jobs` dirty every
  tick, as `timedMessages` does (principle 4). An idle player with pending replies sends nothing
  until something else changes.
- **No extra requests or writes.** Mail changes join the 30 s sync. There is no forced sync and no
  new endpoint, so the write count per player is unchanged (principle 10).
- **Confirmed-diff, stale handling, caps and "not saved if over cap".** These are all inherited
  (principles 2, 11, 12). Putting `mailState` in last-write-wins is right, because each key replaces
  the stored one whole.
- **Delivery atomicity.** A message and the removal of its job travel in one body and one write.
  `flush()` drops `mailState` whole and never cuts it (principle 9).
- **The narrow load is kept.** `merge_mail_state!` reads nothing from `scenario_data`.

### What it strains

1. **The keyed unit is the whole mailbox, and every change resends it.** A delivered reply, a send
   and a single read mark each resend all of `mailboxes.guest`, up to about 35 KB. The phone
   precedent (one whole thread per contact) looks similar, but a phone thread is short texts. A
   mailbox holds rendered bodies of about 700 characters, and the player's own sent records sit in
   the same key as the replies. The earlier work chose coarse keys because the entries were small.
   This one is not. Read marks are the common case: every message the student opens costs a 35 KB
   PUT at the next sync.
2. **The `pagehide` budget.** A 35 KB delta leaves about 25 KB for everything else. F4 judged that
   enough for the lab. Contract 00 §13 already narrows the promise to "delivery-then-close kept only
   for a small `mailState`". The budget was set for the whole flush, and one section now takes most
   of it. In any mission where the globals or a phone thread also change in the same 30 s, the mail
   is the part dropped.
3. **DB write size, the cost the earlier work measured.** Postgres rewrites the whole `player_state`
   on any write (38.5 KB of WAL for one key in 35 KB). Once a game holds 25–40 KB of `mailState`,
   *every* write to that row costs that much more WAL. That includes each changed-global sync, each
   unlock, each item pickup and each task completion, for the rest of the game. Finer keys on the
   wire do not change this. **Only storing less does.** TOAST compression will shrink the stored
   bytes somewhat. This is not measured.
4. **Seeded mail is stored in full.** It is scenario data: `_loadSeeded` can rebuild it from
   `social.mailClient.seededMessages` at any time. The only player state in it is `read` and, for a
   `deliverAt` message, the time it arrived. In the lab that is 7.4 KB of about 40 KB. A scenario
   with a found mailbox and its history (01 N15, deferred) could store dozens of authored messages
   the player never opened. Each of them is also sent again in the first sync after every reload.
   Storing it also means a fix to the seeded text never reaches a game already in progress.
5. **`threads` is one key.** A change to one thread resends every thread's ink position. Positions
   are under 1 KB at the start of a story but grow as it runs. The cap allows 60 KB each and 200
   threads. The phone keys story state per contact for this reason.
6. **Redundant fields.** `unread` is stored and sent, but `restore()` recounts it and ignores the
   saved value (`mail-scheduler.js:157-158`).
7. **The job countdown riding along** is fine. `jobs` is under about 1 KB and joins writes that
   happen anyway. It works as `timedMessages` does, and has the same known effect: a reload can add
   up to 30 s to a pending reply.
8. **A silent refusal (correctness, not size).** When `merge_mail_state!` refuses (a count cap, more
   than 200 unread, over 1 MB after trimming), the request still answers `{ success: true }`. The
   client then marks the keys confirmed (`state-sync.js:355`). The server and client now disagree,
   and the change is not resent until that key changes again. The phone has the same gap, but its
   caps are rarely reached. Mail has more count caps.
9. **Trimming and the client.** The server trims messages without telling the client. With
   whole-mailbox keys, the next change to that mailbox sends the trimmed messages again and the
   server trims them again. That is consistent, but it is wasted bytes.

## 4. The options

| Option | Wire and flush | Stored and WAL | Cost and risk | Verdict |
|--------|----------------|----------------|---------------|---------|
| **Per-message keys** (`mailboxes.<box>.<msgId>`) | A delivery is about 0.6 KB plus jobs. A read mark resends one message (0.6–1.4 KB). A send is about 3 KB with jobs, metrics and drafts. The flush budget stops being an issue. | Unchanged: the stored shape can stay nested. | Client: the export key shape only, because the diff code already handles any keys and nulls. Server: upsert by id into the mailbox array. | **Yes.** It fixes strains 1 and 2 and matches principle 3, with the keyed unit sized to what the player touches. |
| **Don't store seeded mail; store a stub** (`{ id, seeded: true, read, gameTime }`, about 60 B) | Removes 7.4 KB from every first-after-load sync | Removes 7.4 KB per lab game, and more where a found mailbox has history | Restore must rebuild from the scenario, then overlay the saved state. The trim must never drop a stub (see §5). | **Yes.** It is the only option that cuts strain 3, the cost the earlier work cared about. |
| Read/unread ids only for seeded mail (a `seenIds` set) | Similar | Similar | One more key, but delivered `deliverAt` seeds still need their arrival time, so it ends up as stubs anyway | Folded into the stub option |
| Append-only message log | Same as per-message keys | Same | Replaying an append is not idempotent unless it goes by id, and once it does it is per-message keys. Read marks need a second channel. | No |
| Replies by reference to authored text | Saves about 0.4 KB per reply | Small | Works only for text jobs (`replies.landed` and the canonical fail lines). Ink replies are story output and cannot be referenced. Sent bodies are stored rendered **on purpose** (00 §10a: a template edit must not change what was sent). | No, not worth a second code path |
| Compression (gzip + base64 on the client) | Smaller on the wire, but base64 adds a third | Postgres TOAST already compresses. An opaque blob cannot be sanitised or capped, and the engagement report (`10`) and Hacktivity cannot read it. | Breaks principle 12 | No |
| Keep as built | — | — | Already shipped as uncommitted code | Acceptable for the lab at the expected volume, but strains 1–3 grow with every scenario that adds mail |

## 5. Recommendation

The smallest change consistent with the earlier work comes in three parts. Keep the stored shape
nested, so the bootstrap and `savedMailState` do not change.

**A. Per-message keys on the wire.**
- Client, `mail-scheduler.js` `exportMailState()`:
  - emit `mailboxes.<boxId>.<msgId>` for each message, instead of `mailboxes.<boxId>`;
  - stop emitting `unread`.
  - `state-sync.js` needs no change to its diff logic. The jobs ride-along, the flush order and
    "dropped whole" all stand.
- Mailbox ids must not contain `.`. Add a validator rule for `social.mailClient.mailboxes[].id`.
  Message ids may contain dots, because the server splits on the first dot after the prefix.
- Server, `game.rb` `mail_state_updates` and `merge_mail_state!`:
  - parse `mailboxes.<box>.<msgId>` as `[mailboxes, box, msgId]`;
  - upsert the sanitised message by id into `boxes[box]['messages']`, appending new ids;
  - treat a null as removing that message;
  - stop accepting a whole `mailboxes.<box>` key. No client has shipped with it, because the code is
    uncommitted. `restore()` still accepts both the nested and the dotted shapes.
- Run the per-mailbox count check and trim only for mailboxes that received an upsert, as now.
- Drop `unread` from the sanitiser.

**B. Seeded mail stored as stubs.**
- Client, `exportMailState()`: emit a message with `seeded: true` as `{ id, seeded: true, read,
  gameTime }`.
- `init()` builds from the scenario first and overlays the save second:
  1. Run `_loadSeeded` for the immediate seeds and the configured mailboxes.
  2. If there is a saved section, replace each stub with the authored message plus the stub's `read`
     and `gameTime`.
  3. A `deliverAt` seed with a stub is delivered (build it from the scenario). One with a saved job
     is pending. One with neither gets a fresh job: the scenario gained it after the save.
  4. Take jobs, threads, drafts, metrics and the player's own messages from the save.
  5. Drop a stub whose authored message has gone from the scenario.
- This also fixes a gap in the current code. `restore()` builds mailboxes only from the save, so a
  configured mailbox with no messages yet is missing after a reload until something calls
  `ensureMailbox`.
- Server, `trim_mail_messages!` (`game.rb:2177`): never drop a seeded stub. Dropping one would
  bring the message back unread on reload, and stubs are tiny. Tier 0 then disappears, and the
  order becomes read replies, then sent. Contract 00 §10a's trim sentence changes to match.

**C. `threads` keyed per thread.** Emit `threads.<character>:<accountId>` and let the server upsert
per key, as the phone does per contact. `drafts` and `metrics` stay single keys, because each is
under 300 B.

**D. Fix the silent refusal.**
- Have `merge_last_write_wins_sections` record which section was not saved, and answer
  `{ success: true, notSaved: ['mailState'] }`.
- In `confirm()`, skip the ack for any section listed there, so it is resent. The client already
  refuses nothing locally, so a refused key is resent every sync until it fits. Log it once per page.
- Apply the same to `phoneState`, which has the same gap.

**Expected effect for the lab** (from the F4 figures):

| Change | Before | After |
|--------|--------|-------|
| A delivery's change | 34.6 KB | about 1.6 KB |
| A read mark | about 34 KB | about 1 KB |
| Stored section, generous model | about 40 KB | about 33 KB |
| Stored section, expected volume | about 30 KB | about 23 KB |

The reduction in stored size is the only part that lowers WAL per write. It is modest for the lab
and larger for any scenario with found-mailbox history. Measure it with
`scripts/load_test/sync_state_load.rb` once a lab mission can be loaded. It needs a mail mix added
to its tick model (deliveries and read marks).

**Tests and docs to change with it.**
- `test/js/social-mail-state-export.test.mjs`:
  - per-message keys;
  - one read mark sends one key;
  - a delivery sends one message plus jobs;
  - seeded mail exports as stubs;
  - restore rebuilds seeded mail from the scenario.
- `test/controllers/break_escape/mail_state_sync_test.rb`:
  - upsert and delete by message id;
  - the trim never drops a stub;
  - `notSaved` on a refusal.
- R4 (`sync-state-regress.js`) unchanged.
- Docs:
  - 00 §10a "Persistence", the trim order and the `pagehide` bullet. The "small `mailState`" caveat
    can go.
  - 00 §13 row "`mailState` flush".
  - 00 S9 row.
  - 01 N2 and the "Persisted mail" table.
  - `P1-C_spikes.md` F4 "What follows". The per-message key it named as the later fix becomes the
    design now.

Nothing above changes how often anything is sent, the stale rules, or the one-write-per-request
rule.

## P1-S outcome

Written 2026-10-21 by P1-S. Recommendations A to D are built. Nothing changes how often anything is
sent, the stale rules or the one-write-per-request rule.

**A. Per-message keys.**
- `mail-scheduler.js` `exportMailState()` (line 157) emits `mailboxes.<box>.<msgId>` per message and no
  `unread`. The in-memory mailbox still holds `unread`, because the mail client reads it there; it is
  recounted and never sent.
- `game.rb` `merge_mail_state!` (2084) and `mail_state_updates` (2137) split the key on the first dot
  after `mailboxes.`, so a message id may hold dots. They upsert by id (a new id is appended) and treat
  a null as a delete. A mailbox left empty is removed. A whole `mailboxes.<box>` key and the nested
  `mailboxes` key are no longer accepted. The per-mailbox trim runs only for mailboxes that received a
  key. `sanitize_mail_mailbox` and its `unread` handling are gone.
- `scripts/validate_social/mail.rb` `dotted_ids` (473): an error for a dot in a
  `social.mailClient.mailboxes[].id` or a `seededMessages[].id`. The packet asked for both, which is
  stricter than the review (which allowed dots in message ids). The server still accepts dotted
  message ids, since runtime ids are generated and never hold a dot.

**B. Seeded stubs.**
- A seeded message exports as `{ id, seeded: true, read, gameTime }`. A message counts as seeded when
  it has `seeded: true`, or when its id and mailbox match an authored seed. The second rule covers mail
  the mail client seeds through `mail-data.js` `normaliseSeeded`, which does not set `seeded`.
- `init()` (130) builds the seeds, the configured mailboxes and the `deliverAt` jobs from the scenario
  first, then calls `restore()` (206) on top. `restore()` applies 5.B steps 1 to 5. It also keeps any
  immediate seed the save lacks, so a seed added to the scenario after the save appears.
- `trim_mail_messages!` (2210) never drops a message with `seeded: true`. The order is now read
  replies, then sent records.
- One gap is left. A delivered `deliverAt` seed with no authored `time` rebuilds its displayed `time`
  from the stub's `gameTime` only when the game clock is configured. Otherwise it shows the reload time.
  The stub could carry `time` if that matters.

**C. Threads per key.** The client exports `threads.<character>:<accountId>`. The server upserts or
deletes per key and no longer accepts a whole `threads` key. `drafts` and `metrics` stay single keys.

**D. Refusals.**
- `games_controller.rb` `sync_state` collects `@not_saved` (706). It adds `phoneState` (1439) when
  `merge_phone_state!` returns false (it now returns true or false) and `mailState` (1446) when
  `merge_mail_state!` returns false. An update with nothing usable returns nil and is not a refusal.
  The answer is `{ success: true, notSaved: [...] }` only when something was refused, and exactly
  `{ success: true }` otherwise.
- `state-sync.js` `_syncOnce` (351) reads `notSaved`, logs each section once per page and passes the
  list to `confirm(changes, now, notSaved)` (286). `confirm()` skips the ack of a refused keyed section,
  including the jobs ride-along. It also skips `markPhoneStateSynced` for a refused `phoneState`. The
  run still reports `ok: true`. A cap refusal is not a network blip, so `syncConfirmed` should not
  retry it. A refused section is resent with each sync until it fits, which means one request every
  30 s while the cap holds.

**Measured** (scratch `measure.test.mjs`; `guest` with 2 seeds, 15 sends and 15 replies with
700-character bodies, 34.4 KB as the old whole-mailbox key):

| Change | Before (F4) | After |
|--------|-------------|-------|
| A delivery's diff (message + `jobs`) | 34.6 KB | 1,079 B |
| A read mark on a reply | about 34 KB | 1,068 B |
| A read mark on seeded mail | about 34 KB | 83 B |
| Two seeded messages stored | 563 B | 116 B (stubs) |
| First sync after a load, `mailState` | about 34 KB | 35.8 KB (per-key overhead; normal PUT, no budget) |

**Tests.**
- `social-mail-state-export` 15/15, with these new cases: per-message keys, the stub export, a
  delivery diff of 0.7 to 2 KB, a read mark of 1.2 KB or less, stubs rebuilt after a reload (a fixed
  seed text reaches the game, read kept, the delivered `deliverAt` stays delivered, an empty
  configured mailbox survives, a dropped seed's stub is dropped), `deliverAt` pending or fresh, a
  refused `mailState` resent and logged once, a refused `phoneState` not marked synced, and `confirm`
  unchanged with nothing refused.
- `social-mail-scheduler` 9/9. Its restore test now builds the true nested shape. The old conversion
  had made a mailbox called `guest.welcome` and still passed.
- `state-sync` 12/12, `social-state-sync-confirmed` 8/8, `social-mail-client-shell` 13/13,
  `social-mail-composer` 10/10.
- `validator-social-mail` 11/11, with a new case for dotted ids.
- `bin/rails test`: 713 runs, 0 failures, 0 errors, 1 skip. `mail_state_test.rb` covers the upsert,
  delete, dotted message ids, no whole-mailbox or whole-thread key, stub storage, per-thread
  upsert and delete, the trim keeping stubs (per mailbox and over the byte cap), and nil versus false.
  `mail_state_sync_test.rb` covers per-message upsert over HTTP, the stale flush unable to undo a read
  mark, `notSaved` for `mailState` and for an over-cap `phoneState`, and the exact `{ success: true }`
  answer.
- Full node suite (Node 18): 1058/1059. The failure is the runner's "Unable to deserialize cloned
  data" in `event-mapping-unlock-door.test.mjs`, which passes 4/4 when run with `node`.

**R4** (`sync-state-regress.js`, keyless :3001, run with the cached Node 24 at
`~/.cache/ms-playwright-go/1.57.0/node` and chromium-1148, because the repo's Playwright needs Node 20
and the system node is 18):

| Mission (game) | Lost globals after reload | Flush-only global kept | Phone threads | Idle 120 s (page / server log) | One changed global | `mailState` in any body |
|---|---|---|---|---|---|---|
| m01 (2870) | none | yes | 1 → 1 | 0 / 0 | 1 request, that key only (plus clock and timed texts) | none |
| m05 (2871) | none | yes | 4 → 4 | 0 / 0 | 1 request, that key only (plus clock and timed texts) | none |

This matches the P0-E and P1-C results: no lost globals, 0 idle requests, 1 request per changed
global. The browsers closed themselves.
