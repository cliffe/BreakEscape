# m03 office life plan: review R5 (final plan round, delta)

Subject: `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` at 31d3ebfc9, read against the R4 findings and the rewrite diff from ab7e9a755. Paths below are under `public/break_escape/js/` unless they start with `scenarios/`, `scripts/` or `docs/`. No SecGen file, Vagrantfile or exploit field guide was opened.

**Counts: 0 blocking, 0 major, 7 minor.** All seven minors are fixed in the plan in this commit. The plan is ready for implementation once `build/ol-chatter` and `build/ol-hidden-hostiles` are on main.

## R4 findings: status

| R4 | Status | Evidence |
|---|---|---|
| M1 laptop over the shoulder | Resolved. Readable object, no PC type, gate is the text. `laptop1` is outside every preset's `types` (`data/office-presets.json:4`), the image loads (`core/game.js:1442`). `textVariants` resolve first match in order (`utils/conditional-text.js:82` to `:103`), and `resolvedText` is computed at `systems/interactions.js:1772`, after `onInteract` (`:962`), so a lock rolled at the click is already in the globals. Global names match the engine (`systems/workstation-state.js:291` to `:292`). Two gaps found in the new spec: m1, m2, m3 below. |
| M2 hidden hostiles | Resolved as a dependency. `build/ol-hidden-hostiles` (a58729e19) adds `isHiddenByMapping` (`_npcVisibility.get(id) === false`) and skips it in `anyHostilesAlive`, with a unit test for the `initiallyHidden` case. Regression scope too narrow: m7. |
| M3 chat-open rule | Resolved as acceptance check 1, which copies `office-room-tone.js:101` to `:106` exactly. |
| m1 presets | Resolved (plan section 3). |
| m2 Ffion "who else" | Resolved, no change to existing lines. |
| m3 seats | Resolved in the cast row; `club_chair_e1` is `facing: 'east', seat: [16, 26]` (`systems/seating.js:151`). The pair's frames are on `build/ol-pose-art` (`zainab_hussain.png`, `yusuf_demir.png` and their JSON change there); pose code is already on main (`build/ol-poses-code` has no diff to main). |
| m4 in-flight lines | Resolved as acceptance checks 3 and 4; `_holdExchange` is called at `systems/npc-needs.js:4354` and capped by `holdCap` (`:2967`, `:2991`). |
| m5 sync and re-hides | Partly. `onceOnly` and the hostility keys are in; the re-hides' own trigger records and one workstation global are not counted: m4. |
| m6 cast table | Resolved. |
| m7 `ex_client_sites` | Resolved ("Evenings only, these days, I hear.", 34). |
| m8 paths | Resolved; `playerHears` `:5403`, `speak` `:5427`, `minigames/framework/minigame-manager.js:6` all check. |

Cast: Zainab Hussain (Achernar, northern English, British Bangladeshi, hijab, field service engineer) and Yusuf Demir (Alnilam, British accent, British Turkish, information security lead) match `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:90` and `:120` and the sprite prompts; both lanyards carry a blank card (`assets/characters/*_nonpixelart_prompt.txt`), as the plan says. All sprite files are on main.

## Minor (all fixed in the plan)

**m1. The laptop files a note on every read.** Evidence: a `readDisplay: "gameDisplay"` object adds a note unless `addToNotes: false` (`systems/interactions.js:1927` to `:1933`); `addNote` dedupes by title and text and returns the existing note (`minigames/notes/notes-minigame.js:955` to `:971`), so the "Added to your notes" toast shows on every click, and each of the variants would be filed as its own note. Fix: `addToNotes: false` on `zainab_laptop`; live check 4 adds "no read adds a note"; field list updated.

**m2. A knocked-out or hostile Zainab leaves the wrong text.** Evidence: `onKnockedOut` calls `onLeft(npcId, { reason: 'ko' })` (`systems/workstation-state.js:562` to `:567`), so a KO makes her away and the habit may leave the screen open: the lore is readable beside her body. A hostile Zainab at her post is not "present" (`ownerPresent` needs `isAvailable`, `:676` to `:680`) but has no away record, so the base text "Zainab's working on it." shows while she chases the player. Fix: a second variant, `globalVars.wh_staff_upset`, "the lid is shut". `wh_staff_upset` is set on the first hit and on the Ffion witness route, so it covers both; live check 4 tests it.

**m3. The laptop's post cell needs `affordance.useFrom`.** Evidence: `approachCell` reads only `obj.affordance?.useFrom` (`systems/npc-needs.js:5293` to `:5300`), and `useFrom` is an affordance key in the schema (`scripts/scenario-schema.json:3961` to `:3967`). The rewrite dropped the PC preset, so the laptop had no affordance and Zainab's post would be the nearest walkable cell within three tiles of the table, not the sofa place. Fix: `affordance: { "useFrom": { dx, dy } }` with no `satisfies` and no capacity; the field list now says `affordance.useFrom` and `affordance.queue.cells`.

**m4. Sync count misses five keys.** Evidence: fired `onceOnly` handlers are saved per handler (`systems/npc-manager.js:1262` to `:1264`, `:1472`, `exportTriggeredEvents` `:2178`) in the keyed `triggeredEvents` section (`state-sync.js:43`, `:505`), so the four night re-hides add four records; `onInteract` sets `zainab_laptop_accessed` (`systems/workstation-state.js:636`). Fix: 25 bounded keys; still no growth.

**m5. A stage-1 question grep already answers, and a stage mismatch.** Evidence: the once check runs before the condition and the count rises only after it passes (`systems/npc-manager.js:1270` to `:1300`, count `:1469`), so a failed condition does not consume a `onceOnly`. Section 2 said first-frame mapping registration is "measured in stage 4" while stage 1 lists it. Fix: section 2 states the answer and says stage 1; stage 1 drops the item.

**m6. Dependency timing contradicts itself.** Evidence: the header and section 11 said the build starts after all three dependencies are on main, while stage 2 and stage 7 (and live check 1) start the build before `build/ol-pose-art`. Fix: header, section 11 and stage 1 now say the build waits for `build/ol-chatter` and `build/ol-hidden-hostiles`, and slice 7 waits for `build/ol-pose-art`.

**m7. The hidden-hostiles regression list names only m10.** Evidence: the change skips any hostile hidden by a mapping, in every mission; m02, m03, m04, m05, m06, m07, m09 and m10 each have both `"setVisible": false` mappings and `all_hostiles_ko` (grep of `scenarios/*/scenario.json.erb`). Fix: the plan's section 11 and stage 2 put the music events of all eight on the branch's regression list.

## Checked and true

The `textVariants` order now reads night, trouble, locked, away and open, then the attended base; each condition uses only `===`, `!` or a bare global, which the evaluator supports. With the screen locked both `_screen_locked` and `_owner_away` are true, so locked must come before away, and it does. A `onceOnly` re-hide that fails its condition by day stays armed. `npcHostility` and `triggeredEvents` are both keyed sections, so every new key is a per-key delta. The three dependency branches exist (`build/ol-chatter` 9bfb78894, `build/ol-hidden-hostiles` a58729e19, `build/ol-pose-art` f222a7fc1).

## Note for the orchestrator (not a plan finding)

`build/ol-chatter` at 9bfb78894 carries only the faint-chatter falloff; neither its code diff nor `docs/achitechture/CHATTER_FALLOFF.md` mentions muting chatter while a person-chat or phone-chat is open. The m03 plan gates its build on that branch's acceptance checks 1 to 6, so whoever builds `build/ol-chatter` needs that scope handed to them.
