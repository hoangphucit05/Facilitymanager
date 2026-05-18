(function guardProtectedPages(window) {
  const body = document.body;
  if (!body) return;

  const requiredRolesAttr = body.getAttribute("data-required-roles");
  if (!requiredRolesAttr) return;

  const currentUser = window.AppAuth?.getCurrentUser?.();
  if (!currentUser) {
    const hrefFn = window.MenuStore?.loginPageHref;
    if (typeof hrefFn === "function") {
      window.location.href = hrefFn();
    } else {
      const path = window.location.pathname.replace(/\\/g, "/");
      let segs = path.split("/").filter(Boolean);
      const fi = segs.indexOf("frontend");
      if (fi >= 0) segs = segs.slice(fi + 1);
      if (!segs.length) {
        window.location.href = "pages/auth/login.html";
      } else {
        segs.pop();
        const d = segs.length;
        window.location.href = `${"../".repeat(d)}pages/auth/login.html`;
      }
    }
    return;
  }

  const requiredRoles = requiredRolesAttr
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const currentRole = String(currentUser.role || "").toUpperCase();
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentRole)) {
    const uh = window.MenuStore?.unauthorizedPageHref;
    if (typeof uh === "function") {
      window.location.href = uh();
    } else {
      const path = window.location.pathname.replace(/\\/g, "/");
      let segs = path.split("/").filter(Boolean);
      const fi = segs.indexOf("frontend");
      if (fi >= 0) segs = segs.slice(fi + 1);
      segs.pop();
      const d = Math.max(0, segs.length);
      window.location.href = `${"../".repeat(d)}pages/auth/unauthorized.html`;
    }
    return;
  }

  const userNameEl = document.getElementById("currentUserName");
  if (userNameEl) {
    userNameEl.textContent = currentUser.fullName || currentUser.username;
  }
})(window);
