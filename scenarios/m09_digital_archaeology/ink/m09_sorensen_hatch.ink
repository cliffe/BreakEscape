// ===========================================
// m09 Digital Archaeology: Margaret Sorensen at the hatch (person-chat)
// Group B, B3. CONTRACT.md §3.3. Beat 2.1 steps 1-5; MC §3.1.
// NPC id: sorensen_hatch (static sprite behind the counter). Entry knot: start.
// 66, county clerk twenty years. Unhurried, kind in tone, exact in content.
// US English. SAFETYNET can't arrest. She never says WREN's name.
// Her mapping hides her on cage_opened: nothing here runs after the gate.
// The recognition and HaX's bin lines are the same strings in B5
// (m09_sorensen_door.ink); change both together.
// ===========================================

INCLUDE m09_carryover_vars.ink

// Scenario globals (CONTRACT §5.3).
VAR hatch_talked = false
VAR bin_chosen = false
VAR cage_bin = ""
VAR ledger_read_heard = false

// Ink-local.
VAR hatch_met = false
VAR hatch_leaned = false
VAR hatch_asked_wren = false
VAR hub_quiet = false
// Playtest R1 B-M1: the bin is chosen once; this local closes the buttons
// at once (the #set_global reaches the story too late for the next menu).
VAR bin_pulled = false
// Synced scenario global (confirm run): set by HaX on card_cloned for her
// card, so the clone option retires once a read is saved (it stays after a cancel).
VAR stacks_card_cloned = false
// Synced scenario global (dialogue R1 m9): the cover the player gave Noor.
VAR noor_cover = ""

=== start ===
{hatch_met: -> hub}
// Puzzle chains R7 m1: hatch_met and hatch_talked are set at the end of recognition,
// so an Esc and a reload before then replays the whole opening (and Victoria's
// route still gets the door scene).
// Full-route playtest #15: the auditor is her guess, made before the player
// speaks; a narrator beat says so.
// Dialogue R1 m9: a player who told Noor the truth gets that cover back.
{noor_cover == "safetynet":
    Narrator: She looks up before you can say who you are.
    Margaret Sorensen: Noor rang through. SAFETYNET, of course. There's a chair on your side.
    -> recognition
}
Narrator: She looks up before you can say who you are.
Margaret Sorensen: The lease-holder's auditor. Of course. There's a chair on your side.
Narrator: She stamps a box DESTROYED and slides it back toward the noise.
-> opening

// Puzzle chains R6 m2: the opening choices own their knot (like Noor's cover), so
// a reopen after an Esc here comes back to them and then recognition, not the hub.
=== opening ===
+ [That's right. They want tonight's run checked against the schedule.]
    Margaret Sorensen: Then you'll find it in order. I've never sent a box anywhere it wasn't due.
    -> recognition
+ [I'll stand.]
    Margaret Sorensen: As you like. Most people sit, in the end.
    -> recognition

// Sorensen places the player (the scene's turn), then HaX names the bins
// right before the buttons (script edit B-04; B5 runs in the same order).
=== recognition ===
// B-1: one line per m01 value. On expose and surrender she gives the
// archivist's angle (what she filed, what it costs), so the beat isn't a
// third telling of Derek's file and the Reading's page 1 (W6-17).
{
- m01_final_choice == "fight":
    Margaret Sorensen: Viral Dynamics. You put a man on the floor after you'd already won. I filed that myself.
- m01_final_choice == "recruit":
    Margaret Sorensen: You offered Mr. Lawson a job. It's in your file, you know. "A recruiter's instinct."
- m01_final_choice == "expose":
    Margaret Sorensen: Viral Dynamics. I filed the press cuttings myself. Thirty-eight of them, and he asked to see every one.
- m01_final_choice == "surrender":
    Margaret Sorensen: Viral Dynamics. I still pay Mr. Lawson's lawyer, every month. It's the cheapest line in my book.
- m01_final_choice == "arrest" or m01_completed:
    Margaret Sorensen: Viral Dynamics. You handed Mr. Lawson to the police, and he kept his promise and said nothing. He was always good about promises.
- else:
    Margaret Sorensen: Your first days aren't in your file. Somebody at SAFETYNET is careful with you.
}
// Dialogue R1 MJ-2: "the Architect", not "he" (which read as Derek Lawson).
{noor_cover == "safetynet":
    Margaret Sorensen: And you're the one the Architect writes about.
- else:
    Margaret Sorensen: You're not from the lease-holder. You're the one the Architect writes about.
}
Agent HaX: ...She's got a file on you.
#set_global:hatch_talked:true
Agent HaX: Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did.
{m08_nightshade_tidied:
    Agent HaX: The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute.
- else:
    Agent HaX: The other's the Social Fabric letters. Last one's about a union rep in Butte they're about to bury. One of them's ash in a minute.
}
~ hatch_met = true
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{not hub_quiet:
    {bin_chosen:
        Margaret Sorensen: You have your file. I have my boxes.
    - else:
        Margaret Sorensen: Take your time. The shredder won't.
    }
}
~ hub_quiet = false
// The bin choice (MC §3.1). Each button gives the file and tips the other.
+ {not bin_chosen and not bin_pulled} [Pull Derek's file through.]
    ~ bin_pulled = true
    #give_item:notes:derek_file
    #set_global:cage_bin:derek_file
    #set_global:bin_chosen:true
    Margaret Sorensen: Of course. He'd want to be read.
    Narrator: She passes the file through the hatch and tips the other bin into the feed without looking at it.
    -> back
+ {not bin_chosen and not bin_pulled and not m08_nightshade_tidied} [Pull the letters through.]
    ~ bin_pulled = true
    #give_item:notes:letters
    #set_global:cage_bin:letters
    #set_global:bin_chosen:true
    Margaret Sorensen: The letters. You'd rather save someone who's still walking around.
    Narrator: She passes them through the hatch and tips Derek Lawson's file into the feed.
    Agent HaX: Arakawa's ringing Butte. She'll hear it from us first.
    {m01_maya_ko:
        Agent HaX: That's the warning we didn't have.
    }
    -> back
+ {not bin_chosen and not bin_pulled and m08_nightshade_tidied} [Pull Nightshade's copy through.]
    ~ bin_pulled = true
    #give_item:notes:nightshade_copy
    #set_global:cage_bin:nightshade_copy
    #set_global:bin_chosen:true
    Margaret Sorensen: His own words. He always did write a careful note.
    Narrator: She passes it through the hatch and tips Derek Lawson's file into the feed.
    Agent HaX: So that's what he had time to clear.
    -> back
// Sticky, before and after the bin: her card is on a reel at her hip.
// Playtest R1 B-M2: the choice says what it is; she answers first, and the
// clone runs on a narrator beat. Sticky so a failed read can be retried.
+ {not stacks_card_cloned} [Lean on the counter, close to her card reel. Ask what's in tonight's run.]
    {hatch_leaned:
        Margaret Sorensen: Less than when you last asked. Careful of the ink, it doesn't come out of a cuff.
    - else:
        Margaret Sorensen: Series R, to the last box.
        Margaret Sorensen: Take the print if you like. By the time it matters, the shredder will have caught up.
    }
    Narrator: You lean on the counter. The card reel at her hip swings a hand's width from the cloner in your jacket.
    #clone_keycard:stacks_card
    Narrator: She goes on stamping.
    ~ hatch_leaned = true
    -> back
+ {ledger_read_heard and not hatch_asked_wren} [Who's WREN?]
    ~ hatch_asked_wren = true
    Margaret Sorensen: I keep records. I don't read them aloud.
    -> back
+ [I'll leave you to it.]
    Margaret Sorensen: Watch the step on your way.
    #exit_conversation
    -> back
