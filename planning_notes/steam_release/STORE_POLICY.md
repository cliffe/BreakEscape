# Store policy check (S12a)

Checked 2026-10-27 by web search and page fetch. This answers open question 2 in STEAM_PLAN.md as far
as public pages allow. It is a desk check, not legal advice, and not Valve's or Google's answer about
our case.

Method note: page text came back through a summarising fetch tool, so the quotes below are as
reported by that tool. Check the key ones on the live page before relying on them. Where I found
nothing, the file says so instead of filling the gap.

## Short answer

- Nothing public forbids a free Steam demo from unlocking the full game for a player who signs in to
  their own Hacktivity account and holds a subscription or a Play purchase. Nothing public permits it
  by name either. The demo docs say nothing on the point.
- Nothing public forbids a paid Steam game honouring purchases made elsewhere. The Steam rules that do
  exist cover the reverse direction: what the Steam build may sell or link to.
- The Steam build must not sell anything other than through Steam Wallet, and must not link to a
  store that does not offer Steam Wallet. So the Steam app must not carry buy buttons, prices or
  links to the website or Play. Sign-in and "you already have access" are the safe wording.
- The third-party account requirement is a store-page disclosure item. Valve's exact rule text was not
  reachable; community evidence says it is shown on the page.
- Google Play: the Payments policy has no multi-platform exception that I could find. Sign-in access
  for people who paid elsewhere is not addressed either way. The risk on Play sits in steering (in-app
  prompts to pay elsewhere), not in honouring an existing entitlement.
- The Steam Distribution Agreement (SDA) is not public. It is the one document that could change this
  answer, and the owner can read it in the Steamworks account.

## Confirmed (quoted from official pages)

### Steam demos

Source: https://partner.steamgames.com/doc/store/application/demos

- "Steam can host and distribute a demo version of your game that you can use to demonstrate part of
  your gaming experience." Demos are "a small playable portion of your game."
- "Demos are a separate App ID that is associated with your full game's App ID." Application type must
  be "Demo", with the base game's App ID set in General Application Settings.
- Standalone demo store pages: "ensure that the content is specific to the demo and not the full
  game"; "highlight only the features and experiences that customers will encounter in the demo."
  Needs "a trailer and at least five screenshots that are specific to your demo content."
- "Ensure that capsule images and Library Assets clearly indicate that the app is a demo."
- Demos "can appear anywhere in Steam that a free game could appear."
- Carry-over is described only as progress: "users can pick up where they left off in the demo once
  they buy the full game."
- For shared-depot demos the FAQ says to "gate it behind the ISteamApps::BIsSubscribedApp" for
  full-game-only behaviour. That shows Valve expects developers to switch behaviour inside a demo
  build by ownership checks.
- Limits: no community hub for demos; no multiplayer matchmaking between demo and full game; achievements
  should be disabled in demos; wishlist notification only once, within 14 days of first release; a
  deactivated demo stays in libraries but cannot be launched.
- Not on the page: any rule on a demo unlocking the full game, paid demo packages, or sign-in in a demo.

### Steam in-game purchases and links

Source: https://partner.steamgames.com/doc/store/review_process

- "Your product must use Steam Wallet for any in-game transactions."
- "your product cannot link to other store pages that does not offer Steam Wallet."
- "All supported features listed on the store page will need to be implemented in the current build."
- Store page: "You should not include links to other websites from this section" (description area).
  Valve also restricted external links in About the Game and similar fields from September 2024
  (reported by trade press, e.g. https://www.shacknews.com/article/140993/steam-september-2024-changes;
  not read on a Valve page).

Source: https://partner.steamgames.com/doc/features/microtransactions

- "you'll need to use the microtransaction API so Steam customers can only make purchases from the
  Steam Wallet." Nothing there about third-party payment, external stores or content bought elsewhere.

### Steam keys and price parity

Source: https://partner.steamgames.com/doc/features/keys

- "It is important that you don't give Steam customers a worse deal than Steam Key purchasers."
- "It's OK to run a discount for Steam Keys on different stores at different times as long as you plan
  to give a comparable offer to Steam customers within a reasonable amount of time."
- This page is about Steam keys sold elsewhere. It does not mention selling your own non-Steam access
  (a subscription, a website purchase).

### Google Play Payments policy

Source: https://support.google.com/googleplay/android-developer/answer/9858738

- Section 2: Play billing applies to "Play-distributed apps requiring or accepting payment for access
  to in-app features or services", "unless Section 3, 8, or 9 applies."
- Section 4: "apps may not lead users to a payment method other than Google Play's billing system."
  Covers "In-app webviews, buttons, links, messaging, advertisements, or other calls to action", and
  "account creation or sign-up flows."
- Section 8: "Developers serving users in eligible countries/regions may offer users an alternative
  billing system within the app" after enrolling. Section 9: "Developers may lead users in eligible
  countries/regions outside the app" under program requirements.
- The page has no section on multi-platform content, content bought elsewhere, or sign-in for
  earlier purchases.

### Google Play, US changes

Source: https://support.google.com/googleplay/android-developer/answer/15582165

- Effective 29 October 2025, for apps serving US users, Google "will not prohibit communicating with
  users about the availability or pricing of an app outside the Google Play Store", and will not
  prohibit "communicating with users about the availability of payment methods other than Google Play
  Billing". Linking US users to external content needs enrolment in the external content links program.
- Fees on those programmes start 1 October 2026 for reporting and payment (that page); the enrolment
  page (https://support.google.com/googleplay/android-developer/answer/16470497) was reported to give
  later dates (1 December 2026, and 1 February 2027 for downloads). The sources disagree. Recheck
  before relying on either date.
- This is tied to a US court order and Google reserves the right to change or end it. It was being
  revised after a March 2026 settlement with Epic.
- Dec 2025 announcement: https://support.google.com/googleplay/android-developer/answer/16671517
  (compliance date 28 January 2026, US users).

## Not found (say so, do not assume)

- Valve's exact rule on disclosing a required third-party account. Official pages fetched
  (review_process, platforms, drm, onboarding, content survey) did not contain it, and the Steamworks
  docs links I tried returned only the docs home page. What exists is community evidence: store pages
  show a "Requires 3rd-Party Account" line (for example Helldivers 2, "Requires 3rd-Party Account:
  PlayStation Network (Supports Linking to Steam Account)"), and Steamworks has "3rd-Party Account" and
  "3rd-Party DRM" toggles. Sources: https://steamcommunity.com/discussions/forum/10/601901188455074095/
  and https://steamcommunity.com/discussions/forum/0/4337600100417492572/ . These are forum posts,
  not policy.
- The Steam Distribution Agreement and Steam Subscriber Agreement wording on selling access outside
  Steam, or on how a Steam app may treat outside purchases. The SDA is not public (press on the Wolfire
  lawsuit says so, e.g. https://www.gamingonlinux.com/2021/02/valve-abusing-the-market-power-of-steam-on-game-pricing-according-to-a-lawsuit/).
  Forum claims that Valve requires "resting" price parity for Steam keys are not verified.
- Any Valve page on a Steam game honouring purchases or subscriptions made on a developer's website.
- Any Google page on honouring access bought on another platform or by subscription, including a
  multi-platform exception. Search found none.
- Valve rules on account deletion for linked accounts. Not searched beyond the pages above.

## My reading (not confirmed by Valve or Google)

1. Demo unlocking the full game. Valve's docs describe a demo as a small playable portion and say the
   store page must show only demo content. A demo that plays the whole game for signed-in account
   holders is outside that picture, and a reviewer could see it as the full game under a demo listing.
   Against that: no rule bans it, free apps may require an account, and the full content is only
   reachable by someone who already paid us. Risk: a reviewer objects at the demo's review, or asks us
   to treat it as a free-to-play app with its own listing.
   Mitigation: describe it truthfully on the demo page ("sign in with your Hacktivity account to
   continue; the free demo covers the first mission" or similar), keep the demo store page limited to
   what a non-signed-in player gets, and ask Valve in the Steamworks support ticket (below) before the
   page goes in review.
2. Paid Steam game honouring outside purchases. Most defensible shape: the game is sold on Steam; the
   Steam build recognises an entitlement tied to the player's own account, wherever it came from. The
   rule that bites is the other direction (the Steam build selling elsewhere), so keep prices, buy
   buttons and links out of the Steam build. "Open the website" for account matters (sign in, delete
   account) is not a store link, but a link to a page that sells the game or a subscription is.
   Grey area: Valve's wording is "other store pages that does not offer Steam Wallet". A Hacktivity
   subscription page is arguably a store page. Safest: no link from the Steam build to any page that
   sells; account management only.
3. Price parity. Applies to Steam keys. We are not selling Steam keys elsewhere, so it probably does
   not apply. A web or Play price lower than Steam's is still a commercial risk with Valve; I could not
   confirm an SDA price clause. The owner can read the SDA in Steamworks.
4. Third-party account. Expect to tick the third-party account disclosure on the store page (and the
   demo page) and say plainly that the game needs a Hacktivity account only for the account features.
   If the base game plays without one, say so.
5. Google Play. Honouring an entitlement a user already holds is not "leading users to a payment
   method" (Section 4). The Play app must not carry prompts, buttons, links or sign-up flows that send
   people to pay on the website or Steam. This matches the plan's rule that buy prompts go only to the
   store page of the platform in use. US users may be told about outside options under the October 2025
   change, but that is conditional and temporary; do not build on it. The UK and EEA programmes (Sections
   8 and 9) need enrolment, which is out of scope.

## Recommendation

1. Keep account-wide access, including in the Steam demo, but treat the demo as unconfirmed until
   Valve has answered. Per STEAM_PLAN question 2: the code stays built, and the demo's Steam sign-in
   stays off (app id null) until the owner has the answer below. Nothing in this check forces the
   fallback (platform-limited access in the demo).
2. Owner action, before S12 store review: raise a Steamworks support ticket asking Valve in plain
   words: "Our free demo app lets a signed-in account holder who has a subscription or a purchase made
   outside Steam open the full game. Is this allowed, and should it be a demo app or a separate free
   app?" Read the SDA in the partner account for any clause on outside sales or in-game references.
   Log the answer in OPEN_QUESTIONS.md (O12).
3. Steam build: no prices, buy buttons or links to anything that sells (website, Play). Sign-in,
   "you already have access" and account management only. Steam purchases through Steam only.
4. Store pages: disclose the Hacktivity account requirement in the third-party account field; keep the
   demo page to demo content; mark capsules as demo.
5. Play build: no steering to other payment methods. Keep the US-only allowances out of the design.
6. Recheck the Google fee dates and the Epic settlement outcome near launch.
