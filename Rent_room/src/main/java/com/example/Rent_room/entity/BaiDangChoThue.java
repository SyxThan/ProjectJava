package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.sql.Timestamp;

@Entity
@Table(name = "bai_dang_cho_thue")
@Getter
@Setter
public class BaiDangChoThue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Khóa ngoại trỏ đến bảng users
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_nguoi_dang", nullable = false)
    @JsonIgnore
    private User nguoiDang;

    private String tieu_de;
    private String mo_ta;
    private String dia_chi_day_du;
    private String phuong_xa;
    private String tinh_thanhpho;
    private Double vi_do;
    private Double kinh_do;
    private Double gia_thang;
    private Float dien_tich_m2;
    private String trang_thai;
    private LocalDateTime ngay_co_the_vao_o;
    private Timestamp ngay_dang;
    private Timestamp ngay_cap_nhat;
}
