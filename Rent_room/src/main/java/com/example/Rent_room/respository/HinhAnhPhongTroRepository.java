package com.example.Rent_room.respository;

import com.example.Rent_room.entity.HinhAnhPhongTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HinhAnhPhongTroRepository extends JpaRepository<HinhAnhPhongTro, Integer> {
    // Lấy tất cả ảnh của một bài đăng
    List<HinhAnhPhongTro> findByBaiDangChoThueId(Integer baiDangId);

    // Lấy ảnh đại diện (thumbnail) của bài đăng
    HinhAnhPhongTro findFirstByBaiDangChoThueIdAndLaAnhBiaTrue(Integer baiDangId);
}