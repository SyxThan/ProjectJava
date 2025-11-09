package com.example.Rent_room.controller;

import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.service.BaiDangService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/baidang")
public class BaiDangController {

    private final BaiDangService baiDangService;

    public BaiDangController(BaiDangService baiDangService) {
        this.baiDangService = baiDangService;
    }

    @GetMapping
    public List<BaiDangChoThue> getAll() {
        return baiDangService.getAllBaiDang();
    }

    @GetMapping("/{id}")
    public Optional<BaiDangChoThue> getById(@PathVariable Integer id) {
        return baiDangService.getBaiDangById(id);
    }

    @GetMapping("/cost/{costMin}to{costMax}")
    public List<BaiDangChoThue> getByCostRange(@PathVariable Double costMin, @PathVariable Double costMax) {
        return baiDangService.getBaiDangByCostRange(costMin, costMax);
    }
 

    @PostMapping
    public BaiDangChoThue create(@RequestBody BaiDangChoThue baiDang) {
        return baiDangService.saveBaiDang(baiDang);
    }

    // Admin duyệt bài
    @PutMapping("/{id}/status")
    public BaiDangChoThue updateStatus(@PathVariable Integer id,
                                       @RequestParam TrangThaiBaiDang status,
                                       @RequestParam String role) {

        if (!role.equals("ADMIN")) {
            throw new RuntimeException("Bạn không có quyền duyệt bài!");
        }

        return baiDangService.updateStatus(id, status);
    }

    // Lấy danh sách bài theo trạng thái
    @GetMapping("/status/{status}")
    public List<BaiDangChoThue> getByStatus(@PathVariable TrangThaiBaiDang status) {
        return baiDangService.getByStatus(status);
    }


    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        baiDangService.deleteBaiDang(id);
    }
}

