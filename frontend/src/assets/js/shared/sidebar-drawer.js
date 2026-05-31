/**
 * Sidebar drawer (mobile) + thu gọn sidebar (desktop) qua nút hamburger topbar.
 */
(function sidebarDrawerScope(window) {
  const STORAGE_KEY = "fm_sidebar_collapsed";

  function isMobile() {
    return window.matchMedia("(max-width: 960px)").matches;
  }

  function setDrawerOpen(open) {
    document.body.classList.toggle("sidebar-open", open);
    document.querySelectorAll(".topbar-menu-btn").forEach((btn) => {
      if (isMobile()) btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
    document.querySelectorAll(".topbar-menu-btn").forEach((btn) => {
      if (!isMobile()) btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
  }

  function restoreDesktopState() {
    if (isMobile()) return;
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch (_) {
      /* ignore */
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      setDrawerOpen(!document.body.classList.contains("sidebar-open"));
      return;
    }
    setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  }

  function init() {
    if (window.__fmSidebarDrawerInit) return;
    window.__fmSidebarDrawerInit = true;

    restoreDesktopState();

    document.addEventListener("click", (e) => {
      const menuBtn = e.target.closest(".topbar-menu-btn");
      if (menuBtn) {
        toggleSidebar();
        return;
      }

      const backdrop = e.target.closest(".sidebar-backdrop");
      if (backdrop) {
        setDrawerOpen(false);
        return;
      }

      const navLink = e.target.closest("#appSidebar a.nav-item, #appSidebar a.nav-subitem, #appSidebar [data-action='logout']");
      if (navLink && isMobile()) {
        setDrawerOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) {
        setDrawerOpen(false);
        restoreDesktopState();
      } else {
        document.body.classList.remove("sidebar-collapsed");
      }
    });
  }

  window.FmSidebarDrawer = { init, setOpen: setDrawerOpen, setCollapsed, toggleSidebar };
  init();
})(window);
