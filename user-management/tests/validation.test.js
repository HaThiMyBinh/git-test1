const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateFullName,
  validateEmail,
  validateRole,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
  validateUserForm,
  calculatePasswordStrength,
} = require('../src/validator.js');

describe('Task 1: Automated Tests cho Form Validation', () => {

  describe('1. Kiểm tra Họ và tên (Full Name)', () => {
    test('Từ chối họ tên rỗng hoặc chỉ chứa khoảng trắng', () => {
      assert.equal(validateFullName('').valid, false);
      assert.equal(validateFullName('   ').valid, false);
      assert.equal(validateFullName(null).valid, false);
      assert.equal(validateFullName(undefined).valid, false);
    });

    test('Từ chối họ tên ngắn hơn 2 ký tự', () => {
      const res = validateFullName('A');
      assert.equal(res.valid, false);
      assert.match(res.error, /ít nhất 2 ký tự/i);
    });

    test('Từ chối họ tên vượt quá 100 ký tự', () => {
      const longName = 'A'.repeat(101);
      const res = validateFullName(longName);
      assert.equal(res.valid, false);
      assert.match(res.error, /không được vượt quá 100 ký tự/i);
    });

    test('Chấp nhận họ tên hợp lệ tiếng Việt có dấu', () => {
      assert.equal(validateFullName('Nguyễn Văn An').valid, true);
      assert.equal(validateFullName('Trần Thị Thu Thảo').valid, true);
    });
  });

  describe('2. Kiểm tra Địa chỉ Email', () => {
    test('Từ chối email rỗng', () => {
      assert.equal(validateEmail('').valid, false);
      assert.equal(validateEmail(null).valid, false);
    });

    test('Từ chối định dạng email không hợp lệ', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingusername.com',
        'username@.com',
        'username@domain..com',
        'username@domain',
        'user name@example.com',
      ];
      for (const email of invalidEmails) {
        const res = validateEmail(email);
        assert.equal(res.valid, false, `Email '${email}' phải bị từ chối.`);
      }
    });

    test('Chấp nhận định dạng email hợp lệ', () => {
      const validEmails = [
        'admin@company.com',
        'hr.manager@sub.domain.vn',
        'intern.2026@university.edu.vn',
        'john_doe+test@gmail.com',
      ];
      for (const email of validEmails) {
        assert.equal(validateEmail(email).valid, true, `Email '${email}' phải hợp lệ.`);
      }
    });
  });

  describe('3. Kiểm tra Vai trò người dùng (Role: HR, Mentor, Intern)', () => {
    test('Từ chối vai trò rỗng', () => {
      assert.equal(validateRole('').valid, false);
      assert.equal(validateRole(null).valid, false);
    });

    test('Chấp nhận đúng 3 vai trò: HR, MENTOR, INTERN (không phân biệt hoa thường)', () => {
      assert.equal(validateRole('HR').valid, true);
      assert.equal(validateRole('hr').valid, true);
      assert.equal(validateRole('MENTOR').valid, true);
      assert.equal(validateRole('mentor').valid, true);
      assert.equal(validateRole('INTERN').valid, true);
      assert.equal(validateRole('intern').valid, true);
    });

    test('Từ chối các vai trò lạ nằm ngoài phạm vi quy định', () => {
      const invalidRoles = ['ADMIN', 'GUEST', 'SUPERUSER', 'MANAGER', 'DIRECTOR', 'STUDENT'];
      for (const role of invalidRoles) {
        const res = validateRole(role);
        assert.equal(res.valid, false, `Role '${role}' phải bị từ chối.`);
        assert.match(res.error, /Vai trò không hợp lệ/i);
      }
    });
  });

  describe('4. Kiểm tra Độ mạnh và Chuẩn Mật khẩu', () => {
    test('Từ chối mật khẩu rỗng hoặc ngắn hơn 8 ký tự', () => {
      assert.equal(validatePassword('').valid, false);
      const res = validatePassword('Pass1@');
      assert.equal(res.valid, false);
      assert.match(res.error, /tối thiểu 8 ký tự/i);
    });

    test('Từ chối mật khẩu thiếu chữ cái in hoa', () => {
      const res = validatePassword('pass1234@!');
      assert.equal(res.valid, false);
      assert.match(res.error, /chữ cái in hoa/i);
    });

    test('Từ chối mật khẩu thiếu chữ cái in thường', () => {
      const res = validatePassword('PASS1234@!');
      assert.equal(res.valid, false);
      assert.match(res.error, /chữ cái in thường/i);
    });

    test('Từ chối mật khẩu thiếu chữ số', () => {
      const res = validatePassword('Password@!');
      assert.equal(res.valid, false);
      assert.match(res.error, /chữ số/i);
    });

    test('Từ chối mật khẩu thiếu ký tự đặc biệt', () => {
      const res = validatePassword('Password1234');
      assert.equal(res.valid, false);
      assert.match(res.error, /ký tự đặc biệt/i);
    });

    test('Chấp nhận mật khẩu đạt chuẩn bảo mật', () => {
      const strongPass = 'Secure@Pass123';
      assert.equal(validatePassword(strongPass).valid, true);
    });

    test('Đo lường độ mạnh mật khẩu chính xác', () => {
      assert.equal(calculatePasswordStrength('').score, 0);
      assert.equal(calculatePasswordStrength('12345').score, 1);
      assert.equal(calculatePasswordStrength('SecurePassword123!@#').score >= 4, true);
    });
  });

  describe('5. Kiểm tra Xác nhận mật khẩu (Confirm Password)', () => {
    test('Từ chối khi không nhập xác nhận mật khẩu', () => {
      assert.equal(validateConfirmPassword('Secret123!', '').valid, false);
    });

    test('Từ chối khi xác nhận mật khẩu khác với mật khẩu ban đầu', () => {
      const res = validateConfirmPassword('Secret123!', 'Secret1234!');
      assert.equal(res.valid, false);
      assert.match(res.error, /không trùng khớp/i);
    });

    test('Chấp nhận khi mật khẩu và xác nhận mật khẩu hoàn toàn trùng khớp', () => {
      assert.equal(validateConfirmPassword('Secret123!', 'Secret123!').valid, true);
    });
  });

  describe('6. Kiểm tra Toàn bộ Payload Form tạo tài khoản', () => {
    test('Trả về lỗi chi tiết cho tất cả các trường không hợp lệ', () => {
      const badForm = {
        fullName: '',
        email: 'bad-email',
        role: 'SUPERMAN',
        password: '123',
        confirmPassword: '456',
      };
      const result = validateUserForm(badForm);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.fullName);
      assert.ok(result.errors.email);
      assert.ok(result.errors.role);
      assert.ok(result.errors.password);
      assert.ok(result.errors.confirmPassword);
    });

    test('Phê duyệt thành công khi tất cả dữ liệu hợp lệ', () => {
      const validForm = {
        fullName: 'Nguyễn Văn Mentor',
        email: 'mentor.nguyen@company.com',
        role: 'MENTOR',
        password: 'P@ssword2026!',
        confirmPassword: 'P@ssword2026!',
        phone: '0912345678',
      };
      const result = validateUserForm(validForm);
      assert.equal(result.isValid, true);
      assert.equal(Object.keys(result.errors).length, 0);
    });
  });

});
