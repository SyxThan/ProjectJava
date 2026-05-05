package com.example.Rent_room.controller;

import com.example.Rent_room.dto.UserDTO;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('QUAN_TRI_VIEN')") // Chỉ admin mới vào được toàn bộ endpoint
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection (khuyến nghị)
    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 🔹 Lấy tất cả user
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 🔹 Lấy user theo ID
    @GetMapping("/users/{id}")
    public Optional<User> getUserById(@PathVariable Integer id) {
        return userRepository.findById(id);
    }

    // 🔹 Cập nhật role cho user
    @PutMapping("/assign-role/{id}")
    public String assignRole(@PathVariable Integer id, @RequestParam String role) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }

        User user = optionalUser.get();

        try {
            user.setRole(User.Role.valueOf(role.toLowerCase())); // role phải là "nguoi_thue", "chu_tro", "quan_tri_vien"
        } catch (IllegalArgumentException e) {
            return "Role không hợp lệ!";
        }

        user.setNgay_cap_nhat(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật role thành công cho user " + user.getEmail();
    }

    // 🔹 Cập nhật thông tin user
    @PutMapping("/update-user/{id}")
    public String updateUser(@PathVariable Integer id, @RequestBody UserDTO dto) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }

        User user = optionalUser.get();
        user.setFullname(dto.getFullname());
        user.setSo_dien_thoai(dto.getSoDienThoai());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setHash_password(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            try {
                user.setRole(User.Role.valueOf(dto.getRole().toLowerCase()));
            } catch (IllegalArgumentException e) {
                return "Role không hợp lệ!";
            }
        }
        user.setNgay_cap_nhat(LocalDateTime.now());
        userRepository.save(user);

        return "Cập nhật user thành công!";
    }

    // 🔹 Xóa user
    @DeleteMapping("/delete-user/{id}")
    public String deleteUser(@PathVariable Integer id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }
        userRepository.deleteById(id);
        return "Xóa user thành công!";
    }
}
