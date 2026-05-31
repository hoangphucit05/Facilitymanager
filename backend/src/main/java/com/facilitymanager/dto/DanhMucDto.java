package com.facilitymanager.dto;

import com.facilitymanager.entity.DanhMuc;

public class DanhMucDto {

    private Long id;
    private String code;
    private String name;
    private String type;
    private String categoryCode;
    private String categoryName;
    private String categoryType;

    public static DanhMucDto fromEntity(DanhMuc c) {
        DanhMucDto dto = new DanhMucDto();
        dto.id = c.getId();
        dto.code = c.getCode();
        dto.name = c.getName();
        dto.type = c.getType();
        dto.categoryCode = c.getCode();
        dto.categoryName = c.getName();
        dto.categoryType = c.getType();
        return dto;
    }

    public void applyTo(DanhMuc c) {
        if (code != null && !code.isBlank()) {
            c.setCode(code.trim());
        } else if (categoryCode != null && !categoryCode.isBlank()) {
            c.setCode(categoryCode.trim());
        }
        if (name != null && !name.isBlank()) {
            c.setName(name.trim());
        } else if (categoryName != null && !categoryName.isBlank()) {
            c.setName(categoryName.trim());
        }
        String resolvedType = type != null && !type.isBlank() ? type : categoryType;
        if (resolvedType != null && !resolvedType.isBlank() && !"default".equalsIgnoreCase(resolvedType.trim())) {
            c.setType(resolvedType.trim().toUpperCase());
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategoryType() {
        return categoryType;
    }

    public void setCategoryType(String categoryType) {
        this.categoryType = categoryType;
    }
}
