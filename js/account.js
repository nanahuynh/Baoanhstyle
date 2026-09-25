// Account page: sign in, sign up, forgot password, signed-in view
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, configured, authError } from './auth.js';

const $ = id => document.getElementById(id);
const views = ['signin', 'signup', 'forgot', 'account'];
// After signing in, go back where the customer came from (e.g. checkout.html)
const next = new URLSearchParams(location.search).get('next');
const safeNext = next && /^[a-z]+\.html$/.test(next) ? next : null;

function show(view) {
  views.forEach(v => { $('view-' + v).hidden = v !== view; });
  document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; });
  const first = $('view-' + view).querySelector('input');
  if (first && view !== 'account') first.focus();
}

function setBusy(form, busy) {
  const btn = form.querySelector('[type=submit]');
  btn.disabled = busy;
  btn.style.opacity = busy ? 0.6 : '';
}

function fail(form, msg) { form.querySelector('.form-error').textContent = msg; }

function requireFilled(form) {
  for (const input of form.querySelectorAll('input[required]')) {
    if (!input.value.trim()) { input.focus(); fail(form, t('required')); return false; }
    if (input.type === 'email' && !input.checkValidity()) { input.focus(); fail(form, t('badEmail')); return false; }
  }
  return true;
}

// Switch between views
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) {
    // carry the typed email over to the next form
    const typed = document.querySelector('.auth-view:not([hidden]) input[type=email]')?.value;
    show(go.dataset.go);
    const nextEmail = $('view-' + go.dataset.go).querySelector('input[type=email]');
    if (typed && nextEmail && !nextEmail.value) nextEmail.value = typed;
    return;
  }
  const toggle = e.target.closest('.pw-toggle');
  if (toggle) {
    const input = toggle.previousElementSibling;
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    toggle.dataset.i18n = showing ? 'show' : 'hide';
    toggle.textContent = t(toggle.dataset.i18n);
  }
});

$('form-signin').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  if (!requireFilled(form)) return;
  setBusy(form, true);
  try {
    await signInWithEmailAndPassword(auth, $('si-email').value.trim(), $('si-pw').value);
    if (safeNext) location.href = safeNext;
  } catch (err) { fail(form, authError(err)); }
  setBusy(form, false);
});

$('form-signup').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  if (!requireFilled(form)) return;
  if ($('su-pw').value.length < 8) { $('su-pw').focus(); fail(form, t('pwShort')); return; }
  setBusy(form, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, $('su-email').value.trim(), $('su-pw').value);
    await updateProfile(cred.user, { displayName: $('su-name').value.trim() });
    renderAccount(cred.user);
    if (safeNext) location.href = safeNext;
  } catch (err) { fail(form, authError(err)); }
  setBusy(form, false);
});

$('form-forgot').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  form.querySelector('.form-ok').hidden = true;
  if (!requireFilled(form)) return;
  setBusy(form, true);
  try {
    await sendPasswordResetEmail(auth, $('fg-email').value.trim());
    form.querySelector('.form-ok').hidden = false;
  } catch (err) {
    // Same message whether or not the email exists, so no one can probe for accounts
    if (err.code === 'auth/user-not-found') form.querySelector('.form-ok').hidden = false;
    else fail(form, authError(err));
  }
  setBusy(form, false);
});

$('btn-changepw').addEventListener('click', async () => {
  const msg = $('acc-msg');
  try {
    await sendPasswordResetEmail(auth, auth.currentUser.email);
    msg.textContent = t('changePwSent');
    msg.hidden = false;
  } catch (err) {
    msg.textContent = authError(err);
    msg.hidden = false;
  }
});

$('btn-signout').addEventListener('click', () => signOut(auth));

function renderAccount(user) {
  const name = user.displayName || user.email.split('@')[0];
  $('acc-name').textContent = name;
  $('acc-email').textContent = user.email;
  $('acc-avatar').textContent = name.trim().charAt(0).toUpperCase();
}

if (!configured) {
  $('not-configured').hidden = false;
  document.querySelectorAll('.auth-card form [type=submit]').forEach(b => { b.disabled = true; b.style.opacity = 0.5; });
} else {
  document.addEventListener('authchange', e => {
    const user = e.detail;
    if (user) { renderAccount(user); show('account'); }
    else if (!$('view-account').hidden) show('signin');
  });
}

if (location.hash === '#forgot') show('forgot');
if (location.hash === '#signup') show('signup');
