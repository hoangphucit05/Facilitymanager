package com.facilitymanager.dto;

import java.util.List;

/**
 * Phản hồi JSON đăng nhập (tương thích frontend AppAuth.loginRemote).
 */
public class PhanHoiDangNhap {

    private String accessToken;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private Long userId;
    private List<Long> roleIds;
    private List<Long> permissionIds;
    private List<String> roleCodes;
    private List<String> permissionTitles;

    public PhanHoiDangNhap() {
    }

    public PhanHoiDangNhap(
            String accessToken,
            String tokenType,
            String username,
            String fullName,
            Long userId,
            List<Long> roleIds,
            List<Long> permissionIds,
            List<String> roleCodes,
            List<String> permissionTitles
    ) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.username = username;
        this.fullName = fullName;
        this.userId = userId;
        this.roleIds = roleIds;
        this.permissionIds = permissionIds;
        this.roleCodes = roleCodes;
        this.permissionTitles = permissionTitles;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public List<String> getRoleCodes() {
        return roleCodes;
    }

    public void setRoleCodes(List<String> roleCodes) {
        this.roleCodes = roleCodes;
    }

    public List<String> getPermissionTitles() {
        return permissionTitles;
    }

    public void setPermissionTitles(List<String> permissionTitles) {
        this.permissionTitles = permissionTitles;
    }
}
