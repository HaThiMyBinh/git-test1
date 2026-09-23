const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createDatabase,
  insertUser,
  findUserByEmail,
  findUsersByRole,
} = require("../database/db.js");

describe("Task 2: Automated Tests cho Database Schema (Users Table)", () => {
  let db;

  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  describe("1. Khởi tạo cấu trúc bảng (Table Creation)", () => {
    test("Bảng users và các chỉ mục được tạo thành công", () => {
      const tableInfo = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        )
        .get();
      assert.ok(tableInfo, "Bảng users phải tồn tại trong CSDL");

      const indexes = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users'",
        )
        .all();
      const indexNames = indexes.map((idx) => idx.name);
      assert.ok(
        indexNames.includes("idx_users_email"),
        "Index idx_users_email phải tồn tại",
      );
      assert.ok(
        indexNames.includes("idx_users_role"),
        "Index idx_users_role phải tồn tại",
      );
      assert.ok(
        indexNames.includes("idx_users_status"),
        "Index idx_users_status phải tồn tại",
      );
    });
  });

  describe("2. Thêm người dùng với các vai trò hợp lệ (HR, MENTOR, INTERN)", () => {
    test("Thêm thành công tài khoản HR", () => {
      const result = insertUser(db, {
        email: "hr.leader@company.com",
        password_hash: "$2b$10$hashedPasswordHere123456789",
        full_name: "Trần Văn HR",
        role: "HR",
        phone_number: "0901234567",
      });
      assert.equal(result.changes, 1);

      const user = findUserByEmail(db, "hr.leader@company.com");
      assert.equal(user.role, "HR");
      assert.equal(user.full_name, "Trần Văn HR");
      assert.equal(user.status, "ACTIVE"); // Mặc định là ACTIVE
      assert.ok(user.created_at, "created_at phải được tự động sinh");
    });

    test("Thêm thành công tài khoản MENTOR", () => {
      const result = insertUser(db, {
        email: "mentor.tech@company.com",
        password_hash: "$2b$10$hashedPasswordHere123456789",
        full_name: "Lê Văn Mentor",
        role: "MENTOR",
      });
      assert.equal(result.changes, 1);

      const user = findUserByEmail(db, "mentor.tech@company.com");
      assert.equal(user.role, "MENTOR");
    });

    test("Thêm thành công tài khoản INTERN (Thực tập sinh)", () => {
      const result = insertUser(db, {
        email: "intern.fpt@company.com",
        password_hash: "$2b$10$hashedPasswordHere123456789",
        full_name: "Phạm Văn Intern",
        role: "INTERN",
      });
      assert.equal(result.changes, 1);

      const user = findUserByEmail(db, "intern.fpt@company.com");
      assert.equal(user.role, "INTERN");
    });
  });

  describe("3. Ràng buộc toàn vẹn dữ liệu (Constraints)", () => {
    test("Ràng buộc UNIQUE: Ngăn chặn chèn trùng lặp địa chỉ email", () => {
      insertUser(db, {
        email: "duplicate@company.com",
        password_hash: "hash1",
        full_name: "Người thứ nhất",
        role: "HR",
      });

      assert.throws(
        () => {
          insertUser(db, {
            email: "duplicate@company.com",
            password_hash: "hash2",
            full_name: "Người thứ hai",
            role: "MENTOR",
          });
        },
        (err) => {
          return (
            err.message.includes("UNIQUE constraint failed") ||
            err.message.includes("uq_users_email")
          );
        },
        "Hệ thống phải chặn lỗi trùng lặp UNIQUE email",
      );
    });

    test("Ràng buộc CHECK Role: Ngăn chặn vai trò không hợp lệ (ngoài HR, MENTOR, INTERN)", () => {
      assert.throws(
        () => {
          insertUser(db, {
            email: "hacker@company.com",
            password_hash: "hash123",
            full_name: "Hacker User",
            role: "SUPER_ADMIN",
          });
        },
        (err) => {
          return (
            err.message.includes("CHECK constraint failed") ||
            err.message.includes("chk_users_role")
          );
        },
        "Database phải kích hoạt lỗi CHECK constraint khi role không thuộc [HR, MENTOR, INTERN]",
      );
    });

    test("Ràng buộc NOT NULL: Ngăn chặn thiếu email, mật khẩu hoặc họ tên", () => {
      assert.throws(() => {
        db.prepare(
          "INSERT INTO users (password_hash, full_name, role) VALUES (?, ?, ?)",
        ).run("hash", "No Email", "HR");
      });

      assert.throws(() => {
        db.prepare(
          "INSERT INTO users (email, full_name, role) VALUES (?, ?, ?)",
        ).run("test@mail.com", "No Pass", "HR");
      });

      assert.throws(() => {
        db.prepare(
          "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        ).run("test@mail.com", "hash", "HR");
      });
    });

    test("Ràng buộc CHECK Status: Ngăn chặn trạng thái tài khoản không hợp lệ", () => {
      assert.throws(
        () => {
          insertUser(db, {
            email: "status.test@company.com",
            password_hash: "hash",
            full_name: "Test Status",
            role: "INTERN",
            status: "DELETED",
          });
        },
        (err) => {
          return (
            err.message.includes("CHECK constraint failed") ||
            err.message.includes("chk_users_status")
          );
        },
      );
    });
  });

  describe("4. Truy vấn lọc người dùng theo vai trò", () => {
    test("Tìm đúng danh sách theo từng vai trò đã đăng ký", () => {
      insertUser(db, {
        email: "hr1@co.com",
        password_hash: "h",
        full_name: "HR One",
        role: "HR",
      });
      insertUser(db, {
        email: "hr2@co.com",
        password_hash: "h",
        full_name: "HR Two",
        role: "HR",
      });
      insertUser(db, {
        email: "mentor1@co.com",
        password_hash: "h",
        full_name: "Mentor One",
        role: "MENTOR",
      });
      insertUser(db, {
        email: "intern1@co.com",
        password_hash: "h",
        full_name: "Intern One",
        role: "INTERN",
      });

      const hrList = findUsersByRole(db, "HR");
      const mentorList = findUsersByRole(db, "MENTOR");
      const internList = findUsersByRole(db, "INTERN");

      assert.equal(hrList.length, 2);
      assert.equal(mentorList.length, 1);
      assert.equal(internList.length, 1);
    });
  });
});
