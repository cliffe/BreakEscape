# W2 lines: Carrholme Services (P-KC)

Kit `AW/office_kits/carrholme_services.json`; stub ink `scenarios/_office_kit/ink/yusuf_demir_ambient.ink`.

Carrholme has one kit colleague, Yusuf Demir, who appears alone in ca11 (observed; PLAN 8.3). No pool (D12 exemption: `_maybePair` needs two drinkers at a capacity-2 source and there is never a second), so no pool or chatter lines. Yusuf's lines: one shared `start` hello, and the ca11 episode stub branching on `kit_key_caught`.

| id | file:line | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca-I1 | scenarios/_office_kit/ink/yusuf_demir_ambient.ink:9 | Yusuf Demir | Alnilam | Morning. I'm Yusuf, I keep an eye on security here. Grab a water if you need one. | shared-start | voiced | |
| ca11-S1c | scenarios/_office_kit/ink/yusuf_demir_ambient.ink:14 | Yusuf Demir | Alnilam | Good catch on that export bound for the wrong inbox. A checked recipient keeps residents' details inside the building. | stub | voiced | catch |
| ca11-S1m | scenarios/_office_kit/ink/yusuf_demir_ambient.ink:16 | Yusuf Demir | Alnilam | Handovers go out fast when it's busy. One wrong recipient and resident details land where they shouldn't. | stub | voiced | miss |

## Counts against budget (4.1)

| kind | budget | written |
|---|---|---|
| shared (start) | 1 | 1 (ca-I1) |
| stub (ca11) | 1 | 1 (ca11-S1, 2 clips: catch + miss) |
| pool | 0 (exempt, D12) | 0 |
| **total lines** | **2** | **2** |

Clips: 3 (1 start + 2 stub). The 5 unspent shared lines (D12, KC budget) are not moved to another package.

Word counts: ca-I1 17; ca11-S1c 20; ca11-S1m 18. All at or under the 30-word cap.

## npc-dialog-review (section 2l, P1-P13), opus48 self-review

- Mannerism note: Yusuf — steady, practical security lead; no stated verbosity, so the full concision check applies.
- P1 (three short sentences saying one thing): none. ca-I1's three clauses carry three points (greeting, who he is, the water offer); the stub lines are two sentences each, a reaction plus the habit/cost.
- P9 (choppy stubs), P10 (announcing), P11 (padding tail): none.
- P12 (telling the player what they did): ca11-S1c acknowledges the catch but adds the consequence ("keeps residents' details inside the building"), so it is kept under the P12 exception, not cut.
- P13 (written punctuation): none; no semicolons, colons or dashes in any spoken line. No `{var}` in any voiced line.
- Content rules: no reusable method; no blame; no line says who let the incident in; the less-secure framing (ca11-S1m) carries the real reason people slip ("when it's busy"). UK English.

Verdict: 0 blockers, 0 majors, 0 minors. Commit: see HANDOVER_w2_carrholme.md.

Voicing (O2) waits for the whole-batch dialogue review and the owner's yes via AC0.
