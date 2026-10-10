/**
 * RFID Protocol Definitions
 *
 * Defines the four supported RFID protocols with their security characteristics
 * and capabilities. Used throughout the RFID minigame system for protocol-specific
 * behavior and UI rendering.
 */

export const RFID_PROTOCOLS = {
  'EM4100': {
    name: 'EM-Micro EM4100',
    frequency: '125kHz',
    security: 'low',
    capabilities: {
      read: true,
      clone: true,
      emulate: true
    },
    hexLength: 10,
    color: '#FF6B6B',
    icon: '⚠️',
    description: 'Legacy read-only card with no encryption'
  },

  'MIFARE_Classic_Weak_Defaults': {
    name: 'MIFARE Classic 1K (Default Keys)',
    frequency: '13.56MHz',
    security: 'low',
    capabilities: {
      read: true,      // Dictionary attack works instantly
      clone: true,
      emulate: true
    },
    attackTime: 'instant',
    sectors: 16,
    hexLength: 8,
    color: '#FF6B6B',  // Red like EM4100 - equally weak
    icon: '⚠️',
    description: 'Encrypted card using factory default keys (FFFFFFFFFFFF)'
  },

  'MIFARE_Classic_Custom_Keys': {
    name: 'MIFARE Classic 1K (Custom Keys)',
    frequency: '13.56MHz',
    security: 'medium',
    capabilities: {
      read: 'with-keys',
      clone: 'with-keys',
      emulate: true
    },
    attackTime: '30sec',
    sectors: 16,
    hexLength: 8,
    color: '#4ECDC4',  // Teal for medium security
    icon: '🔐',
    description: 'Encrypted card with custom keys - requires attack to crack'
  },

  'MIFARE_DESFire': {
    name: 'MIFARE DESFire EV2',
    frequency: '13.56MHz',
    security: 'high',
    capabilities: {
      read: false,
      clone: false,
      emulate: 'uid-only'
    },
    hexLength: 14,
    color: '#95E1D3',
    icon: '🔒',
    description: 'High security with 3DES/AES encryption - UID only'
  }
};

/**
 * Common MIFARE keys used in dictionary attacks
 * Ordered by likelihood (factory default first)
 */
export const MIFARE_COMMON_KEYS = [
  'FFFFFFFFFFFF', // Factory default (most common)
  '000000000000',
  'A0A1A2A3A4A5',
  'D3F7D3F7D3F7',
  '123456789ABC',
  'AABBCCDDEEFF',
  'B0B1B2B3B4B5',
  '4D3A99C351DD',
  '1A982C7E459A',
  'AA1234567890',
  'A0478CC39091',
  '533CB6C723F6',
  '8FD0A4F256E9'
];

/**
 * Attack duration constants (milliseconds)
 */
export const ATTACK_DURATIONS = {
  darkside: 30000,    // 30 seconds - crack from scratch
  darksideWeak: 10000, // 10 seconds - crack weak crypto faster
  nested: 10000,      // 10 seconds - crack with known key
  dictionary: 0       // Instant
};

/**
 * Get protocol information by protocol name
 * @param {string} protocol - Protocol name
 * @returns {Object} Protocol info object
 */
export function getProtocolInfo(protocol) {
  return RFID_PROTOCOLS[protocol] || RFID_PROTOCOLS['EM4100'];
}

/**
 * Detect protocol from card data
 * Supports both new (rfid_protocol) and legacy formats
 * @param {Object} cardData - Card scenario data
 * @returns {string} Protocol name
 */
export function detectProtocol(cardData) {
  // New format - explicit protocol
  if (cardData.rfid_protocol) {
    return cardData.rfid_protocol;
  }

  // Legacy format - detect from structure
  if (cardData.rfid_hex) {
    return 'EM4100';
  }

  // Default
  return 'EM4100';
}

/**
 * Check if protocol supports instant cloning
 * @param {string} protocol - Protocol name
 * @returns {boolean} True if can clone instantly
 */
export function supportsInstantClone(protocol) {
  return protocol === 'EM4100' || protocol === 'MIFARE_Classic_Weak_Defaults';
}

/**
 * Check if protocol requires key attacks
 * @param {string} protocol - Protocol name
 * @returns {boolean} True if needs attack
 */
export function requiresKeyAttack(protocol) {
  return protocol === 'MIFARE_Classic_Custom_Keys';
}

/**
 * Check if protocol is UID-only
 * @param {string} protocol - Protocol name
 * @returns {boolean} True if only UID can be saved
 */
export function isUIDOnly(protocol) {
  return protocol === 'MIFARE_DESFire';
}

/**
 * Check if card is MIFARE variant
 * @param {string} protocol - Protocol name
 * @returns {boolean} True if MIFARE protocol
 */
export function isMIFARE(protocol) {
  return protocol.startsWith('MIFARE_');
}

/**
 * Get security level display text
 * @param {string} security - Security level ('low', 'medium', 'high')
 * @returns {string} Display text
 */
export function getSecurityDisplay(security) {
  const displays = {
    'low': '⚠️ LOW',
    'medium': '🔐 MEDIUM',
    'high': '🔒 HIGH'
  };
  return displays[security] || security.toUpperCase();
}
