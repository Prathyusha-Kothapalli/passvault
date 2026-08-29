/**
 * PassVault Main Application Controller & Single Page Router
 */

const App = (function() {
  let currentView = 'dashboard';

  function init() {
    Auth.init();

    if (Auth.isAuthenticated()) {
      showMainWorkspace();
      AutoLock.init();
      navigate('dashboard');
    } else {
      showAuthScreen();
    }
  }

  function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-workspace').style.display = 'none';
    setupAuthListeners();
  }

  function showMainWorkspace() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-workspace').style.display = 'flex';
    
    const user = Auth.getUser();
    if (user) {
      document.getElementById('user-email-display').textContent = user.email;
      document.getElementById('user-avatar-initial').textContent = user.email.charAt(0).toUpperCase();
    }
  }

  function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          await Auth.login(email, password);
          Toast.show('Welcome back to PassVault!', 'success');
          showMainWorkspace();
          AutoLock.init();
          navigate('dashboard');
        } catch (err) {
          Toast.show(err.message || 'Login failed', 'error');
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (password !== confirm) {
          Toast.show('Passwords do not match', 'error');
          return;
        }

        try {
          await Auth.register(email, password);
          Toast.show('Account created successfully!', 'success');
          showMainWorkspace();
          AutoLock.init();
          navigate('dashboard');
        } catch (err) {
          Toast.show(err.message || 'Registration failed', 'error');
        }
      });
    }
  }

  function toggleAuthTab(tab) {
    const loginBox = document.getElementById('login-box');
    const regBox = document.getElementById('register-box');
    const loginBtn = document.getElementById('tab-btn-login');
    const regBtn = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      loginBox.style.display = 'block';
      regBox.style.display = 'none';
      loginBtn.classList.add('active');
      regBtn.classList.remove('active');
    } else {
      loginBox.style.display = 'none';
      regBox.style.display = 'block';
      loginBtn.classList.remove('active');
      regBtn.classList.add('active');
    }
  }

  function fillDemoAccount() {
    toggleAuthTab('login');
    document.getElementById('login-email').value = 'demo@passvault.com';
    document.getElementById('login-password').value = 'Demo@123';
    Toast.show('Loaded demo credentials!', 'info');
  }

  function navigate(viewName) {
    currentView = viewName;

    // Update active nav button
    document.querySelectorAll('.nav-item button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      }
    });

    // Update title
    const headings = {
      dashboard: 'Security Health Dashboard',
      vault: 'Password Vault',
      generator: 'Password Generator',
      analyzer: 'Strength Analyzer',
      notes: 'Secure Notes',
      audit: 'Audit Log & Activity Trail',
      backup: 'Backup & Restore',
      settings: 'Settings & Profile'
    };
    document.getElementById('current-page-title').textContent = headings[viewName] || 'PassVault';

    // Render view
    switch (viewName) {
      case 'dashboard': DashboardView.render(); break;
      case 'vault': VaultView.render(); break;
      case 'generator': GeneratorView.render(); break;
      case 'analyzer': AnalyzerView.render(); break;
      case 'notes': NotesView.render(); break;
      case 'audit': AuditView.render(); break;
      case 'backup': BackupView.render(); break;
      case 'settings': SettingsView.render(); break;
      default: DashboardView.render();
    }
  }

  return {
    init,
    navigate,
    toggleAuthTab,
    fillDemoAccount
  };
})();

// Global helper function for toggling password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
