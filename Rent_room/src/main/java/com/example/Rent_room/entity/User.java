package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

@Entity
@Table(name = "user")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fullname;
    private String email;
    private String so_dien_thoai;
    private String hash_password;
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('nguoi_thue', 'chu_tro', 'quan_tri_vien') DEFAULT 'nguoi_thue'")
    private Role role;

    private Timestamp ngay_tao;
    private Timestamp ngay_cap_nhat;

    public enum Role {
        nguoi_thue,
        chu_tro,
        quan_tri_vien
    }
}
