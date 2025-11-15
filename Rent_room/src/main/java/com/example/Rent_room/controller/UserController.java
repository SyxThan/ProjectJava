package com.example.Rent_room.controller;

import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
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
}
