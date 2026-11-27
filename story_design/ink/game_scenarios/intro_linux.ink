// Linux Fundamentals - Game Scenario Version
// Helpful NPC dialogue for understanding Linux and security tools

// Global persistent state only
VAR haxolottle_rapport = 0

// External variables
EXTERNAL player_name

=== start ===
Haxolottle: Hey there, {player_name}! Need some help with Linux?

~ haxolottle_rapport = 0

Haxolottle: I know these command-line interfaces can be intimidating at first, little axolotl.

Haxolottle: But trust me, once you get the hang of it, you'll wonder how you ever lived without it.

Haxolottle: What would you like to know about?

-> linux_hub

=== linux_hub ===
Haxolottle: What can I help you understand?

+ [Why Linux? Why not just use Windows?]
    -> why_linux
+ [Basic command-line navigation]
    -> command_line_basics
+ [The vi text editor]
    -> vi_editor
+ [Piping commands together]
    -> piping
+ [Redirecting output to files]
    -> redirection
+ [Linux networking basics]
    -> networking
+ [SSH - connecting to remote systems]
    -> ssh_basics
+ [Hydra - password attacks]
    -> hydra_tool
+ [What's Kali Linux?]
    -> kali_linux
+ [Show me a commands cheat sheet]
    -> commands_reference
+ [I'm good for now, thanks]
    #exit_conversation
    -> END

=== why_linux ===
Haxolottle: Good question! Linux runs most of the servers on the internet.

~ haxolottle_rapport += 5

Haxolottle: Web servers, database servers, email servers - they're almost all Linux.

Haxolottle: So if you need to access those systems, you better know your way around Linux.

Haxolottle: Plus, all the best security tools are built for Linux. Kali Linux is packed with them.

+ [What makes Linux good for security work?]
    Haxolottle: A few things, really.

    Haxolottle: Open source - you can see exactly what the code does, no hidden backdoors.

    Haxolottle: Command-line focused - scripts and automation are easy.

    Haxolottle: Powerful tools - Nmap, Metasploit, Wireshark, all built for Linux first.

    Haxolottle: And the community - security researchers love Linux, so that's where the tools are.

+ [Tell me about Kali Linux specifically]
    -> kali_linux

- -> linux_hub

=== command_line_basics ===
Haxolottle: The command line is your interface to the system, little axolotl.

~ haxolottle_rapport += 5

Haxolottle: Instead of clicking icons, you type commands. More powerful, faster once you know it.

Haxolottle: Let me show you the essentials.

+ [How do I see where I am?]
    Haxolottle: Use pwd - "print working directory"

    Haxolottle: It shows your current location in the file system.

    Haxolottle: Like: /home/kali or /root or /etc

+ [How do I see what files are here?]
    Haxolottle: Use ls - "list"

    Haxolottle: Basic: ls shows files and directories

    Haxolottle: Detailed: ls -la shows hidden files, permissions, sizes, everything

    Haxolottle: The -l flag means "long format" and -a means "all files including hidden ones"

+ [How do I move around?]
    Haxolottle: Use cd - "change directory"

    Haxolottle: cd /etc moves to /etc directory

    Haxolottle: cd .. goes up one level

    Haxolottle: cd ~ or just cd goes to your home directory

+ [How do I read file contents?]
    Haxolottle: Several ways:

    Haxolottle: cat filename - dumps the whole file to screen

    Haxolottle: less filename - view file page by page (press q to quit)

    Haxolottle: head filename - just the first 10 lines

    Haxolottle: tail filename - just the last 10 lines

+ [How do I create, copy, move, or delete files?]
    Haxolottle: Creating: touch filename makes an empty file

    Haxolottle: Copying: cp source destination

    Haxolottle: Moving/renaming: mv source destination

    Haxolottle: Deleting: rm filename (careful, no undo!)

    Haxolottle: Creating directories: mkdir dirname

+ [How do I get help on commands?]
    Haxolottle: Use man - "manual"

    Haxolottle: man ls shows the manual for ls

    Haxolottle: man ssh shows the manual for ssh

    Haxolottle: Press space to page down, q to quit

    Haxolottle: Or try command --help for quick help

+ [Got it, thanks]
    -> linux_hub

- -> linux_hub

=== vi_editor ===
Haxolottle: Ah, vi. The editor people love to hate until they love it.

~ haxolottle_rapport += 5

Haxolottle: It's on every Linux system, so you need to know the basics.

Haxolottle: Vi has modes - that's the weird part for beginners.

+ [What are these modes?]
    Haxolottle: Two main modes:

    Haxolottle: **Command mode** - for navigation and commands (default when you open vi)

    Haxolottle: **Insert mode** - for actually typing text

    Haxolottle: Press i to enter insert mode, Esc to go back to command mode.

+ [How do I open a file?]
    Haxolottle: vi filename opens or creates the file

    Haxolottle: You start in command mode. Press i to start typing.

+ [How do I save and quit?]
    Haxolottle: From command mode (press Esc first if needed):

    Haxolottle: :w saves (write)

    Haxolottle: :q quits

    Haxolottle: :wq saves and quits

    Haxolottle: :q! quits without saving (force quit)

+ [Basic navigation in command mode?]
    Haxolottle: Arrow keys work, but vi users use:

    Haxolottle: h (left), j (down), k (up), l (right)

    Haxolottle: w (next word), b (back word)

    Haxolottle: 0 (start of line), $ (end of line)

    Haxolottle: gg (start of file), G (end of file)

+ [Quick reference?]
    Haxolottle: Here's what you really need:

    Haxolottle: Open: vi filename

    Haxolottle: Enter insert mode: i

    Haxolottle: Exit insert mode: Esc

    Haxolottle: Save and quit: :wq

    Haxolottle: Quit without saving: :q!

    Haxolottle: That'll get you through 90% of situations.

+ [I think I understand]
    -> linux_hub

- -> linux_hub

=== piping ===
Haxolottle: Piping is beautiful, little axolotl. It's the Unix philosophy.

~ haxolottle_rapport += 5

Haxolottle: Take the output of one program and feed it as input to another.

Haxolottle: The pipe symbol is: |

+ [Show me an example]
    Haxolottle: Classic example: ls -la | less

    Haxolottle: List all files, but pipe it through less so you can scroll through it.

    Haxolottle: Another: cat /etc/passwd | grep root

    Haxolottle: Show the passwd file, but filter for lines containing "root"

    Haxolottle: Or: ps aux | grep ssh

    Haxolottle: List all processes, find the ones related to SSH.

+ [What's grep?]
    Haxolottle: Grep is your search tool - "Global Regular Expression Print"

    Haxolottle: grep pattern filename searches a file

    Haxolottle: grep -i pattern filename makes it case-insensitive

    Haxolottle: grep -r pattern directory searches recursively

    Haxolottle: grep is incredibly powerful with piping.

+ [Any other useful pipes?]
    Haxolottle: Oh tons. Here are favorites:

    Haxolottle: command | wc -l counts lines of output

    Haxolottle: command | sort sorts the output

    Haxolottle: command | uniq removes duplicate lines

    Haxolottle: command | head -n 20 shows first 20 lines

    Haxolottle: You can chain multiple: ls | grep .txt | wc -l (counts .txt files)

+ [Got it]
    -> linux_hub

- -> linux_hub

=== redirection ===
Haxolottle: Redirection lets you save output to files or read input from files.

~ haxolottle_rapport += 5

Haxolottle: Three main operators: >, <, and >>

+ [What does > do?]
    Haxolottle: The > redirects output to a file (overwrites if it exists):

    Haxolottle: ls > files.txt saves the ls output to files.txt

    Haxolottle: echo "Hello" > message.txt creates a file with that text

    Haxolottle: Careful - it overwrites the file!

+ [What does >> do?]
    Haxolottle: The >> appends to a file instead of overwriting:

    Haxolottle: echo "New line" >> message.txt adds to the end

    Haxolottle: Safer when you don't want to lose existing content.

+ [What does < do?]
    Haxolottle: The < reads input from a file:

    Haxolottle: mysql < database.sql feeds a SQL file to MySQL

    Haxolottle: sort < unsorted.txt sorts the file contents

    Haxolottle: Honestly, you'll use > and >> way more than <

+ [Can I combine piping and redirection?]
    Haxolottle: Absolutely! They work great together:

    Haxolottle: cat file.txt | grep error | sort > errors.txt

    Haxolottle: Search for errors, sort them, save to a file.

    Haxolottle: ls -la | grep ".txt" >> text_files.txt

    Haxolottle: Find .txt files, append to a list.

+ [Clear]
    -> linux_hub

- -> linux_hub

=== networking ===
Haxolottle: Linux networking - how to see your network config and connections.

~ haxolottle_rapport += 5

+ [How do I see my IP address?]
    Haxolottle: Two commands, depending on your Linux version:

    Haxolottle: ip a or ip addr show (modern systems)

    Haxolottle: ifconfig (older systems, but still common)

    Haxolottle: Look for inet entries - that's your IP.

+ [How do I see active connections?]
    Haxolottle: netstat -tulpn shows listening ports and connections

    Haxolottle: ss -tulpn is the modern replacement, faster

    Haxolottle: -t is TCP, -u is UDP, -l is listening, -p is programs, -n is numeric (don't resolve names)

+ [How do I test network connectivity?]
    Haxolottle: ping TARGET tests basic connectivity:

    Haxolottle: ping 8.8.8.8 checks if you can reach Google's DNS

    Haxolottle: ping -c 4 TARGET sends just 4 packets (otherwise it's infinite)

+ [I understand]
    -> linux_hub

- -> linux_hub

=== ssh_basics ===
Haxolottle: SSH - Secure Shell - is how you connect to remote Linux systems.

~ haxolottle_rapport += 5

Haxolottle: It's encrypted, so your commands and passwords aren't sent in plaintext.

+ [How do I connect with SSH?]
    Haxolottle: Basic: ssh username@hostname

    Haxolottle: Like: ssh root@10.0.0.5

    Haxolottle: It'll ask for the password, then you're in.

    Haxolottle: To exit the SSH session, type exit or press Ctrl-D

+ [What if SSH is on a different port?]
    Haxolottle: Use -p flag: ssh -p 2222 username@hostname

    Haxolottle: Default is port 22, but admins sometimes change it.

+ [Can I run GUI programs over SSH?]
    Haxolottle: Yes! Use X forwarding: ssh -X username@hostname

    Haxolottle: Then you can run graphical programs and they display on your screen.

    Haxolottle: Like: ssh -X user@10.0.0.5 then run firefox

    Haxolottle: The program runs on the remote system but displays locally.

+ [What about SSH keys instead of passwords?]
    Haxolottle: Way more secure! Generate keys with: ssh-keygen

    Haxolottle: Copy your public key to the server: ssh-copy-id user@host

    Haxolottle: Then you can log in without typing a password.

    Haxolottle: The server checks your private key (which never leaves your machine).

+ [Got it]
    -> linux_hub

- -> linux_hub

=== hydra_tool ===
Haxolottle: Hydra is a password cracker, little axolotl.

~ haxolottle_rapport += 5

Haxolottle: It does brute force and dictionary attacks against login services.

Haxolottle: SSH, FTP, HTTP, you name it - Hydra can attack it.

+ [How does it work?]
    Haxolottle: Hydra tries many username/password combinations rapidly.

    Haxolottle: You give it a wordlist of passwords, and it tries each one.

    Haxolottle: Eventually it finds one that works (if it's in the wordlist).

+ [Show me the basic command]
    Haxolottle: For SSH: hydra -l username -P passwordlist.txt ssh://TARGET

    Haxolottle: -l is the login name (single user)

    Haxolottle: -P is the password file (capital P for file)

    Haxolottle: Or use -L for a user list and -p for a single password

+ [Where do I get password lists?]
    Haxolottle: Kali Linux comes with some: /usr/share/wordlists/

    Haxolottle: rockyou.txt is popular - 14 million passwords from breaches

    Haxolottle: It's gzipped, unzip with: gunzip /usr/share/wordlists/rockyou.txt.gz

+ [How fast is it?]
    Haxolottle: Depends on the service and your connection.

    Haxolottle: Local services: thousands of attempts per second

    Haxolottle: Remote SSH: dozens per second (network latency)

    Haxolottle: Use -t flag to increase parallel tasks: hydra -t 4 ...

+ [Isn't this illegal?]
    Haxolottle: Only against systems you don't have permission to test!

    Haxolottle: On your own systems or with written authorization, it's legal security testing.

    Haxolottle: Without permission, it's unauthorized access - very illegal.

+ [I understand]
    -> linux_hub

- -> linux_hub

=== kali_linux ===
Haxolottle: Kali Linux - the security professional's distro.

~ haxolottle_rapport += 5

Haxolottle: It's Debian-based but comes pre-loaded with hundreds of security tools.

+ [What makes Kali special?]
    Haxolottle: All the tools you need, already installed and configured:

    Haxolottle: Network scanners (Nmap), exploitation frameworks (Metasploit), password crackers (John, Hashcat, Hydra)

    Haxolottle: Web testing tools (Burp Suite, OWASP ZAP, Nikto), wireless tools (Aircrack-ng)

    Haxolottle: Forensics tools, reverse engineering tools, you name it.

    Haxolottle: Saves you hours of setup time.

+ [Should I use Kali as my main OS?]
    Haxolottle: Nah, don't do that.

    Haxolottle: Kali is meant for security work, not daily use.

    Haxolottle: Run it in a VM, or dual-boot, or use a live USB.

    Haxolottle: You don't want to browse the web and check email as root with all these attack tools.

+ [What's the default password?]
    Haxolottle: Newer Kali: username "kali", password "kali"

    Haxolottle: Older versions: username "root", password "toor"

    Haxolottle: Change these immediately if you're using Kali seriously!

+ [Tell me about some specific tools]
    Haxolottle: We've got separate discussions for the big ones.

    Haxolottle: Ask me about Nmap for scanning, Metasploit for exploitation, or specific tools you're curious about.

+ [Got it]
    -> linux_hub

- -> linux_hub

=== commands_reference ===
Haxolottle: Here's a quick reference of essential Linux commands.

~ haxolottle_rapport += 3

Haxolottle: **Navigation & Files:**

Haxolottle: pwd (where am I), ls (list files), cd (change directory)

Haxolottle: cat (show file), less (page through file), head/tail (first/last lines)

Haxolottle: cp (copy), mv (move/rename), rm (delete), mkdir (make directory)

Haxolottle: **Text Processing:**

Haxolottle: grep (search), sort (sort lines), uniq (remove duplicates)

Haxolottle: wc -l (count lines), cut (extract columns), sed (stream editor)

Haxolottle: **System Info:**

Haxolottle: whoami (current user), id (user details), uname -a (system info)

Haxolottle: ps aux (all processes), top (live process monitor), df -h (disk space)

Haxolottle: **Networking:**

Haxolottle: ip a or ifconfig (IP address), netstat/ss (connections), ping (connectivity test)

Haxolottle: **Remote Access:**

Haxolottle: ssh user@host (connect to remote system), scp (secure copy over SSH)

Haxolottle: **Security Tools:**

Haxolottle: hydra (password attacks), nmap (network scanning - ask me about this!)

Haxolottle: **Piping & Redirection:**

Haxolottle: command | command (pipe output to another command)

Haxolottle: command > file (save output to file), command >> file (append to file)

+ [Tell me about Nmap]
    INCLUDE tools/nmap_basics.ink -> nmap_what_is_it

+ [Tell me about Metasploit]
    INCLUDE tools/metasploit_basics.ink -> metasploit_what_is_it

+ [Tell me about Netcat]
    INCLUDE tools/netcat_basics.ink -> netcat_what_is_it

+ [Back to main topics]
    -> linux_hub

- -> linux_hub

-> END
