/**
 * PassVault Dashboard View Controller
 */

const DashboardView = (function() {
  async function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="dashboard-grid">
          <!-- Security Score Gauge Card -->
          <div class="glass-card security-gauge-card">
            <div id="security-gauge" class="gauge-container"></div>
            <div class="security-summary">
              <span class="badge badge-primary" style="width: max-content;">Security Audit</span>
              <h2 class="security-title" id="security-status-title">Evaluating Security...</h2>
              <p class="security-subtitle" id="security-status-desc">
                Analyzing password strength, encryption status, and vault entry health.
              </p>
            </div>
          </div>

          <!-- Top Metrics Cards -->
          <div class="dashboard-stats-col">
            <div class="metrics-row">
              <div class="glass-card metric-card">
                <span class="metric-value" id="stat-total-passwords" style="color: var(--color-primary);">0</span>
                <span class="metric-label">Vault Passwords</span>
              </div>
              <div class="glass-card metric-card">
                <span class="metric-value" id="stat-secure-notes" style="color: var(--color-accent);">0</span>
                <span class="metric-label">Secure Notes</span>
              </div>
              <div class="glass-card metric-card">
                <span class="metric-value" id="stat-favorites" style="color: var(--color-warning);">0</span>
                <span class="metric-label">Favorites</span>
              </div>
              <div class="glass-card metric-card">
                <span class="metric-value" id="stat-weak-count" style="color: var(--color-danger);">0</span>
                <span class="metric-label">Weak Passwords</span>
              </div>
            </div>
          </div>

          <!-- Vulnerabilities & Security Recommendations -->
          <div class="glass-card vulnerability-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h3 style="font-size: 16px; font-weight: 700;">Security Recommendations</h3>
              <span class="badge badge-warning" id="vulnerability-badge">0 Issues</span>
            </div>
            <div id="vulnerabilities-list" style="display: flex; flex-direction: column; gap: 12px;">
              <div style="color: var(--color-text-muted); font-size: 13px;">Analyzing vault entries...</div>
            </div>
          </div>

          <!-- Recent Audit Logs -->
          <div class="glass-card activity-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h3 style="font-size: 16px; font-weight: 700;">Recent Audit Trail</h3>
              <button class="btn btn-secondary btn-sm" onclick="App.navigate('audit')">View All</button>
            </div>
            <div id="recent-activity-list" class="activity-list">
              <div style="color: var(--color-text-muted); font-size: 13px;">Loading audit logs...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    await loadDashboardData();
  }

  async function loadDashboardData() {
    try {
      const masterSecret = Auth.getMasterSecret();
      const vaultRes = await API.get('/vault');
      const notesRes = await API.get('/notes');
      const auditRes = await API.get('/audit?limit=5');

      const items = vaultRes.items || [];
      const notes = notesRes.notes || [];
      const logs = auditRes.logs || [];

      // Decrypt passwords to evaluate overall health score
      let totalScore = 0;
      let weakCount = 0;
      let reusedMap = {};
      let vulnerabilities = [];

      for (const item of items) {
        try {
          const plainPassword = await CryptoUtil.decryptText(item.encrypted_password, masterSecret);
          const evaluation = PasswordUtils.evaluateStrength(plainPassword);
          totalScore += evaluation.score;

          if (evaluation.score < 50) {
            weakCount++;
            vulnerabilities.push({
              title: item.title,
              type: 'Weak Password',
              desc: `Password score is low (${evaluation.score}% - ${evaluation.level}).`
            });
          }

          if (reusedMap[plainPassword]) {
            reusedMap[plainPassword].push(item.title);
          } else {
            reusedMap[plainPassword] = [item.title];
          }
        } catch (e) {
          totalScore += 50;
        }
      }

      // Check for reused passwords
      Object.keys(reusedMap).forEach(pwd => {
        if (reusedMap[pwd].length > 1) {
          vulnerabilities.push({
            title: reusedMap[pwd].join(', '),
            type: 'Duplicate Password',
            desc: `Same password is used across ${reusedMap[pwd].length} accounts.`
          });
        }
      });

      const avgScore = items.length > 0 ? Math.round(totalScore / items.length) : 100;
      const favCount = items.filter(i => i.is_favorite).length + notes.filter(n => n.is_favorite).length;

      // Render gauge
      SecurityChart.renderGauge('security-gauge', avgScore);

      // Update text
      const statusTitle = document.getElementById('security-status-title');
      const statusDesc = document.getElementById('security-status-desc');

      if (avgScore >= 80) {
        statusTitle.textContent = 'Vault Posture: Strong';
        statusDesc.textContent = 'Your passwords have high entropy and zero detected breaches.';
      } else if (avgScore >= 50) {
        statusTitle.textContent = 'Vault Posture: Fair';
        statusDesc.textContent = 'Some passwords require strengthening or duplicate reduction.';
      } else {
        statusTitle.textContent = 'Vault Posture: Vulnerable';
        statusDesc.textContent = 'Multiple weak or repeated passwords detected. Action recommended.';
      }

      // Update stats
      document.getElementById('stat-total-passwords').textContent = items.length;
      document.getElementById('stat-secure-notes').textContent = notes.length;
      document.getElementById('stat-favorites').textContent = favCount;
      document.getElementById('stat-weak-count').textContent = weakCount;

      // Render recommendations
      const vulnContainer = document.getElementById('vulnerabilities-list');
      const vulnBadge = document.getElementById('vulnerability-badge');
      vulnBadge.textContent = `${vulnerabilities.length} Issues`;
      vulnBadge.className = `badge ${vulnerabilities.length > 0 ? 'badge-warning' : 'badge-success'}`;

      if (vulnerabilities.length === 0) {
        vulnContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-success-bg); border-radius: var(--radius-md); color: var(--color-success);">
            <i class="fas fa-shield-alt" style="font-size: 20px;"></i>
            <span style="font-size: 14px; font-weight: 500;">No vulnerabilities detected. All entries meet high security standards!</span>
          </div>
        `;
      } else {
        vulnContainer.innerHTML = vulnerabilities.map(v => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--color-bg-glass); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div>
              <div style="font-weight: 600; font-size: 14px;">${v.title}</div>
              <div style="font-size: 12px; color: var(--color-text-muted);">${v.desc}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('vault')">Fix</button>
          </div>
        `).join('');
      }

      // Render recent activity list
      const activityContainer = document.getElementById('recent-activity-list');
      if (logs.length === 0) {
        activityContainer.innerHTML = `<div style="color: var(--color-text-muted); font-size: 13px;">No recent activity logs.</div>`;
      } else {
        activityContainer.innerHTML = logs.map(l => `
          <div class="activity-item">
            <div class="activity-icon">
              <i class="fas ${getActivityIcon(l.event_type)}"></i>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 600;">${l.description}</div>
              <div style="font-size: 11px; color: var(--color-text-dim);">${new Date(l.timestamp).toLocaleString()}</div>
            </div>
            <span class="badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${l.status}</span>
          </div>
        `).join('');
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
      Toast.show('Failed to load dashboard metrics', 'error');
    }
  }

  function getActivityIcon(type) {
    if (type.includes('LOGIN')) return 'fa-sign-in-alt';
    if (type.includes('VAULT')) return 'fa-key';
    if (type.includes('NOTE')) return 'fa-sticky-note';
    if (type.includes('BACKUP')) return 'fa-database';
    return 'fa-shield-alt';
  }

  return {
    render
  };
})();
