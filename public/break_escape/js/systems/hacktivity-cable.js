/**
 * Hacktivity ActionCable Integration
 * 
 * Handles real-time communication with Hacktivity's ActionCable channels
 * for VM console file delivery and other asynchronous events.
 * 
 * This module is only loaded when in Hacktivity mode.
 */

class HacktivityCable {
    constructor() {
        this.cable = null;
        this.consoleChannel = null;
        this.pendingConsoleRequests = new Map(); // requestId -> { resolve, reject, timeout }
        this.consoleRequestCounter = 0;
        
        this.initialize();
    }
    
    /**
     * Initialize ActionCable connection
     */
    initialize() {
        // Check if ActionCable is available (loaded by Rails/Hacktivity)
        if (typeof ActionCable === 'undefined') {
            console.warn('[HacktivityCable] ActionCable not available - console features disabled');
            return;
        }
        
        // Create cable consumer
        this.cable = ActionCable.createConsumer();
        
        // Subscribe to console channel
        this.subscribeToConsoleChannel();
        
        console.log('[HacktivityCable] Initialized');
    }
    
    /**
     * Subscribe to the VM console channel
     */
    subscribeToConsoleChannel() {
        if (!this.cable) return;
        
        this.consoleChannel = this.cable.subscriptions.create(
            { channel: 'ConsoleChannel' },
            {
                connected: () => {
                    console.log('[HacktivityCable] Connected to ConsoleChannel');
                },
                
                disconnected: () => {
                    console.log('[HacktivityCable] Disconnected from ConsoleChannel');
                },
                
                received: (data) => {
                    this.handleConsoleData(data);
                }
            }
        );
    }
    
    /**
     * Handle received console data
     * @param {Object} data - Console file data from ActionCable
     */
    handleConsoleData(data) {
        console.log('[HacktivityCable] Received console data:', data);
        
        // Expected format from Hacktivity:
        // { type: 'console_file', vm_id: 123, filename: 'console.vv', content: '...base64...' }
        if (data.type === 'console_file') {
            // Find pending request for this VM
            const pendingKey = `vm_${data.vm_id}`;
            const pending = this.pendingConsoleRequests.get(pendingKey);
            
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingConsoleRequests.delete(pendingKey);
                pending.resolve({
                    success: true,
                    filename: data.filename,
                    content: data.content,
                    contentType: data.content_type || 'application/x-virt-viewer'
                });
            } else {
                // No pending request - may be a broadcast or late response
                // Trigger download anyway
                this.downloadConsoleFile(data);
            }
        } else if (data.type === 'console_error') {
            const pendingKey = `vm_${data.vm_id}`;
            const pending = this.pendingConsoleRequests.get(pendingKey);
            
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingConsoleRequests.delete(pendingKey);
                pending.reject(new Error(data.message || 'Console file generation failed'));
            }
        }
    }
    
    /**
     * Request console file for a VM
     * @param {number} vmId - The VM ID
     * @param {number} eventId - The event ID (for Hacktivity's event context)
     * @returns {Promise<Object>} - Promise resolving to console file data
     */
    requestConsoleFile(vmId, eventId) {
        return new Promise((resolve, reject) => {
            if (!this.consoleChannel) {
                reject(new Error('Console channel not connected'));
                return;
            }
            
            const pendingKey = `vm_${vmId}`;
            
            // Set timeout for request
            const timeout = setTimeout(() => {
                this.pendingConsoleRequests.delete(pendingKey);
                reject(new Error('Console file request timed out'));
            }, 30000); // 30 second timeout
            
            // Store pending request
            this.pendingConsoleRequests.set(pendingKey, { resolve, reject, timeout });
            
            // Send request to server via AJAX (ActionCable receives the response)
            fetch(`/events/${eventId}/vms/${vmId}/console`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken()
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                // Response just acknowledges request - actual file comes via ActionCable
                console.log('[HacktivityCable] Console request acknowledged');
            })
            .catch(error => {
                clearTimeout(timeout);
                this.pendingConsoleRequests.delete(pendingKey);
                reject(error);
            });
        });
    }
    
    /**
     * Download console file to user's device
     * @param {Object} data - Console file data
     */
    downloadConsoleFile(data) {
        try {
            // Decode base64 content
            const binaryString = atob(data.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Create blob and download
            const blob = new Blob([bytes], { 
                type: data.contentType || 'application/x-virt-viewer' 
            });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename || 'console.vv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('[HacktivityCable] Console file downloaded:', data.filename);
        } catch (error) {
            console.error('[HacktivityCable] Failed to download console file:', error);
        }
    }
    
    /**
     * Get CSRF token from meta tag
     * @returns {string} CSRF token
     */
    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
    
    /**
     * Disconnect from ActionCable
     */
    disconnect() {
        if (this.consoleChannel) {
            this.consoleChannel.unsubscribe();
            this.consoleChannel = null;
        }
        if (this.cable) {
            this.cable.disconnect();
            this.cable = null;
        }
        
        // Clean up pending requests
        for (const [key, pending] of this.pendingConsoleRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Disconnected'));
        }
        this.pendingConsoleRequests.clear();
        
        console.log('[HacktivityCable] Disconnected');
    }
}

// Create global instance
window.hacktivityCable = new HacktivityCable();

// Export for module usage
export default window.hacktivityCable;









