/**
 * PassVault Audit Log & Activity Trail View Controller
 */

const AuditView = (function() {
  async function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700;">Audit Trail & Activity Log</h2>
            <p style="font-size: 13px; color: var(--color-text-muted);">
              Immutable timestamped records of security events, authentication, and vault accesses.
            </p>
          </div>
          <button class="btn btn-danger btn-sm" onclick="AuditView.clearLogs()">
            <i class="fas fa-trash"></i> Clear Audit History
          </button>
        </div>

        <div class="glass-card" style="padding: 24px;">
          <div id="audit-logs-table-container">
            <div style="color: var(--color-text-muted);">Loading audit records...</div>
          </div>
        </div>
      </div>
    `;

    await loadLogs();
  }

  async function loadLogs() {
    try {
      const res = await API.get('/audit?limit=100');
      const logs = res.logs || [];
      const tableContainer = document.getElementById('audit-logs-table-container');

      if (logs.length === 0) {
        tableContainer.innerHTML = `
          <div style="text-align: center; padding: 36px; color: var(--color-text-muted);">
            No audit records recorded yet.
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 12px; text-transform: uppercase;">
              <th style="padding: 12px;">Timestamp</th>
              <th style="padding: 12px;">Event Type</th>
              <th style="padding: 12px;">Description</th>
              <th style="padding: 12px;">IP Address</th>
              <th style="padding: 12px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px; font-size: 12px; color: var(--color-text-dim);">${new Date(l.timestamp).toLocaleString()}</td>
                <td style="padding: 12px; font-weight: 600;">${l.event_type}</td>
                <td style="padding: 12px;">${escapeHtml(l.description)}</td>
                <td style="padding: 12px; font-family: var(--font-mono); font-size: 12px;">${l.ip_address || '127.0.0.1'}</td>
                <td style="padding: 12px;">
                  <span class="badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${l.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      Toast.show('Failed to load audit logs', 'error');
    }
  }

  async function clearLogs() {
    if (!confirm('Are you sure you want to clear your audit trail history?')) return;
    try {
      await API.delete('/audit');
      Toast.show('Audit trail cleared', 'success');
      await loadLogs();
    } catch (err) {
      Toast.show('Failed to clear audit trail', 'error');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    clearLogs
  };
})();
