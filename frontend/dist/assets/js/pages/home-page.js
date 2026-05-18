/**
 * Trang chủ index.html — logic tương đương school front/src/views/home/home.vue .
 * Gọi /myDoor/getMyDoorList6 khi backend zwz có; nếu không thì fallback tĩnh.
 */
(function homePageScope() {
  const auth = window.AppAuth;
  const sidebarApi = window.AppSidebar;
  const menuStore = window.MenuStore;
  if (!auth || !sidebarApi) return;

  const DEFAULT_SHORTCUTS = [
    { key: "home.shortcuts.assets", href: "pages/dashboard/assets.html" },
    { key: "home.shortcuts.categories", href: "pages/dashboard/categories.html" },
    { key: "home.shortcuts.statistics", href: "pages/dashboard/statistics.html" },
    { key: "home.shortcuts.building", href: "pages/dashboard/departments.html" },
    { key: "home.shortcuts.liquidation", href: "pages/dashboard/liquidation.html" },
    { key: "home.shortcuts.users", href: "pages/profile/users.html" },
  ];

  const TITLE_MAP = {
    "Tài sản": "home.shortcuts.assets",
    "Danh mục": "home.shortcuts.categories",
    "Thống kê": "home.shortcuts.statistics",
    "Tòa nhà": "home.shortcuts.building",
    "Thanh lý / điều chuyển": "home.shortcuts.liquidation",
    "Điều chuyển / thanh lý": "home.shortcuts.liquidation",
    "Người dùng": "home.shortcuts.users",
    Assets: "home.shortcuts.assets",
    Categories: "home.shortcuts.categories",
    Statistics: "home.shortcuts.statistics",
    Buildings: "home.shortcuts.building",
    "Disposal / transfer": "home.shortcuts.liquidation",
    Users: "home.shortcuts.users",
    資産: "home.shortcuts.assets",
    分類: "home.shortcuts.categories",
    統計: "home.shortcuts.statistics",
    建物: "home.shortcuts.building",
    "廃棄・移管": "home.shortcuts.liquidation",
    ユーザー: "home.shortcuts.users",
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function updateClock(dateEl, clockEl) {
    const d = new Date();
    const loc = window.FmI18n?.getLocale?.() || "vi";
    const intlLoc = loc === "en" ? "en-GB" : loc === "ja" ? "ja-JP" : "vi-VN";
    try {
      dateEl.textContent = new Intl.DateTimeFormat(intlLoc, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);
    } catch {
      dateEl.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /** @returns {Promise<Map<string,string>>} permission name → href */
  async function loadNameToHref() {
    const map = new Map();
    try {
      if (!menuStore?.loadMenu) return map;
      const { roots } = await menuStore.loadMenu(false);

      /** @param {any[]} nodes */
      function walk(nodes) {
        for (const n of nodes || []) {
          const pt = n.permissionType;
          const ch = n.children || [];
          if (Number(pt) === 0 && (n.name || n.menuName)) {
            const canon = sidebarApi.resolveMenuCanonical?.(n) || n.path;
            const href = sidebarApi.resolveHref(canon || n.path || "");
            if (href && href !== "#" && !href.includes("not-found")) {
              map.set(String(n.name || n.menuName), href);
            }
          }
          if (ch.length) walk(ch);
        }
      }

      const top = roots.length === 1 && roots[0].permissionType === -1 && roots[0].children?.length ? roots[0].children : roots;
      walk(top);
    } catch {
      /* menu lỗi → chỉ dùng default */
    }
    return map;
  }

  /**
   * @param {HTMLElement} grid
   * @param {Map<string,string>} nameToHref
   */
  function renderShortcuts(grid, nameToHref, list) {
    grid.innerHTML = "";
    list.forEach((item) => {
      const rawTitle = (item.title || "").trim() || "—";
      const name = item.name != null ? String(item.name) : "";
      const badName = !name || name === "null";
      const unset = rawTitle === "尚未添加" || rawTitle === "Chưa thêm";
      const href = !badName ? nameToHref.get(name) : null;

      if (href) {
        const a = document.createElement("a");
        a.className = "home-shortcut-tile";
        a.href = href;
        if (unset) {
          a.setAttribute("data-i18n", "common.shortcutEmpty");
          a.textContent = "";
        } else {
          const i18nKey = TITLE_MAP[rawTitle];
          if (i18nKey) a.setAttribute("data-i18n", i18nKey);
          a.textContent = rawTitle;
        }
        grid.appendChild(a);
        return;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "home-shortcut-tile is-placeholder";
      btn.disabled = true;
      const i18nKeyBtn = TITLE_MAP[rawTitle];
      if (i18nKeyBtn && !badName && !unset) btn.setAttribute("data-i18n", i18nKeyBtn);
      btn.textContent = badName || unset ? "" : rawTitle;
      if (badName || unset) btn.setAttribute("data-i18n", "common.shortcutEmpty");
      grid.appendChild(btn);
    });
  }

  /** @param {HTMLElement} grid */
  function renderDefaultAnchors(grid) {
    grid.innerHTML = "";
    DEFAULT_SHORTCUTS.forEach((s) => {
      const a = document.createElement("a");
      a.className = "home-shortcut-tile";
      a.href = s.href;
      a.setAttribute("data-i18n", s.key);
      a.textContent = " ";
      grid.appendChild(a);
    });
    window.FmI18n?.apply?.(grid);
  }

  async function loadMyDoorShortcuts(grid, nameToHref) {
    try {
      const res = await auth.rbacFetch("/myDoor/getMyDoorList6", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: "",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error("myDoor");
      const rows = Array.isArray(data.result) ? data.result : Array.isArray(data.data) ? data.data : null;
      if (!rows || !rows.length) throw new Error("empty");
      const mapped = rows.map((r) => ({
        name: r.name,
        title: r.title || r.name,
      }));
      renderShortcuts(grid, nameToHref, mapped);
      window.FmI18n?.apply?.(grid);
    } catch {
      renderDefaultAnchors(grid);
    }
  }

  function bindTaskButtons() {
    document.querySelectorAll(".home-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.alert("Tính năng đang được phát triển.");
      });
    });
  }

  window.addEventListener("fm-i18n-applied", () => {
    const grid = document.getElementById("homeShortcutGrid");
    if (grid) window.FmI18n?.apply?.(grid);
    const dateEl = document.getElementById("homeDate");
    const clockEl = document.getElementById("homeClock");
    if (dateEl && clockEl) updateClock(dateEl, clockEl);
  });

  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("homeShortcutGrid");
    const dateEl = document.getElementById("homeDate");
    const clockEl = document.getElementById("homeClock");
    const nameEl = document.getElementById("homeUserName");
    if (!grid || !dateEl || !clockEl || !nameEl) return;

    const u = auth.getCurrentUser?.();
    const session = auth.getSession?.();
    nameEl.textContent = (u && (u.fullName || u.username)) || session?.fullName || session?.username || "—";

    updateClock(dateEl, clockEl);
    setInterval(() => updateClock(dateEl, clockEl), 1000);

    bindTaskButtons();

    const nameToHref = await loadNameToHref();
    await loadMyDoorShortcuts(grid, nameToHref);
  });
})();
