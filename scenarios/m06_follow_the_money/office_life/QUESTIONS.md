# m06 office life: questions for the user

The plan is written around the recommendation in each item. Answers that differ change the sections named.

## Q0. Cast picks for the two late-desk extras

From the awareness course cast (D53). The Office Life Tour cast (Chidi Okeke, Jun Watanabe, Graham Whitfield, Agnieszka Duda, Zainab Hussain) is left out on purpose.

| Pick | Character | Sprite key | Voice | m06 job | Art needed |
|---|---|---|---|---|---|
| A | Lerato Dlamini | `lerato_dlamini` | Gacrux | late-desk market operations: watches the overnight books, owns the desk phone | none (sit, use, phone, drink frames present) |
| B | Tomasz Wisniewski | `tomasz_wisniewski` | Algieba | evening settlements clerk: prints the settlement run, covers the phones, owns a laptop | none |

Options: (a) both, as planned; (b) swap one for another awareness-cast character you name; (c) one extra only (drops exchanges 2 and 3 and lever L2).

Recommendation: (a). Both atlases are complete, neither voice is used in m06, and two extras are what a capacity-2 coffee point and the phone lever need. Plan sections 2.3, 2.4.

## Q1. Readable screens: existing workstations or new screens

Options: (a) make Dani's `trading_workstation` and Priya's `blockchain_workstation` (plain `pc`s, no lock, no contents today) owned, with `habits.screen` and lore `textVariants`, plus Tomasz's laptop; (b) leave those two PCs alone and add new screens beside them; (c) only Tomasz's laptop.

Recommendation: (a). The two PCs are in no lock, clue or walkthrough step, so owning them changes nothing the lock and key diff sees, and a new screen next to an existing one adds clutter. Depends on the build check that a tile-home owner's PC follows `atPost` (plan 3.4); if it fails, the fallback is (c) for that NPC. Plan 2.4, 3.1, 3.2, 3.4.

## Q2. The pizza lever

Options: (a) the lab's leftover pizza box becomes a takeable, droppable magnet (3 servings, seen only) that tempts only the two extras; Dani and Priya have no hunger need; (b) the same, tempting Dani and Priya too; (c) a cake from somewhere else; (d) no magnet.

Recommendation: (a). A moved existing NPC may not have a need a magnet satisfies, so (b) breaks the story-safe rule. The box is already in the lab, so (c) adds an object for no gain. Plan 2.4, 3.2, 4.

## Q3. The phone lever

Options: (a) the spare phone rings Lerato's phone; with Lerato away, Tomasz crosses the floor to answer and his laptop window opens; (b) the phone rings only for the proof, no window; (c) drop it.

Recommendation: (a). It is the one lever that works through a system the player already understands (a ringing phone) and opens lore only. Plan 2.9, 4.

## Q4. Which existing NPCs move

Options: (a) Dani and Priya, coffee only, Priya may cross to the trading floor; (b) Dani only; (c) Priya stays in the lab (no coffee) and Dani moves; (d) none.

Recommendation: (a). Both are free under D78 and D84: optional tasks, no items, no background, mappings held by HaX, V2 clear. Each is found at post first by a once-only first-talk break. If the build finds a repeat-visit line in Priya's ink that places her in the lab, she falls back to (c). Plan 2.2, 2.5, 2.7.

## Q5. Knock-outs on the floor

Options: (a) a new global `floor_staff_ko`, set by HaX mappings on the KO of Dani, Priya, Irina and the two extras, switches off the floor coffee, copier and fridge for the rest of the mission; office life never touches `cover_strained`; (b) reuse `cover_strained`; (c) no trouble gate.

Recommendation: (a). `cover_strained` feeds Irina's badge trust (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi, so (b) would change the critical path. (c) leaves staff queuing for coffee beside a body. Plan 2.8.

## Q6. Do the extras talk to the player

Options: (a) a short conversation each (about six lines: greeting, one question about the night, goodbye; no task, no item); (b) no conversation, chatter and exchanges only.

Recommendation: (a). An NPC who ignores the player reads as a prop, and six lines each is a small voicing cost (included in the about 54 clips). Plan 6.
