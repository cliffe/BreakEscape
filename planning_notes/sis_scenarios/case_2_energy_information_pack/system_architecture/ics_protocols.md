# ICS Protocols — Albion Energy Storage Facility

A reference sheet covering the industrial communication protocols used at the Albion facility, their functions, security characteristics, and relevance to the attack scenarios.

---

## Modbus/TCP

### Function

Modbus is the primary communication protocol between the SCADA server and the two PLC clusters (PLC-BMS and PLC-GRID) at the Albion facility. Originally developed in 1979 as a serial protocol (Modbus RTU/ASCII), the TCP/IP variant (Modbus/TCP) runs over standard Ethernet and uses TCP port 502. The protocol operates on a client-server (master-slave) model: the SCADA server polls PLC registers at regular intervals to read process values (cell temperature, state-of-charge, charge rate, grid frequency) and writes to registers when issuing control commands (set charge rate, open contactor, adjust inverter setpoint).

Modbus data is organised into four register types: coils (single-bit read/write), discrete inputs (single-bit read-only), holding registers (16-bit read/write), and input registers (16-bit read-only). At Albion, the PLC-BMS holding registers contain the battery state-of-charge, cell temperature, and charge/discharge setpoint values that were falsified during the attack.

### Security Vulnerabilities

Modbus/TCP has no built-in security mechanisms. Specifically:

- **No authentication**: Any device that can establish a TCP connection to port 502 on a PLC can read and write registers. There is no concept of user identity, session token, or access control.
- **No encryption**: All data travels in plaintext, including register values and command payloads. Passive interception reveals the complete state of the controlled process.
- **No integrity verification**: Messages carry no cryptographic signature or checksum beyond basic TCP error checking. Commands can be spoofed, replayed, or modified in transit.
- **No authorisation model**: There is no distinction between read and write permissions, no concept of "operator" vs. "engineer" vs. "attacker" — all connections are equally privileged.

### Attack Technique: Register Value Injection

An attacker with network access to a PLC's Modbus/TCP port can issue Write Multiple Registers (function code 16) commands to overwrite sensor readings in PLC holding registers. In the Albion scenario, this technique was used to replace actual cell temperature values (36°C and rising) with falsified values (28°C constant), blinding the operator and control system to the developing thermal excursion. Because Modbus provides no source authentication, the PLC cannot distinguish between a legitimate command from the SCADA server and an identical command from an attacker-controlled host.

---

## DNP3 (Distributed Network Protocol 3)

### Function

DNP3 is used at Albion for communication between the SCADA server and the Remote Terminal Units (RTUs) that manage ancillary systems: the electrical switchyard, site weather station, and perimeter CCTV. DNP3 was designed specifically for SCADA/telemetry applications in the electric utility sector and provides features not available in Modbus, including event-driven reporting (reporting by exception rather than polling), time-stamped data points, and support for multiple data types.

At Albion, DNP3 carries switchyard disconnect switch status, weather telemetry for thermal management, and performs supervisory control of the switchyard protection relays. DNP3 typically runs over TCP/IP (port 20000) in the Albion configuration.

### Security Vulnerabilities

DNP3 was designed before cybersecurity was a primary concern for OT networks:

- **Limited authentication**: The DNP3 Secure Authentication extension (SA v5, defined in IEEE 1815-2012) adds challenge-response authentication to critical commands. However, many legacy DNP3 implementations — including some of the RTUs at Albion — do not support SA and accept commands without authentication.
- **No encryption in base protocol**: Standard DNP3 traffic is unencrypted. The Secure Authentication extension protects message integrity but does not encrypt the data payload.
- **Configuration complexity**: Implementing DNP3 Secure Authentication requires coordinated configuration across all communication partners, and misconfigurations can cause operational disruption — a barrier to adoption in facilities with mixed-age equipment.

### Attack Technique: Unsolicited Response Injection

An attacker can craft malicious DNP3 unsolicited response messages — messages that appear to originate from an RTU reporting a state change — to inject false telemetry data into the SCADA server. For example, injecting a false switchyard disconnect status could cause the operator to believe that the facility has been islanded from the grid when it has not, or vice versa, potentially leading to unsafe switching operations.

---

## IEC 61850

### Function

IEC 61850 is the international standard for communication networks and systems in electrical substations. At the Albion facility, IEC 61850 governs communication within the electrical switchyard and between the protection relays, circuit breakers, and the substation automation system that manages the grid connection point. The protocol uses GOOSE (Generic Object-Oriented Substation Event) messages for fast, time-critical protection signalling (e.g., fault detection triggering a circuit breaker trip within milliseconds) and MMS (Manufacturing Message Specification) for client-server data exchange with the SCADA system.

IEC 61850 GOOSE messages are multicast Ethernet frames sent directly at Layer 2 — they do not traverse IP routers, which confines them to the local substation network segment. This architectural property provides some inherent isolation from IP-based attacks.

### Security Vulnerabilities

- **GOOSE messages are unauthenticated by default**: GOOSE frames carry no digital signature in the base protocol. IEC 62351-6 defines GOOSE authentication extensions, but adoption is limited due to the computational overhead on resource-constrained protection relays and the real-time latency requirements (GOOSE must be processed within 4 ms).
- **Layer 2 broadcast domain**: GOOSE messages are broadcast to all devices on the substation LAN segment. An attacker with access to this segment can inject spoofed GOOSE frames that mimic protection commands.

### Attack Technique: GOOSE Frame Spoofing

An attacker who gains access to the switchyard Ethernet segment can broadcast spoofed GOOSE messages that override a circuit breaker's status or trip signal. By incrementing the state number in the spoofed GOOSE frame above the legitimate frame's state number, the attacker can force receiving devices to accept the spoofed message as the most current. This could be used to prevent a protection relay from tripping a circuit breaker during a genuine fault condition, or to cause a false trip that disconnects the facility from the grid.

---

## OPC-UA (Open Platform Communications Unified Architecture)

### Function

OPC-UA is used at Albion for data exchange between the SCADA server and the historian server. It replaces the older OPC Classic (COM/DCOM-based) protocol with a platform-independent, service-oriented architecture that supports structured data modelling, historical data access, and pub-sub communication patterns. The historian uses OPC-UA Historical Data Access (HDA) to retrieve time-series records from the SCADA server, and the enterprise analytics platform queries the historian via OPC-UA for capacity forecasting and trading decision support.

OPC-UA is the protocol that bridges the SCADA operations zone and the enterprise analytics environment — it is the data integration layer of the smart grid upgrade.

### Security Vulnerabilities

OPC-UA was designed with security as a core feature — unlike Modbus and DNP3, it supports transport-layer encryption (TLS), application-layer authentication (X.509 certificates), and role-based access control. However, security is optional and configuration-dependent:

- **Insecure configurations**: OPC-UA supports a "None" security mode for backward compatibility. If the historian-SCADA connection is configured with security mode "None" (as it commonly is during initial deployment, and as it was at Albion), all data flows in plaintext without authentication.
- **Certificate management**: Proper OPC-UA security requires a certificate infrastructure. In many OT environments, the operational overhead of certificate management leads to the use of self-signed certificates or no certificates at all.

### Attack Technique: Session Hijacking / Data Manipulation

If the OPC-UA connection between the historian and SCADA server uses security mode "None", an attacker who can interpose on the network (e.g., from the dual-homed historian) can intercept or modify data in transit. This could be used to corrupt historian records — removing evidence of an attack or injecting false historical data to disguise anomalous operating patterns. In the Albion scenario, the OPC-UA connection provided the passive reconnaissance pathway through which the attacker identified PLC register addresses and safety thresholds by observing the historian's data queries.
