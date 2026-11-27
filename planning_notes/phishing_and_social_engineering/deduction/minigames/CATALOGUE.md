# Deduction catalogue: how each minigame serves a case

Status: design, 2026-11-03. Ready to fold into `DEDUCTION_IMPLEMENTATION_PLAN.md` (§3.2 sources, §7 authoring,
§10 packets). Built from the three inventories in this folder (`INVENTORY_SE.md`, `INVENTORY_PHYSICAL.md`,
`INVENTORY_CYBER.md`), `DRIFT_2026-11.md` and `planning_notes/eldritch_hacker/DIRECTION.md`, with spot checks
of the code where a recommendation depends on it. Paths are under `public/break_escape/js/` unless stated.

**What "wiring today" means.** The `triggers` block (S18) and the ink tags (S19) are not built yet. "Today"
in this file means *with Phase 10's triggers, tags and actions in place and no change to the minigame*. A
trigger `where` is plain equality on top-level payload keys (§5.2); `condition` reads globals only.

**Corrections to the inventories (checked in code).**

- **inbox-triage has no per-message write.** `systems/triage-starter.js:131-140` writes only
  `<prefix>percent`, `reportRate`, `complete` and `pass` per round, plus `inbox_triage_completed`. There is no
  "flagged this sender" global, so INVENTORY_SE's "flagging a sender grants a marked clue" needs an engine
  change. It is a round gate, not a clue source.
- **concern-form does write, through the exercise station.** It runs as an `exercise-station` scene
  (`systems/exercise-station-starter.js`), which writes `<prefix>done` and emits `concern_form_completed`
  `{ exerciseId, scene, prefix, result }`, where `result` is `concernRecord()` with `factIds` and
  `conclusionIds` (`concern-form-model.js:210-215`). The picks are nested, so a `where` cannot read them. The
  verdict hook is therefore a small write, not a new launch path.
- **`triggerOnInteract` skips the lock.** `systems/interactions.js:788-792` runs the actions and returns
  before any lock or minigame handling. A `grant_fact` on a *locked* object fires on the first click, and the
  lock is never offered. Locked evidence must sit inside `contents` (a container), never on the lock itself.
- **The launch registry covers nine types** (`systems/minigame-registry.js:24-34`): `case-file`,
  `osint-workstation`, `triage-workstation`, `authenticator-device`, `kiosk`, `page-builder`,
  `report-workstation`, `mail_terminal`, `exercise-station`. `#trigger_minigame` and `openMinigame` reach only
  these. A coverage form, log filter or shredded document opens from a placed object only.

## 1. Roles

A case gives each minigame one or more of these jobs. A minigame's primary role is the one it does best;
it can take a secondary one in another case.

| Role | What it does in a case |
|---|---|
| **Clue source: where they were** | Grants a `pass` / location / alibi fact. Logs, prints on a surface in a room, a reader that took a card, a post with a place and time |
| **Clue source: what they want** | Grants a motive fact. A letter, a ledger, a payment trail, a post, a DM |
| **Clue source: what they carry** | Grants a possession fact. An item in a drawer or bag, a cloned card, a paired wearable, a record of issue |
| **Marked clue** | Any of the above where the clue type carries the opposition's mark (a sigil, a forum handle, a ritual date). The minigame does nothing special: the mark is on the clue type in `social.deduction`. It matters for which minigames *can* show a mark naturally (a handle on a post, a sigil on a ring) |
| **Evidence gate** | Stands between the player and a clue source. A lock, a code, a reader. It grants nothing itself, and its unlock event is rarely the clue (the thing inside is) |
| **Tamper target** | Something the opposition can destroy, or whose failure the case can treat as destruction (`deduction_tamper` on a beat, or on a failure event). Needs a second, ungated route (DL7) |
| **Recovery route** | The ungated second route for a fadable fact: puts back what a tamper took |
| **Verdict channel** | Commits a verdict of a given kind: `accuse` (confront in conversation), `report` (name names to an authority), `act` (use the knowledge: lock in, seize, isolate), `trust` (vouch for, a clear verdict), `final` (the board's "Make the call") |
| **Favour errand** | The real errand a suspect's favour asks for: fetch, open, copy, reassemble. Done, it runs `#deduction_favour` |
| **Stakes carrier** | Makes a cost visible or felt: a lamp, a countdown, a route that closes, a witness who sees the pick |
| **Unique-item sighting** | A non-verdict sighting of a `count: 1` clue (a camera feed, a photo in a post) that opens the §3.5 choice |
| **Case display** | Shows the case state outside the board: a timeline of held clues, destroyed evidence, stakes |
| **Debrief / close** | A surface for, or a gate on, the warned close and what follows it |
| **Approach gate (pretext prep)** | Makes the player assemble held facts before a conversation, so a witness or suspect is approached with a reason |
| **No fit** | Nothing it writes or shows reaches the board, or its content cannot be about another person |

## 2. The catalogue

Skin codes: **EH-C** Eldritch Hacker, cult layer (members' posts, forum, DMs, gatekeeper, rituals,
physical kit); **EH-I** Eldritch Hacker, Institute layer (the Tesseract Research Institute's staff email,
sign-ins, records); **IS** Incident Simulations (corporate); **SEC** sector-only (clinical, industrial,
insurance copy is hard-coded); **VM** VM-backed, out of scope. Gap: **none**, **small fix** (with the §4
id), or **not worth it**.

### 2.1 Social engineering and conversation (16)

| Minigame | Roles (primary first) | Skin | Wiring to the deduction layer today | Gap |
|---|---|---|---|---|
| intel-board | Case display (the board), verdict `final`, debrief | EH-C, EH-I, IS | Is the board: `case-file` object with `minigameData.mode: "deduction"` (§3.7); also `#trigger_minigame:case-file mode=deduction` and `openMinigame` (§4, E1) | Phase 10 core (S22 board mode); E1 starter pass-through |
| person-chat | Verdict `accuse` / `trust` / `report`, clue source (witness, any slot), favour ask, unique-item choice | EH-C, EH-I, IS | `#grant_fact`, `#verdict:*`, `#deduction_favour` (S19); `#give_item` for held items; pretext path already grants (`person-chat-pretext.js:204-214`) | Phase 10 core (S19 tags) |
| phone-chat | Verdict `report` (the handler or manager call), clue source (remote witness, informant), favour ask; the cult's DMs in the `social` app theme with `handle` and `profile` (`phone-chat/phone-app.js`, `validate_social/dm_app.rb`) | EH-C (DMs), EH-I, IS | Same tags as person-chat; `conversation_closed:<npcId>` | Phase 10 core (S19 tags) |
| osint-browser | Clue source (any slot, marked: a handle, a sigil in a photo), unique-item sighting | EH-C (members' posts, forum), EH-I (staff pages), IS (press, profiles) | A selected metadata field calls `grantFact` directly (`osint-browser-minigame.js:656-674`). The fact needs its `deduction` field (§4.2) | none |
| mail-client | Clue source (reader highlight, any slot; the sender header is a natural marked clue); verdict `report` (forward to security) only after E9 | EH-I (Institute mail), IS | Highlight `grants: <fact>` calls `grantFact` (`mail-client-minigame.js:1217`) | none for clues; small fix E9 for a report |
| pretext-prep | Approach gate | EH-C, EH-I, IS | Launches the chat with `pretextCallId`; the chat writes `pretext_<callId>_outcome`; a successful `pretext_ask` grants through `applyGrants` | none |
| concern-form | Verdict `report` (IS: "raise a concern", facts over conclusions) | IS, EH-I (Institute HR) | `exercise-station` object or `#trigger_minigame:exercise-station exerciseId=<id>`; writes `<prefix>done`, emits `concern_form_completed`. Today a trigger can tell only *which station* finished (`where: { exerciseId }`), not who was named | small fix E3 |
| inbox-triage | Approach gate / warm-up (a round's `<prefix>pass` lets a handler trust the player's read), weak clue gate | EH-I, IS; EH-C only with a DM reskin | `global_variable_changed:<prefix>pass` (`where: { value: true }`) grants one clue or opens a topic | per-message grants not worth it (mail-client does it) |
| ncsc-brief | Case display ("what to look for" dossier), clue gate | EH-C (a SAFETYNET field brief on the Cabal's tells), IS (an advisory) | `global_variable_changed:<reviewedVar>` | none |
| engagement-report | Debrief / close (the SE lab only) | IS (lab) | `global_variable_changed:report_filed` can open the warned close | not worth it outside the lab |
| landing-page-builder | Approach gate (a forged invitation gets the player into a gathering) | EH-C, with the weaponisation check repeated for the skin (DIRECTION) | `global_variable_changed:landing_<pageId>_built` | none |
| episode-runner | No fit (a host for awareness stages) | IS | n/a | not worth it |
| password-guesser | No fit (about the learner's own account) | IS | n/a | not worth it |
| privacy-panel | No fit (read-only by design) | IS | n/a | not worth it |
| sort-drill | No fit (teaching only) | IS | n/a | not worth it |
| assistant-chat | No fit (episode-bound, nothing leaves it) | IS | n/a | not worth it |

### 2.2 Physical kit (19)

| Minigame | Roles (primary first) | Skin | Wiring today | Gap |
|---|---|---|---|---|
| dusting | Clue source (where they were, what they carry/touch), tamper target (smudge), recovery (a second surface or a witness) | EH-C, EH-I; IS rarely | `fingerprint_identified:<ownerId>` `where: { objectId }` for the first object; `fingerprint_collected:<ownerId>` `where: { objectId, identified: true }` for any later one (the identified event fires once per owner, `biometrics.js:96-98`); a lost lift on `identified: false` opens the fallback (§9.2) | none (authoring note, E2) |
| biometrics (reader) | Evidence gate; corroboration (the reader accepting a print confirms whose it is) | EH-C, EH-I | `biometric_scan` `where: { targetId, result: "accepted", owner }`; `door_unlocked` | none |
| rfid | Evidence gate, clue source (what they carry: the card; where they were: at the reader that took it), favour errand ("copy their badge") | EH-C, EH-I, IS | `card_emulated` `where: { cardName, success: true }` plus the trigger's `room`; `card_cloned` `where: { cardName }` | small fix E4 (`cardId`, reader id) |
| container | Evidence gate plus clue source (what they carry), NPC-mode trade, favour errand source | EH-C, EH-I, IS | `item_picked_up:<type>` `where: { itemId }`; `item_unlocked` `where: { itemId }` | none (give every evidence item an `id`) |
| notes | Clue source (what they want, where they were), favour gift, tamper display (`textVariants`) | EH-C, EH-I, IS | `item_picked_up:notes` `where: { itemId }`; `onRead.setVariable` for a non-takeable note | none |
| text-file | Clue source (logs, exports, a seized dump), tamper display | EH-I, IS, EH-C | `global_variable_changed:<onRead var>` (fires on every read: rely on `once`); `item_picked_up:text_file` | none |
| examine | Clue source through `triggerOnInteract`, unique-item sighting, tamper display (`observationVariants`) | EH-C, EH-I, IS | `triggerOnInteract: [{ "type": "grant_fact" }]` on an unlocked, non-container object | none (but see E2's lint: never on a locked object) |
| shredded-document | Recovery route (best), clue source, favour errand ("put this back together for me") | EH-C, EH-I, IS | `global_variable_changed:<stateWrites.onComplete>` `where: { value: true }` | none (schema entry, E2) |
| lockpicking | Evidence gate, stakes carrier (`lockpick_used_in_view` opens a watcher's chat), favour shortcut (pick it, or fetch the key) | EH-C, EH-I | Grant from what is inside, or `door_unlocked` `where: { connectedRoom }` plus `door_unlocked_by_npc` | none; E5 (`method`) is 10b |
| pin | Evidence gate; the code is the reward of a witness or favour | EH-C, EH-I, IS | Section 0 unlock events | lockout not worth it |
| password | Evidence gate, tamper target (three wrong tries wipes it), clue (the post-it, as text only) | EH-I, IS, EH-C (a forum account) | `password_failed:<id>` `where: { attemptsRemaining: 0 }` runs `deduction_tamper`; success through the contents | none |
| combination | Evidence gate (a case, a locker: the carry slot) | EH-C, EH-I | Unlock events | failure event not worth it |
| cryptex | Evidence gate (a word the player deduces); worn rings as flavour | EH-C | Unlock events; the tell through a separate examine object | none |
| ble-scanner | Clue source (what they carry: a paired wearable), evidence gate | EH-C (a reliquary wearable), EH-I, IS | `global_variable_changed:<onPairSetGlobal key>` `where: { value: true }` | none for clues; persistence not worth it |
| bluetooth | Weak clue source (a device seen in a room) | EH-C, IS | Nothing to key on (emits nothing) | not worth it (use ble-scanner) |
| alarm-panel | Stakes carrier, case display (lamps on `deduction_faded_*`, escalation globals) | EH-C, EH-I, IS | Lamps read globals live through `global_variable_changed:<var>` | none, if the runtime writes through `writeGlobal` (it does, §5.5) |
| esd-pushbutton | Verdict `act` (best physical act), stakes carrier, gate (`authVar`) | EH-C (the seal lever), IS (isolate the host) | `completionActions: [{ "type": "verdict", "kind": "act", "suspect": "<s>" }, …]` run through `applyActions` directly (`esd-pushbutton-minigame.js:204-225`) | small fix E6 (`activatedVar`) |
| authenticator | No fit in EH-C; flavour clue in IS (a sign-in prompt's place) | IS, EH-I | `global_variable_changed:<prefix>approved` | not worth it |
| dual-auth | Would be gate plus `act` | SEC (sis01) | Not registered in `minigames/index.js`, no lock case: dead code | not worth it now |

### 2.3 Cyber and sector (19)

| Minigame | Roles (primary first) | Skin | Wiring today | Gap |
|---|---|---|---|---|
| log-filter | Clue source (where they were: rows place people), tamper target (`stateOverrides` redacts a row), recovery (an audit tab) | IS (strong), EH-I; EH-C only as a relabelled log | Completion global from `completionActions` `set_global` → a trigger grants every row's fact at once. The anomaly must be a non-suspect row (§9.1-§9.3); `progressActions` `tab_viewed` for a tab | small fix E7 (per-record writes); columns E8 |
| forensic-data-platform | Clue source (log tables, excerpts), recovery display (`showIf: "se_intel_<f>"` shows a block once recovered), weak `act` (confirm) | EH-C, EH-I, IS (all text is data) | `global_variable_changed:<reviewedVar>` (first open), `<confirmedVar>` (confirm) | small fix E7 (`tab.onView`, negated `showIf`) |
| claims-management-system | Clue source (a dossier: each tab its own global) | EH-I (HR files), EH-C (a membership roll), IS | `global_variable_changed:<stateWrites[<section>]>` | redaction (`hideIf`) not worth it now |
| blockchain-explorer | Clue source: what they want, marked (mixer-match: who paid the purse), recovery by re-deriving | EH-C, EH-I, IS (mixer-match is all data; explorer mode has crypto copy) | `global_variable_changed:<stateWrites.onTraced>` → `grant_facts` | small fix E10 (per-deposit write) |
| backup-recovery | Recovery route, stakes carrier (the compromised source reinfects) | EH-C, EH-I, IS (cards are data) | `global_variable_changed:backup_restore_initiated` `where: { value: true }`, `condition` on `backup_recovery_source`; declare `network_isolated: true` or a clean restore reinfects after 30 s | fixed names and one restore per game: not worth it now (authoring note E2) |
| command-board | Case display (timeline of held clues), tamper log, stakes status | EH-C, EH-I, IS (config-driven) | `commandBoard.timeline[].condition` and `statusRows` read `se_intel_<f>`, `deduction_faded_<f>`, stakes globals (`command-board-timeline.js`) | none; event-time field not worth it |
| coverage-decision-form | Verdict `report`, or per-suspect `final`-like sheet | IS; EH-I with the header made a key | `completionActions` `{ setVariable, fromSection, equalsValue }` → trigger on the global runs `verdict` | small fix E11 (reopen, header) |
| network-segmentation-map | Verdict `act` (isolate after dual approval), stakes | IS, SEC | `global_variable_changed:<severVar>` `where: { value: true }` | ink cannot see it live (C2): E12 |
| sis-config-threshold | Verdict `report` (who changed what), tamper subject | SEC | `global_variable_changed:sis_tamper_confirmed` | not worth it (hard-coded strings) |
| scada-historian | Clue (when a record was falsified) | SEC | `completionActions` `set_global` → trigger `where: { value: true }` (payload has no `name`) | not worth it now |
| siem | Weak stakes | SEC, IS | `item_unlocked` on success | not worth it (`alertConfig` unpassed) |
| drug-library-integrity | Recovery template (detect, diff, two sources, restore) | SEC | `global_variable_changed:drug_library_restored` | not worth it (use forensic + backup) |
| ehr-terminal | Clue (a record of what someone holds) | SEC | `ehr_terminal_viewed_online` (any record) | not worth it |
| infusion-pump | No fit | SEC | n/a | not worth it |
| ransomware-display | Stakes display (a deadline) | IS, SEC | No event | not worth it |
| warranty-checklist | Would be `final` | SEC | Per-row result never leaves it | not worth it (the board's final call does this) |
| network-architecture | Clue (who connects to whom) | EH-I, IS (legend is IT copy) | `global_variable_changed:<reviewedVar>` | not worth it now |
| flag-station | No fit | VM | n/a | n/a |
| vm-launcher | No fit | VM | n/a | n/a |

**Counts.** 54 minigames. With a working role in Eldritch Hacker or Incident Simulations: 34. No fit or not
worth wiring: 20, of which 11 are sector-only or VM (counting dual-auth and ransomware-display).

## 3. Case patterns

Each pattern is a reusable shape. "Slot" is what it teaches the player to fill; "lesson" is the Cyber Security
point the debrief or the handler can make in one line.

### P1. Who posted it

- **Uses:** osint-browser (a post's metadata field is the clue); phone-chat in the `social` theme (the
  handle's DMs); optionally a second site.
- **Eldritch:** a lodge forum post signed `@lanternbearer` announces "the Codex comes to us at the open
  evening". The post is the *want* clue, marked (the handle is the cult's). On a second site, a reading-group
  page lists `@lanternbearer` as "Y. Ishikawa": the player learns the handle is reused, but a handle names an
  account, not a hand.
- **Corporate:** a leaked-data post on a paste site under a handle that matches a staff member's gaming
  profile.
- **Slot:** what they want (marked).
- **Lesson:** OSINT attribution. Handles get reused across sites, which is how investigators link them, and
  a shared or stolen handle is why one match is not proof.
- **Play moment:** clicking the field on the second site and watching a hidden cell flip on the board.
- **Risk:** the handle decides too much if it maps one-to-one to a guilty suspect. Make it one marked clue among
  the three a Devotee needs, or give the handle to an innocent too (a shared reading-group account).

### P2. The cult's DMs

- **Uses:** mail-client reader highlights (Institute layer); phone-chat `social` theme DMs with `#grant_fact`
  on a shown line (cult layer); inbox-triage as a warm-up round whose `<prefix>pass` makes the handler trust
  the player's read.
- **Eldritch:** a seized phone shows a DM thread from the gatekeeper: "Bring the brass key. Wear no ward."
  The highlighted line grants Okafor's *carry* clue; the sender's handle is marked.
- **Corporate:** an Institute email whose `From` header does not match its `Reply-To`; the highlight grants
  "sent the invoice change request" on one employee.
- **Slot:** what they carry / what they want.
- **Lesson:** reading a message for its tells: sender authentication on email (Institute) and recruitment or
  grooming pressure in DMs (cult).
- **Play moment:** a highlight lighting up in the reader as the board's toast lands.
- **Risk:** inbox-triage cannot grant per message (§0 correction), so never promise "flag the right one and
  learn who". Keep triage as the gate, the reader as the source.

### P3. Badge trail

- **Uses:** rfid (clone a card in conversation, emulate it at a reader); log-filter with the suspects' rows and
  a non-suspect anomaly; optionally text-file for a printed door log.
- **Eldritch:** the archive's badge log places Venn and Ishikawa in the archive and Okafor in the lecture hall
  (fixture A). Cloning Novak's badge and using it at the garage reader shows "last used 03:40" (fixture C).
- **Corporate:** the server room door log on the night of the leak.
- **Slot:** where they were.
- **Lesson:** access logs record a card, not a person. A cloned or lent badge puts the card in the room, so a
  log entry is evidence about the card first. Legacy cards with no protection clone in seconds.
- **Play moment:** filtering by time and seeing two names drop out.
- **Risks:** the log filter's single flaggable anomaly would point at one person; it must be a non-suspect row
  (a staff badge used twice). One completion grants every row: fine for "where", but do not put a *carry* or
  *want* clue in the same log. E7 lets each lookup grant only that suspect's row.

### P4. Prints on the chalice

- **Uses:** dusting; the fallback witness topic on a lost lift; optionally the biometric reader.
- **Eldritch:** Marsh's print on the wine glass grants her sigil ring (fixture A). Later, the vestry reader
  takes Chaplain Voss's lifted thumb, and the open door confirms whose print it was.
- **Slot:** what they carry, or where they were.
- **Lesson:** biometrics are not secrets. Prints are left everywhere, can be lifted and replayed, and a reader
  that accepts a lifted print shows why a fingerprint alone is a weak factor.
- **Play moment:** the low torch finding the latent print; the reference card matching.
- **Risk:** an excellent lift logged as unidentified ends that surface for good. Every dusting clue needs the
  `identified: false` fallback (§9.2), or a second surface.

### P5. Shredded minutes

- **Uses:** `deduction_tamper` at a beat; the original as a notes or examine object whose `textVariants` reads
  "burned" once faded; shredded-document as the ungated recovery.
- **Eldritch:** after the second stop the cult burns the lodge minutes; the bin holds the strips. Reassembling
  them grants "Sold one ward charm to M. Chen" (fixture D's shred).
- **Corporate:** the departing manager shreds the access request forms; the strips are in the confidential
  waste sack.
- **Slot:** any; usually what they carry or want.
- **Lesson:** data remanence. Strip-cut shredding, deletion and "burn it" rarely destroy information; secure
  disposal is a control, and recovery is part of incident response.
- **Play moment:** the last strip dropping into place and the "Evidence destroyed" cell turning back.
- **Risk:** low. The recovery always works, so keep the tamper's timing fair (two minutes or more between beats,
  §9.4) and the strip count around 8 to 10.

### P6. Restore the backup

- **Uses:** backup-recovery with one clean source, one compromised source and an item-backed key slot.
- **Eldritch:** the lost-phone kiosk restores de Vries's phone from the railway's copy (fixture D). In a lodge:
  "the archivist's offsite copy" (needs the brass key in its slot) against "the lodge's own synced ledger"
  (compromised).
- **Corporate:** restore the deleted mailbox from the offline tape, not the cloud sync the insider controls.
- **Slot:** the faded fact's slot.
- **Lesson:** backups that the attacker can reach are not backups. Keep an offline copy, check a source before
  restoring, and isolate first.
- **Play moment:** choosing between two plausible sources, with the cost of the wrong one visible.
- **Risks:** one restore per game (fixed global names), and a clean restore reinfects after 30 s unless the
  scenario declares `network_isolated: true`. A compromised pick should cost a second tamper or a closed route,
  never the case.

### P7. Follow the money

- **Uses:** blockchain-explorer in `mixer_match` mode; `onTraced` grants the senders' facts.
- **Eldritch:** the Cabal's tithes pass through an "offering pool". The player links each deposit to its
  payout by amount less the fee and the hold window, then names the slot they all reached: the lodge purse.
  Two named depositors get "funds the lodge" (marked *want*); a third deposit, from a guest's research grant,
  leads to the Institute's payroll and clears her.
- **Corporate:** expense refunds routed through a prepaid card scheme to one account.
- **Slot:** what they want (marked).
- **Lesson:** pseudonymous is not anonymous. Mixers leak through fees, timing and change outputs, and
  following the money is often how a case is attributed.
- **Play moment:** a wrong link explaining why it is wrong, then the last link clicking.
- **Risk:** one `onTraced` grants every depositor at once, which can decide two or three suspects in one go.
  Include an innocent depositor in the trace, keep the trace to the want slot, or wait for E10 so each match
  grants its own sender.

### P8. Report it properly

- **Uses:** phone-chat (the handler or manager call with `#verdict:report`, both universes); concern-form (IS:
  facts as chips, the report names who); coverage-decision-form (one section per suspect, "Refer to HR" / "No
  further action"); mail-client forward to security (after E9).
- **Eldritch:** "Call HaX and name them." The report hub names any number of guests, then the warned close.
- **Corporate:** the player files a concern about a colleague by picking what, when, where and who; the form's
  feedback rewards facts over a conclusion, which is the debrief's ethos too.
- **Slot:** none; it is the verdict.
- **Lesson:** report through the right channel, with facts, proportionately. Naming a step ("Refer to HR")
  rather than labelling a colleague.
- **Play moment:** the form's feedback ("You said what you saw. Good.") before the case's own debrief.
- **Risks:** a form with one radio group "Who did it?" implies exactly one guilty (§3.1, DL10). Use one section
  per suspect, or the concern form's multi-pick. Coverage form reopens blank and re-runs its actions (E11), so
  its triggers need `once` (the default) and the first verdict stands anyway.

### P9. Pull the plug

- **Uses:** esd-pushbutton (`authVar` gate, confirm modal, `completionActions` with `verdict` kind `act`);
  network-segmentation-map (IS, dual approval from two NPCs' globals, a trigger on `severVar`).
- **Eldritch:** the sanctum's seal lever. It arms once HaX has agreed (`authVar` set from his call), and its
  confirm text names who is sealed in: "Seal the sanctum with Dr Okafor inside?"
- **Corporate:** isolate the insider's workstation segment, approved by IT security and the department head.
- **Slot:** none; it is the verdict.
- **Lesson:** containment is a decision with costs, it needs authority, and acting on an unverified hunch hits
  the wrong target.
- **Play moment:** lifting the guard cover.
- **Risks:** irreversible, so it must name one suspect and carry the stakes lists like any verdict. Do not set
  `authVar` from `deduction_decidable_<s>`: it would leak the nudge in a case with `nudge: false`. Author the
  `set_global` of `activatedVar` until E6 lands, or the button can be pressed twice.

### P10. Prep before you ask

- **Uses:** pretext-prep (blanks pick from held facts only), then person-chat or phone-chat; a witness's topics.
- **Eldritch:** to get the lodge steward talking about who held the archive key, the player must fill the card
  with a held fact ("I'm from the insurer; the Codex is on our list"). Without it the steward is `wary` from the
  first line.
- **Corporate:** calling the helpdesk as a contractor needs the contractor's ticket number, which the player
  found in the shredded forms.
- **Slot:** whatever the witness holds.
- **Lesson:** pretexting runs on facts the attacker already holds, so the defence is to verify before sharing
  and to notice when a caller knows just enough.
- **Play moment:** a blank lighting up only once the right fact is held.
- **Risk:** the pretext call has its own suspicion meter and the witness has influence costs; two meters on one
  conversation read as double jeopardy. Use one: a pretext call grants through `pretext_ask`, or a witness hub
  charges influence, never both on the same topic.

### P11. Case timeline

- **Uses:** command-board with `timeline` entries whose `condition` reads `se_intel_<f>`, and `statusRows` on
  `deduction_faded_<f>` and the stakes globals; or alarm-panel lamps for a small case.
- **Eldritch:** the guard's log on the night train: "20:40 Ward charm sold at the kiosk", "Stop 2: a coat
  pocket turned out" (fixture D, below).
- **Corporate:** the incident timeline the SOC lead keeps.
- **Slot:** none; it reorganises held clues by time.
- **Lesson:** building an incident timeline, and the gap between when something happened and when you learned
  it.
- **Play moment:** seeing two entries at 23:40 that the board shows on different cards.
- **Risks:** the board stamps discovery time; put event time in the text. Conditions must read only held facts
  and public globals, never `deduction_verdict_*` outcomes or truth, or the timeline gives the answer before the
  reveal.

### P12. Three tries

- **Uses:** a password-locked laptop holding a text-file; `password_failed:<id>` `where: { attemptsRemaining: 0 }`
  runs `deduction_tamper` (the cult's wipe); the second route is a witness who knows what the password means, or
  the post-it.
- **Eldritch:** the lodge secretary's laptop wipes after three bad guesses; the minutes file inside held a want
  clue, and the bar staff remember "she always uses the founding year".
- **Corporate:** the leaver's laptop has a lockout policy; guessing is a cost, asking IT is the route.
- **Slot:** any (the file's).
- **Lesson:** account lockout exists to stop guessing, and the right route to a locked device is the people
  who hold the credential, not brute force.
- **Play moment:** the hint landing just before the last try.
- **Risk:** must have the second route (DL7), and the file must sit in `contents`, not on the laptop's
  `triggerOnInteract`, or the lock is skipped.

## 4. Engine gaps

Deduplicated. "Patterns" names who needs it. Phase 10 stays about the deduction layer: wire through `triggers`
on events and globals that already exist, and edit a minigame only where a pattern cannot be wired otherwise.

| Id | Gap | Smallest change | Patterns | Recommendation |
|---|---|---|---|---|
| E1 | The deduction board through `#trigger_minigame` and `openMinigame` (DR-2) | `startIntelBoardMinigame` passes `mode` from `minigameData` (already read), `view` (`board` default, `debrief`) and `returnTo`; it reads `allowSubmit` only from a placed object, never from a tag or mapping. The runtime opens the debrief with `startRegisteredMinigame('case-file', { minigameData: { mode: 'deduction' } }, { view: 'debrief' })`. Lint: `allowSubmit` in a `#trigger_minigame:case-file` tag or an `openMinigame` `minigameData` is an error; `mode=deduction` through either route in a scenario with no `social.deduction` is DL20 | P11, all | **IN Phase 10** (P10-W already owns the starter) |
| E2 | Authoring notes and two lints | Docs (P10-X2): key later prints on `fingerprint_collected` `identified: true`; every evidence item has an `id`; `text_file` reads re-emit (use `once`); backup consoles need `network_isolated: true`. Lints: a `triggerOnInteract` holding `grant_fact`/`grant_facts` on an object with `locked: true` warns ("the lock is skipped; put the evidence in `contents`"); add the missing `shredder` entry to `minigame-data-schemas.json` (DR-11) so a shredded-document's `stateWrites.onComplete` is checked | P3, P4, P5, P6, P12 | **IN Phase 10** (docs and validator only) |
| E3 | concern-form verdict hook | `recordCompletion` (exercise-station) writes, for a concern-form scene, `<prefix>picked_<chipId>` = true for each picked fact and conclusion chip, *before* `<prefix>done`. A trigger on `global_variable_changed:<prefix>done` with `condition: "globalVars.<prefix>picked_who_okoro"` runs `{ "type": "verdict", "kind": "report", "suspect": "ded_b_okoro" }`. About 8 lines; no change to the scene | P8 (IS) | **Phase 10b** |
| E4 | `card_cloned` has no `cardId`; `card_emulated` has no reader | Add `cardId: cardData.card_id` (and `cardOwner`) at `rfid-minigame.js:299-303`; add `targetId` (the door's `connectedRoom` or the object id) at the three `card_emulated` emits | P3 | **Phase 10b** (C keys on `cardName` and `room` meanwhile) |
| E5 | `door_unlocked` / `item_unlocked` do not say how | Pass `method` through `unlockTarget` into both payloads (`unlock-system.js`, about 4 lines) | stakes on a picked lock | **Phase 10b** |
| E6 | esd-pushbutton never writes its `activatedVar` | One `writeGlobal(activatedVar, true)` in `applyEsdOutcome` | P9 | **Phase 10b** (author the `set_global` meanwhile) |
| E7 | Per-record writes: log-filter, forensic | log-filter: a `threatIntel` / `accountHistory` record may carry `onOpen: { key, value }`, written when that record is looked up, anomaly or not (beside `:816`, `:827`). forensic-data-platform: `tab.onView` global in `_onTabClick`, and `showIf` read through `utils/global-condition.js` so `"!globalVars.deduction_faded_x"` hides a block. About 15 lines | P3, P5, P11 | **Phase 10b** |
| E8 | Log-filter columns fixed to IT logs | `columns[]` and `filters[]` overrides for `LOG_FIELDS` / `FILTER_CATEGORIES`, so a door, visitor or ledger log reads right | P3 in EH-C | **Phase 10b**, after E7 (the plan's "badge log type" backlog item) |
| E9 | mail-client report to an authority records nothing (non-targets are never judged) | A scenario-level report address: a send to it emits `mail_reported` `{ to, subject, names[] }` and a global per named suspect, for a trigger to run `verdict` `report` | P8 | **BACKLOG** (phone and concern form cover reporting) |
| E10 | blockchain mixer-match grants every depositor at once | `stateWrites.onMatched: { <depositId>: <global> }`, written in `tryLink` after a correct link (`mixer-match-board.js:141`) | P7 | **Phase 10b** |
| E11 | coverage-decision-form reopens blank and re-runs its actions; header names Meridian | Restore `_submitted` and the radios from a `submittedVar` global; `headerOrg` key | P8 (IS) | **Phase 10b** |
| E12 | siem / nsm / scada write without `writeGlobal` (ink does not see them live; scada sends no `name`) | Each private `_setGlobalAndNotify` calls `writeGlobal` (`systems/global-writer.js`), as mixer-match does | P9 (nsm) | nsm: **Phase 10b**; siem, scada: **BACKLOG**. Triggers work on their events today |
| E13 | Minigame action executors do not delegate to `applyActions` (log-filter, scada, forensic, drug library, coverage form) | Replace each `_executeActions` body with `applyActions(actions, { source })`, keeping `key` as an alias | convenience only | **BACKLOG** (triggers do the same job) |
| E14 | dual-auth unregistered | Register the scene, add a `dual_auth` lock case, make the five globals keys | none | **BACKLOG** |
| E15 | bluetooth emits nothing; BLE pairing state not persisted | `bluetooth_device_detected` in `addBluetoothDevice`; `bleDevices` in the sync sections | none | **BACKLOG** (ble-scanner's `onPairSetGlobal` works) |
| E16 | PIN lockout is cosmetic | `pin_locked_out` event at max attempts | none (password covers P12) | **BACKLOG** |
| E17 | inbox-triage has no per-message grant | Per-message `grantsOnCorrect: <fact>` written by the starter | P2 | **BACKLOG** (mail reader does it) |

**Phase 10 adds two items, both cheap:** E1 (which P10-W needs anyway) and E2 (docs plus two validator
checks). **Phase 10b** is one optional wave of small minigame packets after the core passes: E3, E4, E5, E6, E7,
E8, E10, E11, E12 (nsm). Each is under about 15 lines with its own unit test and a re-run of the scenarios that
already use that minigame (sis01/sis02 for nsm and log filter, m02 for backup recovery, m05/m07 for RFID).

**Decision on the launch routes (DR-2).** Yes, `#trigger_minigame:case-file mode=deduction` and `openMinigame`
may open the deduction board, for looking and marking: a handler saying "Let me see your board" is natural,
and the chat resumes when the board closes (`systems/ink-minigame-launch.js`). They may not carry the final
call: "Make the call" closes the case, and closing it from a board stacked on a paused conversation would run
the debrief and the close-time stakes under a chat that then reopens. So the final call lives only on a placed
`case-file` object (E1's lint), and the runtime's rule "the debrief opens once, only when no minigame is open"
covers the tag and mapping routes unchanged, because the board is a minigame either way.

## 5. Fixture impact

Every change below adds a route or swaps a source for one in the same room that grants the same facts in the
same batch. No fixture loses a route, a witness budget or a lint result.

| Fixture | Uses now | Change | What the simulator and checks must redo |
|---|---|---|---|
| **A** Open evening (EH) | lockpick, PIN door, dusting (with fallback), log filter, container (coats), notes, camera and desk objects, person/phone chat, board | **Add osint-browser** (P1): a lodge laptop in `a_hall` (`osint-workstation`, `siteIds` one forum site) whose post signed by Delacroix's bookseller handle grants `a_delacroix_wants_codex` as a *second* route (the intern stays the first). It is the only fixture place for the main Eldritch clue source | Re-run `deduction/sim/` with the extra route: the hall still decides no one alone (Delacroix's clearance needs his pass from the archive log); DL18 place for the new route; DL6 intern budget unchanged (it can only ease); a bridge step selects the field and checks the cell |
| **B** Night shift (IS) | PIN cabinet, PIN door, plain badge-log terminal, DHCP printout object, notes, `#give_item`, phone report | (1) **Swap the DHCP printout** for a `forensic_data_platform` "Network device list" (one `log-table` tab), its `reviewedVar` keyed by a trigger that runs the same `grant_facts` with the same `place`. (2) **Phase 10b, with E3:** add a concern-form station as a second report route beside Nair's call | (1) Same room, same four facts in one batch: the state space is unchanged; re-check DL18 place text and that the batch toast still fires once. (2) A new bridge job (`deduction-b-form`) naming Okoro on the form, checking the `report` verdict and that a later call to Nair does not record a second one |
| **C** Safe house | lockpick, PIN door and safe, RFID clone and emulate, log filter, person/phone chat | **Phase 10b, with E4:** key `t_c_badge` on `where: { cardId: "c_novak_badge", targetId: "c_garage", success: true }` instead of `cardName` and `room` | Logic unchanged; re-run the C bridge's badge step only |
| **D** Night train (EH, strict) | lockpick, dusting (with fallback), shredded document, backup recovery, notes, objects, chats | **Add command-board** (P11): the guard's log, with `statusRows` per stop and a "pocket turned out / label torn off / phone gone" row per `deduction_faded_*`, and timeline lines on held clues with event time in the text | Display only: no route changes, no sim re-run. Check the conditions read only `se_intel_*`, `deduction_faded_*` and `d_stop_*` (never verdicts or truth); one bridge step opens it after stop 2 |

**A first real Eldritch Hacker deduction mission** (open evening at the Tesseract Institute, both layers): the
board; person-chat witnesses with pretext-prep before the gatekeeper (P10); osint-browser on members' posts and
a forum handle as the marked clue (P1); phone-chat DMs in the `social` theme and the Institute's mail in the
mail client (P2); dusting with a biometric reader on the vestry door (P4); lockpicking, container and notes for
the carry slot; a midnight tamper with shredded-document recovery (P5); mixer-match on the tithes (P7); the
seal lever as the `act` verdict (P9). Leave out log-filter until E8 gives it a ledger look, and every SEC
minigame.

**A first real Incident Simulations deduction case** (an insider data leak, "Refer to HR" / "No further
action", no combat, `completion` scoring): ncsc-brief as the "what to look for" advisory; log-filter on VPN
sign-ins with per-record lookups (E7); mail-client highlights on a forwarded spreadsheet (P2); a claims
terminal as the HR file per person; forensic-data-platform for the DLP export; backup-recovery for the mailbox
the insider purged (P6); command-board as the incident timeline (P11); witnesses in person-chat; and the
concern form or a per-suspect coverage form as the report (P8, needs E3 or E11). Network isolation (P9) only
if the case escalates to containment.

## 6. Questions for the user

1. **Sector minigames in Eldritch Hacker.** Should the clinical, industrial and insurance minigames (EHR,
   infusion pump, SIS config, SCADA historian, drug library, warranty checklist, segmentation map) ever appear
   in Eldritch Hacker, say inside the Institute's labs? This catalogue assumes not: they stay in Incident
   Simulations sector cases.
2. **Door logs in a shipped Eldritch mission.** Fixtures A and C read a VPN log relabelled as a badge log. For
   a real mission, is that acceptable, or should E8 (configurable columns, a proper door or ledger log) be
   built before the first one ships?
3. **Can a device give a verdict?** P9 lets an object (the seal lever, the isolation map) record an `act`
   verdict with no conversation. Is that fine, or should every verdict pass through a person, with the device
   only carrying out what a call has decided?
4. **Concern form and conclusions.** In an Incident Simulations report (P8), if the player picks a
   conclusion chip ("they're stealing data") as well as the facts, should the debrief comment on it, or should
   the form's own feedback be the only place that lesson lands?
