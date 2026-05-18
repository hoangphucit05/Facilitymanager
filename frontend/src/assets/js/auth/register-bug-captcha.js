/**
 * Captcha 3×3: một ảnh trong thư mục bug/ cắt 9 ô bằng background-position.
 * Thử lại / làm mới: chọn ngẫu nhiên ảnh khác (nếu có từ 2 file trở lên).
 * VERIFY / skip luôn thất bại — không đăng ký.
 */
(function registBugCaptchaScope(window, document) {
  const BASE = "../../assets/images/bug/";
  /**
   * Mỗi file là một ảnh tổng hợp 3×3 (một ô = 1/9 ảnh), hiển thị bằng background-position.
   * Đặt trong thư mục bug/: bug1.png … bug10.png (đổi đuôi dưới nếu cần — phải trùng tên file).
   */
  const TILE_EXT = ".png";
  const TILESETS = Array.from({ length: 10 }, (_, i) => `bug${i + 1}${TILE_EXT}`);

  let currentTilesetUrl = "";

  function allTilesetUrls() {
    return TILESETS.map((name) => `${BASE}${name}`);
  }

  /** excludeUrl: không chọn lại đúng URL này (dùng khi retry/refresh). */
  function pickRandomTileset(excludeUrl) {
    const all = allTilesetUrls();
    if (all.length === 1) {
      [currentTilesetUrl] = all;
      return;
    }
    const pool = excludeUrl ? all.filter((u) => u !== excludeUrl) : all;
    const choices = pool.length ? pool : all;
    currentTilesetUrl = choices[Math.floor(Math.random() * choices.length)];
  }

  const FAIL_MESSAGES = [
    "Bỏ sót 2 bug, chọn nhầm 1 ô sạch.",
    "Bỏ sót bug hoặc chọn nhầm ô.",
    "Không khớp mẫu. Thử lại.",
    "Xác minh không thành công.",
  ];

  function randomFailMessage() {
    return FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
  }

  function setFailText() {
    const el = document.getElementById("bugCaptchaFailReason");
    if (el) el.textContent = randomFailMessage();
  }

  function loadGrid() {
    const grid = document.getElementById("bugCaptchaGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!currentTilesetUrl) pickRandomTileset(null);
    const url = `url("${currentTilesetUrl}")`;

    for (let i = 0; i < 9; i += 1) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const div = document.createElement("div");
      div.className = "bug-captcha-item";
      div.dataset.tileIndex = String(i);

      const bg = document.createElement("div");
      bg.className = "bug-captcha-tile-bg";
      bg.style.backgroundImage = url;
      bg.style.backgroundSize = "300% 300%";
      bg.style.backgroundPosition = `${col * 50}% ${row * 50}%`;

      const check = document.createElement("div");
      check.className = "bug-captcha-check";
      check.textContent = "✔";

      div.appendChild(bg);
      div.appendChild(check);
      div.addEventListener("click", () => {
        div.classList.toggle("is-selected");
      });
      grid.appendChild(div);
    }
  }

  function clearSelection() {
    document.querySelectorAll("#bugCaptchaGrid .bug-captcha-item.is-selected").forEach((el) => {
      el.classList.remove("is-selected");
    });
  }

  function showPanel(which) {
    const captchaPanel = document.getElementById("bugCaptchaPanel");
    const resultPanel = document.getElementById("bugCaptchaResultPanel");
    if (!captchaPanel || !resultPanel) return;
    if (which === "captcha") {
      captchaPanel.classList.remove("is-hidden");
      resultPanel.classList.remove("is-visible");
    } else {
      captchaPanel.classList.add("is-hidden");
      resultPanel.classList.add("is-visible");
    }
  }

  function goFail() {
    setFailText();
    showPanel("result");
  }

  function open() {
    const overlay = document.getElementById("bugCaptchaOverlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    showPanel("captcha");
    clearSelection();
    pickRandomTileset(null);
    loadGrid();
  }

  function close() {
    const overlay = document.getElementById("bugCaptchaOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function wire() {
    const overlay = document.getElementById("bugCaptchaOverlay");
    const verifyBtn = document.getElementById("bugCaptchaVerify");
    const retryBtn = document.getElementById("bugCaptchaRetry");
    const refreshBtn = document.getElementById("bugCaptchaRefresh");
    const skipBtn = document.getElementById("bugCaptchaSkip");
    const audioBtn = document.getElementById("bugCaptchaAudio");
    const infoBtn = document.getElementById("bugCaptchaInfo");

    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    verifyBtn?.addEventListener("click", goFail);
    skipBtn?.addEventListener("click", goFail);

    refreshBtn?.addEventListener("click", () => {
      clearSelection();
      pickRandomTileset(currentTilesetUrl);
      loadGrid();
    });

    audioBtn?.addEventListener("click", () => {
      window.alert("Captcha âm thanh không khả dụng.");
    });

    infoBtn?.addEventListener("click", () => {
      window.alert("Captcha minh họa — chọn ô theo ý bạn rồi VERIFY.");
    });

    retryBtn?.addEventListener("click", () => {
      showPanel("captcha");
      clearSelection();
      pickRandomTileset(currentTilesetUrl);
      loadGrid();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.BugCaptchaRegist = { open, close };
})(window, document);
