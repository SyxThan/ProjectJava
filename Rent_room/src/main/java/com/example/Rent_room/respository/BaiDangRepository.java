package com.example.Rent_room.respository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.Rent_room.entity.BaiDangChoThue;

public interface BaiDangRepository extends JpaRepository<BaiDangChoThue, Integer> {
}
