// Contact form: quick checks in the browser, then POST /api/contact.
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('cf-status');

function showStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = `contact-form__status is-${kind}`;
}

function markInvalid(fields) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  fields.forEach((el) => el.classList.add('is-invalid'));
  if (fields.length) fields[0].focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  markInvalid(invalid);
  if (invalid.length) {
    showStatus('Please fill in the highlighted fields.', 'error');
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await res.json();

    if (!res.ok) {
      // The server names the wrong fields: { errors: { email: '...' } }
      markInvalid(Object.keys(body.errors || {}).map((name) => form.elements[name]).filter(Boolean));
      showStatus(Object.values(body.errors || {})[0] || body.error, 'error');
      return;
    }

    showStatus(`Thank you, ${data.name.trim()}! We will reply within one working day.`, 'success');
    form.reset();
  } catch {
    showStatus('Could not send the message. Please try again later.', 'error');
  } finally {
    button.disabled = false;
  }
});

form.addEventListener('input', (e) => {
  if (e.target.checkValidity()) e.target.classList.remove('is-invalid');
});
