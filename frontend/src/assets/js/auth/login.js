/**
 * Đăng nhập: validate, CAPTCHA, POST /api/auth/login.
 */
$(function onLoginPageReady() {
  const $form = $("#loginForm");
  const $usernameErr = $("#usernameErr");
  const $passwordErr = $("#passwordErr");
  const $captchaErr = $("#captchaErr");
  const $formErr = $("#loginFormError");

  function clearErrors() {
    $usernameErr.hide().text("");
    $passwordErr.hide().text("");
    $captchaErr.hide().text("");
    $formErr.hide().text("");
  }

  function showFieldError($el, msg) {
    $el.text(msg).show();
  }

  function isCaptchaMessage(msg) {
    if (!msg) return false;
    const m = String(msg).toLowerCase();
    return m.includes("mã xác thực") || m.includes("captcha");
  }

  $(".eye").on("click", function handleEyeClick() {
    const $pwd = $("#password");
    const next = $pwd.attr("type") === "password" ? "text" : "password";
    $pwd.attr("type", next);
    $(this).toggleClass("fa-eye fa-eye-slash");
  });

  $("#username").on("input", () => $usernameErr.hide().text(""));
  $("#password").on("input", () => $passwordErr.hide().text(""));
  $("#imgCode").on("input", () => $captchaErr.hide().text(""));

  $("#captchaImg").on("click", async function handleCaptchaClick() {
    try {
      await window.AppAuth.refreshCaptcha();
      $("#imgCode").val("");
      clearErrors();
    } catch (e) {
      showFieldError($captchaErr, "Không tải được captcha (kiểm tra backend).");
    }
  });

  void (async function initCaptcha() {
    try {
      await window.AppAuth.refreshCaptcha();
    } catch {
      showFieldError($captchaErr, "Không tải được captcha (kiểm tra backend).");
    }
  })();

  $form.on("submit", async function handleLoginSubmit(event) {
    event.preventDefault();
    clearErrors();

    const username = ($("#username").val() || "").trim();
    const password = ($("#password").val() || "").trim();
    const imgCode = ($("#imgCode").val() || "").trim();
    const captchaId = window.AppAuth.getCaptchaId();
    const saveLogin = $("#saveLogin").is(":checked");

    let hasErr = false;
    if (!username) {
      showFieldError($usernameErr, "Vui lòng nhập tên đăng nhập.");
      hasErr = true;
    }
    if (!password) {
      showFieldError($passwordErr, "Vui lòng nhập mật khẩu.");
      hasErr = true;
    }
    if (hasErr) return;

    if (!imgCode) {
      showFieldError($captchaErr, "Vui lòng nhập mã xác thực.");
      return;
    }
    if (!captchaId) {
      showFieldError($captchaErr, "Chưa có mã captcha. Nhấp vào ảnh mã để tải lại.");
      return;
    }

    try {
      const result = await window.AppAuth.loginRemote(username, password, imgCode, captchaId, saveLogin);
      if (!result.ok) {
        const msg = result.message || "Đăng nhập thất bại.";
        if (isCaptchaMessage(msg)) {
          showFieldError($captchaErr, msg);
        } else {
          showFieldError($passwordErr, msg);
        }
        try {
          await window.AppAuth.refreshCaptcha();
          $("#imgCode").val("");
        } catch {
          /* ignore */
        }
        return;
      }
      window.location.href = window.AppAuth.getDefaultHomeByRole();
    } catch (e) {
      $formErr.text("Không kết nối được máy chủ (kiểm tra backend và cổng 8080).").show();
      try {
        await window.AppAuth.refreshCaptcha();
        $("#imgCode").val("");
      } catch {
        /* ignore */
      }
    }
  });
});
