// ===========================================
// m09 Digital Archaeology: Margaret Sorensen at the cage door (person-chat)
// Group B, B5. CONTRACT.md §3.3. Recruited Victoria's route only.
// NPC id: sorensen_door (hidden). Knot `door`, opened by her
// room_entered:restricted_cage mapping (cage_opened && !hatch_talked &&
// !bin_chosen, onceOnly). Sets no hatch_talked.
// The recognition and HaX's bin lines are B3's strings, character for
// character (m09_sorensen_hatch.ink); change both together. One exception
// (R2 B-R2-05): nobody claimed the lease-holder on this route, so her line
// after the recognition is her own. And the player never saw the hatch here,
// so HaX's first bin line opens "One bin is…" (R2 follow-up).
// Stage 8 ruling 1 (m09-R M-02, option a): the default bin reaches the
// notepad on every route. "[Walk past her.]" hands over the file nearest her,
// Derek's, and she tips the other. Knot `handover` is the hatch route's
// default: a second mapping on room_entered:restricted_cage with
// cage_opened && hatch_talked && !bin_chosen, onceOnly, opens it on the first
// cage entry when no hatch button was pressed. One line, no choice: the other
// bin went into the feed while the player was at the gate.
// ===========================================

INCLUDE m09_carryover_vars.ink

// Scenario globals (CONTRACT §5.3).
VAR bin_chosen = false
VAR cage_bin = ""

=== door ===
Narrator: Sorensen looks up from the feed table as the gate swings open.
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
    Margaret Sorensen: Your first days aren't in your file. Somebody in your outfit is careful with you.
}
Margaret Sorensen: You came in by the maintenance code, not my hatch. You're the one the Architect writes about.
Agent HaX: ...She's got a file on you.
Agent HaX: One bin is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did.
{m08_nightshade_tidied:
    Agent HaX: The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute.
- else:
    Agent HaX: The other's the Social Fabric letters. Last one's about a union rep in Butte they're about to bury. One of them's ash in a minute.
}
+ [Take Derek's file.]
    #give_item:notes:derek_file
    #set_global:cage_bin:derek_file
    #set_global:bin_chosen:true
    Margaret Sorensen: Of course. He'd want to be read.
    Narrator: She tips the other bin into the feed without looking at it.
    #exit_conversation
    -> DONE
+ {not m08_nightshade_tidied} [Take the letters.]
    #give_item:notes:letters
    #set_global:cage_bin:letters
    #set_global:bin_chosen:true
    Margaret Sorensen: The letters. You'd rather save someone who's still walking around.
    Narrator: She tips Derek Lawson's file into the feed.
    Agent HaX: Arakawa's ringing Butte. She'll hear it from us first.
    {m01_maya_ko:
        Agent HaX: That's the warning we didn't have.
    }
    #exit_conversation
    -> DONE
+ {m08_nightshade_tidied} [Take Nightshade's copy.]
    #give_item:notes:nightshade_copy
    #set_global:cage_bin:nightshade_copy
    #set_global:bin_chosen:true
    Margaret Sorensen: His own words. He always did write a careful note.
    Narrator: She tips Derek Lawson's file into the feed.
    Agent HaX: So that's what he had time to clear.
    #exit_conversation
    -> DONE
+ [Walk past her.]
    #give_item:notes:derek_file
    #set_global:cage_bin:derek_file
    #set_global:bin_chosen:true
    Margaret Sorensen: As you like. Take Mr. Lawson's file on your way. It's nearest. The other one's going in.
    Narrator: She tips the other bin into the feed without looking at it.
    #exit_conversation
    -> DONE

=== handover ===
// Hatch route, cage opened with no bin chosen (see header). Same three tags
// as B3's Derek button, so the default matches a chosen derek_file.
#give_item:notes:derek_file
#set_global:cage_bin:derek_file
#set_global:bin_chosen:true
Margaret Sorensen: You never chose, so take Mr. Lawson's file. It was nearest. The other one's already gone.
#exit_conversation
-> DONE
