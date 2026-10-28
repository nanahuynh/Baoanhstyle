<?php
// ===== Cấu hình server =====
// 1. Copy file này thành  api/config.php  (cùng thư mục) rồi sửa bên dưới.
// 2. KHÔNG đưa config.php lên GitHub (đã có trong .gitignore) vì chứa mật khẩu.
return [
  // Tài khoản vào trang quản trị (admin.html): email => mật khẩu.
  // Đặt mật khẩu dài, khó đoán. Có thể thêm nhiều dòng.
  'admins' => [
    'email-cua-shop@gmail.com' => 'doi-mat-khau-nay',
  ],

  // ----- Cơ sở dữ liệu: chọn MỘT trong hai -----

  // (A) MySQL — tạo database trong trang quản lý hosting (cPanel / DirectAdmin) rồi điền vào:
  // 'db' => [
  //   'dsn'  => 'mysql:host=localhost;dbname=TEN_DATABASE;charset=utf8mb4',
  //   'user' => 'TEN_USER',
  //   'pass' => 'MAT_KHAU_DATABASE',
  // ],

  // (B) SQLite — không cần tạo gì, dữ liệu nằm trong 1 file.
  // Nên để file NGOÀI thư mục public_html, ví dụ '/home/tenhosting/baoanh-data/shop.sqlite'.
  'db' => [
    'dsn' => 'sqlite:' . __DIR__ . '/data/shop.sqlite',
  ],

  // Email gửi đi (link đặt lại mật khẩu). Nên dùng email theo tên miền, ví dụ no-reply@stylebybaoanh.com
  'mail_from' => 'no-reply@stylebybaoanh.com',
];
