/**
 * RFID Data Manager
 *
 * Handles RFID card data management:
 * - Card generation with deterministic card_id-based generation
 * - Multi-protocol support (EM4100, MIFARE Classic, MIFARE DESFire)
 * - Hex ID validation
 * - Card save/load to cloner device
 * - Format conversions (hex, DEZ8, facility codes)
 *
 * @module rfid-data
 */

import { getProtocolInfo, detectProtocol, isMIFARE } from './rfid-protocols.js';

// Maximum number of cards that can be saved to cloner
const MAX_SAVED_CARDS = 50;

// Template names for generated cards
const CARD_NAME_TEMPLATES = [
    'Security Badge',
    'Employee ID',
    'Access Card',
    'Visitor Pass',
    'Executive Key',
    'Maintenance Card',
    'Lab Access',
    'Server Room'
];

export class RFIDDataManager {
    constructor() {
        console.log('🔐 RFIDDataManager initialized');
    }

    /**
     * Generate RFID technical data from card_id (deterministic)
     * Same card_id always produces same hex/UID
     * @param {string} cardId - Logical card identifier
     * @param {string} protocol - RFID protocol name
     * @returns {Object} Protocol-specific RFID data
     */
    generateRFIDDataFromCardId(cardId, protocol) {
        const seed = this.hashCardId(cardId);
        const data = { cardId: cardId };

        switch (protocol) {
            case 'EM4100':
                data.hex = this.generateHexFromSeed(seed, 10);
                data.facility = (seed % 256);
                data.cardNumber = (seed % 65536);
                break;

            case 'MIFARE_Classic_Weak_Defaults':
            case 'MIFARE_Classic_Custom_Keys':
                data.uid = this.generateHexFromSeed(seed, 8);
                data.sectors = {}; // Empty until cloned/cracked
                break;

            case 'MIFARE_DESFire':
                data.uid = this.generateHexFromSeed(seed, 14);
                data.masterKeyKnown = false;
                break;

            default:
                // Default to EM4100
                data.hex = this.generateHexFromSeed(seed, 10);
                data.facility = (seed % 256);
                data.cardNumber = (seed % 65536);
        }

        return data;
    }

    /**
     * Hash card_id to deterministic seed
     * Uses simple string hashing algorithm
     * @param {string} cardId - Card identifier string
     * @returns {number} Positive integer seed
     */
    hashCardId(cardId) {
        let hash = 0;
        for (let i = 0; i < cardId.length; i++) {
            const char = cardId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate hex string from seed using improved hash-based approach
     * Ensures deterministic output for same seed with good distribution
     * @param {number} seed - Integer seed value
     * @param {number} length - Desired hex string length
     * @returns {string} Hex string of specified length with realistic values
     */
    generateHexFromSeed(seed, length) {
        let hex = '';
        
        // Use seed to generate multiple hash variations
        for (let i = 0; i < length; i++) {
            // Create a unique seed for each position using multiplication and XOR
            let positionSeed = seed ^ (i * 2654435761); // XOR with position
            positionSeed = (positionSeed * 2654435761 + i * 2246822519) >>> 0; // Multiply with varied constants
            
            // Use multiple rotations and shifts to improve distribution
            let hash = positionSeed;
            hash = hash ^ (hash >>> 16);
            hash = (hash * 0x7feb352d) >>> 0;
            hash = hash ^ (hash >>> 15);
            
            // Extract 4-bit value (0-15) for hex digit
            const hexDigit = (hash >>> (i % 8)) & 0xF;
            hex += hexDigit.toString(16).toUpperCase();
        }

        return hex;
    }

    /**
     * Get card display data for all protocols
     * Supports both new (card_id) and legacy formats
     * @param {Object} cardData - Card scenario data
     * @returns {Object} Display data with protocol info and fields
     */
    getCardDisplayData(cardData) {
        const protocol = detectProtocol(cardData);
        const protocolInfo = getProtocolInfo(protocol);

        // Ensure rfid_data exists (generate if using card_id)
        if (!cardData.rfid_data && cardData.card_id) {
            cardData.rfid_data = this.generateRFIDDataFromCardId(
                cardData.card_id,
                protocol
            );
        }

        const displayData = {
            protocol: protocol,
            protocolName: protocolInfo.name,
            frequency: protocolInfo.frequency,
            security: protocolInfo.security,
            color: protocolInfo.color,
            icon: protocolInfo.icon,
            description: protocolInfo.description,
            fields: []
        };

        switch (protocol) {
            case 'EM4100':
                // Support both new (rfid_data.hex) and legacy (rfid_hex) formats
                const hex = cardData.rfid_data?.hex || cardData.rfid_hex;
                const facility = cardData.rfid_data?.facility || cardData.rfid_facility || 0;
                const cardNumber = cardData.rfid_data?.cardNumber || cardData.rfid_card_number || 0;

                displayData.fields = [
                    { label: 'HEX', value: this.formatHex(hex) },
                    { label: 'Facility', value: facility },
                    { label: 'Card', value: cardNumber },
                    { label: 'DEZ 8', value: this.toDEZ8(hex) }
                ];
                break;

            case 'MIFARE_Classic_Weak_Defaults':
            case 'MIFARE_Classic_Custom_Keys':
                const uid = cardData.rfid_data?.uid;
                const keysKnown = cardData.rfid_data?.sectors ?
                    Object.keys(cardData.rfid_data.sectors).length : 0;

                displayData.fields = [
                    { label: 'UID', value: this.formatHex(uid) },
                    { label: 'Type', value: '1K (16 sectors)' },
                    { label: 'Keys Known', value: `${keysKnown}/16` },
                    { label: 'Readable', value: keysKnown === 16 ? 'Yes ✓' : keysKnown > 0 ? 'Partial' : 'No' },
                    { label: 'Clonable', value: keysKnown > 0 ? 'Yes ✓' : 'No' }
                ];

                // Add security note
                if (protocol === 'MIFARE_Classic_Weak_Defaults') {
                    displayData.securityNote = 'Uses factory default keys';
                } else {
                    displayData.securityNote = 'Uses custom encryption keys';
                }
                break;

            case 'MIFARE_DESFire':
                const desUID = cardData.rfid_data?.uid;
                displayData.fields = [
                    { label: 'UID', value: this.formatHex(desUID) },
                    { label: 'Type', value: 'EV2' },
                    { label: 'Encryption', value: '3DES/AES' },
                    { label: 'Clonable', value: 'UID Only' }
                ];
                displayData.securityNote = 'High security - full clone impossible';
                break;
        }

        return displayData;
    }

    /**
     * Generate a random RFID card with EM4100 format
     * @returns {Object} Card data with hex, facility code, card number
     */
    generateRandomCard() {
        // Generate 10-character hex ID (5 bytes)
        const hex = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join('');

        // Calculate facility code from first byte
        const facility = parseInt(hex.substring(0, 2), 16);

        // Calculate card number from next 2 bytes
        const cardNumber = parseInt(hex.substring(2, 6), 16);

        // Generate card name
        const nameTemplate = CARD_NAME_TEMPLATES[Math.floor(Math.random() * CARD_NAME_TEMPLATES.length)];
        const name = `${nameTemplate} #${Math.floor(Math.random() * 9000) + 1000}`;

        return {
            name: name,
            rfid_hex: hex,
            rfid_facility: facility,
            rfid_card_number: cardNumber,
            rfid_protocol: 'EM4100',
            type: 'keycard',
            opens_lock: `card_${hex.toLowerCase()}`
        };
    }

    /**
     * Validate hex ID format
     * @param {string} hex - Hex ID to validate
     * @returns {Object} {valid: boolean, error?: string}
     */
    validateHex(hex) {
        if (!hex || typeof hex !== 'string') {
            return { valid: false, error: 'Hex ID must be a string' };
        }

        if (hex.length !== 10) {
            return { valid: false, error: 'Hex ID must be exactly 10 characters' };
        }

        if (!/^[0-9A-Fa-f]{10}$/.test(hex)) {
            return { valid: false, error: 'Hex ID must contain only hex characters (0-9, A-F)' };
        }

        return { valid: true };
    }

    /**
     * Save card to RFID cloner device
     * Supports all protocols (EM4100, MIFARE Classic, MIFARE DESFire)
     * @param {Object} cardData - Card data to save
     * @returns {Object} {success: boolean, message: string}
     */
    saveCardToCloner(cardData) {
        // Find rfid_cloner in inventory
        const cloner = window.inventory?.items?.find(item =>
            item?.scenarioData?.type === 'rfid_cloner'
        );

        if (!cloner) {
            return { success: false, message: 'RFID cloner not found in inventory' };
        }

        // Determine protocol and validate
        const protocol = cardData.rfid_protocol || 'EM4100';

        // For EM4100, validate hex ID (legacy support)
        if (protocol === 'EM4100' && cardData.rfid_hex) {
            const validation = this.validateHex(cardData.rfid_hex);
            if (!validation.valid) {
                return { success: false, message: validation.error };
            }
        }

        // Ensure rfid_data exists for card_id-based cards
        if (!cardData.rfid_data && cardData.card_id) {
            cardData.rfid_data = this.generateRFIDDataFromCardId(cardData.card_id, protocol);
        }

        // Initialize saved_cards array if missing
        if (!cloner.scenarioData.saved_cards) {
            cloner.scenarioData.saved_cards = [];
        }

        // Check if at max capacity
        if (cloner.scenarioData.saved_cards.length >= MAX_SAVED_CARDS) {
            return { success: false, message: `Cloner full (max ${MAX_SAVED_CARDS} cards)` };
        }

        // Check for duplicate by card_id (preferred) or hex/UID
        let existingIndex = -1;
        if (cardData.card_id) {
            existingIndex = cloner.scenarioData.saved_cards.findIndex(card =>
                card.card_id === cardData.card_id
            );
        } else if (cardData.rfid_hex) {
            existingIndex = cloner.scenarioData.saved_cards.findIndex(card =>
                card.rfid_hex === cardData.rfid_hex
            );
        } else if (cardData.rfid_data?.uid) {
            existingIndex = cloner.scenarioData.saved_cards.findIndex(card =>
                card.rfid_data?.uid === cardData.rfid_data.uid
            );
        }

        if (existingIndex !== -1) {
            // Overwrite existing card with updated timestamp
            cloner.scenarioData.saved_cards[existingIndex] = {
                ...cardData,
                timestamp: Date.now()
            };
            console.log(`📡 Overwritten duplicate card: ${cardData.name || 'Card'}`);
            return { success: true, message: `Updated: ${cardData.name || 'Card'}` };
        } else {
            // Add new card
            cloner.scenarioData.saved_cards.push({
                ...cardData,
                timestamp: Date.now()
            });
            console.log(`📡 Saved new card: ${cardData.name || 'Card'}`);
            return { success: true, message: `Saved: ${cardData.name || 'Card'}` };
        }
    }

    /**
     * Get all saved cards from cloner
     * @returns {Array} Array of saved cards
     */
    getSavedCards() {
        const cloner = window.inventory?.items?.find(item =>
            item?.scenarioData?.type === 'rfid_cloner'
        );

        if (!cloner || !cloner.scenarioData.saved_cards) {
            return [];
        }

        return cloner.scenarioData.saved_cards;
    }

    /**
     * Convert hex ID to facility code and card number
     * EM4100 format: First byte = facility, next 2 bytes = card number
     * @param {string} hex - 10-character hex ID
     * @returns {Object} {facility: number, cardNumber: number}
     */
    hexToFacilityCard(hex) {
        const facility = parseInt(hex.substring(0, 2), 16);
        const cardNumber = parseInt(hex.substring(2, 6), 16);
        return { facility, cardNumber };
    }

    /**
     * Convert facility code and card number to hex ID
     * @param {number} facility - Facility code (0-255)
     * @param {number} cardNumber - Card number (0-65535)
     * @returns {string} 10-character hex ID
     */
    facilityCardToHex(facility, cardNumber) {
        // Convert to hex and pad
        const facilityHex = facility.toString(16).toUpperCase().padStart(2, '0');
        const cardHex = cardNumber.toString(16).toUpperCase().padStart(4, '0');

        // Generate 4 random chars for remaining data
        const randomHex = Array.from({ length: 4 }, () =>
            Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join('');

        return facilityHex + cardHex + randomHex;
    }

    /**
     * Convert hex ID to DEZ 8 format
     * EM4100 DEZ 8: Last 3 bytes (6 hex chars) converted to decimal
     * @param {string} hex - 10-character hex ID
     * @returns {string} 8-digit decimal string with leading zeros
     */
    toDEZ8(hex) {
        const lastThreeBytes = hex.slice(-6);
        const decimal = parseInt(lastThreeBytes, 16);
        return decimal.toString().padStart(8, '0');
    }

    /**
     * Calculate EM4100 checksum
     * XOR of all bytes
     * @param {string} hex - 10-character hex ID
     * @returns {number} Checksum byte (0x00-0xFF)
     */
    calculateChecksum(hex) {
        const bytes = hex.match(/.{1,2}/g).map(b => parseInt(b, 16));
        let checksum = 0;
        bytes.forEach(byte => {
            checksum ^= byte;
        });
        return checksum & 0xFF;
    }

    /**
     * Format hex for display (add spaces every 2 chars)
     * @param {string} hex - Hex string
     * @returns {string} Formatted hex string
     */
    formatHex(hex) {
        return hex.match(/.{1,2}/g).join(' ').toUpperCase();
    }
}
