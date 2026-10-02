# m02 Ransomed Trust: pass 4 playtest script

This script covers the parts changed in the pass 4 design work (see `DESIGN_REVIEW.md` section 7). It does not replay the whole mission. Split it into three short runs of 10 to 15 minutes, each in a fresh game, and write findings into the report as you go.

## Setup

- Keyless server: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust` (run `tools/playtest/start-keyless-server.sh` first if :3001 isn't up). Never touch :3000. Silent lines (TTS 503) are expected.
- Follow `.claude/skills/playtest-scenario/SKILL.md`. Read credits from `#bv-credits-overlay` / `#bv-cr-label` while they play.
- Keep an earned-secrets table. Anything typed from `SOLUTION_GUIDE.md` (VM flags, PINs) or set from the console is "exercised, not earned".
- `tools/playtest/verify-run.rb` must show progress at the end of each run.
- Find out first whether the engine fix for "Switch to Lockpicking" (LOS gate in the key-selection minigame) is in the tree. Step 5 expects different results with and without it.
- Watch these globals: `val_opened_office`, `val_caught_picking`, `reached_security_office`, `cover_restored`, `ghost_offer_made`, `ghost_deal_accepted`, `ghost_keys_used`, `awaiting_ambush`, `insider_ambushed`, `insider_identified`, `patient_assaulted`.

## Run A: talk route, Ghost's deal, naming the insider (one reload)

1. **Meet Val before the burn.** Sign in with Bernie and choose an honest line, so `bernie_trusts_player` is set. Go through the ward to the Main Corridor.
   - Expected: Val patrols the west end in front of the Security Office door, with her cone drawn. She turns at about x 3 and x 7.5 tiles.
   - Talk to her and use the consultant line. She should point you to Gary's card and say she'll open the office when you come back with it. The Security Office door is locked.
   - Screenshot the corridor with the cone, and check whether the cone spills visibly into the security office or the handover room.
2. **Lanyard before the burn.** Pick up the Wrapped Contractor Lanyard in the Night Handover room.
   - Expected: `staff_lanyard_obtained` is true and `cover_restored` stays false.
   - HaX's text says "Hang on to it". The "That'll hold" text must **not** arrive.
3. **The burn lands on the corridor.** Get the keycard from Gary on any talk route. Wait for both HaX texts (the second one names Val), then walk back out to the Main Corridor.
   - Expected: Val's `cover_challenge` opens without clicking her.
   - Choose "Show her the lanyard." Expected: "She unlocks the office door and stands aside."; `val_opened_office` and `cover_restored` are set.
   - The Security Office door opens without a key or pick. Entering it completes "Get past Val at the security office".
4. **Reload, then the server room.** Reload the page in the Security Office.
   - Expected: no intro replays, the office door is still open, and Val doesn't challenge again.
   - Enter the Server Room with the card. Expected: **one** HaX text (orientation plus two guide offers) and **no** Val conversation.
   - Ask HaX "Got any general advice?". Expected: the server-room branch (Kali, SSH, drop-site), not "Gary is your route".
5. **Ghost before the choice.** Submit flags 1–3 (exercised).
   - Click the Recovery Console once you have the manifest. Expected: the console closes and Ghost's video call opens with "Before you touch that console -- look up."; `ghost_offer_made` is set.
   - Accept. Reopen the console. Expected: a fourth tile, "Ghost's Keys (Free, On Ghost's Terms)", is selectable.
   - Don't confirm yet. Check that HaX's hub shows "I have Ghost's decryption keys -- does that change things?".
6. **Name the insider.** Submit flag 4. Expected: HaX gives the badge and says to find the duty sheet, with no name.
   - Read the boardroom Night Security Post Log (PIN 0417). Expected: HaX confirms the post and still gives no name.
   - In HaX's hub choose "I know whose badge SC-4471 is.", pick Val first, then Reeves.
   - Expected: pushback for Val; for Reeves, `insider_identified` is set, `unmask_identify` completes and HaX confirms the phone-call link.
   - Then pick Ghost's Keys at the console and transmit at the press terminal. Expected: the debrief has the Ghost's-keys outcome. The credits show PATIENT DEATHS: 2, the GHOST'S KEYS line, COVER RE-ESTABLISHED, and no COVER BURNED.

## Run B: picking past Val, the IT key, Bed 4, the ambush

7. **Blind-spot pick (no key held).** Start a fresh game. Skip Bernie and pick the IT door, so you hold no `key`. Get Gary's card by talking.
   - Before the corridor challenge, choose "I'll get you something", so you're still burned.
   - Time Val's beat. Start a pick on the Security Office door while she is at the east end or walking east.
   - Expected: the lockpicking minigame opens and the door opens. Entering the office completes the task, and `cover_restored` stays false.
8. **Caught picking (no key).** Do this before step 7 succeeds, or in a second fresh game. Start a pick while she is dwelling at the west end facing the door.
   - Expected: no minigame. `on_lockpick_used` opens ("Away from the door"), `val_caught_picking` is set, and after your reply it goes straight into "Control have just been on…" (burned). It should not replay the walk-up narration.
   - A second attempt inside her cone a few seconds later must catch again (cooldown 250, not 30 s).
   - Note her position for every attempt, to confirm the computed window (seen at W1 facing west; safe at W2 and on the east leg).
9. **Caught picking with the IT key in inventory.** (Engine fix A is now in the tree: expect the catch. Confirmed in game 1398.) In a game where Bernie gave you the IT key, try to pick the Security Office door in front of Val.
   - Expected **without** the engine fix: the key-selection minigame opens and "Switch to Lockpicking" picks the door unseen. Record it as the known engine dependency, not a mission bug.
   - Expected **with** the fix: the catch opens as in step 8.
   - Either way, the IT key must not open the security office.
10. **After-the-fact catch.** Having picked in (step 7), enter the Server Room. Expected: Val's "Footsteps behind you…" scene plays once.
11. **Bed 4 slow path.** Reach the console with the manifest and the escrow keys (safe PIN 1987). Refuse Ghost's offer, then choose Offline Backup Keys.
    - Expected: within about 3 s HaX texts that Bed 4 is alarming and to get to the ward. There is **no** boardroom text yet. The "Bed 4 — critical" countdown appears.
    - Run to the ward and bag Mr Pryce. Expected: HaX's boardroom pointer arrives about 4 s after `bed4_manually_stabilised`.
12. **The ambush.** Without naming Reeves, open the press terminal and choose "keep it internal".
    - Expected: the terminal sets `awaiting_ambush`, not `mission_complete`.
    - Reeves' scene opens with "You close the terminal without sending anything…". There is no fight, he leaves and is hidden.
    - Then the debrief starts, and is not cut off.
    - Expected credits: "Walked out of the boardroom", COVER BURNED, PATIENT DEATHS: 6, and Val's catch line. The debrief offers "I never did get it back…" (if the cover-burn question is asked) and says "Nobody vouched for you".

## Run C: KO routes

13. **KO Val.** Start a fresh game; after the burn, punch Val down on the corridor.
    - Expected: HaX's KO text mentions her key, and the Security Office Key and Val's notebook drop.
    - Open the door with her key. Expected: the task completes and `cover_restored` stays false. The credits show "Neutralised on shift" and COVER BURNED, not COVER RE-ESTABLISHED.
14. **Raval and a patient.** Punch Nurse Raval once until she is down, then hit Ms Chen in Bed 5 once.
    - Expected: Doyle's barks still work, because `ward_nurse_ko` stays false and `raval_ko` is true.
    - HaX texts "What are you doing? That is a patient…" once, and `patient_assaulted` is set.
    - The debrief has the Raval and patient lines. Finish quickly from the console if needed, and mark that as exercised.
15. **Gary's cabinet catch.** In a game with no key held (the IT door picked), pick the IT filing cabinet with Gary conscious and in the room.
    - Expected: `on_cabinet_picked` opens once. The reply moves `gary_influence`. The next pick attempt opens the minigame.

## Report

For every step, report pass or fail with evidence (screenshots, global values, game id), and whether it was earned or exercised. Then list, as open items: the Val window you saw against the computed one, cone spill, and the step 9 behaviour.

## Round 2 confirmation run (one game, about 15 minutes)

After the round-2 fixes (`DESIGN_REVIEW.md` §7, "Round 2"). Hold Bernie's IT key throughout (engine fix A is in). Gary's cabinet catch and the cross-firing catch are engine bugs being fixed separately; note what you see, but don't count them against the mission.

R1. **Val dwells before the burn.** Sign in honestly with Bernie, then watch Val from the corridor's east end. Expected: about 4 s still at the west end facing the door, about 4 s still at the east end, and about 3.6 s walking each way. Time two full loops. Val's first line should be "Bernie's signed you in, has she?", not "signed in properly at reception".
R2. **Ring Bernie.** Get the keycard from Gary without a lanyard, then walk onto the corridor. Expected: the challenge offers "Ring Bernie on reception. She signed me in. She'll vouch for me." Choosing it sets `bernie_vouched`, `cover_restored` and `val_opened_office`, and the office opens.
R3. **Repeats are shorter.** In a second game (no Bernie trust, no lanyard), get caught picking twice, then choose "I'll get you something" twice.
   - Expected: the second catch opens on "Again? Seriously?".
   - The challenge speech plays in full once; after that Val says "Same question as before…".
   - The second "I'll get you something" gets "Still here."
   - If you never spoke to Val before the challenge, her line is "Whoever you are -- start talking."
R4. **Vouched, then reload.** Have Bernie vouch from her desk (hub option), reload the page, then talk to Val. Expected: she opens the office ("Control rang back. Bernie Nwosu's put her own name against you"), not her first meeting. HaX texts "Bernie's put her name against yours… ask her to open her office."
R5. **HaX hub.** Open the phone at flag 2. Expected: the story items sit at the top, followed by "Remind me where we are." and a single "Send me a field guide." button that opens the guide list. There are no more than about 10 buttons.
R6. **Naming needs a reason.** Submit flag 4, then *before* reading the post log:
   - Reeves offers only "What badge number do you carry on this post?", and he deflects.
   - HaX's names come in the order Val, Gary, Graham Reeves, Dr Kim. Picking Reeves asks for the reason, and the duty-sheet reason is missing.
   - Read the post log. Expected: the duty-sheet reason appears, wrong reasons get pushback, and the right one completes "Name badge SC-4471's holder, with your reason…".
R7. **Ghost's keys trade-off.** Accept Ghost's deal at the console.
   - Expected: the Ghost tile reads "FASTEST -- AND GHOST KEEPS A WAY IN" and names the foothold.
   - Use it. HaX texts about the foothold about 7 s later.
   - The debrief says one died and that Ghost is still in the network; the "not sure" reflection matches whether you transmitted.
   - Credits: PATIENT DEATHS: 1, GHOST'S FOOTHOLD, and Gary "Sacked, then rehired…" if you transmitted without protecting him.
R8. **Bed 4 from the north.** Choose offline keys in a game where you refused Ghost. Walk from the ward's west door straight down to Bed 4 and talk to Mr Pryce from the north side. Expected: the conversation opens. Reload during the countdown, then check that HaX's "Remind me where we are." gives the Bed 4 line.
R9. **Walk-out with a reply.** Never name Reeves, then decide at the terminal.
   - Expected: the ambush offers three replies ("You won't get far." / "Go for the door." / "Say nothing."). The scene can't be closed, and the debrief follows it.
   - If you accused Gary or Kim earlier, the debrief adds the wrong-suspect line and the credits show WRONG SUSPECT.
R10. **Punching Val.** Punch Val without talking. Expected: `attacked_guard` is true, and she opens no catch or challenge chat afterwards.

`tools/playtest/verify-run.rb` must show progress for each game.

## Round 3 confirmation run (one game, about 10 minutes)

C1. **Bed 4 from the north.** Refuse Ghost, choose offline keys, then walk from the ward's west door straight down to Bed 4.
   - From the north the bed is still out of reach. This is engine geometry, not a mission bug.
   - Expected: Nurse Raval is at his bedside. Talking to her offers "Give me the bag. I'll breathe for him.", which sets `bed4_manually_stabilised` and clears the countdown.
   - Also confirm the bed itself works from the west side and from the foot (south).
C2. **Press terminal after flag 4.** Open the terminal before flag 4 (RELAY LOCKED) and step away. Submit flag 4 and choose a restore, then reopen. Expected: the decision menu on the **first** reopen.
C3. **Val met, then challenged.** Talk to Val before the burn, then get burned and walk onto the corridor. Expected: "So whatever you told me an hour ago -- start again.", not "Whoever you are".
C4. **First catch visible.** With no key, trigger one pick in her cone with a single real `e` press (not the harness `interact`). Expected: her full first-catch scene, and no lockpicking minigame. Record how many `door_unlock_attempt` events one press produces.
C5. **Small items.**
   - The Ghost tile status reads "GHOST KEEPS A WAY IN" before selection.
   - HaX texts don't stack over the console while it's open.
   - Reeves offers three options before the post log.
   - Choosing Val in HaX's naming menu asks for a reason.
