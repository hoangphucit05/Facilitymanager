package com.facilitymanager.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fm_menu_permissions")
public class QuyenMenuUngDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private QuyenMenuUngDung parent;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "menu_name", nullable = false, length = 120)
    private String menuName;

    @Column(length = 500)
    private String path;

    @Column(name = "permission_type", nullable = false)
    private int permissionType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public QuyenMenuUngDung getParent() {
        return parent;
    }

    public void setParent(QuyenMenuUngDung parent) {
        this.parent = parent;
    }

    public Long getParentIdOrNull() {
        return parent == null ? null : parent.getId();
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public int getPermissionType() {
        return permissionType;
    }

    public void setPermissionType(int permissionType) {
        this.permissionType = permissionType;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
