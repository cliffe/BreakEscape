# Mole Seeding + Multi-NPC Briefings — Plan

**Created:** 2026-08-31
**Goal:** So the player does not meet the m08 mole (Agent 0x47 "Nightshade") cold,
seed him — alongside the two familiar SAFETYNET faces, **Agent HaX** and
**Director Magnus Netherton** — into the briefings/debriefs of missions 3–6 as a
trusted technical colleague. He "chips in on technical matters" in-scene. When he
turns in m08, the betrayal then lands on someone the player has actually worked
beside.

This requires **multiple NPCs speaking in one ink conversation**, which no shipped
mission currently does. This document records the engine verification and the
incorporation plan.

---

## 1. Engine verification (done)

Reference: `scenarios/ink/test-line-prefix.ink` (the format spec).

**What works today:**
- **Speaker text + name label + portrait** switch per line via the
  `Speaker: text` line-prefix format. `person-chat-minigame.js:parseDialogueLine`
  parses the prefix and `normalizeSpeakerId` resolves it against
  `buildCharacterIndex()` (`:106`), which returns:
  - `window.characterRegistry.getAllCharacters()` — **every NPC registered in the
    loaded scenario** (registered via `npcManager.registerNPC` →
    `character-registry.js`), plus the player; or
  - fallback: player + main NPC + **all NPCs in the trigger NPC's room** + legacy
    root NPCs.
- `Narrator: …` and `Narrator[character]: …` (narrator voice, optional character
  portrait) both work.
- **Implication:** any co-speaker only needs to be **defined as an NPC in the same
  scenario** (a hidden person NPC in the briefing room is simplest) for its prefix
  to resolve. No new schema field is required.

**What does NOT work today — the one gap:**
- **TTS voice does not follow the speaker.** `person-chat-minigame.js:1274`:
  `const ttsSpeakerId = block.isNarrator ? 'narrator' : this.npcId;`
  Every non-narrator line is voiced in the **triggering** NPC's voice. Portraits
  and names switch; the spoken voice does not. A three-hander briefing would show
  the right faces but read all lines in one voice.

### 1a. Required engine change (small, guarded)
`public/break_escape/js/minigames/person-chat/person-chat-minigame.js` ~:1274 —
resolve the TTS speaker from the parsed block, falling back to the trigger NPC so
nothing regresses:

```js
const ttsSpeakerId = block.isNarrator
  ? 'narrator'
  : (block.speaker && block.speaker !== 'player' && this.characters[block.speaker]?.voice
      ? block.speaker
      : this.npcId);
```

- Server `ApiClient.getTTS(npcId, text)` already resolves voice by id and caches
  per `(npcId, text)`, so per-speaker voices "just work" once co-speakers carry a
  `voice` block.
- The guard (`this.characters[block.speaker]?.voice`) means a prefix that resolves
  to an NPC **without** a voice, or to the player, still uses the old path — no
  silent 404s, no regression for existing single-NPC scenarios.
- **Also preload:** the next-line preload on the following lines currently uses
  `this.npcId`; update it to the same resolved id so preloading stays warm.
- Validate against `m01`/`m02`/`m07` (all single-NPC) — behaviour must be
  identical there (the guard guarantees it).

**Recommendation:** apply this guarded fix once, up front. It unlocks multi-voice
for the whole game, not just these seeds, and cannot regress single-NPC
conversations.

---

## 2. Authoring pattern for a multi-NPC briefing/debrief

For each seeded scene:

1. **Co-present NPCs as hidden persons in the briefing room.** In the scenario's
   `startRoom` (or wherever the existing briefing plays), add:
   - **Director Magnus Netherton** — `male_spy`, voice Charon (reuse m07/m08 block).
   - **Agent HaX** — `female_hacker_hood`, voice Aoede (reuse). May be the phone
     handler she already is; for a co-present briefing she also needs a person
     entry, or use `Narrator[agent_0x99]:`/phone hybrid.
   - **Agent 0x47 "Nightshade"** — **`male_scientist`**, a new hidden person NPC,
     voice Charon-family but distinct (e.g. `Enceladus`), style: calm, precise,
     technically fluent, *trusted colleague* — no menace yet. This is the
     seed: he is helpful and liked.
   All three `behavior: { initiallyHidden: true }`, revealed by the cutscene
   `eventMappings`/`timedConversation` that already drives that mission's briefing.
2. **One ink file, line-prefix format**, e.g.:
   ```
   Director Magnus Netherton: The target is a signing-key vault. HaX, threat picture.
   Agent HaX: Thin. One hardened host, but their cert pipeline is a mess.
   Agent 0x47 'Nightshade': If the pipeline signs on a timer, you don't need the key — you need to be holding the socket when it fires. I can pull you the cron. Give me an hour.
   Director Magnus Netherton: Do it. 0x00 — you move when Nightshade's window opens.
   ```
   Nightshade contributes **operationally useful** technical insight, so the player
   comes to rely on him. That reliance is the payload.
3. **Voice blocks** on all three NPCs (required for the engine fix to voice them).
4. **Keep it spoiler-free.** Nightshade is never suspicious in m03–m06. No line
   hints at the betrayal. The only "seed" is familiarity + competence.
5. **KO/robustness:** these are cutscene NPCs; keep them hidden and carrying no
   required task or gating global, exactly like the m07 `opening_briefing_cutscene`.

---

## 3. Per-mission work (inspect each mission's existing bookends first)

For each of m03–m06: read the current opening/closing NPC + ink, then integrate
(do **not** duplicate an existing briefing). Rough shape:

| Mission | Where to seed | Nightshade's technical beat (example) |
|---|---|---|
| m03_ghost_in_the_machine | opening brief | reads the ransomware's crypto, flags the backup-key angle |
| m04 (verify dir name) | opening or debrief | comments on the exploit chain / forensics |
| m05_insider_threat | opening brief | ironic: the insider-threat specialist briefs on insider threats |
| m06_follow_the_money | debrief | traces the crypto-laundering hop the player just made |

**m05 is the strongest seed** — Nightshade briefing the player on *how to catch an
insider* is exactly the dramatic-irony hook that pays off in m08. Prioritise it.

**Already seeded, no change:**
- **m07 → m08 seam:** m07's closing carries the mole intercept ("the leak was the
  agent") and Netherton's vow "we find out who has been reading." m08 opens on it.
- **m02:** the "Asset #47" insider thread.

**Hard rule:** never name Nightshade as the mole, nor the Insider Threat Initiative
/ Deep State cell, in any pre-m08 mission. The m08 reveal depends on it.

---

## 4. Sequencing / increments

1. **Apply the guarded TTS fix** (§1a) + regression-check m01/m02/m07 voice.
2. **Build one demonstrator** — recommend **m05** (opening brief, three-hander) —
   compile, `loopcheck`, `validate`, and playtest that portraits + voices switch.
3. Roll out to m03, m04, m06 using the demonstrator as the template.
4. Re-run `npc-dialog-review` on each edited mission (they are shipped content).
5. Add the `male_scientist` Nightshade + voices to the **m08** cast note so the
   character's look/voice stays consistent across all appearances (m08 currently
   uses `male_hacker_hood_down` for him — decide whether to switch m08 to
   `male_scientist` for consistency, or keep the hood for the "unmasked" look and
   use `male_scientist` only for the trusted-colleague seed scenes).

---

## 5. Open decisions for the user
1. **Apply the engine TTS fix?** (Recommended — small, guarded, game-wide benefit.)
   Without it, seeded briefings show correct faces but one voice.
2. **Nightshade's sprite across appearances:** `male_scientist` everywhere (trusted
   colleague look, consistent), or `male_scientist` for m03–m06 seeds and keep m08's
   `male_hacker_hood_down` for the unmasked confrontation?
3. **HaX co-present as a person in briefings**, or keep her as the phone handler and
   have her "chip in" via `Narrator[agent_0x99]:` / a phone patch? (Person entry is
   cleaner for a room briefing.)
4. **Scope:** all four of m03–m06, or start with m05 (+ m03) and assess?

---

# Execution log — 2026-08-31 (built + validated)

**Decisions (user):** apply engine fix; `male_scientist` for Nightshade everywhere
(incl. m08 switched from `male_hacker_hood_down`); seed m02–m06.

**Engine fix — DONE.** `person-chat-minigame.js` per-speaker TTS: `ttsSpeakerId`
now resolves from `block.speaker` when it maps to a registered NPC with a `voice`,
else falls back to the trigger NPC (guard prevents any regression). Preload updated
to match. m01/m07 openings only ever resolve to their own NPC/player/narrator, so
their voice path is unchanged.

**Seed NPCs** added to m02–m06 as hidden `person` NPCs (no task, no gating global,
never revealed in-world — registry-only so their line prefixes resolve to portrait
+ voice): `director_netherton` (`male_spy`, voice Charon) and `agent_nightshade`
(`male_scientist`, voice Enceladus). Nightshade is a **trusted colleague** in every
seed — no tell.

| Mission | What was added |
|---|---|
| m02 | Opening: Netherton short intro → hands to HaX. Debrief: new `[The PIN-cracker…]` hub topic → **Nightshade analyses the recovered ENTROPY keypad oracle** (gated `pin_cracker_found`), flags the ENTROPY supply chain. |
| m03 | Opening: three-hander (Netherton stakes → Nightshade "I'll take it apart" → HaX detail); Nightshade technical beat on the RFID clone. |
| m04 | Opening: Netherton + Nightshade (PLC/interlock stakes) → HaX. |
| m05 | Opening: Netherton brings Nightshade in as the **insider-threat specialist**; Nightshade explains *how you catch a mole* — broad access, odd hours, the calm of someone who's decided the rules don't apply. Dramatic irony: it's his own eventual tell, with no overt clue. |
| m06 | Opening: Netherton + Nightshade (money-as-protocol trace) → HaX. |

All five missions: ink compiles, scenario validates zero-error, edited openings/
debrief pass `loopcheck`, no unresolved-speaker warnings. m08 Nightshade sprites
switched to `male_scientist` (player sprite untouched).

**Spoiler discipline held:** no pre-m08 mission names the mole, the Insider Threat
Initiative, or the Deep State cell. The m05 line is the strongest seed and is pure
dramatic irony — it only chills on replay.

**Not done (optional follow-up):** m04/m06 debrief beats (only openings seeded there);
`npc-dialog-review` polish pass on the five edited missions; playtest that portraits
+ per-speaker voices switch live in a running build.
