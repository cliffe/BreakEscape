# m06 Follow the Money: 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Ending:** Satoshi, "Murder's what they call it when you lose. The winners get statues." (existing). The route to it has to be filmed cleanly.
- **Hook:** Netherton, as in the table.
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

Planning only (2026-11-22). Model: `M03_TRAILER60_V3_PLAN.md`. Recipe: `docs/video/recipes/mission-trailer.md`. Not yet checked: which of these lines are cached (the scout checks), the exact entry flags for each take, and Kemal's and the guard's walk lines.

## 1. Story

ENTROPY's cells all get paid from one place. You walk into HashChain Exchange after hours as an FCA supervisor, past a checkpoint guard, onto a trading floor that never sleeps. Irina Volkova built the mixer that washes the money and is starting to hate what it pays for. Priya has drawn the pattern without knowing what it is. You crack the backend, trace three ENTROPY deposits through the mixer to one cold wallet, and climb to the executive wing, where Satoshi's minder blocks the door and Satoshi waits, unrepentant.

## 2. Threat

HashChain is "the bank for every ENTROPY cell we know" (`ink/m06_opening_briefing.ink:80`). Ransom money from hospitals, exploit sales and disinformation contracts go in, and a fund pays the cells for their next operations. The clock: "The wallets we watch have gone quiet, the way they do before a big payout." (`:147`); the fund "goes out on its own in 72 hours" (`scenario.json.erb:119`, fund document). Satoshi's pitch is the menace: "Whoever controls the money controls the people. We'd like nobody to." (`ink/m06_satoshi_confrontation.ink:202`).

## 3. New mechanics

Compared against m01 to m05 (lockType, object types, interaction types, keys in each scenario.json.erb):

- **Settlement Tracer** (the blockchain explorer minigame, mode `mixer_match`): `scenario.json.erb:93-117` (board), `:2413-2414` (`interactionType: "blockchain_explorer"` on `transaction_server` in the data centre). No earlier mission uses `blockchain_explorer` or `mixer_match`. Engine: `public/break_escape/js/minigames/blockchain-explorer/`. **Gets the card.** It is the mission's title puzzle.
- **Desk-phone decoy** (office-life lever): `lerato_phone` with `deskPhone: true` (`:2187`), the spare phone that rings it (`:2195-2202`, `emit_event desk_phone_ring:lerato_phone`), Tomasz `answersPhones` (`:2094`) and her `phone_message` lines (`:2077`). First in the campaign. A short beat, no card of its own unless the user wants two mechanic cards.
- **Pizza bait** (droppable magnet): `pizza` in the blockchain lab, `droppable`, `magnet: { tempt 60, servings 2 }` (`:2586-2598`). First in the campaign. Crescendo flash.
- Not new: RFID cloning, biometric/fingerprint kit, lockpick, PIN and password doors, motion-sensor lights, sight-challenge guards, hostility (m01 to m05 all have them).

## 4. Music

Not used by m01 to m03 (README table). Analyse later with `analyse_music.py`.

1. SpyAction "Midnight Double Agent" (`SpyAction/Midnight Double Agent.mp3`): the title fits Irina and the cover, and m06 plays spy-action at its climax (`scenario.json.erb:179`).
2. Noir "Shadowline Protocol" (`Noir/Shadowline Protocol.mp3`): analysed as an m02 alternative (124 BPM); m06's main in-game set is noir.
3. SpyAgro "Shadow Cipher" (`SpyAgro/Shadow Cipher.mp3`).

m04 and m05 have no track yet; whoever picks for them should check this list first.

## 5. Beat sheet (middle 46 s between the presets)

Day and night: the whole mission is one night (guard "Evening.", Netherton "Tonight we chase the money", `LIGHTING_PLAN.md` section 1). No day shots, so no grouping problem; keep the lights strike as the turn into the machine rooms.

| # | Section | Shot | Entry state | Line (speaker), audio: check |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | Netherton in the briefing | fresh game, opening cutscene | "Every cell we have hit is being paid by someone. Tonight we chase the money." (Netherton, `opening_briefing.ink:30`, cut before "HaX."), audio: check. Fallback: "Somebody is keeping the books for all of them." (HaX, `:71`), audio: check |
| 2 | Card | `Mission 6 / Follow the / Money` | | |
| 3 | Threat | HaX portrait | same briefing take, "Which exchange?" route | "HashChain Exchange. A trading platform on paper. In practice, the bank for every ENTROPY cell we know." (HaX, `:80`, cut before "The Crypto Anarchists run it."), audio: check |
| 4 | Way in | straight walk across the checkpoint to the guard, his line | `briefing_played`; reception_lobby to security_checkpoint | "Evening. Floor's restricted. Who are you?" (Checkpoint Guard, `checkpoint_guard.ink:49`), audio: check |
| 5 | The floor | Irina at the trading floor, portrait | trading_floor unlocked (`guard_waved_through` or `--unlock trading_floor`), first talk | "Satoshi is paranoid about doors and careless about passwords. Exactly backwards." (Irina, `irina_volkova.ink:329`, badge question), audio: check |
| 6 | Setup | Priya at her graph wall | blockchain_lab | "You can't see through Monero. You don't need to. Watch what goes in and what comes out." (Priya, `npc_analyst.ink:382`), audio: check |
| 7 | Card | `Blockchain / Tracing` (new mechanic) | | |
| 8 | Tracer, about 3.5 s | open the Settlement Tracer on `transaction_server`, drag one deposit to a credit, the match lights; cut before the completion text | data_center unlocked (`--unlock server_room --unlock data_center`) | none |
| 9 | Card | `Real / Hacking` | | |
| 10 | Hacking | lights strike in the server room (motion, `:2237`), straight walk to the lab workstation, console clip (password cracking, the analytics service; planned elsewhere) | server_room unlocked | none |
| 11 | Card | `Desk Phone / Decoy` (optional second mechanic card; else fold into #12 under the next card) | | |
| 12 | Lever, about 3 s | pick up the spare phone, Lerato's desk phone rings, she answers, Tomasz's laptop is left open | trading_floor, extras at post (needs need the floor rooms unlocked, see `office_life/HANDOVER.md`) | none (ring sound) |
| 13 | Card | `Get Past / the Minder` | | |
| 14 | Action | straight walk up the executive wing, Kemal steps into the path; picks at Satoshi's door, "No."; Kemal pockets his watch, then comes for the player | executive_wing unlocked (`--unlock executive_wing`), `found_architects_fund` false, cover not strained; route "Then step aside, or I'll move you." | "The FCA does not come up here." (`npc_minder.ink:115`), then "Then come and move me." (`:180`), Kemal, audio: check. Needs an angry read |
| 15 | Card | `Before the / Money Moves` | | |
| 16 | Crescendo | every minigame, accelerating: RFID read of Irina's badge, fingerprint kit, biometric pad, lockpick, password door, keypad (3 digits not in 3110/2140/4471), custody console pad, briefcase, phone chat, flag station, the tracer board again, safe (no digits); flashes for Dani, Tomasz, Lerato, Nightshade; pizza box dropped and staff drifting to it | as the montage takes | none (Satoshi J-cuts in under the last second) |
| 17 | Villain | Satoshi in his office: wide, then 3x close | `satoshi_office`; see Ending for the route | ending line |

Cut from this cut: Dani's lines (she becomes a flash), Irina's turn (a choice), the fund document (casualty figures).

## 6. Cards

| Card | Lines |
|---|---|
| Mission | `Mission 6` / `Follow the` / `Money` |
| New mechanic | `Blockchain` / `Tracing` |
| USP | `Real` / `Hacking` |
| Second mechanic (optional) | `Desk Phone` / `Decoy` |
| Action | `Get Past` / `the Minder` |
| Stakes | `Before the` / `Money Moves` |

Spares: `Bank of` / `ENTROPY`; `Follow` / `Every Hop` (Nightshade's "Follow enough hops", `opening_briefing.ink:32`).

## 7. Ending (ranked)

1. "Murder's what they call it when you lose. The winners get statues." (Satoshi, `satoshi_confrontation.ink:566`). The best menace in the mission, 2 sentences with a gap to cut on. Route passes the asset choice and the arrest (`final_words`, choice "No. Your ideology doesn't cover murder."): film only the line, never the menus, and frame the close so the held-out wrists do not show.
2. "Whoever controls the money controls the people. We'd like nobody to." (`:202`). Mid-confrontation, no outcome near it, cheapest route (`evidence_reveal` then any choice). Safest fallback.
3. "Nobody says that name in this building." (`:125`, after the narrator's "he stops smiling"). Strong close-up, but it needs `found_architects_fund` and points at the codename reveal.

## 8. Spoiler notes

- Codes: the safe 2140 (Irina says it, `irina_volkova.ink:582`: never film that line), the data-centre PIN 3110, the server-room passphrase (hodl convention), the custody slot 4471. The tracer's completion text names the slot: cut before it. The settlement log, custody index and Irina's slot lines (`:578-579`, `:652`) stay off.
- Flag values and the fund document (casualty figures 350-600; also Satoshi's `:165` line and Kemal's `:167` line).
- Choice screens: Satoshi's freeze-or-watch, Irina's fate, Kemal's options, the final-words menu.
- The debrief and the credits.
- Fine to show: Satoshi's face and name, HashChain as ENTROPY's bank, Irina's doubt, the minder fight.

## 9. Risks

- **Tracer take** needs the data centre open and a clean drag on the board; the match state and the completion text may sit close together. Check frames for the slot number on every frame.
- **Desk-phone lever** depends on office-life needs running (`needs.state` is null unless the floor rooms are unlocked, `office_life/HANDOVER.md:31`) and on Lerato being at her post; the answer comes about 2.8 s after the ring (`LIVE_FIX_R1.md:11`). Throttle FPS as the memory notes say. The laptop window opens only after a trip longer than 22 s.
- **Kemal**: sight challenge and the lockpick catch (`on_lockpick_seen`) must fire in one take; hostility and the chase need the combat system. His line needs an angry read: ask for a re-voice if flat.
- **Satoshi ending** route runs through the asset choice; the take must set `found_architects_fund` and `found_wallet_keys` or go the monitor route. Lip-sync on a seated or leaning pose untested.
- **Lights strike**: the server room is motion mode, but HaX's timed texts or toasts may land on the same frames.
- Real hacking footage is planned elsewhere; the slot is a placeholder until then.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. m06's existing endings are already strong, so these are cheaper-route alternatives, not repairs. Satoshi talks like a dry financier, so both lines keep to money.

**Ending**

1. **Pick.** Satoshi Nakamoto II: "Take me in if you like. The money already knows where it's going." (13 words, about 4 s)
   - Insertion: `ink/m06_satoshi_confrontation.ink`, knot `philosophy_challenge`, **added** between `:256` ("You won't agree. You work for the people who'd lose the most if I'm right.") and "So. You've found the network. What are you going to do with it?". It says "take me in", not "arrest", because SAFETYNET cannot arrest.
   - `#delivery: relaxed, a little amused, entirely sure`
   - State: `evidence_reveal` > `Need it most? They're terrorists.` > `You're a criminal with a manifesto.` > `criminal_accusation` > here. No asset choice or arrest on the way, so no wrists or menus are in shot.
   - Why: it carries the fund's own clock (it "goes out on its own in 72 hours") as a threat to the player, on a cheaper route than the current #1, with no casualty word.
2. Satoshi Nakamoto II: "Every ransom, every blackout, every riot. It all clears through my signature." (12 words, about 4 s)
   - Insertion: `ink/m06_satoshi_confrontation.ink`, knot `evidence_reveal`, **added** after `:144` ("Sure. HashChain is ENTROPY's bank. Every cell."), before "You'd call it laundering. I call it financial freedom for people who need it most."
   - `#delivery: easy, almost proud, a banker reading out his book`
   - State: the cheapest one. The opening, then `evidence_reveal`.
   - Why: it names what the money buys in three concrete words. A viewer with no context gets the threat at once.

Still the strongest line, if its route can be filmed cleanly: "Murder's what they call it when you lose. The winners get statues." (`:566`). Also in the ink, and short: "The Architect calls them lessons. I just pay the invoices." (`:192`, `calculated_cruelty`).

**Hook:** Netherton's "Every cell we have hit is being paid by someone. Tonight we chase the money." is not weak. No new hook.
