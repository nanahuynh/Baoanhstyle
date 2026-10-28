# Style by BaoAnh

Website bán hàng thời trang — Houston, TX · (669) 292-7189

HTML/CSS/JavaScript thuần, không cần build. Đăng nhập, đơn hàng, đánh giá, đổi trả, kho hàng và sổ thu chi lưu trên server riêng (PHP + MySQL hoặc SQLite, thư mục `api/`). Chưa đưa lên server (ví dụ đang chạy trên GitHub Pages) thì web chạy ở chế độ demo: dữ liệu chỉ lưu trên trình duyệt của người xem.

## Flow mua hàng

Home → Shop → Danh mục → Bộ lọc → Sản phẩm → Giỏ hàng → Thanh toán → Đặt hàng thành công → Tài khoản → Đã giao → Đánh giá / Đổi / Trả

| Trang | Mô tả |
|---|---|
| `index.html` | Trang chủ |
| `shop.html` | Shop, danh mục, lọc Size / Màu / Giá / Dịp mặc |
| `product.html?id=e` | Chi tiết sản phẩm: ảnh, video, bảng size, tìm size, mô tả, đánh giá |
| `cart.html` | Giỏ hàng: mã giảm giá, ước tính phí ship, thuế, tổng |
| `checkout.html` | Thanh toán 5 bước (liên hệ, địa chỉ, cách giao, thanh toán, xem lại) |
| `order.html` | Đặt hàng thành công |
| `account.html` | Tài khoản: đơn hàng, theo dõi, yêu thích, địa chỉ, hồ sơ, đánh giá, đổi trả |
| `returns.html` | Chính sách giao hàng & đổi trả |
| `admin.html` | Quản trị: khách hàng & đơn, kho, đổi trả, vốn & chi phí |

## Chạy trên máy

```bash
php -S localhost:5173
```

Mở http://localhost:5173 (chế độ demo). Muốn thử cả server: tạo `api/config.php` như bên dưới và đổi `API_URL` trong `js/config.js` thành `'api/'`.

## Đưa lên server (hosting có PHP 8.1 trở lên)

1. Upload **toàn bộ** thư mục web lên `public_html` (hoặc thư mục gốc của tên miền).
2. Trong thư mục `api/`, copy `config.sample.php` thành **`config.php`** rồi sửa:
   - `admins`: email và mật khẩu đăng nhập trang quản trị.
   - `db`: thông tin database MySQL tạo trong cPanel/DirectAdmin, hoặc giữ SQLite (không cần tạo gì).
   - `mail_from`: email gửi link đặt lại mật khẩu.
3. Mở `js/config.js`, đổi `API_URL` thành `'api/'`.
4. Mở `https://tên-miền/admin.html`, đăng nhập bằng email + mật khẩu ở bước 2.

Bảng dữ liệu tự tạo ở lần chạy đầu. `api/config.php` và `api/data/` không được đưa lên GitHub (có trong `.gitignore`).
Sao lưu: tải file SQLite (hoặc export database MySQL trong phpMyAdmin) định kỳ.

## Cấu hình

- **Sản phẩm, giá, bảng size, phí ship, thuế, mã giảm giá, chính sách:** đầu file `js/main.js`
- **Server:** `js/config.js` (`API_URL`) và `api/config.php` (tài khoản quản trị, database, email)
- **Quyền dữ liệu:** `api/lib.php` — khách chỉ xem đơn / đổi trả của chính mình; kho hàng và sổ thu chi chỉ tài khoản quản trị xem được.
