package com.example.Rent_room.controller;

import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 🔹 Lấy tất cả user (chỉ khi JWT hợp lệ)
    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    // 🔹 Lấy user theo ID
    @GetMapping("/{id}")
    public Optional<User> getById(@PathVariable Integer id) {
        return userService.getUserById(id);
    }
}
