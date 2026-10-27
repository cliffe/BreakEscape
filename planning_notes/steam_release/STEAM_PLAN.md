# Steam app: implementation plan

Status: plan, 2026-10-27, revised the same day after an Opus review. No code changed. Builds on
`README.md` ("Mode A", "Single-game app mode", "Desktop app status"), `ENTITLEMENTS.md` ("How Steam
ownership reaches Hacktivity", "Sign-in details"), `ACCESS_MODEL.md` ("Store apps"),
`GAME_SHELL_FOR_APP.md`, `OPEN_QUESTIONS.md` (rounds 1–6) and `ANDROID_PLAN.md`, whose shape this
plan copies.

Superseded by the owner's 2026-10-27 decisions: E4 ("the Steam build is for Steam buyers") and every
"only Steam buyers play in the Steam app" rule. Access is account-wide on every platform, and every
buy prompt goes to the platform's own purchase (in the Steam app, the Steam store page; built in
Android P2b, Hacktivity `21f72af9`). Every other answer in `OPEN_QUESTIONS.md` stands.

The aim: everything below works end to end on a developer machine **before** the owner has a Steam
app id or a publisher Web API key, using a fake Steam Web API client in Hacktivity and a fake
steamworks layer in the desktop app, as the Android work did with a fake Google client and a fake
Digital Goods service. Only the owner-gated packages (S12, S13) need the real ids and key.

Standing rules for every package: ask the owner before each Hacktivity edit (Hacktivity work goes
on `main`; the owner has approved building this plan, which includes the account hardening in S14);
stage explicit paths and check `git diff --cached --stat`; a fix is proven on the real path (dev
server on :3000, the Electron app against it), not only by unit tests; no SecGen XML and no VM
exploit content anywhere in this work. Steam facts marked **verify** are from memory and must be
checked against the current Steamworks documentation at the start of the package that relies on
them. Packages marked **Opus review** get an adversarial Opus review round before merge (AGENTS.md).

## 1. Architecture

### Access is account-wide

The Steam app adds a way to **sign in** and a way to **record a Steam purchase**. It adds no access
rule. A live `steam` row in `event_entitlements` is read by `EventAccess#entitlement_route?` like any
other source (no source filter; Hacktivity `app/services/event_access.rb:59-61`), so a Steam
purchase opens the game in the browser and the Play app too, and a subscription, organisation
access, a Play purchase or a staff grant opens it in the Steam app.

In practice the full Steam app can only be installed by someone who owns it on Steam, so
account-wide access shows up in the Steam client mainly through the **demo app**: a subscriber or
Play buyer who signs in there gets the full game. Valve's view of that is checked first (S12a, wave
1), and the demo keeps Steam sign-in switched off until it is answered (open question 2).

### Ticket sign-in is weaker than a password sign-in, so it gets less

B5 lets a Steam ticket sign in with no Hacktivity token or authenticator code. Hacktivity's own
sign-in always asks for one (`users/sessions_controller.rb:31-37`), so a ticket session must not
reach what those protect. Four rules, built across S3, S4 and S14:

1. **A Steam account is linked only to an account that has just done a full Hacktivity sign-in**
   (password plus emailed token or authenticator code), made after the link was asked for. Never at
   sign-up, never to a session that was already open (review 2.1, 2.2).
2. **Shared guest accounts** (`User#guest?`, `guest<n>@guest.com`) and staff accounts (B10) are never
   linked, never signed in by ticket, and never get a `steam` row.
3. **A ticket session is marked on the server** (`session[:auth_via] = "steam_ticket"`). A marked
   session outside app mode is signed out (S14); the UA token alone isn't trusted for this.
4. **What the password protects asks for it again:** deleting the account and turning MFA off need
   the current password (S14), for every user. The holder gets an email whenever a Steam account is
   linked (S4).

### What is already built

| Piece | Where | State |
|---|---|---|
| Electron shell, full and demo editions, UA token, navigation and frame guards, offline page | `hacktivity-desktop` `src/` | Built, four review rounds |
| steamworks.js 0.4.0 (optional dependency), `init(appId)` and the overlay workaround, full edition only, when `STEAM_APP_ID` or `editions.full.steamAppId` is set | `hacktivity-desktop/src/app.js` `initSteam()` | Built; nothing calls the auth API yet |
| `/app/:game_key` entry, app mode scope guard, "Open in your browser" page | Hacktivity `AppEntryController`, `concerns/app_mode.rb` | Built |
| `AppClient` token parser (`store=steam` default) | Hacktivity `app/services/app_client.rb` | Built |
| Buy prompts in the Steam app go to `events.store_url` in the system browser | Hacktivity `game_shell_helper.rb`, `application_helper.rb` | Built (P2b) |
| `users.steam_id` (unique where not null), `steam_persona_name`, `steam_linked_at` | Hacktivity `db/schema.rb:637-648` | Columns exist, nothing writes them |
| `events.steam_app_id`, `steam_demo_app_id` (unique where not null), event form fields | Hacktivity | Built |
| `EventEntitlement` with `source: "steam"`, unique `(source, source_ref)`, one live row per user, event and source, `revoke!`; `move_to!(target, by:)` for **live Google Play rows only** | Hacktivity `app/models/event_entitlement.rb` | Built |
| Claim wait lifted for any live entitlement (D1) | Hacktivity `vm_set_assignment_service.rb:43` | Built |
| Account deletion anonymises and keeps every record; clears the three Steam columns; rewrites the `persona` copy in entitlement metadata | Hacktivity `app/services/user_anonymiser.rb` (P11a) | Built |
| Session id renewed on sign-in (Warden `renew`), CSRF token reset by Devise | Devise/Warden | Built; no `reset_session` needed |

### The pieces

```
 hacktivity-desktop (Electron main process)             hacktivity.co.uk (Rails)
 ┌────────────────────────────────────────┐            ┌────────────────────────────────────────────┐
 │ steam.js: real (steamworks.js) or fake │            │ GET  /app/<key>/steam/nonce  → {nonce}      │
 │ steam-signin.js goHome():              │──fetch────>│ POST /app/<key>/steam/session (JSON)        │
 │  1 nonce   (ses.fetch, no cookies)     │──fetch────>│   ticket → Steam; ownership → S2;           │
 │  2 ticket  (ses.fetch, no cookies)     │<─{code}────│   answers {status, code}; no session change │
 │  3 win.loadURL(…/steam/complete?code=, │──page─────>│ GET  /app/<key>/steam/complete?code=        │
 │      header X-Steam-Nonce)             │            │   + X-Steam-Nonce: signs out anyone, then    │
 │ shows local "Signing in…" page first   │            │   signs in (marked) or stores pending link   │
 │ re-auth: focus/resume, timer, sign-in  │            │ /app/<key>/steam/link  (link screen, B2)     │
 │   URL on will-frame-navigate/redirect  │            │ steam_sign_in_attempts (nonce, ticket, code) │
 └────────────────────────────────────────┘            │ daily SteamOwnershipRecheckJob (refunds)     │
                                                       │ admin: Steam panel, Unlink (B3), hold        │
                                                       │ EventAccess: unchanged, account-wide         │
                                                       └────────────────────────────────────────────┘
```

**Why a one-time code and a page load.** The main process never needs cookies: it asks for a nonce,
posts the ticket, and gets a short code. The sign-in happens on an ordinary top-level page load in
the window, which sets the Devise cookie like any other sign-in. So nothing depends on whether
`session.fetch` stores and sends cookies (review 4.1), and the ticket still never reaches the page.

| Piece | Where | What it does |
|---|---|---|
| Steam Web API client and fake | Hacktivity `app/services/steam_web_api.rb`, `steam_web_api/client.rb`, `steam_web_api/fake_client.rb`, `config/initializers/steam_web_api.rb` | Three calls: authenticate a ticket, check app ownership, read the persona name |
| Ownership sync | Hacktivity `app/services/steam/ownership_sync.rb`, `EventEntitlement` | Grants, reopens, revokes or moves the user's `steam` row from one ownership answer |
| Ticket sign-in | Hacktivity `steam_sessions_controller.rb`, `app/services/steam/ticket_sign_in.rb`, `steam_sign_in_attempts` table | Nonce, ticket check, code, completion |
| Link screen | Hacktivity `steam_links_controller.rb`, views, `after_sign_in_path_for`, a mailer | B2: create a free account or sign in, then link |
| Support tools | Hacktivity admin user page | B3 unlink, hold and release, move |
| Guards | Hacktivity `User` validations | B10 on every role path, guests |
| Account hardening | Hacktivity `ApplicationController`, registrations, MFA controller | Marked ticket sessions, password for deletion and MFA off |
| Refund recheck | Hacktivity `app/jobs/steam_ownership_recheck_job.rb` | Rechecks ownership without waiting for a sign-in |
| Minimum desktop build (A3) | Hacktivity `AppMode`, `events.desktop_min_version` | "Update through Steam" for old desktop builds |
| Steam layer | `hacktivity-desktop/src/steam.js`, `src/steam-fake.js` | One interface over steamworks.js or a fake |
| Sign-in flow | `hacktivity-desktop/src/steam-signin.js`, `src/app.js` | `goHome()` and the re-auth triggers |
| Steam builds | `hacktivity-desktop/scripts/build.js`, `steam/`, `scripts/steam-upload.js`, `scripts/smoke-packaged.js` | Unpacked builds per OS for depots, upload scripts with placeholder ids |

### The contract (fixed here so packages can run in parallel)

**Routes** (Hacktivity, new routes beside `app/:game_key`; each answers 404 outside app mode, and the
URL's `<key>` must equal the UA token's `game=`):

| Route | Answer |
|---|---|
| `GET /app/<key>/steam/nonce` | JSON `{nonce, identity}`. 32 random bytes; its SHA-256 goes into `steam_sign_in_attempts`. One use, 2 minutes. `Cache-Control: no-store`. No cookie involved |
| `POST /app/<key>/steam/session` | Body `{nonce, app_id, ticket}`, `Content-Type` exactly `application/json` (a `text/plain` post would need no preflight). Consumes the nonce with a conditional update (`used_at IS NULL`). Checks the ticket, runs S2. Answers below. **Signs nobody in and doesn't touch the session** |
| `GET /app/<key>/steam/complete?code=…` | Loaded by the desktop as a top-level page with header `X-Steam-Nonce: <nonce>`. The code is one use, 60 seconds, and must belong to that nonce (a link inside a page can't set the header). Signs out whoever is signed in, then signs in the linked user (session marked `steam_ticket`, no remember-me) or stores the pending link; redirects to `/app/<key>` or the link screen |
| `GET /app/<key>/steam` | App-mode page "Signing in through Steam…". The desktop intercepts a main-frame navigation to it and runs `goHome()`; if the page itself loads, Steam isn't running, and it says so with a link to the sign-in page |
| `GET /app/<key>/steam/link`, `POST /app/<key>/steam/link` | The link screen and the confirm step (S4). Form posts with the normal CSRF token |

**`POST …/steam/session` answers** (`status` field):

| status | HTTP | Meaning | Desktop does |
|---|---|---|---|
| `signed_in` | 200 | Linked user may sign in; `code`; `changed: true` if S2 changed access | Load `complete?code=` (on a purchase recheck with `changed: false`, nothing) |
| `link_needed` | 200 | Ticket valid, SteamID not linked; `code` | Load `complete?code=`: the server signs out any current user, stores the pending link and shows the link screen |
| `refused` | 403 | Linked account is deleted, a staff role (B10) or a guest account, or Steam says publisher-banned | Load `/users/sign_in` |
| `invalid` | 422 | Bad or reused nonce or ticket, unknown `app_id`, game key mismatch, ticket rejected | Load `/users/sign_in` |
| `try_later` | 503 | Steam's Web API not answering | Load `/users/sign_in?steam=unavailable`; the sign-in page in app mode shows "Steam sign-in isn't available right now. Sign in with your Hacktivity account." (`/app/<key>` would drop the parameter: `AppEntryController#source_params`) |
| `update_required` | 403 | Desktop build below `events.desktop_min_version` (S7) | Load `/app/<key>`, which shows the update page |

**One-time values:** table `steam_sign_in_attempts` (`nonce_sha256` unique, `ticket_sha256` unique
null, `code_sha256` unique null, `event_id`, `app_id`, `steam_id`, `user_id`, `outcome`,
`created_at`, `used_at`, `code_expires_at`, `completed_at`), pruned daily of rows over a day old. A
table, not `Rails.cache`: development runs `:null_store` unless `rails dev:cache` is on
(`config/environments/development.rb:40-56`), and a unique index makes "one use" atomic. The ticket
hash's unique index refuses a replay even when two requests race.

**Ticket identity:** `getAuthTicketForWebApi(identity)` and `AuthenticateUserTicket&identity=` use
the same fixed string, from credentials `steam.ticket_identity` (default `hacktivity`), sent to the
app in the nonce answer so the two can't drift.

**App ids:** `app_id` must be the app key's event's `steam_app_id` or `steam_demo_app_id` (or the
Playtest id, if open question 10 adds one). Hacktivity passes it to `AuthenticateUserTicket`.
Ownership is checked against `events.steam_app_id` (the full game), whichever app sent the ticket.
480 and 481 are development placeholders only and must never be set on a production event.

**Entitlement row:** `source: "steam"`, `source_ref: "<steamid64>:<app id>"`, `metadata`: `{persona,
app_id, checked_at, permanent, purchase_time, history: [...]}` plus `family_shared: true` when a
family-shared copy was seen (never the lender's SteamID). Nothing else about the player (B6).
SteamID64 values are checked to be 17 digits before they are stored.

**Desktop Steam layer** (`src/steam.js`): `start(cfg) → {running, appId, steamId (string),
personaName, onDeck}`, `ticket(identity) → hex`, `cancelTicket()`, `openStore(appId)`,
`openWebPage(url)`. `steamId64` is a bigint in steamworks.js; it is turned into a string at once,
since `JSON.stringify` throws on a bigint. Fake: chosen by `HACKTIVITY_FAKE_STEAM`, unpackaged only.

## 2. Work packages

Each is sized for one Sonnet agent, about half a day unless it says a day. "Proof" is the real-path
check the agent runs and reports with output or screenshots; unit tests alone do not close a
package. "Before answers" says whether it can start before the owner answers section 7.

```
Wave 1 (parallel):  S1 Steam Web API client + fake          (Hacktivity)
                    S5b guards: B10 role paths, guests       (Hacktivity)       Opus review
                    S7 minimum desktop build, A3             (Hacktivity)
                    S14 account hardening for ticket sessions (Hacktivity)      Opus review
                    S8 desktop Steam layer + fake
                    S10 desktop Steam builds + SteamPipe     (owns build.js and smoke-packaged.js)
                    S12a Valve policy check (owner with an agent; before the demo gets Steam)
Wave 2:             S2 ownership sync                        (after S1)        Opus review
                    S9a desktop launch exchange, goHome()    (after S8; Rails proof needs S3, see S9a)
Wave 3:             S3 ticket sign-in endpoints              (after S2)        Opus review
                    S5a support tools                        (after S2)
                    S6 refund recheck job                    (after S2)
                    S9b desktop re-auth and outside links    (after S9a)
Wave 4:             S4 link screen, a day                    (after S3, S5b, S14)  Opus review
Wave 5:             S11 local end to end                     (after all of the above)
Any time:           S0 app 480 client and sandbox check (needs the owner's Steam client signed in)
Owner-gated:        S12 Steamworks setup (owner with an agent)
                    S13 live check on a Steam beta branch    (after S11, S12, O1–O6)
After Q10:          S2p Steam Playtest ownership             (after S2)
Later:              achievements; a narrow preload for the Deck keyboard; Steam sign-in on the website
```

Before the owner answers: S1, S5b (built to the recommendations in questions 3 and 4), S7, S14, S8
(the demo's app id stays null), S10, S2 (built to the recommendations in questions 5–8), S3, S5a,
S6, S9a, S9b, S4 and S11 can all start. S12a is itself the answer to question 2. S2p waits for
question 10. The demo's Steam sign-in is switched on only after question 2.

### S0. App 480 client and sandbox check (owner present)

- **Needs:** the owner's machine with the Steam client signed in (`/usr/bin/steam` is installed
  there). An agent can't sign in to Steam.
- **Do:** `STEAM_APP_ID=480 HACKTIVITY_URL=http://localhost:3000 npm run start:full` in
  `hacktivity-desktop` with a scratch call (not committed) that logs: `init(480)` succeeds, the
  SteamID (as a string) and persona from `localplayer`, `auth.getAuthTicketForWebApi('hacktivity')`
  resolves and `getBytes()` is non-empty, `overlay.activateToStore(480, 0)` and
  `activateToWebPage` draw over the Electron window (Shift+Tab) on X11 and on Wayland. Also add the
  unpacked Linux build (S10) as a non-Steam game and start it from Steam: does the Chromium sandbox
  start without `--no-sandbox` (on Ubuntu 24.04's AppArmor rules and with each Linux runtime setting
  the owner's Steam offers for a non-Steam game)? This feeds open question 12 before S13.
- **Optional, verify first:** whether `AuthenticateUserTicket` accepts a 480 ticket with an ordinary
  Web API key on `api.steampowered.com` (community reports say yes; unconfirmed). Ownership can't be
  tested with 480 at all.
- **Done:** a note in the report. Nothing in S1–S11 depends on it.

### S1. Hacktivity: Steam Web API client and fake

- **Before answers:** yes.
- **Repo/files:** Hacktivity `app/services/steam_web_api.rb` (module, errors, value structs, client
  selection, the shape of `app/services/google_play.rb`), `steam_web_api/client.rb`,
  `steam_web_api/fake_client.rb`, `config/initializers/steam_web_api.rb`,
  `config/initializers/filter_parameter_logging.rb` (`ticket`, `nonce`, `code`),
  `lib/tasks/steam_fake.rake`; credentials per environment,
  `credentials.dig(Rails.env.to_sym, :steam)` → `{ publisher_key:, ticket_identity: }`, as
  `config/initializers/google_play.rb` reads Play's.
- **Build:** no new gems (Ruby 2.7; `httparty`). Three calls on `partner.steam-api.com`:
  - `authenticate_user_ticket(app_id:, ticket_hex:, identity:)` → `Ticket(steam_id,
    owner_steam_id, publisher_banned)` from `response.params`; `response.error` → `Invalid`.
  - `check_app_ownership(steam_id:, app_id:)` → `Ownership(owns, permanent, purchase_time,
    owner_steam_id, site_license, timed_trial)`. v2 fields `ownsapp, permanent, timestamp,
    ownersteamid, sitelicense, result`; `timedtrial` **verify** (nil if absent).
    `GetPublisherAppOwnership` is the fallback if v2 is withdrawn.
  - `persona_name(steam_id)` → string or nil, `ISteamUser/GetPlayerSummaries/v2` (**verify** with a
    publisher key; if refused, open question 11's fallback).
  Errors: `Invalid`, `TryLater` (5xx, timeouts, 429), `AuthError` (403 on our key), `NotConfigured`.
  Timeouts 5 s open, 10 s read. Production egress through the proxy, as
  `GooglePlay::Client#proxy_options` (`STEAM_USE_PROXY=1` elsewhere). The key goes in the query
  string, so the client never logs a URL, and exceptions carry the path only.
- **Fake:** chosen in development and test when no `publisher_key` is set, or by
  `STEAM_WEB_API_CLIENT=fake`; production boot raises if the fake is configured.
  - Tickets: the desktop fake (S8) sends the hex of `fake:<steamid64>:<app id>:<random>`. The fake
    decodes it and checks the app id. A SteamID ending `0403` is publisher-banned; anything not
    `fake:` hex is `Invalid`; app id `999` is `TryLater`. Steam itself doesn't refuse a reused
    ticket; replay protection is ours (S3).
  - Ownership: `tmp/fake_steam_ownership.json`, read on every call so the server, the console and
    jobs agree: `{"<steamid>:<appid>": {"owns": true, "owner": "<steamid>", "permanent": true,
    "site_license": false, "timed_trial": false, "purchase_time": "..."}}`. Missing means not owned.
    Rake tasks: `steam:fake:own`, `steam:fake:refund`, `steam:fake:family[steamid,appid,owner]`,
    `steam:fake:free_weekend` (`permanent: false`), `steam:fake:site_license`, `steam:fake:list`.
  - Persona: `"Fake <last 4 digits>"`.
- **Tests:** `test/services/steam_web_api/client_test.rb` (webmock: URLs and params, no key in raised
  messages or logs, each error mapping, proxy option, **the real client sends a `fake:` ticket to
  Steam like any other and maps the answer to `Invalid`**, never decoding it); `fake_client_test.rb`;
  production refuses the fake.
- **Proof:** `bin/rails runner` in development: each fake call, then the rake tasks changing
  `check_app_ownership`'s answer.

### S2. Hacktivity: ownership sync (Opus review)

- **Before answers:** yes, to the recommendations in questions 5–8.
- **Repo/files:** Hacktivity `app/services/steam/ownership_sync.rb`,
  `app/models/event_entitlement.rb`, tests.
- **Model change:** `move_to!(target, by:)` today raises unless the row is a live Google Play row,
  and writes `by.id`/`by.handle` (`event_entitlement.rb:80-96`). Add a Steam path,
  `move_to!(target, by: nil, reopen: false)`: for `steam` rows it allows a revoked row, writes
  `"by" => "steam_sign_in"` when `by` is nil, refuses a target that doesn't hold the row's SteamID,
  and with `reopen: true` clears `revoked_at` and appends to `history` in the same lock. The Play
  path and its tests stay exactly as they are (live only, `by:` required). Add `reopen!(reason)`.
- **Build:** `Steam::OwnershipSync.new(user:, event:, steam_id:, ticket_owner:).call(ownership)`,
  one transaction, row locked. Rules:
  1. **Owns** means `owns && permanent && !site_license && !timed_trial && owner_steam_id ==
     steam_id && ticket_owner == steam_id`. A free weekend answers `owns: true, permanent: false`; a
     site or cybercafé licence isn't the player's purchase; a family-shared copy shows another owner
     in either answer. None of these grants anything.
  2. **Guests and staff:** never grant to a guest account or a staff role (S5b's rule), whatever
     Steam says; return `:none`.
  3. Owns, no row for `source_ref`: create the `steam` row. Rescue the unique-index errors (two
     launches at once) and re-read.
  4. Owns, row exists for `user`, revoked: reopen it (`history` entry `{reopened_at, reason:
     "owned again"}`) unless it carries `metadata.admin_hold`.
  5. Owns, row exists for **another** user who no longer holds this SteamID (support unlinked it,
     which revoked the row, or the account was deleted and P11a cleared `steam_id`): `move_to!(user,
     reopen: true)`, audit entry with `from_deleted` when it applies, unless held. If that user still
     holds the SteamID (the unique `users.steam_id` index makes this unreachable), log at error and
     change nothing.
  6. Doesn't own, live row for `user`: `revoke!` with `history` `{revoked_at, reason:
     "steam_not_owned"}`. Each row is checked against the app id in its own `source_ref`.
  7. Error (`TryLater`, `AuthError`, `NotConfigured`): change nothing, log, `:unchanged`. An outage
     never revokes.
  8. Update `checked_at`, `persona`, `app_id`, `permanent`, `purchase_time`, and `family_shared`
     when seen.
  9. On a grant or reopen, sign the user up to the event (as `auto_enroll_open_subscription!`).
  Returns `:granted`, `:reopened`, `:moved`, `:revoked`, `:unchanged` or `:none`; `changed?` true
  for the first four.
- **Demo:** ownership of the demo app is never asked about and never grants anything (E9). A ticket
  from the demo app still leads to a check of the full app id.
- **Tests:** each rule; free weekend, site licence, timed trial, family-shared (by either owner field)
  grant nothing and store no lender id; guest and staff never granted; revoked row reopens; held row
  stays revoked; row on an unlinked user moves and reopens; row on a deleted user moves with
  `from_deleted`; row on a user still holding the SteamID left alone; outage changes nothing;
  concurrent grants give one row; after a grant `EventAccess#route` is `:entitlement` in a plain
  browser and with the Play marker; the claim wait is lifted; Play's `move_to!` tests unchanged and
  green; a Play row can't use the Steam path and the reverse.
- **Proof:** `bin/rails runner` against the fake: own → grant, refund → revoke, own again → reopen,
  free weekend → nothing, with the rows printed.

### S2p. Hacktivity: Steam Playtest ownership (after open question 10)

- **Build** (if the owner takes the recommendation): `events.steam_playtest_app_id` (unique where not
  null, event form). S2 checks the full app first; if not owned and the event has a Playtest id, it
  checks the Playtest app with rule 1 minus `permanent` (Playtest licences are probably not
  permanent; **verify**), keeping the family, site-licence and guest refusals. A Playtest row has
  `source_ref` `<steamid>:<playtest id>` and is rechecked against that id (rule 6). When the full app
  becomes owned, the live Playtest row is revoked first (`history` reason `replaced_by_purchase`) and
  the full row created in the same transaction, so the one-live-row index (`schema.rb:240`) never sees
  two. The `playtest` entitlement source (which shows unreleased missions) is not used.
- **Tests:** Playtest owner granted; Playtest access ends → revoked; purchase replaces it in one
  transaction; a full owner never gets a Playtest row.

### S3. Hacktivity: ticket sign-in endpoints (Opus review)

- **Before answers:** yes.
- **Repo/files:** Hacktivity `config/routes.rb`, migration `create_steam_sign_in_attempts`,
  `app/models/steam_sign_in_attempt.rb`, `app/controllers/steam_sessions_controller.rb`,
  `app/services/steam/ticket_sign_in.rb`, `concerns/app_mode.rb` (the new controllers in scope),
  `app/views/devise/sessions/new.html.erb` (the `steam=unavailable` line in app mode),
  `config/initializers/rack_attack.rb`, a daily prune in `config/resque-schedule.yml`, tests.
- **Build:**
  - `nonce`: as the contract. Records `event_id`.
  - `session`: `skip_forgery_protection` for this action only; JSON content type; nonce consumed by
    `UPDATE … SET used_at = now() WHERE nonce_sha256 = ? AND used_at IS NULL AND created_at > now() -
    2 minutes` (one row updated, or `invalid`); URL key equals UA `game=`; `app_id` one of the event's;
    ticket hash written to the attempt row (unique: a reuse is `invalid`); `authenticate_user_ticket`;
    publisher-banned → `refused`. Then `User.find_by(steam_id:)`:
    - **found and may sign in** (not deleted, confirmed, not a guest, not a staff role): run S2 with
      `check_app_ownership`, update `steam_persona_name`, issue a code (`code_sha256`, 60 s) and
      answer `signed_in` with `changed`.
    - **found, deleted, guest or staff:** `refused`. (Unconfirmed can't happen: S4 links only after a
      full sign-in, which needs a confirmed account.)
    - **not found:** issue a code and answer `link_needed`.
  - `complete`: needs the code (unused, unexpired) and `X-Steam-Nonce` equal to the nonce it was
    issued for, and the same game key. Then, in this order: sign out any signed-in user (Devise
    `sign_out`; on a shared PC this ends that user's other sessions too, through `invalidate_session!`
    and `expire_all_remember_me_on_sign_out`; accepted, written in the player guide); then either
    `sign_in(user)` with no remember-me and `session[:auth_via] = "steam_ticket"`, redirect to
    `/app/<key>`; or store `session[:steam_pending] = {steam_id, persona, app_id, at}` (60 minutes)
    and redirect to the link screen. Re-checks the user may still sign in. Any failure redirects to
    `/users/sign_in`.
  - **B5:** no Hacktivity token or authenticator code is asked for at `complete`; S14 limits what the
    marked session reaches.
  - Rate limits: `steam/ip` 10 a minute on `/app/*/steam/*`; per SteamID 20 an hour, counted in the
    attempts table (so it holds without a cache).
- **Tests (Minitest, fake client):** each answer in the contract table; no UA token → 404; key
  mismatch; wrong content type, missing, stale or reused nonce (including two concurrent uses); reused
  ticket (including concurrent); unknown `app_id`; demo app id accepted and ownership checked against
  the full id; `complete` without the header, with another nonce's header, with an expired or used
  code; `complete` signs out a different signed-in user first, and for `link_needed` leaves nobody
  signed in; the session is marked; no remember-me cookie; no token or OTP asked for; deleted, guest,
  admin, account_manager and vip linked accounts refused; `try_later` never signs in and never
  revokes; a revoked owner signs in to the demo; rate limits; the key never in logs; the shell after
  sign-in shows "Full game" for an owner.
- **Proof:** dev :3000 with the fake **and `bin/rails dev:cache` on** (for the Rack::Attack
  throttles): `curl` with the desktop UA token: nonce, session with a fake ticket for an unlinked
  SteamID (`link_needed`), `complete` with the header (link screen); link one by `bin/rails runner`,
  repeat (`signed_in`, then `complete` lands on the title screen signed in); the same ticket again
  (`invalid`); `complete` without the header (sign-in page).

### S4. Hacktivity: link screen (B2, B8, B9, B11), a day (Opus review)

- **Before answers:** yes.
- **Repo/files:** Hacktivity `app/controllers/steam_links_controller.rb`, `app/views/steam_links/`
  (game shell look, `ShellAuth`), `ApplicationController#after_sign_in_path_for` (app mode with a
  pending link goes to the confirm step), `concerns/app_mode.rb` scope,
  `app/mailers/steam_link_mailer.rb` and its view, tests.
- **Screen** (`GET /app/<key>/steam/link`, needs a fresh pending link, else back to `/app/<key>`):
  - "Link your Steam account", the persona name, and why: "Your progress, purchase and field servers
    live in a Hacktivity account."
  - **Create a free account** → the normal sign-up page (B8). **Nothing is linked at sign-up**: the
    registration hooks (`registrations_controller.rb:39-54`: Stripe subscription by checkout email,
    first org user made `account_manager`) run as they do on the website. The next page says: "Check
    your email (on any device) to confirm your account, then come back and sign in." with a Continue
    button to `/app/<key>/steam`, which runs a fresh exchange (the pending link may have expired) and
    returns to the link screen, where the player signs in.
  - **I already have a Hacktivity account** → the normal sign-in page (password plus emailed token or
    authenticator code).
  - **Confirm step**, reached from `after_sign_in_path_for` in app mode with a pending link, and only
    when the sign-in was made **after** the pending link was created (`current_sign_in_at >
    pending.at`) and the session is not a ticket session. Otherwise it signs the player out and sends
    them to sign in. Shows "Link Steam account <persona> to <handle>?", the terms line (B11; the terms
    open in the system browser) and a Link button (`POST`, CSRF token). Refused, with a plain message
    and no link, when the account: is a guest account; has a staff role, **including one given at
    sign-up** by the org hook (B10: "Staff accounts can't be linked to Steam. Use a separate player
    account."); already has a different SteamID ("This account is linked to another Steam account.
    Contact support to change it." B3); or the SteamID got linked elsewhere meanwhile (unique index).
  - **Link** sets the three columns, runs S2, clears the pending link, and sends the holder an email:
    "Steam account <persona> was linked to your Hacktivity account on <date>. If this wasn't you,
    contact support." Then the title screen.
  - **Not now** → the title screen as a guest, so the demo operations stay reachable.
- **Terms acceptance:** recorded as `steam_linked_at`. No new column.
- **Tests:** screen needs a fresh pending link; sign-up with a pending link creates an unlinked,
  unconfirmed user; **pre-registration**: sign-up with someone else's email then confirming it leaves
  the account unlinked, and the Steam player can't link it without that account's password and token;
  sign-in then confirm links and mails; a session signed in before the pending link (remember-me from
  another player) is signed out and never offered the link; ticket session refused at confirm; each
  refusal (guest, admin, account_manager, vip, `account_manager` set at sign-up, other SteamID,
  SteamID taken); a stale pending link is ignored; a crafted POST without a pending link does
  nothing; pending link cleared after use and on sign-out; website sign-up and sign-in unchanged.
- **Proof:** dev :3000, the desktop app with the fake (S9a merged; otherwise Playwright Chromium with
  the desktop UA): fresh SteamID → link screen → create account → confirm from `letter_opener` →
  Continue → sign in with the emailed token → confirm → linked, email in `letter_opener`, full game
  after `steam:fake:own`; a second SteamID → existing account → linked; an admin refused; a guest
  refused.

### S5a. Hacktivity: support tools (B3)

- **Before answers:** yes, to the recommendations in questions 7 and 8.
- **Repo/files:** Hacktivity `app/views/admin/users/` (a Steam panel beside
  `_event_entitlements.html.erb`), `app/controllers/admin/steam_links_controller.rb`, policy (admin
  only), the entitlements view and `Admin::EventEntitlementsController` (hold, release, move for
  `steam` rows), tests.
- **Build:**
  - **Steam panel:** SteamID (link to the public profile), persona, linked at. **Unlink** (admin
    only, confirm step): clears the three columns and revokes the user's live `steam` rows with
    `history` reason `unlinked` and who did it. B3: no player-facing unlink; the account page says
    "To unlink Steam, contact support."
  - **Hold:** revoking a `steam` row from the admin page sets `metadata.admin_hold` (who, when); S2
    doesn't reopen or move held rows; **Release** clears it.
  - **Move:** "Move to user" offered for `steam` rows too, through the Steam path of `move_to!` with
    `by:` the admin, refusing a target that doesn't hold the row's SteamID.
- **Tests:** unlink (admin only, audit, rows revoked, SteamID free); hold survives S2 with ownership;
  release lets S2 reopen; move refuses a target without the SteamID; P11a deletion keeps the rows and
  persona rewrite (existing tests extended).
- **Proof:** dev :3000 admin page and `bin/rails runner`: unlink a linked user and show the rows and
  columns; hold, run S2 with ownership, still revoked; release, run S2, reopened. The sign-in side of
  unlink is proven in S11.

### S5b. Hacktivity: guards (B10, guests) (Opus review)

- **Before answers:** yes, to the recommendations in questions 3 and 4.
- **Repo/files:** Hacktivity `app/models/user.rb`, tests; the package lists every path that sets a
  role and tests each.
- **Build:** a `User` validation, run only on `role_changed? || steam_id_changed?` so unrelated saves
  of a linked user can't fail: a user with a `steam_id` can't hold `admin`, `account_manager` or
  `vip` ("Unlink Steam before giving this account a staff role"), and a guest account can't have a
  `steam_id`. `User#steam_linkable?` (not guest, not staff, not deleted) for S2, S3 and S4 to share.
  Paths to cover: the admin user form, `update_user_role`, Stripe's account-manager promotion
  (`stripe_service.rb:99-102`), the sign-up org hook (`registrations_controller.rb:45-54`; no link
  exists at sign-up, so it can't clash there, and S4 refuses the link afterwards), invitations
  (`pending_invitations_controller.rb:71` sets `pro`, which is allowed).
- **Tests:** every path refused for a linked user and allowed after unlink; `pro` allowed; guest
  can't be given a SteamID; saving a linked user's name or avatar never trips the validation.
- **Proof:** dev :3000: try to make a linked user (set by `bin/rails runner`) an admin from the admin
  form and see the message.

### S6. Hacktivity: refund recheck job

Steam sends no refund notice for a base-game purchase (`ISteamMicroTxn` covers in-game purchases
only), and C4's recheck at each app sign-in never runs for a player who refunds and then plays only in
the browser.

- **Before answers:** yes.
- **Repo/files:** Hacktivity `app/jobs/steam_ownership_recheck_job.rb`, `config/resque-schedule.yml`,
  a settings key for the last run, tests.
- **Build:** daily. Rechecks every live `steam` row granted in the last 30 days (Steam's refund window
  is 14 days and under 2 hours played; chargebacks come later), and a slice of older rows so every row
  is rechecked monthly. Reads the SteamID and app id from `source_ref`, so a row on an unlinked
  account is still checked. **Skips rows on deleted accounts**: nobody can use them, and a row is
  rechecked when it moves. Calls S2. Stops the run on `AuthError` or three `TryLater`s in a row and
  alerts (the `GooglePlay::Alert` mail to server-status). Stays far inside Steam's 100,000 calls a
  day per key with a per-run cap.
- **Tests:** refunded row revoked; owned row untouched apart from `checked_at`; outage revokes
  nothing and alerts; monthly slice covers every older row; deleted accounts skipped; the cap holds.
- **Proof:** dev: grant through the fake, `steam:fake:refund`, `bin/rails runner
  'SteamOwnershipRecheckJob.perform_now'`, reload the shell: demo again. `resque-scheduler` lists it.

### S7. Hacktivity: minimum desktop build (A3)

- **Before answers:** yes.
- **Repo/files:** Hacktivity migration `events.desktop_min_version` (string, null), event form (help
  text: "Desktop app only; the Play app ignores it"), `concerns/app_mode.rb` (a before_action after
  the scope guard), `app/views/app_entry/update_app.html.erb`, `Steam::TicketSignIn`
  (`update_required`), tests.
- **Build:** in app mode, compare `AppClient#version` with the minimum using `Gem::Version`, after
  stripping build metadata from `+` on (`AppClient` allows `+` and `_`; `Gem::Version` rejects `+`).
  Below the minimum, every in-scope HTML page renders "A new version is out. Update through Steam,
  then start the game again." with status 403 (426 needs an `Upgrade` header); JSON answers
  `{status: "update_required"}`, including the Steam session POST. Engine paths aren't covered (they
  run no host filters), so a running mission isn't cut off; the next shell page is. Blank means no
  minimum. A version that still won't parse after stripping is logged and let through.
- **Tests:** below, equal, above, blank, `1.2.0+build5`, unparsable; browser requests and the Play
  app (no UA token) untouched; the session POST answers `update_required`.
- **Proof:** dev :3000, set the minimum above the desktop's `package.json` version, start the app:
  the update page.

### S8. Desktop: Steam layer and fake

- **Before answers:** yes; the demo's Steam app id stays null until question 2 is answered.
- **Repo/files:** `hacktivity-desktop/src/steam.js` (new), `src/steam-fake.js` (new), `src/app.js`
  (`initSteam` moves into `steam.js`), `src/config.js` (`steamAppId` per edition; the demo's may be
  set), `test/config.spec.js`, `test/steam.spec.js` (new), `README.md`. **Not** `scripts/build.js` or
  `scripts/smoke-packaged.js` (S10 owns both).
- **Build:**
  - `steam.js` exposes the contract interface. Real: `steamworks.init(appId)`,
    `electronEnableSteamOverlay()` (as now), `localplayer.getSteamId().steamId64.toString()`,
    `getName()`, `auth.getAuthTicketForWebApi(identity)` → `getBytes().toString('hex')`, `cancel()`
    after the server answers, `utils.isSteamRunningOnSteamDeck()` (**verify** in 0.4.0) for `onDeck`,
    `overlay.activateToStore(appId, 0)`, `overlay.activateToWebPage(url)`.
  - **Demo edition:** loads the layer only when `editions.demo.steamAppId` is set, which stays null
    until question 2 is answered. The tests that assert "demo never loads steamworks" keep passing
    while it is null and gain a case for a set id.
  - **`restartAppIfNecessary`:** packaged builds only, and only with the app id baked into
    `editions` (never one from `STEAM_APP_ID`, which the smoke test sets). When it returns true the
    app quits at once (`app.exit(0)`) before anything else runs. No `steam_appid.txt` is ever shipped
    (S10 checks the build): with one next to the exe the call always returns false.
  - **Fake** (`steam-fake.js`): only when `!app.isPackaged` and `HACKTIVITY_FAKE_STEAM` is a
    SteamID64 (`HACKTIVITY_FAKE_STEAM_PERSONA`, `HACKTIVITY_FAKE_STEAM_DECK=1` optional); `ticket()`
    returns the hex of `fake:<steamid>:<appId>:<random>`; `openStore` and `openWebPage` record the
    call (test hooks) or open the URL in the system browser. With the fake and no app id, a
    placeholder from `HACKTIVITY_FAKE_STEAM_APP_ID` (default 480) that the dev event must carry.
  - `state.steam` adds `fake`; `disabled-demo` stays for a demo with no app id.
- **Tests (Playwright Electron and node):** fake only unpackaged; packaged-like config ignores the
  variable; ticket format; SteamID is a string and `JSON.stringify` of the start result works; real
  path without Steam running stays `unavailable` and the app still loads; demo loads the layer only
  with an app id; `restartAppIfNecessary` never called unpackaged nor with an env-only id, and quits
  on true (stubbed).
- **Proof:** `HACKTIVITY_FAKE_STEAM=76561197960280001 npm run start:full` against the stub server logs
  `fake` and a ticket.

### S9a. Desktop: launch exchange and goHome()

- **Before answers:** yes.
- **Repo/files:** `hacktivity-desktop/src/steam-signin.js` (new), `src/signing-in.html` (new, local
  page), `src/app.js`, `test/stub-server.js` (the Steam routes, scripted answers, and a check of the
  `X-Steam-Nonce` header), `test/steam-signin.spec.js` (new), `README.md`.
- **First step, before building on it:** prove against Hacktivity :3000 (or, until S3 lands, the
  stub) that `session.fetch` on the game's partition sends the session's user agent with the
  `HacktivityApp` token (set by `ses.setUserAgent`, `app.js:72`); if not, set the `User-Agent` header
  on each call explicitly. No cookies are needed on these calls (the code design), so pass
  `credentials: 'omit'`.
- **Build:**
  - **`goHome()`**, the one way the app loads its start page: when the Steam layer is `running` or
    `fake` and the player hasn't signed out this run, show `signing-in.html` at once, run the exchange
    (nonce GET, session POST, then `win.loadURL(<server>/app/<key>/steam/complete?code=…,
    {extraHeaders: 'X-Steam-Nonce: …'})`), and follow the contract table. Otherwise load `startUrl`
    as now. Used for the first load, the offline page's Retry (`app.js:115` today loads `startUrl`
    directly), and every fallback.
  - Fail fast: a network error on the nonce call goes straight to the offline page; only a slow
    server waits, up to 10 s in all, after which `startUrl` loads.
  - Both calls only to `cfg.serverOrigin`; a redirect on either is a failure. The ticket stays in the
    main process and is cancelled after the POST; there is no preload, and none is added.
- **Tests (Playwright Electron against the stub):** each status leads to the right page; nonce first,
  POST is JSON with the nonce, `complete` carries the header; the signing-in page shows first; Retry
  runs the exchange; network error → offline page quickly; slow server → `startUrl` after 10 s; no
  exchange without Steam; the ticket never appears in any page request.
- **Proof:** against the stub with the fake, screenshots of each landing; **and against Rails :3000
  once S3 is merged** (a fresh SteamID reaching the link screen, a linked one reaching the title
  screen signed in), before S11, since this is the piece most likely to pass on a stub and fail for
  real.

### S9b. Desktop: re-auth, sign-out and outside links

- **Before answers:** yes.
- **Repo/files:** `hacktivity-desktop/src/steam-signin.js`, `src/app.js`, tests.
- **Build:**
  - **Expiry:** ticket sessions have no remember-me (question 16) and time out after 2 hours idle
    (`devise.rb:227`); a player coming back usually triggers a `fetch` inside the page, which fails
    with no navigation. So run the exchange on window focus and on system resume when the last one is
    over 90 minutes old, and on a 100-minute timer while the app runs. Also on a main-frame
    navigation **or redirect** to `/users/sign_in` (both `will-frame-navigate` and `will-redirect`)
    that no sign-out preceded, at most once a minute, then return to the page the player was on if it
    is in scope, else `goHome()`.
  - **Sign-out:** a navigation to `/users/sign_out` sets "signed out by the player"; no automatic
    exchange until the next launch or the "Continue with Steam" button.
  - **"Continue with Steam":** a **main-frame** navigation to `/app/<key>/steam` on the server origin
    is cancelled and runs `goHome()`. Frames (lab sheets, YouTube) never start an exchange.
  - **After buying:** on focus after a store page was opened, if the last exchange is over a minute
    old, run the exchange; load `complete` only if `changed`.
  - **Outside links on the Deck:** in Game Mode `shell.openExternal` may open nothing, so when
    `onDeck`, outside links go to `overlay.activateToWebPage(url)` and store links to
    `activateToStore`. Elsewhere both go to the system browser: steamworks.js 0.4.0 can't report
    whether the overlay drew (no `isOverlayEnabled`, no `GameOverlayActivated` callback), so the
    overlay is used only where it is known to draw. Windows joins once S0 or S13 confirms it.
- **Tests:** focus and resume triggers with the 90-minute rule; the timer; redirect and navigation to
  sign-in both re-auth, once a minute at most; no exchange after sign-out; the button from the main
  frame runs it and from a frame doesn't; purchase recheck reloads only on `changed`; with
  `HACKTIVITY_FAKE_STEAM_DECK=1` outside and store links go to the overlay hooks, without it to the
  system browser.
- **Proof:** against Rails :3000 with the fake and a scratch short `timeout_in` (uncommitted): idle,
  focus, still signed in; sign out, no automatic sign-in; the button signs in.

### S10. Desktop: Steam builds and SteamPipe scripts

- **Before answers:** yes.
- **Repo/files:** `hacktivity-desktop/scripts/build.js` (`--steam` builds an unpacked `dir` target
  per OS; the demo keeps steamworks.js when `editions.demo.steamAppId` is set, today excluded at
  `build.js:353-354, 363`), `steam/app_build.vdf.template`, `steam/depot_build_linux.vdf.template`,
  `steam/depot_build_windows.vdf.template` (and the demo's), `scripts/steam-upload.js`,
  `scripts/smoke-packaged.js` (runs dir builds as well as AppImages), `README.md` ("Steam builds"),
  `.gitignore`.
- **Build:**
  - **Depot content is the unpacked app**, not the AppImage (FUSE inside Steam's runtime container) or
    the NSIS installer. `electron-builder --linux dir` and `--win dir` give `linux-unpacked/` and
    `win-unpacked/`. The build fails if a `steam_appid.txt` is in the output.
  - **steamworks.js native parts:** `dist/linux64` (`libsteam_api.so`) and `dist/win64`
    (`steam_api64.dll`) end up unpacked from the asar in both dir builds.
  - **Chromium sandbox on Linux:** Steam doesn't keep setuid, so `chrome-sandbox` can't be setuid;
    the namespace sandbox then has to work (S0 and S13 test it; open question 12 decides what ships if
    it doesn't). The launch option doesn't add `--no-sandbox`.
  - **Windows here:** no wine on this machine. `--win dir` with `signAndEditExecutable: false` may
    build without wine, but then nothing embeds the asar integrity resource in the exe while the
    `enableEmbeddedAsarIntegrityValidation` fuse is on (`build.js:365-372`), which can stop the exe
    starting. The package reports whether the resource is present. Treat Windows as needing a Windows
    runner or wine (O5, O11), not just as missing an icon. Nothing built for Windows can be run here.
  - **SteamPipe templates:** `AppID`, `Desc`, `SetLive ""` (never set live from a script),
    `ContentRoot`, `BuildOutput`, `Preview`; per OS depot with `FileMapping` (`"recursive" "1"`) from
    the dir output and `FileExclusion` `*.pdb`. Placeholder ids `0`; `steam-upload.js` refuses to
    upload with a placeholder and prints what it would upload. Uploads from Linux keep the exec bit.
  - **Launch names:** from `build.js` (`licence-to-hack-full.exe`, `licence-to-hack-full`, the demo's).
- **Tests:** the template filler (node test): ids, paths, recursive mapping, no `SetLive`, refuses
  placeholders; `smoke-packaged.js` on the Linux dir builds (UA token, steamworks loads, refused
  switches, no `steam_appid.txt`, `HACKTIVITY_FAKE_STEAM` has no effect).
- **Proof:** `npm run build:full:linux -- --steam` and the demo; smoke script on both;
  `steam-upload.js --dry-run` prints the filled vdf files. Windows: whether `--win dir` built without
  wine, the icon state and the asar integrity resource.

### S11. Local end to end

- **Repo/files:** none planned; fixes go to the package that owns the code.
- **Setup:** Hacktivity dev :3000 with the fake Steam client and `bin/rails dev:cache` on; the
  Licence to Hack dev event with `steam_app_id` 480, `steam_demo_app_id` 481 (placeholders) and
  `store_url` `https://store.steampowered.com/app/480/`; desktop full and demo with
  `HACKTIVITY_FAKE_STEAM` and `HACKTIVITY_FAKE_STEAM_APP_ID` set to match.
- **Run, with screenshots:**
  1. New SteamID, full edition: link screen → create account → confirm (letter_opener) → Continue →
     sign in with the emailed token → confirm → title; link email received. Not owned: demo
     operations, buy prompt is the store page.
  2. `steam:fake:own`, focus the window: full game. Start a browser-only mission, leave, debrief.
  3. The same account in a plain browser (password and token): full game (account-wide).
  4. **Ticket cookie in a plain browser:** copy the app's session cookie into a browser without the UA
     token: signed out at the first page (S14).
  5. `steam:fake:refund`, recheck job: demo in the browser; relaunch the app: demo.
  6. `steam:fake:own` again, relaunch: row reopened, history shows both.
  7. Website account with a Games subscription, new SteamID, demo edition (with a scratch demo app id
     set locally): link by signing in → full game in the demo app. Same with a Play `fake-ok-` grant.
  8. Family-shared, free-weekend and site-licence copies: no entitlement.
  9. Admin account and `guest1`: link refused; a linked user's role change refused.
  10. **Pre-registration:** SteamID X creates an account with another tester's email; that tester
      confirms it; X relaunches: still the link screen, and can't link without the password and
      token.
  11. **Two Steam accounts, one profile:** A signs in with a password (remember-me), quit; launch
      as SteamID B: A is signed out, B gets the link screen, and B can't link to A.
  12. Sign out in the app: no automatic Steam sign-in; "Continue with Steam" signs in.
  13. Session timeout (scratch short `timeout_in`): silent re-auth on focus.
  14. Support unlink, then the SteamID links a second account: row moves and reopens. Delete the
      second account (password asked, S14), link a third: row moves with `from_deleted`.
  15. Minimum build above the app's version: update page.
  16. Steam API down (fake app id `999`): sign-in page with the unavailable line.
  17. Ticket replay: the same ticket posted twice (`curl`): `invalid`.
  18. Desktop app without Steam: unchanged (password sign-in in the window).
  19. Offline at launch, then Retry: the exchange runs, not the password page.
- **Not covered here:** real tickets and ownership (S13), the overlay over the window (S0, S13),
  Windows, the Deck, VM missions (no cluster here).

### S12a. Valve policy check (owner with an agent, wave 1)

Before the demo app gets Steam sign-in: record what Valve's current rules say about a Steam app, and
a free demo especially, opening content bought outside Steam (subscriptions, Play purchases), about
in-game links that leave the app (the shell opens outside links in the browser; buy prompts go only
to the Steam store page), the third-party account requirement, and account deletion in the browser.
The result answers question 2.

### S12. Steamworks setup and store (owner with an agent)

The agent prepares a checklist and the text; the owner enters it in Steamworks.

- **Partner settings** (names as Steamworks uses them; **verify** each):
  - App and demo created; demo attached to the full app. Playtest app if question 10 says so.
  - **Web API key:** Users & Permissions → Manage Groups → the publisher group → Create WebAPI Key.
    Into Hacktivity credentials for production only. Never into the desktop app. How to rotate it.
  - **Installation → General:** launch options per OS: Windows `licence-to-hack-full.exe`, Linux
    `licence-to-hack-full` (the demo's names for the demo). No arguments.
  - **Linux runtime** setting per question 12.
  - **Depots:** one Windows and one Linux depot per app, in the app's packages.
  - **DRM:** no SteamStub wrapper (it rewrites the exe, which asar integrity and signing don't allow).
  - **Steam Cloud:** off.
  - **Steam Input:** a default configuration with the trackpad as mouse and the triggers as clicks
    (A5 needs one for "Playable"); test it in S13.
  - **Branches:** a password-protected `internal` beta branch.
  - **Builders:** a Steam account with SteamPipe upload rights and Steam Guard (O6).
  - **Store page:** "Requires a 3rd-party account: Hacktivity", "Requires internet connection", the
    EULA (B11: the full terms), single-player, Windows and SteamOS/Linux, price £14.99 (R1), art
    (`hacktivity-desktop/steam/`), screenshots (to capture), content survey and IARC. A Deck note:
    "Press STEAM+X for the on-screen keyboard."
  - **Steam Deck compatibility review** submission, aiming for "Playable" (A5).
  - Achievements: later.
- **Player guide lines:** the Steam overlay's Shift+Tab clashes with reverse-Tab in the VM console
  (the shortcut can be changed in Steam); Deck players confirm their email on another device; signing
  in with Steam on a shared PC signs the previous player out everywhere.
- Terms-change checklist gains "update the Steam EULA in Steamworks" (B11).

### S13. Live check on a Steam beta branch (owner-gated)

Needs S11, S12 and O1–O6. Set `events.steam_app_id`, `steam_demo_app_id`, `store_url` in
production (or staging); credentials; deploy. Desktop: real app ids in `src/config.js`, bump
`package.json` version, build both dirs, upload to `internal`, opt in from the owner's Steam account.
Matrix: Ubuntu 24.04 desktop launched from Steam with each Linux runtime option, a Steam Deck in Game
Mode and Desktop Mode, Windows (owner's machine or a runner). Check: launches through Steam; silent
sign-in; link a fresh account; real ownership from a key on a test account; a refund of a test
purchase (or a key revocation) and the recheck job revoking it; family-shared copy gets nothing; the
overlay draws over the window (to switch Windows and Linux desktop to overlay links if it does);
store and outside links on the Deck via the overlay; the Chromium sandbox starts without
`--no-sandbox` in each cell, or question 12's decision applies; cookies persist (the Deck's keyring);
the Steam Input default and STEAM+X keyboard on a VM mission (A5); the minimum-build page. Then the
owner sets the build live on the default branch at release.

### S14. Hacktivity: account hardening for ticket sessions (Opus review)

- **Before answers:** yes (owner approved with this plan; it changes the website for everyone: the
  password is asked for before deletion and before turning MFA off).
- **Repo/files:** Hacktivity `app/controllers/application_controller.rb` (a before_action),
  `users/sessions_controller.rb` (`continue_sign_in` clears the marker),
  `registrations_controller.rb#destroy`, `users/multi_factor_authentication_controller.rb`
  (turning MFA off), their views, tests.
- **Build:**
  - A session with `session[:auth_via] == "steam_ticket"` outside app mode is signed out and sent to
    the normal sign-in, on every host controller. In app mode the existing scope guard already shows
    "Open in your browser" for other pages, and the browser has no session. Engine paths
    (`/break_escape`) run no host filters, so a copied cookie still plays missions through the engine
    API; that is what a ticket allows anyway, and is written down here as a known limit.
  - A password sign-in (with token) clears the marker.
  - Account deletion and turning MFA off need the current password (Devise's `valid_password?`); a
    wrong one changes nothing and says so.
- **Tests:** marked session with no UA token → signed out on a website page; marked session in app
  mode works in scope; unmarked sessions unchanged; deletion without, with a wrong and with the right
  password; MFA off likewise; a password sign-in after a ticket session clears the marker.
- **Proof:** dev :3000: delete a throwaway account with and without the password; S11 step 4 proves
  the marker once S3 exists.

## 3. Testing without a Steam app id or key

| Layer | Fake | Where | What it proves |
|---|---|---|---|
| Desktop Steam layer | `steam-fake.js` (`HACKTIVITY_FAKE_STEAM`, optional Deck flag), unpackaged only | S8, S9a, S9b, S11 | Exchange, every landing, re-auth, sign-out, focus recheck, overlay routing on a pretend Deck |
| Desktop against a stub | `test/stub-server.js` with scripted Steam answers | S9a, S9b | The main-process flow before S3 exists |
| Server | `SteamWebApi::FakeClient`: fake tickets by hex, ownership from `tmp/fake_steam_ownership.json`, rake tasks for own, refund, family, free weekend, site licence; refused in production | S1–S6, S11 | Sign-in rules, linking, grant, reopen, revoke, move, recheck, B5, B10, guests |
| HTTP | webmock stubs of Steam's three endpoints | S1 tests | The real client's requests, errors, no key in logs, `fake:` tickets never decoded |
| Steam client | App 480 (Spacewar) | S0, owner's machine with Steam signed in | steamworks.js init, real ticket bytes, the overlay over Electron, the sandbox under Steam. Not ownership |

**Which works without the owner's app id:** everything in S1–S11 and S14 runs on the fakes. App 480
helps only on the client side (S0), and only where a person has signed in to the Steam client;
`CheckAppOwnership` needs our publisher key for our own app, so 480 never tests ownership. Only the
real app on a beta branch (S13) tests real tickets and ownership, refunds, depots and launch options,
the Linux runtime and sandbox, the Deck and Windows.

## 4. Security and abuse

- **The ticket is the only credential.** The SteamID comes from Steam's answer, ownership from
  `CheckAppOwnership` on the server, the pending link from the signed and encrypted session. The
  client's persona name (question 11's fallback) is display text; `apps.isSubscribedApp` and
  `apps.appOwner` are never used for access.
- **Linking needs a fresh full sign-in** (rules 1 and 2 in section 1). This stops pre-registration
  (an attacker signing up with a victim's email, which the victim then confirms) and the shared-PC
  case (B linking to A's remembered session). An unconfirmed account is never linked.
- **Login CSRF.** The routes 404 without the UA token; the POST needs JSON (no simple cross-site
  post) and a server-stored nonce a page can't read; `complete` needs a code that only the POST
  returns and a header a link can't set; session cookies are SameSite=Lax.
- **Replay.** Nonce, ticket hash and code are each single use through unique indexes and conditional
  updates in `steam_sign_in_attempts`, which hold under concurrency and without a cache. The fixed
  identity means a ticket made for another site is refused by Steam.
- **No Hacktivity MFA on ticket sign-in (B5)**, so a ticket session is limited: marked on the server
  and signed out outside app mode, deletion and MFA-off need the password, the holder is emailed on
  every link, and staff and guest accounts are never linked (B10 three times: link, ticket sign-in,
  role change). A Steam account takeover still reaches the linked player account inside the app;
  that is B5's accepted cost.
- **Family sharing, free weekends, site licences** grant nothing (S2 rule 1); the lender's SteamID is
  never stored.
- **Outages never revoke.** Steam errors leave rows as they were; the player gets the normal sign-in.
- **Refunds and revoked keys** are found at each app sign-in and by the daily recheck (S6). Progress
  and results stay; missions lock again.
- **Sessions.** Id renewed at sign-in; any signed-in user is signed out before a ticket sign-in or a
  pending link (which ends their other sessions too, accepted); no remember-me from a ticket; the
  player's own sign-out stops automatic sign-in for that run.
- **Deleted accounts.** P11a clears the SteamID, so a ticket finds nobody and the player gets the link
  screen. The `steam` row stays and moves, audited, to the next account the SteamID links.
- **The publisher key** acts on every app in the publisher group, so it lives in production
  credentials only, goes through the outbound proxy, never appears in a log or exception, and never
  ships in the desktop app.
- **The ticket in the desktop app** stays in the main process, goes only to the configured origin
  over https (localhost excepted), and is cancelled after use. Only a main-frame navigation can start
  an exchange.
- **Fakes.** The server fake raises at production boot; the desktop fake is ignored in packaged
  builds (smoke-tested); the real client never decodes `fake:` tickets; 480/481 never go on a
  production event.
- **Rate limits** per IP (Rack::Attack, which needs a cache: proofs turn on `dev:cache`) and per
  SteamID (counted in the attempts table).
- **Personal data (B6).** Stored: SteamID, persona name, link time, and per row the ownership fields
  in the contract. Not stored: avatar, profile URL, country, ban flags, the ticket, a lender's SteamID.
  The attempts table holds SteamIDs for at most a day. Persona name is escaped wherever it shows.

## 5. What blocks on the owner

| Item | Needed for | Can be done before it |
|---|---|---|
| O1. Steamworks partner account, the Steam Direct fee (US$100 per app, recouped after US$1,000 gross), tax and bank forms | S12, S13 | S0–S11, S14 |
| O2. App ids: full, demo, and Playtest if used | Event columns, desktop config, depots, launch options | Placeholders 480/481 with the fakes |
| O3. Publisher Web API key in production credentials; the outbound proxy allows `partner.steam-api.com` | Real client (S13) | Fake client, webmock tests |
| O4. Steamworks settings in S12 | S13 | S12's checklist written ahead |
| O5. Windows: a Windows machine or CI runner, and the code-signing choice (question 13) | Windows depot | Linux builds; S10's report on the wine-free dir build |
| O6. A Steam builder account with Steam Guard | S13 uploads | `steam-upload.js --dry-run` |
| O7. Go-ahead for each Hacktivity package (given for this plan; still say before each starts) | S1–S7, S14 | S0, S8–S10 |
| O8. Store page content, EULA text (B11), price, screenshots, content survey | Coming Soon page, at least two weeks before release | Art in `hacktivity-desktop/steam/` |
| O9. A Steam Deck | S13 | Linux desktop, the fake's Deck flag |
| O10. Deploy Hacktivity with S1–S7 and S14 and the credentials | S13 | Local dev |
| O11. Installing wine on the build machine, if wanted (a system change) | Windows exe resources built on Linux | A Windows runner |
| O12. Valve's answer on the demo (S12a) | Setting the demo's app id in the desktop config | Everything else |
| O13. The Linux sandbox decision (question 12) | S13 sign-off on Linux and the Deck | S0's early result |

Everything up to S11 can be finished, merged and deployed before O1. Deploying S1–S7 changes nothing a
website or Play player sees (app-mode routes only; no `steam` rows; the guards apply to linked
accounts). **S14 does change the website**: deletion and MFA-off ask for the password. S8–S10 change
desktop builds nobody outside development has.

## 6. Release steps

1. **Hacktivity:** production credentials `steam: { publisher_key:, ticket_identity: }`; deploy
   S1–S7 and S14 (migrations: S3's table, S7's column, S2p's if built); check the proxy reaches Steam
   (`bin/rails runner` with a known SteamID's persona call); set the Licence to Hack event's real
   `steam_app_id`, `steam_demo_app_id`, `store_url` (`https://store.steampowered.com/app/<id>/`),
   `desktop_min_version` blank. Never 480 or 481 in production.
2. **BreakEscape:** if engine JS changed since the last deploy (the platform script and exits from the
   Android work have), bump `BreakEscape::VERSION` with the bump-version skill, which moves
   `ASSETS_VERSION` and the `?v=` on engine scripts. Check production doesn't pin
   `BREAK_ESCAPE_ASSETS_VERSION`.
3. **Desktop:** real app ids in `src/config.js` (the demo's only after O12); bump `package.json`
   version; build Linux and Windows dirs for both editions (`--steam`); smoke script on Linux; sign the
   Windows exe if question 13 says so; upload to `internal`; S13; the owner sets the build live.
4. **Steamworks:** EULA matches the current terms; Deck review submitted; store page through review;
   Coming Soon live at least two weeks ahead; Playtest first if E6's plan holds.
5. **Later releases:** raise `desktop_min_version` only when a server change needs a newer app (A3);
   bump the engine version for engine JS changes; the terms checklist covers the EULA.

## 7. Open questions

1. **Steam sign-in in the demo app.** Recommendation: yes, once question 2 is answered, by setting the
   demo's app id; the code is built either way (S8, S10) and stays off while the id is null.
2. **Account-wide access in the free demo app.** A subscriber or Play buyer gets the whole game in
   the Steam demo. Recommendation: keep it if S12a finds Valve's rules allow it; if not, the demo app is
   the one place where the platform would limit access (free window only), which needs the owner's
   decision.
3. **"Org owner" in B10.** Hacktivity has no owner role; org managers are `vip` or `account_manager`.
   Recommendation: refuse `admin`, `account_manager` and `vip`, and guest accounts as well.
4. **A linked account given a staff role later**, including the account-manager promotion at sign-up
   and by Stripe. Recommendation: refuse the role change until support unlinks Steam; at sign-up the
   link is refused instead (no link exists yet).
5. **Family-shared copies, free weekends, site licences.** Recommendation: no entitlement; the player
   can still sign in and link, and plays the demo operations. Store `family_shared: true`, never the
   lender's SteamID.
6. **Buying again after a refund.** Recommendation: reopen the same row with the history in
   `metadata.history` (`source_ref` stays `<steamid>:<appid>`).
7. **Admin revoke of a Steam row.** Recommendation: a hold that sign-in and the recheck respect, with a
   Release button.
8. **What support unlink does.** Recommendation: revoke that account's live `steam` rows (reason
   `unlinked`); the row moves and reopens when the SteamID next signs in on another account.
9. **One emailed token for every new Steam player.** Linking only after a full sign-in (section 1)
   means a new player signs up, confirms, then signs in once with an emailed token. Recommendation:
   accept; it is what stops pre-registration takeover. (Replaces the earlier question on cleaning up
   unconfirmed Steam-created accounts, which no longer exist.)
10. **Steam Playtest (E6).** A Playtest is its own app id, probably not a permanent licence.
    Recommendation: S2p as written (own column, own rule without `permanent`, replaced in one
    transaction on purchase), built only if the Playtest goes ahead.
11. **Persona name source.** Recommendation: Steam's Web API on the server; if the publisher key can't
    call `GetPlayerSummaries`, the client's name as display text only.
12. **What ships if the Chromium sandbox fails under Steam on Linux** (no setuid `chrome-sandbox`;
    Ubuntu 24.04's AppArmor user-namespace rule; pressure-vessel may block namespaces). The window shows
    remote content, so the sandbox matters. Options: (a) pick the Linux runtime setting where it works
    (S0, S13); (b) detect the failure and relaunch with `--no-sandbox`, keeping the navigation and
    frame guards and the strict permission handler, logged; (c) hold the Linux depot (Deck included)
    until it works. Recommendation: (a) first; if no setting works on a target, the owner chooses
    between (b) and (c) before S13 signs off, knowing (b) leaves a renderer exploit unconfined.
13. **Windows code signing.** Steam doesn't require it. Recommendation: launch unsigned unless
    anti-virus flags appear in S13; if wanted, a cloud signing service that `jsign` can use from Linux.
    Owner decision on cost and identity checks.
14. **`restartAppIfNecessary`.** Recommendation: yes, packaged builds with the baked app id only, quit
    on true, no `steam_appid.txt` shipped.
15. **Steam sign-in on the website (OpenID).** Recommendation: not now.
16. **Remember-me after a ticket sign-in.** Recommendation: none. On a shared PC a remembered session
    would outlive the Steam account that made it; each launch signs in by ticket, and S9b re-signs in
    on focus, resume and a timer.
17. **Steam's Web API down at launch.** Recommendation: the sign-in page with the unavailable line;
    nothing revoked.
18. **Buy prompts and outside links while Steam runs.** Recommendation: the overlay (`activateToStore`,
    `activateToWebPage`) only where it is known to draw, the Deck at first; the system browser
    elsewhere until S0 or S13 confirms the overlay on Windows or Linux desktop.
19. **On-screen keyboard on the Deck.** HTML text fields don't raise it. Recommendation: STEAM+X with a
    store note and a tip for launch ("Playable" allows it); later, a narrow preload that calls
    `utils.showFloatingGamepadTextInput` on focus, which means deciding to add a preload.
20. **Achievements.** Out of this plan; a later plan maps objectives to Steam achievements through the
    main process.
