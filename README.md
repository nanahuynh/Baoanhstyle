# Style by BaoAnh Closet

Website bán hàng thời trang — Houston, TX · (669) 292-7189

HTML/CSS/JavaScript thuần, không cần build. Đăng nhập, đơn hàng và trang quản trị dùng Firebase.

## Các trang

| Trang | Mô tả |
|---|---|
| `index.html` | Trang chủ |
| `product.html?id=a` | Chi tiết sản phẩm |
| `cart.html` | Giỏ hàng |
| `checkout.html` | Thanh toán (Zelle / Venmo / tiền mặt) |
| `account.html` | Đăng nhập, tạo tài khoản, quên mật khẩu |
| `admin.html` | Quản trị: khách hàng & đơn, kho hàng, vốn & chi phí |

## Chạy trên máy

```bash
ruby -run -e httpd . -p 5173
```

Mở http://localhost:5173

## Cấu hình

- **Giá, phí ship:** đầu file `js/main.js` (`PRODUCTS`, `SHIPPING_FEE`)
- **Firebase:** `js/firebase-config.js` (config + `ADMIN_EMAILS`)
- **Quyền database:** dán `firestore.rules` vào Firebase Console → Firestore → Rules
