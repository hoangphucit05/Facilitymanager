package com.facilitymanager.service;

import com.facilitymanager.entity.QuyenMenuUngDung;
import com.facilitymanager.repository.QuyenMenuUngDungRepository;
import com.facilitymanager.vo.VoMenu;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DichVuBangMenuVaiTro {

    private static final int LOAI_NAV = -1;

    private final QuyenMenuUngDungRepository quyenMenuUngDungRepository;
    private final DichVuHieuLucVaiTro dichVuHieuLucVaiTro;

    public DichVuBangMenuVaiTro(
            QuyenMenuUngDungRepository quyenMenuUngDungRepository,
            DichVuHieuLucVaiTro dichVuHieuLucVaiTro
    ) {
        this.quyenMenuUngDungRepository = quyenMenuUngDungRepository;
        this.dichVuHieuLucVaiTro = dichVuHieuLucVaiTro;
    }

    @Transactional(readOnly = true)
    public List<VoMenu> layCayMenuChoMaVaiTro(String maVaiTroChuanHoa) {
        Set<Long> duocPhep = dichVuHieuLucVaiTro.layTapIdMenuHieuLucTheoMa(maVaiTroChuanHoa);
        if (duocPhep.isEmpty()) {
            return List.of();
        }
        List<QuyenMenuUngDung> tatCa = quyenMenuUngDungRepository.findAllCoCha();
        Map<Long, QuyenMenuUngDung> theoId = tatCa.stream().collect(Collectors.toMap(QuyenMenuUngDung::getId, m -> m));

        Set<Long> giu = new HashSet<>();
        for (Long mid : duocPhep) {
            Long cur = mid;
            while (cur != null) {
                giu.add(cur);
                QuyenMenuUngDung m = theoId.get(cur);
                if (m == null) {
                    break;
                }
                cur = m.getParentIdOrNull();
            }
        }

        List<QuyenMenuUngDung> loc = tatCa.stream().filter(m -> giu.contains(m.getId())).collect(Collectors.toList());
        return xayCay(loc);
    }

    @Transactional(readOnly = true)
    public List<VoMenu> layCayMenuDayDu() {
        return xayCay(quyenMenuUngDungRepository.findAllCoCha());
    }

    private List<VoMenu> xayCay(List<QuyenMenuUngDung> nodes) {
        if (nodes.isEmpty()) {
            return List.of();
        }
        Map<Long, VoMenu> voMap = new HashMap<>();
        for (QuyenMenuUngDung m : nodes) {
            VoMenu v = new VoMenu();
            v.setId(m.getId());
            v.setParentId(m.getParentIdOrNull());
            v.setTitle(m.getTitle());
            v.setName(m.getMenuName());
            v.setPath(m.getPath());
            v.setPermissionType(m.getPermissionType());
            v.setSortOrder(m.getSortOrder());
            v.setLevel(0);
            v.setStatus(0);
            voMap.put(m.getId(), v);
        }
        List<VoMenu> roots = new ArrayList<>();
        for (VoMenu v : voMap.values()) {
            if (v.getParentId() == null) {
                roots.add(v);
            } else {
                VoMenu p = voMap.get(v.getParentId());
                if (p != null) {
                    p.getChildren().add(v);
                } else {
                    roots.add(v);
                }
            }
        }
        sapXepDeQuy(roots);
        if (roots.size() == 1 && Objects.equals(roots.get(0).getPermissionType(), LOAI_NAV)) {
            return roots;
        }
        VoMenu wrap = new VoMenu();
        wrap.setId(0L);
        wrap.setTitle("Menu");
        wrap.setName("root_nav");
        wrap.setPermissionType(LOAI_NAV);
        wrap.setSortOrder(0);
        wrap.setChildren(new ArrayList<>(roots));
        return List.of(wrap);
    }

    private void sapXepDeQuy(List<VoMenu> list) {
        list.sort(Comparator.comparingInt(a -> a.getSortOrder() != null ? a.getSortOrder() : 0));
        for (VoMenu v : list) {
            if (!v.getChildren().isEmpty()) {
                sapXepDeQuy(v.getChildren());
            }
        }
    }
}
