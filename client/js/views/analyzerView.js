/**
 * PassVault Password Strength & Vulnerability Analyzer View Controller
 */

const AnalyzerView = (function() {
  function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 6px;">Password Strength Analyzer</h2>
          <p style="font-size: 14px; color: var(--color-text-muted);">
            Test any password against entropy heuristics, length bounds, pattern analysis, and estimated brute-force time.
          </p>
        </div>

        <div class="glass-card" style="padding: 32px; display: flex; flex-direction: column; gap: 24px;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label">Test Password</label>
            <div class="input-with-icon">
              <input type="password" id="analyzer-input" class="form-control font-mono" style="font-size: 18px;" placeholder="Type password here to analyze..." autofocus />
              <button type="button" class="input-icon-btn" onclick="togglePasswordVisibility('analyzer-input')">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <!-- Score & Crack Time Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div style="padding: 16px; background: var(--color-bg-glass); border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
              <div style="font-size: 12px; color: var(--color-text-muted); font-weight: 600;">SCORE</div>
              <div id="analyzer-score-val" style="font-size: 24px; font-weight: 800; color: var(--color-danger); margin-top: 4px;">0%</div>
            </div>
            <div style="padding: 16px; background: var(--color-bg-glass); border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
              <div style="font-size: 12px; color: var(--color-text-muted); font-weight: 600;">ENTROPY</div>
              <div id="analyzer-entropy-val" style="font-size: 24px; font-weight: 800; color: var(--color-primary); margin-top: 4px;">0 bits</div>
            </div>
            <div style="padding: 16px; background: var(--color-bg-glass); border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
              <div style="font-size: 12px; color: var(--color-text-muted); font-weight: 600;">EST. TIME TO CRACK</div>
              <div id="analyzer-crack-val" style="font-size: 20px; font-weight: 800; color: var(--color-text-main); margin-top: 6px;">Instant</div>
            </div>
          </div>

          <!-- Character Composition Checks -->
          <div>
            <div style="font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 10px;">CHARACTER COMPOSITION</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
              <div id="comp-length" class="badge badge-danger" style="justify-content: center; padding: 10px;"><i class="fas fa-times"></i> 12+ Chars</div>
              <div id="comp-upper" class="badge badge-danger" style="justify-content: center; padding: 10px;"><i class="fas fa-times"></i> Uppercase</div>
              <div id="comp-lower" class="badge badge-danger" style="justify-content: center; padding: 10px;"><i class="fas fa-times"></i> Lowercase</div>
              <div id="comp-symbols" class="badge badge-danger" style="justify-content: center; padding: 10px;"><i class="fas fa-times"></i> Symbols & Numbers</div>
            </div>
          </div>

          <!-- Warnings & Suggestions -->
          <div>
            <div style="font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 10px;">ANALYSIS & RECOMMENDATIONS</div>
            <div id="analyzer-recommendations" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 13px; color: var(--color-text-muted);">Enter a password above to generate security recommendations.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('analyzer-input').addEventListener('input', (e) => analyzePassword(e.target.value));
  }

  function analyzePassword(pwd) {
    const evalData = PasswordUtils.evaluateStrength(pwd);
    const scoreVal = document.getElementById('analyzer-score-val');
    const entropyVal = document.getElementById('analyzer-entropy-val');
    const crackVal = document.getElementById('analyzer-crack-val');

    scoreVal.textContent = `${evalData.score}%`;
    scoreVal.style.color = evalData.color;
    entropyVal.textContent = `${evalData.entropy} bits`;

    // Estimate crack time based on 100 billion guesses/sec GPU cluster
    crackVal.textContent = estimateCrackTime(evalData.entropy);

    // Update composition badges
    updateBadge('comp-length', pwd.length >= 12, '12+ Chars');
    updateBadge('comp-upper', /[A-Z]/.test(pwd), 'Uppercase');
    updateBadge('comp-lower', /[a-z]/.test(pwd), 'Lowercase');
    updateBadge('comp-symbols', /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd), 'Symbols & Numbers');

    // Update recommendations
    const recContainer = document.getElementById('analyzer-recommendations');
    if (!pwd) {
      recContainer.innerHTML = `<div style="font-size: 13px; color: var(--color-text-muted);">Enter a password above to generate security recommendations.</div>`;
      return;
    }

    if (evalData.warnings.length === 0) {
      recContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--color-success-bg); color: var(--color-success); border-radius: var(--radius-md);">
          <i class="fas fa-check-circle"></i>
          <span style="font-size: 13px; font-weight: 500;">Excellent password! Meets all security standards.</span>
        </div>
      `;
    } else {
      recContainer.innerHTML = evalData.warnings.map(w => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--color-warning-bg); color: var(--color-warning); border-radius: var(--radius-md);">
          <i class="fas fa-exclamation-triangle"></i>
          <span style="font-size: 13px; font-weight: 500;">${w}</span>
        </div>
      `).join('');
    }
  }

  function updateBadge(id, isPassed, label) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isPassed) {
      el.className = 'badge badge-success';
      el.innerHTML = `<i class="fas fa-check"></i> ${label}`;
    } else {
      el.className = 'badge badge-danger';
      el.innerHTML = `<i class="fas fa-times"></i> ${label}`;
    }
  }

  function estimateCrackTime(entropy) {
    if (entropy === 0) return 'Instant';
    const guesses = Math.pow(2, entropy);
    const guessesPerSec = 1e11; // 100 Billion per second
    const seconds = guesses / (2 * guessesPerSec);

    if (seconds < 1) return 'Instant (<1s)';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
    return '100+ Century';
  }

  return {
    render
  };
})();
