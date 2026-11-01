// Agent login: POST /api/auth/login sets a session cookie, then we go to the dashboard.
const form = document.getElementById('login-form');
const errorEl = document.getElementById('l-error');

// Already logged in -> straight to the dashboard
fetch('/api/auth/me').then((res) => { if (res.ok) location.replace('admin.html'); }).catch(() => {});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || !password) { errorEl.textContent = 'Please enter your email and password.'; return; }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) { location.replace('admin.html'); return; }
    errorEl.textContent = (await res.json()).error;
    form.elements.password.value = '';
    form.elements.password.focus();
  } catch {
    errorEl.textContent = 'Could not reach the server. Please try again later.';
  } finally {
    button.disabled = false;
  }
});
