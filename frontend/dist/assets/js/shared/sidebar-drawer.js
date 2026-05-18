/**
 * Nút hamburger (3 gạch) — luôn hiện trên topbar.
 * Desktop: thu/gọn cột sidebar. Mobile: drawer trượt từ trái.
 */
(function sidebarDrawerScope(window) {
  const OPEN_CLASS = "fm-sidebar-open";
  const COLLAPSED_CLASS = "fm-sidebar-collapsed";
  const MQ = window.matchMedia("(max-width: 992px)");

  function isDrawerMode() {
    return MQ.matches;
  }

  function isSidebarOpen() {
    if (isDrawerMode()) {
      return document.documentElement.classList.contains(OPEN_CLASS);
    }
    return !document.documentElement.classList.contains(COLLAPSED_CLASS);
  }

  function syncButton() {
    const open = isSidebarOpen();
    const btn = document.querySelector(".fm-hamburger");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    const backdrop = document.querySelector(".fm-sidebar-backdrop");
    if (backdrop) backdrop.hidden = !open || !isDrawerMode();
    document.body.style.overflow = open && isDrawerMode() ? "hidden" : "";
  }

  function setOpen(open) {
    if (isDrawerMode()) {
      document.documentElement.classList.toggle(OPEN_CLASS, open);
      document.documentElement.classList.remove(COLLAPSED_CLASS);
    } else {
      document.documentElement.classList.toggle(COLLAPSED_CLASS, !open);
      document.documentElement.classList.remove(OPEN_CLASS);
    }
    syncButton();
  }

  function close() {
    setOpen(false);
  }

  function toggle() {
    setOpen(!isSidebarOpen());
  }

  function ensureBackdrop() {
    let backdrop = document.querySelector(".fm-sidebar-backdrop");
    if (backdrop) return backdrop;
    backdrop = document.createElement("div");
    backdrop.className = "fm-sidebar-backdrop";
    backdrop.hidden = true;
    backdrop.addEventListener("click", close);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function injectHamburger() {
    const left = document.querySelector(".topbar-left");
    if (!left || left.querySelector(".fm-hamburger")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fm-hamburger";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-controls", "appSidebar");
    btn.setAttribute("data-i18n-aria-label", "nav.menuToggle");
    btn.setAttribute("aria-label", "Mở menu");

    const bar1 = document.createElement("span");
    const bar2 = document.createElement("span");
    const bar3 = document.createElement("span");
    bar1.className = "fm-hamburger-bar";
    bar2.className = "fm-hamburger-bar";
    bar3.className = "fm-hamburger-bar";
    btn.append(bar1, bar2, bar3);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });

    left.insertBefore(btn, left.firstChild);
    window.FmI18n?.apply?.(btn);
  }

  function bindSidebarLinks() {
    const host = document.getElementById("appSidebar");
    if (!host || host.dataset.fmDrawerBound === "1") return;
    host.dataset.fmDrawerBound = "1";
    host.addEventListener("click", (e) => {
      if (!isDrawerMode()) return;
      if (e.target.closest("a[href]")) close();
    });
  }

  function onMqChange() {
    document.documentElement.classList.remove(OPEN_CLASS);
    document.documentElement.classList.remove(COLLAPSED_CLASS);
    syncButton();
  }

  function init() {
    if (!document.getElementById("appSidebar")) return;
    ensureBackdrop();
    injectHamburger();
    bindSidebarLinks();
    syncButton();

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    if (typeof MQ.addEventListener === "function") {
      MQ.addEventListener("change", onMqChange);
    } else if (typeof MQ.addListener === "function") {
      MQ.addListener(onMqChange);
    }

    window.FmSidebarDrawer = { open: () => setOpen(true), close, toggle, isOpen: isSidebarOpen };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
