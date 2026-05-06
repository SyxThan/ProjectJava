package com.example.Rent_room.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.dto.UserDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('QUAN_TRI_VIEN')") // Chỉ admin mới vào được toàn bộ endpoint
public class AdminController {

    private final AdminService adminService;

    // Constructor injection
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // 🔹 Dashboard - Thống kê tổng quan
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStats() {
        return adminService.getDashboardStats();
    }

    // 🔹 Lấy tất cả user
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return adminService.getAllUsers();
    }

    // 🔹 Lấy user theo ID
    @GetMapping("/users/{id}")
    public Optional<User> getUserById(@PathVariable Integer id) {
        return adminService.getUserById(id);
    }

    // 🔹 Cập nhật role cho user
    @PutMapping("/assign-role/{id}")
    public String assignRole(@PathVariable Integer id, @RequestParam String role) {
        return adminService.assignRole(id, role);
    }

    // 🔹 Cập nhật thông tin user
    @PutMapping("/update-user/{id}")
    public String updateUser(@PathVariable Integer id, @RequestBody UserDTO dto) {
        return adminService.updateUser(id, dto);
    }

    // 🔹 Xóa user
    @DeleteMapping("/delete-user/{id}")
    public String deleteUser(@PathVariable Integer id) {
        return adminService.deleteUser(id);
    }

    // 🔹 Lấy tất cả bài đăng cho thuê (không phân biệt trạng thái) - không phân trang
    @GetMapping("/posts")
    public List<BaiDangChoThue> getAllPosts() {
        return adminService.getAllBaiDang();
    }

    // 🔹 Lấy bài đăng cho thuê có phân trang
    @GetMapping("/posts/paged")
    public PaginationResponseDTO<BaiDangChoThue> getAllPostsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return adminService.getAllBaiDangPaged(pageable);
    }
}
