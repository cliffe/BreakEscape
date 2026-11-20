# Subsystem Descriptions — Albion Energy Storage Facility

---

## SCADA Server

The SCADA server is the central command and coordination system for the Albion facility's operational technology. It polls all PLCs and RTUs at regular intervals, aggregates process data for the HMI displays, executes automated control sequences (such as scheduled charge/discharge cycles in response to grid operator instructions), and logs all commands and state changes. The SCADA server communicates downstream to PLCs via Modbus/TCP and to RTUs via DNP3, and upstream to the historian via OPC-UA.

**Safety relevance**: The SCADA server is the primary operator interface for all control actions. If compromised, an attacker can issue arbitrary control commands to the PLCs — including charge rate adjustments, inverter switching, and breaker operations — that can create unsafe physical conditions. The SCADA server's outputs are trusted implicitly by the PLC control logic unless independent safety limits (SIS) are triggered.

**Key vulnerabilities in the Albion scenario**: The SCADA server is reachable from the enterprise IT network via legacy Modbus/TCP firewall rules and through the jump server's bidirectional RDP configuration. It uses standard Windows Server OS with limited application whitelisting and no dedicated ICS-aware endpoint protection.

---

## HMI / Engineering Workstations

Two workstations serve distinct functions: **HMI-OPS-01** is the primary operator interface, displaying real-time process data (battery state-of-charge, cell temperatures, power flows, grid connection status, alarm states) and accepting operator commands. **HMI-ENG-02** is the engineering workstation, used for PLC programming, SIS configuration, SCADA maintenance, and diagnostic tasks. HMI-ENG-02 has the vendor PLC programming environment installed and can upload/download PLC logic directly.

**Safety relevance**: The engineering workstation is the most privileged asset on the SCADA network — it can modify PLC control logic and SIS configurations, making it capable of reprogramming the physical behaviour of the entire facility. Compromise of HMI-ENG-02 is functionally equivalent to having a malicious control systems engineer on site.

**Key vulnerabilities in the Albion scenario**: HMI-ENG-02 is accessible via RDP through the jump server. Its vendor software directory is not protected by application whitelisting, allowing installation of unauthorised tools. No session recording or dual-authorisation is required for PLC programming operations. The workstation is sometimes left powered on and logged in during unmanned overnight shifts.

---

## Historian Server

The historian server records time-series process data from the SCADA server via OPC-UA: cell voltages, temperatures, charge/discharge rates, power flows, alarm events, and operator actions. This data supports regulatory reporting to OFGEM and National Grid ESO, post-incident forensic analysis, and the enterprise analytics platform used for capacity forecasting and trading decisions. Data retention is typically 12–24 months for high-resolution data, with longer retention for aggregated records.

**Safety relevance**: The historian provides the evidentiary basis for demonstrating that the facility has operated within its licensed safety parameters. Manipulation of historian data could conceal unsafe operating conditions or mask the evidence of an attack. The historian's trend data was the first digital indicator that sensor readings had been falsified — Priya Chandra identified the unnaturally flat temperature trend during the incident.

**Key vulnerabilities in the Albion scenario**: The historian is dual-homed, with network interfaces on both the SCADA and enterprise IT networks. This dual-homing was introduced for the smart grid analytics integration and is the most significant architectural weakness in the IT/OT boundary — it provides a passive data pathway that can be repurposed as an active Modbus/TCP relay.

---

## PLC-BMS (Battery Management System)

PLC-BMS governs the core battery storage operation: monitoring individual cell voltages and temperatures, managing state-of-charge calculations, controlling charge and discharge rates via inverter setpoints, operating the thermal management system (forced-air cooling), and enforcing operational limits (charge cutoff thresholds, discharge floor, temperature limits). It communicates with the SCADA server via Modbus/TCP.

**Safety relevance**: PLC-BMS is the primary control system preventing battery cells from entering unsafe operating regimes. Its charge cutoff logic prevents overcharge (which drives thermal runaway), its temperature monitoring triggers cooling responses, and its discharge floor prevents deep discharge damage. If PLC-BMS is compromised — through register manipulation or logic modification — the fundamental control barrier against battery safety failures is removed.

**Key vulnerabilities in the Albion scenario**: PLC-BMS retains factory-default credentials on its management interface. It accepts Modbus/TCP write commands from any source that can establish a TCP connection on the SCADA network — there is no command authentication or source validation. PLC programme downloads from the engineering workstation do not require code signing or dual authorisation.

---

## PLC-GRID (Grid Interface Controller)

PLC-GRID manages the facility's interface with the national electricity distribution network. It controls the bidirectional inverters (DC-to-AC and AC-to-DC conversion), manages the point-of-connection metering and protection relays, executes frequency response logic (automatically adjusting power output in response to grid frequency deviations), and coordinates with National Grid ESO dispatch instructions received via the ERP system.

**Safety relevance**: Manipulation of PLC-GRID could cause grid instability — injecting unexpected power, withdrawing load without coordination, or operating the inverters outside their rated parameters. The point-of-connection protection relays should trip if grid parameters exceed safe limits, but if the relays are also compromised or if the disturbance is within the relay tolerance band, the effect could propagate to the local distribution network.

**Key vulnerabilities in the Albion scenario**: PLC-GRID shares the same Modbus/TCP communication weaknesses as PLC-BMS. It receives dispatch instructions that ultimately originate from the enterprise ERP system, creating an indirect data dependency on the IT network.

---

## RTUs (Remote Terminal Units)

RTUs provide telemetry and basic supervisory control for ancillary systems that are either physically dispersed across the site or require simpler, more rugged control hardware. At Albion, RTUs serve the site weather station (temperature, wind speed, solar irradiance — used for thermal management forecasting), perimeter CCTV system, electrical switchyard disconnect switches, and site lighting control. RTUs communicate with the SCADA server via DNP3.

**Safety relevance**: The switchyard RTU controls high-voltage disconnect switches that can isolate the facility from the distribution network. Manipulation of these switches during a high-power transfer could cause electrical faults or equipment damage. The weather station RTU provides ambient temperature data used in battery thermal management calculations — falsification could cause the cooling system to under- or over-respond.

**Key vulnerabilities in the Albion scenario**: Several RTUs are legacy devices with limited computational resources, running outdated firmware with no capacity for modern security features. Some have web-based management interfaces with default credentials accessible from the SCADA network.

---

## Safety Instrumented System (SIS)

The SIS is a dedicated safety PLC, rated SIL 2 under IEC 61511, designed to operate independently of the main control system. It monitors critical process parameters — individual cell temperatures (via hardwired thermocouple inputs), hydrogen gas concentration (via dedicated gas detectors in the battery halls), ambient temperature, and electrical fault currents — and initiates an automatic emergency shutdown (ESD) sequence when any parameter exceeds its defined safe threshold. The ESD sequence disconnects battery racks from the inverters via DC contactors, opens AC circuit breakers, activates forced-air cooling, opens ventilation dampers, and can trigger the fixed fire suppression system.

**Safety relevance**: The SIS is the last automated safety barrier before physical hazard materialises. Its independence from the control system is a fundamental IEC 61511 design principle — the SIS must be able to shut the process down safely even if the control system is completely compromised or unavailable.

**Key vulnerabilities in the Albion scenario**: The SIS engineering port is accessible from the SCADA network segment without additional access controls. The engineering protocol does not require authentication and does not log modifications. A firmware update addressing this vulnerability is available but unapplied due to the IEC 61511 recertification requirement. If both the control system (PLC-BMS) and the SIS are compromised, only the hardwired ESD pushbutton system remains as a safety barrier — and that requires human action.

---

## Field Sensors and Actuators

Field devices are the physical interface between the digital control systems and the battery storage process. **Sensors** include: cell-level thermocouples (temperature), cell voltage monitors, DC bus current transducers, hydrogen gas detectors, ambient temperature and humidity sensors, and switchyard protection relay inputs. **Actuators** include: DC contactors (isolating individual battery racks or the entire DC bus), AC circuit breakers (grid-side isolation), bidirectional inverter control interfaces, cooling fan motor controllers, and ventilation damper actuators.

**Safety relevance**: Sensors provide the ground truth that all higher-level control and safety decisions depend on. If sensor readings are falsified at the PLC register level (as in the Albion incident), the control system and SIS both lose their connection to physical reality. Actuators execute the safety-critical actions — if a contactor fails to open on command, the ESD sequence fails to isolate the hazardous energy source.

**Key vulnerabilities in the Albion scenario**: Field sensors feed into PLC input registers that can be overwritten by an attacker with write access to the PLC. The control system has no independent mechanism to validate whether a register value reflects the actual sensor reading or a value injected by an attacker. Analog instruments (wall-mounted thermometers) that are independent of the digital system provided the critical detection mechanism in this incident.
