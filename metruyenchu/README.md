# Mê Truyện Chữ (Full TOC)

Extension đọc truyện từ metruyenchu.com.vn.

- **Đủ chương.** API `/get/listchap` của trang chỉ trả trang 1–4 (400 chương); từ trang 5 trở đi nó trả lại trang 1. Extension lấy 400 chương đầu từ API. Các chương sau được tìm link thật qua form "Tìm chương" của trang (`/get/goto`). Khi đọc hoặc tải theo thứ tự, extension dùng link "Chương tiếp" đã lưu nên không tốn thêm request nào.
- **Giới hạn tốc độ.** Tối đa 2 luồng, cách nhau ít nhất 1 giây. Gặp lỗi 429 hoặc 5xx thì tự chờ (theo Retry-After nếu có) và thử lại.
- **Chương bị khóa** (form "nhập mã") hiện thông báo thay vì báo lỗi. Extension không vượt qua khóa.
