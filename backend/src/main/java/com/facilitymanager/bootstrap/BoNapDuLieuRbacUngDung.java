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
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(20)
public class BoNapDuLieuRbacUngDung implements ApplicationRunner {

    private static final int NAV = -1;
    private static final int PAGE = 0;

    private final QuyenMenuUngDungRepository quyenMenuUngDungRepository;
    private final VaiTroUngDungRepository vaiTroUngDungRepository;

    public BoNapDuLieuRbacUngDung(
            QuyenMenuUngDungRepository quyenMenuUngDungRepository,
            VaiTroUngDungRepository vaiTroUngDungRepository
    ) {
        this.quyenMenuUngDungRepository = quyenMenuUngDungRepository;
        this.vaiTroUngDungRepository = vaiTroUngDungRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (quyenMenuUngDungRepository.count() > 0) {
            return;
        }

        QuyenMenuUngDung root = luu(tao("nav_root", "Hệ thống CSVC", null, NAV, 0, null));
        QuyenMenuUngDung navUser = luu(tao("nav_user_block", "Người dùng", root, NAV, 10, null));
        luu(tao("page_users", "Quản lý user", navUser, PAGE, 11, "/profile/users"));

        QuyenMenuUngDung navBuilding = luu(tao("nav_building", "Tòa nhà", root, NAV, 20, null));
        int sortToa = 21;
        for (String[] row : BoCapNhatMenuToaNha.TOA) {
            luu(tao(row[0], row[1], navBuilding, PAGE, sortToa++,
                    "/dashboard/departments?building=" + row[2]));
        }

        QuyenMenuUngDung navCat = luu(tao("nav_categories", "Danh mục", root, NAV, 30, null));
        luu(tao("page_categories", "Quản lý danh mục", navCat, PAGE, 31, "/dashboard/categories"));

        QuyenMenuUngDung navAsset = luu(tao("nav_assets", "Tài sản", root, NAV, 40, null));
        luu(tao("page_assets", "Quản lý tài sản", navAsset, PAGE, 41, "/dashboard/assets"));
        luu(tao("page_liquidation", "Điều chuyển / thanh lý", navAsset, PAGE, 42, "/dashboard/liquidation"));
        luu(tao("page_statistics", "Thống kê", navAsset, PAGE, 43, "/dashboard/statistics"));

        QuyenMenuUngDung navContact = luu(tao("nav_contact", "Liên hệ", root, NAV, 50, null));
        luu(tao("page_contact", "Liên hệ", navContact, PAGE, 51, "/profile/contact"));

        QuyenMenuUngDung navRbac = luu(tao("nav_rbac", "Phân quyền", root, NAV, 60, null));
        luu(tao("page_rbac_roles", "Quản lý vai trò", navRbac, PAGE, 61, "/profile/rbac-roles"));

        QuyenMenuUngDung navStudent = luu(tao("nav_student", "Sinh viên", root, NAV, 70, null));
        luu(tao("page_student_create", "Tạo yêu cầu xử lý", navStudent, PAGE, 71, "/student/request-create"));
        luu(tao("page_student_sent", "Yêu cầu đã gửi", navStudent, PAGE, 72, "/student/request-sent"));
        luu(tao("page_student_drafts", "Yêu cầu đã lưu", navStudent, PAGE, 73, "/student/request-drafts"));

        List<QuyenMenuUngDung> tatCa = quyenMenuUngDungRepository.findAll();

        VaiTroUngDung admin = vaiTro("ADMIN", "Quản trị hệ thống", "Toàn quyền ứng dụng", 1);
        admin.getMenus().addAll(tatCa);
        vaiTroUngDungRepository.save(admin);

        VaiTroUngDung manager = vaiTro("MANAGER", "Quản lý", "Trưởng khoa / phòng", 2);
        manager.getMenus().addAll(locTheoTen(tatCa, Set.of(
                "nav_root", "nav_user_block", "page_users",
                "nav_building",
                "nav_categories", "page_categories",
                "nav_assets", "page_assets", "page_liquidation", "page_statistics",
                "nav_contact", "page_contact"
        )));
        manager.getMenus().addAll(locMenuToa(tatCa));
        vaiTroUngDungRepository.save(manager);

        VaiTroUngDung staff = vaiTro("STAFF", "Nhân viên", "Giảng viên / nhân sự", 3);
        staff.getMenus().addAll(manager.getMenus());
        vaiTroUngDungRepository.save(staff);

        VaiTroUngDung student = vaiTro("STUDENT", "Sinh viên", "Tài khoản sinh viên", 4);
        student.getMenus().addAll(locTheoTen(tatCa, Set.of(
                "nav_root", "nav_student", "page_student_create", "page_student_sent", "page_student_drafts",
                "nav_contact", "page_contact"
        )));
        vaiTroUngDungRepository.save(student);
    }

    private List<QuyenMenuUngDung> locTheoTen(List<QuyenMenuUngDung> tatCa, Set<String> names) {
        return tatCa.stream().filter(m -> names.contains(m.getMenuName())).collect(Collectors.toList());
    }

    private static List<QuyenMenuUngDung> locMenuToa(List<QuyenMenuUngDung> tatCa) {
        return tatCa.stream().filter(m -> {
            String n = m.getMenuName();
            return n.startsWith("page_building_") || n.startsWith("page_venue_");
        }).collect(Collectors.toList());
    }

    private QuyenMenuUngDung luu(QuyenMenuUngDung m) {
        return quyenMenuUngDungRepository.save(m);
    }

    private QuyenMenuUngDung tao(String menuName, String title, QuyenMenuUngDung parent, int permType, int sort, String path) {
        QuyenMenuUngDung m = new QuyenMenuUngDung();
        m.setMenuName(menuName);
        m.setTitle(title);
        m.setParent(parent);
        m.setPermissionType(permType);
        m.setSortOrder(sort);
        m.setPath(path);
        return m;
    }

    private VaiTroUngDung vaiTro(String code, String name, String desc, int sort) {
        VaiTroUngDung v = new VaiTroUngDung();
        v.setCode(code);
        v.setName(name);
        v.setDescription(desc);
        v.setSortOrder(sort);
        return v;
    }
}
