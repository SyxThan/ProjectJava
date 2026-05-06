package com.example.Rent_room.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.Rent_room.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmail(String email);

    @Query("select count(u) > 0 from User u where u.so_dien_thoai = :soDienThoai")
    boolean existsBySoDienThoai(@Param("soDienThoai") String soDienThoai);
}
