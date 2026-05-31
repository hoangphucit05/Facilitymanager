package com.facilitymanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
public class TaiSan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_number", nullable = false, unique = true, length = 50)
    private String cardNumber;

    @Column(name = "asset_name", nullable = false, length = 200)
    private String assetName;

    @Column(name = "provider", length = 200)
    private String provider;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "classroom", length = 100)
    private String classroom;

    @Column(name = "asset_type", length = 100)
    private String assetType;

    @Column(name = "item_category", length = 100)
    private String itemCategory;

    @Column(name = "manufacture_year")
    private Integer manufactureYear;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    @Column(name = "original_price", precision = 18, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "fund_source", length = 100)
    private String fundSource;

    @Column(name = "usage_time")
    private Integer usageTime;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "usage_year")
    private Integer usageYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_user_id")
    private NguoiDung buyerUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Phong room;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "IN_USE";

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
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
    public NguoiDung getBuyerUser() { return buyerUser; }
    public void setBuyerUser(NguoiDung buyerUser) { this.buyerUser = buyerUser; }
    public Phong getRoom() { return room; }
    public void setRoom(Phong room) { this.room = room; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
