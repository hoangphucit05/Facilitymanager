/**
 * Chuyển ngôn ngữ UI (vi / en / ja) + ẩn hiện furigana khi chọn tiếng Nhật.
 * Gắn vào mọi .topbar có .topbar-right; lưu localStorage; bắn sự kiện fm-lang-change.
 */
(function langSwitcherScope() {
  const KEY_LANG = "fm_ui_lang";
  const KEY_FURIGANA = "fm_ui_furigana";

  function flagSvgEn(clipId) {
    return `<svg class="fm-lang-flag" viewBox="0 0 60 30" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><clipPath id="${clipId}"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path fill="#012169" d="M0,0v30h60V0z"/><path stroke="#fff" stroke-width="6" d="M0,0l60,30M60,0L0,30"/><path stroke="#C8102E" stroke-width="4" clip-path="url(#${clipId})" d="M0,0l60,30M60,0L0,30"/><path stroke="#fff" stroke-width="10" d="M30,0v30M0,15h60"/><path stroke="#C8102E" stroke-width="6" d="M30,0v30M0,15h60"/></svg>`;
  }

  function templateHtml(clipId) {
    const FLAG_VI = `<svg class="fm-lang-flag" viewBox="0 0 30 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#da251d"/><path fill="#ff0" d="M15 4l1.2 3.7h3.9l-3.1 2.3 1.2 3.7-3.2-2.3-3.2 2.3 1.2-3.7-3.1-2.3h3.9z"/></svg>`;
    const FLAG_JA = `<svg class="fm-lang-flag" viewBox="0 0 30 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/></svg>`;
    return `
<div class="fm-lang-switcher" role="group" aria-label="Chọn ngôn ngữ">
  <div class="fm-lang-flag-row">
    <button type="button" class="fm-lang-btn" data-lang="vi" title="Tiếng Việt" aria-label="Tiếng Việt" aria-pressed="false">${FLAG_VI}</button>
    <button type="button" class="fm-lang-btn" data-lang="en" title="English" aria-label="English" aria-pressed="false">${flagSvgEn(clipId)}</button>
    <button type="button" class="fm-lang-btn" data-lang="ja" title="日本語" aria-label="日本語" aria-pressed="false">${FLAG_JA}</button>
  </div>
  <label class="fm-furigana-wrap" hidden>
    <input type="checkbox" class="fm-furigana-input" />
    <span class="fm-furigana-label">hiện furigana</span>
  </label>
</div>`;
  }

  function readLang() {
    const v = String(localStorage.getItem(KEY_LANG) || "vi").toLowerCase();
    if (v === "en" || v === "ja" || v === "vi") return v;
    return "vi";
  }

  /** Chỉ khi người dùng bật (tick); mặc định ẩn furigana. */
  function readFurigana() {
    return localStorage.getItem(KEY_FURIGANA) === "1";
  }

  function applyRoot(lang, furiganaOn) {
    const root = document.documentElement;
    root.setAttribute("data-fm-lang", lang);
    root.setAttribute("data-fm-furigana", furiganaOn ? "1" : "0");
    root.lang = lang === "vi" ? "vi" : lang === "ja" ? "ja" : "en";
  }

  function dispatch(lang, furiganaOn) {
    window.dispatchEvent(new CustomEvent("fm-lang-change", { detail: { lang, furiganaOn } }));
  }

  function furiganaLabelText(furiganaOn) {
    if (window.FmI18n && typeof window.FmI18n.t === "function") {
      const s = furiganaOn ? window.FmI18n.t("nav.furiganaHide") : window.FmI18n.t("nav.furiganaShow");
      if (s && !String(s).startsWith("nav.")) return s;
    }
    return furiganaOn ? "ẩn furigana" : "hiện furigana";
  }

  function syncAllSwitchers(lang, furiganaOn) {
    document.querySelectorAll(".fm-lang-switcher").forEach((rootEl) => {
      rootEl.querySelectorAll('.fm-lang-btn[data-lang]').forEach((btn) => {
        const l = btn.getAttribute("data-lang");
        btn.classList.toggle("is-active", l === lang);
        btn.setAttribute("aria-pressed", l === lang ? "true" : "false");
      });
      const furWrap = rootEl.querySelector(".fm-furigana-wrap");
      const furInput = rootEl.querySelector(".fm-furigana-input");
      const furLabel = rootEl.querySelector(".fm-furigana-label");
      if (furWrap) {
        furWrap.hidden = lang !== "ja";
        furWrap.style.display = lang === "ja" ? "flex" : "none";
      }
      if (furInput) furInput.checked = furiganaOn;
      if (furLabel) furLabel.textContent = furiganaLabelText(furiganaOn);
    });
  }

  function applyFromStorage() {
    const lang = readLang();
    const furiganaOn = readFurigana();
    applyRoot(lang, furiganaOn);
    syncAllSwitchers(lang, furiganaOn);
    if (window.FmI18n && typeof window.FmI18n.getLocale === "function" && window.FmI18n.getLocale() === lang) {
      return;
    }
    dispatch(lang, furiganaOn);
  }

  function wireGlobalListenersOnce() {
    if (window.__fmLangWired) return;
    window.__fmLangWired = true;

    window.addEventListener("fm-i18n-applied", () => {
      const lang = readLang();
      const fur = readFurigana();
      syncAllSwitchers(lang, fur);
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".fm-lang-btn[data-lang]");
      if (!btn || !btn.closest(".fm-lang-switcher")) return;
      const next = btn.getAttribute("data-lang");
      if (!next || next === readLang()) return;
      localStorage.setItem(KEY_LANG, next);
      applyFromStorage();
    });

    document.addEventListener("change", (e) => {
      const inp = e.target.closest(".fm-furigana-input");
      if (!inp) return;
      localStorage.setItem(KEY_FURIGANA, inp.checked ? "1" : "0");
      applyFromStorage();
    });
  }

  function mountIntoTopbars() {
    wireGlobalListenersOnce();
    void (async () => {
      document.querySelectorAll(".topbar").forEach((top) => {
        const right = top.querySelector(".topbar-right");
        const host = right || top;
        if (host.querySelector(".fm-lang-switcher")) return;
        const clipId = "fmUk_" + Math.random().toString(36).slice(2, 9);
        host.insertAdjacentHTML("afterbegin", templateHtml(clipId));
      });
      if (window.FmI18n && typeof window.FmI18n.init === "function") {
        try {
          await window.FmI18n.init();
        } catch (e) {
          console.warn("FmI18n.init", e);
        }
      }
      applyFromStorage();
    })();
  }

  window.FmLang = {
    getLang: readLang,
    getFurigana: readFurigana,
    refresh: applyFromStorage,
    mount: mountIntoTopbars,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIntoTopbars);
  } else {
    mountIntoTopbars();
  }
})();
