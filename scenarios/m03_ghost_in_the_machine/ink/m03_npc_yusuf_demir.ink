// Office life slice 5 (office_life/DIALOGUE_SAMPLE.md, clips 38 to 47). Short-form conversation on the
// m03 hub pattern. Day only: he is hidden at night.

// Synced scenario global: an attack on either day member of staff, or Ffion knocked out by day.
VAR wh_staff_upset = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false
// Set after the first meeting, so a reload does not replay the greeting.
VAR met_player = false

// Root divert: a finished conversation restarts from the root (npc-conversation-state.js).
-> start

=== start ===
{wh_staff_upset:
    -> upset
}
{met_player:
    ~ hub_quiet = false
    -> hub
}
~ met_player = true
~ hub_quiet = true
Yusuf Demir: Afternoon. If you're my client, you're very late.
-> hub

=== hub ===
{wh_staff_upset:
    -> upset
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Yusuf Demir: Still here. Still waiting.
}
* [Who are you waiting for?]
    Yusuf Demir: A client from down the Bay. They want a test and a nice report.
    Yusuf Demir: And I've left my pass at home, so I wait out here like a visitor.
    ~ hub_quiet = true
    -> hub
* [What does a senior consultant actually do?]
    Yusuf Demir: Scoping calls, meetings and reports. Mostly reports.
    Yusuf Demir: The breaking-in part is about one day a month.
    ~ hub_quiet = true
    -> hub
* [Have you always done this?]
    Yusuf Demir: I ran security in-house for years. Policies, audits, the lot.
    Yusuf Demir: Here, at least, somebody else has to fix it.
    ~ hub_quiet = true
    -> hub
+ [I'll leave you to it.]
    Yusuf Demir: Good luck in there.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== upset ===
Yusuf Demir: Stay back. I won't ask you again.
#exit_conversation
-> DONE
