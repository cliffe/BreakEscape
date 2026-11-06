# VM Infrastructure Setup Guide

**Mission:** Mission 3 - Ghost in the Machine
**Purpose:** Docker-based vulnerable VM network for technical challenges
**Network:** 192.168.100.0/24
**Date Created:** 2025-12-27

---

## Overview

Mission 3 requires a vulnerable virtual machine network for players to practice network reconnaissance, banner grabbing, and service exploitation. This guide documents the Docker container setup for the training network used by Zero Day Syndicate.

**Architecture:** Docker Compose multi-container setup
**Network Isolation:** Internal Docker network (192.168.100.0/24)
**Security:** Containers are isolated from host network, intentionally vulnerable services contained

---

## Network Topology

```
┌─────────────────────────────────────────────────────┐
│ Docker Bridge Network: 192.168.100.0/24            │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │ .10          │  │ .20          │  │ .30          │
│  │ FTP Server   │  │ distcc       │  │ HTTP Server  │
│  │ ProFTPD 1.3.5│  │ (vulnerable) │  │ Apache 2.4   │
│  └──────────────┘  └──────────────┘  └──────────────┘
│                                                     │
│  Player VM Terminal accesses this network via       │
│  Docker network interface                           │
└─────────────────────────────────────────────────────┘
```

**IP Assignments:**
- `192.168.100.10` - FTP Server (ProFTPD 1.3.5)
- `192.168.100.20` - distcc Service (CVE-2004-2687)
- `192.168.100.30` - HTTP Server (Apache with Base64 pricing data)

---

## Docker Compose Configuration

### File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # FTP Server - ProFTPD 1.3.5 (Banner Grabbing Target)
  ftp-server:
    image: proftpd:1.3.5
    container_name: m03_ftp_server
    networks:
      zeroday_network:
        ipv4_address: 192.168.100.10
    ports:
      - "21:21"  # FTP port (only exposed within Docker network)
    environment:
      - PROFTPD_SERVER_NAME=WhiteHat Training FTP
    volumes:
      - ./ftp-data:/var/ftp
      - ./proftpd.conf:/etc/proftpd/proftpd.conf:ro
    restart: unless-stopped

  # distcc Service - Intentionally Vulnerable (Exploitation Target)
  distcc-server:
    build:
      context: ./distcc
      dockerfile: Dockerfile
    container_name: m03_distcc_server
    networks:
      zeroday_network:
        ipv4_address: 192.168.100.20
    ports:
      - "3632:3632"  # distcc default port
    restart: unless-stopped

  # HTTP Server - Apache with Base64 Encoded Pricing Data
  http-server:
    image: httpd:2.4
    container_name: m03_http_server
    networks:
      zeroday_network:
        ipv4_address: 192.168.100.30
    ports:
      - "80:80"
    volumes:
      - ./http-data:/usr/local/apache2/htdocs:ro
    restart: unless-stopped

networks:
  zeroday_network:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.100.0/24
```

---

## Service Configurations

### 1. FTP Server (ProFTPD 1.3.5)

**Purpose:** Banner grabbing target for intelligence gathering

**File: `proftpd.conf`**

```conf
ServerName "WhiteHat Training FTP"
ServerType standalone
DefaultServer on
Port 21

# Display banner for reconnaissance
ServerIdent on "220 ProFTPD 1.3.5 Server (WhiteHat Security Training Network)"

# Basic user setup
User nobody
Group nogroup

# Allow anonymous FTP (read-only)
<Anonymous /var/ftp>
  User ftp
  Group ftp
  UserAlias anonymous ftp

  <Limit WRITE>
    DenyAll
  </Limit>
</Anonymous>

# Logging
SystemLog /var/log/proftpd/proftpd.log
TransferLog /var/log/proftpd/xferlog
```

**Flag Trigger:** Player connects via netcat and captures banner
- Command: `nc 192.168.100.10 21`
- Expected output: `220 ProFTPD 1.3.5 Server (WhiteHat Security Training Network)`
- Flag: `flag{ftp_intel_gathered}`

**File: `ftp-data/README.txt`**
```
WhiteHat Security Training Network
FTP Server - For Authorized Personnel Only

This is a training environment for penetration testing students.
Exploit research is conducted on isolated vulnerable services.

Client codename references:
- GHOST (Ransomware Incorporated)
- FABRIC (Social Fabric)
- MASS (Critical Mass)
```

---

### 2. distcc Service (Vulnerable)

**Purpose:** Exploitation target demonstrating remote code execution

**File: `distcc/Dockerfile`**

```dockerfile
FROM debian:buster

# Install distcc 2.18.3 (vulnerable version)
RUN apt-get update && \
    apt-get install -y \
    gcc \
    make \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download and compile vulnerable distcc
WORKDIR /tmp
RUN wget http://distcc.org/download/distcc-2.18.3.tar.gz && \
    tar -xzf distcc-2.18.3.tar.gz && \
    cd distcc-2.18.3 && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd / && rm -rf /tmp/*

# Create operational logs directory
RUN mkdir -p /var/log/zeroday

# Add simulated operational logs (M2 evidence)
COPY operational_logs.txt /var/log/zeroday/sales_log.txt

# Expose distcc port
EXPOSE 3632

# Start distcc daemon (vulnerable to CVE-2004-2687)
CMD ["/usr/bin/distccd", "--daemon", "--no-detach", "--allow", "0.0.0.0/0", "--log-level", "debug"]
```

**File: `distcc/operational_logs.txt`**

```
Zero Day Syndicate - Operational Sales Log
Q2-Q3 2024 Exploit Transactions

Date: 2024-05-15
Exploit: ProFTPD 1.3.5 Backdoor (CVE-2010-4652)
Client: GHOST (Ransomware Incorporated)
Target Sector: Healthcare
Base Price: $9,615
Healthcare Premium: +30% ($2,885)
Total: $12,500
Status: Delivered
Notes: Client requested SCADA-adjacent infrastructure exploits.
       Deployment confirmed at St. Catherine's Regional Medical Center.

Date: 2024-06-20
Exploit: Apache Struts RCE (CVE-2017-5638)
Client: FABRIC (Social Fabric)
Target Sector: Government
Base Price: $15,000
Government Premium: +50% ($7,500)
Total: $22,500
Status: Delivered

Date: 2024-07-08
Exploit: Microsoft Exchange ProxyShell (CVE-2021-34473)
Client: MASS (Critical Mass)
Target Sector: Finance
Base Price: $18,000
Finance Premium: +40% ($7,200)
Total: $25,200
Status: Delivered
```

**Exploitation Flow:**
1. Player scans network: `nmap -sV 192.168.100.0/24`
2. Discovers distcc on port 3632
3. Exploits using Metasploit or manual command injection
4. Gains access to `/var/log/zeroday/sales_log.txt`
5. Submits flag: `flag{distcc_legacy_compromised}`
6. Operational logs appear in game, triggering M2 revelation

**CVE-2004-2687 Explanation:**
distcc allows arbitrary command execution due to insufficient input validation. Attackers can execute shell commands on the server by sending specially crafted requests.

---

### 3. HTTP Server (Apache)

**Purpose:** Host encoded pricing intelligence data

**File: `http-data/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
    <title>WhiteHat Security - Training Portal</title>
</head>
<body>
    <h1>WhiteHat Security Services</h1>
    <h2>Penetration Testing Training Network</h2>
    <p>Welcome to the WhiteHat Security training environment.</p>
    <p>This network is used for authorized security research and training.</p>

    <h3>Available Resources:</h3>
    <ul>
        <li><a href="/docs/network_diagram.txt">Network Topology</a></li>
        <li><a href="/pricing/data.txt">Pricing Structure</a></li>
    </ul>
</body>
</html>
```

**File: `http-data/pricing/data.txt`**

```
WmVybyBEYXkgU3luZGljYXRlIC0gUHJpY2luZyBTdHJ1Y3R1cmUgKEJhc2U2NCBFbmNvZGVkKQoKQmFzZSBQcmljaW5nOgotIExvdyBDb21wbGV4aXR5IEV4cGxvaXRzOiAkNSwwMDAgLSAkMTAsMDAwCi0gTWVkaXVtIENvbXBsZXhpdHk6ICQxMCwwMDAgLSAkMjUsMDAwCi0gSGlnaCBDb21wbGV4aXR5OiAkMjUsMDAwIC0gJDEwMCwwMDAKClNlY3RvciBQcmVtaXVtczoKLSBIZWFsdGhjYXJlOiArMzAlCi0gRmluYW5jZTogKzQwJQotIEdvdmVybm1lbnQ6ICs1MCUKLSBFbmVyZ3k6ICs2MCUKLSBDcml0aWNhbCBJbmZyYXN0cnVjdHVyZTogKzcwJQoKQ2xpZW50IENvZGVuYW1lczoKLSBHSE9TVCA9IFJhbnNvbXdhcmUgSW5jb3Jwb3JhdGVkCi0gRkFCUklDID0gU29jaWFsIEZhYnJpYwotIE1BU1MgPSBDcml0aWNhbCBNYXNz
```

**Decoded Content:**
```
Zero Day Syndicate - Pricing Structure (Base64 Encoded)

Base Pricing:
- Low Complexity Exploits: $5,000 - $10,000
- Medium Complexity: $10,000 - $25,000
- High Complexity: $25,000 - $100,000

Sector Premiums:
- Healthcare: +30%
- Finance: +40%
- Government: +50%
- Energy: +60%
- Critical Infrastructure: +70%

Client Codenames:
- GHOST = Ransomware Incorporated
- FABRIC = Social Fabric
- MASS = Critical Mass
```

**Challenge Flow:**
1. Player discovers HTTP server at 192.168.100.30
2. Browses to `/pricing/data.txt`
3. Recognizes Base64 encoding
4. Uses CyberChef workstation to decode
5. Submits flag: `flag{pricing_intel_decoded}`

---

## Setup Instructions

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 1.29+
- 2GB available RAM
- Network isolation from production environment

### Installation Steps

1. **Create project directory:**
```bash
mkdir -p m03_ghost_vm_network
cd m03_ghost_vm_network
```

2. **Create directory structure:**
```bash
mkdir -p ftp-data distcc http-data/pricing
```

3. **Copy configuration files:**
- Save `docker-compose.yml` to project root
- Save `proftpd.conf` to project root
- Save `distcc/Dockerfile` to `distcc/` directory
- Save `distcc/operational_logs.txt` to `distcc/` directory
- Save HTML/text files to appropriate `http-data/` directories

4. **Build and start containers:**
```bash
docker-compose up -d
```

5. **Verify network:**
```bash
docker-compose ps
docker network inspect m03_ghost_vm_network_zeroday_network
```

6. **Test connectivity from player VM terminal:**
```bash
# From game's VM terminal interface
nmap -sV 192.168.100.0/24
nc 192.168.100.10 21
curl http://192.168.100.30/pricing/data.txt
```

### Teardown

```bash
docker-compose down
docker network prune
```

---

## Integration with Game

### VM Terminal Access

The game's VM terminal should have network access to the Docker bridge network. This can be achieved through:

**Option 1: Docker Network Sharing**
- Game VM container joins `zeroday_network`
- Direct IP access to 192.168.100.x hosts

**Option 2: Port Forwarding**
- Expose container ports to host
- Game VM accesses via localhost:port
- Less realistic but simpler setup

**Recommended:** Option 1 for realistic network topology

### Flag Validation

**Flag Submission Flow:**
1. Player completes VM challenge (nmap, netcat, exploitation)
2. Terminal displays flag (e.g., `flag{ftp_intel_gathered}`)
3. Player submits flag at drop-site terminal
4. Game validates flag against objectives.json
5. Ink script `m03_terminal_dropsite.ink` triggers narrative response
6. distcc flag specifically triggers M2 revelation event

**Flag List:**
- `flag{network_scan_complete}` - nmap scan completed
- `flag{ftp_intel_gathered}` - FTP banner captured
- `flag{pricing_intel_decoded}` - HTTP Base64 pricing decoded
- `flag{distcc_legacy_compromised}` - distcc exploitation successful (triggers M2 revelation)

---

## Security Considerations

### Isolation

**CRITICAL:** This network contains intentionally vulnerable services.

- ✅ Docker network isolated from host network
- ✅ Containers do NOT expose ports to 0.0.0.0 (host machine)
- ✅ No outbound internet access from vulnerable containers
- ✅ User permissions minimized (non-root where possible)

### Firewall Rules

If deploying in cloud/production environment:

```bash
# Block external access to vulnerable services
iptables -A INPUT -p tcp --dport 21 -j DROP
iptables -A INPUT -p tcp --dport 3632 -j DROP
iptables -A INPUT -p tcp --dport 80 -j DROP

# Allow only from game server subnet
iptables -I INPUT -p tcp -s <GAME_SERVER_IP> --dport 21 -j ACCEPT
iptables -I INPUT -p tcp -s <GAME_SERVER_IP> --dport 3632 -j ACCEPT
iptables -I INPUT -p tcp -s <GAME_SERVER_IP> --dport 80 -j ACCEPT
```

### Monitoring

Monitor container logs for unexpected activity:

```bash
docker-compose logs -f
```

Set up alerts for:
- Unexpected external connections
- Resource exhaustion
- Container restart loops

---

## Troubleshooting

### Common Issues

**Issue:** Containers can't communicate
- **Solution:** Verify Docker network: `docker network inspect m03_ghost_vm_network_zeroday_network`
- Check IP assignments match `docker-compose.yml`

**Issue:** FTP banner not appearing
- **Solution:** Check ProFTPD config syntax: `docker exec m03_ftp_server proftpd -t`
- Restart container: `docker-compose restart ftp-server`

**Issue:** distcc exploitation failing
- **Solution:** Verify distcc version 2.18.3 installed
- Check logs: `docker logs m03_distcc_server`
- Ensure `--allow 0.0.0.0/0` flag present

**Issue:** Player VM can't reach Docker network
- **Solution:** Add player VM to Docker network:
  ```bash
  docker network connect zeroday_network <player_vm_container>
  ```

---

## Testing Checklist

Before deployment, verify:

- [ ] All containers start successfully
- [ ] IP addresses assigned correctly (192.168.100.10, .20, .30)
- [ ] FTP banner shows "ProFTPD 1.3.5" when connecting via netcat
- [ ] HTTP server serves Base64 encoded pricing data
- [ ] distcc service responds on port 3632
- [ ] Operational logs accessible after distcc exploitation
- [ ] Network isolated from external internet
- [ ] Firewall rules configured (if production environment)
- [ ] Flag validation works in game
- [ ] M2 revelation event triggers after distcc flag

---

## Maintenance

### Updates

**DO NOT** update vulnerable service versions:
- ProFTPD must remain 1.3.5
- distcc must remain 2.18.3
- Apache can be updated (no known vulnerabilities used)

### Backups

Configuration files to version control:
- `docker-compose.yml`
- `proftpd.conf`
- `distcc/Dockerfile`
- `distcc/operational_logs.txt`
- All `http-data/` content

Data volumes (if persistent data needed):
- `ftp-data/` directory

---

## Educational Notes

### Learning Objectives Supported

This VM network enables players to:

1. **Network Reconnaissance**
   - Use nmap for service discovery
   - Understand CIDR notation (/24)
   - Identify open ports and service versions

2. **Banner Grabbing**
   - Use netcat for manual service enumeration
   - Understand information disclosure via banners
   - Correlate version information with CVE databases

3. **Service Exploitation**
   - Understand CVE-2004-2687 (distcc RCE)
   - Practice responsible exploit usage (isolated environment)
   - Connect technical exploitation to narrative impact

4. **Intelligence Correlation**
   - Combine digital evidence (logs) with physical evidence (from rooms)
   - Understand how attackers monetize vulnerabilities
   - Recognize attack attribution patterns

### Real-World Parallels

- **Zero Day Markets:** Underground exploit marketplaces exist (Zerodium, etc.)
- **Sector Premiums:** Real exploits command higher prices for critical sectors
- **Healthcare Attacks:** Ransomware targeting hospitals is a real threat (see: Change Healthcare 2024)

---

**Documentation Version:** 1.0
**Last Updated:** 2025-12-27
**For:** Mission 3 - Ghost in the Machine (Stage 9 Implementation)
