package com.facilitymanager.security;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

/**
 * Phiên đăng nhập (giá trị Redis dưới key {@code FM_USER_TOKEN:*}).
 * Lưu đủ thông tin để interceptor & menu API biết user là ai, role gì, có quyền nào.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NoiDungPhien {

    private Long userId;
    private String username;
    private String fullName;
    private String roleCode;
    private List<Long> roleIds = new ArrayList<>();
    private List<Long> permissionIds = new ArrayList<>();
    private List<String> permissionTitles = new ArrayList<>();
    private boolean saveLogin;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public List<Long> getRoleIds() {
        return roleIds;
    }

    public void setRoleIds(List<Long> roleIds) {
        this.roleIds = roleIds;
    }

    public List<Long> getPermissionIds() {
        return permissionIds;
    }

    public void setPermissionIds(List<Long> permissionIds) {
        this.permissionIds = permissionIds;
    }

    public List<String> getPermissionTitles() {
        return permissionTitles;
    }

    public void setPermissionTitles(List<String> permissionTitles) {
        this.permissionTitles = permissionTitles;
    }

    public boolean isSaveLogin() {
        return saveLogin;
    }

    public void setSaveLogin(boolean saveLogin) {
        this.saveLogin = saveLogin;
    }
}
