package com.facilitymanager.service;

import com.facilitymanager.captcha.DichVuCaptchaRedis;
import com.facilitymanager.entity.NguoiDung;
import com.facilitymanager.repository.NguoiDungRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Đăng ký tài khoản công khai (role mặc định = STUDENT) — bảo vệ bằng CAPTCHA Redis.
 */
@Service
public class DichVuDangKyUngDung {

    private final NguoiDungRepository userRepository;
    private final DichVuCaptchaRedis dichVuCaptchaRedis;
    private final DichVuKiemTraMatKhau dichVuKiemTraMatKhau;

    public DichVuDangKyUngDung(
            NguoiDungRepository userRepository,
            DichVuCaptchaRedis dichVuCaptchaRedis,
            DichVuKiemTraMatKhau dichVuKiemTraMatKhau
    ) {
        this.userRepository = userRepository;
        this.dichVuCaptchaRedis = dichVuCaptchaRedis;
        this.dichVuKiemTraMatKhau = dichVuKiemTraMatKhau;
    }

    @Transactional
    public void dangKy(String username, String password, String fullName, String captchaCode, String captchaId) {
        if (!dichVuCaptchaRedis.xacThucVaXoa(captchaId, captchaCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã xác thực (CAPTCHA) không đúng hoặc đã hết hạn.");
        }
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập không được để trống.");
        }
        if (password == null || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ tên không được để trống.");
        }
        String u = username.trim();
        if (userRepository.existsByUsername(u)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng.");
        }
        NguoiDung user = new NguoiDung();
        user.setUsername(u);
        user.setPasswordHash(dichVuKiemTraMatKhau.maHoa(password));
        user.setFullName(fullName.trim());
        user.setRole("STUDENT");
        user.setStatus("ACTIVE");
        userRepository.save(user);
    }
}
