/**
 * PassVault Password Generator View Controller
 */

const GeneratorView = (function() {
  function render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="animate-fade-in">
        <div class="glass-card generator-container">
          <div style="text-align: center;">
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 6px;">Password Generator</h2>
            <p style="font-size: 14px; color: var(--color-text-muted);">
              Generate cryptographically strong, unguessable passwords with custom parameters.
            </p>
          </div>

          <!-- Password Display Box -->
          <div class="generator-output-box">
            <span id="gen-output-text" class="generator-output-text">Generating...</span>
            <div style="display: flex; gap: 8px;">
              <button class="btn-icon" title="Regenerate" onclick="GeneratorView.updateOutput()">
                <i class="fas fa-sync-alt" id="gen-refresh-icon"></i>
              </button>
              <button class="btn btn-primary btn-sm" onclick="GeneratorView.copyOutput()">
                <i class="fas fa-copy"></i> Copy
              </button>
            </div>
          </div>

          <!-- Strength Indicator -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
              <span>Strength Rating: <span id="gen-strength-level" style="color: var(--color-success);">Very Strong</span></span>
              <span id="gen-entropy-score" style="color: var(--color-text-muted);">118 bits of entropy</span>
            </div>
            <div class="strength-meter-bar">
              <div id="gen-strength-fill" class="strength-meter-fill strength-very-strong"></div>
            </div>
          </div>

          <!-- Options -->
          <div class="generator-options">
            <!-- Length Slider -->
            <div class="range-slider-group">
              <div class="range-header">
                <span class="form-label" style="margin: 0;">Password Length</span>
                <span id="gen-length-val" class="range-value">18</span>
              </div>
              <input type="range" id="gen-length-slider" class="custom-range" min="6" max="64" value="18" />
            </div>

            <!-- Checkboxes -->
            <div class="options-checkbox-grid">
              <label class="checkbox-card">
                <input type="checkbox" id="gen-opt-upper" checked />
                <span style="font-size: 14px; font-weight: 500;">Uppercase (A-Z)</span>
              </label>
              <label class="checkbox-card">
                <input type="checkbox" id="gen-opt-lower" checked />
                <span style="font-size: 14px; font-weight: 500;">Lowercase (a-z)</span>
              </label>
              <label class="checkbox-card">
                <input type="checkbox" id="gen-opt-numbers" checked />
                <span style="font-size: 14px; font-weight: 500;">Numbers (0-9)</span>
              </label>
              <label class="checkbox-card">
                <input type="checkbox" id="gen-opt-symbols" checked />
                <span style="font-size: 14px; font-weight: 500;">Symbols (!@#$%^&*)</span>
              </label>
            </div>

            <label class="checkbox-card" style="margin-top: 4px;">
              <input type="checkbox" id="gen-opt-similar" />
              <span style="font-size: 14px; font-weight: 500;">Exclude Similar Characters (i, l, 1, L, o, 0, O)</span>
            </label>
          </div>
        </div>
      </div>
    `;

    const slider = document.getElementById('gen-length-slider');
    slider.addEventListener('input', (e) => {
      document.getElementById('gen-length-val').textContent = e.target.value;
      updateOutput();
    });

    ['gen-opt-upper', 'gen-opt-lower', 'gen-opt-numbers', 'gen-opt-symbols', 'gen-opt-similar'].forEach(id => {
      document.getElementById(id).addEventListener('change', updateOutput);
    });

    updateOutput();
  }

  function updateOutput() {
    const refreshIcon = document.getElementById('gen-refresh-icon');
    if (refreshIcon) {
      refreshIcon.style.transform = 'rotate(180deg)';
      refreshIcon.style.transition = 'transform 0.3s ease';
      setTimeout(() => { refreshIcon.style.transform = 'rotate(0deg)'; }, 300);
    }

    const length = parseInt(document.getElementById('gen-length-slider').value) || 18;
    const uppercase = document.getElementById('gen-opt-upper').checked;
    const lowercase = document.getElementById('gen-opt-lower').checked;
    const numbers = document.getElementById('gen-opt-numbers').checked;
    const symbols = document.getElementById('gen-opt-symbols').checked;
    const excludeSimilar = document.getElementById('gen-opt-similar').checked;

    const password = PasswordUtils.generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeSimilar
    });

    const outputText = document.getElementById('gen-output-text');
    outputText.textContent = password;

    const evaluation = PasswordUtils.evaluateStrength(password);
    const levelEl = document.getElementById('gen-strength-level');
    const entropyEl = document.getElementById('gen-entropy-score');
    const fillEl = document.getElementById('gen-strength-fill');

    levelEl.textContent = evaluation.level;
    levelEl.style.color = evaluation.color;
    entropyEl.textContent = `${evaluation.entropy} bits of entropy`;

    fillEl.className = 'strength-meter-fill';
    if (evaluation.score >= 85) fillEl.classList.add('strength-very-strong');
    else if (evaluation.score >= 70) fillEl.classList.add('strength-strong');
    else if (evaluation.score >= 50) fillEl.classList.add('strength-fair');
    else if (evaluation.score >= 30) fillEl.classList.add('strength-weak');
    else fillEl.classList.add('strength-very-weak');
  }

  function copyOutput() {
    const text = document.getElementById('gen-output-text').textContent;
    ClipboardUtil.copyToClipboard(text, 'Generated Password');
  }

  return {
    render,
    updateOutput,
    copyOutput
  };
})();
