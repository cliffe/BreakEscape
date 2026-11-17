# m06 office life: questions for the user

The plan is written around the recommendation in each item. Answers that differ change the sections named.

## Q0. Cast picks for the two late-desk extras

From the awareness course cast (D53). The Office Life Tour cast (Chidi Okeke, Jun Watanabe, Graham Whitfield, Agnieszka Duda, Zainab Hussain) is left out on purpose.

| Pick | Character | Sprite key | Voice | m06 job | Art needed |
|---|---|---|---|---|---|
| A | Lerato Dlamini | `lerato_dlamini` | Gacrux | night floor coordinator: keeps the floor running overnight (phones, rota, post, kitchen), owns the desk phone | none (sit, use, phone, drink frames present) |
| B | Tomasz Wisniewski | `tomasz_wisniewski` | Algieba | evening app-support lead: works the overnight app support queue (app tickets only, never payments or account tickets), leaves a shift handover sheet, covers the phones, owns a laptop | none |

Options: (a) both, as planned; (b) swap one for another awareness-cast character you name; (c) one extra only (drops exchanges 2 and 3 and lever L2).

Who they are in the course (`planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:92`, `:119`): Lerato is a Black South African woman in her 30s, the Tarrowby health and safety adviser; Tomasz is a Polish man in his 50s, the Carrholme data protection officer. m06 gives both a new employer and job at a crypto exchange, as m03 did for its extras. Neither voice is used in m06 (it uses Algenib, Aoede, Charon, Enceladus, Alnilam, Kore, Puck, Leda, Iapetus, Umbriel).

Spread on the late floor: Dani (Nigerian man) and Lerato would be two Black Africans; Irina and Tomasz two Eastern Europeans. Ages vary (30s to 50s). If you would rather widen the spread, option (b) with an East or South East Asian or Latin American course character is the change.

Recommendation: (a). Both atlases are complete and two extras are what a capacity-2 coffee point and the phone lever need; the spread is acceptable for a four-person late floor at a UK exchange. Plan sections 2.3, 2.4.

## Q1. Readable screens

Options: (a) one readable screen, on Tomasz's laptop (an extra, so he may own it); Dani and Priya own nothing; (b) also make Dani the owner of `trading_workstation` with a screen habit, as an exception to D78 (an owner counts as holding), with a build-time check that the PC follows him when his home is a floor tile (plan 3.4), falling back to (a); (c) no readable screen.

Recommendation: (a). It keeps D78 without an exception, and the two levers both have something to open. Plan 2.4, 3.1, 3.4, 4.

## Q2. The pizza lever

Options: (a) the lab's leftover pizza box becomes a takeable, droppable magnet (3 servings, seen only) that tempts only the two extras; Dani and Priya have no hunger need; (b) the same, tempting Dani and Priya too; (c) a cake from somewhere else; (d) no magnet.

Recommendation: (a). A moved existing NPC may not have a need a magnet satisfies, so (b) breaks the story-safe rule. The box is already in the lab, so (c) adds an object for no gain. Plan 2.4, 3.2, 4.

## Q3. The phone lever

Options: (a) the spare phone rings Lerato's phone; with Lerato away, Tomasz crosses the floor to answer and his laptop window opens; (b) the phone rings only for the proof, no window; (c) drop it.

Recommendation: (a). It is the one lever that works through a system the player already understands (a ringing phone) and opens lore only. Plan 2.9, 4.

## Q4. Which existing NPCs move

Options: (a) Dani only, coffee only, on his own floor; Priya stays in the lab with no needs; (b) Dani and Priya, with Priya's repeat-visit lines changed so they no longer place her in the lab; (c) none.

Recommendation: (a). Dani is free under D78 and D84 (optional task, no items, no background, mappings held by HaX, V2 clear) and is found at post first by a once-only first-talk break. Priya's hub re-entry lines (`ink/m06_npc_analyst.ink:124`, `:127`) and her repeatable knot (`:323`, `:347`) place her at her lab desk, and the lab has no machine, so (b) means changing existing lines for little gain. Plan 2.2, 2.5, 2.7.

## Q5. Knock-outs on the floor

Options: (a) a new global `floor_staff_ko`, set by appended HaX mappings on the KO of Dani, Irina and the two extras, switches off the floor coffee, copier and fridge for the rest of the mission; office life never touches `cover_strained`; (b) reuse `cover_strained`; (c) no trouble gate.

Recommendation: (a). `cover_strained` feeds Irina's badge trust (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi, so (b) would change the critical path; the existing loop (`erb:1459` to `:1470`) already sets it for Dani and Irina and stays as it is. (c) leaves staff queuing for coffee beside a body. Either way the extras get a credits line each on `lerato_ko` and `tomasz_ko`. Plan 2.8.

## Q6. Do the extras talk to the player

Options: (a) a short conversation each (about six lines: greeting, one question about the night, goodbye; no task, no item); (b) no conversation, chatter and exchanges only.

Recommendation: (a). An NPC who ignores the player reads as a prop, and six lines each is a small voicing cost (included in the about 60 clips). Plan 6.
