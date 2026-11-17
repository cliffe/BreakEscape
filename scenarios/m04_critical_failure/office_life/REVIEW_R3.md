# m04 office-life plan review, round 3

Reviewer tier: planning tier, read-only, at commit acb2e682a.

Counts: B 1 / M 2 / m 7

## Findings and outcomes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| B1 | blocker | Exchange prefixes `Ibrahim:` / `Joanne:` match no id or `displayName` (`npc-needs-chatter.js:47` to `:56`), so every exchange is refused (`npc-needs.js:3004`) and `validate_scenario.rb:1214` to `:1238` errors. | Fixed: prefixes are the exact `displayName` (`Ibrahim Diallo:`, `Joanne Pell:`). |
| M1 | major | A sixth count: the blueprint note at 2739 ("On site: 11", "Surveillance coverage: ALL AREAS") weakens the off-roster option. | Fixed: note text becomes "On site per tonight's rota: 11" (unvoiced, listed as a changed line); Q2 (d) states what it leans on. |
| M2 | major | `hydrogen_alarm` is not an evacuation (crew stay put, 1057 to 1072; reception emitter only on `crew_warned`, 632 to 638). | Fixed: mapping dropped; evacuation is `crew_warned` and `racks_vented` (silent); `onceOnly` count 15; L6 checks the pair stay on `hydrogen_alarm` alone. |
| m1 | minor | "Walked out" with no evacuation. | Fixed: 2.13 uses the crew's "or never needed to" sense (credit comment 239 to 241). |
| m2 | minor | A struck newcomer does not punch; E gives "past talking" and the player hits again; hostility clears only on a player-KO Restart (`npc-hostile.js:113` to `:121`). | Fixed: 2.12 and L8, with a Restart case. |
| m3 | minor | Section 1 said both go back to the sofa on trouble. | Fixed: only the one not struck. |
| m4 | minor | V4 never clears (`E1_PROBE_PASSED` constant, `validate_office_life.rb:42`). | Fixed: 10.6 expects the warning. |
| m5 | minor | Joanne at the cooler draws behind the fig planter. | Fixed: L2 rendered screenshot; Q6 notes the planter move clears it. |
| m6 | minor | Naming drift (`m04_night_staff.ink`, `aes_night`, "night staff"). | Fixed: `m04_npc_ibrahim_diallo.ink`, `aes_office`, "office staff". |
| m7 | minor | The off-roster fact lives only in an exchange the player may miss. | Fixed: Ibrahim's talk line carries it. |

## Checked and clean

Other on-site counts in guard, Vance and HaX lines and `crew_lost`; credits 238 to 245 and debrief edits; NPC bodies do not occlude the guard's LOS (`npc-sight-occlusion.js:5` to `:31`); cooler cell 88 px from the guard, clear of the speed gate; ops north door at x 48; kettle cells clear; Vance over 100 px away; V2 clear; V7 and V10 fine; exchange knots in a storyPath file trip no lint; section 6, 7 and 9 counts agree.

Not checked: the guard's live facing; leash anchors for a newcomer struck at the kettle.
