// Demo form: there is no server yet, so we only validate and show a message.
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('cf-status');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  invalid.forEach((el) => el.classList.add('is-invalid'));

  if (invalid.length) {
    statusEl.textContent = 'Please fill in the highlighted fields.';
    statusEl.className = 'contact-form__status is-error';
    invalid[0].focus();
    return;
  }

  statusEl.textContent = `Thank you, ${form.elements.name.value.trim()}! We will reply within one working day.`;
  statusEl.className = 'contact-form__status is-success';
  form.reset();
});

form.addEventListener('input', (e) => {
  if (e.target.checkValidity()) e.target.classList.remove('is-invalid');
});
