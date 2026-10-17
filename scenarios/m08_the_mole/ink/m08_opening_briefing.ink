// ================================================
// Mission 8: The Mole
// Opening briefing cutscene - ATHENA welcomes the player into the Citadel
// Speaker: ATHENA (building AI)
// Entry knot: start
// ================================================

VAR player_name = "Agent 0x00"
// Imported (read-only) from m07 (docs/agents/CARRY_OVER_PLAN.md): the defaults
// stand for a player who never finished m07. Never assign these here.
VAR m07_completed = false        // Imported (read-only): a finished m07 run exists
VAR m07_team_assignment = ""     // Imported (read-only) from m07 team_assignment: fracture / trojan_horse / meltdown / ""
VAR m07_team_redirected = false  // Imported (read-only) from m07 team_redirected: the team was moved to Trojan Horse mid-run

=== start ===
Narrator: SAFETYNET headquarters, the Citadel. Every badge reader blinks red. Nobody looks at the person at the next desk.

ATHENA: Welcome back, Agent 0x00. Security posture is Level Red. I have logged your entry, your route, and the precise time you crossed the threshold. Everyone's, actually. It's rather the point.

ATHENA: I have also logged your kit. One pick set, one RFID cloner, one fingerprint kit.
ATHENA: The PIN device you are thinking of is still signed out to Agent 0x47, as it has been since St. Catherine's.
ATHENA: Read nothing into it. Agent 0x23 has a hardware token out tonight, and Agent 0x88 a travel pack. Everyone on the planning list keeps something they shouldn't.

// Carry-over (2026-10-17): a player who finished m07 hears where they sent the
// team, and what that means nine days on. One line per branch, as HEAD had, so
// the briefing still runs nine lines. Trojan Horse (m07 debrief): the
// backdoor wakes on day nine and dispatch starts dropping calls, unless the team
// reached Austin. The else branch is the original line, word for word.
{
- m07_team_assignment == "trojan_horse" and m07_team_redirected:
    ATHENA: Portland happened. You moved the one team to Austin with the clock running, and it reached the dispatch keys first. Nine days on, those counties are still answering.
- m07_team_assignment == "trojan_horse":
    ATHENA: Portland happened. Your tasking order sent the one team to Austin, so no backdoor went anywhere. Today is day nine, and dispatch in eleven counties is still answering.
- m07_team_assignment == "fracture":
    ATHENA: Portland happened. Your tasking order sent the one team to Washington, so nobody reached Austin. Today is day nine, and dispatch in eleven counties has started dropping calls.
- m07_team_assignment == "meltdown":
    ATHENA: Portland happened. Your tasking order sent the one team to San Francisco, so nobody reached Austin. Today is day nine, and dispatch in eleven counties has started dropping calls.
- m07_completed:
    ATHENA: Portland happened. Your tasking order for the one team is blank, so nobody reached Austin. Today is day nine, and dispatch in eleven counties has started dropping calls.
- else:
    ATHENA: You are wondering what happened here. Portland happened. Four sites in one night, one team to send, and an enemy who had the deployment before we did.
}

ATHENA: The leak came from inside this building. Director Netherton has three names, and one of them got two of your colleagues killed.

ATHENA: A word of advice, from the only voice here with no stake in the outcome. The moment they know you are hunting, they vanish. Be quiet. Be quick.

ATHENA: The Director's office is north of this lobby. Do try not to trust anyone on the way.
#exit_conversation
-> DONE
