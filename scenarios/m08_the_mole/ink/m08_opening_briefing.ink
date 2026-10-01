// ================================================
// Mission 8: The Mole
// Opening briefing cutscene - ATHENA welcomes the player into the Citadel
// Speaker: ATHENA (building AI)
// Entry knot: start
// ================================================

VAR player_name = "Agent 0x00"

=== start ===
Narrator: SAFETYNET headquarters. They call it the Citadel, and it has never lived up to the name less than it does tonight. Every badge reader blinks red. Nobody makes eye contact. The safest building in the service, and everyone inside it is afraid of the person at the next desk.

ATHENA: Welcome back, Agent 0x00. Security posture is Level Red. I have logged your entry, your route, and the precise time you crossed the threshold. Everyone's, actually. It's rather the point.

ATHENA: I have also logged your kit. One pick set, one RFID cloner, one fingerprint kit. The PIN device you are thinking of is still on a bench in Technical Analysis, two floors down.

You: What happened here?

ATHENA: Portland happened. Four sites in one night, and one team to send. Then somebody read the after-action report and realised the enemy had the deployment before we did.

ATHENA: The leak came from inside this building. Director Netherton is waiting for you in his office. He has three names. One of them got two of your colleagues killed.

ATHENA: A word of advice, from the only voice in here with no stake in the outcome: whoever it is has planning access and years of practice. The moment they know you are hunting, they vanish. Be quiet. Be quick.

ATHENA: The Director's office is north of this lobby. Do try not to trust anyone on the way.
#exit_conversation
-> DONE
