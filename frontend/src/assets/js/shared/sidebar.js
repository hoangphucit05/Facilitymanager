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
    "/dashboard/room-map": "pages/dashboard/room-map.html",
    "/dashboard/categories": "pages/dashboard/categories.html",
    "/dashboard/assets": "pages/dashboard/assets.html",
    "/dashboard/statistics": "pages/dashboard/statistics.html",
    "/dashboard/audit-periodic.html": "pages/dashboard/audit-periodic.html",
    "/dashboard/requests": "pages/dashboard/requests.html",
    "/dashboard/work/pending": "pages/dashboard/requests.html?view=pending",
    "/dashboard/work/incomplete": "pages/dashboard/requests.html?view=incomplete",
    "/dashboard/work/mine": "pages/dashboard/requests.html?view=mine",
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
    "Quản lí phòng học": "menu.manageRoomManagement",
    "Quản lý phòng học": "menu.manageRoomManagement",
    "Room management": "menu.manageRoomManagement",
    "Tòa nhà & phòng": "menu.buildings",
    "Buildings & rooms": "menu.buildings",
    "建物と部屋": "menu.buildings",
    "Danh sách tòa / phòng": "menu.buildingRoomList",
    "Building / room list": "menu.buildingRoomList",
    "建物・部屋リスト": "menu.buildingRoomList",
    "Tòa nhà": "menu.building",
    "Phòng học": "menu.building",
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
    "Quản lý công việc": "menu.workMgmt",
    "Work management": "menu.workMgmt",
    "業務管理": "menu.workMgmt",
    "Chờ xử lí": "menu.workPending",
    "Chờ xử lý": "menu.workPending",
    "Pending": "menu.workPending",
    "処理待ち": "menu.workPending",
    "Chưa hoàn thành": "menu.workIncomplete",
    "Incomplete": "menu.workIncomplete",
    "未完了": "menu.workIncomplete",
    "Công việc của tôi": "menu.workMine",
    "My tasks": "menu.workMine",
    "自分の業務": "menu.workMine",
    "Yêu cầu xử lý": "menu.requestsNav",
    "Request handling": "menu.requestsNav",
    "Kiểm tra": "menu.inspection",
    "Inspection": "menu.inspection",
    "点検": "menu.inspection",
    "Kiểm kê định kỳ": "menu.auditPeriodic",
    "Periodic inventory": "menu.auditPeriodic",
    "定期棚卸": "menu.auditPeriodic",
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
    navRoot.querySelectorAll("a.nav-item").forEach((a) => {
      const label = a.querySelector(".nav-item-label");
      const t = ((label || a).textContent || "").trim();
      const key = MENU_TITLE_TO_I18N_KEY[t];
      if (key && label) {
        label.setAttribute("data-i18n", key);
        a.removeAttribute("data-i18n");
        return;
      }
      if (key) {
        a.setAttribute("data-i18n", key);
        return;
      }
      const keep = a.getAttribute("data-i18n");
      if (keep && (keep.startsWith("sidebar.") || keep.startsWith("nav."))) return;
      a.removeAttribute("data-i18n");
      label?.removeAttribute("data-i18n");
    });
    navRoot.querySelectorAll("a.nav-subitem").forEach((a) => {
      const t = (a.textContent || "").trim();
      const key = MENU_TITLE_TO_I18N_KEY[t];
      if (key) {
        a.setAttribute("data-i18n", key);
        return;
      }
      const keep = a.getAttribute("data-i18n");
      if (keep && (keep.startsWith("sidebar.") || keep.startsWith("nav.") || keep.startsWith("menu."))) return;
      a.removeAttribute("data-i18n");
    });
    navRoot.querySelectorAll(".nav-group-toggle").forEach((btn) => {
      const label = btn.querySelector(".nav-item-label");
      if (!label) return;
      const t = label.textContent.trim();
      const key = MENU_TITLE_TO_I18N_KEY[t];
      if (key) label.setAttribute("data-i18n", key);
      else label.removeAttribute("data-i18n");
    });

    const VENUE_TITLE_TO_KEY = {
      "Giảng đường Đa Năng": "menu.venueLectureHall",
      "Căn Tin": "menu.venueCanteen",
    };

    navRoot.querySelectorAll("a.nav-item, a.nav-subitem").forEach((a) => {
      const t = (a.textContent || "").trim();
      const m = t.match(/^(?:Tòa nhà|Phòng học)\s+(.+)$/i);
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

      const linkView = absUrl.searchParams.get("view");
      const curView = curUrl.searchParams.get("view");
      if (linkView != null || curView != null) {
        return (linkView || "") === (curView || "");
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

  const NAV_ICON_SVGS = {
    home:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
    room:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="1"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    folder:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    asset:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7z"/><path d="m9 12 2 2 4-4"/></svg>',
    student:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 11v4c0 2.5 2.7 4.5 6 4.5s6-2 6-4.5v-4"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/></svg>',
    work:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/><path d="M9 14h2M13 14h2M9 17h6"/></svg>',
    pending:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    incomplete:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M5 6h.01M5 12h.01M5 18h.01"/></svg>',
    mine:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 11l2 2 4-4"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    inspection:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>',
  };

  const NAV_ICON_BY_TITLE = {
    "Trang chủ": "home",
    Home: "home",
    ホーム: "home",
    "Người dùng": "users",
    Users: "users",
    ユーザー: "users",
    "Phòng học": "room",
    "Tòa nhà & phòng": "room",
    "Buildings & rooms": "room",
    建物と部屋: "room",
    "Danh mục": "folder",
    Categories: "folder",
    カテゴリ: "folder",
    "Tài sản": "asset",
    Assets: "asset",
    資産: "asset",
    "Liên hệ": "mail",
    Contacts: "mail",
    連絡先: "mail",
    "Phân quyền": "shield",
    "Access control": "shield",
    権限管理: "shield",
    "Sinh viên": "student",
    Students: "student",
    学生: "student",
    "Thống kê": "chart",
    Statistics: "chart",
    統計: "chart",
    "Quản lý tài sản": "asset",
    "Asset management": "asset",
    "資産管理": "asset",
    "Quản lý công việc": "work",
    "Work management": "work",
    "業務管理": "work",
    "Chờ xử lí": "pending",
    "Chờ xử lý": "pending",
    Pending: "pending",
    処理待ち: "pending",
    "Chưa hoàn thành": "incomplete",
    Incomplete: "incomplete",
    未完了: "incomplete",
    "Công việc của tôi": "mine",
    "My tasks": "mine",
    自分の業務: "mine",
    "Đăng xuất": "logout",
    "Kiểm tra": "inspection",
    Inspection: "inspection",
    点検: "inspection",
    "Kiểm kê định kỳ": "inspection",
    "Periodic inventory": "inspection",
    定期棚卸: "inspection",
  };

  function navIconKey(node, fallbackTitle) {
    const title = String(node?.title || fallbackTitle || "").trim();
    if (NAV_ICON_BY_TITLE[title]) return NAV_ICON_BY_TITLE[title];
    const name = menuNodeName(node).toLowerCase();
    if (name.includes("user")) return "users";
    if (name.includes("asset")) return "asset";
    if (name.includes("categor")) return "folder";
    if (name.includes("contact")) return "mail";
    if (name.includes("rbac") || name.includes("role")) return "shield";
    if (name.includes("student")) return "student";
    if (name.includes("building") || name.includes("room") || name.includes("department") || name.includes("phong")) {
      return "room";
    }
    if (name.includes("stat")) return "chart";
    if (name.includes("work_pending")) return "pending";
    if (name.includes("work_incomplete")) return "incomplete";
    if (name.includes("work_mine")) return "mine";
    if (name.includes("work_mgmt") || name.includes("work_")) return "work";
    if (name.includes("request")) return "work";
    if (name.includes("inspection") || name.includes("audit")) return "inspection";
    return "dot";
  }

  function navIconSvg(key) {
    return NAV_ICON_SVGS[key] || NAV_ICON_SVGS.dot;
  }

  function fillNavRow(el, label, iconKey, options) {
    const opts = options || {};
    el.textContent = "";
    const icon = document.createElement("span");
    icon.className = "nav-item-icon";
    icon.innerHTML = navIconSvg(iconKey);
    icon.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.className = "nav-item-label";
    text.textContent = label;
    el.appendChild(icon);
    el.appendChild(text);
    if (opts.chevron !== false) {
      const chevron = document.createElement("span");
      chevron.className = "nav-item-chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.textContent = "›";
      el.appendChild(chevron);
    }
  }

  function buildGroupToggle(node) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-group-toggle";
    fillNavRow(toggle, node.title || "", navIconKey(node));
    return toggle;
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
    const tm = title.match(/^(?:Tòa nhà|Phòng học)\s+(.+)$/i);
    if (tm) return tm[1].trim();
    return null;
  }

  function departmentsHrefForBuilding(code) {
    return `pages/dashboard/departments.html?building=${encodeURIComponent(code)}`;
  }

  function resolveMenuCanonical(node) {
    const menuName = menuNodeName(node).toLowerCase();
    if (menuName === "nav_building" || menuName === "page_room_management") {
      return "pages/dashboard/room-map.html";
    }
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
    a.className = variant === "top" ? "nav-item" : "nav-subitem nav-subitem--with-icon";
    if (isActiveHref(href)) a.classList.add("active");
    a.href = href;
    fillNavRow(a, node.title || node.name || "", navIconKey(node));
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

    const toggle = buildGroupToggle(node);

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
    fillNavRow(homeA, "Trang chủ", "home");
    homeA.querySelector(".nav-item-label")?.setAttribute("data-i18n", "sidebar.home");
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

        const toggle = buildGroupToggle(node);

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

      const sidebarTop = document.createElement("div");
      sidebarTop.className = "sidebar-top";

      const brand = document.createElement("div");
      brand.id = "sidebarBrandText";
      brand.className = "brand";
      brand.textContent = "CSVC";

      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "sidebar-logout-btn nav-action-btn";
      logoutBtn.setAttribute("data-action", "logout");
      logoutBtn.setAttribute("aria-label", "Đăng xuất");
      const logoutIcon = document.createElement("span");
      logoutIcon.className = "nav-item-icon";
      logoutIcon.innerHTML = navIconSvg("logout");
      logoutIcon.setAttribute("aria-hidden", "true");
      const logoutLabel = document.createElement("span");
      logoutLabel.className = "sidebar-logout-label nav-item-label";
      logoutLabel.setAttribute("data-i18n", "sidebar.logout");
      logoutLabel.textContent = "Đăng xuất";
      logoutBtn.appendChild(logoutIcon);
      logoutBtn.appendChild(logoutLabel);

      sidebarTop.appendChild(brand);
      sidebarTop.appendChild(logoutBtn);

      const profile = document.createElement("div");
      profile.className = "profile-box";
      const u = window.AppAuth?.getCurrentUser?.();
      const avatarSrc =
        window.UserAvatar?.resolve?.(u) ||
        hrefToFrontendPage("assets/images/avatar/avatar_1.jpg");
      const displayName = u?.fullName || u?.username || "—";
      profile.innerHTML = `
        <img src="${escapeHtml(avatarSrc)}" alt="" />
        <div class="profile-greeting">
          <span id="sidebarWelcomeText" class="profile-greeting-line" data-i18n="sidebar.welcome">Xin chào,</span>
          <strong id="sidebarRoleText" class="sidebar-user-name">${escapeHtml(displayName)}</strong>
        </div>`;

      const nav = document.createElement("nav");
      const menuScroll = document.createElement("div");
      menuScroll.className = "sidebar-nav-menu";

      if (!roots.length) {
        menuScroll.innerHTML = `<p style="padding:8px;color:var(--muted,#666)" data-i18n="sidebar.emptyMenu">Không có menu.</p>`;
      } else {
        renderRoots(menuScroll, roots);
      }

      annotateSidebarMenuI18n(menuScroll);

      nav.appendChild(menuScroll);

      aside.appendChild(sidebarTop);
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
