# Finale TTS count: m09 and m10

Counted 2026-10-22 with the tts-audio skill's extractor (`BreakEscape::TtsLineExtractor.for_scenario`, run through `bin/rails runner` in the test environment). No audio was generated and no TTS API call was made. Nothing is committed.

How to read it: a "line" is one cache key (normalised text, voice, style, language, model), so the same text under the same voice counts once. "Chars" is the length of the text the client sends (speaker prefix already stripped). "Cached" means a current-model clip with that key already exists under `tts_cache/` in any scenario folder; "2.5 clips" means an older-model clip that the server would fall back to. The extractor reported no skipped or unresolved lines for either mission (0 notes).


## m09 Digital Archaeology

Lines 364, characters 23,703. Already cached 0 lines (0 chars), 2.5 clips found 0. **New: 364 lines, 23,703 chars.** 12 voiced conversations.

### Per speaker

| Speaker (npc id) | Voice / language | Lines | Chars | Already cached |
|---|---|---:|---:|---:|
| agent_0x99 | Aoede / en-GB | 137 | 9,103 | 0 |
| closing_debrief | Charon / en-GB | 46 | 3,289 | 0 |
| Narrator (narrator) | Algenib / en-GB | 46 | 2,844 | 0 |
| briefing_cutscene | Charon / en-GB | 24 | 1,593 | 0 |
| sorensen_hatch | Vindemiatrix / en-US | 20 | 1,306 | 0 |
| noor_haddad | Despina / en-US | 20 | 1,204 | 0 |
| recruiter | Gacrux / en-US | 14 | 1,106 | 0 |
| old_coyote | Achird / en-US | 16 | 679 | 0 |
| jesse_tran | Puck / en-US | 11 | 612 | 0 |
| sorensen | Vindemiatrix / en-US | 9 | 608 | 0 |
| kowalczyk | Pulcherrima / en-GB | 6 | 318 | 0 |
| sorensen_door | Vindemiatrix / en-US | 3 | 259 | 0 |
| quintero | Kore / en-US | 3 | 184 | 0 |
| director_netherton | Charon / en-GB | 3 | 171 | 0 |
| alpha_recording | Sadaltager / en-GB | 2 | 167 | 0 |
| malhotra | Zubenelgenubi / en-GB | 2 | 107 | 0 |
| arakawa | Achird / en-US | 1 | 105 | 0 |
| archive_guard | Algieba / en-US | 1 | 48 | 0 |

### Per voice

| Voice | Lines | Chars | Already cached | Speakers using it |
|---|---:|---:|---:|---|
| Aoede | 137 | 9,103 | 0 | agent_0x99 |
| Charon | 73 | 5,053 | 0 | briefing_cutscene, closing_debrief, director_netherton |
| Algenib | 46 | 2,844 | 0 | narrator |
| Vindemiatrix | 32 | 2,173 | 0 | sorensen, sorensen_door, sorensen_hatch |
| Despina | 20 | 1,204 | 0 | noor_haddad |
| Gacrux | 14 | 1,106 | 0 | recruiter |
| Achird | 17 | 784 | 0 | old_coyote, arakawa |
| Puck | 11 | 612 | 0 | jesse_tran |
| Pulcherrima | 6 | 318 | 0 | kowalczyk |
| Kore | 3 | 184 | 0 | quintero |
| Sadaltager | 2 | 167 | 0 | alpha_recording |
| Zubenelgenubi | 2 | 107 | 0 | malhotra |
| Algieba | 1 | 48 | 0 | archive_guard |

## m10 Full Disclosure

Lines 1068, characters 56,461. Already cached 1 lines (79 chars), 2.5 clips found 0. **New: 1067 lines, 56,382 chars.** 71 voiced conversations.

### Per speaker

| Speaker (npc id) | Voice / language | Lines | Chars | Already cached |
|---|---|---:|---:|---:|
| tesseract | Sadaltager / en-GB | 121 | 6,331 | 0 |
| Narrator (narrator) | Algenib / en-GB | 94 | 5,973 | 0 |
| director_netherton | Charon / en-GB | 96 | 5,892 | 0 |
| hax_post | Aoede / en-GB | 99 | 5,559 | 0 |
| nightshade_table | Enceladus / en-GB | 61 | 4,019 | 0 |
| voltage_van | Alnilam / en-GB | 46 | 2,299 | 0 |
| six_oclock | Charon / en-GB | 35 | 2,263 | 0 |
| quintero_post | Kore / en-US | 41 | 1,818 | 0 |
| victoria_gallery | Despina / en-GB | 33 | 1,812 | 1 |
| kowalczyk_post | Pulcherrima / en-GB | 40 | 1,586 | 0 |
| agent_0x99 | Aoede / en-GB | 27 | 1,465 | 0 |
| gary_consultant | Charon / en-GB | 26 | 1,442 | 0 |
| ghost_phone | Iapetus / en-GB | 28 | 1,420 | 0 |
| imran | Puck / en-GB | 26 | 1,397 | 0 |
| tunnel_guard | Sadachbia / en-US | 35 | 1,052 | 0 |
| duty_guard_b | Laomedeia / en-US | 35 | 1,052 | 0 |
| farah_guard | Zephyr / en-US | 35 | 1,052 | 0 |
| arakawa_post | Achird / en-US | 25 | 996 | 0 |
| vector_post | Iapetus / en-GB | 15 | 803 | 0 |
| wendell | Algieba / en-US | 14 | 791 | 0 |
| elena_phone | Leda / en-US | 11 | 746 | 0 |
| gary_voice | Charon / en-GB | 12 | 723 | 0 |
| vos | Schedar / en-GB | 14 | 717 | 0 |
| victoria_line | Despina / en-GB | 9 | 687 | 0 |
| vance_phone | Orus / en-GB | 10 | 676 | 0 |
| lock_guard | Rasalgethi / en-US | 11 | 621 | 0 |
| asante | Callirrhoe / en-GB | 11 | 593 | 0 |
| malhotra_post | Zubenelgenubi / en-GB | 13 | 558 | 0 |
| phantom_post | Fenrir / en-GB | 11 | 553 | 0 |
| hearing | Aoede / en-GB | 6 | 445 | 0 |
| imran_voice | Puck / en-GB | 5 | 299 | 0 |
| wendell_voice | Algieba / en-US | 4 | 217 | 0 |
| minder_blast | Sulafat / en-GB | 7 | 201 | 0 |
| citadel | Charon / en-GB | 2 | 134 | 0 |
| static_power | Umbriel / en-GB | 5 | 93 | 0 |
| kowalczyk_core_waiting | Pulcherrima / en-GB | 2 | 68 | 0 |
| mercer | Iapetus / en-US | 1 | 59 | 0 |
| tesseract_voice | Sadaltager / en-GB | 2 | 49 | 0 |

### Per voice

| Voice | Lines | Chars | Already cached | Speakers using it |
|---|---:|---:|---:|---|
| Charon | 171 | 10,454 | 0 | citadel, director_netherton, gary_consultant, gary_voice, six_oclock |
| Aoede | 132 | 7,469 | 0 | agent_0x99, hax_post, hearing |
| Sadaltager | 123 | 6,380 | 0 | tesseract, tesseract_voice |
| Algenib | 94 | 5,973 | 0 | narrator |
| Enceladus | 61 | 4,019 | 0 | nightshade_table |
| Despina | 42 | 2,499 | 1 | victoria_gallery, victoria_line |
| Alnilam | 46 | 2,299 | 0 | voltage_van |
| Iapetus | 44 | 2,282 | 0 | ghost_phone, mercer, vector_post |
| Kore | 41 | 1,818 | 0 | quintero_post |
| Puck | 31 | 1,696 | 0 | imran, imran_voice |
| Pulcherrima | 42 | 1,654 | 0 | kowalczyk_core_waiting, kowalczyk_post |
| Sadachbia | 35 | 1,052 | 0 | tunnel_guard |
| Laomedeia | 35 | 1,052 | 0 | duty_guard_b |
| Zephyr | 35 | 1,052 | 0 | farah_guard |
| Algieba | 18 | 1,008 | 0 | wendell, wendell_voice |
| Achird | 25 | 996 | 0 | arakawa_post |
| Leda | 11 | 746 | 0 | elena_phone |
| Schedar | 14 | 717 | 0 | vos |
| Orus | 10 | 676 | 0 | vance_phone |
| Rasalgethi | 11 | 621 | 0 | lock_guard |
| Callirrhoe | 11 | 593 | 0 | asante |
| Zubenelgenubi | 13 | 558 | 0 | malhotra_post |
| Fenrir | 11 | 553 | 0 | phantom_post |
| Sulafat | 7 | 201 | 0 | minder_blast |
| Umbriel | 5 | 93 | 0 | static_power |

## Totals and cost

| | Lines | Chars | Already cached | New lines | New chars | Est. audio | Est. cost to 31 Dec 2026 |
|---|---:|---:|---:|---:|---:|---:|---:|
| m09 Digital Archaeology | 364 | 23,703 | 0 | 364 | 23,703 | 0.47 h | $0.38 |
| m10 Full Disclosure | 1068 | 56,461 | 1 | 1067 | 56,382 | 1.12 h | $0.91 |
| **Both** | 1432 | 80,164 | 1 | **1431** | **80,085** | 1.59 h | **$1.29** |

Pricing is the skill's rule 8: about $9 per million audio tokens at 25 tokens a second, roughly $0.81 per hour of audio until 31 Dec 2026, double from 1 Jan 2027 (about $2.57 for both then). Audio length is my estimate, not measured: 14 characters of text per second of speech (typical for the unhurried styles used here). At 12 to 16 chars/s the total is $1.13 to $1.50. Input text tokens are negligible. Rejected takes and re-rolls are not included; the skill's own range for a whole mission is $0.20 to $1.50.

Cached: the only reuse is one m10 line, Victoria Sterling's "My associates offered to deal with you. I said I'd do it myself. I still might." (80 chars), which already exists in `tts_cache/m03_ghost_in_the_machine/` under the same Despina voice and style (current model). Neither mission has a `tts_cache/` folder yet, and no m09 line matches anything in the cache. m09 and m10 share no clips with each other yet: the shared characters' styles differ by scene sentence. The four raid officers now have one voice and style in both missions (below), so identical lines would share a clip.

## Voice assignments in use

Source: the rendered `scenario.json.erb` (what the extractor voices). They match the voice sections of each `ASSET_LIST.md` (m09 section 6, m10 section 6) with the differences noted below.

### m09

Narrator Algenib (en-GB, series voice). Agent HaX Aoede (en-GB; `hax_voice` copies the phone contact's block). Director Netherton Charon (en-GB; the briefing and closing-debrief hosts use his block). The Recruiter Gacrux (en-US). Margaret Sorensen Vindemiatrix (en-US, one block over `sorensen_hatch`, `sorensen`, `sorensen_door`). Noor Haddad Despina (en-US). Jesse Tran Puck (en-US). Cody Old Coyote Achird (en-US). Lyle Dillard Algieba (en-US). Quintero Kore (en-US). Kowalczyk Pulcherrima (en-GB). Malhotra Zubenelgenubi (en-GB). Arakawa Achird (en-US). Alpha recording (Tesseract on tape) Sadaltager (en-GB, style still "for the user to hear first" in ASSET_LIST; `fx: radio` stands in for tape). Unvoiced phone-only contacts that still carry a block: Nightshade Enceladus, Torres Schedar, Gary Charon.

Shared voices: Charon is Netherton, the briefing host and the closing-debrief host (one person, one block), and Gary (phone thread, unvoiced). Aoede is HaX's phone and in-person records (same block). Vindemiatrix covers Sorensen's three records. One pair shares a voice in m09: Arakawa (1 line) and Cody Old Coyote both have Achird; see "Across the two missions".

### m10

Narrator Algenib. HaX (`hax_post`, `agent_0x99`, and the `hearing` host) Aoede. Netherton, the `six_oclock` and `citadel` hosts, and both Garys (`gary_consultant`, `gary_voice`) Charon. Tesseract and `tesseract_voice` Sadaltager. Nightshade Enceladus. Victoria (gallery and line) Despina. Voltage Alnilam. Static Umbriel. Ghost, Vector and Mercer Iapetus. Phantom Fenrir. Quintero Kore. Kowalczyk Pulcherrima. Arakawa Achird. Malhotra Zubenelgenubi. Elena (phone) Leda. Vance (phone) Orus. Imran Puck. Wendell Algieba. Asante Callirrhoe. Vos Schedar. Fonoti Rasalgethi. Farah Zephyr. Minders Sulafat. The bunker's generic guards Sadachbia (men) and Laomedeia (`duty_guard_b`, `hall_guard_b`).

Two different speakers sharing a voice in m10 (the ASSET_LIST flags the first two as accepted):
- **Charon: Netherton and Gary Whitlock.** Recurring characters keeping their own voices, never in the same room.
- **Iapetus: Vector, Dr Mercer and Ghost.** Same reasoning. Ghost's block adds `voice-distortion`.
- **Sadachbia: the bunker's generic male guards** (tunnel, duty, workshop, hall A, monitor, reinforcements). Intended, a uniformed crew. Only `tunnel_guard` has lines under Sadachbia in this count (35); the other Sadachbia guards add none, so they share its clips or have no voiced lines.
- **Aoede: HaX and the `hearing` host.** Intended: the hearing host speaks only HaX lines (6), so it carries HaX's block. The m10 ASSET_LIST (section 6.2) now records this.

Cost note: `tunnel_guard` (Sadachbia), `duty_guard_b` (Laomedeia) and `farah_guard` (Zephyr) each say the same 35 lines (1,052 chars) in three different voices, so that guard script is paid for three times (3,156 chars).

### Across the two missions

Settled 2026-10-22: the four raid officers now use one voice and one style (the fuller of the two earlier wordings) in both scenario files, so their clips are shared between m09 and m10. The voices are ones no other voiced speaker uses in either mission, except Arakawa.

| Character | Before (m09 / m10) | Now (both) | Why |
|---|---|---|---|
| Kowalczyk | Leda / Autonoe | Pulcherrima (en-GB) | Free female voice; forward and quick for the team's easy joker. Leda is Elena in m10, Autonoe was m10 only. |
| Quintero | Callirrhoe / Gacrux | Kore (en-US) | Free female voice; firm, suits a low, dry, steady raid leader. Callirrhoe is Asante in m10, Gacrux the Recruiter in m09. |
| Malhotra | Iapetus / Zubenelgenubi | Zubenelgenubi (en-GB) | Unused in m09 and used by Malhotra alone in m10; Iapetus is Vector, Mercer and Ghost in m10. |
| Arakawa | Rasalgethi / Achird | Achird (en-US) | Best fit for "soft, slow, kind", already his m10 voice (25 lines). Residual clash below. |

Residual clash: every male Gemini voice is in use across the two missions except Zubenelgenubi, so Arakawa cannot have a unique male voice. Achird is also Cody Old Coyote's in m09 (Arakawa has 1 line there; the two never share a scene), and nothing clashes in m10. A clean fix, if wanted: re-voice Old Coyote to Rasalgethi (free in m09 now Arakawa has left it; Fonoti has it in m10, a different mission and not Old Coyote's). That is a change to another character, so it was not made.

No audio exists yet, so nothing is orphaned by the change. The officers' m09 and m10 lines now share a clip wherever the text is identical.

## Open points for the approver

1. Arakawa's Achird against Old Coyote's in m09 (above).
2. The new voices (Pulcherrima, Kore) have not been heard; by ear before generating.
3. The m09 Tesseract tape style is still unconfirmed by the user's ear (ASSET_LIST section 6); the 2 alpha_recording lines are only 167 chars.
4. Skill rule 1: generate only once the dialogue is signed off. Both missions are still in editorial passes (git status shows `scenarios/m10_full_disclosure/scenario.json.erb` modified).

- 2026-10-22 m10 alignment R4: +1 Netherton line (scorched 'whole map' form), 1 Netherton line reworded (both-wiped St. Catherine's). Recount before generation.
- 2026-10-22 m10 alignment R5: 1 Netherton line (scorched St. Catherine's ending) and 1 narrator line (Citadel close) reworded; no new lines.
- 2026-10-22 m09 puzzle chains R1: 1 HaX line reworded (identity_scene.albion, 'in the tape room'); count unchanged.
- 2026-10-22 m10 alignment R8: +2 lines (Victoria 'You found your own way in. I'll remember that.'; Gary 'Right. Power room's open. I'll get Imran to the medics first.').
- 2026-10-22 m10 alignment R10: 2 lines reworded (Gary, Imran at 06:00); no new lines.
- 2026-10-22 m10 alignment R11: Gary and Imran 06:00 lines reworded again (replace R10's); no new lines.
- 2026-10-22 m10 alignment R12: −1 line (Imran's card_cloned 06:00 line deleted).
- 2026-10-22 m09 scenario design R1: +2 voiced (Netherton Sun River line; narrator file glance). m09 now 371 voiced entries.
- 2026-10-22 m09 scenario design R2: +2 voiced Netherton lines, 1 reworded (Sun River three arms).
- 2026-10-22 m09 dialogue R1: 373 → 376 voiced lines; 10 reworded, 3 new (13 clips).
- 2026-10-22 m09 educational R1 + scenario design R3: 2 Netherton lines reworded; count stays 376.
- 2026-10-22 m09 dialogue R2: net 0 (376); 5 clips (1 new Sorensen, 4 reworded, 1 HaX dropped).
