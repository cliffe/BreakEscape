// ===========================================
// TOOL HELP: NIKTO
// Break Escape Universe
// ===========================================
// Educational content about nikto web scanner
// For use in training scenarios and missions
// ===========================================

=== nikto_help ===

Guide: Nikto is an open-source web server scanner that performs comprehensive tests against web servers.

Guide: Think of it as a specialized security audit tool for web applications. It checks for thousands of potentially dangerous files, outdated software, configuration issues, and known vulnerabilities.

Guide: It's been around since 2001 and is a staple in every penetration tester's toolkit.

+ [What does nikto do?]
    -> nikto_functionality

+ [How do I run a basic scan?]
    -> nikto_basic_scan

+ [What options are available?]
    -> nikto_options

+ [Show me practical examples]
    -> nikto_examples

+ [How do I read the output?]
    -> nikto_output

+ [I understand now]
    -> nikto_end

// ----------------
// Functionality
// ----------------

=== nikto_functionality ===

Guide: Nikto performs comprehensive web server security checks:

Guide: **What it detects:**
- Outdated server software versions with known vulnerabilities
- Dangerous files and programs (admin interfaces, backup files, test scripts)
- Configuration issues (directory indexing, default files)
- Insecure headers and cookies
- Over 6,700 potentially dangerous files/CGIs
- Outdated components (plugins, frameworks)
- Common vulnerabilities (XSS potential, SQL injection entry points)

Guide: **How it works:**
Nikto sends thousands of HTTP requests to the target, analyzing responses for security issues. It checks:
- Server headers and banners
- File and directory existence
- Common misconfigurations
- Known vulnerability patterns

Guide: **Strengths:**
- Fast and automated
- Comprehensive vulnerability database
- Regularly updated
- Finds issues human reviewers might miss
- Good for initial reconnaissance

Guide: **Limitations:**
- Very noisy—generates tons of log entries
- Can trigger IDS/IPS alerts
- Doesn't test authentication-protected areas
- Only tests for known issues, not zero-days
- Can produce false positives

* [How do I run nikto?]
    -> nikto_basic_scan

* [What options does it have?]
    -> nikto_options

* [Show me examples]
    -> nikto_examples

* [I'm ready to practice]
    -> nikto_end

// ----------------
// Basic scanning
// ----------------

=== nikto_basic_scan ===

Guide: The basic nikto syntax is simple:

Guide: **Most basic scan:**
```
nikto -h http://target.com
```

Guide: The `-h` flag specifies the host (target). Nikto will:
1. Identify the web server
2. Check for server vulnerabilities
3. Test for dangerous files
4. Look for configuration issues
5. Generate a detailed report

Guide: **Common variations:**

Guide: **Scan HTTPS:**
```
nikto -h https://target.com
```
Tests SSL/TLS configuration and certificate issues

Guide: **Scan specific port:**
```
nikto -h http://target.com -p 8080
```
Many applications run on non-standard ports

Guide: **Scan with custom port and SSL:**
```
nikto -h https://target.com:8443
```

Guide: **Scan multiple ports:**
```
nikto -h target.com -p 80,443,8080,8443
```
Checks all specified ports

Guide: **Basic authentication:**
```
nikto -h http://target.com -id username:password
```
For sites requiring HTTP basic auth

* [What other options are available?]
    -> nikto_options

* [Show me practical examples]
    -> nikto_examples

* [How do I read the results?]
    -> nikto_output

* [What does nikto check for?]
    -> nikto_functionality

// ----------------
// Options
// ----------------

=== nikto_options ===

Guide: Nikto offers many options to customize your scans:

Guide: **Tuning options** (`-Tuning`)
Controls which tests to run:
```
nikto -h target.com -Tuning 1
```
- 1: Interesting files
- 2: Misconfiguration
- 3: Information disclosure
- 4: Injection (XSS/script/HTML)
- 5: Remote file retrieval
- 6: Denial of service
- 7: Remote file retrieval (server-wide)
- 8: Command execution / remote shell
- 9: SQL injection
- 0: File upload
- a: Authentication bypass
- b: Software identification
- c: Remote source inclusion
- x: Reverse tuning (scan everything except specified)

Guide: **Output options:**
```
nikto -h target.com -o results.html -Format html
```
Saves results in various formats: txt, xml, html, csv, json

Guide: **Speed control:**
```
nikto -h target.com -Display V -Pause 2
```
- `-Display V`: Verbose output
- `-Pause N`: Pause N seconds between requests (reduces detection)

Guide: **SSL options:**
```
nikto -h https://target.com -ssl -nossl
```
- `-ssl`: Force SSL mode
- `-nossl`: Disable SSL

Guide: **User agent:**
```
nikto -h target.com -useragent "Mozilla/5.0..."
```
Custom user agent string to avoid detection

Guide: **Evasion techniques:**
```
nikto -h target.com -evasion 1
```
- 1: Random URI encoding
- 2: Directory self-reference (/./)
- 3: Premature URL ending
- 4: Prepend long random string
- 5: Fake parameter
- 6: TAB as request spacer
- 7: Change case in URL
- 8: Use Windows directory separator

Guide: **Mutate options:**
```
nikto -h target.com -mutate 1
```
- 1: Test all files with all root directories
- 2: Guess for password file names
- 3: Enumerate user names via Apache (/~user type requests)
- 4: Enumerate user names via cgiwrap (/cgi-bin/cgiwrap/~user type requests)
- 5: Attempt to brute force sub-domain names
- 6: Attempt to guess directory names from dictionary file

* [Show me practical examples]
    -> nikto_examples

* [How do I run a basic scan?]
    -> nikto_basic_scan

* [How do I read the output?]
    -> nikto_output

* [What does nikto do?]
    -> nikto_functionality

// ----------------
// Examples
// ----------------

=== nikto_examples ===

Guide: Let's walk through real-world scanning scenarios:

Guide: **Scenario 1: Initial web server assessment**
```
nikto -h http://192.168.1.50
```
Standard scan. Quick overview of vulnerabilities and misconfigurations.

Guide: **Scenario 2: Thorough HTTPS scan with output**
```
nikto -h https://target.com -o scan_results.html -Format html
```
Scans HTTPS site, saves detailed HTML report for later review.

Guide: **Scenario 3: Stealthy scan**
```
nikto -h target.com -Pause 5 -evasion 1 -useragent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```
Slower scan with evasion, pauses between requests, uses realistic user agent to avoid detection.

Guide: **Scenario 4: Focus on specific vulnerabilities**
```
nikto -h target.com -Tuning 9
```
Only tests for SQL injection vulnerabilities. Faster, more focused scan.

Guide: **Scenario 5: Multiple targets**
Create a file `targets.txt`:
```
http://target1.com
http://target2.com
https://target3.com:8443
```
Then scan:
```
nikto -h targets.txt -o results.html -Format html
```

Guide: **Scenario 6: Authenticated scan**
```
nikto -h http://intranet.company.com -id admin:password123
```
Scans internal site requiring HTTP basic authentication.

Guide: **Scenario 7: Complete scan with all options**
```
nikto -h https://target.com -ssl -p 443,8443 -Tuning 123456789ab -o detailed_scan.html -Format html -Display V
```
Comprehensive scan: multiple ports, all test types, detailed output, verbose display.

* [How do I read these results?]
    -> nikto_output

* [Tell me about options again]
    -> nikto_options

* [How do I do a basic scan?]
    -> nikto_basic_scan

* [What does nikto check for?]
    -> nikto_functionality

// ----------------
// Reading output
// ----------------

=== nikto_output ===

Guide: Understanding nikto output is crucial. Let's break down a typical scan:

Guide: **Header information:**
```
- Nikto v2.1.6
---------------------------------------------------------------------------
+ Target IP:          192.168.1.50
+ Target Hostname:    target.com
+ Target Port:        80
+ Start Time:         2024-01-15 10:30:00
---------------------------------------------------------------------------
```
Basic scan parameters

Guide: **Server identification:**
```
+ Server: Apache/2.4.29 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined.
+ The X-Content-Type-Options header is not set.
```
These are configuration issues—not critical but worth noting.

Guide: **Vulnerability findings:**
```
+ OSVDB-3268: /config/: Directory indexing found.
+ OSVDB-3092: /admin/: This might be interesting...
+ OSVDB-3233: /icons/README: Apache default file found.
```
Each line shows:
- OSVDB number (vulnerability database reference)
- Path found
- Description of the issue

Guide: **Critical findings look like:**
```
+ OSVDB-877: HTTP TRACE method is active, suggesting vulnerability to XST
+ /admin/login.php: Admin login page found
+ /backup.sql: Database backup file found (possible data exposure)
+ /test.php: PHP test file found (possible info disclosure)
```

Guide: **Severity assessment:**
- **Critical**: Exposed admin panels, backup files, database files, shell access
- **High**: Vulnerable software versions, dangerous files, command execution
- **Medium**: Information disclosure, configuration issues, outdated components
- **Low**: Missing security headers, directory indexing, default files

Guide: **End summary:**
```
+ 26522 requests: 0 error(s) and 14 item(s) reported on remote host
+ End Time:           2024-01-15 10:45:32 (932 seconds)
---------------------------------------------------------------------------
+ 1 host(s) tested
```

Guide: **What to prioritize:**
1. Exposed admin interfaces
2. Backup or database files accessible
3. Vulnerable software versions (check exploit databases)
4. File upload capabilities
5. Information disclosure issues
6. Configuration weaknesses

* [Show me scan examples again]
    -> nikto_examples

* [Tell me about scan options]
    -> nikto_options

* [How do I run a basic scan?]
    -> nikto_basic_scan

* [I'm ready to use nikto]
    -> nikto_end

// ----------------
// End
// ----------------

=== nikto_end ===

Guide: Important considerations for using nikto:

Guide: **Ethical usage:**
- Only scan systems you own or have written authorization to test
- Nikto is extremely noisy—it WILL be logged and detected
- Unauthorized scanning is illegal and can result in criminal charges

Guide: **Operational considerations:**
- Nikto is loud—not for stealth operations
- Can trigger IDS/IPS alerts
- May impact server performance (thousands of requests)
- Use during authorized testing windows

Guide: **Best practices:**
- Run nikto as part of a comprehensive assessment, not alone
- Verify findings manually—false positives occur
- Document all findings for your report
- Follow up critical findings with deeper testing
- Keep nikto updated (`nikto -update`)

Guide: Use nikto responsibly, professionally, and only with proper authorization.

-> END
