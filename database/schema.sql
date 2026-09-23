
-- 1. Bảng Users (Thông tin tài khoản)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL COLLATE NOCASE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc toàn vẹn dữ liệu
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('HR', 'MENTOR', 'INTERN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    CONSTRAINT chk_users_fullname CHECK (length(trim(full_name)) >= 2),
    CONSTRAINT chk_users_email CHECK (email LIKE '%_@__%.__%')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Bảng Danh mục Quyền (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

-- 3. Bảng Gán Quyền cho Vai trò (Role-Permission Mapping)
CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(20) NOT NULL,
    permission_code VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role, permission_code),
    CONSTRAINT chk_role_permissions_role CHECK (role IN ('HR', 'MENTOR', 'INTERN')),
    CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- ====================================================================
-- SEED DATA: Danh mục Quyền và Phân quyền Mặc định
-- ====================================================================

INSERT OR IGNORE INTO permissions (code, name, module, description) VALUES
('USER_VIEW', 'Xem danh sách người dùng', 'QUẢN LÝ TÀI KHOẢN', 'Xem thông tin cơ bản của các tài khoản'),
('USER_CREATE', 'Tạo tài khoản người dùng', 'QUẢN LÝ TÀI KHOẢN', 'Thêm mới tài khoản cho HR, Mentor, Intern'),
('USER_UPDATE', 'Cập nhật tài khoản', 'QUẢN LÝ TÀI KHOẢN', 'Chỉnh sửa thông tin tài khoản người dùng'),
('USER_STATUS_CHANGE', 'Khóa / Mở khóa tài khoản', 'QUẢN LÝ TÀI KHOẢN', 'Thay đổi trạng thái Active/Inactive'),

('INTERN_PROFILE_VIEW', 'Xem hồ sơ thực tập sinh', 'QUẢN LÝ THỰC TẬP', 'Xem thông tin chuyên môn, trường học của Intern'),
('INTERN_TASK_ASSIGN', 'Giao nhiệm vụ cho Intern', 'QUẢN LÝ THỰC TẬP', 'Phân công công việc và deadline cho thực tập sinh'),
('INTERN_TASK_VIEW', 'Xem nhiệm vụ được giao', 'QUẢN LÝ THỰC TẬP', 'Xem danh sách công việc cá nhân cần thực hiện'),

('REPORT_SUBMIT', 'Nộp báo cáo định kỳ', 'ĐÁNH GIÁ & BÁO CÁO', 'Nộp báo cáo công việc hàng tuần/tháng'),
('REPORT_REVIEW', 'Review & Phê duyệt báo cáo', 'ĐÁNH GIÁ & BÁO CÁO', 'Nhận xét và chấm điểm báo cáo thực tập'),
('EVALUATION_MANAGE', 'Đánh giá kết quả thực tập', 'ĐÁNH GIÁ & BÁO CÁO', 'Lập phiếu đánh giá hoàn thành kỳ thực tập'),

('CONTRACT_VIEW', 'Xem hợp đồng thực tập', 'HỢP ĐỒNG & CHẾ ĐỘ', 'Xem thông tin phụ cấp và hợp đồng'),
('CONTRACT_MANAGE', 'Soạn thảo & Quản lý hợp đồng', 'HỢP ĐỒNG & CHẾ ĐỘ', 'Ký kết và điều chỉnh chế độ đãi ngộ'),

('RBAC_MANAGE', 'Quản lý ma trận phân quyền', 'CẤU HÌNH HỆ THỐNG', 'Điều chỉnh quyền hạn cho từng vai trò');

-- Phân quyền mặc định cho HR:
-- HR quản lý tài khoản, hợp đồng, hồ sơ intern, xem báo cáo tổng thể
INSERT OR IGNORE INTO role_permissions (role, permission_code) VALUES
('HR', 'USER_VIEW'),
('HR', 'USER_CREATE'),
('HR', 'USER_UPDATE'),
('HR', 'USER_STATUS_CHANGE'),
('HR', 'INTERN_PROFILE_VIEW'),
('HR', 'CONTRACT_VIEW'),
('HR', 'CONTRACT_MANAGE'),
('HR', 'EVALUATION_MANAGE');

-- Phân quyền mặc định cho MENTOR:
-- Mentor quản lý task, review báo cáo, đánh giá kết quả intern
INSERT OR IGNORE INTO role_permissions (role, permission_code) VALUES
('MENTOR', 'INTERN_PROFILE_VIEW'),
('MENTOR', 'INTERN_TASK_ASSIGN'),
('MENTOR', 'REPORT_REVIEW'),
('MENTOR', 'EVALUATION_MANAGE');

-- Phân quyền mặc định cho INTERN:
-- Intern xem task được giao, nộp báo cáo, xem hợp đồng của mình
INSERT OR IGNORE INTO role_permissions (role, permission_code) VALUES
('INTERN', 'INTERN_TASK_VIEW'),
('INTERN', 'REPORT_SUBMIT'),
('INTERN', 'CONTRACT_VIEW');
