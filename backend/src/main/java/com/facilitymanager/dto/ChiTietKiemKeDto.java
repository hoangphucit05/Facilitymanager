package com.facilitymanager.dto;

import com.facilitymanager.entity.ChiTietKiemKe;

public class ChiTietKiemKeDto {

    private Long id;
    private Long assetId;
    private String cardNumber;
    private String assetName;
    private Integer systemQty;
    private String systemRoom;
    private String systemStatus;
    private Integer actualQty;
    private String actualRoom;
    private String actualStatus;
    private String note;
    private Boolean matched;
    private String discrepancyType;
    private Integer roomFloor;
    private String roomCode;

    public static ChiTietKiemKeDto fromEntity(ChiTietKiemKe d) {
        ChiTietKiemKeDto dto = new ChiTietKiemKeDto();
        dto.id = d.getId();
        dto.assetId = d.getAssetId();
        dto.cardNumber = d.getCardNumber();
        dto.assetName = d.getAssetName();
        dto.systemQty = d.getSystemQty();
        dto.systemRoom = d.getSystemRoom();
        dto.systemStatus = d.getSystemStatus();
        dto.actualQty = d.getActualQty();
        dto.actualRoom = d.getActualRoom();
        dto.actualStatus = d.getActualStatus();
        dto.note = d.getNote();
        dto.matched = d.getMatched();
        dto.discrepancyType = d.getDiscrepancyType();
        dto.roomFloor = d.getRoomFloor();
        dto.roomCode = d.getRoomCode();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
