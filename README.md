# Break Escape: Cyber-Physical Security Learning Framework

Break Escape is an escape room-inspired games-based learning framework that simulates cyber-physical security challenges. Break Escape creates immersive experiences where learners engage with both physical and digital security mechanisms within narrative-driven scenarios explicitly mapped to the Cyber Security Body of Knowledge (CyBOK). The game is inspired by retro top-down games, dungeon crawlers, escape rooms, and cyber security challenges.


**Note: Break Escape is currently in development. Please report any issues or feedback via GitHub.**

## Live Demo

You can try Break Escape directly from your browser by visiting:
https://hacktivity.co.uk/break-escape-beta/scenario_select.html

You’ll choose from scenarios, each offering its own set of puzzles and challenges, ranging from cryptography to physical security.

After playing, please fill out a short survey. Your insights will be instrumental in improving the game and understanding the benefits. 
https://forms.gle/kiVgNUBSHu2KjcJt8 

## Features

- **Immersive Learning Environment**: Top-down 2D game environment accessible through web browsers
- **Cyber-Physical Security Challenges**: Simulations of various security mechanisms:
  - Key-based locks (with physical keys and lockpicking mini-game)
  - PIN code systems
  - Password-protected interfaces
  - Biometric authentication (fingerprints that can be dusted and spoofed)
  - Bluetooth proximity detection
- **CyberChef Integration**: Embedded cryptographic tools for encryption and data analysis
- **CyBOK Mapping**: Each scenario is explicitly mapped to relevant Cyber Security Body of Knowledge areas
- **Multiple Scenarios**: Various pre-built scenarios focusing on different security aspects:
  - "CEO Exfil Investigation" - Corporate espionage and data exfiltration
  - "Captain Meow's Disappearance" - Encoding and cryptography
  - "Encoding and Encryption Lab" - Basic cryptographic principles
  - "Asymmetric Encryption with RSA" - Public key cryptography
  - "Symmetric Encryption with AES" - Block ciphers and encryption modes
  - "Biometric Security Breach" - Fingerprint authentication

## Technical Implementation

Break Escape is implemented using:
- **Phaser.js**: Core game engine
- **JavaScript/HTML5**: Front-end implementation
- **JSON**: Scenario specification format

## Installation

Break Escape is a web-based application and requires a web server to run. You can:

### Option 1: Use the hosted version

Visit the live demo at https://hacktivity.co.uk/break-escape-beta/scenario_select.html

### Option 2: Use Python's built-in HTTP server

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/break-escape.git
   cd break-escape
   ```

2. Start a local web server:
   ```
   python3 -m http.server
   ```

3. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

### Option 3: Deploy to a web server

1. Upload all files to your web server directory
2. Access through your domain

## Usage

Start Break Escape:

- Open Break Escape in your web browser
- Choose a scenario based on your learning objectives or difficulty preference

Play the game:
- When you start a scenario, you will be given a brief of the scenario.
- You can navigate through the virtual environment using mouse clicks.
- Interact with objects by clicking on them.
- Collect items into your inventory to use later.
- Solve puzzles and progress through rooms to complete the scenario.

After playing, please fill out a short survey.
https://forms.gle/kiVgNUBSHu2KjcJt8 

### Game Controls

- **Mouse Click**: Move character, interact with objects
- **Inventory**: Click collected items to use them
- **Notes Panel**: Access important information you've discovered
- **Bluetooth Scanner**: Detect nearby Bluetooth devices (when available)
- **Biometrics Panel**: View collected fingerprint samples (when available)

## Scenario Design

Break Escape features a flexible JSON-based scenario specification format that enables educators to create custom scenarios without programming knowledge. The scenario structure includes:

- **Rooms** with connections, objects, and optional locks
- **Objects** with properties like takeable, readable, observations, and lock requirements
- **Special object types** for fingerprint collection, cryptographic analysis, and more

For detailed information on creating your own scenarios, refer to [README_scenario_design.md](README_scenario_design.md).

## License

Break Escape is dual licensed:

- **AGPL (GNU Affero General Public License)**
- **Open Government Licence**

## Acknowledgements

Break Escape was developed as an educational tool to address the "reflection gap" identified in many existing cyber security games by requiring players to actively apply security knowledge rather than merely encountering security terminology during gameplay.

The project integrates [CyberChef](https://github.com/gchq/CyberChef), an open-source web application for encryption and data analysis, allowing learners to interact with genuine cryptographic tools within the game environment.

Special thanks to the Cyber Security Body of Knowledge (CyBOK) for providing the knowledge framework that Break Escape scenarios are mapped to.

This project is supported by a Cyber Security Body of Knowledge (CyBOK) resources around CyBOK 1.1 grant (2024-2025).

---

For questions, contributions, or more information, please open an issue on the project repository.