package com.example.Rent_room.controller;

import com.example.Rent_room.entity.User;
import com.example.Rent_room.respository.UserRepository;
import com.example.Rent_room.service.JwtService;
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

    // 🔹 API đăng ký
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();

        if (userRepository.findByEmail(user.getEmail()) != null) {
            response.put("message", "Email đã tồn tại!");
            return response;
        }

        user.setHash_password(passwordEncoder.encode(user.getHash_password()));
        user.setNgay_tao(new Timestamp(System.currentTimeMillis()));
        user.setNgay_cap_nhat(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);

        response.put("message", "Đăng ký thành công!");
        return response;
    }

    // 🔹 API đăng nhập
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String password = request.get("password");

        User user = userRepository.findByEmail(email);
        if (user == null) {
            response.put("message", "Email không tồn tại!");
            return response;
        }

        if (!passwordEncoder.matches(password, user.getHash_password())) {
            response.put("message", "Sai mật khẩu!");
            return response;
        }

        // ✅ Tạo token JWT
        String token = jwtService.generateToken(user.getEmail());

        response.put("message", "Đăng nhập thành công!");
        response.put("token", token);
        response.put("role", user.getRole().name());
        response.put("fullname", user.getFullname());
        return response;
    }
}
