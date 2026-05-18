package com.facilitymanager.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class DichVuKiemTraMatKhau {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public boolean khop(String matKhauNhap, String luuTrongDb) {
        if (luuTrongDb == null || luuTrongDb.isEmpty()) {
            return false;
        }
        String s = luuTrongDb.trim();
        if (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")) {
            return encoder.matches(matKhauNhap, s);
        }
        return s.equals(matKhauNhap);
    }

    public String maHoa(String matKhauRaw) {
        return encoder.encode(matKhauRaw);
    }
}
