# Open questions for the user

Decided 2026-10-24: online only, with Hacktivity as the back end.

The architecture questions were posed as a pick form
(https://claude.ai/artifact/UGPRffwRW9MQSrugb3wP6C). The picks came back on 2026-10-24 and are
recorded below. `README.md` and `ENTITLEMENTS.md` have been updated to match.

## Needs further discussion

Round 2 form (these points plus Google Play, 14 questions):
https://claude.ai/artifact/D1j8pH7GgmV87vnTaDRB41

| Q | Question | Where the options are written up |
|---|---|---|
| B2 | First-launch link screen. Steam doesn't give us an email address, so the link screen has to ask for one | `ENTITLEMENTS.md`, "Sign-in details" |
| C2 | How ownership is recorded: a new Entitlement table, or the existing Plan and Subscription models | `ENTITLEMENTS.md`, "Recording ownership" |
| C3 | How org deals for specific games are recorded | `ENTITLEMENTS.md`, "Recording ownership" |
| D1 | Which VM capacity and quota tier Steam players get (a new role, or free with the claim wait lifted) | `README.md`, "VM capacity for Steam players" |
| E6 | Full release after m10, or the whole game in Early Access | `README.md`, "Release type" |

## Answers (2026-10-24)

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
