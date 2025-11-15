package com.example.Rent_room.respository;

import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.entity.TrangThaiBaiDang;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HinhAnhPhongTroRepository extends JpaRepository<HinhAnhPhongTro, Integer> {
    // Lấy tất cả ảnh của một bài đăng
    List<HinhAnhPhongTro> findByBaiDangChoThueId(Integer baiDangId);

    // Lấy ảnh đại diện (thumbnail) của bài đăng
    HinhAnhPhongTro findFirstByBaiDangChoThueIdAndLaAnhBiaTrue(Integer baiDangId);

    @Query("SELECT h.duong_dan_anh FROM HinhAnhPhongTro h WHERE h.baiDangChoThue.id = :id AND h.laAnhBia = true")
    String file_anh_nen(@Param("id") Integer id);
  
}