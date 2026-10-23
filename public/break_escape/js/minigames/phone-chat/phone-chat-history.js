/**
 * PhoneChatHistory - Conversation History Management
 * 
 * Manages conversation history for NPC phone chats, interfacing with NPCManager's
 * conversation history system. Handles loading, formatting, and recording messages.
 * 
 * @module phone-chat-history
 */

import { displayPhoneLine } from './phone-chat-speaker.js';

export default class PhoneChatHistory {
    /**
     * Create a PhoneChatHistory instance
     * @param {string} npcId - NPC identifier
     * @param {Object} npcManager - NPCManager instance
     */
    constructor(npcId, npcManager) {
        if (!npcId) {
            throw new Error('PhoneChatHistory requires an npcId');
        }
        
        if (!npcManager) {
            throw new Error('PhoneChatHistory requires an npcManager instance');
        }
        
        this.npcId = npcId;
        this.npcManager = npcManager;
        
        console.log(`📜 PhoneChatHistory initialized for NPC: ${npcId}`);
    }
    
    /**
     * Load conversation history for this NPC
     * @returns {Array} Array of message objects
     */
    loadHistory() {
        try {
            const history = this.npcManager.getConversationHistory(this.npcId);
            console.log(`📜 Loaded ${history.length} messages for ${this.npcId}`);
            return history || [];
        } catch (error) {
            console.error(`❌ Error loading history for ${this.npcId}:`, error);
            return [];
        }
    }
    
    /**
     * Add a message to the conversation history
     * @param {string} type - Message type ('npc' or 'player')
     * @param {string} text - Message text
     * @param {Object} metadata - Optional metadata (knot, choice, etc.)
     * @returns {Object} The added message object
     */
    addMessage(type, text, metadata = {}) {
        if (!text || text.trim() === '') {
            console.warn('⚠️ Attempted to add empty message, skipping');
            return null;
        }
        
        try {
            // Create message object
            const message = {
                type,
                text: text.trim(),
                timestamp: Date.now(),
                read: type === 'player', // Player messages are always "read"
                ...metadata
            };
            
            // Add to NPCManager's conversation history
            this.npcManager.addMessage(
                this.npcId,
                type,
                text.trim(),
                metadata
            );
            
            console.log(`📝 Added ${type} message for ${this.npcId}:`, text.substring(0, 50) + '...');
            
            return message;
        } catch (error) {
            console.error(`❌ Error adding message for ${this.npcId}:`, error);
            return null;
        }
    }
    
    /**
     * Format a message for display
     * @param {Object} message - Message object from history
     * @returns {Object} Formatted message with display properties
     */
    formatMessage(message) {
        if (!message) return null;
        
        return {
            type: message.type || 'npc',
            text: message.text || '',
            timestamp: message.timestamp || Date.now(),
            timeString: this.formatTimestamp(message.timestamp),
            read: message.read !== undefined ? message.read : true,
            knot: message.knot || null,
            choice: message.choice || null,
            metadata: message.metadata || {}
        };
    }
    
    /**
     * Format a timestamp into a human-readable string
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted time string (e.g., "2:34 PM" or "2 min ago")
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // More than 24 hours - show time
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        return `${displayHours}:${displayMinutes} ${ampm}`;
    }
    
    /**
     * Get the last message in the conversation
     * @returns {Object|null} Last message or null if no history
     */
    getLastMessage() {
        const history = this.loadHistory();
        return history.length > 0 ? history[history.length - 1] : null;
    }
    
    /**
     * Get the last NPC message in the conversation
     * @returns {Object|null} Last NPC message or null if none found
     */
    getLastNPCMessage() {
        const history = this.loadHistory();
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].type === 'npc') {
                return history[i];
            }
        }
        return null;
    }
    
    /**
     * Get count of unread messages
     * @returns {number} Number of unread messages
     */
    getUnreadCount() {
        const history = this.loadHistory();
        return history.filter(msg => !msg.read && msg.type === 'npc').length;
    }
    
    /**
     * Mark all messages as read
     * @returns {number} Number of messages marked as read
     */
    markAllRead() {
        const history = this.loadHistory();
        let markedCount = 0;
        
        history.forEach(msg => {
            if (!msg.read && msg.type === 'npc') {
                msg.read = true;
                markedCount++;
            }
        });
        
        if (markedCount > 0) {
            console.log(`✅ Marked ${markedCount} messages as read for ${this.npcId}`);
        }
        
        return markedCount;
    }
    
    /**
     * Mark a specific message as read
     * @param {number} index - Index of message in history
     * @returns {boolean} True if marked successfully
     */
    markMessageRead(index) {
        const history = this.loadHistory();
        
        if (index < 0 || index >= history.length) {
            console.warn(`⚠️ Invalid message index: ${index}`);
            return false;
        }
        
        const message = history[index];
        if (message.type === 'npc' && !message.read) {
            message.read = true;
            console.log(`✅ Marked message ${index} as read for ${this.npcId}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Clear all conversation history for this NPC
     * @returns {boolean} True if cleared successfully
     */
    clearHistory() {
        try {
            this.npcManager.clearConversationHistory(this.npcId);
            console.log(`🗑️ Cleared conversation history for ${this.npcId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error clearing history for ${this.npcId}:`, error);
            return false;
        }
    }
    
    /**
     * Get conversation statistics
     * @returns {Object} Stats about the conversation
     */
    getStats() {
        const history = this.loadHistory();
        const npcMessages = history.filter(msg => msg.type === 'npc').length;
        const playerMessages = history.filter(msg => msg.type === 'player').length;
        const unreadMessages = this.getUnreadCount();
        
        return {
            totalMessages: history.length,
            npcMessages,
            playerMessages,
            unreadMessages,
            hasHistory: history.length > 0
        };
    }
    
    /**
     * Export conversation history as text
     * @param {boolean} includeTimestamps - Whether to include timestamps
     * @returns {string} Formatted conversation text
     */
    exportAsText(includeTimestamps = true) {
        const history = this.loadHistory();
        const npc = this.npcManager.getNPC(this.npcId);
        const npcName = npc?.displayName || this.npcId;
        
        let text = `Conversation with ${npcName}\n`;
        text += `${'='.repeat(40)}\n\n`;
        
        history.forEach((original, index) => {
            const message = { ...original, ...displayPhoneLine(original.type, original.text, npc) };
            const speaker = message.type === 'npc' ? npcName : message.type === 'narrator' ? 'Narrator' : 'You';
            const timestamp = includeTimestamps ? ` [${this.formatTimestamp(message.timestamp)}]` : '';
            
            text += `${speaker}${timestamp}:\n`;
            text += `${message.text}\n\n`;
        });
        
        text += `${'='.repeat(40)}\n`;
        text += `Total messages: ${history.length}`;
        
        return text;
    }
}
