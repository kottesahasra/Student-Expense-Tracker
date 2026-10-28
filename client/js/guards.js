(function() {
  const currentPath = window.location.pathname.toLowerCase();
  const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html') || currentPath.endsWith('index.html') || currentPath.endsWith('/');
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);

  if (!token && !isAuthPage) {
    window.location.href = 'login.html';
  } else if (token && (currentPath.endsWith('login.html') || currentPath.endsWith('register.html'))) {
    window.location.href = 'dashboard.html';
  }
})();

