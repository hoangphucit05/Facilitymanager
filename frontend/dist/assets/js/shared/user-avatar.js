/**
 * Gán ảnh đại diện mặc định từ thư mục assets/images/avatar (50 file: avatar_1.jpg … avatar_50.jpg)
 * khi API không có avatar_url.
 */
(function userAvatarScope(window) {
  const COUNT = 50;

  /**
   * @param {object} u - bản ghi user (id, avatarUrl / avatar_url)
   * @returns {string} URL hiển thị (đường dẫn gốc site / nginx)
   */
  function resolve(u) {
    if (u && typeof u === "object") {
      const raw = u.avatarUrl != null && u.avatarUrl !== "" ? u.avatarUrl : u.avatar_url;
      if (raw != null && String(raw).trim() !== "") return String(raw).trim();
      const id = Number(u.id);
      if (Number.isFinite(id) && id >= 1) {
        const idx = ((Math.floor(id) - 1) % COUNT) + 1;
        return `/assets/images/avatar/avatar_${idx}.jpg`;
      }
    }
    return "/assets/images/avatar/avatar_1.jpg";
  }

  window.UserAvatar = { resolve, COUNT };
})(window);
