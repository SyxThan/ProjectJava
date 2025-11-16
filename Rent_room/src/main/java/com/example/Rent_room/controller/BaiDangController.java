package com.example.Rent_room.controller;

import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.dto.GeocodeResponseDTO;
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

    // Endpoint cũ - lấy tất cả không phân trang
    @GetMapping("/all")
    public List<BaiDangChoThue> getAll() {
        return baiDangService.getAllBaiDang();
    }
    
    // Endpoint mới - lấy với phân trang và filter
    @GetMapping
    public PaginationResponseDTO<BaiDangOutputDTO> getAllWithPagination(
            @RequestParam(defaultValue = "0") int page,           // Trang hiện tại (bắt đầu từ 0)
            @RequestParam(defaultValue = "10") int size,          // Số items mỗi trang
            @RequestParam(required = false) String tinhThanh,     // Filter theo tỉnh/thành phố
            @RequestParam(required = false) String phuongXa,      // Filter theo phường/xã
            @RequestParam(required = false) Double giaMin,        // Giá tối thiểu
            @RequestParam(required = false) Double giaMax,        // Giá tối đa
            @RequestParam(required = false) Float dienTichMin,    // Diện tích tối thiểu
            @RequestParam(required = false) Float dienTichMax,    // Diện tích tối đa
            @RequestParam(required = false) TrangThaiBaiDang trangThai  // Trạng thái bài đăng
    ) {
        return baiDangService.getAllBaiDangWithPagination(
            page, size, tinhThanh, phuongXa, giaMin, giaMax, 
            dienTichMin, dienTichMax, trangThai
        );
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

    // ===============================================================
    // =================== Phần này của Sỹ Kẹo =======================
    // ===============================================================

    @GetMapping("/{id}/geocode")
    public GeocodeResponseDTO geocodeBaiDang(@PathVariable Integer id) {
        return baiDangService.geocodeBaiDang(id);
    }
}

