// Backfill userId from JWT if missing
(function backfillUserIdFromToken(){
  try {
    const token = localStorage.getItem('token');
    const hasId = localStorage.getItem('userId');
    if (token && !hasId) {
      const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('')
        .map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      const uid = payload.id || payload.userId || payload._id || payload.sub;
      if (uid) localStorage.setItem('userId', uid);
    }
  } catch {}
})();console.log("🔒 auth.js loaded");

const token = localStorage.getItem("token");
const publicPages = ["login.html", "register.html", "index.html"];

const currentPage = window.location.pathname.split("/").pop();
console.log("📄 Current page:", currentPage);
console.log("🪪 Token exists?", !!token);

if (!token && !publicPages.includes(currentPage)) {
  console.warn("🚨 Not logged in, redirecting to login.html");
  window.location.href = "login.html";
}