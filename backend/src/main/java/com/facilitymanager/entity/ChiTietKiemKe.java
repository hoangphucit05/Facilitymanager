package com.facilitymanager.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_details")
public class ChiTietKiemKe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "audit_id", nullable = false)
    private DotKiemKe audit;

    @Column(name = "asset_id")
    private Long assetId;

    @Column(name = "card_number", nullable = false, length = 50)
    private String cardNumber;

    @Column(name = "asset_name", nullable = false, length = 200)
    private String assetName;

    @Column(name = "system_qty", nullable = false)
    private Integer systemQty = 0;

    @Column(name = "system_room", length = 100)
    private String systemRoom;

    @Column(name = "system_status", nullable = false, length = 30)
    private String systemStatus;

    @Column(name = "actual_qty")
    private Integer actualQty;

    @Column(name = "actual_room", length = 100)
    private String actualRoom;

    @Column(name = "actual_status", length = 30)
    private String actualStatus;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    private Boolean matched = false;

    @Column(name = "discrepancy_type", length = 30)
    private String discrepancyType;

    @Column(name = "room_floor")
    private Integer roomFloor;

    @Column(name = "room_code", length = 50)
    private String roomCode;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DotKiemKe getAudit() { return audit; }
    public void setAudit(DotKiemKe audit) { this.audit = audit; }
    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public Integer getSystemQty() { return systemQty; }
    public void setSystemQty(Integer systemQty) { this.systemQty = systemQty; }
    public String getSystemRoom() { return systemRoom; }
    public void setSystemRoom(String systemRoom) { this.systemRoom = systemRoom; }
    public String getSystemStatus() { return systemStatus; }
    public void setSystemStatus(String systemStatus) { this.systemStatus = systemStatus; }
    public Integer getActualQty() { return actualQty; }
    public void setActualQty(Integer actualQty) { this.actualQty = actualQty; }
    public String getActualRoom() { return actualRoom; }
    public void setActualRoom(String actualRoom) { this.actualRoom = actualRoom; }
    public String getActualStatus() { return actualStatus; }
    public void setActualStatus(String actualStatus) { this.actualStatus = actualStatus; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Boolean getMatched() { return matched; }
    public void setMatched(Boolean matched) { this.matched = matched; }
    public String getDiscrepancyType() { return discrepancyType; }
    public void setDiscrepancyType(String discrepancyType) { this.discrepancyType = discrepancyType; }
    public Integer getRoomFloor() { return roomFloor; }
    public void setRoomFloor(Integer roomFloor) { this.roomFloor = roomFloor; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
}
