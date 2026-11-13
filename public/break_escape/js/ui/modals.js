// Modals System
// Handles modal dialogs and popups

// Initialize modals
export function initializeModals() {
    console.log('Modals initialized');
}

// Show password modal
export function showPasswordModal(callback) {
    const modal = document.getElementById('password-modal');
    const input = document.getElementById('password-modal-input');
    const show = document.getElementById('password-modal-show');
    const okBtn = document.getElementById('password-modal-ok');
    const cancelBtn = document.getElementById('password-modal-cancel');

    // Reset input and checkbox
    input.value = '';
    show.checked = false;
    input.type = 'password';
    modal.style.display = 'flex';
    input.focus();

    function cleanup(result) {
        modal.style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKeyDown);
        show.removeEventListener('change', onShowChange);
        callback(result);
    }

    function onOk() {
        cleanup(input.value);
    }
    function onCancel() {
        cleanup(null);
    }
    function onKeyDown(e) {
        if (e.key === 'Enter') onOk();
        if (e.key === 'Escape') onCancel();
    }
    function onShowChange() {
        input.type = show.checked ? 'text' : 'password';
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
    show.addEventListener('change', onShowChange);
}

// Export for global access
window.initializeModals = initializeModals;
window.showPasswordModal = showPasswordModal; 