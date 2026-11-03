# Physical-kit minigames: deduction inventory

Read-only inventory, 2026-11-02. Scope: biometrics, dusting, lockpicking, pin, password, combination, cryptex, dual-auth, rfid, ble-scanner, bluetooth, container, examine, notes, text-file, shredded-document, authenticator, alarm-panel, esd-pushbutton. All paths are under `public/break_escape/js/` unless stated; `unlock-system.js` means `systems/unlock-system.js`. Plan references are to `DEDUCTION_IMPLEMENTATION_PLAN.md` (the plan) in the parent folder.

Eldritch Hacker is browser-only and the plan's `triggers` block does not exist in the engine yet (no `systems/scenario-triggers.js`), so everything below about triggers is what a trigger can match once S18 lands. A trigger `where` is plain `===` equality on payload keys (plan §5.2, `matchesWhere`), so "enough payload" means: the key a case author needs is present, with a stable value.

## 0. How the lock minigames reach the rest of the game

Most of the group are lock minigames. They do not emit their own success event. `handleUnlock` (`systems/unlock-system.js:59`) picks the minigame from `lockType`, and its callback calls `unlockTarget` (`:669` on). Two events matter:

- Door: `door_unlocked` `{ roomId, connectedRoom, direction, lockType }` (`unlock-system.js:681-686`). `roomId` is the room the door is in, `connectedRoom` is the room it opens. `lockType` is the door's lock type (`key`, `pin`, `rfid`, ...), not the method used.
- Object that has `contents`: `item_unlocked` `{ itemId, itemType, itemName, lockType }` (`:708-713`, `:743-748`). An object with no `contents` emits nothing at all on unlock (the early `return` and the emit both sit inside `if (lockable.scenarioData.contents)` / `if (lockable.contents)`).

Before the minigame opens, a locked door also emits `door_unlock_attempt` `{ roomId, connectedRoom, direction, lockType }` (`:112-120`). Refusals emit `door_unlock_failed` and `door_unlock_failed:<connectedRoom>` with `{ ..., reason }` (`:124-131`) but only for: no key, no scanner, no card, a wrong password (`minigames/password/password-minigame.js:576-581`), a refused fingerprint (`minigames/biometrics/fingerprint-reader-minigame.js:313-325`), and a refused RFID card (`minigames/rfid/rfid-minigame.js:157-159`). PIN, combination, cryptex, lockpick and BLE give no failure event.

The server is told of every unlock (`notifyServerUnlock`, `unlock-system.js:21-49`, `apiClient.unlock(type, targetId, null, method)`), so unlocks persist in the player state. `door_unlocked_by_npc` `{ roomId, npcId, source: 'npc' }` (`systems/npc-game-bridge.js:137`) is the NPC route; a trigger on a door that either the player or an NPC can open needs both events (plan §4.6).

Common gaps (apply to every lock row below):

- G-method: neither `door_unlocked` nor `item_unlocked` says how it was opened (key, pick, clone, lift). A case that wants "the player picked it, so the owner may notice" cannot tell. Smallest fix: add `method` to both payloads. `unlockTarget` receives `serverResponse`, and `notifyServerUnlock` already has `method`; pass it through, about four lines in `unlock-system.js`.
- G-noevent: a lockable object with no `contents` gives no unlock event. Smallest fix: emit `item_unlocked` from `unlockTarget` for the no-contents case too (the ESD and SIEM paths already emit it for contentless objects: `esd-pushbutton-minigame.js:244`, `systems/interactions.js:1046`).
- G-door-id: a door has no id of its own. `where: { connectedRoom: "sanctum" }` is the only handle, and two doors into one room cannot be told apart. Fine for the fixtures (one door per room); note it for Eldritch layouts with a back stair.

---

## 1. lockpicking (`minigames/lockpicking/`)

**Player does.** Phaser pin-tumbler lock. In pick mode: hold tension, lift each pin to the shear line in the hidden binding order, with over-tension feedback (`lockpicking-game-phaser.js:1-50`, `pin-management.js:22-27`, `:607`, `:668`). In key mode: choose a key from inventory and insert it; the cuts must match within 5 units (`key-operations.js:166-213`). There is no pick-breaking and no attempt limit; closing the window is the only failure (`lockpicking-game-phaser.js:331`, `:355`, `:651-657`).

**Config.** Door or object with `lockType: "key"`, `requires: "<key id>"`, optional `difficulty` and `keyPins: [..]` (pin heights, also sets pin count) read at `unlock-system.js:176-182`, `systems/minigame-starters.js:420-440`. The player needs a `key` item (key mode), or a `lockpick` item (pick mode, `unlock-system.js:166-170`). Keys on a `key_ring` are read from `allKeys` (`:143-157`).

**Emits / writes.** Nothing from the minigame itself. Completion goes to `unlockTarget` (door_unlocked / item_unlocked, section 0). The server is told `method: 'lockpick'` or `'key'` (`minigame-starters.js:~445`; `unlock-system.js:175-181`). One unique event: `lockpick_used_in_view` `{ npcId, roomId, lockable, timestamp }` (`systems/lockpick-catch.js:48-53`), emitted when an NPC with that person-chat mapping can see the player. It stops the pick; `lockable` is a sprite object, so it cannot be matched with `where`. It reaches NPC mappings, not scenario `triggers`' `where` by id.

**Persists.** The unlock (server). No pin state or attempts.

**Deduction uses.**
- Gating access to evidence (best fit). Eldritch: the Reading Room's `lockType: key` door hides the "annotated almanac" (a `notes` item); a trigger on `door_unlocked` `{ connectedRoom: "reading_room" }` grants "Was in the Reading Room after dark" only if the player went in, but better, the clue is the item inside (see container, notes).
- Stakes. `lockpick_used_in_view` is already a cost channel: a witness who sees the pick opens a person-chat. With social influence (`06`), that chat can cost influence or set `reports`. That makes a pick a priced route and a key (from a favour) the clean one. This is the only stake the group carries for free.
- Favour/errand: "fetch the key from the sacristan's desk" is the errand; picking is the shortcut with the witness risk.
- Tampering: a lock cannot be re-locked (no `lock_door` action exists in `systems/apply-actions.js`), so a lock cannot destroy evidence on its own.
- Verdict "act": no (see ESD).
- Clue source: no.

**Gaps.** G-method, G-door-id. For "witness saw the pick" as a clue ("who saw you?") the event has no `where`-friendly payload; smallest fix: add `lockId` (door `connectedRoom` or object id) to the `lockpick_used_in_view` payload, and let the NPC mapping, not triggers, handle it.

## 2. pin (`minigames/pin/`)

**Player does.** Four-digit (or `pinLength`) keypad. A guess is checked on the server (`pin-minigame.js:330-355`, `validatePinWithServer` `:403-440`, `apiClient.unlock(type, id, pin, 'pin')`). With a `pin_cracker` item the player gets Mastermind-style lights and no attempt limit (`:43-45`, `feedbackFor` `:370-385`; cracker detection `minigame-starters.js:537-542`). Without one the limit is 5 (`DEFAULT_PIN_MAX_ATTEMPTS`) or `maxAttempts`.

**Config.** `lockType: "pin"`, `requires: "4829"` (stripped by the server before the client sees it), optional `maxAttempts`, `pinLength` (`minigame-starters.js:549-551`).

**Emits / writes.** None of its own. Success sets `gameResult` `{ success, pin, attempts, timeToComplete, serverResponse }` (`pin-minigame.js:612-621`), then `unlockTarget`. Lockout sets `{ success: false, maxAttemptsReached: true }` (`:631-636`); no event, no global.

**Persists.** Unlock only. The attempt history is a module-level `Map` (`pinAttemptHistory`, `:49-55`), so it survives closing the pad but not a reload. A lockout also resets: `attemptCount` restarts at 0 each open (`:57`), so "System locked" is not a stake.

**Deduction uses.**
- Gating access: the PIN is the lock; the PIN itself is the clue-hunt. Eldritch: the cult's ledger cabinet has a four-digit PIN that is the date of the last conjunction. A witness gives the date (a `#grant_fact`); the PIN gates the ledger (which holds the "What they carry" clue). The server holds the PIN, so it cannot be read from the client.
- Favour: a suspect "lends" the code, then it is a favour backfire candidate.
- Clue source: a PIN guess feedback is not a clue.
- Stakes: none (no persistent lockout).

**Gaps.** Lockout is cosmetic. If a case wants "too many wrong PINs alerts the cult", smallest fix: emit `pin_locked_out` `{ targetType, targetId }` from `handleFailure` at max attempts (`pin-minigame.js:631`) and persist the count via the server's existing attempt counting if it has one (not checked). Success `where`: the section 0 events.

## 3. password (`minigames/password/`)

**Player does.** Text field (optionally on-screen keyboard) with hint, post-it, and device image. The server checks case-sensitively; a near miss says passwords are case-sensitive (`password-minigame.js:5-13`, `:500-520`). `maxAttempts` default 3.

**Config.** `lockType: "password"`, `requires`, `passwordHint`, `showHint`, `showKeyboard`, `maxAttempts`, `postitNote`, `showPostit` read from the object or `doorProperties` (`unlock-system.js:280-294`). The post-it can be copied into the notebook (`password-minigame.js:~620`).

**Emits / writes.** The only lock minigame with its own failure event: `password_failed` and `password_failed:<targetId>` `{ targetType, targetId, name, lockType: 'password', caseMismatch, attemptsRemaining }` (`password-minigame.js:560-581`), plus `door_unlock_failed` for doors via `onRefused` (`:578-580`). Success: `gameResult` `{ success, password, attempts, serverResponse }` (`:526-537`) then `unlockTarget`. Max attempts ends the minigame with `reason: 'max_attempts_exceeded'` (`:586-605`).

**Persists.** The unlock. Attempts are not stored; reopening resets to the full allowance.

**Deduction uses.**
- Gating access: a suspect's laptop, a cult forum account. The password is the thing a witness or a note reveals. Eldritch: the Lodge secretary's laptop password is "wet-paint-1887"; the clue behind it is the minutes file (text-file) on "What they want".
- Clue source via the post-it: the postit note is text the player reads; `postitNote` can name a person or a place. It is copied to notes (a note, not a fact). A trigger cannot see the post-it being read.
- Stakes: `password_failed` gives a usable "wrong guesses" signal. A trigger on `password_failed:<laptop id>` `where { attemptsRemaining: 0 }` can run `deduction_tamper` (the cult wipes the laptop after three bad tries) or set a flag that closes the easy route. That is a real stake with no engine change, because `attemptsRemaining` is in the payload.
- Tampering/recovery: the wipe above, with a second route (the witness who knows the password's meaning).

**Gaps.** None for the `where` on failure. For success, use the section 0 events. A "this log-in was a guess" clue is not available.

## 4. combination (`minigames/combination/`)

**Player does.** Three-dial padlock, directions left/right/left. Server-validated as `"12-30-5"` (`combination-minigame.js:250-264`). Three attempts (`:17`), lockout closes the minigame after 2 s (`:313`).

**Config.** `lockType: "combination"`, `combination: [L, R, L]` (`unlock-system.js:207-216`); the server holds the real answer.

**Emits / writes.** Nothing but `gameResult` `{ success, combination, attempts, timeToComplete, serverResponse }` (`:290-296`) and `unlockTarget`. No failure event.

**Persists.** The unlock. Attempts reset per open (`attemptCount = 0` in the constructor).

**Deduction uses.**
- Gating access (a padlocked locker, a briefcase): Eldritch: a travelling-case of a visiting "bishop" with a combination that equals three numbers in a note. Good for the "What they carry" slot, since the case is the container.
- Verdict/stakes/tamper: no. Same shape as PIN, with less feedback.

**Gaps.** No failure signal. Smallest fix: add `combination_failed` `{ targetType, targetId, attemptsRemaining }` at `_handleFailure` (`:301`), mirroring `password_failed`. Only needed if a case wants a stake.

## 5. cryptex (`minigames/cryptex/`)

**Player does.** Lettered-wheel puzzle (default 5 wheels A-Z), with optional `hintStrip` and `wornRings` clues. Three attempts, wheels stay where they are on a miss (`cryptex-minigame.js:370-381`).

**Config.** `lockType: "cryptex"`, `cryptexConfig: { wheelCount, alphabets, answer, maxAttempts, hintStrip, wornRings }` (`unlock-system.js:195-204`; `cryptex-minigame.js:5-30`). The `answer` string is in the client config, but the check is server-side (`:300-325`).

**Emits / writes.** As combination: `gameResult` `{ success, answer, attempts, timeToComplete, serverResponse }` (`:343-349`) then `unlockTarget`. No failure event.

**Persists.** The unlock only.

**Deduction uses.**
- Gating access with a word the player has to deduce: Eldritch: the Order's reliquary cryptex whose answer is a Latin word from a note. The worn rings clue gives a physical tell ("these three rings are polished").
- Clue source: the `wornRings` are a diegetic clue about who handles it, e.g. a ring worn bright means someone opens it daily. That is text the case author controls, but it never becomes a fact on its own. To make it one, have the object's `triggerOnInteract` grant it (it fires before the lock, `systems/interactions.js:786-790`).

**Gaps.** Same as combination (no failure event, no id in `gameResult`). `answer` being in the client config makes it readable in devtools; irrelevant to deduction.

## 6. biometrics, fingerprint reader (`minigames/biometrics/fingerprint-reader-minigame.js`, `systems/biometric-lock.js`)

(The `biometrics-minigame.js` file is the kit's panel of held lifts, not a lock.)

**Player does.** At a `biometric` lock, pick one of the lifted prints from a card list; the reader scans for 0.8 s and accepts, says low quality, or says no match (`fingerprint-reader-minigame.js:171-240`). Closing without success is a plain cancel. With no lifted prints at all it shows one alert and no overlay (`:331-345`).

**Config.** Door or object `lockType: "biometric"`, `requires: "<owner>"` (string or array of owner ids/names), `biometricMatchThreshold` (0-1 or percent; default 0.4) (`systems/biometric-lock.js:26-60`; `LOCK_SCENARIO_GUIDE.md`, "biometric"). The `owner` must equal the dusted object's `fingerprintOwner`.

**Emits / writes.** `biometric_scan` `{ targetType, targetId, result: 'accepted'|'low_quality'|'no_match'|'no_samples', owner }` on every attempt (`:224-229`, `:337-340`). `owner` is the sample's owner (what was presented), not the lock's owner. Acceptance then goes to `unlockTarget`; refusals emit `door_unlock_failed` with `reason` (`:313-325`). Nothing is written to globals.

**Persists.** The player's lifts (`gameState.biometricSamples`) are synced as a whole section (`state-sync.js:24`, `:213-219`). The unlock persists server-side.

**Deduction uses.**
- Gating access plus a clue by combination. Eldritch: the Vestry's reader takes Chaplain Voss's thumb. The player lifts Voss's print from the sacramental chalice (dusting), identifies it, and uses it on the reader. The door opens, so a trigger on `door_unlocked` `{ connectedRoom: "vestry" }` grants "Voss's key-box was empty". The player has proved the chalice was Voss's (identified) by the end.
- Verdict "act": no. But a lock can act as a test: using Voss's print on the Vestry reader is a "spoof"; the case can score it as an `act` verdict only through ink or a trigger that runs `verdict` on `door_unlocked` `{ connectedRoom }`. The plan allows `act` from "an object, trigger or timer" (§3.8), so this works once S18 lands.
- Recovery: a failed or smudged lift is re-lifted from another surface of the same owner; that is the plan's fallback pattern.
- Stakes: a refused scan emits `door_unlock_failed` with reason `no_match` or `low_quality`; an NPC can react (a watcher).

**Gaps.** `biometric_scan` `owner` is the presented sample, which is fine, but `targetId` is a room id for a door and the object id for an object, with no `accepted`-only separate event. Smallest fix: none needed; `where: { targetId, result: "accepted" }` matches. For spoofing as a deduction beat ("you used Voss's print"), the `door_unlocked` payload lacks the owner used (G-method); read `biometric_scan` `{ result: "accepted", owner: "ded_voss" }` instead.

## 7. dusting (`minigames/dusting/`)

**Player does.** Five steps on a 128x128 canvas: find the latent print with a low torch, choose a powder (contrast with the surface), dust (over-brushing destroys detail), lift with tape, compare with reference cards (`dusting-game.js:1-12`, `STEPS` `:62`). Nothing can fail: no timer, no lockout; the worst result is a lower-quality lift (`:1-5`). Closing after the peel keeps the lift as unidentified (`:738-748`).

**Config.** Object scenarioData: `hasFingerprint: true`, `fingerprintOwner: "<npc id or name>"`, optional `fingerprintOwnerName`, `fingerprintDifficulty` (`easy|medium|hard`), `fingerprintCandidates` (the reference cards, names or `{ name, pattern }`), surface inferred by `surfaceForObject` (`dusting-game.js:176-182`, `:1070+`; `dusting-model.js:89`). The player needs a `fingerprint_kit` item (`systems/interactions.js:1368-1393`). With no kit the object says "There are prints on this" once.

**Emits / writes.** `recordLift` (`systems/biometrics.js:62-107`) stores a sample and emits `fingerprint_collected:<ownerId>` on every lift and `fingerprint_identified:<ownerId>` only the first time that owner is identified. Payload for both: `{ owner, ownerId, ownerName, objectId, roomId, quality, identified }` (`:91-96`). `ownerId` is the lower-cased slug (`systems/biometric-samples.js:22-24`). Toast: "Lifted ... print". The result also carries `pattern`, `surface`, `powder`.

**Persists.** `gameState.biometricSamples`, merged per owner (best quality wins, `identified` is ORed) and synced as a whole section (`systems/biometric-samples.js:5-10`, `state-sync.js:24`). A surface that has already given an excellent lift (quality 0.85+) stops intercepting interactions (`biometrics.js:12-24`).

**Deduction uses.**
- Clue source (best fit; the plan's fixture A already uses it). Slot: "where they were" (prints on the chalice put Voss in the vestry) or "what they carry/touch" (his prints on the reliquary). Eldritch: Marsh's print on the ritual wine glass grants the `sigil_ring` clue via `fingerprint_identified:ded_a_marsh` `where: { objectId: "a_wine_glass" }`.
- Tampering and recovery. Tamper: smudging the glass, with the plan's `t_a_glass_smudged` on `fingerprint_collected` `where: { objectId, identified: false }`. Recovery: a second surface carrying the same owner's print, or the bar-staff witness route.
- Gating access: combined with the reader (section 6).
- Favour: the favour errand "bring me the glass from the lodge bar" works; dusting happens in the field.
- Verdict, stakes: no.

**Gaps.**
- `fingerprint_identified` fires once per owner. After the first identification (say, from the cup), a lift identified from a second object does not emit it, only `fingerprint_collected` with `identified: true` (`biometrics.js:96-98`, `newlyIdentified`). A clue tied to the second object (`where: { objectId: "old_ledger" }`) never fires on `fingerprint_identified`. Workaround: key such clues on `fingerprint_collected:<owner>` `where: { objectId, identified: true }`, which fires every time. State this in the authoring doc; no engine change needed. Smallest fix if wanted: emit a per-lift `fingerprint_lift_identified` instead.
- `ownerId` is a slug of the owner string, not the NPC id, unless the owner string already is the id slug. Use `fingerprintOwner: "ded_a_marsh"` exactly.
- Samples live per player (not shared) but are synced; fine.

## 8. rfid (`minigames/rfid/`)

**Player does.** A Flipper-style cloner. Clone mode: read a keycard (MIFARE Classic cards need a key attack first: dictionary, darkside, nested) and save it to the cloner (`rfid-minigame.js:266-317`, `rfid-attacks.js`, `rfid-protocols.js`). Unlock mode, at a reader: tap a physical keycard or emulate a saved clone (`:97-263`). A DESFire UID-only clone is refused by readers that do not accept UID-only (`:168-196`).

**Config.** Reader: `lockType: "rfid"`, `requires: ["card_id", ...]`, `acceptsUIDOnly` (`unlock-system.js:355-367`). Card: item `type: "keycard"` with `card_id`, `rfid_protocol`, `rfid_data`; an NPC's card is `rfidCard: { card_id, rfid_protocol, name }`; the player needs an `rfid_cloner` item (`LOCK_SCENARIO_GUIDE.md`). Cloning starts from clicking a card in the world or from a conversation (`systems/interactions.js:822-835`, `:990-1000`; `minigames/helpers/chat-helpers.js:~400`).

**Emits / writes.**
- `rfid_lock_accessed` `{ mode, timestamp }` on open (`rfid-minigame.js:89-93`).
- `card_cloned` `{ cardName, cardHex, timestamp }` on a successful save (`:298-304`). No `cardId`, no owner.
- `card_emulated` `{ cardName, cardId, protocol, uidOnly, success, readerRejectsUIDOnly?, timestamp }` for each emulation (`:199-251`). `cardId` is present; the reader (door/room) is not.
- A refusal calls `onRefused(reason)` giving `door_unlock_failed` (`:127-160`; reasons `wrong_card`, `uid_only`, `no_card`, `no_reader`).
- A physical card tap emits nothing.

**Persists.** The cloner's `saved_cards` are POSTed to the server (`rfid-data.js:366-374`, fire-and-forget; lost on reload only if the POST fails). The unlock persists.

**Deduction uses.**
- Gating access (best fit): the cult's Annex door takes the acolyte's badge. The player clones it off a distracted guard.
- Clue source ("what they carry"): the cloned card's existence is the clue. Eldritch: cloning Novak's badge grants "Novak's card is a legacy EM4100" (a mark of the older cult cell). In the plan's fixture C: `t_c_badge` on `card_emulated` `where { cardName: "Novak's badge", success: true }` (plan §7.6 line ~3222).
- Favour/errand: "bring me a copy of X's badge" is a real errand.
- Stakes: a cloner can be taken by a guard (inventory item loss) only through ink.
- Tamper/recovery: the badge reader log (log filter) is a recovery route, not the cloner.

**Gaps.**
- `card_cloned` carries no stable id. `cardName` is the display name, not unique across NPCs and may be edited by copy changes. Smallest fix: add `cardId: cardData.card_id` and `cardOwner: cardData.owner || null` at `rfid-minigame.js:299-303` (the card data already carries `card_id`).
- `card_emulated` lacks the reader. The plan accepts this (§7.6) and compensates with `room`. Smallest fix: add `targetId` (the door `connectedRoom` or object id from `this.params.lockable`) at the three emit sites (`:203`, `:226`, `:245`), then `where: { cardId, targetId, success: true }` is exact.
- A plain physical card tap emits nothing, so "used Novak's real badge" is invisible to triggers; the door then emits `door_unlocked` with `lockType: 'rfid'` (G-method).

## 9. ble-scanner (`minigames/ble-scanner/`)

**Player does.** Hold a BLE scanner (`ble_scanner` item) near objects with `lockType: "ble"`. A device within 150 px appears; select one, then pair by PIN (limited tries) or by replaying a captured handshake token (SHA-256 compared with a stored fingerprint) (`ble-scanner-minigame.js:197-250`, `:452-560`, `:570-585`). Also opened from `lockType: "ble"` doors/objects (`unlock-system.js:421-450`).

**Config.** Object scenarioData: `lockType: "ble"`, `mac`, `name`, `uuids`, `allowedPins: [..]`, `maxPinAttempts` (default 3), `handshakeFingerprint` (SHA-256 hex), `hintText`, `completesTask`, `onPairSetGlobal: { var: value }` (`:452-470`, `:560-580`). Validation is local: `allowedPins` and the fingerprint are in the client's scenario data, unlike pin/password/combination/cryptex which the server checks.

**Emits / writes.** On a successful pair: `task_completed_by_npc` `{ taskId }` if `completesTask` (`:567-569`); for each `onPairSetGlobal` entry the global is written directly and `global_variable_changed:<key>` `{ name, value, oldValue }` is emitted (`:571-583`); then `complete(true)` after 2 s, then `unlockTarget` for a lock. A wrong PIN or token: UI text only, no event (`:540-547`, `:576-577`).

**Persists.** `gameState.bleDevices` `{ mac, paired, pinAttempts, ... }` (`:556-562`). Not in the `state-sync.js` section lists, so paired state and used attempts reset on reload (grep shows no `bleDevices` outside the minigame). Globals written by `onPairSetGlobal` do sync.

**Deduction uses.**
- Clue source: "what they carry". Eldritch: pairing with Brother Aldous's reliquary wearable sets `aldous_wearable_paired` and a trigger on `global_variable_changed:aldous_wearable_paired` `where { value: true }` grants `ward_charm`. The PIN is a date a witness gives.
- Gating access to evidence: a BLE-locked cabinet.
- Stakes: PIN attempts (default 3) are a loss of the route inside a session, a tamper-by-lockout, with the handshake token as the second route. The lockout lasts only until reload, so do not rely on it for hard stakes.
- Favour/errand: weak.

**Gaps.** Pair success is only visible through `onPairSetGlobal`, which authors must declare. Smallest fix for a uniform hook: emit `ble_paired` `{ mac, name, method: 'PIN'|'handshake replay' }` in `handlePairingSuccess` (`:552`). Failed attempts have no event; a stake that depends on them needs a `ble_pair_failed` `{ mac, attemptsRemaining }` at `:577`. State is not persisted across reload.

## 10. bluetooth (`minigames/bluetooth/`)

**Player does.** A passive scanner: walking within 150 px of a `lockType: "bluetooth"` object lists it with name, MAC, distance and signal; clicking a device saves it (`bluetooth-scanner-minigame.js:200-260`, `:290-330`, `:495-520`). A bluetooth lock then needs the device in the scan list with a strong enough signal (`unlock-system.js:366-420`, `minSignalStrength` default -70 dBm). No puzzle.

**Config.** Object: `lockType: "bluetooth"`, `mac`, `name`, optional `minSignalStrength`; `requires` is the MAC or name. Needs a `bluetooth_scanner` item.

**Emits / writes.** None: no events, no globals. It writes `window.gameState.bluetoothDevices` (`:538`). Unlock success goes through `unlockTarget`.

**Persists.** Not synced (no `bluetoothDevices` in `state-sync.js`; only `main.js:77` initialises it). Lost on reload.

**Deduction uses.**
- Clue source (weak as shipped): "where they were" (a phone's MAC seen in the Gatehouse) is a good fit for a case, but nothing records it for triggers.
- Gating access: a Bluetooth-locked door or locker; the only requirement is to stand near the device first.
- No fit for verdict, stakes, tamper.

**Gaps.** Needs one event for any use: emit `bluetooth_device_detected` `{ mac, name, roomId }` the first time a device is added (`addBluetoothDevice`, `:290-320`). With it, a trigger can grant "Voss's phone was in the Vestry". Smallest fix: one `window.eventDispatcher?.emit(...)` in `addBluetoothDevice`, plus persistence of the list if the clue should survive reload. Prefer `ble-scanner` for new content, since its `onPairSetGlobal` is a hook that works today.

## 11. container (`minigames/container/`)

**Player does.** Opens a drawer, safe, PC or briefcase, or an NPC's held items, and clicks items to take them. A PC/tablet is shown as a desktop with icons. Interactive items (readable notes, text files, phones, workstations, custom minigames) open a viewer instead of being taken (`container-minigame.js:440-540`). The container's contents are fetched from the server at open time and the server refuses (403) while it is locked (`:136-170`). Postit notes can be copied to the notebook (`:600-640`).

**Config.** Object: `contents: [...]`, `locked`, `lockType`, `requires`, `postitNote`, `takeable` (take the container itself). NPC mode: `npc.itemsHeld`, opened by `showNPCInventory` (`systems/npc-game-bridge.js:340-395`).

**Emits / writes.** Taking an item goes through `addToInventory`, which emits `item_picked_up:<type>` `{ itemType, itemName, itemId, collectionGroup, roomId }` (`systems/inventory.js:660-672`). Reading an interactive item with `onRead.setVariable` (or `onPickup`) writes the globals directly and emits `global_variable_changed:<var>` `{ name, value, oldValue }`, then `item_picked_up:<type>` with the same payload shape (`container-minigame.js:481-508`). Taking from an NPC emits `npc_items_changed` `{ npcId }` (`:718-722`). Closing does not emit.

**Persists.** Removal of taken items (server inventory); the container's unlock.

**Deduction uses.**
- Gating access to evidence plus clue source ("what they carry"): the best general container for evidence. Eldritch: the Warden's desk drawer holds a `ward_charm` (a takeable item) and an unsent letter (`notes`). `item_picked_up:ward_charm` `where { itemId: "warden_charm" }` grants the clue.
- Favour/errand: "bring me the bell from the vestry cupboard".
- NPC mode: a legitimate item trade (plan §3.2, route 1) opens the NPC's held items as a container; taking one fires the same `item_picked_up`.
- Stakes/verdict: none.
- Tamper: contents are server-side and static; they cannot be conditionally faded. Tamper by trigger condition (`!globalVars.deduction_faded_x` on the granting trigger) is the way (plan §3.6).

**Gaps.** `item_picked_up` has `roomId` but not the container id, so two containers holding identical item types cannot be told apart; `itemId` is enough if ids are unique. A takeable item with no `id` has `itemId: undefined` in the NPC `giveItem` path (plan §5.2 notes the same hazard). Author an `id` on every evidence item. A non-takeable readable inside a container emits `item_picked_up` only if it has an `onRead`/`onPickup` `setVariable` (`:481-508`); otherwise nothing. Authoring rule: give evidence notes a `setVariable` or make them takeable.

## 12. examine (`minigames/examine/`)

**Player does.** Views an enlarged sprite with the object's `observations` and `text`. Opened for inventory items with no other action and for text-only room objects (`examine-minigame.js:16-46`; `systems/examine.js:60-95`). Nothing to do.

**Config.** Object `observations`, `text` (with `observationVariants`/`textVariants` resolved through `utils/conditional-text.js`), not `readable`, not `locked` (`systems/examine.js:60-80`).

**Emits / writes.** Nothing. No events, no globals. Its `getTestState` exposes the item for tests.

**Persists.** Nothing.

**Deduction uses.**
- Clue source via `triggerOnInteract`: `triggerOnInteract` is applied before the examine path (`systems/interactions.js:786-790` vs `:1798`), so `[{ "type": "grant_fact", "fact": "..." }]` on a text-only object grants a clue the moment it is examined. This is the plan's "Objects" route (§3.2). Eldritch: examine the cracked candle: "wax from a black candle, the same as in the Lodge's ritual room" grants a "where they were" clue.
- Tamper: `observationVariants` keyed on `deduction_faded_<fact>` can show "Scrubbed clean" once the evidence is destroyed (no engine change).
- Everything else: no fit.

**Gaps.** None. It is a viewer. `triggerOnInteract` fires on every interaction and the grant is idempotent.

## 13. notes (`minigames/notes/`)

**Player does.** The notepad: read a note, navigate saved notes, search, edit observations (`notes-minigame.js:1-60`, `:201-210`, `:431-447`). A note read in the world is added to the notepad automatically (`autoAddToNotes`, `:660-690`).

**Config.** Item `type: "notes"` (or `notes2` ...), `readable: true`, `text`, `observations`, `important`, `takeable`, `onRead`/`onPickup: { setVariable: {...} }` (`systems/interactions.js:1620-1650`). A takeable note emits when read.

**Emits / writes.** The minigame emits only `item_removed_from_scene` `{ sprite }` (`:275-277`) and calls `RoomStateSync.removeItemFromRoom` (`:268-272`). The interaction code around it writes `onRead.setVariable` globals with `global_variable_changed:<var>` and, for a takeable note, emits `item_picked_up:<type>` `{ itemType, itemName, itemId, collectionGroup, roomId }` (`systems/interactions.js:1620-1670`). A note picked up from a container: `container-minigame.js:481-508`.

**Persists.** `gameState.notes` per player, synced (`state-sync.js:187-195`). Removal from the room persists.

**Deduction uses.**
- Clue source (strong): the plan already keys `item_picked_up:notes` `where { itemId: "hr_summary" }` (plan §7.6). Slots: "what they want" (the complaint letter, the diary page) or "where they were" (a call slip with a time).
- Tamper/recovery: `textVariants` can change a note's text when `deduction_faded_x` is set ("the page is burned"); the shredded-document minigame is the recovery.
- Evidence the player writes: `observations` are editable, but they are not facts and nothing reads them.
- Favour: a note handed over in ink via `#give_item`.

**Gaps.** The plan already notes that a non-takeable note emits nothing but its `setVariable` global, and that a restored note emits nothing (`inventory.js:262-276`, plan §5.2). Authoring rule: evidence notes are takeable or carry `onRead.setVariable`. `item_picked_up` does not fire for a note on reload, so a trigger on it fires once, good. Also, `important: true` shows a star, a free "this matters" hint to the player.

## 14. text-file (`minigames/text-file/`)

**Player does.** Reads a file in a window, with copy, select-all, "Add to Notepad" (`text-file-minigame.js:20-60`, `:140-215`).

**Config.** Object `type: "text_file"`, `text`, `name`, `fileType`, `observations`, `source`, optional `takeable`, `onRead`/`onPickup: { setVariable }` (`systems/interactions.js:1580-1620`). Inside a container, `text_file` always opens the viewer and is never taken (`container-minigame.js:455-458`).

**Emits / writes.** Each read writes `onRead.setVariable` directly and emits `global_variable_changed:<var>` `{ name, value, oldValue }` on every open, changed or not (`interactions.js:1583-1597`). If `takeable`, the first read adds it to the inventory, emitting `item_picked_up:text_file` (`:1608-1614`). The minigame itself emits nothing.

**Persists.** The inventory entry if taken; the global (synced).

**Deduction uses.**
- Clue source: logs, chat exports, a seized phone dump. "Where they were": a text file of door-badge lines; "What they want": a forum export. Eldritch: the Lodge's membership spreadsheet `text_file` read grants "Marsh paid dues for two chapters".
- Tamper: `textVariants` or `deduction_faded_` conditions on the text.
- Gating: via a locked container.

**Gaps.** `global_variable_changed` fires on every read, so a trigger on it must use `once` (default true) or `where { value: true }` and rely on `once`. For an inventory-taken file, `item_picked_up:text_file` has `itemId = data.id`; give each file an `id`.

## 15. shredded-document (`minigames/shredded-document/`)

**Player does.** Drag strips into order (optionally rotate each upright). Strips come from an authored `strips[]` array, or from `content` split into `stripCount` (default 10) word-boundary strips, which makes mid-sentence breaks (`shredded-document-minigame.js:60-125`, `:129-140`). No failure state, no timer.

**Config.** Object `type: "shredder"` or `interactionType: "shredded_document"`, with `minigameData: { title, documentTitle, strips | content+stripCount, allowRotation, successMessage, stateWrites: { onComplete: "<global>" } }` (`systems/interactions.js:1156-1164`; `systems/minigame-starters.js:910-935`).

**Emits / writes.** On a correct order: `setGlobalAndNotify(stateWrites.onComplete, true)`, which sets the global, mirrors it into `gameScenario.globalVariables`, broadcasts to NPC ink, and emits `global_variable_changed:<var>` `{ name, value, oldValue }` once (`:18-35`, `:132-139`). It is skipped if the value is already true. Reopening a completed document shows it already reconstructed (`:78`, `:97-100`).

**Persists.** The global (synced). The strip order is not saved.

**Deduction uses.**
- Recovery of destroyed evidence (best fit; the plan names it). Eldritch: the Order burned its membership roll, but the shredder bin holds it. Reassembling grants "Dr Okafor attended the 1999 rite" through a trigger on `global_variable_changed:roll_reassembled` `where { value: true }`. This is the second, ungated route for a fadable fact (plan §3.6, DL7).
- Clue source: a plain clue, as above.
- Favour: "reassemble this for me" works as an errand for a suspect who "cannot read the old script".
- No fit for stakes/verdict.

**Gaps.** None blocking. The content is in the scenario data, so the player cannot be denied it by a global. If the shredder itself should be destroyed (a second tamper), gate the object with a `deduction_faded` condition via a lighting/visibility change; not needed.

## 16. authenticator (`minigames/authenticator/`)

**Player does.** A phone-shaped overlay for the MFA fatigue demonstration. Scripted mode plays a fixed timeline of push prompts and the target's approval. Decision mode lets the player choose when and how many prompts to send; every choice lands, and the outcome panel explains why (`authenticator-minigame.js:1-30`, `authenticator-model.js:buildTimeline`). Not scored. Close and Esc never emit `minigame_failed`.

**Config.** Scripted: `pushes: [{ at, app, account, location, device }]`, `approvesAt`, `mode`. Decision: `choice`, `pushTemplate`, `defenderNote`, `strings`. As a room object: `minigameData` with `setGlobalPrefix` (`systems/minigame-starters.js:1262-1305`).

**Emits / writes.** Result `{ approvedAt, sent, mode, timing?, count? }` (`authenticator-minigame.js:434-439`). With `setGlobalPrefix: "x_"`, closing the phone writes `x_approved` (true, once an approval played) and `x_sent` (best count so far) (`minigame-starters.js:1295-1303`), through `writeGlobal`, so `global_variable_changed:x_approved` fires.

**Persists.** The two globals.

**Deduction uses.**
- Mostly "no fit" for Eldritch Hacker: it is a phishing and MFA teaching beat and its push list is attacker-side.
- Corporate Incident Simulation: a defender-side log of sign-in prompts with `location` and `device` fields is a plain "where they were" source (the 03:12 approval came from "Lagos"). Today it is flavour only; the data shown never becomes a fact.
- A trigger on `global_variable_changed:<prefix>approved` `where { value: true }` could grant "the target approved a late prompt" as a clue about a negligent insider.

**Gaps.** The pushes shown (`location`, `device`) are not matchable. Smallest fix: allow `minigameData.grantFacts: [{ whenPushId, fact }]` or, simply, author the grant on the object with `triggerOnInteract` and accept that it fires on opening, not on reading a given row. Not recommended for Eldritch.

## 17. dual-auth (`minigames/dual-auth/`)

**Player does.** A two-keypad panel: the IT Security officer and the Clinical Engineering officer each enter their own PIN; both must be confirmed, then "Authorise". A five-minute countdown starts on open (`dual-auth-minigame.js:7-30`, `:150-260`, `_startCountdown` `:267-296`). Wrong PINs flash "ACCESS DENIED" and clear; there is no attempt limit.

**Status: not wired.** Nothing imports `dual-auth/dual-auth-minigame.js`: it is not exported or registered in `minigames/index.js` (compare `backup-recovery`, `:40`, `:173`, `:214`), `unlock-system.js` has no `dual_auth` lock case (an unknown `lockType` falls to the default "requires dual_auth to unlock" alert, `:570-573`), and `systems/interactions.js` has no dispatch for it. Only the art (`core/game.js:1314`) and `scenarios/sis01_healthcare/scenario.json.erb:34` (which says "IMPLEMENTED") refer to it. Treat it as dead code until someone registers it and adds the lock case; verify in a live run before a mission leans on it.

**Config (as written).** `lockType: "dual_auth"` with `minigameData: { itsec_pin, clinical_pin, ...text overrides }` (`:12-17`). Both PINs are client-side data, not server-checked.

**Emits / writes.** Fixed global names, written through `npcManager.setGlobalVariable` or directly, always with `global_variable_changed:<name>`: `itsec_authorised` (`:205`), `clinical_eng_authorised` (`:208`), `network_isolation_authorised` and `network_isolated` (`:256-257`), and on timeout `dual_auth_failed` (`:307`). It calls `notifyServerUnlock(..., 'dual_auth')` on authorise (`:260-266`). Result `{ serverResponse }`.

**Persists.** The globals (synced) and the server unlock.

**Deduction uses.**
- Corporate Incident Simulations: gating a decisive action behind two named roles. Stakes: the 300 s timer failing sets `dual_auth_failed`, a clean loss trigger (`global_variable_changed:dual_auth_failed` `where { value: true }`); a trigger could then run a `deduction_tamper` or a stakes action.
- Verdict "act": `network_isolated` is the commit ("pull the network"); a trigger on it can run an `act` verdict against the incident's culprit host/person, once the PINs have been learned from two witnesses (each PIN is a clue-gated errand).
- Eldritch: no natural fit (modern-hospital flavour), unless re-skinned as a two-key ritual lock; the global names are hard-coded.

**Gaps.** Global names are fixed (cannot reuse the panel twice in one mission with separate outcomes). Smallest fix: allow `minigameData.vars` overrides for the five names. PINs are client-visible. The timer is not persisted.

## 18. alarm-panel (`minigames/alarm-panel/`)

**Player does.** Looks at a read-only lamp panel. Lamps show the current state of authored global variables, live while open (`alarm-panel-minigame.js:1-30`, `:122-145`). No interaction.

**Config.** Object `type: "alarm_panel"` with `minigameData: { lamps: [{ label, variable, offClass, offStatus, onClass, onStatus, flash }] | multi-state { label, variables, states }, panelTitle, footer }` (`systems/interactions.js:1325-1334`; `minigame-starters.js:995-1005`).

**Emits / writes.** Nothing. It subscribes to `global_variable_changed:<var>` for each lamp and unsubscribes on cleanup.

**Persists.** Nothing.

**Deduction uses.**
- Stakes display: an alarm panel as the visible meter of the opposition's mood. Eldritch: three lamps for "Warden alerted", "Ritual advanced", "Evidence destroyed", each tied to a global set by tampering, `reports` thresholds or a `deduction_faded_*` flag, with a multi-state lamp for ritual progress. This is a diegetic read of the stakes the plan keeps in globals.
- Verdict channel: none (it cannot act).
- Clue source: a lamp state can be a clue only if an author wires the global to a fact elsewhere.

**Gaps.** None. Note `deduction_faded_<fact>` globals will drive a lamp with no change, since it listens to `global_variable_changed:`. Check that the deduction runtime writes them through `writeGlobal`.

## 19. esd-pushbutton (`minigames/esd-pushbutton/`)

**Player does.** Flip a guard cover, press a red button, confirm a modal. One-shot: once activated the object is spent (`esd-pushbutton-minigame.js:60-150`). It is armed only if an authorisation global is true.

**Config.** Object `type: "emergency-button"` (`systems/interactions.js:1312`; opened by `startEsdPushbuttonMinigame`, `minigame-starters.js:729-748`) with `minigameData: { label, authVar (default esd_authorized), activatedVar (default esd_activated), completionActions: [...], conditionalActions: [{ ifGlobalFalse | ifGlobalTrue, actions }], confirmDesc, unauthorizedText, unauthorizedTextVariants, alreadyActiveText, confirmedText, title, cancelText }` (`:5-28`).

**Emits / writes.** On confirm: all `completionActions` and `conditionalActions` run through `applyActions` with `source: 'esd_minigame'` (`:204-225`), so any action type works (`set_global`, `grant_fact`, `emit_event`, `complete_task`, `unlock_door`, `hint`, `give_item`, and later `verdict` / `deduction_tamper`). It also sends an `unlock_object` action (persisted via the API), sets `scenarioData.esdState = 'activated'`, adds the id to `gameState.unlockedObjects`, and emits `item_unlocked` `{ itemId, itemType, itemName, lockType: 'esd_button' }` (`:228-250`). Sound `confirm` and `success`.

**Persists.** The object unlock (server), `unlockedObjects`, and the `activatedVar` global if `completionActions` sets it (it does not set it itself; it reads `activatedVar` to detect a spent button).

**Deduction uses.**
- Verdict "act" (best fit in the group). It is a warned, irreversible, authorised act with a confirm modal, which matches the plan's "warned route" rule for closing. Eldritch: the Sanctum's "seal" lever. `authVar` is set when the player holds enough evidence (e.g. `global_variable_changed:evidence_enough`), and `completionActions` run `{ "type": "verdict", "kind": "act", "suspect": "ded_voss" }` (once the runtime defines it) plus a `show_end_screen`. For Incident Simulations: the "isolate the compromised host" button.
- Stakes: the button's cost goes in `completionActions`: lose a resource, trigger a tamper.
- Gating: `authVar` gates the act behind prior deduction.
- Clue source/tamper/recovery: no.

**Gaps.** `unauthorizedTextVariants` and `authVar` let a case gate the act, but `authVar` is an exact global name read at open time, so the case must write it from a trigger. `activatedVar` is never written by the minigame (completion relies on the author including a `set_global`); a mission that forgets this lets the button be pressed again. Smallest fix: `applyEsdOutcome` writes `activatedVar` itself (one `writeGlobal` call, `esd-pushbutton-minigame.js:~222`).

---

## Summary table

| Minigame | Best deduction roles | Event for `triggers` | Gap |
|---|---|---|---|
| lockpicking | gate to evidence; stakes via witness catch (`lockpick_used_in_view`); favour (key vs pick) | `door_unlocked` `{connectedRoom, lockType}` / `item_unlocked` `{itemId}` | no `method` in unlock payloads; no event for contentless objects; catch event carries a sprite, not an id |
| pin | gate; PIN as witness-fed clue | `door_unlocked` / `item_unlocked` | no failure event; lockout resets on reopen (no stake). Fix: `pin_locked_out` |
| password | gate; stake and tamper via failure event | `password_failed:<id>` `{attemptsRemaining, caseMismatch}`; unlock events | none for failures. Post-it read is not a fact |
| combination | gate (locker, case) | unlock events | no failure event. Fix: `combination_failed` |
| cryptex | gate by deduced word; `wornRings` as authored tell | unlock events; `triggerOnInteract` for the tell | no failure event; answer in client config |
| biometrics (reader) | gate plus spoof; "act" via an authored trigger | `biometric_scan` `{targetId, result, owner}`; `door_unlocked` | `door_unlocked` lacks the owner used; read `biometric_scan` |
| dusting | clue source (where / carried), tamper (smudge), recovery (second surface) | `fingerprint_identified:<ownerId>` / `fingerprint_collected:<ownerId>` `{objectId, identified, quality}` | `identified` fires once per owner; key later objects on `fingerprint_collected` `where identified:true` |
| rfid | gate; clue (carried card); errand | `card_cloned` `{cardName}`; `card_emulated` `{cardName, cardId, success}` | `card_cloned` has no id/owner; `card_emulated` has no reader; tap emits nothing. Fix: add `cardId`, `targetId` |
| ble-scanner | clue (carried device); gate; attempt-limit stake (session only) | `global_variable_changed:<onPairSetGlobal key>` | no pair event of its own; failures silent; state lost on reload. Fix: `ble_paired` |
| bluetooth | weak: where-they-were clue; gate | none (emits nothing) | needs `bluetooth_device_detected`; not persisted |
| container | gate; clue (carried item); NPC-mode trade; errand | `item_picked_up:<type>` `{itemId, roomId}`; `item_unlocked`; `global_variable_changed` | no container id; id-less items give `undefined`; non-takeable reads emit only if `setVariable` |
| examine | clue via `triggerOnInteract`; tamper via variants | none (use `grant_fact` in `triggerOnInteract`) | none (viewer) |
| notes | clue source (want / where); tamper and recovery via `textVariants` | `item_picked_up:notes` `{itemId}`; `global_variable_changed` | non-takeable and restored notes emit nothing; give notes `id` and `setVariable` |
| text-file | clue source (logs, exports); tamper via variants | `global_variable_changed:<onRead var>`; `item_picked_up:text_file` | global fires every read (needs `once`); give every file an `id` |
| shredded-document | recovery of destroyed evidence; plain clue; errand | `global_variable_changed:<stateWrites.onComplete>` `{value:true}` | none |
| authenticator | corporate only: where-they-were log; mostly no fit for Eldritch | `global_variable_changed:<prefix>approved` | push rows are not matchable; flavour only |
| dual-auth | corporate gate; stake (timeout); "act" via `network_isolated` | `global_variable_changed:network_isolation_authorised` / `dual_auth_failed` | NOT registered in `minigames/index.js` and no `dual_auth` lock case; global names fixed; PINs client-visible or dispatched (dead code today) |
| alarm-panel | stakes display (read-only lamps on globals); no verdict | none (listens to `global_variable_changed`) | none |
| esd-pushbutton | verdict "act" (best), gate by `authVar`, stake in `completionActions` | `item_unlocked` `{itemId}`; actions run via `applyActions` | `activatedVar` not written by the minigame. Fix: write it in `applyEsdOutcome` |
