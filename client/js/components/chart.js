/**
 * PassVault Visual Chart & SVG Security Score Gauge Component
 */

const SecurityChart = (function() {
  /**
   * Render SVG Circular Security Gauge
   */
  function renderGauge(containerId, score) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const clampedScore = Math.max(0, Math.min(100, score));
    const circumference = 377; // 2 * PI * r (r = 60)
    const offset = circumference - (clampedScore / 100) * circumference;

    let strokeColor = 'var(--color-danger)';
    let scoreText = 'CRITICAL';
    if (clampedScore >= 80) {
      strokeColor = 'var(--color-success)';
      scoreText = 'EXCELLENT';
    } else if (clampedScore >= 60) {
      strokeColor = '#84cc16';
      scoreText = 'GOOD';
    } else if (clampedScore >= 40) {
      strokeColor = 'var(--color-warning)';
      scoreText = 'FAIR';
    } else if (clampedScore >= 20) {
      strokeColor = '#f97316';
      scoreText = 'POOR';
    }

    container.innerHTML = `
      <svg class="gauge-circle" viewBox="0 0 140 140">
        <circle class="gauge-bg" cx="70" cy="70" r="60"></circle>
        <circle class="gauge-value" cx="70" cy="70" r="60" style="stroke: ${strokeColor}; stroke-dashoffset: ${offset};"></circle>
      </svg>
      <div class="gauge-center-text">
        <span class="gauge-score" style="color: ${strokeColor};">${clampedScore}%</span>
        <span class="gauge-label">${scoreText}</span>
      </div>
    `;
  }

  /**
   * Render HTML Breakdown Bars for Vault Categories & Health
   */
  function renderBreakdownBar(elementId, percent, color) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.width = `${percent}%`;
    el.style.backgroundColor = color;
  }

  return {
    renderGauge,
    renderBreakdownBar
  };
})();
