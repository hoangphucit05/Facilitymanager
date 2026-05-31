/**
 * Trang chủ index.html — module thường dùng (lưới + công việc).
 */
(function homePageScope() {
  const auth = window.AppAuth;
  const sidebarApi = window.AppSidebar;
  const menuStore = window.MenuStore;
  if (!auth || !sidebarApi) return;

  const MAIN_MODULES = [
    {
      id: "users",
      titleKey: "dashboard.cardUsersTitle",
      subtitleKey: "dashboard.cardUsersSubtitle",
      href: "pages/profile/users.html",
      icon: "👤",
      tone: "orange",
      menuNames: ["page_users"],
    },
    {
      id: "rooms",
      titleKey: "dashboard.cardRoomsTitle",
      subtitleKey: "dashboard.cardRoomsSubtitle",
      href: "pages/dashboard/room-map.html",
      icon: "🏫",
      tone: "blue",
      menuNames: ["page_room_management", "page_departments"],
    },
    {
      id: "statistics",
      titleKey: "dashboard.cardStatsShortTitle",
      subtitleKey: "dashboard.cardStatsSubtitle",
      href: "pages/dashboard/statistics.html",
      icon: "📊",
      tone: "green",
      menuNames: ["page_statistics"],
    },
    {
      id: "categories",
      titleKey: "dashboard.cardCategoriesTitle",
      subtitleKey: "dashboard.cardCategoriesSubtitle",
      href: "pages/dashboard/categories.html",
      icon: "📁",
      tone: "purple",
      menuNames: ["page_categories"],
    },
    {
      id: "assets",
      titleKey: "dashboard.cardAssetsTitle",
      subtitleKey: "dashboard.cardAssetsSubtitle",
      href: "pages/dashboard/assets.html",
      icon: "📦",
      tone: "brown",
      menuNames: ["page_assets"],
    },
    {
      id: "inspection",
      titleKey: "dashboard.cardInspectionTitle",
      subtitleKey: "dashboard.cardInspectionSubtitle",
      href: "pages/dashboard/audit-periodic.html",
      icon: "📋",
      tone: "pink",
      menuNames: ["page_audit_periodic"],
    },
  ];

  const TASK_MODULES = [
    {
      id: "pending",
      titleKey: "dashboard.taskPending",
      href: "pages/dashboard/requests.html?view=pending",
      icon: "📋",
      tone: "orange",
      menuNames: ["page_work_pending"],
    },
    {
      id: "open",
      titleKey: "dashboard.taskOpen",
      href: "pages/dashboard/requests.html?view=incomplete",
      icon: "🕐",
      tone: "blue",
      menuNames: ["page_work_incomplete"],
    },
    {
      id: "mine",
      titleKey: "dashboard.taskMine",
      href: "pages/dashboard/requests.html?view=mine",
      icon: "👤",
      tone: "green",
      menuNames: ["page_work_mine"],
    },
  ];

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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      dateEl.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /** @returns {Promise<Map<string,string>>} */
  async function loadNameToHref() {
    const map = new Map();
    try {
      if (!menuStore?.loadMenu) return map;
      const { roots } = await menuStore.loadMenu(false);

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

      const top =
        roots.length === 1 && roots[0].permissionType === -1 && roots[0].children?.length
          ? roots[0].children
          : roots;
      walk(top);
    } catch {
      /* ignore */
    }
    return map;
  }

  function resolveModuleHref(def, nameToHref) {
    if (def.href) {
      return sidebarApi.resolveHref?.(def.href) || def.href;
    }
    for (const name of def.menuNames || []) {
      const hit = nameToHref.get(name);
      if (hit) return hit;
    }
    return null;
  }

  function createMainModuleCard(def, href) {
    const el = document.createElement(href ? "a" : "button");
    el.className = "home-module-card home-module-card--tile";
    if (!href) {
      el.type = "button";
      el.disabled = true;
      el.classList.add("is-disabled");
    } else {
      el.href = href;
    }

    el.innerHTML = `
      <span class="home-module-icon home-module-icon--${def.tone}" aria-hidden="true">${def.icon}</span>
      <span class="home-module-text">
        <p class="home-module-title" data-i18n="${def.titleKey}"></p>
        <p class="home-module-subtitle" data-i18n="${def.subtitleKey}"></p>
      </span>
      <span class="home-module-arrow" aria-hidden="true">›</span>`;
    return el;
  }

  function createTaskCard(def, href) {
    const el = document.createElement(href ? "a" : "button");
    el.className = "home-task-card";
    if (!href) {
      el.type = "button";
      el.disabled = true;
      el.classList.add("is-disabled");
    } else {
      el.href = href;
    }

    el.innerHTML = `
      <span class="home-task-icon home-task-icon--${def.tone}" aria-hidden="true">${def.icon}</span>
      <span class="home-task-title" data-i18n="${def.titleKey}"></span>
      <span class="home-module-arrow" aria-hidden="true">›</span>`;
    return el;
  }

  function renderModules(mainGrid, taskList, nameToHref) {
    if (mainGrid) {
      mainGrid.innerHTML = "";
      MAIN_MODULES.forEach((def) => {
        mainGrid.appendChild(createMainModuleCard(def, resolveModuleHref(def, nameToHref)));
      });
      window.FmI18n?.apply?.(mainGrid);
    }
    if (taskList) {
      taskList.innerHTML = "";
      TASK_MODULES.forEach((def) => {
        taskList.appendChild(createTaskCard(def, resolveModuleHref(def, nameToHref)));
      });
      window.FmI18n?.apply?.(taskList);
    }
  }

  window.addEventListener("fm-i18n-applied", () => {
    const mainGrid = document.getElementById("homeModuleGrid");
    const taskList = document.getElementById("homeTaskList");
    if (mainGrid) window.FmI18n?.apply?.(mainGrid);
    if (taskList) window.FmI18n?.apply?.(taskList);
    const dateEl = document.getElementById("homeDate");
    const clockEl = document.getElementById("homeClock");
    if (dateEl && clockEl) updateClock(dateEl, clockEl);
  });

  document.addEventListener("DOMContentLoaded", async () => {
    const mainGrid = document.getElementById("homeModuleGrid");
    const taskList = document.getElementById("homeTaskList");
    const dateEl = document.getElementById("homeDate");
    const clockEl = document.getElementById("homeClock");
    const nameEl = document.getElementById("homeUserName");
    if (!mainGrid || !taskList || !dateEl || !clockEl || !nameEl) return;

    const u = auth.getCurrentUser?.();
    const session = auth.getSession?.();
    nameEl.textContent = (u && (u.fullName || u.username)) || session?.fullName || session?.username || "—";

    updateClock(dateEl, clockEl);
    setInterval(() => updateClock(dateEl, clockEl), 1000);

    const nameToHref = await loadNameToHref();
    renderModules(mainGrid, taskList, nameToHref);
  });
})();
