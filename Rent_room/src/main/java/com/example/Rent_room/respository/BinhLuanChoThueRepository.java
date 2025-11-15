package com.example.Rent_room.respository;

import com.example.Rent_room.entity.BinhLuanChoThue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BinhLuanChoThueRepository extends JpaRepository<BinhLuanChoThue, Integer> {

    List<BinhLuanChoThue> findByBaiDangChoThueIdAndBinhLuanChaIsNull(Integer baiDangId);

    List<BinhLuanChoThue> findByBaiDangChoThueId(Integer baiDangId);

    List<BinhLuanChoThue> findByBinhLuanChaId(Integer parentCommentId);

    List<BinhLuanChoThue> findByUserId(Integer userId);

    void deleteById(Integer id);
}
