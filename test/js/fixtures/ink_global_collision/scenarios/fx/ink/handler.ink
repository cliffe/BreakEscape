// No EXTERNAL getters: the engine binds only six; scenario flags below
VAR ext_flag = false
// Synced scenario globals
VAR guard_hostile = false
VAR block_flag = false
VAR own_line_flag = false // Synced scenario global: hall entered; also set by the hall event
// Mission flag, read by the debrief.
// Synced scenario global: hall entered; also set by the hall event
VAR owned_flag = false
// Synced scenario global, but a blank line follows

VAR gap_flag = false
VAR read_only = false
=== start ===
{ guard_hostile: Fight or run. }
~ ext_flag = true
~ block_flag = true
~ own_line_flag = true
~ owned_flag = true
~ gap_flag = true
-> END
