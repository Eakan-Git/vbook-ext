# vbook-ext

Extensions cho [vBook](https://vbook.app) của Eakan.

## Cài đặt

vBook → Cài đặt → Tiện ích mở rộng → Thêm nguồn (+) → dán:

```
https://raw.githubusercontent.com/Eakan-Git/vbook-ext/main/plugin.json
```

Nếu không vào được raw.githubusercontent.com, dùng link này (có thể cập nhật chậm tối đa 12 giờ):

```
https://cdn.jsdelivr.net/gh/Eakan-Git/vbook-ext@main/plugin.json
```

## Danh sách extension

| Extension | Nguồn | Ghi chú |
|---|---|---|
| [Mê Truyện Chữ (Full TOC)](metruyenchu) | metruyenchu.com.vn | Hiển thị đủ mục lục cho truyện trên 400 chương, có giới hạn tốc độ |
| [Tàng Thư Viện (ThaoMoc)](tangthuvien) | tangthuvien.thaomocvn.com | Mục lục đầy đủ qua API, tìm kiếm, duyệt thể loại |

## Thêm extension mới

1. Tạo thư mục `<ten-ext>/` gồm `plugin.json`, `icon.png` và `src/*.js`.
2. Chạy `node tools/build.js`. Lệnh này đóng gói `plugin.zip` cho từng thư mục và tạo lại `plugin.json` (catalog) ở thư mục gốc.
3. Mỗi lần sửa extension, tăng `metadata.version` trong file `plugin.json` của extension đó.
4. Commit và push.
