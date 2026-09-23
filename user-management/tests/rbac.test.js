const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createDatabase,
  getAllPermissions,
  getRolePermissions,
  getRolePermissionMatrix,
  assignPermissionToRole,
  revokePermissionFromRole,
  setRolePermissions,
  hasPermission,
} = require("../database/db.js");
const { authorize } = require("../src/rbacMiddleware.js");

/**
 * Mock Response object để kiểm thử middleware Express độc lập
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
    end(data) {
      if (typeof data === "string") {
        try {
          res.body = JSON.parse(data);
        } catch {
          res.body = data;
        }
      }
      return res;
    },
  };
  return res;
}

describe("Task 2 & RBAC: Automated Tests cho CSDL Quyền & Middleware Phân Quyền", () => {
  let db;

  beforeEach(() => {
    // Mỗi test sử dụng một database SQLite in-memory mới kèm dữ liệu seed
    db = createDatabase(":memory:");
  });

  describe("1. Danh mục quyền và cấu trúc mặc định", () => {
    test("Hệ thống khởi tạo đầy đủ các nhóm module và quyền cơ bản", () => {
      const allPerms = getAllPermissions(db);
      assert.ok(
        allPerms.length >= 10,
        "Phải có ít nhất 10 quyền được định nghĩa sẵn",
      );

      const permCodes = allPerms.map((p) => p.code);
      assert.ok(permCodes.includes("USER_VIEW"));
      assert.ok(permCodes.includes("USER_CREATE"));
      assert.ok(permCodes.includes("INTERN_TASK_ASSIGN"));
      assert.ok(permCodes.includes("REPORT_SUBMIT"));
      assert.ok(permCodes.includes("CONTRACT_MANAGE"));
    });

    test("Vai trò HR có đúng các quyền quản trị nhân sự mặc định", () => {
      const hrPerms = getRolePermissions(db, "HR");
      assert.ok(hrPerms.includes("USER_CREATE"), "HR phải có quyền tạo user");
      assert.ok(hrPerms.includes("USER_VIEW"), "HR phải có quyền xem user");
      assert.ok(
        hrPerms.includes("CONTRACT_MANAGE"),
        "HR phải có quyền quản lý hợp đồng",
      );
      assert.equal(
        hrPerms.includes("INTERN_TASK_ASSIGN"),
        false,
        "HR mặc định không giao task chuyên môn",
      );
    });

    test("Vai trò MENTOR có quyền giao task và review báo cáo", () => {
      const mentorPerms = getRolePermissions(db, "MENTOR");
      assert.ok(mentorPerms.includes("INTERN_TASK_ASSIGN"));
      assert.ok(mentorPerms.includes("REPORT_REVIEW"));
      assert.equal(
        mentorPerms.includes("USER_CREATE"),
        false,
        "Mentor không có quyền tạo user",
      );
    });

    test("Vai trò INTERN có quyền nộp báo cáo và xem task của mình", () => {
      const internPerms = getRolePermissions(db, "INTERN");
      assert.ok(internPerms.includes("INTERN_TASK_VIEW"));
      assert.ok(internPerms.includes("REPORT_SUBMIT"));
      assert.equal(
        internPerms.includes("USER_CREATE"),
        false,
        "Intern không được tạo tài khoản",
      );
      assert.equal(
        internPerms.includes("CONTRACT_MANAGE"),
        false,
        "Intern không được quản lý hợp đồng",
      );
    });

    test("Hàm getRolePermissionMatrix trả về ma trận đủ 3 vai trò", () => {
      const matrix = getRolePermissionMatrix(db);
      assert.ok(matrix.length > 0);
      const userCreateRow = matrix.find((m) => m.code === "USER_CREATE");
      assert.ok(userCreateRow);
      assert.equal(userCreateRow.roles.HR, true);
      assert.equal(userCreateRow.roles.MENTOR, false);
      assert.equal(userCreateRow.roles.INTERN, false);
    });
  });

  describe("2. Thao tác Gán và Thu hồi quyền (Grant & Revoke)", () => {
    test("Gán thêm quyền mới cho vai trò thành công", () => {
      assert.equal(hasPermission(db, "MENTOR", "CONTRACT_VIEW"), false);

      assignPermissionToRole(db, "MENTOR", "CONTRACT_VIEW");
      assert.equal(hasPermission(db, "MENTOR", "CONTRACT_VIEW"), true);
    });

    test("Thu hồi quyền khỏi vai trò thành công", () => {
      assert.equal(hasPermission(db, "HR", "CONTRACT_MANAGE"), true);

      revokePermissionFromRole(db, "HR", "CONTRACT_MANAGE");
      assert.equal(hasPermission(db, "HR", "CONTRACT_MANAGE"), false);
    });

    test("Cập nhật hàng loạt danh sách quyền bằng setRolePermissions", () => {
      const newPerms = ["USER_VIEW", "REPORT_SUBMIT"];
      setRolePermissions(db, "INTERN", newPerms);

      const updated = getRolePermissions(db, "INTERN");
      assert.deepEqual(updated.sort(), newPerms.sort());
    });

    test("Ngăn chặn gán quyền cho vai trò không hợp lệ (CHECK constraint)", () => {
      assert.throws(() => {
        assignPermissionToRole(db, "GUEST_ROLE", "USER_VIEW");
      });
    });
  });

  describe("3. Middleware Phân quyền API (authorize)", () => {
    test("Trả về mã 401 Unauthorized khi request không có thông tin đăng nhập", () => {
      const middleware = authorize("USER_VIEW", { db });
      const req = { user: null };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(
        nextCalled,
        false,
        "Không được gọi next() khi chưa đăng nhập",
      );
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.error, "Unauthorized");
    });

    test("Trả về mã 403 Forbidden khi vai trò không có quyền yêu cầu", () => {
      const middleware = authorize("USER_CREATE", { db });
      // Giả lập Intern cố gọi API tạo tài khoản
      const req = { user: { role: "INTERN", email: "intern@co.com" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, "Không được gọi next() khi thiếu quyền");
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.error, "Forbidden");
      assert.ok(res.body.missingPermissions.includes("USER_CREATE"));
    });

    test("Cho phép đi tiếp (next()) khi vai trò sở hữu quyền yêu cầu", () => {
      const middleware = authorize("USER_CREATE", { db });
      // Giả lập HR gọi API tạo tài khoản
      const req = { user: { role: "HR", email: "hr@co.com" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(
        nextCalled,
        true,
        "HR có quyền USER_CREATE nên phải gọi next()",
      );
      assert.equal(res.statusCode, 200);
    });

    test("Mentor được cấp quyền giao việc INTERN_TASK_ASSIGN", () => {
      const middleware = authorize("INTERN_TASK_ASSIGN", { db });
      const req = { user: { role: "MENTOR", email: "mentor@co.com" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe("4. Middleware Chế độ Đa quyền (Mode ALL & ANY)", () => {
    test("Chế độ ALL: Bị từ chối nếu thiếu dù chỉ 1 quyền", () => {
      const middleware = authorize(["INTERN_PROFILE_VIEW", "USER_CREATE"], {
        mode: "ALL",
        db,
      });
      // Mentor chỉ có INTERN_PROFILE_VIEW, thiếu USER_CREATE
      const req = { user: { role: "MENTOR" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.body.missingPermissions, ["USER_CREATE"]);
    });

    test("Chế độ ALL: Cho phép khi sở hữu đầy đủ tất cả quyền", () => {
      const middleware = authorize(["USER_VIEW", "USER_CREATE"], {
        mode: "ALL",
        db,
      });
      // HR có cả 2 quyền này
      const req = { user: { role: "HR" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });

    test("Chế độ ANY: Cho phép khi sở hữu ít nhất 1 trong các quyền", () => {
      const middleware = authorize(["USER_CREATE", "REPORT_REVIEW"], {
        mode: "ANY",
        db,
      });
      // Mentor không có USER_CREATE nhưng CÓ REPORT_REVIEW
      const req = { user: { role: "MENTOR" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(
        nextCalled,
        true,
        "Mode ANY chỉ cần thỏa 1 quyền là được phép",
      );
    });

    test("Chế độ ANY: Bị từ chối khi không sở hữu bất kỳ quyền nào trong danh sách", () => {
      const middleware = authorize(["USER_CREATE", "CONTRACT_MANAGE"], {
        mode: "ANY",
        db,
      });
      // Intern không có cả 2 quyền trên
      const req = { user: { role: "INTERN" } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
    });
  });

  describe("5. Hỗ trợ Custom Permission Checker (Không phụ thuộc trực tiếp DB)", () => {
    test("Chạy với mảng user.permissions có sẵn trong token", () => {
      const middleware = authorize("SPECIAL_OP");
      const req = { user: { role: "HR", permissions: ["SPECIAL_OP"] } };
      const res = createMockResponse();
      let nextCalled = false;

      middleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });
});
