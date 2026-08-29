/**
 * PassVault Auth Manager & Session Controller
 */

const Auth = (function() {
  let currentUser = null;
  let masterSecret = null;

  function init() {
    const savedUser = localStorage.getItem('passvault_user');
    const savedSecret = sessionStorage.getItem('passvault_master_secret');

    if (savedUser && savedSecret) {
      try {
        currentUser = JSON.parse(savedUser);
        masterSecret = savedSecret;
        applyTheme(currentUser.theme_preference || 'dark');
      } catch (e) {
        logout();
      }
    }
  }

  async function login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('passvault_token', data.token);
      localStorage.setItem('passvault_user', JSON.stringify(data.user));
      
      // Store secret in sessionStorage only for session duration
      masterSecret = `${data.user.email}:${password}`;
      sessionStorage.setItem('passvault_master_secret', masterSecret);

      currentUser = data.user;
      applyTheme(currentUser.theme_preference || 'dark');
      return data;
    }
  }

  async function register(email, password) {
    const data = await API.post('/auth/register', { email, password });
    if (data.success) {
      localStorage.setItem('passvault_token', data.token);
      localStorage.setItem('passvault_user', JSON.stringify(data.user));

      masterSecret = `${data.user.email}:${password}`;
      sessionStorage.setItem('passvault_master_secret', masterSecret);

      currentUser = data.user;
      applyTheme(currentUser.theme_preference || 'dark');
      return data;
    }
  }

  function logout() {
    localStorage.removeItem('passvault_token');
    localStorage.removeItem('passvault_user');
    sessionStorage.removeItem('passvault_master_secret');
    currentUser = null;
    masterSecret = null;
    window.location.reload();
  }

  function isAuthenticated() {
    return !!localStorage.getItem('passvault_token') && !!masterSecret;
  }

  function getUser() {
    return currentUser;
  }

  function getMasterSecret() {
    return masterSecret;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  return {
    init,
    login,
    register,
    logout,
    isAuthenticated,
    getUser,
    getMasterSecret,
    applyTheme
  };
})();
