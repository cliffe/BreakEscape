// Debug System
// Handles debug mode and debug logging

// Debug system variables
let debugMode = false;
let debugLevel = 1; // 1 = basic, 2 = detailed, 3 = verbose
let visualDebugMode = false; // Off by default; toggle with backtick key at runtime

// Expose current visual-debug state globally so other modules (player.js,
// npc-behavior.js) can read it without an import.
window.breakEscapeDebug = visualDebugMode;
window.pathfindingDebug  = visualDebugMode;

// Initialize the debug system
export function initializeDebugSystem() {
    // Listen for backtick key to toggle debug mode
    document.addEventListener('keydown', function(event) {
        // Toggle debug mode with backtick
        if (event.key === '`') {
            if (event.shiftKey) {
                // Toggle console debug mode with Shift+backtick
                debugMode = !debugMode;
                console.log(`%c[DEBUG] === CONSOLE DEBUG MODE ${debugMode ? 'ENABLED' : 'DISABLED'} ===`, 
                           `color: ${debugMode ? '#00AA00' : '#DD0000'}; font-weight: bold;`);
            } else if (event.ctrlKey) {
                // Cycle through debug levels with Ctrl+backtick
                if (debugMode) {
                    debugLevel = (debugLevel % 3) + 1; // Cycle through 1, 2, 3
                    console.log(`%c[DEBUG] === DEBUG LEVEL ${debugLevel} ===`, 
                               `color: #0077FF; font-weight: bold;`);
                }
            } else {
                // Regular backtick toggles visual debug mode (collision boxes, NPC/player paths)
                visualDebugMode = !visualDebugMode;
                // Keep global flags in sync so player.js and npc-behavior.js pick up the change
                window.breakEscapeDebug = visualDebugMode;
                window.pathfindingDebug  = visualDebugMode;
                console.log(`%c[DEBUG] === VISUAL DEBUG MODE ${visualDebugMode ? 'ENABLED' : 'DISABLED'} ===`, 
                           `color: ${visualDebugMode ? '#00AA00' : '#DD0000'}; font-weight: bold;`);
                console.log('%c  Backtick    → visual debug (player/NPC paths, collision boxes, patrol routes)', 'color:#888');
                console.log('%c  Shift+`    → console debug mode', 'color:#888');
                console.log('%c  Visualizations:', 'color:#888; font-weight: bold;');
                console.log('%c    • Blue line/circles = NPC patrol path and waypoints', 'color:#2255dd');
                console.log('%c    • Magenta circle = patrol target waypoint', 'color:#ff00ff');
                console.log('%c    • Red/dashed = NPC chase path (hostile NPCs)', 'color:#ff2222');
                
                // Update physics debug display if game exists
                updatePhysicsDebugDisplay();
            }
        }
    });
    
    console.log('Debug system initialized (visual debug OFF — press ` to toggle)');
}

// Function to update physics debug display
function updatePhysicsDebugDisplay() {
    if (window.game && window.game.scene && window.game.scene.scenes && window.game.scene.scenes[0]) {
        const scene = window.game.scene.scenes[0];
        if (scene.physics && scene.physics.world) {
            // Visual debug (collision boxes, movement vectors) is controlled by visualDebugMode only
            scene.physics.world.drawDebug = visualDebugMode;
        }
    }
}

// Debug logging function that only logs when debug mode is active
export function debugLog(message, data = null, level = 1) {
    if (!debugMode || debugLevel < level) return;
    
    // Check if the first argument is a string
    if (typeof message === 'string') {
        // Create the formatted debug message
        const formattedMessage = `[DEBUG] === ${message} ===`;
        
        // Determine color based on message content
        let color = '#0077FF'; // Default blue for general info
        let fontWeight = 'bold';
        
        // Success messages - green
        if (message.includes('SUCCESS') || 
            message.includes('UNLOCKED') || 
            message.includes('NOT LOCKED')) {
            color = '#00AA00'; // Green
        }
        // Error/failure messages - red
        else if (message.includes('FAIL') || 
                 message.includes('ERROR') || 
                 message.includes('NO LOCK REQUIREMENTS FOUND')) {
            color = '#DD0000'; // Red
        }
        // Sensitive information - purple
        else if (message.includes('PIN') || 
                 message.includes('PASSWORD') || 
                 message.includes('KEY') ||
                 message.includes('LOCK REQUIREMENTS')) {
            color = '#AA00AA'; // Purple
        }
        
        // Add level indicator to the message
        const levelIndicator = level > 1 ? ` [L${level}]` : '';
        const finalMessage = formattedMessage + levelIndicator;
        
        // Log with formatting
        if (data) {
            console.log(`%c${finalMessage}`, `color: ${color}; font-weight: ${fontWeight};`, data);
        } else {
            console.log(`%c${finalMessage}`, `color: ${color}; font-weight: ${fontWeight};`);
        }
    } else {
        // If not a string, just log as is
        console.log(message, data);
    }
}

// Function to initialize physics debug display (called when game starts)
export function initializePhysicsDebugDisplay() {
    updatePhysicsDebugDisplay();
}

// Export for global access
window.debugLog = debugLog;
window.initializePhysicsDebugDisplay = initializePhysicsDebugDisplay; 