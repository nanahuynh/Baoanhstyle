# Style by BaoAnh

Website bán hàng thời trang — Houston, TX · (669) 292-7189

HTML/CSS/JavaScript thuần, không cần build. Đăng nhập, đơn hàng, đánh giá, đổi trả và trang quản trị dùng Firebase (Authentication + Firestore). Chưa có Firebase thì web chạy ở chế độ demo (dữ liệu lưu trên trình duyệt).

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
ruby -run -e httpd . -p 5173
```

Mở http://localhost:5173

## Cấu hình

- **Sản phẩm, giá, bảng size, phí ship, thuế, mã giảm giá, chính sách:** đầu file `js/main.js`
- **Firebase:** `js/firebase-config.js` (config + `ADMIN_EMAILS`)
- **Quyền database:** dán `firestore.rules` vào Firebase Console → Firestore → Rules
