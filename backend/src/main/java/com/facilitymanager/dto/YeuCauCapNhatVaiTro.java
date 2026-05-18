package com.facilitymanager.dto;

import java.util.List;

public class YeuCauCapNhatVaiTro {

    private String name;
    private String description;
    private Integer sortOrder;
    private List<Long> menuIds;
    /** Chỉ khi {@code true}: áp dụng {@link #parentRoleId} (null = gỡ kế thừa). */
    private Boolean updateParent;
    private Long parentRoleId;

    public Boolean getUpdateParent() {
        return updateParent;
    }

    public void setUpdateParent(Boolean updateParent) {
        this.updateParent = updateParent;
    }

    public Long getParentRoleId() {
        return parentRoleId;
    }

    public void setParentRoleId(Long parentRoleId) {
        this.parentRoleId = parentRoleId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public List<Long> getMenuIds() {
        return menuIds;
    }

    public void setMenuIds(List<Long> menuIds) {
        this.menuIds = menuIds;
    }
}
