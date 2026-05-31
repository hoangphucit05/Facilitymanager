/**
 * FmI18n — client-side i18n for Spring Boot static + vanilla JS.
 *
 * - JSON bundles under /locales/{locale}.json (relative to frontend root).
 * - Markup: data-i18n="dot.key", data-i18n-html="dot.key" (trusted HTML from bundle),
 *   data-i18n-placeholder / data-i18n-title / data-i18n-aria-label / data-i18n-alt.
 * - Nếu chuỗi dịch chứa <ruby> thì gán innerHTML (furigana tiếng Nhật).
 * - Locale persisted with same key as lang-switcher: fm_ui_lang (vi | en | ja).
 * - Listens to fm-lang-change; dispatches fm-i18n-applied after apply.
 *
 * Extension: add locale code to SUPPORTED and ship a new JSON file.
 */
(function i18nManagerScope(window) {
  const STORAGE_KEY = "fm_ui_lang";
  const SUPPORTED = ["vi", "en", "ja"];
  /** Tăng khi thêm key dịch mới — ép trình duyệt tải lại JSON (tránh cache cũ thiếu key). */
  const BUNDLE_REV = "20260529f";
  const CACHE = new Map();

  let currentLocale = "vi";
  let currentBundle = null;

  function normalizeLocale(code) {
    const c = String(code || "vi").toLowerCase();
    return SUPPORTED.includes(c) ? c : "vi";
  }

  function detectBaseUrl() {
    if (typeof window.__I18N_BASE__ === "string") return window.__I18N_BASE__;
    const d = window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
    return d ? "../".repeat(d) : "./";
  }

  function getByPath(obj, path) {
    return String(path || "")
      .split(".")
      .reduce((o, key) => (o != null && key ? o[key] : undefined), obj);
  }

  function interpolate(template, params) {
    if (template == null) return "";
    let s = String(template);
    if (params && typeof params === "object") {
      Object.keys(params).forEach((k) => {
        s = s.split(`{{${k}}}`).join(String(params[k]));
      });
    }
    return s;
  }

  function transitionStart() {
    document.documentElement.classList.add("fm-i18n-transitioning");
  }

  function transitionEnd() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.documentElement.classList.remove("fm-i18n-transitioning");
      }, 180);
    });
  }

  async function loadBundle(locale) {
    const lang = normalizeLocale(locale);
    const cacheKey = `${lang}@${BUNDLE_REV}`;
    if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

    const base = detectBaseUrl().replace(/\/?$/, "/");
    const file = `${lang}.json?v=${encodeURIComponent(BUNDLE_REV)}`;
    const candidates = [
      `${base}locales/${file}`,
      `${base}i18n/${file}`,
      `${base}public/i18n/${file}`,
      `/locales/${file}`,
      `/i18n/${file}`,
    ];
    let lastErr = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
        if (!res.ok) {
          lastErr = new Error(`FmI18n: failed to load ${url} (${res.status})`);
          continue;
        }
        const data = await res.json();
        CACHE.set(cacheKey, data);
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error(`FmI18n: no bundle for ${lang}`);
  }

  function t(key, params) {
    const raw = getByPath(currentBundle, key);
    if (raw == null) return key;
    return interpolate(raw, params);
  }

  function applyToElement(el, bundle) {
    let params;
    const pr = el.getAttribute("data-i18n-params");
    if (pr) {
      try {
        params = JSON.parse(pr);
      } catch (_) {
        /* ignore */
      }
    }

    const htmlKey = el.getAttribute("data-i18n-html");
    if (htmlKey) {
      const rawH = getByPath(bundle, htmlKey);
      if (rawH != null) el.innerHTML = interpolate(String(rawH), params);
    } else {
      const key = el.getAttribute("data-i18n");
      if (key) {
        const raw = getByPath(bundle, key);
        if (raw != null) {
          const s = interpolate(String(raw), params);
          if (/<\s*ruby\b/i.test(s)) el.innerHTML = s;
          else el.textContent = s;
        }
      }
    }
    const phKey = el.getAttribute("data-i18n-placeholder");
    if (phKey) {
      const v = getByPath(bundle, phKey);
      if (v != null) el.setAttribute("placeholder", String(v));
    }
    const tiKey = el.getAttribute("data-i18n-title");
    if (tiKey) {
      const v = getByPath(bundle, tiKey);
      if (v != null) el.setAttribute("title", String(v));
    }
    const arKey = el.getAttribute("data-i18n-aria-label");
    if (arKey) {
      const v = getByPath(bundle, arKey);
      if (v != null) el.setAttribute("aria-label", String(v));
    }
    const altKey = el.getAttribute("data-i18n-alt");
    if (altKey) {
      const v = getByPath(bundle, altKey);
      if (v != null) el.setAttribute("alt", String(v));
    }
  }

  function apply(root) {
    const bundle = currentBundle;
    if (!bundle) return;

    const rootEl = root && root.querySelectorAll ? root : document.body;
    const sel = "[data-i18n],[data-i18n-html],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria-label],[data-i18n-alt]";
    rootEl.querySelectorAll(sel).forEach((el) => applyToElement(el, bundle));

    const navLang = rootEl.querySelector?.(".fm-lang-switcher") || document.querySelector(".fm-lang-switcher");
    if (navLang) {
      const v = getByPath(bundle, "nav.language");
      if (v != null) navLang.setAttribute("aria-label", String(v));
    }
  }

  async function setLocale(locale, opts) {
    const lang = normalizeLocale(locale);
    const skipTransition = opts && opts.skipTransition;
    if (!skipTransition) transitionStart();
    try {
      currentBundle = await loadBundle(lang);
      currentLocale = lang;
      document.documentElement.setAttribute("data-i18n-locale", lang);
      apply(document);
      requestAnimationFrame(() => {
        apply(document.querySelector("main.content") || document);
      });
      window.dispatchEvent(
        new CustomEvent("fm-i18n-applied", { detail: { locale: currentLocale, bundle: currentBundle } }),
      );
    } catch (e) {
      console.error(e);
      if (lang !== "vi") {
        currentBundle = await loadBundle("vi");
        currentLocale = "vi";
        apply(document);
        window.dispatchEvent(
          new CustomEvent("fm-i18n-applied", { detail: { locale: currentLocale, bundle: currentBundle } }),
        );
      }
    } finally {
      if (!skipTransition) transitionEnd();
    }
  }

  function getLocale() {
    return currentLocale;
  }

  function readStoredLocale() {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  }

  async function init() {
    const initial = readStoredLocale();
    await setLocale(initial, { skipTransition: true });
  }

  window.addEventListener("fm-lang-change", (e) => {
    const lang = e.detail && e.detail.lang;
    if (!lang) return;
    setLocale(lang);
  });

  window.FmI18n = {
    SUPPORTED,
    init,
    setLocale,
    t,
    apply,
    getLocale,
    loadBundle,
    validation: (key, params) => t(`validation.${key}`, params),
  };

  // Khởi tạo do `lang-switcher.js` (mount topbar) gọi `FmI18n.init()` sau khi chèn UI ngôn ngữ,
  // để `apply()` thấy đủ DOM — tránh lệch nhãn (vd. toolbar) so với locale.
  // Trang không dùng lang-switcher: gọi `FmI18n.init()` trong script riêng (xem i18n-demo.html).
})(window);
