const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Khởi tạo kết nối SQLite và áp dụng schema
 * @param {string} [dbPath=':memory:'] Đường dẫn file db hoặc in-memory ':memory:'
 * @returns {DatabaseSync}
 */
function createDatabase(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Bật foreign keys và thực thi DDL
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);
  return db;
}

/**
 * Thêm người dùng mới vào database
 */
function insertUser(db, { email, password_hash, full_name, role, phone_number = null, status = 'ACTIVE' }) {
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(email, password_hash, full_name, role, phone_number, status);
}

/**
 * Tìm người dùng theo email
 */
function findUserByEmail(db, email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
  return stmt.get(email);
}

/**
 * Lấy danh sách người dùng theo vai trò
 */
function findUsersByRole(db, role) {
  const stmt = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC');
  return stmt.all(role);
}

// ====================================================================
// RBAC QUERIES & HELPERS
// ====================================================================

/**
 * Lấy danh sách toàn bộ quyền hệ thống, phân loại theo Module
 * @param {DatabaseSync} db
 * @returns {Array<{ code: string, name: string, module: string, description: string }>}
 */
function getAllPermissions(db) {
  const stmt = db.prepare('SELECT code, name, module, description FROM permissions ORDER BY module, code');
  return stmt.all();
}

/**
 * Lấy danh sách mã quyền được cấp cho một vai trò
 * @param {DatabaseSync} db
 * @param {string} role ('HR' | 'MENTOR' | 'INTERN')
 * @returns {string[]} Danh sách mã quyền
 */
function getRolePermissions(db, role) {
  const stmt = db.prepare('SELECT permission_code FROM role_permissions WHERE role = ? ORDER BY permission_code');
  const rows = stmt.all(role);
  return rows.map((r) => r.permission_code);
}

/**
 * Lấy ma trận quyền của cả 3 vai trò cùng thông tin chi tiết từng quyền
 * @param {DatabaseSync} db
 */
function getRolePermissionMatrix(db) {
  const permissions = getAllPermissions(db);
  const hrPerms = new Set(getRolePermissions(db, 'HR'));
  const mentorPerms = new Set(getRolePermissions(db, 'MENTOR'));
  const internPerms = new Set(getRolePermissions(db, 'INTERN'));

  return permissions.map((p) => ({
    ...p,
    roles: {
      HR: hrPerms.has(p.code),
      MENTOR: mentorPerms.has(p.code),
      INTERN: internPerms.has(p.code),
    },
  }));
}

/**
 * Gán một quyền cho vai trò
 * @param {DatabaseSync} db
 * @param {string} role
 * @param {string} permissionCode
 */
function assignPermissionToRole(db, role, permissionCode) {
  const stmt = db.prepare(`
    INSERT INTO role_permissions (role, permission_code)
    VALUES (?, ?)
    ON CONFLICT(role, permission_code) DO NOTHING
  `);
  return stmt.run(role, permissionCode);
}

/**
 * Thu hồi quyền khỏi vai trò
 * @param {DatabaseSync} db
 * @param {string} role
 * @param {string} permissionCode
 */
function revokePermissionFromRole(db, role, permissionCode) {
  const stmt = db.prepare('DELETE FROM role_permissions WHERE role = ? AND permission_code = ?');
  return stmt.run(role, permissionCode);
}

/**
 * Cập nhật toàn bộ danh sách quyền cho một vai trò (thay thế danh sách cũ)
 * @param {DatabaseSync} db
 * @param {string} role
 * @param {string[]} permissionCodes
 */
function setRolePermissions(db, role, permissionCodes) {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM role_permissions WHERE role = ?').run(role);
    const insertStmt = db.prepare('INSERT INTO role_permissions (role, permission_code) VALUES (?, ?)');
    for (const code of permissionCodes) {
      insertStmt.run(role, code);
    }
    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Kiểm tra xem vai trò có quyền cụ thể hay không
 * @param {DatabaseSync} db
 * @param {string} role
 * @param {string} permissionCode
 * @returns {boolean}
 */
function hasPermission(db, role, permissionCode) {
  if (!role || !permissionCode) return false;
  const stmt = db.prepare('SELECT 1 FROM role_permissions WHERE role = ? AND permission_code = ? LIMIT 1');
  const result = stmt.get(role, permissionCode);
  return Boolean(result);
}

module.exports = {
  createDatabase,
  insertUser,
  findUserByEmail,
  findUsersByRole,
  getAllPermissions,
  getRolePermissions,
  getRolePermissionMatrix,
  assignPermissionToRole,
  revokePermissionFromRole,
  setRolePermissions,
  hasPermission,
};
