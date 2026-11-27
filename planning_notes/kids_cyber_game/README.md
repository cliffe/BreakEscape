# Kids cyber security game (working title to decide)

A new kind of Break Escape game: a cyber safety game for children, built on the same engine, the same minigame framework and much of the thinking already done for the awareness course. This directory holds the pitch, not a build.

**Status (October 2026):** idea and pitch only. Nothing here is decided or built. The point of these notes is to show what a children's game could be, how cheaply it could reuse what Break Escape already has, and the questions a stakeholder needs to answer before it goes further.

**Updated 2026-10-27, after main built an awareness product.** Main now has "Incident Simulations: Critical Cases", an adult awareness product with an episode runner, an inbox-triage sorter, a kind debrief and privacy-minded measurement. These notes now build on it: the kids game would be a **defend-only sibling** of that product, sharing the runner, the triage and the measurement, and leaving out every attacker tool. The safeguarding rules are unchanged.

## What is in here

| File | What it covers |
|---|---|
| `00_VISION_AND_SAFEGUARDING.md` | Who it is for, the learning spine, the one habit it teaches, and the safeguarding and data-protection rules that must come first for anything aimed at children |
| `01_CONCEPT_PITCHES.md` | Five named concepts (including "Crypto Cat" and "Hacker Kids"), each with its hook, world, sample levels, why a child would play it, and what it leans on from the engine |
| `02_REUSE_MAP.md` | What is already built on main and what the kids game can take from it (section 0), then which engine features, minigames and awareness-course plans can be reused as-is, adapted, or must be left out for a child audience, with build status |

## The one-paragraph version

Children already live online younger than any workplace joiner, and the habits that protect them (strong passwords, not sharing private things, telling a trusted adult when something feels wrong) are the same habits the awareness course teaches adults, only re-dressed for a world of games, group chats, videos and homework tablets. Break Escape can tell that story: it already has rooms, characters, conversations with text-to-speech voices, a minigame framework and, from the awareness product, an episode runner, a sorter for messages, calls, pages and QR codes, a report button that is never penalised, a kind debrief with a no-blame line, and before-and-after checks whose records hold no free text and no identity. The password builder, sharing settings, spot-the-risk mode and a text route are still planned, not built. A children's game reuses that machinery in its defend-only shape (brief, defend, debrief), swaps the training room for a den with a friendly guide mascot as the host, swaps the adult rule of thumb for "Stop. Think. Check with a grown-up you trust.", and swaps workplace compliance for the UK curriculum's online-safety strands. The hardest part is not the game; it is getting the safeguarding and children's data protection right, so that comes first.

## Naming: a recommendation up front

The brief suggested "Crypto Cat" and "Hacker Kids". Both are usable, but both carry a risk worth naming now (see `01_CONCEPT_PITCHES.md` for the full discussion):

- **"Crypto Cat"** reads in 2026 as cryptocurrency to many adults (parents and teachers are the buyers), and there is an existing educational "Crypto Cat" and the unrelated "Cryptocat" chat app, so a trademark and search check is essential.
- **"Hacker Kids"** frames children as attackers. For a safety game we want them as defenders and good online citizens, and some schools and parents will balk at "hacker" in the title.

**Recommendation:** keep both as internal working names while pitching, but lead with a defender framing for the product name. The plan uses **"the kids game"** until a name is chosen, and offers alternatives (SafeSquad, Byte-Size Heroes, Cyber Cubs, Guardians) in the pitches.

## How this relates to the rest of the repo

- It is a **fifth kind of Break Escape game**, alongside the SAFETYNET spy campaign, the Security-Informed Safety games, the Hacktivity technical labs, and the awareness course (`AGENTS.md`, "Break Escape hosts more than one kind of game"). Settle the kind and its aim before tasking any writer, as that file says.
- It is a **defend-only sibling of "Incident Simulations: Critical Cases"**, the awareness product on main. It shares that product's episode runner, inbox-triage sorter and measurement, uses only its defend-only shape, and never uses its attack half. What is built is summarised in `../security_awareness_course/04_BUILT_SO_FAR.md`.
- It reuses the engine and minigame work catalogued in `../security_awareness_course/features/`, with the build status in `../security_awareness_course/research/current_state_social_engineering_build.md`.
- It reuses the learning design in `../security_awareness_course/01_LEARNING_DESIGN.md`, re-pitched for children.
