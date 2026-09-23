const ALLOWED_ROLES = ["HR", "MENTOR", "INTERN"];
const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

/**
 * Kiểm tra Họ và tên
 * @param {string} fullName
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFullName(fullName) {
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return { valid: false, error: "Họ và tên không được để trống." };
  }
  const trimmed = fullName.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Họ và tên phải có ít nhất 2 ký tự." };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Họ và tên không được vượt quá 100 ký tự." };
  }
  return { valid: true };
}

/**
 * Kiểm tra Địa chỉ Email
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Email không được để trống." };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Định dạng email không hợp lệ (Ví dụ: user@company.com).",
    };
  }
  return { valid: true };
}

/**
 * Kiểm tra Vai trò (Role)
 * @param {string} role
 * @returns {{ valid: boolean, error?: string }}
 */
function validateRole(role) {
  if (!role || typeof role !== "string" || !role.trim()) {
    return {
      valid: false,
      error: "Vui lòng chọn vai trò (HR, Mentor, hoặc Intern).",
    };
  }
  const upperRole = role.trim().toUpperCase();
  if (!ALLOWED_ROLES.includes(upperRole)) {
    return {
      valid: false,
      error: `Vai trò không hợp lệ. Chỉ chấp nhận một trong các vai trò: ${ALLOWED_ROLES.join(", ")}.`,
    };
  }
  return { valid: true };
}

/**
 * Kiểm tra Mật khẩu
 * Yêu cầu: Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Mật khẩu không được để trống." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Mật khẩu phải có tối thiểu 8 ký tự." };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z).",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Mật khẩu phải chứa ít nhất 1 chữ cái in thường (a-z).",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Mật khẩu phải chứa ít nhất 1 chữ số (0-9).",
    };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      error: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).",
    };
  }
  return { valid: true };
}

/**
 * Kiểm tra Xác nhận mật khẩu
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ valid: boolean, error?: string }}
 */
function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, error: "Vui lòng xác nhận lại mật khẩu." };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: "Mật khẩu xác nhận không trùng khớp." };
  }
  return { valid: true };
}

/**
 * Kiểm tra Số điện thoại (tùy chọn)
 * @param {string} [phone]
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: true }; // Trường không bắt buộc
  }
  const cleanPhone = phone.trim().replace(/\s+/g, "");
  if (!PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error:
        "Số điện thoại không hợp lệ (Ví dụ: 0987654321 hoặc +84987654321).",
    };
  }
  return { valid: true };
}

/**
 * Đánh giá độ mạnh mật khẩu (Score: 0 -> 4)
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: "Chưa nhập", color: "#cbd5e1" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Rất yếu", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Yếu", color: "#f97316" };
  if (score === 3) return { score: 3, label: "Trung bình", color: "#eab308" };
  if (score === 4) return { score: 4, label: "Mạnh", color: "#3b82f6" };
  return { score: 5, label: "Rất mạnh", color: "#22c55e" };
}

/**
 * Validate toàn bộ form tạo tài khoản
 * @param {Object} formData
 * @returns {{ isValid: boolean, errors: Object }}
 */
function validateUserForm(formData) {
  const errors = {};

  const nameRes = validateFullName(formData.fullName);
  if (!nameRes.valid) errors.fullName = nameRes.error;

  const emailRes = validateEmail(formData.email);
  if (!emailRes.valid) errors.email = emailRes.error;

  const roleRes = validateRole(formData.role);
  if (!roleRes.valid) errors.role = roleRes.error;

  const passRes = validatePassword(formData.password);
  if (!passRes.valid) errors.password = passRes.error;

  const confirmRes = validateConfirmPassword(
    formData.password,
    formData.confirmPassword,
  );
  if (!confirmRes.valid) errors.confirmPassword = confirmRes.error;

  const phoneRes = validatePhone(formData.phone);
  if (!phoneRes.valid) errors.phone = phoneRes.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Hỗ trợ xuất module cho cả Node.js và ES Module/Browser window
const validatorModule = {
  ALLOWED_ROLES,
  validateFullName,
  validateEmail,
  validateRole,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
  calculatePasswordStrength,
  validateUserForm,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = validatorModule;
}
if (typeof window !== "undefined") {
  window.AccountValidator = validatorModule;
}
