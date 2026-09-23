user-management/
├── database/
│ ├── schema.sql # [Task 2] Cấu trúc bảng Users, constraints (CHECK role, UNIQUE email, NOT NULL)
│ └── db.js # [Task 2] Khởi tạo SQLite connection & hàm query
├── src/
│ └── validator.js # [Task 1] Module kiểm tra tính hợp lệ dữ liệu (Form Validator)
├── public/
│ ├── index.html # [Task 1] Giao diện Form tạo tài khoản (Role Cards, Realtime feedback)
│ ├── style.css # [Task 1] File CSS giao diện hiện đại & responsive
│ └── app.js # [Task 1] Xử lý sự kiện giao diện, password generator & mock accounts
├── tests/
│ ├── validation.test.js # [Auto Test] 19 automated test cases cho form validation
│ └── db_schema.test.js # [Auto Test] 12 automated test cases cho database schema
├── run-tests.bat # Click đúp để chạy nhanh toàn bộ Automated Tests trên Windows
├── open-ui.bat # Click đúp để mở ngay giao diện Web trên trình duyệt
└── package.json # Cấu hình dự án & scripts test
