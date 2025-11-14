package com.example.Rent_room.respository;

import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
@Repository
public interface BaiDangTimPhongRepository extends JpaRepository<BaiDangTimPhongEntity, Integer> {
    List<BaiDangTimPhongEntity> findByUser_Id(Integer userId);

    @Query("select b from BaiDangTimPhongEntity b where b.khuVucMongMuonXa = :xa and b.khuVucMongMuonThanhPho = :thanhPho")
    List<BaiDangTimPhongEntity> findByKhuVuc(@Param("xa") String xa, @Param("thanhPho") String thanhPho);

    @Query("select b from BaiDangTimPhongEntity b where b.giaThapNhat >= :costMin and b.giaCaoNhat <= :costMax")
    List<BaiDangTimPhongEntity> findByRangCost(@Param("costMin") BigDecimal min, @Param("costMax") BigDecimal max);

    @Query("select b from BaiDangTimPhongEntity b where b.giaThapNhat >= :costMin")
    List<BaiDangTimPhongEntity> findByGreater(@Param("costMin") BigDecimal min);

    @Query("select b from BaiDangTimPhongEntity b where b.giaCaoNhat <= :costMax")
    List<BaiDangTimPhongEntity> findByLower(@Param("costMax") BigDecimal max);

    Optional<BaiDangTimPhongEntity> findById(Integer id);
}
