# m02 office life: spoken lines (stage 4)

Every line here is scenario data (NPC JSON or ink) and voiceable. No TTS has been generated for any of them. Existing m02 lines changed: none. Removed: none.

Not spoken, for the record: Gary's NPC observation (`scenario.json.erb`, `gary_whitlock.observations`) now counts two dead terminals instead of four, matching the ink's first-meeting narration and the two PCs in IT. Observations are shown, never voiced, so no clip changes. The HaX texts and credits lines for the night staff are text only.

## New

| Slice | Speaker | Where | Kind |
|---|---|---|---|
| 1, 6 | Ernesto Bautista | `ink/m02_npc_ernesto_bautista.ink` | conversation, 16 lines: greeting (2), wary greeting (1), re-entry (2, normal and wary), his job and the paper night (3), the radio (2), why the wards are not his (2), the radio call about a visitor once the burn exchange was heard (2), parting (2, normal and wary) |
| 1, 6 | Hodan Warsame | `ink/m02_npc_hodan_warsame.ink` `start`, `hub` | conversation, 12 lines: greeting (1), wary greeting (1), re-entry (2), her job and the paper night (2), the long night (2), the radio call about a visitor (2), parting (2) |
| 4 | Ernesto Bautista | `scenario.json.erb`, his `chatter.coffee` | 4 pool lines |
| 4 | Ernesto Bautista | `scenario.json.erb`, his `chatter.cooler` | 4 pool lines |
| 4 | Hodan Warsame | `scenario.json.erb`, her `chatter.coffee` | 4 pool lines |
| 4 | Hodan Warsame | `scenario.json.erb`, her `chatter.cooler` | 4 pool lines |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_burned` | exchange, 3 lines (2 Hodan, 1 Ernesto) |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_cleared` | exchange, 3 lines (2 Hodan, 1 Ernesto) |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_paper` | exchange, 5 lines (3 Hodan, 2 Ernesto) |

After slice 4, V6 (`app:break_escape:tts:office_lines[m02_ransomed_trust]`) lists 27 office-life clips (16 pool, 11 exchange), all uncached, 914 characters. Conversation lines are not in V6; they are counted in the table above (28).

Total new clips at the end of slice 6: 55 (16 pool, 11 exchange, 28 conversation). The plan estimated about 53.

## Changed

None.

## Removed

None.
