package com.facilitymanager.service;

import com.facilitymanager.entity.QuyenMenuUngDung;
import com.facilitymanager.entity.VaiTroUngDung;
import com.facilitymanager.repository.QuyenMenuUngDungRepository;
import com.facilitymanager.repository.VaiTroUngDungRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * RBAC1: hợp menu hiệu lực = menu gán trực tiếp trên role + menu của các role cha (theo {@code parent_role_id}).
 */
@Service
public class DichVuHieuLucVaiTro {

    private final VaiTroUngDungRepository vaiTroUngDungRepository;
    private final QuyenMenuUngDungRepository quyenMenuUngDungRepository;

    public DichVuHieuLucVaiTro(
            VaiTroUngDungRepository vaiTroUngDungRepository,
            QuyenMenuUngDungRepository quyenMenuUngDungRepository
    ) {
        this.vaiTroUngDungRepository = vaiTroUngDungRepository;
        this.quyenMenuUngDungRepository = quyenMenuUngDungRepository;
    }

    @Transactional(readOnly = true)
    public LinkedHashSet<Long> layTapIdMenuHieuLucTheoMa(String maVaiTroChuanHoa) {
        Optional<VaiTroUngDung> root = vaiTroUngDungRepository.timTheoMaKemMenu(maVaiTroChuanHoa);
        return root.map(this::layTapIdMenuHieuLuc).orElseGet(LinkedHashSet::new);
    }

    @Transactional(readOnly = true)
    public LinkedHashSet<Long> layTapIdMenuHieuLuc(VaiTroUngDung goc) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        Long curId = goc.getId();
        Set<Long> daQuaRole = new LinkedHashSet<>();
        while (curId != null && daQuaRole.add(curId)) {
            VaiTroUngDung cap = vaiTroUngDungRepository.timTheoIdKemMenu(curId).orElse(null);
            if (cap == null) {
                break;
            }
            for (QuyenMenuUngDung m : cap.getMenus()) {
                ids.add(m.getId());
            }
            if (cap.getParentRole() == null) {
                break;
            }
            curId = cap.getParentRole().getId();
        }
        return ids;
    }

    @Transactional(readOnly = true)
    public List<QuyenMenuUngDung> layDanhSachMenuHieuLucTheoMa(String maVaiTroChuanHoa) {
        LinkedHashSet<Long> ids = layTapIdMenuHieuLucTheoMa(maVaiTroChuanHoa);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<QuyenMenuUngDung> list = new ArrayList<>(quyenMenuUngDungRepository.findAllById(ids));
        list.sort(Comparator.comparingInt(QuyenMenuUngDung::getSortOrder));
        return list;
    }

    /** Chuỗi id vai trò từ role hiện tại lên các cha (phục vụ phiên đăng nhập). */
    @Transactional(readOnly = true)
    public List<Long> layChuoiIdVaiTroTheoMa(String maVaiTroChuanHoa) {
        List<Long> out = new ArrayList<>();
        Optional<VaiTroUngDung> first = vaiTroUngDungRepository.timTheoMaKemMenu(maVaiTroChuanHoa);
        if (first.isEmpty()) {
            return out;
        }
        Long curId = first.get().getId();
        Set<Long> seen = new HashSet<>();
        while (curId != null && seen.add(curId)) {
            out.add(curId);
            Optional<VaiTroUngDung> cap = vaiTroUngDungRepository.timTheoIdKemMenu(curId);
            if (cap.isEmpty()) {
                break;
            }
            if (cap.get().getParentRole() == null) {
                break;
            }
            curId = cap.get().getParentRole().getId();
        }
        return out;
    }
}
