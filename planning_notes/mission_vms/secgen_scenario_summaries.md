# SecGen Scenario Summaries

This document provides concise summaries of SecGen lab scenarios to inform BreakEscape mission designers about what players will experience on the VMs.

## 1. Introduction to Linux and Security lab

**desktop (Debian 12 KDE)**
- Victim user with weak SSH password (brute forceable from top-20-common-SSH-passwords list), has flag in home directory
- Bystander user with flag (accessible via sudo from victim account)
- SSH root login enabled
- Main user account (random mythical creature name) with sudo access

**kali**
- Kali MSF with Metasploit framework, nmap, password tools

**CTF Steps:**
- Use Hydra to brute force SSH password for "victim" account (from common password wordlists)
- SSH into victim account, find flag in home directory
- Use sudo to access bystander's flag (victim has sudo privileges)

---

## 2. Malware and an Introduction to Metasploit and Payloads

**windows_victim (Windows 7)**
- User account with secret file (`my_secret.txt`) containing sensitive data

**kali**
- Kali MSF with Metasploit framework, Apache web server, nmap, ClamAV antivirus

**CTF Steps:**
- Create remote access Trojan using msfvenom (e.g., reverse shell payload)
- Host Trojan on Apache, download and execute on Windows VM
- Use remote shell to retrieve `my_secret.txt` from Windows desktop

---

## 3. Vulnerabilities, Exploits, and Remote Access Payloads

**windows_victim (Windows 7)**
- Vulnerable Adobe Reader (CVE-2008-2992) - client-side exploit via malicious PDF
- User account with secret file (`my_secret.txt`)
- Netcat installed for testing shell connections

**linux_victim_server (Debian 12 KDE)**
- Vulnerable distcc server (CVE-2004-2687) - remote code execution, yields flag

**kali**
- Kali MSF with Metasploit framework, Apache web server, nmap

**CTF Steps:**
- Exploit remote distcc service (CVE-2004-2687) using Metasploit (exploit/unix/misc/distcc_exec)
- Find flag in distccd user's home directory

---

## 5. Information Gathering: Scanning

**linux_victim_server (Debian 12 KDE)**
- Vulnerable distcc server (CVE-2004-2687) with flag
- Multiple netcat services with flags (one base64 encoded)
- Apache HTTP server
- FTP server

**kali**
- Kali MSF with Metasploit framework, nmap, amap

**CTF Steps:**
- Scan for open ports and services
- Banner grab from netcat services to find flags (one flag is base64 encoded, needs decoding)
- Exploit distcc vulnerability (CVE-2004-2687) to find additional flag

---

## 6. From Scanning to Exploitation

**windows_server (Windows 7)**
- Vulnerable EasyFTP server (RCE vulnerability)
- Flag in `flag.txt` file

**linux_server (Debian 12 KDE)**
- Vulnerable UnrealIRC 3281 backdoor - yields flag

**kali**
- Kali MSF with Metasploit framework, Armitage, ExploitDB, nmap

**CTF Steps:**
- Scan network to identify Windows and Linux servers
- Exploit EasyFTP server on Windows (exploit/windows/ftp/easyftp_cwd_fixret), find flag in `flag.txt`
- Exploit UnrealIRC 3281 backdoor on Linux server, find flag in user home directory

---

## 7. Post-exploitation

**windows_server (Windows 7)**
- Vulnerable EasyFTP server (RCE vulnerability)
- Flag in `flag.txt` file

**linux_server (Debian 12 KDE)**
- Vulnerable distcc server (CVE-2004-2687) with flag
- Vulnerable sudoedit (privilege escalation) with flag
- Crackme user account with weak password
- Password-protected ZIP file (`/root/protected.zip`) with flag (password same as crackme user)

**kali**
- Kali MSF with Metasploit framework, Armitage, ExploitDB, nmap, password tools

**CTF Steps:**
- Exploit distcc on Linux server (CVE-2004-2687) to gain initial shell
- Use sudoedit vulnerability (CVE-2023-22809) to escalate privileges to root
- Find flags in user home directories
- Extract password hashes, crack crackme user password
- Use cracked password to decrypt `/root/protected.zip` file (contains flag)
- Exploit EasyFTP on Windows server, find flag in `flag.txt`

---

## 8. Vulnerability Analysis

**linux_server (Debian 12 KDE)**
- Vulnerable distcc server (CVE-2004-2687) with flag
- Vulnerable WordPress 4.x installation
- Vulnerable UnrealIRC 3281 backdoor
- Vulnerable sudo Baron (privilege escalation) with flag

**kali**
- Kali "Licensed Tools" with Metasploit framework, ExploitDB, nmap, Nikto, GCC

**CTF Steps:**
- Scan with Nmap NSE, Nessus, and Nikto to identify vulnerabilities
- Exploit distcc (CVE-2004-2687) to gain initial access, find flag
- Upgrade shell to Meterpreter
- Exploit sudo Baron vulnerability (CVE-2021-3156) for privilege escalation, find flag
- Find additional flags from various vulnerabilities

---

## 9. Feeling Blu

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools, Iceweasel browser (autostarts pointing to web server)

**web_server (Debian 12 KDE)**
- Bludit CMS with file upload vulnerability (image upload RCE) - yields flag
- User account (from organization data) with flag in home directory
- Vulnerable sudo root-less (privilege escalation) with flag
- Password-protected ZIP file (`/root/whatsmyname.zip`) with flag (password is organization manager's name)

**CTF Steps:**
- Scan web server with dirb and Nikto to find hidden files and admin login page
- Find leaked Bludit credentials in discovered files (or brute force with OWASP ZAP)
- Exploit Bludit file upload vulnerability (exploit/linux/http/bludit_upload_images_exec) using Metasploit
- Switch to Bludit admin user account, find flag in home directory
- Use sudo root-less vulnerability to escalate to root (exploit sudo -l to see allowed commands)
- Find flag in /root directory
- Extract organization manager's name from earlier reconnaissance, use as password to decrypt `/root/whatsmyname.zip`

---

## Access Can Roll

**shared_desktop (Debian 12 KDE)**
- Main user account (random mythical creature name) with sudo access
- Source code file `access_my_secrets.c` in home directory
- Another user account (random mythical creature name)

**server (Debian 12 KDE)**
- Same usernames and passwords as desktop (password: tiaspbiqe2r)
- Two users with shell programs that can be combined
- One user has `flag.txt`
- Another user has `access_me_flag.c`, `flag1`, and `flag2`

**CTF Steps:**
- SSH to server using same credentials as desktop
- Combine two shell programs together to get first flag
- Use hardlink trickery with `access_my_flag` program to access relative paths and get flag1 and flag2

---

## Analyse This

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**server (Debian 10 KDE)**
- User account: analyse / password: this!!!
- File `encoded_flags` with multiple encoded flags
- PCAP file `capture.pcap` containing flag
- Hidden file with flag

**CTF Steps:**
- SSH into server (username: analyse, password: this!!!)
- Decode flags from `encoded_flags` file (various encoding methods: ASCII/alpha reversible, some double-encoded)
- Analyze `capture.pcap` file to extract flag from network traffic
- Find hidden file in home directory for additional flag

---

## Banner Grab and Run For Your Life!

**desktop (Debian 9 KDE)**
- User account (random mythical creature name), password: tiaspbiqe2r
- Nmap installed

**secret_journal_server (Debian 9 KDE)**
- 5 netcat services on random ports (1024-50000 range)
- 3 flags in plaintext
- 2 flags encrypted (one double-encrypted with ASCII reversible)

**CTF Steps:**
- Scan all ports on secret_journal_server using nmap
- Connect to each discovered port using netcat to retrieve flags
- First 3 ports contain plaintext flags
- 4th port contains encrypted flag (needs decoding)
- 5th port contains double-encrypted flag (needs double decoding)

---

## Containers Escape

**desktop (Debian 9 KDE)**
- User account (random mythical creature name), password: tiaspbiqe2r
- Docker installed with multiple images
- Netcat backdoor in Docker container

**chroot_esc_server (Debian 9 KDE)**
- Chroot environment at `/opt/chroot`
- Netcat backdoor in chroot container

**CTF Steps:**
- Find way into Docker container on desktop VM
- Escape Docker container to gain root access, find flag in `/root/docker_flag`
- Find way into chroot container on chroot_esc_server
- Escape chroot container to gain root access, find flag in `/root/chroot_flag`

---

## Decode Me

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**decode_me (Debian 10 KDE)**
- NFS share with encrypted flags file
- 8 flags total: 1 double-encrypted, 7 single-encrypted (ASCII/alpha reversible encoding)

**CTF Steps:**
- Use `showmount` to discover NFS share on decode_me server
- Mount NFS share on attack VM
- Read encrypted flags file from mounted drive
- Decode all 8 flags (7 single encryption, 1 double encryption)

---

## Hackme and Crack Me

**hack_and_crack_me_server (Debian 9 KDE)**
- Vulnerable distcc server (CVE-2004-2687) - use nmap script, not Metasploit
- Readable `/etc/shadow` file (vulnerability)
- 4 user accounts with weak passwords (from jtrpassword.lst)
- 1 user account with hint: password ends in 2 digits (e.g., "round39")
- 4 leaked strings in user home directories

**second_server (Debian 9 KDE)**
- Same usernames as hack_and_crack_me_server
- 4 user accounts with flags (passwords match cracked passwords from first server)
- 1 user account with hint file and flag

**kali_cracker (Kali MSF)**
- Kali with password tools (John the Ripper), Metasploit, Armitage, nmap

**CTF Steps:**
- Exploit distcc vulnerability using nmap script (not Metasploit) to get flag
- Copy `/etc/shadow` and `/etc/passwd` from hack_and_crack_me_server to kali_cracker
- Use `unshadow` to combine passwd and shadow files
- Crack passwords using John the Ripper (john --wordlist=jtrpassword.lst)
- Find 4 leaked strings in user home directories on hack_and_crack_me_server
- SSH to second_server using cracked credentials to find 4 flags
- Crack last user password (hint: ends in 2 digits, try common words + 2-digit numbers)
- SSH to second_server with last user credentials to find final flag

---

## Nosferatu

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**server (Debian 10 KDE)**
- Vulnerable Nostromo web server (directory traversal/code execution)
- User account: nostromousr (gained via exploit)
- Vulnerable sudo root-less (privilege escalation via /bin/less)

**CTF Steps:**
- Access Nostromo web server, find 2 flags on webpage (1 plaintext, 1 hex-encoded needs decoding)
- Exploit Nostromo using Metasploit (exploit/multi/http/nostromo_code_exec) to gain shell
- Find flag in `/home/nostromousr`
- Use sudo privilege escalation: `sudo -l` shows `/bin/less` allowed, exploit to get root
- Find final flag in `/root`

---

## Putting it together

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**server (Debian 10 KDE)**
- NFS share with leaked information
- Netcat service on random port (1024-2024 range)
- User account (random mythical creature name) with strong password
- Vulnerable sudo root-awk (privilege escalation)

**CTF Steps:**
- Scan server to discover NFS share
- Mount NFS share, read file to get username and flag
- Scan for open ports, connect to random port (>1024, <2024) with netcat to get password and flag
- SSH to server using discovered credentials
- Find flag in user home directory
- Use sudo privilege escalation with awk: `sudo awk 'BEGIN {system("/bin/sh")}'` to get root
- Find final flag in `/root`

---

## Rooting for a win

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**server (Debian 10 KDE)**
- Vulnerable ProFTPD 1.3.3c backdoor (code execution)
- Flags in FTP home directory (1 plaintext, 1 binary/encoded)
- Flag in `/root` (exploit gives root access directly)

**CTF Steps:**
- Scan server to identify ProFTPD service
- Exploit ProFTPD backdoor using Metasploit (exploit/unix/ftp/proftpd_133c_backdoor)
- Use reverse_perl payload (standard reverse_tcp doesn't work)
- Find 2 flags in FTP home directory (1 plaintext, 1 needs decoding)
- Find final flag in `/root` (no privilege escalation needed, exploit gives root)

---

## Smash Crack Grab and Run

**attack_vm (Kali MSF)**
- Kali with password tools, Armitage

**server (Debian 12 KDE)**
- Vulnerable Nostromo 1.9.6 service (code execution)
- User account: nostromousr (gained via exploit)
- Password-protected ZIP file (`/home/nostromousr/protected.zip`) with weak password
- User account (random mythical creature name) with strong password
- Base64-encoded flag in last user's home directory

**CTF Steps:**
- Exploit Nostromo service using Metasploit (exploit/multi/http/nostromo_code_exec) to gain shell
- Find flag in `/home/nostromousr`
- Copy `protected.zip` from server to attack VM
- Extract hash using `zip2john protected.zip > zip.hash`
- Crack password using John the Ripper: `john zip.hash --show`
- Extract ZIP file to get credentials (username and strong password) and flag
- SSH to server using discovered credentials
- Find base64-encoded flag in user home directory, decode it

---

## Such a git

**attack_vm (Kali MSF)**
- Kali with top 10 tools, web tools

**web_server (Debian 10 KDE)**
- Vulnerable GitList 0.4.0 (argument injection RCE)
- User account (from organization data) with flag in home directory
- Vulnerable sudo root-apt-get (privilege escalation)

**CTF Steps:**
- Access GitList web interface on server
- Find username and flag leaked in GitList repository files or commit history
- Find password leaked in git/repositories/restricted
- Exploit GitList using Metasploit (exploit/multi/http/gitlist_arg_injection) to gain shell
- Find flag in user home directory
- Use sudo privilege escalation: `sudo apt-get update -o APT::Update::Pre-Invoke::=/bin/sh` to get root
- Find final flag in `/root`

