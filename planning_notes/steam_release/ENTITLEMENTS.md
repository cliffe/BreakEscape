# Entitlements, Steam keys and the subscription model

Status: draft plan, 2026-10-22. Companion to `README.md`.

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
                 source ∈ steam | stripe_purchase | subscription | org | key | grant
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
  - an unrevoked **Entitlement** row (Steam, one-off purchase, key, manual grant).
- Events and game slots stay as they are for scheduling, scoring and cohorts. The entitlement check
  is an extra condition in `GameSlotPolicy#start?` and the engine's `create_game?` hook, not a
  replacement for events.
- Subscriptions and org access are computed live. Steam, purchase and key access are stored rows.
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

## Steam keys

Steam keys are generated free in Steamworks and redeemed on Steam. They grant ownership on Steam,
and Hacktivity then sees that ownership through step 2 above. We never have to track key-to-user
ourselves except for keys we hand out.

Uses:

| Use | How |
|---|---|
| Sell on our own site (Stripe) as well as on Steam | Buyer pays through Stripe and gets a Steam key and a Hacktivity entitlement (`source: stripe_purchase`). Store keys in a `SteamKey` pool table (key, product, assigned_to, assigned_at) |
| Press, streamers, testers | Keys from Steamworks or Valve's curator connect, no Hacktivity changes needed |
| Bundles / education resellers | Keys, subject to Valve's approval of the request |
| Subscribers who want the Steam version | Optional perk, see below |

Valve's rules to plan around (verify against current Steamworks documentation before committing):

- **Price parity:** keys sold elsewhere should not give a better deal than Steam's own price at the
  time. So the Stripe one-off price for "Licence to Hack" should match the Steam price.
- **Valve can refuse key requests**, particularly large requests out of proportion to Steam sales.
  Handing every subscriber a Steam key could hit this.
- **In-game purchases inside a Steam app go through Steam** (microtransactions). The Steam build
  must not sell Hacktivity subscriptions or link to the Stripe checkout in the game.
- A Steam game may require a third-party account. The store page has to say so.

## Subscriptions and Steam together

Recommended rules:

1. **Steam buyers own the game on Steam, and in Hacktivity once they link.** Buying on Steam grants
   `Entitlement(source: steam)` for that product only, not a subscription. A Steam buyer who links
   can play that game in the browser on Hacktivity too (same account and saves for Mode A). Their
   VM allowance is the Steam allowance (`README.md`), not the subscription quota.
2. **Subscribers keep "everything" on Hacktivity.** They can also use the Steam desktop app
   without buying on Steam: install with a key (if we give them one), or play the free demo app
   and sign in with their Hacktivity account to unlock the full game. Check Valve's rules on
   unlocking a Steam app's content from an outside account before relying on the second route.
   If those rules don't allow it, subscribers play in the browser and the Steam app is for Steam
   buyers.
3. **Org (education/corporate) customers** keep buying seats + specific products through
   Hacktivity (`OrgProduct`). Steam is not their channel. Orgs that want desktop installs use the
   same Hacktivity sign-in route as subscribers.
4. **Subscription ends:** subscription-sourced access stops. Steam and one-off purchase access
   continues, because the user owns the game.
5. **Scoring:** Steam play outside a Hacktivity event doesn't feed event scoreboards. Achievements
   live on Steam.

## Migration from today

1. Add Product, PlanProduct, OrgProduct, Entitlement, `users.steam_id`; seed products from
   mission.json `product` fields.
2. Seed PlanProduct with every plan × every product. Seed OrgProduct from the products each org's
   current events actually contain, and check this list with the user before switching it on.
3. Add `has_product?` beside the existing checks, logging disagreements without enforcing (shadow
   mode) for a release.
4. Enforce, then close the engine `create_game?` gap.

All of this is Hacktivity work: ask before editing Hacktivity, and commit on main.
