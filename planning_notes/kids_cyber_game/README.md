# Kids cyber security game (working title to decide)

A new kind of Break Escape game: a cyber safety game for children, built on the same engine, the same minigame framework and much of the thinking already done for the awareness course. This directory holds the pitch, not a build.

**Status (October 2026):** idea and pitch only. Nothing here is decided or built. The point of these notes is to show what a children's game could be, how cheaply it could reuse what Break Escape already has, and the questions a stakeholder needs to answer before it goes further.

## What is in here

| File | What it covers |
|---|---|
| `00_VISION_AND_SAFEGUARDING.md` | Who it is for, the learning spine, the one habit it teaches, and the safeguarding and data-protection rules that must come first for anything aimed at children |
| `01_CONCEPT_PITCHES.md` | Five named concepts (including "Crypto Cat" and "Hacker Kids"), each with its hook, world, sample levels, why a child would play it, and what it leans on from the engine |
| `02_REUSE_MAP.md` | Exactly which Break Escape engine features, minigames and awareness-course plans can be reused as-is, adapted, or must be left out for a child audience |

## The one-paragraph version

Children already live online younger than any workplace joiner, and the habits that protect them (strong passwords, not sharing private things, telling a trusted adult when something feels wrong) are the same habits the awareness course teaches adults, only re-dressed for a world of games, group chats, videos and homework tablets. Break Escape can tell that story: it already has rooms, characters, conversations with voice and transcripts, a minigame framework, assessed decisions and a debrief, a text and audio route for accessibility, and a growing library of security minigames (an inbox, a password builder, a sharing-settings panel, a spot-the-risk mode). A children's game reuses that machinery, swaps the office for a home, a school and a game world, swaps the mentor for a friendly guide, and swaps workplace compliance for the UK curriculum's online-safety strands. The hardest part is not the game; it is getting the safeguarding and children's data protection right, so that comes first.

## Naming: a recommendation up front

The brief suggested "Crypto Cat" and "Hacker Kids". Both are usable, but both carry a risk worth naming now (see `01_CONCEPT_PITCHES.md` for the full discussion):

- **"Crypto Cat"** reads in 2026 as cryptocurrency to many adults (parents and teachers are the buyers), and there is an existing educational "Crypto Cat" and the unrelated "Cryptocat" chat app, so a trademark and search check is essential.
- **"Hacker Kids"** frames children as attackers. For a safety game we want them as defenders and good online citizens, and some schools and parents will balk at "hacker" in the title.

**Recommendation:** keep both as internal working names while pitching, but lead with a defender framing for the product name. The plan uses **"the kids game"** until a name is chosen, and offers alternatives (SafeSquad, Byte-Size Heroes, Cyber Cubs, Guardians) in the pitches.

## How this relates to the rest of the repo

- It is a **fifth kind of Break Escape game**, alongside the SAFETYNET spy campaign, the Security-Informed Safety games, the Hacktivity technical labs, and the awareness course (`AGENTS.md`, "Break Escape hosts more than one kind of game"). Settle the kind and its aim before tasking any writer, as that file says.
- It reuses the engine and minigame work catalogued in `../security_awareness_course/features/`.
- It reuses the learning design in `../security_awareness_course/01_LEARNING_DESIGN.md`, re-pitched for children.
