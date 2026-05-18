/**
 * Sidebar động từ GET /api/permission/getMenuList — map path DB → file HTML.
 */
(function sidebarScope(window) {
  const PERM_NAV = -1;
  const PERM_PAGE = 0;

  const NOT_FOUND_PAGE = "pages/auth/not-found.html";

  const PATH_TO_PAGE = {
    "/profile/users": "pages/profile/users.html",
    "/profile/rbac-roles": "pages/profile/rbac-roles.html",
    "/dashboard/departments": "pages/dashboard/departments.html",
    "/dashboard/categories": "pages/dashboard/categories.html",
    "/dashboard/assets": "pages/dashboard/assets.html",
    "/dashboard/liquidation": "pages/dashboard/liquidation.html",
    "/dashboard/statistics": "pages/dashboard/statistics.html",
    "/profile/contact": "pages/profile/contact.html",
    "/student/request-create": "pages/student/request-create.html",
    "/student/request-sent": "pages/student/request-sent.html",
    "/student/request-drafts": "pages/student/request-drafts.html",
    "/": "index.html",
  };

  const MENU_TITLE_TO_I18N_KEY = {
    "Người dùng": "menu.users",
    "Users": "menu.users",
    "ユーザー": "menu.users",
    "Quản lý user": "menu.manageUsers",
    "User management": "menu.manageUsers",
    "ユーザー管理": "menu.manageUsers",
    "Tòa nhà & phòng": "menu.buildings",
    "Buildings & rooms": "menu.buildings",
    "建物と部屋": "menu.buildings",
    "Danh sách tòa / phòng": "menu.buildingRoomList",
    "Building / room list": "menu.buildingRoomList",
    "建物・部屋リスト": "menu.buildingRoomList",
    "Tòa nhà": "menu.building",
    "Buildings": "menu.building",
    "建物": "menu.building",
    "Danh mục": "menu.categories",
    "Categories": "menu.categories",
    "カテゴリ": "menu.categories",
    "Quản lý danh mục": "menu.manageCategoriesPage",
    "Category management": "menu.manageCategoriesPage",
    "カテゴリ管理": "menu.manageCategoriesPage",
    "Tài sản": "menu.assets",
    "Assets": "menu.assets",
    "資産": "menu.assets",
    "Quản lý tài sản": "menu.manageAssetsPage",
    "Asset management": "menu.manageAssetsPage",
    "資産管理": "menu.manageAssetsPage",
    "Thống kê": "menu.statistics",
    "Statistics": "menu.statistics",
    "統計": "menu.statistics",
    "Thanh lý / điều chuyển": "menu.liquidation",
    "Điều chuyển / thanh lý": "menu.liquidation",
    "Disposal / transfer": "menu.liquidation",
    "廃棄・移管": "menu.liquidation",
    "Liên hệ": "menu.contact",
    "Contacts": "menu.contact",
    "連絡先": "menu.contact",
    "Phân quyền": "menu.rbac",
    "Access control": "menu.rbac",
    "権限管理": "menu.rbac",
    "Phân quyền menu": "menu.rbac",
    "Quản lý vai trò": "menu.manageRoles",
    "Role management": "menu.manageRoles",
    "ロール管理": "menu.manageRoles",
    "Sinh viên": "menu.students",
    "Students": "menu.students",
    "学生": "menu.students",
    "Tạo yêu cầu xử lý": "menu.studentCreateRequest",
    "Yêu cầu đã gửi": "menu.studentSent",
    "Yêu cầu đã lưu": "menu.studentDrafts",
    "Create request": "menu.studentCreateRequest",
    "Submitted requests": "menu.studentSent",
    "Saved requests": "menu.studentDrafts",
    "処理依頼を作成": "menu.studentCreateRequest",
    "送信済みの依頼": "menu.studentSent",
    "下書きの依頼": "menu.studentDrafts",
  };

  /** Ẩn nhóm "Phòng" / Room và toàn bộ menu con (theo title hoặc mã name từ API). */
  const STRIPPED_ROOM_NAV_TOKENS = new Set(["phòng", "room", "rooms", "部屋"]);

  function shouldStripRoomNavNode(node) {
    const title = String(node?.title || "").trim().toLowerCase();
    const code = String(node?.name || "").trim().toLowerCase();
    if (STRIPPED_ROOM_NAV_TOKENS.has(title) || STRIPPED_ROOM_NAV_TOKENS.has(code)) return true;
    if (code === "nav_room" || code.startsWith("nav_room_") || code === "nav_phong" || code.startsWith("nav_phong_")) {
      return true;
    }
    return false;
  }

  function filterSidebarMenuChildren(nodes) {
    if (!Array.isArray(nodes)) return [];
    return nodes.filter((n) => !shouldStripRoomNavNode(n));
  }

  function annotateSidebarMenuI18n(navRoot) {
    if (!navRoot) return;
    navRoot.querySelectorAll("a.nav-item, a.nav-subitem").forEach((a) => {
      const t = (a.textContent || "").trim();
      const key = MENU_TITLE_TO_I18N_KEY[t];
      if (key) {
        a.setAttribute("data-i18n", key);
        return;
      }
      const keep = a.getAttribute("data-i18n");
      if (keep && (keep.startsWith("sidebar.") || keep.startsWith("nav."))) return;
      a.removeAttribute("data-i18n");
    });
    navRoot.querySelectorAll(".nav-group-toggle").forEach((btn) => {
      const sp = btn.querySelector("span");
      if (!sp) return;
      const t = sp.textContent.replace(/▾/g, "").trim();
      const key = MENU_TITLE_TO_I18N_KEY[t];
      if (key) sp.setAttribute("data-i18n", key);
      else sp.removeAttribute("data-i18n");
    });

    const VENUE_TITLE_TO_KEY = {
      "Giảng đường Đa Năng": "menu.venueLectureHall",
      "Căn Tin": "menu.venueCanteen",
    };

    navRoot.querySelectorAll("a.nav-item, a.nav-subitem").forEach((a) => {
      const t = (a.textContent || "").trim();
      const m = t.match(/^Tòa nhà\s+(.+)$/i);
      if (m) {
        a.setAttribute("data-i18n", "menu.buildingNamed");
        a.setAttribute("data-i18n-params", JSON.stringify({ name: m[1].trim() }));
        return;
      }
      const vk = VENUE_TITLE_TO_KEY[t];
      if (vk) a.setAttribute("data-i18n", vk);
    });
  }

  if (!window.__fmSidebarI18nListen) {
    window.__fmSidebarI18nListen = true;
    window.addEventListener("fm-i18n-applied", () => {
      const aside = document.querySelector("#appSidebar aside");
      if (aside) window.FmI18n?.apply?.(aside);
    });
  }

  function depthFromFrontendRoot() {
    return window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
  }

  function hrefToFrontendPage(canonicalFromFrontendRoot) {
    const target = String(canonicalFromFrontendRoot || "").replace(/^\/+/, "");
    if (!target) return "#";
    if (/^https?:\/\//i.test(target)) return target;
    /* Đường dẫn từ gốc site — sidebar hoạt động từ mọi trang (profile, dashboard, …). */
    if (target.startsWith("pages/") || target === "index.html") {
      return `/${target}`;
    }
    const depth = depthFromFrontendRoot();
    const prefix = depth ? "../".repeat(depth) : "";
    return prefix + target;
  }

  function menuNodeName(node) {
    return String(node?.name || node?.menuName || "").trim();
  }

  function menuNodePath(node) {
    return String(node?.path || node?.route || node?.component || "").trim();
  }

  function normalizePath(path) {
    let p = String(path || "").trim();
    if (!p) return null;
    const hashIdx = p.indexOf("#");
    if (hashIdx >= 0) p = p.slice(0, hashIdx);
    if (/^https?:\/\//i.test(p)) return p;
    /* Một số môi trường / dữ liệu cũ dùng tiền tố /frontend — bỏ để khớp gốc Live Server = thư mục frontend. */
    p = p.replace(/^\/frontend\/?/i, "/");
    let query = "";
    const qIdx = p.indexOf("?");
    if (qIdx >= 0) {
      query = p.slice(qIdx);
      p = p.slice(0, qIdx);
    }
    let hit = null;
    if (p.endsWith(".html")) {
      hit = p.replace(/^\/+/, "");
      if (!hit.startsWith("pages/") && hit.startsWith("dashboard/")) {
        hit = `pages/${hit}`;
      }
      if (hit && hit !== "index.html" && !hit.startsWith("pages/")) {
        hit = null;
      }
    } else if (p.startsWith("pages/")) hit = p.endsWith(".html") ? p : `${p}.html`;
    else {
      const key = p.startsWith("/") ? p : `/${p}`;
      hit = PATH_TO_PAGE[p] || PATH_TO_PAGE[key] || PATH_TO_PAGE[p.replace(/\/+$/, "")];
    }
    if (!hit) return null;
    return query ? `${hit}${query}` : hit;
  }

  function resolveHref(canonicalPage) {
    const raw = String(canonicalPage || "");
    const hashIdx = raw.indexOf("#");
    const hash = hashIdx >= 0 ? raw.slice(hashIdx) : "";
    const withoutHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const c = normalizePath(withoutHash);
    if (!c) return hash ? `#${hash.replace(/^#/, "")}` : "#";
    if (/^https?:\/\//i.test(c)) return c + hash;
    const qIdx = c.indexOf("?");
    let href;
    if (qIdx >= 0) {
      href = hrefToFrontendPage(c.slice(0, qIdx)) + c.slice(qIdx);
    } else {
      href = hrefToFrontendPage(c);
    }
    return href + hash;
  }

  function isActiveHref(href) {
    if (!href || href === "#") return false;
    try {
      const cur = decodeURI(window.location.pathname.replace(/\\/g, "/")).replace(/\/+$/, "") || "/";
      const curHash = (window.location.hash || "").replace(/^#/, "").trim();
      let absUrl;
      if (!/^https?:\/\//i.test(href)) {
        absUrl = new URL(href, window.location.href);
      } else {
        absUrl = new URL(href);
      }
      const absPath = decodeURI(String(absUrl.pathname).replace(/\\/g, "/")).replace(/\/+$/, "") || "/";
      const linkHash = (absUrl.hash || "").replace(/^#/, "").trim();
      const samePage = cur === absPath || cur.endsWith(absPath) || absPath.endsWith(cur);
      if (!samePage) return false;

      const curUrl = new URL(window.location.href);
      const linkBuilding = absUrl.searchParams.get("building");
      const curBuilding = curUrl.searchParams.get("building");
      if (linkBuilding != null || curBuilding != null) {
        return (linkBuilding || "") === (curBuilding || "");
      }

      if (linkHash) return linkHash === curHash;
      return !curHash;
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugFromCanonicalPath(canon) {
    const base = String(canon || "").split(/[#?]/)[0].split("/").pop() || "page";
    return base.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "_") || "page";
  }

  /** Mã tòa từ menu DB (path có thể null trên bản cũ). */
  function buildingCodeFromMenuNode(node) {
    const menuName = menuNodeName(node).toLowerCase();
    if (menuName === "page_departments") {
      return null;
    }
    const m = menuName.match(/^page_building_([a-z0-9]+)$/);
    if (m) {
      const slug = m[1];
      const slugMap = {
        e1: "E1",
        e3: "E3",
        e4: "E4",
        e5: "E5",
        e6: "E6",
        e7: "E7",
        e8: "E8",
        e9: "E9",
        e10: "E10",
        eb8: "EB8",
        c1: "C1",
        c2: "C2",
        c3: "C3",
        gddn: "GDDN",
        cantin: "CANTIN",
      };
      if (slugMap[slug]) return slugMap[slug];
      return slug.toUpperCase();
    }
    const title = String(node?.title || "").trim();
    if (title === "Giảng đường Đa Năng") return "GDDN";
    if (title === "Căn Tin") return "CANTIN";
    const tm = title.match(/^Tòa nhà\s+(.+)$/i);
    if (tm) return tm[1].trim();
    return null;
  }

  function departmentsHrefForBuilding(code) {
    return `pages/dashboard/departments.html?building=${encodeURIComponent(code)}`;
  }

  function resolveMenuCanonical(node) {
    const menuName = menuNodeName(node).toLowerCase();
    if (menuName === "page_departments") {
      return "pages/dashboard/departments.html";
    }
    const code = buildingCodeFromMenuNode(node);
    if (code) {
      return departmentsHrefForBuilding(code);
    }
    const canon = normalizePath(menuNodePath(node));
    if (canon) return canon;
    if (menuName.startsWith("page_building_")) {
      const slug = menuName.replace(/^page_building_/, "");
      const slugMap = { gddn: "GDDN", cantin: "CANTIN", eb8: "EB8", e10: "E10" };
      const mapped = slugMap[slug] || slug.toUpperCase();
      return departmentsHrefForBuilding(mapped);
    }
    return null;
  }

  function renderPageLink(node, variant) {
    let canon = resolveMenuCanonical(node);
    if (!canon) {
      const idKey =
        node.id != null && String(node.id).trim() !== ""
          ? String(node.id).trim()
          : String(node.name || node.title || "unknown").trim() || "unknown";
      canon = `${NOT_FOUND_PAGE}#perm-${encodeURIComponent(idKey)}`;
    }
    const href = resolveHref(canon);
    const a = document.createElement("a");
    a.className = variant === "top" ? "nav-item" : "nav-subitem";
    if (isActiveHref(href)) a.classList.add("active");
    a.href = href;
    a.textContent = node.title || node.name || "";
    const canonBase = String(canon).split("#")[0];
    const tagName = menuNodeName(node) || slugFromCanonicalPath(canonBase);
    const canonForDataset = canonBase.replace(/^\/+/, "");
    a.dataset.pageCanonical = canonForDataset;
    a.dataset.pageName = tagName;
    a.dataset.pageTitle = (node.title || menuNodeName(node) || "").trim();
    const buildingCode = buildingCodeFromMenuNode(node);
    if (buildingCode) a.dataset.building = buildingCode;
    if (menuNodePath(node) && !resolveMenuCanonical(node)) {
      a.dataset.unresolvedPath = "1";
    }
    return { el: a, active: !!a.classList.contains("active") };
  }

  function renderNavGroupInSubmenu(container, node) {
    const children = filterSidebarMenuChildren(Array.isArray(node.children) ? node.children : []);
    if (!children.length) return false;

    const group = document.createElement("div");
    group.className = "nav-group";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-group-toggle";
    toggle.innerHTML = `<span>${escapeHtml(node.title || "")}</span><span>▾</span>`;

    const sub = document.createElement("div");
    sub.className = "nav-submenu";

    let anyActive = false;
    children.forEach((ch) => {
      const pt = ch.permissionType;
      const chKids = filterSidebarMenuChildren(Array.isArray(ch.children) ? ch.children : []);
      if (Number(pt) === PERM_NAV && chKids.length) {
        if (renderNavGroupInSubmenu(sub, ch)) anyActive = true;
      } else if (Number(pt) === PERM_PAGE) {
        const link = renderPageLink(ch, "sub");
        if (link) {
          sub.appendChild(link.el);
          if (link.active) anyActive = true;
        }
      }
    });

    if (anyActive) group.classList.add("open");
    group.appendChild(toggle);
    group.appendChild(sub);
    container.appendChild(group);
    return anyActive;
  }

  function renderRoots(nav, roots) {
    const topChildrenRaw =
      roots.length === 1 && roots[0].permissionType === PERM_NAV && roots[0].children?.length
        ? roots[0].children
        : roots;
    const topChildren = filterSidebarMenuChildren(topChildrenRaw);

    const homeA = document.createElement("a");
    homeA.className = "nav-item";
    homeA.href = hrefToFrontendPage("index.html");
    homeA.setAttribute("data-i18n", "sidebar.home");
    homeA.textContent = "Trang chủ";
    homeA.dataset.pageCanonical = "index.html";
    homeA.dataset.pageName = "home_index";
    homeA.dataset.pageTitle = "Trang chủ";
    if (isActiveHref(homeA.href)) homeA.classList.add("active");
    nav.appendChild(homeA);

    topChildren.forEach((node) => {
      const pt = node.permissionType;
      const ch = node.children || [];
      const chFiltered = filterSidebarMenuChildren(ch);

      if (Number(pt) === PERM_NAV && chFiltered.length > 0) {
        const group = document.createElement("div");
        group.className = "nav-group";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "nav-group-toggle";
        toggle.innerHTML = `<span>${escapeHtml(node.title || "")}</span><span>▾</span>`;

        const sub = document.createElement("div");
        sub.className = "nav-submenu";

        let anyActive = false;
        chFiltered.forEach((child) => {
          const childKids = filterSidebarMenuChildren(Array.isArray(child.children) ? child.children : []);
          if (child.permissionType === PERM_NAV && childKids.length) {
            if (renderNavGroupInSubmenu(sub, child)) anyActive = true;
          } else if (child.permissionType === PERM_PAGE) {
            const link = renderPageLink(child, "sub");
            if (link) {
              sub.appendChild(link.el);
              if (link.active) anyActive = true;
            }
          }
        });

        if (anyActive) group.classList.add("open");
        group.appendChild(toggle);
        group.appendChild(sub);
        nav.appendChild(group);
      } else if (Number(pt) === PERM_PAGE) {
        const link = renderPageLink(node, "top");
        if (link) nav.appendChild(link.el);
      }
    });
  }

  async function mountSidebar(selector) {
    const host =
      (selector && document.querySelector(selector)) || document.getElementById("appSidebar");
    if (!host) return;

    host.innerHTML = `<div class="sidebar-loading" style="padding:12px;color:var(--muted, #666)" data-i18n="sidebar.loading">Đang tải menu…</div>`;

    try {
      const { roots } = await window.MenuStore.loadMenu(false);
      host.innerHTML = "";

      const aside = document.createElement("aside");
      aside.className = "sidebar";

      const brand = document.createElement("div");
      brand.id = "sidebarBrandText";
      brand.className = "brand";
      brand.textContent = "CSVC";

      const profile = document.createElement("div");
      profile.className = "profile-box";
      const avatarSrc = hrefToFrontendPage("assets/images/avatar_1.jpg");
      const u = window.AppAuth?.getCurrentUser?.();
      const displayName = u?.fullName || u?.username || "—";
      profile.innerHTML = `
        <img src="${avatarSrc}" alt="avatar" />
        <div>
          <p id="sidebarWelcomeText" data-i18n="sidebar.welcome">Xin chào,</p>
          <strong id="sidebarRoleText">${escapeHtml(displayName)}</strong>
        </div>`;

      const nav = document.createElement("nav");
      if (!roots.length) {
        nav.innerHTML = `<p style="padding:8px;color:var(--muted,#666)" data-i18n="sidebar.emptyMenu">Không có menu.</p>`;
      } else {
        renderRoots(nav, roots);
      }

      annotateSidebarMenuI18n(nav);

      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "nav-item nav-action-btn";
      logoutBtn.setAttribute("data-action", "logout");
      logoutBtn.setAttribute("data-i18n", "sidebar.logout");
      logoutBtn.textContent = "Đăng xuất";
      logoutBtn.style.width = "100%";
      logoutBtn.style.textAlign = "left";
      nav.appendChild(logoutBtn);

      aside.appendChild(brand);
      aside.appendChild(profile);
      aside.appendChild(nav);

      host.appendChild(aside);
      window.FmI18n?.apply?.(aside);
      window.dispatchEvent(new CustomEvent("fm-sidebar-ready", { detail: { nav } }));
    } catch (err) {
      host.innerHTML = `<div class="sidebar-error" style="padding:12px;">
        <p data-i18n="sidebar.menuError">Không tải được menu.</p>
        <p style="font-size:12px;color:#666">${escapeHtml(err.message || String(err))}</p>
        <button type="button" id="retryMenu" style="margin-top:8px;padding:6px 12px;" data-i18n="sidebar.retry">Thử lại</button>
      </div>`;
      host.querySelector("#retryMenu")?.addEventListener("click", () => {
        window.MenuStore.invalidateMenu();
        mountSidebar(selector);
      });
      window.FmI18n?.apply?.(host);
    }
  }

  window.AppSidebar = {
    mountSidebar,
    normalizePath,
    hrefToFrontendPage,
    resolveHref,
    resolveMenuCanonical,
    buildingCodeFromMenuNode,
  };
})(window);
