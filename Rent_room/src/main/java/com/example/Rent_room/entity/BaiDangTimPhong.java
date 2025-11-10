package com.example.Rent_room.entity;

import java.security.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bai_dang_tim_phong")
@Getter
@Setter
@NoArgsConstructor 
@AllArgsConstructor
public class BaiDangTimPhong {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tieu_de")
    private String tieuDe;
    
    @Column(name = "mo_ta")
    private String moTa;

    @Column(name = "khu_vuc_mong_muon_xa")
    private String khuVucMongMuonXa;

    @Column(name = "khu_vuc_mong_muon_thanhpho")
    private String khuVucMongMuonThanhpho;

    @Column(name = "gia_thap_nhat")
    private Long giaThapNhat;

    @Column(name = "gia_cao_nhat")
    private Long giaCaoNhat;

    @Column(name ="dien_tich_toi_thieu")
    private Float dienTichToiThieu;

    @Column(name = "so_nguoi_o")
    private Integer soNguoiO;

    @Column(name = "trang_thai")
    @Enumerated(EnumType.STRING)
    private TrangThaiTimPhong trangThai;

    @Column(name = "ngay_dang")
    private Timestamp ngayDang;

    @Column(name = "ngay_cap_nhat")
    private Timestamp ngayCapNhat;
}
