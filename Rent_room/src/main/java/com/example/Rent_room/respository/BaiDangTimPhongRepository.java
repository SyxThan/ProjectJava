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

    // Query để fetch User khi lấy chi tiết
    // Sử dụng JOIN FETCH để đảm bảo User được load cùng với Entity
    @Query("SELECT b FROM BaiDangTimPhongEntity b JOIN FETCH b.user WHERE b.id = :id")
    Optional<BaiDangTimPhongEntity> findByIdWithUser(@Param("id") Integer id);

    // Query với filter động và phân trang thủ công
    // Logic filter giá:
    // - Nếu chỉ có giaMin: b.giaThapNhat >= :giaMin (giá thấp nhất của bài đăng >=
    // giá min filter)
    // - Nếu chỉ có giaMax: b.giaCaoNhat <= :giaMax (giá cao nhất của bài đăng <=
    // giá max filter)
    // - Nếu có cả hai: b.giaThapNhat >= :giaMin AND b.giaCaoNhat <= :giaMax (khoảng
    // giá nằm trong [min, max])
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

    // Đếm số lượng với filter
    // Logic filter giá:
    // - Nếu chỉ có giaMin: b.giaThapNhat >= :giaMin (giá thấp nhất của bài đăng >=
    // giá min filter)
    // - Nếu chỉ có giaMax: b.giaCaoNhat <= :giaMax (giá cao nhất của bài đăng <=
    // giá max filter)
    // - Nếu có cả hai: b.giaThapNhat >= :giaMin AND b.giaCaoNhat <= :giaMax (khoảng
    // giá nằm trong [min, max])
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
