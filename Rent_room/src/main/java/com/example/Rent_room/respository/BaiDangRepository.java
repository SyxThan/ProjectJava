package com.example.Rent_room.respository;

import com.example.Rent_room.entity.TrangThaiBaiDang;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.Rent_room.entity.BaiDangChoThue;
import java.util.*;

public interface BaiDangRepository extends JpaRepository<BaiDangChoThue, Integer> {
    List<BaiDangChoThue> findByGiaThangBetween(Double costMin, Double costMax);

    List<BaiDangChoThue> findByTrangThai(TrangThaiBaiDang status);
}
