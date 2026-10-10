// Nmap Tool - Reusable Explanations
// Used across multiple scenarios

=== nmap_what_is_it ===
Haxolottle: Nmap is your eyes on the network, little axolotl.

Haxolottle: It's a network scanner that reveals what's running on remote systems - open ports, services, even operating systems.

Haxolottle: Every hacker starts with reconnaissance, and Nmap is the reconnaissance king.

+ [How do I use it?]
    -> nmap_basic_usage

+ [What can it tell me?]
    -> nmap_capabilities

+ [Got it, thanks]
    -> DONE

=== nmap_basic_usage ===
Haxolottle: The simplest scan: nmap TARGET_IP

Haxolottle: This checks the 1000 most common ports. Quick and dirty.

Haxolottle: Want more detail? Add -sV for service versions: nmap -sV TARGET_IP

Haxolottle: Need everything? Scan all ports: nmap -p- TARGET_IP

Haxolottle: That one takes time, but you'll find every listening service.

+ [What about stealth?]
    Haxolottle: Smart question. Use SYN scans: sudo nmap -sS TARGET_IP

    Haxolottle: They're faster and slightly stealthier than full TCP connections.

    Haxolottle: Though honestly, any halfway decent IDS will still spot you.

+ [Tell me more about what Nmap reveals]
    -> nmap_capabilities

+ [That's what I needed]
    -> DONE

=== nmap_capabilities ===
Haxolottle: Nmap tells you the attack surface - everything exposed to the network.

Haxolottle: Open ports: Is SSH running? Web server? Database?

Haxolottle: Service versions: Not just "SSH," but "OpenSSH 7.4" - specific enough to look up vulnerabilities.

Haxolottle: Operating system: With -O flag, Nmap can guess if it's Windows, Linux, what version.

Haxolottle: And with NSE scripts (--script), it can even check for specific vulnerabilities.

+ [How do I scan for vulnerabilities?]
    Haxolottle: Use the vuln script category: nmap --script vuln TARGET_IP

    Haxolottle: It's not as thorough as dedicated scanners, but it catches common issues.

+ [Show me some useful command examples]
    -> nmap_examples

+ [I understand Nmap now]
    -> DONE

=== nmap_examples ===
Haxolottle: Here are the commands I use most:

Haxolottle: Full scan with versions: nmap -sV -p- TARGET_IP

Haxolottle: Fast scan with OS detection: nmap -sS -O TARGET_IP

Haxolottle: Vulnerability check: nmap --script vuln -sV TARGET_IP

Haxolottle: Save results: nmap -sV -oA scan_results TARGET_IP

Haxolottle: The -oA saves in all formats - normal, XML, and greppable.

+ [What's the TARGET_IP placeholder?]
    Haxolottle: Just replace it with the actual IP address you're scanning.

    Haxolottle: Like: nmap -sV 10.0.0.5

+ [Thanks, that's clear]
    -> DONE
