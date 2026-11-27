// Fixture for TtsLineExtractor / the TTS endpoint: a host story (HaX's debrief)
// in which a co-speaker who has a story of their own (Vance) speaks, by
// prefix and by #speaker tag. Compile: bin/inklecate -o cospeaker_host.json cospeaker_host.ink
VAR vance_agreed = false
-> debrief

=== debrief ===
Agent HaX: You made the disclosure call.
Robert Vance: Nobody gets to call it an accident.
It'll hurt us. People should still know. #speaker:npc:robert_vance
-> close

=== close ===
// An inline conditional at a knot's top level: inklecate writes the rejoin
// divert as an absolute path ("close.N"), not ".^.^.^.N".
Agent HaX: They spent years on this. {vance_agreed:Tonight you turned it round.|Tonight you took it off them.}
{ not vance_agreed:
    Agent HaX: Go home.
}
-> END
