# -*- coding: utf-8 -*-
"""
Đọc user_room_teacher_blob.txt → seed_rooms_giao_vien.sql + rooms_teacher_from_user_order.json .
Ghép GV: phòng[0]=GV cuối blob; phòng[i>0]=GV[i+1].
Trùng room_code: lần hai có hậu tố _2 (UNIQUE).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
BLOB_SRC = BASE / "user_room_teacher_blob.txt"
SEED_OUT = BASE / "seed_rooms_giao_vien.sql"

INSERT_RE = re.compile(
    r"VALUES \(\d+, '(?P<room>[^']*)', '(?P<building>[^']*)', (?P<floor>\d+), "
    r"'(?P<class_using>[^']*)', '(?P<department>[^']*)', (?P<capacity>\d+), "
    r"'(?P<status>[^']*)', '(?P<teacher>[^']*)', '(?P<class_studying>[^']*)', "
    r"(?P<desk>\d+), (?P<chair>\d+), (?P<spk>\d+), (?P<ac>\d+), (?P<mic>\d+), "
    r"'(?P<glass>[^']*)', (?P<fan>\d+), '(?P<curtain>[^']*)'\)",
)


def extract_blob() -> str:
    return BLOB_SRC.read_text(encoding="utf-8")


def parse_teachers_rooms(blob: str) -> tuple[list[str], list[str]]:
    lines = [x.strip() for x in blob.splitlines() if x.strip()]
    idx = lines.index("P103C2")
    tch = lines[:idx]
    rooms = ["P303C2"] + lines[idx:]
    glue = tch[-1]
    assert glue.endswith("P303C2"), glue
    tch[-1] = glue[: -len("P303C2")].rstrip()
    return tch, rooms


def norm_teacher(s: str) -> str:
    return re.sub(r"\s*-\s*", " - ", s.replace("–", "-").strip())


def teacher_for_room(i: int, teachers: list[str]) -> str:
    if i == 0:
        return norm_teacher(teachers[-1])
    return norm_teacher(teachers[i + 1])


def dedupe_room_codes(codes: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    out: list[str] = []
    for c in codes:
        if c not in seen:
            seen[c] = 1
            out.append(c)
        else:
            n = seen[c]
            seen[c] = n + 1
            out.append(f"{c}_{n}")
    return out


def load_templates(seed_path: Path) -> dict[str, dict[str, str]]:
    d: dict[str, dict[str, str]] = {}
    txt = seed_path.read_text(encoding="utf-8")
    for m in INSERT_RE.finditer(txt):
        d[m.group("room")] = {k: m.group(k) for k in m.groupdict()}
    return d


def sql_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "''")


def template_key(rd: str) -> str:
    return rd.rsplit("_", 1)[0] if re.fullmatch(r".+_\d+", rd) else rd


def default_gddn(fl: str, label: str) -> dict[str, str]:
    return {
        "building": "GDDN",
        "floor": fl,
        "class_using": f"K65.{label}",
        "department": "Giảng đường đa năng",
        "capacity": "50",
        "status": "IN_USE",
        "class_studying": f"K65.{label}",
        "desk": "25",
        "chair": "50",
        "spk": "2",
        "ac": "2",
        "mic": "1",
        "glass": "INTACT",
        "fan": "4",
        "curtain": "YES",
    }


def inferred_meta(k: str) -> dict[str, str]:
    m = re.fullmatch(r"(\d{3})DN", k)
    if m:
        return default_gddn(m.group(1)[0], "DNGN_AUTO")

    m = re.fullmatch(r"P(\d)(\d{2})C(\d)", k.upper())
    if m:
        fl_g, _, cnum = m.group(1), m.group(2), m.group(3)
        return {
            "building": f"C{cnum}",
            "floor": fl_g,
            "class_using": "K65.P_FFC_C_AUTO",
            "department": "Nhà C",
            "capacity": "50",
            "status": "IN_USE",
            "class_studying": "K65.P_FFC_C_AUTO",
            "desk": "25",
            "chair": "50",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    m = re.fullmatch(r"P(\d)(\d{2})E(\d+[A-Za-z]*)", k.upper())
    if m:
        flo, _, e_rest = m.group(1), m.group(2), m.group(3)
        building = f"E{e_rest}"
        return {
            "building": building,
            "floor": flo,
            "class_using": "K65.P_FFC_E_AUTO",
            "department": "Nhà E",
            "capacity": "50",
            "status": "IN_USE",
            "class_studying": "K65.P_FFC_E_AUTO",
            "desk": "25",
            "chair": "50",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    m = re.fullmatch(r"P(\d)E(\d+)([A-Z])?$", k.upper())
    if m:
        suf = (m.group(3) or "")
        building = f"E{m.group(2)}{suf}".rstrip()
        return {
            "building": building,
            "floor": m.group(1),
            "class_using": "K65.P_E_SHORT",
            "department": "Nhà E",
            "capacity": "50",
            "status": "IN_USE",
            "class_studying": "K65.P_E_SHORT",
            "desk": "25",
            "chair": "50",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    m = re.fullmatch(r"P(\d+)E(\d+)-(\d+)", k.upper())
    if m:
        return {
            "building": f"E{m.group(2)}",
            "floor": m.group(1),
            "class_using": f"K65.E{m.group(2)}-{m.group(3)}",
            "department": "Nhà E",
            "capacity": "48",
            "status": "IN_USE",
            "class_studying": f"K65.E{m.group(2)}-{m.group(3)}",
            "desk": "24",
            "chair": "48",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    m = re.fullmatch(r"(\d)E(\d+)-(\d+)", k)
    if m:
        return {
            "building": f"E{m.group(2)}",
            "floor": m.group(1),
            "class_using": f"K65.SH_E{m.group(3)}",
            "department": "Nhà E",
            "capacity": "48",
            "status": "IN_USE",
            "class_studying": f"K65.SH_E{m.group(3)}",
            "desk": "24",
            "chair": "48",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    m = re.fullmatch(r"(\d{3})(E\d+)", k.upper())
    if m:
        return {
            "building": m.group(2),
            "floor": m.group(1)[0],
            "class_using": "K65.THREE_DIG_E",
            "department": "Nhà E",
            "capacity": "50",
            "status": "IN_USE",
            "class_studying": "K65.THREE_DIG_E",
            "desk": "25",
            "chair": "50",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    specials: dict[str, tuple[str, str, str]] = {
        "HT C1": ("C1", "1", "Hiệu trưởng C1"),
        "Sân tập": ("GDDN", "1", "Sân tập"),
        "Hồ bơi": ("GDDN", "1", "Hồ bơi"),
        "Thực hành bên ngoài": ("KHAC", "1", "TH ngoài khuôn viên"),
        "Học bên ngoài": ("KHAC", "1", "HB ngoài khuôn viên"),
        "Sân E7": ("E7", "1", "Sân E7"),
        "Hội thảo thư viện": ("KHAC", "1", "Hội thảo TT"),
        "101E1": ("E1", "1", "Tòa E1"),
        "101E6": ("E6", "1", "Tòa E6"),
        "P01C3": ("C3", "0", "Nhà C3"),
        "P1C3": ("C3", "1", "Nhà C3"),
    }
    if k in specials:
        b, fl, dept = specials[k]
        tag = k.replace(" ", "_").upper()[:26]
        return {
            "building": b,
            "floor": fl,
            "class_using": f"K65.{tag}",
            "department": dept,
            "capacity": "50",
            "status": "IN_USE",
            "class_studying": f"K65.{tag}",
            "desk": "25",
            "chair": "50",
            "spk": "2",
            "ac": "2",
            "mic": "1",
            "glass": "INTACT",
            "fan": "4",
            "curtain": "YES",
        }

    raise ValueError(f"Không suy ra meta cho: {k}")


def row_for(rd: str, tpl: dict[str, dict[str, str]]) -> dict[str, str]:
    key = template_key(rd)
    if key in tpl:
        return dict(tpl[key])
    return inferred_meta(key)


def build_sql_rows(
    rooms_disp: list[str], teachers: list[str], tpl: dict[str, dict[str, str]]
) -> list[str]:
    rows: list[str] = []
    for i, rd in enumerate(rooms_disp):
        meta = row_for(rd, tpl)
        tch = teacher_for_room(i, teachers)
        rows.append(
            "INSERT INTO rooms (id, room_code, building_code, floor, class_using, department, capacity, "
            "status, teacher_name, class_studying, desk_count, chair_count, speaker_count, "
            "air_conditioner_count, microphone_count, glass_door_status, ceiling_fan_count, curtain_status) "
            f"VALUES ({i + 1}, '{sql_escape(rd)}', '{sql_escape(meta['building'])}', {int(meta['floor'])}, "
            f"'{sql_escape(meta['class_using'])}', '{sql_escape(meta['department'])}', "
            f"{int(meta['capacity'])}, '{sql_escape(meta['status'])}', '{sql_escape(tch)}', "
            f"'{sql_escape(meta['class_studying'])}', {int(meta['desk'])}, {int(meta['chair'])}, "
            f"{int(meta['spk'])}, {int(meta['ac'])}, {int(meta['mic'])}, '{sql_escape(meta['glass'])}', "
            f"{int(meta['fan'])}, '{sql_escape(meta['curtain'])}');"
        )
    return rows


def main() -> None:
    prev = BASE / "seed_rooms_giao_vien.sql"
    tpl_old = load_templates(prev)
    blob = extract_blob()
    teachers, rooms = parse_teachers_rooms(blob)
    rdisp = dedupe_room_codes(rooms)

    paired = []
    for i, rd in enumerate(rdisp):
        meta = row_for(rd, tpl_old)
        paired.append(
            {
                "room_code": rd,
                "building_code": meta["building"],
                "floor": int(meta["floor"]),
                "class_using": meta["class_using"],
                "capacity": int(meta["capacity"]),
                "status": meta["status"],
                "teacher_name": teacher_for_room(i, teachers),
                "class_studying": meta["class_studying"],
                "desk_count": int(meta["desk"]),
                "chair_count": int(meta["chair"]),
                "speaker_count": int(meta["spk"]),
                "air_conditioner_count": int(meta["ac"]),
                "microphone_count": int(meta["mic"]),
                "glass_door_status": meta["glass"],
                "ceiling_fan_count": int(meta["fan"]),
                "curtain_status": meta["curtain"],
            }
        )
    (BASE / "rooms_teacher_from_user_order.json").write_text(
        json.dumps(paired, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    header = (
        "-- Seed phòng + giáo viên — thứ tự & ghép GV theo danh sách user (generate_seed_from_user_blob.py)\n"
        "SET NAMES utf8mb4;\n"
        "SET CHARACTER SET utf8mb4;\n"
        "SET FOREIGN_KEY_CHECKS = 0;\n"
        "UPDATE assets SET room_id = NULL WHERE room_id IS NOT NULL;\n"
        "DELETE FROM rooms;\n"
        "SET FOREIGN_KEY_CHECKS = 1;\n\n"
    )
    body = "\n".join(build_sql_rows(rdisp, teachers, tpl_old))
    footer = f"\n-- Tổng: {len(rdisp)} phòng (room_code trùng → _2)\n"
    SEED_OUT.write_text(header + body + footer, encoding="utf-8")
    print("OK", SEED_OUT, len(rdisp))


if __name__ == "__main__":
    main()
