# Scenario format review: access, networking, office life and Friendface

Scope: the parts of the scenario JSON format added by the access model (slices 1 to 9.3b), office life (needs, affordances, habits) and Friendface (feed, reactive posts, the phone item, and the C3 replies on `build/c3-replies`). The format's overall structure and naming are covered by a second review. This is a design review only; nothing in the format, code or scenarios was changed.

Reviewed at main `6a834437c`, plus `git diff main...build/c3-replies`.

## Verdict

The core holds together. Identity lives on the NPC (`creds`, `role`), one access list type (`{ roles, people }`) guards doors, PCs, profiles, shares and hosts, registries sit at the top level (`accountProfiles`, `policies`, `networks`, `resources`, `roles`), and author shorthand (awareness presets, habits) is expanded once by a loader into the fields the engine already reads. The semantic validators are thorough: they check reachability, chains, leaks into ink, feeds and chatter, and the client-writable globals that a server gate reads.

The edges were added slice by slice, and it shows. Ownership has about ten spellings, and `needsHome`, a movement field, doubles as the default owner. An outage has two fields with two condition grammars, and a PC's power state lives inside its NPC affordance block. Screen locking has eight knobs in four places. Role defaults merge four different ways. Typos in the new top-level registries pass without a word, including ones that silently open a Wi-Fi network or disable an outage. Secrets are held back by name-based deny lists that the format itself does not show.

No format choice forces player_state to grow without bound.

These features are used by 14 scenarios, all test scenarios plus `lab_physical_pentest`. No main mission (m01 to m10) uses any of them, so the consolidation below is cheap now and gets more expensive with every mission that adopts the current shapes.

**Counts: 2 blockers, 7 major, 8 minor, 4 nits (21 findings).**

"Blocker" here means: fix before m01 to m10 adopt these fields, because the cost of changing it grows with every adopter. Nothing is broken today.

## Who uses what (main tree)

| Feature group | Fields | Scenarios |
|---|---|---|
| Identities and ACLs | `creds`, `role`, `access`, `accountProfiles`, `policies` | lab_physical_pentest, test_access_doors, test_access_habits, test_access_networks, test_access_sessions, test_access_signin, test_access_social, test_access_work, test_capture_log (9) |
| Networks | `networks`, `networkLinks`, `wifi`/`wifiAp`, `networkJack`, `rogueDevice`, `portSecurity`, `grant_foothold` | test_access_networks, lab_physical_pentest (jack, port security and rogue device only) (2) |
| Work and frustration | `resources`, `roles`, `workNeeds`, `frustration`, `workarounds` | test_access_work, test_access_social; `resources` also in test_access_networks, lab_physical_pentest |
| Outages | `downIf` (3), `affordance.offWhen` (4) | test_access_networks, test_access_social, test_access_work, test_needs_sims |
| Office life | `needs`, `needsHome`, `affordance`, `officePresets` | 12 scenarios (the 9 above except test_access_doors and test_access_signin, plus test_clone_left_card, test_needs_leash, test_needs_sims, test_npc_needs, test_seating) |
| Ownership | `screenOwner` (3), `affordance.owners` (2), `phoneOwner` (1), `phoneOf` (1), `leftBehindBy` (3) | see recommendation 1 |
| Habits | `habits` (2), `screenHabit` (3), `printHabit` (1), `usbHabit` (1), `awareness` on NPCs (2) | test_access_habits, test_access_social, test_access_work, test_needs_sims, lab_physical_pentest |
| Friendface | `feed`, `phoneOf`, `phone_friendface`, `socialUse` | test_access_social (1) |

Distinct scenarios touched: 14. Main missions: 0. (m02 and sis01 use a `needs` key, and ca20 a `networks` list, but in unrelated minigame and awareness blocks.) `routines` and `traits` are not in the schema yet.

## Findings

### Blockers

**B1. Ownership has no single field, and a movement field carries it by default.**
Who owns a thing is spelt at least ten ways: `needsHome` (NPC to object, implicit), `screenOwner` (object), `affordance.owners` (object, list), `phoneOwner` (desk phone), `phoneOf` (Friendface phone), `leftBehindBy` (item), `identity` (keycard), `fingerprintOwner` (older), `needsPrivateTo` (room, list) and `printHabit` (implicit ownership of prints). Each consumer has its own fallback chain:
- a private affordance: `owners`, else `screenOwner`, else the NPC whose `needsHome` is the object (schema, `affordance.private`);
- a workstation: `screenOwner`, else `needsHome` (`workstation-state.js` `ownerOf`);
- the `writes_down` workaround: `screenOwner`, else the *first* NPC with it as `needsHome` (`validate_access_work.rb:1216`).

So `needsHome` decides where an NPC idles and also who owns the PC, whose screen-lock habit applies, where a USB habit acts, where a written-down password appears and which PC an account "should" sign in to. Moving an NPC's idle spot changes ownership as a side effect. Each new office behaviour so far has added its own owner field; routines and traits will add more unless this is settled first.

**B2. An outage is two fields with two grammars, and a PC's power lives in its affordance.**
README "Outages, failed uses and the kick" says it outright: "An outage is a global: a resource's `downIf`, or a station's `affordance.offWhen`". `downIf` (networks, resources) takes a bare global name. `offWhen` takes the requireGlobal form (a name, or `{ name: value }`), and so does a reactive post's `when.global`. The look of a switched-off PC needs a third grammar, a `spriteVariants` condition string (`"globalVars.bench_pc_off"`). The server keeps them apart as two failure causes, `down` and `off` (`access_work.rb:452-462`).

`offWhen` sits inside `affordance`, the block that describes what NPCs do at an object, but it now governs the player too: a sign-in PC whose `offWhen` holds refuses sign-in at the keyboard, shows "not responding" to a foothold, relays no pivot and serves no share (README, same section). An object with `affordance: false` has nowhere to put its power switch. The physical printer in `test_access_work` has two switches: the resource `printer` has `object: "office_printer"` and `downIf: "printer_jammed"`, and the object can also carry `affordance.offWhen`. One makes work fail with cause `down`, the other turns NPCs back with cause `off`.

### Major

**M1. Screen locking has eight knobs in four places, and the object beats the person.**
`policies.*.autoLockMin`, the object's `lockChance`, `locksScreenOnLeave` and `workstation`, the NPC's `screenHabit.lockChance` and `lockIfAwayOverSeconds`, the NPC's `habits.locksScreen`, the NPC's `awareness`, and `roles.<role>.awareness`. Two of them are called `lockChance` at different levels. Precedence (`workstation-state.js:132-155`): policy `autoLockMin: 0`, then the object, then the person's habit, then the awareness preset. That inverts the access model's own story ("awareness is a property of the person"): every NPC in `test_access_sessions` sets its carelessness as `lockChance` on the PC. For a borrowed hot desk the order flips, because the guest's own habit decides and the PC's `lockChance` is ignored (`validate_access_work.rb:1161`). A server-found lockout overrides everything.

**M2. Secrets are held back by name-based deny lists that the format does not show.**
The bootstrap allow-lists room fields but deny-lists the top level: it deletes `flags`, `accountProfiles`, `roles`, the network keys and feed facts by name (`game.rb:1148-1185`). Room NPCs lose `WITHHELD_NPC_KEYS = creds awareness habits role workarounds` and `WITHHELD_WORK_NPC_KEYS = workNeeds frustration feed usbHabit` (`game.rb:4663-4667`). A new secret-bearing NPC field or top-level block ships to the browser unless someone remembers to add it to a list. One field has two behaviours: `usePayload.secret` (and `addCapture.secret`) is withheld only when the NPC has `creds.username` (`game.rb:4703-4713`), so a PIN capture on an NPC without an account ships in room data. The filters also shape the format: `creds`, `role`, `workNeeds`, `frustration`, `workarounds` and `feed` are allowed only on room NPCs because top-level `npcs`, `phoneNPCs` and headless records "reach the browser unfiltered" (`validate_access_work.rb:402`). The schema says "never sent to the browser" in prose on some fields and not on others.

**M3. Typos in the new registries pass silently, and some slips are dangerous.**
The schema check runs non-strict, and `item`, `npc`, `room` and the entries of `resources`, `networks`, `policies` and `accountProfiles` set no `additionalProperties: false` (`roles` sets it to `true`). The validator's unknown-field pass walks objects and NPCs, as warnings only, and does not walk the registries. Mutations of a copy of `test_access_sessions`, run through `validate_scenario.rb --no-graph --skip-ink`:

| Mistake | Effect in play | Validator |
|---|---|---|
| `"lockchance": 0` on Dana's PC | her screen now locks on every leave: the beat is gone | warning (unknown field) |
| `"needHome"` on Ian | no station, no workstation owner | warning (unknown field) |
| `affordance "owner"` for `owners` | private machine serves nobody | warning only through a knock-on check; schema passed |
| `"autoLockMins": 0` in a policy | instant lock gone | silent (a later warning blames the PC's `lockChance`) |
| `"downif"` on a resource | the outage can never happen | silent |
| `wifi: { "PSK": ... }` | the network is open; a blank or missing `psk` means open by design | silent |
| a password in a room object's `observations` | password ships | silent unless `habits.password` is declared |
| `access.people: ["danna"]` | | error (good) |
| unknown policy name | | error (good) |
| `screenOwner: "meii"` | | error (good) |

Cross-references are checked well. Key-name typos are not.

**M4. Role defaults merge four different ways.**
In `roles.<role>`: `workNeeds` is a delta list on the NPC (`"x"`, `"+x"`, `"-x"`); `frustration` merges field by field (defaults, first role that sets the field, then the NPC); `workarounds` on the NPC replaces the role's list wholesale; `awareness` comes from the first role that has one, with the implicit `staff` last (schema descriptions; README "Resources and work needs"). An author has to know which rule applies to which key.

**M5. Getting a foothold by planting a device has two unrelated shapes.**
A jack is an object flag (`networkJack: true`) with a reserved click flow that forbids `triggerOnInteract`, `requiresItem` and any lock; its device is marked `rogueDevice: true`. An implant is an action, `{ "type": "grant_foothold", "pc", "needsHeld" | "needsDropped", "needsSession", "name" }`, inside `triggerOnInteract`, next to a `requiresItem` that names the same device again (`test_access_networks` lines 713 to 716 and 788 to 791). Its device is a plain item with a `usbClass`. Wi-Fi is a third route: `wifiAp: true` on the object, with the SSID and key on the network. The object roles `networkJack`, `wifiAp`, `portSecurity`, `headless`, `workstation` and `lockType: "login"` are separate booleans whose exclusions the validator enforces pairwise (`validate_network.rb:68-90`, `225-235`).

**M6. Names collide across the new systems.**
- `social`: a need the cooler preset satisfies (chat, `office-presets.json`), the SE engine's `social` block, and `policies.*.social`, which blocks the different need `social_media`.
- `habits` (slice 9.1 awareness habits) beside `screenHabit`, `printHabit` and `usbHabit` (office life), where `habits.locksScreen` fills `screenHabit`.
- `profile` (a phone NPC's OSINT page), `accountProfiles` (desktop contents) and `social.osint.sites[].profiles` (Friendface pages).
- `headless` on a sign-in object, which README has to say is unrelated to headless NPC records.
- The same `accessList` type is called `access` on rooms, objects and resources, and `for` on account profiles.

**M7. A Friendface person is written four times, and one default implies data the author must still write.**
Jake in `test_access_social` is the room NPC `jake` with `displayName`; the site profile `{ person: "jake", name: "Jake Brooks" }` under `social.osint.sites`; `feed: { site: "friendface", person: "jake" }` on the NPC; and `phoneOf: "jake"` on his phone item. Posts live in two places with the same shape: authored profile posts, public from the start, and `feed.posts`, revealed over time. `phone` defaults to true for an NPC with a `social_media` need, but the validator then errors unless a `phone_friendface` item with `phoneOf` sits in its `itemsHeld` (`validate_access_work.rb:122-125`). The default commits the author to writing the item. C3 adds `replyTo`, `replyToComplaint`, `complaint` and `insteadOf` to posts. Thread structure is now spread over posts on different NPCs, and `when` (seven predicates, `access_work.rb:395`) is one more condition grammar.

### Minor

**m1. README describes the networks validator as it was.** "Networks: jacks, footholds, hosts and shares" says the validator refuses `networkLinks`, `downIf`, `wifi`, `wifiAp`, `portSecurity` and `grant_foothold` with "needs slice 9.3b". The reserved lists are now empty, and each field has real checks. The comment at `validate_network.rb:19-20` still says `grant_foothold` is reserved, while lines 537 onwards check it fully.

**m2. Schema descriptions record build history rather than meaning.** There are 93 references to slices, sub-slices and plan sections ("Slice 9.2 (section 8): ..."). On main, `feed.posts` items are untyped (`{ "type": "object" }`); C3 adds the properties.

**m3. Sign-in PCs get no preset.** Presets skip locked objects, and a sign-in PC stays `locked: true` for the whole game, so every sign-in PC that is a station needs a hand-written `"affordance": { "satisfies": "work", "useSeconds": 5, "restores": 10 }` (README, in bold).

**m4. Engine-owned globals share the author's namespace.** `<npcId>_frustration`, `<objId>_screen_locked`, `<objId>_owner_away`, `<objId>_accessed`, `<jackId>_planted` and the `revealOnGlobal` of left-behind items are written by the engine into the same flat `globalVariables`. Only the `_frustration` suffix is guarded (`validate_access_work.rb:411`).

**m5. Outage and workaround switches are client-writable globals.** The format has no way to say a global is server-owned, so the validator warns case by case: "a browser can set that global false" (`validate_network.rb:318-322`) and "the player's browser can write it" (`validate_access_work.rb:486-490`, `1052`). This follows the best-effort cheat policy for ink-gated steps, but a field such as `downIf` invites authors to treat it as a hard gate.

**m6. Where a password is meant to be found is implicit.** Leak checks cover ink (error), feeds and chatter (error), and network names, hosts and observations (error). A password in an object's text is treated as a deliberate clue and passes silently unless the NPC declares `habits.password`.

**m7. Accounts are possible only for room NPCs.** A colleague who exists only as a phone contact or a mail sender cannot hold an account or a role (M2's filter shaping the format).

**m8. Need names are free strings with no check on the object side.** Presets use `caffeine`, `thirst`, `hunger`, `rest` and `social`; slice 9.2 uses `social_media` and `work`. An NPC need with no source is an error (`validate_npc_needs.rb:1258`), but an object whose `satisfies` names a need nobody has is warned only for magnets (line 296).

### Nits

**n1.** Kit items in `test_access_networks` (drop box, keystroke injector, USB stick) are `"type": "pc"`, so an item's `type` says little about what it is.

**n2.** The plan's names differ from the built ones: the plan uses `intel` and a `social` need, the build uses `fact` and `social_media`. Section 9.2 of `ACCESS_MODEL_PLAN.md` still shows the old names.

**n3.** `accountProfiles.*.for` could simply be `access`, the same type under the same name as everywhere else.

**n4.** `networkLinks` is a list of two-item lists, while every other registry is a keyed map. A link cannot carry a `downIf` or a name without a shape change.

## The five questions

### 1. Coherence

There is one model at the centre (identity, access list, registry, loader expansion) with bolt-ons at the edges (B1, B2, M1, M4, M5). There is clear duplication of the same idea: outage (`downIf` and `offWhen`), owner (ten fields), screen locking (eight knobs), device planting (jack and implant). There is also data an author writes more than once: the implant device in `requiresItem` and `needsHeld`; the Friendface person in four places; a phone implied by `phone` and then required as an item; a PC's off state as `offWhen` and again as a `spriteVariants` condition to show it.

### 2. Where things are attached

Mostly predictable. Who a person is goes on the NPC, what a thing is goes on the object, shared definitions go at the top level, and room defaults (`network`, `needsPrivateTo`) go on the room. The exceptions are the ones that cause trouble: ownership on both sides of the NPC to object link (B1), power state inside `affordance` (B2), a person's carelessness on the PC (M1), and the Wi-Fi key on the network while the access point is an object flag (reasonable, but different from the jack).

### 3. Secrets

The split works today and is well tested, but the format does not make it visible (M2). Account passwords live only in `creds.password` and are withheld by name. Wi-Fi keys live in `networks.*.wifi.psk` and are withheld with the network keys. PINs stay in `requires`, filtered as before. Unrevealed post text and facts are withheld through `feed` and `withhold_feed_facts!`. The fragile points: the top-level deny list, `usePayload.secret` behaving differently by account status, silent typos that turn a closed network open (M3), and globals the browser writes standing in for server state (m5).

### 4. Validator coverage

| Field | Caught | Slips through |
|---|---|---|
| `creds` | duplicate usernames; `creds` off room NPCs; password in ink, feed, chatter, network strings | password in object text (m6) |
| `access` | unknown person; skipped locks printed as identity reach | unknown role names are free strings |
| `policies` | unknown policy name; value enums | misspelt field names (`autoLockMins`) |
| `networks`, `wifi` | unknown network refs; whitespace `psk`; short or unreadable `psk`; link self-loops; unreachable pivots | misspelt `psk` (opens the network); misspelt `downIf` |
| `resources` | unknown `object`; undeclared `downIf` global; unused resource | misspelt keys (`downif`) |
| `networkJack`, `wifiAp`, `portSecurity` | role exclusions; jack inside a container; no network | |
| `grant_foothold` | host placement; duplicate shapes; device id | |
| `workarounds` | kinds, targets, doors, props, client-writable gates | |
| `feed` | site, person, fact ids, ids unique, awareness oversharing, order | unknown post keys on main (C3 types them) |
| ownership fields | unknown NPC ids | which of the competing owners wins (B1) |
| `lockChance` and the other lock knobs | a mapping that can never fire | misspelt key is a warning only; no printout of the effective lock rule per PC |

### 5. Cognitive load: "a staff member leaves the PC unlocked when getting coffee"

Plain workstation (the PC opens with no sign-in):

```jsonc
// NPC (room npcs)
{ "id": "dana", "needs": { "caffeine": { "decayPerMin": 30, "urgentAt": 40 } },
  "needsHome": "dana_pc" }
// PC (room objects)
{ "id": "dana_pc", "type": "pc", "lockChance": 0 }
// coffee machine (room objects)
{ "id": "coffee", "type": "coffee_station1", "affordance": { "satisfies": "caffeine" } }
// eventMappings: workstation_accessed:dana_pc -> what the open screen gives
```

That is five concepts (need, home, workstation, affordance, the event mapping) in three places, plus a choice between five ways to make Dana careless: `lockChance` or `locksScreenOnLeave` on the PC, `screenHabit` or `habits.locksScreen` or `awareness` on Dana. `officePresets: true` can replace the affordance, but then the need must be called `caffeine` to match the preset.

Sign-in PC (the open screen gives Dana's session and her files): add `lockType: "login"` and `locked: true` on the PC, `creds.username` and `creds.password` on Dana (a password is required even if the beat never uses it), an `accountProfiles` entry or PC `contents` for what she can see, and, if Dana also works, a hand-written `work` affordance on the PC (m3). Optionally add a `policy` for auto lock. That is nine concepts in four places. The payoff differs between the two versions: an event the author must map, or a session the engine grants. The concept count is fair for what the beat does. The real load is choosing among equivalent knobs and knowing which one wins.

### 6. Sync (rule q77)

No format choice forces unbounded state. Each per-run record is keyed by authored ids: `sessions` by PC, `footholds` and `gainedFootholds` by jack or implant, `feedRevealed` by post (C3 adds a seq per shown post, bounded by authored posts), `copiedItems` by item, `npcFrustration` by NPC and judged need, `loginLockouts` by PC and username. The one record keyed by player input, `loginFailures` (typed usernames), is capped at 200 non-account entries (`game.rb:2420-2450`). Globals sync by changed key (`state-sync.js:11-13`), so engine-written globals such as `<npcId>_frustration` cost one small delta per change, bounded by the NPC count.

Two things to watch. Every new per-object engine global (m4) adds keys to the synced map. Routines and traits, when they are designed, should keep schedule state on the client or send it as deltas, never as a growing log in player_state.

## Recommendations, ranked

1. **One owner field.** Add `owner` (an NPC id, or a list) on objects and items, and `private: true` at object level. Derive the workstation owner, private use, the written-down note, the desk phone, left-behind items and the Friendface phone from it. Keep `needsHome` for movement only; when `owner` is absent, fall back to it with a validator warning. The loader accepts `screenOwner`, `affordance.owners`, `phoneOwner`, `phoneOf` and `leftBehindBy` as aliases for a while, as it already does for `rfidCard` to `creds.card`. **Needs migration**: lab_physical_pentest, test_access_habits, test_access_sessions, test_access_social (and C3), test_access_work, test_capture_log, test_clone_left_card, test_needs_sims (8).

2. **One outage field and one condition grammar.** Move `offWhen` from `affordance` to the object, and use the same name and the requireGlobal form on networks and resources, replacing `downIf`. Let `spriteVariants` take the same form, so the switch and the look read one condition. A resource tied to an `object` takes its outage from that object. **Needs migration**: test_access_networks, test_access_social, test_access_work, test_needs_sims (4).

3. **Strict keys for everything new.** Add the registry entries, `affordance`, `wifi`, `feed` posts and `workarounds` to the validator's unknown-field pass, and make an unknown key there an error. Put `additionalProperties: false` on those schema blocks. **Safe now** (no scenario uses an unknown key there today; run the merge-batch validator to confirm).

4. **Make secrecy a property of the schema.** Mark server-only fields in `scenario-schema.json` (for example `"x-serverOnly": true`) and drive the NPC and top-level withholding from that table. Switch the bootstrap's top level to an allow list, as rooms already are. Add a test that fails when a server-only field appears in any route's response. Withhold `usePayload.secret` for every NPC, and serve it only through `/capture_secrets`. **Safe now** for the server change. The `usePayload` change needs a check of the existing capture missions.

5. **One home for habits, with the person deciding.** Fold `screenHabit`, `printHabit` and `usbHabit` into `habits` (`habits.screen`, `habits.print`, `habits.usb`), keep `awareness` as the preset that fills them, and treat the PC's `lockChance` as a test override. Have the validator print each workstation's effective lock rule and where it came from. Design `routines` and `traits` into the same block before they are built. **Needs migration**: test_access_habits, test_access_social, test_access_work, test_needs_sims, lab_physical_pentest (5), plus `lockChance` on PCs in 6 test scenarios if the precedence changes.

6. **One merge rule for role defaults.** Field by field, the NPC wins; list fields (`workNeeds`, `workarounds`) all take `+x` and `-x`. **Needs migration**: test_access_social, test_access_work (2). The 6 scenarios with `roles` that use only `awareness` are unaffected.

7. **One planting shape.** Express the implant as a jack-like object field (for example `implant: { pc, needs: "held" | "dropped", session: true }`) that takes its device from `requiresItem`, and drop `needsHeld`. Mark both kinds of device the same way. **Needs migration**: test_access_networks (1).

8. **Rename the collisions.** The cooler preset's `social` need becomes `chat`; `policies.*.social` becomes `socialMedia`; `accountProfiles.*.for` becomes `access`; the phone NPC's `profile` becomes `osintProfile`. **Needs migration**: test_access_social, test_access_habits, test_access_sessions, test_access_signin, test_access_work, lab_physical_pentest (profiles), and any scenario with `officePresets` and a `social` need.

9. **Write a Friendface person once.** Default `feed.person` to the NPC id and `feed.site` to the scenario's only social site. Let "has a phone" follow from holding a `phone_friendface` item, and drop `phone`. **Needs migration**: test_access_social (1).

10. **Bring the docs up to date.** Fix README's networks section and the `validate_network.rb` comment (m1). Replace slice references in schema descriptions with what the field does (m2). Fix the stale names in ACCESS_MODEL_PLAN.md 9.2 (n2). **Safe now.**
