package com.example.Rent_room.respository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Rent_room.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmail(String email);
}
