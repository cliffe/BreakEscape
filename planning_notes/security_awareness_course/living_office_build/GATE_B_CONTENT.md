# Gate B test content (test_ca_office_kit)

Built in `scenarios/test_ca_office_kit/scenario.json.erb` plus `scenarios/_office_kit/ink/{priya_nair,sam_okoro,ep_host}_ambient.{ink,json}`. Validator 0 errors (strict-social); office-kit and validator-office-life node tests 47/47.

## Source pointers (checked in this worktree, `public/break_escape/js/`)
- Mapping fields: npc-manager.js:1493-1529 (knot/targetKnot, bark, barkDelay, delayMs, patrolOverride, needs); patrolOverride walk 1930-1951 (tile * 32 from room origin, `goToAndStay`); needs control 1954; bark with knot 2069-2100. Validator demands `targetKnot` (not `knot`) in mappings; the engine reads either.
- Needs control (`suspend`/`resume`/`{set}`): npc-needs.js:1119-1175. Resume returns false unless scriptSuspended. Script move suspends needs: npc-needs.js:800-810, npc-behavior.js:3501. `npc_arrived:<id>` payload {npcId,x,y,owner,moveId,pathLeft}: npc-behavior.js:3618-3626.
- `npc_returned_post:<id>`: npc-needs.js:1524, 3607. `workstation_owner_returned:<pc>` {objectId,ownerId,wasLocked}: workstation-state.js:585; `workstation_owner_left:<pc>` {screenLocked,reason}: :552. `npc_use_started:<obj>` {npcId,objectId,need}: npc-needs.js:3636. `npc_use_failed:<id>` {npcId,objectId,need,missing,station}: npc-needs.js:3914.
- Work resources: npc-work.js:27-60 (offWhen, requireGlobal form). A judged work need counts ONLY the NPC's own `needsHome` desk as a source (scripts/validate_npc_needs.rb:1329-1333): so Priya's home is her PC, not a coordinate.
- revealOnGlobal: rooms.js:3070-3090 (shown when global === true). spriteVariants listener: rooms.js:713-760; an unloaded key is fetched at the event (cold cache). A PC with spriteVariants gets no auto locked look: screen-states.js:73.
- Timers: ui/scenario-timer-dispatcher.js:86-120 startOnGlobal, 197-238 fire; a `setGlobal` field works directly (plan said `actions`/emit_event; both used here). emit_event payload `{source}` only: apply-actions.js:181-185. Timer condition: `===`, `!==`, `!`, `&&` only (336-410); false condition marks the timer fired.
- Ink writes a declared global and emits `global_variable_changed:<name>` {name,value}: npc-conversation-state.js:593-632. Only declared globals sync (466-475).
- `conversation_closed:<npcId>` {npcId,timestamp}, once per instance: person-chat-minigame.js:2119-2126 (plan said :2121, ok).
- PC gate: interactions.js:1039-1074 (`requiresItem` with `triggerOnInteract: []` shows the hint, emits `usb_refused` only when a held item is refused). Decay floor 0.01: npc-needs.js:379-383.

## Disagreements with the plan
- Timers: `setGlobal` exists directly; no `emit_event` needed (one timer still uses it).
- Mapping `delayMs` (not plan's bark `delayMs`) is the fire-later field; `barkDelay` delays the bark alone.
- Judged work need must target the NPC's own PC home (validator).
- Mappings must use `targetKnot` (validator error on `knot`).

## What was added
Chain (proof 9), all started by `episode_step_away` -> `kit_e1_out` (existing host mapping):
- Gwen: `needs.set caffeine 10`; first line on `npc_use_started:kit_coffee` (filter data.npcId); `npc_returned_post:kit_gwen_pritchard` (coordinate home) sets `kit_e1_gwen_back`.
- Agnieszka: `needs:"suspend"` at look-up; timer 1 s sets `kit_e1_walk` -> `patrolOverride` to tile (4,3) alone; `npc_arrived` (filter `data.owner !== 'needs'`) sets `kit_e1_agn_there` and barks; separate mapping `needs:"resume"` after 3 s. At 25 s `kit_e1_combo` -> one mapping with patrolOverride (5,5) AND `needs:"suspend"`; arrival sets `kit_e1_combo_arrived` -> resume (2 s); 40 s fallback `kit_e1_combo_end` -> resume.
- Priya (PC home `kit_e1_pc2`, useSeconds 3): `work` set 10; resource `kit_e1_system` offWhen `kit_e1_out`, workNeeds; `npc_use_failed:kit_priya_nair` filtered to `data.objectId === 'kit_e1_pc2'` sets `kit_e1_note_up`; timer `kit_e1_t_note` 6 s (condition `!globalVars.kit_e1_note_up`) races it; bark + knot `kit_e1_request` on `kit_e1_note_up`.
- Revealed objects: `kit_e1_poster` (kit_e1_out), `kit_e1_note` (kit_e1_note_up). Partner suspended: Agnieszka.
- Timer `kit_e1_t_event` emit_event `kit_e1_timer_event`; host mapping sets `kit_e1_timer_seen` (gated on globalVars only).
Request (proof 10): Priya's knot sets `kit_e1_note_choice` to `report` or `wait`; stub `start` diverts on `kit_defend_done` and `kit_ep`; hub option `+ {kit_e1_note_up}` in Priya's `hub`; `conversation_closed:kit_priya_nair` sets `kit_e1_closed`; host mapping on closed barks and opens `kit_e1_host_note` (reads the choice); timers `kit_e1_t_report` (`=== 'report'`) and `kit_e1_t_other` (`!== 'report' && !== ''`) after 3 s.
ca12 screen (proof 12): Sam Okoro, `needsHome: kit_e1_pc`, rest `decayPerMin 0.01` initial 90, set to 10 at look-up; PC `kit_e1_pc` workstation, owner Sam, `lockChance 0`, `requiresItem kit_e1_gate_item`, `triggerOnInteract []`, spriteVariants to `pc12` on `kit_e1_out` (stand-in look, cold cache); sofa `kit_e1_sofa` rest source; `workstation_owner_returned:kit_e1_pc` bark + knot `kit_e1_screen` sets `kit_e1_screen_choice` (`mention`/`none`).
Ambient staff needs held at decayPerMin 0.01 / initial 90 (idle until set).

## Runner steps (new game on test_ca_office_kit; seed `kit_defend_done` true and `kit_quiet` true via test bridge, then emit `episode_step_away`)
Proof 9
1. 0 s: `kit_e1_out` true; poster visible, Sam's PC sprite becomes pc12, host bark. Expect `level_set` for caffeine/work/rest, Agnieszka `suspended`.
2. Trips begin within ~1.2 s; Gwen reaches kit_coffee: `npc_use_started:kit_coffee` and her bark; no bark on a needs-trip arrival of Agnieszka (owner `needs`).
3. ~1 s: `kit_e1_walk`; Agnieszka walks to (4,3); `npc_arrived:kit_agnieszka_duda` owner not `needs`; `kit_e1_agn_there` true, bark; 3 s later `resumed`; then set her caffeine low and confirm a needs trip.
4. Priya: use at `kit_e1_pc2` ends at 3 s -> `npc_use_failed` (objectId `kit_e1_pc2`) -> `kit_e1_note_up`, note revealed, request bark ~4-6 s. To test the fallback race, suspend Priya first (`npcNeedsSystem.control('kit_priya_nair','suspend')`): the 6 s timer must set it. A failed use by Gwen elsewhere must raise nothing.
5. Gwen back: `npc_returned_post:kit_gwen_pritchard` -> `kit_e1_gwen_back`; record whether it fires for the coordinate home.
6. 25 s: `kit_e1_combo`; record whether one-mapping suspend cancels the walk (does `kit_e1_combo_arrived` become true?); 40 s fallback resumes.
7. 2 s: `kit_e1_timer_event` -> `kit_e1_timer_seen`.
8. Partner cases: before the look-up set Agnieszka caffeine 10 (idle at coffee / queued behind Gwen / standing on the use cell) and confirm Gwen is never stuck behind her; deferred: coffee capacity is 2 here, so queueing needs capacity 1.
9. Twin `test_ca_office_kit_defend`: nothing fires (no chain mappings there).
Proof 10
1. Click Priya's bark: knot `kit_e1_request` opens; choose each answer; `kit_e1_note_choice` is `report` or `wait`; close; `conversation_closed:kit_priya_nair` once -> `kit_e1_closed`.
2. Click Priya before `kit_e1_note_up`: `ca01` line, no note option; after: option appears.
3. After close: host bark ~4 s, knot reads the choice; at 3 s `kit_e1_t_report` true (report) or `kit_e1_t_other` true (wait); with no answer neither.
Proof 12
1. Sam stays seated 15 min (rest 90, 0.01/min); at the look-up PC look changes at 0 s, Sam walks to sofa, screen stays on; `workstation_owner_left:kit_e1_pc` has `screenLocked:false`.
2. Click PC while away: hint shown, nothing opens, no `usb_refused`. Her trip and return still happen.
3. `workstation_owner_returned:kit_e1_pc` -> bark opens `kit_e1_screen`; each answer sets `kit_e1_screen_choice`. If the gate changes her needs, repeat with `interactable:false`.

## Deferred to gate C/D
ca06/ca16 source-to-kiosk walks; ca15 stick (transparent swap, takeable false, observationVariants, no-answer timer, "leave", Chidi walkers); ca01 real board tile in the dressed room; per-shell end-to-end timing; screen lock action and `pc*_locked` look; partner-on-use-cell cases needing capacity 1.
