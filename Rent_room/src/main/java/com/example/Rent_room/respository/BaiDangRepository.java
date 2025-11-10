package com.example.Rent_room.respository;

import com.example.Rent_room.entity.TrangThaiBaiDang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Rent_room.entity.BaiDangChoThue;
import java.util.*;

public interface BaiDangRepository extends JpaRepository<BaiDangChoThue, Integer> {
    List<BaiDangChoThue> findByTrangThai(TrangThaiBaiDang status);

    @Query("select b from BaiDangChoThue b where b.gia_thang >= :costMin and b.gia_thang <= :costMax")
    List<BaiDangChoThue> findByGiaThangBetween(@Param("costMin") Double costMin,@Param("costMax") Double costMax);
}
