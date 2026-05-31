package com.facilitymanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rooms")
public class Phong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 50)
    private String roomCode;

    @Column(name = "building_code", nullable = false, length = 30)
    private String buildingCode;

    @Column(nullable = false)
    private Integer floor;

    @Column(name = "class_using", length = 100)
    private String classUsing;

    @Column(length = 150)
    private String department;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "teacher_name", length = 150)
    private String teacherName;

    @Column(name = "class_studying", length = 100)
    private String classStudying;

    @Column(name = "desk_count", nullable = false)
    private Integer deskCount = 0;

    @Column(name = "chair_count", nullable = false)
    private Integer chairCount = 0;

    @Column(name = "speaker_count", nullable = false)
    private Integer speakerCount = 0;

    @Column(name = "air_conditioner_count", nullable = false)
    private Integer airConditionerCount = 0;

    @Column(name = "microphone_count", nullable = false)
    private Integer microphoneCount = 0;

    @Column(name = "glass_door_status", length = 30)
    private String glassDoorStatus;

    @Column(name = "ceiling_fan_count", nullable = false)
    private Integer ceilingFanCount = 0;

    @Column(name = "curtain_status", length = 30)
    private String curtainStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getBuildingCode() {
        return buildingCode;
    }

    public void setBuildingCode(String buildingCode) {
        this.buildingCode = buildingCode;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public String getClassUsing() {
        return classUsing;
    }

    public void setClassUsing(String classUsing) {
        this.classUsing = classUsing;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getClassStudying() {
        return classStudying;
    }

    public void setClassStudying(String classStudying) {
        this.classStudying = classStudying;
    }

    public Integer getDeskCount() {
        return deskCount;
    }

    public void setDeskCount(Integer deskCount) {
        this.deskCount = deskCount;
    }

    public Integer getChairCount() {
        return chairCount;
    }

    public void setChairCount(Integer chairCount) {
        this.chairCount = chairCount;
    }

    public Integer getSpeakerCount() {
        return speakerCount;
    }

    public void setSpeakerCount(Integer speakerCount) {
        this.speakerCount = speakerCount;
    }

    public Integer getAirConditionerCount() {
        return airConditionerCount;
    }

    public void setAirConditionerCount(Integer airConditionerCount) {
        this.airConditionerCount = airConditionerCount;
    }

    public Integer getMicrophoneCount() {
        return microphoneCount;
    }

    public void setMicrophoneCount(Integer microphoneCount) {
        this.microphoneCount = microphoneCount;
    }

    public String getGlassDoorStatus() {
        return glassDoorStatus;
    }

    public void setGlassDoorStatus(String glassDoorStatus) {
        this.glassDoorStatus = glassDoorStatus;
    }

    public Integer getCeilingFanCount() {
        return ceilingFanCount;
    }

    public void setCeilingFanCount(Integer ceilingFanCount) {
        this.ceilingFanCount = ceilingFanCount;
    }

    public String getCurtainStatus() {
        return curtainStatus;
    }

    public void setCurtainStatus(String curtainStatus) {
        this.curtainStatus = curtainStatus;
    }
}
