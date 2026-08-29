/**
 * PassVault User Profile & Settings View Controller
 */

const SettingsView = (function() {
  async function render() {
    const user = Auth.getUser();
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 800px; margin: 0 auto;">
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 22px; font-weight: 700;">Settings & Preferences</h2>
          <p style="font-size: 13px; color: var(--color-text-muted);">
            Manage security preferences, visual theme, auto-lock timeout, and master password.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- User Profile & Theme Preferences Card -->
          <div class="glass-card" style="padding: 28px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">App Preferences</h3>
            <form id="settings-form" style="display: flex; flex-direction: column; gap: 20px;">
              <div class="form-group">
                <label class="form-label">Email Account</label>
                <input type="email" class="form-control" value="${user.email}" disabled style="opacity: 0.7;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label class="form-label">Theme Mode</label>
                  <select id="setting-theme" class="form-control">
                    <option value="dark" ${user.theme_preference === 'dark' ? 'selected' : ''}>Dark Mode (Default)</option>
                    <option value="light" ${user.theme_preference === 'light' ? 'selected' : ''}>Light Mode</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Inactivity Auto-Lock Timeout</label>
                  <select id="setting-autolock" class="form-control">
                    <option value="1" ${user.autolock_timeout == 1 ? 'selected' : ''}>1 Minute</option>
                    <option value="5" ${user.autolock_timeout == 5 ? 'selected' : ''}>5 Minutes (Recommended)</option>
                    <option value="15" ${user.autolock_timeout == 15 ? 'selected' : ''}>15 Minutes</option>
                    <option value="30" ${user.autolock_timeout == 30 ? 'selected' : ''}>30 Minutes</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Clipboard Auto-Clear Timer (Seconds)</label>
                <input type="number" id="setting-clipboard" class="form-control" value="${user.clipboard_clear_seconds || 30}" min="5" max="120" />
              </div>

              <button type="submit" class="btn btn-primary" style="width: max-content;">Save Preferences</button>
            </form>
          </div>

          <!-- Change Master Password Card -->
          <div class="glass-card" style="padding: 28px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Change Master Password</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 20px;">
              Updating your master password updates your authentication hash.
            </p>
            <form id="change-password-form" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label">Current Master Password</label>
                <input type="password" id="curr-pwd" class="form-control" required />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label">New Master Password (8+ chars)</label>
                <input type="password" id="new-pwd" class="form-control" required minlength="8" />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label">Confirm New Master Password</label>
                <input type="password" id="confirm-pwd" class="form-control" required minlength="8" />
              </div>
              <button type="submit" class="btn btn-secondary" style="width: max-content; margin-top: 8px;">
                <i class="fas fa-key"></i> Update Master Password
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
    document.getElementById('change-password-form').addEventListener('submit', handleChangePasswordSubmit);
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    try {
      const theme = document.getElementById('setting-theme').value;
      const autolock = parseInt(document.getElementById('setting-autolock').value);
      const clipboard = parseInt(document.getElementById('setting-clipboard').value);

      const res = await API.put('/settings', {
        theme_preference: theme,
        autolock_timeout: autolock,
        clipboard_clear_seconds: clipboard
      });

      if (res.success) {
        Auth.applyTheme(theme);
        AutoLock.setTimeoutMinutes(autolock);
        
        // Update stored user object
        const currentUser = Auth.getUser();
        currentUser.theme_preference = theme;
        currentUser.autolock_timeout = autolock;
        currentUser.clipboard_clear_seconds = clipboard;
        localStorage.setItem('passvault_user', JSON.stringify(currentUser));

        Toast.show('Settings updated successfully', 'success');
      }
    } catch (err) {
      Toast.show('Failed to save settings', 'error');
    }
  }

  async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const curr = document.getElementById('curr-pwd').value;
    const newPwd = document.getElementById('new-pwd').value;
    const conf = document.getElementById('confirm-pwd').value;

    if (newPwd !== conf) {
      Toast.show('New password and confirmation do not match', 'error');
      return;
    }

    try {
      const res = await API.post('/settings/change-password', {
        current_password: curr,
        new_password: newPwd
      });

      if (res.success) {
        Toast.show('Master password updated successfully', 'success');
        document.getElementById('change-password-form').reset();
      }
    } catch (err) {
      Toast.show(err.message || 'Failed to update master password', 'error');
    }
  }

  return {
    render
  };
})();
