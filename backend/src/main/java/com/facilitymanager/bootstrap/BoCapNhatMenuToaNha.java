package com.facilitymanager.bootstrap;

import com.facilitymanager.entity.QuyenMenuUngDung;
import com.facilitymanager.entity.VaiTroUngDung;
import com.facilitymanager.repository.QuyenMenuUngDungRepository;
import com.facilitymanager.repository.VaiTroUngDungRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Menu tòa nhà: một mục cấp 1 {@code nav_building} — «Tòa nhà» — và các tòa con (E1, E3, …).
 * Gộp cấp «Tòa nhà & phòng» + «Tòa nhà» lồng nhau nếu DB còn bản cũ.
 */
@Component
@Order(21)
public class BoCapNhatMenuToaNha implements ApplicationRunner {

    private static final int NAV = -1;
    private static final int PAGE = 0;

    static final String[][] TOA = {
            {"page_building_e1", "Tòa nhà E1", "E1"},
            {"page_building_e3", "Tòa nhà E3", "E3"},
            {"page_building_e4", "Tòa nhà E4", "E4"},
            {"page_building_e5", "Tòa nhà E5", "E5"},
            {"page_building_e6", "Tòa nhà E6", "E6"},
            {"page_building_e7", "Tòa nhà E7", "E7"},
            {"page_building_e8", "Tòa nhà E8", "E8"},
            {"page_building_e9", "Tòa nhà E9", "E9"},
            {"page_building_e10", "Tòa nhà E10", "E10"},
            {"page_building_eb8", "Tòa nhà EB8", "EB8"},
            {"page_building_c1", "Tòa nhà C1", "C1"},
            {"page_building_c2", "Tòa nhà C2", "C2"},
            {"page_building_c3", "Tòa nhà C3", "C3"},
            {"page_venue_gddn", "Giảng đường Đa Năng", "GDDN"},
            {"page_venue_cantin", "Căn Tin", "CANTIN"},
    };

    private final QuyenMenuUngDungRepository quyenMenuUngDungRepository;
    private final VaiTroUngDungRepository vaiTroUngDungRepository;

    public BoCapNhatMenuToaNha(
            QuyenMenuUngDungRepository quyenMenuUngDungRepository,
            VaiTroUngDungRepository vaiTroUngDungRepository
    ) {
        this.quyenMenuUngDungRepository = quyenMenuUngDungRepository;
        this.vaiTroUngDungRepository = vaiTroUngDungRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        QuyenMenuUngDung navBuilding = quyenMenuUngDungRepository.findByMenuName("nav_building").orElse(null);
        if (navBuilding == null) {
            return;
        }

        navBuilding.setTitle("Tòa nhà");
        quyenMenuUngDungRepository.save(navBuilding);

        quyenMenuUngDungRepository.findByMenuName("nav_building_towers").ifPresent(towers -> {
            List<QuyenMenuUngDung> con = quyenMenuUngDungRepository.findAll().stream()
                    .filter(m -> Objects.equals(m.getParentIdOrNull(), towers.getId()))
                    .collect(Collectors.toList());
            int sort = 22;
            for (QuyenMenuUngDung page : con) {
                page.setParent(navBuilding);
                page.setSortOrder(sort++);
                quyenMenuUngDungRepository.save(page);
            }
            xoaMenuHoanToan(towers);
        });

        xoaMenuHoanToanByName("page_departments");

        if (!coTrangToaTrucTiep(navBuilding.getId())) {
            int sort = 22;
            for (String[] row : TOA) {
                if (quyenMenuUngDungRepository.findByMenuName(row[0]).isEmpty()) {
                    luu(tao(row[0], row[1], navBuilding, PAGE, sort++, pathDepartments(row[2])));
                }
            }
            ganMenuVaiTroCoQuyenToa();
        }
    }

    private boolean coTrangToaTrucTiep(Long navBuildingId) {
        return quyenMenuUngDungRepository.findAll().stream()
                .anyMatch(m -> Objects.equals(m.getParentIdOrNull(), navBuildingId)
                        && (m.getMenuName().startsWith("page_building_") || m.getMenuName().startsWith("page_venue_")));
    }

    private void xoaMenuHoanToanByName(String menuName) {
        quyenMenuUngDungRepository.findByMenuName(menuName).ifPresent(this::xoaMenuHoanToan);
    }

    private void xoaMenuHoanToan(QuyenMenuUngDung menu) {
        for (VaiTroUngDung role : vaiTroUngDungRepository.findAll()) {
            role.getMenus().removeIf(m -> Objects.equals(m.getId(), menu.getId()));
            vaiTroUngDungRepository.save(role);
        }
        quyenMenuUngDungRepository.delete(menu);
    }

    private void ganMenuVaiTroCoQuyenToa() {
        List<QuyenMenuUngDung> menuToa = quyenMenuUngDungRepository.findAll().stream()
                .filter(m -> {
                    String n = m.getMenuName();
                    return n.startsWith("page_building_") || n.startsWith("page_venue_");
                })
                .collect(Collectors.toList());
        if (menuToa.isEmpty()) {
            return;
        }
        Set<String> roleCodes = Set.of("ADMIN", "MANAGER", "STAFF");
        for (VaiTroUngDung role : vaiTroUngDungRepository.findAll()) {
            if (!roleCodes.contains(role.getCode())) {
                continue;
            }
            boolean coNavBuilding = role.getMenus().stream()
                    .anyMatch(m -> "nav_building".equals(m.getMenuName()));
            if (!coNavBuilding) {
                continue;
            }
            role.getMenus().addAll(menuToa);
            vaiTroUngDungRepository.save(role);
        }
    }

    private static String pathDepartments(String buildingCode) {
        return "/dashboard/departments?building=" + buildingCode;
    }

    private QuyenMenuUngDung luu(QuyenMenuUngDung m) {
        return quyenMenuUngDungRepository.save(m);
    }

    private static QuyenMenuUngDung tao(String menuName, String title, QuyenMenuUngDung parent, int permType, int sort, String path) {
        QuyenMenuUngDung m = new QuyenMenuUngDung();
        m.setMenuName(menuName);
        m.setTitle(title);
        m.setParent(parent);
        m.setPermissionType(permType);
        m.setSortOrder(sort);
        m.setPath(path);
        return m;
    }
}
