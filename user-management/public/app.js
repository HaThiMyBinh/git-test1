/**
 * Application Controller for User Creation Form
 * Integrates with AccountValidator module
 */

document.addEventListener('DOMContentLoaded', () => {
  const validator = window.AccountValidator;

  // DOM Elements
  const form = document.getElementById('createAccountForm');
  const roleInputs = document.querySelectorAll('input[name="role"]');
  const roleCards = document.querySelectorAll('.role-card');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const btnGeneratePass = document.getElementById('btnGeneratePass');
  const btnReset = document.getElementById('btnReset');
  const togglePassButtons = document.querySelectorAll('.btn-toggle-pass');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const toastSuccess = document.getElementById('toastSuccess');
  const toastMessage = document.getElementById('toastMessage');
  const accountsList = document.getElementById('accountsList');
  const accountCount = document.getElementById('accountCount');

  // In-memory list of created accounts for live demo
  const createdAccounts = [];

  // ==========================================
  // 1. Role Selection Highlight
  // ==========================================
  roleInputs.forEach((input) => {
    input.addEventListener('change', () => {
      roleCards.forEach((card) => card.classList.remove('active'));
      const activeCard = input.closest('.role-card');
      if (activeCard) activeCard.classList.add('active');
      clearError('role');
    });
  });

  // ==========================================
  // 2. Realtime Field Validation & Feedback
  // ==========================================
  fullNameInput.addEventListener('blur', () => {
    const res = validator.validateFullName(fullNameInput.value);
    handleFieldError('fullName', res);
  });

  emailInput.addEventListener('blur', () => {
    const res = validator.validateEmail(emailInput.value);
    handleFieldError('email', res);
  });

  phoneInput.addEventListener('blur', () => {
    const res = validator.validatePhone(phoneInput.value);
    handleFieldError('phone', res);
  });

  passwordInput.addEventListener('input', () => {
    // Update password strength
    const strength = validator.calculatePasswordStrength(passwordInput.value);
    const widthPercentage = (strength.score / 5) * 100;
    strengthFill.style.width = `${widthPercentage}%`;
    strengthFill.style.backgroundColor = strength.color;
    strengthLabel.textContent = `Độ mạnh: ${strength.label}`;
    strengthLabel.style.color = strength.color;

    if (passwordInput.value) {
      const res = validator.validatePassword(passwordInput.value);
      handleFieldError('password', res);
    } else {
      clearError('password');
    }

    // Recheck confirm password if already typed
    if (confirmPasswordInput.value) {
      const confirmRes = validator.validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);
      handleFieldError('confirmPassword', confirmRes);
    }
  });

  confirmPasswordInput.addEventListener('input', () => {
    const res = validator.validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);
    handleFieldError('confirmPassword', res);
  });

  // ==========================================
  // 3. Password Utilities
  // ==========================================
  // Toggle password visibility (dùng chữ Hiện / Ẩn, không icon)
  togglePassButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        btn.textContent = 'Ẩn';
      } else {
        targetInput.type = 'password';
        btn.textContent = 'Hiện';
      }
    });
  });

  // Generate Random Strong Password
  btnGeneratePass.addEventListener('click', () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*()_+';
    const all = uppers + lowers + numbers + symbols;

    let generated = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    for (let i = 0; i < 8; i++) {
      generated.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle
    generated = generated.sort(() => 0.5 - Math.random()).join('');

    passwordInput.value = generated;
    confirmPasswordInput.value = generated;

    // Trigger input events to update strength meter & validations
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.dispatchEvent(new Event('input'));
  });

  // ==========================================
  // 4. Form Submission
  // ==========================================
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedRole = document.querySelector('input[name="role"]:checked')?.value || '';
    const formData = {
      fullName: fullNameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      role: selectedRole,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
    };

    // Run full validation suite
    const validationResult = validator.validateUserForm(formData);

    // Clear all previous errors
    clearAllErrors();

    if (!validationResult.isValid) {
      // Display errors on UI
      for (const [field, errorMsg] of Object.entries(validationResult.errors)) {
        displayError(field, errorMsg);
      }
      return;
    }

    // Check duplicate email in local createdAccounts demo
    const isDuplicate = createdAccounts.some((acc) => acc.email.toLowerCase() === formData.email.toLowerCase());
    if (isDuplicate) {
      displayError('email', 'Email này đã tồn tại trong hệ thống (Duplicate email).');
      return;
    }

    // Simulate successful creation (Task 4 preview)
    const newAccount = {
      id: createdAccounts.length + 1,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      phone: formData.phone.trim() || 'Chưa cập nhật',
      createdAt: new Date().toLocaleTimeString('vi-VN'),
    };

    createdAccounts.unshift(newAccount);
    renderAccounts();

    // Show toast
    showToast(`Đã tạo tài khoản ${newAccount.role} cho "${newAccount.fullName}" (${newAccount.email}) thành công!`);

    // Reset Form
    resetForm();
  });

  // ==========================================
  // 5. Reset Form
  // ==========================================
  btnReset.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    roleCards.forEach((card) => card.classList.remove('active'));
    clearAllErrors();
    strengthFill.style.width = '0%';
    strengthLabel.textContent = 'Độ mạnh: Chưa nhập';
    strengthLabel.style.color = '#64748b';
    togglePassButtons.forEach((btn) => (btn.textContent = 'Hiện'));
    passwordInput.type = 'password';
    confirmPasswordInput.type = 'password';
  }

  // ==========================================
  // Helper functions
  // ==========================================
  function handleFieldError(fieldName, result) {
    if (!result.valid) {
      displayError(fieldName, result.error);
    } else {
      clearError(fieldName);
    }
  }

  function displayError(fieldName, message) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    const inputEl = document.getElementById(fieldName);

    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('input-error');
  }

  function clearError(fieldName) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    const inputEl = document.getElementById(fieldName);

    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.classList.remove('input-error');
  }

  function clearAllErrors() {
    ['role', 'fullName', 'email', 'phone', 'password', 'confirmPassword'].forEach(clearError);
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toastSuccess.classList.remove('hidden');
    setTimeout(() => {
      toastSuccess.classList.add('hidden');
    }, 4500);
  }

  function renderAccounts() {
    accountCount.textContent = createdAccounts.length;
    if (createdAccounts.length === 0) {
      accountsList.innerHTML = '<div class="empty-state">Chưa có tài khoản nào được tạo trong phiên này.</div>';
      return;
    }

    accountsList.innerHTML = createdAccounts
      .map(
        (acc) => `
      <div class="account-item">
        <div class="account-item-top">
          <span class="account-item-name">${escapeHtml(acc.fullName)}</span>
          <span class="role-badge ${acc.role.toLowerCase()}">${acc.role}</span>
        </div>
        <div class="account-item-email">${escapeHtml(acc.email)} • ${acc.createdAt}</div>
      </div>
    `
      )
      .join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
