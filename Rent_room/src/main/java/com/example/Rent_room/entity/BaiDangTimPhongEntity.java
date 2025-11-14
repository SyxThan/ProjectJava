package com.example.Rent_room.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Getter
@Setter
@Table(name = "bai_dang_tim_phong")
@NoArgsConstructor
@AllArgsConstructor
public class BaiDangTimPhongEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tieu_de", nullable = false)
    private String tieuDe;

    @Column(name = "mo_ta")
    private String moTa;

    @Column(name = "khu_vuc_mong_muon_xa")
    private String khuVucMongMuonXa;

    @Column(name = "khu_vuc_mong_muon_thanhpho")
    private String khuVucMongMuonThanhPho;

    @Column(name = "gia_thap_nhat", nullable = false)
    private BigDecimal giaThapNhat;

    @Column(name = "gia_cao_nhat", nullable = false)
    private BigDecimal giaCaoNhat;

    @Column(name = "dien_tich_toi_thieu")
    private Float dienTichToiThieu;

    @Column(name = "so_nguoi_o")
    private Integer soNguoiO;

    @Column(name = "trang_thai", nullable = false)
    @Enumerated(EnumType.STRING)
    private TrangThaiTimPhong trangThaiTimPhong;

    @Column(name = "ngay_dang")
    @CreationTimestamp
    private Timestamp ngayDang;

    @Column(name = "ngay_cap_nhat")
    @UpdateTimestamp
    private Timestamp ngayCapNhat;
}
