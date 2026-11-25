# Access and networks

This is the detailed reference for Break Escape's access model and network features, as built. The author reference is `README_scenario_design.md` together with `scripts/scenario-schema.json`: the README lists every feature below in "Access and networks: feature index" and this file goes deeper. If this file and the README ever disagree, the README and schema win, and this file needs fixing.

**How this was checked.** Every field name was checked against `scripts/scenario-schema.json`, the validators (`scripts/validate_scenario.rb`, `scripts/validate_*.rb`, `lib/break_escape/`), the server (`app/models/break_escape/`, `app/controllers/break_escape/games_controller.rb`) and the engine (`public/break_escape/js/`). The plans in `docs/achitechture/` were used to find features only. Each entry has an **Unverified** line for anything that was not confirmed in code; treat those as open. File and line references were correct on 2026-11-18 and will drift.

**Short forms used in citations.** `game.rb` is `app/models/break_escape/game.rb`; `gc` is `app/controllers/break_escape/games_controller.rb`; `ai` is `lib/break_escape/access_identities.rb`; `vs` is `scripts/validate_scenario.rb`; `NA` is `app/models/break_escape/network_access.rb`; `NM` is `lib/break_escape/network_model.rb`; `VN` is `scripts/validate_network.rb`; `NL` is the network engine module under `public/break_escape/js/`. `schema N` is a line in `scripts/scenario-schema.json`.

## 1. How identity, ACL, session and network reach chain together

```
 identity            ACL                    session / claim            network reach
 --------            ---                    ---------------            -------------
 NPC creds     -->   door/object `access`   password sign-in  ----+
 (A1) role,          (A2) roles + people    claim of an open       |   +--> foothold (jack, Wi-Fi, implant)  (N1, N8, N10)
 card                 |                     screen (A6)            |   |         |
   |                  v                          |                |   |         v
   +--> card copy   door opens / PC           profile, shares     |   |    network view: hosts, shares (N12, N4)
        (A3)        admits account (A4)       follow the account  |   |         |
                                              (A5, N4)            |   |         v
 credentials earned (captures, files,             |               |   |    remote sign-in at a host (N2)
 notes) --> keyring (A15) --> proof of            v               v   |         |
 identity for a PC                          policy limits the       |   |         v
                                            session (A7, A10b)      +---+--> pivot over networkLinks (N6)
 awareness/habits (A9) decide how                                       unplug ends sessions that ran through it (N5)
 careless a person is -> work, frustration and workarounds (A10) -> feeds (A11)
 gated doors (A12) and disguises (A13) sit beside this chain: they gate rooms, not PCs.
```

In words. An NPC with `creds` is an identity (A1). Doors and objects carry an access list that names roles and people (A2), and a card the player copies counts as that identity (A3). A sign-in PC admits the accounts its access list allows and shows them as tiles (A4); the player gets a session by typing a password or by claiming an owner's open screen (A6). The session decides what desktop the player sees (A5, N4) and the PC's policy limits it (A7). A rogue device, a Wi-Fi join or an implant gives a foothold on a network (N1, N8, N10); a foothold lists the hosts there, and a sign-in at one (N2) can be a stepping stone over a link to the next network (N6). Credentials the player has earned are listed in the keyring (A15). The server checks what it can prove (sign-ins, lockouts, card copies, plants, drops, grants, gate credit); animation, `unseenOnly`, USB refusals on the player's own plant and many UI states are client-side only. Each entry says which.

## 2. Feature index

| ID | Feature | What it does | Key fields |
|---|---|---|---|
| A1 | [Identities and credentials on NPCs](#a1-identities-and-credentials-on-npcs) | A room NPC can carry a role, a sign-in account (`creds.username`/`password`) and a card (`creds.card`); access lists and sign-in PCs judge these server-side. | `role`, `creds` (`username`, `password`, `card`), `staff`, `rfidCard` (legacy), `cloneable` (npc), `awareness`/`habits` (see A4/A8) on room NPCs; `identity`, `cloneable`, `card_id` on keycard items. |
| A2 | [Door and object access lists](#a2-door-and-object-access-lists) | An rfid lock with an `access` list opens for any held card whose owner's roles or id the list admits; the server checks this, not the browser. | `access` (room, object; also `accountProfiles.<id>.for`, sign-in PC), `acceptsUIDOnly` (room, object), `requires` (rfid card ids), `lockType: "rfid"`. |
| A3 | [Card copying recorded on the server](#a3-card-copying-recorded-on-the-server) | The card copier saves a copy in the browser, then POSTs `clone_card`; the server records it and uses the record to decide which locks the copy opens. | `rfid_cloner` item (holds the copier), `POST /clone_card` (`npc_id` / `object_id` / `held_card`, `card_id`, optional `card`), `cloneable` (npc, keycard), `acceptsUIDOnly`. |
| A4 | [Sign-in PCs and the account picker](#a4-sign-in-pcs-and-the-account-picker) | An object with `lockType: "login"` opens only through a sign-in; the sign-in screen shows account tiles per `loginPicker`, and a written-down password appears as a sticky note. | `lockType: "login"`, `access`, `loginPicker`, `postitNote`, `showPostit`, `owner`, `policy`, `host` (object); `habits.writesDown` (npc); `GET /login_accounts`. |
| A5 | [Account profiles](#a5-account-profiles) | `accountProfiles` put desktop files on every sign-in PC an account may use; the server serves them through `GET /container` only against a held session. | top level `accountProfiles.<id>.for` and `.contents`; item `transfer` (`copy`/`move`/`both`); `GET /container/:id`, `POST inventory` with a source PC. |
| A6 | [Sessions: sign-in, claiming the owner's screen, lock, logout](#a6-sessions-sign-in-claiming-the-owners-screen-lock-logout) | The server holds one session per sign-in PC; the player can sign in with a password, claim the owner's open screen, lock a held session, or sign out. | `POST /login` (`username`+`password`, or `claim: "owner"` / `claim: "guest"`, plus keyring `credential`/`foothold`/`from`/`relay`), `POST /logout`, `POST /lock_session`; scenario output `sessions`, `signedInPcs`, `sessionLockingSupported`. |
| A7 | [PC policies](#a7-pc-policies) | Named policies set how a sign-in PC locks and when it locks accounts out; a PC takes its own `policy` or the scenario `defaultPolicy`. | top level `policies.<name>` (`autoLockMin`, `maxAttempts`; also `usb` (A10b), `social` (A11), `remote` and `remoteScreen` (N2), `accepts` (A15)), `defaultPolicy`; object `policy`. |
| A8 | [Workstation lock behaviour](#a8-workstation-lock-behaviour) | When a PC's owner leaves, the screen locks or stays open by a fixed order of rules; an open screen can be claimed (A6), a locked one shows a padlock. | object: `workstation`, `owner`, `locksScreenOnLeave`, `lockChance`, `autoLockSeconds`; policy `autoLockMin`; npc `habits.screen` (`lockChance`, `lockIfAwayOverSeconds`), `habits.locksScreen`, `awareness`; sprite `pc_desktop`. |
| A9 | [Awareness presets and habits](#a9-awareness-presets-and-habits) | A room NPC gets an `awareness` level (low, medium, high) that fills habit defaults, and named `habits` that override them: lock the screen, write the password down, hold doors, password quality. | `awareness` (npc), `habits.locksScreen`, `habits.writesDown`, `habits.password`, `habits.passwordPattern`, `habits.holdsDoors` (npc), `habits.screen`, `habits.print` (npc, office-life blocks), `roles.<role>.awareness` (top level). |
| A10 | [Work resources, frustration and workarounds](#a10-work-resources-frustration-and-workarounds) | Staff need resources for their work; when a resource is down or locked they get frustrated, show it, and work round the control in ways the player can exploit. | `resources.<id>.{kind,name,access,offWhen,object}` (top level), `roles.<role>.{workNeeds,frustration,workarounds}` (top level), `workNeeds`, `frustration`, `workarounds` (npc), `needs.work`, `affordance.satisfies:"work"` (object), `chatter` pools (top level / npc). |
| A10b | [USB policy](#a10b-usb-policy) | A policy's `usb` value makes a workstation (or an object naming that policy) refuse items by `usbClass`, for the player's plants and for NPC stick use. | `policies.<p>.usb` (policy: `allowed`, `storage_blocked`, `blocked`), `usbClass` (item: `storage`, `hid`), `policy` (object), `defaultPolicy` (top level), `usb_refused` chatter pool. |
| A11 | [Social media feeds](#a11-social-media-feeds) | A room NPC with a `social_media` need posts to a `social.osint` profile one post per met use; posts and their facts are withheld until served, and NPCs can reply to and react to each other. | `feed` (`site`, `person`, `order`, `posts[]`, `reacts[]`) (npc), `phone` (npc), `socialUse` (npc), `needs.social_media`, `policies.<p>.social`, item type `phone_friendface`, `social.osint.postToasts`. |
| A12 | [Gated doors](#a12-gated-doors) | A door that opens by itself for named NPCs, holds open for a tailgate window, then shuts; the player gets through by following, by wearing the right disguise or by presenting the card. | `rooms.<room>.doors[].gate` (`enabled`, `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, `noHold`, `creditOnPass`, `sound`), NPC `habits.holdsDoors` / `awareness`, eventMappings `closeDoor`, locked-room `requires`. |
| A13 | [Wearables and disguises](#a13-wearables-and-disguises) | A takeable item the player puts on from the tray to swap their sprite and set a server-owned "worn" global, which gates can read. | item `wearable` (`costume`, `global`, `unseenOnly`, `seenBy.ignore`, `confirmOn`, `confirmOff`, `onWear`, `onRemove`), top-level `disguises`, actions `set_costume`, `clear_costume`, `wear`, `take_off`, global `pp_disguise`. |
| A14 | [Declared grants](#a14-declared-grants) | A `give_item` with an identified item, run from a timer or an interaction, is on the server's allowlist, so the player can legitimately claim it by POST inventory. | action `give_item` with `item.id` (or `opens_lock`), on `timers[].actions[]`, `triggerOnInteract[]`, `onInteract.actions[]`, `completionActions[]`, `conditionalActions[].actions[]`, `onConfirm[]`. |
| A15 | [Credential keyring](#a15-credential-keyring) | A server-only registry of credentials (passwords, saved connections, assist invites, timed tokens) that the player earns by proof and uses to sign in at a PC without typing a password. | top-level `credentials`, item `credential`, `policies.<name>.accepts`, `policies.<name>.remoteScreen`, credential `expiresMin`, `endsOnGlobal`, `connectsTo`, `foundIn`, `proof`. |
| A16 | [Capture proof](#a16-capture-proof) | An account holder names facts the server records itself (a device planted, an item dropped, a sign-in made); only once one holds does `GET /capture_secrets` serve the captured password. | `captureProof[]` (npc with `creds`), `addCapture.proof` (npc event mapping shorthand), `social.captures.revealSecret`, `addCapture.secret`. |
| A17 | [Item plants, hiding spots and holder items](#a17-item-plants-hiding-spots-and-holder-items) | A `requiresItem` object takes a kit item the player carries; a `hideable` item can be tucked into any plant in listed rooms; a holder item (`holds`) files captured sessions and findings out of the tray. | `requiresItem`, `consumesItem`, `requiresItemHint`, `requiresItemHintVariants`, `requiresItemCondition`, `requiresItemConditionHint(Variants)` (object); `hideable` (item); `hiddenWith`, `hidingSpot`, `hideAt` (object); `holds`, `storeIn` (item); `linkStoreIn` (jack). |
| A18 | [Privilege on a session](#a18-privilege-on-a-session) | A sign-in PC session has a level, user or admin. An account marked `creds.admin` gets an admin session by signing in; a technique card can step a session up. An admin session opens the PC owner's profiles and lets a USB device through that the PC's policy would refuse. | `creds.admin` (account); `needs.session`, `grants.session.access` (N15); the PC's `owner`, `accountProfiles`, `usb` policy; item `usbClass`. |
| A21 | [Hash records and the cracker](#a21-hash-records-and-the-cracker) | A `hash` credential is an opaque token in the keyring. The player picks intel facts they have earned in a small cracker scene and presses Crack; the server decides by the account's password class, and a success adds an ordinary password to the keyring. | `credentials` `kind: "hash"` (`account`, `proof`, `salted`, `crackSeconds`, `crack`), `habits.passwordDifficulty`, item `revealsFacts`, flag reward `grant_fact`. |
| A22 | [Multi-factor sign-in](#a22-multi-factor-sign-in) | A sign-in PC asks for a second step after the right password: a six-digit code from a held `code_device`, a push the owner may approve, or a push the owner never approves (a held phone taps the right number). Tokens, help invites and claimed screens skip it; a saved connection still asks. | policy `mfa`; `creds.mfa: false`; item `code_device` (`owner`); `habits.approvesPrompts`, `habits.promptPatience`; owned `phone_friendface`. Validator `check_mfa`; graph "second step" edges. |
| A24 | [Ops log: write side](#a24-ops-log-write-side) | The server records what the player does at a card door and a sign-in PC as short log rows kept in `player_state`, into the sources the scenario declares; nothing shows them yet (a reader comes with L2a). | top level `logSources.<id>` (`title`, `events`, optional `where`, `showCardHolder`, `maxRows`) and a `gameClock`; withheld from the bootstrap. |
| A24 (read side) | [Ops log: read side](#a24-ops-log-read-side) | An `ops_log_terminal` object opens a viewer of one declared log source: a table of the rows the player's own actions wrote (time, event, identity, location, result, detail), with filters and a detail pane. | object `type: "ops_log_terminal"`, `minigameData.logSource` (required); `GET /log_rows`. |
| A24 (seed rows and anomalies) | [Ops log: seed rows and anomalies](#a24-ops-log-seed-rows-and-anomalies) | A log source can carry authored history (seed rows) shown before the rows play writes, and its reader can name one seed row as an anomaly the player flags; the browser checks the flag (best effort). | `logSources.<id>.seedRows`; reader `minigameData.anomaly.rowId`, `flagActionLabel`, `flagActions`, `completionActions`. |
| A24 (network and share rows) | [Ops log: network and share rows](#a24-ops-log-network-and-share-rows) | Plugging in a device at a jack, unplugging it, joining an access point and opening a share folder each write a row a reader can show (a repeat open writes none; an implant and a card copy write none). | source `events: ["net_*", "share_*"]`, `where.places` `jack:`, `ap:`, `share:`. |
| N1 | [Network jack and drop box](#n1-network-jack-and-drop-box) | A room object marked `networkJack` takes a carried `rogueDevice`; planting gives a foothold on the jack's network and opens the network view. | `networks` (top level), `networkJack`, `jackConfirm`, `plantedSprite`, `requiresItemHint`, `linkName`, `linkStoreIn`, `network` (object or room), `rogueDevice` (item). |
| N2 | [Remote sign-in](#n2-remote-sign-in) | A held foothold lets the player sign in to any host on its reachable networks from the network view, unless the PC's policy blocks remote sign-in. | `policies.<name>.remote`, `policies.<name>.remoteScreen` (policy), `host` (object), `loginPicker` (object). |
| N3 | [Headless hosts](#n3-headless-hosts) | A sign-in object with `headless: true` has no screen or keyboard and can be signed in to only through a foothold. | `headless` (object, with `lockType: "login"`), `network`. |
| N4 | [File shares, open and protected](#n4-file-shares-open-and-protected) | A `resources` entry of kind `file_share` on a network holds items; an open share is served to any foothold that reaches it, an access-listed share to a session whose identity the list admits, and is mapped on the desktop. | `resources.<id>` (top level): `kind`, `name`, `host`, `network`, `access`, `contents`, `observations`, `offWhen`, `object`. |
| N5 | [Unplugging ends the sessions run through it](#n5-unplugging-ends-the-sessions-run-through-it) | Unplugging a device deletes its foothold, its link item and every session opened through it, and returns the box to the tray. | none authored; `POST /network/unplug`. The Unplug button is in the network view opened at the jack. |
| N6 | [Pivot via networkLinks](#n6-pivot-via-networklinks) | `networkLinks` joins two networks; a foothold reaches the linked network only once the player holds a session on a host of a reached network. | `networkLinks` (top level). |
| N7 | [Outages](#n7-outages) | `offWhen` on a network, a resource or a sign-in object makes it unavailable while a global holds; held sessions are kept but shown no route. | `networks.<id>.offWhen`, `resources.<id>.offWhen`, object `offWhen` (all the requireGlobal form). |
| N8 | [Wi-Fi join and rogue AP](#n8-wi-fi-join-and-rogue-ap) | A network with a `wifi` block is joined at a `wifiAp` object with the key; a planted pocket rogue AP (`wifiTwin`) opens a Recon/Clone/Log console. | `networks.<id>.wifi { ssid, psk }` (top level); `wifiAp` (object); `wifiTwin`, `apScan`, `apPortal`, `apCaptureLog` (object, on the planted device). |
| N9 | [Port security](#n9-port-security) | `portSecurity: true` on a jack makes the switch refuse every device: no foothold, the device stays in the inventory, and a message names the fix. | `portSecurity`, `portSecurityMessage` (object, on a jack). |
| N10 | [Implants](#n10-implants) | A `grant_foothold` action gives a foothold on a sign-in PC's own network: from a device the player plugs into a PC they hold a session on (held-device and needs-a-session variant, also the BadUSB), or from a device the player dropped that an NPC then uses (dropped-device variant). | `grant_foothold` action: `pc`, `needsSession`, `needsHeld`, `needsDropped`, `name`; item `usbClass`; policy `usb`. |
| N11 | [Patch panel](#n11-patch-panel) | An object with `panelPorts` opens a 24-port patch panel; a port with a jack plants the player's box through the usual jack flow. | `panelPorts` (object), `panelOf` (jack). |
| N12 | [Resource and host rows in the network view (additional)](#n12-resource-and-host-rows-in-the-network-view-additional) | `GET /network` lists, per held foothold, host rows (sign-in objects) and resource rows on each reachable network, with greyed blocks for networks the player held a session on that are now down. | `host` (object), `sprite` (object), resource `name`, `host`, `observations`. |
| N13 | [Discovery, hosts and services](#n13-discovery-hosts-and-services) | A network with `discovery: "scan"` opens its view with no rows until the player sweeps it; a top-level `hosts` map adds devices with no sign-in; a host (device or sign-in PC) lists `services` once it is scanned. `POST /network/scan` is the sweep and the host scan. | `networks.<id>.discovery` (`"open"` or `"scan"`), top-level `hosts.<id>` (`name`, `network`, `sprite`, `offWhen`, `services`), `services` on a sign-in object. |
| N14 | [Findings: check and confirm](#n14-findings-check-and-confirm) | A scanned service has `weaknesses` and `decoys`. Check lists them all as unconfirmed findings with a class, a severity and a summary and nothing to tell a real one from a decoy; Confirm settles one: real (it then shows what it needs) or false (it then shows why). `POST /network/check` and `POST /network/confirm`. | `weaknesses` and `decoys` on a service (`id`, `class`, `severity`, `summary`, `needs`, `fixedIf`; a decoy's `falseBecause`), a `realism` link to a catalog entry for the command-line skin (not declared in the schema yet, so no scenario can author it today). |
| N15 | [Technique cards and technique sessions](#n15-technique-cards-and-technique-sessions) | A card item names a technique; used on a confirmed finding it works on, it grants the player a session on the weak host (even one that blocks remote sign-in, opened as a remote view) or a saved connection in the keyring. `POST /network/technique`. | top-level `techniques.<id>` (`name`, `summary`, `worksOn`), an item of type `technique_card` with `technique_card: "<id>"`, `grants` on a weakness (`session` or `credential`), `needs.session`. |

A10b is the USB policy, split out of A10. N12 is the network view's own rows and blocks. N13 is the first ops core stage (discovery, hosts and services); N14 is the second (findings: check and confirm); N15 is the third (technique cards and technique sessions). The BadUSB beat in the 9.3b plan is the `needsSession` shape of N10, not a separate feature.

## 3. Access features

### A1 Identities and credentials on NPCs
**One line.** A room NPC can carry a role, a sign-in account (`creds.username`/`password`) and a card (`creds.card`); access lists and sign-in PCs judge these server-side.
**Key fields.** `role`, `creds` (`username`, `password`, `card`), `staff`, `rfidCard` (legacy), `cloneable` (npc), `awareness`/`habits` (see A4/A8) on room NPCs; `identity`, `cloneable`, `card_id` on keycard items.
**What the player sees.** Nothing directly. An NPC's card can be copied with the card copier (A3), its account shows as a tile at a sign-in PC (A4), and its roles decide which doors and PCs it opens. The browser never receives `creds`, `role` or `awareness`; the card goes out as `rfidCard`.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `role` | room NPC | job role(s), free strings, a string or array; read by access lists (schema 4394) | none |
| `creds.username` | room NPC | makes an account; unique, compared trimmed and case-insensitively (schema 4402) | none |
| `creds.password` | room NPC | the only place the password is written; required once a username is set (validator error) | none |
| `creds.card` | room NPC | the card the NPC carries: `card_id`, `name`, `rfid_protocol`, further protocol fields (schema 4406) | none |
| `staff` | room NPC | `false` drops the implicit `staff` role (schema 4412) | implicit `staff` when `creds` or a card exists |
| `rfidCard` | room NPC | older spelling of the card; `creds.card` wins; the browser always gets `rfidCard` (schema 4381) | none |
| `cloneable` | room NPC | `false` stops the server recording a copy of this card (schema 4431) | true |
| `identity` | keycard item | NPC id the card belongs to; validator checks that NPC carries the same `card_id` (schema 5656) | none |
| `cloneable` | keycard item | `false` stops a copy of this keycard being recorded (schema 5655) | true |

Roles resolve as: authored `role` plus implicit `staff` when the NPC has `creds` or a card, unless `staff` is false (`game.rb:3082`, `ai:60`). Only room NPCs (`rooms.<id>.npcs[]`) may carry `role` and `creds`; the validator errors on `npcs`, `phoneNPCs` or headless records that do (`vs:7539-7556`).
**Example.** See the A1 to A8 worked example (section 5) (NPC `lena`, keycard `lena_badge`).
**Server enforces / client only.**
- Server: `role`, `creds`, `awareness`, `workarounds` are withheld from every browser payload (`WITHHELD_NPC_KEYS`, `game.rb:7290`). The card is not secret; `rfidCard` is set from `creds.card` (`game.rb:7286-7289`).
- Server: `cloneable: false` refuses a copy ("This card cannot be copied", `game.rb:4100`; keycard objects `game.rb:4181`).
- Server: usernames normalised with `strip.downcase[0,64]` (`ai:54`, `game.rb` `normalise_username`).
- Client only: `rfidCard` fields drive the cloner minigame (protocol decides instant clone, key attack or UID-only).
**Events.** None specific. Copying emits `card_cloned` (see A3).
**Validator.** `check_access_model` (`vs:7518`): password required with username (7564); unique usernames (7595-ish, "share the username"); `usePayload.address/secret` and `addCapture` address/secret must match creds or be absent (7570-7590); `creds.password` must not appear in any ink file (8157); keycard `identity` must name an NPC carrying its `card_id` (7846-7852); shared card at an access lock draws a warning (8180-8186); `info` "Identity reach" lines (8189-8198). `role`/`creds` off room NPCs is an error (7550).
**Shown in.** `creds`: test_access_signin, test_access_sessions, test_access_doors, demo_access_tour, lab_physical_pentest, test_access_habits, test_access_keyring, test_access_networks, test_capture_log, test_access_devices, test_access_work, test_access_social, test_secret_leaks. `rfidCard` (legacy): m03, m04, m05, m06, m07, m08, m09, m10, lab_physical_pentest, test-rfid, test-rfid-multiprotocol, test_gate_tailgate, test_clone_left_card. `cloneable`: no scenario authors it (grep empty). Best demo: test_access_doors for cards, test_access_signin for accounts.
**Known limits.** `cloneable` has no scenario using it. No backlog entry found for it.
**Plan vs code.** README never documents `role`, `creds`, `staff`, `identity`, `cloneable` (only one `creds` snippet, README:1188). Schema 4381 says `rfidCard` is the card field; code prefers `creds.card` (`ai:35`). Otherwise none found.
**Unverified.** Which scenarios set `identity` (grep not run for it); client sync of `card_*` flags into ink (`npc-conversation-state.js`) not read.

### A2 Door and object access lists
**One line.** An rfid lock with an `access` list opens for any held card whose owner's roles or id the list admits; the server checks this, not the browser.
**Key fields.** `access` (room, object; also `accountProfiles.<id>.for`, sign-in PC), `acceptsUIDOnly` (room, object), `requires` (rfid card ids), `lockType: "rfid"`.
**What the player sees.** Holding or copying a card that belongs to someone the list admits opens the door or lock; the toast names the player's own keycard, but a copy gives only "via copy", so it never reveals whose identity passed. A UID-only (DESFire) copy is refused unless the lock sets `acceptsUIDOnly`, with reason `uid_only`.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `access` | room, object, PC, profile `for` | `{ roles: [], people: [] }`; passes if the card holder's roles meet `roles` or its NPC id is in `people` (schema 3934) | none |
| `acceptsUIDOnly` | room, object | an rfid lock with `access` also opens to a UID-only copy (schema 4222, 5521) | false |
| `requires` | room, object | rfid: card ids that open it with no identity check (`rfid_requires_held?`) | none |

A lock may carry `requires`, `access`, or both. The validator rejects an rfid lock with neither.
**Example.** Room `office` in the A1 to A8 worked example (section 5) (rfid, `requires` plus `access`).
**Server enforces / client only.**
- Server: `rfid_lock_passes?` (`game.rb:3982`): without `access` the player must provably hold a card or clone named in `requires` (`game.rb:4000`); with `access` and `card_ids` the first held, non-revoked card whose NPC passes `acl_admits?` opens it (`game.rb:4039`, `3968`).
- Server: held cards are read from server inventory and `serverClones`, never client claims; a forged client item is ignored (`game.rb:3936`, `ItemIdentity.client_forged?`).
- Server: revoked cards (global `revoked_card_ids`) and clones of them open nothing (`game.rb:3925`).
- Server: UID-only copy refused unless `acceptsUIDOnly == true` (`game.rb:3995`; `gc:1241` answers `reason: "uid_only"`).
- Server: unlock method must be `rfid` for an rfid lock (`UNLOCK_METHODS_BY_LOCK_TYPE`, `game.rb:4480`).
- Client only: choosing which held card ids to send; the toast text.
**Events.** Door/object unlock events are the general ones (not mapped here). `gc:1291`/`1307` add `cardId` or `viaCopy` to the unlock answer.
**Validator.** rfid lock with neither `requires` nor `access`: error (`vs:7880`); `requires` on an access lock must name a card some NPC or keycard carries (7886); unknown `people` id: error; role no NPC holds: warning (7757-7762); `access` or `acceptsUIDOnly` on a `doors[]` entry: error, put it on the room (7936); `access` on a gate door: error, gates open from `requires` alone (7970); non-object `access`: error. Also the dungeon-graph/lock-key tools read `AccessIdentities.reach` (`ai:294`).
**Shown in.** `access` on a door/object: test_access_doors (best demo, also the only user of `acceptsUIDOnly`), demo_access_tour, lab_physical_pentest, test_access_signin, test_access_work, test_access_networks, test_access_social, test_access_devices, test_access_keyring, test_capture_log, ca14_social_media.
**Known limits.** Gate doors take `requires` only. No backlog entry searched beyond keyword (none matched `acceptsUIDOnly`).
**Plan vs code.** README documents rfid `requires` (README:679) but not `access` or `acceptsUIDOnly`. Schema keeps `access` and `acceptsUIDOnly` on the room payload through the bootstrap (`game.rb:2406`), so they are not secret (code agrees).
**Unverified.** Client-side card selection code not read.

### A3 Card copying recorded on the server
**One line.** The card copier saves a copy in the browser, then POSTs `clone_card`; the server records it and uses the record to decide which locks the copy opens.
**Key fields.** `rfid_cloner` item (holds the copier), `POST /clone_card` (`npc_id` | `object_id` | `held_card`, `card_id`, optional `card`), `cloneable` (npc, keycard), `acceptsUIDOnly`.
**What the player sees.** Standing near an NPC with a card (or at a loose keycard), scanning with the cloner and saving. A DESFire card saves as UID-only. The cloner's list shows saved cards.
**Fields.** Server-side state `serverClones` (player state): `card_id -> { source: {npc|object|held}, uidOnly }`.
**Example.** Scenario side: an NPC with `creds.card` (see A1 example) and a start item of type `rfid_cloner`.
**Server enforces / client only.**
- Server: needs a real held `rfid_cloner` ("No card copier", `game.rb:4090`, `3894`).
- Server: NPC source must have a card, be encountered (`encounteredNPCs`) and not `cloneable: false` (`game.rb:4093-4100`).
- Server: object source must be a keycard with a `card_id`, not `cloneable: false`, held or in a reachable, unlocked room with open containers (`clone_source_keycard`, `game.rb:4176`).
- Server: a `card_id` that does not match the source's own is answered `recorded: false` (`game.rb:4125`).
- Server: `uidOnly` set from `rfid_protocol == "MIFARE_DESFire"` (`game.rb:4136`).
- Server: the display card stored on the cloner takes name/protocol from the server definition; only `rfid_data` keys `cardId hex facility cardNumber uid sectors masterKeyKnown` come from the client; max 50 cards, 64 KB list, 4 KB each (`game.rb:5540-5600`).
- Server: a clone counts only while a cloner is held; a revoked card's clone is dead (`held_rfid_cards`, `game.rb:3936`).
- Client only: the RFID minigame itself (key attacks, timing).
**Events.** `card_cloned` `{ cardName, cardHex, timestamp }` (`public/break_escape/js/minigames/rfid/rfid-minigame.js:555`).
**Validator.** `#clone_keycard:<id>` in an NPC's ink for another NPC's card draws a warning (`vs:8167`); lock-key reachability treats a cloner as granting NPC cards (`vs:2316-2345`).
**Shown in.** test_access_doors (best demo), demo_access_tour, lab_physical_pentest, test_clone_left_card, test-rfid, test-rfid-multiprotocol, m03 to m10 (legacy cards).
**Known limits.** Legacy copies without a server record are backfilled if the server can confirm the source, else dropped (`backfill_legacy_cloned_cards!`, `game.rb:5660`).
**Plan vs code.** None found in what was read.
**Unverified.** Client call site of `clone_card`.

### A4 Sign-in PCs and the account picker
**One line.** An object with `lockType: "login"` opens only through a sign-in; the sign-in screen shows account tiles per `loginPicker`, and a written-down password appears as a sticky note.
**Key fields.** `lockType: "login"`, `access`, `loginPicker`, `postitNote`, `showPostit`, `owner`, `policy`, `host` (object); `habits.writesDown` (npc); `GET /login_accounts`.
**What the player sees.** Clicking the PC shows the sign-in screen with a tile (headshot, display name) per account the PC admits; or, with `loginPicker: false`, a username box. If the owner writes the password down, a sticky note shows "username / password" at the keyboard (never over the network). After a good sign-in the desktop opens.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `lockType: "login"` | object | marks a sign-in PC (schema 5278; `login_pc?` `ai:140`) | n/a |
| `access` | object | which accounts may sign in; none = every account (`game.rb:3361`) | admit all |
| `loginPicker` | object | `"accounts"` every admitted account, `"known"` only NPCs the player has met, `false` type the username (schema 5522) | `"accounts"` |
| `postitNote` | object | authored sticky note; wins over a derived one (schema 5314) | none |
| `showPostit` | object | `false` suppresses the derived note (`game.rb:3407`) | true |
| `owner` | object | the NPC who owns the PC (schema 5510) | none |
| `habits.writesDown` | npc | `true`: owner's "username / password" is on a note at their PC; also set by a done `writes_down` workaround (`game.rb:3392`) | false |

Tile contents: `username`, `displayName`, `portrait`, `avatar` only (`game.rb:3853`).
**Example.** Object `lena_pc` in the A1 to A8 worked example (section 5).
**Server enforces / client only.**
- Server: a sign-in PC is never opened by `unlockedObjects`; `/unlock` on it is refused (`unlock_scope_refused?`, `game.rb:4194-4200`); `unlockable` lists and `unlock_object` rewards naming one are validator errors.
- Server: `GET /login_accounts` refuses an unreachable or headless PC (403) and a switched-off PC (reason `off`), sends `Cache-Control: no-store`, and adds `postitNote` only at the keyboard (`gc:1559-1615`).
- Server: the bootstrap/room payload carries `loginAccounts` and `hasPostit: true`, never the note text (`attach_login_accounts!`, `game.rb:4385`).
- Server: wrong password and unknown username answer the same ("Incorrect username or password"), counted per PC and normalised username (`game.rb:3429`, `LOGIN_INCORRECT`).
- Client only: the tile UI, `loginPicker: "known"` display filtering is done server-side from `encounteredNPCs`.
**Events.** `pc_signed_in` `{ pcId, npcId, username, via, previousNpcId, firstAtPc, [token], remote fields }` (`public/break_escape/js/systems/pc-sessions.js:788`); `pc_signed_out` `{ pcId, npcId, reason, ... }` with reasons `sign_out`, `displaced`, `switch`, `claim_ended`, `owner_returned`, `auto_locked` (a claim that ended), `no_session`, `token_expired`, `link_dropped`, `relay_ended` (`pc-sessions.js:453, 732, 751, 782, 814, 871, 907, 942`; the claim reasons are `SIGNING_OUT_REASONS`, `workstation-state.js:106`). Also from `pc-sessions.js`: `pc_signin_failed` `{ pcId, reason, attemptsLeft, [credential] }` (533, 602), `pc_signing_out` (455, 729, 807), `pc_in_use` (769), `pc_session_locked` (857), `pc_signin_shown` (1024), `pc_desktop_opened` (1032). Each is also emitted as `<name>:<pcId>` (340).
**Validator.** PC id must not contain `|` (`vs:8031`); `triggerOnInteract` on a sign-in PC is an error (8034); `unlockable` and `unlock_object` naming one: errors (8040-8048); owner must be a room NPC id (8057); account whose `needsHome` is a PC whose access list excludes it: warning (8095); `desktopUser` on a sign-in PC: warning (`vs:739`).
**Shown in.** `lockType: login`: test_access_signin (best demo), test_access_sessions, demo_access_tour, lab_physical_pentest, test_access_work, test_access_networks, test_access_devices, test_access_habits, test_access_social, test_access_keyring, test_capture_log. `loginPicker`: test_access_signin, test_access_keyring, test_access_devices, test_access_networks, lab_physical_pentest. `postitNote` on ordinary password PCs is also used in m01 to m09 and others (a different feature: a note on a password lock screen).
**Known limits.** A headless host shows no tiles. No backlog entry searched for `loginPicker`.
**Plan vs code.** README never documents `lockType: "login"`, `loginPicker` or account tiles; README:1463 lists `postitNote` only for the password lock.
**Unverified.** Client sign-in screen code not read.

### A5 Account profiles
**One line.** `accountProfiles` put desktop files on every sign-in PC an account may use; the server serves them through `GET /container` only against a held session.
**Key fields.** top level `accountProfiles.<id>.for` and `.contents`; item `transfer` (`copy`|`move`|`both`); `GET /container/:id`, `POST inventory` with a source PC.
**What the player sees.** After signing in as an account, the desktop shows the PC's own files plus the files of each profile that admits the account (role profiles first, then personal ones). Takeable files can be copied or moved into the inventory as `transfer` allows.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `accountProfiles` | top level | map id to profile (schema 245) | none |
| `for` | profile | access list `{roles, people}`; required; empty means nobody | required |
| `contents` | profile | items shown on the desktop | none |
| `transfer` | item on a sign-in desktop | what a takeable file allows (schema 5654) | `both` |

**Example.** `accountProfiles.staff_desktop` in the A1 to A8 worked example (section 5) (a copy-only handbook).
**Server enforces / client only.**
- Server: `accountProfiles` never sent in the bootstrap (schema `x-serverOnly`); served by `GET /container` (`gc:618`).
- Server: a PC desktop needs a session (`session_identity`, `game.rb:3228`; locked sessions admit nothing); otherwise 403 `no_session` (`gc:3105`).
- Server: contents are the PC's own then `admitted_profiles` (role matches before person matches) then mapped shares (`login_desktop_contents`, `game.rb:3322`).
- Server: a profile folder needs a session whose identity the profile's `for` admits, with each container above unlocked (`session_admits?`, `game.rb:3245-3270`; `gc:652`).
- Server: taking an item from a desktop is judged by that PC's session, requires `takeable`, a valid `transfer` choice, and honours the item's `transfer` ("This file can only be copied", `gc:3453-3500`). Default choice is `move`.
- Client only: showing the copy/move choice.
**Events.** None specific beyond the inventory add.
**Validator.** Profile with no `for` roles/people: warning "admits nobody" (`vs:7746`); profile item ids must be unique and not equal to a room object id (`vs:7823-7840`); profile items get the normal item checks (`vs:978-990`).
**Shown in.** test_access_signin (best demo, including a copy-only and a move-only file), test_access_sessions, test_access_work, test_access_social, test_access_habits, test_access_devices, lab_physical_pentest.
**Known limits.** none found.
**Plan vs code.** README does not mention `accountProfiles` at all (only `pc` items).
**Unverified.** Client desktop rendering.

### A6 Sessions: sign-in, claiming the owner's screen, lock, logout
**One line.** The server holds one session per sign-in PC; the player can sign in with a password, claim the owner's open screen, lock a held session, or sign out.
**Key fields.** `POST /login` (`username`+`password`, or `claim: "owner"` / `claim: "guest"`, plus keyring `credential`/`foothold`/`from`/`relay`), `POST /logout`, `POST /lock_session`; scenario output `sessions`, `signedInPcs`, `sessionLockingSupported`.
**What the player sees.** Typing a good password opens the desktop. Clicking a PC whose owner left it open signs in as the owner with no password (a claim). The desktop has Lock and Sign out; a locked session needs the password again. A reload ends claimed sessions (the owners are back at their desks).
**Fields (state).**

| field | where | meaning |
|---|---|---|
| `sessions` | player state | `pcId -> { id, via, foothold?, from?, relay?, credential?, locked? }`, `via` is `password`, `claim` or `credential` |
| `signedInPcs` | player state | grow-only list of PCs ever signed in to (not relays or tokens); proves `session` credentials |
| `guestSessions` | player state | PC -> NPC id that left a borrow open |
| `loginFailures`, `loginLockouts` | player state | counts and locked keys `pcId|normalised-username` (see A7) |

**Example.** Not a scenario field; scenario side is the PC and account in the A1 to A8 worked example (section 5).
**Server enforces / client only.**
- Password sign-in: PC must exist, be reachable, not headless, not off; account must exist, password match exactly, and `access` must admit the account ("This account can't sign in on this PC") (`attempt_login!`, `game.rb:3429-3475`).
- Owner claim (`claim_login_session!`, `game.rb:3512`): refused with the generic "Sign in required" unless the PC is reachable, has no held session, has an owner who is tracked by the needs system (`needs_tracked?`), has an account, passes `access`, is not a screen that always locks (`pc_always_locks?`), is not locked out, the policy's `autoLockMin` is not 0, and the owner can actually leave the post (`OwnerClaim.never_leaves?`). Through a foothold a claim is always refused ("an unlocked screen is physical").
- Guest claim (`claim_guest_session!`, `game.rb:3582`): needs a `guestSessions` record, an account that `access` admits, `autoLockMin` not 0, a guest not "careful", no lockout and not timed out.
- `POST /logout`: no checks; ends onward sessions whose route is gone (`logout_session!`, `game.rb:3645`; `gc:1528`).
- `POST /lock_session`: only a held, lockable session (`via` `password`, or a `credential` session over a foothold/`from`); claim, guest and relay sessions refuse ("Only a signed-in session can be locked"); answers the delta `{ success, pcId, locked }` (`game.rb:3821`, `3809`). A locked session admits nothing until a fresh `POST /login` (`session_identity`, `game.rb:3228`).
- A reload ends every claim and relay session on the next bootstrap (`end_claimed_sessions!`, `game.rb:3690-3700`).
- Client only: `sessionLockingSupported` shows the Lock button, only when the scenario has a sign-in PC (`gc:443`).
**Events.** `pc_signed_in`, `pc_signed_out` (see A4). Workstation events in A8.
**Validator.** A8 section and A4; `maxAttempts` lockout warning at each PC (`vs:8070`); owner who never leaves, so no claim is possible: warning (`vs:8061`).
**Shown in.** test_access_sessions (best demo), test_access_signin, demo_access_tour, lab_physical_pentest, test_access_work, test_access_habits.
**Known limits.** A claim at a PC with a guest or owner who never leaves is refused by design. Backlog: `docs/IDEAS_BACKLOG.md:271` records the autoLockMin 0 guest fix as done.
**Plan vs code.** README says nothing about `claim`, `lock_session` or `sessions`. Server returns 422 for refused claims, not a distinct "locked" text (generic by design).
**Unverified.** `pc-sessions.js` internals beyond the emit lines (listed under A4).

### A7 PC policies
**One line.** Named policies set how a sign-in PC locks and when it locks accounts out; a PC takes its own `policy` or the scenario `defaultPolicy`.
**Key fields.** top level `policies.<name>` (`autoLockMin`, `maxAttempts`; also `usb` (A10b), `social` (A11), `remote` and `remoteScreen` (N2), `accepts` (A15)), `defaultPolicy`; object `policy`.
**What the player sees.** After `maxAttempts` wrong passwords at a PC for one username, that account is locked out on that PC for the rest of the game ("This account is locked on this PC"). A PC under `autoLockMin: 0` always locks when its owner leaves, so there is no open screen to claim.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `autoLockMin` | policy | game minutes after the owner leaves before an open screen locks; `0` locks in the leave roll; `null` no auto lock (schema 269) | none |
| `maxAttempts` | policy | failed sign-ins per PC and username before a lockout; `null` no limit (schema 270) | none |
| `defaultPolicy` | top level | policy used by a PC with no `policy` (schema 280) | none |
| `policy` | object | named policy (schema 5523) | `defaultPolicy` |

Cross-reference: `usb`, `social`, `remote`, `remoteScreen`, `accepts` are documented by other sections (usb in A-work, remote in networks, accepts in keyring).
**Example.** `policies.corp` and `defaultPolicy` in the A1 to A8 worked example (section 5).
**Server enforces / client only.**
- Server: policy resolved as the PC's `policy`, else `defaultPolicy` (`effective_policy`, `game.rb:3345`).
- Server: failures counted per `pcId|username` (every account and every unknown name alike); at `maxAttempts` the key joins `loginLockouts`; a locked key is refused even with the right password; lockouts never expire (`record_login_failure!`, `game.rb:4318`). Non-account entries are capped at 200 (`game.rb` `MAX_NON_ACCOUNT_LOGIN_ENTRIES`).
- Server: `attemptsLeft` is returned in each failure; lockouts survive reload (`lockout_pcs_for_client`, `game.rb:3572`).
- Server: `autoLockMin: 0` blocks an owner claim and a guest claim (`game.rb:3541, 3607`).
- Client: `autoLockMin` and `lockAt` timing and lock events (A8). Policy is in the bootstrap (not secret).
**Events.** `workstation_auto_locked:<pcId>` (A8).
**Validator.** `defaultPolicy`/`policy` naming no entry: error (`vs:7769-7776`); policy `maxAttempts` at a sign-in PC: warning "a lockout lasts the mission" (`vs:8070`); `autoLockMin: 0` also errors in the work validator for a PC a workaround relies on (`scripts/validate_access_work.rb:1150`); PC under a policy with `social` blocked etc. belongs to other sections.
**Shown in.** `autoLockMin`: test_access_signin, test_access_sessions, demo_access_tour, test_access_habits, test_access_work, test_access_social. `maxAttempts` in policies: test_access_signin (best demo), test_access_sessions, demo_access_tour, test_access_networks, test_access_habits, test_access_work, test_access_social (other `maxAttempts` hits in m01, m06, ceo_exfil, cybok_heist, lab_* are password locks, a different field).
**Known limits.** Lockouts last the whole mission. Per-minute `autoLockMin` above 0 depends on the client clock (the needs clock). Policies are static; there is no runtime policy change.
**Plan vs code.** README:1210 lists `autoLockMin` as a field of the workstation object. It is a policy field; the object field is `autoLockSeconds` (schema 5518). README:1238 is right that it comes via `policy`/`defaultPolicy`.
**Unverified.** None: the `autoLockMin` > 0 `lockAt` path is `workstation-state.js:415` (see A8).

### A8 Workstation lock behaviour
**One line.** When a PC's owner leaves, the screen locks or stays open by a fixed order of rules; an open screen can be claimed (A6), a locked one shows a padlock.
**Key fields.** object: `workstation`, `owner`, `locksScreenOnLeave`, `lockChance`, `autoLockSeconds`; policy `autoLockMin`; npc `habits.screen` (`lockChance`, `lockIfAwayOverSeconds`), `habits.locksScreen`, `awareness`; sprite `pc_desktop`.
**What the player sees.** Staff walk away; some screens lock (padlock on `pc_desktop`, chime), some stay open. The player can claim an open screen, with the risk of the owner returning. An open screen can lock itself after a while.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `workstation` | object | marks a workstation (schema 5515); also implied by `locksScreenOnLeave`, `lockChance`, or `lockType: "login"` (`ai:145`, `workstation-state.js:109`) | false |
| `owner` | object | NPC id (or list, for private objects) owning the object | none |
| `locksScreenOnLeave` | object | `false` leaves it open on leaving (schema 5516) | true |
| `lockChance` | object | 0..1 chance per leave, seeded roll; wins over `locksScreenOnLeave` (schema 5517) | none |
| `autoLockSeconds` | object | idle lock of an open screen with its owner away (schema 5518) | none |
| `habits.screen.lockChance` / `lockIfAwayOverSeconds` | npc | the person's habit; read only if the object sets neither lock field (schema 4423) | none |
| `habits.locksScreen` | npc | `never`/`sometimes`/`always` fills `habits.screen` (chance 0, 0.5, 1) | from `awareness` |
| `awareness` | npc | `low`/`medium`/`high` preset for habits (schema 4414) | none |

**Who decides, in order** (`decideLocked`, `public/break_escape/js/systems/workstation-state.js:143-165`): (1) policy `autoLockMin: 0` locks; (2) the object's numeric `lockChance`; (3) the object's `locksScreenOnLeave`; (4) the owner's `habits.screen` (threshold first: a trip expected to last at most `lockIfAwayOverSeconds` stays open, else `lockChance`; a threshold alone locks); (5) nothing set: locks. After that, an owner the server has locked out at that PC always locks it, whatever the roll said (`_rollScreen`, `workstation-state.js:408`). An open screen then locks by itself at the policy's `lockAt` (leave time plus `autoLockMin` game minutes, `:415`) or after the object's `autoLockSeconds` idle (`:433-440`). The server mirrors steps 2 to 5 in `AccessIdentities.screen_always_locks?` (`ai:190`) and checks the policy separately (`game.rb:3541`).
**Example.** `lena_pc` (workstation, `lockChance`) in the A1 to A8 worked example (section 5). That example draws the lockChance 0.5 warning.
**Server enforces / client only.**
- Server: whether a claim is allowed (see A6) from the data, never from the client's globals, which are only logged (`game.rb:3513-3540`).
- Server: guests: a "careful guest" and `autoLockMin: 0` mean no guest session (`game.rb:3600-3610`).
- Client only: the owner's departure, the roll and the screen state; the padlock swap needs a `<key>_locked` texture (only `pc_desktop` has one today, README:1213).
**Events.** `workstation_screen_changed:<id>` `{ objectId, ownerId, locked, how }` (`workstation-state.js:205`); `workstation_auto_locked:<id>` `{ objectId, ownerId }` (`:479`; with `guest: true` for a guest session, `:312, :391`); `workstation_owner_left:<id>` `{ objectId, ownerId, screenLocked, reason }` (`:552`; `reason: 'guest'` at `:329`); `workstation_owner_returned:<id>` `{ objectId, ownerId, wasLocked }` (`:585`); `workstation_accessed:<id>` `{ objectId, ownerId, [guest] }` (`:623, :638`); `workstation_locked_attempt:<id>` `{ objectId, ownerId }` (`:633`).
**Validator.** Owner not a room NPC: error (`vs:8057`); `lockChance` strictly between 0 and 1 on a sign-in PC: warning (8063); owner not tracked by the needs system: warning (8068); owner nothing sends away: warning (8070-ish, `OwnerClaim.never_leaves?`); owner placed in a different room: warning (8106); `ValidateNpcNeeds`/`ValidateNpcHabits` handle habit rules (`vs:8806-8830`).
**Shown in.** `locksScreenOnLeave`: demo_access_tour, test_access_habits, test_npc_needs, test_capture_log. `lockChance`: demo_access_tour (best), test_access_habits, test_access_sessions, test_access_work, test_access_social, lab_physical_pentest, m03, m06, office_life_showcase, test_needs_sims, test_capture_log. `workstation` appears in many (also as an item type name in unrelated scenarios, so the count is inflated).
**Known limits.** One art base has a locked look. A policy-only lock (`autoLockMin: 0`) is read by the browser at step 1 but by the server's claim check separately.
**Plan vs code.** README:1238-1246 matches code. README:1246 "server readers read steps 2 to 5" matches `screen_always_locks?`. README:1210 mislabels `autoLockMin` (see A7).
**Unverified.** None for the client lock path (read in `workstation-state.js` on 2026-11-18); not live-tested.

### A9 Awareness presets and habits
**One line.** A room NPC gets an `awareness` level (low, medium, high) that fills habit defaults, and named `habits` that override them: lock the screen, write the password down, hold doors, password quality.
**Key fields.** `awareness` (npc), `habits.locksScreen`, `habits.writesDown`, `habits.password`, `habits.passwordPattern`, `habits.holdsDoors` (npc), `habits.screen`, `habits.print` (npc, office-life blocks), `roles.<role>.awareness` (top level).
**What the player sees.** A careless (low) person walks off from an open screen, so a session can be claimed. A careful (high) person always locks, and does not hold gate doors open for the player. A `writesDown` person has a sticky note with username and password on their own sign-in PC, read on its sign-in screen at the desk. `password` changes nothing at run time: it is a claim the validator checks against clues the player can read.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `awareness` | npc (room NPCs only) | `low`, `medium`, `high`; server-only (schema 4413) | none (role default, else no preset) |
| `roles.<role>.awareness` | top level | level for an NPC with that role and none of its own: first of its roles in order, implicit `staff` last (schema 376) | none |
| `habits.locksScreen` | npc | `never`, `sometimes`, `always` fills `habits.screen.lockChance` 0, 0.5, 1 when `habits.screen` is not authored; a PC's own `lockChance` or `locksScreenOnLeave` wins (schema 4418) | from preset |
| `habits.writesDown` | npc | `true`: owner's own sign-in PC shows a note; an authored `postitNote` or `showPostit:false` wins (schema 4419, 5314) | false, in no preset |
| `habits.password` | npc | `strong`, `guessable`, `reused`; validator claim only (schema 4420) | none |
| `habits.passwordPattern` | npc | object id that gives the pattern clue for `guessable` | none |
| `habits.holdsDoors` | npc | `false`: a gate that opens for this NPC will not open with the player near; loader writes the NPC into the gate's `noHold`. Not applied to a gate with `playerMayPassIf` or an authored `noHold` (schema 4421, 4195) | from preset |
| `habits.screen` | npc | `{ lockChance, lockIfAwayOverSeconds }`; sent to the browser (schema 4423) | none |
| `habits.print` | npc | `{ fetchAfterSeconds, forgetChance, weight, shareAfterSeconds }`; sent to the browser (schema 4424) | none |

Presets (`lib/break_escape/npc_habits.rb:32`): low = locksScreen never, holdsDoors true; medium = sometimes, true; high = always, false. `writesDown` and `password` are in no preset.

**Example.** In the A9 to A17 worked example (section 5):
```json
"awareness": "high",
"habits": { "writesDown": true, "locksScreen": "always", "password": "strong" }
```
**Server enforces / client only.**
- Server: the loader expands presets once into the saved scenario (`lib/break_escape/npc_habits.rb:127` `expand!`, called from `Game#prepare_scenario_data!`). `writesDown` note served by `GET /login_accounts` (`app/controllers/break_escape/games_controller.rb:1559`, `app/models/break_escape/game.rb:3385-3395`; a done `writes_down` workaround counts as well).
- Server: `awareness`, `habits.locksScreen/writesDown/password/passwordPattern/holdsDoors/usb` never reach the browser (schema `x-serverOnly`).
- Client: `habits.screen` is read by `public/break_escape/js/systems/workstation-state.js:124`; `habits.print` by npc-needs.js. `holdsDoors` result reaches the client only as the gate's `noHold` (`door-gates.js` normaliseGate, per `npc_habits.rb:288`).

**Events.** None of its own. The screen habit feeds `workstation_owner_returned:<pc>` and `<pc>_screen_locked` from workstation-state.js.
**Validator.** `scripts/validate_npc_habits.rb`, called at `scripts/validate_scenario.rb:8824`. Errors: `awareness`/`habits` on a non-room NPC (line 66-77), a level not low/medium/high (line ~100), unknown habit value (line ~120), `passwordPattern` naming no object. Warnings: locksScreen with no workstation or where every PC sets its own field (line ~150), `locksScreen sometimes` where a session at a sign-in PC rests on a seeded roll, holdsDoors false with no gate or every gate overriding it (line 183-190), `gate.noHold` not a list, with `playerMayPassIf`, or naming a non-`openFor` id (line 210-221), `writesDown` with no account / no owned sign-in PC / every PC authors its own note (line 237-244), password claims not backed (line 258-298). Also prints a habits report (`report_lines`).
**Shown in.** `test_access_habits` (best demo, all habits), `lab_physical_pentest` (awareness), `demo_access_tour` (writesDown, locksScreen, `habits.screen` with threshold), `test_access_social` (password), `office_life_showcase`, `test_needs_sims`, `m03_ghost_in_the_machine`, `m06_follow_the_money` (habits.screen/print only), `test_npc_needs`, `test_capture_log` (locksScreen text), `lab_social_engineering`. No scenario in `scenarios/` writes `holdsDoors` (grep, none): the gate side is untested in a shipped scenario.
**Known limits.** `password` has no run-time effect. `holdsDoors` is built (`npc_habits.rb:127`) but `docs/achitechture/ACCESS_MODEL_SLICE_9_1_CODE_REVIEW_R1.md:244` says "Step 5 (holdsDoors) ... not built": stale. No backlog entry found.
**Plan vs code.** The R1 review line above disagrees with `npc_habits.rb` (gates filled, `gate_entries`, `noHold`). README 202 documents `holdsDoors` correctly.
**Unverified.** Exact line numbers of validator messages marked with `~`. Client use of `noHold` in `door-gates.js` read from comment, not opened.

### A10 Work resources, frustration and workarounds
**One line.** Staff need resources for their work; when a resource is down or locked they get frustrated, show it, and work round the control in ways the player can exploit.
**Key fields.** `resources.<id>.{kind,name,access,offWhen,object}` (top level), `roles.<role>.{workNeeds,frustration,workarounds}` (top level), `workNeeds`, `frustration`, `workarounds` (npc), `needs.work`, `affordance.satisfies:"work"` (object), `chatter` pools (top level / npc).
**What the player sees.** A worker walks to its PC, works, and when a file share, printer or its own PC is off it mutters a line, shows a barrier icon, and loses patience. At set frustration levels it writes its password on a note, props a door open, borrows a hot desk, or tells a colleague its login aloud. The player can read or use each result.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `resources.<id>.kind/name/host/network/access/offWhen/object/contents/observations` | top level | `offWhen` is a global name or `{name:value}` map (down while it holds); `object` ties it to a room object; `access` is an access list; others belong to networks (schema 340-364) | access absent admits all |
| `roles.<r>.workNeeds` | top level | resource ids staff of the role need (schema 377) | none |
| `workNeeds` | npc | `"x"`/`"+x"` adds, `"-x"` removes (schema 4907) | roles' union |
| `frustration.perFail/easePerSuccess/breakDrain` | role, npc | 1-100 / 0-100 / 0-50 (schema 378, 4908; `access_work.rb:20`) | 25 / 10 / 10 |
| `workarounds[]` | role, npc | `{at 1-100, do, pc, with, door, prop, event, setGlobal, noWarning}`; `do` is `writes_down`, `prop_door`, `emit`, `borrow_session`, `share_login` (schema 379, 4909; `access_work.rb:25`) | none; npc list replaces role list |
| `phone`, `socialUse` | npc | see A11 | |

Failure causes: `down unreachable no_access off locked_out social_blocked usb_refused` (`access_work.rb:27`). Lockout and `usb_refused` are causes of failed work uses; lockout needs `policies.<p>.maxAttempts`, and the USB habit is `habits.usb` (A10b).

**Example.** Worked example for this group (section 5):
```json
"roles": { "staff": { "awareness": "medium", "workNeeds": ["drive"], "frustration": { "perFail": 30 } } },
"resources": { "drive": { "kind": "file_share", "name": "Team drive", "offWhen": "drive_down" } },
"workarounds": [ { "at": 60, "do": "writes_down" } ]
```
(NPC also needs `needs.work` with `decayPerMin` and `urgentAt`, and `needsHome` set to a PC carrying `affordance.satisfies:"work"`.)
**Server enforces / client only.**
- Server: frustration level, tell (0-2), pace by real time, `settled` at 100 (`app/models/break_escape/npc_frustration.rb:84` `report_npc_uses!`, `:840` `fail_too_soon?`, `:874` `frustration_tell`). Reports checked against the server's globals; max 20 reports, 64 KB (`games_controller.rb:1644`, `npc_frustration.rb:~25`).
- Server: a workaround's hand-over must stand a dwell before "done" (`npc_frustration.rb:43` `WORKAROUND_DWELL`; 403 for a hand-over never made, 425 too early: `games_controller.rb:1655`, `npc_frustration.rb:151`). Lockout cause only counts behind a recorded `check` (`npc_frustration.rb:~27`).
- Client only: the needs loop, icons and mutters (`public/break_escape/js/systems/npc-needs.js`), workaround runner (`npc-workarounds.js`). `workNeeds`, `frustration`, `workarounds` are not in the browser data; the room NPC carries a `work` plan of ids and kinds.

**Events.** `npc_use_failed:<npcId>` `{npcId, objectId, need, missing, station}` (npc-needs.js:3877); `npc_need_parked:<npcId>` (2023); `npc_checked:<objectId>` `{npcId, objectId, data}` (2649); `npc_frustration_changed:<npcId>` `{npcId, level, previous, tell}` (2742); `npc_workaround:<npcId>` `{npcId, index, do, phase}` with phase `started|done|dropped|ended` (npc-workarounds.js:131, 355, 386, 344).
**Validator.** `scripts/validate_access_work.rb` (check_work line 394, check_work_npc 508, check_workarounds 955, check_borrow 1130, check_share 1182, mutters 883, report 1297). Errors: field on non-room NPC (line ~404), global ending `_frustration` (417), resource `object` naming no room object (432), frustration out of range, workaround `at` out of 1-100, unknown `do`, undeclared `setGlobal`, missing `pc`/`prop`/`door`/`with` target. Warnings: `offWhen` global undeclared (437), missing mutter lines, e.g. "kim can fail for 'drive' going down, but no work_fail_file_share or work_fail line is in the scenario's chatter ...", `no wk_writes_down line`. The **work report** prints one `Work` line per NPC with a plan. Registered in `validate_scenario.rb:46`.
**Shown in.** `test_access_work` (best demo; all five workaround kinds, README names it the feature scenario), `test_access_social`, `lab_physical_pentest` (`prop_door`, `writes_down`), `demo_access_tour` (resources). `resources` is also used by `test_access_networks`, `test_access_devices`. `share_login` and `borrow_session` appear only in `test_access_work` and `test_access_social`.
**Known limits.** One lockout counts twice as a frustration cause for an NPC with work plus `"phone": false` social need: `docs/IDEAS_BACKLOG.md:235-236` (Q33 review m5). A tampered client can get a "fixed at last" post without a met use: `docs/IDEAS_BACKLOG.md:251`. Stepping the needs clock outruns the server pace (refused `tooSoon`).
**Plan vs code.** None found for field names. README 1252-1380 matches schema.
**Unverified.** Per-cause validator message wording beyond those quoted; `prop_door` and `share_login` validator rules read from README 1320-1321 only.

### A10b USB policy
**One line.** A policy's `usb` value makes a workstation (or an object naming that policy) refuse items by `usbClass`, for the player's plants and for NPC stick use.
**Key fields.** `policies.<p>.usb` (policy: `allowed`, `storage_blocked`, `blocked`), `usbClass` (item: `storage`, `hid`), `policy` (object), `defaultPolicy` (top level), `usb_refused` chatter pool.
**What the player sees.** Clicking a `requiresItem` object under a refusing policy shows "USB storage is disabled on this PC." (or "USB devices are disabled on this PC.") and the kit stays in the tray. An NPC refused a stick says "USB's disabled. Typical." and may route round it. `storage_blocked` still accepts an `hid` device (a keyboard-style implant).
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `policies.<p>.usb` | policy | `allowed`, `storage_blocked` (refuses storage), `blocked` (refuses storage and hid); governs only a workstation or an object naming a policy (schema 271) | `allowed` |
| `usbClass` | item | `storage` or `hid`; an item with none is never refused (schema 5676) | none |
| `policies.<p>.social` | policy | `allowed`/`blocked`, see A11 (schema 272) | |

**Example.** Worked example for this group (section 5): `"policies": { "corp": { "usb": "storage_blocked" } }`, item `"usbClass": "storage"`, dock object `"policy": "corp"` with `requiresItem`.
**Server enforces / client only.**
- Server: the implant/`grant_foothold` USB hook refuses a device with 422 `reason: usb_refused` (`app/models/break_escape/network_access.rb:507-512`); a plant the policy refuses is never recorded as a proof (`app/models/break_escape/capture_proofs.rb:~58`, via `AccessWork.plant_refused?`, `lib/break_escape/access_work.rb:1198`). NPC refusals are judged in the browser and confirmed in the `usb_refused` fail (npc_frustration.rb:646).
- Client only: the player's `requiresItem` plant refusal (`public/break_escape/js/systems/interactions.js:1046-1058` using `pc-policy.js` `plantRefusal`/`usbRefused` lines 44-78). The refusal toast is the only client enforcement for scenarios whose payoff is a plain `set_global`: the README says "the policy is as strong as the payoff it guards".

**Events.** `usb_refused:<objectId>` `{objectId, itemId, usbClass}` (interactions.js:1054); `npc_use_refused:<objectId>` `{npcId, objectId, itemId, tag, usbClass}` (npc-needs.js:3777); `network_device_refused` `{pcId, reason:'usb_refused'}` (network-links.js:485); `npc_usb_copied:<npcId>`, `npc_usb_refused:<npcId>` (npc-needs.js:3821, 3825) for the USB habit.
**USB habit (`habits.usb`, npc).** Every `every`th (1-10, default 2) judged work use copies a file to a stick the NPC holds (`usb` item, `usbClass` storage or none, id in `itemsHeld`). Under `storage_blocked`/`blocked` the use fails with cause `usb_refused`, and the first accepted refusal sets `setGlobal`. The stick is served only to a player who holds it. Room NPCs only (schema 4425). Validator: `check_usb_habit` 579, `check_usb_stick` 613, `check_usb_give_order` 682, `check_usb_ko_route` 699.
**Validator.** `check_usb` (`scripts/validate_access_work.rb:278`). Errors: `policies.<p>.usb is '<v>'; use one of ...`, `item '<id>' has usbClass '<v>'; use storage or hid.` Warnings: a blocking policy governing only objects whose items have no `usbClass` ("... the policy refuses nothing there"), an object no policy governs taking a device the default policy would refuse, an NPC that can be refused with no `usb_refused` line.
**Shown in.** `test_access_work` (best demo: three policies, line 59-71), `test_access_social` (also `habits.usb`), `test_access_networks`, `demo_access_tour`, `test_access_signin`, `test_access_sessions`, `test_access_habits` (policy `usb` values). `usbClass` items: `demo_access_tour`, `test_access_networks`, `test_access_social`, `test_access_work`.
**Known limits.** `defaultPolicy` does not reach non-workstations. A plant at a sign-in PC needs a separate object (a dock) because the PC's click handler returns first. No backlog entry.
**Plan vs code.** None found.
**Unverified.** `lab_physical_pentest` and `test_access_devices` do not set `usbClass` or `usb` (grep none), so no lab shows the refusal.

### A11 Social media feeds
**One line.** A room NPC with a `social_media` need posts to a `social.osint` profile one post per met use; posts and their facts are withheld until served, and NPCs can reply to and react to each other.
**Key fields.** `feed` (`site`, `person`, `order`, `posts[]`, `reacts[]`) (npc), `phone` (npc), `socialUse` (npc), `needs.social_media`, `policies.<p>.social`, item type `phone_friendface`, `social.osint.postToasts`.
**What the player sees.** An NPC checks social media at its PC, a break-room tablet or its phone, and a new post appears on that person's profile in the OSINT browser or on a Friendface phone the player holds, with a toast "<name> posted on <site>". A post may carry a fact (a pet name) usable for a guessable password. A blocked policy makes the NPC mutter and get frustrated. Posts can answer or react to colleagues' vents.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `feed.site`, `feed.person` | npc | a `social.osint` site and a profile on it | required |
| `feed.order` | npc | `facts_first`, `reactive_first`, `mixed` | `facts_first` |
| `feed.posts[]` | npc | `id`, `text`, `fact`, `date`, `note` (served); `deliberate`, `when`, `replyTo`, `replyToComplaint`, `complaint`, `insteadOf` (server-only except `replyTo`) (schema 4912) | |
| `feed.reacts[]` | npc | `{to or toComplaint, key like/laugh/sad/angry, alongside}` | |
| `phone` | npc | `false`: no phone (schema 4910) | true with a `social_media` need |
| `socialUse` | npc | `{useSeconds, restores}` (schema 4911) | 20 s, 60 |
| `policies.<p>.social` | policy | `allowed`/`blocked` | `allowed` |

**Example.** Fragment from `scenarios/test_access_social` (not run alone; the file is validator-clean as shipped):
```json
"feed": { "site": "friendface", "person": "jake", "posts": [
  { "id": "jake_post_1", "text": "Biscuit turns five today!", "fact": "jake_pet_name", "date": "Monday" } ] }
```
**Server enforces / client only.**
- Server: `POST /feed_post` `{npc_id, object_id}` (`games_controller.rb:1677`, `app/models/break_escape/social_feed.rb:51` `reveal_feed_post!`): NPC must be encountered, have a feed and a social need, next post only, pace floor (0.9 of the need period less 3 seconds, `lib/break_escape/access_work.rb:378-382`), source check `feed_source_ok?` (line 360): the phone only if `phone` is not false; otherwise one of the NPC's social media places, not its own station while the policy blocks social media or the station is off, and not a sign-in PC where the NPC is locked out. Feed facts are withheld from the bootstrap and sent with their post (`social_feed.rb:306` `withhold_feed_facts!`). Reload restores revealed posts (`feedRevealed` in player_state).
- Server: `POST /friendface_phone` opens an NPC's phone only if the player holds it (`games_controller.rb:~1695`, `social_feed.rb:281`).
- Client only: when to ask (`public/break_escape/js/systems/social-feed.js`), toast, icons, thread rendering (`osint-browser-minigame.js`).

**Events.** `npc_posted:<npcId>` `{npcId, postId, index, site, person}`, plus `replyTo`, `replyToNpc`, `replyToPerson`, `namedNpc`, `namedPerson` for replies (`public/break_escape/js/systems/social-feed.js:291`; documented at :13; listened in `friendface-phone.js:182`).
**Validator.** `scripts/validate_access_work.rb` `check_social` 1553, `check_social_need` 1668, `check_feed_order` 1713, `check_reactive_post` 1740, `check_replies` 2047, `check_reply` 2081, `check_reactions` 2311. Errors: feed whose site/person does not resolve, bare list instead of `{site,person,posts}`, post id missing or duplicate, fact naming no `intelFacts`, a feed fact named elsewhere, an NPC password in a post, a reply with no `when` or `insteadOf` or not exactly one of `replyTo`/`replyToComplaint`. Warnings: high-awareness poster with a `fact` and no `deliberate:true`, short post text, resource names in vents, blocking policy with no `social_blocked` line. `check_friendface_phones` at line 50. Full list: README 1414, 1431-1432 (not re-read line by line).
**Shown in.** `test_access_social` only (beats F1-F16, replies and reactions). Phone item `phone_friendface` appears only there. `ca14_social_media` is the awareness course, not this feature.
**Known limits.** Server-checked knock-outs for phone drops: `docs/IDEAS_BACKLOG.md:202`. Leak-scanner route-matching gaps: `:213`, `:215`. Open Q33 review items: `:235-236`, `:251`.
**Plan vs code.** README 1382-1450 matches the schema field list (`feed`, `phone`, `socialUse` at schema 4910-4912; defaults 20 s and 60 match).
**Unverified.** The `feedRevealed` reload behaviour beyond the model header (`social_feed.rb:9-20`) and `feed_posts_for_client` (`social_feed.rb:140`, sent as `feedPosts` by `games_controller.rb:469`); not live-tested.

### A12 Gated doors

**One line.** A door that opens by itself for named NPCs, holds open for a tailgate window, then shuts; the player gets through by following, by wearing the right disguise or by presenting the card.
**Key fields.** `rooms.<room>.doors[].gate` (`enabled`, `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, `noHold`, `creditOnPass`, `sound`), NPC `habits.holdsDoors` / `awareness`, eventMappings `closeDoor`, locked-room `requires`.

**What the player sees.** A locked north or south door that swings open when a listed guard walks up and shuts a couple of seconds after the guard has gone. Clicking it from outside gives "Access denied: this door only opens for authorised staff." (plus the room's `lockedHint`). If the gate's `playerMayPassIf` global is true (a worn disguise), or the player holds a card satisfying the room's `requires`, the gate opens for one `holdMs` window; a player inside the room always gets out with a click. A player outside who walks into an open gate that is solid for them gets the same refusal (the bump, at most every 4 s). A guard held at a gate for 5 s turns back and tries again on his next cycle.

**Fields.** (schema lines 4180-4213; defaults from `public/break_escape/js/systems/door-gates.js:122-137`)

| field | where | meaning | default |
|---|---|---|---|
| `gate` | room `doors[]` entry (the entry leading INTO the locked room) | the gate block | none |
| `gate.enabled` | gate | `false` turns a configured gate off | on |
| `gate.openFor` | gate | NPC id or array of ids whose approach opens it | none (no NPC opens it) |
| `gate.openRadius` | gate | px from door centre | 56 (`DEFAULT_GATE_RADIUS`, door-gates.js:93) |
| `gate.holdMs` | gate | ms open after the last NPC leaves; also the length of a player/exit window | 2500 (door-gates.js:94) |
| `gate.playerMayPassIf` | gate | a global; while false a player outside and within `openRadius` keeps it shut, and it shuts the moment nobody holds the doorway | none (player not barred by it) |
| `gate.noHold` | gate | written by the loader from the guards' `holdsDoors: false`; never on a gate with `playerMayPassIf`; an authored value wins | none |
| `gate.creditOnPass` | gate | `{ viaPass, viaCredential }`, each `{ setGlobal: {name: value}, completeTask }`; server-owned credit (see below) | none |
| `gate.sound` | gate | audio key, or `false` to silence | `rfid_unlock` if the door has an RFID lock, else silent |
| `doors[].connectedRoom`, `doors[].direction` | door entry | which doorway the entry matches (first match wins) | required in practice |
| `habits.holdsDoors` (via `awareness`: low/medium true, high false) | NPC | `false` makes the guard a "careful guard"; a gate whose every counted guard is careful bars the player like a false `playerMayPassIf` (`lib/break_escape/npc_habits.rb:25,33-35,275-279`; schema 4413, 4421) | true |
| `closeDoor` | NPC `eventMappings[]` | room id or array of room ids: shut the gate(s) into that room now, forced, and keep shut at least `max(holdMs, 3000)`; a gate stays open while the player or an NPC stands in its doorway (door-gates.js:880-881) (door-gates.js:862-890; npc-manager.js:1490,1875-1883; schema 4983-4989) | none |

**Example.** From the A12 to A15 worked example (section 5):
```json
"doors": [
  { "connectedRoom": "vault", "direction": "north",
    "gate": { "openFor": ["sam"], "openRadius": 56, "holdMs": 2500,
              "playerMayPassIf": "vest_on", "sound": false } }
]
```
and in the NPC `eventMappings` (validated on its own by adding it to `sam` in the A12 to A15 example): `{ "eventPattern": "global_variable_changed:vault_seen", "closeDoor": "vault" }`.

**Server enforces / client only.**
Server:
- Tailgating split: a gate "splits" when its `playerMayPassIf` is a server-owned global, or the scenario has any `rfid_cloner` object (`app/models/break_escape/game.rb:277-280`). For a split gate, an NPC-route unlock records the room in `player_state['npcRouteRooms']` instead of `unlockedRooms` (`games_controller.rb:1265-1272`; `game.rb:166-181`).
- Route rooms: the player may stand in one, but objects in it are refused with `room_not_reachable` (retryable, 403) until the room is earned (`games_controller.rb:1251-1258`; `game.rb:321-326`).
- Promotion: `viaPass` on the `currentRoom` sync when the gate's `playerMayPassIf` is server-owned and true (`game.rb:~490-510` `credit_via_pass_on_sync!`; `games_controller.rb:2702-2730`); `viaCredential` on an rfid/key door unlock when the server confirms the held card/key (`game.rb:519-540`, `games_controller.rb:1275-1281`). Both apply `creditOnPass` through `apply_credit_on_pass!` (`game.rb:449-468`): globals via `write_server_globals!` (read-only to `sync_state`), task via `complete_task!(trusted: true)`. A task named in `completeTask` is server-completed-only; a client completion is refused (`game.rb:5208`, `games_controller.rb:1944`).
- Stored games saved before this get a soft-lock migration (`game.rb:580-640`, `games_controller.rb:203`).
Client only:
- Everything else: opening for NPCs, hold timers, body blocking, bump, turn-back, exit click, sound (`public/break_escape/js/systems/door-gates.js`). The file says so itself: "A gate keeps a player out of a room; it does not keep a secret" (door-gates.js:86-87). Without a split, a tampered client can walk through.
- `holdsDoors` / `noHold` only change what the client door does.

**Events.** (all emitted on `window.eventDispatcher`)
- `door_gate_opened`, `door_gate_closed`, `door_gate_player_opened` (credential/clone presented), `door_gate_exit_opened` (player leaving): `{ roomId, connectedRoom, direction }` (door-gates.js:409-413 `_afterToggle`; names at 438, 523, 557, 642).
- `door_gate_denied`: `{ roomId, connectedRoom, direction, answerFollowUp? }` (`systems/doors.js:777-787`).
- `door_gate_guard_turned_back`: `{ roomId, connectedRoom, direction, x, y, npcId, beforeUse }` (door-gates.js:745, 760).

**Validator.**
- `check_access_model` (`scripts/validate_scenario.rb:7519`, gate part 7942-7990): warning when the entry has no/invalid `direction`, lists no matching connection, or is shadowed by an earlier entry for the same doorway ("so the engine never reads it"); error if the door or the target room has an `access` list ("gate doors open from requires alone"); warning for a gate on an east/west door ("Gates work on north and south doors only"); error when the gate is on the door OUT of the locked room ("Put the gate on the door that leads into the locked room"). Lock fields on a door entry are an error (7935-7941).
- `check_gated_door_credit` (6849, registered 8812): errors for a `creditOnPass` `setGlobal` not in `globalVariables`, a `completeTask` naming no task, a split gate whose `playerMayPassIf` is client-writable (6938), a split gated room with an rfid `access` ACL (6949), an `unlock_door` reward/action or NPC `unlockDoor` mapping that opens a split gated room by another route (7035, 7054); warnings for `creditOnPass` on a non-splitting gate (6955), a credited task that is not server-completed-only (7011), and a server-enforced lock code in a split room's readable text (7095).
- Soft-lock check for cards only an NPC carries: validate_scenario.rb:2320-2460 (warns "a lock requires rfid ..., which only an NPC carries, and every gate into ...").
- `closeDoor`: the schema says "Warns if the door is not a gate", but no validator check for it was found (grep of `scripts/` and `lib/` finds no `closeDoor`). The engine warns on the console only (door-gates.js:873).

**Shown in.** `scenarios/lab_physical_pentest` (best demo: Len's gate with `playerMayPassIf: courier_ready`, `creditOnPass`, `closeDoor: "secure_area"`, lines ~1837, 2127); `scenarios/test_gate_tailgate` (the focused fixture: `playerMayPassIf: visitor_pass`, `creditOnPass`, `closeDoor: "staff_room"`, lines 55, 116); `scenarios/test_access_habits` (gates for gary and sara to show `holdsDoors`/`noHold`, lines 1190, 1201); `scenarios/test_bark_bubbles` (plain gates for dana, lines 50-51). `demo_access_tour` and `test_access_doors` contain no gate (grep for `"gate"` hits only their generated `dungeon_graph.json`). m01-m10 use none (the m10 hit is an ink knot called "gate").

**Known limits.** North and south doors only. No server check without a split. Backlog: "server-checked tailgating through gated openFor doors" (`docs/IDEAS_BACKLOG.md:247`, now built; entry may be stale), and gate items at 217-224 (a gate emits its state on register; a player by the records door holds Len up).

**Plan vs code.**
- `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` is the intent; the build log records drift. The code matches the README gate table in the fields I checked (README 165-206), but I did not compare every row.
- The schema `closeDoor` description promises a validator warning that does not exist (schema 4989 vs no match in `scripts/`).

**Unverified.** The server `enter_room` validation (build log Chunk F, "section 8") was not read; I did not open `games_controller` beyond the lines cited. The `exit` window is client-only behaviour (no scenario field); I read it from the door-gates.js header and `exitOpen` (553-580) but did not live-test it.

### A13 Wearables and disguises

**One line.** A takeable item the player puts on from the tray to swap their sprite and set a server-owned "worn" global, which gates can read.
**Key fields.** item `wearable` (`costume`, `global`, `unseenOnly`, `seenBy.ignore`, `confirmOn`, `confirmOff`, `onWear`, `onRemove`), top-level `disguises`, actions `set_costume`, `clear_costume`, `wear`, `take_off`, global `pp_disguise`.

**What the player sees.** Picking up the item the first time asks "Put it on now?". After that, clicking it in the tray offers Put on / Take off (with optional confirm text). Worn, the avatar changes sprite, the tray slot gets a frame and a "(worn)" label, and only one item is worn at a time. With `unseenOnly` the change (and a drop) is refused while a visible person NPC in the room could see, and the player is told who is watching.

**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `wearable` | item | the block; needs `costume` and `global` (schema 5658-5675, required both) | none |
| `wearable.costume` | item | key of top-level `disguises` | required |
| `wearable.global` | item | the worn global, true while worn; declare `false` in `globalVariables` | required |
| `wearable.unseenOnly` | item | refuse a change/drop while a person NPC in the room can see (client only) | false |
| `wearable.seenBy.ignore` | item | NPC ids that never count (needs `unseenOnly`) | [] |
| `wearable.confirmOn` / `confirmOff` | item | confirm text before wearing/removing from the tray | none |
| `wearable.onWear` / `onRemove` | item | client action lists after it goes on / comes off | [] |
| `disguises` | top level | open map: costume id to `{ sprite (required), talk? }` (schema 229-240) | none |
| `set_costume` | action | `{ "type": "set_costume", "costume": "<id>" }` (also reads `id`/`value`); writes `pp_disguise` (apply-actions.js:335-342; costume-actions.js) | n/a |
| `clear_costume` | action | restores the chosen avatar, `pp_disguise = ""` (apply-actions.js:360) | n/a |
| `wear` / `take_off` | action | `{ itemId }` (wear needs one; take_off optional) (apply-actions.js:108-109) | n/a |

**Example.** In the worked example for this group (section 5) (the `vest` object and the `disguises` block):
```json
"disguises": { "courier": { "sprite": "courier_hivis" } },
"globalVariables": { "vest_on": false, "pp_disguise": "" }
...
{ "type": "aes_hivis_hook", "id": "vest", "name": "Hi-vis vest", "sprite": "aes_hivis_hook1",
  "position": { "x": 2, "y": 2 }, "takeable": true, "observations": "A hi-vis vest.",
  "wearable": { "costume": "courier", "global": "vest_on", "unseenOnly": true, "seenBy": { "ignore": ["sam"] } } }
```

**Server enforces / client only.**
Server:
- `POST /games/:id/wear` (`config/routes.rb:44`, `games_controller.rb:1738-1749`, `app/models/break_escape/wearables.rb:55-90`): item must be in the server inventory, have a usable `wearable`, and name a costume in `disguises`; one worn at a time (`player_state['worn']`); writes the worn global and `pp_disguise` itself.
- Worn globals and `pp_disguise` are read-only to `sync_state` (`wearables.rb:38-42`; `game.rb:187-190`); the item comes off when it leaves the inventory or is dropped (`wearables.rb:93-112`). `wearable` is a forgeable item field, stripped from client-built items (`lib/break_escape/item_identity.rb:30-33`).
Client only:
- `unseenOnly` / `seenBy`: not read by the server (`WearableModel.spec` keeps them, but `wear!` never checks them; `wearables.rb`), so a tampered client can wear in sight. The README/schema do not say this plainly.
- Confirm texts, `onWear`/`onRemove`, the avatar swap, the tray frame (`public/break_escape/js/systems/wearables.js`, `costume-actions.js`).
- `set_costume`/`clear_costume` write `pp_disguise` from the client; when a scenario has any wearable, `pp_disguise` is server-owned and the client write is ignored (wearables.rb:38-42).

**Events.** `wearable_put_on`, `wearable_taken_off`, `wearable_refused`: `{ itemId, costume, global }` (wearables.js:224, 259, 294, 317, emit helper 413). The worn global also fires `global_variable_changed:<global>`.

**Validator.** `scripts/validate_wearable.rb` `check_wearables` (line 44), errors: `wearable` not an object (64), missing `costume`/`global` (69), item without an `id` (74), `costume` not a key of `disguises` (79), `global` not in `globalVariables` (82), one global shared by two item ids (90), `unseenOnly` not boolean (98), `seenBy` not `{ ignore: [...] }` (103), `seenBy.ignore` naming no room NPC (105), confirm text not a string (110), `onWear`/`onRemove` not arrays (113), any `set_global`, `setGlobal` or ink assignment writing a worn global (127, 131), `wear`/`take_off` with no or unknown item (145-152). Warnings: global should start false (84), unrecognised keys (96), `seenBy` without `unseenOnly` (107), `triggerOnInteract` on a wearable never runs from the tray (116), `set_costume`/`clear_costume` in a scenario that has wearables (139).

**Shown in.** `scenarios/test_wearable` (best demo: signs W1-W8), `scenarios/lab_physical_pentest` (courier hi-vis, `courier_ready`), `scenarios/test_gate_tailgate` (visitor pass), `scenarios/test_npc_needs` (only `set_costume`/`clear_costume` on costume racks, lines ~79-93, no wearable), `scenarios/test_bark_bubbles` (has `disguises`).

**Known limits.** Server does not enforce `unseenOnly`. Backlog: "A disguise wearable from the tray" (`docs/IDEAS_BACKLOG.md:221`); wearable code review R1 open item (`docs/IDEAS_BACKLOG.md:230`).

**Plan vs code.** README 189-200 describes the block and matches the schema fields; README does not say `unseenOnly` is client-side only, and does not mention `pp_disguise` becoming server-owned when any wearable exists.

**Unverified.** Whether `confirmOn`/`confirmOff` text shows on the first-take offer (wearables.js `offerAfterTake` was not read). README 189-200 only skimmed.

### A14 Declared grants

**One line.** A `give_item` with an identified item, run from a timer or an interaction, is on the server's allowlist, so the player can legitimately claim it by POST inventory.
**Key fields.** action `give_item` with `item.id` (or `opens_lock`), on `timers[].actions[]`, `triggerOnInteract[]`, `onInteract.actions[]`, `completionActions[]`, `conditionalActions[].actions[]`, `onConfirm[]`.

**What the player sees.** The item appears in the tray when the action runs. Nothing differs from before; the change is that the server now accepts the claim and keeps the item's contents on the server until it is held.

**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `give_item.item.type` | action item | required string | none |
| `give_item.item.id` / `opens_lock` (legacy `key_id`, `keyId`) | action item | the identity that makes it a declared grant | none |
| `give_item.item.contents` | action item | stripped from the shipped scenario, `hasContents: true` set, served from the held grant (`lib/break_escape/declared_grants.rb:73-82`) | n/a |

Not grants: `flagRewards`, `startItemsInInventory` (declared_grants.rb:35), `eventMappings` (never run, `:37`), the `notepad` type and decor cups (`:33-34`).

**Example.** The `bell` object In the worked example for this group (section 5):
```json
"triggerOnInteract": [ { "type": "give_item",
  "item": { "type": "text_file", "id": "welcome_memo", "name": "Welcome memo",
            "takeable": true, "readable": true, "text": "Welcome.", "observations": "A memo." } } ]
```

**Server enforces / client only.**
Server:
- POST inventory: `check_give_item_collectible` flow in `games_controller.rb`: after start items, if there is no source NPC and the item is addressed by a declared grant (`ItemIdentity.addressed_by?`), it is accepted with location `grant` (`games_controller.rb:3340-3356`). The claim is not tied to the trigger: "a declared grant can be claimed at any time" (`:3345`).
- Grant contents are stripped from room payloads and served only to the holder (`game.rb:1909, 2490, 4946-4963`; `games_controller.rb:2870, 2970, 3025, 3278`).
- `client_forged?` items (marked `clientAdded`) are never honoured (`item_identity.rb:42-48`); `credential` and `wearable` are forgeable fields stripped from client-built items (`:30-33`); a stored item's `credential` is restamped from the scenario's definition (`game.rb:749-775`).
Client only:
- The trigger and any `condition` on the action (README 899: only the page evaluates it).

**Events.** None specific to grants. The tray add uses the normal item events.

**Validator.** `check_give_item_collectible` (`scripts/validate_scenario.rb:2778`, registered 8793): error when a `give_item` item cannot be told from a room item ("shares its type and id with ...", 2894; same type and name as an id-less item, 2898; "still has its hidden twin in ...", 2891); errors for a grant with contents but no `hasContents`/empty contents (2855), a contents entry with no type (2860), a locked content with no `requires` (2864) or no `id` (2867), content ids colliding with a room object (2870), two grants with the same identity but different fields (2879) or same type and name, different ids (2881); a `give_item` that is not a valid grant is reported at 2831; warning when a grant is a key or lock tool, claimable from second one (2904: "A declared grant can be claimed from the first second of the game (no trigger check)"). `DeclaredGrants.unexecuted` flags identified `give_item` under `eventMappings`.

**Shown in.** Most scenarios with timers or interaction rewards; the example is built on the pattern. Focused demos: `scenarios/test_capture_log` (identified `give_item` on `timers`) and `scenarios/test_gate_tailgate` (`triggerOnInteract`, line 156); `lab_physical_pentest` and `lab_social_engineering` also use them. `test_access_keyring` has no `give_item`: its `lena_rdp_gift` is an NPC `itemsHeld` gift, which is the pattern the validator asks for in place of a grant (`credential_model.rb:229-263` reads declared grants to warn about that).

**Known limits.** No trigger check, so a grant is claimable from the start by a tampered client. Mitigation by design: give secrets through NPC `itemsHeld` and ink `#give_item`, not grants (README 1580; validator warns).

**Plan vs code.** `docs/achitechture/DECLARED_GRANTS_PLAN.md` not re-read in full. README 903 describes the feature; behaviour of "no trigger check" matches the code comment at `games_controller.rb:3345`. Item identity doc comment on `key_id` fallbacks says the validator errors on `key_id` (`item_identity.rb:13-17`); not re-verified here.

**Unverified.** Exact runtime result for a name-only claim of a granted item; the full list of scenarios using `give_item`.

### A15 Credential keyring

**One line.** A server-only registry of credentials (passwords, saved connections, assist invites, timed tokens) that the player earns by proof and uses to sign in at a PC without typing a password.
**Key fields.** top-level `credentials`, item `credential`, `policies.<name>.accepts`, `policies.<name>.remoteScreen`, credential `expiresMin`, `endsOnGlobal`, `connectsTo`, `foundIn`, `proof`.

**What the player sees.** A Sign-ins list in the capture log (`minigames/capture-log/signin-rows.js`) showing each earned credential (captured passwords included) with how it was gained. At a PC's sign-in screen the matching saved connection, invite or token appears as a button; a typed-NLA PC (`remoteScreen: "typed"`) shows no account tiles until a password is right. A held item that proves a saved connection or invite offers Connect in the tray. Tokens count down and then stop working.

**Fields.** (schema 281-317; model `lib/break_escape/credential_model.rb`)

| field | where | meaning | default |
|---|---|---|---|
| `credentials` | top level, server-only | map id to entry; id pattern `^[a-z][a-z0-9_]{0,63}$`; at most 64, server reads the first 64 by sorted id (`credential_model.rb:51-53,90-98`) | none |
| `kind` | entry | `password`, `saved_connection`, `assist_invite`, `token`, `hash` built (hash: A21) | required |
| `account` | entry | NPC id of an account holder | required |
| `proof` | entry | exactly one of `session` (a sign-in PC id), `planted` (+ optional `on`), `dropped`, `held` (an item id), `foothold` (`credential_model.rb:49`) | required |
| `connectsTo` | entry | sign-in PC a connecting kind opens; required for saved_connection/assist_invite/token, forbidden on password | none |
| `foundIn` | entry | password only, required: the item whose text holds it | none |
| `endsOnGlobal` | entry | assist_invite only, optional: once the global is true the invite ends | none |
| `label` | entry | token: required name (max 40; over 32 gets a narrow-screen warning) | none |
| `expiresMin` | entry | token: required integer 1-240 minutes from when its proof foothold is first gained (server clock) | none |
| `credential` | item | registry id this item carries; the item must be a tray type that is not notes-family/always-allowed (use `text_file`) (schema 5157) | none |
| `accepts` | policy | credential kinds a PC takes; `password` is always accepted | `["password","saved_connection","assist_invite","token"]` (`DEFAULT_ACCEPTS`) |
| `remoteScreen` | policy | `tiles` (PC's own account tiles) or `typed` (none until a password is right); never affects the keyboard screen | `tiles` |

Routes a kind may sign in by (`credential_model.rb:28-33`): `saved_connection` via `foothold` or `from`; `assist_invite` via `relay`; `token` via its own proof foothold. Saved connections honour lockouts; invites and tokens do not.

**Example.** From the worked example for this group (section 5) (note the schema closes each entry; `_`-prefixed keys are notes):
```json
"policies": { "corp": { "accepts": ["password", "saved_connection"], "remoteScreen": "typed" } },
"defaultPolicy": "corp",
"credentials": {
  "sam_rdp": { "kind": "saved_connection", "account": "sam", "connectsTo": "desk",
               "label": "Desk.rdp", "proof": { "held": "sam_rdp_file" } }
}
...
{ "type": "text_file", "id": "sam_rdp_file", "name": "Desk.rdp", "credential": "sam_rdp",
  "position": { "x": 3, "y": 5 }, "takeable": true, "observations": "A saved connection." }
```
Validated with the whole scenario (0 errors; 1 warning that no foothold reaches `desk`).

**Server enforces / client only.**
Server:
- Registry never leaves the server; `GET /games/:id/keyring?pc_id=&foothold=&from=&relay=&rev=` returns earned entries only, `Cache-Control: no-store`, with a short `rev` digest and `unchanged` answers (`config/routes.rb:60`, `games_controller.rb:1821-1860`; `app/models/break_escape/credential_keyring.rb:74-87, 270-345`). A `from` param is only answered in a scenario that declares credentials, otherwise 400 (`games_controller.rb:1832-1834`).
- Proofs read server state only (`credential_keyring.rb:21-35`); `held` is identity-strict and rejects client-forged items (`:42-65`). `credential` on an item is restamped from the scenario definition and any client value dropped (`game.rb:749-775`).
- Credential sign-in `attempt_credential_login!` (`app/models/break_escape/credential_login.rb:23-95`): PC exists; held proven connecting credential (otherwise the same generic refusal, so the registry cannot be probed); its own PC only; route the kind allows plus reach/power/remote-block; policy accepts the kind; ACL admits the account; lockout (saved_connection); invite ended; token expired; then writes the session.
- Token clock starts when the proof foothold is first gained (`credential_keyring.rb:~150-195`); tokens expire server-side (login answers `expired`).
- Lock a credential session (K-lock, built): `Game#session_lockable?` allows password sign-ins and `via: "credential"` sessions with `foothold` or `from`, never relay (`game.rb:3809-3835`; build log `CREDENTIAL_KEYRING_BUILD_LOG.md:1487`).
Client only:
- The keyring client `public/break_escape/js/systems/keyring.js` (header 1-38): caches `GET /keyring` answers per PC and route with `rev`, the find toasts, Connect from the tray, the capture log's Sign-ins list. It asks the server only when the scenario declares credentials (`credentialsDeclared`).

**Events.** `keyring_changed` `{ rev }` when the no-screen answer changes (`keyring.js:790`). A credential sign-in raises `pc_signed_in` with `via: "credential"` (`pc-sessions.js:623`); a refused one `pc_signin_failed` with `credential` (`:602`).

**Validator.** `check_credentials` (`scripts/validate_scenario.rb:7181`, registered after check_access_model): errors: more than 64 entries; id outside the pattern; policy `accepts` naming an unknown kind; unknown kind; "not supported until phase 3" for an unbuilt kind (none now; `hash` is built, see A21); token without `label`, with bad `expiresMin` or a non-foothold proof; account is not an account holder; password with `connectsTo` or without `foundIn`; `foundIn`/`endsOnGlobal` on the wrong kind; `endsOnGlobal` not a declared global; proof not exactly one of the five; `session` PC not a sign-in PC; `held` item not in the held scope, never obtainable, notes-family or always-allowed type; foothold proof naming no foothold any jack/AP/implant can create. Warnings: `accepts` without `password`; `accepts` used by no PC; item does not carry the credential; assist_invite code as a declared grant (give from `itemsHeld` through ink `#give_item`); saved_connection placed only by a declared grant; bare foothold id (must be `jack_<id>`, `wifi_<network>`, `implant_<pc>`); `connectsTo` ACL does not admit the account; token PC policy lacks `token`; no link path from foothold network; label over 32 characters. Info: tokens must not be the only route; a lockout is permanent for a saved connection.

**Shown in.** `scenarios/test_access_keyring` (best demo, has `PLAYTEST.md`; saved connection, password, assist invite, foothold-proof cookie, `expiresMin`), `scenarios/demo_access_tour` (uses `credentials`). No other scenario declares `credentials` or an item `credential`; the `"kind": "credential"` in `test_access_networks`, `test_access_devices`, `lab_physical_pentest` and `test_capture_log` is a capture kind (A16), not the keyring.

**Known limits.** Machine accounts are phase 3, not built (`hash` is built: A21). No per-entry teaching text override (backlog per plan R4: see `docs/IDEAS_BACKLOG.md`, no entry found by my grep of "keyring"/"credential" that is specific; no backlog entry confirmed). A saved connection is refused for the rest of the game once its PC locks out.

**Plan vs code.** `CREDENTIAL_KEYRING_PLAN.md:175` shows `token` as not built until K5; code has it built (`credential_model.rb:32`). Plan 8.6 K-lock is built (build log 1487; `game.rb:3809`). The schema description says "Phase 1 builds password, saved_connection, assist_invite and token (K5)", which matches code.

**Unverified.** Client keyring rendering (rows and buttons); README 1594 onwards not compared line by line.

### A16 Capture proof
**One line.** An account holder names facts the server records itself (a device planted, an item dropped, a sign-in made); only once one holds does `GET /capture_secrets` serve the captured password.
**Key fields.** `captureProof[]` (npc with `creds`), `addCapture.proof` (npc event mapping shorthand), `social.captures.revealSecret`, `addCapture.secret`.
**What the player sees.** Planting the keylogger and waiting for a typed password adds a Sign-ins row in the capture log. If the player never planted the device, the password is not served even if a forged capture row is written.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| `captureProof` | npc | list of one or more proofs; any one holding is enough (schema 4954) | none |
| proof `{planted, on?}` | proof | server saw the item leave the inventory at that object, or a hide of a `hideable` item (no `on`), or `on` a jack a foothold came from | |
| proof `{dropped}` | proof | server accepted a player drop of that item (must be `droppable`) | |
| proof `{session}` | proof | someone signed in at that sign-in PC | |
| `addCapture.proof` | npc mapping | shorthand, counted for the account whose username equals `address`, else the carrying NPC (schema 5127) | |
| `social.captures.revealSecret` | social | server serves the secret only when `true` (schema 485) | false |

**Example.** In the worked example for this group (section 5): `"captureProof": [ { "planted": "kit_stick", "on": "dock" } ]`. Shorthand on an NPC event mapping (README 1236 and 1261-1266), validated on `kim` in the A9 to A17 example: `"addCapture": { "targetId": "kim", "kind": "credential", "address": "kim", "host": "KIM-PC", "proof": { "planted": "kit_stick", "on": "dock" } }`, with `social.captures.revealSecret: true` (without it the validator warns that the password never shows).
**Server enforces / client only.**
- Server: all of it. `capture_proof_holds?` reads `plantedItems`, `gainedFootholds`, `droppedItems`, `signedInPcs` (`app/models/break_escape/capture_proofs.rb:166-181`); strict rule when any proof is declared and the password opens something (`:210-222` `account_capture_served?`); route `GET /capture_secrets` (`config/routes.rb:59`, `games_controller.rb:1810`, `game.rb:2532` `capture_secrets_for_client`). Plants recorded only for a held, non-forged item, an object that takes and consumes it, a USB policy that accepts it, and an unlocked room (`capture_proofs.rb:26-58`). A hideable item is planted only through `hide_device!` (`:79`).
- Client only: the capture log display (`public/break_escape/js/minigames/capture-log/`).

**Events.** None specific.
**Validator.** `scripts/validate_capture_log.rb` (called at `validate_scenario.rb:8815`). Errors: two routes writing the same `targetId` (line 30); `proof` on an `add_capture` action ("put it on the account holder as captureProof", 77); a shorthand resolving to no account holder (91); a proof of unknown shape (161); `planted` naming no item (172) or no object taking it (180, 207); `dropped` naming a non-`droppable` item (216); `session` naming no sign-in PC (221); `captureProof` on an NPC with no account (241); empty list (246); a scenario that declares proofs where an account that opens something has none (297). Warnings: session proof also holding for another account (230); object asks for the item by type or name (201); capture writes a non-password secret (269); proof set but password opens nothing (280); capture route and password with no proof where none is declared (300).
**Shown in.** `lab_physical_pentest` (best demo), `test_access_devices`, `test_access_networks`, `test_access_keyring`, `test_capture_log`, `test_secret_leaks`; `demo_access_tour` uses `proof`.
**Known limits.** A reload keeps the proof (server state); taking a planted device back does not undo it. No backlog entry found.
**Plan vs code.** None found.
**Unverified.** `docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` section 6 not re-read.

### A17 Item plants, hiding spots and holder items
**One line.** A `requiresItem` object takes a kit item the player carries; a `hideable` item can be tucked into any plant in listed rooms; a holder item (`holds`) files captured sessions and findings out of the tray.
**Key fields.** `requiresItem`, `consumesItem`, `requiresItemHint`, `requiresItemHintVariants`, `requiresItemCondition`, `requiresItemConditionHint(Variants)` (object); `hideable` (item); `hiddenWith`, `hidingSpot`, `hideAt` (object); `holds`, `storeIn` (item); `linkStoreIn` (jack).
**What the player sees.** Clicking a prepared object without the kit gets a hint toast; with it, the kit is clipped on and the object's actions run. With a `hideable` item held, every eligible plant in the listed rooms becomes tappable, with a confirm, and an overlay is drawn on the plant. The capture log shows Sign-ins, Captures, Sessions and Findings.
**Fields.** Full tables: `README_scenario_design.md` 905-1003 (plants, hideable) and 1154-1182 (holders); schema at `scripts/scenario-schema.json:5676-5700` (`usbClass`, `holds`, `storeIn`, `hideable`). Not repeated here.
**Example.** Dock object and holder item In the worked example for this group (section 5) (`requiresItem`/`consumesItem`, `capture_log` with `holds`). A hideable fragment is README 980-990 (`kit_rogue_ap`), not run alone.
**Server enforces / client only.**
- Server: plant record `record_planted_item!` (`capture_proofs.rb:26`), called from `POST /inventory` with `used_on` (`games_controller.rb:1423-1424`); hide `hide_device!` (`capture_proofs.rb:79`, called at `games_controller.rb:1432`) refuses not-a-spot, not-hideable, already hidden, not held, locked room, occupied spot (`HIDE_MESSAGES`, line ~65); eligibility rules in `lib/break_escape/hiding_spots.rb`.
- Client only: `requiresItem` check, hints and `requiresItemCondition` (`interactions.js:1035-1070`), overlays and confirm (`public/break_escape/js/systems/plant-hiding.js`), holder filing (`minigames/capture-log/capture-log-model.js:44-92`). A filed item is still in inventory; only the tray slot is hidden.

**Events.** `device_hidden` `{itemId, spotId, roomId, deviceId}` (plant-hiding.js:504); `network_device_planted` (network-links.js:458); `usb_refused:<objectId>` (A10b).
**Validator.** `scripts/validate_plant_hiding.rb` (`check_plant_hiding`, line 47; called at `validate_scenario.rb:8818`) and `scripts/validate_capture_log.rb` (storeIn checks 316-346); `requiresItem*` checks near `validate_scenario.rb:6566-6600`. Messages: README 986-1003 and 1180-1182.
**Shown in.** `lab_physical_pentest` (best demo: hideable + storeIn + proof), `demo_access_tour` (hideable, requiresItem), `test_access_devices` (hideable), `test_capture_log` (holds, storeIn), `test_access_keyring` (holds), `test_access_networks`, `test_remove_item`, `test_access_work` (requiresItem).
**Known limits.** An item plant cannot sit on a sign-in PC (README 957). No backlog entry searched beyond the `Friendface`/`feed` hits.
**Plan vs code.** None found.
**Unverified.** `hiding_spots.rb` rules and validator messages for hideable read from README, not the Ruby.


### A18 Privilege on a session
**One line.** Every session the player holds on a sign-in PC has a level, `user` or `admin`, worked out by the server on each read (nothing new is stored and no route is added). An admin session opens the profiles of the PC's owner and lets a USB device through that the PC's policy would refuse.
**Key fields.** On an NPC with `creds`: `admin: true` (boolean; the literal `true`, so `"true"` or `1` is a user account and the schema refuses them). The rest are existing fields: the PC's `owner`, top-level `accountProfiles`, the PC's `usb` policy (A10b), an item's `usbClass`, `needs.session` and `grants.session.access` (N15).
**How a session gets its level** (`session_access`, `game.rb:3300`). No level (nil, so no `access` is sent and nothing below applies) when there is no session, the session is locked, an expired token, its account is gone, or its route is down (the PC is switched off, its foothold is unplugged, an outage or a `from` check fails). Otherwise: a relay session (an assist invite's shared screen) and a claim (the owner's or a guest's left-open desktop) are `user`; a technique session is `admin` only when its stored `access` is exactly `admin`, whatever its account's `creds`; a typed or keyring sign-in is `admin` when the account has `creds.admin: true` and the PC's `access` list admits it (`account_admin_at?`, `game.rb:3323`), else `user`. A stored `access` on any other kind of record is ignored. A later password sign-in replaces a technique admin record and takes the account's own level. `creds.admin` never leaves the server (`creds` is in `WITHHELD_NPC_KEYS`, `game.rb:7680`); the browser gets only `access: "admin"`, and only on the sign-in answer, the session mirror entry and the network host row, never for a user, locked, expired, off or route-down session.
**What an admin session can do at a PC.**
- *Open the owner's profiles.* A PC with an `owner` shows, on an admin session's desktop, the contents of each profile in `accountProfiles` whose `for` list admits that owner (after the profiles the account itself has), and the folders inside them open (`admin_profiles_at`, `game.rb:3455`; the one seam is `admin_present_accounts`, owner only). Only that PC's owner counts: never another PC's owner, never every profile, never through an admin session at a different PC, and a PC with no owner adds nothing. The same reach applies to taking an item from such a profile and to unlock paths that ask `session_admits?` (`game.rb:3350`). The first admin read of a folder in a profile writes one `ADMIN_READ` log row (below).
- *Override the USB policy for a device that goes in at the keyboard.* An unlocked admin session at the PC's own keyboard (no foothold, not a relay or `from` session: `keyboard_admin?`, `game.rb:3333`) lets a device the PC's `usb` policy refuses be implanted (`network_access.rb:525-538`). A locked admin session takes an implant the policy allows, as before, and never overrides. A plant proof (`capture_proofs.rb`, `plant_admin?`) is judged at the object's own sign-in PC, or, for an object with a `needsSession` grant, at the PC that grant names and only by a keyboard admin session there.
- *Be shown.* The taskbar carries an "Administrator" marker beside the account name while the mirror entry says `access: "admin"` and is not locked (`pc-taskbar.js:55`, `:247`). The mirror drops `access` when the session locks and when a desktop answer says the PC is off or not responding, and takes it from each new desktop answer (`pc-sessions.js`).
**The USB override: limits.**
- *Keyboard only for a device that needs someone signed in.* A BadUSB socket (`grant_foothold` with `needsSession`) still takes only a session at that PC's own keyboard. A foothold, relay, `from` or technique session there now answers `422 needs_console` with "Nobody is signed in at this keyboard.", shown as a toast (`network_device_refused` with `reason: "needs_console"`, no retry, `network-links.js:498`); the device stays in the tray. `needs_console` is sent only where the player already holds a live session (`session_access` is not nil); a locked or expired remote session, no session and no device keep the quiet `not_ready` (`network_access.rb:507-511`).
- *The `remove` check is stricter for everyone.* `POST /inventory` `remove` with `used_on` asks `plant_policy_refusal` first (`capture_proofs.rb:52`, called at `games_controller.rb:1457`). A stick the PC's policy refuses, for a player with no live override, answers `422 { success: false, reason: "usb_refused", error: <the policy's line> }`; nothing is removed or recorded and the item stays. So a lapsed override (a token session past expiry, an unplugged foothold, an outage) refuses the plant even when the client still showed admin. It answers nil (no probe) for a hideable item, an item not held, an object that does not take it and an object in a locked room. The client waits for the server's answer before it spends a stick on a USB-governed object (`apply-actions.js`, `sendGatedRemove`) and shows the server's line.
- *Owner only until S5b.* The profile reach is the owner and nothing else; cached accounts are a later stage and are not built.
- ***No validator-clean scenario can plant a policy-refused storage stick under admin today (open with the owner, O3).*** The override is judged at a sign-in PC or at the PC a socket's session grant names. A sign-in PC cannot take a stick (the validator refuses `triggerOnInteract` on it), and the PC's one session socket belongs to the keystroke device, so a governed stick port names no PC that could judge it. The server and client code for it is covered by Rails and node tests only, and `scenarios/test_ops_privilege/PLAYTEST.md` has no browser beat for it. What an author can build is the BadUSB case: a device that needs a session, plugged in at the keyboard of a PC whose policy refuses it, by an admin.
- *A relay session never feeds a step up to admin (O1, built "no", open with the owner).* See the rule below.
**`needs.session` and the step up.** A `session` need on a weakness is met by a live, unlocked session at that PC that has a level: not a relay session, not an expired token, route up, account present (`ops_need_session`, `network_ops.rb:388`). A `user` need is met by a typed, keyring, claim or technique user session; an `admin` need only by an admin session (a technique admin session, or a typed or keyring sign-in of a `creds.admin` account). A claim does feed a step up: the result is a technique record with the foothold, never a keyboard admin session, so it cannot satisfy a `needsSession` device. Whether an assist invite's shared screen should feed it too is open with the owner (O1); today it does not. A repeat use writes the `technique_used` row at the level the record stores.
**Author's note: an admin path disarms the USB lesson.** A PC where some account or step up can reach admin loses its USB lesson for an ordinary plant: a remote admin session's override shows at the plant proof and in the client, so a stick the policy refuses is accepted while the player holds remote admin there. An author whose USB lesson must hold gives that PC no admin path. The dungeon graph's `admin@<pcId>` nodes show which PCs have one.
**Log events.** `admin_profile_read` (label `ADMIN_READ`, result `ok`, detail `profile`): written by `GET /container` of a folder inside an account profile when an admin session read it and no live session's own account is admitted by that profile, `as` the admin account, `where` the PC, once per PC, profile and account (`games_controller.rb:3276`; a repeat stores nothing and causes no save). A profile's top-level items listed on the desktop write none, a refused open writes none, `GET /log_rows` writes none. `usb_install_overridden` (label `USB_OVERRIDE`, result `ok`, detail `device`, the item's `usbClass`, `storage` or `hid`): written when the override let a device through that the policy would have refused, from the implant path and from the plant proof; repeats merge as any plain row does. A refused plant writes no row. A source lists them by name in `events`; the profile kind is `profile` (`ops_log_events.rb:50-51`, `:136`). The reader shows the DETAIL cell as `profile: <name>`, the display name of the one account the profile is for (the name its sign-in tile shows), never the profile id; a profile admitted by no account or several, or by an account with no `displayName`, shows the kind word once (`profile`); so does a row at a PC whose `loginPicker` is `"known"` or `false`, because the name shows only where the PC's sign-in screen lists every admitted account's tile; a headless PC, and a PC whose policy's `remoteScreen` is `typed` (no tiles over the network), show the kind word too. A service in a detail (`service_checked`) shows its authored `label` when every host that declares a service of that name gives it the same label, else the kind word once (`service`); a cell that is only the kind word is never printed as `service: service`.
**Validator.** `scripts/validate_privilege.rb` (`check_privilege`, called from `validate_scenario.rb`); admission is asked through `CredentialModel.pc_admits_account?`. A scenario with no `creds.admin` account and no admin grant gets no line. Every line starts `WARNING: privilege: ` or `ERROR: privilege: `. Warnings:
- `sign-in PC '<pc>': profiles '<A>' and '<B>' both hold a top-level item named '<name>', and they meet on this PC only in an admin session by '<npc>'. Rename one so the admin desktop does not show two of them.`
- `<path> (<id>): a remove_item that is not the first action of its list on a USB-governed object. A gated remove stops its list there and waits, so the actions before it run even when the server refuses the plant. Put the remove_item first.`
- `<path> (<id>): its needsSession grants name more than one PC (<a>, <b>). The engine judges only the first, '<a>'.`
Errors, because a field that does nothing is too quiet for a warning (each is `<where>: "<field>" is not built yet (privilege plan stage S5b)` or `... S5c)`): `cachedAccounts` on any object and a `harvested` credential proof (S5b); `creds.accountKind`, `creds.localTo`, `creds.domain`, `accountOnly` on an NPC (room NPCs, `npcs`, `phoneNPCs`) and `domain` on a sign-in PC (S5c). These stages are not built.
**Dungeon graph.** A node `admin@<pcId>` (label "<PC name or id>, Administrator session", no password text) for each sign-in PC with an admin path, with an edge labelled `administrator` from the sign-in node of each `creds.admin` account the PC admits and from each weakness on that PC whose session grant has `access: "admin"` (the weakness keeps its `grants session` edge to the PC's lock). Mermaid draws the id as `admin_at_<pcId>`. A scenario with neither gets no node.
**Check from the server.** `verify-run.rb <game_id> --access` ends each session line with `level admin`, `level user`, `level none` or `level error` beside the stored `access` it already printed. `access-leak-check.rb` reports `access: "admin"` at a PC until a sign-in of a `creds.admin` account there (or a technique admin grant) earned it, an `admin` key inside an NPC or `creds` object, an owner's profile item shown to a session that is not the owner's before an admin session at that PC, and an `ADMIN_READ` row with no earned admin read. A browser capture does not say which PC a keyboard sign-in was at, so where more than one PC admits the account that sign-in earns nothing until the tester names it: `access-leak-check.rb --signin <account id>@<pc id>#<n>` (the account's n-th successful sign-in answer in the log; or `...@<pc id>@<row time>`), credited from that row only and for that account only. A named PC that does not admit the account is refused, and an entry that matches no row is an error. A sign-out, a lock, a later sign-in at the PC, a refusing desktop answer, an `endedPcIds` entry, a token's deadline passing (worked out from the sign-in answer), or a bootstrap, desktop or network answer that shows the PC without the session or without `access: "admin"` takes the earned step back. A session survives a power cut, so the first desktop answer after the PC is switched back on is named with `--resume <account id>@<pc id>@<row time>`; a desktop answer never restores the step by itself. Known limits: a sign-in named at another PC that also admits the account leaves the step at the real PC until that PC's next desktop answer; a power cut with no network view, desktop or reload before the next request is not seen by the check.
**What changes for existing scenarios.** A scenario with no `creds.admin` account and no admin grant can never reach admin, so no answer gains `access`. Five things do change:
1. *The implant refusal under a live non-keyboard session.* A player who holds only a foothold, `from`, relay or technique session on a PC and plugs a session-shaped device into its socket gets `422 needs_console` and the toast above, where it was a quiet `not_ready`. Sockets like that: `test_access_networks` (`sam_dock`, `kiosk_dock`), `demo_access_tour` (`implant_socket`) and `test_ops_access` (`desk01`). Nothing is granted, recorded or removed.
2. *The inventory `remove` action refuses a plant the USB policy refuses* (`422 usb_refused`; it used to remove the item silently and record nothing). An honest client never sends one in a shipped scenario, because the client's `plantRefusal` stops it first, so no screen changes; a hand-sent request now keeps its item.
3. *`test_ops_access` has a technique admin session*, which is now a full admin session. The scenario has no `owner`, no `accountProfiles` and no `usb` value, so neither admin power has anything to act on. Its dungeon graph gains one `admin@<pcId>` node and one edge.
4. *A stricter `session` need.* A session whose route is down, or whose account is gone, no longer meets `needs.session`. No shipped scenario depends on it.
5. *A technique admin session whose route is down or whose PC is off no longer sends `access`* (before, it still sent `access: "admin"` on its mirror entry and host row). Only `test_ops_access` has a technique admin session.
Nothing else changes: tile lists, the keyring and its `rev`, sign-in answers for non-admin accounts, the mirror for non-admin sessions and the host rows are as before.
**Shown in.** `test_ops_privilege` (a user and an administrator, an owned PC with a profile folder, a PC with a blocked USB policy and a BadUSB socket, a governed stick port, a token for the administrator, an assist invite, a step-up weakness with its card, a log reader; its `PLAYTEST.md` is the scripted run), and `test_ops_access` (a technique admin session).
**Known limits.** No cached accounts, harvested credentials, account kinds or domains (privilege plan stages S5b and S5c, not built). A relay session never feeds a step up (O1). A stick the policy refuses has no validator-clean admin path (O3). A flat profile's top-level items read on the desktop leave no `ADMIN_READ` row (a folder inside it does). A claim is never admin. A gated `remove_item` waits for the server, and in that one request the same item could be dropped or handed over by another route, which does not look at the pending remove (C2-2). The server judges a stick only where the item is consumed (`consumesItem` or a `remove_item`): a governed object that keeps its item has no server gate, so a lapsed override there is never judged by the server (C2-4; no shipped scenario has such an object under an admin path).
**Plan vs code.** `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` stage S5a. The code differs from the plan text in four places: the level is read through `client_access_level` (now `session_access`), not an `access:` keyword on `login_session_answer`; the implant refusal changed three existing assertions (`'not_ready'` to `'needs_console'`, two of the three tests) where the plan said none pin the reason; a `session` need also requires the route up; and a relay record never meets a `session` need (the plan said any live session does, O1).

### A21 Hash records and the cracker
**One line.** A hash record is an invented opaque token that stands for an account's stored, scrambled password. The player gets one into the keyring, opens the cracker, picks intel facts they have earned about the account's owner and presses Crack. The server alone decides the outcome, from the account's password class. It is a game abstraction: nothing in a scenario, a test or a doc names a real tool, a real format or a real command.
**Key fields.**
- A `credentials` entry with `kind: "hash"`: `account` (the NPC id), `proof` (exactly one: `{ "held": "<itemId>" }` for a takeable file, or `{ "technique_card": "<findingId>" }` with the weakness naming the record in `grants.credential`), optional `salted` (boolean), optional `crackSeconds` (a whole number from 10 to 600, salted records only) and optional `crack`. A hash has no `connectsTo` and never signs in. The token is never authored.
- `crack` (a closed object): `password` (`strong`, `guessable`, `reused` or `common`; optional when the NPC has a `password` habit, required otherwise; `common` exists only here), `facts` (guessable only: 1 to 4 bare `social.intelFacts` ids, no repeats, never with the `se_intel_` prefix), `passwordPattern` (the id of an object whose readable text is the clue) and `difficulty` (`easy`, `medium` or `hard`).
- NPC `habits.passwordDifficulty` (`easy`, `medium`, `hard`): a parameter on the password habit, not a habit of its own. The record's own `crack.difficulty` wins over it.
- Item `revealsFacts`: a list of bare fact ids on an item definition.
- Flag reward `{ "type": "grant_fact", "fact": "<id>", "label": "..." }` in a station's `flagRewards`.
**The four classes.** The class is `crack.password`, else the account's `habits.password`. An account with no class, an unknown class or an unknown grade, or with no `creds.password`, has no recipe: the run is refused and the validator says so first.
- `strong`: never yields. The first run answers "No match"; from the second run it answers that guessing is not feasible. The lesson is that a good password is not made of personal facts. A strong record never waits, even when salted.
- `guessable`: yields when the server has seen the player earn every fact the password is made from and the player picks exactly those facts. While facts are missing the run says how many, never which, and does not compare the pick. A wrong pick once all facts are held is "No match".
- `reused`: yields when the player already holds an equal password from another account. The pick is ignored.
- `common`: yields on the first run. Use it for a shared account with no person behind it.
**Difficulty table.** A field written on the record always wins; the grade never supplies facts and never changes the class. A grade that is not one of the three, from either place, makes the record unresolved: no hash row is listed and the validator reports an error.
| Grade | `salted` by default | Wait by default | Facts a guessable recipe is expected to use |
|---|---|---|---|
| `easy` | no | none | 1 |
| `medium` | yes | 60 seconds | 2 |
| `hard` | yes | 120 seconds | 3 or 4 |
| none | no | 60 seconds if the record says `salted: true` | no expectation |
**Salt.** The cracker shows the token and whether the record is salted, and explains neither. Unsalted records of equal passwords show the same token and crack together: one run grants this record's account and every other held unsalted record with an equal password. A salted record shows a token of its own, and every complete guess against it costs a short real-time wait on the server (`crackSeconds`, or the grade's default), right or wrong. The answer is `running` with `readyInSeconds`; the verdict comes from the next post after the wait. An open cracker scene posts that itself, once, when its countdown ends (with no pick); a scene that was closed needs one press of Finish. A wrong guess ends as "No match". A salted success grants that record alone.
**Where a fact can come from.** The server keeps its own set of earned facts and reads only that. A fact counts only when it comes from one of these sources, and the validator refuses a `crack.facts` entry that has none.
| Source | What the author does | Counts when |
|---|---|---|
| A takeable item | Put `revealsFacts` on the item definition (a note, a file on a share, a container file, a takeable NPC held item, a flag reward item). Give each such item its own id. | The server accepts the item into the inventory. |
| A start item | `revealsFacts` on an item in `startItemsInInventory`. | From the start. |
| A feed post | Give the post a `fact` (A11). | The server has served that post to the player. |
| A flag reward | `{ "type": "grant_fact", "fact": "<id>" }` in a flag station's `flagRewards`, or on a flag lock. | The server has just accepted the flag. |
**What the bootstrap holds (the withheld entry).** The text and label of every fact named by any `revealsFacts` or flag `grant_fact` reward (array or hash form) is left out of `social.intelFacts` in the bootstrap until the server sees it earned; an earned fact keeps its entry, so a reload has its words. The entry arrives as `facts` on the inventory-add answer (and on an `already` answer for a held item whose fact is earned), as `facts` on a `give_item` reward, and as `entry` on a `grant_fact` reward (flag station answer and flag-lock unlock answer). The client merges it before it grants the fact. Because of this, a fact must have one award path: a second path the server cannot see (a mail highlight, a pretext call, a `grant_fact` action elsewhere) would do nothing, and the validator refuses it.

A fact granted only by dialogue, an object action, an OSINT page or a mail highlight does not count: the server never sees the player earn it, so a recipe that needs it can never be met. The same goes for an item handed over by a timer or an object action, and for `revealsFacts` on a notepad or a decor cup (the client builds those). The validator refuses these.
**What the player sees.** Hash rows and the cracker scene.

*The row.* A hash row shows only in a capture log the player holds with `holds.captures: true` (the log lists the keyring, so a scenario with a hash record must give the player one, in `startItemsInInventory` or as an item; the validator does not check this yet). The log lists hash rows in a section of their own, "Hashes", after Sign-ins: the account's display name and username, the token in groups of four, a Salted tag if the record is salted, one status line and a button. The status line reads "Ready", "Cracking, N s left" (counted down on the page's clock from the seconds the server last gave), "Ready to finish" at 0, "Not feasible" or "Cracked". The button is Crack on a ready row, Open on a running row with time left, Finish at 0, and absent on a not-feasible or cracked row. It opens the cracker for that hash and ends the capture log; Close does not return to the log, so reopen it from the inventory. The row carries no routes, no `connectsTo` and no password. The keyring answer lists the rows and, beside them, `crackFacts`: the earned fact ids and nothing else. Taking a hash shows a "Hash collected" toast.

*The scene.* The cracker shows the account, the token, the Salted marker and one chip for each id in `crackFacts`. A chip reads `social.intelFacts.<id>.label`, else its `text`, else the bare id. The player picks up to four chips, or none, and presses Crack; the scene sends only fact ids. Messages: "N facts still missing" (never which), "No match", "This one will not fall to guessing. Try another way in." for a strong record, a progress bar and "Working on it... N s" during a salted wait, "Ready to finish. Press Finish to see the result." at 0, and "Cracked". On "Cracked" the scene shows the account's username and password in full, read from the keyring's `<npcId>.cracked` entry, and the same for the other account an unsalted batch opened (the answer names it in `credentialIds`). A refusal is drawn with the shared refusal words; a hash the player no longer holds reads "You no longer hold this hash." A cracked account shows an ordinary password entry that signs in like any other; there is one password row per account, so when a capture entry for the account carries the password, no separate cracked entry is listed, and the scene then says only that the password is in the keyring.

*Server enforces / client only.* The server decides every outcome, the wait and the grant. The client only draws the answer, counts down for display, and posts once when the countdown ends. Reopening the scene during a wait picks up the seconds the keyring last knew.
**The route.** `POST /games/:id/crack` takes `hash_id` and `facts` (0 to 4 ids). It refuses in a fixed order: `bad_request` (400), `not_found` (404; one identical answer for a bad id, an unknown id, a non-hash and a hash whose proof does not hold), then, unless the account is already held, `no_recipe` (422) and `fact_not_held` (422, for any picked id the server has not seen earned). A success is `{ success: true, status, ... }` where `status` is one of `nomatch`, `infeasible`, `needMoreFacts` (with `missingCount`), `running` (with `readyInSeconds`) or `cracked` (with `accountId`). The answer never holds the password, and the recipe never reaches the browser. An account the player already holds answers `cracked` whatever they pick. Posting during a wait answers `running` and reads nothing.
**Log events.** None. A crack writes no log row; the log shows only how the hash was obtained (`share_folder_opened`, `technique_used`) and what the cracked password later does (`signin_ok`).
**Validator.** `check_cracking` (`scripts/validate_cracking.rb`, called from `validate_scenario.rb` after `check_credentials`). Errors include: an account that is not an account holder; `connectsTo` on a hash; an unknown grade; no password class; an unknown class; an account with no `creds.password`; a guessable record without 1 to 4 `crack.facts`, or with repeats, or with an `se_intel_` prefix, or with a fact no server-seen source supplies; `facts` on a class other than guessable; `crackSeconds` out of range or on an unsalted record; `passwordPattern` naming no object; an item with `revealsFacts` that has no id, shares an id, or is handed over by a timer or object action; a policy that accepts `hash`; a hash record in a scenario with no capture log item (`type: capture_log`, `holds.captures: true`); and a fact named by an item or flag reward that another path also awards. Warnings include: the record's class differs from the account's habit; the grade expects a different number of facts; difficulty on a strong password; a `passwordPattern` on a class other than guessable, or on an object with no readable text; a reused password that no other held account matches. Every line carries a mark before the words `ERROR: cracking: ` or `WARNING: cracking: ` (for example `ERROR: cracking: ...account has no creds.password`; search for the words after the mark). A further warning: a hash account's password equals a capture target's secret while `social.captures.revealSecret` is not true, because the cracker always shows a cracked password in full.
**Dungeon graph.** A hash record is drawn as a credential node with an edge from whatever supplies it, and the crack edges show the account it opens. The graph shows no password and no recipe text.
**Shown in.** `test_ops_crack` (a guessable account whose three facts come from a note, a feed post and a `grant_fact` flag reward; a reused account; a common account and its unsalted pair that crack together; a strong account that never yields). Its `PLAYTEST.md` is the scripted run.
**Known limits.** At most 64 earned facts and 64 cracked accounts per game; more are dropped. A held item with no stamp (a save edited by hand, or a scenario edited under a live game) never earns its fact: the entry is withheld, so the fact is on neither the chip list nor the intel board (S5). A `label` on a `grant_fact` reward is the toast text only. A hash row needs a capture log (above). One look for the cracker and no command-line skin. No real tool, format or wordlist is named anywhere, by design. A hash never signs in by itself. A guessable recipe cannot use a fact from dialogue, an object action, an OSINT page or a mail highlight. No reset entry for a cracked account.
**Plan vs code.** `docs/achitechture/OPS_CRACKING_PLAN.md`, build stages C1 and C2, built as one stage. Where the plan and the code differ, the code is right: the countdown field is `readyInSeconds`; the route answer fields are `status`, `readyInSeconds` and `reason`; a second failed run on a strong record shows as `infeasible`; `revealsFacts` is kept only when the server itself adds the item (a declared grant, a forged add or a notepad does not keep it).

### A22 Multi-factor sign-in
**One line.** A sign-in PC can ask for a second step after the right password. The step is a six-digit code from a device the player must hold (`code`), a push request to the owner's phone (`push`), or a push the owner never approves, so only a player holding the phone can pass it by tapping the right number (`push_number_match`). Every pass is decided on the server from state it holds; nothing in the browser can open a session.

**Key fields.**
- Policy `mfa`: `none` (the default), `push`, `push_number_match` or `code`. It is on a policy, so every PC that uses the policy asks. Sent to the browser (which PCs ask, and of which kind). The validator refuses any other value.
- Account `creds.mfa`: only the literal `false` exempts the account. Absent means enrolled. `true`, `"false"` and `0` are errors. Never sent to the browser.
- Item `type: "code_device"`: needs an `owner`, which must be an account NPC (a room NPC with `creds`), and an `id`. One per account; two for the same owner is an error. The player sees its `type`, `id`, `name` and `owner`. **A `code_device` needs an object image**: the validator looks for `assets/objects/code_device.png` (`public/break_escape/assets/objects/code_device.png` exists; it is a placeholder copy of an existing sprite, so replace it with real art before release).
- Item `type: "phone_friendface"` with an `owner`: the owner's phone, used by `push` and `push_number_match`. The scenario must have a `social.osint` site, or the phone has nowhere to open and the existing phone check refuses it. The phone needs an `id`, and the NPC must not be `"phone": false`.
- NPC `habits.approvesPrompts`: `never`, `pestered` or `always`. Absent, it is read from `awareness`: low is `pestered`, medium and high are `never`. Never sent to the browser.
- NPC `habits.promptPatience`: an integer 2 to 9, default 3. How many requests a `pestered` owner takes before approving. It does nothing for `never` or `always`. Room NPCs only; never sent to the browser.
- Not built (S8b): top-level `helpdesks`, `creds.recovery`, `creds.resetPassword` and `helpdesk` on a pretext ask. Each is an ERROR with the line `"<field>" is not built yet (MFA plan stage S8b)`.

**The three kinds.**
- `code`. The device shows six digits that change every 60 seconds. The server accepts the code of the current minute and of the one before it, so a code lasts up to two minutes. A code can be used once: the same code typed again is "stale". The sign-in has five tries per pending step. The fifth wrong try ends the step and the player signs in again. Each wrong code also counts as a failed sign-in for the PC's `maxAttempts`, and the lockout answer is the ordinary one. After 30 wrong codes in all for one account, its code step is closed for five minutes. A code that is not six digits is refused and counted nowhere.
- `push`. The player asks for a request ("Send again"). The owner receives it only if their phone is not held by the player, was not taken from them, and they are not recorded as knocked out. A `pestered` owner approves on the request that reaches their patience (default the third); the count is kept per owner across attempts and resets when they approve. A `never` owner never approves, and an `always` owner approves at once. Requests must be at least two seconds apart. Twenty requests are sent; the next call after the twentieth ends the step. A player who holds the owner's phone approves it themselves from the phone.
- `push_number_match`. The sign-in screen shows one two-digit number. The owner never approves. The player must hold the phone, where three numbers are listed and one matches. A wrong number or "Deny" cancels the step. That is not counted as a failed sign-in.

A pending step lasts five minutes from the right password, then it is dropped and the player signs in again. Nothing pauses with the game: this is wall-clock time.

**What the player sees.**
1. They type the account's password. If it is right and the account owes a step, the screen swaps to the second-step pane for that kind. There is no session yet, no error line, and the failed-sign-in count is not cleared.
2. Code pane: "Second step for <name>", "Enter the six-digit code from the code device.", a field and "Verify". If the player holds that account's device a "Use <device name>" button opens the device over the screen. Closing the device fills the field, but only for a code not yet used. Wrong code: "Incorrect code" with the tries left. A used code: "That code has been used. Wait for the next one." An old one: "That code has expired." Five tries gone: back to the password pane with "Too many wrong codes. Sign in again." A step closed after 30 wrong codes in all: "Too many wrong codes." with a wait. The PC's own login lockout (wrong codes count against `maxAttempts`) shows the ordinary lockout line.
3. Push pane: "Second step for <owner>", "A request was sent to <owner>'s phone.", "Requests sent: n" and "Send again". For number matching it also shows "Number: nn", and, when the owner's phone is held, "Note this number before you open the phone." (the phone replaces the screen while it is open). If the player holds the owner's phone a "Check <owner>'s phone" button opens the live authenticator over the screen. Too early: "Wait a moment before sending another request." Cancelled: "Request cancelled."
4. The phone (live authenticator) lists the requests waiting on that phone: the PC (Computer) and the account. The request count is not shown. For number matching it lists three numbers and the player taps one. The right one is never marked.
5. Every pane has "Use a different account", which returns to the account picker. It clears only the browser's step. The browser notes the way in (a foothold, a source PC or the keyboard) with the step, and a screen with another way in does not take it up: a step begun over a drop box is not resumed at the keyboard. The pane keeps the account's name from the first step when it opens again. The server's pending step stays until it expires or is replaced.
6. A held code device also opens from the inventory (click it). The live authenticator opens only from the push pane of the sign-in screen, and only for a phone the player holds; there is no other way to open it.

**Ways to hold a device.** The same four apply to a `code_device` and an owner's phone.
1. Handed over in the owner's story: the owner's ink offers it (an `itemsHeld` give). Best effort: the server cannot yet prove a hand-over, so a tampered browser could ask for it early.
2. Taken after a knock-out: the owner is an NPC who can be knocked out (not `koImmune`, the scenario does not set `disableAttacks`, and not a phone-only NPC), holding the item in `itemsHeld`. The knock-out record is the browser's claim: it can let a device leave its owner and can only refuse a push, never grant one. Best effort.
3. Found loose in a room or a container.
4. A start item (`startItemsInInventory`).

A device the owner still holds does nothing until the player takes it, because the code is only ever sent for a held device (`GET /mfa/device`, 403 otherwise). The code device in the player's hand shows the code of its owner's account alone.

**Author's advice.**
- To keep a device with its owner: write no story line that gives it (no `give_npc_inventory_items` with no type filter, which hands over everything they hold, the device included) and set `koImmune: true`. The validator warns about a device that is not gated, and about a device nobody can get.
- A phone with an `owner` belongs in that NPC's `itemsHeld`. A phone lying loose in a room or container is free to take, so a push to it is no check (warning). This is a rule change from before S8a: a loose owned phone used to be refused until its owner offered it or was knocked out, and now it is free to take.
- A `code` policy with `maxAttempts` can lock the sign-in for good, because wrong codes count. Remove it, or give the player another way through (warning).
- `promptPatience` on an owner who is not `pestered` has no effect (warning).

**The ways round a second step.** A session token and a help invite skip the step. A technique session on the host (a `grants.session` for that account) never reaches it. A claimed open screen is a way in too: an owner who left the PC unlocked (`screen_always_locks?` false) can be claimed first, before any sign-in. A claim sign-in and a relay sign-in never reach the step. Two things stay: a saved connection to a PC with a second step still asks for it, and answers 422 `typeToSignIn: "second_step"`, shown as "This PC asks for a second step. Type the password to sign in." And unlocking one's own locked session asks for the password only: the step is not asked again.

**A locked-out account.** The account's login lockout on that PC is checked at prompt and approve as well as at verify: a locked-out account is refused at each, and the client leaves the second step.

**Server routes.** `GET /mfa/device?item_id=` (the only place a code is sent, to a player holding the device), `POST /mfa/verify` (`pc_id`, `code`), `POST /mfa/prompt` (`pc_id`), `GET /mfa/phone?npc_id=` (the only place the three numbers are sent, to a player holding that phone), `POST /mfa/approve` (`pc_id`, `number` or `deny`). Every answer is `Cache-Control: no-store`. Refusals say no more than the first step did. The `mfaRequired` answer carries the account's `npcId` and, for number matching, the one right number.

**Never sent to the browser.** `creds` (so `creds.mfa`), a code outside `GET /mfa/device`, the number choices outside `GET /mfa/phone`, `habits.approvesPrompts`, `habits.promptPatience`, `awareness`, and the state keys `mfaPending`, `mfaAccounts`, `mfaPrompts` (server-owned: no sync body writes them).

**Log events.** Eight, label `MFA`, place `pc`, so a `logSources` `events` list of `mfa_*` takes them all. `mfa_challenge` (result ok, detail `route`: `keyboard`, `foothold` or `from`) when the right password opens a step. `mfa_code_ok` (ok). `mfa_code_wrong` (fail). `mfa_code_locked` (locked): the account's step closed after 30 wrong codes. `mfa_expired` (expired): the fifth wrong try, or the call after the twentieth request. `mfa_prompt_sent` (ok). `mfa_prompt_approved` (ok, detail `approver`: `owner`, `held_phone`; `own_phone` is S8b's). `mfa_prompt_denied` (denied). Rows with the same event, account and place join into one row with a count. A row never holds a code or a number: the detail lists are closed. A wrong code also writes the ordinary `signin_fail` row beside `mfa_code_wrong`. A wrong password is still the ordinary sign-in row.

**Validator.** `scripts/validate_mfa.rb` (`check_mfa`, called from `validate_scenario.rb`). A scenario with none of these fields gets no line, bar the loose-phone warning. Every line starts `ERROR: mfa: `, `WARNING: mfa: ` or `INFO: mfa: `, and none quotes a code, number or password.
- Errors: a policy `mfa` value that is not one of the four; `creds.mfa` other than `false`; a `code_device` with no `owner`, or an owner that is not an account; two code devices for one owner; a two-digit PC id or username under number matching (it can be the same as an issued number); a `code` key holding six digits (or not text or a whole number) in a scenario with a code device, or a `numbers` key where a policy matches numbers (the leak check would report it on every answer); a `code` PC where an admitted enrolled account has no `code_device`; a push PC where an admitted enrolled account is `"phone": false`; the S8b fields (above); invalid `approvesPrompts` or `promptPatience`, or either on an NPC that is not a room NPC (from `validate_npc_habits.rb`).
- Warnings: a policy that does nothing (every admitted account exempt); a `code_device` that cannot be held; a `code_device` that is not gated; a loose owned phone; a `code` policy with `maxAttempts`; a saved connection to an MFA PC for an enrolled account (it must be typed); a push PC nobody passes (every admitted owner never approves, no phone can be held, no other way through); `promptPatience` that does nothing.
- Information: per `code_device`, the routes to it; per MFA PC, its kind and, for each admitted enrolled account, the ways through or round the step (the account's device, or its phone when the player can hold one, the owner approves (pestered or always) for a push, a token, a help invite, a technique session on that host, the owner's open screen if claimed).

**Dungeon graph.** An MFA sign-in lock gains a "second step" edge into its lock node for each admitted enrolled account. `code`: from that account's `code_device` item. `push`: from the owner's phone item when one is declared, and an "owner approves (pestered)" node when the habit is `pestered` or `always`. `push_number_match`: the phone item only. Exempt accounts get no edge. No label holds a code, number or password.

**Check from the server.** `verify-run.rb <game_id>` prints, per account, `started`, `wrong`, `used` and `closed yes/no`, per owner the request count, and per PC `pending <kind>` or `pending none`: words, counts and ids only, never a code. The leak scanner reports a `code` or `numbers` key outside the answer for a device or phone the run has earned, the secret habit and state key names anywhere, and a session at an MFA PC with no second step passed. It also reports the one right `number` anywhere but the `mfaRequired` answer, an `mfa` key inside a `creds`, and an `mfaRequired` answer of another shape or for a PC that owes no step. A sign-in the capture cannot place at a PC is named with `--signin <account>@<pc>#<n>` (and a sign-out with `--logout`); a name stands only when the first desktop row after that sign-in is the named PC showing the account signed in by a keyboard password, else the check exits 2: see the header of `tools/playtest/access-leak-check.rb`.

**What changes for existing scenarios.** Nothing. With no `mfa` value in any policy every answer and every write is as before; the golden fixtures (`mfa_*` cases in `test/fixtures/files/ops_unchanged`) pin that.

**Shown in.** `test_ops_mfa` (five PCs and six accounts across all three kinds and an exempt service account; its `PLAYTEST.md` is the script). The `authenticator` scene of `ca03_helpdesk_reset` is a different, older scene and is unchanged.

**Known limits.** No helpdesk, no account recovery, no password reset, no re-enrolment onto the player's own phone (S8b); `own_phone` is reserved for it. The story offer and the knock-out record are the browser's claim (best effort). Lock plans (`target_type`, `target_id`) are S8c and are refused for now. There is no real clock in the game: the server's wall clock decides code windows and the five-minute closure.
**Plan vs code.** `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` stages M1a to M3. The code differs from the plan in the places `S8A_BUILD_BRIEF.md` section 2 lists (the code is right).

### A24 Ops log: write side
**One line.** A scenario with a `logSources` block and a `gameClock` makes the server record badge swipes, sign-in outcomes and session ends as short rows; only the write side exists, so no screen shows a row yet.
**Key fields.** Top level `logSources.<id>`: `title` (1 to 40 characters), `events` (event names, or a prefix ending `_*`), optional `where` (`rooms`, `objects`, `places`), `showCardHolder` (default false), `maxRows` (10 to 150, default 50). A `gameClock` stamps each row. `seedRows` is A24 (seed rows and anomalies).
**What the player sees.** Nothing. There is no reader, terminal or viewer in this stage: an author or tester reads the rows from the server.
**What is written.** One row per event, into every source whose `events` and `where` take it (a source's own cap applies). Registered events: `badge_swipe` (ok, or denied with no identity), `signin_ok` (method `password` or `credential`, route), `signin_fail` and `signin_lockout` (who: the typed username, never the account it belongs to), `signin_refused` (denied or blocked), `session_end`, `session_lock`. Repeats of a failure or refusal merge into one row with a count. A row holds the event, who, where, result, a small detail, the game-clock time and the server time. It never holds a password, key, foothold or relay id; a card with no single holder is named by its card id. A claimed guest session has no account, so its sign-out and lock rows carry no identity. A sign-in at a locked session by password is a second sign-in: it merges into the earlier `signin_ok` row and raises its count. A card-less rfid request at an open door or object answers `alreadyOpen: true` in every scenario, with or without `logSources` (the client only words its toast by it). Not recorded, on purpose: a card copy, a claimed session's sign-in and an implanted foothold. Network and share rows (`net_*`, `share_*`) are a later stage.
**Server enforces / client only.** The server writes every row, at the call site, in the same save as the action; a request the server could not validate (a forged swipe, a sign-out with no session) writes no row, while a refused swipe or sign-in at a lock in force writes a `denied`, `fail` or `blocked` row, and `logSources` is withheld from every client answer. The browser plays no part.
**Validator.** `scripts/validate_log_rows.rb` (called from `validate_scenario.rb`): events must be registered, a source needs a `gameClock`, and the secret and caps checks; the schema block is `logSources` in `scripts/scenario-schema.json`.
**Check from the server.** `bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log` prints each source's rows and exits 1 if one holds a registered secret or breaks a cap.
**Shown in.** `test_ops_logs` (doors, sign-in PC, clock, two sources, and from L2a a security room with a reader each). Its `PLAYTEST.md` is the scripted run.
**Known limits.** The reader is A24 (read side). Only `scenarios/test_ops_*` and `scenarios/demo_ops_*` may declare `logSources` for now.
**Plan vs code.** `docs/achitechture/OPS_LOG_ROWS_PLAN.md` sections 4.1 and 13.8.

### A24 Ops log: read side
**One line.** An object of type `ops_log_terminal` opens a viewer of one declared log source; the rows are the ones the player's own actions wrote (A24 write side), read through `GET /log_rows`.
**Key fields.** Object `type: "ops_log_terminal"`, `id` (required: the route finds the reader by it), `minigameData.logSource` (a declared source id; required); the viewer's title is the source's `title`, and the frame shows the object's `name`. `anomaly`, `flagActionLabel`, `flagActions` and `completionActions` are A24 (seed rows and anomalies). The reader is placed like any object, in a room, in a container or on a PC desktop.
**What the player sees.** A table with the columns TIME (game clock), EVENT, IDENTITY, LOCATION, RESULT, and a detail pane for the selected row (with DETAIL). Filters by time of day, event, identity, location and result; a Refresh button. A repeated failure shows once with a count (`FAIL x3`). Rows are in the order they happened. A locked or unreached reader shows NO ACCESS.
**What a row shows.** Exactly seven keys: `id` (an opaque ten-character id, not stable across games), `elapsedMs`, `event` (a label such as BADGE, SIGN_IN, SESSION), `as`, `where`, `result` and `detail`. IDENTITY is the account or the typed name, the card holder for a badge swipe (named in every source when the swipe used the holder's own keycard or the request carried one card; when several cards were sent, only a source with `showCardHolder: true` names the holder, or the card when it has no single holder, and any other source shows `-`), `-` when none. LOCATION is the name of the door or PC (a door shows its room's `door_sign`, else its `name`); a thing with no authored name shows its kind word (`door`, `pc`, `npc`, `card`), never its id.
**What a row never shows.** A password, card id, key, foothold or relay id, the stored sequence number or server time, or the other sources' rows, except the text the player typed into a username box (shown in IDENTITY, cut to 32 characters). Rows are built from ids and registered codes only; in test and development a row holding a registered secret is refused when written (in production no check runs at write time), and the suite and `verify-run.rb --ops-log` fail on one.
**Route.** `GET /break_escape/games/:id/log_rows?object_id=<reader id>[&rev=<rev>]` (plus `foothold`, `from` or `relay` for a reader on a sign-in PC reached by that route). Read only: no row and no save. Answers `{ rev, title, rows }`, or `{ rev, unchanged: true }` when the sent `rev` is current. A reader the player has not reached (its room, a lock on it or its path, the PC's session) answers the same 404 as an unknown object, so the answer does not say that it exists. A bad `object_id` is a 400.
**Server enforces / client only.** The server decides what a row shows and whether the reader is reached; the viewer only draws the answer and filters it.
**Validator.** An `ops_log_terminal` needs an `id` and a `logSource` that is declared, and may not be authored with `lockType: login` (`scripts/validate_log_rows.rb`); its `minigameData` is checked against `scripts/minigame-data-schemas.json`.
**Shown in.** `test_ops_logs`: a `security` room east of the office (a second card door) with `door_log_pc` (door controller) and `signin_log_pc` (sign-in audit). Its `PLAYTEST.md` beats 8 to 13 are the scripted run.
**Known limits.** Network and share rows are A24 (network and share rows). A reader's sprite is the log terminal picture.
**Plan vs code.** `docs/achitechture/OPS_LOG_ROWS_PLAN.md` sections 4.2, 6 and 7.

### A24 Ops log: seed rows and anomalies
**One line.** A log source can carry authored history (`seedRows`) that the reader shows before the rows play writes, and the reader can name one seed row as its anomaly: the player flags the row they think does not belong, the viewer checks it in the browser, and a right flag runs the reader's actions.
**Key fields.** `logSources.<id>.seedRows` (at most 100): `id` (`s1`, `s2`, ... unique in the source), `at` (`HH:MM` game time, optional day: `Mon 23:58`, as the game clock prints it), `event`, `result`, `as` (an NPC id, or for a `signin_*` event a plain username of at most 32 characters), `where` (`{ "kind": "door", "id": "<room>" }` and the like), optional `detail` under the event's rules (never a stored-only key). Rows must ascend and end at or before `gameClock.start`, so a source with seed rows needs a clock with a start time. On the reader: `minigameData.anomaly: { "rowId": "s3" }` (a seed row of that reader's source, never a play row), `flagActionLabel` (the button's words), `flagActions` and `completionActions` (`set_global` and `complete_task`, as the log filter takes them).
**What the player sees.** The seed rows first, then the rows play wrote, in the same table (TIME shows the authored stamp). With an anomaly, a row's detail pane offers a flag button (default label `FLAG AS ANOMALY`); it asks to confirm, then says `NOT THIS ONE` for a wrong row, or marks the row `FLAGGED` (its own hatched green look) for the right one, and the actions run once. Nothing marks any row before a right flag. After a right flag the row stays marked, also after a reload, and no more flags are offered on that reader.
**Server enforces / client only.** Client only, best effort, the same standing as the log filter's anomaly. The reader object reaches the browser with `anomaly.rowId`, `flagActions` and `completionActions` (plan section 7). The viewer compares the picked row's id with `anomaly.rowId`; a right pick runs `flagActions` then `completionActions` through the same global-setting path the log filter uses (`set_global`, `complete_task`, so the "Task Complete" toast shows when the viewer closes, as it holds while any minigame is open). "Already flagged" is read from the action's global (the first `set_global` to `true` in `flagActions`, else in `completionActions`), which the normal sync saves, so a reopened reader after a reload shows the flag with no state of its own; with no such `set_global` the flagged mark lasts until the page reloads. A reader that opens with that global already true re-runs only its `complete_task` entries (a no-op for a done task), so a task whose request once failed still completes; a done global set by anything else (another action, another reader sharing the key) marks the row as flagged. The server only serves the rows: no route judges the flag and no state key holds it. A server check (the server applying the actions and owning the globals and tasks) is a later piece, planned with the investigator work.
**What a seed row shows.** The same seven keys as a play row, with `at` (the authored stamp) in place of `elapsedMs`; its `id` is the authored one (`s1`), which is what `anomaly.rowId` names. A seed row is never capped, merged, evicted or marked `+`, and never passes through the card-holder rule (`flagged`): it shows the name it was authored with. A stored snapshot's seed row with an id, stamp or result of the wrong form is not shown.
**Validator.** `scripts/validate_log_rows.rb`: a seed row needs a unique `^s[0-9]{1,3}$` id, an `at` in the clock's form, a registered event, a result and detail the event allows, an `as` that is an NPC id (or a plain username on a `signin_*` row), a `where` that exists, and its text may not equal a declared password or credential value; rows must ascend and end at or before the start time; at most 100 per source; the schema block is `seedRows` in `scripts/scenario-schema.json`. A reader's `anomaly.rowId` must be one of its source's seed rows (error), and a source with a single seed row warns (the flag has one candidate); an anomaly whose actions set no global to true, or that has no actions, also warns. Warning for a seed row of an event the source does not record.
**Graph.** `scripts/generate_dungeon_graph.rb` draws each log source as a note node (its title and events), joined by a dashed undirected edge to each reader that shows it; it gates nothing, and the anomaly adds no edge of its own.
**Shown in.** `test_ops_logs`: `night_log_pc` in the finance office reads the `night_log` source (four seed rows, the `Mon 23:58` swipe is the anomaly). `PLAYTEST.md` beats 14 to 19.
**Known limits.** The flag can be cheated from the browser (a player who reads the scenario object knows the row), as the log filter's can; no attempt cap. A play row can never be an anomaly. Only `scenarios/test_ops_*` and `scenarios/demo_ops_*` may declare `logSources` for now.
**Plan vs code.** `docs/achitechture/OPS_LOG_ROWS_PLAN.md` sections 4.2, 5.2 and 7; the build follows the plan with one reading: the plan's "no row is ever tinted" is about telling rows apart before the player acts, and a row the player has rightly flagged is marked (and stays marked after a reload).

### A24 Ops log: network and share rows
**One line.** Plugging a device into a jack, unplugging it, joining a Wi-Fi access point and opening a folder in a file share each write one row into the log sources that take them (`net_*`, `share_*`), so a reader can show what the player did on the network.
**Key fields.** Nothing new on a source or reader: a source lists `events: ["net_*", "share_*"]` (or the exact names) and, to name where, `where.places` entries `jack:<object id>`, `ap:<object id>` and `share:<resource id>`.
**What writes a row.** `net_link_up`: a successful plant at a jack (`POST /network/plant`), a replant after an unplug is its own row, so the log reads up, down, up in order (the link events never merge into an earlier row; an already planted jack writes nothing). `net_link_down`: a successful unplug. `net_wifi_join`: a successful join of an access point (a wrong key, an access point already held or an unknown one write none). `share_folder_opened`: an admitted open of a share or a folder in it (`GET /container/<id>`); one row per folder and account, so a repeat open adds nothing and saves nothing. A request for a file writes no row. An implant at a PC (`implant_foothold!`) and a card copy (`clone_card`) write no row, and neither does a refused plant (no device, locked room, port security) or a refused open.
**What each shows.** EVENT `NET_LINK_UP`, `NET_LINK_DOWN`, `NET_WIFI_JOIN`, `SHARE_OPEN`; LOCATION the jack's, access point's or share's authored `name` (the kind word `jack`, `ap` or `share` when it has none), never an id; IDENTITY `-` for the network rows, and for `SHARE_OPEN` the account of the first session, in sign-in-list order, that admits the share, `-` when only a foothold does; DETAIL `folder: <folder name>` when a folder was opened, empty for the share itself.
**What a row never shows.** A foothold, relay or source PC id, a network name, a Wi-Fi key, a device id, or a file name or content.
**Server enforces / client only.** The server, in the same save as the action. The browser plays no part.
**Shown in.** `test_ops_logs`: a `comms_room` north of the lobby with a wall jack (`comms_port`), the network log reader (`net_log_pc`, source `network_log`), a drop box and a guest access point (`guest_ap`, key on a lobby card) in the lobby, and a share (`scanned_inbox`) with a folder on the jack's network. `PLAYTEST.md` beats 20 to 27.
**Known limits.** A share row's LOCATION is the share's name, so the leak check allows it only in a `SHARE_OPEN` row, only for a share with an earlier successful `GET /container/<that share or an item in it>` in the same run, and only that owner (a `/network` listing earns nothing; every other network string stays a finding there).
**Plan vs code.** `docs/achitechture/OPS_LOG_ROWS_PLAN.md` sections 5.1 and 13.8.

## 4. Network features

### Network events (list)

Client-emitted through `eventDispatcher`; each is also emitted as `<name>:<id>` (NL:164-169).

| Event | Data keys | Emitted at |
|---|---|---|
| `network_foothold_gained` | footholdId, via (`jack`, `wifi`, `implant`), networkId, sourceId | NL:459 (plant), NL:534 (implant), NL:654 (join) |
| `network_device_planted` | jackId, footholdId, networkId, deviceId | NL:458 |
| `network_device_refused` | jackId + reason (`no_device`, `port_security`), or pcId + reason `usb_refused` | NL:402, 427, 436, 485; patch-panel-minigame.js:252 |
| `network_device_unplugged` | jackId, footholdId, endedPcIds, tokenExpiredPcIds (only when non-empty) | NL:593 |
| `network_joined` | apId, footholdId, networkId, already | NL:652 (fires on every join, a second AP included) |
| `network_view_closed` | footholdId, reason (`closed`, `link_dropped`, `foothold_gone`) | NL:796 |
| `network_viewed` | footholdId, networkId, hostIds, hostList, plus extras | network-view-minigame.js:454 |
| `network_host_opened` | footholdId, hostId, kind | network-view-minigame.js:874 |
| `network_swept` | networkId | network-view-minigame.js (`afterAnswer`, after a successful sweep answer, a repeat included; never after a refusal) |
| `network_host_scanned` | hostId | network-view-minigame.js (`afterAnswer`, after a successful host scan answer, a repeat included; never after a refusal) |

Also: the global `<jackId>_planted` (NL:80, 198, 314) is true while a device is planted at a jack or while the player holds a foothold from that access point or PC; the dungeon graph and `observationVariants` use it.

### Dungeon-graph treatment (networks)

Built in `scripts/generate_dungeon_graph.rb:528-760` (reads `NetworkModel`). A jack is a lock-like node from its room to its network node; a `portSecurity` jack is drawn as a dead end (line 696-705). A network link is a dashed undirected edge (line 85, `undirected`). A pivot is a `+` gate per sign-in host on a reached network with a `pivot` edge to each linked network (README:1152). A network's `offWhen` goes into its node label ("down while X", "(down at start)"), not a gate (line 654-666). A Wi-Fi access point is a lock-like node opened by a "Wi-Fi key" node, and the key text is scrubbed from the graph output (lines 539-640, `check_wifi_key_free`). An implant is one node per PC, with edges from where its action runs (prop, timer or NPC beat), from its device node ("(implant device)") and to the PC's network (lines 980-1060). Pivots are drawn at lines 1062-1075.
Plan vs code: `docs/IDEAS_BACKLOG.md:239` says "the dungeon graph does not draw links, outages, Wi-Fi or implant nodes", but the generator draws all four. That part of the backlog entry is stale.

---

### N1 Network jack and drop box
**One line.** A room object marked `networkJack` takes a carried `rogueDevice`; planting gives a foothold on the jack's network and opens the network view.
**Key fields.** `networks` (top level), `networkJack`, `jackConfirm`, `plantedSprite`, `requiresItemHint`, `linkName`, `linkStoreIn`, `network` (object or room), `rogueDevice` (item).
**What the player sees.** A wall port or router object. With nothing to plug in, a click shows its `requiresItemHint`. With the drop box in the tray, a confirm asks "Plug <device> into <jack>?" (or `jackConfirm`). On Plug it, the box leaves the tray, a link item (default name "Drop box: <room>") arrives, the jack shows `plantedSprite`, and the network view opens the first time. Clicking a planted jack reopens its view, with Unplug inside.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| networks | top level | id to `{ name, offWhen?, wifi? }`; never sent to the browser (SCH:317-338; NA:18) | none |
| network | room, object | the network an object is on; object beats room; never sent (SCH:4225, 5524; NA:21) | none |
| networkJack | object | this room object is a jack (SCH:5537) | false |
| jackConfirm | object | confirm text (SCH:5538; NL:420) | "Plug <device> into <jack name>?" |
| plantedSprite | object | jack texture while planted (SCH:5539) | unchanged |
| requiresItemHint | object | line when nothing to plug in (NL:411) | "You have nothing to plug into this port." |
| linkName | object | name of the link item (SCH:5540; NA:260) | "Drop box: <room>" (NA:550, LINK_DEVICE_WORDS) |
| linkStoreIn | object | holder the link item is filed in (SCH:5541) | none |
| rogueDevice | item | takeable item with an id that can be planted (SCH:5544) | false |

**Example.** Fragment of the N1 to N11 worked example (section 5) (objects `kit_dropbox`, `bench_port` in room `lobby`, networks `office_lan`):
```json
{ "type": "pc", "id": "kit_dropbox", "name": "Network drop box", "sprite": "drop_box1", "position": { "x": 8, "y": 4 }, "takeable": true, "rogueDevice": true, "observations": "A drop box." },
{ "type": "pc", "id": "bench_port", "name": "Wall port", "sprite": "network_rack1", "position": { "x": 5, "y": 3 }, "takeable": false, "networkJack": true, "jackConfirm": "Plug the drop box into this port?", "plantedSprite": "pi_cluster1", "requiresItemHint": "A spare port.", "observations": "A wall port." }
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: jack must exist, have a network the scenario defines, and be reachable (room unlocked, containers open, panel open): NA:99-108, 121-129, 233-241. A device must be in the server inventory, by scenario definition, never a client-forged item: NA:143-168, 255. The foothold, link item and `gainedFootholds` are written server-side: NA:259-282. One foothold per jack (`jack_<id>`), a repeat answers `already`: NA:40, 247-254.
- Server: `networks`, `networkLinks`, `resources` are stripped from the bootstrap and `network`, `linkName`, `linkStoreIn` from every object: NA:18-27.
- Server: an `unlock_object` task on a jack is met only once a foothold was gained there: game.rb:5247-5249.
- Client only: the confirm dialog, the toast, jack look, opening the view (NL:381-460).
**Events.** `network_device_planted`, `network_foothold_gained` (see list above), plus `<jackId>_planted`.
**Validator.** `VN` errors: jack inside a container/profile/share (120), jack is a sign-in object (122), jack has a lock or trigger field (127), takeable jack (129), jack with no network (135), rogue device with no id (209), not takeable (211), droppable (214), required-and-consumed by an object (226). Warnings: jack but no `rogueDevice` item (230), device but no jack (234). Unknown network name errors at 96.
**Shown in.** Fields `networkJack`: `test_access_networks` (best demo, 12 beats with signs), `test_access_devices`, `test_access_keyring`, `demo_access_tour`, `lab_physical_pentest`.
**Known limits.** No bypass for a device the player is not carrying; a sign-in object cannot be a jack. No backlog entry for the jack itself.
**Plan vs code.** README:1021 table row says optional jack fields include `requiresItemHintVariants`; schema/engine handle it through `resolveObjectField` (NL:411, 420), not checked further. Otherwise none found.
**Unverified.** Link item file location in the tray (`storeIn` behaviour beyond the schema).

### N2 Remote sign-in
**One line.** A held foothold lets the player sign in to any host on its reachable networks from the network view, unless the PC's policy blocks remote sign-in.
**Key fields.** `policies.<name>.remote`, `policies.<name>.remoteScreen` (policy), `host` (object), `loginPicker` (object).
**What the player sees.** In the network view each host row has Sign in. The remote sign-in screen shows the PC's account tiles (`remoteScreen: "tiles"`, default) or none until the right password is typed (`"typed"`, like Network Level Authentication). A blocked PC is listed marked "remote sign-in off". A claim (unlocked screen) is physical and refused through a foothold. Once in, Open shows the desktop from the view.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| remote | policy | `allowed` or `blocked` (SCH:273) | allowed |
| remoteScreen | policy | `tiles` or `typed` (SCH:274; NA:893-905) | tiles |
| host | object | PC's network label and desktop taskbar name (SCH:5525) | its `name` |
| loginPicker | object | which tiles show (existing sign-in field) | accounts |

**Example.** In the worked example for this group (section 5): policy `nla` and `hardened`, object `lobby_pc` with `"policy": "nla"`:
```json
"policies": { "nla": { "remote": "allowed", "remoteScreen": "typed" }, "hardened": { "remote": "blocked" } }
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: `POST /login` with `foothold` requires `host_reachable_through?` (reach), then host service on, then `remote != blocked`: game.rb:3449-3458; message "Remote sign-in is turned off on this PC" (NA:1091). Claims through a foothold are refused: game.rb:3519, 3589.
- Server: `GET /login_accounts?foothold=` judged by reach, policy and power; headless hosts and `typed` answer 200 with an empty list; never the sticky note: NA:911-934, 949-968; GC:1586-1594.
- Server: desktop fetch through a foothold: `desktop_request_allowed?` (NA:1495-1520); a session whose route is lost stays recorded but is refused (`session_route_up?`, NA:1158).
- Client only: the screens and tile drawing (network-view-minigame.js, pc-sessions.js).
**Events.** `network_host_opened` (network-view-minigame.js:874) when a host opens; sign-in events belong to the sessions system (not verified here).
**Validator.** `scripts/validate_scenario.rb:7779-7810`: warns "policy ... sets remoteScreen but remote is 'blocked'"; info line when `tiles` is set and no PC under it can show tiles. `VN:436` errors on a `remote` value other than allowed/blocked. `VN:629` warns on a remote-only host under a `maxAttempts` lockout.
**Shown in.** `remote:` / `remoteScreen`: `test_access_networks` (best demo: policies `hardened`, `counted`, `kiosk_locked`, `nla`), `test_access_keyring`, `demo_access_tour`. (The `"networks"` and `"remote"` keys in `ca20_remote_and_mobile_working*` belong to another feature.)
**Known limits.** The outage global is client-synced, so an outage is a soft gate (NA:1105-1124). No backlog entry for remote sign-in itself.
**Plan vs code.** README:1070-1072 "remote sign-in screen" matches NA. None found.
**Unverified.** None for the scenario list (grep of `"remote"`/`"remoteScreen"` keys, 2026-11-18).

### N3 Headless hosts
**One line.** A sign-in object with `headless: true` has no screen or keyboard and can be signed in to only through a foothold.
**Key fields.** `headless` (object, with `lockType: "login"`), `network`.
**What the player sees.** Walking up to it shows only its observations. In the network view it has a host row; the remote sign-in screen shows no account tiles. Its desktop opens only from the view.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| headless | object | sign-in object with no screen/keyboard (SCH:5536) | false |

**Example.** Object `door_box` In the worked example for this group (section 5):
```json
{ "type": "pc", "id": "door_box", "name": "Door controller", "host": "DC-01", "sprite": "network_rack1", "position": { "x": 4, "y": 3 }, "takeable": false, "locked": true, "lockType": "login", "headless": true, "access": { "roles": ["it"] }, "observations": "No screen." }
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: keyboard sign-in refused as unreachable (game.rb:3459); claims refused (3523, 3593); keyboard desktop request refused (NA:1514); remote tiles empty (NA:954-957; game.rb:4454).
- Client only: the click shows observations only.
**Events.** none specific.
**Validator.** `VN:267` error: headless on a non-login object; `VN:271` no network; `VN:273` headless host that is a workstation with an owner; `VN:629` remote-only host under `maxAttempts`.
**Shown in.** `test_access_networks` (best demo: `door_box`), `demo_access_tour`, `lab_physical_pentest`.
**Known limits.** No backlog entry.
**Plan vs code.** none found.
**Unverified.** Exact wording of the click behaviour in the client.

### N4 File shares, open and protected
**One line.** A `resources` entry of kind `file_share` on a network holds items; an open share is served to any foothold that reaches it, an access-listed share to a session whose identity the list admits, and is mapped on the desktop.
**Key fields.** `resources.<id>` (top level): `kind`, `name`, `host`, `network`, `access`, `contents`, `observations`, `offWhen`, `object`.
**What the player sees.** The network view lists the share (a row with Open, or Look for a share with no contents). Opening shows its files; takeable files can be copied or moved subject to `transfer`. On a desktop, a share the signed-in account is allowed appears as a `network_share` folder named `Name (\\host\Name)`.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| kind | resource | `file_share`, `printer` or another label (SCH:359) | none |
| name, host | resource | labels; the desktop folder shows `name (\\host\name)` (NA:1665-1667) | none |
| network | resource | a `networks` key; a resource without one is never listed (SCH:359) | none |
| access | resource | access list `{ roles, people }`; absent means open (NA:1569) | open |
| contents | resource | file_share only; items with global ids (SCH:362) | none |
| observations | resource | text for a resource with no contents (SCH:362) | none |
| offWhen | resource | resource-level outage (SCH:363) | never down |
| object | resource | room object the resource ties to (SCH:364) | none |

**Example.** `open_share` and `vault` In the worked example for this group (section 5):
```json
"resources": {
  "open_share": { "kind": "file_share", "name": "Public", "host": "OFF-FS01", "network": "office_lan",
    "contents": [ { "type": "text_file", "id": "open_note", "name": "notice.txt", "takeable": true, "readable": true, "text": "Open share notice.", "observations": "A notice." } ] },
  "vault": { "kind": "file_share", "name": "Vault", "host": "SV-FS02", "network": "server_net", "access": { "roles": ["it"] },
    "contents": [ { "type": "text_file", "id": "vault_note", "name": "vault.txt", "takeable": true, "readable": true, "text": "Vault note.", "observations": "A note." } ] }
}
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: `resource_admits_player?`: a held foothold reaches an open share's network, or a held session at a host reaches the network and the list admits the identity; an open share is reached from a session only on its own network, never across a link: NA:1580-1628. A share down (own or network `offWhen`), listed-only, or with no network is not served: NA:1581-1590.
- Server: `GET /container` for a share is refused exactly as an invented id is when not admitted: GC:628-635. Items taken go through `resource_item_for_add` (NA:1723+).
- Server: shares are mapped only for sessions, sorted by id; a relay desktop maps nothing: NA:1631-1658.
- Client only: the row and desktop drawing.
**Events.** `network_host_opened` with `kind` (network-view-minigame.js:874).
**Validator.** `VN:442` contents on a non-share; `VN:447` contents not a list; `VN:480` sign-in object inside contents; `VN:497` id clashes; `VN:508-515` bad access list, unknown person, role no NPC holds; `VN:533` NPC password inside a name/host/observations string; `VN:564-582` access list and no contents, nothing maps it, admits no account; `VN:426` warns on an open share with contents on a network that starts down.
**Shown in.** `test_access_networks` (best demo), `test_access_devices`, `demo_access_tour`, `lab_physical_pentest`, `test_access_work`, `test_access_social`.
**Known limits.** A share with no contents is listed only. No backlog entry.
**Plan vs code.** none found.
**Unverified.** `transfer` rules on items inside shares (not read).

### N5 Unplugging ends the sessions run through it
**One line.** Unplugging a device deletes its foothold, its link item and every session opened through it, and returns the box to the tray.
**Key fields.** none authored; `POST /network/unplug`. The Unplug button is in the network view opened at the jack.
**What the player sees.** Unplug in the view (only when opened at the jack). Open remote desktops close and the sign-ins are gone.
**Fields.** none (no scenario fields).
**Example.** n/a (behaviour of any N1 jack).
**Server enforces / client only.**
- Server: `unplug_device!` requires the jack, a planted foothold (422 `not_planted`) and reach (403): NA:290-302. It removes the foothold, the link item, returns the device, and returns `endedPcIds` (sessions with that foothold, plus `from` sessions pruned): NA:304-326, 410-416.
- Client: removes the foothold, applies the inventory delta, emits `network_device_unplugged`: NL:560-593.
**Events.** `network_device_unplugged` (jackId, footholdId, endedPcIds, tokenExpiredPcIds); `<jackId>_planted` false.
**Validator.** none specific.
**Shown in.** `test_access_networks` (best demo), `test_access_devices`, `demo_access_tour`.
**Known limits.** Only jacks unplug; an access point or implant foothold cannot be removed. No backlog entry.
**Plan vs code.** none found.
**Unverified.** none.

### N6 Pivot via networkLinks
**One line.** `networkLinks` joins two networks; a foothold reaches the linked network only once the player holds a session on a host of a reached network.
**Key fields.** `networkLinks` (top level).
**What the player sees.** After signing in to a host that sits on a network linked to a second one, the view gains a block for the second network "through <host>". Sign out of the pivot host, or lock it, and the block goes (or greys).
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| networkLinks | top level | list of two-item lists of network ids; undirected (SCH:341-347; NM:149-161) | none |

**Example.** Worked example (section 5): `"networkLinks": [ ["office_lan", "server_net"] ]`. Validated.
**Server enforces / client only.**
- Server: `player_reach` walks to a fixed point from the foothold's own network, crossing a link from a reached, up network on which a session host stands, skipping a host that is off or locked: NA:1194-1285. `prune_unreachable_sessions!` ends onward sessions when the pivot goes: NA:1446-1472. Views draw `structural_reach`, so a locked pivot still names the bridge: NA:795-811, 855-870.
- Client: draws the blocks.
**Events.** `network_viewed` per network block; `network_view_closed` (`link_dropped`).
**Validator.** `VN:345-356` list shape, self-link, unknown network; `VN:375` warning "network ... is reachable only by pivoting over a link, but no network on the way to it has a sign-in host ..."; `VN:390` warning for more than 8 link paths between two networks (cap `NM:REACH_PATHS_CAP`).
**Shown in.** `test_access_networks` (best demo), `test_access_keyring`, `demo_access_tour`.
**Known limits.** Only the first 8 simple paths are used (NM:REACH_PATHS_CAP). Backlog `docs/IDEAS_BACKLOG.md:234-243` lists open review items for 9.3b slices (not itemised here).
**Plan vs code.** Plan says a pivot is "Sign out shrinks reach" (9.3B plan N4): matches code. README:1152 on the graph matches code; backlog:239 is stale (see Dungeon-graph treatment).
**Unverified.** none.

### N7 Outages
**One line.** `offWhen` on a network, a resource or a sign-in object makes it unavailable while a global holds; held sessions are kept but shown no route.
**Key fields.** `networks.<id>.offWhen`, `resources.<id>.offWhen`, object `offWhen` (all the requireGlobal form).
**What the player sees.** A down network's hosts leave the view and its shares are not served; a session already held there greys to "no route" and returns, with no new password, when the global clears. A host that is off answers "PC not responding" (remote) or "This PC is off." (keyboard).
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| offWhen | network | global name (truthy) or `{ name: value }` (SCH:327) | never down |
| offWhen | resource | same (SCH:363) | never down |
| offWhen | object | on a sign-in PC governs the player too (SCH:5509) | never off |

**Example.** Worked example (section 5): `"server_net": { "name": "Server network", "offWhen": "servers_offline" }` and `sv_fs02` with `"offWhen": "servers_offline"`. Validated.
**Server enforces / client only.**
- Server: `network_up?` (NA:1125), `resource_down?` (NA:1140), `host_service_off?` (NA:981) read the server's copy of the globals; `session_route_up?` refuses scoped requests over a lost route (NA:1158-1190). Truthiness: `NetworkModel.truthy?` (NM:259).
- Soft gate: the global is client-synced, so a tampered client can clear it (NA:1111-1119).
**Events.** `network_view_closed` (`link_dropped`).
**Validator.** `VN:404` offWhen shape; `VN:409` warns "networks.X.offWhen names 'g', which is not declared in globalVariables"; `VN:426` open share on a down-at-start network; validate_scenario also warns "object 'sv_fs02' offWhen 'g': nothing in the scenario sets it ...".
**Shown in.** `offWhen` also used by `m01`...`m10`, `test_access_work`, `office_life_showcase`, `test_needs_sims`, `test_access_social` (mostly object-level); networks/resources: `test_access_networks` (best demo, `servers_offline`), `lab_physical_pentest`.
**Known limits.** `docs/IDEAS_BACKLOG.md:239` says the view does not refetch every five seconds and a pre-sign-in globals sync is not built. Outage is not a security boundary.
**Plan vs code.** Plan 9.3B N5 expected 403 "unreachable" for a down-by-default network; code matches. `downIf` was renamed `offWhen` (SCH:327 "was downIf"; a bare name keeps the old meaning).
**Unverified.** Which of the m01-m10 uses are network-related (those are object-level for office life).

### N8 Wi-Fi join and rogue AP
**One line.** A network with a `wifi` block is joined at a `wifiAp` object with the key; a planted pocket rogue AP (`wifiTwin`) opens a Recon/Clone/Log console.
**Key fields.** `networks.<id>.wifi { ssid, psk }` (top level); `wifiAp` (object); `wifiTwin`, `apScan`, `apPortal`, `apCaptureLog` (object, on the planted device).
**What the player sees.** Click an access point: an open network joins at once; a keyed one opens a key prompt (password minigame in join mode). A wrong key changes nothing. A join gives a foothold "Wi-Fi: <network>" and opens the view. The rogue AP console (opened by clicking the planted device) shows a scan, lets the player clone an in-scope SSID with a portal page, and reads back log lines when authored globals become true.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| wifi.ssid, wifi.psk | network | in-game SSID and key; `psk` absent or `""` is open (SCH:328; NM:wifi_of) | none |
| wifiAp | object | access point on its network, which must have a `wifi` block (SCH:5545) | false |
| wifiTwin | object | planted rogue AP; click opens console (SCH:5546) | false |
| apScan | object | rows `ssid`, `security`, `signal` 0-4, `clients`, `inScope`, `refusal`, `cloneGlobals`, `cloneLog`, `knownClients` (SCH:5547) | none |
| apPortal | object | `{ templates: [{ id, label, setGlobals, page }] }`; page rendered by the landing-page builder in build mode (SCH:5586) | none |
| apCaptureLog | object | array of `{ global, text, npcId? }`, each line shown once its global is true (SCH:5638) | none |

**Example.** Access point In the worked example for this group (section 5) (`guest_ap`, network `guest_wifi` with `"wifi": { "ssid": "Example-Guest", "psk": "seabreeze-2025" }`):
```json
{ "type": "pc", "id": "guest_ap", "name": "Guest access point", "sprite": "lw_staff_ap", "position": { "x": 2, "y": 2 }, "takeable": false, "wifiAp": true, "network": "guest_wifi", "observations": "An access point." }
```
Validated in the N1 to N11 worked example (section 5). The rogue AP below was validated by adding it, a `planter_fig1` plant (`lobby_plant`) and the globals `ap_twin_staff`, `ap_portal_account` and `kim_twin_captured` (all `false`) to the lobby of that example: 0 errors, plus a plant-hiding warning that the room has no `lighting.emitters` entry for `planted_rogue_ap`, so its LED would not show. The kit item:
```json
{"type": "rogue_ap", "sprite": "rogue_ap", "id": "kit_rogue_ap", "name": "Pocket rogue AP", "takeable": true, "droppable": false, "observations": "A pocket rogue access point.", "hideable": {"rooms": ["lobby"], "spots": "plants", "device": "planted_rogue_ap", "overlay": {"sprite": "rogue_ap_tucked"}, "confirm": "Hide the rogue AP in this plant?"}}
```
The console object (it has `hiddenWith` and no `position`):
```json
{
 "type": "pc",
 "id": "planted_rogue_ap",
 "name": "Planted rogue AP",
 "sprite": "rogue_ap_planted",
 "hiddenWith": "kit_rogue_ap",
 "takeable": false,
 "interactable": true,
 "active": true,
 "wifiTwin": true,
 "observations": "Your rogue AP, tucked into the plant.",
 "apScan": [
  {
   "ssid": "Example-Staff",
   "security": "WPA2",
   "signal": 4,
   "clients": 2,
   "inScope": true,
   "cloneGlobals": {
    "ap_twin_staff": true
   },
   "cloneLog": "Copy of Example-Staff up (open). Waiting for someone to pick it.",
   "knownClients": [
    {
     "npcId": "sam",
     "label": "Sam's laptop"
    }
   ]
  },
  {
   "ssid": "Cafe-Next-Door",
   "security": "WPA2",
   "signal": 1,
   "clients": 1,
   "inScope": false,
   "refusal": "Out of scope. The cafe is not the client."
  }
 ],
 "apPortal": {
  "templates": [
   {
    "id": "staff_signin",
    "label": "Sign-in page",
    "setGlobals": {
     "ap_portal_account": true
    },
    "page": {
     "brands": [
      {
       "id": "example",
       "name": "Example Ltd",
       "look": "generic",
       "realDomain": "example.test",
       "domains": [
        {
         "id": "d_wifi",
         "domain": "wifi-login.example",
         "trick": "unrelated",
         "tier": 0
        }
       ]
      }
     ],
     "purposes": [
      {
       "id": "wifi",
       "label": "Sign in",
       "button": "Sign in"
      }
     ],
     "wordings": [
      {
       "id": "w_signin",
       "match": true,
       "text": "Example-Staff now uses staff accounts. Sign in to reconnect."
      }
     ],
     "fields": [
      "email",
      "password"
     ],
     "fieldLabels": {
      "email": "Username"
     },
     "choices": {
      "brand": "example",
      "purpose": "wifi",
      "domainId": "d_wifi",
      "wording": "w_signin",
      "fields": [
       "email",
       "password"
      ],
      "logo": true,
      "padlock": false
     }
    }
   }
  ]
 },
 "apCaptureLog": [
  {
   "global": "kim_twin_captured",
   "text": "Sam's laptop joined the copy; sign-in page submitted.",
   "npcId": "sam"
  }
 ]
}
```
The full demo is `scenarios/test_access_devices/scenario.json.erb:85-215`.
**Server enforces / client only.**
- Server (join): `find_wifi_ap` needs a `wifiAp` object on a defined network with a `wifi` block; reach check; the key is compared on the server; wrong key 422 `wrong_key` and counts nothing; one foothold `wifi_<network>` per network; a second AP records the AP in `gainedFootholds`: NA:338-408. `unlock_object` on an AP is met once joined: game.rb:5242-5246.
- Server (rogue AP): only that the device's console fields are listed as `DEVICE_DATA_FIELDS` (capture_proofs.rb:19). The console writes globals through `writeGlobal` on the client; the server does not check that the globals were earned.
- Client: confirm/prompt flow (NL:603-700, interactions.js:984-992); rogue AP console `rogue-ap-minigame.js`, model `rogue-ap-model.js`.
**Events.** `network_joined`, `network_foothold_gained` (via `wifi`). The rogue AP console reports `onComplete(true, { ssid, templateId })` or `onComplete(false, { closed: true })` (rogue-ap-minigame.js:14-16); no named dispatcher event found.
**Validator.** `VN:284-319` wifi shape, empty/whitespace psk, short psk warning (<8), psk readable nowhere warning; `VN:331-338` wifiAp with no network, no wifi block, sign-in object, jack, or lock. `apScan`, `apPortal`, `apCaptureLog` are schema-checked only (SCH:5547-5650); I found no semantic validator for `wifiTwin` in `scripts/`.
**Shown in.** `wifiAp`: `test_access_networks` (best demo for join), `test_access_devices`, `demo_access_tour`, `lab_physical_pentest`. `wifiTwin`: `test_access_devices` (best demo), `demo_access_tour`, `lab_physical_pentest`.
**Known limits.** The rogue AP does not give a foothold: it writes globals and reads capture logs only. No backlog entry for Wi-Fi in particular; `docs/IDEAS_BACKLOG.md:228` is the device pitch (not built).
**Plan vs code.** none found beyond the table.
**Unverified.** Behaviour of the key minigame in join mode; the rogue AP console was not live-tested.

### N9 Port security
**One line.** `portSecurity: true` on a jack makes the switch refuse every device: no foothold, the device stays in the inventory, and a message names the fix.
**Key fields.** `portSecurity`, `portSecurityMessage` (object, on a jack).
**What the player sees.** The confirm and plant go ahead, then the toast shows the message (default "This switch port only takes known machines. Unused ports like this one should be disabled."). The box stays in the tray.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| portSecurity | jack | refuse unknown device (SCH:5652) | false |
| portSecurityMessage | jack | refusal line; needs `portSecurity` (SCH:5653) | NA:80 default |

**Example.** `secured_port` In the worked example for this group (section 5):
```json
{ "type": "pc", "id": "secured_port", "name": "Secured port", "sprite": "network_rack1", "position": { "x": 6, "y": 3 }, "takeable": false, "networkJack": true, "portSecurity": true, "portSecurityMessage": "This port only takes known machines.", "observations": "A secured port." }
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: `plant_device!` runs `port_security_refusal` after the reach check and before touching the inventory; 422 `reason: 'port_security'`: NA:111-116, 243-247.
- Client: toast and `network_device_refused` (NL:431-438).
**Events.** `network_device_refused` (`reason: port_security`).
**Validator.** `VN:78` error: portSecurity on a non-jack; `VN:81` error: message without `portSecurity`; `VN:83` warning: blank message; `VN:87` error: both `portSecurity` and `wifiAp`.
**Shown in.** `test_access_networks` (best demo), `test_access_devices`, `demo_access_tour`, `lab_physical_pentest`.
**Known limits.** Only refuses; no bypass (NA:241-243 comment). No backlog entry.
**Plan vs code.** none found.
**Unverified.** none.

### N10 Implants
**One line.** A `grant_foothold` action gives a foothold on a sign-in PC's own network: from a device the player plugs into a PC they hold a session on (held-device and needs-a-session variant, also the BadUSB), or from a device the player dropped that an NPC then uses (dropped-device variant).
**Key fields.** `grant_foothold` action: `pc`, `needsSession`, `needsHeld`, `needsDropped`, `name`; item `usbClass`; policy `usb`.
**What the player sees.** In the needs-a-session shape the player holds a session at the PC, uses a device (for example the keystroke injector) on an object near it, confirms, and a link item "Keystroke injector: <room>" arrives; the device is used up. In the dropped shape a USB stick the player dropped is picked up by an NPC, and a timer or beat grants "USB stick: <room>". Neither opens an account: it is a foothold only.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| pc | action | sign-in PC whose network the foothold reaches (SCH:987) | required |
| needsSession | action | player must hold a non-foothold session there and carry `needsHeld`; the server removes the device (SCH:989) | false |
| needsHeld | action | device by id, type or name (id preferred); its host object must not set `consumesItem` (SCH:990) | none |
| needsDropped | action | id of an item the player has dropped (SCH:988) | none |
| name | action | link item label (SCH:991); a `linkName` on the PC also wins | "Keystroke injector: <room>" or "USB stick: <room>" (NA:550-583) |
| usbClass | item | `hid`, `storage` or none; the PC's `usb` policy can refuse it (AccessWork.plant_refused?) | none |

**Example.** `usb_spot` In the worked example for this group (section 5) (the `kit_badusb` item is there too):
```json
{ "type": "notes", "id": "usb_spot", "name": "Lobby PC USB port", "position": { "x": 4, "y": 6 }, "takeable": false, "requiresItem": "kit_badusb",
  "triggerOnInteract": [ { "type": "confirm_action", "text": "Plug the injector into the lobby PC?", "confirmLabel": "Plug it in", "cancelLabel": "Leave it",
    "onConfirm": [ { "type": "grant_foothold", "pc": "lobby_pc", "needsSession": true, "needsHeld": "kit_badusb" } ] } ] }
```
Validated In the worked example for this group (section 5). The dropped shape (README:1180), validated on a `timers` entry in the N1 to N11 example with a droppable `kit_stick` item in the lobby: `{ "type": "grant_foothold", "pc": "door_box", "needsDropped": "kit_stick", "name": "USB foothold: door controller" }`.
**Server enforces / client only.**
- Server: only a grant_foothold declared on a server-run path counts (`NM:grant_foothold_actions`, NM:213-228). `implant_foothold!` (NA:468-548): the action for [pc, shape] must exist; PC must be on a network; session shape needs a non-remote session (not a claim, relay or `from`), the held device (not client-forged), and a USB policy that does not refuse it (422 `usb_refused`); dropped shape needs the id in `droppedItems`; one foothold `implant_<pc>`; repeat answers `already`; the device is removed. An implant on a PC that is switched off reaches nothing: NA:993-998.
- Not checked: reach to the PC (the implant route does not call `object_reachable?`; the action must come from a declared path, which is the gate).
- Client: `apply-actions.js:446-458` calls `networkLinks.implant` (NL:469-545, one retry; dropped shape waits for `not_ready`).
**Events.** `network_foothold_gained` (via `implant`), `network_device_refused` (`usb_refused`, with `pcId`).
**Validator.** `VN:705` action on a path the server does not run; `VN:712/714` both or neither of `needsDropped`/`needsSession`; `VN:719` pc not a network sign-in PC; `VN:723` two grants with the same pc and shape; `VN:731` needsSession without `needsHeld`; `VN:733` `needsHeld` names no item; `VN:737` needsSession on the PC it targets; `VN:741` host sets `consumesItem`; `VN:748` device has no id; `VN:754` warning when the PC's USB policy refuses the device.
**Shown in.** `test_access_networks` (best demo, BadUSB at `sam_pc`), `demo_access_tour`. No other scenario uses `grant_foothold`.
**Known limits.** `docs/IDEAS_BACKLOG.md:240` lists open minors/nits from the 9.3b I review R3 (not itemised here).
**Plan vs code.** README (the networks table and the Implants section) now gives the code's `name` default; the code defaults to "<device word>: <room>" ("Keystroke injector: ...", "USB stick: ..."), NA:550-583. Plan (9.3B plan:105) names a BadUSB trigger as N12 in the beat table (line 792); the code has no separate BadUSB feature, it is the `needsSession` shape.
**Unverified.** The dropped-device flow on the NPC side (which behaviour makes an NPC use the stick).

### N11 Patch panel
**One line.** An object with `panelPorts` opens a 24-port patch panel; a port with a jack plants the player's box through the usual jack flow.
**Key fields.** `panelPorts` (object), `panelOf` (jack).
**What the player sees.** Clicking the cabinet opens a port grid with a legend (D data, V voice, G guest, M managed). A listed port with a jack is clickable and plants like a wall jack; a planted port opens the box's view; a port with no jack says "Nothing at the other end." A locked panel goes through the normal unlock first.
**Fields.**

| field | where | meaning | default |
|---|---|---|---|
| panelPorts | object | list of `{ port 1-24, label (max 3 chars), desk, jack }` (SCH:5543) | none |
| panelOf | jack | id of the panel in the same room; jack has no sprite or position (SCH:5542) | none |

**Example.** `panel1` and `panel_voice` In the worked example for this group (section 5):
```json
{ "type": "notes", "id": "panel1", "name": "Patch panel", "position": { "x": 3, "y": 3 }, "takeable": false,
  "panelPorts": [ { "port": 1, "label": "D", "desk": "Desk 1", "jack": "panel_voice" }, { "port": 2 } ], "observations": "A patch panel." },
{ "type": "pc", "id": "panel_voice", "name": "Panel voice port", "networkJack": true, "panelOf": "panel1", "network": "office_lan", "takeable": false, "observations": "A voice port." }
```
Validated In the worked example for this group (section 5).
**Server enforces / client only.**
- Server: `panel_unlocked?`: a `panelOf` jack is reachable only if the panel's locks and containers are open: NA:131-137. Plant, unplug and port security run through the same server routes as any jack.
- Client: the minigame `patch-panel-minigame.js` (plants through `networkLinks.interactJack`), model `patch-panel-model.js`; interactions.js:995+ opens it, after the unlock flow for a locked panel.
**Events.** `network_device_refused` from the panel (patch-panel-minigame.js:252); plant/unplug events as N1.
**Validator.** `VN:152` panelOf names no object in the room; `VN:154` panel does not list the jack; `VN:156` panelOf jack has a sprite; `VN:157` has a position; `VN:158` not a networkJack; `VN:165-189` panelPorts not an array, duplicate port or jack, jack missing or not a jack, jack's `panelOf` names another panel.
**Shown in.** `test_access_devices` (best demo), `demo_access_tour`, `lab_physical_pentest`.
**Known limits.** No backlog entry. The view does not show `desk` anywhere I verified.
**Plan vs code.** README:1056-1063 matches schema. None found.
**Unverified.** Which minigame legend rule decides V/G/M colours (`vlanClass`).

### N12 Resource and host rows in the network view (additional)
**One line.** `GET /network` lists, per held foothold, host rows (sign-in objects) and resource rows on each reachable network, with greyed blocks for networks the player held a session on that are now down.
**Key fields.** `host` (object), `sprite` (object), resource `name`, `host`, `observations`.
**What the player sees.** Blocks per network ("through <host>" for a pivot), host rows (name, host label, Sign in, Open if a session is held, Locked marker, "not responding"), resource rows (Open or Look).
**Fields.** none beyond N2/N4.
**Example.** n/a.
**Server enforces / client only.** Server builds the view from its own records: NA:746-777, 795-835, 1043-1090. Client draws it (network-view-minigame.js).
**Events.** `network_viewed`, `network_host_opened`.
**Validator.** `VN:592` warns when two hosts share one label; `VN:601` warns about physical items on a host desktop.
**Shown in.** all of the above.
**Known limits.** No five-second refetch (`docs/IDEAS_BACKLOG.md:239`).
**Plan vs code.** none found.
**Unverified.** Client drawing details.

### N13 Discovery, hosts and services
**One line.** A network with `discovery: "scan"` shows no host or share rows in the network view until the player sweeps it; a top-level `hosts` map adds devices that have no sign-in (a printer, a camera recorder); a host's `services` list shows once the player scans that host. `POST /network/scan` does both.
**Key fields.** `networks.<id>.discovery`: `"open"` (default, and the meaning of an absent key) or `"scan"`. Top-level `hosts.<id>` (server-only): `name` and `network` (a `networks` key) required, optional `sprite` (a PNG in `assets/objects/`), `offWhen` (a global that powers the device down) and `services`. `services` (at most 8 per host, at most 64 hosts with services) on a `hosts` entry or on a sign-in object only: `name` (an id of at most 40 characters, unique on the host), `port` (1 to 65535, display only), `product` and `version` (plain text, up to 40 characters), optional `label`. `weaknesses` and `decoys` are N14 and `grants` and `techniques` are N15; the optional `cli` block is not declared in the schema yet.
**What the player sees.** On a discovery network the view lists the block with a Sweep control and no rows. A sign-in the player already holds a session on is listed anyway, alone, until the sweep. After the sweep every host, device and share of that network is listed, with no services. Each host or device row offers Scan; a scan adds one tile per service (name or label, port, product, version) and the Scan control goes. A powered-down device shows "not responding" and cannot be scanned. A network that is not a discovery network lists its rows at once and offers Scan on them, and no Sweep.
**Fields.** `hosts` is withheld from the bootstrap and `services` from room data, so a scenario that names them leaks nothing to a browser that has not earned them. `hosts` ids share one id space with room object ids and `resources` keys.
**Example.** A fragment, validated in `scenarios/test_ops_scan`:
```json
"networks": { "office_lan": { "name": "Office network", "discovery": "scan" } },
"hosts": {
  "printer01": { "name": "Second floor printer", "network": "office_lan", "sprite": "pnw_portable_printer1",
    "services": [ { "name": "print", "port": 9100, "product": "Inkvale JetServe", "version": "1.4" } ] }
}
```
**Server enforces / client only.** The server answers every request from its own record (`app/models/break_escape/network_ops.rb`, `network_access.rb`, `games_controller.rb` `network_scan`): a sweep needs a held foothold whose reach holds the network and that network to be `discovery: "scan"`; a host scan needs the host on a reached network that is open or swept. A real id the player has not earned is answered as an invented one: one 404, `{ "success": false, "reason": "not_found" }`. The other refusals: 400 `bad_request` (malformed), 422 `not_needed` (an open network, or a host with no services), 403 `not_responding` (a powered-down device). A repeat answers `already: true` with the same rows. What was swept and scanned is `opsDiscovered` in the server's game state (`networks` and `hosts` lists): server-owned, never in a sync body, never sent whole. Discovery governs only what the view lists: sign-in, desktops and `GET /container` answer for a host or share by their own rules whether or not it has been swept. The client (`network-view-minigame.js`, `ops-model.js`) only draws the answers.
**Events.** `network_swept` (`networkId`) and `network_host_scanned` (`hostId`), each also as `<name>:<id>`. Server log events `network_swept` and `host_scanned` (a source with no `where` can list them; a repeat of a sweep merges into one row with a count).
**Validator.** `scripts/validate_network_ops.rb` (`check_network_ops`, called from `validate_scenario.rb`): a `hosts` key too long, not an id, or also a room object or resource id; a host with an unknown network or a sprite with no PNG; `services` on an object that is not a sign-in object; a service name used twice, more than 8 services, more than 64 hosts with services; `discovery: "scan"` on a network with a Wi-Fi block or a jack and no host; a password inside a host name, product, version or label; with `logSources`, an id longer than 40 characters, which includes the foothold id the server builds from it: a jack id over 35, a Wi-Fi network id over 35 or an implantable PC id over 32 characters (the built ids `jack_<id>`, `wifi_<network>`, `implant_<pc>` must fit). Warnings: services on an open network where nothing has a weakness (scenery is allowed); a product that holds a name from `scripts/real_product_names.txt`. `NETWORK_OPS_BUILT` has N13, N14 and N15 built. `validate_network.rb` also counts a `hosts` device as something a network carries and warns when a device and a sign-in object share one label.
**Dungeon graph.** A discovery network's node gains the line "(sweep to list)"; a `hosts` device is a `host_<id>` container with an `exposes` edge from its network. Discovery adds no lock in front of a host.
**Check from the server.** `verify-run.rb <game_id> --access` prints the `opsDiscovered` line (networks, hosts, ids in id order). `access-leak-check.rb` reads host, share, product, version, label, address and range strings (`collect_ops_secrets`) and reports one seen before the sweep, scan or listing that earns it.
**Shown in.** `test_ops_scan` (an open guest network, a discovery office network with a share, two devices and two sign-in hosts, a linked discovery plant network reached by signing in at the file server). Its `PLAYTEST.md` is the scripted run.
**Known limits.** No weakness, check or finding in this feature (see N14) and no technique or card (N15). The optional `cli` display block is not declared in the schema yet, so no scenario can author one. A sweep needs no tool.
**Plan vs code.** `docs/achitechture/OPS_CORE_PLAN.md` sections 4.1, 5 to 6, 9 and 11.4.

---

### N14 Findings: check and confirm
**One line.** A scanned service can hide weaknesses (what is really wrong) and decoys (things that look wrong and are not). The player checks a service to list what it might have, then confirms each finding to learn whether it is real, what a real one needs and why a false one is false. Nothing in the list tells a real finding from a decoy until it is confirmed.
**Key fields.** On a service of a `hosts` entry or a sign-in object, `weaknesses` and `decoys` (each at most 4, at most 128 findings in the scenario). A weakness: `id` (unique among the service's weaknesses and decoys; it rides inside the finding id `<hostId>.<service>.<id>`), `class` (`default_creds`, `unpatched`, `misconfig`, `weak_auth` or `cleartext`), `severity` (`low`, `medium`, `high`), optional `summary` (plain text; with none the view shows one line per class), optional `needs` (a `credential` from the registry, an `item` or an `itemType` with a `label`, and a `global` with a `label`), optional `fixedIf` (a global that, once set, marks a confirmed finding Fixed). A decoy: the same `id`, `class`, `severity` and `summary`, and a required `falseBecause`. The server and the leak scanner read a `realism: "<catalog id>"` link, which would tie a catalog entry whose command-line wording the finding shows as `cli` (see the skin plan; the catalog files are not part of this feature); the schema does not declare `realism` yet, so no scenario can author one until the skin plan lands (an unknown-property error, as for N13's `cli`). `grants`, `needs.session` and `techniques` belong to N15 (below).
**What the player sees.** Each scanned, responding host row offers Check on its service tile. Check lists that service's findings as tiles with a short alias (`f1`, `f2`, in the order the player found them, across the whole game), a class, a severity and a summary, each marked unconfirmed, and a Confirm control. Checking again changes nothing and keeps every alias. Confirming a real weakness shows its needs, each with a tick or a cross, recomputed whenever the view is read, and "Fixed" while its `fixedIf` global holds. Confirming a decoy shows it as false with its `falseBecause` text. A weakness whose `fixedIf` already holds when the service is first checked is not listed at all.
**What is sent, and when.** Before a check: nothing about findings, and not that any exist. After a check: `id`, `alias`, `hostId`, `service`, `class`, `severity`, `summary`, `status`, in that order, the same keys for a weakness and a decoy, plus `cli` for a finding with a resolving link. After a confirm: a real finding adds `needs` (`kind`, `label`, `met`; never a password, a credential's secret or a global's name) and, while its fix holds, `fixed: true`; a decoy adds `falseBecause`. Never sent at all: `fixedIf` and any tie between a finding and a global, `grants`, a `realism` link id, the catalog, and any catalog entry the scenario does not link. A global's name still reaches the browser where the world already carries it: the bootstrap's declared globals, and a room object's own trigger that sets it; it is never in a finding row.
**Server enforces / client only.** `POST /network/check` (`foothold`, `host_id`, `service`) and `POST /network/confirm` (`foothold`, `finding_id`) answer from the server's record (`network_ops.rb` `check_service!`, `confirm_finding!`, `games_controller.rb` `network_check`, `network_confirm`). A check needs the host listed, scanned and responding and the service on it; a confirm needs the finding held (so already checked) and its host listed. An id the player has not earned, real or invented, gets the one 404 `{ "success": false, "reason": "not_found" }`; a powered-down host is 403 `not_responding`; a malformed request is 400 `bad_request`. The findings the player holds are `opsFindings` in the server's game state (`{ "<findingId>": "<u|c|f><n>" }`: status letter and alias number), and the services checked are `opsDiscovered.services` (`"<hostId>.<service>"`): server-owned, never in a sync body, never sent whole. A repeat check answers `already: true` when it added nothing; a repeat confirm answers `already: true` and writes nothing. The view only draws the answers.
**Log events.** `service_checked` (once per service, the service as detail) and `finding_confirmed` (the finding's alias and its status, `confirmed` or `false`; once per finding), both at the host or PC, in an `ops` log source that lists them by name.
**Client events.** `network_service_checked` (`hostId`, `service`; also as `<hostId>.<service>`) and `network_finding_confirmed` (`findingId`, `status`; also as the finding id), for NPC lines and objectives. Both fire only on a successful answer.
**Validator.** `scripts/validate_network_ops.rb` (`network_ops_check_findings`): errors for an id used twice in a service, more than 4 of a kind or 128 in all, a `needs` that is empty or has an unknown credential, item, item type or global, an `itemType` or `global` need with no `label`, `fixedIf` naming an undeclared global or one that already holds with nothing able to change it, a weakness on a network no foothold can reach. Warnings: a finding id with a telltale word ("decoy", "fake", "real"), a client-writable `needs.global`, a summary that reads like a procedure, the same class and severity with no summary.
**Dungeon graph.** Each weakness draws a `weak_<findingId>` node of kind lock, marked "(report only)" when it grants nothing and "fixed if ..." when it has a fix, with an edge into it from the credential or item node it needs; a decoy is not drawn.
**Check from the server.** `verify-run.rb <game_id> --access` prints an `opsFindings` line (alias, finding id and status word, in alias order) and `opsDiscovered` shows the checked services. `access-leak-check.rb` (`collect_ops_secrets`) reports a finding's summary, class, severity and ids before its service's check, a decoy's reason and a real finding's need labels (strings not already in room text) before its confirm, and a catalog link id or an unlinked catalog module at any time; by structure, with no string test, it also reports a `services` key on a host that was never scanned, a finding row before its confirm that carries `needs`, `fixed`, `falseBecause` or a status other than `unconfirmed`, a `fixedIf`, `grants`, `realism`, `weaknesses` or `decoys` key anywhere, and a gating global's name inside a finding row (a global the room text already names is judged only there, and the check prints a note saying so).
**Shown in.** `test_ops_findings` (one discovery network: a printer whose admin page has a weakness needing a manual and a decoy, a file server with a fix switch, a camera recorder with only a decoy). Its `PLAYTEST.md` is the scripted run.
**Known limits.** A check or confirm grants nothing and uses no technique: sessions, grants, technique cards and `needs.session` are N15. A finding's `cli` needs a catalog entry (the catalog loader is built; the catalog itself belongs to the skin plan). Needs are shown as read at the moment of the request; there is no push when one changes.
**Plan vs code.** `docs/achitechture/OPS_CORE_PLAN.md` sections 4.2, 5.3, 7, 11.4 and 13.

---

### N15 Technique cards and technique sessions
**One line.** A technique card is a plain item in the tray that names a technique: what kind of weakness it works on, and optionally which product and versions. The player picks a card and a confirmed finding and uses the one on the other. If the card fits and the finding's needs are met, the weakness gives up what it `grants`: a session on the weak PC, or a saved connection in the keyring. Nothing is typed and no password is known.
**Key fields.** Top-level `techniques.<id>` (server-only; ids like other ids, at most 32 entries): `name`, optional `summary`, and `worksOn` with a required `class` (the same five words a weakness uses) and optional `product` and `versions` (a product and a list of versions that must equal a service's own; there is no version comparison). A card is an item of type `technique_card` with `technique_card: "<id>"`; it has no engine behaviour of its own, so holding it is having the card, and it can sit anywhere an item can (a room, a container, an NPC's hands, a share, the starting inventory). On a weakness, `grants` holds exactly one kind: `{ "session": { "account": "<npc id>", "access": "user" | "admin" } }` on a PC with a sign-in whose `access` list admits that account, or `{ "credential": "<credential id>" }` for a `saved_connection` credential whose `proof` is `{ "technique_card": "<finding id>" }` (the two name each other). A weakness with no `grants` is a finding to read; no card does anything with it. `needs.session: "user" | "admin"` makes a step up: a session already held on that same host (the weakness that grants the higher level needs the session the lower one gave).
**What the player sees.** The Techniques panel of the network view lists the cards the player holds, each with its name, summary and a works-on line (class, product, versions). The player picks a card (click or keyboard) and a finding on a host row, then Use; a card can also be dragged onto a finding. A finding of any status accepts a card: the server answers, and the view words the refusal. A grant shows the host, the account and the access level (an "Admin" tag at admin level). A session grant adds the PC's row an Open control, even where the host blocks remote sign-in. A PC the player holds by a technique session, and a jack device or implanted PC, is drawn in the world tinted light red with a small lightning bolt (no mark for a password, credential, claim or relay session); the mark is event-driven and gone when the session or foothold ends. Opening a technique session's desktop through a foothold shows it in a red frame headed "Remote view: <account> through <foothold name>" with a short wipe; closing it returns the player to where they were. Clicking the PC in the room, when its screen would only show the sign-in, opens that remote view instead.
**What is sent, and when.** The registry never leaves the server. `GET /network` gains a top-level `techniques` map (`<id>: { name, summary, worksOn, itemId }`) only for cards the player holds (`itemId` is the held item to send; where several held items carry one technique, the first by id), and no key at all when none is held. A technique id also rides on the card item wherever items ride. A grant answer carries `grant` and either the session answer (with `via: "technique"` and `footholdId`, and `access: "admin"` only at admin level) or `keyringChanged`. The host row carries the session with `via: "technique"` and `remote: true`; `access: "admin"` appears only at admin level (no key means user); `openHere: true` appears only in the view of the foothold the session came through, on a host that blocks remote sign-in (another foothold's view of that host lists no session and no Open). Never sent: the registry, a weakness's `grants`, the account or credential id before the grant happens, `needs.session`'s value, a technique id inside a finding row, and the finding id a session was granted by (the record's `technique` key).
**The route.** `POST /network/technique` with `foothold`, `finding_id` and `item_id` (strings, 1 to 200 characters; anything else is one 400 `bad_request` and writes nothing). The checks run in this order and the first failure answers: 404 `not_found` (the finding is not held, or its host not listed through that foothold, or the card is not a held, unforged item that names a registry entry: one body for all, no row); 403 `not_responding` (host off); an exact repeat (below); 422 `not_confirmed`, `false_positive`, `no_grant` (the weakness grants nothing that can be given; this comes before `fixed`, so a card on a fixed report-only finding is still `no_grant`), `fixed`, `wrong_class`, `wrong_product`, `wrong_version` (named in that order), `need_unmet` (the answer also carries `need: { kind, label }` for the first unmet need; a refusal body is `success`, `reason` and at most `need`, and `no_grant` has nothing else). The card is read from the scenario's own item definition, never the inventory copy a client sent. A repeat (a technique session for this finding through this foothold already exists, or a credential already used) is tested after the 404s and the host check and answers `already: true` with the live session or `keyringChanged: false`; it changes nothing, and is answered even when the weakness has since been fixed. A use through another foothold, or a use after the session ended, is a new use.
**The technique session.** It is an ordinary entry in `player_state.sessions[<pc id>]` with `via: "technique"`, the `foothold` it came through, `access` and `technique` (the finding that granted it). A PC holds one session at a time, so it replaces whatever was held, and a later sign-in replaces it. It differs from a password session: nothing was typed, so no sign-in log row is written (a `technique_used` row is); it cannot be locked; serving its desktop at the PC's own keyboard does not settle it, so it keeps its foothold; on a host with `remote: "blocked"` it is served only through its own foothold (the remote view), and the other refusals of a blocked host stay as they were (remote sign-in, account tiles, another foothold, a `from` route, a folder request with no route); it ends when the foothold it came through ends (an unplug, for one). A step up replaces the record in place with the same foothold. The level is worked out on every read by `session_access` (`game.rb:3300`), not read back from the stored key alone, and what a level may do is A18. A credential grant adds the finding id to `opsUsed` and the keyring lists the saved connection from then on, opened under the target PC's own policy.
**Server enforces / client only.** All of the route above, in `app/models/break_escape/network_ops.rb` (`use_technique!`) and the session reads in `network_access.rb` (`technique_session_through?`, `host_row`, `desktop_request_allowed?`) and `games_controller.rb` (`network_technique`, `folder_route_allowed?`). `opsUsed` (a list of finding ids) is server-owned, never in a sync body, never sent whole. The client (`network-view-minigame.js`, `ops-model.js` for the refusal words, `systems/compromise-marks.js`, the remote-view frame in `container-minigame.js`) only draws the answers and offers what the server will serve.
**Log events.** `technique_refused` (the technique id and the reason; written for the 403 and every 422, at the host or PC, bounded per place so a loop of refusals cannot fill the log) and `technique_used` (the finding's alias, technique id, grant and, for a session, the level; as the account for a session grant; repeats merge into one row with a count). Both in an `ops` log source that lists them by name; kind `technique`.
**Client events.** `network_technique_used` (`findingId`, `techniqueId`, `grant`) and `network_technique_refused` (`findingId`, `reason`), each also as `<name>:<findingId>`; both fire only on a server answer.
**Validator.** `scripts/validate_network_ops.rb` (`network_ops_check_techniques`): errors for a registry key that is not an id or is too long, more than 32 entries, an entry carried by no item, an entry with no `worksOn.class`, a `product` or `versions` entry that equals no service's product or version in the scenario, a card item whose type or key is wrong, a session grant on a host with no sign-in or to an account that is not an NPC with `creds` or that the host's `access` list does not admit, a credential grant that names no credential, is not a `saved_connection`, whose `proof` does not name the finding back, that two weaknesses grant, or that connects to a PC that blocks remote sign-in, does not accept it or does not admit its account, a `grants` no registry entry matches, `needs.session` without a session grant on the same host, and `technique_card` as an `itemType` need. Warnings: a registry key that holds a word of a product name, a card that fits only decoys, a weakness with `needs` and no `grants`, a weakness with no `grants` (fine for a report-only finding), a `fixedIf` as the only gate before a grant.
**Dungeon graph.** A `tech_<id>` key node (the entry's name) with an edge to every weakness it matches; each carrying item is a source node; a granted session or credential has an edge out of its weakness. Drawn only when the scenario has weaknesses and a registry.
**Check from the server.** `verify-run.rb <game_id> --access` prints an `opsUsed` line (each used finding as `<alias> <finding id>`, in alias order), and the `sessions` line gives a technique session's `access` level and `granted by <finding id>`. `access-leak-check.rb` (`collect_ops_secrets`) reports a technique's name, summary, product and version before its card is held (earned by a successful `POST /inventory` add of the card item, a card in the starting inventory, or the caller's steps), and by structure: a `techniques` key anywhere but `GET /network`'s own top-level map, a map entry for a card not held or with a key outside `name`, `summary`, `worksOn`, `itemId` (and an `itemId` that is not an item held), a `worksOn` key outside that map, a technique answer with a key its kind does not carry (a session answer's keys are a fixed set), a `technique` key anywhere, and a finding row that names a technique or has a `needs` row with a key beyond `kind`, `label`, `met`. The grant rules are judged PER THING, never by one whole-game step: a granted credential's id and label are reported until that finding's credential grant answer (`granted:credential:<finding id>`); `via: "technique"` is reported until a session was granted at that PC (`session:<pc id>`) and in any scan, check or confirm answer; an `access` key that is not `"admin"`, or `"admin"` before an admin grant at that PC (`admin:<pc id>`); `openHere`, and a session on a blocked host listed in a view, until a session came through that very foothold (`through:<pc id>:<foothold id>`). A new session at a PC takes that PC's earlier `through` and `admin` steps back. The capture does not hold the technique request, so the scanner names the finding from the answer (the recorder's `tech.findingId` tag when present): a session answer carries no id, only the PC's host label, which maps to a PC only when ONE sign-in PC in the scenario carries it. When two findings could have made an untagged grant (two PCs sharing a label, or two findings not yet told apart by their confirms), it earns NOTHING (fail closed) and later rows that need the step are reported; name the step with the check's `ops_steps` (for example `session:<pc id>`) to clear them. A grant is credited only to a finding confirmed in the log and not yet granted. Not taken back: a dropped card and a signed-out session. Other ops rules: a `services` or top-level `hosts` key in a room or bootstrap answer, and, before a discovery network's sweep, any `ops` key or any row of a PC not held in its block. Several capture files of one run are read oldest first; the check refuses files out of order, overlapping in time (merge them first), or whose rows name another game.
**Shown in.** `test_ops_access` (an office network with a printer, a file server, a blocked-remote vault host (the vault server is itself the blocked host; the plant network, with one device, is reached through a session on it) and a desk PC, cards in a folder, a drawer and an NPC's hands, a second jack whose view lists no session on the vault host). Its `PLAYTEST.md` is the scripted run; the hostile requests are the Rails tests' (`network_technique_hostile_test`).
**Known limits.** A technique yields a saved connection or a session, never a password. `hash` credentials are A21; what an access level may do is another feature. Card fit is by class, product and a listed version only; there is no tool, minigame or skill check in a use. A global-gated `needs` is a soft gate (the client can write globals).
**Plan vs code.** `docs/achitechture/OPS_CORE_PLAN.md` sections 4.3, 5.4, 5.5, 7, 8, 9, 11.4 and 13.

---



### N16 The Terminal skin of the network view
**One line.** On a network whose hosts declare services, the network view can be drawn two ways: Panels (the rows and buttons of N12 to N15) or Terminal (a prompt and a scrolling log that imitates a network scanner and a framework console). The skin changes only how the view looks. Both send the same requests, show the same game information and work the same way for the server.
**When the switch appears.** The header holds one switch button, labelled with the skin it would change to ("Terminal" while Panels is showing, "Panels" while Terminal is). It is drawn when the server marks at least one block of the view `ops: true` (a listed host has services), and also while the view offers a sweep (a discovery network not yet swept), so the Terminal is there before the first sweep. Once a view has offered the Terminal, it keeps the Terminal, its log and the switch until the view closes, even if its last ops network is later lost. A view that never offered the Terminal is always Panels. A view with neither has no switch and is always Panels, so a scenario that uses no services and no discovery network looks and behaves as before. Pressing the switch sends nothing, loses nothing and keeps any request still waiting for its answer.
**Which skin opens.** First of these that applies: the skin chosen with the switch on this page; `?net_skin=gui` or `?net_skin=cli` in the page address (read by the browser only, handy for a preview link, and a preview never overwrites the saved choice); the player's saved choice (the switch saves it in the browser); the scenario's `networkView.defaultSkin`; Panels. The order is in `public/break_escape/js/minigames/network-view/skin-choice.js`. A player's own choice always beats the scenario's default, so `defaultSkin` is a starting suggestion and nothing more.
**Key fields (all optional, all display-only).**
- `networkView.defaultSkin`: top level, `"gui"` or `"cli"`. Nothing else is allowed inside `networkView` (a key starting `_` is a note).
- `networks.<id>.cli.range`: the address range the sweep prints, written `a.b.c.d/n`, in a private range (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), prefix /16 to /30, written as the network address.
- `networks.<id>.cli.hosts.<hostId>.address`: the address printed for one host, a dotted IPv4 address inside that network's range.
- `services[].cli`: `protocol` (`tcp` or `udp`), `service` (the lower-case word printed in a scan line) and `banner` (up to 80 characters of plain text).
- `realism` on a weakness or a decoy: the id of one catalog entry. The entry supplies the finding's title, scanner script name, framework module path, advisory ids and scanner output lines. A finding has no `cli` of its own: its text lives in the catalog.
Where a field is missing the Terminal builds a plain default from the service's own name, port and version (protocol `tcp`, the service's name, no banner, and a generic title and script for a finding), so a scenario with none of these fields still has a working Terminal.
**What the player sees.** The Terminal has a prompt. The player types a line, or presses a quick command (each action also has a button, so nothing needs typing), and the answer is printed in the style of the modelled tool. The line is turned into one of the requests a Panels button already makes (`terminal-grammar.js`): the game's own short verbs (`sweep`, `scan`, `check`, `confirm`, `signin`, `open`, `look`, `unplug`, `use <technique> on <alias>`, `help`, `show`, `clear`, `panels`, `exit`); an `nmap` line (a network or range sweeps, a host scans, a script name checks one service); and a framework console (`msfconsole`, then `search`, `use`, `info`, `show options`, `set TECHNIQUE`, `run`, `check`, `sessions`, `back`). `unplug` and `exit` must be typed in full: a short form such as `un`, `ex` or `q` is refused with "Did you mean" and sends nothing, because a short form could end the trip by accident. Other verbs still resolve from a unique prefix. Flags it does not model are listed and ignored. The framework console's only options are `RHOSTS`, `RPORT` and `TECHNIQUE`, and the first two come from the module. A line that names something the player cannot do right now sends nothing and says so. **The Terminal offers nothing the Panels do not**: every typed line resolves to an offer that is in the current offer list, and an action still waiting for its answer cannot be sent again from either skin. Nothing in the Terminal runs against a real host, and every address it prints is a private one.
**What is sent, and which answer carries what.** Only `networkView` (as authored) rides in the bootstrap. `networks`, `hosts` and `services` are withheld whole, so `cli` and `realism` never reach the browser that way. The authored text arrives in `GET /network` and in the answers to the player's own moves: the network's `cli.range` on its block (sent with the first view, before any sweep, so choose a range knowing the player can read it from the start); a host's `address` on its row, and only once its network is open or has been swept; a service's `cli` with its row; a finding's `cli` (built from the linked catalog entry) on the finding row, and only for findings the player has found. Only the named keys are copied; a `_` note, the catalog id and the entry as a whole are never sent. The server reads no skin: no route accepts a `skin` or `net_skin` value, nothing is added to the saved game, and it cannot tell which skin made a request.
**Tables.** A Terminal table is one span per cell, lined up with a width (`w`, a whole number of characters, 1 to 80) that the page turns into a CSS minimum width, never with runs of spaces. A wide table scrolls sideways at a phone width. A line with no `w` draws as before, and each cell carries one trailing space, with the table indent and the spaces inside the last cell kept, so copied text has the cells separated by single spaces.
**The log.** The Terminal keeps one log per foothold. A move made in Panels is written to the same log, so switching skin shows the whole story. The log is dropped when the trip ends. **Known gap:** if the player closes the view with the X while the trip carries on at a desktop, the scene cannot see that the trip later ends, so that log is lost (the player starts a fresh one). The test bridge's own calls for both skins are in `docs/test-bridge.md` under "Network view"; they are not repeated here.
**Wording rule.** Text about the game (objectives, hints, ink lines) says what to do, never which control to use, because the control differs by skin. Write "sweep the office network" or "look for weak settings on the file server", not "click Sweep" or "type nmap". The validator warns about a control word beside an action word.
**The realism catalog (for authors).**
- Real advisory ids and real framework module paths live only in `config/break_escape/realism_catalog/*.json`. A scenario file, ink, `PLAYTEST.md`, test fixtures and these docs never hold one. This stage ships none: its one file, `training_fixtures.json`, holds invented products and made-up advisory ids with the year `0000`.
- Read `docs/REALISM_CATALOG_INDEX.md`, never the catalog. The index is generated, lists each id with its file, its form (how many advisories and output lines, and the module's first segment and number of segments) and the scenarios that link it, and holds no catalog text. Pick an id from it and put it in `realism`.
- An entry is `{ title, module, script, advisories, output }` (`title`, `module` and `script` required; up to 4 advisories and 6 output lines of at most 80 characters). The shape is in `config/break_escape/realism_catalog.schema.json`. An entry has no kind: your scenario decides whether it is a weakness or a decoy.
- Ids are append-only. Once an id is in the committed index it is never removed or renamed and its form never changes; new ids are only added. `scripts/validate_realism_catalog.rb` checks all of this (and the text rules, and `scripts/real_vuln_nicknames.txt`, a deny list of well-known vulnerability nicknames that may not appear in an id), and rewrites the index only when it finds no error. Two more rules: a script name must not mirror its entry id (compared in lower case with `-` and `_` removed; an id that already has an index row is exempt, because its script is frozen), and an entry's advisories and output are frozen once a shipped scenario links it. The index has a sixth column, `content`, a short digest of the advisories and output: `-` until a linking scenario folder whose name does not start with `test_` exists (that is what "shipped" means here; only `test_ops_skin` links entries today, so nothing is frozen yet), then fixed for good, and a change to the text is the error `index_content_changed`. An older five-column index still reads. Run it again after you change a link.
- The check fails closed. Once the catalog holds entries the index must exist (a missing index is an error; only the very first run takes `--first-index`), every table row must be readable (a hand-edited row is an error, not a skipped row), every indexed id must still be in the catalog with the same form, and its identity digest (a short hash of its title, module and script, kept in the index in place of any text) must be unchanged. Changing what an id means is a reuse: give the new text a new id. The unit test also compares the index with every earlier committed version of it; that needs full history (a shallow checkout is a test error, and CI checks out with `fetch-depth: 0`), and `--first-index` is refused when any earlier commit held an index or the history cannot be read.
- **Every new entry still needs a human review.** The rules below catch shapes (paths, flags, shell characters, blobs, hosts, credentials, telltale words, a line that starts with an instruction verb such as send, request, run, type or set, a request written as a request, and the words payload and shellcode), and the list cannot be complete. The reviewer reads each `output` line and each title and checks by eye that it states only a state, a short description and a disclosure date; that it is not a step, a request form, a trigger, a way to reach or exploit anything, or a hint at which finding is real; that no real product, host or address is named; and that the advisory ids and module path are real and public and belong to the product the entry names. Only a catalog task opens the catalog, and a second reader signs off each new id.
- Honest lines the rules refuse (reword them): a semicolon, an ampersand, a backtick or a pipe anywhere; a four-part version such as 2.4.1.0 (in the catalog); a line starting with a word such as set, type or get followed by any word other than a state noun (level, queue, limit, protection, permission, warnings, pending, mode, count, size, key), so `Set to read only`, `Open to guests`, `Log in required` and `Type 2 device` are refused; and a word pair joined by a slash when both sides are alike or the right side is a default password.
- A catalog error ("the realism catalog does not validate") is not yours to fix in a scenario task. Stop and hand it to a catalog task.
**Validator.** `scripts/validate_realism_skin.rb`, run by `validate_scenario.rb`. Every message starts `realism skin:`. Errors: a network `cli.range` that is not written `a.b.c.d/n`, is outside the three private ranges, has a prefix outside /16 to /30 or has host bits set; two discovery networks with overlapping ranges, or some discovery networks with a range and some without; a `cli.hosts` key that is not a host on that network, an address that is not dotted IPv4, outside the range, the network or broadcast address, or used by another host; a network id that is also a host, room object or resource id; two services on one port of one host; a `banner` that names a real product, or a version after the product that differs from the service's `version`; a banner on some finding-holding services and not on others; text in the Terminal's fields that breaks the text rules (printable ASCII only, no paths, flags, shell characters or encoded blobs), holds an NPC's password, or looks like a real advisory id, module path or vulnerability nickname; a `realism` id that names no catalog entry, or is linked by two findings; findings where some link an entry and some do not; linked entries that do not all hold, or all lack, the same optional field; a decoy whose entry has a form (advisory and output counts) that no weakness in the scenario links; linked modules on one service that differ in first segment or segment count; and an entry that gives a version different from the service's. Also errors: a strong telltale word in a banner or service word (decoy, fake, false, bait, patched, not vulnerable, honeypot, bogus, dummy, spoof, phony, harmless, benign); a `cli.hosts` key longer than 64 characters; an address on a network that has no range; text that has the shape of a credential (`word:word` with no space, `x/x`, `user=...`); a public host name or URL; and, in any string of an ops scenario (technique, item and card names, signs, notes, file text, NPC names included), an advisory id, a framework module path (also when glued to a label or capitalised) or a nickname. Warnings: the wording rule above (in text and in ink), a word in an entry that hints whether a finding is real, `networkView` set when no host declares services, and a network `cli` when no host declares services. Link problems name the finding as `host.service.id`. `validate_scenario.rb` also warns about a container a player cannot open: one with contents and no `locked` key (the client reads a missing `locked` as a key lock), and a nested container that the container window will not open.
**Playtesting.** A mission is playtested once, in whichever skin the run uses; the two skins send identical requests, so there is no second pass. `tools/playtest/session-start.sh` starts a session in Panels unless told otherwise (it adds `net_skin=gui`); `--net-skin cli` starts it in the Terminal and `--net-skin default` adds nothing, so the stored pick and the scenario default apply (see `docs/test-bridge.md`). The parity runner `tools/playtest/network-skin-parity.mjs` (new in this stage) plays the same sequence in three fresh games, one in each skin and one switching after every step, and fails if any request, normalised answer or saved record differs.
**Shown in.** `test_ops_skin` (default Terminal, authored `cli` fields, three `realism` links; its `PLAYTEST.md` is the scripted run).
**Known limits.** The Terminal formats labels and never invents content. The log is lost on the X-close case above. Selections (the picked card or finding) are not carried across a skin switch.
**Plan vs code.** `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`.

---

## 5. Worked examples

Each block below is a complete scenario that `ruby scripts/validate_scenario.rb <file> --no-graph --skip-ink` accepts with no content errors (the scratch folder needs a `mission.json`, as every scenario does). The per-feature `Example` lines point at these. Every fragment in sections 3 and 4 was validated too, either as part of one of these blocks or by adding it to one (each says which); A9's and A11's fragments come from shipped scenarios. Warnings are left in on purpose where they teach something.

### A1 to A8

```json
{
  "scenario_brief": "Access example",
  "endGoal": "Example only.",
  "startRoom": "lobby",
  "startPosition": {
    "x": 5,
    "y": 5
  },
  "policies": {
    "corp": {
      "autoLockMin": 10,
      "maxAttempts": 3
    }
  },
  "defaultPolicy": "corp",
  "accountProfiles": {
    "staff_desktop": {
      "for": {
        "roles": [
          "staff"
        ]
      },
      "contents": [
        {
          "type": "text_file",
          "id": "handbook",
          "name": "Handbook.txt",
          "takeable": true,
          "transfer": "copy",
          "readable": true,
          "text": "Welcome.",
          "observations": "A handbook."
        }
      ]
    }
  },
  "startItemsInInventory": [
    {
      "type": "keycard",
      "id": "lena_badge",
      "name": "Lena badge",
      "card_id": "lena_card",
      "identity": "lena",
      "cloneable": false,
      "takeable": true,
      "observations": "Lena's badge."
    }
  ],
  "rooms": {
    "lobby": {
      "type": "room_reception",
      "connections": {
        "north": "office"
      },
      "npcs": [
        {
          "id": "lena",
          "displayName": "Lena",
          "npcType": "person",
          "position": {
            "x": 3,
            "y": 3
          },
          "storyPath": "scenarios/x/ink/lena.json",
          "role": [
            "finance"
          ],
          "creds": {
            "username": "lena.k",
            "password": "Spring2026!",
            "card": {
              "card_id": "lena_card",
              "name": "Lena badge",
              "rfid_protocol": "EM4100"
            }
          },
          "cloneable": true,
          "habits": {
            "writesDown": true,
            "screen": {
              "lockChance": 0
            }
          }
        }
      ],
      "objects": [
        {
          "type": "pc",
          "id": "lena_pc",
          "name": "Lena PC",
          "takeable": false,
          "lockType": "login",
          "locked": true,
          "owner": "lena",
          "access": {
            "roles": [
              "finance"
            ]
          },
          "loginPicker": "known",
          "policy": "corp",
          "workstation": true,
          "lockChance": 0.5,
          "observations": "A sign-in PC."
        }
      ]
    },
    "office": {
      "type": "room_office",
      "locked": true,
      "lockType": "rfid",
      "requires": [
        "lena_card"
      ],
      "access": {
        "roles": [
          "finance"
        ],
        "people": [
          "lena"
        ]
      },
      "acceptsUIDOnly": false,
      "connections": {
        "south": "lobby"
      },
      "objects": []
    }
  }
}
```

### A9 to A17 (not A11 or hideable, which are fragments in their sections)

```json
{
  "scenario_brief": "Scratch: awareness, habits, work, feed, USB policy, capture proof, holder.",
  "endGoal": "Test only.",
  "startRoom": "office",
  "startPosition": {
    "x": 5,
    "y": 5
  },
  "defaultPolicy": "corp",
  "policies": {
    "corp": {
      "autoLockMin": null,
      "maxAttempts": 5,
      "usb": "storage_blocked",
      "social": "allowed"
    }
  },
  "roles": {
    "staff": {
      "awareness": "medium",
      "workNeeds": [
        "drive"
      ],
      "frustration": {
        "perFail": 30
      }
    }
  },
  "resources": {
    "drive": {
      "kind": "file_share",
      "name": "Team drive",
      "offWhen": "drive_down"
    }
  },
  "globalVariables": {
    "drive_down": false,
    "kim_wrote_it_down": false
  },
  "startItemsInInventory": [
    {
      "type": "capture_log",
      "id": "capture_log",
      "name": "Capture log",
      "sprite": "laptop1",
      "takeable": true,
      "holds": {
        "captures": true,
        "items": true
      }
    },
    {
      "type": "usb",
      "id": "kit_stick",
      "name": "Kit stick",
      "sprite": "usb_bowl1",
      "takeable": true,
      "usbClass": "storage"
    }
  ],
  "rooms": {
    "office": {
      "type": "room_office",
      "connections": {},
      "objects": [
        {
          "type": "pc",
          "id": "kim_pc",
          "name": "Kim's PC",
          "takeable": false,
          "lockType": "login",
          "owner": "kim",
          "affordance": {
            "satisfies": "work",
            "useSeconds": 5,
            "restores": 10
          }
        },
        {
          "type": "pc",
          "id": "dock",
          "name": "USB dock",
          "takeable": false,
          "policy": "corp",
          "requiresItem": "kit_stick",
          "consumesItem": true,
          "requiresItemHint": "You need the kit stick.",
          "triggerOnInteract": [
            {
              "type": "set_global",
              "key": "kim_wrote_it_down",
              "value": true
            }
          ]
        }
      ],
      "npcs": [
        {
          "id": "kim",
          "displayName": "Kim",
          "npcType": "person",
          "position": {
            "x": 4,
            "y": 4
          },
          "creds": {
            "username": "kim",
            "password": "Sunshine1"
          },
          "needsHome": "kim_pc",
          "needs": {
            "work": {
              "decayPerMin": 5,
              "urgentAt": 40
            }
          },
          "awareness": "high",
          "habits": {
            "writesDown": true,
            "locksScreen": "always",
            "password": "strong"
          },
          "workarounds": [
            {
              "at": 60,
              "do": "writes_down"
            }
          ],
          "captureProof": [
            {
              "planted": "kit_stick",
              "on": "dock"
            }
          ]
        }
      ]
    }
  }
}
```

### A12 to A15

```json
{
  "scenario_id": "doc_a12_a15",
  "scenario_name": "Doc example: gates, wearables, grants, keyring",
  "scenario_brief": "Scratch scenario for the access docs.",
  "endGoal": "Reach the vault.",
  "version": "1.0",
  "startRoom": "lobby",
  "disguises": {
    "courier": {
      "sprite": "courier_hivis"
    }
  },
  "player": {
    "id": "player",
    "displayName": "Visitor",
    "spriteSheet": "female_hacker_hood_v2"
  },
  "globalVariables": {
    "vest_on": false,
    "pp_disguise": "",
    "vault_seen": false
  },
  "defaultPolicy": "corp",
  "policies": {
    "corp": {
      "accepts": [
        "password",
        "saved_connection"
      ],
      "remoteScreen": "typed"
    }
  },
  "credentials": {
    "sam_rdp": {
      "kind": "saved_connection",
      "account": "sam",
      "connectsTo": "desk",
      "label": "Desk.rdp",
      "proof": {
        "held": "sam_rdp_file"
      }
    }
  },
  "objectives": [
    {
      "aimId": "a1",
      "title": "Get in",
      "description": "Reach the vault.",
      "status": "active",
      "order": 0,
      "tasks": [
        {
          "taskId": "t_vault",
          "title": "Enter the vault",
          "type": "enter_room",
          "targetRoom": "vault",
          "status": "active"
        }
      ]
    }
  ],
  "startItemsInInventory": [],
  "rooms": {
    "lobby": {
      "type": "room_reception",
      "connections": {
        "north": "vault"
      },
      "doors": [
        {
          "connectedRoom": "vault",
          "direction": "north",
          "gate": {
            "openFor": [
              "sam"
            ],
            "openRadius": 56,
            "holdMs": 2500,
            "playerMayPassIf": "vest_on",
            "sound": false
          }
        }
      ],
      "npcs": [
        {
          "id": "sam",
          "displayName": "Sam",
          "npcType": "person",
          "position": {
            "x": 4,
            "y": 4
          },
          "spriteSheet": "male_office_worker_v2",
          "spriteTalk": "assets/characters/male_office_worker_talk.png",
          "role": "staff",
          "creds": {
            "username": "sokafor",
            "password": "Marmalade-82"
          }
        }
      ],
      "objects": [
        {
          "type": "aes_hivis_hook",
          "id": "vest",
          "name": "Hi-vis vest",
          "sprite": "aes_hivis_hook1",
          "position": {
            "x": 2,
            "y": 2
          },
          "takeable": true,
          "observations": "A hi-vis vest.",
          "wearable": {
            "costume": "courier",
            "global": "vest_on",
            "unseenOnly": true,
            "seenBy": {
              "ignore": [
                "sam"
              ]
            }
          }
        },
        {
          "type": "pc",
          "id": "desk",
          "name": "Desk PC",
          "position": {
            "x": 5,
            "y": 4
          },
          "takeable": false,
          "locked": true,
          "lockType": "login",
          "loginPicker": "accounts",
          "observations": "A desk PC."
        },
        {
          "type": "text_file",
          "id": "sam_rdp_file",
          "name": "Desk.rdp",
          "credential": "sam_rdp",
          "position": {
            "x": 3,
            "y": 5
          },
          "takeable": true,
          "observations": "A saved connection."
        },
        {
          "type": "phone",
          "id": "bell",
          "name": "Reception bell",
          "position": {
            "x": 6,
            "y": 2
          },
          "takeable": false,
          "observations": "Ring for a pass.",
          "triggerOnInteract": [
            {
              "type": "give_item",
              "item": {
                "type": "text_file",
                "id": "welcome_memo",
                "name": "Welcome memo",
                "takeable": true,
                "readable": true,
                "text": "Welcome.",
                "observations": "A memo."
              }
            }
          ]
        },
        {
          "type": "key",
          "id": "vault_key",
          "name": "Vault key",
          "opens_lock": "vault_key",
          "keyPins": [
            30,
            50,
            70
          ],
          "position": {
            "x": 1,
            "y": 5
          },
          "takeable": true,
          "observations": "A key."
        }
      ]
    },
    "vault": {
      "type": "room_servers",
      "locked": true,
      "lockType": "key",
      "requires": "vault_key",
      "connections": {
        "south": "lobby"
      },
      "objects": [],
      "keyPins": [
        30,
        50,
        70
      ]
    }
  }
}
```

### N1 to N11 (not the rogue AP console; see N8)

```json
{
  "scenario_brief": "Scratch: network features N1 to N11 combined.",
  "endGoal": "Scratch only.",
  "startRoom": "lobby",
  "startPosition": {
    "x": 5,
    "y": 5
  },
  "policies": {
    "nla": {
      "remote": "allowed",
      "remoteScreen": "typed"
    },
    "hardened": {
      "remote": "blocked"
    }
  },
  "globalVariables": {
    "servers_offline": false
  },
  "networks": {
    "office_lan": {
      "name": "Office network"
    },
    "server_net": {
      "name": "Server network",
      "offWhen": "servers_offline"
    },
    "guest_wifi": {
      "name": "Guest Wi-Fi",
      "wifi": {
        "ssid": "Example-Guest",
        "psk": "seabreeze-2025"
      }
    }
  },
  "networkLinks": [
    [
      "office_lan",
      "server_net"
    ]
  ],
  "resources": {
    "open_share": {
      "kind": "file_share",
      "name": "Public",
      "host": "OFF-FS01",
      "network": "office_lan",
      "contents": [
        {
          "type": "text_file",
          "id": "open_note",
          "name": "notice.txt",
          "takeable": true,
          "readable": true,
          "text": "Open share notice.",
          "observations": "A notice."
        }
      ]
    },
    "vault": {
      "kind": "file_share",
      "name": "Vault",
      "host": "SV-FS02",
      "network": "server_net",
      "access": {
        "roles": [
          "it"
        ]
      },
      "contents": [
        {
          "type": "text_file",
          "id": "vault_note",
          "name": "vault.txt",
          "takeable": true,
          "readable": true,
          "text": "Vault note.",
          "observations": "A note."
        }
      ]
    }
  },
  "rooms": {
    "lobby": {
      "type": "room_reception",
      "door_sign": "Lobby",
      "network": "office_lan",
      "connections": {
        "north": "comms"
      },
      "objects": [
        {
          "type": "pc",
          "id": "kit_dropbox",
          "name": "Network drop box",
          "sprite": "drop_box1",
          "position": {
            "x": 8,
            "y": 4
          },
          "takeable": true,
          "rogueDevice": true,
          "observations": "A drop box."
        },
        {
          "type": "pc",
          "id": "kit_badusb",
          "name": "Keystroke injector",
          "sprite": "drop_box1",
          "position": {
            "x": 8,
            "y": 6
          },
          "takeable": true,
          "usbClass": "hid",
          "observations": "A BadUSB."
        },
        {
          "type": "pc",
          "id": "lobby_pc",
          "name": "Lobby PC",
          "host": "HB-LOB-01",
          "sprite": "pc_desktop",
          "position": {
            "x": 3,
            "y": 6
          },
          "takeable": false,
          "locked": true,
          "lockType": "login",
          "loginPicker": "accounts",
          "policy": "nla",
          "access": {
            "roles": [
              "staff"
            ]
          },
          "observations": "A lobby PC."
        },
        {
          "type": "pc",
          "id": "bench_port",
          "name": "Wall port",
          "sprite": "network_rack1",
          "position": {
            "x": 5,
            "y": 3
          },
          "takeable": false,
          "networkJack": true,
          "jackConfirm": "Plug the drop box into this port?",
          "plantedSprite": "pi_cluster1",
          "requiresItemHint": "A spare port.",
          "observations": "A wall port."
        },
        {
          "type": "pc",
          "id": "secured_port",
          "name": "Secured port",
          "sprite": "network_rack1",
          "position": {
            "x": 6,
            "y": 3
          },
          "takeable": false,
          "networkJack": true,
          "portSecurity": true,
          "portSecurityMessage": "This port only takes known machines.",
          "observations": "A secured port."
        },
        {
          "type": "pc",
          "id": "guest_ap",
          "name": "Guest access point",
          "sprite": "lw_staff_ap",
          "position": {
            "x": 2,
            "y": 2
          },
          "takeable": false,
          "wifiAp": true,
          "network": "guest_wifi",
          "observations": "An access point."
        },
        {
          "type": "notes",
          "id": "usb_spot",
          "name": "Lobby PC USB port",
          "position": {
            "x": 4,
            "y": 6
          },
          "takeable": false,
          "requiresItem": "kit_badusb",
          "triggerOnInteract": [
            {
              "type": "confirm_action",
              "text": "Plug the injector into the lobby PC?",
              "confirmLabel": "Plug it in",
              "cancelLabel": "Leave it",
              "onConfirm": [
                {
                  "type": "grant_foothold",
                  "pc": "lobby_pc",
                  "needsSession": true,
                  "needsHeld": "kit_badusb"
                }
              ]
            }
          ],
          "observations": "A USB port."
        }
      ],
      "npcs": [
        {
          "id": "sam",
          "displayName": "Sam Okafor",
          "npcType": "person",
          "position": {
            "x": 5,
            "y": 4
          },
          "spriteSheet": "male_office_worker_v2",
          "storyPath": "scenarios/test_access_networks/ink/sam.json",
          "currentKnot": "start",
          "role": "staff",
          "creds": {
            "username": "sokafor",
            "password": "Marmalade-82"
          }
        },
        {
          "id": "ian",
          "displayName": "Ian Reid",
          "npcType": "person",
          "position": {
            "x": 6,
            "y": 4
          },
          "spriteSheet": "male_office_worker_v2",
          "storyPath": "scenarios/test_access_networks/ink/sam.json",
          "currentKnot": "start",
          "role": "it",
          "creds": {
            "username": "ireid",
            "password": "Teapot-41"
          }
        }
      ]
    },
    "comms": {
      "type": "room_office",
      "door_sign": "Comms room",
      "network": "office_lan",
      "connections": {
        "south": "lobby"
      },
      "objects": [
        {
          "type": "notes",
          "id": "panel1",
          "name": "Patch panel",
          "position": {
            "x": 3,
            "y": 3
          },
          "takeable": false,
          "panelPorts": [
            {
              "port": 1,
              "label": "D",
              "desk": "Desk 1",
              "jack": "panel_voice"
            },
            {
              "port": 2
            }
          ],
          "observations": "A patch panel."
        },
        {
          "type": "pc",
          "id": "panel_voice",
          "name": "Panel voice port",
          "networkJack": true,
          "panelOf": "panel1",
          "network": "office_lan",
          "takeable": false,
          "observations": "A voice port."
        },
        {
          "type": "pc",
          "id": "door_box",
          "name": "Door controller",
          "host": "DC-01",
          "sprite": "network_rack1",
          "position": {
            "x": 4,
            "y": 3
          },
          "takeable": false,
          "locked": true,
          "lockType": "login",
          "headless": true,
          "access": {
            "roles": [
              "it"
            ]
          },
          "observations": "No screen."
        }
      ]
    },
    "server_room": {
      "type": "room_office",
      "door_sign": "Server room",
      "network": "server_net",
      "connections": {
        "south": "comms"
      },
      "objects": [
        {
          "type": "pc",
          "id": "sv_fs02",
          "name": "Server file host",
          "host": "SV-FS02",
          "sprite": "pc_desktop",
          "position": {
            "x": 5,
            "y": 4
          },
          "takeable": false,
          "locked": true,
          "lockType": "login",
          "loginPicker": false,
          "access": {
            "roles": [
              "it"
            ]
          },
          "offWhen": "servers_offline",
          "observations": "A file host."
        }
      ]
    }
  }
}
```


## 6. Coverage matrix

`x` means the scenario's template text matches a field-pattern for the feature. It is a text search, so it over-reports where a field name is shared (for example `offWhen` on objects in the office-life scenarios counts under N7, and `rfid_cloner` anywhere counts under A3). Rows A2, A3, A5, A10 to A17, N2, N3, N6, N8, N10 and N11 were re-checked on 2026-11-18 with patterns anchored on the JSON key (for example `"gate": {`); A16 and A17 were corrected then. Use the section's "Shown in" line for the best demo. N5 is exercised wherever there is a jack. `ta_` is `test_access_`. The scenarios that use these fields and are not in the columns are in the last column. m01 to m10 appear there only where the text search matched.

| Feature | demo_access_tour | lab_physical_pentest | ta_devices | ta_doors | ta_habits | ta_keyring | ta_networks | ta_sessions | ta_signin | ta_social | ta_work | Other scenarios |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | x | x | x | x | x | x | x | x | x | x | x | test_capture_log, test_secret_leaks |
| A2 | x | x | x | x |  | x | x |  | x | x | x | test_capture_log |
| A3 | x | x |  | x |  |  |  |  |  |  |  | m07_architects_gambit, test_clone_left_card, m05_insider_trading, test_gate_tailgate, test-rfid, m10_full_disclosure and 6 more |
| A4 | x | x | x |  | x | x | x | x | x | x | x | test_capture_log |
| A5 |  | x | x |  | x |  |  | x | x | x | x |  |
| A6 | x | x | x |  | x | x | x | x | x | x | x | test_capture_log |
| A7 | x |  |  |  | x | x | x | x | x | x | x | cybok_heist, lab_social_engineering, m01_first_contact, lab_tesseract_trials, ceo_exfil, m06_follow_the_money |
| A8 | x | x |  |  | x |  |  | x |  | x | x | test_npc_squeeze_past, test_npc_needs, test_needs_sims, test_capture_log, office_life_showcase, test_needs_attack and 2 more |
| A9 | x | x |  |  | x |  |  |  |  | x | x | test_needs_sims, office_life_showcase, m03_ghost_in_the_machine, m06_follow_the_money |
| A10 |  | x |  |  |  |  |  |  |  | x | x |  |
| A10b | x |  |  |  | x |  | x | x | x | x | x |  |
| A11 |  |  |  |  |  |  |  |  |  | x |  |  |
| A12 |  | x |  |  | x |  |  |  |  |  |  | test_bark_bubbles, test_gate_tailgate |
| A13 |  | x |  |  |  |  |  |  |  |  |  | test_gate_tailgate, test_wearable |
| A14 |  | x |  |  |  |  |  |  |  |  |  | test_capture_log, lab_social_engineering, test_gate_tailgate |
| A15 | x |  |  |  |  | x |  |  |  |  |  |  |
| A16 | x | x | x |  |  | x | x |  |  |  |  | test_capture_log, test_secret_leaks |
| A17 | x | x | x |  |  | x | x |  |  |  | x | test_capture_log, test_remove_item |
| A18 |  |  |  |  |  |  |  |  |  |  |  | test_ops_privilege, test_ops_access |
| A21 |  |  |  |  |  |  |  |  |  |  |  | test_ops_crack |
| A22 |  |  |  |  |  |  |  |  |  |  |  | test_ops_mfa |
| N1 | x | x | x |  |  | x | x |  |  |  |  |  |
| N2 | x |  |  |  |  | x | x |  |  |  |  |  |
| N3 | x | x |  |  |  |  | x |  |  |  |  |  |
| N4 | x | x | x |  |  |  | x |  |  | x | x |  |
| N5 | x | x | x |  |  | x | x |  |  |  |  |  |
| N6 | x |  |  |  |  | x | x |  |  |  |  |  |
| N7 |  | x |  |  |  |  | x |  |  | x | x | m07_architects_gambit, test_needs_sims, office_life_showcase, m05_insider_trading, m01_first_contact, m10_full_disclosure and 4 more |
| N8 | x | x | x |  |  |  | x |  |  |  |  |  |
| N9 | x | x | x |  |  |  | x |  |  |  |  |  |
| N10 | x |  |  |  |  |  | x |  |  |  |  |  |
| N11 | x | x | x |  |  |  |  |  |  |  |  |  |
| N12 | x | x | x |  |  |  | x |  |  |  |  | test_ops_scan, test_ops_findings, test_ops_access |
| N13 |  |  |  |  |  |  |  |  |  |  |  | test_ops_scan, test_ops_findings, test_ops_access |
| N14 |  |  |  |  |  |  |  |  |  |  |  | test_ops_findings, test_ops_access |
| N15 |  |  |  |  |  |  |  |  |  |  |  | test_ops_access |


## 7. Not built

Planned or sketched, not in the code. Check each against the code before relying on it.

- **Machine accounts** (keyring phase 3). `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md`. The kinds built are `password`, `saved_connection`, `assist_invite`, `token` and `hash` (A21); K-lock is built.
- **Per-lockout scope** (an account locked everywhere, not only at one PC). `docs/IDEAS_BACKLOG.md:197`. Lockouts last the whole mission and there is no runtime policy change.
- **Defender missions and investigator missions** built on these systems. `docs/IDEAS_BACKLOG.md:196`, `:198`.
- **Server-proven NPC hand-overs.** `docs/IDEAS_BACKLOG.md:201`. NPC-given keycards also await a decision (`docs/achitechture/ACCESS_MODEL_BUILD_LOG.md:1221-1222`).
- **Server enforcement of `wearable.unseenOnly` and `seenBy`.** Client-only today (`app/models/break_escape/wearables.rb:55-90`). `docs/IDEAS_BACKLOG.md:221`, `:230`.
- **A validator warning for a `closeDoor` that names a non-gate.** The schema text promises one (`scripts/scenario-schema.json:4989`); no check exists, only a console warning in `public/break_escape/js/systems/door-gates.js:873`.
- ~~Host-level "not responding" and `offWhen` on hosts~~ Built in N13: `hosts.<id>.offWhen` and the 403 `not_responding` (a device that is off shows `responding: false`). A sign-in PC uses the object's own `offWhen` (N7).
- **A five-second refetch of the network view and a pre-sign-in globals sync.** `docs/IDEAS_BACKLOG.md:239`. The same entry says the dungeon graph draws no links, outages or Wi-Fi; the generator does draw links, pivots, outages and Wi-Fi (`scripts/generate_dungeon_graph.rb:528-760`), and implants (`:980-1060`), so that part of the entry is stale.
- **A rogue device that works like a drop box without a jack** (the device pitch). `docs/IDEAS_BACKLOG.md:228`. The pocket rogue AP (N8) writes globals only and never gives a foothold, by design.
- **`holdsDoors` approach-drop** (a careful guard dropping the hold as the player nears, beyond what is built). `docs/achitechture/ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md:337-340`. No shipped scenario sets `holdsDoors` even though the loader builds it (`lib/break_escape/npc_habits.rb:127-190`).
- **Locked look for a sign-in PC with no owner.** `docs/IDEAS_BACKLOG.md:223`.
- **Phish-evidence recording for gated doors.** `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md:1193-1194`.
- **Server checks for plain `openFor` doors without a split.** The server splits a gate when `playerMayPassIf` is a server-owned global or the scenario has any `rfid_cloner` (`game.rb:277`); other gates stay client-side. `docs/IDEAS_BACKLOG.md:247`, `:230`.
- **Declared grants have no trigger check.** A grant can be claimed from the start by a tampered client (`gc:3340-3356`); give secrets through `itemsHeld` or ink `#give_item`. `docs/IDEAS_BACKLOG.md:190`.

Plan headers that look out of date: `docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md` says only steps 1 to 4 are built while the 9.3b features (links, outages, Wi-Fi, port security, implants, patch panel) are in the code; `ACCESS_MODEL_SLICE_9_1_CODE_REVIEW_R1.md:244` says `holdsDoors` is not built, but it is.
