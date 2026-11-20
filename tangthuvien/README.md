# Tàng Thư Viện (ThaoMoc)

Extension đọc truyện từ **tangthuvien.thaomocvn.com**.

- **Mục lục đầy đủ.** Lấy toàn bộ chương qua API `/api/novels/<slug>/chapters` trong một lần gọi (đã thử với truyện 6.736 chương).
- **Tìm kiếm** qua API `/api/novels?search=`.
- **Duyệt theo thể loại** và trang chủ, có phân trang.
- **Nội dung chương** đọc trực tiếp từ trang (server-rendered), tách sạch phần tiêu đề/đếm chữ.
- Giới hạn tốc độ: tối đa 3 luồng, cách nhau ít nhất 0,4 giây, tự lùi khi gặp 429/503.
