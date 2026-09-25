// ===== Cấu hình Firebase =====
// 1. Vào https://console.firebase.google.com → Add project
// 2. Build → Authentication → Get started → bật "Email/Password"
// 3. Build → Firestore Database → Create database (chọn Production mode)
//    → tab Rules → dán nội dung file firestore.rules → Publish
// 4. Project settings (bánh răng) → Your apps → bấm </> (Web) → đăng ký app
// 5. Copy object firebaseConfig ở đó dán đè vào bên dưới.
// Các khóa này được phép công khai (Firebase thiết kế vậy), không phải mật khẩu.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: ''
};

// Email được vào trang quản trị (admin.html). Phải giống danh sách trong firestore.rules.
// Chỉ để hiện giao diện; quyền thật do firestore.rules quyết định.
export const ADMIN_EMAILS = [
  // 'email-cua-shop@gmail.com'
];
