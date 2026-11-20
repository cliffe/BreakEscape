// Four resting states for PhoneChatConversation._savedChoicesAreExits (phone-reopen-stale-exit.test.mjs).
VAR x = false
-> silent
=== silent ===
* [Understood.]
  -> END
=== prints ===
* [Understood.]
  Fine then.
  -> END
=== sets_var ===
* [Understood.]
  ~ x = true
  -> END
=== menu ===
* [Leave it.]
  -> END
* [Hang up.]
  -> END
