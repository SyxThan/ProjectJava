package com.example.Rent_room.controller;

import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.service.HinhAnhPhongTroService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import java.nio.file.*;
import java.util.Map;

@RestController
@RequestMapping("/api/hinhanh")
public class HinhAnhPhongTroController {

    private final HinhAnhPhongTroService hinhAnhPhongTroService;

    public HinhAnhPhongTroController(HinhAnhPhongTroService hinhAnhPhongTroService) {
        this.hinhAnhPhongTroService = hinhAnhPhongTroService;
    }

    @GetMapping
    public List<HinhAnhPhongTro> getAll() {
        return hinhAnhPhongTroService.getAll();
    }

    @GetMapping("/{id}")
    public Optional<HinhAnhPhongTro> getById(@PathVariable Integer id) {
        return hinhAnhPhongTroService.getById(id);
    }

    @GetMapping("/baidang/{baiDangId}")
    public List<HinhAnhPhongTro> getByBaiDangId(@PathVariable Integer baiDangId) {
        return hinhAnhPhongTroService.getByBaiDangId(baiDangId);
    }

    @GetMapping("/thumbnail/{baiDangId}")
    public HinhAnhPhongTro getThumbnail(@PathVariable Integer baiDangId) {
        return hinhAnhPhongTroService.getThumbnailByBaiDangId(baiDangId);
    }

    @PostMapping
    public HinhAnhPhongTro create(@RequestBody HinhAnhPhongTro hinhAnh) {
        return hinhAnhPhongTroService.save(hinhAnh);
    }

    // Upload hình ảnh
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("baiDangId") Integer baiDangId,
            @RequestParam(value = "laAnhBia", defaultValue = "false") boolean laAnhBia
    ) {
        try {
            String url = hinhAnhPhongTroService.saveImage(file, baiDangId, laAnhBia);
            return ResponseEntity.ok(Map.of(
                    "message", "Upload thành công",
                    "url", url
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Upload thất bại",
                    "error", e.getMessage()
            ));
        }
    }
    // Upload nhiều ảnh cho 1 bài đăng
    @PostMapping("/upload/{baiDangId}")
    public List<HinhAnhPhongTro> upload(@PathVariable Integer baiDangId,
                                        @RequestParam("files") MultipartFile[] files) throws Exception {
        return hinhAnhPhongTroService.uploadAnh(baiDangId, files);
    }

    // Set ảnh bìa
    @PutMapping("/set-thumbnail/{anhId}")
    public HinhAnhPhongTro setThumbnail(@PathVariable Integer anhId) {
        return hinhAnhPhongTroService.setThumbnail(anhId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        hinhAnhPhongTroService.deleteById(id);
    }
}
