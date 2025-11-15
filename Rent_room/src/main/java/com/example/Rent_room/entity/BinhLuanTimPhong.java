package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.sql.Timestamp;
import java.util.List;

@Entity
@Table(name = "binh_luan_tim_phong")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BinhLuanTimPhong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_bai_dang_tim_phong", nullable = false)
    private BaiDangTimPhongEntity baiDangTimPhong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_binh_luan_cha")
    private BinhLuanTimPhong binhLuanCha;

    @OneToMany(mappedBy = "binhLuanCha", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BinhLuanTimPhong> binhLuanCon;

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private Timestamp ngayTao;

    @Column(name = "ngay_cap_nhat")
    private Timestamp ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        ngayTao = new Timestamp(System.currentTimeMillis());
        ngayCapNhat = new Timestamp(System.currentTimeMillis());
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = new Timestamp(System.currentTimeMillis());
    }
}
