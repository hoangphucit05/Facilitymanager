package com.facilitymanager.service;

import com.facilitymanager.captcha.DichVuCaptchaRedis;
import com.facilitymanager.dto.PhanHoiDangNhap;
import com.facilitymanager.entity.QuyenMenuUngDung;
import com.facilitymanager.entity.NguoiDung;
import com.facilitymanager.repository.NguoiDungRepository;
import com.facilitymanager.security.DichVuPhienToken;
import com.facilitymanager.security.NoiDungPhien;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DichVuDangNhapUngDung {

    private final NguoiDungRepository userRepository;
    private final DichVuCaptchaRedis dichVuCaptchaRedis;
    private final DichVuKiemTraMatKhau dichVuKiemTraMatKhau;
    private final DichVuChuanHoaMaVaiTro dichVuChuanHoaMaVaiTro;
    private final DichVuPhienToken dichVuPhienToken;
    private final DichVuHieuLucVaiTro dichVuHieuLucVaiTro;

    public DichVuDangNhapUngDung(
            NguoiDungRepository userRepository,
            DichVuCaptchaRedis dichVuCaptchaRedis,
            DichVuKiemTraMatKhau dichVuKiemTraMatKhau,
            DichVuChuanHoaMaVaiTro dichVuChuanHoaMaVaiTro,
            DichVuPhienToken dichVuPhienToken,
            DichVuHieuLucVaiTro dichVuHieuLucVaiTro
    ) {
        this.userRepository = userRepository;
        this.dichVuCaptchaRedis = dichVuCaptchaRedis;
        this.dichVuKiemTraMatKhau = dichVuKiemTraMatKhau;
        this.dichVuChuanHoaMaVaiTro = dichVuChuanHoaMaVaiTro;
        this.dichVuPhienToken = dichVuPhienToken;
        this.dichVuHieuLucVaiTro = dichVuHieuLucVaiTro;
    }

    public PhanHoiDangNhap dangNhap(
            String username,
            String password,
            String captchaCode,
            String captchaId,
            boolean saveLogin
    ) {
        if (!dichVuCaptchaRedis.xacThucVaXoa(captchaId, captchaCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã xác thực (CAPTCHA) không đúng hoặc đã hết hạn.");
        }
        NguoiDung user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu."));
        if (!dichVuKiemTraMatKhau.khop(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu.");
        }
        if (user.getStatus() != null && !user.getStatus().equalsIgnoreCase("ACTIVE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản không hoạt động.");
        }

        String maVaiTro = dichVuChuanHoaMaVaiTro.chuanHoa(user.getRole());

        List<Long> roleIds = dichVuHieuLucVaiTro.layChuoiIdVaiTroTheoMa(maVaiTro);
        List<Long> permissionIds = new ArrayList<>();
        List<String> permissionTitles = new ArrayList<>();
        List<QuyenMenuUngDung> menus = dichVuHieuLucVaiTro.layDanhSachMenuHieuLucTheoMa(maVaiTro);
        for (QuyenMenuUngDung m : menus) {
            permissionIds.add(m.getId());
            if (m.getPermissionType() == 0 && m.getTitle() != null && !m.getTitle().isBlank()) {
                permissionTitles.add(m.getTitle().trim());
            }
        }
        List<String> uniqueTitles = permissionTitles.stream().distinct().sorted().collect(Collectors.toList());

        NoiDungPhien payload = new NoiDungPhien();
        payload.setUserId(user.getId());
        payload.setUsername(user.getUsername());
        payload.setFullName(user.getFullName());
        payload.setRoleCode(maVaiTro);
        payload.setRoleIds(roleIds);
        payload.setPermissionIds(permissionIds);
        payload.setPermissionTitles(uniqueTitles);
        payload.setSaveLogin(saveLogin);

        String token = dichVuPhienToken.phatHanhToken(payload);

        return new PhanHoiDangNhap(
                token,
                "Bearer",
                user.getUsername(),
                user.getFullName(),
                user.getId(),
                roleIds,
                permissionIds,
                List.of(maVaiTro),
                uniqueTitles
        );
    }

    public void dangXuat(String authorization) {
        dichVuPhienToken.thuHoi(authorization);
    }
}
