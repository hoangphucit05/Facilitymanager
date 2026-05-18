$(function onRegistPageReady() {
  const $form = $("#registForm");
  const $usernameErr = $("#usernameErr");
  const $nicknameErr = $("#nicknameErr");
  const $passwordErr = $("#passwordErr");
  const $formErr = $("#registFormError");

  function clearErrors() {
    $usernameErr.hide().text("");
    $nicknameErr.hide().text("");
    $passwordErr.hide().text("");
    $formErr.hide().text("");
  }

  function showFieldError($el, msg) {
    $el.text(msg).show();
  }

  $(".eye").on("click", function handleEyeClick() {
    const $pwd = $("#password");
    const next = $pwd.attr("type") === "password" ? "text" : "password";
    $pwd.attr("type", next);
    $(this).toggleClass("fa-eye fa-eye-slash");
  });

  $("#username").on("input", () => $usernameErr.hide().text(""));
  $("#nickname").on("input", () => $nicknameErr.hide().text(""));
  $("#password").on("input", () => $passwordErr.hide().text(""));

  $form.on("submit", function handleRegistSubmit(event) {
    event.preventDefault();
    clearErrors();

    const username = ($("#username").val() || "").trim();
    const nickname = ($("#nickname").val() || "").trim();
    const password = $("#password").val() || "";

    let stop = false;
    if (!username) {
      showFieldError($usernameErr, "Vui lòng nhập tên đăng nhập.");
      stop = true;
    }
    if (!nickname) {
      showFieldError($nicknameErr, "Vui lòng nhập họ và tên.");
      stop = true;
    }
    if (!password) {
      showFieldError($passwordErr, "Vui lòng nhập mật khẩu.");
      stop = true;
    } else if (password.length < 6) {
      showFieldError($passwordErr, "Mật khẩu phải có ít nhất 6 ký tự.");
      stop = true;
    }
    if (stop) return;

    /* Không gọi API — chỉ mở captcha ảnh (luôn thất bại). */
    if (window.BugCaptchaRegist && typeof window.BugCaptchaRegist.open === "function") {
      window.BugCaptchaRegist.open();
      const ov = document.getElementById("bugCaptchaOverlay");
      if (ov) ov.setAttribute("aria-hidden", "false");
    } else {
      $formErr.text("Không tải được captcha (thiếu script).").show();
    }
  });
});
