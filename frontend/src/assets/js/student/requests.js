(function initStudentRequests(window) {
  const DRAFT_KEY = "student.requests.drafts";
  const SENT_KEY = "student.requests.sent";

  /** Đường dẫn tương đối đúng cả khi Live Server mở gốc = thư mục `frontend` (không dùng `/frontend/...`). */
  function hrefFromFrontendRoot(relativePath) {
    const rel = String(relativePath || "").replace(/^\/+/, "");
    const fn = window.AppSidebar?.hrefToFrontendPage;
    if (typeof fn === "function") return fn(rel);
    const d = window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
    const prefix = d ? "../".repeat(d) : "";
    return prefix + rel;
  }

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function tMsg(key, fallback) {
    const v = window.FmI18n?.t?.(key);
    return v != null && v !== key ? v : fallback;
  }

  function dateLocaleTag() {
    const loc = window.FmI18n?.getLocale?.();
    if (loc === "ja") return "ja-JP";
    if (loc === "vi") return "vi-VN";
    return "en-US";
  }

  const readList = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  };

  const writeList = (key, list) => {
    localStorage.setItem(key, JSON.stringify(list));
  };

  const goBackOrHome = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = hrefFromFrontendRoot("index.html");
  };

  const buildPayload = (attachment) => {
    const title = String(document.getElementById("studentRequestTitle")?.value || "").trim();
    const note = String(document.getElementById("studentRequestNote")?.value || "").trim();
    const managerGroup = String(document.getElementById("studentManagerGroup")?.value || "").trim();
    const status = String(document.getElementById("studentStatus")?.value || "").trim();
    const managerName = String(document.getElementById("studentManagerName")?.value || "").trim();
    return {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      note,
      managerGroup,
      status,
      managerName,
      attachment: attachment || null,
      createdAt: new Date().toISOString(),
    };
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  const initBackButton = () => {
    const backBtn = document.getElementById("studentBackBtn");
    backBtn?.addEventListener("click", goBackOrHome);
  };

  const initCreatePage = () => {
    const saveBtn = document.getElementById("studentSaveDraftBtn");
    const sendBtn = document.getElementById("studentSendNowBtn");
    const noteField = document.getElementById("studentRequestNote");
    const noteCount = document.getElementById("studentNoteCount");
    const attachmentInput = document.getElementById("studentAttachmentInput");
    const uploadPlaceholder = document.getElementById("studentUploadPlaceholder");
    const uploadPreviewImage = document.getElementById("studentUploadPreviewImage");
    const uploadFileName = document.getElementById("studentUploadFileName");
    let currentAttachment = null;

    if (noteField && noteCount) {
      const syncCount = () => {
        const k = "studentRequests.create.noteCounter";
        const v = window.FmI18n?.t?.(k, { n: noteField.value.length });
        noteCount.textContent = v != null && v !== k ? v : `${noteField.value.length}/250`;
      };
      noteField.addEventListener("input", syncCount);
      syncCount();
    }

    attachmentInput?.addEventListener("change", () => {
      const file = attachmentInput.files?.[0];
      if (!file) return;

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = () => {
        currentAttachment = {
          kind: isImage ? "image" : isVideo ? "video" : "file",
          name: file.name,
          dataUrl: typeof reader.result === "string" ? reader.result : "",
        };

        if (uploadPlaceholder) uploadPlaceholder.hidden = true;
        if (uploadFileName) {
          const k = "studentRequests.create.filePicked";
          const v = window.FmI18n?.t?.(k, { name: file.name });
          uploadFileName.textContent = v != null && v !== k ? v : `Đã chọn: ${file.name}`;
          uploadFileName.hidden = false;
        }
        if (uploadPreviewImage) {
          if (isImage && currentAttachment.dataUrl) {
            uploadPreviewImage.src = currentAttachment.dataUrl;
            uploadPreviewImage.hidden = false;
          } else {
            uploadPreviewImage.hidden = true;
          }
        }
      };
      reader.readAsDataURL(file);
    });

    saveBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title && !payload.note) {
        window.alert(tMsg("studentRequests.alerts.draftNeedContent", "Nhập tiêu đề hoặc ghi chú trước khi lưu tạm."));
        return;
      }
      const drafts = readList(DRAFT_KEY);
      drafts.unshift(payload);
      writeList(DRAFT_KEY, drafts);
      goTo(hrefFromFrontendRoot("pages/student/request-drafts.html"));
    });

    sendBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title || !payload.note) {
        window.alert(tMsg("studentRequests.alerts.sendNeedTitleNote", "Vui lòng nhập tiêu đề và ghi chú trước khi gửi."));
        return;
      }
      const sent = readList(SENT_KEY);
      sent.unshift(payload);
      writeList(SENT_KEY, sent);
      goBackOrHome();
    });
  };

  const renderList = (listId, key) => {
    const listEl = document.getElementById(listId);
    const emptyEl = document.getElementById("studentEmptyState");
    if (!listEl || !emptyEl) return;

    const list = readList(key);
    if (list.length === 0) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      window.FmI18n?.apply?.(emptyEl);
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    const loc = dateLocaleTag();
    const mg = tMsg("studentRequests.list.managerGroup", "Nhóm quản lý");
    const st = tMsg("studentRequests.list.status", "Trạng thái");
    const tm = tMsg("studentRequests.list.time", "Thời gian");
    const noTitleRaw = window.FmI18n?.t?.("studentRequests.list.noTitle");
    const noTitle = noTitleRaw != null && noTitleRaw !== "studentRequests.list.noTitle" ? noTitleRaw : "(Không tiêu đề)";

    listEl.innerHTML = list
      .map((item) => {
        const time = new Date(item.createdAt).toLocaleString(loc);
        const userTitle = String(item.title || "").trim();
        const titleHtml = userTitle ? escAttr(userTitle) : noTitle;
        return `<article class="student-card">
          <h3 class="student-item-title">${titleHtml}</h3>
          <p class="student-item-meta">${escAttr(mg)}: ${escAttr(item.managerGroup || "-")}</p>
          <p class="student-item-meta">${escAttr(st)}: ${escAttr(item.status || "-")}</p>
          <p class="student-item-meta">${escAttr(tm)}: ${escAttr(time)}</p>
          <p>${escAttr(item.note || "")}</p>
        </article>`;
      })
      .join("");

    window.FmI18n?.apply?.(listEl);
  };

  const page = document.body.getAttribute("data-student-page");
  if (page === "create-request") {
    initBackButton();
    initCreatePage();
  }
  if (page === "sent-requests") {
    initBackButton();
    renderList("studentRequestList", SENT_KEY);
  }
  if (page === "draft-requests") {
    initBackButton();
    renderList("studentRequestList", DRAFT_KEY);
  }

  window.addEventListener("fm-i18n-applied", () => {
    if (page === "sent-requests") renderList("studentRequestList", SENT_KEY);
    if (page === "draft-requests") renderList("studentRequestList", DRAFT_KEY);
    if (page === "create-request") {
      const noteField = document.getElementById("studentRequestNote");
      const noteCount = document.getElementById("studentNoteCount");
      if (noteField && noteCount) {
        const k = "studentRequests.create.noteCounter";
        const v = window.FmI18n?.t?.(k, { n: noteField.value.length });
        noteCount.textContent = v != null && v !== k ? v : `${noteField.value.length}/250`;
      }
    }
  });
})(window);
