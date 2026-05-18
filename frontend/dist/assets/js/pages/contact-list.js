/**
 * Trang Liên hệ — tải danh sách user từ API (không phụ thuộc main.js).
 */
(function contactListPage() {
  const grid = document.getElementById("contactUserListSection");
  const countEl = document.getElementById("contactUserCount");
  if (!grid) return;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function cardAvatarSrc(u) {
    if (window.UserAvatar && typeof window.UserAvatar.resolve === "function") {
      return window.UserAvatar.resolve(u);
    }
    const s = String(u.avatarUrl || u.avatar_url || "").trim();
    return s || "/assets/images/avatar/avatar_1.jpg";
  }

  function emailFrom(username) {
    const name = String(username || "").trim();
    if (!name) return "—";
    return name.includes("@") ? name : `${name}@hotmail.com`;
  }

  function roleLabel(role) {
    const r = String(role || "").trim();
    if (!r) return "—";
    const map = {
      ADMIN: "Administrator",
      MANAGER: "Quản lý",
      STAFF: "Cán bộ quản lý tài sản",
      STUDENT: "Sinh viên",
    };
    return map[r.toUpperCase()] || r;
  }

  function showError(msg) {
    grid.innerHTML = `<p class="contact-error" style="grid-column:1/-1;padding:16px;text-align:center;color:#b3261e">${esc(msg)}</p>`;
    if (countEl) countEl.hidden = true;
  }

  function renderCards(list) {
    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML =
        '<p class="contact-empty" style="grid-column:1/-1;padding:24px;text-align:center">Chưa có user trong CSDL.</p>';
      if (countEl) countEl.hidden = true;
      return;
    }
    if (countEl) {
      countEl.hidden = false;
      countEl.textContent = `${list.length} user`;
    }
    grid.innerHTML = list
      .map((u) => {
        const id = u.id != null ? String(u.id) : "";
        const username = u.username || "";
        const fullName = u.fullName || u.fullname || username || "—";
        const href = id
          ? `../profile/contact-profile.html?id=${encodeURIComponent(id)}`
          : `../profile/contact-profile.html?user=${encodeURIComponent(username)}`;
        return `<article class="contact-card" data-user-id="${esc(id)}">
          <div class="contact-card-info">
            <h2 class="contact-card-name">${esc(fullName)}</h2>
            <p class="contact-card-role">${esc(roleLabel(u.role))}</p>
            <div class="contact-card-divider"></div>
            <p class="contact-card-meta"><strong>Địa chỉ:</strong> ${esc(u.address || "—")}</p>
            <p class="contact-card-meta"><strong>Điện thoại:</strong> ${esc(u.phoneNumber || u.phone_number || "—")}</p>
            <p class="contact-card-meta"><strong>Email:</strong> ${esc(emailFrom(username))}</p>
            <a class="contact-view-profile-btn" href="${href}">View Profile</a>
          </div>
          <div class="contact-card-avatar-wrap">
            <img class="contact-card-avatar" src="${esc(cardAvatarSrc(u))}" alt="avatar ${esc(fullName)}" loading="lazy" />
          </div>
        </article>`;
      })
      .join("");
  }

  async function loadUsers() {
    if (!window.CoSoApi?.layDanhSachNguoiDung) {
      showError("Không tìm thấy CoSoApi. Kiểm tra file giaoDienApi.js.");
      return;
    }
    grid.innerHTML =
      '<p class="contact-loading" style="grid-column:1/-1;padding:24px;text-align:center">Đang tải dữ liệu…</p>';
    if (countEl) countEl.hidden = true;

    try {
      const list = await Promise.race([
        window.CoSoApi.layDanhSachNguoiDung(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("API không phản hồi (15s). Chạy: docker compose up -d --build")), 15000);
        }),
      ]);
      const sorted = [...list].sort((a, b) => Number(a.id) - Number(b.id));
      renderCards(sorted);
    } catch (err) {
      console.error("[Contact]", err);
      showError(`Không tải được danh sách: ${err?.message || err}`);
    }
  }

  window.addEventListener("fm-users-changed", loadUsers);
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) loadUsers();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadUsers);
  } else {
    loadUsers();
  }
})();
