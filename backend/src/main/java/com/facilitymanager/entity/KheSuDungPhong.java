package com.facilitymanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "room_usage_slots")
public class KheSuDungPhong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, length = 80)
    private String roomCode;

    @Column(name = "weekday", nullable = false)
    private Integer weekday;

    @Column(name = "shift", nullable = false, length = 20)
    private String shift;

    @Column(name = "period_label", nullable = false, length = 20)
    private String periodLabel;

    @Column(name = "period_start")
    private Integer periodStart;

    @Column(name = "period_end")
    private Integer periodEnd;

    @Column(name = "usage_label", nullable = false, length = 255)
    private String usageLabel;

    @Column(name = "owner_unit", length = 150)
    private String ownerUnit;

    @Column(name = "primary_contact", length = 150)
    private String primaryContact;

    @Column(name = "assistant_contact", length = 150)
    private String assistantContact;

    @Column(name = "semester", nullable = false, length = 30)
    private String semester;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    public Long getId() {
        return id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Integer getWeekday() {
        return weekday;
    }

    public void setWeekday(Integer weekday) {
        this.weekday = weekday;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }

    public String getPeriodLabel() {
        return periodLabel;
    }

    public void setPeriodLabel(String periodLabel) {
        this.periodLabel = periodLabel;
    }

    public Integer getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(Integer periodStart) {
        this.periodStart = periodStart;
    }

    public Integer getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(Integer periodEnd) {
        this.periodEnd = periodEnd;
    }

    public String getUsageLabel() {
        return usageLabel;
    }

    public void setUsageLabel(String usageLabel) {
        this.usageLabel = usageLabel;
    }

    public String getOwnerUnit() {
        return ownerUnit;
    }

    public void setOwnerUnit(String ownerUnit) {
        this.ownerUnit = ownerUnit;
    }

    public String getPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(String primaryContact) {
        this.primaryContact = primaryContact;
    }

    public String getAssistantContact() {
        return assistantContact;
    }

    public void setAssistantContact(String assistantContact) {
        this.assistantContact = assistantContact;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }
}
