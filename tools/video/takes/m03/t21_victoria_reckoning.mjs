// t21_victoria_reckoning (m03 v3): NIGHT, conference_room_01, all four VM flags in. A short straight key walk (one axis, lined up off camera) to Victoria,
// the night confrontation opens, then every opening line plays in full. Scripted path (no filming of what follows):
//   opener "SAFETYNET. And I know the name on your approvals. Sable." > the_reckoning "Ten thousand for target selection..." >
//   "Ghost wanted somewhere that would pay. I told them where. That's consultancy." (6.14 s) > target_followup "Consultancy. Is that the story..." >
//   "I sleep perfectly. That's the part people like you can never forgive." (4.94 s). The take stops 0.4 s after it; confrontation_decision is never reached on camera.
// Entry state: new-game.rb m03_ghost_in_the_machine --start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true --set clone_call_done=true
//   --set mission_phase=act2_infiltration --set transaction_log_read=true --submit-flag ghost_in_machine_vm_network:flag_1 ... flag_4
// Record (no BE_SPRITE): tools/video/takes/run-take.sh m03 t21_victoria_reckoning "<flags above>" "--hide-hud --zoom-step 1"
import { makeBeat } from './_beat.mjs';
const b = makeBeat({ npcId: 'victoria_sterling', start: [0, 96], stop: [0, 40], order: 'yx', align: true, lingerMs: 400,
  steps: [/^SAFETYNET\. And I know the name/i, /^Ten thousand for target selection/i, /^Consultancy\. Is that the story/i],
  targets: [{ name: 'ghost', re: /Ghost wanted somewhere that would pay/i }, { name: 'sleep', re: /I sleep perfectly/i }] });
export const setup = b.setup; export default b.run;
