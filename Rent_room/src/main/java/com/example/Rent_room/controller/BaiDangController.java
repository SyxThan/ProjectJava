package com.example.Rent_room.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.GeocodeResponseDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.BaiDangService;

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
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        baiDang.setNguoiDang(currentUser);
        return baiDangService.saveBaiDang(baiDang);
    }

    // Admin duyệt bài
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('QUAN_TRI_VIEN')")
    public BaiDangChoThue updateStatus(@PathVariable Integer id,
                                       @RequestParam TrangThaiBaiDang status) {
        return baiDangService.updateStatus(id, status);
    }

    // Lấy danh sách bài theo trạng thái
    // Chỉ admin mới được xem bài PENDING
    @GetMapping("/status/{status}")
    public List<BaiDangChoThue> getByStatus(@PathVariable String status) {
        try {
            TrangThaiBaiDang trangThai = TrangThaiBaiDang.valueOf(status.toUpperCase());
            
            // Nếu là PENDING, chỉ admin được xem
            if (trangThai == TrangThaiBaiDang.PENDING) {
                User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (currentUser == null || !currentUser.getRole().equals(User.Role.quan_tri_vien)) {
                    throw new AccessDeniedException("Bạn không có quyền xem bài đăng đang chờ duyệt");
                }
            }
            
            return baiDangService.getByStatus(trangThai);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
    }


    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        BaiDangChoThue post = baiDangService.getBaiDangById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        if (!post.getNguoiDang().getId().equals(currentUser.getId())
                && !currentUser.getRole().equals(User.Role.quan_tri_vien)) {
            throw new AccessDeniedException("Bạn không có quyền xóa bài đăng này");
        }
        baiDangService.deleteBaiDang(id);
    }

    @GetMapping("/{id}/geocode")
    public GeocodeResponseDTO geocodeBaiDang(@PathVariable Integer id) {
        return baiDangService.geocodeBaiDang(id);
    }
}

