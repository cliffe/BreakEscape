# Open questions for the user

Decided 2026-10-24: online only, with Hacktivity as the back end.

The architecture questions were posed as a pick form
(https://claude.ai/artifact/UGPRffwRW9MQSrugb3wP6C). The picks came back on 2026-10-24 and are
recorded below. `README.md` and `ENTITLEMENTS.md` have been updated to match.

## Needs further discussion

Round 2 form (these points plus Google Play, 14 questions):
https://claude.ai/artifact/D1j8pH7GgmV87vnTaDRB41

Round 3 form (products, org tiers, org managers assigning games, quota; 13 questions):
https://claude.ai/artifact/JFBPunbAdaYph9nCi1C7iN

Round 4 form (event-based access model and pricing; 11 questions):
https://claude.ai/artifact/DLEWJPMHgAVGdLufiTaYQX

Round 5 form (simplest access model: alternatives with pros and cons; 8 questions):
https://claude.ai/artifact/QBKtq9fDreEQch1CKxUG1V

| Q | Question | Where the options are written up |
|---|---|---|
| C2, C3 | Products and tiers across individual, org and Steam/Play access: org tiers (awareness courses, incident response games, full VM labs), org managers assigning games, org members' access to hackboxes and games. Direction picked: new Product and Entitlement tables | `ENTITLEMENTS.md`, "Recording ownership" |

## Round 4 answers (2026-10-25)

The user wants the solution kept clean and simple; the uncertain points went to round 5.

- M1: EventEntitlement, **only for single-sale games**; save the store metadata (SteamID etc.).
- M2, M3: unsure. Admin assignment must be easy. Playable = open-subscription events (individuals,
  and orgs by opt-in per event); copyable = orgs (all pools on the full plan, a subset on
  Awareness & Games). Round 5 S1, S2.
- M4: maybe games needn't be copyable: copying only matters for an org's own release dates and
  weightings. Perhaps courses stay copyable and games are opted in for direct access. Round 5 G5.
- M5: per org, admin picks open-subscription events (games, hackboxes) org users access directly;
  courses are copied. Round 5 G7.
- M6: one public Licence to Hack game event, plus a free demo with the first mission. Round 5 E9.
- M7: add an admin list of lapsed orgs that still have seated members.
- R1: discuss. Infrastructure scales without extra cost, so the price is what players accept;
  nothing similar on the market, Hacknet nearest (simulated). Round 5 R1.
- R2: Eldritch Hacker £9.99.
- R3: yes, a "Games" individual plan, about £4.99/month, all game events, guest quota.
- R4: one new org plan, Awareness & Games (about £5/user/month), beside Business & Education.

## Round 3 answers (2026-10-24)

- P1, P2: **no Product model; the event is the product.** Steam and Play games are specific game
  events; org content is events they copy (pools today, games too). Design in `ACCESS_MODEL.md`.
- P3: Pro and Premium include everything, as today; they differ only in VM quota.
- T1: org plans, but access stays with copying events into the org; maybe also let an org plan
  grant specific `open_subscription` events directly. Awareness courses deserve an org plan.
  **Pricing to discuss**: Steam/Play games at about £10? A games-only Stripe subscription?
  Games/awareness at about £5 per user per month?
- T2: keep org seats + end date, add a plan choice to the org form.
- T3: org members get only what the org manager copied or assigned to the org, as now; games
  become copyable too.
- T4: seated members (role other than `user`) while the org's plan is current.
- T5: leave as today; rare, and the user wants to contact the org and resolve it by hand.
- O1: org managers copy game events as with pool courses, with their own dates.
- O2: limited to the org plan's events; others are shown but can't be selected.
- Q1: quota comes from the org plan; plans with no VM content give guest quota.
- Q2: active, trialing and cancelling subscriptions all count.
- Q3: one release, with migrations, tests and a per-org check list.

## Round 2 answers (2026-10-24)

- B8: the in-app sign-up asks for email, password and terms acceptance.
- B9: yes, the email must be verified; Hacktivity already automates this.
- B10: admin, account_manager and org-owner accounts can't be linked to Steam.
- B11: the full Hacktivity terms are the Steam EULA, plus acceptance on the link screen. Every terms
  change also needs the Steam EULA updated.
- C2: new Product and Entitlement tables, with plans mapped to products through PlanProduct. The
  wider products-and-tiers design (see the user's note in `ENTITLEMENTS.md`) **needs further
  discussion**.
- C3: covered by the C2 discussion.
- D1: free (guest) quota, with the claim wait lifted inside games the player owns.
- D7: a Steam buyer who also subscribes gets whichever quota is more generous, per event.
- E6: a Steam Playtest during m09–m10 work, then full release of m01–m10.
- E7: the Hacktivity pricing page and each game's page link to the Steam store pages.
- G1: Android app as a Trusted Web Activity (Bubblewrap).
- G2: Licence to Hack first on Play, phones and tablets.
- G3: one-off Play Billing purchase per game, verified server-side into `Entitlement(source:
  google_play)`.
- G4: Play buyers only. Each store app is a wrapper round one game: Hacktivity navigation and links
  are hidden, and any nudge to the rest of Hacktivity opens in the system browser, so no Stripe
  purchase can be made from the Steam or Play apps (`README.md`, "Single-game app mode").

## Round 1 answers (2026-10-24)

**A. Desktop app**

- A1: Electron + steamworks.js.
- A2: load everything from Hacktivity through Cloudflare, as the browser does.
- A3: the app sends its build version, and the server refuses old builds with "Update through Steam".
- A4: Windows and Linux (Steam Deck) at launch. Note: Google Play is wanted too. The packaging for it
  is in `README.md`, "Google Play (Android)".
- A5: Deck at launch as "Playable", with trackpad and on-screen keyboard.

**B. Sign-in and accounts**

- B1: silent Steam auth ticket, exchanged for a Hacktivity session.
- B2: link screen (create a free Hacktivity account or sign in to an existing one), then Steam ticket
  sign-in. **Needs further discussion**: SteamID carries no email.
- B3: unlink or move a Steam link only through support.
- B4: the ticket exchange sets a normal Devise session cookie in the window.
- B5: Hacktivity MFA isn't asked for on Steam ticket sign-in; Steam Guard covers it. How this works is
  in `ENTITLEMENTS.md`, "Sign-in details".
- B6: keep the account email, SteamID and persona name, nothing more.
- B7: when the terms change, send an email notice; continued use counts as acceptance. Note: show or
  link the Hacktivity terms as the Steam EULA, or at least at account creation (see
  `ENTITLEMENTS.md`, "Sign-in details").

**C. Game access inside Hacktivity**

- C1: a "library" event per product (an event that represents the game), with game slots, reusing
  `GameSlotPolicy`.
- C2: no pick. **Needs further discussion**: should ownership use the existing Subscription and Plan
  models?
- C3: no pick. **Needs further discussion**.
- C4: recheck Steam ownership at every app sign-in.
- C5: Steam achievements only, kept out of event scoreboards. Steam leaderboards are a future idea.

**D. VMs for Licence to Hack**

- D1: no pick. **Needs further discussion**: a new tier beside free and pro, or free with the
  cooldown between VM set claims removed.
- D2: fair use: one active set, idle shutdown, a generous hidden cap.
- D3: out of scope for now; solve it if capacity becomes a problem.
- D4: the in-game VM panel, inside the same window.
- D5: UK hosting only at launch. The store page doesn't need to make a point of it; performance is
  fine.
- D6: a reserved pre-built SecGen batch pool for Steam, topped up automatically.

**E. Store, keys and subscriptions**

- E1: one Steam app per game (Licence to Hack, then Eldritch Hacker), sharing one shell.
- E2: an m01 demo, VM stage included, on a small allowance.
- E3: **Steam only.** No own-site sale of Steam keys. Hacktivity subscriptions unlock all games in
  the browser. The Electron app is only for Steam buyers. The Hacktivity pricing page can link to
  the Steam store pages for buying a game on its own.
- E4: Hacktivity subscribers play in the browser; the Steam build is for Steam buyers.
- E5: Steam buyers can also play in the browser on Hacktivity once linked, for the games they own.
- E6: full release once m01–m10 are finished. **Needs further discussion**: Early Access for the
  whole game instead?

Earlier, 2026-10-24: every Steam player links a Hacktivity account (new free account or existing)
and accepts the standard terms. The store page must show "Requires 3rd-Party Account".
