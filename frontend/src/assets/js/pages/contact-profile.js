/**
 * Trang hồ sơ Liên hệ — GET /api/users/{id}
 */
(function contactProfilePage() {
  const profileName = document.getElementById("profileName");
  if (!profileName) return;

  function avatarUrl(url) {
    const u = String(url || "").trim();
    return u || "/assets/images/avatar/avatar_1.jpg";
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

  function fill(u) {
    if (!u) return;
    const fullName = u.fullName || u.fullname || u.username || "—";
    const elName = document.getElementById("profileName");
    const elRole = document.getElementById("profileRole");
    const elPhone = document.getElementById("profilePhone");
    const elEmail = document.getElementById("profileEmail");
    const elAddress = document.getElementById("profileAddress");
    const elAvatar = document.getElementById("profileAvatarImage");
    if (elName) elName.textContent = fullName.toUpperCase();
    if (elRole) elRole.textContent = roleLabel(u.role);
    if (elPhone) elPhone.textContent = u.phoneNumber || u.phone_number || "—";
    if (elEmail) elEmail.textContent = emailFrom(u.username);
    if (elAddress) elAddress.textContent = u.address || "—";
    if (elAvatar) {
      const src =
        window.UserAvatar && typeof window.UserAvatar.resolve === "function"
          ? window.UserAvatar.resolve(u)
          : avatarUrl(u.avatarUrl || u.avatar_url);
      elAvatar.src = src;
      elAvatar.alt = `avatar ${fullName}`;
    }
  }

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const userKey = params.get("user");
    if (!window.FmApi) return;

    try {
      if (userId && window.FmApi.layNguoiDungTheoId) {
        fill(await window.FmApi.layNguoiDungTheoId(userId));
        return;
      }
      if (userKey && window.FmApi.layDanhSachNguoiDung) {
        const list = await window.FmApi.layDanhSachNguoiDung();
        const found = list.find(
          (x) =>
            String(x.username || "") === userKey ||
            String(x.id) === String(userKey).replace(/^id-/, "")
        );
        if (found) fill(found);
      }
    } catch (e) {
      console.error("[Contact profile]", e);
    }
  }

  document.getElementById("backToPreviousPageBtn")?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/contact.html";
  });

  void load();
})();
