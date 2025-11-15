package com.example.Rent_room.dto;

import com.example.Rent_room.respository.HinhAnhPhongTroRepository;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.HinhAnhPhongTro;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BaiDangOutputDTO {
    private Integer id;
    private String tieuDe;
    private String diaChiDayDu;
    private String phuongXa;
    private String tinhThanhpho;
    private Double giaThang;
    private Float dienTichM2;
    private String trangThai;
    private LocalDateTime ngayDang;

    
    // Danh sách tất cả ảnh
    private String anhBia;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NguoiDangInfo {
        private Integer id;
        private String hoTen;
        private String soDienThoai;
        private String email;
    }
    
    // Constructor chuyển từ Entity sang DTO
    public BaiDangOutputDTO(BaiDangChoThue entity) {
        this.id = entity.getId();
        this.tieuDe = entity.getTieu_de();
        this.diaChiDayDu = entity.getDia_chi_day_du();
        this.phuongXa = entity.getPhuong_xa();
        this.tinhThanhpho = entity.getTinh_thanhpho();
        this.giaThang = entity.getGia_thang();
        this.dienTichM2 = entity.getDien_tich_m2();
        this.trangThai = entity.getTrangThai() != null ? entity.getTrangThai().name() : null;
        this.ngayDang = entity.getNgay_dang() != null ? entity.getNgay_dang().toLocalDateTime() : null;
    }
}
