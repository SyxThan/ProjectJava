package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "bai_dang_cho_thue")
@Getter
@Setter
public class BaiDangChoThue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Khóa ngoại trỏ đến bảng users
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_nguoi_dang", nullable = false)
//    @JsonIgnore
    private User nguoiDang;

    private String tieu_de;

    @Column(columnDefinition = "TEXT")
    private String mo_ta;

    private String dia_chi_day_du;
    private String phuong_xa;
    private String tinh_thanhpho;
    private Double vi_do;
    private Double kinh_do;

    @Column(name = "gia_thang")
    private Double gia_thang;
    
    private Float dien_tich_m2;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai")
    private TrangThaiBaiDang trangThai = TrangThaiBaiDang.PENDING;

    private LocalDateTime ngay_co_the_vao_o;
    private LocalDateTime ngay_dang;
    private LocalDateTime ngay_cap_nhat;

    @OneToMany(mappedBy = "baiDangChoThue", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<HinhAnhPhongTro> hinhAnhPhongTro;

    public BaiDangChoThue() {}

    public BaiDangChoThue(Integer id) {
        this.id = id;
    }
}