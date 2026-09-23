const DEFAULT_PERMISSIONS_DATA = [
  // Module 1: Quản lý tài khoản
  {
    code: "USER_VIEW",
    name: "Xem danh sách người dùng",
    module: "QUẢN LÝ TÀI KHOẢN",
    description: "Xem thông tin cơ bản của các tài khoản trong hệ thống",
    roles: { HR: true, MENTOR: false, INTERN: false },
  },
  {
    code: "USER_CREATE",
    name: "Tạo tài khoản người dùng",
    module: "QUẢN LÝ TÀI KHOẢN",
    description: "Tạo mới tài khoản cho HR, Mentor và Thực tập sinh",
    roles: { HR: true, MENTOR: false, INTERN: false },
  },
  {
    code: "USER_UPDATE",
    name: "Cập nhật tài khoản",
    module: "QUẢN LÝ TÀI KHOẢN",
    description: "Chỉnh sửa họ tên, số điện thoại, mật khẩu tài khoản",
    roles: { HR: true, MENTOR: false, INTERN: false },
  },
  {
    code: "USER_STATUS_CHANGE",
    name: "Khóa / Mở khóa tài khoản",
    module: "QUẢN LÝ TÀI KHOẢN",
    description: "Kích hoạt hoặc đình chỉ quyền sử dụng của tài khoản",
    roles: { HR: true, MENTOR: false, INTERN: false },
  },

  // Module 2: Quản lý thực tập
  {
    code: "INTERN_PROFILE_VIEW",
    name: "Xem hồ sơ thực tập sinh",
    module: "QUẢN LÝ THỰC TẬP",
    description: "Xem thông tin chuyên môn, trường đào tạo, điểm số của Intern",
    roles: { HR: true, MENTOR: true, INTERN: false },
  },
  {
    code: "INTERN_TASK_ASSIGN",
    name: "Giao nhiệm vụ cho Intern",
    module: "QUẢN LÝ THỰC TẬP",
    description: "Phân công đầu việc, mục tiêu và hạn chót cho thực tập sinh",
    roles: { HR: false, MENTOR: true, INTERN: false },
  },
  {
    code: "INTERN_TASK_VIEW",
    name: "Xem nhiệm vụ được giao",
    module: "QUẢN LÝ THỰC TẬP",
    description: "Xem danh sách các công việc cá nhân cần thực hiện",
    roles: { HR: false, MENTOR: false, INTERN: true },
  },

  // Module 3: Đánh giá & Báo cáo
  {
    code: "REPORT_SUBMIT",
    name: "Nộp báo cáo định kỳ",
    module: "ĐÁNH GIÁ & BÁO CÁO",
    description: "Gửi báo cáo tiến độ tuần/tháng lên hệ thống",
    roles: { HR: false, MENTOR: false, INTERN: true },
  },
  {
    code: "REPORT_REVIEW",
    name: "Review & Phê duyệt báo cáo",
    module: "ĐÁNH GIÁ & BÁO CÁO",
    description: "Xem và nhận xét, chấm điểm báo cáo của thực tập sinh",
    roles: { HR: false, MENTOR: true, INTERN: false },
  },
  {
    code: "EVALUATION_MANAGE",
    name: "Đánh giá kết quả thực tập",
    module: "ĐÁNH GIÁ & BÁO CÁO",
    description: "Đánh giá năng lực và xác nhận hoàn thành kỳ thực tập",
    roles: { HR: true, MENTOR: true, INTERN: false },
  },

  // Module 4: Hợp đồng & Chế độ
  {
    code: "CONTRACT_VIEW",
    name: "Xem hợp đồng thực tập",
    module: "HỢP ĐỒNG & CHẾ ĐỘ",
    description: "Xem chi tiết thỏa thuận thực tập và mức phụ cấp",
    roles: { HR: true, MENTOR: false, INTERN: true },
  },
  {
    code: "CONTRACT_MANAGE",
    name: "Quản lý hợp đồng & phụ cấp",
    module: "HỢP ĐỒNG & CHẾ ĐỘ",
    description: "Soạn thảo, điều chỉnh phụ cấp và ký duyệt thỏa thuận",
    roles: { HR: true, MENTOR: false, INTERN: false },
  },

  // Module 5: Cấu hình hệ thống
  {
    code: "RBAC_MANAGE",
    name: "Quản lý ma trận phân quyền",
    module: "CẤU HÌNH HỆ THỐNG",
    description: "Thay đổi và gán quyền chức năng cho các vai trò",
    roles: { HR: false, MENTOR: false, INTERN: false },
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "RBAC_PERMISSIONS_MATRIX_V1";

  // Load from LocalStorage or use default
  let currentPermissions = loadPermissions();

  // DOM Elements
  const tbody = document.getElementById("matrixTbody");
  const filterModule = document.getElementById("filterModule");
  const searchInput = document.getElementById("searchPermission");
  const btnSave = document.getElementById("btnSavePermissions");
  const btnReset = document.getElementById("btnResetDefault");
  const totalCountEl = document.getElementById("totalPermsCount");
  const hrCountEl = document.getElementById("hrPermsCount");
  const mentorCountEl = document.getElementById("mentorPermsCount");
  const internCountEl = document.getElementById("internPermsCount");
  const toastSuccess = document.getElementById("toastSuccess");
  const toastMessage = document.getElementById("toastMessage");

  // Initial Render
  renderMatrix();

  // Filter & Search Events
  filterModule.addEventListener("change", renderMatrix);
  searchInput.addEventListener("input", renderMatrix);

  // Save Event
  btnSave.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPermissions));
    showToast("Cấu hình phân quyền đã được lưu thành công vào hệ thống.");
  });

  // Reset to Default Event
  btnReset.addEventListener("click", () => {
    if (
      confirm(
        "Bạn có chắc chắn muốn khôi phục phân quyền về giá trị mặc định ban đầu không?",
      )
    ) {
      currentPermissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_DATA));
      localStorage.removeItem(STORAGE_KEY);
      renderMatrix();
      showToast("Đã khôi phục ma trận phân quyền về trạng thái mặc định.");
    }
  });

  function loadPermissions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_DATA));
  }

  function renderMatrix() {
    const selectedModule = filterModule.value;
    const query = searchInput.value.trim().toLowerCase();

    // Filter items
    const filtered = currentPermissions.filter((item) => {
      const matchModule =
        selectedModule === "ALL" || item.module === selectedModule;
      const matchQuery =
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchModule && matchQuery;
    });

    // Render Rows
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Không tìm thấy quyền nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered
        .map(
          (p) => `
        <tr data-code="${p.code}">
          <td class="col-code font-mono">${escapeHtml(p.code)}</td>
          <td class="col-name">
            <div class="perm-title">${escapeHtml(p.name)}</div>
            <div class="perm-desc">${escapeHtml(p.description)}</div>
          </td>
          <td class="col-module">
            <span class="module-tag">${escapeHtml(p.module)}</span>
          </td>
          <td class="col-role text-center">
            <label class="checkbox-wrap">
              <input type="checkbox" data-role="HR" data-code="${p.code}" ${p.roles.HR ? "checked" : ""}>
              <span class="custom-checkbox"></span>
            </label>
          </td>
          <td class="col-role text-center">
            <label class="checkbox-wrap">
              <input type="checkbox" data-role="MENTOR" data-code="${p.code}" ${p.roles.MENTOR ? "checked" : ""}>
              <span class="custom-checkbox"></span>
            </label>
          </td>
          <td class="col-role text-center">
            <label class="checkbox-wrap">
              <input type="checkbox" data-role="INTERN" data-code="${p.code}" ${p.roles.INTERN ? "checked" : ""}>
              <span class="custom-checkbox"></span>
            </label>
          </td>
        </tr>
      `,
        )
        .join("");

      // Attach checkbox change events
      tbody.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const role = e.target.getAttribute("data-role");
          const code = e.target.getAttribute("data-code");
          const targetItem = currentPermissions.find((p) => p.code === code);
          if (targetItem) {
            targetItem.roles[role] = e.target.checked;
            updateStats();
          }
        });
      });
    }

    updateStats();
  }

  function updateStats() {
    totalCountEl.textContent = currentPermissions.length;
    hrCountEl.textContent = currentPermissions.filter((p) => p.roles.HR).length;
    mentorCountEl.textContent = currentPermissions.filter(
      (p) => p.roles.MENTOR,
    ).length;
    internCountEl.textContent = currentPermissions.filter(
      (p) => p.roles.INTERN,
    ).length;
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toastSuccess.classList.remove("hidden");
    setTimeout(() => {
      toastSuccess.classList.add("hidden");
    }, 4000);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
});
