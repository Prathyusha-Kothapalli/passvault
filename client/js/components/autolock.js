/**
 * PassVault Auto-Lock Session Monitor
 * Automatically locks the vault after inactivity and shows screen blur overlay
 */

const AutoLock = (function() {
  let idleTimer = null;
  let isLocked = false;
  let timeoutMinutes = 5;

  function init() {
    const user = Auth.getUser();
    if (user && user.autolock_timeout) {
      timeoutMinutes = parseInt(user.autolock_timeout) || 5;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    resetTimer();
  }

  function resetTimer() {
    if (isLocked) return;

    if (idleTimer) clearTimeout(idleTimer);

    const ms = timeoutMinutes * 60 * 1000;
    idleTimer = setTimeout(lockVault, ms);
  }

  function lockVault() {
    if (!Auth.isAuthenticated()) return;
    isLocked = true;

    let overlay = document.getElementById('autolock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'autolock-overlay';
      document.body.appendChild(overlay);
    }

    const user = Auth.getUser();

    overlay.innerHTML = `
      <div class="modal-card animate-fade-in" style="max-width: 420px; text-align: center;">
        <div class="brand-logo" style="margin: 0 auto 16px auto; width: 48px; height: 48px; font-size: 24px;">
          <i class="fas fa-lock"></i>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Vault Locked</h2>
        <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 24px;">
          Session locked due to inactivity (${timeoutMinutes}m). Enter master password to unlock.
        </p>

        <form id="unlock-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="text-align: left; margin: 0;">
            <label class="form-label">Master Password</label>
            <div class="input-with-icon">
              <input type="password" id="unlock-password" class="form-control" placeholder="Enter Master Password" required autofocus />
              <button type="button" class="input-icon-btn" onclick="togglePasswordVisibility('unlock-password')">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-key"></i> Unlock Vault
          </button>
        </form>
      </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('unlock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = document.getElementById('unlock-password').value;
      const secret = `${user.email}:${pwd}`;

      if (secret === Auth.getMasterSecret()) {
        unlockVault();
        Toast.show('Vault unlocked.', 'success');
      } else {
        Toast.show('Incorrect master password.', 'error');
      }
    });
  }

  function unlockVault() {
    isLocked = false;
    const overlay = document.getElementById('autolock-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    resetTimer();
  }

  function setTimeoutMinutes(mins) {
    timeoutMinutes = parseInt(mins) || 5;
    resetTimer();
  }

  return {
    init,
    lockVault,
    unlockVault,
    setTimeoutMinutes
  };
})();
