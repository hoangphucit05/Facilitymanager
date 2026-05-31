package com.facilitymanager.dto;

import com.facilitymanager.entity.TaiSan;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TaiSanDto {
    private Long id;
    private String cardNumber;
    private String assetName;
    private String provider;
    private String country;
    private String department;
    private String classroom;
    private String assetType;
    private String itemCategory;
    private Integer manufactureYear;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal originalPrice;
    private String fundSource;
    private Integer usageTime;
    private LocalDate purchaseDate;
    private Integer usageYear;
    private String status;
    private String note;
    private String buyer;
    private Long roomId;
    private String roomCode;
    private String building;
    private String buildingName;

    public static TaiSanDto fromEntity(TaiSan a) {
        TaiSanDto dto = new TaiSanDto();
        dto.id = a.getId();
        dto.cardNumber = a.getCardNumber();
        dto.assetName = a.getAssetName();
        dto.provider = a.getProvider();
        dto.country = a.getCountry();
        dto.department = a.getDepartment();
        dto.classroom = a.getClassroom();
        dto.assetType = a.getAssetType();
        dto.itemCategory = a.getItemCategory();
        dto.manufactureYear = a.getManufactureYear();
        dto.unitPrice = a.getUnitPrice();
        dto.quantity = a.getQuantity();
        dto.originalPrice = a.getOriginalPrice();
        dto.fundSource = a.getFundSource();
        dto.usageTime = a.getUsageTime();
        dto.purchaseDate = a.getPurchaseDate();
        dto.usageYear = a.getUsageYear();
        dto.status = a.getStatus();
        dto.note = a.getNote();
        try {
            if (a.getBuyerUser() != null) dto.buyer = a.getBuyerUser().getFullName();
        } catch (Exception e) {
            dto.buyer = "";
        }
        try {
            if (a.getRoom() != null) {
                dto.roomId = a.getRoom().getId();
                dto.roomCode = a.getRoom().getRoomCode();
                // Ưu tiên mã phòng thực thay vì mã lớp học.
                dto.classroom = a.getRoom().getRoomCode();
                dto.building = a.getRoom().getBuildingCode();
                dto.buildingName = a.getRoom().getBuildingCode();
            }
        } catch (Exception e) {
            // Bỏ qua nếu proxy Phong chưa được khởi tạo (lazy)
        }
        return dto;
    }

    public void applyTo(TaiSan a) {
        if (cardNumber != null) a.setCardNumber(cardNumber);
        if (assetName != null) a.setAssetName(assetName);
        if (provider != null) a.setProvider(provider);
        if (country != null) a.setCountry(country);
        if (department != null) a.setDepartment(department);
        if (classroom != null) a.setClassroom(classroom);
        if (assetType != null) a.setAssetType(assetType);
        if (itemCategory != null) a.setItemCategory(itemCategory);
        if (manufactureYear != null) a.setManufactureYear(manufactureYear);
        if (unitPrice != null) a.setUnitPrice(unitPrice);
        if (quantity != null) a.setQuantity(quantity);
        if (originalPrice != null) a.setOriginalPrice(originalPrice);
        if (fundSource != null) a.setFundSource(fundSource);
        if (usageTime != null) a.setUsageTime(usageTime);
        if (purchaseDate != null) a.setPurchaseDate(purchaseDate);
        if (usageYear != null) a.setUsageYear(usageYear);
        if (status != null) a.setStatus(status);
        if (note != null) a.setNote(note);
    }

    // Getters/Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getClassroom() { return classroom; }
    public void setClassroom(String classroom) { this.classroom = classroom; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }
    public Integer getManufactureYear() { return manufactureYear; }
    public void setManufactureYear(Integer manufactureYear) { this.manufactureYear = manufactureYear; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    public String getFundSource() { return fundSource; }
    public void setFundSource(String fundSource) { this.fundSource = fundSource; }
    public Integer getUsageTime() { return usageTime; }
    public void setUsageTime(Integer usageTime) { this.usageTime = usageTime; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public Integer getUsageYear() { return usageYear; }
    public void setUsageYear(Integer usageYear) { this.usageYear = usageYear; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getBuyer() { return buyer; }
    public void setBuyer(String buyer) { this.buyer = buyer; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }
}
