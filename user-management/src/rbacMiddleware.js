/**
 * Tạo middleware kiểm tra quyền truy cập API
 * @param {string | string[]} requiredPermissions
 * @param {Object} [options]
 * @param {'ALL' | 'ANY'} [options.mode='ALL']
 * @param {Function} [options.permissionChecker]
 * @param {import('../database/db.js').hasPermission} [options.db]
 * @returns {Function}
 */
function authorize(requiredPermissions, options = {}) {
  const { mode = "ALL", permissionChecker = null, db = null } = options;
  const permissionsList = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return function rbacMiddleware(req, res, next) {
    // Kiểm tra xác thực (Authentication check)
    // Giả định đối tượng user được đính kèm vào req sau khi xác thực token/session
    const user = req.user;

    if (!user || !user.role) {
      const responseBody = {
        success: false,
        statusCode: 401,
        error: "Unauthorized",
        message:
          "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập.",
      };

      if (typeof res.status === "function") {
        return res.status(401).json(responseBody);
      }
      res.statusCode = 401;
      return res.end ? res.end(JSON.stringify(responseBody)) : responseBody;
    }

    const userRole = String(user.role).toUpperCase();

    // Hàm kiểm tra một quyền đối với vai trò hiện tại
    const checkSinglePermission = (permCode) => {
      // Trường hợp truyền vào custom checker
      if (typeof permissionChecker === "function") {
        return permissionChecker(userRole, permCode);
      }
      // Trường hợp truyền vào instance Database SQLite
      if (db && typeof db.prepare === "function") {
        const stmt = db.prepare(
          "SELECT 1 FROM role_permissions WHERE role = ? AND permission_code = ? LIMIT 1",
        );
        return Boolean(stmt.get(userRole, permCode));
      }
      // Trường hợp user object đã có sẵn danh sách permissions trong token/session
      if (Array.isArray(user.permissions)) {
        return user.permissions.includes(permCode);
      }
      return false;
    };

    // Đánh giá quyền theo chế độ mode ('ALL' hoặc 'ANY')
    let hasAccess = false;
    let missingPermissions = [];

    if (mode === "ANY") {
      hasAccess = permissionsList.some((p) => checkSinglePermission(p));
      if (!hasAccess) {
        missingPermissions = permissionsList;
      }
    } else {
      // Mặc định: ALL
      missingPermissions = permissionsList.filter(
        (p) => !checkSinglePermission(p),
      );
      hasAccess = missingPermissions.length === 0;
    }

    // Nếu thiếu quyền -> Trả về 403 Forbidden
    if (!hasAccess) {
      const responseBody = {
        success: false,
        statusCode: 403,
        error: "Forbidden",
        message: `Truy cập bị từ chối. Vai trò '${userRole}' không được phép thực hiện thao tác này.`,
        requiredPermissions: permissionsList,
        missingPermissions,
      };

      if (typeof res.status === "function") {
        return res.status(403).json(responseBody);
      }
      res.statusCode = 403;
      return res.end ? res.end(JSON.stringify(responseBody)) : responseBody;
    }

    // Thỏa mãn quyền -> Cho phép request đi tiếp
    if (typeof next === "function") {
      return next();
    }
    return true;
  };
}

module.exports = {
  authorize,
};
