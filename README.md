# 🦉 Bé Vui Học

Ứng dụng web giúp bé học **Toán lớp 1 – 3** theo dạng game lên level. Giao diện đen – vàng, chạy hoàn toàn trên trình duyệt (không cần cài đặt, không gửi dữ liệu đi đâu).

## Nội dung hiện có

| Phép tính | Bài học |
|---|---|
| ➕ Cộng | Phạm vi 10 · 20 · 100 · 1000 · 10 000 |
| ➖ Trừ | Phạm vi 10 · 20 · 100 · 1000 · 10 000 |
| ✖️ Nhân | Phép nhân là gì? · Bảng nhân 2, 5 · Bảng nhân 3, 4 · Bảng nhân 6 – 9 · Nhân số có 2, 3 chữ số với số có 1 chữ số |

Mỗi bài gồm:

1. **Lý thuyết có giọng đọc** – bấm 🔊 để nghe cả bài hoặc từng đoạn (dùng giọng tiếng Việt có sẵn của máy).
2. **5 màn chơi trắc nghiệm** – Khởi động → Tăng tốc → Tìm số bí ẩn → Giải toán có lời văn → Thử thách Vàng. Câu hỏi được tạo ngẫu nhiên nên mỗi lần chơi là một đề mới.
3. **Đáp án và giải thích** hiện ngay dưới mỗi câu (cách đếm, tách số tròn chục, đặt tính cột có nhớ...).

Đúng ≥ 3/5 câu để mở khoá màn tiếp theo, đúng 5/5 được 3 sao. Mỗi câu đúng +10 XP để bé lên cấp. Tiến độ lưu trong trình duyệt của máy (localStorage).

## Giọng đọc tiếng Việt

Ứng dụng dùng Web Speech API của trình duyệt:
- **Điện thoại Android / iPhone, iPad**: thường có sẵn giọng tiếng Việt.
- **Máy tính**: nên dùng **Microsoft Edge** (có giọng HoaiMy/NamMinh). Với Chrome trên Windows, cài thêm gói ngôn ngữ Tiếng Việt (Cài đặt → Thời gian & ngôn ngữ → Giọng nói).

## Cấu trúc mã

```
index.html
css/style.css
js/core/        tiện ích chung: utils (giải thích phép tính), speech (đọc to), sound, store (lưu tiến độ)
js/subjects/    mỗi môn một file: math.js (Toán), english.js (Tiếng Anh – sắp ra mắt)
js/app.js       điều hướng và giao diện
```

Thêm môn mới (ví dụ Tiếng Anh): khai báo bài học trong `js/subjects/english.js` theo cùng cấu trúc với `math.js` và đặt `lang: 'en-US'` để đọc bằng giọng tiếng Anh.

## Chạy thử trên máy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy `python3 -m http.server` rồi vào http://localhost:8000.
