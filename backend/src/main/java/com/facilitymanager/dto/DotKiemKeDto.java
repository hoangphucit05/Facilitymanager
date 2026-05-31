package com.facilitymanager.dto;

import com.facilitymanager.entity.DotKiemKe;

import java.time.LocalDateTime;
import java.util.List;

public class DotKiemKeDto {

    private Long id;
    private String name;
    private String scopeType;
    private String scopeValue;
    private String status;
    private Long createdBy;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<ChiTietKiemKeDto> details;

    public static DotKiemKeDto fromEntity(DotKiemKe a) {
        DotKiemKeDto dto = new DotKiemKeDto();
        dto.id = a.getId();
        dto.name = a.getName();
        dto.scopeType = a.getScopeType();
        dto.scopeValue = a.getScopeValue();
        dto.status = a.getStatus();
        dto.createdBy = a.getCreatedBy();
        dto.startedAt = a.getStartedAt();
        dto.completedAt = a.getCompletedAt();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }
    public String getScopeValue() { return scopeValue; }
    public void setScopeValue(String scopeValue) { this.scopeValue = scopeValue; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public List<ChiTietKiemKeDto> getDetails() { return details; }
    public void setDetails(List<ChiTietKiemKeDto> details) { this.details = details; }
}
