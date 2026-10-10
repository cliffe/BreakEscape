// Export minigame framework
export { MinigameFramework } from './framework/minigame-manager.js';
export { MinigameScene } from './framework/base-minigame.js';

// Export minigame implementations
export { LockpickingMinigamePhaser } from './lockpicking/lockpicking-game-phaser.js';
export { DustingMinigame } from './dusting/dusting-game.js';
export { NotesMinigame, startNotesMinigame, showMissionBrief } from './notes/notes-minigame.js';
export { BluetoothScannerMinigame, startBluetoothScannerMinigame } from './bluetooth/bluetooth-scanner-minigame.js';
export { BleScannerMinigame, startBleScannerMinigame } from './ble-scanner/ble-scanner-minigame.js';
export { BiometricsMinigame, startBiometricsMinigame } from './biometrics/biometrics-minigame.js';
export { FingerprintReaderMinigame, startFingerprintReader } from './biometrics/fingerprint-reader-minigame.js';
export { ContainerMinigame, startContainerMinigame, returnToContainerAfterNotes, returnToConversationAfterNPCInventory } from './container/container-minigame.js';
export { PhoneChatMinigame, returnToPhoneAfterNotes } from './phone-chat/phone-chat-minigame.js';
export { PersonChatMinigame } from './person-chat/person-chat-minigame.js';
export { PinMinigame, startPinMinigame } from './pin/pin-minigame.js';
export { PasswordMinigame } from './password/password-minigame.js';
export { TextFileMinigame, returnToTextFileAfterNotes } from './text-file/text-file-minigame.js';
export { TitleScreenMinigame, startTitleScreenMinigame } from './title-screen/title-screen-minigame.js';
export { RFIDMinigame, startRFIDMinigame, returnToConversationAfterRFID } from './rfid/rfid-minigame.js';
export { VmLauncherMinigame } from './vm-launcher/vm-launcher-minigame.js';
export { FlagStationMinigame } from './flag-station/flag-station-minigame.js';
export { RansomwareDisplayMinigame } from './ransomware-display/ransomware-display-minigame.js';
export { SiemDashboardMinigame } from './siem/siem-dashboard-minigame.js';
export { NetworkSegmentationMapMinigame, startNetworkSegmentationMapMinigame } from './network-segmentation-map/network-segmentation-map-minigame.js';
export { EhrTerminalMinigame } from './ehr-terminal/ehr-terminal-minigame.js';
export { BackupRecoveryMinigame } from './backup-recovery/backup-recovery-minigame.js';
export { CommandBoardMinigame } from './command-board/command-board-minigame.js';
export { EsdPushbuttonMinigame } from './esd-pushbutton/esd-pushbutton-minigame.js';
export { InfusionPumpMinigame } from './infusion-pump/infusion-pump-minigame.js';
export { SisConfigThresholdMinigame, startSisConfigThresholdMinigame } from './sis-config-threshold/sis-config-threshold-minigame.js';
export { NetworkArchitectureMinigame, startNetworkArchitectureMinigame } from './network-architecture/network-architecture-minigame.js';
export { AlarmPanelMinigame } from './alarm-panel/alarm-panel-minigame.js';
export { ClaimsManagementSystemMinigame } from './claims-management-system/claims-management-system-minigame.js';
export { ForensicDataPlatformMinigame, startForensicDataPlatformMinigame } from './forensic-data-platform/forensic-data-platform-minigame.js';
export { NcscBriefMinigame } from './ncsc-brief/ncsc-brief-minigame.js';
export { ScadaHistorianMinigame } from './scada-historian/scada-historian-minigame.js';
export { LogFilterMinigame } from './log-filter/log-filter-minigame.js';
export { DrugLibraryIntegrityMinigame } from './drug-library-integrity/drug-library-integrity-minigame.js';
export { CoverageDecisionFormMinigame } from './coverage-decision-form/coverage-decision-form-minigame.js';
export { WarrantyChecklistMinigame } from './warranty-checklist/warranty-checklist-minigame.js';
export { BlockchainExplorerMinigame } from './blockchain-explorer/blockchain-explorer-minigame.js';
export { ShreddedDocumentMinigame } from './shredded-document/shredded-document-minigame.js';
export { CryptexMinigame } from './cryptex/cryptex-minigame.js';
export { CombinationMinigame } from './combination/combination-minigame.js';
export { ExamineMinigame } from './examine/examine-minigame.js';

// Initialize the global minigame framework for backward compatibility
import { MinigameFramework } from './framework/minigame-manager.js';
import { LockpickingMinigamePhaser } from './lockpicking/lockpicking-game-phaser.js';

// Make the framework available globally 
window.MinigameFramework = MinigameFramework;

// Add global helper functions for debugging
window.restartMinigame = () => {
    if (window.MinigameFramework) {
        window.MinigameFramework.restartCurrentMinigame();
    } else {
        console.log('MinigameFramework not available');
    }
};

window.closeMinigame = () => {
    if (window.MinigameFramework) {
        window.MinigameFramework.forceCloseMinigame();
    } else {
        console.log('MinigameFramework not available');
    }
};

// Import the dusting minigame
import { DustingMinigame } from './dusting/dusting-game.js';

// Import the notes minigame
import { NotesMinigame, startNotesMinigame, showMissionBrief } from './notes/notes-minigame.js';

// Import the bluetooth scanner minigame
import { BluetoothScannerMinigame, startBluetoothScannerMinigame } from './bluetooth/bluetooth-scanner-minigame.js';

// Import the BLE scanner minigame
import { BleScannerMinigame, startBleScannerMinigame } from './ble-scanner/ble-scanner-minigame.js';

// Import the biometrics minigame
import { BiometricsMinigame, startBiometricsMinigame } from './biometrics/biometrics-minigame.js';
import { FingerprintReaderMinigame, startFingerprintReader } from './biometrics/fingerprint-reader-minigame.js';

// Import the container minigame
import { ContainerMinigame, startContainerMinigame, returnToContainerAfterNotes, returnToConversationAfterNPCInventory } from './container/container-minigame.js';

// Import the phone chat minigame (Ink-based NPC conversations)
import { PhoneChatMinigame, returnToPhoneAfterNotes } from './phone-chat/phone-chat-minigame.js';

// Import the person chat minigame (In-person NPC conversations)
import { PersonChatMinigame } from './person-chat/person-chat-minigame.js';

// Import the PIN minigame
import { PinMinigame, startPinMinigame } from './pin/pin-minigame.js';

// Import the password minigame
import { PasswordMinigame } from './password/password-minigame.js';

// Import the text file minigame
import { TextFileMinigame, returnToTextFileAfterNotes } from './text-file/text-file-minigame.js';

// Import the title screen minigame
import { TitleScreenMinigame, startTitleScreenMinigame } from './title-screen/title-screen-minigame.js';

// Import the RFID minigame
import { RFIDMinigame, startRFIDMinigame, returnToConversationAfterRFID } from './rfid/rfid-minigame.js';

// Import the VM launcher minigame
import { VmLauncherMinigame } from './vm-launcher/vm-launcher-minigame.js';

// Import the flag station minigame
import { FlagStationMinigame } from './flag-station/flag-station-minigame.js';
import { SiemDashboardMinigame } from './siem/siem-dashboard-minigame.js';
import { EhrTerminalMinigame } from './ehr-terminal/ehr-terminal-minigame.js';
import { CommandBoardMinigame } from './command-board/command-board-minigame.js';
import { InfusionPumpMinigame } from './infusion-pump/infusion-pump-minigame.js';
import { SisConfigThresholdMinigame, startSisConfigThresholdMinigame } from './sis-config-threshold/sis-config-threshold-minigame.js';
import { NetworkArchitectureMinigame, startNetworkArchitectureMinigame } from './network-architecture/network-architecture-minigame.js';
import { AlarmPanelMinigame } from './alarm-panel/alarm-panel-minigame.js';
import { ClaimsManagementSystemMinigame } from './claims-management-system/claims-management-system-minigame.js';
import { ForensicDataPlatformMinigame, startForensicDataPlatformMinigame } from './forensic-data-platform/forensic-data-platform-minigame.js';
import { NcscBriefMinigame } from './ncsc-brief/ncsc-brief-minigame.js';
import { ScadaHistorianMinigame } from './scada-historian/scada-historian-minigame.js';
import { LogFilterMinigame } from './log-filter/log-filter-minigame.js';
import { DrugLibraryIntegrityMinigame } from './drug-library-integrity/drug-library-integrity-minigame.js';
import { CoverageDecisionFormMinigame } from './coverage-decision-form/coverage-decision-form-minigame.js';
import { WarrantyChecklistMinigame } from './warranty-checklist/warranty-checklist-minigame.js';
import { BlockchainExplorerMinigame } from './blockchain-explorer/blockchain-explorer-minigame.js';
import { ShreddedDocumentMinigame } from './shredded-document/shredded-document-minigame.js';
import { CryptexMinigame } from './cryptex/cryptex-minigame.js';
import { CombinationMinigame } from './combination/combination-minigame.js';
import { ExamineMinigame } from './examine/examine-minigame.js';

// Import ransomware display minigame
import { RansomwareDisplayMinigame } from './ransomware-display/ransomware-display-minigame.js';

// Import the network segmentation map minigame
import { NetworkSegmentationMapMinigame, startNetworkSegmentationMapMinigame } from './network-segmentation-map/network-segmentation-map-minigame.js';
import { BackupRecoveryMinigame } from './backup-recovery/backup-recovery-minigame.js';
import { EsdPushbuttonMinigame } from './esd-pushbutton/esd-pushbutton-minigame.js';

// Register minigames
MinigameFramework.registerScene('lockpicking', LockpickingMinigamePhaser); // Use Phaser version as default
MinigameFramework.registerScene('lockpicking-phaser', LockpickingMinigamePhaser); // Keep explicit phaser name
MinigameFramework.registerScene('dusting', DustingMinigame);
MinigameFramework.registerScene('notes', NotesMinigame);
MinigameFramework.registerScene('bluetooth-scanner', BluetoothScannerMinigame);
MinigameFramework.registerScene('ble-scanner', BleScannerMinigame);
MinigameFramework.registerScene('biometrics', BiometricsMinigame);
MinigameFramework.registerScene('fingerprint-reader', FingerprintReaderMinigame);
MinigameFramework.registerScene('container', ContainerMinigame);
MinigameFramework.registerScene('phone-chat', PhoneChatMinigame);
MinigameFramework.registerScene('person-chat', PersonChatMinigame);
MinigameFramework.registerScene('pin', PinMinigame);
MinigameFramework.registerScene('password', PasswordMinigame);
MinigameFramework.registerScene('text-file', TextFileMinigame);
MinigameFramework.registerScene('title-screen', TitleScreenMinigame);
MinigameFramework.registerScene('rfid', RFIDMinigame);
MinigameFramework.registerScene('vm-launcher', VmLauncherMinigame);
MinigameFramework.registerScene('flag-station', FlagStationMinigame);
MinigameFramework.registerScene('ransomware-display', RansomwareDisplayMinigame);
MinigameFramework.registerScene('siem-dashboard', SiemDashboardMinigame);
MinigameFramework.registerScene('network-segmentation-map', NetworkSegmentationMapMinigame);
MinigameFramework.registerScene('ehr-terminal', EhrTerminalMinigame);
MinigameFramework.registerScene('backup-recovery', BackupRecoveryMinigame);
MinigameFramework.registerScene('command-board', CommandBoardMinigame);
MinigameFramework.registerScene('esd-pushbutton', EsdPushbuttonMinigame);
MinigameFramework.registerScene('infusion-pump', InfusionPumpMinigame);
MinigameFramework.registerScene('sis-config-threshold', SisConfigThresholdMinigame);
MinigameFramework.registerScene('network-architecture', NetworkArchitectureMinigame);
MinigameFramework.registerScene('alarm-panel', AlarmPanelMinigame);
MinigameFramework.registerScene('claims-management-system', ClaimsManagementSystemMinigame);
MinigameFramework.registerScene('forensic-data-platform', ForensicDataPlatformMinigame);
MinigameFramework.registerScene('ncsc-brief', NcscBriefMinigame);
MinigameFramework.registerScene('scada-historian', ScadaHistorianMinigame);
MinigameFramework.registerScene('log-filter', LogFilterMinigame);
MinigameFramework.registerScene('drug-library-integrity', DrugLibraryIntegrityMinigame);
MinigameFramework.registerScene('coverage-decision-form', CoverageDecisionFormMinigame);
MinigameFramework.registerScene('warranty-checklist', WarrantyChecklistMinigame);
MinigameFramework.registerScene('blockchain-explorer', BlockchainExplorerMinigame);
MinigameFramework.registerScene('shredded-document', ShreddedDocumentMinigame);
MinigameFramework.registerScene('cryptex', CryptexMinigame);
MinigameFramework.registerScene('combination', CombinationMinigame);
MinigameFramework.registerScene('examine', ExamineMinigame);

// Make minigame functions available globally
window.startNotesMinigame = startNotesMinigame;
window.showMissionBrief = showMissionBrief;
window.startBluetoothScannerMinigame = startBluetoothScannerMinigame;
window.startBleScannerMinigame = startBleScannerMinigame;
window.startBiometricsMinigame = startBiometricsMinigame;
window.startFingerprintReader = startFingerprintReader;
window.startContainerMinigame = startContainerMinigame;
window.returnToContainerAfterNotes = returnToContainerAfterNotes;
window.returnToConversationAfterNPCInventory = returnToConversationAfterNPCInventory;
window.returnToPhoneAfterNotes = returnToPhoneAfterNotes;
window.returnToTextFileAfterNotes = returnToTextFileAfterNotes;
window.startPinMinigame = startPinMinigame;
window.startTitleScreenMinigame = startTitleScreenMinigame;
window.startRFIDMinigame = startRFIDMinigame;
window.returnToConversationAfterRFID = returnToConversationAfterRFID;
window.startNetworkSegmentationMapMinigame = startNetworkSegmentationMapMinigame;
window.startSisConfigThresholdMinigame = startSisConfigThresholdMinigame;
window.startNetworkArchitectureMinigame = startNetworkArchitectureMinigame;
window.startForensicDataPlatformMinigame = startForensicDataPlatformMinigame;
