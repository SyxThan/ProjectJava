package com.example.Rent_room.controller;

import com.example.Rent_room.dto.LoginDTO;
import com.example.Rent_room.dto.RegisterDTO;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.respository.UserRepository;
import com.example.Rent_room.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 🔹 Đăng ký
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody @Valid RegisterDTO dto) {
        Map<String, Object> response = new HashMap<>();

        if (userRepository.findByEmail(dto.getEmail()) != null) {
            response.put("message", "Email đã tồn tại!");
            return response;
        }

        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            response.put("message", "Mật khẩu và xác nhận mật khẩu không khớp!");
            return response;
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setFullname(dto.getFullname());
        user.setSo_dien_thoai(dto.getSoDienThoai());
        user.setHash_password(passwordEncoder.encode(dto.getPassword()));
        user.setRole(User.Role.valueOf(dto.getRole()));
        user.setNgay_tao(new Timestamp(System.currentTimeMillis()));
        user.setNgay_cap_nhat(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);

        response.put("message", "Đăng ký thành công!");
        return response;
    }

    // 🔹 Đăng nhập
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody @Valid LoginDTO dto) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByEmail(dto.getEmail());
        if (user == null) {
            response.put("message", "Email không tồn tại!");
            return response;
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getHash_password())) {
            response.put("message", "Sai mật khẩu!");
            return response;
        }

        String token = jwtService.generateToken(user.getEmail());

        response.put("message", "Đăng nhập thành công!");
        response.put("token", token);
        response.put("role", user.getRole().name());
        response.put("fullname", user.getFullname());
        return response;
    }
}
