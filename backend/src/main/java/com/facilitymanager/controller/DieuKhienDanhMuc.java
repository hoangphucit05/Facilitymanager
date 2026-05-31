package com.facilitymanager.controller;

import com.facilitymanager.dto.DanhMucDto;
import com.facilitymanager.entity.DanhMuc;
import com.facilitymanager.repository.DanhMucRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class DieuKhienDanhMuc {

    private final DanhMucRepository repo;

    public DieuKhienDanhMuc(DanhMucRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<DanhMucDto> list(@RequestParam(required = false) String type) {
        List<DanhMuc> rows;
        if (type != null && !type.isBlank()) {
            rows = repo.findByTypeOrderByIdAsc(type.trim().toUpperCase());
        } else {
            rows = repo.findAllByOrderByIdAsc();
        }
        return rows.stream().map(DanhMucDto::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DanhMucDto> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(c -> ResponseEntity.ok(DanhMucDto.fromEntity(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DanhMucDto dto) {
        String code = resolveCode(dto);
        String name = resolveName(dto);
        if (code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Mã danh mục không được để trống"));
        }
        if (name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("thongDiep", "Tên danh mục không được để trống"));
        }
        if (repo.findByCode(code).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("thongDiep", "Mã danh mục đã tồn tại"));
        }
        DanhMuc c = new DanhMuc();
        dto.applyTo(c);
        c.setCode(code);
        c.setName(name);
        if (c.getType() == null || c.getType().isBlank()) {
            c.setType("ASSET");
        }
        DanhMuc saved = repo.save(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(DanhMucDto.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DanhMucDto dto) {
        return repo.findById(id)
                .map(c -> {
                    String newCode = resolveCode(dto);
                    if (!newCode.isBlank() && !newCode.equalsIgnoreCase(c.getCode())) {
                        if (repo.findByCode(newCode).filter(other -> !other.getId().equals(id)).isPresent()) {
                            return ResponseEntity.status(HttpStatus.CONFLICT)
                                    .body(Map.of("thongDiep", "Mã danh mục đã tồn tại"));
                        }
                        c.setCode(newCode);
                    }
                    String newName = resolveName(dto);
                    if (!newName.isBlank()) {
                        c.setName(newName);
                    }
                    dto.applyTo(c);
                    DanhMuc saved = repo.save(c);
                    return ResponseEntity.ok(DanhMucDto.fromEntity(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            repo.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("thongDiep", "Không thể xóa danh mục đang được tài sản sử dụng"));
        }
    }

    private static String resolveCode(DanhMucDto dto) {
        if (dto.getCode() != null && !dto.getCode().isBlank()) {
            return dto.getCode().trim();
        }
        if (dto.getCategoryCode() != null && !dto.getCategoryCode().isBlank()) {
            return dto.getCategoryCode().trim();
        }
        return "";
    }

    private static String resolveName(DanhMucDto dto) {
        if (dto.getName() != null && !dto.getName().isBlank()) {
            return dto.getName().trim();
        }
        if (dto.getCategoryName() != null && !dto.getCategoryName().isBlank()) {
            return dto.getCategoryName().trim();
        }
        return "";
    }
}
