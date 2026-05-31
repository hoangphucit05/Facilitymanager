package com.facilitymanager.service;

import com.facilitymanager.dto.LichPhongPhanHoiDto;
import com.facilitymanager.dto.LopDangHocDto;
import com.facilitymanager.dto.TkbTomTatPhongDto;
import com.facilitymanager.entity.KheSuDungPhong;
import com.facilitymanager.repository.KheSuDungPhongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DichVuLichPhong {

    public static final LocalDate HK1_START = LocalDate.of(2025, 9, 3);
    public static final LocalDate HK1_END = LocalDate.of(2026, 1, 10);
    public static final LocalDate HK2_START = LocalDate.of(2026, 3, 2);
    public static final LocalDate HK2_END = LocalDate.of(2026, 6, 6);
    public static final String HK1_SEMESTER = "HK1-2025-2026";
    public static final String HK2_SEMESTER = "HK2-2025-2026";
    public static final int MAX_WEEKS = 16;

    private static final Pattern PERIOD_ARROW = Pattern.compile("(\\d+)\\s*->\\s*(\\d+)");
    private static final Pattern PERIOD_DASH = Pattern.compile("(\\d+)\\s*[-–]\\s*(\\d+)");
    private static final Pattern MA_LOP_CQ = Pattern.compile("CQ\\.\\d+\\.[^\\s,]+");
    private static final Pattern MA_LOP_K65 = Pattern.compile("K65\\.[^\\s,]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern MA_LOP_NGAN = Pattern.compile("^[A-Z0-9][A-Z0-9._\\-+]{2,80}$", Pattern.CASE_INSENSITIVE);

    private final KheSuDungPhongRepository roomUsageSlotRepository;

    public DichVuLichPhong(KheSuDungPhongRepository roomUsageSlotRepository) {
        this.roomUsageSlotRepository = roomUsageSlotRepository;
    }

    @Transactional(readOnly = true)
    public List<LichPhongPhanHoiDto> layLichTheoPhong(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            return List.of();
        }
        return roomUsageSlotRepository.findByRoomCodeIgnoreCaseOrderByWeekdayAscPeriodStartAsc(roomCode.trim())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public LopDangHocDto layLopDangHoc(String roomCode, LocalDateTime at) {
        if (roomCode == null || roomCode.isBlank()) {
            return null;
        }
        LocalDateTime now = at != null ? at : LocalDateTime.now();
        Integer weekday = thuTheoTkb(now.getDayOfWeek());
        Integer period = tietTheoThoiGian(now.getHour(), now.getMinute());
        if (weekday == null || period == null) {
            return null;
        }
        return roomUsageSlotRepository
                .findFirstByRoomCodeIgnoreCaseAndWeekdayAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqualOrderByIdAsc(
                        roomCode.trim(),
                        weekday,
                        period,
                        period
                )
                .map((s) -> new LopDangHocDto(
                        s.getRoomCode(),
                        weekday,
                        period,
                        s.getShift(),
                        s.getPeriodLabel(),
                        s.getOwnerUnit(),
                        rutGonMaLop(s.getUsageLabel()),
                        hienThiGiangVien(s),
                        s.getSemester()
                ))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, TkbTomTatPhongDto> layTomTatTheoPhongVaTuan(
            List<String> roomCodes,
            int week,
            String semester,
            String shift
    ) {
        if (roomCodes == null || roomCodes.isEmpty() || week < 1) {
            return Map.of();
        }
        String sem = xacDinhHocKy(null, semester);
        String ca = normalizeShift(shift);
        int boundedWeek = Math.min(Math.max(week, 1), MAX_WEEKS);
        LocalDate weekStart = tinhNgayDauTuan(boundedWeek, sem);
        LocalDate weekEnd = tinhNgayCuoiTuan(boundedWeek, sem);
        List<String> normalizedCodes = chuanHoaMaPhong(roomCodes);
        if (normalizedCodes.isEmpty()) {
            return Map.of();
        }
        List<KheSuDungPhong> slots = locTheoCa(
                roomUsageSlotRepository.findActiveForWeek(
                        normalizedCodes,
                        weekStart,
                        weekEnd,
                        sem,
                        null
                ),
                ca
        );
        return gopTomTat(slots, normalizedCodes);
    }

    @Transactional(readOnly = true)
    public Map<String, TkbTomTatPhongDto> layTomTatTheoPhongVaNgay(
            List<String> roomCodes,
            LocalDate date,
            String semester,
            String shift
    ) {
        if (roomCodes == null || roomCodes.isEmpty() || date == null) {
            return Map.of();
        }
        String sem = xacDinhHocKy(date, semester);
        String ca = normalizeShift(shift);
        Integer weekday = thuTheoTkb(date.getDayOfWeek());
        if (weekday == null) {
            return Map.of();
        }
        List<String> normalizedCodes = chuanHoaMaPhong(roomCodes);
        if (normalizedCodes.isEmpty()) {
            return Map.of();
        }
        List<KheSuDungPhong> slots = locTheoCa(
                roomUsageSlotRepository.findActiveForDate(
                        normalizedCodes,
                        date,
                        weekday,
                        sem,
                        null
                ),
                ca
        );
        return gopTomTat(slots, normalizedCodes);
    }

    public static String xacDinhHocKy(LocalDate date, String semesterParam) {
        if (semesterParam != null && !semesterParam.isBlank()) {
            return semesterParam.trim();
        }
        LocalDate ref = date != null ? date : LocalDate.now();
        if (!ref.isBefore(HK2_START) && !ref.isAfter(HK2_END)) {
            return HK2_SEMESTER;
        }
        if (!ref.isBefore(HK1_START) && !ref.isAfter(HK1_END)) {
            return HK1_SEMESTER;
        }
        LocalDate now = LocalDate.now();
        if (!now.isBefore(HK2_START) && !now.isAfter(HK2_END)) {
            return HK2_SEMESTER;
        }
        return HK1_SEMESTER;
    }

    public static LocalDate tinhNgayDauTuan(int week, String semester) {
        LocalDate start = HK2_SEMESTER.equals(semester) ? HK2_START : HK1_START;
        return start.plusWeeks(Math.max(week, 1) - 1L);
    }

    public static LocalDate tinhNgayDauTuan(int week) {
        return tinhNgayDauTuan(week, xacDinhHocKy(null, null));
    }

    public static LocalDate tinhNgayCuoiTuan(int week, String semester) {
        return tinhNgayDauTuan(week, semester).plusDays(6);
    }

    public static int tinhTuanHienTai(LocalDate today) {
        LocalDate ref = today != null ? today : LocalDate.now();
        String sem = xacDinhHocKy(ref, null);
        LocalDate start = HK2_SEMESTER.equals(sem) ? HK2_START : HK1_START;
        if (ref.isBefore(start)) {
            return 1;
        }
        long days = ChronoUnit.DAYS.between(start, ref);
        int week = (int) (days / 7) + 1;
        return Math.min(Math.max(week, 1), MAX_WEEKS);
    }

    private Map<String, TkbTomTatPhongDto> gopTomTat(List<KheSuDungPhong> slots, List<String> normalizedCodes) {
        Map<String, LinkedHashSet<String>> classesByRoom = new LinkedHashMap<>();
        Map<String, LinkedHashSet<String>> teachersByRoom = new LinkedHashMap<>();
        for (KheSuDungPhong slot : slots) {
            String key = slot.getRoomCode().trim().toLowerCase(Locale.ROOT);
            classesByRoom.computeIfAbsent(key, (k) -> new LinkedHashSet<>()).add(hienThiNhomSuDung(slot));
            String teacher = hienThiGiangVien(slot);
            if (teacher != null && !teacher.isBlank()) {
                teachersByRoom.computeIfAbsent(key, (k) -> new LinkedHashSet<>()).add(teacher.trim());
            }
        }
        Map<String, TkbTomTatPhongDto> out = new LinkedHashMap<>();
        for (String code : normalizedCodes) {
            LinkedHashSet<String> classes = classesByRoom.get(code);
            LinkedHashSet<String> teachers = teachersByRoom.get(code);
            if (classes == null && teachers == null) {
                continue;
            }
            out.put(code, new TkbTomTatPhongDto(
                    classes != null && !classes.isEmpty() ? String.join(", ", classes) : null,
                    teachers != null && !teachers.isEmpty() ? String.join(", ", teachers) : null
            ));
        }
        return out;
    }

    private static List<String> chuanHoaMaPhong(List<String> roomCodes) {
        return roomCodes.stream()
                .filter((c) -> c != null && !c.isBlank())
                .map((c) -> c.trim().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    private static String hienThiGiangVien(KheSuDungPhong slot) {
        String primary = slot.getPrimaryContact();
        String assistant = slot.getAssistantContact();
        if (primary != null && !primary.isBlank()) {
            if (assistant != null && !assistant.isBlank()) {
                return primary.trim() + ", Trợ giảng: " + assistant.trim();
            }
            return primary.trim();
        }
        if (assistant != null && !assistant.isBlank()) {
            return assistant.trim();
        }
        return null;
    }

    private static String hienThiNhomSuDung(KheSuDungPhong slot) {
        String shortLabel = rutGonMaLop(slot.getUsageLabel());
        if (shortLabel != null && !shortLabel.isBlank() && !"-".equals(shortLabel)) {
            return shortLabel;
        }
        String owner = slot.getOwnerUnit();
        return owner != null && !owner.isBlank() ? owner.trim() : "-";
    }

    /** Rút gọn nhãn TKB thành mã lớp (CQ.*, K65.*, …). */
    static String rutGonMaLop(String raw) {
        if (raw == null || raw.isBlank()) {
            return "-";
        }
        String trimmed = raw.trim();
        Matcher cq = MA_LOP_CQ.matcher(trimmed);
        if (cq.find()) {
            return cq.group();
        }
        Matcher k65 = MA_LOP_K65.matcher(trimmed);
        if (k65.find()) {
            return k65.group();
        }
        if (MA_LOP_NGAN.matcher(trimmed).matches()) {
            return trimmed;
        }
        return "-";
    }

    private LichPhongPhanHoiDto toDto(KheSuDungPhong slot) {
        return new LichPhongPhanHoiDto(
                slot.getId(),
                slot.getRoomCode(),
                slot.getWeekday(),
                slot.getShift(),
                slot.getPeriodLabel(),
                slot.getPeriodStart(),
                slot.getPeriodEnd(),
                slot.getOwnerUnit(),
                rutGonMaLop(slot.getUsageLabel()),
                hienThiGiangVien(slot),
                slot.getSemester()
        );
    }

    private static Integer thuTheoTkb(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> 2;
            case TUESDAY -> 3;
            case WEDNESDAY -> 4;
            case THURSDAY -> 5;
            case FRIDAY -> 6;
            case SATURDAY -> 7;
            default -> null;
        };
    }

    private static Integer tietTheoThoiGian(int hour, int minute) {
        int hm = hour * 60 + minute;
        if (hm >= 7 * 60 && hm < 12 * 60) return 3;
        if (hm >= 12 * 60 && hm < 18 * 60) return 8;
        if (hm >= 18 * 60 && hm <= 21 * 60 + 30) return 10;
        return null;
    }

    private static String normalizeShift(String shift) {
        if (shift == null || shift.isBlank()) {
            return null;
        }
        String raw = shift.trim().toUpperCase(Locale.ROOT);
        if (raw.equals("MORNING") || raw.equals("AFTERNOON") || raw.equals("EVENING")) {
            return raw;
        }
        return null;
    }

    private static List<KheSuDungPhong> locTheoCa(List<KheSuDungPhong> slots, String ca) {
        if (ca == null || slots == null || slots.isEmpty()) {
            return slots;
        }
        return slots.stream()
                .filter((s) -> ca.equals(tinhCaTuSlot(s)))
                .collect(Collectors.toList());
    }

    static String tinhCaTuSlot(KheSuDungPhong slot) {
        Integer start = slot.getPeriodStart();
        if (start == null) {
            start = parsePeriodStart(slot.getPeriodLabel());
        }
        if (start == null) {
            String stored = slot.getShift();
            return stored != null ? stored.trim().toUpperCase(Locale.ROOT) : "MORNING";
        }
        if (start <= 5) {
            return "MORNING";
        }
        if (start <= 9) {
            return "AFTERNOON";
        }
        return "EVENING";
    }

    private static Integer parsePeriodStart(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        String s = label.trim();
        Matcher m = PERIOD_ARROW.matcher(s);
        if (!m.find()) {
            m = PERIOD_DASH.matcher(s);
            if (!m.find()) {
                return null;
            }
        }
        try {
            return Integer.parseInt(m.group(1));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
