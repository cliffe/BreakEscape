# Minigame inventory for the deduction board: cyber and sector group

Read-only inventory of 19 minigames against `DEDUCTION_IMPLEMENTATION_PLAN.md` §3 (esp. §3.2's sources table, §3.6 tampering, §3.8 verdicts, §3.9 stakes). Written from the code; nothing was run.

Path shorthand: `mg/` = `public/break_escape/js/minigames/`; `IX` = `public/break_escape/js/systems/interactions.js`; `ST` = `public/break_escape/js/systems/minigame-starters.js`. Citations are `file:line`.

Scope notes: `vm-launcher` and `flag-station` are VM-backed and out of scope for browser-only Eldritch Hacker (sections kept short). No SecGen or VM exploit material was opened.

---

## 0. Cross-cutting findings (read these first)

**C1. Every minigame writes a global and emits `global_variable_changed:<name>`; none has a fact, verdict or tamper action.** That is enough for the plan's route: a scenario `triggers` entry on `global_variable_changed:<g>` (plan §3.2, §5.2) grants the clue. No minigame needs editing for a boolean clue. What the minigames cannot do is say *which* thing the player found; they write one yes/no per milestone (C3).

**C2. The `npcManager.setGlobalVariable` branch in every minigame is dead code.** Each minigame starts its write with `if (window.npcManager?.setGlobalVariable) {…return}` (e.g. `mg/log-filter/log-filter-minigame.js:1368`, `mg/backup-recovery/backup-recovery-minigame.js:439`). A grep of all JS outside `mg/` finds no definition of `setGlobalVariable`, so the fallback always runs: write `gameState.globalVariables[name]`, then (in most) `npcConversationStateManager.broadcastGlobalVariableChange(name, value, null)`, then emit `global_variable_changed:<name>` with `{ name, value, oldValue }`. Differences that matter for deduction:

| Writer | Reaches ink stories? | Event payload |
|---|---|---|
| log-filter, forensic, network-architecture, coverage form, drug library, infusion pump, sis-config, backup-recovery, ehr, claims, warranty, blockchain explorer | yes (broadcast) | `{name,value,oldValue}` |
| claims (`mg/claims-management-system/…:45-70`), warranty (`mg/warranty-checklist/…:43-58`), blockchain explorer (`mg/blockchain-explorer/…:19-34`) | yes, but **skipped entirely if the value is unchanged** (no re-emit) | as above |
| siem (`mg/siem/…:893-921`), network-segmentation-map (`mg/network-segmentation-map/…:261-270`) | **no broadcast** to ink; nsm hard-codes `oldValue:false` | as above |
| scada-historian (`mg/scada-historian/…:791-805`) | **no broadcast** (calls `gameState.broadcastGlobalVariableChange`, which does not exist: only `npcConversationStateManager` has it); payload is `{ value }` only, no `name` | `{value}` |
| ransomware-display (`mg/ransomware-display/…:104`) | writes `ransomware_deadline_at` straight into `gameState`, **no event at all** | none |
| mixer-match board (`mg/blockchain-explorer/mixer-match-board.js:17,76,164`) | yes: uses `writeGlobal` (`systems/global-writer.js`), the plan's shared writer | via `writeGlobal` |

Consequence: a trigger on `global_variable_changed:<g>` works for all but ransomware-display. An *ink* choice that reads a global set by siem, nsm or scada will not see it live. Smallest fix, one helper: make each minigame's private `_setGlobalAndNotify` call `writeGlobal(name, value)` from `systems/global-writer.js` (the mixer-match board already does). Same fix removes the dead branch.

**C3. Granularity is one boolean per milestone.** Most write a fixed-name global once ("reviewed", "flagged", "complete"). A clue that depends on *which row/tab/wallet/option* needs either a per-item write (small fix named per minigame below), or a value-carrying global (coverage form `fromSection`, backup-recovery `backup_recovery_source`) plus a trigger `condition` (`globalVars.x === 'id'`, `utils/global-condition.js`). `where` matches event payload keys (plan §5.2), so `where:{value:true}` works but `where:{name:…}` fails for scada (no `name`).

**C4. Own action executors are tiny.** None delegates to `systems/apply-actions.js` (flag-station does, `mg/flag-station/flag-station-minigame.js:7`, but is VM-backed).

| Minigame | What its own executor supports |
|---|---|
| log-filter | `set_global` `{key,value}`, `complete_task` `{taskId}` (`mg/log-filter/…:1344-1353`); `progressActions` triggers: `set_global` only (1355-1364) |
| scada-historian | `set_global`, `complete_task` (`mg/scada-historian/…:781-789`) |
| forensic-data-platform | `set_global`, `complete_task` (`mg/forensic-data-platform/…:261-274`) |
| drug-library-integrity | `set_global` only (`mg/drug-library-integrity/…:879-888`; "complete_task is handled via eventMapping") |
| coverage-decision-form | `{setVariable,value}` or `{setVariable,fromSection[,equalsValue]}` (`mg/coverage-decision-form/…:200-209`) |
| others | fixed hard-coded globals, no action list |

Optional single fix for all four action-list minigames: replace each `_executeActions` body with `applyActions(actions, {source:'minigame:<name>'})` from `systems/apply-actions.js`, keeping the old `key` field as an alias for `set_global`. Then `grant_fact`, `grant_facts`, `deduction_tamper`, `verdict`, `hint`, `emit_event` work in `completionActions`/`progressActions`. Not required (triggers cover it) but it removes the indirection and lets a minigame grant the clue and toast in one place.

**C5. Generic completion event.** `MinigameScene.complete()` emits `minigame_completed` / `minigame_failed` with `{ minigameName: <class name>, success, result: gameResult }` (`mg/framework/base-minigame.js:96-105`). A trigger can `where:{minigameName:'LogFilterMinigame', success:true}`, but it cannot tell two instances of the same minigame apart. Prefer the minigame's own global.

**C6. Persistence.** Only `gameState.globalVariables` (and `commandBoardLog`) are in the sync payload (`public/break_escape/js/state-sync.js:502-505`). Extra `gameState.*` fields used here (`cmsViewedSections`, `cmsPrintQueue`, `warrantyChecklist`) are in-memory only; the minigames that use them re-derive from globals on open.

**C7. Corporate copy is hard-coded in several.** Listed per minigame. These matter for the Eldritch Hacker skin.

**Note on fit.** Eldritch Hacker is browser-only pulp cosmic horror, cult investigation. Incident Simulations are corporate. "Skin fit" below says which of the two a minigame suits and what needs changing.

---

## 1. backup-recovery

**Dispatch/config.** Object `type: "backup_recovery"` (`IX:1268-1277`) → `startBackupRecoveryMinigame(lockable,…)` (`ST:753-786`). From `minigameData`: `backupRecoverySources` | `backup_recovery_sources` | `recoverySources` (`mg/backup-recovery/…:138-148`), `keySlots` (`:178-185`). Source fields: `id,name,status,etaLabel,compromised,etaHours,marker,statusTone,bannerTone,bannerText,icon,bullets[]`, `needs[]` (key-slot ids), `requiresGlobal`+`requiresGlobalLabel`, `whenAvailable{}` (fields that replace the card once requirements are met, `:236-247`), `outcomeTone/outcomeHeader/outcomeStatus/outcomeBullets` (`:384-398`). Key slot: `{id,label,item?,global?,blockedText?}`; loaded when the player carries an item whose `scenarioData.id` matches, or the global is true (`:189-200`). **No** `completionActions`, `progressActions` or `stateWrites`.

**Player does.** Reads three source cards (default: encrypted NAS, wiped tape, vendor cloud), picks one, confirms; a locked source shows why (`getUnmetRequirement` `:209-229`). One choice per game.

**Writes/emits.** In strict order (`commitSelection` `:328-352`, comment at `:334`): `backup_recovery_source` = source id, `recovery_eta_hours`, `backup_restore_initiated` = true. Then `backup_reinfected` = true at once if `compromised`, else after 30 s if `network_isolated` was not true when the restore started (`:340-345`, `:417-427`). Outcome screen 2.5 s, then `complete(true)` (`:~411`). Result `{selectedSource, backupRestoreInitiated, recoveryEtaHours}`.

**Persists.** Chosen source id read back from `backup_recovery_source` at open (`:104-108`); the choice then locks ("Decision Locked In", `:266-278`). That is one restore per game, shared by every backup console, because the names are fixed.

**Deduction uses.**
- *Evidence recovery after tampering* (best fit). Tamper fades `ledger_entry_7`. A console offers "Parish safe copy" (`needs:["brass_key"]`, a key slot backed by the physical item, so the route needs the item) and "Cloud sync" (`compromised:true`). A trigger on `global_variable_changed:backup_restore_initiated` with condition `globalVars.backup_recovery_source === 'safe_copy' && !globalVars.backup_reinfected` grants the fact. The write order at `:334` guarantees the source is set when `backup_restore_initiated` fires. This is the plan's "recovery minigame" second route (DL7).
- *Stake / tamper target.* Picking the compromised source sets `backup_reinfected`; a second trigger on it runs `deduction_tamper` on another fact, or a `set_global` a route gate reads. A wrong, irreversible choice is a real cost.
- No fit as a clue source or verdict channel.

**Skin.** Text is almost all scenario-supplied (cards, bullets, outcomes), so a cult reads fine: "the archivist's offsite copy" vs "the lodge's own ledger". Fixed: `network_isolated` logic (`:329`) and default sources (EHR/NAS wording).

**Gap / smallest fix.** (1) Fixed global names: add `minigameData.stateWrites` `{source, eta, initiated, reinfected}` with the current names as defaults, and key the lock on object id. (2) The delayed reinfection fires for any non-compromised source unless `network_isolated` is true: add `source.reinfects:false` (skip `:341-343`), or set `network_isolated:true` as a scenario global. Without one of these a good restore in a cult scenario triggers `backup_reinfected` after 30 s.

---

## 2. blockchain-explorer (two modes)

**Dispatch/config.** `interactionType: "blockchain_explorer"` (note `interactionType`, not `type`, `IX:1146-1154`) → `ST:868-899`, which passes `title, caseRef, currency, seedTransaction, mixerFanOutThreshold (default 4), targetWalletAddress, stateWrites, lockable`. The constructor then reads `lockable.scenarioData.minigameData` (`mg/blockchain-explorer/blockchain-explorer-minigame.js:52-70`).
- *Explorer mode* keys: `wallets[{address,displayName,balance,threatIntelMatch}]`, `transactions[{hash,inputs[{wallet,amount}],outputs[{wallet,amount}]}]`, `stateWrites.onMixerFlagged`, `stateWrites.onDestinationFlagged`.
- *Mixer-match mode*: `mode:"mixer_match"` (`:61`), keys `mixer{name,feePercent,minHoldHours,maxHoldHours?}`, `deposits[{id,wallet,label,amount,time,required?,change?}]`, `withdrawals[{id,slot,amount,time}]`, `title, caseRef, currency, slotLabel, completionText, filesLabel`, `stateWrites.onOpen[]`, `stateWrites.onTraced` (`mg/blockchain-explorer/mixer-match-board.js:1-24,50-62`). Rules in `mixer-match-model.js` (fee, hold window, change output, address reuse).

**Player does.** Explorer: click through transactions and wallets in a graph; a wallet that sent to ≥ threshold recipients shows a "mixing service" callout (`:555-583`); flag the mixer and, after hopping beyond the seed's outputs, the target wallet (button only appears on the real target, `:593-603`). Mixer-match: link each deposit to the withdrawal it became (wrong links cost nothing and say why), then name the slot all matches landed in.

**Writes/emits.** Explorer: `onMixerFlagged`, `onDestinationFlagged` set true (`:179-196`); when all required flags are set it calls `showSuccess(…,true,3000)` → `complete(true)` (`:199-211`). Mixer-match: `onOpen` globals on open (`board:76`), `onTraced` when the slot is named (`board:164`); close is a normal `complete(true)` with `{mode,traced}`. No action lists.

**Persists.** Explorer re-reads both flags from globals on open (`:102-107`). Mixer-match shows the finished board if `onTraced` is set (`board:77-83`); unsolved matches are in memory only.

**Deduction uses.**
- *Clue source, "what they want / who pays whom"* (best fit in the group, because the answer is derived, not clicked). Example: the Cabal's tithes pass through an "offering pool". The player matches three named deposits (Venn, Okafor, Reyes) to payouts by amount-less-fee and hold time, then names the slot they all landed in. `onTraced` → trigger grants `grant_facts` `["venn_pays_lodge_purse","okafor_pays_lodge_purse"]` (marked clues). Cell counts stay public because the facts are fixed.
- *Evidence recovery after tampering.* If a destroyed clue is "Venn paid the Lodge", the chain trace is a second route that re-derives it without the erased note.
- *Verdict/stakes:* no fit.

**Skin.** Mixer-match is fully configurable (title, `slotLabel`, `mixer.name`, `completionText`, currency "USD"/"GBP"/other) and works for corporate fraud or cult tithes. Explorer mode has hard-coded wallet/chain copy ("Chain Tracer" default, "Flag as Mixing Service", "Threat Intel Match", `:579-611`).

**Gap / smallest fix.** One boolean per trace. For per-suspect clues add `stateWrites.onMatched: {<depositId>: <global>}` and write it in `tryLink` after `this.matches[d.id] = w` (`board:141`); each deposit then grants its own sender's clue. Explorer: add `wallet.onView` global written in `_navigate` when `type==='wallet'` (`:150-160`). Both are 3-5 lines.

---

## 3. claims-management-system

**Dispatch/config.** `id:"claims_management_system"` or `type:"cms_terminal"` (`IX:1124-1133`) → `ST:809-835`. `minigameData`: `title`, `sections` (array, or object keyed by id) with `{id,label,heading,status,relevance,relevanceHighlights[],summary[],content[]}` (`mg/claims-management-system/…:66-111`), `stateWrites` `{<sectionId>: <globalName>}` (`:113-128`), `printEnabled`.

**Player does.** Tabbed read-only document viewer; each opened tab is marked VIEWED; a Print Excerpt button.

**Writes/emits.** On first view of a section its mapped global = true (`:232-248`); when every section has been viewed `cms_reviewed` = true (hard-coded name, `:174-188`). Print pushes `{id,title,printedAt}` onto `gameState.cmsPrintQueue` (`:262-277`), which nothing reads. No action list; never calls `complete(true)` (cancel only).

**Persists.** `gameState.cmsViewedSections` (in memory, not synced, C6), rebuilt on open from `stateWrites` globals (`:213-230`); the globals are the real record.

**Deduction uses.**
- *Clue source*, "a record showing what they carry / where they were". A personnel-file terminal with sections "Rota", "Expense claims", "Locker inventory", each with its own global. Trigger on `global_variable_changed:cms_locker_viewed` grants `venn_carries_brass_key`. Viewing the tab is the grant; there is no reading check.
- *Tamper target.* Weak: sections cannot be hidden or altered by a global, so a destroyed record cannot visibly vanish. Authored gating only (the trigger condition `!globalVars.deduction_faded_<fact>`).
- No verdict fit.

**Skin.** Free-text sections make it easy to reskin as a cult dossier or ledger ("Membership roll"); only the fallback title is corporate (`:4`, overridable via `title`).

**Gap / smallest fix.** Section-level `showIf` / `hideIf` (a global name or `utils/global-condition.js` string) in `renderNav` and the panel; copy the `showIf` idea from forensic-data-platform. That gives visible redaction after a tamper and a recovered page that reappears. ~8 lines.

---

## 4. command-board

**Dispatch/config.** `type:"command_board"` (`IX:1114-1122`) → `ST:787-808`. Config is the object's `commandBoard` key; the server lifts it to the scenario (`app/models/break_escape/game.rb:1872-1880`), `core/game.js:1665-1676` builds a `CommandBoardRecorder` from game start. Keys: `title, subtitle, preseed[{timestamp,text,type}], timeline[{id,condition,text,type,watch?,decidedOnChange?}], extendBuiltIn, statusRows[{label,states[{condition,state,label}],default}]` (`mg/command-board/command-board-timeline.js:3-27`). Conditions are `globalVars.x` expressions (`utils/global-condition.js:1-10`). Without a config it shows the built-in sis01 entries (`BUILTIN_TIMELINE`).

**Player does.** Reads a live timeline and status panel; may post their own manual note (`handleManualPost` `mg/command-board/command-board-minigame.js:~243`). Nothing is solved.

**Writes/emits.** Writes nothing to gameplay state apart from its own board state. Subscribes to `global_variable_changed:*` and re-evaluates (`:143-152`). Closing always ends as `aborted` (`:96-109`).

**Persists.** Recorder stamps `{id, t}` per entry in game-clock time even while the board is closed; saved as `commandBoardLog` (`state-sync.js:172-173`). Manual notes in `globalVariables.mg12_command_board_state` (`:15,441-460`).

**Deduction uses.**
- *Clue source by display, and the best "timeline of the night" view.* Conditions can read `se_intel_<id>` globals (the plan's fact globals, §3.4), so each clue the player has granted appears as a time-stamped line ("23:40 — Venn seen at the chapel door") in *game time of discovery*, not event time. Stamping is when the clue is granted. To show *event* time, put the time in the text.
- *Tamper display.* A `deduction_faded_<fact>` global can drive a `statusRows` state ("Evidence destroyed") or a timeline line; this is a ready-made "what the opposition did" log.
- *Stakes display.* Wrong-accusation consequences (a closed route) show as status rows.
- Not a clue source on its own, not a verdict channel.

**Skin.** Fully config-driven (title/subtitle/timeline/statusRows); suits a cult war-room ("Lodge watch log"). Fixed: dot header and 5-second clock (`:67-72`), built-in sis01 entries unless `timeline` is set without `extendBuiltIn`.

**Gap / smallest fix.** None blocking. Optional: accept a `timeline[].at` game-clock time so an entry can show event time rather than discovery time (adds one field to `computeStatusRows`' sibling in `buildEntries`).

---

## 5. coverage-decision-form

**Dispatch/config.** `type:"coverage_decision_form"` (`IX:1303-1311`) → `ST:1060-1075`. `minigameData` (`mg/coverage-decision-form/…:6-24,44-52`): `headerRef, claimsManager, openVar, sections[{id,title,description,options[{value,label,sublabel}]}], completionActions[], formTitle, outcomeSpeaker, outcomeQuoteSection, outcomeQuotes{<value>: text}`. Completion action shapes: `{setVariable,value}`, `{setVariable,fromSection}`, `{setVariable,fromSection,equalsValue}`.

**Player does.** Fills a radio-button form (one choice per section), submits once enabled (`:150-160`).

**Writes/emits.** `openVar` = true on open (`:62-67`). On submit, the `completionActions` run (`:200-210`): fixed values, the chosen option's `value` string, or a boolean `selected === equalsValue`. Shows the NPC quote for the choice. No `complete(true)`; stays open as "submitted".

**Persists.** The globals only. Selected radios and `_submitted` are not restored: reopening shows an unsubmitted form and a second submit re-runs the actions (no guard on reopen).

**Deduction uses.**
- *Verdict channel (best fit in the group for a structured "name your suspect" form).* Section "Who did it?" with one option per suspect; action `{setVariable:"accused_venn", fromSection:"culprit", equalsValue:"venn"}` for each suspect. A trigger on `global_variable_changed:accused_venn` with `where:{value:true}` runs `{type:"verdict",suspect:"venn",kind:"report"}`. A second section ("Evidence relied on", options as clues) writes its value so the debrief could quote it (needs C4 fix to feed `reason`).
- *Report channel* maps to `report` (names to a manager). Because submit is single-shot but not reload-safe, guard with `once` triggers (default true, plan §5.2).
- *Stakes:* the outcome quote is a cheap reaction line; the real stake still comes from the verdict outcome lists.

**Skin.** Almost all scenario text; only the header sub-line is hard-coded "Meridian Cyber Insurance" (`:76-80`) and the button/status text "RECOMMENDATION SUBMITTED". Corporate Incident Simulations: good fit ("Refer to HR / No further action", plan §3.11). Cult: needs the header made configurable.

**Gap / smallest fix.** (1) Add `completionActions` type `verdict`/`grant_fact` via the C4 `applyActions` delegation, so the form can issue a verdict without a trigger. (2) Restore `_submitted` and radios from a `submittedVar` global on open. (3) Make the header company string a `headerOrg` key. All under 10 lines.

---

## 6. drug-library-integrity

**Dispatch/config.** `type:"drug_library_terminal"` (`IX:1257-1266`) → `startDrugLibraryIntegrityMinigame(sprite)` (`ST:1044`). `minigameData` (`mg/drug-library-integrity/…:52-63`): `drugLibrary[{name,concMgPerMl,doseMin,doseMax,unit,rateMaxMlHr}]`, `tamperedEntry{drug,field,tamperedValue,correctValue,modifiedAt,backupDate,changes[]}`, `verificationSources[{id,label,onConsulted,…}]`, `fleetReport{affectedPumps[…]}`, `libraryFile, backupFile`, `onCompromisedDetected[]`, `progressActions{onTimestampViewed, <onConsulted key>…}`, `completionActions[]`. Executor supports `set_global` only (`:879-888`).

**Player does.** Runs an integrity scan (hash compare), reads a diff of the live file against the backup, consults two independent sources before the restore unlocks, restores from backup, then reads a fleet report.

**Writes/emits.** Defaults: scan fail → `drug_library_compromised` (`:430`); diff viewed → `library_tamper_timestamp_noted` (`:461-465`); each source → `mar_charts_drug_referenced` / `manufacturer_datasheet_referenced` (`:700-707`); restore → `drug_library_verified`, `drug_library_restored` (`:729-732`). All overridable through the action lists.

**Persists.** Phase restored from those globals on open (`:88-112`).

**Deduction uses.**
- *Evidence recovery after tampering* (the model template). Detect (hash fails) → diff shows what changed, when (`modifiedAt`) and the correct value from the backup → two independent corroborating sources → restore. Cult example: the Lodge's membership roll was altered; the "diff" shows the row that changed against the archivist's carbon copy; two sources (a photographed page, a witness's memory) must agree; restore grants `grant_fact` for the clue the edit had hidden.
- *Clue source:* the diff itself says who/when if `modifiedAt` and a source label carry a name ("modified by account `v.hale`"). Row-level `modifiedBy` is not a field (it is in sis-config rows, §14); here only `modifiedAt` is.
- *Tamper target:* the "tampered" state is set by a scenario global the opposition's beat sets; no verdict fit.

**Skin.** Medical drug table, units and fleet report are fixed in structure (23-row default library `:5-30`), so a cult skin would be a "roll" with doses as numeric fields. Reasonable for Incident Simulations (clinical), awkward for cult.

**Gap / smallest fix.** A generic "record table + diff" version: allow `columns` and rename the label strings; currently the table assumes dose fields. Medium work; not needed if the cult case uses forensic-data-platform for a read-only record and backup-recovery for the restore.

---

## 7. ehr-terminal

**Dispatch/config.** Object `id:"ehr_terminal"` (`IX:1075-1086`) → `startEhrTerminalMinigame` (`ST:701`). `minigameData`: `patients[{id,name,dob,ward,bed,consultant,allergies[{allergen,severity}],medications[{drug,dose,frequency,route,interactionWarning}],prescriptions[{drug,currentDose,safeMin,safeMax,unit}]}]`, `customMessage` (offline text), `name`. Status from `globalVariables.ehr_status` ("online"/"offline"), else `network_isolated` true → offline (`mg/ehr-terminal/…:88-100`).

**Player does.** Offline: reads a "system unavailable" notice. Online: clicks patients, sees allergies, medications and a dose bar.

**Writes/emits.** `ehr_terminal_viewed_offline` on open when offline (`:137`); `ehr_terminal_viewed_online` on **any** patient click (`:151,158`), not per patient. No action list; closes via `complete(false)`.

**Persists.** Nothing of its own.

**Deduction uses.**
- *Clue source, "a record showing what they carry"* in a corporate or clinical case: records list allergies and medications per person. Example: a pharmacy theft where the record of who holds a controlled drug is a clue.
- *Gated clue source:* online/offline state gives a free "systems are down, so the clue is not here" gate that a recovery step flips (`ehr_status` set by a restore).
- No verdict fit.

**Skin.** Corporate/clinical only: the header is hard-coded "NORTHGATE TRUST EHR - PRESCRIBING MODULE" (`:256`); the data is medical. The record layout would suit a cult "membership file" only with the header configurable and the dose block hidden.

**Gap / smallest fix.** Per-record write: `patients[].onView` global written in the click handler (`:148-158`), so each record grants its own clue. Add `minigameData.headerTitle`. ~5 lines.

---

## 8. flag-station (VM-backed, out of scope)

CTF flag submission (`mg/flag-station/flag-station-minigame.js:1-8`), validated server-side by `POST /break_escape/games/:id/flags` (`:738`); needs VM flags. Rewards run through the shared `applyActions` (`:7`), emit `flag_submitted` / `flag_tasks_updated` (`:780-796`). Not usable in browser-only Eldritch Hacker. Note for later: if a corporate Incident Simulation ever wants an "enter the code" station without VMs, the reward-list shape already supports `grant_fact` once that action exists.

---

## 9. forensic-data-platform

**Dispatch/config.** `type:"forensic_data_platform"` (`IX:1290-1301`) passes `minigameData` straight to `startForensicDataPlatformMinigame` (`mg/forensic-data-platform/…:~310-324`), so every key is a top-level `minigameData` key: `tabs[{id,label,heading,blocks[]}]` (or built-in `tabSet`, empty today `:34`), `title, caseRef, reviewedVar, confirmedVar, confirmGateTab, confirmLabel, confirmHint, confirmReadyHint, confirmSuccessText, completionActions[]`. Block types: `p, timeline, log-table, setpoint-table, document-excerpt, list, callout` (`:22,86-100`); any block may carry `showIf:"<globalName>"` (`:86`). Log-table rows: `{cells[…], highlight}`.

**Player does.** Reads tabs of evidence; the confirm button unlocks once the gate tab (default: the last) was seen; confirming "confirms the causal chain".

**Writes/emits.** `reviewedVar` (default `fdp_reviewed`) on first open (`:150-154`); `confirmedVar` (default `forensic_chain_verified`) on confirm (`:258`), then `completionActions` (`set_global`, `complete_task`, `:261-274`). Confirm does not close the window.

**Persists.** Confirmed state from `confirmedVar` (`:166-170`).

**Deduction uses.**
- *Clue source (best general-purpose)*. A log-table with a highlighted row is a flexible "evidence document". Cult example: tab "Door log" (`log-table`: time / badge / door) puts Venn at the chapel at 23:40; tab "Offering book" (`document-excerpt`); the clue is granted when the tab is read? No: only first-open and confirm write. Use `reviewedVar` for a single clue, and `confirmedVar` for a second ("chain confirmed").
- *Evidence recovery after tampering.* Blocks with `showIf:"se_intel_<fact>"` appear once a fact is held, so a tab can start as an "evidence gap" callout (`style:"evidence-gap"`) and show the log table after a recovery grant. This is the cleanest redaction/recovery display in the group.
- *Tamper display:* `showIf` is truthy-only, so it cannot show "destroyed" text from `deduction_faded_<fact>` being true.
- *Verdict channel (weak):* the confirm button as "I'm sure". Could be `act`.

**Skin.** Block text is all scenario data; fully reskinnable (cult "Lodge records", corporate "case notes"). Callout styles are forensic-flavoured CSS only.

**Gap / smallest fix.** (1) Per-tab write: `tab.onView` global (as log-filter has, `mg/log-filter/…:1185`), so each tab is a clue; add in `_onTabClick` (`:~210`). (2) Negated `showIf` (`"!deduction_faded_x"`) via `utils/global-condition.js` instead of a bare name, to hide a block when a fact is destroyed and show a gap callout. ~6 lines.

---

## 10. infusion-pump

**Dispatch/config.** `type:"infusion_pump"` (`IX:1062-1073`) → `startInfusionPumpMinigame` (`ST:950-972`). `minigameData` (`mg/infusion-pump/…:38-51`): `drug_name, correct_dose, rate_display, library_min, library_max, restored_min, restored_max, library_ok_global, programmed_at_global, patient, ward_bed, consultant, allergies, prescriber, duration, conflict_title, conflict_prompt, hold_label, reenter_label, pharmacy_hold_text, pharmacy_mismatch_text`. Hard guard: needs global `paper_charts_collected` or shows "PAPER MAR CHARTS REQUIRED" and exits after 3 s (`:72-82`). Phaser canvas.

**Player does.** Reads a prescription, keys a rate on a keypad, hits a library limit warning or goes through; double-check modals; optional "hold and query pharmacy".

**Writes/emits.** `pump_dose_correct` or `pump_dose_error` (`:522,538,717`), `drug_library_override` (`:627`), optional `programmed_at_global` with the in-game clock text (`:513-515`). No action list.

**Persists.** Nothing of its own.

**Deduction uses.**
- *Verdict channel `act` (weak):* "use the knowledge" by setting the right value, e.g. dose = the dose the profile implies. Contrived.
- *Stakes/tamper target:* a wrong entry sets `pump_dose_error`, an easy hook for a harder-fight or loss stake. Medical only.
- Clue source: `programmed_at_global` stamps *when* something was done; no.

**Skin.** Medical only (Press Start 2P keypad pump); no cult reskin. Sector missions only.

**Gap.** None to chase; low value for deduction. If wanted, add `completionActions` (C4).

---

## 11. log-filter

**Dispatch/config.** Object `type:"log_filter_terminal"`; optional `minigameData.minigameId` (default `log-filter`) (`IX:1241-1255`). The constructor takes `sprite.scenarioData.minigameData || sprite.scenarioData` (`mg/log-filter/…:168-170`). Keys (`:10-26,170-186`): `title, logType ("vpn"|"ics_rdp"), logEntries[], entryCount (synthetic vpn log), anomaly{account|user, ip|sourceIp, position, timestamp}, impossibleTravel{priorEntry}, threatIntel (object or array, matched by ip), accountHistory (object or array, matched by account), flagActionLabel, flagConfirmTitle, flagConfirmBody, flagRejectedBody, additionalTabs[], requireAllTabs, completionActions[], flagActions[], progressActions[], stateOverrides[], completeBanner, nextTabPrompt, nextTabButton, completedGlobal`. Columns and filter menus are fixed per `logType` (`LOG_FIELDS` `:37-56`, `FILTER_CATEGORIES` `:57-75`).

**Player does.** Filters the log (country, MFA, result, user, time bands), selects rows, looks up the row's IP (threat intel) or account (history), flags one row; "only the real anomaly row can be flagged successfully" (`:19-26,883-891`); other rows get a rejection overlay. Extra tabs (audit log etc.) can be required.

**Writes/emits.** `flagActions` on a correct flag (`:1158`); `completionActions` when flagged and all required tabs seen (`_onComplete` `:1326-1327`); `progressActions` with `trigger` `threat_intel_opened`, `account_history_opened`, `tab_viewed` (+`tabId`) = `set_global` only (`:819,828,1191,1355-1364`); tab `onView.setVariable{k:v}` (`:1183-1187`). Auto-closes 1.4 s later with `complete(true)` (`:1327-1330`). Executor: `set_global`, `complete_task` (C4).

**Persists.** Done state from the first `set_global true` in `completionActions` or `completedGlobal` (`:198-200,255-257`); visited tabs from their `tab_viewed` globals (`:263-267`); `stateOverrides` mutate rows from current globals (`:240-253`), a ready-made way to show a log that changed after a story event.

**Deduction uses.**
- *Clue source, "log rows placing a suspect somewhere"* (the plan's example). A door/badge log with a planted row: filter by user/time, find the row at 23:40, look up the badge (`accountHistory`) to learn its owner, flag it. `flagActions: set_global lf_chapel_row_found` → trigger grants `placed:venn_chapel`. The **gap** is that only one row is the anomaly and only that row's lookups fire progress (C3 below).
- *Multi-suspect placement:* use `threatIntel`/`accountHistory` as arrays (one record per suspect). The records display, but only the anomaly's lookup fires `progressActions` (`:819,828`).
- *Evidence recovery after tampering:* `stateOverrides` can swap a row's fields when `deduction_faded_*` is true, e.g. the wanted row's `account` becomes `[redacted]`; the recovery route is the other log tab (`additionalTabs` audit log, `tab.onView`).
- *Verdict channel (weak):* "flag session" is an accuse-the-row act, but the row is not a person.
- *Stakes/tamper target:* an `ics_rdp`/`vpn` log is the natural tamper subject.

**Skin.** Columns are IT-only (user, IP, country, MFA / session, account, source IP, access level). For a cult, a "vpn" log can be reused as a "letters or radio-net log" by relabelling data only; column names stay. Strong fit for corporate Incident Simulations.

**Gap / smallest fix.** (1) Per-record open writes: let each `threatIntel`/`accountHistory` record carry `onOpen:{key,value}` (or `setVariable`) and write it when that record is looked up, whether or not it is the anomaly (add beside `:816`/`:827`). Then each suspect's lookup is its own clue. (2) Optional `columns[]` and `filters[]` overrides for `LOG_FIELDS`/`FILTER_CATEGORIES` so a door or visitor log is possible. About 10-15 lines for (1), 20 for (2).

---

## 12. network-architecture

**Dispatch/config.** `type:"network_architecture"` (`IX:1337-1347`) → `startNetworkArchitectureMinigame(minigameData)` (`mg/network-architecture/…:~291-309`). Keys (`:6-27`): `title, reviewedVar, viewBox, zones[{id,label,y,h,fill,stroke,nodeClass,x,width}], nodes[{id,label,sublabel,warn,zone,x,y,w,h,paths[],desc,vuln}], lines[{from,to,type,paths[],label}], attackPaths[{id,label,desc,claim,nodes[]}], externalOrgs[{id,label,label2,x,y,w,h,nodes[]}]`.

**Player does.** Views an SVG diagram; clicking a node shows its description, vulnerability and the attack paths through it, highlighting them.

**Writes/emits.** One global: `reviewedVar` (default `network_architecture_reviewed`) true on first open (`:55-60`). No action list; cancel closes.

**Persists.** The global.

**Deduction uses.**
- *Clue source (relationships)*: a node-and-line diagram is a fit for "who reports to whom / who has access to what". Cult: nodes are members and places, line types `normal/boundary/legacy/hardwired` become "knows / pays / sponsors / watches", `attackPaths` become "chains of influence". The clue is the visible structure; grant on first open (`reviewedVar`).
- *Evidence recovery:* none; the data is static.
- *No verdict fit.*

**Skin.** Data is fully scenario-driven, but the legend and labels are hard-coded: "Intended path / IT/OT boundary / Legacy exception / Hardwired interlock / Attack path" (`:73-79`), "Click any system node…", "⚠ VULNERABILITY", "ATTACK PATHS THROUGH THIS NODE:" (`:237-250`). Needs those strings configurable to suit a cult.

**Gap / smallest fix.** (1) `legend[]`, `hint`, `vulnLabel`, `pathsLabel` keys (4 strings). (2) Per-node write `node.onView` global in `_attachNodeListeners`/`_renderDetail` so viewing a node is a clue (one `setGlobalAndNotify`).

---

## 13. network-segmentation-map

**Dispatch/config.** `type:"network-segmentation-map"` or `network_segmentation_map` (`IX:1196-1207`) → `startNetworkSegmentationMapMinigame(minigameData)` (`mg/network-segmentation-map/…:743-757`). Keys (`:6-27`): `title, severButtonLabel, severVar, rulesReviewedVar, auth{itsecVar,clinicalVar,resultVar,itsecLabel,clinicalLabel,claimRef}, zones[{slot,label,devices[]}]` (four fixed slots external/enterprise/clinical/legacy), `rules[{id,label,title,connectionType,fromSlot,toSlot,consequences[]}], defaultConsequences, severConsequences, modalConsequences, severLockedHint, severReadyHint`.

**Player does.** Toggles risk-path lines to see consequences; SEVER unlocks after the first rule is opened; a confirm modal shows whether two authorisations (read from globals) are held.

**Writes/emits.** First rule opened → `rulesReviewedVar` (default `network_rules_reviewed`) (`:299-312`); on confirm `auth.resultVar` if both `itsecVar` and `clinicalVar` are true (`:271-276`), then `severVar` (default `network_isolated`) (`:278`); `complete(true)` after 2 s (`:~295`). Hard-coded "ACTIVE INCIDENT" badge, "CONFIRM NETWORK ISOLATION", "LINK SEVERED". No ink broadcast, `oldValue:false` fixed (C2).

**Persists.** `severed` from `severVar` on open (`:46-49`).

**Deduction uses.**
- *Verdict channel `act` (best fit for "use the knowledge")*: a decisive, authorised, irreversible action. Corporate example: "isolate the compromised segment", only available after dual authorisation (two NPCs' globals, a real approval chain). A trigger on `network_isolated` runs `{type:"verdict",suspect:"x",kind:"act"}` and the stakes lists.
- *Stakes:* the severed link's consequences and `network_isolated` feed `ehr_status`/reinfection logic already.
- Clue source: no.

**Skin.** Four fixed topology slots and corporate wording; poor cult fit. Sector missions only.

**Gap.** Ink does not see its globals (C2); route through `writeGlobal` if an ink gate reads `network_isolated`.

---

## 14. ransomware-display

**Dispatch/config.** Object `lockType:"ransomware_display"` → `startRansomwareDisplayMinigame` (`ST:632-665`), which refuses to open unless `ransomware_deployed` is true ("Workstation is currently operational"). `minigameData`: `organisation, encryptedSystems, ransomAmount, ransomBitcoin, walletAddress, groupName, supportPortal, extraLines[], timerHours` (`mg/ransomware-display/…:100-126`). Lighting adds a red glow variant (`systems/lighting.js:84-87,527`).

**Player does.** Reads a ransom screen with a live countdown. Passive.

**Writes/emits.** Only `ransomware_deadline_at` (ms timestamp) into `gameState.globalVariables` (`:104`), no event. No completion; cancel closes.

**Persists.** The deadline global (re-read on reopen, `:91-96`).

**Deduction uses.**
- *Stakes display / timer pressure*: shows a deadline. A wallet address and `extraLines` can carry a clue ("note signed with the Cabal's sigil") readable on screen; but nothing is granted by reading it. Use a separate trigger on `ransomware_deployed`.
- Otherwise **no fit**: no input, no state change, no event on open.

**Skin.** Title "YOUR FILES HAVE BEEN ENCRYPTED" and the warning line are hard-coded (`:131-144`). Corporate Incident Simulations only. A cult variant would be a different screen.

**Gap.** If its text should carry a clue, add `onOpen` global (one line in `init`, then writes via `writeGlobal`).

---

## 15. scada-historian

**Dispatch/config.** `type:"scada_historian"`, optional `minigameData.minigameId` (default `scada-historian`) (`IX:1225-1239`); config from `sprite.scenarioData.minigameData` (`mg/scada-historian/…:51-69`). Keys: `title, subtitle, racks[{id,label,normalBase,noisePeriodMinutes,noiseAmplitude}], injectionTimestamp, injectedValue, lastRealTimestamp, thermalTrendStartTime, thermalTrendRate, historianStartTime, historianEndTime, sampleIntervalMinutes, defaultTimeRangeHours, hintText, completionActions[], progressActions[{trigger,type:"set_global",key,value}]` (`mg/scada-historian/scada-historian-data.js:19-60`).

**Player does.** Reads temperature trends for up to four racks; spots where the data goes flat (a falsified feed); hovers/clicks the flat point for ~3 s or uses the overlay / compare mode; ANNOTATE FINDING → confirm modal.

**Writes/emits.** `progressActions` triggers `overlay_enabled`, `compare_racks_opened` (`:702,715`), `completionActions` on confirm (`:775-779`), `complete(true)` after 0.8 s. Executor `set_global` and `complete_task` (`:781-789`). Event payload `{value}` only and no ink broadcast (C2).

**Persists.** Nothing (no done-state restore in the file).

**Deduction uses.**
- *Clue source, "the moment a record was falsified"*: finds when a record stopped being real and the value it was forced to. Example: a Lodge's incense or occult-sensor feed goes flat at 23:12:07; the time of injection is a clue that places the falsifier. The finding writes a `completionActions` global.
- *Evidence recovery after tampering*: the genuine pre-injection trace is a second route to a faded temperature/occupancy clue.
- *No verdict fit.*

**Skin.** Numeric time series with a fixed y-axis of 24-42 (`:37,307-308`) and "Battery Hall" copy (`:73-75`); fine for sector missions, a cult would need the axis and units configurable ("candle height", "EM noise").

**Gap / smallest fix.** `yMin`, `yMax`, `unit` keys (3 reads); and emit `name` in the event (C2). Closing without confirming leaves no resume state: store the annotated state in a global.

---

## 16. siem

**Dispatch/config.** `type:"siem_dashboard"` (`IX:1027-1060`) → `startSiemMinigame(sprite, cb, {timeLimitSec})` (`ST:~668-697`). The starter passes only `title, lockable, showCancel, cancelText, timeLimitSec`. The constructor reads `params.alertConfig` for a named set `ALERT_SETS.northgate_2025_11` (`mg/siem/…:245`), **but the starter never passes `alertConfig`**, so the built-in seeded alerts (`createSeededAlerts`) are used. The file's own TODO says inline `alerts` are not supported (`:239-244`). External injection: event `siem_new_alert` (`:356,365`) and `global_variable_changed:ransomware_deployed` floods criticals (`:359-363`).

**Player does.** Timed (default 180 s) triage of an alert stream: dismiss, escalate or undo; critical alerts must all be escalated.

**Writes/emits.** At the end: `siem_escalated` and `siem_missed_alerts` (`:856-861`), `siem_triage_completed` event with `{success,escalated[],dismissed[],missedCritical[]}` (`:865-875`), `complete(success)` after 1.3 s. Starter then marks `unlockedObjects` and emits `item_unlocked` (`IX:1038-1048`).

**Persists.** `globalVariables.mg01_siem_state` (alerts, time, flood flag, `:922-964`) while unfinished, cleared on finish.

**Deduction uses.**
- *Clue source via the end event*: `item_unlocked` for the console's id, or `global_variable_changed:siem_escalated`, can grant "this machine raised an alert the player saw".
- *Verdict channel `report` (weak)*: "ESCALATE" means telling the incident team; the player escalates alerts, not people. Not a good match.
- *Stakes:* timer and failure branch are an existing "missed critical" consequence.
- Alert rows are not editable from a scenario, so cannot place a named suspect.

**Skin.** Corporate SOC only; alerts are hard-coded NHS/IT strings.

**Gap / smallest fix.** Pass `alertConfig` and accept inline `alerts[]` (the TODO): in `startSiemMinigame` add `alerts: scenarioData.alerts, alertConfig: scenarioData.alertConfig`; in the constructor use `params.alerts` first. 4 lines. Then alert rows could carry a source/user field naming a suspect's host.

---

## 17. sis-config-threshold

**Dispatch/config.** Object `id:"sis_config_panel"` or `type:"sis_config_panel"` (`IX:1212-1223`) → `startSisConfigThresholdMinigame(sprite)` (`mg/sis-config-threshold/…:277-296`). `minigameData`: `title, rows[{parameter,currentValue,certifiedValue,status("GREEN"|"AMBER"|"RED"),lastModified,modifiedBy,detailText}], compareTitle, confirmLabel`. The comparison view is gated by global `sis_certification_seen` or the objective task `find_certification_doc` being complete (`:~140-155`).

**Player does.** Reads a config table; non-green rows open a detail panel; Compare with Certification (once the certification document was found) shows current vs certified; Confirm reports the tamper.

**Writes/emits.** `sis_config_seen` on open (`:48`); on confirm `sis_tamper_confirmed` and `objectivesManager.completeTask('confirm_sis_tamper')` (**hard-coded**, `:229-230`), `showSuccess('SIS tamper reported. Priya has been notified.')` (`:243`, hard-coded name). Its writer broadcasts to ink and emits (`:252-272`).

**Persists.** Globals only.

**Deduction uses.**
- *Clue source, "who changed what, when"*: each row carries `lastModified` and `modifiedBy` visible in the table (`:68-70`). Cult example: an "occult ward panel" with rows `ward_strength`, `door_seal`, `moon_phase_gate`, `modifiedBy:"v.hale"`, `lastModified:"03:22"`. Seeing the table is the clue, but nothing is granted by it: use `sis_config_seen` for a single clue, or the report.
- *Tamper target and recovery:* the table is the tamper subject. The "certified" values are the recovery source.
- *Verdict channel `report` (good fit)*: "Confirm tamper, report to security" is a report action with a named subject if `modifiedBy` is the suspect. A trigger on `sis_tamper_confirmed` runs `{type:"verdict",suspect:"hale",kind:"report"}`. Loses the "who" if several rows have different modifiers.

**Skin.** Header "SIS CONFIGURATION - BATTERY HALL SIS" (`:77`), IEC 61511 labels (`:171,180`), "Priya", and the task id are hard-coded. Corporate/industrial. Cult needs those strings and the task id config-driven.

**Gap / smallest fix.** `headerTitle, certLabel, currentLabel, successText, completeTaskId, confirmGlobal` keys (6 reads); and `rows[].onView` global to make each opened row a clue.

---

## 18. vm-launcher (VM-backed, out of scope)

Opens a SPICE/iframe console for a VM (`mg/vm-launcher/vm-launcher-minigame.js:1-9,45-50`); `type:"vm-launcher"` (`IX:1007-1023`). Requires a Hacktivity VM, so not available to browser-only Eldritch Hacker. No deduction role.

---

## 19. warranty-checklist

**Dispatch/config.** `id:"warranty_checklist"` or `type:"warranty_checklist"` (`IX:1135-1144`) → `ST:839-866`. `minigameData`: `title`, `warranties[{id,code,title,context,claimRefs[],hint}]`.

**Player does.** Reads rows and marks each Compliant / Arguable / Breached; Submit unlocks only when every row has a verdict and the global `warranty_evidence_reviewed` is true (`mg/warranty-checklist/…:111-122`).

**Writes/emits.** Submit sets `warranty_checklist_complete`, `ins001_assessed`, `ins003_assessed` (hard-coded names, `:135-137`), alert text "Warranty assessment submitted to Eleanor Vance." (`:144`, hard-coded). **Per-row verdicts are not written to any global**, only to `gameState.warrantyChecklist.verdicts` (`:106-111`, in memory, not synced). Sections lock after submit.

**Persists.** `submitted` from `warranty_checklist_complete` (`:92`); the verdict choices survive only for the session.

**Deduction uses.**
- *Verdict channel `final` (closest in the group to the board's own "Make the call")*: one row per suspect with three outcomes maps to guilty / unsure / clear. Gate on `warranty_evidence_reviewed` mirrors "review the evidence first".
- *Gap makes it unusable today:* the per-row result never leaves the minigame.
- No clue-source fit.

**Skin.** Heavily hard-coded: letterhead "Meridian Cyber Insurance", ref `MC-2023-ALBE-007`, "Albion Energy Storage Ltd", the gate note about Exhibits A-C and the assessor name (`:176-180,203-207`). Insurance/audit sector only without edits. The deduction board's own `final` route does this job better in a cult case.

**Gap / smallest fix.** On submit write each row: `warranty_verdict_<id>` = verdict (loop over `this.verdicts`, `:135`), and make the three completion names, letterhead and recipient `minigameData` keys. Then triggers with `condition globalVars.warranty_verdict_x === 'breached'` can run `verdict` actions. ~10 lines. Prefer not to, since the board has this route natively.

---

## Summary table

| Minigame | Best deduction roles | Skin fit | Gap (smallest fix) |
|---|---|---|---|
| backup-recovery | Evidence recovery after tampering (pick the clean source; item-backed `keySlots`); stake (compromised pick sets `backup_reinfected`) | Cult OK (copy is scenario text); IT default wording | Fixed global names, one restore per game, 30 s reinfection unless `network_isolated`: add `stateWrites` + `source.reinfects:false` |
| blockchain-explorer | Clue source "who pays whom / what they want" (mixer-match best); recovery by re-derivation | Mixer-match: both (configurable); explorer: corporate/crypto copy hard-coded | One boolean per trace: add `stateWrites.onMatched{depositId→global}`, `wallet.onView` |
| claims-management-system | Clue source (dossier tabs; each viewed tab writes its own global) | Both (free-text sections) | No hide/show by global, so no visible redaction: add per-section `showIf`/`hideIf` |
| command-board | Display of case timeline, tamper log, stakes status (config `timeline`/`statusRows` read `se_intel_*`, `deduction_faded_*`) | Both (config-driven) | None blocking; optional event-time field |
| coverage-decision-form | Verdict channel `report`/`act` via per-option booleans; submit-once form | Corporate/Incident Sim ready; cult needs header string made configurable | Reopen shows blank form and re-runs actions: restore `_submitted`; allow `verdict` in `completionActions` (C4) |
| drug-library-integrity | Evidence recovery template (detect, diff, corroborate with 2 sources, restore); tamper target | Clinical; poor for cult (dose table) | Table assumes dose columns; `set_global` only |
| ehr-terminal | Clue source "record shows what they carry"; online/offline gate for a recovery step | Clinical/corporate only (hard-coded header) | One flag for any patient click: add per-record `onView`, `headerTitle` |
| flag-station | None (VM-backed) | Out of scope | n/a |
| forensic-data-platform | Clue source (log-table, document excerpts); redaction/recovery display via `showIf` | Both (all text scenario data) | Only first-open and confirm write; no negated `showIf`: add `tab.onView`, `"!global"` support |
| infusion-pump | Weak `act` channel; stake target (`pump_dose_error`) | Medical only | Hard guard on `paper_charts_collected`; not worth adapting |
| log-filter | Clue source "log rows place someone somewhere"; tamper target; recovery via `stateOverrides`/audit tab | IT columns fixed; corporate strong, cult via relabelled data only | Only the anomaly's lookups fire `progressActions`; fixed columns: add per-record `onOpen`, optional `columns[]` |
| network-architecture | Clue source "who connects to whom" (relationship map) | Data free; legend/labels hard-coded | One `reviewedVar` write: add legend/label keys, `node.onView` |
| network-segmentation-map | Verdict channel `act` (authorised irreversible action); stake | Corporate/clinical only (4 fixed slots) | Not broadcast to ink (C2); fixed wording |
| ransomware-display | Stakes display / timer only | Corporate only (hard-coded copy) | No event on open; no input |
| scada-historian | Clue source "when a record was falsified"; recovery by genuine trace | Sector only (y-axis 24-42, "Battery Hall") | Payload lacks `name`, no ink broadcast: add `yMin/yMax/unit`, use `writeGlobal` |
| siem | Weak: stakes (missed-critical branch); `item_unlocked` on success | Corporate SOC only | `alertConfig` never passed by the starter; inline `alerts[]` unsupported: pass through (4 lines) |
| sis-config-threshold | Verdict `report` ("confirm tamper"); tamper subject; "who changed what" (`modifiedBy`) | Industrial; hard-coded header, "Priya", task id | Six hard-coded strings; no per-row write |
| vm-launcher | None (VM-backed) | Out of scope | n/a |
| warranty-checklist | Verdict channel `final` (per-row ratings), if per-row results were written | Insurance only (letterhead hard-coded) | Per-row verdict not written to any global: write `warranty_verdict_<id>` on submit |

**Best bets for Eldritch Hacker (browser-only, cult):** blockchain-explorer (mixer-match) for "what they want"; log-filter (needs the per-record write) for "where they were"; forensic-data-platform and claims-management-system for "what they carry" dossiers; backup-recovery for recovery after tampering (with the reinfection fix); command-board for the case timeline view; coverage-decision-form for a structured report channel. Everything else is corporate or sector-specific.

**One-change-covers-most fix:** make every private `_setGlobalAndNotify` call `writeGlobal` (C2), and let the four action-list executors delegate to `applyActions` (C4). Together they make all writes visible to ink and to triggers, and let `grant_fact` / `verdict` sit directly in `completionActions`.
