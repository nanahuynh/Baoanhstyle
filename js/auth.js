// Firebase Authentication — loaded on every page as a module (after main.js)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

export const configured = !!firebaseConfig.apiKey;
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = configured ? getAuth(app) : null;

Object.assign(I18N.vi, {
  account: 'Tài khoản', signIn: 'Đăng nhập', signUp: 'Tạo tài khoản', signOut: 'Đăng xuất',
  hello: 'Xin chào', password: 'Mật khẩu', password2: 'Nhập lại mật khẩu', show: 'Hiện', hide: 'Ẩn',
  forgot: 'Quên mật khẩu?', noAccount: 'Chưa có tài khoản?', haveAccount: 'Đã có tài khoản?',
  forgotTitle: 'Quên mật khẩu', forgotBody: 'Nhập email bạn đã đăng ký. Shop sẽ gửi link để bạn đặt mật khẩu mới.',
  sendLink: 'Gửi link đặt lại', backToSignIn: '← Quay lại đăng nhập',
  resetSent: 'Nếu email này đã đăng ký, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút. Nhớ kiểm tra cả mục Spam.',
  changePw: 'Đổi mật khẩu', changePwSent: 'Đã gửi link đổi mật khẩu tới email của bạn.',
  pwShort: 'Mật khẩu cần ít nhất 8 ký tự.', pwMismatch: 'Hai mật khẩu chưa khớp.',
  signInIntro: 'Đăng nhập để thanh toán nhanh hơn.', signUpIntro: 'Tạo tài khoản để lần sau không phải nhập lại thông tin.',
  memberSince: 'Thành viên từ', shopNowShort: 'Mua sắm ngay', loginToFill: 'Đăng nhập để điền nhanh',
  notConfigured: 'Chức năng đăng nhập chưa được bật: cần dán cấu hình Firebase vào js/firebase-config.js.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
  'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng "Quên mật khẩu".',
  'auth/invalid-email': 'Email chưa đúng định dạng.',
  'auth/weak-password': 'Mật khẩu quá yếu.',
  'auth/too-many-requests': 'Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
  'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối rồi thử lại.',
  authGeneric: 'Có lỗi xảy ra. Vui lòng thử lại.'
});
Object.assign(I18N.en, {
  account: 'Account', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
  hello: 'Hello', password: 'Password', password2: 'Confirm password', show: 'Show', hide: 'Hide',
  forgot: 'Forgot password?', noAccount: 'New here?', haveAccount: 'Already have an account?',
  forgotTitle: 'Forgot password', forgotBody: 'Enter the email you signed up with and we will send you a link to set a new password.',
  sendLink: 'Send reset link', backToSignIn: '← Back to sign in',
  resetSent: 'If this email has an account, a reset link is on its way. Check your spam folder too.',
  changePw: 'Change password', changePwSent: 'We sent a password change link to your email.',
  pwShort: 'Password must be at least 8 characters.', pwMismatch: 'Passwords do not match.',
  signInIntro: 'Sign in for a faster checkout.', signUpIntro: 'Create an account so you never retype your details.',
  memberSince: 'Member since', shopNowShort: 'Start shopping', loginToFill: 'Sign in to fill this in',
  notConfigured: 'Sign-in is not switched on yet: paste your Firebase config into js/firebase-config.js.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/email-already-in-use': 'This email already has an account. Sign in or use "Forgot password".',
  'auth/invalid-email': 'Please enter a valid email.',
  'auth/weak-password': 'Password is too weak.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  authGeneric: 'Something went wrong. Please try again.'
});

export function authError(err) {
  return I18N[state.lang][err && err.code] || t('authGeneric');
}

// Shared: keep the header's account link in sync with who is signed in
function syncHeader(user) {
  document.querySelectorAll('[data-account-link]').forEach(a => {
    const label = user ? `${t('account')}: ${user.displayName || user.email}` : t('signIn');
    a.setAttribute('aria-label', label);
    a.title = label;
    a.classList.toggle('signed-in', !!user);
  });
  document.dispatchEvent(new CustomEvent('authchange', { detail: user }));
}

export let currentUser = null;
if (auth) {
  auth.languageCode = state.lang;
  document.addEventListener('langchange', () => { auth.languageCode = state.lang; syncHeader(currentUser); });
  onAuthStateChanged(auth, user => { currentUser = user; syncHeader(user); });
} else {
  syncHeader(null);
}
applyLang();
