package com.example.Rent_room.repository;

import com.example.Rent_room.entity.BinhLuanTimPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BinhLuanTimPhongRepository extends JpaRepository<BinhLuanTimPhong, Integer> {

    List<BinhLuanTimPhong> findByBaiDangTimPhongIdAndBinhLuanChaIsNull(Integer baiDangId);

    List<BinhLuanTimPhong> findByBaiDangTimPhongId(Integer baiDangId);

    List<BinhLuanTimPhong> findByBinhLuanChaId(Integer parentCommentId);

    List<BinhLuanTimPhong> findByUserId(Integer userId);

    void deleteById(Integer id);
}
