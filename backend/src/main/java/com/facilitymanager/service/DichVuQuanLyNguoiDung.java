package com.facilitymanager.service;

import com.facilitymanager.dto.NguoiDungPhanHoiDto;
import com.facilitymanager.entity.NguoiDung;
import com.facilitymanager.repository.NguoiDungRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class DichVuQuanLyNguoiDung {

    private final NguoiDungRepository userRepository;
    private final DichVuKiemTraMatKhau dichVuKiemTraMatKhau;

    public DichVuQuanLyNguoiDung(NguoiDungRepository userRepository, DichVuKiemTraMatKhau dichVuKiemTraMatKhau) {
        this.userRepository = userRepository;
        this.dichVuKiemTraMatKhau = dichVuKiemTraMatKhau;
    }

    @Transactional(readOnly = true)
    public List<NguoiDungPhanHoiDto> layDanhSach() {
        return userRepository.findAll().stream().map(this::chuyenSangDto).toList();
    }

    @Transactional(readOnly = true)
    public NguoiDungPhanHoiDto layTheoId(long id) {
        return chuyenSangDto(timTheoId(id));
    }

    @Transactional
    public NguoiDungPhanHoiDto tao(
            String username,
            String password,
            String fullName,
            String address,
            String phoneNumber,
            String role,
            String status,
            String avatarUrl
    ) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập không được để trống.");
        }
        String u = username.trim();
        if (userRepository.existsByUsername(u)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng.");
        }
        if (password == null || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ tên không được để trống.");
        }
        NguoiDung user = new NguoiDung();
        user.setUsername(u);
        user.setPasswordHash(dichVuKiemTraMatKhau.maHoa(password));
        user.setFullName(fullName.trim());
        user.setAddress(trimOrNull(address));
        user.setPhoneNumber(trimOrNull(phoneNumber));
        user.setRole(role != null && !role.isBlank() ? role.trim() : "STUDENT");
        user.setStatus(status != null && !status.isBlank() ? status.trim() : "ACTIVE");
        user.setAvatarUrl(trimOrNull(avatarUrl));
        return chuyenSangDto(userRepository.save(user));
    }

    @Transactional
    public NguoiDungPhanHoiDto capNhat(
            long id,
            String username,
            String password,
            String fullName,
            String address,
            String phoneNumber,
            String role,
            String status,
            String avatarUrl
    ) {
        NguoiDung user = timTheoId(id);
        if (username != null && !username.isBlank()) {
            String u = username.trim();
            if (!u.equals(user.getUsername()) && userRepository.existsByUsername(u)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng.");
            }
            user.setUsername(u);
        }
        if (password != null && !password.isBlank()) {
            if (password.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự.");
            }
            user.setPasswordHash(dichVuKiemTraMatKhau.maHoa(password));
        }
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (address != null) {
            user.setAddress(trimOrNull(address));
        }
        if (phoneNumber != null) {
            user.setPhoneNumber(trimOrNull(phoneNumber));
        }
        if (role != null && !role.isBlank()) {
            user.setRole(role.trim());
        }
        if (status != null && !status.isBlank()) {
            user.setStatus(status.trim());
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(trimOrNull(avatarUrl));
        }
        return chuyenSangDto(userRepository.save(user));
    }

    @Transactional
    public NguoiDungPhanHoiDto capNhatMotPhan(long id, Map<String, Object> patch) {
        NguoiDung user = timTheoId(id);
        if (patch.containsKey("status")) {
            Object v = patch.get("status");
            if (v != null && !String.valueOf(v).isBlank()) {
                user.setStatus(String.valueOf(v).trim());
            }
        }
        if (patch.containsKey("active")) {
            Object v = patch.get("active");
            boolean on = v instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(v));
            user.setStatus(on ? "ACTIVE" : "INACTIVE");
        }
        if (patch.containsKey("role") && patch.get("role") != null) {
            user.setRole(String.valueOf(patch.get("role")).trim());
        }
        return chuyenSangDto(userRepository.save(user));
    }

    @Transactional
    public void xoa(long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user.");
        }
        userRepository.deleteById(id);
    }

    private NguoiDung timTheoId(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user."));
    }

    private NguoiDungPhanHoiDto chuyenSangDto(NguoiDung user) {
        return new NguoiDungPhanHoiDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getAddress(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getStatus(),
                user.getAvatarUrl()
        );
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String s = value.trim();
        return s.isEmpty() ? null : s;
    }
}
