package com.facilitymanager.dto;

import com.facilitymanager.entity.YeuCau;

import java.time.LocalDateTime;

public class YeuCauDto {

    private Long id;
    private String title;
    private String note;
    private String managerGroup;
    private String priority;
    private String managerName;
    private String attachmentUrl;
    private String status;
    private Boolean isDraft;
    private Long createdByUserId;
    private String createdByUserName;
    private Long assignedToUserId;
    private String assignedToUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static YeuCauDto fromEntity(YeuCau r) {
        YeuCauDto dto = new YeuCauDto();
        dto.id = r.getId();
        dto.title = r.getTitle();
        dto.note = r.getNote();
        dto.managerGroup = r.getManagerGroup();
        dto.priority = r.getPriority();
        dto.attachmentUrl = r.getAttachmentUrl();
        dto.status = r.getStatus();
        dto.isDraft = r.isDraft();
        dto.createdByUserId = r.getCreatedByUserId();
        try {
            if (r.getCreatedByUser() != null) {
                dto.createdByUserName = r.getCreatedByUser().getFullName();
            }
        } catch (Exception ignored) {
            dto.createdByUserName = null;
        }
        dto.assignedToUserId = r.getAssignedToUserId();
        if (r.getAssignedToUserId() != null) {
            try {
                if (r.getAssignedToUser() != null) {
                    dto.assignedToUserName = r.getAssignedToUser().getFullName();
                    dto.managerName = dto.assignedToUserName;
                } else if (r.getManagerName() != null && !r.getManagerName().isBlank()) {
                    dto.assignedToUserName = r.getManagerName();
                    dto.managerName = r.getManagerName();
                }
            } catch (Exception ignored) {
                dto.assignedToUserName = null;
                dto.managerName = null;
            }
        } else {
            dto.assignedToUserName = null;
            dto.managerName = null;
        }
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getManagerGroup() {
        return managerGroup;
    }

    public void setManagerGroup(String managerGroup) {
        this.managerGroup = managerGroup;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsDraft() {
        return isDraft;
    }

    public void setIsDraft(Boolean draft) {
        isDraft = draft;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByUserName() {
        return createdByUserName;
    }

    public void setCreatedByUserName(String createdByUserName) {
        this.createdByUserName = createdByUserName;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public String getAssignedToUserName() {
        return assignedToUserName;
    }

    public void setAssignedToUserName(String assignedToUserName) {
        this.assignedToUserName = assignedToUserName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
