package com.example.Rent_room.repository;

import com.example.Rent_room.entity.TrangThaiBaiDang;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Rent_room.entity.BaiDangChoThue;
import java.util.*;

public interface BaiDangRepository extends JpaRepository<BaiDangChoThue, Integer> {
    List<BaiDangChoThue> findByTrangThai(TrangThaiBaiDang status);

    @Query("select b from BaiDangChoThue b where b.gia_thang >= :costMin and b.gia_thang <= :costMax")
    List<BaiDangChoThue> findByGiaThangBetween(@Param("costMin") Double costMin,@Param("costMax") Double costMax);
    
    // Query với filter động và phân trang native (Pageable)
    @Query("SELECT b FROM BaiDangChoThue b WHERE " +
           "(:tinhThanh IS NULL OR b.tinh_thanhpho LIKE %:tinhThanh%) AND " +
           "(:phuongXa IS NULL OR b.phuong_xa LIKE %:phuongXa%) AND " +
           "(:giaMin IS NULL OR b.gia_thang >= :giaMin) AND " +
           "(:giaMax IS NULL OR b.gia_thang <= :giaMax) AND " +
           "(:dienTichMin IS NULL OR b.dien_tich_m2 >= :dienTichMin) AND " +
           "(:dienTichMax IS NULL OR b.dien_tich_m2 <= :dienTichMax) AND " +
           "(:trangThai IS NULL OR b.trangThai = :trangThai)")
    Page<BaiDangChoThue> findWithFilters(
        @Param("tinhThanh") String tinhThanh,
        @Param("phuongXa") String phuongXa,
        @Param("giaMin") Double giaMin,
        @Param("giaMax") Double giaMax,
        @Param("dienTichMin") Float dienTichMin,
        @Param("dienTichMax") Float dienTichMax,
        @Param("trangThai") TrangThaiBaiDang trangThai,
        Pageable pageable
    );
}
