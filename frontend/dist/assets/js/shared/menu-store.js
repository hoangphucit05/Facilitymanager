/**
 * Cache menu từ GET /api/permission/getMenuList (KetQuaApi), TTL + invalidate sau CRUD.
 * Gộp title quyền nút (permissionType === 1, permTypes) cho AppPerm.
 */
(function menuStoreScope(window) {
  const KEY_TREE = "app.menuTree";
  const KEY_TS = "app.menuTreeTs";
  const KEY_VER = "app.menuTreeVer";
  const MENU_CACHE_VER = "4";
  const TTL_MS = 10 * 60 * 1000;

  function ensureMenuCacheVersion() {
    try {
      if (localStorage.getItem(KEY_VER) === MENU_CACHE_VER) return;
      localStorage.removeItem(KEY_TREE);
      localStorage.removeItem(KEY_TS);
      localStorage.setItem(KEY_VER, MENU_CACHE_VER);
    } catch (_) {
      /* ignore */
    }
  }

  function depthFromFrontendRoot() {
    const path = window.location.pathname.replace(/\\/g, "/");
    let segs = path.split("/").filter(Boolean);
    const fi = segs.indexOf("frontend");
    if (fi >= 0) segs = segs.slice(fi + 1);
    if (!segs.length) return 0;
    segs.pop();
    return segs.length;
  }

  function loginPageHref() {
    const d = depthFromFrontendRoot();
    const prefix = d ? `${"../".repeat(d)}` : "";
    return `${prefix}pages/auth/login.html`;
  }

  function unauthorizedPageHref() {
    const d = depthFromFrontendRoot();
    const prefix = d ? `${"../".repeat(d)}` : "";
    return `${prefix}pages/auth/unauthorized.html`;
  }

  function mergeSessionTitles(sink, session) {
    const list = session?.permissionTitles;
    if (Array.isArray(list)) {
      list.forEach((t) => {
        if (t) sink.add(String(t).trim());
      });
    }
  }

  function collectPermTitlesFromTree(roots) {
    const sink = new Set();
    function walk(nodes) {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        const pt = n.permissionType;
        if (pt === 1 && n.title) sink.add(String(n.title).trim());
        const pts = n.permTypes;
        if (Array.isArray(pts)) {
          pts.forEach((x) => {
            if (x) sink.add(String(x).trim());
          });
        }
        if (n.children?.length) walk(n.children);
      }
    }
    walk(roots);
    const session = window.AppAuth?.getSession?.();
    mergeSessionTitles(sink, session);
    return sink;
  }

  async function loadMenu(force) {
    ensureMenuCacheVersion();
    const session = window.AppAuth?.getSession?.();
    if (!session?.accessToken) {
      return { roots: [], permTitles: new Set() };
    }

    if (!force) {
      try {
        const ts = Number(localStorage.getItem(KEY_TS) || "0");
        const raw = localStorage.getItem(KEY_TREE);
        if (raw && Date.now() - ts < TTL_MS) {
          const roots = JSON.parse(raw);
          const permTitles = collectPermTitlesFromTree(roots);
          mergeSessionTitles(permTitles, session);
          return { roots, permTitles };
        }
      } catch {
        /* cache hỏng → tải lại */
      }
    }

    const base = window.AppAuth.resolveApiBase();
    const url = `${base}/api/permission/getMenuList`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      credentials: "omit",
    });

    if (res.status === 401) {
      window.AppAuth?.clearSession?.();
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = `${loginPageHref()}?next=${next}`;
      return { roots: [], permTitles: new Set() };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    const roots = Array.isArray(data.result) ? data.result : [];
    try {
      localStorage.setItem(KEY_TREE, JSON.stringify(roots));
      localStorage.setItem(KEY_TS, String(Date.now()));
    } catch {
      /* ignore */
    }

    const permTitles = collectPermTitlesFromTree(roots);
    mergeSessionTitles(permTitles, session);
    return { roots, permTitles };
  }

  function invalidateMenu() {
    try {
      localStorage.removeItem(KEY_TREE);
      localStorage.removeItem(KEY_TS);
      localStorage.setItem(KEY_VER, MENU_CACHE_VER);
    } catch {
      /* ignore */
    }
  }

  function getCachedPermTitles() {
    try {
      const raw = localStorage.getItem(KEY_TREE);
      if (!raw) return new Set();
      const roots = JSON.parse(raw);
      return collectPermTitlesFromTree(roots);
    } catch {
      return new Set();
    }
  }

  window.MenuStore = {
    loadMenu,
    invalidateMenu,
    getCachedPermTitles,
    loginPageHref,
    unauthorizedPageHref,
    depthFromFrontendRoot,
  };
})(window);
