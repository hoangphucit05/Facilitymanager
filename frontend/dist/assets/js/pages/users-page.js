/**
 * Trang quản lý user — tải danh sách, toggle khóa/mở khóa (ACTIVE / INACTIVE).
 */
(function usersPageScope() {
  const usersTableBody = document.getElementById("usersTableBody");
  const usersSearchInput = document.getElementById("usersSearchInput");
  if (!usersTableBody || !usersSearchInput) return;

  const { setupTableControls } = window.AppTableControls || {};
  if (!setupTableControls) {
    console.error("[users-page] Missing AppTableControls.setupTableControls");
    return;
  }

  const refreshUsersTable = setupTableControls({
    tableBody: usersTableBody,
    searchInput: usersSearchInput,
    pageSizeSelect: document.getElementById("usersPageSizeSelect"),
    searchColumnIndexes: [0, 2, 4],
  });

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function isUserActive(u) {
    return String(u?.status || "").toUpperCase() === "ACTIVE" || u?.active === true;
  }

  function setPillVisual(pill, active) {
    pill.classList.toggle("on", active);
    pill.setAttribute("aria-pressed", active ? "true" : "false");
    pill.dataset.userActive = active ? "1" : "0";
    pill.title = active ? "Đang hoạt động — bấm để khóa" : "Đã khóa — bấm để mở khóa";
  }

  async function capNhatTrangThaiUser(userId, active) {
    const api = window.FmApi;
    if (!api) throw new Error("FmApi chưa sẵn sàng");
    const body = { active, status: active ? "ACTIVE" : "INACTIVE" };
    if (typeof api.patchNguoiDung === "function") {
      try {
        return await api.patchNguoiDung(userId, body);
      } catch (patchErr) {
        console.warn("[users-page] PATCH failed, try PUT:", patchErr);
      }
    }
    if (typeof api.capNhatNguoiDung === "function") {
      return await api.capNhatNguoiDung(userId, { status: body.status });
    }
    throw new Error("Không có API cập nhật user");
  }

  async function taiBangNguoiDungTuApi() {
    if (!window.FmApi?.layDanhSachNguoiDung) return;
    try {
      const list = await window.FmApi.layDanhSachNguoiDung();
      if (!Array.isArray(list)) return;
      if (list.length === 0) {
        usersTableBody.innerHTML =
          '<tr><td colspan="7" style="text-align:center;padding:24px">Chưa có user trong CSDL.</td></tr>';
        refreshUsersTable();
        return;
      }
      usersTableBody.innerHTML = list
        .map((u) => {
          const id = u.id != null ? String(u.id) : "";
          const username = u.username || "";
          const key = username || `id-${id}`;
          const fullName = u.fullName || u.fullname || "";
          const role = u.role || "";
          const avatarUrl =
            window.UserAvatar?.resolve?.(u) ||
            u.avatarUrl ||
            u.avatar_url ||
            "/assets/images/avatar/avatar_1.jpg";
          const on = isUserActive(u);
          return `<tr data-user-id="${escapeHtml(id)}" data-user-key="${escapeHtml(key)}">
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(username)}</td>
                <td>${escapeHtml(fullName)}</td>
                <td class="users-status-cell"><button type="button" class="status-pill user-status-pill${on ? " on" : ""}" aria-pressed="${on}" data-user-active="${on ? "1" : "0"}" title="${on ? "Đang hoạt động — bấm để khóa" : "Đã khóa — bấm để mở khóa"}"></button></td>
                <td>${escapeHtml(role)}</td>
                <td><img class="avatar-thumb" src="${escapeHtml(avatarUrl)}" alt="avatar" /></td>
                <td>
                  <div class="user-action-buttons">
                    <button class="icon-btn user-view-btn" type="button" title="Xem thông tin chi tiết">
                      <img src="../../assets/icons/view-info.svg" alt="Xem thông tin" />
                    </button>
                    <button class="icon-btn user-update-btn" type="button" title="Cập nhật user">
                      <img src="../../assets/icons/update.svg" alt="Cập nhật user" />
                    </button>
                    <button class="icon-btn user-delete-btn" type="button" title="Xóa user">
                      <img src="../../assets/icons/delete.svg" alt="Xóa user" />
                    </button>
                  </div>
                </td>
              </tr>`;
        })
        .join("");
      refreshUsersTable();
    } catch (err) {
      console.warn("[users-page] Không tải được từ API:", err);
      const msg = escapeHtml(err?.message || err);
      usersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:16px;color:#b3261e">Không tải được dữ liệu từ API. (${msg})</td></tr>`;
      refreshUsersTable();
    }
  }

  function handleStatusToggle(pill, row) {
    const idNguoiDung = row.dataset.userId || row.cells[0]?.textContent?.trim() || "";
    if (!idNguoiDung) return;

    const wasActive = pill.classList.contains("on");
    const willBeActive = !wasActive;
    const currentUserId = String(window.AppAuth?.getCurrentUser?.()?.userId ?? "");
    if (currentUserId && currentUserId === idNguoiDung && !willBeActive) {
      window.alert("Không thể khóa tài khoản bạn đang đăng nhập.");
      return;
    }

    setPillVisual(pill, willBeActive);
    pill.disabled = true;

    void (async () => {
      try {
        await capNhatTrangThaiUser(idNguoiDung, willBeActive);
      } catch (e) {
        setPillVisual(pill, wasActive);
        window.alert(
          willBeActive
            ? "Không thể mở khóa tài khoản. Kiểm tra backend đang chạy (cổng 8080)."
            : "Không thể khóa tài khoản. Kiểm tra backend đang chạy (cổng 8080)."
        );
      } finally {
        pill.disabled = false;
      }
    })();
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!usersTableBody.contains(target)) return;

      const pill = target.closest("button.user-status-pill, button.status-pill");
      if (pill && pill.closest("#usersTableBody")) {
        event.preventDefault();
        event.stopPropagation();
        const row = pill.closest("tr");
        if (row) handleStatusToggle(pill, row);
        return;
      }

      const row = target.closest("tr");
      if (!row || !usersTableBody.contains(row)) return;

      const userKey = row.dataset.userKey || "";
      if (target.closest(".user-view-btn")) {
        const q = new URLSearchParams();
        if (row.dataset.userId) q.set("id", row.dataset.userId);
        if (userKey) q.set("user", userKey);
        window.location.href = `../profile/contact-profile.html?${q.toString()}`;
        return;
      }
      if (target.closest(".user-update-btn")) {
        const q = new URLSearchParams();
        if (userKey) q.set("edit", userKey);
        if (row.dataset.userId) q.set("id", row.dataset.userId);
        window.location.href = `../profile/users-add.html?${q.toString()}`;
        return;
      }
      if (target.closest(".user-delete-btn")) {
        const userName = row.cells[2]?.textContent?.trim() || "user này";
        if (!window.confirm(`Bạn có chắc muốn xóa ${userName}?`)) return;
        const idNguoiDung = row.dataset.userId || row.cells[0]?.textContent?.trim() || "";
        if (idNguoiDung && window.FmApi?.xoaNguoiDung) {
          void (async () => {
            try {
              await window.FmApi.xoaNguoiDung(idNguoiDung);
              row.remove();
              refreshUsersTable();
            } catch {
              window.alert("Xóa user trên máy chủ thất bại.");
            }
          })();
        } else {
          row.remove();
          refreshUsersTable();
        }
      }
    },
    true
  );

  void taiBangNguoiDungTuApi();

  const pendingUpdateRaw = sessionStorage.getItem("pendingUserUpdate");
  if (pendingUpdateRaw) {
    try {
      const pendingUpdate = JSON.parse(pendingUpdateRaw);
      const row = usersTableBody.querySelector(`tr[data-user-key="${pendingUpdate.userKey || ""}"]`);
      if (row) {
        if (row.cells[1]) row.cells[1].textContent = pendingUpdate.username || "";
        if (row.cells[2]) row.cells[2].textContent = pendingUpdate.fullname || "";
        if (row.cells[4]) row.cells[4].textContent = pendingUpdate.role || "";
        const avatarImage = row.cells[5]?.querySelector("img");
        if (avatarImage && pendingUpdate.avatar) {
          avatarImage.src = pendingUpdate.avatar;
        }
        refreshUsersTable();
      }
    } catch {
      /* ignore */
    } finally {
      sessionStorage.removeItem("pendingUserUpdate");
    }
  }

  document.getElementById("usersExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`users-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      rows: Fm.tbodyToObjectsAuto(usersTableBody),
    });
  });
})();
