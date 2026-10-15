import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

// Bluetooth Scanner Minigame Scene implementation
export class BluetoothScannerMinigame extends MinigameScene {
    constructor(container, params) {
        // Ensure params is defined before calling parent constructor
        params = params || {};
        
        // Set default title if not provided
        if (!params.title) {
            params.title = 'Bluetooth Scanner';
        }
        
        // Enable cancel button for bluetooth scanner minigame with custom text
        params.showCancel = true;
        params.cancelText = 'Close Scanner';
        
        super(container, params);
        
        this.item = params.item;
        this.bluetoothDevices = [];
        this.lastBluetoothPanelUpdate = 0;
        this.newBluetoothDevices = 0;
        this.scanInterval = null;
        
        // Constants
        this.BLUETOOTH_SCAN_RANGE = 150; // pixels - 2 tiles range for Bluetooth scanning
        this.BLUETOOTH_SCAN_INTERVAL = 200; // Scan every 200ms for more responsive updates
        this.BLUETOOTH_UPDATE_THROTTLE = 100; // Update UI every 100ms max
    }
    
    init() {
        // Call parent init to set up common components
        super.init();
        
        console.log("Bluetooth scanner minigame initializing");
        
        // Set container dimensions to be smaller than full screen
        this.container.className += ' bluetooth-scanner-minigame-container';
        
        // Clear header content
        this.headerElement.innerHTML = '';
        
        // Configure game container with scanner background
        this.gameContainer.className += ' bluetooth-scanner-minigame-game-container';
        
        // Create scanner interface
        this.createScannerInterface();
        
        // Initialize bluetooth devices from global state
        this.initializeBluetoothDevices();
    }
    
    createScannerInterface() {
        // Create expand/collapse toggle button
        const expandToggle = document.createElement('div');
        expandToggle.className = 'bluetooth-scanner-expand-toggle';
        expandToggle.innerHTML = '▼';
        expandToggle.title = 'Expand/Collapse';
        
        // Create scanner header
        const scannerHeader = document.createElement('div');
        scannerHeader.className = 'bluetooth-scanner-header';
        scannerHeader.innerHTML = `
            <div class="bluetooth-scanner-title">
                <img src="/break_escape/assets/objects/bluetooth_scanner.png" alt="Bluetooth Scanner" class="scanner-icon">
                <span>Bluetooth Scanner</span>
            </div>
            <div class="bluetooth-scanner-status">
                <div class="scanner-indicator active"></div>
                <span>Scanning...</span>
            </div>
        `;
        
        // Create search and filter controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'bluetooth-scanner-controls';
        controlsContainer.innerHTML = `
            <div class="bluetooth-search-container">
                <input type="text" id="bluetooth-search" placeholder="Search devices..." class="bluetooth-search-input">
            </div>
            <div class="bluetooth-categories">
                <div class="bluetooth-category active" data-category="all">All</div>
                <div class="bluetooth-category" data-category="nearby">Nearby</div>
                <div class="bluetooth-category" data-category="saved">Saved</div>
            </div>
        `;
        
        // Create device list container
        const deviceListContainer = document.createElement('div');
        deviceListContainer.className = 'bluetooth-device-list-container';
        deviceListContainer.innerHTML = `
            <div class="bluetooth-device-list-header">
                <span>Detected Devices</span>
                <div class="device-count">0 devices</div>
            </div>
            <div class="bluetooth-device-list" id="bluetooth-device-list"></div>
        `;
        
        // Create instructions
        const instructionsContainer = document.createElement('div');
        instructionsContainer.className = 'bluetooth-scanner-instructions';
        instructionsContainer.innerHTML = `
            <div class="instruction-text">
                <strong>Instructions:</strong><br>
                • Walk around to detect Bluetooth devices<br>
                • Green signal bars indicate nearby devices<br>
                • Click devices to save them for later reference<br>
                • Devices in your inventory are always visible
            </div>
        `;
        
        // Assemble the interface
        this.gameContainer.appendChild(expandToggle);
        this.gameContainer.appendChild(scannerHeader);
        this.gameContainer.appendChild(controlsContainer);
        this.gameContainer.appendChild(deviceListContainer);
        this.gameContainer.appendChild(instructionsContainer);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up expand/collapse functionality
        this.setupExpandToggle(expandToggle);
    }
    
    setupEventListeners() {
        // Search functionality
        const bluetoothSearch = document.getElementById('bluetooth-search');
        if (bluetoothSearch) {
            this.addEventListener(bluetoothSearch, 'input', () => this.updateBluetoothPanel());
        }
        
        // Category filters
        const categories = this.gameContainer.querySelectorAll('.bluetooth-category');
        categories.forEach(category => {
            this.addEventListener(category, 'click', () => {
                // Remove active class from all categories
                categories.forEach(c => c.classList.remove('active'));
                // Add active class to clicked category
                category.classList.add('active');
                // Update bluetooth panel
                this.updateBluetoothPanel();
            });
        });
    }
    
    setupExpandToggle(expandToggle) {
        this.addEventListener(expandToggle, 'click', () => {
            const isExpanded = this.container.classList.contains('expanded');
            
            if (isExpanded) {
                // Collapse
                this.container.classList.remove('expanded');
                expandToggle.innerHTML = '▼';
                expandToggle.title = 'Expand';
            } else {
                // Expand
                this.container.classList.add('expanded');
                expandToggle.innerHTML = '▲';
                expandToggle.title = 'Collapse';
            }
        });
    }
    
    initializeBluetoothDevices() {
        // Initialize from global state if available
        if (window.gameState && window.gameState.bluetoothDevices) {
            this.bluetoothDevices = [...window.gameState.bluetoothDevices];
        } else {
            this.bluetoothDevices = [];
        }
        
        // Start scanning for devices
        this.startScanning();
        
        // Update the panel
        this.updateBluetoothPanel();
    }
    
    startScanning() {
        // Start the scanning interval
        this.scanInterval = setInterval(() => {
            this.checkBluetoothDevices();
        }, this.BLUETOOTH_SCAN_INTERVAL);
        
        console.log('Bluetooth scanning started');
    }
    
    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            console.log('Bluetooth scanning stopped');
        }
    }
    
    checkBluetoothDevices() {
        // Find all Bluetooth devices in the current room
        if (!window.currentPlayerRoom || !window.rooms[window.currentPlayerRoom] || !window.rooms[window.currentPlayerRoom].objects) {
            return;
        }
        
        const room = window.rooms[window.currentPlayerRoom];
        const player = window.player;
        if (!player) {
            return;
        }
        
        // Keep track of devices detected in this scan
        const detectedDevices = new Set();
        let needsUpdate = false;
        
        Object.values(room.objects).forEach(obj => {
            if (obj.scenarioData?.lockType === "bluetooth") {
                const distance = Math.sqrt(
                    Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2)
                );
                
                const deviceMac = obj.scenarioData?.mac || "Unknown";
                const deviceName = obj.scenarioData?.name || "Unknown Device";
                
                if (distance <= this.BLUETOOTH_SCAN_RANGE) {
                    detectedDevices.add(`${deviceMac}|${deviceName}`); // Use combination for uniqueness
                    
                    // Add to Bluetooth scanner panel
                    const signalStrengthPercentage = Math.max(0, Math.round(100 - (distance / this.BLUETOOTH_SCAN_RANGE * 100)));
                    // Convert percentage to dBm format (-100 to -30 dBm range)
                    const signalStrength = Math.round(-100 + (signalStrengthPercentage * 0.7)); // -100 to -30 dBm
                    const details = `Type: ${obj.scenarioData?.type || "Unknown"}\nDistance: ${Math.round(distance)} units\nSignal Strength: ${signalStrength}dBm (${signalStrengthPercentage}%)`;
                    
                    // Check if device already exists in our list (by MAC + name combination for uniqueness)
                    const existingDevice = this.bluetoothDevices.find(device => 
                        device.mac === deviceMac && device.name === deviceName
                    );
                    
                    if (existingDevice) {
                        // Update existing device details with real-time data
                        const wasNearby = existingDevice.nearby;
                        const oldSignalStrengthPercentage = existingDevice.signalStrengthPercentage || 0;
                        
                        existingDevice.details = details;
                        existingDevice.lastSeen = new Date();
                        existingDevice.nearby = true;
                        existingDevice.signalStrength = signalStrength;
                        existingDevice.signalStrengthPercentage = signalStrengthPercentage;
                        
                        // Always update if device came back into range or signal strength changed significantly
                        if (!wasNearby || Math.abs(oldSignalStrengthPercentage - signalStrengthPercentage) > 5) {
                            needsUpdate = true;
                        }
                    } else {
                        // Add as new device if not already in our list
                        const newDevice = this.addBluetoothDevice(deviceName, deviceMac, details, true);
                        if (newDevice) {
                            newDevice.signalStrength = signalStrength;
                            newDevice.signalStrengthPercentage = signalStrengthPercentage;
                            needsUpdate = true;
                        }
                    }
                }
            }
        });
        
        // Mark devices that weren't detected in this scan as not nearby
        this.bluetoothDevices.forEach(device => {
            const deviceKey = `${device.mac}|${device.name}`;
            if (device.nearby && !detectedDevices.has(deviceKey)) {
                device.nearby = false;
                device.lastSeen = new Date();
                needsUpdate = true;
            }
        });
        
        // Always update the count and sync devices when there are changes
        if (needsUpdate) {
            this.updateBluetoothCount();
            this.syncBluetoothDevices();
            
            // Update the panel UI
            const now = Date.now();
            if (now - this.lastBluetoothPanelUpdate > this.BLUETOOTH_UPDATE_THROTTLE) {
                this.updateBluetoothPanel();
                this.lastBluetoothPanelUpdate = now;
            }
        }
    }
    
    addBluetoothDevice(name, mac, details = "", nearby = true) {
        // Check if a device with the same MAC + name combination already exists
        const deviceExists = this.bluetoothDevices.some(device => device.mac === mac && device.name === name);
        
        // If the device already exists, update its nearby status
        if (deviceExists) {
            const existingDevice = this.bluetoothDevices.find(device => device.mac === mac && device.name === name);
            existingDevice.nearby = nearby;
            existingDevice.lastSeen = new Date();
            this.updateBluetoothPanel();
            this.syncBluetoothDevices();
            return null;
        }
        
        const device = {
            id: Date.now(),
            name: name,
            mac: mac,
            details: details,
            nearby: nearby,
            saved: false,
            firstSeen: new Date(),
            lastSeen: new Date(),
            signalStrength: -100, // Default to weak signal (-100 dBm)
            signalStrengthPercentage: 0 // Default to 0% for visual display
        };
        
        this.bluetoothDevices.push(device);
        this.updateBluetoothPanel();
        this.updateBluetoothCount();
        this.syncBluetoothDevices();
        
        return device;
    }
    
    updateBluetoothPanel() {
        const bluetoothContent = document.getElementById('bluetooth-device-list');
        if (!bluetoothContent) return;
        
        const searchTerm = document.getElementById('bluetooth-search')?.value?.toLowerCase() || '';
        
        // Get active category
        const activeCategory = this.gameContainer.querySelector('.bluetooth-category.active')?.dataset.category || 'all';
        
        // Store the currently hovered device, if any
        const hoveredDevice = bluetoothContent.querySelector('.bluetooth-device:hover');
        const hoveredDeviceId = hoveredDevice ? hoveredDevice.dataset.id : null;
        
        // Add Bluetooth-locked items from inventory to the main bluetoothDevices array
        if (window.inventory && window.inventory.items) {
            window.inventory.items.forEach(item => {
                if (item.scenarioData?.lockType === "bluetooth" && item.scenarioData?.locked) {
                    // Check if this device is already in our list
                    const deviceMac = item.scenarioData?.mac || "Unknown";
                    
                    // Normalize MAC address format (ensure lowercase for comparison)
                    const normalizedMac = deviceMac.toLowerCase();
                    
                    // Check if device already exists in our list (by MAC + name combination)
                    const deviceName = item.scenarioData?.name || item.name || "Unknown Device";
                    const existingDeviceIndex = this.bluetoothDevices.findIndex(device => 
                        device.mac.toLowerCase() === normalizedMac && device.name === deviceName
                    );
                    
                    if (existingDeviceIndex === -1) {
                        // Add as a new device
                        const details = `Type: ${item.scenarioData?.type || "Unknown"}\nLocation: Inventory\nStatus: Locked`;
                        
                        const newDevice = {
                            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: deviceName,
                            mac: deviceMac,
                            details: details,
                            lastSeen: new Date(),
                            nearby: true, // Always nearby since it's in inventory
                            saved: true,  // Auto-save inventory items
                            signalStrength: -30, // Max strength for inventory items (-30 dBm)
                            signalStrengthPercentage: 100, // 100% for visual display
                            inInventory: true // Mark as inventory item
                        };
                        
                        // Add to the main bluetoothDevices array
                        this.bluetoothDevices.push(newDevice);
                        console.log('Added inventory device to bluetoothDevices:', newDevice);
                        this.syncBluetoothDevices();
                    } else {
                        // Update existing device
                        const existingDevice = this.bluetoothDevices[existingDeviceIndex];
                        existingDevice.inInventory = true;
                        existingDevice.nearby = true;
                        existingDevice.signalStrength = -30; // -30 dBm for inventory items
                        existingDevice.signalStrengthPercentage = 100; // 100% for visual display
                        existingDevice.lastSeen = new Date();
                        existingDevice.details = `Type: ${item.scenarioData?.type || "Unknown"}\nLocation: Inventory\nStatus: Locked`;
                        console.log('Updated existing device with inventory info:', existingDevice);
                        this.syncBluetoothDevices();
                    }
                }
            });
        }
        
        // Filter devices based on search and category
        let filteredDevices = [...this.bluetoothDevices];
        
        // Apply category filter
        if (activeCategory === 'nearby') {
            filteredDevices = filteredDevices.filter(device => device.nearby);
        } else if (activeCategory === 'saved') {
            filteredDevices = filteredDevices.filter(device => device.saved);
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredDevices = filteredDevices.filter(device => 
                device.name.toLowerCase().includes(searchTerm) || 
                device.mac.toLowerCase().includes(searchTerm) ||
                device.details.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort devices with inventory items first, then nearby ones, then by signal strength
        filteredDevices.sort((a, b) => {
            // Inventory items first
            if (a.inInventory !== b.inInventory) {
                return a.inInventory ? -1 : 1;
            }
            
            // Then nearby items
            if (a.nearby !== b.nearby) {
                return a.nearby ? -1 : 1;
            }
            
            // For nearby devices, sort by signal strength
            if (a.nearby && b.nearby && a.signalStrength !== b.signalStrength) {
                return b.signalStrength - a.signalStrength;
            }
            
            return new Date(b.lastSeen) - new Date(a.lastSeen);
        });
        
        // Update device count
        const deviceCount = this.gameContainer.querySelector('.device-count');
        if (deviceCount) {
            deviceCount.textContent = `${filteredDevices.length} device${filteredDevices.length !== 1 ? 's' : ''}`;
        }
        
        // Clear current content
        bluetoothContent.innerHTML = '';
        
        // Add devices
        if (filteredDevices.length === 0) {
            if (searchTerm) {
                bluetoothContent.innerHTML = '<div class="bluetooth-device">No devices match your search.</div>';
            } else if (activeCategory !== 'all') {
                bluetoothContent.innerHTML = `<div class="bluetooth-device">No ${activeCategory} devices found.</div>`;
            } else {
                bluetoothContent.innerHTML = '<div class="bluetooth-device">No devices detected yet. Walk around to find Bluetooth devices.</div>';
            }
        } else {
            filteredDevices.forEach(device => {
                const deviceElement = document.createElement('div');
                deviceElement.className = 'bluetooth-device';
                deviceElement.dataset.id = device.id;
                
                // If this was the hovered device, add the hover class
                if (hoveredDeviceId && device.id === hoveredDeviceId) {
                    deviceElement.classList.add('hover-preserved');
                }
                
                // Format the timestamp
                const timestamp = new Date(device.lastSeen);
                const formattedDate = timestamp.toLocaleDateString();
                const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Get signal color based on strength
                const getSignalColor = (strength) => {
                    if (strength >= 80) return '#00cc00'; // Strong - green
                    if (strength >= 50) return '#cccc00'; // Medium - yellow
                    return '#cc5500'; // Weak - orange
                };
                
                let deviceContent = `<div class="bluetooth-device-name">
                    <span>${displayDashes(device.name)}</span>
                    <div class="bluetooth-device-icons">`;
                
                if (device.nearby && typeof device.signalStrength === 'number') {
                    // Use percentage for visual display
                    const signalPercentage = device.signalStrengthPercentage || Math.max(0, Math.round(((device.signalStrength + 100) / 70) * 100));
                    const signalColor = getSignalColor(signalPercentage);
                    
                    // Calculate how many bars should be active based on signal strength percentage
                    const activeBars = Math.ceil(signalPercentage / 20); // 0-20% = 1 bar, 21-40% = 2 bars, etc.
                    
                    deviceContent += `<div class="bluetooth-signal-bar-container">
                        <div class="bluetooth-signal-bars">`;
                    
                    for (let i = 1; i <= 5; i++) {
                        const isActive = i <= activeBars;
                        deviceContent += `<div class="bluetooth-signal-bar ${isActive ? 'active' : ''}" style="color: ${signalColor};"></div>`;
                    }
                    
                    deviceContent += `</div></div>`;
                } else if (device.nearby) {
                    // Fallback if signal strength not available
                    deviceContent += `<span class="bluetooth-device-icon"><img src="/break_escape/assets/icons/signal.png" alt="Signal" class="icon"></span>`;
                }

                if (device.saved) {
                    deviceContent += `<span class="bluetooth-device-icon"><img src="/break_escape/assets/icons/disk.png" alt="Disk" class="icon"></span>`;
                }
                
                if (device.inInventory) {
                    deviceContent += `<span class="bluetooth-device-icon"><img src="/break_escape/assets/icons/backpack.png" alt="Backpack" class="icon"></span>`;
                }

                deviceContent += `</div></div>`;
                deviceContent += `<div class="bluetooth-device-details">MAC: ${device.mac}\n${displayDashes(device.details)}</div>`;
                deviceContent += `<div class="bluetooth-device-timestamp">Last seen: ${formattedDate} ${formattedTime}</div>`;

                deviceElement.innerHTML = deviceContent;
                
                // Toggle expanded state when clicked
                this.addEventListener(deviceElement, 'click', (event) => {
                    deviceElement.classList.toggle('expanded');
                    
                    // Mark as saved when expanded
                    if (!device.saved && deviceElement.classList.contains('expanded')) {
                        if (window.playUISound) window.playUISound('card_scan');
                        device.saved = true;
                        this.updateBluetoothCount();
                        this.updateBluetoothPanel();
                        this.syncBluetoothDevices();
                    }
                });
                
                bluetoothContent.appendChild(deviceElement);
            });
        }
    }
    
    updateBluetoothCount() {
        this.newBluetoothDevices = this.bluetoothDevices.filter(device => !device.saved && device.nearby).length;
    }
    
    syncBluetoothDevices() {
        if (!window.gameState) {
            window.gameState = {};
        }
        window.gameState.bluetoothDevices = this.bluetoothDevices;
    }
    
    start() {
        super.start();
        console.log("Bluetooth scanner minigame started");
        
        // Start scanning
        this.startScanning();
    }
    
    complete(success) {
        // Stop scanning when minigame ends
        this.stopScanning();
        
        // Sync final state
        this.syncBluetoothDevices();
        
        // Call parent complete with result
        super.complete(success, this.gameResult);
    }
    
    cleanup() {
        // Stop scanning
        this.stopScanning();
        
        // Call parent cleanup
        super.cleanup();
    }
}

// Function to start the bluetooth scanner minigame
export function startBluetoothScannerMinigame(item) {
    console.log('Starting bluetooth scanner minigame with:', { item });
    
    // Make sure the minigame is registered
    if (window.MinigameFramework && !window.MinigameFramework.registeredScenes['bluetooth-scanner']) {
        window.MinigameFramework.registerScene('bluetooth-scanner', BluetoothScannerMinigame);
        console.log('Bluetooth scanner minigame registered on demand');
    }
    
    // Initialize the framework if not already done
    if (!window.MinigameFramework.mainGameScene && item && item.scene) {
        window.MinigameFramework.init(item.scene);
    }
    
    // Start the bluetooth scanner minigame with proper parameters
    const params = {
        title: 'Bluetooth Scanner',
        item: item,
        disableGameInput: false, // Allow player to move while scanner is open
        onComplete: (success, result) => {
            console.log('Bluetooth scanner minigame completed with success:', success);
        }
    };
    
    console.log('Starting bluetooth scanner minigame with params:', params);
    window.MinigameFramework.startMinigame('bluetooth-scanner', null, params);
}
