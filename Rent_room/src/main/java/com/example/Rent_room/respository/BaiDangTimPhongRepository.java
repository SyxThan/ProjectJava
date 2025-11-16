package com.example.Rent_room.respository;

import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.TrangThaiTimPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BaiDangTimPhongRepository extends JpaRepository<BaiDangTimPhongEntity, Integer> {
    Optional<BaiDangTimPhongEntity> findById(Integer id);

    @Query("SELECT b FROM BaiDangTimPhongEntity b JOIN FETCH b.user WHERE b.id = :id")
    Optional<BaiDangTimPhongEntity> findByIdWithUser(@Param("id") Integer id);

    @Query("SELECT b FROM BaiDangTimPhongEntity b WHERE " +
            "(:thanhPho IS NULL OR b.khuVucMongMuonThanhPho LIKE CONCAT('%', :thanhPho, '%')) AND " +
            "(:xa IS NULL OR b.khuVucMongMuonXa LIKE CONCAT('%', :xa, '%')) AND " +
            "(:giaMin IS NULL OR b.giaThapNhat >= :giaMin) AND " +
            "(:giaMax IS NULL OR b.giaCaoNhat <= :giaMax) AND " +
            "(:dienTichMin IS NULL OR b.dienTichToiThieu >= :dienTichMin) AND " +
            "(:dienTichMax IS NULL OR b.dienTichToiThieu <= :dienTichMax) AND " +
            "(:trangThai IS NULL OR b.trangThaiTimPhong = :trangThai) " +
            "ORDER BY b.ngayDang DESC")
    List<BaiDangTimPhongEntity> findWithFilters(
            @Param("thanhPho") String thanhPho,
            @Param("xa") String xa,
            @Param("giaMin") BigDecimal giaMin,
            @Param("giaMax") BigDecimal giaMax,
            @Param("dienTichMin") Float dienTichMin,
            @Param("dienTichMax") Float dienTichMax,
            @Param("trangThai") TrangThaiTimPhong trangThai);

    @Query("SELECT COUNT(b) FROM BaiDangTimPhongEntity b WHERE " +
            "(:thanhPho IS NULL OR b.khuVucMongMuonThanhPho LIKE CONCAT('%', :thanhPho, '%')) AND " +
            "(:xa IS NULL OR b.khuVucMongMuonXa LIKE CONCAT('%', :xa, '%')) AND " +
            "(:giaMin IS NULL OR b.giaThapNhat >= :giaMin) AND " +
            "(:giaMax IS NULL OR b.giaCaoNhat <= :giaMax) AND " +
            "(:dienTichMin IS NULL OR b.dienTichToiThieu >= :dienTichMin) AND " +
            "(:dienTichMax IS NULL OR b.dienTichToiThieu <= :dienTichMax) AND " +
            "(:trangThai IS NULL OR b.trangThaiTimPhong = :trangThai)")
    long countWithFilters(
            @Param("thanhPho") String thanhPho,
            @Param("xa") String xa,
            @Param("giaMin") BigDecimal giaMin,
            @Param("giaMax") BigDecimal giaMax,
            @Param("dienTichMin") Float dienTichMin,
            @Param("dienTichMax") Float dienTichMax,
            @Param("trangThai") TrangThaiTimPhong trangThai);
}
