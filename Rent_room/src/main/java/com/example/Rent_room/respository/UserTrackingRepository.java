package com.example.Rent_room.respository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rent_room.entity.UserTracking;
import com.example.Rent_room.entity.BaiDangChoThue;

public interface UserTrackingRepository extends JpaRepository<UserTracking, Integer> {
 
   
    @Query("SELECT ut FROM UserTracking ut WHERE ut.user_id = :user_id AND ut.bai_dang_id = :bai_dang_id AND ut.type = 'like'")
    List<UserTracking> isLove(
        @Param("user_id") Integer user_id,
        @Param("bai_dang_id") Integer bai_dang_id
    );

   
    @Modifying
    @Transactional
    @Query("DELETE FROM UserTracking ut WHERE ut.user_id = :user_id AND ut.bai_dang_id = :bai_dang_id AND ut.type = 'like'")
    int deleteLike(
        @Param("user_id") Integer user_id,
        @Param("bai_dang_id") Integer bai_dang_id
    );

    
    @Query(
        value = "SELECT b.* FROM bai_dang_cho_thue b " +
                "INNER JOIN user_tracking ut ON b.id = ut.bai_dang_id " +
                "WHERE ut.user_id = :user_id AND ut.type = 'like' " +
                "ORDER BY ut.id DESC",
        nativeQuery = true
    )
    List<BaiDangChoThue> listLike(@Param("user_id") Integer user_id);

}
