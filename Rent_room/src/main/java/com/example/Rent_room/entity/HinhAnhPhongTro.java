package com.example.Rent_room.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "hinh_anh_phong_tro")
@Getter
@Setter
public class HinhAnhPhongTro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    //Khoá ngoại trỏ tới bai_dang_cho_thue
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_bai_dang_cho_thue", nullable = false)
    @JsonIgnore
    private BaiDangChoThue baiDangChoThue;

    @Column(name = "duong_dan_anh", columnDefinition = "TEXT")
    private String duong_dan_anh;

    @Column(name = "la_anh_bia", nullable = true)
    private boolean laAnhBia;
}
