package com.example.Rent_room.respository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.Rent_room.entity.BaiDangChoThue;
import java.util.*;

public interface BaiDangRepository extends JpaRepository<BaiDangChoThue, Integer> {
    List<BaiDangChoThue> findByGiaThangBetween(Double costMin, Double costMax);
}
