package com.example.Rent_room.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.UserService;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CHU_TRO','QUAN_TRI_VIEN')")
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHU_TRO','QUAN_TRI_VIEN')")
    public Optional<User> getById(@PathVariable Integer id) {
        return userService.getUserById(id);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        User user = (User) authentication.getPrincipal();
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("email", user.getEmail());
        userInfo.put("fullname", user.getFullname());
        userInfo.put("so_dien_thoai", user.getSo_dien_thoai());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("role", user.getRole() != null ? user.getRole().name() : null);
        userInfo.put("ngay_tao", user.getNgay_tao());
        userInfo.put("ngay_cap_nhat", user.getNgay_cap_nhat());
        
        return ResponseEntity.ok(userInfo);
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateCurrentUser(@RequestBody Map<String, Object> updates) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        User currentUser = (User) authentication.getPrincipal();
        Integer userId = currentUser.getId();
        
        Optional<User> userOpt = userService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        User user = userOpt.get();
        
        // Update fields
        if (updates.containsKey("fullname")) {
            user.setFullname((String) updates.get("fullname"));
        }
        if (updates.containsKey("so_dien_thoai")) {
            user.setSo_dien_thoai((String) updates.get("so_dien_thoai"));
        }
        if (updates.containsKey("avatar")) {
            user.setAvatar((String) updates.get("avatar"));
        }
        
        user.setNgay_cap_nhat(java.time.LocalDateTime.now());
        User savedUser = userService.saveUser(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cập nhật thông tin thành công");
        response.put("id", savedUser.getId());
        response.put("fullname", savedUser.getFullname());
        response.put("so_dien_thoai", savedUser.getSo_dien_thoai());
        response.put("avatar", savedUser.getAvatar());
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> passwordData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        User currentUser = (User) authentication.getPrincipal();
        
        String currentPassword = passwordData.get("currentPassword");
        String newPassword = passwordData.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin mật khẩu"));
        }
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, currentUser.getHash_password())) {
            return ResponseEntity.status(400).body(Map.of("error", "Mật khẩu hiện tại không đúng"));
        }
        
        // Update password
        currentUser.setHash_password(passwordEncoder.encode(newPassword));
        currentUser.setNgay_cap_nhat(java.time.LocalDateTime.now());
        userService.saveUser(currentUser);
        
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
