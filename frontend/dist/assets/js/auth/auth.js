/**
 * Xác thực: CAPTCHA (UUID + Redis) + opaque token (UUID lưu Redis).
 * - Lưu session/user trong localStorage; mỗi request gắn header Authorization: Bearer <token>.
 */
(function initAuthScope(window) {
  const STORAGE_USER = "app.currentUser";
  const STORAGE_SESSION = "app.session";

  /** @type {string|null} */
  let currentCaptchaId = null;

  function resolveApiBase() {
    const raw = window.APP_API_BASE;
    if (raw) return String(raw).replace(/\/$/, "");
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "https:" : "http:";
    const host = loc.hostname || "localhost";
    return `${protocol}//${host}:8080`;
  }

  function getSession() {
    const raw = localStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_SESSION);
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  }

  function removeStoredSession() {
    localStorage.removeItem(STORAGE_SESSION);
  }

  function clearSession() {
    removeStoredSession();
    clearCurrentUser();
    try {
      localStorage.removeItem("app.menuTree");
      localStorage.removeItem("app.menuTreeTs");
    } catch {
      /* ignore */
    }
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_USER);
      return null;
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(STORAGE_USER);
  }

  function deriveNavigationRole(roleCodes) {
    const order = ["ADMIN", "MANAGER", "STAFF", "STUDENT"];
    const upper = Array.isArray(roleCodes) ? roleCodes.map((c) => String(c).toUpperCase()) : [];
    for (const r of order) {
      if (upper.includes(r)) return r;
    }
    return upper[0] || "STAFF";
  }

  function matchesRequiredRoles(required) {
    const cur = getSession()?.roleCodes || [];
    const upperCur = cur.map((c) => String(c).toUpperCase());
    return required.some((r) => upperCur.includes(String(r).toUpperCase()));
  }

  async function refreshCaptcha() {
    const base = resolveApiBase();
    const res = await fetch(`${base}/api/common/captcha/init`, { method: "GET", credentials: "omit" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false || data.result == null) {
      throw new Error(data.message || "Không tạo được mã captcha.");
    }
    currentCaptchaId = String(data.result);
    const img = document.getElementById("captchaImg");
    if (img) {
      img.src = `${base}/api/common/captcha/draw/${encodeURIComponent(currentCaptchaId)}?t=${Date.now()}`;
    }
    return currentCaptchaId;
  }

  function getCaptchaId() {
    return currentCaptchaId;
  }

  async function loginRemote(username, password, imgCode, captchaId, saveLogin) {
    const base = resolveApiBase();
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    body.set("code", imgCode);
    body.set("captchaId", captchaId);
    if (saveLogin) body.set("saveLogin", "true");

    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      credentials: "omit",
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 400 && data.message) {
      return { ok: false, message: data.message };
    }
    if (!res.ok) {
      return { ok: false, message: data.message || data.thongDiep || "Đăng nhập thất bại." };
    }

    const session = {
      accessToken: data.accessToken,
      tokenType: data.tokenType || "Bearer",
      username: data.username,
      fullName: data.fullName,
      userId: data.userId,
      roleIds: data.roleIds,
      permissionIds: data.permissionIds,
      roleCodes: data.roleCodes || [],
      permissionTitles: Array.isArray(data.permissionTitles) ? data.permissionTitles : [],
    };
    setSession(session);

    const navRole = deriveNavigationRole(session.roleCodes);
    setCurrentUser({
      username: session.username,
      fullName: session.fullName,
      role: navRole,
      roleCodes: session.roleCodes,
      userId: session.userId,
    });

    return { ok: true, session };
  }

  async function registRemote(username, password, nickname, imgCode, captchaId) {
    const base = resolveApiBase();
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    body.set("nickname", nickname);
    body.set("code", imgCode);
    body.set("captchaId", captchaId);

    const res = await fetch(`${base}/api/auth/regist`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      credentials: "omit",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { ok: false, message: data.message || data.thongDiep || "Đăng ký thất bại." };
    }
    return { ok: true };
  }

  async function logoutRemote() {
    const base = resolveApiBase();
    const token = getSession()?.accessToken;
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "omit",
      });
    } catch {
      /* ignore network */
    } finally {
      clearSession();
    }
  }

  async function rbacFetch(path, options = {}) {
    const base = resolveApiBase();
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = { ...(options.headers || {}) };
    const token = getSession()?.accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }

  /** Trang chủ (dashboard) — đường dẫn tuyệt đối từ gốc site, tránh pages/auth/index.html. */
  function getDefaultHomeByRole() {
    const path = window.location.pathname.replace(/\\/g, "/");
    const pagesIdx = path.indexOf("/pages/");
    const basePath = pagesIdx >= 0 ? path.slice(0, pagesIdx) : path.replace(/\/[^/]*$/, "") || "";
    const home = `${basePath}/index.html`.replace(/\/{2,}/g, "/");
    return home.startsWith("/") ? home : `/${home}`;
  }

  window.AppAuth = {
    loginRemote,
    registRemote,
    logoutRemote,
    refreshCaptcha,
    getCaptchaId,
    rbacFetch,
    resolveApiBase,
    getSession,
    deriveNavigationRole,
    matchesRequiredRoles,
    getCurrentUser,
    clearCurrentUser,
    clearSession,
    getDefaultHomeByRole,
  };
})(window);
