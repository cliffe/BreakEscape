# Entitlements, Steam keys and the subscription model

Status: draft plan, 2026-10-22; updated 2026-10-24 with the pick-form answers (`OPEN_QUESTIONS.md`).
Companion to `README.md`.

Decided 2026-10-24 (E3, E4): **Steam only.** We don't sell Steam keys on our own site. Hacktivity
subscriptions unlock every game in the browser, and the desktop app is for Steam buyers.

## Today

- **Individual subscriptions** (Stripe) unlock everything. The check is
  `ApplicationPolicy#has_active_subscription?` (Hacktivity `app/policies/application_policy.rb:25`),
  which is `user.subscriptions.active.exists?` and ignores the plan. The plan only changes VM quota
  (`User#has_premium_quota?`).
- **Organisation subscriptions** buy seats, not games. "This org gets the incident response
  simulations" is done by creating an org event (`open_to: :org_members`) containing those game
  slots. Access to a game is "member of the event + seat/subscription" (`GameSlotPolicy#start?`).
- There is **no product, licence, key or entitlement table**. The only catalogue record is
  `BreakEscape::Mission`, which is grouped by `collection: "season_1"`. No metadata says which
  game a mission belongs to.
- Gap: the engine's own `games#create` lets any signed-in user play any published mission outside a
  slot (engine `mission_policy.rb:16`). That's harmless today, but has to be closed before game
  access is sold separately.

## Target model: products and entitlements

Add a small layer that every access path asks: "does this user hold product X?"

```
Product          id, key ("licence_to_hack", "eldritch_hacker", "ir_simulations"), name,
                 steam_app_id (nullable), steam_demo_app_id (nullable)
ProductMission   product_id, break_escape_mission_id        (or a `product` field in mission.json)
Entitlement      user_id, product_id, source, source_ref, starts_at, ends_at (nullable), revoked_at
                 source ∈ steam | google_play (later) | subscription | org | key | grant
```

- Missions get a `product` (or `game`) field in mission.json beside `collection`, so the catalogue
  comes from the scenario folder like everything else.
- `has_product?(user, product)` replaces the bare `has_active_subscription?` in the game paths. It
  is true if any of these hold:
  - an active **subscription** whose plan includes the product (`PlanProduct` join table). Today
    every plan includes every product, so nothing changes for existing subscribers;
  - **org** access: the user holds a seat in an org with an `OrgProduct` row for it. This makes the
    existing "org pays for specific games" arrangement explicit, instead of depending only on which
    events an admin created;
  - an unrevoked **Entitlement** row (Steam, later Google Play, key, manual grant).
- Steam players start games from a **library event** per product (C1): an event that represents
  the game, holding its game slots, so `GameSlotPolicy` is reused unchanged apart from the
  entitlement condition. Steam play stays out of other events' scoreboards (C5).
- Events and game slots stay as they are for scheduling, scoring and cohorts. The entitlement check
  is an extra condition in `GameSlotPolicy#start?` and the engine's `create_game?` hook, not a
  replacement for events.
- Subscriptions and org access are computed live. Steam, Play and key access are stored rows.
  Don't write rows for subscribers, or cancellations get messy.

## How Steam ownership reaches Hacktivity

1. The desktop app gets a Steam Web API auth ticket and sends it to a new Hacktivity endpoint.
2. Hacktivity validates it (`ISteamUserAuth/AuthenticateUserTicket`, publisher Web API key) and
   gets the SteamID, then checks ownership with `ISteamUser/CheckAppOwnership` for the app (and
   any DLC).
3. If the SteamID is linked to a user, that user's `Entitlement(source: steam)` is created or
   refreshed. If not, the app shows a link screen: create a free Hacktivity account or sign in to
   an existing one. Either way the player accepts the standard terms (decided 2026-10-24).
   Steam ticket sign-in is used from then on.
4. Ownership is rechecked at each sign-in, so refunds and revoked keys drop off: set `revoked_at`
   when `CheckAppOwnership` says no.
5. A Steam-linked account can also sign in through Steam OpenID on the website. That's optional,
   and lets a Steam buyer play in the browser too if we want that (see the questions).

Storage: `users.steam_id` (unique), plus a `SteamLink` audit table if we want link and unlink
history.

## Sign-in details (B2, B5, B7)

**Email (B2, needs further discussion).** Steam never gives us the player's email address. The
Web API returns the SteamID64, persona name, avatar, profile URL and (if the profile is public)
country. So the "create a free account" path on the link screen has to ask for an email and a
password, as the website sign-up does, and verify the email. Points to settle:

- Ask for a password at all? Without one, the account can only be reached through the Steam app
  until the player sets one with a reset email. Asking for email only and sending a "set your
  password" link keeps the first launch short.
- Whether to let the player start m01 before the email is verified, and lock progress after a
  grace period.
- Existing accounts: "sign in to an existing account" uses the normal email, password and (if set)
  MFA, once, to link.

**MFA (B5).** How it works:

1. Hacktivity trusts a valid Steam auth ticket as proof of identity. The ticket can only be made by
   a Steam client signed in to that Steam account, and Steam Guard (Steam's own two-factor) protects
   that sign-in.
2. Ticket sign-in in the desktop app therefore never asks for Hacktivity MFA.
3. Linking an existing account that has MFA turned on asks for the password and MFA code once, at
   link time, so someone with only a Steam account can't take over a Hacktivity account.
4. Website sign-in is unchanged: email, password, and MFA if the user turned it on. Steam-created
   accounts can turn MFA on for the website like anyone else.
5. Suggested guard: accounts with staff or org-manager roles (admin, account_manager, org owners)
   can't be linked to Steam, or still need Hacktivity MFA on ticket sign-in. A stolen Steam account
   then can't reach anything privileged.

**Terms (B7).** Steamworks lets an app show a custom EULA that the player accepts before first
launch (verify the current setting). Options, which can be combined:

- set the Hacktivity terms (or a short EULA that points to them) as the Steam EULA;
- show and require acceptance of the terms on the link screen when the account is created or linked
  (needed anyway, since Hacktivity records acceptance on its own account);
- on a terms change, email notice only, and continued use counts as acceptance (the B7 pick).

## Recording ownership (C2, C3: needs further discussion)

Two ways to record "this user owns Licence to Hack" and "this org pays for the incident response
simulations":

**Option 1: new Product and Entitlement tables** (as above). Subscriptions and orgs map to products
through `PlanProduct` and `OrgProduct`. Steam (and later Play) ownership is an Entitlement row.

- For: one-off ownership and subscriptions are different things and stay separate. No Stripe fields
  to fake.
- Against: new tables and a new check beside the existing subscription check.

**Option 2: reuse Plan and Subscription.** Add a Plan per product ("Licence to Hack (Steam)") and
give Steam buyers a Subscription row on it.

- For: `has_active_subscription?` and the admin screens already understand subscriptions, and
  `plans.user_role` already sets the quota tier, which would also answer D1.
- Against: `Subscription` is built around Stripe. It requires a unique `stripe_id`, `end_date`,
  `currency`, `interval` and `seats`, and has Stripe calls such as `vat_applicable?`. A Steam
  licence would need placeholder values (for example `stripe_id: "steam:<steamid>:<appid>"` and a
  far-future end date), and every Stripe job would need to skip those rows. The check also still
  ignores the plan today, so a Steam "subscription" would unlock every game unless
  `has_active_subscription?` learns which products a plan covers. That is the same change as
  `PlanProduct` in option 1.

**C3 (org deals).** Today orgs get specific games through which events an admin creates. Options:
keep that and treat event membership as the access record (no change, but the access rule lives in
admin habit), or add `OrgProduct` so the org's subscription states the products it pays for, with
events still used for scheduling.

Leaning: option 1 for C2, with `plans.user_role` reused for the Steam quota tier, and `OrgProduct`
for C3. The deciding question is whether the user wants Steam licences to appear in the existing
subscription admin screens.

## Steam keys

Steam keys are generated free in Steamworks and redeemed on Steam. They grant ownership on Steam,
and Hacktivity then sees that ownership through step 2 above. We never have to track key-to-user
ourselves except for keys we hand out.

Uses:

| Use | How |
|---|---|
| Press, streamers, testers | Keys from Steamworks or Valve's curator connect, no Hacktivity changes needed |
| Bundles / education resellers | Keys, subject to Valve's approval of the request |

Valve's rules to plan around (verify against current Steamworks documentation before committing):

- **Price parity:** keys sold elsewhere should not give a better deal than Steam's own price at the
  time. So the Stripe one-off price for "Licence to Hack" should match the Steam price.
- **Valve can refuse key requests**, particularly large requests out of proportion to Steam sales.
  Handing every subscriber a Steam key could hit this.
- **In-game purchases inside a Steam app go through Steam** (microtransactions). The Steam build
  must not sell Hacktivity subscriptions or link to the Stripe checkout in the game.
- A Steam game may require a third-party account. The store page has to say so.

## ~~Selling on our own site (Stripe → entitlement + Steam key)~~ (not planned: E3, Steam only)

Kept as a record of the option, in case it comes back. The Hacktivity pricing page links to the
Steam store pages instead (a link from our website to Steam is fine; the rule against outside
purchase links applies inside the Steam app).

Flow (2026-10-24 sketch; the Valve-side details are marked "verify"):

1. **Key stock.** Request a batch of keys for the game's package in Steamworks (manual, reviewed by
   Valve; verify current limits). Import the file into a `SteamKey` table: key encrypted at rest,
   product, batch, status (`available`, `assigned`, `revoked`), assigned_to, assigned_at. Alert
   admins when stock falls below a threshold.
2. **Checkout.** Signed-in Hacktivity user (the same account the Steam app links to) clicks Buy on
   the game's page → Stripe Checkout in `mode: payment` with the product's one-off Price (GBP and
   USD, like the subscription plans). Stripe Tax handles VAT/sales tax: on our own site Hacktivity
   is the seller, whereas Steam handles tax for Steam sales.
3. **Fulfilment** in the existing Stripe webhook (`checkout.session.completed`), in one
   transaction:
   - create `Entitlement(source: stripe_purchase, source_ref: <session id>)`, so the game is
     playable in the browser at once;
   - do **not** assign a key yet. The account page shows "Claim your Steam key". Claiming takes
     one `available` key with `SELECT … FOR UPDATE SKIP LOCKED`, marks it assigned, and shows it
     with a Steam redeem link (`store.steampowered.com/account/registerkey?key=…`).
   Claim-on-demand means browser-only buyers use no keys, which keeps our key requests in line
   with Steam sales (Valve can refuse requests that look out of proportion).
4. **After redeeming**, the player owns the game on Steam. When the Steam app links to the same
   Hacktivity account, `Entitlement(source: steam)` is added beside the Stripe one. Access is
   the union of sources, so nothing is duplicated or lost.
5. **Refunds and chargebacks** (`charge.refunded`, `charge.dispute.created`): revoke the Stripe
   entitlement. If a key was claimed, mark it `revoked` and report it to Valve to revoke
   (verify the current Steamworks process). Once Steam removes the licence, the ownership recheck
   at sign-in drops the steam entitlement too. To limit key resale with stolen cards, the claim
   button can wait until Radar clears the payment, or for a short hold (for example 48 hours).

Price parity: Valve's rule (verify the wording) is that keys sold elsewhere should not get a better
deal than Steam customers get at the time. So the Stripe price matches the Steam base price in that
currency, and Steam sales are matched rather than beaten. Steam's lower regional prices don't need
matching in GBP/USD. We'd only need region-locked keys if grey-market resale shows up.

Revenue: Valve takes no cut on keys sold off Steam, so a Stripe sale keeps the price minus Stripe
fees and tax. It also brings Hacktivity a direct customer under its own terms (already true for
every Steam player under the account-link decision).

Org bulk purchases (a class set) can use the same table: N entitlements granted to the org's
members, and keys only if they ask for the Steam build.

## Subscriptions and Steam together

Recommended rules:

1. **Steam buyers own the game on Steam, and in Hacktivity once they link.** Buying on Steam grants
   `Entitlement(source: steam)` for that product only, not a subscription. A Steam buyer who links
   can play that game in the browser on Hacktivity too (same account and saves for Mode A). Their
   VM allowance is the Steam allowance (`README.md`), not the subscription quota.
2. **Subscribers keep "everything" on Hacktivity, in the browser** (E4, decided 2026-10-24). The
   Steam app is for Steam buyers. A subscriber who wants the Steam version buys it on Steam. This
   also avoids Valve's rules on unlocking a Steam app from an outside account.
3. **Org (education/corporate) customers** keep buying seats + specific products through
   Hacktivity. Steam is not their channel, and they play in the browser. How the org's products
   are recorded is C3, still open (see "Recording ownership").
4. **Subscription ends:** subscription-sourced access stops. Steam and one-off purchase access
   continues, because the user owns the game.
5. **Scoring:** Steam play outside a Hacktivity event doesn't feed event scoreboards. Achievements
   live on Steam (C5). Steam leaderboards are a future idea.

## Migration from today

1. Add Product, PlanProduct, OrgProduct, Entitlement, `users.steam_id`; seed products from
   mission.json `product` fields.
2. Seed PlanProduct with every plan × every product. Seed OrgProduct from the products each org's
   current events actually contain, and check this list with the user before switching it on.
3. Add `has_product?` beside the existing checks, logging disagreements without enforcing (shadow
   mode) for a release.
4. Enforce, then close the engine `create_game?` gap.

All of this is Hacktivity work: ask before editing Hacktivity, and commit on main.
