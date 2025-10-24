package com.example.Rent_room.service;

import com.example.Rent_room.entity.User;
import com.example.Rent_room.respository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    // Tiêm dependency qua constructor
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Lấy tất cả user
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Lấy user theo ID
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    // Thêm hoặc cập nhật user
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // Xóa user
    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
    }
}
