/**
 * PassVault Reusable Modal Dialog Manager
 */

const Modal = (function() {
  function open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  function close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function closeAll() {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    activeModals.forEach(m => m.classList.remove('active'));
  }

  return {
    open,
    close,
    closeAll
  };
})();
