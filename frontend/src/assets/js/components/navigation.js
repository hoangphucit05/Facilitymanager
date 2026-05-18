/**
 * Sidebar động, toggle nhóm, đăng xuất — sau AppSidebar.mountSidebar.
 */
(function initSharedNavigation() {
  function applyUserHeader() {
    const role = String(window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    if (!role) return;

    const brand = document.getElementById("sidebarBrandText") || document.querySelector(".sidebar .brand");
    const welcome = document.getElementById("sidebarWelcomeText");
    const sidebarRole = document.getElementById("sidebarRoleText");
    const topbarRole = document.getElementById("topbarRoleText");
    const fullName = window.AppAuth?.getCurrentUser?.()?.fullName;

    if (welcome) welcome.setAttribute("data-i18n", "sidebar.welcome");

    if (role === "STUDENT") {
      if (brand) brand.textContent = "SINH VIÊN";
      if (sidebarRole) sidebarRole.textContent = fullName || "Sinh viên";
      if (topbarRole) {
        topbarRole.setAttribute("data-i18n", "nav.roleStudent");
      }
      window.FmI18n?.apply?.(document.body);
      return;
    }

    if (role === "ADMIN") {
      if (brand) brand.textContent = "ADMIN";
      if (sidebarRole) sidebarRole.textContent = fullName || "Administrator";
      if (topbarRole) {
        topbarRole.setAttribute("data-i18n", "nav.roleAdministrator");
      }
      window.FmI18n?.apply?.(document.body);
      return;
    }

    if (brand) brand.textContent = role;
    if (sidebarRole) sidebarRole.textContent = fullName || role;
    if (topbarRole) {
      topbarRole.removeAttribute("data-i18n");
      topbarRole.textContent = role;
    }
    window.FmI18n?.apply?.(document.body);
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".nav-group-toggle");
    if (!toggle) return;
    const sidebar = document.getElementById("appSidebar");
    if (sidebar && !sidebar.contains(toggle)) return;
    const group = toggle.closest(".nav-group");
    if (group) group.classList.toggle("open");
  });

  const chuanHoaMaToaNav = (code) => {
    const s = String(code || "").trim();
    if (!s) return "";
    if (s === "GDDN" || s === "CANTIN") return s;
    return s.toUpperCase();
  };

  /** Menu tòa nhà sidebar → trang phòng (đường dẫn tuyệt đối, tránh lỗi ../). */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-subitem[data-building], a.nav-subitem[data-page-name^='page_building_']");
    if (!link) return;
    const sidebar = document.getElementById("appSidebar");
    if (!sidebar?.contains(link)) return;

    let code = link.dataset.building || "";
    if (!code) {
      const pn = String(link.dataset.pageName || "").toLowerCase();
      const m = pn.match(/^page_building_([a-z0-9]+)$/);
      if (m) {
        const slug = m[1];
        const map = { gddn: "GDDN", cantin: "CANTIN", eb8: "EB8", e10: "E10" };
        code = map[slug] || slug.toUpperCase();
      }
    }
    if (!code) return;

    const target = `/pages/dashboard/departments.html?building=${encodeURIComponent(code)}`;
    try {
      sessionStorage.setItem("departmentsActiveBuilding", code);
    } catch (_) {
      /* ignore */
    }
    const href = (link.getAttribute("href") || "").trim();
    const broken =
      !href ||
      href === "#" ||
      href.includes("not-found") ||
      href.includes("#perm-") ||
      !href.includes("departments.html");
    let wrongBuilding = false;
    if (!broken) {
      try {
        const abs = new URL(href, window.location.href);
        const b = abs.searchParams.get("building");
        wrongBuilding = !b || chuanHoaMaToaNav(b) !== chuanHoaMaToaNav(code);
      } catch (_) {
        wrongBuilding = true;
      }
    }
    if (broken || wrongBuilding || !href.startsWith("/pages/dashboard/departments.html")) {
      e.preventDefault();
      window.location.assign(target);
    }
  });

  document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (!logoutBtn) return;
    e.preventDefault();
    window.AppAuth?.clearSession?.();
    window.MenuStore?.invalidateMenu?.();
    const depth = window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
    window.location.href = `${"../".repeat(depth)}pages/auth/login.html`;
  });

  document.querySelectorAll(".status-pill:not(.user-status-pill)").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isOn = toggle.classList.toggle("on");
      toggle.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
  });

  function loadSidebarDrawer() {
    if (!document.getElementById("appSidebar") || window.FmSidebarDrawer) return;
    const ref = document.querySelector('script[src*="navigation.js"]');
    let src = "";
    if (ref?.src) {
      src = ref.src.replace(/\/components\/navigation\.js(\?.*)?$/i, "/shared/sidebar-drawer.js");
    } else {
      const depth = window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
      src = `${"../".repeat(depth)}assets/js/shared/sidebar-drawer.js`;
    }
    const s = document.createElement("script");
    s.src = src;
    s.charset = "utf-8";
    s.async = false;
    document.body.appendChild(s);
  }

  function afterSidebarReady() {
    applyUserHeader();
    window.AppPerm?.applyToDOM?.(document);
    loadSidebarDrawer();
  }

  function boot() {
    const host = document.getElementById("appSidebar");
    if (host && window.AppSidebar?.mountSidebar) {
      window.AppSidebar.mountSidebar().then(afterSidebarReady);
      return;
    }
    afterSidebarReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
