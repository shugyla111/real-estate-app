// "Subscribe to newsletter" forms: POST /api/newsletter
document.querySelectorAll('.newsletter__form').forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  const status = document.createElement('p');
  status.className = 'newsletter__status';
  status.setAttribute('role', 'status');
  form.after(status);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.value })
      });
      const data = await res.json();
      status.textContent = res.ok ? 'Thank you! You are subscribed.' : data.error;
      status.classList.toggle('is-error', !res.ok);
      if (res.ok) form.reset();
    } catch {
      status.textContent = 'Could not subscribe. Please try again later.';
      status.classList.add('is-error');
    } finally {
      button.disabled = false;
    }
  });
});
