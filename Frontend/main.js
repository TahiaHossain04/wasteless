// ---------- ENV ORIGIN (dev vs prod) ----------
window.API_ORIGIN =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://YOUR-BACKEND.onrender.com'; // <-- replace with your real backend URL

// ---------- Simple HTML includes loader ----------
async function loadHTMLIncludes() {
  const includes = document.querySelectorAll('[include-html]');
  await Promise.all(Array.from(includes).map(async el => {
    const file = el.getAttribute('include-html');
    if (!file) return;
    try {
      const res = await fetch(file, { cache: 'no-cache' });
      const html = await res.text();
      el.innerHTML = html;
      el.removeAttribute('include-html');
      // We DON'T rely on scripts inside header anymore, so no need to execute them.
    } catch (e) {
      console.error('Include failed:', file, e);
    }
  }));
}

// ---------- Auth-aware header toggling ----------
function refreshHeaderAuthUI() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const isAuthed = !!localStorage.getItem('token');

  // Protected links visible only when logged in
  header.querySelectorAll('[data-protected]').forEach(a => {
    a.toggleAttribute('hidden', !isAuthed);
  });

  // Public links that should hide after login (e.g., Login)
  header.querySelectorAll('[data-hide-when-auth]').forEach(a => {
    a.toggleAttribute('hidden', isAuthed);
  });

  // Logout button
  const logoutBtn = header.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.hidden = !isAuthed;
    if (!logoutBtn._bound) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        location.href = 'login.html';
      });
      logoutBtn._bound = true;
    }
  }
}

// ---------- Bootstrap on page load ----------
document.addEventListener('DOMContentLoaded', async () => {
  await loadHTMLIncludes();    // load header/footer, etc.
  refreshHeaderAuthUI();       // then toggle based on auth
});
