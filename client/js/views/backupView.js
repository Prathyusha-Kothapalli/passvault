/**
 * PassVault Backup & Restore View Controller
 */

const BackupView = (function() {
  function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 6px;">Backup & Restore Digital Vault</h2>
          <p style="font-size: 14px; color: var(--color-text-muted);">
            Export your encrypted vault database as JSON or restore from a backup file.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Export Card -->
          <div class="glass-card" style="padding: 28px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px;">
                <i class="fas fa-download"></i>
              </div>
              <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Export Vault Backup</h3>
              <p style="font-size: 13px; color: var(--color-text-muted); line-height: 1.5;">
                Download a JSON payload containing all your encrypted password entries and secure notes.
              </p>
            </div>
            <button class="btn btn-primary" style="margin-top: 24px;" onclick="BackupView.exportData()">
              <i class="fas fa-file-export"></i> Download JSON Backup
            </button>
          </div>

          <!-- Restore Card -->
          <div class="glass-card" style="padding: 28px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-accent-glow); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px;">
                <i class="fas fa-upload"></i>
              </div>
              <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Restore from Backup</h3>
              <p style="font-size: 13px; color: var(--color-text-muted); line-height: 1.5;">
                Upload a PassVault JSON backup file to import passwords and secure notes into your active vault.
              </p>
            </div>
            <div>
              <input type="file" id="backup-file-input" accept=".json" style="display: none;" onchange="BackupView.handleFileImport(event)" />
              <button class="btn btn-secondary" style="width: 100%; margin-top: 24px;" onclick="document.getElementById('backup-file-input').click()">
                <i class="fas fa-file-import"></i> Select Backup JSON File
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function exportData() {
    try {
      const data = await API.get('/backup/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `passvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Toast.show('JSON Backup exported successfully!', 'success');
    } catch (err) {
      Toast.show('Failed to export backup', 'error');
    }
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const backupObj = JSON.parse(evt.target.result);
        const res = await API.post('/backup/import', { backup: backupObj });
        if (res.success) {
          Toast.show(res.message, 'success');
        }
      } catch (err) {
        Toast.show('Failed to parse or import backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  return {
    render,
    exportData,
    handleFileImport
  };
})();
