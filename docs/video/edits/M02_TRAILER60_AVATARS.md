# m02 60 s trailer: avatar per take (v2 re-record, 2026-11-20)

Set with `BE_SPRITE=<key> tools/video/takes/run-take.sh m02 <id> ...` (run-take.sh restores the demo user's avatar afterwards). Edit order from `tools/video/edits/m02_trailer60.json`. "Visible" means the player's sprite can be seen on the map or in a minigame approach; for those takes no two adjacent visible shots share an avatar. Hood hackers are used once each, on takes where the player is not on screen.

| Edit order | Shot | Take | Avatar | Player visible |
|---|---|---|---|---|
| 1 | hax_hook | t01_hax_hook | vivian_ashby | no (portrait) |
| 2 | m_ransom | t04_ransom | vivian_ashby | yes |
| 3 | npc_bernie_premise | t28_bernie_premise | male_hacker_hood_v2 | no (dialogue) |
| 4 | m_lights | t02_lights | mei_lin_chow | yes |
| 5 | m_lockpick | t03_lockpick | lucia_moreno | yes |
| 6 | walk_vm | t07_walk_vm | ngozi_adeyemi | yes |
| 7 | m_cyberchef | t08_cyberchef | mei_lin_chow | no (overlay) |
| 8 | m_ghost_terminal | t16_ghost_terminal | daniel_seo | yes (pickup walk) |
| 9 | npc_val / mb_val_walk | t09_val | frank_callahan | yes (walk-up) |
| 10 | mb_chair | t12_walk_chair | marcus_hale | yes |
| 11 | t26_walk_room | t26_walk_room | harjit_singh | yes |
| 12 | cr_lockpick | t03_lockpick | lucia_moreno | yes |
| 13 | cr_keypad | t06_keypad | daniel_seo | yes |
| 14 | cr_kim | t24_kim_talk | daniel_seo | no (dialogue) |
| 15 | cr_ransom | t04_ransom | vivian_ashby | yes |
| 16 | cr_recovery | t14a_server_minigames | marcus_hale | yes |
| 17 | cr_gary | t25_gary_talk | harjit_singh | no (dialogue) |
| 18 | cr_cyberchef | t08_cyberchef | mei_lin_chow | no |
| 19 | cr_phone | t05_phone | ngozi_adeyemi | no (phone) |
| 20 | cr_ward | t22_ward_crowd | harjit_singh | yes |
| 21 | cr_cabinet | t14c_supply_cabinet | lucia_moreno | yes |
| 22 | cr_password | t14d_gary_password | frank_callahan | yes |
| 23 | cr_flag | t14b_flag_station | marcus_hale | yes |
| 24 | cr_walkvm | t07_walk_vm | ngozi_adeyemi | yes |
| 25 | cr_reeves | t27_reeves_talk | frank_callahan | no (dialogue) |
| 26 | ghost_reveal / ghost_close | t17_ghost_call | female_hacker_hood_v2 | no (video call) |

Spies used: vivian_ashby, mei_lin_chow, lucia_moreno, ngozi_adeyemi, daniel_seo, frank_callahan, marcus_hale, harjit_singh (all eight). Cutting takes of the same avatar next to each other only happens where the player is not visible (cr_keypad then cr_kim, both daniel_seo; cr_kim is a portrait).

Optional lines checked but not in the current edit (t10_doyle, t11_pryce, t15_reeves): see `docs/video/takes_m02.md` v2 section for the avatars used.
