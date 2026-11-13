# The Tesseract Trials: shared brief

Every subagent on this scenario reads this file first. The orchestrator owns it. Decisions log: `scenarios/lab_tesseract_trials/DECISIONS_LOG.md`.

## What we're building

A new standalone side mission, `scenarios/lab_tesseract_trials/`, an intro lab on encoding and encryption. It replaces nothing: the VM-based `scenarios/lab_encoding_encryption/` stays as it is.

**Kind of game:** a lab scenario with the SAFETYNET spy framing. Aim: a fun, short escape-room mission (about 45–60 minutes for a first-year student) where every lock is opened by decoding or decrypting something in CyberChef, with HaX's field notes doing the teaching. Dialogue should feel like the campaign (TV spy thriller, sharp exchanges, characters with agendas), but lighter and shorter. No VMs, no combat (`"disableAttacks": true`).

Source lab sheet (content to cover, not to copy): `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/cyber_security_landscape/4_encoding_encryption.md`. Its known errors (do not repeat them): Base64 alphabet "a-Z", DES keyspace "256" (it is 2^56), "as with asymmetric keys" (means symmetric).

## Story (user-approved)

- **Setting:** Miskatonic University UK.
- **Premise (revised 2026-10-06):** ENTROPY's **Ransomware Incorporated** (front: CryptoSecure Recovery; the cell that weaponises encryption) is talent-spotting students through a funded studentship, with a trail of recruitment puzzles ("the Trials") around campus. The working title "Tesseract Trials" is retired from the fiction: **Dr Adrian Tesseract is existing canon** (SAFETYNET's former chief strategist, suspected to be The Architect; `scenarios/m06_follow_the_money/ink/m06_closing_debrief.ink:407`, m07), so nothing in this scenario may be called Tesseract. The folder name stays. **Agent HaX** sends Agent 0x00 undercover as a first-year student to get recruited as a double agent. Real students play a student: lean into that.
- **HaX** actively helps: field notes on each scheme (what it is, how to recognise it, the CyberChef recipe, and the equivalent command-line command for later), and hints that escalate when the player is stuck. Field notes follow `docs/FIELD_GUIDE_style_guide.md` where it fits.
- **The recruiter is Ghost** (existing canon: Ransomware Inc. cell leader, pronoun "they", m02). Ghost never appears in person: they make the offer **on screen**, through a terminal-themed phone NPC on a device, the way m02 does it (`scenarios/m02_ransomed_trust/ink/m02_phone_ghost.ink`; NPC `ghost` in `scenarios/m02_ransomed_trust/scenario.json.erb:1256`, hoodie talk sprite `male_hacker_hood_talk.png`, voice Iapetus). Keep Ghost's voice consistent with m02: precise, unhurried, uses numbers as weapons. Set the mission **after m02**: Ghost recognises 0x00 from St Catherine's, which is how they know SAFETYNET sent you. Make sure nothing contradicts m02/m03 canon about Ghost.
- **Climax (approved):** Ghost says you passed, and that they know SAFETYNET sent you and want you anyway, as their double agent inside SAFETYNET. They hand you a signed, hashed, Base64 "report" to send HaX. Decoding it shows a beacon request for HaX's location. Because it's signed, you can't quietly alter it. Three endings: send it (betray HaX), refuse (cover blown, Ghost withdraws), or warn HaX out of band so SAFETYNET can feed it false data (true double agent; sequel hook).

### Real academics as characters (all user-approved)

Write accents through word choice and rhythm, never phonetic spelling. Keep both helpers clearly on the player's side.

- **Dr Z. Cliffe Schreuders:** Australian. He builds learning tools, Hacktivity and CTFs, and is hard to pin down. He is a **leader / story NPC, not a helper**. He appears in person, busy building something (the user leaves what it is to us; make it intriguing). He knows the player is an agent and doesn't say how or why. Possible links to SAFETYNET or ENTROPY are left open. HaX on him: "That's classified." He is present at the climax.
- **Dr Tom Shaw:** Huddersfield accent, helpful, "keen interest in practical hacking challenges and software development". He helps with a piece of the puzzle and gives the player something physical, ideally the CyberChef workstation (a takeable `workstation` item, see `scenarios/crypto4_encoding_encryption/scenario.json.erb`).
- **Dr Sidhu Selvarajan:** Indian accent, helpful. Certified Hyperledger expert and blockchain developer. Research: cyber security, blockchain, critical infrastructure, network security, ethical hacking. He's an active researcher, reviewer and editor. He fits hashing, integrity and signatures.

## Assumed knowledge: none (user, 2026-10-06)

Don't assume the player knows the basics. The game teaches them from scratch: what a bit and a byte are, how 0s and 1s can represent numbers and text, number bases (binary, decimal, hex), what a character encoding is, and ASCII. The first room(s) must build this up before any decoding is asked for, through field notes, things in the room (for example an ASCII chart, a light-switch panel or a punched tape), and Tom or HaX explaining it in plain words. Later schemes build on it explicitly: hex as a shorthand for 4 bits, Base64 as 6-bit groups, and so on. Teach through objects and short notes, not lectures.

## Hard constraints (user)

1. **Every scheme must be solvable in CyberChef** (bundled at `public/break_escape/assets/cyberchef/CyberChef_v10.19.4.html`, opened from the crypto workstation, `public/break_escape/js/utils/crypto-workstation.js`). Verify each operation exists in that version. Candidates: From Charcode/Decimal, From Hex, From Binary, From Base64, ROT13 (with amount) for Caesar, Vigenère Decode, AES Decrypt (explicit key and IV in hex, not `openssl enc` salted output), SHA2, PGP or RSA encrypt/decrypt/sign/verify, iconv-style text encodings (EBCDIC via Decode text).
2. **No quizzes**, and no graded dialogue questions on lab content.
3. **No new engine functionality.** Decoded messages become PINs, passwords, key codes and the like on existing lock types. Notes, phone messages, NPC item giving, containers and password/PIN locks are all available. If a new minigame really earns its place, it must be fully specified (inputs, UI, win condition, data format) and goes to the user for approval before anyone builds it.
4. **Per-player variety where cheap:** the ERB renders once per game (`scenarios/sis01_healthcare/scenario.json.erb:124` uses `rand`), so secrets can be picked from word lists and encoded in Ruby. Lock answers (`requires`) and locked containers' contents are stripped from the client (`app/models/break_escape/game.rb:1862`).
5. CyberChef's Magic will auto-solve simple encodings. That's fine for the early rooms; later rooms need steps Magic won't do alone, such as a key from elsewhere, layers, or picking the right copy.

## Rules every agent follows

- Read `AGENTS.md`, `README_scenario_design.md`, `README_ink_best_practices.md`, `tools/pass2/PASS2_LESSONS.md`.
- The handler's id is `agent_0x99` (display name Agent HaX / Haxolottle; check m01/m02 for how HaX is wired).
- UK English, plain writing, no AI-sounding filler. Spell it "Cyber Security".
- Edit only `scenarios/lab_tesseract_trials/` and the doc you're told to write. Don't touch other scenarios, the engine, `.claude/skills/*` or other repos. If you need an engine change, stop and report it. Don't commit.
- Write long documents section by section with Edit.
- **No image generation.** Use existing sprites and portraits as placeholders and list the art needed in `ART_NEEDED.md`.
- Draft playtests use the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`, `PLAYTEST_PORT=3001`). Never stop the user's server on :3000.
- Scratch space: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/<your-role>/`.
