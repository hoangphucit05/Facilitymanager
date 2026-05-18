/**
 * Kiểm tra quyền nút (theo title permission OPERATION hoặc permTypes / permissionTitles phiên).
 */
(function permissionScope(window) {
  function isAdmin() {
    const codes = window.AppAuth?.getSession?.()?.roleCodes;
    if (!Array.isArray(codes)) return false;
    return codes.some((c) => String(c).toUpperCase() === "ADMIN");
  }

  function hasPerm(token) {
    if (!token) return false;
    if (isAdmin()) return true;
    const t = String(token).trim();
    const session = window.AppAuth?.getSession?.();
    const titles = Array.isArray(session?.permissionTitles) ? session.permissionTitles : [];
    if (titles.some((x) => String(x).trim() === t)) return true;
    const cached = window.MenuStore?.getCachedPermTitles?.();
    if (cached?.has?.(t)) return true;
    return false;
  }

  function applyToDOM(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-perm]").forEach((el) => {
      const raw = el.getAttribute("data-perm") || "";
      const tokens = raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!tokens.length) return;
      const ok = tokens.some((tok) => hasPerm(tok));
      el.style.display = ok ? "" : "none";
    });
  }

  window.AppPerm = {
    hasPerm,
    applyToDOM,
    isAdmin,
  };
})(window);
